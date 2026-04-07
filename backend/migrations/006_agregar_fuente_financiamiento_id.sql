-- ============================================================
-- MIGRACIÓN 006: Agregar fuente_financiamiento_id a formato_emisiones
-- Fecha: 31 de Marzo de 2026
-- Descripción: Permite seleccionar Fuente de Financiamiento
--              sin necesidad de Certificación
-- ============================================================

-- 1. Verificar si la columna ya existe
SET @dbname = DATABASE();
SET @tablename = "formato_emisiones";
SET @columnname = "fuente_financiamiento_id";
SET @preparedStatement = (
  SELECT IF((
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (TABLE_NAME = @tablename)
    AND (TABLE_SCHEMA = @dbname)
    AND (COLUMN_NAME = @columnname)
  ) > 0, "SELECT 1", CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT(11) DEFAULT NULL COMMENT 'Referencia a la fuente de financiamiento'"))
);

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Agregar índice si no existe
SET @indexname = "idx_fuente_financiamiento";
SET @indexCheck = (
  SELECT IF((
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = @indexname
  ) > 0, "SELECT 1", CONCAT("ALTER TABLE ", @tablename, " ADD KEY ", @indexname, " (", @columnname, ")"))
);

PREPARE stmt FROM @indexCheck;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Agregar constraint de foreign key si no existe
SET @constraintname = "formato_emisiones_ibfk_6";
SET @constraintCheck = (
  SELECT IF((
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_NAME = @constraintname
  ) > 0, "SELECT 1", CONCAT(
    "ALTER TABLE ", @tablename, 
    " ADD CONSTRAINT ", @constraintname,
    " FOREIGN KEY (", @columnname, ")",
    " REFERENCES fuentes_financiamiento (id) ON DELETE SET NULL"
  ))
);

PREPARE stmt FROM @constraintCheck;
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
AND COLUMN_NAME IN ('fuente_financiamiento_id', 'certificacion_id')
ORDER BY ORDINAL_POSITION;
