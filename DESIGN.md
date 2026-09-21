# Portal CEIC UCN · interfaz

Vigente desde el 14 de septiembre de 2026.

El portal ayuda a consultar fechas, explorar los planes de estudio y encontrar material por ramo. La interfaz debe facilitar esas tareas con pocas palabras y una jerarquía clara. No incluye atribuciones personales, firmas ni referencias a un portafolio.

## Tipografía y color

Instrument Sans variable, alojada en assets/fonts/, sustituye las familias anteriores en títulos y controles. Pesos 400–700; títulos principales 550, texto habitual 400–500. Evitar mayúsculas sostenidas salvo códigos, formatos y etiquetas breves.

| Uso | Claro | Oscuro |
| --- | --- | --- |
| Fondo | #f8f9f7 | #172126 |
| Superficie | #ffffff | #1d2a30 |
| Texto | #202f35 | #edf2ef |
| Texto secundario | #526168 | #b8c7c8 |
| Acento | #23616a | #a4d2cf |
| Separador | #dfe5e1 | #33464b |

El acento identifica acciones y selección. Los colores de las áreas curriculares tienen significado propio. Evitar gradientes decorativos, sombras en cada fila, cápsulas para todo el contenido y tarjetas anidadas sin una función clara.

## Composición

- **Inicio:** fechas próximas y accesos a Mallas y Material. La ilustración del campus acompaña el contenido en escritorio; se omite en móvil.
- **Calendario:** mes visual, agenda y próximas fechas. Las tarjetas abren un detalle sobre la misma posición. Fuente y acuerdos quedan disponibles sin competir con el calendario.
- **Material:** búsqueda y filtros al inicio; tabla en escritorio y filas en móvil. No seleccionar un recurso automáticamente. Mostrar el estado excepcional en la lista y el estado completo en el detalle.
- **Mallas:** Plan O 2016 y Plan P 2025; cierre siempre visible, colores por área y tema coordinado. Abrir el menú o cambiar el tema conserva el semestre y el contenido del iframe.
- **Perfil y Gestión:** solo información y acciones correspondientes al rol. Gestión permanece protegida por CEAL.

Las rutas públicas son útiles como invitado. Los módulos retirados no vuelven a la navegación por una revisión visual.

## Interacción y accesibilidad

- Enlaces para cambiar de destino; botones para abrir paneles o cambiar el estado actual.
- Una nueva página comienza arriba. Un cambio dentro de la página conserva desplazamiento y foco. Volver a una colección recupera filtros y posición.
- Los avisos no reconstruyen la página ni borran un formulario. No usar temporizadores que fuerzan el desplazamiento al inicio.
- Los diálogos aíslan el fondo, contienen el foco y admiten Escape. Al cerrar, el foco vuelve al control exacto que los abrió.
- Navegación móvil de cinco acciones: Inicio, Calendario, Mallas, Material y Más. Ninguna etiqueta recortada, área táctil mínima 44 px y espacio inferior para no tapar el contenido.
- Foco visible, enlace para saltar al contenido, modo claro/oscuro y movimiento reducido. Animar solo transiciones breves que ayuden a entender una acción.

## Implementación y comprobación

src/styles.css conserva las reglas estructurales; src/portal-ui.css define la revisión visual vigente. Los cambios deben mantener ambas capas coherentes y comprobar la cascada en ambos temas. La fuente del iframe se entrega como datos binarios desde el documento padre, conservando el aislamiento del iframe.

Antes de publicar: npm run check, npm run quality, npm run qa:portal, npm run qa:interactions y npm run qa:public. Revisar capturas reales, no solo ausencia de errores. Versionar las URLs de los assets y comprobar el dominio publicado.

## Criterios consultados

- [W3C: foco no oculto](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum): conservar acceso y visibilidad al usar controles, paneles y navegación fija.
- [Nielsen Norman Group: minimizar carga cognitiva](https://www.nngroup.com/articles/minimize-cognitive-load/): reducir información y decisiones que no ayudan a completar la tarea.
- [Nielsen Norman Group: características del minimalismo](https://www.nngroup.com/articles/characteristics-minimalism/): simplificar sin esconder funciones necesarias.
- [Instrument Sans](https://github.com/Instrument/instrument-sans): familia de interfaz distribuida bajo SIL Open Font License; licencia incluida con los archivos.

Estos criterios orientan la revisión; no equivalen a una certificación de accesibilidad ni sustituyen pruebas con estudiantes.


## Bienvenida y guía pública

Desde 2026-09-14, el portal no ofrece inicio de sesión en su interfaz pública. Una única guía audiovisual breve presenta las secciones al llegar por primera vez. Reproducción voluntaria, sin descarga inicial del video, con Saltar y Entrar al portal siempre disponibles; recuerdo por navegador y acceso posterior desde Guía del portal. No reiniciar el recorrido al publicar cambios menores.

La captura es real, con encuadres de escritorio y teléfono, voz y subtítulos integrados. La alternativa de lectura y los enlaces por sección permiten avanzar sin ver el video. El diálogo está fuera de #app para que la carga de datos no interrumpa la reproducción ni mueva el foco.

La elección de un recorrido corto y recuperable sigue [NN/g](https://www.nngroup.com/articles/onboarding-tutorials/); el foco y cierre siguen [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Subtítulos/lectura según [W3C Media](https://www.w3.org/WAI/media/av/), y cartel/carga bajo demanda según [web.dev](https://web.dev/learn/performance/video-performance). Los guiones anteriores de módulos retirados no forman parte del producto actual.


## Recibimiento permanente y tutorial continuo (2026-09-21)

La entrada publica en / o #/ siempre presenta una pagina de recibimiento. Sustituye la bienvenida inicial omisible descrita en la revision anterior. Composicion editorial sobria: tres enlaces principales, video integrado y acceso a Inicio en #/inicio. Los enlaces profundos conservan su destino; el logo devuelve al recibimiento. Sin dependencia de localStorage para decidir si mostrarlo.

Video de aproximadamente 1 min 32 s, con cada clic de navegacion visible, puntero curvo y scroll suave. Misma musica del tutorial antiguo del portal, atenuada durante la narracion. Reproduccion voluntaria, texto alternativo y subtitulos por encuadre. Implementacion y fuentes en docs/tutoriales/ASTRA_Y_PRODUCCION.md.

Calendario exclusivo de Antofagasta, revisado contra el documento aportado. Periodos inclusivos, fuente por pagina, enero provisional y filtro que separa actividades para estudiantes de plazos de las unidades academicas. Reconciliacion en docs/CALENDARIO_ANTOFAGASTA_2026.md.
