const pool = require('../config/database').pool;

/**
 * Obtener certificados disponibles por META
 * Retorna solo certificados con estado ACTIVO o EN_PROCESO
 */
const obtenerCertificadosPorMeta = async (req, res) => {
  try {
    const { metaId } = req.params;

    if (!metaId) {
      return res.status(400).json({
        error: 'Falta el parámetro metaId',
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Usar la vista con los datos detallados
      const [certificados] = await connection.query(
        `SELECT 
          id,
          nota,
          mes,
          fecha_aprobacion,
          fecha_documento,
          estado_certificacion,
          estado_uso,
          tipo_documento,
          numero_documento,
          justificacion,
          monto_certificado,
          monto_utilizado,
          (monto_certificado - monto_utilizado) as monto_disponible,
          ROUND((monto_utilizado / NULLIF(monto_certificado, 0) * 100), 2) as porcentaje_uso,
          meta_id,
          meta_nombre,
          numero_meta,
          fuente_financiamiento_id,
          fuente_financiamiento_nombre,
          usuario_id,
          usuario_nombre,
          fecha_terminado,
          motivo_anulacion,
          created_at,
          updated_at
         FROM certificaciones_credito_detalladas
         WHERE meta_id = ? 
         AND estado_uso IN ('ACTIVO', 'EN_PROCESO')
         AND estado_certificacion IN ('APROBADA', 'APROBADO')
         ORDER BY estado_uso DESC, fecha_documento DESC`,
        [metaId]
      );

      console.log(`📜 Certificados encontrados para META ${metaId}:`, certificados.length);

      res.json(certificados || []);
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener certificados por META:', error.message);
    res.status(500).json({
      error: 'Error al obtener certificados',
      detalle: error.message,
    });
  }
};

/**
 * Obtener certificado por ID con todos los detalles
 */
const obtenerCertificadoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Falta el parámetro id',
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      const [certificados] = await connection.query(
        `SELECT * FROM certificaciones_credito_detalladas WHERE id = ?`,
        [id]
      );

      if (certificados.length === 0) {
        return res.status(404).json({
          error: 'Certificado no encontrado',
        });
      }

      // Obtener también los detalles (clasificadores)
      const [detalles] = await connection.query(
        `SELECT 
          dcc.id,
          dcc.clasificador_id,
          c.nombre as clasificador_nombre,
          c.partida,
          dcc.monto,
          dcc.created_at
         FROM detalles_certificacion_credito dcc
         LEFT JOIN clasificadores c ON dcc.clasificador_id = c.id
         WHERE dcc.certificacion_credito_id = ?
         ORDER BY dcc.created_at DESC`,
        [id]
      );

      const certificado = certificados[0];
      certificado.detalles = detalles || [];

      res.json(certificado);
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener certificado:', error.message);
    res.status(500).json({
      error: 'Error al obtener certificado',
      detalle: error.message,
    });
  }
};

/**
 * Obtener solo los clasificadores de una certificación
 */
const obtenerClasificadoresDeCertificacion = async (req, res) => {
  try {
    const { certificacionId } = req.params;

    if (!certificacionId) {
      return res.status(400).json({
        error: 'Falta el parámetro certificacionId',
      });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Verificar que la certificación existe
      const [certificados] = await connection.query(
        `SELECT id FROM certificaciones_credito WHERE id = ?`,
        [certificacionId]
      );

      if (certificados.length === 0) {
        return res.status(404).json({
          error: 'Certificación no encontrada',
        });
      }

      // Obtener los clasificadores
      const [clasificadores] = await connection.query(
        `SELECT 
          dcc.id as detalles_certificacion_credito_id,
          dcc.clasificador_id,
          c.id as clasificador_id_ref,
          c.nombre as clasificador_nombre,
          c.partida,
          c.activo,
          dcc.monto,
          dcc.monto_utilizado,
          dcc.created_at,
          dcc.updated_at
         FROM detalles_certificacion_credito dcc
         LEFT JOIN clasificadores c ON dcc.clasificador_id = c.id
         WHERE dcc.certificacion_credito_id = ?
         ORDER BY c.nombre ASC`,
        [certificacionId]
      );

      console.log(`📋 Clasificadores encontrados para certificación ${certificacionId}:`, clasificadores.length);
      if (clasificadores.length > 0) {
        console.log('📋 Primer clasificador:', JSON.stringify(clasificadores[0], null, 2));
      }

      res.json(clasificadores || []);
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener clasificadores:', error.message);
    res.status(500).json({
      error: 'Error al obtener clasificadores',
      detalle: error.message,
    });
  }
};

module.exports = {
  obtenerCertificadosPorMeta,
  obtenerCertificadoPorId,
  obtenerClasificadoresDeCertificacion,
};
