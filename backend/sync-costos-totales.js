const { pool } = require('./config/database');

/**
 * Script para sincronizar costo_total_comision con la suma real de comision_comisionados.monto
 * Esto corrige comisiones que tienen el costo_total_comision desactualizado
 */

async function sincronizarCostos() {
  try {
    console.log('🔄 INICIANDO SINCRONIZACIÓN DE COSTOS TOTALES...\n');

    // Obtener todas las comisiones
    const [comisiones] = await pool.query(
      `SELECT id, costo_total_comision FROM comisiones ORDER BY id`
    );

    console.log(`📊 Total de comisiones a procesar: ${comisiones.length}\n`);

    let actualizadas = 0;
    let sinCambios = 0;
    const discrepancias = [];

    for (const comision of comisiones) {
      const comisionId = comision.id;
      const costoActual = comision.costo_total_comision;

      // Calcular la suma real de comicionados
      const [comisionados] = await pool.query(
        `SELECT cc.*, cl.nombre as clasificador_nombre
         FROM comision_comisionados cc
         JOIN clasificadores cl ON cc.clasificador_id = cl.id
         WHERE cc.comision_id = ?`,
        [comisionId]
      );

      // Calcular total (misma lógica que en el modelo)
      let totalCalculado = 0;
      comisionados.forEach(com => {
        // Si el clasificador es VIÁTICOS, calcula días × costo_xdia
        let monto = com.monto;
        if (com.clasificador_nombre && com.clasificador_nombre.includes('VIÁTICOS')) {
          monto = com.dias * com.costo_xdia;
        }
        totalCalculado += parseFloat(monto) || 0;
      });

      // Comparar y actualizar si hay diferencia
      if (Math.abs(parseFloat(costoActual) - totalCalculado) > 0.01) {
        // Hay diferencia
        console.log(`⚠️  Comisión ID ${comisionId}:`);
        console.log(`   Costo actual en DB: ${costoActual}`);
        console.log(`   Suma real calculada: ${totalCalculado.toFixed(2)}`);
        console.log(`   Diferencia: ${(totalCalculado - costoActual).toFixed(2)}\n`);

        // Actualizar
        await pool.query(
          `UPDATE comisiones SET costo_total_comision = ? WHERE id = ?`,
          [totalCalculado, comisionId]
        );

        actualizadas++;
        discrepancias.push({
          comision_id: comisionId,
          costo_anterior: costoActual,
          costo_nuevo: totalCalculado,
          diferencia: totalCalculado - costoActual
        });
      } else {
        sinCambios++;
      }
    }

    console.log('\n✅ SINCRONIZACIÓN COMPLETADA');
    console.log(`   Comisiones actualizadas: ${actualizadas}`);
    console.log(`   Comisiones sin cambios: ${sinCambios}`);

    if (discrepancias.length > 0) {
      console.log('\n📋 RESUMEN DE CAMBIOS:');
      console.log('=====================================');
      discrepancias.forEach(d => {
        console.log(`Comisión ${d.comision_id}: ${d.costo_anterior} → ${d.costo_nuevo.toFixed(2)} (Δ ${d.diferencia.toFixed(2)})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

sincronizarCostos();
