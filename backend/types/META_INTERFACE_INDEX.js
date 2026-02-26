/**
 * ÍNDICE - Interfaces API Metas
 * 
 * Este archivo documenta la estructura y acceso a todos los archivos
 * que definen la interfaz del API de Metas
 */

// ============================================================
// ESTRUCTURA DE ARCHIVOS DE INTERFAZ
// ============================================================

const INTERFACE_FILES = {
  types: {
    path: 'backend/types/',
    files: {
      'Meta.js': {
        purpose: 'Definición de tipos TypeScript/JSDoc',
        exports: [
          '@typedef Meta',
          '@typedef CreateMetaRequest',
          '@typedef UpdateMetaRequest',
          '@typedef MetaResponse',
          '@typedef MetaListResponse',
          '@typedef ApiResponse',
        ],
        usage: 'Documentación de tipos para el IDE y generadores de código',
      },
      'MetaSchema.js': {
        purpose: 'Esquemas de validación JSON Schema',
        exports: [
          'create - Esquema para crear meta',
          'update - Esquema para actualizar meta',
          'list - Esquema de respuesta de lista',
          'single - Esquema de respuesta individual',
        ],
        usage: 'Validación de datos en lado servidor',
      },
      'MetaInterface.js': {
        purpose: 'Interfaz completa de API con ejemplos',
        exports: [
          'metaAPI - Definición de todos los endpoints',
          'httpStatuses - Códigos HTTP comúnes',
          'requiredHeaders - Headers requeridos',
          'commonErrors - Errores comúnes del API',
        ],
        usage: 'Documentación interna y testing',
      },
      'MetaOpenAPI.js': {
        purpose: 'Especificación OpenAPI 3.0 completa',
        exports: [
          'metaOpenAPI - Especificación OpenAPI 3.0',
        ],
        usage: 'Generar documentación Swagger UI, clientes SDK',
      },
      'META_INTERFACE_README.md': {
        purpose: 'Documentación completa en Markdown',
        exports: [
          'Descripción de endpoints',
          'Ejemplos de uso con cURL',
          'Estructura de datos',
          'Códigos de error',
        ],
        usage: 'Referencia rápida para desarrolladores',
      },
    },
  },
};

// ============================================================
// RESUMEN DE ENDPOINTS
// ============================================================

const ENDPOINT_SUMMARY = {
  'GET /api/metas': {
    description: 'Listar todas las metas activas',
    auth: true,
    statusCodes: [200, 401, 500],
  },
  'GET /api/metas/{id}': {
    description: 'Obtener meta por ID',
    auth: true,
    statusCodes: [200, 401, 404, 500],
  },
  'POST /api/metas': {
    description: 'Crear nueva meta',
    auth: true,
    statusCodes: [201, 400, 401, 500],
  },
  'PUT /api/metas/{id}': {
    description: 'Actualizar meta',
    auth: true,
    statusCodes: [200, 400, 401, 404, 500],
  },
  'DELETE /api/metas/{id}': {
    description: 'Eliminar meta (soft delete)',
    auth: true,
    statusCodes: [200, 401, 404, 500],
  },
};

// ============================================================
// ESTRUCTURA DE DATOS
// ============================================================

const DATA_STRUCTURE = {
  tableName: 'metas',
  primaryKey: 'id',
  columns: {
    id: {
      type: 'INT',
      autoIncrement: true,
      primaryKey: true,
      description: 'ID único de la meta',
    },
    nombre: {
      type: 'VARCHAR(255)',
      nullable: false,
      description: 'Nombre descriptivo de la meta',
    },
    numero_meta: {
      type: 'VARCHAR(3)',
      nullable: false,
      unique: true,
      description: 'Número único de 3 dígitos',
    },
    periodo: {
      type: 'VARCHAR(4)',
      nullable: false,
      description: 'Período/año (4 dígitos)',
    },
    ambito_id: {
      type: 'INT',
      nullable: true,
      foreignKey: {
        table: 'ambitos',
        column: 'id',
      },
      description: 'Referencia a ámbito',
    },
    activo: {
      type: 'TINYINT(1)',
      default: 1,
      description: 'Estado: 1=activo, 0=inactivo',
    },
    created_at: {
      type: 'TIMESTAMP',
      default: 'CURRENT_TIMESTAMP',
      description: 'Fecha de creación',
    },
    updated_at: {
      type: 'TIMESTAMP',
      default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
      description: 'Fecha de última actualización',
    },
  },
};

// ============================================================
// VALIDACIONES
// ============================================================

