import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

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

const partial = tools.gradeSummary({ goal: 4, rows: [row('A', 30, 4), row('B', 30, 5)] });
assert.equal(partial.gradedAverage, 4.5);
assert.equal(partial.weightedAccumulated, 2.7);
assert.equal(partial.remaining, 40);
assert.equal(partial.required, 3.25);
assert.equal(partial.unassigned, 40);
assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 100, 3.99)] }).outcome, 'final-below');
assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 100, 4)] }).outcome, 'final-met');
assert.equal(tools.gradeSummary({ goal: 6, rows: [row('A', 80, 1)] }).outcome, 'impossible');
assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 80, 7)] }).outcome, 'guaranteed');
assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 30, null)] }).gradedAverage, null);
assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 33.33, 4), row('B', 66.67, 4)] }).remaining, 0);
assert.equal(tools.validConfig({ goal: 4, rows: [row('A', 60, 4), row('B', 40.01, null)] }), false);

assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 47.05, 4), row('B', 17.65, 4), row('C', 35.3, 4)] }).outcome, 'final-met');
assert.equal(tools.gradeSummary({ goal: 4, rows: [row('A', 47.05, 4), row('B', 17.65, 4), row('C', 35.3, 4)] }).weightedAccumulated, 4);
for (const config of [{ goal: 4.001, rows: [] }, { goal: 4, rows: [row('A', 33.333, 4)] }, { goal: 4, rows: [row('A', 100, 3.999)] }]) assert.equal(tools.validConfig(config), false);

const event = { id: 'test-1', date: '2026-10-01', title: 'Prueba, teoría; ñ\nsegunda línea', type: 'Evaluación', time: '', plan: '', course: '', done: false };
const ics = tools.makeICS([event], new Date('2026-10-01T12:00:00Z'));
assert.match(ics, /DTSTART;VALUE=DATE:20261001\r\nDTEND;VALUE=DATE:20261002/);
assert.match(ics, /SUMMARY:Prueba\\, teoría\\; ñ\\nsegunda línea/);
const timed = tools.makeICS([{ ...event, time: '23:30' }]);
assert.match(timed, /DTSTART:20261001T233000/);
assert.doesNotMatch(timed, /DTEND:/);
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
  await page.goto('http://127.0.0.1:8105/?static=1#/mi-semana');
  await page.getByRole('heading', { name: 'Mi semana' }).waitFor();
  await page.locator('[data-study-event-form] [name="date"]').fill('2026-10-01');
  await page.locator('[data-study-event-form] [name="title"]').fill('Control propio');
  await page.locator('[data-study-event-form] button[type="submit"]').click();
  assert.equal(await page.getByText('Control propio').count(), 1);
  await page.reload();
  await page.getByText('Control propio').waitFor();
  await page.locator('[data-study-done]').first().click();
  assert.match(await page.locator('.study-entry.is-done').first().innerText(), /Completada/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false);

  await page.locator('[data-study-edit]').first().click();
  await page.locator('[name="title"]').fill('Control editado');
  await page.locator('[data-study-event-form] button[type="submit"]').click();
  await page.getByText('Control editado', { exact: true }).waitFor();
  await page.locator('[data-study-delete]').first().click();
  await page.getByRole('button', { name: 'Eliminar actividad', exact: true }).click();
  assert.equal(await page.getByText('Control editado', { exact: true }).count(), 0);

  await page.goto('http://127.0.0.1:8105/?static=1#/calculadora');
  await page.getByRole('heading', { name: 'Calculadora de notas' }).waitFor();
  await page.locator('[name="row-name"]').first().fill('Prueba 1');
  await page.locator('[name="row-weight"]').first().fill('30');
  await page.locator('[name="row-grade"]').first().fill('4');
  await page.locator('[data-study-add-row]').click();
  await page.locator('[name="row-name"]').nth(1).fill('Prueba 2');
  await page.locator('[name="row-weight"]').nth(1).fill('30');
  await page.locator('[name="row-grade"]').nth(1).fill('5');
  await page.locator('[data-study-grades-form] button[type="submit"]').click();
  await page.getByText(/Necesitas al menos 3,25/).waitFor();
  await page.reload();
  assert.equal(await page.locator('[name="row-grade"]').count(), 2);
  assert.equal(await page.locator('[name="row-grade"]').nth(1).inputValue(), '5');

  const second = await context.newPage();
  await second.goto(page.url());
  await second.getByRole('heading', { name: 'Calculadora de notas' }).waitFor();
  await page.locator('[name="row-grade"]').first().fill('4.2');
  await second.locator('[name="row-grade"]').first().fill('4.5');
  await second.locator('[data-study-grades-form] button[type="submit"]').click();
  await page.locator('[data-study-grades-form] button[type="submit"]').click();
  await page.getByText(/Otra pestaña cambió tus datos/).last().waitFor();
  assert.equal(await page.locator('[name="row-grade"]').first().inputValue(), '4.2');
  assert.equal(await second.locator('[name="row-grade"]').first().inputValue(), '4.5');
  await page.locator('[data-study-reload]').click();
  assert.equal(await page.locator('[name="row-grade"]').first().inputValue(), '4.5');
  await page.locator('[name="row-grade"]').first().fill('6');
  await page.locator('[data-study-reload]').click();
  assert.equal(await page.locator('[name="row-grade"]').first().inputValue(), '4.5');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['mi-semana', 'calculadora']) {
      await page.goto(`http://127.0.0.1:8105/?static=1&analytics=off#/${route}`);
      await page.locator('.study-page').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `qa-screenshots/study-${route}-${width}.png`, fullPage: true });
    }
  }
  await context.close();
} finally { await browser.close(); }
console.log('qa-study-tools: fechas, notas, ICS y navegador móvil correctos');
