const { pool } = require('../config/database');

class Ambito {
  static async listar() {
    try {
      const [ambitos] = await pool.query(
        `SELECT a.*, 
                COALESCE(dep.nombre_corto, 'Sin dependencia') as dependencia_nombre
         FROM ambitos a
         LEFT JOIN ambitos dep ON a.dependencia_id = dep.id
         WHERE a.activo = 1
         ORDER BY a.dependencia_id, a.nombre_corto`
      );
      return ambitos;
    } catch (error) {
      throw new Error(`Error al listar ámbitos: ${error.message}`);
    }
  }

  static async obtenerPorId(id) {
    try {
      const [ambitos] = await pool.query(
        `SELECT a.*, 
                COALESCE(dep.nombre_corto, 'Sin dependencia') as dependencia_nombre
         FROM ambitos a
         LEFT JOIN ambitos dep ON a.dependencia_id = dep.id
         WHERE a.id = ? AND a.activo = 1`,
        [id]
      );
      return ambitos.length > 0 ? ambitos[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener ámbito: ${error.message}`);
    }
  }

  static async listarAAAs() {
    try {
      const [ambitos] = await pool.query(
        'SELECT * FROM ambitos WHERE dependencia_id IS NULL AND activo = 1 ORDER BY nombre_corto'
      );
      return ambitos;
    } catch (error) {
      throw new Error(`Error al listar AAAs: ${error.message}`);
    }
  }

  static async listarALAsPorAAA(aaa_id) {
    try {
      const [ambitos] = await pool.query(
        'SELECT * FROM ambitos WHERE dependencia_id = ? AND activo = 1 ORDER BY nombre_corto',
        [aaa_id]
      );
      return ambitos;
    } catch (error) {
      throw new Error(`Error al listar ALAs: ${error.message}`);
    }
  }

  static async crear(data) {
    const { nombre_corto, nombre_largo, dependencia_id } = data;
    try {
      const [result] = await pool.query(
        `INSERT INTO ambitos (nombre_corto, nombre_largo, dependencia_id, activo) 
         VALUES (?, ?, ?, 1)`,
        [nombre_corto, nombre_largo, dependencia_id || null]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear ámbito: ${error.message}`);
    }
  }

  static async actualizar(id, data) {
    const { nombre_corto, nombre_largo, dependencia_id } = data;
    try {
      const [result] = await pool.query(
        `UPDATE ambitos 
         SET nombre_corto = ?, nombre_largo = ?, dependencia_id = ?
         WHERE id = ?`,
        [nombre_corto, nombre_largo, dependencia_id || null, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar ámbito: ${error.message}`);
    }
  }

  static async verificarDependencias(id) {
    try {
      const [alas] = await pool.query(
        'SELECT COUNT(*) as count FROM ambitos WHERE dependencia_id = ? AND activo = 1',
        [id]
      );
      return alas[0].count;
    } catch (error) {
      throw new Error(`Error al verificar dependencias: ${error.message}`);
    }
  }

  static async eliminar(id) {
    try {
      const [result] = await pool.query(
        'UPDATE ambitos SET activo = 0 WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar ámbito: ${error.message}`);
    }
  }
}

module.exports = Ambito;
