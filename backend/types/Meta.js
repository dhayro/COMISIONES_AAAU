/**
 * @typedef {Object} Meta
 * @property {number} id - ID único de la meta
 * @property {string} nombre - Nombre descriptivo de la meta
 * @property {string} numero_meta - Número único de la meta (ejemplo: "067", "198")
 * @property {string} periodo - Período de vigencia de la meta (ejemplo: "2026")
 * @property {number|null} ambito_id - ID del ámbito asociado (FK a tabla ambitos)
 * @property {string|null} ambito_nombre - Nombre del ámbito (cuando se hace JOIN)
 * @property {number} activo - Estado de la meta (1 = activo, 0 = inactivo/eliminado)
 * @property {Date} created_at - Fecha de creación del registro
 * @property {Date} updated_at - Fecha de última actualización
 */

/**
 * @typedef {Object} CreateMetaRequest
 * @property {string} nombre - Nombre descriptivo de la meta (REQUERIDO)
 * @property {string} numero_meta - Número único de la meta (REQUERIDO)
 * @property {string} periodo - Período de vigencia (REQUERIDO)
 * @property {number|null} ambito_id - ID del ámbito (OPCIONAL)
 */

/**
 * @typedef {Object} UpdateMetaRequest
 * @property {string} [nombre] - Nombre descriptivo de la meta
 * @property {string} [numero_meta] - Número único de la meta
 * @property {string} [periodo] - Período de vigencia
 * @property {number|null} [ambito_id] - ID del ámbito
 */

/**
 * @typedef {Object} MetaResponse
 * @property {number} id - ID de la meta
 * @property {string} nombre - Nombre de la meta
 * @property {string} numero_meta - Número de la meta
 * @property {string} periodo - Período de la meta
 * @property {number|null} ambito_id - ID del ámbito
 * @property {string|null} ambito_nombre - Nombre del ámbito
 * @property {number} activo - Estado
 */

/**
 * @typedef {Object} MetaListResponse
 * @property {Meta[]} data - Array de metas
 * @property {number} total - Total de registros
 */

/**
 * @typedef {Object} ApiResponse
 * @property {string} mensaje - Mensaje de respuesta
 * @property {Meta|Meta[]} meta - Datos de la meta o metas
 * @property {string} error - Mensaje de error (cuando aplica)
 */

module.exports = {
  // Tipos documentados
  Meta: {},
  CreateMetaRequest: {},
  UpdateMetaRequest: {},
  MetaResponse: {},
  MetaListResponse: {},
  ApiResponse: {},
};