const VALIDATIONS = {
  nombre: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    errorMessage: 'El nombre es requerido y debe tener entre 1 y 255 caracteres',
  },
  numero_meta: {
    required: true,
    type: 'string',
    pattern: '^\\d{3}$',
    unique: true,
    errorMessage: 'El número de meta debe ser exactamente 3 dígitos y único',
  },
  periodo: {
    required: true,
    type: 'string',
    pattern: '^\\d{4}$',
    errorMessage: 'El período debe ser exactamente 4 dígitos (año)',
  },
  ambito_id: {
    required: false,
    type: ['integer', 'null'],
    errorMessage: 'ambito_id debe ser un número entero o null',
  },
};

// ============================================================
// RESPUESTAS DE EJEMPLO
// ============================================================

const EXAMPLE_RESPONSES = {
  listSuccess: {
    status: 200,
    body: [
      {
        id: 1,
        nombre: 'Meta Local - Autoridad Local de Agua Perené',
        numero_meta: '067',
        periodo: '2026',
        ambito_id: 2,
        ambito_nombre: 'ALA PERENÉ',
        activo: 1,
        created_at: '2026-02-17T10:30:00.000Z',
        updated_at: '2026-02-17T10:30:00.000Z',
      },
    ],
  },

  getSuccess: {
    status: 200,
    body: {
      id: 1,
      nombre: 'Meta Local - Autoridad Local de Agua Perené',
      numero_meta: '067',
      periodo: '2026',
      ambito_id: 2,
      ambito_nombre: 'ALA PERENÉ',
      activo: 1,
    },
  },

  createSuccess: {
    status: 201,
    body: {
      mensaje: 'Meta creada exitosamente',
      meta: {
        id: 1,
        nombre: 'Meta Local - Autoridad Local de Agua Perené',
        numero_meta: '067',
        periodo: '2026',
        ambito_id: 2,
        ambito_nombre: 'ALA PERENÉ',
        activo: 1,
      },
    },
  },

  updateSuccess: {
    status: 200,
    body: {
      mensaje: 'Meta actualizada exitosamente',
      meta: {
        id: 1,
        nombre: 'Meta Actualizada',
        numero_meta: '067',
        periodo: '2026',
        ambito_id: 2,
        ambito_nombre: 'ALA PERENÉ',
        activo: 1,
      },
    },
  },

  deleteSuccess: {
    status: 200,
    body: {
      mensaje: 'Meta eliminada exitosamente',
    },
  },

  errorNotFound: {
    status: 404,
    body: {
      error: 'Meta no encontrada',
    },
  },

  errorValidation: {
    status: 400,
    body: {
      error: 'Nombre, número de meta y período son requeridos',
    },
  },
};

// ============================================================
// INFORMACIÓN DE IMPLEMENTACIÓN
// ============================================================

const IMPLEMENTATION_INFO = {
  backend: {
    model: 'backend/models/Meta.js',
    controller: 'backend/controllers/metaController.js',
    routes: 'backend/routes/comisiones.js (líneas 1136-1259)',
  },
  frontend: {
    component: 'material-dashboard-react/src/pages/Gestion/GestionMetas.js',
    service: 'material-dashboard-react/src/services/api.js',
    routes: 'material-dashboard-react/src/routes.js',
  },
  database: {
    initialization: 'backend/config/database.js (líneas 370-430)',
    connection: 'backend/config/database.js',
  },
};

// ============================================================
// CÓMO USAR ESTA INTERFAZ
// ============================================================

const USAGE_GUIDE = {
  step1: {
    title: 'Para desarrolladores de Frontend',
    description: 'Consultar META_INTERFACE_README.md para ejemplos de uso',
    files: ['META_INTERFACE_README.md', 'MetaInterface.js'],
  },
  step2: {
    title: 'Para documentación automática',
    description: 'Usar MetaOpenAPI.js para generar Swagger UI',
    files: ['MetaOpenAPI.js'],
  },
  step3: {
    title: 'Para validación de datos',
    description: 'Usar MetaSchema.js en lado servidor',
    files: ['MetaSchema.js'],
  },
  step4: {
    title: 'Para TypeScript/IDE support',
    description: 'Usar Meta.js para definiciones de tipos',
    files: ['Meta.js'],
  },
};

// ============================================================
// EXPORTACIÓN
// ============================================================

module.exports = {
  INTERFACE_FILES,
  ENDPOINT_SUMMARY,
  DATA_STRUCTURE,
  VALIDATIONS,
  EXAMPLE_RESPONSES,
  IMPLEMENTATION_INFO,
  USAGE_GUIDE,
};
