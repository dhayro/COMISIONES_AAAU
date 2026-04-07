# ✅ Fix: Envío de Detalles al Cambiar Certificación

## 🔴 Problema Identificado

Cuando cambias certificación en `GestionCertificacionesFormatos`, el frontend solo enviaba:
```json
{
  "certificacion_id": 11,
  "meta_id": 6
}
```

**SIN los detalles**, entonces el backend no podía:
1. ❌ Restar `monto_utilizado` de la certificación ANTIGUA
2. ❌ Sumar `monto_utilizado` a la certificación NUEVA
3. ❌ Remap `detalles_certificacion_credito_id` a la nueva certificación

Resultado: **`monto_utilizado` NO se actualizaba en la BD** 😞

## ✅ Solución Implementada

**Archivo:** `src/pages/Gestion/GestionCertificacionesFormatos.js`

**Función:** `guardarCambios()` (líneas 262-328)

### Cambios realizados:

1. **Obtener formato completo con detalles:**
```javascript
const formatoCompleto = await api.obtenerFormatoEmisionPorId(selectedFormato.id);
```

2. **Mapear detalles correctamente:**
```javascript
let detalles = [];
if (formatoCompleto.detalles && Array.isArray(formatoCompleto.detalles)) {
  detalles = formatoCompleto.detalles.map(d => ({
    clasificador_id: d.clasificador_id,
    monto: d.monto,
    detalles_certificacion_credito_id: formData.certificacion_id !== selectedFormato.certificacion_id 
      ? null  // Si cambió, limpiar referencia (backend remapea)
      : d.detalles_certificacion_credito_id
  }));
}
```

3. **Enviar detalles en la request:**
```javascript
const datosActualizacion = {
  certificacion_id: formData.certificacion_id,
  meta_id: formData.meta_id,
  detalles: detalles  // 🆕 AHORA SE ENVÍA
};
```

## 🔄 Flujo Completo (Frontend)

```
User hace clic en "Guardar"
    ↓
validarCambiosCertificacion() ← Valida que existan clasificadores
    ↓
Obtener formato completo con detalles (API call)
    ↓
Mapear detalles (clasificador_id, monto, etc.)
    ↓
Si cambió certificación → limpiar detalles_certificacion_credito_id a NULL
    ↓
Enviar PUT con: certificacion_id, meta_id, detalles[]
    ↓
Backend actualiza montos_utilizados en AMBAS certificaciones
    ↓
Backend remapea detalles_certificacion_credito_id a nuevos valores
```

## 📊 Ejemplo de Request Ahora

```json
PUT /api/formatos-emisiones/33
{
  "certificacion_id": 11,
  "meta_id": 6,
  "detalles": [
    {
      "clasificador_id": 1,
      "monto": 900,
      "detalles_certificacion_credito_id": null
    },
    {
      "clasificador_id": 2,
      "monto": 880,
      "detalles_certificacion_credito_id": null
    }
  ]
}
```

## 🔧 Backend (Ya Existe)

El backend ya tiene la lógica para:

1. **Detectar cambio de certificación:**
```javascript
const certificacion_anterior = formatoAnterior[0].certificacion_id;
const certificacion_nueva = certificacion_id !== undefined ? certificacion_id : certificacion_anterior;
```

2. **Restar de antigua, sumar a nueva:**
```javascript
// Restar de antigua
for (const detalle of detallesAntiguos) {
  UPDATE detalles_certificacion_credito 
  SET monto_utilizado = monto_utilizado - monto_total
}

// Sumar a nueva
for (const detalle of detallesNuevaCert) {
  UPDATE detalles_certificacion_credito 
  SET monto_utilizado = monto_utilizado + monto_total
}
```

3. **Remapear detalles:**
```javascript
// Actualizar referencias en formato_emisiones_detalles
UPDATE formato_emisiones_detalles 
SET detalles_certificacion_credito_id = ?
WHERE id = ?
```

## 🧪 Cómo Probar

1. **Abre `http://localhost:3000/gestion/certificaciones-formatos`**

2. **Haz clic en "Modificar"** en un formato con certificación

3. **Cambia la certificación** a una diferente

4. **Haz clic en "Guardar"**

5. **Verifica en la BD:**
```sql
-- Antes de cambio
SELECT id, monto, monto_utilizado FROM detalles_certificacion_credito WHERE id IN (6, 7);
-- Ambos tienen monto_utilizado > 0

-- Después de cambio
-- Certificación antigua: monto_utilizado DISMINUYÓ
-- Certificación nueva: monto_utilizado AUMENTÓ
```

6. **Logs esperados en consola:**
```
📋 Formato completo obtenido: {...detalles: [...]}
📤 Datos a enviar: {certificacion_id: 11, meta_id: 6, detalles: [...]}
✅ Formato 33 actualizado correctamente
```

## 📊 Matriz de Casos

| Caso | Antes | Cambio | Detalles | Resultado |
|------|-------|--------|----------|-----------|
| Cambiar cert | cert=11 | cert=11→5 | ✅ Enviados | Old cert -monto, new cert +monto |
| Cambiar meta | meta=6 | meta=6→4 | ✅ Enviados | Montos se mantienen |
| Ambos cambios | cert=11, meta=6 | cert=11→5, meta=6→4 | ✅ Enviados | Old cert -monto, new cert +monto |
| Sin cambios | cert=11 | cert=11→11 | ✅ Enviados | No entra en la lógica |

## 🔍 Key Points

1. **`detalles_certificacion_credito_id` se limpia a NULL** cuando cambias certificación
   - El backend busca el nuevo clasificador equivalente
   - Y remapea a la nueva certificación

2. **Los montos se restan/suman automáticamente** en backend
   - No depende del frontend

3. **Validación pre-cambio** asegura que existan todos los clasificadores
   - Si no existen → error, no se actualiza

4. **El estado se normaliza automáticamente**
   - Si tiene certificación → EMITIDO
   - Si no tiene → BORRADOR

## ✅ Estado de Implementación

| Componente | Status |
|-----------|--------|
| Frontend obtiene detalles | ✅ Completo |
| Frontend envía detalles | ✅ Completo |
| Backend recibe detalles | ✅ Existente |
| Backend resta montos (old) | ✅ Existente |
| Backend suma montos (new) | ✅ Existente |
| Backend remapea referencias | ✅ Existente |
| Backend normaliza estado | ✅ Completo |

---

**Actualizado:** 31 de Marzo, 2026
**Status:** 🟢 Ready to Test
