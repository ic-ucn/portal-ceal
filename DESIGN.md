---
version: alpha
name: Portal CEIC UCN
description: Sistema web academico para estudiantes y miembros CEAL de Ingenieria Civil UCN, con informacion, material por ramo, mallas curriculares, casos, calendario, acuerdos y gestion interna.
colors:
  ink: "#061A33"
  navy: "#062A55"
  navyDeep: "#041F3D"
  primary: "#126FE3"
  blue: "#126FE3"
  blueText: "#075ECB"
  blueSoft: "#E8F2FF"
  cyan: "#16B8D6"
  orange: "#F97316"
  warningText: "#9A3412"
  orangeSoft: "#FFF3E7"
  green: "#16A34A"
  successText: "#166534"
  greenSoft: "#DCFCE7"
  red: "#DC2626"
  dangerText: "#991B1B"
  redSoft: "#FEE2E2"
  violet: "#7C3AED"
  violetSoft: "#F1ECFF"
  surface: "#FFFFFF"
  surfaceSoft: "#F6FAFE"
  surfaceMuted: "#EEF4FA"
  border: "#D7E4F2"
  borderStrong: "#BFD0E3"
  text: "#0B2341"
  textMuted: "#52677F"
  textSubtle: "#74869A"
  white: "#FFFFFF"
typography:
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "32px"
    lineHeight: "1.08"
    fontWeight: 850
    letterSpacing: "0px"
  sectionTitle:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "19px"
    lineHeight: "1.2"
    fontWeight: 820
    letterSpacing: "0px"
  cardTitle:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    lineHeight: "1.28"
    fontWeight: 800
    letterSpacing: "0px"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    lineHeight: "1.52"
    fontWeight: 450
    letterSpacing: "0px"
  small:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    lineHeight: "1.42"
    fontWeight: 520
    letterSpacing: "0px"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
    lineHeight: "1.2"
    fontWeight: 800
    letterSpacing: "0px"
rounded:
  xs: "6px"
  sm: "8px"
  md: "8px"
  lg: "10px"
  xl: "12px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  xxl: "36px"
components:
  page:
    backgroundColor: "{colors.surfaceSoft}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
  sidebar:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  header:
    backgroundColor: "{colors.navyDeep}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  cardMuted:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  primaryButton:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.cardTitle}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  secondaryButton:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary}"
    typography: "{typography.cardTitle}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  dangerButton:
    backgroundColor: "{colors.redSoft}"
    textColor: "{colors.dangerText}"
    typography: "{typography.cardTitle}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  chip:
    backgroundColor: "{colors.blueSoft}"
    textColor: "{colors.blueText}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  statusGood:
    backgroundColor: "{colors.greenSoft}"
    textColor: "{colors.successText}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  statusWarning:
    backgroundColor: "{colors.orangeSoft}"
    textColor: "{colors.warningText}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  headingText:
    textColor: "{colors.ink}"
    typography: "{typography.heading}"
  navItem:
    textColor: "{colors.navy}"
    typography: "{typography.cardTitle}"
  linkText:
    textColor: "{colors.blue}"
    typography: "{typography.cardTitle}"
  logoAccent:
    backgroundColor: "{colors.cyan}"
    rounded: "{rounded.xs}"
  attentionIcon:
    textColor: "{colors.orange}"
  successIcon:
    textColor: "{colors.green}"
  dangerIcon:
    textColor: "{colors.red}"
  derivedStatus:
    backgroundColor: "{colors.violetSoft}"
    textColor: "{colors.violet}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  baseSurface:
    backgroundColor: "{colors.surface}"
  separator:
    backgroundColor: "{colors.border}"
  strongSeparator:
    backgroundColor: "{colors.borderStrong}"
  mutedText:
    textColor: "{colors.textMuted}"
    typography: "{typography.small}"
  subtleText:
    textColor: "{colors.textSubtle}"
    typography: "{typography.small}"
---

# Portal CEIC UCN Design System

## Overview

Este archivo define el diseño objetivo para que Stitch genere la version visual final del Portal CEIC / CEAL UCN. No debe interpretarse como una landing page ni como un sitio institucional estatico. El producto debe sentirse como una herramienta real de consulta, seguimiento y gestion academica para estudiantes de Ingenieria Civil UCN, con una capa interna para miembros CEAL.

