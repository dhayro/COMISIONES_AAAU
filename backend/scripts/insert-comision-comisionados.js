const { pool } = require('../config/database');

async function insertarDatosComisionComisionados() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  📝 INSERTANDO DATOS EN comision_comisionados             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    // Verificar si ya existen datos para la comisión ID 1
    const [existing] = await connection.query(
      `SELECT COUNT(*) as count FROM comision_comisionados WHERE comision_id = 1`
    );

    if (existing[0].count > 0) {
      console.log('⚠️  Ya existen registros para la comisión ID 1\n');
      
      const [datos] = await connection.query(
        `SELECT cc.*, u.nombre as usuario_nombre 
         FROM comision_comisionados cc
         LEFT JOIN usuarios u ON cc.usuario_id = u.id
         WHERE cc.comision_id = 1`
      );

      console.log('📊 Registros actuales:\n');
      datos.forEach((row, idx) => {
        console.log(`   ${idx + 1}. Usuario: ${row.usuario_nombre || 'N/A'} (ID: ${row.usuario_id})`);
        console.log(`      Monto: S/. ${row.monto}`);
        console.log(`      Días: ${row.dias} | Costo/Día: S/. ${row.costo_xdia}`);
        console.log('');
      });

      process.exit(0);
    }

    // Obtener usuarios para la comisión
    console.log('🔍 Buscando usuarios disponibles...\n');
    const [usuarios] = await connection.query(
      `SELECT id, nombre FROM usuarios LIMIT 3`
    );

    if (usuarios.length === 0) {
      throw new Error('No hay usuarios en la base de datos. Crea usuarios primero.');
    }

    console.log(`✅ Se encontraron ${usuarios.length} usuarios\n`);

    // Insertar comisionados para la comisión 1
    console.log('📝 Insertando comisionados...\n');

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      // Cálculo: 4 días × 220 costo/día = 880 por comisionado
      const monto = 880.00;

      await connection.query(
        `INSERT INTO comision_comisionados 
         (comision_id, usuario_id, clasificador_id, dias, costo_xdia, monto)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, usuario.id, 1, 4, 220.00, monto]
      );

      console.log(`   ✅ ${usuario.nombre} - Monto: S/. ${monto}`);
    }

    console.log('\n✅ Inserción completada\n');

    // Verificar el total
    const [total] = await connection.query(
      `SELECT 
        COUNT(*) as cantidad,
        SUM(monto) as monto_total
       FROM comision_comisionados 
       WHERE comision_id = 1`
    );

    console.log('📊 Resumen:\n');
    console.log(`   Total Comisionados: ${total[0].cantidad}`);
    console.log(`   Monto Total: S/. ${total[0].monto_total}\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✨ ¡ÉXITO! Datos insertados correctamente                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ ERROR                                                  ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('\n' + error.message + '\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
      console.log('✅ Conexión cerrada');
    }
  }
}

insertarDatosComisionComisionados();
