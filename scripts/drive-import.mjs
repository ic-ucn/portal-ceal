import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const DEFAULT_CONFIG = path.join(ROOT, '.data', 'drive-import-config.json');
const DEFAULT_OUTPUT = path.join(ROOT, '.data', 'drive-imports');
let RCLONE_BIN = process.env.RCLONE_BIN || 'rclone';
const GOOGLE_MIME_PREFIX = 'application/vnd.google-apps.';
const DEFAULT_BLOCKED_PRIVATE_PATTERNS = [
  'pauta',
  'pautas',
  'resuelto',
  'resuelta',
  'resueltos',
  'resueltas',
  'resolucion',
  'resoluciones',
  'solucion',
  'soluciones',
  'solucionario',
  'desarrollo',
  'desarrollado',
  'desarrollada',
  'respuesta',
  'respuestas'
];

const MATERIAL_RULES = [
  { type: 'Pauta/Resolucion', patterns: ['pauta', 'resuelto', 'resuelta', 'resolucion', 'solucion', 'solucionario', 'desarrollo', 'respuesta'] },
  { type: 'Enunciado', patterns: ['enunciado', 'certamen', 'control', 'parcial', 'examen', 'prueba', 'solemne'] },
  { type: 'Guia', patterns: ['guia', 'guias', 'ejercicios', 'tarea', 'ayudantia', 'taller'] },
  { type: 'Presentacion', patterns: ['ppt', 'pptx', 'diapositiva', 'slides', 'presentacion'] },
  { type: 'Apunte', patterns: ['apunte', 'apuntes', 'clase', 'clases'] },
  { type: 'Resumen', patterns: ['resumen', 'formulario', 'mapa conceptual'] },
  { type: 'Programa', patterns: ['programa', 'syllabus'] },
  { type: 'Laboratorio', patterns: ['laboratorio', 'lab', 'informe'] }
];

