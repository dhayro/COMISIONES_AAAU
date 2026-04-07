# ✅ CHECKLIST: Implementación Filtrado de Comisiones por Usuario/Ámbito

**Sesión:** 34  
**Fecha:** 14 de Marzo de 2026  
**Estado:** En Progreso

---

## 🔧 FASE 1: BACKEND (Cambios Código)

### ✅ 1.1 Actualizar Query en `models/Comision.js`

**Archivo:** `backend/models/Comision.js` (línea ~230)

```javascript
// CAMBIO REALIZADO: Línea 235
// ANTES: SELECT cc.*, u.nombre as usuario_nombre, u.email,
// DESPUÉS: SELECT cc.*, u.nombre as usuario_nombre, u.email, u.ambito_id,
```

**Estado:** ✅ COMPLETADO

**Verificación:**
```bash
grep -n "u.ambito_id" backend/models/Comision.js
# Debe encontrar la línea 233 con el SELECT actualizado
```

---

## 🎨 FASE 2: FRONTEND (Cambios UI)

### ✅ 2.1 Actualizar Lógica Filtrado en `GestionComisiones.js`

**Archivo:** `material-dashboard-react/src/pages/Gestion/GestionComisiones.js` (línea ~197)

**Cambios:**
- ✅ Agregar lógica para cargar comisionados dinámicamente
- ✅ Validar `ambito_id` de cada comisionado
- ✅ Agregar logs de DEBUG

**Estado:** ✅ COMPLETADO

**Verificación:**
```bash
grep -n "tieneComisionadoPermitido" material-dashboard-react/src/pages/Gestion/GestionComisiones.js
# Debe encontrar la validación de comisionados
```

---

## 📝 FASE 3: SCRIPTS VERIFICACIÓN/FIX

### ✅ 3.1 Script: Verificar ambito_id en BD

**Archivo:** `backend/scripts/verify-ambito-comisionados.js`

**Estado:** ✅ CREADO

**Usar para:**
- Ver estado de `ambito_id` en usuarios
- Identificar comisionados sin ámbito
- Verificar datos de usuario específico (ej: rflores)

---

### ✅ 3.2 Script: Asignar ambito_id a Usuarios

**Archivo:** `backend/scripts/assign-ambito-to-users.js`

**Estado:** ✅ CREADO

**Usar para:**
- Asignar automáticamente `ambito_id=1` a usuarios sin ámbito
- Garantizar que filtrado funciona

---

## 📊 FASE 4: VERIFICACIÓN DE DATOS

### ⏳ 4.1 Ejecutar Verificación

**PENDIENTE - Hacer por el usuario:**

```bash
# Opción 1: Usar script Node.js
node backend/scripts/verify-ambito-comisionados.js

# Opción 2: Consulta SQL directa
mysql -u root -pPassword123 comisiones_db < verify_ambito_comisionados.sql
```

**Verificar que:**
- [ ] Todos los usuarios tienen `ambito_id` (no NULL)
- [ ] rflores tiene `ambito_id = 1`
- [ ] lrios tiene `ambito_id = 3`
- [ ] Comisionados retornan su `ambito_id`

---

### ⏳ 4.2 Asignar ambito_id (Si Necesario)

**PENDIENTE - Hacer si hay usuarios con ambito_id=NULL:**

```bash
node backend/scripts/assign-ambito-to-users.js
```

**Verificar que:**
- [ ] Script ejecutó sin errores
- [ ] X usuarios fueron actualizados
- [ ] Query `SELECT COUNT(*) FROM users WHERE ambito_id IS NULL;` retorna 0

---

## 🏗️ FASE 5: BUILD Y DEPLOY

### ⏳ 5.1 Compilar Frontend

**PENDIENTE:**

```bash
cd material-dashboard-react
npm run build
```

**Verificar que:**
- [ ] Build completó sin errores
- [ ] Sin warnings críticos
- [ ] Archivos generados en `dist/`

---

### ⏳ 5.2 Iniciar Servidor Backend

**PENDIENTE:**

```bash
cd backend
npm run dev
```

**Verificar que:**
- [ ] Servidor iniciado en puerto 3001
- [ ] Conexión a BD exitosa
- [ ] Rutas disponibles

---

### ⏳ 5.3 Servir Frontend

**PENDIENTE:**

```bash
# En otra terminal
cd material-dashboard-react
npm run preview
```

**Verificar que:**
- [ ] UI cargó correctamente
- [ ] Sin errores en consola

---

## 🧪 FASE 6: TESTING

### ⏳ 6.1 Test 1: Verificar Datos Backend

**PENDIENTE:**

