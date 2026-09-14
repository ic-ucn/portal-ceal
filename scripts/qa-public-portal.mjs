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
  target.searchParams.set('deployCheck', `20260914c-${Date.now()}`);
  if (staticMode) target.searchParams.set('static', '1');
  target.hash = route;
  return target.href;
}
try {
  for (const width of [1440, 390, 320, 768, 920]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(url('/login'), { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Portal CEIC', exact: true }).waitFor();
    await page.screenshot({ path: new URL(`${label}-${width}-login.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
    await page.locator('[data-guest-login]').click();
    await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
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
        if (name === 'login') await page.locator('[data-logout]').click();
        await page.goto(url(route), { waitUntil: 'networkidle' });
        await page.locator('body.theme-dark').waitFor();
        await page.waitForTimeout(300);
        const layout = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          form: document.querySelector('.login-form')?.getBoundingClientRect().width,
          pageFont: getComputedStyle(document.querySelector('h1')).fontFamily
        }));
        assert.ok(layout.width <= width, `${name} dark layout must fit ${width}px`);
        if (name === 'login') assert.ok(layout.form > Math.min(250, width - 60), 'login fields have usable width in dark mode');
        assert.ok(layout.pageFont.includes('Instrument Sans'), 'headings use the self-hosted portal font');
        await page.screenshot({ path: new URL(`${label}-${width}-${name}-dark.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
        report.views.push({ width, route, theme: 'dark', overflow: false });
      }
    }
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.ok = true;
  console.log(JSON.stringify(report));
} finally {
  await writeFile(new URL(`${label}-report.json`, output), JSON.stringify(report, null, 2));
  await browser.close();
}
