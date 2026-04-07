# 🚀 GUÍA DE DESPLIEGUE Y CONFIGURACIÓN

**Versión:** 1.0  
**Fecha:** Marzo 14, 2026  
**Estado:** Production Ready

---

## 📋 Pre-requisitos

- Node.js 14+ instalado
- MySQL 5.7+ instalado y corriendo
- Git instalado
- Puerto 5000 disponible (Backend)
- Puerto 3000 disponible (Frontend)

---

## 🔧 Instalación

### 1. Backend (Node.js + Express)

```bash
# Navegar al directorio backend
cd /d/COMISIONES_AAAU/backend

# Instalar dependencias
npm install

# Verificar que exista el archivo .env
cat .env  # Debe contener MYSQL_HOST, MYSQL_USER, JWT_SECRET, etc.

# Iniciar servidor
npm start
```

**Salida esperada:**
```
✅ Conectado a MySQL
✅ Base de datos verificada/creada
✅ Tablas verificadas/creadas
✅ Migraciones completadas

╔════════════════════════════════════════════════════════════════╗
║   🚀 SERVIDOR INICIADO EXITOSAMENTE                           ║
║   Accesible en: http://0.0.0.0:5000                           ║
║   📚 Swagger: http://172.10.9.11:5000/api-docs               ║
╚════════════════════════════════════════════════════════════════╝
```

### 2. Frontend (React + Material Dashboard)

```bash
# En otra terminal, navegar al directorio frontend
cd /d/COMISIONES_AAAU/material-dashboard-react

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

**Salida esperada:**
```
Webpack compilation is starting...
Compiled successfully!

Local:            http://localhost:3000
On Your Network:  http://192.168.1.X:3000
```

---

## ✅ Verificación de Instalación

### 1. Backend Status

```bash
# Comprobar que el servidor está respondiendo
curl http://localhost:5000/api-docs

# Verificar endpoints específicos
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:5000/api/certificaciones-credito
```

### 2. Frontend Status

Acceder a `http://localhost:3000` en el navegador

### 3. Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Verificar tablas
USE comisiones_aaau;
SHOW TABLES;

# Verificar estructura
DESC certificaciones_credito;
DESC detalles_certificacion_credito;
```

---

## 📊 Configuración Inicial

### Variables de Entorno (.env)

```env
# Backend Configuration
NODE_ENV=production
PORT=5000

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=comisiones_aaau
MYSQL_PORT=3306

# JWT Configuration
JWT_SECRET=your_secret_key_here

# Frontend Configuration (en .env del React)
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🎯 Usando la Funcionalidad

### Paso 1: Login

1. Abrir http://localhost:3000 en el navegador
2. Login con credenciales de usuario existente

### Paso 2: Acceder al Módulo

```
Dashboard → Gestión → Certificaciones de Crédito Presupuestario
```

### Paso 3: Importar PDF

1. Click en botón azul "Importar desde PDF"
2. Se abre diálogo de carga
3. Click "Seleccionar PDF"
4. Seleccionar archivo: `CCP 2658 AAA UCAYALI - MARZO 2026.pdf`
5. Click "Procesar PDF" (esperar 2-3 segundos)

### Paso 4: Ver Preview

Frontend muestra:
- 📋 Información General
- 🎯 Meta
- 💰 Fuente de Financiamiento
- 📝 Detalles de Gasto (tabla 5 items)

### Paso 5: Aplicar Datos

Click en botón verde "Aplicar Datos" → ¡Se guarda automáticamente!

### Paso 6: Confirmar

Modal muestra:
```
✅ IMPORTACIÓN EXITOSA

Certificación creada: 32716M329AAA.U
Nota Nº: 0000002658
Monto Total: S/. 20,540.00
Detalles guardados: 5 items
```

---

## 🐛 Troubleshooting

### Error: "No se pudo conectar a MySQL"

**Solución:**
```bash
# Verificar que MySQL está corriendo
# En Windows:
net start MySQL

# En Linux:
sudo systemctl start mysql

# Verificar credenciales en .env
cat .env | grep MYSQL
```

### Error: "Puerto 5000 ya está en uso"

**Solución:**
```bash
# Cambiar puerto en .env
PORT=5001

# O liberar puerto actual
# Windows: netstat -ano | findstr :5000
# Linux: lsof -i :5000
```

### Error: "Cannot GET /api-docs"

**Solución:**
```bash
# Verificar que backend está corriendo
ps aux | grep "node start"

# Reiniciar backend
npm start
```

### Error: "PDF no se procesa"

**Solución:**
```bash
# Verificar que pdf2json está instalado
npm list pdf2json

# Si no está: npm install pdf2json

# Verificar que pdfController.js existe
ls /d/COMISIONES_AAAU/backend/controllers/pdfController.js
```

---

## 📈 Monitoreo en Producción

### Logs del Backend

