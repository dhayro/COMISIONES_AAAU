const Rendicion = require('../models/Rendicion');
const Proveedor = require('../models/Proveedor');
const TipoComprobante = require('../models/TipoComprobante');
const FormatoEmision = require('../models/FormatoEmision');

/**
 * Controller para rendiciones (nuevo modelo principal)
 */

// POST /api/rendiciones/crear
// 🆕 Acepta ARRAY de comprobantes para crear rendiciones en tabla existente
exports.crearRendicion = async (req, res) => {
  try {
    const {
      formato_emision_id,
      comprobantes, // 🆕 Array de comprobantes
    } = req.body;

    // Validaciones básicas
    if (!formato_emision_id) {
      return res.status(400).json({ error: 'formato_emision_id es requerido' });
    }

    if (!Array.isArray(comprobantes) || comprobantes.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un comprobante' });
    }

    // Validar formato
    const formato = await FormatoEmision.obtenerPorId(formato_emision_id);
    if (!formato) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }
    if (formato.estado_emision !== 'ENVIADO') {
      return res.status(400).json({ error: 'Solo se pueden rendir formatos en estado ENVIADO' });
    }

    // 🆕 Insertar cada comprobante en la tabla rendiciones existente
    const comprobantesGuardados = [];
    for (const comprobante of comprobantes) {
      const datosComprobante = {
        formato_emision_id: formato_emision_id,
        formato_emisiones_detalles_id: comprobante.formato_emision_detalle_id,
        tipo_comprobante_id: comprobante.tipo_comprobante_id || null,
        proveedor_id: comprobante.proveedor_id || null,
        numero_comprobante: comprobante.numero_comprobante || null,
        fecha_comprobante: comprobante.fecha_comprobante || null,
        monto: parseFloat(comprobante.monto) || 0,
        tipo_viatitico: comprobante.tipo_viatico || null,
        estado_rendicion: 'PENDIENTE',
      };

      // Guardar comprobante individual usando el modelo existente
      const comprobanteSaved = await Rendicion.crear(datosComprobante);
      comprobantesGuardados.push(comprobanteSaved);
    }

    // 🆕 Cambiar estado de formato a RENDIDO
    await FormatoEmision.actualizar(formato_emision_id, { estado_emision: 'RENDIDO' });

    return res.status(201).json({
      success: true,
      message: '✅ Rendición creada correctamente',
      rendicion: {
        formato_emision_id: formato_emision_id,
        comprobantes_guardados: comprobantesGuardados.length,
        total_monto: comprobantesGuardados.reduce((sum, c) => sum + (c.monto || 0), 0),
      },
    });
  } catch (error) {
    console.error('❌ Error en crearRendicion:', error);
    return res.status(500).json({ error: 'Error al crear rendición', details: error.message });
  }
};

// GET /api/rendiciones/listar
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
    console.error('❌ Error en listarRendiciones:', error);
    return res.status(500).json({ error: 'Error al listar rendiciones', details: error.message });
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
    console.error('❌ Error en obtenerRendicion:', error);
    return res.status(500).json({ error: 'Error al obtener rendición', details: error.message });
  }
};

// PUT /api/rendiciones/:id
exports.actualizarRendicion = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    await Rendicion.actualizar(id, datos);
    const actual = await Rendicion.obtenerConDetalles(id);
    return res.json({ success: true, rendicion: actual });
  } catch (error) {
    console.error('❌ Error en actualizarRendicion:', error);
    return res.status(500).json({ error: 'Error al actualizar rendición', details: error.message });
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
    
    return res.json({ 
      success: true,
      rendiciones: rendiciones || [],
      total: (rendiciones || []).length,
    });
  } catch (error) {
    console.error('❌ Error en obtenerPorFormato:', error);
    return res.status(500).json({ error: 'Error al obtener rendiciones', details: error.message });
  }
};

// DELETE /api/rendiciones/:id
exports.eliminarRendicion = async (req, res) => {
  try {
    const { id } = req.params;
    await Rendicion.eliminar(id);
    return res.json({ success: true, message: 'Rendición eliminada' });
  } catch (error) {
    console.error('❌ Error en eliminarRendicion:', error);
    return res.status(500).json({ error: 'Error al eliminar rendición', details: error.message });
  }
};
