import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const port = 18110;
const baseUrl = `http://127.0.0.1:${port}`;
const workDir = path.join(root, '.data', 'tutorial-production');
const rawDir = path.join(workDir, 'raw');
const dbPath = path.join(workDir, `portal-tutorial-${Date.now()}.json`);
const publicMediaDir = path.join(root, 'tutoriales', 'media');
const privateDir = path.join(root, 'output', 'tutoriales-privados');
const jefaturaWebMediaDir = path.join(root, 'tutorial-jc', 'media');
const tutorialTarget = String(process.env.TUTORIAL_TARGET || 'all').toLowerCase();
const captureStudent = tutorialTarget === 'all' || tutorialTarget === 'student';
const captureJefatura = tutorialTarget === 'all' || tutorialTarget === 'jefatura';

await Promise.all([
  fs.mkdir(rawDir, { recursive: true }),
  fs.mkdir(publicMediaDir, { recursive: true }),
  fs.mkdir(privateDir, { recursive: true }),
  fs.mkdir(jefaturaWebMediaDir, { recursive: true })
]);

const server = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    QA_TEST_MODE: '1',
    PORTAL_STATE_BACKEND: 'local',
    PORTAL_DB_PATH: dbPath,
    PORTAL_ALLOWED_ORIGINS: baseUrl
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stdout.on('data', chunk => process.stdout.write(`[tutorial-server] ${chunk}`));
server.stderr.on('data', chunk => process.stderr.write(`[tutorial-server] ${chunk}`));

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('tutorial server did not start');
}

async function api(route, options = {}) {
  const response = await fetch(`${baseUrl}/api${route}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `API ${response.status}`);
  return payload;
}

async function qaSession(role) {
  const profiles = {
    student: { role: 'student', name: 'Estudiante UCN', email: 'estudiante.tutorial@alumnos.ucn.cl' },
    jefatura: { role: 'jefatura', name: 'Jefatura de carrera', email: 'jc.icivil.afta@ucn.cl' }
  };
  return (await api('/auth/qa-session', { method: 'POST', body: JSON.stringify(profiles[role]) })).user;
}

async function seedTutorialAppointment() {
  const student = await qaSession('student');
  const start = new Date();
  start.setHours(11, 30, 0, 0);
  while (start.getDay() !== 2 || start.getTime() < Date.now() + 60 * 60000) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 30 * 60000);
  await api('/calendar/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${student.sessionToken}` },
    body: JSON.stringify({ start: start.toISOString(), end: end.toISOString(), reason: 'Consulta sobre inscripción de asignaturas.' })
  });
}

function vttTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const milli = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${s}.${milli}`;
}

async function writeVtt(filePath, cues) {
  const body = cues.map((cue, index) => `${index + 1}\n${vttTime(cue.start)} --> ${vttTime(cue.end)}\n${cue.text}\n`).join('\n');
  await fs.writeFile(filePath, `WEBVTT\n\n${body}`, 'utf8');
}

async function injectTutorialLayer(page, totalSteps, mobilePreviewDataUrl = '') {
  await page.evaluate(({ total, mobilePreviewDataUrl }) => {
    const style = document.createElement('style');
    style.id = 'tutorial-capture-style';
    style.textContent = `
      #tutorial-guide{position:fixed;right:32px;bottom:28px;z-index:2147483646;width:min(520px,calc(100vw - 64px));display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:rgba(255,255,255,.98);border:1px solid #b9c9dc;border-left:4px solid #f07822;border-radius:6px;color:#10233d;box-shadow:0 14px 38px rgba(12,35,66,.22);font-family:Inter,Arial,sans-serif;opacity:0;transform:translateY(10px);transition:opacity .24s ease,transform .24s ease}
      #tutorial-guide.is-visible{opacity:1;transform:translateY(0)}
      #tutorial-guide .tutorial-count{flex:0 0 54px;color:#155bcc;font-size:13px;font-weight:850;line-height:1.35;padding-top:3px}
      #tutorial-guide .tutorial-copy{display:flex;flex-direction:column;gap:3px}
      #tutorial-guide strong{font-size:20px;line-height:1.2;letter-spacing:0}
      #tutorial-guide span{font-size:15px;line-height:1.38;color:#425875;letter-spacing:0}
      #tutorial-cursor{position:fixed;left:50%;top:50%;z-index:2147483647;width:28px;height:28px;border:3px solid #fff;border-radius:50%;background:rgba(21,91,204,.75);box-shadow:0 0 0 6px rgba(21,91,204,.2),0 4px 15px rgba(0,0,0,.35);pointer-events:none;transform:translate(-50%,-50%);transition:left .72s cubic-bezier(.22,.8,.3,1),top .72s cubic-bezier(.22,.8,.3,1),opacity .2s ease;opacity:0}
      #tutorial-cursor.is-visible{opacity:1}
      .tutorial-focus{position:relative!important;z-index:1000!important;outline:5px solid rgba(240,120,34,.98)!important;outline-offset:6px!important;box-shadow:0 0 0 12px rgba(240,120,34,.2),0 16px 40px rgba(0,0,0,.18)!important;transition:outline-color .25s ease,box-shadow .25s ease!important}
      #tutorial-title-card{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#f2f6fb;color:#10233d;font-family:Inter,Arial,sans-serif;opacity:0;transition:opacity .3s ease}
      #tutorial-title-card.is-visible{opacity:1}
      #tutorial-title-card .tutorial-title-inner{width:min(860px,calc(100vw - 96px));text-align:center}
      #tutorial-title-card img{display:block;width:86px;height:86px;object-fit:contain;margin:0 auto 12px;filter:drop-shadow(0 8px 20px rgba(0,0,0,.2))}
      #tutorial-title-card .title-brand{font-family:Fraunces,Georgia,serif;font-size:18px;font-weight:750;margin-bottom:28px;color:#10233d}
      #tutorial-title-card small{display:block;color:#155bcc;font-size:13px;font-weight:850;text-transform:uppercase;margin-bottom:10px}
      #tutorial-title-card h1{font-family:Fraunces,Georgia,serif;font-size:56px;line-height:1.05;margin:0 0 15px;letter-spacing:0}
      #tutorial-title-card p{margin:0 auto;color:#526883;font-size:20px;max-width:680px;line-height:1.45}
      #tutorial-title-card .title-rule{width:56px;height:4px;background:#f07822;margin:28px auto 0;border-radius:2px}
      #tutorial-mobile-card{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#edf2f8;color:#10233d;font-family:Inter,Arial,sans-serif;opacity:0;transition:opacity .3s ease}
      #tutorial-mobile-card.is-visible{opacity:1}
      #tutorial-mobile-card .mobile-stage{width:min(1050px,calc(100vw - 100px));display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:82px;align-items:center}
      #tutorial-mobile-card .mobile-copy small{display:block;color:#155bcc;font-size:13px;font-weight:850;text-transform:uppercase;margin-bottom:12px}
      #tutorial-mobile-card .mobile-copy h1{font-family:Fraunces,Georgia,serif;font-size:48px;line-height:1.08;margin:0 0 16px;letter-spacing:0}
      #tutorial-mobile-card .mobile-copy p{max-width:540px;margin:0;color:#526883;font-size:20px;line-height:1.5}
      #tutorial-mobile-card .mobile-rule{width:56px;height:4px;background:#f07822;margin-top:28px;border-radius:2px}
      #tutorial-mobile-card .phone-frame{width:350px;aspect-ratio:390/844;padding:9px;background:#12233a;border:1px solid #304968;border-radius:30px;box-shadow:0 24px 60px rgba(12,35,66,.28)}
      #tutorial-mobile-card .phone-frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:22px;background:#fff}
    `;
    document.head.appendChild(style);
    const guide = document.createElement('div');
    guide.id = 'tutorial-guide';
    guide.innerHTML = `<span class="tutorial-count"></span><div class="tutorial-copy"><strong></strong><span></span></div>`;
    document.body.appendChild(guide);
    const cursor = document.createElement('div');
    cursor.id = 'tutorial-cursor';
    document.body.appendChild(cursor);
    window.__tutorialCapture = {
      total,
      clearFocus() { document.querySelectorAll('.tutorial-focus').forEach(node => node.classList.remove('tutorial-focus')); },
      setStep(step, title, detail, selector) {
        this.clearFocus();
        guide.classList.remove('is-visible');
        guide.querySelector('.tutorial-count').textContent = `${String(step).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
        guide.querySelector('strong').textContent = title;
        guide.querySelector('.tutorial-copy span').textContent = detail;
        const target = [...document.querySelectorAll(selector)].find(node => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => {
          target.classList.add('tutorial-focus');
          const rect = target.getBoundingClientRect();
          guide.style.left = rect.left + rect.width / 2 > innerWidth / 2 ? '32px' : 'auto';
          guide.style.right = rect.left + rect.width / 2 > innerWidth / 2 ? 'auto' : '32px';
          guide.style.top = rect.top + rect.height / 2 > innerHeight / 2 ? '88px' : 'auto';
          guide.style.bottom = rect.top + rect.height / 2 > innerHeight / 2 ? 'auto' : '28px';
          cursor.style.left = `${Math.min(innerWidth - 34, Math.max(34, rect.left + rect.width * .72))}px`;
          cursor.style.top = `${Math.min(innerHeight - 34, Math.max(34, rect.top + rect.height * .55))}px`;
          cursor.classList.add('is-visible');
          guide.classList.add('is-visible');
        }, 450);
        return true;
      },
      hideStep() { guide.classList.remove('is-visible'); cursor.classList.remove('is-visible'); this.clearFocus(); },
      showTitle(kicker, title, detail) {
        this.hideStep();
        document.querySelector('#tutorial-title-card')?.remove();
        document.querySelector('#tutorial-mobile-card')?.remove();
        const card = document.createElement('div');
        card.id = 'tutorial-title-card';
        card.innerHTML = `<div class="tutorial-title-inner"><img src="/assets/logo-mark-transparent.png" alt="CEIC UCN"><div class="title-brand">CEIC UCN</div><small></small><h1></h1><p></p><div class="title-rule"></div></div>`;
        card.querySelector('small').textContent = kicker;
        card.querySelector('h1').textContent = title;
        card.querySelector('p').textContent = detail;
        document.body.appendChild(card);
        requestAnimationFrame(() => card.classList.add('is-visible'));
      },
      hideTitle() {
        const card = document.querySelector('#tutorial-title-card');
        if (!card) return;
        card.classList.remove('is-visible');
        setTimeout(() => card.remove(), 420);
      },
      showMobile(kicker, title, detail) {
        this.hideStep();
        document.querySelector('#tutorial-title-card')?.remove();
        document.querySelector('#tutorial-mobile-card')?.remove();
        const card = document.createElement('div');
        card.id = 'tutorial-mobile-card';
        card.innerHTML = `<div class="mobile-stage"><div class="mobile-copy"><small></small><h1></h1><p></p><div class="mobile-rule"></div></div><div class="phone-frame"><img alt="Vista móvil del portal"></div></div>`;
        card.querySelector('small').textContent = kicker;
        card.querySelector('h1').textContent = title;
        card.querySelector('p').textContent = detail;
        card.querySelector('img').src = mobilePreviewDataUrl;
        document.body.appendChild(card);
        requestAnimationFrame(() => card.classList.add('is-visible'));
      },
      hideMobile() {
        const card = document.querySelector('#tutorial-mobile-card');
        if (!card) return;
        card.classList.remove('is-visible');
        setTimeout(() => card.remove(), 420);
      }
    };
  }, { total: totalSteps, mobilePreviewDataUrl });
}

