# 🚀 QUICK START - SISTEMA DE RENDICIONES

**Para empezar rápido después de esta iteración**

---

## 1️⃣ REINICIAR BACKEND

```bash
cd d:\COMISIONES_AAAU\backend
npm start
```

**Logs esperados:**
```
✅ Tabla tipo_comprobante creada/verificada
✅ Tabla proveedores creada/verificada
✅ Tabla rendiciones creada/verificada
✅ SISTEMA DE RENDICIONES LISTO
```

---

## 2️⃣ TESTEAR ENDPOINTS CON CURL

### A) Crear Tipo de Comprobante
```bash
curl -X POST http://localhost:5000/api/tipo-comprobante/crear \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Factura","descripcion":"Comprobante de venta"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "tipo_comprobante": {
    "id": 1,
    "nombre": "Factura",
    "descripcion": "Comprobante de venta",
    "activo": 1
  }
}
```

### B) Listar Tipos
```bash
curl http://localhost:5000/api/tipo-comprobante/listar
```

### C) Crear Proveedor
```bash
curl -X POST http://localhost:5000/api/proveedores/crear \
  -H "Content-Type: application/json" \
  -d '{
    "razon_social": "Restaurante XYZ",
    "ruc_dni": "20123456789",
    "tipo_documento": "RUC",
    "email": "info@restaurante.com"
  }'
```

### D) Listar Proveedores
```bash
curl http://localhost:5000/api/proveedores/listar
```

### E) Crear Rendición (SIN Validar Estado)
```bash
curl -X POST http://localhost:5000/api/rendiciones/crear \
  -H "Content-Type: application/json" \
  -d '{
    "formato_emision_id": 1,
    "formato_emisiones_detalles_id": 1,
    "tipo_comprobante_id": 1,
    "proveedor_id": 1,
    "numero_comprobante": "F-001",
    "fecha_comprobante": "2026-04-06",
    "monto": 250.50,
    "tipo_viatitico": null
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "rendicion": {
    "id": 1,
    "formato_emision_id": 1,
    "formato_emisiones_detalles_id": 1,
    "tipo_comprobante_id": 1,
    "proveedor_id": 1,
    "numero_comprobante": "F-001",
    "fecha_comprobante": "2026-04-06",
    "monto": 250.50,
    "tipo_viatitico": null,
    "estado_rendicion": "PENDIENTE"
  }
}
```

### F) Listar Rendiciones
```bash
curl http://localhost:5000/api/rendiciones/listar
```

### G) Listar Rendiciones por Formato
```bash
curl "http://localhost:5000/api/rendiciones/listar?formato_emision_id=1"
```

### H) Obtener Rendición con Detalles
```bash
curl http://localhost:5000/api/rendiciones/1
```

---

## 3️⃣ VERIFICAR EN BASE DE DATOS

```sql
-- Conectarse a MySQL
mysql -u root -p

-- Seleccionar BD
USE [nombre_bd];

-- Ver tablas
SHOW TABLES LIKE 'tipo_%';
SHOW TABLES LIKE 'proveedores';
SHOW TABLES LIKE 'rendiciones';

-- Ver datos
SELECT * FROM tipo_comprobante;
SELECT * FROM proveedores;
SELECT * FROM rendiciones;

-- Ver rendiciones con detalles
SELECT r.*, tc.nombre, p.razon_social
FROM rendiciones r
LEFT JOIN tipo_comprobante tc ON r.tipo_comprobante_id = tc.id
LEFT JOIN proveedores p ON r.proveedor_id = p.id;
```

---

## 4️⃣ VERIFICAR ARCHIVOS CREADOS

```bash
# Verificar backend
ls -la backend/controllers/rendicionesController.js
ls -la backend/controllers/tipoComprobanteController.js
ls -la backend/controllers/proveedorController.js
ls -la backend/routes/rendiciones.js
ls -la backend/routes/tipoComprobante.js
ls -la backend/routes/proveedor.js
ls -la backend/migrations/004_crear_rendiciones_maestras.js

# Verificar frontend
grep -n "crearRendicion" material-dashboard-react/src/services/api.js
grep -n "listarProveedores" material-dashboard-react/src/services/api.js
```

---

## 5️⃣ TESTING CHECKLIST RÁPIDO

### ✅ Backend Startup (1 min)
- [ ] npm start ejecuta sin errores
- [ ] Ver "SISTEMA DE RENDICIONES LISTO" en logs

### ✅ API Endpoints (5 min)
- [ ] POST /api/tipo-comprobante/crear → 201
- [ ] GET /api/tipo-comprobante/listar → 200
- [ ] POST /api/proveedores/crear → 201
- [ ] GET /api/proveedores/listar → 200
- [ ] POST /api/rendiciones/crear → 201
- [ ] GET /api/rendiciones/listar → 200

### ✅ Database (3 min)
- [ ] mysql> SELECT COUNT(*) FROM tipo_comprobante;
- [ ] mysql> SELECT COUNT(*) FROM proveedores;
- [ ] mysql> SELECT COUNT(*) FROM rendiciones;

### ✅ Frontend Service (2 min)
- [ ] npm start en frontend
- [ ] Abre DevTools → Console
- [ ] Prueba: `api.crearRendicion({...})`

