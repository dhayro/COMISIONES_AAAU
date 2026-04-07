-- ============================================================
-- MIGRACIÓN: Agregar fuente_financiamiento_id a formato_emisiones
-- Fecha: 31 de Marzo de 2026
-- Descripción: Permite elegir Fuente de Financiamiento desde modal
--              sin necesidad de tener una Certificación previamente
-- ============================================================

-- 1. Agregar columna fuente_financiamiento_id
ALTER TABLE `formato_emisiones` 
ADD COLUMN `fuente_financiamiento_id` int(11) DEFAULT NULL COMMENT 'Referencia a la fuente de financiamiento',
ADD KEY `idx_fuente_financiamiento` (`fuente_financiamiento_id`);

-- 2. Agregar constraint de foreign key
ALTER TABLE `formato_emisiones` 
ADD CONSTRAINT `formato_emisiones_ibfk_6` 
FOREIGN KEY (`fuente_financiamiento_id`) 
REFERENCES `fuentes_financiamiento` (`id`) 
ON DELETE SET NULL;

-- ============================================================
-- Cambios en Backend
-- ============================================================
-- 1. Em formatoEmisionController.js - Agregar fuente_financiamiento_id al guardar:
--    fuente_financiamiento_id: req.body.fuente_financiamiento_id || null

-- 2. En FormatoEmision.js model - Agregar fuente_financiamiento_id a INSERT:
--    VALUES (?, ?, ?, ?, ?, ?, ?, ..., ?, ?)
--    donde el penúltimo ? es fuente_financiamiento_id

-- ============================================================
-- Cambios en Frontend (EmisionFormatos.js)
-- ============================================================
-- 1. Agregado estado: fuente_financiamiento_id en formValues
-- 2. Agregado estado: fuentesFinanciamientoDisponibles
-- 3. Agregada función: cargarFuentesFinanciamiento()
-- 4. Agregado selector: Autocomplete para Fuente de Financiamiento
--    - Muestra: abreviatura - nombre
--    - Posición: Después del selector de META
--    - Opcional: Permite elegir sin Certificación

-- ============================================================
-- Verificación
-- ============================================================
DESC `formato_emisiones`;
-- Verificar que aparezca la columna fuente_financiamiento_id

-- Ver estructura de constraint
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'formato_emisiones' AND COLUMN_NAME = 'fuente_financiamiento_id';

-- Ver datos disponibles
SELECT * FROM `fuentes_financiamiento` LIMIT 10;
