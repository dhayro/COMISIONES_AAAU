// ========== Controlador para Correlativo Control ==========
// Gestiona la tabla de control de correlativos por usuario/año

const { pool } = require('../config/database');

exports.obtenerControlCorrelativo = async (req, res) => {
  try {
    const { usuarioId, ano } = req.params;
    
    const [resultados] = await pool.query(
      `SELECT * FROM correlativo_control 
       WHERE usuario_id = ? AND ano = ? AND activo = 1`,
      [usuarioId, ano]
    );
    
    if (resultados.length === 0) {
      return res.status(404).json({ 
        error: 'No existe control de correlativo para este usuario y año',
        data: null 
      });
    }
    
    res.json({ 
      message: 'Control de correlativo obtenido',
      data: resultados[0] 
    });
  } catch (error) {
    console.error('❌ Error obteniendo control correlativo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.crearControlCorrelativo = async (req, res) => {
  try {
    const { usuario_id, ano, numero_inicial, prefijo, descripcion } = req.body;
    const creado_por = req.user?.id || 1;
    
    // Validar que no exista ya
    const [existentes] = await pool.query(
      `SELECT id FROM correlativo_control 
       WHERE usuario_id = ? AND ano = ?`,
      [usuario_id, ano]
    );
    
    if (existentes.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe control de correlativo para este usuario y año' 
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO correlativo_control 
       (usuario_id, ano, numero_inicial, numero_proximo, prefijo, descripcion, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, ano, numero_inicial, numero_inicial, prefijo || null, descripcion || null, creado_por]
    );
    
    res.status(201).json({ 
      message: 'Control de correlativo creado exitosamente',
      id: result.insertId 
    });
  } catch (error) {
    console.error('❌ Error creando control correlativo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarControlCorrelativo = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_inicial, numero_proximo, prefijo, descripcion, activo } = req.body;
    
    const actualizaciones = [];
    const valores = [];
    
    if (numero_inicial !== undefined) {
      actualizaciones.push('numero_inicial = ?');
      valores.push(numero_inicial);
    }
    if (numero_proximo !== undefined) {
      actualizaciones.push('numero_proximo = ?');
      valores.push(numero_proximo);
    }
    if (prefijo !== undefined) {
      actualizaciones.push('prefijo = ?');
      valores.push(prefijo);
    }
    if (descripcion !== undefined) {
      actualizaciones.push('descripcion = ?');
      valores.push(descripcion);
    }
    if (activo !== undefined) {
      actualizaciones.push('activo = ?');
      valores.push(activo);
    }
    
    if (actualizaciones.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    valores.push(id);
    
    const [result] = await pool.query(
      `UPDATE correlativo_control SET ${actualizaciones.join(', ')} WHERE id = ?`,
      valores
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Control de correlativo no encontrado' });
    }
    
    res.json({ 
      message: 'Control de correlativo actualizado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error actualizando control correlativo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.incrementarCorrelativo = async (req, res) => {
  try {
    const { usuarioId, ano } = req.params;
    
    // Obtener control actual
    const [controles] = await pool.query(
      `SELECT * FROM correlativo_control 
       WHERE usuario_id = ? AND ano = ? AND activo = 1`,
      [usuarioId, ano]
    );
    
    if (controles.length === 0) {
      return res.status(404).json({ 
        error: 'No existe control de correlativo para este usuario y año' 
      });
    }
    
    const control = controles[0];
    const proximoNumero = control.numero_proximo + 1;
    
    // Actualizar numero_proximo
    await pool.query(
      `UPDATE correlativo_control 
       SET numero_proximo = ? WHERE id = ?`,
      [proximoNumero, control.id]
    );
    
    res.json({ 
      message: 'Correlativo incrementado',
      numero_actual: control.numero_proximo,
      numero_proximo: proximoNumero
    });
  } catch (error) {
    console.error('❌ Error incrementando correlativo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.listarControlesCorrelativo = async (req, res) => {
  try {
    const { usuarioId } = req.query;
    
    let query = `SELECT cc.*, u.nombre as usuario_nombre 
                 FROM correlativo_control cc
                 JOIN users u ON cc.usuario_id = u.id
                 WHERE cc.activo = 1`;
    const valores = [];
    
    if (usuarioId) {
      query += ` AND cc.usuario_id = ?`;
      valores.push(usuarioId);
    }
    
    query += ` ORDER BY cc.ano DESC, u.nombre`;
    
    const [resultados] = await pool.query(query, valores);
    
    res.json({ 
      message: 'Controles de correlativo obtenidos',
      data: resultados,
      total: resultados.length 
    });
  } catch (error) {
    console.error('❌ Error listando controles correlativo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminarControlCorrelativo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      `UPDATE correlativo_control SET activo = 0 WHERE id = ?`,
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Control de correlativo no encontrado' });
    }
    
    res.json({ 
      message: 'Control de correlativo eliminado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error eliminando control correlativo:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Generar correlativo automático para todos los usuarios del año actual
exports.generarCorrelativosAuto = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const anoActual = new Date().getFullYear();
    console.log(`\n📋 Iniciando generación de correlativo para año ${anoActual}...`);
    
    // Obtener todos los usuarios activos con iniciales
    const [usuarios] = await connection.query(
      `SELECT id, nombre, iniciales FROM users WHERE activo = 1 AND iniciales IS NOT NULL ORDER BY nombre`
    );
    
    if (usuarios.length === 0) {
      return res.status(400).json({ error: 'No hay usuarios activos con iniciales' });
    }
    
    let generados = 0;
    let actualizados = 0;
    const correlativosGenerados = [];
    
    for (const usuario of usuarios) {
      try {
        // Verificar si ya existe correlativo para este usuario y año
        const [existentes] = await connection.query(
          `SELECT id, numero_proximo FROM correlativo_control 
           WHERE usuario_id = ? AND ano = ?`,
          [usuario.id, anoActual]
        );
        
        if (existentes.length > 0) {
          // Ya existe, solo actualizar
          actualizados++;
          correlativosGenerados.push({
            usuario: usuario.nombre,
            iniciales: usuario.iniciales,
            prefijo: usuario.iniciales,
            numero_proximo: existentes[0].numero_proximo,
            estado: 'Ya existía'
          });
        } else {
          // Crear nuevo correlativo
          const prefijo = usuario.iniciales || 'XXX';
          const numeroInicial = 1;
          
          await connection.query(
            `INSERT INTO correlativo_control 
             (usuario_id, ano, numero_inicial, numero_proximo, prefijo, descripcion, creado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario.id, anoActual, numeroInicial, numeroInicial, prefijo, `Correlativo ${anoActual} - ${usuario.nombre}`, 1]
          );
          
          generados++;
          correlativosGenerados.push({
            usuario: usuario.nombre,
            iniciales: usuario.iniciales,
            prefijo: prefijo,
            numero_proximo: numeroInicial,
            estado: 'Creado'
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${usuario.nombre}:`, error.message);
        correlativosGenerados.push({
          usuario: usuario.nombre,
          iniciales: usuario.iniciales,
          estado: 'Error',
          error: error.message
        });
      }
    }
    
    if (connection) connection.release();
    
    console.log(`✅ Generación completada: ${generados} creados, ${actualizados} existentes`);
    
    res.json({
      message: `Correlativo generados exitosamente`,
      ano: anoActual,
      creados: generados,
      actualizados: actualizados,
      total_usuarios: usuarios.length,
      detalles: correlativosGenerados
    });
  } catch (error) {
    console.error('❌ Error generando correlativo:', error.message);
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
};

// Obtener próximo número de documento para un usuario
exports.obtenerProximoNumero = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const anoActual = new Date().getFullYear();
    
    const [controles] = await pool.query(
      `SELECT id, numero_proximo, prefijo FROM correlativo_control 
       WHERE usuario_id = ? AND ano = ? AND activo = 1`,
      [usuarioId, anoActual]
    );
    
    if (controles.length === 0) {
      return res.status(404).json({ 
        error: 'No existe control de correlativo para este usuario' 
      });
    }
    
    const control = controles[0];
    // Formato: NUMERO_SECUENCIAL-INICIALES-AÑO (ejemplo: 001-DKT-2026)
    const numeroDocumento = `${String(control.numero_proximo).padStart(3, '0')}-${control.prefijo}-${anoActual}`;
    
    res.json({
      message: 'Próximo número obtenido',
      numeroDocumento: numeroDocumento,
      prefijo: control.prefijo,
      numero: control.numero_proximo,
      ano: anoActual
    });
  } catch (error) {
    console.error('❌ Error obteniendo próximo número:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Resetear correlativo al número inicial (para limpiar)
exports.resetearCorrelativoAno = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const anoActual = new Date().getFullYear();
    
    console.log(`\n🔄 Reseteando correlativo para año ${anoActual}...`);
    
    // Limpiar todos los correlativo del año actual
    const [result] = await connection.query(
      `UPDATE correlativo_control SET numero_proximo = numero_inicial WHERE ano = ?`,
      [anoActual]
    );
    
    console.log(`✅ ${result.affectedRows} correlativo reseteados`);
    
    if (connection) connection.release();
    
    res.json({
      message: `Correlativo reseteados para año ${anoActual}`,
      ano: anoActual,
      reseteados: result.affectedRows
    });
  } catch (error) {
    console.error('❌ Error reseteando correlativo:', error.message);
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
};
