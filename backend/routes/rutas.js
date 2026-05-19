/**
 * Rutas para gestionar rutas (viajes)
 */

const express = require('express');
const router = express.Router();
const {
  crearRuta,
  obtenerRutasPorFormato,
  obtenerRuta,
  actualizarRuta,
  eliminarRuta,
  eliminarRutasPorFormato
} = require('../controllers/rutasController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * POST /api/rutas - Crear una nueva ruta
 */
router.post('/', crearRuta);

/**
 * GET /api/rutas/formato/:formato_emision_id - Obtener rutas por formato
 */
router.get('/formato/:formato_emision_id', obtenerRutasPorFormato);

/**
 * GET /api/rutas/:id - Obtener una ruta por ID
 */
router.get('/:id', obtenerRuta);

/**
 * PUT /api/rutas/:id - Actualizar una ruta
 */
router.put('/:id', actualizarRuta);

/**
 * DELETE /api/rutas/:id - Eliminar una ruta
 */
router.delete('/:id', eliminarRuta);

/**
 * DELETE /api/rutas/formato/:formato_emision_id - Eliminar todas las rutas de un formato
 */
router.delete('/formato/:formato_emision_id', eliminarRutasPorFormato);

module.exports = router;
