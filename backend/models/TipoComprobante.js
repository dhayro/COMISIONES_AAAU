const { pool } = require('../config/database');

class TipoComprobante {
  /**
   * 📝 Crear tipo de comprobante
   */
  static async crear(datos) {
    let connection;
    try {
      connection = await pool.getConnection();
      const { nombre, descripcion } = datos;

      const [result] = await connection.query(
        `INSERT INTO tipo_comprobante (nombre, descripcion, activo) 
         VALUES (?, ?, 1)`,
        [nombre, descripcion || null]
      );

      console.log(`✅ Tipo Comprobante creado: ${nombre}`);
      return { id: result.insertId, nombre, descripcion, activo: 1 };
    } catch (error) {
      console.error('❌ Error en TipoComprobante.crear:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔍 Obtener tipo por ID
   */
  static async obtenerPorId(id) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT * FROM tipo_comprobante WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en TipoComprobante.obtenerPorId:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 📋 Listar todos (activos)
   */
  static async listar(soloActivos = true) {
    let connection;
    try {
      connection = await pool.getConnection();

      let query = `SELECT * FROM tipo_comprobante`;
      if (soloActivos) {
        query += ` WHERE activo = 1`;
      }
      query += ` ORDER BY nombre`;

      const [rows] = await connection.query(query);
      return rows;
    } catch (error) {
      console.error('❌ Error en TipoComprobante.listar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ✏️ Actualizar
   */
  static async actualizar(id, datos) {
    let connection;
    try {
      connection = await pool.getConnection();
      const { nombre, descripcion, activo } = datos;

      let query = 'UPDATE tipo_comprobante SET ';
      const values = [];

      if (nombre !== undefined) {
        query += 'nombre = ?, ';
        values.push(nombre);
      }
      if (descripcion !== undefined) {
        query += 'descripcion = ?, ';
        values.push(descripcion);
      }
      if (activo !== undefined) {
        query += 'activo = ?, ';
        values.push(activo);
      }

      query += 'actualizado_en = CURRENT_TIMESTAMP WHERE id = ?';
      values.push(id);

      await connection.query(query, values);
      console.log(`✅ Tipo Comprobante ${id} actualizado`);
      return true;
    } catch (error) {
      console.error('❌ Error en TipoComprobante.actualizar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🗑️ Eliminar
   */
  static async eliminar(id) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query('DELETE FROM tipo_comprobante WHERE id = ?', [id]);
      console.log(`✅ Tipo Comprobante ${id} eliminado`);
      return true;
    } catch (error) {
      console.error('❌ Error en TipoComprobante.eliminar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = TipoComprobante;
