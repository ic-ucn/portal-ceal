import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = `${root}/output/release-20261026/mobile-scroll`;
mkdirSync(output, { recursive: true });
const base = process.env.PORTAL_SCROLL_BASE || 'http://127.0.0.1:18116/?static=1&analytics=off';
const report = { ok: false, checks: [], errors: [], physicalDeviceTested: false };
const browser = await chromium.launch();

try {
  for (const [width, height, touch] of [[320, 646, true], [380, 646, false], [390, 844, true], [768, 900, true], [1440, 900, false]]) {
    for (const source of ['fallback', 'remote']) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
      if (source === 'fallback') await context.route('https://ic-ucn.github.io/**', route => route.abort());
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      await page.goto(`${base}#/mallas`);
      for (const plan of ['p', 'o']) {
        await page.locator(`[data-malla-embed-plan="${plan}"]`).click();
        await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
        const frame = page.locator('[data-malla-frame]').contentFrame();
        await frame.locator('.mc-card').first().waitFor();
        const embedded = await page.locator('[data-malla-frame]').elementHandle().then(element => element.contentFrame());
        await embedded.waitForFunction(() => document.querySelector('.mc-card').className.includes('mc-portal-area'));
        const actualSource = await frame.locator('.mc-local-shell').count() ? 'fallback' : 'remote';
        if (width <= 920) await page.waitForFunction(() => document.querySelector('[data-malla-frame-wrap]').style.getPropertyValue('--malla-content-height'));
        assert.equal(await page.evaluate(() => scrollY), 0, 'Initial curriculum load stays at page start');
        await page.locator('[data-malla-mark-toggle]').click();
        await page.locator('[data-malla-mark-status="cursando"]').click();
        assert.equal(await page.locator('[data-malla-mark-toggle]').getAttribute('aria-pressed'), 'true');
        const dimensions = await page.evaluate(() => {
          const frame = document.querySelector('[data-malla-frame]');
          return { frameHeight: frame.clientHeight, documentHeight: document.documentElement.scrollHeight, viewport: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth };
        });
        assert.equal(dimensions.overflowX, false);
        if (width <= 920) {
          assert.ok(dimensions.frameHeight >= 320, `Useful mobile curriculum height: ${JSON.stringify(dimensions)}`);
          assert.ok(dimensions.documentHeight > height, 'Document scroll includes controls and curriculum');
          const nested = await embedded.evaluate(() => ({ y: scrollY, excess: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight }));
          assert.ok(nested.excess <= 2, `No nested iframe vertical scroll: ${JSON.stringify(nested)}`);
          await page.evaluate(() => scrollTo(0, 0));
          await page.mouse.move(width / 2, 250);
          await page.mouse.wheel(0, 390);
          await page.waitForTimeout(300);
          assert.ok(await page.evaluate(() => scrollY) > 100, 'Wheel on controls scrolls the page');
          const box = await page.locator('[data-malla-frame]').boundingBox();
          const y = Math.min(height - 120, Math.max(120, box.y + 100));
          await page.mouse.move(width / 2, y);
          const before = await page.evaluate(() => scrollY);
          await page.mouse.wheel(0, 280);
          await page.waitForTimeout(300);
          assert.ok(await page.evaluate(() => scrollY) > before, 'Wheel over curriculum continues the same page scroll');
          assert.equal(await embedded.evaluate(() => scrollY), 0, 'Iframe does not retain its own vertical position');
          if (touch) {
            await page.evaluate(() => scrollTo(0, 200));
            const cdp = await context.newCDPSession(page);
            await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x:width/2,y:height-160}]});
            for(let step=1;step<=8;step++) { await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:width/2,y:height-160-step*26}]}); await page.waitForTimeout(30); }
            await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
            await page.waitForTimeout(350);
            const touchPosition = await page.evaluate(() => ({ y:scrollY, max:document.documentElement.scrollHeight-innerHeight, target:document.elementFromPoint(innerWidth/2,innerHeight-160)?.tagName }));
            assert.ok(touchPosition.y > 200, `Native touch gesture scrolls page from curriculum ${JSON.stringify(touchPosition)}`);
            await cdp.detach();
          }
          const select = frame.locator('.mc-semester-select');
          if (await select.isVisible()) {
            await select.selectOption('3');
            await frame.locator('.mc-semester[data-semester="3"]:not([hidden])').waitFor();
            const tallHeight = await page.locator('[data-malla-frame]').evaluate(el => el.clientHeight);
            const lastSemester = await select.locator('option').last().getAttribute('value');
            await select.selectOption(lastSemester);
            await page.waitForTimeout(250);
            assert.ok(await page.locator('[data-malla-frame]').evaluate(el => el.clientHeight) < tallHeight, 'Short semester shrinks iframe');
            await select.selectOption('1');
            await page.waitForTimeout(250);
          }
          if (width === 380 && plan === 'p') {
            const stableHeight = await page.locator('[data-malla-frame]').evaluate(el => el.clientHeight);
            await page.waitForTimeout(3500);
            assert.equal(await page.locator('[data-malla-frame]').evaluate(el => el.clientHeight), stableHeight, 'Natural height stays stable instead of growing on each resize');
            await page.setViewportSize({ width: 844, height: 390 });
            await page.waitForTimeout(250);
            await page.setViewportSize({ width, height });
            await page.waitForTimeout(250);
            assert.equal(await page.locator('[data-malla-frame]').evaluate(el => el.clientHeight), stableHeight, 'Rotation restores natural content height');
          }
        }
        // Marking, detail, close and personal view remain reachable after scrolling.
        const course = frame.locator('.mc-card:visible').first();
        await course.click();
        await course.locator('.mc-portal-current-label').waitFor();
        await page.locator('[data-malla-mark-toggle]').click();
        await course.click();
        await page.locator('[data-malla-course-dialog][open]').waitFor();
        await page.locator('[data-malla-detail-close]').click();
        await page.locator('[data-malla-course-dialog]').waitFor({ state: 'hidden' });
        await page.locator('[data-malla-view="personal"]').first().click();
        assert.equal(await page.locator('.malla-personal-panel').isVisible(), true);
        await page.locator('[data-malla-view="malla"]').first().click();
        assert.equal(await page.locator('[data-malla-frame]').isVisible(), true);
        await page.locator('.malla-close').click();
        await page.waitForFunction(() => !location.hash.startsWith('#/mallas'));
        await page.goto(`${base}#/mallas`);
        report.checks.push({ width, height, touch, plan, requestedSource: source, actualSource, dimensions });
      }
      await page.locator('[data-malla-frame]').waitFor();
      await page.locator('[data-malla-mark-toggle]').click();
      await page.evaluate(() => scrollTo(0, 300));
      await page.screenshot({ path: `${output}/${source}-${width}-${touch ? 'touch' : 'pointer'}.png` });
      await context.close();
    }
  }
  assert.deepEqual(report.errors, []);
  report.ok = true;
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  writeFileSync(`${output}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
