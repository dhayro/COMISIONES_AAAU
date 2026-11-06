const logger = require('../shared/logger');
const Proveedor = require('../models/Proveedor');
const { respuestaError500 } = require('../shared/errores');

exports.listar = async (req, res) => {
  try {
    const { razon_social, tipo_documento } = req.query;
    const filtros = {};
    if (razon_social) filtros.razon_social = razon_social;
    if (tipo_documento) filtros.tipo_documento = tipo_documento;

    const proveedores = await Proveedor.listar(filtros);
    return res.json({ proveedores });
  } catch (error) {
    logger.error('❌ Error listar Proveedor:', error);
    return res.status(500).json({ error: 'Error al listar proveedores' });
  }
};

exports.crear = async (req, res) => {
  try {
    const {
      razon_social,
      ruc_dni,
      tipo_documento,
      direccion,
      telefono,
      email,
      contacto_nombre,
    } = req.body;

    if (!razon_social) {
      return res.status(400).json({ error: 'razon_social es requerido' });
    }

    if (ruc_dni) {
      const { pool } = require('../config/database');
      const [existentes] = await pool.query('SELECT id FROM proveedores WHERE ruc_dni = ? LIMIT 1', [ruc_dni]);
      if (existentes.length > 0) {
        return res.status(409).json({ error: `Ya existe un proveedor con RUC/DNI ${ruc_dni}` });
      }
    }

    const creado = await Proveedor.crear({
      razon_social,
      ruc_dni,
      tipo_documento,
      direccion,
      telefono,
      email,
      contacto_nombre,
    });

    return res.status(201).json({ success: true, proveedor: creado });
  } catch (error) {
    logger.error('❌ Error crear Proveedor:', error);
    return res.status(500).json(respuestaError500(error, 'Error al crear proveedor'));
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Proveedor.obtenerPorId(id);
    if (!p) return res.status(404).json({ error: 'Proveedor no encontrado' });
    return res.json({ proveedor: p });
  } catch (error) {
    logger.error('❌ Error obtener Proveedor:', error);
    return res.status(500).json(respuestaError500(error, 'Error al obtener proveedor'));
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    await Proveedor.actualizar(id, datos);
    const actualizado = await Proveedor.obtenerPorId(id);
    return res.json({ success: true, proveedor: actualizado });
  } catch (error) {
    logger.error('❌ Error actualizar Proveedor:', error);
    return res.status(500).json(respuestaError500(error, 'Error al actualizar proveedor'));
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await Proveedor.eliminar(id);
    return res.json({ success: true, message: 'Proveedor desactivado' });
  } catch (error) {
    logger.error('❌ Error eliminar Proveedor:', error);
    return res.status(500).json(respuestaError500(error, 'Error al eliminar proveedor'));
  }
};
