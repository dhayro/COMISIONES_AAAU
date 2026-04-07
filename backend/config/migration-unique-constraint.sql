-- ========== MIGRACIÓN: ACTUALIZAR RESTRICCIÓN DE UNICIDAD ==========
-- Cambiar de UNIQUE en numero_documento a UNIQUE en (nota, mes, numero_documento)
-- Fecha: 2026-03-14

-- Paso 1: Eliminar el índice UNIQUE anterior (si existe)
ALTER TABLE certificaciones_credito DROP INDEX IF EXISTS numero_documento;

-- Paso 2: Agregar nueva restricción UNIQUE compuesta
ALTER TABLE certificaciones_credito 
ADD CONSTRAINT unique_nota_mes_documento UNIQUE (nota, mes, numero_documento);

-- Verificación
SELECT 'Migration completada: Restricción UNIQUE actualizada a (nota, mes, numero_documento)' as status;
