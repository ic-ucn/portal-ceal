# Tutorial público del portal

Revisión 2026-09-14. Un solo tutorial explica Inicio, Mallas, Material y Calendario. Los guiones y grabaciones anteriores de atención/gestión son históricos y no forman parte de la bienvenida ni se publican con esta entrega.

## Experiencia

- Bienvenida inicial con video voluntario y cartel de la interfaz real. No descargar el MP4 ni iniciar audio antes de pulsar reproducir.
- Saltar, cerrar con Escape o entrar al portal sin completar el video; recordar la elección en ese navegador.
- Reabrir la misma guía desde la barra lateral, la cabecera de Mallas o Más en móvil. El enlace `/?guia=1` permite volver a verla.
- Una frase por sección y enlaces directos; alternativa textual descriptiva disponible aunque el video falle.
- Diálogo nativo fuera de los repintados de la aplicación. Mantener foco, ruta profunda, desplazamiento y reproducción al actualizar contenido; pausar al cerrar.

## Producción reproducible

1. `npm run tutorial:audio`: genera voz chilena y WebVTT a partir del guion. Cache por texto y voz en `.data/portal-guide/`.
2. Servir el proyecto con estado aislado y `TUTORIAL_URL` apuntando a ese servidor.
3. `npm run tutorial:capture`: graba interacciones públicas en escritorio y móvil, sin cuentas ni escrituras. No ejecutar el productor histórico de atención.
4. `npm run tutorial:compose`: monta H.264/AAC con faststart, subtítulos integrados debajo de la captura y poster; descarta tiempos de carga entre escenas.
5. Revisar fotogramas y narración; verificar duración, legibilidad y ausencia de información personal. Ejecutar QA de bienvenida y las comprobaciones del portal.

Salidas: `assets/tutorial/portal-guia-desktop.mp4`, `portal-guia-mobile.mp4`, carteles JPEG y `portal-guia.vtt`. El móvil recibe un encuadre vertical del mismo contenido. Los subtítulos están integrados; la pista adicional es opcional para evitar mostrarlos dos veces.

## Criterios consultados

- [NN/g: tutoriales y ayuda contextual](https://www.nngroup.com/articles/onboarding-tutorials/): interrupción mínima, posibilidad de saltar y volver a consultar.
- [W3C: diálogo modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): foco contenido, Escape y retorno al elemento de origen.
- [W3C: medios accesibles](https://www.w3.org/WAI/media/av/): subtítulos y alternativa descriptiva de la información audiovisual.
- [web.dev: rendimiento de video](https://web.dev/learn/performance/video-performance): cartel y carga diferida para evitar consumo innecesario.

Es una decisión de diseño informada por estas fuentes, no una prueba de usabilidad con estudiantes ni una certificación de accesibilidad.
