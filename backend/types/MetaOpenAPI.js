/**
 * Especificación OpenAPI 3.0 - API Metas
 * Define la interfaz completa del API de metas en formato OpenAPI
 */

const metaOpenAPI = {
  openapi: '3.0.0',
  info: {
    title: 'API Metas',
    description: 'Sistema de gestión de metas organizacionales',
    version: '1.0.0',
    contact: {
      name: 'Soporte API',
      email: 'soporte@aaaucayali.gob.pe',
    },
    license: {
      name: 'MIT',
    },
  },

  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Servidor de desarrollo',
    },
    {
      url: 'https://api.aaaucayali.gob.pe/api',
      description: 'Servidor de producción',
    },
  ],

  paths: {
    '/metas': {
      get: {
        tags: ['Metas'],
        summary: 'Listar todas las metas activas',
        description:
          'Obtiene una lista completa de todas las metas activas en el sistema',
        operationId: 'listarMetas',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'Lista de metas obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Meta',
                  },
                },
              },
            },
          },
          '401': {
            description: 'No autorizado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Error interno del servidor',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Metas'],
        summary: 'Crear nueva meta',
        description: 'Crea una nueva meta en el sistema',
        operationId: 'crearMeta',
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateMetaRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Meta creada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: {
                      type: 'string',
                      example: 'Meta creada exitosamente',
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Datos inválidos o faltantes',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado',
          },
          '500': {
            description: 'Error interno del servidor',
          },
        },
      },
    },

    '/metas/{id}': {
      get: {
        tags: ['Metas'],
        summary: 'Obtener meta por ID',
        description: 'Obtiene los detalles de una meta específica',
        operationId: 'obtenerMetaPorId',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'ID de la meta',
          },
        ],
        responses: {
          '200': {
            description: 'Meta obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Meta',
                },
              },
            },
          },
          '401': {
            description: 'No autorizado',
          },
          '404': {
            description: 'Meta no encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Error interno del servidor',
          },
        },
      },
      put: {
        tags: ['Metas'],
        summary: 'Actualizar meta',
        description: 'Actualiza los datos de una meta existente',
        operationId: 'actualizarMeta',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'ID de la meta',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateMetaRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Meta actualizada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: {
                      type: 'string',
                      example: 'Meta actualizada exitosamente',
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Datos inválidos',
          },
          '401': {
            description: 'No autorizado',
          },
          '404': {
            description: 'Meta no encontrada',
          },
          '500': {
            description: 'Error interno del servidor',
          },
        },
      },
      delete: {
        tags: ['Metas'],
        summary: 'Eliminar meta',
        description: 'Marca una meta como eliminada (soft delete)',
        operationId: 'eliminarMeta',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'ID de la meta',
          },
        ],
        responses: {
          '200': {
            description: 'Meta eliminada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: {
                      type: 'string',
                      example: 'Meta eliminada exitosamente',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'No autorizado',
          },
          '404': {
            description: 'Meta no encontrada',
          },
          '500': {
            description: 'Error interno del servidor',
          },
        },
      },
    },
  },

  components: {
    schemas: {
      Meta: {
        type: 'object',
        required: [
          'id',
          'nombre',
          'numero_meta',
          'periodo',
          'activo',
        ],
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
            description: 'ID único de la meta',
            example: 1,
          },
          nombre: {
            type: 'string',
            description: 'Nombre descriptivo de la meta',
            example: 'Meta Local - Autoridad Local de Agua Perené',
            minLength: 1,
            maxLength: 255,
          },
          numero_meta: {
            type: 'string',
            description: 'Número único de la meta (3 dígitos)',
            example: '067',
            pattern: '^\\d{3}$',
          },
          periodo: {
            type: 'string',
            description: 'Período de vigencia (año)',
            example: '2026',
            pattern: '^\\d{4}$',
          },
          ambito_id: {
            type: ['integer', 'null'],
            format: 'int32',
            description: 'ID del ámbito asociado',
            example: 2,
            nullable: true,
          },
          ambito_nombre: {
            type: ['string', 'null'],
            description: 'Nombre del ámbito (incluido mediante JOIN)',
            example: 'ALA PERENÉ',
            nullable: true,
          },
          activo: {
            type: 'integer',
            enum: [0, 1],
            description: 'Estado: 1=activo, 0=inactivo',
            example: 1,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
            example: '2026-02-17T10:30:00.000Z',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de última actualización',
            example: '2026-02-17T10:30:00.000Z',
          },
        },
      },

      CreateMetaRequest: {
        type: 'object',
        required: ['nombre', 'numero_meta', 'periodo'],
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre descriptivo de la meta',
            example: 'Meta Local - Autoridad Local de Agua Perené',
            minLength: 1,
            maxLength: 255,
          },
          numero_meta: {
            type: 'string',
            description: 'Número único (3 dígitos)',
            example: '067',
            pattern: '^\\d{3}$',
          },
          periodo: {
            type: 'string',
            description: 'Período/año (4 dígitos)',
            example: '2026',
            pattern: '^\\d{4}$',
          },
          ambito_id: {
            type: ['integer', 'null'],
            description: 'ID del ámbito (opcional)',
            example: 2,
            nullable: true,
          },
        },
      },

      UpdateMetaRequest: {
        type: 'object',
        properties: {
          nombre: {
            type: 'string',
            description: 'Nombre descriptivo de la meta',
            minLength: 1,
            maxLength: 255,
          },
          numero_meta: {
            type: 'string',
            description: 'Número único (3 dígitos)',
            pattern: '^\\d{3}$',
          },
          periodo: {
            type: 'string',
            description: 'Período/año (4 dígitos)',
            pattern: '^\\d{4}$',
          },
          ambito_id: {
            type: ['integer', 'null'],
            description: 'ID del ámbito',
            nullable: true,
          },
        },
      },

      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Descripción del error',
            example: 'Meta no encontrada',
          },
        },
      },
    },

    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Token de autenticación',
      },
    },
  },

  tags: [
    {
      name: 'Metas',
      description: 'Operaciones relacionadas con metas',
    },
  ],
};

module.exports = metaOpenAPI;