const GOOGLE_EXPORT_EXTENSIONS = new Map([
  ['application/vnd.google-apps.document', 'pdf'],
  ['application/vnd.google-apps.presentation', 'pdf'],
  ['application/vnd.google-apps.spreadsheet', 'xlsx'],
  ['application/vnd.google-apps.drawing', 'png']
]);

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) {
      args._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function argValue(args, camelKey, dashedKey) {
  return args[camelKey] ?? args[dashedKey];
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slugPart(value) {
  const cleaned = normalizeText(value)
    .replace(/[^a-z0-9._ -]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'sin-nombre';
}

function safeRelativePath(relativePath) {
  return String(relativePath || '')
    .split(/[\\/]+/)
    .filter(Boolean)
    .map(slugPart)
    .join(path.sep);
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, rows) {
  const headers = [
    'source_label',
    'privacy',
    'privacy_action',
    'privacy_reason',
    'portal_candidate',
    'review_required',
    'material_type',
    'course_code',
    'course_name',
    'plan',
    'semester',
    'confidence',
    'name',
    'path',
    'mime_type',
    'format',
    'size_bytes',
    'hash_md5',
    'duplicate_key',
    'duplicate_count',
    'modified_time',
    'drive_id',
    'drive_url',
    'local_path'
  ];
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ];
  writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function readConfig(args) {
  const configPath = path.resolve(args.config || DEFAULT_CONFIG);
  if (!existsSync(configPath)) {
    throw new Error(`No existe config: ${configPath}. Ejecuta npm run drive:init o crea .data/drive-import-config.json.`);
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  return { configPath, config };
}

function defaultConfig() {
  return {
    rclonePath: process.env.RCLONE_BIN || 'rclone',
    rcloneRemote: 'portaldrive',
    outputDir: DEFAULT_OUTPUT,
    folders: [
      {
        label: 'universidad',
        folderId: '',
        privacy: 'public_source',
        sharedWithMe: false
      },
      {
        label: 'universidad-personal',
        folderId: '',
        privacy: 'private_source',
        sharedWithMe: false,
        blockedPatterns: DEFAULT_BLOCKED_PRIVATE_PATTERNS,
        notes: 'No compartir la carpeta completa. Bloquear pautas, resoluciones, resueltos, soluciones y desarrollos.'
      }
    ],
    download: {
      enabled: false,
      exportGoogleDocsAs: 'pdf',
      exportGoogleSheetsAs: 'xlsx',
      exportGoogleSlidesAs: 'pdf'
    }
  };
}

function initConfig(args) {
  const configPath = path.resolve(args.config || DEFAULT_CONFIG);
  if (existsSync(configPath) && !args.force) {
    console.log(`Config ya existe: ${configPath}`);
    return;
  }
  const config = defaultConfig();
  const publicFolder = argValue(args, 'publicFolder', 'public-folder');
  const privateFolder = argValue(args, 'privateFolder', 'private-folder');
  const rclonePath = argValue(args, 'rclonePath', 'rclone-path');
  if (publicFolder) config.folders[0].folderId = publicFolder;
  if (privateFolder) config.folders[1].folderId = privateFolder;
  if (rclonePath) config.rclonePath = rclonePath;
  if (args.remote) config.rcloneRemote = args.remote;
  ensureDir(path.dirname(configPath));
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`Config creada: ${configPath}`);
}

function commandExists(command) {
  try {
    execFileSync(command, ['version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runRclone(args, options = {}) {
  try {
    return execFileSync(RCLONE_BIN, args, {
      cwd: ROOT,
      encoding: options.encoding || 'utf8',
      maxBuffer: 200 * 1024 * 1024,
      stdio: options.stdio || ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr) : '';
    const stdout = error.stdout ? String(error.stdout) : '';
    const message = [stdout, stderr].filter(Boolean).join('\n').trim();
    throw new Error(message || error.message);
  }
}

function rcloneFolderArgs(folder, remote) {
  const args = [];
  if (folder.sharedWithMe) args.push('--drive-shared-with-me');
  args.push('--drive-root-folder-id', folder.folderId);
  args.push(`${remote}:`);
  return args;
}

function listFolder(folder, remote) {
  const base = ['lsjson', '--recursive', '--hash', '--metadata', ...rcloneFolderArgs(folder, remote)];
  try {
    return JSON.parse(runRclone(base));
  } catch (error) {
    if (!String(error.message).includes('unknown flag')) throw error;
    const fallback = ['lsjson', '--recursive', '--hash', ...rcloneFolderArgs(folder, remote)];
    return JSON.parse(runRclone(fallback));
  }
}

function loadCourses() {
  const curriculaPath = path.join(ROOT, 'data', 'curricula.js');
  const source = readFileSync(curriculaPath, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: curriculaPath });
  const curricula = sandbox.window.CURRICULA || {};
  const courses = [];
  for (const [plan, data] of Object.entries(curricula)) {
    for (const subject of data.subjects || []) {
      const name = subject.name || '';
      const normalizedName = normalizeText(name);
      const words = normalizedName.split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
      courses.push({
        plan,
        code: subject.visibleCode || subject.code,
        codeAlt: subject.code,
        name,
        semester: subject.semester,
        phrase: normalizedName,
        words
      });
    }
  }
  return courses;
}

function inferCourse(searchText, courses) {
  let best = null;
  for (const course of courses) {
    const code = normalizeText(course.code);
    const codeFlat = code.replace(/[^a-z0-9]/g, '');
    const alt = normalizeText(course.codeAlt).replace(/[^a-z0-9]/g, '');
    const textFlat = searchText.replace(/[^a-z0-9]/g, '');
    let score = 0;
    if (code && searchText.includes(code)) score += 100;
    if (codeFlat && textFlat.includes(codeFlat)) score += 90;
    if (alt && textFlat.includes(alt)) score += 80;
    if (course.phrase && course.phrase.length > 8 && searchText.includes(course.phrase)) score += 70;
    for (const word of course.words) {
      if (searchText.includes(word)) score += 8;
    }
    if (!best || score > best.score) best = { ...course, score };
  }
  if (!best || best.score < 16) return null;
  return {
    course_code: best.code,
    course_name: best.name,
    plan: best.plan,
    semester: best.semester,
    confidence: Math.min(1, best.score / 100)
  };
}

function inferMaterialType(searchText) {
  for (const rule of MATERIAL_RULES) {
    if (rule.patterns.some((pattern) => searchText.includes(pattern))) return rule.type;
  }
  return 'Otro';
}

function isGoogleNative(mimeType) {
  return String(mimeType || '').startsWith(GOOGLE_MIME_PREFIX);
}

function extensionFromName(name) {
  const ext = path.extname(name || '').replace('.', '');
  return ext ? ext.toUpperCase() : '';
}

function googleExportExtension(mimeType, config) {
  if (mimeType === 'application/vnd.google-apps.document') return config.download?.exportGoogleDocsAs || 'pdf';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return config.download?.exportGoogleSheetsAs || 'xlsx';
  if (mimeType === 'application/vnd.google-apps.presentation') return config.download?.exportGoogleSlidesAs || 'pdf';
  return GOOGLE_EXPORT_EXTENSIONS.get(mimeType) || 'pdf';
}

function computePrivacy(folder, item, materialType, searchText) {
  const blockedPatterns = (folder.blockedPatterns || DEFAULT_BLOCKED_PRIVATE_PATTERNS).map(normalizeText);
  const matchedBlocked = blockedPatterns.find((pattern) => searchText.includes(pattern));
  const isPrivate = folder.privacy === 'private_source';
  const looksSolved = materialType === 'Pauta/Resolucion' || Boolean(matchedBlocked);

  if (isPrivate && looksSolved) {
    return {
      privacy_action: 'bloquear',
      privacy_reason: `Carpeta personal: posible pauta/resolucion (${matchedBlocked || materialType}).`,
      portal_candidate: false,
      review_required: true
    };
  }

  if (isPrivate) {
    return {
      privacy_action: 'candidato',
      privacy_reason: 'Carpeta personal autorizada excepto pautas, resoluciones, resueltos y soluciones.',
      portal_candidate: true,
      review_required: false
    };
  }

  if (looksSolved) {
    return {
      privacy_action: 'revisar',
      privacy_reason: 'Material parece pauta/resolucion; revisar antes de publicar.',
      portal_candidate: true,
      review_required: true
    };
  }

  return {
    privacy_action: 'candidato',
    privacy_reason: '',
    portal_candidate: true,
    review_required: false
  };
}

function itemMd5(item) {
  return item?.Hashes?.MD5 || item?.Hashes?.md5 || item?.MD5 || item?.Md5 || '';
}

function duplicateKeyFor(row) {
  if (row.hash_md5) return `md5:${row.hash_md5}`;
  const size = row.size_bytes || 'unknown-size';
  return `name-size:${normalizeText(row.name)}:${size}`;
}

function annotateDuplicates(rows) {
  const counts = new Map();
  for (const row of rows) {
    row.duplicate_key = duplicateKeyFor(row);
    counts.set(row.duplicate_key, (counts.get(row.duplicate_key) || 0) + 1);
  }
  for (const row of rows) {
    row.duplicate_count = counts.get(row.duplicate_key) || 1;
    if (row.duplicate_count > 1 && !row.review_required) {
      row.review_required = true;
      row.privacy_action = 'revisar';
      row.privacy_reason = 'Posible duplicado; revisar antes de publicar.';
    }
  }
}

function toManifestRows(folder, items, courses, config) {
  return items
    .filter((item) => !item.IsDir)
    .map((item) => {
      const itemPath = item.Path || item.Name || '';
      const searchText = normalizeText(`${folder.label} ${itemPath} ${item.Name || ''}`);
      const materialType = inferMaterialType(searchText);
      const course = inferCourse(searchText, courses) || {};
      const privacy = computePrivacy(folder, item, materialType, searchText);
      if (!privacy.review_required && (materialType === 'Otro' || !course.course_code)) {
        privacy.privacy_action = 'revisar';
        privacy.privacy_reason = 'Falta ramo o tipo de material claro.';
        privacy.review_required = true;
      }
      const native = isGoogleNative(item.MimeType);
      const format = native ? googleExportExtension(item.MimeType, config).toUpperCase() : extensionFromName(item.Name);
      const driveId = item.ID || item.Id || '';
      return {
        source_label: folder.label,
        privacy: folder.privacy,
        ...privacy,
        material_type: materialType,
        course_code: course.course_code || '',
        course_name: course.course_name || '',
        plan: course.plan || '',
        semester: course.semester || '',
        confidence: course.confidence ? course.confidence.toFixed(2) : '',
        name: item.Name || path.basename(itemPath),
        path: itemPath,
        mime_type: item.MimeType || '',
        format,
        size_bytes: item.Size ?? '',
        hash_md5: itemMd5(item),
        duplicate_key: '',
        duplicate_count: '',
        modified_time: item.ModTime || item.ModifyTime || '',
        drive_id: driveId,
        drive_url: driveId ? `https://drive.google.com/open?id=${driveId}` : '',
        local_path: '',
        is_google_native: native,
        _folderId: folder.folderId,
        _sharedWithMe: Boolean(folder.sharedWithMe),
        _raw: item
      };
    });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function outputDir(config, args) {
  if (args.output) return path.resolve(args.output);
  const base = path.resolve(config.outputDir || DEFAULT_OUTPUT);
  return path.join(base, timestamp());
}

function writeOutputs(dir, rows) {
  ensureDir(dir);
  const publicRows = rows.map(({ _raw, _folderId, _sharedWithMe, is_google_native, ...row }) => row);
  writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(publicRows, null, 2)}\n`, 'utf8');
  writeCsv(path.join(dir, 'manifest.csv'), publicRows);
  writeCsv(path.join(dir, 'portal-candidates.csv'), publicRows.filter((row) => row.portal_candidate));
  writeCsv(path.join(dir, 'upload-ready.csv'), publicRows.filter((row) => row.portal_candidate && !row.review_required));
  writeCsv(path.join(dir, 'private-candidates-review.csv'), publicRows.filter((row) => (
    row.privacy === 'private_source'
    && row.portal_candidate
    && row.privacy_action !== 'bloquear'
  )));
  writeCsv(path.join(dir, 'review-required.csv'), publicRows.filter((row) => row.review_required));
  writeCsv(path.join(dir, 'blocked-private.csv'), publicRows.filter((row) => row.privacy_action === 'bloquear'));
  console.log(`Inventario escrito en: ${dir}`);
  console.log(`Archivos totales: ${rows.length}`);
  console.log(`Candidatos portal: ${publicRows.filter((row) => row.portal_candidate).length}`);
  console.log(`Listos para subir: ${publicRows.filter((row) => row.portal_candidate && !row.review_required).length}`);
  console.log(`Requieren revision: ${publicRows.filter((row) => row.review_required).length}`);
  console.log(`Bloqueados carpeta personal: ${publicRows.filter((row) => row.privacy_action === 'bloquear').length}`);
}

function inventory(args) {
  const { config } = readConfig(args);
  RCLONE_BIN = config.rclonePath || process.env.RCLONE_BIN || 'rclone';
  if (!commandExists(RCLONE_BIN)) {
    throw new Error('rclone no esta instalado o rclonePath no apunta a un binario valido. Instala con: winget install Rclone.Rclone');
  }
  const courses = loadCourses();
  const rows = [];
  for (const folder of config.folders || []) {
    if (!folder.folderId) throw new Error(`Falta folderId para ${folder.label}`);
    console.log(`Listando ${folder.label}...`);
    const items = listFolder(folder, config.rcloneRemote);
    rows.push(...toManifestRows(folder, items, courses, config));
  }
  annotateDuplicates(rows);
  const dir = outputDir(config, args);
  writeOutputs(dir, rows);
  return { dir, rows, config };
}

function downloadAllowed(args) {
  const result = inventory(args);
  const downloadDir = path.join(result.dir, 'files');
  ensureDir(downloadDir);
  const includeReview = Boolean(argValue(args, 'includeReview', 'include-review'));
  const rows = result.rows.filter((row) => (
    row.portal_candidate
    && row.privacy_action !== 'bloquear'
    && (includeReview || !row.review_required)
  ));
  console.log(`Archivos a descargar: ${rows.length}${includeReview ? ' (incluye revision)' : ' (solo upload-ready)'}`);
  for (const row of rows) {
    const folder = (result.config.folders || []).find((entry) => entry.folderId === row._folderId);
    const remote = result.config.rcloneRemote;
    const baseArgs = [];
    if (row._sharedWithMe) baseArgs.push('--drive-shared-with-me');
    baseArgs.push('--drive-root-folder-id', row._folderId);
    if (row.is_google_native) baseArgs.push('--drive-export-formats', row.format.toLowerCase());
    const relative = safeRelativePath(row.path);
    const parsed = path.parse(relative);
    const extension = row.format ? `.${row.format.toLowerCase()}` : parsed.ext;
    const destination = row.is_google_native
      ? path.join(downloadDir, row.source_label, parsed.dir, `${parsed.name}${extension}`)
      : path.join(downloadDir, row.source_label, relative);
    ensureDir(path.dirname(destination));
    const source = `${remote}:${row.path}`;
    console.log(`Descargando ${folder?.label || row.source_label}: ${row.path}`);
    runRclone(['copyto', ...baseArgs, source, destination], { stdio: 'pipe' });
    row.local_path = path.relative(result.dir, destination);
  }
  writeOutputs(result.dir, result.rows);
  console.log(`Descarga escrita en: ${downloadDir}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'inventory';
  if (command === 'init') {
    initConfig(args);
    return;
  }
  if (command === 'inventory') {
    inventory(args);
    return;
  }
  if (command === 'download') {
    downloadAllowed(args);
    return;
  }
  throw new Error(`Comando no reconocido: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