La idea conceptual central es un "panel academico de carrera": un lugar sobrio, rapido y confiable para revisar lo que importa durante el semestre. El portal debe reducir friccion, ordenar informacion dispersa y permitir que un estudiante entienda en pocos segundos donde revisar material, mallas, fechas, casos, comunicados, acuerdos, ayudantias y tramites.

La identidad visual debe partir del logo CEIC UCN: puente, costa, lineas de tension, circulo institucional, azul marino, azul/celeste y acento naranja. No usar el logo como decoracion repetida dentro de tarjetas. Debe vivir en login, sidebar, mobile header y marca principal. La UI puede tomar del logo la idea de estructura, orden, rutas y soporte, pero sin ilustraciones innecesarias.

El tono visual debe ser premium academico, no startup, no SaaS generico, no dashboard corporativo oscuro, no crypto, no cyber, no hero marketing. Debe sentirse chileno, universitario, funcional y actual. El usuario principal entra desde telefono, posiblemente desde WhatsApp o navegador movil, por lo que mobile no es una version secundaria: es la experiencia principal. Desktop debe servir especialmente para busqueda, revision de mallas, biblioteca academica y gestion interna CEAL.

## Principles

1. Mobile first real. La pantalla de telefono debe ser completa y comoda, no una version apretada del desktop. Las acciones frecuentes deben tener targets grandes, bottom nav claro, scroll sin zonas muertas y ninguna tarjeta escondida debajo de la navegacion.

2. Densidad util, no ruido. El portal maneja muchos modulos; debe mostrar informacion accionable sin parecer saturado. Usar jerarquia, estados, filtros y listados compactos. No llenar la interfaz con textos explicativos largos.

3. Usuario final, no desarrollador. El copy debe hablarle a estudiantes y miembros CEAL. No usar "frontend", "demo local", "mock", "backend", "plataforma inteligente", "solucion", "ecosistema", "todo en uno", "potencia tu experiencia" ni claims de marketing.

4. Transparencia operativa. Fechas, acuerdos, casos y material deben mostrar estados claros: publicado, pendiente, en revision, validado, actualizado, cerrado. La app debe hacer visible que hay seguimiento y responsabilidad, sin prometer resultados.

5. Separacion de roles. La experiencia de estudiante y la gestion CEAL deben compartir identidad visual, pero la gestion interna debe sentirse mas editorial y operativa. No debe parecer consola tecnica.

6. Mallas y material son el nucleo academico. Las mallas Plan O y Plan P y la biblioteca academica deben sentirse como productos serios, no como anexos. Deben estar muy cerca del inicio, de la busqueda global y de los accesos principales.

7. Estados visuales sobrios. El color comunica, no decora. Azul para accion principal y navegacion, naranja para atencion/plazos, verde para validado/completado, rojo solo para error o accion delicada, violeta solo para derivado o categoria secundaria.

8. Bordes y radios controlados. Mantener tarjetas en 8px o cercano a 8px. Evitar pildoras gigantes, blobs, orbes, glassmorphism fuerte y gradientes decorativos. La profundidad debe venir de sombras suaves y separacion clara.

9. Legibilidad antes que dramatismo. Nada de fuentes enormes dentro de tarjetas compactas. Nada de letter-spacing negativo. Textos, botones y chips deben caber en mobile sin cortarse.

10. Navegacion consistente. Desktop usa sidebar + topbar. Mobile usa header compacto + bottom nav. El bottom nav principal debe incluir Inicio, Calendario, Casos, Material y Mas. Mallas, Comunicados, Ayudantias, Tramites y Gestion CEAL viven bajo Mas o accesos contextuales, salvo que el flujo active una ruta secundaria.

## Personality

El portal debe sentirse confiable, directo y universitario. La personalidad es de un CEAL organizado, no de una empresa vendiendo software. Debe tener calidez estudiantil sin perder rigor. La UI debe ayudar a decidir rapido: revisar, buscar, abrir, guardar, reportar, seguir, validar.

La voz del producto debe ser corta y concreta:

- "Revisa avisos, fechas, material y solicitudes activas."
- "Consulta material, mallas, casos, fechas y comunicados."
- "Actualiza contenidos, casos, acuerdos y material validado."
- "Busca ramo, prueba, apunte o guia."
- "Envia un caso y revisa su estado."
- "Explora ramos, prerrequisitos y avance por plan."

Evitar:

