const Comprobante = require('../models/Comprobante');
const ComprobanteDetalle = require('../models/ComprobanteDetalle');
const FormatoEmision = require('../models/FormatoEmision');
const { pool } = require('../config/database');

/**
 * 📦 Controller de Comprobantes y Rendición
 */

// POST /api/comprobantes/crear
exports.crearComprobante = async (req, res) => {
  try {
    const {
      formato_emision_id,
      numero_comprobante,
      tipo_comprobante,
      fecha_comprobante,
      proveedor_razon_social,
      proveedor_ruc_dni,
      monto,
      detalles, // Array de {tipo_viatitico, cantidad, descripcion}
    } = req.body;

    console.log('🟦 [RENDICION] Creando comprobante:', {
      formato_emision_id,
      numero_comprobante,
      tipo_comprobante,
      monto,
    });

    // ✅ Validar que formato exista y esté en estado ENVIADO
    const formato = await FormatoEmision.obtenerPorId(formato_emision_id);
    if (!formato) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }

    if (formato.estado_emision !== 'ENVIADO') {
      return res.status(400).json({
        error: `No se puede rendir un formato que no está en estado ENVIADO. Estado actual: ${formato.estado_emision}`,
      });
    }

    // ✅ Validar campos requeridos
    if (!numero_comprobante || !tipo_comprobante || !fecha_comprobante || !monto) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: numero_comprobante, tipo_comprobante, fecha_comprobante, monto',
      });
    }

    // 📝 Crear comprobante
    const comprobante = await Comprobante.crear({
      formato_emision_id,
      numero_comprobante,
      tipo_comprobante,
      fecha_comprobante,
      proveedor_razon_social,
      proveedor_ruc_dni,
      monto,
    });

    // 📝 Si hay detalles (VIÁTICO), crearlos
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      await ComprobanteDetalle.crearDetalles(comprobante.id, detalles);
      console.log(`✅ [RENDICION] ${detalles.length} detalles de viático creados`);
    }

    // 🔄 Obtener comprobante con detalles
    const comprobanteConDetalles = await Comprobante.obtenerConDetalles(comprobante.id);

    console.log('✅ [RENDICION] Comprobante creado exitosamente:', comprobante.id);
    return res.status(201).json({
      success: true,
      message: 'Comprobante creado exitosamente',
      comprobante: comprobanteConDetalles,
    });
  } catch (error) {
    console.error('❌ Error en crearComprobante:', error);
    return res.status(500).json({
      error: 'Error al crear comprobante',
      details: error.message,
    });
  }
};

// GET /api/comprobantes/listar
exports.listarComprobantes = async (req, res) => {
  try {
    const { formato_emision_id, estado_rendicion, tipo_comprobante } = req.query;

    const filtros = {};
    if (formato_emision_id) filtros.formato_emision_id = formato_emision_id;
    if (estado_rendicion) filtros.estado_rendicion = estado_rendicion;
    if (tipo_comprobante) filtros.tipo_comprobante = tipo_comprobante;

    console.log('🟦 [RENDICION] Listando comprobantes con filtros:', filtros);

    const comprobantes = await Comprobante.listar(filtros);

    // Agregar detalles a cada comprobante
    const comprobanteConDetalles = await Promise.all(
      comprobantes.map(async (comp) => ({
        ...comp,
        detalles: await ComprobanteDetalle.obtenerPorComprobante(comp.id),
      }))
    );

    console.log(`✅ [RENDICION] ${comprobanteConDetalles.length} comprobantes encontrados`);
    return res.status(200).json({
      success: true,
      comprobantes: comprobanteConDetalles,
    });
  } catch (error) {
    console.error('❌ Error en listarComprobantes:', error);
    return res.status(500).json({
      error: 'Error al listar comprobantes',
      details: error.message,
    });
  }
};

// GET /api/comprobantes/:id
exports.obtenerComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    const comprobante = await Comprobante.obtenerConDetalles(id);

    if (!comprobante) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    console.log(`✅ [RENDICION] Comprobante ${id} obtenido`);
    return res.status(200).json({
      success: true,
      comprobante,
    });
  } catch (error) {
    console.error('❌ Error en obtenerComprobante:', error);
    return res.status(500).json({
      error: 'Error al obtener comprobante',
      details: error.message,
    });
  }
};

