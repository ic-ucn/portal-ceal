import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const base = process.env.QA_STUDY_URL || 'http://127.0.0.1:8105/?static=1&analytics=off';
const require = createRequire(import.meta.url);
const tools = require('../src/study-tools.js');
let stored = null;
let quota = false;
globalThis.localStorage = { getItem: () => stored, setItem: (key, value) => { if (quota) throw new Error('quota'); stored = value; } };
const row = (id, weight, grade) => ({ id, name: id, weight, grade });

assert.deepEqual(tools.weekDates('2026-10-01'), ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
assert.deepEqual(tools.weekDates('2027-01-01'), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
assert.equal(tools.shiftDate('2026-12-31', 1), '2027-01-01');
assert.equal(tools.validDate('2026-02-29'), false);
assert.equal(tools.validDate('2028-02-29'), true);

assert.equal(tools.validConfig({ goal: 4, rows: [row('A', 60, 4), row('B', 40.01, null)] }), false);

for (const config of [{ goal: 4.001, rows: [] }, { goal: 4, rows: [row('A', 33.333, 4)] }, { goal: 4, rows: [row('A', 100, 3.999)] }]) assert.equal(tools.validConfig(config), false);

const event = { id: 'test-1', date: '2026-10-01', title: 'Prueba, teoría; ñ\nsegunda línea', type: 'Evaluación', time: '', plan: '', course: '', done: false };
const ics = tools.makeICS([event], new Date('2026-10-01T12:00:00Z'));
assert.match(ics, /DTSTART;VALUE=DATE:20261001\r\nDTEND;VALUE=DATE:20261002/);
assert.match(ics, /SUMMARY:Prueba\\, teoría\\; ñ\\nsegunda línea/);
const timed = tools.makeICS([{ ...event, time: '23:30' }]);
assert.match(timed, /DTSTART:20261001T233000/);
assert.doesNotMatch(timed, /DTEND:/);
assert.doesNotMatch(timed, /DURATION:/, 'Do not invent a duration when it was not provided');
assert.match(tools.makeICS([{ ...event, time: '23:30', duration: 90 }]), /DURATION:PT90M\r\n/);
assert.doesNotMatch(tools.makeICS([{ ...event, duration: 90 }]), /DURATION:/, 'All-day events keep date boundaries');
for (const line of tools.makeICS([{ ...event, title: 'Ñ 😀 '.repeat(20) }]).split('\r\n')) {
  assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `ICS line too long: ${Buffer.byteLength(line, 'utf8')}`);
}

stored = '{broken';
tools.read();
assert.equal(tools.status().locked, true);
assert.equal(tools.update(0, () => {}).ok, false);
assert.equal(stored, '{broken');
stored = JSON.stringify({ version: 2 });
tools.read();
assert.equal(tools.status().locked, true);
stored = null;
tools.read();
quota = true;
assert.equal(tools.update(0, data => data.events.push(event)).saved, false);
assert.equal(tools.read().events.length, 1);
assert.equal(tools.status().volatile, true);
assert.equal(tools.update(0, () => {}).ok, false);
quota = false;
assert.equal(tools.update(1, () => {}).saved, true);
assert.equal(tools.status().volatile, false);

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  await page.goto(base + '#/mi-semana');
  await page.getByRole('heading', { name: 'Mi semana' }).waitFor();
  await page.locator('.study-extra > summary').click();
  await page.getByRole('button', { name: 'Semana siguiente', exact: true }).click();
  assert.equal(await page.locator('.study-extra').evaluate(node => node.open), true, 'Expanded activity options survive a refresh');
  await page.getByRole('button', { name: 'Esta semana', exact: true }).click();
  await page.locator('.study-extra > summary').click();
  const activityDate = await page.locator('[data-study-event-form] [name="date"]').inputValue();
  assert.match(activityDate, /^\d{4}-\d{2}-\d{2}$/);
  await page.locator('[data-study-event-form] [name="date"]').fill(activityDate);
  await page.locator('[data-study-event-form] [name="title"]').fill('Control propio');
  await page.locator('[data-study-event-form] button[type="submit"]').click();
  assert.equal(await page.locator('.study-days').getByText('Control propio', { exact: true }).count(), 1);
  await page.reload();
  await page.locator('.study-days').getByText('Control propio', { exact: true }).waitFor();
  await page.locator('[data-study-done]').first().click();
  assert.match(await page.locator('.study-entry.is-done').first().innerText(), /Completada/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false);

  await page.locator('[data-study-edit]').first().click();
  await page.locator('[name="title"]').fill('Control editado');
  await page.locator('[data-study-event-form] button[type="submit"]').click();
  await page.locator('.study-days').getByText('Control editado', { exact: true }).waitFor();
  await page.locator('[data-study-delete]').first().click();
  await page.getByRole('button', { name: 'Eliminar actividad', exact: true }).click();
  assert.equal(await page.locator('.study-days').getByText('Control editado', { exact: true }).count(), 0);

  await page.goto(base + '#/calculadora');
  await page.getByRole('heading', { name: 'No encontrado', exact: true }).waitFor();
  assert.equal(await page.locator('[data-study-grades-form]').count(), 0);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['mi-semana']) {
      await page.goto(`${base}#/${route}`);
      await page.locator('.study-page').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `qa-screenshots/study-${route}-${width}.png`, fullPage: true });
    }
  }
  await context.close();
} finally { await browser.close(); }
console.log('qa-study-tools: fechas, retiro de calculadora, ICS y navegador móvil correctos');
