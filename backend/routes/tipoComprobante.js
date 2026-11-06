const express = require('express');
const tipoComprobanteController = require('../controllers/tipoComprobanteController');
const router = express.Router();

// Listar todos los tipos de comprobante
router.get('/listar', tipoComprobanteController.listar);

// Obtener tipo por ID
router.get('/:id', tipoComprobanteController.obtener);

// Crear tipo de comprobante
router.post('/crear', tipoComprobanteController.crear);

// 🆕 Actualizar tipo de comprobante
router.put('/:id', tipoComprobanteController.actualizar);

// 🆕 Eliminar tipo de comprobante
router.delete('/:id', tipoComprobanteController.eliminar);

module.exports = router;
