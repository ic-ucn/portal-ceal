import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, firefox, webkit } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.QA_TRANSFER_PORT || 18082);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotDir = path.join(root, 'qa-screenshots');
const server = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('La página de transferencia no inició a tiempo.');
}

async function verifyPage(browserType, name, viewport, canReadClipboard = false) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  if (canReadClipboard) {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Datos para transferir' }).waitFor();
  await page.getByText('Belén Alessandra Astudillo Díaz', { exact: true }).waitFor();
  await page.getByText('1062801369', { exact: true }).waitFor();

  if (canReadClipboard) {
    await page.getByRole('button', { name: /Número de cuenta/ }).click();
    await page.getByText('Número de cuenta copiado', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '1062801369');
    await page.getByRole('button', { name: 'Copiar todos los datos' }).click();
    await page.getByText('Datos de transferencia copiados', { exact: true }).waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /Belén Alessandra Astudillo Díaz/);
    assert.match(copied, /21\.010\.841-6/);
    assert.match(copied, /1062801369/);
    assert.match(copied, /belen\.astu24@gmail\.com/);
  } else {
    await page.getByRole('button', { name: /Número de cuenta/ }).waitFor();
    await page.getByRole('button', { name: 'Copiar todos los datos' }).waitFor();
    const userSelect = await page.locator('.account-number strong').evaluate(element => {
      const style = getComputedStyle(element);
      return style.userSelect || style.webkitUserSelect;
    });
    assert.ok(['all', 'text'].includes(userSelect), `${name}: el dato debe permitir selección manual`);
  }

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    title: document.title,
    manifest: Boolean(document.querySelector('link[rel="manifest"]')),
    portalMount: Boolean(document.querySelector('#app')),
    portalScript: Boolean(document.querySelector('script[src*="app.js"]'))
  }));
  assert.equal(metrics.scrollWidth, metrics.clientWidth, `${name}: no debe existir overflow horizontal`);
  assert.equal(metrics.manifest, false, `${name}: no debe instalar el portal`);
  assert.equal(metrics.portalMount, false, `${name}: el portal no debe montarse`);
  assert.equal(metrics.portalScript, false, `${name}: el portal no debe cargarse`);
  assert.match(metrics.title, /Datos de transferencia/);
  assert.deepEqual(errors, [], `${name}: errores en consola`);

  await page.screenshot({ path: path.join(screenshotDir, `transfer-${name}.png`), fullPage: true });
  await browser.close();
}

try {
  await mkdir(screenshotDir, { recursive: true });
  await waitForServer();
  await verifyPage(chromium, 'desktop', { width: 1440, height: 1000 }, true);
  await verifyPage(chromium, 'mobile', { width: 390, height: 844 }, true);
  await verifyPage(chromium, 'mobile-320', { width: 320, height: 700 }, true);
  await verifyPage(webkit, 'safari-mobile', { width: 390, height: 844 });
  await verifyPage(firefox, 'firefox-mobile', { width: 390, height: 844 });
  console.log(JSON.stringify({ ok: true, views: 5, clipboard: true, overflow: false }, null, 2));
} finally {
  server.kill('SIGTERM');
}
