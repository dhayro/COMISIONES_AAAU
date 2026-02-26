const mysql = require('mysql2/promise');

const checkRflores = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'comisiones_db',
    });

    console.log('✅ Conectado a comisiones_db\n');

    // Obtener rflores
    const [users] = await connection.query(
      'SELECT username, rol FROM users WHERE username = "rflores"'
    );

    console.log('📋 Usuario rflores:\n');
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`  Username: ${u.username}`);
        console.log(`  Rol: ${u.rol}\n`);
      });
    } else {
      console.log('  No encontrado\n');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
};

checkRflores();
