const express = require('express');
const comprobantesController = require('../controllers/comprobantesController');

const router = express.Router();

/**
 * 📦 Rutas de Comprobantes y Rendición
 */

// ✅ POST - Crear nuevo comprobante
router.post('/crear', comprobantesController.crearComprobante);

// 📋 GET - Listar comprobantes (con filtros opcionales)
router.get('/listar', comprobantesController.listarComprobantes);

// 🔍 GET - Obtener un comprobante específico
router.get('/:id', comprobantesController.obtenerComprobante);

// ✏️ PUT - Actualizar comprobante
router.put('/:id', comprobantesController.actualizarComprobante);

// 🗑️ DELETE - Eliminar comprobante
router.delete('/:id', comprobantesController.eliminarComprobante);

// 📊 GET - Obtener estadísticas por formato
router.get('/estadisticas/:formato_emision_id', comprobantesController.obtenerEstadisticas);

module.exports = router;
