import { spawn } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = Number(process.env.SECURITY_QA_PORT || 18081);
const baseUrl = `http://127.0.0.1:${port}`;
const dbPath = path.join(root, '.data', 'qa-security-capacity-db.json');
const report = { ok: false, assertions: 0, concurrency: {}, checks: [] };

function assert(condition, message) {
  report.assertions += 1;
  if (!condition) throw new Error(message);
  report.checks.push(message);
}

async function request(route, { method = 'GET', token = '', watcherToken = '', body } = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(watcherToken ? { 'x-calendar-watcher-token': watcherToken } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload, headers: response.headers, elapsedMs: performance.now() - started };
}

async function waitForHealth() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const result = await request('/api/health');
      if (result.status === 200) return result;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('security QA server did not become healthy');
}

async function qaSession(profile) {
  const result = await request('/api/auth/qa-session', { method: 'POST', body: profile });
  assert(result.status === 200 && Boolean(result.payload?.user?.sessionToken), `QA session created for ${profile.role}`);
  return result.payload.user;
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function nextOfficeSlot(profile) {
  const officeHours = profile.officeHours || [];
  const settings = profile.bookingSettings || {};
  const slotMinutes = Number(settings.slotMinutes || 30);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const dayNames = { domingo: 'sunday', lunes: 'monday', martes: 'tuesday', miercoles: 'wednesday', jueves: 'thursday', viernes: 'friday', sabado: 'saturday' };
  const noticeMs = Number(settings.minimumNoticeHours || 0) * 60 * 60 * 1000;
  const startSearch = Math.ceil((Date.now() + noticeMs + 5 * 60 * 1000) / 300_000) * 300_000;
  const endSearch = Date.now() + Number(settings.bookingWindowDays || 21) * 24 * 60 * 60 * 1000;
  for (let timestamp = startSearch; timestamp < endSearch; timestamp += 300_000) {
    const start = new Date(timestamp);
    const parts = Object.fromEntries(formatter.formatToParts(start).filter(part => part.type !== 'literal').map(part => [part.type, part.value.toLowerCase()]));
    const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
    if (settings.validFrom && dateKey < settings.validFrom) continue;
    if (settings.validUntil && dateKey > settings.validUntil) continue;
    const minutes = Number(parts.hour) * 60 + Number(parts.minute);
    const match = officeHours.find(item => {
      const [from, to] = item.start && item.end ? [item.start, item.end] : String(item.time || '').split('-').map(value => value.trim());
      const [fromHour, fromMinute] = from.split(':').map(Number);
      const [toHour, toMinute] = to.split(':').map(Number);
      const fromMinutes = fromHour * 60 + fromMinute;
      return parts.weekday === dayNames[normalize(item.day)]
        && minutes >= fromMinutes
        && (minutes - fromMinutes) % slotMinutes === 0
        && minutes + slotMinutes <= toHour * 60 + toMinute;
    });
    if (match) return { start: start.toISOString(), end: new Date(timestamp + slotMinutes * 60_000).toISOString() };
  }
  throw new Error('could not derive a valid office-hour slot');
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentileValue))];
}

