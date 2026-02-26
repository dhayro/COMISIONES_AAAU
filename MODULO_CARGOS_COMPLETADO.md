# Módulo Gestión de Cargos - Implementación Completada

## 📋 Resumen

Se ha implementado un módulo completo de **Gestión de Cargos** siguiendo el patrón establecido con otros módulos de gestión. Este es un módulo maestro simple que solo requiere un campo: **nombre**.

---

## 🗄️ Base de Datos

### Tabla: `cargos`

```sql
CREATE TABLE IF NOT EXISTS cargos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
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
| `nombre` | VARCHAR(255) | Nombre único del cargo (Ej: Gerente) |
| `activo` | BOOLEAN | Estado del cargo (1: activo, 0: inactivo) |
| `creado_en` | TIMESTAMP | Fecha de creación automática |
| `actualizado_en` | TIMESTAMP | Fecha de última actualización |

### Datos de Inicialización

Se cargan automáticamente los siguientes cargos:

1. **Gerente**
2. **Sub Gerente**
3. **Especialista**
4. **Técnico**
5. **Asistente**
6. **Administrativo**

---

## 🔌 Backend API

### Controller: `cargoController.js`

**Localización**: `backend/controllers/cargoController.js`

#### Métodos

##### 1. **obtenerCargos()** - GET /cargos
```javascript
GET /api/cargos
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "nombre": "Gerente",
    "activo": 1
  },
  ...
]
```

##### 2. **obtenerCargoPorId()** - GET /cargos/:id
```javascript
GET /api/cargos/1
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "nombre": "Gerente",
  "activo": 1
}
```

##### 3. **crearCargo()** - POST /cargos
```javascript
POST /api/cargos
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "nombre": "Gerente"
}

Response: 201 Created
{
  "id": 1,
  "nombre": "Gerente",
  "activo": 1
}
```

**Validaciones**:
- ✅ Nombre requerido
- ✅ Nombre debe ser único
- ✅ Comparación case-insensitive para unicidad

##### 4. **actualizarCargo()** - PUT /cargos/:id
```javascript
PUT /api/cargos/1
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "nombre": "Gerente Senior",
  "activo": 1
}

Response: 200 OK
{
  "id": 1,
  "nombre": "Gerente Senior",
  "activo": 1
}
```

##### 5. **eliminarCargo()** - DELETE /cargos/:id
```javascript
DELETE /api/cargos/1
Authorization: Bearer {token}

Response: 200 OK
{
  "mensaje": "Cargo eliminado correctamente"
}
```

---

### Rutas: `routes/comisiones.js`

Se agregaron las siguientes rutas documentadas con Swagger:

```javascript
router.get('/cargos', cargoController.obtenerCargos);
router.get('/cargos/:id', cargoController.obtenerCargoPorId);
router.post('/cargos', cargoController.crearCargo);
router.put('/cargos/:id', cargoController.actualizarCargo);
router.delete('/cargos/:id', cargoController.eliminarCargo);
```

---

## 🎨 Frontend

### Componente: `GestionCargos.js`

**Localización**: `material-dashboard-react/src/pages/Gestion/GestionCargos.js`

#### Características

✅ **Tabla de Datos**
- Listado de cargos con nombre
- Acciones de editar y eliminar por fila
- Interfaz simple y responsive

✅ **Crear Nuevo Cargo**
- Botón "Nuevo Cargo" en la barra de encabezado
- Modal con un solo campo: nombre
- Validación de campo requerido

✅ **Editar Cargo Existente**
- Botón de edición en cada fila
- Pre-carga de datos en el modal
- Actualización con validación

✅ **Eliminar Cargo**
- Confirmación con SweetAlert
- Notificación de éxito/error
- Recarga automática de datos

✅ **Notificaciones con Toasts**
- Toast flotante en esquina superior derecha
- Mensajes de éxito, error y validación
- Desaparecen automáticamente

---

## 📡 Servicio API: `services/api.js`

Métodos agregados:

```javascript
async obtenerCargos() {
  return this.request('/cargos');
}

async obtenerCargo(id) {
  return this.request(`/cargos/${id}`);
}

