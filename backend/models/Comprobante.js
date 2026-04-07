const { pool } = require('../config/database');

class Comprobante {
  /**
   * 📝 Crear nuevo comprobante
   */
  static async crear(datos) {
    let connection;
    try {
      connection = await pool.getConnection();

      const {
        formato_emision_id,
        numero_comprobante,
        tipo_comprobante,
        fecha_comprobante,
        proveedor_razon_social,
        proveedor_ruc_dni,
        monto,
      } = datos;

      const [result] = await connection.query(
        `INSERT INTO comprobantes 
         (formato_emision_id, numero_comprobante, tipo_comprobante, fecha_comprobante, 
          proveedor_razon_social, proveedor_ruc_dni, monto, estado_rendicion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
        [
          formato_emision_id,
          numero_comprobante,
          tipo_comprobante,
          fecha_comprobante,
          proveedor_razon_social,
          proveedor_ruc_dni,
          monto,
        ]
      );

      console.log(`✅ Comprobante creado: ID ${result.insertId}`);
      return { id: result.insertId, ...datos, estado_rendicion: 'PENDIENTE' };
    } catch (error) {
      console.error('❌ Error en Comprobante.crear:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔍 Obtener comprobante por ID
   */
  static async obtenerPorId(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [rows] = await connection.query(
        `SELECT * FROM comprobantes WHERE id = ?`,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en Comprobante.obtenerPorId:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 📋 Listar comprobantes (con filtros opcionales)
   */
  static async listar(filtros = {}) {
    let connection;
    try {
      connection = await pool.getConnection();

      let query = `SELECT * FROM comprobantes WHERE 1=1`;
      const params = [];

      if (filtros.formato_emision_id) {
        query += ` AND formato_emision_id = ?`;
        params.push(filtros.formato_emision_id);
      }

      if (filtros.estado_rendicion) {
        query += ` AND estado_rendicion = ?`;
        params.push(filtros.estado_rendicion);
      }

      if (filtros.tipo_comprobante) {
        query += ` AND tipo_comprobante = ?`;
        params.push(filtros.tipo_comprobante);
      }

      query += ` ORDER BY creado_en DESC`;

      const [rows] = await connection.query(query, params);
      return rows;
    } catch (error) {
      console.error('❌ Error en Comprobante.listar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ✏️ Actualizar comprobante
   */
  static async actualizar(id, datos) {
    let connection;
    try {
      connection = await pool.getConnection();

      const actualizables = [
        'numero_comprobante',
        'tipo_comprobante',
        'fecha_comprobante',
        'proveedor_razon_social',
        'proveedor_ruc_dni',
        'monto',
        'estado_rendicion',
        'observacion_rechazo',
      ];

      let query = 'UPDATE comprobantes SET ';
      const values = [];

      Object.keys(datos).forEach((key) => {
        if (actualizables.includes(key)) {
          query += `${key} = ?, `;
          values.push(datos[key]);
        }
      });

      query += `actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`;
      values.push(id);

      const [result] = await connection.query(query, values);

      console.log(`✅ Comprobante ${id} actualizado`);
      return result;
    } catch (error) {
      console.error('❌ Error en Comprobante.actualizar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🗑️ Eliminar comprobante (y sus detalles)
   */
  static async eliminar(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      // Primero eliminar detalles
      await connection.query('DELETE FROM comprobante_detalles WHERE comprobante_id = ?', [id]);

      // Luego eliminar comprobante
      const [result] = await connection.query(
        'DELETE FROM comprobantes WHERE id = ?',
        [id]
      );

      console.log(`✅ Comprobante ${id} eliminado`);
      return result;
    } catch (error) {
      console.error('❌ Error en Comprobante.eliminar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔄 Obtener comprobantes con sus detalles
   */
  static async obtenerConDetalles(id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const comprobante = await this.obtenerPorId(id);
      if (!comprobante) return null;

      const [detalles] = await connection.query(
        `SELECT * FROM comprobante_detalles WHERE comprobante_id = ?`,
        [id]
      );

      return {
        ...comprobante,
        detalles,
      };
    } catch (error) {
      console.error('❌ Error en Comprobante.obtenerConDetalles:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = Comprobante;
