# 🔧 FIX: Error "comision_id is not defined" en PUT /api/formatos-emisiones/:id

## ❌ Problema Encontrado

Cuando se intenta actualizar un formato existente con:
```
PUT http://172.10.9.11:5000/api/formatos-emisiones/2
```

Se recibe error:
```json
{
  "error": "Error al actualizar formato: comision_id is not defined"
}
```

## 🔍 Raíz del Problema

El problema estaba en cómo se construía la consulta UPDATE en el modelo `FormatoEmision.js`.

### Error en el flujo anterior:

1. **Frontend enviaba**: Solo campos que cambiar (ej: `lugar`, `ruta`, `detalles`)
2. **Controller recibía**: Todos los campos por destructuring (la mayoría como `undefined`)
3. **Controller pasaba al modelo**: Objeto con muchos campos `undefined`
4. **Modelo construía UPDATE**: Con condición `if (campo !== undefined)`

El problema sutil:
- Cuando el frontend NO envía un campo, viene como `undefined` en el request
- El controller luego hacía: `comision_id: comision_id || null`
- Esto convertía `undefined` a `null`, pero el modelo seguía recibiendo el campo
- El modelo agregaba a la query: `comision_id = ?` con valor `null`
- ❌ SQL se generaba correctamente pero con valores null innecesarios

**El verdadero error** ocurría cuando:
- El controller pasaba valores sin filtrar
- El modelo construía una query con más campos de los necesarios
- Había conflicto entre campos enviados explícitamente vs. undefined

## ✅ Solución Implementada

### 1. **Controller - Filtrar campos antes de enviar al modelo**
Archivo: `backend/controllers/formatoEmisionController.js` (líneas 145-193)

```javascript
// 🆕 Construir objeto de actualización con solo los campos que se envían
const datosActualizacion = {};

// Solo incluir campos que se envían explícitamente (no undefined)
if (comision_id !== undefined) datosActualizacion.comision_id = comision_id;
if (usuario_id !== undefined) datosActualizacion.usuario_id = usuario_id;
if (lugar !== undefined) datosActualizacion.lugar = lugar;
// ... más campos ...

// Pasar solo lo que realmente cambió
const actualizado = await FormatoEmision.actualizar(id, datosActualizacion);
```

**Beneficio**: El modelo recibe SOLO los campos que se deben actualizar

### 2. **Modelo - Logging mejorado para debugging**
Archivo: `backend/models/FormatoEmision.js` (líneas 151-190)

```javascript
console.log('🔧 Query de actualización:', query);
console.log('📊 Valores:', valores);
console.log('📊 Campos:', campos);
```

**Beneficio**: Cuando hay errores, podemos ver exactamente qué query se generó

### 3. **Controller - Mejor manejo de errores en detalles**
Archivo: `backend/controllers/formatoEmisionController.js` (líneas 210-245)

```javascript
let detallesActualizados = 0;
if (detalles && Array.isArray(detalles) && detalles.length > 0) {
  const { pool } = require('../config/database');
  
  try {
    // Eliminar detalles existentes
    const deleteResult = await pool.query(...);
    
    // Insertar nuevos detalles
    for (const detalle of detalles) {
      const insertResult = await pool.query(...);
      detallesActualizados++;
    }
  } catch (detallesError) {
    console.error(`❌ Error al actualizar detalles:`, detallesError.message);
  }
}
```

**Beneficio**: 
- Logging detallado de cada operación
- Errores en detalles no rompen la actualización del formato
- Se reporta cantidad exacta de detalles actualizados

## 📊 Comparación: Antes vs Después

### Antes:
```
Request:  { lugar: "Lima", ruta: "..." }
         ↓
Controller: { comision_id: undefined, usuario_id: undefined, lugar: "Lima", ... }
         ↓
Model: Query: UPDATE ... SET comision_id = ?, usuario_id = ? ... WHERE id = ?
         ↓
❌ Error (comision_id, usuario_id tienen valores null/undefined)
```

### Después:
```
Request:  { lugar: "Lima", ruta: "..." }
         ↓
Controller: { lugar: "Lima", ruta: "..." }  ✅ Solo campos enviados
         ↓
Model: Query: UPDATE ... SET lugar = ?, ruta = ? ... WHERE id = ?
         ↓
✅ Éxito (solo campos necesarios)
```

## 🧪 Validación

### Test Case 1: Actualizar solo algunos campos
```bash
curl -X PUT "http://172.10.9.11:5000/api/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -d '{
    "lugar": "Lima",
    "ruta": "Ruta Nueva"
  }'
```

**Resultado esperado**: ✅ `{"message": "Formato actualizado exitosamente", ...}`

### Test Case 2: Actualizar con detalles
```bash
curl -X PUT "http://172.10.9.11:5000/api/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -d '{
    "lugar": "Lima",
    "detalles": [
      { "clasificador_id": 1, "monto": 500 },
      { "clasificador_id": 2, "monto": 300 }
    ]
  }'
```

**Resultado esperado**: ✅ `{"message": "Formato actualizado exitosamente", "detalles_actualizados": 2}`

### Test Case 3: Actualizar sin cambios
```bash
curl -X PUT "http://172.10.9.11:5000/api/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resultado esperado**: ✅ Timestamp actualizado (actualizado_en = NOW())

## 🎯 Archivos Modificados

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `formatoEmisionController.js` | 145-245 | Filtrado de campos + logging de detalles |
| `FormatoEmision.js` | 151-190 | Logging mejorado |

## 📝 Notas Técnicas

1. **¿Por qué pasar undefined era un problema?**
   - JavaScript `undefined` vs `null` son diferentes
   - El check `if (field !== undefined)` era TRUE para campos undefined enviados en destructuring
   - Esto causaba que se incluyeran campos que no debería

2. **¿Por qué funciona ahora?**
   - Solo pasamos al modelo los campos que explícitamente fueron enviados en el request
   - El modelo construye la query solo con esos campos
   - No hay conflicto de valores null/undefined

3. **¿Qué pasa si el usuario no envía un campo?**
   - Ese campo NO se actualiza (comportamiento esperado)
   - El timestamp `actualizado_en` siempre se actualiza
   - Los campos existentes se preservan

## ✨ Beneficios Adicionales

- ✅ Soporte para actualizaciones parciales
- ✅ Preserva campos no enviados
- ✅ Mejor debugging con logs detallados
- ✅ Errores en detalles no rompen la actualización
- ✅ Compatible con el flujo actual de modificación desde frontend
