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
    env: { ...process.env, PORT: String(port), PORTAL_DB_PATH: dbPath, PORTAL_STATE_BACKEND: 'local', CALENDAR_WATCHER_TOKEN: 'qa-calendar-watcher-token', QA_TEST_MODE: '1' },
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

async function setupStudentSession() {
  const res = await fetch(`${baseUrl}/api/auth/qa-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'student',
      name: 'Estudiante CEIC UCN',
      label: 'Estudiante',
      plan: 'planP',
      yearLabel: '4to año',
      email: 'qa.estudiante@alumnos.ucn.cl'
    })
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {}
  if (!res.ok || !payload?.user?.sessionToken) {
    fail(`could not create a real student session for QA (status ${res.status})`);
  }
  return payload.user;
}

async function setupJefaturaSession() {
  const res = await fetch(`${baseUrl}/api/auth/qa-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'jefatura',
      name: 'Jefatura de carrera',
      label: 'Jefatura',
      email: 'jc.icivil.afta@ucn.cl',
      permissions: ['manage:office-hours', 'edit:calendario']
    })
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.user?.sessionToken) fail(`could not create a Jefatura session for QA (status ${res.status})`);
  return payload.user;
}

async function loginStudent(page, studentUser) {
  await page.goto(`${baseUrl}/?qa=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(user => {
    localStorage.removeItem('portal.session');
    localStorage.removeItem('portal.malla.embedPlan');
    localStorage.removeItem('portal.malla.embedDark');
    localStorage.removeItem('portal.theme');
    localStorage.setItem('portal.session', JSON.stringify(user));
  }, studentUser);
  await page.goto(appUrl('/'), { waitUntil: 'networkidle' });
  await page.waitForSelector('.page-title');
}

const QA_CEAL_MEMBER_ID = 'ceal-martina-briceno';
const QA_CEAL_PASSWORD = 'QaPortal#2026';

async function setupCealSession() {
  const res = await fetch(`${baseUrl}/api/auth/setup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: QA_CEAL_MEMBER_ID, password: QA_CEAL_PASSWORD })
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {}
  if (!res.ok || !payload?.user?.sessionToken) {
    fail(`could not create a real CEAL session for QA (status ${res.status})`);
  }
  return payload.user;
}

