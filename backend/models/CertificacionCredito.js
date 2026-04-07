const { pool } = require('../config/database');

class CertificacionCredito {
  // ========== CERTIFICACIÓN PRINCIPAL ==========
  
  // Crear certificación de crédito
  static async crear(data) {
    const {
      nota,
      mes,
      fecha_aprobacion,
      fecha_documento,
      estado_certificacion,
      tipo_documento,
      numero_documento,
      justificacion,
      meta_id,
      fuente_financiamiento_id,
      usuario_id,
      ruta_archivo_pdf,
      nombre_archivo_pdf,
      monto_certificado
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO certificaciones_credito (
          nota, mes, fecha_aprobacion, fecha_documento, 
          estado_certificacion, tipo_documento, numero_documento, 
          justificacion, meta_id, fuente_financiamiento_id, usuario_id,
          ruta_archivo_pdf, nombre_archivo_pdf, monto_certificado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nota, mes, fecha_aprobacion, fecha_documento,
          estado_certificacion, tipo_documento, numero_documento,
          justificacion, meta_id || null, fuente_financiamiento_id || null, usuario_id,
          ruta_archivo_pdf || null, nombre_archivo_pdf || null, parseFloat(monto_certificado) || 0
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear certificación: ${error.message}`);
    }
  }

  // Obtener certificación por ID con detalles
  static async obtenerPorId(id) {
    try {
      const [certificaciones] = await pool.query(
        `SELECT cc.*, 
                m.nombre as meta_nombre, m.numero_meta,
                ff.nombre as fuente_financiamiento_nombre
         FROM certificaciones_credito cc
         LEFT JOIN metas m ON cc.meta_id = m.id
         LEFT JOIN fuentes_financiamiento ff ON cc.fuente_financiamiento_id = ff.id
         WHERE cc.id = ?`,
        [id]
      );

      if (certificaciones.length === 0) {
        return null;
      }

      const certificacion = certificaciones[0];

      // Obtener detalles de certificación
      const [detalles] = await pool.query(
        `SELECT dcc.*, cl.nombre as clasificador_nombre, cl.partida
         FROM detalles_certificacion_credito dcc
         JOIN clasificadores cl ON dcc.clasificador_id = cl.id
         WHERE dcc.certificacion_credito_id = ?
         ORDER BY dcc.id`,
        [id]
      );

      certificacion.detalles = detalles;
      return certificacion;
    } catch (error) {
      throw new Error(`Error al obtener certificación: ${error.message}`);
    }
  }

  // Listar todas las certificaciones
  static async listar(filtros = {}, userContext = {}) {
    try {
      let query = `SELECT cc.id, cc.nota, cc.mes, cc.fecha_aprobacion, cc.fecha_documento, 
                          cc.estado_certificacion, cc.tipo_documento, cc.numero_documento, 
                          cc.justificacion, cc.meta_id, cc.fuente_financiamiento_id, 
                          cc.usuario_id, cc.nombre_archivo_pdf, cc.ruta_archivo_pdf, cc.monto_certificado,
                          IF(cc.ruta_archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf,
                          cc.created_at, cc.updated_at,
                          m.nombre as meta_nombre, m.numero_meta, m.ambito_id,
                          a.nombre_corto as ambito_nombre_corto,
                          ff.nombre as fuente_financiamiento_nombre, ff.abreviatura as fuente_financiamiento_abreviatura,
                          u.nombre as usuario_nombre,
                          COALESCE(SUM(dcc.monto), 0) as monto_total
                   FROM certificaciones_credito cc
                   LEFT JOIN metas m ON cc.meta_id = m.id
                   LEFT JOIN ambitos a ON m.ambito_id = a.id
                   LEFT JOIN fuentes_financiamiento ff ON cc.fuente_financiamiento_id = ff.id
                   LEFT JOIN users u ON cc.usuario_id = u.id
                   LEFT JOIN detalles_certificacion_credito dcc ON cc.id = dcc.certificacion_credito_id
                   WHERE 1=1`;

      const params = [];

      // ========== CONTROL DE ACCESO BASADO EN ROL Y ÁMBITO ==========
      // Admin: Ve todos los certificados de todos los ámbitos
      if (userContext && userContext.rol && userContext.rol !== 'admin') {
        // Usuario con ámbito asignado
        if (userContext.ambito_id) {
          // Necesitamos verificar si el ámbito del usuario es AAA o ALA
          // AAA (dependencia_id IS NULL): administra todo → no filtrar
          // ALA (dependencia_id IS NOT NULL): solo su ámbito → filtrar
          
          // Hacemos una consulta para determinar si es AAA o ALA
          const { pool } = require('../config/database');
          const [ambitoUser] = await pool.query(
            'SELECT dependencia_id FROM ambitos WHERE id = ? AND activo = 1',
            [userContext.ambito_id]
          );

          // Si el ámbito NO es una AAA (tiene dependencia_id), filtrar por ese ámbito
          if (ambitoUser.length > 0 && ambitoUser[0].dependencia_id !== null) {
            query += ` AND a.id = ?`;
            params.push(userContext.ambito_id);
          }
          // Si es una AAA (dependencia_id IS NULL), no filtrar → ve todo
        }
        // Si no tiene ambito_id asignado, ve todo
      }
      // Admin no aplica filtro de ámbito

      if (filtros.meta_id) {
        query += ` AND cc.meta_id = ?`;
        params.push(filtros.meta_id);
      }

      if (filtros.fuente_financiamiento_id) {
        query += ` AND cc.fuente_financiamiento_id = ?`;
        params.push(filtros.fuente_financiamiento_id);
      }

      if (filtros.estado_certificacion) {
        query += ` AND cc.estado_certificacion = ?`;
        params.push(filtros.estado_certificacion);
      }

      if (filtros.mes) {
        query += ` AND cc.mes = ?`;
        params.push(filtros.mes);
      }

      query += ` GROUP BY cc.id ORDER BY cc.fecha_documento DESC, cc.id DESC`;

      const [certificaciones] = await pool.query(query, params);
      return certificaciones;
    } catch (error) {
      throw new Error(`Error al listar certificaciones: ${error.message}`);
    }
  }

  // Actualizar certificación
  static async actualizar(id, data) {
    const {
      nota,
      mes,
      fecha_aprobacion,
      fecha_documento,
      estado_certificacion,
      tipo_documento,
      numero_documento,
      justificacion,
      meta_id,
      fuente_financiamiento_id,
      monto_certificado
    } = data;

    try {
      const [result] = await pool.query(
        `UPDATE certificaciones_credito 
         SET nota = ?, mes = ?, fecha_aprobacion = ?, fecha_documento = ?,
             estado_certificacion = ?, tipo_documento = ?, numero_documento = ?,
             justificacion = ?, meta_id = ?, fuente_financiamiento_id = ?, monto_certificado = ?
         WHERE id = ?`,
        [
          nota, mes, fecha_aprobacion, fecha_documento,
          estado_certificacion, tipo_documento, numero_documento,
          justificacion, meta_id || null, fuente_financiamiento_id || null, parseFloat(monto_certificado) || 0, id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar certificación: ${error.message}`);
    }
  }

  // Eliminar certificación
  static async eliminar(id) {
    try {
      // Primero eliminar detalles
      await pool.query(
        `DELETE FROM detalles_certificacion_credito WHERE certificacion_credito_id = ?`,
        [id]
      );

      // Luego eliminar certificación
      const [result] = await pool.query(
        `DELETE FROM certificaciones_credito WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar certificación: ${error.message}`);
    }
  }

  // ========== DETALLES DE CERTIFICACIÓN ==========

  // Crear detalle de certificación
  static async crearDetalle(data) {
    const {
      certificacion_credito_id,
      clasificador_id,
      monto
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO detalles_certificacion_credito (
          certificacion_credito_id, clasificador_id, monto
        ) VALUES (?, ?, ?)`,
        [certificacion_credito_id, clasificador_id, monto]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear detalle: ${error.message}`);
    }
  }

