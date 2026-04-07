# ⚡ QUICK START - IMPLEMENTACIÓN RÁPIDA (30 MINUTOS)

**Objetivo:** Poner en funcionamiento el módulo Certificaciones de Crédito en 30 minutos  
**Complejidad:** 🟢 Simple (sigue paso-a-paso)  
**Requisitos:** Node.js, MySQL, acceso a servidor  

---

## 🔥 ANTES DE COMENZAR

```bash
# 1. Verificar que tienes acceso a:
✅ Database (MySQL running)
✅ Backend folder (node_modules installed)
✅ Frontend folder (node_modules installed)
✅ Credenciales de BD (usuario/password)
```

---

## ⏱️ PASO-A-PASO RÁPIDO

### PASO 1: BASE DE DATOS (3 MINUTOS)

**Opción A: Línea de comandos**
```bash
# Ir a carpeta database (desde raíz del proyecto)
cd database

# Ejecutar script SQL
mysql -u root -p nombre_base_datos < schema_certificaciones_credito.sql

# Verificar (opcional)
mysql -u root -p nombre_base_datos
> SHOW TABLES LIKE 'certificaciones%';
> DESC certificaciones_credito;
> EXIT;
```

**Opción B: MySQL Workbench**
1. Abrir MySQL Workbench
2. New Query Tab
3. Abrir archivo: `database/schema_certificaciones_credito.sql`
4. Ejecutar (Ctrl+Enter o icono play)
5. Verificar tablas creadas

✅ **Si ves 2 tablas:** `certificaciones_credito` y `detalles_certificacion_credito` → ¡LISTO!

---

### PASO 2: BACKEND - MODELOS (3 MINUTOS)

**Copiar archivo del modelo:**

```bash
# Desde raíz del proyecto, copiar:
# Origen: [archivo proporcionado]
# Destino: backend/models/CertificacionCredito.js

# Windows (PowerShell):
Copy-Item "CertificacionCredito.js" -Destination "backend\models\"

# Mac/Linux (Bash):
cp CertificacionCredito.js backend/models/
```

✅ **Verificar:** Archivo existe en `backend/models/CertificacionCredito.js`

---

### PASO 3: BACKEND - CONTROLLERS (3 MINUTOS)

**Copiar archivo del controller:**

```bash
# Copiar:
# Origen: [archivo proporcionado]
# Destino: backend/controllers/certificacionCreditoController.js

# Windows:
Copy-Item "certificacionCreditoController.js" -Destination "backend\controllers\"

# Mac/Linux:
cp certificacionCreditoController.js backend/controllers/
```

✅ **Verificar:** Archivo existe en `backend/controllers/certificacionCreditoController.js`

---

### PASO 4: BACKEND - RUTAS (5 MINUTOS)

**Actualizar archivo de rutas:**

1. Abrir: `backend/routes/comisiones.js`
2. Ir al FINAL del archivo (antes del `module.exports`)
3. Agregar el siguiente código:

```javascript
// ============================================
// RUTAS CERTIFICACIÓN DE CRÉDITO PRESUPUESTARIO
// ============================================

const certificacionCreditoController = require('../controllers/certificacionCreditoController');

// Rutas Certificaciones
router.get('/certificaciones-credito', authMiddleware, certificacionCreditoController.listar);
router.post('/certificaciones-credito', authMiddleware, certificacionCreditoController.crear);
router.get('/certificaciones-credito/:id', authMiddleware, certificacionCreditoController.obtenerPorId);
router.put('/certificaciones-credito/:id', authMiddleware, certificacionCreditoController.actualizar);
router.delete('/certificaciones-credito/:id', authMiddleware, certificacionCreditoController.eliminar);

// Rutas Detalles de Certificación
router.get('/certificaciones-credito/:id/detalles', authMiddleware, certificacionCreditoController.listarDetalles);
router.post('/detalles-certificacion', authMiddleware, certificacionCreditoController.crearDetalle);
router.get('/detalles-certificacion/:id', authMiddleware, certificacionCreditoController.obtenerDetallePorId);
router.put('/detalles-certificacion/:id', authMiddleware, certificacionCreditoController.actualizarDetalle);
router.delete('/detalles-certificacion/:id', authMiddleware, certificacionCreditoController.eliminarDetalle);

// Cálculos
router.get('/certificaciones-credito/:id/total', authMiddleware, certificacionCreditoController.obtenerTotalMonto);
```

