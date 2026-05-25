# Auditoria funcional del Portal CEIC / CEAL UCN

Fecha de verificacion: 24 de mayo de 2026

## Resultado

Estado: aprobado para publicacion del frontend y uso local con backend Node.

La auditoria automatizada recorrio desktop, mobile y Gestion CEAL; probo flujos principales, permisos, acciones internas, carga/descarga local de material, mallas y rutas.

## Verificacion ejecutada

```powershell
npm run check
npm run quality
node scripts\qa-portal.mjs
```

Resultados actuales:

- `npm run check`: OK.
- `npm run quality`: 2429 assertions, 0 failures.
- `node scripts\qa-portal.mjs`: 43 rutas, 9 flujos, 0 failures.

## Rutas cubiertas

- Inicio.
- Comunicados.
- Detalle de comunicado.
- Calendario y acuerdos.
- Detalle de acuerdo.
- Casos y seguimiento.
- Nuevo caso.
- Detalle de caso.
- Biblioteca academica / Material.
- Subir material.
- Detalle de recurso.
- Mallas interactivas.
- Detalle de ramo.
- Ayudantias y tramites.
- Detalle de ayudantia.
- Detalle de tramite.
- Perfil.
- Mas.
- Gestion CEAL.
- Nuevo acuerdo.
- Gestion de caso.
- Validacion de material.
- Editor de comunicado.

## Flujos cubiertos

- Login como estudiante.
- Login CEAL con creacion de contrasena en primer ingreso.
- Busqueda y filtro de material.
- Seleccion y cierre de detalle en mallas.
- Creacion de caso por estudiante.
- Subida de material con archivo real local.
- Descarga de material.
- Detalle de ramo hacia material filtrado.
- Respuesta CEAL a caso.
- Creacion de acuerdo.
- Validacion de material CEAL.
- Edicion y publicacion de comunicado.

## Evidencia

- `scripts/qa-portal.mjs`
- `scripts/quality-suite.mjs`
- `qa-report.json` generado localmente e ignorado por git.
- `qa-screenshots/` generado localmente e ignorado por git.
