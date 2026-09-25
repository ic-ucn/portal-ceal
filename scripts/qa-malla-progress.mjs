import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const port = 18085;
const base = `http://127.0.0.1:${port}/?static=1&analytics=off`;
const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'ignore'
});
const report = { ok: false, checks: [], errors: [] };
let browser;
const key = 'portal.myCourses.v1';
const state = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const waitStatus = (page, plan, code, value) => page.waitForFunction(({ key, plan, code, value }) => {
  const saved = JSON.parse(localStorage.getItem(key) || 'null');
  return saved?.plans?.[plan]?.statuses?.[code] === value;
}, { key, plan, code, value });
const frame = page => page.frameLocator('[data-malla-frame]');
const loaded = async page => {
  await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
  await frame(page).locator('.mc-card[data-mc-code]').first().waitFor();
};

try {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  browser = await chromium.launch();
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const requests = [];
    page.on('pageerror', error => report.errors.push(`${width}px: ${error.message}`));
    page.on('request', request => {
      if (/\/api\/|goatcounter|cloudflareinsights/.test(request.url())) requests.push(request.url());
    });
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.my-courses-selected .my-course-card').count(), 0, 'fresh Mis ramos is empty');
    await page.goto(`${base}#/mallas`, { waitUntil: 'networkidle' });
    await loaded(page);
    assert.equal(await page.locator('.malla-embed-frame-wrap.is-fallback').count(), 0, 'live remote curriculum loads');
    assert.match(await page.locator('[data-malla-progress-count]').innerText(), /0 de 64 aprobados/);
    const card = frame(page).locator('.mc-card[data-mc-code]').first();
    const rawCode = await card.getAttribute('data-mc-code');
    const courseCode = await page.evaluate(code => CURRICULA.planP.subjects.find(course => course.code === code || course.visibleCode === code)?.code, rawCode);
    assert.ok(courseCode, 'remote card resolves to canonical code');
    await frame(page).locator('html').evaluate(element => { element.dataset.qaFramePreserved = 'yes'; });
    await page.locator('[data-malla-mark-toggle]').click();
    await frame(page).locator('html.mc-portal-marking').waitFor();
    await card.click();
    await card.locator('.mc-portal-approved-label').waitFor();
    assert.equal((await state(page)).plans.planP.statuses[courseCode], 'aprobado');
    assert.equal((await state(page)).plans.planP.selected.length, 0, 'approval leaves panel selection empty');
    assert.equal(await frame(page).locator('.mc-modal-overlay--visible').count(), 0, 'mark mode does not open course modal');
    assert.match(await page.locator('[data-malla-progress-count]').innerText(), /1 de 64 aprobados/);
    await page.locator('[data-malla-mark-toggle]').click();
    await frame(page).locator('html:not(.mc-portal-marking)').waitFor();
    await card.click();
    await frame(page).locator('.mc-modal-overlay--visible').waitFor();
    await page.locator('[data-malla-mark-toggle]').click();
    await frame(page).locator('html.mc-portal-marking').waitFor();
    assert.equal(await frame(page).locator('.mc-modal-overlay--visible').count(), 0, 'returning to marking closes modal');
    await page.locator('[data-malla-mark-semester]').selectOption('2');
    const before = await state(page);
    const eligible = await page.evaluate(() => CURRICULA.planP.subjects.filter(course => course.semester <= 2).map(course => course.code));
    const pending = eligible.filter(code => before.plans.planP.statuses[code] !== 'aprobado');
    assert.match(await page.locator('[data-malla-batch-preview]').innerText(), new RegExp(`^${pending.length} ramos? pendientes?`));
    await page.locator('[data-malla-mark-batch]').click();
    await waitStatus(page, 'planP', pending[0], 'aprobado');
    const after = await state(page);
    assert.ok(eligible.every(code => after.plans.planP.statuses[code] === 'aprobado'));
    assert.equal(after.plans.planP.selected.length, 0);
    assert.equal(await frame(page).locator('html').getAttribute('data-qa-frame-preserved'), 'yes', 'marking preserves iframe state');
    const layout = await page.evaluate(() => ({ frameHeight: document.querySelector('[data-malla-frame-wrap]').getBoundingClientRect().height, overflow: document.documentElement.scrollWidth > innerWidth }));
    assert.ok(layout.frameHeight >= 200, `${width}px keeps usable iframe height`);
    assert.equal(layout.overflow, false, `${width}px has no overflow while marking`);
    await frame(page).locator('.mc-portal-approved').nth(eligible.length - 1).waitFor();
    if (width !== 320) await page.screenshot({ path: fileURLToPath(new URL(`../qa-screenshots/malla-marking-${width}.png`, import.meta.url)) });
    const changedCode = pending[0];
    const changedCard = frame(page).locator(`.mc-card[data-mc-code="${changedCode}"]`).first();
    await changedCard.click();
    await waitStatus(page, 'planP', changedCode, 'pendiente');
    assert.equal((await state(page)).plans.planP.statuses[changedCode], 'pendiente');
    await page.locator('[data-malla-mark-undo]').click();
    await page.waitForFunction(({ key, code }) => {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      return saved?.plans?.planP?.statuses?.[code] !== 'aprobado';
    }, { key, code: pending[1] });
    const undone = await state(page);
    assert.equal(undone.plans.planP.statuses[changedCode], 'pendiente', 'undo preserves later manual edit');
    assert.ok(pending.slice(1).every(code => undone.plans.planP.statuses[code] !== 'aprobado'));
    assert.equal(undone.plans.planP.statuses[courseCode], 'aprobado', 'undo keeps approval from before batch');
    await page.locator('[data-malla-embed-plan="o"]').click();
    await loaded(page);
    assert.equal((await state(page)).plans.planO.selected.length, 0);
    assert.match(await page.locator('[data-malla-progress-count]').innerText(), /0 de 61 aprobados/);
    assert.equal(await page.locator('[data-malla-mark-semester] option').count(), 10);
    await page.locator('[data-malla-mark-semester]').selectOption('10');
    await page.locator('[data-malla-mark-batch]').click();
    await page.waitForFunction(key => Object.values(JSON.parse(localStorage.getItem(key) || 'null')?.plans?.planO?.statuses || {}).filter(value => value === 'aprobado').length === 61, key);
    assert.equal(Object.values((await state(page)).plans.planO.statuses).filter(value => value === 'aprobado').length, 61);
    await page.locator('[data-malla-embed-plan="p"]').click();
    await loaded(page);
    assert.equal(await page.locator('[data-malla-mark-semester] option').count(), 11);
    assert.equal((await state(page)).plans.planP.statuses[changedCode], 'pendiente', 'plan switch keeps P state');
    await page.reload({ waitUntil: 'networkidle' });
    await loaded(page);
    assert.equal((await state(page)).plans.planO.statuses[Object.keys((await state(page)).plans.planO.statuses)[0]], 'aprobado');
    assert.equal(await frame(page).locator('.mc-portal-approved').count(), 1, 'approved P card is repainted on reload');
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.my-courses-selected .my-course-card').count(), 0, 'batch approval never seeds selection');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow');
    assert.deepEqual(requests, [], 'marking sends no API or analytics requests');
    report.checks.push(`${width}px: remote O/P, individual, batch, undo, reload, empty selection, privacy`);
    await context.close();
  }
  const fallback = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const fallbackPage = await fallback.newPage();
  await fallbackPage.route('https://ic-ucn.github.io/**', route => route.abort());
  await fallbackPage.goto(`${base}#/mallas`, { waitUntil: 'networkidle' });
  await loaded(fallbackPage);
  assert.equal(await fallbackPage.locator('.malla-embed-frame-wrap.is-fallback').count(), 1);
  await fallbackPage.locator('[data-malla-mark-toggle]').click();
  await frame(fallbackPage).locator('html.mc-portal-marking').waitFor();
  const fallbackCode = await frame(fallbackPage).locator('.mc-card[data-mc-code]').first().getAttribute('data-mc-code');
  await frame(fallbackPage).locator('.mc-card[data-mc-code]').first().click();
  await waitStatus(fallbackPage, 'planP', fallbackCode, 'aprobado');
  assert.equal((await state(fallbackPage)).plans.planP.statuses[fallbackCode], 'aprobado');
  await fallbackPage.locator('[data-malla-embed-plan="o"]').click();
  await loaded(fallbackPage);
  await frame(fallbackPage).locator('.mc-semester-select').selectOption('3');
  assert.equal(await frame(fallbackPage).locator('.mc-semester:not([hidden])').count(), 1);
  report.checks.push('fallback iframe: approval and mobile semester switching');
  await fallback.close();

  const quota = await browser.newContext();
  await quota.addInitScript(key => {
    const oldSet = Storage.prototype.setItem;
    window.__courseWrites = 0;
    Storage.prototype.setItem = function(name, value) {
      if (name === key) { window.__courseWrites++; throw new Error('quota'); }
      return oldSet.call(this, name, value);
    };
  }, key);
  const quotaPage = await quota.newPage();
  await quotaPage.route('https://ic-ucn.github.io/**', route => route.abort());
  await quotaPage.goto(`${base}#/mallas`, { waitUntil: 'networkidle' });
  await loaded(quotaPage);
  await quotaPage.locator('[data-malla-mark-toggle]').click();
  await frame(quotaPage).locator('html.mc-portal-marking').waitFor();
  await quotaPage.locator('[data-malla-mark-semester]').selectOption('2');
  await quotaPage.locator('[data-malla-mark-batch]').click();
  await quotaPage.waitForFunction(() => window.__courseWrites === 1);
  assert.equal(await quotaPage.evaluate(() => window.__courseWrites), 1, 'batch attempts one atomic storage write');
  assert.match(await quotaPage.locator('[data-malla-mark-notice]').innerText(), /impide guardar/);
  assert.equal(await quotaPage.evaluate(key => localStorage.getItem(key), key), null);
  assert.ok(await frame(quotaPage).locator('.mc-portal-approved').count() > 1, 'temporary state is fully painted');
  report.checks.push('quota: one write, complete in-memory change, visible warning');
  await quota.close();

  const future = await browser.newContext();
  await future.addInitScript(key => localStorage.setItem(key, JSON.stringify({ version: 2, plans: {} })), key);
  const futurePage = await future.newPage();
  await futurePage.route('https://ic-ucn.github.io/**', route => route.abort());
  await futurePage.goto(`${base}#/mallas`, { waitUntil: 'networkidle' });
  await loaded(futurePage);
  assert.equal(await futurePage.locator('[data-malla-mark-toggle]').isDisabled(), true, 'future storage version blocks marking');
  assert.equal(await futurePage.evaluate(key => JSON.parse(localStorage.getItem(key)).version, key), 2);
  await future.close();
  report.checks.push('future storage version: marking disabled without overwrite');

  const tabs = await browser.newContext();
  const mallaTab = await tabs.newPage();
  const coursesTab = await tabs.newPage();
  await mallaTab.route('https://ic-ucn.github.io/**', route => route.abort());
  await mallaTab.goto(`${base}#/mallas`, { waitUntil: 'networkidle' });
  await loaded(mallaTab);
  await coursesTab.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
  const tabCode = await coursesTab.locator('.my-course-option').first().getAttribute('data-my-course-option');
  const tabFirst = coursesTab.locator('.my-course-option').first();
  const tabName = await tabFirst.locator('small').innerText();
  const tabVisibleCode = tabName.split(' · ')[0];
  const tabCanonical = await coursesTab.evaluate(code => CURRICULA.planP.subjects.find(course => course.code === code || course.visibleCode === code)?.code, tabVisibleCode);
  assert.ok(tabCanonical || tabCode);
  await tabFirst.getByRole('button', { name: 'Agregar' }).click();
  await coursesTab.locator(`[data-my-course-status="${tabCanonical}"]`).selectOption('aprobado');
  await mallaTab.locator('[data-malla-progress-count]').getByText('1 de 64 aprobados').waitFor();
  await frame(mallaTab).locator(`.mc-card[data-mc-code="${tabCanonical}"].mc-portal-approved`).waitFor();
  await tabs.close();
  report.checks.push('two tabs: Mis ramos status updates the open malla');
  report.ok = report.errors.length === 0;
} catch (error) {
  report.errors.push(error.stack || String(error));
} finally {
  await browser?.close();
  server.kill();
  mkdirSync(new URL('../qa-screenshots/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../qa-screenshots/qa-malla-progress.json', import.meta.url), JSON.stringify(report, null, 2));
}
if (!report.ok) throw new Error(report.errors.join('\n'));
console.log(JSON.stringify(report));
