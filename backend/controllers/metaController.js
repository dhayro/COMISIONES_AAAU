const Meta = require('../models/Meta');

exports.listar = async (req, res) => {
  try {
    const metas = await Meta.listar();
    res.json(metas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await Meta.obtenerPorId(id);

    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    res.json(meta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, numero_meta, periodo, ambito_id } = req.body;

    if (!nombre || !numero_meta || !periodo) {
      return res.status(400).json({ error: 'Nombre, número de meta y período son requeridos' });
    }

    const id = await Meta.crear({ nombre, numero_meta, periodo, ambito_id });
    const metaCreada = await Meta.obtenerPorId(id);

    res.status(201).json({
      mensaje: 'Meta creada exitosamente',
      meta: metaCreada,
    });
  } catch (error) {
    // Manejar error de clave única (duplicate entry)
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: `Ya existe una meta con el número ${req.body.numero_meta} para el período ${req.body.periodo}. El número de meta debe ser único dentro de cada período.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, numero_meta, periodo, ambito_id } = req.body;

    if (!nombre && !numero_meta && !periodo && ambito_id === undefined) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const metaActual = await Meta.obtenerPorId(id);
    if (!metaActual) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const datosActualizados = {
      nombre: nombre !== undefined ? nombre : metaActual.nombre,
      numero_meta: numero_meta !== undefined ? numero_meta : metaActual.numero_meta,
      periodo: periodo !== undefined ? periodo : metaActual.periodo,
      ambito_id: ambito_id !== undefined ? ambito_id : metaActual.ambito_id,
    };

    await Meta.actualizar(id, datosActualizados);

    const metaActualizada = await Meta.obtenerPorId(id);
    res.json({
      mensaje: 'Meta actualizada exitosamente',
      meta: metaActualizada,
    });
  } catch (error) {
    // Manejar error de clave única (duplicate entry)
    if (error.message && error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        error: `Ya existe una meta con el número ${req.body.numero_meta || req.params.numero_meta} para el período ${req.body.periodo}. El número de meta debe ser único dentro de cada período.`,
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await Meta.obtenerPorId(id);

    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const eliminada = await Meta.eliminar(id);

    if (eliminada) {
      res.json({ mensaje: 'Meta eliminada exitosamente' });
    } else {
      res.status(500).json({ error: 'No se pudo eliminar la meta' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
