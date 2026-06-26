import http from 'node:http';
import { promises as fs } from 'node:fs';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import { strToU8, zipSync } from 'fflate';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
loadLocalEnv(path.join(root, '.env.local'));
loadLocalEnv(path.join(root, '.env'));
const dataDir = path.join(root, '.data');
const dbPath = process.env.PORTAL_DB_PATH || path.join(dataDir, 'portal-db.json');
const port = Number(process.env.PORT || 8080);
const googleClientId = process.env.PORTAL_GOOGLE_CLIENT_ID || '';
const googleDomain = process.env.PORTAL_GOOGLE_DOMAIN || 'alumnos.ucn.cl';
const googleOAuthClient = new OAuth2Client(googleClientId || undefined);
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const geminiDailySoftLimit = Number(process.env.GEMINI_DAILY_SOFT_LIMIT || 50);
const publicPortalUrl = (process.env.PORTAL_PUBLIC_URL || '').replace(/\/$/, '');
const calendarClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || googleClientId;
const calendarClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';
const calendarRedirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || '';
const legacyCalendarAccount = 'biblioteca.ceicucn@gmail.com';
const configuredCalendarAccount = (process.env.GOOGLE_CALENDAR_ACCOUNT || 'jc.icivil.afta@ucn.cl').toLowerCase();
const calendarAccount = configuredCalendarAccount === legacyCalendarAccount ? 'jc.icivil.afta@ucn.cl' : configuredCalendarAccount;
const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
const calendarScopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/userinfo.email'
];
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseStateTable = process.env.SUPABASE_STATE_TABLE || 'portal_state';
const supabaseStateId = process.env.SUPABASE_STATE_ID || 'main';
const stateBackend = String(process.env.PORTAL_STATE_BACKEND || '').trim().toLowerCase();
const useSupabaseState = stateBackend !== 'local' && Boolean(supabaseUrl && supabaseSecretKey);

// --- Correo de comunicados (envio opcional al publicar) ---
const mailUser = (process.env.CEAL_MAIL_USER || '').trim();
const mailPass = (process.env.CEAL_MAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const mailFromName = process.env.CEAL_MAIL_FROM_NAME || 'CEIC Ingenieria Civil UCN';
const mailHost = process.env.CEAL_MAIL_HOST || 'smtp.gmail.com';
const mailPort = Number(process.env.CEAL_MAIL_PORT || 465);
const mailBatchSize = Number(process.env.CEAL_MAIL_BATCH || 90);
const mailTestMode = process.env.CEAL_MAIL_TEST_MODE === '1';
const recipientsFile = process.env.RECIPIENTS_FILE || '/etc/secrets/recipients.json';
const recipientsLocalFile = path.join(root, 'recipients.json');

const collectionMap = {
  communications: 'communications',
  comunicados: 'communications',
  cases: 'cases',
  casos: 'cases',
  materials: 'resources',
  material: 'resources',
  resources: 'resources',
  agreements: 'agreements',
  acuerdos: 'agreements',
  events: 'events',
  calendario: 'events',
  tutoring: 'tutoring',
  ayudantias: 'tutoring',
  procedures: 'procedures',
  tramites: 'procedures',
  notifications: 'notifications',
  surveys: 'surveys',
  encuestas: 'surveys',
  votaciones: 'surveys',
  appointments: 'appointments',
  atenciones: 'appointments',
  staffProfiles: 'staffProfiles',
  jefatura: 'staffProfiles'
};

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

let dbPromise;

function supabaseRestUrl(pathname) {
  return `${supabaseUrl}/rest/v1/${pathname}`;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: supabaseSecretKey,
    authorization: `Bearer ${supabaseSecretKey}`,
    ...extra
  };
}

async function readDbFromSupabase() {
  const response = await fetch(supabaseRestUrl(`${encodeURIComponent(supabaseStateTable)}?id=eq.${encodeURIComponent(supabaseStateId)}&select=payload`), {
    headers: supabaseHeaders({ accept: 'application/json' })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || payload?.error || `supabase read ${response.status}`;
    throw new Error(message);
  }
  return Array.isArray(payload) && payload[0]?.payload ? payload[0].payload : null;
}

async function writeDbToSupabase(next) {
  const response = await fetch(supabaseRestUrl(`${encodeURIComponent(supabaseStateTable)}?on_conflict=id`), {
    method: 'POST',
    headers: supabaseHeaders({
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal'
    }),
    body: JSON.stringify({
      id: supabaseStateId,
      payload: next,
      updated_at: new Date().toISOString()
    })
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || payload?.error || `supabase write ${response.status}`;
    throw new Error(message);
  }
}

function loadLocalEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function runBrowserScript(file, globalName, code) {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox.window[globalName];
}

async function readSeed() {
  const mockPath = path.join(root, 'src', 'mock-data.js');
  const curriculaPath = path.join(root, 'data', 'curricula.js');
  const driveMaterialsPath = path.join(root, 'data', 'drive-materials.js');
  const dataSandbox = { window: {}, console };
  vm.createContext(dataSandbox);
  try {
    vm.runInContext(await fs.readFile(driveMaterialsPath, 'utf8'), dataSandbox, { filename: driveMaterialsPath });
  } catch {}
  vm.runInContext(await fs.readFile(mockPath, 'utf8'), dataSandbox, { filename: mockPath });
  const data = dataSandbox.window.PortalMock;
  const curricula = runBrowserScript(curriculaPath, 'CURRICULA', await fs.readFile(curriculaPath, 'utf8'));
  return {
    meta: {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'src/mock-data.js'
    },
    data,
    curricula
  };
}

async function loadDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    if (useSupabaseState) {
      const seed = await readSeed();
      const remote = await readDbFromSupabase();
      if (remote) {
        const normalized = ensureDbShape(remote, seed);
        await writeDb(normalized);
        return normalized;
      }
      const created = ensureDbShape(seed, seed);
      await writeDb(created);
      return created;
    }
    await fs.mkdir(dataDir, { recursive: true });
    try {
      const db = JSON.parse(await fs.readFile(dbPath, 'utf8'));
      const normalized = ensureDbShape(db, await readSeed());
      await writeDb(normalized);
      return normalized;
    } catch {
      const seed = await readSeed();
      await ensureDbShape(seed, seed);
      await writeDb(seed);
      return seed;
    }
  })();
  return dbPromise;
}

function ensureDbShape(db, seed) {
  db.data ||= {};
  seed.data ||= {};
  db.data.cealMembers ||= [];
  const memberSeedKeys = ['username', 'name', 'initials', 'role', 'roleName', 'label', 'plan', 'yearLabel', 'email', 'permissions'];
  for (const member of seed.data.cealMembers || []) {
    const existing = db.data.cealMembers.find(current => current.id === member.id);
    if (!existing) {
      db.data.cealMembers.push({ ...member });
    } else {
      for (const key of memberSeedKeys) {
        if (key in member) existing[key] = Array.isArray(member[key]) ? [...member[key]] : member[key];
      }
      existing.passwordSet = Boolean(existing.passwordHash || member.passwordSet);
    }
  }
  db.data.users ||= seed.data.users || {};
  db.data.sessions ||= [];
  db.data.aiUsage ||= {};
  db.data.aiDrafts ||= [];
  db.data.integrations ||= {};
  db.data.integrations.googleCalendar ||= {
    account: calendarAccount,
    calendarId,
    connected: false,
    tokens: null,
    updatedAt: null
  };
  if (asText(db.data.integrations.googleCalendar.account).toLowerCase() === legacyCalendarAccount && calendarAccount !== legacyCalendarAccount) {
    db.data.integrations.googleCalendar.account = calendarAccount;
    db.data.integrations.googleCalendar.connected = false;
    db.data.integrations.googleCalendar.tokens = null;
    db.data.integrations.googleCalendar.updatedAt = new Date().toISOString();
  }
  if ((db.data.cealMembers || []).length) db.data.users.ceal = publicMember(db.data.cealMembers[0]);
  db.data.saved ||= seed.data.saved || { resources: [], courses: [], reminders: [] };
  db.data.saved.resources ||= [];
  db.data.saved.courses ||= [];
  db.data.saved.reminders ||= [];
  for (const key of ['communications', 'cases', 'resources', 'events', 'agreements', 'tutoring', 'procedures', 'faqs', 'notifications', 'surveys', 'appointments', 'staffProfiles']) {
    db.data[key] ||= seed.data[key] || [];
  }
  const staffSeedKeys = ['name', 'displayName', 'contactName', 'role', 'email', 'authorizedEmails', 'calendarUrl', 'bookingUrl', 'status', 'description', 'officeHours', 'notes'];
  for (const profile of seed.data.staffProfiles || []) {
    const existing = db.data.staffProfiles.find(current => current.id === profile.id);
    if (!existing) {
      db.data.staffProfiles.push({ ...profile });
    } else {
      for (const key of staffSeedKeys) {
        if (key in profile) existing[key] = Array.isArray(profile[key]) ? [...profile[key]] : profile[key];
      }
    }
  }
  const seedResources = Array.isArray(seed.data.resources) ? seed.data.resources : [];
  const resources = Array.isArray(db.data.resources) ? db.data.resources : [];
  const hasDriveSeed = seedResources.some(resource => resource.source === 'drive');
  const resourceById = new Map(resources.map(resource => [resource.id, resource]));
  for (const seedResource of seedResources) {
    const existing = resourceById.get(seedResource.id);
    if (!existing) {
      resources.push({ ...seedResource });
    } else if (seedResource.source === 'drive') {
      Object.assign(existing, seedResource);
    }
  }
  const driveIds = new Set(seedResources.filter(resource => resource.source === 'drive').map(resource => resource.id));
  if (hasDriveSeed) db.data.saved.resources = db.data.saved.resources.filter(id => driveIds.has(id));
  const officialCourses = buildOfficialCourseLookup(seed.curricula);
  db.data.resources = [
    ...resources.filter(resource => driveIds.has(resource.id)),
    ...resources.filter(resource => (
      !driveIds.has(resource.id)
      && !(hasDriveSeed && String(resource.id || '').startsWith('drive-'))
      && !(hasDriveSeed && /^mat-\d{3}$/.test(resource.id || ''))
      && isOfficialCourseResource(resource, officialCourses)
    ))
  ].map(resource => canonicalizeResourceCourse(resource, officialCourses));
  db.data.resources = db.data.resources.filter(resource => !/demo|prueba funcional/i.test([resource.title, resource.origin, resource.description, resource.size].join(' ')));
  db.data.cases = db.data.cases.filter(item => !/demo|prueba avanzada/i.test([item.title, item.summary].join(' ')));
  db.data.notifications = (db.data.notifications || []).map(item => ({
    ...item,
    route: item.route === '/contingencia' ? '/comunicados' : item.route
  }));
  return db;
}

