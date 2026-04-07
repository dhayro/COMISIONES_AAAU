-- ============================================================
-- MIGRACIÓN: Agregar campo certificacion_id a formato_emisiones
-- Descripción: Permite vincular formatos con certificaciones
-- Fecha: 21 de Marzo, 2026
-- ============================================================

-- 1️⃣ Verificar si la columna ya existe
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'formato_emisiones' AND COLUMN_NAME = 'certificacion_id';

-- 2️⃣ 🆕 Usar stored procedure para agregar la columna de forma segura si no existe
DELIMITER $$

DROP PROCEDURE IF EXISTS agregar_certificacion_id_si_no_existe$$

CREATE PROCEDURE agregar_certificacion_id_si_no_existe()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Verificar si la columna ya existe
    IF NOT EXISTS(
        SELECT NULL FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'formato_emisiones' 
        AND COLUMN_NAME = 'certificacion_id'
    ) THEN
        -- Agregar la columna si no existe
        ALTER TABLE formato_emisiones 
        ADD COLUMN certificacion_id INT NULL COMMENT 'Referencia a la certificación de crédito usada' 
        AFTER meta_id;
        
        SELECT '✅ Columna certificacion_id agregada exitosamente' AS resultado;
    ELSE
        SELECT '⚠️ La columna certificacion_id ya existe' AS resultado;
    END IF;
    
    -- Agregar índice si no existe
    IF NOT EXISTS(
        SELECT NULL FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'formato_emisiones' 
        AND COLUMN_NAME = 'certificacion_id' 
        AND INDEX_NAME = 'idx_certificacion_id'
    ) THEN
        ALTER TABLE formato_emisiones 
        ADD INDEX idx_certificacion_id (certificacion_id);
        
        SELECT '✅ Índice idx_certificacion_id creado exitosamente' AS resultado;
    ELSE
        SELECT '⚠️ El índice idx_certificacion_id ya existe' AS resultado;
    END IF;
END$$

DELIMITER ;

-- 3️⃣ Ejecutar el stored procedure
CALL agregar_certificacion_id_si_no_existe();

-- 4️⃣ Limpiar: Eliminar el stored procedure después de ejecutarlo
DROP PROCEDURE IF EXISTS agregar_certificacion_id_si_no_existe;

-- 5️⃣ Verificar cambios (opcional)
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'formato_emisiones' 
-- AND COLUMN_NAME = 'certificacion_id';

-- Fin de la migración ✅
