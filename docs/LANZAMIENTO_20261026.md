# Candidato de lanzamiento — 2026-10-26

Kevin autorizó la publicación el 2026-10-26 tras corregir los reinicios e
interrupciones del reproductor. El candidato se prepara en `codex/novedades-personal`
y se integra en `main` para el lanzamiento. La referencia pública anterior es `6ff71e8`.

## Qué incluye respecto al sitio publicado

- Mallas Plan O / Plan P: actuales, aprobados, marcado reversible y filtros.
  Los dos botones de estado miden 112 × 44 px en la barra y la ficha.
  En móvil la página lleva un solo desplazamiento vertical, incluso al marcar.
- Mis ramos: asignaturas actuales, acceso al material, actividades y revisión
  de los ramos que se abrirían al aprobar los actuales, conservando requisitos conjuntos.
- Mi semana: actividades personales vinculadas a ramos, edición, completado,
  exportación ICS y copia/restauración de los datos del navegador.
- Inicio con próximas actividades, ramos actuales y aviso de novedades por versión.
- Plazos UCN de varios días agrupados con rango y fuente.
- Tutorial visual sin voz, horizontal y vertical, con instrucciones inferiores,
  música instrumental discreta, cursor en escritorio e indicador de toque en móvil.
  Presenta Mis ramos/Material, Qué se abre, Mi semana, plazos UCN e Inicio;
  el marcado ocupa 13 segundos y no hay sección de copias de respaldo.
  Conserva Saltar video y No volver a mostrar. La preferencia anterior se respeta.
- Protección del servidor para impedir descargar archivos internos por rutas estáticas.

La calculadora se retiró por decisión anterior. El guardado por cuenta y Google
Calendar conservan código preparado y pruebas controladas, pero permanecen
desactivados. Este lanzamiento usa guardado en el navegador y copias descargables.

## Revisión

Abrir en este equipo:

- Tutorial: <http://127.0.0.1:18116/?static=1&analytics=off&review=20261026complete1#/bienvenida>
- Portal: <http://127.0.0.1:18116/?static=1&analytics=off&review=20261026complete1#/inicio>

Videos de 62 segundos:
`assets/tutorial-complete/desktop/guia-con-musica.mp4` y
`assets/tutorial-complete/mobile/guia-con-musica.mp4`.

Si el servidor de revisión terminó, iniciarlo desde la carpeta del proyecto con
`python -m http.server 18116 --bind 127.0.0.1`. Ese servidor sirve la revisión;
no es el servicio operativo ni debe exponerse a Internet.

Resultados y capturas de esta revisión: `output/release-20261026/tutorial-complete/`
y `output/release-20261026/mobile-scroll/`.
La comprobación de cinco archivos públicos contra `main` dio HTTP 200 y hashes
idénticos; referencia remota confirmada con `git ls-remote`.

## Verificación y publicación

La matriz detallada de pruebas está en
`output/release-20261026/tutorial-complete/qa/QA-SUMMARY.md`. Las comprobaciones de archivos y video
están junto a la evidencia audiovisual. No se atribuye aprobación estética a
las pruebas automáticas.

Resultado de la revisión final:

- Sintaxis y calidad: 24.259 aserciones, sin fallos.
- Portal operativo aislado: 31 rutas y 18 flujos, sin fallos.
- Vistas públicas: 35 con servicio y 35 en modo estático, sin errores ni desbordes.
- Reproductor: ocho casos, incluidos Chrome, WebKit y Firefox; seis tamaños/orientaciones.
- Ambos MP4: 62 segundos, H.264 y música AAC estéreo, sin narración.
- Botones: 112 × 44 px en barra y ficha, planes O/P y anchos 320/390/1440.
- Seguridad estática: 86 comprobaciones; fuentes, activos y rangos públicos preservados.
- Malla, actividades, respaldos, persistencia y avisos: pruebas específicas aprobadas.
- Desplazamiento móvil: 20 escenarios con rueda y gestos táctiles, sin scroll vertical interior.
- Revisión visual independiente del montaje y reproducción completa desde Chrome.

Autorización recibida el 2026-10-26. Secuencia de lanzamiento:

1. Confirmar que `origin/main` conserva la referencia revisada y que el candidato
   no contiene cambios posteriores sin verificar. No incluir `.apos`, `.data`,
   `output`, fuentes personales ni los archivos untracked anteriores.
2. Avanzar `main` al candidato revisado con `git merge --ff-only codex/novedades-personal`
   y publicar en `origin/main`. La preparación integra el historial del rollback
   dentro de la rama personal, conservando exactamente el árbol del candidato;
   el recibo de integración está en la evidencia. Un merge normal del rollback
   puede retirar las funciones nuevas y no debe repetirse sobre este candidato.
3. Esperar GitHub Pages y comprobar escritorio/móvil, caché de assets y ambos videos.
4. Desplegar también la revisión de `server.mjs` en el servicio operativo;
   GitHub Pages por sí solo no aplica esa protección. Comprobar con HEAD, sin
   leer cuerpos privados, que las rutas internas están rechazadas.
5. Verificar el sitio publicado con las suites de esa revisión antes de anunciarlo.

## Mensaje preparado, no enviado

Hola! Actualizamos el portal de Civil 🙌

Ahora pueden marcar sus ramos actuales y aprobados, revisar qué ramos podrían
abrirse al aprobar los actuales y organizar evaluaciones y entregas en Mi semana.
También tienen material a mano y los plazos UCN agrupados en la agenda.

👉 https://ceicucn.cl

Hay un tutorial breve con instrucciones en pantalla, música suave y sin voz. El avance se
guarda en el navegador que usen; pueden descargar una copia desde Mi semana.

Si encuentran algo que mejorar o necesitan otra herramienta, cuéntennos.
