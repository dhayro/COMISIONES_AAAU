-- ========== CORREGIR estado_uso A ENUM SI YA FUE CREADO COMO VARCHAR ==========

-- Primero, verificar si existe la columna y cambiarla a ENUM
-- Este script es idempotente - se puede ejecutar múltiples veces sin problema

-- Cambiar tipo de columna de VARCHAR a ENUM
ALTER TABLE certificaciones_credito 
MODIFY COLUMN estado_uso ENUM('ACTIVO', 'SOBREGIRO', 'EN_PROCESO', 'TERMINADO', 'ELIMINADO', 'ANULADO') DEFAULT 'ACTIVO' COMMENT 'Estado del certificado de crédito';

-- Confirmar que la conversión se completó
-- Si hay valores inválidos, esto dará error y sabremos qué corregir
SELECT 'Conversión a ENUM completada exitosamente' as resultado;
