# Mi estudio — arquitectura y operación

Lanzamiento público autorizado el 2026-10-05. Sin IA, importación general de calendarios ni sincronización bidireccional.

La versión pública ofrece Inicio personal, Mi semana, calculadora y ramos sin cuenta, con guardado en el navegador, copias JSON y exportación ICS. `PORTAL_SIGN_IN_ENABLED` permanece desactivado: la sincronización por cuenta y la conexión directa a Google Calendar descritas abajo son capacidades preparadas, pendientes de configurar y verificar en el entorno de producción. Las pruebas con un proveedor controlado no acreditan esa conexión real.

## Experiencia

- Inicio reúne actividades personales próximas, anteriores sin completar, ramos actuales del plan elegido, fechas UCN y accesos a notas/material. Usa los mismos registros de Mi semana y Mis ramos; no exige configurar otro perfil. Cada actividad abre su semana. Los cambios en otra pestaña actualizan Inicio.
- Mis ramos ocupa el lienzo completo y abre Actuales. Cada tarjeta reúne Material, Notas, Estado y Agregar actividad; Guardados queda como acceso secundario independiente de las marcas.
- «Qué se abre» distingue prerrequisitos ya cumplidos de los que se cumplirían al aprobar todos los actuales requeridos. Combina aprobados y actuales, sin asumir aprobación, cadenas futuras ni oferta real. Los requisitos adicionales o ambiguos se mantienen por revisar.
- Qué se abre muestra Ya cumples, Al aprobar y Faltan. Tocar un actual filtra sus destinos; cada destino muestra los requisitos conjuntos mediante segmentos y etiquetas. Ver en malla destaca los candidatos sin cambiar el avance. Los filtros Todos, Ya cumples y Si apruebas actuales permiten volver al contexto completo.
- Las tarjetas mantienen tintes por área y borde neutro uniforme, sin franjas laterales ni fondos de estado. Verde/amarillo solo identifican las etiquetas de aprobado/actual. Fe-cultura y Fe-ciencia (UNFV-00002/00003) tienen una subdivisión visual teológica; el catálogo permanece intacto.
- Desde Mis ramos o la ficha integrada: Agregar actividad abre Mi semana con plan y ramo elegidos.
- En la malla, «Marcar ramos» permite elegir Actuales (amarillo) o Aprobados (verde). Tocar nuevamente con la misma marca la retira. Pendiente es el estado por defecto y no se elige ni resalta. La ficha usa los mismos dos botones. Los registros anteriores se conservan; «actual» mantiene internamente el valor `cursando`.
- La aprobación por semestre está plegada en «Aprobar semestres anteriores» y solo modifica ramos sin marcar. Conserva los actuales y los aprobados; permite deshacer el lote sin revertir cambios individuales posteriores.
- Los ramos cursando aparecen primero. Próximas evaluaciones y entregas complementan la semana.
- Sin cuenta: actividades, notas y ramos continúan en el navegador. Descarga/recuperación JSON y exportación ICS disponibles.
- Guardar con mi cuenta UCN usa la autenticación Google del portal, validada por el servidor. No habilita acceso CEAL ni obliga a registrarse para usar el portal.
- La primera conexión muestra los datos anónimos del navegador antes de incorporarlos. No se eliminan los originales. Los registros ya existentes en la cuenta tienen prioridad en la incorporación/recuperación; las copias anteriores se conservan.
- Datos aislados por cuenta. Cambios se guardan primero en el dispositivo y después en la cuenta. Un conflicto entre dispositivos exige elegir versión; ambas se respaldan antes de resolverlo.
- Google Calendar es una conexión separada y opcional, con la misma cuenta UCN. Solo se envían actividades seleccionadas. Las notas no se envían.
- Los cambios en Google se protegen con ETag. Ante conflicto se conserva el evento por separado. El portal no importa esos cambios ni vuelve a crear silenciosamente eventos borrados.
- Desconectar elimina las credenciales guardadas por el portal, detiene futuros envíos y mantiene ambos conjuntos de actividades. No revoca globalmente otros usos del mismo cliente OAuth.
- Cuando vence o se revoca el permiso, «Volver a conectar» renueva la autorización y conserva el calendario dedicado y los identificadores de eventos.
- Recuperar una copia parte del botón visible, permite cancelar el selector y mantiene el archivo seleccionado aunque se actualice el estado de guardado. Una recuperación pendiente no se aplica a otra cuenta si cambia la sesión.
- La descarga de eventos conserva la duración explícita de las actividades con hora. Si no se indicó duración, no inventa una. Las horas del archivo se interpretan en la zona del calendario que lo importa.

## Componentes

`src/study-tools.js` y `src/my-courses.js` ofrecen validación, cambio de ámbito por cuenta y recuperación. Las claves anónimas v1 permanecen intactas. `src/study-account.js` coordina consentimiento, respaldo, revisiones, guardado y Calendar. `src/study-ui.js` presenta agenda y calculadora.

