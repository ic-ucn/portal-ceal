# Importacion de material desde Google Drive

Este flujo sirve para inventariar carpetas compartidas, revisar privacidad y preparar material para el Portal CEIC / CEAL UCN sin mezclar contenido privado con contenido publicable.

## Regla para carpeta personal compartida

La carpeta personal no debe compartirse directamente. El importador solo la usa como fuente de trabajo local.

El contenido de esa carpeta sirve para el portal, excepto pautas, resoluciones, resueltos, soluciones y desarrollos equivalentes.

En esa carpeta quedan bloqueados para publicacion los archivos cuyo nombre o ruta parezcan:

- pauta
- resuelto / resuelta / resueltos / resueltas
- resolucion / solucion / solucionario
- desarrollo / desarrollado
- respuesta

Lo demas queda como candidato. Si el importador puede inferir ramo y tipo de material con claridad, queda en `upload-ready.csv`; si falta contexto, queda en revision manual.

## Preparacion

Instalar rclone:

```powershell
winget install Rclone.Rclone
```

Si `winget` no esta disponible, descarga rclone para Windows y deja la ruta del `rclone.exe` en `.data/drive-import-config.json` usando `rclonePath`.

Configurar acceso a Google Drive con el correo que recibio las carpetas:

```powershell
rclone config
```

Usar estos criterios:

- Crear remote nuevo.
- Nombre sugerido: `portaldrive`.
- Tipo: Google Drive.
- Scope: lectura o readonly.
- Iniciar sesion con el correo que recibio las carpetas compartidas.
- No configurar carpeta raiz fija.

## Config local

Crear la configuracion local ignorada por git:

```powershell
npm run drive:init -- --public-folder ID_CARPETA_UNIVERSIDAD --private-folder ID_CARPETA_UNIVERSIDAD_PERSONAL
```

El archivo queda en:

```text
.data/drive-import-config.json
```

Ese archivo puede tener IDs privados y no debe subirse al repo.

## Inventario

```powershell
npm run drive:inventory
```

Genera una carpeta nueva en `.data/drive-imports/` con:

- `manifest.csv`: inventario completo.
- `manifest.json`: inventario completo en JSON.
- `portal-candidates.csv`: archivos candidatos para el portal.
- `upload-ready.csv`: candidatos con ramo y tipo claros, sin bloqueo ni revision pendiente.
- `private-candidates-review.csv`: candidatos desde carpeta personal que todavia requieren revision.
- `review-required.csv`: candidatos que requieren revision manual.
- `blocked-private.csv`: bloqueados por regla de carpeta personal.

Campos principales:

- fuente y privacidad
- accion de privacidad
- tipo de material inferido
- ramo, codigo, plan y semestre inferidos desde las mallas
- MIME type, formato, tamano, fecha de modificacion
- link Drive original
- ruta local, si luego se descarga

## Descarga

Despues de revisar el inventario:

```powershell
npm run drive:download
```

El comando vuelve a inventariar y descarga solo lo que aparece en `upload-ready.csv`.

Para descargar tambien candidatos que requieren revision:

```powershell
npm run drive:download -- --include-review
```

Los archivos bloqueados de carpeta personal nunca se descargan con este flujo. Los archivos nativos de Google se exportan asi:

- Google Docs: PDF
- Google Slides: PDF
- Google Sheets: XLSX

Los PDFs, Office, imagenes, ZIPs y otros binarios se descargan en su formato original.

## Publicacion en Drive neutro

Configurar un remote de destino con permisos de escritura:

```powershell
rclone config create ceicbiblioteca drive scope drive
```

Luego publicar solo lo listo para subir:

```powershell
npm run drive:publish
```

Para una prueba pequeña:

```powershell
npm run drive:publish -- --limit 3
```

Por defecto publica en:

```text
ceicbiblioteca:Biblioteca Portal CEIC UCN
```

El comando copia los archivos permitidos a la cuenta de destino, crea un link publico para la carpeta raiz y genera:

- `published-manifest.csv`
- `published-manifest.json`

Esos archivos contienen la ruta publicada y el link de Drive de cada archivo copiado.

La publicacion inicial excluye videos por peso. Tambien usa una transferencia local reanudable para evitar errores de permisos entre el Drive origen y el Drive neutro.

Para actualizar el catalogo estatico que lee el portal:

```powershell
npm run drive:catalog -- --input .data\drive-imports\<inventario>
```

## Paso previo a publicar

Antes de subir al portal:

1. Revisar `blocked-private.csv`.
2. Revisar `review-required.csv`.
3. Confirmar con el duenio de la carpeta personal los nombres dudosos.
4. Usar `upload-ready.csv` como base para importar recursos al portal.
