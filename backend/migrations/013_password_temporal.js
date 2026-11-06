const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const migration = async () => {
  try {
    const [columnas] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'debe_cambiar_password'`
    );
    if (columnas.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN debe_cambiar_password TINYINT(1) NOT NULL DEFAULT 0');
      console.log('✅ Columna debe_cambiar_password agregada a users');
    }

    const [usuarios] = await pool.query('SELECT id, password FROM users');
    let marcados = 0;
    for (const usuario of usuarios) {
      if (await bcrypt.compare('Autoridad1', usuario.password)) {
        await pool.query('UPDATE users SET debe_cambiar_password = 1 WHERE id = ?', [usuario.id]);
        marcados++;
      }
    }
    console.log(`✅ ${marcados} usuario(s) con contraseña por defecto marcados para cambiarla`);
  } catch (error) {
    console.error('❌ Error en migración password temporal:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

migration();
