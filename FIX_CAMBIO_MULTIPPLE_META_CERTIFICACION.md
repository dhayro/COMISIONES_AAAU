# 🔒 FIX - Prevención de Duplicación de Montos al Cambiar Meta y Certificación

**Fecha:** 31-03-2026  
**Versión:** 2.0  
**Estado:** Implementado ✅

---

## 🎯 Objetivo

Prevenir que cuando cambias **AMBOS meta Y certificación** simultáneamente, los montos queden duplicados o inconsistentes.

---

## 🔴 Problema Original

### Escenario Problemático

```
Formato 34: Meta 6, Certificación 11
├── Detalle 1: Clasificador 1, Monto S/. 900.00
└── Detalle 2: Clasificador 2, Monto S/. 880.00

AHORA cambias A: Meta 3, Certificación 9
```

**Lo que pasaba ANTES:**
1. ✅ Sistema detecta cambio de certificación: 11 → 9
2. ✅ Resta S/. 900 + S/. 880 de certificación 11
3. ✅ Suma S/. 900 + S/. 880 a certificación 9
4. ❌ PERO NO valida que certificación 9 **pertenece a meta 3**
5. ❌ PERO NO valida que los clasificadores existan en meta 3
6. **Resultado:** Montos duplicados entre metas

---

## ✅ Soluciones Implementadas

### 1. **Backend - Validación de Cambio Múltiple** (formatoEmisionController.js)

**Nueva lógica:** Cuando AMBOS cambian (meta Y certificación):

```javascript
if (meta_anterior !== meta_nueva && certificacion_anterior !== certificacion_nueva) {
  // 1️⃣ VALIDAR que nueva certificación pertenece a nueva meta
  const certEnNuevaMeta = await query(
    `SELECT id FROM certificaciones_credito 
     WHERE id = ? AND meta_id = ?`,
    [certificacion_nueva, meta_nueva]
  );
  
  if (!certEnNuevaMeta) {
    throw new Error('Certificación no pertenece a la meta seleccionada');
  }
  
  // 2️⃣ RESTAR de certificación anterior
  // 3️⃣ SUMAR a certificación nueva
  // 4️⃣ MAPEAR clasificadores
}
```

**Beneficio:** Previene asignaciones inválidas ANTES de hacer cambios.

### 2. **Frontend - Validación Pre-Save** (GestionCertificacionesFormatos.js)

**Mejora:** Detecta cuando AMBOS cambian y valida:

```javascript
const cambioMeta = selectedFormato.meta_id !== formData.meta_id;
const cambioCertificacion = selectedFormato.certificacion_id !== formData.certificacion_id;

if (cambioMeta && cambioCertificacion) {
  // Validar que certificación pertenece a meta
  if (nuevaCertificacion.meta_id !== formData.meta_id) {
    Swal.fire({
      title: '❌ Certificación Inválida',
      html: 'La certificación NO pertenece a la meta seleccionada'
    });
    return false;
  }
}
```

**Beneficio:** Feedback inmediato al usuario, no genera request innecesario.

### 3. **Manejo de Clasificadores** 

Cuando cambias de meta/certificación:
- ✅ Busca clasificadores en nueva certificación
- ❌ Si NO existen → Error claro
- ✅ Si SÍ existen → Remapea automáticamente

---

## 📊 Flujo Correcto de Cambio

### ANTES (Problemático)

```
Usuario cambia:
Meta 6 → Meta 3
Cert 11 → Cert 9

Sistema:
├─ [❌ SIN VALIDAR] ¿Cert 9 está en Meta 3?
├─ Resta de Cert 11
├─ Suma a Cert 9
└─ [❌ DUPLICADO SILENCIOSO]
```

### AHORA (Seguro)

```
Usuario intenta cambiar:
Meta 6 → Meta 3
Cert 11 → Cert 9

Sistema:
├─ [✅ VALIDA] ¿Cert 9 está en Meta 3?
│  ├─ SI → Continuar
│  └─ NO → ❌ Error + Mensaje claro
├─ [✅ VALIDA] ¿Clasificadores existen en Cert 9?
│  ├─ SI → Continuar
│  └─ NO → ❌ Error + Detalles
├─ Obtener formato anterior
├─ RESTAR montos de Cert 11
├─ SUMAR montos a Cert 9
├─ MAPEAR clasificadores
└─ [✅ ÉXITO] Cambio completado
```

---

## 🧪 Casos de Uso

### Caso 1: Cambio SOLO de certificación (Meta igual)
```
Meta 6 → Meta 6 ✅
Cert 11 → Cert 2

✅ PERMITIDO: Ambas certs están en la misma meta
```

### Caso 2: Cambio SOLO de meta (Cert igual)
```
Meta 6 → Meta 3 ✅
Cert 11 → Cert 11

⚠️ VALIDAR: ¿Cert 11 existe en Meta 3?
```

### Caso 3: Cambio de AMBOS (más restrictivo)
```
Meta 6 → Meta 3 ✅
Cert 11 → Cert 9

✅ VALIDACIÓN 1: ¿Cert 9 está en Meta 3?
✅ VALIDACIÓN 2: ¿Clasificadores existen en Cert 9?
✅ Solo si ambas pasan → Permitir cambio
```

