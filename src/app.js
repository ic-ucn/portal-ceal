(() => {
  const app = document.getElementById('app');
  let Data = window.PortalMock;
  const Curricula = window.CURRICULA;
  const DATA_CONTENT_VERSION = '20260702a';
  const LOCAL_DATA_KEY = 'portal.data.v47';
  const CAMPUS_IMAGE_SRC = 'assets/ucn-campus-transparent.png?v=20260626u';
  const STALE_DATA_KEYS = ['portal.data.v6', 'portal.data.v7', 'portal.data.v8', 'portal.data.v9', 'portal.data.v10', 'portal.data.v11', 'portal.data.v12', 'portal.data.v13', 'portal.data.v14', 'portal.data.v15', 'portal.data.v16', 'portal.data.v17', 'portal.data.v18', 'portal.data.v19', 'portal.data.v20', 'portal.data.v21', 'portal.data.v22', 'portal.data.v23', 'portal.data.v24', 'portal.data.v25', 'portal.data.v26', 'portal.data.v27', 'portal.data.v28', 'portal.data.v29', 'portal.data.v30', 'portal.data.v31', 'portal.data.v32', 'portal.data.v33', 'portal.data.v34', 'portal.data.v35', 'portal.data.v36', 'portal.data.v37', 'portal.data.v38', 'portal.data.v39', 'portal.data.v40', 'portal.data.v41', 'portal.data.v42', 'portal.data.v43', 'portal.data.v44', 'portal.data.v45', 'portal.data.v46'];
  const URL_PARAMS = new URLSearchParams(location.search);
  const STATIC_MODE = URL_PARAMS.has('static');
  const LOCAL_API_BASE = location.protocol !== 'file:' && ['localhost', '127.0.0.1', '::1'].includes(location.hostname) ? '/api' : '';
  const API_BASE = !STATIC_MODE && (LOCAL_API_BASE || window.PORTAL_API_BASE || '');
  const AI_ENDPOINT = String(window.PORTAL_AI_ENDPOINT || '').trim();
  const FEATURES = Object.freeze({ surveys: false, tableReservations: false });
  const JEFATURA_EMAIL = 'jc.icivil.afta@ucn.cl';
  const CEAL_ASSISTANT_AUDIENCE = 'Estudiantes de Ingeniería Civil UCN';
  const GOOGLE_CLIENT_ID = String(window.PORTAL_GOOGLE_CLIENT_ID || '').trim();
  const GOOGLE_DOMAIN = String(window.PORTAL_GOOGLE_DOMAIN || 'alumnos.ucn.cl').trim().toLowerCase();
  const GOOGLE_OAUTH_STATE_KEY = 'portal.google.oauth.state';
  const PORTAL_THEME_KEY = 'portal.theme';
  const QA_MODE = URL_PARAMS.has('qa');
  const MALLA_BASE_URL = 'https://ic-ucn.github.io/malla-curricular/';
  const mallaEmbedCache = {};
  // Si el usuario ya eligió tema, se respeta. Si nunca lo eligió (sin clave guardada),
  // se sigue la preferencia del sistema operativo (prefers-color-scheme).
  const storedPortalTheme = localStorage.getItem(PORTAL_THEME_KEY);
  const initialPortalDark = storedPortalTheme
    ? storedPortalTheme === 'dark'
    : Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  let dataMode = API_BASE ? 'backend' : 'static';
  // false hasta que el primer /bootstrap termina (exito o error). Evita mostrar
  // "no existe" en detalles abiertos por enlace directo mientras llegan los datos.
  let dataReady = !API_BASE;
  let hasRendered = false;
  let lastRenderedRouteKey = '';
  let pendingScrollReset = false;
  let scrollResetToken = 0;
  let pageTopHoldTimer = null;
  let filterRenderTimer = null;
  let localWrites = 0;

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
    materialVisibleCount: 60,
    communicationCategory: 'Todas',
    communicationQuery: '',
    cealAssistantRequest: { rawText: '', category: 'Auto', audience: CEAL_ASSISTANT_AUDIENCE, urgency: 'normal', extraContext: '' },
    cealAssistantResult: null,
    cealAssistantError: '',
    cealAssistantLoading: false,
    cealAssistantUsage: null,
    cealAttachment: null,
    mailMeta: null,
    notifyGroups: { test: false, ceal: false, students: false, professors: false },
    surveyBuilderRequest: { rawText: '', mode: 'auto' },
    surveyBuilderResult: null,
    surveyBuilderError: '',
    surveyBuilderLoading: false,
    calendarStatus: null,
    calendarStatusLoading: false,
    calendarStatusError: '',
    calendarMonth: null,
    calendarSelectedDate: '',
    staffBusy: null,
    staffBusyLoading: false,
    staffBusyError: '',
    myAppointments: null,
    myApptsLoading: false,
    myApptsSlow: false,
    myApptsError: '',
    staffClosedSlots: [],
    appointmentBusy: [],
    bookingSlotKey: null,
    bookingReason: '',
    bookingSubmitting: false,
    openFAQ: null,
    notificationsOpen: false,
    menuOpen: false,
    reservations: null,
    reservationsLoading: false,
    reservationsError: '',
    reservationSchedule: null,
    reservationPayment: null,
    rsvTable: 'tacataca',
    rsvDate: null,
    rsvBlock: null,
    rsvSubmitting: false,
    rsvActionBusy: '',
    rsvJustCreated: null,
    mallaEmbedPlan: localStorage.getItem('portal.malla.embedPlan') || 'p',
    portalDark: initialPortalDark,
    mallaEmbedDark: initialPortalDark,
    loginMemberId: null,
    authMessage: '',
    toast: null,
    offline: typeof navigator !== 'undefined' && navigator.onLine === false
  };
  applyPortalTheme();

  const Status = {
    recibido: ['Recibido', 'blue'],
    enRevision: ['En revisión', 'blue'],
    enSeguimiento: ['En seguimiento', 'orange'],
    resuelto: ['Resuelto', 'green'],
    derivado: ['Derivado', 'purple'],
    cerrado: ['Cerrado', 'gray'],
    publicado: ['Publicado', 'green'],
    actualizado: ['Actualizado', 'blue'],
    abierto: ['Abierto', 'green'],
    pendiente: ['Pendiente', 'orange'],
    completado: ['Completado', 'green'],
    borrador: ['Borrador', 'gray'],
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

  const SurveyPresets = {
    paralizacion: {
      label: 'Paralización / toma',
      mode: 'votacion',
      prompt: [
        'Crear una votación secreta, neutral y objetiva para estudiantes de Ingeniería Civil UCN sobre la continuidad de la paralización.',
        'Separar la preferencia principal de la disposición a respetar la mayoría.',
        'Pregunta 1: ¿Estás de acuerdo con renovar la paralización? Opciones: Sí; No; Me abstengo.',
        'Pregunta 2: Si gana una opción distinta a la tuya, ¿te sumarías a la decisión mayoritaria? Opciones: Sí; No; Depende de las condiciones.',
        'Pregunta 3 opcional de comentario breve para fundamentos o condiciones relevantes.',
        'Evitar lenguaje de campaña, presión o sesgo.'
      ].join('\n')
    },
    ramo: {
      label: 'Evaluar ramo',
      mode: 'encuesta',
      prompt: [
        'Crear una encuesta objetiva para levantar opinión estudiantil sobre un ramo específico.',
        'Preguntar claridad de clases, carga académica, evaluaciones, disponibilidad de material, apoyo docente y comentarios de mejora.',
        'Usar escalas de 1 a 5 y una pregunta final abierta. No pedir datos personales.'
      ].join('\n')
    },
    contingencia: {
      label: 'Contingencia',
      mode: 'encuesta',
      prompt: [
        'Crear una consulta neutral sobre contingencia académica para estudiantes de Ingeniería Civil UCN.',
        'Medir nivel de información, principales preocupaciones, prioridades y disponibilidad para participar en actividades o asambleas.',
        'Separar opinión, preocupación y disponibilidad en preguntas distintas.'
      ].join('\n')
    }
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
    play: '<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7Z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 13.1A8.5 8.5 0 0 1 10.9 3 7 7 0 1 0 21 13.1Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M12 12h.01"/><path d="M19 12h.01"/><path d="M5 12h.01"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
    pingpong: '<svg viewBox="0 0 24 24"><ellipse cx="11" cy="9" rx="6.2" ry="6.8"/><path d="M11 15.8V21"/><path d="M8 21h6"/><circle cx="19.5" cy="16.5" r="1.9"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M4 5v14a2 2 0 0 0 2 2h14V7"/><path d="M16 13h.01"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24"><path d="M12 3 10.2 8.2 5 10l5.2 1.8L12 17l1.8-5.2L19 10l-5.2-1.8Z"/><path d="M19 14.5 18 17l-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1Z"/><path d="M5 3.5 4.4 5 3 5.6 4.4 6.2 5 7.5 5.6 6.2 7 5.6 5.6 5Z"/></svg>'
  };

  function ensureShape() {
    if (!Data || typeof Data !== 'object') { Data = window.PortalMock = {}; }
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
    Data.notifications = Data.notifications.map((item) => ({
      ...item,
      route: item.route === '/contingencia' ? '/comunicados' : item.route
    }));
    Data.surveys ||= [];
    Data.appointments ||= [];
    Data.staffProfiles ||= [];
    Data.integrations ||= {};
    Data.integrations.googleCalendar ||= { configured: false, connected: false, account: JEFATURA_EMAIL, calendarId: 'primary' };
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
  function safeUrl(u) { try { return ['http:', 'https:'].includes(new URL(String(u)).protocol) ? String(u) : ''; } catch { return ''; } }
  function safeDecode(s) { try { return decodeURIComponent(s); } catch { return null; } }
  function icon(name, extra = '') { return `<span class="icon ${extra}">${ICONS[name] || ICONS.file}</span>`; }
  function applyPortalTheme() {
    const dark = Boolean(state.portalDark);
    document.documentElement.classList.toggle('theme-dark', dark);
    document.body?.classList.toggle('theme-dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }
  function setPortalTheme(dark) {
    state.portalDark = Boolean(dark);
    state.mallaEmbedDark = state.portalDark;
    localStorage.setItem(PORTAL_THEME_KEY, state.portalDark ? 'dark' : 'light');
    localStorage.setItem('portal.malla.embedDark', state.portalDark ? '1' : '0');
    // Cambio de tema SIN re-render: así la vista actual (scroll, malla abierta,
    // formularios a medio llenar) no se pierde. Solo se actualizan clases y
    // los botones de toggle existentes, y el iframe de mallas cambia en vivo.
    applyPortalTheme();
    refreshThemeToggles();
    syncMallaEmbedTheme();
  }
  function themeToggleMarkup(dark) {
    return `${icon(dark ? 'sun' : 'moon')}<span>${dark ? 'Claro' : 'Oscuro'}</span>`;
  }
  function themeToggleButton(extraClass = '', extraAttrs = '') {
    const dark = Boolean(state.portalDark);
    return `<button class="theme-toggle-btn ${extraClass} ${dark ? 'active' : ''}" type="button" data-portal-theme-toggle ${extraAttrs} aria-pressed="${dark ? 'true' : 'false'}" aria-label="Cambiar a modo ${dark ? 'claro' : 'oscuro'}">${themeToggleMarkup(dark)}</button>`;
  }
  function refreshThemeToggles() {
    const dark = Boolean(state.portalDark);
    document.querySelectorAll('[data-portal-theme-toggle]').forEach(btn => {
      btn.classList.toggle('active', dark);
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', `Cambiar a modo ${dark ? 'claro' : 'oscuro'}`);
      btn.innerHTML = themeToggleMarkup(dark);
    });
  }
  function syncMallaEmbedTheme() {
    const dark = Boolean(state.portalDark);
    const workspace = app.querySelector('.malla-workspace');
    if (workspace) {
      workspace.classList.toggle('is-dark', dark);
      workspace.classList.toggle('is-light', !dark);
    }
    const frame = app.querySelector('[data-malla-frame]');
    if (!frame) return;
    frame.dataset.theme = dark ? 'dark' : 'light';
    try {
      frame.contentWindow?.postMessage({ __mcPortalTheme: true, theme: dark ? 'dark' : 'light' }, '*');
    } catch {}
    try {
      const doc = frame.contentDocument;
      if (doc?.documentElement) {
        doc.documentElement.classList.toggle('mc-light', !dark);
      }
    } catch {}
  }
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
      if (user?.role === 'guest') {
        localStorage.removeItem('portal.session');
        return null;
      }
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
  function isLocalDevHost() { return ['localhost', '127.0.0.1', '::1'].includes(location.hostname); }
  function isGuest() { return state.user?.role === 'guest'; }
  function hasCealAccess() { return state.user?.role === 'ceal' && (state.user.accessMode === 'ceal' || !state.user.authProvider); }
  function hasJefaturaAccess() { return state.user?.role === 'jefatura' && state.user.accessMode === 'jefatura'; }
  function hasPermission(permission) { return (state.user?.permissions || []).includes(permission); }
  function canPublishCommunications() { return hasCealAccess() && hasPermission('publish:comunicados'); }
  function accountRoleLabel(user = state.user) {
    if (!user) return '';
    if (user.role === 'ceal') return 'Miembros CEAL';
    if (user.role === 'jefatura') return 'Jefatura de carrera';
    return 'Estudiante';
  }
  function readonlyToast() { showToast('Inicia sesión para usar esta acción', 'blue'); }
  function setButtonBusy(btn, label) {
    if (!btn) return;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="btn-spinner"></span>${label ? `<span>${esc(label)}</span>` : ''}`;
  }
  function persistSnapshot() {
    localWrites += 1;
    try {
      const snapshotData = { ...Data, resources: (Data.resources || []).filter(r => !(r && (r.source === 'drive' || String(r.id).startsWith('drive-')))) };
      localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify({ version: DATA_CONTENT_VERSION, data: snapshotData }));
    } catch (err) {
      console.warn('No se pudo guardar el snapshot local', err);
    }
  }
  const PREF_DEFS = [['recordatorios', 'Recibir recordatorios'], ['soloPlan', 'Mostrar solo mi plan'], ['alertas', 'Alertas de comunicados'], ['compacto', 'Modo compacto']];
  const PREF_DEFAULTS = { recordatorios: true, soloPlan: true, alertas: true, compacto: false };
  function getPrefs() { try { return { ...PREF_DEFAULTS, ...JSON.parse(localStorage.getItem('portal.prefs') || '{}') }; } catch { return { ...PREF_DEFAULTS }; } }
  function setPref(key, val) { const prefs = getPrefs(); prefs[key] = Boolean(val); try { localStorage.setItem('portal.prefs', JSON.stringify(prefs)); } catch {} document.body.classList.toggle('compact-mode', Boolean(prefs.compacto)); }
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
  function portalTodayKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(now)
      .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function currentAndFutureEvents() {
    const today = portalTodayKey();
    return [...(Data.events || [])]
      .filter(event => String(event.date || '').slice(0, 10) >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || '').localeCompare(String(b.time || '')));
  }
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
  function resourceFormatClass(format) {
    const f = plain(format || '');
    if (f.includes('pdf')) return 'fmt-pdf';
    if (f.includes('ppt')) return 'fmt-ppt';
    if (f.includes('doc')) return 'fmt-doc';
    if (/(jpg|jpeg|png|gif|img)/.test(f)) return 'fmt-img';
    return '';
  }
  function ensureLiveRegion() {
    let el = document.getElementById('portal-live');
    if (!el) {
      el = document.createElement('div');
      el.id = 'portal-live';
      el.className = 'sr-only';
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
    }
    return el;
  }
  let toastTimer = null;
  function showToast(message, type = 'green') {
    if (toastTimer) clearTimeout(toastTimer);
    state.toast = { message, type };
    const isError = type === 'red' || type === 'orange';
    const live = ensureLiveRegion();
    live.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    live.textContent = '';
    setTimeout(() => { live.textContent = message; }, 60);
    render();
    toastTimer = setTimeout(() => { toastTimer = null; state.toast = null; render(); }, isError ? 6000 : 4200);
  }
  function toastVariantIcon(type) {
    if (type === 'green') return icon('check', 'toast-icon-glyph');
    if (type === 'red' || type === 'orange') return '<span class="toast-icon-glyph" aria-hidden="true">!</span>';
    return '<span class="toast-icon-glyph" aria-hidden="true">i</span>';
  }
  function renderToast() {
    const t = state.toast;
    if (!t) return '';
    const isError = t.type === 'red' || t.type === 'orange';
    return `<div class="toast toast-${esc(t.type)}" role="${isError ? 'alert' : 'status'}"><span class="toast-dot" aria-hidden="true"></span><span class="toast-icon" aria-hidden="true">${toastVariantIcon(t.type)}</span><span class="toast-msg">${esc(t.message)}</span><button class="toast-close" type="button" data-dismiss-toast aria-label="Cerrar aviso">${icon('x')}</button></div>`;
  }
  // Notificaciones estudiantiles derivadas de contenido vigente.
  const READ_COMMS_KEY = 'portal.comms.read';
  const ANSWERED_SURVEYS_KEY = 'portal.surveys.answered';
  function readIdSet(key) { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } }
  function addToIdSet(key, id) { const set = readIdSet(key); set.add(id); try { localStorage.setItem(key, JSON.stringify([...set].slice(-400))); } catch {} }
  function markCommRead(id) { addToIdSet(READ_COMMS_KEY, id); }
  function markSurveyAnswered(id) { addToIdSet(ANSWERED_SURVEYS_KEY, id); }
  function isCommUnread(c) { return Boolean(c?.unread) && !readIdSet(READ_COMMS_KEY).has(c.id); }
  function studentNotifications() {
    if (!canSeeNotifications()) return [];
    const comms = (Data.communications || []).filter(isCommUnread).slice(0, 12).map(c => ({
      id: `ntf-com-${c.id}`,
      title: c.title,
      detail: `Nuevo comunicado · ${c.category || 'CEIC'}`,
      date: c.date,
      route: `/comunicados/${c.id}`
    }));
    const answered = readIdSet(ANSWERED_SURVEYS_KEY);
    const surveys = FEATURES.surveys ? (Data.surveys || []).filter(s => s.status === 'open' && !answered.has(s.id)).slice(0, 8).map(s => ({
      id: `ntf-enc-${s.id}`,
      title: s.title,
      detail: s.mode === 'votacion' ? 'Nueva votación abierta' : 'Nueva encuesta abierta',
      date: s.updatedAt || s.createdAt,
      route: `/encuestas/${s.id}`
    })) : [];
    return [...comms, ...surveys].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }
  function getUnreadCount() { return studentNotifications().length; }
  function planLabel(plan) { return plan === 'planO' ? 'Plan O - Catálogo 2016' : 'Plan P - Catálogo 2025'; }
  function planShort(plan) { return plan === 'planO' ? 'Plan O' : 'Plan P'; }
  function getCourses(plan = state.activePlan) { return Curricula[plan]?.subjects || []; }
  function getPlanData(plan = state.activePlan) { return Curricula[plan] || Curricula.planP; }
  function allOfficialCourses() { return ['planP', 'planO'].flatMap(plan => (Curricula[plan]?.subjects || []).map(course => ({ plan, course }))); }
  let courseIndexCache = null;
  function courseIndex() {
    if (!courseIndexCache) {
      const byCode = new Map();
      const byName = new Map();
      for (const entry of allOfficialCourses()) {
        byCode.set(entry.course.code, entry);
        if (entry.course.visibleCode) byCode.set(entry.course.visibleCode, entry);
        byName.set(plain(entry.course.name), entry);
      }
      courseIndexCache = { byCode, byName };
    }
    return courseIndexCache;
  }
  function officialCourseByCode(code) {
    const normalized = String(code || '').trim();
    if (!normalized) return null;
    return courseIndex().byCode.get(normalized) || null;
  }
  function officialCourseByName(name) {
    const normalized = plain(name);
    if (!normalized) return null;
    return courseIndex().byName.get(normalized) || null;
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
  function isPlanPCourseName(name = '') {
    const normalized = plain(name);
    return Boolean(normalized && (Curricula.planP?.subjects || []).some(course => plain(course.name) === normalized));
  }
  function findCourse(plan, code) { return getCourses(plan).find(c => c.code === code || c.visibleCode === code); }
  function findCoursePlanForCode(code) { return ['planP', 'planO'].find(plan => findCourse(plan, code)) || state.activePlan; }
  function courseKey(plan, code) { return `${plan}:${code}`; }
  function getPrereqs(plan, course) { return (course.prereqs || []).map(code => findCourse(plan, code)).filter(Boolean); }
  // Descripción REAL del ramo o cadena vacía: las plantillas genéricas
  // ("Asignatura del Plan…", "Ficha curricular…") no se muestran nunca,
  // aunque lleguen desde un catálogo antiguo del backend.
  function courseDescription(course, plan) {
    const raw = tx(course.description || getPlanData(plan).descriptions?.[course.code] || '').trim();
    if (!raw || /^Asignatura del Plan|Revisa esta tarjeta|^Ficha curricular del ramo/i.test(raw)) return '';
    return raw;
  }
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
  function staffProfiles() { return Data.staffProfiles || []; }
  function findStaffProfileByEmail(email) {
    const normalized = String(email || '').toLowerCase();
    return staffProfiles().find(profile => (
      String(profile.email || '').toLowerCase() === normalized
      || (profile.authorizedEmails || []).map(item => String(item || '').toLowerCase()).includes(normalized)
    ));
  }
  function buildStaffUser(profile, payload = {}) {
    const name = profile.displayName || profile.name || payload.name || 'Jefatura de carrera';
    return {
      id: profile.id || `jefatura:${payload.sub || 'career'}`,
      name,
      initials: initialsFromName(name, 'JC'),
      role: 'jefatura',
      accessMode: 'jefatura',
      label: 'Jefatura de carrera',
      plan: 'planP',
      yearLabel: 'Perfil institucional',
      email: profile.email || payload.email || '',
      picture: payload.picture || profile.picture || '',
      authProvider: 'google',
      googleSub: payload.sub || profile.googleSub || '',
      permissions: ['manage:office-hours', 'edit:calendario']
    };
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
  function isLocalAuthAllowed() { return !GOOGLE_CLIENT_ID || isLocalDevHost() || QA_MODE; }
  function devSessionFor(role) {
    if (role === 'jefatura') {
      const profile = staffProfiles()[0] || { id: 'jc', displayName: 'Jefatura de carrera', email: 'jc.icivil.afta@ucn.cl' };
      return { ...buildStaffUser(profile, { sub: 'local-jefatura', email: profile.authorizedEmails?.[0] || profile.email || 'jc.icivil.afta@ucn.cl' }), authProvider: 'local-dev', sessionToken: 'local-dev-jefatura' };
    }
    if (role === 'ceal') {
      const member = findCealMemberByEmail('kevin.cortes@alumnos.ucn.cl') || cealMembers()[0];
      return { ...buildMemberUser(member), authProvider: 'local-dev', accessMode: 'ceal', sessionToken: 'local-dev-ceal' };
    }
    return { id: 'local-student', name: 'Estudiante UCN', initials: 'EU', role: 'student', accessMode: 'student', label: 'Estudiante', plan: 'planP', yearLabel: 'Cuenta UCN', email: 'estudiante@alumnos.ucn.cl', authProvider: 'local-dev', sessionToken: 'local-dev-student', permissions: [] };
  }
  async function qaSessionFor(role) {
    if (!QA_MODE || !API_BASE) return devSessionFor(role);
    const profiles = {
      student: { role: 'student', name: 'Estudiante UCN', label: 'Estudiante', plan: 'planP', yearLabel: 'Cuenta UCN', email: 'qa.estudiante@alumnos.ucn.cl', permissions: [] },
      ceal: { role: 'ceal', name: 'Equipo CEAL', label: 'CEAL', plan: 'planP', yearLabel: 'Gestión interna', email: 'qa.ceal@alumnos.ucn.cl', permissions: ['edit:comunicados', 'edit:calendario', 'manage:material', 'manage:cases', 'edit:mallas'] },
      jefatura: { role: 'jefatura', name: 'Jefatura de carrera', label: 'Jefatura', plan: 'planP', yearLabel: 'Cuenta de jefatura', email: JEFATURA_EMAIL, permissions: ['manage:office-hours', 'edit:calendario'] }
    };
    const payload = await apiRequest('/auth/qa-session', { method: 'POST', body: JSON.stringify(profiles[role] || profiles.student) });
    return payload.user;
  }
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
  let sessionExpiredHandled = false;
  function handleSessionExpired() {
    if (sessionExpiredHandled || !state.user || state.user.role === 'guest') return;
    sessionExpiredHandled = true;
    try { localStorage.removeItem('portal.session'); } catch {}
    state.user = null;
    showToast('Tu sesión expiró. Vuelve a ingresar.', 'orange');
    routeTo('/login');
    setTimeout(() => { sessionExpiredHandled = false; }, 1500);
  }
  async function fetchWithTimeout(url, options = {}, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('El servidor está tardando en responder (puede estar despertando). Inténtalo de nuevo en un momento.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  async function apiRequest(path, options = {}) {
    if (!API_BASE) throw new Error('api unavailable');
    const { timeoutMs = 45000, ...requestOptions } = options;
    const headers = { 'content-type': 'application/json', ...(requestOptions.headers || {}) };
    if (state.user?.sessionToken && !headers.Authorization) headers.Authorization = `Bearer ${state.user.sessionToken}`;
    const res = await fetchWithTimeout(`${API_BASE}${path}`, { ...requestOptions, headers }, timeoutMs);
    const payload = await res.json().catch(() => ({}));
    if (res.status === 401 && state.user?.sessionToken) {
      handleSessionExpired();
      const err = new Error('session-expired');
      err.isSessionExpired = true;
      throw err;
    }
    if (!res.ok || payload.ok === false) throw new Error(payload.error || `api ${res.status}`);
    return payload;
  }
  async function cealAssistantRequest(payload) {
    const endpoint = AI_ENDPOINT || (API_BASE ? `${API_BASE}/ai/ceal-draft` : '');
    if (!endpoint) throw new Error('Asistente IA no disponible.');
    const headers = { 'content-type': 'application/json' };
    if (state.user?.sessionToken) headers.Authorization = `Bearer ${state.user.sessionToken}`;
    const res = await fetchWithTimeout(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) }, 90000);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && state.user?.sessionToken) {
      handleSessionExpired();
      const err = new Error('session-expired');
      err.isSessionExpired = true;
      throw err;
    }
    if (!res.ok || data.ok === false) throw new Error(data.error || `ai ${res.status}`);
    return data;
  }
  async function surveyAssistantRequest(payload) {
    const endpoint = AI_ENDPOINT || (API_BASE ? `${API_BASE}/ai/survey-draft` : '');
    if (!endpoint) throw new Error('Asistente IA no disponible.');
    const headers = { 'content-type': 'application/json' };
    if (state.user?.sessionToken) headers.Authorization = `Bearer ${state.user.sessionToken}`;
    const res = await fetchWithTimeout(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) }, 90000);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && state.user?.sessionToken) {
      handleSessionExpired();
      const err = new Error('session-expired');
      err.isSessionExpired = true;
      throw err;
    }
    if (!res.ok || data.ok === false) throw new Error(data.error || `ai ${res.status}`);
    return data;
  }
  async function calendarStatusRequest() {
    return apiRequest('/calendar/status');
  }
  async function calendarOAuthStartRequest() {
    return apiRequest('/calendar/oauth/start', { method: 'POST', body: JSON.stringify({}) });
  }
  async function calendarDisconnectRequest() {
    return apiRequest('/calendar/disconnect', { method: 'POST', body: JSON.stringify({}) });
  }
  async function calendarVerifyRequest() {
    return apiRequest('/calendar/verify', { method: 'POST', body: JSON.stringify({}) });
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
    return payload;
  }
  function requireGoogleDomain(payload, domain = GOOGLE_DOMAIN) {
    const email = String(payload?.email || '').toLowerCase();
    const hostedDomain = String(payload?.hd || '').toLowerCase();
    if (hostedDomain !== domain || !email.endsWith(`@${domain}`)) throw new Error(`Usa tu cuenta @${domain}.`);
  }
  async function loginGoogle(role, credential) {
    if (API_BASE) {
      const payload = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ role, credential }) });
      if (payload.user) return payload.user;
    }
    const payload = validateGooglePayload(decodeJwtPayload(credential));
    if (role === 'internal') {
      const profile = findStaffProfileByEmail(payload.email);
      if (profile) return buildStaffUser(profile, payload);
      const member = findCealMemberByEmail(payload.email);
      if (member) return markCealGoogleLogin(member, payload);
      throw new Error('Esta cuenta Google no está registrada como Jefatura ni como Miembro CEAL.');
    }
    if (role === 'ceal') {
      const member = findCealMemberByEmail(payload.email);
      if (!member) throw new Error('Esta cuenta Google no está registrada como CEAL.');
      return markCealGoogleLogin(member, payload);
    }
    if (role === 'jefatura') {
      const profile = findStaffProfileByEmail(payload.email);
      if (!profile) throw new Error('Esta cuenta Google no está registrada como Jefatura de carrera.');
      return buildStaffUser(profile, payload);
    }
    requireGoogleDomain(payload);
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
    const mode = ['ceal', 'jefatura', 'internal'].includes(role) ? role : 'student';
    const hostedDomainHint = mode === 'jefatura' ? 'ucn.cl' : mode === 'internal' ? '' : GOOGLE_DOMAIN;
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
      prompt: 'select_account'
    });
    if (hostedDomainHint) params.set('hd', hostedDomainHint);
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
      history.replaceState(null, '', `${location.pathname}${location.search}#${consumePostLoginRoute()}`);
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
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function downloadResource(resource) {
    if (resource.externalUrl) {
      const url = safeUrl(resource.externalUrl);
      if (!url) { showToast('Enlace no disponible', 'orange'); return; }
      window.open(url, '_blank', 'noopener');
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

  function renderBootError() {
    try {
      app.innerHTML = '<div class="boot-error"><h1>No se pudo cargar el portal</h1><p>Recarga la página para reintentar.</p><button onclick="location.reload()">Reintentar</button></div>';
    } catch {}
  }
  let hashRecoveryDone = false;
  function safeRender(options) {
    try {
      render(options);
    } catch (err) {
      console.error(err);
      if (!hashRecoveryDone) {
        hashRecoveryDone = true;
        try { if (window.location.hash !== '#/') window.location.hash = '#/'; } catch {}
        setTimeout(() => { hashRecoveryDone = false; }, 1500);
      }
    }
  }
  async function runBootstrap(allowRetry = true) {
    const writesAtStart = localWrites;
    try {
      const payload = await apiRequest('/bootstrap');
      if (localWrites > writesAtStart) {
        if (allowRetry) setTimeout(() => { runBootstrap(false); }, 3000);
        return;
      }
      if (payload.data) Object.assign(Data, payload.data);
      if (payload.mail) state.mailMeta = payload.mail;
      if (payload.curricula) Object.assign(Curricula, payload.curricula);
      mergeDriveResources();
      ensureShape();
      dataMode = 'backend';
      persistSnapshot();
    } catch { dataMode = 'static'; }
    finally { dataReady = true; renderDataRefresh(); }
  }
  async function boot() {
    try {
      loadLocalSnapshot();
      mergeDriveResources();
      ensureShape();
      document.body.classList.toggle('compact-mode', Boolean(getPrefs().compacto));
      await handleGoogleRedirectCallback();
      const shouldHoldInitialTop = state.user && getRoute().path === '/';
      safeRender();
      if (shouldHoldInitialTop) holdPageTop(1400);
    } catch (err) {
      console.error(err);
      renderBootError();
      return;
    }
    if (!API_BASE) return;
    await runBootstrap();
  }

  function navItems() {
    const items = [
      ['/', 'home', 'Inicio'],
      ['/comunicados', 'megaphone', 'Comunicados'],
      ['/calendario', 'calendar', 'Calendario'],
      ['/mallas', 'grid', 'Mallas'],
      ['/material', 'book', 'Material']
    ];
    if (FEATURES.surveys) items.splice(3, 0, ['/encuestas', 'check', 'Encuestas']);
    if (FEATURES.tableReservations && !isGuest()) items.push(['/reservas', 'pingpong', 'Reservas']);
    if (hasCealAccess()) {
      items.push(['/gestion', 'settings', 'Gestión']);
    }
    if (hasJefaturaAccess()) {
      items.push(['/jefatura', 'users', 'Jefatura']);
    } else if (!isGuest()) {
      items.push(['/atencion', 'users', 'Atención']);
    }
    return items;
  }
  function isActive(path, itemPath) {
    if (itemPath === '/') return path === '/';
    return path === itemPath || path.startsWith(itemPath + '/') || (itemPath === '/calendario' && path.startsWith('/acuerdos/')) || (itemPath === '/mallas' && path.startsWith('/ramo/'));
  }
  function pageHead(title, subtitle = '', actions = '', crumbs = '') {
    return `<div class="page-head"><div>${crumbs || ''}<h1 class="page-title">${esc(title)}</h1>${subtitle ? `<p class="page-subtitle">${esc(subtitle)}</p>` : ''}</div>${actions ? `<div class="hstack">${actions}</div>` : ''}</div>`;
  }
  function breadcrumb(items) {
    return `<nav class="breadcrumb" aria-label="Ruta de navegación"><ol>${items.map((it, i) => {
      const isLast = i === items.length - 1;
      return `<li>${isLast || !it[1] ? `<span aria-current="page">${esc(it[0])}</span>` : `<a href="#${it[1]}">${esc(it[0])}</a>`}</li>`;
    }).join('')}</ol></nav>`;
  }
  function stat(ico, num, label, sub = '') {
    return `<div class="stat-card"><span class="icon-box">${icon(ico)}</span><span class="stat-copy"><strong>${esc(num)}</strong><span>${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</span></div>`;
  }
  function summaryStat(ico, value, label, href) {
    return `<a class="summary-stat" href="#${href}"><span class="icon-box">${icon(ico)}</span><span class="summary-stat-copy"><strong>${esc(value)}</strong><span>${esc(label)}</span></span></a>`;
  }
  function savePostLoginRoute() {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw || raw === '/' || raw.startsWith('/login')) return;
    try { sessionStorage.setItem('portal.postLoginRoute', raw); } catch {}
  }
  function consumePostLoginRoute() {
    try {
      const saved = sessionStorage.getItem('portal.postLoginRoute');
      sessionStorage.removeItem('portal.postLoginRoute');
      return saved && !saved.startsWith('/login') ? saved : '/';
    } catch { return '/'; }
  }
  function paint() {
    applyPortalTheme();
    const { path, query } = getRoute();
    if (!state.user && path !== '/login') { savePostLoginRoute(); return routeTo('/login'); }
    if (state.user && path === '/login') return routeTo('/');
    if (state.user && path === '/contingencia') return routeTo('/comunicados');
    if (state.user && path === '/mas') return routeTo('/reservas');
    if (state.user && (path === '/casos' || path === '/casos/nuevo' || path.startsWith('/casos/'))) return routeTo('/mallas');
    if (state.user && (path === '/apoyo' || path.startsWith('/ayudantias/') || path.startsWith('/tramites/'))) return routeTo('/material');
    if (state.user && path.startsWith('/gestion') && !hasCealAccess()) return routeTo('/');
    app.innerHTML = path === '/login' ? renderLogin() : renderShell(renderPage(path, query), path);
    return true;
  }
  function render(options = {}) {
    const opts = options instanceof Event ? { transition: true, scope: 'route' } : options;
    const routeKey = window.location.hash || '#/';
    if (hasRendered && routeKey !== lastRenderedRouteKey) { state.menuOpen = false; state.notificationsOpen = false; }
    const scope = opts.scope === 'route' && routeKey.startsWith('#/perfil') ? 'profile' : (opts.scope || 'state');
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
    hydrateCalendarStatus();
    if (FEATURES.tableReservations) hydrateReservations();
  }
  async function hydrateCalendarStatus() {
    const route = getRoute().path;
    const canHydrate = (route === '/jefatura' && hasJefaturaAccess()) || (route === '/atencion' && !isGuest());
    if (!canHydrate || !API_BASE) return;
    let started = false;
    if (state.myAppointments === null && !state.myApptsLoading && !state.myApptsError) {
      started = true;
      state.myApptsLoading = true;
      state.myApptsSlow = false;
      const slowTimer = setTimeout(() => {
        if (!state.myApptsLoading || state.myAppointments !== null) return;
        state.myApptsSlow = true;
        render({ transition: false, scope: 'panel', resetScroll: false });
      }, 3500);
      apiRequest('/calendar/appointments', { timeoutMs: 30000 })
        .then(payload => {
          state.myAppointments = Array.isArray(payload.items) ? payload.items : [];
          state.staffClosedSlots = Array.isArray(payload.availability?.closedSlots) ? payload.availability.closedSlots : [];
          state.appointmentBusy = Array.isArray(payload.availability?.occupied) ? payload.availability.occupied : [];
        })
        .catch(error => {
          if (!error?.isSessionExpired) state.myApptsError = error.message || 'No se pudieron cargar los horarios.';
        })
        .finally(() => {
          clearTimeout(slowTimer);
          state.myApptsLoading = false;
          state.myApptsSlow = false;
          render({ transition: false, scope: 'panel', resetScroll: false });
        });
    }
    if (!state.calendarStatus && !state.calendarStatusLoading && !state.calendarStatusError) {
      started = true;
      state.calendarStatusLoading = true;
      state.calendarStatusError = '';
      calendarStatusRequest()
        .then(payload => { state.calendarStatus = payload.status || null; })
        .catch(error => { state.calendarStatusError = error.message || 'No se pudo revisar Calendar.'; })
        .finally(() => {
          state.calendarStatusLoading = false;
          render({ transition: false, scope: 'panel', resetScroll: false });
        });
    }
    if (started) return;
    if (state.calendarStatus?.connected && state.staffBusy === null && !state.staffBusyLoading && !state.staffBusyError) {
      state.staffBusyLoading = true;
      try {
        const now = new Date();
        const timeMax = new Date(now.getTime() + (BOOKING_DAYS_AHEAD + 1) * 86400000);
        const payload = await apiRequest('/calendar/freebusy', { method: 'POST', body: JSON.stringify({ timeMin: now.toISOString(), timeMax: timeMax.toISOString() }) });
        state.staffBusy = Array.isArray(payload.busy) ? payload.busy : [];
      } catch (error) {
        state.staffBusyError = error.message || 'No se pudo revisar disponibilidad.';
        state.staffBusy = null;
      } finally {
        state.staffBusyLoading = false;
        render({ transition: false, scope: 'panel', resetScroll: false });
      }
    }
  }
  function renderLogin() {
    const googleConfigured = Boolean(GOOGLE_CLIENT_ID) && !QA_MODE;
    const googlePending = googleConfigured ? '' : `<div class="google-auth-note"><strong>Acceso institucional no disponible</strong><span>Utiliza el ingreso habilitado por la administración.</span></div>`;
    const googleButton = role => `<button class="google-oauth-btn ${googleConfigured ? '' : 'is-disabled'}" data-google-redirect="${role}" type="button" ${googleConfigured ? '' : 'disabled'}><span class="google-mark" aria-hidden="true">G</span><span>Acceder con Google</span></button>`;
    const devAccess = isLocalDevHost() ? `<div class="dev-login-panel"><span class="kicker">Ingreso rápido</span><div class="quick-chip-row"><button class="chip-btn" type="button" data-dev-login="student">Estudiante</button><button class="chip-btn" type="button" data-dev-login="ceal">CEAL</button><button class="chip-btn" type="button" data-dev-login="jefatura">Jefatura</button></div></div>` : '';
    return `<main class="login-shell">${themeToggleButton('login-theme-toggle')}<section class="login-card" aria-label="Ingreso al portal">
      <div class="login-brand"><figure class="login-campus-art"><img src="${CAMPUS_IMAGE_SRC}" alt="Campus Universidad Católica del Norte" loading="eager" /></figure><div class="login-brand-copy"><img class="login-logo" src="assets/logo-horizontal-transparent.png" alt="CEIC UCN Ingeniería Civil UCN" /><span class="login-wordmark" role="img" aria-label="CEIC UCN"><strong>CEIC UCN</strong><small>Ingeniería Civil · Universidad Católica del Norte</small></span></div></div>
      <div class="login-form"><span class="eyebrow">Acceso UCN</span><h1>Portal CEIC</h1><p>Usa tu correo institucional @alumnos.ucn.cl.</p>
        ${googlePending}${state.authMessage ? `<p class="form-alert">${esc(state.authMessage)}</p>` : ''}
        <div class="google-login-grid">
          <section class="google-login-card">
            <span class="role-icon">${icon('user')}</span>
            <div class="google-login-body">
              <div><strong>Estudiantes</strong><span>Material, mallas, calendario, comunicados y atención.</span></div>
              ${googleButton('student')}
            </div>
          </section>
          <section class="google-login-card">
            <span class="role-icon">${icon('settings')}</span>
            <div class="google-login-body">
              <div><strong>Jefatura / CEAL</strong><span>Acceso a la gestión interna del centro.</span></div>
              ${googleButton('internal')}
            </div>
          </section>
        </div>${devAccess}
      </div></section></main>`;
  }
  function canSeeNotifications() { return state.user?.role === 'student'; }
  function notificationBell(extraClass = '') {
    if (!canSeeNotifications()) return '';
    const count = getUnreadCount();
    return `<button class="icon-btn ${extraClass}" data-toggle-notifications aria-label="Notificaciones${count ? ` (${count} nuevas)` : ''}">${icon('bell')}${count ? `<span class="badge-count">${count}</span>` : ''}</button>`;
  }
  function renderShell(content, path) {
    const accountLabel = 'Mi cuenta';
    const isMallaRoute = path === '/mallas';
    const shellClass = `app-shell ${isMallaRoute ? 'malla-route' : ''}`.trim();
    const nav = navItems().map(([href, ico, label]) => { const on = isActive(path, href); return `<a class="nav-item ${on ? 'active' : ''}" href="#${href}"${on ? ' aria-current="page"' : ''}>${icon(ico)}<span>${label}</span></a>`; }).join('');
    const campusNav = `<a class="sidebar-campus-card" href="#/"><img src="${CAMPUS_IMAGE_SRC}" alt="Campus Universidad Católica del Norte" loading="eager" /><span><strong>Portal académico</strong><small>Ingeniería Civil UCN</small></span></a>`;
    const roleDestination = isGuest() ? ['/calendario', 'calendar', 'Calendario'] : hasJefaturaAccess() ? ['/jefatura', 'users', 'Jefatura'] : ['/atencion', 'users', 'Atención'];
    const bottom = [['/', 'home', 'Inicio'], ['/comunicados', 'megaphone', 'Comunicados'], ['/mallas', 'grid', 'Mallas'], ['/material', 'book', 'Material'], roleDestination]
      .map(([href, ico, label]) => { const on = isActive(path, href); return `<a class="bottom-item ${on ? 'active' : ''}" href="#${href}"${on ? ' aria-current="page"' : ''}><span class="bottom-item-ico">${icon(ico)}</span><span class="bottom-item-label">${label}</span></a>`; }).join('');
    return `<div class="${shellClass}"><a class="skip-link" href="#main-content">Saltar al contenido</a>${state.offline ? '<div class="offline-banner" role="status">Sin conexión — estás viendo datos guardados.</div>' : ''}<aside class="sidebar"><a class="sidebar-brand" href="#/"><span class="brand-mark"><img src="assets/logo-mark-transparent.png" alt="CEIC UCN" /></span><span class="brand-copy"><strong>CEIC UCN</strong><span>INGENIERÍA CIVIL UCN</span></span></a>${campusNav}<nav class="nav" aria-label="Navegación principal">${nav}</nav></aside>
      <main class="app-main"><header class="topbar"><form class="global-search" data-global-search-form><button class="search-submit" type="submit" aria-label="Buscar">${icon('search')}</button><input name="q" type="search" placeholder="Buscar en el portal..." /></form><div class="topbar-actions">${themeToggleButton('topbar-theme-toggle')}${notificationBell()}<a class="account-trigger" href="#/perfil">${icon('user')}<span>${accountLabel}</span></a></div></header>
      <header class="mobile-header"><button class="icon-btn menu-btn" data-open-menu aria-label="Abrir menú" aria-expanded="${state.menuOpen ? 'true' : 'false'}">${icon('menu')}</button><a class="mobile-brand" href="#/"><img src="assets/logo-mark-transparent.png" alt="CEIC UCN" /><strong>CEIC UCN</strong></a><div class="mobile-actions">${themeToggleButton('mobile-theme-toggle')}${notificationBell()}<a class="icon-btn" href="#/perfil" aria-label="Mi cuenta">${icon('user')}</a></div></header>
      <section class="content ${isMallaRoute ? 'content-mallas' : ''}" id="main-content" tabindex="-1">${content}</section><nav class="bottom-nav" aria-label="Navegación inferior">${bottom}</nav></main>${themeToggleButton('theme-floating-toggle')}${state.menuOpen ? renderMobileMenu(path) : ''}${state.notificationsOpen ? renderNotificationPopover() : ''}${renderToast()}</div>`;
  }
  function renderMobileMenu(path) {
    const u = state.user || {};
    const items = navItems().map(([href, ico, label]) => {
      const on = isActive(path, href);
      return `<a class="menu-sheet-item ${on ? 'active' : ''}" href="#${href}"${on ? ' aria-current="page"' : ''}>${icon(ico)}<span>${label}</span>${icon('arrow', 'menu-item-arrow')}</a>`;
    }).join('');
    return `<div class="menu-sheet-backdrop" data-close-menu></div>
      <aside class="menu-sheet" role="dialog" aria-modal="true" aria-label="Menú del portal">
        <header class="menu-sheet-head">
          <a class="menu-sheet-user" href="#/perfil"><span class="avatar">${esc(u.initials || 'IN')}</span><span class="menu-sheet-user-copy"><strong>${esc(u.name || 'Invitado')}</strong><small>${esc(accountRoleLabel(u) || 'Portal CEIC')}</small></span></a>
          <button class="icon-btn" data-close-menu aria-label="Cerrar menú">${icon('x')}</button>
        </header>
        <nav class="menu-sheet-nav" aria-label="Todas las secciones">${items}
          <a class="menu-sheet-item ${path === '/perfil' ? 'active' : ''}" href="#/perfil">${icon('user')}<span>Mi cuenta</span>${icon('arrow', 'menu-item-arrow')}</a>
        </nav>
        <footer class="menu-sheet-foot">
          ${themeToggleButton('menu-theme-toggle')}
          <button class="menu-sheet-logout" type="button" data-logout>${icon('x')}<span>Cerrar sesión</span></button>
        </footer>
      </aside>`;
  }
  function renderPage(path, query) {
    if (path === '/') return renderHome();
    if (path === '/reservas') return FEATURES.tableReservations && !isGuest() ? renderReservations() : renderNotFound();
    if (path === '/perfil') return renderProfile();
    if (path === '/buscar') return renderSearch(query.q || '');
    if (path === '/notificaciones') return renderNotificationsPage();
    if (path === '/comunicados') return renderCommunications();
    if (path === '/comunicados/nuevo') return renderCealAssistant();
    if (path.startsWith('/comunicados/')) {
      const commId = path.split('/')[2];
      if (commId) markCommRead(commId);
      return renderCommunicationDetail(commId);
    }
    if (path === '/calendario') return renderCalendar();
    if (path === '/encuestas') return FEATURES.surveys ? renderSurveys() : renderNotFound();
    if (path === '/encuestas/nueva') return FEATURES.surveys ? renderSurveyBuilder() : renderNotFound();
    if (path.startsWith('/encuestas/')) return FEATURES.surveys ? renderSurveyDetail(path.split('/')[2]) : renderNotFound();
    if (path === '/jefatura') return hasJefaturaAccess() ? renderBookingPage(true) : renderNotFound('Esta sección es exclusiva de la Jefatura de carrera.');
    if (path === '/atencion') return isGuest() ? renderNotFound('Inicia sesión para agendar atención con Jefatura.') : renderBookingPage(false);
    if (path === '/asistente') return renderCealAssistant();
    if (path === '/gestion') return ensureCEAL(renderManagement());
    if (path === '/gestion/acuerdos/nuevo') return ensureCEAL(renderAgreementForm());
    if (path.startsWith('/gestion/material/') && path.endsWith('/validar')) return ensureCEAL(renderValidateMaterial(path.split('/')[3]));
    if (path.startsWith('/gestion/comunicados/') && path.endsWith('/editar')) return ensureCEAL(renderEditor(path.split('/')[3]));
    if (path.startsWith('/acuerdos/')) return renderAgreementDetail(path.split('/')[2]);
    if (path === '/casos' || path === '/casos/nuevo' || path.startsWith('/casos/')) return renderMallas();
    if (path === '/material') {
      if (query.course) {
        const courseCode = safeDecode(String(query.course));
        if (courseCode !== null) {
          // Filtro ESTRICTO por ramo oficial: se fija el nombre canónico del
          // curso (los recursos están canonicalizados a ese mismo nombre) y
          // NO se usa búsqueda de texto, para que solo aparezca material que
          // pertenece de verdad al ramo.
          const match = officialCourseByCode(courseCode.trim());
          if (match) {
            state.materialCourse = titleCase(match.course.name);
            state.materialQuery = '';
            state.materialType = 'all';
          } else {
            state.materialCourse = 'all';
            state.materialQuery = courseCode;
          }
          state.selectedResourceId = null;
        }
      }
      return renderMaterial();
    }
    if (path === '/material/subir') return renderUploadMaterial();
    if (path.startsWith('/material/')) return renderMaterialDetailPage(path.split('/')[2]);
    if (path === '/mallas') return renderMallas();
    if (path.startsWith('/ramo/')) {
      const [, , plan, code] = path.split('/');
      const decodedCode = safeDecode(code);
      if (decodedCode === null) return renderNotFound();
      return renderCourseDetailPage(plan, decodedCode);
    }
    if (path === '/apoyo' || path.startsWith('/ayudantias/') || path.startsWith('/tramites/')) return renderMaterial();
    return renderNotFound();
  }

  function renderHome() {
    const noDataYet = !dataReady && !Data.communications.length && !Data.events.length;
    const homeUnreadComms = (Data.communications || []).filter(isCommUnread).length;
    const upcomingEvents = currentAndFutureEvents();
    const homeNextEvent = upcomingEvents[0];
    const homeActiveAgreements = (Data.agreements || []).filter(a => a.status !== 'publicado').length;
    const homeResourceCount = (Data.resources || []).length;
    const summaryStrip = `<div class="summary-strip">${summaryStat('megaphone', homeUnreadComms, 'Comunicados nuevos', '/comunicados')}${summaryStat('calendar', homeNextEvent ? fmtDate(homeNextEvent.date) : '—', 'Próxima fecha', '/calendario')}${summaryStat('file', homeActiveAgreements, 'Seguimientos activos', '/calendario')}${summaryStat('book', homeResourceCount, 'Recursos', '/material')}</div>`;
    return `${pageHead('Inicio', 'Comunicados, calendario, mallas y material académico')}${summaryStrip}
      <section class="home-hero"><section class="card pad home-comms-brief"><div class="row-between"><h2 class="card-title">Últimos comunicados</h2><a class="link" href="#/comunicados">Ver todos ${icon('arrow')}</a></div>${(Data.communications || []).slice(0, 3).map(c => `<a class="link-card-row" href="#/comunicados/${c.id}"><span><strong>${esc(c.title)}</strong><span class="small muted">${esc(c.category)} · ${fmtDate(c.date)}</span></span>${icon('arrow')}</a>`).join('') || (noDataYet ? skeletonList(3) : '<p class="small muted">Sin comunicados por ahora.</p>')}</section><section class="home-campus-feature" aria-label="Campus Universidad Católica del Norte"><img src="${CAMPUS_IMAGE_SRC}" alt="Campus Universidad Católica del Norte" loading="eager" /><div class="home-campus-caption"><span>Ingeniería Civil UCN</span><strong>Portal académico CEIC / CEAL</strong></div></section>
      <div class="card pad home-actions-panel"><h2 class="card-title">Acciones frecuentes</h2><div class="access-grid home-actions-grid">${access('grid','Abrir mallas','Plan O y Plan P.','Ver malla','/mallas','blue')}${access('book','Buscar material','Guías, pruebas, apuntes y PPT.','Abrir','/material')}${access('megaphone','Comunicados','Avisos de la carrera.','Abrir','/comunicados')}${access('calendar','Ver calendario','Fechas académicas vigentes.','Abrir','/calendario')}${isGuest() ? '' : access('users','Atención de Jefatura','Consulta horas disponibles.','Abrir',hasJefaturaAccess() ? '/jefatura' : '/atencion','blue')}</div></div></section>${renderHomeDigest()}
      <div class="grid two" style="margin-top:18px"><section class="card pad"><div class="row-between"><h2 class="card-title">Novedades recientes</h2><a class="link" href="#/comunicados">Ver todas ${icon('arrow')}</a></div>${Data.communications.slice(0,4).map(c => newsRow('megaphone', c.title, c.summary, `/comunicados/${c.id}`, c.date)).join('') || (noDataYet ? skeletonList(3) : '')}</section><section class="card pad"><div class="row-between"><h2 class="card-title">Próximas fechas</h2><a class="link" href="#/calendario">Ver calendario ${icon('arrow')}</a></div>${upcomingEvents.slice(0,4).map(dateRow).join('') || (noDataYet ? skeletonList(3) : renderEmpty('Sin fechas próximas', 'No hay hitos futuros publicados.'))}</section></div>`;

  }
  function renderHomeDigest() {
    const d = Data.aiCommunicationsDigest;
    if (!d || !d.text) return '';
    return `<section class="card pad home-digest"><div class="home-digest-head"><span class="kicker">Resumen de comunicados</span><a class="link" href="#/comunicados">Ver todos ${icon('arrow')}</a></div><p>${esc(d.text)}</p></section>`;
  }
  function access(ico, title, desc, action, href, tone = '') { return `<a class="access-card" href="#${href}"><span class="icon-box ${tone}">${icon(ico)}</span><span class="access-copy"><strong>${esc(title)}</strong><span>${esc(desc)}</span><em>${esc(action)} ${icon('arrow')}</em></span></a>`; }
  function newsRow(ico, title, desc, href, date) { return `<a class="link-card-row" href="#${href}"><span class="hstack">${icon(ico)}<span><strong>${esc(title)}</strong><span>${esc(desc || '')}</span></span></span><span class="small muted">${fmtDate(date)}</span></a>`; }
  function dateRow(e) {
    const detail = [fmtDate(e.date), e.time, e.description].filter(Boolean).map(esc).join(' - ');
    return `<a class="link-card-row" href="#/calendario?date=${encodeURIComponent(String(e.date || '').slice(0, 10))}"><span><strong>${esc(e.title)}</strong><span>${detail}</span></span><span class="pill blue">${esc(e.type || 'Fecha')}</span></a>`;
  }
  function calendarNextRow(e) {
    return `<a class="link-card-row calendar-next-row" href="#/calendario?date=${encodeURIComponent(String(e.date || '').slice(0, 10))}"><span><strong>${esc(e.title)}</strong><span>${fmtDate(e.date)}${e.time ? ` · ${esc(e.time)}` : ''}</span></span><span class="pill ${calendarEventTone(e.type)}">${esc(e.type || 'Fecha')}</span></a>`;
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
  function renderMonthCalendar(monthDate, events, selectedDate) {
    const todayKey = portalTodayKey();
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
      const classes = ['day-cell', inMonth ? '' : 'outside', dateKey === todayKey ? 'today' : '', dateKey === selectedDate ? 'selected' : '', dateKey && dateKey < todayKey ? 'past' : '', dayEvents.length ? 'has-event' : ''].filter(Boolean).join(' ');
      const eventsMarkup = dayEvents.slice(0, 2).map(event => `<span class="day-event ${calendarEventTone(event.type)}" title="${esc(event.title)}">${esc(event.title)}</span>`).join('');
      const extra = dayEvents.length > 2 ? `<span class="day-more">+${dayEvents.length - 2}</span>` : '';
      const label = dateKey ? `${parseCalendarDate(dateKey).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}${dayEvents.length ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}` : ''}` : '';
      return inMonth
        ? `<button type="button" class="${classes}" data-calendar-date="${dateKey}" aria-label="${esc(label)}" aria-pressed="${dateKey === selectedDate ? 'true' : 'false'}"><time datetime="${dateKey}"><span class="day-number">${visibleDay}</span>${dateKey === todayKey ? '<span class="today-dot">Hoy</span>' : ''}</time>${eventsMarkup}${extra}</button>`
        : `<div class="${classes}" aria-hidden="true"><span class="day-number muted">${visibleDay}</span></div>`;
    }).join('');
    return `<div class="month-grid" aria-label="Calendario ${esc(calendarMonthLabel(monthDate))}">${heads}${cells}</div>`;
  }
  function renderMonthEventAgenda(monthDate, events, selectedDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthEvents = events.filter(event => {
      const date = parseCalendarDate(event.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    if (!monthEvents.length) return renderEmpty('Sin fechas este mes', 'Las próximas actividades aparecen en la agenda lateral.');
    return `<div class="calendar-month-agenda">${monthEvents.map(event => `<button type="button" class="calendar-agenda-row ${String(event.date).slice(0, 10) === selectedDate ? 'selected' : ''}" data-calendar-date="${esc(String(event.date).slice(0, 10))}"><time datetime="${esc(event.date)}"><strong>${parseCalendarDate(event.date).getDate()}</strong><span>${parseCalendarDate(event.date).toLocaleDateString('es-CL', { month: 'short' })}</span></time><span><strong>${esc(event.title)}</strong><small>${[event.time, event.description].filter(Boolean).map(esc).join(' - ')}</small></span><em class="${calendarEventTone(event.type)}">${esc(event.type || 'Fecha')}</em></button>`).join('')}</div>`;
  }

  function renderSelectedCalendarDay(dateKey, events) {
    const date = parseCalendarDate(dateKey);
    const dayEvents = events.filter(event => String(event.date || '').slice(0, 10) === dateKey);
    const rawHeading = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    const heading = rawHeading.charAt(0).toUpperCase() + rawHeading.slice(1);
    if (!dayEvents.length) return `<section class="card pad calendar-day-detail" aria-live="polite"><span class="kicker">Día seleccionado</span><h2 class="card-title">${esc(heading)}</h2><p class="small muted">Sin hitos publicados.</p></section>`;
    return `<section class="card pad calendar-day-detail" aria-live="polite"><span class="kicker">Día seleccionado</span><h2 class="card-title">${esc(heading)}</h2><div class="calendar-day-events">${dayEvents.map(event => `<article><div class="row-between"><strong>${esc(event.title)}</strong><span class="pill ${calendarEventTone(event.type)}">${esc(event.type || 'Fecha')}</span></div>${event.time ? `<time>${esc(event.time)}</time>` : ''}<p>${esc(event.description || 'Actividad del calendario académico.')}</p></article>`).join('')}</div></section>`;
  }

  function renderCommunications() {
    const cats = ['Todas', ...new Set(Data.communications.map(c => c.category))];
    const q = plain(state.communicationQuery);
    const items = Data.communications.filter(c => (state.communicationCategory === 'Todas' || plain(c.category) === plain(state.communicationCategory)) && (!q || plain([c.title, c.summary, c.category, c.source].join(' ')).includes(q)));
    const selected = items[0];
    const noDataYet = !dataReady && !Data.communications.length;
    const createAction = canPublishCommunications() ? `<a class="btn primary" href="#/comunicados/nuevo">${icon('megaphone')} Crear comunicado</a>` : '';
    return `${pageHead('Comunicados', 'Avisos, respuestas y actualizaciones de la carrera', createAction)}
      <div class="comms-layout"><aside class="card pad comms-filters"><div class="form-field"><label>Buscar comunicados</label><input class="input" data-com-search value="${esc(state.communicationQuery)}" placeholder="Buscar comunicado" /></div><h2 class="card-title">Categorías</h2><div class="comms-category-list">${cats.map(c => `<button class="chip-btn ${state.communicationCategory === c ? 'active' : ''}" data-com-category="${esc(c)}">${esc(c)}</button>`).join('')}</div></aside>
      <main class="card pad comms-feed"><div class="row-between"><h2 class="card-title">Comunicado destacado</h2><span class="pill gray">${items.length} visibles</span></div>${selected ? commCard(selected, true) : (noDataYet ? skeletonList(1) : renderEmpty('Sin comunicados visibles', 'Cambia los filtros para revisar otros avisos.'))}<div class="divider"></div><h2 class="card-title">Recientes</h2><div class="card-list">${items.slice(1).map(c => commCard(c)).join('') || (noDataYet ? skeletonList(2) : '<p class="small muted">No hay más comunicados en esta categoría.</p>')}</div></main>
      <aside class="card pad comms-preview"><h2 class="card-title">Preguntas frecuentes</h2>${renderFAQ()}</aside></div>`;
  }
  function commCard(c, featured = false) {
    const card = `<a class="item-card${featured ? ' is-featured' : ''}${isCommUnread(c) ? ' unread' : ''}" href="#/comunicados/${c.id}"><div class="row-between"><span class="pill blue">${esc(c.category)}</span><span class="small muted">${fmtDate(c.date)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><span class="link">Leer comunicado ${icon('arrow')}</span></a>`;
    if (!canPublishCommunications()) return card;
    return `<div class="card-del-wrap">${card}<button class="card-del" type="button" data-comm-delete="${esc(c.id)}" data-comm-title="${esc(c.title || 'este comunicado')}" aria-label="Eliminar comunicado">${icon('x')}</button></div>`;
  }
  function relatedLink(r) {
    const isAgreement = ['contingencia', 'acuerdo', 'seguimiento'].includes(plain(r.type));
    const href = isAgreement ? (r.id ? `/acuerdos/${encodeURIComponent(r.id)}` : '/calendario') : '/calendario';
    const type = isAgreement ? 'Acuerdo' : (r.type || 'Relacionado');
    return `<a class="link-card-row" href="#${href}"><span><strong>${esc(r.label)}</strong><span>${esc(type)}</span></span>${icon('arrow')}</a>`;
  }
  function findCommunicationById(id) {
    return Data.communications.find(x => x.id === id)
      || (id === 'com-001' ? Data.communications.find(x => x.id === 'com-paro-005') || Data.communications[0] : null);
  }
  function findAgreementById(id) {
    return Data.agreements.find(x => x.id === id)
      || (id === 'agr-003' ? Data.agreements.find(x => x.id === 'agr-paro-003') || Data.agreements[0] : null);
  }
  function findResourceById(id) {
    return Data.resources.find(x => x.id === id)
      || (/^mat-\d{3}$/.test(id || '') ? Data.resources.find(x => x.status === 'pendienteRevision') || Data.resources[0] : null);
  }
  function renderCommunicationDetail(id) {
    const c = findCommunicationById(id);
    if (!c && !dataReady) return renderLoading('Comunicado', 'Abriendo el comunicado…');
    if (!c) return renderNotFound('No encontramos el comunicado.');
    const markAction = isGuest() ? '' : `<button class="btn primary" data-mark-read="${esc(c.id)}">Marcar como leído</button>`;
    const deleteAction = canPublishCommunications() ? `<button class="btn ghost danger-lite" data-comm-delete="${esc(c.id)}" data-comm-title="${esc(c.title || 'este comunicado')}">${icon('x')} Eliminar comunicado</button>` : '';
    return `${pageHead(c.title, `${c.category} - ${fmtDate(c.date)}, ${fmtTime(c.date)}`, `<a class="btn secondary" href="#/comunicados">Volver</a>`, breadcrumb([['Inicio', '/'], ['Comunicados', '/comunicados'], [c.title]]))}<div class="split"><article class="card pad"><div class="hstack">${badge('blue', c.category)}${c.pinned ? badge('orange','Fijado') : ''}</div><p class="communication-body">${esc(c.body)}</p><div class="detail-block"><div class="detail-row"><span>Fuente</span><strong>${esc(c.source)}</strong></div><div class="detail-row"><span>Publicado</span><strong>${fmtDate(c.date)}, ${fmtTime(c.date)}</strong></div></div><div class="hstack">${markAction}<button class="btn secondary" data-copy-link>Copiar enlace</button>${deleteAction}</div></article><aside class="card pad"><h2 class="card-title">Relacionado</h2>${(c.related || []).map(relatedLink).join('') || '<p class="small muted">Sin vínculos relacionados.</p>'}<div class="divider"></div>${renderFAQ()}</aside></div>`;
  }
  function renderFAQ() { return `<div class="vstack">${Data.faqs.slice(0, 5).map((f, i) => `<button class="link-card-row" data-faq="${i}"><span><strong>${esc(f.q)}</strong>${state.openFAQ === i ? `<span class="faq-answer">${esc(f.a)}</span>` : ''}</span>${icon(state.openFAQ === i ? 'x' : 'arrow')}</button>`).join('')}</div>`; }

  function renderCalendar() {
    const calendarAction = isGuest() ? '' : `<button class="btn secondary" data-download-calendar>${icon('calendar')} Exportar agenda</button>`;
    const todayKey = portalTodayKey();
    const routeDate = String(getRoute().query.date || '').slice(0, 10);
    const validRouteDate = /^\d{4}-\d{2}-\d{2}$/.test(routeDate) ? routeDate : '';
    if (validRouteDate && state.calendarSelectedDate !== validRouteDate) {
      state.calendarSelectedDate = validRouteDate;
      state.calendarMonth = parseCalendarDate(validRouteDate);
    }
    state.calendarSelectedDate ||= todayKey;
    state.calendarMonth ||= parseCalendarDate(state.calendarSelectedDate);
    const currentMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), 1);
    const events = [...(Data.events || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || '').localeCompare(String(b.time || '')));
    const nextEvents = currentAndFutureEvents();
    const agreementAction = hasCealAccess() ? `<a class="btn secondary sm" href="#/gestion/acuerdos/nuevo">Nuevo seguimiento</a>` : '';
    const agreementRows = Data.agreements.slice(0, 4).map(agreementRow).join('') || '<p class="small muted">Sin seguimientos publicados.</p>';
    const monthEventCount = events.filter(event => { const date = parseCalendarDate(event.date); return date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth(); }).length;
    const monthActions = `<div class="calendar-month-actions"><button class="icon-btn calendar-prev" type="button" data-calendar-month="-1" aria-label="Mes anterior" title="Mes anterior">${icon('arrow')}</button><button class="btn secondary sm" type="button" data-calendar-today>Hoy</button><button class="icon-btn" type="button" data-calendar-month="1" aria-label="Mes siguiente" title="Mes siguiente">${icon('arrow')}</button></div>`;
    return `${pageHead('Calendario académico', 'Fechas vigentes y próximas', calendarAction)}
      <div class="calendar-layout refined-calendar-layout"><section class="card pad academic-calendar-card"><div class="calendar-card-head"><div><span class="kicker">Vista mensual</span><h2 class="card-title">${esc(calendarMonthLabel(currentMonth))}</h2></div>${monthActions}</div>${renderMonthCalendar(currentMonth, events, state.calendarSelectedDate)}<div class="divider"></div><div class="row-between calendar-agenda-title"><h2 class="card-title">Eventos del mes</h2><span class="pill gray">${monthEventCount}</span></div>${renderMonthEventAgenda(currentMonth, events, state.calendarSelectedDate)}</section><aside class="calendar-side-panel">${renderSelectedCalendarDay(state.calendarSelectedDate, events)}<section class="card pad"><div class="row-between"><h2 class="card-title">Próximos hitos</h2><span class="pill blue">${nextEvents.length}</span></div><div class="card-list">${nextEvents.slice(0, 6).map(calendarNextRow).join('') || '<p class="small muted">Sin fechas próximas.</p>'}</div><div class="divider"></div><p class="small muted">Fuente: Calendario DGPRE UCN 2026. Fechas sujetas a actualización.</p></section><section class="card pad"><div class="row-between"><h2 class="card-title">Acuerdos y seguimiento</h2>${agreementAction}</div><div class="card-list">${agreementRows}</div></section></aside></div>`;
  }
  function agreementRow(a) { return `<a class="link-card-row" href="#/acuerdos/${a.id}"><span><strong>${esc(a.number || a.title)}</strong><span>${fmtDate(a.date)} - ${esc(a.title)}</span></span>${badge(a.status)}</a>`; }
  function commitRow(c) { return `<div class="commit-row"><span><strong>${esc(c.title)}</strong><span>${esc(c.responsible)} - vence ${fmtDate(c.due)}</span></span>${badge(c.status)}</div>`; }
  function renderAgreementSummary(a) { return `<div class="row-between"><div><span class="kicker">Detalle de seguimiento</span><h2 class="card-title">${esc(a.number || a.title)}</h2>${a.number && a.title ? `<p class="muted">${esc(a.title)}</p>` : ''}</div>${badge(a.status)}</div><div class="detail-block"><div class="detail-row"><span>Origen</span><strong>${esc(a.origin)}</strong></div><div class="detail-row"><span>Fecha</span><strong>${fmtDate(a.date)}</strong></div><div class="detail-row"><span>Responsable</span><strong>${esc(a.responsible)}</strong></div></div><div class="grid two"><div><h3 class="card-title">Resumen</h3><p class="small muted">${esc(a.summary)}</p></div><div><h3 class="card-title">Estado actual</h3><p class="small muted">${esc(a.currentState)}</p></div></div>`; }
  function renderAgreementDetail(id) {
    const a = findAgreementById(id);
    if (!a && !dataReady) return renderLoading('Seguimiento', 'Abriendo el seguimiento…');
    if (!a) return renderNotFound('No encontramos el acuerdo.');
    const downloadAction = isGuest() ? '' : `<button class="btn primary full" data-download-agreement="${esc(a.id)}">Descargar ficha</button>`;
    return `${pageHead(a.number || a.title, `${fmtDate(a.date)} - ${a.origin}`, `<a class="btn secondary" href="#/calendario">Volver al calendario</a>`, breadcrumb([['Inicio', '/'], ['Calendario', '/calendario'], [a.number || a.title]]))}<div class="split wide"><section class="card pad">${renderAgreementSummary(a)}<div class="detail-block"><h3 class="card-title">Compromisos</h3>${(a.commitments || []).map(commitRow).join('') || '<p class="small muted">Sin compromisos registrados.</p>'}</div><div class="detail-block"><h3 class="card-title">Historial</h3>${timeline(a.history || [])}</div></section><aside class="card pad"><h2 class="card-title">Documentos asociados</h2>${(a.documents || []).map(d => `<div class="link-card-row"><span><strong>${esc(d.name)}</strong><span>${esc(d.type)} - ${esc(d.size)}</span></span>${icon('file')}</div>`).join('') || '<p class="small muted">Sin documentos asociados.</p>'}<div class="divider"></div>${downloadAction}<button class="btn secondary full" data-copy-link>Copiar enlace</button></aside></div>`;
  }

  function renderMaterial() {
    Data.resources = sanitizeMaterialResources(Data.resources);
    const courseFacets = materialCourseFacets(Data.resources);
    const courses = courseFacets.map(item => item.label);
    // Si el ramo filtrado es oficial se respeta aunque (aún) no tenga
    // recursos: mejor un estado vacío honesto que mostrar material ajeno.
    if (state.materialCourse !== 'all' && !courses.some(course => plain(course) === plain(state.materialCourse)) && !officialCourseByName(state.materialCourse)) {
      state.materialCourse = 'all';
    }
    const q = plain(state.materialQuery);
    const items = Data.resources.filter(r => (!q || plain([r.title, r.courseName, r.courseCode, r.type, r.origin].join(' ')).includes(q)) && (state.materialType === 'all' || plain(r.type) === plain(state.materialType)) && (state.materialCourse === 'all' || plain(r.courseName) === plain(state.materialCourse)));
    const selected = Data.resources.find(r => r.id === state.selectedResourceId) || items[0];
    const types = ['all', ...[...new Set(Data.resources.map(r => r.type).filter(Boolean))].sort((a, b) => tx(a).localeCompare(tx(b), 'es-CL'))];
    const typeCounts = {};
    Data.resources.forEach(r => { if (r.type) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
    const quickTypes = ['Guía', 'Prueba', 'Apunte', 'PPT', 'Resumen'].filter(type => types.includes(type));
    if (state.materialType !== 'all' && types.includes(state.materialType) && !quickTypes.includes(state.materialType)) quickTypes.unshift(state.materialType);
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
    const planPNotice = state.materialCourse !== 'all' && isPlanPCourseName(state.materialCourse)
      ? `<div class="material-plan-note">${icon('grid')}<span>Plan P está incorporando material de forma progresiva. Cuando exista continuidad con Plan O, la biblioteca muestra recursos equivalentes por nombre de ramo.</span></div>`
      : '';
    const uploadAction = isGuest() ? '' : `<a class="btn primary" href="#/material/subir">${icon('upload')} Subir material</a>`;
    const visibleCount = Math.max(0, Number(state.materialVisibleCount) || 60);
    const visible = items.slice(0, visibleCount);
    const remaining = items.length - visible.length;
    const showMore = remaining > 0 ? `<div class="material-show-more"><button class="btn secondary" type="button" data-material-more>Mostrar más (${remaining} restantes)</button></div>` : '';
    const noDataYet = !dataReady && !Data.resources.length;
    const appliedFilters = activeFilters.length ? `<div class="applied-filters active-filter-row"><span>Filtros activos</span>${activeFilters.map(([kind, label]) => `<button class="filter-token" data-material-clear="${esc(kind)}" type="button">${esc(label)} <span class="filter-chip-remove">${icon('x')}</span></button>`).join('')}<button class="btn ghost sm applied-filters-clear" data-material-clear="all" type="button">Limpiar todo</button></div>` : '';
    return `${pageHead('Biblioteca académica', 'Recursos para estudiar por ramo', uploadAction)}
      <div class="split wide"><section class="card pad material-browser"><div class="material-search-panel"><label for="material-search-input">Buscar recurso</label><div class="material-search-box">${icon('search')}<input id="material-search-input" data-material-search value="${esc(state.materialQuery)}" placeholder="Ramo, código, prueba, apunte o guía" autocomplete="off" /></div><div class="material-controls"><label><span>Tipo</span><select class="select" data-material-type-select><option value="all"${state.materialType === 'all' ? ' selected' : ''}>Todos los tipos</option>${types.filter(t => t !== 'all').map(t => `<option value="${esc(t)}"${state.materialType === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label><label><span>Ramo</span><select class="select" data-material-course-select><option value="all"${state.materialCourse === 'all' ? ' selected' : ''}>Todos los ramos</option>${courses.map(c => `<option value="${esc(c)}"${state.materialCourse === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>${hasActiveFilters ? `<button class="btn secondary sm material-reset" data-material-clear="all" type="button">${icon('x')} Limpiar</button>` : ''}</div>${appliedFilters}${planPNotice}<div class="material-suggestions"><span>Tipos frecuentes</span><div class="quick-chip-row"><button class="${state.materialType === 'all' ? 'active' : ''}" data-material-type="all" type="button">Todos</button>${quickTypes.map(t => `<button class="${state.materialType === t ? 'active' : ''}" data-material-type="${esc(t)}" type="button">${esc(t)} <small>${typeCounts[t] || 0}</small></button>`).join('')}</div></div><div class="material-suggestions"><span>Ramos frecuentes</span><div class="quick-chip-row"><button class="${state.materialCourse === 'all' ? 'active' : ''}" data-material-course="all" type="button">Todos</button>${quickCourses.map(c => `<button class="${state.materialCourse === c.label ? 'active' : ''}" data-material-course="${esc(c.label)}" type="button">${esc(c.label)} <small>${c.count}</small></button>`).join('')}</div></div></div><div class="row-between material-count"><h2 class="card-title">Mostrando ${visible.length} de ${items.length} recursos</h2><span class="pill gray">Orden: recientes</span></div><div class="card table-card"><table class="data-table"><thead><tr><th>Recurso</th><th>Ramo</th><th>Sem.</th><th>Año</th><th>Estado</th><th></th></tr></thead><tbody>${visible.map(r => `<tr class="clickable" data-resource-row="${esc(r.id)}"><td><div class="resource-cell"><span class="icon-box sm ${resourceFormatClass(r.format)}">${icon('file')}</span><div><strong>${esc(r.title)}</strong><br><span class="small muted">${esc(r.type)} - ${esc(r.format)}</span></div></div></td><td>${esc(r.courseName)}<br><span class="small muted">${esc(r.courseCode)}</span></td><td>${esc(r.semester)}</td><td>${esc(r.year)}</td><td>${badge(r.status)}</td><td>${icon('more')}</td></tr>`).join('')}</tbody></table></div><div class="mobile-card-list">${visible.map(resourceCard).join('') || (noDataYet ? skeletonList(3) : renderEmptyMaterial())}</div>${showMore}</section><aside class="card pad course-detail-panel">${selected ? renderResourceDetail(selected) : (noDataYet ? skeletonList(1) : renderEmptyMaterial())}</aside></div>`;
  }
  function resourceCard(r) { return `<a class="item-card" href="#/material/${r.id}"><div class="row-between"><span class="icon-box ${resourceFormatClass(r.format)}">${icon('file')}</span>${badge(r.status)}</div><h3>${esc(r.title)}</h3><p>${esc(r.courseName)} - ${esc(r.format)} - ${esc(r.size)}</p></a>`; }
  function renderResourcePreview(r) {
    if (QA_MODE) {
      return `<section class="resource-preview-shell resource-preview-empty"><div><span class="kicker">Vista previa</span><h2 class="card-title">Previsualización omitida</h2><p class="small muted">La revisión automática usa los datos del recurso sin cargar servicios externos.</p></div></section>`;
    }
    const previewUrl = drivePreviewUrl(r);
    if (!previewUrl) {
      return `<section class="resource-preview-shell resource-preview-empty"><div><span class="kicker">Vista previa</span><h2 class="card-title">Previsualización no disponible</h2><p class="small muted">Este recurso no tiene enlace embebible. Usa el botón de apertura para revisar el archivo completo.</p></div></section>`;
    }
    const previewExternalUrl = safeUrl(r.externalUrl);
    const openInDriveLink = previewExternalUrl ? `<a class="btn secondary sm" href="${esc(previewExternalUrl)}" target="_blank" rel="noopener">${icon('arrow')} Abrir en Drive</a>` : '';
    return `<section class="resource-preview-shell"><div class="resource-preview-head"><div><span class="kicker">Vista previa</span><h2 class="card-title">${esc(r.title)}</h2></div>${openInDriveLink}</div><iframe class="resource-preview-frame" src="${esc(previewUrl)}" title="Vista previa de ${esc(r.title)}" loading="lazy" allow="autoplay"></iframe></section>`;
  }
  function renderResourceDetail(r, options = {}) {
    const detailExternalUrl = safeUrl(r.externalUrl);
    const openAction = detailExternalUrl
      ? `<a class="btn primary" href="${esc(detailExternalUrl)}" target="_blank" rel="noopener">${icon('download')} Abrir material</a>`
      : `<button class="btn primary" data-download-resource="${esc(r.id)}">${icon('download')} Descargar</button>`;
    const actions = isGuest()
      ? `${openAction}<a class="btn ghost" href="#/ramo/${findCoursePlanForCode(r.courseCode)}/${encodeURIComponent(r.courseCode)}">Ver ramo ${icon('arrow')}</a>`
      : `<button class="btn secondary" data-save-resource="${esc(r.id)}">${icon('bookmark')} Guardar</button>${openAction}<button class="btn danger-lite" data-report-resource="${esc(r.id)}">${icon('x')} Reportar error</button><a class="btn ghost" href="#/ramo/${findCoursePlanForCode(r.courseCode)}/${encodeURIComponent(r.courseCode)}">Ver ramo ${icon('arrow')}</a>`;
    const closeControl = options.hideClose ? '' : `<button class="icon-btn" data-clear-panel>${icon('x')}</button>`;
    return `<div class="row-between"><div><span class="kicker">Recurso seleccionado</span><h2 class="card-title">${esc(r.title)}</h2></div>${closeControl}</div><div class="hstack" style="flex-wrap:wrap">${badge(r.status)}<span class="pill blue">${esc(r.format)}</span><span class="pill gray">${esc(r.size)}</span></div><p class="small muted" style="line-height:1.55;margin-top:14px">${esc(r.description)}</p><div class="detail-block resource-meta-block"><div class="detail-row"><span>Ramo</span><strong>${esc(r.courseName)}</strong></div><div class="detail-row"><span>Código</span><strong>${esc(r.courseCode)}</strong></div><div class="detail-row"><span>Semestre</span><strong>${esc(r.semester)}</strong></div><div class="detail-row"><span>Año</span><strong>${esc(r.year)}</strong></div><div class="detail-row"><span>Origen</span><strong>${esc(r.origin)}</strong></div><div class="detail-row"><span>Subido por</span><strong>${esc(r.uploadedBy)}</strong></div></div><div class="vstack">${actions}</div>`;
  }
  function renderEmptyMaterial() { return `<div class="empty-state"><span class="icon-wrap">${icon('book')}</span><h3>Sin recursos visibles</h3><p>Prueba limpiar filtros o subir material para revisión.</p></div>`; }
  function renderMaterialDetailPage(id) {
    const r = findResourceById(id);
    if (!r && !dataReady) return renderLoading('Material', 'Abriendo el recurso…');
    if (!r) return renderNotFound('No encontramos el recurso solicitado.');
    const rPlan = Curricula[r.plan] ? r.plan : findCoursePlanForCode(r.courseCode);
    return `${pageHead('Detalle de recurso', `${r.courseName} - ${r.type}`, `<a class="btn secondary" href="#/material">Volver</a>`)}<div class="split wide resource-detail-layout"><section class="card pad resource-detail-main">${renderResourcePreview(r)}${renderResourceDetail(r, { hideClose: true })}</section><aside class="card pad"><h2 class="card-title">Ramo relacionado</h2>${findCourse(rPlan, r.courseCode) ? courseCard(rPlan, findCourse(rPlan, r.courseCode)) : '<p class="small muted">Recurso sin ramo asociado en malla.</p>'}</aside></div>`;
  }
  function renderUploadMaterial() {
    if (isGuest()) return `${pageHead('Subir material', 'Modo invitado en solo lectura', `<a class="btn secondary" href="#/material">Volver</a>`)}<section class="card pad empty-state"><span class="icon-wrap">${icon('eye')}</span><h3>Vista sin registros</h3><p>El modo invitado permite revisar contenido sin guardar actividad ni enviar aportes.</p><a class="btn primary" href="#/material">Volver a material</a></section>`;
    return `${pageHead('Subir material', 'Comparte un recurso para revisión CEAL', `<a class="btn secondary" href="#/material">Volver</a>`)}<div class="split"><form class="card pad form" data-form="upload-material"><div class="form-field"><label id="f-upload-type-label">Tipo de recurso</label><div class="segmented" role="group" aria-labelledby="f-upload-type-label">${['Apunte','Guía','Prueba','PPT','PDF','Resumen','Otro'].map((t, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-select-segment="type">${t}</button>`).join('')}</div><input type="hidden" name="type" value="Apunte" /></div><div class="form-grid"><div class="form-field"><label for="f-upload-title">Título</label><input id="f-upload-title" class="input" name="title" required minlength="6" /></div><div class="form-field"><label for="f-upload-course">Ramo</label><input id="f-upload-course" class="input" name="course" required /></div></div><div class="form-grid"><div class="form-field"><label for="f-upload-plan">Plan</label><select id="f-upload-plan" class="select" name="plan"><option value="planP">Plan P</option><option value="planO">Plan O</option><option value="both">Ambos</option></select></div><div class="form-field"><label for="f-upload-year">Año</label><select id="f-upload-year" class="select" name="year"><option>2026</option><option>2025</option><option>2024</option><option>2023</option></select></div></div><div class="form-field"><label for="f-upload-description">Descripción</label><textarea id="f-upload-description" class="textarea" name="description" required minlength="20"></textarea></div><div class="form-field"><label for="f-upload-file">Archivo</label><label class="upload-zone">${icon('upload')}<strong>Seleccionar archivo</strong><span class="help">PDF, DOCX, PPTX, PNG, JPG o ZIP</span><input id="f-upload-file" class="sr-only" type="file" name="file" accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.zip" /></label></div><div class="form-field"><label for="f-upload-origin">Fuente u origen</label><input id="f-upload-origin" class="input" name="origin" required /></div><label class="checkbox-row"><input type="checkbox" name="permission" required /> Confirmo que el recurso puede compartirse como apoyo académico.</label><div class="hstack"><button class="btn primary" type="submit">Enviar a revisión</button></div></form><aside class="card pad"><h2 class="card-title">Proceso</h2>${timeline([{ title:'Enviado', detail:'Recibimos el aporte.', at:new Date() }, { title:'Revisión CEAL', detail:'Se revisa formato y ramo asociado.', at:new Date() }, { title:'Publicado u observado', detail:'Queda disponible o con observaciones.', at:new Date() }])}</aside></div>`;
  }

  function renderMallas() {
    const plan = state.mallaEmbedPlan === 'o' ? 'o' : 'p';
    const dark = state.portalDark;
    const planKey = plan === 'o' ? 'planO' : 'planP';
    const planLabelText = plan === 'o' ? 'Plan O - Catálogo 2016' : 'Plan P - Catálogo 2025';
    const accountLabel = 'Mi cuenta';
    const originalUrl = `${MALLA_BASE_URL}malla-${plan}.html`;
    const mallaTotalCourses = getCourses(planKey).length;
    const mallaProgressMarkup = mallaTotalCourses ? `<span class="malla-progress-label">${mallaTotalCourses} ramos</span>` : '';
    return `<section class="malla-workspace ${dark ? 'is-dark' : 'is-light'}" aria-label="Malla curricular embebida">
        <header class="malla-commandbar">
          <a class="malla-commandbar-title" href="#/" aria-label="Volver al inicio del portal">
            <span class="malla-mini-mark">${icon('grid')}</span>
            <span>
              <strong>Mallas</strong>
              <small>${esc(planLabelText)}</small>
            </span>
          </a>
          ${mallaProgressMarkup}
          <div class="malla-commandbar-actions">
            <div class="segmented malla-plan-tabs" aria-label="Seleccionar plan curricular">
              <button class="${plan === 'o' ? 'active' : ''}" data-malla-embed-plan="o">Plan O</button>
              <button class="${plan === 'p' ? 'active' : ''}" data-malla-embed-plan="p">Plan P</button>
            </div>
            ${themeToggleButton(`malla-tool-btn ${dark ? 'active' : ''}`, 'data-malla-embed-theme')}
            <a class="malla-tool-btn" href="#/perfil">${icon('user')}<span>${accountLabel}</span></a>
            <a class="malla-tool-btn subtle" href="${originalUrl}" target="_blank" rel="noopener">${icon('arrow')}<span>Original</span></a>
          </div>
        </header>
        <div class="malla-embed-frame-wrap" data-malla-frame-wrap>
          <div class="malla-embed-loading"><span class="icon-box">${icon('grid')}</span><strong>Cargando malla...</strong></div>
          <iframe class="malla-embed-frame" data-malla-frame data-plan="${plan}" data-theme="${dark ? 'dark' : 'light'}" title="Malla curricular ${plan === 'o' ? 'Plan O' : 'Plan P'}" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>
        </div>
      </section>`;
  }
  function mallaEmbedUrl(plan) { return `${MALLA_BASE_URL}malla-${plan === 'o' ? 'o' : 'p'}.html`; }
  async function getMallaEmbedHtml(plan) {
    const key = plan === 'o' ? 'o' : 'p';
    if (QA_MODE) throw new Error('local malla fallback');
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
    // La clave de carga depende SOLO del plan: el tema se conmuta en vivo
    // dentro del iframe (clase mc-light) sin recargarlo ni perder la posición.
    // El tema se lee AL RESOLVER el fetch (no al iniciarlo): si el usuario
    // alterna el tema mientras la malla externa aún descarga, el srcdoc debe
    // llegar con el tema vigente.
    const loadKey = plan;
    if (frame.dataset.loadKey === loadKey && frame.srcdoc) return;
    frame.dataset.loadKey = loadKey;
    const currentTheme = () => (state.portalDark ? 'dark' : 'light');
    wrap?.classList.remove('is-loaded', 'is-fallback');
    const markLoaded = () => wrap?.classList.add('is-loaded');
    frame.addEventListener('load', markLoaded, { once: true });
    try {
      const html = await getMallaEmbedHtml(plan);
      if (!app.contains(frame) || frame.dataset.loadKey !== loadKey) return;
      frame.srcdoc = buildMallaSrcdoc(html, plan, currentTheme());
    } catch {
      if (!app.contains(frame) || frame.dataset.loadKey !== loadKey) return;
      wrap?.classList.add('is-fallback');
      frame.srcdoc = buildLocalMallaSrcdoc(plan, currentTheme());
    }
  }
  function safeJsonForScript(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
  }
  function buildLocalMallaSrcdoc(plan, theme) {
    const data = plan === 'o' ? Curricula.planO : Curricula.planP;
    const planName = plan === 'o' ? 'Plan O Catálogo 2016' : 'Plan P Catálogo 2025';
    const subjects = [...(data.subjects || [])].sort((a, b) => a.semester - b.semester || (a.row || 0) - (b.row || 0) || titleCase(a.name).localeCompare(titleCase(b.name), 'es-CL'));
    const semesters = Array.from({ length: data.totalSemesters || Math.max(...subjects.map(c => c.semester), 1) }, (_, index) => index + 1);
    const columns = semesters.map(semester => {
      const cards = subjects.filter(course => course.semester === semester).map(course => {
        const area = esc(course.area || 'general');
        return `<article class="mc-card mc-area-${area}" data-mc-code="${esc(course.code)}" tabindex="0">
          <span class="mc-card__code">${esc(course.visibleCode || course.code)}</span>
          <strong class="mc-card__title">${esc(titleCase(course.name))}</strong>
          <span class="mc-card__meta">${esc(AreaStyle[course.area] || course.area || 'Asignatura')} · ${Number(course.sct || 0)} SCT</span>
        </article>`;
      }).join('');
      return `<section class="mc-semester"><h2>${semester} semestre</h2><div class="mc-semester__cards">${cards}</div></section>`;
    }).join('');
    const localStyles = `<style>
      ${mallaEmbedThemeStyles(theme, plan)}
      *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--mc-bg);color:var(--mc-text)}
      .mc-local-shell{min-height:100vh;padding:18px}
      .mc-header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin:0 0 16px}
      .mc-header h1{font-size:22px;line-height:1.15;margin:0;font-weight:800;letter-spacing:0}
      .mc-header__subtitle{margin:5px 0 0;color:var(--mc-muted);font-weight:700}
      .mc-header__meta{color:var(--mc-muted);font-size:13px;font-weight:700}
      .mc-grid{display:grid;grid-template-columns:repeat(${semesters.length},minmax(172px,1fr));gap:12px;min-width:max(100%,${semesters.length * 184}px)}
      .mc-semester{display:grid;gap:10px;align-content:start}
      .mc-semester h2{margin:0;padding:9px 10px;border-radius:10px;background:var(--mc-panel);border:1px solid var(--mc-border);font-size:13px;text-transform:uppercase;color:var(--mc-muted);letter-spacing:.04em}
      .mc-semester__cards{display:grid;gap:10px}
      .mc-card{display:grid;gap:6px;min-height:104px;padding:12px;border:1px solid var(--mc-border);border-radius:var(--mc-card-radius);background:var(--mc-card-bg);box-shadow:var(--mc-card-shadow);cursor:pointer}
      .mc-card__code{font-size:11px;font-weight:800;color:var(--mc-muted)}
      .mc-card__title{font-size:13px;line-height:1.25;color:var(--mc-text)}
      .mc-card__meta{font-size:11px;color:var(--mc-muted);line-height:1.25}
      .mc-area-basica{background:linear-gradient(180deg,var(--mc-area-basica-bg),var(--mc-card-bg))}
      .mc-area-ingenieria{background:linear-gradient(180deg,var(--mc-area-ingenieria-bg),var(--mc-card-bg))}
      .mc-area-aplicada{background:linear-gradient(180deg,var(--mc-area-aplicada-bg),var(--mc-card-bg))}
      .mc-area-general{background:linear-gradient(180deg,var(--mc-area-general-bg),var(--mc-card-bg))}
      .mc-area-proyecto{background:linear-gradient(180deg,var(--mc-area-proyecto-bg),var(--mc-card-bg))}
      .mc-area-electivo{background:linear-gradient(180deg,var(--mc-area-electivo-bg),var(--mc-card-bg))}
      @media(max-width:640px){.mc-local-shell{padding:12px}.mc-header{display:grid}.mc-grid{display:grid;grid-template-columns:1fr;min-width:0}.mc-semester{content-visibility:auto}.mc-semester h2{position:sticky;top:0;z-index:2}}
    </style>`;
    const subjectPayload = safeJsonForScript(subjects.map(course => ({ code: course.code, prereqs: course.prereqs || [] })));
    const localScript = `<script>
      (function(){
        document.documentElement.classList.toggle('mc-light', ${JSON.stringify(theme === 'light')});
        var subjects = ${subjectPayload};
        var byCode = Object.fromEntries(subjects.map(function(item){ return [item.code, item]; }));
        function dependents(code){ return subjects.filter(function(item){ return (item.prereqs || []).indexOf(code) >= 0; }).map(function(item){ return item.code; }); }
        function card(code){ return document.querySelector('.mc-card[data-mc-code="' + CSS.escape(code) + '"]'); }
        function clearHighlight(){ document.querySelectorAll('.mc-card--highlight-self,.mc-card--highlight-prereq,.mc-card--highlight-successor').forEach(function(el){ el.classList.remove('mc-card--highlight-self','mc-card--highlight-prereq','mc-card--highlight-successor'); }); }
        function highlightChain(code){
          clearHighlight();
          var current = card(code);
          if (current) current.classList.add('mc-card--highlight-self');
          ((byCode[code] && byCode[code].prereqs) || []).forEach(function(item){ var el = card(item); if (el) el.classList.add('mc-card--highlight-prereq'); });
          dependents(code).forEach(function(item){ var el = card(item); if (el) el.classList.add('mc-card--highlight-successor'); });
        }
        window.__MC = { clearHighlight: clearHighlight, highlightChain: highlightChain, getDirectPrereqs: function(code){ return (byCode[code] && byCode[code].prereqs) || []; }, getDirectDependents: dependents };
        document.addEventListener('click', function(event){ var item = event.target.closest('.mc-card[data-mc-code]'); if (item) highlightChain(item.dataset.mcCode); });
        document.addEventListener('keydown', function(event){
          if (event.key !== 'Enter' && event.key !== ' ') return;
          var item = event.target.closest && event.target.closest('.mc-card[data-mc-code]');
          if (!item) return;
          event.preventDefault();
          highlightChain(item.dataset.mcCode);
        });
      })();
    <\/script>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(planName)}</title>${mallaMaterialPayload(plan)}${localStyles}</head><body><main class="mc-local-shell"><header class="mc-header"><div><h1>Malla curricular</h1><p class="mc-header__subtitle">${esc(planName)}</p></div><span class="mc-header__meta">${subjects.length} ramos · ${semesters.length} semestres</span></header><section class="mc-grid">${columns}</section></main>${localScript}${mallaEmbedGuidanceScript()}</body></html>`;
  }
  function mallaMaterialPayload(plan) {
    const planKey = plan === 'o' ? 'planO' : 'planP';
    const payload = {};
    for (const course of getCourses(planKey)) {
      const entry = { n: getResourcesForCourse(planKey, course.code).length, name: titleCase(course.name), code: course.visibleCode || course.code };
      payload[course.code] = entry;
      if (course.visibleCode && course.visibleCode !== course.code) payload[course.visibleCode] = entry;
    }
    return `<script>window.__MC_MATERIAL = ${safeJsonForScript(payload)};<\/script>`;
  }
  function buildMallaSrcdoc(html, plan, theme) {
    const bootstrap = `<base href="${MALLA_BASE_URL}"><script>try{localStorage.setItem('mc-theme','${theme}');}catch(e){}document.documentElement.classList.toggle('mc-light','${theme}'==='light');<\/script>${mallaMaterialPayload(plan)}`;
    const styles = `<style>${mallaEmbedThemeStyles(theme, plan)}</style>`;
    const guidance = mallaEmbedGuidanceScript();
    return html
      .replace(/<head>/i, `<head>${bootstrap}`)
      .replace(/<\/head>/i, `${styles}</head>`)
      .replace(/<\/body>/i, `${guidance}</body>`);
  }
  function mallaEmbedThemeStyles(theme, plan) {
    // Estilos DUALES: claro y oscuro conviven seleccionados por la clase
    // `mc-light` del <html> del iframe. Así el toggle de tema del portal cambia
    // la malla en vivo (sin recargar el iframe ni perder scroll/selección).
    const planAccent = plan === 'o' ? '#126fe3' : '#0891b2';
    return `
      :root {
        --mc-card-radius: 8px;
        --mc-transition-fast: 140ms cubic-bezier(0.4,0,0.2,1);
        --mc-transition-normal: 190ms cubic-bezier(0.4,0,0.2,1);
        --mc-transition-slide: 220ms cubic-bezier(0,0,0.2,1);
        --mc-font-card-name: .72rem;
      }
      html:not(.mc-light) {
        color-scheme: dark;
        --mc-bg-base:#061b34; --mc-bg-surface:#092747; --mc-bg-elevated:#123a64; --mc-bg-hover:#174b7d;
        --mc-text-primary:#f8fafc; --mc-text-secondary:#d7e2ee; --mc-text-muted:#8fa6c1;
        --mc-area-basica:#60a5fa; --mc-area-basica-bg:rgba(96,165,250,.16);
        --mc-area-ingenieria:#a78bfa; --mc-area-ingenieria-bg:rgba(167,139,250,.16);
        --mc-area-aplicada:#fb923c; --mc-area-aplicada-bg:rgba(251,146,60,.16);
        --mc-area-general:#22c55e; --mc-area-general-bg:rgba(34,197,94,.15);
        --mc-area-proyecto:#22d3ee; --mc-area-proyecto-bg:rgba(34,211,238,.14);
        --mc-area-electivo:#cbd5e1; --mc-area-electivo-bg:rgba(203,213,225,.14);
        --mc-line:rgba(215,226,238,.12); --mc-line-strong:rgba(215,226,238,.14);
        --mc-panel-bg:rgba(9,39,71,.94); --mc-header-bg:rgba(9,39,71,.92);
        --mc-body-bg:linear-gradient(180deg,#061b34 0%,#08213f 100%);
        --mc-header-shadow:rgba(0,0,0,.18); --mc-card-glow:rgba(0,0,0,.12);
        --mc-scrollbar:#28547f; --mc-hint-line:rgba(215,226,238,.12);
        --mc-bg:#061b34; --mc-text:#f8fafc; --mc-muted:#8fa6c1;
        --mc-panel:#092747; --mc-border:rgba(215,226,238,.14);
        --mc-card-bg:#0b2c50; --mc-card-shadow:0 1px 2px rgba(0,0,0,.2), 0 10px 22px rgba(0,0,0,.14);
      }
      html.mc-light {
        color-scheme: light;
        --mc-bg-base:#f5f8fc; --mc-bg-surface:#ffffff; --mc-bg-elevated:#edf4fb; --mc-bg-hover:#e8f2ff;
        --mc-text-primary:#041f3d; --mc-text-secondary:#334155; --mc-text-muted:#64748b;
        --mc-area-basica:#126fe3; --mc-area-basica-bg:rgba(18,111,227,.10);
        --mc-area-ingenieria:#7c3aed; --mc-area-ingenieria-bg:rgba(124,58,237,.10);
        --mc-area-aplicada:#f97316; --mc-area-aplicada-bg:rgba(249,115,22,.12);
        --mc-area-general:#16a34a; --mc-area-general-bg:rgba(22,163,74,.10);
        --mc-area-proyecto:#0891b2; --mc-area-proyecto-bg:rgba(8,145,178,.11);
        --mc-area-electivo:#475569; --mc-area-electivo-bg:rgba(71,85,105,.10);
        --mc-line:rgba(191,208,227,.82); --mc-line-strong:rgba(191,208,227,.82);
        --mc-panel-bg:rgba(255,255,255,.96); --mc-header-bg:rgba(255,255,255,.92);
        --mc-body-bg:linear-gradient(180deg,#f8fbff 0%,#edf4fb 100%);
        --mc-header-shadow:rgba(15,23,42,.06); --mc-card-glow:rgba(15,23,42,.05);
        --mc-scrollbar:#bfd0e3; --mc-hint-line:rgba(191,208,227,.7);
        --mc-bg:#f5f8fc; --mc-text:#041f3d; --mc-muted:#64748b;
        --mc-panel:#ffffff; --mc-border:rgba(191,208,227,.82);
        --mc-card-bg:#ffffff; --mc-card-shadow:0 1px 2px rgba(15,23,42,.05), 0 10px 22px rgba(15,23,42,.05);
      }
      body {
        min-height: 100vh;
        background: var(--mc-body-bg) !important;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        transition: background 220ms ease;
      }
      .mc-header {
        background: var(--mc-header-bg) !important;
        border-bottom-color: var(--mc-line) !important;
        box-shadow: 0 10px 30px var(--mc-header-shadow) !important;
      }
      .mc-header__title h1 { color: var(--mc-text-primary); letter-spacing:0 !important; }
      .mc-header__subtitle { color: var(--mc-text-secondary); }
      .mc-header__hint { color: var(--mc-text-muted); border-color: var(--mc-hint-line); }
      .mc-theme-toggle { display:none !important; }
      .mc-card {
        border-radius: 8px !important;
        border-color: var(--mc-line) !important;
        border-left-width: 1px !important;
        box-shadow: 0 1px 2px rgba(15,23,42,.05), 0 10px 22px var(--mc-card-glow) !important;
      }
      .mc-card:hover { transform: translateY(-1px); }
      .mc-card--highlight-self { box-shadow:0 0 0 2px ${planAccent},0 0 0 5px rgba(249,115,22,.28),0 16px 38px rgba(15,23,42,.18) !important; }
      .mc-footer,
      .mc-zoom-controls,
      .mc-search__inner,
      .mc-tooltip,
      .mc-modal {
        background: var(--mc-panel-bg) !important;
        border-color: var(--mc-line-strong) !important;
      }
      .mc-zoom-btn,
      .mc-search__close,
      .mc-modal__close {
        border-radius: 8px !important;
      }
      .mc-grid::-webkit-scrollbar-thumb { background: var(--mc-scrollbar); }
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
        border: 1px solid var(--mc-line-strong);
        border-radius: 999px;
        background: var(--mc-panel-bg);
        color: var(--mc-text-secondary);
        box-shadow: 0 10px 30px var(--mc-header-shadow);
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
      .mc-portal-action {
        position: fixed; left: 50%; bottom: 14px; z-index: 380;
        transform: translate(-50%, 14px);
        display: flex; align-items: center; gap: 10px;
        max-width: calc(100vw - 20px);
        padding: 7px 7px 7px 14px;
        border: 1px solid var(--mc-line-strong);
        border-radius: 999px;
        background: var(--mc-panel-bg);
        box-shadow: 0 14px 40px var(--mc-header-shadow);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        opacity: 0; pointer-events: none;
        transition: opacity 160ms ease, transform 200ms cubic-bezier(0,0,.2,1);
      }
      .mc-portal-action.is-visible { opacity: 1; pointer-events: auto; transform: translate(-50%, 0); }
      .mc-portal-action__name {
        font-weight: 800; font-size: .78rem; color: var(--mc-text-primary);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 44vw;
      }
      .mc-portal-action__btn {
        border: 0; cursor: pointer; white-space: nowrap;
        min-height: 36px; padding: 0 14px; border-radius: 999px;
        background: linear-gradient(135deg, #2069e0, #0b7a9c);
        color: #fff; font-weight: 700; font-size: .8rem;
        font-family: inherit; line-height: 1;
      }
      .mc-portal-action__btn.is-ghost {
        background: transparent;
        color: var(--mc-text-secondary);
        border: 1px solid var(--mc-line-strong);
      }
      .mc-portal-modal-cta { margin: 14px 0 4px; display: flex; }
      .mc-portal-modal-cta .mc-portal-action__btn { width: 100%; min-height: 42px; font-size: .88rem; }
      @media (max-width: 640px) {
        .mc-header { height: 52px; padding: 0 10px; }
        .mc-grid { min-height: calc(100vh - 52px); padding: 8px 8px 74px !important; }
        .mc-footer { padding-bottom: 12px; }
        .mc-portal-action { bottom: 12px; }
        .mc-portal-scroll-hint--bottom { bottom: 78px; }
      }
      @media (min-width: 641px) {
        .mc-portal-scroll-hint { display:none !important; }
      }
    `;
  }
  function mallaEmbedGuidanceScript() {
    return `<script>
      (function() {
        window.addEventListener('message', function(event) {
          var data = event.data;
          if (event.source !== window.parent || !data || data.__mcPortalTheme !== true) return;
          var dark = data.theme === 'dark';
          document.documentElement.classList.toggle('mc-light', !dark);
          try { localStorage.setItem('mc-theme', dark ? 'dark' : 'light'); } catch (err) {}
        });
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
        var MAT = window.__MC_MATERIAL || {};
        var actionBar = null;
        function ensureActionBar() {
          if (actionBar) return actionBar;
          actionBar = document.createElement('div');
          actionBar.className = 'mc-portal-action';
          actionBar.innerHTML = '<span class="mc-portal-action__name"></span><button type="button" class="mc-portal-action__btn"></button>';
          actionBar.querySelector('.mc-portal-action__btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var code = actionBar.dataset.code;
            if (!code) return;
            var type = actionBar.dataset.kind === 'material' ? 'open-material' : 'open-course';
            try { window.parent.postMessage({ __mcPortal: true, type: type, code: code }, '*'); } catch (err) {}
          });
          document.body.appendChild(actionBar);
          return actionBar;
        }
        function updateActionBar() {
          var bar = ensureActionBar();
          var code = activeCode;
          if (!code || isModalOpen()) { bar.classList.remove('is-visible'); bar.dataset.code = ''; return; }
          var entry = MAT[code];
          var cardEl = cardByCode(code);
          var name = (entry && entry.name) || (cardEl ? ((cardEl.querySelector('.mc-card__title') || cardEl).textContent || '').trim().slice(0, 60) : code);
          var hasMaterial = Boolean(entry && entry.n > 0);
          bar.dataset.code = code;
          bar.dataset.kind = hasMaterial ? 'material' : 'course';
          bar.querySelector('.mc-portal-action__name').textContent = name;
          var btn = bar.querySelector('.mc-portal-action__btn');
          btn.textContent = hasMaterial ? 'Ver material · ' + entry.n : 'Ficha del ramo';
          btn.classList.toggle('is-ghost', !hasMaterial);
          bar.classList.add('is-visible');
        }
        // La malla original abre su propio modal al tocar un ramo: ahí dentro
        // se inyecta el CTA de material (la barra flotante queda para el
        // fallback local, que no tiene modal).
        // La malla original rellena la ficha con una descripción de plantilla
        // ("Asignatura del Plan…"): si es esa, se elimina la sección completa
        // (título "Descripción" + divisor + párrafo). Las reales se conservan.
        function stripGenericModalDescription(overlay) {
          var desc = overlay.querySelector('.mc-modal__description');
          if (!desc) return;
          var text = (desc.textContent || '').trim();
          if (!/^Asignatura del Plan|Revisa esta tarjeta/i.test(text)) return;
          var title = desc.previousElementSibling;
          var divider = title && title.previousElementSibling;
          if (title && /mc-modal__section-title/.test(title.className || '')) title.remove();
          if (divider && divider.tagName === 'HR') divider.remove();
          desc.remove();
        }
        function injectModalCta() {
          var overlay = document.getElementById('mc-modal-overlay');
          if (!overlay || !overlay.classList.contains('mc-modal-overlay--visible')) return;
          stripGenericModalDescription(overlay);
          var code = activeCode;
          if (!code) return;
          var host = overlay.querySelector('.mc-modal__content') || overlay.querySelector('.mc-modal') || overlay.firstElementChild;
          if (!host) return;
          var entry = MAT[code];
          var hasMaterial = Boolean(entry && entry.n > 0);
          var cta = overlay.querySelector('.mc-portal-modal-cta');
          if (!cta) {
            cta = document.createElement('div');
            cta.className = 'mc-portal-modal-cta';
            cta.innerHTML = '<button type="button" class="mc-portal-action__btn"></button>';
            cta.querySelector('button').addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              if (!cta.dataset.code) return;
              var type = cta.dataset.kind === 'material' ? 'open-material' : 'open-course';
              try { window.parent.postMessage({ __mcPortal: true, type: type, code: cta.dataset.code }, '*'); } catch (err) {}
            });
            // Bajo el título y los chips del ramo: visible sin scrollear el modal.
            var anchor = host.querySelector('.mc-modal__badges');
            if (anchor && anchor.parentNode === host) host.insertBefore(cta, anchor.nextSibling);
            else host.insertBefore(cta, host.firstChild);
          }
          cta.dataset.code = code;
          cta.dataset.kind = hasMaterial ? 'material' : 'course';
          var btn = cta.querySelector('button');
          btn.textContent = hasMaterial ? 'Ver material del ramo · ' + entry.n : 'Ver ficha en el portal';
          btn.classList.toggle('is-ghost', !hasMaterial);
        }
        var modalObserved = false;
        function observeModal() {
          var overlay = document.getElementById('mc-modal-overlay');
          if (!overlay || modalObserved || typeof MutationObserver === 'undefined') return;
          modalObserved = true;
          new MutationObserver(function() { injectModalCta(); updateActionBar(); }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
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
          if (e.target.closest?.('.mc-portal-action') || e.target.closest?.('.mc-portal-modal-cta')) return;
          var card = e.target.closest?.('.mc-card[data-mc-code]');
          if (card) activeCode = card.dataset.mcCode;
          else if (!e.target.closest?.('.mc-portal-scroll-hint') && !e.target.closest?.('.mc-peek')) activeCode = null;
          setTimeout(function() { updateHints(); updateActionBar(); observeModal(); injectModalCta(); }, 90);
          setTimeout(injectModalCta, 380);
        }, true);
        document.addEventListener('keydown', function(e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          var card = e.target.closest && e.target.closest('.mc-card[data-mc-code]');
          if (!card) return;
          activeCode = card.dataset.mcCode;
          setTimeout(function() { updateHints(); updateActionBar(); }, 90);
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
          setTimeout(function() { updateHints(); updateActionBar(); }, 120);
        }, { passive: true });
        window.addEventListener('scroll', updateHints, { passive: true });
        var grid = document.getElementById('mc-grid');
        if (grid) grid.addEventListener('scroll', updateHints, { passive: true });
        if (mq.addEventListener) mq.addEventListener('change', updateHints);
        else if (mq.addListener) mq.addListener(updateHints);
        setTimeout(function() { updateHints(); updateActionBar(); observeModal(); }, 400);
      })();
    <\/script>`;
  }
  function courseCard(plan, c, selected = null, selectedCodes = new Set()) {
    const isSelected = selected?.code === c.code;
    const dimmed = selected && !selectedCodes.has(c.code);
    const prereq = selected && (selected.prereqs || []).includes(c.code);
    const successor = selected && (c.prereqs || []).includes(selected.code);
    return `<button class="course-card ${isSelected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''} ${prereq ? 'prereq' : ''} ${successor ? 'successor' : ''}" data-course="${esc(c.code)}" data-course-plan="${plan}"><span class="course-code">${esc(c.visibleCode || c.code)}</span><strong class="course-title">${esc(titleCase(c.name))}</strong><span class="course-meta"><span class="sct">${c.sct || 0} SCT</span></span></button>`;
  }
  function renderCourseDetail(course, plan, inline = false) {
    const prereqs = getPrereqs(plan, course);
    const successors = getSuccessors(plan, course.code);
    const resources = getResourcesForCourse(plan, course.code);
    const materialBlock = resources.length
      ? `<div class="detail-block course-material-block"><div class="row-between"><h3 class="card-title">Material del ramo</h3><span class="pill blue">${resources.length}</span></div>${resources.slice(0,4).map(r => `<a class="link-card-row" href="#/material/${r.id}"><span><strong>${esc(r.title)}</strong><span>${esc(r.type)} - ${esc(r.format)}</span></span>${icon('arrow')}</a>`).join('')}${resources.length > 4 ? `<a class="link" href="#/material?course=${encodeURIComponent(course.code)}">Ver todos ${icon('arrow')}</a>` : ''}</div>`
      : (plan === 'planP' ? `<div class="material-plan-note compact">${icon('grid')}<span>Material Plan P en carga progresiva. Revisa la biblioteca por nombre del ramo si existe continuidad con Plan O.</span></div>` : '');
    const materialAction = resources.length ? `<a class="btn primary" href="#/material?course=${encodeURIComponent(course.code)}">Ver material</a>` : '';
    return `<div class="course-detail-head"><div><span class="kicker">${esc(course.visibleCode || course.code)}</span><h2 class="card-title">${esc(titleCase(course.name))}</h2></div>${inline ? `<button class="icon-btn" aria-label="Cerrar detalle" title="Cerrar detalle" data-clear-panel>${icon('x')}</button>` : ''}</div><div class="hstack" style="flex-wrap:wrap"><span class="pill blue">${course.semester} semestre</span><span class="pill gray">${course.sct || 0} SCT</span>${resources.length ? `<span class="pill green">${resources.length} recursos</span>` : ''}</div>${courseDescription(course, plan) ? `<p class="small muted" style="line-height:1.6">${esc(courseDescription(course, plan))}</p>` : ''}<div class="detail-block"><div class="detail-row"><span>Plan</span><strong>${planShort(plan)}</strong></div><div class="detail-row"><span>Área</span><strong>${esc(AreaStyle[course.area] || course.area)}</strong></div><div class="detail-row"><span>Tipo</span><strong>${esc(course.type || 'Asignatura curricular')}</strong></div></div><div class="grid two"><section><h3 class="card-title">Prerrequisitos</h3>${prereqs.map(p => miniCourse(plan, p)).join('') || '<p class="small muted">Sin prerrequisitos.</p>'}</section><section><h3 class="card-title">Ramos que abre</h3>${successors.slice(0,4).map(s => miniCourse(plan, s)).join('') || '<p class="small muted">No abre ramos directos.</p>'}</section></div>${materialBlock}<div class="hstack">${materialAction}<button class="btn secondary" data-save-course="${courseKey(plan, course.code)}">Guardar ramo</button></div>`;
  }
  function miniCourse(plan, c) { return `<a class="link-card-row" href="#/ramo/${plan}/${encodeURIComponent(c.code)}"><span><strong>${esc(titleCase(c.name))}</strong><span>${esc(c.visibleCode || c.code)}</span></span>${icon('arrow')}</a>`; }
  function renderCourseDetailPage(plan, code) { const c = findCourse(plan, code); if (!c) return renderNotFound('No encontramos el ramo.'); const resources = getResourcesForCourse(plan, c.code); const side = resources.length ? `<aside class="card pad"><div class="row-between"><h2 class="card-title">Material disponible</h2><span class="pill blue">${resources.length}</span></div>${resources.slice(0,6).map(r => resourceCard(r)).join('')}<a class="btn secondary full" href="#/material?course=${encodeURIComponent(c.code)}">Abrir biblioteca filtrada</a></aside>` : `<aside class="card pad"><h2 class="card-title">Conexiones</h2><p class="small muted">Revisa prerrequisitos, ramos posteriores y avance desde la ficha del ramo.</p></aside>`; return `${pageHead(titleCase(c.name), `${planLabel(plan)} - ${c.visibleCode || c.code}`, `<a class="btn secondary" href="#/mallas">Volver a malla</a>`)}<div class="split wide"><section class="card pad">${renderCourseDetail(c, plan, false)}</section>${side}</div>`; }

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

  function surveyStatus(survey) {
    const value = String(survey?.status || 'draft');
    if (value === 'open') return ['Abierta', 'green'];
    if (value === 'closed') return ['Cerrada', 'gray'];
    return ['Borrador', 'blue'];
  }
  function surveyBadge(survey) {
    const [label, tone] = surveyStatus(survey);
    return `<span class="status-chip ${tone}">${label}</span>`;
  }
  function surveyModeLabel(mode) {
    return plain(mode).includes('votacion') ? 'Votación' : 'Encuesta';
  }
  function surveyCard(survey) {
    const count = Number(survey.responseCount || survey.responses?.length || 0);
    const card = `<a class="item-card survey-card" href="#/encuestas/${esc(survey.id)}"><div class="row-between"><span class="pill blue">${surveyModeLabel(survey.mode)}</span>${surveyBadge(survey)}</div><h3>${esc(survey.title)}</h3><p>${esc(survey.description || 'Consulta preparada por CEAL.')}</p><div class="survey-meta-row"><span>${icon('users')} ${esc(survey.audience || CEAL_ASSISTANT_AUDIENCE)}</span><span>${icon('check')} ${count} respuestas</span><span>${survey.secret !== false ? `${icon('eye')} voto secreto` : `${icon('eye')} identificada`}</span></div></a>`;
    if (!hasCealAccess()) return card;
    return `<div class="survey-card-wrap">${card}<button class="survey-card-del" type="button" data-survey-delete="${esc(survey.id)}" data-survey-title="${esc(survey.title || 'esta consulta')}" aria-label="Eliminar consulta">${icon('x')}</button></div>`;
  }
  function renderSurveys() {
    const surveys = [...(Data.surveys || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const isCeal = hasCealAccess();
    const open = surveys.filter(s => s.status === 'open');
    // CEAL ve cerradas + borradores en "Historial"; estudiantes/jefatura solo cerradas reales.
    const past = surveys.filter(s => isCeal ? s.status !== 'open' : s.status === 'closed');
    const cealAction = isCeal ? `<a class="btn primary" href="#/encuestas/nueva">${icon('check')} Crear encuesta o votación</a>` : '';
    const heroTitle = isCeal ? 'Consultas listas para aplicar' : 'Consultas abiertas para ti';
    const heroDesc = isCeal
      ? 'Convierte una instrucción en encuesta o votación, ábrela a estudiantes de Ingeniería Civil UCN y exporta los resultados en XLSX.'
      : 'Participa en las consultas del CEIC. Tu voto es secreto y los resultados se informan de forma agregada.';
    return `${pageHead('Encuestas y votaciones', isCeal ? 'Consultas internas con voto secreto y exportación a Excel' : 'Consultas del CEIC con voto secreto', cealAction)}
      <section class="card pad survey-hero"><div><span class="kicker">Participación estudiantil</span><h2 class="card-title">${heroTitle}</h2><p class="muted">${heroDesc}</p><p class="privacy-note">${icon('eye')} Las respuestas se informan como resultados agregados. No se publica quién votó qué; el acceso queda validado por CEAL/Jefatura.</p></div><div class="stat-grid compact">${stat('check', open.length, 'Activas', 'Abiertas')}${stat('file', surveys.length, 'Consultas', 'Totales')}${stat('eye', surveys.filter(s => s.secret !== false).length, 'Secretas', 'Voto anónimo')}</div></section>
      <div class="grid two" style="margin-top:18px"><section class="card pad"><div class="row-between"><h2 class="card-title">Activas</h2><span class="pill blue">${open.length}</span></div><div class="card-list">${open.map(surveyCard).join('') || renderEmpty('Sin consultas abiertas', isCeal ? 'Cuando abras una encuesta o votación aparecerá aquí.' : 'Cuando el CEIC abra una consulta aparecerá aquí.')}</div></section><section class="card pad"><div class="row-between"><h2 class="card-title">${isCeal ? 'Historial' : 'Cerradas'}</h2><span class="pill gray">${past.length}</span></div><div class="card-list">${past.map(surveyCard).join('') || renderEmpty('Sin consultas cerradas', 'Las consultas finalizadas se listarán aquí.')}</div></section></div>`;
  }
  function renderSurveyBuilder() {
    const req = state.surveyBuilderRequest || {};
    const result = state.surveyBuilderResult?.survey || null;
    const endpointReady = Boolean(AI_ENDPOINT || API_BASE);
    const sessionReady = Boolean(state.user?.sessionToken);
    const ready = endpointReady && sessionReady;
    const status = !endpointReady
      ? `<div class="google-auth-note"><strong>Asistente no disponible</strong><span>La creación asistida se activará cuando el servicio institucional esté listo.</span></div>`
      : !sessionReady
        ? `<div class="google-auth-note"><strong>Vuelve a iniciar sesión CEAL</strong><span>La generación necesita sesión interna para validar acceso.</span></div>`
        : '';
    const preview = result ? renderSurveyDraftEditor(result) : `<section class="card pad assistant-empty"><span class="icon-wrap">${icon('sparkles')}</span><h3>Sin encuesta generada</h3><p>Describe la consulta en lenguaje natural. El asistente propondrá preguntas, opciones, tipo de respuesta y formato.</p></section>`;
    return ensureCEAL(`${pageHead('Crear encuesta', 'De lenguaje natural a consulta lista para aplicar', `<a class="btn secondary" href="#/encuestas">Volver</a>`)}
      <div class="assistant-layout">
        <form class="card pad form" data-form="survey-ai">
          <div class="row-between"><div><span class="kicker">Asistente de participación</span><h2 class="card-title">Nueva consulta</h2></div><span class="icon-box blue">${icon('sparkles')}</span></div>
          ${status}${state.surveyBuilderError ? `<p class="form-alert">${esc(state.surveyBuilderError)}</p>` : ''}
          <div class="survey-preset-panel">
            <span class="kicker">Plantillas neutrales</span>
            <div class="quick-chip-row">${Object.entries(SurveyPresets).map(([key, preset]) => `<button class="chip-btn" type="button" data-survey-preset="${esc(key)}">${esc(preset.label)}</button>`).join('')}</div>
          </div>
          <div class="form-field"><label for="f-survey-rawtext">Qué necesitas preguntar</label><textarea id="f-survey-rawtext" class="textarea assistant-input" name="rawText" required minlength="20" placeholder="Ejemplo: crear votación secreta sobre mantener paro, con opciones sí/no/abstención y espacio opcional de comentario.">${esc(req.rawText || '')}</textarea></div>
          <div class="form-grid"><div class="form-field"><label for="f-survey-mode">Formato</label><select id="f-survey-mode" class="select" name="mode">${[['auto','Automático'],['encuesta','Encuesta'],['votacion','Votación secreta']].map(([value, label]) => `<option value="${value}"${(req.mode || 'auto') === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div><div class="form-field"><label for="f-survey-audience">Audiencia</label><select id="f-survey-audience" class="select" name="audience"><option value="${esc(CEAL_ASSISTANT_AUDIENCE)}" selected>${esc(CEAL_ASSISTANT_AUDIENCE)}</option></select></div></div>
          <div class="hstack"><button class="btn primary" type="submit" ${ready && !state.surveyBuilderLoading ? '' : 'disabled'}>${state.surveyBuilderLoading ? 'Generando...' : 'Generar encuesta'}</button><button class="btn secondary" data-survey-builder-clear type="button">Limpiar</button></div>
        </form>
        <aside class="card pad assistant-side"><h2 class="card-title">Reglas aplicadas</h2><div class="assistant-rule"><span class="icon-box">${icon('eye')}</span><span><strong>Voto secreto por defecto</strong><small>Se muestran cantidades agregadas; no se publica quién votó qué.</small></span></div><div class="assistant-rule"><span class="icon-box">${icon('users')}</span><span><strong>Acceso validado</strong><small>Solo Estudiantes de Ingeniería Civil UCN, con revisión CEAL/Jefatura.</small></span></div><div class="assistant-rule"><span class="icon-box">${icon('download')}</span><span><strong>XLSX real</strong><small>CEAL descarga resultados para análisis posterior.</small></span></div></aside>
      </div>${preview}`);
  }
  function renderSurveyDraftEditor(survey) {
    const questions = survey.questions || [];
    const typeOpts = [['single', 'Opción única'], ['multiple', 'Selección múltiple'], ['text', 'Respuesta abierta'], ['rating', 'Escala 1 a 5']];
    return `<section class="card pad survey-editor">
      <div class="row-between"><div><span class="kicker">Borrador editable</span><h2 class="card-title">Ajusta tu encuesta</h2></div><span class="pill blue">${surveyModeLabel(survey.mode)}</span></div>
      <div class="form-field"><label for="f-survey-draft-title">Título</label><input id="f-survey-draft-title" class="input" data-survey-edit="title" value="${esc(survey.title || '')}" /></div>
      <div class="form-field"><label for="f-survey-draft-description">Descripción</label><textarea id="f-survey-draft-description" class="textarea compact" data-survey-edit="description">${esc(survey.description || '')}</textarea></div>
      <div class="survey-editor-list">${questions.map((q, i) => `
        <div class="survey-editor-q">
          <div class="row-between"><span class="kicker" id="f-survey-q-label-${i}-legend">Pregunta ${i + 1}</span><button class="icon-btn" type="button" data-survey-del-question="${i}" aria-label="Quitar pregunta">${icon('x')}</button></div>
          <label class="sr-only" for="f-survey-q-label-${i}">Texto de la pregunta ${i + 1}</label>
          <input id="f-survey-q-label-${i}" class="input" data-survey-q-label="${i}" value="${esc(q.label || '')}" placeholder="Texto de la pregunta" />
          <div class="survey-editor-meta">
            <label class="sr-only" for="f-survey-q-type-${i}">Tipo de respuesta de la pregunta ${i + 1}</label>
            <select id="f-survey-q-type-${i}" class="select" data-survey-q-type="${i}">${typeOpts.map(([v, l]) => `<option value="${v}"${(q.type || 'single') === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
            <label class="checkbox-row"><input type="checkbox" data-survey-q-required="${i}" ${q.required ? 'checked' : ''} /> Obligatoria</label>
          </div>
          ${['single', 'multiple'].includes(q.type) ? `<div class="survey-editor-options">${(q.options || []).map((opt, j) => `<div class="survey-editor-opt"><label class="sr-only" for="f-survey-opt-${i}-${j}">Opción ${j + 1} de la pregunta ${i + 1}</label><input id="f-survey-opt-${i}-${j}" class="input" data-survey-opt="${i}:${j}" value="${esc(opt)}" placeholder="Opción ${j + 1}" /><button class="icon-btn" type="button" data-survey-del-option="${i}:${j}" aria-label="Quitar opción">${icon('x')}</button></div>`).join('')}<button class="btn ghost sm" type="button" data-survey-add-option="${i}">+ Agregar opción</button></div>` : ''}
        </div>`).join('')}</div>
      <button class="btn secondary sm" type="button" data-survey-add-question>+ Agregar pregunta</button>
      <div class="divider"></div>
      <div class="form-field"><label for="f-survey-refine">Ajustar con el asistente (lenguaje natural)</label><textarea id="f-survey-refine" class="textarea compact" data-survey-refine-input placeholder="Ej: agrega la opción Pizza, quita la pregunta 2, haz la primera de selección múltiple.">${esc(state.surveyRefineText || '')}</textarea></div>
      <div class="hstack"><button class="btn secondary" type="button" data-survey-refine ${state.surveyBuilderLoading ? 'disabled' : ''}>${state.surveyBuilderLoading ? 'Ajustando...' : 'Ajustar con el asistente'}</button></div>
      <div class="divider"></div>
      <div class="hstack"><button class="btn primary" data-survey-create="open" type="button">${icon('check')} Crear y abrir</button><button class="btn secondary" data-survey-create="draft" type="button">Guardar borrador</button></div>
    </section>`;
  }
  function surveyDraftSurvey() {
    if (state.surveyBuilderResult && !state.surveyBuilderResult.survey) state.surveyBuilderResult.survey = { title: '', description: '', mode: 'encuesta', questions: [] };
    return state.surveyBuilderResult?.survey || null;
  }
  function renderSurveyQuestionInput(question, groupLabelId) {
    const id = esc(question.id);
    const name = `survey-${id}`;
    const required = question.required ? 'required' : '';
    const groupAttrs = groupLabelId ? ` role="group" aria-labelledby="${esc(groupLabelId)}"` : '';
    if (question.type === 'text') return `<textarea id="f-survey-q-${id}" class="textarea compact" name="${name}" ${required} placeholder="Escribe tu respuesta"></textarea>`;
    if (question.type === 'rating') return `<div class="survey-option-grid"${groupAttrs}>${[1, 2, 3, 4, 5].map(value => `<label class="survey-option"><input type="radio" name="${name}" value="${value}" ${required} /><span>${value}</span></label>`).join('')}</div>`;
    if (question.type === 'multiple') return `<div class="survey-option-grid"${groupAttrs}>${(question.options || []).map(option => `<label class="survey-option"><input type="checkbox" name="${name}" value="${esc(option)}" /><span>${esc(option)}</span></label>`).join('')}</div>`;
    return `<div class="survey-option-grid"${groupAttrs}>${(question.options || []).map(option => `<label class="survey-option"><input type="radio" name="${name}" value="${esc(option)}" ${required} /><span>${esc(option)}</span></label>`).join('')}</div>`;
  }
  function renderSurveyDetail(id) {
    const survey = (Data.surveys || []).find(item => item.id === id);
    if (!survey && !dataReady) return renderLoading('Consulta', 'Abriendo la consulta…');
    if (!survey) return renderNotFound('No encontramos la encuesta solicitada.');
    const questions = survey.questions || [];
    const count = Number(survey.responseCount || survey.responses?.length || 0);
    const cealControls = hasCealAccess() ? `<div class="vstack"><button class="btn primary" data-survey-export="${esc(survey.id)}">${icon('download')} Exportar XLSX</button>${survey.status !== 'open' ? `<button class="btn secondary" data-survey-status="open" data-survey-id="${esc(survey.id)}">Abrir consulta</button>` : `<button class="btn secondary" data-survey-status="closed" data-survey-id="${esc(survey.id)}">Cerrar consulta</button>`}<button class="btn ghost danger-lite" data-survey-delete="${esc(survey.id)}" data-survey-title="${esc(survey.title || 'esta consulta')}">${icon('x')} Eliminar consulta</button></div>` : '';
    const responseArea = survey.status !== 'open'
      ? `<section class="card pad empty-state"><span class="icon-wrap">${icon('check')}</span><h3>Consulta cerrada</h3><p>Los resultados quedan disponibles para CEAL.</p></section>`
      : isGuest()
        ? `<section class="card pad empty-state"><span class="icon-wrap">${icon('eye')}</span><h3>Ingresa para responder</h3><p>El modo invitado permite revisar, pero no votar ni registrar respuestas.</p></section>`
        : hasJefaturaAccess()
          ? `<section class="card pad empty-state"><span class="icon-wrap">${icon('eye')}</span><h3>Solo lectura</h3><p>Como Jefatura puedes ver las encuestas y los datos publicados; la votación es solo para estudiantes.</p></section>`
          : `<form class="card pad form" data-form="survey-response" data-survey-id="${esc(survey.id)}">${questions.map((q, i) => `<div class="survey-question"><span class="kicker">Pregunta ${i + 1}${q.required ? ' - obligatoria' : ''}</span><label id="f-survey-q-label-${esc(q.id)}"${q.type === 'text' ? ` for="f-survey-q-${esc(q.id)}"` : ''}>${esc(q.label)}</label>${renderSurveyQuestionInput(q, `f-survey-q-label-${esc(q.id)}`)}</div>`).join('')}<button class="btn primary" type="submit">${icon('check')} Enviar respuesta</button></form>`;
    return `${pageHead(survey.title, `${surveyModeLabel(survey.mode)} - ${esc(survey.audience || CEAL_ASSISTANT_AUDIENCE)}`, `<a class="btn secondary" href="#/encuestas">Volver</a>`)}
      <div class="split wide"><section>${responseArea}</section><aside class="card pad"><div class="row-between"><h2 class="card-title">Resumen</h2>${surveyBadge(survey)}</div><p class="small muted" style="line-height:1.55">${esc(survey.description || 'Consulta preparada por CEAL.')}</p><p class="privacy-note compact">${icon('eye')} Resultados agregados. No se publica quién votó qué.</p><div class="detail-block"><div class="detail-row"><span>Privacidad</span><strong>${survey.secret !== false ? 'Voto secreto' : 'Identificada'}</strong></div><div class="detail-row"><span>Respuestas</span><strong>${count}</strong></div><div class="detail-row"><span>Preguntas</span><strong>${questions.length}</strong></div><div class="detail-row"><span>Creada</span><strong>${fmtDate(survey.createdAt)}</strong></div></div>${cealControls}</aside></div>`;
  }
  const WEEKDAY_ES = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
  const BOOKING_DAYS_AHEAD = 21;
  const BOOKING_SLOT_MINUTES = 30;
  function parseOfficeHours(officeHours) {
    return (officeHours || []).map(oh => {
      const weekday = WEEKDAY_ES[plain(oh.day || '').trim()];
      const m = String(oh.time || '').match(/(\d{1,2}):(\d{2})\s*[-–a]+\s*(\d{1,2}):(\d{2})/);
      if (weekday === undefined || !m) return null;
      return { weekday, startH: +m[1], startM: +m[2], endH: +m[3], endM: +m[4], mode: oh.mode || '', place: oh.place || '' };
    }).filter(Boolean);
  }
  function generateBookingSlots(officeHours, now = new Date()) {
    const avail = parseOfficeHours(officeHours);
    if (!avail.length) return [];
    const slots = [];
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let d = 0; d <= BOOKING_DAYS_AHEAD; d++) {
      const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
      for (const a of avail.filter(x => x.weekday === date.getDay())) {
        let cur = new Date(date.getFullYear(), date.getMonth(), date.getDate(), a.startH, a.startM);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), a.endH, a.endM);
        while (cur.getTime() + BOOKING_SLOT_MINUTES * 60000 <= end.getTime()) {
          const slotEnd = new Date(cur.getTime() + BOOKING_SLOT_MINUTES * 60000);
          if (cur.getTime() > now.getTime() + 60 * 60000) slots.push({ start: new Date(cur), end: slotEnd, mode: a.mode, place: a.place });
          cur = slotEnd;
        }
      }
    }
    return slots;
  }
  function slotOverlapsBusy(slot, busy) {
    return (busy || []).some(b => {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      return Number.isFinite(bs) && Number.isFinite(be) && slot.start.getTime() < be && slot.end.getTime() > bs;
    });
  }
  function slotKey(slot) { return `${slot.start.toISOString()}|${slot.end.toISOString()}`; }
  function fmtSlotDayLabel(date) {
    const s = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function fmtSlotTime(date) { return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }); }

  // Respaldo local para la versión estática. En producción el servidor conserva
  // las solicitudes y la disponibilidad entre dispositivos.
  const BOOKING_STORE_KEY = 'portal.booking.v2';
  const APPT_STATUS = { solicitada: ['Reservada', 'green'], confirmada: ['Reservada', 'green'], rechazada: ['No agendada', 'red'], cancelada: ['Cancelada', 'gray'] };
  const APPT_ACTIVE = new Set(['solicitada', 'confirmada']);
  function bookingStoreDefault() { return { appointments: [], closedSlots: [], seeded: false }; }
  function readBookingStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(BOOKING_STORE_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        return {
          ...bookingStoreDefault(),
          ...raw,
          appointments: (raw.appointments || []).map(item => item.status === 'solicitada' ? { ...item, status: 'confirmada' } : item)
        };
      }
    } catch {}
    return bookingStoreDefault();
  }
  function writeBookingStore(store) { try { localStorage.setItem(BOOKING_STORE_KEY, JSON.stringify(store)); } catch {} }
  function apptSlotKey(a) { return `${a.start}|${a.end}`; }
  function allBookingSlots(profile) { return generateBookingSlots(profile.officeHours || []); }
  function availableBookingSlots(profile, store) {
    const busy = [
      ...store.appointments.filter(a => APPT_ACTIVE.has(a.status)),
      ...(state.appointmentBusy || []),
      ...(state.staffBusy || [])
    ];
    const closed = new Set(store.closedSlots || []);
    return allBookingSlots(profile).filter(s => !closed.has(slotKey(s)) && !slotOverlapsBusy(s, busy));
  }
  function loadBookingStore(profile) {
    const store = readBookingStore();
    return store;
  }
  function bookingUserEmail() { return String(state.user?.email || '').toLowerCase(); }
  function myBookingAppointments(store) { const me = bookingUserEmail(); return store.appointments.filter(a => String(a.studentEmail).toLowerCase() === me).sort((x, y) => new Date(x.start) - new Date(y.start)); }
  function nameInitials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'; }
  function dayHead(label) { const parts = label.split(' '); return `<div class="booking-col-head"><strong>${esc(parts[0])}</strong><span>${esc(parts.slice(1).join(' '))}</span></div>`; }
  function slotModeIcon(mode) { return /video|mixto|online/i.test(mode || '') ? 'calendar' : 'user'; }

  // ============================================================
  // RESERVAS DE MESAS (taca-taca / ping-pong) — flujo acordado con
  // tesorería CEAL: preconfirmada -> pago $1.000 -> confirmación manual.
  // Con backend usa /api/reservations (cross-device + correos);
  // sin backend cae a localStorage para mantener el portal utilizable.
  // ============================================================
  const RESERVATION_STORE_KEY = 'portal.reservas.v1';
  const RSV_TABLES = {
    tacataca: { label: 'Taca-taca', place: 'Sala de estar Ingeniería Civil' },
    pingpong: { label: 'Mesa de ping-pong', place: 'Sala de estar Ingeniería Civil' }
  };
  const RSV_BLOCKS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
  const RSV_BLOCK_MINUTES = 30;
  const RSV_STATUS = {
    preconfirmada: ['Preconfirmada', 'orange'],
    pagoAvisado: ['Pago avisado', 'blue'],
    confirmada: ['Confirmada', 'green'],
    liberada: ['Liberada', 'gray'],
    rechazada: ['No confirmada', 'red'],
    cancelada: ['Cancelada', 'gray']
  };
  const RSV_ACTIVE = new Set(['preconfirmada', 'pagoAvisado', 'confirmada']);
  const RSV_PAYMENT = {
    amount: '$1.000',
    holder: 'Belén Alessandra Astudillo Díaz',
    rut: '21.010.841-6',
    bank: 'Mercado Pago',
    accountType: 'Cuenta Vista',
    accountNumber: '1062801369',
    email: 'belen.astu24@gmail.com',
    note: 'El pago se recibe temporalmente en la cuenta de la tesorera del CEAL para la administración de los fondos del centro de estudiantes.'
  };
  const RSV_AGREED_COPY = 'Tu reserva quedó preconfirmada. Para confirmar el bloque, realiza el pago de $1.000 mediante transferencia a la cuenta indicada o paga presencialmente antes del turno. Una vez verificado el pago, tu reserva quedará confirmada. Si el pago no se confirma hasta 2 horas antes del horario reservado, el bloque será liberado automáticamente.';

  function rsvPaymentData() { return state.reservationPayment || RSV_PAYMENT; }
  function rsvBlocks() { return state.reservationSchedule?.blocks || RSV_BLOCKS; }
  function rsvTables() {
    const remote = state.reservationSchedule?.tables;
    return remote && Object.keys(remote).length ? remote : RSV_TABLES;
  }
  function rsvDateKey(d) { return d.toLocaleDateString('en-CA'); }
  function rsvStartFrom(date, block) { return new Date(`${date}T${block}:00`); }
  function rsvEndFrom(date, block) { return new Date(rsvStartFrom(date, block).getTime() + RSV_BLOCK_MINUTES * 60000); }
  function rsvExpiryMs(rsv) {
    if (rsv.expiresAt) return new Date(rsv.expiresAt).getTime();
    const startMs = new Date(rsv.start).getTime();
    const created = new Date(rsv.createdAt || 0).getTime();
    const twoBefore = startMs - 2 * 3600000;
    return twoBefore >= created ? twoBefore : startMs;
  }
  function rsvDays() {
    const days = [];
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    while (days.length < 6) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) days.push(rsvDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }
  function rsvDayLabel(date) {
    const label = new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\.,?/g, '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  function rsvLongLabel(rsv) {
    const start = new Date(rsv.start);
    const day = start.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    return `${day.charAt(0).toUpperCase() + day.slice(1)} · ${fmtSlotTime(start)}–${fmtSlotTime(new Date(rsv.end))}`;
  }
  function rsvStoreDefault() { return { items: [] }; }
  function readRsvStore() {
    try { const raw = JSON.parse(localStorage.getItem(RESERVATION_STORE_KEY) || 'null'); if (raw && typeof raw === 'object' && Array.isArray(raw.items)) return raw; } catch {}
    return rsvStoreDefault();
  }
  function writeRsvStore(store) { try { localStorage.setItem(RESERVATION_STORE_KEY, JSON.stringify(store)); } catch {} }
  function expireRsvItems(items) {
    const now = Date.now();
    let changed = false;
    for (const rsv of items) {
      if (!['preconfirmada', 'pagoAvisado'].includes(rsv.status)) continue;
      if (rsvExpiryMs(rsv) <= now) {
        rsv.status = 'liberada';
        rsv.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
    return changed;
  }
  function rsvUsingApi() {
    // Solo consulta el backend con una sesión que el backend reconoce; las
    // sesiones locales de desarrollo usan el store local (evita 401 -> logout).
    return Boolean(API_BASE) && Boolean(state.user?.sessionToken) && state.user.authProvider !== 'local-dev';
  }
  function reservationItems() {
    if (rsvUsingApi()) return Array.isArray(state.reservations) ? state.reservations : [];
    const store = readRsvStore();
    if (expireRsvItems(store.items)) writeRsvStore(store);
    const me = bookingUserEmail();
    return store.items.map(rsv => (String(rsv.studentEmail || '').toLowerCase() === me ? { ...rsv, mine: true } : rsv));
  }
  function rsvAdminItems() {
    if (rsvUsingApi()) return Array.isArray(state.reservations) ? state.reservations : [];
    const store = readRsvStore();
    if (expireRsvItems(store.items)) writeRsvStore(store);
    return store.items;
  }
  function rsvIsMine(rsv) { return Boolean(rsv.mine) || (Boolean(rsv.studentEmail) && String(rsv.studentEmail).toLowerCase() === bookingUserEmail()); }
  function myReservations() { return reservationItems().filter(rsvIsMine).sort((a, b) => new Date(a.start) - new Date(b.start)); }
  async function hydrateReservations() {
    const route = getRoute().path;
    const wants = route === '/reservas' || (route === '/gestion' && hasCealAccess());
    if (!wants || !rsvUsingApi() || isGuest() || !state.user) return;
    if (state.reservations !== null || state.reservationsLoading) return;
    state.reservationsLoading = true;
    state.reservationsError = '';
    try {
      const payload = await apiRequest('/reservations');
      state.reservations = Array.isArray(payload.items) ? payload.items : [];
      if (payload.schedule) state.reservationSchedule = payload.schedule;
      if (payload.payment) state.reservationPayment = payload.payment;
    } catch (error) {
      state.reservations = [];
      state.reservationsError = error.isSessionExpired ? '' : (error.message || 'No se pudieron cargar las reservas.');
    } finally {
      state.reservationsLoading = false;
      render({ transition: false, scope: 'panel', resetScroll: false });
    }
  }
  async function refreshReservationsSilently() {
    if (!rsvUsingApi()) return;
    try {
      const payload = await apiRequest('/reservations');
      state.reservations = Array.isArray(payload.items) ? payload.items : state.reservations;
    } catch {}
  }
  async function reservationAction(action, data = {}) {
    if (rsvUsingApi()) {
      let payload;
      if (action === 'create') payload = await apiRequest('/reservations', { method: 'POST', body: JSON.stringify({ table: data.table, date: data.date, block: data.block }) });
      else payload = await apiRequest(`/reservations/${encodeURIComponent(data.id)}/${action === 'pay' ? 'pay' : action}`, { method: 'POST', body: JSON.stringify(action === 'pay' ? { method: data.method } : { note: data.note || '' }) });
      await refreshReservationsSilently();
      return payload.item;
    }
    const store = readRsvStore();
    expireRsvItems(store.items);
    const nowIso = new Date().toISOString();
    if (action === 'create') {
      const { table, date, block } = data;
      const start = rsvStartFrom(date, block);
      if (!rsvTables()[table] || !rsvBlocks().includes(block) || Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) throw new Error('Elige un bloque válido.');
      if (store.items.some(rsv => RSV_ACTIVE.has(rsv.status) && rsv.table === table && rsv.date === date && rsv.block === block)) throw new Error('Ese bloque ya está reservado.');
      const mineActive = store.items.filter(rsv => RSV_ACTIVE.has(rsv.status) && String(rsv.studentEmail).toLowerCase() === bookingUserEmail());
      if (mineActive.length >= 2) throw new Error('Ya tienes 2 reservas activas.');
      if (mineActive.some(rsv => rsv.table === table && rsv.date === date)) throw new Error('Ya tienes una reserva de esta mesa ese día.');
      const created = {
        id: `rsv-${Date.now()}`,
        table, date, block,
        start: start.toISOString(),
        end: rsvEndFrom(date, block).toISOString(),
        studentEmail: bookingUserEmail(),
        studentName: state.user?.name || 'Estudiante',
        status: 'preconfirmada',
        payMethod: null,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      created.expiresAt = new Date(rsvExpiryMs(created)).toISOString();
      store.items.unshift(created);
      writeRsvStore(store);
      return { ...created, mine: true };
    }
    const rsv = store.items.find(item => item.id === data.id);
    if (!rsv) throw new Error('No encontramos la reserva.');
    if (action === 'pay') {
      rsv.payMethod = data.method === 'presencial' ? 'presencial' : 'transferencia';
      rsv.status = 'pagoAvisado';
    } else if (action === 'cancel') {
      rsv.status = 'cancelada';
    } else if (action === 'confirm') {
      rsv.status = 'confirmada';
    } else if (action === 'reject') {
      rsv.status = 'rechazada';
    }
    rsv.updatedAt = nowIso;
    writeRsvStore(store);
    return { ...rsv };
  }
  function rsvPayRows() {
    const pay = rsvPaymentData();
    return [
      ['Titular', pay.holder],
      ['RUT', pay.rut],
      ['Entidad', `${pay.bank} · ${pay.accountType}`],
      ['N° de cuenta', pay.accountNumber],
      ['Correo', pay.email]
    ];
  }
  function rsvPayClipboard() {
    const pay = rsvPaymentData();
    return `${pay.holder}\nRUT ${pay.rut}\n${pay.bank} · ${pay.accountType}\nCuenta ${pay.accountNumber}\n${pay.email}\nMonto: ${pay.amount || '$1.000'}`;
  }
  function rsvStatusChip(status) { const [label, color] = RSV_STATUS[status] || [status, 'gray']; return `<span class="status-chip ${color}">${esc(label)}</span>`; }
  function rsvDeadlineLabel(rsv) {
    const expiry = new Date(rsvExpiryMs(rsv));
    if (Number.isNaN(expiry.getTime())) return '';
    const sameDay = rsvDateKey(expiry) === rsvDateKey(new Date());
    const day = sameDay ? 'hoy' : expiry.toLocaleDateString('es-CL', { weekday: 'long' });
    return `Confirma antes de las ${fmtSlotTime(expiry)} ${day === 'hoy' ? 'de hoy' : `del ${day}`}`;
  }
  function renderRsvPaymentCard(rsv) {
    const pay = rsvPaymentData();
    const rows = rsvPayRows().map(([k, v]) => `<div class="rsv-pay-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');
    const busyPay = state.rsvActionBusy === `pay:${rsv.id}`;
    return `<section class="card pad rsv-pay-card" aria-label="Confirma tu reserva">
      <div class="rsv-pay-head"><span class="rsv-pay-ico">${icon('wallet')}</span><div><span class="kicker">Paso 2 · Pago</span><h2 class="card-title">Confirma tu bloque</h2></div>${rsvStatusChip(rsv.status)}</div>
      <p class="rsv-pay-copy">${esc(RSV_AGREED_COPY)}</p>
      <div class="rsv-pay-summary">${icon('pingpong')}<strong>${esc(rsvTables()[rsv.table]?.label || 'Mesa')}</strong><span>${esc(rsvLongLabel(rsv))}</span></div>
      <div class="rsv-pay-data">
        <div class="rsv-pay-data-head"><strong>Datos para transferir</strong><button class="btn ghost sm" type="button" data-rsv-copy-pay>${icon('copy')} Copiar</button></div>
        ${rows}
        <div class="rsv-pay-row rsv-pay-amount"><span>Monto</span><strong>${esc(pay.amount || '$1.000')}</strong></div>
      </div>
      <div class="rsv-pay-actions">
        <button class="btn primary" type="button" data-rsv-pay="${esc(rsv.id)}" data-rsv-method="transferencia" ${busyPay ? 'aria-busy="true" disabled' : ''}>${busyPay ? '<span class="btn-spinner"></span><span>Avisando…</span>' : `${icon('check')} Ya transferí`}</button>
        <button class="btn secondary" type="button" data-rsv-pay="${esc(rsv.id)}" data-rsv-method="presencial" ${busyPay ? 'disabled' : ''}>Pagaré presencial</button>
      </div>
      <p class="small muted rsv-pay-note">${esc(pay.note || RSV_PAYMENT.note)}</p>
    </section>`;
  }
  function renderMyReservations() {
    const mine = myReservations().filter(rsv => RSV_ACTIVE.has(rsv.status) || new Date(rsv.end).getTime() > Date.now() - 86400000);
    if (!mine.length) return '';
    const rows = mine.map(rsv => {
      const busyCancel = state.rsvActionBusy === `cancel:${rsv.id}`;
      const payButtons = rsv.status === 'preconfirmada'
        ? `<button class="btn primary sm" type="button" data-rsv-pay="${esc(rsv.id)}" data-rsv-method="transferencia">${icon('check')} Ya transferí</button><button class="btn secondary sm" type="button" data-rsv-pay="${esc(rsv.id)}" data-rsv-method="presencial">Presencial</button>`
        : '';
      const cancelBtn = RSV_ACTIVE.has(rsv.status)
        ? `<button class="btn ghost sm" type="button" data-rsv-cancel="${esc(rsv.id)}" ${busyCancel ? 'aria-busy="true" disabled' : ''}>${icon('x')} Cancelar</button>`
        : '';
      const deadline = ['preconfirmada', 'pagoAvisado'].includes(rsv.status) ? `<p class="small rsv-deadline">${icon('clock')} ${esc(rsvDeadlineLabel(rsv))}</p>` : '';
      const waiting = rsv.status === 'pagoAvisado' ? `<p class="small muted">Aviso recibido (${rsv.payMethod === 'presencial' ? 'pago presencial' : 'transferencia'}). La tesorería CEAL verificará y confirmará tu bloque.</p>` : '';
      return `<article class="rsv-card">
        <div class="rsv-card-ico">${icon('pingpong')}</div>
        <div class="rsv-card-body">
          <div class="rsv-card-top"><strong>${esc(rsvTables()[rsv.table]?.label || 'Mesa')}</strong>${rsvStatusChip(rsv.status)}</div>
          <span class="rsv-card-when">${esc(rsvLongLabel(rsv))}</span>
          ${deadline}${waiting}
          <div class="rsv-card-actions">${payButtons}${cancelBtn}</div>
        </div>
      </article>`;
    }).join('');
    return `<section class="card pad rsv-mine"><div class="row-between"><h2 class="card-title">Mis reservas</h2></div><div class="rsv-card-list">${rows}</div></section>`;
  }
  function renderReservations() {
    const tables = rsvTables();
    const days = rsvDays();
    if (!state.rsvDate || !days.includes(state.rsvDate)) state.rsvDate = days[0];
    if (!tables[state.rsvTable]) state.rsvTable = Object.keys(tables)[0];
    const items = reservationItems();
    const loading = rsvUsingApi() && state.reservations === null;
    const takenMap = new Map();
    items.forEach(rsv => { if (RSV_ACTIVE.has(rsv.status)) takenMap.set(`${rsv.table}|${rsv.date}|${rsv.block}`, rsv); });
    const now = Date.now();
    const tableTabs = Object.entries(tables).map(([key, t]) => `<button type="button" class="rsv-table-tab ${state.rsvTable === key ? 'active' : ''}" data-rsv-table="${esc(key)}">${icon('pingpong')}<span>${esc(t.label)}</span></button>`).join('');
    const dayChips = days.map(d => `<button type="button" class="rsv-day-chip ${state.rsvDate === d ? 'active' : ''}" data-rsv-date="${esc(d)}">${esc(rsvDayLabel(d))}</button>`).join('');
    const blocks = rsvBlocks().map(block => {
      const key = `${state.rsvTable}|${state.rsvDate}|${block}`;
      const taken = takenMap.get(key);
      const past = rsvStartFrom(state.rsvDate, block).getTime() <= now;
      const mine = taken && rsvIsMine(taken);
      const selected = state.rsvBlock === block && !taken && !past;
      if (mine) return `<span class="rsv-block is-mine" title="Tu reserva">${esc(block)}<small>Tuyo</small></span>`;
      if (taken) return `<span class="rsv-block is-taken">${esc(block)}<small>Ocupado</small></span>`;
      if (past) return `<span class="rsv-block is-past">${esc(block)}</span>`;
      return `<button type="button" class="rsv-block ${selected ? 'is-selected' : ''}" data-rsv-block="${esc(block)}">${esc(block)}</button>`;
    }).join('');
    const selectedValid = state.rsvBlock && !takenMap.get(`${state.rsvTable}|${state.rsvDate}|${state.rsvBlock}`) && rsvStartFrom(state.rsvDate, state.rsvBlock).getTime() > now;
    const confirmBlock = selectedValid
      ? `<div class="rsv-confirm">
          <div class="rsv-confirm-copy">${icon('check')}<div><strong>${esc(tables[state.rsvTable].label)} · ${esc(rsvDayLabel(state.rsvDate))} · ${esc(state.rsvBlock)}</strong><span class="small muted">Bloque de 30 minutos · ${esc(rsvPaymentData().amount || '$1.000')} · ${esc(tables[state.rsvTable].place || 'Sala de estar')}</span></div></div>
          <button class="btn primary" type="button" data-rsv-create ${state.rsvSubmitting ? 'aria-busy="true" disabled' : ''}>${state.rsvSubmitting ? '<span class="btn-spinner"></span><span>Reservando…</span>' : 'Reservar este bloque'}</button>
        </div>`
      : `<p class="small muted rsv-hint">${icon('clock')} Elige un bloque libre para reservar.</p>`;
    const mine = myReservations();
    const focusPay = mine.find(rsv => rsv.id === state.rsvJustCreated && rsv.status === 'preconfirmada') || mine.find(rsv => rsv.status === 'preconfirmada');
    const errorNote = state.reservationsError ? `<p class="form-alert">${esc(state.reservationsError)}</p>` : '';
    const loadingNote = loading ? `<div class="rsv-loading"><span class="btn-spinner"></span><span>Cargando disponibilidad…</span></div>` : '';
    return `${pageHead('Reservas', 'Taca-taca y mesa de ping-pong · Sala de estar Ingeniería Civil')}
      <section class="card pad rsv-booker" aria-label="Reservar un bloque">
        <div class="rsv-step-head"><span class="kicker">Paso 1 · Elige tu bloque</span></div>
        ${errorNote}${loadingNote}
        <div class="rsv-table-tabs" role="tablist" aria-label="Elegir mesa">${tableTabs}</div>
        <div class="rsv-day-row" aria-label="Elegir día">${dayChips}</div>
        <div class="rsv-block-grid" aria-label="Bloques de 30 minutos">${blocks}</div>
        ${confirmBlock}
      </section>
      ${focusPay ? renderRsvPaymentCard(focusPay) : ''}
      ${renderMyReservations()}
      <section class="card pad rsv-rules">
        <h2 class="card-title">Cómo funciona</h2>
        <div class="rsv-rule">${icon('clock')}<span>Bloques de 30 minutos, de lunes a viernes entre ${esc(rsvBlocks()[0])} y ${esc(rsvBlocks()[rsvBlocks().length - 1])} h.</span></div>
        <div class="rsv-rule">${icon('wallet')}<span>Cada bloque cuesta ${esc(rsvPaymentData().amount || '$1.000')}: por transferencia o pagando presencial antes del turno.</span></div>
        <div class="rsv-rule">${icon('check')}<span>La tesorería CEAL verifica el pago y confirma tu reserva. Recibirás un correo en cada paso.</span></div>
        <div class="rsv-rule">${icon('bell')}<span>Si el pago no se confirma 2 horas antes del bloque, el cupo se libera automáticamente.</span></div>
        <p class="small muted">${esc(rsvPaymentData().note || RSV_PAYMENT.note)}</p>
      </section>`;
  }
  function renderReservationAdminPanel() {
    const items = rsvAdminItems();
    const loading = rsvUsingApi() && state.reservations === null;
    const pending = items.filter(rsv => ['preconfirmada', 'pagoAvisado'].includes(rsv.status)).sort((a, b) => new Date(a.start) - new Date(b.start));
    const upcoming = items.filter(rsv => rsv.status === 'confirmada' && new Date(rsv.end).getTime() > Date.now()).sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 6);
    const payLabel = rsv => rsv.status !== 'pagoAvisado' ? '<span class="pill gray">Sin aviso de pago</span>' : rsv.payMethod === 'presencial' ? '<span class="pill blue">Pagará presencial</span>' : '<span class="pill blue">Transferencia avisada</span>';
    const pendingRows = pending.map(rsv => {
      const busyC = state.rsvActionBusy === `confirm:${rsv.id}`;
      const busyR = state.rsvActionBusy === `reject:${rsv.id}`;
      return `<article class="rsv-admin-card">
        <div class="rsv-admin-top"><span class="avatar sm">${esc(nameInitials(rsv.studentName || rsv.studentEmail || '?'))}</span><div class="rsv-admin-who"><strong>${esc(rsv.studentName || 'Estudiante')}</strong><span class="small muted">${esc(rsv.studentEmail || '')}</span></div>${rsvStatusChip(rsv.status)}</div>
        <div class="rsv-admin-meta">${icon('pingpong')}<span><strong>${esc(rsvTables()[rsv.table]?.label || 'Mesa')}</strong> · ${esc(rsvLongLabel(rsv))}</span></div>
        <div class="rsv-admin-meta-row">${payLabel(rsv)}<span class="small muted">${esc(rsvDeadlineLabel(rsv))}</span></div>
        <div class="rsv-admin-actions">
          <button class="btn primary sm" type="button" data-rsv-confirm="${esc(rsv.id)}" ${busyC ? 'aria-busy="true" disabled' : ''}>${busyC ? '<span class="btn-spinner"></span><span>Confirmando…</span>' : `${icon('check')} Confirmar pago`}</button>
          <button class="btn ghost sm" type="button" data-rsv-reject="${esc(rsv.id)}" ${busyR ? 'aria-busy="true" disabled' : ''}>${icon('x')} Rechazar</button>
        </div>
      </article>`;
    }).join('');
    const upcomingRows = upcoming.map(rsv => `<div class="rsv-upcoming-row"><span>${icon('pingpong')}</span><div><strong>${esc(rsvTables()[rsv.table]?.label || 'Mesa')}</strong><span class="small muted">${esc(rsvLongLabel(rsv))} · ${esc(rsv.studentName || '')}</span></div><button class="btn ghost sm" type="button" data-rsv-cancel="${esc(rsv.id)}" aria-label="Cancelar reserva">${icon('x')}</button></div>`).join('');
    return `<section class="card pad rsv-admin" aria-label="Reservas de mesas">
      <div class="row-between"><h2 class="card-title">Reservas de taca-taca y ping-pong</h2>${pending.length ? `<span class="pill orange">${pending.length} por confirmar</span>` : '<span class="pill gray">Al día</span>'}</div>
      <p class="small muted">Confirma cada reserva cuando verifiques la transferencia en la cuenta de la tesorería (${esc(rsvPaymentData().email || RSV_PAYMENT.email)}) o cuando el pago sea presencial.</p>
      ${loading ? `<div class="rsv-loading"><span class="btn-spinner"></span><span>Cargando reservas…</span></div>` : ''}
      <div class="rsv-admin-list">${pendingRows || renderEmpty('Sin reservas por confirmar', 'Cuando alguien reserve y avise su pago aparecerá aquí.', '', 'check')}</div>
      ${upcoming.length ? `<div class="divider"></div><h3 class="card-title sm">Próximas confirmadas</h3><div class="rsv-upcoming-list">${upcomingRows}</div>` : ''}
    </section>`;
  }

  function bookingHeroCard(profile, opts = {}) {
    const hours = profile.officeHours || [];
    const email = opts.staff ? (profile.email || 'jc.icivil.afta@ucn.cl') : (profile.email || 'jc.icivil.afta@ucn.cl');
    const hoursHtml = hours.map(h => `<div class="staff-hour-row"><span><strong>${esc(h.day)}</strong><small>${esc(h.mode)} · ${esc(h.place)}</small></span><strong>${esc(h.time)}</strong></div>`).join('');
    return `<section class="card pad staff-hero">
      <div class="staff-hero-top"><span class="avatar big blue">JC</span><div><span class="kicker">Jefe de carrera</span><h2 class="card-title">${esc(profile.displayName || 'Jefatura de carrera')}</h2><p class="small muted">${esc(profile.role || 'Ingeniería Civil UCN')}</p></div></div>
      <div class="staff-hero-meta">${icon('user')}<span>${esc(email)}</span></div>
      <div class="divider"></div>
      <h3 class="card-title sm">Horarios de atención</h3>
      <div class="staff-hours-list">${hoursHtml || '<p class="small muted">Sin horarios publicados.</p>'}</div>
    </section>`;
  }
  function bookingKpi(ico, value, label, color) {
    return `<div class="booking-kpi kpi-${color}"><span class="booking-kpi-ico">${icon(ico)}</span><div class="booking-kpi-copy"><span class="booking-kpi-val">${value}</span><span class="booking-kpi-label">${esc(label)}</span></div></div>`;
  }
  function renderStudentCalendar(slots) {
    if (!slots.length) return `<div class="booking-empty">${icon('calendar')}<div><strong>No hay horas libres por ahora</strong><p class="small muted">Todas las horas de las próximas semanas están tomadas. Vuelve a revisar más adelante.</p></div></div>`;
    const byDay = new Map();
    slots.forEach(s => { const k = fmtSlotDayLabel(s.start); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(s); });
    const cols = [...byDay.entries()].slice(0, 6).map(([day, list]) => {
      const chips = list.map(s => { const k = slotKey(s); const on = k === state.bookingSlotKey; return `<button type="button" class="slot-chip ${on ? 'is-selected' : ''}" data-book-slot="${esc(k)}"><span class="slot-chip-time">${fmtSlotTime(s.start)}</span><span class="slot-chip-mode">${icon(slotModeIcon(s.mode))}${esc((s.mode || 'Presencial').split(' ')[0])}</span></button>`; }).join('');
      return `<div class="booking-col">${dayHead(day)}<div class="booking-col-slots">${chips}</div></div>`;
    }).join('');
    return `<div class="booking-calendar">${cols}</div>`;
  }
  function renderMyHours(mine) {
    if (!mine.length) return '';
    const now = Date.now();
    const rows = mine.filter(a => new Date(a.end).getTime() > now || APPT_ACTIVE.has(a.status)).map(a => {
      const start = new Date(a.start);
      const [label, color] = APPT_STATUS[a.status] || [a.status, 'gray'];
      const actions = APPT_ACTIVE.has(a.status) ? `<button class="btn ghost sm" type="button" data-appointment-cancel="${esc(a.id)}">${icon('x')} Cancelar</button>` : '';
      return `<div class="appt-card">
        <div class="appt-card-when"><span class="appt-day">${esc(fmtSlotDayLabel(start).split(' ')[0])}</span><span class="appt-date">${esc(fmtSlotDayLabel(start).split(' ').slice(1).join(' '))}</span><span class="appt-time">${fmtSlotTime(start)}</span></div>
        <div class="appt-card-body"><div class="row-between"><strong>${esc(a.mode || 'Presencial')}</strong><span class="status-chip ${color}">${esc(label)}</span></div><p class="small muted">${esc(a.reason || 'Sin motivo indicado')}</p>${a.staffNote ? `<p class="small booking-note">${icon('bell')} <span>${esc(a.staffNote)}</span></p>` : ''}</div>
        <div class="appt-card-actions">${actions}</div>
      </div>`;
    }).join('');
    return `<section class="card pad booking-mine"><div class="row-between"><h2 class="card-title">Mis horas</h2></div><div class="appt-card-list">${rows}</div></section>`;
  }
  function renderStudentBooking(profile, store) {
    const avail = availableBookingSlots(profile, store);
    const mine = myBookingAppointments(store);
    const selected = avail.find(s => slotKey(s) === state.bookingSlotKey);
    const confirmBlock = selected
      ? `<div class="booking-confirm"><div class="booking-confirm-head">${icon('check')}<div><strong>${esc(fmtSlotDayLabel(selected.start))}</strong><span class="small muted">${fmtSlotTime(selected.start)}–${fmtSlotTime(selected.end)} · ${esc(selected.mode || 'Presencial')} · ${esc(selected.place || '')}</span></div></div><div class="form-field"><label for="f-book-reason">Motivo</label><textarea id="f-book-reason" class="textarea compact" data-booking-reason maxlength="500" placeholder="Indica brevemente el motivo">${esc(state.bookingReason || '')}</textarea></div><button class="btn primary full" type="button" data-appointment-create ${state.bookingSubmitting ? 'aria-busy="true" disabled' : ''}>${state.bookingSubmitting ? '<span class="btn-spinner"></span><span>Reservando…</span>' : 'Reservar hora'}</button><p class="small muted">La hora queda reservada de inmediato y recibirás un correo de respaldo.</p></div>`
      : `<p class="small muted booking-hint">${icon('clock')} Selecciona una hora disponible.</p>`;
    return `${pageHead('Atención de Jefatura', 'Reserva directamente una hora disponible', `<a class="btn secondary" href="/tutoriales/">${icon('play')} Ver tutorial</a>`)}
      <div class="split wide booking-layout">
        <section class="card pad booking-picker">
          <div class="row-between"><h2 class="card-title">Horas disponibles</h2><span class="pill blue">${avail.length} libres</span></div>
          <p class="small muted">Selecciona el día y la hora que prefieras.</p>
          ${confirmBlock}
          ${renderStudentCalendar(avail)}
        </section>
        ${bookingHeroCard(profile)}
      </div>
      ${renderMyHours(mine)}`;
  }
  function renderStaffApptRow(a) {
    const start = new Date(a.start);
    return `<div class="appt-card">
      <div class="appt-card-when"><span class="appt-day">${esc(fmtSlotDayLabel(start).split(' ')[0])}</span><span class="appt-date">${esc(fmtSlotDayLabel(start).split(' ').slice(1).join(' '))}</span><span class="appt-time">${fmtSlotTime(start)}</span></div>
      <div class="appt-card-body"><strong>${esc(a.studentName || a.studentEmail)}</strong><span class="small muted">${esc(a.studentEmail || '')}</span><p class="small muted">${esc(a.reason || 'Sin motivo')}</p></div>
      <div class="appt-card-actions"><button class="btn ghost sm" type="button" data-appointment-cancel="${esc(a.id)}">${icon('x')} Cancelar hora</button></div>
    </div>`;
  }
  function renderStaffAvailability(profile, store) {
    const all = allBookingSlots(profile);
    if (!all.length) return `<p class="small muted">No hay horarios base configurados en el perfil.</p>`;
    const closed = new Set(store.closedSlots || []);
    const busy = [...store.appointments.filter(a => APPT_ACTIVE.has(a.status)), ...(state.staffBusy || [])];
    const byDay = new Map();
    all.forEach(s => { const k = fmtSlotDayLabel(s.start); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(s); });
    const cols = [...byDay.entries()].slice(0, 6).map(([day, list]) => {
      const chips = list.map(s => {
        const k = slotKey(s);
        if (slotOverlapsBusy(s, busy)) return `<span class="slot-chip is-taken" title="Hora ocupada">${fmtSlotTime(s.start)}</span>`;
        if (closed.has(k)) return `<button type="button" class="slot-chip is-closed" data-availability-open="${esc(k)}" title="Cerrada; activar para reabrir">${fmtSlotTime(s.start)}</button>`;
        return `<button type="button" class="slot-chip is-open" data-availability-close="${esc(k)}" title="Disponible; activar para cerrar">${fmtSlotTime(s.start)}</button>`;
      }).join('');
      return `<div class="booking-col">${dayHead(day)}<div class="booking-col-slots">${chips}</div></div>`;
    }).join('');
    return `<div class="booking-legend"><span><i class="dot open"></i> Disponible</span><span><i class="dot closed"></i> Cerrada</span><span><i class="dot taken"></i> Reservada</span></div><div class="booking-calendar">${cols}</div>`;
  }
  function renderStaffBooking(profile, store) {
    const appts = store.appointments.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
    const now = Date.now();
    const confirmed = appts.filter(a => APPT_ACTIVE.has(a.status) && new Date(a.end).getTime() > now);
    const weekEnd = now + 7 * 86400000;
    const thisWeek = appts.filter(a => APPT_ACTIVE.has(a.status) && new Date(a.start).getTime() <= weekEnd && new Date(a.end).getTime() > now);
    const closed = (store.closedSlots || []).length;
    const kpis = `<div class="booking-kpis">${bookingKpi('check', confirmed.length, 'Próximas reservadas', 'green')}${bookingKpi('clock', thisWeek.length, 'Esta semana', 'blue')}${bookingKpi('x', closed, 'Cupos cerrados', closed ? 'orange' : 'gray')}</div>`;
    const agenda = confirmed.length ? confirmed.map(renderStaffApptRow).join('') : `<div class="booking-inline-empty">${icon('calendar')}<span><strong>Sin atenciones próximas</strong><small>Las horas tomadas aparecerán aquí automáticamente.</small></span></div>`;
    const calendarStatus = state.calendarStatus || Data.integrations?.googleCalendar || {};
    const calendarLabel = calendarStatus.verified ? 'Calendar verificado' : (calendarStatus.connected ? 'Revisar Calendar' : 'Conectar Calendar');
    const calendarTone = calendarStatus.verified ? 'green' : (calendarStatus.connected ? 'orange' : 'gray');
    const calendarOpen = !calendarStatus.verified || getRoute().query.calendar ? ' open' : '';
    return `${pageHead('Jefatura de carrera', 'Atenciones reservadas y disponibilidad semanal', `<a class="btn secondary" href="/tutorial-jc/">${icon('play')} Ver tutorial</a>`)}
      ${kpis}
      <div class="split wide">
        <section class="card pad"><div class="row-between"><h2 class="card-title">Próximas atenciones</h2>${confirmed.length ? `<span class="pill green">${confirmed.length}</span>` : ''}</div><p class="small muted">Revisa estudiante, horario, modalidad y motivo antes de cada atención.</p><div class="appt-card-list">${agenda}</div></section>
        <aside class="booking-aside">${bookingHeroCard(profile, { staff: true })}</aside>
      </div>
      <section class="card pad"><div class="row-between"><h2 class="card-title">Disponibilidad de la semana</h2><span class="small muted">Cierra o reabre horas libres</span></div>${renderStaffAvailability(profile, store)}</section>
      <details class="card pad booking-gcal"${calendarOpen}><summary><span><strong>Google Calendar</strong><small>Sincronización de la agenda de atención</small></span><span class="pill ${calendarTone}">${calendarLabel}</span></summary><div class="booking-gcal-body">${renderStaffCalendarPanel(profile)}</div></details>`;
  }
  function renderBookingPage(forStaff) {
    const profile = (Data.staffProfiles || [])[0] || {};
    if (API_BASE && state.myAppointments === null) {
      const title = forStaff ? 'Jefatura de carrera' : 'Atención de Jefatura';
      if (state.myApptsError) {
        const retry = `<button class="btn primary" type="button" data-appointments-refresh>${icon('calendar')} Reintentar</button>`;
        return `${pageHead(title)}<section class="card pad">${renderEmpty('No pudimos cargar los horarios', state.myApptsError, retry, 'calendar')}</section>`;
      }
      return renderLoading(title, state.myApptsSlow ? 'El servicio se está iniciando. Esto puede tardar unos segundos.' : 'Consultando disponibilidad…');
    }
    const store = API_BASE
      ? { appointments: state.myAppointments || [], closedSlots: state.staffClosedSlots || [] }
      : loadBookingStore(profile);
    return forStaff ? renderStaffBooking(profile, store) : renderStudentBooking(profile, store);
  }

  function renderStaffCalendarPanel(profile = {}) {
    const status = state.calendarStatus || Data.integrations?.googleCalendar || {};
    const account = status.account || profile.email || 'jc.icivil.afta@ucn.cl';
    const callbackState = getRoute().query.calendar || '';
    const callbackNotice = callbackState === 'connected'
      ? `<div class="booking-calendar-notice success">${icon('check')}<span><strong>Conexión completada</strong><small>La cuenta y los permisos de Calendar fueron verificados.</small></span></div>`
      : callbackState === 'error'
        ? `<div class="booking-calendar-notice error">${icon('x')}<span><strong>No se completó la conexión</strong><small>Revisa la cuenta seleccionada e inténtalo nuevamente.</small></span></div>`
        : '';
    if (!API_BASE) {
      return `<div class="booking-calendar-panel" data-calendar-state="unavailable"><span class="kicker">Agenda</span><h2 class="card-title">Conexión no disponible</h2><p class="small muted">La conexión con Google Calendar aún no está habilitada.</p><div class="booking-calendar-account"><span class="icon-box">${icon('user')}</span><span><strong>Cuenta de Jefatura</strong><small>${esc(account)}</small></span></div></div>`;
    }
    if (state.calendarStatusLoading && !state.calendarStatus) {
      return `<div class="booking-calendar-panel" data-calendar-state="loading"><span class="kicker">Agenda</span><h2 class="card-title">Revisando conexión</h2></div>`;
    }
    if (state.calendarStatusError) {
      return `<div class="booking-calendar-panel" data-calendar-state="error"><span class="kicker">Agenda</span><h2 class="card-title">No se pudo revisar Calendar</h2><p class="small muted">${esc(state.calendarStatusError)}</p><button class="btn secondary" data-calendar-refresh type="button">${icon('calendar')} Reintentar</button></div>`;
    }
    if (!status.configured) {
      return `<div class="booking-calendar-panel" data-calendar-state="unconfigured"><span class="kicker">Agenda</span><h2 class="card-title">Conexión aún no habilitada</h2><p class="small muted">La agenda del portal sigue disponible. Calendar podrá conectarse cuando la autorización institucional esté preparada.</p><div class="booking-calendar-account"><span class="icon-box">${icon('user')}</span><span><strong>Cuenta prevista</strong><small>${esc(account)}</small></span></div></div>`;
    }
    if (status.connected) {
      const verified = Boolean(status.verified);
      return `<div class="booking-calendar-panel" data-calendar-state="${verified ? 'verified' : 'connected'}">${callbackNotice}<div class="booking-calendar-status"><span class="icon-box ${verified ? 'green' : 'orange'}">${icon(verified ? 'check' : 'clock')}</span><span><span class="kicker">Agenda</span><h2 class="card-title">${verified ? 'Calendar conectado y verificado' : 'Calendar conectado'}</h2><p class="small muted">${verified ? 'El portal comprobó la cuenta, la disponibilidad y el acceso a eventos.' : 'Verifica el acceso antes de habilitar la atención para estudiantes.'}</p></span></div><div class="booking-calendar-details"><span><strong>Cuenta</strong><small>${esc(account)}</small></span><span><strong>Calendario</strong><small>${esc(status.calendarId || 'primary')}</small></span><span><strong>Última verificación</strong><small>${status.verifiedAt ? fmtDate(status.verifiedAt) : 'Pendiente'}</small></span></div><div class="hstack"><button class="btn ${verified ? 'secondary' : 'primary'}" data-calendar-verify type="button">${icon('check')} Verificar ahora</button><button class="btn ghost" data-calendar-disconnect type="button">${icon('x')} Desconectar</button></div></div>`;
    }
    return `<div class="booking-calendar-panel" data-calendar-state="disconnected">${callbackNotice}<span class="kicker">Agenda</span><h2 class="card-title">Conectar Google Calendar</h2><p class="small muted">Autoriza la cuenta de Jefatura para consultar ocupaciones y administrar los eventos creados por el portal.</p><div class="booking-calendar-account"><span class="icon-box">${icon('user')}</span><span><strong>Cuenta requerida</strong><small>${esc(account)}</small></span></div><button class="btn primary" data-calendar-connect type="button">${icon('calendar')} Conectar agenda</button><p class="small muted">Google abrirá una pantalla de autorización. Selecciona exactamente esta cuenta y revisa los permisos antes de continuar.</p></div>`;
  }
  function renderCealAssistant() {
    const req = state.cealAssistantRequest || {};
    const endpointReady = Boolean(AI_ENDPOINT || API_BASE);
    const sessionReady = Boolean(state.user?.sessionToken);
    const ready = endpointReady && sessionReady;
    const usage = state.cealAssistantUsage ? `<span class="pill gray">${esc(state.cealAssistantUsage.count || 0)} usos hoy</span>` : '';
    const status = !endpointReady
      ? `<div class="google-auth-note"><strong>Asistente no disponible</strong><span>La redacción asistida se activará cuando el servicio institucional esté listo.</span></div>`
      : !sessionReady
        ? `<div class="google-auth-note"><strong>Vuelve a iniciar sesión CEAL</strong><span>El asistente necesita una sesión interna nueva para validar el acceso.</span></div>`
        : '';
    return ensureCEAL(`${pageHead('Crear comunicado', 'Redáctalo con ayuda, elige audiencia y publícalo (con envío por correo opcional)', `<a class="btn secondary" href="#/comunicados">${icon('arrow')} Volver a comunicados</a><span class="pill blue">Asistente ${esc(state.cealAssistantLoading ? 'trabajando' : 'listo')}</span>${usage}`)}
      <div class="assistant-layout">
        <form class="card pad ceal-assistant-form" data-form="ceal-assistant">
          <div class="row-between"><div><span class="kicker">Redacción asistida</span><h2 class="card-title">Nuevo borrador</h2></div><span class="icon-box blue">${icon('sparkles')}</span></div>
          ${status}${state.cealAssistantError ? `<p class="form-alert">${esc(state.cealAssistantError)}</p>` : ''}
          <div class="form-field"><label for="f-ceal-rawtext">Texto recibido</label><textarea id="f-ceal-rawtext" class="textarea assistant-input" name="rawText" placeholder="Pega aquí el texto crudo, acuerdo, aviso o instrucción CEAL.">${esc(req.rawText || '')}</textarea></div>
          <div class="form-grid tri">
            <div class="form-field"><label for="f-ceal-category">Categoría sugerida</label><select id="f-ceal-category" class="select" name="category">${['Auto','Académico','Contingencia','Material','CEAL'].map(value => `<option value="${esc(value)}"${(req.category || 'Auto') === value ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select></div>
            <div class="form-field"><label for="f-ceal-urgency">Urgencia</label><select id="f-ceal-urgency" class="select" name="urgency">${['normal','alta'].map(value => `<option value="${esc(value)}"${(req.urgency || 'normal') === value ? ' selected' : ''}>${value === 'alta' ? 'Alta' : 'Normal'}</option>`).join('')}</select></div>
            <div class="form-field"><label for="f-ceal-length">Longitud</label><select id="f-ceal-length" class="select" name="length">${[['auto', 'Automática'], ['conciso', 'Conciso'], ['detallado', 'Detallado']].map(([value, label]) => `<option value="${value}"${(req.length || 'auto') === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div>
          </div>
          <div class="form-field"><label for="f-ceal-audience">Audiencia</label><select id="f-ceal-audience" class="select" name="audience"><option value="${esc(CEAL_ASSISTANT_AUDIENCE)}" selected>${esc(CEAL_ASSISTANT_AUDIENCE)}</option></select></div>
          <div class="form-field"><label for="f-ceal-extracontext">Contexto adicional</label><textarea id="f-ceal-extracontext" class="textarea compact" name="extraContext" placeholder="Opcional: fecha, responsable, canal oficial, qué evitar, o instrucción de tono.">${esc(req.extraContext || '')}</textarea></div>
          <div class="form-field"><label for="f-ceal-attach">Archivo de contexto (opcional)</label>${state.cealAttachment
            ? `<div class="attach-chip"><span class="hstack">${icon('file')} ${esc(state.cealAttachment.name)}</span><button class="icon-btn" type="button" data-attach-remove aria-label="Quitar archivo">${icon('x')}</button></div>`
            : `<label class="upload-zone compact">${icon('upload')}<strong>Adjuntar PDF, imagen o texto</strong><span class="help">La IA lo usará como fuente. Máx 6 MB.</span><input id="f-ceal-attach" class="sr-only" type="file" data-attach-input accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/png,image/jpeg,image/webp,text/plain" /></label>`}</div>
          <div class="hstack"><button class="btn primary" type="submit" ${ready && !state.cealAssistantLoading ? '' : 'disabled'}>${state.cealAssistantLoading ? 'Generando...' : 'Generar borrador'}</button><button class="btn secondary" type="button" data-assistant-clear>Limpiar</button></div>
        </form>
        <aside class="card pad assistant-side">
          <h2 class="card-title">Cómo decide</h2>
          <div class="assistant-rule"><span class="icon-box">${icon('check')}</span><span><strong>Ordena sin inventar</strong><small>Si faltan datos críticos, pregunta antes de dejar listo el texto.</small></span></div>
          <div class="assistant-rule"><span class="icon-box">${icon('megaphone')}</span><span><strong>Formato portal</strong><small>Título, resumen, categoría, cuerpo, prioridad y notas editoriales.</small></span></div>
          <div class="assistant-rule"><span class="icon-box">${icon('eye')}</span><span><strong>Publicación humana</strong><small>CEAL revisa y aprueba antes de que aparezca en Comunicados.</small></span></div>
        </aside>
      </div>
      ${renderAssistantResult()}`);
  }

  function renderAssistantResult() {
    const result = state.cealAssistantResult;
    if (!result) {
      return `<section class="card pad assistant-empty"><span class="icon-wrap">${icon('sparkles')}</span><h3>Sin borrador generado</h3><p>Pega un texto del CEAL y el asistente lo devolverá como comunicado listo para revisión.</p></section>`;
    }
    const draft = result.draft;
    const questions = result.questions || [];
    const notes = result.editorNotes || [];
    const flags = result.safetyFlags || [];
    return `<section class="card pad assistant-preview">
      <div class="row-between"><div><span class="kicker">${result.needsClarification ? 'Requiere aclaración' : 'Borrador sugerido'}</span><h2 class="card-title">${draft ? esc(draft.title) : 'Faltan datos antes de redactar'}</h2></div>${draft ? `<span class="pill ${draft.priority === 'alta' ? 'orange' : 'blue'}">${draft.priority === 'alta' ? 'Prioridad alta' : 'Prioridad normal'}</span>` : '<span class="pill orange">Pendiente</span>'}</div>
      ${questions.length ? `<div class="assistant-questions"><strong>Preguntas necesarias</strong>${questions.map(q => `<p>${esc(q)}</p>`).join('')}</div>` : ''}
      ${draft ? `<div class="assistant-draft-grid">
        <div class="assistant-draft-main"><div class="hstack" style="flex-wrap:wrap"><span class="pill blue">${esc(draft.category)}</span><span class="pill gray">${esc(draft.audience)}</span><span class="pill gray">${esc(draft.suggestedPublishTiming)}</span></div><p class="assistant-summary">${esc(draft.summary)}</p><div class="assistant-draft-body"><p>${esc(draft.body).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p></div></div>
        <aside class="assistant-notes">${notes.length ? `<h3 class="card-title">Notas editoriales</h3>${notes.map(n => `<p>${esc(n)}</p>`).join('')}` : '<h3 class="card-title">Notas editoriales</h3><p>Sin observaciones adicionales.</p>'}${flags.length ? `<div class="divider"></div><h3 class="card-title">Alertas</h3>${flags.map(f => `<p class="assistant-flag">${esc(f)}</p>`).join('')}` : ''}</aside>
      </div>${renderNotifyBlock()}<div class="hstack"><button class="btn primary" data-assistant-publish type="button">${icon('megaphone')} Publicar en comunicados</button><button class="btn secondary" data-assistant-copy type="button">Copiar texto</button></div>` : ''}
    </section>`;
  }
  function renderNotifyBlock() {
    const meta = state.mailMeta;
    const counts = meta?.counts || { students: 0, professors: 0, test: 0, ceal: 0 };
    const g = state.notifyGroups || { test: false, ceal: false, students: false, professors: false };
    const selected = (g.test ? (counts.test || 0) : 0) + (g.ceal ? (counts.ceal || 0) : 0) + (g.students ? counts.students : 0) + (g.professors ? counts.professors : 0);
    const configured = Boolean(meta?.configured);
    const hint = !configured
      ? `<p class="notify-hint warn">${icon('eye')} El envío por correo aún no está activo en el servidor. El comunicado se publicará igual.</p>`
      : selected
        ? `<p class="notify-hint">${icon('check')} Se enviará a <strong>${selected}</strong> ${selected === 1 ? 'persona' : 'personas'} con copia oculta (BCC), desde el correo del CEIC.</p>`
        : `<p class="notify-hint muted">Opcional: marca a quién avisar por correo al publicar.</p>`;
    return `<div class="notify-block">
      <span class="kicker">${icon('megaphone')} Avisar por correo al publicar</span>
      <div class="notify-options">
        <label class="notify-opt is-test"><input type="checkbox" data-notify-group="test" ${g.test ? 'checked' : ''} /> <span>Test</span> <span class="notify-count">${counts.test || 0}</span></label>
        <label class="notify-opt is-ceal"><input type="checkbox" data-notify-group="ceal" ${g.ceal ? 'checked' : ''} /> <span>CEAL</span> <span class="notify-count">${counts.ceal || 0}</span></label>
        <label class="notify-opt"><input type="checkbox" data-notify-group="students" ${g.students ? 'checked' : ''} /> <span>Alumnos</span> <span class="notify-count">${counts.students}</span></label>
        <label class="notify-opt"><input type="checkbox" data-notify-group="professors" ${g.professors ? 'checked' : ''} /> <span>Profesores</span> <span class="notify-count">${counts.professors}</span></label>
      </div>
      ${hint}
    </div>`;
  }

  function renderManagement() {
    const pendingMaterial = Data.resources.filter(r => r.status === 'pendienteRevision');
    const actions = [
      ['megaphone', 'Publicar comunicado', 'Redacta con ayuda del asistente y avisa por correo.', '/comunicados/nuevo'],
      ['file', 'Registrar seguimiento', 'Acta de acuerdos y compromisos con la carrera.', '/gestion/acuerdos/nuevo'],
      ['book', 'Validar material', pendingMaterial.length ? `${pendingMaterial.length} recurso${pendingMaterial.length === 1 ? '' : 's'} esperando revisión.` : 'No hay recursos pendientes.', pendingMaterial[0] ? `/gestion/material/${pendingMaterial[0].id}/validar` : '/material']
    ];
    const actionCards = actions.map(([ico, title, desc, href]) => `<a class="management-card" href="#${href}"><span class="icon-box">${icon(ico)}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span></a>`).join('');
    const communicationRows = Data.communications.slice(0, 5).map(c => `<a class="link-card-row" href="#/gestion/comunicados/${c.id}/editar"><span><strong>${esc(c.title)}</strong><span>${esc(c.category)} - ${fmtDate(c.date)}</span></span><span class="link">Editar ${icon('arrow')}</span></a>`).join('');
    const materialRows = Data.resources.filter(r => r.status === 'pendienteRevision').concat(Data.resources.filter(r => r.status !== 'pendienteRevision')).slice(0, 5).map(r => {
      const href = r.status === 'pendienteRevision' ? `/gestion/material/${r.id}/validar` : `/material/${r.id}`;
      const action = r.status === 'pendienteRevision' ? 'Validar' : 'Ver';
      return `<a class="link-card-row" href="#${href}"><span><strong>${esc(r.title)}</strong><span>${esc(r.courseName)} - ${esc(r.type)}</span></span><span class="hstack">${badge(r.status)}<span class="link">${action} ${icon('arrow')}</span></span></a>`;
    }).join('');
    const agreementRows = Data.agreements.slice(0, 4).map(a => `<a class="link-card-row" href="#/acuerdos/${a.id}"><span><strong>${esc(a.number || a.title)}</strong><span>${esc(a.title)} - ${fmtDate(a.date)}</span></span>${badge(a.status)}</a>`).join('');
    return `${pageHead('Gestión CEAL', 'Material, comunicados y seguimientos', `<span class="pill blue">Acceso CEAL</span>`)}
      <div class="vstack">
        <div class="stat-grid compact management-kpis">${stat('book', pendingMaterial.length, 'Material', 'Por validar')}${stat('megaphone', Data.communications.length, 'Comunicados', 'Publicados')}${stat('file', Data.agreements.filter(a => a.status !== 'publicado').length, 'Acuerdos', 'En curso')}</div>
        <section class="card pad"><h2 class="card-title">Acciones del centro</h2><div class="management-modules">${actionCards}</div></section>
        <div class="management-content-grid">
          <section class="card pad"><div class="row-between"><h2 class="card-title">Comunicados publicados</h2><a class="btn secondary sm" href="#/comunicados/nuevo">${icon('megaphone')} Crear</a></div><div class="card-list">${communicationRows || '<p class="small muted">No hay comunicados cargados.</p>'}</div></section>
          <section class="card pad"><div class="row-between"><h2 class="card-title">Material y aportes</h2><a class="btn secondary sm" href="#/material/subir">Subir material</a></div><div class="card-list">${materialRows || '<p class="small muted">No hay material cargado.</p>'}</div></section>
          <section class="card pad"><div class="row-between"><h2 class="card-title">Acuerdos y seguimiento</h2><a class="btn secondary sm" href="#/gestion/acuerdos/nuevo">Nuevo seguimiento</a></div><div class="card-list">${agreementRows || '<p class="small muted">No hay seguimientos cargados.</p>'}</div></section>
        </div>
      </div>`;
  }
  function ensureCEAL(content) { return hasCealAccess() ? content : `${pageHead('Sin permisos', 'Esta sección es de uso interno CEAL')}<section class="card pad empty-state"><span class="icon-wrap">${icon('settings')}</span><h3>Acceso restringido</h3><button class="btn secondary" data-logout>Cambiar rol</button></section>`; }
  function renderEditor(id) {
    const c = Data.communications.find(x => x.id === id) || { ...(Data.communications[0] || {}), id: id || '' };
    return `${pageHead('Editar comunicado', 'Actualiza contenido antes de publicar', `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="editor-layout"><form class="card pad form" data-form="edit-content"><input type="hidden" name="id" value="${esc(c.id || '')}" /><div class="form-field"><label for="f-edit-title">Título</label><input id="f-edit-title" class="input" name="title" value="${esc(c.title || '')}" required /></div><div class="form-grid"><div class="form-field"><label for="f-edit-category">Categoría</label><select id="f-edit-category" class="select" name="category">${['Contingencia','Académico','Material','CEAL'].map(x => `<option ${plain(c.category) === plain(x) ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="form-field"><label for="f-edit-summary">Resumen</label><input id="f-edit-summary" class="input" name="summary" value="${esc(c.summary || '')}" required /></div></div><div class="form-field"><label for="f-edit-body">Contenido</label><textarea id="f-edit-body" class="textarea" name="body" required>${esc(c.body || '')}</textarea></div><div class="hstack"><button class="btn secondary" type="submit">Guardar borrador</button><button class="btn primary" type="button" data-publish>Publicar</button></div></form><aside class="card pad"><h2 class="card-title">Vista previa</h2>${c.id ? commCard(c) : '<p class="small muted">Completa el comunicado.</p>'}</aside></div>`;
  }
  function renderValidateMaterial(id) { const r = Data.resources.find(x => x.id === id) || Data.resources.find(x => x.status === 'pendienteRevision') || Data.resources[0]; return r ? `${pageHead('Validar material', `${r.title} - ${r.courseName}`, `<a class="btn secondary" href="#/gestion">Volver</a>`)}<div class="split"><section class="card pad">${renderResourceDetail(r)}</section><aside class="card pad"><h2 class="card-title">Revisión CEAL</h2><div class="form-field"><label>Observaciones</label><textarea class="textarea" placeholder="Agrega observaciones internas"></textarea></div><button class="btn primary full" data-approve-material="${esc(r.id)}">Validar y publicar</button><button class="btn danger full" data-observe-material="${esc(r.id)}">Marcar con observaciones</button></aside></div>` : renderNotFound(); }
  function renderAgreementForm() { return `${pageHead('Nuevo seguimiento', 'Registra una decisión, avance o compromiso académico', `<a class="btn secondary" href="#/gestion">Volver</a>`)}<form class="card pad form" data-form="new-agreement"><div class="form-field"><label for="f-agreement-title">Título del seguimiento</label><input id="f-agreement-title" class="input" name="title" required /></div><div class="form-grid"><div class="form-field"><label for="f-agreement-origin">Origen</label><input id="f-agreement-origin" class="input" name="origin" required placeholder="Pleno, mesa, comunicado" /></div><div class="form-field"><label for="f-agreement-status">Estado inicial</label><select id="f-agreement-status" class="select" name="status"><option value="enSeguimiento">En seguimiento</option><option value="pendiente">Pendiente</option><option value="publicado">Publicado</option></select></div></div><div class="form-field"><label for="f-agreement-summary">Resumen</label><textarea id="f-agreement-summary" class="textarea" name="summary" required minlength="20"></textarea></div><div class="form-grid"><div class="form-field"><label for="f-agreement-responsible">Responsable</label><input id="f-agreement-responsible" class="input" name="responsible" value="${esc(state.user.label)}" required /></div><div class="form-field"><label for="f-agreement-nextstep">Próximo paso</label><input id="f-agreement-nextstep" class="input" name="nextStep" required /></div></div><div class="form-field"><label for="f-agreement-commitment">Compromiso inicial</label><input id="f-agreement-commitment" class="input" name="commitment" placeholder="Opcional" /></div><div class="hstack"><button class="btn primary" type="submit">Crear seguimiento</button></div></form>`; }

  function renderProfile() {
    const u = state.user;
    if (isGuest()) {
      return `<div class="profile-view">${pageHead('Invitado', 'Vista sin registros', `<button class="btn ghost danger-lite profile-logout" data-logout>${icon('x')}<span class="profile-logout-label">Salir</span></button>`)}
        <section class="card pad profile-card"><div class="profile-hero guest-profile"><span class="avatar big">${esc(u.initials)}</span><div><h2 class="card-title">Modo invitado</h2><div class="profile-pills">${badge('blue','Solo lectura')}<span class="pill gray">No guarda sesión</span></div><p class="small muted">Puedes revisar mallas, material, calendario y comunicados sin dejar registros en el portal.</p></div><a class="btn primary" href="#/mallas">Ver mallas</a></div></section>
        <div class="grid four profile-access-grid">${access('grid','Mallas','Plan O y Plan P integrados.','Abrir','/mallas','blue')}${access('book','Material','Recursos visibles por ramo.','Explorar','/material')}${access('megaphone','Comunicados','Avisos y actualizaciones de la carrera.','Abrir','/comunicados')}${access('calendar','Calendario','Fechas académicas oficiales.','Revisar','/calendario')}</div></div>`;
    }
    const roleLabel = accountRoleLabel(u);
    const profileContext = u.role === 'student' ? `${planShort(u.plan)} - ${u.yearLabel}` : u.yearLabel;
    const profileAction = hasJefaturaAccess()
      ? `<a class="btn secondary profile-primary-action" href="#/jefatura">${icon('users')} Ver jefatura</a>`
      : `<a class="btn secondary profile-primary-action" href="#/mallas">${icon('grid')} Ver mi malla</a>`;
    return `<div class="profile-view">${pageHead('Mi cuenta', 'Perfil, preferencias y seguimiento personal', `<button class="btn ghost danger-lite profile-logout" data-logout>${icon('x')}<span class="profile-logout-label">Cerrar sesión</span></button>`)}<section class="card pad profile-card"><div class="profile-hero"><span class="avatar big">${esc(u.initials)}</span><div class="profile-main-copy"><h2 class="card-title">${esc(u.name)}</h2><div class="profile-pills">${badge('green','Cuenta activa')}<span class="pill blue">${esc(roleLabel)}</span><span class="pill gray">${esc(profileContext)}</span></div><p class="small muted">${esc(u.email)}</p></div>${profileAction}</div></section><div class="grid four profile-stats-grid">${stat('grid', Data.saved.courses.length, 'Ramos', 'Seguimiento')}${stat('book', Data.saved.resources.length, 'Recursos', 'Guardados')}${stat('calendar', Data.events.length, 'Fechas', 'Visibles')}${stat('bell', Data.saved.reminders.length, 'Recordatorios', 'Activos')}</div><div class="grid two profile-detail-grid"><section class="card pad profile-card"><h2 class="card-title">Actividad reciente</h2>${Data.notifications.map(n => `<a class="link-card-row" href="#${esc(n.route)}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} - ${esc(n.date)}</span></span>${icon('arrow')}</a>`).join('')}</section><section class="card pad profile-card"><h2 class="card-title">Preferencias</h2>${(() => { const prefs = getPrefs(); return PREF_DEFS.map(([key, label]) => `<label class="link-card-row"><span><strong>${label}</strong><span>${prefs[key] ? 'Activado' : 'Desactivado'}</span></span><input type="checkbox" data-pref="${key}" ${prefs[key] ? 'checked' : ''} /></label>`).join(''); })()}</section></div></div>`;
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
    return `${pageHead('Búsqueda', q ? `Resultados para ${q}` : 'Busca ramos, material, fechas, comunicados y acuerdos')}<section class="card pad"><form data-search-page-form class="form-field"><label>Buscar</label><input class="input" name="q" value="${esc(q)}" /></form></section><section class="result-group">${rows.join('') || renderEmpty('Sin resultados', 'Prueba con otro término.')}</section>`;
  }
  function resultRow(ico, title, desc, route) { return `<a class="result-row" href="#${route}"><span class="icon-box">${icon(ico)}</span><span><strong>${esc(title)}</strong><p>${esc(desc)}</p></span><span class="link">Abrir ${icon('arrow')}</span></a>`; }
  function renderNotificationsPage() {
    if (!canSeeNotifications()) return renderNotFound('Las notificaciones están disponibles en el modo estudiante.');
    const items = studentNotifications();
    return `${pageHead('Notificaciones', 'Comunicados nuevos')}<section class="card pad">${items.length ? items.map(n => `<a class="link-card-row" href="#${esc(n.route)}"><span><strong>${esc(n.title)}</strong><span>${esc(n.detail)} · ${fmtDate(n.date)}</span></span>${badge('orange', 'Nueva')}</a>`).join('') : renderEmpty('Estás al día', 'Los comunicados nuevos aparecerán aquí.', '', 'bell')}</section>`;
  }
  function renderNotificationPopover() {
    const items = studentNotifications();
    const rows = items.length
      ? items.map(n => `<a class="not-row" href="#${esc(n.route)}"><span class="not-dot"></span><span><strong>${esc(n.title)}</strong><p>${esc(n.detail)}</p><small>${fmtDate(n.date)}</small></span></a>`).join('')
      : `<div class="not-empty">${icon('check')}<span>Estás al día.</span></div>`;
    return `<aside class="notification-popover" role="dialog" aria-modal="true" aria-label="Notificaciones"><header><strong>Notificaciones</strong><button class="icon-btn" data-close-notifications aria-label="Cerrar notificaciones">${icon('x')}</button></header>${rows}</aside>`;
  }
  function renderNotFound(message = 'No encontramos la vista solicitada.') { return `${pageHead('No encontrado')}<section class="card pad empty-state"><span class="icon-wrap">${icon('search')}</span><h3>${esc(message)}</h3><a class="btn primary" href="#/">Volver al inicio</a></section>`; }
  function skeletonList(n = 3) {
    return `<div class="skeleton-list">${Array.from({ length: n }, () => `<div class="skeleton-card"><span class="skeleton skeleton-title"></span><span class="skeleton skeleton-line"></span><span class="skeleton skeleton-line" style="width:70%"></span></div>`).join('')}</div>`;
  }
  function renderLoading(title = 'Cargando', desc = 'Un momento, estamos cargando el contenido.') { return `${pageHead(esc(title), 'Cargando…')}<section class="card pad empty-state loading-state"><span class="btn-spinner" style="width:28px;height:28px;border-width:3px;color:var(--blue-600)"></span><h3>${esc(title)}</h3><p>${esc(desc)}</p></section>`; }
  function renderEmpty(title, desc, action = '', ico = 'search') { return `<div class="empty-state"><span class="icon-wrap">${icon(ico)}</span><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}${action || ''}</div>`; }
  function timeline(items) { return `<div class="timeline">${items.map(h => `<div class="timeline-row"><span class="timeline-dot"></span><div class="timeline-content"><strong>${esc(h.title)}</strong><span>${h.at ? `${fmtDate(h.at)} - ` : ''}${esc(h.detail || '')}</span></div></div>`).join('')}</div>`; }

  async function onClick(e) {
    if (e.target.closest('[data-dismiss-toast]')) { if (toastTimer) clearTimeout(toastTimer); state.toast = null; render({ scope: 'overlay', resetScroll: false }); return; }
    if (e.target.closest('[data-portal-theme-toggle]')) {
      setPortalTheme(!state.portalDark);
      return;
    }
    const devLogin = e.target.closest('[data-dev-login]');
    if (devLogin && isLocalDevHost()) {
      try {
        saveSession(await qaSessionFor(devLogin.dataset.devLogin));
        routeTo(consumePostLoginRoute());
      } catch (error) {
        showToast(error.message || 'No se pudo iniciar la sesión de revisión.', 'error');
      }
      return;
    }
    const googleRedirect = e.target.closest('[data-google-redirect]');
    if (googleRedirect) { startGoogleRedirect(googleRedirect.dataset.googleRedirect); return; }
    const role = e.target.closest('[data-login-role]')?.dataset.loginRole;
    if (role) { routeTo('/login'); return; }
    if (e.target.closest('[data-logout]')) {
      if (API_BASE) apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('portal.session');
      state.user = null;
      routeTo('/login');
      return;
    }
    if (e.target.closest('[data-open-menu]')) {
      state.menuOpen = true;
      render({ transition: true, scope: 'overlay', resetScroll: false });
      document.querySelector('.menu-sheet [data-close-menu]')?.focus();
      return;
    }
    if (e.target.closest('[data-close-menu]')) {
      state.menuOpen = false;
      render({ transition: true, scope: 'overlay', resetScroll: false });
      document.querySelector('[data-open-menu]')?.focus();
      return;
    }
    if (e.target.closest('[data-toggle-notifications]')) {
      state.notificationsOpen = !state.notificationsOpen;
      render({ transition: true, scope: 'overlay' });
      if (state.notificationsOpen) document.querySelector('.notification-popover [data-close-notifications]')?.focus();
      return;
    }
    const calendarMonthButton = e.target.closest('[data-calendar-month]');
    if (calendarMonthButton) {
      const delta = Number(calendarMonthButton.dataset.calendarMonth || 0);
      const base = state.calendarMonth || parseCalendarDate(portalTodayKey());
      const nextMonth = new Date(base.getFullYear(), base.getMonth() + delta, 1);
      const monthEvents = (Data.events || []).filter(event => {
        const date = parseCalendarDate(event.date);
        return date.getFullYear() === nextMonth.getFullYear() && date.getMonth() === nextMonth.getMonth();
      }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      state.calendarMonth = nextMonth;
      state.calendarSelectedDate = String(monthEvents[0]?.date || isoCalendarDate(nextMonth.getFullYear(), nextMonth.getMonth(), 1)).slice(0, 10);
      routeTo(`/calendario?date=${encodeURIComponent(state.calendarSelectedDate)}`);
      return;
    }
    if (e.target.closest('[data-calendar-today]')) {
      const today = portalTodayKey();
      state.calendarMonth = parseCalendarDate(today);
      state.calendarSelectedDate = today;
      routeTo(`/calendario?date=${today}`);
      return;
    }
    const calendarDateButton = e.target.closest('[data-calendar-date]');
    if (calendarDateButton) {
      const date = String(calendarDateButton.dataset.calendarDate || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      state.calendarMonth = parseCalendarDate(date);
      state.calendarSelectedDate = date;
      routeTo(`/calendario?date=${encodeURIComponent(date)}`);
      return;
    }
    const rsvTableBtn = e.target.closest('[data-rsv-table]');
    if (rsvTableBtn) { state.rsvTable = rsvTableBtn.dataset.rsvTable; state.rsvBlock = null; render({ transition: false, scope: 'panel', resetScroll: false }); return; }
    const rsvDateBtn = e.target.closest('[data-rsv-date]');
    if (rsvDateBtn) { state.rsvDate = rsvDateBtn.dataset.rsvDate; state.rsvBlock = null; render({ transition: false, scope: 'panel', resetScroll: false }); return; }
    const rsvBlockBtn = e.target.closest('[data-rsv-block]');
    if (rsvBlockBtn) { state.rsvBlock = state.rsvBlock === rsvBlockBtn.dataset.rsvBlock ? null : rsvBlockBtn.dataset.rsvBlock; render({ transition: false, scope: 'panel', resetScroll: false }); return; }
    if (e.target.closest('[data-rsv-copy-pay]')) { copyText(rsvPayClipboard()).catch(() => {}); showToast('Datos de transferencia copiados', 'blue'); return; }
    if (e.target.closest('[data-rsv-create]')) {
      if (isGuest()) { readonlyToast(); return; }
      if (state.rsvSubmitting) return;
      const table = state.rsvTable, date = state.rsvDate, block = state.rsvBlock;
      if (!table || !date || !block) { showToast('Elige un bloque libre primero', 'blue'); return; }
      state.rsvSubmitting = true;
      render({ transition: false, scope: 'panel', resetScroll: false });
      try {
        const item = await reservationAction('create', { table, date, block });
        state.rsvBlock = null;
        state.rsvJustCreated = item?.id || null;
        showToast('Reserva preconfirmada. Ahora realiza el pago para confirmarla.', 'green');
      } catch (error) {
        if (!error?.isSessionExpired) showToast(error.message || 'No se pudo crear la reserva', 'orange');
      } finally {
        state.rsvSubmitting = false;
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const rsvPayBtn = e.target.closest('[data-rsv-pay]');
    if (rsvPayBtn) {
      if (state.rsvActionBusy) return;
      const id = rsvPayBtn.dataset.rsvPay;
      const method = rsvPayBtn.dataset.rsvMethod === 'presencial' ? 'presencial' : 'transferencia';
      state.rsvActionBusy = `pay:${id}`;
      render({ transition: false, scope: 'panel', resetScroll: false });
      try {
        await reservationAction('pay', { id, method });
        showToast(method === 'presencial' ? 'Listo. Paga presencial antes del turno; la tesorería confirmará tu bloque.' : 'Aviso enviado. La tesorería verificará la transferencia y confirmará tu bloque.', 'green');
      } catch (error) {
        if (!error?.isSessionExpired) showToast(error.message || 'No se pudo avisar el pago', 'orange');
      } finally {
        state.rsvActionBusy = '';
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const rsvCancelBtn = e.target.closest('[data-rsv-cancel]');
    if (rsvCancelBtn) {
      if (state.rsvActionBusy) return;
      if (!window.confirm('¿Cancelar esta reserva? El bloque quedará disponible para otra persona.')) return;
      const id = rsvCancelBtn.dataset.rsvCancel;
      state.rsvActionBusy = `cancel:${id}`;
      render({ transition: false, scope: 'panel', resetScroll: false });
      try {
        await reservationAction('cancel', { id });
        showToast('Reserva cancelada y bloque liberado.', 'blue');
      } catch (error) {
        if (!error?.isSessionExpired) showToast(error.message || 'No se pudo cancelar', 'orange');
      } finally {
        state.rsvActionBusy = '';
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const rsvConfirmBtn = e.target.closest('[data-rsv-confirm]');
    if (rsvConfirmBtn) {
      if (!hasCealAccess()) { readonlyToast(); return; }
      if (state.rsvActionBusy) return;
      const id = rsvConfirmBtn.dataset.rsvConfirm;
      state.rsvActionBusy = `confirm:${id}`;
      render({ transition: false, scope: 'panel', resetScroll: false });
      try {
        await reservationAction('confirm', { id });
        showToast('Pago confirmado. Avisamos por correo a quien reservó.', 'green');
      } catch (error) {
        if (!error?.isSessionExpired) showToast(error.message || 'No se pudo confirmar', 'orange');
      } finally {
        state.rsvActionBusy = '';
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const rsvRejectBtn = e.target.closest('[data-rsv-reject]');
    if (rsvRejectBtn) {
      if (!hasCealAccess()) { readonlyToast(); return; }
      if (state.rsvActionBusy) return;
      if (!window.confirm('¿Rechazar esta reserva? Se liberará el bloque y avisaremos a quien reservó.')) return;
      const id = rsvRejectBtn.dataset.rsvReject;
      state.rsvActionBusy = `reject:${id}`;
      render({ transition: false, scope: 'panel', resetScroll: false });
      try {
        await reservationAction('reject', { id });
        showToast('Reserva rechazada y bloque liberado.', 'blue');
      } catch (error) {
        if (!error?.isSessionExpired) showToast(error.message || 'No se pudo rechazar', 'orange');
      } finally {
        state.rsvActionBusy = '';
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    if (e.target.closest('[data-close-notifications]')) {
      state.notificationsOpen = false;
      render({ transition: true, scope: 'overlay' });
      document.querySelector('[data-toggle-notifications]')?.focus();
      return;
    }
    if (e.target.closest('[data-appointments-refresh]')) {
      state.myAppointments = null;
      state.myApptsError = '';
      state.myApptsSlow = false;
      render({ transition: true, scope: 'panel', resetScroll: false });
      return;
    }
    if (e.target.closest('[data-calendar-refresh]')) {
      state.calendarStatus = null;
      state.calendarStatusError = '';
      state.staffBusy = null;
      state.staffBusyError = '';
      render({ transition: true, scope: 'panel', resetScroll: false });
      return;
    }
    if (e.target.closest('[data-calendar-connect]')) {
      if (!hasJefaturaAccess()) { readonlyToast(); return; }
      state.calendarStatusLoading = true;
      state.calendarStatusError = '';
      render({ transition: true, scope: 'panel', resetScroll: false });
      try {
        const payload = await calendarOAuthStartRequest();
        if (!payload.authUrl) throw new Error('Google no entregó URL de autorización.');
        location.assign(payload.authUrl);
      } catch (error) {
        state.calendarStatusLoading = false;
        state.calendarStatusError = error.message || 'No se pudo iniciar OAuth Calendar.';
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    if (e.target.closest('[data-calendar-disconnect]')) {
      if (!hasJefaturaAccess()) { readonlyToast(); return; }
      state.calendarStatusLoading = true;
      state.calendarStatusError = '';
      render({ transition: true, scope: 'panel', resetScroll: false });
      try {
        const payload = await calendarDisconnectRequest();
        state.calendarStatus = payload.status || null;
        showToast('Google Calendar desconectado', 'blue');
      } catch (error) {
        state.calendarStatusError = error.message || 'No se pudo desconectar Calendar.';
      } finally {
        state.calendarStatusLoading = false;
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    if (e.target.closest('[data-calendar-verify]')) {
      if (!hasJefaturaAccess()) { readonlyToast(); return; }
      state.calendarStatusLoading = true;
      state.calendarStatusError = '';
      render({ transition: true, scope: 'panel', resetScroll: false });
      try {
        const payload = await calendarVerifyRequest();
        state.calendarStatus = payload.status || null;
        state.staffBusy = null;
        state.staffBusyError = '';
        showToast('Conexión de Calendar verificada', 'green');
      } catch (error) {
        state.calendarStatusError = error.message || 'No se pudo verificar Calendar.';
      } finally {
        state.calendarStatusLoading = false;
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const bookSlot = e.target.closest('[data-book-slot]');
    if (bookSlot) {
      state.bookingSlotKey = state.bookingSlotKey === bookSlot.dataset.bookSlot ? null : bookSlot.dataset.bookSlot;
      render({ transition: false, scope: 'panel', resetScroll: false });
      return;
    }
    if (e.target.closest('[data-appointment-create]')) {
      if (isGuest()) { readonlyToast(); return; }
      const profile = (Data.staffProfiles || [])[0] || {};
      const store = API_BASE ? { appointments: state.myAppointments || [], closedSlots: state.staffClosedSlots || [] } : readBookingStore();
      const slot = availableBookingSlots(profile, store).find(s => slotKey(s) === state.bookingSlotKey);
      if (!slot) { showToast('Elige una hora disponible primero', 'blue'); return; }
      if (String(state.bookingReason || '').trim().length < 5) { showToast('Indica brevemente el motivo', 'blue'); return; }
      state.bookingSubmitting = true;
      render({ transition: false, scope: 'panel', resetScroll: false });
      try {
        if (API_BASE) {
          const payload = await apiRequest('/calendar/appointments', { method: 'POST', body: JSON.stringify({ start: slot.start.toISOString(), end: slot.end.toISOString(), reason: state.bookingReason }) });
          if (payload.item) state.myAppointments = [payload.item, ...(state.myAppointments || []).filter(item => item.id !== payload.item.id)];
          state.staffClosedSlots = payload.availability?.closedSlots || state.staffClosedSlots;
          state.appointmentBusy = payload.availability?.occupied || state.appointmentBusy;
        } else {
          const appt = { id: `apt-${Date.now()}`, studentEmail: state.user?.email || '', studentName: state.user?.name || 'Estudiante', start: slot.start.toISOString(), end: slot.end.toISOString(), mode: slot.mode || 'Presencial', place: slot.place || 'Departamento de Ingeniería Civil', reason: state.bookingReason, status: 'confirmada', staffNote: '', createdAt: new Date().toISOString() };
          store.appointments.unshift(appt);
          writeBookingStore(store);
        }
        state.bookingSlotKey = null;
        state.bookingReason = '';
        showToast('Hora reservada', 'green');
      } catch (error) {
        if (!error?.isSessionExpired) showToast(error.message || 'No se pudo reservar la hora', 'orange');
      } finally {
        state.bookingSubmitting = false;
        render({ transition: true, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const appointmentCancel = e.target.closest('[data-appointment-cancel]');
    if (appointmentCancel) {
      if (isGuest()) { readonlyToast(); return; }
      const id = appointmentCancel.dataset.appointmentCancel;
      const target = (state.myAppointments || readBookingStore().appointments || []).find(item => item.id === id);
      const cancelMessage = hasJefaturaAccess()
        ? `¿Cancelar la hora de ${target?.studentName || target?.studentEmail || 'este estudiante'}? Se le enviará un correo para reagendar y este horario quedará cerrado.`
        : '¿Cancelar tu hora? El bloque volverá a quedar disponible.';
      if (!window.confirm(cancelMessage)) return;
      if (API_BASE) {
        try {
          const payload = await apiRequest(`/calendar/appointments/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) });
          if (payload.item) state.myAppointments = (state.myAppointments || []).map(item => item.id === id ? payload.item : item);
          state.staffClosedSlots = payload.availability?.closedSlots || state.staffClosedSlots;
          state.appointmentBusy = payload.availability?.occupied || state.appointmentBusy;
        } catch (error) { if (!error?.isSessionExpired) showToast(error.message || 'No se pudo cancelar', 'orange'); return; }
      } else {
        const store = readBookingStore();
        const appt = store.appointments.find(a => a.id === id);
        if (!appt || !APPT_ACTIVE.has(appt.status)) return;
        appt.status = 'cancelada';
        appt.cancelledBy = hasJefaturaAccess() ? 'jefatura' : 'student';
        if (hasJefaturaAccess()) {
          const key = `${new Date(appt.start).toISOString()}|${new Date(appt.end).toISOString()}`;
          if (!(store.closedSlots || []).includes(key)) store.closedSlots = [...(store.closedSlots || []), key];
        }
        writeBookingStore(store);
      }
      showToast(hasJefaturaAccess() ? 'Hora cancelada y horario cerrado' : 'Hora cancelada', 'blue');
      render({ transition: true, scope: 'panel', resetScroll: false });
      return;
    }
    const availabilityClose = e.target.closest('[data-availability-close]');
    if (availabilityClose) {
      if (!hasJefaturaAccess()) { readonlyToast(); return; }
      const k = availabilityClose.dataset.availabilityClose;
      if (API_BASE) {
        try { const payload = await apiRequest('/calendar/availability', { method: 'PATCH', body: JSON.stringify({ slotKey: k, closed: true }) }); state.staffClosedSlots = payload.availability?.closedSlots || state.staffClosedSlots; }
        catch (error) { if (!error?.isSessionExpired) showToast(error.message || 'No se pudo cerrar la hora', 'orange'); return; }
      } else {
        const store = readBookingStore();
        if (!(store.closedSlots || []).includes(k)) { store.closedSlots = [...(store.closedSlots || []), k]; writeBookingStore(store); }
      }
      render({ transition: false, scope: 'panel', resetScroll: false });
      return;
    }
    const availabilityOpen = e.target.closest('[data-availability-open]');
    if (availabilityOpen) {
      if (!hasJefaturaAccess()) { readonlyToast(); return; }
      const k = availabilityOpen.dataset.availabilityOpen;
      if (API_BASE) {
        try { const payload = await apiRequest('/calendar/availability', { method: 'PATCH', body: JSON.stringify({ slotKey: k, closed: false }) }); state.staffClosedSlots = payload.availability?.closedSlots || state.staffClosedSlots; }
        catch (error) { if (!error?.isSessionExpired) showToast(error.message || 'No se pudo reabrir la hora', 'orange'); return; }
      } else {
        const store = readBookingStore();
        store.closedSlots = (store.closedSlots || []).filter(x => x !== k);
        writeBookingStore(store);
      }
      render({ transition: false, scope: 'panel', resetScroll: false });
      return;
    }
    if (e.target.closest('[data-clear-panel]')) { state.selectedCourse = null; state.selectedResourceId = null; render({ transition: true, scope: 'panel' }); return; }
    const saveCourse = e.target.closest('[data-save-course]');
    if (saveCourse) { if (isGuest()) { readonlyToast(); return; } const key = saveCourse.dataset.saveCourse; if (!Data.saved.courses.includes(key)) Data.saved.courses.push(key); persistSnapshot(); apiRequest('/saved', { method: 'POST', body: JSON.stringify({ kind:'courses', id:key }) }).catch(() => {}); showToast('Ramo agregado a seguimiento'); return; }
    const saveResource = e.target.closest('[data-save-resource]');
    if (saveResource) { if (isGuest()) { readonlyToast(); return; } const id = saveResource.dataset.saveResource; if (!Data.saved.resources.includes(id)) Data.saved.resources.push(id); persistSnapshot(); apiRequest('/saved', { method: 'POST', body: JSON.stringify({ kind:'resources', id }) }).catch(() => {}); showToast('Recurso guardado'); return; }
    const download = e.target.closest('[data-download-resource]');
    if (download) { const r = Data.resources.find(x => x.id === download.dataset.downloadResource); if (r) { downloadResource(r); showToast(r.externalUrl ? 'Abriendo material' : 'Descarga preparada', 'blue'); } return; }
    if (e.target.closest('[data-report-resource]')) { if (isGuest()) { readonlyToast(); return; } showToast('Reporte recibido para revisión CEAL', 'blue'); return; }
    const markRead = e.target.closest('[data-mark-read]');
    if (markRead) { if (isGuest()) { readonlyToast(); return; } const c = Data.communications.find(x => x.id === markRead.dataset.markRead); if (c) { c.unread = false; markCommRead(c.id); } persistSnapshot(); showToast('Comunicado marcado como leído', 'blue'); return; }
    if (e.target.closest('[data-copy-link]')) { copyText(location.href).catch(() => {}); showToast('Enlace copiado', 'blue'); return; }
    const reminder = e.target.closest('[data-save-reminder]');
    if (reminder) { if (isGuest()) { readonlyToast(); return; } const id = reminder.dataset.saveReminder; if (!Data.saved.reminders.includes(id)) Data.saved.reminders.push(id); persistSnapshot(); apiRequest('/saved', { method:'POST', body:JSON.stringify({ kind:'reminders', id }) }).catch(() => {}); showToast('Recordatorio guardado', 'blue'); return; }
    const approve = e.target.closest('[data-approve-material]');
    if (approve) { if (isGuest()) { readonlyToast(); return; } const r = Data.resources.find(x => x.id === approve.dataset.approveMaterial); if (r) { r.status = 'validadoCeal'; persistSnapshot(); apiRequest(`/materials/${encodeURIComponent(r.id)}`, { method:'PATCH', body:JSON.stringify({ status:'validadoCeal' }) }).catch(() => {}); } showToast('Material validado y publicado'); return; }
    const observe = e.target.closest('[data-observe-material]');
    if (observe) { if (isGuest()) { readonlyToast(); return; } const r = Data.resources.find(x => x.id === observe.dataset.observeMaterial); if (r) { r.status = 'observado'; persistSnapshot(); apiRequest(`/materials/${encodeURIComponent(r.id)}`, { method:'PATCH', body:JSON.stringify({ status:'observado' }) }).catch(() => {}); } showToast('Material marcado con observaciones', 'blue'); return; }
    const publish = e.target.closest('[data-publish]');
    if (publish) { if (isGuest()) { readonlyToast(); return; } const form = publish.closest('form'); if (form) form.requestSubmit(); return; }
    if (e.target.closest('[data-attach-remove]')) {
      state.cealAttachment = null;
      render({ transition: false, scope: 'panel', resetScroll: false });
      return;
    }
    if (e.target.closest('[data-assistant-clear]')) {
      state.cealAssistantRequest = { rawText: '', category: 'Auto', audience: CEAL_ASSISTANT_AUDIENCE, urgency: 'normal', extraContext: '' };
      state.cealAssistantResult = null;
      state.cealAssistantError = '';
      state.cealAttachment = null;
      render({ transition: true, scope: 'panel' });
      return;
    }
    if (e.target.closest('[data-assistant-copy]')) {
      const draft = state.cealAssistantResult?.draft;
      if (draft) copyText(`${draft.title}\n\n${draft.summary}\n\n${draft.body}`).catch(() => {});
      showToast('Borrador copiado', 'blue');
      return;
    }
    const assistantPublishBtn = e.target.closest('[data-assistant-publish]');
    if (assistantPublishBtn) {
      if (!hasCealAccess()) { readonlyToast(); return; }
      if (state.cealAssistantPublishing) return;
      const draft = state.cealAssistantResult?.draft;
      if (!draft) { showToast('Primero genera un borrador', 'blue'); return; }
      const notify = { ...state.notifyGroups };
      const counts = state.mailMeta?.counts || { students: 0, professors: 0, test: 0, ceal: 0 };
      const recipientTotal = (notify.test ? (counts.test || 0) : 0) + (notify.ceal ? (counts.ceal || 0) : 0) + (notify.students ? counts.students : 0) + (notify.professors ? counts.professors : 0);
      if (recipientTotal > 0 && !window.confirm(`Se publicará el comunicado y se enviará por correo a ${recipientTotal} ${recipientTotal === 1 ? 'persona' : 'personas'}. ¿Continuar?`)) return;
      state.cealAssistantPublishing = true;
      setButtonBusy(assistantPublishBtn, 'Publicando…');
      let item = {
        id: `com-ai-${Date.now()}`,
        title: draft.title,
        category: draft.category || 'CEAL',
        date: new Date().toISOString(),
        source: 'CEIC Ingeniería Civil UCN',
        pinned: draft.priority === 'alta',
        unread: true,
        summary: draft.summary,
        body: draft.body,
        related: []
      };
      let notifyResult = null;
      try {
        if (API_BASE) {
          try {
            const payload = await apiRequest('/communications', { method: 'POST', body: JSON.stringify({ ...item, notify }) });
            if (payload.item) item = payload.item;
            notifyResult = payload.notify || null;
          } catch (err) {
            if (err && err.isSessionExpired) return;
            showToast('No se pudo publicar el comunicado. Inténtalo de nuevo.', 'red');
            return;
          }
        }
        Data.communications = Data.communications.filter(c => c.id !== item.id);
        Data.communications.unshift(item);
        state.notifyGroups = { test: false, ceal: false, students: false, professors: false };
        persistSnapshot();
        if (notifyResult?.sent) showToast(`Comunicado publicado y enviado a ${notifyResult.count} ${notifyResult.count === 1 ? 'persona' : 'personas'}`);
        else if (notifyResult && notifyResult.reason === 'not-configured') showToast('Comunicado publicado. El correo aún no está configurado en el servidor.', 'blue');
        else if (notifyResult && notifyResult.reason === 'unauthorized') showToast('Comunicado publicado. No se envió correo: sesión sin permiso (vuelve a iniciar sesión CEAL).', 'blue');
        else if (notifyResult && notifyResult.reason === 'no-recipients') showToast('Comunicado publicado. No había destinatarios en el grupo elegido.', 'blue');
        else if (notifyResult && !notifyResult.sent) showToast(`Comunicado publicado. Correo NO enviado: ${esc(notifyResult.error || notifyResult.reason || 'error')}`, 'blue');
        else showToast('Comunicado publicado');
        routeTo('/comunicados/' + item.id);
      } finally {
        state.cealAssistantPublishing = false;
        render({ transition: false, scope: 'panel', resetScroll: false });
      }
      return;
    }
    if (e.target.closest('[data-survey-builder-clear]')) {
      state.surveyBuilderRequest = { rawText: '', mode: 'auto' };
      state.surveyBuilderResult = null;
      state.surveyBuilderError = '';
      render({ transition: true, scope: 'panel' });
      return;
    }
    const surveyPresetButton = e.target.closest('[data-survey-preset]');
    if (surveyPresetButton) {
      const preset = SurveyPresets[surveyPresetButton.dataset.surveyPreset];
      if (preset) {
        state.surveyBuilderRequest = { rawText: preset.prompt, mode: preset.mode };
        state.surveyBuilderResult = null;
        state.surveyBuilderError = '';
        render({ transition: true, scope: 'panel' });
      }
      return;
    }
    if (e.target.closest('[data-survey-add-question]')) {
      const sv = surveyDraftSurvey();
      if (sv) { sv.questions = sv.questions || []; sv.questions.push({ label: '', type: 'single', required: true, options: ['Opción 1', 'Opción 2'] }); render({ transition: true, scope: 'panel', resetScroll: false }); }
      return;
    }
    const delQuestion = e.target.closest('[data-survey-del-question]');
    if (delQuestion) {
      const sv = state.surveyBuilderResult?.survey;
      if (sv?.questions) { sv.questions.splice(Number(delQuestion.dataset.surveyDelQuestion), 1); render({ transition: true, scope: 'panel', resetScroll: false }); }
      return;
    }
    const addOption = e.target.closest('[data-survey-add-option]');
    if (addOption) {
      const q = state.surveyBuilderResult?.survey?.questions?.[Number(addOption.dataset.surveyAddOption)];
      if (q) { q.options = q.options || []; q.options.push('Nueva opción'); render({ transition: true, scope: 'panel', resetScroll: false }); }
      return;
    }
    const delOption = e.target.closest('[data-survey-del-option]');
    if (delOption) {
      const [qi, oi] = delOption.dataset.surveyDelOption.split(':').map(Number);
      const q = state.surveyBuilderResult?.survey?.questions?.[qi];
      if (q?.options) { q.options.splice(oi, 1); render({ transition: true, scope: 'panel', resetScroll: false }); }
      return;
    }
    if (e.target.closest('[data-survey-refine]')) {
      if (!hasCealAccess()) { readonlyToast(); return; }
      const sv = state.surveyBuilderResult?.survey;
      const instruction = String(state.surveyRefineText || '').trim();
      if (!sv) { showToast('Primero genera una encuesta', 'blue'); return; }
      if (instruction.length < 4) { showToast('Escribe qué quieres ajustar', 'blue'); return; }
      state.surveyBuilderLoading = true;
      state.surveyBuilderError = '';
      setButtonBusy(e.target.closest('[data-survey-refine]'), 'Ajustando…');
      try {
        const payload = await surveyAssistantRequest({ rawText: instruction, mode: sv.mode || 'auto', audience: CEAL_ASSISTANT_AUDIENCE, currentSurvey: sv });
        if (payload.result?.survey) { state.surveyBuilderResult = payload.result; state.surveyRefineText = ''; showToast('Encuesta ajustada', 'blue'); }
        else { state.surveyBuilderError = 'No se pudo ajustar la encuesta.'; }
      } catch (error) {
        if (!(error && error.isSessionExpired)) state.surveyBuilderError = error.message || 'No se pudo ajustar la encuesta.';
      } finally {
        state.surveyBuilderLoading = false;
        render({ transition: false, scope: 'panel', resetScroll: false });
      }
      return;
    }
    const createSurvey = e.target.closest('[data-survey-create]');
    if (createSurvey) {
      if (createSurvey.disabled) return;
      if (!hasCealAccess()) { readonlyToast(); return; }
      const survey = state.surveyBuilderResult?.survey;
      if (!survey) { showToast('Primero genera una encuesta', 'blue'); return; }
      const desiredStatus = createSurvey.dataset.surveyCreate === 'open' ? 'open' : 'draft';
      const originalLabel = createSurvey.innerHTML;
      setButtonBusy(createSurvey, 'Creando…');
      try {
        let item = { ...survey, status: desiredStatus, audience: CEAL_ASSISTANT_AUDIENCE };
        try {
          const payload = await apiRequest('/surveys', { method: 'POST', body: JSON.stringify(item) });
          if (payload.item) item = payload.item;
        } catch (error) {
          if (error && error.isSessionExpired) return;
          showToast(error.message || 'No se pudo crear la encuesta', 'blue');
          return;
        }
        Data.surveys = Data.surveys.filter(s => s.id !== item.id);
        Data.surveys.unshift(item);
        persistSnapshot();
        showToast(desiredStatus === 'open' ? 'Encuesta abierta' : 'Borrador guardado');
        routeTo('/encuestas/' + item.id);
      } finally {
        createSurvey.disabled = false;
        createSurvey.removeAttribute('aria-busy');
        createSurvey.innerHTML = originalLabel;
      }
      return;
    }
    const surveyStatusBtn = e.target.closest('[data-survey-status]');
    if (surveyStatusBtn) {
      if (!hasCealAccess()) { readonlyToast(); return; }
      const id = surveyStatusBtn.dataset.surveyId;
      const nextStatus = surveyStatusBtn.dataset.surveyStatus;
      const survey = Data.surveys.find(s => s.id === id);
      if (!survey) return;
      try {
        const payload = await apiRequest(`/surveys/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
        Object.assign(survey, payload.item || { status: nextStatus });
      } catch {
        survey.status = nextStatus;
      }
      persistSnapshot();
      showToast(nextStatus === 'open' ? 'Consulta abierta' : 'Consulta cerrada', 'blue');
      render({ transition: true, scope: 'panel' });
      return;
    }
    const surveyDelete = e.target.closest('[data-survey-delete]');
    if (surveyDelete) {
      e.preventDefault();
      if (!hasCealAccess()) { readonlyToast(); return; }
      const id = surveyDelete.dataset.surveyDelete;
      const title = surveyDelete.dataset.surveyTitle || 'esta consulta';
      const survey = Data.surveys.find(s => s.id === id);
      if (!survey) return;
      if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer y borra también sus respuestas.`)) return;
      try {
        await apiRequest(`/surveys/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (error) {
        if (error && error.isSessionExpired) return;
        showToast(error.message || 'No se pudo eliminar la consulta', 'blue');
        return;
      }
      Data.surveys = Data.surveys.filter(s => s.id !== id);
      persistSnapshot();
      showToast('Consulta eliminada', 'blue');
      if (getRoute().path.startsWith('/encuestas/')) { routeTo('/encuestas'); }
      else { render({ transition: true, scope: 'panel' }); }
      return;
    }
    const commDelete = e.target.closest('[data-comm-delete]');
    if (commDelete) {
      e.preventDefault();
      if (!canPublishCommunications()) { readonlyToast(); return; }
      const id = commDelete.dataset.commDelete;
      const title = commDelete.dataset.commTitle || 'este comunicado';
      const comm = Data.communications.find(c => c.id === id);
      if (!comm) return;
      if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
      try {
        await apiRequest(`/communications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (error) {
        if (error && error.isSessionExpired) return;
        showToast(error.message || 'No se pudo eliminar el comunicado', 'blue');
        return;
      }
      Data.communications = Data.communications.filter(c => c.id !== id);
      persistSnapshot();
      showToast('Comunicado eliminado', 'blue');
      if (getRoute().path.startsWith('/comunicados/')) { routeTo('/comunicados'); }
      else { render({ transition: true, scope: 'panel' }); }
      return;
    }
    const surveyExport = e.target.closest('[data-survey-export]');
    if (surveyExport) {
      if (!hasCealAccess()) { readonlyToast(); return; }
      if (!API_BASE) { showToast('La exportación XLSX estará disponible cuando se active el servicio de datos', 'blue'); return; }
      const id = surveyExport.dataset.surveyExport;
      try {
        const headers = {};
        if (state.user?.sessionToken) headers.Authorization = `Bearer ${state.user.sessionToken}`;
        const res = await fetch(`${API_BASE}/surveys/${encodeURIComponent(id)}/export`, { headers });
        if (res.status === 401 && state.user?.sessionToken) { handleSessionExpired(); return; }
        if (!res.ok) throw new Error(`export ${res.status}`);
        const blob = await res.blob();
        downloadBlob(`resultados-${slug(id)}.xlsx`, blob);
        showToast('XLSX descargado', 'blue');
      } catch {
        showToast('No se pudo exportar la encuesta', 'blue');
      }
      return;
    }
    const mallaEmbedPlan = e.target.closest('[data-malla-embed-plan]');
    if (mallaEmbedPlan) {
      state.mallaEmbedPlan = mallaEmbedPlan.dataset.mallaEmbedPlan === 'o' ? 'o' : 'p';
      localStorage.setItem('portal.malla.embedPlan', state.mallaEmbedPlan);
      state.activePlan = state.mallaEmbedPlan === 'o' ? 'planO' : 'planP';
      localStorage.setItem('portal.activePlan', state.activePlan);
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
    if (typeBtn) { state.materialType = typeBtn.dataset.materialType; state.materialVisibleCount = 60; render({ transition: true, scope: 'panel' }); return; }
    const courseFilter = e.target.closest('[data-material-course]');
    if (courseFilter) { state.materialCourse = courseFilter.dataset.materialCourse; state.selectedResourceId = null; state.materialVisibleCount = 60; render({ transition: true, scope: 'panel' }); return; }
    const clearMaterial = e.target.closest('[data-material-clear]');
    if (clearMaterial) {
      const target = clearMaterial.dataset.materialClear;
      if (target === 'search' || target === 'all') state.materialQuery = '';
      if (target === 'type' || target === 'all') state.materialType = 'all';
      if (target === 'course' || target === 'all') state.materialCourse = 'all';
      state.selectedResourceId = null;
      state.materialVisibleCount = 60;
      render({ transition: true, scope: 'panel' });
      return;
    }
    const materialMore = e.target.closest('[data-material-more]');
    if (materialMore) { state.materialVisibleCount = (Number(state.materialVisibleCount) || 60) + 60; render({ scope: 'filter', preserveFocus: true }); return; }
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
    const draftSurvey = state.surveyBuilderResult?.survey || null;
    if (draftSurvey) {
      if (e.target.matches('[data-survey-edit="title"]')) { draftSurvey.title = e.target.value; return; }
      if (e.target.matches('[data-survey-edit="description"]')) { draftSurvey.description = e.target.value; return; }
      if (e.target.matches('[data-survey-q-label]')) { const i = Number(e.target.dataset.surveyQLabel); if (draftSurvey.questions?.[i]) draftSurvey.questions[i].label = e.target.value; return; }
      if (e.target.matches('[data-survey-opt]')) { const [i, j] = e.target.dataset.surveyOpt.split(':').map(Number); if (draftSurvey.questions?.[i]?.options) draftSurvey.questions[i].options[j] = e.target.value; return; }
    }
    if (e.target.matches('[data-survey-refine-input]')) { state.surveyRefineText = e.target.value; return; }
    if (e.target.matches('[data-booking-reason]')) { state.bookingReason = e.target.value; return; }
    if (e.target.matches('[data-malla-search]')) { state.mallaQuery = e.target.value; scheduleFilterRender(); }
    if (e.target.matches('[data-material-search]')) { state.materialQuery = e.target.value; state.selectedResourceId = null; state.materialVisibleCount = 60; scheduleFilterRender(); }
    if (e.target.matches('[data-com-search]')) { state.communicationQuery = e.target.value; scheduleFilterRender(); }
  }
  function onChange(e) {
    const attachInput = e.target.closest('[data-attach-input]');
    if (attachInput && attachInput.files && attachInput.files[0]) {
      const file = attachInput.files[0];
      if (file.size > 6 * 1024 * 1024) { showToast('El archivo supera 6 MB', 'blue'); attachInput.value = ''; return; }
      const reader = new FileReader();
      reader.onload = () => { state.cealAttachment = { name: file.name, mimeType: file.type || 'application/octet-stream', data: String(reader.result || '') }; render({ transition: false, scope: 'panel', resetScroll: false }); };
      reader.onerror = () => showToast('No se pudo leer el archivo', 'blue');
      reader.readAsDataURL(file);
      return;
    }
    const prefToggle = e.target.closest('[data-pref]');
    if (prefToggle) {
      setPref(prefToggle.dataset.pref, e.target.checked);
      render({ transition: false, scope: 'panel', resetScroll: false });
      return;
    }
    const notifyToggle = e.target.closest('[data-notify-group]');
    if (notifyToggle) {
      const key = notifyToggle.dataset.notifyGroup;
      state.notifyGroups = { ...state.notifyGroups, [key]: e.target.checked };
      render({ transition: false, scope: 'panel', resetScroll: false });
      return;
    }
    const draftSurvey = state.surveyBuilderResult?.survey || null;
    if (draftSurvey && e.target.matches('[data-survey-q-type]')) { const i = Number(e.target.dataset.surveyQType); const q = draftSurvey.questions?.[i]; if (q) { q.type = e.target.value; if (['single', 'multiple'].includes(q.type) && (!q.options || !q.options.length)) q.options = ['Opción 1', 'Opción 2']; } render({ transition: true, scope: 'panel' }); return; }
    if (draftSurvey && e.target.matches('[data-survey-q-required]')) { const i = Number(e.target.dataset.surveyQRequired); if (draftSurvey.questions?.[i]) draftSurvey.questions[i].required = e.target.checked; return; }
    if (e.target.matches('[data-material-type-select]')) { state.materialType = e.target.value; state.selectedResourceId = null; state.materialVisibleCount = 60; render({ transition: true, scope: 'panel' }); return; }
    if (e.target.matches('[data-material-course-select]')) { state.materialCourse = e.target.value; state.selectedResourceId = null; state.materialVisibleCount = 60; render({ transition: true, scope: 'panel' }); return; }
    if (e.target.matches('[data-malla-area]')) { state.mallaArea = e.target.value; render(); }
  }
  function onFocusOut(e) {
    const field = e.target;
    if (!(field instanceof HTMLElement) || !field.matches('input, select, textarea')) return;
    if (typeof field.checkValidity !== 'function') return;
    const form = field.closest('[data-form]');
    if (!form) return;
    const wrap = field.closest('.field') || field.parentElement;
    let msg = wrap && wrap.querySelector(':scope > .field-error');
    if (field.value && !field.checkValidity()) {
      field.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');
      if (wrap) {
        if (!msg) { msg = document.createElement('p'); msg.className = 'field-error'; msg.setAttribute('role', 'alert'); wrap.appendChild(msg); }
        if (!field.id) field.id = `f-auto-${Math.random().toString(36).slice(2, 9)}`;
        msg.id = `${field.id}-error`;
        msg.textContent = field.validationMessage;
        field.setAttribute('aria-describedby', msg.id);
      }
    } else {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
      if (msg) { field.removeAttribute('aria-describedby'); msg.remove(); }
    }
  }
  function onKeydown(e) {
    if (e.key === 'Escape') {
      if (state.menuOpen) { state.menuOpen = false; render({ transition: true, scope: 'overlay', resetScroll: false }); document.querySelector('[data-open-menu]')?.focus(); return; }
      if (state.notificationsOpen) { state.notificationsOpen = false; render({ transition: true, scope: 'overlay' }); document.querySelector('[data-toggle-notifications]')?.focus(); return; }
      if (state.toast) { if (toastTimer) clearTimeout(toastTimer); state.toast = null; render({ scope: 'overlay', resetScroll: false }); return; }
      if (state.selectedCourse || state.selectedResourceId) { state.selectedCourse = null; state.selectedResourceId = null; render({ transition: true, scope: 'panel' }); return; }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLElement && e.target.matches('[role="button"]:not(button):not(a), [tabindex="0"][data-keyactivate]')) {
      e.preventDefault();
      e.target.click();
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
    if (form.dataset.submitting === '1') return;
    const fd = new FormData(form);
    if (isGuest() && ['upload-material', 'edit-content', 'new-agreement'].includes(form.dataset.form)) { readonlyToast(); return; }
    const submitBtn = form.querySelector('button[type="submit"], [type="submit"], button:not([type])');
    const aiForm = form.dataset.form === 'ceal-assistant' || form.dataset.form === 'survey-ai';
    if (!aiForm && submitBtn) { form.dataset.submitting = '1'; submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true'); }
    try {
    if (form.dataset.form === 'ceal-assistant') {
      if (!hasCealAccess()) { readonlyToast(); return; }
      const rawText = String(fd.get('rawText') || '').trim();
      if (rawText.length < 20 && !state.cealAttachment) { showToast('Escribe un texto (mín. 20 caracteres) o adjunta un archivo de contexto', 'blue'); return; }
      const request = {
        intent: 'comunicado',
        rawText,
        category: String(fd.get('category') || 'Auto'),
        audience: CEAL_ASSISTANT_AUDIENCE,
        urgency: String(fd.get('urgency') || 'normal'),
        length: String(fd.get('length') || 'auto'),
        extraContext: String(fd.get('extraContext') || '').trim(),
        attachment: state.cealAttachment || null
      };
      state.cealAssistantRequest = { ...request, attachment: undefined };
      state.cealAssistantResult = null;
      state.cealAssistantError = '';
      state.cealAssistantLoading = true;
      setButtonBusy(submitBtn, 'Generando…');
      try {
        const payload = await cealAssistantRequest(request);
        state.cealAssistantResult = payload.result;
        state.cealAssistantUsage = payload.usage || null;
        state.cealAttachment = null;
        showToast('Borrador generado', 'blue');
      } catch (error) {
        if (!(error && error.isSessionExpired)) state.cealAssistantError = error.message || 'No se pudo generar el borrador.';
      } finally {
        state.cealAssistantLoading = false;
        render({ transition: false, scope: 'panel', resetScroll: false });
      }
      return;
    }
    if (form.dataset.form === 'survey-ai') {
      if (!hasCealAccess()) { readonlyToast(); return; }
      const request = {
        rawText: String(fd.get('rawText') || '').trim(),
        mode: String(fd.get('mode') || 'auto'),
        audience: CEAL_ASSISTANT_AUDIENCE
      };
      state.surveyBuilderRequest = request;
      state.surveyBuilderResult = null;
      state.surveyBuilderError = '';
      state.surveyBuilderLoading = true;
      setButtonBusy(submitBtn, 'Generando…');
      try {
        const payload = await surveyAssistantRequest(request);
        state.surveyBuilderResult = payload.result;
        showToast('Encuesta generada', 'blue');
      } catch (error) {
        if (!(error && error.isSessionExpired)) state.surveyBuilderError = error.message || 'No se pudo generar la encuesta.';
      } finally {
        state.surveyBuilderLoading = false;
        render({ transition: false, scope: 'panel', resetScroll: false });
      }
      return;
    }
    if (form.dataset.form === 'survey-response') {
      if (isGuest()) { readonlyToast(); return; }
      if (hasJefaturaAccess()) { showToast('Jefatura puede ver las encuestas, pero la votación es solo para estudiantes', 'blue'); return; }
      if (!API_BASE) { showToast('Responder estará disponible cuando se active el registro de respuestas', 'blue'); return; }
      const survey = Data.surveys.find(s => s.id === form.dataset.surveyId);
      if (!survey) { showToast('Encuesta no encontrada', 'blue'); return; }
      const answers = {};
      for (const question of survey.questions || []) {
        const key = `survey-${question.id}`;
        const values = fd.getAll(key).map(value => String(value).trim()).filter(Boolean);
        answers[question.id] = question.type === 'multiple' ? values : (values[0] || '');
      }
      try {
        const payload = await apiRequest(`/surveys/${encodeURIComponent(survey.id)}/respond`, { method: 'POST', body: JSON.stringify({ answers }) });
        Object.assign(survey, payload.item || {});
        markSurveyAnswered(survey.id);
        persistSnapshot();
        showToast('Respuesta registrada', 'blue');
        render({ transition: true, scope: 'panel' });
      } catch (error) {
        if (error && error.isSessionExpired) return;
        showToast(error.message || 'No se pudo registrar la respuesta', 'blue');
      }
      return;
    }
    if (form.dataset.form === 'upload-material') {
      const file = form.elements.file?.files?.[0];
      if (file && file.size > 1_000_000) {
        showToast('El archivo supera 1 MB. Comprime el PDF o comparte un enlace de Drive en el campo de enlace.', 'orange');
        return;
      }
      const courseName = String(fd.get('course') || 'Ramo por asociar');
      let item = { id:`mat-${Date.now()}`, title:fd.get('title'), type:fd.get('type') || 'Apunte', courseCode:courseName, plan:fd.get('plan') || 'planP', courseName, semester:'-', year:fd.get('year') || '2026', format:file?.name?.split('.').pop()?.toUpperCase() || 'LINK', size:file ? humanSize(file.size) : 'Sin archivo', origin:fd.get('origin'), status:'pendienteRevision', uploadedBy:state.user.name, uploadedAt:new Date().toISOString().slice(0,10), description:fd.get('description'), fileName:file?.name || '', fileType:file?.type || '', fileDataUrl: await readFileDataUrl(file) };
      if (API_BASE) {
        try {
          const payload = await apiRequest('/materials', { method:'POST', body:JSON.stringify(item) });
          if (payload.item) item = payload.item;
        } catch (err) {
          if (err && err.isSessionExpired) return;
          showToast('No se pudo subir el material. Inténtalo de nuevo.', 'red');
          return;
        }
      }
      Data.resources.unshift(item); persistSnapshot(); showToast('Material enviado a revisión'); routeTo('/material/' + item.id); return;
    }
    if (form.dataset.form === 'edit-content') {
      const id = fd.get('id') || Data.communications[0]?.id;
      let item = Data.communications.find(c => c.id === id);
      if (!item) { item = { id: id || `com-${Date.now()}`, date:new Date().toISOString(), source:'CEIC Ingeniería Civil UCN', unread:true, pinned:false, related:[] }; Data.communications.unshift(item); }
      Object.assign(item, { title:fd.get('title'), category:fd.get('category'), summary:fd.get('summary'), body:fd.get('body'), updatedAt:new Date().toISOString() });
      persistSnapshot();
      if (API_BASE) {
        try {
          await apiRequest(`/communications/${encodeURIComponent(item.id)}`, { method:'PATCH', body:JSON.stringify(item) });
          showToast('Comunicado guardado');
        } catch (err) {
          if (err && err.isSessionExpired) return;
          showToast('No se pudo guardar en el servidor. Cambios guardados solo en este dispositivo.', 'orange');
        }
      } else {
        showToast('Comunicado guardado');
      }
      routeTo('/comunicados/' + item.id);
      return;
    }
    if (form.dataset.form === 'new-agreement') {
      let item = { id:`agr-${Date.now()}`, number:`Seguimiento N°${String(Data.agreements.length + 1).padStart(2,'0')}/${new Date().getFullYear()}`, status:fd.get('status') || 'enSeguimiento', date:new Date().toISOString(), origin:fd.get('origin'), responsible:fd.get('responsible'), title:fd.get('title'), summary:fd.get('summary'), currentState:'Registrado en Gestión CEAL.', nextStep:fd.get('nextStep'), documents:[], commitments:fd.get('commitment') ? [{ title:fd.get('commitment'), responsible:fd.get('responsible'), due:new Date().toISOString().slice(0,10), status:'pendiente' }] : [], history:[{ at:new Date().toISOString(), title:'Seguimiento creado', detail:'Registro creado desde Gestión CEAL.' }] };
      if (API_BASE) {
        try {
          const payload = await apiRequest('/agreements', { method:'POST', body:JSON.stringify(item) });
          if (payload.item) item = payload.item;
        } catch (err) {
          if (err && err.isSessionExpired) return;
          showToast('No se pudo crear el seguimiento. Inténtalo de nuevo.', 'red');
          return;
        }
      }
      Data.agreements.unshift(item); persistSnapshot(); showToast('Seguimiento creado'); routeTo('/acuerdos/' + item.id); return;
    }
    } finally {
      if (!aiForm && submitBtn) { form.dataset.submitting = ''; submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
    }
  }

  window.addEventListener('hashchange', () => safeRender({ transition: true, scope: 'route' }));
  // Mensajes del iframe de mallas: "Ver material" / "Ficha del ramo" desde la
  // barra de acción. Solo se aceptan mensajes del iframe vigente y con la
  // forma esperada; el código se resuelve contra el catálogo oficial.
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.__mcPortal !== true || !['open-material', 'open-course'].includes(data.type)) return;
    const frame = app.querySelector('[data-malla-frame]');
    if (!frame || event.source !== frame.contentWindow) return;
    const code = String(data.code || '').trim().slice(0, 40);
    if (!code) return;
    const planKey = state.mallaEmbedPlan === 'o' ? 'planO' : 'planP';
    const inPlan = findCourse(planKey, code);
    const match = inPlan ? { plan: planKey, course: inPlan } : officialCourseByCode(code);
    if (!match) { showToast('No encontramos ese ramo en el catálogo oficial.', 'blue'); return; }
    if (data.type === 'open-material') {
      routeTo(`/material?course=${encodeURIComponent(match.course.visibleCode || match.course.code)}`);
    } else {
      routeTo(`/ramo/${match.plan}/${encodeURIComponent(match.course.code)}`);
    }
  });
  window.addEventListener('online', () => { state.offline = false; render({ scope: 'overlay', resetScroll: false }); });
  window.addEventListener('offline', () => { state.offline = true; showToast('Sin conexión. Mostrando datos guardados.', 'orange'); });
  window.addEventListener('storage', e => { if (e.key === 'portal.session' && !e.newValue && state.user) { state.user = null; routeTo('/login'); } });
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('submit', onSubmit);
  boot().catch(err => { console.error(err); });
})();
