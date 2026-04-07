# Control de Acceso - Certificaciones de Crédito

## 🔐 Implementación de Control de Acceso Basado en Rol y Ámbito

**Fecha:** 14 de Marzo de 2026  
**Objetivo:** Filtrar certificaciones según el rol y ámbito del usuario

---

## 📋 Cambios Realizados

### 1. Backend - Controlador de Autenticación (`authController.js`)

**Archivo:** `backend/controllers/authController.js`

#### Cambio 1: Incluir `ambito_id` en la consulta de login
```javascript
// ANTES
const [users] = await connection.query(
  'SELECT id, email, password, nombre, rol FROM users WHERE username = ?',
  [username]
);

// DESPUÉS
const [users] = await connection.query(
  'SELECT id, email, password, nombre, rol, ambito_id FROM users WHERE username = ?',
  [username]
);
```

#### Cambio 2: Incluir `ambito_id` en el JWT
```javascript
// ANTES
const token = jwt.sign(
  { id: user.id, email: user.email, username: username, rol: user.rol },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE }
);

// DESPUÉS
const token = jwt.sign(
  { id: user.id, email: user.email, username: username, rol: user.rol, ambito_id: user.ambito_id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE }
);
```

#### Cambio 3: Incluir `ambito_id` en la respuesta de login
```javascript
return res.status(200).json({
  mensaje: 'Login exitoso',
  token,
  usuario: {
    id: user.id,
    email: user.email,
    username: username,
    nombre: user.nombre,
    rol: user.rol,
    ambito_id: user.ambito_id  // ← AGREGADO
  }
});
```

#### Cambio 4: Incluir `ambito_id` en `obtenerPerfil`
```javascript
// ANTES
const [users] = await connection.query(
  'SELECT id, email, nombre, rol FROM users WHERE id = ?',
  [req.user.id]
);

// DESPUÉS
const [users] = await connection.query(
  'SELECT id, email, nombre, rol, ambito_id FROM users WHERE id = ?',
  [req.user.id]
);
```

---

### 2. Backend - Controlador de Certificaciones (`certificacionCreditoController.js`)

**Archivo:** `backend/controllers/certificacionCreditoController.js`

**Cambio:** Pasar contexto del usuario al modelo

```javascript
exports.listar = async (req, res) => {
  try {
    const { meta_id, fuente_financiamiento_id, estado_certificacion, mes } = req.query;

    const filtros = {};
    if (meta_id) filtros.meta_id = meta_id;
    if (fuente_financiamiento_id) filtros.fuente_financiamiento_id = fuente_financiamiento_id;
    if (estado_certificacion) filtros.estado_certificacion = estado_certificacion;
    if (mes) filtros.mes = mes;

    // ← AGREGADO: Pasar contexto del usuario
    const userContext = {
      id: req.user.id,
      rol: req.user.rol,
      ambito_id: req.user.ambito_id
    };

    const certificaciones = await CertificacionCredito.listar(filtros, userContext);
    res.json(certificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

### 3. Backend - Modelo de Certificaciones (`CertificacionCredito.js`)

**Archivo:** `backend/models/CertificacionCredito.js`

**Cambio:** Implementar control de acceso en la consulta SQL

```javascript
static async listar(filtros = {}, userContext = {}) {
  try {
    let query = `SELECT cc.id, cc.nota, cc.mes, cc.fecha_aprobacion, ... 
                 FROM certificaciones_credito cc
                 LEFT JOIN metas m ON cc.meta_id = m.id
                 LEFT JOIN ambitos a ON m.ambito_id = a.id
                 ...
                 WHERE 1=1`;

    const params = [];

    // ========== CONTROL DE ACCESO BASADO EN ROL Y ÁMBITO ==========
    // Admin: Ve todos los certificados de todos los ámbitos
    if (userContext && userContext.rol && userContext.rol !== 'admin') {
      // Usuario administrativo SIN ámbito asignado: Ve todos
      // Usuario administrativo CON ámbito asignado: Ve solo su ámbito
      if (userContext.ambito_id) {
        query += ` AND a.id = ?`;
        params.push(userContext.ambito_id);
      }
      // Si no es admin y no tiene ambito_id, se ve todo (para usuarios administrativos sin dependencia)
    }
    // Admin no aplica filtro de ámbito

    // ... resto de filtros ...

    const [certificaciones] = await pool.query(query, params);
    return certificaciones;
  } catch (error) {
    throw new Error(`Error al listar certificaciones: ${error.message}`);
  }
}
```

---

## 🎯 Reglas de Acceso Implementadas

| Rol | ambito_id | Tipo Ámbito | Comportamiento |
|-----|-----------|------------|----------------|
| `admin` | Cualquiera | N/A | Ve **TODOS** los certificados de **TODOS** los ámbitos |
| `administrativo` / `usuario` | NULL | N/A | Ve **TODOS** los certificados de **TODOS** los ámbitos |
| `administrativo` / `usuario` | 1 (AAA UCAYALI) | AAA (dependencia_id = NULL) | Ve **TODOS** los certificados (**Administrador de todas las ALAs**) |
| `administrativo` / `usuario` | 2 (ALA PUCALLPA) | ALA (dependencia_id = 1) | Ve **SOLO** los certificados del **ALA PUCALLPA** |
| `administrativo` / `usuario` | 3 (ALA ATALAYA) | ALA (dependencia_id = 1) | Ve **SOLO** los certificados del **ALA ATALAYA** |

---

## 🔐 Lógica de Control de Acceso

### Jerarquía de Ámbitos:
```
AAA UCAYALI (dependencia_id = NULL) ← Administra TODO
├── ALA PUCALLPA (dependencia_id = 1) ← Solo su ALA
├── ALA ATALAYA (dependencia_id = 1) ← Solo su ALA
├── ALA TARMA (dependencia_id = 1) ← Solo su ALA
└── ALA PERENE (dependencia_id = 1) ← Solo su ALA
```

### Algoritmo de Filtrado:
```
IF usuario.rol == 'admin'
  → NO filtrar (ve todo)