- "Experiencia integral."
- "Solucion definitiva."
- "Plataforma inteligente."
- "Demo frontend local."
- "Roles, datos y sesion se guardan..."
- "Centraliza todo en un solo lugar."
- "Potencia tu aprendizaje."

## Accessibility

El contraste debe cumplir una lectura comoda en mobile bajo luz exterior. Usar texto principal en azul muy oscuro sobre superficies claras. Botones primarios en azul intenso con texto blanco. No depender solo del color para estados: usar texto de estado, icono y posicion.

Todos los controles deben tener objetivos tactiles amplios. En mobile, botones y tarjetas accionables deben medir al menos 44px de alto. Los chips pueden scrollear horizontalmente, pero deben tener suficiente espacio y no quedar cortados por el borde de pantalla.

La navegacion debe ser reconocible por icono y texto. No usar iconos sin etiqueta salvo acciones universales como notificaciones, busqueda o perfil. Las pantallas deben soportar zoom del sistema y textos algo mas grandes sin desbordarse.

La app debe evitar zonas muertas al final del scroll. El bottom nav no debe cubrir contenido. Si el navegador movil agrega barras propias, la UI debe seguir legible y no depender de una altura exacta del viewport.

## Interface Components

### Login

El login debe ser sobrio y directo. Debe mostrar marca CEIC UCN, titulo Portal CEIC / CEAL UCN, una frase de proposito y dos tarjetas de entrada. Las tarjetas son las acciones principales; no duplicar con botones debajo.

Estructura deseada:

- izquierda o bloque superior: logo horizontal, titulo, descripcion corta.
- derecha o bloque inferior: "Acceso", "Entrar al portal", "Selecciona una opcion para continuar."
- tarjeta Estudiante: consulta material, mallas, casos, fechas y comunicados.
- tarjeta Miembro CEAL: actualiza contenidos, casos, acuerdos y material validado.

No incluir texto tecnico sobre demo, localStorage, frontend, backend o sesion demo.

### App Shell Desktop

Desktop debe tener sidebar fijo, topbar superior y area de contenido amplia. La sidebar debe ser clara, con logo y navegacion vertical:

- Inicio
- Comunicados
- Calendario y acuerdos
- Casos
- Material
- Mallas
- Ayudantias y tramites
- Gestion CEAL, solo si el rol es miembro CEAL

La topbar debe incluir busqueda global, notificaciones y cuenta. El contenido debe tener max-width amplio y respirar, pero sin parecer landing. La sidebar no debe estirar items verticalmente; la navegacion debe quedar agrupada arriba y el perfil abajo.

### App Shell Mobile

Mobile debe tener header compacto con logo, nombre corto, notificaciones y perfil. El bottom nav debe ser flotante o fijo, con cinco items:

- Inicio
- Calendario
- Casos
- Material
- Mas

La franja entre contenido y bottom nav debe ser minima. El contenido debe poder scrollear sin quedar cubierto por el nav. La barra inferior debe verse fuerte, azul marino, compacta y consistente. El item activo puede usar un rectangulo interno sutil, no un bloque excesivamente grande.

### Cards

Las cards son herramientas, no decoracion. Usar cards para modulos, recursos, casos, acuerdos, fechas, acciones frecuentes, material y gestion. No anidar cards dentro de cards salvo que sea una lista o modal con necesidad funcional.

Card base:

- fondo blanco
- borde azul/gris suave
- radio 8px
- sombra muy ligera
- padding 14-20px segun contexto
- titulo compacto, texto breve, accion clara

Las cards de mobile deben ocupar el ancho disponible y no requerir columnas forzadas. En desktop se permiten grids densos, especialmente en material, casos y gestion.

### Buttons

Boton primario azul para acciones principales:

- Ver malla
- Subir material
- Nuevo caso
- Descargar
- Validar y publicar

Boton secundario blanco con borde azul para acciones complementarias:

- Buscar material
- Guardar
- Volver
- Ver ramo

Boton peligro rojo solo para:

- Reportar error
- Cerrar caso
- Marcar con observaciones

No usar texto largo dentro de botones. Si el boton no cabe en mobile, usar dos lineas o reducir copy, nunca cortar texto.

### Chips And Status

Los chips deben servir para filtrar o indicar estado. No deben parecer decoracion.

Estados recomendados:

- Validado CEAL: verde
- Aporte estudiantil: azul suave
- Pendiente: gris/azul suave
- En revision: azul
- En seguimiento: naranja
- Resuelto/Publicado: verde
- Derivado: violeta
- Reportado/Error: rojo

