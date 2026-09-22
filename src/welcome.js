(() => {
  'use strict';
  const SEEN_KEY = 'portal.welcome.v1', MEDIA = 'assets/tutorial/';
  let dialog, video, checked = false, returnFocus, routeAtOpen;
  function seen() { try { return localStorage.getItem(SEEN_KEY) === 'done'; } catch { return false; } }
  function close({ navigate = false } = {}) {
    if (!dialog?.open) return;
    checked = true;
    try { localStorage.setItem(SEEN_KEY, 'done'); } catch {}
    video.pause();
    dialog.close();
    document.body.classList.remove('welcome-open');
    if (!navigate) (returnFocus?.isConnected ? returnFocus : document.querySelector('#main-content'))?.focus({ preventScroll: true });
  }
  function create() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'portal-welcome';
    dialog.setAttribute('aria-labelledby', 'welcome-title');
    dialog.innerHTML = `
      <header class="welcome-head"><div><span class="welcome-brand">CEIC UCN · GUÍA RÁPIDA</span><h2 id="welcome-title" tabindex="-1">Así funciona el portal</h2></div><button class="welcome-close" type="button" data-welcome-close aria-label="Cerrar guía"><span aria-hidden="true">×</span></button></header>
      <div class="welcome-body">
        <div class="welcome-player">
          <video controls playsinline preload="none" aria-label="Video tutorial del portal CEIC UCN" aria-describedby="welcome-video-help"><track kind="captions" src="${MEDIA}portal-guia.vtt?v=20260921d" srclang="es" label="Español">Tu navegador no puede reproducir este video. Puedes leer la guía debajo.</video>
          <button type="button" class="welcome-play" data-welcome-play aria-label="Reproducir guía del portal"><span class="welcome-play-symbol" aria-hidden="true">▶</span><span class="welcome-play-label">Ver recorrido</span></button>
        </div>
        <aside class="welcome-summary"><p id="welcome-video-help">Mallas, material y fechas académicas, en un recorrido breve.</p>
          <nav class="welcome-sections" aria-label="Ir directamente a una sección">
            <a href="#/mallas" data-welcome-destination><span><strong>Mallas</strong><small>Planes O y P, ramos y prerrequisitos.</small></span><span aria-hidden="true">↗</span></a>
            <a href="#/material" data-welcome-destination><span><strong>Material</strong><small>Apuntes, guías y evaluaciones por ramo.</small></span><span aria-hidden="true">↗</span></a>
            <a href="#/calendario" data-welcome-destination><span><strong>Calendario</strong><small>Fechas y actividades académicas.</small></span><span aria-hidden="true">↗</span></a>
          </nav>
          <details class="welcome-transcript"><summary>Leer la guía</summary><ol>
            <li><strong>Inicio.</strong> Inicio reúne las próximas fechas y los accesos principales del portal.</li>
            <li><strong>Calendario.</strong> En Calendario puedes consultar las fechas académicas de Antofagasta.</li>
            <li><strong>Mallas.</strong> En Mallas puedes explorar los ramos de la carrera.</li>
            <li><strong>Material.</strong> En Material encuentras apuntes, guías y evaluaciones de la carrera.</li>
            <li><strong>Volver a Inicio.</strong> La Guía del portal siempre está disponible en el menú para repetir el tutorial.</li>
          </ol></details><p class="welcome-video-error" role="status" hidden>No se pudo cargar el video. Puedes leer la guía o abrir una sección.</p>
        </aside>
      </div>
      <footer class="welcome-foot"><button class="welcome-skip" type="button" data-welcome-close>Saltar</button><button class="welcome-enter" type="button" data-welcome-close>Entrar al portal<span aria-hidden="true">→</span></button></footer>`;
    document.body.append(dialog);
    video = dialog.querySelector('video');
    video.controls = false;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-welcome-close]')) close();
      else if (event.target.closest('[data-welcome-destination]')) {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) close({ navigate: true });
      } else if (event.target.closest('[data-welcome-play]')) {
        event.preventDefault();
        event.stopPropagation();
        if (!video.getAttribute('src')) video.src = video.dataset.source;
        video.play().then(() => { video.controls = true; }).catch(() => { dialog.querySelector('.welcome-video-error').hidden = false; });
      }
      else if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }
    });
    video.addEventListener('play', () => { dialog.querySelector('[data-welcome-play]').hidden = true; });
    video.addEventListener('error', () => { dialog.querySelector('[data-welcome-play]').hidden = true; dialog.querySelector('.welcome-video-error').hidden = false; });
    // Native dialog contains focus; Escape must not reach portal overlays underneath.
    document.addEventListener('keydown', event => {
      if (!dialog.open) return;
      if (event.key === 'Escape' && !document.fullscreenElement && !video.webkitDisplayingFullscreen) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      if (event.key === 'Tab') {
        event.stopImmediatePropagation();
        const targets = [...dialog.querySelectorAll('button, a[href], summary, video[controls]')].filter(node => !node.disabled && !node.hidden && node.getClientRects().length);
        const first = targets[0], last = targets[targets.length - 1], active = document.activeElement;
        if (event.shiftKey && (active === first || active.id === 'welcome-title')) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
      }
    }, true);
    window.addEventListener('storage', event => { if (event.key === SEEN_KEY && event.newValue === 'done') { checked = true; close(); } });
  }
  function open(trigger = document.activeElement) {
    create();
    if (dialog.open || typeof dialog.showModal !== 'function') return;
    returnFocus = trigger;
    routeAtOpen = location.hash;
    const format = matchMedia('(max-width: 920px)').matches ? 'mobile' : 'desktop';
    if (video.dataset.format !== format) {
      video.dataset.format = format;
      video.querySelector('track').src = `${MEDIA}portal-guia-${format}.vtt?v=20260921d`;
      video.removeAttribute('src');
      video.load();
      video.controls = false;
      video.dataset.source = `${MEDIA}portal-guia-${format}.mp4?v=20260921d`;
      video.poster = `${MEDIA}portal-guia-${format}.jpg?v=20260921d`;
      dialog.querySelector('[data-welcome-play]').hidden = false;
      dialog.querySelector('.welcome-video-error').hidden = true;
    }
    dialog.dataset.format = format;
    document.body.classList.add('welcome-open');
    dialog.showModal();
    dialog.querySelector('#welcome-title').focus({ preventScroll: true });
  }
  const boundPlayers = new WeakSet();
  function skipReception() {
    try { return localStorage.getItem('portal.tutorial.skip') === 'yes'; } catch { return false; }
  }
  function renderReception(themeControl) {
    return `<div class="portal-reception reception-video-only">
      <header class="reception-header"><a class="reception-brand" href="#/inicio" aria-label="Ir a Inicio"><img src="assets/logo-mark-transparent.png" alt=""><strong>CEIC UCN</strong></a>${themeControl}<a class="reception-skip" href="#/inicio">Saltar tutorial</a></header>
      <main class="reception-main" id="main-content" tabindex="-1"><section class="reception-guide" aria-labelledby="reception-title"><div class="reception-guide-head"><h1 id="reception-title">Bienvenido al portal</h1><span>Guía rápida</span></div>
        <div class="welcome-player"><video playsinline preload="none" aria-label="Video tutorial del portal CEIC UCN"><track kind="captions" src="${MEDIA}portal-guia.vtt?v=20260921d" srclang="es" label="Español"></video><button type="button" class="welcome-play" data-reception-play aria-label="Reproducir guía del portal"><span class="welcome-play-symbol" aria-hidden="true">▶</span><span class="welcome-play-label">Ver tutorial</span></button></div>
        <p class="reception-video-error" role="status" hidden>No se pudo cargar el video. Puedes leer la guía o entrar al portal.</p>
        <div class="reception-actions"><button type="button" class="reception-dismiss" data-reception-dismiss>No volver a mostrar</button><a class="btn primary reception-enter" href="#/inicio">Ir al portal <span aria-hidden="true">→</span></a></div>
        <details class="welcome-transcript"><summary>Leer la guía</summary><ol><li>Inicio reúne las próximas fechas y los accesos principales.</li><li>En Calendario, cambia de mes y abre una fecha para consultar sus actividades y el documento oficial.</li><li>En Mallas, selecciona tu plan y abre cualquier ramo para ver su descripción y prerrequisitos.</li><li>En Material, busca o filtra los recursos y abre un archivo para consultarlo.</li><li>Puedes repetir este tutorial desde Guía del portal.</li></ol></details>
      </section></main></div>`;
  }
  function onRender() {
    if (dialog?.open && location.hash !== routeAtOpen) close({ navigate: true });
    const reception = document.querySelector('.portal-reception');
    if (reception) {
      const player = reception.querySelector('video');
      if (!boundPlayers.has(player)) {
        boundPlayers.add(player);
        reception.querySelector('[data-reception-dismiss]').addEventListener('click', () => {
          try { localStorage.setItem('portal.tutorial.skip', 'yes'); } catch {}
          location.hash = '/inicio';
        });
        const format = matchMedia('(max-width: 920px)').matches ? 'mobile' : 'desktop';
        player.dataset.format = format;
        player.querySelector('track').src = `${MEDIA}portal-guia-${format}.vtt?v=20260921d`;
        player.poster = `${MEDIA}portal-guia-${format}.jpg?v=20260921d`;
        const play = reception.querySelector('[data-reception-play]'), error = reception.querySelector('.reception-video-error');
        play.addEventListener('click', () => {
          if (!player.getAttribute('src')) player.src = `${MEDIA}portal-guia-${format}.mp4?v=20260921d`;
          player.controls = true;
          player.play().catch(() => { error.hidden = false; });
        });
        player.addEventListener('play', () => { play.hidden = true; });
        player.addEventListener('error', () => { play.hidden = true; error.hidden = false; });
        reception.querySelector('.reception-enter').addEventListener('click', () => { player.pause(); });
      }
    }
    if (checked) return;
    checked = true;
    const url = new URL(location.href);
    if (url.searchParams.get('guia') === '1') {
      url.searchParams.delete('guia'); history.replaceState(null, '', url);
      if (!reception) open(document.querySelector('#main-content'));
    }
  }
  window.PortalWelcome = Object.freeze({ open, onRender, renderReception, skipReception });
})();
