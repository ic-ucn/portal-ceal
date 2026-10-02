import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const sandbox = { window: {}, structuredClone, localStorage: { getItem: () => null } };
vm.runInNewContext(readFileSync(`${root}/src/my-courses.js`, 'utf8'), sandbox);
vm.runInNewContext(readFileSync(`${root}/data/curricula.js`, 'utf8'), sandbox);
const advice = sandbox.window.PortalMyCourses;
const course = (code, prereqs = [], requirements = []) => ({ code, name: code, semester: 1, sct: 5, prereqs, requirements });
const subjects = [course('A'), course('B', ['A']), course('C', ['A', 'B']), course('D', [], ['Exact additional rule <img src=x>'])];
const snapshot = JSON.stringify(subjects);
const evaluate = (code, statuses = {}, list = subjects) => advice.evaluateCourse(list, statuses, list.find(item => item.code === code));
assert.equal(evaluate('A').category, 'met', 'no approvals still allows no-prerequisite candidates');
assert.equal(evaluate('B', { A: 'aprobado' }).category, 'met');
assert.equal(evaluate('B', { A: 'cursando' }).category, 'missing');
assert.deepEqual(Array.from(evaluate('B', { A: 'cursando' }).inProgress), ['A']);
assert.equal(evaluate('B', { A: 'invalid' }).category, 'missing');
assert.equal(evaluate('C', { A: 'aprobado' }).category, 'missing', 'AND does not accept one of two prerequisites');
assert.equal(evaluate('D').category, 'review');
assert.equal(evaluate('D').extraRequirements[0], subjects[3].requirements[0], 'additional text stays exact');
assert.equal(evaluate('B', {}, [course('A'), course('B', ['A'], ['Extra'])]).category, 'missing', 'missing direct prerequisite retains precedence over extra rule');
for (const list of [[course('B', ['NO'])], [course('A'), course('A'), course('B', ['A'])], [course('A'), course('B', ['A', 'A'])], [course('B', [null])], [course('B', ['B'])], [{ ...course('B'), prereqs: undefined }], [{ ...course('B'), requirements: 'bad' }]]) {
  assert.equal(evaluate('B', { A: 'aprobado', NO: 'aprobado' }, list).category, 'review', 'unresolved, duplicated or malformed data fails conservatively');
}
assert.equal(evaluate('A', {}, [course('A'), course('A')]).category, 'review');
assert.deepEqual(Array.from(advice.evaluatePlan(subjects, { A: 'aprobado', B: 'cursando', FOREIGN: 'aprobado' }), item => item.code), ['D', 'C']);
assert.equal(JSON.stringify(subjects), snapshot, 'evaluator does not mutate input');
for (const [plan, catalogue] of Object.entries(sandbox.window.CURRICULA)) {
  const empty = advice.evaluatePlan(catalogue.subjects, {});
  assert.ok(empty.some(item => item.category === 'met'), `${plan}: empty history has candidates`);
  const approved = Object.fromEntries(catalogue.subjects.map(item => [item.code, 'aprobado']));
  assert.equal(advice.evaluatePlan(catalogue.subjects, approved).length, 0);
  for (const item of catalogue.subjects.filter(item => item.requirements.length)) assert.equal(advice.evaluateCourse(catalogue.subjects, approved, item).category, 'review', 'additional rules stay review even after all direct prerequisites approved');
}

