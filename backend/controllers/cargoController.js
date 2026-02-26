const { pool } = require('../config/database');

/**
 * @class CargoController
 * @description Controlador para gestión de cargos
 */

// Obtener todos los cargos
const obtenerCargos = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [cargos] = await connection.query(
        'SELECT id, nombre, activo FROM cargos ORDER BY nombre'
      );
      res.status(200).json(cargos);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un cargo por ID
const obtenerCargoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      const [cargo] = await connection.query(
        'SELECT id, nombre, activo FROM cargos WHERE id = ?',
        [id]
      );

      if (cargo.length === 0) {
        return res.status(404).json({ error: 'Cargo no encontrado' });
      }

      res.status(200).json(cargo[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear nuevo cargo
const crearCargo = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const connection = await pool.getConnection();
    try {
      // Verificar que no exista otro con el mismo nombre
      const [existente] = await connection.query(
        'SELECT id FROM cargos WHERE LOWER(nombre) = LOWER(?)',
        [nombre.trim()]
      );

      if (existente.length > 0) {
        return res.status(400).json({
          error: `Ya existe un cargo con el nombre ${nombre}. El nombre debe ser único.`,
        });
      }

      const result = await connection.query(
        'INSERT INTO cargos (nombre, activo) VALUES (?, 1)',
        [nombre.trim()]
      );

      res.status(201).json({
        id: result[0].insertId,
        nombre: nombre.trim(),
        activo: 1,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: `Ya existe un cargo con este nombre. El nombre debe ser único.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Actualizar cargo
const actualizarCargo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const connection = await pool.getConnection();
    try {
      // Verificar que el cargo exista
      const [cargoExistente] = await connection.query(
        'SELECT id FROM cargos WHERE id = ?',
        [id]
      );

      if (cargoExistente.length === 0) {
        return res.status(404).json({ error: 'Cargo no encontrado' });
      }

      // Verificar que no exista otro con el mismo nombre
      const [duplicado] = await connection.query(
        'SELECT id FROM cargos WHERE LOWER(nombre) = LOWER(?) AND id != ?',
        [nombre.trim(), id]
      );

      if (duplicado.length > 0) {
        return res.status(400).json({
          error: `Ya existe otro cargo con el nombre ${nombre}. El nombre debe ser único.`,
        });
      }

      await connection.query(
        'UPDATE cargos SET nombre = ?, activo = ? WHERE id = ?',
        [nombre.trim(), activo !== false ? 1 : 0, id]
      );

      res.status(200).json({
        id: parseInt(id),
        nombre: nombre.trim(),
        activo: activo !== false ? 1 : 0,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: `Ya existe un cargo con este nombre. El nombre debe ser único.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Eliminar cargo
const eliminarCargo = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    try {
      // Verificar que el cargo exista
      const [cargoExistente] = await connection.query(
        'SELECT id FROM cargos WHERE id = ?',
        [id]
      );

      if (cargoExistente.length === 0) {
        return res.status(404).json({ error: 'Cargo no encontrado' });
      }

      await connection.query('DELETE FROM cargos WHERE id = ?', [id]);

      res.status(200).json({ mensaje: 'Cargo eliminado correctamente' });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.message && error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        error: 'No se puede eliminar el cargo porque está siendo utilizado en otras tablas',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerCargos,
  obtenerCargoPorId,
  crearCargo,
  actualizarCargo,
  eliminarCargo,
};
