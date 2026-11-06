const util = require('util');

const NIVELES = { debug: 10, info: 20, warn: 30, error: 40 };
const NIVEL_ACTUAL = NIVELES[(process.env.LOG_LEVEL || 'info').toLowerCase()] || NIVELES.info;
const CLAVES_SENSIBLES = /password|passwd|contrase|token|secret|authorization|cookie/i;

const ocultarSensibles = (valor, profundidad = 0) => {
  if (valor === null || typeof valor !== 'object' || profundidad > 4) return valor;
  if (Array.isArray(valor)) return valor.map((v) => ocultarSensibles(v, profundidad + 1));
  if (valor instanceof Error) return valor;
  const copia = {};
  for (const [clave, v] of Object.entries(valor)) {
    copia[clave] = CLAVES_SENSIBLES.test(clave) ? '[oculto]' : ocultarSensibles(v, profundidad + 1);
  }
  return copia;
};

const escribir = (nivel, consola, args) => {
  if (NIVELES[nivel] < NIVEL_ACTUAL) return;
  const marca = new Date().toISOString();
  const seguros = args.map((a) => (a instanceof Error ? a : ocultarSensibles(a)));
  consola(`[${marca}] ${nivel.toUpperCase()} ${util.format(...seguros)}`);
};

const logger = {
  debug: (...args) => escribir('debug', console.log, args),
  info: (...args) => escribir('info', console.log, args),
  warn: (...args) => escribir('warn', console.warn, args),
  error: (...args) => escribir('error', console.error, args),
};

module.exports = logger;
