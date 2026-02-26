const mysql = require('mysql2/promise');

const limpiarDuplicados = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'comisiones_db',
    });

    console.log('✅ Conectado a la BD\n');

    // Limpiar ámbitos duplicados, manteniendo el primero
    console.log('🧹 Limpiando ámbitos duplicados...');
    await connection.query(`
      DELETE FROM ambitos 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT MIN(id) as id 
          FROM ambitos 
          GROUP BY nombre_corto
        ) temp
      )
    `);
    const [resultAmbitos] = await connection.query('SELECT CHANGES() as count');
    if (resultAmbitos[0] && resultAmbitos[0].count) {
      console.log(`✅ ${resultAmbitos[0].count || 0} ámbitos duplicados eliminados\n`);
    }

    // Limpiar metas duplicadas, manteniendo el primero
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

    console.log('✅ Limpieza completada correctamente');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

limpiarDuplicados();
