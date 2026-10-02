(() => {
  'use strict';
  const tools = window.PortalStudyTools;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const titleCase = value => String(value || '').toLocaleLowerCase('es-CL').replace(/(^|\s)\S/g, part => part.toLocaleUpperCase('es-CL'));
  const dateLabel = key => new Date(`${key}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDate = key => new Date(`${key}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  const number = value => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);
  const exactNeed = value => Math.ceil((value - 1e-12) * 100) / 100;
  const state = { week: '', today: '', editing: '', notice: '', gradeNotice: '', preset: null, presetKey: '', draft: null, gradeDrafts: {} };
  let refresh = () => {};
  let current = { calendar: [], source: {}, courses: { planO: [], planP: [] }, selectedPlan: 'planP' };
  const keyFor = (plan, code) => `${plan}:${code}`;
  const course = (plan, code) => current.courses[plan]?.find(item => item.code === code);
  const courseLabel = (plan, code) => course(plan, code)?.name ? titleCase(course(plan, code).name) : code;
  const message = (text, kind = 'week') => { state[kind === 'grade' ? 'gradeNotice' : 'notice'] = text; refresh(); };
  function init(callback) { refresh = callback; }
  function context(input) { current = input; }
  function inline(form, text) {
    let node = form.querySelector('[data-study-inline]');
    if (!node) { node = document.createElement('p'); node.className = 'study-notice'; node.dataset.studyInline = ''; form.prepend(node); }
    node.textContent = text;
    if (!form.querySelector('[data-study-reload]')) { const button = document.createElement('button'); button.type = 'button'; button.className = 'btn secondary sm'; button.dataset.studyReload = ''; button.textContent = 'Descartar cambios y cargar guardado'; node.after(button); }
  }
  function externalChange() {
    const form = document.querySelector('[data-study-event-form][data-study-dirty], [data-study-grades-form][data-study-dirty]');
    if (form) { inline(form, 'Otra pestaña cambió tus datos. Tu borrador sigue aquí; revisa los cambios antes de guardarlo.'); return; }
    refresh();
  }
  function sourceLink(event) {
    const raw = current.source.fileUrl || current.source.url;
    try {
      const url = new URL(raw, location.href);
      if (!['https:', 'http:'].includes(url.protocol)) return '';
      if (event.sourcePage) url.hash = `page=${event.sourcePage}`;
      return `<a href="${esc(url.href)}" target="_blank" rel="noopener">Fuente UCN${event.sourcePage ? ` · p. ${esc(event.sourcePage)}` : ''}</a>`;
    } catch { return ''; }
  }
  function notice(text) { return text ? `<p class="study-notice" role="status">${esc(text)}</p>` : ''; }
  function personalForm(today, saved) {
    const item = state.draft || saved || { id: '', date: today, title: '', type: 'Evaluación', time: '', plan: state.preset?.plan || current.selectedPlan || '', course: state.preset?.course || '', done: false };
    const plan = item.plan || '';
    const courses = plan ? [...(current.courses[plan] || [])].sort((a, b) => {
      const rank = c => current.statuses?.[plan]?.[c.code] === 'cursando' ? 0 : current.preferred?.[plan]?.includes(c.code) ? 1 : 2;
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    }) : [];
    return `<form class="study-form card pad" data-study-event-form${state.draft ? ' data-study-dirty' : ''}><h2 class="card-title">${saved ? 'Editar actividad' : 'Agregar actividad'}</h2>
      <input type="hidden" name="id" value="${esc(item.id)}"><input type="hidden" name="revision" value="${item.revision ?? tools.read().revision}">
      <div class="study-form-grid"><label>Fecha<input class="input" type="date" name="date" required value="${esc(item.date)}"></label><label>Tipo<select class="select" name="type">${['Evaluación', 'Entrega', 'Estudio', 'Personal'].map(type => `<option${item.type === type ? ' selected' : ''}>${type}</option>`).join('')}</select></label></div>
      <label>Actividad<input class="input" name="title" required maxlength="120" value="${esc(item.title)}" placeholder="Ej.: estudiar capítulo 3"></label>
      <div class="study-form-grid"><label>Hora (opcional)<input class="input" type="time" name="time" value="${esc(item.time)}"></label><label>Plan (opcional)<select class="select" name="plan" data-study-plan><option value="">Sin ramo</option><option value="planO"${plan === 'planO' ? ' selected' : ''}>Plan O</option><option value="planP"${plan === 'planP' ? ' selected' : ''}>Plan P</option></select></label></div>
      <label>Ramo<select class="select" name="course" data-study-course><option value="">Sin ramo</option>${courses.map(itemCourse => `<option value="${esc(itemCourse.code)}"${item.course === itemCourse.code ? ' selected' : ''}>${current.statuses?.[plan]?.[itemCourse.code] === 'cursando' ? 'Cursando · ' : ''}${esc(titleCase(itemCourse.name))}</option>`).join('')}</select></label>
      <details class="study-extra"${item.time || item.calendar ? ' open' : ''}><summary>Duración y calendario</summary><label>Duración en minutos (si indicas hora)<input class="input" type="number" min="0" max="720" step="5" name="duration" value="${item.duration || 0}"><small class="muted">Para Google Calendar, indica una duración si eliges una hora.</small></label>${window.PortalStudyAccount.status().connected || item.calendar ? `<label class="study-check"><input type="checkbox" name="calendar"${item.calendar ? ' checked' : ''}${window.PortalStudyAccount.status().detached.includes(item.id) ? ' disabled' : ''}> ${window.PortalStudyAccount.status().detached.includes(item.id) ? 'Se conserva por separado en Google' : 'Llevar a Google Calendar'}</label>` : '<p class="small muted">Puedes conectar Google Calendar desde el guardado de tu agenda.</p>'}</details>
      <div class="study-form-actions"><button class="btn primary" type="submit">${saved ? 'Guardar cambios' : 'Agregar'}</button>${saved ? '<button class="btn secondary" type="button" data-study-cancel>Cancelar</button>' : ''}</div></form>`;
  }
  function renderWeek(today, query = {}) {
    const presetKey = `${query.plan || ''}:${query.course || ''}`;
    if (presetKey !== state.presetKey) {
      state.presetKey = presetKey;
      state.preset = course(query.plan, query.course) ? { plan: query.plan, course: query.course } : null;
      state.draft = null; state.editing = '';
    }
    state.today = today;
    const saved = tools.read();
    const days = tools.weekDates(state.week && tools.validDate(state.week) ? state.week : today);
    const start = days[0], end = days[6];
    const editing = saved.events.find(event => event.id === state.editing);
    const personal = saved.events.filter(event => event.date >= start && event.date <= end);
    const academic = current.calendar.filter(event => event.audience !== 'unidades' && event.date <= end && (event.endDate || event.date) >= start);
    const dayList = days.map(day => {
      const own = personal.filter(event => event.date === day).sort((a, b) => a.time.localeCompare(b.time));
      const official = academic.filter(event => event.date <= day && (event.endDate || event.date) >= day);
      const items = [
        ...own.map(event => `<article class="study-entry ${event.done ? 'is-done' : ''}"><div><span class="study-tag">${esc(event.type)}</span><strong>${esc(event.title)}</strong><small>${event.time ? `${esc(event.time)} · ` : ''}${event.course ? `${esc(courseLabel(event.plan, event.course))} · ` : ''}${event.done ? 'Completada' : 'Pendiente'}${event.calendar ? (window.PortalStudyAccount.status().detached.includes(event.id) ? ' · Google por separado' : window.PortalStudyAccount.status().connected ? ' · Google Calendar' : ' · Calendar desconectado') : ''}</small></div><div class="study-entry-actions"><button type="button" class="btn ghost sm" data-study-done="${esc(event.id)}">${event.done ? 'Reabrir' : 'Completar'}</button><button type="button" class="btn ghost sm" data-study-edit="${esc(event.id)}">Editar</button><button type="button" class="btn ghost sm" data-study-delete="${esc(event.id)}">Eliminar</button></div></article>`),
        ...official.map(event => `<article class="study-entry study-official"><div><span class="study-tag">Calendario UCN · ${esc(event.type || 'Fecha')}</span><strong>${esc(event.title)}</strong><small>${event.endDate ? `Del ${shortDate(event.date)} al ${shortDate(event.endDate)} · ` : ''}${event.provisional ? 'Sujeto a cambios · ' : ''}${esc(event.time || '')}</small></div>${sourceLink(event)}</article>`)
      ];
      return `<section class="study-day card pad${items.length ? '' : ' is-empty'}"><h2>${esc(dateLabel(day))}${day === today ? '<span class="pill blue">Hoy</span>' : ''}</h2>${items.join('') || '<p class="small muted">Sin actividades.</p>'}</section>`;
    }).join('');
    const upcoming = saved.events.filter(e => !e.done && e.date >= today && ['Evaluación', 'Entrega'].includes(e.type)).sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0,3);
    return `<div class="study-page">${notice(tools.status().issue)}${notice(state.notice)}<div class="page-head"><div><h1 class="page-title">Mi semana</h1><p class="page-subtitle">${esc(shortDate(start))} – ${esc(shortDate(end))} · tus actividades y fechas importantes</p></div><div class="hstack"><a class="btn secondary" href="#/calculadora">Calculadora de notas</a></div></div>
      ${query.calendar === 'error' ? '<p class="study-notice">No se pudo conectar Google Calendar. Tus actividades siguen guardadas. Puedes volver a intentarlo.</p>' : ''}${query.account === 'expired' ? '<p class="study-notice">Tu sesión venció. Vuelve a ingresar para recuperar las actividades de tu cuenta.</p>' : ''}${query.account === 'error' ? '<p class="study-notice">No se pudo iniciar sesión. Puedes continuar aquí o volver a intentarlo con tu cuenta UCN.</p>' : ''}
      ${upcoming.length ? `<section class="study-upcoming" aria-label="Próximas evaluaciones y entregas">${upcoming.map(e => `<button class="study-upcoming-item" data-study-edit="${esc(e.id)}"><span>${esc(shortDate(e.date))}</span><strong>${esc(e.title)}</strong><small>${esc(e.course ? courseLabel(e.plan,e.course) : e.type)}</small></button>`).join('')}</section>` : ''}
      <div class="study-controls"><button class="btn primary sm" data-study-focus-form>Agregar actividad</button><button class="btn secondary sm" data-study-week="-7" aria-label="Semana anterior"><span class="study-nav-arrow" aria-hidden="true">‹</span><span class="study-nav-label">Semana anterior</span></button><button class="btn secondary sm" data-study-today>Esta semana</button><button class="btn secondary sm" data-study-week="7" aria-label="Semana siguiente"><span class="study-nav-label">Semana siguiente</span><span class="study-nav-arrow" aria-hidden="true">›</span></button><button class="btn secondary sm" data-study-export>Descargar mis eventos</button></div>
      <p class="small muted">Fechas oficiales: <a href="#/calendario">calendario académico UCN</a>.</p>
      <div class="study-layout"><div class="study-days">${dayList}</div><aside>${personalForm(today, editing)}</aside></div>${window.PortalStudyAccount.render()}</div>`;
  }
  function gradeResult(config) {
    const result = tools.gradeSummary(config);
    const assigned = result.unassigned > 0 ? `<p>Queda ${number(result.unassigned)}% sin ponderaciones asignadas; se incluye en el porcentaje restante para calcular la nota necesaria.</p>` : '';
    const average = result.gradedAverage === null ? 'Aún no hay notas ingresadas.' : `Promedio de evaluaciones con nota: ${number(result.gradedAverage)}. Acumulado ponderado: ${number(result.weightedAccumulated)} puntos de la nota final.`;
    let conclusion;
    if (result.outcome === 'final-met') conclusion = `Ponderación completa. Nota final: ${number(result.weightedAccumulated)}; alcanza la meta ${number(result.goal)}.`;
    else if (result.outcome === 'final-below') conclusion = `Ponderación completa. Nota final: ${number(result.weightedAccumulated)}; no alcanza la meta ${number(result.goal)}.`;
    else if (result.outcome === 'impossible') conclusion = `Para llegar a ${number(result.goal)} necesitarías más de 7,0 en el ${number(result.remaining)}% restante.`;
    else if (result.outcome === 'guaranteed') conclusion = `La meta ${number(result.goal)} ya se alcanza incluso con 1,0 en el ${number(result.remaining)}% restante.`;
    else conclusion = `Necesitas al menos ${number(exactNeed(result.required))} de promedio en el ${number(result.remaining)}% restante para alcanzar ${number(result.goal)}.`;
    return `<div class="study-result" role="status"><strong>${esc(conclusion)}</strong><p>${esc(average)}</p>${assigned}<small>Estimación personal con escala 1,0 a 7,0 y ponderación total 100%. No aplica reglas de aprobación ni redondeo de una asignatura.</small></div>`;
  }
  function rowHtml(row) {
    return `<div class="study-grade-row" data-study-grade-row><input type="hidden" name="row-id" value="${esc(row.id)}"><label>Evaluación<input class="input" name="row-name" maxlength="80" value="${esc(row.name)}" placeholder="Ej.: control 1"></label><label>Peso %<input class="input" name="row-weight" type="number" min="0.01" max="100" step="0.01" required value="${row.weight || ''}"></label><label>Nota<input class="input" name="row-grade" type="number" min="1" max="7" step="0.01" value="${row.grade ?? ''}" placeholder="Pendiente"></label><button class="btn ghost sm" type="button" data-study-remove-row aria-label="Quitar evaluación">Quitar</button></div>`;
  }
  function renderGrades(query) {
    const saved = tools.read();
    const plan = ['planO', 'planP'].includes(query.plan) ? query.plan : current.selectedPlan;
    const list = [...(current.courses[plan] || [])].sort((a, b) => Number(current.preferred?.[plan]?.includes(b.code)) - Number(current.preferred?.[plan]?.includes(a.code)));
    const code = list.some(item => item.code === query.course) ? query.course : (list[0]?.code || '');
    const key = keyFor(plan, code);
    const draft = state.gradeDrafts[key];
    const config = draft?.config || saved.grades[key] || { goal: 4, rows: [] };
    return `<div class="study-page">${notice(tools.status().issue)}${notice(state.gradeNotice)}<div class="page-head"><div><h1 class="page-title">Calculadora de notas</h1><p class="page-subtitle">Calcula tu avance y la nota que necesitas según tus ponderaciones.</p></div><a class="btn secondary" href="#/mi-semana">Mi semana</a></div>
      <section class="card pad study-grade-card"><div class="study-form-grid"><label>Plan<select class="select" data-study-grade-plan><option value="planO"${plan === 'planO' ? ' selected' : ''}>Plan O</option><option value="planP"${plan === 'planP' ? ' selected' : ''}>Plan P</option></select></label><label>Ramo<select class="select" data-study-grade-course>${list.map(item => `<option value="${esc(item.code)}"${item.code === code ? ' selected' : ''}>${esc(titleCase(item.name))}</option>`).join('')}</select></label></div>
      <p class="small muted">${window.PortalStudyAccount.status().user ? 'Tus cálculos se guardan en tu cuenta.' : 'Tus cálculos se guardan en este navegador.'} La meta inicial es 4,0; ajusta la meta y las ponderaciones de cada ramo según corresponda.</p>
      <form data-study-grades-form${draft ? ' data-study-dirty' : ''} data-study-config-plan="${plan}" data-study-config-course="${esc(code)}"><input type="hidden" name="revision" value="${draft?.revision ?? saved.revision}"><div class="study-goal"><label>Meta de nota final<input class="input" name="goal" type="number" min="1" max="7" step="0.01" required value="${config.goal}"></label></div>
      <div class="study-grade-rows" data-study-grade-rows>${(config.rows.length ? config.rows : [{ id: '', name: '', weight: '', grade: null }]).map(rowHtml).join('')}</div><div class="study-form-actions"><button class="btn secondary" type="button" data-study-add-row>Agregar evaluación</button><button class="btn primary" type="submit"${code ? '' : ' disabled'}>Guardar cálculo</button><button class="btn secondary" type="button" data-study-reload>Descartar cambios y cargar guardado</button></div><div data-study-preview>${tools.validConfig(config) ? gradeResult(config) : '<p class="small muted">Completa las ponderaciones para calcular tu avance.</p>'}</div></form></section>${window.PortalStudyAccount.render()}</div>`;
  }
  function readGradeForm(form) {
    const goal = Number(form.elements.goal.value);
    const rows = [...form.querySelectorAll('[data-study-grade-row]')].filter(node => node.querySelector('[name="row-weight"]').value !== '' || node.querySelector('[name="row-grade"]').value !== '' || node.querySelector('[name="row-name"]').value.trim() !== '').map(node => {
      const gradeText = node.querySelector('[name="row-grade"]').value;
      return { id: node.querySelector('[name="row-id"]').value || crypto.randomUUID(), name: node.querySelector('[name="row-name"]').value.trim(), weight: Number(node.querySelector('[name="row-weight"]').value), grade: gradeText === '' ? null : Number(gradeText) };
    });
    return { goal, rows };
  }
  document.addEventListener('click', async event => {
    const target = event.target.closest('[data-study-week], [data-study-today], [data-study-export], [data-study-edit], [data-study-delete], [data-study-done], [data-study-cancel], [data-study-add-row], [data-study-remove-row], [data-study-focus-form], [data-study-reload]');
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const draftForm = document.querySelector('[data-study-event-form][data-study-dirty]');
    if (draftForm && (target.hasAttribute('data-study-week') || target.hasAttribute('data-study-today'))) state.draft = { ...Object.fromEntries(new FormData(draftForm)), calendar: draftForm.elements.calendar?.checked === true };
    if (draftForm && target.hasAttribute('data-study-edit') && !await window.PortalStudyAccount.confirmAction('Hay una actividad sin guardar. ¿Descartar el borrador y abrir la elegida?', 'Descartar borrador')) return;
    if (target.hasAttribute('data-study-reload')) { state.gradeNotice = ''; state.notice = ''; state.draft = null; state.gradeDrafts = {}; refresh(); return; }
    if (target.hasAttribute('data-study-week')) { const day = state.week || state.today; state.week = tools.shiftDate(day, Number(target.dataset.studyWeek)); refresh(); }
    if (target.hasAttribute('data-study-today')) { state.week = ''; refresh(); }
    if (target.hasAttribute('data-study-edit')) { state.editing = target.dataset.studyEdit; state.draft = null; state.notice = ''; refresh(); document.querySelector('[data-study-event-form] [name="title"]')?.focus(); }
    if (target.hasAttribute('data-study-focus-form')) { document.querySelector('[data-study-event-form]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.querySelector('[data-study-event-form] [name="title"]')?.focus(); }
    if (target.hasAttribute('data-study-cancel')) { state.editing = ''; state.draft = null; refresh(); }
    if (target.hasAttribute('data-study-export')) {
      const events = tools.read().events;
      if (!events.length) { message('Agrega una actividad para exportarla.'); return; }
      const blob = new Blob([tools.makeICS(events)], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'mi-semana-ceic.ics'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    if (target.hasAttribute('data-study-done') || target.hasAttribute('data-study-delete')) {
      const id = target.dataset.studyDone || target.dataset.studyDelete;
      const saved = tools.read();
      if (target.hasAttribute('data-study-delete') && !await window.PortalStudyAccount.confirmAction('Si la enviaste a Google Calendar, también se retirará allí cuando se actualice. Los cambios externos en Google se conservarán.', 'Eliminar actividad')) return;
      const result = tools.update(saved.revision, data => {
        if (target.hasAttribute('data-study-delete')) data.events = data.events.filter(item => item.id !== id);
        else { const item = data.events.find(entry => entry.id === id); if (item) item.done = !item.done; }
      });
      if (!result.ok) state.notice = result.reason;
      if (state.editing === id) state.editing = '';
      refresh();
    }
    if (target.hasAttribute('data-study-add-row')) { const form = target.closest('form'); const rows = form.querySelector('[data-study-grade-rows]'); if (rows.children.length < 40) { rows.insertAdjacentHTML('beforeend', rowHtml({ id: '', name: '', weight: '', grade: null })); form.dataset.studyDirty = ''; } }
    if (target.hasAttribute('data-study-remove-row')) { const form = target.closest('form'); target.closest('[data-study-grade-row]')?.remove(); form.dataset.studyDirty = ''; form.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-study-plan]')) {
      const form = event.target.closest('form');
      form.querySelector('[data-study-course]').innerHTML = `<option value="">Sin ramo</option>${(current.courses[event.target.value] || []).map(item => `<option value="${esc(item.code)}">${esc(titleCase(item.name))}</option>`).join('')}`;
    }
    if (event.target.matches('[data-study-grade-plan], [data-study-grade-course]')) {
      const container = event.target.closest('.study-grade-card');
      const form = container.querySelector('[data-study-grades-form]');
      if (form.hasAttribute('data-study-dirty')) {
        inline(form, 'Guarda el cálculo o descarta los cambios antes de cambiar de ramo.');
        if (event.target.matches('[data-study-grade-plan]')) event.target.value = form.dataset.studyConfigPlan;
        else event.target.value = form.dataset.studyConfigCourse;
        return;
      }
      const plan = container.querySelector('[data-study-grade-plan]').value;
      const code = event.target.matches('[data-study-grade-plan]') ? current.courses[plan]?.[0]?.code : container.querySelector('[data-study-grade-course]').value;
      location.hash = `#/calculadora?plan=${encodeURIComponent(plan)}&course=${encodeURIComponent(code || '')}`;
    }
  });
  document.addEventListener('input', event => {
    const eventForm = event.target.closest('[data-study-event-form]');
    if (eventForm) { eventForm.dataset.studyDirty = ''; state.draft = { ...Object.fromEntries(new FormData(eventForm)), calendar: eventForm.elements.calendar?.checked === true }; }
    const form = event.target.closest('[data-study-grades-form]');
    if (!form) return;
    form.dataset.studyDirty = '';
    const preview = form.querySelector('[data-study-preview]');
    const config = readGradeForm(form);
    state.gradeDrafts[keyFor(form.dataset.studyConfigPlan, form.dataset.studyConfigCourse)] = { config, revision: Number(form.elements.revision.value) };
    preview.innerHTML = tools.validConfig(config) ? gradeResult(config) : '<p class="study-notice">Revisa notas entre 1,0 y 7,0 y que las ponderaciones asignadas no superen 100%.</p>';
  });
  document.addEventListener('submit', event => {
    const eventForm = event.target.closest('[data-study-event-form]');
    const gradeForm = event.target.closest('[data-study-grades-form]');
    if (!eventForm && !gradeForm) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const form = eventForm || gradeForm;
    if (!form.reportValidity()) return;
    if (eventForm) {
      const fields = new FormData(form);
      const plan = String(fields.get('plan') || ''); const code = String(fields.get('course') || '');
      const old = tools.read().events.find(item => item.id === fields.get('id'));
      const item = { id: old?.id || crypto.randomUUID(), date: String(fields.get('date') || ''), title: String(fields.get('title') || '').trim(), calendar: window.PortalStudyAccount.status().detached.includes(old?.id) ? old.calendar : fields.get('calendar') === 'on', duration: Number(fields.get('duration') || 0), type: String(fields.get('type') || ''), time: String(fields.get('time') || ''), plan, course: code, done: old?.done || false };
      if (item.calendar && item.time && item.duration <= 0) { inline(form, 'Indica la duración de la actividad para llevarla a Google Calendar, o guárdala sin hora.'); return; }
      if (!tools.validEvent(item) || (code && !course(plan, code)) || (!plan && code)) { inline(form, 'Revisa la fecha, el título y el ramo elegido.'); return; }
      const result = tools.update(Number(fields.get('revision')), data => { const index = data.events.findIndex(entry => entry.id === item.id); if (index < 0) data.events.push(item); else data.events[index] = item; });
      if (!result.ok) { inline(form, result.reason); return; }
      state.notice = ''; state.editing = ''; state.draft = null; state.week = item.date; refresh();
    } else {
      const config = readGradeForm(form);
      if (!tools.validConfig(config)) { inline(form, 'Revisa notas entre 1,0 y 7,0 y que las ponderaciones asignadas no superen 100%.'); return; }
      const result = tools.update(Number(new FormData(form).get('revision')), data => { data.grades[keyFor(form.dataset.studyConfigPlan, form.dataset.studyConfigCourse)] = config; });
      if (!result.ok) { inline(form, result.reason); return; }
      delete state.gradeDrafts[keyFor(form.dataset.studyConfigPlan, form.dataset.studyConfigCourse)];
      state.gradeNotice = result.saved ? 'Cálculo guardado.' : ''; refresh();
    }
  });
  function reset() { state.editing = ''; state.draft = null; state.preset = null; state.presetKey = ''; state.notice = ''; state.gradeNotice = ''; state.gradeDrafts = {}; }
  window.addEventListener('beforeunload', event => { if (document.querySelector('[data-study-dirty]')) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('click', async event => { const link = event.target.closest('a[href]'); if (link && document.querySelector('[data-study-dirty]') && link.hash !== location.hash) { event.preventDefault(); event.stopImmediatePropagation(); if (await window.PortalStudyAccount.confirmAction('Hay cambios sin guardar en el formulario. ¿Salir sin guardarlos?', 'Salir sin guardar')) { state.draft = null; state.gradeDrafts = {}; location.assign(link.href); } } }, true);
  window.PortalStudyUI = Object.freeze({ reset, init, context, renderWeek, renderGrades, externalChange });
})();
