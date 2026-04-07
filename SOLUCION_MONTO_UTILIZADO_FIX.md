// 🔧 Backend Controller Fix - SINCRONIZACIÓN DE MONTO_UTILIZADO
// Archivo: backend/controllers/formatoEmisionController.js

/**
 * 🆕 FUNCIÓN: sincronizarMontoUtilizado
 * 
 * Recalcula el monto_utilizado en detalles_certificacion_credito
 * basándose REALMENTE en lo que está siendo usado en formato_emisiones_detalles
 * 
 * IMPORTANTE: Esta función DEBE ejecutarse cuando:
 * 1. Se CREA un formato con certificación
 * 2. Se ACTUALIZA un formato (cambia certificación, cambio de montos, etc)
 * 3. Se ELIMINA un formato
 * 4. Se ANULA un formato
 */
async function sincronizarMontoUtilizado(formatoId = null) {
  const { pool } = require('../config/database');
  
  try {
    console.log(`\n🔄 INICIANDO SINCRONIZACIÓN DE MONTO_UTILIZADO...`);
    
    // PASO 1: Obtener todos los detalles_certificacion_credito que podrían estar afectados
    let query = `
      SELECT DISTINCT dcc.id
      FROM detalles_certificacion_credito dcc
    `;
    
    let params = [];
    
    if (formatoId) {
      // Si sincronizamos un formato específico, solo los detalles de ese formato
      query = `
        SELECT DISTINCT dcc.id
        FROM detalles_certificacion_credito dcc
        WHERE dcc.id IN (
          SELECT DISTINCT fed.detalles_certificacion_credito_id
          FROM formato_emisiones_detalles fed
          WHERE fed.formato_emision_id = ? AND fed.detalles_certificacion_credito_id IS NOT NULL
        )
        OR dcc.id IN (
          SELECT DISTINCT fed.detalles_certificacion_credito_id
          FROM formato_emisiones_detalles fed
          INNER JOIN formato_emisiones fe ON fed.formato_emision_id = fe.id
          WHERE fe.id = ? AND fed.detalles_certificacion_credito_id IS NOT NULL
        )
      `;
      params = [formatoId, formatoId];
    }
    
    const [detallesACertificar] = await pool.query(query, params);
    
    console.log(`📋 Encontrados ${detallesACertificar.length} detalles de certificación para sincronizar`);
    
    // PASO 2: Para cada detalle, recalcular su monto_utilizado
    for (const { id: detalleId } of detallesACertificar) {
      // Sumar TODOS los montos en formato_emisiones_detalles que usan este detalles_certificacion_credito_id
      const [resultado] = await pool.query(
        `SELECT COALESCE(SUM(fed.monto), 0) as total_monto
         FROM formato_emisiones_detalles fed
         WHERE fed.detalles_certificacion_credito_id = ?`,
        [detalleId]
      );
      
      const nuevoMontoUtilizado = parseFloat(resultado[0].total_monto) || 0;
      
      // PASO 3: Actualizar el monto_utilizado con el valor REAL
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
    throw error;
  }
}

// ============================================
// 🆕 ACTUALIZAR FUNCIÓN: crear()
// ============================================

async crear(req, res) {
  const { 
    comision_id, 
    usuario_id, 
    costo_viaje_id, 
    meta_id, 
    certificacion_id,
    fuente_financiamiento_id,
    numero_documento, 
    fecha_emision, 
    lugar, 
    ruta, 
    modalidad_viaje, 
    fecha_salida, 
    fecha_retorno, 
    num_dias, 
    tipo_emision, 
    costo_xdia, 
    monto_total, 
    observacion, 
    actividad_realizar, 
    detalles 
  } = req.body;

  try {
    const { pool } = require('../config/database');

    // ... código existente de validación ...

    // Insertar formato
    const [resultado] = await pool.query(
      `INSERT INTO formato_emisiones (
        comision_id, usuario_id, costo_viaje_id, meta_id,
        numero_documento, fecha_emision, lugar, ruta, modalidad_viaje,
        fecha_salida, fecha_retorno, num_dias, tipo_emision,
        costo_xdia, monto_total, estado_emision, creado_por,
        certificacion_id, fuente_financiamiento_id, observacion, actividad_realizar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        comision_id, usuario_id, costo_viaje_id, meta_id,
        numeroDocumento, fechaEmision, lugar, ruta, modalidad_viaje,
        fechaSalida, fechaRetorno, num_dias, tipo_emision,
        costo_xdia, monto_total, 'BORRADOR', usuario_id,
        certificacion_id || null, fuente_financiamiento_id || null, observacion, actividad_realizar
      ]
    );

    const formatoId = resultado.insertId;

    // Insertar detalles
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      for (const detalle of detalles) {
        let detallesCertId = detalle.detalles_certificacion_credito_id || null;

        // Si no viene explícito pero hay certificación, buscar automáticamente
        if (!detallesCertId && certificacion_id && detalle.clasificador_id) {
          const [detallesCert] = await pool.query(
            `SELECT id FROM detalles_certificacion_credito 
             WHERE certificacion_credito_id = ? AND clasificador_id = ?
             LIMIT 1`,
            [certificacion_id, detalle.clasificador_id]
          );
          if (detallesCert && detallesCert.length > 0) {
            detallesCertId = detallesCert[0].id;
          }
        }

        await pool.query(
          `INSERT INTO formato_emisiones_detalles (
            formato_emision_id, clasificador_id, monto, detalles_certificacion_credito_id
          ) VALUES (?, ?, ?, ?)`,
          [formatoId, detalle.clasificador_id, detalle.monto || 0, detallesCertId]
        );
      }

      // 🆕 SINCRONIZAR MONTO_UTILIZADO
      await sincronizarMontoUtilizado(formatoId);
    }

    res.json({ success: true, id: formatoId });

  } catch (error) {
    console.error('❌ Error al crear formato:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// 🆕 ACTUALIZAR FUNCIÓN: actualizar()
// ============================================

async actualizar(req, res) {
  const { id } = req.params;
  const { 
    certificacion_id, 
    fuente_financiamiento_id,
    detalles,
    // ... otros campos
  } = req.body;

  try {
    const { pool } = require('../config/database');

    // Obtener formato anterior
    const [formatoAnterior] = await pool.query(
      `SELECT certificacion_id FROM formato_emisiones WHERE id = ?`,
      [id]
    );

    if (!formatoAnterior || formatoAnterior.length === 0) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }

    // Actualizar formato
    await pool.query(
      `UPDATE formato_emisiones 
       SET certificacion_id = ?, fuente_financiamiento_id = ?
       WHERE id = ?`,
      [certificacion_id || null, fuente_financiamiento_id || null, id]
    );

    // 🆕 ELIMINAR detalles previos
    await pool.query(
      `DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
      [id]
    );

    // 🆕 INSERTAR nuevos detalles
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      for (const detalle of detalles) {
        let detallesCertId = detalle.detalles_certificacion_credito_id || null;

        // Si no viene explícito pero hay certificación, buscar automáticamente
        if (!detallesCertId && certificacion_id && detalle.clasificador_id) {
          const [detallesCert] = await pool.query(
            `SELECT id FROM detalles_certificacion_credito 
             WHERE certificacion_credito_id = ? AND clasificador_id = ?
             LIMIT 1`,
            [certificacion_id, detalle.clasificador_id]
          );
          if (detallesCert && detallesCert.length > 0) {
            detallesCertId = detallesCert[0].id;
          }
        }

        await pool.query(
          `INSERT INTO formato_emisiones_detalles (
            formato_emision_id, clasificador_id, monto, detalles_certificacion_credito_id
          ) VALUES (?, ?, ?, ?)`,
          [id, detalle.clasificador_id, detalle.monto || 0, detallesCertId]
        );
      }
    }

    // 🆕 SINCRONIZAR MONTO_UTILIZADO (CRÍTICO!)
    // Esto recalcula todos los detalles de certificación afectados
    await sincronizarMontoUtilizado(id);

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error al actualizar formato:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// 🆕 ACTUALIZAR FUNCIÓN: eliminar()
// ============================================

async eliminar(req, res) {
  const { id } = req.params;

  try {
    const { pool } = require('../config/database');

    // Antes de eliminar, sincronizar para limpiar
    await sincronizarMontoUtilizado(id);

    // Eliminar formato (se eliminan detalles por CASCADE)
    await pool.query(
      `DELETE FROM formato_emisiones WHERE id = ?`,
      [id]
    );

    // Sincronizar nuevamente para asegurar que todo esté limpio
    await sincronizarMontoUtilizado(null); // Sincronizar TODO

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error al eliminar formato:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { sincronizarMontoUtilizado };
