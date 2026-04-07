# 🧪 PLAN DE TESTING - NUMERO_CUT Y PROCESAMIENTO DE DETALLES

## ✅ CAMBIOS IMPLEMENTADOS

### 1. **Base de Datos**
- ✅ Campo `numero_cut` añadido a tabla `formato_emisiones`
- ✅ Tipo: `VARCHAR(50), NULL`
- ✅ Posición: 15 de 29 columnas

### 2. **Backend - Modelo**
- ✅ `FormatoEmision.js` → `crear()` ahora recibe y guarda `numero_cut`
- ✅ `FormatoEmision.js` → `actualizar()` ahora actualiza `numero_cut`

### 3. **Backend - Controlador**
- ✅ Lógica de estado con 4 prioridades:
  1. Si `numero_siaf` existe → **PAGADO**
  2. Si `numero_cut` existe (sin SIAF) → **ENVIADO**
  3. Si `certificacion_id` existe (sin CUT/SIAF) → **EMITIDO**
  4. Si nada → **BORRADOR**

- ✅ Procesamiento condicional de detalles:
  - Solo procesa si: `huboChangioCertificacion || detallesChangieron`
  - Si solo actualiza `numero_cut`/`numero_siaf` → **NO recalcula monto_utilizado**

### 4. **Frontend**
- ✅ `GestionCertificacionesFormatos.js` → Agrega `numero_cut` y `numero_siaf`
- ✅ `EmisionFormatos.js` → Integra `numero_cut` en el formulario

---

## 🧪 CASOS DE PRUEBA

### **Caso 1: Actualizar SOLO numero_cut (SIN cambiar certificación)**
**Objetivo:** Verificar que `monto_utilizado` NO se recalcula

**Pasos:**
1. Identificar un formato existente con ID (ej: 39)
2. Hacer PUT request con SOLO `numero_cut`:
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/39 \
  -H "Content-Type: application/json" \
  -d '{"numero_cut": "CUT-2024-12345"}'
```

**Expected:**
- ✅ `numero_cut` actualizado en BD
- ✅ `estado_emision` cambia a **ENVIADO**
- ✅ `monto_utilizado` **NO cambia** en detalles
- ✅ Logs muestran: `"Sin cambios en certificación ni detalles"`

---

### **Caso 2: Actualizar numero_cut Y numero_siaf**
**Objetivo:** Verificar prioridad (SIAF > CUT)

**Pasos:**
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/39 \
  -H "Content-Type: application/json" \
  -d '{"numero_cut": "CUT-2024-99999", "numero_siaf": "SIAF-2024-88888"}'
```

**Expected:**
- ✅ Ambos campos guardados
- ✅ `estado_emision` cambia a **PAGADO** (prioridad SIAF > CUT)
- ✅ `monto_utilizado` **NO cambia**

---

### **Caso 3: Cambiar certificación SIN detalles nuevos**
**Objetivo:** Verificar que detecta cambio de certificación

**Pasos:**
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/39 \
  -H "Content-Type: application/json" \
  -d '{"certificacion_id": 5, "numero_cut": "CUT-2024-NEW"}'
```

**Expected:**
- ✅ `certificacion_id` cambia a 5
- ✅ `estado_emision` → **EMITIDO**
- ✅ Logs: `"Certificación cambió pero sin detalles en request"`
- ✅ `monto_utilizado` recalculado (RESTAR antiguos)

---

### **Caso 4: Cambiar certificación CON detalles nuevos**
**Objetivo:** Verificar procesamiento completo

**Pasos:**
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/39 \
  -H "Content-Type: application/json" \
  -d '{
    "certificacion_id": 7,
    "numero_cut": "CUT-2024-NEW",
    "detalles": [
      {
        "clasificador_id": 1,
        "monto": 500,
        "detalles_certificacion_credito_id": 10
      }
    ]
  }'
```

**Expected:**
- ✅ Nueva certificación guardada
- ✅ Detalles antiguos eliminados y reemplazados
- ✅ `monto_utilizado` recalculado (RESTAR antiguos + SUMAR nuevos)
- ✅ `numero_cut` actualizado

