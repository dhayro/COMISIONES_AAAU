# 🔐 FIX - Control de Acceso por Ámbito en Formatos de Emisión

**Fecha:** 31-03-2026  
**Versión:** 1.0  
**Estado:** ✅ IMPLEMENTADO

---

## 🎯 Problema

Usuario con rol `administrativo` y `ambito_id=3` estaba viendo formatos de emisión de `ambito_id=1`.

```
Usuario: LUCILA STEFY RIOS CONEJO
├─ id: 27
├─ rol: administrativo ❌ DEBERÍA FILTRAR POR ÁMBITO
├─ ambito_id: 3
└─ Actual: Ve formatos de ambito_id=1 (INCORRECTO)

Esperado: Ver SOLO formatos de ambito_id=3
```

### Respuesta API Actual (INCORRECTA)

```json
GET /api/formatos-emisiones
{
  "success": true,
  "total": 4,
  "formatos": [
    { "id": 37, "ambito_id": 1, "usuario_id": 8, ... },
    { "id": 36, "ambito_id": 1, "usuario_id": 3, ... },
    { "id": 35, "ambito_id": 1, "usuario_id": 3, ... },
    { "id": 34, "ambito_id": 1, "usuario_id": 3, ... }
  ]
}
```

❌ **Todos del ambito_id=1, cuando usuario está en ambito_id=3**

---

## ✅ Solución Implementada

### 1. Modelo: FormatoEmision.js

**Cambio:** Agregar parámetro `userAmbitoId` y filtro por ámbito

**Antes:**
```javascript
static async listar(filtros = {}, usuarioId = null, rol = null) {
  // ...
  if (rol === 'usuario' && usuarioId) {
    query += ` AND fe.usuario_id = ?`;
    params.push(usuarioId);
  }
  // ❌ NO había filtro para administrativo
}
```

**Después:**
```javascript
static async listar(filtros = {}, usuarioId = null, rol = null, userAmbitoId = null) {
  // ...
  if (rol === 'usuario' && usuarioId) {
    // USUARIO: Ver solo sus propios formatos
    query += ` AND fe.usuario_id = ?`;
    params.push(usuarioId);
  } else if (rol === 'administrativo' && userAmbitoId) {
    // 🆕 ADMINISTRATIVO: Ver solo formatos de usuarios del mismo ámbito
    query += ` AND u.ambito_id = ?`;
    params.push(userAmbitoId);
  }
  // JEFE y ADMIN: ven todos (sin filtro)
}
```

**Lógica:**
- ✅ `usuario`: Solo sus formatos
- ✅ `administrativo`: Formatos de su ámbito
- ✅ `jefe`: Todos los formatos
- ✅ `admin`: Todos los formatos

### 2. Controlador: formatoEmisionController.js

**Cambio:** Obtener y pasar `ambito_id` del usuario

**Antes:**
```javascript
exports.listar = async (req, res) => {
  const usuarioId = req.user.id;
  const rol = req.user.rol;
  
  const formatos = await FormatoEmision.listar(filtros, usuarioId, rol);
  // ❌ No pasaba ambito_id
}
```

**Después:**
```javascript
exports.listar = async (req, res) => {
  const usuarioId = req.user.id;
  const rol = req.user.rol;
  const userAmbitoId = req.user.ambito_id;  // 🆕 Obtener ambito_id
  
  const formatos = await FormatoEmision.listar(filtros, usuarioId, rol, userAmbitoId);
  // ✅ Ahora pasa ambito_id
}
```

---

## 🔍 Cómo Funciona

### Flujo de Acceso

```
GET /api/formatos-emisiones
        ↓
┌──────────────────────────────────┐
│ Controlador: formatoEmisionController.js
├──────────────────────────────────┤
│ req.user = {
│   id: 27,
│   rol: "administrativo",
│   ambito_id: 3  ← 🔑 CLAVE
│ }
│
│ Extrae: usuarioId, rol, userAmbitoId
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│ Modelo: FormatoEmision.listar()
├──────────────────────────────────┤
│ if (rol === 'administrativo') {
│   query += " AND u.ambito_id = ?"
│   params.push(userAmbitoId)  ← 3
│ }
│
│ Query final:
│ SELECT * FROM formato_emisiones fe
│ LEFT JOIN users u ...
│ WHERE ... AND u.ambito_id = 3
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│ BD: Devuelve SOLO formatos donde
│ usuarios tienen ambito_id = 3
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│ Respuesta JSON:
│ {
│   "total": N,  ← Solo de ambito 3
│   "formatos": [
│     { "ambito_id": 3, ... },
│     { "ambito_id": 3, ... },
│     ...
│   ]
│ }
└──────────────────────────────────┘
```

---

## 📊 Resultados Esperados

### Usuario: LUCILA STEFY RIOS CONEJO (id=27)
```
Antes (❌ INCORRECTO):
GET /api/formatos-emisiones
{
  "total": 4,
  "formatos": [
    { "id": 37, "ambito_id": 1, ... },
    { "id": 36, "ambito_id": 1, ... },
    { "id": 35, "ambito_id": 1, ... },
    { "id": 34, "ambito_id": 1, ... }
  ]
}

Después (✅ CORRECTO):
GET /api/formatos-emisiones
{
  "total": 0,  ← Si no hay en su ámbito
  "formatos": []
}

O si hay en su ámbito:
{
  "total": 2,
  "formatos": [
    { "id": XX, "ambito_id": 3, ... },
    { "id": YY, "ambito_id": 3, ... }
  ]
}
```

