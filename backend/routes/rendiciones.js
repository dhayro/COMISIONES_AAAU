const express = require('express');
const rendicionesController = require('../controllers/rendicionesController');
const router = express.Router();

// Crear rendición
router.post('/crear', rendicionesController.crearRendicion);

// Listar
router.get('/listar', rendicionesController.listarRendiciones);

// 🆕 Obtener rendiciones por formato_emision_id (ANTES de /:id para evitar conflicto)
router.get('/obtener-por-formato/:formato_emision_id', rendicionesController.obtenerPorFormato);

// Obtener
router.get('/:id', rendicionesController.obtenerRendicion);

// Actualizar
router.put('/:id', rendicionesController.actualizarRendicion);

// Eliminar
router.delete('/:id', rendicionesController.eliminarRendicion);

module.exports = router;
