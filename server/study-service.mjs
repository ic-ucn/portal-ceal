import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const study = require('../src/study-tools.js');
const courses = require('../src/my-courses.js');
const scope = 'https://www.googleapis.com/auth/calendar.app.created';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });
export const emptyDocument = () => ({ study: study.empty(), courses: courses.empty() });

export function validateDocument(value) {
  const a = study.normalize(value?.study), b = courses.normalize(value?.courses);
  if (!a || !b || JSON.stringify(value).length > 650000) throw fail(422, 'Revisa las actividades y los ramos antes de guardar.');
  // Persist only the supported fields. Client-supplied metadata never becomes tokens or mappings.
  a.events = a.events.map(e => {
    if (e.calendar !== undefined && typeof e.calendar !== 'boolean') throw fail(422, 'Revisa la selección del calendario.');
    if ((e.calendar && e.time && !(e.duration > 0)) || (e.duration !== undefined && (!Number.isInteger(e.duration) || e.duration < 0 || e.duration > 720))) throw fail(422, 'Revisa la duración.');
    return { id: e.id, title: e.title, date: e.date, type: e.type, time: e.time, plan: e.plan, course: e.course, done: e.done, calendar: e.calendar === true, duration: e.duration || 0 };
  });
  return { study: a, courses: b };
}

export function eventPayload(event, curricula) {
  const name = curricula?.[event.plan]?.subjects?.find(c => c.code === event.course)?.name || '';
  const payload = {
    summary: `${name ? name + ' · ' : ''}${event.title}`.slice(0, 300),
    description: `${event.type}${event.done ? ' · Completada' : ''}\nEdita esta actividad en Mi semana del Portal CEIC.`,
    extendedProperties: { private: { ceicStudyId: hash(event.id) } },
    reminders: { useDefault: true }
  };
  if (!event.time) {
    payload.start = { date: event.date };
    payload.end = { date: study.shiftDate(event.date, 1) };
  } else {
    // Wall-clock arithmetic; Google applies the IANA zone, including DST, to each endpoint.
    const end = new Date(`${event.date}T${event.time}:00Z`);
    end.setUTCMinutes(end.getUTCMinutes() + (event.duration || 0));
    payload.start = { dateTime: `${event.date}T${event.time}:00`, timeZone: 'America/Santiago' };
    payload.end = { dateTime: end.toISOString().slice(0, 19), timeZone: 'America/Santiago' };
  }
  return payload;
}

