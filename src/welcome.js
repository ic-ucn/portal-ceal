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
          <video controls playsinline preload="none" aria-label="Video tutorial del portal CEIC UCN" aria-describedby="welcome-video-help"><track kind="captions" src="${MEDIA}portal-guia.vtt?v=20260921" srclang="es" label="Español">Tu navegador no puede reproducir este video. Puedes leer la guía debajo.</video>
          <button type="button" class="welcome-play" data-welcome-play aria-label="Reproducir guía del portal"><span class="welcome-play-symbol" aria-hidden="true">▶</span><span class="welcome-play-label">Ver recorrido</span></button>
        </div>
        <aside class="welcome-summary"><p id="welcome-video-help">Mallas, material y fechas académicas, en un recorrido breve.</p>
          <nav class="welcome-sections" aria-label="Ir directamente a una sección">
            <a href="#/mallas" data-welcome-destination><span><strong>Mallas</strong><small>Planes O y P, ramos y prerrequisitos.</small></span><span aria-hidden="true">↗</span></a>
            <a href="#/material" data-welcome-destination><span><strong>Material</strong><small>Apuntes, guías y evaluaciones por ramo.</small></span><span aria-hidden="true">↗</span></a>
            <a href="#/calendario" data-welcome-destination><span><strong>Calendario</strong><small>Fechas y actividades académicas.</small></span><span aria-hidden="true">↗</span></a>
          </nav>
          <details class="welcome-transcript"><summary>Leer la guía</summary><ol>
            <li><strong>Inicio.</strong> Reúne las próximas fechas y accesos a las secciones. No necesitas iniciar sesión.</li>
            <li><strong>Mallas.</strong> Elige Plan O o Plan P. Selecciona un ramo para ver sus prerrequisitos y el material relacionado.</li>
            <li><strong>Material.</strong> Busca por nombre o filtra por ramo y tipo de archivo. Abre un recurso y usa su enlace para consultarlo o descargarlo, según las opciones del archivo.</li>
            <li><strong>Calendario.</strong> Consulta el mes y las próximas actividades. Selecciona una fecha para abrir sus detalles; al cerrar, conservas tu posición.</li>
            <li><strong>Volver a la guía.</strong> Usa Guía del portal en la barra lateral o dentro de Más, en el teléfono.</li>
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
      video.querySelector('track').src = `${MEDIA}portal-guia-${format}.vtt?v=20260921`;
      video.removeAttribute('src');
      video.load();
      video.controls = false;
      video.dataset.source = `${MEDIA}portal-guia-${format}.mp4?v=20260921`;
      video.poster = `${MEDIA}portal-guia-${format}.jpg?v=20260921`;
      dialog.querySelector('[data-welcome-play]').hidden = false;
      dialog.querySelector('.welcome-video-error').hidden = true;
    }
    dialog.dataset.format = format;
    document.body.classList.add('welcome-open');
    dialog.showModal();
    dialog.querySelector('#welcome-title').focus({ preventScroll: true });
  }
  const boundPlayers = new WeakSet();
  function renderReception(themeControl) {
    return `<div class="portal-reception"><a class="skip-link" href="#reception-sections">Saltar a las secciones</a>
      <header class="reception-header"><a class="reception-brand" href="#/" aria-label="Bienvenida CEIC UCN"><img src="assets/logo-mark-transparent.png" alt=""><strong>CEIC UCN</strong></a><span class="reception-campus">Antofagasta</span>${themeControl}</header>
      <main class="reception-main" id="main-content" tabindex="-1"><section class="reception-intro"><span class="reception-eyebrow">UNIVERSIDAD CATÓLICA DEL NORTE</span><h1>Ingeniería<br> Civil.</h1><p>Mallas, material y fechas académicas.</p>
        <nav class="reception-sections" id="reception-sections" aria-label="Secciones principales">
          <a href="#/mallas"><span><strong>Mallas</strong><small>Planes O y P · ramos y prerrequisitos</small></span><span aria-hidden="true">↗</span></a>
          <a href="#/material"><span><strong>Material</strong><small>Guías, apuntes y evaluaciones</small></span><span aria-hidden="true">↗</span></a>
          <a href="#/calendario"><span><strong>Calendario</strong><small>Actividades y plazos de Antofagasta</small></span><span aria-hidden="true">↗</span></a>
        </nav><a class="reception-home" href="#/inicio">Ir a Inicio <span aria-hidden="true">→</span></a>
      </section><section class="reception-guide" aria-labelledby="reception-guide-title"><div class="reception-guide-head"><h2 id="reception-guide-title">Conoce el portal</h2><span>1 min 32 s</span></div>
        <div class="welcome-player"><video playsinline preload="none" aria-label="Video tutorial del portal CEIC UCN"><track kind="captions" src="${MEDIA}portal-guia.vtt?v=20260921" srclang="es" label="Español"></video><button type="button" class="welcome-play" data-reception-play aria-label="Reproducir guía del portal"><span class="welcome-play-symbol" aria-hidden="true">▶</span><span class="welcome-play-label">Ver recorrido</span></button></div>
        <p class="reception-video-error" role="status" hidden>No se pudo cargar el video. Puedes leer la guía o abrir una sección.</p>
        <details class="welcome-transcript"><summary>Leer la guía</summary><ol><li>Desde la bienvenida, abre una sección o entra a Inicio para ver las próximas fechas.</li><li>En Mallas, elige Plan O o Plan P y abre un ramo para consultar sus prerrequisitos.</li><li>Usa Material del ramo para encontrar recursos relacionados. Busca una guía y abre el archivo.</li><li>En Calendario, cambia de mes y selecciona una fecha para consultar sus detalles, la duración y el documento oficial de Antofagasta.</li><li>Vuelve a esta bienvenida desde el logo CEIC UCN. El tutorial también está en Guía del portal.</li></ol></details>
      </section></main><footer class="reception-footer"><span>Centro de Estudiantes · Ingeniería Civil</span><span>Universidad Católica del Norte</span></footer></div>`;
  }
  function onRender() {
    if (dialog?.open && location.hash !== routeAtOpen) close({ navigate: true });
    const reception = document.querySelector('.portal-reception');
    if (reception) {
      const player = reception.querySelector('video');
      if (!boundPlayers.has(player)) {
        boundPlayers.add(player);
        const format = matchMedia('(max-width: 920px)').matches ? 'mobile' : 'desktop';
        player.dataset.format = format;
        player.querySelector('track').src = `${MEDIA}portal-guia-${format}.vtt?v=20260921`;
        player.poster = `${MEDIA}portal-guia-${format}.jpg?v=20260921`;
        const play = reception.querySelector('[data-reception-play]'), error = reception.querySelector('.reception-video-error');
        play.addEventListener('click', () => {
          if (!player.getAttribute('src')) player.src = `${MEDIA}portal-guia-${format}.mp4?v=20260921`;
          player.controls = true;
          player.play().catch(() => { error.hidden = false; });
        });
        player.addEventListener('play', () => { play.hidden = true; });
        player.addEventListener('error', () => { play.hidden = true; error.hidden = false; });
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
  window.PortalWelcome = Object.freeze({ open, onRender, renderReception });
})();
