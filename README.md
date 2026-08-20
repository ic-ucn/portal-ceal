# Portal CEIC / CEAL UCN

Portal académico para estudiantes e integrantes CEAL de Ingeniería Civil UCN.

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
- Comunicados, detalle y publicación desde Gestión CEAL.
- Calendario, acuerdos y nuevo acuerdo interno.
- Atención de Jefatura con horas dinámicas, confirmación y avisos por correo.
- Biblioteca académica con búsqueda, filtros, subida y descarga local de archivos.
- Mallas interactivas Plan O Catálogo 2016 y Plan P Catálogo 2025.
- Detalle de ramo con prerrequisitos, ramos que abre y recursos asociados.
- Ayudantías, trámites y perfil.
- Dashboard Gestión CEAL común para integrantes, con edición de contenido existente.

Encuestas y reservas de mesas están deshabilitadas temporalmente en frontend y API. La malla no infiere avance académico porque el portal no dispone de registros curriculares individuales.

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
- `/api/communications`
- `/api/cases`
- `/api/materials`
- `/api/agreements`
- `/api/events`
- `/api/saved`
- `/api/calendar/appointments`
- `/api/calendar/availability`

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

## Atención y Google Calendar

La agenda funciona sin Google Calendar: Jefatura publica disponibilidad, el estudiante solicita una hora y Jefatura confirma o rechaza. Calendar es una sincronización opcional para crear el evento institucional después de confirmar.

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
PORTAL_PUBLIC_URL=https://ceicucn.cl
PORTAL_TOKEN_ENCRYPTION_KEY=...
PORTAL_MAX_SESSIONS=1200
```

El URI de callback debe registrarse también como `Authorized redirect URI` en Google Cloud. Los tokens de Calendar se guardan cifrados con AES-256-GCM; `PORTAL_TOKEN_ENCRYPTION_KEY` debe ser un secreto aleatorio estable de al menos 32 bytes.

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

La suite cubre sintaxis, privacidad, permisos, 300 sesiones concurrentes, colisiones de horas, rutas desktop/mobile, login, material, mallas, calendario, Atención, Jefatura y Gestión CEAL.
