import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { emptyDocument } from '../server/study-service.mjs';

// A separate database and process: never restart the user's preview or production.
const root = process.cwd();
await mkdir(path.join(root, '.data'), { recursive: true });
const directory = await mkdtemp(path.join(root, '.data', 'qa-study-restart-'));
const base = 'http://127.0.0.1:18107';
let server;
async function start() {
  server = spawn(process.execPath, ['server.mjs'], {
    cwd: root, windowsHide: true, stdio: 'ignore',
    env: { ...process.env, PORT: '18107', QA_TEST_MODE: '1', PORTAL_STATE_BACKEND: 'local',
      PORTAL_DB_PATH: path.join(directory, 'portal-db.json'), CAJA_ORDERS_PATH: path.join(directory, 'orders.json') }
  });
  for (let i = 0; i < 100; i++) {
    assert.equal(server.exitCode, null, 'Isolated server must start');
    try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Isolated server did not become ready');
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const exited = once(server, 'exit'); server.kill(); await exited;
}
async function api(route, body, token) {
  const response = await fetch(base + '/api' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return { status: response.status, data: await response.json() };
}
async function login(email) {
  const response = await api('/auth/qa-session', { email, name: 'Prueba de persistencia', role: 'student', accessMode: 'student' });
  assert.ok(response.data.user?.sessionToken); return response.data.user.sessionToken;
}
const report = { ok: false, checks: [] };
try {
  // Refuse an occupied port rather than accidentally exercising another service.
  let occupied = false;
  try { await fetch(base + '/api/health'); occupied = true; } catch {}
  assert.equal(occupied, false, 'Port 18107 must be free');
  await start();
  const email = 'restart-check@alumnos.ucn.cl', token = await login(email);
  const document = emptyDocument();
  document.study.events.push({ id: 'restart-event', title: 'Actividad persistente', date: '2026-10-15', time: '', duration: 0, type: 'Estudio', plan: 'planP', course: 'P-0101', done: false, calendar: false });
  const saved = await api('/study/save', { revision: 0, document }, token);
  assert.equal(saved.status, 200);
  const before = (await api('/study', undefined, token)).data;
  await stop(); await start();
  const renewed = await login(email);
  const restored = (await api('/study', undefined, renewed)).data;
  assert.deepEqual(restored.document, before.document);
  assert.equal(restored.revision, before.revision);
  assert.equal((await api('/study/save', { revision: 0, document }, renewed)).status, 409);
  const other = await login('restart-other@alumnos.ucn.cl');
  assert.equal((await api('/study', undefined, other)).data.document.study.events.length, 0);
  assert.equal((await api('/study')).status, 401);
  assert.ok(!JSON.stringify((await api('/bootstrap')).data).includes('Actividad persistente'));
  report.ok = true;
  report.checks = ['document and revision survive process restart', 'stale writes rejected after restart', 'accounts remain isolated', 'anonymous reads denied', 'public bootstrap excludes private agenda'];
} finally {
  await stop();
  await mkdir(path.join(root, 'qa-screenshots'), { recursive: true });
  await writeFile(path.join(root, 'qa-screenshots/qa-study-persistence.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
