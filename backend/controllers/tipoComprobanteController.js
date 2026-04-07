const TipoComprobante = require('../models/TipoComprobante');

exports.listar = async (req, res) => {
  try {
    const tipos = await TipoComprobante.listar(true);
    return res.json({ tipo_comprobantes: tipos });
  } catch (error) {
    console.error('❌ Error listar TipoComprobante:', error);
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
    console.error('❌ Error crear TipoComprobante:', error);
    return res.status(500).json({ error: 'Error al crear tipo de comprobante', details: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await TipoComprobante.obtenerPorId(id);
    if (!t) return res.status(404).json({ error: 'Tipo no encontrado' });
    return res.json({ tipo_comprobante: t });
  } catch (error) {
    console.error('❌ Error obtener TipoComprobante:', error);
    return res.status(500).json({ error: 'Error al obtener tipo', details: error.message });
  }
};
