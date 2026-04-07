const express = require('express');
const router = express.Router();
const correlativoController = require('../controllers/correlativoControlController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/lista', correlativoController.listarControlesCorrelativo);

router.post('/generar/auto', correlativoController.generarCorrelativosAuto);

router.post('/resetear/ano', correlativoController.resetearCorrelativoAno);

router.get('/:usuarioId/proximo', correlativoController.obtenerProximoNumero);

router.post('/:usuarioId/:ano/incrementar', correlativoController.incrementarCorrelativo);

router.get('/:usuarioId/:ano', correlativoController.obtenerControlCorrelativo);

router.post('/', correlativoController.crearControlCorrelativo);

router.put('/:id', correlativoController.actualizarControlCorrelativo);

router.delete('/:id', correlativoController.eliminarControlCorrelativo);

module.exports = router;
