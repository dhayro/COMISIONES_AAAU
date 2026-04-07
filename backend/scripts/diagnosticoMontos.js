/**
 * Script para diagnosticar el estado de los montos_utilizado
 * Muestra discrepancias y ayuda a identificar problemas
 * 
 * Uso: node scripts/diagnosticoMontos.js
 */

const mysql = require('mysql2/promise');
const path = require('path');

// Cargar configuración
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function diagnosticoMontos() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('\n🔍 ========== DIAGNÓSTICO DE MONTOS UTILIZADOS ==========\n');
    
    // Obtener resumen de detalles_certificacion_credito
    const [resumenCerts] = await connection.query(`
      SELECT 
        dcc.id,
        cc.nota as certificacion_nota,
        cc.mes,
        c.nombre as clasificador_nombre,
        dcc.monto,
        dcc.monto_utilizado,
        (dcc.monto - dcc.monto_utilizado) as saldo_disponible,
        COUNT(fed.id) as num_formatos_asociados,
        SUM(COALESCE(fed.monto, 0)) as total_montos_en_formatos
      FROM detalles_certificacion_credito dcc
      LEFT JOIN certificaciones_credito cc ON dcc.certificacion_credito_id = cc.id
      LEFT JOIN clasificadores c ON dcc.clasificador_id = c.id
      LEFT JOIN formato_emisiones_detalles fed ON dcc.id = fed.detalles_certificacion_credito_id
      GROUP BY dcc.id
      ORDER BY cc.nota DESC, c.nombre
    `);
    
    console.log('📊 ESTADO ACTUAL DE DETALLES CERTIFICACIÓN:');
    console.log('═'.repeat(120));
    
    let discrepancias = [];
    let totalMonto = 0;
    let totalUtilizado = 0;
    let certificacionesConProblema = new Set();
    
    for (const item of resumenCerts) {
      const esperado = item.total_montos_en_formatos || 0;
      const actual = item.monto_utilizado || 0;
      const discrepancia = Math.abs(esperado - actual);
      
      totalMonto += item.monto;
      totalUtilizado += actual;
      
      if (discrepancia > 0.01) {
        discrepancias.push({
          id: item.id,
          certificacion: `CCP ${item.certificacion_nota}`,
          mes: item.mes,
          clasificador: item.clasificador_nombre,
          monto_total: item.monto,
          monto_utilizado_actual: actual,
          monto_esperado: esperado,
          diferencia: (esperado - actual).toFixed(2),
          num_formatos: item.num_formatos_asociados,
          estado: esperado > item.monto ? '⚠️  SOBREGIRO' : '❌ DISCREPANCIA'
        });
        certificacionesConProblema.add(item.certificacion_nota);
        
        console.log(`⚠️  DISCREPANCIA - Detalle ID: ${item.id}`);
        console.log(`   CCP: ${item.certificacion_nota} | Mes: ${item.mes} | Clasificador: ${item.clasificador_nombre}`);
        console.log(`   Monto Total: S/. ${item.monto.toFixed(2)}`);
        console.log(`   Esperado en BD: S/. ${esperado.toFixed(2)}`);
        console.log(`   Actual en BD: S/. ${actual.toFixed(2)}`);
        console.log(`   Diferencia: S/. ${(esperado - actual).toFixed(2)}`);
        console.log(`   Formatos asociados: ${item.num_formatos_asociados}`);
        
        if (esperado > item.monto) {
          console.log(`   🚨 CRÍTICO: UTILIZADO > DISPONIBLE (SOBREGIRO)`);
        }
        console.log('');
      }
    }
    
    console.log('═'.repeat(120));
    console.log(`\n📈 TOTALES`);
    console.log(`Total Monto Certificado: S/. ${totalMonto.toFixed(2)}`);
    console.log(`Total Monto Utilizado: S/. ${totalUtilizado.toFixed(2)}`);
    console.log(`Saldo General: S/. ${(totalMonto - totalUtilizado).toFixed(2)}`);
    
    if (discrepancias.length > 0) {
      console.log(`\n⚠️  PROBLEMAS ENCONTRADOS: ${discrepancias.length}`);
      console.log(`📋 Certificaciones afectadas: ${certificacionesConProblema.size}`);
      console.log(`   ${Array.from(certificacionesConProblema).join(', ')}`);
      
      console.log('\n' + '─'.repeat(120));
      console.log('📋 RESUMEN DE DISCREPANCIAS:');
      console.log('─'.repeat(120));
      
      // Agrupar por certificación
      const porCertificacion = {};
      for (const disc of discrepancias) {
        if (!porCertificacion[disc.certificacion]) {
          porCertificacion[disc.certificacion] = [];
        }
        porCertificacion[disc.certificacion].push(disc);
      }
      
      for (const [cert, items] of Object.entries(porCertificacion)) {
        console.log(`\n${cert}`);
        for (const item of items) {
          console.log(`  • ${item.clasificador}`);
          console.log(`    Diferencia: S/. ${item.diferencia}`);
          console.log(`    Estado: ${item.estado}`);
        }
      }
    } else {
      console.log(`\n✅ NO HAY DISCREPANCIAS - Todos los montos están correctos`);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
    await pool.end();
  }
}

// Ejecutar
diagnosticoMontos()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
