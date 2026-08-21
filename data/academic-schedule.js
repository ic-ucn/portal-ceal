window.ACADEMIC_SCHEDULE = {
  term: 'Segundo semestre 2026',
  version: '1',
  department: 'Departamento de Ingeniería Civil',
  sourceFile: 'docs/horario-dic-2-2026-v1.pdf',
  blocks: {
    A: { start: '08:10', end: '09:40' },
    B: { start: '09:55', end: '11:25' },
    C: { start: '11:40', end: '13:10' },
    D: { start: '14:30', end: '16:00' },
    E: { start: '16:15', end: '17:45' },
    F: { start: '18:00', end: '19:30' },
    G: { start: '19:45', end: '21:15' }
  },
  courses: [
    {
      id: 'estatica',
      course: 'Estática',
      teacher: 'JMB',
      plan: 'O',
      semester: 4,
      sessions: [
        { day: 'lunes', block: 'A', room: 'Y3-102' },
        { day: 'miércoles', block: 'B', room: 'Y3-103' }
      ]
    },
    {
      id: 'diseno-acero',
      course: 'Diseño en Acero',
      teacher: 'JOP',
      plan: 'O',
      semester: 7,
      sessions: [
        { day: 'lunes', block: 'A', room: 'Y3-103' },
        { day: 'martes', block: 'A', room: 'Y3-102' }
      ]
    },
    {
      id: 'metodologias-constructivas',
      course: 'Metodologías Constructivas',
      teacher: 'WRL - IAA',
      plan: 'O',
      semester: 4,
      sessions: [
        { day: 'martes', block: 'A', room: 'Y3-404' },
        { day: 'viernes', block: 'A', room: 'Y3-404' }
      ]
    },
    {
      id: 'fundaciones',
      course: 'Fundaciones',
      teacher: 'FFL',
      plan: 'O',
      semester: 8,
      sessions: [
        { day: 'martes', block: 'A', room: 'Y3-103' },
        { day: 'jueves', block: 'A', room: 'Y3-103' }
      ]
    },
    {
      id: 'geologia-ingenieria',
      course: 'Geología para Ingeniería',
      teacher: 'MPA',
      plan: 'P',
      semester: 4,
      sessions: [
        { day: 'martes', block: 'A', room: 'W-209' },
        { day: 'jueves', block: 'A', room: 'W-209' }
      ]
    },
    {
      id: 'ingenieria-desarrollo-sustentable',
      course: 'Ingeniería y Desarrollo Sustentable',
      teacher: 'IAA',
      plan: 'O',
      semester: 8,
      sessions: [
        { day: 'lunes', block: 'B', room: 'Y3-404' },
        { day: 'martes', block: 'D', room: 'Y3-404' },
        { day: 'viernes', block: 'B', room: 'Y3-404' }
      ]
    },
    {
      id: 'hormigon-armado',
      course: 'Hormigón Armado',
      teacher: 'JMT',
      plan: 'O',
      semester: 6,
      sessions: [
        { day: 'lunes', block: 'B', room: 'Sala por definir' },
        { day: 'martes', block: 'B', room: 'Sala por definir' }
      ]
    },
    {
      id: 'sanitaria-ambiental',
      course: 'Ingeniería Sanitaria y Ambiental',
      teacher: 'ACA',
      plan: 'O',
      semester: 8,
      sessions: [
        { day: 'miércoles', block: 'B', room: 'Y3-404' },
        { day: 'jueves', block: 'B', room: 'Y3-404' }
      ]
    },
    {
      id: 'dinamica-mecanica-racional',
      course: 'Dinámica / Mecánica Racional',
      teacher: 'JMB',
      plan: 'O',
      semester: 3,
      sessions: [
        { day: 'lunes', block: 'B', room: 'Y3-102' },
        { day: 'miércoles', block: 'C', room: 'Y3-103' }
      ]
    },
    {
      id: 'mecanica-fluidos',
      course: 'Mecánica de Fluidos',
      teacher: 'ISC - DZM',
      plan: 'O',
      semester: 5,
      sessions: [
        { day: 'lunes', block: 'B', room: 'Y3-103' },
        { day: 'martes', block: 'B', room: 'Y3-103' }
      ]
    },
    {
      id: 'proyecto-infraestructura-vial',
      course: 'Proyecto de Diseño de Infraestructura Vial',
      teacher: 'IAA - PTG',
      plan: 'O',
      semester: 6,
      sessions: [
        { day: 'miércoles', block: 'A', room: 'Y3-101' },
        { day: 'miércoles', block: 'B', room: 'Y3-101' },
        { day: 'jueves', block: 'A', room: 'Y3-101' },
        { day: 'jueves', block: 'B', room: 'Y3-101' }
      ]
    },
    {
      id: 'estatica-aplicada-catedra',
      course: 'Estática Aplicada',
      teacher: 'DZM',
      type: 'Cátedra',
      plan: 'P',
      semester: 4,
      sessions: [
        { day: 'lunes', block: 'B', room: 'R-013' },
        { day: 'miércoles', block: 'B', room: 'R-008A' }
      ]
    },
    {
      id: 'introduccion-ingenieria-catedra',
      course: 'Introducción a la Ingeniería',
      teacher: 'DZM',
      type: 'Cátedra',
      plan: 'P',
      semester: 1,
      sessions: [
        { day: 'lunes', block: 'C', room: 'R-008B' },
        { day: 'martes', block: 'C', room: 'R-013' }
      ]
    },
    {
      id: 'introduccion-ingenieria-ayudantia',
      course: 'Introducción a la Ingeniería',
      teacher: 'DZM',
      type: 'Ayudantía',
      plan: 'P',
      semester: 1,
      sessions: [
        { day: 'miércoles', block: 'C', room: 'R-002' },
        { day: 'miércoles', block: 'D', room: 'R-008B' }
      ]
    },
    {
      id: 'dibujo-planimetrico',
      course: 'Dibujo Planimétrico de Ingeniería / Dibujo de Ingeniería',
      teacher: 'JCY',
      plan: 'P',
      semester: 2,
      sessions: [
        { day: 'jueves', block: 'F', room: 'Y3-101' },
        { day: 'viernes', block: 'C', room: 'Y3-101' },
        { day: 'viernes', block: 'E', room: 'Y3-101' }
      ]
    },
    {
      id: 'hidraulica',
      course: 'Hidráulica',
      teacher: 'ISC',
      plan: 'O',
      semester: 6,
      sessions: [
        { day: 'lunes', block: 'C', room: 'Y3-103' },
        { day: 'martes', block: 'C', room: 'Y3-103' }
      ]
    },
    {
      id: 'analisis-diseno-sismico',
      course: 'Análisis y Diseño Sísmico de Edificios',
      teacher: 'JMT',
      plan: 'O',
      semester: 9,
      sessions: [
        { day: 'lunes', block: 'C', room: 'Sala por definir' },
        { day: 'martes', block: 'C', room: 'Sala por definir' }
      ]
    },
    {
      id: 'analisis-diseno-sismico-taller',
      course: 'Análisis y Diseño Sísmico de Edificios',
      teacher: 'JMT',
      type: 'Taller',
      plan: 'O',
      semester: 9,
      sessions: [
        { day: 'lunes', block: 'E', room: 'Y3-101' },
        { day: 'lunes', block: 'F', room: 'Y3-101' }
      ]
    },
    {
      id: 'dinamica-estructuras',
      course: 'Dinámica de Estructuras',
      teacher: 'WFP',
      plan: 'O',
      semester: 8,
      sessions: [
        { day: 'lunes', block: 'C', room: 'Y3-102' },
        { day: 'martes', block: 'C', room: 'Y3-102' }
      ]
    },
    {
      id: 'proyecto-estructuras-industriales',
      course: 'Proyecto de Diseño de Estructuras Industriales',
      teacher: 'JOP',
      plan: 'O',
      semester: 8,
      sessions: [
        { day: 'miércoles', block: 'D', room: 'Y3-101' },
        { day: 'miércoles', block: 'E', room: 'Y3-101' },
        { day: 'jueves', block: 'D', room: 'Y3-101' },
        { day: 'jueves', block: 'E', room: 'Y3-101' }
      ]
    },
    {
      id: 'mecanica-suelos-i',
      course: 'Mecánica de Suelos I',
      teacher: 'FFL',
      plan: 'O',
      semester: 6,
      sessions: [
        { day: 'martes', block: 'D', room: 'Y3-103' },
        { day: 'miércoles', block: 'D', room: 'Lab. LIEMUN' },
        { day: 'miércoles', block: 'E', room: 'Lab. LIEMUN' },
        { day: 'jueves', block: 'D', room: 'Y3-103' }
      ]
    },
    {
      id: 'investigacion-aplicada-investigacion',
      course: 'Investigación Aplicada',
      teacher: 'DZM',
      type: 'Investigación',
      plan: 'O',
      semester: 9,
      sessions: [
        { day: 'lunes', block: 'D', room: 'Y3-102' },
        { day: 'martes', block: 'D', room: 'Y3-102' }
      ]
    },
    {
      id: 'modelos-trafico',
      course: 'Modelos de Tráfico',
      teacher: 'JAC',
      plan: 'O',
      semester: 6,
      sessions: [
        { day: 'martes', block: 'E', room: 'Y-101' },
        { day: 'martes', block: 'F', room: 'Y-101' },
        { day: 'viernes', block: 'E', room: 'Sala Andes' },
        { day: 'viernes', block: 'F', room: 'Sala Andes' }
      ]
    },
    {
      id: 'estatica-aplicada-ayudantia',
      course: 'Estática Aplicada',
      teacher: 'DZM',
      type: 'Ayudantía',
      plan: 'P',
      semester: 4,
      sessions: [
        { day: 'miércoles', block: 'E', room: 'R-008A' }
      ]
    },
    {
      id: 'capstone-investigacion',
      course: 'CAPSTONE',
      teacher: 'JOP',
      type: 'Investigación',
      plan: 'O',
      semester: 10,
      sessions: [
        { day: 'viernes', block: 'E', room: 'Y3-103' },
        { day: 'viernes', block: 'F', room: 'Y3-103' }
      ]
    },
    {
      id: 'capstone-proyecto',
      course: 'CAPSTONE',
      teacher: 'IAA',
      type: 'Proyecto',
      plan: 'O',
      semester: 10,
      sessions: [
        { day: 'martes', block: 'E', room: 'Y3-404' },
        { day: 'martes', block: 'F', room: 'Y3-404' }
      ]
    },
    {
      id: 'investigacion-aplicada-proyecto',
      course: 'Investigación Aplicada',
      teacher: 'IAA',
      type: 'Proyecto',
      plan: 'O',
      semester: 9,
      sessions: [
        { day: 'jueves', block: 'F', room: 'Y3-404' },
        { day: 'jueves', block: 'G', room: 'Y3-404' }
      ]
    },
    {
      id: 'bloque-protegido',
      course: 'Bloque protegido',
      teacher: '',
      type: 'Actividad institucional',
      plan: '',
      semester: null,
      sessions: [
        { day: 'jueves', block: 'C', room: '' }
      ]
    }
  ]
};
