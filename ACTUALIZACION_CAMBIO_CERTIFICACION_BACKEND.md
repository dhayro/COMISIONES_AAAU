# 🔄 Actualización: Manejo de Cambios de Certificación en Backend

## 📋 Resumen
Se agregó lógica completa para manejar cuando un usuario **cambia de una certificación a otra diferente** (no solo remociones a NULL).

## 🎯 Cambios Realizados

### Archivo: `backend/controllers/formatoEmisionController.js`

#### Ubicación: Función `actualizar()` (líneas ~272-360)

#### Nueva Lógica de Cambio de Certificación (A → B)

Agregado un bloque `else if` que detecta cuando:
- La certificación anterior **NO es NULL**
- La nueva certificación **NO es NULL**
- Las certificaciones son **diferentes** (A ≠ B)

#### Flujo de Ejecución:

```
Cambio Detectado (Cert A → Cert B)
    ↓
1️⃣ Restar montos de Certificación ANTERIOR
    - Query: SELECT de detalles antiguos
    - UPDATE: monto_utilizado = monto_utilizado - monto_total
    ↓
2️⃣ Obtener detalles de Nueva Certificación
    - Query: SELECT detalles_certificacion_credito con clasificadores
    ↓
3️⃣ Actualizar referencias en formato_emisiones_detalles
    - Para cada detalle del formato:
      * Buscar clasificador equivalente en nueva certificación
      * UPDATE: detalles_certificacion_credito_id → nuevo_id
    ↓
4️⃣ Sumar montos a Certificación NUEVA
    - Acumular montos por detalle (puede haber múltiples líneas del formato)
    - UPDATE: monto_utilizado = monto_utilizado + monto_total
```

## 🔍 Detalles Técnicos

### Pasos Implementados:

1. **Detección de cambio** (línea ~272):
   ```javascript
   else if (certificacion_anterior !== null && 
            certificacion_nueva !== null && 
            certificacion_anterior !== certificacion_nueva)
   ```

2. **Resta de montos antiguos** (líneas ~283-293):
   - Query con GROUP BY para sumar montos por detalle
   - Loop que resta `monto_total` de cada `detalles_certificacion_credito_id`

3. **Obtención de nueva certificación** (líneas ~295-303):
   - Query de `detalles_certificacion_credito` con la nueva `certificacion_id`
   - Obtiene `id` y `clasificador_id` para mapear

4. **Actualización de referencias** (líneas ~305-330):
   - Query de todos los `formato_emisiones_detalles` del formato
   - Para cada uno, busca coincidencia de `clasificador_id` en nueva certificación
   - UPDATE de `detalles_certificacion_credito_id` al nuevo valor
   - Acumula montos en objeto `montosTotalesPorDetalle`

5. **Suma de montos nuevos** (líneas ~332-341):
   - Loop por cada detalle de la nueva certificación
   - UPDATE sumando `monto_utilizado`

## 📊 Casos Manejados

| Caso | Antes | Después | Acción |
|------|-------|---------|--------|
| Remoción | Cert A | NULL | Resta de A, limpiar referencias |
| Cambio | Cert A | Cert B | Resta de A, actualiza refs, suma de B |
| Asignación | NULL | Cert B | Suma de B (manejado en detalles) |
| Sin cambio | Cert A | Cert A | Nada (no entra en bloques) |

## 🛡️ Validaciones Realizadas

### Frontend (`GestionCertificacionesFormatos.js`):
- ✅ Verificar que todos los clasificadores existan en nueva certificación
- ✅ Verificar saldo disponible en cada clasificador
- ✅ Mostrar errores detallados si validación falla

### Backend:
- ✅ Buscar clasificador equivalente en nueva certificación (usa `.find()`)
- ✅ Si NO encuentra clasificador, no actualiza esa referencia (¡ATENCIÓN!)
- ✅ Logging detallado de cada operación

## ⚠️ Puntos Críticos

### 1. **Validación Frontend es OBLIGATORIA**
La frontend valida que existan todos los clasificadores ANTES de permitir el cambio.

### 2. **Mapeo por Clasificador**
El código asume que los clasificadores son compartidos entre certificaciones:
```javascript
const nuevoDetalle = detallesNuevaCert.find(d => d.clasificador_id === formatoDetalle.clasificador_id);
```

### 3. **Referencia Nula si No Existe**
Si un clasificador NO existe en la nueva certificación, la referencia se mantiene NULL.

### 4. **Acumulación de Montos**
Múltiples líneas del formato con el mismo clasificador se acumulan antes de sumar:
```javascript
montosTotalesPorDetalle[nuevoDetalle.id] += formatoDetalle.monto || 0;
```

## 📝 Logs Esperados

Cuando se cambia de certificación, verás en consola:
```
🔄 Certificación cambiada (11 → 5), actualizando montos utilizados...
📊 Detalles antiguos encontrados: 3
✅ Monto restado de certificación anterior (detalle 45): -S/. 1500
📋 Detalles encontrados en nueva certificación: 4
🔗 Referencia actualizada: clasificador 1 → detalle 78
🔗 Referencia actualizada: clasificador 2 → detalle 79
✅ Monto sumado a nueva certificación (detalle 78): +S/. 1500
✅ Cambio de certificación completado exitosamente
```

## 🧪 Cómo Probar

1. Abre `GestionCertificacionesFormatos` en el navegador
2. Haz clic en "Modificar" en un formato que tenga certificación
3. Cambia la Meta (esto recarga certificaciones disponibles)
4. Selecciona una certificación diferente
5. Haz clic en "Guardar"
6. Verifica:
   - Frontend valida que existan clasificadores
   - Si pasa validación, backend actualiza montos_utilizados
   - Recarga la página para ver cambios persistidos
7. Abre DevTools → Network/Console para ver logs

## 🔗 Conexión con Frontend

El frontend tiene `validarCambiosCertificacion()` que:
- ✅ Obtiene el formato completo con detalles
- ✅ Obtiene la nueva certificación con detalles
- ✅ Verifica CADA clasificador existe en nueva cert
- ✅ Verifica SALDO DISPONIBLE para cada uno
- ✅ Si todo OK, permite guardar (backend recibe el cambio)

## 📚 Referencias de Código

**Frontend**: `src/components/GestionCertificacionesFormatos.js`
- Función: `validarCambiosCertificacion()`
- Función: `guardarCambios()`

**Backend**: `backend/controllers/formatoEmisionController.js`
- Función: `actualizar()`
- Líneas: ~272-360 (nueva lógica de cambio)
- Líneas: ~232-271 (lógica de remoción existente)

## ✅ Estado de Implementación

| Componente | Estado | Nota |
|-----------|--------|------|
| Frontend validación | ✅ Completo | `validarCambiosCertificacion()` |
| Backend cambio (A→B) | ✅ Completo | Nuevo bloque else-if |
| Backend remoción (A→NULL) | ✅ Existente | Mantiene funcionalidad |
| Detalles actualización | ✅ Completo | Maneja ambos casos |
| Logs y debugging | ✅ Completo | Detallados con emojis |

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar transacción (BEGIN...COMMIT...ROLLBACK) para atomicidad
- [ ] Validar en backend también que clasificadores existan (defensa doble)
- [ ] Crear endpoint específico para validación pre-cambio
- [ ] Agregar auditoría de cambios (tabla de historial)

---

**Actualizado**: Hoy
**Status**: 🟢 Ready for Testing
