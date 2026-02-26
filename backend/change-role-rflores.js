const mysql = require('mysql2/promise');
require('dotenv').config();

const cambiarRolRflores = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    console.log('✅ Conectado a la BD\n');

    // Cambiar el rol de rflores a 'visitador'
    const [result] = await connection.query(
      'UPDATE users SET rol = ? WHERE username = ?',
      ['visitador', 'rflores']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Rol de rflores actualizado a "visitador"\n');
    } else {
      console.log('⚠️ Usuario rflores no encontrado\n');
    }

    // Listar usuarios con sus roles actualizados
    const [users] = await connection.query(
      `SELECT id, username, nombre, rol FROM users ORDER BY rol, username`
    );

    console.log('📋 Usuarios por rol:\n');
    
    const rolesOrdenados = ['admin', 'jefe', 'usuario', 'visitador'];
    for (const rol of rolesOrdenados) {
      const usuariosDelRol = users.filter(u => u.rol === rol);
      if (usuariosDelRol.length > 0) {
        console.log(`\n${rol.toUpperCase()}:`);
        usuariosDelRol.forEach(u => {
          console.log(`  • ${u.username.padEnd(15)} | ${u.nombre}`);
        });
      }
    }
    console.log('\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
};

cambiarRolRflores();
