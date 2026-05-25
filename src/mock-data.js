window.PortalMock = (() => {
  const today = '2026-05-16';

  const cealMembers = [
    { id: 'ceal-martina-briceno', username: 'martina.briceno', name: 'Martina Briceno', initials: 'MB', role: 'ceal', roleName: 'Presidencia', label: 'Presidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'martina.briceno@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'manage:roles', 'review:casos', 'publish:comunicados', 'upload:acuerdos'] },
    { id: 'ceal-camila-villegas', username: 'camila.villegas', name: 'Camila Villegas', initials: 'CV', role: 'ceal', roleName: 'Vicepresidencia', label: 'Vicepresidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'camila.villegas@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'review:casos', 'edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-matias-gonzalez', username: 'matias.gonzalez', name: 'Matias Gonzalez', initials: 'MG', role: 'ceal', roleName: 'Secretaria', label: 'Secretaria', plan: 'planP', yearLabel: 'CEAL 2026', email: 'matias.gonzalez@alumnos.ucn.cl', passwordSet: false, permissions: ['publish:comunicados', 'edit:calendario', 'upload:acuerdos', 'review:casos', 'manage:forms'] },
    { id: 'ceal-belen-astudillo', username: 'belen.astudillo', name: 'Belen Astudillo', initials: 'BA', role: 'ceal', roleName: 'Tesoreria', label: 'Tesoreria', plan: 'planP', yearLabel: 'CEAL 2026', email: 'belen.astudillo@alumnos.ucn.cl', passwordSet: false, permissions: ['review:casos', 'edit:calendario', 'manage:forms'] },
    { id: 'ceal-gabriel-sanchez', username: 'gabriel.sanchez', name: 'Gabriel Sanchez', initials: 'GS', role: 'ceal', roleName: 'Comunicaciones', label: 'Comunicaciones', plan: 'planP', yearLabel: 'CEAL 2026', email: 'gabriel.sanchez@alumnos.ucn.cl', passwordSet: false, permissions: ['publish:comunicados', 'edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-bruno-castillo', username: 'bruno.castillo', name: 'Bruno Castillo', initials: 'BC', role: 'ceal', roleName: 'Docencia', label: 'Docencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'bruno.castillo@alumnos.ucn.cl', passwordSet: false, permissions: ['validate:material', 'review:casos', 'edit:mallas', 'manage:tutoring'] },
    { id: 'ceal-paolo-cardaniz', username: 'paolo.cardaniz', name: 'Paolo Cardaniz', initials: 'PC', role: 'ceal', roleName: 'Deportes', label: 'Deportes', plan: 'planP', yearLabel: 'CEAL 2026', email: 'paolo.cardaniz@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'publish:comunicados', 'review:casos'] },
    { id: 'ceal-paolo-ferruzola', username: 'paolo.ferruzola', name: 'Paolo Ferruzola', initials: 'PF', role: 'ceal', roleName: 'Extracurricular', label: 'Extracurricular', plan: 'planP', yearLabel: 'CEAL 2026', email: 'paolo.ferruzola@alumnos.ucn.cl', passwordSet: false, permissions: ['edit:calendario', 'publish:comunicados', 'manage:forms'] },
    { id: 'ceal-kevin-cortes', username: 'kevin.cortes', name: 'Kevin Cortes', initials: 'KC', role: 'ceal', roleName: 'Accion Social', label: 'Accion Social', plan: 'planP', yearLabel: 'CEAL 2026', email: 'kevin.cortes@alumnos.ucn.cl', passwordSet: false, permissions: ['review:casos', 'publish:comunicados', 'manage:forms'] }
  ];

  const users = {
    student: {
      id: 'u-student-001',
      name: 'Andres Morales',
      initials: 'AM',
      role: 'student',
      label: 'Estudiante',
      plan: 'planP',
      yearLabel: '4to ano',
      email: 'andres.morales@alumnos.ucn.cl',
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
      title: 'Inicio de evaluaciones parciales 1',
      category: 'Académico',
      date: '2026-05-16T09:30:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: true,
      unread: true,
      summary: 'Revisa fechas, salas y consideraciones importantes para los parciales 1 de este semestre.',
      body: 'Se encuentra disponible el resumen de fechas y consideraciones académicas para el inicio de evaluaciones parciales 1. Revisa el calendario del portal y confirma el material asociado a tus ramos antes de cada evaluación.',
      related: [{ type: 'calendar', id: 'evt-004', label: 'Inicio evaluaciones parciales 1' }]
    },
    {
      id: 'com-002',
      title: 'Suspensión de clases miércoles 21 de mayo',
      category: 'Actividades',
      date: '2026-05-15T18:40:00',
      source: 'CEAL',
      pinned: false,
      unread: true,
      summary: 'Por actividades institucionales, algunas clases tendrán modificación de horario.',
      body: 'La información de salas y horarios actualizados se mantendrá centralizada en el calendario. Revisa tu agenda semanal antes de asistir a clases.'
    },
    {
      id: 'com-003',
      title: 'Ajustes en ayudantías de Hormigón Armado I',
      category: 'Ayudantías',
      date: '2026-05-14T12:10:00',
      source: 'Coordinación Académica',
      pinned: false,
      unread: true,
      summary: 'Cambios de horario y sala desde la próxima semana.',
      body: 'La ayudantía se realizará en el bloque indicado en la sección Ayudantías y trámites. El material asociado quedará disponible en Biblioteca académica.'
    },
    {
      id: 'com-004',
      title: 'Nuevo material agregado: Plan O y Plan P',
      category: 'Material',
      date: '2026-05-12T10:05:00',
      source: 'Ayudantías',
      pinned: false,
      unread: false,
      summary: 'Apuntes y ejercicios disponibles en Material.',
      body: 'Se agregaron recursos para ramos de estructuras, hidráulica y programación. Algunos recursos se encuentran pendientes de revisión CEAL.'
    },
    {
      id: 'com-005',
      title: 'Inscripción a Ayudantías 2026-1',
      category: 'Trámites',
      date: '2026-05-09T09:00:00',
      source: 'CEAL',
      pinned: false,
      unread: false,
      summary: 'Revisa el calendario y el proceso de inscripción.',
      body: 'El formulario se encuentra abierto hasta la fecha indicada en trámites destacados.'
    }
  ];

  const resources = [
    {
      id: 'mat-001', title: 'Guía Ejercicios N°3', type: 'Guía', courseCode: 'DAIC-00403', plan: 'planO', courseName: 'Estática', semester: 4, year: 2024, format: 'PDF', size: '2.1 MB',
      origin: 'Ayudantía Estática', status: 'validadoCeal', uploadedBy: 'Ayudantía Estática', uploadedAt: '2026-05-10', description: 'Guía con ejercicios resueltos de equilibrio de cuerpos rígidos y sistemas de fuerzas.'
    },
    {
      id: 'mat-002', title: 'Prueba 2 - 2024', type: 'Prueba', courseCode: 'DAIC-00403', plan: 'planO', courseName: 'Estática', semester: 4, year: 2024, format: 'PDF', size: '1.8 MB',
      origin: 'Prof. R. Valdés', status: 'validadoCeal', uploadedBy: 'CEAL', uploadedAt: '2026-05-09', description: 'Evaluación anterior compartida como referencia de estudio.'
    },
    {
      id: 'mat-003', title: 'Resumen Unidades 1-3', type: 'Resumen', courseCode: 'P-0403', plan: 'planP', courseName: 'Mecánica de Sólidos', semester: 4, year: 2024, format: 'PDF', size: '1.4 MB',
      origin: 'Aporte estudiantil', status: 'aporteEstudiantil', uploadedBy: 'María P. Contreras', uploadedAt: '2026-05-08', description: 'Resumen de conceptos de esfuerzo, deformación y comportamiento elástico.'
    },
    {
      id: 'mat-004', title: 'Presentación Consolidación', type: 'PPT', courseCode: 'P-0504', plan: 'planP', courseName: 'Mecánica de Suelos', semester: 5, year: 2023, format: 'PPTX', size: '3.4 MB',
      origin: 'Prof. J. Carvajal', status: 'validadoCeal', uploadedBy: 'Docencia', uploadedAt: '2026-05-07', description: 'Presentación base para repaso de consolidación y asentamientos.'
    },
    {
      id: 'mat-005', title: 'Apuntes Clase 5', type: 'Apunte', courseCode: 'P-0603', plan: 'planP', courseName: 'Hidráulica General', semester: 6, year: 2024, format: 'PDF', size: '980 KB',
      origin: 'Aporte estudiantil', status: 'aporteEstudiantil', uploadedBy: 'Camila R.', uploadedAt: '2026-05-07', description: 'Apuntes de flujo en canales y pérdidas de energía.'
    },
    {
      id: 'mat-006', title: 'Guía Hormigón Armado', type: 'Guía', courseCode: 'DAIC-00608', plan: 'planO', courseName: 'Hormigón Armado', semester: 6, year: 2024, format: 'PDF', size: '2.7 MB',
      origin: 'Ayudantía HA', status: 'validadoCeal', uploadedBy: 'Ayudantía HA', uploadedAt: '2026-05-06', description: 'Diseño básico de vigas y losas de hormigón armado.'
    },
    {
      id: 'mat-007', title: 'Prueba Anterior 2023', type: 'Prueba', courseCode: 'DAIC-00504', plan: 'planO', courseName: 'Análisis Estructural', semester: 5, year: 2023, format: 'PDF', size: '1.8 MB',
      origin: 'Prof. F. Rivera', status: 'validadoCeal', uploadedBy: 'CEAL', uploadedAt: '2026-05-04', description: 'Prueba anterior para practicar métodos de análisis estructural.'
    },
    {
      id: 'mat-008', title: 'Ejercicios Propuestos', type: 'Ejercicios', courseCode: 'P-0302', plan: 'planP', courseName: 'Cálculo II', semester: 3, year: 2024, format: 'PDF', size: '1.2 MB',
      origin: 'Ayudantía Cálculo II', status: 'validadoCeal', uploadedBy: 'Ayudantía Cálculo II', uploadedAt: '2026-05-03', description: 'Lista de ejercicios para practicar integrales y series.'
    },
    {
      id: 'mat-009', title: 'Plantilla Informe de Laboratorio', type: 'Guía', courseCode: 'P-0603', plan: 'planP', courseName: 'Hidráulica General', semester: 6, year: 2023, format: 'DOCX', size: '312 KB',
      origin: 'CEAL', status: 'validadoCeal', uploadedBy: 'CEAL', uploadedAt: '2026-05-01', description: 'Plantilla base para informes de laboratorio.'
    },
    {
      id: 'mat-010', title: 'Guía de Programación', type: 'Guía', courseCode: 'DAIS-00200', plan: 'planO', courseName: 'Programación', semester: 6, year: 2024, format: 'PDF', size: '2.5 MB',
      origin: 'Ayudantía Programación', status: 'pendienteRevision', uploadedBy: 'Aporte estudiantil', uploadedAt: '2026-05-14', description: 'Material enviado a revisión para ejercicios de algoritmos y estructuras.'
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
    { id: 'evt-001', title: 'Pleno CEAL', type: 'Pleno', date: '2026-05-19', time: '15:30', description: 'Sesión ordinaria N° 07/2026', agreementId: 'agr-003' },
    { id: 'evt-002', title: 'Cierre de formulario', type: 'Formulario', date: '2026-05-21', time: '23:59', description: 'Inscripción a Ayudantías 2026-1', procedureId: 'proc-002' },
    { id: 'evt-003', title: 'Ayudantía', type: 'Ayudantía', date: '2026-05-22', time: '16:00', description: 'Estructuras II · Prof. R. Valdés', tutoringId: 'ay-001' },
    { id: 'evt-004', title: 'Hito académico', type: 'Fecha académica', date: '2026-06-02', time: '08:00', description: 'Inicio evaluaciones parciales 1' },
    { id: 'evt-005', title: 'Asamblea CEAL', type: 'Asamblea', date: '2026-06-05', time: '14:30', description: 'Sesión extraordinaria N° 03/2026' },
    { id: 'evt-006', title: 'Reunión de coordinación', type: 'Reunión', date: '2026-05-27', time: '17:00', description: 'Coordinación de ayudantías' }
  ];

  const agreements = [
    {
      id: 'agr-003', number: 'Acuerdo Pleno CEAL N°03/2026', status: 'publicado', date: '2026-05-16T09:15:00', origin: 'Pleno CEAL N°07/2026', responsible: 'Secretaría CEAL',
      title: 'Actualización calendario académico 2026-1', summary: 'Se aprueba la actualización del calendario académico 2026-1, incorporando nuevos hitos de evaluación y cierre de formularios.',
      currentState: 'El acuerdo ha sido publicado y comunicado a la comunidad.', nextStep: 'Difusión del calendario actualizado y validación con unidades académicas.',
      documents: [
        { name: 'Acta de sesión.pdf', type: 'PDF', size: '245 KB' },
        { name: 'Comunicado oficial.pdf', type: 'PDF', size: '180 KB' },
        { name: 'Formulario actualizado.xlsx', type: 'XLSX', size: '58 KB' },
        { name: 'Material asociado.pdf', type: 'PDF', size: '312 KB' }
      ],
      commitments: [
        { title: 'Publicar calendario actualizado', responsible: 'Secretaría CEAL', due: '2026-05-20', status: 'enSeguimiento' },
        { title: 'Informar a unidades académicas', responsible: 'Secretaría CEAL', due: '2026-05-21', status: 'enSeguimiento' },
        { title: 'Habilitar formulario actualizado', responsible: 'Gestión CEAL', due: '2026-05-22', status: 'pendiente' },
        { title: 'Difundir en medios oficiales', responsible: 'Comunicaciones CEAL', due: '2026-05-23', status: 'completado' }
      ],
      history: [
        { at: '2026-05-16T09:15:00', title: 'Acuerdo publicado', detail: 'Se aprobó y publicó el acuerdo.' },
        { at: '2026-05-15T18:40:00', title: 'Actualizado', detail: 'Se incorporaron documentos asociados.' },
        { at: '2026-05-14T12:10:00', title: 'En seguimiento', detail: 'Se asignaron compromisos.' }
      ]
    },
    {
      id: 'agr-002', number: 'Actualización calendario académico', status: 'enSeguimiento', date: '2026-05-15T18:40:00', origin: 'Reunión académica', responsible: 'Coordinación Académica',
      title: 'Revisión de fechas de evaluación', summary: 'Se solicita revisar fechas críticas de evaluaciones parciales y ayudantías.', currentState: 'En seguimiento con coordinación.', nextStep: 'Confirmar salas y horarios.', documents: [], commitments: [], history: []
    },
    {
      id: 'agr-001', number: 'Solicitud de apoyo docente', status: 'actualizado', date: '2026-05-14T12:10:00', origin: 'Solicitud estudiantil', responsible: 'Apoyo académico',
      title: 'Apoyo docente para ramos críticos', summary: 'Solicitud de apoyo complementario para ramos con alta demanda académica.', currentState: 'Actualizado con nueva información.', nextStep: 'Revisar disponibilidad de ayudantes.', documents: [], commitments: [], history: []
    }
  ];

  const tutoring = [
    { id: 'ay-001', title: 'Ayudantía de Estática', courseCode: 'DAIC-00403', courseName: 'Estática', date: '2026-05-22', time: '15:30 – 17:00', location: 'Aula 210 · Edificio IC', mode: 'Presencial', tutor: 'Francisca Rojas', materialId: 'mat-001' },
    { id: 'ay-002', title: 'Repaso Cálculo II', courseCode: 'P-0302', courseName: 'Cálculo II', date: '2026-05-23', time: '10:00 – 11:30', location: 'Google Meet', mode: 'Online', tutor: 'Diego Araya', materialId: 'mat-008' },
    { id: 'ay-003', title: 'Laboratorio de Hidráulica', courseCode: 'P-0603', courseName: 'Hidráulica General', date: '2026-05-28', time: '14:00 – 16:00', location: 'Lab. Hidráulica', mode: 'Presencial', tutor: 'Camila Rojas', materialId: 'mat-009' }
  ];

  const procedures = [
    { id: 'proc-001', title: 'Formulario solicitud de apoyo', due: '2026-05-30', status: 'abierto', required: ['Cédula de identidad', 'Certificado', 'Boleta de notas'], responsible: 'Unidad de Apoyo Estudiantil', description: 'Solicitud de apoyo para situaciones académicas o personales que requieren derivación.' },
    { id: 'proc-002', title: 'Inscripción ayudantías', due: '2026-05-28', status: 'abierto', required: ['Historial académico'], responsible: 'Coordinación Académica', description: 'Inscripción a ayudantías disponibles para el semestre.' },
    { id: 'proc-003', title: 'Consulta académica', due: '2026-06-15', status: 'enRevision', required: ['Descripción de caso'], responsible: 'Dirección de Docencia', description: 'Formulario para consultas académicas formales.' }
  ];

  const faqs = [
    { q: '¿Dónde reviso material por ramo?', a: 'En Material puedes buscar por ramo, código, tipo de recurso o semestre. Desde la malla también puedes abrir el material del ramo seleccionado.' },
    { q: '¿Cómo reporto un caso?', a: 'En Casos usa “Nuevo caso”, selecciona el tipo, describe el contexto y adjunta archivos si corresponde.' },
    { q: '¿Dónde veo acuerdos?', a: 'En Calendario y acuerdos puedes revisar acuerdos recientes, documentos y compromisos asociados.' },
    { q: '¿Cómo encuentro mi malla?', a: 'En Mallas selecciona Plan O o Plan P. Puedes buscar ramos y revisar prerrequisitos.' },
    { q: '¿Cómo contacto al CEAL?', a: 'Puedes enviar un caso o revisar Comunicados para información oficial de contacto.' }
  ];

  const notifications = [
    { id: 'not-001', title: 'Caso actualizado', detail: 'Consulta por evaluación pasó a En revisión.', date: 'Hoy, 10:15', unread: true, route: '/casos/case-2026-0052' },
    { id: 'not-002', title: 'Fecha próxima', detail: 'Pleno CEAL · 19 may, 15:30.', date: 'Hoy, 09:30', unread: true, route: '/calendario' },
    { id: 'not-003', title: 'Material nuevo', detail: 'Guía de Programación enviada a revisión.', date: 'Ayer, 18:40', unread: true, route: '/material/mat-010' }
  ];

  const saved = {
    resources: ['mat-001', 'mat-003', 'mat-007'],
    courses: ['planO:DAIC-00504', 'planP:P-0505'],
    reminders: ['evt-001', 'ay-001']
  };

  const gestion = {
    pending: [
      { id: 'pend-001', type: 'casos', title: 'Casos pendientes', count: 3, detail: 'Asignados a mi rol' },
      { id: 'pend-002', type: 'material', title: 'Materiales por validar', count: 2, detail: 'Esperando revisión' },
      { id: 'pend-003', type: 'acuerdos', title: 'Acuerdo en borrador', count: 1, detail: 'Pendiente de publicación' },
      { id: 'pend-004', type: 'calendario', title: 'Eventos por revisar', count: 2, detail: 'En el calendario' }
    ],
    changes: [
      { title: 'Comunicado suspensión académica', detail: 'Editado por ti', date: 'Hoy, 09:15' },
      { title: 'Acuerdo N° 2026-14', detail: 'Subido por Camila Rojas', date: 'Ayer, 18:40' },
      { title: 'Calendario académico', detail: 'Actualizado por ti', date: 'Ayer, 16:20' },
      { title: 'Material: Guía de Hormigón Armado I', detail: 'Validado por Sebastián Vega', date: '14 may, 12:10' }
    ],
    roles: [
      { name: 'Presidencia', detail: 'Lidera y valida decisiones clave.', members: 2 },
      { name: 'Secretaría', detail: 'Gestiona acuerdos, casos y documentos.', members: 3 },
      { name: 'Comunicaciones', detail: 'Publica y difunde información.', members: 2 },
      { name: 'Docencia', detail: 'Gestiona material y mallas.', members: 2 },
      { name: 'Bienestar', detail: 'Coordina apoyos y actividades.', members: 2 },
      { name: 'Apoyo académico', detail: 'Gestiona ayudantías y tutorías.', members: 2 }
    ]
  };

  return { today, users, cealMembers, courseProgress, communications, resources, cases, events, agreements, tutoring, procedures, faqs, notifications, saved, gestion };
})();
