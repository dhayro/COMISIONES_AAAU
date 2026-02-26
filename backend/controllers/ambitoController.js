const Ambito = require('../models/Ambito');

exports.listar = async (req, res) => {
  try {
    const ambitos = await Ambito.listar();
    res.json(ambitos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const ambito = await Ambito.obtenerPorId(id);

    if (!ambito) {
      return res.status(404).json({ error: 'Ámbito no encontrado' });
    }

    res.json(ambito);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarAAAs = async (req, res) => {
  try {
    const aaas = await Ambito.listarAAAs();
    res.json(aaas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarALAsPorAAA = async (req, res) => {
  try {
    const { aaa_id } = req.params;
    const alas = await Ambito.listarALAsPorAAA(aaa_id);
    res.json(alas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre_corto, nombre_largo, dependencia_id } = req.body;

    if (!nombre_corto || !nombre_largo) {
      return res.status(400).json({ error: 'Nombre corto y nombre largo son requeridos' });
    }

    const id = await Ambito.crear({
      nombre_corto,
      nombre_largo,
      dependencia_id
    });
    
    res.status(201).json({
      mensaje: 'Ámbito creado exitosamente',
      id,
      nombre_corto,
      nombre_largo,
      dependencia_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_corto, nombre_largo, dependencia_id } = req.body;

    if (!nombre_corto || !nombre_largo) {
      return res.status(400).json({ error: 'Nombre corto y nombre largo son requeridos' });
    }

    const ambitoExistente = await Ambito.obtenerPorId(id);
    if (!ambitoExistente) {
      return res.status(404).json({ error: 'Ámbito no encontrado' });
    }

    await Ambito.actualizar(id, {
      nombre_corto,
      nombre_largo,
      dependencia_id
    });

    res.json({
      mensaje: 'Ámbito actualizado exitosamente',
      id,
      nombre_corto,
      nombre_largo,
      dependencia_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el ámbito existe
    const ambitoExistente = await Ambito.obtenerPorId(id);
    if (!ambitoExistente) {
      return res.status(404).json({ error: 'Ámbito no encontrado' });
    }

    // Verificar si tiene ALAs dependientes
    const countALAs = await Ambito.verificarDependencias(id);
    if (countALAs > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar este ámbito porque tiene ${countALAs} ALA(s) asociada(s). Primero debe eliminar o reasignar las ALAs.`
      });
    }

    const eliminado = await Ambito.eliminar(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Ámbito no encontrado' });
    }

    res.json({ mensaje: 'Ámbito eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