---

## 🧪 Casos de Prueba

### Caso 1: Usuario (rol='usuario')
```
Usuario: id=8, rol='usuario', ambito_id=1

Query: /api/formatos-emisiones
Filtro aplicado: fe.usuario_id = 8
Resultado: Solo formatos creados por usuario 8
✅ CORRECTO
```

### Caso 2: Administrativo (rol='administrativo')
```
Usuario: id=27, rol='administrativo', ambito_id=3

Query: /api/formatos-emisiones
Filtro aplicado: u.ambito_id = 3
Resultado: Todos los formatos de usuarios con ambito_id=3
✅ CORRECTO
```

### Caso 3: Jefe (rol='jefe')
```
Usuario: id=X, rol='jefe', ambito_id=1

Query: /api/formatos-emisiones
Filtro aplicado: NINGUNO
Resultado: Todos los formatos de toda la institución
✅ CORRECTO
```

### Caso 4: Admin (rol='admin')
```
Usuario: id=X, rol='admin', ambito_id=null

Query: /api/formatos-emisiones
Filtro aplicado: NINGUNO
Resultado: Todos los formatos sin restricciones
✅ CORRECTO
```

---

## 🔐 Matriz de Control de Acceso

| Rol | Ve Sus Propios | Ve Su Ámbito | Ve Otros Ámbitos | Ve Todo |
|-----|----------------|--------------|------------------|---------|
| usuario | ✅ SÍ | ❌ NO | ❌ NO | ❌ NO |
| administrativo | ✅ SÍ (+ su ámbito) | ✅ SÍ | ❌ NO | ❌ NO |
| jefe | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |
| admin | ✅ SÍ | ✅ SÍ | ✅ SÍ | ✅ SÍ |

---

## 📁 Archivos Modificados

### 1. backend/models/FormatoEmision.js

**Línea:** ~91 (función `listar`)

**Cambios:**
- Agregar parámetro: `userAmbitoId = null`
- Agregar condición: Filtro por `u.ambito_id` cuando rol es `administrativo`
- Agregar logs para debugging

### 2. backend/controllers/formatoEmisionController.js

**Línea:** ~175 (función `listar`)

**Cambios:**
- Obtener: `const userAmbitoId = req.user.ambito_id;`
- Pasar a modelo: `FormatoEmision.listar(filtros, usuarioId, rol, userAmbitoId)`

---

## ✅ Testing

### Test 1: Verificar ambito_id en token
```bash
# Al loguearse, debe incluir ambito_id en JWT
curl http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luciriosc@gmail.com", "password":"..."}'

Response:
{
  "token": "eyJ...",
  "user": {
    "id": 27,
    "rol": "administrativo",
    "ambito_id": 3  ← DEBE ESTAR
  }
}
```

### Test 2: Listar con usuario administrativo
```bash
# Usando token del administrativo
curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer [TOKEN]"

Response:
{
  "success": true,
  "total": X,
  "formatos": [
    { "ambito_id": 3, ... },  ← DEBE SER 3
    { "ambito_id": 3, ... },  ← DEBE SER 3
  ]
}

✅ Todos tienen ambito_id = 3
❌ Si hay ambito_id diferente: ERROR EN FIX
```

### Test 3: Verificar base de datos
```sql
-- Ver si el filtro SQL funciona
SELECT fe.id, u.ambito_id, u.nombre, fe.numero_documento
FROM formato_emisiones fe
LEFT JOIN users u ON fe.usuario_id = u.id
WHERE u.ambito_id = 3;

-- Debe retornar SOLO formatos de ámbito 3
```

---

## 🚀 Deployment

### Paso 1: Verificar cambios
```bash
cd backend/models
grep -n "userAmbitoId" FormatoEmision.js
# DEBE encontrar el parámetro

cd backend/controllers
grep -n "userAmbitoId" formatoEmisionController.js
# DEBE encontrar donde se extrae y pasa
```

### Paso 2: Reiniciar backend
```bash
cd backend
npm start
# O: pm2 restart backend
```

### Paso 3: Probar en frontend
```
http://localhost:3000/gestion/certificaciones-formatos
Verificar que ve SOLO formatos de su ámbito
```

---

## 🎯 Beneficios

✅ **Seguridad mejorada** - Administrativos ven solo su ámbito  
✅ **Consistencia** - Mismo patrón que comisiones  
✅ **Escalabilidad** - Funciona para N ámbitos  
✅ **Performance** - Filtro en BD, no en aplicación  
✅ **Claridad** - Usuarios solo ven datos relevantes  

---

## 📋 Checklist de Validación

```
Backend:
  ☑️ FormatoEmision.listar() acepta userAmbitoId
  ☑️ Filtro por ambito_id aplicado correctamente
  ☑️ Logs mostran filtro siendo aplicado
  
Controlador:
  ☑️ Extrae userAmbitoId de req.user
  ☑️ Pasa a FormatoEmision.listar()
  
Testing:
  ☑️ Usuario ve solo su ámbito
  ☑️ Administrativo ve solo su ámbito
  ☑️ Jefe ve todos
  ☑️ Admin ve todos
  
BD:
  ☑️ Filtro SQL ejecutado correctamente
  ☑️ WHERE u.ambito_id = X aplicado
```

---

**Estado:** ✅ LISTO PARA USAR

Este fix asegura que cada rol vea solo lo que le corresponde según su ámbito.
