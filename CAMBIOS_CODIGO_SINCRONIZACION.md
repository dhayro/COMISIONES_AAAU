# 🔄 CAMBIOS DE CÓDIGO - Sincronización de Montos

## 📌 Resumen Ejecutivo

Se implementó un sistema de **sincronización automática** del `costo_total_comision` para que siempre refleje la suma correcta de los comisionados.

---

## 1️⃣ BACKEND - Controlador de Comisiones

### Archivo: `/backend/controllers/comisionController.js`

#### ✅ CAMBIO 1: Mejorar `obtenerComision()` para calcular montos correctamente

**Líneas 79-157**

```javascript
// ANTES: Usaba DISTINCT y no aplicaba lógica de VIÁTICOS
const [comisionadosRows] = await pool.query(
  `SELECT DISTINCT
    cc.usuario_id,
    u.nombre as usuario_nombre,
    cl.id as clasificador_id,
    cl.partida,
    cc.monto
   FROM comision_comisionados cc
   ...`
);

// Agrupar comisionados y armar matriz de montos
const comisionadosMap = {};
comisionadosRows.forEach((row) => {
  if (!comisionadosMap[row.usuario_id]) {
    comisionadosMap[row.usuario_id] = {
      usuario_id: row.usuario_id,
      usuario_nombre: row.usuario_nombre,
      montos_por_clasificador: {},
      monto_total: 0,
    };
  }
  comisionadosMap[row.usuario_id].montos_por_clasificador[row.clasificador_id] = row.monto;
  comisionadosMap[row.usuario_id].monto_total += parseFloat(row.monto) || 0;
});
```

**AHORA: Calcula montos con lógica correcta de VIÁTICOS**

```javascript
// MEJORADO: Obtiene todos los datos necesarios
const [comisionadosRows] = await pool.query(
  `SELECT
    cc.id,
    cc.usuario_id,
    u.nombre as usuario_nombre,
    cl.id as clasificador_id,
    cl.partida,
    cl.nombre as clasificador_nombre,
    cc.dias,
    cc.costo_xdia,
    cc.monto
   FROM comision_comisionados cc
   JOIN users u ON cc.usuario_id = u.id
   JOIN clasificadores cl ON cc.clasificador_id = cl.id
   WHERE cc.comision_id = ?
   ORDER BY u.nombre, cl.partida`,
  [id]
);

// Agrupar comisionados y armar matriz de montos
const comisionadosMap = {};
const clasificadoresSet = new Map();

comisionadosRows.forEach((row) => {
  // NUEVA LÓGICA: Calcular el monto correcto
  let montoReal = row.monto;
  if (row.clasificador_nombre && row.clasificador_nombre.includes('VIÁTICOS')) {
    montoReal = (parseFloat(row.dias) || 0) * (parseFloat(row.costo_xdia) || 0);
  } else {
    montoReal = parseFloat(row.monto) || 0;
  }

  // Agrupar por usuario
  if (!comisionadosMap[row.usuario_id]) {
    comisionadosMap[row.usuario_id] = {
      usuario_id: row.usuario_id,
      usuario_nombre: row.usuario_nombre,
      montos_por_clasificador: {},
      monto_total: 0,
    };
  }
  comisionadosMap[row.usuario_id].montos_por_clasificador[row.clasificador_id] = montoReal;
  comisionadosMap[row.usuario_id].monto_total += montoReal;

  // Registrar clasificadores únicos
  if (!clasificadoresSet.has(row.clasificador_id)) {
    clasificadoresSet.set(row.clasificador_id, {
      id: row.clasificador_id,
      nombre: row.clasificador_nombre,
      partida: row.partida,
      monto_total: 0
    });
  }
});
```

---

#### ✅ CAMBIO 2: Agregar endpoint para sincronizar todos los costos

**Líneas 710-769 (nuevo método)**