  // Obtener detalle por ID
  static async obtenerDetallePorId(id) {
    try {
      const [detalles] = await pool.query(
        `SELECT dcc.*, cl.nombre as clasificador_nombre, cl.partida
         FROM detalles_certificacion_credito dcc
         JOIN clasificadores cl ON dcc.clasificador_id = cl.id
         WHERE dcc.id = ?`,
        [id]
      );

      return detalles.length > 0 ? detalles[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener detalle: ${error.message}`);
    }
  }

  // Actualizar detalle
  static async actualizarDetalle(id, data) {
    const { clasificador_id, monto } = data;

    try {
      const [result] = await pool.query(
        `UPDATE detalles_certificacion_credito 
         SET clasificador_id = ?, monto = ?
         WHERE id = ?`,
        [clasificador_id, monto, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar detalle: ${error.message}`);
    }
  }

  // Eliminar detalle
  static async eliminarDetalle(id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM detalles_certificacion_credito WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar detalle: ${error.message}`);
    }
  }

  // Listar detalles por certificación
  static async listarDetalles(certificacion_credito_id) {
    try {
      const [detalles] = await pool.query(
        `SELECT dcc.*, cl.nombre as clasificador_nombre, cl.partida
         FROM detalles_certificacion_credito dcc
         JOIN clasificadores cl ON dcc.clasificador_id = cl.id
         WHERE dcc.certificacion_credito_id = ?
         ORDER BY dcc.id`,
        [certificacion_credito_id]
      );
      return detalles;
    } catch (error) {
      throw new Error(`Error al listar detalles: ${error.message}`);
    }
  }

  // Obtener total de montos por certificación
  static async obtenerTotalMonto(certificacion_credito_id) {
    try {
      const [result] = await pool.query(
        `SELECT SUM(monto) as total FROM detalles_certificacion_credito 
         WHERE certificacion_credito_id = ?`,
        [certificacion_credito_id]
      );
      return result[0].total || 0;
    } catch (error) {
      throw new Error(`Error al obtener total: ${error.message}`);
    }
  }
}

module.exports = CertificacionCredito;
