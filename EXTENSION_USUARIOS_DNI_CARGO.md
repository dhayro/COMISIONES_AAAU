# Extensión del Módulo de Usuarios - Campos DNI y Cargo

## Descripción General
Se ha extendido el módulo de gestión de usuarios para incluir dos nuevos campos profesionales:
- **DNI**: Número de documento nacional de identidad (VARCHAR(20))
- **Cargo**: Asignación de posición o rol profesional (Relación con tabla `cargos`)

**Compilación exitosa**: 502.97 kB (incremento mínimo de 0.2 kB)

---

## Cambios en la Base de Datos

### Tabla: `users`
Ubicación: `backend/database.js`

#### Nuevos campos agregados:
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  dni VARCHAR(20),                          -- NUEVO: Número de DNI
  rol VARCHAR(50) DEFAULT 'usuario',
  ambito_id INT,
  cargo_id INT,                             -- NUEVO: ID del cargo asignado
  activo BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE SET NULL,
  FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,  -- NUEVA FK
  
  INDEX idx_cargo (cargo_id)                -- NUEVO: Índice para búsquedas
);
```

**Características:**
- `dni`: Campo opcional (puede ser NULL)
- `cargo_id`: Relación con tabla `cargos` (CASCADE NULL si cargo es eliminado)
- Índice para optimizar búsquedas por cargo_id

---

## Cambios en el Backend

### Archivo: `backend/models/User.js`

#### Método `listar()`
```javascript
// Agregados al SELECT:
u.dni,
u.cargo_id,
c.nombre as cargo_nombre,

// Agregado al JOIN:
LEFT JOIN cargos c ON u.cargo_id = c.id
```

#### Método `obtenerActivos()`
Mismos cambios que `listar()`

#### Método `obtenerPorId(id)`
Mismos cambios que `listar()`

#### Método `crear(datos)`
```javascript
// Nuevo parámetro desestructurado:
const { nombre, username, email, rol, ambito_id, dni, cargo_id } = datos;

// Actualizado el INSERT:
INSERT INTO users (nombre, username, email, password, dni, rol, ambito_id, cargo_id, activo)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)

// Con valores:
[nombre, username, email, hashedPassword, dni || null, rol || 'usuario', ambito_id || null, cargo_id || null]
```

#### Método `actualizar(id, datos)`
```javascript
// Desestructuración actualizada:
const { nombre, username, email, rol, ambito_id, dni, cargo_id } = datos;

// Lógica condicional agregada:
if (dni !== undefined) {
  updates.push('dni = ?');
  values.push(dni || null);
}

if (cargo_id !== undefined) {
  updates.push('cargo_id = ?');
  values.push(cargo_id || null);
}
```

### Archivo: `backend/controllers/userController.js`

#### Método `crear(req, res)`
```javascript
// Desestructuración del body:
const { nombre, username, email, rol, ambito_id, dni, cargo_id } = req.body;

// Validaciones previas a User.crear()
// Luego se pasan todos los parámetros:
await User.crear({
  nombre,
  username,
  email,
  rol,
  ambito_id,
  dni,
  cargo_id
});
```

#### Método `actualizar(req, res)`
```javascript
// Desestructuración del body:
const { nombre, username, email, rol, ambito_id, dni, cargo_id } = req.body;

// Se pasan todos los parámetros al modelo:
const usuarioActualizado = await User.actualizar(id, {
  nombre,
  username,
  email,
  rol,
  ambito_id,
  dni,
  cargo_id
});
```

---

## Cambios en el Frontend

### Archivo: `material-dashboard-react/src/pages/Gestion/GestionUsuarios.js`

#### Estado (hooks)
```javascript
const [cargos, setCargos] = useState([]);  // NUEVO

const [formData, setFormData] = useState({
  nombre: '',
  email: '',
  username: '',
  dni: '',                                 // NUEVO
  rol: 'usuario',
  ambito_id: null,
  cargo_id: null,                          // NUEVO
});
```

#### Función `cargarDatos()`
```javascript
// Agregada carga de cargos:
const cargosRes = await api.obtenerCargos();
setCargos(cargosRes);
```

#### Función `handleOpenDialog(usuario)`
```javascript
// Campos agregados a formData:
dni: usuario.dni || '',
cargo_id: usuario.cargo_id || null,

// Y en el reset:
dni: '',
cargo_id: null,
```

#### Tabla de Datos - Columnas
Se agregaron dos nuevas columnas:

| Columna | Ancho | Contenido |
|---------|-------|----------|
| DNI | 12% | Valor directo de `dni` |
| Cargo | 12% | `cargo_nombre` o "Sin cargo" |

**Anchos ajustados:**
- ID: 8% → 6%
- Email: 25% → 20%
- Acciones: 7% → 6%
- Se agregó Cargo y DNI

#### Diálogo de Edición/Creación
Se agregaron dos campos:

**Campo DNI:**
```javascript
<TextField
  fullWidth
  label="DNI"
  value={formData.dni}
  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
  variant="outlined"
  size="small"
  sx={{ mb: 2 }}
  placeholder="Ej: 12345678"
  inputProps={{ maxLength: 20 }}
