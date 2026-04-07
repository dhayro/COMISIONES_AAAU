# 🎯 Implementación: Control de Duplicación de Formatos

## 📋 Resumen
Se implementó un sistema para **controlar la creación de formatos duplicados** y permitir la **modificación de formatos existentes**.

### Antes:
- ❌ Se podía crear múltiples formatos para la misma comisión + usuario
- ❌ No había forma de modificar un formato una vez creado
- ❌ Los detalles no se guardaban en `formato_emisiones_detalles`

### Ahora:
- ✅ Solo se permite **1 formato por comisión + usuario**
- ✅ Las comisiones ya emitidas muestran botón **"✏️ Modificar"**
- ✅ Las comisiones sin formato muestran botón **"📝 Emitir"**
- ✅ Los detalles se guardan correctamente en `formato_emisiones_detalles`

---

## 🔧 Cambios Realizados

### 1️⃣ **Backend - Controlador** (`formatoEmisionController.js`)

#### ✅ Método `crear()` - MEJORADO
```javascript
// ANTES: No verificaba duplicados, no guardaba detalles
// AHORA:
- Verifica si ya existe formato para comision_id + usuario_id
- Si existe y no está ANULADO → rechaza con error 400
- Recibe array de detalles en req.body
- Guarda cada detalle en formato_emisiones_detalles
- Retorna cantidad de detalles guardados
```

#### ✅ Método `actualizar()` - COMPLETAMENTE REESCRITO
```javascript
// ANTES: Solo actualizaba 7 campos básicos
// AHORA:
- Actualiza TODOS los campos del formato
- Elimina detalles previos
- Inserta los nuevos detalles
- Maneja correctamente null para campos opcionales
```

### 2️⃣ **Backend - Modelo** (`FormatoEmision.js`)

#### ✅ Método `actualizar()` - DINÁMICO
```javascript
// Ahora construye UPDATE dinámicamente
// Solo actualiza campos que vienen en el objeto
// Soporta todos estos campos:
- comision_id, usuario_id, costo_viaje_id, meta_id
- lugar, ruta, modalidad_viaje, fecha_salida, fecha_retorno
- num_dias, numero_siaf, codigo_cp, tipo_emision, costo_xdia
- monto_total, observacion, estado_emision
```

### 3️⃣ **Frontend - Component** (`EmisionFormatos.js`)

#### ✅ Función `cargarComisiones()` - CON VERIFICACIÓN
```javascript
// NUEVO:
- Carga lista de comisiones
- Consulta formatos existentes
- Mapea cada comisión con su formato (si existe)
- Agrega propiedades:
  - formato_existente: objeto del formato o null
  - tiene_formato: boolean para facilitar lógica
```

#### ✅ Función `handleAbrirModalModificarFormato()` - NUEVA
```javascript
// Carga un formato existente
// Obtiene detalles del formato
// Pre-carga el formulario con datos del formato
// Marca en sessionStorage que estamos en modo "MODIFICACIÓN"
```

#### ✅ Función `handleCrearFormatoEmision()` - MEJORADA
```javascript
// Detecta si estamos en modo modificación
// Si es CREACIÓN:
  - Valida que no exista formato previo
  - Genera número_documento único
  - Obtiene fecha_emision actual
// Si es MODIFICACIÓN:
  - NO valida duplicados (ya sabemos que existe)
  - NO genera número_documento ni fecha
  - Actualiza con api.actualizarFormatoEmision()
  
// Al guardar detalles, calcula monto_total correctamente
```

#### ✅ Columna "Acciones" - CONDICIONAL
```javascript
// Si tiene_formato === true → Botón "✏️ Modificar" (color warning)
// Si tiene_formato === false → Botón "📝 Emitir" (color info)
```

---

## 📊 Flujo de Datos

### 🆕 Creación de Formato (Nueva Comisión)
```
1. Usuario ve tabla con comisiones sin formato
2. Hace clic en "📝 Emitir"
3. Se abre modal con campos vacíos
4. Llena datos y detalles
5. Hace clic en "✅ Emitir"
6. Sistema valida que NO exista formato previo
7. API crea formato con detalles
8. Se guardan automáticamente en formato_emisiones_detalles
9. Modal se cierra y tabla se recarga
```

