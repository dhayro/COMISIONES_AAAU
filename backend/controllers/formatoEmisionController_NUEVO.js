const FormatoEmision = require('../models/FormatoEmision');

// ========== FUNCIÓN CRÍTICA: SINCRONIZAR MONTO_UTILIZADO ==========

/**
 * 🔧 Recalcula el monto_utilizado en detalles_certificacion_credito
 * basándose REALMENTE en lo que está siendo usado en formato_emisiones_detalles
 * 
 * IMPORTANTE: Ejecutar cuando:
 * 1. Se CREA un formato con certificación
 * 2. Se ACTUALIZA un formato (cambio de certificación, montos, etc)
 * 3. Se ELIMINA un formato
 */
async function sincronizarMontoUtilizado(formatoId = null) {
  const { pool } = require('../config/database');
  
  try {
    console.log(`\n🔄 SINCRONIZANDO MONTO_UTILIZADO ${formatoId ? '(Formato: ' + formatoId + ')' : '(TODO)'}...`);
    
    // Obtener todos los detalles de certificación que podrían estar afectados
    let query = `
      SELECT DISTINCT dcc.id
      FROM detalles_certificacion_credito dcc
    `;
    
    let params = [];
    
    if (formatoId) {
      query = `
        SELECT DISTINCT dcc.id
        FROM detalles_certificacion_credito dcc
        WHERE dcc.id IN (
          SELECT DISTINCT fed.detalles_certificacion_credito_id
          FROM formato_emisiones_detalles fed
          WHERE fed.formato_emision_id = ? AND fed.detalles_certificacion_credito_id IS NOT NULL
        )
      `;
      params = [formatoId];
    }
    
    const [detallesACertificar] = await pool.query(query, params);
    
    console.log(`📋 Detalles encontrados para sincronizar: ${detallesACertificar.length}`);
    
    // Para cada detalle, recalcular su monto_utilizado
    for (const { id: detalleId } of detallesACertificar) {
      const [resultado] = await pool.query(
        `SELECT COALESCE(SUM(fed.monto), 0) as total_monto
         FROM formato_emisiones_detalles fed
         WHERE fed.detalles_certificacion_credito_id = ?`,
        [detalleId]
      );
      
      const nuevoMontoUtilizado = parseFloat(resultado[0].total_monto) || 0;
      
      await pool.query(
        `UPDATE detalles_certificacion_credito 
         SET monto_utilizado = ?
         WHERE id = ?`,
        [nuevoMontoUtilizado, detalleId]
      );
      
      console.log(`✅ Detalle ${detalleId}: monto_utilizado = S/. ${nuevoMontoUtilizado}`);
    }
    
    console.log(`✅ SINCRONIZACIÓN COMPLETADA\n`);
    
  } catch (error) {
    console.error(`❌ Error en sincronización:`, error.message);
    // No lanzar error, solo reportar
  }
}

// ========== FORMATOS DE EMISIÓN ==========

