import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const baseUrl = process.env.PORTAL_URL || 'http://localhost:8080';
const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const shotDir = path.join(root, 'qa-screenshots');
const reportPath = path.join(root, 'qa-report.json');

const routes = [
  ['inicio', '#/'],
  ['comunicados', '#/comunicados'],
  ['comunicado-detalle', '#/comunicados/com-001'],
  ['calendario', '#/calendario'],
  ['acuerdo-detalle', '#/acuerdos/agr-003'],
  ['casos', '#/casos'],
  ['nuevo-caso', '#/casos/nuevo'],
  ['caso-detalle', '#/casos/case-2026-0052'],
  ['material', '#/material'],
  ['subir-material', '#/material/subir'],
  ['material-detalle', '#/material/mat-001'],
  ['mallas', '#/mallas'],
  ['ramo-detalle', '#/ramo/planP/P-0402'],
  ['apoyo', '#/apoyo'],
  ['ayudantia-detalle', '#/ayudantias/ay-001'],
  ['tramite-detalle', '#/tramites/proc-001'],
  ['perfil', '#/perfil'],
  ['mas', '#/mas']
];

const viewportSets = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true }
];

const report = {
  baseUrl,
  checkedAt: new Date().toISOString(),
  routes: [],
  flows: [],
  screenshots: [],
  consoleErrors: []
};

await fs.mkdir(shotDir, { recursive: true });

function pageUrl(hash, tag) {
  return `${baseUrl}/?qa=${encodeURIComponent(tag)}${hash}`;
}

function fail(message) {
  const err = new Error(message);
  err.qaFailure = true;
  throw err;
}

async function makePage(browser, viewport, role = 'student') {
  const context = await browser.newContext({ viewport, isMobile: !!viewport.isMobile });
  const page = await context.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      report.consoleErrors.push({ viewport: viewport.name, role, message: msg.text() });
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    report.consoleErrors.push({ viewport: viewport.name, role, message: err.message });
  });
  await page.goto(pageUrl('#/login', `${viewport.name}-${role}-login`), { waitUntil: 'domcontentloaded' });
  const selector = role === 'ceal'
    ? '.role-card[data-login-role="ceal"]'
    : '.role-card[data-login-role="student"]';
  await page.locator(selector).click();
  await page.waitForURL(/#\/$/, { timeout: 10000 });
  return { context, page, errors };
}

async function basicPageChecks(page, viewportName, routeName, hash) {
  await page.goto(pageUrl(hash, `${viewportName}-${routeName}`), { waitUntil: 'domcontentloaded' });
  await page.locator('.page-title, .login-card').first().waitFor({ state: 'visible', timeout: 10000 });
  const metrics = await page.evaluate(() => ({
    title: document.querySelector('.page-title')?.textContent?.trim() || document.title,
    bodyText: document.body.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    hasBottomNav: !!document.querySelector('.bottom-nav'),
    hasSidebar: !!document.querySelector('.sidebar'),
    mobileNavActive: [...document.querySelectorAll('.bottom-item.active')].map(el => el.textContent.trim()),
    mobileNavTop: Math.round(document.querySelector('.bottom-nav')?.getBoundingClientRect().top || 0),
    contentBottom: Math.round(document.querySelector('.content')?.getBoundingClientRect().bottom || 0)
  }));
  if (!metrics.title) fail(`${viewportName}/${routeName}: missing title`);
  if (/\bundefined\b|\bnull\b/.test(metrics.bodyText)) fail(`${viewportName}/${routeName}: leaked undefined/null text`);
  if (viewportName === 'desktop' && !metrics.hasSidebar) fail(`${viewportName}/${routeName}: missing desktop sidebar`);
  if (viewportName === 'mobile' && metrics.scrollWidth > metrics.innerWidth + 4) {
    fail(`${viewportName}/${routeName}: horizontal overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`);
  }
  if (viewportName === 'mobile' && !metrics.hasBottomNav) fail(`${viewportName}/${routeName}: missing bottom nav`);
  if (viewportName === 'mobile' && metrics.mobileNavActive.length !== 1) {
    fail(`${viewportName}/${routeName}: expected one active bottom nav item, got ${metrics.mobileNavActive.join(', ') || 'none'}`);
  }
  if (viewportName === 'mobile' && metrics.contentBottom > metrics.mobileNavTop + 1) {
    fail(`${viewportName}/${routeName}: content overlaps bottom nav (${metrics.contentBottom} > ${metrics.mobileNavTop})`);
  }
  report.routes.push({
    viewport: viewportName,
    route: routeName,
    hash,
    title: metrics.title,
    horizontalOverflow: metrics.scrollWidth > metrics.innerWidth + 4
  });
}

