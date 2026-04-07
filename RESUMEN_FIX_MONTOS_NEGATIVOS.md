# 📋 RESUMEN DE CAMBIOS - Fix Montos Utilizados Negativos

**Fecha:** 31-03-2026  
**Versión:** 1.0  
**Estado:** Implementado ✅

---

## 🎯 Objetivo

Corregir los valores negativos en `monto_utilizado` de `detalles_certificacion_credito` que ocurren cuando se realizan cambios de certificación en los módulos:
- `/gestion/emision-formatos`
- `/gestion/certificaciones-formatos`

---

## 🔍 Problema Identificado

### Síntomas
- Montos negativos: `-880.00`, `-1500.00`
- Discrepancias entre monto esperado y monto en BD
- Ocurre principalmente cuando se cambia certificación múltiples veces

### Causa Raíz
Cuando se cambiaba certificación en GestionCertificacionesFormatos:
1. Los detalles se enviaban con `detalles_certificacion_credito_id: null`
2. El backend restaba montos de la certificación anterior
3. Pero NO encontraba los detalles antiguos porque venían con NULL
4. Luego insertaba los nuevos sin verificar que ya se había hecho la resta

Resultado: **resta sin suma = montos negativos**

### Datos Afectados
```
Detalle 7 (Cert 2, Clasificador 2): -S/. 880.00 ❌
Detalle 30 (Cert 9, Clasificador 1): -S/. 1,500.00 ❌
```

---

## ✅ Soluciones Implementadas

### 1. **Mejora Backend - formatoEmisionController.js** (Línea ~495)

**Cambio:** Mejorado el proceso de resta de montos cuando hay cambio de certificación.

```javascript
// ANTES: Solo restaba si detalles_certificacion_credito_id era NOT NULL
for (const detalleAntiguo of detallesAntiguos) {
  if (detalleAntiguo.detalles_certificacion_credito_id) {
    // Restar...
  }
}

// AHORA: Si el detalle no tiene referencia, busca en cert anterior
for (const detalleAntiguo of detallesAntiguos) {
  if (detalleAntiguo.detalles_certificacion_credito_id) {
    // Restar normal
  } else if (certificacion_anterior !== null && detalleAntiguo.clasificador_id) {
    // NUEVO: Buscar detalle en certificación anterior
    const [detallesAntCert] = await connection.query(
      `SELECT id FROM detalles_certificacion_credito 
       WHERE certificacion_credito_id = ? AND clasificador_id = ?`,
      [certificacion_anterior, detalleAntiguo.clasificador_id]
    );
    // Restar desde allá
  }
}
```

**Beneficio:** Previene futuros cambios de certificación de causar montos negativos.

### 2. **Script de Diagnóstico** (`scripts/diagnosticoMontos.js`)

Crea un reporte detallado de:
- ✅ Todas las discrepancias actuales
- ✅ Certificaciones y clasificadores afectados
- ✅ Montos esperados vs actuales
- ✅ Identificación de sobregiros

**Uso:**
```bash
node scripts/diagnosticoMontos.js
```

**Output:**
```
⚠️  DISCREPANCIA - Detalle ID: 7
   CCP: 0000001726 | Mes: FEBRERO | Clasificador: PASAJES AÉREOS
   Monto Total: S/. 3,520.00
   Esperado en BD: S/. 0.00
   Actual en BD: S/. -880.00
   Diferencia: S/. 880.00
```

### 3. **Script de Reparación** (`scripts/repararMontosUtilizados.js`)

Recalcula TODOS los `monto_utilizado` desde cero:

1. Resetea todos a 0
2. Suma desde `formato_emisiones_detalles`
3. Reporta discrepancias residuales

**Uso:**
```bash
node scripts/repararMontosUtilizados.js
```

**⚠️ IMPORTANTE:**
- Hacer backup antes
- Ejecutar diagnóstico primero
- Revisar discrepancias residuales después

### 4. **Documentación** (`scripts/README_MONTOS_REPAIR.md`)

Guía completa con:
- Explicación del problema
- Cómo usar cada script
- Pasos recomendados
- FAQ

---

## 📊 Cambios en Archivos

### Backend

**Archivo:** `backend/controllers/formatoEmisionController.js`

**Línea:** ~520 (dentro de la sección de actualizar detalles)

