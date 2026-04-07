# 🔒 Lógica: Fuente de Financiamiento Bloqueada por Certificación

**Fecha:** 31 de Marzo de 2026  
**Status:** ✅ IMPLEMENTADO

---

## 📋 Comportamiento Implementado

### ✅ Escenario 1: SIN Certificación Seleccionada

```
┌─────────────────────────────────────┐
│ Certificados Disponibles: [vacío]   │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ Fuente de Financiamiento: HABILITADO │ ✅ PUEDES SELECCIONAR
│ [Seleccionar fuente...]             │
└─────────────────────────────────────┘
```

**Acciones permitidas:**
- ✅ Seleccionar cualquier Fuente de Financiamiento
- ✅ Cambiar de Fuente si lo deseas
- ✅ Dejar vacío

---

### ❌ Escenario 2: CON Certificación Seleccionada

```
┌─────────────────────────────────────┐
│ Certificados Disponibles: [Mes: 03] │ ✅ SELECCIONADO
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ Fuente de Financiamiento: BLOQUEADO  │ 🔒 NO PUEDES SELECCIONAR
│ [Bloqueado: Certificación...]       │
│ ℹ️ La fuente se define desde cert... │
└─────────────────────────────────────┘
```

**Acciones permitidas:**
- ❌ NO puedes escribir
- ❌ NO puedes hacer click
- ❌ NO puedes seleccionar otra fuente
- ✅ Campo se deshabilita automáticamente
- ✅ Muestra mensaje explicativo

---

## 🔄 Flujo de Cambios

### Cuando SELECCIONAS una Certificación:

```javascript
onChange={(event, newValue) => {
  setFormValues({
    ...formValues,
    certificacion_id: newValue?.id || '',  // ✅ Se asigna certificación
    fuente_financiamiento_id: ''           // 🆕 SE LIMPIA automáticamente
  });
  // ... resto del código
}}
```

**Resultado:**
1. ✅ `formValues.certificacion_id` = ID de la certificación seleccionada
2. ✅ `formValues.fuente_financiamiento_id` = vacío ('')
3. ✅ El select de Fuente se deshabilita
4. ✅ Se muestra mensaje de ayuda

---

### Cuando DESELECCIONAS una Certificación:

```javascript
// Si newValue es null (desseleccionaste)
setFormValues({
  ...formValues,
  certificacion_id: '',                   // 🔲 Se limpia
  fuente_financiamiento_id: ''            // 🔲 Se limpia
});
```

**Resultado:**
1. ✅ `formValues.certificacion_id` = vacío
2. ✅ `formValues.fuente_financiamiento_id` = vacío
3. ✅ El select de Fuente se HABILITA nuevamente
4. ✅ Puedes seleccionar Fuente libremente

---

## 🎯 Cambios en el Código

### 1️⃣ Select de Fuente de Financiamiento (Línea ~2644)

```javascript
<Autocomplete
  disabled={!!formValues.certificacion_id}  // 🔒 BLOQUEADO si hay certificación
  options={fuentesFinanciamientoDisponibles || []}
  // ... resto de opciones
  renderInput={(params) => (
    <TextField
      {...params}
      label="Fuente de Financiamiento"
      placeholder={formValues.certificacion_id ? "Bloqueado: Certificación ya seleccionada" : "Seleccionar fuente..."}
      helperText={formValues.certificacion_id ? "La fuente se define automáticamente desde la Certificación" : ""}
    />
  )}
/>
```

**Nuevas propiedades:**
- ✅ `disabled={!!formValues.certificacion_id}` - Deshabilita si hay certificación
- ✅ `placeholder` dinámico - Muestra mensaje diferente
- ✅ `helperText` - Información de ayuda

---

### 2️⃣ onChange de Certificación (Línea ~2695)

```javascript
onChange={(event, newValue) => {
  setFormValues({
    ...formValues,
    certificacion_id: newValue?.id || '',
    fuente_financiamiento_id: ''  // 🆕 NUEVA LÍNEA - Limpia fuente
  });
  // ... resto del código
}}
```

