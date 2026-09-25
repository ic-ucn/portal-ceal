import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// All browser traffic is intercepted. The production-shaped origin serves only
// this checkout; no test event ever reaches the real analytics account.
const root = fileURLToPath(new URL('../', import.meta.url));
const sdkResponse = await fetch('https://gc.zgo.at/count.js');
assert.ok(sdkResponse.ok, 'official SDK available');
const sdk = await sdkResponse.text();
const browser = await chromium.launch();
const report = { ok: false, cases: [], errors: [] };
const types = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };
async function setup({ width = 1440, host = 'ceicucn.cl', blocked = false, exclusion = '', sdkDelay = 0 } = {}) {
  const hits = [], requests = [];
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(({ exclusion }) => {
    // This isolated context never contacts production. Exercise the normal
    // visitor path, then separately prove automated visits are excluded.
    if (exclusion !== 'automation') Object.defineProperty(navigator, 'webdriver', { get: () => false });
    if (exclusion === 'dnt') Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    if (exclusion === 'gpc') Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
    if (exclusion === 'saved') localStorage.setItem('portal.analytics.disabled', 'yes');
    if (exclusion === 'goat') localStorage.setItem('skipgc', 't');
  }, { exclusion });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url()); requests.push(url.href);
    if (url.hostname === 'ceicucn.goatcounter.com') {
      hits.push(Object.fromEntries(url.searchParams));
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    if (url.hostname === 'gc.zgo.at') {
      if (blocked) return route.abort('blockedbyclient');
      if (sdkDelay) await new Promise(resolve => setTimeout(resolve, sdkDelay));
      return route.fulfill({ body: sdk, contentType: 'application/javascript' });
    }
    if (url.hostname !== host) return route.abort();
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    assert.ok(file.startsWith(root), 'only serve files within checkout');
    try {
      let body = await readFile(file);
      if (url.pathname === '/src/config.js') body = Buffer.from(body.toString() + '\nwindow.PORTAL_API_BASE = "";');
      const range = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range || '');
      if (range) {
        const start = Number(range[1]), end = Math.min(range[2] ? Number(range[2]) : body.length - 1, body.length - 1);
        return route.fulfill({ status: 206, body: body.subarray(start, end + 1), contentType: types[path.extname(file)], headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${body.length}` } });
      }
      return route.fulfill({ body, contentType: types[path.extname(file)] || 'application/octet-stream' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.setDefaultTimeout(15000);
  const base = `https://${host}/`;
  const hit = async (name, count = 1) => {
    await assertEventually(() => hits.filter(item => item.p === name).length >= count, name);
  };
  return { page, context, hits, requests, base, hit };
}
async function assertEventually(condition, description) {
  const until = Date.now() + 15000;
  while (!condition() && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(condition(), description);
}
try {
  for (const width of [1440, 390]) {
    const { page, context, base, hits, hit } = await setup({ width, sdkDelay: 600 });
    const nav = width < 920 ? '.bottom-nav' : '.sidebar';
    await page.goto(`${base}?secret=DO_NOT_SEND#/`, { waitUntil: 'networkidle', referer: 'https://example.org/private?email=DO_NOT_SEND' });
    await hit('/#/bienvenida');
    assert.equal(hits.filter(x => x.e !== 'true').length, 1, 'one initial view with delayed SDK');
    assert.equal(hits[0].r, 'https://example.org');
    assert.ok(!JSON.stringify(hits).includes('DO_NOT_SEND'), 'query and referrer details stripped by actual SDK');
    await page.locator('[data-portal-theme-toggle]').click(); await hit('portal/tema');
    assert.equal(hits.filter(x => x.e !== 'true').length, 1, 'state render is not another visit');
    assert.equal(await page.locator('.portal-reception video, .portal-reception audio').count(), 0, 'silent guide has no media');
    await page.locator('.portal-reception [data-guide-play]').click();
    await hit('tutorial/reproducir');
    await page.locator('.portal-reception [data-guide-play]').click();
    await hit('tutorial/pausar');
    await page.locator('.portal-reception [data-guide-tab="1"]').click();
    await hit('tutorial/capitulo');
    await page.locator('.portal-reception [data-guide-next]').click();
    await hit('tutorial/siguiente');
    assert.ok(!JSON.stringify(hits).match(/DAMA|DAFI|approved|selected|course=/), 'guide events contain no course or personal state');
    await page.locator('.reception-skip').click(); await hit('tutorial/saltar'); await hit('/#/inicio');
    await page.locator(`${nav} a[href="#/calendario"]`).click(); await hit('/#/calendario');
    await page.locator('.calendar-agenda-row').first().click(); await hit('calendario/fecha');
    await page.locator('.calendar-detail-modal [data-calendar-modal-close]').first().click();
    await hit('calendario/cerrar');
    assert.equal(hits.filter(x => x.p === '/#/calendario').length, 1, 'opening modal/query does not duplicate page');
    await page.locator(`${nav} a[href="#/material"]`).click(); await hit('/#/material');
    await page.locator('[data-material-search]').fill('DO_NOT_SEND'); await hit('material/buscar');
    await page.locator('[data-material-search]').fill('');
    await page.locator('[data-material-type="Guía"]').click(); await hit('material/tipo');
    assert.equal(hits.filter(x => x.p === '/#/material').length, 1, 'filters do not count as visits');
    const resource = page.locator(width < 920 ? '.material-list-item' : '.resource-title-link').first();
    await resource.click(); await hit('/#/material?consulta=detalle');
    assert.ok(hits.some(x => x.e === 'true' && x.ns === 'true'), 'events count repeated actions separately');
    await page.goBack(); await hit('/#/material', 2);
    await page.locator(`${nav} a[href="#/mallas"]`).click(); await hit('/#/mallas');
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
    const frame = page.frameLocator('[data-malla-frame]');
    await frame.locator('.mc-card[data-mc-code]').first().click(); await hit('mallas/ramo');
    await page.locator('[data-malla-embed-plan="o"]').click(); await hit('mallas/plan-o');
    assert.equal(hits.filter(x => x.p === '/#/mallas').length, 1, 'switching plans does not duplicate page');
    const before = hits.length;
    await page.evaluate(() => {
      PortalAnalytics.page('/gestion/material/PRIVATE/validar');
      PortalAnalytics.event('material/descargar');
      PortalAnalytics.page('/perfil'); PortalAnalytics.event('portal/tema');
      PortalAnalytics.page('/material/subir'); PortalAnalytics.event('material/buscar');
    });
    await page.waitForTimeout(150);
    assert.equal(hits.length, before, 'protected routes and their actions are excluded');
    assert.ok(!JSON.stringify(hits).match(/DO_NOT_SEND|PRIVATE|drive-|secret=|email=/));
    assert.ok(hits.every(x => !Object.hasOwn(x, 'q')), 'SDK never sends the query string');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow');
    await mkdir(path.join(root, 'qa-screenshots'), { recursive: true });
    await page.screenshot({ path: path.join(root, `qa-screenshots/analytics-${width}.png`) });
    report.cases.push({ width, views: hits.filter(x => x.e !== 'true').length, events: hits.filter(x => x.e === 'true').length, privacy: true, delayedSDK: true });
    await context.close();
  }
  for (const exclusion of ['automation', 'dnt', 'gpc', 'saved', 'goat', 'localhost', 'qa', 'static', 'review', 'off', 'blocked']) {
    const { page, context, base, hits, requests } = await setup({ exclusion, host: exclusion === 'localhost' ? 'localhost' : 'ceicucn.cl', blocked: exclusion === 'blocked' });
    const query = ['qa', 'static', 'review'].includes(exclusion) ? `?${exclusion}=1` : exclusion === 'off' ? '?analytics=off' : '';
    await page.goto(`${base}${query}#/`, { waitUntil: 'networkidle' });
    await page.locator('.reception-enter').click(); await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
    assert.equal(hits.length, 0, `${exclusion}: no counts`);
    if (exclusion !== 'blocked') assert.ok(!requests.some(x => x.includes('gc.zgo.at')), `${exclusion}: no SDK request`);
    if (exclusion === 'off') {
      await page.goto(`${base}#/`, { waitUntil: 'networkidle' });
      assert.equal(hits.length, 0, 'opt-out persists');
      await page.goto(`${base}?analytics=on#/`, { waitUntil: 'networkidle' });
      await assertEventually(() => hits.length === 1, 'opt-in restores tracking');
    }
    report.cases.push({ exclusion, usable: true }); await context.close();
  }
  assert.deepEqual(report.errors, []); report.ok = true;
} finally {
  await browser.close();
  await mkdir(path.join(root, 'qa-screenshots'), { recursive: true });
  await writeFile(path.join(root, 'qa-screenshots/analytics-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
