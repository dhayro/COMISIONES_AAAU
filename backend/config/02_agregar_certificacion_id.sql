-- ============================================================
-- MIGRACIÓN: Agregar campo certificacion_id a formato_emisiones
-- Descripción: Permite vincular formatos con certificaciones
-- Fecha: 21 de Marzo, 2026
-- ============================================================

ALTER TABLE formato_emisiones ADD COLUMN certificacion_id INT NULL COMMENT 'Referencia a la certificación de crédito usada';
ALTER TABLE formato_emisiones ADD INDEX idx_certificacion_id (certificacion_id);