// Mutations use a lock per account: OAuth exchanges, document saves, Calendar requests and disconnects.
// writeDb persists the shared database; this lock also protects revision checks across awaits.
export function createStudyService(deps) {
  const chains = new Map();
  const locked = (key, fn) => { const next = (chains.get(key) || Promise.resolve()).then(fn); const tail = next.catch(() => {}); chains.set(key, tail); tail.finally(() => { if (chains.get(key) === tail) chains.delete(key); }); return next; };
  const config = () => deps.config();
  const configured = () => Boolean(config().clientId && config().secret && config().redirect && config().encryptionReady);
  const client = () => deps.oauth(config());
  function account(db, email) {
    db.data.studyAccounts ||= {};
    const key = hash(email.toLowerCase());
    return db.data.studyAccounts[key] ||= { revision: 0, document: emptyDocument(), calendar: { mappings: {} } };
  }
  const calendarStatus = a => ({ configured: configured(), connected: Boolean(a.calendar.tokens && a.calendar.id),
    issue: a.calendar.issue || '', detached: Object.entries(a.calendar.mappings).filter(([, m]) => m.detached).map(([id]) => id), conflicts: Object.entries(a.calendar.mappings).filter(([, m]) => m.conflict).map(([id]) => id),
    updatedAt: a.calendar.updatedAt || null });
  const response = a => ({ ok: true, revision: a.revision, document: a.document, calendar: calendarStatus(a) });
  function authorizedClient(a) {
    const tokens = deps.decrypt(a.calendar.tokens);
    if (!tokens) throw fail(409, 'Vuelve a conectar Google Calendar.');
    const c = client(); c.setCredentials(tokens);
    c.on?.('tokens', next => { a.calendar.tokens = deps.encrypt({ ...tokens, ...next }); });
    return c;
  }
  const codeOf = e => Number(e.response?.status || e.code || e.statusCode);
  async function sync(db, a) {
    if (!a.calendar.tokens || !a.calendar.id) return;
    const c = authorizedClient(a);
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(a.calendar.id)}/events`;
    const desired = new Map(a.document.study.events.filter(e => e.calendar).map(e => [e.id, e]));
    const ids = new Set([...desired.keys(), ...Object.keys(a.calendar.mappings)]);
    let count = 0; const started = Date.now();
    for (const id of ids) {
      if (++count > 1000) break;
      if (Date.now() - started > 10000) { a.calendar.issue = 'Quedan eventos por actualizar. Pulsa Actualizar calendario para continuar.'; await deps.write(db); return; }
      const event = desired.get(id);
      let mapping = a.calendar.mappings[id];
      if (mapping?.conflict || mapping?.detached) continue;
      const payload = event ? eventPayload(event, db.curricula) : null;
      const fingerprint = payload ? hash(JSON.stringify(payload)) : '';
      if (mapping && fingerprint === mapping.fingerprint) continue;
      try {
        if (!mapping) {
          const eventId = hash(`${a.calendar.id}:${id}`);
          // Persist intent first, so uncertain responses can be reconciled without duplicates.
          mapping = a.calendar.mappings[id] = { eventId, pending: true, fingerprint: '', intended: fingerprint };
          await deps.write(db);
        }
        const url = `${base}/${mapping.eventId}`;
        if (mapping.pending) {
          let remote;
          try { remote = (await c.request({ url, method: 'GET', timeout: 15000 })).data; }
          catch (e) { if (codeOf(e) !== 404) throw e; }
          if (!remote && event) remote = (await c.request({ url: base, method: 'POST', data: { ...payload, id: mapping.eventId }, timeout: 15000 })).data;
          if (!remote) { delete a.calendar.mappings[id]; await deps.write(db); continue; }
          if (remote.status === 'cancelled' || remote.extendedProperties?.private?.ceicStudyId !== hash(id)) { mapping.conflict = true; await deps.write(db); continue; }
          // An uncertain insert is accepted only if the fields still match our intended event.
          const equivalent = event && remote.summary === payload.summary && remote.description === payload.description
            && (event.time ? remote.start?.dateTime?.slice(0, 19) === payload.start.dateTime && remote.end?.dateTime?.slice(0, 19) === payload.end.dateTime : remote.start?.date === payload.start.date && remote.end?.date === payload.end.date);
          if (!equivalent) { mapping.conflict = true; await deps.write(db); continue; }
          Object.assign(mapping, { pending: false, etag: remote.etag, fingerprint });
          await deps.write(db); continue;
        }
        if (!mapping.etag) { mapping.conflict = true; await deps.write(db); continue; }
        const headers = { 'If-Match': mapping.etag };
        if (event) {
          const remote = (await c.request({ url, method: 'PATCH', headers, data: payload, timeout: 15000 })).data;
          Object.assign(mapping, { etag: remote.etag, fingerprint });
        } else {
          await c.request({ url, method: 'DELETE', headers, timeout: 15000 });
          delete a.calendar.mappings[id];
        }
        await deps.write(db);
      } catch (e) {
        if ([404, 410, 412].includes(codeOf(e))) { mapping.conflict = true; await deps.write(db); continue; }
        if ([401, 403].includes(codeOf(e))) a.calendar.issue = 'Vuelve a conectar Google Calendar para continuar.';
        else a.calendar.issue = 'Tus actividades están guardadas. Google Calendar tiene cambios pendientes.';
        await deps.write(db); return;
      }
    }
    a.calendar.issue = ''; a.calendar.updatedAt = new Date().toISOString(); await deps.write(db);
  }
  return async (req, res, url, db) => {
    let lockKey;
    try {
      if (url.pathname.endsWith('/calendar/callback')) lockKey = Object.entries(db.data.studyAccounts || {}).find(([, a]) => a.calendar.oauth?.state === hash(url.searchParams.get('state') || ''))?.[0] || 'invalid-callback';
      else lockKey = hash(deps.session(req, db).email.toLowerCase());
    } catch (e) { return deps.json(res, e.statusCode || 401, { ok: false, error: 'Inicia sesión para guardar tu agenda.' }); }
    return locked(lockKey, async () => {
    const action = url.pathname.replace(/^\/api\/study\/?/, '');
    try {
      if (action === 'calendar/callback' && req.method === 'GET') {
        const value = url.searchParams.get('state') || '';
        const a = Object.values(db.data.studyAccounts || {}).find(a => a.calendar.oauth?.state === hash(value));
        const pending = a?.calendar.oauth;
        if (!pending || pending.expires < Date.now()) throw fail(400, 'La conexión venció. Intenta nuevamente.');
        delete a.calendar.oauth; await deps.write(db);
        if (url.searchParams.has('error') || !url.searchParams.get('code')) throw fail(400, 'Conexión cancelada.');
        const c = client();
        const { tokens } = await c.getToken({ code: url.searchParams.get('code'), codeVerifier: pending.verifier });
        const ticket = await c.verifyIdToken({ idToken: tokens.id_token, audience: config().clientId });
        const identity = ticket.getPayload();
        if (!identity?.email_verified || identity.email?.toLowerCase() !== pending.email) throw fail(403, 'Usa la misma cuenta con la que guardas tu agenda.');
        if (!String(tokens.scope || '').split(' ').includes(scope)) throw fail(403, 'No se concedió el permiso del calendario de estudio.');
        const previous = deps.decrypt(a.calendar.tokens) || {};
        if (!tokens.refresh_token && !previous.refresh_token) throw fail(403, 'Vuelve a conectar para conservar el acceso.');
        c.setCredentials({ ...previous, ...tokens });
        if (!a.calendar.id) {
          if (a.calendar.provisioning) throw fail(409, 'La creación del calendario necesita revisión. Tus actividades siguen guardadas.');
          a.calendar.provisioning = true; await deps.write(db);
          const created = await c.request({ url: 'https://www.googleapis.com/calendar/v3/calendars', method: 'POST', data: { summary: 'Mi estudio CEIC', timeZone: 'America/Santiago' }, timeout: 15000 });
          a.calendar.id = created.data.id; delete a.calendar.provisioning;
        }
        a.calendar.tokens = deps.encrypt({ ...previous, ...tokens }); a.calendar.issue = '';
        await deps.write(db);
        return deps.redirect(res, `${config().returnUrl}#/mi-semana?calendar=connected`);
      }
      const session = deps.session(req, db);
      const a = account(db, session.email);
      if (!action && req.method === 'GET') return deps.json(res, 200, response(a));
      if (req.method !== 'POST') throw fail(405, 'Acción no disponible.');
      const body = await deps.body(req, 750000);
      if (action === 'save') {
        if (body.revision !== a.revision) return deps.json(res, 409, { ...response(a), ok: false, error: 'Tu cuenta tiene cambios más recientes. Revisa ambas versiones.', conflict: true });
        const next = validateDocument(body.document);
        // Save a recoverable snapshot before replacement. Retain the previous version per account.
        a.previous = { revision: a.revision, document: a.document };
        a.document = next; a.revision++; await deps.write(db);
        return deps.json(res, 200, response(a));
      }
      if (action === 'calendar/start') {
        if (!configured()) throw fail(503, 'La conexión con Google Calendar todavía no está disponible.');
        const value = crypto.randomBytes(32).toString('base64url');
        const verifier = crypto.randomBytes(48).toString('base64url');
        a.calendar.oauth = { state: hash(value), email: session.email.toLowerCase(), expires: Date.now() + 600000, verifier };
        await deps.write(db);
        const authUrl = client().generateAuthUrl({ scope: ['openid', 'email', scope], state: value, access_type: 'offline', prompt: 'consent select_account', login_hint: session.email, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
        return deps.json(res, 200, { ok: true, authUrl });
      }
      if (action === 'calendar/disconnect') { delete a.calendar.tokens; delete a.calendar.oauth; a.calendar.issue = ''; await deps.write(db); return deps.json(res, 200, response(a)); }
      if (action === 'calendar/detach') {
        const m = a.calendar.mappings[String(body.id)];
        if (!m?.conflict) throw fail(404, 'No hay un cambio pendiente para esta actividad.');
        m.detached = true; m.conflict = false; await deps.write(db);
        return deps.json(res, 200, response(a));
      }
      if (action === 'calendar/sync') { await sync(db, a); return deps.json(res, 200, response(a)); }
      throw fail(404, 'Acción no disponible.');
    } catch (e) {
      if (action === 'calendar/callback') return deps.redirect(res, `${config().returnUrl}#/mi-semana?calendar=error`);
      return deps.json(res, e.statusCode || 503, { ok: false, error: e.statusCode ? e.message : 'No se pudo completar la conexión. Tus datos se conservan.' });
    }
    });
  };
}
