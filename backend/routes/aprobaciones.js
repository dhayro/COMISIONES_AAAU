const express = require('express');
const aprobacionController = require('../controllers/aprobacionController');
const auth = require('../middleware/auth');

const router = express.Router();

// Rutas protegidas con autenticación
router.use(auth);

// Obtener comisiones pendientes de aprobación
router.get('/pendientes', aprobacionController.obtenerPendientesAprobacion);

// Obtener historial de aprobaciones
router.get('/historial', aprobacionController.obtenerHistorialAprobaciones);

// Obtener estadísticas
router.get('/estadisticas', aprobacionController.obtenerEstadisticas);

// Aprobar comisión
router.put('/aprobar/:comisionId', aprobacionController.aprobarComision);

// Rechazar comisión
router.put('/rechazar/:comisionId', aprobacionController.rechazarComision);

module.exports = router;
