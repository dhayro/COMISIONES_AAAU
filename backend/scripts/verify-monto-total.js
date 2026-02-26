const { pool } = require('../config/database');

async function verificarMontoTotal() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ VERIFICACIÓN: MONTO TOTAL CORREGIDO                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Ejecutar la consulta que se usa en el reporte
    const [resultado] = await connection.query(
      `SELECT 
        c.id,
        c.presupuesto_numero_cut,
        COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
        COALESCE(SUM(cc.monto), 0) as monto_total
      FROM comisiones c
      LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
      WHERE c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
        AND c.id = 1
      GROUP BY c.id`
    );

    if (resultado.length === 0) {
      console.log('❌ No se encontró comisión\n');
      process.exit(1);
    }

    const row = resultado[0];
    console.log(`📊 COMISIÓN ID: ${row.id}`);
    console.log(`   CUT: ${row.presupuesto_numero_cut}`);
    console.log(`   Cantidad de Comisionados: ${row.cantidad_comisionados}`);
    console.log(`   MONTO TOTAL: S/. ${parseFloat(row.monto_total).toFixed(2)}\n`);

    console.log('✨ DESGLOSE DE MONTOS:\n');
    
    const [comisionados] = await connection.query(
      `SELECT 
        cc.id,
        u.nombre,
        cc.dias,
        cc.costo_xdia,
        cc.monto
      FROM comision_comisionados cc
      LEFT JOIN users u ON cc.usuario_id = u.id
      WHERE cc.comision_id = 1
      ORDER BY cc.id`
    );

    let total = 0;
    comisionados.forEach((c, idx) => {
      const monto = parseFloat(c.monto);
      console.log(`   ${idx + 1}. ${c.nombre}: S/. ${monto.toFixed(2)}`);
      total += monto;
    });

    console.log(`\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   TOTAL INGRESADO: S/. ${total.toFixed(2)}`);
    console.log(`   TOTAL EN REPORTE: S/. ${parseFloat(row.monto_total).toFixed(2)}`);
    
    if (total === parseFloat(row.monto_total)) {
      console.log(`   ✅ LOS TOTALES COINCIDEN\n`);
    } else {
      console.log(`   ❌ LOS TOTALES NO COINCIDEN\n`);
    }

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ VERIFICACIÓN COMPLETADA                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

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

verificarMontoTotal();
