# 🚀 GUÍA RÁPIDA - Deploy Fixes de Seguridad

**Fecha:** 31-03-2026  
**Tiempo Estimado:** 10-15 minutos  
**Riesgo:** 🟡 Medio (Cambios de seguridad, pero no afectan datos existentes)

---

## ⚡ Quick Start

```bash
# 1️⃣ Backend - Reiniciar
cd backend
npm restart
# O: pm2 restart backend
# O: Detener Ctrl+C y ejecutar: npm start

# 2️⃣ Frontend - Reload (sin reiniciar)
# F5 en navegador o Ctrl+Shift+R

# 3️⃣ Testing - Verificar funcionamiento
# Ver sección "Testing Rápido" abajo
```

---

## 📋 Cambios a Verificar

### 1. Backend - FormatoEmision.js

**Ubicación:** `backend/models/FormatoEmision.js`

```bash
# Verificar cambio está presente
grep -n "userAmbitoId" backend/models/FormatoEmision.js

# DEBE retornar:
# 91:  static async listar(filtros = {}, usuarioId = null, rol = null, userAmbitoId = null)
# 110: } else if (rol === 'administrativo' && userAmbitoId) {
# 112:   query += ` AND u.ambito_id = ?`;
```

### 2. Backend - formatoEmisionController.js

**Ubicación:** `backend/controllers/formatoEmisionController.js`

```bash
# Verificar cambio está presente
grep -n "userAmbitoId" backend/controllers/formatoEmisionController.js

# DEBE retornar:
# 182: const userAmbitoId = req.user.ambito_id;
# 190: const formatos = await FormatoEmision.listar(filtros, usuarioId, rol, userAmbitoId);
```

### 3. Backend - metaController.js

**Ubicación:** `backend/controllers/metaController.js`

```bash
# Verificar cambio está presente
grep -n "Rol admin" backend/controllers/metaController.js

# DEBE retornar:
# 9: const rol = req.user?.rol;
# 10: const userAmbitoId = req.user?.ambito_id;
# 13: if (rol === 'admin') {
# 15: const metas = await Meta.listar();
```

---

## 🧪 Testing Rápido (2 min)

### Test 1: API - Formatos

```bash
# En terminal, con backend corriendo:

# Login como administrativo
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luciriosc@gmail.com","password":"password"}' \
  -s | jq .

# Guardar token de respuesta
TOKEN="eyJ..."

# Listar formatos
curl http://localhost:3001/api/formatos-emisiones \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.formatos[].ambito_id'

# Esperado: SOLO 3
# 🔴 Incorrecto: múltiples valores
```

### Test 2: API - Metas

```bash
# Con mismo TOKEN de administrativo

# Listar metas
curl http://localhost:3001/api/metas \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.[] | {id, ambito_id}'

# Esperado:
# { "id": 6, "ambito_id": 3 }
# 🔴 Incorrecto: ambito_id ≠ 3
```

### Test 3: Logs Backend

```bash
# Mientras ejecutas Test 1 y 2, observar logs:

# En la consola del backend debe ver:
🔐 FILTRO: ADMINISTRATIVO (ambito_id=3)
🔐 Rol administrativo: mostrando solo metas del ámbito 3

# ✅ Correcto: Logs aparecen
# 🔴 Incorrecto: Logs NO aparecen
```

### Test 4: Frontend

```
1. Ir a http://localhost:3000/gestion/certificaciones-formatos

2. Loguear con administrativo
   Email: luciriosc@gmail.com

3. Editar un formato (clic en ✏️)

4. Abrir selector "Meta"
   ✅ DEBE mostrar SOLO Meta 6
   🔴 Si ve Metas 1, 2, 3 etc: ERROR

5. Cambiar a otra meta (si hay múltiples en ámbito)

6. Guardar
   ✅ DEBE guardarse sin error
```

---

## 🔍 Verificación Detallada

### Paso 1: Verificar Cambios Guardados

```bash
# Ir a carpeta del proyecto
cd d:\COMISIONES_AAAU

# Verificar cada archivo
echo "=== FormatoEmision.js ===" && \
grep -c "userAmbitoId" backend/models/FormatoEmision.js && \
echo "=== formatoEmisionController.js ===" && \
grep -c "userAmbitoId" backend/controllers/formatoEmisionController.js && \
echo "=== metaController.js ===" && \
grep -c "Rol admin" backend/controllers/metaController.js

# Esperado: 3, 2, 1 (números > 0)
# 🔴 Si alguno retorna 0: cambios NO se guardaron
```

