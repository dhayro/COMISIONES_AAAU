const { pool } = require('../config/database');

class Meta {
  static async listar() {
    try {
      const [metas] = await pool.query(
        `SELECT 
          m.id, 
          m.nombre, 
          m.numero_meta, 
          m.periodo, 
          m.ambito_id,
          a.nombre_corto as ambito_nombre,
          m.activo 
        FROM metas m
        LEFT JOIN ambitos a ON m.ambito_id = a.id
        WHERE m.activo = 1
        ORDER BY m.nombre`
      );
      return metas;
    } catch (error) {
      throw new Error(`Error al listar metas: ${error.message}`);
    }
  }

  static async obtenerPorId(id) {
    try {
      const [metas] = await pool.query(
        `SELECT 
          m.id, 
          m.nombre, 
          m.numero_meta, 
          m.periodo, 
          m.ambito_id,
          a.nombre_corto as ambito_nombre,
          m.activo 
        FROM metas m
        LEFT JOIN ambitos a ON m.ambito_id = a.id
        WHERE m.id = ?`,
        [id]
      );
      return metas.length > 0 ? metas[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener meta: ${error.message}`);
    }
  }

  static async crear(datos) {
    try {
      const { nombre, numero_meta, periodo, ambito_id } = datos;
      
      const [result] = await pool.query(
        'INSERT INTO metas (nombre, numero_meta, periodo, ambito_id, activo) VALUES (?, ?, ?, ?, 1)',
        [nombre, numero_meta, periodo, ambito_id || null]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear meta: ${error.message}`);
    }
  }

  static async actualizar(id, datos) {
    try {
      const { nombre, numero_meta, periodo, ambito_id } = datos;
      const updates = [];
      const values = [];

      if (nombre !== undefined) {
        updates.push('nombre = ?');
        values.push(nombre);
      }
      if (numero_meta !== undefined) {
        updates.push('numero_meta = ?');
        values.push(numero_meta);
      }
      if (periodo !== undefined) {
        updates.push('periodo = ?');
        values.push(periodo);
      }
      if (ambito_id !== undefined) {
        updates.push('ambito_id = ?');
        values.push(ambito_id || null);
      }

      if (updates.length === 0) return null;

      values.push(id);
      const query = `UPDATE metas SET ${updates.join(', ')} WHERE id = ?`;
      await pool.query(query, values);

      return await this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar meta: ${error.message}`);
    }
  }

  static async eliminar(id) {
    try {
      const [result] = await pool.query(
        'UPDATE metas SET activo = 0 WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar meta: ${error.message}`);
    }
  }
}

module.exports = Meta;