**Nuevo comportamiento:**
- ✅ Cuando seleccionas certificación → `fuente_financiamiento_id` se vacía
- ✅ Cuando desseleccionas certificación → `fuente_financiamiento_id` sigue vacío
- ✅ Permite seleccionar fuente solo si NO hay certificación

---

## 📊 Tabla de Estados

| Estado | Certificación | Fuente de Financiamiento | Habilitado | Acción |
|--------|---------------|--------------------------|-----------|--------|
| 1 | ❌ Vacío | ❌ Vacío | ✅ SÍ | Seleccionar cualquiera |
| 2 | ❌ Vacío | ✅ Seleccionada | ✅ SÍ | Cambiar o deseleccionar |
| 3 | ✅ Seleccionada | ❌ Vacío | ❌ NO | Bloqueado (automático) |
| 4 | ✅ Seleccionada | ✅ Valor X | ❌ NO | Bloqueado (se limpia al cambiar cert) |

---

## 🧪 Testing

### Test 1: Sin Certificación

```
1. Abre modal "Emitir Formato"
2. Observa: Fuente de Financiamiento = HABILITADO
3. Selecciona: Una Fuente
4. Resultado: ✅ Se selecciona correctamente
```

### Test 2: Con Certificación

```
1. Abre modal "Emitir Formato"
2. Selecciona: Una Certificación
3. Observa: Fuente de Financiamiento = BLOQUEADO 🔒
4. Intenta: Hacer click en Fuente
5. Resultado: ❌ No se puede hacer click (disabled)
```

### Test 3: Cambiar Certificación

```
1. Selecciona: Certificación A
2. Observa: Fuente bloqueada
3. Selecciona: Certificación B
4. Resultado: ✅ Fuente sigue bloqueada (sin cambios)
```

### Test 4: Deseleccionar Certificación

```
1. Selecciona: Una Certificación
2. Fuente: BLOQUEADA 🔒
3. Deselecciona: Certificación (clear/X)
4. Resultado: ✅ Fuente vuelve a HABILITADO ✅
```

---

## 💾 Datos en JSON (POST/PUT)

### Caso 1: CON Certificación (Fuente se ignora)

```json
{
  "certificacion_id": 11,
  "fuente_financiamiento_id": "",  // Vacío porque estaba bloqueado
  "comision_id": 1,
  "meta_id": 6
  // ... otros campos
}
```

**Backend recibe:** Solo `certificacion_id`
**Backend guarda:** `fuente_financiamiento_id = NULL`

---

### Caso 2: SIN Certificación (Fuente es obligatoria)

```json
{
  "certificacion_id": "",
  "fuente_financiamiento_id": 4,  // Seleccionada porque NO había certificación
  "comision_id": 1,
  "meta_id": 6
  // ... otros campos
}
```

**Backend recibe:** `fuente_financiamiento_id = 4`
**Backend guarda:** `fuente_financiamiento_id = 4`

---

## 🎨 Experiencia Visual

### Cuando está HABILITADO ✅
```
┌──────────────────────────────────────┐
│ Fuente de Financiamiento             │
│ ┌────────────────────────────────────┐│
│ │ Seleccionar fuente...              ││
│ └────────────────────────────────────┘│
│                                        │
│ (sin texto de ayuda)                  │
└──────────────────────────────────────┘
```

### Cuando está BLOQUEADO 🔒
```
┌──────────────────────────────────────┐
│ Fuente de Financiamiento             │ (grisado)
│ ┌────────────────────────────────────┐│
│ │ Bloqueado: Certificación...        ││
│ └────────────────────────────────────┘│
│ ℹ️ La fuente se define automáticamente │
│    desde la Certificación             │
└──────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] Agregar `disabled={!!formValues.certificacion_id}` al Autocomplete
- [x] Agregar `placeholder` dinámico
- [x] Agregar `helperText` informativo
- [x] Limpiar `fuente_financiamiento_id` al seleccionar certificación
- [x] Limpiar `fuente_financiamiento_id` al deseleccionar certificación
- [x] Validar que se envía vacío al backend si hay certificación
- [x] Documentación completa

---

**Status:** ✅ COMPLETADO  
**Compilado:** 31-03-2026 11:15 AM

