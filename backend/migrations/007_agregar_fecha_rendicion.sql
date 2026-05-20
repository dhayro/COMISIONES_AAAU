-- ============================================================
-- MIGRACIÓN 007: Agregar fecha_rendicion a formato_emisiones
-- Fecha: 20 de Mayo de 2026
-- Descripción: Registra la fecha y hora cuando se envía
--              la rendición de cuentas
-- ============================================================

-- 1. Verificar si la columna ya existe
SET @dbname = DATABASE();
SET @tablename = "formato_emisiones";
SET @columnname = "fecha_rendicion";
SET @preparedStatement = (
  SELECT IF((
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (TABLE_NAME = @tablename)
    AND (TABLE_SCHEMA = @dbname)
    AND (COLUMN_NAME = @columnname)
  ) > 0, "SELECT 1", CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " DATETIME NULL COMMENT 'Fecha y hora cuando se envía la rendición'"))
);

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- Validación post-migración
-- ============================================================
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'formato_emisiones'
AND COLUMN_NAME IN ('fecha_rendicion', 'estado_emision')
ORDER BY ORDINAL_POSITION;
