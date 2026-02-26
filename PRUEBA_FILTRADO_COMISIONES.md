# 📋 Prueba de Filtrado de Comisiones por Rol

## Cambios Realizados

### 1. **Backend - Modelo Comision.js**
✅ Actualizado método `listar()`:
- Cambió `visitador` a `administrativo`
- **Usuarios regulares**: SIEMPRE ven SOLO sus propias comisiones
- **Administrativo**: Ve SOLO comisiones APROBADAS
- **Jefe**: Ve TODAS las comisiones
- **Admin**: Ve TODAS las comisiones

### 2. **Backend - Controlador comisionController.js**
✅ Actualizado método `listarComisiones()`:
```javascript
// Si es usuario regular, SIEMPRE ve solo sus propias comisiones
if (rolUsuario === 'usuario') {
  usuarioId = req.user.id;
}
```

Esto asegura que:
- ✅ Usuarios regulares (dkong, carcos, etc.) ven SOLO sus comisiones
- ✅ No necesitan pasar `solo_mias=true` - es automático
- ✅ Jefe y Admin pueden ver todas las comisiones
- ✅ Administrativo (rfloresa) ve solo las APROBADAS

## Lógica de Filtrado

### Por Rol:

| Rol | Comisiones que ve |
|-----|-------------------|
| **admin** | TODAS |
| **jefe** | TODAS |
| **usuario** | SOLO las SUYAS (usuario_id = req.user.id) |
| **administrativo** | SOLO las APROBADAS (aprobacion_estado = 'APROBADA') |

## URLs de Prueba

```bash
# Login como usuario regular (DKONG)
POST http://localhost:5000/api/auth/login
Body: { "email": "dhayro27@gmail.com", "password": "Autoridad1" }

# Obtener comisiones (verá SOLO sus comisiones)
GET http://localhost:5000/api/comisiones
Header: Authorization: Bearer {token}

# Resultado esperado:
# Si DKONG creó 2 comisiones, verá exactamente 2 comisiones
# (no verá las de otros usuarios)
```

```bash
# Login como administrativo (RFLORES)
POST http://localhost:5000/api/auth/login
Body: { "email": "rfloresa@ana.gob.pe", "password": "Autoridad1" }

# Obtener comisiones (verá SOLO las APROBADAS)
GET http://localhost:5000/api/comisiones
Header: Authorization: Bearer {token}

# Resultado esperado:
# Verá SOLO las comisiones con aprobacion_estado = 'APROBADA'
```

```bash
# Login como Jefe (SNUNEZ)
POST http://localhost:5000/api/auth/login
Body: { "email": "snunez@ana.gob.pe", "password": "Autoridad1" }

# Obtener comisiones (verá TODAS)
GET http://localhost:5000/api/comisiones
Header: Authorization: Bearer {token}

# Resultado esperado:
# Verá TODAS las comisiones independientemente del usuario o estado
```

## Frontend - React

En `src/pages/Dashboard/DashboardUsuario.js`:
```javascript
// Ya no necesita pasar solo_mias=true
const comisiones = await api.obtenerComisiones();
// El backend AUTOMÁTICAMENTE filtrará por usuario
```

## Verificación de Cambios

✅ `backend/models/Comision.js` - Línea ~98
- Cambió `visitador` a `administrativo`
- Lógica de filtrado por rol implementada

✅ `backend/controllers/comisionController.js` - Línea ~177
- Método `listarComisiones()` actualizado
- Los usuarios regulares SIEMPRE ven solo sus comisiones

## Próximas Pruebas

1. ✅ Login con usuario regular (DKONG)
2. ✅ Ir a http://localhost:3000/gestion/comisiones
3. ✅ Verificar que ve SOLO sus comisiones
4. ✅ Login con administrativo (RFLORES)
5. ✅ Verificar que ve SOLO comisiones APROBADAS
6. ✅ Login con jefe (SNUNEZ)
7. ✅ Verificar que ve TODAS las comisiones