### 🔄 Modificación de Formato (Comisión Existente)
```
1. Usuario ve tabla con comisiones que YA tienen formato
2. Botón muestra "✏️ Modificar" en lugar de "📝 Emitir"
3. Hace clic en "✏️ Modificar"
4. Sistema carga formato existente
5. Modal se abre con datos PRE-CARGADOS
6. Usuario edita datos y/o detalles
7. Hace clic en "✅ Emitir" (mismo botón)
8. Sistema detecta modo modificación (via sessionStorage)
9. API ACTUALIZA formato existente
10. Elimina detalles previos
11. Inserta nuevos detalles
12. Modal se cierra y tabla se recarga
```

---

## 🔐 Validaciones

### Frontend
1. ✅ **Duplicados al crear**: Valida antes de mostrar modal
2. ✅ **Detalles requeridos**: Al menos 1 detalle
3. ✅ **Saldo disponible**: No permite sobreasignar presupuesto

### Backend
1. ✅ **Duplicados**: Rechaza si existe formato activo para comision_id + usuario_id
2. ✅ **Integridad**: Elimina detalles previos antes de insertar nuevos
3. ✅ **Campos obligatorios**: comision_id, usuario_id, numero_documento

---

## 📁 Archivos Modificados

```
✅ backend/controllers/formatoEmisionController.js
   - Mejorado método crear()
   - Completamente reescrito método actualizar()

✅ backend/models/FormatoEmision.js
   - Método actualizar() ahora es dinámico y soporta todos campos

✅ material-dashboard-react/src/pages/Gestion/EmisionFormatos.js
   - Mejorado cargarComisiones() con verificación de formatos
   - Nueva función handleAbrirModalModificarFormato()
   - Mejorado handleCrearFormatoEmision() para soportar ambos modos
   - Columna Acciones ahora es condicional
```

---

## ✨ Características Principales

| Característica | Antes | Ahora |
|---|---|---|
| Duplicados permitidos | ❌ Sí | ✅ No |
| Poder modificar | ❌ No | ✅ Sí |
| Guardar detalles | ❌ No | ✅ Sí |
| Mostrar si existe | ❌ No | ✅ Sí |
| Botones contextuales | ❌ No | ✅ Sí |

---

## 🚀 Cómo Usar

### Para Usuario - Crear Formato
1. Ir a "Emisión de Formatos"
2. Buscar comisión sin formato
3. Hacer clic en **"📝 Emitir"**
4. Llenar datos
5. Agregar detalles por clasificador
6. Hacer clic en **"✅ Emitir"**

### Para Usuario - Modificar Formato
1. Ir a "Emisión de Formatos"
2. Buscar comisión CON formato (verá **"✏️ Modificar"**)
3. Hacer clic en **"✏️ Modificar"**
4. Editar datos según necesidad
5. Editar detalles si es necesario
6. Hacer clic en **"✅ Emitir"** para guardar cambios

---

## 🔍 Troubleshooting

### Problema: No aparecen comisiones con formato
**Solución**: Actualizar página (F5) o ir a otra sección y volver

### Problema: Botón no cambia de "Emitir" a "Modificar"
**Solución**: Backend puede no estar retornando datos de formato. Verificar:
```bash
GET /api/formatos-emisiones
```

### Problema: Detalles no se guardan
**Solución**: Verificar que tabla `formato_emisiones_detalles` exista y tenga estructura:
```sql
- id (INT)
- formato_emision_id (INT)
- clasificador_id (INT)
- monto (DECIMAL)
```

---

## 📝 Notas

- El sessionStorage se usa para marcar modo modificación (se limpia automáticamente)
- Los detalles se cargan desde `formato_emisiones_detalles` cuando se abre modal
- Los formatos ANULADOS no se cuentan como "existentes" para duplicación
- El monto_total se calcula automáticamente sumando detalles

