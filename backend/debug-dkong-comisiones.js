#!/usr/bin/env node

/**
 * Script de diagnóstico: Verificar datos de usuario dkong
 * Ejecutar: node backend/debug-dkong-comisiones.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnosticar() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    console.log('\n' + '='.repeat(100));
    console.log('🔍 DIAGNÓSTICO: Usuario dkong - Comisiones para Emisión de Formatos');
    console.log('='.repeat(100) + '\n');

    // 1. Obtener datos del usuario dkong
    console.log('📋 PASO 1: Datos del usuario dkong');
    console.log('-'.repeat(100));
    const [usuarios] = await connection.query(
      'SELECT id, username, nombre, rol, ambito_id FROM users WHERE username = ?',
      ['dkong']
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuario dkong no encontrado\n');
      return;
    }

    const dkong = usuarios[0];
    console.log(`✓ Usuario encontrado:`);
    console.log(`  ID: ${dkong.id}`);
    console.log(`  Username: ${dkong.username}`);
    console.log(`  Nombre: ${dkong.nombre}`);
    console.log(`  Rol: ${dkong.rol}`);
    console.log(`  Ámbito ID: ${dkong.ambito_id}\n`);

    // 2. Verificar comisiones donde dkong es comisionado
    console.log('📋 PASO 2: Comisiones donde dkong es comisionado');
    console.log('-'.repeat(100));
    const [comisionesComisionado] = await connection.query(
      `SELECT DISTINCT c.id, c.lugar, c.fecha_salida, c.presupuesto_estado, c.aprobacion_estado,
              cc.usuario_id as comisionado_id, u_creator.nombre as creador
       FROM comisiones c
       INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
       INNER JOIN users u_creator ON c.usuario_id = u_creator.id
       WHERE cc.usuario_id = ?
       ORDER BY c.fecha_salida DESC`,
      [dkong.id]
    );

    console.log(`Comisiones donde es comisionado: ${comisionesComisionado.length}`);
    if (comisionesComisionado.length === 0) {
      console.log('⚠️  No hay comisiones donde dkong sea comisionado\n');
    } else {
      comisionesComisionado.forEach((c, idx) => {
        console.log(`  ${idx + 1}. Comisión #${c.id}`);
        console.log(`     Lugar: ${c.lugar}`);
        console.log(`     Creador: ${c.creador}`);
        console.log(`     Presupuesto: ${c.presupuesto_estado}`);
        console.log(`     Aprobación: ${c.aprobacion_estado}`);
      });
      console.log();
    }

    // 3. Aplicar filtros de emisión de formatos
    console.log('📋 PASO 3: Comisiones CON FILTROS de Emisión de Formatos');
    console.log('-'.repeat(100));
    const [comisionesFiltradasSQL] = await connection.query(
      `SELECT DISTINCT c.id, c.lugar, c.fecha_salida, c.presupuesto_estado, c.aprobacion_estado,
              u_creator.nombre as creador
       FROM comisiones c
       LEFT JOIN ambitos a ON c.ambito_id = a.id
       LEFT JOIN metas m ON c.meta_id = m.id
       LEFT JOIN users u_creator ON c.usuario_id = u_creator.id
       INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
       INNER JOIN users comisionados ON cc.usuario_id = comisionados.id
       WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
       AND c.aprobacion_estado = "APROBADA"
       AND comisionados.id = ?
       ORDER BY c.fecha_salida DESC`,
      [dkong.id]
    );

    console.log(`Comisiones con filtros aplicados: ${comisionesFiltradasSQL.length}`);
    if (comisionesFiltradasSQL.length === 0) {
      console.log('⚠️  No hay comisiones que cumplan con los filtros\n');
      
      // Investigar por qué
      console.log('📋 PASO 3B: Investigación - Verificar estados');
      console.log('-'.repeat(100));
      
      const [allComisiones] = await connection.query(
        `SELECT DISTINCT c.id, c.lugar, c.presupuesto_estado, c.aprobacion_estado
         FROM comisiones c
         INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
         WHERE cc.usuario_id = ?
         ORDER BY c.fecha_salida DESC`,
        [dkong.id]
      );
      
      console.log(`Total de comisiones (sin filtros): ${allComisiones.length}`);
      
      allComisiones.forEach((c, idx) => {
        const cumplePresupuesto = c.presupuesto_estado === 'PRESUPUESTO ASIGNADO';
        const cumpleAprobacion = c.aprobacion_estado === 'APROBADA';
        const cumpleAmbos = cumplePresupuesto && cumpleAprobacion;
        
        console.log(`  ${idx + 1}. Comisión #${c.id} - ${c.lugar}`);
        console.log(`     Presupuesto: ${c.presupuesto_estado} ${cumplePresupuesto ? '✓' : '❌'}`);
        console.log(`     Aprobación: ${c.aprobacion_estado} ${cumpleAprobacion ? '✓' : '❌'}`);
        console.log(`     ¿Pasa filtros?: ${cumpleAmbos ? '✅ SÍ' : '❌ NO'}`);
      });
      console.log();
    } else {
      comisionesFiltradasSQL.forEach((c, idx) => {
        console.log(`  ${idx + 1}. Comisión #${c.id}`);
        console.log(`     Lugar: ${c.lugar}`);
        console.log(`     Creador: ${c.creador}`);
        console.log(`     Presupuesto: ${c.presupuesto_estado}`);
        console.log(`     Aprobación: ${c.aprobacion_estado}`);
      });
      console.log();
    }

    // 4. Contar cuántos registros en comision_comisionados tiene dkong
    console.log('📋 PASO 4: Detalles en comision_comisionados');
    console.log('-'.repeat(100));
    const [detalles] = await connection.query(
      `SELECT cc.id, cc.comision_id, c.lugar, cc.dias, cc.monto
       FROM comision_comisionados cc
       JOIN comisiones c ON cc.comision_id = c.id
       WHERE cc.usuario_id = ?
       ORDER BY c.fecha_salida DESC`,
      [dkong.id]
    );

    console.log(`Registros en comision_comisionados: ${detalles.length}`);
    detalles.forEach((d, idx) => {
      console.log(`  ${idx + 1}. CC #${d.id} - Comisión #${d.comision_id} (${d.lugar}) - ${d.dias} días - S/. ${d.monto}`);
    });
    console.log();

    // 5. Resumen y recomendaciones
    console.log('📋 RESUMEN Y RECOMENDACIONES');
    console.log('-'.repeat(100));
    
    if (comisionesComisionado.length === 0) {
      console.log('❌ PROBLEMA: dkong NO está asignado como comisionado en ninguna comisión');
      console.log('   Acción necesaria: Agregar dkong como comisionado en alguna comisión');
      console.log('   1. Ir a: Gestión → Comisiones');
      console.log('   2. Seleccionar una comisión');
      console.log('   3. Agregar dkong en "Asignar Comisionados"');
    } else if (comisionesFiltradasSQL.length === 0) {
      console.log('⚠️  PROBLEMA: dkong está en comision_comisionados, pero sus comisiones no cumplen filtros');
      console.log('   Verifica que sus comisiones tengan:');
      console.log('   ✓ presupuesto_estado = "PRESUPUESTO ASIGNADO"');
      console.log('   ✓ aprobacion_estado = "APROBADA"');
    } else {
      console.log('✅ OK: dkong tiene comisiones que cumplen filtros');
      console.log(`   Se muestran ${comisionesFiltradasSQL.length} comisiones en Emisión de Formatos`);
    }
    console.log();

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnosticar();
