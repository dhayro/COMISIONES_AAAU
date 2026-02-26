# 🏗️ ARQUITECTURA DEL SISTEMA

## 📊 Diagrama General

```
┌────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (CLIENTE)                     │
│                   http://localhost:3000                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        FRONTEND REACT + MATERIAL DASHBOARD           │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ • Login Component (username + password)         │ │  │
│  │  │ • Dashboard (panel principal)                   │ │  │
│  │  │ • Comisiones CRUD (crear, editar, eliminar)    │ │  │
│  │  │ • AuthContext (gestiona sesión/token)          │ │  │
│  │  │ • ProtectedRoute (rutas aseguradas)            │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
                   HTTP Requests/Responses
                   (Bearer Token JWT)
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    BACKEND NODE.JS/EXPRESS                 │
│                   http://localhost:5000                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVIDOR API REST                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Routes:                                         │ │  │
│  │  │ • POST /api/auth/login      (sin protección)   │ │  │
│  │  │ • POST /api/auth/registrar  (sin protección)   │ │  │
│  │  │ • GET  /api/auth/perfil     (protegido)        │ │  │
│  │  │ • GET  /api/comisiones      (protegido)        │ │  │
│  │  │ • POST /api/comisiones      (protegido)        │ │  │
│  │  │ • PUT  /api/comisiones/:id  (protegido)        │ │  │
│  │  │ • DELETE /api/comisiones/:id(protegido)        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Controllers:                                    │ │  │
│  │  │ • authController (login, registro, verificación) │  │
│  │  │ • commissionsController (CRUD comisiones)       │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Middleware:                                     │ │  │
│  │  │ • auth.js (verifica JWT en headers)            │ │  │
│  │  │ • CORS (permite requests desde frontend)       │ │  │
│  │  │ • errorHandler (manejo de errores)             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            │
                  SQL Queries / Results
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    MYSQL DATABASE                          │
│                   localhost:3306                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Database: comisiones_db                             │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ TABLE: users (26 registros)                     │ │  │
│  │  │ • id (PK)                                       │ │  │
│  │  │ • username (UNIQUE) ← Campo de Login            │ │  │
│  │  │ • email (UNIQUE)                                │ │  │
│  │  │ • password (Bcrypt hash)                        │ │  │
│  │  │ • nombre                                        │ │  │
│  │  │ • rol (admin | usuario)                         │ │  │
│  │  │ • activo (boolean)                              │ │  │
│  │  │ • timestamps                                    │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ TABLE: comisiones (historial)                   │ │  │
│  │  │ • id (PK)                                       │ │  │
│  │  │ • usuario_id (FK → users)                       │ │  │
│  │  │ • ambito, lugar, fechas                         │ │  │
│  │  │ • comisionados, actividades                     │ │  │
│  │  │ • costos desglosados                            │ │  │
│  │  │ • observaciones                                 │ │  │
│  │  │ • timestamps                                    │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Flujo de Autenticación

```
1. Usuario entra username/password
   │
   ▼
2. Frontend hace POST /api/auth/login
   │
   ▼
3. Backend (authController):
   - Busca usuario en DB (WHERE username = ?)
   - Compara password con hash (bcrypt)
   │
   ▼
4. Si válido:
   - Genera JWT token (válido 7 días)
   - Retorna token + datos usuario
   │
   ▼
5. Frontend:
   - Guarda token en localStorage
   - Incluye en header: Authorization: Bearer <token>
   │
   ▼
6. Requests posteriores:
   - Auth middleware verifica token
   - Si válido → permite acceso
   - Si inválido → rechaza (401)
