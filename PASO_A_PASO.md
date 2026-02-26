# 🎬 PASO A PASO - Setup Completo del Sistema

## 📺 Video texto: Instalación en 10 minutos

---

### ✅ PASO 1: Verificar Requisitos (1 minuto)

#### Abre Command Prompt / Terminal y ejecuta:

```bash
node -v
```

Resultado esperado:
```
v20.13.1  ✅
```

Si no aparece, descarga Node.js desde https://nodejs.org

---

#### Verifica MySQL

Abre XAMPP Control Panel:
- Busca MySQL
- Haz click en START
- Espera a que diga "Running"

O desde terminal:
```bash
mysql -u root
```

Si conecta → MySQL está OK ✅

---

### ✅ PASO 2: Descargar Proyecto (1 minuto)

Si no lo tienes, descarga:
```
d:\COMISIONES_AAAU\
```

Verifica que existan estos directorios:
```
✅ backend/
✅ material-dashboard-react/
```

---

### ✅ PASO 3: Backend - Instalar Dependencias (3 minutos)

Abre **Terminal 1**:

```bash
cd d:\COMISIONES_AAAU\backend
```

```bash
npm install
```

Espera a que termine (verás muchas líneas de instalación).

Resultado esperado:
```
added XXX packages in XXs
```

---

### ✅ PASO 4: Backend - Crear Base de Datos (2 minutos)

En la misma **Terminal 1**:

```bash
node reset-db.js
```

Verás algo así:

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
... (23 usuarios más)

✅ BD RESETEADA EXITOSAMENTE
Usuarios: 26
Contraseña: Autoridad1
```

**¡SI VES ESTO, LA BD ESTÁ LISTA! ✅**

---

### ✅ PASO 5: Backend - Iniciar Servidor (2 minutos)

En **Terminal 1**, sin cerrar, ejecuta:

```bash
npm run dev
```

Espera a ver esto:

```
✅ Conectado a MySQL
✅ Base de datos verificada/creada
✅ Tabla users verificada/creada
✅ Tabla comisiones verificada/creada

🚀 SERVIDOR INICIADO EXITOSAMENTE
http://localhost:5000
📚 Swagger: http://localhost:5000/api-docs
```

**¡BACKEND LISTO! ✅**

⚠️ **NO CIERRES ESTA TERMINAL** - El servidor sigue corriendo aquí.

---

### ✅ PASO 6: Frontend - Nueva Terminal

Abre **Terminal 2** (nueva ventana):

```bash
cd d:\COMISIONES_AAAU\material-dashboard-react
```

```bash
npm install
```

Espera a que termine (puede tomar 2-3 minutos).

---

### ✅ PASO 7: Frontend - Iniciar Servidor (1 minuto)

En **Terminal 2**:

```bash
npm start
```

El navegador debería abrirse automáticamente con:
```
http://localhost:3000
```

Si no se abre, abrelo manualmente.

Verás la pantalla de **LOGIN** ✅

---

### ✅ PASO 8: Probar Login (1 minuto)

En la pantalla de login que ves en http://localhost:3000:

```
Usuario: admin
Contraseña: Autoridad1
```

Hace click en **"Iniciar Sesión"**

Si todo funciona, verás el **DASHBOARD** ✅

---

### ✅ PASO 9: Probar Funcionalidades (2 minutos)

#### En el dashboard:

1. Click en **"Comisiones"** en el menú lateral
2. Deberías ver una tabla vacía
3. Click en botón **"Nueva Comisión"**
4. Llena los campos:
   - Ámbito: Nacional
   - Lugar: Lima
   - Fecha inicio: 2026-02-15
   - Fecha fin: 2026-02-18
   - Comisionados: Juan, María
   - Actividades: Reunión importante
   - Costos: (llenar con números)
5. Click **"Guardar"**
6. Debería aparecer en la tabla

**¡TODO FUNCIONA! ✅**

---

### ✅ PASO 10: Probar API Swagger (1 minuto)

Abre en navegador:
```
http://localhost:5000/api-docs
```

Deberías ver documentación de API.

Busca endpoint **POST /auth/login**:
1. Click en el endpoint
2. Click **"Try it out"**
3. En el body, cambia a:
```json
{
  "username": "admin",
  "password": "Autoridad1"
}
```
4. Click **"Execute"**
5. Verás respuesta con JWT token ✅

---

## 📋 Checklist de Verificación

- [ ] Node.js instalado (`node -v` ≥ 20)
- [ ] MySQL corriendo (XAMPP)
- [ ] Terminal 1: Backend con `npm run dev` ✅
- [ ] Terminal 2: Frontend con `npm start` ✅
- [ ] http://localhost:3000 abre pantalla login
- [ ] http://localhost:5000/api-docs accesible
- [ ] Login funciona con admin/Autoridad1
- [ ] Dashboard muestra opciones
- [ ] Puedo crear comisión
- [ ] Comisión aparece en tabla

**Si todas son ✅ → Sistema completamente funcional**

---

## 🎯 Pasos Rápidos (Resumen)

```bash
# Terminal 1
cd backend
npm install
node reset-db.js
npm run dev

# Terminal 2
cd material-dashboard-react
npm install
npm start

# Navegador
http://localhost:3000
# Login: admin / Autoridad1
```

---

## ⏱️ Tiempos Estimados

| Paso | Tiempo | Total |
|------|--------|-------|
| 1. Verificar requisitos | 1 min | 1 min |
| 2. Descargar | 1 min | 2 min |
| 3. Backend npm install | 3 min | 5 min |
| 4. Base de datos | 2 min | 7 min |
| 5. Backend npm run dev | 1 min | 8 min |
| 6. Frontend npm install | 2 min | 10 min |
| 7. Frontend npm start | 1 min | 11 min |
| 8. Probar login | 1 min | 12 min |
| 9. Probar funciones | 2 min | 14 min |
| 10. Probar API | 1 min | 15 min |

**Total estimado: 15 minutos** ⏱️

---

## 🆘 Si Algo Sale Mal

### Error: "MySQL Connection refused"
```bash
# Abre XAMPP y haz start en MySQL
# O ejecuta en terminal:
mysql -u root
```

### Error: "Port 3000 already in use"
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <número> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

### Error: "npm: command not found"
```bash
# Reinstala Node.js desde nodejs.org
# Cierra terminal y abre una nueva
```

### Error: "Cannot connect to database"
```bash
# Verifica .env tenga:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=comisiones_db

# Y que MySQL esté corriendo
```

### Frontend muestra "Cannot GET /"
```bash
# Espera a que webpack termine de compilar
# Verifica que npm start esté ejecutándose sin errores
# Recarga página (F5)
```

---

## 🎓 Próximas Acciones

Después de verificar que todo funciona:

1. **Agregar más usuarios:** Edita `backend/reset-db.js`
2. **Cambiar puerto backend:** Edita `backend/.env` PORT=5000
3. **Cambiar API URL frontend:** Edita `material-dashboard-react/.env`
4. **Agregar campos a comisión:** Modifica tablas SQL
5. **Deploy a producción:** Ver guía de deployment

---

## 📞 Soporte

Si algo no funciona:

1. Verifica todos los pasos arriba
2. Consulta `GUIA_SETUP.md` (más detallado)
3. Verifica logs en terminal (busca mensajes rojos)
4. Verifica puertos 3000 y 5000 estén disponibles

---

**¿Listo? ¡Sigue los 10 pasos arriba y tu sistema estará funcionando!** 🚀

