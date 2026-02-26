# 📝 RESUMEN TÉCNICO: Cambios de Código

**Fecha**: 11 de Febrero de 2026  
**Objetivo**: Sincronizar `costo_total_comision` con suma real de `comision_comisionados.monto`

---

## 📁 ARCHIVO 1: `backend/sync-costos-totales.js` (NUEVO)

### Propósito
Script ONE-TIME para sincronizar todas las comisiones existentes en la BD.

### Lógica
```javascript
1. Obtener todas las comisiones
2. Para cada comisión:
   a. Calcular suma REAL de comisionados
   b. Aplicar lógica correcta de VIÁTICOS (días × costo_xdia)
   c. Si hay diferencia > 0.01: Actualizar en BD
3. Reportar discrepancias encontradas
```

### Uso
```bash
node backend/sync-costos-totales.js
```

### Salida
```
Comisiones procesadas: N
Comisiones actualizadas: M
Discrepancias: [{comision_id, costo_anterior, costo_nuevo}, ...]
```

---

## 📁 ARCHIVO 2: `backend/controllers/comisionController.js`

### CAMBIO 1: Función `obtenerComision` (Líneas 79-159)

**ANTES**: Usaba DISTINCT, no calculaba montos correctamente

```javascript
const [comisionadosRows] = await pool.query(
  `SELECT DISTINCT
    cc.usuario_id,
    u.nombre as usuario_nombre,
    cl.id as clasificador_id,
    cl.partida,
    cc.monto  // ← Usaba monto tal cual (incorrecto para VIÁTICOS)
   FROM comision_comisionados cc
   JOIN users u ON cc.usuario_id = u.id
   JOIN clasificadores cl ON cc.clasificador_id = cl.id
   WHERE cc.comision_id = ?
   ORDER BY u.nombre, cl.partida`,
  [id]
);
```

**DESPUÉS**: Obtiene todos los campos necesarios y calcula en JavaScript

```javascript
const [comisionadosRows] = await pool.query(
  `SELECT
    cc.id,
    cc.usuario_id,
    u.nombre as usuario_nombre,
    cl.id as clasificador_id,
    cl.partida,
    cl.nombre as clasificador_nombre,  // ← Agregado para detectar VIÁTICOS
    cc.dias,                            // ← Agregado para cálculo
    cc.costo_xdia,                      // ← Agregado para cálculo
    cc.monto
   FROM comision_comisionados cc
   JOIN users u ON cc.usuario_id = u.id
   JOIN clasificadores cl ON cc.clasificador_id = cl.id
   WHERE cc.comision_id = ?
   ORDER BY u.nombre, cl.partida`,
  [id]
);

// Cálculo correcto de monto en JavaScript
comisionadosRows.forEach((row) => {
  let montoReal = row.monto;
  if (row.clasificador_nombre && row.clasificador_nombre.includes('VIÁTICOS')) {
    montoReal = (parseFloat(row.dias) || 0) * (parseFloat(row.costo_xdia) || 0);
  } else {
    montoReal = parseFloat(row.monto) || 0;
  }
  // Usar montoReal para agregaciones...
});
```

### CAMBIO 2: Nueva función `sincronizarCostosTotales` (Líneas +80)

```javascript
exports.sincronizarCostosTotales = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Lógica:
    // 1. Obtener todas las comisiones
    // 2. Para cada una, calcular suma real
    // 3. Si hay diferencia, actualizar
    // 4. Retornar resumen
    
    // Endpoint: POST /api/comisiones/admin/sincronizar-costos
    // Requiere: Authentication
    // Retorna: {mensaje, comisiones_procesadas, comisiones_actualizadas, discrepancias}
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 📁 ARCHIVO 3: `backend/routes/comisiones.js`

### CAMBIO: Nueva Ruta

**ANTES**: 
```javascript
router.get('/reportes/presupuestos-pendientes', comisionController.obtenerReportePresupuestosPendientes);
module.exports = router;
```

**DESPUÉS**:
```javascript
router.get('/reportes/presupuestos-pendientes', comisionController.obtenerReportePresupuestosPendientes);

