const { pool } = require('../config/database');

// Estados que afectan el presupuesto de la certificación. DEVUELTO cuenta porque el uso ya ocurrió.
const ESTADOS_QUE_AFECTAN = ['EMITIDO', 'ENVIADO', 'PAGADO', 'RINDIENDO', 'RENDIDO', 'DEVUELTO'];

const recalcularDetalles = async (detalleIds, conn = pool) => {
  const ids = [...new Set((detalleIds || []).filter((id) => id !== null && id !== undefined))];
  for (const id of ids) {
    await conn.query(
      `UPDATE detalles_certificacion_credito dcc
       SET dcc.monto_utilizado = (
         SELECT COALESCE(SUM(fed.monto), 0)
         FROM formato_emisiones_detalles fed
         JOIN formato_emisiones fe ON fe.id = fed.formato_emision_id
         WHERE fed.detalles_certificacion_credito_id = dcc.id
           AND fe.estado_emision IN (?)
       )
       WHERE dcc.id = ?`,
      [ESTADOS_QUE_AFECTAN, id]
    );
  }
};

const detallesDeFormato = async (formatoId, conn = pool) => {
  const [filas] = await conn.query(
    'SELECT detalles_certificacion_credito_id AS id FROM formato_emisiones_detalles WHERE formato_emision_id = ? AND detalles_certificacion_credito_id IS NOT NULL',
    [formatoId]
  );
  return filas.map((f) => f.id);
};

module.exports = { ESTADOS_QUE_AFECTAN, recalcularDetalles, detallesDeFormato };
