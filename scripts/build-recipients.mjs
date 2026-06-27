#!/usr/bin/env node
// Genera recipients.json (alumnos/profes) desde exports CSV de Google Contacts.
// Uso: node scripts/build-recipients.mjs <profesores.csv> <alumnos.csv> [salida.json]
// La salida queda FUERA del repo (gitignored): contiene datos personales.
// El repo es publico; recipients.json NUNCA se commitea. Se sube a Render como Secret File.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseCsv(text) {
  // Parser CSV minimo con soporte de comillas y saltos de linea dentro de campos.
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // ignorar; el \n cierra la fila
    } else if (c === '\n') {
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v !== '')) rows.push(row); }
  return rows;
}

function toRecords(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map(r => {
    const rec = {};
    header.forEach((h, i) => { rec[h] = r[i] ?? ''; });
    return rec;
  });
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function extractEmails(rec) {
  // Junta todos los campos "E-mail N - Value" y separa por " ::: " si hubiera varios.
  const emails = [];
  for (const [key, value] of Object.entries(rec)) {
    if (/^E-mail \d+ - Value$/i.test(key) && value) {
      String(value).split(/\s*:::\s*|\s*,\s*/).forEach(part => {
        const m = part.match(EMAIL_RE);
        if (m) emails.push(m[0].trim().toLowerCase());
      });
    }
  }
  return emails;
}

function classify(rec, emails, fileHint) {
  const labels = `${rec['Labels'] || ''} ${rec['Notes'] || ''} ${rec['Group Membership'] || ''}`.toLowerCase();
  if (labels.includes('profesor') || fileHint === 'professors') {
    if (emails.some(e => e.endsWith('@alumnos.ucn.cl'))) return 'students';
    return 'professors';
  }
  if (labels.includes('alumno') || fileHint === 'students') return 'students';
  // Fallback por dominio.
  if (emails.some(e => e.endsWith('@alumnos.ucn.cl'))) return 'students';
  return 'professors';
}

function loadFile(file, fileHint) {
  const text = readFileSync(file, 'utf8');
  const records = toRecords(text);
  const out = { students: new Set(), professors: new Set() };
  for (const rec of records) {
    const emails = extractEmails(rec);
    if (!emails.length) continue;
    const group = classify(rec, emails, fileHint);
    emails.forEach(e => {
      // No mezclar: un correo @alumnos siempre va a students.
      if (e.endsWith('@alumnos.ucn.cl')) out.students.add(e);
      else out[group].add(e);
    });
  }
  return out;
}

const [profFile, alumFile, outArg] = process.argv.slice(2);
if (!profFile || !alumFile) {
  console.error('Uso: node scripts/build-recipients.mjs <profesores.csv> <alumnos.csv> [salida.json]');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = outArg || path.join(root, 'recipients.json');

const a = loadFile(profFile, 'professors');
const b = loadFile(alumFile, 'students');

const students = [...new Set([...a.students, ...b.students])].sort();
const professors = [...new Set([...a.professors, ...b.professors])].sort()
  .filter(e => !e.endsWith('@alumnos.ucn.cl'));

// Listas pequenas (prueba y directiva CEAL): por env, coma-separadas, para no
// dejar correos personales hardcodeados en este script (el repo es publico).
const EMAIL_OK = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const parseList = (raw) => [...new Set(String(raw || '')
  .split(/[,\s;]+/).map(e => e.trim().toLowerCase()).filter(e => EMAIL_OK.test(e)))];
const test = parseList(process.env.CEAL_TEST_RECIPIENTS);
const ceal = parseList(process.env.CEAL_RECIPIENTS);

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'Google Contacts CSV',
  students,
  professors,
  test,
  ceal,
  counts: { students: students.length, professors: professors.length, test: test.length, ceal: ceal.length }
};

writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`recipients.json -> ${outFile}`);
console.log(`  alumnos: ${students.length}`);
console.log(`  profes:  ${professors.length}`);
console.log(`  test:    ${test.length}`);
console.log(`  ceal:    ${ceal.length}`);