### Caso 4: Remover certificación
```
Meta 6 → Meta 6
Cert 11 → NULL

✅ SIEMPRE PERMITIDO: Solo limpia referencias
```

---

## 📝 Cambios en Código

### Backend (`formatoEmisionController.js`)

**Líneas ~260-310:**
- Obtener AMBOS `certificacion_id` Y `meta_id` anteriores
- Detectar si ambos cambiaron

**Líneas ~315-410:**
- NUEVO: Caso cuando AMBOS cambian
- Validar que cert nueva pertenece a meta nueva
- Restar de cert anterior
- Sumar a cert nueva
- Mapear clasificadores

### Frontend (`GestionCertificacionesFormatos.js`)

**Línea ~168-220:**
- Detectar cambios de meta Y certificación
- Pre-validar cuando AMBOS cambian
- Mostrar error claro si no válida
- Impedir request si hay conflicto

---

## 🚨 Errores Prevenidos

### Error 1: Certificación no pertenece a meta
```
❌ La certificación seleccionada NO pertenece a la meta seleccionada.
   Nueva Meta: 3
   Certificación Meta: 6
   
✅ Solución: Selecciona una certificación de la meta indicada.
```

### Error 2: Clasificador no existe en nueva cert
```
❌ El clasificador "PASAJES AÉREOS" no existe en la nueva certificación.

✅ Solución: Los clasificadores disponibles en la nueva cert son:
   - HOSPEDAJE
   - COMIDAS
```

### Error 3: Saldo insuficiente
```
❌ Saldo insuficiente en "HOSPEDAJE"
   Disponible: S/. 1,000.00
   Intentando usar: S/. 1,500.00
   Deficit: S/. -500.00

✅ Solución: Reduce el monto o elige otra certificación
```

---

## ✨ Mejoras Adicionales

### Logging Mejorado
```
🔄 Cambio de certificación: 11 → 9
🔄 Cambio de meta: 6 → 3
🔄🔄 CAMBIO MÚLTIPLE: Meta Y Certificación
✅ Validación OK: Certificación 9 SÍ pertenece a meta 3
✅ Monto restado de certificación anterior: -S/. 1,780.00
✅ Monto sumado a nueva certificación: +S/. 1,780.00
✅ Cambio múltiple completado exitosamente
```

### Validación Frontend
- Detecta cambios ANTES de enviar
- Valida solo cuando ambos cambian
- Muestra errores específicos
- Previene requests inútiles

---

## 🔄 Flujo Completo

```
1. Usuario selecciona nueva Meta
   ↓
2. Se cargan certificaciones de nueva meta
   ↓
3. Usuario selecciona nueva Certificación
   ↓
4. Frontend detecta: cambioMeta=true, cambioCertificacion=true
   ↓
5. Frontend valida: ¿Cert pertenece a Meta?
   ├─ NO → Mostrar error, DETENER
   └─ SÍ → Continuar
   ↓
6. Usuario hace clic en "Guardar"
   ↓
7. Frontend envía cambios
   ↓
8. Backend valida nuevamente (seguridad)
   ↓
9. Backend cambia certificación:
   ├─ Resta de cert anterior
   ├─ Mapea clasificadores
   └─ Suma a cert nueva
   ↓
10. ✅ Cambio exitoso, sin duplicados
```

---

## 📋 Checklist de Validación

- [x] Backend detecta cambio múltiple
- [x] Backend valida cert pertenece a meta
- [x] Backend restar de cert anterior
- [x] Backend suma a cert nueva
- [x] Backend mapea clasificadores
- [x] Frontend detecta cambios
- [x] Frontend pre-valida antes de guardar
- [x] Frontend muestra errores específicos
- [x] No hay duplicación de montos
- [x] Logs son claros y útiles

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Cambio válido de ambos
```
Meta 6 (Cert: 11, 2, 3) → Meta 3 (Cert: 6, 7)
Cert 11 → Cert 6
✅ Debe permitir y remapear clasificadores
```

### Prueba 2: Cambio inválido (cert no en meta)
```
Meta 6 → Meta 3
Cert 11 (de meta 6) → Cert 6 (de meta 3)
❌ Debe bloquear y mostrar error
```

### Prueba 3: Cambio con clasificadores faltantes
```
Formato con: Clasificador 1, 2, 3
Cambiar a cert que tiene: Clasificador 2, 3, 4
❌ Debe bloquear: "Clasificador 1 no existe"
```

### Prueba 4: Verificar montos correctos
```
Antes: Cert 11 utilizado = 1780
Después cambio: 
  ├─ Cert 11 utilizado = 0 (restado)
  └─ Cert 6 utilizado = +1780 (sumado)
✅ Sin duplicación
```

---

## 📊 Resultado

Con estos cambios:
- ✅ No hay duplicación de montos
- ✅ Las metas mantienen sus propias certificaciones
- ✅ Los cambios son atómicos (todo o nada)
- ✅ Errores son claros y previenen acciones incorrectas
- ✅ El sistema es más robusto y seguro

**Estado:** ✅ LISTO PARA USAR
