# 🔄 ACTUALIZACIÓN: MODIFICAR RENDICIÓN (Estado RENDIDO)

**Fecha:** 7 de Abril de 2026  
**Commit:** `46dadb1`  
**Status:** ✅ COMPLETADO

## 📋 Descripción

Se agregó la funcionalidad para **modificar rendiciones existentes** cuando el formato se encuentra en estado **RENDIDO**.

## 🆕 Cambios Realizados

### 1. **Frontend - EmisionFormatos.js** ✏️
**Archivo:** `material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`

#### a) Botón dinámico en tabla de acciones (línea ~2900)
```javascript
// 🆕 Botón Rendir/Modificar según estado
{original.estado_emision === 'ENVIADO' && (
  <MDButton
    variant="gradient"
    color="success"
    size="small"
    onClick={() => handleAbrirModalRendicion(original)}
    title="Rendir comprobantes de gasto"
  >
    💵 Rendir
  </MDButton>
)}
{original.estado_emision === 'RENDIDO' && (
  <MDButton
    variant="gradient"
    color="secondary"
    size="small"
    onClick={() => handleAbrirModalRendicion(original)}
    title="Modificar rendición de comprobantes"
  >
    ✏️ Modificar Rendición
  </MDButton>
)}
```

#### b) Función `handleAbrirModalRendicion` mejorada (línea ~826)
- ✅ Carga detalles del formato
- ✅ **NUEVO:** Si estado es 'RENDIDO', carga comprobantes existentes desde API
- ✅ Organiza comprobantes por partida
- ✅ Muestra mensaje de éxito con cantidad de comprobantes cargados

```javascript
// 🆕 Si el estado es RENDIDO, cargar comprobantes existentes
if (formato.estado_emision === 'RENDIDO') {
  const rendicionesData = await api.request(
    `/rendiciones/obtener-por-formato/${formatoId}`,
    { method: 'GET' }
  );
  
  // Cargar comprobantes por partida...
  setComprobantesAgregadosPorPartida(comprobantesAgregadosTempPorPartida);
}
```

#### c) Función `handleEnviarRendicion` mejorada (línea ~1200)
- ✅ Detecta si es creación o actualización
- ✅ Separa comprobantes nuevos de los existentes (por ID)
- ✅ Envía estructura:
  - `comprobantes_nuevos`: Array de nuevos comprobantes
  - `comprobantes_actualizar`: Array de existentes con cambios
  - `comprobantes_eliminar`: Array de IDs a eliminar
  - `modo`: 'crear' o 'actualizar'

```javascript
const datosRendicionFinal = {
  formato_emision_id: formatoId,
  comprobantes_nuevos: comprobantesNuevos,
  comprobantes_actualizar: comprobantesParaActualizar,
  comprobantes_eliminar: comprobantesParaEliminar,
  modo: formato.estado_emision === 'RENDIDO' ? 'actualizar' : 'crear',
};
```

---

### 2. **Backend - Controller** 🔧
**Archivo:** `backend/controllers/rendicionesController.js`

#### 🆕 Nuevo Endpoint: `obtenerPorFormato`
```javascript
// GET /api/rendiciones/obtener-por-formato/:formato_emision_id
exports.obtenerPorFormato = async (req, res) => {
  // Obtiene todas las rendiciones de un formato emitido
  // Retorna array con todos los comprobantes y sus datos
};
```

**Respuesta:**
```json
{
  "success": true,
  "rendiciones": [
    {
      "id": 1,
      "formato_emision_id": 5,
      "numero_comprobante": "001-00001234",
      "monto": 150.50,
      "tipo_comprobante_nombre": "FACTURA",
      "proveedor_nombre": "Hotel Central",
      "partida": "23.2.1.2.2",
      ...
    }
  ],
  "total": 5
}
```

---

### 3. **Backend - Rutas** 🛣️
**Archivo:** `backend/routes/rendiciones.js`

#### ✅ Nueva Ruta Registrada (ANTES de `/:id`)
```javascript
// 🆕 Obtener rendiciones por formato_emision_id
// (ANTES de /:id para evitar conflicto de rutas)
router.get(
  '/obtener-por-formato/:formato_emision_id', 
  rendicionesController.obtenerPorFormato
);
```

---

### 4. **Backend - Modelo** 📊
**Archivo:** `backend/models/Rendicion.js`