Los filtros de Material deben ser chips horizontales:

- Todos
- Guia
- Prueba
- Apunte
- PPT
- PDF
- Resumen
- Ejercicios

Los filtros por ramo deben permitir chips o dropdown segun densidad.

### Search

La busqueda global debe estar visible en desktop. En mobile, la busqueda puede aparecer dentro de cada modulo o como pantalla dedicada. El placeholder debe ser especifico:

- "Buscar en el portal..."
- "Buscar ramo, prueba, apunte o guia"
- "Buscar ramo, codigo o semestre"
- "Buscar comunicados..."

No usar buscadores decorativos. La busqueda debe conectar visualmente con resultados, filtros y estados.

## Layout

### Home

Inicio debe funcionar como dashboard academico, no como portada. Debe responder a "que reviso ahora". Secciones:

1. Resumen de hoy
   - comunicados nuevos
   - fechas proximas
   - casos abiertos
   - recursos visibles

2. Tu malla
   - Plan O o Plan P
   - progreso simple
   - CTA Ver malla
   - CTA Buscar material

3. Acciones frecuentes
   - Buscar material
   - Revisar malla
   - Reportar un caso
   - Ver calendario

4. Novedades recientes
   - comunicados, material nuevo, acuerdos, fechas

5. Proximas fechas
   - agenda breve con fecha, titulo y hora

6. Modulos principales
   - Biblioteca academica
   - Mallas interactivas
   - Casos y seguimiento
   - Calendario y acuerdos

En mobile, mostrar primero Resumen, luego Tu malla, luego Acciones frecuentes. Novedades y fechas pueden aparecer mas abajo. No usar hero con imagen grande.

### Biblioteca Academica / Material

Este modulo es clave. Debe sentirse como una biblioteca academica autosuficiente para estudiar por ramo. No aludir a contingencia ni paro.

Funciones visuales:

- Busqueda grande: "Buscar ramo, prueba, apunte o guia"
- Filtros por tipo: Guia, Prueba, Apunte, PPT, PDF, Resumen, Ejercicios
- Filtros por ramo, semestre, plan y ano
- Lista de recursos
- Detalle de recurso
- Acciones: Guardar, Descargar, Reportar error, Ver ramo
- Subir material para revision CEAL

Cada recurso debe mostrar:

- titulo
- ramo
- codigo de ramo
- semestre
- ano
- formato
- peso
- origen: Validado CEAL o Aporte estudiantil
- estado de revision

En desktop, usar una vista de tres zonas: filtros/lista/detalle. En mobile, usar buscador + chips + lista de cards y abrir detalle en pantalla aparte o panel inferior. No inventar metricas como "11.2k descargas historicas" si no existen.

### Mallas Interactivas

Las mallas deben incluir Plan O Catalogo 2016 y Plan P Catalogo 2025. Deben sentirse como herramienta curricular real.

Funciones visuales:

- selector Plan O / Plan P
- busqueda por ramo, codigo o semestre
- filtros por area y estado
- semestres horizontales en mobile
- grilla por semestre en desktop
- detalle del ramo seleccionado
- prerequisitos
- ramos que abre
- recursos asociados
- accion Ver material
- accion Agregar a seguimiento

Estados del ramo:

- aprobado: verde
- en curso: azul
- pendiente: gris
- seleccionado: naranja
- prerequisito: azul
- sucesor: naranja suave

Mobile no debe intentar dibujar toda la malla como desktop. Debe mostrar selector de semestre, lista de ramos y panel de detalle del ramo seleccionado.

### Casos Y Seguimiento

Modulo para que estudiantes envien solicitudes o problemas y revisen estado. No prometer solucion inmediata.

Funciones visuales:

- Nuevo caso
- filtros por tipo, estado, prioridad, fecha
- tabs: Mis casos, En revision, Resueltos, Derivados
- lista de casos
- detalle con timeline
- resumen
- categoria
- estado
- fecha de creacion
- responsable
- proximos pasos
- archivos adjuntos
- historial de actualizaciones

Estados:

- recibido
- en revision
- en seguimiento
- resuelto
- cerrado
- derivado

El usuario debe entender que el portal ordena el seguimiento y la comunicacion, no garantiza resultado.

### Calendario Y Acuerdos

