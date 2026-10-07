import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createStudyService, emptyDocument, eventPayload } from '../server/study-service.mjs';

const event = (id, title = 'Certamen de prueba') => ({ id, title, date: '2026-10-15', time: '10:00', duration: 60, type: 'Evaluación', plan: 'planP', course: 'P-0101', done: false, calendar: true });
const db = { data: {}, curricula: {} }, remote = new Map();
let email = 'qa-a@example.test', etag = 0, calendars = 0, oauthUrl, loseInsertResponse = false, rejectAuthorization = false;
const httpError = code => Object.assign(new Error('Upstream test error'), { code });
const oauth = {
  setCredentials() {}, on() {},
  generateAuthUrl(args) { oauthUrl = args; return 'https://accounts.google.com/test'; },
  async getToken(args) { assert.ok(args.codeVerifier); return { tokens: { refresh_token: 'test-only', id_token: 'test-only', scope: 'openid email https://www.googleapis.com/auth/calendar.app.created' } }; },
  async verifyIdToken() { return { getPayload: () => ({ email, email_verified: true }) }; },
  async request({ method = 'GET', url, data, headers }) {
    if (rejectAuthorization) throw Object.assign(httpError(400), { response: { status: 400, data: { error: 'invalid_grant' } } });
    if (url.endsWith('/calendars') && method === 'POST') return { data: { id: `calendar-${++calendars}` } };
    const id = url.split('/').at(-1);
    if (method === 'POST') { if (remote.has(data.id)) throw httpError(409); const item = { ...structuredClone(data), etag: `"${++etag}"` }; remote.set(data.id, item); if (loseInsertResponse) { loseInsertResponse = false; throw httpError(503); } return { data: item }; }
    const item = remote.get(id); if (!item) throw httpError(404);
    if (method === 'GET') return { data: structuredClone(item) };
    if (headers['If-Match'] !== item.etag) throw httpError(412);
    if (method === 'DELETE') { remote.delete(id); return { data: {} }; }
    const next = { ...item, ...structuredClone(data), etag: `"${++etag}"` }; remote.set(id, next); return { data: next };
  }
};
const service = createStudyService({
  config: () => ({ clientId: 'test', secret: 'test', redirect: 'http://localhost/callback', encryptionReady: true, returnUrl: 'http://localhost/' }),
  oauth: () => oauth, encrypt: v => structuredClone(v), decrypt: v => v,
  session: req => { if (!req.email) throw Object.assign(new Error('Sign in'), { statusCode: 401 }); return { email: req.email }; },
  body: async req => req.body || {}, write: async () => {},
  json: (res, status, data) => Object.assign(res, { status, data: structuredClone(data) }),
  redirect: (res, location) => Object.assign(res, { status: 302, location })
});
async function call(path = '', body, identity = email, method = body === undefined ? 'GET' : 'POST') {
  const res = {}; await service({ method, body, email: identity }, res, new URL(`http://localhost/api/study${path}`), db); return res;
}
assert.equal((await call('', undefined, null)).status, 401);
const doc = emptyDocument(); doc.study.events.push(event('one'));
assert.equal((await call('/save', { revision: 0, document: doc })).status, 200);
assert.equal((await call('/save', { revision: 0, document: emptyDocument() })).status, 409);
assert.equal((await call('', undefined, 'qa-b@example.test')).data.document.study.events.length, 0);
await call('/calendar/start', {});
const state = oauthUrl.state;
assert.equal(oauthUrl.code_challenge_method, 'S256');
assert.ok(!oauthUrl.scope.includes('https://www.googleapis.com/auth/calendar'));
assert.match((await call(`/calendar/callback?state=${state}&code=test`)).location, /connected/);
assert.match((await call(`/calendar/callback?state=${state}&code=test`)).location, /error/);
assert.equal(calendars, 1);
await call('/calendar/sync', {}); await call('/calendar/sync', {});
assert.equal(remote.size, 1, 'Retries must not duplicate events');
assert.equal([...remote.values()][0].start.timeZone, 'America/Santiago');
let current = (await call()).data; current.document.study.events[0].date = '2026-10-16';
await call('/save', { revision: current.revision, document: current.document }); await call('/calendar/sync', {});
assert.match([...remote.values()][0].start.dateTime, /2026-10-16/);
current = (await call()).data; current.document.study.events[0].title = 'Cambio con permiso vencido';
await call('/save', { revision: current.revision, document: current.document });
rejectAuthorization = true;
assert.equal((await call('/calendar/sync', {})).data.calendar.needsReconnect, true);
rejectAuthorization = false;
await call('/calendar/start', {});
await call(`/calendar/callback?state=${oauthUrl.state}&code=test`);
assert.equal((await call('/calendar/sync', {})).data.calendar.needsReconnect, false);
assert.equal(calendars, 1, 'Reauthorization must reuse the dedicated calendar');
assert.equal(remote.size, 1, 'Reauthorization must reuse the existing event');
const upstream = [...remote.values()][0]; upstream.summary = 'Changed in Google'; upstream.etag = 'external';
current = (await call()).data; current.document.study.events[0].title = 'Changed in portal';
await call('/save', { revision: current.revision, document: current.document });
const conflicted = await call('/calendar/sync', {});
assert.deepEqual(conflicted.data.calendar.conflicts, ['one']);
assert.equal([...remote.values()][0].summary, 'Changed in Google');
await call('/calendar/detach', { id: 'one' }); await call('/calendar/sync', {});
assert.equal([...remote.values()][0].summary, 'Changed in Google');
current = (await call()).data; current.document.study.events.push(event('two'));
await call('/save', { revision: current.revision, document: current.document }); await call('/calendar/sync', {});
assert.equal(remote.size, 2);
current = (await call()).data; current.document.study.events = current.document.study.events.filter(e => e.id !== 'two');
await call('/save', { revision: current.revision, document: current.document }); await call('/calendar/sync', {});
assert.equal(remote.size, 1, 'Deleting portal event removes only its unchanged mapped event');
current = (await call()).data; current.document.study.events.push(event('uncertain'));
await call('/save', { revision: current.revision, document: current.document });
loseInsertResponse = true;
await call('/calendar/sync', {});
const afterUncertain = remote.size;
await call('/calendar/sync', {});
assert.equal(remote.size, afterUncertain, 'Lost insert response must reconcile by ID without duplication');
const uncertainId = [...remote.keys()].find(id => remote.get(id).extendedProperties.private.ceicStudyId !== upstream.extendedProperties.private.ceicStudyId);
remote.delete(uncertainId);
current = (await call()).data; current.document.study.events.find(e => e.id === 'uncertain').title = 'Update after external removal';
await call('/save', { revision: current.revision, document: current.document });
assert.ok((await call('/calendar/sync', {})).data.calendar.conflicts.includes('uncertain'));
assert.equal(remote.size, 1, 'An externally deleted event must never be silently recreated');
await call('/calendar/disconnect', {}); await call('/calendar/sync', {});
assert.equal(remote.size, 1, 'Disconnect preserves Google events');
assert.equal((await call()).data.calendar.connected, false);
const allDay = eventPayload({ ...event('d'), time: '', date: '2026-12-31' });
assert.deepEqual(allDay.end, { date: '2027-01-01' });
const midnight = eventPayload({ ...event('n'), time: '23:30', date: '2026-12-31' });
assert.equal(midnight.end.dateTime, '2027-01-01T00:30:00');
const invalid = emptyDocument(); invalid.study.events.push({ ...event('x'), duration: -1 });
assert.equal((await call('/save', { revision: (await call()).data.revision, document: invalid })).status, 422);
console.log('Study service: isolation, revisions, OAuth/PKCE, replay, idempotency, updates, conflicts, deletion, disconnect and date boundaries passed.');

