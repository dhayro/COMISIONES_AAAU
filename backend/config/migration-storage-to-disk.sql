-- ========================================
-- MIGRACIÓN: De LONGBLOB a Almacenamiento en Disco
-- ========================================
-- Cambiar de guardar PDFs en BD a guardar en carpeta del servidor
-- Fecha: 2026-03-14
-- Versión: 1.0

-- PASO 1: Eliminar columna archivo_pdf (LONGBLOB) si existe
-- Nota: Si hay datos, primero hacer backup manual
ALTER TABLE certificaciones_credito 
DROP COLUMN IF EXISTS archivo_pdf;

-- PASO 2: Si no existe ruta_archivo_pdf, añadirla
ALTER TABLE certificaciones_credito 
ADD COLUMN IF NOT EXISTS ruta_archivo_pdf VARCHAR(500) 
  AFTER nombre_archivo_pdf 
  COMMENT 'Ruta relativa del PDF almacenado en disco: uploads/certificaciones/...';

-- PASO 3: Crear índice para búsquedas rápidas
ALTER TABLE certificaciones_credito 
ADD INDEX idx_ruta_archivo IF NOT EXISTS (ruta_archivo_pdf);

-- PASO 4: Añadir columna para saber si tiene PDF
ALTER TABLE certificaciones_credito 
ADD COLUMN IF NOT EXISTS tiene_pdf TINYINT(1) DEFAULT 0 
  AFTER ruta_archivo_pdf 
  COMMENT 'Flag rápido: 1=tiene PDF, 0=sin PDF';

-- PASO 5: Actualizar flag basado en si tiene ruta
UPDATE certificaciones_credito 
SET tiene_pdf = IF(ruta_archivo_pdf IS NOT NULL AND ruta_archivo_pdf != '', 1, 0);

-- PASO 6: Verificación
SELECT 
  COUNT(*) as total_certificaciones,
  SUM(IF(tiene_pdf = 1, 1, 0)) as con_pdf,
  SUM(IF(tiene_pdf = 0, 1, 0)) as sin_pdf
FROM certificaciones_credito;

-- PASO 7: Ver algunas filas para verificar
SELECT 
  id, 
  numero_documento, 
  nombre_archivo_pdf, 
  ruta_archivo_pdf, 
  tiene_pdf,
  updated_at
FROM certificaciones_credito 
WHERE ruta_archivo_pdf IS NOT NULL
LIMIT 10;

-- ========================================
-- MIGRACIÓN COMPLETADA
-- ========================================
-- La aplicación ahora:
-- 1. Guarda PDFs en: backend/uploads/certificaciones/
-- 2. Almacena ruta en BD (ej: uploads/certificaciones/cert_1_1710000000.pdf)
-- 3. Usa flag tiene_pdf para consultas rápidas
-- 4. Descarga desde disco, no desde BD
-- ========================================
