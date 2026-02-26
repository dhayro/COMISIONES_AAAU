# 🚀 Sistema de Gestión de Comisiones AAAU

Aplicación completa para gestionar comisiones de viaje con autenticación JWT, Base de Datos MySQL y Frontend React.

---

## 📋 **INICIO RÁPIDO**

### **1. BACKEND - Ya está corriendo en puerto 5000** ✅

```bash
# El servidor está disponible en:
# http://localhost:5000/api
# Swagger: http://localhost:5000/api-docs
```

**Usuarios de prueba cargados:**
- Email: `dhayro.kong@hotmail.com` (Administrador)
- Contraseña: Verifica con tus contraseñas específicas encriptadas

---

### **2. FRONTEND - Inicia React**

En una **terminal nueva**:

```bash
cd material-dashboard-react
npm start
```

Se abrirá automáticamente en: `http://localhost:3000`

---

## 🔐 **FLUJO DE AUTENTICACIÓN**

### **Login**
```
1. Usuario ingresa email y contraseña
2. Backend valida con MySQL
3. Genera JWT Token
4. Frontend guarda token en localStorage
5. Redirecciona a Dashboard
```

### **Protección de Rutas**
```
- ProtectedRoute verifica si usuario existe
- Si no hay token → Redirecciona a /login
- Si hay token → Permite acceso al dashboard
```

---

## 📊 **FUNCIONALIDADES**

### ✅ **Autenticación**
- Login con email y contraseña
- JWT con expiración 7 días
- Contraseñas encriptadas con Bcrypt
- Logout seguro

### ✅ **Gestión de Comisiones**
- **Crear** nueva comisión
- **Listar** todas las comisiones del usuario
- **Editar** comisión existente
- **Eliminar** comisión
- Campos:
  - Ámbito, Lugar, Fechas
  - Comisionados, Actividades, Días
  - Costos: Xdía, Pasajes, Combustible
  - Costo total automático
  - Observaciones

### ✅ **Dashboard**
- Vista de todas las comisiones
- Tabla interactiva con acciones
- Filtros y búsqueda (próximas versiones)
- Reportes (próximas versiones)

---

## 🗄️ **BASE DE DATOS**

### **Tabla: users**
```sql
id              INT AUTO_INCREMENT PRIMARY KEY
email           VARCHAR(100) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL (hash bcrypt)
nombre          VARCHAR(100) NOT NULL
rol             ENUM('admin', 'usuario')
activo          BOOLEAN DEFAULT 1
creado_en       TIMESTAMP
actualizado_en  TIMESTAMP
```

### **Tabla: comisiones**
```sql
id                                  INT AUTO_INCREMENT PRIMARY KEY
ambito                             VARCHAR(100)
lugar                             VARCHAR(100) NOT NULL
fecha_inicio                       DATE NOT NULL
fecha_fin                          DATE NOT NULL
comisionados                       VARCHAR(255) NOT NULL
actividades                        TEXT
dias                              INT
costo_xdia                         DECIMAL(10,2)
costo_pasajes_nacional             DECIMAL(10,2)
costo_pasajes_local               DECIMAL(10,2)
costo_combustible                 DECIMAL(10,2)
costo_comision_por_comisionado    DECIMAL(10,2)
costo_total_comision              DECIMAL(10,2)
observacion                        TEXT
usuario_id                         INT FK → users(id)
creado_en                         TIMESTAMP
actualizado_en                    TIMESTAMP
```

---

## 🔌 **API ENDPOINTS**

### **Autenticación**

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "dhayro.kong@hotmail.com",
  "password": "tu_contraseña"
}

Response:
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "email": "dhayro.kong@hotmail.com",
    "nombre": "Administrador Sistema",
    "rol": "admin"
  }
}
```

#### Registrar
```bash
POST /api/auth/registrar
{
  "email": "nuevo@ejemplo.com",
  "password": "miPassword123",
  "nombre": "Nombre Completo"
}
```

#### Obtener Perfil
```bash
GET /api/auth/perfil
Authorization: Bearer TOKEN_AQUI
```

---

### **Comisiones**

#### Crear Comisión
```bash
POST /api/comisiones
Authorization: Bearer TOKEN_AQUI
Content-Type: application/json

