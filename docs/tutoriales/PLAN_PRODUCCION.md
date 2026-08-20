# Plan de producción de tutoriales

## Entregables

| Audiencia | Video | PDF | Distribución |
| --- | --- | --- | --- |
| Estudiantes | Cómo solicitar una hora de atención | Guía breve con capturas y enlace al video | `https://ceicucn.cl/tutoriales/` |
| Jefatura de carrera | Cómo administrar solicitudes, disponibilidad y Google Calendar | Guía privada con enlace al video | Carpeta privada de Google Drive |

El tutorial público no incluirá datos personales ni pantallas internas de CEAL o Jefatura. El paquete de Jefatura no se publicará en el portal.

## Criterio audiovisual

- Captura de la interfaz real, no una recreación generativa de la pantalla.
- Duración objetivo: 90 a 150 segundos para estudiantes y 150 a 240 segundos para Jefatura.
- Una acción principal por escena, con pausas breves antes y después de cada clic.
- Narración chilena neutra, subtítulos sincronizados y transcripción descargable.
- Resolución 1920 × 1080, 30 fps, H.264/AAC y versión WebVTT.
- Sin música durante instrucciones críticas. Si se usa música, será instrumental y al menos 18 dB bajo la voz.
- Sin frases promocionales. Los textos indicarán acción, resultado y siguiente paso.
- Puntero visible, foco de teclado perceptible y ampliaciones solo cuando mejoren lectura.
- Datos ficticios: `Estudiante UCN`; nunca RUT, PPA, tokens, claves ni correos personales.

## Fundamento

- W3C recomienda subtítulos, transcripción y descripción de la información visual relevante: <https://www.w3.org/WAI/media/av/>.
- TechSmith recomienda ajustar la duración a la tarea y eliminar contenido que no contribuya al objetivo: <https://www.techsmith.com/blog/video-length/>.
- Wistia observa que la retención depende más de la claridad y del propósito que de extender artificialmente el video: <https://wistia.com/blog/optimal-video-length>.
- Loom recomienda grabaciones de pantalla estructuradas, con guion breve y edición centrada en el flujo: <https://www.loom.com/blog/how-to-do-a-screen-recording>.

La decisión de usar capturas reales es una inferencia de producción: un generador de video puede alterar textos, estados o controles, lo que reduce la confiabilidad de un tutorial operativo. La IA se usará para guion, voz, subtítulos, limpieza y montaje.

## Gate previo a grabación

- Producción responde correctamente en `ceicucn.cl` y en la API de Render.
- Supabase persiste solicitudes entre sesiones.
- El correo final de Jefatura es `jc.icivil.afta@ucn.cl`.
- Google Calendar muestra el consentimiento real y queda conectado con esa misma cuenta.
- Estudiante puede solicitar y cancelar su hora.
- Jefatura puede confirmar, rechazar, cancelar, cerrar y reabrir cupos.
- Los tres roles pasan QA en claro/oscuro y escritorio/móvil.
- No quedan Encuestas, Reservas ni avance inferido de malla.
- Los archivos finales no contienen metadatos personales.

No se inicia la grabación definitiva hasta completar este gate.
