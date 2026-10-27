import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// A static-only server: no operational database, accounts, providers or emails.
const port = Number(process.env.QA_VIDEO_PORT || 18164);
const base = `http://127.0.0.1:${port}/?static=1&analytics=off`;
const output = process.env.QA_VIDEO_OUTPUT || 'output/release-20261026/video-stability';
await mkdir(output, { recursive: true });
const root = process.cwd();
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.mp4':'video/mp4', '.vtt':'text/vtt', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, base).pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    const headers = { 'content-type':mime[path.extname(file)] || 'application/octet-stream', 'accept-ranges':'bytes' };
    if (range) {
      const start = Number(range[1]), end = Math.min(range[2] ? Number(range[2]) : body.length - 1, body.length - 1);
      res.writeHead(206, { ...headers, 'content-length':end - start + 1, 'content-range':`bytes ${start}-${end}/${body.length}` });
      res.end(req.method === 'HEAD' ? undefined : body.subarray(start, end + 1));
    } else { res.writeHead(200, { ...headers, 'content-length':body.length }); res.end(req.method === 'HEAD' ? undefined : body); }
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
const report = { ok: false, cases: [] };
let browser;
async function run(name, test) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  try {
    await ctx.route('https://**', route => route.abort());
    const evidence = await test(page, ctx);
    report.cases.push({ name, ok: true, ...evidence });
  } catch (error) { report.cases.push({ name, ok: false, error: error.stack }); }
  finally { await ctx.close(); }
}
async function play(page) {
  await page.goto(base);
  await page.locator('.portal-reception video').press('Enter');
  await page.waitForFunction(() => document.querySelector('video').currentTime > 1);
}
const snapshot = page => page.locator('.portal-reception video').evaluate(v => ({ time: v.currentTime, paused: v.paused, src: v.getAttribute('src') }));
async function advancing(page) {
  const samples = [];
  for (let i = 0; i < 5; i++) { samples.push((await snapshot(page)).time); await page.waitForTimeout(300); }
  assert.ok(samples.every((value, i) => !i || value >= samples[i - 1] - .25), `Non-monotonic timeline: ${samples}`);
  assert.ok(samples.at(-1) - samples[0] > .6, `Playback froze after restoration: ${samples}`);
  return samples;
}
try {
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch();
  await run('delayed HEAD and user seek retain latest position in no-Range fallback', async (page, ctx) => {
    await ctx.route('**/*.mp4*', async route => {
      if (route.request().method() !== 'HEAD') return route.continue();
      await new Promise(r => setTimeout(r, 2500));
      await route.fulfill({ status: 200, headers: { 'content-type': 'video/mp4' } });
    });
    await play(page);
    await page.locator('video').evaluate(v => { v.currentTime = 12; });
    await page.waitForFunction(() => document.querySelector('video').currentTime >= 12);
    const before = await snapshot(page);
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v.src.startsWith('blob:') && !v.paused && !v.seeking && v.readyState >= 3; });
    const after = await snapshot(page);
    assert.ok(after.time >= before.time - .25, `Progress went backwards: ${JSON.stringify({ before, after })}`);
    return { before, after, samples: await advancing(page) };
  });
  await run('playing format change preserves position and resumes playback', async (page, ctx) => {
    await ctx.route('**/*.mp4*', route => route.request().method() === 'HEAD' ? route.fulfill({ status: 200, headers: { 'accept-ranges': 'bytes' } }) : route.continue());
    await play(page);
    await page.locator('video').evaluate(v => { v.currentTime = 15; });
    await page.waitForFunction(() => !document.querySelector('video').seeking);
    const before = await snapshot(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v.src.includes('/mobile/') && v.readyState >= 3 && !v.seeking; });
    await page.waitForTimeout(350);
    const after = await snapshot(page);
    assert.equal(after.paused, false, `Playing tutorial paused on orientation change: ${JSON.stringify({ before, after })}`);
    assert.ok(after.time >= before.time - .25, `Format change lost progress: ${JSON.stringify({ before, after })}`);
    return { before, after, samples: await advancing(page) };
  });
  await run('reception replacement preserves the active media element and position', async (page, ctx) => {
    await ctx.route('**/*.mp4*', route => route.request().method() === 'HEAD' ? route.fulfill({ status: 200, headers: { 'accept-ranges': 'bytes' } }) : route.continue());
    await play(page);
    await page.locator('video').evaluate(v => { v.currentTime = 20; v.dataset.samePlayer = 'yes'; });
    await page.waitForFunction(() => !document.querySelector('video').seeking);
    const before = await snapshot(page);
    await page.evaluate(() => { document.querySelector('.portal-reception').outerHTML = PortalWelcome.renderReception(); PortalWelcome.onRender(); });
    await page.waitForTimeout(350);
    const after = await snapshot(page);
    assert.equal(await page.locator('video').getAttribute('data-same-player'), 'yes', 'Active video element was replaced during rendering');
    assert.equal(after.paused, false);
    assert.ok(after.time >= before.time - .25, `Rerender lost progress: ${JSON.stringify({ before, after })}`);
    const samples = await advancing(page);
    await page.locator('.reception-skip').click();
    await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
    return { before, after, samples, skipAfterReplacement: true };
  });
  await run('native pause and seek during delayed HEAD remain paused after blob conversion', async (page, ctx) => {
    await ctx.route('**/*.mp4*', async route => {
      if (route.request().method() !== 'HEAD') return route.continue();
      await new Promise(r => setTimeout(r, 2500));
      await route.fulfill({ status: 200 });
    });
    await play(page);
    await page.locator('video').evaluate(v => { v.pause(); v.currentTime = 18; });
    await page.waitForFunction(() => !document.querySelector('video').seeking);
    const before = await snapshot(page);
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v.src.startsWith('blob:') && v.readyState >= 3 && !v.seeking; });
    await page.waitForTimeout(400);
    const after = await snapshot(page);
    assert.equal(after.paused, true, 'Background preparation overrode a native pause');
    assert.ok(Math.abs(after.time - before.time) < .25, `Paused seek lost: ${JSON.stringify({ before, after })}`);
    return { before, after };
  });
  await run('seek during delayed fallback GET supersedes the earlier playback position', async (page, ctx) => {
    await ctx.route('**/*.mp4*', async route => {
      if (route.request().method() === 'HEAD') return route.fulfill({ status: 200 });
      if (route.request().resourceType() === 'fetch') await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await play(page);
    await page.locator('video').evaluate(v => { v.currentTime = 28; });
    await page.waitForFunction(() => document.querySelector('video').currentTime >= 28 && !document.querySelector('video').seeking);
    const before = await snapshot(page);
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v.src.startsWith('blob:') && !v.paused && !v.seeking && v.readyState >= 3; });
    const after = await snapshot(page);
    assert.ok(after.time >= before.time - .25, `Delayed GET restored a stale position: ${JSON.stringify({ before, after })}`);
    return { before, after, samples: await advancing(page) };
  });
  await run('pause and play while Range HEAD is pending preserve the latest intent', async (page, ctx) => {
    await ctx.route('**/*.mp4*', async route => {
      if (route.request().method() !== 'HEAD') return route.continue();
      await new Promise(r => setTimeout(r, 2500));
      await route.fulfill({ status: 200, headers: { 'accept-ranges': 'bytes' } });
    });
    await play(page);
    await page.locator('video').evaluate(v => v.pause());
    await page.waitForTimeout(150);
    await page.locator('video').press('Enter');
    await page.waitForTimeout(1800);
    const after = await snapshot(page);
    assert.equal(after.paused, false);
    assert.ok(!after.src.startsWith('blob:'));
    return { after, samples: await advancing(page) };
  });
  await run('blob playback rejection restores the ordinary source without restarting', async (page, ctx) => {
    await ctx.addInitScript(() => {
      const original = HTMLMediaElement.prototype.play;
      let rejected = false;
      HTMLMediaElement.prototype.play = function () {
        if (!rejected && this.src.startsWith('blob:')) { rejected = true; window.__rejectedBlob = true; return Promise.reject(new Error('controlled blob engine rejection')); }
        return original.call(this);
      };
    });
    await ctx.route('**/*.mp4*', async route => {
      if (route.request().method() !== 'HEAD') return route.continue();
      await new Promise(r => setTimeout(r, 2500));
      await route.fulfill({ status: 200 });
    });
    await play(page);
    await page.locator('video').evaluate(v => { v.currentTime = 32; });
    await page.waitForFunction(() => document.querySelector('video').currentTime >= 32 && !document.querySelector('video').seeking);
    const before = await snapshot(page);
    await page.waitForFunction(() => { const v = document.querySelector('video'); return window.__rejectedBlob && !v.src.startsWith('blob:') && !v.paused && v.readyState >= 3 && !v.seeking; });
    const after = await snapshot(page);
    assert.ok(after.time >= before.time - .25, `Blob rejection reset playback: ${JSON.stringify({ before, after })}`);
    return { before, after, samples: await advancing(page) };
  });
  await run('a host with no Range support still converts to a seekable paused video', async (page, ctx) => {
    await ctx.route('**/*.mp4*', async route => {
      if (route.request().method() === 'HEAD') {
        await new Promise(r => setTimeout(r, 2500));
        return route.fulfill({ status: 200 });
      }
      const filename = path.resolve(root, '.' + new URL(route.request().url()).pathname);
      await route.fulfill({ status: 200, body: await readFile(filename), headers: { 'content-type':'video/mp4' } });
    });
    await play(page);
    await page.locator('video').evaluate(v => v.pause());
    const before = await snapshot(page);
    await page.waitForFunction(() => { const v = document.querySelector('video'); return v.src.startsWith('blob:') && v.readyState >= 3 && !v.seeking; });
    const after = await snapshot(page);
    assert.equal(after.paused, true);
    assert.ok(Math.abs(after.time - before.time) < .25, `No-Range host lost paused progress: ${JSON.stringify({ before, after })}`);
    // A plain 200 host may clamp seeks outside its native seekable range to 0.
    // Exercise arbitrary seeking only once the complete Blob is available.
    await page.locator('video').evaluate(v => { v.currentTime = 23; });
    await page.waitForFunction(() => { const v = document.querySelector('video'); return !v.seeking && v.currentTime >= 23; });
    await page.locator('video').press('Enter');
    return { before, after, samples: await advancing(page) };
  });
  report.ok = report.cases.every(c => c.ok);
} finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); }
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
