# 🧪 GUÍA RÁPIDA DE TESTING - Validar Todos los Cambios

**Versión:** Testing Phase 3  
**Tiempo Estimado:** 15-20 minutos  
**Estado:** Ready to Execute

---

## ✨ Pre-Requisitos

```bash
✅ Backend corriendo: http://localhost:3001
✅ Frontend corriendo: http://localhost:3000
✅ Base de datos accesible
✅ Usuario logueado con rol apropiado
```

---

## 🧪 TEST 1: Visualización de Columnas (5 min)

### 1A. Verificar Columna Monto

**Ruta:** http://localhost:3000/gestion/certificaciones-formatos

```
✓ Paso 1: Abrir página
  Esperar carga de tabla

✓ Paso 2: Buscar columna "Monto"
  Debe estar entre "Certificación" y acciones

✓ Paso 3: Verificar formato
  Debe mostrar: S/. X,XXX.XX
  Ejemplo: S/. 5,000.00

✓ Paso 4: Revisar valores
  ├─ Deben coincidir con montos reales
  ├─ Si cambias certificación, debe actualizar
  └─ Nunca debe ser negativo
```

**Si NO ves la columna:**
```bash
# En backend console:
grep -n "field: 'monto'" frontend/src/views/Comisiones/GestionCertificacionesFormatos.js

# Debe encontrar línea ~350
# Si no la encuentra, revisar cambios fueron guardados
```

**Resultado Esperado:** ✅
```
┌──────────────┬──────────────┬──────────────────┐
│ Meta         │ Certificación│ Monto            │
├──────────────┼──────────────┼──────────────────┤
│ Meta A       │ CCP 2658     │ S/. 5,000.00     │
│ Meta B       │ CCP 2659     │ S/. 8,500.00     │
│ Meta C       │ CCP 2660     │ S/.   450.00     │
└──────────────┴──────────────┴──────────────────┘
```

---

### 1B. Verificar Columna CCP

**Ruta:** http://localhost:3000/formatos/emision

```
✓ Paso 1: Abrir página Emisión Formatos
  
✓ Paso 2: Buscar columna "Certificación"
  Debe estar visible después de otras columnas

✓ Paso 3: Verificar estados
  ├─ Azul con "CCP: XXXX" = Tiene certificación
  ├─ Naranja con "Sin certificación" = No tiene
  └─ Debe haber ambos tipos

✓ Paso 4: Interactividad
  Si cambias certificación de un formato,
  debe actualizar el badge automáticamente
```

**Resultado Esperado:** ✅
```
┌──────────────┬─────────────────────────┐
│ Formato      │ Certificación           │
├──────────────┼─────────────────────────┤
│ EMI-001      │ [CCP: 2658] (AZUL)      │
│ EMI-002      │ [Sin certificación] (OR)│
│ EMI-003      │ [CCP: 2660] (AZUL)      │
└──────────────┴─────────────────────────┘
```

---

## 🔀 TEST 2: Cambio de Certificación Individual (3 min)

**Ruta:** http://localhost:3000/gestion/certificaciones-formatos

```
✓ Paso 1: Seleccionar un formato en la tabla
  Debe abrirse un dialog o form

✓ Paso 2: Anotar los valores ANTES:
  ├─ Meta actual
  ├─ Certificación actual
  ├─ Monto actual
  └─ Copiar a: ANTES_META, ANTES_CERT, ANTES_MONTO

✓ Paso 3: Mantener Meta igual
  Seleccionar Meta = meta anterior (SIN CAMBIAR)

✓ Paso 4: Cambiar SOLO Certificación
  Seleccionar diferente CCP
  Ej: De CCP 2658 → CCP 2659

✓ Paso 5: Guardar cambios
  Hacer clic en "Guardar" o "Actualizar"

✓ Paso 6: Verificar cambio exitoso
  ├─ Tabla se actualiza
  ├─ Nueva certificación visible
  ├─ Monto se recalcula
  └─ No hay error

✓ Paso 7: En Base de Datos, verificar:
  SELECT * FROM formato_emisiones_detalles 
  WHERE formato_emision_id = [TU_ID];
  
  ├─ detalles_certificacion_credito_id cambió
  ├─ Cada detalle apunta a nueva cert
  └─ Montos sin cambio en detalle
```

