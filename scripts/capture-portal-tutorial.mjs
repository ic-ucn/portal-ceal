// One public tutorial, captured at desktop and phone widths. No account or writes.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const base = process.env.TUTORIAL_URL || 'http://127.0.0.1:18084/';
const work = path.join(root, '.data', 'portal-guide');
const story = JSON.parse(await readFile(path.join(work, 'story.json'), 'utf8'));
await mkdir(path.join(work, 'raw'), { recursive: true });
const browser = await chromium.launch();
try {
  for (const format of ['desktop', 'mobile']) {
    if (process.env.TUTORIAL_FORMAT && process.env.TUTORIAL_FORMAT !== format) continue;
    const width = format === 'desktop' ? 1280 : 480;
    const height = format === 'desktop' ? 700 : 530;
    const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: path.join(work, 'raw'), size: { width, height } }, reducedMotion: 'reduce' });
    await context.addInitScript(() => { if (window === top) { localStorage.setItem('portal.welcome.v1', 'done'); localStorage.setItem('portal.theme', 'light'); } });
    const page = await context.newPage();
    const video = page.video(), epoch = Date.now(), segments = [];
    const go = async route => {
      await page.goto(`${base}?static=1#${route}`, { waitUntil: 'networkidle' });
      await page.locator('.page-title, .malla-commandbar-title').first().waitFor();
    };
    const point = async (target, click = true) => {
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      if (!box) throw new Error('Tutorial target is not visible');
      await page.evaluate(({x,y}) => {
        let cursor = document.querySelector('#guide-cursor');
        if (!cursor) {
          cursor = document.createElement('div'); cursor.id = 'guide-cursor';
          cursor.style.cssText = 'position:fixed;z-index:2147483647;width:25px;height:25px;border:2px solid #fff;border-radius:50%;background:#23616ac9;box-shadow:0 0 0 5px #23616a35;pointer-events:none;transform:translate(-50%,-50%);transition:left .25s,top .25s';
          document.body.append(cursor);
        }
        cursor.style.left = `${x}px`; cursor.style.top = `${y}px`;
      }, { x: box.x + box.width*.65, y: box.y+box.height*.5 });
      await page.waitForTimeout(400);
      if (click) await target.click();
    };
    const cue = async (id, action = async () => {}) => {
      const item = story.find(c => c.id === id), start = (Date.now()-epoch)/1000;
      await action();
      const elapsed = (Date.now()-epoch)/1000-start;
      if (elapsed > item.duration-.25) throw new Error(`${id} action takes too long: ${elapsed}s`);
      await page.waitForTimeout((item.duration-elapsed+.3)*1000);
      segments.push({ id, start, duration: item.duration });
      console.log(JSON.stringify({ format, cue: id, seconds: item.duration }));
    };
    await go('/');
    await cue('inicio');

    await go('/mallas');
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
    // Warm both actual embedded plans before recording the switch.
    await page.locator('[data-malla-embed-plan="o"]').click();
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
    await page.locator('[data-malla-embed-plan="p"]').click();
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
    await cue('planes', async () => { await page.waitForTimeout(1000); await point(page.locator('[data-malla-embed-plan="o"]')); await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor(); });
    let frame = await (await page.locator('.malla-embed-frame').elementHandle()).contentFrame();
    await cue('ramo', async () => {
      await page.waitForTimeout(700);
      await point(frame.locator('.mc-card').filter({ hasText: 'Cálculo I' }).first());
      await frame.locator('.mc-modal').waitFor({ state: 'visible' });
    });

    await go('/material');
    await page.locator('[data-material-course-select]').selectOption({ label: 'Cálculo I' });
    await cue('buscar', async () => {
      await point(page.locator('[data-material-search]'));
      await page.locator('[data-material-search]').pressSequentially('Guía', { delay: 150 });
      await page.waitForTimeout(600);
      await page.locator('a[href^="#/material/"]:visible').first().scrollIntoViewIfNeeded();
    });
    await cue('recurso', async () => {
      await point(page.locator('a[href^="#/material/"]:visible').first());
      const open = page.getByRole('link', { name: 'Abrir material', exact: true });
      await open.waitFor();
      await point(open, false);
    });

    await go('/calendario');
    await cue('mes', async () => { await point(page.locator('[data-calendar-month="1"]')); });
    const date = page.locator('[data-calendar-date="2026-10-09"]').first();
    const target = await date.count() ? date : page.locator('[data-calendar-date]').first();
    await cue('fecha', async () => {
      await point(target);
      await page.locator('.calendar-detail-modal').waitFor({ state: 'visible' });
      await page.waitForTimeout(2200);
      await point(page.locator('[data-calendar-modal-close]').first());
    });

    await go('/');
    if (format === 'mobile') await page.locator('.bottom-more').click();
    const guide = page.locator(format === 'mobile' ? '.menu-sheet [data-open-welcome]' : '.sidebar [data-open-welcome]');
    await cue('guia', async () => { await point(guide, false); });
    const raw = await video.path();
    await context.close();
    await writeFile(path.join(work, `${format}-capture.json`), JSON.stringify({ width, height, raw, segments }, null, 2));
  }
} finally { await browser.close(); }
