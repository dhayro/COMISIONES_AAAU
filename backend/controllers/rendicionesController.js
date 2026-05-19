const Rendicion = require('../models/Rendicion');
const Proveedor = require('../models/Proveedor');
const TipoComprobante = require('../models/TipoComprobante');
const FormatoEmision = require('../models/FormatoEmision');
const Ruta = require('../models/Ruta');  // 🆕 Importar modelo de Ruta

/**
 * Controller para rendiciones (nuevo modelo principal)
 */

// POST /api/rendiciones/crear
// 🆕 Acepta ARRAY de comprobantes para crear rendiciones en tabla existente
// 🔄 ACTUALIZADO: Soporta creación, actualización y eliminación de comprobantes
exports.crearRendicion = async (req, res) => {
  try {
    const {
      formato_emision_id,
      comprobantes, // Array antiguo (para compatibilidad)
      comprobantes_nuevos,
      comprobantes_actualizar,
      comprobantes_eliminar,
      modo, // 'crear' o 'actualizar'
    } = req.body;

    // Validaciones básicas
    if (!formato_emision_id) {
      return res.status(400).json({ error: 'formato_emision_id es requerido' });
    }

    // Validar formato
    const formato = await FormatoEmision.obtenerPorId(formato_emision_id);
    if (!formato) {
      return res.status(404).json({ error: 'Formato no encontrado' });
    }

    // 🔄 LÓGICA ACTUALIZADA
    let comprobantesGuardados = [];
    let totalMonto = 0;

    if (modo === 'actualizar') {
      // MODO ACTUALIZACIÓN: RENDIDO → RENDIDO (modificar rendición existente)
      console.log('🔄 Modo ACTUALIZAR - Procesando cambios en rendición existente');

      // 1️⃣ Eliminar comprobantes marcados
      if (Array.isArray(comprobantes_eliminar) && comprobantes_eliminar.length > 0) {
        for (const idRendicion of comprobantes_eliminar) {
          await Rendicion.eliminar(idRendicion);
          console.log(`❌ Comprobante ${idRendicion} eliminado`);
        }
      }

      // 2️⃣ Actualizar comprobantes existentes
      if (Array.isArray(comprobantes_actualizar) && comprobantes_actualizar.length > 0) {
        for (const comprobante of comprobantes_actualizar) {
          const datosActualizar = {
            tipo_comprobante_id: comprobante.tipo_comprobante_id || null,
            proveedor_id: comprobante.proveedor_id || null,
            numero_comprobante: comprobante.numero_comprobante || null,
            fecha_comprobante: comprobante.fecha_comprobante || null,
            monto: parseFloat(comprobante.monto) || 0,
            tipo_viatitico: comprobante.tipo_viatico || null,
            observacion_rechazo: comprobante.observaciones || null,
            orden: comprobante.orden || null,
          };

          await Rendicion.actualizar(comprobante.id, datosActualizar);
          comprobantesGuardados.push(comprobante);
          totalMonto += parseFloat(comprobante.monto) || 0;
          console.log(`✏️ Comprobante ${comprobante.id} actualizado con orden ${comprobante.orden}`);
        }
      }

      // 3️⃣ Agregar nuevos comprobantes
      if (Array.isArray(comprobantes_nuevos) && comprobantes_nuevos.length > 0) {
        for (const comprobante of comprobantes_nuevos) {
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
            orden: comprobante.orden || Date.now(),
          };

          const comprobanteSaved = await Rendicion.crear(datosComprobante);
          comprobantesGuardados.push(comprobanteSaved);
          totalMonto += parseFloat(comprobante.monto) || 0;
          console.log(`➕ Nuevo comprobante ${comprobanteSaved.id} creado con orden ${comprobante.orden}`);
        }
      }

      // Mantener estado en RENDIDO
      await FormatoEmision.actualizar(formato_emision_id, { estado_emision: 'RENDIDO' });
      console.log('📋 Estado del formato mantenido en RENDIDO');

      // 🆕 Actualizar rutas si existen
      const { rutas } = req.body;
      if (Array.isArray(rutas) && rutas.length > 0) {
        // Primero, eliminar rutas antiguas del formato
        await Ruta.eliminarPorFormato(formato_emision_id);
        console.log('🗑️ Rutas antiguas eliminadas');

        // Luego, crear las nuevas rutas
        for (const ruta of rutas) {
          await Ruta.crear({
            formato_emision_id: formato_emision_id,
            origen: ruta.origen,
            fecha_salida: ruta.fecha_salida,
            destino: ruta.destino,
            fecha_llegada: ruta.fecha_llegada,
          });
          console.log(`✅ Ruta creada: ${ruta.origen} → ${ruta.destino}`);
        }
      }

    } else {
      // MODO CREACIÓN: ENVIADO → RENDIDO (primera rendición)
      console.log('✨ Modo CREAR - Primera rendición del formato');

      if (formato.estado_emision !== 'ENVIADO' && formato.estado_emision !== 'PAGADO') {
        return res.status(400).json({ error: 'Solo se pueden rendir formatos en estado ENVIADO o PAGADO' });
      }

      // Usar array antiguo o nuevo según lo que llegue
      const comprobantesACrear = comprobantes || comprobantes_nuevos || [];

      if (!Array.isArray(comprobantesACrear) || comprobantesACrear.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un comprobante' });
      }

      // 🆕 Insertar cada comprobante
      for (const comprobante of comprobantesACrear) {
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
          orden: comprobante.orden || Date.now(),
        };

        const comprobanteSaved = await Rendicion.crear(datosComprobante);
        comprobantesGuardados.push(comprobanteSaved);
        totalMonto += parseFloat(comprobante.monto) || 0;
      }

      // 🆕 Cambiar estado de formato a RENDIDO
      await FormatoEmision.actualizar(formato_emision_id, { estado_emision: 'RENDIDO' });
      console.log('✅ Formato cambiado a estado RENDIDO');

      // 🆕 Guardar rutas si existen
      const { rutas } = req.body;
      if (Array.isArray(rutas) && rutas.length > 0) {
        for (const ruta of rutas) {
          await Ruta.crear({
            formato_emision_id: formato_emision_id,
            origen: ruta.origen,
            fecha_salida: ruta.fecha_salida,
            destino: ruta.destino,
            fecha_llegada: ruta.fecha_llegada,
          });
          console.log(`✅ Ruta creada: ${ruta.origen} → ${ruta.destino}`);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: modo === 'actualizar' ? '✅ Rendición actualizada correctamente' : '✅ Rendición creada correctamente',
      rendicion: {
        formato_emision_id: formato_emision_id,
        comprobantes_guardados: comprobantesGuardados.length,
        total_monto: totalMonto,
        id: comprobantesGuardados[0]?.id || null,
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
    const rutas = await Ruta.listarPorFormato(formato_emision_id);  // 🆕 Obtener rutas
    
    return res.json({ 
      success: true,
      rendiciones: rendiciones || [],
      rutas: rutas || [],  // 🆕 Incluir rutas en respuesta
      total: (rendiciones || []).length,
      totalRutas: (rutas || []).length,  // 🆕 Cantidad de rutas
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
