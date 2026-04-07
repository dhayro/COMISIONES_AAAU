#!/usr/bin/env node

/**
 * Script de Verificación: Estado de ambito_id en comision_comisionados
 * Propósito: Verificar que todos los usuarios en comision_comisionados tienen ambito_id
 */

const mysql = require('mysql2/promise');

async function verificarDatos() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 VERIFICACIÓN: ambito_id en comision_comisionados       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Password123',
      database: 'comisiones_db'
    });

    console.log('✅ Conexión a BD establecida\n');

    // 1. Ver estructura de comision_comisionados
    console.log('📋 ESTRUCTURA DE TABLA comision_comisionados:');
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE 
       FROM information_schema.COLUMNS 
       WHERE TABLE_NAME = 'comision_comisionados' 
       AND TABLE_SCHEMA = 'comisiones_db'`
    );
    columns.forEach(col => {
      console.log(`   ✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // 2. Ver comisionados con sus datos
    console.log('\n📊 COMISIONADOS CON DATOS DE USUARIO:\n');
    const [comisionados] = await connection.query(
      `SELECT 
         cc.id as 'CC ID',
         cc.comision_id,
         cc.usuario_id,
         u.nombre as 'Usuario',
         u.ambito_id as 'Ámbito ID Usuario',
         a.nombre_corto as 'Ámbito Nombre',
         cl.nombre as 'Clasificador'
       FROM comision_comisionados cc
       JOIN users u ON cc.usuario_id = u.id
       LEFT JOIN ambitos a ON u.ambito_id = a.id
       JOIN clasificadores cl ON cc.clasificador_id = cl.id
       ORDER BY cc.comision_id, cc.usuario_id`
    );

    if (comisionados.length === 0) {
      console.log('   ⚠️  No hay comisionados en la BD\n');
    } else {
      console.log('Comisionado | Comisión | Usuario ID | Usuario Nombre | Ámbito ID | Ámbito Nombre');
      console.log('─'.repeat(90));
      comisionados.forEach(row => {
        const ambitoId = row['Ámbito ID Usuario'] === null ? '❌ NULL' : `✅ ${row['Ámbito ID Usuario']}`;
        const ambitoNombre = row['Ámbito Nombre'] || '(sin ámbito)';
        console.log(
          `${String(row['CC ID']).padEnd(11)} | ` +
          `${String(row.comision_id).padEnd(8)} | ` +
          `${String(row.usuario_id).padEnd(10)} | ` +
          `${row['Usuario'].padEnd(15)} | ` +
          `${ambitoId.padEnd(11)} | ` +
          `${ambitoNombre}`
        );
      });
    }

    // 3. Verificar usuarios sin ambito_id
    console.log('\n\n⚠️  USUARIOS SIN ambito_id ASIGNADO:\n');
    const [sinAmbito] = await connection.query(
      `SELECT u.id, u.username, u.nombre, u.rol
       FROM users u
       WHERE u.ambito_id IS NULL
       ORDER BY u.id`
    );

    if (sinAmbito.length === 0) {
      console.log('   ✅ Todos los usuarios tienen ambito_id asignado\n');
    } else {
      console.log(`   ❌ ${sinAmbito.length} usuario(s) sin ambito_id:\n`);
      sinAmbito.forEach(user => {
        console.log(`      • ID ${user.id}: ${user.username} (${user.nombre}) - Rol: ${user.rol}`);
      });
      console.log('');
    }

    // 4. Verificar estructura de datos para administrativo específico (rflores)
    console.log('👤 VERIFICACIÓN ESPECÍFICA: Usuario rflores\n');
    const [rfloresData] = await connection.query(
      `SELECT id, username, nombre, rol, ambito_id 
       FROM users 
       WHERE username = 'rflores'`
    );

    if (rfloresData.length === 0) {
      console.log('   ❌ Usuario rflores no encontrado\n');
    } else {
      const rflores = rfloresData[0];
      console.log(`   Usuario: ${rflores.username} (${rflores.nombre})`);
      console.log(`   Rol: ${rflores.rol}`);
      console.log(`   Ámbito ID: ${rflores.ambito_id}`);

      // Obtener ámbito
      if (rflores.ambito_id) {
        const [ambitoRflores] = await connection.query(
          `SELECT id, nombre_corto, dependencia_id 
           FROM ambitos 
           WHERE id = ?`,
          [rflores.ambito_id]
        );
        if (ambitoRflores.length > 0) {
          const ambito = ambitoRflores[0];
          console.log(`   Ámbito Nombre: ${ambito.nombre_corto}`);
          console.log(`   Tipo: ${ambito.dependencia_id === null ? 'AAA (Administrador)' : `ALA (dependencia_id=${ambito.dependencia_id})`}`);

          // Si es AAA, listar sus ALAs
          if (ambito.dependencia_id === null) {
            const [alas] = await connection.query(
              `SELECT id, nombre_corto 
               FROM ambitos 
               WHERE dependencia_id = ?
               ORDER BY id`,
              [rflores.ambito_id]
            );
            if (alas.length > 0) {
              console.log(`   ALAs dependientes: ${alas.map(a => a.nombre_corto).join(', ')}`);
            }
          }

          // Listar comisiones que debería ver
          console.log(`\n   Comisiones que rflores debería ver:\n`);
          const [comisionesRflores] = await connection.query(
            `SELECT DISTINCT
               c.id,
               c.lugar,
               u.nombre as 'Usuario Comisionado',
               u.ambito_id as 'Ámbito Comisionado',
               a.nombre_corto as 'Ámbito Nombre'
             FROM comisiones c
             JOIN comision_comisionados cc ON c.id = cc.comision_id
             JOIN users u ON cc.usuario_id = u.id
             LEFT JOIN ambitos a ON u.ambito_id = a.id
             ORDER BY c.id, u.nombre`,
            []
          );

          if (comisionesRflores.length === 0) {
            console.log('      ⚠️  No hay comisiones con comisionados\n');
          } else {
            console.log('      Comisión | Lugar | Comisionado | Ámbito Comisionado');
            console.log('      ' + '─'.repeat(60));
            const comisionesAgrupadas = {};
            comisionesRflores.forEach(row => {
              if (!comisionesAgrupadas[row.id]) {
                comisionesAgrupadas[row.id] = {
                  lugar: row.lugar,
                  comisionados: []
                };
              }
              comisionesAgrupadas[row.id].comisionados.push({
                nombre: row['Usuario Comisionado'],
                ambitoId: row['Ámbito Comisionado'],
                ambitoNombre: row['Ámbito Nombre']
              });
            });

            Object.entries(comisionesAgrupadas).forEach(([comisionId, data]) => {
              console.log(`      ${comisionId.padEnd(9)} | ${data.lugar.padEnd(6)} |`);
              data.comisionados.forEach(com => {
                const ambitoStr = com.ambitoId === null ? 
                  'NULL ❌' : 
                  `${com.ambitoId} (${com.ambitoNombre || '?'})`;
                console.log(`      ${' '.repeat(9)} | ${' '.repeat(6)} | ${com.nombre.padEnd(11)} | ${ambitoStr}`);
              });
            });
            console.log('');
          }
        }
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ Verificación completada                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

verificarDatos();