function tx(value) {
  const text = String(value ?? '');
  if (!/[\u00c3\u00c2]|\u00ef\u00bf\u00bd/.test(text)) return text;
  try { return decodeURIComponent(escape(text)); } catch { return text; }
}

function plain(value) {
  return tx(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function titleCase(value = '') {
  const keepUpper = new Set(['UCN', 'CEIC', 'CEAL', 'PPT', 'PDF', 'APR', 'NCH', 'RIDAA', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']);
  const lowerWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'a', 'en', 'por', 'para', 'con', 'sin']);
  return tx(value)
    .toLocaleLowerCase('es-CL')
    .split(/(\s+|\/|-)/)
    .map((part, index) => {
      if (!part.trim() || part === '/' || part === '-') return part;
      const upper = part.toLocaleUpperCase('es-CL');
      if (keepUpper.has(upper)) return upper === 'NCH' ? 'NCh' : upper;
      if (index > 0 && lowerWords.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase('es-CL') + part.slice(1);
    })
    .join('');
}

function buildOfficialCourseLookup(curricula = {}) {
  const byCode = new Map();
  const byName = new Map();
  for (const [plan, data] of Object.entries(curricula || {})) {
    for (const course of data.subjects || []) {
      const record = { plan, course };
      for (const code of [course.code, course.visibleCode].filter(Boolean)) byCode.set(code, record);
      byName.set(plain(course.name), record);
    }
  }
  return { byCode, byName };
}

function officialCourseForResource(resource, lookup) {
  return lookup.byCode.get(asText(resource?.courseCode)) || lookup.byName.get(plain(resource?.courseName)) || null;
}

function isOfficialCourseResource(resource, lookup) {
  return Boolean(officialCourseForResource(resource, lookup));
}

function canonicalizeResourceCourse(resource, lookup) {
  const match = officialCourseForResource(resource, lookup);
  if (!match) return resource;
  const { plan, course } = match;
  return {
    ...resource,
    courseCode: course.visibleCode || course.code,
    plan: resource.plan && lookup.byCode.has(resource.courseCode) ? resource.plan : plan,
    courseName: titleCase(course.name),
    semester: course.semester || resource.semester
  };
}

async function writeDb(next) {
  next.meta = {
    ...(next.meta || {}),
    version: next.meta?.version || 1,
    updatedAt: new Date().toISOString()
  };
  if (useSupabaseState) {
    await writeDbToSupabase(next);
    return;
  }
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(next, null, 2), 'utf8');
}

function sendJson(res, status, body) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'vary': 'Origin'
  };
  if (res._corsOrigin) headers['access-control-allow-origin'] = res._corsOrigin;
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function sendBinary(res, status, body, headers = {}) {
  res.writeHead(status, {
    'cache-control': 'no-store',
    ...headers
  });
  res.end(body);
}

function sendError(res, status, message, details) {
  sendJson(res, status, { ok: false, error: message, details });
}

function sendRedirect(res, location) {
  res.writeHead(302, {
    location,
    'cache-control': 'no-store'
  });
  res.end();
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_500_000) throw Object.assign(new Error('payload too large'), { statusCode: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('invalid json'), { statusCode: 400 });
  }
}

function asText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function requireFields(input, fields) {
  const missing = fields.filter(field => !asText(input[field]));
  if (missing.length) {
    const err = new Error('missing required fields');
    err.statusCode = 422;
    err.details = missing;
    throw err;
  }
}

function publicMember(member = {}) {
  const { passwordHash, passwordSalt, rut, ppa, ...safe } = member;
  return { ...safe, accessMode: 'ceal', passwordSet: Boolean(member.passwordHash || member.passwordSet) };
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('hex');
}

function findMember(db, memberId) {
  return (db.data.cealMembers || []).find(member => member.id === memberId || member.username === memberId || member.email === memberId);
}

function findMemberByEmail(db, email) {
  const normalized = asText(email).toLowerCase();
  return (db.data.cealMembers || []).find(member => asText(member.email).toLowerCase() === normalized);
}

function findStaffProfileByEmail(db, email) {
  const normalized = asText(email).toLowerCase();
  return (db.data.staffProfiles || []).find(profile => (
    asText(profile.email).toLowerCase() === normalized
    || (profile.authorizedEmails || []).map(item => asText(item).toLowerCase()).includes(normalized)
  ));
}

function markMemberGoogleLogin(member, payload) {
  const now = new Date().toISOString();
  member.googleSub ||= payload.sub;
  member.picture = payload.picture || member.picture || '';
  member.firstLoginAt ||= now;
  member.lastLoginAt = now;
  member.loginCount = Number(member.loginCount || 0) + 1;
  member.onboarded = true;
  return member;
}

function memberGoogleUser(member, payload) {
  return {
    ...publicMember(member),
    authProvider: 'google',
    googleSub: payload.sub,
    picture: payload.picture || member.picture || ''
  };
}

function staffProfileGoogleUser(profile, payload) {
  const name = asText(profile.displayName || profile.name, 'Jefatura de carrera');
  return {
    id: asText(profile.id, `jefatura:${payload.sub}`),
    name,
    initials: initialsFromName(name, 'JC'),
    role: 'jefatura',
    accessMode: 'jefatura',
    label: 'Jefatura de carrera',
    plan: 'planP',
    yearLabel: 'Perfil institucional',
    email: asText(profile.email || payload.email).toLowerCase(),
    picture: payload.picture || profile.picture || '',
    authProvider: 'google',
    googleSub: payload.sub,
    permissions: ['manage:office-hours', 'edit:calendario']
  };
}

function initialsFromName(name, fallback = 'UC') {
  const parts = asText(name, fallback).split(/\s+/).filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.slice(0, 2) || fallback).toUpperCase();
}

function studentFromGoogle(payload) {
  const email = asText(payload.email).toLowerCase();
  const name = asText(payload.name) || email.split('@')[0].split(/[._-]+/).filter(Boolean).map(part => part[0]?.toUpperCase() + part.slice(1)).join(' ') || 'Estudiante UCN';
  return {
    id: `google:${payload.sub}`,
    name,
    initials: initialsFromName(name, 'EU'),
    role: 'student',
    accessMode: 'student',
    label: 'Estudiante',
    plan: 'planP',
    yearLabel: 'Cuenta UCN',
    email,
    picture: payload.picture || '',
    authProvider: 'google',
    googleSub: payload.sub,
    permissions: []
  };
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function createSession(db, user) {
  db.data.sessions ||= [];
  const now = new Date();
  const token = crypto.randomBytes(32).toString('base64url');
  const session = {
    tokenHash: tokenHash(token),
    userId: user.id || '',
    email: asText(user.email).toLowerCase(),
    role: asText(user.role, 'student'),
    accessMode: asText(user.accessMode, user.role || 'student'),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString()
  };
  db.data.sessions = db.data.sessions
    .filter(item => new Date(item.expiresAt).getTime() > now.getTime())
    .slice(-80);
  db.data.sessions.push(session);
  return token;
}

function withSessionToken(db, user) {
  return { ...user, sessionToken: createSession(db, user) };
}

function sessionFromRequest(req, db) {
  const header = asText(req.headers.authorization || req.headers.Authorization || '');
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!token) return null;
  const now = Date.now();
  const hash = tokenHash(token);
  return (db.data.sessions || []).find(session => (
    session.tokenHash === hash
    && new Date(session.expiresAt).getTime() > now
  )) || null;
}

function requireCealSession(req, db) {
  const session = sessionFromRequest(req, db);
  if (!session || session.role !== 'ceal' || session.accessMode !== 'ceal') {
    const err = new Error('ceal session required');
    err.statusCode = 401;
    throw err;
  }
  const member = findMemberByEmail(db, session.email);
  if (!member) {
    const err = new Error('google account is not registered as CEAL');
    err.statusCode = 403;
    throw err;
  }
  return member;
}

function requirePortalSession(req, db) {
  const session = sessionFromRequest(req, db);
  if (!session) {
    const err = new Error('portal session required');
    err.statusCode = 401;
    throw err;
  }
  return session;
}