const base = process.env.STUDY_QA_URL || 'http://127.0.0.1:8105';
const api = async (path, body, token) => {
  const response = await fetch(base + '/api' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, data: await response.json() };
};
const unique = Date.now();
const user = (await api('/auth/qa-session', { email: `study-${unique}@alumnos.ucn.cl`, name: 'Estudiante de prueba', role: 'student', accessMode: 'student' })).data.user;
assert.ok(user?.sessionToken, 'Run against isolated QA_TEST_MODE server');
assert.equal((await api('/study')).status, 401);
const browser = await chromium.launch({ headless: true });
try {
  const legacyContext = await browser.newContext();
  await legacyContext.addInitScript(user => {
    localStorage.setItem('portal.session', JSON.stringify({ ...user, studyAccount: true }));
    localStorage.setItem('portal.studyTools.v1', JSON.stringify({ version: 1, revision: 1, events: [], grades: { 'planP:P-0101': { goal: 4, rows: [{ id: 'old', name: 'Anterior', weight: 100, grade: 5 }] } } }));
  }, user);
  const legacyPage = await legacyContext.newPage();
  await legacyPage.goto(base + '/?analytics=off#/mi-semana');
  await legacyPage.getByRole('heading', { name: 'Tu agenda, contigo' }).waitFor();
  assert.equal(await legacyPage.locator('[data-study-account-action=import]').count(), 0, 'Retired-only data does not offer an empty activity migration');
  assert.equal(await legacyPage.evaluate(() => JSON.parse(localStorage.getItem('portal.studyTools.v1')).grades['planP:P-0101'].rows[0].grade), 5, 'Legacy backup data is preserved');
  await legacyContext.close();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.goto(base + '/?analytics=off#/mi-semana?plan=planP&course=P-0101');
  await page.locator('[data-study-event-form]').waitFor();
  assert.equal(await page.locator('[name=course]').inputValue(), 'P-0101');
  await page.locator('[name=title]').fill('Agenda previa del navegador');
  await page.locator('[data-study-event-form] button[type=submit]').click();
  await page.evaluate(user => localStorage.setItem('portal.session', JSON.stringify({ ...user, studyAccount: true })), user);
  await page.reload();
  await page.getByText('¿Estas actividades también son tuyas?').waitFor();
  assert.equal(await page.locator('.study-entry').filter({ hasText: 'Agenda previa del navegador' }).count(), 0, 'Guest data is not automatically claimed');
  await page.locator('[data-study-account-action=import]').click();
  await page.waitForFunction(() => window.PortalStudyAccount.status().dirty === false);
  assert.equal((await api('/study', undefined, user.sessionToken)).data.document.study.events.length, 1);
  // Pending writes survive offline use and retry without claiming a successful account save.
  await page.route('**/api/study/save', route => route.abort());
  await page.locator('[name=title]').fill('Actividad sin conexión');
  await page.locator('[data-study-event-form] button[type=submit]').click();
  await page.getByText('Tus cambios siguen en este dispositivo. No se pudo completar el guardado en tu cuenta.').waitFor();
  await page.unroute('**/api/study/save');
  await page.locator('[data-study-account-action=retry]').click();
  await page.waitForFunction(() => !window.PortalStudyAccount.status().dirty);
  assert.equal((await api('/study', undefined, user.sessionToken)).data.document.study.events.length, 2);
  await page.getByText('Copias y recuperación', { exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-study-account-action=download]').click();
  const backupPath = await (await downloaded).path();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Recuperar una copia', exact: true }).click();
  const chooser = await picker;
  // A status redraw while the native picker is open must not detach the file input.
  await page.evaluate(() => window.PortalStudyAccount.flush());
  await chooser.setFiles(backupPath);
  await page.getByRole('button', { name: 'Recuperar copia', exact: true }).click();
  await page.waitForFunction(() => !window.PortalStudyAccount.status().dirty);
  assert.equal((await api('/study', undefined, user.sessionToken)).data.document.study.events.length, 2, 'Restoring same backup must not duplicate records');
  const cancelPicker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Recuperar una copia', exact: true }).click();
  await cancelPicker;
  await page.locator('[data-study-restore]').dispatchEvent('cancel');
  assert.equal(await page.getByRole('button', { name: 'Recuperar una copia', exact: true }).isEnabled(), true, 'Cancelling the picker releases the panel');
  await page.goto(base + '/?analytics=off#/mi-semana');
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx2.addInitScript(user => localStorage.setItem('portal.session', JSON.stringify({ ...user, studyAccount: true })), user);
  const second = await ctx2.newPage(); await second.goto(base + '/?analytics=off#/mi-semana');
  await second.locator('.study-entry').filter({ hasText: 'Agenda previa del navegador' }).waitFor();
  await page.locator('[name=title]').fill('Cambio del primer dispositivo');
  await page.locator('[data-study-event-form] button[type=submit]').click();
  await page.waitForFunction(() => !window.PortalStudyAccount.status().dirty);
  await second.locator('[name=title]').fill('Cambio del segundo dispositivo');
  await second.locator('[data-study-event-form] button[type=submit]').click();
  await second.getByText('Elige la versión que quieres continuar').waitFor();
  await second.locator('[data-study-account-action=remote]').click();
  await second.locator('.study-entry').filter({ hasText: 'Cambio del primer dispositivo' }).waitFor();
  // All private collections must remain outside public bootstrap, including after account writes.
  const bootstrap = await api('/bootstrap');
  assert.equal('studyAccounts' in bootstrap.data.data, false);
  assert.ok(!JSON.stringify(bootstrap.data).includes('Agenda previa del navegador'));
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
    await page.screenshot({ path: `qa-screenshots/study-account-${width}.png`, fullPage: true });
    if (width === 1440) await page.screenshot({ path: 'qa-screenshots/study-preview-1440.png' });
  }
  await page.locator('[data-study-account-action=logout]').click();
  await page.getByRole('heading', { name: 'Guarda tu avance' }).waitFor();
  assert.equal(await page.locator('.study-entry').filter({ hasText: 'Cambio del primer dispositivo' }).count(), 0);
  assert.equal(await page.locator('.study-entry').filter({ hasText: 'Agenda previa del navegador' }).count(), 1, 'Guest originals preserved');
  const userB = (await api('/auth/qa-session', { email: `study-b-${unique}@alumnos.ucn.cl`, name: 'Otra cuenta de prueba', role: 'student', accessMode: 'student' })).data.user;
  await page.evaluate(user => localStorage.setItem('portal.session', JSON.stringify({ ...user, studyAccount: true })), userB);
  await page.reload();
  await page.getByText('¿Estas actividades también son tuyas?').waitFor();
  await page.locator('[data-study-account-action=skip]').click();
  assert.equal(await page.locator('.study-entry').filter({ hasText: 'Actividad sin conexión' }).count(), 0);
  assert.equal((await api('/study', undefined, userB.sessionToken)).data.document.study.events.length, 0);
  // Revoking the session must remove private account views, not expose cached A or B data as guest.
  await api('/auth/logout', {}, userB.sessionToken);
  await page.reload();
  await page.getByRole('heading', { name: 'Guarda tu avance' }).waitFor();
  assert.equal(await page.locator('.study-entry').filter({ hasText: 'Actividad sin conexión' }).count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close(); await ctx2.close();
  console.log('Browser: guest, preset, migration, offline/retry, backup/restore, second device, conflict, logout, account switch, session revocation, privacy and 320/390/1440 passed.');
  // Exercise the actual Calendar UI with the tested service and a controlled Google provider.
  // Portal authentication is real QA authentication; no calls are made to a Google account.
  const calendarUser = (await api('/auth/qa-session', { email: `calendar-${unique}@alumnos.ucn.cl`, name: 'Cuenta Calendar de prueba', role: 'student', accessMode: 'student' })).data.user;
  email = calendarUser.email;
  await call('/calendar/start', {});
  await call(`/calendar/callback?state=${oauthUrl.state}&code=test`);
  const calCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await calCtx.addInitScript(user => localStorage.setItem('portal.session', JSON.stringify({ ...user, studyAccount: true })), calendarUser);
  const calPage = await calCtx.newPage(); calPage.on('dialog', d => d.accept());
  calPage.on('pageerror', e => errors.push(e.message));
  await calPage.route('**/api/study**', async route => {
    const req = route.request(), path = new URL(req.url());
    const result = await call(path.pathname.replace('/api/study', '') + path.search, req.postData() ? JSON.parse(req.postData()) : undefined, email, req.method());
    await route.fulfill({ status: result.status, contentType: 'application/json', body: JSON.stringify(result.data) });
  });
  await calPage.goto(base + '/?analytics=off#/mi-semana');
  await calPage.getByText('Google Calendar · Conectado', { exact: true }).waitFor();
  await calPage.locator('[name=title]').fill('Entrega para Calendar');
  await calPage.getByText('Duración y calendario', { exact: true }).click();
  await calPage.locator('[name=calendar]').check();
  await calPage.locator('[data-study-event-form] button[type=submit]').click();
  await calPage.waitForFunction(() => !window.PortalStudyAccount.status().dirty);
  await calPage.getByText('Google Calendar · Conectado', { exact: true }).click();
  let remoteEvent = [...remote.values()].find(e => e.summary === 'Entrega para Calendar');
  assert.ok(remoteEvent, 'Selected event reaches controlled Google Calendar');
  const calendarsBeforeReconnect = calendars;
  rejectAuthorization = true;
  await calPage.locator('.study-entry [data-study-edit]').first().click();
  await calPage.locator('[name=title]').fill('Entrega con permiso por renovar');
  await calPage.locator('[data-study-event-form] button[type=submit]').click();
  await calPage.getByRole('button', { name: 'Volver a conectar', exact: true }).waitFor();
  await calPage.route('https://accounts.google.com/test', async route => {
    rejectAuthorization = false;
    await call(`/calendar/callback?state=${oauthUrl.state}&code=test`);
    await route.fulfill({ status: 302, headers: { location: base + '/?analytics=off#/mi-semana?calendar=connected' } });
  });
  await calPage.getByRole('button', { name: 'Volver a conectar', exact: true }).click();
  await calPage.waitForURL(/calendar=connected/);
  await calPage.getByText('Google Calendar · Conectado', { exact: true }).waitFor();
  await calPage.waitForFunction(() => window.PortalStudyAccount.status().connected);
  assert.equal(calendars, calendarsBeforeReconnect, 'UI reauthorization must not create another calendar');
  remoteEvent = [...remote.values()].find(e => e.summary === 'Entrega con permiso por renovar');
  assert.ok(remoteEvent, 'Pending update is sent after reauthorization');
  remoteEvent.summary = 'Cambio externo que debemos conservar'; remoteEvent.etag = 'new-google-edit';
  await calPage.locator('.study-entry [data-study-edit]').first().click();
  await calPage.locator('[name=title]').fill('Cambio desde la agenda');
  await calPage.locator('[data-study-event-form] button[type=submit]').click();
  await calPage.locator('[data-study-calendar-detach]').waitFor();
  await calPage.locator('[data-study-calendar-detach]').click();
  assert.equal(remoteEvent.summary, 'Cambio externo que debemos conservar');
  await calPage.locator('[data-study-account-action=disconnect]').click();
  await calPage.locator('[data-study-account-action=connect]').waitFor();
  assert.equal(await calPage.locator('.study-entry').filter({ hasText: 'Cambio desde la agenda' }).count(), 1);
  assert.deepEqual(errors, []);
  await calCtx.close();
  console.log('Calendar UI: explicit event selection, send, expired permission, reauthorization, external-change protection, detach and disconnect passed with controlled provider.');
} finally { await browser.close(); }
