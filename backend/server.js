const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { spawn } = require('child_process');
require('dotenv').config();
const { pool, initDatabase } = require('./config/database');
const swaggerSpec = require('./config/swagger');
const { ejecutarMigraciones, ejecutarMigracionesFormatoEmisiones, ejecutarMigracionesEstadoCertificado, corregirEstadoUsoEnum, agregarCertificacionId, agregarMontoUtilizado, sincronizarMontoUtilizado, ejecutarMigracionesSql, actualizarInicialesUsuarios, generarCorrelativosInicial } = require('./config/migraciones');
const { crearTablasRendicionesMaestras } = require('./migrations/004_crear_rendiciones_maestras');
const { crearTablaRendicionComprobantes } = require('./migrations/007_crear_rendicion_comprobantes');
const { agregarRendidoEnum } = require('./migrations/008_agregar_rendido_enum_estado_emision');
const authRoutes = require('./routes/auth');
const comisionesRoutes = require('./routes/comisiones');
const aprobacionesRoutes = require('./routes/aprobaciones');
const certificacionesRoutes = require('./routes/certificaciones');
const pdfRoutes = require('./routes/pdf');
const pdfEnrichmentRoutes = require('./routes/pdf-enrichment');
const correlativoControlRoutes = require('./routes/correlativoControlRoutes');
const comprobantesRoutes = require('./routes/comprobantes');
const rendicionesRoutes = require('./routes/rendiciones');
const tipoComprobanteRoutes = require('./routes/tipoComprobante');
const proveedorRoutes = require('./routes/proveedor');
const decolectaRoutes = require('./routes/decolecta');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🆕 Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/decolecta', decolectaRoutes);  // 🔥 Sin auth (terceros)
app.use('/api/proveedores', proveedorRoutes);  // 🔥 Sin auth (maestro)
app.use('/api/tipo-comprobante', tipoComprobanteRoutes);  // 🔥 Sin auth (maestro)
app.use('/api/pdf', pdfRoutes);
app.use('/api/pdf', pdfEnrichmentRoutes);
app.use('/api', comisionesRoutes);  // ← Con auth (todo lo demás)
app.use('/api/aprobaciones', aprobacionesRoutes);
app.use('/api/certificaciones-credito', certificacionesRoutes);
app.use('/api/formato-emisiones/correlativo-control', correlativoControlRoutes);
app.use('/api/comprobantes', comprobantesRoutes);
app.use('/api/rendiciones', rendicionesRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'API funcionando correctamente' });
});

// Función para ejecutar seed de usuarios
const seedUsersIfNeeded = () => {
  return new Promise((resolve) => {
    console.log('🔄 Verificando si es necesario cargar usuarios...');
    const seedProcess = spawn('node', ['scripts/seed-users.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    seedProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.warn('⚠️  Advertencia al ejecutar seed de usuarios');
        resolve();
      }
    });

    seedProcess.on('error', (err) => {
      console.warn('⚠️  Error ejecutando seed:', err.message);
      resolve();
    });
  });
};

// Iniciar servidor
const PORT = process.env.PORT || 5000;

const crearTablaCorrelativos = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Crear tabla correlativo_control
    const sql = `CREATE TABLE IF NOT EXISTS correlativo_control (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      ano INT NOT NULL,
      numero_inicial INT NOT NULL DEFAULT 1,
      numero_proximo INT NOT NULL DEFAULT 1,
      prefijo VARCHAR(50),
      descripcion VARCHAR(255),
      activo BOOLEAN DEFAULT 1,
      creado_por INT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE KEY unique_usuario_ano (usuario_id, ano),
      INDEX idx_usuario (usuario_id),
      INDEX idx_ano (ano),
      INDEX idx_activo (activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
    
    await connection.query(sql);
    console.log('✅ Tabla correlativo_control verificada/creada');
  } catch (error) {
    console.error('❌ Error creando tabla correlativo_control:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

const startServer = async () => {
  try {
    // Inicializar base de datos
    await initDatabase();
    
    // Crear tabla de correlativo_control
    await crearTablaCorrelativos(pool);
    
    // Ejecutar migraciones automáticas
    await ejecutarMigraciones(pool);
    
    // Ejecutar migraciones de formato_emisiones
    await ejecutarMigracionesFormatoEmisiones(pool);
    
    // Ejecutar migraciones de estado_uso en certificaciones
    await ejecutarMigracionesEstadoCertificado(pool);
    
    // Corregir estado_uso a ENUM si fue creado como VARCHAR
    await corregirEstadoUsoEnum(pool);
    
    // Agregar certificacion_id a formato_emisiones
    await agregarCertificacionId(pool);
    
    // Agregar columna monto_utilizado a detalles_certificacion_credito
    await agregarMontoUtilizado(pool);
    
    // Sincronizar monto_utilizado basándose en formatos existentes
    await sincronizarMontoUtilizado(pool);
    
    // 🆕 Ejecutar migraciones SQL de la carpeta migrations/
    await ejecutarMigracionesSql(pool);
    
    // 🆕 Crear tablas maestras para rendiciones (tipo_comprobante, proveedores y rendiciones)
    await crearTablasRendicionesMaestras(pool);
    
    // 🆕 Crear tablas para rendición con múltiples comprobantes
    await crearTablaRendicionComprobantes(pool);
    
    // 🆕 Agregar RENDIDO al ENUM estado_emision
    await agregarRendidoEnum(pool);    // 🆕 Actualizar iniciales de usuarios
    await actualizarInicialesUsuarios(pool);
    
    // 🆕 Generar correlativo automáticos para los usuarios
    await generarCorrelativosInicial(pool);
    
    // 🆕 Revalidar el sistema completo
    const { revalidarSistema } = require('./config/migraciones');
    await revalidarSistema(pool);
    
    // Ejecutar seed de usuarios
    await seedUsersIfNeeded();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 SERVIDOR INICIADO EXITOSAMENTE               ║
║   Accesible en: http://0.0.0.0:${PORT}             ║
║   Red Local: http://172.10.9.11:${PORT}            ║
║   📚 Swagger: http://172.10.9.11:${PORT}/api-docs  ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