async function loginCeal(page, cealUser) {
  await page.goto(`${baseUrl}/?qa=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(user => {
    localStorage.removeItem('portal.session');
    localStorage.removeItem('portal.malla.embedPlan');
    localStorage.removeItem('portal.malla.embedDark');
    localStorage.removeItem('portal.theme');
    localStorage.setItem('portal.session', JSON.stringify(user));
  }, cealUser);
  await page.goto(appUrl('/gestion'), { waitUntil: 'networkidle' });
  await page.waitForSelector('.page-title');
}

async function loginJefatura(page, jefaturaUser) {
  await page.goto(`${baseUrl}/?qa=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(user => {
    localStorage.removeItem('portal.session');
    localStorage.removeItem('portal.theme');
    localStorage.setItem('portal.session', JSON.stringify(user));
  }, jefaturaUser);
  await page.goto(appUrl('/'), { waitUntil: 'networkidle' });
  await page.waitForSelector('.page-title');
}

async function runSessionEdgeTests(browser, studentUser) {
  const staleContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const stalePage = await staleContext.newPage();
  await stalePage.addInitScript(() => {
    try {
      localStorage.setItem('portal.session', JSON.stringify({
        id: 'stale-user',
        role: 'ceal',
        accessMode: 'ceal',
        name: 'Sesión vencida',
        email: 'stale@alumnos.ucn.cl',
        sessionToken: 'expired-token'
      }));
    } catch {}
    window.__qaProtectedPainted = false;
    document.addEventListener('DOMContentLoaded', () => {
      const inspect = () => {
        if (document.querySelector('.app-shell, [data-form="booking-config"]')) window.__qaProtectedPainted = true;
      };
      new MutationObserver(inspect).observe(document.documentElement, { childList: true, subtree: true });
      inspect();
    }, { once: true });
  });
  // La telemetría agregada se envía en segundo plano; este caso valida el primer
  // render y no debe depender de que no exista ninguna solicitud en vuelo.
  await stalePage.goto(appUrl('/gestion'), { waitUntil: 'domcontentloaded' });
  await stalePage.waitForSelector('.login-shell');
  if (await stalePage.evaluate(() => window.__qaProtectedPainted)) fail('expired local session painted protected content before validation');
  await staleContext.close();
  report.flows.push('expired saved session is rejected before protected UI paints');

  const sharedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const firstTab = await sharedContext.newPage();
  const secondTab = await sharedContext.newPage();
  await firstTab.goto(baseUrl, { waitUntil: 'networkidle' });
  await firstTab.evaluate(user => localStorage.setItem('portal.session', JSON.stringify(user)), studentUser);
  await firstTab.goto(appUrl('/'), { waitUntil: 'networkidle' });
  await firstTab.waitForSelector('h1.page-title');
  if ((await firstTab.locator('h1.page-title').innerText()) !== 'Inicio') fail('valid saved session was not restored');
  await secondTab.goto(baseUrl, { waitUntil: 'networkidle' });
  await secondTab.evaluate(() => localStorage.removeItem('portal.session'));
  await firstTab.waitForURL(/#\/login/, { timeout: 5000 });
  await firstTab.waitForSelector('.login-shell');
  await sharedContext.close();
  report.flows.push('valid session restores and cross-tab logout is immediate');
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
  // Rutas que pertenecen a una pestaña del dock: deben marcarla activa.
  // Las rutas secundarias (calendario, perfil, atención…) viven en el menú
  // lateral y no marcan pestaña, pero el dock siempre debe estar visible.
  const tabbedRoutes = new Set(['inicio', 'mallas', 'ramo-detalle', 'material', 'material-subir', 'material-detalle', 'apoyo', 'ayudantia-detalle', 'tramite-detalle']);
  if (viewportName === 'mobile' && (!metrics.hasBottomNav || metrics.bottomNavDisplay === 'none')) {
    pushFailure(`${label}: bottom nav missing`);
  }
  if (viewportName === 'mobile' && tabbedRoutes.has(name) && metrics.activeBottom < 1) {
    pushFailure(`${label}: bottom nav tab inactive`);
  }
  report.routes.push({ viewport: viewportName, route, name, title: metrics.title });
  if (screenshot) {
    mkdirSync(screenshotsDir, { recursive: true });
    const file = path.join(screenshotsDir, `${viewportName}-${name.replace(/[^\w]+/g, '-')}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.screenshots.push(file);
  }
}

async function runPublicFlowTests(page, studentUser) {
  await loginStudent(page, studentUser);

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
  const uploadedMaterialId = decodeURIComponent(new URL(page.url()).hash.split('/').filter(Boolean).at(-1) || '');
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.locator('[data-download-resource]').first().click();
  const download = await downloadPromise;
  if (!download) pushFailure('uploaded material did not trigger browser download event');
  await page.goto(appUrl(`/material/${uploadedMaterialId}`), { waitUntil: 'networkidle' });
  await page.getByText('Guía QA de materiales', { exact: true }).waitFor();
  report.flows.push('student uploads material and triggers download');

  await page.goto(appUrl('/ramo/planP/P-0402'), { waitUntil: 'networkidle' });
  await page.locator('a.btn.primary[href*="/material?course="]').click();
  await page.waitForURL(/#\/material\?course=/);
  await page.waitForSelector('.page-title');
  report.flows.push('course detail routes to filtered material');

  await page.goto(appUrl('/calendario'), { waitUntil: 'networkidle' });
  const selectedToday = page.locator('.academic-calendar-card .day-cell.today[aria-pressed="true"]');
  if (!(await selectedToday.count())) fail('calendar should select the current day automatically');
  const initialMonth = await page.locator('.academic-calendar-card .card-title').first().textContent();
  await page.locator('[data-calendar-month="1"]').click();
  await page.waitForTimeout(120);
  const nextMonth = await page.locator('.academic-calendar-card .card-title').first().textContent();
  if (nextMonth === initialMonth) fail('calendar month navigation did not update the visible month');
  await page.locator('[data-calendar-today]').click();
  report.flows.push('calendar selects today and navigates between months');

  await page.goto(appUrl('/horarios'), { waitUntil: 'networkidle' });
  await page.waitForURL(/#\/calendario$/);
  if ((await page.locator('.sidebar .nav-item').allTextContents()).some(item => item.trim() === 'Horario académico')) fail('academic schedule should not appear in navigation');
  if ((await page.locator('main').innerText()).includes('Horario académico')) fail('retired academic schedule should not remain visible');
  report.flows.push('retired academic schedule redirects to the calendar and stays out of navigation');

  for (const route of ['/encuestas', '/reservas']) {
    await page.goto(appUrl(route), { waitUntil: 'networkidle' });
    if (!/^No encontrado$/i.test((await page.locator('.page-title').textContent()) || '')) fail(`${route} should be disabled`);
  }
  report.flows.push('surveys and table reservations stay disabled');
}

async function runBookingFlowTests(page, studentUser, jefaturaUser) {
  const disabledList = await fetch(`${baseUrl}/api/calendar/appointments`, { headers: { authorization: `Bearer ${studentUser.sessionToken}` } });
  const disabledCreate = await fetch(`${baseUrl}/api/calendar/appointments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${studentUser.sessionToken}` },
    body: JSON.stringify({ start: new Date(Date.now() + 86400000).toISOString(), end: new Date(Date.now() + 88200000).toISOString(), reason: 'No debe reservar.' })
  });
  const disabledConfig = await fetch(`${baseUrl}/api/calendar/config`, { headers: { authorization: `Bearer ${jefaturaUser.sessionToken}` } });
  if (disabledList.status !== 410 || disabledCreate.status !== 410 || disabledConfig.status !== 410) fail('disabled appointment backend should reject reads, bookings and configuration changes');

  await loginStudent(page, studentUser);
  for (const route of ['/tutoriales', '/atencion', '/jefatura', '/comunicados', '/notificaciones']) {
    await page.goto(appUrl(route), { waitUntil: 'networkidle' });
    await page.waitForURL(/#\/$/);
    if ((await page.locator('h1.page-title').innerText()) !== 'Inicio') fail(`${route} should redirect to Inicio`);
  }
  const studentNav = await page.locator('.sidebar .nav-item').allTextContents();
  if (studentNav.some(item => ['Comunicados', 'Tutoriales', 'Atención', 'Jefatura', 'Horario académico'].includes(item.trim()))) fail('student navigation should expose only the current informational portal');

  await loginJefatura(page, jefaturaUser);
  const jefaturaNav = await page.locator('.sidebar .nav-item').allTextContents();
  if (jefaturaNav.some(item => ['Comunicados', 'Tutoriales', 'Atención', 'Jefatura', 'Horario académico'].includes(item.trim()))) fail('Jefatura navigation should expose only the current informational portal');

  await page.goto(appUrl('/login'), { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('portal.session'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-guest-login]').click();
  await page.waitForURL(/#\/$/);
  await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
  const guestNav = await page.locator('.sidebar .nav-item').allTextContents();
  if (guestNav.some(item => ['Comunicados', 'Tutoriales', 'Atención', 'Jefatura', 'Horario académico', 'Gestión'].includes(item.trim()))) fail('guest navigation should expose only current public informational sections');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Inicio', exact: true }).waitFor();
  await page.goto(appUrl('/perfil'), { waitUntil: 'networkidle' });
  await page.getByText('Puedes recorrer el contenido publicado sin realizar cambios.', { exact: true }).waitFor();
  await page.locator('[data-logout]').first().click();
  await page.waitForURL(/#\/login$/);
  for (const pathName of ['/tutoriales/', '/tutorial-jc/', '/tutorial-ceal/', '/tutorial-portal/', '/tutorial-estudiantes/', '/tutorial-jefatura/']) {
    const response = await fetch(`${baseUrl}${pathName}`);
    const body = await response.text();
    if (response.ok && /data-tutorial-video|video tutorial|narración femenina|narración masculina/i.test(body)) fail(`${pathName} should not remain published`);
  }
  report.flows.push('retired tutorials and attention routes stay unavailable for students, Jefatura and guests');
}

async function runCealFlowTests(page, cealUser) {
  await loginCeal(page, cealUser);
  await page.goto(appUrl('/gestion'), { waitUntil: 'networkidle' });
  if (!(await page.locator('text=Contenido y fuentes').count())) fail('gestion dashboard missing consolidated console');
  await page.locator('.analytics-dashboard').waitFor();
  await page.locator('.analytics-kpis').waitFor();
  if (!(await page.getByRole('heading', { name: 'Tráfico', exact: true }).count())) fail('gestion dashboard missing protected traffic summary');
  if ((await page.locator('.analytics-kpis').innerText()).includes('undefined')) fail('traffic metrics should always render numeric values');
  const managementText = await page.locator('main').innerText();
  if (/Encuestas|Reservas de taca-taca|ping-pong/i.test(managementText)) fail('gestion dashboard should not expose disabled surveys or reservations');
  if (/Comunicados|Bienvenida al Portal CEIC UCN/i.test(managementText)) fail('gestion dashboard should not expose retired communications');
  const cealNav = await page.locator('.sidebar .nav-item').allTextContents();
  if (cealNav.at(-1)?.trim() !== 'Gestión' || cealNav.some(item => ['Comunicados', 'Tutoriales', 'Atención', 'Jefatura', 'Horario académico'].includes(item.trim()))) fail('CEAL management should be the final navigation item without retired sections');

  await page.goto(appUrl('/gestion/calendario'), { waitUntil: 'networkidle' });
  const calendarUpdateForm = page.locator('form[data-form="calendar-update"]');
  await calendarUpdateForm.locator('input[type="file"]').setInputFiles({ name: 'calendario-qa.txt', mimeType: 'text/plain', buffer: Buffer.from('Calendario docente QA') });
  await calendarUpdateForm.locator('textarea[name="note"]').fill('Prueba de actualización académica.');
  await calendarUpdateForm.locator('button[type="submit"]').click();
  await page.getByText('Pendiente de revisión', { exact: true }).waitFor();
  if ((await page.locator('main').innerText()).includes('Calendario docente QA')) fail('calendar upload UI should display metadata, not private file content');
  report.flows.push('CEAL sends a private calendar source for review');

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

  await page.goto(appUrl('/gestion/comunicados/nuevo'), { waitUntil: 'networkidle' });
  await page.waitForURL(/#\/gestion$/);
  if ((await page.locator('main').innerText()).includes('Nuevo comunicado')) fail('retired communication editor should not remain reachable');
  report.flows.push('CEAL management excludes retired communications');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl('/gestion'), { waitUntil: 'networkidle' });
  await page.locator('.analytics-dashboard').waitFor();
  const analyticsBounds = await page.locator('.analytics-dashboard').boundingBox();
  const analyticsOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (!analyticsBounds || analyticsBounds.x < 0 || analyticsBounds.x + analyticsBounds.width > 390 || analyticsOverflow) fail('traffic dashboard should fit the mobile viewport');
  await page.setViewportSize({ width: 1440, height: 1000 });
  report.flows.push('CEAL traffic dashboard works on desktop and mobile');
}

async function runCrossBrowserMobileTests(playwright, studentUser) {
  const cases = [
    {
      label: 'Samsung Internet',
      engine: playwright.chromium,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36'
    },
    {
      label: 'Safari',
      engine: playwright.webkit,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1'
    },
    {
      label: 'Firefox',
      engine: playwright.firefox,
      userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0'
    }
  ];

  for (const testCase of cases) {
    const browser = await testCase.engine.launch();
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
      userAgent: testCase.userAgent
    });
    const page = await context.newPage();
    page.on('pageerror', error => pushFailure(`${testCase.label} page error: ${error.message}`));

    await page.goto(`${baseUrl}/?qa=${Date.now()}#/login`, { waitUntil: 'networkidle' });
    const loginMetrics = await page.evaluate(() => {
      const card = document.querySelector('.login-card')?.getBoundingClientRect();
      const themeButton = document.querySelector('.login-theme-toggle');
      const themeStyle = getComputedStyle(themeButton);
      const parse = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const luminance = rgb => {
        const values = rgb.map(channel => {
          const normalized = channel / 255;
          return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
        });
        return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
      };
      const foreground = luminance(parse(themeStyle.color));
      const background = luminance(parse(themeStyle.backgroundColor));
      return {
        dark: document.documentElement.classList.contains('theme-dark'),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        cardLeft: card?.left,
        cardRight: card?.right,
        themeButtonVisible: Boolean(themeButton?.getClientRects().length),
        themeButtonContrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)
      };
    });
    if (loginMetrics.dark) fail(`${testCase.label} should open the login in light mode by default`);
    if (loginMetrics.documentWidth > loginMetrics.viewportWidth || loginMetrics.cardLeft < 0 || loginMetrics.cardRight > loginMetrics.viewportWidth) fail(`${testCase.label} login should fit a 390px viewport`);
    if (!loginMetrics.themeButtonVisible) fail(`${testCase.label} login should expose the theme control`);
    if (loginMetrics.themeButtonContrast < 4.5) fail(`${testCase.label} login theme control should meet text contrast`);

    await page.evaluate(user => {
      localStorage.removeItem('portal.theme');
      localStorage.setItem('portal.session', JSON.stringify(user));
    }, studentUser);
    await page.goto(appUrl('/'), { waitUntil: 'networkidle' });
    await page.locator('.mobile-theme-toggle').waitFor();
    const shellMetrics = await page.evaluate(() => {
      const button = document.querySelector('.mobile-theme-toggle');
      const style = getComputedStyle(button);
      const parse = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const luminance = rgb => {
        const values = rgb.map(channel => {
          const normalized = channel / 255;
          return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
        });
        return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
      };
      const foreground = luminance(parse(style.color));
      const background = luminance(parse(style.backgroundColor));
      const contrast = (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
      const rect = button?.getBoundingClientRect();
      return {
        dark: document.documentElement.classList.contains('theme-dark'),
        colorScheme: getComputedStyle(document.documentElement).colorScheme,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        contrast,
        toggleColor: style.color,
        buttonWidth: rect?.width,
        buttonHeight: rect?.height
      };
    });
    if (shellMetrics.dark || !shellMetrics.colorScheme.includes('light')) fail(`${testCase.label} should keep a new session in light mode even when the device prefers dark`);
    if (shellMetrics.documentWidth > shellMetrics.viewportWidth) fail(`${testCase.label} portal should not overflow horizontally`);
    if (shellMetrics.contrast < 4.5 || shellMetrics.buttonWidth < 40 || shellMetrics.buttonHeight < 40) fail(`${testCase.label} mobile theme control should remain visible and touchable`);

    mkdirSync(screenshotsDir, { recursive: true });
    const file = path.join(screenshotsDir, `mobile-${testCase.label.toLowerCase().replace(/[^a-z]+/g, '-')}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.screenshots.push(file);

    await page.locator('.mobile-theme-toggle').click();
    await page.waitForFunction(initial => document.body.classList.contains('theme-dark') && getComputedStyle(document.querySelector('.mobile-theme-toggle')).color !== initial, shellMetrics.toggleColor);
    await context.close();
    await browser.close();
  }
  report.flows.push('login and default light theme pass on Samsung Internet, Safari and Firefox mobile engines');
}

async function main() {
  const server = startServer();
  try {
    await waitForHealth();
    const cealUser = await setupCealSession();
    const studentUser = await setupStudentSession();
    const jefaturaUser = await setupJefaturaSession();
    const playwright = await importPlaywright();
    const { chromium } = playwright;
    const browser = await chromium.launch();
    await runSessionEdgeTests(browser, studentUser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) {
        const location = msg.location();
        const source = location?.url ? ` (${location.url})` : '';
        pushFailure(`console ${msg.type()}: ${msg.text()}${source}`);
      }
    });
    page.on('pageerror', error => pushFailure(`page error: ${error.message}`));

    await runPublicFlowTests(page, studentUser);
    await runBookingFlowTests(page, studentUser, jefaturaUser);
    await runCealFlowTests(page, cealUser);

    const studentRoutes = [
      ['/', 'inicio'],
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
      ['/perfil', 'perfil']
    ];
    await loginStudent(page, studentUser);
    for (const [route, name] of studentRoutes) {
      await auditRoute(page, route, name, 'desktop', ['inicio', 'material', 'mallas'].includes(name));
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await loginStudent(page, studentUser);
    for (const [route, name] of studentRoutes) {
      await auditRoute(page, route, name, 'mobile', ['inicio', 'material', 'mallas'].includes(name));
    }
    await page.goto(appUrl('/mallas'), { waitUntil: 'networkidle' });
    await page.locator('[data-malla-embed-plan="o"]').click();
    const mobilePlanO = await waitForEmbeddedMalla(page, 'o', 'light');
    if (mobilePlanO.cardCount < 55) pushFailure('mobile embedded malla did not load Plan O');

    await page.setViewportSize({ width: 360, height: 800 });
    await loginStudent(page, studentUser);
    const bottomItems = await page.locator('.bottom-nav .bottom-item').allTextContents();
    if (bottomItems.length !== 4 || bottomItems.at(-1)?.trim() !== 'Material' || bottomItems[1]?.trim() !== 'Calendario') fail('student mobile navigation should expose the four current informational sections');
    const bottomBounds = await page.locator('.bottom-nav').boundingBox();
    if (!bottomBounds || bottomBounds.x < 0 || bottomBounds.x + bottomBounds.width > 360) fail('mobile bottom navigation should fit a 360px viewport');
    await page.goto(appUrl('/calendario'), { waitUntil: 'networkidle' });
    const calendarScrollBefore = await page.evaluate(() => window.scrollY);
    await page.locator('button.day-cell.has-event').first().click();
    await page.locator('.calendar-detail-modal').waitFor();
    const calendarModalMetrics = await page.evaluate(() => {
      const modal = document.querySelector('.calendar-detail-modal');
      const rect = modal?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        modalLeft: rect?.left,
        modalRight: rect?.right,
        closeVisible: Boolean(document.querySelector('.calendar-detail-modal [data-calendar-modal-close]'))
      };
    });
    if (calendarModalMetrics.scrollY !== calendarScrollBefore) fail('opening a calendar date should not move the page');
    if (calendarModalMetrics.documentWidth > calendarModalMetrics.viewportWidth || calendarModalMetrics.modalLeft < 0 || calendarModalMetrics.modalRight > calendarModalMetrics.viewportWidth) fail('calendar modal should fit a 360px viewport without horizontal overflow');
    if (!calendarModalMetrics.closeVisible) fail('calendar modal should expose an explicit close control');
    await page.locator('.calendar-detail-modal [data-calendar-modal-close]').first().click();
    await page.locator('.calendar-detail-modal').waitFor({ state: 'detached' });
    report.flows.push('mobile bottom navigation and calendar modal fit at 360px');

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginCeal(page, cealUser);
    const cealRoutes = [
      ['/gestion', 'gestion'],
      ['/gestion/calendario', 'gestion-calendario'],
      ['/gestion/acuerdos/nuevo', 'gestion-acuerdo-nuevo'],
      ['/gestion/material/mat-010/validar', 'gestion-material-validar']
    ];
    for (const [route, name] of cealRoutes) {
      await auditRoute(page, route, name, 'desktop-ceal', name === 'gestion');
    }

    await loginJefatura(page, jefaturaUser);
    await auditRoute(page, '/', 'inicio-jefatura', 'desktop-jefatura', true);

    await page.setViewportSize({ width: 390, height: 844 });
    await loginJefatura(page, jefaturaUser);
    await auditRoute(page, '/', 'inicio-jefatura', 'mobile-jefatura', true);
    await loginCeal(page, cealUser);
    await auditRoute(page, '/gestion/calendario', 'gestion-calendario', 'mobile-ceal', true);

    await browser.close();
    await runCrossBrowserMobileTests(playwright, studentUser);
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
