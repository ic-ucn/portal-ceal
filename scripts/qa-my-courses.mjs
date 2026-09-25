import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = readFileSync(new URL('../src/my-courses.js', import.meta.url), 'utf8');
const key = 'portal.myCourses.v1';
function moduleWith(storage) {
  const window = {};
  vm.runInNewContext(source, { window, localStorage: storage, structuredClone }, { filename: 'my-courses.js' });
  return window.PortalMyCourses;
}
function testStorage() {
  const items = new Map();
  let denyWrite = false;
  const storage = {
    getItem: k => items.get(k) ?? null,
    setItem: (k, v) => { if (denyWrite) throw new Error('quota'); items.set(k, v); }
  };
  const store = moduleWith(storage);
  store.update('planO', 'DAFI-00103', 'select');
  store.update('planO', 'DAFI-00103', 'status', 'aprobado');
  store.update('planP', 'DAFI-00103', 'select');
  store.setPlan('planO');
  assert.equal(moduleWith(storage).read().activePlan, 'planO');
  assert.equal(store.read().plans.planO.statuses['DAFI-00103'], 'aprobado');
  assert.equal(store.read().plans.planP.statuses['DAFI-00103'], undefined);
  denyWrite = true;
  store.update('planO', 'DAFI-00103', 'remove');
  assert.deepEqual(Array.from(store.read().plans.planO.selected), [], 'failed write retains memory changes');
  assert.match(store.status().issue, /impide guardar/);
  store.externalChange();
  assert.equal(store.status().conflict, true);
  assert.deepEqual(Array.from(store.read().plans.planO.selected), [], 'external change keeps temporary edits');
  assert.equal(store.update('planO', 'DAFI-00103', 'select'), false, 'conflict blocks mutation');
  assert.equal(store.resolveConflict('temporary'), false, 'quota denial keeps conflict');
  denyWrite = false;
  assert.equal(store.resolveConflict('temporary'), true);
  assert.deepEqual(Array.from(store.read().plans.planO.selected), []);
  denyWrite = true;
  store.update('planO', 'DAFI-00103', 'select');
  store.externalChange();
  assert.equal(store.resolveConflict('saved'), true);
  assert.deepEqual(Array.from(store.read().plans.planO.selected), [], 'explicit saved version discards temporary edit');
  store.update('planO', 'DAFI-00103', 'select');
  items.set(key, JSON.stringify({ version: 2, plans: {} }));
  store.externalChange();
  denyWrite = false;
  assert.equal(store.resolveConflict('temporary'), false, 'temporary edits cannot replace a newer stored version');
  assert.equal(JSON.parse(items.get(key)).version, 2, 'newer stored version remains intact');
  assert.deepEqual(Array.from(store.read().plans.planO.selected), ['DAFI-00103'], 'temporary edits remain in memory');
  assert.match(store.status().issue, /versión más reciente/);
  assert.equal(store.status().conflict, true);
  assert.equal(store.resolveConflict('saved'), true, 'explicitly choosing saved version releases temporary edits');
  items.set(key, '{');
  store.read(true);
  assert.equal(store.status().recoverable, true);
  assert.equal(store.update('planO', 'DAFI-00103', 'select'), false, 'corrupt storage requires recovery');
  assert.equal(store.recover(), true);
  assert.equal(store.read().plans.planO.selected.length, 0);
  items.set(key, JSON.stringify({ version: 2, plans: {} }));
  store.read(true);
  assert.equal(store.status().locked, true);
  assert.equal(store.status().recoverable, false);
  assert.equal(store.update('planO', 'DAFI-00103', 'select'), false);
  assert.equal(JSON.parse(items.get(key)).version, 2);
  items.set(key, JSON.stringify({ version: 1, plans: { planO: { selected: [8], statuses: {} }, planP: { selected: [], statuses: {} } } }));
  store.read(true);
  assert.equal(store.status().recoverable, true, 'invalid types require explicit recovery');
  items.set(key, JSON.stringify({ version: 1, plans: { planO: { selected: ['ORPHAN', 'ORPHAN'], statuses: { ORPHAN: 'aprobado' } }, planP: { selected: [], statuses: {} } } }));
  store.read(true);
  assert.deepEqual(Array.from(store.read().plans.planO.selected), ['ORPHAN'], 'unknown course is preserved, duplicate removed');
  assert.equal(store.read().plans.planO.statuses.ORPHAN, 'aprobado');
  items.delete(key);
  store.read(true);
  assert.equal(store.read().plans.planO.selected.length, 0, 'external removal clears old memory');
  const denied = moduleWith({ getItem: () => { throw new Error('security'); }, setItem: () => { throw new Error('security'); } });
  denied.update('planO', 'DAFI-00103', 'select');
  assert.deepEqual(Array.from(denied.read().plans.planO.selected), ['DAFI-00103']);
  assert.match(denied.status().issue, /impide guardar/);
  const curricula = { planO: { subjects: [{ code: 'SHARED', name: 'Curso Antiguo' }] }, planP: { subjects: [{ code: 'SHARED', name: 'Curso Nuevo' }] } };
  const resources = [
    { id: 'o', plan: 'planO', courseCode: 'SHARED', courseName: 'Curso Antiguo' },
    { id: 'p', plan: 'planP', courseCode: 'SHARED', courseName: 'Curso Nuevo' },
    { id: 'both', plan: 'both', courseCode: 'SHARED', courseName: 'Curso Nuevo' },
    { id: 'none', courseCode: 'SHARED', courseName: 'Curso Antiguo' },
    { id: 'related', plan: 'planP', courseCode: 'OTHER', courseName: 'Curso Nuevo' },
    { id: 'bad', plan: 'both', courseCode: 'SHARED', courseName: 'Otro curso' },
    { id: 'p', plan: 'planP', courseCode: 'SHARED', courseName: 'Curso Nuevo' }
  ];
  assert.deepEqual(Array.from(store.resourcesForCourse(curricula, resources, 'planP', 'SHARED'), r => r.id), ['p', 'both', 'related']);
  assert.deepEqual(Array.from(store.resourcesForCourse(curricula, resources, 'planO', 'SHARED'), r => r.id), ['o', 'none']);
}