Debe unir fechas, decisiones y seguimiento. Debe ser util para transparencia y continuidad.

Funciones visuales:

- calendario mensual en desktop
- agenda semanal/lista en mobile
- proximos en agenda
- acuerdos recientes
- detalle de acuerdo seleccionado
- seguimiento de compromisos
- documentos asociados

Cada acuerdo debe mostrar:

- titulo
- origen
- fecha
- estado
- que se acordo
- estado actual
- proximo paso
- area responsable
- documentos relacionados

Evitar lenguaje politico grandilocuente. Usar tono administrativo claro.

### Comunicados

Modulo para avisos, respuestas frecuentes y comunicados por categoria.

Categorias:

- Academico
- Actividades
- Ayudantias
- Material
- Tramites
- Carrera
- CEAL

Debe incluir:

- busqueda
- filtros
- comunicado destacado
- comunicados recientes
- comunicado seleccionado
- preguntas frecuentes relacionadas

El copy debe ser breve. Los comunicados deben tener fecha, fuente y categoria.

### Ayudantias Y Tramites

Debe agrupar apoyo academico, formularios y gestiones.

Secciones:

- proxima ayudantia
- lista de ayudantias por ramo
- tramites destacados
- formularios abiertos
- apoyo academico
- enlaces utiles

Cada ayudantia debe mostrar ramo, fecha, horario, modalidad/sala, ayudante y link a material. Cada tramite debe mostrar vencimiento, estado, documentos requeridos y responsable.

### Gestion CEAL

Vista interna para miembros CEAL. No es panel tecnico ni CMS de desarrollador. Debe sentirse como mesa de trabajo editorial y operativa.

Modulos:

- publicar comunicado
- editar calendario
- subir acuerdo
- revisar casos
- validar material
- actualizar mallas
- gestionar formularios
- miembros y permisos

Debe mostrar:

- pendientes
- cambios recientes
- estados de contenidos
- roles del equipo CEAL
- acciones rapidas

Roles:

- Presidencia
- Secretaria
- Comunicaciones
- Docencia
- Bienestar
- Apoyo academico

Estados internos:

- Borrador
- En revision
- Pendiente
- Publicado
- Archivado

No usar lenguaje como API, endpoint, base de datos, deploy, logs o backend.

## Motion

La animacion debe ser sutil y funcional. Usar transiciones cortas para hover, focus, apertura de detalle, cambios de tab y seleccion de ramo. No usar animaciones decorativas permanentes.

Duraciones recomendadas:

- hover/focus: 120-180ms
- apertura de panel o detalle: 180-240ms
- toast: entrada rapida, salida suave

Evitar:

- bouncing
- parallax
- loaders largos
- elementos flotantes decorativos
- animacion excesiva de iconos

## Implementation Notes

El diseno final debe poder implementarse como frontend estatico o como app conectada a backend futuro. No debe depender de assets externos salvo logos propios e iconos. Usar componentes modulares que puedan mapearse a HTML/CSS/JS o React en una siguiente etapa.

La app actual tiene rutas y modulos funcionales:

- `#/login`
- `#/`
- `#/comunicados`
- `#/calendario`
- `#/casos`
- `#/casos/nuevo`
- `#/material`
- `#/material/subir`
- `#/mallas`
- `#/ramo/:plan/:codigo`
- `#/apoyo`
- `#/gestion`

Stitch debe priorizar el rediseno visual completo de estas pantallas, no inventar una arquitectura distinta sin necesidad. Si se genera codigo, mantener el producto como SPA responsive con rutas hash o equivalente.

Reglas de no invencion:

- No inventar cifras de descargas.
- No inventar respaldo oficial de UCN si no esta declarado.
- No prometer resolucion de casos.
- No prometer que material estudiantil es oficial.
- No mezclar material validado CEAL con aporte estudiantil sin etiqueta.
- No crear secciones vacias o "proximamente".

Reglas de contenido:

- Material = biblioteca academica permanente.
- Mallas = Plan O Catalogo 2016 y Plan P Catalogo 2025.
- Calendario y acuerdos = continuidad, fechas, decisiones y compromisos.
- Casos = seguimiento y orden, no garantia de solucion.
- Gestion CEAL = operacion interna, no panel tecnico.

El resultado esperado es una UI de producto educativo 2026, sobria y de alta confianza, con densidad util, mobile muy cuidado, desktop eficiente y una identidad clara de Ingenieria Civil UCN.
