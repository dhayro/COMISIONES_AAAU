# 📋 Módulos de Gestión - Frontend

## Descripción General

Los módulos de gestión proporcionan una interfaz completa para administrar todos los componentes del sistema de comisiones de servicio:

- **Gestión de Comisiones**: Crear, editar, listar y eliminar comisiones de servicio
- **Gestión de Ámbitos**: Administrar los ámbitos administrativos
- **Gestión de Clasificadores**: Administrar las partidas presupuestales
- **Gestión de Usuarios**: Administrar usuarios del sistema

## Estructura de Carpetas

```
src/pages/Gestion/
├── GestionComisiones.js      # Módulo principal de comisiones
├── GestionAmbitos.js         # Módulo de gestión de ámbitos
├── GestionClasificadores.js  # Módulo de gestión de clasificadores
├── GestionUsuarios.js        # Módulo de gestión de usuarios
└── index.js                  # Exportador de módulos
```

## Características Comunes

### 1. **Tabla de Datos**

- Visualización de registros en tabla paginada
- Ordenamiento y filtrado
- Paginación configurable (5, 10, 25 registros por página)

### 2. **Operaciones CRUD**

- **Crear**: Botón "Nuevo" en el header
- **Leer**: Tabla con todos los registros
- **Actualizar**: Icono de editar en cada fila
- **Eliminar**: Icono de eliminar con confirmación

### 3. **Diálogos Modal**

- Formularios reactivos para crear/editar
- Validaciones en tiempo real
- Mensajes de error y éxito

### 4. **Estado y Carga**

- Indicadores de carga (CircularProgress)
- Manejo de errores con alerts
- Mensajes de éxito tras operaciones

## Módulos Detallados

### GestionComisiones

**Funcionalidades:**

- Listar todas las comisiones con filtro por estado
- Ver detalles de comisión
- Editar comisión
- Eliminar comisión
- Estadísticas (Total, Activas, Monto Total, Promedio)

**Columnas:**

- ID
- Lugar
- Ámbito
- Ruta
- Monto Total
- Días
- Estado (activa, finalizada, cancelada)
- Acciones (Ver, Editar, Eliminar)

**Estados de Comisión:**

- `activa`: Comisión en curso
- `finalizada`: Comisión completada
- `cancelada`: Comisión cancelada

**Estadísticas Mostradas:**

```
┌─────────────────────────────────────────┐
│ Total de Comisiones    │ Comisiones Activas │
│ Monto Total            │ Promedio por Comisión │
└─────────────────────────────────────────┘
```

### GestionAmbitos

**Funcionalidades:**

- CRUD completo de ámbitos
- Indicador de estado (Activo/Inactivo)
- Tabla paginada

**Campos:**

- `nombre`: Nombre del ámbito (único)
- `activo`: Estado del registro

**Ejemplos:**

```
- ALA PUCALLPA
- ALA ATALAYA
- ALA TARMA
- ALA PERENE
```

### GestionClasificadores

**Funcionalidades:**

- CRUD completo de clasificadores
- Validación de partida única
- Campo de descripción para detalles

**Campos:**

- `partida`: Código de partida presupuestal (único, no editable)
- `nombre`: Nombre descriptivo
- `descripcion`: Descripción detallada (opcional)
- `activo`: Estado del registro

**Ejemplos:**

```
Partida: 23.2.1.2.2
Nombre: PASAJES Y GASTOS DE TRANSPORTE
Descripción: Gastos de transporte y pasajes entre localidades
```

### GestionUsuarios

**Funcionalidades:**

- CRUD de usuarios
- Asignación de roles (admin, usuario)
- Indicadores de estado

**Campos:**

- `username`: Usuario único para login (no editable)
- `email`: Correo electrónico
- `nombre`: Nombre completo
- `rol`: admin o usuario
- `activo`: Estado del usuario

**Roles:**

- `admin`: Acceso total al sistema
- `usuario`: Acceso limitado según permisos

## Endpoints API Utilizados

### Comisiones

```
GET    /api/comisiones              → Obtener todas
POST   /api/comisiones              → Crear nueva
GET    /api/comisiones/:id          → Obtener por ID
PUT    /api/comisiones/:id          → Actualizar
DELETE /api/comisiones/:id          → Eliminar
```

### Ámbitos

```
GET    /api/ambitos                 → Obtener todas
POST   /api/ambitos                 → Crear nueva
GET    /api/ambitos/:id             → Obtener por ID
PUT    /api/ambitos/:id             → Actualizar
DELETE /api/ambitos/:id             → Eliminar
```

### Clasificadores

```
GET    /api/clasificadores          → Obtener todas
POST   /api/clasificadores          → Crear nuevo
GET    /api/clasificadores/:id      → Obtener por ID
PUT    /api/clasificadores/:id      → Actualizar
DELETE /api/clasificadores/:id      → Eliminar
```

### Usuarios

