-- ============================================================
-- SCRIPT: Llenar detalles_certificacion_credito_id en formato_emisiones_detalles
-- Descripción: Mapea los clasificadores guardados con los IDs de detalles_certificacion_credito
-- ============================================================

-- Actualizar todos los registros donde detalles_certificacion_credito_id es NULL
-- Haciendo match entre:
-- 1. formato_emisiones_detalles.clasificador_id (el que se guardó)
-- 2. detalles_certificacion_credito.clasificador_id (el que está en el certificado)
-- 3. formato_emisiones.certificacion_id (el certificado usado)

UPDATE formato_emisiones_detalles fed
SET fed.detalles_certificacion_credito_id = (
  SELECT dcc.id
  FROM detalles_certificacion_credito dcc
  INNER JOIN formato_emisiones fe ON fe.id = fed.formato_emision_id
  WHERE dcc.clasificador_id = fed.clasificador_id
    AND dcc.certificacion_credito_id = fe.certificacion_id
  LIMIT 1
)
WHERE fed.detalles_certificacion_credito_id IS NULL
  AND fed.formato_emision_id IN (
    SELECT fe.id FROM formato_emisiones fe WHERE fe.certificacion_id IS NOT NULL
  );

-- Verificar los cambios
SELECT 
  fe.id as formato_id,
  fe.certificacion_id,
  fed.id as detalle_id,
  fed.clasificador_id,
  fed.detalles_certificacion_credito_id,
  cl.nombre as clasificador_nombre
FROM formato_emisiones fe
INNER JOIN formato_emisiones_detalles fed ON fe.id = fed.formato_emision_id
LEFT JOIN clasificadores cl ON fed.clasificador_id = cl.id
WHERE fe.certificacion_id IS NOT NULL
ORDER BY fe.id, fed.clasificador_id;
