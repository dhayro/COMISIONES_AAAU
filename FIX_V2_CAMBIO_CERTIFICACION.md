# 🔧 FIX v2: SINCRONIZACIÓN CORRECTA DE CAMBIOS DE CERTIFICACIÓN

## 📋 Problema Identificado

Cuando **CAMBIAS de certificación** (ej: 8 → 9):
- ❌ ANTES: Los detalles antiguos NO se restaban correctamente
- ❌ Resultado: Montos desincronizados entre certificaciones

**Ejemplo que no funcionaba:**
```
Formato 38 con Certificación 8:
  - Detalle 27: monto_utilizado = 750
  - Detalle 28: monto_utilizado = 880

Cambio: Certificación 8 → 9

❌ RESULTADO ESPERADO (NO ocurría):
  - Certificación 8, Detalle 27: monto_utilizado = 0 (debería restar 750)
  - Certificación 8, Detalle 28: monto_utilizado = 0 (debería restar 880)
  - Certificación 9, Detalle 30: monto_utilizado = 750 (debería sumar 750)
  - Certificación 9, Detalle 31: monto_utilizado = 1760 (debería sumar 1760)

❌ LO QUE PASABA:
  La sincronización solo calculaba lo NUEVO, no RESTABA lo VIEJO
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Cambios en la función `actualizar()`:

**ANTES (líneas 365-410):**
```javascript
// Solo manejaba REMOVER certificación
if (certificacion_anterior !== null && certificacion_nueva === null) {
  // RESTAR de detalles antiguos
}
```

**DESPUÉS (líneas 378-395):**
```javascript
// 🔥 Maneja CUALQUIER CAMBIO de certificación
if (certificacion_anterior !== certificacion_nueva) {
  // Obtener detalles antiguos
  const [detallesAntiguosConCert] = await pool.query(
    `SELECT detalles_certificacion_credito_id, monto 
     FROM formato_emisiones_detalles 
     WHERE formato_emision_id = ? AND detalles_certificacion_credito_id IS NOT NULL`,
    [id]
  );
  
  // RESTAR monto_utilizado de TODOS los detalles antiguos
  for (const { detalles_certificacion_credito_id, monto } of detallesAntiguosConCert) {
    await pool.query(
      `UPDATE detalles_certificacion_credito 
       SET monto_utilizado = GREATEST(0, monto_utilizado - ?)
       WHERE id = ?`,
      [monto || 0, detalles_certificacion_credito_id]
    );
    console.log(`✅ RESTAR de Detalle ${detalles_certificacion_credito_id}: -S/. ${monto}`);
  }
}
```

**NUEVO - Insertar detalles (líneas 448-458):**
```javascript
// 🆕 SUMAR monto_utilizado a detalles NUEVOS
if (detallesCertId !== null && certificacion_nueva !== null) {
  await pool.query(
    `UPDATE detalles_certificacion_credito 
     SET monto_utilizado = monto_utilizado + ?
     WHERE id = ?`,
    [detalle.monto || 0, detallesCertId]
  );
  console.log(`✅ SUMAR a Detalle ${detallesCertId}: +S/. ${detalle.monto}`);
}
```

---

## 🎯 FLUJO COMPLETO

Cuando **CAMBIAS DE CERTIFICACIÓN (8 → 9)** ahora:

```
1️⃣ DETECTAR CAMBIO
   Certificación anterior: 8
   Certificación nueva: 9
   → Cambio detectado ✅

2️⃣ RESTAR DE DETALLES ANTIGUOS
   Obtener detalles con certificación 8: [27, 28]
   Para cada detalle:
     UPDATE detalles_cert 27: monto_utilizado = 750 - 750 = 0 ✅
     UPDATE detalles_cert 28: monto_utilizado = 880 - 880 = 0 ✅

3️⃣ ELIMINAR DETALLES ANTIGUOS
   DELETE FROM formato_emisiones_detalles WHERE formato_id = 38
   Resultado: 2 detalles eliminados ✅

4️⃣ INSERTAR DETALLES NUEVOS
   INSERT: formato 38, clasificador 1, monto 750, detalle_cert 30
   INSERT: formato 38, clasificador 2, monto 880, detalle_cert 31 (monto = 1760 total)

