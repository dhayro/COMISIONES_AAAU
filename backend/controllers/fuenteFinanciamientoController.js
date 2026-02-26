const { pool } = require('../config/database');

/**
 * @class FuenteFinanciamientoController
 * @description Controlador para gestión de fuentes de financiamiento
 */

// Obtener todas las fuentes de financiamiento
const obtenerFuentes = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [fuentes] = await connection.query(
        'SELECT id, nombre, abreviatura, descripcion, activo FROM fuentes_financiamiento ORDER BY nombre'
      );
      res.status(200).json(fuentes);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una fuente por ID
const obtenerFuentePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [fuente] = await connection.query(
        'SELECT id, nombre, abreviatura, descripcion, activo FROM fuentes_financiamiento WHERE id = ?',
        [id]
      );

      if (fuente.length === 0) {
        return res.status(404).json({ error: 'Fuente de financiamiento no encontrada' });
      }

      res.status(200).json(fuente[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear nueva fuente de financiamiento
const crearFuente = async (req, res) => {
  try {
    const { nombre, abreviatura, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!abreviatura || !abreviatura.trim()) {
      return res.status(400).json({ error: 'La abreviatura es requerida' });
    }

    const connection = await pool.getConnection();
    try {
      // Verificar que no exista otra con la misma abreviatura
      const [existente] = await connection.query(
        'SELECT id FROM fuentes_financiamiento WHERE abreviatura = ?',
        [abreviatura.toUpperCase()]
      );

      if (existente.length > 0) {
        return res.status(400).json({
          error: `Ya existe una fuente con la abreviatura ${abreviatura}. La abreviatura debe ser única.`,
        });
      }

      const result = await connection.query(
        'INSERT INTO fuentes_financiamiento (nombre, abreviatura, descripcion, activo) VALUES (?, ?, ?, 1)',
        [nombre.trim(), abreviatura.toUpperCase().trim(), descripcion?.trim() || null]
      );

      res.status(201).json({
        id: result[0].insertId,
        nombre: nombre.trim(),
        abreviatura: abreviatura.toUpperCase().trim(),
        descripcion: descripcion?.trim() || null,
        activo: 1,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: `Ya existe una fuente con estos datos. El nombre y la abreviatura deben ser únicos.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Actualizar fuente de financiamiento
const actualizarFuente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, abreviatura, descripcion, activo } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!abreviatura || !abreviatura.trim()) {
      return res.status(400).json({ error: 'La abreviatura es requerida' });
    }

    const connection = await pool.getConnection();
    try {
      // Verificar que la fuente exista
      const [fuenteExistente] = await connection.query(
        'SELECT id FROM fuentes_financiamiento WHERE id = ?',
        [id]
      );

      if (fuenteExistente.length === 0) {
        return res.status(404).json({ error: 'Fuente de financiamiento no encontrada' });
      }

      // Verificar que no exista otra con la misma abreviatura
      const [duplicada] = await connection.query(
        'SELECT id FROM fuentes_financiamiento WHERE abreviatura = ? AND id != ?',
        [abreviatura.toUpperCase(), id]
      );

      if (duplicada.length > 0) {
        return res.status(400).json({
          error: `Ya existe otra fuente con la abreviatura ${abreviatura}. La abreviatura debe ser única.`,
        });
      }

      await connection.query(
        'UPDATE fuentes_financiamiento SET nombre = ?, abreviatura = ?, descripcion = ?, activo = ? WHERE id = ?',
        [nombre.trim(), abreviatura.toUpperCase().trim(), descripcion?.trim() || null, activo !== false ? 1 : 0, id]
      );

      res.status(200).json({
        id: parseInt(id),
        nombre: nombre.trim(),
        abreviatura: abreviatura.toUpperCase().trim(),
        descripcion: descripcion?.trim() || null,
        activo: activo !== false ? 1 : 0,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: `Ya existe una fuente con estos datos. El nombre y la abreviatura deben ser únicos.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Eliminar fuente de financiamiento
const eliminarFuente = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    try {
      // Verificar que la fuente exista
      const [fuenteExistente] = await connection.query(
        'SELECT id FROM fuentes_financiamiento WHERE id = ?',
        [id]
      );

      if (fuenteExistente.length === 0) {
        return res.status(404).json({ error: 'Fuente de financiamiento no encontrada' });
      }

      await connection.query('DELETE FROM fuentes_financiamiento WHERE id = ?', [id]);

      res.status(200).json({ mensaje: 'Fuente de financiamiento eliminada correctamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.message && error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        error: 'No se puede eliminar la fuente porque está siendo utilizada en otras tablas',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerFuentes,
  obtenerFuentePorId,
  crearFuente,
  actualizarFuente,
  eliminarFuente,
};
