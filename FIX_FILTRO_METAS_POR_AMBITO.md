# 🔐 FIX - Filtro de Metas por Ámbito en /api/metas

**Fecha:** 31-03-2026  
**Versión:** 1.0  
**Estado:** ✅ IMPLEMENTADO  
**Criticidad:** 🔴 ALTA (Control de Acceso)

---

## 🎯 Problema

Endpoint `/api/metas` devolvía **TODAS las metas** sin importar el ámbito del usuario.

```
❌ ANTES:
├─ Usuario: LUCILA STEFY RIOS CONEJO (ambito_id=3, rol=administrativo)
├─ GET /api/metas
└─ Resultado: Metas de TODOS los ámbitos (1, 2, 3, etc.)

✅ DESPUÉS:
├─ Usuario: LUCILA STEFY RIOS CONEJO (ambito_id=3, rol=administrativo)
├─ GET /api/metas
└─ Resultado: SOLO metas del ámbito 3
```

### Impacto

- 🔴 **Administrativo** veía metas de otros ámbitos
- 🔴 **Selector en frontend** mostraba todas las metas
- 🔴 **Riesgo de seguridad**: Posibilidad de asignar formato a meta de otro ámbito

---

## ✅ Solución Implementada

### Controlador: metaController.js

**Cambio:** Actualizar función `listar()` para filtrar según rol y ámbito

```javascript
// ANTES - SIN FILTRO
exports.listar = async (req, res) => {
  const metas = await Meta.listar();  // ❌ Ve todas
  res.json(metas);
};

// DESPUÉS - CON FILTRO
exports.listar = async (req, res) => {
  const rol = req.user?.rol;
  const userAmbitoId = req.user?.ambito_id;

  let metas;
  
  if (rol === 'admin') {
    // ADMIN: Ve todas las metas
    metas = await Meta.listar();
  } else if ((rol === 'administrativo' || rol === 'jefe') && userAmbitoId) {
    // ADMINISTRATIVO y JEFE: Ver solo metas de su ámbito
    metas = await Meta.listarPorAmbito(userAmbitoId);
  } else if (rol === 'usuario' && userAmbitoId) {
    // USUARIO: Ver solo metas de su ámbito
    metas = await Meta.listarPorAmbito(userAmbitoId);
  } else {
    // Sin rol: array vacío
    metas = [];
  }

  res.json(metas);
};
```

---

## 🔐 Matriz de Control de Acceso

| Rol | Ve Metas De | Cantidad |
|-----|------------|----------|
| `admin` | **TODOS los ámbitos** | Todas |
| `administrativo` | **Solo su ámbito** | Metas de su ámbito |
| `jefe` | **Solo su ámbito** | Metas de su ámbito |
| `usuario` | **Solo su ámbito** | Metas de su ámbito |

---

## 📋 Cambios Realizados

### 1. backend/controllers/metaController.js

**Línea:** ~3-10 (función `listar`)

**Modificación:**
- Obtener `rol` y `ambito_id` del usuario
- Aplicar lógica de filtrado:
  - `admin`: sin filtro
  - `administrativo`, `jefe`, `usuario`: filtrar por `ambito_id`
- Agregar logs para debugging

---

## 🧪 Flujo de Funcionamiento

### GET /api/metas (Usuario administrativo, ambito_id=3)

```
1. Request llega al controlador
   ├─ req.user.rol = "administrativo"
   └─ req.user.ambito_id = 3

2. Controlador valida rol
   ├─ ¿Es admin? NO
   ├─ ¿Es administrativo? SÍ
   └─ ✅ Llamar Meta.listarPorAmbito(3)

3. Modelo ejecuta query
   SELECT * FROM metas 
   WHERE ambito_id = 3 AND activo = 1

4. BD devuelve SOLO metas con ambito_id=3

5. Response
   {
     "id": 6,
     "nombre": "Meta 6",
     "numero_meta": "6",
     "periodo": "2026",
     "ambito_id": 3,
     "ambito_nombre": "AAA UCAYALI",
     ...
   }
```

---

## 📊 Respuesta API

