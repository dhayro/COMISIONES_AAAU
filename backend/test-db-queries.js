require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  // Test 1a: Buscar meta "072" (sin cero inicial)
  console.log('\n🔍 Buscando meta con numero_meta = "072"');
  const [metas1] = await connection.query(
    'SELECT id, nombre FROM metas WHERE numero_meta = ? LIMIT 1',
    ['072']
  );
  console.log('Resultado:', metas1);

  // Test 1b: Buscar meta "0072" (con cero inicial)
  console.log('\n🔍 Buscando meta con numero_meta = "0072"');
  const [metas2] = await connection.query(
    'SELECT id, nombre FROM metas WHERE numero_meta = ? LIMIT 1',
    ['0072']
  );
  console.log('Resultado:', metas2);

  // Test 2: Buscar fuente "RECURSOS ORDINARIOS"
  console.log('\n🔍 Buscando fuente con nombre LIKE "%RECURSOS ORDINARIOS%"');
  const [fuentes] = await connection.query(
    'SELECT id, nombre FROM fuentes_financiamiento WHERE nombre LIKE ? LIMIT 1',
    ['%RECURSOS ORDINARIOS%']
  );
  console.log('Resultado:', fuentes);

  // Test 3: Buscar clasificador "23.1"
  console.log('\n🔍 Buscando clasificador con partida = "23.1"');
  const [clasificadores] = await connection.query(
    'SELECT id, nombre FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
    ['23.1']
  );
  console.log('Resultado:', clasificadores);

  await connection.end();
})().catch(e => console.error(e));
