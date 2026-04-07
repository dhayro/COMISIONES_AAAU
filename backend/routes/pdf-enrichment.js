const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authMiddleware = require('../middleware/auth');

/**
 * Enriquece los datos extraídos del PDF con IDs de la BD
 * POST /api/pdf/enrich-extracted-data
 * 
 * Request body: {
 *   extractedData: { ...datos del PDF },
 *   usuario_id: number (del token)
 * }
 */
router.post('/enrich-extracted-data', authMiddleware, async (req, res) => {
  try {
    const { extractedData } = req.body;
    const usuario_id = req.user.id;

    if (!extractedData) {
      return res.status(400).json({ error: 'No se proporcionó extractedData' });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    try {
      // Buscar meta_id basado en el número de meta extraído
      let meta_id = null;
      if (extractedData.meta_info && extractedData.meta_info.numero) {
        const [metas] = await connection.query(
          'SELECT id FROM metas WHERE numero_meta = ?',
          [extractedData.meta_info.numero]
        );
        if (metas.length > 0) {
          meta_id = metas[0].id;
        }
      }

      // Buscar fuente_financiamiento_id basado en el nombre extraído
      let fuente_financiamiento_id = null;
      if (extractedData.fuente_info) {
        const [fuentes] = await connection.query(
          'SELECT id FROM fuentes_financiamiento WHERE nombre LIKE ? LIMIT 1',
          [`%${extractedData.fuente_info}%`]
        );
        if (fuentes.length > 0) {
          fuente_financiamiento_id = fuentes[0].id;
        }
      }

      // Enriquecer detalles con clasificador_id
      const detalles_enriquecidos = [];
      if (extractedData.detalles_raw && Array.isArray(extractedData.detalles_raw)) {
        for (const detalle of extractedData.detalles_raw) {
          const [clasificadores] = await connection.query(
            'SELECT id FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
            [detalle.partida_db]
          );
          
          detalles_enriquecidos.push({
            ...detalle,
            clasificador_id: clasificadores.length > 0 ? clasificadores[0].id : null
          });
        }
      }

      const enrichedData = {
        ...extractedData,
        meta_id,
        fuente_financiamiento_id,
        detalles_enriquecidos,
        usuario_id
      };

      await connection.end();

      res.json({
        success: true,
        data: enrichedData
      });
    } catch (error) {
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error enriqueciendo datos:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Guarda una certificación de crédito extraída del PDF
 * POST /api/pdf/save-certification
 * 
 * Request body: {
 *   enrichedData: { ...datos enriquecidos }
 * }
 */
router.post('/save-certification', authMiddleware, async (req, res) => {
  try {
    const { enrichedData } = req.body;
    const usuario_id = req.user.id;

    if (!enrichedData) {
      return res.status(400).json({ error: 'No se proporcionó enrichedData' });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    try {
      await connection.beginTransaction();

      // Insertar certificación principal
      const [result] = await connection.query(
        `INSERT INTO certificaciones_credito (
          nota, mes, fecha_aprobacion, fecha_documento, estado_certificacion,
          tipo_documento, numero_documento, justificacion, monto_total,
          meta_id, fuente_financiamiento_id, usuario_id, creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          enrichedData.nota,
          enrichedData.mes,
          enrichedData.fecha_aprobacion,
          enrichedData.fecha_documento,
          enrichedData.estado_certificacion,
          enrichedData.tipo_documento,
          enrichedData.numero_documento,
          enrichedData.justificacion,
          enrichedData.monto_total,
          enrichedData.meta_id,
          enrichedData.fuente_financiamiento_id,
          usuario_id
        ]
      );

      const certificacion_credito_id = result.insertId;

      // Insertar detalles
      if (enrichedData.detalles_enriquecidos && Array.isArray(enrichedData.detalles_enriquecidos)) {
        for (const detalle of enrichedData.detalles_enriquecidos) {
          if (detalle.clasificador_id) {
            await connection.query(
              `INSERT INTO detalles_certificacion_credito (
                certificacion_credito_id, clasificador_id, monto
              ) VALUES (?, ?, ?)`,
              [
                certificacion_credito_id,
                detalle.clasificador_id,
                detalle.monto
              ]
            );
          }
        }
      }

      await connection.commit();
      await connection.end();

      res.json({
        success: true,
        message: 'Certificación guardada exitosamente',
        certificacion_credito_id
      });
    } catch (error) {
      await connection.rollback();
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error guardando certificación:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
