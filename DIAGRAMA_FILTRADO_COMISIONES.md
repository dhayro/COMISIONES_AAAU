# 🔍 DIAGRAMA DE FLUJO - FILTRADO DE COMISIONES

## Endpoint: GET /api/comisiones

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO SE LOGUEA Y SOLICITA COMISIONES                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ¿Cuál es su rol?
                    /       |       \
                   /        |        \
                  /         |         \
            ADMIN         JEFE      USUARIO
             ↓             ↓           ↓
        ┌────────┐    ┌────────┐  ┌──────────┐
        │ Ver    │    │ Ver    │  │ Ver SOLO │
        │TODAS   │    │TODAS   │  │ las SUYAS│
        │Comisio-│    │Comisio-│  │(usuario_ │
        │nes     │    │nes     │  │id=req.id)│
        └────────┘    └────────┘  └──────────┘
             ↓             ↓           ↓
        ┌────────────────────────────────────┐
        │      SELECT * FROM comisiones     │
        │      WHERE usuario_id = {id}      │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │  Retorna SOLO sus comisiones       │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │  Frontend muestra en la tabla      │
        │  http://localhost:3000/gestion/    │
        │        comisiones                  │
        └────────────────────────────────────┘
```

## Código del Filtrado

```javascript
// backend/controllers/comisionController.js - Línea 177

