const logger = require('./logger');
const mostrarDetalles = () => process.env.MOSTRAR_DETALLES_ERROR === 'true';

const registrarError = (error, contexto = '') => {
  const prefijo = contexto ? `❌ [${contexto}]` : '❌';
  logger.error(prefijo, error && error.message ? error.message : error);
};

const respuestaError500 = (error, mensaje = 'Error interno del servidor', contexto = '') => {
  registrarError(error, contexto);
  return mostrarDetalles() ? { error: mensaje, details: error.message } : { error: mensaje };
};

module.exports = { registrarError, respuestaError500 };
