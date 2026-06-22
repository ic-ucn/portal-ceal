window.PortalMock = (() => {
  const today = '2026-06-17';

  const cealMembers = [
    { id: 'ceal-martina-briceno', username: 'martina.briceno', name: 'Martina Briceño', initials: 'MB', role: 'ceal', roleName: 'Presidencia', label: 'Presidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'martina.briceno@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'manage:roles', 'review:casos', 'publish:comunicados', 'upload:acuerdos'] },
    { id: 'ceal-camila-villegas', username: 'camila.villegas', name: 'Camila Villegas', initials: 'CV', role: 'ceal', roleName: 'Vicepresidencia', label: 'Vicepresidencia', plan: 'planP', yearLabel: 'CEAL 2026', email: 'camila.villegas@alumnos.ucn.cl', passwordSet: false, permissions: ['approve:content', 'review:casos', 'edit:calendario', 'upload:acuerdos'] },
    { id: 'ceal-matias-gonzalez', username: 'matias.gonzalez11', name: 'Matías González', initials: 'MG', role: 'ceal', roleName: 'Secretaría', label: 'Secretaría', plan: 'planP', yearLabel: 'CEAL 2026', email: 'matias.gonzalez11@alumnos.ucn.cl', passwordSet: false, permissions: ['publish:comunicados', 'edit:calendario', 'upload:acuerdos', 'review:casos', 'manage:forms'] },
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
      id: 'com-paro-005',
      title: 'Estado de movilización y próximas negociaciones',
      category: 'Contingencia',
      date: '2026-06-17T10:00:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: true,
      unread: true,
      summary: 'Actualización sobre turnos, cierre nocturno del campus, recalendarización y negociación diaria.',
      body: `Compañeras y compañeros de Ingeniería Civil:

Queremos informarles sobre la situación actual de la movilización estudiantil y las acciones que se desarrollarán durante el día de mañana.

En primer lugar, hacemos un llamado a toda la comunidad a apoyar activamente la toma que se está llevando a cabo a nivel institucional. Actualmente se necesitan estudiantes que puedan colaborar en rondas de resguardo y turnos en portería, ya que su participación es fundamental para fortalecer este proceso y demostrar seriedad y organización frente a las autoridades.

Además, les informamos que la entrada principal del campus se cerrará a las 23:00 horas. Una vez realizado el cierre, no será posible ingresar ni salir de las dependencias universitarias hasta las 07:00 horas, por lo que les pedimos considerar esta información al momento de organizar su participación y permanencia en el campus.

Respecto a las preocupaciones relacionadas con lo académico, queremos transmitir tranquilidad. La recalendarización de las actividades académicas ya ha sido planteada y considerada dentro de las conversaciones, por lo que les pedimos no preocuparse por este aspecto mientras continúa el proceso de movilización.

Por otra parte, durante la jornada se presentó el petitorio completo, revisando cada uno de sus puntos. Sin embargo, las respuestas entregadas hasta ahora no han incorporado avances ni observaciones significativas respecto de las demandas planteadas. Debido a esto, a partir de mañana se realizarán jornadas de negociación diarias entre las 10:00 y las 17:00 horas, donde las mesas de trabajo estarán sesionando de manera continua para buscar respuestas concretas a las solicitudes estudiantiles.

Con respecto a un eventual pleno, cualquier información será comunicada oportunamente durante el transcurso de mañana.

Como Centro de Estudiantes, seguiremos informando sobre cualquier avance relevante. Agradecemos el compromiso, la participación y el apoyo que han demostrado durante este proceso.`,
      related: [{ type: 'contingencia', id: 'agr-paro-003', label: 'Seguimiento de negociación' }]
    },
    {
      id: 'com-paro-004',
      title: 'Turnos de resguardo del departamento',
      category: 'Contingencia',
      date: '2026-06-16T18:30:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: false,
      unread: true,
      summary: 'Se solicita apoyo para cubrir turnos de mañana, tarde y noche durante la toma.',
      body: `Hola, como saben estamos en toma a nivel universidad y necesitamos apoyo en los turnos para cuidar el departamento.

Los turnos son:

1. Mañana: 08:00 a 15:00.
2. Tarde: 15:00 a 21:00.
3. Noche: 21:00 a 08:00.

Si alguien se anima a apoyar, nos puede mandar un mensaje para poder anotarlo.`,
      related: [{ type: 'contingencia', id: 'agr-paro-002', label: 'Organización de turnos' }]
    },
    {
      id: 'com-paro-003',
      title: 'Mesa de negociación y pleno estudiantil',
      category: 'Contingencia',
      date: '2026-06-16T09:00:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: false,
      unread: false,
      summary: 'Durante el martes 16 se inicia mesa de negociación con autoridades y posterior pleno estudiantil.',
      body: `Buenas noches a todos y todas:

Nos disculpamos por la hora, pero debido a distintas ocupaciones fuera de la Universidad se nos hizo difícil enviar antes este mensaje.

Sobre las actividades y avances que se desarrollarán durante la jornada de hoy, martes 16 de junio, en el contexto de la movilización estudiantil a nivel institucional, durante el día comenzarán las conversaciones entre la mesa de negociación y las autoridades. Esta mesa está conformada por tres estudiantes voluntarios de distintos Centros de Estudiantes, con el objetivo de representar directamente las inquietudes, necesidades y preocupaciones de quienes se han visto afectados por el instructivo emitido por Vicerrectoría Académica.

Una vez finalizada esta instancia, se realizará un pleno estudiantil, donde se expondrán los temas tratados en la mesa y se informarán los avances alcanzados durante la jornada.

Entre los puntos que se abordarán se encuentran temas de gran importancia para el estudiantado, como la posible extensión del semestre, las prácticas profesionales y otros aspectos relacionados con el instructivo y su impacto en nuestra progresión académica. Recordamos que una eventual extensión del semestre también implicaría una recalendarización de las evaluaciones.

Además, les informamos que la toma de las dependencias universitarias se mantendrá hasta que el nuevo instructivo elaborado por Vicerrectoría Académica sea emitido oficialmente y puesto en circulación para toda la comunidad universitaria.

Como Centro de Estudiantes, seguiremos informando oportunamente cualquier avance o acuerdo que surja de estas instancias.

Esperamos contar con su ayuda en esta instancia, debido a que tarde o temprano terminará afectando a todos y todas. Cualquier cosa, estamos disponibles para responder sus inquietudes y dudas. Cabe recalcar que, a pesar de ser parte del CEAL, podemos carecer también de información; por lo tanto, pedimos comprensión al plantear preguntas y exigencias de respuesta. Haremos lo posible por hacerles llegar información bien argumentada a su debido tiempo.`,
      related: [{ type: 'contingencia', id: 'agr-paro-003', label: 'Mesa de negociación' }]
    },
    {
      id: 'com-paro-002',
      title: 'Ingeniería Civil se suma a la toma institucional',
      category: 'Contingencia',
      date: '2026-06-15T15:30:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: false,
      unread: false,
      summary: 'Tras pleno universitario, Ingeniería Civil se suma oficialmente a la toma desde el lunes 15.',
      body: `Hola a todas y todos:

Junto con saludar, informamos que hoy lunes 15, a las 12:00 horas, se llevó a cabo un pleno a nivel universidad. En esta instancia participaron las distintas carreras para discutir la situación actual de la paralización y definir los pasos a seguir.

Luego de la intervención de diversas carreras, se llegó a la determinación de iniciar una toma a nivel universidad. En este contexto, como carrera de Ingeniería Civil, informamos que nos sumamos oficialmente a la toma a partir de hoy lunes 15.

Como CEAL, nos estaremos organizando mediante turnos para resguardar y acompañar el proceso dentro del departamento de nuestra carrera. Invitamos a las y los estudiantes que quieran apoyar a sumarse a estos turnos, ya sea permaneciendo durante algunas horas o acompañando en los espacios que se vayan coordinando. Quienes puedan apoyar, por favor comuníquense con nosotros.

Además, quienes puedan colaborar trayendo insumos que faciliten la permanencia en el departamento, pueden hacerlo con alimentos, sacos de dormir, colchones inflables, carpas, termos, bidones de agua u otros elementos útiles para la organización y estadía durante la toma.

Solicitamos a todas y todos mantenerse atentos a los canales oficiales de la carrera, ya que por este medio se irán entregando nuevas informaciones, actualizaciones y coordinaciones relacionadas con el proceso.

Agradecemos la atención, participación y apoyo de quienes han sido parte de las distintas instancias de discusión y organización. Cualquier consulta que tengan nos la hacen llegar.`,
      related: [{ type: 'contingencia', id: 'agr-paro-001', label: 'Inicio de toma institucional' }]
    },
    {
      id: 'com-paro-001',
      title: 'Formulario sobre impacto del instructivo académico',
      category: 'Contingencia',
      date: '2026-06-14T19:30:00',
      source: 'CEAL Ingeniería Civil UCN',
      pinned: false,
      unread: false,
      summary: 'Formulario para levantar postura estudiantil e impacto por ramo ante el instructivo de Vicerrectoría.',
      body: `Hola a todas y todos:

Este formulario tiene como finalidad conocer su postura con respecto al instructivo enviado por Vicerrectoría Académica y cuánto afecta su progreso académico.

En el formulario podrán expresar si esto les afecta y en qué ramo.

Formulario: https://forms.gle/fb1Xp5XqjPFk3CpW7`,
      related: [{ type: 'contingencia', id: 'agr-paro-001', label: 'Levantamiento de información' }]
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
    { id: 'evt-acad-0619', title: 'Término de renuncia a la Universidad', type: 'Trámite académico', date: '2026-06-19', time: '', description: 'Último plazo para solicitud de renuncias a la Universidad del I semestre 2026.' },
    { id: 'evt-acad-0622', title: 'Oferta académica Cursos de Invierno', type: 'Cursos de invierno', date: '2026-06-22', time: '', description: 'Inicio de oferta académica para Cursos de Invierno 2026.' },
    { id: 'evt-acad-0630', title: 'Cierre de postulaciones y actividades DRI', type: 'Fecha académica', date: '2026-06-30', time: '', description: 'Cierre de postulación Minor II semestre y actividades de colaboración virtual DRI.' },
    { id: 'evt-acad-0704', title: 'Último día de clases I semestre', type: 'Fecha académica', date: '2026-07-04', time: '', description: 'Último día de clases, talleres y laboratorios; término de evaluaciones pendientes I semestre.' },
    { id: 'evt-acad-0706', title: 'Exámenes por solicitud y recuperación', type: 'Evaluaciones', date: '2026-07-06', time: '', description: 'Inicio de periodo para rendir examen por solicitud y examen de recuperación, del 6 al 11 de julio.' },
    { id: 'evt-acad-0711', title: 'Cierre de actividades docentes I semestre', type: 'Fecha académica', date: '2026-07-11', time: '13:00', description: 'Último día de actividades docentes y plazo para registrar calificaciones finales en Banner.' },
    { id: 'evt-acad-0720', title: 'Inicio de solicitudes II semestre', type: 'Trámite académico', date: '2026-07-20', time: '', description: 'Inicio de solicitudes de retiro temporal, renuncias, cambio de nombre legal y rectificación de calificaciones.' },
    { id: 'evt-acad-0803', title: 'Inscripción de asignaturas II semestre', type: 'Inscripción', date: '2026-08-03', time: '', description: 'Inicio de inscripción de asignaturas para estudiantes matriculados según jornada y sede.' },
    { id: 'evt-acad-0805', title: 'Levantamiento de prerrequisitos', type: 'Trámite académico', date: '2026-08-05', time: '', description: 'Inicio de solicitudes de levantamiento de prerrequisitos a Jefes de Carrera, hasta el 31 de agosto.' },
    { id: 'evt-acad-0817', title: 'Inicio de clases II semestre', type: 'Fecha académica', date: '2026-08-17', time: '', description: 'Inicio de clases del II semestre 2026 e inicio de solicitud de anulación de periodo académico.' },
    { id: 'evt-acad-0914', title: 'Receso Fiestas Patrias', type: 'Receso', date: '2026-09-14', time: '', description: 'Receso de Fiestas Patrias del 14 al 20 de septiembre.' },
    { id: 'evt-acad-1013', title: 'Renuncia de asignaturas II semestre', type: 'Trámite académico', date: '2026-10-13', time: '', description: 'Inicio del periodo de renuncias de asignaturas del II semestre, hasta el 30 de octubre.' },
    { id: 'evt-acad-1019', title: 'Semana de autocuidado', type: 'Bienestar', date: '2026-10-19', time: '', description: 'Semana de Autocuidado para estudiantes, del 19 al 24 de octubre.' },
    { id: 'evt-acad-1102', title: 'Evaluaciones pendientes II semestre', type: 'Evaluaciones', date: '2026-11-02', time: '', description: 'Inicio del periodo de evaluaciones pendientes del II semestre 2026.' },
    { id: 'evt-acad-1210', title: 'Postulación y selección de especialidad', type: 'Plan Común', date: '2026-12-10', time: '', description: 'Plazo para postulación y selección de especialidad año 2027 en Ingeniería Civil Plan Común.' },
    { id: 'evt-acad-1219', title: 'Último día de clases II semestre', type: 'Fecha académica', date: '2026-12-19', time: '', description: 'Último día de clases, talleres y laboratorios; término de evaluaciones pendientes II semestre.' },
    { id: 'evt-acad-1221', title: 'Exámenes por solicitud y recuperativos', type: 'Evaluaciones', date: '2026-12-21', time: '', description: 'Periodo para rendir examen por solicitud y exámenes recuperativos, del 21 al 29 de diciembre.' },
    { id: 'evt-acad-1230', title: 'Cierre académico II semestre', type: 'Fecha académica', date: '2026-12-30', time: '13:00', description: 'Último día de actividades docentes y registro de calificaciones finales en Banner hasta las 13:00.' }
  ];

  const agreements = [
    {
      id: 'agr-paro-003', number: 'Contingencia N°03/2026', status: 'enSeguimiento', date: '2026-06-17T10:00:00', origin: 'Mesa de negociación y petitorio estudiantil', responsible: 'CEAL Ingeniería Civil UCN',
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
      id: 'agr-paro-002', number: 'Contingencia N°02/2026', status: 'actualizado', date: '2026-06-16T18:30:00', origin: 'Organización de toma universitaria', responsible: 'CEAL Ingeniería Civil UCN',
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
      id: 'agr-paro-001', number: 'Contingencia N°01/2026', status: 'publicado', date: '2026-06-15T15:30:00', origin: 'Pleno universitario', responsible: 'CEAL Ingeniería Civil UCN',
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

  const surveys = [
    {
      id: 'enc-001',
      title: 'Preferencias de horarios de atenciÃ³n',
      description: 'Levantamiento inicial para ajustar horarios de atenciÃ³n de jefatura y coordinaciÃ³n acadÃ©mica.',
      mode: 'encuesta',
      audience: 'Estudiantes de IngenierÃ­a Civil UCN',
      secret: true,
      allowMultipleResponses: false,
      status: 'open',
      createdAt: '2026-06-19T10:30:00',
      createdBy: 'CEAL IngenierÃ­a Civil UCN',
      responseCount: 0,
      questions: [
        { id: 'q1', label: 'Â¿QuÃ© bloque prefieres para atenciÃ³n?', type: 'single', required: true, options: ['MaÃ±ana', 'MediodÃ­a', 'Tarde'] },
        { id: 'q2', label: 'Â¿QuÃ© temas necesitas priorizar?', type: 'multiple', required: false, options: ['InscripciÃ³n de ramos', 'PrÃ¡ctica', 'Avance curricular', 'SituaciÃ³n personal acadÃ©mica'] },
        { id: 'q3', label: 'Comentario adicional', type: 'text', required: false, options: [] }
      ]
    }
  ];

  const staffProfiles = [
    {
      id: 'zelada',
      name: 'Jefatura de carrera',
      displayName: 'Jefatura de carrera',
      contactName: 'Prof. Zelada',
      role: 'Jefe de Carrera IngenierÃ­a Civil UCN',
      email: 'jc.icivil.afta@ucn.cl',
      authorizedEmails: ['jc.icivil.afta@ucn.cl', 'biblioteca.ceicucn@gmail.com'],
      calendarUrl: '',
      bookingUrl: '',
      status: 'Horarios publicados',
      description: 'Horarios de atenciÃ³n e informaciÃ³n oficial de Jefatura de carrera.',
      officeHours: [
        { id: 'oh-001', day: 'Martes', time: '11:30 - 13:00', mode: 'Presencial', place: 'Departamento de IngenierÃ­a Civil', status: 'Sujeto a confirmaciÃ³n' },
        { id: 'oh-002', day: 'Jueves', time: '15:00 - 16:30', mode: 'Mixto', place: 'Presencial o videollamada', status: 'Sujeto a confirmaciÃ³n' }
      ],
      notes: ['Las horas quedan sujetas a confirmaciÃ³n de jefatura.', 'La solicitud se realiza por correo institucional mientras se habilita agenda oficial.']
    }
  ];

  const faqs = [
    { q: '¿Dónde reviso material por ramo?', a: 'En Material puedes buscar por ramo, código, tipo de recurso o semestre. Desde la malla también puedes abrir el material del ramo seleccionado.' },
    { q: '¿Dónde reviso mi malla?', a: 'En Mallas puedes alternar Plan O y Plan P, usar modo oscuro y abrir la vista foco para estudiar con más espacio.' },
    { q: '¿Dónde veo la contingencia del paro?', a: 'En Contingencia del paro puedes revisar comunicados, acuerdos de seguimiento, compromisos y estado actual del proceso.' },
    { q: '¿Cómo encuentro mi malla?', a: 'En Mallas selecciona Plan O o Plan P. Puedes buscar ramos y revisar prerrequisitos.' },
    { q: '¿Cómo contacto al CEAL?', a: 'Revisa Comunicados para información oficial de contacto y canales activos del CEAL.' }
  ];

  const notifications = [
    { id: 'not-001', title: 'Contingencia actualizada', detail: 'Nuevo comunicado sobre negociación, turnos y recalendarización.', date: 'Hoy, 10:00', unread: true, route: '/contingencia' },
    { id: 'not-002', title: 'Calendario académico actualizado', detail: 'Fechas oficiales 2026 desde junio en adelante.', date: 'Hoy, 09:30', unread: true, route: '/calendario' },
    { id: 'not-003', title: 'Biblioteca disponible', detail: 'Material organizado por ramos reales de la malla.', date: 'Ayer, 18:40', unread: true, route: '/material' }
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
      { id: 'pend-003', type: 'contingencia', title: 'Contingencia en seguimiento', count: 3, detail: 'Comunicados y compromisos activos' },
      { id: 'pend-004', type: 'calendario', title: 'Calendario oficial', count: 18, detail: 'Hitos académicos 2026 cargados' }
    ],
    changes: [
      { title: 'Comunicado de contingencia', detail: 'Actualizado por Comunicaciones CEAL', date: 'Hoy, 10:00' },
      { title: 'Contingencia N°03/2026', detail: 'Seguimiento actualizado por CEAL', date: 'Hoy, 09:45' },
      { title: 'Calendario académico 2026', detail: 'Actualizado desde calendario DGPRE UCN', date: 'Hoy, 09:30' },
      { title: 'Material: guía de hormigón armado', detail: 'Validado por Docencia CEAL', date: '24 may, 12:10' }
    ],
    roles: [
      { name: 'Presidencia', detail: 'Lidera y valida decisiones clave.', members: 2 },
      { name: 'Secretaría', detail: 'Gestiona acuerdos, documentos y coordinación interna.', members: 3 },
      { name: 'Comunicaciones', detail: 'Publica y difunde información.', members: 2 },
      { name: 'Docencia', detail: 'Gestiona material y mallas.', members: 2 },
      { name: 'Bienestar', detail: 'Coordina apoyos y actividades.', members: 2 },
      { name: 'Contingencia', detail: 'Ordena comunicados, compromisos y seguimiento del paro.', members: 3 }
    ]
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

  return { today, users, cealMembers, courseProgress, communications, resources: allResources, cases, events, agreements, tutoring: tutoringState, procedures, surveys, staffProfiles, faqs, notifications, saved: savedState, gestion };
})();