`server/study-service.mjs` maneja `/api/study`, autenticado con sesiones del portal. Documentos por cuenta, revisiones optimistas y copia anterior se almacenan en `db.data.studyAccounts`. Se excluye expresamente ese objeto del bootstrap público. El email normalizado de la sesión se transforma en una clave SHA-256; nunca se acepta un propietario enviado en el cuerpo.

Los datos se persisten con `writeDb`, usando el almacenamiento configurado del portal. Los bloqueos por cuenta serializan validación/escritura y operaciones Google. Esto presupone **una instancia escritora del servidor**, igual que el almacenamiento de estado completo actual. No ejecutar múltiples escritores sin mover revisiones y bloqueos a transacciones del almacén persistente.

API:

| Ruta | Método | Función |
|---|---|---|
| `/api/study` | GET | Documento propio, revisión y estado seguro de Calendar |
| `/api/study/save` | POST | Guardar documento si coincide la revisión; 409 exige resolución |
| `/api/study/calendar/start` | POST | Autorizar calendario dedicado, estado de un uso y PKCE |
| `/api/study/calendar/callback` | GET | Intercambiar código, comprobar identidad/permisos, crear calendario |
| `/api/study/calendar/sync` | POST | Enviar pendientes, reintentar sin duplicar, proteger modificaciones externas |
| `/api/study/calendar/detach` | POST | Conservar por separado un evento en conflicto |
| `/api/study/calendar/disconnect` | POST | Retirar credenciales y conservar eventos |

OAuth usa `openid`, `email` y `calendar.app.created`; identidad verificada, permiso comprobado, estado con caducidad y PKCE S256. Tokens cifrados con AES-256-GCM. IDs de eventos deterministas por calendario/actividad; intención persistida antes de insertar y recuperación por ID tras una respuesta incierta. Actualización/eliminación requiere `If-Match` con la versión conocida. Horas interpretadas con `America/Santiago`; fechas sin hora son eventos de día completo. Una actividad con hora enviada a Google necesita duración positiva explícita.

La sincronización ocurre mientras el portal está abierto, al guardar, reconectar o pulsar Actualizar calendario. No hay una tarea autónoma que siga enviando después de cerrar el navegador. Los cambios ya guardados se recuperan al volver. Lotes grandes se acotan temporalmente y muestran si hace falta continuar.

## Activación de Google real

La aplicación OAuth es del proyecto CEIC. Sus credenciales identifican al portal frente a Google; no son la contraseña del creador ni otorgan acceso a su calendario. Cada estudiante inicia sesión con su cuenta UCN y autoriza individualmente su propio calendario «Mi estudio CEIC». Los tokens quedan aislados por cuenta. La cuenta de Jefatura mantiene su integración independiente.

No escribir secretos en este documento, pruebas, commits o chat. Configurar en el entorno seguro del servidor:

```dotenv
STUDY_CALENDAR_CLIENT_ID=<cliente OAuth web de Google>
STUDY_CALENDAR_CLIENT_SECRET=<secreto del cliente>
STUDY_CALENDAR_REDIRECT_URI=http://127.0.0.1:8105/api/study/calendar/callback
STUDY_PORTAL_RETURN_URL=http://127.0.0.1:8105/
PORTAL_TOKEN_ENCRYPTION_KEY=<clave aleatoria estable de al menos 32 bytes>
```

Las URLs anteriores son del entorno interno. No equivalen a publicar. Registrar la URI de retorno exacta en el cliente OAuth y habilitar Calendar API. La URL final del portal debe conservar el mismo origen usado para iniciar sesión. Si ya existe una clave de cifrado, **no reemplazarla**: también puede proteger la conexión de Jefatura. Los clientes de Calendar existentes son fallback de compatibilidad, pero no se reutiliza su estado, calendario ni cuenta.

El acceso con cuenta requiere también `PORTAL_GOOGLE_CLIENT_ID` y el origen/retorno del login Google ya usado por el portal. Verificar pantalla de consentimiento, usuarios de prueba y las restricciones administrativas UCN. Fuera del entorno de pruebas, comprobar los requisitos de publicación/verificación OAuth de Google antes de ofrecerlo a estudiantes.

Estado comprobado el 2026-10-02: identificador de login presente; secreto Calendar, clave explícita de cifrado y retorno específico ausentes en los archivos de entorno del proyecto. Ninguna prueba contra una cuenta Google real realizada. No anunciar Calendar como activado hasta completar conexión, alta, cambio de fecha, cambio externo, desconexión y reconexión reales.

Si la respuesta al crear el calendario secundario se pierde, el servicio detiene la provisión para no crear calendarios repetidos. Se requiere reconciliar el ID creado con la cuenta autorizada y registrar la reparación; no borrar ni reiniciar el estado a ciegas.

