const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { spawn } = require('child_process');
require('dotenv').config();
const { initDatabase } = require('./config/database');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth');
const comisionesRoutes = require('./routes/comisiones');
const aprobacionesRoutes = require('./routes/aprobaciones');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', comisionesRoutes);
app.use('/api/aprobaciones', aprobacionesRoutes);

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

const startServer = async () => {
  try {
    // Inicializar base de datos
    await initDatabase();
    
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