**Resultado Esperado:** ✅
```
ANTES:
├─ Certificación: 2658
├─ Monto: S/. 1,780.00
└─ detalles_certificacion_credito_id: 123 (de cert 2658)

DESPUÉS:
├─ Certificación: 2659
├─ Monto: S/. 1,780.00 (igual cantidad, diferente cert)
└─ detalles_certificacion_credito_id: 456 (de cert 2659)

✅ Sin duplicación, sin negativos
```

---

## 🔀 TEST 3: Cambio de Meta (3 min)

**Ruta:** http://localhost:3000/gestion/certificaciones-formatos

```
✓ Paso 1: Seleccionar formato con certificación

✓ Paso 2: Anotar ANTES:
  ├─ Meta: [META_A]
  ├─ Certificación: [CERT_X]
  └─ Monto: [M]

✓ Paso 3: Cambiar Meta a diferente
  Ej: De Meta 6 → Meta 3

✓ Paso 4: Observar comportamiento
  ├─ Certificación se resetea (se limpia)
  ├─ Selector de certificación muestra
  │  certificaciones de Meta 3 solamente
  └─ Monto se pone en 0

✓ Paso 5: Seleccionar nueva certificación
  Escoger CCP que pertenece a Meta 3

✓ Paso 6: Guardar
  
✓ Paso 7: Verificar:
  ├─ Meta cambió a Meta 3
  ├─ Nueva certificación asignada
  ├─ Monto recalculado correctamente
  └─ No hay error
```

**Resultado Esperado:** ✅
```
ANTES:
├─ Meta: 6
├─ Certificación: 2658 (de Meta 6)
└─ Monto: S/. 5,000.00

DESPUÉS:
├─ Meta: 3
├─ Certificación: 2660 (de Meta 3)
└─ Monto: S/. 5,000.00 (revalidado)

✅ Cambio limpio, sin inconsistencias
```

---

## 🔒 TEST 4: Cambio Múltiple VÁLIDO (5 min) ⭐

**Ruta:** http://localhost:3000/gestion/certificaciones-formatos

**Este es el TEST MÁS IMPORTANTE**

```
ESCENARIO:
Meta 6 tiene certificaciones: CCP 2658, CCP 2659
Meta 3 tiene certificaciones: CCP 2660, CCP 2661

Tu formato está en: Meta 6, CCP 2658

Vamos a cambiar A: Meta 3, CCP 2660 (válido)

✓ Paso 1: Seleccionar formato

✓ Paso 2: Anotar estado INICIAL:
  └─ Certificacion_credito con id de CCP 2658:
    SELECT monto_utilizado FROM certificaciones_credito 
    WHERE numero = '2658';
    
    Copiar valor: CERT_2658_ANTES

✓ Paso 3: Anotar estado de nueva cert:
  SELECT monto_utilizado FROM certificaciones_credito 
  WHERE numero = '2660';
  
  Copiar valor: CERT_2660_ANTES

✓ Paso 4: Cambiar Meta 6 → Meta 3
  Click en selector Meta
  Seleccionar Meta 3

✓ Paso 5: Cambiar Certificación 2658 → 2660
  Click en selector Certificación
  Debería mostrar SOLO certs de Meta 3
  Seleccionar CCP 2660

✓ Paso 6: Click en "Guardar"
  
✓ Paso 7: VERIFICAR ÉXITO (debería ser rápido)
  ├─ No debe haber error
  ├─ Tabla debe actualizar
  ├─ Frontend muestra nueva certificación
  └─ Mensaje de éxito (opcional)

✓ Paso 8: VERIFICAR BASE DE DATOS
  
  Certificación anterior (2658):
  SELECT monto_utilizado FROM certificaciones_credito 
  WHERE numero = '2658';
  
  Debe ser: CERT_2658_ANTES - [MONTO_FORMATO]
  
  Nueva certificación (2660):
  SELECT monto_utilizado FROM certificaciones_credito 
  WHERE numero = '2660';
  
  Debe ser: CERT_2660_ANTES + [MONTO_FORMATO]

✓ Paso 9: Verificar detalles:
  SELECT * FROM formato_emisiones_detalles 
  WHERE formato_emision_id = [TU_ID];
  
  ├─ Todos detalles tienen detalles_certificacion_credito_id
  │  que apuntan a certificados de CCP 2660
  ├─ Los montos en detalles sin cambio
  └─ Sin duplicados
```

