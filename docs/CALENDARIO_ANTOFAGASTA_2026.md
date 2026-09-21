# Calendario de Antofagasta: revisión del 21 de septiembre de 2026

Fuente: PDF aportado por el usuario, Decreto N°77/2026, fechado el 8 de julio de 2026. Se conserva el original en `assets/documents/calendario-antofagasta-077-2026.pdf` sin modificarlo. SHA-256: `270867a40063856958644acbd6e6271ccabd77de8829cf4d4bbc80ac1a44a3f2`.

La modificación contiene julio de 2026 a enero de 2027; no contiene enero-junio de 2026. El portal no inventa ese tramo. El nombre del archivo incluye “13 Julio”, pero la fecha del decreto visible en la página 1 es 8 de julio.

## Reconciliación

- Páginas 1-2: decreto y portada, no actividades.
- Página 3: julio. Se excluye exclusivamente el 6 de julio, cuya descripción identifica Coquimbo de forma explícita. Las actividades compartidas o sin otra sede indicada se conservan bajo el ámbito Antofagasta de la portada.
- Página 4: agosto. Se mantienen jornadas de inscripción, plazos de reintegro, convalidación y demás actividades de estudiantes y unidades académicas.
- Página 5: septiembre, octubre y noviembre. Incluye el cierre de beneficios del 23 de octubre, antes omitido, y los periodos completos de receso, renuncia de asignaturas y autocuidado.
- Página 6: diciembre y enero. Se conservan el cierre de evaluación docente del 12 de diciembre, los cierres de postulación y los plazos de enero. Todas las entradas de enero incluyen la advertencia de planificación sujeta a modificaciones.
- Página 7: contraportada, no actividades.

Resultado: 104 actividades, 29 periodos inclusivos y 14 actividades provisionales de enero. Filas de una misma fecha se separan cuando representan trámites distintos; clases/evaluaciones pendientes se agrupan en su hito de cierre y las dos jornadas de inscripción del 17 de agosto se explican en una sola actividad.

La vista inicial muestra actividades de estudiantes y generales. “Todas las actividades” añade plazos de las unidades académicas. Esta clasificación editorial no cambia fechas ni elimina filas de la fuente. Cada actividad conserva `sourcePage` y enlaza al PDF en esa página.

## Ambigüedades conservadas

- Julio 13 dice cambio de carrera para el II semestre; agosto 4 identifica el cierre como I semestre. Se muestran como hitos separados y se explicita la denominación del cierre; no se infiere un periodo común.
- Noviembre 6 indica cambio de nombre **legal**, mientras diciembre 30 indica nombre **social**. Se conservan ambos conceptos y fechas.
- El arancel de títulos y grados del 6 de noviembre tiene su propia advertencia de fecha sujeta a modificaciones.
- Las entradas que solo dicen “inicio” se muestran como hitos; no se inventa una fecha de término. Los periodos impresos con dos extremos sí ocupan cada día, incluido el último.

## Mantenimiento y comprobación

`data/calendar-antofagasta-2026.tsv` contiene la transcripción revisada visualmente. `npm run calendar:build` regenera el bloque de calendario de `src/mock-data.js`; `npm run qa:calendar` comprueba extremos inclusivos, fuente, sede, enero provisional, filtros y conservación de actividades CEAL ante una respuesta antigua de la API.

La aplicación sustituye únicamente la versión antigua conocida del calendario al recibirla desde una caché o API. Conserva eventos personalizados con IDs ajenos a `evt-acad-`. La migración del servidor también conserva esos eventos.
