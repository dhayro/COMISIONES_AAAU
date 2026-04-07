const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('\n📊 METAS EN LA BASE DE DATOS:');
    console.log('='.repeat(80));
    const [metas] = await connection.execute('SELECT id, nombre, numero_meta FROM metas LIMIT 15');
    console.table(metas);

    console.log('\n💰 FUENTES DE FINANCIAMIENTO:');
    console.log('='.repeat(80));
    const [fuentes] = await connection.execute('SELECT id, nombre FROM fuentes_financiamiento LIMIT 15');
    console.table(fuentes);

    console.log('\n📋 CLASIFICADORES:');
    console.log('='.repeat(80));
    const [clasificadores] = await connection.execute('SELECT id, nombre, codigo FROM clasificadores LIMIT 15');
    console.table(clasificadores);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showTables();