**Resultado Esperado:** ✅
```
CONSOLE LOG BACKEND (debe ver):
🔄 Cambio de meta: 6 → 3
🔄 Cambio de certificación: 2658 → 2660
🔄🔄 CAMBIO MÚLTIPLE: Meta Y Certificación detectados
✅ Validación OK: Certificación 2660 pertenece a meta 3
✅ Monto restado de certificación anterior: -S/. 1,780.00
✅ Monto sumado a nueva certificación: +S/. 1,780.00
✅ Cambio múltiple completado exitosamente

BASE DE DATOS:
├─ Cert 2658: monto_utilizado DISMINUYÓ en 1,780
├─ Cert 2660: monto_utilizado AUMENTÓ en 1,780
└─ Sin negativos, sin duplicados

FRONTEND:
├─ Tabla se actualiza
├─ Nueva meta visible: 3
├─ Nueva cert visible: CCP 2660
└─ Monto recalculado correcto
```

---

## 🚫 TEST 5: Cambio Múltiple INVÁLIDO (5 min) ⭐

**Ruta:** http://localhost:3000/gestion/certificaciones-formatos

**Este test verifica que se bloquea correctamente**

```
ESCENARIO:
Tu formato está en: Meta 6, CCP 2658 (de Meta 6)

Intentas cambiar A: Meta 3, CCP 2658 (que está en Meta 6, NO en 3!)

✓ Paso 1: Seleccionar formato

✓ Paso 2: Cambiar Meta 6 → Meta 3
  Selector Meta: seleccionar 3

✓ Paso 3: IMPORTANTE - Cambiar Certificación
  Intentar seleccionar CCP 2658 
  (¡Que no existe en Meta 3!)
  
  Aquí debería pasar UNA de dos cosas:
  
  OPCIÓN A: Selector muestra SOLO certs de Meta 3
  └─ CCP 2658 NO aparece (correcto)
  └─ Usuario NO puede seleccionar inválida
  
  OPCIÓN B: Selector permite seleccionar pero validar al guardar:
  
  ✓ Paso 4: Seleccionar CCP 2658 de todas formas
  
  ✓ Paso 5: Click en "Guardar"
  
  ✓ Paso 6: DEBE APARECER ERROR DIALOG
    ❌ Certificación Inválida
    La certificación NO pertenece a la meta seleccionada.
    Nueva Meta: 3
    Certificación Meta: 6
    
  ✓ Paso 7: ACCIÓN BLOQUEADA
    ├─ Dialog muestra error
    ├─ Cambio NO se aplica
    ├─ Datos en BD sin cambios
    ├─ Tabla sigue igual
    └─ Usuario puede corregir y reintentar

✓ Paso 8: Verificar BD sin cambios
  SELECT * FROM formato_emisiones WHERE id = [TU_ID];
  Debe seguir siendo: Meta 6, CCP 2658
```

**Resultado Esperado:** ✅
```
FRONTEND - Debe ver error bloqueador:

❌ CERTIFICACIÓN INVÁLIDA
└─ Certificación seleccionada NO pertenece a Meta
   Meta: 3
   Certificación Meta: 6

BASE DE DATOS:
├─ Formato NO modificado
├─ Meta sigue siendo 6
├─ Certificación sigue siendo 2658
├─ Montos sin cambios
└─ Sin operaciones parciales

CONSOLE BACKEND (NO debe ver cambios aplicados):
🔄 Cambio de meta: 6 → 3
🔄 Cambio de certificación: 2658 → 2658
❌ ERROR: Certificación no pertenece a meta
(Sin operaciones de resta/suma ejecutadas)
```

---

## 🔧 TEST 6: Verificar Montos Negativos (5 min)

**En Terminal Backend**

