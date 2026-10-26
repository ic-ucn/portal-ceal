(() => {
  'use strict';
  const SKIP_KEY = 'portal.tutorial.skip';
  const formatQuery = matchMedia('(max-width: 920px) and (orientation: portrait)');
  const track = name => window.PortalAnalytics?.event(name);
  let dialog, dialogPlayer, receptionPlayer, returnFocus, routeAtOpen, checked = false;
  function skipReception() { try { return localStorage.getItem(SKIP_KEY) === 'yes'; } catch { return false; } }
  function rememberSkip() { try { localStorage.setItem(SKIP_KEY, 'yes'); } catch {} }
  function shell(isDialog) {
    const content = `<h1 class="sr-only" id="welcome-title">Novedades del portal</h1><div class="news-player" data-guide-root><video class="news-video" controls playsinline muted preload="none" tabindex="0" aria-label="Tutorial del portal con instrucciones en texto"><track kind="captions" srclang="es" label="Español"></video><p class="news-media-error" role="status" hidden>No se pudo cargar el video. Puedes entrar al portal y verlo después.</p></div><div class="reception-actions"><button type="button" class="reception-skip" data-video-skip>Saltar video</button><button type="button" class="reception-dismiss" data-reception-dismiss>No volver a mostrar</button></div>`;
    return isDialog ? content : `<div class="portal-reception"><main class="reception-main" id="main-content">${content}</main></div>`;
  }
  class Player {
    constructor(root, onEnd) {
      this.root = root; this.video = root.querySelector('video'); this.onEnd = onEnd;
      this.disposed = false; this.changeId = 0; this.blobUrl = null; this.preparing = false; this.wantedPlay = false;
      this.onFormat = () => this.selectFormat();
      this.onPlay = () => {
        if (this.resumeInternal) { this.resumeInternal = false; return; }
        if (this.preparing) { this.video.pause(); return; }
        track('tutorial/reproducir');
        if (!this.blobUrl && !this.rangeReady) this.prepareMedia();
      };
      this.onPause = () => { if (!this.preparing && !this.disposed && !this.video.ended && this.video.currentTime > 0) track('tutorial/pausar'); };
      this.onEnded = () => { track('tutorial/completar'); this.onEnd(); };
      this.onError = () => { if (!this.disposed && !(this.preparing && this.blobUrl)) root.querySelector('.news-media-error').hidden = false; };
      this.onKey = event => {
        if (event.target !== this.video || ![' ', 'Enter'].includes(event.key)) return;
        event.preventDefault();
        if (this.preparing) { this.wantedPlay = !this.wantedPlay; this.video.pause(); return; }
        if (this.video.paused) this.video.play().catch(() => this.onError()); else this.video.pause();
      };
      for (const [name, handler] of [['play', this.onPlay], ['pause', this.onPause], ['ended', this.onEnded], ['error', this.onError], ['keydown', this.onKey]]) this.video.addEventListener(name, handler);
      formatQuery.addEventListener('change', this.onFormat);
      this.selectFormat();
    }
    async prepareMedia() {
      // A bounded local asset also seeks correctly on hosts without Range support.
      const id = this.changeId, position = this.video.currentTime;
      this.preparing = true; this.wantedPlay = true;
      this.controller = new AbortController();
      try {
        const headers = await fetch(this.source, { method: 'HEAD', signal: this.controller.signal });
        if (headers.ok && /bytes/i.test(headers.headers.get('accept-ranges') || '')) { if (id === this.changeId) this.rangeReady = true; return; }
        if (this.disposed || id !== this.changeId) return;
        this.video.setAttribute('aria-busy', 'true'); this.video.pause();
        const response = await fetch(this.source, { signal: this.controller.signal });
        if (!response.ok || Number(response.headers.get('content-length')) > 24 * 1024 * 1024) throw new Error('media-load');
        const blob = new Blob([await response.arrayBuffer()], { type: 'video/mp4' });
        if (blob.size > 24 * 1024 * 1024) throw new Error('media-size');
        if (this.disposed || id !== this.changeId) return;
        this.blobUrl = URL.createObjectURL(blob); this.video.src = this.blobUrl;
        await new Promise((resolve, reject) => {
          const cleanup = () => { this.video.removeEventListener('loadedmetadata', ready); this.video.removeEventListener('error', fail); this.controller.signal.removeEventListener('abort', fail); };
          const ready = () => { cleanup(); resolve(); }, fail = () => { cleanup(); reject(new Error('media-canceled')); };
          this.video.addEventListener('loadedmetadata', ready, { once: true }); this.video.addEventListener('error', fail, { once: true }); this.controller.signal.addEventListener('abort', fail, { once: true });
          this.video.load();
        });
        if (this.disposed || id !== this.changeId) return;
        this.video.currentTime = Math.min(position, Math.max(0, this.video.duration - .1));
        if (this.wantedPlay && !document.hidden) { this.resumeInternal = true; await this.video.play(); }
      } catch {
        if (!this.disposed && id === this.changeId && !this.controller.signal.aborted) {
          if (this.blobUrl) {
            // Some media engines reject blob playback; keep ordinary playback available.
            URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; this.rangeReady = true;
            this.video.src = this.source; this.video.load();
            if (this.wantedPlay && !document.hidden) { this.resumeInternal = true; await this.video.play().catch(() => this.onError()); }
          } else this.onError();
        }
      } finally {
        if (id === this.changeId) { this.preparing = false; this.video.removeAttribute('aria-busy'); }
      }
    }
    selectFormat() {
      const recording = window.PortalTutorialCapture?.formats[formatQuery.matches ? 'mobile' : 'desktop'];
      if (!recording) { this.onError(); return; }
      const source = recording.video;
      if (this.source === source) return;
      const position = this.video.currentTime || 0, loaded = this.video.readyState > 0;
      this.video.pause(); const id = ++this.changeId;
      this.controller?.abort(); if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null; this.source = source; this.preparing = false; this.wantedPlay = false; this.rangeReady = false;
      this.video.poster = recording.poster || recording.steps[0].image;
      this.video.src = source; this.video.querySelector('track').src = recording.track;
      // Captions are burned into the video; avoid displaying them twice.
      for (const textTrack of this.video.textTracks) textTrack.mode = 'disabled';
      this.root.querySelector('.news-media-error').hidden = true;
      if (loaded) {
        this.video.addEventListener('loadedmetadata', () => {
          if (!this.disposed && id === this.changeId) this.video.currentTime = Math.min(position, Math.max(0, this.video.duration - .1));
        }, { once: true });
        this.video.load();
      }
    }
    pause() { this.wantedPlay = false; this.video.pause(); }
    restart() { this.pause(); if (this.video.readyState) this.video.currentTime = 0; }
    destroy() {
      this.disposed = true; this.changeId++; this.pause();
      this.controller?.abort(); if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
      formatQuery.removeEventListener('change', this.onFormat);
      for (const [name, handler] of [['play', this.onPlay], ['pause', this.onPause], ['ended', this.onEnded], ['error', this.onError], ['keydown', this.onKey]]) this.video.removeEventListener(name, handler);
      this.video.removeAttribute('src'); this.video.querySelector('track').removeAttribute('src'); this.video.load();
    }
  }
  function close({ navigate = false } = {}) {
    if (!dialog?.open) return;
    dialogPlayer.pause(); dialog.close(); document.body.classList.remove('welcome-open');
    if (!navigate) (returnFocus?.isConnected ? returnFocus : document.querySelector('#main-content'))?.focus({ preventScroll: true });
  }
  function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.className = 'portal-welcome';
    dialog.setAttribute('aria-labelledby', 'welcome-title'); dialog.innerHTML = shell(true); document.body.append(dialog);
    dialogPlayer = new Player(dialog.querySelector('[data-guide-root]'), () => close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.querySelector('[data-video-skip]').addEventListener('click', () => close());
    dialog.querySelector('[data-reception-dismiss]').addEventListener('click', () => { rememberSkip(); close(); });
  }
  function open(trigger = document.activeElement) {
    createDialog(); if (dialog.open || typeof dialog.showModal !== 'function') return;
    returnFocus = trigger; routeAtOpen = location.hash; dialogPlayer.restart();
    document.body.classList.add('welcome-open'); dialog.showModal(); dialogPlayer.video.focus({ preventScroll: true });
  }
  function enter() { receptionPlayer?.pause(); location.hash = '/inicio'; }
  function renderReception() { return shell(false); }
  function onRender() {
    if (dialog?.open && location.hash !== routeAtOpen) close({ navigate: true });
    const reception = document.querySelector('.portal-reception');
    if (!reception && receptionPlayer) { receptionPlayer.destroy(); receptionPlayer = null; }
    if (reception && !receptionPlayer) {
      receptionPlayer = new Player(reception.querySelector('[data-guide-root]'), enter);
      reception.querySelector('[data-video-skip]').addEventListener('click', enter);
      reception.querySelector('[data-reception-dismiss]').addEventListener('click', () => { rememberSkip(); enter(); });
      receptionPlayer.video.focus({ preventScroll: true });
    }
    if (checked) return; checked = true;
    const url = new URL(location.href);
    if (url.searchParams.get('guia') === '1') {
      url.searchParams.delete('guia'); history.replaceState(null, '', url);
      if (!reception) open(document.querySelector('#main-content'));
    }
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') document.body.classList.add('news-keyboard');
    if (event.key === 'Escape' && document.querySelector('.portal-reception')) { event.preventDefault(); enter(); }
  });
  document.addEventListener('pointerdown', () => document.body.classList.remove('news-keyboard'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { dialogPlayer?.pause(); receptionPlayer?.pause(); } });
  window.addEventListener('storage', event => {
    if (event.key === SKIP_KEY && event.newValue === 'yes') { close(); if (receptionPlayer) enter(); }
  });
  window.PortalWelcome = Object.freeze({ open, onRender, renderReception, skipReception });
})();