/>
```

**Campo Cargo (Select):**
```javascript
<TextField
  fullWidth
  label="Cargo"
  value={formData.cargo_id || ''}
  onChange={(e) =>
    setFormData({
      ...formData,
      cargo_id: e.target.value ? parseInt(e.target.value) : null,
    })
  }
  select
  variant="outlined"
  size="small"
  sx={{ mb: 2 }}
>
  <MenuItem value="">Seleccionar cargo...</MenuItem>
  {cargos.map((cargo) => (
    <MenuItem key={cargo.id} value={cargo.id}>
      {cargo.nombre}
    </MenuItem>
  ))}
</TextField>
```

---

## Orden de Campos en el Formulario
1. Nombre
2. Usuario
3. Email
4. DNI ✓ (NUEVO)
5. Rol
6. Cargo ✓ (NUEVO)
7. Ámbito
8. Mensaje de contraseña por defecto (solo al crear)

---

## Validaciones
- **DNI**: Opcional, máximo 20 caracteres
- **Cargo**: Opcional (puede no estar asignado)
- **Nombre, Usuario, Email, Ámbito**: Requeridos (validaciones existentes se mantienen)

---

## API Endpoints Afectados

### PUT `/api/usuarios/:id` - Actualizar usuario
```javascript
// Cuerpo de solicitud:
{
  nombre: string,
  username: string,
  email: string,
  roi: string,
  ambito_id: number | null,
  dni: string | null,              // NUEVO
  cargo_id: number | null          // NUEVO
}
```

### POST `/api/usuarios` - Crear usuario
Misma estructura que PUT.

### GET `/api/usuarios` - Listar usuarios
```javascript
// Respuesta incluye:
{
  id: number,
  nombre: string,
  username: string,
  email: string,
  dni: string | null,              // NUEVO
  rol: string,
  ambito_id: number,
  ambito_nombre: string,
  cargo_id: number | null,         // NUEVO
  cargo_nombre: string | null,     // NUEVO (con JOIN)
  activo: boolean
}
```

---

## Relaciones en la Base de Datos

```
users (ambitos)
  ↓ FOREIGN KEY
ambitos

users (cargos)
  ↓ FOREIGN KEY
cargos
```

**Comportamiento al eliminar:**
- Si se elimina un `ambito`: `ambito_id` se pone en NULL
- Si se elimina un `cargo`: `cargo_id` se pone en NULL
- Si se elimina un `usuario`: no afecta a cargos (relación de lectura)

---

## Pruebas Recomendadas

### Backend
1. ✓ Crear usuario con dni y cargo_id
2. ✓ Actualizar usuario sin cambiar dni/cargo_id (que se preserve)
3. ✓ Actualizar solo dni
4. ✓ Actualizar solo cargo_id
5. ✓ Limpiar cargo_id (NULL)
6. ✓ Listar usuarios y verificar cargo_nombre en JOIN

### Frontend
1. ✓ Abre la tabla de usuarios
2. ✓ Verifica que aparezcan columnas DNI y Cargo
3. ✓ Crea un nuevo usuario con DNI y Cargo
4. ✓ Edita usuario existente y modifica DNI/Cargo
5. ✓ Verifica que se muestre "Sin cargo" cuando es NULL
6. ✓ Prueba el select de Cargo cargando la lista dinámicamente

---

## Tamaño de Compilación
- **Antes**: 502.77 kB
- **Después**: 502.97 kB
- **Diferencia**: +0.2 kB (incremento mínimo)

---

## Notas Importantes

1. **Compatibilidad hacia atrás**: Los usuarios existentes tendrán NULL en dni y cargo_id. No hay ruptura de funcionalidad.

2. **Dependencia de tabla `cargos`**: Requiere que la tabla `cargos` ya esté creada (implementada en iteración anterior).

3. **Patrón de actualización condicional**: Se usa `if (dni !== undefined)` para permitir actualizaciones parciales sin perder valores existentes.

4. **JOIN LEFT para Cargo**: Se usa LEFT JOIN porque cargo_id puede ser NULL, y queremos listar usuarios sin cargo asignado.

5. **Validaciones**: DNI es opcional en validaciones de backend (no está marcado como requerido), manteniendo compatibilidad.

---

## Próximas Mejoras Sugeridas

1. Validación de formato DNI (según país)
2. Búsqueda/filtrado por DNI en la tabla
3. Búsqueda/filtrado por Cargo en la tabla
4. Reportes que incluyan información de DNI y Cargo
5. Auditoría de cambios en DNI y Cargo asignado

---

## Archivos Modificados

1. ✓ `backend/database.js` - Estructura de tabla users
2. ✓ `backend/models/User.js` - Métodos CRUD
3. ✓ `backend/controllers/userController.js` - Lógica de controllers
4. ✓ `material-dashboard-react/src/pages/Gestion/GestionUsuarios.js` - Interfaz de usuario

**Estado**: ✅ COMPLETADO Y COMPILADO EXITOSAMENTE
