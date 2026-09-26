(() => {
  'use strict';
  // Only deliberately named public interactions leave the browser. Never send
  // input values, account data, document URLs, query strings or DOM text.
  const pages = {
    '/': 'Bienvenida', '/bienvenida': 'Bienvenida', '/inicio': 'Inicio',
    '/calendario': 'Calendario', '/mallas': 'Mallas', '/material': 'Material',
    '/material/recurso': 'Detalle de material', '/ramo': 'Ficha de ramo',
    '/buscar': 'Búsqueda', '/acuerdos': 'Seguimientos'
  };
  const actions = {
    'tutorial/abrir': 'Abrir guía', 'tutorial/saltar': 'Saltar tutorial',
    'tutorial/omitir': 'No volver a mostrar', 'tutorial/entrar': 'Ir al portal',
    'tutorial/leer': 'Leer guía', 'calendario/mes': 'Cambiar mes',
    'calendario/hoy': 'Volver a hoy', 'calendario/fecha': 'Consultar fecha',
    'calendario/cerrar': 'Cerrar fecha', 'calendario/fuente': 'Abrir calendario oficial',
    'calendario/audiencia': 'Filtrar actividades', 'calendario/exportar': 'Exportar calendario',
    'mallas/plan-o': 'Seleccionar Plan O', 'mallas/plan-p': 'Seleccionar Plan P',
    'mallas/ramo': 'Seleccionar ramo', 'mallas/ficha': 'Abrir ficha del ramo',
    'mallas/material': 'Consultar material del ramo', 'mallas/semestre': 'Cambiar semestre',
    'mallas/cerrar': 'Cerrar malla', 'material/buscar': 'Buscar material',
    'material/tipo': 'Filtrar por tipo', 'material/ramo': 'Filtrar por ramo',
    'material/limpiar': 'Limpiar filtros', 'material/mas': 'Mostrar más recursos',
    'material/abrir': 'Abrir material externo', 'material/descargar': 'Solicitar descarga',
    'portal/buscar': 'Buscar en el portal', 'portal/menu': 'Abrir menú móvil',
    'portal/tema': 'Cambiar tema'
  };
  const clicks = [
    ['[data-open-welcome]', 'tutorial/abrir'], ['.reception-skip', 'tutorial/saltar'],
    ['[data-reception-dismiss]', 'tutorial/omitir'], ['.reception-enter', 'tutorial/entrar'],
    ['.welcome-transcript summary', 'tutorial/leer'], ['[data-calendar-month]', 'calendario/mes'],
    ['[data-calendar-today]', 'calendario/hoy'], ['[data-calendar-date]', 'calendario/fecha'],
    ['[data-calendar-modal-close]', 'calendario/cerrar'], ['.calendar-source a, .calendar-event-source', 'calendario/fuente'],
    ['[data-calendar-audience]', 'calendario/audiencia'], ['[data-download-calendar]', 'calendario/exportar'],
    ['[data-malla-embed-plan="o"], [data-plan="planO"]', 'mallas/plan-o'],
    ['[data-malla-embed-plan="p"], [data-plan="planP"]', 'mallas/plan-p'],
    ['[data-course]', 'mallas/ramo'], ['[data-mobile-sem]', 'mallas/semestre'],
    ['.malla-close', 'mallas/cerrar'], ['[data-material-type]', 'material/tipo'],
    ['[data-material-course]', 'material/ramo'], ['[data-material-clear]', 'material/limpiar'],
    ['[data-material-more]', 'material/mas'], ['[data-download-resource]', 'material/descargar'],
    ['.resource-detail-main a[target="_blank"]', 'material/abrir'],
    ['.bottom-more', 'portal/menu'], ['[data-portal-theme-toggle]', 'portal/tema']
  ];
  const params = new URLSearchParams(location.search);
  try {
    if (params.get('analytics') === 'off') localStorage.setItem('portal.analytics.disabled', 'yes');
    if (params.get('analytics') === 'on') localStorage.removeItem('portal.analytics.disabled');
  } catch {}
  function excluded() {
    let disabled = false;
    try { disabled = localStorage.getItem('portal.analytics.disabled') === 'yes' || localStorage.getItem('skipgc') === 't'; } catch {}
    return disabled || params.get('analytics') === 'off' || navigator.webdriver === true ||
      navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' ||
      ['qa', 'static', 'review'].some(key => params.has(key)) ||
      !['ceicucn.cl', 'www.ceicucn.cl'].includes(location.hostname) || window.top !== window;
  }
  const endpoint = window.PORTAL_GOATCOUNTER_ENDPOINT || '';
  const enabled = /^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint) && !excluded();
  let current = null, lastRoute = null, loaded = false, failed = false, firstPage = true;
  let pending = [], searchTimer;
  const videos = new WeakMap();
  function pageInfo(path) {
    const clean = String(path || '').split('?')[0];
    if (Object.hasOwn(pages, clean) && !['/ramo', '/material/recurso', '/acuerdos'].includes(clean)) {
      return { path: clean === '/' ? '/bienvenida' : clean, title: pages[clean] };
    }
    if (/^\/material\/[^/]+$/.test(clean) && clean !== '/material/subir') return { path: '/material/recurso', title: pages['/material/recurso'] };
    if (/^\/ramo\/(planO|planP)\/[^/]+$/.test(clean)) return { path: '/ramo', title: pages['/ramo'] };
    if (/^\/acuerdos\/[^/]+$/.test(clean)) return { path: '/acuerdos', title: pages['/acuerdos'] };
    return null;
  }
  function referrer() {
    try {
      const url = new URL(document.referrer);
      return /^https?:$/.test(url.protocol) && url.hostname !== location.hostname ? url.origin : '';
    } catch { return ''; }
  }
  function send(payload) {
    if (!enabled || failed || excluded()) return;
    if (!loaded) { if (pending.length < 100) pending.push(payload); return; }
    try { window.goatcounter.count(payload); } catch { /* Analytics never blocks the portal. */ }
  }
  function page(path) {
    const next = pageInfo(path), route = String(path).split('?')[0];
    if (route === lastRoute) return;
    lastRoute = route;
    current = next;
    clearTimeout(searchTimer);
    if (!next) return;
    // Dashboard links must open hash routes, not GitHub Pages 404 paths.
    // Fixed aggregate links return to their section without exposing an ID.
    const links = { '/material/recurso': '/#/material?consulta=detalle', '/ramo': '/#/mallas?consulta=ramo', '/acuerdos': '/#/calendario?consulta=seguimiento' };
    send({ ...next, path: links[next.path] || `/#${next.path}`, referrer: firstPage ? referrer() : '', event: false });
    firstPage = false;
  }
  function event(name) {
    if (!current || !Object.hasOwn(actions, name)) return;
    send({ path: name, title: actions[name], event: true, referrer: current.path, no_session: true });
  }
  function videoEvent(e) {
    const player = e.target;
    if (!current || !player.matches?.('.portal-reception video, .portal-welcome video')) return;
    const format = player.dataset.format;
    if (!['desktop', 'mobile'].includes(format)) return;
    let seen = videos.get(player);
    if (!seen || seen.format !== format) { seen = { format, events: new Set() }; videos.set(player, seen); }
    const report = (key, title) => {
      if (seen.events.has(key)) return;
      seen.events.add(key);
      send({ path: `tutorial/${format}/${key}`, title: `Tutorial ${format === 'mobile' ? 'móvil' : 'escritorio'} · ${title}`, event: true, referrer: current.path, no_session: true });
    };
    if (e.type === 'playing') report('inicio', 'Iniciado');
    if (e.type === 'ended') report('fin', 'Finalizado');
    if (e.type === 'error') report('error', 'Error de reproducción');
    if (e.type === 'timeupdate' && !player.seeking && !player.paused && Number.isFinite(player.duration) && player.duration > 0) {
      const percent = player.currentTime / player.duration * 100;
      for (const mark of [25, 50, 75]) if (percent >= mark) report(String(mark), `Alcanzó ${mark}%`);
    }
  }
  window.PortalAnalytics = Object.freeze({ page, event });
  if (!enabled) return;
  window.goatcounter = { no_onload: true, no_events: true, endpoint };
  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js';
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.dataset.goatcounter = endpoint;
  script.onload = () => {
    loaded = typeof window.goatcounter?.count === 'function' && typeof window.goatcounter?.get_data === 'function';
    if (!loaded) { failed = true; pending = []; return; }
    // count.js also adds location.search as `q`, independently of our path.
    // Keep an explicit wire allowlist so search/callback tokens cannot leak.
    const getData = window.goatcounter.get_data;
    window.goatcounter.get_data = vars => {
      const data = getData(vars);
      return { p: data.p, t: data.t, r: data.r, e: data.e, s: data.s, b: data.b, ns: data.ns };
    };
    const queue = pending; pending = [];
    queue.forEach(send);
  };
  script.onerror = () => { failed = true; pending = []; };
  document.head.append(script);
  // Capture before handlers replace a panel, without modifying the interaction.
  document.addEventListener('click', e => {
    if (!current || !e.isTrusted || e.button !== 0) return;
    for (const [selector, name] of clicks) if (e.target.closest?.(selector)) { event(name); break; }
  }, true);
  document.addEventListener('change', e => {
    if (!e.isTrusted) return;
    if (e.target.matches('[data-material-type-select]')) event('material/tipo');
    if (e.target.matches('[data-material-course-select]')) event('material/ramo');
  }, true);
  document.addEventListener('input', e => {
    if (!e.isTrusted || !e.target.matches('[data-material-search]')) return;
    clearTimeout(searchTimer);
    if (e.target.value.trim()) searchTimer = setTimeout(() => event('material/buscar'), 1000);
  }, true);
  document.addEventListener('submit', e => {
    if (e.isTrusted && e.target.matches('[data-global-search-form], [data-search-page-form]')) event('portal/buscar');
  }, true);
  for (const type of ['playing', 'timeupdate', 'ended', 'error']) document.addEventListener(type, videoEvent, true);
})();
