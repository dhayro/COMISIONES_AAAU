const express = require('express');
const rendicionesController = require('../controllers/rendicionesController');
const router = express.Router();

// Crear rendición
router.post('/crear', rendicionesController.crearRendicion);

// Listar
router.get('/listar', rendicionesController.listarRendiciones);

// Obtener
router.get('/:id', rendicionesController.obtenerRendicion);

// Actualizar
router.put('/:id', rendicionesController.actualizarRendicion);

// Eliminar
router.delete('/:id', rendicionesController.eliminarRendicion);

module.exports = router;