## Verificación

Con servidor **aislado**, `QA_TEST_MODE=1`, puerto 8105, `PORTAL_STATE_BACKEND=local` y base `.data/qa-study-build.json`:

```powershell
npm run check
npm run quality
npm run qa:study-tools
npm run qa:study-account
npm run qa:study-persistence
npm run qa:my-courses
npm run qa:analytics
node scripts/qa-portal.mjs
```

Nunca habilitar `QA_TEST_MODE` en el servicio publicado. `qa-study-account` usa un proveedor Google controlado en memoria para verificar OAuth, reintentos y conflictos; después verifica guardado real por API y navegador con sesiones exclusivamente de pruebas. No reemplaza la validación OAuth real pendiente. No se requiere ni está previsto un piloto con alumnos.

## Preparación del lanzamiento

Ejecutar `npm run study:preflight` para comprobar el entorno interno o `npm run study:preflight -- --release` en el entorno previsto para el lanzamiento. El comando lee la configuración con la misma precedencia que el servidor, no modifica archivos ni publica y solo muestra resultados y nombres de ajustes: nunca sus valores. Devuelve código 1 si falta configuración. Su propia prueba es `npm run qa:study-preflight`.

El modo de lanzamiento exige URLs HTTPS sin credenciales ni fragmentos, sesiones de prueba apagadas y configuración de persistencia. Una ruta de datos absoluta no demuestra que el volumen sea durable: debe verificarse por separado. El informe conserva las comprobaciones externas pendientes incluso si la configuración pasa.

Antes de habilitar la función al público, completar la prueba Google real con una cuenta UCN autorizada: entrar, conectar, seleccionar una actividad, enviarla, cambiar fecha/duración, editarla también en Google y comprobar la protección del cambio externo, desconectar y reconectar sin duplicados. Comprobar también que otra cuenta no recibe sus actividades y que el guardado resiste un reinicio del servicio. Esta verificación es técnica, sin piloto con alumnos.

El lanzamiento necesita el servidor actualizado además de los archivos del sitio. Desplegar únicamente la parte estática no habilita `/api/study`. Registrar en Google las URLs finales del servicio y del portal, conservar la clave de cifrado efectiva y respaldar el estado antes de una migración. La autorización de publicación sigue pendiente: esta preparación no ejecuta despliegue, push ni merge.

Fuentes: [permisos Calendar](https://developers.google.com/workspace/calendar/api/auth), [modificaciones condicionales](https://developers.google.com/calendar/api/guides/version-resources), [importación ICS](https://support.google.com/calendar/answer/37118?hl=en).

## Guía actualizada (2026-10-02)

Capturas reales de escritorio y móvil en un origen separado, sin utilizar datos del usuario. Ocho capítulos cubren malla, marcas, actuales, caminos, Inicio/Mi semana, notas, material y calendario. Guion en `scripts/portal-tutorial-real.json`; compositor `scripts/build-real-tutorial.py`; validación del reproductor `npm run qa:welcome`.

La búsqueda en los chats Portal CEAL de mayo/junio y agosto encontró el cliente OAuth de la agenda de Jefatura y su configuración prevista en Render (`portal-ceic-api`). La última revisión de agosto mantuvo Calendar pendiente; no acredita una conexión personal por estudiante. No se recuperaron ni copiaron secretos históricos. La configuración actual requiere el preflight y la prueba real de esta integración.

`qa:study-persistence` inicia dos procesos consecutivos con una base nueva en `.data/qa-study-restart-*`: comprueba documento/revisión tras reinicio, rechazo de escrituras atrasadas y aislamiento entre cuentas. No reinicia el preview ni certifica la durabilidad del volumen de producción.

## Recorrido breve (2026-10-05)

La guía vigente dura 32,53 segundos y cubre solo las herramientas personales nuevas: marcas, Mis ramos, proyección de prerrequisitos, Mi semana, calculadora e Inicio. Reemplaza el recorrido de 65 segundos en el reproductor. Los medios anteriores se conservan como archivo.

`python scripts/build-novedades-video.py` genera horizontal 1920×1080 y vertical 1080×1920 a 30 fps desde PNG obtenidos con Computer Use. El guion y los recortes viven en ese archivo; los PNG originales y sus hashes se conservan. Voz femenina Dalia, subtítulos breves integrados y pista VTT opcional; música apagada inicialmente y ninguna reproducción automática. Las cuatro variantes comparten tiempos; los pasos estáticos siguen disponibles con movimiento reducido.

El montaje no promete conexión Google Calendar ni IA en el portal. La proyección sigue siendo condicional y se recuerda confirmar oferta y requisitos con la universidad. `npm run qa:welcome` verifica reproducción, capítulos, formatos, subtítulos, conservación de datos y accesibilidad de controles.
