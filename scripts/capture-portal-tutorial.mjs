// Record a single, continuous journey. Every navigation is visible and clicked.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd(), base = process.env.TUTORIAL_URL || 'http://127.0.0.1:18084/';
const work = path.join(root, '.data', 'portal-guide-v3');
const story = JSON.parse(await readFile(path.join(work, 'story.json'), 'utf8'));
await mkdir(path.join(work, 'raw'), { recursive: true });
const browser = await chromium.launch();
try {
  for (const format of ['desktop', 'mobile']) {
    if (process.env.TUTORIAL_FORMAT && process.env.TUTORIAL_FORMAT !== format) continue;
    const width = format === 'desktop' ? 1440 : 480, height = format === 'desktop' ? 810 : 700;
    const context = await browser.newContext({ viewport:{width,height}, recordVideo:{dir:path.join(work,'raw'),size:{width,height}}, reducedMotion:'no-preference' });
    await context.addInitScript(() => { if (window === top) localStorage.setItem('portal.theme','light'); });
    const page = await context.newPage(), video=page.video(), epoch=Date.now(), segments=[], moves=[];
    await page.goto(`${base}?static=1#/mallas`, {waitUntil:'networkidle'});
    await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();
    for (const plan of ['o','p']) { await page.locator(`[data-malla-embed-plan="${plan}"]`).click(); await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor(); }
    await page.locator('.malla-close').click();
    await page.locator('.home-date-row').first().waitFor();
    await page.evaluate(() => {
      const cursor=document.createElement('div');cursor.id='guide-cursor';
      cursor.style.cssText='position:fixed;left:64%;top:34%;z-index:2147483647;width:22px;height:28px;pointer-events:none;filter:drop-shadow(0 1px 2px #0005)';
      cursor.innerHTML='<svg viewBox="0 0 24 30" width="22" height="28"><path d="M3 2 L3 24 L9 18 L14 28 L18 26 L13 16 L22 16 Z" fill="#fff" stroke="#18343b" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      document.body.append(cursor);
      window.guidePoint={x:innerWidth*.64,y:innerHeight*.34};
    });
    await page.waitForTimeout(800);
    const traceStart=(Date.now()-epoch)/1000;
    const pointer = async (x,y) => {
      const start=await page.evaluate(()=>window.guidePoint);
      const duration=Math.min(1350,Math.max(500,Math.hypot(x-start.x,y-start.y)*1.5));
      const at=(Date.now()-epoch)/1000-traceStart;
      await page.evaluate(async ({x,y,duration}) => {
        const from=window.guidePoint, cursor=document.querySelector('#guide-cursor'), dx=x-from.x,dy=y-from.y;
        const bend=Math.min(28,Math.hypot(dx,dy)*.045), length=Math.max(1,Math.hypot(dx,dy));
        const c1={x:from.x+dx*.3-dy/length*bend,y:from.y+dy*.3+dx/length*bend};
        const c2={x:from.x+dx*.72+dy/length*bend*.4,y:from.y+dy*.72-dx/length*bend*.4};
        await new Promise(resolve=>{let first;function frame(t){first??=t;const u=Math.min(1,(t-first)/duration),q=u*u*(3-2*u),r=1-q;const px=r*r*r*from.x+3*r*r*q*c1.x+3*r*q*q*c2.x+q*q*q*x,py=r*r*r*from.y+3*r*r*q*c1.y+3*r*q*q*c2.y+q*q*q*y;cursor.style.left=px+'px';cursor.style.top=py+'px';if(u<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
        window.guidePoint={x,y};
      },{x,y,duration});
      await page.mouse.move(x,y);moves.push({at,from:start,to:{x,y},duration:duration/1000,kind:'bezier-ease-in-out'});
    };
    const point = async (target, click=true) => {
      await target.waitFor({state:'visible'});
      let box=await target.boundingBox();
      if(box.y<80||box.y+box.height>height-76){
        const delta=box.y+box.height/2-height*.48;
        await page.evaluate(d=>window.scrollBy({top:d,behavior:'smooth'}),delta);await page.waitForTimeout(950);box=await target.boundingBox();
      }
      if(box.y<0||box.y>height)throw new Error('Target out of frame');
      const x=box.x+box.width*.52,y=box.y+Math.min(box.height/2,32);
      await pointer(x,y);await page.waitForTimeout(260);
      if(click){
        await page.evaluate(({x,y})=>{const ring=document.createElement('div');ring.style.cssText=`position:fixed;left:${x-13}px;top:${y-13}px;width:26px;height:26px;border:2px solid #23616a;z-index:2147483646;border-radius:50%;pointer-events:none`;document.body.append(ring);const animation=ring.animate([{opacity:.7,transform:'scale(.6)'},{opacity:0,transform:'scale(1.6)'}],{duration:480});animation.finished.then(()=>ring.remove());},{x,y});
        await page.mouse.click(x,y,{delay:80});
      }
    };
    const nav = route => page.locator(`${format==='mobile'?'.bottom-nav':'.sidebar'} a[href="#/${route}"]`);
    const cue = async (id, action=async()=>{}) => {
      const item=story.find(c=>c.id===id), start=(Date.now()-epoch)/1000;
      await page.waitForTimeout(500);await action();
      const elapsed=(Date.now()-epoch)/1000-start;
      if(elapsed>item.duration-.1)throw new Error(`${format}/${id}: action ${elapsed.toFixed(2)} > cue ${item.duration}`);
      await page.waitForTimeout((item.duration-elapsed)*1000);
      segments.push({id,start,duration:item.duration});console.log(JSON.stringify({format,cue:id,duration:item.duration}));
    };
    await cue('inicio');
    await cue('calendario',async()=>{await point(nav('calendario'));await page.locator('.month-grid').waitFor();});
    await cue('mes',async()=>{await point(page.locator('[data-calendar-month="1"]'));});
    await cue('fecha',async()=>{await point(page.locator('[data-calendar-date="2026-10-19"]').first());await page.locator('.calendar-detail-modal').waitFor();});
    await cue('fuente',async()=>{await point(page.locator('.calendar-detail-modal .calendar-event-source').last(),false);await point(page.locator('[data-calendar-modal-close]').first());});
    await cue('mallas',async()=>{await point(nav('mallas'));await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();});
    await cue('planes',async()=>{await point(page.locator('[data-malla-embed-plan="o"]'));await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();});
    const frame=await (await page.locator('.malla-embed-frame').elementHandle()).contentFrame();
    await cue('ramo',async()=>{await point(frame.locator('.mc-card').filter({hasText:'Cálculo I'}).first());await frame.locator('.mc-modal').waitFor();});
    await cue('material',async()=>{await point(nav('material'));await page.locator('[data-material-search]').waitFor();});
    await cue('buscar',async()=>{const input=page.locator('[data-material-search]');await point(input);await input.pressSequentially('Guía',{delay:145});await page.waitForTimeout(500);});
    await cue('recurso',async()=>{await point(page.locator('a[href^="#/material/"]:visible').first());await point(page.getByRole('link',{name:'Abrir material',exact:true}),false);});
    await cue('volver',async()=>{await point(nav('inicio'));await page.locator('.home-date-row').first().waitFor();});
    const raw=await video.path();await context.close();
    await writeFile(path.join(work,`${format}-capture.json`),JSON.stringify({width,height,raw,segments,moves,continuous:true,start:segments[0].start,end:segments.at(-1).start+segments.at(-1).duration},null,2));
  }
}finally{await browser.close();}