function requireStaffSession(req, db) {
  const session = requirePortalSession(req, db);
  if (session.role !== 'jefatura' || session.accessMode !== 'jefatura') {
    const err = new Error('jefatura session required');
    err.statusCode = 403;
    throw err;
  }
  const profile = findStaffProfileByEmail(db, session.email);
  if (!profile) {
    const err = new Error('google account is not registered as Jefatura de carrera');
    err.statusCode = 403;
    throw err;
  }
  return { session, profile };
}

async function verifyGoogleCredential(credential) {
  if (!googleClientId) {
    const err = new Error('google client id not configured');
    err.statusCode = 503;
    throw err;
  }
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: credential,
    audience: googleClientId
  });
  const payload = ticket.getPayload();
  const email = asText(payload?.email).toLowerCase();
  if (!payload?.sub || !email) {
    const err = new Error('invalid google identity');
    err.statusCode = 401;
    throw err;
  }
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    const err = new Error('google email is not verified');
    err.statusCode = 403;
    throw err;
  }
  return payload;
}

function requireGoogleDomain(payload, domain = googleDomain) {
  const email = asText(payload?.email).toLowerCase();
  const hostedDomain = asText(payload?.hd).toLowerCase();
  if (hostedDomain !== domain || !email.endsWith(`@${domain}`)) {
    const err = new Error(`only ${domain} accounts are allowed`);
    err.statusCode = 403;
    throw err;
  }
}

function requestOrigin(req) {
  const forwardedProto = asText(req.headers['x-forwarded-proto']).split(',')[0];
  const proto = forwardedProto || (req.socket?.encrypted ? 'https' : 'http');
  return `${proto}://${req.headers.host || `localhost:${port}`}`;
}

function portalReturnUrl(req, status = '') {
  const base = publicPortalUrl || requestOrigin(req);
  const suffix = status ? `?calendar=${encodeURIComponent(status)}` : '';
  return `${base}/#/jefatura${suffix}`;
}

function calendarOAuthRedirectUri(req) {
  return calendarRedirectUri || `${requestOrigin(req)}/api/calendar/oauth/callback`;
}

function calendarConfigured() {
  return Boolean(calendarClientId && calendarClientSecret);
}

function googleCalendarIntegration(db) {
  db.data.integrations ||= {};
  db.data.integrations.googleCalendar ||= {};
  const integration = db.data.integrations.googleCalendar;
  integration.account ||= calendarAccount;
  integration.calendarId ||= calendarId;
  integration.connected = Boolean(integration.tokens?.refresh_token);
  return integration;
}

function publicCalendarStatus(db, session = null) {
  const integration = googleCalendarIntegration(db);
  return {
    configured: calendarConfigured(),
    connected: Boolean(integration.tokens?.refresh_token),
    account: integration.account || calendarAccount,
    calendarId: integration.calendarId || calendarId,
    connectedAt: integration.connectedAt || null,
    updatedAt: integration.updatedAt || null,
    canManage: Boolean(session && session.role === 'jefatura' && session.accessMode === 'jefatura')
  };
}

function calendarOAuthClient(req) {
  return new OAuth2Client(calendarClientId, calendarClientSecret, calendarOAuthRedirectUri(req));
}

function createCalendarOAuthState(db, session) {
  const integration = googleCalendarIntegration(db);
  const state = crypto.randomBytes(24).toString('base64url');
  integration.pendingOAuth = {
    stateHash: tokenHash(state),
    requestedBy: session.email,
    createdAt: new Date().toISOString()
  };
  integration.updatedAt = new Date().toISOString();
  return state;
}

function consumeCalendarOAuthState(db, state) {
  const integration = googleCalendarIntegration(db);
  const pending = integration.pendingOAuth;
  const createdAt = pending?.createdAt ? new Date(pending.createdAt).getTime() : 0;
  const expired = !createdAt || Date.now() - createdAt > 1000 * 60 * 15;
  if (!pending?.stateHash || pending.stateHash !== tokenHash(state) || expired) {
    const err = new Error('calendar oauth state expired or invalid');
    err.statusCode = 401;
    throw err;
  }
  delete integration.pendingOAuth;
  return pending;
}

async function calendarAuthorizedEmail(client) {
  const response = await client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
  return asText(response.data?.email).toLowerCase();
}

async function connectGoogleCalendar(req, db, code, state) {
  consumeCalendarOAuthState(db, state);
  if (!calendarConfigured()) {
    const err = new Error('google calendar oauth is not configured');
    err.statusCode = 503;
    throw err;
  }
  const integration = googleCalendarIntegration(db);
  const client = calendarOAuthClient(req);
  const tokenResponse = await client.getToken(code);
  const tokens = tokenResponse.tokens || {};
  const mergedTokens = {
    ...(integration.tokens || {}),
    ...tokens,
    refresh_token: tokens.refresh_token || integration.tokens?.refresh_token || ''
  };
  client.setCredentials(mergedTokens);
  const authorizedEmail = await calendarAuthorizedEmail(client);
  if (authorizedEmail !== calendarAccount) {
    const err = new Error(`calendar account must be ${calendarAccount}`);
    err.statusCode = 403;
    throw err;
  }
  integration.account = authorizedEmail;
  integration.calendarId = calendarId;
  integration.tokens = mergedTokens;
  integration.connected = Boolean(mergedTokens.refresh_token);
  integration.connectedAt ||= new Date().toISOString();
  integration.updatedAt = new Date().toISOString();
  await writeDb(db);
  return publicCalendarStatus(db);
}

async function calendarApiRequest(req, db, request) {
  const integration = googleCalendarIntegration(db);
  if (!integration.tokens?.refresh_token) {
    const err = new Error('google calendar is not connected');
    err.statusCode = 409;
    throw err;
  }
  const client = calendarOAuthClient(req);
  client.setCredentials(integration.tokens);
  const response = await client.request(request);
  integration.tokens = {
    ...integration.tokens,
    ...(client.credentials || {}),
    refresh_token: client.credentials?.refresh_token || integration.tokens.refresh_token
  };
  integration.updatedAt = new Date().toISOString();
  await writeDb(db);
  return response.data;
}

function validateCalendarDateTime(value, field) {
  const raw = asText(value);
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) {
    const err = new Error(`${field} must be a valid ISO date`);
    err.statusCode = 422;
    throw err;
  }
  return date;
}

