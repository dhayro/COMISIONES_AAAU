const { pool } = require('../config/database');

async function verificarEstructuraDB() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 VERIFICANDO ESTRUCTURA DE LA BASE DE DATOS            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    // Obtener todas las tablas
    const [tables] = await connection.query(
      `SELECT TABLE_NAME, TABLE_ROWS 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE()
       ORDER BY TABLE_NAME`
    );

    console.log('📊 TABLAS EN LA BASE DE DATOS:\n');
    tables.forEach((table) => {
      console.log(`   ✓ ${table.TABLE_NAME} (${table.TABLE_ROWS || 0} registros)`);
    });

    console.log('\n📋 DETALLES POR TABLA:\n');

    for (const table of tables) {
      console.log(`\n   ${table.TABLE_NAME}:`);
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
         FROM information_schema.COLUMNS 
         WHERE TABLE_NAME = ? 
         AND TABLE_SCHEMA = DATABASE()`,
        [table.TABLE_NAME]
      );

      columns.forEach((col) => {
        console.log(`      - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Verificar comision_comisionados específicamente
    console.log('🎯 TABLA comision_comisionados:\n');
    const [cc] = await connection.query(
      `SELECT COUNT(*) as total FROM comision_comisionados`
    );

    console.log(`   Total de registros: ${cc[0].total}\n`);

    if (cc[0].total > 0) {
      const [sample] = await connection.query(
        `SELECT * FROM comision_comisionados LIMIT 5`
      );

      console.log('   Primeros 5 registros:\n');
      sample.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ID: ${row.id}`);
        console.log(`      comision_id: ${row.comision_id}`);
        console.log(`      usuario_id: ${row.usuario_id}`);
        console.log(`      monto: S/. ${row.monto}`);
        console.log(`      dias: ${row.dias}`);
        console.log(`      costo_xdia: S/. ${row.costo_xdia}`);
        console.log('');
      });
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✨ Verificación completada                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message, '\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}

verificarEstructuraDB();
