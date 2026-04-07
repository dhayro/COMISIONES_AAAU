const { pool } = require('../config/database');

class ComprobanteDetalle {
  /**
   * 📝 Crear detalles de comprobante (para viáticos)
   */
  static async crearDetalles(comprobante_id, detalles) {
    let connection;
    try {
      connection = await pool.getConnection();

      const valoresMultiples = detalles.map((d) => [
        comprobante_id,
        d.tipo_viatitico,
        d.cantidad,
        d.descripcion || null,
      ]);

      // Insertar múltiples filas
      await connection.query(
        `INSERT INTO comprobante_detalles 
         (comprobante_id, tipo_viatitico, cantidad, descripcion) 
         VALUES ?`,
        [valoresMultiples]
      );

      console.log(`✅ ${detalles.length} detalles creados para comprobante ${comprobante_id}`);
      return detalles;
    } catch (error) {
      console.error('❌ Error en ComprobanteDetalle.crearDetalles:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🔍 Obtener detalles por comprobante
   */
  static async obtenerPorComprobante(comprobante_id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [rows] = await connection.query(
        `SELECT * FROM comprobante_detalles WHERE comprobante_id = ?`,
        [comprobante_id]
      );

      return rows;
    } catch (error) {
      console.error('❌ Error en ComprobanteDetalle.obtenerPorComprobante:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * ✏️ Actualizar detalles (elimina los viejos y crea nuevos)
   */
  static async actualizarDetalles(comprobante_id, detalles) {
    let connection;
    try {
      connection = await pool.getConnection();

      // Eliminar detalles anteriores
      await connection.query('DELETE FROM comprobante_detalles WHERE comprobante_id = ?', [
        comprobante_id,
      ]);

      // Crear nuevos
      if (detalles.length > 0) {
        await this.crearDetalles(comprobante_id, detalles);
      }

      console.log(`✅ Detalles actualizados para comprobante ${comprobante_id}`);
      return detalles;
    } catch (error) {
      console.error('❌ Error en ComprobanteDetalle.actualizarDetalles:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * 🗑️ Eliminar todos los detalles de un comprobante
   */
  static async eliminarPorComprobante(comprobante_id) {
    let connection;
    try {
      connection = await pool.getConnection();

      const [result] = await connection.query(
        'DELETE FROM comprobante_detalles WHERE comprobante_id = ?',
        [comprobante_id]
      );

      console.log(`✅ Detalles eliminados para comprobante ${comprobante_id}`);
      return result;
    } catch (error) {
      console.error('❌ Error en ComprobanteDetalle.eliminarPorComprobante:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = ComprobanteDetalle;
