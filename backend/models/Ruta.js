/**
 * Modelo para gestionar rutas (viajes)
 */

const { pool } = require('../config/database');

class Ruta {
  /**
   * Crear una nueva ruta
   */
  static async crear(datos) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const {
        formato_emision_id,
        origen,
        fecha_salida,
        destino,
        fecha_llegada,
        proposito = null,
        kilometraje = null,
        observaciones = null
      } = datos;

      const sql = `
        INSERT INTO rutas (
          formato_emision_id,
          origen,
          fecha_salida,
          destino,
          fecha_llegada,
          proposito,
          kilometraje,
          observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.query(sql, [
        formato_emision_id,
        origen,
        fecha_salida,
        destino,
        fecha_llegada,
        proposito,
        kilometraje,
        observaciones
      ]);

      return {
        id: result.insertId,
        ...datos,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error('❌ Error al crear ruta:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Obtener todas las rutas de un formato
   */
  static async obtenerPorFormato(formato_emision_id) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const sql = `
        SELECT * FROM rutas 
        WHERE formato_emision_id = ? 
        ORDER BY fecha_salida DESC
      `;

      const [rutas] = await connection.query(sql, [formato_emision_id]);
      return rutas;
    } catch (error) {
      console.error('❌ Error al obtener rutas:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Obtener una ruta por ID
   */
  static async obtenerPorId(id) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const sql = `SELECT * FROM rutas WHERE id = ?`;
      const [rutas] = await connection.query(sql, [id]);
      
      return rutas.length > 0 ? rutas[0] : null;
    } catch (error) {
      console.error('❌ Error al obtener ruta:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Actualizar una ruta
   */
  static async actualizar(id, datos) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const campos = Object.keys(datos)
        .filter(key => key !== 'id' && key !== 'created_at')
        .map(key => `${key} = ?`);
      
      const valores = Object.values(datos).filter((_, index) => {
        const key = Object.keys(datos)[index];
        return key !== 'id' && key !== 'created_at';
      });

      if (campos.length === 0) return { id };

      const sql = `UPDATE rutas SET ${campos.join(', ')} WHERE id = ?`;
      
      await connection.query(sql, [...valores, id]);

      return { id, ...datos, updated_at: new Date() };
    } catch (error) {
      console.error('❌ Error al actualizar ruta:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Eliminar una ruta
   */
  static async eliminar(id) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const sql = `DELETE FROM rutas WHERE id = ?`;
      const [result] = await connection.query(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al eliminar ruta:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Eliminar todas las rutas de un formato
   */
  static async eliminarPorFormato(formato_emision_id) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const sql = `DELETE FROM rutas WHERE formato_emision_id = ?`;
      const [result] = await connection.query(sql, [formato_emision_id]);
      
      return result.affectedRows;
    } catch (error) {
      console.error('❌ Error al eliminar rutas por formato:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Listar todas las rutas de un formato
   */
  static async listarPorFormato(formato_emision_id) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const sql = `
        SELECT 
          id,
          formato_emision_id,
          origen,
          fecha_salida,
          destino,
          fecha_llegada,
          proposito,
          kilometraje,
          observaciones,
          created_at,
          updated_at
        FROM rutas 
        WHERE formato_emision_id = ?
        ORDER BY fecha_salida ASC
      `;
      
      const [rows] = await connection.query(sql, [formato_emision_id]);
      
      return rows || [];
    } catch (error) {
      console.error('❌ Error al listar rutas por formato:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = Ruta;