### Admin
```json
GET /api/metas (rol=admin)

[
  { "id": 1, "nombre": "Meta 1", "ambito_id": 1, ... },
  { "id": 2, "nombre": "Meta 2", "ambito_id": 1, ... },
  { "id": 3, "nombre": "Meta 3", "ambito_id": 2, ... },
  { "id": 6, "nombre": "Meta 6", "ambito_id": 3, ... }
]
✅ TODAS las metas
```

### Administrativo (ambito_id=3)
```json
GET /api/metas (rol=administrativo, ambito_id=3)

[
  { "id": 6, "nombre": "Meta 6", "ambito_id": 3, ... }
]
✅ SOLO metas de su ámbito
```

### Usuario (ambito_id=1)
```json
GET /api/metas (rol=usuario, ambito_id=1)

[
  { "id": 1, "nombre": "Meta 1", "ambito_id": 1, ... },
  { "id": 2, "nombre": "Meta 2", "ambito_id": 1, ... }
]
✅ SOLO metas de su ámbito
```

---

## 🧪 Testing

### Test 1: Verificar con Usuario Administrativo

```bash
# Obtener token del administrativo (ambito_id=3)
TOKEN_ADMIN="eyJ..."

# Hacer request
curl http://localhost:3001/api/metas \
  -H "Authorization: Bearer $TOKEN_ADMIN"

# Verificar respuesta
# ✅ CORRECTO: Todos tienen ambito_id = 3
# ❌ INCORRECTO: Hay ambito_id ≠ 3
```

### Test 2: Verificar Logs

```
Logs esperados en backend:
📍 LISTAR METAS - Rol: administrativo, Ámbito: 3
🔐 Rol administrativo: mostrando solo metas del ámbito 3
✅ Metas a mostrar: 1
```

### Test 3: Frontend - Selector de Meta

```
1. Ir a http://localhost:3000/gestion/certificaciones-formatos
2. Loguear con administrativo
3. Editar un formato
4. Abrir selector "Meta"
5. Verificar:
   ✅ SOLO ve metas de su ámbito
   ❌ NO ve metas de otros ámbitos
```

---

## 🔍 Debugging

### Si sigue viendo todas las metas:

```bash
# 1. Verificar que req.user existe
# En metaController.js, agregar log:
console.log('DEBUG: req.user =', req.user);

# 2. Verificar que ambito_id está en token
curl http://localhost:3001/api/auth/login \
  -d '{"email":"...","password":"..."}'

# Response debe incluir:
# "ambito_id": 3

# 3. Verificar query en BD
SELECT * FROM metas WHERE ambito_id = 3 AND activo = 1;
```

---

## 📈 Impacto

| Aspecto | Antes | Después |
|--------|-------|---------|
| Seguridad | 🔴 Crítica | ✅ Seguro |
| Datos expuestos | 🔴 Sí | ✅ No |
| Selector en UI | ❌ Confuso | ✅ Claro |
| Control de acceso | ❌ No | ✅ Sí |

---

## 🚀 Deployment

### Pasos

1. **Verificar cambios**
   ```bash
   grep -n "Rol admin" backend/controllers/metaController.js
   # Debe encontrar el código nuevo
   ```

2. **Restart backend**
   ```bash
   npm restart  # O pm2 restart backend
   ```

3. **Testing en frontend**
   - Abrir selector de metas
   - Verificar que ve solo su ámbito

4. **Monitorear logs**
   - Primeras horas: buscar logs de "LISTAR METAS"

---

## ✅ Validación Post-Deploy

```
☑️ Admin ve todas las metas
☑️ Administrativo ve solo su ámbito
☑️ Jefe ve solo su ámbito
☑️ Usuario ve solo su ámbito
☑️ Selector en frontend funciona correctamente
☑️ No hay errores en logs
☑️ Performance normal
```

---

## 📚 Documentación Relacionada

- 📄 `FIX_CONTROL_ACCESO_AMBITO_FORMATOS.md` - Control de acceso en formatos
- 📄 `TESTING_CONTROL_ACCESO_AMBITO.md` - Guía de testing

---

**Estado:** ✅ LISTO PARA USAR

Este fix asegura que cada rol solo ve las metas que le corresponden según su ámbito.

---

**Última Actualización:** 31-03-2026
