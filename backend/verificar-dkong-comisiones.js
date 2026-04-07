#!/usr/bin/env node

require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarDkong() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Contraseña vacía
    database: process.env.DB_NAME || 'comisiones_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('\n========== VERIFICACIÓN DE DKONG ==========\n');

    // 1. ID de dkong
    const [users] = await pool.query(
      'SELECT id, username, nombre, rol, ambito_id FROM users WHERE username = "dkong"'
    );
    console.log('1️⃣  Usuario dkong:');
    console.log(users);

    if (users.length === 0) {
      console.log('❌ No existe usuario "dkong"');
      return;
    }

    const dkongId = users[0].id;
    console.log(`\n   → ID de dkong: ${dkongId}\n`);

    // 2. Comisiones donde dkong es comisionado (todos los estados)
    const [comisionadoComisiones] = await pool.query(
      `SELECT 
        c.id as comision_id,
        c.lugar,
        c.aprobacion_estado,
        c.presupuesto_estado,
        cc.usuario_id,
        u.nombre as comisionado_nombre
       FROM comisiones c
       INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
       INNER JOIN users u ON cc.usuario_id = u.id
       WHERE cc.usuario_id = ?`,
      [dkongId]
    );
    
    console.log(`2️⃣  Comisiones donde dkong es comisionado (${comisionadoComisiones.length}):`);
    comisionadoComisiones.forEach(row => {
      console.log(`   - ID ${row.comision_id}: ${row.lugar} | Aprobación: ${row.aprobacion_estado} | Presupuesto: ${row.presupuesto_estado}`);
    });

    // 3. Comisiones donde dkong es comisionado CON filtros (APROBADA + PRESUPUESTO ASIGNADO)
    const [comisionadoFiltradas] = await pool.query(
      `SELECT 
        c.id as comision_id,
        c.lugar,
        c.aprobacion_estado,
        c.presupuesto_estado,
        u.nombre as comisionado_nombre
       FROM comisiones c
       INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
       INNER JOIN users u ON cc.usuario_id = u.id
       WHERE cc.usuario_id = ?
       AND c.aprobacion_estado = 'APROBADA'
       AND c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'`,
      [dkongId]
    );
    
    console.log(`\n3️⃣  Comisiones APROBADAS + PRESUPUESTO ASIGNADO (${comisionadoFiltradas.length}):`);
    comisionadoFiltradas.forEach(row => {
      console.log(`   ✅ ID ${row.comision_id}: ${row.lugar}`);
    });

    // 4. Las 4 comisiones que mencionaste
    const [comisionesEspecificas] = await pool.query(
      `SELECT 
        c.id,
        c.lugar,
        c.aprobacion_estado,
        c.presupuesto_estado,
        GROUP_CONCAT(u.nombre SEPARATOR ', ') as comisionados
       FROM comisiones c
       LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
       LEFT JOIN users u ON cc.usuario_id = u.id
       WHERE c.lugar IN ('SAN PEDRO LAGARTO', 'PUERTO INCA', 'PRUSIA Y OXAPAMPA')
       GROUP BY c.id
       ORDER BY c.id`
    );
    
    console.log('\n4️⃣  Las 4 comisiones que mencionaste:');
    comisionesEspecificas.forEach(row => {
      const esDkong = row.comisionados && row.comisionados.includes('Diego Kong');
      const emoji = esDkong ? '✅' : '❌';
      console.log(`   ${emoji} ID ${row.id}: ${row.lugar}`);
      console.log(`      Comisionados: ${row.comisionados || 'Ninguno'}`);
      console.log(`      Estados: ${row.aprobacion_estado} / ${row.presupuesto_estado}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarDkong();
