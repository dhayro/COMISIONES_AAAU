const logger = require('../shared/logger');
const TipoComprobante = require('../models/TipoComprobante');
const { respuestaError500 } = require('../shared/errores');

exports.listar = async (req, res) => {
  try {
    const tipos = await TipoComprobante.listar(true);
    return res.json({ tipo_comprobantes: tipos });
  } catch (error) {
    logger.error('❌ Error listar TipoComprobante:', error);
    return res.status(500).json({ error: 'Error al listar tipos de comprobante' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const creado = await TipoComprobante.crear({ nombre, descripcion });
    return res.status(201).json({ success: true, tipo_comprobante: creado });
  } catch (error) {
    logger.error('❌ Error crear TipoComprobante:', error);
    return res.status(500).json(respuestaError500(error, 'Error al crear tipo de comprobante'));
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await TipoComprobante.obtenerPorId(id);
    if (!t) return res.status(404).json({ error: 'Tipo no encontrado' });
    return res.json({ tipo_comprobante: t });
  } catch (error) {
    logger.error('❌ Error obtener TipoComprobante:', error);
    return res.status(500).json(respuestaError500(error, 'Error al obtener tipo'));
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });

    const actualizado = await TipoComprobante.actualizar(id, { nombre, descripcion });
    if (!actualizado) return res.status(404).json({ error: 'Tipo no encontrado' });

    return res.json({ success: true, message: 'Tipo de comprobante actualizado correctamente' });
  } catch (error) {
    logger.error('❌ Error actualizar TipoComprobante:', error);
    return res.status(500).json(respuestaError500(error, 'Error al actualizar tipo de comprobante'));
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await TipoComprobante.eliminar(id);
    if (!eliminado) return res.status(404).json({ error: 'Tipo no encontrado' });

    return res.json({ success: true, message: 'Tipo de comprobante eliminado correctamente' });
  } catch (error) {
    logger.error('❌ Error eliminar TipoComprobante:', error);
    return res.status(500).json(respuestaError500(error, 'Error al eliminar tipo de comprobante'));
  }
};
