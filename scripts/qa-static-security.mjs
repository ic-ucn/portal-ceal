import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Synthetic files only: never request or print the contents of real secrets.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(path.join(root, '.data'), { recursive: true });
const directory = await mkdtemp(path.join(root, '.data', 'qa-static-security-'));
const publicDirectory = await mkdtemp(path.join(root, 'assets', 'qa-static-security-'));
const fixture = '{"privateFixture":"must-not-be-served"}';
await writeFile(path.join(directory, 'private.json'), fixture);
await writeFile(path.join(publicDirectory, 'public.json'), '{"publicFixture":true}');
await writeFile(path.join(publicDirectory, '.env'), fixture);
const probe = net.createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const isolatedEnv = { ...process.env, PORT: String(port), QA_TEST_MODE: '1', CEAL_MAIL_TEST_MODE: '1',
  PORTAL_STATE_BACKEND: 'local', PORTAL_VOTE_SALT: 'isolated-static-security-fixture', WEBPAY_ENV: 'integration',
  PORTAL_DB_PATH: path.join(directory, 'portal-db.json'), CAJA_ORDERS_PATH: path.join(directory, 'orders.json') };
// Empty values also prevent server.mjs from loading provider credentials from .env.
for (const name of ['GEMINI_API_KEY', 'CEAL_MAIL_USER', 'CEAL_MAIL_APP_PASSWORD', 'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET',
  'GOOGLE_CALENDAR_REDIRECT_URI', 'STUDY_CALENDAR_CLIENT_ID', 'STUDY_CALENDAR_CLIENT_SECRET',
  'STUDY_CALENDAR_REDIRECT_URI', 'PORTAL_GOOGLE_CLIENT_ID', 'PORTAL_TOKEN_ENCRYPTION_KEY',
  'CALENDAR_WATCHER_TOKEN', 'SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'MATERIAL_DRIVE_SERVICE_ACCOUNT_JSON', 'MATERIAL_DRIVE_CLIENT_ID', 'MATERIAL_DRIVE_CLIENT_SECRET',
  'MATERIAL_DRIVE_REFRESH_TOKEN', 'WEBPAY_COMMERCE_CODE', 'WEBPAY_API_KEY']) isolatedEnv[name] = '';
const server = spawn(process.execPath, ['server.mjs'], {
  cwd: root, windowsHide: true, stdio: 'ignore',
  env: isolatedEnv
});
const report = { ok: false, checks: [], symlink: 'pending' };
function request(route, method = 'GET', headers = {}) {
  // http.request preserves traversal/encoding cases that fetch would normalize.
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    req.setTimeout(5000, () => req.destroy(new Error('Request timed out')));
    req.on('error', reject); req.end();
  });
}
function checked(value, label) { assert.ok(value, label); report.checks.push(label); }
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    assert.equal(server.exitCode, null, 'Isolated server must start');
    try { if ((await request('/', 'HEAD')).status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  checked(ready, 'Isolated server is ready');
  const privateName = path.basename(directory), publicName = path.basename(publicDirectory);
  const fixtureRoutes = [
    `/.data/${privateName}/private.json`, `/%2edata/${privateName}/private.json`,
    `/.data%2f${privateName}%2fprivate.json`, `/assets/../.data/${privateName}/private.json`,
    `/assets/%2e%2e/.data/${privateName}/private.json`, `/assets/%252e%252e/.data/${privateName}/private.json`,
    `/assets/%2e%2e%5c.data%5c${privateName}%5cprivate.json`, `/assets/..%5c.data%5c${privateName}%5cprivate.json`,
    `/assets/${publicName}/.env`, `/assets/${publicName}/.%65nv`
  ];
  const protectedRoutes = [
    '/.git/HEAD', '/.env', '/.env.local', '/recipients.json', '/server.mjs', '/server/study-service.mjs',
    '/scripts/qa-static-security.mjs', '/node_modules/google-auth-library/package.json', '/package.json',
    '/server.log', '/.apos/STATUS.md', '/.github/workflows/pages.yml', '/assets/private.json:secret',
    '/assets/%00private.json', '/assets/%2eenv', '/assets/%252eenv'
  ];
  for (const route of [...fixtureRoutes, ...protectedRoutes]) for (const method of fixtureRoutes.includes(route) ? ['GET', 'HEAD'] : ['HEAD']) {
    const result = await request(route, method);
    checked([400, 403, 404].includes(result.status) && !result.body.includes(fixture), `${method} private path rejected: ${route}`);
    if (method === 'HEAD') checked(result.body === '', `HEAD has no body: ${route}`);
  }
  const publicRoutes = ['/', '/index.html', '/manifest.webmanifest', '/src/app.js', '/src/styles.css',
    '/data/curricula.js', '/data/caja-catalog.mjs', '/assets/logo-mark-transparent.png',
    '/assets/documents/calendario-antofagasta-077-2026.pdf', '/assets/tutorial-story/manifest.js',
    '/original-mallas/malla-o.html', '/transferir', '/transferir/', '/pago/', '/pago/orden/',
    `/assets/${publicName}/public.json`];
  for (const route of publicRoutes) {
    const result = await request(route, 'HEAD');
    checked(result.status === 200 && result.body === '', `HEAD public resource remains available: ${route}`);
  }
  const publicFixture = await request(`/assets/${publicName}/public.json`);
  checked(publicFixture.status === 200 && JSON.parse(publicFixture.body).publicFixture, 'GET serves public fixture');
  const range = await request(`/assets/${publicName}/public.json`, 'GET', { range: 'bytes=0-5' });
  checked(range.status === 206 && range.body === publicFixture.body.slice(0, 6), 'Public byte ranges still work');
  const privateRange = await request(fixtureRoutes[0], 'GET', { range: 'bytes=0-5' });
  checked(privateRange.status === 403, 'A Range header cannot bypass private path protection');
  checked((await request('/src/nonexistent-public.js')).status === 404, 'Missing resources return 404 rather than application HTML');
  checked((await request('/index.html', 'POST')).status === 405, 'Static resources accept GET and HEAD only');
  try {
    await symlink(directory, path.join(publicDirectory, 'private-link'), process.platform === 'win32' ? 'junction' : 'dir');
    for (const method of ['GET', 'HEAD']) checked((await request(`/assets/${publicName}/private-link/private.json`, method)).status === 403, `${method} symlink to private state rejected`);
    report.symlink = 'verified';
  } catch (error) {
    if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    report.symlink = 'unavailable on this filesystem';
  }
  report.ok = true;
} finally {
  if (server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
  // Both names are generated by this script and must remain inside the workspace.
  for (const target of [publicDirectory, directory]) {
    const relative = path.relative(root, path.resolve(target));
    assert.ok(relative && !path.isAbsolute(relative) && !relative.startsWith('..' + path.sep) && relative !== '..');
    assert.ok(path.basename(target).startsWith('qa-static-security-'));
    await rm(target, { recursive: true, force: true });
  }
}
console.log(JSON.stringify(report, null, 2));
