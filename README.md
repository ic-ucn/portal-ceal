# Portal CEIC / CEAL UCN

Portal académico para estudiantes e integrantes CEAL de Ingeniería Civil UCN.

## Modo temporal de transferencia

La raíz pública `https://ceicucn.cl/` muestra una portada breve de próximamente. La ruta `https://ceicucn.cl/transferir/` contiene la pantalla con los datos de transferencia de la cuenta CEAL. El portal académico permanece en el repositorio, pero la entrada pública no carga sus scripts, datos, manifest ni autenticación.

Archivos activos de esta experiencia:

```txt
index.html
404.html
src/transfer.css
src/transfer.js
assets/qr-ceicucn-transferencia.png
scripts/qa-transfer.mjs
```

Verificación específica:

```powershell
npm run check
npm run quality
npm run qa:transfer
```

El QR fue generado para `https://ceicucn.cl/transferir/`. Para restaurar el portal, recuperar el `index.html` anterior a este modo y volver a ejecutar las suites canónicas del portal antes de publicar.

## Ejecutar

```powershell
npm install
npm run serve
```

Abrir:

```txt
http://localhost:8080
```

GitHub Pages puede servir el frontend estático. Para persistencia compartida entre usuarios se debe desplegar el backend `server.mjs` en un runtime con almacenamiento remoto.

## Incluye

- Acceso con Google para cuentas `@alumnos.ucn.cl`.
- Entrada separada para estudiante y CEAL; CEAL valida el correo contra integrantes registrados.
- Inicio con resumen operativo.
- Calendario, acuerdos y nuevo acuerdo interno.
- Biblioteca académica con búsqueda, filtros, subida y descarga local de archivos.
- Mallas interactivas Plan O Catálogo 2016 y Plan P Catálogo 2025.
- Detalle de ramo con prerrequisitos, ramos que abre y recursos asociados.
- Ayudantías, trámites y perfil.
- Dashboard Gestión CEAL común para integrantes, con edición de contenido existente.
- Panel de tráfico agregado para CEAL, con actividad diaria, secciones, dispositivos, navegadores y origen, sin guardar IP, correo ni identificadores de sesión.

Comunicados, Tutoriales, Atención, Horario académico, encuestas y reservas de mesas no forman parte de la versión publicada. La malla no infiere avance académico porque el portal no dispone de registros curriculares individuales.

## Integrantes CEAL

Las cuentas iniciales se generan desde la lista de postulantes CEAL 2026 usando solo nombre, cargo, iniciales, usuario y permisos. No se incluyen RUT, PPA ni datos sensibles.

## Mallas

- Plan O Catálogo 2016: 61 asignaturas, 10 semestres.
- Plan P Catálogo 2025: 64 asignaturas, 11 semestres.

Fuentes originales:

```txt
original-mallas/malla-o.html
original-mallas/malla-p.html
```

Datos normalizados:

```txt
data/curricula.js
```

## Datos y backend

- `src/mock-data.js`: semilla estática para GitHub Pages y fallback sin servidor.
- `server.mjs`: API local con persistencia en `.data/portal-db.json`.
- `.data/`: estado runtime local, ignorado por git.
- `src/config.js`: Client ID público del OAuth web de Google para GitHub Pages.

Endpoints principales:

- `/api/bootstrap`
- `/api/auth/google`
- `/api/analytics/collect`
- `/api/analytics/summary` (solo CEAL)
- `/api/cases`
- `/api/materials`
- `/api/agreements`
- `/api/events`
- `/api/saved`
- `/api/calendar/appointments`
- `/api/calendar/availability`
- `/api/calendar/config`
- `/api/calendar-updates`

El backend verifica Google ID tokens con la librería oficial `google-auth-library`, revisando audiencia, firma, expiración, correo verificado y `hd=alumnos.ucn.cl`. El login visible del portal usa Google para estudiantes y CEAL, más un modo invitado de solo lectura.

