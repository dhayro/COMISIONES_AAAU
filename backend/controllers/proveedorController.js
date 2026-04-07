const Proveedor = require('../models/Proveedor');

exports.listar = async (req, res) => {
  try {
    const { razon_social, tipo_documento } = req.query;
    const filtros = {};
    if (razon_social) filtros.razon_social = razon_social;
    if (tipo_documento) filtros.tipo_documento = tipo_documento;

    const proveedores = await Proveedor.listar(filtros);
    return res.json({ proveedores });
  } catch (error) {
    console.error('❌ Error listar Proveedor:', error);
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
    console.error('❌ Error crear Proveedor:', error);
    return res.status(500).json({ error: 'Error al crear proveedor', details: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Proveedor.obtenerPorId(id);
    if (!p) return res.status(404).json({ error: 'Proveedor no encontrado' });
    return res.json({ proveedor: p });
  } catch (error) {
    console.error('❌ Error obtener Proveedor:', error);
    return res.status(500).json({ error: 'Error al obtener proveedor', details: error.message });
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
    console.error('❌ Error actualizar Proveedor:', error);
    return res.status(500).json({ error: 'Error al actualizar proveedor', details: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await Proveedor.eliminar(id);
    return res.json({ success: true, message: 'Proveedor desactivado' });
  } catch (error) {
    console.error('❌ Error eliminar Proveedor:', error);
    return res.status(500).json({ error: 'Error al eliminar proveedor', details: error.message });
  }
};
