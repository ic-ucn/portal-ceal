import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.QA_PUBLIC_URL || 'http://127.0.0.1:8098/';
const staticMode = process.argv.includes('--static');
const label = staticMode ? 'static' : new URL(base).hostname === 'ceicucn.cl' ? 'production' : 'public';
const output = new URL('../qa-screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = { ok: false, mode: label, views: [], errors: [] };
function url(route) {
  const target = new URL(base);
  target.searchParams.set('deployCheck', `20260914e-${Date.now()}`);
  if (staticMode) target.searchParams.set('static', '1');
  target.hash = route;
  return target.href;
}
async function auditNavigationHover(page, theme) {
  for (const item of await page.locator('.nav-item').all()) {
    await item.hover();
    await page.waitForTimeout(250);
    const contrast = await item.evaluate(node => {
      const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = color => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const style = getComputedStyle(node), icon = getComputedStyle(node.querySelector('.icon'));
      const background = luminance(style.backgroundColor);
      return { text: ratio(luminance(style.color), background), icon: ratio(luminance(icon.color), background), opacity: Number(icon.opacity), label: node.textContent.trim() };
    });
    assert.ok(contrast.text >= 4.5 && contrast.icon >= 3 && contrast.opacity === 1, `${theme} ${contrast.label} hover must retain text and icon contrast`);
  }
  await page.mouse.move(900, 90);
}
try {
  for (const width of [1440, 390, 320, 768, 920]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    if (width === 320) await context.addInitScript(() => {
      if (window !== window.top) return;
      localStorage.setItem('portal.session', JSON.stringify({ role: 'ceal', accessMode: 'ceal', sessionToken: 'expired-qa-session' }));
    });
    const page = await context.newPage();
    const authRequests = [];
    page.on('request', request => { if (/\/auth\//.test(request.url())) authRequests.push(request.url()); });
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(url('/login'), { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
    assert.equal(new URL(page.url()).hash, '#/', 'old login links go directly to the portal');
    assert.equal(await page.locator('[data-google-redirect], [data-guest-login], a[href="#/perfil"]').count(), 0);
    if (width === 1440) await auditNavigationHover(page, 'light');
    for (const [route, name] of [['/', 'inicio'], ['/calendario', 'calendario'], ['/material', 'material'], ['/mallas', 'mallas']]) {
      await page.goto(url(route), { waitUntil: 'networkidle' });
      if (name === 'mallas') {
        await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
        await page.getByRole('link', { name: 'Cerrar malla y volver al inicio' }).waitFor();
      } else {
        await page.locator('.page-title').waitFor();
      }
      const metrics = await page.evaluate(() => {
        const nav = document.querySelector('.bottom-nav');
        return {
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          navVisible: getComputedStyle(nav).display !== 'none',
          items: [...nav.querySelectorAll('.bottom-item')].map(node => {
            const rect = node.getBoundingClientRect();
            return { label: node.innerText.trim(), left: rect.left, right: rect.right, width: rect.width, height: rect.height };
          }),
          privateLinks: document.querySelectorAll('a[href="#/gestion"]').length
        };
      });
      assert.ok(metrics.documentWidth <= width, `${name} must fit ${width}px`);
      assert.equal(metrics.privateLinks, 0, 'guests must not see CEAL management');
      assert.equal(await page.locator('a[href="#/perfil"], [data-google-redirect], [data-save-course]').count(), 0, 'public navigation has no account actions');
      if (label === 'production') assert.ok(!(await page.locator('#main-content').innerText()).includes('Acuerdo QA de seguimiento'), 'legacy test agreements must not appear as public content');
      if (width <= 920) {
        assert.ok(metrics.navVisible, 'mobile navigation must remain visible');
        assert.equal(metrics.items.map(item => item.label).join('|'), 'Inicio|Calendario|Mallas|Material|Más');
        assert.ok(metrics.items.every(item => item.left >= 0 && item.right <= width && item.width >= 44 && item.height >= 44));
      }
      await page.screenshot({ path: new URL(`${label}-${width}-${name}.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
      report.views.push({ width, route, overflow: false });
    }
    if (width === 390) {
      await page.locator('.bottom-more').click();
      await page.getByRole('dialog', { name: 'Menú del portal' }).waitFor();
      assert.equal(await page.locator('[data-logout], a[href="#/perfil"]').count(), 0);
      await page.screenshot({ path: new URL(`${label}-390-menu.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
      await page.getByRole('button', { name: 'Cerrar menú', exact: true }).click();
      await page.locator('[data-malla-embed-theme]').click();
      assert.ok(await page.locator('body.theme-dark').count(), 'dark mode must work');
      await page.locator('[data-malla-embed-theme] .icon').waitFor({ state: 'visible' });
      const iframeHandle = await page.locator('.malla-embed-frame').elementHandle();
      const frame = await iframeHandle.contentFrame();
      await frame.waitForFunction(() => !document.documentElement.classList.contains('mc-light'));
      await page.waitForTimeout(300); // Let the finite color transition complete for visual QA.
      await page.screenshot({ path: new URL(`${label}-390-mallas-dark.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
    }
    if (width === 390 || width === 1440) {
      if (width === 1440) await page.locator('[data-malla-embed-theme]').click();
      for (const [route, name] of [['/', 'inicio'], ['/calendario', 'calendario'], ['/material', 'material'], ['/perfil', 'perfil'], ['/login', 'login']]) {
        await page.goto(url(route), { waitUntil: 'networkidle' });
        await page.locator('body.theme-dark').waitFor();
        await page.waitForTimeout(300);
        if (width === 1440 && name === 'inicio') await auditNavigationHover(page, 'dark');
        const layout = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          form: document.querySelector('.login-form')?.getBoundingClientRect().width,
          pageFont: getComputedStyle(document.querySelector('h1')).fontFamily
        }));
        assert.ok(layout.width <= width, `${name} dark layout must fit ${width}px`);
        if (name === 'login' || name === 'perfil') assert.equal(new URL(page.url()).hash, '#/');
        assert.ok(layout.pageFont.includes('Instrument Sans'), 'headings use the self-hosted portal font');
        await page.screenshot({ path: new URL(`${label}-${width}-${name}-dark.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
        report.views.push({ width, route, theme: 'dark', overflow: false });
      }
    }
    await page.goto(url('/gestion'), { waitUntil: 'networkidle' });
    assert.equal(new URL(page.url()).hash, '#/', 'internal routes remain protected');
    await page.goto(url('/material/subir'), { waitUntil: 'networkidle' });
    assert.equal(new URL(page.url()).hash, '#/material', 'retired upload links return to the library');
    assert.deepEqual(authRequests, [], 'public browsing does not validate or transmit saved credentials');
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.ok = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(new URL(`${label}-report.json`, output), JSON.stringify(report, null, 2));
  await browser.close();
}
