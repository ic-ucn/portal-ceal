(() => {
  'use strict';
  const SEEN_KEY = 'portal.welcome.v1', SKIP_KEY = 'portal.tutorial.skip';
  const CHAPTERS = [
    { id: 'malla', title: 'Explorar la malla', href: '#/mallas', link: 'Abrir malla', copy: 'Elige tu plan y toca un ramo para consultar su ficha y sus prerrequisitos.' },
    { id: 'aprobados', title: 'Marcar ramos', href: '#/mallas', link: 'Abrir malla', copy: 'Actuales y aprobados llevan una etiqueta amarilla o verde. Toca de nuevo para quitarla. El color de la tarjeta identifica el área; los pendientes no llevan marca.' },
    { id: 'mis-ramos', title: 'Organizar Mis ramos', href: '#/mallas?view=mis-ramos&section=semester', link: 'Abrir Este semestre', copy: 'Actuales reúne los ramos que estás cursando, con acceso a material, notas y actividades. Guardados conserva los ramos que quieras tener a mano.' },
    { id: 'eligible', title: 'Qué podrías cursar', href: '#/mallas?view=mis-ramos&section=eligible', link: 'Ver qué podrías cursar', copy: 'En Qué se abre, toca un actual para seguir sus caminos. Las marcas muestran los prerrequisitos aprobados y los que aún cursas. También puedes destacarlos en la malla.' },
    { id: 'material', title: 'Material de estudio', href: '#/material', link: 'Abrir material', copy: 'Busca por título o ramo, filtra el tipo y consulta los recursos disponibles.' },
    { id: 'calendario', title: 'Calendario académico', href: '#/calendario', link: 'Abrir calendario', copy: 'Cambia de mes y selecciona una fecha para consultar actividades y su fuente oficial.' }
  ];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const formatQuery = matchMedia('(max-width: 920px)');
  const prefersReducedMotion = () => motionQuery.matches;
  const track = name => window.PortalAnalytics?.event(name);
  let dialog, dialogGuide, receptionGuide, returnFocus, routeAtOpen, checked = false;

  function shell(isDialog, themeControl = '') {
    const inner = `<div class="guide-layout" data-guide-root>
      <section class="guide-stage" aria-label="Recorrido con capturas reales del portal">
        <div class="guide-stage-head"><span class="guide-example">Capturas reales con indicaciones animadas</span><span class="guide-format" data-guide-format></span></div>
        <h3 class="guide-scene-title" data-guide-scene-title></h3>
        <div class="guide-toolbar"><div class="guide-playbar"><button type="button" class="guide-primary" data-guide-play>Reproducir recorrido</button><button type="button" class="guide-secondary" data-guide-fullscreen>Pantalla completa</button></div><div class="guide-audio-controls"><label>Recorrido<select data-guide-mode><option value="text">Solo texto</option><option value="voice">Voz y texto</option></select></label><button type="button" class="guide-secondary" data-guide-music aria-pressed="false">Música: desactivada</button></div></div>
        <p class="guide-caption" data-guide-caption></p>
        <div class="guide-media"><img data-guide-still alt="" decoding="async"><video data-guide-video controls muted playsinline preload="none" hidden aria-label="Recorrido del portal"><track kind="captions" srclang="es" label="Español" default></video></div>
        <div class="guide-step-controls"><button type="button" data-guide-step-prev aria-label="Captura anterior">←</button><span data-guide-step-position></span><button type="button" data-guide-step-next aria-label="Captura siguiente">→</button><a data-guide-image-link target="_blank" rel="noopener">Ampliar captura ↗</a></div>
      </section>
      <div class="guide-content"><div class="guide-chapters" role="tablist" aria-label="Capítulos del recorrido">${CHAPTERS.map((chapter, i) => `<button type="button" role="tab" data-guide-tab="${i}" aria-label="Capítulo ${i + 1}: ${chapter.title}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${i + 1}</span><strong>${chapter.title}</strong><i></i></button>`).join('')}</div>
        <div class="guide-copy"><span data-guide-position></span><h2 data-guide-title></h2><p data-guide-copy></p><p class="guide-privacy">Tu selección y los estados de tus ramos se guardan en este navegador. No reemplazan tu avance académico oficial.</p></div>
        <div class="guide-actions"><div class="guide-transport"><button type="button" data-guide-prev>Anterior</button><button type="button" data-guide-next>Siguiente</button><button type="button" data-guide-replay>Repetir capítulo</button></div><a class="guide-open" data-guide-link href="#/mallas">Abrir sección ↗</a></div>
        <p class="guide-status" data-guide-status role="status"></p>
      </div>
    </div>`;
    if (isDialog) return `<header class="welcome-head"><div><span class="welcome-brand">CEIC UCN · GUÍA RÁPIDA</span><h2 id="welcome-title" tabindex="-1">Así funciona el portal</h2></div><button class="welcome-close" type="button" data-welcome-close aria-label="Cerrar guía"><span aria-hidden="true">×</span></button></header>${inner}<footer class="welcome-foot"><button class="welcome-skip" type="button" data-welcome-close>Saltar</button><button class="welcome-enter" type="button" data-welcome-close>Ir al portal <span aria-hidden="true">→</span></button></footer>`;
    return `<div class="portal-reception"><header class="reception-header"><a class="reception-brand" href="#/inicio" aria-label="Ir a Inicio"><img src="assets/logo-mark-transparent.png" alt=""><strong>CEIC UCN</strong></a>${themeControl}<a class="reception-skip" href="#/inicio">Saltar tutorial</a></header><main class="reception-main" id="main-content" tabindex="-1"><div class="reception-guide-head"><h1>Bienvenido al portal</h1><span>Guía rápida</span></div>${inner}<div class="reception-actions"><button type="button" class="reception-dismiss" data-reception-dismiss>No volver a mostrar</button><a class="btn primary reception-enter" href="#/inicio">Ir al portal <span aria-hidden="true">→</span></a></div></main></div>`;
  }

  class Guide {
    constructor(root, { onLink = () => {} } = {}) {
      this.root = root;
      this.onLink = onLink;
      this.index = this.stepIndex = this.desiredTime = this.playRequest = 0;
      this.video = this.find('video');
      this.still = this.find('still');
      this.videoMode = this.pendingPlay = false;
      this.mode = 'text';
      this.music = false;
      this.loadAbort = null;
      this.blobUrl = null;
      this.onClick = event => this.click(event);
      this.onKeydown = event => this.keydown(event);
      this.onChange = event => {
        if (!event.target.matches('[data-guide-mode]')) return;
        this.mode = event.target.value;
        this.applySelection();
      };
      this.onFormatChange = () => this.configure();
      this.onResize = () => this.fitVideo();
      this.onMotionChange = () => {
        this.pause(false);
        this.exitFullscreen();
        this.desiredTime = this.recording?.steps[this.stepIndex]?.start || 0;
        this.showStill();
        this.render();
        this.announce(prefersReducedMotion() ? 'Movimiento reducido: recorre las capturas con las flechas o los capítulos.' : 'Recorrido listo para reproducir.');
      };
      this.mediaListeners = {
        timeupdate: () => this.syncVideo(),
        play: () => {
          if (prefersReducedMotion() || document.hidden || !this.root.isConnected) { this.pause(false); return; }
          this.videoMode = true;
          this.showVideo();
          this.renderPlay();
          this.announce(this.mode === 'voice' ? 'Recorrido en reproducción, con voz y texto.' : this.music ? 'Recorrido en reproducción, con texto y música.' : 'Recorrido en reproducción, sin sonido.');
        },
        pause: () => this.renderPlay(),
        ended: () => {
          this.pendingPlay = false;
          this.syncVideo();
          this.renderPlay();
          this.announce('Recorrido terminado. Puedes repetirlo o entrar al portal.');
          track('tutorial/completar');
        },
        error: () => {
          if (!this.pendingPlay && !this.videoMode) return;
          this.pause(false);
          this.showStill();
          this.render();
          this.announce('Puedes seguir el recorrido con las capturas y los capítulos.');
        }
      };
      root.addEventListener('click', this.onClick);
      root.addEventListener('keydown', this.onKeydown);
      root.addEventListener('change', this.onChange);
      formatQuery.addEventListener('change', this.onFormatChange);
      window.addEventListener('resize', this.onResize);
      motionQuery.addEventListener('change', this.onMotionChange);
      Object.entries(this.mediaListeners).forEach(([name, listener]) => this.video.addEventListener(name, listener));
      this.configure();
    }
    find(name) { return this.root.querySelector(`[data-guide-${name}]`); }
    configure() {
      const previous = this.recording?.steps[this.stepIndex];
      const previousTime = this.videoMode ? this.video.currentTime : this.desiredTime;
      this.pause(false);
      this.format = formatQuery.matches ? 'mobile' : 'desktop';
      this.recording = window.PortalTutorialCapture?.formats?.[this.format];
      this.root.dataset.captureFormat = this.format;
      if (!this.recording?.steps?.length) {
        this.find('mode').disabled = true;
        this.find('music').disabled = true;
        this.announce('La guía estará disponible pronto. Puedes abrir cada sección del portal.');
        this.render();
        return;
      }
      const sameStep = this.recording.steps.findIndex(step => step.id === previous?.id);
      this.stepIndex = sameStep >= 0 ? sameStep : Math.max(0, this.recording.steps.findIndex(step => step.chapter === CHAPTERS[this.index].id));
      const step = this.recording.steps[this.stepIndex];
      this.desiredTime = previous ? Math.max(step.start, Math.min(step.end - .01, step.start + previousTime - previous.start)) : step.start;
      this.applySelection(false);
    }
    selectionKey() {
      return this.mode === 'voice' ? this.music ? 'voiceMusic' : 'voice' : this.music ? 'music' : 'silent';
    }
    applySelection(rememberTime = true) {
      if (rememberTime && this.videoMode) this.desiredTime = this.video.currentTime;
      this.pause(false);
      this.exitFullscreen();
      const variants = this.recording?.variants || {};
      if (!variants.voice) this.mode = 'text';
      if (!(this.mode === 'voice' ? variants.voiceMusic : variants.music)) this.music = false;
      const key = this.selectionKey();
      this.releaseBlob();
      this.video.preload = 'none';
      this.mediaSource = variants[key] || this.recording.video;
      this.video.src = this.mediaSource;
      this.video.muted = key === 'silent';
      this.video.querySelector('track').src = this.recording.track;
      this.root.dataset.audioMode = this.mode;
      this.root.dataset.music = String(this.music);
      this.find('mode').value = this.mode;
      this.find('mode').querySelector('[value="voice"]').disabled = !variants.voice;
      this.find('music').disabled = !(this.mode === 'voice' ? variants.voiceMusic : variants.music);
      this.find('music').setAttribute('aria-pressed', String(this.music));
      this.find('music').textContent = `Música: ${this.music ? 'activada' : 'desactivada'}`;
      this.showStill();
      this.render();
      if (rememberTime) this.announce('Recorrido en pausa. Reproduce para continuar con esta opción.');
    }
    render() {
      const step = this.recording?.steps[this.stepIndex];
      if (step) this.index = Math.max(0, CHAPTERS.findIndex(chapter => chapter.id === step.chapter));
      const chapter = CHAPTERS[this.index];
      this.find('scene-title').textContent = chapter.title;
      this.find('title').textContent = chapter.title;
      this.find('copy').textContent = chapter.copy;
      this.find('caption').textContent = step?.caption || chapter.copy;
      this.find('format').textContent = this.format === 'mobile' ? 'Versión móvil' : 'Versión escritorio';
      this.find('position').textContent = `${this.index + 1} de ${CHAPTERS.length}${this.recording ? ` · ${Math.round(this.recording.duration)} s` : ''}`;
      this.find('link').href = chapter.href;
      this.find('link').textContent = `${chapter.link} ↗`;
      this.find('prev').disabled = this.index === 0;
      this.find('next').disabled = this.index === CHAPTERS.length - 1;
      this.find('step-prev').disabled = !step || this.stepIndex === 0;
      this.find('step-next').disabled = !step || this.stepIndex === this.recording.steps.length - 1;
      this.find('step-position').textContent = step ? `Captura ${this.stepIndex + 1} de ${this.recording.steps.length}` : '';
      this.root.querySelectorAll('[data-guide-tab]').forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === this.index));
        tab.tabIndex = i === this.index ? 0 : -1;
      });
      if (step) {
        this.find('image-link').href = step.image;
        if (!this.videoMode) { this.still.src = step.image; this.still.alt = step.caption; }
      }
      this.root.querySelector('.guide-media').style.aspectRatio = `${this.recording?.width || 1440} / ${this.recording?.height || 900}`;
      this.root.querySelector('.guide-media').style.setProperty('--guide-aspect', String((this.recording?.width || 1440) / (this.recording?.height || 900)));
      this.renderPlay();
      this.progress(this.videoMode ? this.video.currentTime : this.desiredTime);
    }
    renderPlay() {
      const button = this.find('play');
      button.disabled = !this.recording || prefersReducedMotion();
      button.textContent = prefersReducedMotion() ? 'Usa las capturas para avanzar' : this.pendingPlay ? 'Cancelar carga' : !this.video.paused ? 'Pausar' : this.videoMode && !this.video.ended ? 'Continuar recorrido' : 'Reproducir recorrido';
    }
    progress(time) {
      this.root.querySelectorAll('[data-guide-tab] i').forEach((bar, index) => {
        const steps = this.recording?.steps.filter(step => step.chapter === CHAPTERS[index].id) || [];
        const start = steps[0]?.start || 0, end = steps.at(-1)?.end || start;
        bar.style.width = `${end > start ? Math.max(0, Math.min(100, (time - start) / (end - start) * 100)) : 0}%`;
      });
    }
    announce(message) { this.find('status').textContent = message; }
    showStill() { this.videoMode = false; this.video.hidden = true; this.still.hidden = false; this.root.querySelector('.guide-media').classList.remove('is-video'); }
    showVideo() { this.video.hidden = false; this.still.hidden = true; this.root.querySelector('.guide-media').classList.add('is-video'); }
    fitVideo() {
      if (!this.videoMode) return;
      const media = this.root.querySelector('.guide-media');
      const top = Math.max(0, media.getBoundingClientRect().top);
      media.style.setProperty('--guide-media-available', `${Math.max(140, innerHeight - top - 12)}px`);
    }
    syncVideo() {
      if (!this.videoMode || !this.recording) return;
      const time = this.video.currentTime;
      const found = this.recording.steps.findIndex(step => time >= step.start && time < step.end);
      const next = found >= 0 ? found : time >= this.recording.duration ? this.recording.steps.length - 1 : 0;
      if (this.stepIndex !== next) {
        const oldChapter = this.index;
        this.stepIndex = next;
        this.render();
        if (oldChapter !== this.index) this.announce(`Capítulo ${this.index + 1} de ${CHAPTERS.length}: ${CHAPTERS[this.index].title}`);
      }
      this.progress(time);
    }
    waitForMedia(eventName, signal) {
      if (signal.aborted) return Promise.reject(new Error('cancelled'));
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timeout);
          this.video.removeEventListener(eventName, loaded);
          this.video.removeEventListener('error', failed);
          signal.removeEventListener('abort', aborted);
        };
        const loaded = () => { cleanup(); resolve(); };
        const failed = () => { cleanup(); reject(new Error('media-unavailable')); };
        const aborted = () => { cleanup(); reject(new Error('cancelled')); };
        const timeout = setTimeout(failed, 10000);
        this.video.addEventListener(eventName, loaded);
        this.video.addEventListener('error', failed);
        signal.addEventListener('abort', aborted, { once: true });
      });
    }
    releaseBlob() {
      if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    async seekTo(target, signal) {
      if (Math.abs(this.video.currentTime - target) <= .01) return;
      const seeked = this.waitForMedia('seeked', signal);
      this.video.currentTime = target;
      await seeked;
      if (Math.abs(this.video.currentTime - target) > .5) throw new Error('media-not-seekable');
    }
    async seekWithFallback(target, signal) {
      try { await this.seekTo(target, signal); }
      catch (error) {
        if (signal.aborted || this.video.error || this.blobUrl) throw error;
        // Static hosts without byte ranges can clamp a chapter seek to zero.
        // Download this one selected, bounded asset only after that failure.
        const response = await fetch(this.mediaSource, { signal });
        const limit = 24 * 1024 * 1024;
        if (!response.ok || Number(response.headers.get('content-length')) > limit) throw error;
        const blob = await response.blob();
        if (signal.aborted || blob.size > limit) throw error;
        this.blobUrl = URL.createObjectURL(blob);
        this.video.src = this.blobUrl;
        this.video.preload = 'auto';
        this.video.load();
        if (this.video.readyState < 1) await this.waitForMedia('loadedmetadata', signal);
        if (this.video.readyState < 3) await this.waitForMedia('canplay', signal);
        await this.seekTo(target, signal);
      }
    }
    async play() {
      if (!this.recording || prefersReducedMotion()) return;
      const request = ++this.playRequest;
      this.pendingPlay = true;
      this.loadAbort = new AbortController();
      const signal = this.loadAbort.signal;
      this.renderPlay();
      try {
        if (this.video.readyState < 1) { this.video.preload = 'auto'; this.video.load(); }
        if (this.video.readyState < 1) await this.waitForMedia('loadedmetadata', signal);
        if (this.video.readyState < 3) await this.waitForMedia('canplay', signal);
        if (request !== this.playRequest || document.hidden || !this.root.isConnected) return;
        if (!this.videoMode || this.video.ended) {
          const target = this.video.ended ? 0 : this.desiredTime;
          await this.seekWithFallback(target, signal);
        }
        if (request !== this.playRequest || document.hidden || !this.root.isConnected) return;
        this.pendingPlay = false;
        this.showVideo();
        await this.video.play();
        if (request !== this.playRequest) { this.video.pause(); return; }
        this.videoMode = true;
        this.renderPlay();
        this.root.querySelector('.guide-stage').scrollIntoView({ block: 'start', behavior: 'auto' });
        this.fitVideo();
        track('tutorial/reproducir');
      } catch {
        if (request !== this.playRequest) return;
        this.pendingPlay = false;
        this.showStill();
        this.render();
        this.announce('Puedes seguir el recorrido con las capturas y los capítulos.');
      }
    }
    pause(report = true) {
      const active = this.pendingPlay || !this.video.paused;
      this.playRequest += 1;
      this.loadAbort?.abort();
      this.loadAbort = null;
      this.pendingPlay = false;
      this.video.pause();
      this.renderPlay();
      if (active && report) { this.announce('Recorrido en pausa.'); track('tutorial/pausar'); }
    }
    stopMotion() { this.pause(false); }
    exitFullscreen() {
      if (document.fullscreenElement && this.root.contains(document.fullscreenElement)) document.exitFullscreen?.().catch(() => {});
    }
    async fullscreen() {
      const media = this.root.querySelector('.guide-media');
      try {
        if (media.requestFullscreen) await media.requestFullscreen();
        else if (this.videoMode && this.video.webkitEnterFullscreen) this.video.webkitEnterFullscreen();
        else this.announce('Puedes ampliar la captura con el enlace inferior.');
      } catch { this.announce('Puedes ampliar la captura con el enlace inferior.'); }
    }
    go(index) {
      this.pause(false);
      this.index = Math.max(0, Math.min(CHAPTERS.length - 1, index));
      const found = this.recording?.steps.findIndex(step => step.chapter === CHAPTERS[this.index].id);
      this.stepIndex = found >= 0 ? found : 0;
      this.desiredTime = this.recording?.steps[this.stepIndex]?.start || 0;
      this.showStill();
      this.render();
      this.announce(`Capítulo ${this.index + 1} de ${CHAPTERS.length}: ${CHAPTERS[this.index].title}`);
    }
    goStep(index) {
      if (!this.recording) return;
      this.pause(false);
      this.stepIndex = Math.max(0, Math.min(this.recording.steps.length - 1, index));
      this.desiredTime = this.recording.steps[this.stepIndex].start;
      this.showStill();
      this.render();
      this.announce(this.recording.steps[this.stepIndex].caption);
    }
    click(event) {
      const tab = event.target.closest('[data-guide-tab]');
      if (tab) { this.go(Number(tab.dataset.guideTab)); track('tutorial/capitulo'); return; }
      if (event.target.closest('[data-guide-play]')) { this.pendingPlay || !this.video.paused ? this.pause() : this.play(); return; }
      if (event.target.closest('[data-guide-fullscreen]')) { this.fullscreen(); return; }
      if (event.target.closest('[data-guide-music]')) { this.music = !this.music; this.applySelection(); return; }
      if (event.target.closest('[data-guide-prev]')) { this.go(this.index - 1); track('tutorial/anterior'); return; }
      if (event.target.closest('[data-guide-next]')) { this.go(this.index + 1); track('tutorial/siguiente'); return; }
      if (event.target.closest('[data-guide-replay]')) { this.go(this.index); track('tutorial/repetir'); return; }
      if (event.target.closest('[data-guide-step-prev]')) { this.goStep(this.stepIndex - 1); return; }
      if (event.target.closest('[data-guide-step-next]')) { this.goStep(this.stepIndex + 1); return; }
      if (event.target.closest('[data-guide-link]')) { this.pause(false); this.onLink(); }
    }
    keydown(event) {
      if (!event.target.closest('[data-guide-tab]') || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? CHAPTERS.length - 1 : (this.index + (event.key === 'ArrowRight' ? 1 : -1) + CHAPTERS.length) % CHAPTERS.length;
      this.go(index);
      this.root.querySelector(`[data-guide-tab="${index}"]`).focus();
      track('tutorial/capitulo');
    }
    destroy() {
      this.pause(false);
      this.exitFullscreen();
      this.releaseBlob();
      this.root.removeEventListener('click', this.onClick);
      this.root.removeEventListener('keydown', this.onKeydown);
      this.root.removeEventListener('change', this.onChange);
      formatQuery.removeEventListener('change', this.onFormatChange);
      window.removeEventListener('resize', this.onResize);
      motionQuery.removeEventListener('change', this.onMotionChange);
      Object.entries(this.mediaListeners).forEach(([name, listener]) => this.video.removeEventListener(name, listener));
      this.video.removeAttribute('src');
      this.video.querySelector('track').removeAttribute('src');
      this.video.load();
    }
  }

  function seen() { try { return localStorage.getItem(SEEN_KEY) === 'done'; } catch { return false; } }
  function skipReception() { try { return localStorage.getItem(SKIP_KEY) === 'yes'; } catch { return false; } }
  function close({ navigate = false } = {}) {
    if (!dialog?.open) return;
    checked = true;
    try { localStorage.setItem(SEEN_KEY, 'done'); } catch {}
    dialogGuide?.stopMotion();
    dialog.close();
    document.body.classList.remove('welcome-open');
    if (!navigate) (returnFocus?.isConnected ? returnFocus : document.querySelector('#main-content'))?.focus({ preventScroll: true });
  }
  function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'portal-welcome';
    dialog.setAttribute('aria-labelledby', 'welcome-title');
    dialog.innerHTML = shell(true);
    document.body.append(dialog);
    dialogGuide = new Guide(dialog.querySelector('[data-guide-root]'), { onLink: () => close({ navigate: true }) });
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-welcome-close]')) close();
      else if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }
    });
    document.addEventListener('keydown', event => {
      if (!dialog.open) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      if (event.key !== 'Tab') return;
      event.stopImmediatePropagation();
      const targets = [...dialog.querySelectorAll('button, a[href], select, video[controls]')].filter(node => !node.disabled && !node.hidden && node.getClientRects().length && node.getAttribute('aria-hidden') !== 'true' && node.tabIndex >= 0);
      const first = targets[0], last = targets[targets.length - 1], active = document.activeElement;
      if (event.shiftKey && (active === first || active.id === 'welcome-title')) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
    }, true);
    window.addEventListener('storage', event => {
      if (event.key === SEEN_KEY && event.newValue === 'done') { checked = true; close(); }
    });
  }
  function open(trigger = document.activeElement, options = {}) {
    createDialog();
    if (dialog.open || typeof dialog.showModal !== 'function') return;
    returnFocus = trigger;
    routeAtOpen = location.hash;
    const chapterIndex = CHAPTERS.findIndex(chapter => chapter.id === options.chapter);
    dialogGuide.go(chapterIndex >= 0 ? chapterIndex : dialogGuide.index);
    dialogGuide.stopMotion();
    document.body.classList.add('welcome-open');
    dialog.showModal();
    dialog.querySelector('#welcome-title').focus({ preventScroll: true });
  }
  function renderReception(themeControl) { return shell(false, themeControl); }
  function onRender() {
    if (dialog?.open && location.hash !== routeAtOpen) close({ navigate: true });
    const reception = document.querySelector('.portal-reception');
    if (!reception && receptionGuide) { receptionGuide.destroy(); receptionGuide = null; }
    if (reception && !receptionGuide) {
      receptionGuide = new Guide(reception.querySelector('[data-guide-root]'));
      reception.querySelectorAll('.reception-enter, .reception-skip').forEach(link => {
        link.addEventListener('click', () => receptionGuide?.stopMotion());
      });
      reception.querySelector('[data-reception-dismiss]').addEventListener('click', () => {
        try { localStorage.setItem(SKIP_KEY, 'yes'); } catch {}
        receptionGuide?.pause(false);
        location.hash = '/inicio';
      });
    }
    if (checked) return;
    checked = true;
    const url = new URL(location.href);
    if (url.searchParams.get('guia') === '1') {
      url.searchParams.delete('guia');
      history.replaceState(null, '', url);
      if (!reception) open(document.querySelector('#main-content'));
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    dialogGuide?.pause(false);
    receptionGuide?.pause(false);
  });
  window.PortalWelcome = Object.freeze({ open, onRender, renderReception, skipReception });
})();
