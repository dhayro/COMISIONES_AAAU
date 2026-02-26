const CostoViaje = require('../models/CostoViaje');

exports.listar = async (req, res) => {
  try {
    const costos = await CostoViaje.listar();
    res.json(costos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;
    const costo = await CostoViaje.obtenerPorId(id);

    if (!costo) {
      return res.status(404).json({ error: 'Costo de viaje no encontrado' });
    }

    res.json(costo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, costo } = req.body;

    if (!nombre || costo === undefined) {
      return res.status(400).json({ error: 'Nombre y costo son requeridos' });
    }

    const id = await CostoViaje.crear({ nombre, costo });
    res.status(201).json({
      mensaje: 'Costo de viaje creado exitosamente',
      id,
      nombre,
      costo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, costo } = req.body;

    if (!nombre || costo === undefined) {
      return res.status(400).json({ error: 'Nombre y costo son requeridos' });
    }

    const actualizado = await CostoViaje.actualizar(id, { nombre, costo });

    if (!actualizado) {
      return res.status(404).json({ error: 'Costo de viaje no encontrado' });
    }

    res.json({
      mensaje: 'Costo de viaje actualizado exitosamente',
      id,
      nombre,
      costo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await CostoViaje.eliminar(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Costo de viaje no encontrado' });
    }

    res.json({ mensaje: 'Costo de viaje eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};