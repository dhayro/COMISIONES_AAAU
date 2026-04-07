# 📋 MÓDULO GESTIÓN DE CERTIFICACIONES EN FORMATOS

## ✨ Descripción

Nuevo módulo administrativo para gestionar certificaciones en formatos emitidos.

**Ubicación:** `http://localhost:3000/gestion/certificaciones-formatos`

**Roles:** `admin` y `administrativo`

## 🎯 Características

### 1️⃣ **Carga de Formatos**
- Se carga desde la API externa: `http://172.10.9.11:5000/api/formatos-emisiones`
- **Filtrado por rol:**
  - ✅ **ADMIN**: Ve todos los formatos
  - ✅ **ADMINISTRATIVO**: Solo ve formatos de su ámbito

### 2️⃣ **Visualización en DataTable**
| Columna | Descripción |
|---------|-------------|
| Número | Número de documento del formato |
| Usuario | Nombre del comisionado |
| Ámbito | Ámbito/Dirección del usuario |
| Lugar | Lugar de la comisión |
| Fechas | Rango de fechas (salida - retorno) |
| Certificación | CCP del certificado asignado |
| Condición | Condición de evaluación |
| Estado | Estado del formato (BORRADOR, EMITIDO, etc) |
| Acciones | Botón para editar |

### 3️⃣ **Edición de Certificación**
Al hacer click en "Editar":

**Diálogo que muestra:**
- 📝 Información del formato (usuario, ámbito, fechas)
- 📋 **Condiciones de evaluación disponibles** (referencia informativa)
- 🎯 **Selector de Certificación (CCP)** - Campo editable
- 📌 **Selector de Condición de Evaluación** - Campo editable
- ✏️ Indicador de cambios detectados

### 4️⃣ **Lógica de Cambios**

**Tipos de cambios detectados:**
```javascript
const esCreacion = !selectedFormato.certificacion_id && formData.certificacion_id;
// Cuando: No había certificación → Se asigna una nueva

const esEdicion = selectedFormato.certificacion_id !== formData.certificacion_id;
// Cuando: Se cambia de certificación existente a otra

// Actualización de condición (sin cambiar certificación)
```

### 5️⃣ **Guardar Cambios**
- Envía PUT a `http://172.10.9.11:5000/api/formatos-emisiones/{id}`
- Payload:
```json
{
  "certificacion_id": <id_de_certificacion>,
  "condicion_evaluacion_id": <id_de_condicion>
}
```

## 📁 Archivos Creados/Modificados

### Nuevo:
- ✅ `material-dashboard-react/src/pages/Gestion/GestionCertificacionesFormatos.js`

### Modificados:
- ✅ `material-dashboard-react/src/routes.js` - Importación y rutas agregadas

## 🔐 Control de Acceso

| Rol | Acceso | Visualización |
|-----|--------|---------------|
| **admin** | ✅ Sí | Todos los formatos |
| **administrativo** | ✅ Sí | Solo su ámbito |
| **jefe** | ❌ No | - |
| **usuario** | ❌ No | - |

## 📊 Datos Cargados

### Al iniciar el módulo carga:
1. ✅ Formatos emitidos desde `http://172.10.9.11:5000/api/formatos-emisiones`
2. ✅ Certificaciones disponibles (`/api/certificaciones-credito`)
3. ✅ Condiciones de evaluación (`/api/condiciones-evaluacion`)

## 🎨 UI Components

- Material-UI (Card, Button, Dialog, Autocomplete, TextField)
- Material Dashboard 2 (MDBox, MDButton, MDTypography)
- DataTable personalizado
- SweetAlert2 para notificaciones

## 💾 Integración con Backend

### Endpoints utilizados:

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `http://172.10.9.11:5000/api/formatos-emisiones` | Cargar formatos |
| GET | `/api/certificaciones-credito` | Obtener certificaciones |
| GET | `/api/condiciones-evaluacion` | Obtener condiciones |
| PUT | `http://172.10.9.11:5000/api/formatos-emisiones/{id}` | Actualizar certificación |

## 🚀 Uso

1. Acceder a: `http://localhost:3000/gestion/certificaciones-formatos`
2. Ver listado de formatos en DataTable
3. Hacer click en "Editar" para modificar certificación y condición
4. Guardar cambios
5. Se recarga la tabla automáticamente

## ✅ Validaciones

- ✅ Detecta si es creación o edición de certificación
- ✅ Muestra condiciones de evaluación disponibles
- ✅ Alerta cuando hay cambios sin guardar
- ✅ Manejo de errores con SweetAlert2
- ✅ Filtrado por ámbito para administrativos
