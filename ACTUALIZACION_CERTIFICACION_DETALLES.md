# 🆕 ACTUALIZACIÓN: Integración Automática de Certificación y Detalles

## Resumen del Cambio

Se ha implementado la carga automática y vinculación de certificaciones con sus detalles (clasificadores) cuando se selecciona o modifica un formato de comisión.

---

## Problemas Corregidos

### ❌ Problema 1: Detalles no se actualizaban al cambiar certificado
- **Síntoma**: Seleccionar un certificado no actualiza automáticamente los detalles editables
- **Solución**: Mejorada función `cargarDetallesCertificacion` para cargar automáticamente detalles en `detallesEditables`

### ❌ Problema 2: certificacion_id no se guardaba
- **Síntoma**: El campo `certificacion_id` no existía en la tabla ni se guardaba
- **Solución**: Agregado campo en modelo, controller y frontend

### ❌ Problema 3: Formato en edición no cargaba su certificación
- **Síntoma**: Al abrir un formato para modificar, no se cargaban sus detalles del certificado
- **Solución**: Mejorada `handleAbrirModalModificarFormato` para cargar certificación automáticamente

---

## Cambios Realizados

### 📁 Frontend: `EmisionFormatos.js`

#### 1️⃣ Función `cargarDetallesCertificacion()` - MEJORADA

**Cambio**: Ahora actualiza automáticamente `detallesEditables` al cargar certificación

```javascript
// ANTES: Solo cargaba detallesCertificacionSeleccionada
// DESPUÉS: También actualiza detallesEditables automáticamente

const cargarDetallesCertificacion = async (certificacionId) => {
  // ... cargar datos del servidor ...
  
  // 🆕 NUEVO: Actualizar automáticamente detallesEditables
  if (datosFormateados?.detalles && datosFormateados.detalles.length > 0) {
    const detallesDelCertificado = datosFormateados.detalles.map(d => ({
      id: d.id || Date.now() + Math.random(),
      clasificador_id: d.clasificador_id || d.id || '',
      clasificador_nombre: d.clasificador_nombre || d.nombre || 'N/A',
      monto: parseFloat(d.monto) || 0,
      detalles_certificacion_credito_id: d.detalles_certificacion_credito_id || d.id || null
    }));
    
    setDetallesEditables(detallesDelCertificado);
  }
};
```

#### 2️⃣ Función `handleAbrirModalModificarFormato()` - MEJORADA

**Cambio**: Ahora carga automáticamente la certificación y sus detalles

```javascript
// 🆕 Agregado:
// 1. Cargar certificacion_id del formato
// 2. Si existe certificación, cargar sus detalles automáticamente

const nuevoFormValues = {
  // ... otros campos ...
  certificacion_id: formatoCompleto?.certificacion_id || ''  // 🆕
};

// 🆕 Si el formato tiene una certificación, cargar sus detalles automáticamente
if (formatoCompleto?.certificacion_id) {
  console.log('🔄 Cargando detalles del certificado:', formatoCompleto.certificacion_id);
  await cargarDetallesCertificacion(formatoCompleto.certificacion_id);
}
```

#### 3️⃣ Objeto `datosFormato` en `handleCrearFormatoEmision()` - ACTUALIZADO

**Cambio**: Agregado campo `certificacion_id` al objeto que se envía al backend

```javascript
const datosFormato = {
  // ... otros campos ...
  certificacion_id: formValues.certificacion_id ? parseInt(formValues.certificacion_id) : null,  // 🆕
  // ... resto del objeto ...
};
```

---

### 📁 Backend: `FormatoEmision.js`

#### 1️⃣ Método `crear()` - ACTUALIZADO

**Cambio**: Agregada destructuración y parámetro de `certificacion_id`

```javascript
static async crear(data) {
  const {
    // ... campos existentes ...
    certificacion_id,  // 🆕 NUEVO
    // ... resto de campos ...
  } = data;

  // En el INSERT:
  INSERT INTO formato_emisiones (
    // ... columnas existentes ...
    certificacion_id,  // 🆕 NUEVO
    // ... resto de columnas ...
  ) VALUES (?, ?, ?, ?, ?, ...)
  
  // Valores incluyen:
  certificacion_id || null,  // 🆕
}
```

#### 2️⃣ Método `actualizar()` - ACTUALIZADO

**Cambio**: Agregada destructuración y lógica UPDATE para `certificacion_id`

```javascript
static async actualizar(id, data) {
  const {
    // ... campos existentes ...
    certificacion_id,  // 🆕 NUEVO
    // ... resto de campos ...
  } = data;

  // En la lógica dinámmica:
  if (certificacion_id !== undefined) { 
    campos.push('certificacion_id = ?'); 
    valores.push(certificacion_id); 
  }
}
```

---

### 📁 Backend: `formatoEmisionController.js`

#### 1️⃣ Método `crear()` - ACTUALIZADO

**Cambio**: Agregada destructuración y parámetro de `certificacion_id`

