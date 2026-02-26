# 🚀 Sistema de Gestión de Comisiones AAAU

## Requisitos Previos

1. **Node.js** v20+ instalado ✅
2. **MySQL Server** instalado en tu máquina
3. **Git** para control de versiones

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Iniciar MySQL Server

#### En Windows (PowerShell o CMD):
```bash
# Si MySQL está instalado como servicio
net start MySQL80

# O si usas MySQL Community Server
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld"
```

#### En Linux/macOS:
```bash
# Usando brew (macOS)
brew services start mysql

# O manual
mysql.server start
```

#### Verificar que MySQL está corriendo:
```bash
mysql -u root -e "SELECT VERSION()"
```

---

### 2. Crear usuario y configurar acceso (opcional)

```bash
mysql -u root
```

```sql
-- Crear usuario si quieres contraseña
CREATE USER 'comisiones'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON comisiones_db.* TO 'comisiones'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Si no quieres usuario nuevo, el archivo `.env` usa `root` sin contraseña.

---

### 3. Instalar y ejecutar Backend

```bash
cd backend
npm install
npm run dev
```

El servidor estará disponible en:
- **API Base**: `http://localhost:5000/api`
- **Swagger (Documentación)**: `http://localhost:5000/api-docs`

---

## 📚 Documentación de Endpoints

### Autenticación

#### Registrar usuario
```bash
curl -X POST http://localhost:5000/api/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "miPassword123",
    "nombre": "Juan Pérez"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "miPassword123"
  }'
```

**Respuesta (guarda el token):**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Pérez",
    "rol": "usuario"
  }
}
```

#### Obtener Perfil
```bash
curl -X GET http://localhost:5000/api/auth/perfil \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

### Comisiones

#### Crear Comisión
```bash
curl -X POST http://localhost:5000/api/comisiones \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

#### Obtener todas las Comisiones
```bash
curl -X GET http://localhost:5000/api/comisiones \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Obtener Comisión por ID
```bash
curl -X GET http://localhost:5000/api/comisiones/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Actualizar Comisión
```bash
curl -X PUT http://localhost:5000/api/comisiones/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "lugar": "Arequipa",
    "fecha_inicio": "2026-02-20"
    ...resto de campos
  }'
```

#### Eliminar Comisión
```bash
curl -X DELETE http://localhost:5000/api/comisiones/1 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: users
```sql
id (INT, PK)
email (VARCHAR, UNIQUE)
password (VARCHAR)
nombre (VARCHAR)
rol (ENUM: admin, usuario)
activo (BOOLEAN)
creado_en (TIMESTAMP)
actualizado_en (TIMESTAMP)
```

### Tabla: comisiones
```sql
id (INT, PK)
ambito (VARCHAR)
lugar (VARCHAR)
fecha_inicio (DATE)
fecha_fin (DATE)
comisionados (VARCHAR)
actividades (TEXT)
dias (INT)
costo_xdia (DECIMAL)
costo_pasajes_nacional (DECIMAL)
costo_pasajes_local (DECIMAL)
costo_combustible (DECIMAL)
costo_comision_por_comisionado (DECIMAL)
costo_total_comision (DECIMAL)
observacion (TEXT)
usuario_id (INT, FK)
creado_en (TIMESTAMP)
actualizado_en (TIMESTAMP)
```

---

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   ├── database.js       # Configuración MySQL
│   └── swagger.js        # Configuración Swagger
├── controllers/
│   ├── authController.js # Lógica de autenticación
│   └── commissionsController.js # Lógica de comisiones
├── middleware/
│   └── auth.js          # Middleware JWT
├── routes/
│   ├── auth.js          # Rutas de autenticación
│   └── commissions.js   # Rutas de comisiones
├── .env                 # Variables de entorno
├── package.json
└── server.js            # Punto de entrada
```

---

## 🔒 Seguridad

- ✅ **JWT**: Tokens con expiración de 7 días
- ✅ **Bcrypt**: Contraseñas encriptadas
- ✅ **CORS**: Habilitado para desarrollo
- ⚠️ **JWT_SECRET**: Cambiar en producción

---

## 🧪 Testing con Swagger

1. Abre: `http://localhost:5000/api-docs`
2. Haz clic en **"Authorize"** (ícono de candado)
3. Ingresa tu token JWT: `Bearer tu_token_aqui`
4. Prueba los endpoints directamente desde Swagger UI

---

## 📝 Variables de Entorno (.env)

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=comisiones_db
DB_PORT=3306

# JWT
JWT_SECRET=tu_super_secret_key_cambiar_en_produccion_2024
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
```

---

## 🚀 Próximos Pasos

1. ✅ Backend completado
2. ⏳ Frontend (Material Dashboard React)
   - Login Component
   - Dashboard
   - Comisiones CRUD
3. ⏳ Reportes (PDF/Excel)

---

## ❓ Soporte

Si tienes problemas, verifica:
1. MySQL está corriendo: `mysql -u root -e "SELECT 1"`
2. Puerto 5000 disponible: `netstat -an | grep 5000`
3. Variables de entorno configuradas en `.env`

