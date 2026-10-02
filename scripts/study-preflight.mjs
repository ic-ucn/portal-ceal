import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Match the server's precedence without printing or writing any credential.
export function loadEnvironment(directory = root, inherited = process.env) {
  const env = { ...inherited };
  for (const name of ['.env.local', '.env']) {
    const file = path.join(directory, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || env[match[1]] !== undefined) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  }
  return env;
}

export function checkStudyConfiguration(env, release = false) {
  const checks = [];
  const add = (name, passed, instruction) => checks.push({ name, passed: Boolean(passed), ...(!passed ? { instruction } : {}) });
  const present = value => Boolean(value?.trim()) && !/[<>]/.test(value);
  const validUrl = (value, callback = false) => {
    try {
      const url = new URL(value);
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      return !url.username && !url.password && !url.search && !url.hash
        && (release ? url.protocol === 'https:' && !loopback : url.protocol === 'https:' || url.protocol === 'http:' && loopback)
        && (!callback || url.pathname === '/api/study/calendar/callback');
    } catch { return false; }
  };
  add('login_google', present(env.PORTAL_GOOGLE_CLIENT_ID), 'Configurar PORTAL_GOOGLE_CLIENT_ID.');
  add('cliente_calendar', present(env.STUDY_CALENDAR_CLIENT_ID || env.GOOGLE_CALENDAR_CLIENT_ID || env.PORTAL_GOOGLE_CLIENT_ID), 'Configurar el cliente OAuth web de Calendar.');
  add('secreto_calendar', present(env.STUDY_CALENDAR_CLIENT_SECRET || env.GOOGLE_CALENDAR_CLIENT_SECRET), 'Configurar el secreto OAuth en el entorno seguro del servidor.');
  add('cifrado_estable', present(env.PORTAL_TOKEN_ENCRYPTION_KEY) && Buffer.byteLength(env.PORTAL_TOKEN_ENCRYPTION_KEY || '') >= 32,
    'Configurar una clave explícita y estable de al menos 32 bytes. Si existe cifrado previo, conservar la clave efectiva y planificar cualquier rotación.');
  add('retorno_calendar', validUrl(env.STUDY_CALENDAR_REDIRECT_URI, true), 'Configurar STUDY_CALENDAR_REDIRECT_URI con /api/study/calendar/callback y registrar exactamente esa URI en Google.');
  add('retorno_portal', validUrl(env.STUDY_PORTAL_RETURN_URL || env.PORTAL_PUBLIC_URL), 'Configurar STUDY_PORTAL_RETURN_URL con el origen desde el que se inicia sesión, sin consulta ni fragmento.');
  if (release) {
    add('sesiones_de_prueba_apagadas', env.QA_TEST_MODE !== '1', 'Desactivar QA_TEST_MODE en el servicio de lanzamiento.');
    const remoteState = env.PORTAL_STATE_BACKEND?.trim().toLowerCase() !== 'local' && present(env.SUPABASE_URL) && present(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
    add('persistencia_de_cuentas', remoteState || present(env.PORTAL_DB_PATH) && path.isAbsolute(env.PORTAL_DB_PATH),
      'Configurar Supabase o PORTAL_DB_PATH absoluto en un volumen persistente. Verificar respaldo y una sola instancia escritora.');
  }
  return {
    configurationComplete: checks.every(check => check.passed),
    mode: release ? 'lanzamiento' : 'interno', checks,
    verificationStillRequired: [
      'Consentimiento OAuth y usuarios permitidos; Calendar API habilitada y URIs registradas.',
      'Prueba Google real: acceso, conexión, alta, cambio, conflicto externo, desconexión y reconexión.',
      'Mismo origen del portal al regresar; persistencia tras reinicio, respaldo y una sola instancia escritora.'
    ]
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = checkStudyConfiguration(loadEnvironment(), process.argv.includes('--release'));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.configurationComplete ? 0 : 1;
}
