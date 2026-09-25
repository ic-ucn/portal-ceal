(() => {
  'use strict';
  const KEY = 'portal.myCourses.v1';
  const PLANS = ['planO', 'planP'];
  const STATUSES = ['pendiente', 'cursando', 'aprobado'];
  const empty = () => ({ version: 1, activePlan: 'planP', plans: { planO: { selected: [], statuses: {} }, planP: { selected: [], statuses: {} } } });
  let memory = empty();
  let issue = '';
  let locked = false;
  let volatile = false;
  let conflict = false;

  function normalize(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || input.version !== 1 || !input.plans || typeof input.plans !== 'object') return null;
    if (Object.keys(input.plans).some(plan => !PLANS.includes(plan))) return null;
    if (input.activePlan !== undefined && !PLANS.includes(input.activePlan)) return null;
    const result = empty();
    result.activePlan = PLANS.includes(input.activePlan) ? input.activePlan : 'planP';
    for (const plan of PLANS) {
      const record = input.plans[plan];
      if (!record || !Array.isArray(record.selected) || !record.statuses || typeof record.statuses !== 'object' || Array.isArray(record.statuses)) return null;
      if (record.selected.some(code => typeof code !== 'string' || !code || code.length > 80)) return null;
      result.plans[plan].selected = [...new Set(record.selected)];
      for (const [code, status] of Object.entries(record.statuses)) {
        if (!code || code.length > 80 || !STATUSES.includes(status)) return null;
        result.plans[plan].statuses[code] = status;
      }
    }
    return result;
  }

  function read(force = false) {
    if (volatile && !force) return memory;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) { memory = empty(); issue = ''; locked = false; volatile = false; return memory; }
      let parsed;
      try { parsed = JSON.parse(raw); } catch { memory = empty(); issue = 'Los datos guardados no se pudieron leer. Puedes recuperar Mis ramos sin afectar otros datos.'; locked = true; return memory; }
      if (parsed && typeof parsed.version === 'number' && parsed.version > 1) {
        memory = empty();
        issue = 'Los datos de Mis ramos pertenecen a una versión más reciente. La edición está deshabilitada para protegerlos.';
        locked = true;
        return memory;
      }
      const valid = normalize(parsed);
      if (!valid) { memory = empty(); issue = 'Los datos guardados no son válidos. Puedes recuperar Mis ramos sin afectar otros datos.'; locked = true; return memory; }
      memory = valid;
      issue = '';
      locked = false;
      volatile = false;
    } catch {
      issue = 'El navegador impide guardar cambios. Puedes seguir usando Mis ramos mientras esta página permanezca abierta.';
      locked = false;
      volatile = true;
    }
    return memory;
  }

  function update(plan, code, action, value) {
    read();
    if (locked || conflict) return false;
    if (!PLANS.includes(plan) || typeof code !== 'string' || !code || code.length > 80) return false;
    const next = structuredClone(memory);
    const record = next.plans[plan];
    if (action === 'select') record.selected = [...new Set([...record.selected, code])];
    else if (action === 'remove') record.selected = record.selected.filter(item => item !== code);
    else if (action === 'status' && STATUSES.includes(value)) record.statuses[code] = value;
    else return false;
    memory = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      issue = '';
      volatile = false;
    } catch {
      issue = 'El navegador impide guardar cambios. Puedes seguir usando Mis ramos mientras esta página permanezca abierta.';
      volatile = true;
    }
    return true;
  }
  // Apply a semester change in one storage write. A failed write still keeps
  // the complete change in this tab's temporary memory, as with update().
  function updateStatuses(plan, changes) {
    read();
    if (locked || conflict || !PLANS.includes(plan) || !changes || typeof changes !== 'object' || Array.isArray(changes)) return false;
    const entries = Object.entries(changes);
    if (!entries.length || entries.some(([code, status]) => !code || code.length > 80 || (status !== null && !STATUSES.includes(status)))) return false;
    const next = structuredClone(memory);
    for (const [code, status] of entries) {
      if (status === null) delete next.plans[plan].statuses[code];
      else next.plans[plan].statuses[code] = status;
    }
    memory = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      issue = '';
      volatile = false;
    } catch {
      issue = 'El navegador impide guardar cambios. Puedes seguir usando Mis ramos mientras esta página permanezca abierta.';
      volatile = true;
    }
    return true;
  }
  function setPlan(plan) {
    read();
    if (locked || conflict || !PLANS.includes(plan)) return false;
    memory = { ...memory, activePlan: plan };
    try { localStorage.setItem(KEY, JSON.stringify(memory)); issue = ''; volatile = false; }
    catch { issue = 'El navegador impide guardar cambios. Puedes seguir usando Mis ramos mientras esta página permanezca abierta.'; volatile = true; }
    return true;
  }

  function recover() {
    if (!locked || !issue.includes('recuperar')) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(empty()));
      memory = empty(); issue = ''; locked = false; volatile = false;
      return true;
    } catch { issue = 'El navegador impide guardar cambios. Revisa el almacenamiento disponible.'; return false; }
  }
  function externalChange() {
    if (volatile) {
      conflict = true;
      issue = 'Hay cambios temporales en esta pestaña y cambios guardados en otra. Elige qué versión conservar antes de seguir.';
      return memory;
    }
    return read(true);
  }
  function resolveConflict(choice) {
    if (!conflict) return false;
    if (choice === 'saved') {
      conflict = false; volatile = false; read(true);
      if (volatile) { conflict = true; issue = 'No se pudieron leer los cambios guardados. Los cambios temporales permanecen en esta pestaña.'; return false; }
      return true;
    }
    if (choice === 'temporary') {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw !== null) {
          let saved;
          try { saved = JSON.parse(raw); } catch { saved = null; }
          if (saved && typeof saved.version === 'number' && saved.version > 1) {
            issue = 'Otra pestaña guardó Mis ramos con una versión más reciente. No se reemplazó. Los cambios temporales permanecen en esta pestaña.';
            return false;
          }
        }
        localStorage.setItem(KEY, JSON.stringify(memory));
        conflict = false; volatile = false; issue = '';
        return true;
      } catch { issue = 'El navegador sigue impidiendo guardar. Los cambios temporales permanecen en esta pestaña.'; return false; }
    }
    return false;
  }
  function resourcesForCourse(curricula, resources, plan, code) {
    const course = curricula?.[plan]?.subjects?.find(item => item.code === code);
    if (!course) return [];
    const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const courseName = fold(course.name);
    const sharedCode = PLANS.some(other => other !== plan && curricula?.[other]?.subjects?.some(item => item.code === code));
    const seen = new Set();
    return (resources || []).filter(resource => {
      if (!resource?.id || seen.has(resource.id)) return false;
      if (resource.plan && resource.plan !== plan && resource.plan !== 'both') return false;
      const codeMatch = resource.courseCode === course.code || resource.courseCode === course.visibleCode;
      const nameMatch = courseName && fold(resource.courseName) === courseName;
      if (!codeMatch && !nameMatch) return false;
      if ((!resource.plan || resource.plan === 'both') && sharedCode && codeMatch && !nameMatch) return false;
      seen.add(resource.id);
      return true;
    });
  }
  function status() { return { issue, locked: locked || conflict, conflict, recoverable: locked && issue.includes('recuperar') }; }
  read();
  window.PortalMyCourses = Object.freeze({ key: KEY, read, update, updateStatuses, setPlan, recover, externalChange, resolveConflict, resourcesForCourse, status });
})();