// PUT /api/comprobantes/:id
exports.actualizarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_comprobante,
      tipo_comprobante,
      fecha_comprobante,
      proveedor_razon_social,
      proveedor_ruc_dni,
      monto,
      estado_rendicion,
      observacion_rechazo,
      detalles,
    } = req.body;

    console.log('🟦 [RENDICION] Actualizando comprobante:', id);

    // Verificar que existe
    const comprobanteAnterior = await Comprobante.obtenerPorId(id);
    if (!comprobanteAnterior) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    // Actualizar datos del comprobante
    const datosActualizacion = {};
    if (numero_comprobante !== undefined) datosActualizacion.numero_comprobante = numero_comprobante;
    if (tipo_comprobante !== undefined) datosActualizacion.tipo_comprobante = tipo_comprobante;
    if (fecha_comprobante !== undefined) datosActualizacion.fecha_comprobante = fecha_comprobante;
    if (proveedor_razon_social !== undefined) datosActualizacion.proveedor_razon_social = proveedor_razon_social;
    if (proveedor_ruc_dni !== undefined) datosActualizacion.proveedor_ruc_dni = proveedor_ruc_dni;
    if (monto !== undefined) datosActualizacion.monto = monto;
    if (estado_rendicion !== undefined) datosActualizacion.estado_rendicion = estado_rendicion;
    if (observacion_rechazo !== undefined) datosActualizacion.observacion_rechazo = observacion_rechazo;

    await Comprobante.actualizar(id, datosActualizacion);

    // Actualizar detalles si los hay
    if (detalles && Array.isArray(detalles)) {
      await ComprobanteDetalle.actualizarDetalles(id, detalles);
    }

    const comprobanteActualizado = await Comprobante.obtenerConDetalles(id);

    console.log(`✅ [RENDICION] Comprobante ${id} actualizado`);
    return res.status(200).json({
      success: true,
      message: 'Comprobante actualizado exitosamente',
      comprobante: comprobanteActualizado,
    });
  } catch (error) {
    console.error('❌ Error en actualizarComprobante:', error);
    return res.status(500).json({
      error: 'Error al actualizar comprobante',
      details: error.message,
    });
  }
};

// DELETE /api/comprobantes/:id
exports.eliminarComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🟦 [RENDICION] Eliminando comprobante:', id);

    // Verificar que existe
    const comprobante = await Comprobante.obtenerPorId(id);
    if (!comprobante) {
      return res.status(404).json({ error: 'Comprobante no encontrado' });
    }

    // Eliminar
    await Comprobante.eliminar(id);

    console.log(`✅ [RENDICION] Comprobante ${id} eliminado`);
    return res.status(200).json({
      success: true,
      message: 'Comprobante eliminado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error en eliminarComprobante:', error);
    return res.status(500).json({
      error: 'Error al eliminar comprobante',
      details: error.message,
    });
  }
};

// 📊 ESTADÍSTICAS
// GET /api/comprobantes/estadisticas/:formato_emision_id
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { formato_emision_id } = req.params;

    let connection;
    try {
      connection = await pool.getConnection();

      const [stats] = await connection.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado_rendicion = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado_rendicion = 'EN_REVISIÓN' THEN 1 ELSE 0 END) as en_revision,
          SUM(CASE WHEN estado_rendicion = 'APROBADO' THEN 1 ELSE 0 END) as aprobados,
          SUM(CASE WHEN estado_rendicion = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazados,
          SUM(monto) as monto_total_rendido
        FROM comprobantes
        WHERE formato_emision_id = ?`,
        [formato_emision_id]
      );

      console.log(`✅ [RENDICION] Estadísticas obtenidas para formato ${formato_emision_id}`);
      return res.status(200).json({
        success: true,
        estadisticas: stats[0],
      });
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message,
    });
  }
};
