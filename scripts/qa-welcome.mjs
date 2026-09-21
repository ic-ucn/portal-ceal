import assert from 'node:assert/strict';
import {chromium,webkit,firefox} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_WELCOME_URL||'http://127.0.0.1:18084/?static=1';
const production=new URL(base).hostname==='ceicucn.cl';
const configs=production?[['chromium',1440,900],['chromium',390,844]]:[['chromium',1440,900],['chromium',390,844],['chromium',320,568],['chromium',844,390],['webkit',390,844],['firefox',390,844]];
const out=new URL('../qa-screenshots/',import.meta.url);await mkdir(out,{recursive:true});
const report={ok:false,production,cases:[],errors:[]};
const url=(route='/')=>{const u=new URL(base);u.searchParams.set('review','20260921a');u.hash=route;return u.href;};
try{
 for(const [engine,width,height] of configs){
  const browser=await({chromium,webkit,firefox}[engine]).launch();const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();page.setDefaultNavigationTimeout(90000);
  page.on('pageerror',e=>report.errors.push(e.message));const media=[];page.on('request',r=>{if(/portal-guia-.*\.mp4/.test(r.url()))media.push(r.url());});
  await page.goto(url(),{waitUntil:'networkidle'});await page.locator('.portal-reception').waitFor();
  assert.equal(await page.getByRole('dialog').count(),0,'entry is a page, not a modal');assert.deepEqual(media,[],'no initial video download');
  assert.equal(await page.locator('.reception-sections a').count(),3);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'receiving page has no horizontal overflow');
  await page.screenshot({path:new URL(`reception-${production?'production-':''}${engine}-${width}-light.png`,out).pathname.replace(/^\/(?=[A-Z]:)/,'')});
  await page.evaluate(()=>localStorage.setItem('portal.welcome.v1','done'));await page.reload({waitUntil:'networkidle'});await page.locator('.portal-reception').waitFor();
  await page.locator('[data-portal-theme-toggle]').click();assert.equal(await page.locator('body.theme-dark').count(),1);
  await page.screenshot({path:new URL(`reception-${production?'production-':''}${engine}-${width}-dark.png`,out).pathname.replace(/^\/(?=[A-Z]:)/,'')});
  // Headless Windows audio can suspend playback: decode silently for automation.
  const player=page.locator('.portal-reception video');await player.evaluate(v=>{v.muted=true;v.dataset.identity='preserved';});
  await page.locator('[data-reception-play]').click();await page.waitForFunction(()=>document.querySelector('.portal-reception video')?.currentTime>.5,null,{timeout:20000});
  const duration=await player.evaluate(v=>v.duration);assert.ok(duration>80&&duration<110,'unhurried short tutorial');
  const expectedFormat=width<=920?'mobile':'desktop';
  assert.ok((await player.getAttribute('src')).includes(`portal-guia-${expectedFormat}.mp4`),'video matches portal layout');
  assert.ok((await player.getAttribute('poster')).includes(`portal-guia-${expectedFormat}.jpg`));
  assert.ok((await player.locator('track').getAttribute('src')).includes(`portal-guia-${expectedFormat}.vtt`));
  await page.locator('[data-portal-theme-toggle]').click();assert.equal(await player.getAttribute('data-identity'),'preserved');assert.equal(await player.evaluate(v=>v.paused),false,'theme does not interrupt video');
  await page.locator('.reception-sections a[href="#/calendario"]').click();await page.locator('.month-grid').waitFor();assert.equal(await page.locator('.portal-reception').count(),0);
  await page.reload({waitUntil:'networkidle'});assert.equal(new URL(page.url()).hash,'#/calendario','deep links remain direct');assert.equal(await page.getByRole('dialog').count(),0);
  await page.locator(width<=920?'.mobile-brand':'.sidebar-brand').click();await page.locator('.portal-reception').waitFor();
  await page.locator('.reception-home').click();await page.getByRole('heading',{name:'Inicio',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'#/inicio');
  if(width<=920){await page.locator('.bottom-more').click();await page.locator('.menu-sheet [data-open-welcome]').click();}else await page.locator('.sidebar [data-open-welcome]').click();
  const dialog=page.getByRole('dialog',{name:'Así funciona el portal'});await dialog.waitFor();
  assert.ok((await dialog.locator('video').getAttribute('data-source')).includes(`portal-guia-${expectedFormat}.mp4`),'manual guide uses the same device format');
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.ok(await dialog.evaluate(d=>d.contains(document.activeElement)));}
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  report.cases.push({engine,width,height,permanentReception:true,noInitialDownload:true,deepLink:true,playback:duration,themePreservesPlayback:true});await context.close();await browser.close();
 }
 assert.deepEqual(report.errors,[]);report.ok=true;console.log(JSON.stringify(report));
}finally{await writeFile(new URL(`welcome-${production?'production':'local'}-report.json`,out),JSON.stringify(report,null,2));}
