const logger = require('../shared/logger');
const { pool } = require('../config/database');
const { respuestaError500 } = require('../shared/errores');

exports.listar = async (req, res) => {
  try {
    const [feriados] = await pool.query(
      "SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, descripcion FROM feriados ORDER BY fecha"
    );
    res.json({ feriados });
  } catch (error) {
    logger.error('❌ Error al listar feriados:', error.message);
    res.status(500).json(respuestaError500(error));
  }
};

exports.crear = async (req, res) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador puede modificar feriados' });
  }

  try {
    const { fecha, descripcion } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || !descripcion) {
      return res.status(400).json({ error: 'fecha (YYYY-MM-DD) y descripcion son requeridos' });
    }

    await pool.query('INSERT INTO feriados (fecha, descripcion) VALUES (?, ?)', [fecha, descripcion.trim()]);
    res.status(201).json({ success: true, fecha, descripcion: descripcion.trim() });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un feriado en esa fecha' });
    }
    logger.error('❌ Error al crear feriado:', error.message);
    res.status(500).json(respuestaError500(error));
  }
};

exports.eliminar = async (req, res) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador puede modificar feriados' });
  }

  try {
    const { fecha } = req.params;
    const [resultado] = await pool.query('DELETE FROM feriados WHERE fecha = ?', [fecha]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Feriado no encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('❌ Error al eliminar feriado:', error.message);
    res.status(500).json(respuestaError500(error));
  }
};
