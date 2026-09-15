import assert from 'node:assert/strict';
import { chromium, webkit, firefox } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.QA_WELCOME_URL || 'http://127.0.0.1:18084/?static=1';
const production = new URL(base).hostname === 'ceicucn.cl';
const output = new URL('../qa-screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const report = { ok: false, production, cases: [], errors: [] };
const cases = production ? [
  { engine: 'chromium', width: 1440, height: 900 }, { engine: 'chromium', width: 390, height: 844 }
] : [
  { engine: 'chromium', width: 1440, height: 900 }, { engine: 'chromium', width: 390, height: 844 },
  { engine: 'chromium', width: 320, height: 568 }, { engine: 'chromium', width: 844, height: 390 },
  { engine: 'webkit', width: 390, height: 844 }, { engine: 'firefox', width: 390, height: 844 }
];
const url = (route = '/', force = false) => {
  const result = new URL(base); result.searchParams.set('welcomeCheck', `20260914f-${Date.now()}`);
  if (force) result.searchParams.set('guia', '1'); result.hash = route; return result.href;
};
try {
  for (const config of cases) {
    const browser = await ({ chromium, webkit, firefox }[config.engine]).launch();
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push({ ...config, message: error.message }));
    const mediaRequests = [];
    page.on('request', request => { if (/portal-guia-.*\.mp4/.test(request.url())) mediaRequests.push(request.url()); });
    const dialog = page.getByRole('dialog', { name: 'Así funciona el portal' });
    await page.goto(url('/calendario'), { waitUntil: 'networkidle' });
    await dialog.waitFor();
    assert.deepEqual(mediaRequests, [], 'first visit does not download the video');
    assert.equal(new URL(page.url()).hash, '#/calendario', 'welcome preserves a deep link');
    assert.equal(await page.locator('video').evaluate(v => v.paused && !v.autoplay), true);
    assert.equal(await dialog.evaluate(node => node.contains(document.activeElement)), true, 'focus starts inside dialog');
    const fit = await dialog.evaluate(node => {
      const r = node.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:innerWidth, height:innerHeight, overflow:node.scrollWidth > node.clientWidth };
    });
    assert.ok(fit.left >= 0 && fit.right <= fit.width && fit.top >= 0 && fit.bottom <= fit.height && !fit.overflow, 'welcome fits viewport');
    for (let i=0; i<12; i++) { await page.keyboard.press('Tab'); assert.equal(await dialog.evaluate(node => node.contains(document.activeElement)), true, 'Tab stays in dialog'); }
    await page.screenshot({ path: new URL(`welcome-${production ? 'production-' : ''}${config.engine}-${config.width}-light.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await dialog.isVisible(), false, 'dismissal persists on reload');

    // Manual reopening from both layouts preserves the underlying viewport.
    await page.evaluate(() => window.scrollTo(0, 700));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    if (config.width <= 920) {
      await page.locator('.bottom-more').click();
      await page.locator('.menu-sheet [data-open-welcome]').click();
    } else await page.locator('.sidebar [data-open-welcome]').click();
    await dialog.waitFor();
    await page.getByRole('button', { name: 'Cerrar guía', exact: true }).click();
    assert.ok(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore) <= 2, 'manual close preserves scroll');
    assert.equal(await page.evaluate(() => document.activeElement.matches('[data-open-welcome], .bottom-more')), true, 'returns to invoking control');

    await page.evaluate(() => { document.querySelector('[data-portal-theme-toggle]').click(); });
    await page.goto(url('/material', true), { waitUntil: 'networkidle' });
    await dialog.waitFor();
    assert.equal(await page.locator('body.theme-dark').count(), 1);
    await page.screenshot({ path: new URL(`welcome-${production ? 'production-' : ''}${config.engine}-${config.width}-dark.png`, output).pathname.replace(/^\/(?=[A-Z]:)/, '') });
    // Windows headless audio output can suspend otherwise valid media (also in
    // an isolated native video). Decode silently; the shipped player keeps sound.
    await page.locator('video').evaluate(v => { v.muted = true; });
    await page.getByRole('button', { name: 'Reproducir guía del portal', exact: true }).click();
    await page.waitForFunction(() => { const v=document.querySelector('.portal-welcome video'); return v.currentTime > .4 && v.videoWidth > 0; }, null, { timeout: 10000 }).catch(async error => {
      console.log(JSON.stringify(await page.locator('video').evaluate(v => ({ source:v.currentSrc, time:v.currentTime, paused:v.paused, ready:v.readyState, error:v.error?.message, dialog:v.closest('dialog').open, location:location.href }))));
      throw error;
    });
    const playing = await page.locator('video').evaluate(v => ({ duration:v.duration, width:v.videoWidth, height:v.videoHeight, source:v.currentSrc }));
    assert.ok(playing.duration > 35 && playing.duration < 65, 'tutorial is concise');
    assert.ok(playing.source.includes(config.width <= 600 ? '-mobile.mp4' : '-desktop.mp4'), 'uses correct video framing');
    // A data refresh repaints #app but must not replace or restart the video.
    await page.locator('video').evaluate(v => { v.dataset.testIdentity = 'same-player'; });
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    assert.equal(await page.locator('video').getAttribute('data-test-identity'), 'same-player');
    assert.equal(await page.locator('video').evaluate(v => v.paused), false);
    await dialog.locator('a[href="#/material"]').click();
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await page.locator('video').evaluate(v => v.paused), true, 'closing pauses narration');
    assert.equal(new URL(page.url()).hash, '#/material');
    report.cases.push({ ...config, fit: true, noAutoplay: true, noInitialDownload: true, playback: playing, dismiss: true });
    await context.close(); await browser.close();
  }
  assert.deepEqual(report.errors, []);
  report.ok = true;
  console.log(JSON.stringify(report));
} finally { await writeFile(new URL(`welcome-${production ? 'production' : 'local'}-report.json`, output), JSON.stringify(report, null, 2)); }
