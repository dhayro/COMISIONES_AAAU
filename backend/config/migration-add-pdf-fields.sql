-- Migración: Agregar campos de PDF a certificaciones_credito
-- Fecha: 2026-03-14

-- Agregar columna archivo_pdf si no existe
ALTER TABLE certificaciones_credito 
ADD COLUMN IF NOT EXISTS archivo_pdf LONGBLOB COMMENT 'Archivo PDF subido';

-- Agregar columna nombre_archivo_pdf si no existe
ALTER TABLE certificaciones_credito 
ADD COLUMN IF NOT EXISTS nombre_archivo_pdf VARCHAR(255) COMMENT 'Nombre original del PDF';

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tiene_pdf ON certificaciones_credito(archivo_pdf IS NOT NULL);

-- Registrar la migración
INSERT INTO migraciones (nombre, fecha_ejecutada) 
VALUES ('Agregar campos PDF a certificaciones', NOW())
ON DUPLICATE KEY UPDATE fecha_ejecutada = NOW();
