const { pool } = require('./config/database');

const cargarMetasPorDefecto = async () => {
  try {
    const metas = [
      {
        numero_meta: '67',
        nombre: 'Atención al Usuario Local de Agua Perene',
        periodo: '2026',
      },
      {
        numero_meta: '68',
        nombre: 'Atención al Usuario Local de Agua Tarma',
        periodo: '2026',
      },
      {
        numero_meta: '69',
        nombre: 'Atención al Usuario Local de Agua Pucallpa',
        periodo: '2026',
      },
      {
        numero_meta: '70',
        nombre: 'Atención al Usuario Local de Agua Atalaya',
        periodo: '2026',
      },
      {
        numero_meta: '71',
        nombre: 'Gestión de la Calidad de los Recursos Hídricos - Ucayali',
        periodo: '2026',
      },
      {
        numero_meta: '72',
        nombre: 'Gestión Operativa de la Autoridad Administrativa del Agua - Ucayali',
        periodo: '2026',
      },
      {
        numero_meta: '73',
        nombre: 'Sensibilización en Cultura del Agua - Ucayali',
        periodo: '2026',
      },
      {
        numero_meta: '198',
        nombre:
          'Gestión de Operadores de Infraestructura Hidraúlica - Ejecución del PROFOJUA - AAA UCAYALI',
        periodo: '2026',
      },
      {
        numero_meta: '199',
        nombre: 'Formalización de derechos de uso de agua con fines Poblacionales - AAA UCAYALI',
        periodo: '2026',
      },
      {
        numero_meta: '200',
        nombre: 'Formalización de derechos de uso de agua con fines Agrarios - AAA UCAYALI',
        periodo: '2026',
      },
      {
        numero_meta: '201',
        nombre:
          'Operación y Mantenimiento de Equipos, Dispositivos e Instrumentos de Medición Hídrica (RJ N° 0100-2024-ANA) - AAA UCAYALI',
        periodo: '2026',
      },
      {
        numero_meta: '202',
        nombre:
          'Evaluación de Recursos Hídricos - Delimitación de Faja Marginal - AAA UCAYALI',
        periodo: '2026',
      },
    ];

    for (const meta of metas) {
      // Verificar si ya existe
      const [existente] = await pool.query(
        'SELECT id FROM metas WHERE numero_meta = ?',
        [meta.numero_meta]
      );

      if (existente.length === 0) {
        // Insertarla
        await pool.query(
          'INSERT INTO metas (nombre, numero_meta, periodo, activo) VALUES (?, ?, ?, 1)',
          [meta.nombre, meta.numero_meta, meta.periodo]
        );
        console.log(`✅ Meta creada: ${meta.numero_meta} - ${meta.nombre}`);
      } else {
        console.log(`⏭️  Meta ya existe: ${meta.numero_meta}`);
      }
    }

    console.log('\n✅ Carga de metas completada');
  } catch (error) {
    console.error('❌ Error al cargar metas:', error.message);
  }
};

module.exports = { cargarMetasPorDefecto };
