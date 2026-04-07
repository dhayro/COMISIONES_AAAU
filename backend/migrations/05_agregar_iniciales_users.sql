-- ========== MIGRACIÓN: Agregar campo iniciales a tabla users ==========
-- Descripción: Agrega el campo de iniciales para usar en la generación de correlativo
-- Fecha: 2026-03-29

ALTER TABLE users 
ADD COLUMN iniciales VARCHAR(10) AFTER nombre;

-- Actualizar iniciales automáticamente basadas en el nombre
UPDATE users 
SET iniciales = CONCAT(
  UPPER(LEFT(SUBSTRING_INDEX(nombre, ' ', 1), 1)),
  UPPER(LEFT(SUBSTRING_INDEX(SUBSTRING_INDEX(nombre, ' ', 2), ' ', -1), 1))
)
WHERE iniciales IS NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_iniciales ON users(iniciales);
