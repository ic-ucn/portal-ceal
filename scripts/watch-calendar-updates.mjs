import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inbox = path.join(root, '.data', 'calendar-inbox');

async function loadEnvFile(file) {
  try {
    const content = await fs.readFile(path.join(root, file), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await loadEnvFile('.env.local');
await loadEnvFile('.env');

const baseUrl = String(process.env.PORTAL_API_BASE || 'https://portal-ceic-api.onrender.com/api').replace(/\/+$/, '');
const token = String(process.env.CALENDAR_WATCHER_TOKEN || '').trim();
const intervalMs = Math.max(15_000, Number(process.env.CALENDAR_WATCH_INTERVAL_MS || 60_000));
const once = process.argv.includes('--once');

if (!token) throw new Error('Falta CALENDAR_WATCHER_TOKEN en .env.local o en el entorno.');
if (!/^https:\/\//.test(baseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/.test(baseUrl)) {
  throw new Error('PORTAL_API_BASE debe usar HTTPS o apuntar a localhost.');
}

function safeName(value, fallback) {
  const name = path.basename(String(value || fallback)).replace(/[^A-Za-z0-9._ -]/g, '').trim();
  return name.slice(0, 120) || fallback;
}

async function watcherRequest(route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'x-calendar-watcher-token': token, 'content-type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `calendar watcher ${response.status}`);
  }
  return response;
}

async function downloadItem(item) {
  const requestDir = path.join(inbox, safeName(item.id, `calendar-${Date.now()}`));
  const metaPath = path.join(requestDir, 'metadata.json');
  try {
    await fs.access(metaPath);
    return false;
  } catch {}

  const response = await watcherRequest(`/calendar-updates/${encodeURIComponent(item.id)}/file`, { headers: { accept: item.fileType || 'application/octet-stream' } });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length !== Number(item.fileSize)) throw new Error(`Descarga incompleta para ${item.id}.`);
  await fs.mkdir(requestDir, { recursive: true });
  const fileName = safeName(item.fileName, 'calendario.bin');
  await fs.writeFile(path.join(requestDir, fileName), bytes, { flag: 'wx' });
  await fs.writeFile(metaPath, `${JSON.stringify({ ...item, downloadedLocallyAt: new Date().toISOString(), localFile: fileName }, null, 2)}\n`, { flag: 'wx' });
  await watcherRequest(`/calendar-updates/${encodeURIComponent(item.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'downloaded', note: 'Archivo descargado para revisión.' })
  });
  process.stdout.write(`[calendar] recibido ${item.id}: ${fileName}\n`);
  return true;
}

async function poll() {
  const response = await watcherRequest('/calendar-updates/watcher', { headers: { accept: 'application/json' } });
  const payload = await response.json();
  let downloaded = 0;
  for (const item of payload.items || []) {
    if (await downloadItem(item)) downloaded += 1;
  }
  if (once || downloaded) process.stdout.write(`[calendar] ${downloaded} archivo(s) nuevo(s)\n`);
}

await fs.mkdir(inbox, { recursive: true });
if (once) {
  await poll();
} else {
  process.stdout.write(`[calendar] revisando cada ${Math.round(intervalMs / 1000)} s\n`);
  while (true) {
    try { await poll(); } catch (error) { process.stderr.write(`[calendar] ${error.message}\n`); }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}
