const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');

const router = express.Router();

// Configurar multer para archivos PDF
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * @route POST /api/pdf/extract-certification
 * @desc Extrae información de un PDF de Certificación de Crédito
 * @param {File} file - Archivo PDF a procesar (multipart) O
 * @param {Object} body - { rutaPdf, procesarDesdeServidor } (JSON)
 * @returns {Object} Datos extraídos del PDF
 */
// Middleware personalizado para aceptar AMBOS multipart Y JSON
const handleExtractCertification = (req, res, next) => {
  // Si es multipart (tiene Content-Type: multipart/form-data)
  if (req.is('multipart/form-data')) {
    upload.single('file')(req, res, next);
  } else {
    // Si es JSON (application/json), pasar directamente
    next();
  }
};

router.post('/extract-certification', authMiddleware, handleExtractCertification, pdfController.extractCertificationPdf);

/**
 * @route POST /api/pdf/guardar-certificacion-pdf
 * @desc Guarda el PDF original asociado a una certificación
 * @param {File} archivo - Archivo PDF a guardar
 * @param {Number} certificacion_id - ID de la certificación
 */
router.post('/guardar-certificacion-pdf', authMiddleware, upload.single('archivo'), pdfController.guardarCertificacionPdf);

/**
 * @route GET /api/pdf/descargar-certificacion/:certificacion_id
 * @desc Descarga el PDF asociado a una certificación
 * @param {Number} certificacion_id - ID de la certificación
 */
router.get('/descargar-certificacion/:certificacion_id', authMiddleware, pdfController.descargarCertificacionPdf);

module.exports = router;
