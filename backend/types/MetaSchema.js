/**
 * Esquemas de validación para Metas
 * Define la estructura y reglas de validación de los datos de metas
 */

const metaSchemas = {
  /**
   * Esquema para crear una meta
   */
  create: {
    type: 'object',
    required: ['nombre', 'numero_meta', 'periodo'],
    properties: {
      nombre: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nombre descriptivo de la meta',
        example: 'Meta Local - Autoridad Local de Agua',
      },
      numero_meta: {
        type: 'string',
        pattern: '^\\d{3}$',
        description: 'Número único de la meta por período (3 dígitos). Debe ser único dentro del mismo período.',
        example: '067',
      },
      periodo: {
        type: 'string',
        pattern: '^\\d{4}$',
        description: 'Período de vigencia (año)',
        example: '2026',
      },
      ambito_id: {
        type: ['integer', 'null'],
        description: 'ID del ámbito asociado (opcional)',
        example: 1,
      },
    },
    additionalProperties: false,
  },

  /**
   * Esquema para actualizar una meta
   */
  update: {
    type: 'object',
    properties: {
      nombre: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Nombre descriptivo de la meta',
      },
      numero_meta: {
        type: 'string',
        pattern: '^\\d{3}$',
        description: 'Número único de la meta por período (3 dígitos). Debe ser único dentro del mismo período.',
      },
      periodo: {
        type: 'string',
        pattern: '^\\d{4}$',
        description: 'Período de vigencia (año)',
      },
      ambito_id: {
        type: ['integer', 'null'],
        description: 'ID del ámbito asociado',
      },
    },
    additionalProperties: false,
  },

  /**
   * Esquema de respuesta de lista de metas
   */
  list: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: 'ID único de la meta',
      },
      nombre: {
        type: 'string',
        description: 'Nombre descriptivo de la meta',
      },
      numero_meta: {
        type: 'string',
        description: 'Número único de la meta',
      },
      periodo: {
        type: 'string',
        description: 'Período de vigencia',
      },
      ambito_id: {
        type: ['integer', 'null'],
        description: 'ID del ámbito asociado',
      },
      ambito_nombre: {
        type: ['string', 'null'],
        description: 'Nombre del ámbito (desde JOIN)',
      },
      activo: {
        type: 'integer',
        enum: [0, 1],
        description: 'Estado de la meta',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de última actualización',
      },
    },
  },

  /**
   * Esquema de respuesta individual
   */
  single: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
      },
      nombre: {
        type: 'string',
      },
      numero_meta: {
        type: 'string',
      },
      periodo: {
        type: 'string',
      },
      ambito_id: {
        type: ['integer', 'null'],
      },
      ambito_nombre: {
        type: ['string', 'null'],
      },
      activo: {
        type: 'integer',
      },
    },
  },
};

module.exports = metaSchemas;
