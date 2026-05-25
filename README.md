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

- Acceso como estudiante.
- Acceso CEAL por integrante, con creacion de contrasena en el primer ingreso.
- Inicio con resumen operativo.
- Comunicados, detalle y publicacion desde Gestion CEAL.
- Calendario, acuerdos y nuevo acuerdo interno.
- Casos y seguimiento para estudiantes.
- Gestion de casos para integrantes CEAL.
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

Endpoints principales:

- `/api/bootstrap`
- `/api/auth/members`
- `/api/auth/setup`
- `/api/auth/login`
- `/api/communications`
- `/api/cases`
- `/api/materials`
- `/api/agreements`
- `/api/events`
- `/api/saved`

Las contrasenas CEAL se guardan hasheadas con sal y no se exponen por API.

## Verificacion

```powershell
npm run check
npm run quality
node scripts\qa-portal.mjs
```

La suite actual cubre sintaxis, estructura de datos, privacidad de integrantes CEAL, mallas Plan O/Plan P, rutas desktop/mobile, login, material, casos, acuerdos, comunicados y Gestion CEAL.
