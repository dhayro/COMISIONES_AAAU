/**
 * 🔧 Migración: Agregar columna 'orden' a tabla rendiciones para mantener orden de comprobantes
 */

const agregarOrdenRendiciones = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n🔄 Agregando columna orden a tabla rendiciones...\n');

    const sql = `
      ALTER TABLE rendiciones 
      ADD COLUMN orden INT DEFAULT 0 AFTER id
    `;

    try {
      await connection.query(sql);
      console.log('✅ Columna orden agregada a tabla rendiciones');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  La columna orden ya existe (omitido)');
      } else {
        throw error;
      }
    }

    // Crear índice para mejor performance
    const sqlIndexOrden = `
      CREATE INDEX IF NOT EXISTS idx_orden_formato 
      ON rendiciones(formato_emision_id, orden)
    `;

    await connection.query(sqlIndexOrden);
    console.log('✅ Índice creado para orden');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('   └─ Columna orden agregada a rendiciones\n');

    return true;
  } catch (error) {
    console.error('❌ Error al agregar columna orden:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { agregarOrdenRendiciones };
