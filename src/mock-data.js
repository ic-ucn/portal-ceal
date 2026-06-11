window.PortalMock = (() => {
  const today = '2026-05-27';

  const cealMembers = [
    { id: 'ceal-martina-briceno', username: 'martina.briceno', name: 'Martina Briceño', initials: 'MB', role: 'ceal', roleName: 'Presidencia', label: 'Presidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'martina.briceno@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'manage:roles', 'review:casos', 'publish:comunicados', 'upload:acuerdos'] },
    { id: 'ceal-camila-villegas', username: 'camila.villegas', name: 'Camila Villegas', initials: 'CV', role: 'ceal', roleName: 'Vicepresidencia', label: 'Vicepresidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'camila.villegas@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'review:casos', 'edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-matias-gonzalez', username: 'matias.gonzalez', name: 'Matías González', initials: 'MG', role: 'ceal', roleName: 'Secretaría', label: 'Secretaría', plan: 'planP', yearLabel: 'CEAL 2026', email: 'matias.gonzalez@alumnos.ucn.cl', passwordSet: false, permissions: ['publish:comunicados', 'edit:calendario', 'upload:acuerdos', 'review:casos', 'manage:forms'] },
    { id: 'ceal-belen-astudillo', username: 'belen.astudillo', name: 'Belén Astudillo', initials: 'BA', role: 'ceal', roleName: 'Tesorería', label: 'Tesorería', plan: 'planP', yearLabel: 'CEAL 2026', email: 'belen.astudillo@alumnos.ucn.cl', passwordSet: false, permissions: ['review:casos', 'edit:calendario', 'manage:forms'] },
    { id: 'ceal-gabriel-sanchez', username: 'gabriel.sanchez', name: 'Gabriel Sánchez', initials: 'GS', role: 'ceal', roleName: 'Comunicaciones', label: 'Comunicaciones', plan: 'planP', yearLabel: 'CEAL 2026', email: 'gabriel.sanchez@alumnos.ucn.cl', passwordSet: false, permissions: ['publish:comunicados', 'edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-bruno-castillo', username: 'bruno.castillo', name: 'Bruno Castillo', initials: 'BC', role: 'ceal', roleName: 'Docencia', label: 'Docencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'bruno.castillo@alumnos.ucn.cl', passwordSet: false, permissions: ['validate:material', 'review:casos', 'edit:mallas', 'manage:tutoring'] },
    { id: 'ceal-paolo-cardaniz', username: 'paolo.cardaniz', name: 'Paolo Cardaniz', initials: 'PC', role: 'ceal', roleName: 'Deportes', label: 'Deportes', plan: 'planP', yearLabel: 'CEAL 2026', email: 'paolo.cardaniz@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'publish:comunicados', 'review:casos'] },
    { id: 'ceal-paolo-ferruzola', username: 'paolo.ferruzola', name: 'Paolo Ferruzola', initials: 'PF', role: 'ceal', roleName: 'Extracurricular', label: 'Extracurricular', plan: 'planP', yearLabel: 'CEAL 2026', email: 'paolo.ferruzola@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'publish:comunicados', 'manage:forms'] },
    { id: 'ceal-kevin-cortes', username: 'kevin.cortes', name: 'Kevin Cortés', initials: 'KC', role: 'ceal', roleName: 'Tecnología', label: 'Tecnología', plan: 'planP', yearLabel: 'CEAL 2026', email: 'kevin.cortes@alumnos.ucn.cl', passwordSet: false, permissions: ['review:casos', 'publish:comunicados', 'manage:forms'] }
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

  const courseProgress = {
    'planP:P-0101': 'approved',
    'planP:P-0102': 'approved',
    'planP:P-0103': 'approved',
    'planP:P-0104': 'approved',
    'planP:DDOC-01184': 'approved',
    'planP:P-0201': 'approved',
    'planP:P-0202': 'approved',
    'planP:P-0203': 'approved',
    'planP:P-0204': 'approved',
    'planP:DDOC-02184': 'approved',
    'planP:P-0301': 'approved',
    'planP:P-0302': 'approved',
    'planP:P-0303': 'approved',
    'planP:P-0304': 'approved',
    'planP:DDOC-03183': 'approved',
    'planP:P-0401': 'inProgress',
    'planP:P-0402': 'inProgress',
    'planP:P-0403': 'inProgress',
    'planP:P-0404': 'pending',
    'planO:DAFI-00103': 'approved',
    'planO:DAMA-00135': 'approved',
    'planO:DAMA-00136': 'approved',
    'planO:DAFI-00203': 'approved',
    'planO:DAMA-00235': 'approved',
    'planO:DAIC-00403': 'approved',
    'planO:DAIC-00504': 'inProgress'
  };

  const communications = [
    {
      id: 'com-001',
      title: 'Calendario de parciales y ayudantías actualizado',
      category: 'Académico',
      date: '2026-05-27T09:30:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: true,
      unread: true,
      summary: 'Fechas, salas y recordatorios para el primer bloque de evaluaciones del semestre.',
      body: 'Ya está disponible la actualización del calendario académico 2026-1. Revisa las fechas de parciales, ayudantías de repaso y material asociado a tus ramos antes de cada evaluación.',
      related: [{ type: 'calendar', id: 'evt-004', label: 'Inicio evaluaciones parciales 1' }]
    },
    {
      id: 'com-002',
      title: 'Inscripción a ayudantías 2026-1',
      category: 'Ayudantías',
      date: '2026-05-26T18:40:00',
      source: 'Docencia CEAL',
      pinned: false,
      unread: true,
      summary: 'Formulario abierto para quienes necesiten apoyo en ramos críticos.',
      body: 'La inscripción a ayudantías se mantendrá abierta hasta el jueves 28 de mayo. Prioriza los ramos con mayor carga de evaluaciones y revisa el calendario para confirmar horarios disponibles.'
    },
    {
      id: 'com-003',
      title: 'Material de estudio validado para parciales',
      category: 'Material',
      date: '2026-05-25T12:10:00',
      source: 'Biblioteca CEAL',
      pinned: false,
      unread: true,
      summary: 'Nuevas guías y pruebas anteriores disponibles para ramos de Plan O y Plan P.',
      body: 'Se publicaron recursos revisados para Estática, Cálculo II, Mecánica de Sólidos e Hidráulica General. Los aportes estudiantiles quedan marcados para distinguirlos del material validado por CEAL.'
    },
    {
      id: 'com-004',
      title: 'Asamblea informativa Plan O y Plan P',
      category: 'Actividades',
      date: '2026-05-24T10:05:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: false,
      unread: false,
      summary: 'Espacio abierto para resolver dudas sobre mallas, prerrequisitos y avance curricular.',
      body: 'La asamblea se realizará el viernes 5 de junio. Se revisarán dudas frecuentes de Plan O y Plan P, cambios de semestre y uso de la sección Mallas del portal.'
    },
    {
      id: 'com-005',
      title: 'Canales de contacto y seguimiento académico',
      category: 'Trámites',
      date: '2026-05-23T09:00:00',
      source: 'Secretaría CEAL',
      pinned: false,
      unread: false,
      summary: 'Centralizamos consultas académicas, material y solicitudes en el portal.',
      body: 'Usa Material para revisar recursos, Calendario para fechas importantes y Mi cuenta para guardar ramos o recordatorios. Las solicitudes internas CEAL se gestionan desde el panel de Gestión.'
    }
  ];

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

  const events = [
    { id: 'evt-001', title: 'Pleno CEAL', type: 'Pleno', date: '2026-05-28', time: '15:30', description: 'Sesión ordinaria N° 08/2026', agreementId: 'agr-003' },
    { id: 'evt-002', title: 'Cierre de inscripción', type: 'Formulario', date: '2026-05-28', time: '23:59', description: 'Inscripción a Ayudantías 2026-1', procedureId: 'proc-002' },
    { id: 'evt-003', title: 'Ayudantía de repaso', type: 'Ayudantía', date: '2026-05-29', time: '16:00', description: 'Estructuras II · Prof. R. Valdés', tutoringId: 'ay-001' },
    { id: 'evt-004', title: 'Hito académico', type: 'Fecha académica', date: '2026-06-02', time: '08:00', description: 'Inicio evaluaciones parciales 1' },
    { id: 'evt-005', title: 'Asamblea CEAL', type: 'Asamblea', date: '2026-06-05', time: '14:30', description: 'Plan O, Plan P y avance curricular' },
    { id: 'evt-006', title: 'Reunión de coordinación', type: 'Reunión', date: '2026-06-10', time: '17:00', description: 'Coordinación de ayudantías y material' }
  ];

  const agreements = [
    {
      id: 'agr-003', number: 'Acuerdo CEAL N°03/2026', status: 'publicado', date: '2026-05-27T09:15:00', origin: 'Pleno CEAL N°08/2026', responsible: 'Secretaría CEAL',
      title: 'Difusión de calendario de parciales', summary: 'Se acuerda centralizar en el portal las fechas de parciales, ayudantías de repaso y material sugerido para cada ramo.',
      currentState: 'El acuerdo fue publicado y comunicado a la comunidad.', nextStep: 'Mantener calendario actualizado y recibir observaciones estudiantiles.',
      documents: [
        { name: 'Acta Pleno CEAL 08-2026.pdf', type: 'PDF', size: '245 KB' },
        { name: 'Calendario parciales 2026-1.pdf', type: 'PDF', size: '180 KB' },
        { name: 'Listado ayudantías de repaso.xlsx', type: 'XLSX', size: '58 KB' },
        { name: 'Comunicado estudiantes.pdf', type: 'PDF', size: '312 KB' }
      ],
      commitments: [
        { title: 'Publicar calendario actualizado', responsible: 'Secretaría CEAL', due: '2026-05-28', status: 'enSeguimiento' },
        { title: 'Informar a delegados de generación', responsible: 'Comunicaciones CEAL', due: '2026-05-29', status: 'enSeguimiento' },
        { title: 'Actualizar ayudantías de repaso', responsible: 'Docencia CEAL', due: '2026-05-30', status: 'pendiente' },
        { title: 'Difundir en canales oficiales', responsible: 'Comunicaciones CEAL', due: '2026-05-27', status: 'completado' }
      ],
      history: [
        { at: '2026-05-27T09:15:00', title: 'Acuerdo publicado', detail: 'Se aprobó y publicó el acuerdo.' },
        { at: '2026-05-26T18:40:00', title: 'Documentos adjuntos', detail: 'Se incorporaron calendario y listado de ayudantías.' },
        { at: '2026-05-25T12:10:00', title: 'Compromisos asignados', detail: 'Se asignaron responsables de difusión y seguimiento.' }
      ]
    },
    {
      id: 'agr-002', number: 'Coordinación de ayudantías', status: 'enSeguimiento', date: '2026-05-26T18:40:00', origin: 'Reunión académica', responsible: 'Docencia CEAL',
      title: 'Refuerzo de ayudantías para ramos críticos', summary: 'Se solicita coordinar ayudantías adicionales para ramos con alta demanda antes de parciales.', currentState: 'En seguimiento con docentes y ayudantes.', nextStep: 'Confirmar salas, horarios y enlaces.', documents: [], commitments: [], history: []
    },
    {
      id: 'agr-001', number: 'Material académico', status: 'actualizado', date: '2026-05-24T12:10:00', origin: 'Solicitud estudiantil', responsible: 'Biblioteca CEAL',
      title: 'Reposición de material faltante', summary: 'Solicitud para completar recursos de ramos con alta demanda durante el periodo de parciales.', currentState: 'Actualizado con nuevos aportes estudiantiles.', nextStep: 'Validar recursos pendientes y publicarlos en Material.', documents: [], commitments: [], history: []
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

  const faqs = [
    { q: '¿Dónde reviso material por ramo?', a: 'En Material puedes buscar por ramo, código, tipo de recurso o semestre. Desde la malla también puedes abrir el material del ramo seleccionado.' },
    { q: '¿Dónde reviso mi malla?', a: 'En Mallas puedes alternar Plan O y Plan P, usar modo oscuro y abrir la vista foco para estudiar con más espacio.' },
    { q: '¿Dónde veo acuerdos?', a: 'En Calendario y acuerdos puedes revisar acuerdos recientes, documentos y compromisos asociados.' },
    { q: '¿Cómo encuentro mi malla?', a: 'En Mallas selecciona Plan O o Plan P. Puedes buscar ramos y revisar prerrequisitos.' },
    { q: '¿Cómo contacto al CEAL?', a: 'Revisa Comunicados para información oficial de contacto y canales activos del CEAL.' }
  ];

  const notifications = [
    { id: 'not-001', title: 'Mallas disponibles', detail: 'Plan O y Plan P están integrados en la vista inmersiva.', date: 'Hoy, 10:15', unread: true, route: '/mallas' },
    { id: 'not-002', title: 'Fecha próxima', detail: 'Pleno CEAL · 28 may, 15:30.', date: 'Hoy, 09:30', unread: true, route: '/calendario' },
    { id: 'not-003', title: 'Material en revisión', detail: 'Guía de Programación enviada a validación CEAL.', date: 'Ayer, 18:40', unread: true, route: '/material/mat-010' }
  ];

  const saved = {
    resources: ['mat-001', 'mat-003', 'mat-007'],
    courses: ['planO:DAIC-00504', 'planP:P-0505'],
    reminders: ['evt-001', 'ay-001']
  };

  const gestion = {
    pending: [
      { id: 'pend-001', type: 'mallas', title: 'Mallas en revisión', count: 2, detail: 'Planes y enlaces por confirmar' },
      { id: 'pend-002', type: 'material', title: 'Material por validar', count: 2, detail: 'Aportes estudiantiles pendientes' },
      { id: 'pend-003', type: 'acuerdos', title: 'Acuerdo por publicar', count: 1, detail: 'Requiere validación CEAL' },
      { id: 'pend-004', type: 'calendario', title: 'Eventos por confirmar', count: 2, detail: 'Ayudantías y reuniones' }
    ],
    changes: [
      { title: 'Comunicado calendario de parciales', detail: 'Actualizado por Comunicaciones CEAL', date: 'Hoy, 09:15' },
      { title: 'Acuerdo CEAL N°03/2026', detail: 'Publicado por Secretaría CEAL', date: 'Ayer, 18:40' },
      { title: 'Calendario académico', detail: 'Actualizado por Docencia CEAL', date: 'Ayer, 16:20' },
      { title: 'Material: guía de hormigón armado', detail: 'Validado por Docencia CEAL', date: '24 may, 12:10' }
    ],
    roles: [
      { name: 'Presidencia', detail: 'Lidera y valida decisiones clave.', members: 2 },
      { name: 'Secretaría', detail: 'Gestiona acuerdos, documentos y coordinación interna.', members: 3 },
      { name: 'Comunicaciones', detail: 'Publica y difunde información.', members: 2 },
      { name: 'Docencia', detail: 'Gestiona material y mallas.', members: 2 },
      { name: 'Bienestar', detail: 'Coordina apoyos y actividades.', members: 2 },
      { name: 'Apoyo académico', detail: 'Gestiona ayudantías y tutorías.', members: 2 }
    ]
  };

  const driveResources = Array.isArray(window.PortalDriveMaterials) ? window.PortalDriveMaterials : [];
  const driveIds = new Set(driveResources.map((item) => item.id));
  const allResources = [...driveResources, ...resources.filter((item) => !driveIds.has(item.id))];

  return { today, users, cealMembers, courseProgress, communications, resources: allResources, cases, events, agreements, tutoring, procedures, faqs, notifications, saved, gestion };
})();
