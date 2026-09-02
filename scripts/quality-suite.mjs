import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

function loadBrowserGlobal(rel, globalName) {
  const code = read(rel);
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: rel });
  return sandbox.window[globalName];
}

function tx(value) {
  const text = String(value ?? '');
  if (!/[ÃƒÃ‚ï¿½]/.test(text)) return text;
  try { return decodeURIComponent(escape(text)); } catch { return text; }
}

function plain(value) {
  return tx(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const data = loadBrowserGlobal('src/mock-data.js', 'PortalMock');
const curricula = loadBrowserGlobal('data/curricula.js', 'CURRICULA');
const driveMaterials = loadBrowserGlobal('data/drive-materials.js', 'PortalDriveMaterials') || [];
const appJs = read('src/app.js');
const serverJs = read('server.mjs');
const rootHtml = read('index.html');
const indexHtml = read('transferir/index.html');
const stylesCss = read('src/styles.css');
const transferJs = read('src/transfer.js');
const transferCss = read('src/transfer.css');
const packageJson = JSON.parse(read('package.json'));

for (const rel of ['index.html', '404.html', 'transferir/index.html', 'src/transfer.js', 'src/transfer.css', 'scripts/qa-transfer.mjs', 'src/app.js', 'src/mock-data.js', 'src/styles.css', 'server.mjs', 'data/curricula.js', 'scripts/qa-portal.mjs', 'scripts/watch-calendar-updates.mjs']) {
  assert(existsSync(path.join(root, rel)), `${rel} should exist`);
}
for (const retired of ['tutoriales/index.html', 'tutorial-jc/index.html', 'tutorial-ceal/index.html', 'tutorial-portal/index.html', 'tutorial-estudiantes/index.html', 'tutorial-jefatura/index.html', 'data/academic-schedule.js', 'docs/horario-dic-2-2026-v1.pdf']) {
  assert(!existsSync(path.join(root, retired)), `${retired} should stay outside the published portal`);
}

assert(packageJson.scripts.check.includes('scripts/quality-suite.mjs'), 'package check should include quality-suite');
assert(packageJson.scripts.quality === 'node scripts/quality-suite.mjs', 'package quality script should exist');
assert(packageJson.scripts['qa:transfer'] === 'node scripts/qa-transfer.mjs', 'temporary transfer QA script should be registered');
assert(packageJson.scripts['calendar:watch'] === 'node scripts/watch-calendar-updates.mjs', 'calendar watcher script should be registered');
assert(rootHtml.includes('url=/transferir/') && rootHtml.includes('href="/transferir/"'), 'root should redirect to the dedicated transfer route');
assert(indexHtml.includes('/src/transfer.js') && indexHtml.includes('/src/transfer.css'), 'transfer route should load only the temporary transfer experience');
assert(!indexHtml.includes('src/app.js') && !indexHtml.includes('src/mock-data.js') && !indexHtml.includes('data/curricula.js') && !indexHtml.includes('src/config.js'), 'temporary root should not load the portal application');
assert(!indexHtml.includes('rel="manifest"'), 'temporary transfer page should not install the portal PWA');
assert(indexHtml.includes('https://ceicucn.cl/transferir/'), 'transfer route should declare its canonical public URL');
assert(indexHtml.includes('Copiar todos los datos') && transferJs.includes('navigator.clipboard.writeText'), 'transfer page should provide a working copy action');
assert(indexHtml.includes('21.010.841-6') && indexHtml.includes('1062801369') && indexHtml.includes('belen.astu24@gmail.com'), 'transfer page should publish the explicitly authorized account data');
assert(!/Choripán|Piscola|Michelada|\$1\.500/.test(indexHtml), 'temporary transfer page should stay focused and exclude the product menu');
assert(!indexHtml.includes('data/academic-schedule.js'), 'retired academic schedule should not load in the public portal');
assert(!indexHtml.includes('accounts.google.com/gsi/client'), 'index should not load Google Identity Services widget');
assert(transferCss.includes('min-width: 320px') && transferCss.includes('@media (max-width: 380px)'), 'transfer page should define stable narrow-mobile behavior');
assert(!appJs.includes('data-google-button'), 'app should not render legacy GSI button slots');
assert(!appJs.includes('window.google'), 'app should not depend on the legacy GSI global');
assert(appJs.includes('!isLocalDevHost()'), 'Google OAuth should stay disabled on localhost to avoid an invalid redirect URI');
assert(appJs.includes("state.user.authProvider === 'local-dev'"), 'localhost review sessions should survive direct navigation');
assert(appJs.includes("surveys: false"), 'surveys should remain disabled until explicitly re-enabled');
assert(appJs.includes("tableReservations: false"), 'table reservations should remain disabled until explicitly re-enabled');
assert(appJs.includes("appointments: captureAppointments"), 'appointment booking should remain disabled outside local tutorial capture');
assert(appJs.includes("URL_PARAMS.has('captureBooking')") && appJs.includes("['localhost', '127.0.0.1', '::1'].includes(location.hostname)"), 'appointment capture mode should be restricted to local hosts');
assert(serverJs.includes("appointments: process.env.PORTAL_APPOINTMENTS_ENABLED === '1'"), 'appointment APIs should remain disabled by default in production');
assert((serverJs.match(/appointment booking is not enabled/g) || []).length >= 9, 'all appointment and Calendar mutations should enforce the server feature gate');
assert(appJs.includes('data-guest-login') && appJs.includes('portal-review'), 'login should expose an ephemeral read-only portal account');
assert(appJs.includes('Revisa el contenido publicado sin iniciar sesión.'), 'guest access should explain that login is not required');
assert(!appJs.includes("['/tutoriales', 'play', 'Tutoriales']"), 'retired tutorials should stay out of navigation');
assert(!appJs.includes("['/atencion', 'users', 'Atención']") && !appJs.includes("['/jefatura', 'users', 'Jefatura']"), 'retired attention routes should stay out of navigation');
assert(appJs.includes("'/comunicados/nuevo', '/asistente'].includes(path)"), 'retired operational and communication routes should redirect away from their old pages');
assert(!appJs.includes("['/comunicados', 'megaphone', 'Comunicados']"), 'retired communications should stay out of navigation');
assert(appJs.includes("apiRequest('/bootstrap', { cache: 'no-store' })"), 'authenticated reloads should bypass a stale browser bootstrap cache');
assert(/const initialPortalDark = storedPortalTheme\s*\? storedPortalTheme === 'dark'\s*:\s*false;/.test(appJs), 'new portal sessions should start in light mode');
assert(stylesCss.includes('color-scheme: only light'), 'light mode should prevent forced browser recoloring');
assert(appJs.includes("portal.data.v6"), 'app should invalidate stale local material snapshots');
assert(!appJs.includes("'portal.data.v5'"), 'app should not reuse the stale v5 local snapshot');
assert(appJs.includes('materialCourseOptions'), 'material course filters should be derived from official curricula');
assert(appJs.includes("!['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)"), 'scroll reset should not blur active form controls');
assert(appJs.includes('routeTo(`/material/${resourceRow.dataset.resourceRow}`)'), 'desktop material rows should open the resource detail route');
assert(appJs.includes('sandbox="allow-scripts"'), 'embedded curricula should run inside a sandboxed iframe');

assert(Array.isArray(data.cealMembers), 'cealMembers should be an array');
assert(data.cealMembers.length === 9, 'there should be 9 CEAL members from candidate list');
const memberIds = new Set();
const memberUsernames = new Set();
const memberEmails = new Set();
const allowedPerms = new Set([
  'approve:content',
  'manage:roles',
  'review:casos',
  'upload:acuerdos',
  'edit:calendario',
  'manage:forms',
  'validate:material',
  'edit:mallas',
  'manage:tutoring'
]);
for (const member of data.cealMembers) {
  assert(Boolean(member.id), 'CEAL member should have id');
  assert(!memberIds.has(member.id), `duplicate member id ${member.id}`);
  memberIds.add(member.id);
  assert(Boolean(member.username), `${member.id} should have username`);
  assert(!memberUsernames.has(member.username), `duplicate username ${member.username}`);
  memberUsernames.add(member.username);
  assert(Boolean(member.name), `${member.id} should have name`);
  assert(Boolean(member.roleName), `${member.id} should have roleName`);
  assert(Boolean(member.email), `${member.id} should have email`);
  assert(!memberEmails.has(member.email), `duplicate email ${member.email}`);
  memberEmails.add(member.email);
  assert(member.role === 'ceal', `${member.id} should be a CEAL account`);
  assert(member.passwordSet === false, `${member.id} should require first-login password`);
  assert(!('rut' in member), `${member.id} must not expose RUT`);
  assert(!('ppa' in member), `${member.id} must not expose PPA`);
  assert(!('passwordHash' in member), `${member.id} must not expose password hash`);
  assert(!('passwordSalt' in member), `${member.id} must not expose password salt`);
  assert(Array.isArray(member.permissions), `${member.id} should have permissions`);
  assert(!member.permissions.includes('publish:comunicados'), `${member.id} should not retain retired communication permissions`);
  assert(member.permissions.length >= 2, `${member.id} should have meaningful permissions`);
  for (const perm of member.permissions) assert(allowedPerms.has(perm), `${member.id} unknown permission ${perm}`);
}
for (const email of [
  'martina.briceno@alumnos.ucn.cl',
  'camila.villegas@alumnos.ucn.cl',
  'belen.astudillo@alumnos.ucn.cl',
  'matias.gonzalez11@alumnos.ucn.cl',
  'gabriel.sanchez@alumnos.ucn.cl',
  'bruno.castillo@alumnos.ucn.cl',
  'paolo.cardaniz@alumnos.ucn.cl',
  'paolo.ferruzola@alumnos.ucn.cl',
  'kevin.cortes@alumnos.ucn.cl'
]) {
  assert(memberEmails.has(email), `missing CEAL email ${email}`);
}

assert(data.users.student.role === 'student', 'student user should be student');
assert(data.users.ceal.role === 'ceal', 'seed CEAL user should be CEAL');
assert(Array.isArray(data.communications) && data.communications.length === 0, 'retired communications should not retain seed content');
assert(!('gestion' in data), 'static data should not include unused management filler');
assert(Array.isArray(data.resources) && data.resources.length >= 9, 'resources should be seeded');
assert(Array.isArray(data.cases) && data.cases.length >= 5, 'cases should be seeded');
assert(Array.isArray(data.events) && data.events.length >= 5, 'events should be seeded');
assert(data.calendarSource?.version === 'dgpre-antofagasta-decreto-077-2026-20260713', 'academic calendar should identify the current official source');
assert(data.events.some(event => event.date === '2026-08-20' && /inicio.*(ii|segundo) semestre/i.test(plain(event.title))), 'academic calendar should use the corrected second-semester start');
assert(Array.isArray(data.agreements) && data.agreements.length >= 3, 'agreements should be seeded');
assert(Array.isArray(data.tutoring) && data.tutoring.length >= 2, 'tutoring should be seeded');
assert(Array.isArray(data.procedures) && data.procedures.length >= 3, 'procedures should be seeded');
assert(Array.isArray(data.surveys) && data.surveys.length === 0, 'disabled surveys should not retain sample content');
assert(Array.isArray(data.staffProfiles) && data.staffProfiles.length >= 1, 'staff profiles should be seeded');
assert(!('courseProgress' in data), 'student course progress should not be inferred without academic records');
assert(!data.appointments || (Array.isArray(data.appointments) && data.appointments.length === 0), 'appointments seed should not contain fictitious students');
for (const notification of data.notifications || []) {
  assert(notification.route !== '/contingencia', `notification ${notification.id} should not link to removed contingency route`);
  assert(!String(notification.route || '').startsWith('/comunicados'), `notification ${notification.id} should not reference removed communications`);
}
assert(data.staffProfiles.some(profile => profile.email === 'jc.icivil.afta@ucn.cl'), 'career head profile email should be registered');
assert(data.staffProfiles.every(profile => [15, 20, 30, 45, 60].includes(profile.bookingSettings?.slotMinutes)), 'Jefatura profiles should publish a supported appointment duration');
assert(data.staffProfiles.every(profile => Array.isArray(profile.officeHours) && profile.officeHours.every(hour => hour.start && hour.end && hour.mode)), 'Jefatura profiles should publish structured weekly hours');
assert(appJs.includes("path === '/gestion/calendario'"), 'CEAL calendar update route should exist');
assert(appJs.includes('management-console'), 'CEAL management should use the consolidated console');
assert(appJs.includes('Tráfico del portal') && appJs.includes("apiRequest('/analytics/summary')"), 'CEAL management should include its protected traffic dashboard');
assert(appJs.includes("fetch(`${API_BASE}/analytics/collect`"), 'portal routes should send aggregate traffic events');
assert(!appJs.includes("id === 'com-001' ?"), 'app should not retain a legacy communication fallback');
assert(serverJs.includes('communications-retired-20260829'), 'backend should apply the communication retirement migration');
assert(serverJs.includes("collectionName === 'communications'") && serverJs.includes('communications not enabled'), 'backend should reject retired communication APIs');
assert(serverJs.includes("const { sessions, aiUsage, aiDrafts, integrations, appointments, bookingAvailability, reservations, calendarUpdateRequests, cealMembers, staffProfiles, analytics, ...safe }"), 'traffic analytics should stay out of the public bootstrap');
assert(serverJs.includes("id === 'summary'") && serverJs.includes('requireCealSession(req, db)'), 'traffic summaries should require a CEAL session');
assert(!serverJs.includes('requestIp(req), body') && !serverJs.includes('analytics.email'), 'traffic records should not persist IP addresses or email identifiers');
assert(!serverJs.includes("collectionName === 'communications' && id === 'com-001'"), 'backend should not retain a legacy communication fallback');
assert(!serverJs.includes("hasDriveSeed && /^mat-\\d{3}$/.test"), 'backend should preserve real uploaded materials when Drive resources are present');
assert(!appJs.includes("hasDriveCatalog && /^mat-\\d{3}$/.test"), 'frontend should preserve real uploaded materials when Drive resources are present');
assert(appJs.includes("path === '/horarios') return routeTo('/calendario')"), 'retired academic schedule route should redirect to the calendar');
assert(!appJs.includes("['/horarios', 'clock', 'Horario académico']"), 'retired academic schedule should stay out of navigation');
assert(serverJs.includes("'.pdf': 'application/pdf'"), 'static server should send published PDF files with the correct MIME type');
assert(appJs.includes('calendar-detail-modal') && appJs.includes('data-calendar-modal-close'), 'academic calendar should open an accessible detail modal');
assert(appJs.includes('data-form="booking-config"'), 'Jefatura booking configuration form should exist');
assert(serverJs.includes('calendarUpdateRequests') && serverJs.includes('requireCalendarWatcher'), 'calendar source inbox should require a private watcher token');
assert(/calendarUpdateRequests[^\n]+safe/.test(serverJs), 'calendar source files should be excluded from public bootstrap data');
const cealEmailSet = new Set(data.cealMembers.map((member) => member.email));
for (const profile of data.staffProfiles) {
  const authorized = [profile.email, ...(profile.authorizedEmails || [])].filter(Boolean);
  const authorizedSet = new Set(authorized.map((email) => email.toLowerCase()));
  assert(authorized.includes('jc.icivil.afta@ucn.cl'), 'Jefatura should authorize the official career-head email');
  const allowedJefatura = new Set(['jc.icivil.afta@ucn.cl', 'martina.briceno@alumnos.ucn.cl', 'kevin.cortes@alumnos.ucn.cl']);
  assert([...authorizedSet].every((email) => allowedJefatura.has(email)), 'Jefatura should only authorize the official and approved test accounts');
  assert(authorizedSet.size === allowedJefatura.size && [...allowedJefatura].every(email => authorizedSet.has(email)), 'Jefatura should authorize Martina and Kevin for end-to-end testing');
  for (const email of authorized) {
    if (email === 'jc.icivil.afta@ucn.cl') assert(!cealEmailSet.has(email), 'official Jefatura email should not be a CEAL account');
  }
}

for (const collection of ['communications', 'resources', 'cases', 'events', 'agreements', 'tutoring', 'procedures', 'surveys', 'staffProfiles']) {
  const ids = new Set();
  for (const item of data[collection]) {
    assert(Boolean(item.id), `${collection} item should have id`);
    assert(!ids.has(item.id), `${collection} duplicate id ${item.id}`);
    ids.add(item.id);
    assert(!/demo frontend|descarga simulada/i.test(plain(JSON.stringify(item))), `${collection} item leaks demo wording`);
  }
}

for (const comm of data.communications) {
  assert(Boolean(comm.title), `communication ${comm.id} title`);
  assert(Boolean(comm.category), `communication ${comm.id} category`);
  assert(Boolean(comm.summary), `communication ${comm.id} summary`);
  assert(Boolean(comm.body), `communication ${comm.id} body`);
  assert(Boolean(comm.date), `communication ${comm.id} date`);
}

for (const resource of data.resources) {
  assert(Boolean(resource.title), `resource ${resource.id} title`);
  assert(Boolean(resource.type), `resource ${resource.id} type`);
  assert(Boolean(resource.courseCode), `resource ${resource.id} courseCode`);
  assert(Boolean(resource.courseName), `resource ${resource.id} courseName`);
  assert(Boolean(resource.format), `resource ${resource.id} format`);
  assert(Boolean(resource.status), `resource ${resource.id} status`);
  assert(Boolean(resource.description), `resource ${resource.id} description`);
}

for (const item of data.cases) {
  assert(Boolean(item.number), `case ${item.id} number`);
  assert(Boolean(item.title), `case ${item.id} title`);
  assert(Boolean(item.status), `case ${item.id} status`);
  assert(Boolean(item.summary), `case ${item.id} summary`);
  assert(Array.isArray(item.history), `case ${item.id} history`);
}

for (const agreement of data.agreements) {
  assert(Boolean(agreement.title), `agreement ${agreement.id} title`);
  assert(Boolean(agreement.status), `agreement ${agreement.id} status`);
  assert(Boolean(agreement.summary), `agreement ${agreement.id} summary`);
  assert(Array.isArray(agreement.commitments), `agreement ${agreement.id} commitments`);
  assert(Array.isArray(agreement.history), `agreement ${agreement.id} history`);
}

const plans = [
  ['planO', 61, 10],
  ['planP', 64, 11]
];
for (const [plan, expectedSubjects, expectedSemesters] of plans) {
  const curr = curricula[plan];
  assert(Boolean(curr), `${plan} should exist`);
  assert(curr.expectedSubjects === expectedSubjects, `${plan} expectedSubjects should be ${expectedSubjects}`);
  assert(curr.totalSemesters === expectedSemesters, `${plan} totalSemesters should be ${expectedSemesters}`);
  assert(Array.isArray(curr.subjects), `${plan} subjects should be array`);
  assert(curr.subjects.length === expectedSubjects, `${plan} should have ${expectedSubjects} subjects`);
  const codes = new Set();
  const visibleCodes = new Set();
  const areaCounts = new Map();
  for (const course of curr.subjects) {
    assert(Boolean(course.code), `${plan} course should have code`);
    assert(!codes.has(course.code), `${plan} duplicate course code ${course.code}`);
    codes.add(course.code);
    assert(Boolean(course.visibleCode), `${plan}:${course.code} should have visibleCode`);
    assert(!visibleCodes.has(course.visibleCode), `${plan} duplicate visibleCode ${course.visibleCode}`);
    visibleCodes.add(course.visibleCode);
    assert(Boolean(tx(course.name).trim()), `${plan}:${course.code} should have name`);
    assert(Number.isInteger(course.semester), `${plan}:${course.code} semester integer`);
    assert(course.semester >= 1 && course.semester <= expectedSemesters, `${plan}:${course.code} semester in range`);
    assert(Number(course.sct) > 0, `${plan}:${course.code} sct positive`);
    assert(Boolean(course.area), `${plan}:${course.code} area`);
    areaCounts.set(course.area, (areaCounts.get(course.area) || 0) + 1);
    assert(Array.isArray(course.prereqs), `${plan}:${course.code} prereqs array`);
    assert(Array.isArray(course.requirements), `${plan}:${course.code} requirements array`);
    assert(typeof course.description === 'string', `${plan}:${course.code} description string`);
    assert(!/undefined|null/i.test(JSON.stringify(course)), `${plan}:${course.code} should not leak undefined/null`);
  }
  assert(areaCounts.size >= 4, `${plan} should span at least four academic areas`);
  for (const course of curr.subjects) {
    for (const prereq of course.prereqs) {
      assert(codes.has(prereq), `${plan}:${course.code} prereq ${prereq} should resolve`);
      const prereqCourse = curr.subjects.find(c => c.code === prereq);
      assert(prereqCourse.semester <= course.semester, `${plan}:${course.code} prereq ${prereq} should not be after course`);
    }
  }
}

const officialCourseCodes = new Set();
const officialCourseNames = new Map();
for (const plan of ['planO', 'planP']) {
  for (const course of curricula[plan].subjects) {
    officialCourseCodes.add(course.code);
    officialCourseCodes.add(course.visibleCode);
    officialCourseNames.set(plain(course.name), tx(course.name));
  }
}
for (const resource of driveMaterials) {
  const normalizedTitle = plain(resource.title);
  assert(officialCourseCodes.has(resource.courseCode), `drive resource ${resource.id} should use an official course code, got ${resource.courseCode}`);
  assert(officialCourseNames.has(plain(resource.courseName)), `drive resource ${resource.id} should use an official course name, got ${resource.courseName}`);
  assert(!/^(agua potable|alcantarillado|tarea 2|hidraulica invierno)$/i.test(plain(resource.courseName)), `drive resource ${resource.id} should not expose a folder/topic as course`);
  assert(!/^\d{5,}$/.test(normalizedTitle), `drive resource ${resource.id} should not have a numeric-only title`);
  assert(!/^doc\s*20\d{6}\s*wa/i.test(normalizedTitle), `drive resource ${resource.id} should not expose WhatsApp document filenames`);
  assert(!/^(newdoc|archivo|documento|material|videos?)$/.test(normalizedTitle), `drive resource ${resource.id} should not have a generic title`);
  assert(!/^(p|c|e)\s*\d+$/.test(normalizedTitle), `drive resource ${resource.id} should not have a bare assessment code title`);
  assert(!/pauta|resoluci[oó]n|soluci[oó]n|solucionario/.test(plain(resource.type)), `drive resource ${resource.id} should not publish restricted solution material`);
}

const appRequirements = [
  'renderLogin',
  'renderManagement',
  'renderMallas',
  'renderMaterial',
  'renderUploadMaterial',
  'renderAgreementForm',
  'renderValidateMaterial',
  'startGoogleRedirect',
  'handleGoogleRedirectCallback',
  'data-google-redirect',
  'google-oauth-btn',
  "googleButton('internal')",
  'Jefatura / CEAL',
  'management-console',
  'downloadResource',
  'drivePreviewUrl',
  'resource-preview-frame',
  'captureInputFocus',
  'restoreInputFocus',
  'scheduleFilterRender',
  'renderDataRefresh',
  'preserveFocus',
  'data-publish',
  'data-clear-panel',
  'data-approve-material',
  'data-download-resource'
];
for (const needle of appRequirements) assert(appJs.includes(needle), `app should include ${needle}`);

const serverRequirements = [
  '/api/health',
  "id === 'setup'",
  "id === 'login'",
  "id === 'google'",
  'verifyGoogleCredential',
  'publicMember',
  'hashPassword',
  'writeDb',
  'fileDataUrl',
  'passwordHash',
  'passwordSalt'
];
for (const needle of serverRequirements) assert(serverJs.includes(needle), `server should include ${needle}`);

const visibleUiTextFiles = [
  ['index.html', indexHtml],
  ['src/transfer.js', transferJs],
  ['src/app.js', appJs]
];
for (const [name, content] of visibleUiTextFiles) {
  assert(!/vista demo|demo frontend|descarga simulada|mock data/i.test(content), `${name} should not expose demo wording`);
}

assert(!/rut|ppa/i.test(JSON.stringify(data.cealMembers)), 'seed members should not include sensitive academic identifiers');
assert(!/21\.010\.841-6|1062801369|belen\.astu24@gmail\.com/i.test(`${appJs}\n${serverJs}`), 'public source should not contain legacy personal payment data');
assert(indexHtml.includes("Content-Security-Policy"), 'index should declare a content security policy');
assert(serverJs.includes("PORTAL_MAX_SESSIONS"), 'server should support an explicit session capacity');
assert(serverJs.includes("id === 'session'") && appJs.includes('validateInitialSession'), 'saved sessions should be validated before protected UI renders');
const internalGoogleBlock = serverJs.match(/if \(role === 'internal'\) \{[\s\S]*?\n\s*if \(role === 'ceal'\)/)?.[0] || '';
assert(internalGoogleBlock.indexOf('findStaffProfileByEmail') >= 0 && internalGoogleBlock.indexOf('findStaffProfileByEmail') < internalGoogleBlock.indexOf('findMemberByEmail'), 'approved test accounts should resolve to Jefatura before CEAL in internal mode');
assert(/permissions: \['manage:office-hours', 'edit:calendario'\]/.test(serverJs), 'Jefatura sessions should expose only agenda and calendar permissions');
assert(serverJs.includes("bookingAvailability"), 'server should persist appointment availability');
assert(serverJs.includes("sendBookingNotifications"), 'appointment notifications should be derived on the server');
assert(serverJs.includes("status: 'confirmada'"), 'appointments should be reserved immediately');
assert(serverJs.includes('Elegir otra hora'), 'Jefatura cancellation email should include a rescheduling action');
assert(!appJs.includes('Prof. Zelada'), 'appointment UI should not identify a specific person');
assert(!appJs.includes('Atención académica'), 'appointment UI should identify the role as Jefe de carrera');
assert(!appJs.includes('#/jefatura/tutorial'), 'private Jefatura tutorial should not be exposed as a web route');
assert(serverJs.includes("aes-256-gcm"), 'Google Calendar tokens should be encrypted at rest');
assert(serverJs.includes("tokensEncrypted"), 'encrypted Google Calendar token storage should be enabled');
assert(serverJs.includes('verifyGoogleCalendarConnection'), 'Calendar connection should be verified after OAuth');
assert(serverJs.includes('CALENDAR_CONNECTION_NOTIFY_EMAIL'), 'Calendar connection should notify the configured reviewer');
assert(serverJs.includes('kevin.cortes@alumnos.ucn.cl'), 'Calendar connection should default to Kevin as reviewer');
assert(appJs.includes('Calendar conectado y verificado'), 'Jefatura should see a verified Calendar state');
assert(!appJs.includes('sin aprobación previa'), 'Jefatura UI should not expose removed workflow commentary');

const routeNeedles = [
  "#/gestion",
  "#/material/subir",
  "#/mallas",
  "#/calendario",
  "#/perfil"
];
for (const route of routeNeedles) assert(appJs.includes(route), `app should link ${route}`);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, assertions, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, assertions, failures: 0 }, null, 2));
