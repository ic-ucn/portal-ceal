(() => {
  const app = document.getElementById('app');
  const Data = window.PortalMock;
  const Curricula = window.CURRICULA;
  const DATA_CONTENT_VERSION = '20260617r';
  const LOCAL_DATA_KEY = 'portal.data.v22';
  const CAMPUS_IMAGE_SRC = 'assets/ucn-campus-transparent.png?v=20260617r';
  const STALE_DATA_KEYS = ['portal.data.v6', 'portal.data.v7', 'portal.data.v8', 'portal.data.v9', 'portal.data.v10', 'portal.data.v11', 'portal.data.v12', 'portal.data.v13', 'portal.data.v14', 'portal.data.v15', 'portal.data.v16', 'portal.data.v17', 'portal.data.v18', 'portal.data.v19', 'portal.data.v20', 'portal.data.v21'];
  const URL_PARAMS = new URLSearchParams(location.search);
  const STATIC_MODE = URL_PARAMS.has('static');
  const API_BASE = !STATIC_MODE && (window.PORTAL_API_BASE || ((location.protocol !== 'file:' && ['localhost', '127.0.0.1', '::1'].includes(location.hostname)) ? '/api' : ''));
  const GOOGLE_CLIENT_ID = String(window.PORTAL_GOOGLE_CLIENT_ID || '').trim();
  const GOOGLE_DOMAIN = String(window.PORTAL_GOOGLE_DOMAIN || 'alumnos.ucn.cl').trim().toLowerCase();
  const GOOGLE_OAUTH_STATE_KEY = 'portal.google.oauth.state';
  const QA_MODE = URL_PARAMS.has('qa');
  const MALLA_BASE_URL = 'https://ic-ucn.github.io/malla-curricular/';
  const mallaEmbedCache = {};
  let dataMode = API_BASE ? 'backend' : 'static';
  let hasRendered = false;
  let lastRenderedRouteKey = '';
  let pendingScrollReset = false;
  let scrollResetToken = 0;
  let pageTopHoldTimer = null;
  let filterRenderTimer = null;

  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch {}

  const state = {
    user: loadSession(),
    activePlan: localStorage.getItem('portal.activePlan') || 'planP',
    mobileSemester: Number(localStorage.getItem('portal.mobileSemester') || 4),
    selectedCourse: null,
    selectedResourceId: null,
    selectedAgreementId: null,
    mallaQuery: '',
    mallaArea: 'all',
    materialQuery: '',
    materialType: 'all',
    materialCourse: 'all',
    communicationCategory: 'Todas',
    communicationQuery: '',
    openFAQ: null,
    notificationsOpen: false,
    mallaEmbedPlan: localStorage.getItem('portal.malla.embedPlan') || 'p',
    mallaEmbedDark: localStorage.getItem('portal.malla.embedDark') === '1',
    mallaFocus: localStorage.getItem('portal.malla.focus') === '1',
    loginMemberId: null,
    authMessage: '',
    toast: null
  };

  const Status = {
    recibido: ['Recibido', 'blue'],
    enRevision: ['En revisión', 'blue'],
    enSeguimiento: ['En seguimiento', 'orange'],
    resuelto: ['Resuelto', 'green'],
    derivado: ['Derivado', 'purple'],
    cerrado: ['Cerrado', 'gray'],
    publicado: ['Publicado', 'green'],
    actualizado: ['Actualizado', 'orange'],
    abierto: ['Abierto', 'green'],
    pendiente: ['Pendiente', 'orange'],
    completado: ['Completado', 'green'],
    borrador: ['Borrador', 'blue'],
    pendienteRevision: ['Pendiente de revisión', 'orange'],
    validadoCeal: ['Validado CEAL', 'green'],
    aporteEstudiantil: ['Aporte estudiantil', 'blue'],
    observado: ['Observado', 'red'],
    approved: ['Aprobado', 'green'],
    inProgress: ['En curso', 'blue'],
    pending: ['Pendiente', 'gray']
  };

  const AreaStyle = {
    basica: 'Ciencias básicas',
    ingenieria: 'Ciencias de la ingeniería',
    aplicada: 'Ingeniería aplicada',
    general: 'Formación general',
    proyecto: 'Proyectos',
    electivo: 'Electivos'
  };

  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="m3 10.8 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24"><path d="M3 11v3a2 2 0 0 0 2 2h2l4 4v-5l9-3V7L7 10H5a2 2 0 0 0-2 2Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4"/><path d="M17 3v4"/><rect x="3" y="5" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.8l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .4.14.78.4 1 .3.3.7.4 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M20 20H4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    maximize: '<svg viewBox="0 0 24 24"><path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M21 16v5h-5"/><path d="M3 16v5h5"/></svg>',
    minimize: '<svg viewBox="0 0 24 24"><path d="M8 3v5H3"/><path d="M16 3v5h5"/><path d="M21 16h-5v5"/><path d="M3 16h5v5"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 13.1A8.5 8.5 0 0 1 10.9 3 7 7 0 1 0 21 13.1Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M12 12h.01"/><path d="M19 12h.01"/><path d="M5 12h.01"/></svg>'
  };

  function ensureShape() {
    Data.cealMembers ||= [];
    Data.saved ||= { resources: [], courses: [], reminders: [] };
    Data.saved.resources ||= [];
    Data.saved.courses ||= [];
    Data.saved.reminders ||= [];
    Data.communications ||= [];
    Data.resources ||= [];
    Data.cases ||= [];
    Data.events ||= [];
    Data.agreements ||= [];
    Data.tutoring ||= [];
    Data.procedures ||= [];
    Data.faqs ||= [];
    Data.notifications ||= [];
    if (!Data.cealMembers.length && Data.users?.ceal) Data.cealMembers = [Data.users.ceal];
    Data.resources = Data.resources.filter(r => !plain([r.title, r.origin, r.description, r.size].join(' ')).includes('demo') && !plain(r.title).includes('prueba funcional'));
    Data.resources = sanitizeMaterialResources(Data.resources);
    Data.cases = Data.cases.filter(c => !plain([c.title, c.summary].join(' ')).includes('demo') && !plain(c.title).includes('prueba avanzada'));
  }

  function tx(v) {
    const s = String(v ?? '');
    if (!/[\u00c3\u00c2]|\u00ef\u00bf\u00bd/.test(s)) return s;
    try { return decodeURIComponent(escape(s)); } catch { return s; }
  }
  function plain(v) { return tx(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function esc(v) { return tx(v).replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s])); }
  function icon(name, extra = '') { return `<span class="icon ${extra}">${ICONS[name] || ICONS.file}</span>`; }
  function routeTo(path, holdTop = false) {
    pendingScrollReset = true;
    resetPageScroll();
    if (holdTop) holdPageTop(1400);
    const nextHash = `#${path}`;
    if (window.location.hash === nextHash) {
      render({ transition: true, scope: 'route' });
      return;
    }
    window.location.hash = path;
  }
  function prefersReducedMotion() { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  function getRoute() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, queryString = ''] = raw.split('?');
    return { path: path || '/', query: Object.fromEntries(new URLSearchParams(queryString)) };
  }
  function loadSession() {
    try {
      const user = JSON.parse(localStorage.getItem('portal.session') || 'null');
      if (user?.authProvider === 'google' && user.role === 'ceal' && !user.accessMode) {
        localStorage.removeItem('portal.session');
        return null;
      }
      return user;
    } catch { return null; }
  }
  function saveSession(user) { state.user = user; localStorage.setItem('portal.session', JSON.stringify(user)); }
  function buildGuestUser() { return { id: 'guest', name: 'Invitado', initials: 'IN', role: 'guest', label: 'Modo invitado', plan: 'planP', yearLabel: 'Solo lectura', email: '', permissions: [] }; }
  function startGuestSession() { localStorage.removeItem('portal.session'); state.user = buildGuestUser(); }
  function isGuest() { return state.user?.role === 'guest'; }
  function hasCealAccess() { return state.user?.role === 'ceal' && (state.user.accessMode === 'ceal' || !state.user.authProvider); }
  function readonlyToast() { showToast('Modo invitado: vista sin registros', 'blue'); }
  function persistSnapshot() { try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify({ version: DATA_CONTENT_VERSION, data: Data })); } catch {} }
  function pruneStaleSnapshots() { try { STALE_DATA_KEYS.forEach(key => localStorage.removeItem(key)); } catch {} }
  function loadLocalSnapshot() {
    try {
      pruneStaleSnapshots();
      const raw = localStorage.getItem(LOCAL_DATA_KEY);
      if (!raw) return;
      const snapshot = JSON.parse(raw);
      if (snapshot?.version !== DATA_CONTENT_VERSION || !snapshot.data) {
        localStorage.removeItem(LOCAL_DATA_KEY);
        return;
      }
      Object.assign(Data, snapshot.data);
    } catch {}
  }
  function mergeDriveResources() {
    const driveResources = Array.isArray(window.PortalDriveMaterials) ? window.PortalDriveMaterials : [];
    if (!driveResources.length) return;
    const driveIds = new Set(driveResources.map((item) => item.id));
    const localResources = Array.isArray(Data.resources) ? Data.resources : [];
    const localUserResources = localResources.filter((item) => (
      !driveIds.has(item.id)
      && !String(item.id || '').startsWith('drive-')
      && !/^mat-\d{3}$/.test(item.id || '')
      && isOfficialCourseResource(item)
    ));
    Data.resources = [...driveResources, ...localUserResources.map(canonicalizeResourceCourse)];
    Data.saved ||= { resources: [], courses: [], reminders: [] };
    Data.saved.resources ||= [];
    Data.saved.resources = (Data.saved.resources || []).filter((id) => driveIds.has(id));
  }
  function parsePortalDate(date) {
    const raw = String(date || '');
    const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return new Date(raw);
  }
  function fmtDate(date) { const d = parsePortalDate(date); return Number.isNaN(d.getTime()) ? esc(date) : d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function fmtTime(date) { const d = new Date(date); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); }
  function titleCase(str) {
    const keepUpper = new Set(['UCN', 'CEIC', 'CEAL', 'PPT', 'PDF', 'APR', 'NCH', 'RIDAA', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']);
    const lowerWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'a', 'en', 'por', 'para', 'con', 'sin']);
    return tx(str).toLocaleLowerCase('es-CL')
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
  function badge(key, label) { const [text, color] = Status[key] || [label || key, 'gray']; return `<span class="status-chip ${color}">${esc(label || text)}</span>`; }
  function showToast(message, type = 'green') { state.toast = { message, type }; render(); setTimeout(() => { state.toast = null; render(); }, 2200); }
  function getUnreadCount() { return Data.notifications.filter(n => n.unread).length; }
  function planLabel(plan) { return plan === 'planO' ? 'Plan O - Catálogo 2016' : 'Plan P - Catálogo 2025'; }
  function planShort(plan) { return plan === 'planO' ? 'Plan O' : 'Plan P'; }
  function getCourses(plan = state.activePlan) { return Curricula[plan]?.subjects || []; }
  function getPlanData(plan = state.activePlan) { return Curricula[plan] || Curricula.planP; }
  function allOfficialCourses() { return ['planP', 'planO'].flatMap(plan => (Curricula[plan]?.subjects || []).map(course => ({ plan, course }))); }
  function officialCourseByCode(code) {
    const normalized = String(code || '').trim();
    if (!normalized) return null;
    return allOfficialCourses().find(({ course }) => course.code === normalized || course.visibleCode === normalized) || null;
  }
  function officialCourseByName(name) {
    const normalized = plain(name);
    if (!normalized) return null;
    return allOfficialCourses().find(({ course }) => plain(course.name) === normalized) || null;
  }
  function canonicalizeResourceCourse(resource) {
    const match = officialCourseByCode(resource.courseCode) || officialCourseByName(resource.courseName);
    if (!match) return resource;
    const { plan, course } = match;
    return {
      ...resource,
      courseCode: course.visibleCode || course.code,
      plan: Curricula[resource.plan] ? resource.plan : plan,
      courseName: titleCase(course.name),
      semester: course.semester || resource.semester
    };
  }
  function isOfficialCourseResource(resource) {
    return Boolean(officialCourseByCode(resource?.courseCode) || officialCourseByName(resource?.courseName));
  }
  function sanitizeMaterialResources(resources = []) {
    const currentDriveIds = new Set((window.PortalDriveMaterials || []).map(item => item.id));
    const hasDriveCatalog = currentDriveIds.size > 0;
    return (resources || [])
      .filter(resource => {
        if (!resource?.id) return false;
        if (hasDriveCatalog && String(resource.id).startsWith('drive-') && !currentDriveIds.has(resource.id)) return false;
        if (hasDriveCatalog && /^mat-\d{3}$/.test(resource.id || '')) return false;
        return isOfficialCourseResource(resource);
      })
      .map(canonicalizeResourceCourse);
  }
  function materialCourseOptions(resources = Data.resources) {
    return materialCourseFacets(resources).map(item => item.label);
  }
  function materialCourseFacets(resources = Data.resources) {
    const byName = new Map();
    for (const resource of resources) {
      const match = officialCourseByCode(resource.courseCode) || officialCourseByName(resource.courseName);
      if (!match) continue;
      const label = titleCase(match.course.name);
      const key = plain(label);
      const current = byName.get(key) || { label, semester: Number(match.course.semester || 99), plan: match.plan, count: 0 };
      current.count += 1;
      byName.set(key, current);
    }
    return [...byName.values()]
      .sort((a, b) => a.semester - b.semester || a.label.localeCompare(b.label, 'es-CL'));
  }
  function findCourse(plan, code) { return getCourses(plan).find(c => c.code === code || c.visibleCode === code); }
  function findCoursePlanForCode(code) { return ['planP', 'planO'].find(plan => findCourse(plan, code)) || state.activePlan; }
  function courseKey(plan, code) { return `${plan}:${code}`; }
  function getProgress(plan, code) { return Data.courseProgress?.[courseKey(plan, code)] || 'pending'; }
  function setProgress(plan, code, value) { Data.courseProgress ||= {}; Data.courseProgress[courseKey(plan, code)] = value; persistSnapshot(); }
  function getPrereqs(plan, course) { return (course.prereqs || []).map(code => findCourse(plan, code)).filter(Boolean); }
  function getSuccessors(plan, code) { return getCourses(plan).filter(c => (c.prereqs || []).includes(code)); }
  function getResourcesForCourse(plan, code) {
    const course = findCourse(plan, code);
    const courseName = plain(course?.name || '');
    return Data.resources.filter(r => (
      r.courseCode === code
      || (courseName && plain(r.courseName) === courseName)
    ));
  }
  function cealMembers() { return Data.cealMembers || []; }
  function getCealMember(id) { return cealMembers().find(m => m.id === id) || cealMembers()[0]; }
  function buildMemberUser(member) { return { ...member, role: 'ceal', accessMode: 'ceal', label: member.roleName || member.label, permissions: member.permissions || [] }; }
  function findCealMemberByEmail(email) {
    const normalized = String(email || '').toLowerCase();
    return cealMembers().find(m => String(m.email || '').toLowerCase() === normalized);
  }
  function markCealGoogleLogin(member, payload) {
    const now = new Date().toISOString();
    member.googleSub ||= payload.sub;
    member.picture = payload.picture || member.picture || '';
    member.firstLoginAt ||= now;
    member.lastLoginAt = now;
    member.loginCount = Number(member.loginCount || 0) + 1;
    member.onboarded = true;
    persistSnapshot();
    return {
      ...buildMemberUser(member),
      authProvider: 'google',
      googleSub: payload.sub,
      picture: payload.picture || member.picture || '',
      firstLoginAt: member.firstLoginAt,
      lastLoginAt: member.lastLoginAt,
      loginCount: member.loginCount
    };
  }
  function isLocalAuthAllowed() { return !GOOGLE_CLIENT_ID || ['localhost', '127.0.0.1', '::1'].includes(location.hostname) || QA_MODE; }
  function localPasswordMap() { try { return JSON.parse(localStorage.getItem('portal.ceal.passwords') || '{}'); } catch { return {}; } }
  function saveLocalPasswordMap(map) { localStorage.setItem('portal.ceal.passwords', JSON.stringify(map)); }
  function memberHasPassword(member) { return Boolean(member?.passwordSet || localPasswordMap()[member?.id]?.passwordHash); }
  async function sha256Text(text) {
    if (crypto?.subtle) {
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return btoa(unescape(encodeURIComponent(text)));
  }
  async function apiRequest(path, options = {}) {
    if (!API_BASE) throw new Error('api unavailable');
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.ok === false) throw new Error(payload.error || `api ${res.status}`);
    return payload;
  }
  async function setupMemberPassword(memberId, password) {
    try { const payload = await apiRequest('/auth/setup', { method: 'POST', body: JSON.stringify({ memberId, password }) }); if (payload.user) return payload.user; } catch {}
    const member = getCealMember(memberId);
    const map = localPasswordMap();
    map[memberId] = { passwordHash: await sha256Text(`${memberId}:${password}`), updatedAt: new Date().toISOString() };
    saveLocalPasswordMap(map);
    if (member) member.passwordSet = true;
    persistSnapshot();
    return buildMemberUser(member);
  }
  async function loginMember(memberId, password) {
    try { const payload = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ memberId, password }) }); if (payload.user) return payload.user; } catch {}
    const member = getCealMember(memberId);
    const stored = localPasswordMap()[memberId];
    if (!member || !stored || stored.passwordHash !== await sha256Text(`${memberId}:${password}`)) throw new Error('Contraseña incorrecta.');
    return buildMemberUser(member);
  }
  function decodeJwtPayload(token) {
    const part = String(token || '').split('.')[1];
    if (!part) throw new Error('Respuesta Google inválida.');
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(decodeURIComponent([...atob(base64)].map(ch => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
  }
  function initialsFromName(name, fallback = 'UC') {
    const parts = String(name || fallback).trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0]?.slice(0, 2) || fallback).toUpperCase();
  }
  function studentFromGoogle(payload) {
    const email = String(payload.email || '').toLowerCase();
    const name = payload.name || email.split('@')[0].split(/[._-]+/).filter(Boolean).map(part => part[0]?.toUpperCase() + part.slice(1)).join(' ') || 'Estudiante UCN';
    return { id: `google:${payload.sub}`, name, initials: initialsFromName(name, 'EU'), role: 'student', accessMode: 'student', label: 'Estudiante', plan: 'planP', yearLabel: 'Cuenta UCN', email, picture: payload.picture || '', authProvider: 'google', googleSub: payload.sub, permissions: [] };
  }
  function validateGooglePayload(payload) {
    const email = String(payload?.email || '').toLowerCase();
    if (!payload?.sub || !email) throw new Error('No se pudo leer la cuenta Google.');
    if (payload.aud && payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Esta credencial Google no pertenece al portal.');
    if (payload.email_verified !== true && payload.email_verified !== 'true') throw new Error('El correo Google no está verificado.');
    if (String(payload.hd || '').toLowerCase() !== GOOGLE_DOMAIN || !email.endsWith(`@${GOOGLE_DOMAIN}`)) throw new Error(`Usa tu cuenta @${GOOGLE_DOMAIN}.`);
    return payload;
  }
  async function loginGoogle(role, credential) {
    if (API_BASE) {
      const payload = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ role, credential }) });
      if (payload.user) return payload.user;
    }
    const payload = validateGooglePayload(decodeJwtPayload(credential));
    if (role === 'ceal') {
      const member = findCealMemberByEmail(payload.email);
      if (!member) throw new Error('Esta cuenta Google no está registrada como CEAL.');
      return markCealGoogleLogin(member, payload);
    }
    return studentFromGoogle(payload);
  }
  function googleRedirectUri() {
    const url = new URL(location.href);
    url.hash = '';
    url.search = '';
    return url.href;
  }
  function randomToken() {
    const c = window.crypto;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  function startGoogleRedirect(role) {
    if (!GOOGLE_CLIENT_ID) {
      state.authMessage = 'Google UCN todavía no está configurado.';
      render({ transition: true, scope: 'panel', resetScroll: false });
      return;
    }
    const mode = role === 'ceal' ? 'ceal' : 'student';
    const stateId = randomToken();
    const nonce = randomToken();
    localStorage.setItem(GOOGLE_OAUTH_STATE_KEY, JSON.stringify({ stateId, nonce, role: mode, createdAt: Date.now() }));
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: googleRedirectUri(),
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
      state: stateId,
      hd: GOOGLE_DOMAIN,
      prompt: 'select_account'
    });
    location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }
  async function handleGoogleRedirectCallback() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (!params.has('id_token') && !params.has('error')) return false;
    const stored = (() => { try { return JSON.parse(localStorage.getItem(GOOGLE_OAUTH_STATE_KEY) || '{}'); } catch { return {}; } })();
    localStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
    try {
      if (params.has('error')) throw new Error(params.get('error_description') || 'Google no permitió iniciar sesión.');
      if (!stored.stateId || params.get('state') !== stored.stateId) throw new Error('No se pudo validar la respuesta de Google. Intenta nuevamente.');
      const credential = params.get('id_token') || '';
      const decoded = decodeJwtPayload(credential);
      if (stored.nonce && decoded.nonce !== stored.nonce) throw new Error('La respuesta de Google no coincide con esta sesión.');
      const user = await loginGoogle(stored.role || 'student', credential);
      state.authMessage = '';
      saveSession(user);
      history.replaceState(null, '', `${location.pathname}${location.search}#/`);
      pendingScrollReset = true;
      holdPageTop(1600);
      return true;
    } catch (err) {
      state.authMessage = err.message || 'No se pudo iniciar con Google.';
      history.replaceState(null, '', `${location.pathname}${location.search}#/login`);
      return true;
    }
  }
  function readFileDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.name) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('file read failed'));
      reader.readAsDataURL(file);
    });
  }
  function humanSize(bytes = 0) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(bytes) || 0;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx += 1; }
    return `${value >= 10 || idx === 0 ? Math.round(value) : value.toFixed(1)} ${units[idx]}`;
  }
  function downloadTextFile(filename, text, type = 'text/plain;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function downloadResource(resource) {
    if (resource.externalUrl) {
      window.open(resource.externalUrl, '_blank', 'noopener');
      return;
    }
    if (resource.fileDataUrl) {
      const a = document.createElement('a');
      a.href = resource.fileDataUrl; a.download = resource.fileName || `${resource.title}.${String(resource.format || 'pdf').toLowerCase()}`; document.body.appendChild(a); a.click(); a.remove();
      return;
    }
    downloadTextFile(`${slug(resource.title)}.txt`, [`${resource.title}`, `Ramo: ${resource.courseName}`, `Tipo: ${resource.type}`, `Origen: ${resource.origin}`, '', resource.description || 'Ficha del recurso.'].join('\n'));
  }
  function driveFileId(url = '') {
    const text = String(url || '');
    try {
      const parsed = new URL(text);
      const id = parsed.searchParams.get('id');
      if (id) return id;
    } catch {}
    return text.match(/\/(?:file|document|presentation|spreadsheets)\/d\/([^/?#]+)/)?.[1] || '';
  }
  function drivePreviewUrl(resource) {
    if (!resource?.externalUrl) return '';
    const id = driveFileId(resource.externalUrl);
    return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : '';
  }
  function calendarDownloadText() {
    return ['Calendario académico CEIC / CEAL UCN', 'Fuente: Calendario de Actividades Docentes para pregrado 2026, DGPRE UCN', ''].concat(Data.events.map(e => `${fmtDate(e.date)} ${e.time || ''} - ${e.title}\n${e.description || 'Actividad del calendario.'}`)).join('\n\n');
  }
  function agreementDownloadText(a) {
    const commitments = (a.commitments || []).map(c => `- ${c.title} · ${c.responsible} · vence ${fmtDate(c.due)}`).join('\n') || 'Sin compromisos registrados.';
    const docs = (a.documents || []).map(d => `- ${d.name}`).join('\n') || 'Sin documentos asociados.';
    return [
      a.number || a.title,
      a.number && a.title ? a.title : '',
      '',
      `Fecha: ${fmtDate(a.date)}`,
      `Origen: ${a.origin}`,
      `Responsable: ${a.responsible}`,
      `Estado: ${(Status[a.status]?.[0] || a.status)}`,
      '',
      'Resumen',
      a.summary || 'Sin resumen disponible.',
      '',
      'Estado actual',
      a.currentState || 'En seguimiento.',
      '',
      'Próximo paso',
      a.nextStep || 'Por definir.',
      '',
      'Compromisos',
      commitments,
      '',
      'Documentos asociados',
      docs
    ].filter(line => line !== '').join('\n');
  }
  function slug(value) { return String(value || 'recurso').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'recurso'; }
  function copyText(text) { return navigator.clipboard?.writeText(text) || Promise.resolve(); }
  function captureInputFocus() {
    const el = document.activeElement;
    if (!el || !['INPUT', 'TEXTAREA'].includes(el.tagName)) return null;
    const attr = ['data-material-search', 'data-com-search', 'data-malla-search'].find(name => el.hasAttribute(name));
    if (!attr) return null;
    return { selector: `[${attr}]`, start: el.selectionStart, end: el.selectionEnd };
  }
  function restoreInputFocus(focusState) {
    if (!focusState?.selector) return;
    const el = app.querySelector(focusState.selector);
    if (!el) return;
    el.focus({ preventScroll: true });
    if (typeof el.setSelectionRange === 'function' && focusState.start != null) {
      el.setSelectionRange(focusState.start, focusState.end ?? focusState.start);
    }
  }
  function scheduleFilterRender() {
    if (filterRenderTimer) clearTimeout(filterRenderTimer);
    filterRenderTimer = setTimeout(() => {
      filterRenderTimer = null;
      render({ scope: 'filter', resetScroll: false, preserveFocus: true });
    }, 120);
  }
  function renderDataRefresh() {
    if (!captureInputFocus()) {
      render({ scope: 'data', resetScroll: false, preserveFocus: true });
      return;
    }
    setTimeout(() => {
      if (!captureInputFocus()) render({ scope: 'data', resetScroll: false, preserveFocus: true });
    }, 800);
  }

  async function boot() {
    loadLocalSnapshot();
    mergeDriveResources();
    ensureShape();
    await handleGoogleRedirectCallback();
    const shouldHoldInitialTop = state.user && getRoute().path === '/';
    render();
    if (shouldHoldInitialTop) holdPageTop(1400);
    if (!API_BASE) return;
    try {
      const payload = await apiRequest('/bootstrap');
      if (payload.data) Object.assign(Data, payload.data);
      if (payload.curricula) Object.assign(Curricula, payload.curricula);
      mergeDriveResources();
      ensureShape();
      dataMode = 'backend';
      persistSnapshot();
      renderDataRefresh();
    } catch { dataMode = 'static'; }
  }

  function navItems() {
    const items = [
      ['/', 'home', 'Inicio'],
      ['/comunicados', 'megaphone', 'Comunicados'],
      ['/calendario', 'calendar', 'Calendario'],
      ['/contingencia', 'file', 'Contingencia del paro'],
      ['/mallas', 'grid', 'Mallas'],
      ['/material', 'book', 'Material']
    ];
    return items;
  }
  function isActive(path, itemPath) {
    if (itemPath === '/') return path === '/';
    return path === itemPath || path.startsWith(itemPath + '/') || (itemPath === '/contingencia' && path.startsWith('/acuerdos/')) || (itemPath === '/mallas' && path.startsWith('/ramo/'));
  }
  function pageHead(title, subtitle = '', actions = '') {
    return `<div class="page-head"><div><h1 class="page-title">${esc(title)}</h1>${subtitle ? `<p class="page-subtitle">${esc(subtitle)}</p>` : ''}</div>${actions ? `<div class="hstack">${actions}</div>` : ''}</div>`;
  }
  function stat(ico, num, label, sub = '') {
    return `<div class="stat-card"><span class="icon-box">${icon(ico)}</span><span class="stat-copy"><strong>${esc(num)}</strong><span>${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</span></div>`;
  }
  function paint() {
    const { path, query } = getRoute();
    if (!state.user && path !== '/login') return routeTo('/login');
    if (state.user && path === '/login') return routeTo('/');
    if (state.user && (path === '/casos' || path === '/casos/nuevo' || path.startsWith('/casos/'))) return routeTo('/mallas');
    if (state.user && (path === '/apoyo' || path.startsWith('/ayudantias/') || path.startsWith('/tramites/'))) return routeTo('/material');
    if (state.user && path.startsWith('/gestion')) return routeTo('/');
    app.innerHTML = path === '/login' ? renderLogin() : renderShell(renderPage(path, query), path);
    return true;
  }
  function render(options = {}) {
    const opts = options instanceof Event ? { transition: true, scope: 'route' } : options;
    const scope = opts.scope || 'state';
    const routeKey = window.location.hash || '#/';
    const shouldAnimate = hasRendered && opts.transition && !prefersReducedMotion();
    const focusState = opts.preserveFocus ? captureInputFocus() : null;
    if (shouldAnimate) app.dataset.motionScope = scope;
    if (!paint()) return;
    afterRender();
    restoreInputFocus(focusState);
    const shouldResetScroll = opts.resetScroll !== false && (pendingScrollReset || scope === 'route' || routeKey !== lastRenderedRouteKey);
    lastRenderedRouteKey = routeKey;
    pendingScrollReset = false;
    if (shouldResetScroll) resetPageScroll();
    hasRendered = true;
    if (shouldAnimate) setTimeout(() => { delete app.dataset.motionScope; }, 260);
  }
  function resetPageScroll() {
    const token = ++scrollResetToken;
    const apply = () => {
      if (token !== scrollResetToken) return;
      applyPageTop();
    };
    apply();
    requestAnimationFrame(() => { apply(); requestAnimationFrame(apply); });
    [60, 140, 320, 700].forEach(ms => setTimeout(apply, ms));
  }
  function applyPageTop() {
    try {
      const active = document.activeElement;
      if (active && !['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) active.blur?.();
    } catch {}
    const scrollers = [
      document.scrollingElement,
      document.documentElement,
      document.body,
      app,
      app.querySelector('.app-shell'),
      app.querySelector('.app-main'),
      app.querySelector('.content')
    ].filter(Boolean);
    scrollers.forEach(el => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
      try { el.scrollTo?.({ top: 0, left: 0, behavior: 'auto' }); } catch {}
    });
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { window.scrollTo(0, 0); }
  }
  function holdPageTop(ms = 1200) {
    const until = Date.now() + ms;
    clearTimeout(pageTopHoldTimer);
    const tick = () => {
      applyPageTop();
      if (Date.now() < until) pageTopHoldTimer = setTimeout(tick, 50);
    };
    tick();
  }
  function afterRender() {
    hydrateMallaEmbed();
  }
  function renderLogin() {
    const googleConfigured = Boolean(GOOGLE_CLIENT_ID) && !QA_MODE;
    const googlePending = googleConfigured ? '' : `<div class="google-auth-note"><strong>Google UCN pendiente</strong><span>Agrega el Client ID web para activar el acceso con Google.</span></div>`;
    const googleButton = role => `<button class="google-oauth-btn ${googleConfigured ? '' : 'is-disabled'}" data-google-redirect="${role}" type="button" ${googleConfigured ? '' : 'disabled'}><span class="google-mark" aria-hidden="true">G</span><span>Acceder con Google</span></button>`;
    return `<main class="login-shell"><section class="login-card" aria-label="Ingreso al portal">
      <div class="login-brand"><figure class="login-campus-art"><img src="${CAMPUS_IMAGE_SRC}" alt="Campus Universidad Católica del Norte" loading="eager" /></figure><div class="login-brand-copy"><img class="login-logo" src="assets/logo-horizontal.png" alt="CEIC UCN Ingeniería Civil UCN" /></div></div>
      <div class="login-form"><span class="eyebrow">Acceso UCN</span><h1>Portal CEIC</h1><p>Usa tu correo institucional @${esc(GOOGLE_DOMAIN)}.</p>
        ${googlePending}${state.authMessage ? `<p class="form-alert">${esc(state.authMessage)}</p>` : ''}
        <div class="google-login-grid">
          <section class="google-login-card">
            <span class="role-icon">${icon('user')}</span>
            <div class="google-login-body">
              <div><strong>Estudiante</strong><span>Material, mallas, calendario y comunicados.</span></div>
              ${googleButton('student')}
            </div>
          </section>
          <section class="google-login-card">
            <span class="role-icon">${icon('settings')}</span>
            <div class="google-login-body">
              <div><strong>Miembro CEAL</strong><span>Acceso interno CEAL</span></div>
              ${googleButton('ceal')}
            </div>
          </section>
        </div>
        <button class="guest-login-card" data-login-role="guest" type="button">
          <span class="role-icon">${icon('eye')}</span>
          <span><strong>Entrar como invitado</strong><small>Solo visualizar mallas, material, calendario y comunicados. No guarda registros.</small></span>
          ${icon('arrow')}
        </button>
      </div></section></main>`;
  }
  function renderShell(content, path) {
    const user = state.user;
    const accountLabel = isGuest() ? 'Invitado' : 'Mi cuenta';
    const isMallaRoute = path === '/mallas';
    const shellClass = `app-shell ${isMallaRoute ? 'malla-route' : ''} ${isMallaRoute && state.mallaFocus ? 'malla-focus-mode' : ''}`.trim();
    const nav = navItems().map(([href, ico, label]) => `<a class="nav-item ${isActive(path, href) ? 'active' : ''}" href="#${href}">${icon(ico)}<span>${label}</span></a>`).join('');
    const campusNav = `<a class="sidebar-campus-card" href="#/"><img src="${CAMPUS_IMAGE_SRC}" alt="Campus Universidad Católica del Norte" loading="eager" /><span><strong>Portal académico</strong><small>Ingeniería Civil UCN</small></span></a>`;
    const bottom = [['/', 'home', 'Inicio'], ['/calendario', 'calendar', 'Calendario'], ['/mallas', 'grid', 'Mallas'], ['/material', 'book', 'Material'], ['/mas', 'more', 'Más']]
      .map(([href, ico, label]) => `<a class="bottom-item ${isActive(path, href) || (href === '/mas' && ['/comunicados','/contingencia','/perfil','/buscar','/notificaciones'].some(p => path.startsWith(p))) ? 'active' : ''}" href="#${href}">${icon(ico)}<span>${label}</span></a>`).join('');
    return `<div class="${shellClass}"><aside class="sidebar"><a class="sidebar-brand" href="#/"><span class="brand-mark"><img src="assets/logo-mark.png" alt="CEIC UCN" /></span><span class="brand-copy"><strong>CEIC UCN</strong><span>INGENIERÍA CIVIL UCN</span></span></a>${campusNav}<nav class="nav">${nav}</nav></aside>
      <main class="app-main"><header class="topbar"><form class="global-search" data-global-search-form><button class="search-submit" type="submit" aria-label="Buscar">${icon('search')}</button><input name="q" type="search" placeholder="Buscar en el portal..." /></form><div class="topbar-actions"><button class="icon-btn" data-toggle-notifications aria-label="Notificaciones">${icon('bell')}<span class="badge-count">${getUnreadCount()}</span></button><a class="account-trigger" href="#/perfil">${icon('user')}<span>${accountLabel}</span></a></div></header>
      <header class="mobile-header"><a class="mobile-brand" href="#/"><img src="assets/logo-mark.png" alt="CEIC UCN" /><strong>CEIC / CEAL UCN</strong></a><div class="mobile-actions"><button class="icon-btn" data-toggle-notifications>${icon('bell')}<span class="badge-count">${getUnreadCount()}</span></button><a class="icon-btn" href="#/perfil">${icon('user')}</a></div></header>
      <section class="content ${isMallaRoute ? 'content-mallas' : ''}">${content}</section><nav class="bottom-nav">${bottom}</nav></main>${state.notificationsOpen ? renderNotificationPopover() : ''}${state.toast ? `<div class="notification-popover" style="top:auto;right:28px;bottom:28px;width:340px"><header><strong>${esc(state.toast.message)}</strong><span class="status-chip ${state.toast.type}">Listo</span></header></div>` : ''}</div>`;
  }
  function renderPage(path, query) {
    if (path === '/') return renderHome();
    if (path === '/mas') return renderMore();
    if (path === '/perfil') return renderProfile();
    if (path === '/buscar') return renderSearch(query.q || '');
    if (path === '/notificaciones') return renderNotificationsPage();
    if (path === '/comunicados') return renderCommunications();
    if (path.startsWith('/comunicados/')) return renderCommunicationDetail(path.split('/')[2]);
    if (path === '/calendario') return renderCalendar();
    if (path === '/contingencia') return renderContingency();
    if (path.startsWith('/acuerdos/')) return renderAgreementDetail(path.split('/')[2]);
    if (path === '/casos' || path === '/casos/nuevo' || path.startsWith('/casos/')) return renderMallas();
    if (path === '/material') {
      if (query.course) {
        const courseCode = decodeURIComponent(String(query.course));
        const course = findCourse(state.activePlan, courseCode) || findCourse(findCoursePlanForCode(courseCode), courseCode);
        state.materialCourse = course?.name || 'all';
        state.materialQuery = course?.name || courseCode;
        state.selectedResourceId = null;
      }
      return renderMaterial();
    }
    if (path === '/material/subir') return renderUploadMaterial();
    if (path.startsWith('/material/')) return renderMaterialDetailPage(path.split('/')[2]);
    if (path === '/mallas') return renderMallas();
    if (path.startsWith('/ramo/')) { const [, , plan, code] = path.split('/'); return renderCourseDetailPage(plan, decodeURIComponent(code)); }
    if (path === '/apoyo' || path.startsWith('/ayudantias/') || path.startsWith('/tramites/')) return renderMaterial();
    if (path === '/gestion' || path.startsWith('/gestion/')) return renderNotFound('Gestión CEAL está pausada por ahora.');
    return renderNotFound();
  }

  function renderHome() {
    const unread = Data.communications.filter(c => c.unread).length;
    const newMaterials = Data.resources.filter(r => r.status !== 'observado').length;
    return `${pageHead('Inicio', 'Resumen actualizado del portal académico')}
      <section class="home-hero"><div class="card pad home-summary"><div class="row-between"><h2 class="card-title">Estado general</h2><span class="pill green">Portal actualizado</span></div><p class="muted">Revisa comunicados, fechas académicas, mallas, material nuevo y avance curricular.</p><div class="stat-grid compact">${stat('megaphone', unread, 'Comunicados', 'Nuevos')}${stat('calendar', Data.events.length, 'Fechas', 'Próximas')}${stat('grid', 2, 'Mallas', 'Planes')}${stat('book', newMaterials, 'Recursos', 'Visibles')}</div></div>
      <section class="home-campus-feature"><img src="${CAMPUS_IMAGE_SRC}" alt="Campus Universidad Católica del Norte" loading="eager" /><div class="home-campus-caption"><span>Ingeniería Civil UCN</span><strong>Portal académico CEIC / CEAL</strong></div></section>
      <div class="card pad home-actions-panel"><div class="row-between"><h2 class="card-title">Acciones frecuentes</h2><span class="pill blue">Accesos rápidos</span></div><div class="access-grid home-actions-grid">${access('grid','Abrir mallas','Plan O y Plan P en vista inmersiva.','Ver malla','/mallas','blue')}${access('book','Buscar material','Guías, pruebas, apuntes y PPT.','Abrir','/material')}${access('calendar','Ver calendario','Fechas académicas oficiales 2026.','Abrir','/calendario')}${access('file','Contingencia del paro','Comunicados, compromisos y seguimiento.','Revisar','/contingencia','orange')}</div></div></section>
      <div class="grid two" style="margin-top:18px"><section class="card pad"><div class="row-between"><h2 class="card-title">Novedades recientes</h2><a class="link" href="#/comunicados">Ver todas ${icon('arrow')}</a></div>${Data.communications.slice(0,4).map(c => newsRow('megaphone', c.title, c.summary, `/comunicados/${c.id}`, c.date)).join('')}</section><section class="card pad"><div class="row-between"><h2 class="card-title">Próximas fechas</h2><a class="link" href="#/calendario">Ver calendario ${icon('arrow')}</a></div>${Data.events.slice(0,4).map(dateRow).join('')}</section></div>`;

  }
  function access(ico, title, desc, action, href, tone = '') { return `<a class="access-card" href="#${href}"><span class="icon-box ${tone}">${icon(ico)}</span><span class="access-copy"><strong>${esc(title)}</strong><span>${esc(desc)}</span><em>${esc(action)} ${icon('arrow')}</em></span></a>`; }
  function newsRow(ico, title, desc, href, date) { return `<a class="link-card-row" href="#${href}"><span class="hstack">${icon(ico)}<span><strong>${esc(title)}</strong><span>${esc(desc || '')}</span></span></span><span class="small muted">${fmtDate(date)}</span></a>`; }
  function dateRow(e) {
    const detail = [fmtDate(e.date), e.time, e.description].filter(Boolean).map(esc).join(' - ');
    return `<a class="link-card-row" href="#/calendario"><span><strong>${esc(e.title)}</strong><span>${detail}</span></span><span class="pill blue">${esc(e.type || 'Fecha')}</span></a>`;
  }
  function parseCalendarDate(date) {
    const [year, month, day] = String(date).slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  function isoCalendarDate(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  function calendarMonthLabel(date) {
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }
  function calendarEventTone(type = '') {
    const value = plain(type);
    if (value.includes('evaluacion') || value.includes('examen')) return 'purple';
    if (value.includes('tramite') || value.includes('inscripcion')) return 'orange';
    if (value.includes('receso') || value.includes('bienestar')) return 'green';
    return 'blue';
  }
  function renderMonthCalendar(monthDate, events) {
    const todayKey = Data.today || new Date().toISOString().slice(0, 10);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const previousMonthDays = new Date(year, month, 0).getDate();
    const eventsByDate = events.reduce((acc, event) => {
      const key = String(event.date).slice(0, 10);
      (acc[key] ||= []).push(event);
      return acc;
    }, {});
    const heads = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => `<div class="day-head">${day}</div>`).join('');
    const cells = Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const visibleDay = inMonth ? dayNumber : dayNumber < 1 ? previousMonthDays + dayNumber : dayNumber - daysInMonth;
      const dateKey = inMonth ? isoCalendarDate(year, month, visibleDay) : '';
      const dayEvents = inMonth ? (eventsByDate[dateKey] || []) : [];
      const classes = ['day-cell', inMonth ? '' : 'outside', dateKey === todayKey ? 'today' : '', dayEvents.length ? 'has-event' : ''].filter(Boolean).join(' ');
      const eventsMarkup = dayEvents.slice(0, 2).map(event => `<span class="day-event ${calendarEventTone(event.type)}" title="${esc(event.title)}">${esc(event.title)}</span>`).join('');
      const extra = dayEvents.length > 2 ? `<span class="day-more">+${dayEvents.length - 2}</span>` : '';
      return `<div class="${classes}" ${dateKey ? `data-calendar-date="${dateKey}"` : ''}><time datetime="${dateKey || ''}"><span class="day-number ${inMonth ? '' : 'muted'}">${visibleDay}</span>${dateKey === todayKey ? '<span class="today-dot">Hoy</span>' : ''}</time>${eventsMarkup}${extra}</div>`;
    }).join('');
    return `<div class="month-grid" aria-label="Calendario ${esc(calendarMonthLabel(monthDate))}">${heads}${cells}</div>`;
  }
  function renderMonthEventAgenda(monthDate, events) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthEvents = events.filter(event => {
      const date = parseCalendarDate(event.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    if (!monthEvents.length) return renderEmpty('Sin fechas este mes', 'Las próximas actividades aparecen en la agenda lateral.');
    return `<div class="calendar-month-agenda">${monthEvents.map(event => `<a class="calendar-agenda-row" href="#/calendario"><time datetime="${esc(event.date)}"><strong>${parseCalendarDate(event.date).getDate()}</strong><span>${parseCalendarDate(event.date).toLocaleDateString('es-CL', { month: 'short' })}</span></time><span><strong>${esc(event.title)}</strong><small>${[event.time, event.description].filter(Boolean).map(esc).join(' - ')}</small></span><em class="${calendarEventTone(event.type)}">${esc(event.type || 'Fecha')}</em></a>`).join('')}</div>`;
  }

  function renderCommunications() {
    const cats = ['Todas', ...new Set(Data.communications.map(c => c.category))];
    const q = plain(state.communicationQuery);
    const items = Data.communications.filter(c => (state.communicationCategory === 'Todas' || plain(c.category) === plain(state.communicationCategory)) && (!q || plain([c.title, c.summary, c.category, c.source].join(' ')).includes(q)));
    const selected = items[0];
    return `${pageHead('Comunicados', 'Avisos, respuestas y actualizaciones de la carrera')}
      <div class="comms-layout"><aside class="card pad comms-filters"><div class="form-field"><label>Buscar comunicados</label><input class="input" data-com-search value="${esc(state.communicationQuery)}" placeholder="Buscar comunicado" /></div><h2 class="card-title">Categorías</h2><div class="comms-category-list">${cats.map(c => `<button class="chip-btn ${state.communicationCategory === c ? 'active' : ''}" data-com-category="${esc(c)}">${esc(c)}</button>`).join('')}</div></aside>
      <main class="card pad comms-feed"><div class="row-between"><h2 class="card-title">Comunicado destacado</h2><span class="pill gray">${items.length} visibles</span></div>${selected ? commCard(selected, true) : renderEmpty('Sin comunicados visibles', 'Cambia los filtros para revisar otros avisos.')}<div class="divider"></div><h2 class="card-title">Recientes</h2><div class="card-list">${items.slice(1).map(c => commCard(c)).join('') || '<p class="small muted">No hay más comunicados en esta categoría.</p>'}</div></main>
      <aside class="card pad comms-preview"><h2 class="card-title">Preguntas frecuentes</h2>${renderFAQ()}</aside></div>`;
  }
  function commCard(c) { return `<a class="item-card" href="#/comunicados/${c.id}"><div class="row-between"><span class="pill blue">${esc(c.category)}</span><span class="small muted">${fmtDate(c.date)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="link">Leer comunicado ${icon('arrow')}</span></a>`; }
  function renderCommunicationDetail(id) {
    const c = Data.communications.find(x => x.id === id);
    if (!c) return renderNotFound('No encontramos el comunicado.');
    const markAction = isGuest() ? '' : `<button class="btn primary" data-mark-read="${esc(c.id)}">Marcar como leído</button>`;
    return `${pageHead(c.title, `${c.category} - ${fmtDate(c.date)}, ${fmtTime(c.date)}`, `<a class="btn secondary" href="#/comunicados">Volver</a>`)}<div class="split"><article class="card pad"><div class="hstack">${badge('blue', c.category)}${c.pinned ? badge('orange','Fijado') : ''}</div><p class="communication-body">${esc(c.body)}</p><div class="detail-block"><div class="detail-row"><span>Fuente</span><strong>${esc(c.source)}</strong></div><div class="detail-row"><span>Publicado</span><strong>${fmtDate(c.date)}, ${fmtTime(c.date)}</strong></div></div><div class="hstack">${markAction}<button class="btn secondary" data-copy-link>Copiar enlace</button></div></article><aside class="card pad"><h2 class="card-title">Relacionado</h2>${(c.related || []).map(r => `<a class="link-card-row" href="#${r.type === 'contingencia' ? '/contingencia' : '/calendario'}"><span><strong>${esc(r.label)}</strong><span>${esc(r.type)}</span></span>${icon('arrow')}</a>`).join('') || '<p class="small muted">Sin vínculos relacionados.</p>'}<div class="divider"></div>${renderFAQ()}</aside></div>`;
  }
  function renderFAQ() { return `<div class="vstack">${Data.faqs.slice(0, 5).map((f, i) => `<button class="link-card-row" data-faq="${i}"><span><strong>${esc(f.q)}</strong>${state.openFAQ === i ? `<span class="faq-answer">${esc(f.a)}</span>` : ''}</span>${icon(state.openFAQ === i ? 'x' : 'arrow')}</button>`).join('')}</div>`; }

  function renderCalendar() {
    const calendarAction = isGuest() ? '' : `<button class="btn secondary" data-download-calendar>${icon('calendar')} Exportar agenda</button>`;
    const nextEvents = Data.events.filter(e => new Date(`${e.date}T23:59:59`) >= new Date(`${Data.today || '2026-06-17'}T00:00:00`));
    const currentMonth = parseCalendarDate(Data.today || nextEvents[0]?.date || '2026-06-17');
    return `${pageHead('Calendario', 'Fechas académicas oficiales relevantes desde junio de 2026', calendarAction)}
      <div class="calendar-layout refined-calendar-layout"><section class="card pad academic-calendar-card"><div class="calendar-card-head"><div><span class="kicker">Vista mensual</span><h2 class="card-title">${esc(calendarMonthLabel(currentMonth))}</h2><p class="small muted">Fechas oficiales visibles desde la fecha actual del portal.</p></div><span class="pill blue">${nextEvents.length} fechas próximas</span></div>${renderMonthCalendar(currentMonth, nextEvents)}<div class="divider"></div><div class="row-between calendar-agenda-title"><h2 class="card-title">Eventos del mes</h2><span class="pill gray">${esc(currentMonth.toLocaleDateString('es-CL', { month: 'long' }))}</span></div>${renderMonthEventAgenda(currentMonth, nextEvents)}</section><aside class="card pad calendar-side-panel"><div class="row-between"><h2 class="card-title">Próximos hitos</h2><span class="pill blue">${nextEvents.length}</span></div><div class="card-list">${nextEvents.map(dateRow).join('')}</div><div class="divider"></div><span class="kicker">Fuente oficial</span><h2 class="card-title">Calendario de Actividades Docentes 2026</h2><p class="small muted">Se muestran los hitos vigentes y próximos del calendario DGPRE UCN para pregrado. Las fechas pasadas de enero a mayo quedan fuera para evitar ruido al consultar el portal.</p><div class="divider"></div>${access('file','Contingencia del paro','Seguimiento separado de acuerdos, comunicados y compromisos.','Abrir','/contingencia','orange')}</aside></div>`;
  }
  function renderContingency() {
    const selected = Data.agreements.find(a => a.id === state.selectedAgreementId) || Data.agreements[0];
    const registerAgreement = '';
    const contingencyComms = Data.communications.filter(c => plain(c.category) === 'contingencia');
    return `${pageHead('Contingencia del paro', 'Comunicados, acuerdos de seguimiento y estado actual', registerAgreement)}
      <section class="card pad contingency-hero"><div><span class="kicker">Estado actual</span><h2 class="card-title">Movilización institucional en seguimiento</h2><p class="muted">Esta sección concentra la información del paro para que el calendario académico quede limpio y la comunidad pueda revisar rápidamente qué se comunicó, qué compromisos existen y cuál es el siguiente paso.</p></div><div class="stat-grid compact">${stat('megaphone', contingencyComms.length, 'Comunicados', 'Publicados')}${stat('file', Data.agreements.length, 'Seguimientos', 'Activos')}</div></section>
      <div class="calendar-layout" style="margin-top:18px"><section class="card pad"><div class="row-between"><h2 class="card-title">Seguimiento</h2><span class="pill orange">Paro</span></div>${Data.agreements.map(a => agreementRow(a)).join('')}</section><section class="card pad"><h2 class="card-title">Últimos comunicados</h2><div class="card-list">${contingencyComms.map(c => commCard(c)).join('')}</div></section></div>${selected ? `<section class="card pad" style="margin-top:18px">${renderAgreementSummary(selected)}</section>` : ''}`;
  }
  function agreementRow(a) { return `<a class="link-card-row" href="#/acuerdos/${a.id}"><span><strong>${esc(a.number || a.title)}</strong><span>${fmtDate(a.date)} - ${esc(a.title)}</span></span>${badge(a.status)}</a>`; }
  function commitRow(c) { return `<div class="commit-row"><span><strong>${esc(c.title)}</strong><span>${esc(c.responsible)} - vence ${fmtDate(c.due)}</span></span>${badge(c.status)}</div>`; }
  function renderAgreementSummary(a) { return `<div class="row-between"><div><span class="kicker">Detalle de seguimiento</span><h2 class="card-title">${esc(a.number || a.title)}</h2>${a.number && a.title ? `<p class="muted">${esc(a.title)}</p>` : ''}</div>${badge(a.status)}</div><div class="detail-block"><div class="detail-row"><span>Origen</span><strong>${esc(a.origin)}</strong></div><div class="detail-row"><span>Fecha</span><strong>${fmtDate(a.date)}</strong></div><div class="detail-row"><span>Responsable</span><strong>${esc(a.responsible)}</strong></div></div><div class="grid two"><div><h3 class="card-title">Resumen</h3><p class="small muted">${esc(a.summary)}</p></div><div><h3 class="card-title">Estado actual</h3><p class="small muted">${esc(a.currentState)}</p></div></div>`; }
  function renderAgreementDetail(id) {
    const a = Data.agreements.find(x => x.id === id);
    if (!a) return renderNotFound('No encontramos el acuerdo.');
    const downloadAction = isGuest() ? '' : `<button class="btn primary full" data-download-agreement="${esc(a.id)}">Descargar ficha</button>`;
    return `${pageHead(a.number || a.title, `${fmtDate(a.date)} - ${a.origin}`, `<a class="btn secondary" href="#/contingencia">Volver</a>`)}<div class="split wide"><section class="card pad">${renderAgreementSummary(a)}<div class="detail-block"><h3 class="card-title">Compromisos</h3>${(a.commitments || []).map(commitRow).join('') || '<p class="small muted">Sin compromisos registrados.</p>'}</div><div class="detail-block"><h3 class="card-title">Historial</h3>${timeline(a.history || [])}</div></section><aside class="card pad"><h2 class="card-title">Documentos asociados</h2>${(a.documents || []).map(d => `<div class="link-card-row"><span><strong>${esc(d.name)}</strong><span>${esc(d.type)} - ${esc(d.size)}</span></span>${icon('file')}</div>`).join('') || '<p class="small muted">Sin documentos asociados.</p>'}<div class="divider"></div>${downloadAction}<button class="btn secondary full" data-copy-link>Copiar enlace</button></aside></div>`;
  }

  function renderMaterial() {
    Data.resources = sanitizeMaterialResources(Data.resources);
    const courseFacets = materialCourseFacets(Data.resources);
    const courses = courseFacets.map(item => item.label);
    if (state.materialCourse !== 'all' && !courses.some(course => plain(course) === plain(state.materialCourse))) {
      state.materialCourse = 'all';
    }
    const q = plain(state.materialQuery);
    const items = Data.resources.filter(r => (!q || plain([r.title, r.courseName, r.courseCode, r.type, r.origin].join(' ')).includes(q)) && (state.materialType === 'all' || plain(r.type) === plain(state.materialType)) && (state.materialCourse === 'all' || plain(r.courseName) === plain(state.materialCourse)));
    const selected = Data.resources.find(r => r.id === state.selectedResourceId) || items[0];
    const types = ['all', ...[...new Set(Data.resources.map(r => r.type).filter(Boolean))].sort((a, b) => tx(a).localeCompare(tx(b), 'es-CL'))];
    const quickCourses = courseFacets
      .slice()
      .sort((a, b) => b.count - a.count || a.semester - b.semester || a.label.localeCompare(b.label, 'es-CL'))
      .slice(0, 8);
    if (state.materialCourse !== 'all' && !quickCourses.some(course => plain(course.label) === plain(state.materialCourse))) {
      const activeCourse = courseFacets.find(course => plain(course.label) === plain(state.materialCourse));
      if (activeCourse) quickCourses.unshift(activeCourse);
    }
    const hasActiveFilters = Boolean(state.materialQuery) || state.materialType !== 'all' || state.materialCourse !== 'all';
    const activeFilters = [
      state.materialQuery ? ['search', `Texto: ${state.materialQuery}`] : null,
      state.materialType !== 'all' ? ['type', `Tipo: ${state.materialType}`] : null,
      state.materialCourse !== 'all' ? ['course', `Ramo: ${state.materialCourse}`] : null
    ].filter(Boolean);
    const uploadAction = isGuest() ? '' : `<a class="btn primary" href="#/material/subir">${icon('upload')} Subir material</a>`;
    return `${pageHead('Biblioteca académica', 'Recursos para estudiar por ramo', uploadAction)}
      <div class="split wide"><section class="card pad material-browser"><div class="material-search-panel"><label for="material-search-input">Buscar recurso</label><div class="material-search-box">${icon('search')}<input id="material-search-input" data-material-search value="${esc(state.materialQuery)}" placeholder="Ramo, código, prueba, apunte o guía" autocomplete="off" /></div><div class="material-controls"><label><span>Tipo</span><select class="select" data-material-type-select><option value="all"${state.materialType === 'all' ? ' selected' : ''}>Todos los tipos</option>${types.filter(t => t !== 'all').map(t => `<option value="${esc(t)}"${state.materialType === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label><label><span>Ramo</span><select class="select" data-material-course-select><option value="all"${state.materialCourse === 'all' ? ' selected' : ''}>Todos los ramos</option>${courses.map(c => `<option value="${esc(c)}"${state.materialCourse === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>${hasActiveFilters ? `<button class="btn secondary sm material-reset" data-material-clear="all" type="button">${icon('x')} Limpiar</button>` : ''}</div>${activeFilters.length ? `<div class="active-filter-row"><span>Filtros activos</span>${activeFilters.map(([kind, label]) => `<button class="filter-token" data-material-clear="${esc(kind)}" type="button">${esc(label)} ${icon('x')}</button>`).join('')}</div>` : ''}<div class="material-suggestions"><span>Ramos frecuentes</span><div class="quick-chip-row"><button class="${state.materialCourse === 'all' ? 'active' : ''}" data-material-course="all" type="button">Todos</button>${quickCourses.map(c => `<button class="${state.materialCourse === c.label ? 'active' : ''}" data-material-course="${esc(c.label)}" type="button">${esc(c.label)} <small>${c.count}</small></button>`).join('')}</div></div></div><div class="row-between material-count"><h2 class="card-title">${items.length} recursos encontrados</h2><span class="pill gray">Orden: recientes</span></div><div class="card table-card"><table class="data-table"><thead><tr><th>Recurso</th><th>Ramo</th><th>Sem.</th><th>Año</th><th>Estado</th><th></th></tr></thead><tbody>${items.map(r => `<tr class="clickable" data-resource-row="${esc(r.id)}"><td><strong>${esc(r.title)}</strong><br><span class="small muted">${esc(r.type)} - ${esc(r.format)}</span></td><td>${esc(r.courseName)}<br><span class="small muted">${esc(r.courseCode)}</span></td><td>${esc(r.semester)}</td><td>${esc(r.year)}</td><td>${badge(r.status)}</td><td>${icon('more')}</td></tr>`).join('')}</tbody></table></div><div class="mobile-card-list">${items.map(resourceCard).join('') || renderEmptyMaterial()}</div></section><aside class="card pad course-detail-panel">${selected ? renderResourceDetail(selected) : renderEmptyMaterial()}</aside></div>`;
  }
  function resourceCard(r) { return `<a class="item-card" href="#/material/${r.id}"><div class="row-between"><span class="icon-box">${icon('file')}</span>${badge(r.status)}</div><h3>${esc(r.title)}</h3><p>${esc(r.courseName)} - ${esc(r.format)} - ${esc(r.size)}</p></a>`; }
  function renderResourcePreview(r) {
    const previewUrl = drivePreviewUrl(r);
    if (!previewUrl) {
      return `<section class="resource-preview-shell resource-preview-empty"><div><span class="kicker">Vista previa</span><h2 class="card-title">Previsualización no disponible</h2><p class="small muted">Este recurso no tiene enlace embebible. Usa el botón de apertura para revisar el archivo completo.</p></div></section>`;
    }
    return `<section class="resource-preview-shell"><div class="resource-preview-head"><div><span class="kicker">Vista previa</span><h2 class="card-title">${esc(r.title)}</h2></div><a class="btn secondary sm" href="${esc(r.externalUrl)}" target="_blank" rel="noopener">${icon('arrow')} Abrir en Drive</a></div><iframe class="resource-preview-frame" src="${esc(previewUrl)}" title="Vista previa de ${esc(r.title)}" loading="lazy" allow="autoplay"></iframe></section>`;
  }
  function renderResourceDetail(r, options = {}) {
    const openAction = r.externalUrl
      ? `<a class="btn primary" href="${esc(r.externalUrl)}" target="_blank" rel="noopener">${icon('download')} Abrir material</a>`
      : `<button class="btn primary" data-download-resource="${esc(r.id)}">${icon('download')} Descargar</button>`;
    const actions = isGuest()
      ? `${openAction}<a class="btn ghost" href="#/ramo/${findCoursePlanForCode(r.courseCode)}/${encodeURIComponent(r.courseCode)}">Ver ramo ${icon('arrow')}</a>`
      : `<button class="btn secondary" data-save-resource="${esc(r.id)}">${icon('bookmark')} Guardar</button>${openAction}<button class="btn danger" data-report-resource="${esc(r.id)}">${icon('x')} Reportar error</button><a class="btn ghost" href="#/ramo/${findCoursePlanForCode(r.courseCode)}/${encodeURIComponent(r.courseCode)}">Ver ramo ${icon('arrow')}</a>`;
    const closeControl = options.hideClose ? '' : `<button class="icon-btn" data-clear-panel>${icon('x')}</button>`;
    return `<div class="row-between"><div><span class="kicker">Recurso seleccionado</span><h2 class="card-title">${esc(r.title)}</h2></div>${closeControl}</div><div class="hstack" style="flex-wrap:wrap">${badge(r.status)}<span class="pill blue">${esc(r.format)}</span><span class="pill gray">${esc(r.size)}</span></div><p class="small muted" style="line-height:1.55;margin-top:14px">${esc(r.description)}</p><div class="detail-block resource-meta-block"><div class="detail-row"><span>Ramo</span><strong>${esc(r.courseName)}</strong></div><div class="detail-row"><span>Código</span><strong>${esc(r.courseCode)}</strong></div><div class="detail-row"><span>Semestre</span><strong>${esc(r.semester)}</strong></div><div class="detail-row"><span>Año</span><strong>${esc(r.year)}</strong></div><div class="detail-row"><span>Origen</span><strong>${esc(r.origin)}</strong></div><div class="detail-row"><span>Subido por</span><strong>${esc(r.uploadedBy)}</strong></div></div><div class="vstack">${actions}</div>`;
  }
  function renderEmptyMaterial() { return `<div class="empty-state"><span class="icon-wrap">${icon('book')}</span><h3>Sin recursos visibles</h3><p>Prueba limpiar filtros o subir material para revisión.</p></div>`; }
  function renderMaterialDetailPage(id) {
    const r = Data.resources.find(x => x.id === id);
    if (!r) return renderNotFound('No encontramos el recurso solicitado.');
    const rPlan = Curricula[r.plan] ? r.plan : findCoursePlanForCode(r.courseCode);
    return `${pageHead('Detalle de recurso', `${r.courseName} - ${r.type}`, `<a class="btn secondary" href="#/material">Volver</a>`)}<div class="split wide resource-detail-layout"><section class="card pad resource-detail-main">${renderResourcePreview(r)}${renderResourceDetail(r, { hideClose: true })}</section><aside class="card pad"><h2 class="card-title">Ramo relacionado</h2>${findCourse(rPlan, r.courseCode) ? courseCard(rPlan, findCourse(rPlan, r.courseCode)) : '<p class="small muted">Recurso sin ramo asociado en malla.</p>'}</aside></div>`;
  }
  function renderUploadMaterial() {
    if (isGuest()) return `${pageHead('Subir material', 'Modo invitado en solo lectura', `<a class="btn secondary" href="#/material">Volver</a>`)}<section class="card pad empty-state"><span class="icon-wrap">${icon('eye')}</span><h3>Vista sin registros</h3><p>El modo invitado permite revisar contenido sin guardar actividad ni enviar aportes.</p><a class="btn primary" href="#/material">Volver a material</a></section>`;
    return `${pageHead('Subir material', 'Comparte un recurso para revisión CEAL', `<a class="btn secondary" href="#/material">Volver</a>`)}<div class="split"><form class="card pad form" data-form="upload-material"><div class="form-field"><label>Tipo de recurso</label><div class="segmented">${['Apunte','Guía','Prueba','PPT','PDF','Resumen','Otro'].map((t, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-select-segment="type">${t}</button>`).join('')}</div><input type="hidden" name="type" value="Apunte" /></div><div class="form-grid"><div class="form-field"><label>Título</label><input class="input" name="title" required minlength="6" /></div><div class="form-field"><label>Ramo</label><input class="input" name="course" required /></div></div><div class="form-grid"><div class="form-field"><label>Plan</label><select class="select" name="plan"><option value="planP">Plan P</option><option value="planO">Plan O</option><option value="both">Ambos</option></select></div><div class="form-field"><label>Año</label><select class="select" name="year"><option>2026</option><option>2025</option><option>2024</option><option>2023</option></select></div></div><div class="form-field"><label>Descripción</label><textarea class="textarea" name="description" required minlength="20"></textarea></div><div class="form-field"><label>Archivo</label><label class="upload-zone">${icon('upload')}<strong>Seleccionar archivo</strong><span class="help">PDF, DOCX, PPTX, PNG, JPG o ZIP</span><input class="sr-only" type="file" name="file" /></label></div><div class="form-field"><label>Fuente u origen</label><input class="input" name="origin" required /></div><label class="checkbox-row"><input type="checkbox" name="permission" required /> Confirmo que el recurso puede compartirse como apoyo académico.</label><div class="hstack"><button class="btn primary" type="submit">Enviar a revisión</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div></form><aside class="card pad"><h2 class="card-title">Proceso</h2>${timeline([{ title:'Enviado', detail:'Recibimos el aporte.', at:new Date() }, { title:'Revisión CEAL', detail:'Se revisa formato y ramo asociado.', at:new Date() }, { title:'Publicado u observado', detail:'Queda disponible o con observaciones.', at:new Date() }])}</aside></div>`;
  }

  function renderMallas() {
    const plan = state.mallaEmbedPlan === 'o' ? 'o' : 'p';
    const dark = state.mallaEmbedDark;
    const planLabelText = plan === 'o' ? 'Plan O - Catálogo 2016' : 'Plan P - Catálogo 2025';
    const accountLabel = isGuest() ? 'Invitado' : 'Mi cuenta';
    const originalUrl = `${MALLA_BASE_URL}malla-${plan}.html`;
    return `<section class="malla-workspace ${dark ? 'is-dark' : 'is-light'} ${state.mallaFocus ? 'is-focus' : ''}" aria-label="Malla curricular embebida">
        <header class="malla-commandbar">
          <a class="malla-commandbar-title" href="#/" aria-label="Volver al inicio del portal">
            <span class="malla-mini-mark">${icon('grid')}</span>
            <span>
              <strong>Mallas</strong>
              <small>${esc(planLabelText)}</small>
            </span>
          </a>
          <div class="malla-commandbar-actions">
            <div class="segmented malla-plan-tabs" aria-label="Seleccionar plan curricular">
              <button class="${plan === 'o' ? 'active' : ''}" data-malla-embed-plan="o">Plan O</button>
              <button class="${plan === 'p' ? 'active' : ''}" data-malla-embed-plan="p">Plan P</button>
            </div>
            <button class="malla-tool-btn ${dark ? 'active' : ''}" type="button" data-malla-embed-theme aria-pressed="${dark ? 'true' : 'false'}">${icon('moon')}<span>Oscuro</span></button>
            <button class="malla-tool-btn ${state.mallaFocus ? 'active' : ''}" type="button" data-malla-focus aria-pressed="${state.mallaFocus ? 'true' : 'false'}">${icon(state.mallaFocus ? 'minimize' : 'maximize')}<span>${state.mallaFocus ? 'Salir' : 'Foco'}</span></button>
            <a class="malla-tool-btn" href="#/perfil">${icon('user')}<span>${accountLabel}</span></a>
            <a class="malla-tool-btn subtle" href="${originalUrl}" target="_blank" rel="noopener">${icon('arrow')}<span>Original</span></a>
          </div>
        </header>
        <div class="malla-embed-frame-wrap" data-malla-frame-wrap>
          <div class="malla-embed-loading"><span class="icon-box">${icon('grid')}</span><strong>Cargando malla...</strong></div>
          <iframe class="malla-embed-frame" data-malla-frame data-plan="${plan}" data-theme="${dark ? 'dark' : 'light'}" title="Malla curricular ${plan === 'o' ? 'Plan O' : 'Plan P'}"></iframe>
        </div>
      </section>`;
  }
  function mallaEmbedUrl(plan) { return `${MALLA_BASE_URL}malla-${plan === 'o' ? 'o' : 'p'}.html`; }
  async function getMallaEmbedHtml(plan) {
    const key = plan === 'o' ? 'o' : 'p';
    if (!mallaEmbedCache[key]) {
      mallaEmbedCache[key] = fetch(mallaEmbedUrl(key)).then(res => {
        if (!res.ok) throw new Error(`malla ${res.status}`);
        return res.text();
      });
    }
    return mallaEmbedCache[key];
  }
  async function hydrateMallaEmbed() {
    const frame = app.querySelector('[data-malla-frame]');
    if (!frame) return;
    const wrap = frame.closest('[data-malla-frame-wrap]');
    const plan = frame.dataset.plan === 'o' ? 'o' : 'p';
    const theme = frame.dataset.theme === 'dark' ? 'dark' : 'light';
    const loadKey = `${plan}:${theme}`;
    frame.dataset.loadKey = loadKey;
    wrap?.classList.remove('is-loaded', 'is-fallback');
    const markLoaded = () => wrap?.classList.add('is-loaded');
    frame.addEventListener('load', markLoaded, { once: true });
    try {
      const html = await getMallaEmbedHtml(plan);
      if (!app.contains(frame) || frame.dataset.loadKey !== loadKey) return;
      frame.srcdoc = buildMallaSrcdoc(html, plan, theme);
    } catch {
      if (!app.contains(frame) || frame.dataset.loadKey !== loadKey) return;
      wrap?.classList.add('is-fallback');
      frame.src = mallaEmbedUrl(plan);
    }
  }
  function buildMallaSrcdoc(html, plan, theme) {
    const bootstrap = `<base href="${MALLA_BASE_URL}"><script>try{localStorage.setItem('mc-theme','${theme}');}catch(e){}document.documentElement.classList.toggle('mc-light','${theme}'==='light');<\/script>`;
    const styles = `<style>${mallaEmbedThemeStyles(theme, plan)}</style>`;
    const guidance = mallaEmbedGuidanceScript();
    return html
      .replace(/<head>/i, `<head>${bootstrap}`)
      .replace(/<\/head>/i, `${styles}</head>`)
      .replace(/<\/body>/i, `${guidance}</body>`);
  }
  function mallaEmbedThemeStyles(theme, plan) {
    const isDark = theme === 'dark';
    const planAccent = plan === 'o' ? '#126fe3' : '#0891b2';
    return `
      :root {
        --mc-card-radius: 8px;
        --mc-transition-fast: 140ms cubic-bezier(0.4,0,0.2,1);
        --mc-transition-normal: 190ms cubic-bezier(0.4,0,0.2,1);
        --mc-transition-slide: 220ms cubic-bezier(0,0,0.2,1);
        --mc-font-card-name: .72rem;
      }
      ${isDark ? `
      html:not(.mc-light), :root {
        color-scheme: dark;
        --mc-bg-base:#061b34; --mc-bg-surface:#092747; --mc-bg-elevated:#123a64; --mc-bg-hover:#174b7d;
        --mc-text-primary:#f8fafc; --mc-text-secondary:#d7e2ee; --mc-text-muted:#8fa6c1;
        --mc-area-basica:#60a5fa; --mc-area-basica-bg:rgba(96,165,250,.16);
        --mc-area-ingenieria:#a78bfa; --mc-area-ingenieria-bg:rgba(167,139,250,.16);
        --mc-area-aplicada:#fb923c; --mc-area-aplicada-bg:rgba(251,146,60,.16);
        --mc-area-general:#22c55e; --mc-area-general-bg:rgba(34,197,94,.15);
        --mc-area-proyecto:#22d3ee; --mc-area-proyecto-bg:rgba(34,211,238,.14);
        --mc-area-electivo:#cbd5e1; --mc-area-electivo-bg:rgba(203,213,225,.14);
      }` : `
      html.mc-light, :root {
        color-scheme: light;
        --mc-bg-base:#f5f8fc; --mc-bg-surface:#ffffff; --mc-bg-elevated:#edf4fb; --mc-bg-hover:#e8f2ff;
        --mc-text-primary:#041f3d; --mc-text-secondary:#334155; --mc-text-muted:#64748b;
        --mc-area-basica:#126fe3; --mc-area-basica-bg:rgba(18,111,227,.10);
        --mc-area-ingenieria:#7c3aed; --mc-area-ingenieria-bg:rgba(124,58,237,.10);
        --mc-area-aplicada:#f97316; --mc-area-aplicada-bg:rgba(249,115,22,.12);
        --mc-area-general:#16a34a; --mc-area-general-bg:rgba(22,163,74,.10);
        --mc-area-proyecto:#0891b2; --mc-area-proyecto-bg:rgba(8,145,178,.11);
        --mc-area-electivo:#475569; --mc-area-electivo-bg:rgba(71,85,105,.10);
      }`}
      body {
        min-height: 100vh;
        background: ${isDark ? 'linear-gradient(180deg,#061b34 0%,#08213f 100%)' : 'linear-gradient(180deg,#f8fbff 0%,#edf4fb 100%)'} !important;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
      .mc-header {
        background: ${isDark ? 'rgba(9,39,71,.92)' : 'rgba(255,255,255,.92)'} !important;
        border-bottom-color: ${isDark ? 'rgba(215,226,238,.12)' : 'rgba(191,208,227,.82)'} !important;
        box-shadow: 0 10px 30px ${isDark ? 'rgba(0,0,0,.18)' : 'rgba(15,23,42,.06)'} !important;
      }
      .mc-header__title h1 { color: var(--mc-text-primary); letter-spacing:0 !important; }
      .mc-header__subtitle { color: var(--mc-text-secondary); }
      .mc-header__hint { color: var(--mc-text-muted); border-color:${isDark ? 'rgba(215,226,238,.12)' : 'rgba(191,208,227,.7)'}; }
      .mc-theme-toggle { display:none !important; }
      .mc-card {
        border-radius: 8px !important;
        border-color: ${isDark ? 'rgba(215,226,238,.12)' : 'rgba(191,208,227,.82)'} !important;
        box-shadow: 0 1px 2px rgba(15,23,42,.05), 0 10px 22px ${isDark ? 'rgba(0,0,0,.12)' : 'rgba(15,23,42,.05)'} !important;
      }
      .mc-card:hover { transform: translateY(-1px); }
      .mc-card--highlight-self { box-shadow:0 0 0 2px ${planAccent},0 0 0 5px rgba(249,115,22,.28),0 16px 38px rgba(15,23,42,.18) !important; }
      .mc-footer,
      .mc-zoom-controls,
      .mc-search__inner,
      .mc-tooltip,
      .mc-modal {
        background: ${isDark ? 'rgba(9,39,71,.94)' : 'rgba(255,255,255,.96)'} !important;
        border-color: ${isDark ? 'rgba(215,226,238,.14)' : 'rgba(191,208,227,.82)'} !important;
      }
      .mc-zoom-btn,
      .mc-search__close,
      .mc-modal__close {
        border-radius: 8px !important;
      }
      .mc-grid::-webkit-scrollbar-thumb { background:${isDark ? '#28547f' : '#bfd0e3'}; }
      .mc-portal-scroll-hint {
        position: fixed;
        left: 50%;
        z-index: 360;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        max-width: calc(100vw - 24px);
        padding: 7px 12px;
        border: 1px solid ${isDark ? 'rgba(215,226,238,.18)' : 'rgba(191,208,227,.95)'};
        border-radius: 999px;
        background: ${isDark ? 'rgba(9,39,71,.9)' : 'rgba(255,255,255,.94)'};
        color: ${isDark ? '#d7e2ee' : '#17365f'};
        box-shadow: 0 10px 30px ${isDark ? 'rgba(0,0,0,.24)' : 'rgba(15,23,42,.12)'};
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        font-size: .72rem;
        font-weight: 820;
        line-height: 1;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 150ms ease, transform 180ms cubic-bezier(0,0,0.2,1);
      }
      .mc-portal-scroll-hint--top {
        top: 58px;
        transform: translate(-50%, -8px);
      }
      .mc-portal-scroll-hint--bottom {
        bottom: 70px;
        transform: translate(-50%, 8px);
      }
      .mc-portal-scroll-hint.is-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translate(-50%, 0);
      }
      .mc-portal-scroll-hint__arrow {
        color: ${planAccent};
        font-size: .9rem;
        line-height: 1;
      }
      .mc-portal-scroll-hint__label {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      @media (max-width: 640px) {
        .mc-header { height: 52px; padding: 0 10px; }
        .mc-grid { min-height: calc(100vh - 52px); padding: 8px 8px 14px !important; }
        .mc-footer { padding-bottom: 12px; }
      }
      @media (min-width: 641px) {
        .mc-portal-scroll-hint { display:none !important; }
      }
    `;
  }
  function mallaEmbedGuidanceScript() {
    return `<script>
      (function() {
        var mq = window.matchMedia ? window.matchMedia('(max-width: 640px)') : { matches: false };
        var topHint = null;
        var bottomHint = null;
        var hideTimer = null;
        var activeCode = null;
        function ensureHint(direction) {
          var el = direction === 'top' ? topHint : bottomHint;
          if (el) return el;
          el = document.createElement('button');
          el.type = 'button';
          el.className = 'mc-portal-scroll-hint mc-portal-scroll-hint--' + direction;
          el.setAttribute('aria-hidden', 'true');
          el.innerHTML = '<span class="mc-portal-scroll-hint__arrow">' + (direction === 'top' ? '↑' : '↓') + '</span><span class="mc-portal-scroll-hint__label"></span>';
          el.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scrollToRelated(direction);
          });
          document.body.appendChild(el);
          if (direction === 'top') topHint = el;
          else bottomHint = el;
          return el;
        }
        function hideHints() {
          [topHint, bottomHint].forEach(function(el) {
            if (!el) return;
            el.classList.remove('is-visible');
            el.setAttribute('aria-hidden', 'true');
          });
        }
        function selectedCode() {
          return activeCode || document.querySelector('.mc-card--highlight-self[data-mc-code]')?.dataset.mcCode || null;
        }
        function applyActiveHighlight() {
          var code = selectedCode();
          var MC = window.__MC;
          if (!code || !MC?.highlightChain) return;
          activeCode = code;
          MC.clearHighlight?.();
          MC.highlightChain(code);
        }
        function labelFor(flags, direction) {
          if (flags.prereq && flags.successor) return 'Relaciones ' + (direction === 'top' ? 'arriba' : 'abajo');
          if (flags.prereq) return 'Requisitos ' + (direction === 'top' ? 'arriba' : 'abajo');
          if (flags.successor) return 'Ramos que abre ' + (direction === 'top' ? 'arriba' : 'abajo');
          return '';
        }
        function setHint(direction, flags) {
          var label = labelFor(flags, direction);
          var el = ensureHint(direction);
          el.querySelector('.mc-portal-scroll-hint__label').textContent = label;
          el.classList.toggle('is-visible', Boolean(label));
          el.setAttribute('aria-hidden', label ? 'false' : 'true');
        }
        function cardByCode(code) {
          var cards = document.querySelectorAll('.mc-card[data-mc-code]');
          for (var i = 0; i < cards.length; i++) {
            if (cards[i].dataset.mcCode === code) return cards[i];
          }
          return null;
        }
        function relatedCards() {
          var MC = window.__MC;
          var items = [];
          if (activeCode && MC) {
            (MC.getDirectPrereqs?.(activeCode) || []).forEach(function(code) {
              var el = cardByCode(code);
              if (el) items.push({ el: el, kind: 'prereq' });
            });
            (MC.getDirectDependents?.(activeCode) || []).forEach(function(code) {
              var el = cardByCode(code);
              if (el) items.push({ el: el, kind: 'successor' });
            });
            return items;
          }
          return Array.prototype.slice.call(document.querySelectorAll('.mc-card--highlight-prereq, .mc-card--highlight-successor')).map(function(el) {
            return { el: el, kind: el.classList.contains('mc-card--highlight-prereq') ? 'prereq' : 'successor' };
          });
        }
        function isModalOpen() {
          var modal = document.getElementById('mc-modal-overlay');
          return modal && modal.classList.contains('mc-modal-overlay--visible');
        }
        function updateHints() {
          if (!mq.matches || isModalOpen()) {
            hideHints();
            return;
          }
          var selected = selectedCode();
          if (!selected) {
            hideHints();
            return;
          }
          activeCode = selected;
          var topLimit = 56;
          var bottomLimit = window.innerHeight - 76;
          var topFlags = { prereq: false, successor: false };
          var bottomFlags = { prereq: false, successor: false };
          relatedCards().forEach(function(item) {
            var rect = item.el.getBoundingClientRect();
            var kind = item.kind;
            if (rect.bottom < topLimit) topFlags[kind] = true;
            else if (rect.top > bottomLimit) bottomFlags[kind] = true;
          });
          setHint('top', topFlags);
          setHint('bottom', bottomFlags);
          clearTimeout(hideTimer);
          hideTimer = setTimeout(updateHints, 450);
        }
        function scrollToRelated(direction) {
          applyActiveHighlight();
          var topLimit = 56;
          var bottomLimit = window.innerHeight - 76;
          var candidates = relatedCards().filter(function(item) {
            var rect = item.el.getBoundingClientRect();
            return direction === 'top' ? rect.bottom < topLimit : rect.top > bottomLimit;
          });
          if (!candidates.length) return;
          candidates.sort(function(a, b) {
            var ar = a.el.getBoundingClientRect();
            var br = b.el.getBoundingClientRect();
            return direction === 'top' ? br.bottom - ar.bottom : ar.top - br.top;
          });
          candidates[0].el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          applyActiveHighlight();
          setTimeout(applyActiveHighlight, 80);
          setTimeout(applyActiveHighlight, 240);
          setTimeout(updateHints, 360);
        }
        document.addEventListener('click', function(e) {
          var hint = e.target.closest?.('.mc-portal-scroll-hint');
          if (hint) {
            e.preventDefault();
            e.stopImmediatePropagation();
            scrollToRelated(hint.classList.contains('mc-portal-scroll-hint--top') ? 'top' : 'bottom');
            return;
          }
          var card = e.target.closest?.('.mc-card[data-mc-code]');
          if (card) activeCode = card.dataset.mcCode;
          else if (!e.target.closest?.('.mc-portal-scroll-hint') && !e.target.closest?.('.mc-peek')) activeCode = null;
          setTimeout(updateHints, 90);
        }, true);
        ['pointerdown', 'touchstart', 'touchend', 'mousedown'].forEach(function(type) {
          document.addEventListener(type, function(e) {
            if (!e.target.closest?.('.mc-portal-scroll-hint')) return;
            e.stopImmediatePropagation();
          }, true);
        });
        document.addEventListener('touchend', function(e) {
          if (e.target.closest?.('.mc-portal-scroll-hint')) {
            setTimeout(applyActiveHighlight, 0);
            setTimeout(updateHints, 120);
            return;
          }
          setTimeout(updateHints, 120);
        }, { passive: true });
        window.addEventListener('scroll', updateHints, { passive: true });
        var grid = document.getElementById('mc-grid');
        if (grid) grid.addEventListener('scroll', updateHints, { passive: true });
        if (mq.addEventListener) mq.addEventListener('change', updateHints);
        else if (mq.addListener) mq.addListener(updateHints);
        setTimeout(updateHints, 400);
      })();
    <\/script>`;
  }
  function courseCard(plan, c, selected = null, selectedCodes = new Set()) {
    const isSelected = selected?.code === c.code;
    const dimmed = selected && !selectedCodes.has(c.code);
    const prereq = selected && (selected.prereqs || []).includes(c.code);
    const successor = selected && (c.prereqs || []).includes(selected.code);
    return `<button class="course-card ${isSelected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''} ${prereq ? 'prereq' : ''} ${successor ? 'successor' : ''}" data-course="${esc(c.code)}" data-course-plan="${plan}"><span class="course-code">${esc(c.visibleCode || c.code)}</span><strong class="course-title">${esc(titleCase(c.name))}</strong><span class="course-meta"><span class="sct">${c.sct || 0} SCT</span>${badge(getProgress(plan, c.code))}</span></button>`;
  }
  function renderCourseDetail(course, plan, inline = false) {
    const prereqs = getPrereqs(plan, course);
    const successors = getSuccessors(plan, course.code);
    const resources = getResourcesForCourse(plan, course.code);
    return `<div class="course-detail-head"><div><span class="kicker">${esc(course.visibleCode || course.code)}</span><h2 class="card-title">${esc(titleCase(course.name))}</h2></div>${inline ? `<button class="icon-btn" aria-label="Cerrar detalle" title="Cerrar detalle" data-clear-panel>${icon('x')}</button>` : ''}</div><div class="hstack" style="flex-wrap:wrap">${badge(getProgress(plan, course.code))}<span class="pill blue">${course.semester} semestre</span><span class="pill gray">${course.sct || 0} SCT</span></div><p class="small muted" style="line-height:1.6">${esc(course.description || getPlanData(plan).descriptions?.[course.code] || 'Ficha curricular del ramo.')}</p><div class="detail-block"><div class="detail-row"><span>Plan</span><strong>${planShort(plan)}</strong></div><div class="detail-row"><span>Área</span><strong>${esc(AreaStyle[course.area] || course.area)}</strong></div><div class="detail-row"><span>Tipo</span><strong>${esc(course.type || 'Asignatura curricular')}</strong></div></div><div class="grid two"><section><h3 class="card-title">Prerrequisitos</h3>${prereqs.map(p => miniCourse(plan, p)).join('') || '<p class="small muted">Sin prerrequisitos.</p>'}</section><section><h3 class="card-title">Ramos que abre</h3>${successors.slice(0,4).map(s => miniCourse(plan, s)).join('') || '<p class="small muted">No abre ramos directos.</p>'}</section></div><div class="detail-block"><h3 class="card-title">Recursos asociados</h3>${resources.slice(0,3).map(r => `<a class="link-card-row" href="#/material/${r.id}"><span><strong>${esc(r.title)}</strong><span>${esc(r.type)} - ${esc(r.format)}</span></span>${icon('arrow')}</a>`).join('') || '<p class="small muted">Sin recursos asociados.</p>'}</div><div class="hstack"><a class="btn primary" href="#/material?course=${encodeURIComponent(course.code)}">Ver material</a><button class="btn secondary" data-save-course="${courseKey(plan, course.code)}">Agregar seguimiento</button></div>`;
  }
  function miniCourse(plan, c) { return `<a class="link-card-row" href="#/ramo/${plan}/${encodeURIComponent(c.code)}"><span><strong>${esc(titleCase(c.name))}</strong><span>${esc(c.visibleCode || c.code)}</span></span>${badge(getProgress(plan, c.code))}</a>`; }
  function renderCourseDetailPage(plan, code) { const c = findCourse(plan, code); return c ? `${pageHead(titleCase(c.name), `${planLabel(plan)} - ${c.visibleCode || c.code}`, `<a class="btn secondary" href="#/mallas">Volver a malla</a>`)}<div class="split wide"><section class="card pad">${renderCourseDetail(c, plan, false)}</section><aside class="card pad"><h2 class="card-title">Conexiones</h2>${getResourcesForCourse(plan, c.code).map(r => resourceCard(r)).join('') || '<p class="small muted">Sin recursos asociados.</p>'}</aside></div>` : renderNotFound('No encontramos el ramo.'); }

  function renderSupport() { return renderMaterial(); }
  function tutoringCard(t) { return `<a class="item-card" href="#/ayudantias/${t.id}"><div class="row-between"><span class="icon-box">${icon('users')}</span><span class="pill blue">${esc(t.mode)}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.courseName)} - ${fmtDate(t.date)} - ${esc(t.time)} - ${esc(t.location)}</p></a>`; }
  function procedureCard(p) { return `<a class="item-card" href="#/tramites/${p.id}"><div class="row-between"><span class="icon-box orange">${icon('file')}</span>${badge(p.status)}</div><h3>${esc(p.title)}</h3><p>Vence: ${fmtDate(p.due)}<br>${esc(p.responsible)}</p></a>`; }
  function renderTutoringDetail(id) {
    const t = Data.tutoring.find(x => x.id === id);
    const reminderAction = isGuest() ? '' : `<button class="btn primary" data-save-reminder="${esc(t?.id || '')}">${icon('bell')} Guardar recordatorio</button>`;
    const materialRoute = t && Data.resources.some(r => r.id === t.materialId) ? `/material/${t.materialId}` : '/material';
    return t ? `${pageHead(t.title, `${t.courseName} - ${fmtDate(t.date)}`, `<a class="btn secondary" href="#/apoyo">Volver</a>`)}<div class="split"><section class="card pad"><h2 class="card-title">Detalle de ayudantía</h2><div class="detail-block"><div class="detail-row"><span>Ramo</span><strong>${esc(t.courseName)}</strong></div><div class="detail-row"><span>Hora</span><strong>${esc(t.time)}</strong></div><div class="detail-row"><span>Lugar</span><strong>${esc(t.location)}</strong></div><div class="detail-row"><span>Ayudante</span><strong>${esc(t.tutor)}</strong></div></div><div class="hstack">${reminderAction}<a class="btn secondary" href="#${materialRoute}">Buscar material</a></div></section><aside class="card pad"><a class="btn secondary full" href="#/ramo/${findCoursePlanForCode(t.courseCode)}/${encodeURIComponent(t.courseCode)}">Ver ramo</a></aside></div>` : renderNotFound();
  }
  function renderProcedureDetail(id) { const p = Data.procedures.find(x => x.id === id); return p ? `${pageHead(p.title, `Vence ${fmtDate(p.due)}`, `<a class="btn secondary" href="#/apoyo">Volver</a>`)}<div class="split"><section class="card pad">${badge(p.status)}<p class="muted">${esc(p.description)}</p><h2 class="card-title">Documentos requeridos</h2>${p.required.map(r => `<div class="link-card-row"><span><strong>${esc(r)}</strong><span>Requisito</span></span>${icon('check')}</div>`).join('')}<div class="divider"></div><a class="btn primary" href="#/mallas">Revisar mallas</a></section><aside class="card pad"><h2 class="card-title">Apoyo</h2><p class="small muted">Revisa mallas, calendario y recursos antes de iniciar una gestión académica.</p></aside></div>` : renderNotFound(); }

  function renderManagement() {
    const pendingMaterial = Data.resources.filter(r => r.status === 'pendienteRevision');
    const firstMaterial = pendingMaterial[0]?.id || Data.resources[0]?.id || '';
    const modules = [
      ['publish:comunicados','megaphone','Publicar comunicado','Redacta y publica avisos.','/gestion/comunicados/com-paro-005/editar'],
      ['edit:calendario','calendar','Editar calendario','Gestiona fechas académicas oficiales.','/calendario'],
      ['upload:acuerdos','file','Registrar contingencia','Registra seguimiento y compromisos.','/gestion/acuerdos/nuevo'],
      ['validate:material','book','Validar material','Aprueba recursos enviados.', firstMaterial ? '/gestion/material/' + firstMaterial + '/validar' : '/material'],
      ['edit:mallas','grid','Actualizar mallas','Revisa enlaces y fichas de ramos.','/mallas'],
      ['manage:roles','users','Panel común CEAL','Acceso compartido para la directiva.','/gestion']
    ];
    const visibleModules = modules.map(m => `<a class="management-card" href="#${m[4]}"><span class="icon-box">${icon(m[1])}</span><strong>${esc(m[2])}</strong><span>${esc(m[3])}</span><em>Disponible para CEAL</em></a>`).join('');
    const communicationRows = Data.communications.slice(0, 5).map(c => `<a class="link-card-row" href="#/gestion/comunicados/${c.id}/editar"><span><strong>${esc(c.title)}</strong><span>${esc(c.category)} - ${fmtDate(c.date)}</span></span><span class="link">Editar ${icon('arrow')}</span></a>`).join('');
    const materialRows = Data.resources.slice(0, 5).map(r => {
      const href = r.status === 'pendienteRevision' ? `/gestion/material/${r.id}/validar` : `/material/${r.id}`;
      const action = r.status === 'pendienteRevision' ? 'Validar' : 'Ver';
      return `<a class="link-card-row" href="#${href}"><span><strong>${esc(r.title)}</strong><span>${esc(r.courseName)} - ${esc(r.type)}</span></span><span class="hstack">${badge(r.status)}<span class="link">${action} ${icon('arrow')}</span></span></a>`;
    }).join('');
    const agreementRows = Data.agreements.slice(0, 4).map(a => `<a class="link-card-row" href="#/acuerdos/${a.id}"><span><strong>${esc(a.number || a.title)}</strong><span>${esc(a.title)} - ${fmtDate(a.date)}</span></span>${badge(a.status)}</a>`).join('');
    return `${pageHead('Gestión CEAL', 'Panel común para administrar contenido, mallas y contingencia', `<span class="pill blue">Acceso CEAL</span>`)}
      <div class="vstack">
        <section class="card pad"><div class="row-between"><h2 class="card-title">Tablero general</h2><span class="pill gray">Gestión activa</span></div><div class="stat-grid compact">${stat('book', pendingMaterial.length, 'Material', 'Por validar')}${stat('megaphone', Data.communications.length, 'Comunicados', 'Editables')}${stat('file', Data.agreements.filter(a => a.status !== 'publicado').length, 'Contingencia', 'En seguimiento')}${stat('grid', 2, 'Mallas', 'Activas')}</div></section>
        <section class="card pad"><h2 class="card-title">Gestión de contenido</h2><div class="management-modules">${visibleModules}</div></section>
        <div class="management-content-grid">
          <section class="card pad"><div class="row-between"><h2 class="card-title">Comunicados publicados</h2><a class="btn secondary sm" href="#/gestion/comunicados/com-paro-005/editar">Editar destacado</a></div><div class="card-list">${communicationRows || '<p class="small muted">No hay comunicados cargados.</p>'}</div></section>
          <section class="card pad"><div class="row-between"><h2 class="card-title">Material y aportes</h2><a class="btn secondary sm" href="#/material/subir">Subir material</a></div><div class="card-list">${materialRows || '<p class="small muted">No hay material cargado.</p>'}</div></section>
          <section class="card pad"><div class="row-between"><h2 class="card-title">Contingencia del paro</h2><a class="btn secondary sm" href="#/gestion/acuerdos/nuevo">Nuevo seguimiento</a></div><div class="card-list">${agreementRows || '<p class="small muted">No hay seguimientos cargados.</p>'}</div></section>
        </div>
      </div>`;
  }
  function ensureCEAL(content) { return hasCealAccess() ? content : `${pageHead('Sin permisos', 'Esta sección es de uso interno CEAL')}<section class="card pad empty-state"><span class="icon-wrap">${icon('settings')}</span><h3>Acceso restringido</h3><button class="btn secondary" data-logout>Cambiar rol</button></section>`; }
  function renderEditor(id) {
    const c = Data.communications.find(x => x.id === id) || Data.communications[0] || {};
    return `${pageHead('Editar comunicado', 'Actualiza contenido antes de publicar', `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="editor-layout"><form class="card pad form" data-form="edit-content"><input type="hidden" name="id" value="${esc(c.id || '')}" /><div class="form-field"><label>Título</label><input class="input" name="title" value="${esc(c.title || '')}" required /></div><div class="form-grid"><div class="form-field"><label>Categoría</label><select class="select" name="category">${['Contingencia','Académico','Material','CEAL'].map(x => `<option ${plain(c.category) === plain(x) ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>Resumen</label><input class="input" name="summary" value="${esc(c.summary || '')}" required /></div></div><div class="form-field"><label>Contenido</label><textarea class="textarea" name="body" required>${esc(c.body || '')}</textarea></div><div class="hstack"><button class="btn secondary" type="submit">Guardar borrador</button><button class="btn primary" type="button" data-publish>Publicar</button></div></form><aside class="card pad"><h2 class="card-title">Vista previa</h2>${c.id ? commCard(c) : '<p class="small muted">Completa el comunicado.</p>'}</aside></div>`;
  }
  function renderValidateMaterial(id) { const r = Data.resources.find(x => x.id === id) || Data.resources.find(x => x.status === 'pendienteRevision'); return r ? `${pageHead('Validar material', `${r.title} - ${r.courseName}`, `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="split"><section class="card pad">${renderResourceDetail(r)}</section><aside class="card pad"><h2 class="card-title">Revisión CEAL</h2><div class="form-field"><label>Observaciones</label><textarea class="textarea" placeholder="Agrega observaciones internas"></textarea></div><button class="btn primary full" data-approve-material="${esc(r.id)}">Validar y publicar</button><button class="btn danger full" data-observe-material="${esc(r.id)}">Marcar con observaciones</button></aside></div>` : renderNotFound(); }
  function renderAgreementForm() { return `${pageHead('Nuevo seguimiento', 'Registra una decisión, avance o compromiso de contingencia', `<a class="btn secondary" href="#/gestion">Volver</a>`)}<form class="card pad form" data-form="new-agreement"><div class="form-field"><label>Título del seguimiento</label><input class="input" name="title" required /></div><div class="form-grid"><div class="form-field"><label>Origen</label><input class="input" name="origin" required placeholder="Pleno, mesa, comunicado" /></div><div class="form-field"><label>Estado inicial</label><select class="select" name="status"><option value="enSeguimiento">En seguimiento</option><option value="pendiente">Pendiente</option><option value="publicado">Publicado</option></select></div></div><div class="form-field"><label>Resumen</label><textarea class="textarea" name="summary" required minlength="20"></textarea></div><div class="form-grid"><div class="form-field"><label>Responsable</label><input class="input" name="responsible" value="${esc(state.user.label)}" required /></div><div class="form-field"><label>Próximo paso</label><input class="input" name="nextStep" required /></div></div><div class="form-field"><label>Compromiso inicial</label><input class="input" name="commitment" placeholder="Opcional" /></div><div class="hstack"><button class="btn primary" type="submit">Crear seguimiento</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div></form>`; }

  function renderProfile() {
    const u = state.user;
    if (isGuest()) {
      return `${pageHead('Invitado', 'Vista sin registros', `<button class="btn danger" data-logout>${icon('x')} Salir</button>`)}
        <section class="card pad"><div class="profile-hero guest-profile"><span class="avatar big">${esc(u.initials)}</span><div><h2 class="card-title">Modo invitado</h2><div class="hstack" style="flex-wrap:wrap">${badge('blue','Solo lectura')}<span class="pill gray">No guarda sesión</span></div><p class="small muted">Puedes revisar mallas, material, calendario y comunicados sin dejar registros en el portal.</p></div><a class="btn primary" href="#/mallas">Ver mallas</a></div></section>
        <div class="grid four" style="margin-top:18px">${access('grid','Mallas','Plan O y Plan P integrados.','Abrir','/mallas','blue')}${access('book','Material','Recursos visibles por ramo.','Explorar','/material')}${access('calendar','Calendario','Fechas académicas oficiales.','Revisar','/calendario')}${access('file','Contingencia','Comunicados y seguimiento del paro.','Abrir','/contingencia','orange')}</div>`;
    }
    return `${pageHead('Mi cuenta', 'Perfil, preferencias y seguimiento personal', `<button class="btn danger" data-logout>${icon('x')} Cerrar sesión</button>`)}<section class="card pad"><div class="profile-hero"><span class="avatar big">${esc(u.initials)}</span><div><h2 class="card-title">${esc(u.name)}</h2><div class="hstack" style="flex-wrap:wrap">${badge('green','Cuenta activa')}<span class="pill blue">${esc(hasCealAccess() ? u.label : 'Estudiante')}</span><span class="pill gray">${planShort(u.plan)} - ${esc(u.yearLabel)}</span></div><p class="small muted">${esc(u.email)}</p></div><a class="btn secondary" href="#/mallas">Ver mi malla</a></div></section><div class="grid four" style="margin-top:18px">${stat('grid', Data.saved.courses.length, 'Ramos', 'Seguimiento')}${stat('book', Data.saved.resources.length, 'Recursos', 'Guardados')}${stat('calendar', Data.events.length, 'Fechas', 'Visibles')}${stat('bell', Data.saved.reminders.length, 'Recordatorios', 'Activos')}</div><div class="grid two" style="margin-top:18px"><section class="card pad"><h2 class="card-title">Actividad reciente</h2>${Data.notifications.map(n => `<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} - ${esc(n.date)}</span></span>${icon('arrow')}</a>`).join('')}</section><section class="card pad"><h2 class="card-title">Preferencias</h2>${['Recibir recordatorios','Mostrar solo mi plan','Alertas de comunicados','Modo compacto'].map((p, i) => `<label class="link-card-row"><span><strong>${p}</strong><span>${i < 3 ? 'Activado' : 'Disponible'}</span></span><input type="checkbox" ${i < 3 ? 'checked' : ''} /></label>`).join('')}</section></div>`;
  }
  function renderSearch(query) {
    const q = String(query || '').trim();
    const normalized = plain(q);
    const rows = q ? [
      ...['planO','planP'].flatMap(plan => getCourses(plan).filter(c => plain([c.name, c.code, c.visibleCode].join(' ')).includes(normalized)).slice(0, 4).map(c => resultRow('grid', titleCase(c.name), `${planLabel(plan)} - ${c.visibleCode || c.code}`, `/ramo/${plan}/${encodeURIComponent(c.code)}`))),
      ...Data.resources.filter(r => plain([r.title, r.courseName, r.courseCode, r.type].join(' ')).includes(normalized)).slice(0, 5).map(r => resultRow('book', r.title, `${r.courseName} - ${r.type}`, `/material/${r.id}`)),
      ...Data.communications.filter(c => plain([c.title, c.summary, c.category].join(' ')).includes(normalized)).slice(0, 4).map(c => resultRow('megaphone', c.title, `${c.category} - ${fmtDate(c.date)}`, `/comunicados/${c.id}`)),
      ...Data.agreements.filter(a => plain([a.title, a.summary, a.origin].join(' ')).includes(normalized)).slice(0, 4).map(a => resultRow('file', a.title, `${a.origin} - ${fmtDate(a.date)}`, `/acuerdos/${a.id}`))
    ] : [];
    return `${pageHead('Búsqueda', q ? `Resultados para ${q}` : 'Busca ramos, material, fechas, contingencia y comunicados')}<section class="card pad"><form data-search-page-form class="form-field"><label>Buscar</label><input class="input" name="q" value="${esc(q)}" /></form></section><section class="result-group">${rows.join('') || renderEmpty('Sin resultados', 'Prueba con otro término.')}</section>`;
  }
  function resultRow(ico, title, desc, route) { return `<a class="result-row" href="#${route}"><span class="icon-box">${icon(ico)}</span><span><strong>${esc(title)}</strong><p>${esc(desc)}</p></span><span class="link">Abrir ${icon('arrow')}</span></a>`; }
  function renderMore() { const items = navItems().filter(([href]) => !['/','/calendario','/mallas','/material'].includes(href)); const accountLabel = isGuest() ? 'Invitado' : 'Mi cuenta'; return `${pageHead('Más', 'Accesos secundarios del portal')}<section class="card pad"><div class="card-list">${items.map(([href, ico, label]) => `<a class="link-card-row" href="#${href}"><span class="hstack">${icon(ico)}<strong>${label}</strong></span>${icon('arrow')}</a>`).join('')}<a class="link-card-row" href="#/perfil"><span class="hstack">${icon('user')}<strong>${accountLabel}</strong></span>${icon('arrow')}</a><button class="link-card-row" data-logout><span class="hstack">${icon('x')}<strong>${isGuest() ? 'Salir del modo invitado' : 'Cerrar sesión'}</strong></span>${icon('arrow')}</button></div></section>`; }
  function renderNotificationsPage() { return `${pageHead('Notificaciones', 'Actualizaciones relevantes del portal')}<section class="card pad">${Data.notifications.map(n => `<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} - ${esc(n.date)}</span></span>${n.unread ? badge('orange','Nueva') : badge('gray','Leída')}</a>`).join('')}</section>`; }
  function renderNotificationPopover() { return `<aside class="notification-popover"><header><strong>Notificaciones</strong><button class="icon-btn" data-close-notifications>${icon('x')}</button></header>${Data.notifications.map(n => `<a class="not-row" href="#${n.route}"><span class="not-dot"></span><span><strong>${esc(n.title)}</strong><p>${esc(n.detail)}</p><small>${esc(n.date)}</small></span></a>`).join('')}</aside>`; }
  function renderNotFound(message = 'No encontramos la vista solicitada.') { return `${pageHead('No encontrado')}<section class="card pad empty-state"><span class="icon-wrap">${icon('search')}</span><h3>${esc(message)}</h3><a class="btn primary" href="#/">Volver al inicio</a></section>`; }
  function renderEmpty(title, desc) { return `<div class="empty-state"><span class="icon-wrap">${icon('search')}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`; }
  function timeline(items) { return `<div class="timeline">${items.map(h => `<div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>${esc(h.title)}</strong><span>${h.at ? `${fmtDate(h.at)} - ` : ''}${esc(h.detail || '')}</span></div></div>`).join('')}</div>`; }

  async function onClick(e) {
    const googleRedirect = e.target.closest('[data-google-redirect]');
    if (googleRedirect) { startGoogleRedirect(googleRedirect.dataset.googleRedirect); return; }
    const role = e.target.closest('[data-login-role]')?.dataset.loginRole;
    if (role === 'guest') { startGuestSession(); routeTo('/', true); return; }
    if (e.target.closest('[data-logout]')) { localStorage.removeItem('portal.session'); state.user = null; routeTo('/login'); return; }
    if (e.target.closest('[data-toggle-notifications]')) { state.notificationsOpen = !state.notificationsOpen; render({ transition: true, scope: 'overlay' }); return; }
    if (e.target.closest('[data-close-notifications]')) { state.notificationsOpen = false; render({ transition: true, scope: 'overlay' }); return; }
    if (e.target.closest('[data-clear-panel]')) { state.selectedCourse = null; state.selectedResourceId = null; render({ transition: true, scope: 'panel' }); return; }
    const saveCourse = e.target.closest('[data-save-course]');
    if (saveCourse) { if (isGuest()) { readonlyToast(); return; } const key = saveCourse.dataset.saveCourse; if (!Data.saved.courses.includes(key)) Data.saved.courses.push(key); persistSnapshot(); apiRequest('/saved', { method: 'POST', body: JSON.stringify({ kind:'courses', id:key }) }).catch(() => {}); showToast('Ramo agregado a seguimiento'); return; }
    const saveResource = e.target.closest('[data-save-resource]');
    if (saveResource) { if (isGuest()) { readonlyToast(); return; } const id = saveResource.dataset.saveResource; if (!Data.saved.resources.includes(id)) Data.saved.resources.push(id); persistSnapshot(); apiRequest('/saved', { method: 'POST', body: JSON.stringify({ kind:'resources', id }) }).catch(() => {}); showToast('Recurso guardado'); return; }
    const download = e.target.closest('[data-download-resource]');
    if (download) { const r = Data.resources.find(x => x.id === download.dataset.downloadResource); if (r) { downloadResource(r); showToast(r.externalUrl ? 'Abriendo material' : 'Descarga preparada', 'blue'); } return; }
    if (e.target.closest('[data-report-resource]')) { if (isGuest()) { readonlyToast(); return; } showToast('Reporte recibido para revisión CEAL', 'blue'); return; }
    const markRead = e.target.closest('[data-mark-read]');
    if (markRead) { if (isGuest()) { readonlyToast(); return; } const c = Data.communications.find(x => x.id === markRead.dataset.markRead); if (c) c.unread = false; persistSnapshot(); showToast('Comunicado marcado como leído', 'blue'); return; }
    if (e.target.closest('[data-copy-link]')) { copyText(location.href).catch(() => {}); showToast('Enlace copiado', 'blue'); return; }
    const reminder = e.target.closest('[data-save-reminder]');
    if (reminder) { if (isGuest()) { readonlyToast(); return; } const id = reminder.dataset.saveReminder; if (!Data.saved.reminders.includes(id)) Data.saved.reminders.push(id); persistSnapshot(); apiRequest('/saved', { method:'POST', body:JSON.stringify({ kind:'reminders', id }) }).catch(() => {}); showToast('Recordatorio guardado', 'blue'); return; }
    const approve = e.target.closest('[data-approve-material]');
    if (approve) { if (isGuest()) { readonlyToast(); return; } const r = Data.resources.find(x => x.id === approve.dataset.approveMaterial); if (r) { r.status = 'validadoCeal'; persistSnapshot(); apiRequest(`/materials/${encodeURIComponent(r.id)}`, { method:'PATCH', body:JSON.stringify({ status:'validadoCeal' }) }).catch(() => {}); } showToast('Material validado y publicado'); return; }
    const observe = e.target.closest('[data-observe-material]');
    if (observe) { if (isGuest()) { readonlyToast(); return; } const r = Data.resources.find(x => x.id === observe.dataset.observeMaterial); if (r) { r.status = 'observado'; persistSnapshot(); apiRequest(`/materials/${encodeURIComponent(r.id)}`, { method:'PATCH', body:JSON.stringify({ status:'observado' }) }).catch(() => {}); } showToast('Material marcado con observaciones', 'blue'); return; }
    const publish = e.target.closest('[data-publish]');
    if (publish) { if (isGuest()) { readonlyToast(); return; } const form = publish.closest('form'); if (form) form.requestSubmit(); return; }
    const mallaEmbedPlan = e.target.closest('[data-malla-embed-plan]');
    if (mallaEmbedPlan) {
      state.mallaEmbedPlan = mallaEmbedPlan.dataset.mallaEmbedPlan === 'o' ? 'o' : 'p';
      localStorage.setItem('portal.malla.embedPlan', state.mallaEmbedPlan);
      state.activePlan = state.mallaEmbedPlan === 'o' ? 'planO' : 'planP';
      localStorage.setItem('portal.activePlan', state.activePlan);
      render({ transition: true, scope: 'panel' });
      return;
    }
    if (e.target.closest('[data-malla-embed-theme]')) {
      state.mallaEmbedDark = !state.mallaEmbedDark;
      localStorage.setItem('portal.malla.embedDark', state.mallaEmbedDark ? '1' : '0');
      render({ transition: true, scope: 'panel' });
      return;
    }
    if (e.target.closest('[data-malla-focus]')) {
      state.mallaFocus = !state.mallaFocus;
      localStorage.setItem('portal.malla.focus', state.mallaFocus ? '1' : '0');
      render({ transition: true, scope: 'panel' });
      return;
    }
    const planBtn = e.target.closest('[data-plan]');
    if (planBtn) { state.activePlan = planBtn.dataset.plan; localStorage.setItem('portal.activePlan', state.activePlan); state.selectedCourse = null; state.mobileSemester = Math.min(state.mobileSemester, getPlanData(state.activePlan).totalSemesters); render({ transition: true, scope: 'panel' }); return; }
    const semBtn = e.target.closest('[data-mobile-sem]');
    if (semBtn) { state.mobileSemester = Number(semBtn.dataset.mobileSem); localStorage.setItem('portal.mobileSemester', state.mobileSemester); state.selectedCourse = null; render({ transition: true, scope: 'panel' }); return; }
    const course = e.target.closest('[data-course]');
    if (course) { state.selectedCourse = { plan: course.dataset.coursePlan, code: course.dataset.course }; const c = findCourse(course.dataset.coursePlan, course.dataset.course); if (c) state.mobileSemester = c.semester; render({ transition: true, scope: 'panel' }); return; }
    const typeBtn = e.target.closest('[data-material-type]');
    if (typeBtn) { state.materialType = typeBtn.dataset.materialType; render({ transition: true, scope: 'panel' }); return; }
    const courseFilter = e.target.closest('[data-material-course]');
    if (courseFilter) { state.materialCourse = courseFilter.dataset.materialCourse; state.selectedResourceId = null; render({ transition: true, scope: 'panel' }); return; }
    const clearMaterial = e.target.closest('[data-material-clear]');
    if (clearMaterial) {
      const target = clearMaterial.dataset.materialClear;
      if (target === 'search' || target === 'all') state.materialQuery = '';
      if (target === 'type' || target === 'all') state.materialType = 'all';
      if (target === 'course' || target === 'all') state.materialCourse = 'all';
      state.selectedResourceId = null;
      render({ transition: true, scope: 'panel' });
      return;
    }
    const resourceRow = e.target.closest('[data-resource-row]');
    if (resourceRow) { routeTo(`/material/${resourceRow.dataset.resourceRow}`); return; }
    const cat = e.target.closest('[data-com-category]');
    if (cat) { state.communicationCategory = cat.dataset.comCategory; render({ transition: true, scope: 'panel' }); return; }
    const faq = e.target.closest('[data-faq]');
    if (faq) { const idx = Number(faq.dataset.faq); state.openFAQ = state.openFAQ === idx ? null : idx; render({ transition: true, scope: 'panel' }); return; }
    const segment = e.target.closest('[data-select-segment]');
    if (segment) { const wrap = segment.parentElement; wrap.querySelectorAll('button').forEach(b => b.classList.remove('active')); segment.classList.add('active'); const hidden = wrap.parentElement.querySelector(`input[name="${segment.dataset.selectSegment}"]`); if (hidden) hidden.value = segment.textContent.trim(); return; }
    const calendarExport = e.target.closest('[data-download-calendar]');
    if (calendarExport) { downloadTextFile('calendario-ceic.txt', calendarDownloadText()); showToast('Agenda exportada', 'blue'); return; }
    const agreementExport = e.target.closest('[data-download-agreement]');
    if (agreementExport) { const a = Data.agreements.find(x => x.id === agreementExport.dataset.downloadAgreement); if (a) downloadTextFile(`${slug(a.number || a.title)}.txt`, agreementDownloadText(a)); showToast('Ficha descargada', 'blue'); return; }
  }
  function onInput(e) {
    if (e.target.matches('[data-malla-search]')) { state.mallaQuery = e.target.value; scheduleFilterRender(); }
    if (e.target.matches('[data-material-search]')) { state.materialQuery = e.target.value; state.selectedResourceId = null; scheduleFilterRender(); }
    if (e.target.matches('[data-com-search]')) { state.communicationQuery = e.target.value; scheduleFilterRender(); }
  }
  function onChange(e) {
    if (e.target.matches('[data-material-type-select]')) { state.materialType = e.target.value; state.selectedResourceId = null; render({ transition: true, scope: 'panel' }); return; }
    if (e.target.matches('[data-material-course-select]')) { state.materialCourse = e.target.value; state.selectedResourceId = null; render({ transition: true, scope: 'panel' }); return; }
    if (e.target.matches('[data-malla-area]')) { state.mallaArea = e.target.value; render(); }
  }
  function onKeydown(e) {
    if (e.key === 'Escape' && state.mallaFocus && getRoute().path === '/mallas') {
      state.mallaFocus = false;
      localStorage.setItem('portal.malla.focus', '0');
      render({ transition: true, scope: 'panel' });
    }
  }
  async function onSubmit(e) {
    const global = e.target.closest('[data-global-search-form]');
    if (global) { e.preventDefault(); routeTo('/buscar?q=' + encodeURIComponent(new FormData(global).get('q') || '')); return; }
    const searchPage = e.target.closest('[data-search-page-form]');
    if (searchPage) { e.preventDefault(); routeTo('/buscar?q=' + encodeURIComponent(new FormData(searchPage).get('q') || '')); return; }
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    if (isGuest() && ['upload-material', 'edit-content', 'new-agreement'].includes(form.dataset.form)) { readonlyToast(); return; }
    if (form.dataset.form === 'upload-material') {
      const file = form.elements.file?.files?.[0];
      const courseName = String(fd.get('course') || 'Ramo por asociar');
      let item = { id:`mat-${Date.now()}`, title:fd.get('title'), type:fd.get('type') || 'Apunte', courseCode:courseName, plan:fd.get('plan') || 'planP', courseName, semester:'-', year:fd.get('year') || '2026', format:file?.name?.split('.').pop()?.toUpperCase() || 'LINK', size:file ? humanSize(file.size) : 'Sin archivo', origin:fd.get('origin'), status:'pendienteRevision', uploadedBy:state.user.name, uploadedAt:new Date().toISOString().slice(0,10), description:fd.get('description'), fileName:file?.name || '', fileType:file?.type || '', fileDataUrl: await readFileDataUrl(file) };
      try { const payload = await apiRequest('/materials', { method:'POST', body:JSON.stringify(item) }); if (payload.item) item = payload.item; } catch {}
      Data.resources.unshift(item); persistSnapshot(); showToast('Material enviado a revisión'); routeTo('/material/' + item.id); return;
    }
    if (form.dataset.form === 'edit-content') {
      const id = fd.get('id') || Data.communications[0]?.id;
      let item = Data.communications.find(c => c.id === id);
      if (!item) { item = { id:`com-${Date.now()}`, date:new Date().toISOString(), source:'CEIC Ingeniería Civil UCN', unread:true, pinned:false, related:[] }; Data.communications.unshift(item); }
      Object.assign(item, { title:fd.get('title'), category:fd.get('category'), summary:fd.get('summary'), body:fd.get('body'), updatedAt:new Date().toISOString() });
      persistSnapshot();
      apiRequest(`/communications/${encodeURIComponent(item.id)}`, { method:'PATCH', body:JSON.stringify(item) }).catch(() => {});
      showToast('Comunicado guardado');
      routeTo('/comunicados/' + item.id);
      return;
    }
    if (form.dataset.form === 'new-agreement') {
      let item = { id:`agr-${Date.now()}`, number:`Contingencia N ${String(Data.agreements.length + 1).padStart(2,'0')}/2026`, status:fd.get('status') || 'enSeguimiento', date:new Date().toISOString(), origin:fd.get('origin'), responsible:fd.get('responsible'), title:fd.get('title'), summary:fd.get('summary'), currentState:'Registrado en Gestión CEAL.', nextStep:fd.get('nextStep'), documents:[], commitments:fd.get('commitment') ? [{ title:fd.get('commitment'), responsible:fd.get('responsible'), due:new Date().toISOString().slice(0,10), status:'pendiente' }] : [], history:[{ at:new Date().toISOString(), title:'Seguimiento creado', detail:'Registro creado desde Gestión CEAL.' }] };
      try { const payload = await apiRequest('/agreements', { method:'POST', body:JSON.stringify(item) }); if (payload.item) item = payload.item; } catch {}
      Data.agreements.unshift(item); persistSnapshot(); showToast('Seguimiento creado'); routeTo('/acuerdos/' + item.id); return;
    }
  }

  window.addEventListener('hashchange', () => render({ transition: true, scope: 'route' }));
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  boot();
})();
