const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const limpiarYCargarMetasCorrectamente = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'comisiones_db',
    });

    console.log('✅ Conectado a la BD\n');

    // 1. Eliminar metas duplicadas, manteniendo solo la primera
    console.log('🧹 Limpiando metas duplicadas...');
    await connection.query(`
      DELETE FROM metas 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT MIN(id) as id 
          FROM metas 
          GROUP BY numero_meta
        ) temp
      )
    `);
    console.log('✅ Metas duplicadas eliminadas\n');

    // 2. Limpiar metas actuales para recargarlas
    console.log('🗑️  Eliminando todas las metas...');
    await connection.query('DELETE FROM metas');
    console.log('✅ Metas eliminadas\n');

    // 3. Obtener los IDs de los ámbitos
    console.log('🔍 Obteniendo IDs de ámbitos...');
    const [ambitos] = await connection.query(
      'SELECT id, nombre_largo FROM ambitos WHERE activo = 1'
    );

    const ambitoMap = {};
    ambitos.forEach((a) => {
      const nombre = a.nombre_largo.toLowerCase();
      if (nombre.includes('perene') || nombre.includes('perené')) ambitoMap['perene'] = a.id;
      else if (nombre.includes('tarma')) ambitoMap['tarma'] = a.id;
      else if (nombre.includes('pucallpa')) ambitoMap['pucallpa'] = a.id;
      else if (nombre.includes('atalaya')) ambitoMap['atalaya'] = a.id;
      else if (nombre.includes('ucayali') && !nombre.includes('local')) ambitoMap['ucayali'] = a.id;
    });

    console.log('Ámbitos encontrados:');
    Object.entries(ambitoMap).forEach(([nombre, id]) => {
      console.log(`  - ${nombre.toUpperCase()}: ID ${id}`);
    });
    console.log('');

    // 4. Cargar metas nuevamente
    const metas = [
      { numero_meta: '067', nombre: 'Atención al Usuario Local de Agua Perene', periodo: '2026', ambito: 'perene' },
      { numero_meta: '068', nombre: 'Atención al Usuario Local de Agua Tarma', periodo: '2026', ambito: 'tarma' },
      { numero_meta: '069', nombre: 'Atención al Usuario Local de Agua Pucallpa', periodo: '2026', ambito: 'pucallpa' },
      { numero_meta: '070', nombre: 'Atención al Usuario Local de Agua Atalaya', periodo: '2026', ambito: 'atalaya' },
      { numero_meta: '071', nombre: 'Gestión de la Calidad de los Recursos Hídricos - Ucayali', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '072', nombre: 'Gestión Operativa de la Autoridad Administrativa del Agua - Ucayali', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '073', nombre: 'Sensibilización en Cultura del Agua - Ucayali', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '198', nombre: 'Gestión de Operadores de Infraestructura Hidraúlica - Ejecución del PROFOJUA - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '199', nombre: 'Formalización de derechos de uso de agua con fines Poblacionales - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '200', nombre: 'Formalización de derechos de uso de agua con fines Agrarios - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '201', nombre: 'Operación y Mantenimiento de Equipos, Dispositivos e Instrumentos de Medición Hídrica (RJ N° 0100-2024-ANA) - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
      { numero_meta: '202', nombre: 'Evaluación de Recursos Hídricos - Delimitación de Faja Marginal - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
    ];

    console.log('📝 Cargando metas...');
    for (const meta of metas) {
      const ambitoId = ambitoMap[meta.ambito] || null;
      await connection.query(
        'INSERT INTO metas (nombre, numero_meta, periodo, ambito_id, activo) VALUES (?, ?, ?, ?, 1)',
        [meta.nombre, meta.numero_meta, meta.periodo, ambitoId]
      );
      const ambitoNombre = meta.ambito.charAt(0).toUpperCase() + meta.ambito.slice(1);
      console.log(`  ✅ Meta ${meta.numero_meta} - ${ambitoNombre}`);
    }

    console.log('\n✅ Todas las metas han sido cargadas correctamente');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

limpiarYCargarMetasCorrectamente();
