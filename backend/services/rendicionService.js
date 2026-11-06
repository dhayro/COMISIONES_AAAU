const Rendicion = require('../models/Rendicion');
const FormatoEmision = require('../models/FormatoEmision');
const Ruta = require('../models/Ruta');
const { enTransaccion } = require('../shared/transaccion');

// Regla: cualquier cambio en una rendición deja el formato en RINDIENDO y borra su fecha de rendición.
// Solo el envío final (finalizar) lo marca como RENDIDO.

const errorConEstado = (status, mensaje) => Object.assign(new Error(mensaje), { status });

const fechaLimaActual = () => {
  const ahora = new Date();
  const diferencia = (ahora.getTimezoneOffset() - 300) * 60 * 1000;
  const fechaLima = new Date(ahora.getTime() + diferencia);
  const dos = (n) => String(n).padStart(2, '0');
  return `${fechaLima.getFullYear()}-${dos(fechaLima.getMonth() + 1)}-${dos(fechaLima.getDate())} ${dos(fechaLima.getHours())}:${dos(fechaLima.getMinutes())}:${dos(fechaLima.getSeconds())}`;
};

const actualizarComprobante = (id, datos, formatoId) =>
  enTransaccion(async (conn) => {
    await Rendicion.actualizar(id, { ...datos, estado_rendicion: 'PENDIENTE', validacion_mensaje: null, validacion_fecha: null }, conn);
    await FormatoEmision.marcarRindiendo(formatoId, conn);
  });

const eliminarComprobante = (id, formatoId) =>
  enTransaccion(async (conn) => {
    await Rendicion.eliminar(id, conn);
    if (formatoId) {
      await FormatoEmision.marcarRindiendo(formatoId, conn);
    }
  });

const comprobanteDesde = (formatoId, comprobante) => ({
  formato_emision_id: formatoId,
  formato_emisiones_detalles_id: comprobante.formato_emision_detalle_id,
  tipo_comprobante_id: comprobante.tipo_comprobante_id || null,
  proveedor_id: comprobante.proveedor_id || null,
  numero_comprobante: comprobante.numero_comprobante || null,
  fecha_comprobante: comprobante.fecha_comprobante || null,
  monto: parseFloat(comprobante.monto) || 0,
  tipo_viatitico: comprobante.tipo_viatico || null,
  estado_rendicion: 'PENDIENTE',
  orden: comprobante.orden || Date.now(),
});

const guardarRutas = async (formatoId, rutas, conn) => {
  for (const ruta of rutas) {
    await Ruta.crear({
      formato_emision_id: formatoId,
      origen: ruta.origen,
      fecha_salida: ruta.fecha_salida,
      destino: ruta.destino,
      fecha_llegada: ruta.fecha_llegada,
    }, conn);
  }
};

const crearRendicion = async (body) => {
  const {
    formato_emision_id, comprobantes, comprobantes_nuevos, comprobantes_actualizar,
    comprobantes_eliminar, modo, finalizar, fecha_rendicion, rutas,
  } = body;

  if (!formato_emision_id) throw errorConEstado(400, 'formato_emision_id es requerido');
  const formato = await FormatoEmision.obtenerPorId(formato_emision_id);
  if (!formato) throw errorConEstado(404, 'Formato no encontrado');
  const requiereSiaf = formato.tipo_emision !== 'REEMBOLSO';
  if (requiereSiaf && !String(formato.numero_siaf || '').trim()) {
    throw errorConEstado(400, 'Falta registrar el SIAF del formato antes de rendir');
  }

  const estadoRendicion = finalizar ? 'RENDIDO' : 'RINDIENDO';
  const fechaFinal = finalizar ? (fecha_rendicion || fechaLimaActual()) : null;

  return enTransaccion(async (conn) => {
    const comprobantesGuardados = [];
    let totalMonto = 0;

    if (modo === 'actualizar') {
      if (Array.isArray(comprobantes_eliminar) && comprobantes_eliminar.length > 0) {
        for (const idRendicion of comprobantes_eliminar) {
          await Rendicion.eliminar(idRendicion, conn);
        }
      }

      if (Array.isArray(comprobantes_actualizar) && comprobantes_actualizar.length > 0) {
        for (const comprobante of comprobantes_actualizar) {
          await Rendicion.actualizar(comprobante.id, {
            tipo_comprobante_id: comprobante.tipo_comprobante_id || null,
            proveedor_id: comprobante.proveedor_id || null,
            numero_comprobante: comprobante.numero_comprobante || null,
            fecha_comprobante: comprobante.fecha_comprobante || null,
            monto: parseFloat(comprobante.monto) || 0,
            tipo_viatitico: comprobante.tipo_viatico || null,
            observacion_rechazo: comprobante.observaciones || null,
            orden: comprobante.orden || null,
          }, conn);
          comprobantesGuardados.push(comprobante);
          totalMonto += parseFloat(comprobante.monto) || 0;
        }
      }

      if (Array.isArray(comprobantes_nuevos) && comprobantes_nuevos.length > 0) {
        for (const comprobante of comprobantes_nuevos) {
          const guardado = await Rendicion.crear(comprobanteDesde(formato_emision_id, comprobante), conn);
          comprobantesGuardados.push(guardado);
          totalMonto += parseFloat(comprobante.monto) || 0;
        }
      }

      await FormatoEmision.actualizar(formato_emision_id, { estado_emision: estadoRendicion, fecha_rendicion: fechaFinal }, conn);

      if (Array.isArray(rutas) && rutas.length > 0) {
        await Ruta.eliminarPorFormato(formato_emision_id, conn);
        await guardarRutas(formato_emision_id, rutas, conn);
      }
    } else {
      if (formato.estado_emision !== 'ENVIADO' && formato.estado_emision !== 'PAGADO') {
        throw errorConEstado(400, 'Solo se pueden rendir formatos en estado ENVIADO o PAGADO');
      }

      const comprobantesACrear = comprobantes || comprobantes_nuevos || [];
      if (!Array.isArray(comprobantesACrear) || comprobantesACrear.length === 0) {
        throw errorConEstado(400, 'Se requiere al menos un comprobante');
      }

      for (const comprobante of comprobantesACrear) {
        const guardado = await Rendicion.crear(comprobanteDesde(formato_emision_id, comprobante), conn);
        comprobantesGuardados.push(guardado);
        totalMonto += parseFloat(comprobante.monto) || 0;
      }

      await FormatoEmision.actualizar(formato_emision_id, { estado_emision: estadoRendicion, fecha_rendicion: fechaFinal }, conn);

      if (Array.isArray(rutas) && rutas.length > 0) {
        await guardarRutas(formato_emision_id, rutas, conn);
      }
    }

    return { modo, formato_emision_id, comprobantesGuardados, totalMonto };
  });
};

module.exports = { actualizarComprobante, eliminarComprobante, crearRendicion };