```bash
# Verificar endpoint de comisionados con ambito_id
curl -X GET http://localhost:3001/comisiones/1/comisionados \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Verificar que respuesta incluye:**
```json
[
  {
    "id": 1,
    "usuario_id": 5,
    "ambito_id": 1,    ← PRESENTE
    "usuario_nombre": "User 5",
    ...
  }
]
```

---

### ⏳ 6.2 Test 2: Login como rflores

**PENDIENTE:**

```
1. Ir a login
2. Username: rflores
3. Password: rflores123 (o la que sea)
4. Hacer login
5. Ir a "Gestión de Comisiones"
```

**Verificar:**
- [ ] Login exitoso
- [ ] Redirección a Comisiones
- [ ] Tabla carga sin errores

---

### ⏳ 6.3 Test 3: Revisar Logs en Consola (F12)

**PENDIENTE:**

```
1. Abrir F12 → Console
2. Buscar: "🔍 DEBUG FILTRADO ADMINISTRATIVO"
3. Expandir y revisar:
```

**Verificar:**
```
✅ Usuario: rflores Ámbito ID: 1
✅ Ámbito Tipo: AAA
✅ Ámbitos Permitidos: [ 1, 2, 3, 4, 5 ]
✅ Comisión 1 (Lima): usuarios con ambito_id
   ✅ ¿Tiene comisionado permitido? true
✅ Comisión 2 (Cusco): usuarios con ambito_id
   ✅ ¿Tiene comisionado permitido? true
✅ TOTAL comisiones filtradas: 3 (por ejemplo)
```

---

### ⏳ 6.4 Test 4: Verificar Network Requests

**PENDIENTE:**

```
1. F12 → Network
2. Filtrar por "comisionados"
3. Hacer clic en GET /comisiones/1/comisionados
4. Ver Response
```

**Verificar:**
- [ ] Status 200 OK
- [ ] Response incluye `ambito_id` para cada usuario
- [ ] Ningún `ambito_id = null` (o son esperados)

---

### ⏳ 6.5 Test 5: Verificar Resultados en Tabla

**PENDIENTE:**

```
En tabla de "Gestión de Comisiones":
```

**Verificar:**
- [ ] rflores ve comisiones de su ámbito (y ALAs dependientes)
- [ ] Tabla muestra comisiones filtradas
- [ ] No hay comisiones que no debería ver
- [ ] Número de filas es consistente con filtrado

---

### ⏳ 6.6 Test 6: Comparar con Otros Usuarios

**PENDIENTE:**

Repetir tests con:
- [ ] **lrios** (ALA ATALAYA, ambito_id=3)
  - Debe ver SOLO comisiones con comisionados de ámbito 3
- [ ] **Usuario Regular** (usuario, ambito_id=alguno)
  - Debe ver SOLO comisiones donde aparezca como comisionado
- [ ] **admin** (admin)
  - Debe ver TODAS las comisiones

---

## 🐛 DEBUGGING

### Si hay Problemas

**Problema:** rflores no ve comisiones

**Checklist:**
- [ ] Ejecutar: `SELECT ambito_id FROM users WHERE username = 'rflores';`
  - Debe retornar: 1 (no NULL)
- [ ] Ejecutar: `SELECT COUNT(*) FROM users WHERE ambito_id IS NULL;`
  - Debe retornar: 0
- [ ] Revisar logs en F12 Console
- [ ] Verificar network requests GET /comisiones
- [ ] Verificar que comisionados tienen `ambito_id` en response

**Si comisionados aún tienen NULL:**
```bash
node backend/scripts/assign-ambito-to-users.js
# y reiniciar servidor
```

---

## 📚 Documentación Creada

- ✅ `SOLUCION_AMBITO_NULL_COMISIONADOS.md` - Explicación del problema
- ✅ `RESUMEN_SESSION_34.md` - Resumen de cambios
- ✅ `DIAGRAMA_FLUJO_FILTRADO_COMISIONES.md` - Diagramas visuales
- ✅ `FILTRADO_COMISIONES_POR_USUARIO_V2.md` - Doc técnica versión 2
- ✅ Este checklist

---

## 📋 ORDEN DE EJECUCIÓN RECOMENDADO

```
1. ✅ Código actualizado (backend + frontend)
   └─ Ya completado

2. ⏳ Compilar backend y frontend
   └─ npm run build

3. ⏳ Verificar datos en BD
   └─ node backend/scripts/verify-ambito-comisionados.js

4. ⏳ Asignar ambito_id si necesario
   └─ node backend/scripts/assign-ambito-to-users.js

5. ⏳ Iniciar servidor backend
   └─ npm run dev

6. ⏳ Servir frontend
   └─ npm run preview

7. ⏳ Tests 1-6
   └─ Seguir tests en orden

8. ✅ Validar que funciona
   └─ rflores ve sus comisiones correctamente
```

---

## ✨ RESULTADO ESPERADO

Al completar todos los pasos:

```
✅ rflores (administrativo, AAA) ve:
   - Comisiones de usuarios con ambito 1, 2, 3, 4, 5
   - NO ve comisiones de usuarios con otros ámbitos

✅ lrios (administrativo, ALA) ve:
   - SOLO comisiones de usuarios con su ámbito

✅ Usuarios regulares ven:
   - SOLO comisiones donde aparecen como comisionados

✅ Logs en consola muestran:
   - 🔍 DEBUG FILTRADO ADMINISTRATIVO
   - Detalles de filtrado por usuario
```

---

## 🎯 SIGUIENTE ACCIÓN

**Próximo paso:** Ejecutar verificación de datos

```bash
node backend/scripts/verify-ambito-comisionados.js
```

Una vez que se confirme el estado de los datos, proceder con asignación si es necesario.

---

**Estado General:** 🟡 En Progreso  
**Completado:** Código ✅  
**Pendiente:** Testing & Validación ⏳

