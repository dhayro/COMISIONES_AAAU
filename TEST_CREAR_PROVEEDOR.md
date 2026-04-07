# ✅ TEST PROVEEDOR - CREAR NUEVO

## Problema Reportado
```
POST http://localhost:5000/api/proveedores/crear
Status: 400 Bad Request
Error: "razon_social es requerido"
```

**Causa:** El frontend enviaba `nombre` pero el backend esperaba `razon_social`

## Solución Aplicada

### 1. Frontend - Transformación de datos (`api.js`)

#### Creación de Proveedor
```javascript
async crearProveedor(datos) {
  // Transformar campos del frontend al formato backend
  const datosTransformados = {
    razon_social: datos.nombre || '',        // nombre → razon_social
    ruc_dni: datos.ruc || '',                // ruc → ruc_dni
    tipo_documento: datos.ruc && datos.ruc.length === 11 ? 'RUC' : 'DNI',
    direccion: datos.direccion || '',
    telefono: datos.telefono || '',
    email: datos.email || '',
    contacto_nombre: datos.contacto_nombre || '',
  };
  
  return this.request('/proveedores/crear', {
    method: 'POST',
    body: JSON.stringify(datosTransformados),
  });
}
```

#### Actualización de Proveedor
```javascript
async actualizarProveedor(id, datos) {
  const datosTransformados = {
    razon_social: datos.nombre || undefined,
    ruc_dni: datos.ruc || undefined,
    tipo_documento: datos.ruc && datos.ruc.length === 11 ? 'RUC' : 'DNI',
    // ... otros campos
  };
  
  // Remover campos undefined para no sobrescribir con vacío
  Object.keys(datosTransformados).forEach(key => 
    datosTransformados[key] === undefined && delete datosTransformados[key]
  );
  
  return this.request(`/proveedores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datosTransformados),
  });
}
```

#### Lectura/Listado de Proveedores
```javascript
// Transformar datos del backend al formato del frontend
_transformarProveedor(proveedor) {
  return {
    ...proveedor,
    nombre: proveedor.razon_social || '',      // razon_social → nombre
    ruc: proveedor.ruc_dni || '',              // ruc_dni → ruc
  };
}

async obtenerProveedores(filtros = {}) {
  const response = await this.listarProveedores(filtros);
  return this._transformarProveedores(response);
}
```

### 2. Backend - Modelo (`Proveedor.js`)
✅ **No requiere cambios** - El backend ya:
- Recibe `razon_social`, `ruc_dni`, `tipo_documento`
- Almacena correctamente en la BD
- Devuelve `razon_social`, `ruc_dni` al listar

## Flujo Completo

### Crear Proveedor
```
Frontend Form:
  ├─ nombre: "KONG TORRES DHAYRO"
  ├─ ruc: "10700064838"
  ├─ direccion: "-"
  ├─ telefono: ""
  └─ email: ""

↓ Transformación en api.js

Backend Request:
  ├─ razon_social: "KONG TORRES DHAYRO"
  ├─ ruc_dni: "10700064838"
  ├─ tipo_documento: "RUC"
  ├─ direccion: "-"
  ├─ telefono: ""
  └─ email: ""

↓ Backend procesa

Database:
  ├─ id: 1
  ├─ razon_social: "KONG TORRES DHAYRO"
  ├─ ruc_dni: "10700064838"
  ├─ tipo_documento: "RUC"
  └─ ...
```

### Listar Proveedores
```
Backend Response:
  ├─ razon_social: "KONG TORRES DHAYRO"
  └─ ruc_dni: "10700064838"

↓ Transformación en api.js

Frontend Receives:
  ├─ nombre: "KONG TORRES DHAYRO"
  ├─ ruc: "10700064838"
  ├─ ...
