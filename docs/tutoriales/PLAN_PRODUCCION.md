# Plan de producción de tutoriales

## Entregables

| Audiencia | Video | Material de apoyo | Distribución |
| --- | --- | --- | --- |
| Estudiantes | Cómo solicitar una hora de atención | Pasos breves bajo el reproductor | `https://ceicucn.cl/tutoriales/` |
| Jefatura de carrera | Configuración de Calendar y gestión de la agenda | Web separada con video narrado y pasos breves | Enlace directo administrado por Kevin |

El tutorial estudiantil no incluye pantallas internas. La guía de Jefatura usa una URL separada con `noindex`; Kevin administra su distribución. Web, PDF y videos se revisan localmente antes de publicar o subir a Drive.

## Criterio audiovisual

- Captura de la interfaz real, no una recreación generativa de la pantalla.
- Duración objetivo: 40 a 60 segundos para estudiantes y hasta 150 segundos para Jefatura.
- Una acción principal por escena, con pausas breves antes y después de cada clic.
- Indicaciones compactas ubicadas lejos del control señalado y subtítulos WebVTT opcionales.
- Resolución 1920 × 1080, 30 fps y H.264 Main con fotogramas clave frecuentes. Ambos videos usan una sola voz femenina chilena y música discreta.
- Sin frases promocionales. Los textos indicarán acción, resultado y siguiente paso.
- Puntero visible, foco de teclado perceptible y ampliaciones solo cuando mejoren lectura.
- Datos ficticios: `Estudiante UCN`; nunca RUT, PPA, tokens, claves ni correos personales.

## Fundamento

- W3C recomienda subtítulos, transcripción y descripción de la información visual relevante: <https://www.w3.org/WAI/media/av/>.
- TechSmith recomienda ajustar la duración a la tarea y eliminar contenido que no contribuya al objetivo: <https://www.techsmith.com/blog/video-length/>.
- Wistia observa que la retención depende más de la claridad y del propósito que de extender artificialmente el video: <https://wistia.com/blog/optimal-video-length>.
- Loom recomienda grabaciones de pantalla estructuradas, con guion breve y edición centrada en el flujo: <https://www.loom.com/blog/how-to-do-a-screen-recording>.

La decisión de usar capturas reales es una inferencia de producción: un generador de video puede alterar textos, estados o controles, lo que reduce la confiabilidad de un tutorial operativo. La IA se usa para guion, ritmo, indicaciones, revisión y montaje.

## Gate previo a grabación

- Producción responde correctamente en `ceicucn.cl` y en la API de Render.
- Supabase persiste las horas entre sesiones.
- El correo final de Jefatura es `jc.icivil.afta@ucn.cl`.
- Google Calendar debe mostrar la cuenta correcta como conectada y verificada.
- Estudiante puede reservar y cancelar su hora.
- Una reserva controlada crea un evento en el Calendar de Jefatura.
- Jefatura puede cancelar una hora tomada; ese bloque queda cerrado hasta que Jefatura lo reabra manualmente.
- Una cancelación iniciada por el estudiante libera el bloque para una nueva reserva.
- Una cancelación de Jefatura envía al estudiante un correo con acceso para reagendar.
- La cancelación controlada elimina el evento sincronizado.
- Kevin recibe el aviso técnico de conexión en `kevin.cortes@alumnos.ucn.cl`.
- Los tres roles pasan QA en claro/oscuro y escritorio/móvil.
- No quedan Encuestas, Reservas ni avance inferido de malla.
- Los archivos finales no contienen metadatos personales.

Los tutoriales documentan únicamente funciones verificadas y disponibles.