```
GET    /api/usuarios/activos        → Obtener usuarios activos
GET    /api/usuarios/:id            → Obtener por ID
POST   /api/auth/registrar          → Crear nuevo usuario
```

## Integración en App.js

Los módulos se integran automáticamente en el enrutador de la aplicación a través del archivo `routes.js`:

```javascript
// En routes.js
import {
  GestionComisiones,
  GestionAmbitos,
  GestionClasificadores,
  GestionUsuarios,
} from 'pages/Gestion';

const routes = [
  // ... rutas existentes
  {
    type: 'title',
    title: 'Gestión',
    key: 'gestion-title',
  },
  {
    type: 'collapse',
    name: 'Comisiones',
    key: 'gestion-comisiones',
    icon: <Icon fontSize="small">assignment</Icon>,
    route: '/gestion/comisiones',
    component: <GestionComisiones />,
  },
  // ... más rutas de gestión
];
```

## Navegación en Sidenav

Los módulos aparecen en el menú lateral bajo la sección "Gestión":

```
📊 Dashboard
┌─ GESTIÓN
├─ Comisiones      (/gestion/comisiones)
├─ Ámbitos         (/gestion/ambitos)
├─ Clasificadores  (/gestion/clasificadores)
└─ Usuarios        (/gestion/usuarios)
└─ OTROS
  ├─ Tables
  ├─ Billing
  └─ ...
```

## Flujos de Trabajo

### Crear Registro

```
1. Click en "Nuevo" → Se abre Dialog
2. Completar formulario → Validación en tiempo real
3. Click en "Guardar" → Envío a API
4. Mensaje de éxito → Tabla se actualiza automáticamente
```

### Editar Registro

```
1. Click en ícono Editar → Se abre Dialog con datos
2. Modificar campos necesarios
3. Click en "Guardar" → Envío a API (PUT)
4. Tabla se recarga automáticamente
```

### Eliminar Registro

```
1. Click en ícono Eliminar
2. Confirmación en popup
3. Envío DELETE a API
4. Tabla se recarga automáticamente
```

## Componentes Material-UI Utilizados

- `Card`, `CardContent`, `CardHeader`: Contenedores principales
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableRow`: Tablas
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`: Formularios modales
- `TextField`, `Select`, `MenuItem`: Inputs
- `Button`, `IconButton`: Botones
- `Chip`: Etiquetas de estado
- `Alert`: Mensajes de error/éxito
- `CircularProgress`: Indicador de carga
- `TablePagination`: Control de paginación
- `Grid`: Layout responsivo

## Iconos Utilizados

```javascript
import AddIcon from '@mui/icons-material/Add'; // Nuevo
import EditIcon from '@mui/icons-material/Edit'; // Editar
import DeleteIcon from '@mui/icons-material/Delete'; // Eliminar
import EyeIcon from '@mui/icons-material/Visibility'; // Ver
```

## Validaciones

### GestionAmbitos

- ✓ Campo nombre requerido y no vacío
- ✓ Nombre único en base de datos

### GestionClasificadores

- ✓ Partida requerida y única (no editable al actualizar)
- ✓ Nombre requerido
- ✓ Descripción opcional

### GestionUsuarios

- ✓ Usuario requerido y único (no editable)
- ✓ Email requerido
- ✓ Nombre requerido
- ✓ Rol requerido

### GestionComisiones

- ✓ Filtrado por estado
- ✓ Cálculo automático de estadísticas
- ✓ Formateo de moneda (Soles PEN)

## Estilos y Tema

- Tema Material Dashboard React (Material-UI)
- Colores consistentes:
  - Info (azul): Acciones principales
  - Success (verde): Registros activos
  - Error (rojo): Eliminar/Cancelar
  - Warning (naranja): Administrador
- Tablas con:
  - Header gris (#f5f5f5)
  - Hover en filas
  - Chips para estados
  - Iconos pequeños para acciones

## Manejo de Errores

Todos los módulos incluyen:

- Captura de errores con try-catch
- Mensajes de error descriptivos en Alert rojo
- Mensajes de éxito en Alert verde
- Estados de carga para operaciones async
- Deshabilitación de botones durante operaciones

## Próximas Mejoras

- [ ] Exportar datos a Excel/PDF
- [ ] Búsqueda avanzada con filtros múltiples
- [ ] Búsqueda en tiempo real
- [ ] Confirmación de acciones con Snackbar
- [ ] Undo/Redo para operaciones
- [ ] Auditoría de cambios
- [ ] Importación en lote

## Guía de Uso

1. **Acceder a Gestión**: Click en el menú lateral
2. **Crear**: Click en "Nuevo", completar formulario, guardar
3. **Editar**: Click en icono de lápiz, modificar, guardar
4. **Eliminar**: Click en icono de basura, confirmar
5. **Filtrar**: Use los selects de filtro según el módulo
6. **Paginar**: Navegue con los controles al pie de tabla

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Estado**: Completo y funcional ✅