const port = 18087, base = `http://127.0.0.1:${port}/?static=1&analytics=off`, key = 'portal.myCourses.v1';
const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, windowsHide: true, stdio: 'ignore' });
const report = { ok: false, checks: ['pure evaluator: AND, cursando, invalid/duplicate/unresolved data, extra rules, empty history, isolation, immutable inputs'], errors: [] };
let browser;
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 150)); }
  browser = await chromium.launch();
  for (const [width, height, source] of [[1440, 900, 'remote'], [390, 844, 'remote'], [320, 568, 'fallback']]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await context.route('https://ic-ucn.github.io/**', route => source === 'fallback' ? route.abort() : route.fulfill({ body: readFileSync(`${root}/original-mallas/malla-${new URL(route.request().url()).pathname.endsWith('malla-o.html') ? 'o' : 'p'}.html`, 'utf8'), contentType: 'text/html' }));
    const page = await context.newPage(), requests = [];
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => { if (/\/api\/|goatcounter|cloudflareinsights/.test(request.url())) requests.push(request.url()); });
    await page.goto(`${base}#/mallas?view=mis-ramos&section=eligible`, { waitUntil: 'networkidle' });
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor({ state: 'attached' });
    const select = page.locator('[data-my-courses-view]');
    assert.equal(await select.inputValue(), 'eligible');
    assert.ok(await page.locator('[data-eligibility-category="met"] [data-eligibility-code]').count() > 0);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null, 'derived views make no storage writes');
    await page.locator('[data-eligibility-code="P-0101"] [data-malla-detail]').click();
    const dialog = page.locator('[data-malla-course-dialog]');
    await dialog.locator('[data-my-course-status]').filter({ hasText: /^Actual$/ }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-eligibility-code="P-0101"]').count(), 0);
    await page.locator('[data-eligibility-category="missing"] summary').click();
    const calculus = page.locator('[data-eligibility-code="P-0201"]');
    assert.match(await calculus.innerText(), /cursando, aún no aprobado/);
    await calculus.locator('[data-malla-detail]').click();
    assert.match(await dialog.innerText(), /Falta aprobar: Introducción Al Cálculo \(cursando, aún no aprobado\)/i);
    await dialog.locator('[data-malla-detail-close]').click();
    assert.equal(await page.evaluate(() => document.activeElement.dataset.mallaDetail), 'P-0201');
    await select.selectOption('semester');
    assert.equal(await page.locator('[data-my-course-card="P-0101"]').count(), 1, 'cursando appears independently of selection');
    assert.match(await page.locator('.my-courses-semester').innerText(), /1 ramo · 5 SCT/);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).plans.planP.selected, key), []);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await select.inputValue(), 'semester', 'URL restores derived section');
    await page.locator('[data-my-course-card="P-0101"] [data-my-course-status]').first().focus();
    await page.locator('[data-my-course-card="P-0101"] [data-my-course-status]').filter({ hasText: /^Aprobado$/ }).click();
    assert.equal(await page.locator('[data-my-course-card="P-0101"]').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-my-courses-view')), true, 'removed semester row focuses view selector');
    await select.selectOption('eligible');
    assert.equal(await page.locator('[data-eligibility-category="met"] [data-eligibility-code="P-0201"]').count(), 1);
    await page.locator('[data-eligibility-category="review"] summary').click();
    const practice = page.locator('[data-eligibility-code="P-0506"]');
    assert.match(await practice.innerText(), /Nota 3: requiere hasta IV semestre aprobado\./);
    await practice.locator('[data-malla-detail]').click();
    assert.match(await dialog.innerText(), /Nota 3: requiere hasta IV semestre aprobado\./);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { CURRICULA.planP.subjects.find(c => c.code === 'P-0506').requirements = ['<img src=x onerror="window.badAdvice=true">']; });
    await select.selectOption('selected'); await select.selectOption('eligible');
    await page.locator('[data-eligibility-category="review"] summary').click();
    assert.equal(await page.locator('[data-eligibility-code="P-0506"] img').count(), 0, 'source text is escaped');
    assert.equal(await page.evaluate(() => window.badAdvice), undefined);
    const currentFrame = await page.locator('[data-malla-frame]').elementHandle();
    await select.selectOption('semester'); await select.selectOption('eligible');
    assert.equal(await currentFrame.evaluate(element => element.isConnected), true, 'derived section switches preserve iframe');
    await page.locator('[data-malla-embed-plan="o"]').click();
    assert.equal(await select.inputValue(), 'eligible');
    assert.equal(await page.locator('[data-eligibility-code="P-0201"]').count(), 0);
    await select.selectOption('semester');
    assert.equal(await page.locator('.my-courses-semester [data-my-course-card]').count(), 0, 'plan O does not borrow P statuses');
    await page.locator('[data-malla-embed-plan="p"]').click();
    await select.selectOption('eligible');
    await page.locator('.malla-personal-content').evaluate(element => { element.scrollTop = 0; });
    mkdirSync(`${root}/qa-screenshots`, { recursive: true });
    await page.screenshot({ path: `${root}/qa-screenshots/malla-advice-${width}.png` });
    if (width === 390) assert.ok(await page.locator('[data-eligibility-category="met"] .my-course-option').first().evaluate(element => element.getBoundingClientRect().top < innerHeight - 100), 'first candidate is above mobile fold');
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, panel: document.querySelector('.malla-personal-panel').getBoundingClientRect().bottom, nav: document.querySelector('.bottom-nav').getBoundingClientRect().top }));
    assert.equal(geometry.overflow, false);
    if (width <= 920) assert.ok(geometry.panel <= geometry.nav, 'mobile panel clears navigation');
    assert.deepEqual(requests, [], 'no personal API or analytics');
    // Another tab updates a prerequisite while this tab displays derived advice.
    const other = await context.newPage();
    await other.goto(`${base}#/mallas?view=mis-ramos`, { waitUntil: 'networkidle' });
    await other.locator('[data-my-courses-search]').fill('P-0101');
    await other.locator('.my-courses-list [data-malla-detail="P-0101"]').click();
    await other.locator('[data-malla-course-dialog] [data-my-course-status]').filter({ hasText: /^Aprobado$/ }).click();
    await page.waitForFunction(() => document.querySelector('[data-eligibility-category="missing"] [data-eligibility-code="P-0201"]'));
    await page.locator(`${width > 920 ? '.sidebar .nav' : '.bottom-nav'} a[href="#/material"]`).click();
    await page.goBack();
    await select.waitFor();
    assert.equal(await select.inputValue(), 'eligible', 'browser history restores section');
    report.checks.push(`${source}/${width}: candidates, manual state, credits, requirements, escaping, focus, URL/reload/history, plans, cross-tab, privacy, iframe, mobile layout`);
    await context.close();
  }
  report.ok = report.errors.length === 0;
} catch (error) { report.errors.push(error.stack || String(error)); }
finally { await browser?.close(); server.kill(); }
mkdirSync(`${root}/qa-screenshots`, { recursive: true });
writeFileSync(`${root}/qa-screenshots/qa-malla-advice-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
