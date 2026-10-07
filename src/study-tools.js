(() => {
  'use strict';
  let KEY = 'portal.studyTools.v1';
  const empty = () => ({ version: 1, revision: 0, events: [], grades: {} });
  let memory = empty();
  let issue = '';
  let locked = false;
  let volatile = false;

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
  }
  function shiftDate(key, amount) {
    if (!validDate(key)) return '';
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + amount));
    return date.toISOString().slice(0, 10);
  }
  function weekDates(key) {
    if (!validDate(key)) return [];
    const [year, month, day] = key.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const monday = shiftDate(key, -((weekday + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
  }
  function validTime(value) { return value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
  function validEvent(event) {
    return event && typeof event.id === 'string' && event.id.length > 0 && event.id.length <= 100
      && !['__proto__', 'constructor', 'prototype'].includes(event.id)
      && validDate(event.date) && typeof event.title === 'string' && event.title.trim().length > 0 && event.title.length <= 120
      && ['Evaluación', 'Entrega', 'Estudio', 'Personal'].includes(event.type)
      && typeof event.time === 'string' && validTime(event.time)
      && typeof event.plan === 'string' && ['', 'planO', 'planP'].includes(event.plan)
      && typeof event.course === 'string' && event.course.length <= 80
      && (event.calendar === undefined || typeof event.calendar === 'boolean')
      && (event.duration === undefined || (Number.isInteger(event.duration) && event.duration >= 0 && event.duration <= 720))
      && typeof event.done === 'boolean';
  }
  const hundredths = value => Math.round(value * 100);
  const validPrecision = value => Number.isFinite(value) && Math.abs(value * 100 - hundredths(value)) < 1e-9;
  function validGradeRow(row) {
    return row && typeof row.id === 'string' && row.id.length <= 100 && row.id.length > 0
      && typeof row.name === 'string' && row.name.length <= 80
      && validPrecision(row.weight) && row.weight > 0 && row.weight <= 100
      && (row.grade === null || (validPrecision(row.grade) && row.grade >= 1 && row.grade <= 7));
  }
  function validConfig(config) {
    return config && validPrecision(config.goal) && config.goal >= 1 && config.goal <= 7
      && Array.isArray(config.rows) && config.rows.length <= 40 && config.rows.every(validGradeRow)
      && new Set(config.rows.map(row => row.id)).size === config.rows.length
      && config.rows.reduce((sum, row) => sum + Math.round(row.weight * 100), 0) <= 10000;
  }
  function normalize(data) {
    if (!data || data.version !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 0
      || !Array.isArray(data.events) || data.events.length > 1000 || !data.events.every(validEvent)
      || new Set(data.events.map(event => event.id)).size !== data.events.length
      || !data.grades || typeof data.grades !== 'object' || Array.isArray(data.grades)
      || Object.entries(data.grades).some(([key, config]) => !/^(planO|planP):.{1,80}$/.test(key) || !validConfig(config))) return null;
    return { version: 1, revision: data.revision, events: data.events, grades: data.grades };
  }
  function read() {
    if (volatile) return memory;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) { memory = empty(); issue = ''; locked = false; return memory; }
      const parsed = JSON.parse(raw);
      if (parsed?.version > 1) { issue = 'Estos datos pertenecen a una versión más reciente. La edición está detenida para protegerlos.'; locked = true; return memory; }
      const valid = normalize(parsed);
      if (!valid) { issue = 'Los datos guardados no se pudieron leer. La edición está detenida para protegerlos.'; locked = true; return memory; }
      memory = valid; issue = ''; locked = false;
    } catch {
      issue = 'No se pudieron leer los datos guardados. La edición está detenida para protegerlos.';
      locked = true;
    }
    return memory;
  }
  function update(expectedRevision, change) {
    if (locked) return { ok: false, reason: issue };
    const current = read();
    if (locked) return { ok: false, reason: issue };
    if (current.revision !== expectedRevision) return { ok: false, reason: 'Otra pestaña cambió tus datos. Revisa la versión actual antes de guardar.' };
    const next = structuredClone(current);
    change(next);
    next.revision++;
    if (!normalize(next)) return { ok: false, reason: 'Revisa los datos ingresados.' };
    memory = next;
    try { localStorage.setItem(KEY, JSON.stringify(next)); issue = ''; volatile = false; }
    catch { issue = 'No se pudo guardar en este navegador. Los cambios siguen disponibles mientras esta pestaña permanezca abierta.'; volatile = true; }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('study-data-changed'));
    return { ok: true, saved: !volatile };
  }
  function status() { return { issue, locked, volatile }; }
  function escapeICS(value) { return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function makeICS(events, stamp = new Date()) {
    const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CEIC UCN//Mi semana//ES', 'CALSCALE:GREGORIAN'];
    for (const event of events) {
      if (!validEvent(event)) continue;
      const start = event.date.replace(/-/g, '');
      const end = shiftDate(event.date, 1).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:${escapeICS(event.id)}@ceicucn.cl`, `DTSTAMP:${dtstamp}`);
      if (event.time) {
        // Floating local time: importing calendars interpret the clock in the user's own zone.
        lines.push(`DTSTART:${start}T${event.time.replace(':', '')}00`);
        if (event.duration > 0) lines.push(`DURATION:PT${event.duration}M`);
      } else lines.push(`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`);
      lines.push(`SUMMARY:${escapeICS(event.title)}`, `DESCRIPTION:${escapeICS(event.type + (event.done ? ' · completado' : ''))}`, 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    const encoder = new TextEncoder();
    return lines.map(line => {
      const chunks = [''];
      let size = 0;
      for (const char of line) {
        const bytes = encoder.encode(char).length;
        if (size + bytes > 75) { chunks.push(' '); size = 1; }
        chunks[chunks.length - 1] += char;
        size += bytes;
      }
      return chunks.join('\r\n');
    }).join('\r\n') + '\r\n';
  }
  function useAccount(account = '') {
    KEY = 'portal.studyTools.v1' + (account ? ':' + account : '');
    memory = empty(); issue = ''; locked = false; volatile = false;
    return read();
  }
  function replace(value) {
    const valid = normalize(value);
    if (!valid) throw new Error('No se pudieron recuperar las actividades.');
    localStorage.setItem(KEY, JSON.stringify(valid));
    volatile = false; return read();
  }
  const api = Object.freeze({ get key() { return KEY; }, empty, normalize, useAccount, replace, read, update, status, validDate, shiftDate, weekDates, validEvent, validConfig, makeICS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PortalStudyTools = api;
})();