El acceso CEAL es por lista permitida: solo los correos presentes en `cealMembers` pueden entrar por el botón CEAL y obtener permisos internos. Si una persona CEAL usa el botón de estudiante, ve la experiencia normal de estudiante sin acciones de gestión. El primer y último ingreso CEAL se registran en la base de datos cuando se usa `server.mjs`; en GitHub Pages estático solo queda como estado local del navegador.

## Google UCN

1. Crear un OAuth Client ID tipo Web en Google Cloud.
2. Agregar como JavaScript origins:

```txt
https://ceicucn.cl
https://ic-ucn.github.io
http://localhost:8080
http://localhost:18080
```

3. Agregar como Authorized redirect URIs:

```txt
https://ceicucn.cl/
http://localhost:8080/
http://localhost:18080/
```

El portal usa redirección OAuth directa para evitar bloqueos de telemetría del widget Google Identity Services en navegadores con extensiones.

4. Configurar `src/config.js`:

```js
window.PORTAL_GOOGLE_CLIENT_ID = 'CLIENT_ID.apps.googleusercontent.com';
```

5. Si se usa `server.mjs`, arrancar con la misma variable:

```powershell
$env:PORTAL_GOOGLE_CLIENT_ID='CLIENT_ID.apps.googleusercontent.com'
npm run serve
```

## Módulo de Atención no publicado

El código de agenda y Google Calendar se conserva para una posible etapa posterior, pero sus rutas no se publican y su API permanece deshabilitada salvo que `PORTAL_APPOINTMENTS_ENABLED=1` se configure explícitamente.

Cuenta autorizada:

```txt
jc.icivil.afta@ucn.cl
```

Variables requeridas en Render para conectar Calendar:

```txt
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=https://portal-ceic-api.onrender.com/api/calendar/oauth/callback
GOOGLE_CALENDAR_ACCOUNT=jc.icivil.afta@ucn.cl
CALENDAR_CONNECTION_NOTIFY_EMAIL=kevin.cortes@alumnos.ucn.cl
PORTAL_PUBLIC_URL=https://ceicucn.cl
PORTAL_TOKEN_ENCRYPTION_KEY=...
PORTAL_MAX_SESSIONS=1200
CALENDAR_WATCHER_TOKEN=...
```

El URI de callback debe registrarse también como `Authorized redirect URI` en Google Cloud. Tras el callback, el backend comprueba la cuenta autorizada, consulta eventos y disponibilidad, y envía el aviso técnico definido en `CALENDAR_CONNECTION_NOTIFY_EMAIL`. Los tokens de Calendar se guardan cifrados con AES-256-GCM; `PORTAL_TOKEN_ENCRYPTION_KEY` debe ser un secreto aleatorio estable de al menos 32 bytes.

## Actualización del calendario académico

CEAL puede adjuntar una nueva fuente desde `Gestión CEAL > Actualizar calendario`. El archivo queda en una cola privada y nunca se incluye en `/api/bootstrap`.

Para descargar nuevas fuentes a `.data/calendar-inbox/`:

```powershell
npm run calendar:watch -- --once
npm run calendar:watch
```

`CALENDAR_WATCHER_TOKEN` debe tener el mismo valor en el backend y en `.env.local`. `PORTAL_API_BASE` es opcional y, si se omite, apunta al backend publicado.

La persistencia compartida requiere un proyecto Supabase activo y estas variables:

```txt
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
SUPABASE_STATE_TABLE=portal_state
SUPABASE_STATE_ID=main
```

## Verificación

```powershell
npm run check
npm run quality
npm run qa:security
node scripts\qa-portal.mjs
```

La suite cubre sintaxis, privacidad, permisos, 300 sesiones concurrentes, rutas desktop/mobile, login, material, mallas, calendario, perfiles y Gestión CEAL. También verifica que Tutoriales, Atención y Horario académico permanezcan fuera de la publicación.
