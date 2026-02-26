const { pool } = require('../config/database');

async function testReporteConClasificadores() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🧪 TEST: REPORTE CON CLASIFICADORES                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Obtener comisiones de febrero de 2026
    const fechaInicio = '2026-02-01';
    const fechaFin = '2026-02-28';

    const [comisiones] = await pool.query(
      `SELECT 
        c.id,
        c.ambito_id,
        a.nombre as ambito_nombre,
        c.lugar,
        c.presupuesto_numero_cut,
        COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
        COALESCE(SUM(cc.monto), 0) as monto_total
      FROM comisiones c
      LEFT JOIN ambitos a ON c.ambito_id = a.id
      LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
      WHERE c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
        AND c.presupuesto_fecha BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY c.presupuesto_fecha DESC, c.id DESC`,
      [fechaInicio, fechaFin]
    );

    console.log(`📊 Comisiones encontradas: ${comisiones.length}\n`);

    for (const comision of comisiones) {
      console.log(`\n🔍 Comisión ID ${comision.id}:`);
      console.log(`   Ámbito: ${comision.ambito_nombre}`);
      console.log(`   Lugar: ${comision.lugar} ← NUEVA INFORMACIÓN`);
      console.log(`   CUT: ${comision.presupuesto_numero_cut}`);
      console.log(`   Comisionados: ${comision.cantidad_comisionados}`);
      console.log(`   Monto Total: S/. ${parseFloat(comision.monto_total).toFixed(2)}\n`);

      // Obtener desglose por clasificador
      const [clasificadores] = await pool.query(
        `SELECT 
          cl.id,
          cl.nombre as clasificador,
          COUNT(DISTINCT cc.usuario_id) as cantidad_usuarios,
          COALESCE(SUM(cc.monto), 0) as monto_clasificador,
          GROUP_CONCAT(DISTINCT u.nombre SEPARATOR ', ') as usuarios
        FROM comision_comisionados cc
        LEFT JOIN clasificadores cl ON cc.clasificador_id = cl.id
        LEFT JOIN users u ON cc.usuario_id = u.id
        WHERE cc.comision_id = ?
        GROUP BY cc.clasificador_id, cl.id, cl.nombre
        ORDER BY cl.nombre`,
        [comision.id]
      );

      console.log(`   📋 DESGLOSE POR CLASIFICADOR (PRESUPUESTAL):\n`);

      if (clasificadores.length === 0) {
        console.log(`      ⚠️  No hay clasificadores registrados\n`);
      } else {
        console.log(`   ┌─────────────────────────┬──────────┬─────────────┐`);
        console.log(`   │ Clasificador            │ Cantidad │ Monto (S/.) │`);
        console.log(`   ├─────────────────────────┼──────────┼─────────────┤`);

        let totalClasificadores = 0;
        clasificadores.forEach((cl) => {
          const nombre = (cl.clasificador || 'Sin clasificar').padEnd(23);
          const cantidad = (cl.cantidad_usuarios || 0).toString().padEnd(8);
          const monto = parseFloat(cl.monto_clasificador || 0).toFixed(2).padStart(11);
          console.log(`   │ ${nombre} │ ${cantidad} │ ${monto} │`);
          totalClasificadores += parseFloat(cl.monto_clasificador) || 0;
        });

        console.log(`   ├─────────────────────────┼──────────┼─────────────┤`);
        const totalStr = totalClasificadores.toFixed(2).padStart(11);
        console.log(`   │ SUBTOTAL (COMISIÓN)     │          │ ${totalStr} │`);
        console.log(`   └─────────────────────────┴──────────┴─────────────┘\n`);

        // Validación
        if (totalClasificadores !== parseFloat(comision.monto_total)) {
          console.log(`   ⚠️  ADVERTENCIA: Suma de clasificadores (${totalClasificadores.toFixed(2)})`);
          console.log(`               ≠ Monto total (${parseFloat(comision.monto_total).toFixed(2)})\n`);
        } else {
          console.log(`   ✅ Las sumas coinciden perfectamente\n`);
        }
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TEST COMPLETADO - DATOS LISTOS PARA REPORTE             ║');
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

testReporteConClasificadores();
