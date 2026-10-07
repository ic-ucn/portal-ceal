# Tutorial de estudio: compositor reproducible

Remotion 4.0.533, React y capturas reales del portal obtenidas con Computer Use.
Opus 5.5 produjo la dirección y el compositor inicial; las coordenadas, secuencia,
capturas, integración y revisión se ajustaron contra la aplicación real.

El contenido enseña marcas de ramos, prerrequisitos condicionales, agenda,
calculadora e Inicio. No anuncia Google Calendar conectado ni sincronización
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


## Two focused lessons (2026-10-06)

The current guide uses `assets/tutorial-story/manifest.js`. `semestre` follows one course through marking, prerequisite projection, an activity, Inicio and Mis ramos. `notas` explains a personal weighted-grade calculation separately. Both have horizontal and vertical output, open captions and four audio modes. Google Aoede narration is cached; rebuilding makes no paid requests.

Opus 5.5 supplied the structural review. Sonnet 5.5 supplied CalculatorSample; Codex adapted real captures, timing, layouts and integration. Astra checked clarity and caught mobile occlusion/encoding issues before release. This does not imply user aesthetic approval.

From repository root:

```powershell
python scripts/tutorial-motion/prepare-story.py
python scripts/tutorial-motion/story-props.py
```

From `scripts/tutorial-motion`:

```powershell
node render-story.mjs
```

Back at repository root:

```powershell
python scripts/tutorial-motion/finalize-story.py
```

Captures and narration are versioned in `assets/tutorial-story`. Source capture pixels stay unchanged. Vertical camera crops in the semester lesson show the same desktop workflow; the calculator has separate mobile captures. Word anchors were checked against a local transcription; the generated narration is the timing source, not percentages of scene duration. Camera offsets align browser scroll positions in the form shots.
