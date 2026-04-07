# 🚨 FIX CRÍTICO: DOBLE RESTA EN MONTO_UTILIZADO

**Problema Identificado:**
El formato 38 cuando le quitaste la certificación, el sistema restó dos veces los montos:
- Primera vez en línea ~330 (cuando certificacion_anterior != null)
- Segunda vez en línea ~720 (en el loop de detalles antiguos)

**Resultado:** 
```
detalles_certificacion_credito ID 27: monto_utilizado = -750 ❌ (debería ser 0)
detalles_certificacion_credito ID 28: monto_utilizado = -880 ❌ (debería ser 0)
```

---

## ✅ SOLUCIÓN RÁPIDA Y DEFINITIVA

### OPCIÓN 1: Limpiar Datos Manualmente (Ahora)

```sql
-- Para REPARAR el daño actual en los datos:
UPDATE detalles_certificacion_credito 
SET monto_utilizado = 0 
WHERE id IN (27, 28);

-- Luego verificar:
SELECT id, monto, monto_utilizado 
FROM detalles_certificacion_credito 
WHERE id IN (27, 28);
```

### OPCIÓN 2: Simplificar Backend (Para Futuro)

**Ubicación:** `backend/controllers/formatoEmisionController.js`

**Lo que necesitas hacer:**

1. **Ir a línea 363** (donde dice "datosActualizacion.estado_emision final")

2. **ELIMINAR COMPLETAMENTE las líneas 366-800** que contienen toda la lógica de:
   - `if (certificacion_anterior !== null && certificacion_nueva === null)` 
   - `if (meta_anterior !== null && meta_nueva !== null && ...)`
   - `else if (certificacion_anterior !== null && certificacion_nueva !== null ...)`
   - Y todo lo relacionado con suma/resta manual

3. **REEMPLAZAR por esto:**

```javascript
    // 🔍 Obtener formato anterior
    const [formatoAnterior] = await pool.query(
      `SELECT certificacion_id, meta_id FROM formato_emisiones WHERE id = ?`,
      [id]
    );

    const certificacion_anterior = formatoAnterior && formatoAnterior.length > 0 ? formatoAnterior[0].certificacion_id : null;
    const meta_anterior = formatoAnterior && formatoAnterior.length > 0 ? formatoAnterior[0].meta_id : null;
    const certificacion_nueva = certificacion_id !== undefined ? certificacion_id : certificacion_anterior;
    const meta_nueva = meta_id !== undefined ? meta_id : meta_anterior;

    console.log(`🔄 Cambio de certificación: ${certificacion_anterior} → ${certificacion_nueva}`);

    // 🆕 VALIDAR que nueva cert pertenece a nueva meta (si aplica)
    if (certificacion_nueva !== null && meta_nueva !== null) {
      const [certValida] = await pool.query(
        `SELECT id FROM certificaciones_credito WHERE id = ? AND meta_id = ?`,
        [certificacion_nueva, meta_nueva]
      );
      if (!certValida || certValida.length === 0) {
        return res.status(400).json({ error: 'La certificación no pertenece a la meta seleccionada' });
      }
    }

    // 🆕 ACTUALIZAR DETALLES (eliminar y recrear)
    if (detalles && Array.isArray(detalles)) {
      // 1. Eliminar todos los detalles antiguos
      await pool.query(
        `DELETE FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
        [id]
      );

      // 2. Insertar nuevos detalles
      for (const detalle of detalles) {
        let detallesCertId = detalle.detalles_certificacion_credito_id || null;

        // Buscar automáticamente si no viene explícito
        if (!detallesCertId && certificacion_nueva && detalle.clasificador_id) {
          const [detallesCert] = await pool.query(
            `SELECT id FROM detalles_certificacion_credito 
             WHERE certificacion_credito_id = ? AND clasificador_id = ?
             LIMIT 1`,
            [certificacion_nueva, detalle.clasificador_id]
          );
          if (detallesCert && detallesCert.length > 0) {
            detallesCertId = detallesCert[0].id;
          }
        }

        await pool.query(
          `INSERT INTO formato_emisiones_detalles (
            formato_emision_id, clasificador_id, monto, detalles_certificacion_credito_id
          ) VALUES (?, ?, ?, ?)`,
          [id, detalle.clasificador_id, detalle.monto || 0, detallesCertId]
        );
      }
    }

    // 🆕 ACTUALIZAR FORMATO PRINCIPAL
    const actualizado = await FormatoEmision.actualizar(id, datosActualizacion);

    if (!actualizado) {
      return res.status(404).json({ error: 'Formato no encontrado o sin cambios' });
    }

    // 🆕 SINCRONIZAR (ESTO RECALCULA TODO CORRECTAMENTE)
    await sincronizarMontoUtilizado(id);

    res.json({ 
      message: 'Formato actualizado exitosamente',
      detalles_actualizados: detalles ? detalles.length : 0
    });
```

---

## 📊 Resumen del Cambio

| Antes | Después |
|-------|---------|
| ❌ Suma/resta manual en 3 lugares | ✅ Suma/resta eliminada |
| ❌ Doble resto | ✅ Cero duplicados |
| ❌ Valores inconsistentes | ✅ Sincronización recalcula TODO |
| ❌ 400+ líneas de lógica compleja | ✅ 200 líneas de lógica clara |

---

## 🧪 Para Probar Después:

1. Actualiza la función `actualizar()`
2. Reinicia backend: `npm run dev`
3. Tira una actualización a un formato
4. Verifica en BD que los `monto_utilizado` son correctos

---

**Status:** 🚨 CRÍTICO - FIX INMEDIATO RECOMENDADO

