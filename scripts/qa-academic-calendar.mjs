import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(readFileSync('src/mock-data.js','utf8'),sandbox);const data=sandbox.window.PortalMock;
assert.equal(data.events.length,104);assert.equal(data.calendarSource.campus,'Antofagasta');
for(const e of data.events){assert.equal(e.campus,'Antofagasta');assert.ok(e.sourcePage>=3&&e.sourcePage<=6);assert.ok(!e.endDate||e.endDate>=e.date);assert.ok(!/Coquimbo/i.test(e.title+' '+e.description));}
const period=(title,a,b)=>assert.ok(data.events.some(e=>e.title===title&&e.date===a&&e.endDate===b));
period('Receso Fiestas Patrias','2026-09-14','2026-09-20');period('Renuncia de asignaturas II semestre','2026-10-13','2026-10-30');period('Semana de autocuidado','2026-10-19','2026-10-24');period('Cursos de Verano 2027','2027-01-07','2027-01-28');
assert.ok(data.events.some(e=>e.date==='2026-10-23'&&/gratuidad/.test(e.title)));assert.ok(data.events.some(e=>e.date==='2026-12-12'&&/evaluación docente/.test(e.title)));
assert.ok(data.events.filter(e=>e.date.startsWith('2027')).every(e=>e.provisional));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});const base=process.env.QA_CALENDAR_URL||'http://127.0.0.1:18084/?static=1';page.setDefaultNavigationTimeout(90000);
const url=date=>{const u=new URL(base);u.searchParams.set('review','calendar-20260921');u.hash='/calendario?date='+date;return u.href;};
try{
 for(const [date,text] of [['2026-09-20','Receso Fiestas Patrias'],['2026-10-24','Semana de autocuidado'],['2026-10-30','Renuncia de asignaturas'],['2027-01-28','Cursos de Verano 2027']]){
  await page.goto(url(date),{waitUntil:'networkidle'});const dialog=page.locator('.calendar-detail-modal');await dialog.waitFor();assert.ok((await dialog.innerText()).includes(text));
  const source=await dialog.locator('.calendar-event-source').first().getAttribute('href');assert.ok(/calendario-antofagasta-077-2026\.pdf#page=[3-6]/.test(source));
  const response=await page.request.get(source.split('#')[0]);assert.equal(response.status(),200);assert.ok(response.headers()['content-type'].includes('pdf'));
  if(date.startsWith('2027'))assert.ok((await dialog.innerText()).includes('sujeto a modificaciones'));
  await page.keyboard.press('Escape');
 }
 await page.goto(url('2026-09-01'),{waitUntil:'networkidle'});await page.keyboard.press('Escape');
 assert.equal(await page.locator('.calendar-month-agenda').getByText('Oferta académica 2027: generación',{exact:true}).count(),0);
 await page.locator('[data-calendar-audience="all"]').click();assert.equal(await page.locator('.calendar-month-agenda').getByText('Oferta académica 2027: generación',{exact:true}).count(),1);
 // A previous API release must not restore the old partial calendar or delete custom events.
 if(!process.env.QA_CALENDAR_URL){
  await page.route('**/api/bootstrap',r=>r.fulfill({json:{data:{calendarSource:{version:'dgpre-antofagasta-decreto-077-2026-20260713'},events:[{id:'evt-acad-old',date:'2026-09-14',title:'Old'},{id:'custom-preserved',date:'2026-10-24',title:'Actividad CEAL conservada'}]}}}));
  await page.goto('http://127.0.0.1:18084/#/calendario?date=2026-10-24',{waitUntil:'networkidle'});assert.ok((await page.locator('.calendar-detail-modal').innerText()).includes('Semana de autocuidado'));assert.ok((await page.locator('.calendar-detail-modal').innerText()).includes('Actividad CEAL conservada'));
 }
 console.log(JSON.stringify({ok:true,events:104,periodBoundaries:4,sourceLinks:true,provisionalJanuary:true,audienceFilter:true}));
}finally{await browser.close();}