{
  "ambito": "Local",
  "lugar": "Lima",
  "fecha_inicio": "2026-02-10",
  "fecha_fin": "2026-02-15",
  "comisionados": "Juan Pérez, María García",
  "actividades": "Inspección de obras",
  "dias": 5,
  "costo_xdia": 220,
  "costo_pasajes_nacional": 500,
  "costo_pasajes_local": 100,
  "costo_combustible": 150,
  "costo_comision_por_comisionado": 1300,
  "costo_total_comision": 2600,
  "observacion": "Sin observaciones"
}
```

#### Obtener Comisiones
```bash
GET /api/comisiones
Authorization: Bearer TOKEN_AQUI
```

#### Obtener Comisión por ID
```bash
GET /api/comisiones/1
Authorization: Bearer TOKEN_AQUI
```

#### Actualizar Comisión
```bash
PUT /api/comisiones/1
Authorization: Bearer TOKEN_AQUI
Content-Type: application/json

{
  "lugar": "Arequipa",
  ... resto de campos
}
```

#### Eliminar Comisión
```bash
DELETE /api/comisiones/1
Authorization: Bearer TOKEN_AQUI
```

---

## 🧪 **PRUEBAS CON SWAGGER**

1. Abre: `http://localhost:5000/api-docs`
2. Haz login y copia el token
3. Haz clic en **"Authorize"** (ícono candado)
4. Ingresa: `Bearer tu_token_aqui`
5. Prueba todos los endpoints

---

## 📁 **ESTRUCTURA DEL PROYECTO**

```
COMISIONES_AAAU/
├── backend/                        # API REST
│   ├── config/
│   │   ├── database.js            # Configuración MySQL
│   │   └── swagger.js             # Swagger docs
│   ├── controllers/
│   │   ├── authController.js
│   │   └── commissionsController.js
│   ├── middleware/
│   │   └── auth.js                # Middleware JWT
│   ├── routes/
│   │   ├── auth.js
│   │   └── commissions.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── material-dashboard-react/      # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   └── Comisiones.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   ├── package.json
│   └── public/
│
└── docker-compose.yml             # Opcional: MySQL con Docker
```

---

## 🔒 **SEGURIDAD**

✅ **JWT** - Tokens con expiración 7 días
✅ **Bcrypt** - Contraseñas encriptadas
✅ **CORS** - Habilitado en localhost
✅ **Middleware** - Protección de rutas
⚠️ **En Producción:**
- Cambiar `JWT_SECRET` por valor aleatorio
- Habilitar HTTPS
- Configurar CORS específicamente
- Variables de entorno seguras

---

## 🚀 **COMANDOS ÚTILES**

### **Backend**
```bash
cd backend

# Iniciar en desarrollo
npm run dev

# Configurar BD (primera vez)
npm run setup-db

# Insertar usuarios
npm run insert-users

# Iniciar en producción
npm start
```

### **Frontend**
```bash
cd material-dashboard-react

# Iniciar en desarrollo
npm start

# Build para producción
npm run build

# Eject (cuidado!)
npm run eject
```

---

## 📊 **REPORTE DE COMISIONES**

### Próximas Implementaciones:
- 📄 Exportar a PDF
- 📊 Exportar a Excel
- 📈 Gráficos de costos
- 🔍 Filtros avanzados
- 📅 Reportes por período

---

## ❓ **TROUBLESHOOTING**

### **Error: Cannot connect to MySQL**
```bash
# Solución: Inicia MySQL desde XAMPP Control Panel
# Verifica: mysql -u root -e "SELECT 1"
```

### **Error: Port 3000 already in use**
```bash
# Solución: Mata el proceso o usa otro puerto
# npm start -- --port 3001
```

### **Error: Token invalid or expired**
```bash
# Solución: Borra localStorage y vuelve a hacer login
# localStorage.clear()
```

---

## 📞 **SOPORTE**

Para problemas, verifica:
1. ✅ MySQL está corriendo (XAMPP)
2. ✅ Backend: `http://localhost:5000/api/health`
3. ✅ Frontend: `http://localhost:3000`
4. ✅ Revisar consola del navegador (F12)
5. ✅ Revisar terminal del backend

---

## 📝 **NOTAS**

- Todos los usuarios tienen contraseña encriptada en BD
- El frontend guarda token en localStorage (revisar en DevTools)
- Las comisiones están asociadas al usuario logueado
- Los cambios en .env requieren reiniciar el servidor

---

**Desarrollado con ❤️ para AAAU 2026**
