# Módulo Gestión de Fuentes de Financiamiento - Implementación Completada

## 📋 Resumen del Desarrollo

Se ha implementado un módulo completo de **Gestión de Fuentes de Financiamiento** siguiendo el patrón establecido con otros módulos de gestión (Ambitos, Clasificadores, Metas). El módulo incluye funcionalidades de Create, Read, Update y Delete (CRUD).

---

## 🗄️ Base de Datos

### Tabla: `fuentes_financiamiento`

```sql
CREATE TABLE IF NOT EXISTS fuentes_financiamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  abreviatura VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | Identificador único (Primary Key) |
| `nombre` | VARCHAR(255) | Nombre único de la fuente (Ej: Recursos Ordinarios) |
| `abreviatura` | VARCHAR(50) | Abreviatura única (Ej: R.O) |
| `descripcion` | TEXT | Descripción opcional de la fuente |
| `activo` | BOOLEAN | Estado de la fuente (1: activo, 0: inactivo) |
| `creado_en` | TIMESTAMP | Fecha de creación automática |
| `actualizado_en` | TIMESTAMP | Fecha de última actualización |

### Datos de Inicialización

La base de datos se carga automáticamente con las siguientes fuentes:

1. **R.O** - Recursos Ordinarios (Ingresos ordinarios del estado)
2. **R.D.R** - Recursos Directamente Recaudados (Recursos generados por el organismo)
3. **DON** - Donaciones (Fondos de donaciones internacionales)
4. **C.P** - Crédito Público (Recursos por crédito público)

---

## 🔌 Backend API

### Controller: `fuenteFinanciamientoController.js`

**Localización**: `backend/controllers/fuenteFinanciamientoController.js`

#### Métodos Disponibles

##### 1. **obtenerFuentes()** - GET /fuentes-financiamiento
```javascript
// Obtiene todas las fuentes de financiamiento
// Retorna: Array de fuentes
GET /api/fuentes-financiamiento
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "nombre": "Recursos Ordinarios",
    "abreviatura": "R.O",
    "descripcion": "Ingresos ordinarios del estado",
    "activo": 1
  },
  ...
]
```

##### 2. **obtenerFuentePorId()** - GET /fuentes-financiamiento/:id
```javascript
// Obtiene una fuente específica por ID
GET /api/fuentes-financiamiento/1
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "nombre": "Recursos Ordinarios",
  "abreviatura": "R.O",
  "descripcion": "Ingresos ordinarios del estado",
  "activo": 1
}
```

##### 3. **crearFuente()** - POST /fuentes-financiamiento
```javascript
// Crea una nueva fuente de financiamiento
POST /api/fuentes-financiamiento
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "nombre": "Recursos Ordinarios",
  "abreviatura": "R.O",
  "descripcion": "Ingresos ordinarios del estado"
}

Response: 201 Created
{
  "id": 1,
  "nombre": "Recursos Ordinarios",
  "abreviatura": "R.O",
  "descripcion": "Ingresos ordinarios del estado",
  "activo": 1
}
```

**Validaciones**:
- ✅ Nombre requerido
- ✅ Abreviatura requerida
- ✅ Abreviatura debe ser única
- ✅ Abreviatura se convierte a mayúsculas automáticamente
- ✅ Error específico si la abreviatura ya existe

##### 4. **actualizarFuente()** - PUT /fuentes-financiamiento/:id
```javascript
// Actualiza una fuente de financiamiento existente
PUT /api/fuentes-financiamiento/1
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "nombre": "Recursos Ordinarios Mejorados",
  "abreviatura": "R.O",
  "descripcion": "Descripción actualizada",
  "activo": 1
}

Response: 200 OK
{
  "id": 1,
  "nombre": "Recursos Ordinarios Mejorados",
  "abreviatura": "R.O",
  "descripcion": "Descripción actualizada",
  "activo": 1
}
```

**Validaciones**:
- ✅ Verifica que la fuente exista
- ✅ Valida que la nueva abreviatura sea única (excepto la propia)
- ✅ Convierte abreviatura a mayúsculas

##### 5. **eliminarFuente()** - DELETE /fuentes-financiamiento/:id
```javascript
// Elimina una fuente de financiamiento
DELETE /api/fuentes-financiamiento/1
Authorization: Bearer {token}

Response: 200 OK
{
  "mensaje": "Fuente de financiamiento eliminada correctamente"
}
```

**Validaciones**:
- ✅ Verifica que la fuente exista
- ✅ Previene eliminación si está siendo usada en otras tablas

---

### Rutas: `routes/comisiones.js`

Se agregaron las siguientes rutas documentadas con Swagger:

```javascript
// Importación del controller
const fuenteFinanciamientoController = require('../controllers/fuenteFinanciamientoController');

