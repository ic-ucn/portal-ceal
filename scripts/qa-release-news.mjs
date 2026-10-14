import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.QA_NEWS_URL || 'http://127.0.0.1:18113/?static=1&analytics=off';
const report = { ok: false, checks: [], errors: [] };
const browser = await chromium.launch();
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(base + '#/inicio');
    await page.locator('.home-news').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const before = await page.evaluate(() => JSON.stringify([localStorage.getItem('portal.myCourses.v1'), localStorage.getItem('portal.studyTools.v1')]));
    await page.locator('.home-news [data-open-welcome]').click();
    await page.locator('.portal-welcome[open]').waitFor();
    assert.equal(await page.locator('.portal-welcome[open] button').count(), 2);
    await page.locator('.portal-welcome [data-video-skip]').click();
    assert.equal(new URL(page.url()).hash, '#/inicio');
    await page.locator('[data-dismiss-news]').click();
    await page.reload();
    assert.equal(await page.locator('.home-news').count(), 0);
    assert.equal(await page.evaluate(() => JSON.stringify([localStorage.getItem('portal.myCourses.v1'), localStorage.getItem('portal.studyTools.v1')])), before);
    await page.evaluate(() => localStorage.setItem('portal.news.dismissed', 'older-release'));
    await page.reload(); await page.locator('.home-news').waitFor();
    await page.locator('.home-news a').click();
    await page.locator('.malla-personal-panel').waitFor();
    await page.goto(base + '#/mi-semana');
    await page.getByRole('heading', { name: 'Mi semana', exact: true }).waitFor();
    const result = await page.evaluate(() => {
      const calendar = [
        { title: 'Plazo anterior', date: '2026-09-30', endDate: '2026-10-05', sourcePage: 5 },
        { title: 'Plazo solapado', date: '2026-10-01', endDate: '2026-10-30', sourcePage: 5, provisional: true },
        { title: 'Plazo que termina lunes', date: '2026-10-10', endDate: '2026-10-12' },
        { title: 'Evento puntual', date: '2026-10-13' },
        { title: 'Misma fecha', date: '2026-10-14', endDate: '2026-10-14' },
        { title: 'Solo unidades', date: '2026-10-13', endDate: '2026-10-15', audience: 'unidades' },
        { title: 'Futuro', date: '2026-10-19', endDate: '2026-10-24' },
        { title: '<img src=x onerror=alert(1)>', date: '2026-10-16', endDate: '2026-10-18' },
        { title: 'Fin de año', date: '2026-12-28', endDate: '2027-01-04' }
      ];
      const original = JSON.stringify(calendar);
      PortalStudyUI.context({ calendar, source: { fileUrl: 'https://ceicucn.cl/assets/documents/calendario-antofagasta-077-2026.pdf' }, courses: { planO: [], planP: [] }, selectedPlan: 'planP' });
      const weeks = ['2026-10-13', '2026-10-19', '2026-12-31'].map(date => {
        PortalStudyUI.reset();
        const root = document.createElement('div'); root.innerHTML = PortalStudyUI.renderWeek(date);
        return { ranges: [...root.querySelectorAll('.study-deadline')].map(n => n.textContent), days: root.querySelector('.study-days').textContent, html: root.innerHTML, sources: [...root.querySelectorAll('.study-deadline a')].map(n => n.href), hasInjectedImage: !!root.querySelector('.study-deadlines img') };
      });
      return { weeks, untouched: JSON.stringify(calendar) === original };
    });
    assert.equal(result.untouched, true);
    assert.equal(result.weeks[0].ranges.length, 3);
    assert.match(result.weeks[0].ranges[0], /1 oct.*30 oct.*Sujeto a cambios/);
    assert.match(result.weeks[0].ranges[1], /10 oct.*12 oct/);
    assert.doesNotMatch(result.weeks[0].days, /Plazo|Futuro|Solo unidades/);
    assert.equal((result.weeks[0].days.match(/Evento puntual/g) || []).length, 1);
    assert.equal((result.weeks[0].days.match(/Misma fecha/g) || []).length, 1);
    assert.ok(result.weeks[0].sources[0].endsWith('#page=5'));
    assert.equal(result.weeks[0].hasInjectedImage, false);
    assert.equal(result.weeks[1].ranges.length, 2);
    assert.match(result.weeks[2].ranges[0], /28 dic.*4 ene.*2026–2027/);
    report.checks.push({ width, noticePersistence: true, reopening: true, dataPreserved: true, calendarBoundaries: true });
    await context.close();
  }
  assert.deepEqual(report.errors, []); report.ok = true;
} finally {
  await browser.close(); await mkdir('qa-screenshots', { recursive: true });
  await writeFile('qa-screenshots/release-news-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
