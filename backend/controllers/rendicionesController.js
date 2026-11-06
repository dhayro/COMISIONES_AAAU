const logger = require('../shared/logger');
const { respuestaError500 } = require('../shared/errores');
const Rendicion = require('../models/Rendicion');
const rendicionService = require('../services/rendicionService');
const Ruta = require('../models/Ruta');  // 🆕 Importar modelo de Ruta

/**
 * Controller para rendiciones (nuevo modelo principal)
 */

// POST /api/rendiciones/crear
// Crea, actualiza o finaliza una rendición. La lógica y la transacción viven en rendicionService.
exports.crearRendicion = async (req, res) => {
  try {
    const resultado = await rendicionService.crearRendicion(req.body);
    return res.status(201).json({
      success: true,
      message: resultado.modo === 'actualizar' ? '✅ Rendición actualizada correctamente' : '✅ Rendición creada correctamente',
      rendicion: {
        formato_emision_id: resultado.formato_emision_id,
        comprobantes_guardados: resultado.comprobantesGuardados.length,
        total_monto: resultado.totalMonto,
        id: resultado.comprobantesGuardados[0]?.id || null,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json(respuestaError500(error, 'Error al crear rendición'));
  }
};

exports.listarRendiciones = async (req, res) => {
  try {
    const { formato_emision_id } = req.query;

    if (formato_emision_id) {
      const rows = await Rendicion.listarPorFormato(formato_emision_id);
      return res.json({ rendiciones: rows });
    }

    // listar todas (simple)
    const rows = await Rendicion.listarPorFormato(null); // implementar método general si se quiere
    return res.json({ rendiciones: rows });
  } catch (error) {
    logger.error('❌ Error en listarRendiciones:', error);
    return res.status(500).json(respuestaError500(error, 'Error al listar rendiciones'));
  }
};

// GET /api/rendiciones/:id
exports.obtenerRendicion = async (req, res) => {
  try {
    const { id } = req.params;
    const rend = await Rendicion.obtenerConDetalles(id);
    if (!rend) return res.status(404).json({ error: 'Rendición no encontrada' });
    return res.json({ rendicion: rend });
  } catch (error) {
    logger.error('❌ Error en obtenerRendicion:', error);
    return res.status(500).json(respuestaError500(error, 'Error al obtener rendición'));
  }
};

// PUT /api/rendiciones/:id
exports.actualizarRendicion = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const anterior = await Rendicion.obtenerConDetalles(id);
    if (!anterior) {
      return res.status(404).json({ error: 'Rendición no encontrada' });
    }

    await rendicionService.actualizarComprobante(id, datos, anterior.formato_emision_id);
    const actual = await Rendicion.obtenerConDetalles(id);
    return res.json({ success: true, rendicion: actual });
  } catch (error) {
    logger.error('❌ Error en actualizarRendicion:', error);
    return res.status(500).json(respuestaError500(error, 'Error al actualizar rendición'));
  }
};

// 🆕 GET /api/rendiciones/obtener-por-formato/:formato_emision_id
// Obtener todas las rendiciones de un formato emitido
exports.obtenerPorFormato = async (req, res) => {
  try {
    const { formato_emision_id } = req.params;

    if (!formato_emision_id) {
      return res.status(400).json({ error: 'formato_emision_id es requerido' });
    }

    const rendiciones = await Rendicion.listarPorFormato(formato_emision_id);
    const rutas = await Ruta.listarPorFormato(formato_emision_id);  // 🆕 Obtener rutas
    
    return res.json({ 
      success: true,
      rendiciones: rendiciones || [],
      rutas: rutas || [],  // 🆕 Incluir rutas en respuesta
      total: (rendiciones || []).length,
      totalRutas: (rutas || []).length,  // 🆕 Cantidad de rutas
    });
  } catch (error) {
    logger.error('❌ Error en obtenerPorFormato:', error);
    return res.status(500).json(respuestaError500(error, 'Error al obtener rendiciones'));
  }
};

// DELETE /api/rendiciones/:id
exports.eliminarRendicion = async (req, res) => {
  try {
    const { id } = req.params;
    const rendicion = await Rendicion.obtenerConDetalles(id);
    await rendicionService.eliminarComprobante(id, rendicion && rendicion.formato_emision_id);
    return res.json({ success: true, message: 'Rendición eliminada' });
  } catch (error) {
    logger.error('❌ Error en eliminarRendicion:', error);
    return res.status(500).json(respuestaError500(error, 'Error al eliminar rendición'));
  }
};
// PUT /api/rendiciones/:id/validacion
// Marca un comprobante como VALIDADO tras una validación exitosa en SUNAT
exports.marcarValidado = async (req, res) => {
  try {
    const { id } = req.params;
    const existente = await Rendicion.obtenerConDetalles(id);
    if (!existente) {
      return res.status(404).json({ error: 'Rendición no encontrada' });
    }
    const mensaje = String((req.body && req.body.mensaje) || '').slice(0, 1000) || null;
    const estado = req.body && req.body.estado === 'MANUAL' ? 'MANUAL' : 'VALIDADO';
    await Rendicion.actualizar(id, { estado_rendicion: estado, validacion_mensaje: mensaje, validacion_fecha: new Date() });
    return res.json({ success: true, estado_rendicion: estado });
  } catch (error) {
    return res.status(500).json(respuestaError500(error, 'Error al marcar la validación'));
  }
};

// PUT /api/rendiciones/:id/monto-validacion
// Registra el monto real de la factura y su sustento para repetir la validación en SUNAT
exports.marcarMontoValidacion = async (req, res) => {
  try {
    const { id } = req.params;
    const monto = parseFloat(req.body && req.body.monto_factura);
    const sustento = String((req.body && req.body.sustento) || '').trim();
    if (!(monto > 0)) {
      return res.status(400).json({ error: 'El monto de la factura debe ser mayor a 0' });
    }
    if (sustento.length < 10) {
      return res.status(400).json({ error: 'Escribe un sustento de al menos 10 caracteres' });
    }
    const existente = await Rendicion.obtenerConDetalles(id);
    if (!existente) {
      return res.status(404).json({ error: 'Rendición no encontrada' });
    }
    await Rendicion.actualizar(id, { monto_factura: monto, sustento_monto: sustento.slice(0, 1000) });
    return res.json({ success: true, monto_factura: monto });
  } catch (error) {
    return res.status(500).json(respuestaError500(error, 'Error al guardar el monto de la factura'));
  }
};
