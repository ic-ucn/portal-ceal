# Especificacion de implementacion - Portal CEIC / CEAL UCN

## Objetivo

Entregar un portal academico operativo para estudiantes e integrantes CEAL de Ingenieria Civil UCN, con frontend responsive, backend local, datos curriculares reales y flujos internos de gestion.

## Principios

- Producto academico de uso semanal, no landing institucional.
- Identidad sobria: navy, blanco, gris suave, azul institucional y acento naranja CEIC/UCN.
- Mobile-first real: bottom nav, cards, formularios apilados y malla por semestre.
- Desktop con densidad util: sidebar, topbar, paneles laterales y tablas solo donde aportan.
- El logo se usa en header, sidebar y login, no como decoracion repetida en cards.
- Cada modulo mantiene proposito propio.
- Sin RUT, PPA ni datos sensibles de integrantes.

## Modulos implementados

1. Acceso estudiante.
2. Acceso CEAL con primer password.
3. Inicio.
4. Comunicados + FAQ.
5. Calendario y acuerdos.
6. Casos y seguimiento.
7. Nuevo caso.
8. Biblioteca academica / Material.
9. Subir material.
10. Mallas interactivas.
11. Detalle de ramo.
12. Ayudantias y tramites.
13. Mi cuenta / perfil.
14. Busqueda global.
15. Notificaciones.
16. Gestion CEAL.
17. Editor interno de comunicado.
18. Validacion de material.
19. Nuevo acuerdo.
20. Gestion de caso.

## Mallas curriculares

Archivos originales:

- `original-mallas/malla-o.html`
- `original-mallas/malla-p.html`

Datos normalizados:

- `data/curricula.js`
- `planO.totalSemesters = 10`
- `planO.expectedSubjects = 61`
- `planP.totalSemesters = 11`
- `planP.expectedSubjects = 64`

Funciones principales:

- `getPlanData(plan)`
- `getCourses(plan)`
- `findCourse(plan, code)`
- `findCoursePlanForCode(code)`
- `getProgress(plan, code)`
- `getSuccessors(plan, code)`
- `getPrereqs(plan, course)`
- `getResourcesForCourse(plan, code)`
- `renderMallas()`
- `renderCourseDetail(course, plan, inline)`
- `renderCourseDetailPage(plan, code)`

## Backend local

`server.mjs` expone una API local sobre archivos JSON:

- `GET /api/bootstrap`
- `GET /api/auth/members`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `GET/POST/PATCH /api/communications`
- `GET/POST/PATCH /api/cases`
- `GET/POST/PATCH /api/materials`
- `GET/POST/PATCH /api/agreements`
- `GET/POST/PATCH /api/events`
- `POST /api/saved`

Persistencia:

- `.data/portal-db.json`
- `.data/` queda fuera de git.

GitHub Pages sirve el frontend estatico. Para persistencia multiusuario real, desplegar `server.mjs` o una API equivalente en un runtime con storage remoto.

## Validaciones incluidas

- Nuevo caso: tipo, titulo, descripcion y privacidad obligatorios.
- Subir material: ramo, tipo, origen, archivo/enlace, descripcion y declaracion obligatoria.
- Login CEAL: password requerido y confirmacion en primer ingreso.
- Editar contenido: titulo, resumen y cuerpo obligatorios.
- Nuevo acuerdo: titulo, origen, area, fecha, responsable y proximo paso.

## Verificacion

- `npm run check`
- `npm run quality`
- `node scripts\qa-portal.mjs`

Cobertura actual:

- 2429 assertions estructurales.
- 43 rutas desktop/mobile/CEAL.
- 9 flujos E2E principales.
