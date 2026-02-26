const { pool } = require('../config/database');

class Clasificador {
  static async listar() {
    try {
      const [clasificadores] = await pool.query(
        'SELECT * FROM clasificadores WHERE activo = 1 ORDER BY partida'
      );
      return clasificadores;
    } catch (error) {
      throw new Error(`Error al listar clasificadores: ${error.message}`);
    }
  }

  static async obtenerPorId(id) {
    try {
      const [clasificadores] = await pool.query(
        'SELECT * FROM clasificadores WHERE id = ? AND activo = 1',
        [id]
      );
      return clasificadores.length > 0 ? clasificadores[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener clasificador: ${error.message}`);
    }
  }

  static async obtenerPorPartida(partida) {
    try {
      const [clasificadores] = await pool.query(
        'SELECT * FROM clasificadores WHERE partida = ? AND activo = 1',
        [partida]
      );
      return clasificadores.length > 0 ? clasificadores[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener clasificador: ${error.message}`);
    }
  }

  static async crear(data) {
    const { partida, nombre, descripcion } = data;
    try {
      const [result] = await pool.query(
        'INSERT INTO clasificadores (partida, nombre, descripcion, activo) VALUES (?, ?, ?, 1)',
        [partida, nombre, descripcion]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear clasificador: ${error.message}`);
    }
  }

  static async actualizar(id, data) {
    const { partida, nombre, descripcion } = data;
    try {
      await pool.query(
        'UPDATE clasificadores SET partida = ?, nombre = ?, descripcion = ? WHERE id = ?',
        [partida, nombre, descripcion, id]
      );
      return true;
    } catch (error) {
      throw new Error(`Error al actualizar clasificador: ${error.message}`);
    }
  }

  static async eliminar(id) {
    try {
      const [result] = await pool.query(
        'UPDATE clasificadores SET activo = 0 WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar clasificador: ${error.message}`);
    }
  }
}

module.exports = Clasificador;
