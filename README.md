# Portal CEIC / CEAL UCN — Ingeniería Civil UCN

Demo frontend avanzada, estática y autocontenida del portal para estudiantes y gestión interna CEAL.

## Cómo abrir

Opción rápida:

1. Abrir `index.html` directamente en el navegador.
2. Elegir rol: `Estudiante` o `Miembro CEAL`.

Opción recomendada para desarrollo:

```bash
cd portal-ceic-ucn-final
python serve.py
# o también: python -m http.server 8080
```

Luego abrir `http://localhost:8080`.

## Qué incluye

- Login demo con selección de rol.
- AppShell desktop: sidebar, topbar, búsqueda global y notificaciones.
- AppShell mobile: header compacto y bottom nav.
- Inicio.
- Comunicados + FAQ.
- Calendario y acuerdos.
- Casos y seguimiento.
- Nuevo caso con validación frontend.
- Biblioteca académica / Material.
- Subir material con validación frontend.
- Mallas interactivas integradas al portal.
- Detalle de ramo.
- Ayudantías y trámites.
- Mi cuenta / perfil estudiante.
- Búsqueda global.
- Gestión CEAL protegida por rol demo.
- Editor interno de comunicado.
- Validación de material.
- Estados vacíos, badges, chips, timeline, tablas desktop y cards mobile.

## Mallas reales integradas

Se integraron los datos curriculares existentes:

- Plan O — Catálogo 2016: 61 asignaturas, 10 semestres.
- Plan P — Catálogo 2025: 64 asignaturas, 11 semestres.

Los HTML originales quedan respaldados en:

```txt
original-mallas/malla-o.html
original-mallas/malla-p.html
```

Los datos normalizados para el portal quedan en:

```txt
data/curricula.js
```

## Estructura

```txt
portal-ceic-ucn-final/
  index.html
  README.md
  assets/
    logo-horizontal.png
    logo-mark.png
    logo-stacked.png
  data/
    curricula.js
  original-mallas/
    malla-o.html
    malla-p.html
  src/
    app.js
    mock-data.js
    styles.css
```

## Decisiones de producto

- El logo se usa en header, login, sidebar y marca de cuenta. No se repite como decoración en cards.
- Gestión CEAL solo aparece si se ingresa con rol `Miembro CEAL`.
- Mallas conecta con detalle de ramo, material y ayudantías solo cuando hay relación útil.
- Material conecta con ramo y malla.
- Calendario conecta con acuerdos y trámites.
- Casos mantiene historial, responsable, adjuntos y estados.
- La demo usa datos mock realistas y localStorage para sesión, plan activo y avance de malla.
- La malla usa highlight de cadena de prerrequisitos y cadena de ramos sucesores, no solo relaciones directas.

## Preparado para backend futuro

El frontend está hecho sin dependencias para facilitar revisión rápida. Para producción, el siguiente paso sería separar los repositorios mock en servicios:

- `casesRepository`
- `materialsRepository`
- `calendarRepository`
- `agreementsRepository`
- `communicationsRepository`
- `curriculumRepository`
- `auth/sessionRepository`

## Notas

Esta carpeta es una demo frontend funcional. No implementa autenticación real, persistencia remota ni carga real de archivos. Las acciones simulan cambios en memoria y sesión local.
