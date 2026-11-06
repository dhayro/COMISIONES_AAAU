const { pool } = require('../config/database');

const migration = async () => {
  try {
    const [columnas] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'formato_emisiones'
         AND COLUMN_NAME IN ('motivo_devolucion', 'fecha_devolucion')`
    );
    const existentes = columnas.map((c) => c.COLUMN_NAME);

    await pool.query(`
      ALTER TABLE formato_emisiones
      MODIFY COLUMN estado_emision ENUM('BORRADOR','ENVIADO','RINDIENDO','RENDIDO','DEVUELTO','APROBADO','ANULADO','CANCELADO','EMITIDO','PAGADO') NULL DEFAULT 'BORRADOR'
    `);
    if (!existentes.includes('motivo_devolucion')) {
      await pool.query('ALTER TABLE formato_emisiones ADD COLUMN motivo_devolucion TEXT NULL');
    }
    if (!existentes.includes('fecha_devolucion')) {
      await pool.query('ALTER TABLE formato_emisiones ADD COLUMN fecha_devolucion DATETIME NULL');
    }

    console.log('✅ Estado DEVUELTO y campos motivo_devolucion / fecha_devolucion listos');
  } catch (error) {
    console.error('❌ Error en migración de devolución:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

migration();
