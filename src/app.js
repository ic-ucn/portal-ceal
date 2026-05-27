(() => {
  const app = document.getElementById('app');
  const Data = window.PortalMock;
  const Curricula = window.CURRICULA;
  const LOCAL_DATA_KEY = 'portal.data.v4';
  const API_BASE = window.PORTAL_API_BASE || ((location.protocol !== 'file:' && ['localhost', '127.0.0.1', '::1'].includes(location.hostname)) ? '/api' : '');
  const MALLA_BASE_URL = 'https://ic-ucn.github.io/malla-curricular/';
  const mallaEmbedCache = {};
  let dataMode = API_BASE ? 'backend' : 'static';
  let hasRendered = false;

  const state = {
    user: loadSession(),
    activePlan: localStorage.getItem('portal.activePlan') || 'planP',
    mobileSemester: Number(localStorage.getItem('portal.mobileSemester') || 4),
    selectedCourse: null,
    selectedResourceId: null,
    selectedCaseId: null,
    selectedAgreementId: null,
    mallaQuery: '',
    mallaArea: 'all',
    materialQuery: '',
    materialType: 'all',
    materialCourse: 'all',
    caseTab: 'all',
    communicationCategory: 'Todas',
    communicationQuery: '',
    openFAQ: null,
    notificationsOpen: false,
    mallaEmbedPlan: localStorage.getItem('portal.malla.embedPlan') || 'p',
    mallaEmbedDark: localStorage.getItem('portal.malla.embedDark') === '1',
    loginMemberId: null,
    authMessage: '',
    toast: null
  };

  const Status = {
    recibido: ['Recibido', 'blue'],
    enRevision: ['En revision', 'blue'],
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
    pendienteRevision: ['Pendiente de revision', 'orange'],
    validadoCeal: ['Validado CEAL', 'green'],
    aporteEstudiantil: ['Aporte estudiantil', 'blue'],
    observado: ['Observado', 'red'],
    approved: ['Aprobado', 'green'],
    inProgress: ['En curso', 'blue'],
    pending: ['Pendiente', 'gray']
  };

  const AreaStyle = {
    basica: 'Ciencias basicas',
    ingenieria: 'Ciencias de la ingenieria',
    aplicada: 'Ingenieria aplicada',
    general: 'Formacion general',
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
    Data.cases = Data.cases.filter(c => !plain([c.title, c.summary].join(' ')).includes('demo') && !plain(c.title).includes('prueba avanzada'));
  }

  function tx(v) {
    const s = String(v ?? '');
    if (!/[ÃÂ�]/.test(s)) return s;
    try { return decodeURIComponent(escape(s)); } catch { return s; }
  }
  function plain(v) { return tx(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function esc(v) { return tx(v).replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s])); }
  function icon(name, extra = '') { return `<span class="icon ${extra}">${ICONS[name] || ICONS.file}</span>`; }
  function routeTo(path) { window.location.hash = path; }
  function prefersReducedMotion() { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  function getRoute() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, queryString = ''] = raw.split('?');
    return { path: path || '/', query: Object.fromEntries(new URLSearchParams(queryString)) };
  }
  function loadSession() { try { return JSON.parse(localStorage.getItem('portal.session') || 'null'); } catch { return null; } }
  function saveSession(user) { state.user = user; localStorage.setItem('portal.session', JSON.stringify(user)); }
  function persistSnapshot() { try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(Data)); } catch {} }
  function loadLocalSnapshot() { try { const raw = localStorage.getItem(LOCAL_DATA_KEY); if (raw) Object.assign(Data, JSON.parse(raw)); } catch {} }
  function fmtDate(date) { const d = new Date(date); return Number.isNaN(d.getTime()) ? esc(date) : d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function fmtTime(date) { const d = new Date(date); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); }
  function titleCase(str) { return tx(str).toLocaleLowerCase('es-CL').replace(/(^|\s|\/|-)(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase('es-CL')); }
  function badge(key, label) { const [text, color] = Status[key] || [label || key, 'gray']; return `<span class="status-chip ${color}">${esc(label || text)}</span>`; }
  function showToast(message, type = 'green') { state.toast = { message, type }; render(); setTimeout(() => { state.toast = null; render(); }, 2200); }
  function getUnreadCount() { return Data.notifications.filter(n => n.unread).length; }
  function planLabel(plan) { return plan === 'planO' ? 'Plan O - Catálogo 2016' : 'Plan P - Catálogo 2025'; }
  function planShort(plan) { return plan === 'planO' ? 'Plan O' : 'Plan P'; }
  function getCourses(plan = state.activePlan) { return Curricula[plan]?.subjects || []; }
  function getPlanData(plan = state.activePlan) { return Curricula[plan] || Curricula.planP; }
  function findCourse(plan, code) { return getCourses(plan).find(c => c.code === code || c.visibleCode === code); }
  function findCoursePlanForCode(code) { return ['planP', 'planO'].find(plan => findCourse(plan, code)) || state.activePlan; }
  function courseKey(plan, code) { return `${plan}:${code}`; }
  function getProgress(plan, code) { return Data.courseProgress?.[courseKey(plan, code)] || 'pending'; }
  function setProgress(plan, code, value) { Data.courseProgress ||= {}; Data.courseProgress[courseKey(plan, code)] = value; persistSnapshot(); }
  function getPrereqs(plan, course) { return (course.prereqs || []).map(code => findCourse(plan, code)).filter(Boolean); }
  function getSuccessors(plan, code) { return getCourses(plan).filter(c => (c.prereqs || []).includes(code)); }
  function getResourcesForCourse(plan, code) { return Data.resources.filter(r => r.courseCode === code || (r.plan === plan && r.courseCode === code)); }
  function cealMembers() { return Data.cealMembers || []; }
  function getCealMember(id) { return cealMembers().find(m => m.id === id) || cealMembers()[0]; }
  function buildMemberUser(member) { return { ...member, role: 'ceal', label: member.roleName || member.label, permissions: member.permissions || [] }; }
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
    if (!member || !stored || stored.passwordHash !== await sha256Text(`${memberId}:${password}`)) throw new Error('Contrasena incorrecta.');
    return buildMemberUser(member);
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
    if (resource.fileDataUrl) {
      const a = document.createElement('a');
      a.href = resource.fileDataUrl; a.download = resource.fileName || `${resource.title}.${String(resource.format || 'pdf').toLowerCase()}`; document.body.appendChild(a); a.click(); a.remove();
      return;
    }
    downloadTextFile(`${slug(resource.title)}.txt`, [`${resource.title}`, `Ramo: ${resource.courseName}`, `Tipo: ${resource.type}`, `Origen: ${resource.origin}`, '', resource.description || 'Ficha del recurso.'].join('\n'));
  }
  function slug(value) { return String(value || 'recurso').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'recurso'; }
  function copyText(text) { return navigator.clipboard?.writeText(text) || Promise.resolve(); }

  async function boot() {
    loadLocalSnapshot();
    ensureShape();
    render();
    if (!API_BASE) return;
    try {
      const payload = await apiRequest('/bootstrap');
      if (payload.data) Object.assign(Data, payload.data);
      if (payload.curricula) Object.assign(Curricula, payload.curricula);
      ensureShape();
      dataMode = 'backend';
      persistSnapshot();
      render();
    } catch { dataMode = 'static'; }
  }

  function navItems() {
    const items = [
      ['/', 'home', 'Inicio'],
      ['/comunicados', 'megaphone', 'Comunicados'],
      ['/calendario', 'calendar', 'Calendario y acuerdos'],
      ['/casos', 'folder', 'Casos'],
      ['/material', 'book', 'Material'],
      ['/mallas', 'grid', 'Mallas'],
      ['/apoyo', 'users', 'Ayudantias y tramites']
    ];
    if (state.user?.role === 'ceal') items.push(['/gestion', 'settings', 'Gestion CEAL']);
    return items;
  }
  function isActive(path, itemPath) {
    if (itemPath === '/') return path === '/';
    return path === itemPath || path.startsWith(itemPath + '/') || (itemPath === '/calendario' && path.startsWith('/acuerdos/')) || (itemPath === '/mallas' && path.startsWith('/ramo/'));
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
    app.innerHTML = path === '/login' ? renderLogin() : renderShell(renderPage(path, query), path);
  }
  function render(options = {}) {
    const opts = options instanceof Event ? { transition: true, scope: 'route' } : options;
    const scope = opts.scope || 'state';
    const shouldAnimate = hasRendered && opts.transition && !prefersReducedMotion();
    if (shouldAnimate) app.dataset.motionScope = scope;
    paint();
    afterRender();
    hasRendered = true;
    if (shouldAnimate) setTimeout(() => { delete app.dataset.motionScope; }, 260);
  }
  function afterRender() {
    hydrateMallaEmbed();
  }
  function renderLogin() {
    const members = cealMembers();
    const selectedId = state.loginMemberId || members[0]?.id || '';
    const selected = getCealMember(selectedId);
    const needsSetup = selected ? !memberHasPassword(selected) : false;
    return `<main class="login-shell"><section class="login-card" aria-label="Ingreso al portal">
      <div class="login-brand"><div><img src="assets/logo-horizontal.png" alt="CEIC UCN Ingenieria Civil UCN" /><h1>Portal CEIC / CEAL UCN</h1><p>Consulta material, mallas, casos, fechas, comunicados y acuerdos de Ingenieria Civil UCN.</p></div></div>
      <div class="login-form"><span class="eyebrow">Acceso</span><h2>Entrar al portal</h2><p>Elige el perfil que usaras en esta sesion.</p>
        <div class="role-grid login-access-grid">
          <button class="role-card" data-login-role="student"><span class="role-icon">${icon('user')}</span><span><strong>Estudiante</strong><span>Consulta material, mallas, casos, fechas y comunicados.</span></span>${icon('arrow')}</button>
          <form class="ceal-login-card" data-form="ceal-login">
            <span class="role-icon">${icon('settings')}</span>
            <div class="ceal-login-body">
              <div class="ceal-login-heading"><strong>Miembro CEAL</strong><span>Gestiona contenidos, casos, acuerdos y material.</span></div>
              <div class="form-field compact"><label>Integrante</label><select class="select" name="memberId" data-login-member required>${members.map(m => `<option value="${esc(m.id)}" ${m.id === selectedId ? 'selected' : ''}>${esc(m.name)} - ${esc(m.roleName || m.label)}</option>`).join('')}</select></div>
              <div class="form-grid tight"><div class="form-field compact"><label>${needsSetup ? 'Nueva contrasena' : 'Contrasena'}</label><input class="input" type="password" name="password" minlength="8" required /></div>${needsSetup ? '<div class="form-field compact"><label>Repetir contrasena</label><input class="input" type="password" name="confirm" minlength="8" required /></div>' : ''}</div>
              <p class="small muted">${needsSetup ? 'Primer ingreso: crea tu contrasena personal.' : 'Usa tu contrasena del portal.'}</p>${state.authMessage ? `<p class="form-alert">${esc(state.authMessage)}</p>` : ''}
              <button class="btn primary full" type="submit">${needsSetup ? 'Crear contrasena e ingresar' : 'Ingresar como miembro CEAL'}</button>
            </div>
          </form>
        </div>
      </div></section></main>`;
  }
  function renderShell(content, path) {
    const user = state.user;
    const nav = navItems().map(([href, ico, label]) => `<a class="nav-item ${isActive(path, href) ? 'active' : ''}" href="#${href}">${icon(ico)}<span>${label}</span></a>`).join('');
    const bottom = [['/', 'home', 'Inicio'], ['/calendario', 'calendar', 'Calendario'], ['/casos', 'folder', 'Casos'], ['/material', 'book', 'Material'], ['/mas', 'more', 'Mas']]
      .map(([href, ico, label]) => `<a class="bottom-item ${isActive(path, href) || (href === '/mas' && ['/comunicados','/mallas','/ramo','/apoyo','/ayudantias','/tramites','/perfil','/gestion','/buscar','/notificaciones'].some(p => path.startsWith(p))) ? 'active' : ''}" href="#${href}">${icon(ico)}<span>${label}</span></a>`).join('');
    return `<div class="app-shell"><aside class="sidebar"><a class="sidebar-brand" href="#/"><span class="brand-mark"><img src="assets/logo-mark.png" alt="CEIC UCN" /></span><span class="brand-copy"><strong>CEIC UCN</strong><span>INGENIERIA CIVIL UCN</span></span></a><nav class="nav">${nav}</nav><div class="sidebar-user"><div class="user-mini"><span class="avatar">${esc(user.initials)}</span><span><strong>${esc(user.name)}</strong><span>${esc(user.label)} - ${planShort(user.plan)} - ${esc(user.yearLabel)}</span></span></div><a class="profile-link" href="#/perfil">Ver perfil ${icon('arrow')}</a></div></aside>
      <main class="app-main"><header class="topbar"><form class="global-search" data-global-search-form><button class="search-submit" type="submit" aria-label="Buscar">${icon('search')}</button><input name="q" type="search" placeholder="Buscar en el portal..." /></form><div class="topbar-actions"><button class="icon-btn" data-toggle-notifications aria-label="Notificaciones">${icon('bell')}<span class="badge-count">${getUnreadCount()}</span></button><a class="account-trigger" href="#/perfil">${icon('user')}<span>Mi cuenta</span></a></div></header>
      <header class="mobile-header"><a class="mobile-brand" href="#/"><img src="assets/logo-mark.png" alt="CEIC UCN" /><strong>CEIC / CEAL UCN</strong></a><div class="mobile-actions"><button class="icon-btn" data-toggle-notifications>${icon('bell')}<span class="badge-count">${getUnreadCount()}</span></button><a class="icon-btn" href="#/perfil">${icon('user')}</a></div></header>
      <section class="content">${content}</section><nav class="bottom-nav">${bottom}</nav></main>${state.notificationsOpen ? renderNotificationPopover() : ''}${state.toast ? `<div class="notification-popover" style="top:auto;right:28px;bottom:28px;width:340px"><header><strong>${esc(state.toast.message)}</strong><span class="status-chip ${state.toast.type}">Listo</span></header></div>` : ''}</div>`;
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
    if (path.startsWith('/acuerdos/')) return renderAgreementDetail(path.split('/')[2]);
    if (path === '/casos') return renderCases();
    if (path === '/casos/nuevo') return renderNewCase();
    if (path.startsWith('/casos/')) return renderCaseDetailPage(path.split('/')[2]);
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
    if (path === '/apoyo') return renderSupport();
    if (path.startsWith('/ayudantias/')) return renderTutoringDetail(path.split('/')[2]);
    if (path.startsWith('/tramites/')) return renderProcedureDetail(path.split('/')[2]);
    if (path === '/gestion') return ensureCEAL(renderManagement());
    if (path === '/gestion/acuerdos/nuevo') return ensureCEAL(renderAgreementForm());
    if (path.startsWith('/gestion/casos/')) return ensureCEAL(renderManageCase(path.split('/')[3]));
    if (path.startsWith('/gestion/comunicados/')) return ensureCEAL(renderEditor(path.split('/')[3]));
    if (path.startsWith('/gestion/material/')) return ensureCEAL(renderValidateMaterial(path.split('/')[3]));
    return renderNotFound();
  }

  function renderHome() {
    const unread = Data.communications.filter(c => c.unread).length;
    const openCases = Data.cases.filter(c => !['resuelto', 'cerrado'].includes(c.status)).length;
    const newMaterials = Data.resources.filter(r => r.status !== 'observado').length;
    return `${pageHead('Inicio', 'Resumen actualizado del portal académico')}
      <section class="home-hero"><div class="card pad"><div class="row-between"><h2 class="card-title">Estado general</h2><span class="pill green">${dataMode === 'backend' ? 'Datos guardados' : 'Guardado en este equipo'}</span></div><p class="muted">Revisa comunicados, fechas, casos, material nuevo y avance curricular.</p><div class="stat-grid compact">${stat('megaphone', unread, 'Comunicados', 'Nuevos')}${stat('calendar', Data.events.length, 'Fechas', 'Proximas')}${stat('folder', openCases, 'Casos', 'Abiertos')}${stat('book', newMaterials, 'Recursos', 'Visibles')}</div></div>
      <div class="card pad"><h2 class="card-title">Acciones frecuentes</h2><div class="access-grid">${access('book','Buscar material','Guia, prueba, apunte o PPT.','Abrir','/material')}${access('grid','Revisar malla','Plan O y Plan P integrados.','Ver malla','/mallas','blue')}${access('folder','Reportar un caso','Solicitudes y seguimiento.','Nuevo caso','/casos/nuevo','orange')}${access('calendar','Ver calendario','Fechas y acuerdos.','Abrir','/calendario')}</div></div></section>
      <div class="grid two" style="margin-top:18px"><section class="card pad"><div class="row-between"><h2 class="card-title">Novedades recientes</h2><a class="link" href="#/comunicados">Ver todas ${icon('arrow')}</a></div>${Data.communications.slice(0,4).map(c => newsRow('megaphone', c.title, c.summary, `/comunicados/${c.id}`, c.date)).join('')}</section><section class="card pad"><div class="row-between"><h2 class="card-title">Proximas fechas</h2><a class="link" href="#/calendario">Ver calendario ${icon('arrow')}</a></div>${Data.events.slice(0,4).map(dateRow).join('')}</section></div>`;
  }
  function access(ico, title, desc, action, href, tone = '') { return `<a class="access-card" href="#${href}"><span class="icon-box ${tone}">${icon(ico)}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span><em>${esc(action)} ${icon('arrow')}</em></a>`; }
  function newsRow(ico, title, desc, href, date) { return `<a class="link-card-row" href="#${href}"><span class="hstack">${icon(ico)}<span><strong>${esc(title)}</strong><span>${esc(desc || '')}</span></span></span><span class="small muted">${fmtDate(date)}</span></a>`; }
  function dateRow(e) { return `<a class="link-card-row" href="#/calendario"><span><strong>${esc(e.title)}</strong><span>${fmtDate(e.date)} - ${esc(e.time || '')} - ${esc(e.description || '')}</span></span><span class="pill blue">${esc(e.type || 'Fecha')}</span></a>`; }

  function renderCommunications() {
    const cats = ['Todas', ...new Set(Data.communications.map(c => c.category))];
    const q = plain(state.communicationQuery);
    const items = Data.communications.filter(c => (state.communicationCategory === 'Todas' || plain(c.category) === plain(state.communicationCategory)) && (!q || plain([c.title, c.summary, c.category, c.source].join(' ')).includes(q)));
    const selected = items[0];
    return `${pageHead('Comunicados', 'Avisos, respuestas y actualizaciones de la carrera')}
      <div class="comms-layout"><aside class="card pad comms-filters"><div class="form-field"><label>Buscar comunicados</label><input class="input" data-com-search value="${esc(state.communicationQuery)}" placeholder="Buscar comunicado" /></div><h2 class="card-title">Categorias</h2><div class="comms-category-list">${cats.map(c => `<button class="chip-btn ${state.communicationCategory === c ? 'active' : ''}" data-com-category="${esc(c)}">${esc(c)}</button>`).join('')}</div></aside>
      <main class="card pad comms-feed"><div class="row-between"><h2 class="card-title">Comunicado destacado</h2><span class="pill gray">${items.length} visibles</span></div>${selected ? commCard(selected, true) : renderEmpty('Sin comunicados visibles', 'Cambia los filtros para revisar otros avisos.')}<div class="divider"></div><h2 class="card-title">Recientes</h2><div class="card-list">${items.slice(1).map(c => commCard(c)).join('') || '<p class="small muted">No hay mas comunicados en esta categoria.</p>'}</div></main>
      <aside class="card pad comms-preview"><h2 class="card-title">Preguntas frecuentes</h2>${renderFAQ()}</aside></div>`;
  }
  function commCard(c) { return `<a class="item-card" href="#/comunicados/${c.id}"><div class="row-between"><span class="pill blue">${esc(c.category)}</span><span class="small muted">${fmtDate(c.date)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="link">Leer comunicado ${icon('arrow')}</span></a>`; }
  function renderCommunicationDetail(id) {
    const c = Data.communications.find(x => x.id === id);
    if (!c) return renderNotFound('No encontramos el comunicado.');
    return `${pageHead(c.title, `${c.category} - ${fmtDate(c.date)}, ${fmtTime(c.date)}`, `<a class="btn secondary" href="#/comunicados">Volver</a>`)}<div class="split"><article class="card pad"><div class="hstack">${badge('blue', c.category)}${c.pinned ? badge('orange','Fijado') : ''}</div><p style="font-size:1.05rem;line-height:1.75;color:var(--slate-700)">${esc(c.body)}</p><div class="detail-block"><div class="detail-row"><span>Fuente</span><strong>${esc(c.source)}</strong></div><div class="detail-row"><span>Publicado</span><strong>${fmtDate(c.date)}, ${fmtTime(c.date)}</strong></div></div><div class="hstack"><button class="btn primary" data-mark-read="${esc(c.id)}">Marcar como leido</button><button class="btn secondary" data-copy-link>Copiar enlace</button></div></article><aside class="card pad"><h2 class="card-title">Relacionado</h2>${(c.related || []).map(r => `<a class="link-card-row" href="#/calendario"><span><strong>${esc(r.label)}</strong><span>${esc(r.type)}</span></span>${icon('arrow')}</a>`).join('') || '<p class="small muted">Sin vinculos relacionados.</p>'}<div class="divider"></div>${renderFAQ()}</aside></div>`;
  }
  function renderFAQ() { return `<div class="vstack">${Data.faqs.slice(0, 5).map((f, i) => `<button class="link-card-row" data-faq="${i}"><span><strong>${esc(f.q)}</strong>${state.openFAQ === i ? `<span class="faq-answer">${esc(f.a)}</span>` : ''}</span>${icon(state.openFAQ === i ? 'x' : 'arrow')}</button>`).join('')}</div>`; }

  function renderCalendar() {
    const selected = Data.agreements.find(a => a.id === state.selectedAgreementId) || Data.agreements[0];
    const manageAgreement = state.user?.role === 'ceal' ? `<a class="btn primary" href="#/gestion/acuerdos/nuevo">${icon('plus')} Nuevo acuerdo</a>` : '';
    const registerAgreement = state.user?.role === 'ceal' ? `<a class="link" href="#/gestion/acuerdos/nuevo">Registrar ${icon('arrow')}</a>` : '';
    return `${pageHead('Calendario y acuerdos', 'Fechas, decisiones y seguimiento', `<button class="btn secondary" data-download-calendar>${icon('calendar')} Exportar agenda</button>`)}
      <div class="calendar-layout"><section class="card pad"><div class="row-between"><h2 class="card-title">Agenda</h2>${manageAgreement}</div><div class="card-list">${Data.events.map(dateRow).join('')}</div></section><section class="card pad"><div class="row-between"><h2 class="card-title">Acuerdos recientes</h2>${registerAgreement}</div>${Data.agreements.map(a => agreementRow(a)).join('')}</section></div>${selected ? `<section class="card pad" style="margin-top:18px">${renderAgreementSummary(selected)}</section>` : ''}`;
  }
  function agreementRow(a) { return `<a class="link-card-row" href="#/acuerdos/${a.id}"><span><strong>${esc(a.number || a.title)}</strong><span>${fmtDate(a.date)} - ${esc(a.title)}</span></span>${badge(a.status)}</a>`; }
  function commitRow(c) { return `<div class="commit-row"><span><strong>${esc(c.title)}</strong><span>${esc(c.responsible)} - vence ${fmtDate(c.due)}</span></span>${badge(c.status)}</div>`; }
  function renderAgreementSummary(a) { return `<div class="row-between"><div><span class="kicker">Detalle del acuerdo</span><h2 class="card-title">${esc(a.number || a.title)}</h2>${a.number && a.title ? `<p class="muted">${esc(a.title)}</p>` : ''}</div>${badge(a.status)}</div><div class="detail-block"><div class="detail-row"><span>Origen</span><strong>${esc(a.origin)}</strong></div><div class="detail-row"><span>Fecha</span><strong>${fmtDate(a.date)}</strong></div><div class="detail-row"><span>Responsable</span><strong>${esc(a.responsible)}</strong></div></div><div class="grid two"><div><h3 class="card-title">Que se acordo</h3><p class="small muted">${esc(a.summary)}</p></div><div><h3 class="card-title">Estado actual</h3><p class="small muted">${esc(a.currentState)}</p></div></div><a class="link" href="#/acuerdos/${a.id}">Ver detalles y documentos ${icon('arrow')}</a>`; }
  function renderAgreementDetail(id) {
    const a = Data.agreements.find(x => x.id === id);
    if (!a) return renderNotFound('No encontramos el acuerdo.');
    return `${pageHead(a.number || a.title, `${fmtDate(a.date)} - ${a.origin}`, `<a class="btn secondary" href="#/calendario">Volver</a>`)}<div class="split wide"><section class="card pad">${renderAgreementSummary(a)}<div class="detail-block"><h3 class="card-title">Compromisos</h3>${(a.commitments || []).map(commitRow).join('') || '<p class="small muted">Sin compromisos registrados.</p>'}</div><div class="detail-block"><h3 class="card-title">Historial</h3>${timeline(a.history || [])}</div></section><aside class="card pad"><h2 class="card-title">Documentos asociados</h2>${(a.documents || []).map(d => `<div class="link-card-row"><span><strong>${esc(d.name)}</strong><span>${esc(d.type)} - ${esc(d.size)}</span></span>${icon('file')}</div>`).join('') || '<p class="small muted">Sin documentos asociados.</p>'}<div class="divider"></div><button class="btn primary full" data-download-agreement="${esc(a.id)}">Descargar ficha</button><button class="btn secondary full" data-copy-link>Copiar enlace</button></aside></div>`;
  }

  function renderMaterial() {
    const q = plain(state.materialQuery);
    const items = Data.resources.filter(r => (!q || plain([r.title, r.courseName, r.courseCode, r.type, r.origin].join(' ')).includes(q)) && (state.materialType === 'all' || plain(r.type) === plain(state.materialType)) && (state.materialCourse === 'all' || plain(r.courseName) === plain(state.materialCourse)));
    const selected = Data.resources.find(r => r.id === state.selectedResourceId) || items[0];
    const types = ['all', 'Guia', 'Prueba', 'Apunte', 'PPT', 'PDF', 'Resumen', 'Ejercicios'];
    const courses = [...new Set(Data.resources.map(r => r.courseName))].filter(Boolean).slice(0, 8);
    return `${pageHead('Biblioteca academica', 'Recursos para estudiar por ramo', `<a class="btn primary" href="#/material/subir">${icon('upload')} Subir material</a>`)}
      <div class="split wide"><section class="card pad"><div class="form-field"><label>Buscar recurso</label><input class="input" data-material-search value="${esc(state.materialQuery)}" placeholder="Buscar ramo, prueba, apunte o guia" /></div><div class="material-filter-group"><div class="segmented">${types.map(t => `<button class="${state.materialType === t ? 'active' : ''}" data-material-type="${esc(t)}">${t === 'all' ? 'Todos' : esc(t)}</button>`).join('')}</div><div class="segmented course-chips"><button class="${state.materialCourse === 'all' ? 'active' : ''}" data-material-course="all">Todos los ramos</button>${courses.map(c => `<button class="${state.materialCourse === c ? 'active' : ''}" data-material-course="${esc(c)}">${esc(c)}</button>`).join('')}</div></div><div class="row-between material-count"><h2 class="card-title">${items.length} recursos encontrados</h2><span class="pill gray">Orden: recientes</span></div><div class="card table-card"><table class="data-table"><thead><tr><th>Recurso</th><th>Ramo</th><th>Sem.</th><th>Ano</th><th>Estado</th><th></th></tr></thead><tbody>${items.map(r => `<tr class="clickable" data-resource-row="${esc(r.id)}"><td><strong>${esc(r.title)}</strong><br><span class="small muted">${esc(r.type)} - ${esc(r.format)}</span></td><td>${esc(r.courseName)}<br><span class="small muted">${esc(r.courseCode)}</span></td><td>${esc(r.semester)}</td><td>${esc(r.year)}</td><td>${badge(r.status)}</td><td>${icon('more')}</td></tr>`).join('')}</tbody></table></div><div class="mobile-card-list">${items.map(resourceCard).join('') || renderEmptyMaterial()}</div></section><aside class="card pad course-detail-panel">${selected ? renderResourceDetail(selected) : renderEmptyMaterial()}</aside></div>`;
  }
  function resourceCard(r) { return `<a class="item-card" href="#/material/${r.id}"><div class="row-between"><span class="icon-box">${icon('file')}</span>${badge(r.status)}</div><h3>${esc(r.title)}</h3><p>${esc(r.courseName)} - ${esc(r.format)} - ${esc(r.size)}</p></a>`; }
  function renderResourceDetail(r) { return `<div class="row-between"><div><span class="kicker">Recurso seleccionado</span><h2 class="card-title">${esc(r.title)}</h2></div><button class="icon-btn" data-clear-panel>${icon('x')}</button></div><div class="hstack" style="flex-wrap:wrap">${badge(r.status)}<span class="pill blue">${esc(r.format)}</span><span class="pill gray">${esc(r.size)}</span></div><p class="small muted" style="line-height:1.55;margin-top:14px">${esc(r.description)}</p><div class="detail-block"><div class="detail-row"><span>Ramo</span><strong>${esc(r.courseName)}</strong></div><div class="detail-row"><span>Codigo</span><strong>${esc(r.courseCode)}</strong></div><div class="detail-row"><span>Semestre</span><strong>${esc(r.semester)}</strong></div><div class="detail-row"><span>Ano</span><strong>${esc(r.year)}</strong></div><div class="detail-row"><span>Origen</span><strong>${esc(r.origin)}</strong></div><div class="detail-row"><span>Subido por</span><strong>${esc(r.uploadedBy)}</strong></div></div><div class="vstack"><button class="btn secondary" data-save-resource="${esc(r.id)}">${icon('bookmark')} Guardar</button><button class="btn primary" data-download-resource="${esc(r.id)}">${icon('download')} Descargar</button><button class="btn danger" data-report-resource="${esc(r.id)}">${icon('x')} Reportar error</button><a class="btn ghost" href="#/ramo/${findCoursePlanForCode(r.courseCode)}/${encodeURIComponent(r.courseCode)}">Ver ramo ${icon('arrow')}</a></div>`; }
  function renderEmptyMaterial() { return `<div class="empty-state"><span class="icon-wrap">${icon('book')}</span><h3>Sin recursos visibles</h3><p>Prueba limpiar filtros o subir material para revision.</p></div>`; }
  function renderMaterialDetailPage(id) {
    const r = Data.resources.find(x => x.id === id);
    if (!r) return renderNotFound('No encontramos el recurso solicitado.');
    const rPlan = Curricula[r.plan] ? r.plan : findCoursePlanForCode(r.courseCode);
    return `${pageHead('Detalle de recurso', `${r.courseName} - ${r.type}`, `<a class="btn secondary" href="#/material">Volver</a>`)}<div class="split"><section class="card pad">${renderResourceDetail(r)}</section><aside class="card pad"><h2 class="card-title">Ramo relacionado</h2>${findCourse(rPlan, r.courseCode) ? courseCard(rPlan, findCourse(rPlan, r.courseCode)) : '<p class="small muted">Recurso sin ramo asociado en malla.</p>'}</aside></div>`;
  }
  function renderUploadMaterial() {
    return `${pageHead('Subir material', 'Comparte un recurso para revision CEAL', `<a class="btn secondary" href="#/material">Volver</a>`)}<div class="split"><form class="card pad form" data-form="upload-material"><div class="form-field"><label>Tipo de recurso</label><div class="segmented">${['Apunte','Guia','Prueba','PPT','PDF','Resumen','Otro'].map((t, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-select-segment="type">${t}</button>`).join('')}</div><input type="hidden" name="type" value="Apunte" /></div><div class="form-grid"><div class="form-field"><label>Titulo</label><input class="input" name="title" required minlength="6" /></div><div class="form-field"><label>Ramo</label><input class="input" name="course" required /></div></div><div class="form-grid"><div class="form-field"><label>Plan</label><select class="select" name="plan"><option value="planP">Plan P</option><option value="planO">Plan O</option><option value="both">Ambos</option></select></div><div class="form-field"><label>Ano</label><select class="select" name="year"><option>2026</option><option>2025</option><option>2024</option><option>2023</option></select></div></div><div class="form-field"><label>Descripcion</label><textarea class="textarea" name="description" required minlength="20"></textarea></div><div class="form-field"><label>Archivo</label><label class="upload-zone">${icon('upload')}<strong>Seleccionar archivo</strong><span class="help">PDF, DOCX, PPTX, PNG, JPG o ZIP</span><input class="sr-only" type="file" name="file" /></label></div><div class="form-field"><label>Fuente u origen</label><input class="input" name="origin" required /></div><label class="checkbox-row"><input type="checkbox" name="permission" required /> Confirmo que el recurso puede compartirse como apoyo academico.</label><div class="hstack"><button class="btn primary" type="submit">Enviar a revision</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div></form><aside class="card pad"><h2 class="card-title">Proceso</h2>${timeline([{ title:'Enviado', detail:'Recibimos el aporte.', at:new Date() }, { title:'Revision CEAL', detail:'Se revisa formato y ramo asociado.', at:new Date() }, { title:'Publicado u observado', detail:'Queda disponible o con observaciones.', at:new Date() }])}</aside></div>`;
  }

  function renderCases() {
    const tabs = [['all','Mis casos'], ['enRevision','En revision'], ['resuelto','Resueltos'], ['derivado','Derivados']];
    const list = Data.cases.filter(c => state.caseTab === 'all' || c.status === state.caseTab);
    const selected = Data.cases.find(c => c.id === state.selectedCaseId) || list[0] || Data.cases[0];
    return `${pageHead('Casos y seguimiento', 'Envia un caso y revisa su estado', `<a class="btn primary" href="#/casos/nuevo">${icon('plus')} Nuevo caso</a>`)}<div class="case-tabs">${tabs.map(([id, label]) => `<button class="case-tab ${state.caseTab === id ? 'active' : ''}" data-case-tab="${id}">${label}</button>`).join('')}</div><div class="case-layout"><div class="card-list">${list.map(c => caseCard(c, selected?.id === c.id)).join('') || renderEmpty('Sin casos', 'No hay casos en este estado.')}</div><section class="card pad">${selected ? renderCaseDetail(selected) : renderEmpty('Sin casos', '')}</section></div>`;
  }
  function caseCard(c, active = false) { return `<a class="item-card ${active ? 'active' : ''}" href="#/casos/${c.id}" data-case-card="${esc(c.id)}"><div class="row-between"><span class="icon-box">${icon('folder')}</span>${badge(c.status)}</div><h3>${esc(c.title)}</h3><p>${esc(c.number)} - ${fmtDate(c.createdAt)} - ${esc(c.type)}</p></a>`; }
  function renderCaseDetail(c) { const steps = ['recibido','enRevision','enSeguimiento','resuelto','cerrado']; const idx = Math.max(0, steps.indexOf(c.status)); const manageAction = state.user?.role === 'ceal' ? `<a class="btn secondary" href="#/gestion/casos/${c.id}">${icon('settings')} Gestion CEAL</a>` : ''; return `<div class="row-between"><span class="small muted">Caso ${esc(c.number)}</span>${badge(c.status)}</div><h2 class="card-title">${esc(c.title)}</h2><div class="stepper">${steps.map((s, i) => `<span class="step ${i < idx ? 'done' : i === idx ? 'active' : ''}">${Status[s]?.[0]}</span>`).join('')}</div><div class="grid two"><div><h3 class="card-title">Resumen</h3><p class="small muted">${esc(c.summary)}</p><div class="detail-block"><div class="detail-row"><span>Categoria</span><strong>${esc(c.type)}</strong></div><div class="detail-row"><span>Responsable</span><strong>${esc(c.responsible)}</strong></div>${c.courseName ? `<div class="detail-row"><span>Ramo</span><strong>${esc(c.courseName)}</strong></div>` : ''}</div></div><div><h3 class="card-title">Proximo paso</h3><p class="small muted">${esc(c.nextStep)}</p><h3 class="card-title">Adjuntos</h3>${(c.attachments || []).map(a => `<div class="link-card-row"><span><strong>${esc(a.name)}</strong><span>${esc(a.size)}</span></span>${icon('file')}</div>`).join('') || '<p class="small muted">Sin adjuntos.</p>'}</div></div><h3 class="card-title">Historial</h3>${timeline(c.history || [])}<div class="hstack">${manageAction}<button class="btn danger" data-close-case="${esc(c.id)}">${icon('x')} Solicitar cierre</button></div>`; }
  function renderCaseDetailPage(id) { const c = Data.cases.find(x => x.id === id); return c ? `${pageHead('Detalle de caso', c.number, `<a class="btn secondary" href="#/casos">Volver</a>`)}<section class="card pad">${renderCaseDetail(c)}</section>` : renderNotFound('No encontramos el caso.'); }
  function renderNewCase() { return `${pageHead('Nuevo caso', 'Envia una consulta o solicitud y revisa su seguimiento', `<a class="btn secondary" href="#/casos">Volver</a>`)}<div class="split"><form class="card pad form" data-form="new-case"><div class="form-field"><label>Tipo de caso</label><div class="segmented">${['Academico','Material','Infraestructura','Inscripcion','Orientacion','Otro'].map((t, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-select-segment="type">${t}</button>`).join('')}</div><input type="hidden" name="type" value="Academico" /></div><div class="form-grid"><div class="form-field"><label>Titulo</label><input class="input" name="title" required minlength="8" maxlength="120" /></div><div class="form-field"><label>Ramo relacionado</label><input class="input" name="course" /></div></div><div class="form-grid"><div class="form-field"><label>Prioridad</label><select class="select" name="priority"><option>Normal</option><option>Media</option><option>Alta</option></select></div><div class="form-field"><label>Fecha</label><input class="input" type="date" name="date" /></div></div><div class="form-field"><label>Descripcion</label><textarea class="textarea" name="description" required minlength="20" maxlength="1000"></textarea></div><label class="checkbox-row"><input type="checkbox" name="privacy" required /> Entiendo que mi caso sera visible para mi y el equipo CEAL asignado.</label><div class="hstack"><button class="btn primary" type="submit">Enviar caso</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div></form><aside class="card pad"><h2 class="card-title">Seguimiento</h2>${timeline([{ title:'Caso recibido', detail:'Se registra en tu lista de casos.', at:new Date() }, { title:'Asignacion', detail:'Un integrante CEAL toma el caso.', at:new Date() }, { title:'Respuesta', detail:'Recibes la respuesta en el portal.', at:new Date() }])}</aside></div>`; }

  function renderMallas() {
    const plan = state.mallaEmbedPlan === 'o' ? 'o' : 'p';
    const dark = state.mallaEmbedDark;
    const planLabelText = plan === 'o' ? 'Plan O - Catálogo 2016' : 'Plan P - Catálogo 2025';
    const originalUrl = `${MALLA_BASE_URL}malla-${plan}.html`;
    return `${pageHead('Mallas', `${planLabelText} integrado al portal CEAL`, `<a class="btn secondary" href="${originalUrl}" target="_blank" rel="noopener">${icon('arrow')} Abrir original</a>`)}
      <section class="malla-embed-shell ${dark ? 'is-dark' : 'is-light'}" aria-label="Malla curricular embebida">
        <div class="malla-embed-toolbar">
          <div class="malla-embed-copy">
            <span class="eyebrow">Ingenieria Civil UCN</span>
            <h2>Consulta curricular oficial</h2>
          </div>
          <div class="malla-embed-actions">
            <div class="segmented malla-embed-tabs" aria-label="Seleccionar plan">
              <button class="${plan === 'o' ? 'active' : ''}" data-malla-embed-plan="o">Plan O</button>
              <button class="${plan === 'p' ? 'active' : ''}" data-malla-embed-plan="p">Plan P</button>
            </div>
            <button class="btn secondary malla-theme-toggle ${dark ? 'active' : ''}" type="button" data-malla-embed-theme aria-pressed="${dark ? 'true' : 'false'}">${icon('eye')} Modo oscuro</button>
          </div>
        </div>
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
    return html
      .replace(/<head>/i, `<head>${bootstrap}`)
      .replace(/<\/head>/i, `${styles}</head>`);
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
      @media (max-width: 640px) {
        .mc-header { height: 52px; padding: 0 10px; }
        .mc-grid { padding: 8px 8px 14px !important; }
        .mc-footer { padding-bottom: 12px; }
      }
    `;
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
    return `<div class="course-detail-head"><div><span class="kicker">${esc(course.visibleCode || course.code)}</span><h2 class="card-title">${esc(titleCase(course.name))}</h2></div>${inline ? `<button class="icon-btn" aria-label="Cerrar detalle" title="Cerrar detalle" data-clear-panel>${icon('x')}</button>` : ''}</div><div class="hstack" style="flex-wrap:wrap">${badge(getProgress(plan, course.code))}<span class="pill blue">${course.semester} semestre</span><span class="pill gray">${course.sct || 0} SCT</span></div><p class="small muted" style="line-height:1.6">${esc(course.description || getPlanData(plan).descriptions?.[course.code] || 'Ficha curricular del ramo.')}</p><div class="detail-block"><div class="detail-row"><span>Plan</span><strong>${planShort(plan)}</strong></div><div class="detail-row"><span>Area</span><strong>${esc(AreaStyle[course.area] || course.area)}</strong></div><div class="detail-row"><span>Tipo</span><strong>${esc(course.type || 'Asignatura curricular')}</strong></div></div><div class="grid two"><section><h3 class="card-title">Prerrequisitos</h3>${prereqs.map(p => miniCourse(plan, p)).join('') || '<p class="small muted">Sin prerrequisitos.</p>'}</section><section><h3 class="card-title">Ramos que abre</h3>${successors.slice(0,4).map(s => miniCourse(plan, s)).join('') || '<p class="small muted">No abre ramos directos.</p>'}</section></div><div class="detail-block"><h3 class="card-title">Recursos asociados</h3>${resources.slice(0,3).map(r => `<a class="link-card-row" href="#/material/${r.id}"><span><strong>${esc(r.title)}</strong><span>${esc(r.type)} - ${esc(r.format)}</span></span>${icon('arrow')}</a>`).join('') || '<p class="small muted">Sin recursos asociados.</p>'}</div><div class="hstack"><a class="btn primary" href="#/material?course=${encodeURIComponent(course.code)}">Ver material</a><button class="btn secondary" data-save-course="${courseKey(plan, course.code)}">Agregar seguimiento</button></div>`;
  }
  function miniCourse(plan, c) { return `<a class="link-card-row" href="#/ramo/${plan}/${encodeURIComponent(c.code)}"><span><strong>${esc(titleCase(c.name))}</strong><span>${esc(c.visibleCode || c.code)}</span></span>${badge(getProgress(plan, c.code))}</a>`; }
  function renderCourseDetailPage(plan, code) { const c = findCourse(plan, code); return c ? `${pageHead(titleCase(c.name), `${planLabel(plan)} - ${c.visibleCode || c.code}`, `<a class="btn secondary" href="#/mallas">Volver a malla</a>`)}<div class="split wide"><section class="card pad">${renderCourseDetail(c, plan, false)}</section><aside class="card pad"><h2 class="card-title">Conexiones</h2>${getResourcesForCourse(plan, c.code).map(r => resourceCard(r)).join('') || '<p class="small muted">Sin recursos asociados.</p>'}</aside></div>` : renderNotFound('No encontramos el ramo.'); }

  function renderSupport() { return `${pageHead('Ayudantias y tramites', 'Apoyo academico, formularios y gestiones')}<section class="card pad"><div class="row-between"><h2 class="card-title">Ayudantias</h2><a class="link" href="#/calendario">Ver calendario</a></div><div class="card-list">${Data.tutoring.map(tutoringCard).join('')}</div></section><section class="card pad" style="margin-top:18px"><h2 class="card-title">Tramites y formularios</h2><div class="grid three">${Data.procedures.map(procedureCard).join('')}</div></section><section class="card pad" style="margin-top:18px"><h2 class="card-title">Apoyo academico</h2><div class="access-grid">${access('book','Recursos de estudio','Guias y material recomendado.','Explorar','/material')}${access('users','Tutorias','Apoyo entre estudiantes.','Ver','/apoyo','green')}${access('folder','Centro de consultas','Crea un caso academico.','Crear','/casos/nuevo','orange')}${access('grid','Mallas','Consulta prerrequisitos.','Abrir','/mallas')}</div></section>`; }
  function tutoringCard(t) { return `<a class="item-card" href="#/ayudantias/${t.id}"><div class="row-between"><span class="icon-box">${icon('users')}</span><span class="pill blue">${esc(t.mode)}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.courseName)} - ${fmtDate(t.date)} - ${esc(t.time)} - ${esc(t.location)}</p></a>`; }
  function procedureCard(p) { return `<a class="item-card" href="#/tramites/${p.id}"><div class="row-between"><span class="icon-box orange">${icon('file')}</span>${badge(p.status)}</div><h3>${esc(p.title)}</h3><p>Vence: ${fmtDate(p.due)}<br>${esc(p.responsible)}</p></a>`; }
  function renderTutoringDetail(id) { const t = Data.tutoring.find(x => x.id === id); return t ? `${pageHead(t.title, `${t.courseName} - ${fmtDate(t.date)}`, `<a class="btn secondary" href="#/apoyo">Volver</a>`)}<div class="split"><section class="card pad"><h2 class="card-title">Detalle de ayudantia</h2><div class="detail-block"><div class="detail-row"><span>Ramo</span><strong>${esc(t.courseName)}</strong></div><div class="detail-row"><span>Hora</span><strong>${esc(t.time)}</strong></div><div class="detail-row"><span>Lugar</span><strong>${esc(t.location)}</strong></div><div class="detail-row"><span>Ayudante</span><strong>${esc(t.tutor)}</strong></div></div><div class="hstack"><button class="btn primary" data-save-reminder="${esc(t.id)}">${icon('bell')} Guardar recordatorio</button><a class="btn secondary" href="#/material/${t.materialId}">Ver material</a></div></section><aside class="card pad"><a class="btn secondary full" href="#/ramo/${findCoursePlanForCode(t.courseCode)}/${encodeURIComponent(t.courseCode)}">Ver ramo</a></aside></div>` : renderNotFound(); }
  function renderProcedureDetail(id) { const p = Data.procedures.find(x => x.id === id); return p ? `${pageHead(p.title, `Vence ${fmtDate(p.due)}`, `<a class="btn secondary" href="#/apoyo">Volver</a>`)}<div class="split"><section class="card pad">${badge(p.status)}<p class="muted">${esc(p.description)}</p><h2 class="card-title">Documentos requeridos</h2>${p.required.map(r => `<div class="link-card-row"><span><strong>${esc(r)}</strong><span>Requisito</span></span>${icon('check')}</div>`).join('')}<div class="divider"></div><a class="btn primary" href="#/casos/nuevo">Iniciar tramite como caso</a></section><aside class="card pad"><h2 class="card-title">Apoyo</h2><p class="small muted">Si tienes dudas, crea un caso y asocialo a la categoria correspondiente.</p></aside></div>` : renderNotFound(); }

  function renderManagement() {
    const members = cealMembers();
    const pendingCases = Data.cases.filter(c => !['resuelto','cerrado'].includes(c.status));
    const pendingMaterial = Data.resources.filter(r => r.status === 'pendienteRevision');
    const perms = new Set(state.user?.permissions || []);
    const allowed = need => !need || perms.has(need) || perms.has('manage:roles') || perms.has('approve:content');
    const firstCase = pendingCases[0]?.id || Data.cases[0]?.id || '';
    const firstMaterial = pendingMaterial[0]?.id || Data.resources[0]?.id || '';
    const modules = [
      ['publish:comunicados','megaphone','Publicar comunicado','Redacta y publica avisos.','/gestion/comunicados/com-001/editar'],
      ['edit:calendario','calendar','Editar calendario','Gestiona fechas importantes.','/calendario'],
      ['upload:acuerdos','file','Subir acuerdo','Registra decisiones y compromisos.','/gestion/acuerdos/nuevo'],
      ['review:casos','folder','Revisar casos','Asigna y responde solicitudes.', firstCase ? '/gestion/casos/' + firstCase : '/casos'],
      ['validate:material','book','Validar material','Aprueba recursos enviados.', firstMaterial ? '/gestion/material/' + firstMaterial + '/validar' : '/material'],
      ['edit:mallas','grid','Actualizar mallas','Revisa enlaces y fichas de ramos.','/mallas'],
      ['manage:forms','file','Gestionar formularios','Ordena tramites y solicitudes.','/apoyo'],
      ['manage:roles','users','Miembros y permisos','Revisa roles CEAL.','/gestion']
    ];
    const visibleModules = modules.map(m => {
      const ok = allowed(m[0]);
      const tag = ok ? 'a' : 'div';
      const href = ok ? ` href="#${m[4]}"` : '';
      return `<${tag} class="management-card ${ok ? '' : 'disabled'}"${href}><span class="icon-box">${icon(m[1])}</span><strong>${esc(m[2])}</strong><span>${esc(m[3])}</span><em>${ok ? 'Disponible para tu rol' : 'Otro rol CEAL'}</em></${tag}>`;
    }).join('');
    const quick = modules.filter(m => allowed(m[0])).slice(0, 5).map(m => `<a class="link-card-row" href="#${m[4]}"><span><strong>${esc(m[2])}</strong><span>${esc(m[3])}</span></span>${icon('arrow')}</a>`).join('');
    return `${pageHead('Gestion CEAL', 'Actualiza contenidos y coordina el portal', `<span class="pill blue">Rol actual: ${esc(state.user.label)}</span>`)}<div class="split"><main class="vstack"><section class="card pad"><div class="row-between"><h2 class="card-title">Tu tablero</h2><span class="pill gray">${esc(state.user.name)}</span></div><div class="stat-grid compact">${stat('folder', pendingCases.length, 'Casos', 'Abiertos')}${stat('book', pendingMaterial.length, 'Material', 'Por validar')}${stat('file', Data.agreements.filter(a => a.status !== 'publicado').length, 'Acuerdos', 'En seguimiento')}${stat('calendar', Data.events.length, 'Fechas', 'Registradas')}</div></section><section class="card pad"><h2 class="card-title">Modulos de gestion</h2><div class="management-modules">${visibleModules}</div></section><div class="grid two"><section class="card pad"><h2 class="card-title">Pendientes</h2>${[
      `${pendingCases.length} casos abiertos`,
      `${pendingMaterial.length} materiales por validar`,
      `${Data.agreements.filter(a => a.status !== 'publicado').length} acuerdos en seguimiento`,
      `${Data.events.length} fechas registradas`
    ].map((p, i) => `<div class="link-card-row"><span><strong>${esc(p)}</strong><span>${['Casos','Material','Acuerdos','Calendario'][i]}</span></span>${icon('arrow')}</div>`).join('')}</section><section class="card pad"><h2 class="card-title">Cambios recientes</h2>${Data.notifications.map(n => `<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)}</span></span>${n.unread ? badge('orange','Nuevo') : badge('gray','Leido')}</a>`).join('')}</section></div><section class="card pad"><h2 class="card-title">Equipo CEAL 2026</h2><div class="role-strip">${members.map(m => `<div class="role-pill ${m.id === state.user.id ? 'active' : ''}"><strong>${esc(m.roleName || m.label)}</strong><p>${esc(m.name)}</p><span class="pill gray">${memberHasPassword(m) ? 'Con acceso' : 'Debe crear contrasena'}</span></div>`).join('')}</div></section></main><aside class="vstack"><section class="card pad"><h2 class="card-title">Acciones rapidas</h2>${quick || '<p class="small muted">No hay acciones directas para este rol.</p>'}</section><section class="card pad"><h2 class="card-title">Estado del portal</h2><div class="detail-row"><span>Datos</span><strong>${dataMode === 'backend' ? 'Guardados' : 'En este equipo'}</strong></div><div class="detail-row"><span>Integrantes</span><strong>${members.length}</strong></div></section></aside></div>`;
  }
  function ensureCEAL(content) { return state.user?.role === 'ceal' ? content : `${pageHead('Sin permisos', 'Esta seccion es de uso interno CEAL')}<section class="card pad empty-state"><span class="icon-wrap">${icon('settings')}</span><h3>Acceso restringido</h3><button class="btn secondary" data-logout>Cambiar rol</button></section>`; }
  function renderEditor(id) {
    const c = Data.communications.find(x => x.id === id) || Data.communications[0] || {};
    return `${pageHead('Editar comunicado', 'Actualiza contenido antes de publicar', `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="editor-layout"><form class="card pad form" data-form="edit-content"><input type="hidden" name="id" value="${esc(c.id || '')}" /><div class="form-field"><label>Titulo</label><input class="input" name="title" value="${esc(c.title || '')}" required /></div><div class="form-grid"><div class="form-field"><label>Categoria</label><select class="select" name="category">${['Academico','Actividades','Ayudantias','Material','Tramites','CEAL'].map(x => `<option ${c.category === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>Resumen</label><input class="input" name="summary" value="${esc(c.summary || '')}" required /></div></div><div class="form-field"><label>Contenido</label><textarea class="textarea" name="body" required>${esc(c.body || '')}</textarea></div><div class="hstack"><button class="btn secondary" type="submit">Guardar borrador</button><button class="btn primary" type="button" data-publish>Publicar</button></div></form><aside class="card pad"><h2 class="card-title">Vista previa</h2>${c.id ? commCard(c) : '<p class="small muted">Completa el comunicado.</p>'}</aside></div>`;
  }
  function renderValidateMaterial(id) { const r = Data.resources.find(x => x.id === id) || Data.resources.find(x => x.status === 'pendienteRevision'); return r ? `${pageHead('Validar material', `${r.title} - ${r.courseName}`, `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="split"><section class="card pad">${renderResourceDetail(r)}</section><aside class="card pad"><h2 class="card-title">Revision CEAL</h2><div class="form-field"><label>Observaciones</label><textarea class="textarea" placeholder="Agrega observaciones internas"></textarea></div><button class="btn primary full" data-approve-material="${esc(r.id)}">Validar y publicar</button><button class="btn danger full" data-observe-material="${esc(r.id)}">Marcar con observaciones</button></aside></div>` : renderNotFound(); }
  function renderAgreementForm() { return `${pageHead('Nuevo acuerdo', 'Registra una decision y su seguimiento', `<a class="btn secondary" href="#/gestion">Volver</a>`)}<form class="card pad form" data-form="new-agreement"><div class="form-field"><label>Titulo del acuerdo</label><input class="input" name="title" required /></div><div class="form-grid"><div class="form-field"><label>Origen</label><input class="input" name="origin" required placeholder="Pleno, reunion, solicitud" /></div><div class="form-field"><label>Estado inicial</label><select class="select" name="status"><option value="enSeguimiento">En seguimiento</option><option value="pendiente">Pendiente</option><option value="publicado">Publicado</option></select></div></div><div class="form-field"><label>Que se acordo</label><textarea class="textarea" name="summary" required minlength="20"></textarea></div><div class="form-grid"><div class="form-field"><label>Responsable</label><input class="input" name="responsible" value="${esc(state.user.label)}" required /></div><div class="form-field"><label>Proximo paso</label><input class="input" name="nextStep" required /></div></div><div class="form-field"><label>Compromiso inicial</label><input class="input" name="commitment" placeholder="Opcional" /></div><div class="hstack"><button class="btn primary" type="submit">Crear acuerdo</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div></form>`; }
  function renderManageCase(id) {
    const c = Data.cases.find(x => x.id === id) || Data.cases[0];
    if (!c) return renderNotFound('No hay casos para gestionar.');
    return `${pageHead('Gestion del caso', `${c.number} - ${c.type}`, `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="split wide"><section class="card pad">${renderCaseDetail(c)}</section><aside class="card pad"><form class="form" data-form="manage-case"><input type="hidden" name="id" value="${esc(c.id)}" /><div class="form-field"><label>Estado actual</label><select class="select" name="status">${Object.entries(Status).filter(([k]) => ['recibido','enRevision','enSeguimiento','resuelto','derivado','cerrado'].includes(k)).map(([k, v]) => `<option value="${k}" ${c.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div><div class="form-field"><label>Responsable CEAL</label><select class="select" name="responsible">${cealMembers().map(m => `<option value="${esc(m.name)}" ${c.responsible === m.name ? 'selected' : ''}>${esc(m.name)} - ${esc(m.roleName)}</option>`).join('')}</select></div><div class="form-field"><label>Nota interna</label><textarea class="textarea" name="note" placeholder="Solo visible para CEAL"></textarea></div><div class="form-field"><label>Respuesta al estudiante</label><textarea class="textarea" name="response" placeholder="Mensaje que vera el estudiante"></textarea></div><button class="btn primary full" type="submit">Guardar gestion</button></form></aside></div>`;
  }

  function renderProfile() { const u = state.user; return `${pageHead('Mi cuenta', 'Perfil, preferencias y seguimiento personal', `<button class="btn danger" data-logout>${icon('x')} Cerrar sesion</button>`)}<section class="card pad"><div class="profile-hero"><span class="avatar big">${esc(u.initials)}</span><div><h2 class="card-title">${esc(u.name)}</h2><div class="hstack" style="flex-wrap:wrap">${badge('green','Cuenta activa')}<span class="pill blue">${esc(u.label)}</span><span class="pill gray">${planShort(u.plan)} - ${esc(u.yearLabel)}</span></div><p class="small muted">${esc(u.email)}</p></div>${u.role === 'ceal' ? '<a class="btn primary" href="#/gestion">Ir a Gestion CEAL</a>' : '<a class="btn secondary" href="#/mallas">Ver mi malla</a>'}</div></section><div class="grid four" style="margin-top:18px">${stat('grid', Data.saved.courses.length, 'Ramos', 'Seguimiento')}${stat('book', Data.saved.resources.length, 'Recursos', 'Guardados')}${stat('folder', Data.cases.filter(c => !['resuelto','cerrado'].includes(c.status)).length, 'Casos', 'Abiertos')}${stat('bell', Data.saved.reminders.length, 'Recordatorios', 'Activos')}</div><div class="grid two" style="margin-top:18px"><section class="card pad"><h2 class="card-title">Actividad reciente</h2>${Data.notifications.map(n => `<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} - ${esc(n.date)}</span></span>${icon('arrow')}</a>`).join('')}</section><section class="card pad"><h2 class="card-title">Preferencias</h2>${['Recibir recordatorios','Mostrar solo mi plan','Notificaciones de casos','Modo compacto'].map((p, i) => `<label class="link-card-row"><span><strong>${p}</strong><span>${i < 3 ? 'Activado' : 'Disponible'}</span></span><input type="checkbox" ${i < 3 ? 'checked' : ''} /></label>`).join('')}</section></div>`; }
  function renderSearch(query) {
    const q = String(query || '').trim();
    const normalized = plain(q);
    const rows = q ? [
      ...['planO','planP'].flatMap(plan => getCourses(plan).filter(c => plain([c.name, c.code, c.visibleCode].join(' ')).includes(normalized)).slice(0, 4).map(c => resultRow('grid', titleCase(c.name), `${planLabel(plan)} - ${c.visibleCode || c.code}`, `/ramo/${plan}/${encodeURIComponent(c.code)}`))),
      ...Data.resources.filter(r => plain([r.title, r.courseName, r.courseCode, r.type].join(' ')).includes(normalized)).slice(0, 5).map(r => resultRow('book', r.title, `${r.courseName} - ${r.type}`, `/material/${r.id}`)),
      ...Data.communications.filter(c => plain([c.title, c.summary, c.category].join(' ')).includes(normalized)).slice(0, 4).map(c => resultRow('megaphone', c.title, `${c.category} - ${fmtDate(c.date)}`, `/comunicados/${c.id}`))
    ] : [];
    return `${pageHead('Busqueda', q ? `Resultados para ${q}` : 'Busca ramos, material, fechas, acuerdos, comunicados y casos')}<section class="card pad"><form data-search-page-form class="form-field"><label>Buscar</label><input class="input" name="q" value="${esc(q)}" /></form></section><section class="result-group">${rows.join('') || renderEmpty('Sin resultados', 'Prueba con otro termino.')}</section>`;
  }
  function resultRow(ico, title, desc, route) { return `<a class="result-row" href="#${route}"><span class="icon-box">${icon(ico)}</span><span><strong>${esc(title)}</strong><p>${esc(desc)}</p></span><span class="link">Abrir ${icon('arrow')}</span></a>`; }
  function renderMore() { const items = navItems().filter(([href]) => !['/','/calendario','/casos','/material'].includes(href)); return `${pageHead('Mas', 'Accesos secundarios del portal')}<section class="card pad"><div class="card-list">${items.map(([href, ico, label]) => `<a class="link-card-row" href="#${href}"><span class="hstack">${icon(ico)}<strong>${label}</strong></span>${icon('arrow')}</a>`).join('')}<a class="link-card-row" href="#/perfil"><span class="hstack">${icon('user')}<strong>Mi cuenta</strong></span>${icon('arrow')}</a><button class="link-card-row" data-logout><span class="hstack">${icon('x')}<strong>Cerrar sesion</strong></span>${icon('arrow')}</button></div></section>`; }
  function renderNotificationsPage() { return `${pageHead('Notificaciones', 'Actualizaciones relevantes del portal')}<section class="card pad">${Data.notifications.map(n => `<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} - ${esc(n.date)}</span></span>${n.unread ? badge('orange','Nueva') : badge('gray','Leida')}</a>`).join('')}</section>`; }
  function renderNotificationPopover() { return `<aside class="notification-popover"><header><strong>Notificaciones</strong><button class="icon-btn" data-close-notifications>${icon('x')}</button></header>${Data.notifications.map(n => `<a class="not-row" href="#${n.route}"><span class="not-dot"></span><span><strong>${esc(n.title)}</strong><p>${esc(n.detail)}</p><small>${esc(n.date)}</small></span></a>`).join('')}</aside>`; }
  function renderNotFound(message = 'No encontramos la vista solicitada.') { return `${pageHead('No encontrado')}<section class="card pad empty-state"><span class="icon-wrap">${icon('search')}</span><h3>${esc(message)}</h3><a class="btn primary" href="#/">Volver al inicio</a></section>`; }
  function renderEmpty(title, desc) { return `<div class="empty-state"><span class="icon-wrap">${icon('search')}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`; }
  function timeline(items) { return `<div class="timeline">${items.map(h => `<div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>${esc(h.title)}</strong><span>${h.at ? `${fmtDate(h.at)} - ` : ''}${esc(h.detail || '')}</span></div></div>`).join('')}</div>`; }

  async function onClick(e) {
    const role = e.target.closest('[data-login-role]')?.dataset.loginRole;
    if (role === 'student') { saveSession(Data.users.student); routeTo('/'); return; }
    if (e.target.closest('[data-logout]')) { localStorage.removeItem('portal.session'); state.user = null; routeTo('/login'); return; }
    if (e.target.closest('[data-toggle-notifications]')) { state.notificationsOpen = !state.notificationsOpen; render({ transition: true, scope: 'overlay' }); return; }
    if (e.target.closest('[data-close-notifications]')) { state.notificationsOpen = false; render({ transition: true, scope: 'overlay' }); return; }
    if (e.target.closest('[data-clear-panel]')) { state.selectedCourse = null; state.selectedResourceId = null; state.selectedCaseId = null; render({ transition: true, scope: 'panel' }); return; }
    const saveCourse = e.target.closest('[data-save-course]');
    if (saveCourse) { const key = saveCourse.dataset.saveCourse; if (!Data.saved.courses.includes(key)) Data.saved.courses.push(key); persistSnapshot(); apiRequest('/saved', { method: 'POST', body: JSON.stringify({ kind:'courses', id:key }) }).catch(() => {}); showToast('Ramo agregado a seguimiento'); return; }
    const saveResource = e.target.closest('[data-save-resource]');
    if (saveResource) { const id = saveResource.dataset.saveResource; if (!Data.saved.resources.includes(id)) Data.saved.resources.push(id); persistSnapshot(); apiRequest('/saved', { method: 'POST', body: JSON.stringify({ kind:'resources', id }) }).catch(() => {}); showToast('Recurso guardado'); return; }
    const download = e.target.closest('[data-download-resource]');
    if (download) { const r = Data.resources.find(x => x.id === download.dataset.downloadResource); if (r) downloadResource(r); showToast('Descarga preparada', 'blue'); return; }
    if (e.target.closest('[data-report-resource]')) { showToast('Reporte recibido para revision CEAL', 'blue'); return; }
    const markRead = e.target.closest('[data-mark-read]');
    if (markRead) { const c = Data.communications.find(x => x.id === markRead.dataset.markRead); if (c) c.unread = false; persistSnapshot(); showToast('Comunicado marcado como leido', 'blue'); return; }
    if (e.target.closest('[data-copy-link]')) { copyText(location.href).catch(() => {}); showToast('Enlace copiado', 'blue'); return; }
    const reminder = e.target.closest('[data-save-reminder]');
    if (reminder) { const id = reminder.dataset.saveReminder; if (!Data.saved.reminders.includes(id)) Data.saved.reminders.push(id); persistSnapshot(); apiRequest('/saved', { method:'POST', body:JSON.stringify({ kind:'reminders', id }) }).catch(() => {}); showToast('Recordatorio guardado', 'blue'); return; }
    const approve = e.target.closest('[data-approve-material]');
    if (approve) { const r = Data.resources.find(x => x.id === approve.dataset.approveMaterial); if (r) { r.status = 'validadoCeal'; persistSnapshot(); apiRequest(`/materials/${encodeURIComponent(r.id)}`, { method:'PATCH', body:JSON.stringify({ status:'validadoCeal' }) }).catch(() => {}); } showToast('Material validado y publicado'); return; }
    const observe = e.target.closest('[data-observe-material]');
    if (observe) { const r = Data.resources.find(x => x.id === observe.dataset.observeMaterial); if (r) { r.status = 'observado'; persistSnapshot(); apiRequest(`/materials/${encodeURIComponent(r.id)}`, { method:'PATCH', body:JSON.stringify({ status:'observado' }) }).catch(() => {}); } showToast('Material marcado con observaciones', 'blue'); return; }
    const publish = e.target.closest('[data-publish]');
    if (publish) { const form = publish.closest('form'); if (form) form.requestSubmit(); return; }
    const closeCase = e.target.closest('[data-close-case]');
    if (closeCase) { const c = Data.cases.find(x => x.id === closeCase.dataset.closeCase); if (c) { c.status = 'cerrado'; c.history ||= []; c.history.unshift({ at:new Date().toISOString(), title:'Cierre solicitado', detail:'Solicitud registrada por el usuario.' }); persistSnapshot(); apiRequest(`/cases/${encodeURIComponent(c.id)}`, { method:'PATCH', body:JSON.stringify({ status:'cerrado', note:'Solicitud de cierre registrada.' }) }).catch(() => {}); } showToast('Solicitud de cierre registrada'); return; }
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
    const resourceRow = e.target.closest('[data-resource-row]');
    if (resourceRow) { state.selectedResourceId = resourceRow.dataset.resourceRow; render({ transition: true, scope: 'panel' }); return; }
    const tab = e.target.closest('[data-case-tab]');
    if (tab) { state.caseTab = tab.dataset.caseTab; state.selectedCaseId = null; render({ transition: true, scope: 'panel' }); return; }
    const cat = e.target.closest('[data-com-category]');
    if (cat) { state.communicationCategory = cat.dataset.comCategory; render({ transition: true, scope: 'panel' }); return; }
    const faq = e.target.closest('[data-faq]');
    if (faq) { const idx = Number(faq.dataset.faq); state.openFAQ = state.openFAQ === idx ? null : idx; render({ transition: true, scope: 'panel' }); return; }
    const segment = e.target.closest('[data-select-segment]');
    if (segment) { const wrap = segment.parentElement; wrap.querySelectorAll('button').forEach(b => b.classList.remove('active')); segment.classList.add('active'); const hidden = wrap.parentElement.querySelector(`input[name="${segment.dataset.selectSegment}"]`); if (hidden) hidden.value = segment.textContent.trim(); return; }
    const calendarExport = e.target.closest('[data-download-calendar]');
    if (calendarExport) { downloadTextFile('calendario-ceic.ics', Data.events.map(e => `${e.date} ${e.time || ''} - ${e.title}: ${e.description || ''}`).join('\n')); showToast('Agenda exportada', 'blue'); return; }
    const agreementExport = e.target.closest('[data-download-agreement]');
    if (agreementExport) { const a = Data.agreements.find(x => x.id === agreementExport.dataset.downloadAgreement); if (a) downloadTextFile(`${slug(a.number || a.title)}.txt`, JSON.stringify(a, null, 2), 'application/json;charset=utf-8'); showToast('Ficha descargada', 'blue'); return; }
  }
  function onInput(e) {
    if (e.target.matches('[data-malla-search]')) { state.mallaQuery = e.target.value; render(); }
    if (e.target.matches('[data-material-search]')) { state.materialQuery = e.target.value; render(); }
    if (e.target.matches('[data-com-search]')) { state.communicationQuery = e.target.value; render(); }
  }
  function onChange(e) {
    if (e.target.matches('[data-malla-area]')) { state.mallaArea = e.target.value; render(); }
    if (e.target.matches('[data-login-member]')) { state.loginMemberId = e.target.value; state.authMessage = ''; render({ transition: true, scope: 'panel' }); }
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
    if (form.dataset.form === 'ceal-login') {
      const memberId = String(fd.get('memberId'));
      const member = getCealMember(memberId);
      const password = String(fd.get('password') || '');
      const confirm = String(fd.get('confirm') || '');
      try {
        const user = memberHasPassword(member) ? await loginMember(memberId, password) : (password === confirm ? await setupMemberPassword(memberId, password) : (() => { throw new Error('Las contrasenas no coinciden.'); })());
        state.authMessage = '';
        saveSession(user);
        routeTo('/gestion');
      } catch (err) {
        state.authMessage = err.message || 'No se pudo iniciar sesion.';
        render({ transition: true, scope: 'panel' });
      }
      return;
    }
    if (form.dataset.form === 'new-case') {
      let item = { id:`case-${Date.now()}`, number:`#2026-${String(Data.cases.length + 61).padStart(4,'0')}`, title:fd.get('title'), type:fd.get('type') || 'Academico', status:'recibido', priority:fd.get('priority') || 'Normal', createdAt:new Date().toISOString(), courseCode:null, courseName:fd.get('course') || null, responsible:'Por asignar', responsibleRole:'CEAL', summary:fd.get('description'), nextStep:'El equipo CEAL revisara el caso y asignara responsable.', visibility:'Solo tu y el equipo asignado pueden ver este caso.', attachments:[], history:[{ at:new Date().toISOString(), title:'Caso recibido', detail:'Hemos recibido tu caso correctamente.' }] };
      try { const payload = await apiRequest('/cases', { method:'POST', body:JSON.stringify(item) }); if (payload.item) item = payload.item; } catch {}
      Data.cases.unshift(item); persistSnapshot(); showToast('Caso enviado correctamente'); routeTo('/casos/' + item.id); return;
    }
    if (form.dataset.form === 'upload-material') {
      const file = form.elements.file?.files?.[0];
      const courseName = String(fd.get('course') || 'Ramo por asociar');
      let item = { id:`mat-${Date.now()}`, title:fd.get('title'), type:fd.get('type') || 'Apunte', courseCode:courseName, plan:fd.get('plan') || 'planP', courseName, semester:'-', year:fd.get('year') || '2026', format:file?.name?.split('.').pop()?.toUpperCase() || 'LINK', size:file ? humanSize(file.size) : 'Sin archivo', origin:fd.get('origin'), status:'pendienteRevision', uploadedBy:state.user.name, uploadedAt:new Date().toISOString().slice(0,10), description:fd.get('description'), fileName:file?.name || '', fileType:file?.type || '', fileDataUrl: await readFileDataUrl(file) };
      try { const payload = await apiRequest('/materials', { method:'POST', body:JSON.stringify(item) }); if (payload.item) item = payload.item; } catch {}
      Data.resources.unshift(item); persistSnapshot(); showToast('Material enviado a revision'); routeTo('/material/' + item.id); return;
    }
    if (form.dataset.form === 'edit-content') {
      const id = fd.get('id') || Data.communications[0]?.id;
      let item = Data.communications.find(c => c.id === id);
      if (!item) { item = { id:`com-${Date.now()}`, date:new Date().toISOString(), source:'CEIC Ingenieria Civil UCN', unread:true, pinned:false, related:[] }; Data.communications.unshift(item); }
      Object.assign(item, { title:fd.get('title'), category:fd.get('category'), summary:fd.get('summary'), body:fd.get('body'), updatedAt:new Date().toISOString() });
      persistSnapshot();
      apiRequest(`/communications/${encodeURIComponent(item.id)}`, { method:'PATCH', body:JSON.stringify(item) }).catch(() => {});
      showToast('Comunicado guardado');
      routeTo('/comunicados/' + item.id);
      return;
    }
    if (form.dataset.form === 'new-agreement') {
      let item = { id:`agr-${Date.now()}`, number:`Acuerdo CEAL N ${String(Data.agreements.length + 1).padStart(2,'0')}/2026`, status:fd.get('status') || 'enSeguimiento', date:new Date().toISOString(), origin:fd.get('origin'), responsible:fd.get('responsible'), title:fd.get('title'), summary:fd.get('summary'), currentState:'Registrado en Gestion CEAL.', nextStep:fd.get('nextStep'), documents:[], commitments:fd.get('commitment') ? [{ title:fd.get('commitment'), responsible:fd.get('responsible'), due:new Date().toISOString().slice(0,10), status:'pendiente' }] : [], history:[{ at:new Date().toISOString(), title:'Acuerdo creado', detail:'Registro creado desde Gestion CEAL.' }] };
      try { const payload = await apiRequest('/agreements', { method:'POST', body:JSON.stringify(item) }); if (payload.item) item = payload.item; } catch {}
      Data.agreements.unshift(item); persistSnapshot(); showToast('Acuerdo creado'); routeTo('/acuerdos/' + item.id); return;
    }
    if (form.dataset.form === 'manage-case') {
      const id = String(fd.get('id'));
      const item = Data.cases.find(c => c.id === id);
      if (item) {
        item.status = String(fd.get('status'));
        item.responsible = String(fd.get('responsible'));
        item.history ||= [];
        const response = String(fd.get('response') || '').trim();
        const note = String(fd.get('note') || '').trim();
        if (response) item.history.unshift({ at:new Date().toISOString(), title:'Respuesta enviada', detail:response });
        if (note) item.history.unshift({ at:new Date().toISOString(), title:'Nota interna', detail:note });
        persistSnapshot();
        apiRequest(`/cases/${encodeURIComponent(id)}`, { method:'PATCH', body:JSON.stringify({ status:item.status, responsible:item.responsible, response, note }) }).catch(() => {});
      }
      showToast('Gestion del caso guardada');
      routeTo('/casos/' + id);
    }
  }

  window.addEventListener('hashchange', () => render({ transition: true, scope: 'route' }));
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  boot();
})();