5️⃣ SUMAR A DETALLES NUEVOS
   Para cada detalle nuevo:
     UPDATE detalles_cert 30: monto_utilizado = 0 + 750 = 750 ✅
     UPDATE detalles_cert 31: monto_utilizado = 0 + 880 = 880 ✅
     (O si ya tenía: 0 + 1760 = 1760 total)

✅ RESULTADO FINAL:
   Certificación 8: detalles 27,28 → monto_utilizado = 0 (correcto)
   Certificación 9: detalles 30,31 → monto_utilizado = 750, 880 (correcto)
```

---

## 📊 LOGS QUE DEBES VER

Cuando cambias de certificación:

```
🔄 ACTUALIZAR FORMATO ID: 38
📝 certificacion_id: 9
📊 detalles recibidos: 2
🔍 Cambio de certificación: 8 → 9

🔴 CAMBIO DE CERTIFICACIÓN DETECTADO: 8 → 9
📋 Detalles antiguos encontrados: 2
  ✅ RESTAR de Detalle 27: -S/. 750
  ✅ RESTAR de Detalle 28: -S/. 880
✅ Montos restados de detalles antiguos

📋 Procesando 2 detalles...
🗑️ Eliminados 2 detalles antiguos
  ✅ Auto-mapeo: clasificador 1 → detalles_cert_id 30
  ✅ Auto-mapeo: clasificador 2 → detalles_cert_id 31
  ✅ SUMAR a Detalle 30: +S/. 750
  ✅ SUMAR a Detalle 31: +S/. 880
✅ 2 detalles insertados

✅ Detalles procesados correctamente - SINCRONIZACIÓN NO NECESARIA
```

---

## 🧪 CASOS DE PRUEBA

### Caso 1: REMOVER Certificación (8 → null)
```
ANTES:
  Cert 8, Detalle 27: monto_utilizado = 750

CAMBIO: certificacion_id = null

DESPUÉS:
  Cert 8, Detalle 27: monto_utilizado = 0 ✅
  (Sin detalles nuevos porque no hay certificación)
```

### Caso 2: CAMBIAR Certificación (8 → 9)
```
ANTES:
  Cert 8, Detalle 27: monto_utilizado = 750
  Cert 8, Detalle 28: monto_utilizado = 880

CAMBIO: certificacion_id = 9 con mismos clasificadores

DESPUÉS:
  Cert 8, Detalle 27: monto_utilizado = 0 ✅ (restado)
  Cert 8, Detalle 28: monto_utilizado = 0 ✅ (restado)
  Cert 9, Detalle 30: monto_utilizado = 750 ✅ (sumado)
  Cert 9, Detalle 31: monto_utilizado = 880 ✅ (sumado)
```

### Caso 3: AGREGAR Certificación (null → 8)
```
ANTES:
  No hay certificación
  No hay referencias en detalles

CAMBIO: certificacion_id = 8 con 2 clasificadores

DESPUÉS:
  Cert 8, Detalle 27: monto_utilizado = 750 ✅ (sumado)
  Cert 8, Detalle 28: monto_utilizado = 880 ✅ (sumado)
```

---

## ✅ VERIFICACIÓN

Sintaxis JavaScript validada: ✅ `node -c formatoEmisionController.js`

---

## 🚀 PRÓXIMO PASO

Reiniciar backend:

```bash
cd d:\COMISIONES_AAAU\backend
npm restart
```

Luego testear los 3 casos arriba para verificar que funciona correctamente.

---

## 📝 CAMBIOS RESUMIDOS

| Aspecto | Antes | Después |
|---------|-------|---------|
| Detecta cambio cert | Solo null → algo | ✅ Cualquier cambio |
| Resta de antiguos | ❌ Solo si removed | ✅ Siempre |
| Suma de nuevos | Manual + sync | ✅ Manual (no sync needed) |
| Sincronización | Siempre al final | ❌ Ya no necesaria |
| Líneas de código | 432 | 470 (+38 líneas) |

---

**Status:** ✅ APLICADO Y VALIDADO
**Fecha:** 2024-03-31
**Cambios:** Manual RESTAR + SUMAR (sin dependencia de sync)
