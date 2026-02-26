const { pool } = require('../config/database');

async function debugReporte() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 DEBUG: VERIFICANDO CÁLCULO DE MONTO TOTAL             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    connection = await pool.getConnection();
    console.log('✅ Conexión establecida\n');

    // 1. Ver datos de la comisión
    console.log('1️⃣  DATOS DE LA COMISIÓN:\n');
    const [comision] = await connection.query(
      `SELECT id, num_dias, costo_xdia, presupuesto_estado 
       FROM comisiones WHERE id = 1`
    );

    if (comision.length === 0) {
      console.log('❌ No hay comisión con ID 1');
      process.exit(1);
    }

    const c = comision[0];
    console.log(`   ID: ${c.id}`);
    console.log(`   Número de Días: ${c.num_dias}`);
    console.log(`   Costo por Día: S/. ${c.costo_xdia}`);
    console.log(`   Estado: ${c.presupuesto_estado}\n`);

    // 2. Ver todos los comisionados
    console.log('2️⃣  COMISIONADOS EN LA TABLA comision_comisionados:\n');
    const [comisionados] = await connection.query(
      `SELECT 
         cc.id,
         cc.comision_id,
         cc.usuario_id,
         cc.dias,
         cc.costo_xdia,
         cc.monto,
         u.nombre as usuario_nombre
       FROM comision_comisionados cc
       LEFT JOIN users u ON cc.usuario_id = u.id
       WHERE cc.comision_id = 1
       ORDER BY cc.id`
    );

    console.log(`   Total de registros: ${comisionados.length}\n`);

    let sumaMontos = 0;
    const usuariosUnicos = new Set();

    comisionados.forEach((cc, idx) => {
      console.log(`   ${idx + 1}. ID: ${cc.id}`);
      console.log(`      Usuario: ${cc.usuario_nombre || 'N/A'} (ID: ${cc.usuario_id})`);
      console.log(`      Días: ${cc.dias}`);
      console.log(`      Costo/Día: S/. ${cc.costo_xdia}`);
      console.log(`      Monto: S/. ${cc.monto}`);
      console.log('');

      sumaMontos += parseFloat(cc.monto) || 0;
      usuariosUnicos.add(cc.usuario_id);
    });

    console.log(`   Suma Total de Montos: S/. ${sumaMontos.toFixed(2)}`);
    console.log(`   Usuarios Únicos: ${usuariosUnicos.size}\n`);

    // 3. Cálculo actual del SQL
    console.log('3️⃣  CÁLCULO ACTUAL (SQL de reporte):\n');
    const [reporteSql] = await connection.query(
      `SELECT 
        c.id,
        c.num_dias,
        c.costo_xdia,
        COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
        (c.num_dias * c.costo_xdia * COUNT(DISTINCT cc.usuario_id)) as monto_total_formula
       FROM comisiones c
       LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
       WHERE c.id = 1
       GROUP BY c.id`
    );

    const rs = reporteSql[0];
    console.log(`   num_dias: ${rs.num_dias}`);
    console.log(`   costo_xdia: S/. ${rs.costo_xdia}`);
    console.log(`   cantidad_comisionados: ${rs.cantidad_comisionados}`);
    console.log(`   Cálculo: ${rs.num_dias} × ${rs.costo_xdia} × ${rs.cantidad_comisionados}`);
    console.log(`   RESULTADO: S/. ${rs.monto_total_formula}\n`);

    // 4. Comparación
    console.log('4️⃣  ANÁLISIS:\n');
    console.log(`   Suma de montos en tabla: S/. ${sumaMontos.toFixed(2)}`);
    console.log(`   Cálculo de fórmula: S/. ${rs.monto_total_formula}`);
    console.log(`   Diferencia: S/. ${(sumaMontos - rs.monto_total_formula).toFixed(2)}\n`);

    if (sumaMontos !== rs.monto_total_formula) {
      console.log('⚠️  DISCREPANCIA DETECTADA:\n');
      console.log(`   La suma de montos (${sumaMontos.toFixed(2)}) NO coincide`);
      console.log(`   con la fórmula (${rs.monto_total_formula})\n`);
      console.log('   OPCIONES:\n');
      console.log('   1. Usar SUM(cc.monto) - suma los montos registrados');
      console.log('   2. Usar num_dias × costo_xdia × cantidad - fórmula estándar\n');
    }

    // 5. Opción alternativa: sumar los montos reales
    console.log('5️⃣  OPCIÓN ALTERNATIVA (SUM de montos reales):\n');
    const [sumMontos] = await connection.query(
      `SELECT 
        COUNT(DISTINCT usuario_id) as cantidad_comisionados,
        SUM(monto) as monto_total_sumado
       FROM comision_comisionados 
       WHERE comision_id = 1`
    );

    console.log(`   Cantidad de comisionados: ${sumMontos[0].cantidad_comisionados}`);
    console.log(`   Suma de montos: S/. ${sumMontos[0].monto_total_sumado || 0}\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✨ DEBUG COMPLETADO                                      ║');
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

debugReporte();
