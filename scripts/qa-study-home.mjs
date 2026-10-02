import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:18090/?static=1&analytics=off';
const server = spawn('python', ['-m', 'http.server', '18090', '--bind', '127.0.0.1'], { cwd: root, windowsHide: true, stdio: 'ignore' });
const report = { ok: false, checks: [], errors: [] };
let browser;
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch();
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), requests = [];
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('request', r => { if (/\/api\/|goatcounter|cloudflareinsights/.test(r.url())) requests.push(r.url()); });
    await page.goto(`${base}#/inicio`, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('link', { name: 'Agregar actividad', exact: true }).count(), 1);
    assert.equal(await page.locator('[data-home-course]').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('portal.myCourses.v1')), null, 'Home does not create course records');
    const dates = await page.evaluate(() => {
      const today = document.querySelector('.home-heading time').dateTime;
      const next = PortalStudyTools.shiftDate(today, 15), before = PortalStudyTools.shiftDate(today, -8);
      const make = (id, date, title, done = false, time = '') => ({ id, date, title, done, time, type: 'Evaluación', plan: 'planP', course: 'P-0101' });
      PortalStudyTools.replace({ version: 1, revision: 1, grades: {}, events: [make('later', next, 'Evaluación de cálculo'), make('done', today, 'Actividad completada', true), make('past', before, 'Actividad por revisar'), make('today', today, 'Estudio de estructuras'), make('escape', next, '<img src=x onerror=alert(1)>')] });
      PortalMyCourses.setPlan('planP');
      PortalMyCourses.updateStatuses('planP', { 'P-0101': 'cursando', 'P-0102': 'aprobado' });
      return { next, before };
    });
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual(await page.locator('[data-home-activity]').evaluateAll(els => els.map(e => e.dataset.homeActivity)), ['today', 'later', 'escape']);
    assert.equal(await page.locator('[data-home-activity] img').count(), 0, 'Activity text is escaped');
    assert.equal(await page.locator('[data-home-course="P-0101"]').count(), 1);
    assert.equal(await page.locator('[data-home-course="P-0102"]').count(), 0, 'Approved courses are not current');
    assert.match(await page.locator('.home-study-overview').innerText(), /se abriría.*al aprobar tus actuales/);
    await page.locator('[data-home-activity="later"]').click();
    assert.match(await page.locator('.study-days').innerText(), /Evaluación de cálculo/);
    assert.ok(await page.locator(`.study-day:has([data-study-edit="later"])`).count(), 'Future item opens its week');
    await page.getByRole('button', { name: 'Esta semana', exact: true }).click();
    assert.equal(await page.locator('.study-days [data-study-edit="later"]').count(), 0, 'Week controls remain usable after deep link');
    await page.goto(`${base}#/inicio`);
    await page.locator('[data-home-activity="later"]').click();
    assert.equal(await page.locator('.study-days [data-study-edit="later"]').count(), 1, 'Revisiting same activity reopens its week');
    await page.goto(`${base}#/inicio`);
    await page.getByRole('link', { name: /actividad anterior sin completar/ }).click();
    assert.equal(await page.locator('.study-days [data-study-edit="past"]').count(), 1);
    await page.goto(`${base}#/inicio`);
    const other = await context.newPage();
    await other.goto(`${base}#/inicio`, { waitUntil: 'networkidle' });
    await other.evaluate(() => {
      PortalMyCourses.updateStatuses('planP', { 'P-0101': 'aprobado' });
      const saved = PortalStudyTools.read(); saved.events.find(e => e.id === 'today').done = true; saved.revision++;
      PortalStudyTools.replace(saved);
    });
    await page.locator('[data-home-course="P-0101"]').waitFor({ state: 'detached' });
    await page.locator('[data-home-activity="today"]').waitFor({ state: 'detached' });
    await other.evaluate(() => { PortalMyCourses.updateStatuses('planP', { 'P-0101': 'cursando' }); PortalMyCourses.setPlan('planO'); });
    await page.getByRole('link', { name: 'Elegir ramos' }).waitFor();
    assert.equal(await page.locator('[data-home-course]').count(), 0, 'Plan O does not show current Plan P courses');
    await other.evaluate(() => { PortalMyCourses.setPlan('planP'); });
    await page.locator('[data-home-course="P-0101"]').waitFor();
    await other.close();
    await page.evaluate(() => { const saved = PortalStudyTools.read(); saved.events.find(e => e.id === 'escape').title = 'Entrega de informe'; saved.revision++; PortalStudyTools.replace(saved); });
    await page.reload({ waitUntil: 'networkidle' });
    for (const theme of ['light', 'dark']) {
      assert.equal(await page.locator('#home-week-title').count(), 1, 'Screenshot is the personal home');
      assert.equal(await page.locator('.home-study-tools > a').count(), 2);
      await page.evaluate(theme => { document.body.classList.toggle('theme-dark', theme === 'dark'); }, theme);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.ok(await page.locator('.home-study-tools > a > span:nth-child(2)').evaluateAll(els => els.every(el => el.getBoundingClientRect().width >= 140)), 'Tool labels have usable width on mobile');
      mkdirSync(`${root}/qa-screenshots`, { recursive: true });
      await page.screenshot({ path: `${root}/qa-screenshots/study-home-${theme}-${width}.png`, fullPage: true });
    }
    await page.goto(`${base}#/calculadora`);
    await page.evaluate(() => { PortalMyCourses.useAccount('isolated-account'); PortalStudyTools.useAccount('isolated-account'); location.hash = '/inicio'; });
    await page.locator('#home-week-title').waitFor();
    assert.equal(await page.locator('[data-home-activity],[data-home-course]').count(), 0, 'Home reads only the active account scope');
    assert.deepEqual(requests, [], 'No personal content sent to analytics or API in static mode');
    report.checks.push(`${width}: empty and personal home, escaped content, current/approved distinction, plan/account isolation, future/past/repeated week links, live cross-tab updates, light/dark without overflow`);
    await context.close();
  }
  report.ok = report.errors.length === 0;
} catch (e) { report.errors.push(e.stack || String(e)); }
finally { await browser?.close(); server.kill(); mkdirSync(`${root}/qa-screenshots`, { recursive: true }); writeFileSync(`${root}/qa-screenshots/qa-study-home.json`, JSON.stringify(report, null, 2)); }
console.log(JSON.stringify(report));
if (!report.ok) process.exitCode = 1;
