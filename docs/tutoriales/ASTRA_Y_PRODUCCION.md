# Astra y la producción de este tutorial

Investigación del 21 de septiembre de 2026. Este documento explica decisiones de producción, no contenido que deba mostrarse al estudiante.

## Qué aporta Astra

La [ficha oficial de GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra) indica entrada de texto e imagen, salida de texto y herramientas para código y uso de computadora; no entrada/salida nativa de audio o video. Por tanto, la aplicación práctica aquí es planificar, escribir el guion y las acciones, inspeccionar capturas y programar el montaje. El archivo audiovisual lo producen herramientas especializadas.

La [guía oficial de uso de computadora](https://developers.openai.com/api/docs/guides/tools-computer-use) recomienda ejecución de código para Astra, por ejemplo con Playwright, manteniendo el entorno entre acciones. Esto encaja con capturar un recorrido real y continuo del portal. No se agregó una dependencia de la API de Astra al producto ni se afirmó cambiar el modelo configurado del usuario.

La [documentación de generación de video](https://developers.openai.com/api/docs/guides/video-generation) corresponde a Sora e indica su retiro de la API el 24 de septiembre de 2026. No se incorpora como dependencia. Además, una grabación real permite conservar textos y controles exactos del portal.

## Decisiones aplicadas

1. Un recorrido con propósito: bienvenida, Inicio, selección de plan, un ramo concreto, sus guías y una fecha del calendario. Cada cambio de sección tiene un clic visible y una frase que lo introduce.
2. Una sola toma por encuadre. Se recorta únicamente la preparación y el final, sin unir páginas visitadas fuera de cámara.
3. Puntero con trayectoria curva, aceleración/desaceleración y una pausa antes de hacer clic. Desplazamiento suave, sin círculos constantes o movimientos ornamentales. Se registran las trayectorias para revisar continuidad.
4. Voz chilena a ritmo normal y pausas suficientes. Subtítulos debajo de la interfaz, sin tapar controles. Texto alternativo en la bienvenida.
5. Se recupera la música del antiguo tutorial del portal: partitura `make_music`, variación 3, en `scripts/compose-tutorial-videos.py`, anteriormente exportada como `.data/tutorial-production/portal-narrated-music.wav`. Se extiende esa misma composición a la duración nueva. No se usa una pista comercial distinta.
6. Mezcla con normalización de voz, música atenuada durante la narración, entrada/salida suave y control de picos. La reproducción sigue siendo voluntaria.

La separación de pantalla, cursor y audio coincide con el enfoque de [captura multipista de TechSmith](https://www.techsmith.com/camtasia/features/multitrack-screen-recorder/). Para el montaje se utilizan `loudnorm`, `sidechaincompress`, `amix` y `afade`, documentados en [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html). Son criterios informados por herramientas actuales; no una afirmación de superioridad universal ni una prueba con estudiantes.

## Revisión

Comprobar la continuidad de navegación en los dos encuadres, legibilidad del recurso y de la fecha, subtítulos completos, identidad de la composición musical y reproducción del archivo resultante. Las pruebas automatizadas de reproducción usan audio silenciado por una limitación del dispositivo de audio de Chromium headless en Windows; eso no implica que el archivo publicado sea silencioso. La mezcla se inspecciona también mediante niveles de audio y ventanas con/sin narración.