```bash
# Paso 1: Ir a carpeta backend
cd d:\...\backend

# Paso 2: Ejecutar diagnóstico
node scripts/diagnosticoMontos.js

# Esperar resultado:

Diagnosticando montos negativos o inconsistentes...

Si ENCUENTRA:
  ⚠️ Encontrados registros con monto_utilizado negativo:
  
  ID: 123
  Certificación: CCP 2658
  Monto Utilizado: -S/. 880.00
  Meta: 6
  
  ID: 456
  Certificación: CCP 2659
  Monto Utilizado: -S/. 1,500.00
  Meta: 3
  
  Total encontrados: 2

Si NO ENCUENTRA:
  ✅ No se encontraron montos negativos
  Sistema está limpio
```

**Si encuentras negativos:**

```bash
# Paso 3: Ejecutar reparación
node scripts/repararMontosUtilizados.js

Reparando montos negativos...

Backup SQL creado en: 
d:\...\backend\backups\backup_montos_[TIMESTAMP].sql

Reparando:
├─ ID 123: -880.00 → 0.00 ✅
├─ ID 456: -1500.00 → 0.00 ✅
└─ Total reparados: 2

✅ Reparación completada

# Paso 4: Verificar que se reparó
node scripts/diagnosticoMontos.js

✅ No se encontraron montos negativos
Sistema limpio
```

---

## 📋 Checklist de Validación Final

```
FEATURE 1: Columna Monto
  ☐ Visible en tabla
  ☐ Formato S/. correcto
  ☐ Valores coinciden con BD
  ☐ Se actualiza al cambiar cert

FEATURE 2: Columna CCP
  ☐ Visible en tabla
  ☐ Badge azul cuando hay cert
  ☐ Badge naranja cuando sin cert
  ☐ Se actualiza dinámicamente

FEATURE 3: Fix Montos Negativos
  ☐ Script diagnóstico funciona
  ☐ Script reparación funciona
  ☐ Backup SQL se crea
  ☐ Montos reparados correctamente

FEATURE 4: Cambio Múltiple
  ☐ Detecta cuando ambos cambian
  ☐ Frontend pre-valida
  ☐ Backend valida nuevamente
  ☐ VÁLIDO: Permite y remapea
  ☐ INVÁLIDO: Bloquea con error claro
  ☐ Montos restados correctamente
  ☐ Montos sumados correctamente
  ☐ Sin duplicación
  ☐ Sin negativos
  ☐ Logs son descriptivos

GENERAL
  ☐ Sin errores en console
  ☐ Sin warnings sospechosos
  ☐ BD consistente
  ☐ UI responsive
  ☐ Mensajes de error claros
```

---

## 🐛 Si Encuentras Problemas

### Problema: "Columna Monto no se ve"
```bash
# Verificar cambios guardados
grep -n "field: 'monto'" GestionCertificacionesFormatos.js

# Limpiar y rebuildar
npm run build
# O si es hot reload: guardar el archivo
```

### Problema: "Cambio múltiple no valida"
```bash
# Verificar backend logs
# Buscar líneas como:
# 🔄 Cambio de meta:
# 🔄 Cambio de certificación:
# 🔄🔄 CAMBIO MÚLTIPLE:

# Si no aparecen: verificar código en formatoEmisionController.js líneas 260-310
```

### Problema: "Error dialog no aparece"
```bash
# Verificar frontend console (F12)
# Buscar console.log("cambioMeta:", cambioMeta)
# Verificar lógica en GestionCertificacionesFormatos líneas 168-220
```

### Problema: "Montos son incorrectos"
```bash
# Ejecutar query en BD:
SELECT 
  formato_emission_id,
  SUM(monto) as total_formato
FROM formato_emisiones_detalles
GROUP BY formato_emission_id;

# Comparar con tabla certificaciones_credito monto_utilizado
# Los totales deben coincidir

# Si no coinciden: ejecutar repair script
node scripts/repararMontosUtilizados.js
```

---

## ✅ Conclusión Testing

**Cuando TODO pase:** ✅

1. Todas las columnas visibles ✅
2. Cambios individuales funcionan ✅
3. Cambios múltiples válidos permitidos ✅
4. Cambios múltiples inválidos bloqueados ✅
5. Montos correctos en BD ✅
6. Sin negativos ✅
7. Sin duplicados ✅
8. Mensajes de error claros ✅

**RESULTADO:** Sistema está listo para producción ✅

---

**Tiempo Total Estimado:** 15-20 minutos  
**Estado Actual:** Ready to Test  
**Última Actualización:** 31-03-2026
