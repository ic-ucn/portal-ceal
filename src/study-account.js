(() => {
  'use strict';
  const tools = window.PortalStudyTools, courses = window.PortalMyCourses;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let actionBusy = false;
  let options, user = null, key = '', generation = 0, revision = 0, dirty = false, busy = false, timer, calendar = {}, conflict = null, message = '', imported = false;
  const documentData = () => ({ study: structuredClone(tools.read()), courses: structuredClone(courses.read()) });
  const cacheKey = () => `portal.study.account:${key}`;
  const meaningful = d => d?.study?.events?.length || Object.keys(d?.study?.grades || {}).length || Object.values(d?.courses?.plans || {}).some(p => p.selected.length || Object.keys(p.statuses).length);
  function guestData() {
    try { return { study: tools.normalize(JSON.parse(localStorage.getItem('portal.studyTools.v1'))) || tools.empty(), courses: courses.normalize(JSON.parse(localStorage.getItem('portal.myCourses.v1'))) || courses.empty() }; } catch { return null; }
  }
  function backup(doc, label) {
    // One recoverable snapshot per operation/account, avoiding an unbounded history.
    localStorage.setItem(`portal.study.backup:${key || 'guest'}:${label}`, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), ...doc }));
  }
  function cached() { try { return JSON.parse(localStorage.getItem(cacheKey()) || 'null'); } catch { return null; } }
  function persist() {
    if (!key) return;
    try { localStorage.setItem(cacheKey(), JSON.stringify({ revision, dirty, imported })); }
    catch { message = 'No hay espacio para guardar el respaldo. Descarga una copia antes de salir.'; }
  }
  function statusText() { return !user ? 'Guardado en este navegador.' : conflict ? 'Hay cambios por revisar en Mi semana.' : busy ? 'Guardando en tu cuenta…' : dirty ? 'Cambios pendientes de guardar en tu cuenta.' : message ? 'No se pudo confirmar el guardado en tu cuenta.' : 'Guardado en tu cuenta.'; }
  function paintStatus() {
    for (const label of document.querySelectorAll('[data-study-save-status]')) label.textContent = statusText();
    const panel = document.querySelector('[data-study-account]');
    if (panel) {
      const open = [...panel.querySelectorAll('details[open]')].map(d => d.className);
      panel.outerHTML = render();
      const next = document.querySelector('[data-study-account]');
      for (const detail of next.querySelectorAll('details')) detail.open = detail.open || open.includes(detail.className);
      for (const button of next.querySelectorAll('button')) if (!['download','previous','download-remote'].includes(button.dataset.studyAccountAction)) button.disabled = busy || actionBusy;
    }
  }
  function apply(doc) {
    if (!tools.normalize(doc?.study) || !courses.normalize(doc?.courses)) throw new Error('El respaldo no se pudo leer.');
    const before = documentData();
    if (tools.status().locked || courses.status().locked) localStorage.setItem(`portal.study.backup:${key || 'guest'}:unreadable`, JSON.stringify({ study: localStorage.getItem(tools.key), courses: localStorage.getItem(courses.key) }));
    backup(before, 'before-restore');
    try { tools.replace(doc.study); courses.replace(doc.courses); }
    catch (error) { try { tools.replace(before.study); courses.replace(before.courses); } catch {} throw error; }
  }
  async function request(path, body) {
    return options.request('/study' + path, body === undefined ? { timeoutMs: 12000 } : { method: 'POST', body: JSON.stringify(body), timeoutMs: 20000 });
  }
  function refresh() {
    const open = [...document.querySelectorAll('[data-study-account] details[open]')].map(d => d.className);
    options.refresh();
    for (const detail of document.querySelectorAll('[data-study-account] details')) if (open.includes(detail.className)) detail.open = true;
  }
  async function init(config) { options = config; await setUser(config.user()); }
  async function setUser(next) {
    const nextKey = next?.sessionToken && next.role !== 'guest' ? encodeURIComponent(next.email.toLowerCase()) : '';
    if (nextKey === key && (user || !nextKey)) return;
    const run = ++generation;
    clearTimeout(timer); user = nextKey ? next : null; key = nextKey;
    tools.useAccount(key); courses.useAccount(key); window.PortalStudyUI?.reset();
    dirty = false; busy = false; conflict = null; message = ''; calendar = {}; revision = 0;
    if (!key) { paintStatus(); return; }
    const cache = cached(); revision = cache?.revision || 0; dirty = cache?.dirty === true; imported = cache?.imported === true;
    try {
      const remote = await request('');
      if (run !== generation) return;
      calendar = remote.calendar;
      if (dirty && revision !== remote.revision) conflict = remote;
      else if (!dirty) { apply(remote.document); revision = remote.revision; }
      persist();
      if ((dirty || calendar.connected) && !conflict) await flush();
    } catch { if (run === generation) message = 'No pudimos consultar tu cuenta. Tus cambios se conservan aquí; vuelve a intentar cuando tengas conexión.'; }
    paintStatus();
  }
  function changed() {
    if (!key) return;
    dirty = true; persist(); clearTimeout(timer); timer = setTimeout(flush, 650); paintStatus();
  }
  async function flush() {
    if (!key || busy || conflict) return;
    const run = generation;
    busy = true; message = ''; paintStatus();
    try {
      if (dirty) {
        const sent = documentData(), serialized = JSON.stringify(sent);
        const remote = await request('/save', { revision, document: sent });
        if (run !== generation) return;
        revision = remote.revision; calendar = remote.calendar;
        dirty = JSON.stringify(documentData()) !== serialized; persist();
      }
      if (calendar.connected && !dirty) {
        const remote = await request('/calendar/sync', {});
        if (run !== generation) return;
        calendar = remote.calendar;
      }
    } catch (e) {
      if (run !== generation) return;
      if (e.payload?.conflict) conflict = e.payload;
      message = conflict ? 'Hay cambios distintos en tu cuenta y en este dispositivo.' : 'Tus cambios siguen en este dispositivo. No se pudo completar el guardado en tu cuenta.';
    } finally {
      if (run === generation) { busy = false; persist(); paintStatus(); }
    }
    if (run === generation && dirty && !message && !conflict) timer = setTimeout(flush, 650);
  }
  function merge(local, remote) {
    const result = structuredClone(remote);
    result.study.events = [...remote.study.events, ...local.study.events.filter(e => !remote.study.events.some(r => r.id === e.id))];
    result.study.grades = { ...local.study.grades, ...remote.study.grades };
    result.study.revision++;
    for (const plan of ['planO', 'planP']) {
      result.courses.plans[plan].selected = [...new Set([...remote.courses.plans[plan].selected, ...local.courses.plans[plan].selected])];
      result.courses.plans[plan].statuses = { ...local.courses.plans[plan].statuses, ...remote.courses.plans[plan].statuses };
    }
    return result;
  }
  function confirmAction(text, label = 'Continuar') {
    return new Promise(resolve => {
      const dialog = document.createElement('dialog'); dialog.className = 'study-dialog';
      dialog.setAttribute('aria-labelledby', 'study-confirm-title');
      dialog.innerHTML = `<h2 id="study-confirm-title">${esc(label)}</h2><p>${esc(text)}</p><div class="study-form-actions"><button class="btn secondary" data-study-confirm-cancel>Cancelar</button><button class="btn primary" data-study-confirm-accept>${esc(label)}</button></div>`;
      let done = false;
      const finish = value => { if (done) return; done = true; dialog.close(); dialog.remove(); resolve(value); };
      dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
      dialog.querySelector('[data-study-confirm-cancel]').onclick = () => finish(false);
      dialog.querySelector('[data-study-confirm-accept]').onclick = () => finish(true);
      document.body.appendChild(dialog); dialog.showModal(); dialog.querySelector('[data-study-confirm-cancel]').focus();
    });
  }
  function download(doc = documentData()) {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, ...doc }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mi-estudio-ceic.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function summary(doc) { return `${doc.study.events.length} actividades · ${Object.keys(doc.study.grades).length} cálculos · ${Object.values(doc.courses.plans).reduce((n, p) => n + p.selected.length, 0)} ramos seleccionados`; }
  async function restoreCopy() {
    const run = generation;
    // Keep the picker outside the status panel: saves can repaint that panel while it is open.
    const file = await new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json'; input.hidden = true;
      input.dataset.studyRestore = '';
      const finish = file => { input.remove(); resolve(file); };
      input.addEventListener('change', () => finish(input.files[0]), { once: true });
      input.addEventListener('cancel', () => finish(null), { once: true });
      document.body.appendChild(input); input.click();
    });
    if (!file || run !== generation) return;
    if (file.size > 750000) throw new Error('La copia es demasiado grande.');
    let raw;
    try { raw = JSON.parse(await file.text()); }
    catch { throw new Error('Este archivo no es una copia válida de Mi estudio.'); }
    if (!raw || typeof raw !== 'object') throw new Error('Este archivo no es una copia válida de Mi estudio.');
    const data = { study: tools.normalize(raw.study), courses: courses.normalize(raw.courses) };
    if (raw.version !== 1 || !data.study || !data.courses) throw new Error('Este archivo no es una copia válida de Mi estudio.');
    if (run !== generation) return;
    if (!await confirmAction(`Incorporar ${summary(data)}. Conservaremos los registros actuales si ya existen y una copia anterior.`, 'Recuperar copia')) return;
    if (run !== generation) return;
    apply(merge(data, documentData())); changed(); refresh();
  }
  function render() {
    const guest = user && !imported ? guestData() : null;
    const migration = meaningful(guest) ? `<div class="study-account-review"><strong>¿Estas actividades también son tuyas?</strong><p>En este navegador hay ${summary(guest)}. Puedes incorporarlas a ${esc(user.email)}. Si un registro ya existe, conservaremos el de tu cuenta. Los originales seguirán aquí.</p><div class="study-form-actions"><button class="btn secondary sm" data-study-account-action="import">Incorporar a mi cuenta</button><button class="btn ghost sm" data-study-account-action="skip">No incorporar</button></div></div>` : '';
    const conflicts = (calendar.conflicts || []).map(id => `<div class="study-account-review"><strong>${esc(tools.read().events.find(e => e.id === id)?.title || 'Actividad retirada')}</strong><p>Cambió o se eliminó en Google. Conservamos ambas versiones; no reemplazamos ese cambio.</p><button class="btn secondary sm" data-study-calendar-detach="${esc(id)}">Conservar por separado</button></div>`).join('');
    return `<section class="study-account card pad" data-study-account aria-label="Guardado y calendario"><div class="study-account-heading"><div><h2 class="card-title">${user ? 'Tu agenda, contigo' : 'Guarda tu avance'}</h2><p class="small muted" role="status">${user ? `${esc(user.email)} · ${busy ? 'Guardando…' : conflict ? 'Revisión pendiente' : dirty ? 'Pendiente de guardar en tu cuenta' : message ? 'Sin confirmar guardado' : 'Guardado en tu cuenta'}` : 'Tus actividades, ramos y notas se conservan en este navegador.'}</p></div><div class="study-form-actions">${!user && options?.available ? '<button class="btn secondary sm" data-study-account-action="login">Guardar con mi cuenta UCN</button>' : ''}${user ? '<button class="btn ghost sm" data-study-account-action="logout">Cerrar sesión</button>' : ''}</div></div>${message ? `<p class="study-notice" role="status">${esc(message)}</p>` : ''}${user && (dirty || message) && !conflict ? '<button class="btn secondary sm" data-study-account-action="retry">Volver a intentar</button>' : ''}${conflict ? `<div class="study-account-review"><strong>Elige la versión que quieres continuar</strong><p>Este dispositivo: ${summary(documentData())}. Tu cuenta: ${summary(conflict.document)}. Guardaremos una copia recuperable de ambas antes de aplicar tu elección.</p><div class="study-form-actions"><button class="btn secondary sm" data-study-account-action="remote">Usar la de mi cuenta</button><button class="btn secondary sm" data-study-account-action="local">Usar la de este dispositivo</button><button class="btn ghost sm" data-study-account-action="download-remote">Descargar copia de mi cuenta</button></div></div>` : ''}${migration}${user ? `<details class="study-calendar-options"${calendar.issue || calendar.conflicts?.length ? ' open' : ''}><summary>Google Calendar${calendar.connected ? ' · Conectado' : ''}</summary><p class="small muted">Lleva las actividades que elijas a «Mi estudio CEIC». Conecta la misma cuenta UCN con la que guardas tu agenda. Tus otros calendarios se conservan. Edita estas actividades desde Mi semana.</p>${calendar.issue ? `<p class="study-notice">${esc(calendar.issue)}</p>` : ''}<div class="study-form-actions">${calendar.connected ? `${calendar.needsReconnect ? '<button class="btn secondary sm" data-study-account-action="connect">Volver a conectar</button>' : '<button class="btn secondary sm" data-study-account-action="retry">Actualizar calendario</button>'}<button class="btn ghost sm" data-study-account-action="disconnect">Desconectar</button>` : calendar.configured ? '<button class="btn secondary sm" data-study-account-action="connect">Conectar Google Calendar</button>' : '<p class="small muted">La conexión todavía no está disponible. Puedes descargar tus eventos.</p>'}</div>${calendar.connected ? '<p class="small muted">Al desconectar conservarás tus actividades y los eventos enviados. Configura tus recordatorios en Google Calendar.</p>' : ''}${conflicts}</details>` : ''}<details class="study-backup-options"><summary>Copias y recuperación</summary><div class="study-form-actions"><button class="btn ghost sm" data-study-account-action="download">Descargar una copia</button><button class="btn ghost sm" data-study-account-action="restore">Recuperar una copia</button><button class="btn ghost sm" data-study-account-action="previous">Descargar copia anterior</button></div><p class="small muted">La copia incluye tus actividades, ramos y notas. Guárdala en un lugar propio. La descarga de eventos es una copia para tu calendario; no se actualiza después de importarla.</p></details></section>`;
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-study-account-action], [data-study-calendar-detach]');
    if (!button) return;
    event.preventDefault();
    if (document.querySelector('[data-study-event-form][data-study-dirty], [data-study-grades-form][data-study-dirty]') && !['download','previous','download-remote','retry'].includes(button.dataset.studyAccountAction)) { message = 'Guarda tu formulario antes de cambiar el guardado o la conexión.'; paintStatus(); return; }
    if (busy || actionBusy) return;
    const action = button.dataset.studyAccountAction;
    actionBusy = true; paintStatus();
    try {
      if (action === 'restore') return await restoreCopy();
      if (action === 'download') return download();
      if (action === 'download-remote') return download(conflict.document);
      if (action === 'previous') { const saved = JSON.parse(localStorage.getItem(`portal.study.backup:${key || 'guest'}:before-restore`) || 'null'); if (!saved) throw new Error('Aún no hay una copia anterior.'); return download(saved); }
      if (action === 'login') return options.login();
      if (action === 'logout') { await options.logout(); await setUser(null); refresh(); return; }
      if (action === 'retry') return flush();
      if (action === 'skip') { imported = true; persist(); }
      if (action === 'import') { const data = guestData(); if (!data) throw new Error('No se pudieron leer las actividades de este navegador.'); backup(data, 'before-import'); apply(merge(data, documentData())); imported = true; changed(); refresh(); }
      if (action === 'remote' || action === 'local') {
        backup(conflict.document, 'account-conflict'); backup(documentData(), 'device-conflict');
        if (action === 'remote') apply(conflict.document);
        revision = conflict.revision; calendar = conflict.calendar; conflict = null; dirty = action === 'local'; message = ''; persist(); refresh(); await flush();
      }
      if (action === 'connect') { await flush(); if (dirty || conflict) throw new Error('Guarda los cambios de tu cuenta antes de conectar Calendar.'); const result = await request('/calendar/start', {}); location.assign(result.authUrl); }
      if (action === 'disconnect' || button.dataset.studyCalendarDetach) {
        const result = await request(action === 'disconnect' ? '/calendar/disconnect' : '/calendar/detach', { id: button.dataset.studyCalendarDetach }); calendar = result.calendar; refresh();
      }
      paintStatus();
    } catch (e) { message = e.message || 'No se pudo completar la acción.'; }
    finally { actionBusy = false; paintStatus(); }
  });
  window.addEventListener('study-data-changed', changed);
  window.addEventListener('online', () => { if (user) flush(); });
  window.addEventListener('storage', e => { if (key && (e.key === tools.key || e.key === courses.key || e.key === cacheKey())) { const c = cached(); if (c) { revision = c.revision; dirty = c.dirty; } paintStatus(); } });
  window.PortalStudyAccount = Object.freeze({ init, setUser, render, flush, statusText, confirmAction, status: () => ({ connected: calendar.connected, detached: calendar.detached || [], user: Boolean(user), available: Boolean(options?.available), dirty }) });
})();
