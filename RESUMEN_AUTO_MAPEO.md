# 🎯 Resumen: Auto-mapeo de Detalles de Certificación

## El Problema

```
Usuario modifica formato:
PUT /formatos-emisiones/33
{
  "certificacion_id": 11,
  "detalles": [
    {"clasificador_id": 1, "monto": 900, "detalles_certificacion_credito_id": null}
  ]
}

❌ ANTES: Backend insertaba NULL → monto_utilizado NUNCA se actualizaba
```

## La Solución

```javascript
// Backend ahora busca automáticamente:
SELECT id FROM detalles_certificacion_credito 
WHERE certificacion_id = 11 AND clasificador_id = 1

// ENCUENTRA → id = 42
// Inserta con detalles_certificacion_credito_id = 42
// UPDATE: monto_utilizado = monto_utilizado + 900
```

## El Flujo Visual

```
┌─────────────────────────────────────────┐
│  Frontend: Cambiar Certificación        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Obtiene detalles del formato           │
│  clasificador_id=1,2 / monto=900,880    │
│  dcc_id=null (porque cambió cert)       │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  PUT /formatos-emisiones/33             │
│  {cert: 11, detalles: [dcc_id: null]}   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Backend: ¿dcc_id es NULL?              │
│  SÍ → Buscar en BD                      │
│  WHERE cert=11 AND clas=1               │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Encuentra dcc_id=42                    │
│  UPDATE: monto_utilizado += 900         │
│  ✅ ACTUALIZADO!                        │
└─────────────────────────────────────────┘
```

## Ejemplo Real

### ANTES (No funcionaba):
```
formato_emisiones ID 33:
- certificacion_id: NULL
- estado: BORRADOR

formato_emisiones_detalles:
- clasificador_id: 1, monto: 900, dcc_id: NULL
- clasificador_id: 2, monto: 880, dcc_id: NULL

User asigna certificacion_id = 11

detalles_certificacion_credito:
- id=42: certificacion_id=11, clasificador_id=1, monto=5000, monto_utilizado=0 ❌ NO SE ACTUALIZA
- id=43: certificacion_id=11, clasificador_id=2, monto=4000, monto_utilizado=0 ❌ NO SE ACTUALIZA
```

### AHORA (✅ Funciona):
```
Usuario modifica → Backend busca → Encuentra mapeo → Actualiza montos

detalles_certificacion_credito:
- id=42: monto_utilizado=900 ✅ ACTUALIZADO!
- id=43: monto_utilizado=880 ✅ ACTUALIZADO!

Saldo disponible:
- id=42: monto - monto_utilizado = 5000 - 900 = 4100 ✅
- id=43: monto - monto_utilizado = 4000 - 880 = 3120 ✅
```

## Casos de Uso

### 1. Asignar Certificación por Primera Vez
```
Formato tiene NULL → User asigna 11 
→ Backend busca clasificadores en cert 11
→ ACTUALIZA montos ✅
```

### 2. Cambiar Certificación (5 → 11)
```
Formato tiene 5 → User cambia a 11
→ Backend RESTA de cert 5 (-montos)
→ Backend SUMA a cert 11 (+montos)
✅ AMBAS se actualizan
```

### 3. Remover Certificación (11 → NULL)
```
Formato tiene 11 → User quita certificación
→ Backend RESTA de cert 11 (-montos)
→ dcc_id = NULL
✅ Estado vuelve a BORRADOR
```

## ¿Dónde se modificó?

**Archivo:** `backend/controllers/formatoEmisionController.js`

**Línea:** ~465-483

```javascript
if (detallesCertId === null && certificacion_nueva !== null && detalle.clasificador_id) {
  // 🆕 NUEVO: Buscar automáticamente el detalles_certificacion_credito_id
  const [detallesCert] = await pool.query(
    `SELECT id FROM detalles_certificacion_credito 
     WHERE certificacion_id = ? AND clasificador_id = ?`,
    [certificacion_nueva, detalle.clasificador_id]
  );
  
  if (detallesCert && detallesCert.length > 0) {
    detallesCertId = detallesCert[0].id;  // ← AUTO-MAPEO
  }
}
```

## Garantías

✅ **Montos consistentes:** Si hay certificación → monto_utilizado se actualiza
✅ **Saldo respetado:** No puede superar el monto de la evaluación
✅ **Auto-mapeo:** Busca automáticamente el clasificador correspondiente
✅ **Cascada completa:** Cambios de cert → Resta OLD + Suma NEW

---

**Cuando usarás esto:** Cada vez que modifiques una certificación en `GestionCertificacionesFormatos`