function calendarEventPayload(body, session) {
  const startDate = validateCalendarDateTime(body.start, 'start');
  const endDate = validateCalendarDateTime(body.end, 'end');
  if (endDate.getTime() <= startDate.getTime()) {
    const err = new Error('end must be after start');
    err.statusCode = 422;
    throw err;
  }
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
  if (durationMinutes > 120) {
    const err = new Error('appointments cannot exceed 120 minutes');
    err.statusCode = 422;
    throw err;
  }
  const requester = asText(body.name, session.email.split('@')[0]);
  const reason = asText(body.reason, 'Solicitud de hora de atención').slice(0, 1200);
  return {
    summary: `Atención Jefatura - ${requester}`,
    description: `Solicitud creada desde Portal CEIC UCN.\n\nSolicitante: ${requester}\nCorreo: ${session.email}\nMotivo: ${reason}`,
    start: { dateTime: startDate.toISOString(), timeZone: 'America/Santiago' },
    end: { dateTime: endDate.toISOString(), timeZone: 'America/Santiago' },
    attendees: [{ email: session.email }],
    reminders: { useDefault: true },
    extendedProperties: {
      private: {
        portal: 'ceic-ucn',
        requesterEmail: session.email,
        requesterRole: session.role
      }
    }
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function assertAiQuota(db) {
  db.data.aiUsage ||= {};
  const key = todayKey();
  const usage = db.data.aiUsage[key] || { count: 0 };
  if (Number.isFinite(geminiDailySoftLimit) && geminiDailySoftLimit > 0 && usage.count >= geminiDailySoftLimit) {
    const err = new Error(`daily ai soft limit reached (${geminiDailySoftLimit})`);
    err.statusCode = 429;
    throw err;
  }
  return usage;
}

function markAiUsage(db) {
  db.data.aiUsage ||= {};
  const key = todayKey();
  const usage = db.data.aiUsage[key] || { count: 0 };
  usage.count = Number(usage.count || 0) + 1;
  usage.lastUsedAt = new Date().toISOString();
  usage.model = geminiModel;
  db.data.aiUsage[key] = usage;
  return usage;
}

function recentCommunicationContext(db) {
  return (db.data.communications || [])
    .slice(0, 8)
    .map(item => `- ${item.title} (${item.category}, ${String(item.date || '').slice(0, 10)}): ${item.summary}`)
    .join('\n');
}

function buildCealAssistantPrompt(db, body, member) {
  const recent = recentCommunicationContext(db) || '- Sin comunicados recientes cargados.';
  return `Eres el Asistente CEAL del Portal CEIC UCN para Ingenieria Civil UCN.

Tu funcion es transformar texto crudo entregado por integrantes CEAL en borradores publicables del portal.
Contexto del portal:
- Audiencia principal: estudiantes de Ingenieria Civil UCN.
- Secciones actuales: Comunicados, Calendario, Encuestas, Mallas y Material.
- Tono: institucional, claro, directo, cercano, sobrio, sin emojis y sin exageraciones.
- Fecha actual: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}.
- Integrante solicitante: ${member.name || member.email} (${member.roleName || member.label || 'CEAL'}).
- Comunicados recientes para evitar duplicados:
${recent}

Reglas:
- No inventes horarios, salas, responsables, links ni acuerdos si no aparecen en el texto.
- SIEMPRE entrega un draft listo para publicar a partir del texto entregado. NUNCA hagas preguntas ni pidas aclaraciones: needsClarification debe ser siempre false y questions vacio.
- Si falta algun dato, redacta el comunicado solo con lo que hay, sin inventar ni dejar huecos evidentes.
- El cuerpo debe quedar en texto plano con parrafos separados por salto de linea, no Markdown decorativo.
- Si hay datos personales, acusaciones, informacion sensible o lenguaje riesgoso, agregalo en safetyFlags.
- Si parece una fecha de calendario mas que comunicado, igual genera comunicado, pero sugiere category="Académico" o "CEAL" segun corresponda.

Calidad del borrador (importante):
- El cuerpo debe ser un comunicado completo y bien redactado: contexto breve, informacion clave y, si corresponde, proximos pasos o a quien contactar. Claro y conciso, sin relleno ni frases vacias.
- El resumen debe ser UNA sola frase informativa y especifica (que ocurre + cuando/quien si aplica), no generica.
- El titulo debe ser especifico y descriptivo del tema, bien redactado.

Entrada del CEAL:
${JSON.stringify({
    intent: body.intent || 'comunicado',
    rawText: body.rawText,
    categoryHint: body.category || 'Auto',
    audience: body.audience || 'Estudiantes de Ingenieria Civil UCN',
    urgency: body.urgency || 'normal',
    extraContext: body.extraContext || ''
  }, null, 2)}

Responde solamente JSON valido con esta forma:
{
  "needsClarification": boolean,
  "questions": ["pregunta concreta"],
  "draft": {
    "title": "titulo corto",
    "category": "Académico|Contingencia|Material|CEAL",
    "summary": "resumen de una linea",
    "body": "contenido completo",
    "audience": "audiencia",
    "priority": "normal|alta",
    "suggestedPublishTiming": "ahora|programar|revisar"
  },
  "editorNotes": ["nota para CEAL"],
  "safetyFlags": ["riesgo o dato sensible"]
}`;
}

function parseGeminiJson(text) {
  const raw = asText(text);
  try {
    return JSON.parse(raw);
  } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('gemini response was not json');
  return JSON.parse(match[0]);
}

function normalizeAssistantResult(result) {
  const draft = result?.draft && typeof result.draft === 'object' ? result.draft : null;
  return {
    // El asistente nunca pide aclaraciones: siempre entrega un borrador publicable.
    needsClarification: false,
    questions: [],
    draft: draft ? {
      title: asText(draft.title).slice(0, 120),
      category: ['Académico', 'Contingencia', 'Material', 'CEAL'].includes(asText(draft.category)) ? asText(draft.category) : 'CEAL',
      summary: asText(draft.summary).slice(0, 220),
      body: asText(draft.body),
      audience: asText(draft.audience, 'Estudiantes de Ingeniería Civil UCN'),
      priority: asText(draft.priority, 'normal') === 'alta' ? 'alta' : 'normal',
      suggestedPublishTiming: asText(draft.suggestedPublishTiming, 'revisar')
    } : null,
    editorNotes: Array.isArray(result?.editorNotes) ? result.editorNotes.map(asText).filter(Boolean).slice(0, 5) : [],
    safetyFlags: Array.isArray(result?.safetyFlags) ? result.safetyFlags.map(asText).filter(Boolean).slice(0, 5) : []
  };
}

async function geminiGenerateJson(promptText, temperature) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
  const reqBody = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: { temperature, topP: 0.9, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }
  });
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: reqBody });
    if (response.ok || (response.status !== 429 && response.status !== 503)) break;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const raw = payload?.error?.message || `gemini api ${response.status}`;
    const friendly = (response.status === 429 || response.status === 503 || /credit|quota|billing|depleted|demand|exhausted|overload/i.test(raw))
      ? 'El asistente de IA está con mucha demanda en este momento. Espera unos segundos y vuelve a intentar.'
      : 'El asistente de IA no pudo generar el contenido. Intenta nuevamente.';
    const err = new Error(friendly);
    err.statusCode = response.status;
    throw err;
  }
  return payload;
}

