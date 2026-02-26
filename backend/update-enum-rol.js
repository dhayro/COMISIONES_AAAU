const mysql = require('mysql2/promise');

const updateSchema = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'comisiones_db',
    });

    console.log('✅ Conectado a comisiones_db\n');

    // Actualizar el enum para cambiar 'visitador' a 'administrativo'
    console.log('📝 Actualizando definición de ENUM en tabla users...\n');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN rol ENUM('admin', 'jefe', 'usuario', 'administrativo') DEFAULT 'usuario'
    `);

    console.log('✅ Enum actualizado\n');

    // Ahora actualizar rflores
    console.log('🔄 Actualizando rol de rflores a "administrativo"...\n');
    const [result] = await connection.query(
      'UPDATE users SET rol = "administrativo" WHERE username = "rflores"'
    );

    console.log(`✅ Actualizadas ${result.affectedRows} filas\n`);

    // Verific ar
    const [users] = await connection.query(
      'SELECT username, nombre, rol FROM users WHERE username IN ("rflores", "admin", "snunez", "dkong") ORDER BY rol'
    );

    console.log('📋 Usuarios por rol (muestra):\n');
    users.forEach(u => {
      console.log(`  ${u.username.padEnd(15)} | ${u.rol.padEnd(10)} | ${u.nombre}`);
    });
    console.log();

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
};

updateSchema();