async function addCaptureSession(context, session) {
  await context.addInitScript(user => {
    try {
      if (user) localStorage.setItem('portal.session', JSON.stringify(user));
      localStorage.setItem('portal.theme', 'light');
      localStorage.setItem('portal.prefs', JSON.stringify({ compacto: false }));
    } catch {}
  }, session || null);
}

async function captureMobilePreview(browser, { name, session, route = '/', focusSelector, setupPage }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: 'light' });
  try {
    await addCaptureSession(context, session);
    const page = await context.newPage();
    if (setupPage) await setupPage(page);
    await page.goto(`${baseUrl}/?capture=${encodeURIComponent(`${name}-mobile`)}#${route}`, { waitUntil: 'networkidle' });
    await page.locator('main').waitFor({ state: 'visible' });
    await page.evaluate(selector => {
      const target = [...document.querySelectorAll(selector)].find(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!target) return;
      target.style.outline = '4px solid #f07822';
      target.style.outlineOffset = '-4px';
      target.style.background = '#eaf2ff';
    }, focusSelector);
    await page.waitForTimeout(350);
    const screenshot = await page.screenshot({ fullPage: false });
    return `data:image/png;base64,${screenshot.toString('base64')}`;
  } finally {
    await context.close();
  }
}

async function captureTutorial({ name, route, session, mobileSession, mobileRoute, mobileFocusSelector, totalSteps, run, outputDir, vttName, setupPage }) {
  const browser = await chromium.launch({ headless: true });
  let context;
  try {
    const mobilePreviewDataUrl = mobileSession && mobileFocusSelector
      ? await captureMobilePreview(browser, { name, session: mobileSession, route: mobileRoute || '/', focusSelector: mobileFocusSelector, setupPage })
      : '';
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      recordVideo: { dir: rawDir, size: { width: 1920, height: 1080 } }
    });
    await addCaptureSession(context, session);
    const page = await context.newPage();
    if (setupPage) await setupPage(page);
    const video = page.video();
    const startedAt = Date.now();
    const cues = [];
    const cue = async (text, durationMs, action) => {
      const start = (Date.now() - startedAt) / 1000;
      if (action) await action();
      await page.waitForTimeout(durationMs);
      cues.push({ start, end: (Date.now() - startedAt) / 1000, text });
    };
    await page.goto(`${baseUrl}/?capture=${encodeURIComponent(name)}#${route}`, { waitUntil: 'networkidle' });
    await page.locator('main').waitFor({ state: 'visible' });
    await injectTutorialLayer(page, totalSteps, mobilePreviewDataUrl);
    await run({ page, cue, resetGuide: () => injectTutorialLayer(page, totalSteps, mobilePreviewDataUrl) });
    const posterPath = path.join(outputDir, `${name}-poster.png`);
    await page.screenshot({ path: posterPath, fullPage: false });
    await context.close();
    context = null;
    const rawPath = path.join(rawDir, `${name}.webm`);
    await video.saveAs(rawPath);
    await writeVtt(path.join(outputDir, vttName), cues);
    return { rawPath, posterPath, cues };
  } finally {
    if (context) await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function showStep(page, step, title, detail, selector) {
  const found = await page.evaluate(({ step, title, detail, selector }) => window.__tutorialCapture.setStep(step, title, detail, selector), { step, title, detail, selector });
  if (!found) throw new Error(`tutorial target not found: ${selector}`);
  await page.waitForTimeout(850);
}

async function showTitle(page, kicker, title, detail) {
  await page.evaluate(({ kicker, title, detail }) => window.__tutorialCapture.showTitle(kicker, title, detail), { kicker, title, detail });
  await page.waitForTimeout(350);
}

async function hideTitle(page) {
  await page.evaluate(() => window.__tutorialCapture.hideTitle());
  await page.waitForTimeout(500);
}

async function showMobile(page, kicker, title, detail) {
  await page.evaluate(({ kicker, title, detail }) => window.__tutorialCapture.showMobile(kicker, title, detail), { kicker, title, detail });
  await page.waitForTimeout(350);
}

async function hideMobile(page) {
  await page.evaluate(() => window.__tutorialCapture.hideMobile());
  await page.waitForTimeout(500);
}

async function prepareLoginForCapture(page, role) {
  await page.evaluate(selectedRole => {
    document.querySelector('.google-auth-note')?.remove();
    document.querySelector('.dev-login-panel')?.remove();
    const intro = document.querySelector('.login-form > p');
    if (intro) intro.textContent = selectedRole === 'student' ? 'Usa tu cuenta institucional @alumnos.ucn.cl.' : 'Usa la cuenta institucional autorizada.';
    const button = document.querySelector(`[data-google-redirect="${selectedRole}"]`);
    if (button) {
      button.disabled = false;
      button.classList.remove('is-disabled');
    }
  }, role);
}

async function enterCaptureSession(page, session, name, route = '/') {
  await page.evaluate(user => localStorage.setItem('portal.session', JSON.stringify(user)), session);
  await page.goto(`${baseUrl}/?capture=${encodeURIComponent(name)}&session=1#${route}`, { waitUntil: 'networkidle' });
  await page.locator('main').waitFor({ state: 'visible' });
}

await waitForServer();

try {
  if (captureStudent) {
  const student = await qaSession('student');
  await captureTutorial({
    name: 'solicitar-hora',
    route: '/login',
    mobileSession: student,
    mobileRoute: '/',
    mobileFocusSelector: 'a[href="#/atencion"]',
    totalSteps: 7,
    outputDir: publicMediaDir,
    vttName: 'solicitar-hora.vtt',
    run: async ({ page, cue, resetGuide }) => {
      await cue('Cómo reservar una hora de atención con Jefatura de carrera.', 3900, () => showTitle(page, 'Tutorial para estudiantes', 'Reservar una hora de atención', 'El horario queda confirmado al terminar.'));
      await hideTitle(page);
      await prepareLoginForCapture(page, 'student');
      await cue('Paso uno. En Estudiantes, selecciona Acceder con Google y usa tu cuenta institucional.', 5200, () => showStep(page, 1, 'Accede con Google', 'Continúa con tu cuenta institucional de estudiante.', '[data-google-redirect="student"]'));
      await cue('Google abrirá el acceso institucional. Completa el ingreso y vuelve al portál.', 4300, () => showTitle(page, 'Acceso institucional', 'Continúa en Google', 'Usa tu cuenta @alumnos.ucn.cl.'));
      await enterCaptureSession(page, student, 'solicitar-hora', '/');
      await resetGuide();
      await cue('En el teléfono, Atención aparece al final de la barra inferior. El proceso es el mismo.', 4800, () => showMobile(page, 'Vista móvil', 'Atención está en la barra inferior', 'Desde allí encontrarás los mismos horarios y controles.'));
      await hideMobile(page);
      await cue('Paso dos. Abre Atención desde el menú principal.', 4000, () => showStep(page, 2, 'Abre Atención', 'Selecciona Atención para revisar los horarios.', 'a[href="#/atencion"]'));
      await page.locator('a[href="#/atencion"]').first().click();
      await page.locator('h1.page-title').filter({ hasText: 'Atención de Jefatura' }).waitFor({ state: 'visible' });
      await cue('Paso tres. Revisa los días y horas disponibles.', 4400, () => showStep(page, 3, 'Revisa los cupos', 'Comprueba el día, la modalidad y el lugar de atención.', '.booking-calendar'));
      await cue('Paso cuatro. Selecciona el bloque que prefieras.', 4100, () => showStep(page, 4, 'Elige una hora', 'Presiona uno de los bloques disponibles.', 'button[data-book-slot]'));
      await page.locator('button[data-book-slot]').first().click();
      await page.locator('[data-booking-reason]').waitFor({ state: 'visible' });
      await cue('Paso cinco. Escribe un motivo breve y sin información sensible.', 4500, async () => {
        await showStep(page, 5, 'Indica el motivo', 'Describe tu consulta en una frase breve.', '[data-booking-reason]');
        await page.locator('[data-booking-reason]').fill('Consulta sobre inscripción de asignaturas.');
      });
      await cue('Paso seis. Reserva el horario seleccionado.', 4200, () => showStep(page, 6, 'Reserva la hora', 'El bloque queda confirmado de inmediato.', '[data-appointment-create]'));
      await page.locator('[data-appointment-create]').click();
      await page.locator('.booking-mine').waitFor({ state: 'visible' });
      await page.getByText('Reservada', { exact: true }).waitFor({ state: 'visible' });
      await cue('Paso siete. Revisa o cancela desde Mis horas.', 5000, () => showStep(page, 7, 'Revisa tu reserva', 'También recibirás un correo institucional de respaldo.', '.booking-mine'));
      await cue('Hora reservada.', 3900, () => showTitle(page, 'Atención de Jefatura', 'Hora reservada', 'El horario ya quedó registrado.'));
    }
  });
  }

  if (captureJefatura) {
  if (!captureStudent) await seedTutorialAppointment();
  const jefatura = await qaSession('jefatura');
  let calendarConnected = false;
  await captureTutorial({
    name: 'gestionar-atencion-jefatura',
    route: '/login',
    mobileSession: jefatura,
    mobileRoute: '/',
    mobileFocusSelector: 'a[href="#/jefatura"]',
    totalSteps: 12,
    outputDir: jefaturaWebMediaDir,
    vttName: 'gestionar-atencion-jefatura.vtt',
    setupPage: async page => {
      await page.route('**/api/calendar/status', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, status: {
          configured: true,
          connected: calendarConnected,
          verified: calendarConnected,
          account: 'jc.icivil.afta@ucn.cl',
          calendarId: 'primary',
          connectedAt: calendarConnected ? '2026-08-20T20:00:00.000Z' : null,
          verifiedAt: calendarConnected ? '2026-08-20T20:01:00.000Z' : null,
          canManage: true
        } })
      }));
      await page.route('**/api/calendar/freebusy', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, busy: [] }) }));
    },
    run: async ({ page, cue, resetGuide }) => {
      await cue('Esta guía muestra cómo configurar los horarios, conectar Calendar y gestionar las atenciones desde el portál.', 5600, () => showTitle(page, 'Guía para Jefatura', 'Configurar y gestionar la agenda', 'Horarios, sincronización y operación diaria.'));
      await hideTitle(page);
      await prepareLoginForCapture(page, 'internal');
      await cue('Paso uno. En Jefatura o CEAL, selecciona Acceder con Google.', 5200, () => showStep(page, 1, 'Accede con Google', 'Usa únicamente la cuenta autorizada de Jefatura.', '[data-google-redirect="internal"]'));
      await cue('Continúa únicamente con la cuenta de Jefatura que aparece en pantalla.', 4700, () => showTitle(page, 'Cuenta autorizada', 'jc.icivil.afta@ucn.cl', 'No uses otra cuenta para este acceso.'));
      await enterCaptureSession(page, jefatura, 'gestionar-atencion-jefatura', '/');
      await resetGuide();
      await cue('En el teléfono, Jefatura aparece al final de la barra inferior.', 4800, () => showMobile(page, 'Vista móvil', 'Jefatura está en la barra inferior', 'Desde allí puedes abrir el mismo panel de gestión.'));
      await hideMobile(page);
      await cue('Paso dos. Abre Jefatura. Aquí verás las próximas atenciones y la configuración de la agenda.', 5200, () => showStep(page, 2, 'Abre Jefatura', 'Aquí se administran atenciones, horarios y Calendar.', 'a[href="#/jefatura"]'));
      await page.locator('a[href="#/jefatura"]').first().click();
      await page.locator('h1.page-title').filter({ hasText: 'Jefatura' }).waitFor({ state: 'visible' });
      await cue('Paso tres. En Configuración de atención puedes activar o pausar la agenda, definir su vigencia y elegir una duración general. Todos los nuevos bloques usarán esa duración.', 8200, () => showStep(page, 3, 'Define la agenda', 'La duración elegida se aplica a todos los nuevos bloques.', '.booking-config-primary'));
      await page.locator('#f-booking-duration').selectOption('15');
      await cue('Paso cuatro. En cada horario define el día, el rango, la modalidad, el lugar y, si corresponde, el enlace de videollamada.', 7200, () => showStep(page, 4, 'Configura cada horario', 'Día, horas, modalidad, lugar y enlace.', '.booking-config-row'));
      await page.locator('.booking-config-advanced').evaluate(details => { details.open = true; });
      await cue('Paso cinco. En Opciones avanzadas ajusta cuántos días se muestran y la anticipación mínima. Luego guarda los cambios.', 7000, () => showStep(page, 5, 'Ajusta y guarda', 'Revisa las opciones avanzadas antes de publicar.', '.booking-config-advanced'));
      await cue('Guarda la configuración para actualizar inmediatamente los cupos que ven los estudiantes.', 5200, () => showStep(page, 5, 'Guarda los cambios', 'La disponibilidad se recalcula con esta configuración.', '.booking-config-actions .btn'));
      await page.locator('.booking-config-actions .btn').click();
      await page.getByText('Configuración guardada', { exact: true }).waitFor({ state: 'visible' });
      await cue('Paso seis. Baja a Google Calendar y abre el bloque. Confirma que aparezca la cuenta institucional correcta.', 6000, () => showStep(page, 6, 'Revisa Google Calendar', 'Comprueba la cuenta indicada antes de conectar.', '.booking-gcal'));
      await cue('Selecciona Conectar agenda. El portál abrirá Google para solicitar autorización.', 5000, () => showStep(page, 6, 'Conecta la agenda', 'Presiona este botón para continuar en Google.', '[data-calendar-connect]'));
      await cue('Continúa con la misma cuenta y permite consultar disponibilidad y administrar eventos. Luego vuelve al portál.', 6000, () => showTitle(page, 'Autorización de Google', 'Permite la sincronización', 'Autoriza eventos y consulta de disponibilidad.'));
      calendarConnected = true;
      await page.goto(`${baseUrl}/?capture=gestionar-atencion-jefatura&calendarFixture=connected#/jefatura?calendar=connected`, { waitUntil: 'networkidle' });
      await page.locator('main').waitFor({ state: 'visible' });
      await page.locator('[data-calendar-state="verified"]').waitFor({ state: 'attached', timeout: 12000 });
      await page.locator('.booking-gcal').evaluate(details => { details.open = true; });
      await resetGuide();
      await cue('Paso siete. Comprueba que el panel diga Calendar conectado y verificado. Revisa la cuenta y la fecha de verificación.', 6500, async () => {
        await showStep(page, 7, 'Confirma el estado verificado', 'Revisa cuenta, calendario y fecha de verificación.', '[data-calendar-state="verified"]');
        await page.locator('.booking-gcal').evaluate(details => details.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await page.waitForTimeout(500);
      });
      await cue('Las ocupaciones de Calendar bloquean horarios superpuestos. Cada reserva crea un evento y cada cancelación lo elimina.', 5700, () => showStep(page, 7, 'Qué sincroniza Calendar', 'Evita choques y mantiene los eventos de atención.', '[data-calendar-state="verified"]'));
      await cue('Los horarios se configuran en el portál. Mover un evento en Calendar no reprograma una atención ya reservada.', 6200, () => showStep(page, 7, 'Qué se gestiona en el portal', 'La configuración y los cupos se administran aquí.', '.booking-config'));
      await cue('Paso ocho. Antes de atender, revisa estudiante, horario, modalidad, lugar y motivo.', 5000, () => showStep(page, 8, 'Revisa la atención', 'Confirma todos los datos antes de atender.', '.appt-card-list .appt-card'));
      await cue('Paso nueve. Si no puedes atender, cancela desde la tarjeta. El evento se elimina y ese horario queda cerrado.', 6500, () => showStep(page, 9, 'Cancela y cierra ese horario', 'Nadie más podrá reservarlo mientras siga cerrado.', '[data-appointment-cancel]'));
      page.once('dialog', dialog => dialog.accept());
      await page.locator('[data-appointment-cancel]').first().click();
      await page.locator('.booking-inline-empty').waitFor({ state: 'visible' });
      await cue('El estudiante recibe automáticamente un enlace para elegir otra hora. El bloque cancelado no se ofrece a otra persona.', 6500, () => showStep(page, 9, 'El estudiante puede reagendar', 'Ese horario permanece cerrado hasta que lo reabras.', '.booking-inline-empty'));
      await cue('Paso diez. Para retirar otra hora que aún está libre, selecciona un bloque verde.', 6000, () => showStep(page, 10, 'Cierra otra hora libre', 'Selecciona un bloque verde para retirarlo.', '[data-availability-close]'));
      const closeSlot = page.locator('[data-availability-close]').first();
      const closeSlotKey = await closeSlot.getAttribute('data-availability-close');
      await closeSlot.click();
      const reopenSelector = `[data-availability-open="${closeSlotKey}"]`;
      await page.locator(reopenSelector).waitFor({ state: 'visible' });
      await cue('Paso once. Para volver a ofrecer cualquier bloque cerrado, selecciónalo nuevamente.', 6000, () => showStep(page, 11, 'Reabre la hora', 'El bloque vuelve a quedar disponible.', reopenSelector));
      await page.locator(reopenSelector).click();
      await cue('Paso doce. Realiza una reserva de prueba, confirma el evento en Calendar y cancélala desde Jefatura.', 6000, async () => {
        await showStep(page, 12, 'Comprueba la sincronización', 'Reserva, evento y cancelación.', '[data-calendar-state="verified"]');
        await page.locator('.booking-gcal').evaluate(details => details.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await page.waitForTimeout(500);
      });
      await cue('Con la prueba completa, la agenda queda lista. Las notificaciones se enviarán automáticamente.', 4500, () => showTitle(page, 'Jefatura de carrera', 'Agenda lista para operar', 'Calendar verificado y flujo comprobado.'));
    }
  });
  }
} finally {
  server.kill('SIGTERM');
}

console.log(JSON.stringify({ ok: true, publicMediaDir, jefaturaWebMediaDir, privateDir, rawDir }, null, 2));
