const express = require('express');
const router = express.Router();
const comisionController = require('../controllers/comisionController');
const ambitoController = require('../controllers/ambitoController');
const clasificadorController = require('../controllers/clasificadorController');
const costoViajeController = require('../controllers/costoViajeController');
const userController = require('../controllers/userController');
const metaController = require('../controllers/metaController');
const fuenteFinanciamientoController = require('../controllers/fuenteFinanciamientoController');
const cargoController = require('../controllers/cargoController');
const pdfController = require('../controllers/pdfController');
const formatoEmisionController = require('../controllers/formatoEmisionController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ========== AMBITOS ==========
/**
 * @swagger
 * /ambitos:
 *   get:
 *     summary: Listar todos los ámbitos activos
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ámbitos
 */
router.get('/ambitos', ambitoController.listar);

/**
 * @swagger
 * /ambitos/{id}:
 *   get:
 *     summary: Obtener ámbito por ID
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ámbito a obtener
 *     responses:
 *       200:
 *         description: Datos del ámbito encontrado
 *       404:
 *         description: Ámbito no encontrado
 */
router.get('/ambitos/:id', ambitoController.obtener);

/**
 * @swagger
 * /ambitos:
 *   post:
 *     summary: Crear nuevo ámbito (AAA o ALA)
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_corto
 *               - nombre_largo
 *             properties:
 *               nombre_corto:
 *                 type: string
 *                 example: "AAA UCAYALI"
 *               nombre_largo:
 *                 type: string
 *                 example: "Autoridad Administrativa del Agua Ucayali"
 *               dependencia_id:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *                 description: "ID de la AAA padre (NULL para AAAs, requerido para ALAs)"
 *     responses:
 *       201:
 *         description: Ámbito creado exitosamente
 *       400:
 *         description: Campos requeridos faltantes
 */
router.post('/ambitos', ambitoController.crear);

/**
 * @swagger
 * /ambitos/{id}:
 *   put:
 *     summary: Actualizar ámbito (AAA o ALA)
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ámbito a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_corto
 *               - nombre_largo
 *             properties:
 *               nombre_corto:
 *                 type: string
 *                 example: "AAA UCAYALI"
 *               nombre_largo:
 *                 type: string
 *                 example: "Autoridad Administrativa del Agua Ucayali Actualizada"
 *               dependencia_id:
 *                 type: integer
 *                 nullable: true
 *                 description: "ID de la AAA padre (NULL para AAAs, requerido para ALAs)"
 *     responses:
 *       200:
 *         description: Ámbito actualizado exitosamente
 *       400:
 *         description: Campos requeridos faltantes
 *       404:
 *         description: Ámbito no encontrado
 */
router.put('/ambitos/:id', ambitoController.actualizar);

/**
 * @swagger
 * /ambitos/{id}:
 *   delete:
 *     summary: Eliminar ámbito
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del ámbito a eliminar
 *     responses:
 *       200:
 *         description: Ámbito eliminado exitosamente
 *       404:
 *         description: Ámbito no encontrado
 */
router.delete('/ambitos/:id', ambitoController.eliminar);

/**
 * @swagger
 * /ambitos/aaas:
 *   get:
 *     summary: Listar todas las Autoridades Administrativas (AAAs)
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de AAAs
 */
router.get('/ambitos/aaas', ambitoController.listarAAAs);

/**
 * @swagger
 * /ambitos/aaa/{aaa_id}/alas:
 *   get:
 *     summary: Listar Autoridades Locales (ALAs) de una AAA específica
 *     tags: [Ámbitos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: aaa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la Autoridad Administrativa (AAA)
 *     responses:
 *       200:
 *         description: Lista de ALAs dependientes de la AAA
 *       404:
 *         description: AAA no encontrada
 */
router.get('/ambitos/aaa/:aaa_id/alas', ambitoController.listarALAsPorAAA);

// ========== CLASIFICADORES ==========
/**
 * @swagger
 * /clasificadores:
 *   get:
 *     summary: Listar todos los clasificadores activos
 *     tags: [Clasificadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clasificadores con sus partidas presupuestales
 */
router.get('/clasificadores', clasificadorController.listar);

/**
 * @swagger
 * /clasificadores/{id}:
 *   get:
 *     summary: Obtener clasificador por ID
 *     tags: [Clasificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del clasificador a obtener
 *     responses:
 *       200:
 *         description: Datos del clasificador
 *       404:
 *         description: Clasificador no encontrado
 */
router.get('/clasificadores/:id', clasificadorController.obtener);

/**
 * @swagger
 * /clasificadores:
 *   post:
 *     summary: Crear nuevo clasificador
 *     tags: [Clasificadores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - partida
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "VIÁTICOS"
 *               partida:
 *                 type: string
 *                 example: "23.2.1.2.2"
 *     responses:
 *       201:
 *         description: Clasificador creado exitosamente
 */
router.post('/clasificadores', clasificadorController.crear);

/**
 * @swagger
 * /clasificadores/{id}:
 *   put:
 *     summary: Actualizar clasificador
 *     tags: [Clasificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del clasificador a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "VIÁTICOS ACTUALIZADO"
 *               partida:
 *                 type: string
 *                 example: "23.2.1.2.2"
 *               descripcion:
 *                 type: string
 *                 example: "Descripción actualizada"
 *     responses:
 *       200:
 *         description: Clasificador actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Clasificador actualizado exitosamente"
 *                 clasificador:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     partida:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *       400:
 *         description: Debe proporcionar al menos partida o nombre
 *       404:
 *         description: Clasificador no encontrado
 */
router.put('/clasificadores/:id', clasificadorController.actualizar);

/**
 * @swagger
 * /clasificadores/{id}:
 *   delete:
 *     summary: Eliminar clasificador
 *     tags: [Clasificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Clasificador eliminado exitosamente
 */
router.delete('/clasificadores/:id', clasificadorController.eliminar);

// ========== COSTOS DE VIAJE ==========
/**
 * @swagger
 * /costos-viaje:
 *   get:
 *     summary: Listar todos los costos de viaje
 *     tags: [Costos de Viaje]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de costos de viaje
 */
router.get('/costos-viaje', costoViajeController.listar);

/**
 * @swagger
 * /costos-viaje/{id}:
 *   get:
 *     summary: Obtener un costo de viaje por ID
 *     tags: [Costos de Viaje]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del costo de viaje
 *     responses:
 *       200:
 *         description: Detalles del costo de viaje
 *       404:
 *         description: Costo de viaje no encontrado
 */
router.get('/costos-viaje/:id', costoViajeController.obtener);

/**
 * @swagger
 * /costos-viaje:
 *   post:
 *     summary: Crear un nuevo costo de viaje
 *     tags: [Costos de Viaje]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - costo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Dentro del ámbito"
 *               costo:
 *                 type: number
 *                 example: 220.00
 *     responses:
 *       201:
 *         description: Costo de viaje creado exitosamente
 *       400:
 *         description: Nombre y costo son requeridos
 */
router.post('/costos-viaje', costoViajeController.crear);

/**
 * @swagger
 * /costos-viaje/{id}:
 *   put:
 *     summary: Actualizar un costo de viaje
 *     tags: [Costos de Viaje]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del costo de viaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - costo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Dentro del ámbito"
 *               costo:
 *                 type: number
 *                 example: 220.00
 *     responses:
 *       200:
 *         description: Costo de viaje actualizado exitosamente
 *       400:
 *         description: Nombre y costo son requeridos
 *       404:
 *         description: Costo de viaje no encontrado
 */
router.put('/costos-viaje/:id', costoViajeController.actualizar);

/**
 * @swagger
 * /costos-viaje/{id}:
 *   delete:
 *     summary: Eliminar un costo de viaje
 *     tags: [Costos de Viaje]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del costo de viaje
 *     responses:
 *       200:
 *         description: Costo de viaje eliminado exitosamente
 */
router.delete('/costos-viaje/:id', costoViajeController.eliminar);

// ========== USUARIOS ==========
/**
 * @swagger
 * /usuarios/activos:
 *   get:
 *     summary: Listar todos los usuarios activos
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios activos del sistema
 */
router.get('/usuarios/activos', userController.listarActivos);

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los usuarios
 */
router.get('/usuarios', userController.listar);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Faltan campos requeridos
 */
router.post('/usuarios', userController.crear);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/usuarios/:id', userController.actualizar);

/**
 * @swagger
 * /usuarios/{id}/toggle:
 *   patch:
 *     summary: Activar o desactivar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/usuarios/:id/toggle', userController.activarDesactivar);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/usuarios/:id', userController.eliminar);

/**
 * @swagger
 * /usuarios/{id}/resetear-password:
 *   post:
 *     summary: Resetear contraseña del usuario a Autoridad1
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Contraseña reseteada exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/usuarios/:id/resetear-password', userController.resetearPassword);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a obtener
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/usuarios/:id', userController.obtener);

// ========== COMISIONES ==========
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
 *               - ambito_id
 *               - lugar
 *               - fecha_salida
 *               - fecha_retorno
 *               - num_dias
 *               - costo_xdia
 *             properties:
 *               ambito_id:
 *                 type: integer
 *               lugar:
 *                 type: string
 *               ruta:
 *                 type: string
 *               modalidad_viaje:
 *                 type: string
 *                 enum: [TERRESTRE, AEREO, FLUVIAL, AEREO-TERRESTRE, AEREO-FLUVIAL, TERRESTRE-FLUVIAL, AEREO-TERRESTRE-FLUVIAL]
 *               fecha_salida:
 *                 type: string
 *                 format: date-time
 *               fecha_retorno:
 *                 type: string
 *                 format: date-time
 *               num_dias:
 *                 type: integer
 *               costo_xdia:
 *                 type: number
 *               observacion:
 *                 type: string
 */
router.post('/comisiones', comisionController.crearComision);

/**
 * @swagger
 * /comisiones:
 *   get:
 *     summary: Listar comisiones
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: solo_mias
 *         schema:
 *           type: boolean
 */
router.get('/comisiones', comisionController.listarComisiones);

/**
 * @swagger
 * /comisiones/{id}:
 *   get:
 *     summary: Obtener comisión por ID
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión a obtener
 *     responses:
 *       200:
 *         description: Datos de la comisión con sus comisionados
 *       404:
 *         description: Comisión no encontrada
 */

/**
 * @swagger
 * /comisiones/mes/{year}/{month}:
 *   get:
 *     summary: Obtener comisiones por mes
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Año (ej. 2024)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mes (1-12)
 *     responses:
 *       200:
 *         description: Lista de comisiones para el mes especificado con comisionados incluidos
 *       400:
 *         description: Parámetros inválidos
 */
router.get('/comisiones/mes/:year/:month', comisionController.obtenerComisionesPorMes);

/**
 * @route GET /comisiones/emision-formatos
 * @description Obtener comisiones para emitir formatos (presupuesto asignado y aprobadas)
 * @returns {Array} Lista de comisiones filtradas según usuario logueado
 */
router.get('/comisiones/emision-formatos', comisionController.obtenerComisionesParaEmisionFormatos);

// ========== PDF COMISIONES (ANTES de rutas dinámicas) ==========
/**
 * @swagger
 * /comisiones/pdf/emision/{comision_id}:
 *   post:
 *     summary: Generar PDF de comisión
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comision_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comision_data:
 *                 type: object
 *                 description: Datos completos de la comisión
 *     responses:
 *       200:
 *         description: PDF generado correctamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/comisiones/pdf/emision/:comision_id', pdfController.generarPDFComision);

/**
 * @swagger
 * /comisiones/pdf/multiple:
 *   post:
 *     summary: Generar PDF con múltiples comisiones
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comisiones_data:
 *                 type: array
 *                 description: Array de comisiones
 *     responses:
 *       200:
 *         description: PDF generado correctamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/comisiones/pdf/multiple', pdfController.generarPDFMultipleComisiones);

/**
 * @swagger
 * /comisiones/{id}:
 *   get:
 *     summary: Obtener comisión por ID
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión a obtener
 *     responses:
 *       200:
 *         description: Datos de la comisión con sus comisionados
 *       404:
 *         description: Comisión no encontrada
 */
router.get('/comisiones/:id', comisionController.obtenerComision);

/**
 * @swagger
 * /comisiones/{id}:
 *   put:
 *     summary: Actualizar comisión
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ambito_id:
 *                 type: integer
 *               lugar:
 *                 type: string
 *               ruta:
 *                 type: string
 *               modalidad_viaje:
 *                 type: string
 *               num_dias:
 *                 type: integer
 *               costo_xdia:
 *                 type: number
 *               observacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comisión actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Comisión actualizada exitosamente"
 *                 comision:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     usuario_id:
 *                       type: integer
 *                       example: 1
 *                     ambito_id:
 *                       type: integer
 *                       example: 1
 *                     lugar:
 *                       type: string
 *                       example: "Pucallpa"
 *                     ruta:
 *                       type: string
 *                       example: "Lima - Pucallpa"
 *                     modalidad_viaje:
 *                       type: string
 *                       example: "TERRESTRE"
 *                     fecha_salida:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-15T00:00:00.000Z"
 *                     fecha_retorno:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-20T00:00:00.000Z"
 *                     num_dias:
 *                       type: integer
 *                       example: 5
 *                     costo_xdia:
 *                       type: number
 *                       example: 150.00
 *                     total_monto:
 *                       type: number
 *                       example: 750.00
 *                     observacion:
 *                       type: string
 *                       example: "Comisión completada"
 *                     fecha_creacion:
 *                       type: string
 *                       format: date-time
 *                     fecha_actualizacion:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Comisión no encontrada
 */
router.put('/comisiones/:id', comisionController.actualizarComision);

/**
 * @swagger
 * /comisiones/{id}:
 *   delete:
 *     summary: Eliminar comisión
 *     tags: [Comisiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comisión eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Comisión eliminada exitosamente"
 *                 id:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Comisión no encontrada
 */
router.delete('/comisiones/:id', comisionController.eliminarComision);

// ========== COMISIONADOS ==========
/**
 * @swagger
 * /comisiones/{comision_id}/comisionados:
 *   post:
 *     summary: Agregar comisionado a comisión
 *     tags: [Comisionados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comision_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - clasificador_id
 *               - dias
 *               - costo_xdia
 *             properties:
 *               usuario_id:
 *                 type: integer
 *               clasificador_id:
 *                 type: integer
 *               dias:
 *                 type: integer
 *               costo_xdia:
 *                 type: number
 *               monto:
 *                 type: number
 *               descripcion:
 *                 type: string
 *               observacion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comisionado agregado exitosamente
 */
router.post('/comisiones/:comision_id/comisionados', comisionController.agregarComisionado);

/**
 * @swagger
 * /comisiones/{comision_id}/comisionados:
 *   get:
 *     summary: Obtener comisionados de una comisión
 *     tags: [Comisionados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comision_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la comisión
 *     responses:
 *       200:
 *         description: Lista de comisionados de la comisión
 */
router.get('/comisiones/:comision_id/comisionados', comisionController.obtenerComisionados);

/**
 * @swagger
 * /comisiones/{comision_id}/comisionados/{comisionado_id}:
 *   put:
 *     summary: Actualizar comisionado en una comisión
 *     tags: [Comisionados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comision_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: comisionado_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dias:
 *                 type: integer
 *               costo_xdia:
 *                 type: number
 *               monto:
 *                 type: number
 *               descripcion:
 *                 type: string
 *               observacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comisionado actualizado exitosamente
 */
router.put('/comisiones/:comision_id/comisionados/:comisionado_id', comisionController.actualizarComisionado);

/**
 * @swagger
 * /comisionados/{id}:
 *   put:
 *     summary: Actualizar comisionado
 *     tags: [Comisionados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dias:
 *                 type: integer
 *               costo_xdia:
 *                 type: number
 *               monto:
 *                 type: number
 *               descripcion:
 *                 type: string
 *               observacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comisionado actualizado exitosamente
 */
router.put('/comisionados/:id', comisionController.actualizarComisionado);

/**
 * @swagger
 * /comisionados/{id}:
 *   delete:
 *     summary: Eliminar comisionado
 *     tags: [Comisionados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comisionado eliminado exitosamente
 */
router.delete('/comisionados/:id', comisionController.eliminarComisionado);

// ========== REPORTES ==========
/**
 * @swagger
 * /reportes/presupuestos:
 *   get:
 *     summary: Obtener reporte de presupuestos asignados en un rango de fechas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio (YYYY-MM-DD)
 *       - in: query
 *         name: fechaFin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de comisiones con presupuesto asignado
 */
router.get('/reportes/presupuestos', comisionController.obtenerReportePresupuestos);

/**
 * @route GET /reportes/presupuestos-pendientes
 * @description Obtener reporte de presupuestos PENDIENTES
 * @query {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @query {string} fechaFin - Fecha fin (YYYY-MM-DD)
 * @returns {Object} Reporte con comisiones sin presupuesto asignado
 */
router.get('/reportes/presupuestos-pendientes', comisionController.obtenerReportePresupuestosPendientes);

/**
 * @route GET /reportes/presupuestos-asignados
 * @description Obtener reporte de comisiones CON PRESUPUESTO ASIGNADO
 * @query {string} fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @query {string} fechaFin - Fecha fin (YYYY-MM-DD)
 * @returns {Object} Reporte con comisiones con presupuesto asignado
 */
router.get('/reportes/presupuestos-asignados', comisionController.obtenerReportePresupuestosAsignados);

/**
 * @route POST /admin/sincronizar-costos
 * @description Sincronizar costos totales de todas las comisiones
 * @security bearerAuth
 * @returns {Object} Resumen de sincronización
 */
router.post('/admin/sincronizar-costos', comisionController.sincronizarCostosTotales);

// ========== METAS ==========
/**
 * @swagger
 * /metas:
 *   get:
 *     summary: Listar todas las metas activas
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de metas
 */
router.get('/metas', metaController.listar);

// 🆕 RUTA: Obtener metas por ámbito (para administrativos)
/**
 * @swagger
 * /metas/por-ambito/{ambitoId}:
 *   get:
 *     summary: Obtener metas de un ámbito específico
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ambitoId
 *         required: true
 *         description: ID del ámbito
 *     responses:
 *       200:
 *         description: Lista de metas del ámbito
 */
router.get('/metas/por-ambito/:ambitoId', metaController.listarPorAmbito);

/**
 * @swagger
 * /metas/{id}:
 *   get:
 *     summary: Obtener meta por ID
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la meta
 *       404:
 *         description: Meta no encontrada
 */
router.get('/metas/:id', metaController.obtener);

/**
 * @swagger
 * /metas:
 *   post:
 *     summary: Crear nueva meta
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, numero_meta, periodo]
 *             properties:
 *               nombre:
 *                 type: string
 *               numero_meta:
 *                 type: string
 *               periodo:
 *                 type: string
 *               ambito_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Meta creada exitosamente
 */
router.post('/metas', metaController.crear);

/**
 * @swagger
 * /metas/{id}:
 *   put:
 *     summary: Actualizar meta
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               numero_meta:
 *                 type: string
 *               periodo:
 *                 type: string
 *               ambito_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Meta actualizada exitosamente
 */
router.put('/metas/:id', metaController.actualizar);

/**
 * @swagger
 * /metas/{id}:
 *   delete:
 *     summary: Eliminar meta
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Meta eliminada exitosamente
 */
router.delete('/metas/:id', metaController.eliminar);

// ========== FUENTES DE FINANCIAMIENTO ==========
/**
 * @swagger
 * /fuentes-financiamiento:
 *   get:
 *     summary: Listar todas las fuentes de financiamiento
 *     tags: [Fuentes de Financiamiento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fuentes de financiamiento
 */
router.get('/fuentes-financiamiento', fuenteFinanciamientoController.obtenerFuentes);

/**
 * @swagger
 * /fuentes-financiamiento/{id}:
 *   get:
 *     summary: Obtener una fuente de financiamiento por ID
 *     tags: [Fuentes de Financiamiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fuente de financiamiento encontrada
 *       404:
 *         description: Fuente no encontrada
 */
router.get('/fuentes-financiamiento/:id', fuenteFinanciamientoController.obtenerFuentePorId);

/**
 * @swagger
 * /fuentes-financiamiento:
 *   post:
 *     summary: Crear nueva fuente de financiamiento
 *     tags: [Fuentes de Financiamiento]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Recursos Ordinarios"
 *               abreviatura:
 *                 type: string
 *                 example: "R.O"
 *               descripcion:
 *                 type: string
 *                 example: "Ingresos ordinarios del estado"
 *     responses:
 *       201:
 *         description: Fuente de financiamiento creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/fuentes-financiamiento', fuenteFinanciamientoController.crearFuente);

/**
 * @swagger
 * /fuentes-financiamiento/{id}:
 *   put:
 *     summary: Actualizar fuente de financiamiento
 *     tags: [Fuentes de Financiamiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               abreviatura:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Fuente de financiamiento actualizada
 *       404:
 *         description: Fuente no encontrada
 */
router.put('/fuentes-financiamiento/:id', fuenteFinanciamientoController.actualizarFuente);

/**
 * @swagger
 * /fuentes-financiamiento/{id}:
 *   delete:
 *     summary: Eliminar fuente de financiamiento
 *     tags: [Fuentes de Financiamiento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fuente de financiamiento eliminada exitosamente
 *       404:
 *         description: Fuente no encontrada
 */
router.delete('/fuentes-financiamiento/:id', fuenteFinanciamientoController.eliminarFuente);

// ========== CARGOS ==========
/**
 * @swagger
 * /cargos:
 *   get:
 *     summary: Listar todos los cargos
 *     tags: [Cargos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cargos
 */
router.get('/cargos', cargoController.obtenerCargos);

/**
 * @swagger
 * /cargos/{id}:
 *   get:
 *     summary: Obtener un cargo por ID
 *     tags: [Cargos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cargo encontrado
 *       404:
 *         description: Cargo no encontrado
 */
router.get('/cargos/:id', cargoController.obtenerCargoPorId);

/**
 * @swagger
 * /cargos:
 *   post:
 *     summary: Crear nuevo cargo
 *     tags: [Cargos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Gerente"
 *     responses:
 *       201:
 *         description: Cargo creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/cargos', cargoController.crearCargo);

/**
 * @swagger
 * /cargos/{id}:
 *   put:
 *     summary: Actualizar cargo
 *     tags: [Cargos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cargo actualizado
 *       404:
 *         description: Cargo no encontrado
 */
router.put('/cargos/:id', cargoController.actualizarCargo);

/**
 * @swagger
 * /cargos/{id}:
 *   delete:
 *     summary: Eliminar cargo
 *     tags: [Cargos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cargo eliminado exitosamente
 *       404:
 *         description: Cargo no encontrado
 */
router.delete('/cargos/:id', cargoController.eliminarCargo);

// ========== CERTIFICACIONES DE CRÉDITO PRESUPUESTARIO ==========
const certificacionCreditoController = require('../controllers/certificacionCreditoController');

/**
 * @swagger
 * /certificaciones-credito:
 *   get:
 *     summary: Listar todas las certificaciones de crédito
 *     tags: [Certificaciones de Crédito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meta_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fuente_financiamiento_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado_certificacion
 *         schema:
 *           type: string
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de certificaciones
 */
router.get('/certificaciones-credito', certificacionCreditoController.listar);

/**
 * @swagger
 * /certificaciones-credito:
 *   post:
 *     summary: Crear nueva certificación de crédito
 *     tags: [Certificaciones de Crédito]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nota
 *               - mes
 *               - tipo_documento
 *               - numero_documento
 *             properties:
 *               nota:
 *                 type: string
 *               mes:
 *                 type: string
 *               fecha_aprobacion:
 *                 type: string
 *                 format: date
 *               fecha_documento:
 *                 type: string
 *                 format: date
 *               estado_certificacion:
 *                 type: string
 *               tipo_documento:
 *                 type: string
 *               numero_documento:
 *                 type: string
 *               justificacion:
 *                 type: string
 *               meta_id:
 *                 type: integer
 *               fuente_financiamiento_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Certificación creada exitosamente
 */
router.post('/certificaciones-credito', certificacionCreditoController.crear);

/**
 * @swagger
 * /certificaciones-credito/{id}:
 *   get:
 *     summary: Obtener certificación por ID
 *     tags: [Certificaciones de Crédito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificación encontrada
 *       404:
 *         description: Certificación no encontrada
 */
router.get('/certificaciones-credito/:id', certificacionCreditoController.obtenerPorId);

/**
 * @swagger
 * /certificaciones-credito/{id}:
 *   put:
 *     summary: Actualizar certificación
 *     tags: [Certificaciones de Crédito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nota:
 *                 type: string
 *               mes:
 *                 type: string
 *               fecha_aprobacion:
 *                 type: string
 *                 format: date
 *               fecha_documento:
 *                 type: string
 *                 format: date
 *               estado_certificacion:
 *                 type: string
 *               tipo_documento:
 *                 type: string
 *               numero_documento:
 *                 type: string
 *               justificacion:
 *                 type: string
 *               meta_id:
 *                 type: integer
 *               fuente_financiamiento_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Certificación actualizada exitosamente
 *       404:
 *         description: Certificación no encontrada
 */
router.put('/certificaciones-credito/:id', certificacionCreditoController.actualizar);

/**
 * @swagger
 * /certificaciones-credito/{id}:
 *   delete:
 *     summary: Eliminar certificación
 *     tags: [Certificaciones de Crédito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificación eliminada exitosamente
 *       404:
 *         description: Certificación no encontrada
 */
router.delete('/certificaciones-credito/:id', certificacionCreditoController.eliminar);

// ========== DETALLES DE CERTIFICACIÓN ==========

/**
 * @swagger
 * /certificaciones-credito/{certificacion_credito_id}/detalles:
 *   get:
 *     summary: Listar detalles de una certificación
 *     tags: [Detalles Certificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificacion_credito_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de detalles
 */
router.get('/certificaciones-credito/:certificacion_credito_id/detalles', certificacionCreditoController.listarDetalles);

/**
 * @swagger
 * /detalles-certificacion:
 *   post:
 *     summary: Crear detalle de certificación
 *     tags: [Detalles Certificación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - certificacion_credito_id
 *               - clasificador_id
 *               - monto
 *             properties:
 *               certificacion_credito_id:
 *                 type: integer
 *               clasificador_id:
 *                 type: integer
 *               monto:
 *                 type: number
 *     responses:
 *       201:
 *         description: Detalle creado exitosamente
 */
router.post('/detalles-certificacion', certificacionCreditoController.crearDetalle);

/**
 * @swagger
 * /detalles-certificacion/{id}:
 *   get:
 *     summary: Obtener detalle por ID
 *     tags: [Detalles Certificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle encontrado
 *       404:
 *         description: Detalle no encontrado
 */
router.get('/detalles-certificacion/:id', certificacionCreditoController.obtenerDetallePorId);

/**
 * @swagger
 * /detalles-certificacion/{id}:
 *   put:
 *     summary: Actualizar detalle de certificación
 *     tags: [Detalles Certificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clasificador_id:
 *                 type: integer
 *               monto:
 *                 type: number
 *     responses:
 *       200:
 *         description: Detalle actualizado exitosamente
 *       404:
 *         description: Detalle no encontrado
 */
router.put('/detalles-certificacion/:id', certificacionCreditoController.actualizarDetalle);

/**
 * @swagger
 * /detalles-certificacion/{id}:
 *   delete:
 *     summary: Eliminar detalle de certificación
 *     tags: [Detalles Certificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle eliminado exitosamente
 *       404:
 *         description: Detalle no encontrado
 */
router.delete('/detalles-certificacion/:id', certificacionCreditoController.eliminarDetalle);

/**
 * @swagger
 * /certificaciones-credito/{certificacion_credito_id}/total:
 *   get:
 *     summary: Obtener total de montos de una certificación
 *     tags: [Detalles Certificación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certificacion_credito_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Total calculado
 */
router.get('/certificaciones-credito/:certificacion_credito_id/total', certificacionCreditoController.obtenerTotalMonto);

// ========== FORMATO DE EMISIONES ==========

/**
 * @swagger
 * /formatos-emisiones:
 *   post:
 *     summary: Crear nuevo formato de emisión
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comision_id: { type: integer }
 *               usuario_id: { type: integer }
 *               costo_viaje_id: { type: integer }
 *               numero_documento: { type: string }
 *               fecha_emision: { type: string, format: date-time }
 *               lugar: { type: string }
 *               ruta: { type: string }
 *               modalidad_viaje: { type: string }
 *               fecha_salida: { type: string, format: date-time }
 *               fecha_retorno: { type: string, format: date-time }
 *               num_dias: { type: integer }
 *               numero_siaf: { type: string }
 *               codigo_cp: { type: string }
 *               tipo_emision: { type: string, enum: ['ANTICIPO', 'REEMBOLSO'] }
 *               costo_xdia: { type: number }
 *               monto_total: { type: number }
 *               observacion: { type: string }
 *     responses:
 *       201:
 *         description: Formato creado exitosamente
 */
router.post('/formatos-emisiones', formatoEmisionController.crear);

/**
 * @swagger
 * /formatos-emisiones:
 *   get:
 *     summary: Listar formatos de emisión
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado_emision
 *         schema:
 *           type: string
 *       - in: query
 *         name: comision_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_emision
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de formatos
 */
router.get('/formatos-emisiones', formatoEmisionController.listar);

/**
 * @swagger
 * /formatos-emisiones/{id}:
 *   get:
 *     summary: Obtener formato de emisión por ID
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Formato encontrado
 */
router.get('/formatos-emisiones/:id', formatoEmisionController.obtenerPorId);

/**
 * @swagger
 * /formatos-emisiones/{id}:
 *   put:
 *     summary: Actualizar formato de emisión
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Formato actualizado
 */
router.put('/formatos-emisiones/:id', formatoEmisionController.actualizar);

/**
 * @swagger
 * /formatos-emisiones/{id}:
 *   delete:
 *     summary: Eliminar formato de emisión
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Formato eliminado
 */
router.delete('/formatos-emisiones/:id', formatoEmisionController.eliminar);

/**
 * @swagger
 * /formatos-emisiones/{formato_id}/detalles:
 *   get:
 *     summary: Obtener detalles de un formato de emisión
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formato_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del formato
 */
router.get('/formatos-emisiones/:formato_id/detalles', formatoEmisionController.obtenerDetalles);

/**
 * @swagger
 * /formatos-emisiones/{formato_id}/detalles:
 *   post:
 *     summary: Agregar detalle a formato de emisión
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formato_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clasificador_id: { type: integer }
 *               dias: { type: integer }
 *               monto: { type: number }
 *               descripcion: { type: string }
 *               observacion: { type: string }
 *               detalles_certificacion_credito_id: { type: integer }
 *     responses:
 *       201:
 *         description: Detalle agregado
 */
router.post('/formatos-emisiones/:formato_id/detalles', formatoEmisionController.agregarDetalle);

/**
 * @swagger
 * /formatos-emisiones/proximo-numero:
 *   get:
 *     summary: Obtener próximo número de documento
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Número de documento generado
 */
router.get('/formatos-emisiones/proximo-numero/obtener', formatoEmisionController.obtenerProximoNumero);

/**
 * @swagger
 * /formatos-emisiones/normalizar-estados:
 *   post:
 *     summary: Normalizar estados de formatos (con cert → EMITIDO, sin cert → BORRADOR)
 *     tags: [Formatos Emisión]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estados normalizados
 */
router.post('/formatos-emisiones/normalizar-estados', formatoEmisionController.normalizarEstados);

/**
 * @swagger
 * /formatos-emisiones/reparar/montos-utilizados:
 *   post:
 *     summary: Reparar todos los montos_utilizados (recalcular desde detalles reales)
 *     tags: [Formatos Emisión - Reparación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Montos reparados exitosamente
 */
router.post('/formatos-emisiones/reparar/montos-utilizados', formatoEmisionController.repararMontosUtilizados);

/**
 * @swagger
 * /formatos-emisiones/diagnostico/montos:
 *   get:
 *     summary: Diagnóstico - ver estado actual de todos los montos_utilizados
 *     tags: [Formatos Emisión - Diagnóstico]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Diagnóstico completo de montos
 */
router.get('/formatos-emisiones/diagnostico/montos', formatoEmisionController.diagnosticoMontos);

module.exports = router;