async function main() {
  rmSync(dbPath, { force: true });
  const server = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      PORTAL_DB_PATH: dbPath,
      PORTAL_STATE_BACKEND: 'local',
      PORTAL_MAX_SESSIONS: '1200',
      PORTAL_APPOINTMENTS_ENABLED: '1',
      CALENDAR_WATCHER_TOKEN: 'qa-calendar-watcher-token',
      QA_TEST_MODE: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  server.stdout.on('data', chunk => process.stdout.write(`[server] ${chunk}`));
  server.stderr.on('data', chunk => process.stderr.write(`[server] ${chunk}`));

  try {
    const health = await waitForHealth();
    assert(JSON.stringify(health.payload) === '{"ok":true}', 'health response excludes operational metadata');
    assert(health.headers.get('x-content-type-options') === 'nosniff', 'API responses prevent MIME sniffing');
    assert(health.headers.get('cache-control') === 'no-store', 'API responses are not cached');
    const allowedCors = await fetch(`${baseUrl}/api/health`, { headers: { origin: 'https://ceicucn.cl' } });
    const blockedCors = await fetch(`${baseUrl}/api/health`, { headers: { origin: 'https://example.invalid' } });
    assert(allowedCors.headers.get('access-control-allow-origin') === 'https://ceicucn.cl', 'production portal origin is allowed by CORS');
    assert(!blockedCors.headers.get('access-control-allow-origin'), 'unknown origins are not granted CORS access');

    const indexResponse = await fetch(`${baseUrl}/`);
    assert(Boolean(indexResponse.headers.get('content-security-policy')), 'static responses include a content security policy');
    assert(indexResponse.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'static responses use a restrictive referrer policy');
    const mediaRange = await fetch(`${baseUrl}/tutoriales/media/solicitar-hora-narrado.mp4`, { headers: { range: 'bytes=1024-2047' } });
    assert(mediaRange.status === 206 && mediaRange.headers.get('accept-ranges') === 'bytes', 'tutorial media supports byte-range seeking');
    assert((await mediaRange.arrayBuffer()).byteLength === 1024, 'tutorial media returns only the requested byte range');

    const bootstrap = await request('/api/bootstrap');
    assert(bootstrap.status === 200, 'public bootstrap remains available');
    assert(bootstrap.headers.get('content-encoding') === 'gzip', 'public bootstrap is compressed');
    assert(/public/.test(bootstrap.headers.get('cache-control') || ''), 'public bootstrap can be shared briefly by caches');
    const bootstrapNotModified = await fetch(`${baseUrl}/api/bootstrap`, { headers: { 'if-none-match': bootstrap.headers.get('etag') || '' } });
    assert(bootstrapNotModified.status === 304, 'public bootstrap supports conditional requests');
    const publicText = JSON.stringify(bootstrap.payload);
    for (const forbidden of ['sessionToken', 'passwordHash', 'passwordSalt', 'bookingAvailability', 'appointments', 'reservations', 'calendarUpdateRequests', 'fileDataUrl', 'dbPath']) {
      assert(!publicText.includes(forbidden), `public bootstrap excludes ${forbidden}`);
    }
    assert(!/"rut"\s*:|"ppa"\s*:/i.test(publicText), 'public bootstrap excludes RUT and PPA');
    assert(Array.isArray(bootstrap.payload?.data?.surveys) && bootstrap.payload.data.surveys.length === 0, 'disabled surveys are absent from public data');
    assert((await request('/api/surveys')).status === 404, 'survey API is disabled');
    assert((await request('/api/reservations')).status === 404, 'table-reservation API is disabled');
    assert((await request('/api/calendar/appointments')).status === 401, 'appointments require an authenticated session');
    assert((await request('/api/calendar/verify', { method: 'POST' })).status === 401, 'Calendar verification requires Jefatura authentication');
    assert((await request('/api/tutorials/jefatura')).status === 404, 'private Jefatura web tutorial is not exposed');

    const studentA = await qaSession({ role: 'student', name: 'Estudiante A', email: 'qa.a@alumnos.ucn.cl' });
    const studentB = await qaSession({ role: 'student', name: 'Estudiante B', email: 'qa.b@alumnos.ucn.cl' });
    const ceal = await qaSession({ role: 'ceal', name: 'Equipo CEAL', email: 'kevin.cortes@alumnos.ucn.cl' });
    const jefatura = await qaSession({ role: 'jefatura', name: 'Jefatura de carrera', email: 'jc.icivil.afta@ucn.cl' });
    const disposable = await qaSession({ role: 'student', name: 'Sesión temporal', email: 'qa.session@alumnos.ucn.cl' });
    const validSession = await request('/api/auth/session', { token: disposable.sessionToken });
    assert(validSession.status === 200 && validSession.payload?.user?.role === 'student', 'valid saved session is restored from server authority');
    assert((await request('/api/auth/session', { token: 'invalid-session-token' })).status === 401, 'invalid saved session is rejected before rendering protected content');
    assert((await request('/api/calendar-updates', { token: jefatura.sessionToken })).status === 403, 'Jefatura session cannot access CEAL calendar-source management');
    assert((await request('/api/auth/logout', { method: 'POST', token: disposable.sessionToken })).status === 200, 'session can be revoked explicitly');
    assert((await request('/api/auth/session', { token: disposable.sessionToken })).status === 401, 'revoked session cannot be restored');
    const initialProfile = bootstrap.payload.data.staffProfiles[0];
    const initialConfiguration = { bookingSettings: initialProfile.bookingSettings, officeHours: initialProfile.officeHours };
    const slot = nextOfficeSlot(initialProfile);
    assert((await request('/api/ai/survey-draft', { method: 'POST', token: ceal.sessionToken, body: { rawText: 'Consulta' } })).status === 404, 'survey generation API is disabled');
    assert((await request('/api/calendar/appointments', { method: 'POST', token: jefatura.sessionToken, body: { ...slot, reason: 'Consulta interna.' } })).status === 403, 'Jefatura cannot request an appointment with itself');
    assert((await request('/api/calendar/verify', { method: 'POST', token: ceal.sessionToken })).status === 403, 'CEAL cannot verify the Jefatura Calendar connection');
    assert((await request('/api/calendar/config')).status === 401, 'booking configuration requires authentication');
    assert((await request('/api/calendar/config', { method: 'PATCH', token: studentA.sessionToken, body: initialConfiguration })).status === 403, 'students cannot change booking configuration');
    assert((await request('/api/calendar/config', { method: 'PATCH', token: ceal.sessionToken, body: initialConfiguration })).status === 403, 'CEAL cannot change booking configuration');
    assert((await request('/api/calendar/config', { token: jefatura.sessionToken })).status === 200, 'Jefatura can read booking configuration');

    const calendarFileDataUrl = `data:text/plain;base64,${Buffer.from('Calendario docente QA 2026').toString('base64')}`;
    const calendarUpload = { fileName: 'calendario-docente-qa.txt', fileDataUrl: calendarFileDataUrl, note: 'Fuente de prueba de permisos.' };
    assert((await request('/api/calendar-updates', { method: 'POST', body: calendarUpload })).status === 401, 'calendar source upload requires authentication');
    assert((await request('/api/calendar-updates', { method: 'POST', token: studentA.sessionToken, body: calendarUpload })).status === 403, 'students cannot upload calendar sources');
    const uploadedCalendar = await request('/api/calendar-updates', { method: 'POST', token: ceal.sessionToken, body: calendarUpload });
    assert(uploadedCalendar.status === 201 && !uploadedCalendar.payload?.item?.fileDataUrl, 'CEAL can upload a calendar source without receiving its data back');
    assert((await request('/api/calendar-updates', { method: 'POST', token: ceal.sessionToken, body: calendarUpload })).status === 409, 'duplicate pending calendar sources are rejected');
    const calendarList = await request('/api/calendar-updates', { token: ceal.sessionToken });
    assert(calendarList.status === 200 && calendarList.payload?.items?.length === 1 && !calendarList.payload.items[0].fileDataUrl, 'CEAL sees calendar source metadata only');
    assert((await request('/api/calendar-updates/watcher', { watcherToken: 'incorrect' })).status === 403, 'calendar inbox rejects an invalid watcher token');
    const watcherList = await request('/api/calendar-updates/watcher', { watcherToken: 'qa-calendar-watcher-token' });
    assert(watcherList.status === 200 && watcherList.payload?.items?.[0]?.id === uploadedCalendar.payload.item.id, 'calendar watcher lists pending sources with its private token');
    const downloadedCalendar = await fetch(`${baseUrl}/api/calendar-updates/${encodeURIComponent(uploadedCalendar.payload.item.id)}/file`, { headers: { 'x-calendar-watcher-token': 'qa-calendar-watcher-token' } });
    assert(downloadedCalendar.status === 200 && await downloadedCalendar.text() === 'Calendario docente QA 2026', 'calendar watcher downloads the original private file');
    const markedDownloaded = await request(`/api/calendar-updates/${encodeURIComponent(uploadedCalendar.payload.item.id)}`, { method: 'PATCH', watcherToken: 'qa-calendar-watcher-token', body: { action: 'downloaded' } });
    assert(markedDownloaded.status === 200 && markedDownloaded.payload?.item?.status === 'downloaded', 'calendar watcher marks a source as downloaded');
    const bootstrapAfterUpload = await request('/api/bootstrap');
    assert(!JSON.stringify(bootstrapAfterUpload.payload).includes('Calendario docente QA 2026'), 'uploaded calendar file content never reaches the public bootstrap');

    const [createA, createB] = await Promise.all([
      request('/api/calendar/appointments', { method: 'POST', token: studentA.sessionToken, body: { ...slot, reason: 'Consulta sobre inscripción académica.' } }),
      request('/api/calendar/appointments', { method: 'POST', token: studentB.sessionToken, body: { ...slot, reason: 'Consulta sobre inscripción académica.' } })
    ]);
    const createStatuses = [createA.status, createB.status].sort((a, b) => a - b);
    assert(createStatuses[0] === 201 && createStatuses[1] === 409, 'concurrent appointment collision accepts only one request');
    const created = createA.status === 201 ? createA.payload.item : createB.payload.item;
    const owner = createA.status === 201 ? studentA : studentB;
    const other = createA.status === 201 ? studentB : studentA;
    assert(created.status === 'confirmada', 'an available appointment is reserved immediately');

    const ownerList = await request('/api/calendar/appointments', { token: owner.sessionToken });
    const otherList = await request('/api/calendar/appointments', { token: other.sessionToken });
    assert(ownerList.payload?.scope === 'mine' && ownerList.payload.items.length === 1, 'student sees only their own appointment');
    assert(otherList.payload?.scope === 'mine' && otherList.payload.items.length === 0, 'another student cannot see the appointment');
    assert((await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: other.sessionToken, body: { action: 'cancel' } })).status === 403, 'another student cannot cancel the appointment');
    assert((await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: ceal.sessionToken, body: { action: 'confirm' } })).status === 403, 'CEAL cannot confirm Jefatura appointments');
    assert((await request('/api/calendar/availability', { method: 'PATCH', token: ceal.sessionToken, body: { slotKey: `${slot.start}|${slot.end}`, closed: true } })).status === 403, 'CEAL cannot change Jefatura availability');

    const staffList = await request('/api/calendar/appointments', { token: jefatura.sessionToken });
    assert(staffList.payload?.scope === 'all' && staffList.payload.items.length === 1, 'Jefatura can review all reserved appointments');
    const manualConfirmation = await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: jefatura.sessionToken, body: { action: 'confirm' } });
    assert(manualConfirmation.status === 422, 'manual appointment confirmation is disabled');
    const cancelled = await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: jefatura.sessionToken, body: { action: 'cancel' } });
    assert(cancelled.status === 200 && cancelled.payload?.item?.status === 'cancelada', 'Jefatura can cancel a reserved appointment');
    assert(cancelled.payload?.item?.studentEmail === owner.email, 'Jefatura cancellation targets the appointment owner');
    const cancelledSlotKey = `${created.start}|${created.end}`;
    assert(cancelled.payload?.availability?.closedSlots?.includes(cancelledSlotKey), 'Jefatura cancellation closes the exact appointment slot');
    const cancelledSlotRetry = await request('/api/calendar/appointments', { method: 'POST', token: other.sessionToken, body: { ...slot, reason: 'Intento sobre horario cancelado por Jefatura.' } });
    assert(cancelledSlotRetry.status === 409, 'a slot cancelled by Jefatura cannot be booked by another student');
    const reopened = await request('/api/calendar/availability', { method: 'PATCH', token: jefatura.sessionToken, body: { slotKey: cancelledSlotKey, closed: false } });
    assert(reopened.status === 200 && !reopened.payload?.availability?.closedSlots?.includes(cancelledSlotKey), 'Jefatura can reopen a slot it previously closed');

    const fifteenMinuteConfiguration = {
      bookingSettings: { ...initialProfile.bookingSettings, slotMinutes: 15 },
      officeHours: initialProfile.officeHours
    };
    const updatedConfiguration = await request('/api/calendar/config', { method: 'PATCH', token: jefatura.sessionToken, body: fifteenMinuteConfiguration });
    assert(updatedConfiguration.status === 200 && updatedConfiguration.payload?.profile?.bookingSettings?.slotMinutes === 15, 'Jefatura can change appointment duration');
    const fifteenMinuteSlot = nextOfficeSlot(updatedConfiguration.payload.profile);
    const invalidThirtyMinuteSlot = { start: fifteenMinuteSlot.start, end: new Date(new Date(fifteenMinuteSlot.start).getTime() + 30 * 60_000).toISOString() };
    assert((await request('/api/calendar/appointments', { method: 'POST', token: other.sessionToken, body: { ...invalidThirtyMinuteSlot, reason: 'Duración antigua.' } })).status === 422, 'appointments reject a duration that Jefatura no longer publishes');
    const fifteenMinuteBooking = await request('/api/calendar/appointments', { method: 'POST', token: other.sessionToken, body: { ...fifteenMinuteSlot, reason: 'Consulta en bloque configurable.' } });
    assert(fifteenMinuteBooking.status === 201, 'appointments accept the duration configured by Jefatura');

    const sessionBatch = await Promise.all(Array.from({ length: 300 }, (_, index) => request('/api/auth/qa-session', {
      method: 'POST',
      body: { role: 'student', name: `Carga ${index + 1}`, email: `carga.${index + 1}@alumnos.ucn.cl` }
    })));
    assert(sessionBatch.every(item => item.status === 200), '300 concurrent session creations complete without errors');

    const readBatch = await Promise.all(Array.from({ length: 300 }, () => request('/api/bootstrap')));
    const readLatencies = readBatch.map(item => item.elapsedMs);
    assert(readBatch.every(item => item.status === 200), '300 concurrent bootstrap reads complete without errors');
    report.concurrency = {
      users: 300,
      sessionErrors: sessionBatch.filter(item => item.status !== 200).length,
      readErrors: readBatch.filter(item => item.status !== 200).length,
      bootstrapP50Ms: Math.round(percentile(readLatencies, 0.50)),
      bootstrapP95Ms: Math.round(percentile(readLatencies, 0.95)),
      bootstrapMaxMs: Math.round(Math.max(...readLatencies))
    };

    const persisted = JSON.parse(readFileSync(dbPath, 'utf8'));
    const sessions = persisted.data?.sessions || [];
    assert(sessions.length >= 304, 'session store retains capacity above 300 active users');
    assert(sessions.length <= 1200, 'session store respects the configured upper bound');
    assert(sessions.every(item => item.tokenHash && !item.sessionToken), 'persisted sessions contain hashes, not raw tokens');

    report.ok = true;
    console.log(JSON.stringify(report, null, 2));
  } finally {
    server.kill();
  }
}

main().catch(error => {
  report.error = error.message || String(error);
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
