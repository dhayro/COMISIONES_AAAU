# ⚡ INICIO RÁPIDO - Sistema de Comisiones

**Tiempo estimado**: 5 minutos  
**Requisitos**: Node.js, npm, MySQL

---

## 🎯 Paso 1: Iniciar Backend (Terminal 1)

```bash
cd /d/COMISIONES_AAAU/backend
npm run dev
```

**✅ Espera este mensaje:**
```
✅ Conectado a MySQL
✅ Base de datos verificada/creada
🚀 SERVIDOR INICIADO EXITOSAMENTE
   http://localhost:5000
   📚 Swagger: http://localhost:5000/api-docs
```

---

## 🎨 Paso 2: Iniciar Frontend (Terminal 2)

```bash
cd /d/COMISIONES_AAAU/material-dashboard-react
npm start
```

**✅ Espera este mensaje:**
```
Compiled successfully!
Local: http://localhost:3000
```

---

## 🔐 Paso 3: Inicia Sesión

1. Abre: `http://localhost:3000`
2. Usuario: `admin`
3. Contraseña: `Autoridad1`
4. Click en "Sign In"

---

## 📋 Paso 4: Usa los Módulos

Haz click en el menú lateral → **GESTIÓN**

### 📋 Comisiones
- Ver todas las comisiones
- Crear nueva: Click "Nueva Comisión"
- Editar: Click icono ✏️
- Eliminar: Click icono 🗑️
- Filtrar: Selecciona estado

### 📍 Ámbitos
- Gestionar ámbitos (PUCALLPA, ATALAYA, etc.)
- CRUD completo

### 📊 Clasificadores  
- Gestionar partidas presupuestales
- Agregar nombre y descripción

### 👥 Usuarios
- Ver usuarios del sistema
- Crear nuevos usuarios
- Asignar roles (admin/usuario)

---

## 🧪 Paso 5: Prueba en Swagger (Opcional)

1. Abre: `http://localhost:5000/api-docs`
2. Busca un endpoint, ej: `GET /api/ambitos`
3. Click "Try it out"
4. Click "Execute"
5. Ver respuesta

**Token para probar:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkaGF5cm8ua29uZ0Bob3RtYWlsLmNvbSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2wiOiJhZG1pbiIsImlhdCI6MTc3MDM5OTU1NCwiZXhwIjoxNzcxMDA0MzU0fQ.abc123...
```

---

## 💾 Datos Pre-cargados

### Usuarios Disponibles
```
Usuario    | Contraseña   | Rol
-----------|--------------|--------
admin      | Autoridad1   | admin
dkong      | Autoridad1   | usuario
carcos     | Autoridad1   | usuario
atello     | Autoridad1   | usuario
... 22 más usuarios ...
```

### Ámbitos
```
1. ALA PUCALLPA
2. ALA ATALAYA
3. ALA TARMA
4. ALA PERENE
```

### Clasificadores (Partidas)
```
23.2.1.2.2   - PASAJES Y GASTOS DE TRANSPORTE
23.2.1.2.1   - VIÁTICOS Y ASIGNACIONES POR COMISIÓN
23.1.3.1.1   - COMBUSTIBLES Y CARBURANTES
23.199.199   - OTROS BIENES
23.2.1.299   - OTROS GASTOS
```

---

## 🔧 Soluciones Rápidas

### ❌ "Cannot connect to MySQL"
```bash
# Solución: MySQL no está corriendo
# Windows: Inicia MySQL en Servicios
# Linux: sudo service mysql start
```

### ❌ "Port 5000 already in use"
```bash
# Opción 1: Matar proceso
# Opción 2: Cambiar puerto en /backend/.env
# Opción 3: Esperar 5 minutos
```

### ❌ "Module not found"
```bash
cd /d/COMISIONES_AAAU/material-dashboard-react
npm install
npm start
```

### ❌ "Cannot find database"
```bash
# Solución automática: El servidor recrea BD al iniciar
# O ejecutar: node scripts/fix-database.js
```

---

## 📊 URLs Importantes

| Función | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| Swagger API | http://localhost:5000/api-docs |
| Health Check | http://localhost:5000/api/health |

---

## 🎯 Flujo de Uso Típico

### Crear una Comisión

```
1. Dashboard → GESTIÓN → Comisiones
2. Click "Nueva Comisión"
3. Llenar:
   - Ámbito: seleccionar
   - Lugar: escribir
   - Ruta: escribir
   - Modalidad: seleccionar
   - Fechas: seleccionar
   - Días: número
   - Costo/día: número
