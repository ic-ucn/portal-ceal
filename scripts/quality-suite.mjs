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
const indexHtml = read('index.html');
const packageJson = JSON.parse(read('package.json'));

for (const rel of ['index.html', 'src/app.js', 'src/mock-data.js', 'src/styles.css', 'server.mjs', 'data/curricula.js', 'scripts/qa-portal.mjs']) {
  assert(existsSync(path.join(root, rel)), `${rel} should exist`);
}

assert(packageJson.scripts.check.includes('scripts/quality-suite.mjs'), 'package check should include quality-suite');
assert(packageJson.scripts.quality === 'node scripts/quality-suite.mjs', 'package quality script should exist');
assert(indexHtml.includes('src/app.js'), 'index should load app.js');
assert(indexHtml.includes('src/mock-data.js'), 'index should load data seed');
assert(indexHtml.includes('data/curricula.js'), 'index should load curricula');
assert(!indexHtml.includes('accounts.google.com/gsi/client'), 'index should not load Google Identity Services widget');
assert(indexHtml.includes('src/config.js'), 'index should load public runtime config');
assert(!appJs.includes('data-google-button'), 'app should not render legacy GSI button slots');
assert(!appJs.includes('window.google'), 'app should not depend on the legacy GSI global');
assert(appJs.includes("portal.data.v6"), 'app should invalidate stale local material snapshots');
assert(!appJs.includes("portal.data.v5"), 'app should not reuse the stale v5 local snapshot');
assert(appJs.includes('materialCourseOptions'), 'material course filters should be derived from official curricula');
assert(appJs.includes("!['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)"), 'scroll reset should not blur active form controls');
assert(appJs.includes('routeTo(`/material/${resourceRow.dataset.resourceRow}`)'), 'desktop material rows should open the resource detail route');

assert(Array.isArray(data.cealMembers), 'cealMembers should be an array');
assert(data.cealMembers.length === 9, 'there should be 9 CEAL members from candidate list');
const memberIds = new Set();
const memberUsernames = new Set();
const memberEmails = new Set();
const allowedPerms = new Set([
  'approve:content',
  'manage:roles',
  'review:casos',
  'publish:comunicados',
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
assert(Array.isArray(data.communications) && data.communications.length >= 5, 'communications should be seeded');
assert(Array.isArray(data.resources) && data.resources.length >= 9, 'resources should be seeded');
assert(Array.isArray(data.cases) && data.cases.length >= 5, 'cases should be seeded');
assert(Array.isArray(data.events) && data.events.length >= 5, 'events should be seeded');
assert(Array.isArray(data.agreements) && data.agreements.length >= 3, 'agreements should be seeded');
assert(Array.isArray(data.tutoring) && data.tutoring.length >= 2, 'tutoring should be seeded');
assert(Array.isArray(data.procedures) && data.procedures.length >= 3, 'procedures should be seeded');
assert(Array.isArray(data.surveys) && data.surveys.length >= 1, 'surveys should be seeded');
assert(Array.isArray(data.staffProfiles) && data.staffProfiles.length >= 1, 'staff profiles should be seeded');
assert(data.staffProfiles.some(profile => profile.email === 'jc.icivil.afta@ucn.cl'), 'career head profile email should be registered');

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
  assert(officialCourseCodes.has(resource.courseCode), `drive resource ${resource.id} should use an official course code, got ${resource.courseCode}`);
  assert(officialCourseNames.has(plain(resource.courseName)), `drive resource ${resource.id} should use an official course name, got ${resource.courseName}`);
  assert(!/^(agua potable|alcantarillado|tarea 2|hidraulica invierno)$/i.test(plain(resource.courseName)), `drive resource ${resource.id} should not expose a folder/topic as course`);
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
  'startGuestSession',
  'guest-login-card',
  'management-content-grid',
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
  ['src/app.js', appJs]
];
for (const [name, content] of visibleUiTextFiles) {
  assert(!/vista demo|demo frontend|descarga simulada|mock data/i.test(content), `${name} should not expose demo wording`);
}

assert(!/rut|ppa/i.test(JSON.stringify(data.cealMembers)), 'seed members should not include sensitive academic identifiers');

const routeNeedles = [
  "#/gestion",
  "#/material/subir",
  "#/mallas",
  "#/calendario",
  "#/comunicados",
  "#/perfil"
];
for (const route of routeNeedles) assert(appJs.includes(route), `app should link ${route}`);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, assertions, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, assertions, failures: 0 }, null, 2));
