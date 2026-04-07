const { pool } = require('../config/database');

class Rendicion {
  /**
   * 📝 Crear rendición (nueva tabla principal)
   */
  static async crear(datos) {
    let connection;
    try {
      connection = await pool.getConnection();

      const {
        formato_emision_id,
        formato_emisiones_detalles_id,
        tipo_comprobante_id,
        proveedor_id,
        numero_comprobante,
        fecha_comprobante,
        monto,
        tipo_viatitico,
      } = datos;

      const [result] = await connection.query(
        `INSERT INTO rendiciones 
         (formato_emision_id, formato_emisiones_detalles_id, tipo_comprobante_id, proveedor_id, 
          numero_comprobante, fecha_comprobante, monto, tipo_viatitico, estado_rendicion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
        [
          formato_emision_id || null,
          formato_emisiones_detalles_id,
          tipo_comprobante_id || null,
          proveedor_id || null,
          numero_comprobante || null,
          fecha_comprobante || null,
          monto || 0,
          tipo_viatitico || null,
        ]
      );

      console.log(`✅ Rendición creada: ID ${result.insertId}`);
      return { id: result.insertId, ...datos };
    } catch (error) {
      console.error('❌ Error en Rendicion.crear:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔍 Obtener rendición por ID
   */
  static async obtenerPorId(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [rows] = await connection.query(
        `SELECT * FROM rendiciones WHERE id = ?`,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en Rendicion.obtenerPorId:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 📋 Listar rendiciones por comprobante (legacy, si aún se usa)
   */
  static async listarPorComprobante(comprobante_id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [rows] = await connection.query(
        `SELECT 
          r.*,
          fed.clasificador_id,
          fed.monto as monto_original,
          c.nombre as clasificador_nombre
         FROM rendiciones r
         LEFT JOIN formato_emisiones_detalles fed ON r.formato_emisiones_detalles_id = fed.id
         LEFT JOIN clasificadores c ON fed.clasificador_id = c.id
         WHERE r.id = ?
         ORDER BY r.creado_en`,
        [comprobante_id]
      );

      return rows;
    } catch (error) {
      console.error('❌ Error en Rendicion.listarPorComprobante:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 📋 Listar por formato_emision_id
   */
  static async listarPorFormato(formato_emision_id) {
    let connection;
    try {
      connection = await pool.getConnection();

      let query = `SELECT 
        r.*,
        tc.nombre as tipo_comprobante_nombre,
        p.razon_social as proveedor_nombre,
        fed.monto as monto_original,
        fed.partida as partida,
        clf.nombre as clasificador_nombre
       FROM rendiciones r
       LEFT JOIN tipo_comprobante tc ON r.tipo_comprobante_id = tc.id
       LEFT JOIN proveedores p ON r.proveedor_id = p.id
       LEFT JOIN formato_emisiones_detalles fed ON r.formato_emisiones_detalles_id = fed.id
       LEFT JOIN clasificadores clf ON fed.clasificador_id = clf.id
       WHERE 1=1`;

      const params = [];

      if (formato_emision_id) {
        query += ` AND r.formato_emision_id = ?`;
        params.push(formato_emision_id);
      }

      query += ` ORDER BY r.creado_en DESC`;

      const [rows] = await connection.query(query, params);

      return rows;
    } catch (error) {
      console.error('❌ Error en Rendicion.listarPorFormato:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ✏️ Actualizar rendición
   */
  static async actualizar(id, datos) {
    let connection;
    try {
      connection = await pool.getConnection();

      const actualizables = [
        'tipo_comprobante_id',
        'proveedor_id',
        'numero_comprobante',
        'fecha_comprobante',
        'monto',
        'tipo_viatitico',
        'estado_rendicion',
        'observacion_rechazo',
      ];

      let query = 'UPDATE rendiciones SET ';
      const values = [];

      Object.keys(datos).forEach((key) => {
        if (actualizables.includes(key)) {
          query += `${key} = ?, `;
          values.push(datos[key]);
        }
      });

      query += `actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`;
      values.push(id);

      await connection.query(query, values);
      console.log(`✅ Rendición ${id} actualizada`);
      return true;
    } catch (error) {
      console.error('❌ Error en Rendicion.actualizar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🗑️ Eliminar rendición
   */
  static async eliminar(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      await connection.query('DELETE FROM rendiciones WHERE id = ?', [id]);
      console.log(`✅ Rendición ${id} eliminada`);
      return true;
    } catch (error) {
      console.error('❌ Error en Rendicion.eliminar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🗑️ Eliminar todas las rendiciones de un comprobante
   */
  static async eliminarPorComprobante(comprobante_id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [result] = await connection.query(
        'DELETE FROM rendiciones WHERE id = ?',
        [comprobante_id]
      );

      console.log(`✅ Rendiciones eliminadas`);
      return result;
    } catch (error) {
      console.error('❌ Error en Rendicion.eliminarPorComprobante:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 📊 Obtener rendiciones con detalles completos
   */
  static async obtenerConDetalles(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [rows] = await connection.query(
        `SELECT 
          r.*,
          tc.nombre as tipo_comprobante_nombre,
          tc.descripcion as tipo_comprobante_descripcion,
          p.razon_social as proveedor_nombre,
          p.ruc_dni as proveedor_ruc_dni,
          fed.clasificador_id,
          fed.monto as monto_original,
          fed.descripcion as detalle_descripcion,
          clf.nombre as clasificador_nombre,
          clf.tipo_gasto
         FROM rendiciones r
         LEFT JOIN tipo_comprobante tc ON r.tipo_comprobante_id = tc.id
         LEFT JOIN proveedores p ON r.proveedor_id = p.id
         LEFT JOIN formato_emisiones_detalles fed ON r.formato_emisiones_detalles_id = fed.id
         LEFT JOIN clasificadores clf ON fed.clasificador_id = clf.id
         WHERE r.id = ?`,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en Rendicion.obtenerConDetalles:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🆕 Crear rendición principal (nuevo modelo multi-comprobante)
   */
  static async crearRendicionMaestra(datos) {
    let connection;
    try {
      connection = await pool.getConnection();

      const {
        formato_emision_id,
        estado = 'PENDIENTE',
        observaciones_general = '',
      } = datos;

      const [result] = await connection.query(
        `INSERT INTO rendiciones_maestras 
         (formato_emision_id, estado, fecha_rendicion, observaciones_general) 
         VALUES (?, ?, NOW(), ?)`,
        [formato_emision_id, estado, observaciones_general]
      );

      console.log(`✅ Rendición maestra creada: ID ${result.insertId}`);
      return { id: result.insertId, ...datos };
    } catch (error) {
      console.error('❌ Error en Rendicion.crearRendicionMaestra:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🆕 Crear comprobante dentro de una rendición
   */
  static async crearComprobante(datos) {
    let connection;
    try {
      connection = await pool.getConnection();

      const {
        rendicion_id,
        formato_emisiones_detalles_id,
        tipo_comprobante_id,
        proveedor_id,
        numero_comprobante,
        fecha_comprobante,
        monto,
        tipo_viatico,
        tipo_rendicion = 'viaticos',
        observaciones,
      } = datos;

      const [result] = await connection.query(
        `INSERT INTO rendicion_comprobantes 
         (rendicion_id, formato_emisiones_detalles_id, tipo_comprobante_id, proveedor_id, 
          numero_comprobante, fecha_comprobante, monto, tipo_viatico, tipo_rendicion, observaciones) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rendicion_id,
          formato_emisiones_detalles_id,
          tipo_comprobante_id || null,
          proveedor_id || null,
          numero_comprobante || null,
          fecha_comprobante || null,
          parseFloat(monto) || 0,
          tipo_viatico || null,
          tipo_rendicion,
          observaciones || null,
        ]
      );

      console.log(`✅ Comprobante guardado en rendición: ID ${result.insertId}`);
      return { id: result.insertId, ...datos };
    } catch (error) {
      console.error('❌ Error en Rendicion.crearComprobante:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🆕 Obtener rendición maestra con todos sus comprobantes
   */
  static async obtenerRendicionCompleta(rendicion_id) {
    let connection;
    try {
      connection = await pool.getConnection();

      // Obtener rendición maestra
      const [rendiciones] = await connection.query(
        `SELECT * FROM rendiciones_maestras WHERE id = ?`,
        [rendicion_id]
      );

      const rendicion = rendiciones[0];
      if (!rendicion) return null;

      // Obtener todos los comprobantes
      const [comprobantes] = await connection.query(
        `SELECT 
          rc.*,
          tc.nombre as tipo_comprobante_nombre,
          p.razon_social as proveedor_nombre,
          fed.clasificador_id,
          fed.monto as monto_disponible,
          clf.nombre as clasificador_nombre
         FROM rendicion_comprobantes rc
         LEFT JOIN tipo_comprobante tc ON rc.tipo_comprobante_id = tc.id
         LEFT JOIN proveedores p ON rc.proveedor_id = p.id
         LEFT JOIN formato_emisiones_detalles fed ON rc.formato_emisiones_detalles_id = fed.id
         LEFT JOIN clasificadores clf ON fed.clasificador_id = clf.id
         WHERE rc.rendicion_id = ?
         ORDER BY rc.creado_en ASC`,
        [rendicion_id]
      );

      return {
        ...rendicion,
        comprobantes: comprobantes,
        total_monto: comprobantes.reduce((sum, c) => sum + (c.monto || 0), 0),
      };
    } catch (error) {
      console.error('❌ Error en Rendicion.obtenerRendicionCompleta:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = Rendicion;
