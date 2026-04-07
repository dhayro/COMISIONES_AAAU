const { pool } = require('../config/database');

class FormatoEmision {
  // Crear formato de emisión
  static async crear(data) {
    const {
      comision_id,
      usuario_id,
      costo_viaje_id,
      meta_id,  // 🆕 META
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
      numero_cut, // 🆕 NÚMERO CUT
      codigo_cp,
      tipo_emision,
      costo_xdia,
      monto_total,
      actividad_realizar,  // 🆕 ACTIVIDAD A REALIZAR
      observacion,
      creado_por
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO formato_emisiones (
          comision_id, usuario_id, costo_viaje_id, meta_id, certificacion_id, fuente_financiamiento_id, numero_documento, 
          fecha_emision, lugar, ruta, modalidad_viaje, 
          fecha_salida, fecha_retorno, num_dias, 
          numero_siaf, numero_cut, codigo_cp, tipo_emision, 
          costo_xdia, monto_total, actividad_realizar, observacion, creado_por, estado_emision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR')`,
        [
          comision_id, usuario_id, costo_viaje_id || null, meta_id || null, certificacion_id || null, fuente_financiamiento_id || null, numero_documento,
          fecha_emision, lugar, ruta, modalidad_viaje,
          fecha_salida, fecha_retorno, num_dias,
          numero_siaf || null, numero_cut || null, codigo_cp || null, tipo_emision || 'REEMBOLSO',
          costo_xdia, monto_total || 0, actividad_realizar || null, observacion || null, creado_por
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear formato de emisión: ${error.message}`);
    }
  }

  // Obtener formato por ID
  static async obtenerPorId(id) {
    try {
      const [formatos] = await pool.query(
        `SELECT fe.*, 
                u.nombre as usuario_nombre, 
                c.lugar as comision_lugar,
                cv.nombre as costo_viaje_nombre
         FROM formato_emisiones fe
         LEFT JOIN users u ON fe.usuario_id = u.id
         LEFT JOIN comisiones c ON fe.comision_id = c.id
         LEFT JOIN costos_viaje cv ON fe.costo_viaje_id = cv.id
         WHERE fe.id = ?`,
        [id]
      );

      if (formatos.length === 0) {
        return null;
      }

      const formato = formatos[0];

      // Obtener detalles del formato
      const [detalles] = await pool.query(
        `SELECT fed.id, 
                fed.formato_emision_id, 
                fed.clasificador_id, 
                fed.monto,
                fed.detalles_certificacion_credito_id,
                cl.nombre as clasificador_nombre, 
                cl.partida
         FROM formato_emisiones_detalles fed
         JOIN clasificadores cl ON fed.clasificador_id = cl.id
         WHERE fed.formato_emision_id = ?
         ORDER BY fed.clasificador_id`,
        [id]
      );

      formato.detalles = detalles;
      return formato;
    } catch (error) {
      throw new Error(`Error al obtener formato: ${error.message}`);
    }
  }

  // Listar formatos con filtros
  static async listar(filtros = {}, usuarioId = null, rol = null, userAmbitoId = null) {
    try {
      let query = `
        SELECT fe.*, 
               u.nombre as usuario_nombre,
               u.ambito_id,
               a.nombre_corto as ambito_nombre,
               c.lugar as comision_lugar,
               cc.nota as certificacion_nota,
               COUNT(fed.id) as total_detalles
        FROM formato_emisiones fe
        LEFT JOIN users u ON fe.usuario_id = u.id
        LEFT JOIN ambitos a ON u.ambito_id = a.id
        LEFT JOIN comisiones c ON fe.comision_id = c.id
        LEFT JOIN certificaciones_credito cc ON fe.certificacion_id = cc.id
        LEFT JOIN formato_emisiones_detalles fed ON fe.id = fed.formato_emision_id
        WHERE 1=1
      `;

      const params = [];

      // 🆕 Filtro por rol - ACTUALIZADO CON FILTRO AMBITO
      if (rol === 'usuario' && usuarioId) {
        // USUARIO: Ver solo sus propios formatos
        query += ` AND fe.usuario_id = ?`;
        params.push(usuarioId);
        console.log(`🔐 FILTRO: USUARIO (id=${usuarioId})`);
      } else if (rol === 'administrativo' && userAmbitoId) {
        // 🆕 ADMINISTRATIVO: Ver solo formatos de usuarios del mismo ámbito
        query += ` AND u.ambito_id = ?`;
        params.push(userAmbitoId);
        console.log(`🔐 FILTRO: ADMINISTRATIVO (ambito_id=${userAmbitoId})`);
      }
      // JEFE y ADMIN: ven todos (sin filtro adicional)

      // Filtro por estado
      if (filtros.estado_emision) {
        query += ` AND fe.estado_emision = ?`;
        params.push(filtros.estado_emision);
      }

      // Filtro por comisión
      if (filtros.comision_id) {
        query += ` AND fe.comision_id = ?`;
        params.push(filtros.comision_id);
      }

      // Filtro por tipo de emisión
      if (filtros.tipo_emision) {
        query += ` AND fe.tipo_emision = ?`;
        params.push(filtros.tipo_emision);
      }

      query += ` GROUP BY fe.id ORDER BY fe.fecha_emision DESC`;

      const [formatos] = await pool.query(query, params);
      return formatos;
    } catch (error) {
      throw new Error(`Error al listar formatos: ${error.message}`);
    }
  }

  // Actualizar formato
  static async actualizar(id, data) {
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
      numero_cut, // 🆕 NÚMERO CUT
      codigo_cp,
      tipo_emision,
      costo_xdia,
      monto_total,
      actividad_realizar,  // 🆕 ACTIVIDAD A REALIZAR
      observacion,
      numero_documento,
      fecha_emision,
      estado_emision
    } = data;

    try {
      // 🆕 Construir UPDATE dinámico para campos que pueden ser null
      const campos = [];
      const valores = [];
      
      if (comision_id !== undefined) { campos.push('comision_id = ?'); valores.push(comision_id); }
      if (usuario_id !== undefined) { campos.push('usuario_id = ?'); valores.push(usuario_id); }
      if (costo_viaje_id !== undefined) { campos.push('costo_viaje_id = ?'); valores.push(costo_viaje_id); }
      if (meta_id !== undefined) { campos.push('meta_id = ?'); valores.push(meta_id); }
      if (certificacion_id !== undefined) { campos.push('certificacion_id = ?'); valores.push(certificacion_id); }
      if (fuente_financiamiento_id !== undefined) { campos.push('fuente_financiamiento_id = ?'); valores.push(fuente_financiamiento_id); }  // 🆕
      if (lugar !== undefined) { campos.push('lugar = ?'); valores.push(lugar); }
      if (ruta !== undefined) { campos.push('ruta = ?'); valores.push(ruta); }
      if (modalidad_viaje !== undefined) { campos.push('modalidad_viaje = ?'); valores.push(modalidad_viaje); }
      if (fecha_salida !== undefined) { campos.push('fecha_salida = ?'); valores.push(fecha_salida); }
      if (fecha_retorno !== undefined) { campos.push('fecha_retorno = ?'); valores.push(fecha_retorno); }
      if (num_dias !== undefined) { campos.push('num_dias = ?'); valores.push(num_dias); }
      if (numero_siaf !== undefined) { campos.push('numero_siaf = ?'); valores.push(numero_siaf); }
      if (numero_cut !== undefined) { campos.push('numero_cut = ?'); valores.push(numero_cut); } // 🆕 NÚMERO CUT
      if (codigo_cp !== undefined) { campos.push('codigo_cp = ?'); valores.push(codigo_cp); }
      if (tipo_emision !== undefined) { campos.push('tipo_emision = ?'); valores.push(tipo_emision); }
      if (costo_xdia !== undefined) { campos.push('costo_xdia = ?'); valores.push(costo_xdia); }
      if (monto_total !== undefined) { campos.push('monto_total = ?'); valores.push(monto_total); }
      if (actividad_realizar !== undefined) { campos.push('actividad_realizar = ?'); valores.push(actividad_realizar); }
      if (observacion !== undefined) { campos.push('observacion = ?'); valores.push(observacion); }
      if (numero_documento !== undefined) { campos.push('numero_documento = ?'); valores.push(numero_documento); }
      if (estado_emision !== undefined) { campos.push('estado_emision = ?'); valores.push(estado_emision); }
      
      // 🆕 Siempre actualizar el timestamp
      campos.push('actualizado_en = CURRENT_TIMESTAMP');
      
      // 🆕 Agregar ID al final del array de valores
      valores.push(id);
      
      // 🆕 Si no hay campos a actualizar, solo actualizar el timestamp
      if (campos.length === 1) {
        // Solo timestamp
        console.log('⚠️ Sin campos a actualizar, solo actualizando timestamp');
      }
      
      const query = `UPDATE formato_emisiones SET ${campos.join(', ')} WHERE id = ?`;
      console.log('🔧 Query de actualización:', query);
      console.log('📊 Valores:', valores);
      console.log('📊 Campos:', campos);
      
      const [result] = await pool.query(query, valores);
      console.log(`✅ Filas afectadas: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar formato: ${error.message}`);
    }
  }

  // Eliminar formato
  static async eliminar(id) {
    try {
      // 1️⃣ Obtener detalles del formato para restar sus montos
      const [detalles] = await pool.query(
        `SELECT detalles_certificacion_credito_id, monto 
         FROM formato_emisiones_detalles 
         WHERE formato_emision_id = ?`,
        [id]
      );
      
      console.log(`📋 Detalles del formato ${id} a eliminar: ${detalles.length}`);
      
      // 2️⃣ Restar los montos utilizados de cada detalle
      for (const detalle of detalles) {
        if (detalle.detalles_certificacion_credito_id) {
          await pool.query(
            `UPDATE detalles_certificacion_credito 
             SET monto_utilizado = monto_utilizado - ?
             WHERE id = ?`,
            [detalle.monto || 0, detalle.detalles_certificacion_credito_id]
          );
          console.log(`✅ Monto utilizado actualizado (restado) para detalle ${detalle.detalles_certificacion_credito_id}: -S/. ${detalle.monto}`);
        }
      }
      
      // 3️⃣ Eliminar detalles del formato
      await pool.query(
        'DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?',
        [id]
      );

      // 4️⃣ Eliminar formato
      const [result] = await pool.query(
        'DELETE FROM formato_emisiones WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar formato: ${error.message}`);
    }
  }

  // Agregar detalle al formato
  static async agregarDetalle(formatoId, data) {
    const {
      clasificador_id,
      monto,  // ❌ QUITADO: dias
      descripcion,
      observacion,
      detalles_certificacion_credito_id
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO formato_emisiones_detalles (
          formato_emision_id, clasificador_id, monto, 
          descripcion, observacion, detalles_certificacion_credito_id
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          formatoId, clasificador_id, monto,
          descripcion || null, observacion || null, detalles_certificacion_credito_id || null
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al agregar detalle: ${error.message}`);
    }
  }

  // Obtener próximo número de documento
  static async obtenerProximoNumeroDocumento() {
    try {
      const [resultado] = await pool.query(
        `SELECT COUNT(*) as total FROM formato_emisiones`
      );

      const anio = new Date().getFullYear();
      const numero = (resultado[0].total + 1).toString().padStart(5, '0');
      return `EF-${anio}-${numero}`;
    } catch (error) {
      throw new Error(`Error al obtener número de documento: ${error.message}`);
    }
  }
}

module.exports = FormatoEmision;