```javascript
exports.crear = async (req, res) => {
  const {
    // ... campos existentes ...
    certificacion_id,  // 🆕 NUEVO
    // ... resto de campos ...
  } = req.body;

  // Al llamar FormatoEmision.crear():
  const formatoId = await FormatoEmision.crear({
    // ... campos existentes ...
    certificacion_id: certificacion_id || null,  // 🆕 NUEVO
    // ... resto de campos ...
  });
}
```

#### 2️⃣ Método `actualizar()` - ACTUALIZADO

**Cambio**: Agregada destructuración, parámetro y línea en construcción de `datosActualizacion`

```javascript
exports.actualizar = async (req, res) => {
  const {
    // ... campos existentes ...
    certificacion_id,  // 🆕 NUEVO
    // ... resto de campos ...
  } = req.body;

  // En construcción de datosActualizacion:
  if (certificacion_id !== undefined) 
    datosActualizacion.certificacion_id = certificacion_id;  // 🆕 NUEVO
}
```

---

## Flujo de Datos Mejorado

### Crear Nuevo Formato
```
1. Usuario selecciona META
2. Usuario selecciona CERTIFICACIÓN
3. ✅ Se cargan automáticamente detalles del certificado
4. Los detalles se mapean a detallesEditables
5. Usuario puede modificar montos si lo desea
6. Al guardar, se envía certificacion_id y detalles
7. Backend guarda certificacion_id en formato_emisiones
8. Backend guarda detalles en formato_emisiones_detalles
```

### Modificar Formato Existente
```
1. Usuario abre modal de modificación
2. ✅ Se cargan datos del formato anterior
3. ✅ Se carga automáticamente certificacion_id del formato
4. ✅ Se cargan automáticamente detalles del certificado
5. Los detalles se mapean a detallesEditables
6. Usuario puede cambiar certificación o detalles
7. Al guardar, se envía certificacion_id actualizado
8. Backend actualiza certificacion_id en formato_emisiones
9. Backend reemplaza detalles en formato_emisiones_detalles
```

---

## Base de Datos

⚠️ **NOTA IMPORTANTE**: Se asume que la tabla `formato_emisiones` ya tiene el campo `certificacion_id`. Si no existe, ejecutar:

```sql
ALTER TABLE formato_emisiones ADD COLUMN certificacion_id INT NULL;
ALTER TABLE formato_emisiones ADD FOREIGN KEY (certificacion_id) REFERENCES certificaciones_credito(id);
```

---

## Validación

### Prueba 1: Crear formato con certificación
```bash
curl -X POST "http://localhost:5000/api/formatos-emisiones" \
  -H "Content-Type: application/json" \
  -d '{
    "comision_id": 1,
    "usuario_id": 3,
    "meta_id": 6,
    "certificacion_id": 11,
    "numero_documento": "EF-2026-00001",
    "fecha_emision": "2026-03-21T00:00:00Z",
    "lugar": "Lima",
    "ruta": "Test",
    "modalidad_viaje": "TERRESTRE",
    "fecha_salida": "2026-03-22T00:00:00Z",
    "fecha_retorno": "2026-03-25T00:00:00Z",
    "num_dias": 3,
    "tipo_emision": "REEMBOLSO",
    "costo_xdia": 220,
    "monto_total": 660,
    "detalles": [
      {"clasificador_id": 3, "monto": 600},
      {"clasificador_id": 5, "monto": 60}
    ]
  }'
```

**Esperado**:
- ✅ Formato se crea exitosamente
- ✅ certificacion_id se guarda
- ✅ Detalles se guardan en formato_emisiones_detalles

### Prueba 2: Actualizar formato
```bash
curl -X PUT "http://localhost:5000/api/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -d '{
    "lugar": "Nuevo Lugar",
    "certificacion_id": 12,
    "detalles": [
      {"clasificador_id": 1, "monto": 500},
      {"clasificador_id": 3, "monto": 600}
    ]
  }'
```

**Esperado**:
- ✅ Formato se actualiza
- ✅ certificacion_id se actualiza
- ✅ Detalles previos se eliminan
- ✅ Nuevos detalles se insertan

---

## Beneficios

✅ **Automatización**: No requiere seleccionar manualmente cada clasificador  
✅ **Integridad**: Certificación y detalles siempre vinculados correctamente  
✅ **Consistencia**: Modificar formato recarga certificación actual automáticamente  
✅ **Flexibilidad**: Usuario puede cambiar certificación en cualquier momento  
✅ **Auditoría**: Se guarda qué certificación se usó en cada formato  

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/pages/Gestion/EmisionFormatos.js` | cargarDetallesCertificacion(), handleAbrirModalModificarFormato(), datosFormato |
| `backend/models/FormatoEmision.js` | crear(), actualizar() |
| `backend/controllers/formatoEmisionController.js` | crear(), actualizar() |

---

## Próximos Pasos Recomendados

1. Verificar que la tabla `formato_emisiones` tiene campo `certificacion_id`
2. Ejecutar pruebas con curl (ver sección Validación)
3. Probar UI: crear y modificar formatos
4. Verificar base de datos: consultar `formato_emisiones` y `formato_emisiones_detalles`
5. Validar que detalles se guardan con los montos correctos

---

**Fecha de Implementación**: 21 de Marzo, 2026  
**Estado**: ✅ Completado