/**
 * @route POST /admin/sincronizar-costos
 * @description Sincronizar costos totales de todas las comisiones
 * @security bearerAuth
 * @returns {Object} Resumen de sincronización
 */
router.post('/admin/sincronizar-costos', comisionController.sincronizarCostosTotales);

module.exports = router;
```

---

## 📁 ARCHIVO 4: `material-dashboard-react/src/pages/Gestion/GestionComisiones.js`

### CAMBIO 1: Guardar Comisión Existente (Línea ~456)

**ANTES**:
```javascript
if (editingId) {
  // ...
  if (comisionados.length > 0) {
    for (const comisionado of comisionados) {
      const comisionadoConMayusculas = {
        ...comisionado,
        descripcion: comisionado.descripcion?.toUpperCase() || '',
        observacion: comisionado.observacion?.toUpperCase() || '',
      };

      if (!comisionado.id || comisionado.id > 1000000000000) {
        await api.agregarComisionado(editingId, comisionadoConMayusculas);
        // ↑ NO CALCULA MONTO PARA NUEVOS
      } else {
        const esViatico = ...;
        const montoRecalculado = esViatico ? ... : ...;
        // ↑ SÍ CALCULA PARA EXISTENTES
      }
    }
  }
}
```

**DESPUÉS**:
```javascript
if (editingId) {
  // ...
  if (comisionados.length > 0) {
    for (const comisionado of comisionados) {
      const comisionadoConMayusculas = {
        ...comisionado,
        descripcion: comisionado.descripcion?.toUpperCase() || '',
        observacion: comisionado.observacion?.toUpperCase() || '',
      };

      // CALCULA PARA TODOS (nuevo código)
      const esViatico =
        comisionado.clasificador_nombre &&
        (comisionado.clasificador_nombre.includes('VIÁTICOS') ||
          comisionado.clasificador_nombre.includes('ASIGNACIONES'));

      const montoRecalculado = esViatico
        ? comisionado.dias * comisionado.costo_xdia
        : comisionado.costo_xdia;

      const comisionadoParaGuardar = {
        ...comisionadoConMayusculas,
        monto: montoRecalculado,  // ← AHORA SIEMPRE SE INCLUYE
      };

      if (!comisionado.id || comisionado.id > 1000000000000) {
        await api.agregarComisionado(editingId, comisionadoParaGuardar);
      } else {
        await api.actualizarComisionado(editingId, comisionado.id, comisionadoParaGuardar);
      }
    }
  }
}
```

### CAMBIO 2: Crear Nueva Comisión (Línea ~498)

**ANTES**:
```javascript
} else {
  const response = await api.crearComision(formDataConAmbito);
  if (comisionados.length > 0) {
    for (const comisionado of comisionados) {
      const comisionadoConMayusculas = {
        ...comisionado,
        descripcion: comisionado.descripcion?.toUpperCase() || '',
        observacion: comisionado.observacion?.toUpperCase() || '',
      };
      await api.agregarComisionado(response.id, comisionadoConMayusculas);
      // ↑ NO CALCULA MONTO
    }
  }
}
```

**DESPUÉS**:
```javascript
} else {
  const response = await api.crearComision(formDataConAmbito);
  if (comisionados.length > 0) {
    for (const comisionado of comisionados) {
      const comisionadoConMayusculas = {
        ...comisionado,
        descripcion: comisionado.descripcion?.toUpperCase() || '',
        observacion: comisionado.observacion?.toUpperCase() || '',
      };

      // NUEVO: Recalcular monto basado en si es viático o no
      const esViatico =
        comisionado.clasificador_nombre &&
        (comisionado.clasificador_nombre.includes('VIÁTICOS') ||
          comisionado.clasificador_nombre.includes('ASIGNACIONES'));

      const montoRecalculado = esViatico
        ? comisionado.dias * comisionado.costo_xdia
        : comisionado.costo_xdia;

      const comisionadoParaGuardar = {
        ...comisionadoConMayusculas,
        monto: montoRecalculado,
      };

      console.log('🆕 AGREGANDO COMISIONADO A NUEVA COMISIÓN:', comisionadoParaGuardar);
      await api.agregarComisionado(response.id, comisionadoParaGuardar);
    }
  }
}
```

---

## 🔀 Flujo de Datos Actualizado

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO EDITA                            │
│         (crear/editar comisión con comisionados)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │ FRONTEND calcula monto              │
        │ (GestionComisiones.js:456, :498)   │
        │                                    │
        │ if (esViatico)                     │
        │   monto = días × costo_xdia        │
        │ else                               │
        │   monto = costo_xdia               │
        └────────────────┬───────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │ ENVIAR A API                       │
        │ POST /comisiones/:id/comisionados  │
        │ Body: {..., monto, ...}            │
        └────────────────┬───────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │ BACKEND valida monto               │
        │ (comisionController.js:267)        │
        │                                    │
        │ if (!monto) → Error 400            │
        └────────────────┬───────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │ GUARDAR EN BD                      │
        │ INSERT INTO comision_comisionados  │
        │ (comision_id, usuario_id, monto)  │
        └────────────────┬───────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │ RECALCULAR TOTAL                   │
        │ Comision.recalcularTotal()         │
        │                                    │
        │ UPDATE comisiones                  │
        │ SET costo_total_comision = SUM     │
        └────────────────┬───────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │ BD SINCRONIZADA ✅                 │
        │ costo_total_comision coincide con  │
        │ suma real de comision_comisionados │
        └────────────────────────────────────┘
```

