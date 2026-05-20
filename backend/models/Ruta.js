/**
 * Modelo para gestionar rutas (viajes)
 */

const { pool } = require('../config/database');

// 🆕 Función auxiliar para convertir fechas a hora de Lima (UTC-5)
const convertirAHoraLima = (fecha) => {
  if (!fecha) return fecha;
  try {
    // Si es un objeto Date, convertir a string ISO
    if (fecha instanceof Date) {
      fecha = fecha.toISOString();
    }

    // Parsear fecha ISO: "2026-05-20T01:47:00.000Z"
    if (typeof fecha === 'string' && fecha.includes('T')) {
      const fechaUTC = new Date(fecha);
      const milisegundos5Horas = 5 * 60 * 60 * 1000;
      const fechaLima = new Date(fechaUTC.getTime() - milisegundos5Horas);

      // Formatear como: "2026-05-19 20:47:00"
      const año = fechaLima.getUTCFullYear();
      const mes = String(fechaLima.getUTCMonth() + 1).padStart(2, '0');
      const día = String(fechaLima.getUTCDate()).padStart(2, '0');
      const horas = String(fechaLima.getUTCHours()).padStart(2, '0');
      const minutos = String(fechaLima.getUTCMinutes()).padStart(2, '0');
      const segundos = String(fechaLima.getUTCSeconds()).padStart(2, '0');

      return `${año}-${mes}-${día} ${horas}:${minutos}:${segundos}`;
    }
    return fecha;
  } catch (error) {
    console.warn('⚠️ Error al convertir fecha a Lima:', error);
    return fecha;
  }
};

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

      // 🆕 Convertir fechas a hora de Lima
      return rutas.map(ruta => ({
        ...ruta,
        fecha_salida: convertirAHoraLima(ruta.fecha_salida),
        fecha_llegada: convertirAHoraLima(ruta.fecha_llegada),
        created_at: convertirAHoraLima(ruta.created_at),
        updated_at: convertirAHoraLima(ruta.updated_at)
      }));
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

      if (rutas.length === 0) return null;

      // 🆕 Convertir fechas a hora de Lima
      const ruta = rutas[0];
      return {
        ...ruta,
        fecha_salida: convertirAHoraLima(ruta.fecha_salida),
        fecha_llegada: convertirAHoraLima(ruta.fecha_llegada),
        created_at: convertirAHoraLima(ruta.created_at),
        updated_at: convertirAHoraLima(ruta.updated_at)
      };
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

      // 🆕 Convertir fechas a hora de Lima
      return (rows || []).map(ruta => ({
        ...ruta,
        fecha_salida: convertirAHoraLima(ruta.fecha_salida),
        fecha_llegada: convertirAHoraLima(ruta.fecha_llegada),
        created_at: convertirAHoraLima(ruta.created_at),
        updated_at: convertirAHoraLima(ruta.updated_at)
      }));
    } catch (error) {
      console.error('❌ Error al listar rutas por formato:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = Ruta;
