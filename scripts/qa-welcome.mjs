import assert from 'node:assert/strict';
import { chromium, webkit, firefox } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const base = process.env.QA_WELCOME_URL || 'http://127.0.0.1:18114/?static=1&analytics=off';
const production = new URL(base).hostname === 'ceicucn.cl';
const configs = production ? [['chromium',1440,900],['chromium',390,844]] : [['chromium',1440,900],['chromium',390,844],['chromium',320,568],['chromium',844,390],['webkit',390,844],['firefox',390,844]];
const sandbox = {window:{}}; vm.runInNewContext(await readFile('assets/tutorial-story/manifest.js','utf8'),sandbox);
const manifest = sandbox.window.PortalTutorialCapture;
assert.equal(manifest.captureMethod,'computer-use');
for (const rec of Object.values(manifest.formats)) for (const step of rec.steps) {
  assert.equal(createHash('sha256').update(await readFile(step.image)).digest('hex'),step.sha256);
  assert.equal(createHash('sha256').update(await readFile(step.sourceImage)).digest('hex'),step.sourceSha256);
  assert.ok(step.end > step.start);
}
const url = route => {const u=new URL(base);u.searchParams.set('review','20261013news');u.hash=route;return u.href;};
const report={ok:false,production,cases:[],errors:[]}; let browser;
async function layout(page, scope='.portal-reception') {
  assert.equal(await page.locator(scope+' button').count(),2,'exactly two external actions');
  assert.equal(await page.locator(scope+' select, '+scope+' a, '+scope+' .guide-chapters, '+scope+' .guide-copy').count(),0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const fit=await page.locator(scope+' .reception-actions').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});
  assert.equal(fit,true,'both actions fit the viewport');
  assert.ok(await page.locator(scope+' button').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().height>=44)));
}
try {
 for (const [engine,width,height] of configs) {
  if (process.env.QA_WELCOME_ENGINE && process.env.QA_WELCOME_ENGINE!==engine) continue;
  browser=await ({chromium,webkit,firefox}[engine]).launch();
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.setDefaultTimeout(production?45000:20000);
  page.on('pageerror',e=>report.errors.push(engine+'/'+width+': '+e.message));
  await page.goto(url('/'),{waitUntil:'domcontentloaded'}); await page.locator('.news-video').waitFor();await layout(page);
  const video=page.locator('.portal-reception video');
  assert.equal(await video.evaluate(v=>v.paused&&!v.autoplay),true);
  assert.match(await video.getAttribute('src'),/voice/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('portal.tutorial.skip')),null);
  await video.press('Enter');
  await page.waitForFunction(()=>{const v=document.querySelector('.portal-reception video');return v&&!v.paused&&v.currentTime>.2;});
  await video.press('Enter'); assert.equal(await video.evaluate(v=>v.paused),true);
  assert.equal(await video.evaluate(v=>v.error),null);
  // Seek near the real ending, then allow playback to complete naturally.
  await video.evaluate(v=>{v.currentTime=v.duration-.35;}); await video.press('Enter');
  await page.getByRole('heading',{name:'Inicio',exact:true}).waitFor();
  assert.equal(new URL(page.url()).hash,'#/inicio');
  await page.goto(url('/'));await page.locator('.news-video').waitFor();
  await page.locator('.reception-skip').click();await page.getByRole('heading',{name:'Inicio',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('portal.tutorial.skip')),null,'skip does not set a permanent preference');
  await page.goto(url('/'));await page.locator('[data-reception-dismiss]').click();await page.getByRole('heading',{name:'Inicio',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('portal.tutorial.skip')),'yes');
  await page.goto(url('/'));await page.getByRole('heading',{name:'Inicio',exact:true}).waitFor();assert.equal(await page.locator('.portal-reception').count(),0);
  await page.goto(url('/mi-semana'));await page.getByRole('heading',{name:'Mi semana',exact:true}).waitFor();assert.equal(await page.locator('.portal-reception').count(),0,'deep links open directly');
  // Voluntary reopening respects the current section, including Escape and ending.
  await page.evaluate(()=>PortalWelcome.open(document.querySelector('#main-content')));
  await page.locator('.portal-welcome[open]').waitFor();await layout(page,'.portal-welcome[open]');
  const modalVideo=page.locator('.portal-welcome video');await modalVideo.press('Enter');
  await page.waitForFunction(()=>{const v=document.querySelector('.portal-welcome video');return !v.paused&&v.currentTime>.2;});
  await modalVideo.evaluate(v=>{v.currentTime=v.duration-.35;});await page.waitForFunction(()=>!document.querySelector('.portal-welcome').open);
  assert.equal(new URL(page.url()).hash,'#/mi-semana','reopened video never redirects');
  await page.evaluate(()=>PortalWelcome.open(document.querySelector('#main-content')));await modalVideo.press('Escape');
  assert.equal(await page.locator('.portal-welcome').evaluate(n=>n.open),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('portal.tutorial.skip')),'yes');
  report.cases.push({engine,width,height,playback:true,naturalEnd:true,twoActions:true,permanentChoice:true,reopen:true});
  await context.close();await browser.close();browser=null;
 }
 if(!production){
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url('/'));const video=page.locator('.portal-reception video');
  assert.equal(await video.evaluate(v=>v.paused),true);await video.press('Enter');await page.waitForFunction(()=>document.querySelector('video').currentTime>1);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await video.evaluate(v=>v.paused),true);
  const position=await video.evaluate(v=>v.currentTime);await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>{const v=document.querySelector('video');return v.src.includes('/desktop/')&&v.readyState>=2&&!v.seeking;});
  assert.ok(Math.abs((await video.evaluate(v=>v.currentTime))-position)<.6);assert.equal(await video.evaluate(v=>v.paused),true);
  await page.getByRole('button',{name:'Saltar video',exact:true}).click();assert.equal(await page.locator('.portal-reception').count(),0);
  await context.close();await browser.close();browser=null;report.cases.push({reducedMotion:true,visibilityPause:true,resizePreservesPosition:true});
  if(process.env.QA_WELCOME_NORANGE_URL){
   browser=await chromium.launch();const ctx=await browser.newContext();const sample=await ctx.newPage();
   await ctx.addInitScript(()=>{window.blobRevoked=[];const original=URL.revokeObjectURL;URL.revokeObjectURL=url=>{window.blobRevoked.push(url);original(url);};});
   await sample.goto(process.env.QA_WELCOME_NORANGE_URL);const player=sample.locator('.portal-reception video');await player.press('Enter');
   await sample.waitForFunction(()=>{const v=document.querySelector('video');return v.src.startsWith('blob:')&&!v.paused&&v.currentTime>.3;});
   const blob=await player.getAttribute('src');await player.evaluate(v=>{v.currentTime=v.duration-.35;});
   await sample.getByRole('heading',{name:'Inicio',exact:true}).waitFor();assert.equal(await sample.evaluate(blob=>window.blobRevoked.includes(blob),blob),true);
   report.cases.push({noRangeFallback:true,realEnding:true,blobRevoked:true});await ctx.close();await browser.close();browser=null;
  }
  // Failed media leaves both exits usable.
  browser=await chromium.launch();const failure=await browser.newPage();await failure.route('**/*.mp4*',r=>r.abort());await failure.goto(url('/'));
  await failure.locator('video').press('Enter');await failure.locator('.news-media-error').waitFor({state:'visible'});await failure.locator('.reception-skip').click();await failure.getByRole('heading',{name:'Inicio',exact:true}).waitFor();
  report.cases.push({failedVideoCanSkip:true});
 }
 assert.deepEqual(report.errors,[]);report.ok=true;
} catch(e){report.errors.push(e.stack||String(e));throw e;}
finally{await browser?.close();await mkdir('qa-screenshots',{recursive:true});await writeFile('qa-screenshots/welcome-real-'+(production?'production':'local')+'-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