async function screenshot(page, viewportName, routeName) {
  const filename = `${viewportName}-${routeName}.png`;
  const target = path.join(shotDir, filename);
  await page.screenshot({ path: target, fullPage: false });
  report.screenshots.push(target);
}

async function runRouteMatrix(browser) {
  for (const vp of viewportSets) {
    const { context, page, errors } = await makePage(browser, vp, 'student');
    for (const [name, hash] of routes) {
      await basicPageChecks(page, vp.name, name, hash);
      if (['inicio', 'comunicados', 'calendario', 'casos', 'material', 'mallas'].includes(name)) {
        await screenshot(page, vp.name, name);
      }
    }
    if (errors.length) fail(`${vp.name}: console/page errors: ${errors.join(' | ')}`);
    await context.close();
  }
}

async function runStudentFlows(browser) {
  const { context, page, errors } = await makePage(browser, { name: 'desktop', width: 1440, height: 900 }, 'student');

  await page.goto(pageUrl('#/', 'flow-search'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-global-search-form] input[name="q"]').fill('hormigón');
  await page.locator('[data-global-search-form] .search-submit').click();
  await page.waitForURL(/#\/buscar\?q=/, { timeout: 10000 });
  await expectText(page, 'Resultados relacionados');
  report.flows.push('búsqueda global');

  await page.goto(pageUrl('#/comunicados', 'flow-comunicados'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-com-search]').fill('material');
  await expectText(page, 'Nuevo material agregado');
  await page.locator('[data-com-category="Todas"]').click();
  await expectText(page, 'Comunicado destacado');
  report.flows.push('comunicados: búsqueda y categorías');

  await page.goto(pageUrl('#/material', 'flow-material'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-material-search]').fill('estática');
  await expectText(page, 'Guía Ejercicios');
  await page.locator('[data-material-type="Guía"]').click();
  await page.locator('[data-resource-row="mat-001"]').click();
  await page.locator('[data-save-resource="mat-001"]').click();
  await expectText(page, 'guardado');
  await page.locator('[data-demo-action^="Descarga simulada"]').click();
  await expectText(page, 'Descarga simulada');
  report.flows.push('material: filtro, selección, guardar y descarga demo');

  await page.goto(pageUrl('#/ramo/planP/P-0402', 'flow-ramo'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-save-course="planP:P-0402"]').click();
  await expectText(page, 'agregado a seguimiento');
  report.flows.push('ramo: seguimiento');

  await page.goto(pageUrl('#/casos', 'flow-case-filters'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-case-filter="status"]').selectOption('enRevision');
  await expectText(page, 'casos visibles');
  await page.locator('[data-case-tab="resueltos"]').click();
  await expectText(page, 'Resuelto');
  report.flows.push('casos: filtros y tabs');

  await page.goto(pageUrl('#/casos/nuevo', 'flow-new-case'), { waitUntil: 'domcontentloaded' });
  await page.locator('form[data-form="new-case"] input[name="title"]').fill('Consulta de prueba avanzada');
  await page.locator('form[data-form="new-case"] textarea[name="description"]').fill('Descripción suficientemente detallada para verificar el flujo de creación de caso en la demo.');
  await page.locator('form[data-form="new-case"] input[name="privacy"]').check();
  await page.locator('form[data-form="new-case"] button[type="submit"]').click();
  await page.waitForURL(/#\/casos\/case-2026-/, { timeout: 10000 });
  await expectText(page, 'Caso recibido');
  report.flows.push('casos: creación');

  await page.goto(pageUrl('#/material/subir', 'flow-upload'), { waitUntil: 'domcontentloaded' });
  await page.locator('form[data-form="upload-material"] input[name="title"]').fill('Guía de prueba funcional');
  await page.locator('form[data-form="upload-material"] input[name="course"]').fill('Estática');
  await page.locator('form[data-form="upload-material"] textarea[name="description"]').fill('Material de prueba con descripción suficiente para verificar el flujo de subida en demo.');
  await page.locator('form[data-form="upload-material"] input[name="origin"]').fill('Aporte estudiantil demo');
  await page.locator('form[data-form="upload-material"] input[name="permission"]').check();
  await page.locator('form[data-form="upload-material"] button[type="submit"]').click();
  await page.waitForURL(/#\/material\/mat-/, { timeout: 10000 });
  await expectText(page, 'Pendiente de revisión');
  report.flows.push('material: subir recurso');

  await page.goto(pageUrl('#/gestion', 'flow-student-restricted'), { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Acceso restringido');
  report.flows.push('permisos: gestión restringida para estudiante');

  if (errors.length) fail(`student desktop flows console/page errors: ${errors.join(' | ')}`);
  await context.close();
}

async function runMobileFlows(browser) {
  const { context, page, errors } = await makePage(browser, { name: 'mobile', width: 390, height: 844, isMobile: true }, 'student');
  await page.goto(pageUrl('#/mallas', 'flow-mobile-mallas'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-plan="planO"]').click();
  await page.locator('[data-mobile-sem="5"]').click();
  await expectText(page, 'Plan O');
  await expectText(page, '5°');
  report.flows.push('mobile: malla Plan O y semestre');

  await page.locator('.bottom-nav a[href="#/material"]').click();
  await page.waitForURL(/#\/material$/, { timeout: 10000 });
  await expectText(page, 'Biblioteca académica');
  report.flows.push('mobile: navegación inferior');

  if (errors.length) fail(`mobile flows console/page errors: ${errors.join(' | ')}`);
  await context.close();
}

async function runCealFlows(browser) {
  const { context, page, errors } = await makePage(browser, { name: 'desktop', width: 1440, height: 900 }, 'ceal');
  await page.goto(pageUrl('#/gestion', 'flow-ceal-gestion'), { waitUntil: 'domcontentloaded' });
  await expectText(page, 'Gestión CEAL');
  await screenshot(page, 'desktop', 'gestion');

  await page.goto(pageUrl('#/gestion/comunicados/com-001/editar', 'flow-editor'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-publish]').click();
  await expectText(page, 'Contenido publicado');
  await page.locator('[data-demo-action="Comunicado enviado a revisión"]').click();
  await expectText(page, 'enviado a revisión');
  report.flows.push('gestión CEAL: editor y publicación demo');

  await page.goto(pageUrl('#/gestion/material/mat-010/validar', 'flow-validate'), { waitUntil: 'domcontentloaded' });
  await page.locator('[data-approve-material="mat-010"]').click();
  await expectText(page, 'Material validado y publicado');
  await expectText(page, 'Validado CEAL');
  report.flows.push('gestión CEAL: validación de material');

  if (errors.length) fail(`ceal flows console/page errors: ${errors.join(' | ')}`);
  await context.close();

  const mobile = await makePage(browser, { name: 'mobile', width: 390, height: 844, isMobile: true }, 'ceal');
  await mobile.page.goto(pageUrl('#/gestion', 'flow-ceal-mobile-gestion'), { waitUntil: 'domcontentloaded' });
  await expectText(mobile.page, 'Gestión CEAL');
  await screenshot(mobile.page, 'mobile', 'gestion');
  await mobile.page.goto(pageUrl('#/gestion/material/mat-010/validar', 'flow-ceal-mobile-validar'), { waitUntil: 'domcontentloaded' });
  await expectText(mobile.page, 'Validar material');
  report.flows.push('mobile CEAL: gestión y validación accesibles');
  if (mobile.errors.length) fail(`ceal mobile flows console/page errors: ${mobile.errors.join(' | ')}`);
  await mobile.context.close();
}

async function expectText(page, text) {
  await page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 10000 });
}

const browser = await chromium.launch({ headless: true });
try {
  await runRouteMatrix(browser);
  await runStudentFlows(browser);
  await runMobileFlows(browser);
  await runCealFlows(browser);
} finally {
  await browser.close();
}

await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({ ok: true, reportPath, screenshots: report.screenshots.length, routes: report.routes.length, flows: report.flows.length }, null, 2));
