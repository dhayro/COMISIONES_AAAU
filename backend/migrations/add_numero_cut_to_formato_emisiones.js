const { pool } = require('../config/database');

const migration = async () => {
  try {
    console.log('🔄 Iniciando migración: agregar numero_cut a formato_emisiones...');

    // Verificar si la columna ya existe
    const [columns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'formato_emisiones' AND COLUMN_NAME = 'numero_cut'`
    );

    if (columns.length > 0) {
      console.log('✅ El campo numero_cut ya existe en formato_emisiones');
      return;
    }

    // Agregar columna numero_cut después de numero_siaf
    await pool.query(`
      ALTER TABLE formato_emisiones
      ADD COLUMN numero_cut VARCHAR(50) NULL
      AFTER numero_siaf
    `);

    console.log('✅ Columna numero_cut agregada correctamente a formato_emisiones');
    console.log('   Tipo: VARCHAR(50)');
    console.log('   Ubicación: después de numero_siaf');
    console.log('   Nulabilidad: NULL');

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  }
};

// Ejecutar migración
migration()
  .then(() => {
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MIGRACIÓN FALLIDA:', error.message);
    process.exit(1);
  });
