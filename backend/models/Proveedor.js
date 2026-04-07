const { pool } = require('../config/database');

class Proveedor {
  /**
   * 📝 Crear proveedor
   */
  static async crear(datos) {
    let connection;
    try {
      connection = await pool.getConnection();
      const {
        razon_social,
        ruc_dni,
        tipo_documento,
        direccion,
        telefono,
        email,
        contacto_nombre,
      } = datos;

      const [result] = await connection.query(
        `INSERT INTO proveedores 
         (razon_social, ruc_dni, tipo_documento, direccion, telefono, email, contacto_nombre, activo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [razon_social, ruc_dni, tipo_documento, direccion || null, telefono || null, email || null, contacto_nombre || null]
      );

      console.log(`✅ Proveedor creado: ${razon_social} (${ruc_dni})`);
      return { id: result.insertId, ...datos, activo: 1 };
    } catch (error) {
      console.error('❌ Error en Proveedor.crear:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔍 Obtener proveedor por ID
   */
  static async obtenerPorId(id) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT * FROM proveedores WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en Proveedor.obtenerPorId:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔍 Obtener por RUC/DNI
   */
  static async obtenerPorRucDni(ruc_dni) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(
        `SELECT * FROM proveedores WHERE ruc_dni = ?`,
        [ruc_dni]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error en Proveedor.obtenerPorRucDni:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 📋 Listar (con filtros opcionales)
   */
  static async listar(filtros = {}) {
    let connection;
    try {
      connection = await pool.getConnection();

      let query = `SELECT * FROM proveedores WHERE 1=1`;
      const params = [];

      if (filtros.soloActivos !== false) {
        query += ` AND activo = 1`;
      }

      if (filtros.razon_social) {
        query += ` AND razon_social LIKE ?`;
        params.push(`%${filtros.razon_social}%`);
      }

      if (filtros.tipo_documento) {
        query += ` AND tipo_documento = ?`;
        params.push(filtros.tipo_documento);
      }

      query += ` ORDER BY razon_social`;

      const [rows] = await connection.query(query, params);
      return rows;
    } catch (error) {
      console.error('❌ Error en Proveedor.listar:', error);
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

      const actualizables = [
        'razon_social',
        'ruc_dni',
        'tipo_documento',
        'direccion',
        'telefono',
        'email',
        'contacto_nombre',
        'activo',
      ];

      let query = 'UPDATE proveedores SET ';
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
      console.log(`✅ Proveedor ${id} actualizado`);
      return true;
    } catch (error) {
      console.error('❌ Error en Proveedor.actualizar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🗑️ Eliminar (soft delete)
   */
  static async eliminar(id) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query('UPDATE proveedores SET activo = 0 WHERE id = ?', [id]);
      console.log(`✅ Proveedor ${id} desactivado`);
      return true;
    } catch (error) {
      console.error('❌ Error en Proveedor.eliminar:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = Proveedor;
