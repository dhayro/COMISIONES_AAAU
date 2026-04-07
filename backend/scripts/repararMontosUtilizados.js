/**
 * Script para reparar montos_utilizado en detalles_certificacion_credito
 * Recalcula basado en los detalles reales en formato_emisiones_detalles
 * 
 * Uso: node scripts/repararMontosUtilizados.js
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

async function repararMontosUtilizados() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('\n🔧 ========== INICIANDO REPARACIÓN DE MONTOS UTILIZADOS ==========\n');
    
    // 1️⃣ Reseteár todos los monto_utilizado a 0
    console.log('📊 PASO 1: Reseteando todos los monto_utilizado a 0');
    await connection.query(`UPDATE detalles_certificacion_credito SET monto_utilizado = 0`);
    console.log('✅ Todos los monto_utilizado reseteados a 0\n');
    
    // 2️⃣ Recalcular basado en detalles reales
    console.log('📊 PASO 2: Recalculando monto_utilizado desde formato_emisiones_detalles');
    const [detallesConMonto] = await connection.query(`
      SELECT 
        dcc.id as detalles_cert_id,
        dcc.certificacion_credito_id,
        dcc.clasificador_id,
        dcc.monto as monto_total_disponible,
        SUM(COALESCE(fed.monto, 0)) as monto_total_usado
      FROM detalles_certificacion_credito dcc
      LEFT JOIN formato_emisiones_detalles fed ON dcc.id = fed.detalles_certificacion_credito_id
      GROUP BY dcc.id
      ORDER BY dcc.certificacion_credito_id, dcc.clasificador_id
    `);
    
    console.log(`\n📋 Procesando ${detallesConMonto.length} detalles de certificación\n`);
    
    let totalActualizado = 0;
    let discrepancias = [];
    
    for (const item of detallesConMonto) {
      const montoUtilizadoNuevo = item.monto_total_usado || 0;
      
      // Verificar si hay discrepancia
      if (item.monto_total_usado > item.monto_total_disponible) {
        discrepancias.push({
          detalles_cert_id: item.detalles_cert_id,
          certificacion_credito_id: item.certificacion_credito_id,
          clasificador_id: item.clasificador_id,
          disponible: item.monto_total_disponible,
          usado: item.monto_total_usado,
          exceso: (item.monto_total_usado - item.monto_total_disponible).toFixed(2)
        });
      }
      
      await connection.query(
        `UPDATE detalles_certificacion_credito 
         SET monto_utilizado = ?
         WHERE id = ?`,
        [montoUtilizadoNuevo, item.detalles_cert_id]
      );
      
      console.log(`✅ Cert ${item.certificacion_credito_id} | Clase ${item.clasificador_id} | Detalle ${item.detalles_cert_id}`);
      console.log(`   Disponible: S/. ${item.monto_total_disponible.toFixed(2)} | Utilizado: S/. ${montoUtilizadoNuevo.toFixed(2)}`);
      
      totalActualizado++;
    }
    
    console.log(`\n✅ REPARACIÓN COMPLETADA`);
    console.log(`📊 Total detalles actualizados: ${totalActualizado}`);
    
    if (discrepancias.length > 0) {
      console.log(`\n⚠️  DISCREPANCIAS ENCONTRADAS: ${discrepancias.length}`);
      console.log('════════════════════════════════════════════════════════════');
      for (const disc of discrepancias) {
        console.log(`\n❌ Detalle ID ${disc.detalles_cert_id}`);
        console.log(`   Certificación: ${disc.certificacion_credito_id} | Clasificador: ${disc.clasificador_id}`);
        console.log(`   Disponible: S/. ${disc.disponible.toFixed(2)}`);
        console.log(`   Utilizado: S/. ${disc.usado.toFixed(2)}`);
        console.log(`   ⚠️  EXCESO: S/. ${disc.exceso} (SOBREGIRO DETECTADO)`);
      }
      console.log('\n════════════════════════════════════════════════════════════');
      console.log('\n💡 ACCIÓN REQUERIDA:');
      console.log('Existen formatos que utilizan MÁS del monto disponible.');
      console.log('Esto indica que hubo errores en los cambios de certificación.');
      console.log('\nPara resolver:');
      console.log('1. Revisar los formatos asociados a esos detalles');
      console.log('2. Considerar anular algunos formatos para liberar monto');
      console.log('3. O ajustar manualmente los montos de los formatos');
    } else {
      console.log('\n✅ NO HAY DISCREPANCIAS - Todos los montos están correctos');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
    await pool.end();
  }
}

// Ejecutar
repararMontosUtilizados()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
