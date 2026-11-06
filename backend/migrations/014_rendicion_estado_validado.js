const { pool } = require('../config/database');

const migration = async () => {
  try {
    await pool.query(`
      ALTER TABLE rendiciones
      MODIFY COLUMN estado_rendicion ENUM('PENDIENTE','EN_REVISIÓN','APROBADO','RECHAZADO','VALIDADO') NOT NULL DEFAULT 'PENDIENTE'
    `);
    console.log('✅ Estado VALIDADO agregado a rendiciones.estado_rendicion');
  } catch (error) {
    console.error('❌ Error en migración VALIDADO:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

migration();