async function generateCommunicationsDigest(db) {
  try {
    if (!geminiApiKey || geminiApiKey.includes('pega_aqui')) return false;
    const items = (db.data.communications || []).slice(0, 5);
    if (!items.length) return false;
    const list = items.map(c => `- ${asText(c.title)} (${asText(c.category)}): ${asText(c.summary)}`).join('\n');
    const prompt = `Eres el Asistente CEAL del Portal CEIC UCN. Resume en 1 o 2 frases breves, claras y neutrales lo mas importante de estos comunicados recientes, para mostrarlo en la portada a estudiantes de Ingenieria Civil UCN. No inventes datos ni agregues opiniones. Devuelve SOLO JSON {"resumen":"..."}.

Comunicados recientes:
${list}`;
    const payload = await geminiGenerateJson(prompt, 0.3);
    const text = (payload.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n');
    const parsed = parseGeminiJson(text);
    const resumen = asText(parsed?.resumen).slice(0, 400);
    if (!resumen) return false;
    db.data.aiCommunicationsDigest = { text: resumen, generatedAt: new Date().toISOString(), count: items.length };
    return true;
  } catch {
    return false;
  }
}

async function generateCealDraft(db, body, member) {
  if (!geminiApiKey || geminiApiKey.includes('pega_aqui')) {
    const err = new Error('El asistente de IA no está configurado en el servidor. Avisa a CEAL.');
    err.statusCode = 503;
    throw err;
  }
  const rawText = asText(body.rawText);
  if (rawText.length < 20) {
    const err = new Error('raw text is too short');
    err.statusCode = 422;
    throw err;
  }
  if (rawText.length > 12000) {
    const err = new Error('raw text is too long');
    err.statusCode = 413;
    throw err;
  }
  assertAiQuota(db);
  const prompt = buildCealAssistantPrompt(db, body, member);
  const payload = await geminiGenerateJson(prompt, 0.25);
  markAiUsage(db);
  const text = (payload.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n');
  return normalizeAssistantResult(parseGeminiJson(text));
}

function buildSurveyAssistantPrompt(body, member) {
  return `Eres el Asistente CEAL del Portal CEIC UCN.

Transforma una instrucción en lenguaje natural en una encuesta o votación lista para publicar.

Contexto:
- Comunidad: estudiantes de Ingeniería Civil UCN.
- El CEAL crea encuestas de opinión, formularios de levantamiento, votaciones de paro/toma/listas y consultas rápidas.
- Las votaciones son secretas por defecto.
- Usa tono neutral, institucional y descriptivo. No uses lenguaje de campaña, presión, burla ni inclinación por una opción.
- Para votaciones sobre paro, toma o continuidad de movilización, separa siempre:
  1) preferencia principal (por ejemplo: Sí, No, Me abstengo);
  2) disposición posterior frente a la decisión mayoritaria (por ejemplo: Sí, No, Depende de las condiciones);
  3) comentario opcional si aporta contexto.
- No mezcles en una misma opción "No" con "me sumo a la mayoría"; eso contamina la interpretación. Debe ir como pregunta separada.
- No inventes candidatos, listas, horarios ni opciones si no aparecen en la instruccion.
- Si faltan datos críticos, marca needsClarification=true y pregunta máximo 3 cosas.
- Fecha actual: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}.
- Solicitante: ${member.name || member.email}.

Reglas de calidad de las preguntas (MUY IMPORTANTE):
- Cada opción debe RESPONDER directamente la pregunta. Nunca uses "Sí"/"No" como opciones, salvo que la pregunta sea literalmente de sí/no.
- En preguntas de selección (single/multiple) genera entre 3 y 6 opciones CONCRETAS y relevantes al tema. Ej: para "¿Qué comida prefieres para el asado?" las opciones deben ser tipos de comida ("Carne/parrilla", "Pollo", "Vegetariano/vegano", "Completos", "Otro"), NUNCA "Sí/No".
- Usa type "text" para respuestas abiertas (restricciones alimentarias, comentarios, sugerencias, montos, fechas libres).
- Usa type "rating" solo para valorar del 1 al 5.
- Incluye una opción "Otro" cuando aporte; las opciones deben ser distintas entre sí y cubrir las alternativas razonables.
- El título debe ser claro, específico y bien redactado para el tema (ej: "Comida para el asado del CEAL"), sin palabras sueltas raras ni inventadas.
- Genera solo las preguntas necesarias (entre 2 y 5), sin relleno.
- Si "encuestaActual" NO es null, el usuario quiere MODIFICAR esa encuesta existente: interpreta "rawText" como la instruccion de ajuste (agregar/quitar/editar preguntas u opciones, cambiar tipo, etc.) y devuelve la encuesta COMPLETA ya modificada, conservando todo lo que no se pidio cambiar.

Entrada:
${JSON.stringify({
    rawText: body.rawText,
    requestedMode: body.mode || 'auto',
    audience: 'Estudiantes de Ingeniería Civil UCN',
    encuestaActual: body.currentSurvey || null
  }, null, 2)}

Responde solamente JSON valido con esta forma:
{
  "needsClarification": boolean,
  "questions": ["pregunta concreta"],
  "survey": {
    "title": "título corto",
    "description": "descripción breve para estudiantes",
    "mode": "encuesta|votacion",
    "audience": "Estudiantes de Ingeniería Civil UCN",
    "secret": boolean,
    "allowMultipleResponses": false,
    "status": "draft",
    "questions": [
      {
        "label": "pregunta",
        "type": "single|multiple|text|rating",
        "required": true,
        "options": ["Carne / parrilla", "Pollo", "Vegetariano / vegano", "Otro"]
      }
    ]
  },
  "editorNotes": ["nota para CEAL"],
  "safetyFlags": ["riesgo o dato sensible"]
}`;
}

function normalizeSurveyQuestions(questions = []) {
  const allowedTypes = new Set(['single', 'multiple', 'text', 'rating']);
  return (Array.isArray(questions) ? questions : [])
    .map((question, index) => {
      const type = allowedTypes.has(asText(question.type)) ? asText(question.type) : 'single';
      let options = Array.isArray(question.options) ? question.options.map(asText).filter(Boolean).slice(0, 12) : [];
      if (type === 'rating' && !options.length) options = ['1', '2', '3', '4', '5'];
      if (['single', 'multiple'].includes(type) && options.length < 2) options = ['Sí', 'No'];
      if (type === 'text') options = [];
      return {
        id: asText(question.id, `q${index + 1}`),
        label: asText(question.label || question.title || question.question, `Pregunta ${index + 1}`).slice(0, 220),
        type,
        required: question.required !== false,
        options
      };
    })
    .filter(question => question.label)
    .slice(0, 16);
}

function normalizeSurveyDraft(result, body = {}) {
  const survey = result?.survey && typeof result.survey === 'object' ? result.survey : {};
  const raw = `${body.rawText || ''} ${survey.title || ''}`.toLowerCase();
  const inferredVote = /votaci[oó]n|votar|voto|paro|toma|lista|candidato|postulante/i.test(raw);
  const mode = asText(survey.mode, inferredVote ? 'votacion' : 'encuesta') === 'votacion' ? 'votacion' : 'encuesta';
  const questions = normalizeSurveyQuestions(survey.questions);
  return {
    needsClarification: Boolean(result?.needsClarification) || !questions.length,
    questions: Array.isArray(result?.questions) ? result.questions.map(asText).filter(Boolean).slice(0, 3) : [],
    survey: {
      title: asText(survey.title, mode === 'votacion' ? 'Votación CEAL' : 'Encuesta CEAL').slice(0, 120),
      description: asText(survey.description, 'Consulta dirigida a estudiantes de Ingeniería Civil UCN.').slice(0, 500),
      mode,
      audience: 'Estudiantes de Ingeniería Civil UCN',
      secret: survey.secret !== false || mode === 'votacion',
      allowMultipleResponses: false,
      status: 'draft',
      questions
    },
    editorNotes: Array.isArray(result?.editorNotes) ? result.editorNotes.map(asText).filter(Boolean).slice(0, 5) : [],
    safetyFlags: Array.isArray(result?.safetyFlags) ? result.safetyFlags.map(asText).filter(Boolean).slice(0, 5) : []
  };
}

async function generateSurveyDraft(db, body, member) {
  if (!geminiApiKey || geminiApiKey.includes('pega_aqui')) {
    const err = new Error('El asistente de IA no está configurado en el servidor. Avisa a CEAL.');
    err.statusCode = 503;
    throw err;
  }
  const rawText = asText(body.rawText);
  if (rawText.length < 15) {
    const err = new Error('raw text is too short');
    err.statusCode = 422;
    throw err;
  }
  if (rawText.length > 8000) {
    const err = new Error('raw text is too long');
    err.statusCode = 413;
    throw err;
  }
  assertAiQuota(db);
  const payload = await geminiGenerateJson(buildSurveyAssistantPrompt(body, member), 0.2);
  markAiUsage(db);
  const text = (payload.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n');
  return normalizeSurveyDraft(parseGeminiJson(text), body);
}

function publicSurvey(survey = {}) {
  const { responses, ...safe } = survey;
  return {
    ...safe,
    responseCount: Array.isArray(responses) ? responses.length : Number(survey.responseCount || 0)
  };
}

function publicIntegrationData(data = {}) {
  const googleCalendar = data.integrations?.googleCalendar || {};
  return {
    googleCalendar: {
      configured: calendarConfigured(),
      connected: Boolean(googleCalendar.tokens?.refresh_token),
      account: googleCalendar.account || calendarAccount,
      calendarId: googleCalendar.calendarId || calendarId,
      connectedAt: googleCalendar.connectedAt || null,
      updatedAt: googleCalendar.updatedAt || null
    }
  };
}

function publicData(data = {}) {
  const { sessions, aiUsage, aiDrafts, integrations, ...safe } = data;
  return {
    ...safe,
    integrations: publicIntegrationData(data),
    surveys: Array.isArray(data.surveys) ? data.surveys.map(publicSurvey) : []
  };
}

function surveyVoterHash(surveyId, session) {
  const secret = process.env.PORTAL_VOTE_SALT || geminiApiKey || googleClientId || 'portal-ceic-local';
  return crypto.createHmac('sha256', secret)
    .update(`${surveyId}:${asText(session.email).toLowerCase()}`)
    .digest('hex');
}

function normalizeSurveyAnswers(survey, body) {
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const normalized = {};
  for (const question of survey.questions || []) {
    const raw = answers[question.id];
    if (question.required && (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && !raw.length))) {
      const err = new Error(`missing answer: ${question.label}`);
      err.statusCode = 422;
      throw err;
    }
    if (raw === undefined || raw === null) continue;
    if (question.type === 'multiple') {
      const values = Array.isArray(raw) ? raw.map(asText).filter(Boolean) : [asText(raw)].filter(Boolean);
      normalized[question.id] = values.filter(value => !question.options.length || question.options.includes(value)).slice(0, 12);
    } else {
      const value = asText(raw).slice(0, 2000);
      if (['single', 'rating'].includes(question.type) && question.options.length && !question.options.includes(value)) {
        const err = new Error(`invalid answer: ${question.label}`);
        err.statusCode = 422;
        throw err;
      }
      normalized[question.id] = value;
    }
  }
  return normalized;
}

function xmlEscape(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function excelColumn(index) {
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function sheetXml(rows) {
  const sheetData = rows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => {
      const ref = `${excelColumn(colIndex)}${rowIndex + 1}`;
      if (typeof value === 'number') return `<c r="${ref}"><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
}

function workbookXlsxBuffer(sheets) {
  const entries = {};
  entries['[Content_Types].xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  entries['_rels/.rels'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  entries['xl/workbook.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, i) => `<sheet name="${xmlEscape(sheet.name).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`);
  entries['xl/_rels/workbook.xml.rels'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`);
  sheets.forEach((sheet, i) => {
    entries[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(sheet.rows));
  });
  return Buffer.from(zipSync(entries));
}

function surveyExportBuffer(survey) {
  const questions = survey.questions || [];
  const header = ['Fecha', 'ID respuesta', ...questions.map(question => question.label)];
  const rows = (survey.responses || []).map(response => [
    response.submittedAt,
    response.id,
    ...questions.map(question => {
      const value = response.answers?.[question.id];
      return Array.isArray(value) ? value.join('; ') : value ?? '';
    })
  ]);
  return workbookXlsxBuffer([
    { name: 'Respuestas', rows: [header, ...rows] },
    { name: 'Resumen', rows: [
      ['Título', survey.title],
      ['Tipo', survey.mode === 'votacion' ? 'Votación' : 'Encuesta'],
      ['Audiencia', survey.audience],
      ['Secreta', survey.secret ? 'Sí' : 'No'],
      ['Estado', survey.status],
      ['Respuestas', survey.responses?.length || 0],
      ['Exportado', new Date().toISOString()]
    ] }
  ]);
}

function nextNumericId(items, prefix) {
  const used = items
    .map(item => String(item.id || '').replace(prefix, ''))
    .map(Number)
    .filter(Number.isFinite);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function nextCase(db) {
  const year = new Date().getFullYear();
  const used = db.data.cases
    .map(item => String(item.number || '').match(/#\d{4}-(\d+)/)?.[1])
    .map(Number)
    .filter(Number.isFinite);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  const suffix = String(next).padStart(4, '0');
  return {
    id: `case-${year}-${suffix}`,
    number: `#${year}-${suffix}`
  };
}

function patchItem(items, id, patch) {
  const item = items.find(entry => entry.id === id);
  if (!item) return null;
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  return item;
}

function resolveLegacyItem(collectionName, collection, id) {
  const direct = collection.find(entry => entry.id === id);
  if (direct) return direct;
  if (collectionName === 'communications' && id === 'com-001') {
    return collection.find(entry => entry.id === 'com-paro-005') || collection[0] || null;
  }
  if (collectionName === 'agreements' && id === 'agr-003') {
    return collection.find(entry => entry.id === 'agr-paro-003') || collection[0] || null;
  }
  if (collectionName === 'resources' && /^mat-\d{3}$/.test(id || '')) {
    return collection.find(entry => entry.status === 'pendienteRevision') || collection[0] || null;
  }
  return null;
}

function countDb(db) {
  const data = db.data;
  return {
    communications: data.communications.length,
    cases: data.cases.length,
    materials: data.resources.length,
    agreements: data.agreements.length,
    events: data.events.length,
    tutoring: data.tutoring.length,
    procedures: data.procedures.length,
    surveys: data.surveys?.length || 0,
    appointments: data.appointments?.length || 0
  };
}

// --- Envio de comunicados por correo ---
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
let recipientsCache = null;
function loadRecipients() {
  if (recipientsCache) return recipientsCache;
  const clean = (arr) => [...new Set((Array.isArray(arr) ? arr : [])
    .map(e => String(e || '').trim().toLowerCase())
    .filter(e => EMAIL_RE.test(e)))];
  const envTest = clean(String(process.env.CEAL_MAIL_TEST_RECIPIENTS || '').split(/[,\s;]+/));
  for (const file of [recipientsFile, recipientsLocalFile]) {
    try {
      if (file && existsSync(file)) {
        const data = JSON.parse(readFileSync(file, 'utf8'));
        recipientsCache = {
          students: clean(data.students),
          professors: clean(data.professors),
          test: [...new Set([...clean(data.test), ...envTest])]
        };
        return recipientsCache;
      }
    } catch (error) {
      console.error('[mail] no se pudo leer recipients:', file, error.message);
    }
  }
  recipientsCache = { students: [], professors: [], test: envTest };
  return recipientsCache;
}

function mailMeta() {
  const r = loadRecipients();
  return {
    configured: Boolean((mailUser && mailPass) || mailTestMode),
    counts: { students: r.students.length, professors: r.professors.length, test: r.test.length }
  };
}

let mailTransporter = null;
function getMailTransporter() {
  if (mailTestMode) return nodemailer.createTransport({ jsonTransport: true });
  if (!mailUser || !mailPass) return null;
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailPort === 465,
      auth: { user: mailUser, pass: mailPass }
    });
  }
  return mailTransporter;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += Math.max(1, size)) out.push(arr.slice(i, i + Math.max(1, size)));
  return out;
}

function communicationEmailContent(comm) {
  const url = publicPortalUrl ? `${publicPortalUrl}/#/comunicados/${encodeURIComponent(comm.id)}` : '';
  const title = asText(comm.title, 'Comunicado CEIC');
  const summary = asText(comm.summary);
  const bodyText = asText(comm.body);
  const subject = `[CEIC] ${title}`.slice(0, 180);
  const lines = [title, ''];
  if (summary) lines.push(summary, '');
  if (bodyText) lines.push(bodyText, '');
  if (url) lines.push(`Ver en el portal: ${url}`, '');
  lines.push('— CEIC Ingenieria Civil UCN', 'Este correo es informativo; no respondas a esta direccion.');
  const text = lines.join('\n');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;line-height:1.55">
    <div style="background:#0d2747;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0"><strong style="font-size:15px">CEIC · Ingeniería Civil UCN</strong></div>
    <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:20px">
      <h2 style="margin:0 0 12px;color:#0d2747;font-size:19px">${esc(title)}</h2>
      ${summary ? `<p style="margin:0 0 14px;color:#475569"><strong>${esc(summary)}</strong></p>` : ''}
      ${bodyText ? `<div style="white-space:pre-wrap;margin:0 0 16px">${esc(bodyText)}</div>` : ''}
      ${url ? `<p style="margin:18px 0 0"><a href="${esc(url)}" style="background:#126fe3;color:#fff;padding:10px 18px;border-radius:9px;text-decoration:none;font-weight:600">Ver en el portal</a></p>` : ''}
      <p style="margin:22px 0 0;color:#94a3b8;font-size:12px">Correo informativo de CEIC Ingeniería Civil UCN. No respondas a esta dirección.</p>
    </div>
  </div>`;
  return { subject, text, html };
}

async function sendCommunicationEmail(comm, groups) {
  const recipients = loadRecipients();
  const list = [];
  if (groups.test) list.push(...recipients.test);
  if (groups.students) list.push(...recipients.students);
  if (groups.professors) list.push(...recipients.professors);
  const bcc = [...new Set(list)];
  if (!bcc.length) return { sent: false, reason: 'no-recipients', count: 0 };
  const transporter = getMailTransporter();
  if (!transporter) return { sent: false, reason: 'not-configured', count: bcc.length };

  const from = mailUser || 'ceal.ingenieriacivil@ucn.cl';
  const { subject, text, html } = communicationEmailContent(comm);
  const batches = chunkArray(bcc, mailBatchSize);
  let sentCount = 0;
  const previews = [];
  console.log(`[mail] enviando comunicado "${comm.id}" a ${bcc.length} destinatarios (${batches.length} lote/s) desde ${from}`);
  for (const batch of batches) {
    try {
      const info = await transporter.sendMail({
        from: `"${mailFromName}" <${from}>`,
        to: from,
        bcc: batch,
        replyTo: from,
        subject,
        text,
        html
      });
      sentCount += batch.length;
      console.log(`[mail] lote OK (${batch.length}) messageId=${info?.messageId || '-'} accepted=${(info?.accepted || []).length} rejected=${(info?.rejected || []).length}`);
      if (mailTestMode && info?.message) {
        try { previews.push(JSON.parse(info.message.toString())); } catch {}
      }
    } catch (error) {
      console.error('[mail] ERROR al enviar lote:', error?.code || '', error?.responseCode || '', error?.message || error);
      return { sent: false, reason: 'send-failed', count: sentCount, error: asText(error?.message || error).slice(0, 300), code: asText(error?.code || error?.responseCode || '') };
    }
  }
  console.log(`[mail] envio completo: ${sentCount} destinatarios`);
  return {
    sent: true,
    count: sentCount,
    batches: batches.length,
    groups: { test: Boolean(groups.test), students: Boolean(groups.students), professors: Boolean(groups.professors) },
    ...(previews.length ? { previews } : {})
  };
}

const ALLOWED_ORIGINS = (process.env.PORTAL_ALLOWED_ORIGINS
  ? process.env.PORTAL_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : ['https://ceicucn.cl', 'https://www.ceicucn.cl', 'https://ic-ucn.github.io', 'http://localhost:8080', 'http://localhost:18080', 'http://127.0.0.1:8080']);
function resolveCorsOrigin(origin) {
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}
const rateBuckets = new Map();
function checkRateLimit(req, res) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (['::1', '127.0.0.1', '::ffff:127.0.0.1', 'localhost'].includes(ip)) return true;
  const now = Date.now();
  const windowMs = 60000;
  const max = Number(process.env.PORTAL_RATE_LIMIT || 120);
  let bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.reset) { bucket = { count: 0, reset: now + windowMs }; rateBuckets.set(ip, bucket); }
  bucket.count += 1;
  if (rateBuckets.size > 5000) { for (const [k, v] of rateBuckets) { if (now > v.reset) rateBuckets.delete(k); } }
  if (bucket.count > max) { sendError(res, 429, 'Demasiadas solicitudes. Intenta nuevamente en un momento.'); return false; }
  return true;
}

async function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'GET' && !checkRateLimit(req, res)) return;
  const db = await loadDb();
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [resource, id] = parts;

  if (!resource || resource === 'bootstrap') {
    return sendJson(res, 200, {
      ok: true,
      mode: 'backend',
      meta: db.meta,
      data: publicData(db.data),
      curricula: db.curricula,
      counts: countDb(db),
      mail: mailMeta()
    });
  }

  if (resource === 'health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'portal-ceic-backend',
      storage: useSupabaseState ? 'supabase' : 'local-json',
      dbPath: useSupabaseState ? null : dbPath,
      counts: countDb(db),
      mail: { configured: mailMeta().configured }
    });
  }

  if (resource === 'auth') {
    if (id === 'members' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, members: (db.data.cealMembers || []).map(publicMember) });
    }

    if (id === 'setup' && req.method === 'POST') {
      const body = await readBody(req);
      const member = findMember(db, asText(body.memberId));
      const password = String(body.password || '');
      if (!member) return sendError(res, 404, 'member not found');
      if (member.passwordHash) return sendError(res, 409, 'password already configured');
      if (password.length < 8) return sendError(res, 422, 'password must have at least 8 characters');
      member.passwordSalt = crypto.randomBytes(16).toString('hex');
      member.passwordHash = hashPassword(password, member.passwordSalt);
      member.passwordSet = true;
      const user = withSessionToken(db, publicMember(member));
      await writeDb(db);
      return sendJson(res, 200, { ok: true, user });
    }

    if (id === 'login' && req.method === 'POST') {
      const body = await readBody(req);
      const member = findMember(db, asText(body.memberId));
      const password = String(body.password || '');
      if (!member || !member.passwordHash || hashPassword(password, member.passwordSalt) !== member.passwordHash) {
        return sendError(res, 401, 'invalid credentials');
      }
      const user = withSessionToken(db, publicMember(member));
      await writeDb(db);
      return sendJson(res, 200, { ok: true, user });
    }

    if (id === 'google' && req.method === 'POST') {
      const body = await readBody(req);
      const role = asText(body.role, 'student');
      const credential = asText(body.credential);
      if (!credential) return sendError(res, 422, 'google credential is required');
      try {
        const payload = await verifyGoogleCredential(credential);
        if (role === 'internal') {
          const profile = findStaffProfileByEmail(db, payload.email);
          if (profile) {
            const user = withSessionToken(db, staffProfileGoogleUser(profile, payload));
            await writeDb(db);
            return sendJson(res, 200, { ok: true, user, staffRegistered: true });
          }
          const member = findMemberByEmail(db, payload.email);
          if (member) {
            markMemberGoogleLogin(member, payload);
            const user = withSessionToken(db, memberGoogleUser(member, payload));
            await writeDb(db);
            return sendJson(res, 200, { ok: true, user, cealRegistered: true });
          }
          return sendError(res, 403, 'google account is not registered as CEAL or Jefatura de carrera');
        }
        if (role === 'ceal') {
          const member = findMemberByEmail(db, payload.email);
          if (!member) return sendError(res, 403, 'google account is not registered as CEAL');
          markMemberGoogleLogin(member, payload);
          const user = withSessionToken(db, memberGoogleUser(member, payload));
          await writeDb(db);
          return sendJson(res, 200, { ok: true, user, cealRegistered: true });
        }
        if (role === 'jefatura') {
          const profile = findStaffProfileByEmail(db, payload.email);
          if (!profile) return sendError(res, 403, 'google account is not registered as Jefatura de carrera');
          const user = withSessionToken(db, staffProfileGoogleUser(profile, payload));
          await writeDb(db);
          return sendJson(res, 200, { ok: true, user, staffRegistered: true });
        }
        requireGoogleDomain(payload);
        const user = withSessionToken(db, studentFromGoogle(payload));
        await writeDb(db);
        return sendJson(res, 200, { ok: true, user, cealRegistered: false });
      } catch (error) {
        return sendError(res, error.statusCode || 401, error.message || 'invalid google credential');
      }
    }

    return sendError(res, 404, 'unknown auth action');
  }

  if (resource === 'ai') {
    if (id === 'ceal-draft' && req.method === 'POST') {
      try {
        const member = requireCealSession(req, db);
        const body = await readBody(req);
        const result = await generateCealDraft(db, body, member);
        db.data.aiDrafts ||= [];
        db.data.aiDrafts.unshift({
          id: `ai-${Date.now()}`,
          createdAt: new Date().toISOString(),
          createdBy: member.email,
          intent: asText(body.intent, 'comunicado'),
          rawText: asText(body.rawText).slice(0, 12000),
          result
        });
        db.data.aiDrafts = db.data.aiDrafts.slice(0, 50);
        await writeDb(db);
        return sendJson(res, 200, {
          ok: true,
          model: geminiModel,
          usage: db.data.aiUsage?.[todayKey()] || { count: 0 },
          result
        });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'ai generation failed');
      }
    }
    if (id === 'survey-draft' && req.method === 'POST') {
      try {
        const member = requireCealSession(req, db);
        const body = await readBody(req);
        const result = await generateSurveyDraft(db, body, member);
        db.data.aiDrafts ||= [];
        db.data.aiDrafts.unshift({
          id: `ai-survey-${Date.now()}`,
          createdAt: new Date().toISOString(),
          createdBy: member.email,
          intent: 'encuesta',
          rawText: asText(body.rawText).slice(0, 8000),
          result
        });
        db.data.aiDrafts = db.data.aiDrafts.slice(0, 50);
        await writeDb(db);
        return sendJson(res, 200, {
          ok: true,
          model: geminiModel,
          usage: db.data.aiUsage?.[todayKey()] || { count: 0 },
          result
        });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'survey generation failed');
      }
    }
    return sendError(res, 404, 'unknown ai action');
  }

  if (resource === 'calendar') {
    const action = parts[2] || '';
    if (id === 'status' && req.method === 'GET') {
      const session = sessionFromRequest(req, db);
      return sendJson(res, 200, { ok: true, status: publicCalendarStatus(db, session) });
    }

    if (id === 'oauth' && action === 'start' && req.method === 'POST') {
      try {
        const { session } = requireStaffSession(req, db);
        if (!calendarConfigured()) return sendError(res, 503, 'google calendar oauth is not configured');
        const state = createCalendarOAuthState(db, session);
        await writeDb(db);
        const client = calendarOAuthClient(req);
        const authUrl = client.generateAuthUrl({
          access_type: 'offline',
          prompt: 'consent select_account',
          include_granted_scopes: true,
          login_hint: calendarAccount,
          scope: calendarScopes,
          state
        });
        return sendJson(res, 200, { ok: true, authUrl, redirectUri: calendarOAuthRedirectUri(req), account: calendarAccount });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'calendar oauth start failed');
      }
    }

    if (id === 'oauth' && action === 'callback' && req.method === 'GET') {
      try {
        const error = asText(url.searchParams.get('error'));
        if (error) throw Object.assign(new Error(error), { statusCode: 401 });
        const code = asText(url.searchParams.get('code'));
        const state = asText(url.searchParams.get('state'));
        if (!code || !state) throw Object.assign(new Error('missing calendar oauth code or state'), { statusCode: 422 });
        await connectGoogleCalendar(req, db, code, state);
        return sendRedirect(res, portalReturnUrl(req, 'connected'));
      } catch (error) {
        return sendRedirect(res, portalReturnUrl(req, 'error'));
      }
    }

    if (id === 'disconnect' && req.method === 'POST') {
      try {
        requireStaffSession(req, db);
        const integration = googleCalendarIntegration(db);
        integration.tokens = null;
        integration.connected = false;
        integration.connectedAt = null;
        integration.updatedAt = new Date().toISOString();
        await writeDb(db);
        return sendJson(res, 200, { ok: true, status: publicCalendarStatus(db) });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'calendar disconnect failed');
      }
    }

    if (id === 'freebusy' && req.method === 'POST') {
      try {
        requirePortalSession(req, db);
        const body = await readBody(req);
        const timeMin = validateCalendarDateTime(body.timeMin, 'timeMin').toISOString();
        const timeMax = validateCalendarDateTime(body.timeMax, 'timeMax').toISOString();
        const data = await calendarApiRequest(req, db, {
          method: 'POST',
          url: 'https://www.googleapis.com/calendar/v3/freeBusy',
          data: {
            timeMin,
            timeMax,
            timeZone: 'America/Santiago',
            items: [{ id: calendarId }]
          }
        });
        return sendJson(res, 200, { ok: true, busy: data.calendars?.[calendarId]?.busy || [] });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'calendar freebusy failed');
      }
    }

    if (id === 'appointments' && req.method === 'POST') {
      try {
        const session = requirePortalSession(req, db);
        if (!asText(session.email).toLowerCase().endsWith(`@${googleDomain}`) && session.role !== 'jefatura') {
          return sendError(res, 403, `only ${googleDomain} accounts can request appointments`);
        }
        const body = await readBody(req);
        const event = calendarEventPayload(body, session);
        const createdEvent = await calendarApiRequest(req, db, {
          method: 'POST',
          url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
          data: event
        });
        const appointment = {
          id: `apt-${Date.now()}`,
          createdAt: new Date().toISOString(),
          requesterEmail: session.email,
          requesterRole: session.role,
          status: 'solicitada',
          start: event.start.dateTime,
          end: event.end.dateTime,
          reason: asText(body.reason),
          googleEventId: createdEvent.id || null,
          googleEventLink: createdEvent.htmlLink || null
        };
        db.data.appointments ||= [];
        db.data.appointments.unshift(appointment);
        await writeDb(db);
        return sendJson(res, 201, { ok: true, item: appointment, event: { id: createdEvent.id, htmlLink: createdEvent.htmlLink } });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'calendar appointment failed');
      }
    }

    return sendError(res, 404, 'unknown calendar action');
  }

  if (resource === 'saved' && req.method === 'POST') {
    const body = await readBody(req);
    const kind = asText(body.kind);
    const itemId = asText(body.id);
    if (!['resources', 'courses', 'reminders'].includes(kind) || !itemId) {
      return sendError(res, 422, 'kind and id are required');
    }
    db.data.saved[kind] ||= [];
    if (!db.data.saved[kind].includes(itemId)) db.data.saved[kind].push(itemId);
    await writeDb(db);
    return sendJson(res, 200, { ok: true, saved: db.data.saved });
  }

  if (resource === 'surveys' || resource === 'encuestas' || resource === 'votaciones') {
    const action = parts[2] || '';
    if (id && action === 'respond' && req.method === 'POST') {
      try {
        const session = requirePortalSession(req, db);
        if (session.role === 'jefatura') {
          return sendError(res, 403, 'jefatura can view surveys but cannot vote');
        }
        if (!asText(session.email).toLowerCase().endsWith(`@${googleDomain}`)) {
          return sendError(res, 403, `only ${googleDomain} accounts can respond`);
        }
        const survey = (db.data.surveys || []).find(item => item.id === id);
        if (!survey) return sendError(res, 404, 'survey not found');
        if (survey.status !== 'open') return sendError(res, 409, 'survey is not open');
        survey.responses ||= [];
        const voterHash = surveyVoterHash(survey.id, session);
        if (!survey.allowMultipleResponses && survey.responses.some(response => response.voterHash === voterHash)) {
          return sendError(res, 409, 'already responded');
        }
        const body = await readBody(req);
        const response = {
          id: `res-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          surveyId: survey.id,
          submittedAt: new Date().toISOString(),
          voterHash,
          role: session.role,
          answers: normalizeSurveyAnswers(survey, body)
        };
        survey.responses.push(response);
        survey.updatedAt = new Date().toISOString();
        await writeDb(db);
        return sendJson(res, 201, { ok: true, item: publicSurvey(survey), responseId: response.id });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'survey response failed');
      }
    }

    if (id && action === 'export' && req.method === 'GET') {
      try {
        requireCealSession(req, db);
        const survey = (db.data.surveys || []).find(item => item.id === id);
        if (!survey) return sendError(res, 404, 'survey not found');
        const buffer = surveyExportBuffer(survey);
        const filename = `${asText(survey.title, 'encuesta').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'encuesta'}-respuestas.xlsx`;
        return sendBinary(res, 200, buffer, {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': `attachment; filename="${filename}"`
        });
      } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'survey export failed');
      }
    }
  }

  const collectionName = collectionMap[resource];
  if (!collectionName || !db.data[collectionName]) {
    return sendError(res, 404, 'unknown api resource');
  }
  const collection = db.data[collectionName];

  if (req.method === 'GET') {
    if (!id) return sendJson(res, 200, { ok: true, items: collectionName === 'surveys' ? collection.map(publicSurvey) : collection });
    const item = resolveLegacyItem(collectionName, collection, id);
    return item ? sendJson(res, 200, { ok: true, item: collectionName === 'surveys' ? publicSurvey(item) : item }) : sendError(res, 404, 'item not found');
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    let created;
    if (collectionName === 'cases') {
      requireFields(body, ['title', 'summary']);
      const next = nextCase(db);
      created = {
        ...next,
        title: asText(body.title),
        type: asText(body.type, 'Académico'),
        status: 'recibido',
        priority: asText(body.priority, 'Normal'),
        createdAt: new Date().toISOString(),
        courseCode: asText(body.courseCode) || null,
        courseName: asText(body.courseName || body.course) || null,
        responsible: 'Por asignar',
        responsibleRole: 'CEAL',
        summary: asText(body.summary),
        nextStep: 'El equipo CEAL revisará el caso y asignará responsable.',
        visibility: 'Solo tú y el equipo asignado pueden ver este caso.',
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        history: [{ at: new Date().toISOString(), title: 'Caso recibido', detail: 'Hemos recibido tu caso correctamente.' }]
      };
    } else if (collectionName === 'resources') {
      requireFields(body, ['title', 'courseName']);
      created = {
        id: nextNumericId(collection, 'mat-'),
        title: asText(body.title),
        type: asText(body.type, 'Apunte'),
        courseCode: asText(body.courseCode || body.courseName),
        plan: asText(body.plan, 'planP'),
        courseName: asText(body.courseName),
        semester: asText(body.semester, '-'),
        year: asText(body.year, new Date().getFullYear()),
        format: asText(body.format, 'PDF'),
        size: asText(body.size, 'Sin archivo'),
        origin: asText(body.origin, 'Aporte estudiantil'),
        status: 'pendienteRevision',
        uploadedBy: asText(body.uploadedBy, 'Estudiante'),
        uploadedAt: new Date().toISOString().slice(0, 10),
        description: asText(body.description),
        fileName: asText(body.fileName),
        fileType: asText(body.fileType),
        fileDataUrl: asText(body.fileDataUrl),
        link: asText(body.link)
      };
    } else if (collectionName === 'communications') {
      requireFields(body, ['title', 'summary', 'body']);
      created = {
        id: nextNumericId(collection, 'com-'),
        title: asText(body.title),
        category: asText(body.category, 'Académico'),
        date: body.date || new Date().toISOString(),
        source: asText(body.source, 'CEIC Ingeniería Civil UCN'),
        pinned: Boolean(body.pinned),
        unread: true,
        summary: asText(body.summary),
        body: asText(body.body),
        related: Array.isArray(body.related) ? body.related : []
      };
    } else if (collectionName === 'agreements') {
      requireFields(body, ['title', 'summary']);
      created = {
        id: nextNumericId(collection, 'agr-'),
        number: asText(body.number, `Seguimiento N ${String(collection.length + 1).padStart(2, '0')}/2026`),
        status: asText(body.status, 'enSeguimiento'),
        date: body.date || new Date().toISOString(),
        origin: asText(body.origin, 'Gestión CEAL'),
        responsible: asText(body.responsible, 'Secretaría CEAL'),
        title: asText(body.title),
        summary: asText(body.summary),
        currentState: asText(body.currentState, 'En seguimiento.'),
        nextStep: asText(body.nextStep, 'Definir próximo paso.'),
        documents: Array.isArray(body.documents) ? body.documents : [],
        commitments: Array.isArray(body.commitments) ? body.commitments : [],
        history: [{ at: new Date().toISOString(), title: 'Seguimiento creado', detail: 'Registro creado desde Gestión CEAL.' }]
      };
    } else if (collectionName === 'surveys') {
      const member = requireCealSession(req, db);
      requireFields(body, ['title']);
      const questions = normalizeSurveyQuestions(body.questions);
      if (!questions.length) return sendError(res, 422, 'at least one question is required');
      const mode = asText(body.mode, 'encuesta') === 'votacion' ? 'votacion' : 'encuesta';
      created = {
        id: nextNumericId(collection, mode === 'votacion' ? 'vot-' : 'enc-'),
        title: asText(body.title),
        description: asText(body.description, 'Consulta dirigida a estudiantes de Ingeniería Civil UCN.'),
        mode,
        audience: 'Estudiantes de Ingeniería Civil UCN',
        secret: body.secret !== false || mode === 'votacion',
        allowMultipleResponses: false,
        status: ['draft', 'open', 'closed'].includes(asText(body.status)) ? asText(body.status) : 'draft',
        questions,
        responses: [],
        createdAt: new Date().toISOString(),
        createdBy: member.email,
        updatedAt: new Date().toISOString()
      };
    } else {
      created = { id: nextNumericId(collection, `${resource.slice(0, 3)}-`), ...body, createdAt: new Date().toISOString() };
    }
    collection.unshift(created);
    await writeDb(db);
    let notifyResult = null;
    if (collectionName === 'communications') {
      generateCommunicationsDigest(db).then(changed => (changed ? writeDb(db) : null)).catch(() => {});
      const notify = body.notify || {};
      if (notify.test || notify.students || notify.professors) {
        try {
          requireCealSession(req, db);
          notifyResult = await sendCommunicationEmail(created, { test: Boolean(notify.test), students: Boolean(notify.students), professors: Boolean(notify.professors) });
        } catch (error) {
          console.error('[mail] notify fallo:', error?.statusCode || '', error?.message || error);
          notifyResult = { sent: false, reason: error.statusCode === 401 || error.statusCode === 403 ? 'unauthorized' : 'error', error: asText(error?.message || error).slice(0, 300) };
        }
      }
    }
    return sendJson(res, 201, { ok: true, item: collectionName === 'surveys' ? publicSurvey(created) : created, ...(notifyResult ? { notify: notifyResult } : {}) });
  }

  if (req.method === 'PATCH') {
    if (!id) return sendError(res, 400, 'id is required');
    const body = await readBody(req);
    let patch = body;
    if (collectionName === 'surveys') {
      requireCealSession(req, db);
      patch = {};
      if (body.title !== undefined) patch.title = asText(body.title);
      if (body.description !== undefined) patch.description = asText(body.description);
      if (['draft', 'open', 'closed'].includes(asText(body.status))) patch.status = asText(body.status);
      if (Array.isArray(body.questions)) {
        const questions = normalizeSurveyQuestions(body.questions);
        if (!questions.length) return sendError(res, 422, 'at least one question is required');
        patch.questions = questions;
      }
    }
    const target = resolveLegacyItem(collectionName, collection, id);
    const item = target ? patchItem(collection, target.id, patch) : null;
    if (!item) return sendError(res, 404, 'item not found');
    if (collectionName === 'cases' && (body.response || body.note || body.status)) {
      item.history ||= [];
      item.history.unshift({
        at: new Date().toISOString(),
        title: body.response ? 'Respuesta enviada' : body.status ? `Estado actualizado a ${body.status}` : 'Nota interna agregada',
        detail: asText(body.response || body.note || 'Cambio registrado.')
      });
    }
    await writeDb(db);
    return sendJson(res, 200, { ok: true, item: collectionName === 'surveys' ? publicSurvey(item) : item });
  }

  if (req.method === 'DELETE') {
    if (!id) return sendError(res, 400, 'id is required');
    if (!['surveys', 'communications'].includes(collectionName)) return sendError(res, 405, 'method not allowed');
    requireCealSession(req, db);
    const target = resolveLegacyItem(collectionName, collection, id);
    const index = target ? collection.findIndex(item => item.id === target.id) : -1;
    if (index === -1) return sendError(res, 404, 'item not found');
    const [removed] = collection.splice(index, 1);
    await writeDb(db);
    return sendJson(res, 200, { ok: true, id: removed.id });
  }

  return sendError(res, 405, 'method not allowed');
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const requested = path.normalize(path.join(root, pathname));
  if (!requested.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const stat = await fs.stat(requested);
    const file = stat.isDirectory() ? path.join(requested, 'index.html') : requested;
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': mime[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=600'
    });
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(200, { 'content-type': mime['.html'], 'cache-control': 'no-store' });
    res.end(await fs.readFile(path.join(root, 'index.html')));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
  res._corsOrigin = resolveCorsOrigin(req.headers.origin);
  try {
    if (url.pathname.startsWith('/api')) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || 'server error', error.details);
  }
});

server.listen(port, () => {
  console.log(`Portal CEIC / CEAL UCN listo en http://localhost:${port}`);
  console.log(`API local activa en http://localhost:${port}/api/health`);
  if (!process.env.PORTAL_VOTE_SALT) {
    console.warn('[seguridad] PORTAL_VOTE_SALT no está configurado: se usa un secreto de respaldo para el hash de votos. Define PORTAL_VOTE_SALT propio en producción.');
  }
});