// Rutas implementadas
router.get('/fuentes-financiamiento', fuenteFinanciamientoController.obtenerFuentes);
router.get('/fuentes-financiamiento/:id', fuenteFinanciamientoController.obtenerFuentePorId);
router.post('/fuentes-financiamiento', fuenteFinanciamientoController.crearFuente);
router.put('/fuentes-financiamiento/:id', fuenteFinanciamientoController.actualizarFuente);
router.delete('/fuentes-financiamiento/:id', fuenteFinanciamientoController.eliminarFuente);
```

---

## 🎨 Frontend

### Componente: `GestionFuentesFinanciamiento.js`

**Localización**: `material-dashboard-react/src/pages/Gestion/GestionFuentesFinanciamiento.js`

#### Características

✅ **Tabla de Datos**
- Listado de todas las fuentes con nombre, abreviatura y descripción
- Acciones de editar y eliminar por fila
- Interfaz responsive

✅ **Crear Nueva Fuente**
- Botón "Nueva Fuente" en la barra de encabezado
- Modal con campos: nombre, abreviatura, descripción
- Validación de campos requeridos

✅ **Editar Fuente Existente**
- Botón de edición en cada fila
- Pre-carga de datos en el modal
- Actualización con validación

✅ **Eliminar Fuente**
- Confirmación con SweetAlert
- Notificación de éxito/error
- Recarga automática de datos

✅ **Notificaciones con Toasts**
- Mensaje de éxito al crear
- Mensaje de éxito al actualizar
- Mensaje de éxito al eliminar
- Mensajes de error con detalles
- Mensajes de validación de campos
- Toasts flotantes en esquina superior derecha

#### Estado y Funciones Principales

```javascript
// Estado
const [fuentes, setFuentes] = useState([]);           // Lista de fuentes
const [loading, setLoading] = useState(false);         // Indicador de carga
const [openDialog, setOpenDialog] = useState(false);   // Control del modal
const [editingId, setEditingId] = useState(null);      // ID de edición
const [formData, setFormData] = useState({
  nombre: '',
  abreviatura: '',
  descripcion: '',
});

// Funciones
- cargarDatos()              // Obtiene fuentes del API
- handleOpenDialog()         // Abre modal (create/edit)
- handleCloseDialog()        // Cierra modal
- handleInputChange()        // Captura cambios en inputs
- handleGuardar()            // Crea o actualiza fuente
- handleEliminar()           // Elimina fuente
```

#### Interfaz Visual

```
┌─────────────────────────────────────────────────────┐
│  Gestión de Fuentes de Financiamiento    [Nueva]    │
├─────────────────────────────────────────────────────┤
│ Nombre         │ Abreviatura │ Descripción │ Acciones│
├─────────────────────────────────────────────────────┤
│ Recursos Ordin │ R.O        │ Ingresos... │ [E] [X] │
│ Recursos Direc │ R.D.R      │ Recursos... │ [E] [X] │
│ Donaciones     │ DON        │ Fondos...   │ [E] [X] │
│ Crédito Público│ C.P        │ Recursos... │ [E] [X] │
└─────────────────────────────────────────────────────┘
```

---

## 📡 Servicio API: `services/api.js`

Se agregaron los siguientes métodos al servicio API del frontend:

```javascript
// Obtener todas las fuentes
async obtenerFuentesFinanciamiento() {
  return this.request('/fuentes-financiamiento');
}

// Obtener una fuente por ID
async obtenerFuenteFinanciamiento(id) {
  return this.request(`/fuentes-financiamiento/${id}`);
}

