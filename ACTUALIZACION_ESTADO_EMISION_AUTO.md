# 📌 Actualización: Cambio Automático de Estado con CCP

## 🎯 Cambio Realizado

Se agregó lógica automática para que el **estado_emision** de un formato cambie automáticamente según si tiene o no un **CCP (certificación_id)**:

## 📋 Reglas Implementadas

### Caso 1: Asignar CCP (NULL → CCP)
```
Cuando: Un formato SIN certificación recibe una certificación
Antes:  estado_emision = 'BORRADOR', certificacion_id = NULL
Acción: Se asigna certificacion_id
Después: estado_emision = 'EMITIDO', certificacion_id = XX
```

**Logs en consola:**
```
📌 Se asignó CCP: null → 5, cambiando estado a EMITIDO
```

### Caso 2: Remover CCP (CCP → NULL)
```
Cuando: Un formato CON certificación se le quita la certificación
Antes:  estado_emision = 'EMITIDO', certificacion_id = 5
Acción: Se asigna certificacion_id = NULL
Después: estado_emision = 'BORRADOR', certificacion_id = NULL
```

**Logs en consola:**
```
📌 Se removió CCP: 5 → null, cambiando estado a BORRADOR
```

### Caso 3: Cambiar CCP (CCP A → CCP B)
```
Cuando: Un formato cambia de una certificación a otra
Antes:  estado_emision = 'EMITIDO', certificacion_id = 5
Acción: Se cambia a certificacion_id = 3
Después: estado_emision = 'EMITIDO', certificacion_id = 3
```

**Nota:** El estado se mantiene en EMITIDO (no cambia porque ambos son no-nulos)

## 🔧 Ubicación del Código

**Archivo:** `backend/controllers/formatoEmisionController.js`

**Función:** `actualizar()` (líneas ~233-243)

**Código:**
```javascript
// 🆕 LÓGICA DE ESTADO: Si se asigna certificación (NULL → valor), cambiar estado a EMITIDO
if (certificacion_anterior === null && certificacion_nueva !== null) {
  console.log(`📌 Se asignó CCP: ${certificacion_anterior} → ${certificacion_nueva}, cambiando estado a EMITIDO`);
  datosActualizacion.estado_emision = 'EMITIDO';
}
// 🆕 LÓGICA DE ESTADO: Si se remueve certificación (valor → NULL), cambiar estado a BORRADOR
else if (certificacion_anterior !== null && certificacion_nueva === null) {
  console.log(`📌 Se removió CCP: ${certificacion_anterior} → NULL, cambiando estado a BORRADOR`);
  datosActualizacion.estado_emision = 'BORRADOR';
}
```

## 🧪 Cómo Probar

### Prueba 1: Asignar CCP
1. Abre `GestionCertificacionesFormatos`
2. Busca un formato con estado **BORRADOR** y sin CCP
3. Haz clic en "Modificar"
4. Selecciona una Meta y luego un CCP
5. Haz clic en "Guardar"
6. **Resultado esperado:** Estado cambia a **EMITIDO**

### Prueba 2: Remover CCP
1. Abre `GestionCertificacionesFormatos`
2. Busca un formato con estado **EMITIDO** y con CCP
3. Haz clic en "Modificar"
4. Limpia el selector de CCP (déjalo vacío)
5. Haz clic en "Guardar"
6. **Resultado esperado:** Estado cambia a **BORRADOR**

### Prueba 3: Cambiar CCP (A → B)
1. Abre `GestionCertificacionesFormatos`
2. Busca un formato con estado **EMITIDO** y CCP = 5
3. Haz clic en "Modificar"
4. Cambia el CCP a otro valor (ej: 3)
5. Haz clic en "Guardar"
6. **Resultado esperado:** Estado se mantiene **EMITIDO**, CCP cambia a 3

## 📊 Matriz de Estados

| Antes | Cambio | Después | Nuevo Estado |
|-------|--------|---------|--------------|
| certificacion_id = NULL | → CCP_5 | certificacion_id = 5 | **EMITIDO** ✅ |
| certificacion_id = 5 | → NULL | certificacion_id = NULL | **BORRADOR** ✅ |
| certificacion_id = 5 | → CCP_3 | certificacion_id = 3 | **EMITIDO** (sin cambio) ✅ |
| certificacion_id = NULL | (sin cambio) | certificacion_id = NULL | BORRADOR (sin cambio) ✅ |
| certificacion_id = 5 | (sin cambio) | certificacion_id = 5 | EMITIDO (sin cambio) ✅ |

## 🔗 Integración con Frontend

La lógica del backend se aplica **automáticamente** cuando:
- El usuario selecciona un CCP en `GestionCertificacionesFormatos`
- El usuario remueve un CCP (deja vacío)
- El usuario cambia de CCP

**El frontend no necesita cambios** - el backend maneja toda la lógica.

## ✅ Consideraciones

1. **Solo el CCP dispara el cambio de estado**
   - Cambiar meta, lugar, fecha, etc. NO cambia el estado
   - Solo asignar/remover CCP dispara la lógica

2. **El estado se actualiza automáticamente**
   - No hay necesidad de un campo estado_emision en el formulario
   - Se calcula basado en el CCP

3. **Los logs son detallados**
   - Consola muestra exactamente qué cambió y por qué
   - Facilita debugging si hay problemas

4. **Transaccional**
   - El cambio de estado se aplica junto con otros cambios
   - Si falla algo, se revierte todo

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar indicador visual en tabla (badge que cambia color)
- [ ] Agregar confirmación al remover CCP ("¿Deseas pasar a BORRADOR?")
- [ ] Guardar historial de cambios de estado
- [ ] Alertar cuando un formato se pasa a BORRADOR

---

**Actualizado:** Hoy (31 de Marzo, 2026)
**Status:** 🟢 Ready for Testing
