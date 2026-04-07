/**
 * 🔧 Migración: DESHABILITADA (usar tabla rendiciones existente)
 * Las tablas rendiciones_maestras y rendicion_comprobantes NO se crean
 * Usar la tabla 'rendiciones' creada en migración 004
 */

const crearTablaRendicionComprobantes = async (pool) => {
  try {
    console.log('\n⚠️  Migración 007 deshabilitada - usando tabla rendiciones existente\n');
    return true;
  } catch (error) {
    console.error('❌ Error en migración 007:', error.message);
    throw error;
  }
};

module.exports = { crearTablaRendicionComprobantes };
