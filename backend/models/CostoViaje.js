const { pool } = require('../config/database');

class CostoViaje {
  static async listar() {
    try {
      const [costos] = await pool.query(
        'SELECT * FROM costos_viaje WHERE activo = 1 ORDER BY nombre'
      );
      return costos;
    } catch (error) {
      throw new Error(`Error al listar costos de viaje: ${error.message}`);
    }
  }

  static async obtenerPorId(id) {
    try {
      const [costos] = await pool.query(
        'SELECT * FROM costos_viaje WHERE id = ? AND activo = 1',
        [id]
      );
      return costos.length > 0 ? costos[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener costo de viaje: ${error.message}`);
    }
  }

  static async crear(data) {
    const { nombre, costo } = data;
    try {
      const [result] = await pool.query(
        'INSERT INTO costos_viaje (nombre, costo, activo) VALUES (?, ?, 1)',
        [nombre, costo]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear costo de viaje: ${error.message}`);
    }
  }

  static async actualizar(id, data) {
    const { nombre, costo } = data;
    try {
      const [result] = await pool.query(
        'UPDATE costos_viaje SET nombre = ?, costo = ? WHERE id = ?',
        [nombre, costo, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar costo de viaje: ${error.message}`);
    }
  }

  static async eliminar(id) {
    try {
      const [result] = await pool.query(
        'UPDATE costos_viaje SET activo = 0 WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar costo de viaje: ${error.message}`);
    }
  }
}

module.exports = CostoViaje;