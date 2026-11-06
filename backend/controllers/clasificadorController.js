const logger = require('../shared/logger');
const Clasificador = require('../models/Clasificador');
const { respuestaError500 } = require('../shared/errores');

exports.listar = async (req, res) => {
  try {
    const clasificadores = await Clasificador.listar();
    res.json(clasificadores);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const clasificador = await Clasificador.obtenerPorId(id);

    if (!clasificador) {
      return res.status(404).json({ error: 'Clasificador no encontrado' });
    }

    res.json(clasificador);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.crear = async (req, res) => {
  try {
    const { partida, nombre, descripcion } = req.body;

    if (!partida || !nombre) {
      return res.status(400).json({ error: 'Partida y nombre son requeridos' });
    }

    const id = await Clasificador.crear({ partida, nombre, descripcion });
    res.status(201).json({
      mensaje: 'Clasificador creado exitosamente',
      id,
      partida,
      nombre,
      descripcion
    });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { partida, nombre, descripcion } = req.body;

    logger.info('📝 Actualizando clasificador ID:', id);
    logger.info('📋 Datos recibidos:', { partida, nombre, descripcion });

    // Validar que al menos un campo se proporcione
    if (!partida && !nombre) {
      return res.status(400).json({ error: 'Debe proporcionar al menos partida o nombre' });
    }

    // Obtener clasificador actual para merge de datos
    const clasificadorActual = await Clasificador.obtenerPorId(id);
    if (!clasificadorActual) {
      logger.info('❌ Clasificador no encontrado con ID:', id);
      return res.status(404).json({ error: 'Clasificador no encontrado' });
    }

    // Usar valores nuevos o mantener los existentes
    const datosActualizados = {
      partida: partida || clasificadorActual.partida,
      nombre: nombre || clasificadorActual.nombre,
      descripcion: descripcion !== undefined ? descripcion : clasificadorActual.descripcion
    };

    logger.info('✏️ Datos a actualizar:', datosActualizados);

    await Clasificador.actualizar(id, datosActualizados);

    logger.info('✅ Clasificador actualizado exitosamente');

    res.json({ 
      mensaje: 'Clasificador actualizado exitosamente',
      clasificador: datosActualizados
    });
  } catch (error) {
    logger.error('❌ Error al actualizar:', error.message);
    res.status(500).json(respuestaError500(error));
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Clasificador.eliminar(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Clasificador no encontrado' });
    }

    res.json({ mensaje: 'Clasificador eliminado exitosamente' });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};