const report = { ok: false, checks: [], errors: [] };
testStorage();
report.checks.push('storage: plans, status, quota, corruption, future version, external removal, denial');
const port = 18083;
const server = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: new URL('../', import.meta.url), windowsHide: true, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/?qa=1&static=1&analytics=off`;
let browser;
let apiServer;
const apiDb = fileURLToPath(new URL(`../.data/qa-my-courses-${process.pid}.json`, import.meta.url));
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 150)); }
  browser = await chromium.launch();
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const requests = [];
    page.on('request', request => { if (/\/api\/|goatcounter|cloudflareinsights/.test(request.url())) requests.push(request.url()); });
    page.on('pageerror', error => report.errors.push(error.message));
    await page.route('https://ic-ucn.github.io/**', route => route.abort());
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Mis ramos', exact: true }).waitFor();
    assert.equal(await page.locator('.bottom-nav .bottom-item').count(), 5);
    const first = page.locator('.my-course-option').first();
    const code = await first.locator('small').innerText().then(s => s.split(' · ')[0]);
    await first.getByRole('button', { name: 'Agregar' }).click();
    assert.match(await page.locator('.my-courses-selected').innerText(), /0 de 1 ramo seleccionado aprobado/);
    await page.locator(`[data-my-course-status="${code}"]`).selectOption('aprobado');
    assert.match(await page.locator('.my-courses-selected').innerText(), /1 de 1 ramo seleccionado aprobado/);
    await page.locator(`.my-courses-selected [data-my-course-remove="${code}"]`).click();
    await page.locator(`.my-courses-list [data-my-course-add="${code}"]`).click();
    assert.equal(await page.locator(`[data-my-course-status="${code}"]`).inputValue(), 'aprobado');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator(`[data-my-course-status="${code}"]`).inputValue(), 'aprobado');
    await page.getByRole('button', { name: 'Plan O' }).click();
    assert.equal(await page.locator('.my-courses-selected .my-course-card').count(), 0);
    await page.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
    assert.equal(await page.locator('.my-courses-selected .my-course-card').count(), 1);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-my-courses-plan="planO"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.my-courses-selected .my-course-card').count(), 1);
    await page.getByRole('button', { name: 'Plan P' }).click();
    await page.locator('[data-my-courses-semester]').selectOption('11');
    assert.ok(await page.locator('.my-course-option').count() > 0);
    await page.getByRole('button', { name: 'Plan O' }).click();
    assert.equal(await page.locator('[data-my-courses-semester]').inputValue(), 'all', 'invalid semester resets on plan switch');
    assert.equal(await page.locator('.my-course-option').count(), await page.evaluate(() => CURRICULA.planO.subjects.length));
    await page.getByRole('button', { name: 'Plan P' }).click();
    assert.equal(await page.locator(`[data-my-course-status="${code}"]`).inputValue(), 'aprobado');
    await page.locator('[data-my-courses-search]').fill('DAII-00600');
    await page.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
    assert.equal(await page.locator('.my-courses-selected .my-course-card').count(), 2, 'semesters can be mixed');
    const material = page.locator('[data-my-course-card="DAII-00600"] .link');
    const count = Number((await material.innerText()).match(/\d+/)?.[0]);
    assert.ok(count > 0, 'real Plan P material available');
    await material.click();
    assert.equal(await page.locator('.material-count h2').innerText(), `${Math.min(count, 60)} de ${count} recursos`);
    assert.ok(page.url().includes('plan=planP&course=DAII-00600'));
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    await page.locator('[data-my-courses-semester]').selectOption('2');
    assert.equal(await page.locator('.my-course-option').count(), await page.evaluate(() => CURRICULA.planP.subjects.filter(c => c.semester === 2).length));
    await page.locator('[data-my-courses-semester]').selectOption('all');
    await page.locator('[data-my-courses-search]').fill(code);
    assert.ok(await page.locator('.my-course-option').count() >= 1);
    await page.locator('[data-my-courses-search]').fill('');
    const menu = page.locator('[data-open-menu]').first();
    if (width <= 920) {
      await menu.click();
      await page.locator('.menu-sheet a[href="#/mis-ramos"]').waitFor();
      await page.locator('[data-close-menu]').last().click();
    }
    const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, bottom: document.querySelector('.bottom-nav').getBoundingClientRect().top }));
    assert.ok(metrics.width <= metrics.viewport, `${width}px has no overflow`);
    assert.deepEqual(requests, [], 'selection does not contact API or analytics');
    if (width !== 320) await page.screenshot({ path: fileURLToPath(new URL(`../qa-screenshots/mis-ramos-${width}.png`, import.meta.url)) });
    if (width === 390) {
      await page.locator('.mobile-header [data-portal-theme-toggle]').click();
      await page.screenshot({ path: fileURLToPath(new URL('../qa-screenshots/mis-ramos-390-dark.png', import.meta.url)) });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'dark theme fits mobile');
    }
    await page.locator('[data-my-courses-search]').fill('ningun ramo coincide');
    await page.locator(`.my-courses-selected [data-my-course-remove="${code}"]`).click();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.myCourseRemove), 'DAII-00600', 'focus moves to next selected course');
    await page.locator('.my-courses-selected [data-my-course-remove="DAII-00600"]').click();
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-my-courses-search')), true, 'focus falls back to search when last selected course is removed');
    await page.goto(`${base}#/ramo/planP/DAII-00600`, { waitUntil: 'networkidle' });
    await page.locator('[data-my-course-add="DAII-00600"]').click();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.myCourseRemove), 'DAII-00600', 'course detail action retains focus');
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-my-course-card="DAII-00600"]').count(), 1);
    report.checks.push(`${width}px: selection, status, reload, plan, filters, material, privacy`);
    await context.close();
  }
  const deniedContext = await browser.newContext();
  await deniedContext.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Storage.prototype[method] = () => { throw new Error('storage denied'); };
  });
  const deniedPage = await deniedContext.newPage();
  deniedPage.on('pageerror', error => report.errors.push(error.message));
  await deniedPage.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
  await deniedPage.getByRole('heading', { name: 'Mis ramos' }).waitFor();
  await deniedPage.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
  assert.match(await deniedPage.locator('.my-courses-notice').innerText(), /impide guardar/);
  await deniedContext.close();
  report.checks.push('browser: storage denied still renders Inicio and Mis ramos with honest warning');

  const quotaContext = await browser.newContext();
  await quotaContext.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('quota'); };
  });
  const quotaPage = await quotaContext.newPage();
  quotaPage.on('pageerror', error => report.errors.push(error.message));
  await quotaPage.goto(`${base}#/ramo/planP/DAII-00600`, { waitUntil: 'networkidle' });
  await quotaPage.locator('[data-my-course-add="DAII-00600"]').click();
  assert.match(await quotaPage.locator('.course-detail-head').locator('..').locator('.my-courses-notice').innerText(), /impide guardar/, 'course detail announces failed persistence');
  assert.equal(await quotaPage.locator('[data-my-course-remove="DAII-00600"]').count(), 1, 'temporary selection remains visible');
  await quotaContext.close();
  report.checks.push('browser: course detail announces temporary changes when storage is full');

  for (const variant of ['corrupt', 'future']) {
    const context = await browser.newContext();
    await context.addInitScript(({ variant, key }) => {
      localStorage.setItem('qa.other.data', 'keep');
      localStorage.setItem(key, variant === 'corrupt' ? '{' : JSON.stringify({ version: 2, plans: {} }));
    }, { variant, key });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Mis ramos' }).waitFor();
    assert.equal(await page.locator('.my-courses-list [data-my-course-add]:disabled').count() > 0, true);
    if (variant === 'corrupt') {
      await page.locator('[data-my-courses-recover]').click();
      assert.equal(await page.locator('.my-courses-notice').count(), 0);
    } else assert.equal(await page.locator('[data-my-courses-recover]').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('qa.other.data')), 'keep');
    await page.goto(`${base}#/inicio`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Inicio' }).waitFor();
    await context.close();
  }
  report.checks.push('browser: corrupt and future data keep Inicio usable; recovery is explicit and scoped');

  const tabs = await browser.newContext();
  const tabA = await tabs.newPage();
  const tabB = await tabs.newPage();
  await Promise.all([tabA.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' }), tabB.goto(`${base}#/mis-ramos`, { waitUntil: 'networkidle' })]);
  await tabA.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
  await tabB.locator('.my-courses-selected .my-course-card').first().waitFor();
  await tabB.locator('[data-my-courses-search]').fill('DAII-00600');
  await tabB.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
  await tabA.locator('.my-courses-selected .my-course-card').nth(1).waitFor();
  assert.equal(await tabA.locator('.my-courses-selected .my-course-card').count(), 2);
  await tabs.close();
  report.checks.push('two tabs: sequential additions merge through storage event');

  apiServer = spawn(process.execPath, ['server.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'ignore',
    env: { ...process.env, PORT: '18084', PORTAL_DB_PATH: apiDb, PORTAL_STATE_BACKEND: 'local', QA_TEST_MODE: '1' }
  });
  for (let i = 0; i < 50; i++) { try { if ((await fetch('http://127.0.0.1:18084/api/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 150)); }
  const apiContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const apiPage = await apiContext.newPage();
  const apiPosts = [];
  apiPage.on('request', request => { if (request.method() !== 'GET' && request.url().includes('/api/')) apiPosts.push({ url: request.url(), body: request.postData() || '' }); });
  apiPage.on('pageerror', error => report.errors.push(error.message));
  await apiPage.route('https://ic-ucn.github.io/**', route => route.abort());
  await apiPage.goto('http://127.0.0.1:18084/?qa=1&analytics=off#/mis-ramos', { waitUntil: 'networkidle' });
  await apiPage.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
  await apiPage.locator('.my-courses-selected [data-my-course-status]').selectOption('cursando');
  await apiPage.reload({ waitUntil: 'networkidle' });
  assert.equal(await apiPage.locator('.my-courses-selected [data-my-course-status]').inputValue(), 'cursando');
  assert.ok(apiPosts.every(post => !/P-0101|cursando|selected|statuses/.test(post.body)), 'API writes contain no personal selection or status');
  await apiContext.close();
  report.checks.push('isolated API bootstrap: selection persists only in browser; API payloads contain no course/status');

  const prodContext = await browser.newContext();
  await prodContext.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.__analyticsHits = [];
  });
  const root = fileURLToPath(new URL('../', import.meta.url));
  const network = [];
  await prodContext.route('**/*', async route => {
    const target = new URL(route.request().url());
    network.push(target.href);
    if (target.hostname === 'gc.zgo.at') return route.fulfill({ contentType: 'application/javascript', body: 'window.goatcounter.count = x => window.__analyticsHits.push(x); window.goatcounter.get_data = x => x;' });
    if (target.hostname === 'ceicucn.goatcounter.com') return route.fulfill({ status: 204 });
    if (target.hostname !== 'ceicucn.cl') return route.abort();
    const file = path.resolve(root, '.' + decodeURIComponent(target.pathname === '/' ? '/index.html' : target.pathname));
    assert.ok(file.startsWith(root));
    try {
      let body = readFileSync(file);
      if (target.pathname === '/src/config.js') body = Buffer.from(`${body}\nwindow.PORTAL_API_BASE = '';`);
      const ext = path.extname(file);
      return route.fulfill({ body, contentType: ({ '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' })[ext] || 'application/octet-stream' });
    } catch { return route.fulfill({ status: 404, body: '' }); }
  });
  const prodPage = await prodContext.newPage();
  prodPage.on('pageerror', error => report.errors.push(error.message));
  await prodPage.goto('https://ceicucn.cl/#/inicio', { waitUntil: 'networkidle' });
  await prodPage.goto('https://ceicucn.cl/#/mis-ramos', { waitUntil: 'networkidle' });
  await prodPage.locator('.my-courses-list .my-course-option').first().getByRole('button', { name: 'Agregar' }).click();
  await prodPage.locator('.my-courses-selected [data-my-course-status]').selectOption('aprobado');
  await prodPage.goto('https://ceicucn.cl/#/mallas', { waitUntil: 'networkidle' });
  await prodPage.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
  await prodPage.locator('[data-malla-mark-toggle]').click();
  const prodFrame = prodPage.frameLocator('[data-malla-frame]');
  await prodFrame.locator('html.mc-portal-marking').waitFor();
  await prodFrame.locator('.mc-card[data-mc-code]').nth(1).click();
  await prodPage.locator('[data-malla-progress-count]').getByText('2 de 64 aprobados').waitFor();
  await prodPage.locator('[data-malla-mark-semester]').selectOption('2');
  await prodPage.locator('[data-malla-mark-batch]').click();
  await prodPage.locator('[data-malla-progress-count]').getByText('14 de 64 aprobados').waitFor();
  const hits = await prodPage.evaluate(() => window.__analyticsHits);
  assert.ok(hits.some(hit => hit.path === '/#/inicio'), 'analytics is active for an allowed route');
  assert.ok(hits.some(hit => hit.path === '/#/mallas'), 'malla route tracking remains active');
  assert.ok(hits.every(hit => !/mis-ramos|aprobado|P-0101|P-0102|mallas\/ramo/.test(JSON.stringify(hit))), 'marking does not emit course, status or course-selection analytics');
  assert.ok(network.every(url => !url.includes('portal-ceic-api.onrender.com')), 'production-shaped analytics test never contacts API');
  await prodContext.close();
  report.checks.push('production-shaped analytics active/intercepted: malla route retained; individual/batch marking emits no course, status or course-selection event');
  report.ok = report.errors.length === 0;
} catch (error) { report.errors.push(error.stack || String(error)); }
finally {
  await browser?.close();
  server.kill();
  apiServer?.kill();
  rmSync(apiDb, { force: true });
  mkdirSync(new URL('../qa-screenshots/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../qa-screenshots/qa-my-courses.json', import.meta.url), JSON.stringify(report, null, 2));
}
if (!report.ok) throw new Error(report.errors.join('\n'));
console.log(JSON.stringify(report));
