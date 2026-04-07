#!/usr/bin/env node

/**
 * Script: Asignar ambito_id a todos los usuarios sin ámbito
 * Propósito: Garantizar que todos los usuarios tengan ambito_id para el filtrado
 */

const mysql = require('mysql2/promise');

async function asignarAmbitos() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  📝 ASIGNANDO ambito_id A USUARIOS SIN ÁMBITO      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Password123',
      database: 'comisiones_db'
    });

    console.log('✅ Conexión a BD establecida\n');

    // Obtener usuarios sin ambito_id
    const [usuariosSinAmbito] = await connection.query(
      `SELECT id, username, nombre, rol 
       FROM users 
       WHERE ambito_id IS NULL
       ORDER BY id`
    );

    if (usuariosSinAmbito.length === 0) {
      console.log('✅ Todos los usuarios ya tienen ambito_id asignado\n');
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║  ✅ Verificación completada                        ║');
      console.log('╚════════════════════════════════════════════════════╝\n');
      await connection.end();
      return;
    }

    console.log(`📊 Encontrados ${usuariosSinAmbito.length} usuario(s) sin ambito_id:\n`);
    console.log('ID  | Username       | Nombre              | Rol');
    console.log('─'.repeat(62));
    usuariosSinAmbito.forEach(u => {
      console.log(
        `${String(u.id).padEnd(4)}| ` +
        `${u.username.padEnd(15)}| ` +
        `${u.nombre.padEnd(20)}| ` +
        `${u.rol}`
      );
    });

    // Preguntar confirmación
    console.log('\n⚠️  Se asignará ambito_id = 1 (AAA UCAYALI) a estos usuarios\n');

    // Asignar ambito_id = 1 (AAA UCAYALI) a todos los sin ámbito
    console.log('🔄 Asignando ambito_id = 1 (AAA UCAYALI)...\n');
    const [result] = await connection.query(
      `UPDATE users 
       SET ambito_id = 1 
       WHERE ambito_id IS NULL`
    );

    console.log(`✅ ${result.affectedRows} usuario(s) actualizado(s)\n`);

    // Verificar resultado
    const [verificacion] = await connection.query(
      `SELECT id, username, nombre, ambito_id 
       FROM users 
       WHERE id IN (?)
       ORDER BY id`,
      [usuariosSinAmbito.map(u => u.id)]
    );

    console.log('📋 Estado después de la asignación:\n');
    console.log('ID  | Username       | Nombre              | Ámbito ID');
    console.log('─'.repeat(62));
    verificacion.forEach(u => {
      console.log(
        `${String(u.id).padEnd(4)}| ` +
        `${u.username.padEnd(15)}| ` +
        `${u.nombre.padEnd(20)}| ` +
        `${u.ambito_id}`
      );
    });

    // Verificación final
    const [todosConAmbito] = await connection.query(
      `SELECT COUNT(*) as sin_ambito FROM users WHERE ambito_id IS NULL`
    );

    console.log('\n' + '─'.repeat(62));
    if (todosConAmbito[0].sin_ambito === 0) {
      console.log('✅ VERIFICACIÓN FINAL: Todos los usuarios tienen ambito_id ✅\n');
    } else {
      console.log(`⚠️  ${todosConAmbito[0].sin_ambito} usuario(s) aún sin ambito_id\n`);
    }

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║  ✅ Asignación completada                          ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    await connection.end();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

asignarAmbitos();
