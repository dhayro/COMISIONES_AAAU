#!/usr/bin/env node
require('dotenv').config({ path: '/d/COMISIONES_AAAU/backend/.env' });
const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'comisiones_db',
    });

    const [usuarios] = await pool.query(
      'SELECT id, username, nombre, rol FROM users WHERE rol IN ("admin", "jefe") LIMIT 5'
    );

    console.log('👤 Usuarios Admin/Jefe:');
    usuarios.forEach(u => 
      console.log(`   ID ${u.id}: ${u.username} (${u.nombre}) - Rol: ${u.rol}`)
    );

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
