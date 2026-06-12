import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const DEFAULT_IMPORT_DIR = '.data/drive-imports/2026-06-11T02-35-55';
const DEFAULT_OUTPUT = 'data/drive-materials.js';
const DEFAULT_CURRICULA = 'data/curricula.js';

function argValue(name, fallback = '') {
  const direct = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (direct) return direct.slice(name.length + 3);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function humanSize(bytes = 0) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Number(bytes) || 0;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value >= 10 || idx === 0 ? Math.round(value) : value.toFixed(1)} ${units[idx]}`;
}

function cleanTitle(name = '') {
  return String(name)
    .normalize('NFC')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSpanish(value = '') {
  return String(value)
    .normalize('NFC')
    .replace(/Mec\S*nica/giu, 'Mecánica')
    .replace(/Ayudanti\S*a(s)?/giu, 'Ayudantía$1')
    .replace(/FundaçÃO/giu, 'Fundación')
    .replace(/Fundação/giu, 'Fundación')
    .replace(/Estimaci\S*n/giu, 'Estimación')
    .replace(/Clasificaci\S*n/giu, 'Clasificación')
    .replace(/Dise\S*o/giu, 'Diseño')
    .replace(/\bGuia\b/giu, 'Guía')
    .replace(/\bPresentacion\b/giu, 'Presentación')
    .replace(/\bProgramacion\b/giu, 'Programación')
    .replace(/\bGestion\b/giu, 'Gestión')
    .replace(/\bIntroduccion\b/giu, 'Introducción')
    .replace(/\bIngenieria\b/giu, 'Ingeniería')
    .replace(/\bHidraulica\b/giu, 'Hidráulica')
    .replace(/\bCalculo\b/giu, 'Cálculo')
    .replace(/\bAnalisis\b/giu, 'Análisis')
    .replace(/\bSismico\b/giu, 'Sísmico')
    .replace(/\bDiseno\b/giu, 'Diseño')
    .replace(/\bConstruccion\b/giu, 'Construcción');
}

function titleCase(value = '') {
  const keepUpper = new Set(['UCN', 'CEIC', 'CEAL', 'PPT', 'PDF', 'APR', 'NCh', 'RIDAA']);
  const lowerWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'a', 'en', 'por', 'para', 'con', 'sin']);
  return normalizeSpanish(value)
    .toLocaleLowerCase('es-CL')
    .split(/(\s+|\/|-)/)
    .map((part, index) => {
      if (!part.trim() || part === '/' || part === '-') return part;
      const upper = part.toLocaleUpperCase('es-CL');
      if (keepUpper.has(upper)) return upper;
      if (index > 0 && lowerWords.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase('es-CL') + part.slice(1);
    })
    .join('')
    .replace(/\bNch\b/g, 'NCh')
    .replace(/\bRidaa\b/g, 'RIDAA')
    .replace(/\bEtabs\b/g, 'ETABS')
    .replace(/\bCoi\b/g, 'COI')
    .replace(/\b(\d+)s\b/gi, '$1S');
}

function slug(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function inferYear(row, item) {
  const fromPath = String(row.path || item.Path || '').match(/\b(20\d{2})\b/);
  if (fromPath) return Number(fromPath[1]);
  const date = row.modified_time || item.ModTime;
  return date ? new Date(date).getFullYear() : 2026;
}

function inferFormat(row, item) {
  if (row.format) return String(row.format).toUpperCase();
  const ext = path.extname(item.Name || row.name || '').replace('.', '');
  return ext ? ext.toUpperCase() : 'Archivo';
}

function inferType(row, item) {
  const type = String(row.material_type || '').trim();
  if (type && type !== 'Otro') return normalizeSpanish(type);
  const text = `${row.path || ''} ${item.Name || ''}`.toLowerCase();
  if (text.includes('ayudant')) return 'Ayudantía';
  if (text.includes('prueba') || text.includes('control') || text.includes('examen')) return 'Prueba';
  if (text.includes('taller')) return 'Taller';
  if (text.includes('apunte') || text.includes('clase')) return 'Apunte';
  if (text.includes('formulario')) return 'Formulario';
  if (text.includes('norma') || text.includes('nch') || text.includes('ridaa')) return 'Norma';
  if (text.includes('presentacion') || text.includes('presentación')) return 'PPT';
  if (text.includes('ejercicio')) return 'Ejercicios';
  if (text.includes('informe')) return 'Informe';
  return inferFormat(row, item) === 'PDF' ? 'PDF' : 'Material';
}

function courseFallback(row, item) {
  const pathText = String(row.path || item.Path || '');
  const segments = pathText.split(/[\\/]/).map((part) => part.trim()).filter(Boolean);
  const candidates = segments.filter((part) => (
    !/^(20\d{2}|1er semestre|2do semestre|primer semestre|segundo semestre|ayudant[ií]as?|material|normas?|control \d+|taller|planos?)$/i.test(part)
    && !/\.[a-z0-9]{2,5}$/i.test(part)
  ));
  return candidates[candidates.length - 1] || 'Ingeniería Civil';
}

function buildDescription(row, item, type, courseName) {
  const format = inferFormat(row, item);
  const year = inferYear(row, item);
  const pieces = [`${type} en formato ${format}`];
  if (courseName && courseName !== 'Ingeniería Civil') pieces.push(`asociado a ${courseName}`);
  if (year) pieces.push(`año ${year}`);
  return normalizeSpanish(`${pieces.join(', ')}. Recurso publicado en la Biblioteca CEIC para apoyo académico.`);
}

function loadInputs(importDir) {
  const manifestPath = path.join(importDir, 'manifest.json');
  const destinationPath = path.join(importDir, 'destination-lsjson.json');
  if (!existsSync(manifestPath)) throw new Error(`No existe ${manifestPath}`);
  if (!existsSync(destinationPath)) throw new Error(`No existe ${destinationPath}`);
  return {
    manifest: readJson(manifestPath),
    destination: readJson(destinationPath)
  };
}

function loadCurricula(curriculaPath) {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(curriculaPath, 'utf8'), sandbox, { filename: curriculaPath });
  return sandbox.window.CURRICULA || {};
}

function buildCourseIndex(curricula) {
  const byCode = new Map();
  for (const [plan, data] of Object.entries(curricula)) {
    for (const subject of data.subjects || []) {
      for (const code of [subject.code, subject.visibleCode].filter(Boolean)) {
        if (!byCode.has(code)) byCode.set(code, []);
        byCode.get(code).push({ plan, subject });
      }
    }
  }
  return byCode;
}

function officialCourseFor(row, courseIndex) {
  const code = String(row.course_code || '').trim();
  if (!code || !courseIndex.has(code)) return null;
  const matches = courseIndex.get(code);
  return matches.find((match) => match.plan === row.plan) || matches[0] || null;
}

function buildMaterials(importDir) {
  const { manifest, destination } = loadInputs(importDir);
  const curriculaPath = argValue('curricula', DEFAULT_CURRICULA);
  const courseIndex = buildCourseIndex(loadCurricula(curriculaPath));
  const destinationByPath = new Map(destination.filter((item) => item.ID).map((item) => [item.Path, item]));

  return manifest
    .filter((row) => (
      row.portal_candidate
      && row.privacy_action !== 'bloquear'
      && !row.review_required
      && !String(row.mime_type || '').includes('shortcut')
      && !String(row.mime_type || '').startsWith('video/')
      && !/\.(mp4|mov|avi|wmv|mkv|webm|mpeg|mpg|m4v)$/i.test(row.name || row.path || '')
    ))
    .map((row, index) => {
      const courseMatch = officialCourseFor(row, courseIndex);
      if (!courseMatch) return null;
      const nativeExt = row.mime_type?.startsWith('application/vnd.google-apps.') && row.format ? `.${String(row.format).toLowerCase()}` : '';
      const publishedPath = `originales/${row.source_label}/${row.path}${nativeExt && !String(row.path).toLowerCase().endsWith(nativeExt) ? nativeExt : ''}`;
      const publishedItem = destinationByPath.get(publishedPath);
      const externalUrl = publishedItem?.ID
        ? `https://drive.google.com/open?id=${publishedItem.ID}`
        : (row.source_label === 'universidad' ? row.drive_url : '');
      if (!externalUrl) return null;
      const official = courseMatch.subject;
      const type = inferType(row, row);
      const courseName = titleCase(official.name);
      const courseCode = official.visibleCode || official.code;
      const format = inferFormat(row, row);
      const year = inferYear(row, row);
      const title = titleCase(cleanTitle(row.name));
      return {
        id: `drive-${slug(publishedItem?.ID || row.drive_id || row.path) || index}`,
        title,
        type,
        courseCode,
        plan: courseMatch.plan,
        courseName,
        semester: official.semester || (row.semester ? Number(row.semester) : ''),
        year,
        format,
        size: humanSize(row.size_bytes),
        origin: 'Biblioteca CEIC',
        status: 'validadoCeal',
        uploadedBy: 'Biblioteca CEIC',
        uploadedAt: '2026-06-11',
        description: buildDescription(row, row, type, courseName),
        externalUrl,
        source: 'drive'
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const byYear = Number(b.year || 0) - Number(a.year || 0);
      if (byYear) return byYear;
      return a.courseName.localeCompare(b.courseName, 'es') || a.title.localeCompare(b.title, 'es');
    });
}

const importDir = argValue('input', DEFAULT_IMPORT_DIR);
const output = argValue('output', DEFAULT_OUTPUT);
const materials = buildMaterials(importDir);
const body = `// Generado por scripts/build-drive-materials.mjs desde la biblioteca Drive CEIC.\nwindow.PortalDriveMaterials = ${JSON.stringify(materials, null, 2)};\n`;
writeFileSync(output, body, 'utf8');
console.log(`Materiales Drive generados: ${materials.length}`);
console.log(`Salida: ${output}`);
