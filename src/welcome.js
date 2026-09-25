(() => {
  'use strict';

  const SEEN_KEY = 'portal.welcome.v1';
  const SKIP_KEY = 'portal.tutorial.skip';
  const CHAPTERS = [
    { id: 'malla', title: 'Explorar la malla', duration: 8000, href: '#/mallas', link: 'Abrir malla',
      copy: 'Elige tu plan y toca un ramo para consultar sus prerrequisitos y el material asociado.' },
    { id: 'aprobados', title: 'Marcar aprobados', duration: 12000, href: '#/mallas', link: 'Abrir malla',
      copy: 'Activa Marcar aprobados y toca cada ramo que ya aprobaste. También puedes aprobar hasta un semestre y deshacer ese lote.' },
    { id: 'mis-ramos', title: 'Mis ramos', duration: 10000, href: '#/mis-ramos', link: 'Abrir Mis ramos',
      copy: 'Elige tus ramos y registra si están pendientes, en curso o aprobados. La selección es independiente; el estado aprobado se comparte con la malla.' },
    { id: 'material', title: 'Material de estudio', duration: 8000, href: '#/material', link: 'Abrir material',
      copy: 'Busca material por título o ramo, filtra el tipo y abre el recurso que necesitas. También puedes llegar desde Mis ramos.' },
    { id: 'calendario', title: 'Calendario académico', duration: 8000, href: '#/calendario', link: 'Abrir calendario',
      copy: 'Cambia de mes y abre una fecha para consultar las actividades publicadas y su fuente oficial.' }
  ];
  const TOTAL = CHAPTERS.reduce((sum, chapter) => sum + chapter.duration, 0);
  const CUES = [
    ['Elige un ramo', 'Toca Mecánica', 'Consulta sus prerrequisitos', 'Abre la ficha del ramo'],
    ['Activa Marcar aprobados', 'Toca los ramos aprobados', 'Dos ramos marcados', 'Aplica el lote o usa Deshacer'],
    ['Busca un ramo', 'Agrégalo a tu selección', 'Cambia el estado a Cursando', 'Consulta su material'],
    ['Busca por ramo', 'Búsqueda aplicada', 'Filtra por tipo', 'Abre un recurso'],
    ['Cambia de mes', 'Selecciona una fecha', 'Consulta sus actividades', 'Abre la fuente oficial']
  ];
  const sourceCourses = window.CURRICULA?.planO?.subjects || [];
  const sample = [1, 2].flatMap(semester => sourceCourses.filter(course => course.semester === semester).slice(0, 3));
  const shortName = name => String(name || '').toLocaleLowerCase('es-CL')
    .replace(/(^|\s)\p{L}/gu, letter => letter.toLocaleUpperCase('es-CL'))
    .replace(/\b(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi, numeral => numeral.toUpperCase());
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => motionQuery.matches;
  const track = name => window.PortalAnalytics?.event(name);
  let dialog, dialogGuide, receptionGuide, returnFocus, routeAtOpen, checked = false;

  function courseTile(course, approved = false, action = false, focus = false) {
    return `<button class="guide-course ${approved ? 'is-approved' : ''} ${focus ? 'is-focus' : ''}" type="button"${action ? ` data-guide-approve="${esc(course.code)}"` : ' tabindex="-1"'} aria-label="${esc(shortName(course.name))}${approved ? ', aprobado' : ''}"${action ? '' : ' aria-hidden="true"'}><small>${esc(course.visibleCode || course.code)}</small><strong>${esc(shortName(course.name))}</strong><span>${approved ? 'Aprobado' : 'Pendiente'}</span>${focus ? '<i class="guide-touch" aria-hidden="true"></i>' : ''}</button>`;
  }

  function visual(guide) {
    const chapter = CHAPTERS[guide.index];
    const courses = sample.length ? sample : [
      { code: 'DAMA-00135', name: 'CÁLCULO I', semester: 1 },
      { code: 'DAFI-00103', name: 'INTRODUCCIÓN A LA FÍSICA', semester: 1 }
    ];
    if (chapter.id === 'malla') {
      const shown = courses.slice(0, 6);
      const selected = shown.find(c => c.name.includes('MECÁNICA')) || shown.find(c => c.semester === 2) || shown[0];
      const prereqs = (selected.prereqs || []).map(code => sourceCourses.find(c => c.code === code)).filter(Boolean);
      return `<div class="guide-visual guide-malla" data-guide-visual aria-label="Vista ilustrativa de la malla">
        <div class="guide-mini-top"><strong>Mallas</strong><span class="guide-mini-tabs"><b>Plan O</b><span>Plan P</span></span></div>
        <div class="guide-semesters"><section><h4>Semestre 1</h4><div class="guide-course-list">${shown.filter(c => c.semester === 1).map(course => courseTile(course, false, false, guide.phase >= 2 && prereqs.some(p => p.code === course.code))).join('')}</div></section><section><h4>Semestre 2</h4><div class="guide-course-list">${shown.filter(c => c.semester === 2).map(course => courseTile(course, false, false, guide.phase >= 1 && course.code === selected.code)).join('')}</div></section></div>
        ${guide.phase >= 2 ? `<div class="guide-mini-detail"><small>FICHA DEL RAMO</small><strong>${esc(shortName(selected.name))}</strong><span>Prerrequisitos: ${prereqs.length ? esc(prereqs.map(c => shortName(c.name)).join(' · ')) : 'Sin prerrequisitos'}</span><span>Material asociado: abre la ficha para consultarlo</span></div>` : '<div class="guide-mini-hint">Toca un ramo para ver su ficha y las relaciones de la malla.</div>'}
      </div>`;
    }
    if (chapter.id === 'aprobados') {
      const shown = courses.slice(0, 6);
      const pending = shown.filter(course => !guide.approved.has(course.code)).length;
      return `<div class="guide-visual guide-approvals" data-guide-visual aria-label="Práctica ilustrativa de marcado de aprobados">
        <div class="guide-mini-top"><strong>Mallas · Plan O</strong><span class="guide-mini-mark ${guide.phase >= 1 || guide.manual ? 'is-on' : ''}">Marcar aprobados ${guide.phase >= 1 || guide.manual ? '· activo' : ''}</span></div>
        <p class="guide-visual-instruction">${guide.manual ? guide.undo ? 'Lote aplicado: Deshacer restaura el estado anterior.' : 'Toca un ramo para marcarlo o dejarlo pendiente.' : guide.phase >= 3 ? 'Lote aplicado: Deshacer restaura el estado anterior.' : guide.phase >= 2 ? 'Dos ramos marcados. Puedes tocar cualquiera para cambiarlo.' : 'Activa el marcado y toca cada ramo aprobado.'}</p>
        <div class="guide-semesters"><section><h4>Semestre 1</h4><div class="guide-course-list">${shown.filter(c => c.semester === 1).slice(0, 3).map(c => courseTile(c, guide.approved.has(c.code), true)).join('')}</div></section><section><h4>Semestre 2</h4><div class="guide-course-list">${shown.filter(c => c.semester === 2).slice(0, 3).map(c => courseTile(c, guide.approved.has(c.code), true)).join('')}</div></section></div>
        <div class="guide-mini-batch"><span>Aprobar hasta el semestre <b>2</b></span><button type="button" data-guide-batch${pending ? '' : ' disabled'}>Aplicar</button><button type="button" data-guide-undo${guide.undo ? '' : ' disabled'}>Deshacer lote</button></div>
        <p class="guide-visual-note">Marcar aprobados no agrega ramos a Mis ramos.</p>
      </div>`;
    }
    if (chapter.id === 'mis-ramos') {
      const course = courses.find(c => c.name.includes('CÁLCULO')) || courses[0];
      return `<div class="guide-visual guide-my-courses" data-guide-visual aria-label="Vista ilustrativa de Mis ramos">
        <div class="guide-mini-top"><strong>Mis ramos</strong><span class="guide-mini-tabs"><b>Plan O</b><span>Plan P</span></span></div>
        <div class="guide-my-layout"><section><small>TU SELECCIÓN</small>${guide.phase >= 1 ? `<article class="guide-my-card"><small>${esc(course.visibleCode || course.code)} · ${course.semester} semestre</small><strong>${esc(shortName(course.name))}</strong><div><span>Estado</span><b class="${guide.phase >= 2 ? 'is-current' : ''}">${guide.phase >= 2 ? 'Cursando' : 'Pendiente'}</b></div><span class="guide-my-material">Ver material del ramo →</span></article>` : '<div class="guide-my-empty">Aún no eliges ramos</div>'}</section><section><small>BUSCAR RAMOS</small><div class="guide-mini-input">Nombre o código</div><div class="guide-my-option"><span>${esc(shortName(course.name))}</span><b class="${guide.phase >= 1 ? 'is-added' : ''}">${guide.phase >= 1 ? 'Agregado' : 'Agregar'}</b></div></section></div>
        <p class="guide-visual-note">La selección es independiente; el estado aprobado se comparte con la malla.</p>
      </div>`;
    }
    if (chapter.id === 'material') {
      return `<div class="guide-visual guide-material" data-guide-visual aria-label="Vista ilustrativa de la biblioteca de material">
        <div class="guide-mini-top"><strong>Material de estudio</strong><span>Biblioteca</span></div>
        <div class="guide-material-search"><span>${guide.phase >= 1 ? 'Cálculo I' : 'Buscar por título, ramo o código'}</span><b>⌕</b></div>
        <div class="guide-material-filters"><span>Ramo: ${guide.phase >= 1 ? 'Cálculo I' : 'Todos'}</span><span>Tipo: ${guide.phase >= 2 ? 'Guía' : 'Todos'}</span></div>
        <div class="guide-material-types"><b>Todos</b><span>Apuntes</span><span class="${guide.phase >= 2 ? 'is-focus' : ''}">Guías</span><span>Pruebas</span></div>
        ${guide.phase >= 2 ? `<div class="guide-material-result"><span>RESULTADOS FILTRADOS</span><strong>Elige un recurso disponible</strong><small>Abre el detalle para consultar el archivo y su ramo.</small><b>→</b></div>` : '<div class="guide-mini-hint">Busca un ramo y filtra los recursos por tipo.</div>'}
        ${guide.phase >= 3 ? '<div class="guide-material-open">Detalle del recurso <b>Abrir material ↗</b></div>' : ''}
      </div>`;
    }
    return `<div class="guide-visual guide-calendar" data-guide-visual aria-label="Vista ilustrativa del calendario sin fechas">
      <div class="guide-mini-top"><strong>Calendario académico</strong><span>Antofagasta</span></div>
      <div class="guide-calendar-head"><b>←</b><strong>Mes del calendario</strong><b>→</b></div>
      <div class="guide-calendar-weekdays" aria-hidden="true"><b>L</b><b>M</b><b>M</b><b>J</b><b>V</b><b>S</b><b>D</b></div>
      <div class="guide-calendar-grid" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<span${i === 11 && guide.phase >= 1 ? ' class="is-focus"' : ''}></span>`).join('')}</div>
      ${guide.phase >= 2 ? '<div class="guide-calendar-detail"><strong>Actividades de la fecha seleccionada</strong><span>Abre una actividad para consultar el documento oficial.</span></div>' : '<div class="guide-mini-hint">Selecciona una fecha para ver sus actividades.</div>'}
    </div>`;
  }

  function shell(isDialog, themeControl = '') {
    const inner = `<div class="guide-layout" data-guide-root>
      <div class="guide-stage" role="region" aria-label="Ejemplo del portal"><span class="guide-example">Ejemplo ilustrativo</span><span class="guide-step" data-guide-step></span><div data-guide-stage></div></div>
      <div class="guide-content"><div class="guide-chapters" role="tablist" aria-label="Capítulos del recorrido">${CHAPTERS.map((chapter, i) => `<button type="button" role="tab" data-guide-tab="${i}" aria-label="Capítulo ${i + 1}: ${chapter.title}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${i + 1}</span><strong>${chapter.title}</strong><i></i></button>`).join('')}</div>
        <div class="guide-copy" aria-live="polite"><span data-guide-position>1 de 5</span><h2 data-guide-title></h2><p data-guide-copy></p><p class="guide-privacy">Los cambios que registres se guardan en este navegador y no reemplazan tu avance académico oficial.</p></div>
        <div class="guide-actions"><button type="button" class="guide-primary" data-guide-play>Reproducir recorrido</button><div class="guide-transport"><button type="button" data-guide-prev>Anterior</button><button type="button" data-guide-next>Siguiente</button><button type="button" data-guide-replay>Repetir escena</button></div><a class="guide-open" data-guide-link href="#/mallas">Abrir sección ↗</a></div>
        <p class="guide-status" data-guide-status role="status"></p>
      </div>
    </div>`;
    if (isDialog) return `<header class="welcome-head"><div><span class="welcome-brand">CEIC UCN · GUÍA RÁPIDA</span><h2 id="welcome-title" tabindex="-1">Así funciona el portal</h2></div><button class="welcome-close" type="button" data-welcome-close aria-label="Cerrar guía"><span aria-hidden="true">×</span></button></header>${inner}<footer class="welcome-foot"><button class="welcome-skip" type="button" data-welcome-close>Saltar</button><button class="welcome-enter" type="button" data-welcome-close>Ir al portal <span aria-hidden="true">→</span></button></footer>`;
    return `<div class="portal-reception reception-motion"><header class="reception-header"><a class="reception-brand" href="#/inicio" aria-label="Ir a Inicio"><img src="assets/logo-mark-transparent.png" alt=""><strong>CEIC UCN</strong></a>${themeControl}<a class="reception-skip" href="#/inicio">Saltar tutorial</a></header><main class="reception-main" id="main-content" tabindex="-1"><div class="reception-guide-head"><h1>Bienvenido al portal</h1><span>Guía rápida</span></div>${inner}<div class="reception-actions"><button type="button" class="reception-dismiss" data-reception-dismiss>No volver a mostrar</button><a class="btn primary reception-enter" href="#/inicio">Ir al portal <span aria-hidden="true">→</span></a></div></main></div>`;
  }

  class Guide {
    constructor(root, { onLink = () => {} } = {}) {
      this.root = root;
      this.onLink = onLink;
      this.index = 0;
      this.elapsed = 0;
      this.phase = prefersReducedMotion() ? 3 : 0;
      this.playing = false;
      this.manual = false;
      this.approved = new Set();
      this.undo = null;
      this.animations = new Set();
      this.lastTick = 0;
      this.timer = null;
      this.onClick = event => this.click(event);
      this.onKeydown = event => this.keydown(event);
      this.onMotionChange = event => {
        this.stopMotion();
        if (event.matches) {
          this.elapsed = CHAPTERS[this.index].duration;
          this.phase = 3;
          if (this.index === 1 && !this.manual) {
            this.approved = new Set(sample.map(course => course.code));
            this.undo = new Set(sample.slice(0, 2).map(course => course.code));
          }
          this.render();
          this.announce('Movimiento reducido: usa los capítulos o Siguiente para avanzar.');
        } else {
          this.elapsed = 0;
          this.phase = 0;
          this.render();
          this.announce('Recorrido listo para reproducir.');
        }
      };
      root.addEventListener('click', this.onClick);
      root.addEventListener('keydown', this.onKeydown);
      motionQuery.addEventListener('change', this.onMotionChange);
      this.render();
    }
    render() {
      const chapter = CHAPTERS[this.index];
      this.root.querySelector('[data-guide-stage]').innerHTML = visual(this);
      this.root.querySelector('[data-guide-position]').textContent = `${this.index + 1} de ${CHAPTERS.length} · ${Math.round(TOTAL / 1000)} s`;
      this.root.querySelector('[data-guide-title]').textContent = chapter.title;
      this.root.querySelector('[data-guide-copy]').textContent = chapter.copy;
      this.root.querySelector('[data-guide-step]').textContent = CUES[this.index][this.phase];
      const link = this.root.querySelector('.guide-actions [data-guide-link]');
      link.href = chapter.href;
      link.textContent = `${chapter.link} ↗`;
      this.root.querySelector('[data-guide-prev]').disabled = this.index === 0;
      this.root.querySelector('[data-guide-next]').disabled = this.index === CHAPTERS.length - 1;
      this.root.querySelector('[data-guide-play]').textContent = this.playing ? 'Pausar' : this.elapsed ? 'Continuar recorrido' : 'Reproducir recorrido';
      this.root.querySelectorAll('[data-guide-tab]').forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === this.index));
        tab.tabIndex = i === this.index ? 0 : -1;
      });
      this.progress();
      this.root.dataset.phase = this.phase === 0 ? 'start' : this.phase === 3 ? 'final' : 'middle';
    }
    progress() {
      const chapter = CHAPTERS[this.index];
      this.root.querySelectorAll('[data-guide-tab] i').forEach((bar, i) => {
        bar.style.width = `${i < this.index ? 100 : i === this.index ? Math.min(100, this.elapsed / chapter.duration * 100) : 0}%`;
      });
    }
    announce(message) { this.root.querySelector('[data-guide-status]').textContent = message; }
    animateStage() {
      if (prefersReducedMotion()) return;
      const stage = this.root.querySelector('[data-guide-visual]');
      if (!stage?.animate) return;
      const animation = stage.animate([{ opacity: .3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.2, 0, .2, 1)' });
      this.animations.add(animation);
      animation.finished.finally(() => this.animations.delete(animation)).catch(() => {});
    }
    renderVisual() {
      this.root.querySelector('[data-guide-stage]').innerHTML = visual(this);
      if (prefersReducedMotion()) return;
      const newElement = this.root.querySelector('[data-guide-visual]');
      if (!newElement?.animate) return;
      const animation = newElement.animate([{ opacity: .7, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.2, 0, .2, 1)' });
      this.animations.add(animation);
      animation.finished.finally(() => this.animations.delete(animation)).catch(() => {});
    }
    setPhase(nextPhase) {
      if (nextPhase === this.phase) return;
      this.phase = nextPhase;
      this.root.dataset.phase = nextPhase === 0 ? 'start' : nextPhase === 3 ? 'final' : 'middle';
      if (this.index === 1 && !this.manual) {
        if (nextPhase >= 2) sample.slice(0, 2).forEach(course => this.approved.add(course.code));
        if (nextPhase >= 3) {
          this.undo = new Set(this.approved);
          sample.forEach(course => this.approved.add(course.code));
        }
      }
      this.renderVisual();
      this.pulse();
      if (!(this.index === 1 && this.manual)) {
        this.root.querySelector('[data-guide-step]').textContent = CUES[this.index][nextPhase];
        this.announce(CUES[this.index][nextPhase]);
      }
    }
    pulse() {
      if (prefersReducedMotion()) return;
      const target = this.root.querySelector('.guide-course.is-approved, .guide-mini-detail, .guide-my-card, .guide-material-result, .guide-calendar-grid .is-focus');
      if (!target?.animate) return;
      const animation = target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
      this.animations.add(animation);
      animation.finished.finally(() => this.animations.delete(animation)).catch(() => {});
    }
    tick() {
      if (!this.playing) return;
      const now = performance.now();
      this.elapsed += now - this.lastTick;
      this.lastTick = now;
      const chapter = CHAPTERS[this.index];
      if (this.elapsed >= chapter.duration) {
        if (this.index === CHAPTERS.length - 1) {
          this.elapsed = chapter.duration;
          this.progress();
          this.pause(false);
          this.announce('Recorrido terminado. Puedes repetirlo o entrar al portal.');
          track('tutorial/completar');
          return;
        }
        this.index += 1;
        this.elapsed = 0;
        this.phase = 0;
        this.manual = false;
        this.approved = new Set();
        this.undo = null;
        this.render();
        this.animateStage();
        this.announce(`Capítulo ${this.index + 1}: ${CHAPTERS[this.index].title}`);
      } else {
        this.progress();
        const phase = Math.min(3, Math.floor(this.elapsed / chapter.duration * 4));
        if (phase !== this.phase) this.setPhase(phase);
      }
      this.timer = setTimeout(() => this.tick(), 50);
    }
    play() {
      if (prefersReducedMotion()) { this.setPhase(3); this.announce('Movimiento reducido: usa los capítulos o Siguiente para avanzar.'); return; }
      if (this.index === CHAPTERS.length - 1 && this.elapsed >= CHAPTERS[this.index].duration) { this.go(0); }
      this.playing = true;
      this.lastTick = performance.now();
      this.animations.forEach(animation => animation.play());
      this.root.querySelector('[data-guide-play]').textContent = 'Pausar';
      this.tick();
      track('tutorial/reproducir');
    }
    pause(report = true) {
      if (!this.playing) return;
      this.playing = false;
      clearTimeout(this.timer);
      this.animations.forEach(animation => animation.pause());
      this.root.querySelector('[data-guide-play]').textContent = this.elapsed ? 'Continuar recorrido' : 'Reproducir recorrido';
      if (report) { this.announce('Recorrido en pausa.'); track('tutorial/pausar'); }
    }
    stopMotion() {
      this.pause(false);
      this.animations.forEach(animation => animation.cancel());
      this.animations.clear();
    }
    go(index) {
      this.stopMotion();
      this.index = Math.max(0, Math.min(CHAPTERS.length - 1, index));
      this.elapsed = 0;
      this.phase = prefersReducedMotion() ? 3 : 0;
      this.manual = false;
      this.approved = new Set();
      this.undo = null;
      if (prefersReducedMotion() && this.index === 1) {
        this.approved = new Set(sample.map(course => course.code));
        this.undo = new Set(sample.slice(0, 2).map(course => course.code));
      }
      this.render();
      this.animateStage();
      this.announce(`Capítulo ${this.index + 1}: ${CHAPTERS[this.index].title}`);
    }
    click(event) {
      const tab = event.target.closest('[data-guide-tab]');
      if (tab) { this.go(Number(tab.dataset.guideTab)); track('tutorial/capitulo'); return; }
      if (event.target.closest('[data-guide-play]')) { this.playing ? this.pause() : this.play(); return; }
      if (event.target.closest('[data-guide-prev]')) { this.go(this.index - 1); track('tutorial/anterior'); return; }
      if (event.target.closest('[data-guide-next]')) { this.go(this.index + 1); track('tutorial/siguiente'); return; }
      if (event.target.closest('[data-guide-replay]')) { this.go(this.index); track('tutorial/repetir'); return; }
      const tile = event.target.closest('[data-guide-approve]');
      if (tile) {
        this.pause(false);
        this.manual = true;
        const code = tile.dataset.guideApprove;
        this.approved.has(code) ? this.approved.delete(code) : this.approved.add(code);
        this.renderVisual();
        this.root.querySelector(`[data-guide-approve="${CSS.escape(code)}"]`)?.focus();
        this.root.querySelector('[data-guide-step]').textContent = 'Marca y desmarca para practicar';
        this.announce('Marcado ilustrativo actualizado.');
        return;
      }
      if (event.target.closest('[data-guide-batch]')) {
        this.pause(false);
        this.manual = true;
        this.undo = new Set(this.approved);
        sample.forEach(course => this.approved.add(course.code));
        this.renderVisual();
        this.root.querySelector('[data-guide-undo]')?.focus();
        this.root.querySelector('[data-guide-step]').textContent = 'Lote aplicado; puedes deshacer';
        this.announce('Ramos ilustrativos hasta segundo semestre marcados. Puedes deshacer el lote.');
        return;
      }
      if (event.target.closest('[data-guide-undo]') && this.undo) {
        this.pause(false);
        this.manual = true;
        this.approved = this.undo;
        this.undo = null;
        this.renderVisual();
        this.root.querySelector('[data-guide-batch]')?.focus();
        this.root.querySelector('[data-guide-step]').textContent = 'Lote deshecho';
        this.announce('Lote ilustrativo deshecho.');
        return;
      }
      if (event.target.closest('[data-guide-link]')) { this.pause(false); this.onLink(); }
    }
    keydown(event) {
      const tab = event.target.closest('[data-guide-tab]');
      if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? CHAPTERS.length - 1 : (this.index + (event.key === 'ArrowRight' ? 1 : -1) + CHAPTERS.length) % CHAPTERS.length;
      this.go(index);
      this.root.querySelector(`[data-guide-tab="${index}"]`).focus();
      track('tutorial/capitulo');
    }
    destroy() {
      this.stopMotion();
      this.root.removeEventListener('click', this.onClick);
      this.root.removeEventListener('keydown', this.onKeydown);
      motionQuery.removeEventListener('change', this.onMotionChange);
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
      const targets = [...dialog.querySelectorAll('button, a[href]')].filter(node => !node.disabled && !node.hidden && node.getClientRects().length && node.getAttribute('aria-hidden') !== 'true' && node.tabIndex >= 0);
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
    if (options.chapter && CHAPTERS.some(chapter => chapter.id === options.chapter)) dialogGuide.go(CHAPTERS.findIndex(chapter => chapter.id === options.chapter));
    dialogGuide.pause(false);
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