4. Guardar archivo
5. **IMPORTANTE:** Reiniciar servidor backend

```bash
# Si está corriendo, presionar Ctrl+C en terminal

# Reiniciar:
cd backend
npm start
```

✅ **Si ves mensaje de inicio sin errores → ¡LISTO!**

---

### PASO 5: FRONTEND - API SERVICE (2 MINUTOS)

**Actualizar servicio API:**

1. Abrir: `material-dashboard-react/src/services/api.js`
2. Ir al FINAL (antes de `export default ApiService;`)
3. Agregar métodos:

```javascript
  // Certificaciones de Crédito
  async obtenerCertificacionesCredito(filtros = {}) {
    return this.request('/certificaciones-credito', 'GET', null, filtros);
  }

  async obtenerCertificacionCreditoPorId(id) {
    return this.request(`/certificaciones-credito/${id}`);
  }

  async crearCertificacionCredito(datos) {
    return this.request('/certificaciones-credito', 'POST', datos);
  }

  async actualizarCertificacionCredito(id, datos) {
    return this.request(`/certificaciones-credito/${id}`, 'PUT', datos);
  }

  async eliminarCertificacionCredito(id) {
    return this.request(`/certificaciones-credito/${id}`, 'DELETE');
  }

  // Detalles de Certificación
  async obtenerDetallesCertificacion(certificacion_credito_id) {
    return this.request(`/certificaciones-credito/${certificacion_credito_id}/detalles`);
  }

  async crearDetalleCertificacion(datos) {
    return this.request('/detalles-certificacion', 'POST', datos);
  }

  async actualizarDetalleCertificacion(id, datos) {
    return this.request(`/detalles-certificacion/${id}`, 'PUT', datos);
  }

  async eliminarDetalleCertificacion(id) {
    return this.request(`/detalles-certificacion/${id}`, 'DELETE');
  }

  async obtenerTotalMontoCertificacion(certificacion_credito_id) {
    return this.request(`/certificaciones-credito/${certificacion_credito_id}/total`);
  }
```

4. Guardar archivo

✅ **Verificar:** Sin errores de sintaxis

---

### PASO 6: FRONTEND - COMPONENTE (3 MINUTOS)

**Copiar componente React:**

```bash
# Copiar:
# Origen: [archivo proporcionado]
# Destino: material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js

# Windows:
Copy-Item "GestionCertificacionesCredito.js" -Destination "material-dashboard-react\src\pages\Gestion\"

# Mac/Linux:
cp GestionCertificacionesCredito.js material-dashboard-react/src/pages/Gestion/
```

✅ **Verificar:** Archivo existe en ubicación correcta

---

### PASO 7: FRONTEND - ROUTING (3 MINUTOS)

**Agregar ruta en el sistema:**

1. Abrir archivo de rutas (depende tu estructura):
   - Usualmente: `material-dashboard-react/src/index.js` 
   - O: `material-dashboard-react/src/routes.js`
   - O similar

2. Buscar donde están importados otros componentes de Gestion:
   ```javascript
   import GestionMetas from './pages/Gestion/GestionMetas';
   import GestionComisiones from './pages/Gestion/GestionComisiones';
   // ... otros
   ```

3. Agregar:
   ```javascript
   import GestionCertificacionesCredito from './pages/Gestion/GestionCertificacionesCredito';
   ```

4. Buscar donde se definen las rutas (usualmente en un array `routes` o dentro de `<Router>`)

5. Agregar ruta (modelo según las existentes):
   ```javascript
   {
     path: '/gestion/certificaciones-credito',
     component: GestionCertificacionesCredito,
     name: 'Certificaciones de Crédito'
   }
   ```

✅ **Verificar:** Código sin errores de sintaxis

---

### PASO 8: FRONTEND - MENÚ (2 MINUTOS - OPCIONAL)

**Agregar item al menú:**

1. Buscar archivo de navegación/menu (usualmente en componentes de layout)
2. Agregar opción similar a:
   ```javascript
   {
     text: "Certificaciones de Crédito",
     href: "/gestion/certificaciones-credito",
     icon: <DocumentCheckIcon />,
     admin: true  // si solo admins ven
   }
   ```

✅ **Opcional pero recomendado para usabilidad**

---

## ✅ PRUEBA RÁPIDA (5 MINUTOS)

### Backend Test
```bash
# En terminal, probar endpoint básico:
curl http://localhost:3001/api/certificaciones-credito

# Debería responder (con token auth):
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/certificaciones-credito
```

