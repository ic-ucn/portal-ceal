import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dataDir = path.join(root, '.data');
const dbPath = process.env.PORTAL_DB_PATH || path.join(dataDir, 'portal-db.json');
const port = Number(process.env.PORT || 8080);
const googleClientId = process.env.PORTAL_GOOGLE_CLIENT_ID || '';
const googleDomain = process.env.PORTAL_GOOGLE_DOMAIN || 'alumnos.ucn.cl';
const googleOAuthClient = new OAuth2Client(googleClientId || undefined);

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
  notifications: 'notifications'
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

function runBrowserScript(file, globalName, code) {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox.window[globalName];
}

async function readSeed() {
  const mockPath = path.join(root, 'src', 'mock-data.js');
  const curriculaPath = path.join(root, 'data', 'curricula.js');
  const data = runBrowserScript(mockPath, 'PortalMock', await fs.readFile(mockPath, 'utf8'));
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
  if ((db.data.cealMembers || []).length) db.data.users.ceal = publicMember(db.data.cealMembers[0]);
  db.data.saved ||= seed.data.saved || { resources: [], courses: [], reminders: [] };
  db.data.saved.resources ||= [];
  db.data.saved.courses ||= [];
  db.data.saved.reminders ||= [];
  for (const key of ['communications', 'cases', 'resources', 'events', 'agreements', 'tutoring', 'procedures', 'faqs', 'notifications']) {
    db.data[key] ||= seed.data[key] || [];
  }
  db.data.resources = db.data.resources.filter(resource => !/demo|prueba funcional/i.test([resource.title, resource.origin, resource.description, resource.size].join(' ')));
  db.data.cases = db.data.cases.filter(item => !/demo|prueba avanzada/i.test([item.title, item.summary].join(' ')));
  return db;
}

async function writeDb(next) {
  await fs.mkdir(dataDir, { recursive: true });
  next.meta = {
    ...(next.meta || {}),
    version: next.meta?.version || 1,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(dbPath, JSON.stringify(next, null, 2), 'utf8');
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(JSON.stringify(body));
}

function sendError(res, status, message, details) {
  sendJson(res, status, { ok: false, error: message, details });
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
  return { ...safe, passwordSet: Boolean(member.passwordHash || member.passwordSet) };
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
  const hostedDomain = asText(payload?.hd).toLowerCase();
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
  if (hostedDomain !== googleDomain || !email.endsWith(`@${googleDomain}`)) {
    const err = new Error(`only ${googleDomain} accounts are allowed`);
    err.statusCode = 403;
    throw err;
  }
  return payload;
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

function countDb(db) {
  const data = db.data;
  return {
    communications: data.communications.length,
    cases: data.cases.length,
    materials: data.resources.length,
    agreements: data.agreements.length,
    events: data.events.length,
    tutoring: data.tutoring.length,
    procedures: data.procedures.length
  };
}

async function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  const db = await loadDb();
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [resource, id] = parts;

  if (!resource || resource === 'bootstrap') {
    return sendJson(res, 200, {
      ok: true,
      mode: 'backend',
      meta: db.meta,
      data: db.data,
      curricula: db.curricula,
      counts: countDb(db)
    });
  }

  if (resource === 'health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'portal-ceic-backend',
      dbPath,
      counts: countDb(db)
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
      await writeDb(db);
      return sendJson(res, 200, { ok: true, user: publicMember(member) });
    }

    if (id === 'login' && req.method === 'POST') {
      const body = await readBody(req);
      const member = findMember(db, asText(body.memberId));
      const password = String(body.password || '');
      if (!member || !member.passwordHash || hashPassword(password, member.passwordSalt) !== member.passwordHash) {
        return sendError(res, 401, 'invalid credentials');
      }
      return sendJson(res, 200, { ok: true, user: publicMember(member) });
    }

    if (id === 'google' && req.method === 'POST') {
      const body = await readBody(req);
      const role = asText(body.role, 'student');
      const credential = asText(body.credential);
      if (!credential) return sendError(res, 422, 'google credential is required');
      try {
        const payload = await verifyGoogleCredential(credential);
        if (role === 'ceal') {
          const member = findMemberByEmail(db, payload.email);
          if (!member) return sendError(res, 403, 'google account is not registered as CEAL');
          return sendJson(res, 200, { ok: true, user: { ...publicMember(member), authProvider: 'google', googleSub: payload.sub, picture: payload.picture || '' } });
        }
        return sendJson(res, 200, { ok: true, user: studentFromGoogle(payload) });
      } catch (error) {
        return sendError(res, error.statusCode || 401, error.message || 'invalid google credential');
      }
    }

    return sendError(res, 404, 'unknown auth action');
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

  const collectionName = collectionMap[resource];
  if (!collectionName || !db.data[collectionName]) {
    return sendError(res, 404, 'unknown api resource');
  }
  const collection = db.data[collectionName];

  if (req.method === 'GET') {
    if (!id) return sendJson(res, 200, { ok: true, items: collection });
    const item = collection.find(entry => entry.id === id);
    return item ? sendJson(res, 200, { ok: true, item }) : sendError(res, 404, 'item not found');
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
        type: asText(body.type, 'Academico'),
        status: 'recibido',
        priority: asText(body.priority, 'Normal'),
        createdAt: new Date().toISOString(),
        courseCode: asText(body.courseCode) || null,
        courseName: asText(body.courseName || body.course) || null,
        responsible: 'Por asignar',
        responsibleRole: 'CEAL',
        summary: asText(body.summary),
        nextStep: 'El equipo CEAL revisara el caso y asignara responsable.',
        visibility: 'Solo tu y el equipo asignado pueden ver este caso.',
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
        category: asText(body.category, 'Academico'),
        date: body.date || new Date().toISOString(),
        source: asText(body.source, 'CEIC Ingenieria Civil UCN'),
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
        number: asText(body.number, `Acuerdo CEAL N ${String(collection.length + 1).padStart(2, '0')}/2026`),
        status: asText(body.status, 'enSeguimiento'),
        date: body.date || new Date().toISOString(),
        origin: asText(body.origin, 'Gestion CEAL'),
        responsible: asText(body.responsible, 'Secretaria CEAL'),
        title: asText(body.title),
        summary: asText(body.summary),
        currentState: asText(body.currentState, 'En seguimiento.'),
        nextStep: asText(body.nextStep, 'Definir proximo paso.'),
        documents: Array.isArray(body.documents) ? body.documents : [],
        commitments: Array.isArray(body.commitments) ? body.commitments : [],
        history: [{ at: new Date().toISOString(), title: 'Acuerdo creado', detail: 'Registro creado desde Gestion CEAL.' }]
      };
    } else {
      created = { id: nextNumericId(collection, `${resource.slice(0, 3)}-`), ...body, createdAt: new Date().toISOString() };
    }
    collection.unshift(created);
    await writeDb(db);
    return sendJson(res, 201, { ok: true, item: created });
  }

  if (req.method === 'PATCH') {
    if (!id) return sendError(res, 400, 'id is required');
    const body = await readBody(req);
    const item = patchItem(collection, id, body);
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
    return sendJson(res, 200, { ok: true, item });
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
});
