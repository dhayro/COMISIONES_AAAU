const express = require('express');
const { obtenerCertificadosPorMeta, obtenerCertificadoPorId, obtenerClasificadoresDeCertificacion } = require('../controllers/certificacionesController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/certificaciones-credito/por-meta/{metaId}:
 *   get:
 *     summary: Obtener certificados disponibles por META
 *     description: Retorna certificados ACTIVOS o EN_PROCESO para una META específica
 *     parameters:
 *       - in: path
 *         name: metaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la META
 *     responses:
 *       200:
 *         description: Lista de certificados disponibles
 *       404:
 *         description: META no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/por-meta/:metaId', obtenerCertificadosPorMeta);

/**
 * @swagger
 * /api/certificaciones-credito/{certificacionId}/clasificadores:
 *   get:
 *     summary: Obtener clasificadores de una certificación
 *     description: Retorna todos los clasificadores y su distribución de montos para una certificación específica
 *     parameters:
 *       - in: path
 *         name: certificacionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la certificación
 *     responses:
 *       200:
 *         description: Lista de clasificadores con montos
 *       404:
 *         description: Certificación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:certificacionId/clasificadores', obtenerClasificadoresDeCertificacion);

/**
 * @swagger
 * /api/certificaciones-credito/{id}:
 *   get:
 *     summary: Obtener certificado por ID
 *     description: Retorna certificado con sus detalles (clasificadores)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del certificado
 *     responses:
 *       200:
 *         description: Certificado con detalles
 *       404:
 *         description: Certificado no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', obtenerCertificadoPorId);

module.exports = router;
