-- Verificar ID de dkong
SELECT id, username, nombre, rol, ambito_id FROM users WHERE username = 'dkong';

-- Ver todas las comisiones de dkong como comisionado
SELECT 
    c.id as comision_id,
    c.lugar,
    c.aprobacion_estado,
    c.presupuesto_estado,
    cc.usuario_id as comisionado_id,
    u.username as comisionado_username,
    u.nombre as comisionado_nombre
FROM comisiones c
INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
INNER JOIN users u ON cc.usuario_id = u.id
WHERE u.username = 'dkong'
AND c.aprobacion_estado = 'APROBADA'
AND c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
ORDER BY c.id;

-- Ver el estado de las 4 comisiones que mencionaste
SELECT 
    c.id,
    c.lugar,
    c.aprobacion_estado,
    c.presupuesto_estado,
    GROUP_CONCAT(u.nombre SEPARATOR ', ') as comisionados
FROM comisiones c
LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
LEFT JOIN users u ON cc.usuario_id = u.id
WHERE c.lugar IN ('SAN PEDRO LAGARTO', 'PUERTO INCA', 'PRUSIA Y OXAPAMPA')
GROUP BY c.id
ORDER BY c.id;
