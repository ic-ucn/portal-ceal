# Estadísticas del portal

Panel privado: https://ceicucn.goatcounter.com/ (requiere la cuenta administradora).

- **Páginas**: visitas a Bienvenida, Inicio, Calendario, Mallas, Material, fichas y búsqueda. Los detalles de material se agrupan; sus enlaces vuelven a la biblioteca, sin identificadores de documentos.
- **Acciones**: también aparecen en Páginas, con la etiqueta «evento». Filtrar por `tutorial/`, `calendario/`, `mallas/` o `material/`. Cada clic cuenta; no representa una persona diferente.
- **Totales**: configurado para excluir eventos; los clics no inflan el total de visitantes. El encabezado de Páginas sí incluye los eventos mostrados.
- **Tutorial**: inicio, avance hasta 25/50/75%, final y errores, separados entre móvil y escritorio. El avance indica posición alcanzada, no tiempo visto sin saltos.
- **Referentes, Navegadores, Sistemas y Tamaños**: origen externo, navegador, sistema y tamaño de pantalla. El origen de un evento indica la sección en la que ocurrió. Panel en español de Chile, zona America/Santiago.

GoatCounter cuenta visitas únicas a cada página dentro de su ventana de sesión; recargar o volver no necesariamente suma otra visita. Los eventos usan `no_session` para contar repeticiones. No es una grabación de sesiones, un mapa de calor ni una reconstrucción del recorrido individual. No mide interacciones dentro del visor externo de Google Drive ni confirma que una descarga externa terminó.

La integración solo funciona en ceicucn.cl y www.ceicucn.cl. Excluye navegación automatizada, pruebas, entornos locales, Do Not Track y Global Privacy Control. Las rutas privadas quedan fuera. No transmite texto de búsquedas, formularios, correos, cuentas, cadenas de consulta ni URLs de documentos. El SDK de GoatCounter añade consultas por defecto: el adaptador limita expresamente sus campos antes de enviar.

Para excluir tus visitas en un navegador, abre https://ceicucn.cl/?analytics=off#/inicio. Para volver a incluirlas, usa https://ceicucn.cl/?analytics=on#/inicio. Esta preferencia no necesita iniciar sesión y solo afecta GoatCounter. Los bloqueadores también pueden impedir la medición; los conteos no equivalen a todo el tráfico real.

Configuración pública (sin claves): `src/config.js`. Instrumentación: `src/analytics.js`. La CSP permite únicamente el script de GoatCounter y el endpoint de esta cuenta, además del beacon de Cloudflare que el dominio ya inserta. Las fuentes siguen alojadas en el portal; no se autoriza la fuente de Perplexity que puede insertar el navegador.

Verificación: `npm run qa:analytics`, `npm run check`, `npm run quality`, `node scripts/qa-portal.mjs`. La prueba de analítica intercepta todos los envíos: no añade visitas artificiales al panel real.

Fuentes oficiales: [SPA](https://www.goatcounter.com/help/spa), [JavaScript](https://www.goatcounter.com/help/js), [eventos](https://www.goatcounter.com/help/events), [visitas](https://www.goatcounter.com/help/sessions), [CSP GoatCounter](https://www.goatcounter.com/help/csp), [CSP Cloudflare](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/content-security-policies/).