ELSE IF usuario.ambito_id IS NULL
  → NO filtrar (ve todo)
ELSE IF usuario.ambito_id.dependencia_id IS NULL
  → NO filtrar (es una AAA, ve todo)
ELSE IF usuario.ambito_id.dependencia_id IS NOT NULL
  → FILTRAR por usuario.ambito_id (es una ALA, ve solo su ámbito)
```

---

## � Diagrama de Flujo - Decisión de Acceso

```
┌─────────────────────────────────────────┐
│ Solicitud de Certificaciones            │
│ Usuario: lrios (rol=administrativo,     │
│         ambito_id=2)                    │
└────────────┬────────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ ¿usuario.rol = admin?  │
    └──┬─────────────────┬───┘
       │ SÍ              │ NO
       │                 ▼
       │          ┌────────────────────────┐
       │          │ ¿usuario.ambito_id?    │
       │          └──┬─────────────────┬───┘
       │             │ NULL            │ ID (2)
       │             │                 ▼
       │             │          ┌──────────────────────────┐
       │             │          │ ambitos.dependencia_id   │
       │             │          │ WHERE id = 2             │
       │             │          └──┬──────────────────┬────┘
       │             │             │ NULL (AAA)       │ != NULL (ALA)
       │             │             ▼                  ▼
       │             │          ┌─────────────┐  ┌──────────────┐
       │             │          │ Ver TODO    │  │ Filtrar por  │
       │             │          │ (Adminstra- │  │ ambito_id=2  │
       │             │          │ dor de todas│  │ Solo ALA     │
       │             │          │ las ALAs)   │  │ PUCALLPA     │
       │             │          └─────┬───────┘  └──────┬───────┘
       │             └─────────┬──────┘                 │
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               ▼
                     ┌──────────────────────┐
                     │ Ejecutar query SQL   │
                     │ (con o sin filtro)   │
                     └──────────┬───────────┘
                                ▼
                     ┌──────────────────────┐
                     │ Retornar resultados  │
                     │ filtrados            │
                     └──────────────────────┘
```

---

### Flujo de Autenticación Mejorado:

1. **Login del usuario `lrios`**
   - Usuario entra credenciales
   - Backend consulta tabla `users` incluyendo `ambito_id`
   - Se obtiene: `{ id: X, username: 'lrios', rol: 'administrativo', ambito_id: 2 }`
   - Se genera JWT con estos campos

2. **Solicitud de Certificaciones**
   - Frontend envía solicitud a `/api/certificaciones/listar`
   - Middleware de autenticación extrae `req.user` del JWT
   - Controlador construye `userContext` con `{ id, rol, ambito_id }` del JWT
   - Modelo recibe `userContext` y aplica filtro: `AND a.id = 2`
   - Solo retorna certificados del ALA PUCALLPA (ambito_id = 2)

---

## ✅ Verificación

Para verificar que funciona correctamente:

1. **Usuario con ambito_id:**
   ```sql
   SELECT username, rol, ambito_id FROM users WHERE username = 'lrios';
   -- Resultado: lrios | administrativo | 2
   ```

2. **Datos de prueba esperados:**
   - Usuario `lrios` se conecta → JWT contiene `ambito_id: 2`
   - Solicita certificaciones → SQL filtra `WHERE a.id = 2`
   - Solo ve certificados de ALA PUCALLPA

3. **Admin sin restricción:**
   - Usuario `admin` se conecta → JWT contiene `rol: 'admin'`
   - No aplica filtro `AND a.id = ?`
   - Ve todos los certificados

---

## 📝 Notas Importantes

- **JWT Token:** Ahora incluye `ambito_id`, así que los usuarios necesitan **hacer login nuevamente** para obtener el nuevo token
- **Compatibilidad:** Si un usuario antiguo tiene token sin `ambito_id`, no funcionará correctamente el filtrado
- **Base de Datos:** Requiere que la tabla `users` tenga la columna `ambito_id` (ya existe desde sesiones anteriores)

---

## 🚀 Próximos Pasos

Si el filtrado aún no funciona:

1. **Verificar estructura de tabla users:**
   ```sql
   DESC users;
   ```
   Debe mostrar columna `ambito_id` con tipo `INT`

2. **Verificar datos del usuario:**
   ```sql
   SELECT id, username, rol, ambito_id FROM users WHERE username = 'lrios';
   ```

3. **Hacer login nuevamente** para obtener token con `ambito_id`

4. **Verificar JWT decodificado:**
   - Copiar token de la respuesta de login
   - Usar jwt.io para decodificar y confirmar que contiene `ambito_id`

