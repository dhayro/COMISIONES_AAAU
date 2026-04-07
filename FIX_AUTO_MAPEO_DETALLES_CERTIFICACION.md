# ✅ Fix: Auto-mapeo de detalles_certificacion_credito_id

## 🔴 Problema Original

Cuando el frontend enviaba detalles con `detalles_certificacion_credito_id: null`, el backend:
- ❌ Insertaba NULL directamente
- ❌ NO buscaba cuál debería ser el ID correcto
- ❌ NO actualizaba `monto_utilizado` en `detalles_certificacion_credito`

Resultado: **El `monto_utilizado` NUNCA se actualizaba** aunque se asignara una certificación.

## ✅ Solución Implementada

**Archivo:** `backend/controllers/formatoEmisionController.js`

**Líneas:** ~458-508 (función `actualizar()` - sección de inserción de detalles)

### Lógica Agregada:

```javascript
// Si detalles_certificacion_credito_id es NULL pero tenemos certificacion_nueva
if (detallesCertId === null && certificacion_nueva !== null && detalle.clasificador_id) {
  // Buscar automáticamente en detalles_certificacion_credito
  const [detallesCert] = await pool.query(
    `SELECT id FROM detalles_certificacion_credito 
     WHERE certificacion_id = ? AND clasificador_id = ?
     LIMIT 1`,
    [certificacion_nueva, detalle.clasificador_id]
  );
  
  if (detallesCert && detallesCert.length > 0) {
    detallesCertId = detallesCert[0].id;  // ← Encontrado!
  }
}
```

## 🔄 Flujo Completo Ahora

```
Frontend envía:
{
  "certificacion_id": 11,
  "detalles": [
    { "clasificador_id": 1, "monto": 900, "detalles_certificacion_credito_id": null }
  ]
}
    ↓
Backend procesa:
1. certificacion_nueva = 11
2. Para cada detalle:
   - detalles_certificacion_credito_id es NULL
   - Busca: WHERE certificacion_id=11 AND clasificador_id=1
   - ENCUENTRA: detalles_certificacion_credito_id = 42
3. INSERT con detalles_certificacion_credito_id = 42
4. UPDATE detalles_certificacion_credito SET monto_utilizado = monto_utilizado + 900
    ↓
Resultado:
✅ formato_emisiones_detalles referencia a detalles_certificacion_credito correctamente
✅ monto_utilizado se actualiza en detalles_certificacion_credito
```

## 📊 Query Búsqueda

El backend ejecuta:
```sql
SELECT id FROM detalles_certificacion_credito 
WHERE certificacion_id = ? AND clasificador_id = ?
LIMIT 1
```

**Parámetros:**
- `?1 = certificacion_nueva` (ej: 11)
- `?2 = detalle.clasificador_id` (ej: 1)

**Resultado:** Un único `detalles_certificacion_credito_id` que mapea esa combinación

## 🎯 Casos Cubiertos

| Caso | Entrada | Búsqueda | Resultado |
|------|---------|----------|-----------|
| Asignar cert nueva | cert=11, clasificador=1, dcc_id=null | SELECT WHERE cert=11, clas=1 | ✅ dcc_id encontrado, monto_utilizado ↑ |
| Cambiar cert (remap) | cert=5→11, clasificador=1, dcc_id=null | SELECT WHERE cert=11, clas=1 | ✅ Nuevo dcc_id, montos restan/suman |
| Sin cert | cert=null, clasificador=1, dcc_id=null | (skip búsqueda) | ✅ dcc_id=null, no se actualiza nada |
| Cert existe pero sin clasificador | cert=11, clas=99, dcc_id=null | SELECT WHERE cert=11, clas=99 | ⚠️ No encontrado, dcc_id=null |

## 🧪 Cómo Funciona Ahora

### Escenario 1: Asignar Certificación por Primera Vez

```
ANTES:
- formato_emisiones ID 33: certificacion_id=NULL
- formato_emisiones_detalles: clasificador_id=1,2 / monto=900,880 / dcc_id=NULL

CAMBIO:
- User modifica, asigna certificacion_id=11

FLUJO:
1. Backend busca: detalles_certificacion_credito WHERE cert_id=11, clas_id=1
2. Encuentra: id=42
3. Busca: detalles_certificacion_credito WHERE cert_id=11, clas_id=2
4. Encuentra: id=43
5. INSERT con dcc_id=42 y dcc_id=43
6. UPDATE dcc_id=42: monto_utilizado += 900
7. UPDATE dcc_id=43: monto_utilizado += 880

DESPUÉS:
- detalles_certificacion_credito ID 42: monto_utilizado += 900 ✅
- detalles_certificacion_credito ID 43: monto_utilizado += 880 ✅
```

### Escenario 2: Cambiar Certificación (Remap)

```
ANTES:
- formato_emisiones ID 33: certificacion_id=11
- formato_emisiones_detalles: dcc_id=42,43

CAMBIO:
- User modifica, cambia certificacion_id=11→5

FLUJO:
1. Resta de cert 11: monto_utilizado -= 900, 880
2. Busca nuevos detalles en cert 5: clas_id=1,2
3. Encuentra: id=12,13
4. INSERT con dcc_id=12,13
5. Suma a cert 5: monto_utilizado += 900, 880

DESPUÉS:
- detalles_certificacion_credito ID 42: monto_utilizado -= 900 ✅
- detalles_certificacion_credito ID 43: monto_utilizado -= 880 ✅
- detalles_certificacion_credito ID 12: monto_utilizado += 900 ✅
- detalles_certificacion_credito ID 13: monto_utilizado += 880 ✅
```

## 📝 Logs Esperados

```
📝 Insertando detalle: {clasificador_id: 1, monto: 900, dcc_id: null}
🔍 Buscando detalles_certificacion_credito para cert=11, clasificador=1
✅ Encontrado detalles_certificacion_credito_id = 42
✅ Detalle insertado, ID: 1001
✅ Monto utilizado actualizado (sumado) para detalle 42: +S/. 900
```

## ✅ Verificación en BD

**Después de cambio:**
```sql
-- Verificar que los montos se actualizaron
SELECT id, certificacion_id, clasificador_id, monto, monto_utilizado 
FROM detalles_certificacion_credito 
WHERE certificacion_id = 11 AND clasificador_id IN (1, 2);

-- Resultados esperados:
-- ID=42: monto_utilizado = monto_anterior + 900
-- ID=43: monto_utilizado = monto_anterior + 880
```

## 🔒 Validaciones (Frontend aún Necesaria)

Frontend debe validar:
1. ✅ Que exista `detalles_certificacion_credito` para cada clasificador (antes de guardar)
2. ✅ Que `saldo_disponible` sea suficiente en cada uno
3. ✅ Mostrar error si NO existe o si saldo insuficiente

Backend asume que si llegó aquí, ya pasó validación del frontend.

## 🚀 Próximos Pasos

1. ✅ Reinicia backend
2. ✅ Modifica un formato con certificación
3. ✅ Verifica en BD que `monto_utilizado` se actualizó
4. ✅ Prueba cambio de certificación (debe restar/sumar)

## 📊 Estado Actual

| Componente | Status |
|-----------|--------|
| Frontend envía detalles | ✅ Completo |
| Backend busca dcc_id si NULL | ✅ **NUEVO** |
| Backend suma montos | ✅ Existente |
| Backend resta montos (cambio) | ✅ Existente |
| Backend normaliza estado | ✅ Existente |

---

**Actualizado:** 31 de Marzo, 2026
**Status:** 🟢 Ready to Test
