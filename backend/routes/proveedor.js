const express = require('express');
const proveedorController = require('../controllers/proveedorController');
const router = express.Router();

// Listar proveedores
router.get('/listar', proveedorController.listar);

// Obtener proveedor por ID
router.get('/:id', proveedorController.obtener);

// Crear proveedor
router.post('/crear', proveedorController.crear);

// Actualizar proveedor
router.put('/:id', proveedorController.actualizar);

// Eliminar (desactivar) proveedor
router.delete('/:id', proveedorController.eliminar);

module.exports = router;
