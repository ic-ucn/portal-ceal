import {chromium} from 'playwright';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const folder='assets/tutorial-silent/sources';await fs.mkdir(folder,{recursive:true});const reports=[];const browser=await chromium.launch();
try{for(const [fmt,width,height] of [['desktop',1440,900],['mobile',390,844]]){
 const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await ctx.newPage();await page.goto('http://127.0.0.1:18116/?static=1&analytics=off#/mallas');await page.locator('[data-malla-embed-plan="p"]').click();await page.locator('.malla-embed-frame-wrap.is-loaded').waitFor();const frame=page.frameLocator('[data-malla-frame]');
 await page.locator('[data-malla-mark-toggle]').click();
 const geo=frame.locator('[data-mc-code="P-0404"]'),solid=frame.locator('[data-mc-code="P-0504"]'),soil=frame.locator('[data-mc-code="P-0604"]');
 const shot=async name=>{await page.mouse.move(0,0);await page.waitForTimeout(180);const path=folder+'/'+fmt+'-'+name+'.png';await page.screenshot({path});reports.push({format:fmt,name,path,sha256:createHash('sha256').update(await fs.readFile(path)).digest('hex')});};
 if(fmt==='mobile')await geo.scrollIntoViewIfNeeded();await shot('malla-before');
 await page.getByRole('button',{name:'Aprobados',exact:true}).click();await geo.click();await geo.locator('.mc-portal-approved-label').waitFor();await shot('malla-approved');
 await page.getByRole('button',{name:'Actuales',exact:true}).click();await solid.click();await solid.locator('.mc-portal-current-label').waitFor();if(fmt==='mobile')await soil.scrollIntoViewIfNeeded();await shot('malla-current-before');await soil.click();await soil.locator('.mc-portal-current-label').waitFor();await shot('malla-current');
 const sizes=await page.locator('.course-state-button').evaluateAll(ns=>ns.map(n=>({text:n.textContent,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));reports.push({format:fmt,buttonSizes:sizes});await ctx.close();
}}finally{await browser.close();}
await fs.writeFile('output/release-20261026/tutorial-silent/source-captures.json',JSON.stringify({date:'2026-10-26',method:'real browser UI screenshot',reports},null,2));console.log(JSON.stringify(reports.filter(x=>x.buttonSizes),null,2));