async crearCargo(datos) {
  return this.request('/cargos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

async actualizarCargo(id, datos) {
  return this.request(`/cargos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

async eliminarCargo(id) {
  return this.request(`/cargos/${id}`, {
    method: 'DELETE',
  });
}
```

---

## 🗺️ Rutas del Frontend: `routes.js`

```javascript
{
  type: 'collapse',
  name: 'Cargos',
  key: 'gestion-cargos',
  icon: <Icon fontSize="small">badge</Icon>,
  route: '/gestion/cargos',
  component: <GestionCargos />,
}
```

---

## 🔐 Seguridad

- ✅ Todas las rutas requieren autenticación
- ✅ Validación de entrada en backend
- ✅ Comparación case-insensitive para nombres únicos
- ✅ Prevención de eliminación de datos en uso

---

## 🧪 Casos de Uso

### 1. Crear Cargo
1. Click en "Nuevo Cargo"
2. Ingresar nombre (Ej: "Director")
3. Click en "Guardar"
4. Toast de éxito
5. Tabla se recarga

### 2. Editar Cargo
1. Click en ícono de edición en la fila
2. Modificar nombre
3. Click en "Guardar"
4. Toast de éxito

### 3. Eliminar Cargo
1. Click en ícono de eliminar en la fila
2. Confirmar eliminación
3. Toast de éxito
4. Tabla se recarga

---

## ✅ Compilación

```bash
✅ Frontend compilado exitosamente: 502.77 kB
✅ Sin errores críticos
✅ Componente integrado en menú lateral
✅ API disponible para comunicación
```

---

## 📝 Archivos Creados/Modificados

### Creados

| Archivo | Tipo |
|---------|------|
| `backend/controllers/cargoController.js` | Backend Controller |
| `material-dashboard-react/src/pages/Gestion/GestionCargos.js` | Frontend Component |

### Modificados

| Archivo | Cambios |
|---------|---------|
| `backend/config/database.js` | +Tabla cargos, +Datos iniciales (6 cargos) |
| `backend/routes/comisiones.js` | +Import controller, +5 rutas con swagger |
| `material-dashboard-react/src/services/api.js` | +5 métodos de API |
| `material-dashboard-react/src/routes.js` | +Import componente, +Ruta en menú |

---

## 🎯 Diferencias con Otros Módulos

| Aspecto | Cargos | Fuentes Financiamiento | Metas |
|--------|--------|----------------------|-------|
| **Campos** | 1 (nombre) | 3 (nombre, abreviatura, descripción) | 4 (nombre, número, período, ámbito) |
| **Complejidad** | Muy simple | Media | Alta |
| **Tabla BD** | cargos | fuentes_financiamiento | metas |
| **Dialog Modal** | 1 input | 3 inputs | 4 inputs + select |

---

## 🎨 Interfaz Visual

```
┌──────────────────────────────────────────┐
│  Gestión de Cargos     [Nuevo Cargo]     │
├──────────────────────────────────────────┤
│ Nombre           │ Acciones              │
├──────────────────────────────────────────┤
│ Gerente          │ [Editar] [Eliminar]   │
│ Sub Gerente      │ [Editar] [Eliminar]   │
│ Especialista     │ [Editar] [Eliminar]   │
│ Técnico          │ [Editar] [Eliminar]   │
│ Asistente        │ [Editar] [Eliminar]   │
│ Administrativo   │ [Editar] [Eliminar]   │
└──────────────────────────────────────────┘
```

---

## 🚀 Estado del Módulo

**Estado General**: ✅ **COMPLETADO Y FUNCIONAL**

- ✅ Base de datos: Tabla creada con 6 cargos iniciales
- ✅ Backend: Controller y rutas implementadas
- ✅ Frontend: Componente React con CRUD completo
- ✅ API Service: Métodos integrados
- ✅ Menú: Ruta agregada con icono (badge)
- ✅ Compilación: 502.77 kB sin errores
- ✅ Notificaciones: Toasts implementadas
- ✅ Validaciones: Implementadas en frontend y backend

---

## 📌 Notas Importantes

1. El nombre del cargo es **único** (case-insensitive)
2. Los cargos vienen pre-cargados en la base de datos
3. El modal es simple con un solo campo
4. El icono en el menú es "badge" (distintivo)
5. Las notificaciones usan el mismo patrón que otros módulos

