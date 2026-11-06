const { pool } = require('../config/database');

const migration = async () => {
  try {
    const [columnas] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rendiciones'
         AND COLUMN_NAME IN ('monto_factura', 'sustento_monto')`
    );
    const existentes = columnas.map((c) => c.COLUMN_NAME);
    if (!existentes.includes('monto_factura')) {
      await pool.query('ALTER TABLE rendiciones ADD COLUMN monto_factura DECIMAL(12,2) NULL');
    }
    if (!existentes.includes('sustento_monto')) {
      await pool.query('ALTER TABLE rendiciones ADD COLUMN sustento_monto TEXT NULL');
    }
    console.log('✅ Columnas monto_factura y sustento_monto listas en rendiciones');
  } catch (error) {
    console.error('❌ Error en migración monto_factura:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

migration();
