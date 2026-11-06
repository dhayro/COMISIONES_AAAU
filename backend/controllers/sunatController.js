const logger = require('../shared/logger');
const axios = require('axios');
const qs = require('qs');

/**
 * 🔍 Controller para validación de comprobantes en SUNAT
 */

// POST /api/sunat/validar-comprobante
const CODIGOS_TRANSITORIOS = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
const esTransitorio = (error) => CODIGOS_TRANSITORIOS.includes(error.code) || error.response?.status === 503;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const conReintentos = async (operacion, intentos = 3) => {
  for (let intento = 1; ; intento++) {
    try {
      return await operacion();
    } catch (error) {
      if (intento >= intentos || !esTransitorio(error)) throw error;
      logger.warn(`[SUNAT] Intento ${intento} fallido (${error.code || error.response?.status}). Reintentando...`);
      await esperar(2000 * intento);
    }
  }
};


exports.validarComprobanteEnSunat = async (req, res) => {
  try {
    const {
      num_ruc,           // RUC del emisor (20607496961)
      tipocomprobante,   // Tipo: 01=Factura, 03=Boleta, 07=Recibo por Honorarios, etc
      cod_docide,        // Código tipo doc: 6=RUC
      num_docide,        // Número RUC del receptor
      num_serie,         // Serie del comprobante (F006)
      num_comprob,       // Número comprobante (24926)
      fec_emision,       // Fecha emisión (dd/mm/yyyy)
      cantidad           // Monto total
    } = req.body;

    // Validar campos requeridos
    if (!num_ruc || !tipocomprobante || !num_docide || !num_serie || !num_comprob || !fec_emision || !cantidad) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        campos_requeridos: ['num_ruc', 'tipocomprobante', 'cod_docide', 'num_docide', 'num_serie', 'num_comprob', 'fec_emision', 'cantidad']
      });
    }

    logger.info('🔍 [SUNAT] Validando comprobante:', {
      num_ruc,
      tipocomprobante,
      num_serie,
      num_comprob,
      fec_emision,
      cantidad
    });

    // Construir datos para SUNAT
    const datosValidacion = {
      accion: 'CapturaCriterioValidez',
      token: '',
      num_ruc: num_ruc,
      tipocomprobante: tipocomprobante,
      cod_docide: cod_docide || '6',
      num_docide: num_docide,
      num_serie: num_serie,
      num_comprob: num_comprob,
      fec_emision: fec_emision,
      cantidad: cantidad
    };

    // Llamar a la API de SUNAT
    const response = await conReintentos(() => axios.post(
      'https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm',
      qs.stringify(datosValidacion),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 20000 // 20 segundos por intento
      }
    ));

    logger.info('✅ [SUNAT] Respuesta recibida');

    // Extraer resultado de la respuesta HTML
    const html = response.data;
    const validoMatch = html.match(/es un comprobante de pago válido/i);
    const invalidoMatch = html.match(/comprobante de pago no existe/i) || html.match(/no se puede validar/i);

    let estado = 'DESCONOCIDO';
    let mensaje = 'No se pudo determinar el estado del comprobante';

    if (validoMatch) {
      estado = 'VÁLIDO';
      mensaje = `La Factura Electrónica ${num_serie}-${num_comprob} es un comprobante de pago válido.`;
    } else if (invalidoMatch) {
      estado = 'INVÁLIDO';
      mensaje = `La Factura Electrónica ${num_serie}-${num_comprob} no es un comprobante de pago válido.`;
    }

    return res.json({
      success: true,
      estado: estado,
      mensaje: mensaje,
      datos_validados: {
        num_ruc,
        num_serie,
        num_comprob,
        fec_emision,
        cantidad
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ [SUNAT] Error validando comprobante:', error.message);

    // Detectar tipo de error
    let mensajeError = 'Error al validar comprobante en SUNAT';

    if (error.code === 'ECONNREFUSED') {
      mensajeError = 'No se puede conectar con SUNAT. Verifique la conexión a internet.';
    } else if (error.code === 'ENOTFOUND') {
      mensajeError = 'No se puede resolver el servidor de SUNAT.';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      mensajeError = 'Tiempo de espera agotado al conectar con SUNAT.';
    } else if (error.response?.status === 404) {
      mensajeError = 'El servicio de SUNAT no está disponible (404).';
    } else if (error.response?.status === 503) {
      mensajeError = 'El servicio de SUNAT está temporalmente no disponible.';
    }

    return res.status(500).json({
      success: false,
      error: mensajeError,
      ...(process.env.MOSTRAR_DETALLES_ERROR === 'true' ? { details: error.message } : {}),
      codigo_error: error.code
    });
  }
};

// POST /api/sunat/test - Endpoint de prueba
exports.testSunat = async (req, res) => {
  try {
    logger.info('🧪 [SUNAT] Ejecutando test con datos de ejemplo');

    // Datos de prueba
    const datosTest = {
      num_ruc: '20607496961',           // RUC de prueba
      tipocomprobante: '03',             // 03 = Boleta de Venta
      cod_docide: '6',                   // 6 = RUC
      num_docide: '20520711865',         // RUC del receptor
      num_serie: 'F006',                 // Serie
      num_comprob: '24926',              // Número
      fec_emision: '21/08/2026',         // Fecha
      cantidad: '365.00'                 // Monto
    };

    logger.info('📊 Datos de prueba:', datosTest);

    // Hacer la validación
    const datosValidacion = {
      accion: 'CapturaCriterioValidez',
      token: '',
      ...datosTest
    };

    const response = await conReintentos(() => axios.post(
      'https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm',
      qs.stringify(datosValidacion),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 20000
      }
    ));

    logger.info('✅ [TEST] Respuesta de SUNAT recibida');

    // Extraer información
    const html = response.data;
    const esValido = html.includes('es un comprobante de pago válido');

    return res.json({
      success: true,
      test_resultado: esValido ? 'ÉXITO' : 'FALLO',
      esValido: esValido,
      mensaje: esValido
        ? 'La API de SUNAT está funcionando correctamente'
        : 'SUNAT respondió pero el comprobante no es válido',
      datos_usados: datosTest,
      status_code: response.status,
      html_length: html.length
    });

  } catch (error) {
    logger.error('❌ [TEST] Error en test:', error.message);

    return res.status(500).json({
      success: false,
      test_resultado: 'ERROR',
      error: 'Error en la prueba de SUNAT',
      codigo_error: error.code,
      tipo_error: error.code === 'ECONNREFUSED' ? 'Conexión rechazada' :
                  error.code === 'ENOTFOUND' ? 'Host no encontrado' :
                  error.code === 'ETIMEDOUT' ? 'Tiempo agotado' :
                  'Error desconocido'
    });
  }
};