// 🆕 ENDPOINT PARA NORMALIZAR ESTADOS (Cualquier formato con certificacion_id debe estar en EMITIDO)
exports.normalizarEstados = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    console.log('🔧 NORMALIZANDO ESTADOS DE FORMATOS...');
    
    // 1️⃣ Formatos con certificacion_id que están en BORRADOR → EMITIDO
    const [result1] = await pool.query(
      `UPDATE formato_emisiones 
       SET estado_emision = 'EMITIDO'
       WHERE certificacion_id IS NOT NULL AND estado_emision = 'BORRADOR'`
    );
    console.log(`✅ Formatos cambiados de BORRADOR → EMITIDO: ${result1.changedRows}`);
    
    // 2️⃣ Formatos SIN certificacion_id pero en EMITIDO → BORRADOR
    const [result2] = await pool.query(
      `UPDATE formato_emisiones 
       SET estado_emision = 'BORRADOR'
       WHERE certificacion_id IS NULL AND estado_emision = 'EMITIDO'`
    );
    console.log(`✅ Formatos cambiados de EMITIDO → BORRADOR: ${result2.changedRows}`);
    
    res.json({
      message: 'Estados normalizados correctamente',
      cambios: {
        borrador_a_emitido: result1.changedRows,
        emitido_a_borrador: result2.changedRows
      }
    });
  } catch (error) {
    console.error('❌ Error al normalizar estados:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const {
      comision_id,
      usuario_id,
      costo_viaje_id,
      meta_id,
      certificacion_id,  // 🆕 CERTIFICACIÓN
      fuente_financiamiento_id,  // 🆕 FUENTE DE FINANCIAMIENTO
      numero_documento,
      fecha_emision,
      lugar,
      ruta,
      modalidad_viaje,
      fecha_salida,
      fecha_retorno,
      num_dias,
      numero_siaf,
      codigo_cp,
      tipo_emision,
      costo_xdia,
      monto_total,
      actividad_realizar,  // 🆕 ACTIVIDAD A REALIZAR
      observacion,
      detalles  // 🆕 Recibir detalles
    } = req.body;

    const usuarioId = req.user.id;

    // Validaciones básicas
    if (!comision_id || !usuario_id || !numero_documento || !fecha_emision) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios: comision_id, usuario_id, numero_documento, fecha_emision' 
      });
    }

    // 🔧 VALIDACIÓN: Verificar si ya existe un formato para esta comisión + usuario
    const { pool } = require('../config/database');
    const [formatosExistentes] = await pool.query(
      `SELECT id FROM formato_emisiones 
       WHERE comision_id = ? AND usuario_id = ? AND estado_emision != 'ANULADO'
       LIMIT 1`,
      [comision_id, usuario_id]
    );

    if (formatosExistentes.length > 0) {
      return res.status(400).json({ 
        error: `Ya existe un formato para esta comisión. Usuario: ${usuarioId}, Comisión: ${comision_id}`
      });
    }

    const formatoId = await FormatoEmision.crear({
      comision_id,
      usuario_id,
      costo_viaje_id: costo_viaje_id || null,
      meta_id: meta_id || null,  // 🆕 Pasar meta_id
      certificacion_id: certificacion_id || null,  // 🆕 Pasar certificacion_id
      fuente_financiamiento_id: fuente_financiamiento_id || null,  // 🆕 Pasar fuente_financiamiento_id
      numero_documento,
      fecha_emision,
      lugar,
      ruta,
      modalidad_viaje,
      fecha_salida,
      fecha_retorno,
      num_dias,
      numero_siaf,
      codigo_cp,
      tipo_emision,
      costo_xdia,
      monto_total,
      actividad_realizar,  // 🆕 ACTIVIDAD A REALIZAR
      observacion,
      creado_por: usuarioId
    });

    // 🆕 Guardar detalles si existen
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      for (const detalle of detalles) {
        await pool.query(
          `INSERT INTO formato_emisiones_detalles (
            formato_emision_id, 
            clasificador_id, 
            monto,
            detalles_certificacion_credito_id
          ) VALUES (?, ?, ?, ?)`,
          [
            formatoId,
            detalle.clasificador_id,
            detalle.monto || 0,
            detalle.detalles_certificacion_credito_id || null
          ]
        );
        
        // 🆕 Actualizar monto_utilizado en detalles_certificacion_credito
        if (detalle.detalles_certificacion_credito_id) {
          await pool.query(
            `UPDATE detalles_certificacion_credito 
             SET monto_utilizado = monto_utilizado + ?
             WHERE id = ?`,
            [detalle.monto || 0, detalle.detalles_certificacion_credito_id]
          );
          console.log(`✅ Monto utilizado actualizado para detalle ${detalle.detalles_certificacion_credito_id}: +S/. ${detalle.monto}`);
        }
      }
      console.log(`✅ Guardados ${detalles.length} detalles para formato ${formatoId}`);
    }

    // 🆕 SINCRONIZAR MONTO_UTILIZADO
    await sincronizarMontoUtilizado(formatoId);

    res.status(201).json({ 
      id: formatoId, 
      numero_documento: numero_documento,
      message: 'Formato de emisión creado exitosamente',
      detalles_guardados: detalles ? detalles.length : 0
    });
  } catch (error) {
    console.error('❌ Error al crear formato:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const formato = await FormatoEmision.obtenerPorId(id);

    if (!formato) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }

    res.json(formato);
  } catch (error) {
    console.error('❌ Error al obtener formato:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const { estado_emision, comision_id, tipo_emision } = req.query;
    const usuarioId = req.user.id;
    const rol = req.user.rol;
    const userAmbitoId = req.user.ambito_id;  // 🆕 Obtener ambito_id del usuario

    const filtros = {};
    if (estado_emision) filtros.estado_emision = estado_emision;
    if (comision_id) filtros.comision_id = comision_id;
    if (tipo_emision) filtros.tipo_emision = tipo_emision;

    // 🆕 Pasar userAmbitoId para filtrar administrativos por ámbito
    const formatos = await FormatoEmision.listar(filtros, usuarioId, rol, userAmbitoId);

    res.json({
      success: true,
      total: formatos.length,
      formatos
    });
  } catch (error) {
    console.error('❌ Error al listar formatos:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { id } = req.params;
    const {
      comision_id,
      usuario_id,
      costo_viaje_id,
      meta_id,
      certificacion_id,
      fuente_financiamiento_id,
      lugar,
      ruta,
      modalidad_viaje,
      fecha_salida,
      fecha_retorno,
      num_dias,
      numero_siaf,
      codigo_cp,
      tipo_emision,
      costo_xdia,
      monto_total,
      actividad_realizar,
      observacion,
      numero_documento,
      fecha_emision,
      estado_emision,
      detalles
    } = req.body;

    console.log(`🔄 ACTUALIZAR FORMATO ID: ${id}`);
    console.log(`📝 certificacion_id: ${certificacion_id}, fuente_financiamiento_id: ${fuente_financiamiento_id}`);
    console.log(`📊 detalles recibidos: ${detalles ? detalles.length : 0}`);

    // 1️⃣ VALIDACIÓN: Obtener formato anterior
    const [formatoAnterior] = await pool.query(
      `SELECT certificacion_id, meta_id FROM formato_emisiones WHERE id = ?`,
      [id]
    );

    if (!formatoAnterior || formatoAnterior.length === 0) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }

    const certificacion_anterior = formatoAnterior[0].certificacion_id;
    const meta_anterior = formatoAnterior[0].meta_id;
    const certificacion_nueva = certificacion_id !== undefined ? certificacion_id : certificacion_anterior;
    const meta_nueva = meta_id !== undefined ? meta_id : meta_anterior;

    console.log(`🔍 Cambio de certificación: ${certificacion_anterior} → ${certificacion_nueva}`);
    console.log(`🔍 Cambio de meta: ${meta_anterior} → ${meta_nueva}`);

    // 2️⃣ VALIDACIÓN: Si cambió de certificación, validar que pertenezca a la meta
    if (certificacion_anterior !== certificacion_nueva && certificacion_nueva !== null) {
      const [certEnMeta] = await pool.query(
        `SELECT id FROM certificaciones_credito WHERE id = ? AND meta_id = ?`,
        [certificacion_nueva, meta_nueva]
      );

      if (!certEnMeta || certEnMeta.length === 0) {
        throw new Error(`Certificación ${certificacion_nueva} NO pertenece a la meta ${meta_nueva}`);
      }
      console.log(`✅ Validación OK: Certificación ${certificacion_nueva} pertenece a meta ${meta_nueva}`);
    }

    // 3️⃣ CONSTRUIR OBJETO DE ACTUALIZACIÓN
    const datosActualizacion = {};
    if (comision_id !== undefined) datosActualizacion.comision_id = comision_id;
    if (usuario_id !== undefined) datosActualizacion.usuario_id = usuario_id;
    if (costo_viaje_id !== undefined) datosActualizacion.costo_viaje_id = costo_viaje_id;
    if (meta_id !== undefined) datosActualizacion.meta_id = meta_id;
    if (certificacion_id !== undefined) datosActualizacion.certificacion_id = certificacion_id;
    if (fuente_financiamiento_id !== undefined) datosActualizacion.fuente_financiamiento_id = fuente_financiamiento_id;
    if (lugar !== undefined) datosActualizacion.lugar = lugar;
    if (ruta !== undefined) datosActualizacion.ruta = ruta;
    if (modalidad_viaje !== undefined) datosActualizacion.modalidad_viaje = modalidad_viaje;
    if (fecha_salida !== undefined) datosActualizacion.fecha_salida = fecha_salida;
    if (fecha_retorno !== undefined) datosActualizacion.fecha_retorno = fecha_retorno;
    if (num_dias !== undefined) datosActualizacion.num_dias = num_dias;
    if (numero_siaf !== undefined) datosActualizacion.numero_siaf = numero_siaf;
    if (codigo_cp !== undefined) datosActualizacion.codigo_cp = codigo_cp;
    if (tipo_emision !== undefined) datosActualizacion.tipo_emision = tipo_emision;
    if (costo_xdia !== undefined) datosActualizacion.costo_xdia = costo_xdia;
    if (monto_total !== undefined) datosActualizacion.monto_total = monto_total;
    if (actividad_realizar !== undefined) datosActualizacion.actividad_realizar = actividad_realizar;
    if (observacion !== undefined) datosActualizacion.observacion = observacion;
    if (numero_documento !== undefined) datosActualizacion.numero_documento = numero_documento;
    if (fecha_emision !== undefined) datosActualizacion.fecha_emision = fecha_emision;

    // 🆕 NORMALIZAR ESTADO: Si hay certificación → EMITIDO, si no → BORRADOR
    datosActualizacion.estado_emision = (certificacion_nueva !== null) ? 'EMITIDO' : 'BORRADOR';
    console.log(`📌 Estado normalizado a: ${datosActualizacion.estado_emision}`);

    // 4️⃣ ACTUALIZAR EL FORMATO PRINCIPAL
    const actualizado = await FormatoEmision.actualizar(id, datosActualizacion);
    if (!actualizado) {
      return res.status(404).json({ error: 'Formato no encontrado o sin cambios' });
    }
    console.log(`✅ Formato ${id} actualizado`);

    // 5️⃣ PROCESAR DETALLES
    let detallesActualizados = 0;

    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      console.log(`📋 Procesando ${detalles.length} detalles...`);

      // Eliminar todos los detalles antiguos
      const [deleteResult] = await pool.query(
        `DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
        [id]
      );
      console.log(`🗑️ Eliminados ${deleteResult.affectedRows} detalles antiguos`);

      // Insertar detalles nuevos
      for (const detalle of detalles) {
        let detallesCertId = detalle.detalles_certificacion_credito_id || null;

        // Si no hay detalles_certificacion_credito_id pero sí certificación y clasificador, buscar automáticamente
        if (detallesCertId === null && certificacion_nueva !== null && detalle.clasificador_id) {
          const [detallesCert] = await pool.query(
            `SELECT id FROM detalles_certificacion_credito 
             WHERE certificacion_credito_id = ? AND clasificador_id = ?
             LIMIT 1`,
            [certificacion_nueva, detalle.clasificador_id]
          );

          if (detallesCert && detallesCert.length > 0) {
            detallesCertId = detallesCert[0].id;
            console.log(`  ✅ Auto-mapeo: clasificador ${detalle.clasificador_id} → detalles_cert_id ${detallesCertId}`);
          }
        }

        // Si certificación es NULL, limpiar detalles_certificacion_credito_id
        if (certificacion_nueva === null) {
          detallesCertId = null;
        }

        await pool.query(
          `INSERT INTO formato_emisiones_detalles (
            formato_emision_id, 
            clasificador_id, 
            monto,
            detalles_certificacion_credito_id
          ) VALUES (?, ?, ?, ?)`,
          [id, detalle.clasificador_id, detalle.monto || 0, detallesCertId]
        );

        detallesActualizados++;
      }
      console.log(`✅ ${detallesActualizados} detalles insertados`);
    } else {
      // Si NO hay detalles nuevos, limpiar todos los detalles
      const [deleteResult] = await pool.query(
        `DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
        [id]
      );
      console.log(`🗑️ Sin detalles nuevos - eliminados ${deleteResult.affectedRows} detalles antiguos`);
    }

    // 6️⃣ SINCRONIZAR MONTO_UTILIZADO (PUNTO CRÍTICO - RECALCULA TODO)
    console.log(`⏳ SINCRONIZANDO monto_utilizado...`);
    await sincronizarMontoUtilizado(id);
    console.log(`✅ SINCRONIZACIÓN COMPLETADA`);

    res.json({
      message: 'Formato actualizado exitosamente',
      detalles_actualizados: detallesActualizados
    });
  } catch (error) {
    console.error('❌ Error al actualizar formato:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await FormatoEmision.eliminar(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }

    res.json({ message: 'Formato eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error al eliminar formato:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ========== DETALLES DEL FORMATO ==========

exports.agregarDetalle = async (req, res) => {
  try {
    const { formato_id } = req.params;
    const {
      clasificador_id,
      dias,
      monto,
      descripcion,
      observacion,
      detalles_certificacion_credito_id
    } = req.body;

    if (!clasificador_id || !dias || !monto) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios: clasificador_id, dias, monto' 
      });
    }

    const detalleId = await FormatoEmision.agregarDetalle(formato_id, {
      clasificador_id,
      dias,
      monto,
      descripcion,
      observacion,
      detalles_certificacion_credito_id
    });

    res.status(201).json({ 
      id: detalleId, 
      message: 'Detalle agregado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error al agregar detalle:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ========== UTILIDADES ==========

// 🔧 REPARACIÓN: Recalcular todos los monto_utilizado basado en detalles reales
exports.repararMontosUtilizados = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    console.log('\n🔧 INICIANDO REPARACIÓN DE MONTOS UTILIZADOS...\n');
    
    // 1️⃣ Primero, resetear todos los monto_utilizado a 0
    console.log('📊 Paso 1: Reseteando todos los monto_utilizado a 0');
    await pool.query(`UPDATE detalles_certificacion_credito SET monto_utilizado = 0`);
    console.log('✅ Todos los monto_utilizado reseteados a 0');
    
    // 2️⃣ Recalcular basado en detalles reales
    console.log('\n📊 Paso 2: Recalculando monto_utilizado desde formato_emisiones_detalles');
    const [detallesConMonto] = await pool.query(`
      SELECT 
        dcc.id as detalles_cert_id,
        SUM(fed.monto) as monto_total
      FROM formato_emisiones_detalles fed
      JOIN detalles_certificacion_credito dcc ON fed.detalles_certificacion_credito_id = dcc.id
      WHERE fed.detalles_certificacion_credito_id IS NOT NULL
      GROUP BY dcc.id
    `);
    
    console.log(`📋 Encontrados ${detallesConMonto.length} detalles de certificación con montos`);
    
    let totalActualizado = 0;
    for (const item of detallesConMonto) {
      await pool.query(
        `UPDATE detalles_certificacion_credito 
         SET monto_utilizado = ?
         WHERE id = ?`,
        [item.monto_total || 0, item.detalles_cert_id]
      );
      console.log(`✅ Detalle ${item.detalles_cert_id}: monto_utilizado = S/. ${item.monto_total}`);
      totalActualizado++;
    }
    
    console.log(`\n✅ REPARACIÓN COMPLETADA`);
    console.log(`📊 Total detalles actualizados: ${totalActualizado}`);
    
    res.json({
      success: true,
      message: 'Montos utilizados reparados exitosamente',
      detalles_actualizados: totalActualizado
    });
  } catch (error) {
    console.error('❌ Error en reparación:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🔍 DIAGNÓSTICO: Ver estado actual de montos
exports.diagnosticoMontos = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    console.log('\n🔍 DIAGNÓSTICO DE MONTOS\n');
    
    // Obtener resumen de detalles_certificacion_credito
    const [resumenCerts] = await pool.query(`
      SELECT 
        dcc.id,
        dcc.certificacion_credito_id,
        dcc.clasificador_id,
        dcc.monto,
        dcc.monto_utilizado,
        (dcc.monto - dcc.monto_utilizado) as saldo_disponible,
        COUNT(fed.id) as num_formatos_asociados,
        SUM(fed.monto) as total_montos_en_formatos
      FROM detalles_certificacion_credito dcc
      LEFT JOIN formato_emisiones_detalles fed ON dcc.id = fed.detalles_certificacion_credito_id
      GROUP BY dcc.id
      ORDER BY dcc.certificacion_credito_id, dcc.id
    `);
    
    console.log('📊 ESTADO ACTUAL DE DETALLES CERTIFICACIÓN:');
    console.log('─'.repeat(100));
    
    let discrepancias = [];
    for (const item of resumenCerts) {
      const esperado = item.total_montos_en_formatos || 0;
      const actual = item.monto_utilizado;
      const discrepancia = Math.abs(esperado - actual);
      
      if (discrepancia > 0.01) {
        discrepancias.push({
          id: item.id,
          certificacion_id: item.certificacion_credito_id,
          clasificador_id: item.clasificador_id,
          monto_total: item.monto,
          monto_utilizado_actual: actual,
          monto_esperado: esperado,
          diferencia: (esperado - actual).toFixed(2),
          num_formatos: item.num_formatos_asociados
        });
        console.log(`⚠️  ID: ${item.id} | Cert: ${item.certificacion_credito_id} | Clase: ${item.clasificador_id}`);
        console.log(`   Esperado: S/. ${esperado.toFixed(2)} | Actual: S/. ${actual.toFixed(2)} | Diferencia: S/. ${(esperado - actual).toFixed(2)}`);
      } else {
        console.log(`✅ ID: ${item.id} | Cert: ${item.certificacion_credito_id} | Clase: ${item.clasificador_id}`);
        console.log(`   Monto: S/. ${item.monto.toFixed(2)} | Utilizado: S/. ${actual.toFixed(2)} | Saldo: S/. ${item.saldo_disponible.toFixed(2)}`);
      }
    }
    
    res.json({
      total_detalles: resumenCerts.length,
      discrepancias_encontradas: discrepancias.length,
      discrepancias: discrepancias,
      todos_los_detalles: resumenCerts
    });
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerProximoNumero = async (req, res) => {
  try {
    const numeroDocumento = await FormatoEmision.obtenerProximoNumeroDocumento();
    res.json({ numero_documento: numeroDocumento });
  } catch (error) {
    console.error('❌ Error al obtener número:', error.message);
    res.status(500).json({ error: error.message });
  }
};
