const { pool } = require('../config/database');

const migration = async () => {
  try {
    const [columnas] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rendiciones'
         AND COLUMN_NAME IN ('validacion_mensaje', 'validacion_fecha')`
    );
    const existentes = columnas.map((c) => c.COLUMN_NAME);
    if (!existentes.includes('validacion_mensaje')) {
      await pool.query('ALTER TABLE rendiciones ADD COLUMN validacion_mensaje TEXT NULL');
    }
    if (!existentes.includes('validacion_fecha')) {
      await pool.query('ALTER TABLE rendiciones ADD COLUMN validacion_fecha DATETIME NULL');
    }
    console.log('✅ Columnas validacion_mensaje y validacion_fecha listas en rendiciones');
  } catch (error) {
    console.error('❌ Error en migración de validación SUNAT:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

migration();
