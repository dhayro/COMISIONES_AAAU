-- ========== SCRIPT: Inicializar Correlativos ==========
-- Este script crea controles iniciales de correlativo para todos los usuarios del sistema
-- Todos comienzan desde 001 en 2026
-- Ejecutar DESPUÉS de que la tabla correlativo_control exista

-- 🆕 Crear controles para TODOS los usuarios en 2026 comenzando en 001
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion, creado_por)
SELECT u.id, 2026, 1, 1, CONCAT(u.nombre, ' - Año 2026'), 1
FROM users u
WHERE u.activo = 1
  AND u.id NOT IN (SELECT usuario_id FROM correlativo_control WHERE ano = 2026)
ON DUPLICATE KEY UPDATE 
  numero_inicial = VALUES(numero_inicial),
  numero_proximo = VALUES(numero_proximo);

-- Verificar que se crearon correctamente
SELECT u.nombre, cc.ano, cc.numero_inicial, cc.numero_proximo, cc.descripcion
FROM correlativo_control cc
JOIN users u ON cc.usuario_id = u.id
WHERE cc.ano = 2026
ORDER BY u.nombre;

-- ========== PERSONALIZACIONES OPCIONALES ==========

-- Si ALGUNOS usuarios necesitan comenzar en números diferentes:
-- Descomentar y modificar según sea necesario

-- Ejemplo: Usuario "Diego Torres" comienza en 100 (no 1)
-- UPDATE correlativo_control 
-- SET numero_inicial = 100, numero_proximo = 100
-- WHERE usuario_id IN (SELECT id FROM users WHERE nombre LIKE '%Diego Torres%')
--   AND ano = 2026;

-- Ejemplo: Usuario "Juan García" comienza en 500
-- UPDATE correlativo_control 
-- SET numero_inicial = 500, numero_proximo = 500
-- WHERE usuario_id IN (SELECT id FROM users WHERE nombre LIKE '%Juan García%')
--   AND ano = 2026;

-- ========== RESET: Resetear a número inicial si es necesario ==========
-- Descomentar si necesitas volver a 001 sin eliminar el registro

-- UPDATE correlativo_control 
-- SET numero_proximo = numero_inicial
-- WHERE ano = 2026 AND usuario_id = (SELECT id FROM users WHERE nombre LIKE '%Diego Torres%' LIMIT 1);

-- ========== VERIFICACIÓN FINAL ==========
SELECT 
  u.nombre,
  cc.ano,
  cc.numero_inicial,
  cc.numero_proximo,
  CONCAT(
    LPAD(cc.numero_proximo, 3, '0'), '-',
    UPPER(SUBSTRING(u.nombre, 1, 1)), 
    IF(LOCATE(' ', u.nombre) > 0, UPPER(SUBSTRING(u.nombre, LOCATE(' ', u.nombre) + 1, 1)), UPPER(SUBSTRING(u.nombre, 2, 1))),
    '-',
    cc.ano
  ) AS proximo_numero_formato,
  cc.descripcion
FROM correlativo_control cc
JOIN users u ON cc.usuario_id = u.id
WHERE cc.activo = 1
ORDER BY cc.ano DESC, u.nombre;
