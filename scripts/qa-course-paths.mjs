import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:18091/?static=1&analytics=off';
const server = spawn('python', ['-m', 'http.server', '18091', '--bind', '127.0.0.1'], { cwd: root, windowsHide: true, stdio: 'ignore' });
const report = { ok: false, checks: [], errors: [] };
let browser;
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch();
  for (const [width, height, source] of [[1440, 1000, 'remote'], [390, 844, 'remote'], [320, 568, 'fallback']]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await context.route('https://ic-ucn.github.io/**', route => source === 'fallback' ? route.abort() : route.fulfill({ body: readFileSync(`${root}/original-mallas/malla-${route.request().url().endsWith('malla-o.html') ? 'o' : 'p'}.html`, 'utf8'), contentType: 'text/html' }));
    const page = await context.newPage(), requests = [];
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('request', r => { if (/\/api\/|goatcounter|cloudflareinsights/.test(r.url())) requests.push(r.url()); });
    await page.goto(`${base}#/mallas?view=mis-ramos`, { waitUntil: 'networkidle' });
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor({ state: 'attached' });
    assert.equal(await page.locator('select[data-my-courses-view]').count(), 0);
    await page.getByRole('button', { name: 'Marcar mis actuales', exact: true }).click();
    assert.equal(await page.locator('[data-malla-mark-status="cursando"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.malla-personal-panel').isVisible(), false);
    await page.locator('[data-malla-view="personal"]').click();
    assert.equal(await page.locator('[data-malla-mark-panel]').isVisible(), false, 'Entering personal view exits marking');
    const expected = await page.evaluate(() => {
      const subjects = CURRICULA.planP.subjects;
      const statuses = Object.fromEntries(subjects.filter(c => c.semester <= 4).map(c => [c.code, c.semester < 4 ? 'aprobado' : 'cursando']));
      PortalMyCourses.updateStatuses('planP', statuses);
      const evaluated = PortalMyCourses.evaluatePlan(subjects, statuses);
      return { current: subjects.filter(c => statuses[c.code] === 'cursando').map(c => c.code), met: evaluated.filter(e => e.category === 'met').map(e => e.code), forecast: evaluated.filter(e => e.afterCurrent).map(e => ({ code:e.code, prerequisites:e.inProgress })) };
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor({ state: 'attached' });
    const iframe = await page.locator('[data-malla-frame]').elementHandle();
    assert.equal(await page.locator('.course-tile[data-my-course-card]').count(), expected.current.length);
    assert.equal(await page.locator('.course-tile [data-my-course-status]').count(), 0, 'Cards do not repeat the status editor');
    assert.ok(await page.locator('.malla-personal-panel').evaluate(el => el.clientWidth > document.querySelector('.malla-body').clientWidth * .95));
    await page.screenshot({ path: `${root}/qa-screenshots/course-current-${width}.png` });
    await page.locator('.courses-tabs [value="eligible"]').click();
    assert.equal(await page.locator('[data-course-outlook="afterCurrent"]').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.locator('[data-eligibility-code]').evaluateAll(els => els.map(el => el.dataset.eligibilityCode)), expected.forecast.map(e => e.code));
    const sourceCode = expected.forecast[0].prerequisites[0];
    await page.locator(`[data-course-focus="${sourceCode}"]`).click();
    assert.deepEqual(await page.locator('[data-eligibility-code]').evaluateAll(els => els.map(el => el.dataset.eligibilityCode)), expected.forecast.filter(e => e.prerequisites.includes(sourceCode)).map(e => e.code));
    const combined = expected.forecast.find(e => e.prerequisites.length > 1 && e.prerequisites.includes(sourceCode));
    if (combined) assert.equal(await page.locator(`[data-eligibility-code="${combined.code}"] .course-prereq-chip.is-current`).count(), combined.prerequisites.length, 'Multiple current prerequisites remain visible together');
    await page.locator(`[data-course-focus="${sourceCode}"]`).click();
    assert.equal(await page.locator('[data-eligibility-code]').count(), expected.forecast.length);
    for (const theme of ['light','dark']) {
      if (await page.locator('.malla-workspace').evaluate(el => el.classList.contains('is-dark')) !== (theme === 'dark')) await page.locator('[data-malla-embed-theme]').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const bounds = await page.locator('.malla-personal-panel').boundingBox();
      if (width < 700) assert.ok(bounds.y + bounds.height <= (await page.locator('.bottom-nav').boundingBox()).y);
      await page.locator('[data-malla-personal-content]').evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `${root}/qa-screenshots/course-path-${theme}-${width}.png` });
    }
    const before = await page.evaluate(() => JSON.stringify(PortalMyCourses.read()));
    await page.locator('[data-courses-map]').click();
    const frame = page.frameLocator('[data-malla-frame]');
    await frame.locator('.mc-portal-match').first().waitFor({ state:'attached' });
    assert.equal(await frame.locator('.mc-portal-outlook-label').count(), expected.forecast.length);
    assert.equal(await frame.locator('.mc-portal-match').count(), expected.forecast.length + expected.current.length);
    await page.screenshot({ path: `${root}/qa-screenshots/course-map-${width}.png` });
    await page.locator('[data-malla-outlook="met"]').click();
    await frame.locator('.mc-portal-outlook-label').filter({ hasText:'Prerreq. listos' }).first().waitFor({ state:'attached' });
    assert.equal(await frame.locator('.mc-portal-outlook-label').count(), expected.met.length);
    await page.locator('[data-malla-outlook="all"]').click();
    await frame.locator('.mc-portal-outlook-label').first().waitFor({ state:'detached' });
    assert.equal(await frame.locator('.mc-portal-outlook-label').count(), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(PortalMyCourses.read())), before, 'Exploration never changes marks or saved courses');
    await page.locator('[data-malla-view="personal"]').click();
    await page.locator('[data-course-outlook="met"]').click();
    assert.equal(await page.locator('[data-eligibility-code]').count(), expected.met.length);
    await page.locator('[data-course-outlook="other"]').click();
    const any = page.locator('[data-eligibility-code] [data-malla-detail]').first();
    const code = await any.getAttribute('data-malla-detail');
    await any.click();
    await page.locator('[data-malla-course-dialog]').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.mallaDetail), code);
    await page.locator('[data-my-courses-view][value="selected"]').click();
    await page.locator('[data-my-courses-search]').fill('P-0101');
    await page.locator('[data-my-course-add="P-0101"]').click();
    assert.equal(await page.locator('[data-my-course-card="P-0101"]').count(), 1, 'Saved courses retained as a secondary tool');
    await page.locator('.courses-tabs [value="semester"]').click();
    const activity = page.locator('[data-my-course-card]').first().locator('.course-tile-activity');
    const destination = await activity.getAttribute('href');
    await activity.click();
    assert.equal(new URL(page.url()).hash, destination);
    assert.equal(await page.locator('[name="course"]').inputValue(), expected.current[0]);
    await page.goBack();
    assert.equal(await page.locator('.courses-tabs [value="semester"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-malla-embed-plan="o"]').click();
    assert.equal(await page.locator('[data-my-course-card]').count(), 0, 'Separate plan data');
    assert.deepEqual(requests, []);
    report.checks.push(`${source}/${width}: empty-to-marking, full canvas, conditional paths, source filter/clear, multi-prerequisites, map highlighting/reset, no data writes from exploration, material/activity/detail/focus/saved state, plan isolation, light/dark and mobile layout`);
    await context.close();
  }
  report.ok = report.errors.length === 0;
} catch (e) { report.errors.push(e.stack || String(e)); }
finally { await browser?.close(); server.kill(); mkdirSync(`${root}/qa-screenshots`, { recursive:true }); writeFileSync(`${root}/qa-screenshots/qa-course-paths.json`, JSON.stringify(report,null,2)); }
console.log(JSON.stringify(report));
if (!report.ok) process.exitCode = 1;
