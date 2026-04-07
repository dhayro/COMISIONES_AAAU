-- Agregar columna monto_utilizado a detalles_certificacion_credito
ALTER TABLE detalles_certificacion_credito 
ADD COLUMN monto_utilizado DECIMAL(15, 2) DEFAULT 0 COMMENT 'Monto utilizado en formatos de emisión';

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_detalles_monto_utilizado ON detalles_certificacion_credito(monto_utilizado);

-- Actualizar monto_utilizado basándose en formatos existentes
UPDATE detalles_certificacion_credito dcc
SET monto_utilizado = (
  SELECT COALESCE(SUM(fed.monto), 0)
  FROM formato_emisiones_detalles fed
  INNER JOIN formato_emisiones fe ON fed.formato_emision_id = fe.id
  WHERE fed.detalles_certificacion_credito_id = dcc.id
  AND fe.estado_emision != 'ANULADO'
);
