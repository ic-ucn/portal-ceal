import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 18086;
const base = `http://127.0.0.1:${port}/?static=1&analytics=off`;
const key = 'portal.myCourses.v1';
const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, windowsHide: true, stdio: 'ignore' });
const report = { ok: false, checks: [], errors: [] };
const frame = page => page.frameLocator('[data-malla-frame]');
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), key);
let browser;
mkdirSync(new URL('../qa-screenshots/', import.meta.url), { recursive: true });
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 150)); }
  browser = await chromium.launch();
  for (const [width, height, source] of [[1440, 900, 'remote'], [390, 844, 'remote'], [320, 568, 'fallback']]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    const personalRequests = [];
    page.on('request', request => { if (/\/api\/|goatcounter|cloudflareinsights/.test(request.url())) personalRequests.push(request.url()); });
    await page.route('https://ic-ucn.github.io/**', route => {
      const plan = new URL(route.request().url()).pathname.endsWith('malla-o.html') ? 'o' : 'p';
      return source === 'remote'
        ? route.fulfill({ body: readFileSync(`${root}/original-mallas/malla-${plan}.html`, 'utf8'), contentType: 'text/html' })
        : route.abort();
    });
    await page.goto(`${base}#/inicio`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.home-service-links a[href="#/mallas"]').count(), 1);
    assert.equal(await page.locator('a[href="#/mis-ramos"]').count(), 0, 'single navigation entry');
    await page.locator('.home-service-links a[href="#/mallas"]').click();
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
    assert.equal(await page.locator('.malla-personal-panel').isVisible(), false, 'personal panel starts closed');
    const iframeHandle = await page.locator('[data-malla-frame]').elementHandle();
    const canonical = 'DAII-00600';
    const rawCode = await frame(page).locator('.mc-card[data-mc-code]').evaluateAll((cards, canonical) => cards.find(card => (window.__MC_MATERIAL?.[card.dataset.mcCode]?.id || card.dataset.mcCode) === canonical)?.dataset.mcCode, canonical);
    assert.ok(rawCode, 'remote and fallback cards resolve official code');
    await page.locator('[data-malla-view="personal"]').click();
    await page.locator('[data-my-courses-search]').fill(canonical);
    await page.locator(`.my-courses-list [data-malla-detail="${canonical}"]`).click();
    const dialog = page.locator('[data-malla-course-dialog]');
    await dialog.locator('[data-my-course-status]').selectOption('aprobado');
    assert.deepEqual((await saved(page)).plans.planP.selected, [], 'approval does not select');
    await dialog.locator('[data-my-course-add]').click();
    assert.equal(await dialog.locator('[data-my-course-status]').inputValue(), 'aprobado', 'selection does not alter approval');
    await dialog.locator('[data-my-course-status]').selectOption('cursando');
    await dialog.locator('[data-malla-detail-close]').click();
    assert.equal(await page.locator(`[data-my-course-card="${canonical}"] [data-my-course-status]`).inputValue(), 'cursando');
    assert.equal(await page.evaluate(code => document.activeElement?.dataset.mallaDetail === code, canonical), true, 'dialog restores invoking button focus');
    const link = page.locator(`[data-my-course-card="${canonical}"] .my-course-material .link`);
    assert.ok((await link.getAttribute('href')).includes(`plan=planP&course=${canonical}`), 'material uses shared plan and official code');
    await page.locator('[data-malla-personal-content]').evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: `${root}/qa-screenshots/malla-integrated-${width}.png` });
    await page.locator(`[data-my-course-card="${canonical}"] [data-malla-locate]`).click();
    assert.equal(await page.locator('.malla-personal-panel').isVisible(), false);
    const card = frame(page).locator(`.mc-card[data-mc-code="${rawCode}"]`);
    await card.waitFor({ state: 'visible' });
    assert.equal(await card.evaluate(element => document.activeElement === element), true, 'locate focuses curriculum card');
    if (source === 'fallback') {
      const semester = await page.evaluate(code => CURRICULA.planP.subjects.find(course => course.code === code).semester, canonical);
      assert.equal(await frame(page).locator('.mc-semester-select').inputValue(), String(semester), 'mobile locate changes to the official semester');
    }
    await card.press('Enter');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.locator('[data-my-course-status]').inputValue(), 'cursando');
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true, 'native dialog traps focus');
    }
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await iframeHandle.evaluate(element => element.isConnected), true, 'view, search and personal updates preserve iframe identity');
    await page.locator('[data-malla-view="personal"]').click();
    await page.locator('[data-malla-embed-plan="o"]').click();
    assert.equal(await page.locator('.my-courses-selected [data-my-course-card]').count(), 0);
    assert.equal((await saved(page)).activePlan, 'planO');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-malla-embed-plan="o"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-malla-embed-plan="p"]').click();
    assert.equal(await page.locator(`[data-my-course-card="${canonical}"] [data-my-course-status]`).inputValue(), 'cursando');
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    assert.equal(new URL(page.url()).hash, '#/mallas?view=mis-ramos');
    assert.equal(await page.locator('.malla-personal-panel').isVisible(), true);
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, panel: document.querySelector('.malla-personal-panel').getBoundingClientRect().bottom, nav: document.querySelector('.bottom-nav').getBoundingClientRect().top }));
    assert.equal(layout.overflow, false);
    if (width <= 920) assert.ok(layout.panel <= layout.nav, 'personal panel clears mobile navigation');
    assert.deepEqual(personalRequests, [], 'personal edits never contact API or analytics');
    report.checks.push(`${source}/${width}x${height}: shared state, independence, persistence, plan, material, locate, focus, iframe identity, redirect, privacy`);
    await context.close();
  }
  const tabs = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await tabs.route('https://ic-ucn.github.io/**', route => route.abort());
  const tabA = await tabs.newPage(), tabB = await tabs.newPage();
  await Promise.all([tabA.goto(`${base}#/inicio`, { waitUntil: 'networkidle' }), tabB.goto(`${base}#/mallas`, { waitUntil: 'networkidle' })]);
  await tabB.locator('[data-malla-embed-plan="o"]').click();
  await tabA.waitForFunction(key => JSON.parse(localStorage.getItem(key)).activePlan === 'planO', key);
  await tabA.locator('.home-service-links a[href="#/mallas"]').click();
  assert.equal(await tabA.locator('[data-malla-embed-plan="o"]').getAttribute('aria-pressed'), 'true', 'external plan change is reflected when reentering from Inicio');
  await tabA.locator('[data-malla-view="personal"]').click();
  await tabA.locator('.bottom-nav a[href="#/material"]').click();
  await tabA.locator('.bottom-nav a[href="#/mallas"]').click();
  assert.equal(await tabA.locator('.malla-personal-panel').isVisible(), false);
  await tabA.goBack();
  await tabA.waitForURL(url => url.hash === '#/material');
  await tabA.goBack();
  await tabA.waitForURL(url => url.hash === '#/mallas?view=mis-ramos');
  await tabA.locator('.malla-personal-panel').waitFor({ state: 'visible' });
  await tabA.goForward(); await tabA.waitForURL(url => url.hash === '#/material');
  await tabA.goForward(); await tabA.waitForURL(url => url.hash === '#/mallas');
  await tabA.locator('.malla-personal-panel').waitFor({ state: 'hidden' });
  report.checks.push('two tabs away from Malla: shared active plan on reentry; personal/complete view follows back and forward history');
  await tabs.close();
  report.ok = report.errors.length === 0;
} catch (error) { report.errors.push(error.stack || String(error)); }
finally {
  await browser?.close(); server.kill();
  writeFileSync(new URL('../qa-screenshots/qa-malla-integrated.json', import.meta.url), JSON.stringify(report, null, 2));
}
if (!report.ok) throw new Error(report.errors.join('\n'));
console.log(JSON.stringify(report));