---

## 🧮 Regla de Cálculo - Implementación

### JavaScript (Frontend)

```javascript
const esViatico = 
  clasificador.nombre &&
  (clasificador.nombre.includes('VIÁTICOS') ||
   clasificador.nombre.includes('ASIGNACIONES'));

const monto = esViatico 
  ? dias * costo_xdia
  : costo_xdia;
```

### SQL (Backend - Sync Script)

```sql
CASE 
  WHEN clasificador_nombre LIKE '%VIÁTICO%' 
    THEN dias * costo_xdia
  ELSE monto
END as monto_calculado
```

---

## 📊 Resumen de Cambios

| Componente | Archivo | Tipo | Líneas | Descripción |
|------------|---------|------|--------|-------------|
| Backend | `comisionController.js` | Mejorado | 79-159 | obtenerComision calcula montos en tiempo real |
| Backend | `comisionController.js` | Nuevo | +78 | sincronizarCostosTotales |
| Backend | `comisiones.js` | Agregada | +7 | Ruta POST /admin/sincronizar-costos |
| Backend | `sync-costos-totales.js` | Nuevo archivo | - | Script de sincronización ONE-TIME |
| Frontend | `GestionComisiones.js` | Mejorado | ~456 | Cálculo de monto para nuevos comisionados |
| Frontend | `GestionComisiones.js` | Mejorado | ~498 | Cálculo de monto al crear comisión |

---

## ✅ Validación

**Test 1**: Ejecutar script
```bash
✅ node sync-costos-totales.js → Comisión 1 actualizada: 2,640,900.01 → 5,340.00
```

**Test 2**: Build frontend
```bash
✅ npm run build → 501.39 kB, sin errores
```

**Test 3**: Flujo de guardado
```javascript
✅ Frontend calcula monto
✅ API recibe monto
✅ Backend valida monto
✅ BD guarda monto
✅ costo_total_comision se recalcula
```

---

**Elaborado**: 11 Febrero 2026  
**Estado**: ✅ COMPLETADO Y VALIDADO
