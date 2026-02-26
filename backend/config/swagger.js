const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestión de Comisiones AAAU',
      version: '1.0.0',
      description: 'API REST para gestión de comisiones de viaje con autenticación JWT',
      contact: {
        name: 'Soporte',
        email: 'soporte@aaau.pe'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            email: {
              type: 'string'
            },
            nombre: {
              type: 'string'
            },
            rol: {
              type: 'string',
              enum: ['admin', 'usuario']
            }
          }
        },
        Comision: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            ambito: {
              type: 'string'
            },
            lugar: {
              type: 'string'
            },
            fecha_inicio: {
              type: 'string',
              format: 'date'
            },
            fecha_fin: {
              type: 'string',
              format: 'date'
            },
            comisionados: {
              type: 'string'
            },
            actividades: {
              type: 'string'
            },
            dias: {
              type: 'integer'
            },
            costo_xdia: {
              type: 'number',
              format: 'decimal'
            },
            costo_pasajes_nacional: {
              type: 'number',
              format: 'decimal'
            },
            costo_pasajes_local: {
              type: 'number',
              format: 'decimal'
            },
            costo_combustible: {
              type: 'number',
              format: 'decimal'
            },
            costo_comision_por_comisionado: {
              type: 'number',
              format: 'decimal'
            },
            costo_total_comision: {
              type: 'number',
              format: 'decimal'
            },
            observacion: {
              type: 'string'
            },
            creado_en: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
