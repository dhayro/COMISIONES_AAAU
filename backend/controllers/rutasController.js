/**
 * Controlador para gestionar rutas (viajes)
 */

const Ruta = require('../models/Ruta');

/**
 * POST /api/rutas - Crear una nueva ruta
 */
const crearRuta = async (req, res) => {
  try {
    const { formato_emision_id, origen, fecha_salida, destino, fecha_llegada, proposito, kilometraje, observaciones } = req.body;

    // Validar campos obligatorios
    if (!formato_emision_id || !origen || !fecha_salida || !destino || !fecha_llegada) {
      return res.status(400).json({
        error: 'Los campos formato_emision_id, origen, fecha_salida, destino y fecha_llegada son obligatorios'
      });
    }

    const ruta = await Ruta.crear({
      formato_emision_id,
      origen,
      fecha_salida,
      destino,
      fecha_llegada,
      proposito,
      kilometraje,
      observaciones
    });

    console.log('✅ Ruta creada:', ruta);

    res.status(201).json({
      success: true,
      message: 'Ruta creada exitosamente',
      ruta
    });
  } catch (error) {
    console.error('❌ Error al crear ruta:', error);
    res.status(500).json({
      error: 'Error al crear ruta',
      details: error.message
    });
  }
};

/**
 * GET /api/rutas/formato/:formato_emision_id - Obtener rutas por formato
 */
const obtenerRutasPorFormato = async (req, res) => {
  try {
    const { formato_emision_id } = req.params;

    const rutas = await Ruta.obtenerPorFormato(formato_emision_id);

    res.json({
      success: true,
      cantidad: rutas.length,
      rutas
    });
  } catch (error) {
    console.error('❌ Error al obtener rutas:', error);
    res.status(500).json({
      error: 'Error al obtener rutas',
      details: error.message
    });
  }
};

/**
 * GET /api/rutas/:id - Obtener una ruta por ID
 */
const obtenerRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const ruta = await Ruta.obtenerPorId(id);

    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    res.json({
      success: true,
      ruta
    });
  } catch (error) {
    console.error('❌ Error al obtener ruta:', error);
    res.status(500).json({
      error: 'Error al obtener ruta',
      details: error.message
    });
  }
};

/**
 * PUT /api/rutas/:id - Actualizar una ruta
 */
const actualizarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { origen, fecha_salida, destino, fecha_llegada, proposito, kilometraje, observaciones } = req.body;

    const ruta = await Ruta.actualizar(id, {
      origen,
      fecha_salida,
      destino,
      fecha_llegada,
      proposito,
      kilometraje,
      observaciones
    });

    console.log('✅ Ruta actualizada:', ruta);

    res.json({
      success: true,
      message: 'Ruta actualizada exitosamente',
      ruta
    });
  } catch (error) {
    console.error('❌ Error al actualizar ruta:', error);
    res.status(500).json({
      error: 'Error al actualizar ruta',
      details: error.message
    });
  }
};

/**
 * DELETE /api/rutas/:id - Eliminar una ruta
 */
const eliminarRuta = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado = await Ruta.eliminar(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    console.log('✅ Ruta eliminada:', id);

    res.json({
      success: true,
      message: 'Ruta eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar ruta:', error);
    res.status(500).json({
      error: 'Error al eliminar ruta',
      details: error.message
    });
  }
};

/**
 * DELETE /api/rutas/formato/:formato_emision_id - Eliminar todas las rutas de un formato
 */
const eliminarRutasPorFormato = async (req, res) => {
  try {
    const { formato_emision_id } = req.params;

    const cantidad = await Ruta.eliminarPorFormato(formato_emision_id);

    console.log(`✅ ${cantidad} ruta(s) eliminada(s) del formato ${formato_emision_id}`);

    res.json({
      success: true,
      message: `${cantidad} ruta(s) eliminada(s)`,
      cantidad
    });
  } catch (error) {
    console.error('❌ Error al eliminar rutas:', error);
    res.status(500).json({
      error: 'Error al eliminar rutas',
      details: error.message
    });
  }
};

module.exports = {
  crearRuta,
  obtenerRutasPorFormato,
  obtenerRuta,
  actualizarRuta,
  eliminarRuta,
  eliminarRutasPorFormato
};
