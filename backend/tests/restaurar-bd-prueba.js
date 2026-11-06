// Crea la BD comisiones_test a partir de un respaldo JSON. Nunca toca la BD de producción.
// Uso: node tests/restaurar-bd-prueba.js <carpeta-del-respaldo>
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PRUEBA = 'comisiones_test';
const DIR = process.argv[2];
if (!DIR) {
  console.error('Indica la carpeta del respaldo.');
  process.exit(1);
}
const ISO = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?Z$/;

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
  });
  await c.query(`DROP DATABASE IF EXISTS ${DB_PRUEBA}`);
  await c.query(`CREATE DATABASE ${DB_PRUEBA} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await c.query(`USE ${DB_PRUEBA}`);
  await c.query('SET FOREIGN_KEY_CHECKS=0');
  const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.create.sql') && !fs.readFileSync(path.join(DIR, f), 'utf8').startsWith('undefined'));
  for (const f of archivos) await c.query(fs.readFileSync(path.join(DIR, f), 'utf8').replace(/;\s*$/, ''));
  let total = 0;
  for (const f of archivos) {
    const tabla = f.replace('.create.sql', '');
    const filas = JSON.parse(fs.readFileSync(path.join(DIR, `${tabla}.json`), 'utf8'));
    for (const fila of filas) {
      const cols = Object.keys(fila);
      if (!cols.length) continue;
      const vals = cols.map((k) => {
        const v = fila[k];
        if (typeof v === 'string' && ISO.test(v)) { const m = v.match(ISO); return `${m[1]} ${m[2]}${m[3] || ''}`; }
        return v === undefined ? null : v;
      });
      await c.query(`INSERT INTO \`${tabla}\` (${cols.map((k) => '`' + k + '`').join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);
      total++;
    }
  }
  await c.query('SET FOREIGN_KEY_CHECKS=1');
  console.log(`BD ${DB_PRUEBA} creada: ${archivos.length} tablas, ${total} filas`);
  await c.end();
})().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
