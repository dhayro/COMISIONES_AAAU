-- Verificar estado de ambito_id en comisionados
-- Para usuario rflores (username='rflores')

SELECT 'PASO 1: Datos del usuario rflores' as paso;
SELECT id, username, nombre, rol, ambito_id 
FROM users 
WHERE username = 'rflores';

SELECT '' as espacios;
SELECT 'PASO 2: Tipo de ambito para rflores (AAA o ALA)' as paso;
SELECT a.id, a.nombre_corto, a.dependencia_id, 
       CASE WHEN a.dependencia_id IS NULL THEN 'AAA' ELSE 'ALA' END as tipo
FROM ambitos a
WHERE a.id = 1;  -- rflores tiene ambito_id=1

SELECT '' as espacios;
SELECT 'PASO 3: ALAs dependientes de AAA UCAYALI (ambito_id=1)' as paso;
SELECT id, nombre_corto, dependencia_id
FROM ambitos
WHERE dependencia_id = 1
ORDER BY id;

SELECT '' as espacios;
SELECT 'PASO 4: Usuarios en cada ámbito' as paso;
SELECT u.id, u.username, u.nombre, u.rol, u.ambito_id, a.nombre_corto
FROM users u
LEFT JOIN ambitos a ON u.ambito_id = a.id
WHERE u.ambito_id IN (1, 2, 3, 4, 5) OR u.ambito_id IS NULL
ORDER BY u.ambito_id, u.id;

SELECT '' as espacios;
SELECT 'PASO 5: Comisionados en comision_comisionados con sus ambitos' as paso;
SELECT cc.id, cc.comision_id, cc.usuario_id, 
       u.nombre as usuario_nombre, u.ambito_id,
       a.nombre_corto as ambito_nombre
FROM comision_comisionados cc
JOIN users u ON cc.usuario_id = u.id
LEFT JOIN ambitos a ON u.ambito_id = a.id
ORDER BY cc.comision_id, cc.usuario_id;

SELECT '' as espacios;
SELECT 'PASO 6: Comisiones con sus comisionados (vista completa)' as paso;
SELECT c.id as comision_id, c.lugar, c.ambito_id as comision_ambito,
       GROUP_CONCAT(CONCAT(u.nombre, ' (ámbito=', u.ambito_id, ')') SEPARATOR ', ') as comisionados
FROM comisiones c
LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
LEFT JOIN users u ON cc.usuario_id = u.id
GROUP BY c.id
ORDER BY c.id;
