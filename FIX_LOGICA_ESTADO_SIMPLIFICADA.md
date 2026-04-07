# ✅ Fix: Lógica de Estado Simplificada y Corregida

## 🔴 Problema Original

La lógica anterior solo funcionaba para **CAMBIOS**:
- NULL → 2 (asignar) ✓
- 2 → NULL (remover) ✓
- 2 → 5 (cambiar) ✓

Pero NO funcionaba cuando:
- 2 → 2 (sin cambio en certificación pero se actualiza) ✗

Resultado: Un formato con `certificacion_id = 2` pero estado **BORRADOR** que no se actualizaba.

## ✅ Solución Implementada

**Nueva lógica (líneas ~268-280 en formatoEmisionController.js):**

```javascript
// 🆕 LÓGICA DE ESTADO: Normalizar SIEMPRE basado en certificacion_id
if (certificacion_nueva !== null) {
  // Tiene certificación → EMITIDO
  datosActualizacion.estado_emision = 'EMITIDO';
} else {
  // NO tiene certificación → BORRADOR
  datosActualizacion.estado_emision = 'BORRADOR';
}
```

**Beneficios:**
1. ✅ Más simple y clara
2. ✅ Funciona para TODOS los casos (cambio, sin cambio, asignación, remoción)
3. ✅ No depende de comparar anterior vs nueva
4. ✅ Garantiza coherencia: **Si tiene CCP → EMITIDO, Si no tiene CCP → BORRADOR**

## 📊 Matriz Completa de Casos

| Caso | Antes | PUT Request | Después Estado | Después Certificacion |
|------|-------|-------------|-----------------|----------------------|
| **Crear** | - | cert=NULL | BORRADOR | NULL ✅ |
| **Asignar** | BORRADOR/NULL | cert=2 | EMITIDO | 2 ✅ |
| **Remover** | EMITIDO/2 | cert=NULL | BORRADOR | NULL ✅ |
| **Cambiar** | EMITIDO/2 | cert=5 | EMITIDO | 5 ✅ |
| **Sin cambio** | EMITIDO/2 | cert=2 | EMITIDO | 2 ✅ |
| **Normalizacion** | BORRADOR/2 | cert=2 | EMITIDO | 2 ✅ |

## 🔧 Cambios Realizados

**Archivo:** `backend/controllers/formatoEmisionController.js`

**Líneas:** ~268-280 (función `actualizar()`)

**Antes:** 
```javascript
if (certificacion_anterior === null && certificacion_nueva !== null) {
  // solo si cambio de NULL → valor
  datosActualizacion.estado_emision = 'EMITIDO';
} else if (certificacion_anterior !== null && certificacion_nueva === null) {
  // solo si cambio de valor → NULL
  datosActualizacion.estado_emision = 'BORRADOR';
}
```

**Después:**
```javascript
if (certificacion_nueva !== null) {
  // SIEMPRE: si tiene certificación
  datosActualizacion.estado_emision = 'EMITIDO';
} else {
  // SIEMPRE: si NO tiene certificación
  datosActualizacion.estado_emision = 'BORRADOR';
}
```

## 🧪 Resultado Esperado

Cuando hagas PUT a `/formatos-emisiones/30` con:
```json
{
  "certificacion_id": 2,
  "...otros campos..."
}
```

**Respuesta:**
```json
{
  "message": "Formato actualizado exitosamente",
  "detalles_actualizados": 2
}
```

**En BD:**
```
ID 30:
- certificacion_id = 2 ✅
- estado_emision = 'EMITIDO' ✅ (AHORA FUNCIONA)
```

## 📝 Logs Esperados (Backend)

```
🔄 Cambio de certificación: 2 → 2
📌 Formato tiene certificación (2) → Estado debe ser EMITIDO
📌 datosActualizacion.estado_emision final: EMITIDO
✅ Formato 30 actualizado correctamente
```

## 🚀 Pasos para Verificar

1. **Reinicia el backend:**
   ```bash
   npm run dev
   ```

2. **Haz PUT a formato ID 30** con `certificacion_id: 2`

3. **Verifica que el estado es EMITIDO:**
   - Opción A: Refresca `GestionCertificacionesFormatos` - verás EMITIDO en la tabla
   - Opción B: Query SQL: `SELECT estado_emision FROM formato_emisiones WHERE id = 30;` → Debe ser `EMITIDO`

4. **Ya no necesitas ejecutar el endpoint `normalizar-estados`** (aunque sigue disponible para datos históricos)

## 🎯 Resumen

**Antes:** Lógica compleja que solo detectaba cambios
**Después:** Lógica simple que normaliza SIEMPRE basada en valor actual de `certificacion_id`

**Resultado:** ✅ Estado siempre consistente con presencia/ausencia de CCP

---

**Actualizado:** 31 de Marzo, 2026
**Status:** 🟢 Ready to Test
