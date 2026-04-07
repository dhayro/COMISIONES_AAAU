-- ========== AGREGAR CAMPO DE ESTADO DETALLADO A CERTIFICACIONES_CREDITO ==========

-- Agregar columna de estado_uso que refleja el estado del certificado
ALTER TABLE certificaciones_credito 
ADD COLUMN estado_uso ENUM('ACTIVO', 'SOBREGIRO', 'EN_PROCESO', 'TERMINADO', 'ELIMINADO', 'ANULADO') DEFAULT 'ACTIVO' COMMENT 'Estado del certificado de crédito'
AFTER estado_certificacion;

-- Agregar índice para búsquedas por estado_uso
ALTER TABLE certificaciones_credito 
ADD INDEX idx_estado_uso (estado_uso);

-- Agregar columna para tracking de monto utilizado vs certificado
ALTER TABLE certificaciones_credito 
ADD COLUMN monto_certificado DECIMAL(15, 2) DEFAULT 0 COMMENT 'Monto total certificado'
AFTER numero_documento;

ALTER TABLE certificaciones_credito 
ADD COLUMN monto_utilizado DECIMAL(15, 2) DEFAULT 0 COMMENT 'Monto total utilizado en comisiones'
AFTER monto_certificado;

-- Agregar fecha de cuando se marcó como terminado
ALTER TABLE certificaciones_credito 
ADD COLUMN fecha_terminado DATE COMMENT 'Fecha cuando se marcó como TERMINADO'
AFTER fecha_documento;

-- Agregar motivo de anulación si aplica
ALTER TABLE certificaciones_credito 
ADD COLUMN motivo_anulacion VARCHAR(500) COMMENT 'Razón por la cual se anuló'
AFTER justificacion;

-- ========== TRIGGER PARA ACTUALIZAR ESTADO_USO AUTOMÁTICAMENTE ==========

-- Trigger que se ejecuta cuando se actualiza detalles_certificacion_credito
DELIMITER $$

CREATE TRIGGER actualizar_estado_certificado_insert
AFTER INSERT ON detalles_certificacion_credito
FOR EACH ROW
BEGIN
  DECLARE monto_cert DECIMAL(15, 2);
  DECLARE monto_util DECIMAL(15, 2);
  DECLARE nuevo_estado VARCHAR(50);
  
  -- Obtener monto certificado
  SELECT monto_certificado INTO monto_cert
  FROM certificaciones_credito
  WHERE id = NEW.certificacion_credito_id;
  
  -- Calcular monto utilizado
  SELECT COALESCE(SUM(monto), 0) INTO monto_util
  FROM detalles_certificacion_credito
  WHERE certificacion_credito_id = NEW.certificacion_credito_id;
  
  -- Determinar nuevo estado
  IF monto_util > monto_cert THEN
    SET nuevo_estado = 'SOBREGIRO';
  ELSEIF monto_util = monto_cert THEN
    SET nuevo_estado = 'TERMINADO';
  ELSEIF monto_util > 0 THEN
    SET nuevo_estado = 'EN_PROCESO';
  ELSE
    SET nuevo_estado = 'ACTIVO';
  END IF;
  
  -- Actualizar el certificado
  UPDATE certificaciones_credito
  SET 
    monto_utilizado = monto_util,
    estado_uso = nuevo_estado,
    fecha_terminado = CASE WHEN nuevo_estado = 'TERMINADO' THEN CURDATE() ELSE fecha_terminado END
  WHERE id = NEW.certificacion_credito_id;
END$$

CREATE TRIGGER actualizar_estado_certificado_update
AFTER UPDATE ON detalles_certificacion_credito
FOR EACH ROW
BEGIN
  DECLARE monto_cert DECIMAL(15, 2);
  DECLARE monto_util DECIMAL(15, 2);
  DECLARE nuevo_estado VARCHAR(50);
  
  -- Obtener monto certificado
  SELECT monto_certificado INTO monto_cert
  FROM certificaciones_credito
  WHERE id = NEW.certificacion_credito_id;
  
  -- Calcular monto utilizado
  SELECT COALESCE(SUM(monto), 0) INTO monto_util
  FROM detalles_certificacion_credito
  WHERE certificacion_credito_id = NEW.certificacion_credito_id;
  
  -- Determinar nuevo estado
  IF monto_util > monto_cert THEN
    SET nuevo_estado = 'SOBREGIRO';
  ELSEIF monto_util = monto_cert THEN
    SET nuevo_estado = 'TERMINADO';
  ELSEIF monto_util > 0 THEN
    SET nuevo_estado = 'EN_PROCESO';
  ELSE
    SET nuevo_estado = 'ACTIVO';
  END IF;
  
  -- Actualizar el certificado
  UPDATE certificaciones_credito
  SET 
    monto_utilizado = monto_util,
    estado_uso = nuevo_estado,
    fecha_terminado = CASE WHEN nuevo_estado = 'TERMINADO' THEN CURDATE() ELSE fecha_terminado END
  WHERE id = NEW.certificacion_credito_id;
