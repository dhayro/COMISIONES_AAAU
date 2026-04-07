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
      certificacion_id,  // 🆕 CERTIFICACIÓN
      fuente_financiamiento_id,  // 🆕 FUENTE DE FINANCIAMIENTO
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
      numero_documento,
      fecha_emision,
      estado_emision,
      detalles  // 🆕 Recibir detalles
    } = req.body;

    // 🆕 Construir objeto de actualización con solo los campos que se envían
    const datosActualizacion = {};
    
    // Solo incluir campos que se envían explícitamente (no undefined)
    if (comision_id !== undefined) datosActualizacion.comision_id = comision_id;
    if (usuario_id !== undefined) datosActualizacion.usuario_id = usuario_id;
    if (costo_viaje_id !== undefined) datosActualizacion.costo_viaje_id = costo_viaje_id;
    if (meta_id !== undefined) datosActualizacion.meta_id = meta_id;
    if (certificacion_id !== undefined) datosActualizacion.certificacion_id = certificacion_id;
    if (fuente_financiamiento_id !== undefined) datosActualizacion.fuente_financiamiento_id = fuente_financiamiento_id;  // 🆕
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
    if (estado_emision !== undefined) datosActualizacion.estado_emision = estado_emision;

    console.log('📝 Datos a actualizar:', datosActualizacion);

    // 🔍 Obtener formato anterior para detectar cambios en certificacion_id Y meta_id
    const [formatoAnterior] = await pool.query(
      `SELECT certificacion_id, meta_id FROM formato_emisiones WHERE id = ?`,
      [id]
    );

    const certificacion_anterior = formatoAnterior && formatoAnterior.length > 0 ? formatoAnterior[0].certificacion_id : null;
    const meta_anterior = formatoAnterior && formatoAnterior.length > 0 ? formatoAnterior[0].meta_id : null;
    const certificacion_nueva = certificacion_id !== undefined ? certificacion_id : certificacion_anterior;
    const meta_nueva = meta_id !== undefined ? meta_id : meta_anterior;

    console.log(`🔄 Cambio de certificación: ${certificacion_anterior} → ${certificacion_nueva}`);
    console.log(`🔄 Cambio de meta: ${meta_anterior} → ${meta_nueva}`);

    // 🆕 LÓGICA DE ESTADO: Normalizar SIEMPRE basado en certificacion_id
    // Si hay certificacion_id (sea nuevo o antiguo), el estado debe ser EMITIDO
    // Si NO hay certificacion_id, el estado debe ser BORRADOR
    if (certificacion_nueva !== null) {
      // Tiene certificación → EMITIDO
      console.log(`📌 Formato tiene certificación (${certificacion_nueva}) → Estado debe ser EMITIDO`);
      datosActualizacion.estado_emision = 'EMITIDO';
    } else {
      // NO tiene certificación → BORRADOR
      console.log(`📌 Formato SIN certificación → Estado debe ser BORRADOR`);
      datosActualizacion.estado_emision = 'BORRADOR';
    }

    console.log(`� datosActualizacion.estado_emision final:`, datosActualizacion.estado_emision);

    // 🆕 Si certificacion_id fue removido (de valor a NULL), limpiar montos y detalles
    if (certificacion_anterior !== null && certificacion_nueva === null) {
      console.log(`⚠️ Certificación removida (${certificacion_anterior} → NULL), limpiando montos utilizados y detalles...`);
      
      try {
        // Obtener los montos totales por detalle para restar correctamente
        const [detallesConMontos] = await pool.query(
          `SELECT detalles_certificacion_credito_id, SUM(monto) as monto_total
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ? AND detalles_certificacion_credito_id IS NOT NULL
           GROUP BY detalles_certificacion_credito_id`,
          [id]
        );

        // 1️⃣ Restar montos de detalles_certificacion_credito
        for (const detalle of detallesConMontos) {
          if (detalle.detalles_certificacion_credito_id) {
            await pool.query(
              `UPDATE detalles_certificacion_credito 
               SET monto_utilizado = monto_utilizado - ?
               WHERE id = ?`,
              [detalle.monto_total || 0, detalle.detalles_certificacion_credito_id]
            );
            console.log(`✅ Monto restado para detalle ${detalle.detalles_certificacion_credito_id}: -S/. ${detalle.monto_total}`);
          }
        }

        // 2️⃣ Limpiar detalles_certificacion_credito_id en formato_emisiones_detalles (NULL)
        const [deleteResult] = await pool.query(
          `UPDATE formato_emisiones_detalles 
           SET detalles_certificacion_credito_id = NULL
           WHERE formato_emision_id = ?`,
          [id]
        );
        console.log(`✅ Detalles desasociados (${deleteResult.affectedRows} registros) - detalles_certificacion_credito_id → NULL`);

      } catch (limpiezaError) {
        console.error(`❌ Error al limpiar montos y detalles:`, limpiezaError.message);
      }
    }

    // 🆕 Si AMBOS meta Y certificacion cambiaron (cambio completo de contexto)
    if (meta_anterior !== null && meta_nueva !== null && meta_anterior !== meta_nueva &&
        certificacion_anterior !== null && certificacion_nueva !== null && certificacion_anterior !== certificacion_nueva) {
      console.log(`🔄🔄 CAMBIO MÚLTIPLE: Meta (${meta_anterior} → ${meta_nueva}) Y Certificación (${certificacion_anterior} → ${certificacion_nueva})`);
      console.log(`⚠️  VALIDANDO: La nueva certificación debe existir en la nueva meta`);
      
      try {
        // Verificar que la nueva certificación pertenece a la nueva meta
        const [certEnNuevaMeta] = await pool.query(
          `SELECT id FROM certificaciones_credito WHERE id = ? AND meta_id = ?`,
          [certificacion_nueva, meta_nueva]
        );
        
        if (!certEnNuevaMeta || certEnNuevaMeta.length === 0) {
          console.error(`❌ ERROR: Certificación ${certificacion_nueva} NO pertenece a la meta ${meta_nueva}`);
          throw new Error(`La certificación seleccionada no pertenece a la meta seleccionada. Por favor verifica.`);
        }
        
        console.log(`✅ Validación OK: Certificación ${certificacion_nueva} SÍ pertenece a meta ${meta_nueva}`);
        
        // Ahora proceder con el cambio: restar de cert anterior, sumar a cert nueva
        const [detallesAntiguos] = await pool.query(
          `SELECT detalles_certificacion_credito_id, SUM(monto) as monto_total
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ? AND detalles_certificacion_credito_id IS NOT NULL
           GROUP BY detalles_certificacion_credito_id`,
          [id]
        );

        console.log(`📊 Detalles antiguos encontrados: ${detallesAntiguos.length}`);

        // 1️⃣ Restar montos de la certificación ANTERIOR
        for (const detalle of detallesAntiguos) {
          if (detalle.detalles_certificacion_credito_id) {
            await pool.query(
              `UPDATE detalles_certificacion_credito 
               SET monto_utilizado = monto_utilizado - ?
               WHERE id = ?`,
              [detalle.monto_total || 0, detalle.detalles_certificacion_credito_id]
            );
            console.log(`✅ Monto restado de certificación anterior (detalle ${detalle.detalles_certificacion_credito_id}): -S/. ${detalle.monto_total}`);
          }
        }

        // 2️⃣ Obtener detalles de la nueva certificación
        const [detallesNuevaCert] = await pool.query(
          `SELECT id, clasificador_id 
           FROM detalles_certificacion_credito 
           WHERE certificacion_credito_id = ?`,
          [certificacion_nueva]
        );

        console.log(`📋 Detalles encontrados en nueva certificación: ${detallesNuevaCert.length}`);

        // 3️⃣ Actualizar referencias en formato_emisiones_detalles a la nueva certificación
        const [formatoDetalles] = await pool.query(
          `SELECT id, clasificador_id, monto 
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ?`,
          [id]
        );

        let montosTotalesPorDetalle = {};
        
        for (const formatoDetalle of formatoDetalles) {
          const nuevoDetalle = detallesNuevaCert.find(d => d.clasificador_id === formatoDetalle.clasificador_id);
          
          if (nuevoDetalle) {
            await pool.query(
              `UPDATE formato_emisiones_detalles 
               SET detalles_certificacion_credito_id = ?
               WHERE id = ?`,
              [nuevoDetalle.id, formatoDetalle.id]
            );
            
            if (!montosTotalesPorDetalle[nuevoDetalle.id]) {
              montosTotalesPorDetalle[nuevoDetalle.id] = 0;
            }
            montosTotalesPorDetalle[nuevoDetalle.id] += formatoDetalle.monto || 0;
            
            console.log(`🔗 Referencia actualizada: clasificador ${formatoDetalle.clasificador_id} → detalle ${nuevoDetalle.id}`);
          } else {
            console.warn(`⚠️  NO encontrado clasificador ${formatoDetalle.clasificador_id} en nueva certificación`);
          }
        }

        // 4️⃣ Sumar montos a la certificación NUEVA
        for (const [detalleId, montoTotal] of Object.entries(montosTotalesPorDetalle)) {
          await pool.query(
            `UPDATE detalles_certificacion_credito 
             SET monto_utilizado = monto_utilizado + ?
             WHERE id = ?`,
            [montoTotal, detalleId]
          );
          console.log(`✅ Monto sumado a nueva certificación (detalle ${detalleId}): +S/. ${montoTotal}`);
        }

        console.log(`✅ Cambio múltiple completado exitosamente`);
      } catch (cambioError) {
        console.error(`❌ Error al cambiar meta y certificación:`, cambioError.message);
        throw cambioError; // Re-throw para que se vea en el cliente
      }
    }

    // 🆕 Si certificacion_id cambió (de un valor a otro diferente, ambos no nulos)
    else if (certificacion_anterior !== null && certificacion_nueva !== null && certificacion_anterior !== certificacion_nueva) {
      console.log(`🔄 Certificación cambiada (${certificacion_anterior} → ${certificacion_nueva}), actualizando montos utilizados...`);
      
      try {
        // Obtener los detalles antiguos para restar sus montos
        const [detallesAntiguos] = await pool.query(
          `SELECT detalles_certificacion_credito_id, SUM(monto) as monto_total
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ? AND detalles_certificacion_credito_id IS NOT NULL
           GROUP BY detalles_certificacion_credito_id`,
          [id]
        );

        console.log(`📊 Detalles antiguos encontrados: ${detallesAntiguos.length}`);

        // 1️⃣ Restar montos de la certificación ANTERIOR
        for (const detalle of detallesAntiguos) {
          if (detalle.detalles_certificacion_credito_id) {
            await pool.query(
              `UPDATE detalles_certificacion_credito 
               SET monto_utilizado = monto_utilizado - ?
               WHERE id = ?`,
              [detalle.monto_total || 0, detalle.detalles_certificacion_credito_id]
            );
            console.log(`✅ Monto restado de certificación anterior (detalle ${detalle.detalles_certificacion_credito_id}): -S/. ${detalle.monto_total}`);
          }
        }

        // 2️⃣ Obtener detalles de la nueva certificación
        const [detallesNuevaCert] = await pool.query(
          `SELECT id, clasificador_id 
           FROM detalles_certificacion_credito 
           WHERE certificacion_id = ?`,
          [certificacion_nueva]
        );

        console.log(`📋 Detalles encontrados en nueva certificación: ${detallesNuevaCert.length}`);

        // 3️⃣ Actualizar referencias en formato_emisiones_detalles a la nueva certificación
        const [formatoDetalles] = await pool.query(
          `SELECT id, clasificador_id, monto 
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ?`,
          [id]
        );

        let montosTotalesPorDetalle = {};
        
        for (const formatoDetalle of formatoDetalles) {
          // Buscar el detalle de la nueva certificación con el mismo clasificador
          const nuevoDetalle = detallesNuevaCert.find(d => d.clasificador_id === formatoDetalle.clasificador_id);
          
          if (nuevoDetalle) {
            // Actualizar la referencia en formato_emisiones_detalles
            await pool.query(
              `UPDATE formato_emisiones_detalles 
               SET detalles_certificacion_credito_id = ?
               WHERE id = ?`,
              [nuevoDetalle.id, formatoDetalle.id]
            );
            
            // Acumular montos por detalle para sumar después
            if (!montosTotalesPorDetalle[nuevoDetalle.id]) {
              montosTotalesPorDetalle[nuevoDetalle.id] = 0;
            }
            montosTotalesPorDetalle[nuevoDetalle.id] += formatoDetalle.monto || 0;
            
            console.log(`🔗 Referencia actualizada: clasificador ${formatoDetalle.clasificador_id} → detalle ${nuevoDetalle.id}`);
          }
        }

        // 4️⃣ Sumar montos a la certificación NUEVA
        for (const [detalleId, montoTotal] of Object.entries(montosTotalesPorDetalle)) {
          await pool.query(
            `UPDATE detalles_certificacion_credito 
             SET monto_utilizado = monto_utilizado + ?
             WHERE id = ?`,
            [montoTotal, detalleId]
          );
          console.log(`✅ Monto sumado a nueva certificación (detalle ${detalleId}): +S/. ${montoTotal}`);
        }

        console.log(`✅ Cambio de certificación completado exitosamente`);
      } catch (cambioError) {
        console.error(`❌ Error al cambiar certificación:`, cambioError.message);
      }
    }

    // 🆕 Actualizar el formato principal
    const actualizado = await FormatoEmision.actualizar(id, datosActualizacion);

    if (!actualizado) {
      return res.status(404).json({ error: 'Formato no encontrado o sin cambios' });
    }

    console.log(`✅ Formato ${id} actualizado correctamente`);

    // 🆕 Si NO hay detalles en la request pero SÍ hay certificacion_nueva
    // Buscar automáticamente los detalles existentes del formato y procesarlos
    if ((!detalles || detalles.length === 0) && certificacion_nueva !== null && certificacion_anterior === null) {
      console.log(`📌 Sin detalles en request pero SÍ hay certificacion_nueva (${certificacion_nueva})`);
      console.log(`📌 Buscando detalles existentes del formato ${id}...`);
      
      const { pool } = require('../config/database');
      
      try {
        // Obtener detalles existentes del formato
        const [detallesExistentes] = await pool.query(
          `SELECT id, clasificador_id, monto, detalles_certificacion_credito_id
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ?`,
          [id]
        );
        
        console.log(`📋 Detalles existentes encontrados: ${detallesExistentes.length}`);
        
        if (detallesExistentes && detallesExistentes.length > 0) {
          // Procesar cada detalle existente para mapear a nueva certificación
          for (const detalleExistente of detallesExistentes) {
            let detallesCertId = null;
            
            // Buscar el detalles_certificacion_credito_id correcto en nueva certificación
            const [detallesCert] = await pool.query(
              `SELECT id FROM detalles_certificacion_credito 
               WHERE certificacion_credito_id = ? AND clasificador_id = ?
               LIMIT 1`,
              [certificacion_nueva, detalleExistente.clasificador_id]
            );
            
            if (detallesCert && detallesCert.length > 0) {
              detallesCertId = detallesCert[0].id;
              console.log(`✅ Mapeo encontrado: clasificador ${detalleExistente.clasificador_id} → detalles_cert_id ${detallesCertId}`);
              
              // Actualizar la referencia en formato_emisiones_detalles
              await pool.query(
                `UPDATE formato_emisiones_detalles 
                 SET detalles_certificacion_credito_id = ?
                 WHERE id = ?`,
                [detallesCertId, detalleExistente.id]
              );
              console.log(`✅ Referencia actualizada en formato_emisiones_detalles ID ${detalleExistente.id}`);
              
              // Sumar monto_utilizado a nueva certificación
              await pool.query(
                `UPDATE detalles_certificacion_credito 
                 SET monto_utilizado = monto_utilizado + ?
                 WHERE id = ?`,
                [detalleExistente.monto || 0, detallesCertId]
              );
              console.log(`✅ Monto sumado a nueva certificación (detalle ${detallesCertId}): +S/. ${detalleExistente.monto}`);
            } else {
              console.log(`⚠️ NO encontrado mapeo para clasificador ${detalleExistente.clasificador_id} en cert ${certificacion_nueva}`);
            }
          }
        }
      } catch (procesarError) {
        console.error(`❌ Error al procesar detalles automáticos:`, procesarError.message);
      }
    }

    // 🆕 Actualizar detalles si existen
    let detallesActualizados = 0;
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      const { pool } = require('../config/database');
      
      try {
        // 1️⃣ Obtener detalles antiguos para restar sus montos
        const [detallesAntiguos] = await pool.query(
          `SELECT detalles_certificacion_credito_id, monto, clasificador_id
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ?`,
          [id]
        );
        
        console.log(`📋 Detalles antiguos encontrados: ${detallesAntiguos.length}`);
        
        // 2️⃣ Restar los montos utilizados de los detalles antiguos
        // IMPORTANTE: Si cambió certificación y los detalles vienen con NULL,
        // necesitamos buscar los detalles OLD en la certificación anterior
        for (const detalleAntiguo of detallesAntiguos) {
          if (detalleAntiguo.detalles_certificacion_credito_id) {
            // CASO NORMAL: Tenemos la referencia, solo restar
            await pool.query(
              `UPDATE detalles_certificacion_credito 
               SET monto_utilizado = monto_utilizado - ?
               WHERE id = ?`,
              [detalleAntiguo.monto || 0, detalleAntiguo.detalles_certificacion_credito_id]
            );
            console.log(`✅ Monto utilizado actualizado (restado) para detalle ${detalleAntiguo.detalles_certificacion_credito_id}: -S/. ${detalleAntiguo.monto}`);
          } else if (certificacion_anterior !== null && detalleAntiguo.clasificador_id) {
            // CASO ESPECIAL: Si cambió certificación y detalle OLD no tiene referencia
            // Buscar el detalle en la certificación anterior
            console.log(`⚠️ Detalle antiguo sin referencia, buscando en certificación anterior ${certificacion_anterior}, clasificador ${detalleAntiguo.clasificador_id}`);
            const [detallesAntCert] = await pool.query(
              `SELECT id FROM detalles_certificacion_credito 
               WHERE certificacion_credito_id = ? AND clasificador_id = ?
               LIMIT 1`,
              [certificacion_anterior, detalleAntiguo.clasificador_id]
            );
            
            if (detallesAntCert && detallesAntCert.length > 0) {
              const detalleAntId = detallesAntCert[0].id;
              await pool.query(
                `UPDATE detalles_certificacion_credito 
                 SET monto_utilizado = monto_utilizado - ?
                 WHERE id = ?`,
                [detalleAntiguo.monto || 0, detalleAntId]
              );
              console.log(`✅ Monto utilizado actualizado (restado) en cert anterior para detalle ${detalleAntId}: -S/. ${detalleAntiguo.monto}`);
            }
          }
        }
        
        // 3️⃣ Eliminar detalles existentes
        const deleteResult = await pool.query(
          `DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
          [id]
        );
        console.log(`🗑️ Detalles previos eliminados (${deleteResult[0].affectedRows} registros) para formato ${id}`);

        // 4️⃣ Insertar nuevos detalles y sumar los montos
        for (const detalle of detalles) {
          console.log(`  📝 Insertando detalle:`, detalle);
          
          // 🆕 LÓGICA: Si detalles_certificacion_credito_id es NULL pero tenemos certificacion_nueva y clasificador_id
          // Buscar automáticamente el detalles_certificacion_credito_id correcto
          let detallesCertId = detalle.detalles_certificacion_credito_id || null;
          
          if (detallesCertId === null && certificacion_nueva !== null && detalle.clasificador_id) {
            console.log(`🔍 Buscando detalles_certificacion_credito para cert=${certificacion_nueva}, clasificador=${detalle.clasificador_id}`);
            
            // Buscar en detalles_certificacion_credito
            const [detallesCert] = await pool.query(
              `SELECT id FROM detalles_certificacion_credito 
               WHERE certificacion_credito_id = ? AND clasificador_id = ?
               LIMIT 1`,
              [certificacion_nueva, detalle.clasificador_id]
            );
            
            if (detallesCert && detallesCert.length > 0) {
              detallesCertId = detallesCert[0].id;
              console.log(`✅ Encontrado detalles_certificacion_credito_id = ${detallesCertId}`);
            } else {
              console.log(`⚠️ NO encontrado detalles_certificacion_credito para cert=${certificacion_nueva}, clasificador=${detalle.clasificador_id}`);
              detallesCertId = null;
            }
          }
          
          // Si certificacion_id es NULL, limpiar detalles_certificacion_credito_id
          if (certificacion_nueva === null && detallesCertId) {
            console.log(`⚠️ Certificación es NULL, limpiando detalles_certificacion_credito_id para detalle ${detallesCertId}`);
            detallesCertId = null;
          }
          
          const insertResult = await pool.query(
            `INSERT INTO formato_emisiones_detalles (
              formato_emision_id, 
              clasificador_id, 
              monto,
              detalles_certificacion_credito_id
            ) VALUES (?, ?, ?, ?)`,
            [
              id,
              detalle.clasificador_id,
              detalle.monto || 0,
              detallesCertId
            ]
          );
          console.log(`    ✅ Detalle insertado, ID: ${insertResult[0].insertId}`);
          
          // 🆕 Actualizar monto_utilizado con el nuevo monto (solo si hay certificación)
          if (detallesCertId) {
            await pool.query(
              `UPDATE detalles_certificacion_credito 
               SET monto_utilizado = monto_utilizado + ?
               WHERE id = ?`,
              [detalle.monto || 0, detallesCertId]
            );
            console.log(`✅ Monto utilizado actualizado (sumado) para detalle ${detallesCertId}: +S/. ${detalle.monto}`);
          }
          
          detallesActualizados++;
        }
        console.log(`✅ ${detallesActualizados} detalles insertados para formato ${id}`);
      } catch (detallesError) {
        console.error(`❌ Error al actualizar detalles:`, detallesError.message);
        // No lanzar error, continuar con la respuesta
      }
    }

    // 🆕 Si certificacion_id es NULL pero NO hay detalles nuevos, limpiar todo
    else if (certificacion_nueva === null) {
      console.log(`⚠️ Certificación es NULL y no hay detalles nuevos, limpiando detalles existentes...`);
      
      try {
        const { pool } = require('../config/database');
        
        // Obtener montos para restar
        const [detallesAntiguos] = await pool.query(
          `SELECT detalles_certificacion_credito_id, monto 
           FROM formato_emisiones_detalles 
           WHERE formato_emision_id = ? AND detalles_certificacion_credito_id IS NOT NULL`,
          [id]
        );

        // Restar montos
        for (const detalleAntiguo of detallesAntiguos) {
          if (detalleAntiguo.detalles_certificacion_credito_id) {
            await pool.query(
              `UPDATE detalles_certificacion_credito 
               SET monto_utilizado = monto_utilizado - ?
               WHERE id = ?`,
              [detalleAntiguo.monto || 0, detalleAntiguo.detalles_certificacion_credito_id]
            );
            console.log(`✅ Monto restado para detalle ${detalleAntiguo.detalles_certificacion_credito_id}: -S/. ${detalleAntiguo.monto}`);
          }
        }

        // Limpiar detalles_certificacion_credito_id a NULL
        await pool.query(
          `UPDATE formato_emisiones_detalles 
           SET detalles_certificacion_credito_id = NULL
           WHERE formato_emision_id = ?`,
          [id]
        );
        console.log(`✅ Detalles desasociados - detalles_certificacion_credito_id → NULL`);
      } catch (limpiezaError) {
        console.error(`❌ Error al limpiar detalles:`, limpiezaError.message);
      }
    }

    // 🆕 SINCRONIZAR MONTO_UTILIZADO (CRÍTICO!)
    // Recalcula todos los detalles de certificación afectados
    await sincronizarMontoUtilizado(id);

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
