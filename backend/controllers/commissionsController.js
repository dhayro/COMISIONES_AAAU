const { pool } = require('../config/database');

// Crear comisión
const crearComision = async (req, res) => {
  try {
    const {
      ambito,
      lugar,
      fecha_inicio,
      fecha_fin,
      comisionados,
      actividades,
      dias,
      costo_xdia,
      costo_pasajes_nacional,
      costo_pasajes_local,
      costo_combustible,
      costo_comision_por_comisionado,
      costo_total_comision,
      observacion
    } = req.body;

    if (!lugar || !fecha_inicio || !fecha_fin || !comisionados) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        `INSERT INTO comisiones (
          ambito, lugar, fecha_inicio, fecha_fin, comisionados, actividades,
          dias, costo_xdia, costo_pasajes_nacional, costo_pasajes_local,
          costo_combustible, costo_comision_por_comisionado,
          costo_total_comision, observacion, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ambito, lugar, fecha_inicio, fecha_fin, comisionados, actividades,
          dias || null, costo_xdia || null, costo_pasajes_nacional || null,
          costo_pasajes_local || null, costo_combustible || null,
          costo_comision_por_comisionado || null, costo_total_comision || null,
          observacion || null, req.user.id
        ]
      );

      return res.status(201).json({
        mensaje: 'Comisión creada exitosamente',
        comision_id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en crearComision:', error);
    return res.status(500).json({ error: 'Error al crear comisión' });
  }
};

// Obtener todas las comisiones del usuario
const obtenerComisiones = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [comisiones] = await connection.query(
        `SELECT * FROM comisiones WHERE usuario_id = ? ORDER BY creado_en DESC`,
        [req.user.id]
      );

      return res.status(200).json({ comisiones });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en obtenerComisiones:', error);
    return res.status(500).json({ error: 'Error al obtener comisiones' });
  }
};

// Obtener una comisión por ID
const obtenerComision = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      const [comisiones] = await connection.query(
        `SELECT * FROM comisiones WHERE id = ? AND usuario_id = ?`,
        [id, req.user.id]
      );

      if (comisiones.length === 0) {
        return res.status(404).json({ error: 'Comisión no encontrada' });
      }

      return res.status(200).json({ comision: comisiones[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en obtenerComision:', error);
    return res.status(500).json({ error: 'Error al obtener comisión' });
  }
};

// Actualizar comisión
const actualizarComision = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ambito,
      lugar,
      fecha_inicio,
      fecha_fin,
      comisionados,
      actividades,
      dias,
      costo_xdia,
      costo_pasajes_nacional,
      costo_pasajes_local,
      costo_combustible,
      costo_comision_por_comisionado,
      costo_total_comision,
      observacion
    } = req.body;

    const connection = await pool.getConnection();

    try {
      // Verificar que la comisión pertenece al usuario
      const [comisiones] = await connection.query(
        'SELECT id FROM comisiones WHERE id = ? AND usuario_id = ?',
        [id, req.user.id]
      );

      if (comisiones.length === 0) {
        return res.status(404).json({ error: 'Comisión no encontrada' });
      }

      // Actualizar
      await connection.query(
        `UPDATE comisiones SET
          ambito = ?, lugar = ?, fecha_inicio = ?, fecha_fin = ?,
          comisionados = ?, actividades = ?, dias = ?, costo_xdia = ?,
          costo_pasajes_nacional = ?, costo_pasajes_local = ?,
          costo_combustible = ?, costo_comision_por_comisionado = ?,
          costo_total_comision = ?, observacion = ?
        WHERE id = ? AND usuario_id = ?`,
        [
          ambito, lugar, fecha_inicio, fecha_fin, comisionados, actividades,
          dias, costo_xdia, costo_pasajes_nacional, costo_pasajes_local,
          costo_combustible, costo_comision_por_comisionado, costo_total_comision,
          observacion, id, req.user.id
        ]
      );

      return res.status(200).json({ mensaje: 'Comisión actualizada exitosamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en actualizarComision:', error);
    return res.status(500).json({ error: 'Error al actualizar comisión' });
  }
};

// Eliminar comisión
const eliminarComision = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'DELETE FROM comisiones WHERE id = ? AND usuario_id = ?',
        [id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Comisión no encontrada' });
      }

      return res.status(200).json({ mensaje: 'Comisión eliminada exitosamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error en eliminarComision:', error);
    return res.status(500).json({ error: 'Error al eliminar comisión' });
  }
};

module.exports = {
  crearComision,
  obtenerComisiones,
  obtenerComision,
  actualizarComision,
  eliminarComision
};