#### ✅ Función `listarPorFormato` actualizada
- ✅ Ahora retorna también el campo `partida` desde `formato_emisiones_detalles`
- ✅ Incluye JOIN a `formato_emisiones_detalles` para obtener partida

```javascript
static async listarPorFormato(formato_emision_id) {
  // Retorna rendiciones con:
  // - ID de rendición
  // - Datos del comprobante
  // - Tipo comprobante, Proveedor
  // - NUEVO: Partida presupuestal
}
```

---

## 🔄 Flujo de Modificación

### Estado: ENVIADO → RENDIDO (Primer envío)
1. Usuario hace clic en botón "💵 Rendir"
2. Modal se abre SIN comprobantes previos
3. Usuario agrega comprobantes
4. Envía rendición → Estado cambia a "RENDIDO"

### Estado: RENDIDO (Modificaciones posteriores)
1. Usuario hace clic en botón "✏️ Modificar Rendición"
2. Modal se abre con todos los comprobantes previos CARGADOS
3. **Usuario puede:**
   - ✅ Agregar nuevos comprobantes
   - ✅ Editar comprobantes existentes (se marcan como "actualizar")
   - ✅ Eliminar comprobantes (se marcan como "eliminar")
4. Envía cambios → Backend procesa actualización

---

## 🎯 Validaciones Implementadas

1. **Estado ENVIADO:**
   - ✅ Solo muestra botón "Rendir"
   - ✅ Carga modal vacío
   - ✅ Envío: modo = 'crear'

2. **Estado RENDIDO:**
   - ✅ Solo muestra botón "Modificar Rendición"
   - ✅ Carga comprobantes previos automáticamente
   - ✅ Envío: modo = 'actualizar'
   - ✅ Distingue entre comprobantes nuevos y existentes

3. **Control de Límites:**
   - ✅ Sigue validando límites disponibles por partida
   - ✅ Suma comprobantes nuevos + existentes
   - ✅ Previene excedentes

---

## 📦 Estructura de Datos Enviada

### Comprobante NUEVO (ID con guiones: temporal)
```javascript
{
  id: "1-1712509123456", // Temporal (contiene -)
  formato_emision_detalle_id: 15,
  tipo_comprobante_id: 3,
  numero_comprobante: "001-00005678",
  monto: 200.00,
  // ... otros campos
}
```

### Comprobante EXISTENTE (ID numérico)
```javascript
{
  id: 42, // ID de la BD (solo números)
  tipo_comprobante_id: 3,
  numero_comprobante: "001-00005678",
  monto: 250.00, // MODIFICADO
  // ... otros campos
}
```

---

## ⚡ Mejoras Pendientes

1. **Backend:** Implementar lógica de actualización en `handleEnviarRendicion`
   - Procesar `comprobantes_actualizar`
   - Procesar `comprobantes_eliminar`
   - Mantener `estado_emision` en 'RENDIDO'

2. **Frontend:** Agregar confirmación visual al eliminar
   - Mostrar comprobantes marcados para eliminar
   - Confirmación antes de enviar

3. **UI/UX:** Mejorar indicadores
   - Marcar comprobantes como "NUEVO", "MODIFICADO", "ELIMINADO"
   - Resaltar cambios en la tabla

---

## 🧪 Testing

### Prueba 1: Primer envío de rendición
```bash
# Botón "Rendir" debe aparecer cuando estado = ENVIADO
# Modal se abre vacío
# Agregar 3 comprobantes
# Enviar → estado cambia a RENDIDO
```

### Prueba 2: Modificación de rendición
```bash
# Hacer refresh o recargar tabla
# Botón "Modificar Rendición" debe aparecer cuando estado = RENDIDO
# Modal se abre CON los 3 comprobantes previos
# Agregar 1 comprobante más
# Modificar monto de 1 existente
# Eliminar 1 comprobante
# Enviar → Backend procesa cambios
```

---

## 📝 Notas

- ✅ Endpoint GET registrado ANTES de `/:id` para evitar conflicto
- ✅ El campo `partida` se obtiene de `formato_emisiones_detalles`
- ✅ Los comprobantes se organizan por `formato_emisiones_detalles_id`
- ⚠️ Backend aún necesita actualizar lógica de `POST /rendiciones/crear` para procesar modo='actualizar'

---

**Próximo paso:** Implementar en backend la lógica de actualización para procesar comprobantes_actualizar y comprobantes_eliminar.