---

## 6️⃣ ARCHIVOS DE DOCUMENTACIÓN

| Archivo | Propósito | Cuándo leer |
|---------|-----------|------------|
| `CHECKLIST_SISTEMA_RENDICIONES.md` | Checklist completo | Antes de testing |
| `ITERACION_FINAL_RENDICIONES_COMPLETADA.md` | Overview técnico | Para entender el sistema |
| `SISTEMA_RENDICIONES_IMPLEMENTACION_COMPLETADA.md` | Detalles técnicos | Para debuggear |
| `RESUMEN_EJECUTIVO_ITERACION_RENDICIONES.md` | Resumen ejecutivo | Para reportes |
| `verificar_implementacion.sh` | Script de validación | Para validación automatizada |

---

## 7️⃣ ERRORES COMUNES & SOLUCIONES

### Error: "Tabla rendiciones no existe"
```
CAUSA: Migración no ejecutó al startup
SOLUCIÓN: Reiniciar backend y revisar logs
```

### Error: "formato_emisiones_detalles_id es requerido"
```
CAUSA: No enviaste el ID del detalle
SOLUCIÓN: Asegúrate de incluir formato_emisiones_detalles_id en el POST
```

### Error: "Solo se pueden rendir formatos en estado ENVIADO"
```
CAUSA: El formato no está en ENVIADO
SOLUCIÓN: Primero emite el formato, luego rendirlo
```

### Error: 404 en /api/rendiciones/listar
```
CAUSA: Ruta no montada en server.js
SOLUCIÓN: Reiniciar backend, revisar imports
```

---

## 8️⃣ PRÓXIMOS PASOS

### Hoy (Después de este Quick Start)
1. [x] Reiniciar backend
2. [x] Verificar logs
3. [ ] Testear endpoints con curl
4. [ ] Verificar BD

### Mañana
5. [ ] Actualizar `ModalRendicion.js`
6. [ ] Crear `GestionRendiciones.js`
7. [ ] Testing E2E en navegador

### Esta semana
8. [ ] Implementar cambio de estado
9. [ ] Crear reportes
10. [ ] Deployment a producción

---

## 9️⃣ ESTRUCTURA DE CARPETAS

```
d:\COMISIONES_AAAU\
├── backend\
│   ├── models\
│   │   ├── Rendicion.js ✅ ACTUALIZADO
│   │   ├── Proveedor.js
│   │   └── TipoComprobante.js
│   ├── controllers\
│   │   ├── rendicionesController.js ✅ NUEVO
│   │   ├── tipoComprobanteController.js ✅ NUEVO
│   │   └── proveedorController.js ✅ NUEVO
│   ├── routes\
│   │   ├── rendiciones.js ✅ NUEVO
│   │   ├── tipoComprobante.js ✅ NUEVO
│   │   └── proveedor.js ✅ NUEVO
│   ├── migrations\
│   │   └── 004_crear_rendiciones_maestras.js ✅ NUEVO
│   └── server.js ✅ MODIFICADO
├── material-dashboard-react\
│   ├── src\
│   │   └── services\
│   │       └── api.js ✅ MODIFICADO (+14 métodos)
└── Documentación\
    ├── CHECKLIST_SISTEMA_RENDICIONES.md
    ├── ITERACION_FINAL_RENDICIONES_COMPLETADA.md
    ├── SISTEMA_RENDICIONES_IMPLEMENTACION_COMPLETADA.md
    ├── RESUMEN_EJECUTIVO_ITERACION_RENDICIONES.md
    └── QUICK_START_RENDICIONES.md ← TÚ ESTÁS AQUÍ
```

---

## 🔟 COMANDOS ÚTILES

```bash
# Verificar sintaxis
node -c backend/server.js

# Verificar modelo
node -c backend/models/Rendicion.js

# Verificar controller
node -c backend/controllers/rendicionesController.js

# Restart backend
cd backend && npm start

# Ver logs en tiempo real
npm start 2>&1 | grep -i "rendicion\|error"

# Verificar rutas montadas
grep -n "app.use.*rendiciones" backend/server.js
grep -n "app.use.*tipo-comprobante" backend/server.js
grep -n "app.use.*proveedores" backend/server.js

# Test rápido de endpoint
curl -X GET http://localhost:5000/api/health
```

---

## ✅ CHECKLIST ANTES DE SUBIR A PRODUCCIÓN

- [ ] Backend inicia sin errores
- [ ] Logs muestran "SISTEMA DE RENDICIONES LISTO"
- [ ] GET /api/health responde 200
- [ ] Todos los endpoints responden correctamente
- [ ] Base de datos tiene las 3 tablas
- [ ] Frontend service tiene los 14 métodos
- [ ] Testing manual de CRUD completado
- [ ] Sin errores de sintaxis (node -c)
- [ ] Sin warnings en console del navegador
- [ ] Documentación actualizada

---

**🎉 ¡Listo para empezar!**

Sigue este Quick Start y tendrás el sistema de rendiciones 100% funcional.

Tiempo estimado: **15 minutos**

¿Preguntas? Revisar los archivos de documentación.

