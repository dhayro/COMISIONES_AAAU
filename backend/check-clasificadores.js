require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    console.log('\n📋 ESTRUCTURA DE TABLA CLASIFICADORES:');
    console.log('================================================================================');
    const [columns] = await connection.query('DESCRIBE clasificadores');
    console.table(columns);

    console.log('\n📋 PRIMERAS 20 FILAS DE CLASIFICADORES:');
    console.log('================================================================================');
    const [rows] = await connection.query('SELECT * FROM clasificadores LIMIT 20');
    console.table(rows);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
