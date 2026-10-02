import assert from 'node:assert/strict';
import { chromium, webkit, firefox } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

// Browser interaction validates the player. Tutorial content comes only from Computer Use.
const base = process.env.QA_WELCOME_URL || 'http://127.0.0.1:18084/?static=1&analytics=off';
const production = new URL(base).hostname === 'ceicucn.cl';
const configs = production ? [['chromium', 1440, 900], ['chromium', 390, 844]] : [['chromium', 1440, 900], ['chromium', 390, 844], ['chromium', 320, 568], ['chromium', 844, 390], ['webkit', 390, 844], ['firefox', 390, 844]];
const out = new URL('../qa-screenshots/', import.meta.url);
await mkdir(out, { recursive: true });
const report = { ok: false, production, cases: [], errors: [] }, sandbox = { window: {} };
vm.runInNewContext(await readFile(new URL('../assets/tutorial-real/manifest.js', import.meta.url), 'utf8'), sandbox);
const manifest = sandbox.window.PortalTutorialCapture;
assert.equal(manifest.captureMethod, 'computer-use');
const chapters = ['malla', 'aprobados', 'mis-ramos', 'eligible', 'semana', 'notas', 'material', 'calendario'];
for (const [format, recording] of Object.entries(manifest.formats)) {
  assert.deepEqual([...new Set(Array.from(recording.steps, step => step.chapter))], chapters);
  for (const step of recording.steps) {
    assert.equal(createHash('sha256').update(await readFile(new URL(`../${step.image}`, import.meta.url))).digest('hex'), step.sha256, 'source Computer Use screenshots stay unchanged');
    assert.ok(step.end > step.start && step.caption && step.image.startsWith(`assets/tutorial-real/${format}/`));
  }
  assert.equal(recording.duration, recording.steps.at(-1).end);
}
const url = (route = '/') => { const value = new URL(base); value.searchParams.set('review', '20261002guide'); value.hash = route; return value.href; };
const snapshot = page => page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))));
async function stable(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.locator('.guide-course, .guide-visual, .guide-mini-detail').count(), 0, 'no synthetic portal UI');
  assert.ok(await page.locator('.guide-step-controls button, .guide-transport button').evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)));
}
async function ready(page) { await page.waitForFunction(() => { const v = document.querySelector('.portal-reception video'); return v && !v.paused && v.readyState >= 2; }); }
let browser;
try {
  for (const [engine, width, height] of configs) {
    browser = await ({ chromium, webkit, firefox }[engine]).launch();
    const context = await browser.newContext({ viewport: { width, height } }), page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => report.errors.push(`${engine}/${width}: ${error.message}`));
    const requests = [];
    page.on('request', request => { if (/\.(mp4|mp3|m4a|wav)(?:\?|$)/.test(request.url())) requests.push(request.url()); });
    await page.goto(url(), { waitUntil: 'networkidle' });
    const guide = page.locator('.portal-reception'), video = guide.locator('video');
    await guide.waitFor();
    const format = width <= 920 ? 'mobile' : 'desktop', recording = manifest.formats[format];
    assert.equal(await guide.locator('[data-guide-root]').getAttribute('data-capture-format'), format);
    assert.equal(await guide.locator('[data-guide-tab]').count(), chapters.length);
    assert.equal(await video.getAttribute('src'), recording.video);
    assert.equal(await video.evaluate(v => v.paused && v.muted && !v.autoplay && v.controls), true);
    assert.ok(await guide.locator('[data-guide-play]').evaluate(node => node.getBoundingClientRect().bottom < innerHeight), 'primary CTA is visible before media');
    assert.ok(await guide.locator('[data-guide-caption]').evaluate(node => node.getBoundingClientRect().bottom < document.querySelector('.guide-media').getBoundingClientRect().top), 'action caption is above media');
    await page.waitForFunction(() => { const image = document.querySelector('[data-guide-still]'); return image?.complete && image.naturalWidth > 0; });
    assert.equal(await guide.locator('[data-guide-still]').evaluate(image => image.naturalWidth), recording.width);
    await stable(page);
    await page.screenshot({ path: new URL(`welcome-real-${engine}-${width}.png`, out).pathname.replace(/^\/(?=[A-Z]:)/, '') });
    await page.locator('[data-portal-theme-toggle]').click();
    assert.equal(await page.locator('body.theme-dark').count(), 1);
    assert.equal(await guide.locator('[data-guide-still]').getAttribute('src'), recording.steps[0].image, 'theme never changes source pixels');
    await page.evaluate(() => localStorage.setItem('portal.myCourses.v1', 'READ_ONLY_GUIDE_SENTINEL'));
    const before = await snapshot(page);
    for (let index = 0; index < recording.steps.length; index++) {
      if (index) await guide.locator('[data-guide-step-next]').click();
      const step = recording.steps[index];
      assert.equal(await guide.locator('[data-guide-still]').getAttribute('src'), step.image);
      assert.equal(await guide.locator('[data-guide-caption]').innerText(), step.caption);
      assert.equal(await guide.locator('[data-guide-image-link]').getAttribute('href'), step.image);
      assert.equal(await video.evaluate(v => v.paused), true, 'manual captures never autoplay');
    }
    assert.equal(await snapshot(page), before, 'guide preserves all stored data');
    for (let index = 0; index < chapters.length; index++) {
      await guide.locator(`[data-guide-tab="${index}"]`).click();
      assert.equal(await guide.locator('[data-guide-still]').getAttribute('src'), recording.steps.find(step => step.chapter === chapters[index]).image);
    }
    await guide.locator('[data-guide-tab="6"]').click();
    const supportsVideo = await video.evaluate(v => !!v.canPlayType('video/mp4; codecs="avc1.64001f"'));
    if (supportsVideo) {
      await guide.locator('[data-guide-play]').click(); await ready(page);
      assert.equal(await video.isVisible(), true);
      const decoded = await video.evaluate(v => ({ width: v.videoWidth, height: v.videoHeight }));
      assert.ok(decoded.width > 0 && (engine === 'webkit' || Math.abs(decoded.width / decoded.height - recording.width / recording.height) < .002), 'native player decodes the captured stream (WebKit Windows reports rendered dimensions)');
      const startedAt = await video.evaluate(v => v.currentTime), expectedStart = recording.steps.find(step => step.chapter === 'material').start;
      assert.ok(Math.abs(startedAt - expectedStart) < 2, `chapter playback expected ${expectedStart}s, received ${startedAt}s`);
      await video.evaluate((v, time) => { v.currentTime = time; }, recording.steps.find(step => step.chapter === 'eligible').start + .2);
      await page.waitForFunction(() => document.querySelector('[data-guide-tab="3"]')?.getAttribute('aria-selected') === 'true');
      await guide.locator('[data-guide-play]').click();
      const paused = await video.evaluate(v => v.currentTime); await page.waitForTimeout(300);
      assert.ok(Math.abs(await video.evaluate(v => v.currentTime) - paused) < .1);
      await guide.locator('[data-guide-play]').click(); await ready(page);
      assert.ok(await video.evaluate(v => v.currentTime) >= paused);
      if (engine === 'chromium' && [1440, 390].includes(width)) {
        const switchAt = await video.evaluate(v => v.currentTime);
        await guide.locator('[data-guide-mode]').selectOption('voice');
        assert.equal(await video.evaluate(v => v.paused && !v.muted), true);
        assert.equal(await video.getAttribute('src'), recording.variants.voice);
        await guide.locator('[data-guide-play]').click(); await ready(page);
        assert.ok(Math.abs(await video.evaluate(v => v.currentTime) - switchAt) < 2, 'voice choice preserves playback position');
        const musicAt = await video.evaluate(v => v.currentTime);
        await guide.locator('[data-guide-music]').click();
        assert.equal(await video.evaluate(v => v.paused), true);
        assert.equal(await video.getAttribute('src'), recording.variants.voiceMusic);
        await guide.locator('[data-guide-play]').click(); await ready(page);
        assert.ok(Math.abs(await video.evaluate(v => v.currentTime) - musicAt) < 2, 'music choice preserves playback position');
        await guide.locator('[data-guide-mode]').selectOption('text');
        assert.equal(await video.getAttribute('src'), recording.variants.music);
        assert.equal(await guide.locator('[data-guide-music]').getAttribute('aria-pressed'), 'true');
        await guide.locator('[data-guide-music]').click();
        assert.equal(await video.getAttribute('src'), recording.variants.silent);
        assert.equal(await video.evaluate(v => v.paused && v.muted), true);
        assert.equal(await guide.locator('audio').count(), 0);
        assert.equal(await video.locator('track').getAttribute('default'), '');
        await guide.locator('[data-guide-play]').click(); await ready(page);
      }
      await video.evaluate((v, time) => { v.currentTime = time; }, recording.duration - .3);
      await page.waitForFunction(() => document.querySelector('.portal-reception video').ended && document.querySelector('[data-guide-status]')?.textContent.includes('Recorrido terminado'));
      assert.match(await guide.locator('[data-guide-status]').innerText(), /Recorrido terminado/);
    }
    assert.ok(requests.every(request => Object.values(recording.variants).some(source => request.includes(source))), 'only matching captured variants; one native timeline');
    await page.locator('.reception-enter').click(); await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
    if (width <= 920) { await page.locator('.bottom-more').click(); await page.locator('.menu-sheet [data-open-welcome]').click(); }
    else await page.locator('.sidebar [data-open-welcome]').click();
    const dialog = page.getByRole('dialog', { name: 'Así funciona el portal' }); await dialog.waitFor();
    assert.equal(await dialog.locator('video').evaluate(v => v.paused), true);
    await dialog.locator('[data-guide-tab="0"]').focus(); await page.keyboard.press('End');
    assert.equal(await dialog.locator(`[data-guide-tab="${chapters.length - 1}"]`).evaluate(node => node === document.activeElement), true);
    for (let count = 0; count < 12; count++) { await page.keyboard.press('Tab'); assert.ok(await dialog.evaluate(node => node.contains(document.activeElement))); }
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.portal-welcome video').evaluate(v => v.paused), true);
    await page.goto(url(), { waitUntil: 'networkidle' }); await page.locator('[data-reception-dismiss]').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('portal.tutorial.skip')), 'yes');
    await page.goto(url(), { waitUntil: 'networkidle' }); await page.waitForURL(value => value.hash === '#/inicio');
    await page.goto(url('/bienvenida'), { waitUntil: 'networkidle' }); await page.locator('.portal-reception').waitFor();
    report.cases.push({ engine, width, height, format, realCaptures: recording.steps.length, nativeVideo: supportsVideo, noAutoplay: true, isolatedStorage: true });
    await context.close(); await browser.close(); browser = null;
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }), page = await context.newPage();
  await page.goto(url(), { waitUntil: 'networkidle' });
  const guide = page.locator('.portal-reception');
  assert.equal(await guide.locator('[data-guide-play]').isDisabled(), true);
  for (let step = 0; step < manifest.formats.mobile.steps.length; step++) {
    if (step) await guide.locator('[data-guide-step-next]').click();
    assert.equal(await guide.locator('video').evaluate(v => v.paused), true); assert.equal(await guide.locator('[data-guide-still]').isVisible(), true);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.querySelector('[data-guide-play]').disabled);
  await guide.locator('[data-guide-tab="0"]').click(); await guide.locator('[data-guide-play]').click(); await ready(page);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await guide.locator('video').evaluate(v => v.paused), true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await guide.locator('video').evaluate(v => v.paused), true, 'visible tab does not resume');
  await guide.locator('[data-guide-play]').click(); await ready(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('.portal-reception video').paused);
  assert.equal(await guide.locator('[data-guide-still]').isVisible(), true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => document.querySelector('[data-guide-root]').dataset.captureFormat === 'desktop');
  assert.equal(await guide.locator('video').getAttribute('src'), manifest.formats.desktop.video);
  assert.equal(await guide.locator('video').evaluate(v => v.paused), true);
  await page.evaluate(() => { location.hash = '/inicio'; }); await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
  assert.equal(await page.locator('.portal-reception video').count(), 0);
  report.cases.push({ reducedMotion: true, hiddenPause: true, responsiveSource: true, routeCleanup: true });
  await context.close();
  if (process.env.QA_WELCOME_NORANGE_URL) {
    const noRange = await browser.newContext({ viewport: { width: 1440, height: 900 } }), sample = await noRange.newPage();
    sample.setDefaultTimeout(30000);
    await sample.addInitScript(() => {
      window.guideBlobEvents = [];
      const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = value => { const result = create(value); window.guideBlobEvents.push(['create', result, value.size]); return result; };
      URL.revokeObjectURL = value => { window.guideBlobEvents.push(['revoke', value]); revoke(value); };
    });
    await sample.goto(process.env.QA_WELCOME_NORANGE_URL, { waitUntil: 'networkidle' });
    const player = sample.locator('.portal-reception'), media = player.locator('video');
    await player.locator('[data-guide-mode]').selectOption('voice');
    await player.locator('[data-guide-music]').click();
    await player.locator('[data-guide-tab="1"]').click();
    const expected = manifest.formats.desktop.steps.find(step => step.chapter === 'aprobados').start;
    await player.locator('[data-guide-play]').click(); await ready(sample);
    assert.ok(Math.abs(await media.evaluate(v => v.currentTime) - expected) < 2, 'no-Range host plays the requested voice/music chapter');
    const localSource = await media.getAttribute('src');
    assert.ok(localSource.startsWith('blob:'), 'failed seek falls back to this bounded local asset');
    await player.locator('[data-guide-play]').click();
    await player.locator('[data-guide-play]').click(); await ready(sample);
    assert.equal(await media.getAttribute('src'), localSource, 'paused selected asset is reused');
    await player.locator('[data-guide-mode]').selectOption('text');
    assert.equal(await media.evaluate(v => v.paused), true);
    assert.ok(await sample.evaluate(source => window.guideBlobEvents.some(event => event[0] === 'revoke' && event[1] === source), localSource));
    await player.locator('[data-guide-play]').click(); await ready(sample);
    const secondSource = await media.getAttribute('src');
    assert.ok(secondSource.startsWith('blob:'));
    await sample.evaluate(() => { location.hash = '/inicio'; });
    await sample.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
    assert.ok(await sample.evaluate(source => window.guideBlobEvents.some(event => event[0] === 'revoke' && event[1] === source), secondSource));
    report.cases.push({ noRangeFallback: true, voiceMusicChapter: true, blobReused: true, blobRevoked: true });
    await noRange.close();
  }
  assert.deepEqual(report.errors, []); report.ok = true; console.log(JSON.stringify(report));
} catch (error) { report.errors.push(error.stack || String(error)); throw error; }
finally { await browser?.close(); await writeFile(new URL(`welcome-real-${production ? 'production' : 'local'}-report.json`, out), JSON.stringify(report, null, 2)); }
