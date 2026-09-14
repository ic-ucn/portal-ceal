import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

const root = new URL('../', import.meta.url);
let available = false;
let reads = 0;
let writes = 0;
const storage = http.createServer((req, res) => {
  req.resume();
  res.setHeader('content-type', 'application/json');
  if (!available) {
    res.writeHead(503);
    res.end(JSON.stringify({ message: 'Temporary storage outage' }));
  } else if (req.method === 'GET') {
    reads += 1;
    res.end('[]');
  } else {
    writes += 1;
    res.end('[]');
  }
});
await new Promise(resolve => storage.listen(0, '127.0.0.1', resolve));
const port = Number(process.env.QA_RECOVERY_PORT || 18085);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  windowsHide: true,
  stdio: 'ignore',
  env: {
    ...process.env,
    PORT: String(port),
    PORTAL_STATE_BACKEND: 'supabase',
    SUPABASE_URL: `http://127.0.0.1:${storage.address().port}`,
    SUPABASE_SECRET_KEY: 'qa-storage-only',
    QA_TEST_MODE: '1'
  }
});
try {
  let started = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { started = (await fetch(base)).ok; } catch {}
    if (started) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(started, 'QA server should start');
  const failed = await fetch(`${base}/api/health`);
  assert.equal(failed.status, 500, 'unavailable shared storage must not silently switch to an empty database');
  available = true;
  const recovered = await Promise.all(Array.from({ length: 8 }, () => fetch(`${base}/api/health`)));
  assert.ok(recovered.every(res => res.ok), 'requests must recover once storage returns, without restarting the server');
  assert.equal(reads, 1, 'concurrent retries should share one database initialization');
  assert.equal(writes, 1, 'recovery should initialize the shared state once');
  const bootstrap = await fetch(`${base}/api/bootstrap`);
  assert.equal(bootstrap.status, 200);
  const payload = await bootstrap.json();
  assert.ok(payload.data.resources.length > 1000, 'recovered bootstrap should serve academic material');
  assert.equal((await fetch(`${base}/api/analytics/summary`)).status, 401, 'recovery must preserve protected API access');
  console.log(JSON.stringify({ ok: true, outage: 'detected', recoveredRequests: 8, storageReads: reads, accessControl: 'preserved' }));
} finally {
  child.kill();
  storage.closeAllConnections();
  await new Promise(resolve => storage.close(resolve));
}
