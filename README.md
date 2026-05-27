# Portal CEIC / CEAL UCN

Portal academico para estudiantes e integrantes CEAL de Ingenieria Civil UCN.

## Ejecutar

```powershell
npm install
npm run serve
```

Abrir:

```txt
http://localhost:8080
```

GitHub Pages puede servir el frontend estatico. Para persistencia compartida entre usuarios se debe desplegar el backend `server.mjs` en un runtime con almacenamiento remoto.

## Incluye

- Acceso con Google para cuentas `@alumnos.ucn.cl`.
- Entrada separada para estudiante y CEAL; CEAL valida el correo contra integrantes registrados.
- Inicio con resumen operativo.
- Comunicados, detalle y publicacion desde Gestion CEAL.
- Calendario, acuerdos y nuevo acuerdo interno.
- Biblioteca academica con busqueda, filtros, subida y descarga local de archivos.
- Mallas interactivas Plan O Catalogo 2016 y Plan P Catalogo 2025.
- Detalle de ramo con prerrequisitos, ramos que abre y recursos asociados.
- Ayudantias, tramites y perfil.
- Dashboard Gestion CEAL con permisos por rol.

## Integrantes CEAL

Las cuentas iniciales se generan desde la lista de postulantes CEAL 2026 usando solo nombre, cargo, iniciales, usuario y permisos. No se incluyen RUT, PPA ni datos sensibles.

## Mallas

- Plan O Catalogo 2016: 61 asignaturas, 10 semestres.
- Plan P Catalogo 2025: 64 asignaturas, 11 semestres.

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

- `src/mock-data.js`: semilla estatica para GitHub Pages y fallback sin servidor.
- `server.mjs`: API local con persistencia en `.data/portal-db.json`.
- `.data/`: estado runtime local, ignorado por git.
- `src/config.js`: Client ID publico de Google Identity Services para GitHub Pages.

Endpoints principales:

- `/api/bootstrap`
- `/api/auth/members`
- `/api/auth/setup`
- `/api/auth/login`
- `/api/auth/google`
- `/api/communications`
- `/api/cases`
- `/api/materials`
- `/api/agreements`
- `/api/events`
- `/api/saved`

El backend verifica Google ID tokens con la libreria oficial `google-auth-library`, revisando audiencia, firma, expiracion, correo verificado y `hd=alumnos.ucn.cl`. Las contrasenas locales CEAL quedan solo como contingencia local/QA y se guardan hasheadas con sal.

## Google UCN

1. Crear un OAuth Client ID tipo Web en Google Cloud.
2. Agregar como JavaScript origins:

```txt
https://ceicucn.cl
https://ic-ucn.github.io
http://localhost:8080
http://localhost:18080
```

3. Configurar `src/config.js`:

```js
window.PORTAL_GOOGLE_CLIENT_ID = 'CLIENT_ID.apps.googleusercontent.com';
```

4. Si se usa `server.mjs`, arrancar con la misma variable:

```powershell
$env:PORTAL_GOOGLE_CLIENT_ID='CLIENT_ID.apps.googleusercontent.com'
npm run serve
```

## Verificacion

```powershell
npm run check
npm run quality
node scripts\qa-portal.mjs
```

La suite actual cubre sintaxis, estructura de datos, privacidad de integrantes CEAL, mallas Plan O/Plan P, rutas desktop/mobile, login, material, acuerdos, comunicados y Gestion CEAL.
