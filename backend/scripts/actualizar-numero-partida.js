const { pool } = require('../config/database');

async function actualizarPartida() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔄 ACTUALIZANDO NÚMERO DE PARTIDA EN COMISIÓN DE PRUEBA   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Actualizar comisión 1 con número de partida
    const numeroPartida = '5.2.1.01.03'; // Ejemplo: Código presupuestal
    
    const [result] = await connection.query(
      `UPDATE comisiones SET numero_partida = ? WHERE id = 1`,
      [numeroPartida]
    );

    console.log(`✅ Comisión actualizada:`);
    console.log(`   ID: 1`);
    console.log(`   Número de Partida: ${numeroPartida}\n`);

    // Verificar datos
    const [datos] = await connection.query(
      `SELECT 
        c.id, c.lugar, c.numero_partida, c.presupuesto_numero_cut, 
        COALESCE(SUM(cc.monto), 0) as monto_total
      FROM comisiones c
      LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
      WHERE c.id = 1
      GROUP BY c.id`
    );

    if (datos.length > 0) {
      const d = datos[0];
      console.log('📊 Comisión actualizada:\n');
      console.log(`   ID: ${d.id}`);
      console.log(`   Lugar: ${d.lugar}`);
      console.log(`   Partida: ${d.numero_partida}`);
      console.log(`   CUT: ${d.presupuesto_numero_cut}`);
      console.log(`   Monto: S/. ${parseFloat(d.monto_total).toFixed(2)}\n`);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ACTUALIZACIÓN COMPLETADA                               ║');
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

actualizarPartida();