```

---

## 📁 Estructura de Archivos

```
COMISIONES_AAAU/
│
├── backend/                          (Node.js/Express)
│   ├── server.js                    (entrada principal)
│   ├── package.json                 (dependencias)
│   ├── .env                         (variables de entorno)
│   │
│   ├── config/
│   │   ├── database.js              (conexión MySQL + init)
│   │   └── swagger.js               (documentación API)
│   │
│   ├── routes/
│   │   ├── auth.js                  (rutas /auth/*)
│   │   └── commissions.js           (rutas /comisiones/*)
│   │
│   ├── controllers/
│   │   ├── authController.js        (lógica login/registro)
│   │   └── commissionsController.js (lógica CRUD)
│   │
│   ├── middleware/
│   │   └── auth.js                  (verificar JWT)
│   │
│   ├── reset-db.js                  (BORRAR + RECREAR BD)
│   └── insert-users.js              (cargar usuarios)
│
├── material-dashboard-react/        (React 18)
│   ├── package.json
│   ├── .env                         (API_URL)
│   ├── public/                      (assets estáticos)
│   │
│   └── src/
│       ├── App.js                   (app principal)
│       ├── index.js                 (entry point)
│       ├── routes.js                (definición rutas)
│       │
│       ├── context/
│       │   └── AuthContext.js       (estado global auth)
│       │
│       ├── services/
│       │   └── api.js               (cliente HTTP con JWT)
│       │
│       ├── pages/
│       │   ├── Login.js             (formulario login)
│       │   ├── Dashboard.js         (panel principal)
│       │   └── Comisiones.js        (gestión comisiones)
│       │
│       ├── components/
│       │   ├── ProtectedRoute/      (guard de rutas)
│       │   ├── MDBox/               (custom components)
│       │   ├── MDButton/
│       │   ├── MDTypography/
│       │   └── ... (más componentes)
│       │
│       └── assets/
│           ├── images/
│           ├── theme/               (estilos Material UI)
│           └── ...
│
├── GUIA_SETUP.md                    (setup detallado)
├── SETUP_RAPIDO.md                  (3 pasos rápidos)
├── SISTEMA_LISTO.md                 (documentación funciones)
└── README.md                        (overview proyecto)
```

---

## 🔄 Flujo de Comisiones (CRUD)

```
┌─────────────────────────────────────────────────────────────┐
│              USUARIO LOGUEADO EN DASHBOARD                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   CREATE            READ / LIST          UPDATE / DELETE
   (Crear)           (Ver todas)           (Editar/Borrar)
        │                   │                   │
        ▼                   ▼                   ▼
   Modal Form        Table Display        Modal + Botones
   + 14 campos       (mis comisiones)      (acciones)
        │                   │                   │
        ▼                   ▼                   ▼
  POST request       GET request          PUT/DELETE request
  /comisiones        /comisiones          /comisiones/:id
        │                   │                   │
        ▼                   ▼                   ▼
   Backend           Backend              Backend
   Inserta           Busca                Actualiza/Borra
   Retorna ID        por usuario_id       Retorna confirmación
        │                   │                   │
        ▼                   ▼                   ▼
   DB: comisiones    DB: comisiones       DB: comisiones
   (nuevo registro)  (filtra por user)    (modificado)
        │                   │                   │
        ▼                   ▼                   ▼
   Frontend recibe   Frontend recibe      Frontend recibe
   ID creado         lista actualizada    confirmación
        │                   │                   │
        ▼                   ▼                   ▼
   Cierra modal      Muestra tabla        Actualiza tabla
   Actualiza tabla   con datos            Cierra modal
```

---

## 🔑 Campos de Comisiones

```
┌───────────────────────────────────────┐
│        FORMULARIO DE COMISIÓN         │
├───────────────────────────────────────┤
│                                       │
│  📍 Ámbito:                           │
│     [ ] Local                         │
│     [ ] Provincial                    │
│     [ ] Nacional                      │
│                                       │
│  📍 Lugar: ________________            │
│                                       │
│  📍 Fechas:                           │
│     Inicio: [YYYY-MM-DD]              │
│     Fin:    [YYYY-MM-DD]              │
│                                       │
│  👥 Comisionados: ________________     │
│                                       │
│  📝 Actividades: ________________      │
│                                       │
│  💰 COSTOS:                           │
│     Por día:              [$ 0.00]    │
│     Pasajes Nacional:     [$ 0.00]    │
│     Pasajes Local:        [$ 0.00]    │
│     Combustible:          [$ 0.00]    │
│     Comisión/Comisionado: [$ 0.00]    │
│     TOTAL COMISIÓN:       [$ 0.00]    │
│                                       │
│  📌 Observaciones: ________________    │
│                                       │
│  [ Guardar ]    [ Cancelar ]          │
└───────────────────────────────────────┘
```

---

## 🛡️ Seguridad Implementada

```
┌────────────────────────────────────────┐
│      CAPAS DE SEGURIDAD                │
├────────────────────────────────────────┤
│                                        │
│ 1. PASSWORD HASHING                    │
│    └─ Bcrypt (10 salt rounds)          │
│       Contraseña: "Autoridad1"         │
│       Hash:   "$2a$10$xxxxx..."        │
│                                        │
│ 2. JWT AUTHENTICATION                  │
│    └─ HS256 signing                    │
│       Expira en: 7 días                │
│       Payload: {id, email, username}   │
│                                        │
│ 3. ROUTE PROTECTION                    │
│    └─ Middleware verifica JWT          │
│       GET /api/auth/perfil    ✅ (JWT)│
│       GET /api/comisiones     ✅ (JWT)│
│       POST /api/auth/login    ❌ (Open)│
│                                        │
│ 4. DATA ISOLATION                      │
│    └─ Cada usuario solo ve sus datos   │
│       SELECT * FROM comisiones         │
│       WHERE usuario_id = ?             │
│                                        │
│ 5. CORS ENABLED                        │
│    └─ Solo localhost:3000 accede       │
│                                        │
│ 6. FOREIGN KEYS                        │
│    └─ Integridad referencial en DB     │
│       comisiones → users (FK)          │
│                                        │
└────────────────────────────────────────┘
```

---

## 📊 Modelos de Datos

### Usuario (users)

```javascript
{
  id: 1,
  username: "admin",                    // Campo de login
  email: "dhayro.kong@hotmail.com",
  password: "$2a$10$...",                // Hash Bcrypt
  nombre: "Administrador Sistema",
  rol: "admin",                          // "admin" o "usuario"
  activo: true,
  creado_en: "2026-02-06 10:30:00",
  actualizado_en: "2026-02-06 10:30:00"
}
```

### Comisión (comisiones)

```javascript
{
  id: 1,
  usuario_id: 1,                         // Relación con usuarios
  ambito: "nacional",
  lugar: "Lima",
  fecha_inicio: "2026-02-15",
  fecha_fin: "2026-02-18",
  comisionados: "Juan, María, Carlos",
  actividades: "Reuniones con stakeholders",
  dias: 3,
  costo_xdia: 150.00,
  costo_pasajes_nacional: 500.00,
  costo_pasajes_local: 50.00,
  costo_combustible: 30.00,
  costo_comision_por_comisionado: 75.00,
  costo_total_comision: 890.00,
  observacion: "Comisión completada exitosamente",
  creado_en: "2026-02-06 10:45:00",
  actualizado_en: "2026-02-06 10:45:00"
}
```

---

## 🔗 Endpoints Disponibles

```
AUTENTICACIÓN
═════════════════════════════════════════════
POST   /api/auth/login
       Body: { username, password }
       Response: { token, usuario }

POST   /api/auth/registrar
       Body: { username, email, password, nombre }
       Response: { token, usuario }

GET    /api/auth/perfil
       Headers: Authorization: Bearer <token>
       Response: { usuario }


COMISIONES (todas requieren JWT)
═════════════════════════════════════════════
POST   /api/comisiones
       Headers: Authorization: Bearer <token>
       Body: { ambito, lugar, fecha_inicio, ... }
       Response: { id, ... }

GET    /api/comisiones
       Headers: Authorization: Bearer <token>
       Response: [ { id, ... }, ... ]

GET    /api/comisiones/:id
       Headers: Authorization: Bearer <token>
       Response: { id, ... }

PUT    /api/comisiones/:id
       Headers: Authorization: Bearer <token>
       Body: { ambito, lugar, ... }
       Response: { mensaje: "Actualizado" }

DELETE /api/comisiones/:id
       Headers: Authorization: Bearer <token>
       Response: { mensaje: "Eliminado" }
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React | 18.2.0 |
| **UI** | Material-UI (MUI) | 5.12.3 |
| **Routing** | React Router | 6.11.0 |
| **Backend** | Node.js | 20.13.1 |
| **Framework** | Express.js | 4.x |
| **Auth** | JWT | HS256 |
| **Passwords** | Bcryptjs | 2.4.3 |
| **DB** | MySQL | 5.7+ |
| **ORM** | mysql2/promise | - |
| **HTTP Client** | Fetch API | - |
| **Docs** | Swagger/OpenAPI | 3.0 |

---

**Diagrama completo de la arquitectura y flujos del sistema** ✅