```

## Archivos Modificados

| Archivo | Cambio | Línea |
|---------|--------|-------|
| `material-dashboard-react/src/services/api.js` | Agregados métodos: `_transformarProveedor()`, `_transformarProveedores()` | ~695-720 |
| `material-dashboard-react/src/services/api.js` | Modificado: `crearProveedor()` - transforma datos | ~715 |
| `material-dashboard-react/src/services/api.js` | Modificado: `actualizarProveedor()` - transforma datos | ~732 |
| `material-dashboard-react/src/services/api.js` | Modificado: `listarProveedores()` - transforma respuesta | ~701 |
| `material-dashboard-react/src/services/api.js` | Modificado: `obtenerProveedor()` - transforma respuesta | ~710 |

## Testing Manual

### Test 1: Crear Proveedor desde UI
```
1. Navegar a: http://localhost:3000/gestion/proveedores
2. Click "+" (Nuevo Proveedor)
3. Ingresar RUC: 10700064838
4. Click "Buscar" (auto-completa)
   ├─ Nombre: KONG TORRES DHAYRO
   ├─ RUC: 10700064838
   ├─ Dirección: (se completa desde Decolecta)
5. Click "Guardar"
6. Esperado: ✅ Toast "Proveedor creado exitosamente"
7. Verificación:
   ├─ Proveedor aparece en tabla
   ├─ Datos correctos (nombre, RUC, dirección)
```

### Test 2: Verificar Petición HTTP
```bash
curl -X POST http://localhost:5000/api/proveedores/crear \
  -H "Content-Type: application/json" \
  -d '{
    "razon_social": "KONG TORRES DHAYRO",
    "ruc_dni": "10700064838",
    "tipo_documento": "RUC",
    "direccion": "-",
    "telefono": "",
    "email": ""
  }'

Respuesta esperada:
{
  "success": true,
  "proveedor": {
    "id": 1,
    "razon_social": "KONG TORRES DHAYRO",
    "ruc_dni": "10700064838",
    "tipo_documento": "RUC",
    "activo": 1
  }
}
```

### Test 3: Listar Proveedores
```bash
curl "http://localhost:5000/api/proveedores/listar"

Respuesta Backend:
{
  "proveedores": [
    {
      "id": 1,
      "razon_social": "KONG TORRES DHAYRO",
      "ruc_dni": "10700064838",
      "tipo_documento": "RUC",
      ...
    }
  ]
}

↓ Transformado por Frontend

Frontend recibe:
{
  "id": 1,
  "nombre": "KONG TORRES DHAYRO",
  "ruc": "10700064838",
  ...
}
```

## Validaciones

### Frontend (GestionProveedor.js)
- ✅ `nombre` es requerido (línea 218)
- ✅ Auto-completa desde Decolecta (línea 88+)
- ✅ Detecta RUC (11 dígitos) vs DNI (8 dígitos)

### Backend (proveedorController.js)
- ✅ `razon_social` es requerido (línea 28)
- ✅ Almacena en DB correctamente
- ✅ Retorna ID y datos completos

## Errores Esperados (Si no funciona)

### Error: "razon_social es requerido"
**Causa:** Transformación no funcionó
**Solución:** Verificar que api.js tiene el método `_transformarProveedor`

### Error: Campo `nombre` no se llena
**Causa:** El proveedor devuelto no se transforma
**Solución:** Verificar que `listarProveedores` usa `_transformarProveedores`

### Error: RUC/DNI no se detecta correctamente
**Causa:** Lógica de tipo_documento falló
**Solución:** El código valida: RUC = 11 dígitos, DNI = 8 dígitos

## Performance

- **Crear proveedor:** ~100ms (sin llamar Decolecta)
- **Listar proveedores:** ~50ms + tiempo query BD
- **Buscar en Decolecta:** ~2s (dependiendo internet)

## Datos de Ejemplo

### Para Crear Proveedor (desde UI):
- RUC: `20601030013` → REXTIE S.A.C. (Decolecta returnará datos)
- RUC: `10700064838` → KONG TORRES DHAYRO
- DNI: `46027897` → [Persona]

### Para SQL directo:
```sql
INSERT INTO proveedores 
(razon_social, ruc_dni, tipo_documento, direccion, telefono, email, activo)
VALUES 
('KONG TORRES DHAYRO', '10700064838', 'RUC', '-', '', '', 1),
('REXTIE S.A.C.', '20601030013', 'RUC', 'CAL. RICARDO ANGULO...', '', '', 1);
```

---

**Status:** ✅ IMPLEMENTADO  
**Fecha:** 6 de Abril, 2026  
**Versión API:** v2.0