```bash
# Ver logs en tiempo real
tail -f /ruta/a/logs/backend.log

# O usar PM2 (recomendado para producción)
npm install -g pm2
pm2 start /d/COMISIONES_AAAU/backend/server.js
pm2 logs
```

### Logs de Base de Datos

```bash
# Verificar que inserts fueron exitosos
SELECT COUNT(*) as total FROM certificaciones_credito;
SELECT COUNT(*) as total FROM detalles_certificacion_credito;

# Ver último registro
SELECT * FROM certificaciones_credito ORDER BY id DESC LIMIT 1;
SELECT * FROM detalles_certificacion_credito 
WHERE certificacion_credito_id = (SELECT MAX(id) FROM certificaciones_credito);
```

---

## 🔐 Seguridad en Producción

### 1. Variables de Entorno Seguras

```env
# NO HACER (valores en código):
JWT_SECRET=my_secret_123

# HACER (en archivo .env seguro):
# Archivo: /d/COMISIONES_AAAU/backend/.env.production
NODE_ENV=production
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 2. Autenticación

- ✅ Verificar que JWT_SECRET es único y fuerte
- ✅ Verificar que tokens expiran correctamente
- ✅ Verificar que solo usuarios autenticados pueden acceder

### 3. Base de Datos

```sql
-- Crear usuario con permisos mínimos
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON comisiones_aaau.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. CORS

```javascript
// En backend/server.js o app.js
const cors = require('cors');
app.use(cors({
  origin: 'https://yourdomain.com', // No usar * en producción
  credentials: true
}));
```

---

## 📊 Backup y Recuperación

### Backup Manual de BD

```bash
# Hacer backup
mysqldump -u root -p comisiones_aaau > backup_$(date +%Y%m%d).sql

# Restaurar desde backup
mysql -u root -p comisiones_aaau < backup_20260314.sql
```

### Backup de Código

```bash
# Crear archivo .zip del proyecto
zip -r comisiones_aaau_backup_$(date +%Y%m%d).zip /d/COMISIONES_AAAU/

# O usar git
cd /d/COMISIONES_AAAU
git add .
git commit -m "Production Backup - $(date)"
git push
```

---

## 📋 Checklist de Despliegue

### Pre-Despliegue

- [ ] Backend instalado y corriendo en puerto 5000
- [ ] Frontend instalado y corriendo en puerto 3000
- [ ] MySQL instalado y corriendo
- [ ] Base de datos `comisiones_aaau` creada
- [ ] Archivo `.env` configurado correctamente
- [ ] JWT_SECRET configurado (valor único y fuerte)
- [ ] Backup de base de datos actual realizado

### Testing

- [ ] Acceso a http://localhost:3000 exitoso
- [ ] Login funciona correctamente
- [ ] Módulo "Certificaciones de Crédito" accesible
- [ ] Botón "Importar desde PDF" visible
- [ ] PDF puede ser cargado sin errores
- [ ] Preview muestra 4 secciones correctamente
- [ ] Datos se guardan automáticamente
- [ ] Modal de éxito muestra resumen correcto
- [ ] Tabla se recarga automáticamente
- [ ] Base de datos tiene 1 certificación + 5 detalles

### Post-Despliegue

- [ ] Verificar logs de errors
- [ ] Confirmar backups automáticos están corriendo
- [ ] Documentar cambios en log de cambios
- [ ] Notificar a usuarios finales
- [ ] Estar disponible para soporte las primeras horas

---

## 🚀 Escalabilidad Futura

### Si necesitas procesar muchos PDFs:

1. **Implementar Queue (Celery/Bull)**
   ```bash
   npm install bull
   ```

2. **Batch Processing**
   - Permitir cargar múltiples PDFs
   - Procesarlos en background
   - Notificar cuando completar

3. **Caché de Clasificadores**
   - Redis para clasificadores frecuentes
   - Reduce queries a BD

4. **Async Processing**
   - WebSockets para notificaciones en tiempo real
   - Mejor UX mientras se procesa

---

## 📞 Soporte

Para problemas o preguntas:

1. Revisar archivos de documentación:
   - RESUMEN_EJECUTIVO.md
   - IMPORTACION_PDF_GUIA_COMPLETA.md
   - CAMBIOS_TECNICOS_ESPECIFICOS.md

2. Contacto técnico:
   - Backend: `/backend/controllers/pdfController.js`
   - Frontend: `/material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js`

3. Revisar logs:
   - Backend: `npm start` muestra logs en consola
   - Frontend: Developer Tools (F12) → Console

---

## ✅ Conclusión

Todo está configurado y listo para usar. La solución:
- ✅ Está completamente funcional
- ✅ Ha sido probada con datos reales
- ✅ Es segura y escalable
- ✅ Está completamente documentada

**¡Listo para desplegar en producción!**

---

**Versión:** 1.0  
**Última actualización:** Marzo 14, 2026  
**Estado:** ✅ PRODUCTION READY
