import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.QA_CAJA_PORT || 8797);
const baseUrl = `http://127.0.0.1:${port}`;
const ordersPath = path.join(root, '.data', `qa-caja-orders-${process.pid}.json`);
const server = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    PORTAL_STATE_BACKEND: 'local',
    CAJA_ORDERS_PATH: ordersPath
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk; });
server.stderr.on('data', chunk => { serverOutput += chunk; });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  throw new Error(`El servidor no inició.\n${serverOutput}`);
}

async function run() {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const retryPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    let catalogAttempts = 0;
    await retryPage.route('**/api/caja/catalog', async route => {
      catalogAttempts += 1;
      if (catalogAttempts === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Servicio iniciando.' })
        });
        return;
      }
      await route.continue();
    });
    await retryPage.goto(`${baseUrl}/pago/`, { waitUntil: 'domcontentloaded' });
    await retryPage.locator('.product-button').first().waitFor({ timeout: 10000 });
    assert(catalogAttempts >= 2, 'La caja no reintentó cargar el catálogo tras un fallo inicial.');
    assert(await retryPage.locator('.product-button').count() === 14, 'El catálogo no se recuperó tras un fallo inicial.');
    await retryPage.close();

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(`${baseUrl}/pago/`, { waitUntil: 'networkidle' });
    assert(await desktop.locator('.product-button').count() === 14, 'El catálogo no cargó completo.');

    await desktop.locator('.product-button', { hasText: 'Piscola' }).click();
    await desktop.locator('.product-button', { hasText: 'Piscola' }).click();
    await desktop.locator('.product-button', { hasText: 'Choripán' }).click();
    assert((await desktop.locator('#cart-total').textContent()).includes('6.500'), 'La promoción 2x no se aplicó al total.');
    await desktop.locator('#checkout-button').click();
    await desktop.locator('#payment-dialog[open]').waitFor();
    assert(await desktop.locator('#payment-qr').isVisible(), 'El QR de cobro no está visible.');
    const paymentUrl = await desktop.locator('#open-payment').getAttribute('href');
    assert(paymentUrl?.includes('/pago/orden/?orden='), 'El QR no apunta a una orden de pago.');

    const customer = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await customer.goto(paymentUrl, { waitUntil: 'networkidle' });
    assert((await customer.locator('#customer-total').textContent()).includes('6.500'), 'El total no coincide en la página de pago.');
    assert(await customer.locator('#copy-all').isVisible(), 'Falta la copia de datos de transferencia.');
    assert(await customer.locator('#webpay-button').isVisible(), 'Falta la alternativa Webpay.');
    const overflow = await customer.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert(!overflow, 'La página de pago tiene desborde horizontal en móvil.');

    const orderId = new URL(paymentUrl).searchParams.get('orden');
    const webpayResponse = await fetch(`${baseUrl}/api/caja/orders/${encodeURIComponent(orderId)}/webpay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    });
    const webpay = await webpayResponse.json();
    assert(webpayResponse.ok && webpay.url?.includes('transbank.cl') && webpay.token, 'Webpay no generó una transacción de integración.');

    await customer.reload({ waitUntil: 'networkidle' });
    await customer.locator('#webpay-button').click();
    await customer.waitForURL(/webpay3gint\.transbank\.cl/, { timeout: 20000 });
    await customer.waitForTimeout(2200);
    await customer.getByText('Tarjetas', { exact: false }).first().click();
    await customer.locator('#card-number').fill('4051885600446623');
    await customer.getByRole('button', { name: 'Continuar' }).click();
    await customer.locator('#card-exp').fill('12/28');
    await customer.locator('#card-cvv').fill('123');
    const payButton = customer.getByRole('button', { name: 'Pagar' });
    if (await payButton.count()) await payButton.click();
    else {
      await customer.getByRole('button', { name: /Continuar/ }).last().click();
      await customer.getByRole('button', { name: 'Pagar' }).click();
    }
    await customer.waitForURL(/authenticator\.cgi/, { timeout: 20000 });
    await customer.locator('#rutClient').fill('11.111.111-1');
    await customer.locator('#passwordClient').fill('123');
    await customer.locator('input[type=submit]').click();
    await customer.waitForURL(/authenticatorProcess\.cgi/, { timeout: 20000 });
    await customer.locator('select').selectOption('TSY');
    await customer.locator('input[type=submit]').click();
    await customer.waitForURL(new RegExp(`127\\.0\\.0\\.1:${port}/pago/orden/`), { timeout: 30000 });
    await customer.locator('#payment-status.success').waitFor();
    assert((await customer.locator('#payment-status').textContent()).includes('Pago autorizado'), 'El retorno autorizado de Webpay no se confirmó.');

    const mobileCashier = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await mobileCashier.goto(`${baseUrl}/pago/`, { waitUntil: 'networkidle' });
    await mobileCashier.locator('.product-button', { hasText: 'Choripán' }).click();
    assert(await mobileCashier.locator('#mobile-checkout').isVisible(), 'El resumen móvil no está disponible.');
    const cashierOverflow = await mobileCashier.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert(!cashierOverflow, 'La caja tiene desborde horizontal en móvil.');
    console.log('QA caja: catálogo, promociones, QR, transferencia, Webpay autorizado y vistas responsive OK');
  } finally {
    await browser.close();
  }
}

try {
  await run();
} finally {
  server.kill('SIGTERM');
  await fs.rm(ordersPath, { force: true });
}
