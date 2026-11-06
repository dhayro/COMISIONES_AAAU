const { pool } = require('../config/database');

const migration = async () => {
  try {
    await pool.query(`
      ALTER TABLE formato_emisiones
      MODIFY COLUMN estado_emision ENUM('BORRADOR','ENVIADO','RINDIENDO','RENDIDO','DEVUELTO','APROBADO','ANULADO','CANCELADO','EMITIDO','PAGADO') NULL DEFAULT 'BORRADOR'
    `);
    console.log('✅ Estado RINDIENDO agregado a formato_emisiones.estado_emision');
  } catch (error) {
    console.error('❌ Error en migración RINDIENDO:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

migration();