### Frontend Test
```bash
# 1. Ir a la URL del módulo
http://localhost:3000/gestion/certificaciones-credito

# 2. Ver si carga la tabla vacía

# 3. Hacer clic en "Nueva Certificación"

# 4. Llenar formulario:
   - Nota: "CERTIFICACIÓN PRUEBA"
   - Mes: "ENERO"
   - Tipo Documento: "RES"
   - Número Documento: "123456"

# 5. Hacer clic "Guardar"

# 6. Ver si aparece en tabla

# Si TODO FUNCIONA ✅ → ¡IMPLEMENTACIÓN EXITOSA!
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### ❌ Error: "Tabla no existe"
```
Solución: Ejecutar SQL script nuevamente
$ mysql -u root -p base_datos < database/schema_certificaciones_credito.sql
```

### ❌ Error: "Controller not found"
```
Solución: Reiniciar backend
$ npm start en carpeta backend
```

### ❌ Error 404 en API
```
Solución: Verificar rutas en comisiones.js
- Revisar que require del controller esté correcto
- Reiniciar backend
```

### ❌ Componente no carga
```
Solución: Verificar ruta en routing
- Importación correcta del componente
- Path en router config coincide con carpeta real
```

### ❌ "Unauthorized" en API
```
Solución: Verificar token
- Debes estar logueado
- Token en header: Authorization: Bearer TOKEN
```

---

## 📊 VERIFICACIÓN FINAL

**Checklist de verificación rápida:**

```
✅ Tablas BD creadas
   SHOW TABLES LIKE 'certificaciones%';

✅ Archivos backend en lugar
   ls backend/models/CertificacionCredito.js
   ls backend/controllers/certificacionCreditoController.js

✅ Rutas agregadas
   grep -n "certificaciones-credito" backend/routes/comisiones.js

✅ API service actualizado
   grep -n "obtenerCertificacionesCredito" src/services/api.js

✅ Componente en lugar
   ls material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js

✅ Servidor backend corriendo
   Viendo puerto 3001 (o el configurado)

✅ Servidor frontend corriendo
   Accesible en localhost:3000

✅ URL accesible
   http://localhost:3000/gestion/certificaciones-credito

✅ API responde
   GET /api/certificaciones-credito (con token)

✅ Puedo crear certificación
   Click "Nueva" → Llenar form → Guardar → Ver en tabla

✅ FUNCIONAMIENTO COMPLETO ✅
```

---

## ⏰ TIEMPO TOTAL

| Paso | Tiempo |
|------|--------|
| 1. BD | 3 min |
| 2. Model | 3 min |
| 3. Controller | 3 min |
| 4. Routes | 5 min |
| 5. API Service | 2 min |
| 6. Component | 3 min |
| 7. Routing | 3 min |
| 8. Menú | 2 min |
| **Pruebas** | **5 min** |
| **TOTAL** | **~30 min** |

---

## 📖 DOCUMENTACIÓN POR REFERENCIA

Si algo no funciona, ver:

1. **Errores de sintaxis?**  
   → `RESUMEN_CERTIFICACIONES_CREDITO.md`

2. **¿Cómo funciona?**  
   → `IMPLEMENTACION_CERTIFICACIONES_CREDITO.md`

3. **¿Qué hago si hay error?**  
   → `CHECKLIST_CERTIFICACIONES_CREDITO.md` (Troubleshooting)

4. **¿Cómo lo usa el usuario?**  
   → `GUIA_PRACTICA_CERTIFICACIONES_CREDITO.md`

5. **Índice general**  
   → `INDICE_CERTIFICACIONES_CREDITO.md`

---

## 🎉 ¡COMPLETADO!

Una vez termines estos pasos, el módulo está 100% funcional.

**Próximos pasos opcionales:**
- [ ] Capacitar usuarios (usar GUIA_PRACTICA)
- [ ] Crear datos de prueba
- [ ] Hacer backup de BD
- [ ] Documentar cambios en proyecto
- [ ] Comunicar a equipo

---

**¿Problemas?** Consulta los archivos de documentación.  
**¿Preguntas?** Ver FAQ en `GUIA_PRACTICA_CERTIFICACIONES_CREDITO.md`  
**¿Verificación?** Usar `CHECKLIST_CERTIFICACIONES_CREDITO.md`

---

*Última actualización: 2026-03-13*
