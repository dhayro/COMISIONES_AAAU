# ✅ TESTING RÁPIDO - Control de Acceso por Ámbito

**Tiempo:** 5-10 minutos  
**Objetivo:** Validar que administrativos ven solo su ámbito

---

## 🧪 TEST 1: Verificar Token Tiene ambito_id

```bash
# Terminal: Backend debe estar corriendo

# Hacer login con usuario administrativo
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luciriosc@gmail.com",
    "password": "contraseña_aqui"
  }'

# Resultado esperado:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 27,
    "email": "luciriosc@gmail.com",
    "nombre": "LUCILA STEFY RIOS CONEJO",
    "rol": "administrativo",
    "ambito_id": 3  ← ✅ DEBE ESTAR
  }
}

✅ SI: ambito_id está presente → OK
❌ SI: ambito_id NO está o es NULL → ERROR
```

---

## 🧪 TEST 2: Listar Formatos con Usuario Administrativo

```bash
# Guardar el token del paso anterior
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Hacer request de listar
curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Resultado esperado:
{
  "success": true,
  "total": X,  ← Número de formatos de su ámbito
  "formatos": [
    {
      "id": 123,
      "ambito_id": 3,     ← ✅ DEBE SER 3 (su ámbito)
      "usuario_nombre": "DHAYRO KONG TORRES",
      "numero_documento": "014-DKT-2026",
      ...
    },
    {
      "id": 124,
      "ambito_id": 3,     ← ✅ DEBE SER 3 (su ámbito)
      ...
    }
  ]
}

✅ CORRECTO: Todos tienen ambito_id = 3
❌ INCORRECTO: Hay formatos con ambito_id ≠ 3
```

---

## 🧪 TEST 3: Verificar Logs en Backend

```bash
# Ver console del backend mientras haces el request anterior

# Logs esperados:
🔐 FILTRO: ADMINISTRATIVO (ambito_id=3)

✅ SI: Log aparece → Filter se aplicó
❌ SI: Log NO aparece → Filter no se aplicó
```

---

## 🧪 TEST 4: Comprobación en Base de Datos

```sql
-- En tu cliente MySQL/MariaDB

-- 1️⃣ Ver usuarios del ámbito 3
SELECT id, nombre, email, rol, ambito_id 
FROM users 
WHERE ambito_id = 3;

-- Resultado (ejemplo):
| id | nombre      | email              | rol             | ambito_id |
|----|-------------|------------------|-----------------|-----------|
| 27 | LUCILA S... | luciriosc@g...    | administrativo  | 3         |
| 28 | OTRO USER   | otro@gmail.com     | usuario         | 3         |

-- 2️⃣ Ver formatos de usuarios del ámbito 3
SELECT fe.id, fe.numero_documento, u.nombre, u.ambito_id
FROM formato_emisiones fe
LEFT JOIN users u ON fe.usuario_id = u.id
WHERE u.ambito_id = 3;

-- Resultado: Solo formatos de usuarios con ambito_id = 3

-- 3️⃣ Ver formatos que NOTIENE ambito_id 3
SELECT fe.id, fe.numero_documento, u.nombre, u.ambito_id
FROM formato_emisiones fe
LEFT JOIN users u ON fe.usuario_id = u.id
WHERE u.ambito_id != 3;

-- Estos NO deben aparecer en el API para admin de ámbito 3
```

---

## 🧪 TEST 5: Frontend - Gestión de Certificaciones

```
1. Ir a http://localhost:3000/gestion/certificaciones-formatos

2. Loguear con usuario administrativo (ambito_id=3)
   Email: luciriosc@gmail.com

3. Verificar tabla:
   ✅ SI: Solo ve formatos de su ámbito
   ✅ SI: Número de filas es correcto
   ❌ SI: Ve formatos de otros ámbitos → ERROR

4. Intentar editar un formato:
   ✅ SI: Puede editar (es del su ámbito)
   ❌ SI: Error (no debería poder ver)
```

---

## 🧪 TEST 6: Comparar Diferentes Roles

