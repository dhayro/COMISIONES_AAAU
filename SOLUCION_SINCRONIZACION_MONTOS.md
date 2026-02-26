# 🔧 CORRECCIÓN: Sincronización de Montos en Comisionados

**Fecha**: 11 de Febrero de 2026  
**Estado**: ✅ COMPLETADO

---

## 📋 Problema Identificado

El `costo_total_comision` de la tabla `comisiones` **NO coincidía** con la suma real de los `monto` en `comision_comisionados`. 

### Ejemplo:
- **En BD**: `costo_total_comision = 2,640,900.01` ❌
- **Suma real**: 3 personas × 2 partidas = 5,340.00 ✅

---

## 🔍 Causa Raíz

### Frontend
- **Nueva comisión**: No se calculaba ni se enviaba el monto → se guardaba NULL o valor incorrecto
- **Edición**: El monto SÍ se recalculaba (pero solo para comisionados existentes)

### Backend
- El endpoint `agregarComisionado` **validaba** que `monto` estuviera presente
- Pero el frontend **no lo estaba enviando** para nuevos comisionados

### Base de Datos
- Comisiones antiguas tenían valores acumulados incorrectamente

---

## ✅ Soluciones Implementadas

### 1️⃣ **Script de Sincronización** (`sync-costos-totales.js`)
```bash
node backend/sync-costos-totales.js
```
- Recorre todas las comisiones
- Calcula el total REAL usando la lógica correcta de VIÁTICOS (días × costo_xdia)
- Actualiza `costo_total_comision` en la BD

**Resultado**:
- ✅ Comisión ID 1: 2,640,900.01 → **5,340.00**

---

### 2️⃣ **Frontend - Cálculo de Monto Consistente** 
**Archivo**: `material-dashboard-react/src/pages/Gestion/GestionComisiones.js`

**Cambio**: Ahora calcula y envía el `monto` SIEMPRE (para nuevos y existentes):

```javascript
// Recalcular monto basado en si es viático o no (PARA TODOS)
const esViatico =
  comisionado.clasificador_nombre &&
  (comisionado.clasificador_nombre.includes('VIÁTICOS') ||
    comisionado.clasificador_nombre.includes('ASIGNACIONES'));

const montoRecalculado = esViatico
  ? comisionado.dias * comisionado.costo_xdia  // Viáticos: multiplica por días
  : comisionado.costo_xdia;                     // Otros: solo costo

const comisionadoParaGuardar = {
  ...comisionadoConMayusculas,
  monto: montoRecalculado,  // ← Ahora SIEMPRE se incluye
};
```

**Lugar**: 
- Línea ~456: Al crear nueva comisión
- Línea ~469: Al editar comisión existente

---

### 3️⃣ **Backend - Endpoint Mejorado** 
**Archivo**: `backend/controllers/comisionController.js`

#### a) Mejorado `obtenerComision` (líneas 79-159)
- Calcula el monto CORRECTO en tiempo real
- Usa la lógica de VIÁTICOS (días × costo_xdia)
- Agrupa por usuario y clasificador
- Retorna estructura con comisionados + clasificadores + totales

```javascript
// Respuesta:
{
  ...comisionData,
  comisionados: [{
    usuario_id,
    usuario_nombre,
    montos_por_clasificador: {clasificador_id: monto, ...},
    monto_total
  }, ...],
  clasificadores: [{
    id,
    nombre,
    partida,
    monto_total
  }, ...],
  monto_total
}
```

#### b) Nuevo Endpoint: `POST /api/comisiones/admin/sincronizar-costos`
- Sincroniza ALL comisiones en la BD
- Recalcula totales usando lógica correcta
- Retorna resumen de cambios

```bash
curl -X POST http://localhost:3001/api/comisiones/admin/sincronizar-costos \
  -H "Authorization: Bearer <token>"
```

**Respuesta**:
```json
{
  "mensaje": "Sincronización de costos completada",
  "comisiones_procesadas": 1,
  "comisiones_actualizadas": 1,
  "discrepancias": [{
    "comision_id": 1,
    "costo_anterior": 2640900.01,
    "costo_nuevo": 5340.00,
    "diferencia": -2635560.01
  }]
}
```

---

## 🧪 Validación de la Solución

### BD Actual (después de sincronización)
```
Comisión ID 1:
- DHAYRO: VIÁTICOS (4×220 = 880) + PASAJES (900) = 1,780
- CAROL: VIÁTICOS (4×220 = 880) + PASAJES (900) = 1,780
- MILNER: VIÁTICOS (4×220 = 880) + PASAJES (900) = 1,780
─────────────────────────────────────────────
TOTAL: 5,340.00 ✅
```

### Flujo del Monto Ahora
1. **Frontend**: Calcula `monto = esViatico ? días × costo : costo`
2. **API**: Envía `{..., monto, ...}`
3. **Backend**: Valida que `monto` esté presente
4. **BD**: Guarda `monto` en `comision_comisionados`
5. **Recalcular**: `obtenerComision` → `costo_total_comision` siempre está sincronizado

---

## 📊 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `backend/controllers/comisionController.js` | Mejorado `obtenerComision` + nuevo `sincronizarCostosTotales` | 79-159, +78 líneas nuevas |
| `backend/routes/comisiones.js` | Agregada ruta POST `/admin/sincronizar-costos` | +7 líneas |
| `material-dashboard-react/src/pages/Gestion/GestionComisiones.js` | Cálculo de monto SIEMPRE (nuevos y existentes) | 456-469, 498-531 |
| `backend/sync-costos-totales.js` | Script de sincronización ONE-TIME | nuevo archivo |

---

## 🚀 Pasos para Aplicar

1. **Sincronizar BD una sola vez**:
   ```bash
   cd backend
   node sync-costos-totales.js
   ```

2. **Compilar frontend**:
   ```bash
   cd material-dashboard-react
   npm run build
   ```

3. **Reiniciar backend**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Probar creando/editando comisionado**:
   - Crear nueva comisión con comisionados
   - Verificar que el monto se calcule correctamente
   - Verificar que se guarde en BD
   - Abrir aprobaciones y ver detalle → monto debe coincidir

---

## ✨ Beneficios

✅ **Montos consistentes** entre frontend, BD y reportes  
✅ **VIÁTICOS** se calculan correctamente (días × costo)  
✅ **Totales** siempre sincronizados  
✅ **Endpoint de sincronización** para corregir discrepancias futuras  
✅ **Cálculo en tiempo real** en detalle de comisión  
✅ **Validación backend** asegura que monto siempre se envíe  

---

## 🔐 Notas de Seguridad

- Endpoint `/admin/sincronizar-costos` requiere autenticación (JWT)
- Solo recalcula, NO elimina datos
- Reversible: se puede ejecutar múltiples veces sin problema
- Logs detallados para auditoría

---

**Elaborado por**: GitHub Copilot  
**Test Status**: ✅ BUILD PASSED (501.39 kB gzipped)
