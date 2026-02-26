const express = require('express');
const router = express.Router();
const commissionsController = require('../controllers/commissionsController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas de comisiones requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /comisiones:
 *   post:
 *     summary: Crear nueva comisión
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lugar
 *               - fecha_inicio
 *               - fecha_fin
 *               - comisionados
 *             properties:
 *               ambito:
 *                 type: string
 *                 example: Local
 *               lugar:
 *                 type: string
 *                 example: Lima
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-10
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-15
 *               comisionados:
 *                 type: string
 *                 example: Juan Pérez, María García
 *               actividades:
 *                 type: string
 *                 example: Inspección de obras
 *               dias:
 *                 type: integer
 *                 example: 5
 *               costo_xdia:
 *                 type: number
 *                 example: 220
 *               costo_pasajes_nacional:
 *                 type: number
 *                 example: 500
 *               costo_pasajes_local:
 *                 type: number
 *                 example: 100
 *               costo_combustible:
 *                 type: number
 *                 example: 150
 *               costo_comision_por_comisionado:
 *                 type: number
 *                 example: 1300
 *               costo_total_comision:
 *                 type: number
 *                 example: 2600
 *               observacion:
 *                 type: string
 *                 example: Sin observaciones
 *     responses:
 *       201:
 *         description: Comisión creada exitosamente
 *       400:
 *         description: Faltan campos requeridos
 *       500:
 *         description: Error del servidor
 */
router.post('/', commissionsController.crearComision);

/**
 * @swagger
 * /comisiones:
 *   get:
 *     summary: Obtener todas las comisiones del usuario
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comisiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comisiones:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comision'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/', commissionsController.obtenerComisiones);

/**
 * @swagger
 * /comisiones/{id}:
 *   get:
 *     summary: Obtener una comisión por ID
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión
 *     responses:
 *       200:
 *         description: Comisión encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comision:
 *                   $ref: '#/components/schemas/Comision'
 *       404:
 *         description: Comisión no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', commissionsController.obtenerComision);

/**
 * @swagger
 * /comisiones/{id}:
 *   put:
 *     summary: Actualizar una comisión
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comision'
 *     responses:
 *       200:
 *         description: Comisión actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Comisión no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', commissionsController.actualizarComision);

/**
 * @swagger
 * /comisiones/{id}:
 *   delete:
 *     summary: Eliminar una comisión
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión
 *     responses:
 *       200:
 *         description: Comisión eliminada exitosamente
 *       404:
 *         description: Comisión no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', commissionsController.eliminarComision);

module.exports = router;
