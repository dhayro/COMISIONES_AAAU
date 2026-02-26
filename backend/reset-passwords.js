const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetearContraseñas = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    console.log('✅ Conectado a la BD');

    // Generar el hash correcto para Autoridad1
    const passwordHash = await bcrypt.hash('Autoridad1', 10);
    console.log(`\n🔐 Generando hash para "Autoridad1"...`);
    console.log(`Hash: ${passwordHash}\n`);

    // Actualizar TODAS las contraseñas
    const [result] = await connection.query(
      'UPDATE users SET password = ?',
      [passwordHash]
    );

    console.log(`✅ Contraseñas actualizadas: ${result.affectedRows} usuarios`);
    console.log(`\n📝 Todos los usuarios ahora usan: Autoridad1\n`);

    // Listar usuarios
    const [users] = await connection.query(
      'SELECT id, username, email, nombre, rol FROM users ORDER BY id'
    );

    console.log('📋 Usuarios en el sistema:\n');
    users.forEach((user) => {
      console.log(`  • ${user.username.padEnd(15)} | ${user.nombre}`);
    });
    console.log();

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
};

resetearContraseñas();
