const logger = require('./shared/logger');
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();
if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE) {
  logger.error('❌ Faltan JWT_SECRET o JWT_EXPIRE en .env. El servidor no puede iniciar.');
  process.exit(1);
}
const authMiddleware = require('./middleware/auth');
const helmet = require('helmet');
const { respuestaError500 } = require('./shared/errores');
const swaggerSpec = require('./config/swagger');
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
const rutasRoutes = require('./routes/rutas');
const sunatRoutes = require('./routes/sunat');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));

// Middleware
app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/decolecta', authMiddleware, decolectaRoutes);
app.use('/api/proveedores', authMiddleware, proveedorRoutes);
app.use('/api/tipo-comprobante', authMiddleware, tipoComprobanteRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/pdf', pdfEnrichmentRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'API funcionando correctamente' });
});
app.use('/api', comisionesRoutes);  // ← Con auth (todo lo demás)
app.use('/api/aprobaciones', authMiddleware, aprobacionesRoutes);
app.use('/api/certificaciones-credito', certificacionesRoutes);
app.use('/api/formato-emisiones/correlativo-control', correlativoControlRoutes);
app.use('/api/comprobantes', authMiddleware, comprobantesRoutes);
app.use('/api/rendiciones', authMiddleware, rendicionesRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/sunat', authMiddleware, sunatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    return res.status(500).json(respuestaError500(err));
  }
  return res.status(status).json({ error: 'Solicitud no válida' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`
╔════════════════════════════════════════════════════╗
║   🚀 SERVIDOR INICIADO EXITOSAMENTE               ║
║   Accesible en: http://0.0.0.0:${PORT}             ║
║   Red Local: http://172.10.9.11:${PORT}            ║
║   📚 Swagger: http://172.10.9.11:${PORT}/api-docs  ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

