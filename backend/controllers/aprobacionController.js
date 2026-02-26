const { pool } = require('../config/database');

// Obtener comisiones pendientes de aprobación
exports.obtenerPendientesAprobacion = async (req, res) => {
  try {
    // Restringir visibilidad: solo 'jefe' o 'admin' pueden ver pendientes
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const [userRows] = await pool.query('SELECT rol FROM users WHERE id = ?', [userId]);
    const rol = userRows[0]?.rol;
    if (!['jefe', 'admin'].includes(rol)) {
      // Devolver lista vacía para usuarios sin permiso
      return res.json([]);
    }

    const [comisiones] = await pool.query(`
      SELECT 
        c.id,
        c.lugar,
        c.modalidad_viaje,
        c.fecha_salida,
        c.fecha_retorno,
        c.num_dias,
        c.costo_xdia,
        c.costo_total_comision,
        c.observacion,
        c.aprobacion_estado,
        c.creado_en,
        u.nombre as usuario_nombre,
        u.username as usuario_username,
        a.nombre_corto as ambito_nombre
      FROM comisiones c
      JOIN users u ON c.usuario_id = u.id
      JOIN ambitos a ON c.ambito_id = a.id
      WHERE c.aprobacion_estado = 'PENDIENTE_APROBACION'
      ORDER BY c.creado_en DESC
    `);

    res.json(comisiones);
  } catch (error) {
    console.error('Error al obtener comisiones pendientes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de aprobaciones
exports.obtenerHistorialAprobaciones = async (req, res) => {
  try {
    const [aprobaciones] = await pool.query(`
      SELECT 
        c.id,
        c.lugar,
        c.modalidad_viaje,
        c.fecha_salida,
        c.fecha_retorno,
        c.aprobacion_estado,
        c.fecha_aprobacion,
        c.observacion_aprobacion,
        u.nombre as usuario_nombre,
        u.username as usuario_username,
        jefe.nombre as aprobado_por_nombre,
        a.nombre_corto as ambito_nombre
      FROM comisiones c
      JOIN users u ON c.usuario_id = u.id
      JOIN ambitos a ON c.ambito_id = a.id
      LEFT JOIN users jefe ON c.aprobado_por = jefe.id
      WHERE c.aprobacion_estado IN ('APROBADA', 'RECHAZADA')
      ORDER BY c.fecha_aprobacion DESC
      LIMIT 50
    `);

    res.json(aprobaciones);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: error.message });
  }
};

// Aprobar comisión
exports.aprobarComision = async (req, res) => {
  const { comisionId } = req.params;
  const { observacion } = req.body;
  const userId = req.user.id;

  try {
    // Verificar que el usuario es jefe o admin
    const [user] = await pool.query('SELECT rol FROM users WHERE id = ?', [userId]);
    if (!user[0] || !['jefe', 'admin'].includes(user[0].rol)) {
      return res.status(403).json({ error: 'No tienes permisos para aprobar comisiones' });
    }

    // Actualizar comisión
    await pool.query(`
      UPDATE comisiones 
      SET 
        aprobacion_estado = 'APROBADA',
        aprobado_por = ?,
        fecha_aprobacion = NOW(),
        observacion_aprobacion = ?
      WHERE id = ? AND aprobacion_estado = 'PENDIENTE_APROBACION'
    `, [userId, observacion || null, comisionId]);

    res.json({ 
      success: true, 
      message: 'Comisión aprobada correctamente' 
    });
  } catch (error) {
    console.error('Error al aprobar comisión:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechazar comisión
exports.rechazarComision = async (req, res) => {
  const { comisionId } = req.params;
  const { observacion } = req.body;
  const userId = req.user.id;

  try {
    // Verificar que el usuario es jefe o admin
    const [user] = await pool.query('SELECT rol FROM users WHERE id = ?', [userId]);
    if (!user[0] || !['jefe', 'admin'].includes(user[0].rol)) {
      return res.status(403).json({ error: 'No tienes permisos para rechazar comisiones' });
    }

    // Actualizar comisión
    await pool.query(`
      UPDATE comisiones 
      SET 
        aprobacion_estado = 'RECHAZADA',
        aprobado_por = ?,
        fecha_aprobacion = NOW(),
        observacion_aprobacion = ?
      WHERE id = ? AND aprobacion_estado = 'PENDIENTE_APROBACION'
    `, [userId, observacion || null, comisionId]);

    res.json({ 
      success: true, 
      message: 'Comisión rechazada correctamente' 
    });
  } catch (error) {
    console.error('Error al rechazar comisión:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas de aprobaciones
exports.obtenerEstadisticas = async (req, res) => {
  try {
    // Restringir visibilidad: solo 'jefe' o 'admin' ven estadísticas reales
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const [userRows] = await pool.query('SELECT rol FROM users WHERE id = ?', [userId]);
    const rol = userRows[0]?.rol;
    if (!['jefe', 'admin'].includes(rol)) {
      return res.json({ pendientes: 0, aprobadas: 0, rechazadas: 0, total: 0 });
    }

    const [stats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN aprobacion_estado = 'PENDIENTE_APROBACION' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN aprobacion_estado = 'APROBADA' THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN aprobacion_estado = 'RECHAZADA' THEN 1 ELSE 0 END) as rechazadas,
        COUNT(*) as total
      FROM comisiones
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};
