# Backend y Supabase

El portal puede funcionar como sitio estático para consulta, pero las funciones reales de encuestas, votaciones, IA, sesiones y publicación necesitan backend.

## Supabase

1. Abrir Supabase.
2. Ir a `SQL Editor`.
3. Crear una query nueva.
4. Pegar y ejecutar `supabase/portal_state.sql`.

La tabla `portal_state` guarda el estado persistente del portal como JSON. El frontend no accede directo a esa tabla; solo el backend con secret key.

## Variables del backend

Configurar estas variables en el entorno donde corra `server.mjs`:

```txt
PORTAL_GOOGLE_CLIENT_ID=...
PORTAL_GOOGLE_DOMAIN=alumnos.ucn.cl
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_DAILY_SOFT_LIMIT=50
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SECRET_KEY=...
SUPABASE_STATE_TABLE=portal_state
PORTAL_VOTE_SALT=...
```

`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY` y `PORTAL_VOTE_SALT` nunca deben ir al frontend ni al repositorio.

## Frontend

Cuando el backend esté publicado, definir en `src/config.js` o antes de cargar `src/app.js`:

```js
window.PORTAL_API_BASE = 'https://backend.example.com/api';
```

En local, el portal usa `/api` automáticamente cuando se abre desde `localhost`.
