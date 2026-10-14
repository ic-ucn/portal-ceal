# Tutorial de estudio: compositor reproducible

## Video vigente de novedades — 2026-10-13

Montaje de la versión personal en `codex/novedades-personal`, sin publicar.
La web pública usa la versión anterior a Mis ramos. La revisión elimina de
audio, subtítulos y pantalla la indicación de confirmar la oferta. Conserva
el WAV original; `VOICE_CUT` recorta una pausa a cada lado de esa frase.
`FORM_HOLD` añade dos segundos antes del párrafo siguiente. `moment()` aplica
ambos cambios al montaje y a los subtítulos sin desplazar su sincronización.
Las capturas `form-clean-*` tienen iguales dimensiones y posición; entre ellas
solo cambian los campos. El formulario se presenta completo en escritorio y
con dos encuadres fijos en móvil. No se simulan cursores ni clics.

La bienvenida usa un video y dos acciones externas: Saltar video y No volver a
mostrar. Una sola voz Kore y subtítulos integrados; formatos horizontal y
vertical con capturas nativas independientes. El aviso de Inicio permite
reabrirlo sin cambiar de sección. La preferencia de omisión se conserva.

El nuevo montaje se reconstruye sin inferencia pagada:

```powershell
python scripts/build-news-video.py --prepare
node scripts/tutorial-motion/node_modules/typescript/bin/tsc -p scripts/tutorial-motion
# Desde scripts/tutorial-motion:
node render-news.mjs stills
# Revisar los fotogramas de .data/news-video antes de exportar:
node render-news.mjs
# Desde la raíz:
python scripts/build-news-video.py --finalize
```

Para ajustes de encuadre sin cambiar la duración de las escenas, se puede usar
`node render-news.mjs --format=mobile --scene=caminos,formulario`: regenera los
fotogramas de esas escenas y el video completo del formato indicado. Si cambian
los tiempos, usar el comando completo para renovar todas las imágenes del
manifiesto.

Fuentes en `assets/tutorial-news/captures/` y
`assets/tutorial-news/narration/`. Los tiempos se alinearon contra la toma
continua y se ajustan a su reproducción al 90%; la transcripción automática
sirvió solo para medir, no para redactar el guion. La exportación conserva
H.264 yuv420p, GOP de un segundo, sin B-frames, AAC y faststart. El manifiesto
incluye hashes y referencias a los originales de cada toma.

La consulta ejecutiva a `anthropic/claude-opus-5.5` recibió un resumen de
producto, sin código ni repositorio completo. Orientó la franja de Inicio,
plazos con rangos completos, bienvenida mínima y relato autónomo. Las decisiones
finales, implementación y revisión visual corresponden al agente ejecutor.

Las instrucciones siguientes se conservan para los montajes anteriores.

Remotion 4.0.533, React y capturas reales del portal obtenidas con Computer Use.
Opus 5.5 produjo la dirección y el compositor inicial; las coordenadas, secuencia,
capturas, integración y revisión se ajustaron contra la aplicación real.

El contenido enseña marcas de ramos, prerrequisitos condicionales, agenda,
Inicio y Mis ramos. No anuncia Google Calendar conectado ni sincronización
por cuenta. Los ejemplos son ficticios y se crearon en un origen de prueba aislado.

## Reconstrucción

Desde la raíz, con Python (Pillow, numpy, edge-tts) y FFmpeg disponibles según
`scripts/build-real-tutorial.py`:

```powershell
npm ci --prefix scripts/tutorial-motion
node scripts/tutorial-motion/node_modules/@remotion/cli/remotion-cli.js browser ensure
python scripts/tutorial-motion/prepare.py
node scripts/tutorial-motion/node_modules/typescript/bin/tsc -p scripts/tutorial-motion
node scripts/tutorial-motion/render.mjs stills
# Inspeccionar los fotogramas de ambos formatos antes de generar los medios.
node scripts/tutorial-motion/render.mjs video
python scripts/tutorial-motion/finalize.py
```

`prepare.py` genera audio y tiempos; la voz se conserva en caché. Requiere red
para la primera síntesis con Edge TTS. No contiene llamadas pagadas a modelos.
`render.mjs` genera imágenes y video en `.data/video-motion/render/` con Chrome
Headless Shell de Remotion. No controla el navegador personal del usuario.
`finalize.py` verifica dimensiones, duración, igualdad del video entre variantes,
decodificación completa y balance de la música antes de escribir el manifiesto.

Cada toma tiene encuadres de orientación, acercamiento y lectura. El teléfono usa
sus propias capturas y movimientos. Los clics coinciden con cambios de estado
registrados; las imágenes no reconstruyen componentes de la aplicación.
La música permanece opcional y el reproductor no arranca automáticamente.

Referencias consultadas el 2026-10-05:
- https://www.remotion.dev/docs/ai/coding-agents
- https://www.remotion.dev/docs/animating-properties
- https://www.remotion.dev/docs/interpolate
- https://github.com/haidrrrry/claude-remotion-skill (referencia de dirección; no se instaló ni ejecutó su código)
- https://www.remotion.dev/license

La licencia de Remotion permite este uso por una organización sin fines de lucro.
Revisar sus condiciones si este compositor se reutiliza en otra organización.


## Focused semester tutorial (2026-10-06)

The current guide uses `assets/tutorial-story/manifest.js`. It follows marking courses, prerequisite projection, an activity, Inicio and Mis ramos. The grade calculator was retired at the user's request. Its UI, tutorial selector and lesson are removed. Legacy saved data remains readable in backups to avoid destructive migration.

Narration: Google Kore, direct screen-tutorial delivery, cached WAV files. No paid calls during rebuild. Captures are actual Computer Use screenshots; vertical camera crops show the same workflow. Word anchors use local transcription and measured phrase boundaries.

From repository root:

```powershell
python scripts/tutorial-motion/prepare-story.py
python scripts/tutorial-motion/story-props.py
```

From `scripts/tutorial-motion`: `node render-story.mjs`.
Back at repository root: `python scripts/tutorial-motion/finalize-story.py`.

Opus supplied the earlier structural review; Codex implements this focused retirement and new voice. Earlier calculator compositor is historical and is not used by the current guide.


## Precision pass (2026-10-07)

The current narrative uses one continuous Kore female take with neutral Latin
American tutorial delivery, stored as `narration/narration.wav`. `timing.json`
and the word alignment refer to that file; rebuilding has no API cost.
The form has separate name/date/time/course/saved captures. The browser's
focus scroll is compensated using measured offsets and capture scale. Native
field focus provides the cue; no approximate synthetic pointer or click is
rendered. The camera settles before inputs and cuts to the saved result.
Stills are rendered after every state change for desktop and portrait QA.

The current examples are Civil department courses: Geología para Ingeniería and
Mecánica de Sólidos approved, Mecánica de Suelos 1 current, Suelos 2 projected.
The same Control de Suelos appears in the form, saved activity and Inicio.
