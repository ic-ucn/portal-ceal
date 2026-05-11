# Especificación de implementación — Portal CEAL / CEIC UCN

## Objetivo

Entregar una demo frontend avanzada, funcional y navegable del Portal CEAL / CEIC UCN, preparada para una futura integración con backend, pero sin implementar servicios reales todavía.

## Principios usados

- Producto académico de uso semanal, no landing institucional.
- Identidad sobria: navy, blanco, gris suave, azul institucional y acento naranja CEIC/UCN.
- Mobile-first real: bottom nav, cards, formularios apilados y malla por semestre.
- Desktop con densidad útil: sidebar, topbar, paneles laterales y tablas solo donde aportan.
- El logo se usa en header, sidebar y login, no como decoración repetida en cada card.
- Cada módulo mantiene propósito propio; no se fuerza todo como dashboard.

## Módulos implementados

1. Login / selección de rol.
2. Inicio.
3. Comunicados + FAQ.
4. Calendario y acuerdos.
5. Casos y seguimiento.
6. Nuevo caso.
7. Biblioteca académica / Material.
8. Subir material.
9. Mallas interactivas.
10. Detalle de ramo.
11. Ayudantías y trámites.
12. Mi cuenta / perfil.
13. Búsqueda global.
14. Notificaciones.
15. Gestión CEAL.
16. Editor interno de comunicado.
17. Validación de material.

## Mallas curriculares

Los archivos originales están en:

- `original-mallas/malla-o.html`
- `original-mallas/malla-p.html`

La app usa `data/curricula.js` con datos normalizados:

- `planO.totalSemesters = 10`
- `planO.expectedSubjects = 61`
- `planP.totalSemesters = 11`
- `planP.expectedSubjects = 64`

La lógica principal en `src/app.js` usa estas funciones:

- `getPlanData(plan)`
- `getCourses(plan)`
- `findCourse(plan, code)`
- `findCoursePlanForCode(code)`
- `getProgress(plan, code)`
- `getSuccessors(plan, code)`
- `getDirectPrereqs(plan, course)`
- `getCourseResources(plan, code)`
- `getCourseTutoring(code)`
- `renderMallas()`
- `renderCourseDetail(course, plan, compact)`
- `renderCourseDetailPage(plan, code)`

## Backend futuro

Cuando se agregue backend, reemplazar `src/mock-data.js` por repositorios o servicios:

- `usersRepository`
- `casesRepository`
- `materialsRepository`
- `calendarRepository`
- `agreementsRepository`
- `communicationsRepository`
- `curriculaRepository`

Mantener estos conceptos:

- IDs únicos por entidad.
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- Estados normalizados.
- Permisos por rol.
- Auditoría para Gestión CEAL.
- Separar datos curriculares de progreso personal.

## Validaciones frontend incluidas

- Nuevo caso: tipo, título, descripción y privacidad obligatorios.
- Subir material: tipo, título, ramo, descripción, origen y autorización obligatorios.
- Editar contenido: título y cuerpo obligatorios.

## Pendiente si se continúa

- Persistir formularios en backend.
- Agregar preview real de archivos.
- Agregar autenticación UCN real.
- Agregar sincronización de calendario real.
- Agregar permisos granulares por acción en cada botón interno CEAL.
