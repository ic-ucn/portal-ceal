# Auditoría funcional del Portal CEIC / CEAL UCN

Fecha de verificación: 10 de mayo de 2026

## Resultado

Estado: aprobado para demo frontend avanzada.

La auditoría automatizada recorrió desktop y mobile, probó flujos principales, verificó permisos CEAL, revisó errores de consola y generó capturas.

## Verificación ejecutada

Comando:

```powershell
$env:NODE_PATH='C:\Users\kevin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
& 'C:\Users\kevin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\qa-portal.mjs
```

Resultado:

- 36 rutas verificadas: desktop y mobile.
- 13 flujos interactivos verificados.
- 14 capturas generadas.
- 0 errores de consola.
- 0 overflow horizontal móvil detectado.

## Rutas cubiertas

- Inicio.
- Comunicados.
- Detalle de comunicado.
- Calendario y acuerdos.
- Detalle de acuerdo.
- Casos y seguimiento.
- Nuevo caso.
- Detalle de caso.
- Biblioteca académica / Material.
- Subir material.
- Detalle de recurso.
- Mallas interactivas.
- Detalle de ramo.
- Ayudantías y trámites.
- Detalle de ayudantía.
- Detalle de trámite.
- Perfil.
- Más.
- Gestión CEAL.

## Flujos cubiertos

- Login como estudiante.
- Login como miembro CEAL.
- Búsqueda global.
- Filtro y búsqueda de comunicados.
- Filtro, selección, guardado y descarga demo de material.
- Guardado de ramo en seguimiento.
- Cambio de plan y semestre en malla móvil.
- Filtros y pestañas de casos.
- Creación de caso con validación.
- Subida de material con validación.
- Restricción de Gestión CEAL para estudiante.
- Editor interno CEAL.
- Validación interna de material CEAL.

## Evidencia

Reporte JSON:

`qa-report.json`

Capturas:

`qa-screenshots/`

Script de auditoría:

`scripts/qa-portal.mjs`
