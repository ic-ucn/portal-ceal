// Mallas reales adaptadas desde los HTML originales entregados por el usuario.
// Plan O: 61 asignaturas / 10 semestres.
// Plan P: 64 asignaturas / 11 semestres.
window.CURRICULA = {
  "planO": {
    "totalSemesters": 10,
    "expectedSubjects": 61,
    "subjects": [
      {
        "code": "DAFI-00103",
        "name": "INTRODUCCIÓN A LA FÍSICA",
        "semester": 1,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [],
        "visibleCode": "DAFI-00103",
        "requirements": [],
        "large": false,
        "description": "Introducción a los conceptos fundamentales de la física: magnitudes, vectores, cinemática y nociones de dinámica. Prepara la base conceptual para los cursos avanzados de física."
      },
      {
        "code": "DAMA-00135",
        "name": "CÁLCULO I",
        "semester": 1,
        "row": 2,
        "sct": 6,
        "area": "basica",
        "prereqs": [],
        "visibleCode": "DAMA-00135",
        "requirements": [],
        "large": false,
        "description": "Fundamentos de cálculo diferencial e integral: límites, continuidad, derivadas, integrales definidas e indefinidas. Base esencial para toda la carrera de ingeniería."
      },
      {
        "code": "DAMA-00136",
        "name": "ÁLGEBRA I",
        "semester": 1,
        "row": 3,
        "sct": 6,
        "area": "basica",
        "prereqs": [],
        "visibleCode": "DAMA-00136",
        "requirements": [],
        "large": false,
        "description": "Sistemas de ecuaciones lineales, matrices, determinantes, espacios vectoriales y transformaciones lineales. Herramienta algebraica fundamental para ingeniería."
      },
      {
        "code": "DDOC-00102",
        "name": "COMUNICACIÓN EFECTIVA I",
        "semester": 1,
        "row": 4,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "visibleCode": "DDOC-00102",
        "requirements": [],
        "large": false,
        "description": "Desarrollo de competencias de comunicación oral y escrita en contextos académicos y profesionales. Redacción técnica, presentaciones y argumentación."
      },
      {
        "code": "DDOC-01184",
        "name": "INGLÉS 1",
        "semester": 1,
        "row": 5,
        "sct": 4,
        "area": "general",
        "prereqs": [],
        "visibleCode": "DDOC-01184",
        "requirements": [],
        "large": false,
        "description": "Primer nivel de inglés orientado a la comprensión lectora y comunicación básica en contextos académicos de ingeniería."
      },
      {
        "code": "DATE-00015",
        "name": "IDENTIDAD, UNIVERSIDAD Y EQUIDAD DE GÉNERO",
        "semester": 1,
        "row": 6,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "visibleCode": "DATE-00015",
        "requirements": [],
        "large": false,
        "description": "Reflexión sobre identidad personal, institucional y social. Equidad de género y diversidad en el contexto universitario y profesional."
      },
      {
        "code": "UNFE-00001",
        "name": "FORMACIÓN GENERAL ELECTIVA",
        "semester": 1,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "visibleCode": "UNFE-00001",
        "requirements": [],
        "large": false,
        "description": "Asignatura electiva de formación general que permite al estudiante explorar áreas del conocimiento complementarias a la ingeniería."
      },
      {
        "code": "DAIC-00102",
        "name": "PROYECTO INTRODUCCIÓN A LA INGENIERÍA I",
        "semester": 1,
        "row": 8,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [],
        "visibleCode": "DAIC-00102",
        "requirements": [],
        "large": false,
        "description": "Primer proyecto integrador: introducción a la metodología de diseño en ingeniería, trabajo en equipo, resolución de problemas y comunicación técnica."
      },
      {
        "code": "DAFI-00203",
        "name": "MECÁNICA",
        "semester": 2,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAFI-00103",
          "DAMA-00135"
        ],
        "visibleCode": "DAFI-00203",
        "requirements": [],
        "large": false,
        "description": "Cinemática y dinámica de partículas y cuerpos rígidos. Leyes de Newton aplicadas a sistemas de ingeniería. Trabajo, energía y momento."
      },
      {
        "code": "DAMA-00235",
        "name": "CÁLCULO II",
        "semester": 2,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00135"
        ],
        "visibleCode": "DAMA-00235",
        "requirements": [],
        "large": false,
        "description": "Técnicas avanzadas de integración, series infinitas, ecuaciones paramétricas y coordenadas polares. Extensión del cálculo para aplicaciones en ingeniería."
      },
      {
        "code": "DAMA-00236",
        "name": "ÁLGEBRA II",
        "semester": 2,
        "row": 3,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00136"
        ],
        "visibleCode": "DAMA-00236",
        "requirements": [],
        "large": false,
        "description": "Valores y vectores propios, diagonalización, formas cuadráticas y espacios con producto interno. Fundamentos para métodos numéricos y análisis estructural."
      },
      {
        "code": "DAQU-00202",
        "name": "QUÍMICA GENERAL",
        "semester": 2,
        "row": 4,
        "sct": 5,
        "area": "basica",
        "prereqs": [],
        "visibleCode": "DAQU-00202",
        "requirements": [],
        "large": false,
        "description": "Estructura atómica, enlace químico, estequiometría, soluciones, equilibrio químico y electroquímica. Base para ciencia de materiales y termodinámica."
      },
      {
        "code": "DAIC-00200",
        "name": "DIBUJO DE INGENIERÍA",
        "semester": 2,
        "row": 5,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAMA-00136"
        ],
        "visibleCode": "DAIC-00200",
        "requirements": [],
        "large": false,
        "description": "Representación gráfica normalizada de elementos de ingeniería. Dibujo técnico, proyecciones ortogonales, vistas, cortes y uso de herramientas CAD."
      },
      {
        "code": "DDOC-02184",
        "name": "INGLÉS 2",
        "semester": 2,
        "row": 6,
        "sct": 4,
        "area": "general",
        "prereqs": [
          "DDOC-01184"
        ],
        "visibleCode": "DDOC-02184",
        "requirements": [],
        "large": false,
        "description": "Segundo nivel de inglés con énfasis en comprensión auditiva, expresión oral y vocabulario técnico básico de ingeniería."
      },
      {
        "code": "UNFV-00002",
        "name": "DIÁLOGO FE-CULTURA",
        "semester": 2,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [
          "DATE-00015"
        ],
        "visibleCode": "UNFV-00002",
        "requirements": [],
        "large": false,
        "description": "Diálogo interdisciplinario entre fe y cultura, explorando la relación entre valores humanos, ética y el quehacer profesional."
      },
      {
        "code": "DAMA-00309",
        "name": "ECUACIONES DIFERENCIALES",
        "semester": 3,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00235",
          "DAMA-00236"
        ],
        "visibleCode": "DAMA-00309",
        "requirements": [],
        "large": false,
        "description": "Ecuaciones diferenciales ordinarias de primer y segundo orden, sistemas de ecuaciones diferenciales y transformada de Laplace. Modelamiento de fenómenos físicos."
      },
      {
        "code": "DAMA-00410",
        "name": "CÁLCULO III",
        "semester": 3,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00235"
        ],
        "visibleCode": "DAMA-00410",
        "requirements": [],
        "large": false,
        "description": "Cálculo de funciones de varias variables: derivadas parciales, integrales múltiples, teoremas de Green, Stokes y divergencia. Análisis vectorial."
      },
      {
        "code": "DAIC-00400",
        "name": "DINÁMICA",
        "semester": 3,
        "row": 3,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAFI-00203"
        ],
        "visibleCode": "DAIC-00400",
        "requirements": [],
        "large": false,
        "description": "Cinemática y cinética de partículas y cuerpos rígidos. Vibraciones mecánicas, impulso y momento angular. Aplicaciones en sistemas dinámicos."
      },
      {
        "code": "DAIC-00300",
        "name": "MATERIALES DE INGENIERÍA",
        "semester": 3,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAQU-00202"
        ],
        "visibleCode": "DAIC-00300",
        "requirements": [],
        "large": false,
        "description": "Propiedades mecánicas, térmicas y químicas de materiales de construcción: acero, hormigón, madera, polímeros y materiales compuestos."
      },
      {
        "code": "DDOC-03183",
        "name": "INGLÉS 3",
        "semester": 3,
        "row": 5,
        "sct": 4,
        "area": "general",
        "prereqs": [
          "DDOC-02184"
        ],
        "visibleCode": "DDOC-03183",
        "requirements": [],
        "large": false,
        "description": "Tercer nivel de inglés enfocado en lectura y redacción de textos técnicos, presentaciones formales y comprensión de artículos científicos."
      },
      {
        "code": "UNFV-00003",
        "name": "DIÁLOGO FE-CIENCIA",
        "semester": 3,
        "row": 6,
        "sct": 2,
        "area": "general",
        "prereqs": [
          "UNFV-00002"
        ],
        "visibleCode": "UNFV-00003",
        "requirements": [],
        "large": false,
        "description": "Diálogo entre fe y pensamiento científico. Exploración de las relaciones entre ciencia, tecnología y valores éticos fundamentales."
      },
      {
        "code": "DAIC-00303",
        "name": "PROYECTO INTRODUCCIÓN A LA INGENIERÍA II",
        "semester": 3,
        "row": 7,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "DAIC-00102",
          "DAIC-00200"
        ],
        "visibleCode": "DAIC-00303",
        "requirements": [],
        "large": false,
        "description": "Segundo proyecto integrador: aplicación de herramientas de diseño, dibujo técnico y metodologías de ingeniería en un proyecto real."
      },
      {
        "code": "DAFI-00505",
        "name": "ELECTROMAGNETISMO",
        "semester": 4,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAFI-00203",
          "DAMA-00410",
          "DAMA-00136"
        ],
        "visibleCode": "DAFI-00505",
        "requirements": [],
        "large": false,
        "description": "Campos eléctricos y magnéticos, ley de Gauss, ley de Ampère, inducción electromagnética y ecuaciones de Maxwell. Ondas electromagnéticas."
      },
      {
        "code": "DAMA-00312",
        "name": "ESTADÍSTICA",
        "semester": 4,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00235"
        ],
        "visibleCode": "DAMA-00312",
        "requirements": [],
        "large": false,
        "description": "Probabilidad, distribuciones estadísticas, inferencia estadística, regresión y correlación. Herramientas para análisis de datos en ingeniería."
      },
      {
        "code": "DAIC-00403",
        "name": "ESTÁTICA",
        "semester": 4,
        "row": 3,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAIC-00400"
        ],
        "visibleCode": "DAIC-00403",
        "requirements": [],
        "large": false,
        "description": "Equilibrio de cuerpos rígidos, análisis de estructuras (cerchas, marcos, vigas), diagramas de cuerpo libre, centros de masa y momentos de inercia."
      },
      {
        "code": "DAIQ-00600",
        "name": "TERMODINÁMICA",
        "semester": 4,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAQU-00202",
          "DAMA-00235"
        ],
        "visibleCode": "DAIQ-00600",
        "requirements": [],
        "large": false,
        "description": "Primera y segunda ley de la termodinámica, ciclos termodinámicos, entropía y aplicaciones a sistemas de ingeniería. Transferencia de calor básica."
      },
      {
        "code": "DAIC-00404",
        "name": "METODOLOGÍAS CONSTRUCTIVAS",
        "semester": 4,
        "row": 5,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAIC-00300"
        ],
        "visibleCode": "DAIC-00404",
        "requirements": [],
        "large": false,
        "description": "Procesos constructivos para obras civiles: movimiento de tierras, fundaciones, hormigonado, albañilería, instalaciones y terminaciones. Normativa vigente."
      },
      {
        "code": "DDOC-04183",
        "name": "INGLÉS 4",
        "semester": 4,
        "row": 6,
        "sct": 4,
        "area": "general",
        "prereqs": [
          "DDOC-03183"
        ],
        "visibleCode": "DDOC-04183",
        "requirements": [],
        "large": false,
        "description": "Nivel avanzado de inglés con redacción académica, debates técnicos y preparación para comunicación profesional internacional."
      },
      {
        "code": "DAFI-00606",
        "name": "ÓPTICA Y FÍSICA MODERNA",
        "semester": 5,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAFI-00505"
        ],
        "visibleCode": "DAFI-00606",
        "requirements": [],
        "large": false,
        "description": "Óptica geométrica y física, interferencia, difracción, polarización. Introducción a la física moderna: relatividad especial y mecánica cuántica básica."
      },
      {
        "code": "DAMA-00409",
        "name": "MÉTODOS NUMÉRICOS",
        "semester": 5,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00309"
        ],
        "visibleCode": "DAMA-00409",
        "requirements": [],
        "large": false,
        "description": "Solución numérica de ecuaciones no lineales, sistemas de ecuaciones, interpolación, integración numérica y ecuaciones diferenciales. Programación de algoritmos."
      },
      {
        "code": "DAIC-00700",
        "name": "MECÁNICA DE FLUIDOS",
        "semester": 5,
        "row": 3,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAMA-00309",
          "DAIQ-00600",
          "DAIC-00403"
        ],
        "visibleCode": "DAIC-00700",
        "requirements": [],
        "large": false,
        "description": "Propiedades de los fluidos, hidrostática, cinemática y dinámica de fluidos, ecuaciones de Navier-Stokes, flujo en tuberías y canales abiertos."
      },
      {
        "code": "DAIC-00504",
        "name": "ANÁLISIS ESTRUCTURAL",
        "semester": 5,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAIC-00403"
        ],
        "visibleCode": "DAIC-00504",
        "requirements": [],
        "large": false,
        "description": "Análisis de estructuras isostáticas e hiperestáticas: vigas, marcos y cerchas. Métodos de rigidez, flexibilidad y líneas de influencia."
      },
      {
        "code": "DAIC-00505",
        "name": "MECÁNICA DE SÓLIDOS",
        "semester": 5,
        "row": 5,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAIC-00403"
        ],
        "visibleCode": "DAIC-00505",
        "requirements": [],
        "large": false,
        "description": "Esfuerzos y deformaciones en elementos estructurales: tracción, compresión, flexión, corte, torsión. Criterios de falla y diseño elástico."
      },
      {
        "code": "DAIC-00506",
        "name": "PROYECTO GESTIÓN Y ADM. DE CONSTRUCCIÓN",
        "semester": 5,
        "row": 6,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "DAIC-00404"
        ],
        "visibleCode": "DAIC-00506",
        "requirements": [],
        "large": false,
        "description": "Proyecto integrador de gestión de construcción: planificación, programación, control de costos, administración de contratos y normativa."
      },
      {
        "code": "DAIC-00605",
        "name": "MODELOS DE TRÁFICO",
        "semester": 6,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAMA-00409"
        ],
        "visibleCode": "DAIC-00605",
        "requirements": [],
        "large": false,
        "description": "Teoría de flujo vehicular, modelos de demanda de transporte, diseño geométrico de vías, capacidad y niveles de servicio. Ingeniería de tránsito."
      },
      {
        "code": "DAIS-00200",
        "name": "PROGRAMACIÓN",
        "semester": 6,
        "row": 2,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAMA-00136",
          "DAIC-00102"
        ],
        "visibleCode": "DAIS-00200",
        "requirements": [],
        "large": false,
        "description": "Fundamentos de programación: algoritmos, estructuras de datos, paradigmas de programación y aplicaciones computacionales en problemas de ingeniería civil."
      },
      {
        "code": "DAIC-00606",
        "name": "MECÁNICA DE SUELOS I",
        "semester": 6,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00505"
        ],
        "visibleCode": "DAIC-00606",
        "requirements": [],
        "large": false,
        "description": "Origen, clasificación y propiedades de los suelos. Ensayos de laboratorio, compactación, permeabilidad, consolidación y resistencia al corte."
      },
      {
        "code": "DAIC-00607",
        "name": "HIDRÁULICA",
        "semester": 6,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00700"
        ],
        "visibleCode": "DAIC-00607",
        "requirements": [],
        "large": false,
        "description": "Flujo en canales abiertos, diseño de canales y tuberías, obras de captación, conducción y distribución. Máquinas hidráulicas y golpe de ariete."
      },
      {
        "code": "DAIC-00608",
        "name": "HORMIGÓN ARMADO",
        "semester": 6,
        "row": 5,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00505",
          "DAIC-00504"
        ],
        "visibleCode": "DAIC-00608",
        "requirements": [],
        "large": false,
        "description": "Diseño y análisis de elementos estructurales de hormigón armado: vigas, columnas, losas y fundaciones. Norma chilena NCh 430 y ACI 318."
      },
      {
        "code": "DAIC-00609",
        "name": "PROYECTO DISEÑO DE INFRAESTRUCTURA VIAL",
        "semester": 6,
        "row": 6,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "DAIC-00303",
          "DAIC-00506"
        ],
        "visibleCode": "DAIC-00609",
        "requirements": [],
        "large": false,
        "description": "Proyecto integrador de diseño vial: trazado, secciones transversales, pavimentos, señalización y presupuesto de una obra de infraestructura vial."
      },
      {
        "code": "DAIC-00704",
        "name": "ELEMENTOS FINITOS APLICADOS",
        "semester": 7,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00700",
          "DAIC-00606"
        ],
        "visibleCode": "DAIC-00704",
        "requirements": [],
        "large": false,
        "description": "Formulación e implementación del método de elementos finitos para problemas de elasticidad, transferencia de calor y mecánica de fluidos."
      },
      {
        "code": "DAIS-00703",
        "name": "ELECTROTECNIA",
        "semester": 7,
        "row": 2,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "DAFI-00505",
          "DAMA-00309"
        ],
        "visibleCode": "DAIS-00703",
        "requirements": [],
        "large": false,
        "description": "Circuitos eléctricos de corriente continua y alterna, máquinas eléctricas, transformadores e instalaciones eléctricas en obras civiles."
      },
      {
        "code": "DAIC-00706",
        "name": "MECÁNICA DE SUELOS II",
        "semester": 7,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00606"
        ],
        "visibleCode": "DAIC-00706",
        "requirements": [],
        "large": false,
        "description": "Empuje lateral de tierras, estabilidad de taludes, capacidad de soporte, asentamientos y mejoramiento de suelos. Diseño geotécnico avanzado."
      },
      {
        "code": "DAIC-00705",
        "name": "DISEÑO EN ACERO",
        "semester": 7,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00505",
          "DAIC-00504"
        ],
        "visibleCode": "DAIC-00705",
        "requirements": [],
        "large": false,
        "description": "Diseño de elementos y conexiones de acero estructural: vigas, columnas, arriostramientos y uniones según AISC y normativa chilena."
      },
      {
        "code": "DDOC-00202",
        "name": "COMUNICACIÓN EFECTIVA II",
        "semester": 7,
        "row": 5,
        "sct": 1,
        "area": "general",
        "prereqs": [
          "DDOC-00102"
        ],
        "visibleCode": "DDOC-00202",
        "requirements": [],
        "large": false,
        "description": "Comunicación profesional avanzada: informes técnicos, presentaciones ejecutivas y habilidades de comunicación en equipos multidisciplinarios."
      },
      {
        "code": "UNFE-07006",
        "name": "EMPRENDIMIENTO",
        "semester": 7,
        "row": 6,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "visibleCode": "UNFE-07006",
        "requirements": [],
        "large": false,
        "description": "Creatividad e innovación empresarial aplicada al ámbito de la ingeniería. Modelos de negocio, startups y gestión de proyectos emprendedores."
      },
      {
        "code": "DATE-01204",
        "name": "ÉTICA Y MORAL PROFESIONAL",
        "semester": 7,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [
          "UNFV-00003"
        ],
        "visibleCode": "DATE-01204",
        "requirements": [],
        "large": false,
        "description": "Reflexión sobre la ética profesional del ingeniero civil. Responsabilidad social, dilemas éticos, códigos de conducta y deontología profesional."
      },
      {
        "code": "DAIC-00707",
        "name": "PROYECTO DISEÑO DE OBRAS HIDRÁULICAS",
        "semester": 7,
        "row": 8,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "DAIC-00609",
          "DAIC-00607"
        ],
        "visibleCode": "DAIC-00707",
        "requirements": [],
        "large": false,
        "description": "Proyecto integrador de obras hidráulicas: diseño de sistemas de captación, conducción, almacenamiento y evacuación de aguas."
      },
      {
        "code": "DAIC-00810",
        "name": "INGENIERÍA Y DESARROLLO SUSTENTABLE",
        "semester": 8,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [],
        "visibleCode": "DAIC-00810",
        "requirements": [],
        "large": false,
        "description": "Desarrollo sustentable aplicado a la ingeniería: evaluación de impacto ambiental, eficiencia energética, economía circular y construcción verde."
      },
      {
        "code": "DAII-00600",
        "name": "INGENIERÍA ECONÓMICA",
        "semester": 8,
        "row": 2,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAMA-00235"
        ],
        "visibleCode": "DAII-00600",
        "requirements": [],
        "large": false,
        "description": "Evaluación económica de proyectos de ingeniería: valor presente, TIR, análisis costo-beneficio, depreciación y financiamiento de obras civiles."
      },
      {
        "code": "DAIC-00800",
        "name": "INGENIERÍA SANITARIA Y AMBIENTAL",
        "semester": 8,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00607"
        ],
        "visibleCode": "DAIC-00800",
        "requirements": [],
        "large": false,
        "description": "Sistemas de agua potable, alcantarillado y tratamiento de aguas residuales. Gestión ambiental y normativa sanitaria aplicada a obras civiles."
      },
      {
        "code": "DAIC-00806",
        "name": "FUNDACIONES",
        "semester": 8,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00706",
          "DAIC-00608"
        ],
        "visibleCode": "DAIC-00806",
        "requirements": [],
        "large": false,
        "description": "Diseño de fundaciones superficiales y profundas: zapatas, losas, pilotes y muros de contención. Interacción suelo-estructura."
      },
      {
        "code": "DAIC-00807",
        "name": "DINÁMICA DE ESTRUCTURAS",
        "semester": 8,
        "row": 5,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00504"
        ],
        "visibleCode": "DAIC-00807",
        "requirements": [],
        "large": false,
        "description": "Vibraciones de sistemas de múltiples grados de libertad, análisis modal, respuesta sísmica de estructuras y espectros de diseño."
      },
      {
        "code": "DAIC-00808",
        "name": "PROYECTO DISEÑO DE ESTRUCTURAS INDUSTRIALES",
        "semester": 8,
        "row": 6,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "DAIC-00705",
          "DAIC-00706"
        ],
        "visibleCode": "DAIC-00808",
        "requirements": [],
        "large": false,
        "description": "Proyecto integrador de estructuras industriales: diseño completo de una nave o edificio industrial en acero y/o hormigón armado."
      },
      {
        "code": "UNFP-86961",
        "name": "ELECTIVO PROFESIONAL I",
        "semester": 9,
        "row": 1,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "visibleCode": "UNFP-86961",
        "requirements": [],
        "large": false,
        "description": "Asignatura electiva profesional que permite profundizar en un área de especialización de la ingeniería civil según los intereses del estudiante."
      },
      {
        "code": "DAIC-00900",
        "name": "CONSTRUCCIÓN DE OBRAS INDUSTRIALES",
        "semester": 9,
        "row": 2,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00808"
        ],
        "visibleCode": "DAIC-00900",
        "requirements": [],
        "large": false,
        "description": "Planificación y ejecución de obras industriales: montaje de estructuras metálicas, prefabricados, control de calidad y seguridad en obra."
      },
      {
        "code": "DAIC-00904",
        "name": "ANÁLISIS Y DISEÑO SÍSMICO DE EDIFICIOS",
        "semester": 9,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00608",
          "DAIC-00705",
          "DAIC-00807"
        ],
        "visibleCode": "DAIC-00904",
        "requirements": [],
        "large": false,
        "description": "Análisis y diseño sísmico de edificios de hormigón armado y acero según NCh 433 y NCh 2369. Desempeño sísmico y técnicas de refuerzo."
      },
      {
        "code": "DAIC-00905",
        "name": "MECÁNICA DE ROCAS",
        "semester": 9,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00706"
        ],
        "visibleCode": "DAIC-00905",
        "requirements": [],
        "large": false,
        "description": "Propiedades mecánicas de macizos rocosos, clasificaciones geomecánicas, excavaciones subterráneas, taludes en roca y sostenimiento."
      },
      {
        "code": "DAIC-00906",
        "name": "PROGRAMACIÓN Y GESTIÓN DE OBRAS",
        "semester": 9,
        "row": 5,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAIC-00506"
        ],
        "visibleCode": "DAIC-00906",
        "requirements": [],
        "large": false,
        "description": "Técnicas de planificación CPM/PERT, gestión de recursos, control de avance físico-financiero y administración de contratos de obra."
      },
      {
        "code": "UNFP-86962",
        "name": "ELECTIVO PROFESIONAL II",
        "semester": 9,
        "row": 6,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "visibleCode": "UNFP-86962",
        "requirements": [],
        "large": false,
        "description": "Segunda asignatura electiva profesional para profundización en un área complementaria de la ingeniería civil."
      },
      {
        "code": "DAIC-01000",
        "name": "CAPSTONE PROJECT",
        "semester": 10,
        "row": 1,
        "sct": 30,
        "area": "proyecto",
        "prereqs": [],
        "visibleCode": "DAIC-01000",
        "requirements": [],
        "large": false,
        "description": "Proyecto de título integrador (Capstone): desarrollo completo de un proyecto de ingeniería civil con asesoría de profesores y presentación ante comisión evaluadora."
      }
    ],
    "areas": {
      "basica": {
        "name": "Ciencias Básicas",
        "color": "--mc-area-basica"
      },
      "ingenieria": {
        "name": "Ciencias de la Ingeniería",
        "color": "--mc-area-ingenieria"
      },
      "aplicada": {
        "name": "Ingeniería Aplicada",
        "color": "--mc-area-aplicada"
      },
      "general": {
        "name": "Formación General",
        "color": "--mc-area-general"
      },
      "proyecto": {
        "name": "Proyectos",
        "color": "--mc-area-proyecto"
      },
      "electivo": {
        "name": "Electivos Profesionales",
        "color": "--mc-area-electivo"
      }
    }
  },
  "planP": {
    "totalSemesters": 11,
    "expectedSubjects": 64,
    "subjects": [
      {
        "code": "P-0101",
        "visibleCode": "P-0101",
        "name": "INTRODUCCIÓN AL CÁLCULO",
        "semester": 1,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0102",
        "visibleCode": "P-0102",
        "name": "GEOMETRÍA EUCLIDIANA",
        "semester": 1,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0103",
        "visibleCode": "P-0103",
        "name": "INTRODUCCIÓN A LA FÍSICA",
        "semester": 1,
        "row": 3,
        "sct": 5,
        "area": "basica",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0104",
        "visibleCode": "P-0104",
        "name": "INTRODUCCIÓN A LA INGENIERÍA",
        "semester": 1,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DDOC-01184",
        "visibleCode": "DDOC-01184",
        "name": "INGLÉS 1",
        "semester": 1,
        "row": 5,
        "sct": 4,
        "area": "general",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DATE-00015",
        "visibleCode": "DATE-00015",
        "name": "IDENTIDAD, UNIVERSIDAD Y EQUIDAD DE GÉNERO",
        "semester": 1,
        "row": 6,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DDOC-00102",
        "visibleCode": "DDOC-00102",
        "name": "COMUNICACIÓN EFECTIVA I",
        "semester": 1,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0201",
        "visibleCode": "P-0201",
        "name": "CÁLCULO 1",
        "semester": 2,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0101"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0202",
        "visibleCode": "P-0202",
        "name": "ÁLGEBRA 1",
        "semester": 2,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0102"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0203",
        "visibleCode": "P-0203",
        "name": "FÍSICA 1",
        "semester": 2,
        "row": 3,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0102",
          "P-0103"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0204",
        "visibleCode": "P-0204",
        "name": "QUÍMICA GENERAL",
        "semester": 2,
        "row": 4,
        "sct": 5,
        "area": "basica",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DDOC-02184",
        "visibleCode": "DDOC-02184",
        "name": "INGLÉS 2",
        "semester": 2,
        "row": 5,
        "sct": 4,
        "area": "general",
        "prereqs": [
          "DDOC-01184"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0206",
        "visibleCode": "P-0206",
        "name": "DIBUJO PLANIMÉTRICO DE INGENIERÍA",
        "semester": 2,
        "row": 6,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0104"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DDOC-02020",
        "visibleCode": "DDOC-02020",
        "name": "COMUNICACIÓN EFECTIVA II",
        "semester": 2,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [
          "DDOC-00102"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0301",
        "visibleCode": "P-0301",
        "name": "CÁLCULO 2",
        "semester": 3,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0201"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0302",
        "visibleCode": "P-0302",
        "name": "ÁLGEBRA 2",
        "semester": 3,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0202"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0303",
        "visibleCode": "P-0303",
        "name": "FÍSICA 2",
        "semester": 3,
        "row": 3,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0203"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0304",
        "visibleCode": "P-0304",
        "name": "INTRODUCCIÓN A LA PROGRAMACIÓN",
        "semester": 3,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0104",
          "P-0202"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0305",
        "visibleCode": "P-0305",
        "name": "MECÁNICA RACIONAL",
        "semester": 3,
        "row": 5,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0201",
          "P-0203"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0306",
        "visibleCode": "P-0306",
        "name": "GEOMESURA",
        "semester": 3,
        "row": 6,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0202",
          "P-0206"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DAMA-00312",
        "visibleCode": "DAMA-00312",
        "name": "PROBABILIDAD Y ESTADÍSTICA",
        "semester": 4,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0201"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0402",
        "visibleCode": "P-0402",
        "name": "ECUACIONES DIFERENCIALES",
        "semester": 4,
        "row": 2,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "P-0301",
          "P-0302"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DAIQ-00600",
        "visibleCode": "DAIQ-00600",
        "name": "TERMODINÁMICA",
        "semester": 4,
        "row": 3,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0201",
          "P-0204"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0404",
        "visibleCode": "P-0404",
        "name": "GEOLOGÍA PARA INGENIERÍA",
        "semester": 4,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0204"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0405",
        "visibleCode": "P-0405",
        "name": "ESTÁTICA APLICADA",
        "semester": 4,
        "row": 5,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0305"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "UNFV-00002",
        "visibleCode": "UNFV-00002",
        "name": "DIÁLOGO CRISTIANISMO Y CULTURAS",
        "semester": 4,
        "row": 6,
        "sct": 2,
        "area": "general",
        "prereqs": [
          "DATE-00015"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0407",
        "visibleCode": "DDOC",
        "name": "FORMACIÓN GENERAL ELECTIVA",
        "semester": 4,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0501",
        "visibleCode": "P-0501",
        "name": "CÁLCULO NUMÉRICO",
        "semester": 5,
        "row": 1,
        "sct": 5,
        "area": "basica",
        "prereqs": [
          "DAMA-00312",
          "P-0402",
          "P-0201"
        ],
        "requirements": [
          "Nota 1: requiere Cálculo 1 aprobado."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "DAII-00600",
        "visibleCode": "DAII-00600",
        "name": "INGENIERÍA ECONÓMICA",
        "semester": 5,
        "row": 2,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0402",
          "P-0201"
        ],
        "requirements": [
          "Nota 1: requiere Cálculo 1 aprobado."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0503",
        "visibleCode": "P-0503",
        "name": "MECÁNICA DE FLUIDOS",
        "semester": 5,
        "row": 3,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0402",
          "DAIQ-00600",
          "P-0405"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0504",
        "visibleCode": "P-0504",
        "name": "MECÁNICA DE SÓLIDOS",
        "semester": 5,
        "row": 4,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0404",
          "P-0405"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0505",
        "visibleCode": "P-0505",
        "name": "ANÁLISIS ESTRUCTURAL",
        "semester": 5,
        "row": 5,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0405"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0506",
        "visibleCode": "P-0506",
        "name": "MÁQUINAS Y EQUIPOS",
        "semester": 5,
        "row": 6,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [],
        "requirements": [
          "Nota 3: requiere hasta IV semestre aprobado."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0601",
        "visibleCode": "P-0601",
        "name": "DISEÑO EN HORMIGÓN ARMADO",
        "semester": 6,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0504",
          "P-0505"
        ],
        "requirements": [
          "Nota 4: requiere 120 SCT aprobados."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0602",
        "visibleCode": "P-0602",
        "name": "MATERIALES DE INGENIERÍA",
        "semester": 6,
        "row": 2,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0404",
          "P-0504"
        ],
        "requirements": [
          "Nota 4: requiere 120 SCT aprobados."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0603",
        "visibleCode": "P-0603",
        "name": "HIDRÁULICA GENERAL",
        "semester": 6,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0503"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0604",
        "visibleCode": "P-0604",
        "name": "MECÁNICA DE SUELOS 1",
        "semester": 6,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0404",
          "P-0504"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0605",
        "visibleCode": "P-0605",
        "name": "INGENIERÍA EN TRÁNSITO",
        "semester": 6,
        "row": 5,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0306",
          "P-0505"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0606",
        "visibleCode": "P-0606",
        "name": "HIDROLOGÍA",
        "semester": 6,
        "row": 6,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "DAMA-00312",
          "P-0306"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0701",
        "visibleCode": "P-0701",
        "name": "PROCESOS CONSTRUCTIVOS",
        "semester": 7,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0602",
          "P-0506"
        ],
        "requirements": [
          "Nota 5: requiere Máquinas y Equipos aprobado."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0702",
        "visibleCode": "P-0702",
        "name": "DISEÑO EN ACERO",
        "semester": 7,
        "row": 2,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0504",
          "P-0505",
          "P-0602"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0703",
        "visibleCode": "P-0703",
        "name": "INGENIERÍA SANITARIA Y AMBIENTAL",
        "semester": 7,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0603"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0704",
        "visibleCode": "P-0704",
        "name": "MECÁNICA DE SUELOS 2",
        "semester": 7,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0604"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0705",
        "visibleCode": "P-0705",
        "name": "ELECTIVO PROFESIONAL 1",
        "semester": 7,
        "row": 5,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Electivo profesional del Plan P 2025. Permite profundizar en un área de especialización de Ingeniería Civil."
      },
      {
        "code": "P-0706",
        "visibleCode": "P-0706",
        "name": "BIM APLICADO A LA INGENIERÍA CIVIL",
        "semester": 7,
        "row": 6,
        "sct": 5,
        "area": "ingenieria",
        "prereqs": [
          "P-0304",
          "P-0606"
        ],
        "requirements": [
          "Nota 2: requiere Introducción a la Programación aprobado."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "UNFV-00003",
        "visibleCode": "UNFV-00003",
        "name": "DIÁLOGO FE Y CIENCIA",
        "semester": 7,
        "row": 7,
        "sct": 2,
        "area": "general",
        "prereqs": [
          "UNFV-00002"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0801",
        "visibleCode": "P-0801",
        "name": "DINÁMICA DE ESTRUCTURAS",
        "semester": 8,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0505"
        ],
        "requirements": [
          "Nota 7: requiere Análisis Estructural aprobado."
        ],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0802",
        "visibleCode": "P-0802",
        "name": "FUNDACIONES",
        "semester": 8,
        "row": 2,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0601",
          "P-0702",
          "P-0704"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0803",
        "visibleCode": "P-0803",
        "name": "PROGRAMACIÓN DE OBRAS",
        "semester": 8,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0701"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0804",
        "visibleCode": "P-0804",
        "name": "INGENIERÍA PARA EL DESARROLLO SUSTENTABLE",
        "semester": 8,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0703",
          "P-0704"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0805",
        "visibleCode": "P-0805",
        "name": "ELECTIVO PROFESIONAL 2",
        "semester": 8,
        "row": 5,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Electivo profesional del Plan P 2025. Permite profundizar en un área de especialización de Ingeniería Civil."
      },
      {
        "code": "P-0806",
        "visibleCode": "P-0806",
        "name": "PROYECTO DE INFRAESTRUCTURA VIAL",
        "semester": 8,
        "row": 6,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "P-0605",
          "P-0706"
        ],
        "requirements": [],
        "large": false,
        "description": "Proyecto aplicado del Plan P 2025. Integra cursos previos del área y habilita ramos/proyectos posteriores según la malla."
      },
      {
        "code": "P-0901",
        "visibleCode": "P-0901",
        "name": "DISEÑO SÍSMICO DE EDIFICIOS",
        "semester": 9,
        "row": 1,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0801",
          "P-0802",
          "P-0702"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0902",
        "visibleCode": "P-0902",
        "name": "GESTIÓN Y ADMINISTRACIÓN DE OBRAS",
        "semester": 9,
        "row": 2,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0803"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0903",
        "visibleCode": "P-0903",
        "name": "CONSTRUCCIÓN Y MONTAJE DE OBRAS INDUSTRIALES",
        "semester": 9,
        "row": 3,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0803"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-0904",
        "visibleCode": "P-0904",
        "name": "ELECTIVO PROFESIONAL 3",
        "semester": 9,
        "row": 4,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Electivo profesional del Plan P 2025. Permite profundizar en un área de especialización de Ingeniería Civil."
      },
      {
        "code": "P-0905",
        "visibleCode": "P-0905",
        "name": "PROYECTO DE ESTRUCTURAS INDUSTRIALES",
        "semester": 9,
        "row": 5,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "P-0702",
          "P-0802",
          "P-0706"
        ],
        "requirements": [],
        "large": false,
        "description": "Proyecto aplicado del Plan P 2025. Integra cursos previos del área y habilita ramos/proyectos posteriores según la malla."
      },
      {
        "code": "P-0906",
        "visibleCode": "P-0906",
        "name": "PROYECTO DE OBRAS HIDRÁULICAS",
        "semester": 9,
        "row": 6,
        "sct": 5,
        "area": "proyecto",
        "prereqs": [
          "P-0603",
          "P-0606",
          "P-0806"
        ],
        "requirements": [],
        "large": false,
        "description": "Proyecto aplicado del Plan P 2025. Integra cursos previos del área y habilita ramos/proyectos posteriores según la malla."
      },
      {
        "code": "P-1001",
        "visibleCode": "P-1001",
        "name": "PROYECTO INTEGRADOR 1",
        "semester": 10,
        "row": 1,
        "sct": 15,
        "area": "proyecto",
        "prereqs": [
          "P-0901",
          "P-0902",
          "P-0903",
          "P-0904",
          "P-0905",
          "P-0906"
        ],
        "requirements": [
          "Nota 9: requiere hasta IX semestre aprobado."
        ],
        "large": true,
        "description": "Proyecto integrador del Plan P 2025. Concentra requisitos de avance por semestre completo y articula competencias de la carrera."
      },
      {
        "code": "P-1002",
        "visibleCode": "P-1002",
        "name": "ELECTIVO PROFESIONAL 4",
        "semester": 10,
        "row": 2,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Electivo profesional del Plan P 2025. Permite profundizar en un área de especialización de Ingeniería Civil."
      },
      {
        "code": "P-1003",
        "visibleCode": "P-1003",
        "name": "ELECTIVO PROFESIONAL 5",
        "semester": 10,
        "row": 3,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Electivo profesional del Plan P 2025. Permite profundizar en un área de especialización de Ingeniería Civil."
      },
      {
        "code": "P-1004",
        "visibleCode": "P-1004",
        "name": "ASPECTOS LEGALES EN INGENIERÍA CIVIL",
        "semester": 10,
        "row": 4,
        "sct": 5,
        "area": "aplicada",
        "prereqs": [
          "P-0905",
          "P-0906"
        ],
        "requirements": [],
        "large": false,
        "description": "Asignatura del Plan P 2025 de Ingeniería Civil UCN. Revisa esta tarjeta para ver prerequisitos directos, requisitos adicionales de la malla y los ramos que abre."
      },
      {
        "code": "P-1101",
        "visibleCode": "P-1101",
        "name": "PROYECTO INTEGRADOR 2",
        "semester": 11,
        "row": 1,
        "sct": 25,
        "area": "proyecto",
        "prereqs": [
          "P-1001",
          "P-1002",
          "P-1003",
          "P-1004"
        ],
        "requirements": [
          "Nota 10: requiere hasta X semestre aprobado."
        ],
        "large": true,
        "description": "Proyecto integrador del Plan P 2025. Concentra requisitos de avance por semestre completo y articula competencias de la carrera."
      },
      {
        "code": "P-1102",
        "visibleCode": "P-1102",
        "name": "ELECTIVO PROFESIONAL 6",
        "semester": 11,
        "row": 2,
        "sct": 5,
        "area": "electivo",
        "prereqs": [],
        "requirements": [],
        "large": false,
        "description": "Electivo profesional del Plan P 2025. Permite profundizar en un área de especialización de Ingeniería Civil."
      }
    ],
    "areas": {
      "basica": {
        "name": "Ciencias Básicas",
        "color": "--mc-area-basica"
      },
      "ingenieria": {
        "name": "Ciencias de la Ingeniería",
        "color": "--mc-area-ingenieria"
      },
      "aplicada": {
        "name": "Ingeniería Aplicada",
        "color": "--mc-area-aplicada"
      },
      "general": {
        "name": "Formación General",
        "color": "--mc-area-general"
      },
      "proyecto": {
        "name": "Proyectos",
        "color": "--mc-area-proyecto"
      },
      "electivo": {
        "name": "Electivos Profesionales",
        "color": "--mc-area-electivo"
      }
    }
  }
};
