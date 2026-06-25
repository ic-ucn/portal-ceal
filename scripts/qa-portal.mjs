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

function appUrl(route = '/') {
  return `${baseUrl}/?qa=${Date.now()}#${route}`;
}

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
    env: { ...process.env, PORT: String(port), PORTAL_DB_PATH: dbPath, PORTAL_STATE_BACKEND: 'local' },
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
  await page.evaluate(() => {
    localStorage.removeItem('portal.session');
    localStorage.removeItem('portal.malla.embedPlan');
    localStorage.removeItem('portal.malla.embedDark');
    localStorage.removeItem('portal.theme');
    localStorage.setItem('portal.session', JSON.stringify({
      id: 'qa-student',
      name: 'Estudiante CEIC UCN',
      initials: 'EC',
      role: 'student',
      label: 'Estudiante',
      plan: 'planP',
      yearLabel: '4to año',
      email: 'qa.estudiante@alumnos.ucn.cl',
      permissions: []
    }));
  });
  await page.goto(appUrl('/'), { waitUntil: 'networkidle' });
  await page.waitForSelector('.page-title');
}

async function loginCeal(page) {
  await page.goto(`${baseUrl}/?qa=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('portal.session');
    localStorage.removeItem('portal.malla.embedPlan');
    localStorage.removeItem('portal.malla.embedDark');
    localStorage.removeItem('portal.theme');
    localStorage.setItem('portal.session', JSON.stringify({
      id: 'qa-ceal',
      name: 'CEAL UCN',
      initials: 'CU',
      role: 'ceal',
      label: 'CEAL',
      plan: 'planP',
      yearLabel: 'Gestión 2026',
      email: 'qa.ceal@alumnos.ucn.cl',
      permissions: ['approve:content', 'manage:roles', 'publish:comunicados', 'upload:acuerdos', 'validate:material', 'edit:mallas', 'manage:forms']
    }));
  });
  await page.goto(appUrl('/gestion'), { waitUntil: 'networkidle' });
  await page.waitForSelector('.page-title');
}

async function waitForEmbeddedMalla(page, expectedPlan = 'p', expectedTheme = 'light') {
  await page.waitForSelector('.malla-embed-frame-wrap.is-loaded .malla-embed-frame', { timeout: 15000 });
  await page.waitForFunction(
    ({ plan, theme }) => {
      const frame = document.querySelector('.malla-embed-frame');
      return frame?.dataset.plan === plan && frame?.dataset.theme === theme;
    },
    { plan: expectedPlan, theme: expectedTheme },
    { timeout: 8000 }
  );
  const frameHandle = await page.locator('.malla-embed-frame').elementHandle();
  const frame = await frameHandle?.contentFrame();
  if (!frame) fail('malla embedded frame unavailable');
  await frame.waitForSelector('.mc-card', { timeout: 15000 });
  return frame.evaluate(() => ({
    cardCount: document.querySelectorAll('.mc-card').length,
    title: document.querySelector('.mc-header__subtitle')?.textContent?.trim() || document.title,
    lightTheme: document.documentElement.classList.contains('mc-light')
  }));
}

async function auditRoute(page, route, name, viewportName, screenshot = false) {
  await page.goto(appUrl(route), { waitUntil: 'networkidle' });
  await page.waitForSelector(name === 'mallas' ? '.malla-commandbar-title' : '.page-title', { timeout: 8000 });
  if (name === 'mallas') {
    await waitForEmbeddedMalla(page, 'p', 'light');
    await page.waitForTimeout(350);
  }
  const metrics = await page.evaluate(() => ({
    title: document.querySelector('.page-title')?.textContent?.trim() || document.querySelector('.malla-commandbar-title strong')?.textContent?.trim(),
    bodyText: document.body.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    hasBottomNav: Boolean(document.querySelector('.bottom-nav')),
    bottomNavDisplay: document.querySelector('.bottom-nav') ? getComputedStyle(document.querySelector('.bottom-nav')).display : 'none',
    activeBottom: document.querySelectorAll('.bottom-item.active').length
  }));
  const label = `${viewportName}:${name}`;
  if (!metrics.title) pushFailure(`${label}: missing page title`);
  if (/\bundefined\b|\bnull\b/i.test(metrics.bodyText)) pushFailure(`${label}: leaked undefined/null text`);
  if (/Descarga simulada|simulacion|vista demo|demo frontend/i.test(metrics.bodyText)) pushFailure(`${label}: leaked developer/demo wording`);
  if (viewportName === 'mobile' && metrics.scrollWidth > metrics.innerWidth + 4) {
    pushFailure(`${label}: horizontal overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`);
  }
  if (viewportName === 'mobile' && (!metrics.hasBottomNav || metrics.bottomNavDisplay === 'none' || metrics.activeBottom < 1)) {
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

  await page.goto(appUrl('/material'), { waitUntil: 'networkidle' });
  await page.locator('[data-material-search]').fill('estatica');
  await page.waitForTimeout(150);
  if (!(await page.locator('.item-card, .data-table tbody tr').count())) fail('material search returned no results');
  await page.locator('[data-material-type="Guía"]').click();
  await page.waitForTimeout(150);
  report.flows.push('student material search and type filter');

  await page.goto(appUrl('/mallas'), { waitUntil: 'networkidle' });
  const planP = await waitForEmbeddedMalla(page, 'p', 'light');
  if (planP.cardCount < 60 || !planP.lightTheme) fail('embedded Plan P malla did not load in light mode');
  await page.locator('[data-malla-embed-theme]').click();
  const darkPlanP = await waitForEmbeddedMalla(page, 'p', 'dark');
  if (darkPlanP.lightTheme) fail('embedded malla dark mode did not apply');
  await page.locator('[data-malla-embed-plan="o"]').click();
  const planO = await waitForEmbeddedMalla(page, 'o', 'dark');
  if (planO.cardCount < 55 || !/Plan O/.test(planO.title || '')) fail('embedded Plan O malla did not load');
  report.flows.push('embedded malla loads plans and theme');

  mkdirSync(uploadDir, { recursive: true });
  const uploadFile = path.join(uploadDir, 'guia-qa.txt');
  writeFileSync(uploadFile, 'Contenido de prueba para validar subida real de archivo.');
  await page.goto(appUrl('/material/subir'), { waitUntil: 'networkidle' });
  await page.locator('form[data-form="upload-material"] input[name="title"]').fill('Guía QA de materiales');
  await page.locator('form[data-form="upload-material"] input[name="course"]').fill('Estática');
  await page.locator('form[data-form="upload-material"] textarea[name="description"]').fill('Material de prueba para validar una subida real, persistencia y descarga posterior.');
  await page.locator('form[data-form="upload-material"] input[name="origin"]').fill('Aporte estudiantil QA');
  await page.locator('form[data-form="upload-material"] input[name="file"]').setInputFiles(uploadFile);
  await page.locator('form[data-form="upload-material"] input[name="permission"]').check();
  await page.locator('form[data-form="upload-material"] button[type="submit"]').click();
  await page.waitForURL(/#\/material\/mat-/);
  await page.waitForSelector('text=Guía QA de materiales');
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.locator('[data-download-resource]').first().click();
  const download = await downloadPromise;
  if (!download) pushFailure('uploaded material did not trigger browser download event');
  report.flows.push('student uploads material and triggers download');

  await page.goto(appUrl('/ramo/planP/P-0402'), { waitUntil: 'networkidle' });
  await page.locator('a.btn.primary[href*="/material?course="]').click();
  await page.waitForURL(/#\/material\?course=/);
  await page.waitForSelector('.page-title');
  report.flows.push('course detail routes to filtered material');
}

async function runCealFlowTests(page) {
  await loginCeal(page);
  await page.goto(appUrl('/gestion'), { waitUntil: 'networkidle' });
  if (!(await page.locator('text=Gestión de contenido').count())) fail('gestion dashboard missing content management section');

  await page.goto(appUrl('/gestion/acuerdos/nuevo'), { waitUntil: 'networkidle' });
  await page.locator('form[data-form="new-agreement"] input[name="title"]').fill('Acuerdo QA de seguimiento');
  await page.locator('form[data-form="new-agreement"] input[name="origin"]').fill('Pleno CEAL QA');
  await page.locator('form[data-form="new-agreement"] input[name="responsible"]').fill('Secretaría CEAL');
  await page.locator('form[data-form="new-agreement"] textarea[name="summary"]').fill('Se registra un acuerdo de prueba para validar el flujo de seguimiento.');
  await page.locator('form[data-form="new-agreement"] input[name="nextStep"]').fill('Revisar y publicar resumen.');
  await page.locator('form[data-form="new-agreement"] input[name="commitment"]').fill('Publicar seguimiento QA.');
  await page.locator('form[data-form="new-agreement"] button[type="submit"]').click();
  await page.waitForURL(/#\/acuerdos\/agr-/);
  await page.waitForSelector('text=Acuerdo QA de seguimiento');
  report.flows.push('CEAL creates agreement');

  await page.goto(appUrl('/gestion/material/mat-010/validar'), { waitUntil: 'networkidle' });
  await page.locator('[data-approve-material]').click();
  await page.waitForSelector('text=Material validado y publicado');
  report.flows.push('CEAL validates material');

  await page.goto(appUrl('/gestion/comunicados/com-001/editar'), { waitUntil: 'networkidle' });
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
      if (['error', 'warning'].includes(msg.type())) {
        const location = msg.location();
        const source = location?.url ? ` (${location.url})` : '';
        pushFailure(`console ${msg.type()}: ${msg.text()}${source}`);
      }
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
      await auditRoute(page, route, name, 'desktop', ['inicio', 'material', 'mallas'].includes(name));
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await loginStudent(page);
    for (const [route, name] of studentRoutes) {
      await auditRoute(page, route, name, 'mobile', ['inicio', 'material', 'mallas'].includes(name));
    }
    await page.goto(appUrl('/mallas'), { waitUntil: 'networkidle' });
    await page.locator('[data-malla-embed-plan="o"]').click();
    const mobilePlanO = await waitForEmbeddedMalla(page, 'o', 'light');
    if (mobilePlanO.cardCount < 55) pushFailure('mobile embedded malla did not load Plan O');

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginCeal(page);
    const cealRoutes = [
      ['/gestion', 'gestion'],
      ['/gestion/acuerdos/nuevo', 'gestion-acuerdo-nuevo'],
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