### Usuario Regular (rol='usuario')
```bash
# Login con usuario normal
TOKEN_USER="..."

curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer $TOKEN_USER"

# Resultado esperado:
{
  "total": N,  ← Solo SUS formatos
  "formatos": [
    { "usuario_nombre": "SU NOMBRE", ... }
  ]
}

✅ Ve solo SUS formatos (no de otros usuarios del mismo ámbito)
```

### Administrativo (rol='administrativo')
```bash
# Login con administrativo
TOKEN_ADMIN_ROLE="..."

curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer $TOKEN_ADMIN_ROLE"

# Resultado esperado:
{
  "total": M,  ← Todos del SU ÁMBITO
  "formatos": [
    { "usuario_nombre": "USER A", "ambito_id": 3, ... },
    { "usuario_nombre": "USER B", "ambito_id": 3, ... }
  ]
}

✅ Ve formatos de TODOS los usuarios de su ámbito
```

### Jefe (rol='jefe')
```bash
# Login con jefe
TOKEN_JEFE="..."

curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer $TOKEN_JEFE"

# Resultado esperado:
{
  "total": K,  ← TODOS los formatos
  "formatos": [
    { "ambito_id": 1, ... },
    { "ambito_id": 2, ... },
    { "ambito_id": 3, ... },
    { "ambito_id": 1, ... }
  ]
}

✅ Ve todos los formatos de todos los ámbitos
```

### Admin (rol='admin')
```bash
# Login con admin
TOKEN_ADMIN="..."

curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer $TOKEN_ADMIN"

# Resultado esperado:
{
  "total": K,  ← TODOS los formatos
  "formatos": [ ... ]
}

✅ Ve todos sin restricciones
```

---

## 🎯 Resultado Final Esperado

| Rol | Formatos Visibles |
|-----|------------------|
| usuario (id=8) | Solo sus formatos |
| administrativo (ambito_id=3) | Todos los de ambito_id=3 |
| jefe | Todos los formatos |
| admin | Todos los formatos |

---

## ❌ Si Algo Falla

### Problema: Usuario administrativo sigue viendo todos los ámbitos

```
Causa posible: userAmbitoId no se pasa correctamente

Solución:
1. Verificar logs: busca "🔐 FILTRO: ADMINISTRATIVO"
2. Si NO aparece: userAmbitoId es NULL o no se pasa
3. Revisar: req.user.ambito_id en controlador

Debugging:
- Agregar console.log en formatoEmisionController.js línea 182
  console.log('DEBUG: userAmbitoId =', userAmbitoId, 'rol =', rol);
```

### Problema: Falta ambito_id en el token JWT

```
Causa: El campo no se incluye al generar el JWT

Solución:
1. Revisar: backend/config/auth.js o middleware de autenticación
2. Asegurar que ambito_id se incluya en el payload JWT
3. Formato esperado:
   {
     id: 27,
     rol: "administrativo",
     ambito_id: 3  ← Debe estar
   }
```

### Problema: Base de datos no tiene ambito_id en users

```
Solución:
1. Verificar estructura:
   DESCRIBE users;
   ✅ Debe tener columna: ambito_id INT

2. Si no existe:
   ALTER TABLE users ADD COLUMN ambito_id INT;
   
3. Llenar valores:
   UPDATE users SET ambito_id = 1 WHERE rol = 'usuario';
   -- Ajustar según valores reales
```

---

## ✅ Checklist Final

```
Después de hacer los tests:

☑️ Token incluye ambito_id
☑️ Usuario ve solo su ámbito
☑️ Administrativo ve su ámbito completo
☑️ Jefe ve todos
☑️ Admin ve todos
☑️ Logs muestran filtros aplicados
☑️ Base de datos devuelve datos correctos
☑️ Frontend muestra valores correctos
☑️ Sin errores 403 o 401
☑️ Performance normal (sin lentitud)
```

---

## 🚀 Próximos Pasos

1. **Si TODO PASA:** Deployment a producción
2. **Si ALGO FALLA:** Revisar sección "Si Algo Falla" arriba
3. **Monitoreo:** Ver logs en backend durante primeras horas

---

**Tiempo estimado:** 5-10 minutos  
**Complejidad:** 🟢 Baja  
**Impacto:** 🔴 Alto (seguridad)
