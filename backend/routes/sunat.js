const express = require('express');
const sunatController = require('../controllers/sunatController');

const router = express.Router();

/**
 * 🔍 Rutas de validación de comprobantes en SUNAT
 */

// POST /api/sunat/test - Endpoint de prueba
router.post('/test', sunatController.testSunat);

// POST /api/sunat/validar-comprobante - Validar un comprobante específico
router.post('/validar-comprobante', sunatController.validarComprobanteEnSunat);

module.exports = router;