### Paso 2: Backend Health Check

```bash
# Verificar que backend está corriendo
curl http://localhost:3001/api/health -s | jq .

# Esperado:
# { "status": "ok" }

# 🔴 Si falla: backend no está corriendo
```

### Paso 3: JWT Validation

```bash
# Login con administrativo y extraer token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luciriosc@gmail.com","password":"password"}' \
  | jq -r '.token')

# Decodificar JWT (en Linux/Mac)
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq .

# Esperado en payload:
# { "id": 27, "rol": "administrativo", "ambito_id": 3 }

# 🔴 Si ambito_id NO está: JWT no generado correctamente
```

---

## ⚠️ Rollback (Si algo falla)

### Opción 1: Revertir Cambios en Código

```bash
# Si tienes git
cd backend
git diff  # Ver cambios
git checkout -- models/FormatoEmision.js
git checkout -- controllers/formatoEmisionController.js
git checkout -- controllers/metaController.js

# Reiniciar backend
npm restart
```

### Opción 2: Restaurar Backup

```bash
# Si tienes backup de archivos
cp backup/FormatoEmision.js backend/models/
cp backup/formatoEmisionController.js backend/controllers/
cp backup/metaController.js backend/controllers/

# Reiniciar backend
npm restart
```

---

## 📊 Validación Final

| Item | Status | Acción |
|------|--------|--------|
| Cambios guardados | ✅ | Continuar |
| Backend inicia | ✅ | Continuar |
| API responde | ✅ | Continuar |
| Test 1 Formatos | ✅ | Continuar |
| Test 2 Metas | ✅ | Continuar |
| Logs correctos | ✅ | Continuar |
| Frontend UI | ✅ | ✅ READY TO PROD |

---

## 🚀 Deploy a Producción

Cuando TODO esté ✅:

### Opción A: Docker

```bash
cd d:\COMISIONES_AAAU

# Rebuild images
docker-compose build backend frontend

# Restart services
docker-compose restart backend frontend

# Verify
curl http://localhost:3001/api/health
```

### Opción B: Manual

```bash
# Backend
cd backend
npm install --production
npm restart

# Frontend
cd ../material-dashboard-react
npm install --production
npm run build
npm restart
```

### Opción C: PM2

```bash
# Restart services
pm2 restart backend frontend
pm2 restart all

# Monitor
pm2 logs backend | grep -E "FILTRO|ERROR"
```

---

## 📝 Logging Esperado Post-Deploy

```
Cuando administrativo accede:

✅ CORRECTO:
🔐 FILTRO: ADMINISTRATIVO (ambito_id=3)
✅ Formatos a mostrar: 2
🔐 Rol administrativo: mostrando solo metas del ámbito 3
✅ Metas a mostrar: 1

🔴 INCORRECTO:
- No aparecen logs de FILTRO
- Formatos a mostrar: > 5 (todas)
- Metas a mostrar: > 1 (todas)
```

---

## 🎯 Monitoreo Primeras Horas

```bash
# Minuto 1-5: Verificar que no hay errores
tail -f backend.log | grep ERROR

# Minuto 5-10: Verificar que usuarios se logean
tail -f backend.log | grep "Login\|LISTAR"

# Minuto 10-30: Verificar operaciones normales
tail -f backend.log | grep "FILTRO"

# Minuto 30-60: Realizar más pruebas
# - Cambiar formatos
# - Cambiar metas
# - Verificar que se guardan correctamente
```

---

## ✅ Success Criteria

```
Deploy fue exitoso SI:
☑️ No hay errores 500 en logs
☑️ Administrativos ven solo su ámbito
☑️ Admin ve todos los ámbitos
☑️ Selector de metas filtra correctamente
☑️ Cambios se guardan sin error
☑️ Performance normal (sin lentitud)
☑️ Usuarios reportan acceso correcto
```

---

## 📞 Contacto si Falla

Si algo sale mal:

1. **Ver logs:** `tail -f backend.log | grep ERROR`
2. **Verificar cambios:** `grep -n "userAmbitoId" backend/models/FormatoEmision.js`
3. **Reiniciar:** `npm restart`
4. **Rollback:** Ver sección "Rollback" arriba

---

**Tiempo Total:** 10-15 minutos  
**Complejidad:** 🟡 Media  
**Riesgo:** 🟡 Bajo (cambios contenidos, sin BD)

Listo para deploy cuando tengas verde en todo el checklist. ✅