4. Click "Guardar"
5. ✅ Comisión creada
6. Agregar comisionados en "Agregar Comisionado"
```

### Agregar Comisionado

```
1. En detalles de comisión
2. Click "Agregar Comisionado"
3. Seleccionar:
   - Usuario: del dropdown
   - Partida: del dropdown
   - Días: número
   - Costo/día: número
4. Click "Agregar"
5. ✅ Comisionado agregado
6. Monto se calcula automáticamente
```

### Ver Estadísticas

```
1. GESTIÓN → Comisiones
2. Al pie de página verás:
   - Total de comisiones
   - Comisiones activas
   - Monto total invertido
   - Promedio por comisión
```

---

## 📚 Documentación Detallada

Para información más completa:

- `MODULOS_GESTION_FRONTEND.md` - Módulos React
- `SISTEMA_COMPLETO.md` - Descripción general
- `backend/API_DOCUMENTATION.md` - Endpoints
- `backend/DATABASE_STRUCTURE.md` - Base de datos

---

## 🆘 Ayuda Rápida

### Forgot password?
- Todas las contraseñas pre-cargadas son: `Autoridad1`

### Need new user?
- Ir a GESTIÓN → Usuarios
- Click "Nuevo Usuario"
- Llenar datos
- Click "Guardar"

### Want to test API?
- Ir a: http://localhost:5000/api-docs
- Expandir endpoint
- Click "Try it out"
- Autorizar con token
- "Execute"

### Database issues?
```bash
cd /d/COMISIONES_AAAU/backend
node scripts/fix-database.js
npm run dev
```

---

## ⏱️ Tiempos de Espera

| Acción | Tiempo |
|--------|--------|
| Backend startup | 5-10 seg |
| Frontend startup | 10-15 seg |
| Login | 2-3 seg |
| Cargar tabla | 1-2 seg |
| Crear registro | 1-2 seg |
| Eliminar registro | 1-2 seg |

---

## ✨ Próximos Pasos

Después de esto, puedes:

1. ✅ **Explorar**: Navega todos los módulos
2. ✅ **Crear**: Agrega datos de prueba
3. ✅ **Editar**: Modifica registros
4. ✅ **Eliminar**: Prueba eliminación
5. ✅ **Reportes**: Revisa estadísticas
6. ✅ **API**: Prueba endpoints en Swagger

---

## 🎓 Aprendizaje

### Para Entender el Código

1. **Backend**: `/backend/routes/comisionesRoutes.js` (563 líneas, todo documentado)
2. **Frontend**: `/src/pages/Gestion/` (4 módulos principales)
3. **API**: `/backend/controllers/` (lógica de negocio)
4. **BD**: `/backend/models/` (acceso a datos)

### Para Modificar

1. **Agregar endpoint**: Editar `routes.js`
2. **Cambiar BD**: Editar `models/`
3. **Agregar UI**: Crear componente en `/pages/`
4. **Cambiar estilos**: Usar Material-UI props

---

## 🚀 Está Listo

- ✅ Backend corriendo en `http://localhost:5000`
- ✅ Frontend corriendo en `http://localhost:3000`
- ✅ BD con datos pre-cargados
- ✅ 4 módulos de gestión funcionales
- ✅ 24+ endpoints disponibles
- ✅ Documentación completa

**¡Sistema Listo para Usar!** 🎉

---

**Tiempo total**: ~5 minutos  
**Complejidad**: Muy fácil  
**Conocimientos requeridos**: Ninguno

Si hay problemas, revisa `SISTEMA_COMPLETO.md` o la sección de Soluciones Rápidas arriba.

¡Éxito! 🚀
