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

async function request(route, { method = 'GET', token = '', body } = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {})
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
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const dayNames = { martes: 'tuesday', jueves: 'thursday' };
  const startSearch = Math.ceil((Date.now() + 2 * 60 * 60 * 1000) / 1_800_000) * 1_800_000;
  const endSearch = Date.now() + 20 * 24 * 60 * 60 * 1000;
  for (let timestamp = startSearch; timestamp < endSearch; timestamp += 1_800_000) {
    const start = new Date(timestamp);
    const parts = Object.fromEntries(formatter.formatToParts(start).filter(part => part.type !== 'literal').map(part => [part.type, part.value.toLowerCase()]));
    const minutes = Number(parts.hour) * 60 + Number(parts.minute);
    const match = officeHours.find(item => {
      const [from, to] = String(item.time || '').split('-').map(value => value.trim());
      const [fromHour, fromMinute] = from.split(':').map(Number);
      const [toHour, toMinute] = to.split(':').map(Number);
      return parts.weekday === dayNames[normalize(item.day)]
        && minutes >= fromHour * 60 + fromMinute
        && minutes + 30 <= toHour * 60 + toMinute;
    });
    if (match) return { start: start.toISOString(), end: new Date(timestamp + 1_800_000).toISOString() };
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

    const bootstrap = await request('/api/bootstrap');
    assert(bootstrap.status === 200, 'public bootstrap remains available');
    assert(bootstrap.headers.get('content-encoding') === 'gzip', 'public bootstrap is compressed');
    assert(/public/.test(bootstrap.headers.get('cache-control') || ''), 'public bootstrap can be shared briefly by caches');
    const bootstrapNotModified = await fetch(`${baseUrl}/api/bootstrap`, { headers: { 'if-none-match': bootstrap.headers.get('etag') || '' } });
    assert(bootstrapNotModified.status === 304, 'public bootstrap supports conditional requests');
    const publicText = JSON.stringify(bootstrap.payload);
    for (const forbidden of ['sessionToken', 'passwordHash', 'passwordSalt', 'bookingAvailability', 'appointments', 'reservations', 'dbPath']) {
      assert(!publicText.includes(forbidden), `public bootstrap excludes ${forbidden}`);
    }
    assert(!/"rut"\s*:|"ppa"\s*:/i.test(publicText), 'public bootstrap excludes RUT and PPA');
    assert(Array.isArray(bootstrap.payload?.data?.surveys) && bootstrap.payload.data.surveys.length === 0, 'disabled surveys are absent from public data');
    assert((await request('/api/surveys')).status === 404, 'survey API is disabled');
    assert((await request('/api/reservations')).status === 404, 'table-reservation API is disabled');
    assert((await request('/api/calendar/appointments')).status === 401, 'appointments require an authenticated session');

    const studentA = await qaSession({ role: 'student', name: 'Estudiante A', email: 'qa.a@alumnos.ucn.cl' });
    const studentB = await qaSession({ role: 'student', name: 'Estudiante B', email: 'qa.b@alumnos.ucn.cl' });
    const ceal = await qaSession({ role: 'ceal', name: 'Equipo CEAL', email: 'qa.ceal@alumnos.ucn.cl' });
    const jefatura = await qaSession({ role: 'jefatura', name: 'Jefatura de carrera', email: 'jc.icivil.afta@ucn.cl' });
    const slot = nextOfficeSlot(bootstrap.payload.data.staffProfiles[0]);
    assert((await request('/api/ai/survey-draft', { method: 'POST', token: ceal.sessionToken, body: { rawText: 'Consulta' } })).status === 404, 'survey generation API is disabled');
    assert((await request('/api/calendar/appointments', { method: 'POST', token: jefatura.sessionToken, body: { ...slot, reason: 'Consulta interna.' } })).status === 403, 'Jefatura cannot request an appointment with itself');

    const [createA, createB] = await Promise.all([
      request('/api/calendar/appointments', { method: 'POST', token: studentA.sessionToken, body: { ...slot, reason: 'Consulta sobre inscripción académica.' } }),
      request('/api/calendar/appointments', { method: 'POST', token: studentB.sessionToken, body: { ...slot, reason: 'Consulta sobre inscripción académica.' } })
    ]);
    const createStatuses = [createA.status, createB.status].sort((a, b) => a - b);
    assert(createStatuses[0] === 201 && createStatuses[1] === 409, 'concurrent appointment collision accepts only one request');
    const created = createA.status === 201 ? createA.payload.item : createB.payload.item;
    const owner = createA.status === 201 ? studentA : studentB;
    const other = createA.status === 201 ? studentB : studentA;

    const ownerList = await request('/api/calendar/appointments', { token: owner.sessionToken });
    const otherList = await request('/api/calendar/appointments', { token: other.sessionToken });
    assert(ownerList.payload?.scope === 'mine' && ownerList.payload.items.length === 1, 'student sees only their own appointment');
    assert(otherList.payload?.scope === 'mine' && otherList.payload.items.length === 0, 'another student cannot see the appointment');
    assert((await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: other.sessionToken, body: { action: 'cancel' } })).status === 403, 'another student cannot cancel the appointment');
    assert((await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: ceal.sessionToken, body: { action: 'confirm' } })).status === 403, 'CEAL cannot confirm Jefatura appointments');
    assert((await request('/api/calendar/availability', { method: 'PATCH', token: ceal.sessionToken, body: { slotKey: `${slot.start}|${slot.end}`, closed: true } })).status === 403, 'CEAL cannot change Jefatura availability');

    const staffList = await request('/api/calendar/appointments', { token: jefatura.sessionToken });
    assert(staffList.payload?.scope === 'all' && staffList.payload.items.length === 1, 'Jefatura can review all appointment requests');
    const confirmed = await request(`/api/calendar/appointments/${created.id}`, { method: 'PATCH', token: jefatura.sessionToken, body: { action: 'confirm' } });
    assert(confirmed.status === 200 && confirmed.payload?.item?.status === 'confirmada', 'Jefatura can confirm a pending appointment');

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
