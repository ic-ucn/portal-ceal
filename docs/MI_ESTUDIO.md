# Mi estudio — arquitectura y operación

Entrega interna. Sin IA, importación general de calendarios ni sincronización bidireccional. No publicar sin indicación explícita.

## Experiencia

- Desde Mis ramos o la ficha integrada: Agregar actividad abre Mi semana con plan y ramo elegidos.
- Los ramos cursando aparecen primero. Próximas evaluaciones y entregas complementan la semana.
- Sin cuenta: actividades, notas y ramos continúan en el navegador. Descarga/recuperación JSON y exportación ICS disponibles.
- Guardar con mi cuenta UCN usa la autenticación Google del portal, validada por el servidor. No habilita acceso CEAL ni obliga a registrarse para usar el portal.
- La primera conexión muestra los datos anónimos del navegador antes de incorporarlos. No se eliminan los originales. Los registros ya existentes en la cuenta tienen prioridad en la incorporación/recuperación; las copias anteriores se conservan.
- Datos aislados por cuenta. Cambios se guardan primero en el dispositivo y después en la cuenta. Un conflicto entre dispositivos exige elegir versión; ambas se respaldan antes de resolverlo.
- Google Calendar es una conexión separada y opcional, con la misma cuenta UCN. Solo se envían actividades seleccionadas. Las notas no se envían.
- Los cambios en Google se protegen con ETag. Ante conflicto se conserva el evento por separado. El portal no importa esos cambios ni vuelve a crear silenciosamente eventos borrados.
- Desconectar elimina las credenciales guardadas por el portal, detiene futuros envíos y mantiene ambos conjuntos de actividades. No revoca globalmente otros usos del mismo cliente OAuth.

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
npm run qa:my-courses
npm run qa:analytics
node scripts/qa-portal.mjs
```

Nunca habilitar `QA_TEST_MODE` en el servicio publicado. `qa-study-account` usa un proveedor Google controlado en memoria para verificar OAuth, reintentos y conflictos; después verifica guardado real por API y navegador con sesiones exclusivamente de pruebas. No reemplaza la validación OAuth real pendiente. No se requiere ni está previsto un piloto con alumnos.

Fuentes: [permisos Calendar](https://developers.google.com/workspace/calendar/api/auth), [modificaciones condicionales](https://developers.google.com/calendar/api/guides/version-resources), [importación ICS](https://support.google.com/calendar/answer/37118?hl=en).