```javascript
// Sincronizar costos totales de todas las comisiones
exports.sincronizarCostosTotales = async (req, res) => {
  try {
    const { pool } = require('../config/database');

    console.log('\n🔄 SINCRONIZACIÓN DE COSTOS TOTALES - INICIADA');

    // Obtener todas las comisiones
    const [comisiones] = await pool.query(
      `SELECT id, costo_total_comision FROM comisiones ORDER BY id`
    );

    let actualizadas = 0;
    const discrepancias = [];

    for (const comision of comisiones) {
      const comisionId = comision.id;
      const costoActual = parseFloat(comision.costo_total_comision) || 0;

      // Calcular la suma real de comicionados
      const [comisionados] = await pool.query(
        `SELECT cc.*, cl.nombre as clasificador_nombre
         FROM comision_comisionados cc
         JOIN clasificadores cl ON cc.clasificador_id = cl.id
         WHERE cc.comision_id = ?`,
        [comisionId]
      );

      // Calcular total con lógica correcta para VIÁTICOS
      let totalCalculado = 0;
      comisionados.forEach(com => {
        let monto = parseFloat(com.monto) || 0;
        if (com.clasificador_nombre && com.clasificador_nombre.includes('VIÁTICOS')) {
          monto = (parseFloat(com.dias) || 0) * (parseFloat(com.costo_xdia) || 0);
        }
        totalCalculado += monto;
      });

      // Comparar y actualizar si hay diferencia
      if (Math.abs(costoActual - totalCalculado) > 0.01) {
        console.log(`⚠️  Comisión ID ${comisionId}: ${costoActual} → ${totalCalculado.toFixed(2)}`);

        await pool.query(
          `UPDATE comisiones SET costo_total_comision = ? WHERE id = ?`,
          [totalCalculado, comisionId]
        );

        actualizadas++;
        discrepancias.push({
          comision_id: comisionId,
          costo_anterior: costoActual,
          costo_nuevo: totalCalculado,
          diferencia: totalCalculado - costoActual
        });
      }
    }

    console.log(`✅ SINCRONIZACIÓN COMPLETADA: ${actualizadas} comisiones actualizadas\n`);

    res.json({
      mensaje: 'Sincronización de costos completada',
      comisiones_procesadas: comisiones.length,
      comisiones_actualizadas: actualizadas,
      discrepancias: discrepancias
    });
  } catch (error) {
    console.error('❌ ERROR EN SINCRONIZACIÓN:', error.message);
    res.status(500).json({
      error: error.message,
      detalles: 'Error al sincronizar costos totales'
    });
  }
};
```

---

## 2️⃣ BACKEND - Rutas

### Archivo: `/backend/routes/comisiones.js`

#### ✅ CAMBIO 3: Agregar ruta para sincronización

**Líneas 885-895 (antes del `module.exports`)**

```javascript
/**
 * @route POST /admin/sincronizar-costos
 * @description Sincronizar costos totales de todas las comisiones
 * @security bearerAuth
 * @returns {Object} Resumen de sincronización
 */
router.post('/admin/sincronizar-costos', comisionController.sincronizarCostosTotales);

module.exports = router;
```

**Uso:**
```bash
curl -X POST http://localhost:3001/api/comisiones/admin/sincronizar-costos \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 3️⃣ FRONTEND - Gestion de Comisiones

### Archivo: `/material-dashboard-react/src/pages/Gestion/GestionComisiones.js`

#### ✅ CAMBIO 4: Agregar función para recargar comisión completa

**Líneas 172-181 (nueva función)**

```javascript
// Recargar la comisión completa del backend (para actualizar costo_total_comision)
const recargarComisionCompleta = async (comisionId) => {
  try {
    const response = await api.obtenerComision(comisionId);
    // Actualizar la comisión en la tabla principal con los datos frescos
    setItems((prevItems) => prevItems.map((c) => (c.id === comisionId ? response : c)));
    return response;
  } catch (err) {
    console.error('Error recargando comisión completa:', err.message);
  }
};
```

**Por qué:** Cuando se editan/agregan comisionados y el backend recalcula el `costo_total_comision`, el frontend necesita recargar la comisión para mostrar el nuevo valor.

---

#### ✅ CAMBIO 5: Actualizar flujo de guardado de edición

**Líneas 495-499 (modificado)**

```javascript
// ANTES:
setSuccess('Actualizado');
setItems(items.map((c) => (c.id === editingId ? { ...c, ...formDataConAmbito } : c)));
// Recargar comisionados para reflejar cambios guardados
await cargarComisionados(editingId);

