import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:18089/?static=1&analytics=off';
const server = spawn('python', ['-m', 'http.server', '18089', '--bind', '127.0.0.1'], { cwd: root, windowsHide: true, stdio: 'ignore' });
const report = { ok: false, checks: [], errors: [] };
let browser;
const contrast = async locator => locator.evaluate(element => {
  const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
  const light = color => rgb(color).map(value => { const x = value / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
  const style = getComputedStyle(element);
  let parent = element, background = style.backgroundColor;
  while (/rgba\([^)]*,\s*0\)/.test(background) && parent.parentElement) { parent = parent.parentElement; background = getComputedStyle(parent).backgroundColor; }
  const a = light(style.color), b = light(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
});

try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  browser = await chromium.launch();
  for (const [width, source] of [[1440, 'remote'], [390, 'remote'], [1440, 'fallback'], [390, 'fallback'], [320, 'fallback']]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    // Verify both the bundled fallback and the fetched curriculum in separate suites.
    if (source === 'fallback') await ctx.route('https://ic-ucn.github.io/**', route => route.abort());
    const page = await ctx.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(`${base}#/mallas`);
    for (const plan of ['p', 'o']) {
      await page.locator(`[data-malla-embed-plan="${plan}"]`).click();
      await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
      const frame = page.frameLocator('[data-malla-frame]');
      const cards = frame.locator('.mc-card[data-mc-code]');
      const current = cards.nth(0), approved = cards.nth(1), untouched = cards.nth(2);
      await current.waitFor();
      if (await page.locator('[data-malla-mark-toggle]').getAttribute('aria-pressed') !== 'true') await page.locator('[data-malla-mark-toggle]').click();
      await page.getByRole('button', { name: 'Actuales', exact: true }).click();
      await current.press('Enter');
      await current.locator('.mc-portal-current-label').waitFor();
      await page.getByRole('button', { name: 'Aprobados', exact: true }).click();
      await approved.click();
      await approved.locator('.mc-portal-approved-label').waitFor();
      assert.equal(await untouched.locator('.mc-portal-current-label,.mc-portal-approved-label').count(), 0);
      assert.equal(await untouched.evaluate(el => getComputedStyle(el).backgroundImage), 'none', 'Unmarked courses have a neutral surface');
      await page.locator('[data-malla-batch-options] summary').click();
      await page.locator('[data-malla-mark-batch]').click();
      await current.locator('.mc-portal-current-label').waitFor();
      assert.equal(await current.locator('.mc-portal-approved-label').count(), 0, 'Batch approval preserves current courses');
      await page.locator('[data-malla-mark-undo]').click();
      await current.locator('.mc-portal-current-label').waitFor();
      await page.locator('[data-malla-batch-options] summary').click();
      for (const theme of ['light', 'dark']) {
        const dark = await page.locator('.malla-workspace').evaluate(el => el.classList.contains('is-dark'));
        if (dark !== (theme === 'dark')) await page.locator('[data-malla-embed-theme]').click();
        await frame.locator(theme === 'light' ? 'html.mc-light' : 'html:not(.mc-light)').waitFor();
        await page.waitForFunction(theme => {
          const style = getComputedStyle(document.querySelector('.malla-view-tabs button.active'));
          return style.color === (theme === 'dark' ? 'rgb(20, 45, 50)' : 'rgb(255, 255, 255)')
            && style.backgroundColor === (theme === 'dark' ? 'rgb(165, 209, 211)' : 'rgb(40, 94, 104)');
        }, theme);
        const tabContrast = await contrast(page.locator('.malla-view-tabs button.active'));
        assert.ok(tabContrast >= 4.5, `Active view contrast ${tabContrast} at ${theme}/${width}`);
        for (const card of [current, approved]) {
          const details = await card.evaluate(el => ({ theme: document.documentElement.className, color: getComputedStyle(el.querySelector('.mc-card__title,.mc-card__name')).color, background: getComputedStyle(el).backgroundColor }));
          assert.ok(await contrast(card.locator('.mc-card__title,.mc-card__name')) >= 4.5, `Course title contrast at ${theme}/${width}: ${JSON.stringify(details)}`);
          assert.ok(await contrast(card.locator('[class$="-label"]')) >= 4.5, `Status badge contrast at ${theme}/${width}`);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const filename = `malla-states-${source}-${plan}-${theme}-${width}.png`;
        await page.screenshot({ path: `${root}/qa-screenshots/${filename}` });
        report.checks.push(`${source}/${plan}/${theme}/${width}: yellow current, green approved, untouched neutral, contrast>=4.5, no overflow`);
      }
      await page.getByRole('button', { name: 'Actuales', exact: true }).click();
      await current.click();
      await current.locator('.mc-portal-current-label').waitFor({ state: 'detached' });
      await current.click();
      await current.locator('.mc-portal-current-label').waitFor();
      await page.locator('[data-malla-mark-toggle]').click();
      await current.click();
      const dialog = page.locator('[data-malla-course-dialog]');
      assert.equal(await dialog.locator('select[data-my-course-status]').count(), 0);
      await dialog.getByRole('button', { name: 'Actual', exact: true }).click();
      assert.equal(await dialog.locator('[data-my-course-status][aria-pressed="true"]').count(), 0, 'Tapping active state clears the mark');
      await dialog.getByRole('button', { name: 'Actual', exact: true }).click();
      await dialog.locator('[data-malla-detail-close]').click();
      await page.reload();
      await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
      await page.frameLocator('[data-malla-frame]').locator('.mc-portal-current').first().waitFor();
    }
    await ctx.close();
  }
  report.ok = report.errors.length === 0;
} catch (error) { report.errors.push(error.stack || String(error)); }
finally {
  await browser?.close(); server.kill();
  mkdirSync(`${root}/qa-screenshots`, { recursive: true });
  writeFileSync(`${root}/qa-screenshots/qa-malla-states.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
if (!report.ok) process.exitCode = 1;