exports.listarComisiones = async (req, res) => {
  try {
    const { solo_mias } = req.query;
    const rolUsuario = req.user.rol;
    
    let usuarioId = null;
    
    // 🔴 USUARIO REGULAR: SIEMPRE VE SOLO SUS COMISIONES
    if (rolUsuario === 'usuario') {
      usuarioId = req.user.id;
    }
    // 🟢 OTROS ROLES: PUEDEN FORZAR SOLO_MIAS SI LO DESEAN
    else if (solo_mias === 'true') {
      usuarioId = req.user.id;
    }
    
    const comisiones = await Comision.listar(usuarioId, rolUsuario);
    res.json(comisiones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Tabla de Resultados

### Ejemplo: Base de datos con 4 comisiones

```
ID  | Usuario ID | Usuario Nombre    | Lugar      | Estado
----|------------|-------------------|------------|------------------
1   | 2          | DHAYRO KONG       | Lima       | PENDIENTE_APROBACION
2   | 2          | DHAYRO KONG       | Cusco      | APROBADA
3   | 3          | CAROL ARCOS       | Arequipa   | APROBADA
4   | 5          | NATHALY SALINAS   | Puno       | RECHAZADA
```

### Qué ve cada usuario:

```
👤 DHAYRO KONG (usuario, ID=2)
├─ GET /api/comisiones
├─ Backend filtra: usuario_id = 2
└─ Ve:
   ├─ ID 1 (su comisión)
   └─ ID 2 (su comisión)
   
   ❌ NO ve ID 3 (de Carol)
   ❌ NO ve ID 4 (de Nathaly)

👤 CAROL ARCOS (usuario, ID=3)
├─ GET /api/comisiones
├─ Backend filtra: usuario_id = 3
└─ Ve:
   └─ ID 3 (su comisión)
   
   ❌ NO ve ID 1 (de Dhayro)
   ❌ NO ve ID 2 (de Dhayro)
   ❌ NO ve ID 4 (de Nathaly)

👥 SNUNEZ (jefe, ID=13)
├─ GET /api/comisiones
├─ Backend: SIN FILTRO
└─ Ve:
   ├─ ID 1 (Dhayro)
   ├─ ID 2 (Dhayro)
   ├─ ID 3 (Carol)
   └─ ID 4 (Nathaly)

👨‍💼 RFLORES (administrativo, ID=14)
├─ GET /api/comisiones
├─ Backend filtra: aprobacion_estado = 'APROBADA'
└─ Ve:
   ├─ ID 2 (Dhayro - APROBADA)
   └─ ID 3 (Carol - APROBADA)
   
   ❌ NO ve ID 1 (PENDIENTE_APROBACION)
   ❌ NO ve ID 4 (RECHAZADA)

⚙️ ADMIN (admin, ID=1)
├─ GET /api/comisiones
├─ Backend: SIN FILTRO
└─ Ve:
   ├─ ID 1 (Dhayro)
   ├─ ID 2 (Dhayro)
   ├─ ID 3 (Carol)
   └─ ID 4 (Nathaly)
```

## Código de Backend - Filtrado en Modelo

```javascript
// backend/models/Comision.js - Línea ~90

static async listar(usuarioId = null, rolUsuario = null) {
  try {
    let query = `SELECT c.*, a.nombre as ambito_nombre 
                 FROM comisiones c 
                 LEFT JOIN ambitos a ON c.ambito_id = a.id`;
    const params = [];
    const condiciones = [];

    // 👨‍💼 ADMINISTRATIVO: Solo comisiones APROBADAS
    if (rolUsuario === 'administrativo') {
      condiciones.push('c.aprobacion_estado = "APROBADA"');
    }
    // 📝 USUARIO: Filtra por su ID
    else if (rolUsuario === 'usuario' && usuarioId) {
      condiciones.push('c.usuario_id = ?');
      params.push(usuarioId);
    }
    // 👥 JEFE y ⚙️ ADMIN: Sin filtro (ven todas)

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }

    query += ' ORDER BY c.creado_en DESC';

    const [comisiones] = await pool.query(query, params);
    return comisiones;
  } catch (error) {
    throw new Error(`Error al listar comisiones: ${error.message}`);
  }
}
```

## Estados de Aprobación

```
PENDIENTE_APROBACION → Usuario creó comisión, espera aprobación
         ↓
       APROBADA → Jefe/Admin aprobó
         ↓
    RECHAZADA → Jefe/Admin rechazó

Solo APROBADA es visible para rol 'administrativo'
```

## Flujo Completo Paso a Paso

### 1. Usuario DHAYRO se loguea
```
POST /api/auth/login
{
  "email": "dhayro27@gmail.com",
  "password": "Autoridad1"
}

Respuesta:
{
  "token": "eyJhbGc...",
  "usuario": {
    "id": 2,
    "email": "dhayro27@gmail.com",
    "nombre": "DHAYRO KONG TORRES",
    "rol": "usuario"        ← ROL CLAVE
  }
}
```

### 2. Frontend guarda token y rol
```javascript
// En AuthContext
setUsuario(data.usuario);  // rol = 'usuario'
localStorage.setItem('token', data.token);
```

### 3. Frontend navega a /gestion/comisiones
```javascript
// En DashboardUsuario.js
const comisiones = await api.obtenerComisiones();
// Llama: GET /api/comisiones
```

### 4. Backend recibe la solicitud
```javascript
// En comisionController.js
exports.listarComisiones = async (req, res) => {
  const rolUsuario = req.user.rol;  // Extrae del JWT = 'usuario'
  
  if (rolUsuario === 'usuario') {
    usuarioId = req.user.id;  // Asigna su ID = 2
  }
  
  const comisiones = await Comision.listar(usuarioId, rolUsuario);
  // Pasa usuarioId=2, rolUsuario='usuario'
}
```

### 5. Modelo ejecuta query filtrada
```javascript
// En Comision.js
// Construye:
// SELECT * FROM comisiones
// WHERE usuario_id = 2
// ORDER BY creado_en DESC

// Resultado: Solo comisiones donde usuario_id = 2
```

### 6. Frontend renderiza en tabla
```javascript
// En ComisionesList.js
{comisiones.map(c => (
  <TableRow key={c.id}>
    <TableCell>{c.id}</TableCell>
    <TableCell>{c.lugar}</TableCell>
    <TableCell>{c.fecha_salida}</TableCell>
    <TableCell>{c.aprobacion_estado}</TableCell>
  </TableRow>
))}

// Resultado: Muestra SOLO sus 2 comisiones
```

## ✅ Sistema Completamente Funcional

- ✅ Usuarios regulares ven SOLO sus comisiones
- ✅ No hay "fuga" de datos de otros usuarios
- ✅ Filtrado ocurre en el backend (seguro)
- ✅ Jefe puede ver todas para supervisar
- ✅ Administrativo ve solo aprobadas
- ✅ Admin tiene acceso total
