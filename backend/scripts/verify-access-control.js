#!/usr/bin/env node

/**
 * Script para verificar que el control de acceso funcione correctamente
 * Verifica estructura de tabla y datos de prueba
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarAcceso() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔐 VERIFICACIÓN DE CONTROL DE ACCESO                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });

    console.log('✅ Conectado a la base de datos\n');

    // 1. Verificar que tabla users tiene columna ambito_id
    console.log('📋 1. Verificando estructura de tabla users...\n');
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
       FROM information_schema.COLUMNS 
       WHERE TABLE_NAME = 'users' 
       AND TABLE_SCHEMA = DATABASE()`
    );

    const tieneAmbitoId = columns.some(col => col.COLUMN_NAME === 'ambito_id');
    if (tieneAmbitoId) {
      console.log('✅ Columna ambito_id existe en tabla users');
      const ambitoCol = columns.find(col => col.COLUMN_NAME === 'ambito_id');
      console.log(`   Tipo: ${ambitoCol.COLUMN_TYPE}`);
      console.log(`   Nullable: ${ambitoCol.IS_NULLABLE}\n`);
    } else {
      console.log('❌ ERROR: Columna ambito_id NO existe en tabla users');
      console.log('   Necesita agregar: ALTER TABLE users ADD COLUMN ambito_id INT;\n');
    }

    // 2. Verificar usuarios y sus ámbitos
    console.log('📋 2. Verificando usuarios y sus ámbitos...\n');
    const [users] = await connection.query(
      `SELECT u.id, u.username, u.rol, u.ambito_id, 
              COALESCE(a.nombre_corto, 'Sin ámbito') as ambito_nombre,
              COALESCE(IF(a.dependencia_id IS NULL, 'AAA', 'ALA'), 'N/A') as tipo_ambito
       FROM users u
       LEFT JOIN ambitos a ON u.ambito_id = a.id
       ORDER BY u.id`
    );

    if (users.length > 0) {
      console.log('Usuario                 Rol              Ámbito ID   Ámbito Nombre          Tipo Ámbito');
      console.log('───────────────────────────────────────────────────────────────────────────────────────');
      users.forEach(user => {
        const username = (user.username || 'N/A').padEnd(23);
        const rol = (user.rol || 'N/A').padEnd(16);
        const ambitoId = (user.ambito_id || 'NULL').toString().padEnd(11);
        const ambitoNombre = (user.ambito_nombre || 'NULL').padEnd(22);
        const tipoAmbito = user.tipo_ambito || 'N/A';
        console.log(`${username}${rol}${ambitoId}${ambitoNombre}${tipoAmbito}`);
      });
      console.log();
    }

    // 3. Contar certificaciones por ámbito
    console.log('📋 3. Contando certificaciones por ámbito...\n');
    const [certPorAmbito] = await connection.query(
      `SELECT a.id, a.nombre_corto, COUNT(cc.id) as total_certificaciones
       FROM ambitos a
       LEFT JOIN metas m ON a.id = m.ambito_id
       LEFT JOIN certificaciones_credito cc ON m.id = cc.meta_id
       WHERE a.activo = 1
       GROUP BY a.id, a.nombre_corto
       ORDER BY a.id`
    );

    if (certPorAmbito.length > 0) {
      console.log('Ámbito ID   Ámbito Nombre                  Total Certificaciones');
      console.log('───────────────────────────────────────────────────────────────');
      certPorAmbito.forEach(row => {
        const id = row.id.toString().padEnd(11);
        const nombre = (row.nombre_corto || 'N/A').padEnd(30);
        const total = row.total_certificaciones || 0;
        console.log(`${id}${nombre}${total}`);
      });
      console.log();
    }

    // 4. Simular filtrado para usuarios específicos
    console.log('📋 4. Simulando acceso para usuarios específicos...\n');
    
    const usuariosTest = ['rflores', 'lrios'];
    
    for (const username of usuariosTest) {
      const [userData] = await connection.query(
        'SELECT u.id, u.username, u.rol, u.ambito_id, a.nombre_corto, a.dependencia_id FROM users u LEFT JOIN ambitos a ON u.ambito_id = a.id WHERE u.username = ?',
        [username]
      );

      if (userData.length > 0) {
        const user = userData[0];
        console.log(`👤 Usuario: ${user.username}`);
        console.log(`   Rol: ${user.rol}`);
        console.log(`   Ámbito ID: ${user.ambito_id || 'NULL'}`);
        console.log(`   Ámbito: ${user.nombre_corto || 'Sin ámbito'}`);
        
        let tipoAmbito = 'N/A';
        let debeVerTodo = false;
        let filtroAplicado = null;

        // Determinar tipo de ámbito y si debe ver todo
        if (user.ambito_id) {
          if (user.dependencia_id === null) {
            tipoAmbito = 'AAA (Administrador de todas las ALAs)';
            debeVerTodo = true;
          } else {
            tipoAmbito = 'ALA (Solo su ámbito)';
            debeVerTodo = false;
            filtroAplicado = user.ambito_id;
          }
        } else {
          tipoAmbito = 'Sin ámbito';
          debeVerTodo = true;
        }

        console.log(`   Tipo: ${tipoAmbito}`);
        console.log(`   Debe ver: ${debeVerTodo ? 'TODOS los certificados' : `Solo certificados del ámbito ${user.ambito_id}`}`);
        
        // Contar certificados según la regla
        let certsQuery = `SELECT cc.id, cc.nota, cc.mes, cc.numero_documento, 
                                 a.nombre_corto as ambito_nombre
                          FROM certificaciones_credito cc
                          LEFT JOIN metas m ON cc.meta_id = m.id
                          LEFT JOIN ambitos a ON m.ambito_id = a.id`;
        
        const params = [];
        if (filtroAplicado) {
          certsQuery += ` WHERE a.id = ?`;
          params.push(filtroAplicado);
        }
        
        const [certs] = await connection.query(certsQuery, params);
        
        console.log(`   Certificaciones visibles: ${certs.length}`);
        if (certs.length > 0) {
          console.log('   Primeras 3:');
          certs.slice(0, 3).forEach((cert, idx) => {
            console.log(`      ${idx + 1}. Nota: ${cert.nota}, Mes: ${cert.mes}, Doc: ${cert.numero_documento}, Ámbito: ${cert.ambito_nombre}`);
          });
          if (certs.length > 3) {
            console.log(`      ... y ${certs.length - 3} más`);
          }
        }
        console.log();
      } else {
        console.log(`❌ Usuario ${username} no encontrado\n`);
      }
    }

    // Total de certificaciones
    const [totalCerts] = await connection.query('SELECT COUNT(*) as total FROM certificaciones_credito');
    console.log(`📊 Total de certificaciones en BD: ${totalCerts[0].total}\n`);

    // 5. Resumen final
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ VERIFICACIÓN COMPLETADA                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📝 PRÓXIMOS PASOS:');
    console.log('   1. Reiniciar el servidor backend (npm run dev)');
    console.log('   2. Hacer logout y login nuevamente');
    console.log('   3. El token JWT ahora debe incluir ambito_id');
    console.log('   4. Las certificaciones se filtrarán según el ámbito\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

verificarAcceso();
