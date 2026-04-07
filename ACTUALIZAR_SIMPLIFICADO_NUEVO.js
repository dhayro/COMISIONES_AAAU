// SOLUCIÓN SIMPLIFICADA PARA ACTUALIZAR
// Este archivo contiene la lógica SIMPLIFICADA para evitar la doble resta

exports.actualizar = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { id } = req.params;
    const {
      certificacion_id,
      fuente_financiamiento_id,
      detalles,
      // ... otros campos que se pueden actualizar
      ...otrosCampos
    } = req.body;

    console.log(`\n🔧 ACTUALIZANDO FORMATO ${id}...`);

    // 1️⃣ OBTENER FORMATO ANTERIOR
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

    console.log(`📊 Cert anterior: ${certificacion_anterior} → Nueva: ${certificacion_nueva}`);

    // 2️⃣ VALIDAR QUE NUEVA CERTIFICACIÓN PERTENECE A LA NUEVA META (SI APLICA)
    if (certificacion_nueva !== null) {
      const meta_nueva = otrosCampos.meta_id !== undefined ? otrosCampos.meta_id : meta_anterior;
      if (meta_nueva !== null) {
        const [certValida] = await pool.query(
          `SELECT id FROM certificaciones_credito WHERE id = ? AND meta_id = ?`,
          [certificacion_nueva, meta_nueva]
        );
        if (!certValida || certValida.length === 0) {
          return res.status(400).json({ error: 'La certificación no pertenece a la meta seleccionada' });
        }
      }
    }

    // 3️⃣ CONSTRUIR OBJETO DE ACTUALIZACIÓN DEL FORMATO
    const datosActualizacion = {
      ...otrosCampos,
      certificacion_id: certificacion_nueva || null,
      fuente_financiamiento_id: fuente_financiamiento_id !== undefined ? fuente_financiamiento_id : undefined
    };

    // Normalizar estado según certificación
    if (certificacion_nueva !== null) {
      datosActualizacion.estado_emision = 'EMITIDO';
    } else {
      datosActualizacion.estado_emision = 'BORRADOR';
    }

    console.log(`📝 Datos de actualización:`, datosActualizacion);

    // 4️⃣ ELIMINAR TODOS LOS DETALLES ANTIGUOS
    console.log(`🗑️ Eliminando detalles antiguos del formato ${id}...`);
    const [deleteResult] = await pool.query(
      `DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
      [id]
    );
    console.log(`✅ Detalles eliminados: ${deleteResult.affectedRows}`);

    // 5️⃣ INSERTAR NUEVOS DETALLES
    let detallesInsertados = 0;
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      console.log(`📝 Insertando ${detalles.length} detalles nuevos...`);
      
      for (const detalle of detalles) {
        let detallesCertId = detalle.detalles_certificacion_credito_id || null;

        // Si no viene explícito pero hay certificación nueva, buscar automáticamente
        if (!detallesCertId && certificacion_nueva && detalle.clasificador_id) {
          const [detallesCert] = await pool.query(
            `SELECT id FROM detalles_certificacion_credito 
             WHERE certificacion_credito_id = ? AND clasificador_id = ?
             LIMIT 1`,
            [certificacion_nueva, detalle.clasificador_id]
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
        detallesInsertados++;
      }
      console.log(`✅ ${detallesInsertados} detalles insertados`);
    }

    // 6️⃣ ACTUALIZAR EL FORMATO
    console.log(`🔄 Actualizando formato ${id}...`);
    const { FormatoEmision } = require('../models/FormatoEmision');
    await FormatoEmision.actualizar(id, datosActualizacion);
    console.log(`✅ Formato actualizado`);

    // 7️⃣ SINCRONIZAR MONTO_UTILIZADO (LO MÁS IMPORTANTE!)
    // Esto RECALCULA desde cero todos los monto_utilizado basándose en lo que realmente está en BD
    console.log(`\n🔄 Ejecutando sincronización final de montos...`);
    await sincronizarMontoUtilizado(id);
    console.log(`✅ Sincronización completada\n`);

    res.json({
      success: true,
      message: 'Formato actualizado exitosamente',
      detalles_insertados: detallesInsertados
    });

  } catch (error) {
    console.error('❌ Error al actualizar formato:', error.message);
    res.status(500).json({ error: error.message });
  }
};
