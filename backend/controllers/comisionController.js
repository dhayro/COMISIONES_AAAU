const Comision = require('../models/Comision');
const Ambito = require('../models/Ambito');
const Clasificador = require('../models/Clasificador');
const User = require('../models/User');

// Crear comisión
exports.crearComision = async (req, res) => {
  try {
    const {
      ambito_id,
      meta_id,
      costo_viaje_id,
      lugar,
      ruta,
      modalidad_viaje,
      fecha_salida,
      fecha_retorno,
      num_dias,
      costo_xdia,
      observacion,
      presupuesto_estado,
      presupuesto_documento
    } = req.body;

    // Validaciones
    if (!ambito_id || !lugar || !fecha_salida || !fecha_retorno || !num_dias || !costo_xdia) {
      return res.status(400).json({
        error: 'Faltan campos requeridos'
      });
    }

    // Normalizar fechas al formato YYYY-MM-DD (local, sin zona horaria)
    const normalizarFecha = (fecha) => {
      if (!fecha) return null;
      // Si es string en formato ISO, extraer solo la parte de fecha
      if (typeof fecha === 'string') {
        return fecha.substring(0, 10);
      }
      return fecha;
    };

    const fechaSalidaNormalizada = normalizarFecha(fecha_salida);
    const fechaRetornoNormalizada = normalizarFecha(fecha_retorno);

    // Verificar que el ámbito existe
    const ambito = await Ambito.obtenerPorId(ambito_id);
    if (!ambito) {
      return res.status(404).json({
        error: 'Ámbito no encontrado'
      });
    }

    const comisionId = await Comision.crear({
      ambito_id,
      meta_id: meta_id || null,
      costo_viaje_id: costo_viaje_id || null,
      lugar,
      ruta,
      modalidad_viaje: modalidad_viaje || 'TERRESTRE',
      fecha_salida: fechaSalidaNormalizada,
      fecha_retorno: fechaRetornoNormalizada,
      num_dias,
      costo_xdia,
      observacion,
      usuario_id: req.user.id,
      presupuesto_estado: presupuesto_estado || 'PRESUPUESTO POR ASIGNAR',
      presupuesto_documento: presupuesto_documento || null
    });

    // Obtener la comisión completa con todos los detalles
    const comisionCompleta = await Comision.obtenerPorId(comisionId);

    res.status(201).json({
      mensaje: 'Comisión creada exitosamente',
      ...comisionCompleta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener comisión por ID
exports.obtenerComision = async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/database');

    // Obtener datos básicos de la comisión
    const [comision] = await pool.query(
      `SELECT c.* FROM comisiones c WHERE c.id = ?`,
      [id]
    );

    if (!comision || comision.length === 0) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    const comisionData = comision[0];

    // Obtener comisionados con desglose por clasificador
    // Usamos la lógica correcta: días × costo_xdia para VIÁTICOS, monto directo para otros
    const [comisionadosRows] = await pool.query(
      `SELECT
        cc.id,
        cc.usuario_id,
        u.nombre as usuario_nombre,
        u.ambito_id,
        a.nombre_largo as ambito_nombre,
        u.cargo_id,
        cargo.nombre as cargo_nombre,
        cl.id as clasificador_id,
        cl.partida,
        cl.nombre as clasificador_nombre,
        cc.dias,
        cc.costo_xdia,
        cc.monto
       FROM comision_comisionados cc
       JOIN users u ON cc.usuario_id = u.id
       LEFT JOIN ambitos a ON u.ambito_id = a.id
       LEFT JOIN cargos cargo ON u.cargo_id = cargo.id
       JOIN clasificadores cl ON cc.clasificador_id = cl.id
       WHERE cc.comision_id = ?
       ORDER BY u.nombre, cl.partida`,
      [id]
    );

    // Agrupar comisionados y armar matriz de montos
    const comisionadosMap = {};
    const clasificadoresSet = new Map();

    comisionadosRows.forEach((row) => {
      // Calcular el monto correcto (igual lógica que en Comision.calcularMontoReal)
      let montoReal = row.monto;
      if (row.clasificador_nombre && row.clasificador_nombre.includes('VIÁTICOS')) {
        montoReal = (parseFloat(row.dias) || 0) * (parseFloat(row.costo_xdia) || 0);
      } else {
        montoReal = parseFloat(row.monto) || 0;
      }

      // Agrupar por usuario
      if (!comisionadosMap[row.usuario_id]) {
        comisionadosMap[row.usuario_id] = {
          usuario_id: row.usuario_id,
          usuario_nombre: row.usuario_nombre,
          ambito_id: row.ambito_id,
          ambito_nombre: row.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA',
          cargo_id: row.cargo_id,
          cargo_nombre: row.cargo_nombre,
          montos_por_clasificador: {},
          monto_total: 0,
        };
      }
      comisionadosMap[row.usuario_id].montos_por_clasificador[row.clasificador_id] = montoReal;
      comisionadosMap[row.usuario_id].monto_total += montoReal;

      // Registrar clasificadores únicos
      if (!clasificadoresSet.has(row.clasificador_id)) {
        clasificadoresSet.set(row.clasificador_id, {
          id: row.clasificador_id,
          nombre: row.clasificador_nombre,
          partida: row.partida,
          monto_total: 0
        });
      }
    });

    // Calcular totales por clasificador
    const comisionados = Object.values(comisionadosMap);
    const clasificadores = Array.from(clasificadoresSet.values());

    clasificadores.forEach(clf => {
      clf.monto_total = comisionados.reduce((sum, com) => {
        return sum + (com.montos_por_clasificador[clf.id] || 0);
      }, 0);
    });

    const monto_total = comisionados.reduce((sum, c) => sum + c.monto_total, 0);

    res.json({
      ...comisionData,
      comisionados,
      comisionados_detalle: comisionadosRows, // 🆕 Agregar detalles sin agrupar para frontend
      clasificadores: clasificadores.sort((a, b) => (a.partida || '').localeCompare(b.partida || '')),
      monto_total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar comisiones
exports.listarComisiones = async (req, res) => {
  try {
    const { solo_mias } = req.query;
    const rolUsuario = req.user.rol;
    const userAmbitoId = req.user.ambito_id;
    
    // Si es usuario regular, SIEMPRE ve solo sus propias comisiones
    // Si es administrativo, ve comisiones APROBADAS de su ámbito (y ALAs si es AAA)
    // Si es jefe o admin, ve todas las comisiones aprobadas (o todas si admin)
    
    let usuarioId = null;
    
    if (rolUsuario === 'usuario') {
      // Los usuarios regulares SIEMPRE ven solo sus comisiones
      usuarioId = req.user.id;
    } else if (solo_mias === 'true') {
      // Otros roles pueden forzar solo_mias si lo desean
      usuarioId = req.user.id;
    }
    
    const comisiones = await Comision.listar(usuarioId, rolUsuario, userAmbitoId);
    res.json(comisiones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar comisión
exports.actualizarComision = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Obtener la comisión actual para verificar su estado
    const comisionActual = await Comision.obtenerPorId(id);
    
    if (!comisionActual) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    // Si la comisión está RECHAZADA y se está editando, cambiarla a PENDIENTE_APROBACION
    // y limpiar la observación de aprobación
    if (comisionActual.aprobacion_estado === 'RECHAZADA') {
      data.aprobacion_estado = 'PENDIENTE_APROBACION';
      data.observacion_aprobacion = ''; // Limpiar el mensaje de rechazo
      console.log('🔄 Comisión RECHAZADA detectada. Reactivando a PENDIENTE_APROBACION...');
    }

    // Validar que no se intente asignar presupuesto sin aprobación previa
    if (data.presupuesto_estado === 'PRESUPUESTO ASIGNADO') {
      if (comisionActual.aprobacion_estado !== 'APROBADA' && data.aprobacion_estado !== 'APROBADA') {
        return res.status(400).json({
          error: 'No se puede asignar presupuesto a una comisión no aprobada',
          detalle: `Estado de aprobación actual: ${comisionActual.aprobacion_estado}. Debe estar en estado APROBADA`
        });
      }
    }

    // Normalizar fechas al formato YYYY-MM-DD (local, sin zona horaria)
    const normalizarFecha = (fecha) => {
      if (!fecha) return null;
      // Si es string en formato ISO, extraer solo la parte de fecha
      if (typeof fecha === 'string') {
        return fecha.substring(0, 10);
      }
      return fecha;
    };

    const dataConFechasNormalizadas = {
      ...data,
      fecha_salida: data.fecha_salida ? normalizarFecha(data.fecha_salida) : data.fecha_salida,
      fecha_retorno: data.fecha_retorno ? normalizarFecha(data.fecha_retorno) : data.fecha_retorno,
    };

    await Comision.actualizar(id, dataConFechasNormalizadas);

    // Retornar la comisión actualizada completa
    const comisionActualizada = await Comision.obtenerPorId(id);

    res.json({
      mensaje: 'Comisión actualizada exitosamente',
      ...comisionActualizada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar comisión
exports.eliminarComision = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Comision.eliminar(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    res.json({ mensaje: 'Comisión eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Agregar comisionado a comisión
exports.agregarComisionado = async (req, res) => {
  try {
    const { comision_id } = req.params;
    const {
      usuario_id,
      clasificador_id,
      dias,
      costo_xdia,
      monto,
      descripcion,
      observacion
    } = req.body;

    // Validaciones
    if (!usuario_id || !clasificador_id || !dias || !costo_xdia || !monto) {
      return res.status(400).json({
        error: 'Faltan campos requeridos'
      });
    }

    // Verificar que la comisión existe
    const comision = await Comision.obtenerPorId(comision_id);
    if (!comision) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    // Verificar que el usuario existe
    const usuario = await User.obtenerPorId(usuario_id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el clasificador existe
    const clasificador = await Clasificador.obtenerPorId(clasificador_id);
    if (!clasificador) {
      return res.status(404).json({ error: 'Clasificador no encontrado' });
    }

    const comisionadoId = await Comision.agregarComisionado({
      comision_id,
      usuario_id,
      clasificador_id,
      dias,
      costo_xdia,
      monto,
      descripcion,
      observacion
    });

    console.log(`\n➕ COMISIONADO AGREGADO:`);
    console.log(`   ID Comisión: ${comision_id}`);
    console.log(`   ID Comisionado: ${comisionadoId}`);
    console.log(`   Monto guardado: ${monto}`);

    // Recalcular total
    await Comision.recalcularTotal(comision_id);

    res.status(201).json({
      mensaje: 'Comisionado agregado exitosamente',
      id: comisionadoId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener comisionados de una comisión
exports.obtenerComisionados = async (req, res) => {
  try {
    const { comision_id } = req.params;
    const comisionados = await Comision.obtenerComisionados(comision_id);
    res.json(comisionados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar comisionado
exports.actualizarComisionado = async (req, res) => {
  try {
    // Soportar ambas rutas: /comisionados/:id y /comisiones/:comision_id/comisionados/:comisionado_id
    const id = req.params.comisionado_id || req.params.id;
    const data = req.body;

    console.log(`\n� ACTUALIZANDO COMISIONADO ID ${id}:`);
    console.log(`   Datos recibidos:`, data);

    await Comision.actualizarComisionado(id, data);

    // Obtener el comisionado para saber la comisión
    const [comisionado] = await (require('../config/database').pool).query(
      'SELECT comision_id FROM comision_comisionados WHERE id = ?',
      [id]
    );

    if (comisionado.length > 0) {
      const comisionId = comisionado[0].comision_id;
      console.log(`   Comisión asociada: ${comisionId}`);
      await Comision.recalcularTotal(comisionId);
    }

    console.log(`✅ ACTUALIZACIÓN COMPLETADA\n`);

    res.json({ mensaje: 'Comisionado actualizado exitosamente' });
  } catch (error) {
    console.error('❌ ERROR EN ACTUALIZACIÓN:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar comisionado
exports.eliminarComisionado = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el comisionado antes de eliminarlo
    const [comisionado] = await (require('../config/database').pool).query(
      'SELECT comision_id, monto FROM comision_comisionados WHERE id = ?',
      [id]
    );

    console.log(`\n🗑️  ELIMINANDO COMISIONADO ID ${id}:`);
    if (comisionado.length > 0) {
      console.log(`   Monto a restar: ${comisionado[0].monto}`);
    }

    const eliminado = await Comision.eliminarComisionado(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Comisionado no encontrado' });
    }

    // Recalcular total
    if (comisionado.length > 0) {
      const comisionId = comisionado[0].comision_id;
      console.log(`   Comisión asociada: ${comisionId}`);
      await Comision.recalcularTotal(comisionId);
    }

    console.log(`✅ COMISIONADO ELIMINADO\n`);

    res.json({ mensaje: 'Comisionado eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== REPORTES ==========
/**
 * Obtener reporte de presupuestos asignados en un rango de fechas
 * GET /reportes/presupuestos?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
exports.obtenerReportePresupuestos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    // Validaciones
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Se requieren fechaInicio y fechaFin en formato YYYY-MM-DD'
      });
    }

    // Validar formato de fechas
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaInicio) || !regexFecha.test(fechaFin)) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    const pool = require('../config/database').pool;

    // Obtener comisiones (asignadas y por asignar) en el rango de fechas
    const [comisiones] = await pool.query(
      `SELECT 
        c.id,
        c.ambito_id,
        a.nombre_corto as ambito_nombre,
        c.meta_id,
        m.numero_meta,
        m.nombre as meta_nombre,
        c.lugar,
        c.ruta,
        c.modalidad_viaje,
        c.fecha_salida,
        c.fecha_retorno,
        c.num_dias,
        c.costo_xdia,
        c.observacion,
        c.presupuesto_estado,
        c.presupuesto_documento,
        c.presupuesto_numero_cut,
        c.presupuesto_fecha,
        COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
        COALESCE(SUM(cc.monto), 0) as monto_total
      FROM comisiones c
      LEFT JOIN ambitos a ON c.ambito_id = a.id
      LEFT JOIN metas m ON c.meta_id = m.id
      LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
      WHERE c.presupuesto_fecha BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY c.presupuesto_fecha DESC, c.id DESC`,
      [fechaInicio, fechaFin]
    );

    // Obtener detalle de comisionados por clasificador para cada comisión
    const reporteComisiones = await Promise.all(
      comisiones.map(async (c) => {
        const [clasificadores] = await pool.query(
          `SELECT 
            cl.id,
            cl.nombre as clasificador,
            COUNT(DISTINCT cc.usuario_id) as cantidad_usuarios,
            COALESCE(SUM(cc.monto), 0) as monto_clasificador,
            GROUP_CONCAT(DISTINCT u.nombre SEPARATOR ', ') as usuarios
          FROM comision_comisionados cc
          LEFT JOIN clasificadores cl ON cc.clasificador_id = cl.id
          LEFT JOIN users u ON cc.usuario_id = u.id
          WHERE cc.comision_id = ?
          GROUP BY cc.clasificador_id, cl.id, cl.nombre
          ORDER BY cl.nombre`,
          [c.id]
        );

        // Obtener detalle de personas CON partida del clasificador
        const [personas] = await pool.query(
          `SELECT 
            cc.usuario_id,
            u.nombre,
            cc.monto,
            cc.dias,
            cc.costo_xdia,
            cl.nombre as clasificador,
            cl.partida as partida_clasificador
          FROM comision_comisionados cc
          LEFT JOIN users u ON cc.usuario_id = u.id
          LEFT JOIN clasificadores cl ON cc.clasificador_id = cl.id
          WHERE cc.comision_id = ?
          ORDER BY u.nombre, cl.partida`,
          [c.id]
        );

        return {
          id: c.id,
          ambito_id: c.ambito_id,
          ambito_nombre: c.ambito_nombre,
          meta_id: c.meta_id,
          numero_meta: c.numero_meta,
          meta_nombre: c.meta_nombre,
          lugar: c.lugar,
          ruta: c.ruta,
          modalidad_viaje: c.modalidad_viaje,
          fecha_salida: c.fecha_salida,
          fecha_retorno: c.fecha_retorno,
          num_dias: c.num_dias,
          costo_xdia: parseFloat(c.costo_xdia) || 0,
          observacion: c.observacion,
          presupuesto_estado: c.presupuesto_estado,
          presupuesto_documento: c.presupuesto_documento,
          presupuesto_numero_cut: c.presupuesto_numero_cut,
          presupuesto_fecha: c.presupuesto_fecha,
          cantidad_comisionados: c.cantidad_comisionados || 0,
          monto_total: c.monto_total || 0,
          clasificadores: clasificadores.map(cl => ({
            id: cl.id,
            nombre: cl.clasificador || 'Sin clasificar',
            cantidad_usuarios: cl.cantidad_usuarios || 0,
            monto: parseFloat(cl.monto_clasificador) || 0,
            usuarios: cl.usuarios || ''
          })),
          personas: personas.map(p => ({
            usuario_id: p.usuario_id,
            nombre: p.nombre || 'Sin nombre',
            monto: parseFloat(p.monto) || 0,
            dias: p.dias || 0,
            costo_xdia: parseFloat(p.costo_xdia) || 0,
            clasificador: p.clasificador || 'Sin clasificar',
            partida_clasificador: p.partida_clasificador || '-'
          }))
        };
      })
    );

    // Calcular totales
    const totalComisiones = reporteComisiones.length;
    const totalMonto = reporteComisiones.reduce((sum, c) => sum + (parseFloat(c.monto_total) || 0), 0);
    const totalComisionados = reporteComisiones.reduce((sum, c) => sum + (c.cantidad_comisionados || 0), 0);

    res.json({
      success: true,
      fechaInicio,
      fechaFin,
      resumen: {
        totalComisiones,
        totalMonto,
        totalComisionados
      },
      comisiones: reporteComisiones
    });

  } catch (error) {
    console.error('Error en obtenerReportePresupuestos:', error);
    res.status(500).json({
      error: error.message,
      detalles: 'Error al generar reporte de presupuestos'
    });
  }
};

/**
 * Obtener reporte de presupuestos PENDIENTES en un rango de fechas
 * GET /reportes/presupuestos-pendientes?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
exports.obtenerReportePresupuestosPendientes = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    // Validaciones
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Se requieren fechaInicio y fechaFin en formato YYYY-MM-DD'
      });
    }

    // Validar formato de fechas
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaInicio) || !regexFecha.test(fechaFin)) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    const pool = require('../config/database').pool;

    // Obtener SOLO comisiones sin presupuesto asignado Y aprobadas en el rango de fechas
    const [comisiones] = await pool.query(
      `SELECT 
        c.id,
        c.ambito_id,
        a.nombre_corto as ambito_nombre,
        c.meta_id,
        m.numero_meta,
        m.nombre as meta_nombre,
        c.lugar,
        c.ruta,
        c.modalidad_viaje,
        c.fecha_salida,
        c.fecha_retorno,
        c.num_dias,
        c.costo_xdia,
        c.observacion,
        c.presupuesto_estado,
        c.presupuesto_documento,
        c.presupuesto_numero_cut,
        c.presupuesto_fecha,
        COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
        COALESCE(SUM(cc.monto), 0) as monto_total
      FROM comisiones c
      LEFT JOIN ambitos a ON c.ambito_id = a.id
      LEFT JOIN metas m ON c.meta_id = m.id
      LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
      WHERE c.fecha_salida BETWEEN ? AND ?
        AND (c.presupuesto_estado IS NULL OR c.presupuesto_estado = 'PRESUPUESTO POR ASIGNAR')
        AND c.aprobacion_estado = 'APROBADA'
      GROUP BY c.id
      ORDER BY c.fecha_salida DESC, c.id DESC`,
      [fechaInicio, fechaFin]
    );

    // Obtener información detallada de cada comisión
    const reporteComisiones = await Promise.all(
      comisiones.map(async (c) => {
        // Obtener clasificadores
        const [clasificadores] = await pool.query(
          `SELECT 
            cl.id,
            cl.nombre as nombre,
            cl.partida,
            COUNT(DISTINCT cc.usuario_id) as cantidad_usuarios,
            COALESCE(SUM(cc.monto), 0) as monto
          FROM comision_comisionados cc
          JOIN clasificadores cl ON cc.clasificador_id = cl.id
          WHERE cc.comision_id = ?
          GROUP BY cc.clasificador_id
          ORDER BY cl.nombre`,
          [c.id]
        );

        // Obtener personas con todos los detalles
        const [personas] = await pool.query(
          `SELECT 
            u.id as usuario_id,
            u.nombre,
            cl.nombre as clasificador,
            cl.partida as partida_clasificador,
            cc.dias,
            cc.costo_xdia,
            cc.monto
          FROM comision_comisionados cc
          JOIN users u ON cc.usuario_id = u.id
          JOIN clasificadores cl ON cc.clasificador_id = cl.id
          WHERE cc.comision_id = ?
          ORDER BY u.nombre, cl.nombre`,
          [c.id]
        );

        return {
          id: c.id,
          ambito_id: c.ambito_id,
          ambito_nombre: c.ambito_nombre,
          meta_id: c.meta_id,
          numero_meta: c.numero_meta,
          meta_nombre: c.meta_nombre,
          lugar: c.lugar,
          ruta: c.ruta,
          modalidad_viaje: c.modalidad_viaje,
          fecha_salida: c.fecha_salida,
          fecha_retorno: c.fecha_retorno,
          num_dias: c.num_dias,
          costo_xdia: parseFloat(c.costo_xdia) || 0,
          observacion: c.observacion,
          presupuesto_estado: c.presupuesto_estado,
          presupuesto_documento: c.presupuesto_documento,
          presupuesto_numero_cut: c.presupuesto_numero_cut,
          presupuesto_fecha: c.presupuesto_fecha,
          cantidad_comisionados: c.cantidad_comisionados || 0,
          monto_total: parseFloat(c.monto_total) || 0,
          clasificadores: clasificadores.map(cl => ({
            id: cl.id,
            nombre: cl.nombre || 'Sin clasificar',
            partida: cl.partida || '-',
            cantidad_usuarios: cl.cantidad_usuarios || 0,
            monto: parseFloat(cl.monto) || 0
          })),
          personas: personas.map(p => ({
            usuario_id: p.usuario_id,
            nombre: p.nombre,
            clasificador: p.clasificador,
            partida_clasificador: p.partida_clasificador,
            dias: p.dias || 0,
            costo_xdia: parseFloat(p.costo_xdia) || 0,
            monto: parseFloat(p.monto) || 0
          }))
        };
      })
    );

    res.json({
      success: true,
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      comisiones: reporteComisiones
    });

  } catch (error) {
    console.error('Error en obtenerReportePresupuestosPendientes:', error);
    res.status(500).json({
      error: error.message,
      detalles: 'Error al generar reporte de presupuestos pendientes'
    });
  }
};

// Sincronizar costos totales de todas las comisiones
// NOTA: Solo ejecutar cuando se detecte inconsistencia
exports.sincronizarCostosTotales = async (req, res) => {
  try {
    const { pool } = require('../config/database');

    console.log('\n🔄 SINCRONIZACIÓN DE COSTOS TOTALES - INICIADA');

    // Obtener todas las comisiones
    const [comisiones] = await pool.query(
      `SELECT id, costo_total_comision FROM comisiones ORDER BY id`
    );

    let actualizadas = 0;
    const discrepancias = [];

    for (const comision of comisiones) {
      const comisionId = comision.id;
      const costoActual = parseFloat(comision.costo_total_comision) || 0;

      // Calcular la suma real de comicionados
      const [comisionados] = await pool.query(
        `SELECT cc.*, cl.nombre as clasificador_nombre
         FROM comision_comisionados cc
         JOIN clasificadores cl ON cc.clasificador_id = cl.id
         WHERE cc.comision_id = ?`,
        [comisionId]
      );

      // Calcular total con lógica correcta para VIÁTICOS
      let totalCalculado = 0;
      comisionados.forEach(com => {
        let monto = parseFloat(com.monto) || 0;
        if (com.clasificador_nombre && com.clasificador_nombre.includes('VIÁTICOS')) {
          monto = (parseFloat(com.dias) || 0) * (parseFloat(com.costo_xdia) || 0);
        }
        totalCalculado += monto;
      });

      // Comparar y actualizar si hay diferencia
      if (Math.abs(costoActual - totalCalculado) > 0.01) {
        console.log(`⚠️  Comisión ID ${comisionId}: ${costoActual} → ${totalCalculado.toFixed(2)}`);

        await pool.query(
          `UPDATE comisiones SET costo_total_comision = ? WHERE id = ?`,
          [totalCalculado, comisionId]
        );

        actualizadas++;
        discrepancias.push({
          comision_id: comisionId,
          costo_anterior: costoActual,
          costo_nuevo: totalCalculado,
          diferencia: totalCalculado - costoActual
        });
      }
    }

    console.log(`✅ SINCRONIZACIÓN COMPLETADA: ${actualizadas} comisiones actualizadas\n`);

    res.json({
      mensaje: 'Sincronización de costos completada',
      comisiones_procesadas: comisiones.length,
      comisiones_actualizadas: actualizadas,
      discrepancias: discrepancias
    });
  } catch (error) {
    console.error('❌ ERROR EN SINCRONIZACIÓN:', error.message);
    res.status(500).json({
      error: error.message,
      detalles: 'Error al sincronizar costos totales'
    });
  }
};

// Obtener comisiones por mes
exports.obtenerComisionesPorMes = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validar parámetros
    if (!year || !month) {
      return res.status(400).json({
        error: 'Parámetros requeridos: year y month'
      });
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Valores inválidos: year debe ser número y month debe estar entre 1-12'
      });
    }

    const comisiones = await Comision.obtenerPorMes(yearNum, monthNum);
    res.json(comisiones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener reporte de comisiones con PRESUPUESTO ASIGNADO
 * GET /reportes/presupuestos-asignados?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
exports.obtenerReportePresupuestosAsignados = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    // Validaciones
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Se requieren fechaInicio y fechaFin en formato YYYY-MM-DD'
      });
    }

    // Validar formato de fechas
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaInicio) || !regexFecha.test(fechaFin)) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }

    const pool = require('../config/database').pool;

    // Obtener comisiones CON presupuesto asignado Y aprobadas en el rango de fechas
    const [comisiones] = await pool.query(
      `SELECT 
        c.id,
        c.ambito_id,
        a.nombre_corto as ambito_nombre,
        c.meta_id,
        m.numero_meta,
        m.nombre as meta_nombre,
        c.usuario_id,
        u.nombre as usuario_nombre,
        c.lugar,
        c.ruta,
        c.modalidad_viaje,
        c.fecha_salida,
        c.fecha_retorno,
        c.num_dias,
        c.costo_xdia,
        c.observacion,
        c.presupuesto_estado,
        c.presupuesto_documento,
        c.presupuesto_numero_cut,
        c.presupuesto_fecha,
        c.aprobacion_estado,
        COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
        COALESCE(SUM(cc.monto), 0) as monto_total,
        c.costo_total_comision
      FROM comisiones c
      LEFT JOIN ambitos a ON c.ambito_id = a.id
      LEFT JOIN metas m ON c.meta_id = m.id
      LEFT JOIN users u ON c.usuario_id = u.id
      LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
      WHERE c.presupuesto_fecha BETWEEN ? AND ?
        AND c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
        AND c.aprobacion_estado = 'APROBADA'
      GROUP BY c.id
      ORDER BY c.presupuesto_fecha DESC, c.id DESC`,
      [fechaInicio, fechaFin]
    );

    // Obtener información detallada de cada comisión
    const reporteComisiones = await Promise.all(
      comisiones.map(async (c) => {
        // Obtener clasificadores
        const [clasificadores] = await pool.query(
          `SELECT 
            cl.id,
            cl.nombre as nombre,
            cl.partida,
            COUNT(DISTINCT cc.usuario_id) as cantidad_usuarios,
            COALESCE(SUM(cc.monto), 0) as monto
          FROM comision_comisionados cc
          JOIN clasificadores cl ON cc.clasificador_id = cl.id
          WHERE cc.comision_id = ?
          GROUP BY cc.clasificador_id
          ORDER BY cl.nombre`,
          [c.id]
        );

        // Obtener personas con todos los detalles
        const [personas] = await pool.query(
          `SELECT 
            u.id as usuario_id,
            u.nombre,
            cl.nombre as clasificador,
            cl.partida as partida_clasificador,
            cc.dias,
            cc.costo_xdia,
            cc.monto
          FROM comision_comisionados cc
          JOIN users u ON cc.usuario_id = u.id
          JOIN clasificadores cl ON cc.clasificador_id = cl.id
          WHERE cc.comision_id = ?
          ORDER BY u.nombre, cl.nombre`,
          [c.id]
        );

        return {
          id: c.id,
          ambito_id: c.ambito_id,
          ambito_nombre: c.ambito_nombre,
          meta_id: c.meta_id,
          numero_meta: c.numero_meta,
          meta_nombre: c.meta_nombre,
          usuario_id: c.usuario_id,
          usuario_nombre: c.usuario_nombre,
          lugar: c.lugar,
          ruta: c.ruta,
          modalidad_viaje: c.modalidad_viaje,
          fecha_salida: c.fecha_salida,
          fecha_retorno: c.fecha_retorno,
          num_dias: c.num_dias,
          costo_xdia: parseFloat(c.costo_xdia) || 0,
          observacion: c.observacion,
          aprobacion_estado: c.aprobacion_estado,
          presupuesto_estado: c.presupuesto_estado,
          presupuesto_documento: c.presupuesto_documento,
          presupuesto_numero_cut: c.presupuesto_numero_cut,
          presupuesto_fecha: c.presupuesto_fecha,
          cantidad_comisionados: c.cantidad_comisionados || 0,
          monto_total: parseFloat(c.monto_total) || 0,
          costo_total_comision: parseFloat(c.costo_total_comision) || 0,
          clasificadores: clasificadores.map(cl => ({
            id: cl.id,
            nombre: cl.nombre || 'Sin clasificar',
            partida: cl.partida || '-',
            cantidad_usuarios: cl.cantidad_usuarios || 0,
            monto: parseFloat(cl.monto) || 0
          })),
          personas: personas.map(p => ({
            usuario_id: p.usuario_id,
            nombre: p.nombre,
            clasificador: p.clasificador,
            partida_clasificador: p.partida_clasificador,
            dias: p.dias || 0,
            costo_xdia: parseFloat(p.costo_xdia) || 0,
            monto: parseFloat(p.monto) || 0
          }))
        };
      })
    );

    // Calcular totales
    const totalComisiones = reporteComisiones.length;
    const totalMonto = reporteComisiones.reduce((sum, c) => sum + (parseFloat(c.monto_total) || 0), 0);
    const totalCostoComision = reporteComisiones.reduce((sum, c) => sum + (parseFloat(c.costo_total_comision) || 0), 0);
    const totalComisionados = reporteComisiones.reduce((sum, c) => sum + (c.cantidad_comisionados || 0), 0);

    res.json({
      success: true,
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      resumen: {
        totalComisiones,
        totalMonto,
        totalCostoComision,
        totalComisionados
      },
      comisiones: reporteComisiones
    });

  } catch (error) {
    console.error('Error en obtenerReportePresupuestosAsignados:', error);
    res.status(500).json({
      error: error.message,
      detalles: 'Error al generar reporte de presupuestos asignados'
    });
  }
};

/**
 * Obtener comisiones para emitir formatos (presupuesto asignado y aprobadas)
 * GET /comisiones/emision-formatos
 */
exports.obtenerComisionesParaEmisionFormatos = async (req, res) => {
  try {
    // Extraer datos del token JWT (el middleware los pone en req.user)
    const usuarioId = req.user.id; // ⚠️ Importante: JWT almacena 'id', no 'usuarioId'
    const rol = req.user.rol;
    const userAmbitoId = req.user.ambito_id;
    const pool = require('../config/database').pool;

    console.log('🔍 obtenerComisionesParaEmisionFormatos');
    console.log('   req.user:', req.user);
    console.log('   usuarioId (extraído):', usuarioId);
    console.log('   rol:', rol);
    console.log('   userAmbitoId:', userAmbitoId);

    let query = `SELECT DISTINCT c.id,
      c.ambito_id,
      a.nombre_corto as ambito_nombre,
      c.meta_id,
      m.numero_meta,
      m.nombre as meta_nombre,
      c.usuario_id,
      u.nombre as usuario_nombre,
      c.lugar,
      c.ruta,
      c.modalidad_viaje,
      c.fecha_salida,
      c.fecha_retorno,
      c.num_dias,
      c.costo_xdia,
      c.observacion,
      c.presupuesto_estado,
      c.aprobacion_estado
    FROM comisiones c
    LEFT JOIN ambitos a ON c.ambito_id = a.id
    LEFT JOIN metas m ON c.meta_id = m.id
    LEFT JOIN users u ON c.usuario_id = u.id`;

    const params = [];
    const condiciones = [];

    // Siempre debe cumplir estos requisitos
    condiciones.push('c.presupuesto_estado = "PRESUPUESTO ASIGNADO"');
    condiciones.push('c.aprobacion_estado = "APROBADA"');

    // Filtrar según el rol del usuario
    if (rol === 'usuario') {
      // USUARIO: Ver comisiones donde es comisionado (aparece en comision_comisionados)
      query += ` INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
                 INNER JOIN users comisionados ON cc.usuario_id = comisionados.id`;
      condiciones.push('comisionados.id = ?');
      params.push(usuarioId);
      console.log('   📍 Filtro USUARIO aplicado: usuario_id =', usuarioId);
    } else if (rol === 'administrativo' && userAmbitoId) {
      // ADMINISTRATIVO: Ver solo comisiones donde hay comisionados del mismo ámbito
      query += ` INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
                 INNER JOIN users comisionados ON cc.usuario_id = comisionados.id`;
      condiciones.push('comisionados.ambito_id = ?');
      params.push(userAmbitoId);
    }
    // JEFE: Ver todas las comisiones aprobadas con presupuesto asignado (sin filtro adicional)
    // ADMIN: ve todas las comisiones

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }
    query += ` ORDER BY c.fecha_salida DESC, c.id DESC`;

    console.log('   📝 Query:', query);
    console.log('   📍 Params:', params);

    const [comisiones] = await pool.query(query, params);

    console.log('   ✓ Comisiones encontradas:', comisiones.length);
    if (comisiones.length > 0) {
      console.log('   📌 Primera comisión:', comisiones[0]);
    } else {
      console.log('   ⚠️  RESULTADO VACÍO - Verificando datos en DB...');
      
      // Debug: Verificar si hay comisiones aprobadas con presupuesto asignado
      const [allAprobadas] = await pool.query(
        `SELECT id, lugar, aprobacion_estado, presupuesto_estado FROM comisiones 
         WHERE aprobacion_estado = "APROBADA" AND presupuesto_estado = "PRESUPUESTO ASIGNADO" LIMIT 5`
      );
      console.log('   💾 Total de comisiones aprobadas + presupuesto:', allAprobadas.length);
      
      // Debug: Verificar comisionados del usuario
      const [comisionadosDelUsuario] = await pool.query(
        `SELECT cc.comision_id, u.nombre, c.aprobacion_estado, c.presupuesto_estado 
         FROM comision_comisionados cc
         JOIN users u ON cc.usuario_id = u.id
         JOIN comisiones c ON cc.comision_id = c.id
         WHERE cc.usuario_id = ? LIMIT 10`,
        [usuarioId]
      );
      console.log('   💾 Comisionados asignados al usuario:', comisionadosDelUsuario.length);
      comisionadosDelUsuario.forEach(row => {
        console.log(`      - Comisión ${row.comision_id}: ${row.aprobacion_estado} / ${row.presupuesto_estado}`);
      });
    }
    
    if (comisiones.length === 0) {
      console.log('   ⚠️  No hay comisiones para mostrar');
      return res.json({
        success: true,
        total: 0,
        comisiones: []
      });
    }

    // Obtener detalles completos de cada comisión
    const comisionesCompletas = await Promise.all(
      comisiones.map(async (c) => {
        // Obtener comisionados con su ámbito (dirección del usuario)
        const [comisionados] = await pool.query(
          `SELECT cc.id, cc.usuario_id, u.nombre as usuario_nombre, u.cargo_id, u.ambito_id,
                  cargo.nombre as cargo_nombre,
                  amb.nombre_largo as ambito_nombre,
                  cc.clasificador_id, cl.nombre as clasificador_nombre, cl.partida,
                  cc.dias, cc.costo_xdia, cc.monto,
                  cc.observacion
           FROM comision_comisionados cc
           JOIN users u ON cc.usuario_id = u.id
           LEFT JOIN cargos cargo ON u.cargo_id = cargo.id
           LEFT JOIN ambitos amb ON u.ambito_id = amb.id
           JOIN clasificadores cl ON cc.clasificador_id = cl.id
           WHERE cc.comision_id = ?
           ORDER BY u.nombre, cl.nombre`,
          [c.id]
        );

        return {
          ...c,
          comisionados
        };
      })
    );

    res.json({
      success: true,
      total: comisionesCompletas.length,
      comisiones: comisionesCompletas
    });

  } catch (error) {
    console.error('Error en obtenerComisionesParaEmisionFormatos:', error);
    res.status(500).json({
      error: error.message,
      detalles: 'Error al obtener comisiones para emitir formatos'
    });
  }
};

