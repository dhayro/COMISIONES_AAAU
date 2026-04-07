-- SCRIPT PARA ASIGNAR AMBITO_ID A USUARIOS
-- Ejecuta esto en tu base de datos MySQL

-- Ver estado actual
SELECT id, username, nombre, ambito_id FROM users LIMIT 20;

-- Asignar rflores → ambito_id = 1 (AAA)
UPDATE users SET ambito_id = 1 WHERE username = 'rflores';

-- Asignar lrios → ambito_id = 3 (ALA ATALAYA)
UPDATE users SET ambito_id = 3 WHERE username = 'lrios';

-- Asignar admin → ambito_id = 1 (AAA)
UPDATE users SET ambito_id = 1 WHERE username = 'admin';

-- Asignar resto de usuarios a ambito_id = 1 por defecto (si no tienen asignado)
UPDATE users SET ambito_id = 1 WHERE ambito_id IS NULL;

-- Verificar resultado
SELECT id, username, nombre, ambito_id FROM users;
