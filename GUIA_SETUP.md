# 🚀 GUÍA DE SETUP - Sistema de Gestión de Comisiones

## Primera Ejecución / Migración del Sistema

Sigue estos pasos **en orden** para que todo funcione correctamente:

---

## 📋 REQUISITOS PREVIOS

Asegúrate de tener instalado:
- ✅ Node.js v20.13.1 o superior (descarga de https://nodejs.org)
- ✅ MySQL 5.7+ o MariaDB (via XAMPP, Docker, o instalación local)
- ✅ XAMPP con MySQL iniciado (si usas XAMPP)

---

## 🔧 PASO 1: Configurar Variables de Entorno

### Backend (.env)

Crea archivo `backend/.env`:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=comisiones_db
JWT_SECRET=7f3c9e8d2a5b1c4f6e9a2d7c3f8b1e4a9d2c5f8a1b4e7c3d6f9a2e5b8c1d4f
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### Frontend (.env)

Crea archivo `material-dashboard-react/.env`:

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📦 PASO 2: Instalar Dependencias

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd material-dashboard-react
npm install
```

---

## 🗄️ PASO 3: Setup de Base de Datos (IMPORTANTE)

### Opción A: Setup Automático (RECOMENDADO)

Ejecuta el script que carga todo automáticamente:

```bash
cd backend
node reset-db.js
```

**¿Qué hace?**
- ✅ Elimina BD antigua (si existe)
- ✅ Crea BD nueva limpia
- ✅ Crea tablas (users, comisiones)
- ✅ Carga 26 usuarios con username
- ✅ Todos con contraseña: `Autoridad1`

**Resultado esperado:**
```
🔄 Reseteando base de datos...
🗑️  Eliminando BD anterior...
📝 Creando BD nueva...
📋 Creando tabla users...
📋 Creando tabla comisiones...
👥 Insertando 26 usuarios...

✅ @admin - Administrador Sistema
✅ @dkong - DHAYRO KONG TORRES
✅ @carcos - CAROL MELANI ARCOS BINDER
... (22 usuarios más)

✅ BD RESETEADA EXITOSAMENTE
```

### Opción B: Setup Manual

Si prefieres no eliminar la BD existente:

```bash
cd backend
npm run setup-db
```

Luego inserta usuarios:

```bash
cd backend
node insert-users.js
```

---

## 🚀 PASO 4: Iniciar Servidores

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

**Resultado esperado:**
```
✅ Conectado a MySQL
✅ Base de datos verificada/creada
✅ Tabla users verificada/creada
✅ Tabla comisiones verificada/creada

🚀 SERVIDOR INICIADO EXITOSAMENTE
http://localhost:5000
📚 Swagger: http://localhost:5000/api-docs
```

### Terminal 2: Frontend

```bash
cd material-dashboard-react
npm start
```

**Resultado esperado:**
```
Compiled successfully!

You can now view material-dashboard-2-react in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## ✅ PASO 5: Verificación

### 1. Verificar API

Abre en navegador:
```
http://localhost:5000/api-docs
```

Deberías ver Swagger con endpoints documentados.

### 2. Verificar Frontend

Abre en navegador:
```
http://localhost:3000
```

Deberías ver pantalla de login.

### 3. Prueba de Login

- **Usuario:** `admin`
- **Contraseña:** `Autoridad1`
- Haz click "Iniciar Sesión"
- Deberías ver el dashboard

---

## 📊 Esquema de Base de Datos Creado

### Tabla: users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,  -- Login field
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,         -- Bcrypt hashed
  nombre VARCHAR(100) NOT NULL,
  rol ENUM('admin', 'usuario'),
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP,
  actualizado_en TIMESTAMP
)
```

**26 usuarios precargados:**
- 1 administrador: `@admin`
- 25 usuarios: `@dkong`, `@carcos`, `@atello`, etc.
- **Contraseña común:** `Autoridad1`

### Tabla: comisiones

```sql
CREATE TABLE comisiones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ambito VARCHAR(100),
  lugar VARCHAR(100) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  comisionados VARCHAR(255) NOT NULL,
  actividades TEXT,
  dias INT,
  costo_xdia DECIMAL(10,2),
  costo_pasajes_nacional DECIMAL(10,2),
  costo_pasajes_local DECIMAL(10,2),
  costo_combustible DECIMAL(10,2),
  costo_comision_por_comisionado DECIMAL(10,2),
  costo_total_comision DECIMAL(10,2),
  observacion TEXT,
  usuario_id INT NOT NULL,  -- Foreign key to users
  creado_en TIMESTAMP,
  actualizado_en TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES users(id)
)
```

---

## 🎯 Scripts Disponibles

### Backend

```bash
npm run dev              # Iniciar en modo desarrollo (nodemon)
npm run setup-db        # Solo crear tablas (sin borrar)
node reset-db.js        # BORRAR BD y recrear con usuarios
node insert-users.js    # Insertar usuarios en BD existente
```

### Frontend

```bash
npm start               # Iniciar servidor desarrollo
npm run build          # Build para producción
npm run lint           # Verificar código
```

---

## 🔐 Endpoints API Principales

### Autenticación

```
POST /api/auth/login
Body: { username: "admin", password: "Autoridad1" }
Response: { token: "...", usuario: {...} }
```

### Comisiones (requieren token JWT)

```
POST   /api/comisiones          - Crear
GET    /api/comisiones          - Listar
GET    /api/comisiones/:id      - Obtener
PUT    /api/comisiones/:id      - Actualizar
DELETE /api/comisiones/:id      - Eliminar
```

---

## 🐛 Solución de Problemas

### Problema: "Cannot connect to database"

```bash
# Verifica que MySQL esté corriendo
# En Windows, abre XAMPP y activa MySQL

# Prueba conexión:
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({host:'localhost', user:'root', password:''})
  .then(() => console.log('✅ MySQL OK'))
  .catch(e => console.log('❌', e.message));
"
```

### Problema: "Port 3000 already in use"

```bash
# Mata proceso en puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

### Problema: "npm: command not found"

Reinstala Node.js desde https://nodejs.org

---

## 📋 Checklist de Setup

- [ ] Node.js instalado (`node -v`)
- [ ] MySQL corriendo (`mysql -u root`)
- [ ] Backend/.env creado con datos correctos
- [ ] Frontend/.env creado
- [ ] Backend: `npm install` completado
- [ ] Frontend: `npm install` completado
- [ ] Ejecutado: `node reset-db.js`
- [ ] Backend: `npm run dev` iniciado en Terminal 1
- [ ] Frontend: `npm start` iniciado en Terminal 2
- [ ] Frontend accesible en http://localhost:3000
- [ ] Swagger accesible en http://localhost:5000/api-docs
- [ ] Login funciona con `admin` / `Autoridad1`

---

## ✨ Resumen: Comandos Completos Setup

```bash
# 1. Ir a directorio del proyecto
cd /ruta/a/COMISIONES_AAAU

# 2. Backend setup
cd backend
npm install
node reset-db.js        # BORRAR Y RECREAR BD (primera vez)
npm run dev            # Iniciar servidor

# (Abrir NUEVA terminal)

# 3. Frontend setup
cd material-dashboard-react
npm install
npm start              # Iniciar servidor

# 4. Abrir navegador
http://localhost:3000
# Login: admin / Autoridad1
```

---

**¡Listo!** 🎉 Tu sistema está completamente configurado y funcionando.

Para cualquier duda sobre los comandos específicos, consulta esta guía nuevamente.

