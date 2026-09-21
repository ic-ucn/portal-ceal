# Tutorial público del portal

Revisión del 21 de septiembre de 2026. Un solo recorrido de aproximadamente 1 min 50 s, con encuadres de escritorio y teléfono, explica el portal público. Sustituye el video de 50 s, cuyos cambios de página no mostraban cómo navegar.

## Experiencia

- `ceicucn.cl` abre una bienvenida centrada únicamente en el tutorial. «Saltar tutorial» e «Ir al portal» llevan a Inicio. «No volver a mostrar» guarda una preferencia en este navegador y omite la bienvenida en futuras entradas a la raíz; `#/bienvenida` y Guía del portal siguen disponibles.
- La bienvenida no incluye accesos a secciones. El recorrido sigue Inicio → Calendario → Mallas → Material → Inicio, en el orden del menú. Se explica abrir cualquier ramo, sin nombrar una asignatura como instrucción.
- El tutorial está integrado en la bienvenida y también se abre desde Guía del portal. Los enlaces profundos mantienen su destino.
- Reproducción voluntaria: no descargar el MP4 ni iniciar audio antes del clic. Cartel, controles, texto alternativo y pista VTT opcional. En móvil, video 480×700 sin franja de texto integrada, a todo el ancho disponible; los subtítulos se activan sobre el video. Escritorio conserva subtítulos integrados debajo de la captura.
- El tema o una actualización de datos no deben reemplazar el reproductor en curso. Al abandonar la página se detiene; un diálogo se pausa al cerrarse y devuelve foco y desplazamiento.

## Producción reproducible

1. `npm run tutorial:audio`: voz `es-CL-CatalinaNeural` a ritmo normal, a partir de `scripts/portal-tutorial-story.json`. Los tiempos reservan navegación y pausas. Solo para sintetizar voz se reemplaza «portal» por «portál» y «tutorial» por «tutoriál»; subtítulos y pantalla mantienen «portal».
2. Servir el proyecto con estado aislado en el puerto 18084 o especificar `TUTORIAL_URL`. El guion muestra septiembre/octubre de 2026; revisar ese contexto si se vuelve a grabar en otro mes.
3. `npm run tutorial:capture`: prepara los planes fuera de la toma y graba una sola navegación continua por encuadre. Curvas de mouse con aceleración/desaceleración, pausa antes del clic y scroll suave. El manifest conserva los movimientos y tiempos reales. `TUTORIAL_FORMAT=mobile` permite repetir un encuadre.
4. `npm run tutorial:compose`: monta la toma completa con subtítulos y música, sin pegar visitas hechas fuera de cámara. H.264 a 30 fps, AAC estéreo, faststart. Usa FFmpeg 7.1 disponible en `.data/media-tools/imageio_ffmpeg/binaries`; se puede instalar `imageio-ffmpeg==0.6.0` en ese directorio aislado. No alterar el Python global.
5. Revisar los cambios de sección, el movimiento del puntero, legibilidad, mezcla y reproducción. Ejecutar `qa:welcome`, `qa:calendar`, controles generales y revisión productiva.

La música es la misma composición del antiguo tutorial del portal, variación 3 de `make_music` en `scripts/compose-tutorial-videos.py`, antes exportada como `.data/tutorial-production/portal-narrated-music.wav`. Se extiende la duración de la partitura sin reiniciar una pista con fundido a mitad del video. La mezcla normaliza la voz y atenúa la música durante la narración.

Salidas en `assets/tutorial/`: `portal-guia-desktop.mp4`, `portal-guia-mobile.mp4`, carteles JPEG y VTT por encuadre. Capturas, voz, música y manifests intermedios permanecen en `.data/portal-guide-v4/`, fuera de Git. Los tutoriales históricos de atención/gestión no se reactivan ni se publican con esta entrega.

## Fuentes y límites

Investigación sobre Astra, herramientas y edición en [ASTRA_Y_PRODUCCION.md](ASTRA_Y_PRODUCCION.md). Se mantienen los criterios de [NN/g](https://www.nngroup.com/articles/onboarding-tutorials/), [diálogos W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [medios accesibles W3C](https://www.w3.org/WAI/media/av/) y [rendimiento de video](https://web.dev/learn/performance/video-performance). No constituyen certificación de accesibilidad ni prueba de usabilidad con estudiantes.


## Revisión de Material

Buscar «estructural» por tema y abrir Análisis Estructural Kassimall. Esperar imágenes del documento con ancho natural mayor a 500 px en el iframe real, conservar captura de evidencia, desplazar dentro del visor y bajar al botón Abrir material. Los tiempos de captura se amplían si una acción o carga lo exige; nunca avanzar por un temporizador sobre una vista previa vacía. El montaje alinea narración con tiempos reales. Mallas ya no muestra Original.
