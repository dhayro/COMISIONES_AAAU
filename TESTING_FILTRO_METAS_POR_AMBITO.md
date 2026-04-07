# ✅ TESTING RÁPIDO - Filtro de Metas por Ámbito

**Tiempo:** 5 minutos  
**Objetivo:** Validar que cada rol ve solo sus metas

---

## 🧪 TEST 1: Direct API - Admin

```bash
# 1. Login como admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Guardar TOKEN de la respuesta
TOKEN_ADMIN="eyJ..."

# 2. Llamar API de metas
curl http://localhost:3001/api/metas \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json"

# Resultado esperado:
{
  "id": 1,
  "nombre": "Meta 1",
  "ambito_id": 1,
  ...
},
{
  "id": 2,
  "nombre": "Meta 2",
  "ambito_id": 1,
  ...
},
{
  "id": 6,
  "nombre": "Meta 6",
  "ambito_id": 3,
  ...
}

✅ CORRECTO: Metas de TODOS los ámbitos
```

---

## 🧪 TEST 2: Direct API - Administrativo

```bash
# 1. Login como administrativo (ambito_id=3)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luciriosc@gmail.com",
    "password": "password"
  }'

# Guardar TOKEN
TOKEN_ADMIN_ROLE="eyJ..."

# Verificar que token tiene ambito_id
echo $TOKEN_ADMIN_ROLE | cut -d'.' -f2 | base64 -d | jq .
# Debe mostrar: "ambito_id": 3

# 2. Llamar API de metas
curl http://localhost:3001/api/metas \
  -H "Authorization: Bearer $TOKEN_ADMIN_ROLE"

# Resultado esperado:
[
  {
    "id": 6,
    "nombre": "Meta 6",
    "ambito_id": 3,
    "ambito_nombre": "AAA UCAYALI",
    ...
  }
]

✅ CORRECTO: SOLO metas de ambito_id=3
❌ INCORRECTO: Hay metas de otros ámbitos
```

---

## 🧪 TEST 3: Verificar Logs Backend

```bash
# Ejecutar test 2 mientras observas los logs del backend

# Logs esperados:
📍 LISTAR METAS - Rol: administrativo, Ámbito: 3
🔐 Rol administrativo: mostrando solo metas del ámbito 3
✅ Metas a mostrar: 1

✅ CORRECTO: Logs muestran filtro siendo aplicado
❌ INCORRECTO: No aparecen los logs
```

---

## 🧪 TEST 4: Frontend - Editar Formato

```
1. Ir a http://localhost:3000/gestion/certificaciones-formatos

2. Loguear con administrativo
   Email: luciriosc@gmail.com
   Password: ***

3. Buscar un formato y hacer clic en ✏️ Editar

4. Hacer clic en selector "Meta"
   
   Resultado esperado:
   ┌─────────────────────────┐
   │ Meta 6: 2026            │ ← SOLO metas del ámbito
   └─────────────────────────┘

   ✅ CORRECTO: VE SOLO su ámbito
   ❌ INCORRECTO: Ve metas de otros ámbitos

5. Cambiar a otra meta (si hay más en el ámbito)
   ✅ CORRECTO: Se actualiza sin error

6. Guardar cambios
   ✅ CORRECTO: Formato actualizado
```

---

## 🧪 TEST 5: Frontend - Admin

```
1. Ir a http://localhost:3000/gestion/certificaciones-formatos

2. Loguear con ADMIN (si es disponible)

3. Editar un formato

4. Abrir selector "Meta"
   
   Resultado esperado:
   ┌──────────────────────────┐
   │ Meta 1: 2026            │ ← TODAS las metas
   │ Meta 2: 2026            │
   │ Meta 3: 2026            │
   │ Meta 6: 2026            │
   │ ...                      │
   └──────────────────────────┘

   ✅ CORRECTO: VE TODAS las metas
```

---

## 🧪 TEST 6: Usuario Regular

```bash
# 1. Login como usuario regular (rol=usuario, ambito_id=1)
TOKEN_USER="eyJ..."

# 2. Llamar API
curl http://localhost:3001/api/metas \
  -H "Authorization: Bearer $TOKEN_USER"

# Resultado esperado:
[
  {
    "id": 1,
    "nombre": "Meta 1",
    "ambito_id": 1,
    ...
  },
  {
    "id": 2,
    "nombre": "Meta 2",
    "ambito_id": 1,
    ...
  }
]

✅ CORRECTO: SOLO metas del ambito_id=1
❌ INCORRECTO: Ve metas de otros ámbitos
```

---

## 📊 Matriz de Resultados Esperados

| Rol | Test API | Frontend | Logs |
|-----|----------|----------|------|
| admin | TODAS las metas | TODAS | "Rol admin: todas" |
| administrativo (3) | SOLO 3 | SOLO 3 | "Rol administrativo: ambito 3" |
| usuario (1) | SOLO 1 | SOLO 1 | "Rol usuario: ambito 1" |
| jefe (2) | SOLO 2 | SOLO 2 | "Rol jefe: ambito 2" |

---

## ❌ Troubleshooting

### Problema: Sigue viendo todas las metas

```
Posibles causas:
1. Backend no reiniciado
2. req.user no tiene ambito_id
3. Código no fue guardado

Solución:
1. Reiniciar backend: npm restart
2. Verificar logs: buscar "🔐 FILTRO"
3. Verificar cambios: grep -n "Rol admin" metaController.js
```

### Problema: Error 403/401

```
Causa: Token inválido o expirado

Solución:
1. Hacer login nuevamente
2. Usar nuevo token
3. Verificar que user está autenticado
```

### Problema: Array vacío sin errores

```
Causa: Rol o ambito_id no definidos

Solución:
1. Verificar token JWT incluye ambito_id
2. Verificar que rol es válido (admin, usuario, etc)
3. Revisar logs: buscar "Sin rol o sin ambito_id"
```

---

## ✅ Checklist Final

```
Después de todos los tests:

☑️ Admin ve todas las metas
☑️ Administrativo ve solo su ámbito
☑️ Usuario ve solo su ámbito
☑️ Jefe ve solo su ámbito
☑️ Logs muestran filtros
☑️ Frontend carga metas correctamente
☑️ Selector funciona sin errores
☑️ Sin performance issues
☑️ Cambios se guardan correctamente
```

---

## 🎯 Resumen

Si TODOS los tests pasan ✅:
- El fix está correcto
- Listo para producción
- Cada rol ve lo que debe ver

Si ALGÚN test falla ❌:
- Revisar troubleshooting
- Verificar logs
- Hacer debug según lo indicado

---

**Tiempo Total:** 5-10 minutos  
**Complejidad:** 🟢 Baja  
**Impacto:** 🔴 Alto (Seguridad)
