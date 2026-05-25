import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = Number(process.env.QA_PORT || 18080);
const baseUrl = `http://127.0.0.1:${port}`;
const dbPath = path.join(root, '.data', 'qa-portal-db.json');
const screenshotsDir = path.join(root, 'qa-screenshots');
const uploadDir = path.join(root, '.qa-upload');
const report = {
  ok: false,
  routes: [],
  flows: [],
  screenshots: [],
  failures: []
};

function fail(message) {
  report.failures.push(message);
  throw new Error(message);
}

function pushFailure(message) {
  report.failures.push(message);
}

async function waitForHealth() {
  const start = Date.now();
  while (Date.now() - start < 15000) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  fail('local server did not become healthy');
}

function startServer() {
  rmSync(dbPath, { force: true });
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), PORTAL_DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  child.stdout.on('data', chunk => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', chunk => process.stderr.write(`[server] ${chunk}`));
  return child;
}

async function importPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    fail('playwright is not installed; run npm install first');
  }
}

async function loginStudent(page) {
  await page.goto(`${baseUrl}/?qa=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('portal.session'));
  await page.goto(`${baseUrl}/?qa=${Date.now()}#/login`, { waitUntil: 'networkidle' });
  await page.locator('[data-login-role="student"]').click();
  await page.waitForFunction(() => window.location.hash === '#/');
  await page.waitForSelector('.page-title');
}

async function loginCeal(page, memberId = 'ceal-kevin-cortes', password = 'Ceal2026!portal') {
  await page.goto(`${baseUrl}/?qa=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('portal.session'));
  await page.goto(`${baseUrl}/?qa=${Date.now()}#/login`, { waitUntil: 'networkidle' });
  await page.locator('[data-login-member]').selectOption(memberId);
  await page.locator('form[data-form="ceal-login"] input[name="password"]').fill(password);
  const confirm = page.locator('form[data-form="ceal-login"] input[name="confirm"]');
  if (await confirm.count()) await confirm.fill(password);
  await page.locator('form[data-form="ceal-login"] button[type="submit"]').click();
  await page.waitForFunction(() => window.location.hash === '#/gestion');
  await page.waitForSelector('.page-title');
}

async function auditRoute(page, route, name, viewportName, screenshot = false) {
  await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.page-title', { timeout: 8000 });
  const metrics = await page.evaluate(() => ({
    title: document.querySelector('.page-title')?.textContent?.trim(),
    bodyText: document.body.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    hasBottomNav: Boolean(document.querySelector('.bottom-nav')),
    activeBottom: document.querySelectorAll('.bottom-item.active').length
  }));
  const label = `${viewportName}:${name}`;
  if (!metrics.title) pushFailure(`${label}: missing page title`);
  if (/\bundefined\b|\bnull\b/i.test(metrics.bodyText)) pushFailure(`${label}: leaked undefined/null text`);
  if (/Descarga simulada|simulacion|vista demo|demo frontend/i.test(metrics.bodyText)) pushFailure(`${label}: leaked developer/demo wording`);
  if (viewportName === 'mobile' && metrics.scrollWidth > metrics.innerWidth + 4) {
    pushFailure(`${label}: horizontal overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`);
  }
  if (viewportName === 'mobile' && (!metrics.hasBottomNav || metrics.activeBottom < 1)) {
    pushFailure(`${label}: bottom nav missing or inactive`);
  }
  report.routes.push({ viewport: viewportName, route, name, title: metrics.title });
  if (screenshot) {
    mkdirSync(screenshotsDir, { recursive: true });
    const file = path.join(screenshotsDir, `${viewportName}-${name.replace(/[^\w]+/g, '-')}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.screenshots.push(file);
  }
}

async function runPublicFlowTests(page) {
  await loginStudent(page);

  await page.goto(`${baseUrl}/#/material`, { waitUntil: 'networkidle' });
  await page.locator('[data-material-search]').fill('estatica');
  await page.waitForTimeout(150);
  if (!(await page.locator('.item-card, .data-table tbody tr').count())) fail('material search returned no results');
  await page.locator('[data-material-type="Guia"]').click();
  await page.waitForTimeout(150);
  report.flows.push('student material search and type filter');

  await page.goto(`${baseUrl}/#/mallas`, { waitUntil: 'networkidle' });
  await page.locator('.course-card').first().click();
  await page.waitForSelector('.course-detail-panel, .malla-mobile-detail');
  await page.locator('[data-clear-panel]').first().click();
  await page.waitForTimeout(150);
  if (await page.locator('.course-detail-panel:visible, .malla-mobile-detail:visible').count()) {
    fail('malla detail panel did not close');
  }
  report.flows.push('malla course select and close');

  await page.goto(`${baseUrl}/#/casos/nuevo`, { waitUntil: 'networkidle' });
  await page.locator('form[data-form="new-case"] input[name="title"]').fill('Consulta QA sobre pre requisito');
  await page.locator('form[data-form="new-case"] input[name="course"]').fill('Analisis Estructural');
  await page.locator('form[data-form="new-case"] textarea[name="description"]').fill('Necesito revisar un caso academico de prueba funcional para validar el flujo completo del portal.');
  await page.locator('form[data-form="new-case"] input[name="privacy"]').check();
  await page.locator('form[data-form="new-case"] button[type="submit"]').click();
  await page.waitForURL(/#\/casos\/case-/);
  await page.waitForSelector('text=Caso recibido');
  report.flows.push('student creates case and sees detail');

  mkdirSync(uploadDir, { recursive: true });
  const uploadFile = path.join(uploadDir, 'guia-qa.txt');
  writeFileSync(uploadFile, 'Contenido de prueba para validar subida real de archivo.');
  await page.goto(`${baseUrl}/#/material/subir`, { waitUntil: 'networkidle' });
  await page.locator('form[data-form="upload-material"] input[name="title"]').fill('Guia QA de materiales');
  await page.locator('form[data-form="upload-material"] input[name="course"]').fill('Estatica');
  await page.locator('form[data-form="upload-material"] textarea[name="description"]').fill('Material de prueba para validar una subida real, persistencia y descarga posterior.');
  await page.locator('form[data-form="upload-material"] input[name="origin"]').fill('Aporte estudiantil QA');
  await page.locator('form[data-form="upload-material"] input[name="file"]').setInputFiles(uploadFile);
  await page.locator('form[data-form="upload-material"] input[name="permission"]').check();
  await page.locator('form[data-form="upload-material"] button[type="submit"]').click();
  await page.waitForURL(/#\/material\/mat-/);
  await page.waitForSelector('text=Guia QA de materiales');
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.locator('[data-download-resource]').first().click();
  const download = await downloadPromise;
  if (!download) pushFailure('uploaded material did not trigger browser download event');
  report.flows.push('student uploads material and triggers download');

  await page.goto(`${baseUrl}/#/ramo/planP/P-0402`, { waitUntil: 'networkidle' });
  await page.locator('a.btn.primary[href*="/material?course="]').click();
  await page.waitForURL(/#\/material\?course=/);
  await page.waitForSelector('.page-title');
  report.flows.push('course detail routes to filtered material');
}

async function runCealFlowTests(page) {
  await loginCeal(page);
  await page.goto(`${baseUrl}/#/gestion`, { waitUntil: 'networkidle' });
  if (!(await page.locator('text=Equipo CEAL 2026').count())) fail('gestion dashboard missing CEAL team section');

  await page.goto(`${baseUrl}/#/gestion/casos/case-2026-0052`, { waitUntil: 'networkidle' });
  await page.locator('form[data-form="manage-case"] select[name="status"]').selectOption('enSeguimiento');
  await page.locator('form[data-form="manage-case"] textarea[name="note"]').fill('Nota QA interna.');
  await page.locator('form[data-form="manage-case"] textarea[name="response"]').fill('Respuesta QA para el estudiante.');
  await page.locator('form[data-form="manage-case"] button[type="submit"]').click();
  await page.waitForURL('**/#/casos/case-2026-0052');
  await page.waitForSelector('text=Respuesta QA para el estudiante');
  report.flows.push('CEAL updates a case with note and response');

  await page.goto(`${baseUrl}/#/gestion/acuerdos/nuevo`, { waitUntil: 'networkidle' });
  await page.locator('form[data-form="new-agreement"] input[name="title"]').fill('Acuerdo QA de seguimiento');
  await page.locator('form[data-form="new-agreement"] input[name="origin"]').fill('Pleno CEAL QA');
  await page.locator('form[data-form="new-agreement"] input[name="responsible"]').fill('Secretaria CEAL');
  await page.locator('form[data-form="new-agreement"] textarea[name="summary"]').fill('Se registra un acuerdo de prueba para validar el flujo de seguimiento.');
  await page.locator('form[data-form="new-agreement"] input[name="nextStep"]').fill('Revisar y publicar resumen.');
  await page.locator('form[data-form="new-agreement"] input[name="commitment"]').fill('Publicar seguimiento QA.');
  await page.locator('form[data-form="new-agreement"] button[type="submit"]').click();
  await page.waitForURL(/#\/acuerdos\/agr-/);
  await page.waitForSelector('text=Acuerdo QA de seguimiento');
  report.flows.push('CEAL creates agreement');

  await page.goto(`${baseUrl}/#/gestion/material/mat-010/validar`, { waitUntil: 'networkidle' });
  await page.locator('[data-approve-material]').click();
  await page.waitForSelector('text=Material validado y publicado');
  report.flows.push('CEAL validates material');

  await page.goto(`${baseUrl}/#/gestion/comunicados/com-001/editar`, { waitUntil: 'networkidle' });
  await page.locator('form[data-form="edit-content"] input[name="title"]').fill('Comunicado QA publicado');
  await page.locator('[data-publish]').click();
  await page.waitForURL(/#\/comunicados\/com-001/);
  await page.waitForSelector('text=Comunicado QA publicado');
  report.flows.push('CEAL edits and publishes communication');
}

async function main() {
  const server = startServer();
  try {
    await waitForHealth();
    const { chromium } = await importPlaywright();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) pushFailure(`console ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', error => pushFailure(`page error: ${error.message}`));

    await runPublicFlowTests(page);
    await runCealFlowTests(page);

    const studentRoutes = [
      ['/', 'inicio'],
      ['/comunicados', 'comunicados'],
      ['/comunicados/com-001', 'comunicado-detalle'],
      ['/calendario', 'calendario'],
      ['/acuerdos/agr-003', 'acuerdo-detalle'],
      ['/casos', 'casos'],
      ['/casos/nuevo', 'caso-nuevo'],
      ['/casos/case-2026-0052', 'caso-detalle'],
      ['/material', 'material'],
      ['/material/subir', 'material-subir'],
      ['/material/mat-001', 'material-detalle'],
      ['/mallas', 'mallas'],
      ['/ramo/planP/P-0402', 'ramo-detalle'],
      ['/apoyo', 'apoyo'],
      ['/ayudantias/ay-001', 'ayudantia-detalle'],
      ['/tramites/proc-001', 'tramite-detalle'],
      ['/perfil', 'perfil'],
      ['/mas', 'mas']
    ];
    await loginStudent(page);
    for (const [route, name] of studentRoutes) {
      await auditRoute(page, route, name, 'desktop', ['inicio', 'material', 'mallas', 'casos'].includes(name));
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await loginStudent(page);
    for (const [route, name] of studentRoutes) {
      await auditRoute(page, route, name, 'mobile', ['inicio', 'material', 'mallas', 'casos'].includes(name));
    }
    await page.goto(`${baseUrl}/#/mallas`, { waitUntil: 'networkidle' });
    await page.locator('[data-mobile-sem="5"]').click();
    await page.waitForTimeout(150);
    if (!(await page.locator('.semester-col.mobile-active').count())) pushFailure('mobile mallas semester did not activate');

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginCeal(page, 'ceal-bruno-castillo', 'Ceal2026!portal2');
    const cealRoutes = [
      ['/gestion', 'gestion'],
      ['/gestion/acuerdos/nuevo', 'gestion-acuerdo-nuevo'],
      ['/gestion/casos/case-2026-0052', 'gestion-caso'],
      ['/gestion/material/mat-010/validar', 'gestion-material-validar'],
      ['/gestion/comunicados/com-001/editar', 'gestion-comunicado-editar']
    ];
    for (const [route, name] of cealRoutes) {
      await auditRoute(page, route, name, 'desktop-ceal', name === 'gestion');
    }

    await browser.close();
    report.ok = report.failures.length === 0;
    writeFileSync(path.join(root, 'qa-report.json'), JSON.stringify(report, null, 2));
    if (!report.ok) {
      console.error(JSON.stringify(report, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    server.kill();
    if (existsSync(uploadDir)) rmSync(uploadDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  pushFailure(error.message || String(error));
  writeFileSync(path.join(root, 'qa-report.json'), JSON.stringify(report, null, 2));
  console.error(error);
  process.exit(1);
});