END$$

CREATE TRIGGER actualizar_estado_certificado_delete
AFTER DELETE ON detalles_certificacion_credito
FOR EACH ROW
BEGIN
  DECLARE monto_cert DECIMAL(15, 2);
  DECLARE monto_util DECIMAL(15, 2);
  DECLARE nuevo_estado VARCHAR(50);
  
  -- Obtener monto certificado
  SELECT monto_certificado INTO monto_cert
  FROM certificaciones_credito
  WHERE id = OLD.certificacion_credito_id;
  
  -- Calcular monto utilizado
  SELECT COALESCE(SUM(monto), 0) INTO monto_util
  FROM detalles_certificacion_credito
  WHERE certificacion_credito_id = OLD.certificacion_credito_id;
  
  -- Determinar nuevo estado
  IF monto_util > monto_cert THEN
    SET nuevo_estado = 'SOBREGIRO';
  ELSEIF monto_util = monto_cert THEN
    SET nuevo_estado = 'TERMINADO';
  ELSEIF monto_util > 0 THEN
    SET nuevo_estado = 'EN_PROCESO';
  ELSE
    SET nuevo_estado = 'ACTIVO';
  END IF;
  
  -- Actualizar el certificado
  UPDATE certificaciones_credito
  SET 
    monto_utilizado = monto_util,
    estado_uso = nuevo_estado,
    fecha_terminado = CASE WHEN nuevo_estado = 'TERMINADO' AND nuevo_estado != OLD.estado_uso THEN CURDATE() ELSE fecha_terminado END
  WHERE id = OLD.certificacion_credito_id;
END$$

DELIMITER ;

-- ========== VISTA ACTUALIZADA CON ESTADO_USO ==========

DROP VIEW IF EXISTS certificaciones_credito_detalladas;

CREATE OR REPLACE VIEW certificaciones_credito_detalladas AS
SELECT 
  cc.id,
  cc.nota,
  cc.mes,
  cc.fecha_aprobacion,
  cc.fecha_documento,
  cc.estado_certificacion,
  cc.estado_uso,
  cc.tipo_documento,
  cc.numero_documento,
  cc.justificacion,
  cc.monto_certificado,
  cc.monto_utilizado,
  (cc.monto_certificado - cc.monto_utilizado) as monto_disponible,
  ROUND((cc.monto_utilizado / NULLIF(cc.monto_certificado, 0) * 100), 2) as porcentaje_uso,
  cc.meta_id,
  m.nombre as meta_nombre,
  m.numero_meta,
  cc.fuente_financiamiento_id,
  ff.nombre as fuente_financiamiento_nombre,
  cc.usuario_id,
  u.nombre as usuario_nombre,
  cc.fecha_terminado,
  cc.motivo_anulacion,
  cc.created_at,
  cc.updated_at,
  COUNT(dcc.id) as total_detalles
FROM certificaciones_credito cc
LEFT JOIN metas m ON cc.meta_id = m.id
LEFT JOIN fuentes_financiamiento ff ON cc.fuente_financiamiento_id = ff.id
LEFT JOIN users u ON cc.usuario_id = u.id
LEFT JOIN detalles_certificacion_credito dcc ON cc.id = dcc.certificacion_credito_id
GROUP BY cc.id, cc.nota, cc.mes, cc.fecha_aprobacion, cc.fecha_documento, 
         cc.estado_certificacion, cc.estado_uso, cc.tipo_documento, cc.numero_documento, 
         cc.justificacion, cc.monto_certificado, cc.monto_utilizado,
         cc.meta_id, m.nombre, m.numero_meta,
         cc.fuente_financiamiento_id, ff.nombre, cc.usuario_id, u.nombre,
         cc.fecha_terminado, cc.motivo_anulacion,
         cc.created_at, cc.updated_at;
