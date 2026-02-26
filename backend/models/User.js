const { pool } = require('../config/database');

class User {
  static async listar() {
    try {
      const [users] = await pool.query(
        `SELECT 
          u.id, 
          u.nombre, 
          u.username, 
          u.email, 
          u.dni,
          u.rol, 
          u.ambito_id,
          a.nombre_corto as ambito_nombre,
          u.cargo_id,
          c.nombre as cargo_nombre,
          u.activo 
        FROM users u
        LEFT JOIN ambitos a ON u.ambito_id = a.id
        LEFT JOIN cargos c ON u.cargo_id = c.id
        ORDER BY u.nombre`
      );
      return users;
    } catch (error) {
      throw new Error(`Error al listar usuarios: ${error.message}`);
    }
  }

  static async obtenerActivos() {
    try {
      const [users] = await pool.query(
        `SELECT 
          u.id, 
          u.nombre, 
          u.username, 
          u.email, 
          u.dni,
          u.rol, 
          u.ambito_id,
          a.nombre_corto as ambito_nombre,
          u.cargo_id,
          c.nombre as cargo_nombre,
          u.activo 
        FROM users u
        LEFT JOIN ambitos a ON u.ambito_id = a.id
        LEFT JOIN cargos c ON u.cargo_id = c.id
        WHERE u.activo = 1
        ORDER BY u.nombre`
      );
      return users;
    } catch (error) {
      throw new Error(`Error al obtener usuarios activos: ${error.message}`);
    }
  }

  static async obtenerPorId(id) {
    try {
      const [users] = await pool.query(
        `SELECT 
          u.id, 
          u.nombre, 
          u.username, 
          u.email, 
          u.dni,
          u.rol, 
          u.ambito_id,
          a.nombre_corto as ambito_nombre,
          u.cargo_id,
          c.nombre as cargo_nombre,
          u.activo 
        FROM users u
        LEFT JOIN ambitos a ON u.ambito_id = a.id
        LEFT JOIN cargos c ON u.cargo_id = c.id
        WHERE u.id = ?`,
        [id]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  static async crear(datos) {
    try {
      const bcrypt = require('bcryptjs');
      const { nombre, username, email, rol, ambito_id, dni, cargo_id } = datos;
      const passwordPorDefecto = 'Autoridad1';
      const hashedPassword = await bcrypt.hash(passwordPorDefecto, 10);
      
      const [result] = await pool.query(
        'INSERT INTO users (nombre, username, email, password, dni, rol, ambito_id, cargo_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [nombre, username, email, hashedPassword, dni || null, rol || 'usuario', ambito_id || null, cargo_id || null]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  static async actualizar(id, datos) {
    try {
      const { nombre, username, email, rol, ambito_id, dni, cargo_id } = datos;
      const updates = [];
      const values = [];

      if (nombre !== undefined) {
        updates.push('nombre = ?');
        values.push(nombre);
      }
      if (username !== undefined) {
        updates.push('username = ?');
        values.push(username);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        values.push(email);
      }
      if (rol !== undefined) {
        updates.push('rol = ?');
        values.push(rol);
      }
      if (ambito_id !== undefined) {
        updates.push('ambito_id = ?');
        values.push(ambito_id || null);
      }
      if (dni !== undefined) {
        updates.push('dni = ?');
        values.push(dni || null);
      }
      if (cargo_id !== undefined) {
        updates.push('cargo_id = ?');
        values.push(cargo_id || null);
      }

      if (updates.length === 0) return null;

      values.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await pool.query(query, values);

      return await this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  static async toggleActivo(id, activo) {
    try {
      await pool.query(
        'UPDATE users SET activo = ? WHERE id = ?',
        [activo ? 1 : 0, id]
      );
      return await this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al toggle usuario: ${error.message}`);
    }
  }

  static async eliminar(id) {
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  static async resetearPassword(id) {
    try {
      const bcrypt = require('bcryptjs');
      const passwordPorDefecto = 'Autoridad1';
      const hashedPassword = await bcrypt.hash(passwordPorDefecto, 10);
      
      const [result] = await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al resetear contraseña: ${error.message}`);
    }
  }
}

module.exports = User;
