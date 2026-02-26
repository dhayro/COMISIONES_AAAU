/**
 * API Interface - Metas
 * Documentación completa de la API para gestión de metas
 * 
 * Versión: 1.0.0
 * Base URL: /api
 */

const metaAPI = {
  /**
   * GET /metas
   * Listar todas las metas activas
   * 
   * @description Obtiene una lista completa de todas las metas activas
   * @returns {Array} Array de objetos Meta
   * @statusCode 200 - Éxito
   * @statusCode 500 - Error del servidor
   * 
   * @example
   * // Request
   * GET /api/metas
   * Authorization: Bearer <token>
   * 
   * // Response 200
   * [
   *   {
   *     "id": 1,
   *     "nombre": "Meta Local - Autoridad Local de Agua Perené",
   *     "numero_meta": "067",
   *     "periodo": "2026",
   *     "ambito_id": 2,
   *     "ambito_nombre": "ALA PERENÉ",
   *     "activo": 1,
   *     "created_at": "2026-02-17T10:30:00.000Z",
   *     "updated_at": "2026-02-17T10:30:00.000Z"
   *   },
   *   ...
   * ]
   */
  GET_LIST: {
    method: 'GET',
    endpoint: '/metas',
    auth: true,
    description: 'Listar todas las metas activas',
    responses: {
      200: {
        description: 'Lista de metas obtenida exitosamente',
        schema: 'array',
      },
      500: {
        description: 'Error del servidor',
      },
    },
  },

  /**
   * GET /metas/{id}
   * Obtener una meta específica por ID
   * 
   * @description Obtiene los detalles de una meta específica
   * @param {number} id - ID de la meta
   * @returns {Object} Objeto Meta
   * @statusCode 200 - Éxito
   * @statusCode 404 - Meta no encontrada
   * @statusCode 500 - Error del servidor
   * 
   * @example
   * // Request
   * GET /api/metas/1
   * Authorization: Bearer <token>
   * 
   * // Response 200
   * {
   *   "id": 1,
   *   "nombre": "Meta Local - Autoridad Local de Agua Perené",
   *   "numero_meta": "067",
   *   "periodo": "2026",
   *   "ambito_id": 2,
   *   "ambito_nombre": "ALA PERENÉ",
   *   "activo": 1
   * }
   */
  GET_BY_ID: {
    method: 'GET',
    endpoint: '/metas/{id}',
    auth: true,
    parameters: {
      id: {
        type: 'integer',
        required: true,
        description: 'ID de la meta',
      },
    },
    responses: {
      200: {
        description: 'Meta obtenida exitosamente',
        schema: 'object',
      },
      404: {
        description: 'Meta no encontrada',
      },
      500: {
        description: 'Error del servidor',
      },
    },
  },

  /**
   * POST /metas
   * Crear una nueva meta
   * 
   * @description Crea una nueva meta en el sistema
   * @param {Object} body - Datos de la meta
   * @param {string} body.nombre - Nombre descriptivo (requerido)
   * @param {string} body.numero_meta - Número único de 3 dígitos (requerido)
   * @param {string} body.periodo - Período/año (requerido)
   * @param {number} [body.ambito_id] - ID del ámbito (opcional)
   * @returns {Object} Meta creada
   * @statusCode 201 - Éxito, recurso creado
   * @statusCode 400 - Datos inválidos o faltantes
   * @statusCode 500 - Error del servidor
   * 
   * @example
   * // Request
   * POST /api/metas
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * 
   * {
   *   "nombre": "Meta Local - Autoridad Local de Agua Tarma",
   *   "numero_meta": "068",
   *   "periodo": "2026",
   *   "ambito_id": 3
   * }
   * 
   * // Response 201
   * {
   *   "mensaje": "Meta creada exitosamente",
   *   "meta": {
   *     "id": 2,
   *     "nombre": "Meta Local - Autoridad Local de Agua Tarma",
   *     "numero_meta": "068",
   *     "periodo": "2026",
   *     "ambito_id": 3,
   *     "ambito_nombre": "ALA TARMA",
   *     "activo": 1
   *   }
   * }
   */
  POST_CREATE: {
    method: 'POST',
    endpoint: '/metas',
    auth: true,
    description: 'Crear nueva meta',
    requestBody: {
      required: true,
      content: 'application/json',
      schema: {
        type: 'object',
        required: ['nombre', 'numero_meta', 'periodo'],
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre descriptivo de la meta',
          },
          numero_meta: {
            type: 'string',
            description: 'Número único (3 dígitos)',
            pattern: '^\\d{3}$',
          },
          periodo: {
            type: 'string',
            description: 'Período de vigencia (año)',
            pattern: '^\\d{4}$',
          },
          ambito_id: {
            type: ['integer', 'null'],
            description: 'ID del ámbito (opcional)',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Meta creada exitosamente',
      },
      400: {
        description: 'Datos faltantes o inválidos',
      },
      500: {
        description: 'Error del servidor',
      },
    },
  },

  /**
   * PUT /metas/{id}
   * Actualizar una meta existente
   * 
   * @description Actualiza los datos de una meta existente
   * @param {number} id - ID de la meta a actualizar
   * @param {Object} body - Datos a actualizar
   * @param {string} [body.nombre] - Nuevo nombre
   * @param {string} [body.numero_meta] - Nuevo número
   * @param {string} [body.periodo] - Nuevo período
   * @param {number} [body.ambito_id] - Nuevo ID de ámbito
   * @returns {Object} Meta actualizada
   * @statusCode 200 - Éxito
   * @statusCode 400 - Sin campos para actualizar
   * @statusCode 404 - Meta no encontrada
   * @statusCode 500 - Error del servidor
   * 
   * @example
   * // Request
   * PUT /api/metas/1
   * Authorization: Bearer <token>
   * Content-Type: application/json
   * 
   * {
   *   "nombre": "Meta Local - Autoridad Local de Agua Perené - Actualizada",
   *   "ambito_id": 2
   * }
   * 
   * // Response 200
   * {
   *   "mensaje": "Meta actualizada exitosamente",
   *   "meta": {
   *     "id": 1,
   *     "nombre": "Meta Local - Autoridad Local de Agua Perené - Actualizada",
   *     "numero_meta": "067",
   *     "periodo": "2026",
   *     "ambito_id": 2,
   *     "ambito_nombre": "ALA PERENÉ",
   *     "activo": 1
   *   }
   * }
   */
  PUT_UPDATE: {
    method: 'PUT',
    endpoint: '/metas/{id}',
    auth: true,
    description: 'Actualizar meta',
    parameters: {
      id: {
        type: 'integer',
        required: true,
        description: 'ID de la meta',
      },
    },
    requestBody: {
      required: true,
      content: 'application/json',
      schema: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          numero_meta: { type: 'string' },
          periodo: { type: 'string' },
          ambito_id: { type: ['integer', 'null'] },
        },
      },
    },
    responses: {
      200: {
        description: 'Meta actualizada exitosamente',
      },
      400: {
        description: 'Sin campos para actualizar',
      },
      404: {
        description: 'Meta no encontrada',
      },
      500: {
        description: 'Error del servidor',
      },
    },
  },

  /**
   * DELETE /metas/{id}
   * Eliminar una meta (soft delete)
   * 
   * @description Marca una meta como eliminada (soft delete, no elimina de la BD)
   * @param {number} id - ID de la meta a eliminar
   * @returns {Object} Confirmación de eliminación
   * @statusCode 200 - Éxito
   * @statusCode 404 - Meta no encontrada
   * @statusCode 500 - Error del servidor
   * 
   * @example
   * // Request
   * DELETE /api/metas/1
   * Authorization: Bearer <token>
   * 
   * // Response 200
   * {
   *   "mensaje": "Meta eliminada exitosamente"
   * }
   */
  DELETE: {
    method: 'DELETE',
    endpoint: '/metas/{id}',
    auth: true,
    description: 'Eliminar meta (soft delete)',
    parameters: {
      id: {
        type: 'integer',
        required: true,
        description: 'ID de la meta',
      },
    },
    responses: {
      200: {
        description: 'Meta eliminada exitosamente',
      },
      404: {
        description: 'Meta no encontrada',
      },
      500: {
        description: 'Error del servidor',
      },
    },
  },
};

/**
 * Estados HTTP comúnes
 */
const httpStatuses = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
};

/**
 * Headers requeridos
 */
const requiredHeaders = {
  Authorization: 'Bearer <token>',
  'Content-Type': 'application/json',
};

/**
 * Errores comúnes
 */
const commonErrors = {
  MISSING_REQUIRED_FIELDS: {
    status: 400,
    message: 'Nombre, número de meta y período son requeridos',
  },
  META_NOT_FOUND: {
    status: 404,
    message: 'Meta no encontrada',
  },
  NO_FIELDS_TO_UPDATE: {
    status: 400,
    message: 'Debe proporcionar al menos un campo para actualizar',
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: 'Error interno del servidor',
  },
};

module.exports = {
  metaAPI,
  httpStatuses,
  requiredHeaders,
  commonErrors,
};
