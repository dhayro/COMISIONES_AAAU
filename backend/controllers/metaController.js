const logger = require('../shared/logger');
const Meta = require('../models/Meta');
const { respuestaError500 } = require('../shared/errores');

exports.listar = async (req, res) => {
  try {
    const rol = req.user?.rol;  // 🆕 Obtener rol del usuario
    const userAmbitoId = req.user?.ambito_id;  // 🆕 Obtener ambito_id del usuario

    logger.info(`📍 LISTAR METAS - Rol: ${rol}, Ámbito: ${userAmbitoId}`);

    let metas;
    
    // 🆕 Filtrar según el rol
    if (rol === 'admin') {
      // ADMIN: Ve todas las metas
      logger.info(`🔐 Rol ADMIN: mostrando todas las metas`);
      metas = await Meta.listar();
    } else if ((rol === 'administrativo' || rol === 'jefe') && userAmbitoId) {
      // 🆕 ADMINISTRATIVO y JEFE: Ver solo metas de su ámbito
      logger.info(`🔐 Rol ${rol}: mostrando solo metas del ámbito ${userAmbitoId}`);
      metas = await Meta.listarPorAmbito(userAmbitoId);
    } else if (rol === 'usuario' && userAmbitoId) {
      // 🆕 USUARIO: Ver solo metas de su ámbito
      logger.info(`🔐 Rol usuario: mostrando solo metas del ámbito ${userAmbitoId}`);
      metas = await Meta.listarPorAmbito(userAmbitoId);
    } else {
      // 🆕 Sin rol o sin ambito_id: No mostrar nada
      logger.info(`⚠️  Sin rol o sin ambito_id: devolviendo array vacío`);
      metas = [];
    }

    logger.info(`✅ Metas a mostrar: ${metas.length}`);
    res.json(metas);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

// 🆕 Listar metas por ámbito - para usuarios administrativos
exports.listarPorAmbito = async (req, res) => {
  try {
    const { ambitoId } = req.params;
    
    if (!ambitoId) {
      return res.status(400).json({ error: 'ambitoId es requerido' });
    }
    
    logger.info(`🔐 Listando metas para ámbito ${ambitoId}`);
    const metas = await Meta.listarPorAmbito(ambitoId);
    logger.info(`✅ Metas encontradas: ${metas.length}`);
    
    res.json(metas);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
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
    res.status(500).json(respuestaError500(error));
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
    res.status(500).json(respuestaError500(error));
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
    res.status(500).json(respuestaError500(error));
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
    res.status(500).json(respuestaError500(error));
  }
};