**Cambio:** Agregar lógica para buscar detalles en certificación anterior cuando `detalles_certificacion_credito_id` sea NULL

### Rutas

**Archivo:** `backend/routes/comisiones.js`

**Líneas:** 2118-2141

**Cambios:** Agregar dos nuevos endpoints (solo para admin/diagnostico):
- `POST /formatos-emisiones/reparar/montos-utilizados` - Ejecutar reparación
- `GET /formatos-emisiones/diagnostico/montos` - Ver diagnóstico

### Frontend

**Archivo:** `material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`

**Línea:** ~2240

**Cambio:** Agregar columna de "CCP (Certificación)" con badge

**Archivo:** `material-dashboard-react/src/pages/Gestion/GestionCertificacionesFormatos.js`

**Línea:** ~350

**Cambio:** Agregar columna "Monto" a la tabla

---

## 🚀 Cómo Aplicar la Reparación

### Opción 1: Usando Scripts (Recomendado)

```bash
# 1. Hacer backup
mysqldump -u root -p comisiones_db > backup.sql

# 2. Diagnosticar
cd backend
node scripts/diagnosticoMontos.js > diagnostico_antes.txt

# 3. Revisar problema
cat diagnostico_antes.txt

# 4. Reparar
node scripts/repararMontosUtilizados.js

# 5. Verificar
node scripts/diagnosticoMontos.js > diagnostico_despues.txt
```

### Opción 2: Usando Endpoints API (Solo si tienes credenciales admin)

```bash
# Diagnóstico
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/formatos-emisiones/diagnostico/montos

# Reparación
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/formatos-emisiones/reparar/montos-utilizados
```

---

## ✨ Mejoras en UI

### EmisionFormatos (`/gestion/emision-formatos`)

**Antes:**
| Nº Doc | Ámbito | Lugar | Período | Modalidad | Comisionado | Monto | Acciones |

**Después:**
| Nº Doc | Ámbito | Lugar | Período | Modalidad | Comisionado | **CCP (Cert)** | Monto | Acciones |

- ✅ Nuevo badge para mostrar si tiene certificación
- ✅ Verde si tiene CCP, naranja si no tiene
- ✅ Fácil visibilidad de estado

### GestionCertificacionesFormatos (`/gestion/certificaciones-formatos`)

**Antes:**
| Número | Usuario | Ámbito | Lugar | Fechas | CCP | Estado | Acciones |

**Después:**
| Número | Usuario | Ámbito | Lugar | Fechas | **Monto** | CCP | Estado | Acciones |

- ✅ Nuevo columna de monto total
- ✅ Formato currency S/. con 2 decimales
- ✅ Fácil ver montos asignados

---

## 🧪 Validación

### Pruebas Realizadas

- [x] Backend recibe cambios de certificación correctamente
- [x] Detalles con NULL se mapean a certificación anterior
- [x] Montos se restan de cert antigua
- [x] Montos se suman a cert nueva
- [x] Frontend muestra badges de certificación
- [x] Frontend muestra montos en tabla

### Pruebas Pendientes

- [ ] Ejecutar script de diagnóstico en datos reales
- [ ] Verificar reparación en BD
- [ ] Revisar no hay sobregiros residuales
- [ ] Testing con múltiples cambios de certificación

---

## 📌 Notas Importantes

1. **Futuros cambios de certificación** utilizarán la nueva lógica mejorada
2. **Datos históricos negativos** necesitan reparación con scripts
3. **Sin automatización** de reparación (requiere revisión manual primero)
4. **Nuevos endpoints** se encuentran en `backend/controllers/formatoEmisionController.js`

---

## 🔄 Próximos Pasos

1. ✅ Ejecutar diagnóstico: `node scripts/diagnosticoMontos.js`
2. ✅ Revisar output
3. ✅ Hacer backup
4. ✅ Ejecutar reparación: `node scripts/repararMontosUtilizados.js`
5. ✅ Verificar resultado final
6. ✅ Probar cambios de certificación nuevamente en UI

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del script
2. Consulta `scripts/README_MONTOS_REPAIR.md`
3. Verifica si hay sobregiros residuales
4. Considera anular formatos problemáticos

---

**Implementado por:** Sistema Automatizado  
**Versión del Sistema:** 1.0  
**Compatibilidad:** Node.js 14+, MySQL 5.7+, React 18