---

### **Caso 5: Actualizar solo numero_siaf (luego quitar)**
**Objetivo:** Verificar downgrade de estado

**Pasos A - Agregar SIAF:**
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/39 \
  -H "Content-Type: application/json" \
  -d '{"numero_siaf": "SIAF-2024-TEST"}'
```

**Expected:** Estado → **PAGADO**

**Pasos B - Quitar SIAF pero dejar CUT:**
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/39 \
  -H "Content-Type: application/json" \
  -d '{"numero_siaf": null}'
```

**Expected:** Estado → **ENVIADO** (CUT persiste)

---

## 📋 VERIFICACIÓN EN BD

Después de cada test, ejecuta:

```sql
-- Ver formato actualizado
SELECT id, numero_cut, numero_siaf, certificacion_id, estado_emision, monto_utilizado 
FROM formato_emisiones 
WHERE id = 39;

-- Ver detalles de ese formato
SELECT id, clasificador_id, monto, detalles_certificacion_credito_id 
FROM formato_emisiones_detalles 
WHERE formato_emision_id = 39;

-- Ver si monto_utilizado se afectó en detalles_certificacion_credito
SELECT id, certificacion_credito_id, clasificador_id, monto_utilizado 
FROM detalles_certificacion_credito 
WHERE certificacion_credito_id IN (SELECT certificacion_id FROM formato_emisiones WHERE id = 39);
```

---

## 🔍 LOGS A REVISAR

En la consola del backend, busca:

- `"Sin cambios en certificación ni detalles"` → ✅ NO procesó detalles
- `"PROCESANDO DETALLES"` → Está procesando
- `"CAMBIO DE CERTIFICACIÓN DETECTADO"` → Detectó cambio
- `"RESTAR de Detalle"` → Restó montos antiguos
- `"SUMAR a Detalle"` → Sumó montos nuevos
- `"Detalles procesados correctamente"` → Éxito

---

## 🚀 PASOS PARA EJECUTAR

1. **Reinicia backend** con cambios:
   ```bash
   cd d:\COMISIONES_AAAU\backend
   npm run dev
   ```

2. **Verifica conexión**:
   ```bash
   curl http://172.10.9.11:5000/api/health
   ```

3. **Ejecuta Caso 1** (más simple primero):
   ```bash
   # Obtener un ID válido
   curl http://172.10.9.11:5000/api/formatos-emisiones | jq '.[0].id'
   
   # Actualizar solo numero_cut
   curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/[ID] \
     -H "Content-Type: application/json" \
     -d '{"numero_cut": "TEST-001"}'
   ```

4. **Revisa BD** (ver arriba) y **revisa logs** de backend

5. **Ajusta si es necesario** y continúa con otros casos

---

## ⚠️ POSIBLES PROBLEMAS

| Problema | Solución |
|----------|----------|
| `numero_cut` no se guarda | Verificar logs del backend, reiniciar, revisar modelo |
| `monto_utilizado` se recalcula sin razón | Verificar que la condición `huboChangioCertificacion \|\| detallesChangieron` funcione |
| Estado no cambia a ENVIADO | Verificar lógica de prioridades en controlador (línea ~340-402) |
| Logs no aparecen | Asegurar que `npm run dev` está ejecutándose, NO `npm start` |

---

## ✅ ÉXITO INDICADORES

- [ ] Caso 1: numero_cut se guarda, estado → ENVIADO, monto_utilizado NO cambia
- [ ] Caso 2: Ambos campos se guardan, estado → PAGADO (prioridad SIAF)
- [ ] Caso 3: Certificación cambia sin procesar detalles
- [ ] Caso 4: Certificación y detalles se procesan correctamente
- [ ] Caso 5: Estado downgrade funciona (PAGADO → ENVIADO)
- [ ] Todos los logs aparecen como esperado

¡Si todos los casos pasan, la implementación está **COMPLETA y CORRECTA**! ✨