// AHORA:
setSuccess('Actualizado');
// Recargar comisión completa para actualizar costo_total_comision
await recargarComisionCompleta(editingId);
// Recargar comisionados para reflejar cambios guardados
await cargarComisionados(editingId);
```

**Impacto:** Después de editar comisionados:
1. El backend recalcula el `costo_total_comision`
2. El frontend recarga la comisión completa
3. La tabla muestra el nuevo valor correcto

---

#### ✅ CAMBIO 6: Actualizar flujo de guardado de creación

**Líneas 541-550 (modificado)**

```javascript
// ANTES:
setSuccess('Creado');
setItems((prevItems) => [...prevItems, response]);

// AHORA:
setSuccess('Creado');
// Recargar comisión completa para obtener costo_total_comision recalculado
if (comisionados.length > 0) {
  const comisionActualizada = await recargarComisionCompleta(response.id);
  if (comisionActualizada) {
    setItems((prevItems) => [
      ...prevItems.filter((c) => c.id !== response.id),
      comisionActualizada,
    ]);
  }
} else {
  setItems((prevItems) => [...prevItems, response]);
}
```

**Impacto:** Cuando se crea una nueva comisión con comisionados:
1. Se agregan los comisionados (backend calcula sus montos)
2. El backend recalcula el `costo_total_comision` total
3. El frontend recarga la comisión completa
4. La tabla muestra el nuevo `costo_total_comision` correcto (no 0)

---

## 4️⃣ NUEVO SCRIPT

### Archivo: `/backend/sync-costos-totales.js`

```javascript
/**
 * Script para sincronizar costo_total_comision con la suma real de comision_comisionados.monto
 * Esto corrige comisiones que tienen el costo_total_comision desactualizado
 */

// Uso:
cd /d/COMISIONES_AAAU/backend
node sync-costos-totales.js
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes ❌ | Después ✅ |
|---------|---------|---------|
| **Cálculo de Monto** | Solo tomaba `cc.monto` sin validar tipo | Aplica lógica: VIÁTICOS = días × costo_xdia |
| **Sincronización Manual** | No existía | `POST /admin/sincronizar-costos` |
| **Recarga Automática** | Frontend no recargaba datos después de editar | Frontend recarga comisión completa del backend |
| **Consistencia** | `costo_total_comision` podía estar desactualizado | Siempre sincronizado con suma real |
| **Detalle de Comisionados** | Modal mostraba datos sin cálculo correcto | Modal obtiene datos con cálculo correcto |

---

## 🧪 Resultado de Prueba

### Script Ejecutado:
```bash
node sync-costos-totales.js
```

### Resultado:
```
🔄 INICIANDO SINCRONIZACIÓN DE COSTOS TOTALES...

📊 Total de comisiones a procesar: 1

⚠️  Comisión ID 1:
   Costo actual en DB: 2640900.01
   Suma real calculada: 5340.00
   Diferencia: -2635560.01

✅ SINCRONIZACIÓN COMPLETADA
   Comisiones actualizadas: 1
   Comisiones sin cambios: 0

📋 RESUMEN DE CAMBIOS:
=====================================
Comisión 1: 2640900.01 → 5340.00 (Δ -2635560.01)
```

### Resultado Posterior (Sin Cambios Necesarios):
```
🔄 INICIANDO SINCRONIZACIÓN DE COSTOS TOTALES...

📊 Total de comisiones a procesar: 1

✅ SINCRONIZACIÓN COMPLETADA
   Comisiones actualizadas: 0
   Comisiones sin cambios: 1
```

✅ **Comisión sincronizada correctamente**