// Crear nueva fuente
async crearFuenteFinanciamiento(datos) {
  return this.request('/fuentes-financiamiento', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

// Actualizar fuente existente
async actualizarFuenteFinanciamiento(id, datos) {
  return this.request(`/fuentes-financiamiento/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

// Eliminar fuente
async eliminarFuenteFinanciamiento(id) {
  return this.request(`/fuentes-financiamiento/${id}`, {
    method: 'DELETE',
  });
}
```

---

## 🗺️ Rutas del Frontend: `routes.js`

Se agregó la nueva ruta en el menú lateral:

```javascript
// Importación
import GestionFuentesFinanciamiento from 'pages/Gestion/GestionFuentesFinanciamiento';

// Ruta en el menú
{
  type: 'collapse',
  name: 'Fuentes de Financiamiento',
  key: 'gestion-fuentes-financiamiento',
  icon: <Icon fontSize="small">attach_money</Icon>,
  route: '/gestion/fuentes-financiamiento',
  component: <GestionFuentesFinanciamiento />,
}
```

---

## 🔐 Seguridad

- ✅ Todas las rutas requieren autenticación (Bearer Token)
- ✅ Validación de entrada en el backend
- ✅ Manejo seguro de eliminaciones (verificación de existencia)
- ✅ Prevención de eliminación de datos en uso
- ✅ Conversión automática a mayúsculas para abreviatura (normalización)

---

## 🧪 Casos de Uso

### 1. Crear Fuente de Financiamiento

1. Click en "Nueva Fuente"
2. Completar formulario:
   - Nombre: "Recursos Ordinarios"
   - Abreviatura: "R.O"
   - Descripción: "Ingresos ordinarios del estado"
3. Click en "Guardar"
4. Toast de éxito: "Fuente creada"
5. Tabla se recarga automáticamente

### 2. Editar Fuente Existente

1. Click en ícono de edición (lápiz) en la fila
2. Modal abre con datos pre-cargados
3. Modificar campos necesarios
4. Click en "Guardar"
5. Toast de éxito: "Fuente actualizada"
6. Tabla se recarga

### 3. Eliminar Fuente

1. Click en ícono de eliminar (papelera) en la fila
2. Confirmar eliminación en diálogo de confirmación
3. Toast de éxito: "Fuente eliminada"
4. Tabla se recarga

### 4. Ver Listado de Fuentes

1. Navegar a "Fuentes de Financiamiento" en el menú lateral
2. Se carga automáticamente el listado completo
3. Mostrador de datos en tabla con sorting

---

## 📊 Comparativa con Otros Módulos

| Aspecto | Fuentes Financiamiento | Metas | Clasificadores |
|--------|----------------------|-------|-----------------|
| **Tabla BD** | fuentes_financiamiento | metas | clasificadores |
| **Controller** | fuenteFinanciamientoController | metaController | clasificadorController |
| **API Endpoints** | /fuentes-financiamiento | /metas | /clasificadores |
| **Campos** | nombre, abreviatura, descripción | nombre, numero, periodo, ambito | nombre, partida |
| **Notificaciones** | Toasts (Swal.fire) | Toasts (Swal.fire) | Alerts (Material) |
| **Modal** | Material Dialog | Material Dialog | Material Dialog |
| **Validación** | Nombre, Abreviatura | Nombre, Número, Período | Nombre, Partida |

---

## ✅ Compilación

```bash
✅ Frontend compilado exitosamente: 502.4 kB
✅ Sin errores críticos
✅ Componente integrado en menú lateral
✅ API disponible para comunicación backend
```

---

## 📝 Archivos Creados/Modificados

### Creados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `backend/controllers/fuenteFinanciamientoController.js` | Backend | Controller CRUD |
| `material-dashboard-react/src/pages/Gestion/GestionFuentesFinanciamiento.js` | Frontend | Componente React |

### Modificados

| Archivo | Cambios |
|---------|---------|
| `backend/config/database.js` | +Tabla fuentes_financiamiento, +Datos iniciales |
| `backend/routes/comisiones.js` | +Import controller, +5 rutas con swagger |
| `material-dashboard-react/src/services/api.js` | +5 métodos de API |
| `material-dashboard-react/src/routes.js` | +Import componente, +Ruta en menú |

---

## 🔍 Patrón Arquitectónico Seguido

El módulo sigue el patrón MVC establecido en la aplicación:

```
Request HTTP
    ↓
[Frontend Component]  - GestionFuentesFinanciamiento.js
    ↓
[API Service]         - api.js métodos específicos
    ↓
[Backend Routes]      - /fuentes-financiamiento endpoints
    ↓
[Controller]          - fuenteFinanciamientoController.js
    ↓
[Database]            - fuentes_financiamiento table
    ↓
Response + Toast
```

---

## 🎯 Estado del Módulo

**Estado General**: ✅ **COMPLETADO Y FUNCIONAL**

- ✅ Base de datos: Tabla creada con datos iniciales
- ✅ Backend: Controller y rutas implementadas
- ✅ Frontend: Componente React con CRUD completo
- ✅ API Service: Métodos integrados
- ✅ Menú: Ruta agregada con icono
- ✅ Compilación: Sin errores
- ✅ Notificaciones: Toasts implementadas
- ✅ Validaciones: Implementadas en frontend y backend

---

## 🚀 Próximos Pasos (Opcionales)

1. Integrar fuentes_financiamiento en tabla de comisiones (si aplica)
2. Agregar filtros por estado activo/inactivo
3. Exportar datos a Excel/PDF
4. Agregar permisos por rol (solo administrador crea/edita)
5. Agregar auditoría de cambios

