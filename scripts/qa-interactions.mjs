import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 18082;
const db = fileURLToPath(new URL(`../.data/qa-interactions-${process.pid}.json`, import.meta.url));
const output = new URL('../qa-screenshots/', import.meta.url);
const report = { ok: false, scenarios: [], errors: [] };
const server = spawn(process.execPath, ['server.mjs'], {
  cwd: root, windowsHide: true, stdio: 'ignore',
  env: { ...process.env, PORT: String(port), PORTAL_STATE_BACKEND: 'local', PORTAL_DB_PATH: db, QA_TEST_MODE: '1' }
});
await mkdir(output, { recursive: true });
let browser;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { ready = (await fetch(`http://127.0.0.1:${port}/api/health`)).ok; } catch {}
    if (ready) break;
    await sleep(150);
  }
  assert.ok(ready, 'isolated QA service starts');
  for (const config of [
    { engine: 'chromium', width: 1440, mode: 'static' },
    { engine: 'chromium', width: 390, mode: 'static' },
    { engine: 'chromium', width: 1440, mode: 'api' },
    { engine: 'chromium', width: 390, mode: 'api' },
    { engine: 'webkit', width: 390, mode: 'static' }
  ]) {
    const { engine, width, mode } = config;
    browser = await (engine === 'webkit' ? webkit : chromium).launch();
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(() => { window.PORTAL_SIGN_IN_ENABLED = true; });
    page.on('pageerror', error => report.errors.push({ ...config, message: error.message }));
    await page.route('https://ic-ucn.github.io/**', route => route.abort());
    await page.route('https://drive.google.com/**', route => route.abort());
    const url = route => `http://127.0.0.1:${port}/?qa=1${mode === 'static' ? '&static=1' : ''}#${route}`;
    const record = (name, extra = {}) => report.scenarios.push({ ...config, name, ...extra });
    const scroll = () => page.evaluate(() => window.scrollY);
    const positionTarget = async locator => {
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      return scroll();
    };
    const stays = async (expected, message) => {
      await page.waitForTimeout(350);
      assert.ok(Math.abs(await scroll() - expected) <= 2, `${engine}/${width}/${mode}: ${message}; ${expected} → ${await scroll()}`);
    };
    const visit = async route => {
      await page.goto(url(route), { waitUntil: 'networkidle' });
      await page.locator('.page-title, .malla-commandbar-title').first().waitFor();
    };
    await page.goto(url('/login'));
    await page.locator('[data-dev-login="student"]').click();
    await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
    await page.waitForLoadState('networkidle');
    await visit('/calendario');
    const month = await page.locator('.calendar-card-head h2').innerText();
    const next = page.locator('.calendar-next-row').nth(2);
    for (const close of ['button', 'escape', 'backdrop']) {
      const before = await positionTarget(next);
      if (width <= 920) assert.ok(before > 100, 'the mobile regression is exercised below the top of the page');
      await next.click();
      await page.getByRole('dialog').waitFor();
      await stays(before, `upcoming event opens in place (${close})`);
      assert.equal(await page.locator('.calendar-card-head h2').innerText(), month, 'opening a future event does not replace the background month');
      assert.equal(await page.locator('.app-main').evaluate(node => node.inert), true, 'calendar dialog makes covered content inert');
      if (close === 'button') await page.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
      if (close === 'escape') await page.keyboard.press('Escape');
      if (close === 'backdrop') await page.locator('.calendar-detail-backdrop').click({ position: { x: 2, y: 2 } });
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await stays(before, `upcoming event closes in place (${close})`);
      assert.equal(await next.evaluate(node => node === document.activeElement), true, 'focus returns to the exact upcoming card');
      record(`calendar upcoming card/${close}`, { scroll: before });
    }
    const agenda = page.locator('.calendar-agenda-row').last();
    const agendaBefore = await positionTarget(agenda);
    await agenda.click();
    await page.keyboard.press('Escape');
    await stays(agendaBefore, 'month agenda preserves position');
    assert.equal(await agenda.evaluate(node => node === document.activeElement), true, 'focus returns to the agenda, not a duplicate day button');
    record('calendar month agenda and exact focus');
    const nextMonth = page.locator('[data-calendar-month="1"]');
    const monthBefore = await positionTarget(nextMonth);
    await nextMonth.click();
    await stays(monthBefore, 'month controls preserve position');
    assert.notEqual(await page.locator('.calendar-card-head h2').innerText(), month);
    record('calendar month control');

    await visit('/material');
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1300);
    assert.ok(await scroll() > 100, 'a new page never overrides the reader with a delayed top reset');
    record('no delayed scroll reset after navigation');
    const more = page.locator('[data-material-more]');
    const moreBefore = await positionTarget(more);
    await more.click();
    await stays(moreBefore, 'loading another page of materials preserves reading position');
    assert.equal(await page.locator('.resource-title-link').count(), 120);
    assert.equal(await page.locator(width > 920 ? '.resource-title-link' : '.material-list-item').nth(60).evaluate(node => node === document.activeElement), true, 'load more puts keyboard focus on the first added resource without scrolling');
    record('material load more', { scroll: moreBefore });
    const type = page.locator('[data-material-type="Guía"]');
    const filterBefore = await positionTarget(type);
    await type.click();
    await stays(filterBefore, 'type filter preserves position');
    assert.equal(await type.getAttribute('aria-pressed'), 'true');
    record('material type filter');
    const search = page.locator('[data-material-search]');
    await search.fill('est');
    await page.waitForTimeout(350);
    await search.press('End');
    await search.pressSequentially('atica');
    await page.waitForTimeout(350);
    assert.equal(await search.inputValue(), 'estatica', 'typing survives debounced repaints');
    assert.equal(await search.evaluate(node => node === document.activeElement && node.selectionStart === node.value.length), true);
    record('search retains focus and caret');
    await search.fill('');
    await page.waitForTimeout(350);
    const retainedQuery = await page.locator('.resource-title-link').first().textContent();
    await search.fill(retainedQuery);
    await page.waitForTimeout(350);
    const filteredItem = page.locator(width > 920 ? '.resource-title-link' : '.material-list-item').first();
    const filteredCount = await page.locator('.resource-title-link').count();
    await filteredItem.click();
    await page.locator('[data-save-resource]').waitFor();
    await page.getByRole('link', { name: 'Volver', exact: true }).click();
    assert.equal(await search.inputValue(), retainedQuery, 'returning from a resource retains the search');
    assert.equal(await type.getAttribute('aria-pressed'), 'true', 'returning retains the type filter');
    assert.equal(await page.locator('.resource-title-link').count(), filteredCount, 'returning retains the filtered collection');
    record('resource return retains search and filters');
    await page.locator('[data-material-clear="all"]').click();
    const itemSelector = width > 920 ? '.resource-title-link' : '.material-list-item';
    const item = page.locator(itemSelector).nth(12);
    const listBefore = await positionTarget(item);
    const destination = await item.getAttribute('href');
    await item.click();
    await page.waitForURL(new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await stays(0, 'a different resource page starts at its heading');
    await page.getByRole('link', { name: 'Volver', exact: true }).click();
    await page.waitForURL(/#\/material$/);
    await stays(listBefore, 'the return link restores the collection position');
    record('resource detail and return link', { scroll: listBefore });
    await item.click();
    await page.waitForURL(new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const save = page.locator('[data-save-resource]');
    const saveBefore = await positionTarget(save);
    // Click the visible control without Playwright's extra automatic scrolling.
    // This isolates application movement from the driver's actionability scroll.
    const saveBounds = await save.boundingBox();
    assert.ok(saveBounds && saveBounds.y >= 0 && saveBounds.y + saveBounds.height < 900);
    await page.mouse.click(saveBounds.x + saveBounds.width / 2, saveBounds.y + saveBounds.height / 2);
    await page.locator('.toast').waitFor();
    await stays(saveBefore, 'saving a resource does not move its page');
    await page.locator('[data-dismiss-toast]').click();
    await stays(saveBefore, 'dismissing feedback does not move its page');
    record('resource save and toast');
    await page.goBack();
    await page.waitForURL(/#\/material$/);
    await stays(listBefore, 'browser Back restores the collection position');
    await page.goForward();
    await page.waitForURL(new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await stays(saveBefore, 'browser Forward restores the detail position');
    record('browser Back and Forward');
    await page.goBack();
    const skipHash = new URL(page.url()).hash;
    await page.locator('.skip-link').focus();
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, skipHash, 'skip link must not be routed to a missing page');
    assert.equal(await page.locator('#main-content').evaluate(node => node === document.activeElement), true);
    record('skip link focus without navigation');

    if (width <= 920) {
      await visit('/mallas');
      await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
      const frame = page.frameLocator('.malla-embed-frame');
      const embedded = await (await page.locator('.malla-embed-frame').elementHandle()).contentFrame();
      await embedded.waitForFunction(() => [...document.fonts].some(font => font.family.replaceAll('"', '') === 'Instrument Sans' && font.status === 'loaded'));
      const semesters = frame.getByRole('combobox', { name: 'Seleccionar semestre' });
      await semesters.selectOption('3');
      await page.locator('.bottom-more').click();
      await page.getByRole('dialog', { name: 'Menú del portal' }).waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      assert.equal(await semesters.inputValue(), '3', 'opening the menu does not reload the curriculum iframe');
      assert.equal(await page.locator('.menu-sheet-backdrop').count(), 0, 'no orphan overlay intercepts later taps');
      await page.locator('[data-malla-embed-theme]').click();
      assert.equal(await semesters.inputValue(), '3', 'theme change preserves the curriculum state');
      record('menu and theme preserve curriculum selection');
      record('curriculum font loads inside its sandbox');
    }
    assert.deepEqual(report.errors, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
    console.log(JSON.stringify({ ...config, scenarios: report.scenarios.filter(row => row.engine === engine && row.width === width && row.mode === mode).length, ok: true }));
    await browser.close(); browser = null;
  }
  report.ok = true;
} catch (error) {
  report.errors.push(error.stack || String(error));
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill();
  await writeFile(new URL('interaction-report.json', output), JSON.stringify(report, null, 2));
  await rm(db, { force: true });
}
