(() => {
  const app = document.getElementById('app');
  const Data = window.PortalMock;
  const Curricula = window.CURRICULA;

  const state = {
    user: loadSession(),
    activePlan: localStorage.getItem('portal.activePlan') || 'planP',
    mobileSemester: Number(localStorage.getItem('portal.mobileSemester') || 4),
    selectedCourse: null,
    selectedCaseId: null,
    selectedResourceId: null,
    selectedAgreementId: null,
    mallaQuery: '',
    mallaArea: 'all',
    materialQuery: '',
    materialType: 'all',
    materialCourse: 'all',
    caseTab: 'misCasos',
    caseFilters: { type: 'all', status: 'all', priority: 'all', date: '' },
    communicationCategory: 'Todas',
    communicationQuery: '',
    openFAQ: null,
    notificationsOpen: false,
    toast: null
  };

  const AreaStyle = {
    basica: { label: 'Ciencias Básicas', color: '#1d4ed8', bg: 'rgba(29,78,216,.075)' },
    ingenieria: { label: 'Ciencias de la Ingeniería', color: '#0f766e', bg: 'rgba(15,118,110,.08)' },
    aplicada: { label: 'Ingeniería Aplicada', color: '#b45309', bg: 'rgba(180,83,9,.085)' },
    general: { label: 'Formación General', color: '#16a34a', bg: 'rgba(22,163,74,.08)' },
    proyecto: { label: 'Proyectos', color: '#075ecb', bg: 'rgba(18,111,227,.09)' },
    electivo: { label: 'Electivos Profesionales', color: '#7c3aed', bg: 'rgba(124,58,237,.08)' }
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

  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="m3 10.8 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24"><path d="M3 11v3a2 2 0 0 0 2 2h2l4 4v-5l9-3V7L7 10H5a2 2 0 0 0-2 2Z"/><path d="M20 7V4"/><path d="M20 17v-3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4"/><path d="M17 3v4"/><rect x="3" y="5" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.8l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .4.14.78.4 1 .3.3.7.4 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M12 12h.01"/><path d="M19 12h.01"/><path d="M5 12h.01"/></svg>'
  };

  function icon(name, extra = '') { return `<span class="icon ${extra}">${ICONS[name] || ICONS.file}</span>`; }
  function esc(v) { return String(v ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s])); }
  function fmtDate(date, opts = {}) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return esc(date);
    return d.toLocaleDateString('es-CL', opts.dateStyle ? opts : { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtTime(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }
  function routeTo(path) { window.location.hash = path; }
  function getRoute() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, queryString = ''] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(queryString));
    return { path: path || '/', query };
  }
  function loadSession() {
    try { return JSON.parse(localStorage.getItem('portal.session') || 'null'); }
    catch { return null; }
  }
  function saveSession(user) {
    state.user = user;
    localStorage.setItem('portal.session', JSON.stringify(user));
  }
  function showToast(message, type = 'green') {
    state.toast = { message, type };
    render();
    setTimeout(() => { state.toast = null; render(); }, 2400);
  }
  function badge(key, overrideLabel) {
    const [label, color] = Status[key] || [overrideLabel || key, 'gray'];
    return `<span class="status-chip ${color}">${esc(overrideLabel || label)}</span>`;
  }
  function planLabel(plan) { return plan === 'planO' ? 'Plan O · Catálogo 2016' : 'Plan P · Catálogo 2025'; }
  function planShort(plan) { return plan === 'planO' ? 'Plan O' : 'Plan P'; }
  function getPlanData(plan = state.activePlan) { return Curricula[plan] || Curricula.planP; }
  function getCourses(plan = state.activePlan) { return (Curricula[plan]?.subjects || []); }
  function findCourse(plan, code) { return getCourses(plan).find(c => c.code === code || c.visibleCode === code); }
  function findCoursePlanForCode(code) { return ['planP','planO'].find(plan => findCourse(plan, code)) || state.activePlan; }
  function courseKey(plan, code) { return `${plan}:${code}`; }
  function getProgress(plan, code) { return Data.courseProgress[courseKey(plan, code)] || 'pending'; }
  function areaLabel(area) { return AreaStyle[area]?.label || area; }
  function getSuccessors(plan, code) { return getCourses(plan).filter(c => (c.prereqs || []).includes(code)); }
  function getDirectPrereqs(plan, course) { return (course.prereqs || []).map(code => findCourse(plan, code)).filter(Boolean); }
  function getPrereqChain(plan, code, seen = new Set()) {
    if (seen.has(code)) return [];
    seen.add(code);
    const course = findCourse(plan, code);
    if (!course) return [];
    return (course.prereqs || []).flatMap(pr => [pr, ...getPrereqChain(plan, pr, seen)]);
  }
  function getSuccessorChain(plan, code, seen = new Set()) {
    if (seen.has(code)) return [];
    seen.add(code);
    return getSuccessors(plan, code).flatMap(s => [s.code, ...getSuccessorChain(plan, s.code, seen)]);
  }
  function getCourseResources(plan, code) { return Data.resources.filter(r => r.courseCode === code || (r.plan === plan && r.courseCode === code)); }
  function getCourseTutoring(code) { return Data.tutoring.filter(t => t.courseCode === code); }
  function getCourseDescription(plan, code) { return getPlanData(plan).descriptions?.[code] || 'Información curricular del ramo. Revisa prerrequisitos, material asociado y ramos que habilita dentro del portal.'; }
  function getUnreadCount() { return Data.notifications.filter(n => n.unread).length; }

  function navItems() {
    const items = [
      ['/', 'home', 'Inicio'],
      ['/comunicados', 'megaphone', 'Comunicados'],
      ['/calendario', 'calendar', 'Calendario y acuerdos'],
      ['/casos', 'folder', 'Casos'],
      ['/material', 'book', 'Material'],
      ['/mallas', 'grid', 'Mallas'],
      ['/apoyo', 'users', 'Ayudantías y trámites']
    ];
    if (state.user?.role === 'ceal') items.push(['/gestion', 'settings', 'Gestión CEAL']);
    return items;
  }
  function isActive(path, itemPath) {
    if (itemPath === '/') return path === '/';
    return path === itemPath || path.startsWith(itemPath + '/') || (itemPath === '/calendario' && path.startsWith('/acuerdos/')) || (itemPath === '/mallas' && path.startsWith('/ramo/'));
  }

  function render() {
    const { path, query } = getRoute();
    if (!state.user && path !== '/login') {
      routeTo('/login');
      return;
    }
    if (state.user && path === '/login') {
      routeTo('/');
      return;
    }
    if (path === '/login') {
      app.innerHTML = renderLogin();
      return;
    }
    const content = renderPage(path, query);
    app.innerHTML = renderShell(content, path);
  }

  function renderLogin() {
    return `
      <main class="login-shell">
        <section class="login-card" aria-label="Ingreso al portal">
          <div class="login-brand">
            <div>
              <img src="assets/logo-horizontal.png" alt="CEIC UCN Ingeniería Civil UCN" />
              <h1>Portal CEIC / CEAL UCN</h1>
              <p>Herramienta de consulta y seguimiento para estudiantes de Ingeniería Civil UCN: mallas, material, casos, calendario, acuerdos y apoyo académico.</p>
            </div>
            <div class="login-note">${icon('shield')} <span>Vista demo. La sesión y los cambios se guardan en este navegador.</span></div>
          </div>
          <div class="login-form">
            <span class="eyebrow">Acceso</span>
            <h2>Entrar al portal</h2>
            <p>Selecciona una opción para continuar.</p>
            <div class="role-grid">
              <button class="role-card" data-login-role="student">
                <span class="role-icon">${icon('user')}</span>
                <span><strong>Estudiante</strong><span>Consulta material, mallas, casos, fechas y comunicados.</span></span>
                ${icon('arrow')}
              </button>
              <button class="role-card" data-login-role="ceal">
                <span class="role-icon">${icon('settings')}</span>
                <span><strong>Miembro CEAL</strong><span>Actualiza contenidos, casos, acuerdos y material validado.</span></span>
                ${icon('arrow')}
              </button>
            </div>
          </div>
        </section>
      </main>`;
  }

  function renderShell(content, path) {
    const user = state.user;
    const nav = navItems().map(([href, ico, label]) => `
      <a class="nav-item ${isActive(path, href) ? 'active' : ''}" href="#${href}">${icon(ico)}<span>${label}</span></a>
    `).join('');
    const isBottomActive = (href) => {
      if (isActive(path, href)) return true;
      if (href === '/calendario' && path.startsWith('/acuerdos')) return true;
      if (href === '/mas' && ['/comunicados','/mallas','/ramo','/apoyo','/ayudantias','/tramites','/perfil','/gestion','/buscar','/notificaciones'].some(p => path.startsWith(p))) return true;
      return false;
    };

    const bottom = [
      ['/', 'home', 'Inicio'],
      ['/calendario', 'calendar', 'Calendario'],
      ['/casos', 'folder', 'Casos'],
      ['/material', 'book', 'Material'],
      ['/mas', 'more', 'Más']
    ].map(([href, ico, label]) => `<a class="bottom-item ${isBottomActive(href) ? 'active' : ''}" href="#${href}">${icon(ico)}<span>${label}</span></a>`).join('');

    return `
      <div class="app-shell">
        <aside class="sidebar">
          <a class="sidebar-brand" href="#/">
            <span class="brand-mark"><img src="assets/logo-mark.png" alt="CEIC UCN" /></span>
            <span class="brand-copy"><strong>CEIC UCN</strong><span>INGENIERÍA CIVIL UCN</span></span>
          </a>
          <nav class="nav">${nav}</nav>
          <div class="sidebar-user">
            <div class="user-mini"><span class="avatar">${esc(user.initials)}</span><span><strong>${esc(user.name)}</strong><span>${esc(user.label)} · ${planShort(user.plan)} · ${esc(user.yearLabel)}</span></span></div>
            <a class="profile-link" href="#/perfil">Ver perfil ${icon('arrow')}</a>
          </div>
        </aside>
        <main class="app-main">
          <header class="topbar">
            <form class="global-search" data-global-search-form>
              <button class="search-submit" type="submit" aria-label="Buscar">${icon('search')}</button>
              <input name="q" type="search" placeholder="Buscar en el portal..." autocomplete="off" />
            </form>
            <div class="topbar-actions">
              <button class="icon-btn" data-toggle-notifications aria-label="Notificaciones">${icon('bell')}<span class="badge-count">${getUnreadCount()}</span></button>
              <a class="account-trigger" href="#/perfil">${icon('user')}<span>Mi cuenta</span></a>
            </div>
          </header>
          <header class="mobile-header">
            <a class="mobile-brand" href="#/"><img src="assets/logo-mark.png" alt="CEIC UCN" /><strong>CEIC / CEAL UCN</strong></a>
            <div class="mobile-actions"><button class="icon-btn" data-toggle-notifications>${icon('bell')}<span class="badge-count">${getUnreadCount()}</span></button><a class="icon-btn" href="#/perfil">${icon('user')}</a></div>
          </header>
          <section class="content">${content}</section>
          <nav class="bottom-nav">${bottom}</nav>
        </main>
        ${state.notificationsOpen ? renderNotificationPopover() : ''}
        ${state.toast ? `<div class="notification-popover" style="top:auto;right:28px;bottom:28px;width:340px"><header><strong>${esc(state.toast.message)}</strong><span class="status-chip ${state.toast.type}">${state.toast.type === 'green' ? 'Listo' : 'Aviso'}</span></header></div>` : ''}
      </div>`;
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
    if (path === '/material') return renderMaterial();
    if (path === '/material/subir') return renderUploadMaterial();
    if (path.startsWith('/material/')) return renderMaterialDetailPage(path.split('/')[2]);
    if (path === '/mallas') return renderMallas();
    if (path.startsWith('/ramo/')) {
      const [, , plan, code] = path.split('/');
      return renderCourseDetailPage(plan, decodeURIComponent(code));
    }
    if (path === '/apoyo') return renderSupport();
    if (path.startsWith('/ayudantias/')) return renderTutoringDetail(path.split('/')[2]);
    if (path.startsWith('/tramites/')) return renderProcedureDetail(path.split('/')[2]);
    if (path === '/gestion') return ensureCEAL(renderManagement());
    if (path.startsWith('/gestion/comunicados/')) return ensureCEAL(renderEditor(path.split('/')[3]));
    if (path.startsWith('/gestion/material/')) return ensureCEAL(renderValidateMaterial(path.split('/')[3]));
    return renderNotFound();
  }

  function pageHead(title, subtitle, actions = '') {
    return `<div class="page-head"><div><h1 class="page-title">${esc(title)}</h1>${subtitle ? `<p class="page-subtitle">${esc(subtitle)}</p>` : ''}</div>${actions ? `<div class="hstack">${actions}</div>` : ''}</div>`;
  }

  function renderHome() {
    const unread = Data.communications.filter(c => c.unread).length;
    const openCases = Data.cases.filter(c => !['resuelto','cerrado'].includes(c.status)).length;
    const nextEvents = Data.events.slice(0, 4);
    const plan = state.user?.plan || state.activePlan;
    const courses = getCourses(plan);
    const approved = courses.filter(c => getProgress(plan, c.code) === 'approved').length;
    const inProgress = courses.filter(c => getProgress(plan, c.code) === 'inProgress').length;
    const progress = courses.length ? Math.round((approved / courses.length) * 100) : 0;
    const latestResources = Data.resources.filter(r => r.status !== 'pendienteRevision').slice(0, 3);
    const recent = [
      { icon: 'megaphone', color: '', title: 'Comunicado académico', desc: Data.communications[0].summary, meta: 'Hoy, 09:15', route: '/comunicados/com-001' },
      { icon: 'book', color: 'green', title: 'Nuevo material agregado', desc: 'Apuntes y ejercicios de Hormigón Armado I disponibles.', meta: 'Ayer, 18:40', route: '/material/mat-006' },
      { icon: 'file', color: 'orange', title: 'Acuerdo publicado', desc: 'Acuerdo N° 2026-15 sobre actualización de calendario.', meta: '14 may, 12:10', route: '/acuerdos/agr-003' },
      { icon: 'calendar', color: '', title: 'Fecha próxima', desc: 'Cierre de formulario de inscripción a ayudantías.', meta: '14 may, 10:05', route: '/calendario' }
    ];
    return `
      ${pageHead('Inicio', 'Revisa avisos, fechas, material y solicitudes activas.', '')}
      <section class="home-hero">
        <div class="home-summary card pad">
          <div class="row-between home-summary-head">
            <div>
              <span class="eyebrow">Resumen</span>
              <h2>Qué revisar hoy</h2>
              <p>Prioriza fechas, material nuevo y solicitudes abiertas sin perderte entre secciones.</p>
            </div>
            ${badge('green', 'Actualizado')}
          </div>
          <div class="stat-grid compact">
            ${stat('megaphone', unread, 'Comunicados', 'nuevos')}
            ${stat('calendar', nextEvents.length, 'Fechas', 'próximas')}
            ${stat('folder', openCases, 'Casos', 'abiertos')}
            ${stat('book', Data.resources.filter(r => r.status !== 'pendienteRevision').length, 'Recursos', 'visibles')}
          </div>
        </div>
        <div class="home-plan card pad">
          <span class="eyebrow">Tu malla</span>
          <h2>${planLabel(plan)}</h2>
          <p>${approved} ramos aprobados, ${inProgress} en curso y ${courses.length - approved - inProgress} pendientes.</p>
          <div class="progress-bar"><span style="width:${progress}%"></span></div>
          <div class="home-plan-actions">
            <a class="btn primary" href="#/mallas">${icon('grid')} Ver malla</a>
            <a class="btn secondary" href="#/material">${icon('book')} Buscar material</a>
          </div>
        </div>
      </section>
      <section class="card pad home-actions">
        <div class="row-between"><h2 class="card-title">Acciones frecuentes</h2><a class="link" href="#/mas">Ver todo ${icon('arrow')}</a></div>
        <div class="quick-grid">
          ${quick('search', 'Buscar material', '/material', 'green')}
          ${quick('grid', 'Revisar malla', '/mallas')}
          ${quick('plus', 'Reportar un caso', '/casos/nuevo', 'orange')}
          ${quick('calendar', 'Ver calendario', '/calendario')}
        </div>
      </section>
      <div class="grid two home-lower">
        <section class="card pad">
          <div class="row-between"><h2 class="card-title">Novedades recientes</h2><a class="link" href="#/comunicados">Ver todas ${icon('arrow')}</a></div>
          <div class="feed-list">${recent.map(r => feedRow(r)).join('')}</div>
        </section>
        <section class="card pad">
          <div class="row-between"><h2 class="card-title">Próximas fechas</h2><a class="link" href="#/calendario">Ver calendario ${icon('arrow')}</a></div>
          <div class="date-list">${nextEvents.map(e => dateRow(e)).join('')}</div>
        </section>
      </div>
      <section class="card pad home-lower">
        <div class="row-between"><h2 class="card-title">Módulos principales</h2><span class="pill gray">Portal CEIC UCN</span></div>
        <div class="access-grid">
          ${access('book', 'Biblioteca académica', 'Busca pruebas, guías, apuntes y recursos por ramo.', 'Ir a material', '/material')}
          ${access('grid', 'Mallas interactivas', 'Explora Plan O y Plan P, ramos y prerrequisitos.', 'Explorar mallas', '/mallas', 'orange')}
          ${access('folder', 'Casos y seguimiento', 'Sigue el estado de tus casos y solicitudes.', 'Ver mis casos', '/casos', 'green')}
          ${access('calendar', 'Calendario y acuerdos', 'Consulta fechas importantes y acuerdos publicados.', 'Ir al calendario', '/calendario')}
        </div>
      </section>
      <section class="card pad home-lower">
        <div class="row-between"><h2 class="card-title">Material reciente</h2><a class="link" href="#/material">Abrir biblioteca ${icon('arrow')}</a></div>
        <div class="material-strip">${latestResources.map(resourceCard).join('')}</div>
      </section>`;
  }
  function stat(ico, num, label, sub) { return `<div class="stat-card"><span class="icon-box">${icon(ico)}</span><strong>${num}</strong><span>${label}<br><span style="color:var(--blue-700)">${sub}</span></span></div>`; }
  function quick(ico, label, route, color='') { return `<a class="quick-card" href="#${route}"><span class="icon-box ${color}">${icon(ico)}</span><span>${esc(label)}</span></a>`; }
  function feedRow(r) { return `<a class="feed-row" href="#${r.route}"><span class="icon-box ${r.color || ''}">${icon(r.icon)}</span><span><strong>${esc(r.title)}</strong><p>${esc(r.desc)}</p></span><time class="small muted">${esc(r.meta)}</time></a>`; }
  function dateRow(e) {
    const d = new Date(e.date + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const mon = d.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase().replace('.', '');
    return `<a class="date-row" href="#/calendario"><span class="date-box">${day}<small>${mon}</small></span><span><strong>${esc(e.title)}</strong><br><span class="small muted">${esc(e.description)}</span></span><span class="pill blue">${esc(e.time)}</span></a>`;
  }
  function access(ico, title, desc, action, route, color='') { return `<a class="access-card" href="#${route}"><span class="icon-box ${color}">${icon(ico)}</span><strong>${esc(title)}</strong><p>${esc(desc)}</p><span class="link">${esc(action)} ${icon('arrow')}</span></a>`; }

  function renderMallas() {
    const plan = state.activePlan;
    const data = getPlanData(plan);
    if (state.mobileSemester > data.totalSemesters) state.mobileSemester = 1;
    let selected = state.selectedCourse?.plan === plan ? findCourse(plan, state.selectedCourse.code) : null;
    if (!selected) {
      const firstInMobileSemester = getCourses(plan).find(c => c.semester === state.mobileSemester);
      const defaultCode = plan === 'planP' ? 'P-0505' : 'DAIC-00504';
      selected = firstInMobileSemester || findCourse(plan, defaultCode) || getCourses(plan)[0] || null;
      if (selected) state.selectedCourse = { plan, code: selected.code };
    }
    const q = state.mallaQuery.trim().toLowerCase();
    const columns = [];
    for (let s = 1; s <= data.totalSemesters; s++) {
      let courses = getCourses(plan).filter(c => c.semester === s).sort((a,b) => a.row - b.row);
      if (state.mallaArea !== 'all') courses = courses.filter(c => c.area === state.mallaArea);
      if (q) courses = courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.visibleCode || '').toLowerCase().includes(q) || String(c.semester).includes(q.replace(/\D/g, '')));
      columns.push(courses);
    }
    const prereqSet = new Set(selected ? getPrereqChain(plan, selected.code) : []);
    const successorSet = new Set(selected ? getSuccessorChain(plan, selected.code) : []);
    const mobileTabs = Array.from({length: data.totalSemesters}, (_,i) => `<button class="sem-btn ${state.mobileSemester === i+1 ? 'active' : ''}" data-mobile-sem="${i+1}">${i+1}°</button>`).join('');
    return `
      ${pageHead('Mallas interactivas', 'Explora ramos, prerrequisitos y avance por plan', `<a class="btn secondary" href="#/material">${icon('book')} Ver material</a>`)}
      <section class="malla-shell">
        <aside class="card pad malla-toolbar">
          <div class="plan-switch">
            <button class="plan-btn ${plan==='planO'?'active':''}" data-plan="planO">Plan O<br><small>Catálogo 2016</small></button>
            <button class="plan-btn ${plan==='planP'?'active':''}" data-plan="planP">Plan P<br><small>Catálogo 2025</small></button>
          </div>
          <div class="form-field"><label>Buscar ramo</label><input class="input" data-malla-search value="${esc(state.mallaQuery)}" placeholder="Nombre, código o semestre" /></div>
          <div class="filter-stack">
            <div class="form-field"><label>Área</label><select class="select" data-malla-area><option value="all">Todas</option>${Object.keys(AreaStyle).map(a => `<option value="${a}" ${state.mallaArea===a?'selected':''}>${AreaStyle[a].label}</option>`).join('')}</select></div>
            <div><h3 class="card-title">Estados</h3><div class="legend-list"><span class="legend-item"><span class="progress-dot approved"></span>Aprobado</span><span class="legend-item"><span class="progress-dot inProgress"></span>En curso</span><span class="legend-item"><span class="progress-dot pending"></span>Pendiente</span></div></div>
            <div><h3 class="card-title">Áreas</h3><div class="legend-list">${Object.entries(AreaStyle).map(([k,v]) => `<span class="legend-item"><span class="area-dot" style="background:${v.color}"></span>${v.label}</span>`).join('')}</div></div>
            <div class="divider"></div>
            <p class="small muted">Selecciona un ramo para ver prerrequisitos, qué abre y recursos asociados. Haz clic en el punto de estado para cambiar tu avance demo.</p>
          </div>
        </aside>
        <main class="malla-stage">
          <div class="malla-stage-head"><div><strong>${planLabel(plan)}</strong><br><span class="small muted">${data.expectedSubjects} asignaturas · ${data.totalSemesters} semestres</span></div><span class="pill blue">Malla real integrada</span></div>
          <div class="mobile-semesters">${mobileTabs}</div>
          <section class="mobile-only card pad malla-mobile-detail">${selected ? renderCourseMobileSummary(selected, plan) : renderCourseEmpty()}</section>
          <div class="malla-scroll">
            <div class="malla-grid">
              <div class="semester-labels" style="grid-template-columns:repeat(${data.totalSemesters},var(--course-col-w))">${columns.map((col,i)=>`<div class="semester-label">${i+1}° Semestre<small>${col.reduce((a,c)=>a+(c.sct||0),0)} SCT</small></div>`).join('')}</div>
              <div class="course-grid" style="grid-template-columns:repeat(${data.totalSemesters},var(--course-col-w))">${columns.map((col,i)=>`<div class="course-column ${state.mobileSemester===i+1?'mobile-active':''}">${col.map(c => courseCard(plan, c, selected, prereqSet, successorSet)).join('') || `<div class="empty-state small">Sin ramos visibles</div>`}</div>`).join('')}</div>
            </div>
          </div>
        </main>
        <aside class="card pad course-detail-panel">${selected ? renderCourseDetail(selected, plan, true) : renderCourseEmpty()}</aside>
      </section>`;
  }
  function courseCard(plan, c, selected, prereqSet, successorSet) {
    const st = getProgress(plan, c.code);
    const area = AreaStyle[c.area] || AreaStyle.ingenieria;
    const cls = [selected && c.code === selected.code ? 'selected' : '', selected && !prereqSet.has(c.code) && !successorSet.has(c.code) && c.code !== selected.code ? 'dimmed' : '', prereqSet.has(c.code) ? 'prereq' : '', successorSet.has(c.code) ? 'successor' : '', c.large || c.sct >= 20 ? 'large' : ''].join(' ');
    return `<button class="course-card ${cls}" style="--area-color:${area.color};--area-bg:${area.bg}" data-course="${esc(c.code)}" data-course-plan="${plan}">
      <span class="course-code">${esc(c.visibleCode || c.code)}</span><span class="course-name">${esc(titleCase(c.name))}</span><span class="course-meta"><span class="sct">${c.sct} SCT</span><span class="progress-dot ${st}" title="${Status[st]?.[0] || st}" data-cycle-status="${esc(c.code)}" data-cycle-plan="${plan}"></span></span>
    </button>`;
  }
  function renderCourseEmpty() { return `<div class="empty-state"><span class="icon-wrap">${icon('grid')}</span><h3>Selecciona un ramo</h3><p>Toca un ramo de la malla para revisar prerrequisitos, recursos y ramos que habilita.</p></div>`; }
  function renderCourseDetail(course, plan, compact = false) {
    const prereqs = getDirectPrereqs(plan, course);
    const successors = getSuccessors(plan, course.code);
    const resources = getCourseResources(plan, course.code);
    const tutoring = getCourseTutoring(course.code);
    const st = getProgress(plan, course.code);
    return `
      <div class="row-between"><div><span class="kicker">${esc(course.visibleCode || course.code)}</span><h2 class="card-title" style="font-size:1.25rem;margin-top:4px">${esc(titleCase(course.name))}</h2></div>${compact ? `<button class="icon-btn" data-clear-panel>${icon('x')}</button>` : ``}</div>
      <div class="hstack" style="flex-wrap:wrap">${badge(st)}<span class="pill blue">${course.semester}° semestre</span><span class="pill gray">${course.sct} SCT</span></div>
      <div class="detail-block"><div class="detail-row"><span>Plan</span><strong>${planShort(plan)}</strong></div><div class="detail-row"><span>Área</span><strong>${areaLabel(course.area)}</strong></div><div class="detail-row"><span>Tipo</span><strong>Asignatura curricular</strong></div></div>
      <div class="detail-block"><h3 class="card-title">Descripción</h3><p class="small muted" style="line-height:1.55">${esc(getCourseDescription(plan, course.code))}</p></div>
      <div class="detail-block"><h3 class="card-title">Prerrequisitos</h3>${prereqs.length ? `<div class="link-card-list">${prereqs.map(p => courseMini(plan, p)).join('')}</div>` : `<p class="small muted">Este ramo no registra prerrequisitos directos.</p>`}</div>
      <div class="detail-block"><h3 class="card-title">Abre estos ramos</h3>${successors.length ? `<div class="link-card-list">${successors.slice(0,6).map(s => courseMini(plan, s)).join('')}</div>` : `<p class="small muted">No registra ramos posteriores directos en esta malla.</p>`}</div>
      ${(course.requirements || []).length ? `<div class="detail-block"><h3 class="card-title">Requisitos adicionales</h3><ul class="small muted">${course.requirements.map(r => `<li>• ${esc(r)}</li>`).join('')}</ul></div>` : ''}
      <div class="detail-block"><h3 class="card-title">Recursos asociados</h3>${resources.length ? `<div class="link-card-list">${resources.slice(0,4).map(r => `<a class="link-card-row" href="#/material/${r.id}"><span><strong>${esc(r.title)}</strong><span>${esc(r.type)} · ${esc(r.format)} · ${esc(r.size)}</span></span>${icon('arrow')}</a>`).join('')}</div>` : `<p class="small muted">Aún no hay recursos asociados a este ramo.</p>`}</div>
      <div class="detail-block"><h3 class="card-title">Ayudantías</h3>${tutoring.length ? `<div class="link-card-list">${tutoring.map(t => `<a class="link-card-row" href="#/ayudantias/${t.id}"><span><strong>${esc(t.title)}</strong><span>${fmtDate(t.date)} · ${esc(t.time)}</span></span>${icon('arrow')}</a>`).join('')}</div>` : `<p class="small muted">No hay ayudantías vigentes registradas.</p>`}</div>
      <div class="vstack">${compact ? `<a class="btn primary" href="#/ramo/${plan}/${encodeURIComponent(course.code)}">${icon('eye')} Ver detalle completo</a>` : `<a class="btn primary" href="#/mallas">${icon('grid')} Ver en malla</a>`}<button class="btn secondary" data-save-course="${plan}:${esc(course.code)}">${icon('bookmark')} Agregar a seguimiento</button></div>`;
  }
  function renderCourseMobileSummary(course, plan) {
    const prereqs = getDirectPrereqs(plan, course);
    const successors = getSuccessors(plan, course.code);
    const resources = getCourseResources(plan, course.code);
    const st = getProgress(plan, course.code);
    return `<div class="row-between"><div><span class="kicker">Ramo seleccionado</span><h2 class="card-title" style="font-size:1.16rem;margin-top:4px">${esc(titleCase(course.name))}</h2></div>${badge(st)}</div>
      <div class="hstack" style="flex-wrap:wrap"><span class="pill blue">${esc(course.visibleCode || course.code)}</span><span class="pill gray">${course.semester}° semestre</span><span class="pill gray">${course.sct} SCT</span></div>
      <div class="mobile-course-facts">
        <span><strong>${prereqs.length}</strong><small>prerrequisitos</small></span>
        <span><strong>${successors.length}</strong><small>ramos abre</small></span>
        <span><strong>${resources.length}</strong><small>recursos</small></span>
      </div>
      <div class="home-plan-actions">
        <a class="btn primary" href="#/ramo/${plan}/${encodeURIComponent(course.code)}">${icon('eye')} Detalle</a>
        <a class="btn secondary" href="#/material">${icon('book')} Material</a>
      </div>`;
  }
  function courseMini(plan, c) { return `<button class="link-card-row" data-course="${esc(c.code)}" data-course-plan="${plan}"><span><strong>${esc(titleCase(c.name))}</strong><span>${esc(c.visibleCode || c.code)} · ${c.semester}° semestre</span></span>${icon('arrow')}</button>`; }
  function renderCourseDetailPage(plan, code) {
    const course = findCourse(plan, code);
    if (!course) return renderNotFound('No encontramos el ramo solicitado.');
    return `${pageHead(titleCase(course.name), `${planLabel(plan)} · ${course.visibleCode || course.code}`, `<a class="btn secondary" href="#/mallas">${icon('grid')} Volver a malla</a>`)}
      <div class="split wide"><section class="card pad">${renderCourseDetail(course, plan, false)}</section><aside class="card pad">${renderCourseConnections(course, plan)}</aside></div>`;
  }
  function renderCourseConnections(course, plan) {
    const resources = getCourseResources(plan, course.code);
    const cases = Data.cases.filter(c => c.courseCode === course.code);
    return `<h2 class="card-title">Conexiones útiles</h2><p class="card-subtitle">Solo se muestran módulos relacionados directamente con este ramo.</p>
      <div class="detail-block"><h3 class="card-title">Material del ramo</h3>${resources.length ? resources.map(r=>`<a class="link-card-row" href="#/material/${r.id}"><span><strong>${esc(r.title)}</strong><span>${esc(r.type)} · ${esc(r.status)}</span></span>${icon('arrow')}</a>`).join('') : '<p class="small muted">Sin material relacionado.</p>'}</div>
      <div class="detail-block"><h3 class="card-title">Casos asociados</h3>${cases.length ? cases.map(c=>`<a class="link-card-row" href="#/casos/${c.id}"><span><strong>${esc(c.title)}</strong><span>${esc(c.number)} · ${Status[c.status]?.[0] || c.status}</span></span>${icon('arrow')}</a>`).join('') : '<p class="small muted">No hay casos propios asociados.</p>'}</div>
      <a class="btn primary full" href="#/material?course=${encodeURIComponent(course.code)}">Ver material</a>`;
  }

  function renderMaterial() {
    const q = state.materialQuery.trim().toLowerCase();
    const items = Data.resources.filter(r =>
      (!q || [r.title,r.courseName,r.courseCode,r.type,r.origin].join(' ').toLowerCase().includes(q)) &&
      (state.materialType === 'all' || r.type === state.materialType) &&
      (state.materialCourse === 'all' || r.courseName === state.materialCourse)
    );
    const selected = Data.resources.find(r => r.id === state.selectedResourceId) || items[0];
    const types = ['all','Guía','Prueba','Apunte','PPT','PDF','Resumen','Ejercicios'];
    const courses = [...new Set(Data.resources.map(r => r.courseName))].slice(0, 8);
    return `${pageHead('Biblioteca académica', 'Recursos para estudiar por ramo', `<a class="btn primary" href="#/material/subir">${icon('upload')} Subir material</a>`)}
      <div class="split wide">
        <section class="card pad">
          <div class="form-field"><label>Buscar recurso</label><input class="input" data-material-search value="${esc(state.materialQuery)}" placeholder="Buscar ramo, prueba, apunte o guía" /></div>
          <div class="material-filter-group">
            <div class="segmented">${types.map(t => `<button class="${state.materialType===t?'active':''}" data-material-type="${t}">${t==='all'?'Todos':t}</button>`).join('')}</div>
            <div class="segmented course-chips"><button class="${state.materialCourse==='all'?'active':''}" data-material-course="all">Todos los ramos</button>${courses.map(c => `<button class="${state.materialCourse===c?'active':''}" data-material-course="${esc(c)}">${esc(c)}</button>`).join('')}</div>
          </div>
          <div class="row-between material-count"><h2 class="card-title">${items.length} recursos encontrados</h2><span class="pill gray">Orden: recientes</span></div>
          <div class="card table-card"><table class="data-table"><thead><tr><th>Recurso</th><th>Ramo</th><th>Sem.</th><th>Año</th><th>Estado</th><th></th></tr></thead><tbody>${items.map(r => `<tr class="clickable" data-resource-row="${r.id}"><td><strong>${esc(r.title)}</strong><br><span class="small muted">${esc(r.type)} · ${esc(r.format)}</span></td><td>${esc(r.courseName)}<br><span class="small muted">${esc(r.courseCode)}</span></td><td>${r.semester}</td><td>${r.year}</td><td>${badge(r.status)}</td><td>${icon('more')}</td></tr>`).join('')}</tbody></table></div>
          <div class="mobile-card-list">${items.length ? items.map(r => resourceCard(r)).join('') : renderEmptyMaterial()}</div>
        </section>
        <aside class="card pad course-detail-panel">${selected ? renderResourceDetail(selected) : renderEmptyMaterial()}</aside>
      </div>`;
  }
  function resourceCard(r) { return `<a class="item-card" href="#/material/${r.id}"><div class="row-between"><span class="icon-box">${icon('file')}</span>${badge(r.status)}</div><h3>${esc(r.title)}</h3><p>${esc(r.courseName)} · ${esc(r.format)} · ${esc(r.size)}</p></a>`; }
  function renderResourceDetail(r) {
    return `<div class="row-between"><div><span class="kicker">Recurso seleccionado</span><h2 class="card-title" style="font-size:1.3rem;margin-top:4px">${esc(r.title)}</h2></div><button class="icon-btn" data-clear-panel>${icon('x')}</button></div>
      <div class="hstack" style="flex-wrap:wrap">${badge(r.status)}<span class="pill blue">${esc(r.format)}</span><span class="pill gray">${esc(r.size)}</span></div>
      <p class="small muted" style="line-height:1.55;margin-top:14px">${esc(r.description)}</p>
      <div class="detail-block"><div class="detail-row"><span>Ramo</span><strong>${esc(r.courseName)}</strong></div><div class="detail-row"><span>Código</span><strong>${esc(r.courseCode)}</strong></div><div class="detail-row"><span>Semestre</span><strong>${r.semester}</strong></div><div class="detail-row"><span>Año</span><strong>${r.year}</strong></div><div class="detail-row"><span>Origen</span><strong>${esc(r.origin)}</strong></div><div class="detail-row"><span>Subido por</span><strong>${esc(r.uploadedBy)}</strong></div></div>
      <div class="vstack"><button class="btn secondary" data-save-resource="${esc(r.id)}">${icon('bookmark')} Guardar</button><button class="btn primary" data-demo-action="Descarga simulada: ${esc(r.title)}">${icon('upload')} Descargar</button><button class="btn danger" data-demo-action="Reporte registrado para revisión CEAL">${icon('x')} Reportar error</button><a class="btn ghost" href="#/ramo/${findCoursePlanForCode(r.courseCode)}/${encodeURIComponent(r.courseCode)}">Ver ramo ${icon('arrow')}</a></div>`;
  }
  function renderEmptyMaterial() { return `<div class="empty-state"><span class="icon-wrap">${icon('book')}</span><h3>Sin recursos visibles</h3><p>Prueba limpiar filtros o subir material para revisión.</p></div>`; }
  function renderMaterialDetailPage(id) {
    const r = Data.resources.find(x => x.id === id);
    if (!r) return renderNotFound('No encontramos el recurso solicitado.');
    const rPlan = Curricula[r.plan] ? r.plan : findCoursePlanForCode(r.courseCode);
    const relatedCourse = findCourse(rPlan, r.courseCode) || { code:r.courseCode,name:r.courseName,semester:r.semester,sct:0,area:'ingenieria' };
    return `${pageHead('Detalle de recurso', `${r.courseName} · ${r.type}`, `<a class="btn secondary" href="#/material">Volver a material</a>`)}<div class="split"><section class="card pad">${renderResourceDetail(r)}</section><aside class="card pad"><h2 class="card-title">Ramo relacionado</h2>${courseCard(rPlan, relatedCourse, null, new Set(), new Set())}<div class="divider"></div><a class="btn primary full" href="#/ramo/${rPlan}/${encodeURIComponent(r.courseCode)}">Abrir detalle de ramo</a></aside></div>`;
  }
  function renderUploadMaterial() {
    return `${pageHead('Subir material', 'Aporta un recurso para revisión CEAL', `<a class="btn secondary" href="#/material">Volver</a>`)}
      <div class="split">
        <form class="card pad form" data-form="upload-material">
          <div><h2 class="card-title">Información del recurso</h2><p class="card-subtitle">El material quedará como pendiente de revisión antes de publicarse.</p></div>
          <div class="form-field"><label>Tipo de recurso</label><div class="segmented">${['Apunte','Guía','Prueba','PPT','PDF','Resumen','Otro'].map((t,i)=>`<button type="button" class="${i===0?'active':''}" data-select-segment="materialType">${t}</button>`).join('')}</div><input type="hidden" name="type" value="Apunte" /></div>
          <div class="form-grid"><div class="form-field"><label>Título</label><input class="input" name="title" required minlength="6" placeholder="Ej: Guía ejercicios equilibrio" /></div><div class="form-field"><label>Ramo</label><input class="input" name="course" required placeholder="Buscar ramo o código" /></div></div>
          <div class="form-grid"><div class="form-field"><label>Plan</label><select class="select" name="plan"><option value="planP">Plan P</option><option value="planO">Plan O</option><option value="both">Ambos si aplica</option></select></div><div class="form-field"><label>Año</label><select class="select" name="year"><option>2026</option><option>2025</option><option>2024</option><option>2023</option></select></div></div>
          <div class="form-field"><label>Descripción</label><textarea class="textarea" name="description" required minlength="20" placeholder="Explica brevemente qué contiene el recurso"></textarea></div>
          <div class="form-field"><label>Archivo</label><div class="upload-zone">${icon('upload')}<strong>Arrastra o selecciona un archivo</strong><span class="help">PDF, DOCX, PPTX, PNG o JPG · máximo 10 MB</span><input class="sr-only" type="file" name="file" /></div></div>
          <div class="form-field"><label>Fuente u origen</label><input class="input" name="origin" required placeholder="Profesor/a, ayudantía, aporte estudiantil, otro" /></div>
          <label class="checkbox-row"><input type="checkbox" name="permission" required /> Confirmo que el recurso puede compartirse como material de apoyo académico.</label>
          <div class="hstack"><button class="btn primary" type="submit">Enviar a revisión</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div>
        </form>
        <aside class="card pad"><h2 class="card-title">Proceso</h2><div class="timeline"><div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>Enviado</strong><span>Recibimos el aporte.</span></div></div><div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>Revisión CEAL</strong><span>Se revisa formato y vínculo con ramo.</span></div></div><div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>Publicado u observado</strong><span>Queda disponible o con observaciones.</span></div></div></div><div class="divider"></div>${badge('pendienteRevision')}<p class="small muted">Estado inicial del recurso después del envío.</p></aside>
      </div>`;
  }

  function renderCases() {
    const filter = state.caseFilters;
    const tabs = [
      ['misCasos','Mis casos',Data.cases.length],['enRevision','En revisión',Data.cases.filter(c=>c.status==='enRevision').length],['resueltos','Resueltos',Data.cases.filter(c=>c.status==='resuelto').length],['derivados','Derivados',Data.cases.filter(c=>c.status==='derivado').length]
    ];
    const tabList = Data.cases.filter(c => state.caseTab==='misCasos' || (state.caseTab==='resueltos' ? c.status==='resuelto' : state.caseTab==='derivados' ? c.status==='derivado' : c.status==='enRevision'));
    const list = tabList.filter(c =>
      (filter.type === 'all' || c.type === filter.type) &&
      (filter.status === 'all' || c.status === filter.status) &&
      (filter.priority === 'all' || c.priority === filter.priority) &&
      (!filter.date || String(c.createdAt || '').slice(0,10) === filter.date)
    );
    const selected = Data.cases.find(c => c.id === state.selectedCaseId) || list[0] || Data.cases[0];
    const types = [...new Set(Data.cases.map(c => c.type))].sort();
    const statuses = [...new Set(Data.cases.map(c => c.status))];
    const priorities = [...new Set(Data.cases.map(c => c.priority))].sort();
    return `${pageHead('Casos y seguimiento', 'Envía un caso y revisa su estado', `<a class="btn primary" href="#/casos/nuevo">${icon('plus')} Nuevo caso</a>`)}
      <section class="card pad" style="margin-bottom:16px">
        <div class="form-grid">
          <div class="form-field"><label>Tipo</label><select class="select" data-case-filter="type"><option value="all">Todos los tipos</option>${types.map(t=>`<option value="${esc(t)}" ${filter.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
          <div class="form-field"><label>Estado</label><select class="select" data-case-filter="status"><option value="all">Todos los estados</option>${statuses.map(s=>`<option value="${esc(s)}" ${filter.status===s?'selected':''}>${Status[s]?.[0] || s}</option>`).join('')}</select></div>
          <div class="form-field"><label>Prioridad</label><select class="select" data-case-filter="priority"><option value="all">Todas</option>${priorities.map(p=>`<option value="${esc(p)}" ${filter.priority===p?'selected':''}>${esc(p)}</option>`).join('')}</select></div>
          <div class="form-field"><label>Fecha</label><input class="input" type="date" data-case-filter="date" value="${esc(filter.date)}" /></div>
        </div>
        <p class="small muted" style="margin:12px 0 0">${list.length} de ${tabList.length} casos visibles con los filtros actuales.</p>
      </section>
      <div class="case-tabs">${tabs.map(t=>`<button class="case-tab ${state.caseTab===t[0]?'active':''}" data-case-tab="${t[0]}">${t[1]} <span class="pill blue">${t[2]}</span></button>`).join('')}</div>
      <div class="case-layout">
        <div class="card-list">${list.length ? list.map(c => caseCard(c, selected?.id === c.id)).join('') : '<section class="card pad empty-state"><h3>Sin casos con esos filtros</h3><p>Ajusta tipo, estado, prioridad o fecha.</p></section>'}</div>
        <section class="card pad">${list.length && selected ? renderCaseDetail(selected) : '<div class="empty-state">Sin casos visibles</div>'}</section>
      </div>`;
  }
  function caseCard(c, active=false) { return `<a class="item-card ${active?'active':''}" href="#/casos/${c.id}" data-case-card="${c.id}"><div class="row-between"><span class="icon-box ${c.type==='Infraestructura'?'orange':c.type==='Material'?'green':c.type==='Orientación'?'red':' '}">${icon(c.type==='Infraestructura'?'grid':c.type==='Material'?'file':c.type==='Orientación'?'users':'book')}</span>${badge(c.status)}</div><h3>${esc(c.title)}</h3><p>${esc(c.number)} · ${fmtDate(c.createdAt)}</p></a>`; }
  function renderCaseDetail(c) {
    const steps = ['recibido','enRevision','enSeguimiento','resuelto','cerrado'];
    const current = steps.indexOf(c.status) === -1 ? 1 : steps.indexOf(c.status);
    return `<div class="row-between"><a class="link desktop-only" href="#/casos">← Volver a mis casos</a><span class="small muted">Caso ${esc(c.number)}</span>${badge(c.status)}</div>
      <h2 class="card-title" style="font-size:1.35rem;margin-top:14px">${esc(c.title)}</h2>
      <div class="stepper">${steps.map((s,i)=>`<span class="step ${i<current?'done':i===current?'active':''}">${Status[s]?.[0] || s}</span>`).join('')}</div>
      <div class="grid two"><div><h3 class="card-title">Resumen</h3><p class="small muted" style="line-height:1.55">${esc(c.summary)}</p><div class="detail-block"><div class="detail-row"><span>Categoría</span><strong>${esc(c.type)}</strong></div><div class="detail-row"><span>Estado</span><strong>${Status[c.status]?.[0] || c.status}</strong></div><div class="detail-row"><span>Fecha de creación</span><strong>${fmtDate(c.createdAt)}, ${fmtTime(c.createdAt)}</strong></div><div class="detail-row"><span>Responsable</span><strong>${esc(c.responsible)}</strong></div>${c.courseName ? `<div class="detail-row"><span>Ramo</span><strong>${esc(c.courseName)}</strong></div>` : ''}</div></div>
      <div><div class="card pad" style="box-shadow:none"><h3 class="card-title">Próximos pasos</h3><p class="small muted">${esc(c.nextStep)}</p></div><div class="card pad" style="box-shadow:none;margin-top:12px"><h3 class="card-title">Archivos adjuntos</h3>${c.attachments.length ? c.attachments.map(a=>`<div class="link-card-row"><span><strong>${esc(a.name)}</strong><span>${esc(a.size)}</span></span>${icon('upload')}</div>`).join('') : '<p class="small muted">Sin adjuntos.</p>'}</div></div></div>
      <div class="detail-block"><h3 class="card-title">Historial de actualizaciones</h3><div class="timeline">${c.history.map(h=>`<div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>${esc(h.title)}</strong><span>${fmtDate(h.at)}, ${fmtTime(h.at)} · ${esc(h.detail)}</span></div></div>`).join('')}</div></div>
      <div class="hstack"><button class="btn secondary" data-demo-action="Información adicional lista para adjuntar">${icon('plus')} Agregar información</button><button class="btn danger" data-demo-action="Solicitud de cierre registrada">${icon('x')} Solicitar cierre</button></div>`;
  }
  function renderCaseDetailPage(id) { const c = Data.cases.find(x=>x.id===id); return c ? `${pageHead('Detalle de caso', c.number, `<a class="btn secondary" href="#/casos">Volver</a>`)}<section class="card pad">${renderCaseDetail(c)}</section>` : renderNotFound('No encontramos el caso.'); }
  function renderNewCase() {
    return `${pageHead('Nuevo caso', 'Envía una consulta o solicitud y revisa su seguimiento', `<a class="btn secondary" href="#/casos">Volver a casos</a>`)}
      <div class="split">
        <form class="card pad form" data-form="new-case">
          <div class="form-field"><label>Tipo de caso</label><div class="segmented">${['Académico','Material','Infraestructura','Inscripción','Orientación','Otro'].map((t,i)=>`<button type="button" class="${i===0?'active':''}" data-select-segment="caseType">${t}</button>`).join('')}</div><input type="hidden" name="type" value="Académico" /></div>
          <div class="form-grid"><div class="form-field"><label>Título</label><input class="input" name="title" required minlength="8" maxlength="120" placeholder="Ej: Consulta por evaluación" /></div><div class="form-field"><label>Ramo relacionado</label><input class="input" name="course" placeholder="Opcional" /></div></div>
          <div class="form-grid"><div class="form-field"><label>Prioridad</label><select class="select" name="priority"><option>Normal</option><option>Media</option><option>Alta</option></select></div><div class="form-field"><label>Fecha</label><input class="input" type="date" name="date" /></div></div>
          <div class="form-field"><label>Descripción</label><textarea class="textarea" name="description" required minlength="20" maxlength="1000" placeholder="Explica el contexto y qué necesitas revisar"></textarea><span class="help">Mínimo 20 caracteres.</span></div>
          <div class="form-field"><label>Adjuntos</label><div class="upload-zone">${icon('upload')}<strong>Agregar archivos</strong><span class="help">PDF, JPG, PNG o DOCX · máximo 5 archivos</span></div></div>
          <label class="checkbox-row"><input type="checkbox" name="privacy" required /> Entiendo que mi caso será visible para mí y el equipo CEAL asignado.</label>
          <div class="hstack"><button class="btn primary" type="submit">Enviar caso</button><button class="btn secondary" type="button" data-save-draft>Guardar borrador</button></div>
        </form>
        <aside class="card pad"><h2 class="card-title">Antes de enviar</h2><div class="vstack"><div class="link-card-row"><span><strong>Datos claros</strong><span>Usa un título concreto y explica el contexto.</span></span>${icon('check')}</div><div class="link-card-row"><span><strong>Adjuntos opcionales</strong><span>Agrega archivos si ayudan a revisar el caso.</span></span>${icon('check')}</div><div class="link-card-row"><span><strong>Seguimiento por estados</strong><span>Podrás revisar historial y responsable.</span></span>${icon('check')}</div></div><div class="divider"></div><p class="small muted">No se promete solución inmediata. El portal registra y ordena el seguimiento.</p></aside>
      </div>`;
  }

  function renderCalendar() {
    return `${pageHead('Calendario y acuerdos', 'Fechas, decisiones y seguimiento', `<button class="btn secondary" data-demo-action="Calendario listo para sincronizar cuando exista backend">${icon('calendar')} Sincronizar calendario</button>`)}
      <div class="calendar-layout">
        <section class="card pad"><div class="row-between"><h2 class="card-title">1. Calendario</h2><div class="hstack"><button class="btn sm ghost">Hoy</button><span class="pill blue">Mayo 2026</span></div></div>${renderMonthGrid()}</section>
        <aside class="vstack"><section class="card pad"><div class="row-between"><h2 class="card-title">2. Próximos en agenda</h2><a class="link" href="#/calendario">Ver calendario</a></div><div class="date-list">${Data.events.slice(0,5).map(dateRow).join('')}</div></section><section class="card pad"><div class="row-between"><h2 class="card-title">3. Acuerdos recientes</h2><a class="link" href="#/acuerdos/agr-003">Ver todos</a></div><div class="card-list">${Data.agreements.map(a=>agreementRow(a)).join('')}</div></section></aside>
      </div>
      <div class="grid two" style="margin-top:18px"><section class="card pad">${renderAgreementSummary(Data.agreements[0])}</section><section class="card pad"><h2 class="card-title">Seguimiento de compromisos</h2>${Data.agreements[0].commitments.map(commitRow).join('')}</section></div>`;
  }
  function renderMonthGrid() {
    const heads = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
    const start = new Date('2026-04-27T00:00:00');
    const cells = [];
    for (let i=0;i<35;i++) {
      const d = new Date(start); d.setDate(start.getDate()+i);
      const iso = d.toISOString().slice(0,10);
      const evts = Data.events.filter(e => e.date === iso);
      const muted = d.getMonth() !== 4;
      cells.push(`<div class="day-cell"><div class="day-number ${muted?'muted':''}">${d.getDate()}</div>${evts.map(e=>`<a class="day-event ${eventColor(e.type)}" href="#/calendario">${esc(e.title)}</a>`).join('')}</div>`);
    }
    return `<div class="month-grid">${heads.map(h=>`<div class="day-head">${h}</div>`).join('')}${cells.join('')}</div><div class="mobile-card-list">${Data.events.map(dateRow).join('')}</div>`;
  }
  function eventColor(type) { return type === 'Asamblea' ? 'orange' : type === 'Formulario' ? 'green' : type === 'Ayudantía' ? 'purple' : ''; }
  function agreementRow(a) { return `<a class="link-card-row" href="#/acuerdos/${a.id}"><span><strong>${esc(a.number)}</strong><span>${fmtDate(a.date)} · ${esc(a.title)}</span></span>${badge(a.status)}</a>`; }
  function commitRow(c) { return `<div class="commit-row"><span><strong>${esc(c.title)}</strong><span>${esc(c.responsible)} · vence ${fmtDate(c.due)}</span></span>${badge(c.status)}</div>`; }
  function renderAgreementSummary(a) {
    return `<div class="row-between"><div><span class="kicker">4. Detalle del acuerdo seleccionado</span><h2 class="card-title" style="font-size:1.25rem;margin-top:4px">${esc(a.number)}</h2></div>${badge(a.status)}</div><div class="detail-block"><div class="detail-row"><span>Origen</span><strong>${esc(a.origin)}</strong></div><div class="detail-row"><span>Fecha</span><strong>${fmtDate(a.date)}</strong></div><div class="detail-row"><span>Responsable</span><strong>${esc(a.responsible)}</strong></div></div><div class="grid two"><div><h3 class="card-title">Qué se acordó</h3><p class="small muted">${esc(a.summary)}</p></div><div><h3 class="card-title">Estado actual</h3><p class="small muted">${esc(a.currentState)}</p></div></div><div class="divider"></div><a class="link" href="#/acuerdos/${a.id}">Ver detalles y documentos ${icon('arrow')}</a>`;
  }
  function renderAgreementDetail(id) { const a = Data.agreements.find(x=>x.id===id); if (!a) return renderNotFound('No encontramos el acuerdo.'); return `${pageHead(a.number, `${fmtDate(a.date)} · ${a.origin}`, `<a class="btn secondary" href="#/calendario">Volver al calendario</a>`)}<div class="split wide"><section class="card pad">${renderAgreementSummary(a)}<div class="detail-block"><h3 class="card-title">Compromisos</h3>${(a.commitments||[]).length ? a.commitments.map(commitRow).join('') : '<p class="small muted">Sin compromisos registrados.</p>'}</div><div class="detail-block"><h3 class="card-title">Historial</h3><div class="timeline">${(a.history||[]).map(h=>`<div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>${esc(h.title)}</strong><span>${fmtDate(h.at)} · ${esc(h.detail)}</span></div></div>`).join('') || '<p class="small muted">Sin historial disponible.</p>'}</div></div></section><aside class="card pad"><h2 class="card-title">Documentos asociados</h2><div class="link-card-list">${(a.documents||[]).map(d=>`<div class="link-card-row"><span><strong>${esc(d.name)}</strong><span>${esc(d.type)} · ${esc(d.size)}</span></span>${icon('upload')}</div>`).join('') || '<p class="small muted">Sin documentos asociados.</p>'}</div><div class="divider"></div><button class="btn primary full" data-demo-action="Descarga simulada de documentos del acuerdo">Descargar documentos</button><button class="btn secondary full" data-demo-action="Enlace del acuerdo copiado">Copiar enlace</button></aside></div>`; }

  function renderCommunications() {
    const cats = ['Todas', ...new Set(Data.communications.map(c=>c.category))];
    const q = state.communicationQuery.trim().toLowerCase();
    const items = Data.communications.filter(c =>
      (state.communicationCategory === 'Todas' || c.category === state.communicationCategory) &&
      (!q || [c.title, c.summary, c.category, c.source].join(' ').toLowerCase().includes(q))
    );
    const selected = items[0];
    return `${pageHead('Comunicados', 'Avisos y respuestas frecuentes')}
      <div class="comms-layout">
        <aside class="card pad comms-filters">
          <div class="form-field"><label>Buscar comunicados</label><input class="input" data-com-search value="${esc(state.communicationQuery)}" placeholder="Buscar por tema, fuente o categoría" /></div>
          <h2 class="card-title" style="margin-top:18px">Categorías</h2>
          <div class="comms-category-list">${cats.map(c=>`<button class="chip-btn ${state.communicationCategory===c?'active':''}" data-com-category="${c}">${esc(c)}</button>`).join('')}</div>
        </aside>
        <main class="card pad comms-feed">
          <div class="row-between"><h2 class="card-title">Comunicado destacado</h2><span class="pill gray">${items.length} visibles</span></div>
          ${selected ? commCard(selected,true) : `<div class="empty-state"><h3>Sin comunicados visibles</h3><p>Prueba limpiar búsqueda o cambiar categoría.</p></div>`}
          <div class="divider"></div>
          <h2 class="card-title">Comunicados recientes</h2>
          <div class="card-list">${items.slice(1).length ? items.slice(1).map(c=>commCard(c)).join('') : '<p class="small muted">No hay más comunicados en esta categoría.</p>'}</div>
        </main>
        <aside class="card pad comms-preview">
          <h2 class="card-title">Comunicado seleccionado</h2>
          ${selected ? renderCommunicationPreview(selected) : `<p class="small muted">Selecciona una categoría con comunicados visibles.</p>`}
          <div class="divider"></div>
          <h2 class="card-title">Preguntas frecuentes</h2>
          ${renderFAQ()}
        </aside>
      </div>`;
  }
  function commCard(c, featured=false) { return `<a class="item-card" href="#/comunicados/${c.id}"><div class="row-between"><span class="pill blue">${esc(c.category)}</span><span class="small muted">${fmtDate(c.date)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="link">Leer más ${icon('arrow')}</span></a>`; }
  function renderCommunicationPreview(c) { return `<div class="item-card"><span class="icon-box">${icon('megaphone')}</span><div class="hstack">${badge('blue', c.category)}<span class="small muted">${fmtDate(c.date)} · ${fmtTime(c.date)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><div class="detail-block"><div class="detail-row"><span>Categoría</span><strong>${esc(c.category)}</strong></div><div class="detail-row"><span>Fuente</span><strong>${esc(c.source)}</strong></div><div class="detail-row"><span>Publicado</span><strong>${fmtDate(c.date)}</strong></div></div><a class="link" href="#/comunicados/${c.id}">Leer comunicado completo ${icon('arrow')}</a></div>`; }
  function renderCommunicationDetail(id) { const c = Data.communications.find(x=>x.id===id); if(!c) return renderNotFound('No encontramos el comunicado.'); return `${pageHead(c.title, `${c.category} · ${fmtDate(c.date)}, ${fmtTime(c.date)}`, `<a class="btn secondary" href="#/comunicados">Volver</a>`)}<div class="split"><article class="card pad"><div class="hstack">${badge('blue', c.category)}${c.pinned ? badge('orange','Fijado') : ''}</div><p style="font-size:1.02rem;line-height:1.7;color:var(--slate-700)">${esc(c.body)}</p><div class="detail-block"><div class="detail-row"><span>Fuente</span><strong>${esc(c.source)}</strong></div><div class="detail-row"><span>Publicado</span><strong>${fmtDate(c.date)}, ${fmtTime(c.date)}</strong></div></div><div class="hstack"><button class="btn primary" data-demo-action="Comunicado marcado como leído">Marcar como leído</button><button class="btn secondary" data-demo-action="Enlace del comunicado copiado">Copiar enlace</button></div></article><aside class="card pad"><h2 class="card-title">Relacionado</h2>${(c.related||[]).map(r=>`<a class="link-card-row" href="#/calendario"><span><strong>${esc(r.label)}</strong><span>${esc(r.type)}</span></span>${icon('arrow')}</a>`).join('') || '<p class="small muted">Sin vínculos relacionados.</p>'}<div class="divider"></div><h2 class="card-title">FAQ</h2>${renderFAQ()}</aside></div>`; }
  function renderFAQ() { return `<div class="vstack">${Data.faqs.slice(0,5).map((f,i)=>`<button class="link-card-row" data-faq="${i}"><span><strong>${esc(f.q)}</strong>${state.openFAQ===i?`<span>${esc(f.a)}</span>`:''}</span>${icon(state.openFAQ===i?'x':'arrow')}</button>`).join('')}</div>`; }

  function renderSupport() {
    return `${pageHead('Ayudantías y trámites', 'Apoyo académico, formularios y gestiones')}
      <section class="card pad"><div class="row-between"><h2 class="card-title">1. Ayudantías</h2><a class="link" href="#/calendario">Ver calendario</a></div><div class="card-list">${Data.tutoring.map(t=>tutoringCard(t)).join('')}</div></section>
      <section class="card pad" style="margin-top:18px"><div class="row-between"><h2 class="card-title">2. Trámites y formularios</h2><a class="link" href="#/apoyo">Ver todos los trámites</a></div><div class="grid three">${Data.procedures.map(p=>procedureCard(p)).join('')}</div></section>
      <section class="card pad" style="margin-top:18px"><h2 class="card-title">3. Apoyo académico</h2><div class="access-grid">${access('book','Recursos de estudio','Guías, apuntes y material recomendado por ramo.','Explorar recursos','/material')}${access('users','Tutorías y orientación','Reserva hora con tutores y orientadores académicos.','Reservar hora','/apoyo','green')}${access('clock','Centro de consultas','Resuelve dudas académicas y administrativas.','Ir al centro','/casos/nuevo','orange')}${access('file','Enlaces útiles','Acceso rápido a plataformas y servicios institucionales.','Ver enlaces','/apoyo','purple')}</div></section>`;
  }
  function tutoringCard(t) { return `<a class="item-card" href="#/ayudantias/${t.id}"><div class="row-between"><span class="icon-box">${icon('users')}</span><span class="pill blue">${esc(t.mode)}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.courseName)} · ${fmtDate(t.date)} · ${esc(t.time)} · ${esc(t.location)}</p><span class="link">Ver detalle ${icon('arrow')}</span></a>`; }
  function procedureCard(p) { return `<a class="item-card" href="#/tramites/${p.id}"><div class="row-between"><span class="icon-box orange">${icon('file')}</span>${badge(p.status)}</div><h3>${esc(p.title)}</h3><p>Vence: ${fmtDate(p.due)}<br>${esc(p.responsible)}</p><span class="link">Abrir formulario ${icon('arrow')}</span></a>`; }
  function renderTutoringDetail(id) { const t=Data.tutoring.find(x=>x.id===id); if(!t) return renderNotFound(); return `${pageHead(t.title, `${t.courseName} · ${fmtDate(t.date)}`, `<a class="btn secondary" href="#/apoyo">Volver</a>`)}<div class="split"><section class="card pad"><h2 class="card-title">Detalle de ayudantía</h2><div class="detail-block"><div class="detail-row"><span>Ramo</span><strong>${esc(t.courseName)}</strong></div><div class="detail-row"><span>Fecha</span><strong>${fmtDate(t.date)}</strong></div><div class="detail-row"><span>Hora</span><strong>${esc(t.time)}</strong></div><div class="detail-row"><span>Lugar</span><strong>${esc(t.location)}</strong></div><div class="detail-row"><span>Ayudante</span><strong>${esc(t.tutor)}</strong></div></div><div class="hstack"><button class="btn primary" data-demo-action="Recordatorio guardado">${icon('bell')} Guardar recordatorio</button><a class="btn secondary" href="#/material/${t.materialId}">Ver material</a></div></section><aside class="card pad"><h2 class="card-title">Ramo asociado</h2><a class="btn secondary full" href="#/ramo/${findCoursePlanForCode(t.courseCode)}/${encodeURIComponent(t.courseCode)}">Ver en malla</a></aside></div>`; }
  function renderProcedureDetail(id) { const p=Data.procedures.find(x=>x.id===id); if(!p) return renderNotFound(); return `${pageHead(p.title, `Vence ${fmtDate(p.due)}`, `<a class="btn secondary" href="#/apoyo">Volver</a>`)}<div class="split"><section class="card pad"><div class="hstack">${badge(p.status)}</div><p class="muted">${esc(p.description)}</p><div class="detail-block"><div class="detail-row"><span>Responsable</span><strong>${esc(p.responsible)}</strong></div><div class="detail-row"><span>Vencimiento</span><strong>${fmtDate(p.due)}</strong></div></div><h2 class="card-title">Documentos requeridos</h2><div class="vstack">${p.required.map(r=>`<div class="link-card-row"><span><strong>${esc(r)}</strong><span>Requisito</span></span>${icon('check')}</div>`).join('')}</div><div class="divider"></div><button class="btn primary" data-demo-action="Formulario abierto en modo demo">Abrir formulario</button></section><aside class="card pad"><h2 class="card-title">Apoyo</h2><p class="small muted">Si tienes dudas sobre este trámite, puedes crear un caso y asociarlo a la categoría correspondiente.</p><a class="btn secondary full" href="#/casos/nuevo">Crear caso</a></aside></div>`; }

  function renderProfile() {
    const u = state.user;
    return `${pageHead('Mi cuenta', 'Perfil, preferencias y seguimiento personal', `<button class="btn danger" data-logout>${icon('x')} Cerrar sesión</button>`)}
      <section class="card pad"><div class="profile-hero"><span class="avatar big">${esc(u.initials)}</span><div><h2 class="card-title" style="font-size:1.55rem">${esc(u.name)}</h2><div class="hstack" style="flex-wrap:wrap">${badge('green','Cuenta activa')}<span class="pill blue">${esc(u.label)}</span><span class="pill gray">${planShort(u.plan)} · ${esc(u.yearLabel)}</span></div><p class="small muted" style="margin-top:8px">${esc(u.email)}</p></div><a class="btn secondary" href="#/mallas">Ver mi malla</a></div></section>
      <div class="grid four" style="margin-top:18px">${stat('grid', Data.saved.courses.length, 'Ramos', 'Seguimiento')}${stat('book', Data.saved.resources.length, 'Recursos', 'Guardados')}${stat('folder', Data.cases.filter(c=>!['resuelto','cerrado'].includes(c.status)).length, 'Casos', 'Abiertos')}${stat('bell', Data.saved.reminders.length, 'Recordatorios', 'Activos')}</div>
      <div class="grid two" style="margin-top:18px"><section class="card pad"><h2 class="card-title">Actividad reciente</h2>${Data.notifications.map(n=>`<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} · ${esc(n.date)}</span></span>${icon('arrow')}</a>`).join('')}</section><section class="card pad"><h2 class="card-title">Preferencias</h2>${['Recibir recordatorios','Mostrar solo mi plan','Notificaciones de casos','Modo compacto'].map((p,i)=>`<label class="link-card-row"><span><strong>${p}</strong><span>${i<3?'Activado para esta demo':'Disponible próximamente'}</span></span><input type="checkbox" ${i<3?'checked':''} /></label>`).join('')}</section></div>`;
  }

  function renderSearch(query) {
    const q = String(query || '').trim();
    const normalized = q.toLowerCase();
    const courses = q ? ['planO','planP'].flatMap(plan => getCourses(plan).filter(c => [c.name,c.code,c.visibleCode].join(' ').toLowerCase().includes(normalized)).slice(0,4).map(c=>({plan,c}))) : [];
    const resources = q ? Data.resources.filter(r => [r.title,r.courseName,r.courseCode,r.type].join(' ').toLowerCase().includes(normalized)).slice(0,5) : [];
    const comms = q ? Data.communications.filter(c => [c.title,c.summary,c.category].join(' ').toLowerCase().includes(normalized)).slice(0,3) : [];
    const events = q ? Data.events.filter(e => [e.title,e.description,e.type].join(' ').toLowerCase().includes(normalized)).slice(0,3) : [];
    const cases = q ? Data.cases.filter(c => [c.title,c.summary,c.type,c.courseName].join(' ').toLowerCase().includes(normalized)).slice(0,3) : [];
    return `${pageHead('Búsqueda', q ? `Resultados relacionados con “${q}”` : 'Busca ramos, material, fechas, acuerdos, comunicados y casos')}
      <div class="search-layout"><aside class="card pad"><form data-search-page-form class="form-field"><label>Buscar en CEAL</label><input class="input" name="q" value="${esc(q)}" placeholder="Ej: hormigón armado" /></form><div class="divider"></div><div class="vstack">${['Todo','Ramos','Material','Comunicados','Acuerdos','Casos','Fechas'].map((x,i)=>`<button class="chip-btn ${i===0?'active':''}">${x}</button>`).join('')}</div></aside><main>${!q ? `<div class="card pad empty-state"><span class="icon-wrap">${icon('search')}</span><h3>Escribe una búsqueda</h3><p>Prueba con el nombre de un ramo, un código o una fecha importante.</p></div>` : [renderResultGroup('Ramos', courses.map(({plan,c})=>resultRow('grid', titleCase(c.name), `${planLabel(plan)} · ${c.visibleCode || c.code}`, `/ramo/${plan}/${encodeURIComponent(c.code)}`, 'Ver ramo'))), renderResultGroup('Material', resources.map(r=>resultRow('book', r.title, `${r.courseName} · ${r.type} · ${r.format}`, `/material/${r.id}`, 'Ver material'))), renderResultGroup('Comunicados', comms.map(c=>resultRow('megaphone', c.title, `${c.category} · ${fmtDate(c.date)}`, `/comunicados/${c.id}`, 'Abrir'))), renderResultGroup('Fechas', events.map(e=>resultRow('calendar', e.title, `${fmtDate(e.date)} · ${e.time} · ${e.description}`, `/calendario`, 'Ver fecha'))), renderResultGroup('Casos propios', cases.map(c=>resultRow('folder', c.title, `${c.number} · ${Status[c.status]?.[0]}`, `/casos/${c.id}`, 'Abrir caso')))].join('')}</main></div>`;
  }
  function renderResultGroup(title, rows) { return `<section class="result-group"><h2 class="section-title">${esc(title)}</h2>${rows.length ? rows.join('') : `<div class="card pad"><p class="small muted">No encontramos resultados en ${esc(title.toLowerCase())}.</p></div>`}</section>`; }
  function resultRow(ico, title, desc, route, action) { return `<a class="result-row" href="#${route}"><span class="icon-box">${icon(ico)}</span><span><strong>${esc(title)}</strong><p>${esc(desc)}</p></span><span class="link">${esc(action)} ${icon('arrow')}</span></a>`; }

  function renderManagement() {
    return `${pageHead('Gestión CEAL', 'Actualiza contenidos y coordina el portal', `<span class="pill blue">Rol actual: ${esc(state.user.label)}</span>`)}
      <div class="split"><main class="vstack"><section class="card pad"><h2 class="card-title">Módulos de gestión</h2><div class="management-modules">${[
        ['megaphone','Publicar comunicado','Crea y publica comunicados.','/gestion/comunicados/com-001/editar'],['calendar','Editar calendario','Agrega o modifica eventos y plazos.','/calendario'],['file','Subir acuerdo','Carga y organiza acuerdos del CEAL.','/acuerdos/agr-003'],['folder','Revisar casos','Asigna y da seguimiento a los casos.','/casos'],['book','Validar material','Revisa y aprueba material nuevo.','/gestion/material/mat-010/validar'],['grid','Actualizar mallas','Actualiza enlaces útiles de ramos.','/mallas'],['file','Gestionar formularios','Crea y edita formularios y campos.','/apoyo'],['users','Miembros y permisos','Invita, organiza roles y permisos.','/perfil']
      ].map(m=>`<a class="management-card" href="#${m[3]}"><span class="icon-box">${icon(m[0])}</span><strong>${m[1]}</strong><span>${m[2]}</span></a>`).join('')}</div></section><div class="grid two"><section class="card pad"><div class="row-between"><h2 class="card-title">Pendientes</h2><a class="link" href="#/gestion">Ver todos</a></div>${Data.gestion.pending.map(p=>`<div class="link-card-row"><span><strong>${p.count} · ${esc(p.title)}</strong><span>${esc(p.detail)}</span></span>${icon('arrow')}</div>`).join('')}</section><section class="card pad"><div class="row-between"><h2 class="card-title">Cambios recientes</h2><a class="link" href="#/gestion">Ver historial</a></div>${Data.gestion.changes.map(c=>`<div class="link-card-row"><span><strong>${esc(c.title)}</strong><span>${esc(c.detail)}</span></span><span class="small muted">${esc(c.date)}</span></div>`).join('')}</section></div><section class="card pad"><h2 class="card-title">Roles del equipo CEAL</h2><div class="role-strip">${Data.gestion.roles.map((r,i)=>`<div class="role-pill ${r.name===state.user.label?'active':''}"><strong>${esc(r.name)}</strong><p>${esc(r.detail)}</p><span class="pill gray">${r.members} miembros</span></div>`).join('')}</div></section></main><aside class="vstack"><section class="card pad"><h2 class="card-title">Acciones rápidas</h2>${['Crear comunicado','Guardar borrador','Publicar','Asignar caso','Validar material','Ver historial'].map((a,i)=>`<a class="link-card-row" href="#${i===0?'/gestion/comunicados/com-001/editar':i===4?'/gestion/material/mat-010/validar':'/gestion'}"><span><strong>${a}</strong></span>${icon('arrow')}</a>`).join('')}</section><section class="card pad"><h2 class="card-title">Estados de contenidos</h2>${['Borrador','En revisión','Pendiente','Publicado','Archivado'].map((s,i)=>`<div class="detail-row"><span>${s}</span>${badge(['borrador','enRevision','pendiente','publicado','cerrado'][i])}</div>`).join('')}</section></aside></div>`;
  }
  function ensureCEAL(content) { return state.user?.role === 'ceal' ? content : `${pageHead('Sin permisos', 'Esta sección es de uso interno CEAL')}<section class="card pad empty-state"><span class="icon-wrap">${icon('shield')}</span><h3>Acceso restringido</h3><p>Ingresa como miembro CEAL para revisar esta vista.</p><button class="btn secondary" data-logout>Cambiar rol</button></section>`; }
  function renderEditor(id) { const c = Data.communications.find(x=>x.id===id) || Data.communications[0]; return `${pageHead('Editar comunicado', 'Actualiza contenido antes de publicarlo', `<span class="unsaved"><span class="dot"></span>Cambios sin guardar</span>`)}<div class="editor-layout"><form class="card pad form" data-form="edit-content"><div class="row-between"><h2 class="card-title">Contenido</h2>${badge('borrador')}</div><div class="form-field"><label>Título</label><input class="input" name="title" value="${esc(c.title)}" required /></div><div class="form-grid"><div class="form-field"><label>Categoría</label><select class="select" name="category"><option>Académico</option><option>Actividades</option><option>Ayudantías</option><option>Material</option><option>Trámites</option></select></div><div class="form-field"><label>Audiencia</label><select class="select"><option>Todos los estudiantes</option><option>Plan O</option><option>Plan P</option></select></div></div><div class="form-grid"><div class="form-field"><label>Fecha de publicación</label><input class="input" type="date" value="2026-05-16" /></div><div class="form-field"><label>Hora</label><input class="input" type="time" value="09:30" /></div></div><div class="form-field"><label>Contenido</label><textarea class="textarea" name="body" required>${esc(c.body)}</textarea></div><div class="form-field"><label>Adjuntos</label><div class="upload-zone">${icon('upload')}<strong>Agregar documento</strong><span class="help">PDF, DOCX o imagen</span></div></div><div class="hstack"><button class="btn secondary" type="submit">Guardar borrador</button><button class="btn primary" type="button" data-publish>Publicar</button><button class="btn ghost" type="button" data-demo-action="Comunicado enviado a revisión">Enviar a revisión</button></div></form><aside class="vstack"><section class="card pad"><h2 class="card-title">Vista previa</h2>${renderCommunicationPreview(c)}</section><section class="card pad"><h2 class="card-title">Validación</h2>${['Título completo','Categoría definida','Fecha configurada','Contenido revisado'].map(x=>`<div class="link-card-row"><span><strong>${x}</strong></span>${icon('check')}</div>`).join('')}</section></aside></div>`; }
  function renderValidateMaterial(id) { const r=Data.resources.find(x=>x.id===id)||Data.resources.find(x=>x.status==='pendienteRevision'); return r ? `${pageHead('Validar material', `${r.title} · ${r.courseName}`, `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="split"><section class="card pad">${renderResourceDetail(r)}</section><aside class="card pad"><h2 class="card-title">Revisión CEAL</h2><div class="form-field"><label>Observaciones</label><textarea class="textarea" placeholder="Agrega observaciones internas"></textarea></div><div class="divider"></div><button class="btn primary full" data-approve-material="${r.id}">Validar y publicar</button><button class="btn danger full" data-demo-action="Material marcado con observaciones">Marcar con observaciones</button></aside></div>` : renderNotFound(); }

  function renderMore() { const items = navItems().filter(([href]) => !['/','/calendario','/casos','/material'].includes(href)); return `${pageHead('Más', 'Accesos secundarios del portal')}<section class="card pad"><div class="card-list">${items.map(([href,ico,label])=>`<a class="link-card-row" href="#${href}"><span class="hstack">${icon(ico)}<strong>${label}</strong></span>${icon('arrow')}</a>`).join('')}<a class="link-card-row" href="#/perfil"><span class="hstack">${icon('user')}<strong>Mi cuenta</strong></span>${icon('arrow')}</a><button class="link-card-row" data-logout><span class="hstack">${icon('x')}<strong>Cerrar sesión</strong></span>${icon('arrow')}</button></div></section>`; }
  function renderNotificationsPage() { return `${pageHead('Notificaciones', 'Actualizaciones relevantes del portal')}<section class="card pad"><div class="card-list">${Data.notifications.map(n=>`<a class="link-card-row" href="#${n.route}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} · ${esc(n.date)}</span></span>${n.unread?badge('orange','Nueva'):badge('gray','Leída')}</a>`).join('')}</div></section>`; }
  function renderNotificationPopover() { return `<aside class="notification-popover"><header><strong>Notificaciones</strong><button class="icon-btn" data-close-notifications>${icon('x')}</button></header>${Data.notifications.map(n=>`<a class="not-row" href="#${n.route}"><span class="not-dot"></span><span><strong>${esc(n.title)}</strong><p>${esc(n.detail)}</p><small>${esc(n.date)}</small></span></a>`).join('')}</aside>`; }
  function renderNotFound(message='No encontramos la vista solicitada.') { return `${pageHead('No encontrado', '')}<section class="card pad empty-state"><span class="icon-wrap">${icon('search')}</span><h3>${esc(message)}</h3><p>Revisa la navegación o vuelve al inicio.</p><a class="btn primary" href="#/">Volver al inicio</a></section>`; }

  function titleCase(str) {
    const small = new Set(['a', 'al', 'de', 'del', 'la', 'las', 'lo', 'los', 'y', 'e', 'o', 'u', 'en', 'para', 'por', 'con']);
    const roman = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i;
    return String(str || '')
      .toLocaleLowerCase('es-CL')
      .split(/(\s+|\/|-)/)
      .map((part, index) => {
        if (/^\s+$|^\/$|^-$/.test(part)) return part;
        if (roman.test(part)) return part.toLocaleUpperCase('es-CL');
        if (index > 0 && small.has(part)) return part;
        return part.charAt(0).toLocaleUpperCase('es-CL') + part.slice(1);
      })
      .join('');
  }

  function onClick(e) {
    const role = e.target.closest('[data-login-role]')?.dataset.loginRole;
    if (role) { saveSession(Data.users[role]); routeTo('/'); return; }
    if (e.target.closest('[data-logout]')) { localStorage.removeItem('portal.session'); state.user = null; routeTo('/login'); return; }
    if (e.target.closest('[data-toggle-notifications]')) { state.notificationsOpen = !state.notificationsOpen; render(); return; }
    if (e.target.closest('[data-close-notifications]')) { state.notificationsOpen = false; render(); return; }
    const saveCourse = e.target.closest('[data-save-course]');
    if (saveCourse) {
      const key = saveCourse.dataset.saveCourse;
      if (!Data.saved.courses.includes(key)) Data.saved.courses.push(key);
      const [plan, code] = key.split(':');
      const c = findCourse(plan, code);
      showToast(`${c ? titleCase(c.name) : 'Ramo'} agregado a seguimiento`);
      return;
    }
    const saveResource = e.target.closest('[data-save-resource]');
    if (saveResource) {
      const id = saveResource.dataset.saveResource;
      if (!Data.saved.resources.includes(id)) Data.saved.resources.push(id);
      const r = Data.resources.find(x => x.id === id);
      showToast(`${r ? r.title : 'Recurso'} guardado`);
      return;
    }
    if (e.target.closest('[data-save-draft]')) { showToast('Borrador guardado localmente', 'blue'); return; }
    if (e.target.closest('[data-publish]')) { showToast('Contenido publicado en modo demo'); return; }
    const demoAction = e.target.closest('[data-demo-action]');
    if (demoAction) { showToast(demoAction.dataset.demoAction || 'Acción registrada', 'blue'); return; }
    const planBtn = e.target.closest('[data-plan]');
    if (planBtn) { state.activePlan = planBtn.dataset.plan; localStorage.setItem('portal.activePlan', state.activePlan); state.selectedCourse = null; state.mobileSemester = Math.min(state.mobileSemester, getPlanData(state.activePlan).totalSemesters); render(); return; }
    const semBtn = e.target.closest('[data-mobile-sem]');
    if (semBtn) {
      state.mobileSemester = Number(semBtn.dataset.mobileSem);
      localStorage.setItem('portal.mobileSemester', state.mobileSemester);
      const first = getCourses(state.activePlan).find(c => c.semester === state.mobileSemester);
      if (first) state.selectedCourse = { plan: state.activePlan, code: first.code };
      render();
      return;
    }
    const dot = e.target.closest('[data-cycle-status]');
    if (dot) { e.stopPropagation(); const key = courseKey(dot.dataset.cyclePlan, dot.dataset.cycleStatus); const current = Data.courseProgress[key] || 'pending'; const next = current === 'pending' ? 'inProgress' : current === 'inProgress' ? 'approved' : 'pending'; Data.courseProgress[key] = next; render(); return; }
    const course = e.target.closest('[data-course]');
    if (course) { state.selectedCourse = { plan: course.dataset.coursePlan, code: course.dataset.course }; const c = findCourse(course.dataset.coursePlan, course.dataset.course); if (c) state.mobileSemester = c.semester; render(); return; }
    if (e.target.closest('[data-clear-panel]')) { state.selectedCourse = null; state.selectedResourceId = null; state.selectedCaseId = null; render(); return; }
    const typeBtn = e.target.closest('[data-material-type]');
    if (typeBtn) { state.materialType = typeBtn.dataset.materialType; render(); return; }
    const courseFilter = e.target.closest('[data-material-course]');
    if (courseFilter) { state.materialCourse = courseFilter.dataset.materialCourse; state.selectedResourceId = null; render(); return; }
    const tab = e.target.closest('[data-case-tab]');
    if (tab) { state.caseTab = tab.dataset.caseTab; state.caseFilters.status = 'all'; state.selectedCaseId = null; render(); return; }
    const cat = e.target.closest('[data-com-category]');
    if (cat) { state.communicationCategory = cat.dataset.comCategory; render(); return; }
    const faq = e.target.closest('[data-faq]');
    if (faq) { const idx = Number(faq.dataset.faq); state.openFAQ = state.openFAQ === idx ? null : idx; render(); return; }
    const segment = e.target.closest('[data-select-segment]');
    if (segment) {
      const wrap = segment.parentElement;
      wrap.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      segment.classList.add('active');
      const hidden = wrap.parentElement.querySelector('input[type="hidden"]');
      if (hidden) hidden.value = segment.textContent.trim();
      return;
    }
    const resourceRow = e.target.closest('[data-resource-row]');
    if (resourceRow) { state.selectedResourceId = resourceRow.dataset.resourceRow; render(); return; }
    const approve = e.target.closest('[data-approve-material]');
    if (approve) { const r = Data.resources.find(x=>x.id===approve.dataset.approveMaterial); if (r) r.status='validadoCeal'; showToast('Material validado y publicado'); return; }
  }

  function onInput(e) {
    if (e.target.matches('[data-malla-search]')) { state.mallaQuery = e.target.value; render(); }
    if (e.target.matches('[data-material-search]')) { state.materialQuery = e.target.value; render(); }
    if (e.target.matches('[data-com-search]')) { state.communicationQuery = e.target.value; render(); }
  }
  function onChange(e) {
    if (e.target.matches('[data-malla-area]')) { state.mallaArea = e.target.value; render(); }
    const caseFilter = e.target.closest('[data-case-filter]');
    if (caseFilter) {
      state.caseFilters[caseFilter.dataset.caseFilter] = caseFilter.value;
      state.selectedCaseId = null;
      render();
    }
  }
  function onSubmit(e) {
    const global = e.target.closest('[data-global-search-form]');
    if (global) { e.preventDefault(); const q = new FormData(global).get('q') || ''; routeTo('/buscar?q=' + encodeURIComponent(q)); return; }
    const searchPage = e.target.closest('[data-search-page-form]');
    if (searchPage) { e.preventDefault(); const q = new FormData(searchPage).get('q') || ''; routeTo('/buscar?q=' + encodeURIComponent(q)); return; }
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    if (form.dataset.form === 'new-case') {
      const newCase = {
        id: 'case-2026-' + String(60 + Data.cases.length), number: '#2026-' + String(60 + Data.cases.length), title: fd.get('title'), type: fd.get('type') || 'Académico', status: 'recibido', priority: fd.get('priority') || 'Normal', createdAt: new Date().toISOString(), courseCode: null, courseName: fd.get('course') || null, responsible: 'Por asignar', responsibleRole: 'CEAL', summary: fd.get('description'), nextStep: 'El equipo CEAL revisará el caso y asignará responsable.', visibility: 'Solo tú y el equipo asignado pueden ver este caso.', attachments: [], history: [{ at: new Date().toISOString(), title: 'Caso recibido', detail: 'Hemos recibido tu caso correctamente.' }]
      };
      Data.cases.unshift(newCase); showToast('Caso enviado correctamente'); routeTo('/casos/' + newCase.id); return;
    }
    if (form.dataset.form === 'upload-material') {
      const r = { id: 'mat-' + String(100 + Data.resources.length), title: fd.get('title'), type: fd.get('type') || 'Apunte', courseCode: fd.get('course') || 'Por asociar', plan: fd.get('plan') || 'planP', courseName: fd.get('course') || 'Ramo por asociar', semester: '-', year: fd.get('year') || '2026', format: 'PDF', size: 'archivo demo', origin: fd.get('origin'), status: 'pendienteRevision', uploadedBy: state.user.name, uploadedAt: new Date().toISOString().slice(0,10), description: fd.get('description') };
      Data.resources.unshift(r); showToast('Material enviado a revisión'); routeTo('/material/' + r.id); return;
    }
    if (form.dataset.form === 'edit-content') { showToast('Borrador guardado'); return; }
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('submit', onSubmit);
  render();
})();
