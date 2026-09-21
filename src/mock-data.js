window.PortalMock = (() => {

  const cealMembers = [
    { id: 'ceal-martina-briceno', username: 'martina.briceno', name: 'Martina Briceño', initials: 'MB', role: 'ceal', roleName: 'Presidencia', label: 'Presidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'martina.briceno@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'manage:roles', 'review:casos', 'upload:acuerdos'] },
    { id: 'ceal-camila-villegas', username: 'camila.villegas', name: 'Camila Villegas', initials: 'CV', role: 'ceal', roleName: 'Vicepresidencia', label: 'Vicepresidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'camila.villegas@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'review:casos', 'edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-matias-gonzalez', username: 'matias.gonzalez11', name: 'Matías González', initials: 'MG', role: 'ceal', roleName: 'Secretaría', label: 'Secretaría', plan: 'planP', yearLabel: 'CEAL 2026', email: 'matias.gonzalez11@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'upload:acuerdos', 'review:casos', 'manage:forms'] },
    { id: 'ceal-belen-astudillo', username: 'belen.astudillo', name: 'Belén Astudillo', initials: 'BA', role: 'ceal', roleName: 'Tesorería', label: 'Tesorería', plan: 'planP', yearLabel: 'CEAL 2026', email: 'belen.astudillo@alumnos.ucn.cl', passwordSet: false, permissions: ['review:casos', 'edit:calendario', 'manage:forms'] },
    { id: 'ceal-gabriel-sanchez', username: 'gabriel.sanchez', name: 'Gabriel Sánchez', initials: 'GS', role: 'ceal', roleName: 'Comunicaciones', label: 'Comunicaciones', plan: 'planP', yearLabel: 'CEAL 2026', email: 'gabriel.sanchez@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-bruno-castillo', username: 'bruno.castillo', name: 'Bruno Castillo', initials: 'BC', role: 'ceal', roleName: 'Docencia', label: 'Docencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'bruno.castillo@alumnos.ucn.cl', passwordSet: false, permissions: ['validate:material', 'review:casos', 'edit:mallas', 'manage:tutoring'] },
    { id: 'ceal-paolo-cardaniz', username: 'paolo.cardaniz', name: 'Paolo Cardaniz', initials: 'PC', role: 'ceal', roleName: 'Deportes', label: 'Deportes', plan: 'planP', yearLabel: 'CEAL 2026', email: 'paolo.cardaniz@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'review:casos'] },
    { id: 'ceal-paolo-ferruzola', username: 'paolo.ferruzola', name: 'Paolo Ferruzola', initials: 'PF', role: 'ceal', roleName: 'Extracurricular', label: 'Extracurricular', plan: 'planP', yearLabel: 'CEAL 2026', email: 'paolo.ferruzola@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'manage:forms'] },
    { id: 'ceal-kevin-cortes', username: 'kevin.cortes', name: 'Kevin Cortés', initials: 'KC', role: 'ceal', roleName: 'Tecnología', label: 'Tecnología', plan: 'planP', yearLabel: 'CEAL 2026', email: 'kevin.cortes@alumnos.ucn.cl', passwordSet: false, permissions: ['review:casos', 'manage:forms'] }
  ];

  const users = {
    student: {
      id: 'u-student-001',
      name: 'Estudiante Ingeniería Civil UCN',
      initials: 'EC',
      role: 'student',
      label: 'Estudiante',
      plan: 'planP',
      yearLabel: '4to año',
      email: 'estudiante@alumnos.ucn.cl',
      permissions: []
    },
    ceal: { ...cealMembers[2] }
  };

  const communications = [];

  const resources = [
    {
      id: 'mat-001', title: 'Guía 3: equilibrio de cuerpos rígidos', type: 'Guía', courseCode: 'DAIC-00403', plan: 'planO', courseName: 'Estática', semester: 4, year: 2024, format: 'PDF', size: '2.1 MB',
      origin: 'Ayudantía Estática', status: 'validadoCeal', uploadedBy: 'Ayudantía Estática', uploadedAt: '2026-05-10', description: 'Guía con ejercicios resueltos de equilibrio de cuerpos rígidos y sistemas de fuerzas.'
    },
    {
      id: 'mat-002', title: 'Parcial 2 resuelto 2024', type: 'Prueba', courseCode: 'DAIC-00403', plan: 'planO', courseName: 'Estática', semester: 4, year: 2024, format: 'PDF', size: '1.8 MB',
      origin: 'Prof. R. Valdés', status: 'validadoCeal', uploadedBy: 'CEAL', uploadedAt: '2026-05-09', description: 'Evaluación anterior compartida como referencia de estudio.'
    },
    {
      id: 'mat-003', title: 'Resumen de esfuerzo y deformación', type: 'Resumen', courseCode: 'P-0403', plan: 'planP', courseName: 'Mecánica de Sólidos', semester: 4, year: 2024, format: 'PDF', size: '1.4 MB',
      origin: 'Aporte estudiantil', status: 'aporteEstudiantil', uploadedBy: 'María P. Contreras', uploadedAt: '2026-05-08', description: 'Resumen de conceptos de esfuerzo, deformación y comportamiento elástico.'
    },
    {
      id: 'mat-004', title: 'Diapositivas de consolidación de suelos', type: 'PPT', courseCode: 'P-0504', plan: 'planP', courseName: 'Mecánica de Suelos', semester: 5, year: 2023, format: 'PPTX', size: '3.4 MB',
      origin: 'Prof. J. Carvajal', status: 'validadoCeal', uploadedBy: 'Docencia', uploadedAt: '2026-05-07', description: 'Presentación base para repaso de consolidación y asentamientos.'
    },
    {
      id: 'mat-005', title: 'Apuntes de flujo en canales', type: 'Apunte', courseCode: 'P-0603', plan: 'planP', courseName: 'Hidráulica General', semester: 6, year: 2024, format: 'PDF', size: '980 KB',
      origin: 'Aporte estudiantil', status: 'aporteEstudiantil', uploadedBy: 'Camila R.', uploadedAt: '2026-05-07', description: 'Apuntes de flujo en canales y pérdidas de energía.'
    },
    {
      id: 'mat-006', title: 'Guía de diseño en hormigón armado', type: 'Guía', courseCode: 'DAIC-00608', plan: 'planO', courseName: 'Hormigón Armado', semester: 6, year: 2024, format: 'PDF', size: '2.7 MB',
      origin: 'Ayudantía HA', status: 'validadoCeal', uploadedBy: 'Ayudantía HA', uploadedAt: '2026-05-06', description: 'Diseño básico de vigas y losas de hormigón armado.'
    },
    {
      id: 'mat-007', title: 'Parcial anterior: análisis estructural', type: 'Prueba', courseCode: 'DAIC-00504', plan: 'planO', courseName: 'Análisis Estructural', semester: 5, year: 2023, format: 'PDF', size: '1.8 MB',
      origin: 'Prof. F. Rivera', status: 'validadoCeal', uploadedBy: 'CEAL', uploadedAt: '2026-05-04', description: 'Prueba anterior para practicar métodos de análisis estructural.'
    },
    {
      id: 'mat-008', title: 'Ejercicios de integrales y series', type: 'Ejercicios', courseCode: 'P-0302', plan: 'planP', courseName: 'Cálculo II', semester: 3, year: 2024, format: 'PDF', size: '1.2 MB',
      origin: 'Ayudantía Cálculo II', status: 'validadoCeal', uploadedBy: 'Ayudantía Cálculo II', uploadedAt: '2026-05-03', description: 'Lista de ejercicios para practicar integrales y series.'
    },
    {
      id: 'mat-009', title: 'Plantilla de informe de laboratorio hidráulico', type: 'Guía', courseCode: 'P-0603', plan: 'planP', courseName: 'Hidráulica General', semester: 6, year: 2023, format: 'DOCX', size: '312 KB',
      origin: 'Docencia CEAL', status: 'validadoCeal', uploadedBy: 'Docencia CEAL', uploadedAt: '2026-05-01', description: 'Plantilla base para informes de laboratorio.'
    },
    {
      id: 'mat-010', title: 'Guía de programación: algoritmos básicos', type: 'Guía', courseCode: 'DAIS-00200', plan: 'planO', courseName: 'Programación', semester: 6, year: 2024, format: 'PDF', size: '2.5 MB',
      origin: 'Ayudantía Programación', status: 'pendienteRevision', uploadedBy: 'Aporte estudiantil', uploadedAt: '2026-05-27', description: 'Material enviado a revisión para ejercicios de algoritmos y estructuras.'
    }
  ];

  const cases = [
    {
      id: 'case-2026-0052', number: '#2026-0052', title: 'Consulta por evaluación', type: 'Académico', status: 'enRevision', priority: 'Normal', createdAt: '2026-05-16T09:30:00',
      courseCode: 'DAIC-00504', courseName: 'Análisis Estructural', responsible: 'Juan Valdés', responsibleRole: 'Coordinación Académica',
      summary: 'Consulta sobre los criterios y ponderaciones de la evaluación parcial de Estructuras I.',
      nextStep: 'La Coordinación Académica revisará tu consulta y responderá a través del caso.', visibility: 'Solo tú y el equipo asignado pueden ver este caso.',
      attachments: [{ name: 'Rúbrica evaluación parcial.pdf', size: '342 KB' }, { name: 'Enunciado parcial.pdf', size: '1.1 MB' }],
      history: [
        { at: '2026-05-16T10:15:00', title: 'Caso asignado a Coordinación Académica', detail: 'El caso fue asignado a Juan Valdés.' },
        { at: '2026-05-16T09:31:00', title: 'Caso recibido', detail: 'Hemos recibido tu caso correctamente.' }
      ]
    },
    {
      id: 'case-2026-0048', number: '#2026-0048', title: 'Sala sin proyector', type: 'Infraestructura', status: 'enSeguimiento', priority: 'Media', createdAt: '2026-05-15T11:00:00',
      courseCode: null, courseName: null, responsible: 'Francisca Rojas', responsibleRole: 'Bienestar', summary: 'Reporte de sala sin proyector operativo para clase semanal.', nextStep: 'Se está coordinando revisión con apoyo de escuela.', visibility: 'Visible para ti y el equipo asignado.', attachments: [], history: [
        { at: '2026-05-15T13:10:00', title: 'En seguimiento', detail: 'Se solicitó revisión del equipamiento.' },
        { at: '2026-05-15T11:02:00', title: 'Caso recibido', detail: 'Reporte ingresado correctamente.' }
      ]
    },
    {
      id: 'case-2026-0043', number: '#2026-0043', title: 'Material pendiente', type: 'Material', status: 'derivado', priority: 'Normal', createdAt: '2026-05-12T17:25:00',
      courseCode: 'P-0603', courseName: 'Hidráulica General', responsible: 'Sofía Neira', responsibleRole: 'Docencia', summary: 'Consulta por material de laboratorio pendiente de publicación.', nextStep: 'Docencia revisará disponibilidad del material.', visibility: 'Visible para ti y el equipo asignado.', attachments: [], history: [
        { at: '2026-05-13T09:05:00', title: 'Derivado a Docencia', detail: 'El caso fue derivado para revisión de material.' },
        { at: '2026-05-12T17:25:00', title: 'Caso recibido', detail: 'Caso registrado.' }
      ]
    },
    {
      id: 'case-2026-0041', number: '#2026-0041', title: 'Solicitud de orientación', type: 'Orientación', status: 'recibido', priority: 'Baja', createdAt: '2026-05-10T09:30:00',
      courseCode: null, courseName: null, responsible: 'Por asignar', responsibleRole: 'Bienestar', summary: 'Solicitud de orientación para organización de carga académica.', nextStep: 'El equipo revisará la solicitud y asignará responsable.', visibility: 'Visible para ti y el equipo asignado.', attachments: [], history: [
        { at: '2026-05-10T09:30:00', title: 'Caso recibido', detail: 'Solicitud registrada.' }
      ]
    },
    {
      id: 'case-2026-0036', number: '#2026-0036', title: 'Problema con inscripción', type: 'Inscripción', status: 'resuelto', priority: 'Alta', createdAt: '2026-05-08T08:45:00',
      courseCode: null, courseName: null, responsible: 'Secretaría CEAL', responsibleRole: 'Secretaría', summary: 'Problema reportado con inscripción a formulario académico.', nextStep: 'Caso resuelto y comunicado al estudiante.', visibility: 'Visible para ti y el equipo asignado.', attachments: [], history: [
        { at: '2026-05-09T10:00:00', title: 'Resuelto', detail: 'Se confirmó corrección del formulario.' },
        { at: '2026-05-08T08:45:00', title: 'Caso recibido', detail: 'Caso registrado.' }
      ]
    },
    {
      id: 'case-2026-0031', number: '#2026-0031', title: 'Duda sobre ayudantía', type: 'Académico', status: 'cerrado', priority: 'Baja', createdAt: '2026-05-03T12:00:00',
      courseCode: 'DAIC-00403', courseName: 'Estática', responsible: 'Francisca Rojas', responsibleRole: 'Ayudantía', summary: 'Duda sobre horario de ayudantía.', nextStep: 'Caso cerrado por el estudiante.', visibility: 'Visible para ti y el equipo asignado.', attachments: [], history: [
        { at: '2026-05-04T09:00:00', title: 'Cerrado', detail: 'El estudiante cerró el caso.' },
        { at: '2026-05-03T12:00:00', title: 'Caso recibido', detail: 'Caso registrado.' }
      ]
    }
  ];

  // Generated by scripts/build-academic-calendar.py; reviewed against PDF pages 3-6.
  const events = [
  {
    "id": "evt-acad-20260703-e79bc8",
    "title": "Cierre de cambio de nombre legal I semestre",
    "type": "Trámite académico",
    "date": "2026-07-03",
    "time": "",
    "description": "Término para solicitud de cambio de nombre legal del I semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260710-31a90b",
    "title": "Oferta definitiva de carreras Admisión 2027",
    "type": "Trámite académico",
    "date": "2026-07-10",
    "time": "",
    "description": "Oferta definitiva de carreras, vacantes y ponderaciones para Admisión 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260711-c8541a",
    "title": "Cierre de suspensión de gratuidad y beneficios I semestre",
    "type": "Trámite académico",
    "date": "2026-07-11",
    "time": "",
    "description": "Cierre del proceso de suspensiones de gratuidad y beneficios: becas y créditos del Estado del I semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260713-44b5e8",
    "title": "Inicio de cambio de carrera II semestre",
    "type": "Trámite académico",
    "date": "2026-07-13",
    "time": "",
    "description": "Inicio de solicitudes de cambio de carrera para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260714-f72999",
    "title": "Resolución de solicitudes de cambio de carrera",
    "type": "Gestión académica",
    "date": "2026-07-14",
    "time": "",
    "description": "Inicio para que las unidades académicas resuelvan solicitudes en el Sistema de Trámites Curriculares.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260717-a4bc4c",
    "title": "Feriado sindical",
    "type": "Receso",
    "date": "2026-07-17",
    "time": "",
    "description": "Feriado sindical indicado en el calendario docente.",
    "campus": "Antofagasta",
    "audience": "general",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260720-39f398",
    "title": "Convalidaciones Minor",
    "type": "Gestión académica",
    "date": "2026-07-20",
    "time": "",
    "description": "Inicio del periodo para que jefaturas de carrera soliciten convalidaciones de asignaturas Minor a DGPRE y SPRE.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260725-4f42b5",
    "title": "Cierre de evaluación docente I semestre",
    "type": "Evaluaciones",
    "date": "2026-07-25",
    "time": "",
    "description": "Término de aplicación de la Encuesta de Evaluación Docente.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260727-b7dcc7",
    "title": "Cierre de Ingresos Especiales II semestre",
    "type": "Trámite académico",
    "date": "2026-07-27",
    "time": "",
    "description": "Término de postulación a carreras de la Universidad según vacantes definidas para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260731-9aaafb",
    "title": "Ajustes mayores y rediseños curriculares",
    "type": "Gestión académica",
    "date": "2026-07-31",
    "time": "",
    "description": "Plazo para enviar a DGPRE ajustes mayores o rediseños curriculares para implementación en el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 3
  },
  {
    "id": "evt-acad-20260801-1b8ea6",
    "title": "Último día de clases I semestre",
    "type": "Fecha académica",
    "date": "2026-08-01",
    "time": "",
    "description": "Último día de clases, talleres y laboratorios; término del periodo de evaluaciones pendientes del I semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260802-f6e83f",
    "title": "Registro de calificaciones parciales I semestre",
    "type": "Gestión académica",
    "date": "2026-08-02",
    "time": "",
    "description": "Último plazo para registrar calificaciones parciales en Banner.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260803-4501e8",
    "title": "Inicio de vacaciones de invierno",
    "type": "Receso",
    "date": "2026-08-03",
    "time": "",
    "description": "Para estudiantes que no rinden exámenes recuperativos o por solicitud.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260803-260e70",
    "title": "Inicio de inscripción a cursos de idiomas",
    "type": "Inscripción",
    "date": "2026-08-03",
    "time": "",
    "description": "Cursos virtuales y presenciales de la DRI.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260803-c9209c",
    "title": "Exámenes por solicitud y recuperación",
    "type": "Evaluaciones",
    "date": "2026-08-03",
    "time": "",
    "description": "Periodo para rendir examen por solicitud (art. 39) y examen de recuperación (art. 33).",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-07"
  },
  {
    "id": "evt-acad-20260803-bfd1bc",
    "title": "Solicitudes de intercambio estudiantil",
    "type": "Trámite académico",
    "date": "2026-08-03",
    "time": "",
    "description": "Solicitudes de intercambio saliente para el I semestre 2027 a la DRI.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-31"
  },
  {
    "id": "evt-acad-20260803-4499c8",
    "title": "Postulación de nuevos programas Minor",
    "type": "Gestión académica",
    "date": "2026-08-03",
    "time": "",
    "description": "Departamentos y escuelas envían a DGPRE propuestas para ofertar en el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4,
    "endDate": "2026-08-31"
  },
  {
    "id": "evt-acad-20260804-99524c",
    "title": "Cierre de solicitudes de cambio de carrera",
    "type": "Trámite académico",
    "date": "2026-08-04",
    "time": "",
    "description": "El documento identifica este cierre como correspondiente al I semestre 2026; se conserva esa indicación sin equipararlo al inicio del II semestre del 13 de julio.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260804-11e463",
    "title": "Claustro Pleno UCN Antofagasta",
    "type": "Trámite académico",
    "date": "2026-08-04",
    "time": "",
    "description": "Claustro Pleno UCN Antofagasta.",
    "campus": "Antofagasta",
    "audience": "general",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260808-cf2c6a",
    "title": "Cierre de actividades docentes I semestre",
    "type": "Trámite académico",
    "date": "2026-08-08",
    "time": "13:00",
    "description": "Último día de actividades docentes y registro de calificaciones finales en Banner, hasta las 13:00.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260809-c7c760",
    "title": "Cierre y consolidación curricular I semestre",
    "type": "Gestión académica",
    "date": "2026-08-09",
    "time": "",
    "description": "Periodo de cierre y consolidación de información curricular en Banner del I semestre 2026.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4,
    "endDate": "2026-08-16"
  },
  {
    "id": "evt-acad-20260811-ec295b",
    "title": "Inscripción de estudiantes internacionales",
    "type": "Inscripción",
    "date": "2026-08-11",
    "time": "",
    "description": "Inscripción de asignaturas a estudiantes internacionales en intercambio presencial o virtual en UCN.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-13"
  },
  {
    "id": "evt-acad-20260812-37773c",
    "title": "Cierre de resolución de cambios de carrera",
    "type": "Gestión académica",
    "date": "2026-08-12",
    "time": "",
    "description": "Término para resolver solicitudes de cambio de carrera en el Sistema de Trámites Curriculares.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260813-7746cd",
    "title": "Jornada de Reflexión Docente",
    "type": "Trámite académico",
    "date": "2026-08-13",
    "time": "",
    "description": "Jornada de Reflexión Docente Antofagasta.",
    "campus": "Antofagasta",
    "audience": "general",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260815-35d524",
    "title": "Inicio de renuncias a la Universidad",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Solicitudes de renuncia a la Universidad para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260815-e3cf21",
    "title": "Inicio de cambio de nombre legal II semestre",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Inicio de solicitudes de cambio de nombre legal del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260815-06ff5d",
    "title": "Reintegros de estudiantes eliminados",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Solicitudes de reintegro para el II semestre 2026 de estudiantes eliminados.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-19"
  },
  {
    "id": "evt-acad-20260815-c29cd8",
    "title": "Retiro temporal II semestre",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Periodo de solicitud de retiro temporal del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-19"
  },
  {
    "id": "evt-acad-20260815-386135",
    "title": "Reconocimiento de actividades extracurriculares",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Solicitudes a DGPRE para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-31"
  },
  {
    "id": "evt-acad-20260815-5e0532",
    "title": "Matrícula en situaciones especiales",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Estudiantes con retiro temporal del I semestre, reintegrados sin matrícula del I semestre, ingresos especiales del II semestre y egresados eliminados.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-31"
  },
  {
    "id": "evt-acad-20260815-e3f4bf",
    "title": "Convalidación de asignaturas II semestre",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Periodo de solicitud de convalidación de asignaturas para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-22"
  },
  {
    "id": "evt-acad-20260815-6a565c",
    "title": "Reintegro de egresados con titulación pendiente",
    "type": "Trámite académico",
    "date": "2026-08-15",
    "time": "",
    "description": "Solicitudes de reintegro de egresados eliminados para el año académico 2026, con actividad de titulación pendiente.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-22"
  },
  {
    "id": "evt-acad-20260817-e5f47e",
    "title": "Resolución de convalidaciones",
    "type": "Gestión académica",
    "date": "2026-08-17",
    "time": "",
    "description": "Unidades académicas resuelven solicitudes de convalidación en el Sistema de Trámites Curriculares.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4,
    "endDate": "2026-08-26"
  },
  {
    "id": "evt-acad-20260817-7f3a2b",
    "title": "Reporte de estudiantes eliminados y en alerta",
    "type": "Gestión académica",
    "date": "2026-08-17",
    "time": "",
    "description": "Habilitación del reporte de estudiantes eliminados del I semestre y en alerta académica para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260817-bd8fe0",
    "title": "Inscripción de asignaturas",
    "type": "Inscripción",
    "date": "2026-08-17",
    "time": "",
    "description": "Jornada de la mañana: estudiantes matriculados MAPAU y residentes en la comuna de Mejillones. Jornada de la tarde: inicio por facultad o unidad para estudiantes matriculados.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260817-23c86f",
    "title": "Resolución de reintegros",
    "type": "Gestión académica",
    "date": "2026-08-17",
    "time": "",
    "description": "Unidades académicas resuelven solicitudes de reintegro de estudiantes eliminados en el Sistema de Trámites Curriculares.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4,
    "endDate": "2026-08-24"
  },
  {
    "id": "evt-acad-20260818-17cc63",
    "title": "Inscripción de Formación General Electiva",
    "type": "Inscripción",
    "date": "2026-08-18",
    "time": "",
    "description": "Inicio de inscripción de asignaturas FGE durante la jornada de la tarde.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260819-cf4d60",
    "title": "Levantamiento de prerrequisitos",
    "type": "Trámite académico",
    "date": "2026-08-19",
    "time": "",
    "description": "Solicitudes de estudiantes a jefaturas de carrera.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-31"
  },
  {
    "id": "evt-acad-20260820-2910fd",
    "title": "Asignaturas por examen o tutoría",
    "type": "Trámite académico",
    "date": "2026-08-20",
    "time": "",
    "description": "Periodo de solicitud para rendir asignatura por examen (art. 39) y tutoría (art. 37) para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4,
    "endDate": "2026-08-31"
  },
  {
    "id": "evt-acad-20260820-ca1aef",
    "title": "Inicio de clases II semestre",
    "type": "Fecha académica",
    "date": "2026-08-20",
    "time": "",
    "description": "Inicio de clases del II semestre 2026 en Antofagasta.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260820-f3d8be",
    "title": "Inicio de rectificación de calificaciones",
    "type": "Trámite académico",
    "date": "2026-08-20",
    "time": "",
    "description": "Rectificación de calificaciones de asignaturas del I semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260820-2d5de9",
    "title": "Inicio de solicitudes de anulación",
    "type": "Trámite académico",
    "date": "2026-08-20",
    "time": "",
    "description": "Inicio de solicitud de anulación de periodo académico.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260821-119c45",
    "title": "Inscripción por Jefatura de carrera",
    "type": "Inscripción",
    "date": "2026-08-21",
    "time": "",
    "description": "Inicio de inscripción de asignaturas por parte de las jefaturas de carrera.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260825-691d40",
    "title": "Comisión de Casos Especiales",
    "type": "Trámite académico",
    "date": "2026-08-25",
    "time": "",
    "description": "Reunión de la Comisión de Casos Especiales de estudiantes eliminados de Antofagasta.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260825-a322ae",
    "title": "Reporte de estudiantes sin inscripción",
    "type": "Gestión académica",
    "date": "2026-08-25",
    "time": "",
    "description": "Habilitación del reporte de estudiantes sin inscripción de asignaturas.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260827-93cf44",
    "title": "Cierre de convalidaciones Minor",
    "type": "Gestión académica",
    "date": "2026-08-27",
    "time": "",
    "description": "Plazo para que jefaturas soliciten convalidaciones Minor a DGPRE y Secretaría de Pregrado y Estudiantil de Sede.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 4
  },
  {
    "id": "evt-acad-20260901-09f535",
    "title": "Registro de fechas de evaluaciones",
    "type": "Gestión académica",
    "date": "2026-09-01",
    "time": "",
    "description": "Plazo para incorporar al sistema institucional las fechas de evaluaciones de componentes o subcomponentes definidos en el acta de calificaciones.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20260901-19ab66",
    "title": "Propuestas de nuevas asignaturas electivas",
    "type": "Gestión académica",
    "date": "2026-09-01",
    "time": "",
    "description": "Departamentos y escuelas envían nuevas asignaturas de Formación General y Profesional Electiva para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5,
    "endDate": "2026-09-11"
  },
  {
    "id": "evt-acad-20260901-e0da8f",
    "title": "Oferta académica 2027: generación",
    "type": "Gestión académica",
    "date": "2026-09-01",
    "time": "",
    "description": "Etapa 1: generación de la oferta académica del I semestre 2027 por parte de las unidades.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5,
    "endDate": "2026-09-29"
  },
  {
    "id": "evt-acad-20260904-97f30a",
    "title": "Cierre de inscripción de asignaturas",
    "type": "Inscripción",
    "date": "2026-09-04",
    "time": "",
    "description": "Término de inscripción de asignaturas por parte de estudiantes.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20260905-d9efea",
    "title": "Cierre de rectificación de calificaciones",
    "type": "Trámite académico",
    "date": "2026-09-05",
    "time": "",
    "description": "Término para rectificar calificaciones de asignaturas del I semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20260911-46a09f",
    "title": "Cierre de inscripción a cursos de idiomas",
    "type": "Inscripción",
    "date": "2026-09-11",
    "time": "",
    "description": "Término de inscripción a cursos de idiomas virtuales y presenciales de la DRI.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20260912-144a4b",
    "title": "Cierre de inscripción por Jefatura",
    "type": "Inscripción",
    "date": "2026-09-12",
    "time": "",
    "description": "Término de inscripción de asignaturas por parte de las jefaturas de carrera.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20260914-de80c1",
    "title": "Receso Fiestas Patrias",
    "type": "Receso",
    "date": "2026-09-14",
    "time": "",
    "description": "Receso de Fiestas Patrias del 14 al 20 de septiembre, ambas fechas incluidas.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5,
    "endDate": "2026-09-20"
  },
  {
    "id": "evt-acad-20260930-81a36c",
    "title": "Oferta académica 2027: ingreso en Banner",
    "type": "Gestión académica",
    "date": "2026-09-30",
    "time": "",
    "description": "Etapa 2: ingreso de oferta académica al sistema Banner o actualización del histórico por unidades (rolado).",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20260930-fc071c",
    "title": "Cambios menores que modifican Banner",
    "type": "Gestión académica",
    "date": "2026-09-30",
    "time": "",
    "description": "Plazo para enviar cambios de créditos, prerrequisitos, niveles o nombres de asignaturas para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261001-80ae31",
    "title": "Inicio de Ingresos Especiales 2027",
    "type": "Trámite académico",
    "date": "2026-10-01",
    "time": "",
    "description": "Postulación a carreras de la Universidad según vacantes definidas para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261001-22d159",
    "title": "Oferta académica 2027: actualización",
    "type": "Gestión académica",
    "date": "2026-10-01",
    "time": "",
    "description": "Etapa 3: actualización de oferta académica del I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5,
    "endDate": "2026-10-30"
  },
  {
    "id": "evt-acad-20261002-f55a14",
    "title": "Reporte de proyecciones de oferta académica",
    "type": "Gestión académica",
    "date": "2026-10-02",
    "time": "",
    "description": "Habilitación del reporte de proyecciones de oferta académica del I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261009-d52b7e",
    "title": "Cierre de solicitudes de anulación",
    "type": "Trámite académico",
    "date": "2026-10-09",
    "time": "",
    "description": "Término para solicitar anulación de periodo académico.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261009-da788e",
    "title": "Cambios menores sin modificación de Banner",
    "type": "Gestión académica",
    "date": "2026-10-09",
    "time": "",
    "description": "Plazo para enviar cambios de contenidos, metodologías didácticas, sistemas de evaluación o bibliografía para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261013-aeccd5",
    "title": "Renuncia de asignaturas II semestre",
    "type": "Trámite académico",
    "date": "2026-10-13",
    "time": "",
    "description": "Periodo de renuncia de asignaturas del II semestre 2026 por parte de estudiantes.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5,
    "endDate": "2026-10-30"
  },
  {
    "id": "evt-acad-20261019-e780d3",
    "title": "Semana de autocuidado",
    "type": "Bienestar",
    "date": "2026-10-19",
    "time": "",
    "description": "Semana de Autocuidado para estudiantes del 19 al 24 de octubre.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5,
    "endDate": "2026-10-24"
  },
  {
    "id": "evt-acad-20261023-03bb94",
    "title": "Suspensión de gratuidad y beneficios II semestre",
    "type": "Trámite académico",
    "date": "2026-10-23",
    "time": "",
    "description": "Plazo para suspensiones de gratuidad y beneficios: becas y créditos del Estado del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261027-067616",
    "title": "Solicitudes de parte-periodos distintos",
    "type": "Gestión académica",
    "date": "2026-10-27",
    "time": "",
    "description": "Unidades académicas envían a DGPRE solicitudes de parte-periodos distintos para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5,
    "endDate": "2026-10-30"
  },
  {
    "id": "evt-acad-20261030-8ba6bc",
    "title": "Cierre de reintegro para trámite de título o grado",
    "type": "Trámite académico",
    "date": "2026-10-30",
    "time": "",
    "description": "Término de solicitudes de reintegro de egresados eliminados solo para trámite de título o grado.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261030-1e9481",
    "title": "Asignaturas de movilidad virtual 2027",
    "type": "Gestión académica",
    "date": "2026-10-30",
    "time": "",
    "description": "Plazo para que departamentos y escuelas envíen a DGPRE postulaciones para asignaturas de movilidad virtual del I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261102-b80637",
    "title": "Evaluaciones pendientes II semestre",
    "type": "Evaluaciones",
    "date": "2026-11-02",
    "time": "",
    "description": "Inicio del periodo de evaluaciones pendientes del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261102-59e3aa",
    "title": "Inicio de solicitudes de traslado a UCN",
    "type": "Trámite académico",
    "date": "2026-11-02",
    "time": "",
    "description": "Solicitudes de traslado de universidad a UCN para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261102-92c7d7",
    "title": "Inicio de postulación a Minor",
    "type": "Trámite académico",
    "date": "2026-11-02",
    "time": "",
    "description": "Postulación por parte de estudiantes para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261106-0a3ec5",
    "title": "Cierre de cambio de nombre legal II semestre",
    "type": "Trámite académico",
    "date": "2026-11-06",
    "time": "",
    "description": "Término de solicitudes de cambio de nombre legal del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261106-e4a988",
    "title": "Arancel de obtención de títulos y grados",
    "type": "Trámite académico",
    "date": "2026-11-06",
    "time": "",
    "description": "Plazo para pago mediante tramit curricular para la Ceremonia de Titulación 2026. Fecha sujeta a modificaciones según el documento.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261113-c26515",
    "title": "Cierre de renuncias a la Universidad",
    "type": "Trámite académico",
    "date": "2026-11-13",
    "time": "",
    "description": "Término de solicitudes de renuncia a la Universidad para el II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261115-9ded54",
    "title": "Postulación de colaboración en modalidad virtual",
    "type": "Gestión académica",
    "date": "2026-11-15",
    "time": "",
    "description": "Inicio de postulaciones que docentes envían a DRI para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261116-f53321",
    "title": "Inicio de evaluación docente",
    "type": "Evaluaciones",
    "date": "2026-11-16",
    "time": "",
    "description": "Inicio de aplicación de la Encuesta de Evaluación Docente.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 5
  },
  {
    "id": "evt-acad-20261201-c56050",
    "title": "Oferta de Cursos de Verano 2027",
    "type": "Cursos de verano",
    "date": "2026-12-01",
    "time": "",
    "description": "Periodo de oferta académica de Cursos de Verano 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "endDate": "2026-12-19"
  },
  {
    "id": "evt-acad-20261207-6d00d9",
    "title": "Inicio de cambio de carrera 2027",
    "type": "Trámite académico",
    "date": "2026-12-07",
    "time": "",
    "description": "Inicio de solicitudes de cambio de carrera para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261210-9e8dc7",
    "title": "Postulación y selección de especialidad",
    "type": "Trámite académico",
    "date": "2026-12-10",
    "time": "",
    "description": "Plazo de postulación y selección de especialidad 2027 para Ingeniería Civil Plan Común.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261211-1b943c",
    "title": "Cierre de Ingresos Especiales 2027",
    "type": "Trámite académico",
    "date": "2026-12-11",
    "time": "",
    "description": "Término de postulación a carreras de la Universidad según vacantes del I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261212-b2da60",
    "title": "Cierre de evaluación docente",
    "type": "Evaluaciones",
    "date": "2026-12-12",
    "time": "",
    "description": "Término de aplicación de la Encuesta de Evaluación Docente.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261214-3a0aec",
    "title": "Postulación y matrícula de Cursos de Verano",
    "type": "Cursos de verano",
    "date": "2026-12-14",
    "time": "",
    "description": "Inicio de postulación y matrícula de Cursos de Verano 2027 mediante tramitcurricular.ucn.cl.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261219-376eb1",
    "title": "Último día de clases II semestre",
    "type": "Fecha académica",
    "date": "2026-12-19",
    "time": "",
    "description": "Último día de clases, talleres y laboratorios; término de evaluaciones pendientes del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261219-ced5c4",
    "title": "Cierre de postulación a Minor",
    "type": "Trámite académico",
    "date": "2026-12-19",
    "time": "",
    "description": "Término de postulación por parte de estudiantes para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261219-d14754",
    "title": "Registro de calificaciones parciales II semestre",
    "type": "Gestión académica",
    "date": "2026-12-19",
    "time": "",
    "description": "Último día para registrar calificaciones parciales en Banner.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261221-ebaf46",
    "title": "Inicio de vacaciones de verano",
    "type": "Receso",
    "date": "2026-12-21",
    "time": "",
    "description": "Para estudiantes que no rinden exámenes por solicitud o recuperativos.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261221-62ab43",
    "title": "Exámenes por solicitud y recuperativos",
    "type": "Evaluaciones",
    "date": "2026-12-21",
    "time": "",
    "description": "Periodo para rendir examen por solicitud (art. 39) y exámenes recuperativos (art. 33).",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "endDate": "2026-12-29"
  },
  {
    "id": "evt-acad-20261230-c3c2aa",
    "title": "Cierre académico II semestre",
    "type": "Fecha académica",
    "date": "2026-12-30",
    "time": "13:00",
    "description": "Último día de actividades docentes y registro de calificaciones finales en Banner, hasta las 13:00.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261230-62c7fd",
    "title": "Inicio de cierre y consolidación curricular",
    "type": "Gestión académica",
    "date": "2026-12-30",
    "time": "13:00",
    "description": "Inicio del cierre y consolidación de información curricular del II semestre 2026 desde las 13:00.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261230-5dcfc4",
    "title": "Cierre de cambio de nombre social",
    "type": "Trámite académico",
    "date": "2026-12-30",
    "time": "",
    "description": "Término de solicitud de cambio de nombre social, según la denominación del documento.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20261230-e04371",
    "title": "Cierre de colaboración en modalidad virtual",
    "type": "Gestión académica",
    "date": "2026-12-30",
    "time": "",
    "description": "Término de postulaciones de actividades de colaboración que docentes envían a DRI para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 6
  },
  {
    "id": "evt-acad-20270103-6deaa9",
    "title": "Cierre de matrícula Cursos de Verano",
    "type": "Cursos de verano",
    "date": "2027-01-03",
    "time": "",
    "description": "Término de postulación y matrícula de Cursos de Verano 2027 mediante tramitcurricular.ucn.cl.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270105-add2ca",
    "title": "Cierre y consolidación curricular II semestre",
    "type": "Gestión académica",
    "date": "2027-01-05",
    "time": "",
    "description": "Término del cierre y consolidación de información curricular del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-7a9962",
    "title": "Inicio de renuncias a la Universidad 2027",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Inicio de solicitudes de renuncia a la Universidad para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-b4a181",
    "title": "Reintegro para trámite de título o grado 2027",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Inicio de solicitudes de reintegro de egresados eliminados solo para trámite de título o grado 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-a211e0",
    "title": "Reintegro de egresados con titulación pendiente 2027",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Inicio de solicitudes de reintegro de egresados eliminados para el año académico 2027, con actividad de titulación pendiente.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-6ac412",
    "title": "Inicio de retiro temporal 2027",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Inicio de solicitudes de retiro temporal para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-3016b0",
    "title": "Rectificación de calificaciones de titulación",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Plazo para rectificar calificaciones de actividades de titulación: defensas de tesis, exámenes u otras actividades de término del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "endDate": "2027-01-15",
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-a8c4da",
    "title": "Reintegros de estudiantes eliminados 2027",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Periodo de solicitud de reintegros para el I semestre 2027 de estudiantes eliminados.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "endDate": "2027-01-15",
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-626d2b",
    "title": "Rectificación de calificaciones II semestre",
    "type": "Trámite académico",
    "date": "2027-01-06",
    "time": "",
    "description": "Periodo para rectificar calificaciones de asignaturas del II semestre 2026.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "endDate": "2027-01-29",
    "provisional": true
  },
  {
    "id": "evt-acad-20270106-b1cade",
    "title": "Convalidaciones Minor 2027",
    "type": "Gestión académica",
    "date": "2027-01-06",
    "time": "",
    "description": "Periodo para que jefaturas de carrera soliciten convalidaciones de asignaturas Minor a DGPRE y SPRE.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 6,
    "endDate": "2027-01-29",
    "provisional": true
  },
  {
    "id": "evt-acad-20270107-74365f",
    "title": "Cursos de Verano 2027",
    "type": "Cursos de verano",
    "date": "2027-01-07",
    "time": "",
    "description": "Periodo de clases de Cursos de Verano 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "endDate": "2027-01-28",
    "provisional": true
  },
  {
    "id": "evt-acad-20270108-b96e7e",
    "title": "Selección de estudiantes Minor",
    "type": "Gestión académica",
    "date": "2027-01-08",
    "time": "",
    "description": "Último plazo para que unidades académicas envíen la lista de selección de estudiantes Minor del I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "unidades",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270110-6304be",
    "title": "Cierre de cambio de carrera 2027",
    "type": "Trámite académico",
    "date": "2027-01-10",
    "time": "",
    "description": "Término de solicitudes de cambio de carrera para el I semestre 2027.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  },
  {
    "id": "evt-acad-20270111-2650b8",
    "title": "Cierre de solicitudes de traslado a UCN",
    "type": "Trámite académico",
    "date": "2027-01-11",
    "time": "",
    "description": "Término de solicitudes de traslado de universidad a UCN.",
    "campus": "Antofagasta",
    "audience": "estudiantes",
    "sourcePage": 6,
    "provisional": true
  }
];

  const calendarSource = {
  "version": "dgpre-antofagasta-decreto-077-2026-reviewed-20260921",
  "title": "Calendario de Actividades Docentes de Pregrado Antofagasta 2026",
  "institution": "Dirección General de Pregrado UCN",
  "campus": "Antofagasta",
  "updatedAt": "2026-07-08",
  "reviewedAt": "2026-09-21",
  "coverageStart": "2026-07-01",
  "coverageEnd": "2027-01-31",
  "decree": "Decreto N°77/2026",
  "url": "https://www.ucn.cl/content/uploads/2026/08/077-modifica-Calendario-de-Actividades-Docentes-Antofagasta-DGPRE-090-2026-VF-13-Julio-3.pdf",
  "fileUrl": "assets/documents/calendario-antofagasta-077-2026.pdf",
  "note": "Julio 2026 a enero 2027. La planificación de enero está sujeta a modificaciones."
};

  const agreements = [
    {
      id: 'agr-paro-003', number: 'Seguimiento N°03/2026', status: 'enSeguimiento', date: '2026-06-17T10:00:00', origin: 'Mesa de negociación y petitorio estudiantil', responsible: 'CEAL Ingeniería Civil UCN',
      title: 'Negociación diaria y resguardo de recalendarización académica',
      summary: 'Se informa que la recalendarización académica ya fue planteada y que las mesas de trabajo sesionarán diariamente entre 10:00 y 17:00 para buscar respuestas concretas al petitorio.',
      currentState: 'En seguimiento. CEAL mantendrá informada a la carrera sobre avances, pleno eventual y respuestas de autoridad.',
      nextStep: 'Esperar avances formales de la mesa de negociación y comunicar cualquier pleno o decisión relevante.',
      documents: [
        { name: 'Comunicado estado de movilización 17-06-2026', type: 'Comunicado', size: 'Portal' }
      ],
      commitments: [
        { title: 'Informar avances de negociación', responsible: 'Comunicaciones CEAL', due: '2026-06-18', status: 'enSeguimiento' },
        { title: 'Mantener coordinación de turnos y porterías', responsible: 'CEAL Ingeniería Civil UCN', due: '2026-06-18', status: 'enSeguimiento' }
      ],
      history: [
        { at: '2026-06-17T10:00:00', title: 'Petitorio revisado', detail: 'Se revisó el petitorio completo y se informó que las respuestas aún no incorporan avances significativos.' },
        { at: '2026-06-16T20:00:00', title: 'Recalendarización planteada', detail: 'La recalendarización de actividades académicas fue incorporada a las conversaciones.' }
      ]
    },
    {
      id: 'agr-paro-002', number: 'Seguimiento N°02/2026', status: 'actualizado', date: '2026-06-16T18:30:00', origin: 'Organización de toma universitaria', responsible: 'CEAL Ingeniería Civil UCN',
      title: 'Turnos de resguardo del departamento',
      summary: 'Se coordinan turnos de mañana, tarde y noche para resguardar el departamento durante la toma institucional.',
      currentState: 'Turnos abiertos para estudiantes que puedan apoyar presencialmente.',
      nextStep: 'Recibir disponibilidad de estudiantes y ajustar cobertura de mañana, tarde y noche.',
      documents: [
        { name: 'Comunicado turnos de resguardo 16-06-2026', type: 'Comunicado', size: 'Portal' }
      ],
      commitments: [
        { title: 'Consolidar disponibilidad de turnos', responsible: 'CEAL Ingeniería Civil UCN', due: '2026-06-17', status: 'enSeguimiento' },
        { title: 'Coordinar insumos para permanencia', responsible: 'CEAL Ingeniería Civil UCN', due: '2026-06-17', status: 'pendiente' }
      ],
      history: [
        { at: '2026-06-16T18:30:00', title: 'Turnos difundidos', detail: 'Se publicaron bloques de mañana, tarde y noche para apoyar el resguardo.' }
      ]
    },
    {
      id: 'agr-paro-001', number: 'Seguimiento N°01/2026', status: 'publicado', date: '2026-06-15T15:30:00', origin: 'Pleno universitario', responsible: 'CEAL Ingeniería Civil UCN',
      title: 'Inicio de toma institucional e incorporación de Ingeniería Civil',
      summary: 'Tras el pleno universitario del lunes 15, Ingeniería Civil se suma oficialmente a la toma institucional y CEAL inicia coordinación de turnos e insumos.',
      currentState: 'Publicado e informado a la carrera mediante los canales oficiales.',
      nextStep: 'Mantener canales oficiales actualizados y levantar impacto académico mediante formulario.',
      documents: [
        { name: 'Formulario impacto instructivo académico', type: 'Formulario', size: 'Google Forms' },
        { name: 'Comunicado inicio de toma 15-06-2026', type: 'Comunicado', size: 'Portal' }
      ],
      commitments: [
        { title: 'Levantar impacto académico por ramo', responsible: 'CEAL Ingeniería Civil UCN', due: '2026-06-16', status: 'completado' },
        { title: 'Publicar actualizaciones por canales oficiales', responsible: 'Comunicaciones CEAL', due: '2026-06-17', status: 'enSeguimiento' }
      ],
      history: [
        { at: '2026-06-15T15:30:00', title: 'Ingeniería Civil se suma a la toma', detail: 'Se comunicó la incorporación de la carrera a la toma institucional.' },
        { at: '2026-06-14T19:30:00', title: 'Formulario publicado', detail: 'Se abrió formulario para conocer postura e impacto del instructivo académico.' }
      ]
    }
  ];

  const tutoring = [
    { id: 'ay-001', title: 'Ayudantía de Estática', courseCode: 'DAIC-00403', courseName: 'Estática', date: '2026-05-29', time: '15:30 - 17:00', location: 'Aula 210 · Edificio IC', mode: 'Presencial', tutor: 'Francisca Rojas', materialId: 'mat-001' },
    { id: 'ay-002', title: 'Repaso Cálculo II', courseCode: 'P-0302', courseName: 'Cálculo II', date: '2026-06-01', time: '10:00 - 11:30', location: 'Google Meet', mode: 'Online', tutor: 'Diego Araya', materialId: 'mat-008' },
    { id: 'ay-003', title: 'Laboratorio de Hidráulica', courseCode: 'P-0603', courseName: 'Hidráulica General', date: '2026-06-03', time: '14:00 - 16:00', location: 'Lab. Hidráulica', mode: 'Presencial', tutor: 'Camila Rojas', materialId: 'mat-009' }
  ];

  const procedures = [
    { id: 'proc-001', title: 'Solicitud de apoyo académico', due: '2026-06-07', status: 'abierto', required: ['Correo institucional', 'Ramo asociado', 'Descripción de la solicitud'], responsible: 'Unidad de Apoyo Estudiantil', description: 'Solicitud de apoyo para situaciones académicas que requieren orientación o derivación.' },
    { id: 'proc-002', title: 'Inscripción a ayudantías', due: '2026-05-28', status: 'abierto', required: ['Nombre', 'Correo institucional', 'Ramos de interés'], responsible: 'Docencia CEAL', description: 'Inscripción a ayudantías disponibles para el semestre.' },
    { id: 'proc-003', title: 'Consulta académica formal', due: '2026-06-15', status: 'enRevision', required: ['Descripción de consulta', 'Ramo o unidad relacionada'], responsible: 'Dirección de Docencia', description: 'Formulario para consultas académicas formales.' }
  ];

  const surveys = [];

  const staffProfiles = [
    {
      id: 'jefatura-ingenieria-civil',
      name: 'Jefatura de carrera',
      displayName: 'Jefatura de carrera',
      contactName: 'Jefe de carrera',
      role: 'Ingeniería Civil UCN',
      email: 'jc.icivil.afta@ucn.cl',
      authorizedEmails: [
        'jc.icivil.afta@ucn.cl',
        'martina.briceno@alumnos.ucn.cl',
        'kevin.cortes@alumnos.ucn.cl'
      ],
      calendarUrl: '',
      bookingUrl: '',
      status: 'Horarios publicados',
      description: 'Horarios de atención e información oficial de Jefatura de carrera.',
      bookingSettings: { active: true, slotMinutes: 30, bookingWindowDays: 21, minimumNoticeHours: 1, validFrom: '2026-08-20', validUntil: '2026-12-19' },
      officeHours: [
        { id: 'oh-001', day: 'Martes', start: '11:30', end: '13:00', time: '11:30 - 13:00', mode: 'Presencial', place: 'Departamento de Ingeniería Civil', meetingUrl: '', status: 'Reserva directa' },
        { id: 'oh-002', day: 'Jueves', start: '15:00', end: '16:30', time: '15:00 - 16:30', mode: 'Mixto', place: 'Departamento de Ingeniería Civil', meetingUrl: '', status: 'Reserva directa' }
      ],
      notes: ['Las horas disponibles quedan reservadas de inmediato.', 'Si Jefatura cancela una atención, el estudiante recibe un correo para reagendar.']
    }
  ];

  const faqs = [
    { q: '¿Dónde reviso material por ramo?', a: 'En Material puedes buscar por ramo, código, tipo de recurso o semestre. Desde la malla también puedes abrir el material del ramo seleccionado.' },
    { q: '¿Dónde reviso mi malla?', a: 'En Mallas puedes alternar Plan O y Plan P, usar modo oscuro y abrir la vista foco para estudiar con más espacio.' },
    { q: '¿Dónde veo avisos sobre movilización o acuerdos?', a: 'En Comunicados puedes revisar avisos publicados por CEAL. En Calendario aparecen los acuerdos y seguimientos asociados cuando existan.' },
    { q: '¿Cómo encuentro mi malla?', a: 'En Mallas selecciona Plan O o Plan P. Puedes buscar ramos y revisar prerrequisitos.' },
    { q: '¿Cómo contacto al CEAL?', a: 'Revisa Comunicados para información oficial de contacto y canales activos del CEAL.' }
  ];

  const notifications = [
    { id: 'not-002', title: 'Calendario académico actualizado', detail: 'Fechas oficiales 2026 desde junio en adelante.', date: '17 jun, 09:30', unread: true, route: '/calendario' },
    { id: 'not-003', title: 'Biblioteca disponible', detail: 'Material organizado por ramos reales de la malla.', date: '16 jun, 18:40', unread: true, route: '/material' }
  ];

  const saved = {
    resources: ['mat-001', 'mat-003', 'mat-007'],
    courses: ['planO:DAIC-00504', 'planP:P-0505'],
    reminders: ['evt-001', 'ay-001']
  };

  const driveResources = Array.isArray(window.PortalDriveMaterials) ? window.PortalDriveMaterials : [];
  const driveIds = new Set(driveResources.map((item) => item.id));
  const allResources = driveResources.length
    ? driveResources
    : resources.filter((item) => !driveIds.has(item.id));
  const savedState = driveResources.length
    ? { ...saved, resources: saved.resources.filter((id) => driveIds.has(id)) }
    : saved;
  const tutoringState = driveResources.length
    ? tutoring.map((item) => ({ ...item, materialId: driveResources.find((resource) => resource.courseCode === item.courseCode)?.id || '' }))
    : tutoring;

  return { users, cealMembers, communications, resources: allResources, cases, events, calendarSource, agreements, tutoring: tutoringState, procedures, surveys, staffProfiles, faqs, notifications, saved: savedState };
})();
