# ✅ CHECKLIST - Control de Acceso Certificaciones

**Fecha:** 14 de Marzo de 2026  
**Objetivo:** Verificar que el control de acceso funciona correctamente

---

## 📋 PRE-IMPLEMENTACIÓN

- [ ] Backend en `/backend` contiene los cambios en:
  - [ ] `controllers/authController.js` - JWT con `ambito_id`
  - [ ] `controllers/certificacionCreditoController.js` - userContext
  - [ ] `models/CertificacionCredito.js` - Lógica jerárquica

- [ ] Base de datos tiene:
  - [ ] Tabla `users` con columna `ambito_id` (INT)
  - [ ] Tabla `ambitos` con columna `dependencia_id` (INT, FK)
  - [ ] Usuario `rflores` con `ambito_id = 1` (AAA UCAYALI, dependencia_id = NULL)
  - [ ] Usuario `lrios` con `ambito_id = 2` (ALA PUCALLPA, dependencia_id = 1)

---

## 🔄 IMPLEMENTACIÓN

### Paso 1: Detener servidor (si está corriendo)
```bash
# En terminal del backend, presionar Ctrl+C
```
- [ ] Backend detenido

### Paso 2: Instalar dependencias (si es necesario)
```bash
cd backend
npm install
```
- [ ] npm install completado

### Paso 3: Reiniciar servidor
```bash
npm run dev
```
- [ ] Backend corriendo en puerto 5000
- [ ] Sin errores de compilación

### Paso 4: Verificar acceso
```bash
node scripts/verify-access-control.js
```
- [ ] Script ejecutado exitosamente
- [ ] Muestra tabla de usuarios con `ambito_id` y tipo
- [ ] Simula acceso para `rflores` y `lrios`
- [ ] Muestra conteo de certificaciones por usuario

---

## 🧪 PRUEBAS FUNCIONALES

### Test 1: Login de Usuario Admin
```
1. Ir a http://localhost:3000
2. Hacer login con usuario admin
   Email: admin@example.com
   Contraseña: Autoridad1
```
- [ ] Login exitoso
- [ ] Acceso a Certificaciones de Crédito
- [ ] Ve lista COMPLETA de certificaciones
- [ ] Puede ver certificaciones de TODOS los ámbitos (AAA + ALAs)

### Test 2: Login de Usuario AAA (rflores)
```
1. Logout anterior (si es necesario)
2. Hacer login con usuario rflores
   Email: rflores@example.com
   Contraseña: (según configuración)
```
- [ ] Login exitoso
- [ ] Acceso a Certificaciones de Crédito
- [ ] Ve lista COMPLETA de certificaciones
- [ ] Puede ver certificaciones de AAA UCAYALI
- [ ] Puede ver certificaciones de ALA PUCALLPA
- [ ] Puede ver certificaciones de ALA ATALAYA
- [ ] Etc. (TODAS las ALAs)
- [ ] **Resultado esperado:** Lista completa como admin

### Test 3: Login de Usuario ALA (lrios)
```
1. Logout anterior
2. Hacer login con usuario lrios
   Email: lrios@example.com
   Contraseña: (según configuración)
```
- [ ] Login exitoso
- [ ] Acceso a Certificaciones de Crédito
- [ ] Ve lista FILTRADA de certificaciones
- [ ] **SOLO certificaciones del ALA PUCALLPA** (ambito_id = 2)
- [ ] NO ve certificaciones de otras ALAs
- [ ] NO ve certificaciones de AAA
- [ ] **Resultado esperado:** Lista reducida a su ámbito

### Test 4: Verificar JWT (Herramientas de Desarrollo)
```
1. Abrir DevTools del navegador (F12)
2. Ir a Application → LocalStorage
3. Buscar clave con el token JWT
4. Copiar token (sin "Bearer ")
5. Ir a https://jwt.io
6. Pegar token en "Encoded"
```
- [ ] Token se decodifica correctamente
- [ ] Payload contiene `"rol": "admin"` o `"ambito_id": 1` o `"ambito_id": 2`
- [ ] Campos: `id`, `email`, `username`, `rol`, `ambito_id`

### Test 5: Verificar Red (Network Inspector)
```
1. Con DevTools abierto (F12)
2. Ir a pestaña Network
3. Hacer logout y login
4. Buscar request POST a /api/auth/login
5. Ver Response
```
- [ ] Response contiene objeto usuario con `ambito_id`
- [ ] Token retornado incluye `ambito_id` en payload

---

## 🔍 VERIFICACIONES SQL (Base de Datos)

### Verificar Estructura de users
```sql
DESC users;
```
- [ ] Columna `ambito_id` existe (tipo INT)
- [ ] Columna `ambito_id` permite NULL (puede ser modificable)

### Verificar Datos de Usuarios
```sql
SELECT id, username, rol, ambito_id FROM users 
ORDER BY id;
```
- [ ] Resultado muestra usuarios con sus `ambito_id` asignados
- [ ] `admin` tiene `ambito_id = NULL` o `1`
- [ ] `rflores` tiene `ambito_id = 1`
- [ ] `lrios` tiene `ambito_id = 2`

### Verificar Jerarquía de Ámbitos
```sql
SELECT id, nombre_corto, dependencia_id FROM ambitos 
WHERE activo = 1 ORDER BY id;
```
- [ ] Resultado muestra estructura:
  - [ ] ID=1: AAA UCAYALI, dependencia_id = NULL
  - [ ] ID=2: ALA PUCALLPA, dependencia_id = 1
  - [ ] ID=3: ALA ATALAYA, dependencia_id = 1
  - [ ] Etc.

### Contar Certificaciones por Ámbito
```sql
SELECT a.nombre_corto, COUNT(cc.id) as total
FROM ambitos a
LEFT JOIN metas m ON a.id = m.ambito_id
LEFT JOIN certificaciones_credito cc ON m.id = cc.meta_id
WHERE a.activo = 1
GROUP BY a.id, a.nombre_corto
ORDER BY a.id;
```
- [ ] Resultado muestra distribución de certificaciones por ámbito
- [ ] Verifica que existen certificaciones en múltiples ámbitos

---

## 🐛 TROUBLESHOOTING

### Problema: Usuario sigue viendo todos los certificados
**Checklist:**
- [ ] ¿El usuario hizo logout y login DESPUÉS del cambio?
  - Los tokens antiguos no tienen `ambito_id`
  - Solución: Hacer logout/login nuevamente
- [ ] ¿El servidor backend está corriendo la versión actualizada?
  - Solución: Detener (Ctrl+C) y reiniciar `npm run dev`
- [ ] ¿La BD tiene la columna `ambito_id`?
  - Verificar: `DESC users;`

### Problema: Error "ambito_id" en JWT
**Checklist:**
- [ ] ¿El cambio en `authController.js` está correcto?
  - Verificar que `SELECT` incluye `ambito_id`
  - Verificar que `jwt.sign()` incluye `ambito_id`
- [ ] ¿Hay errores en backend?
  - Ver consola del backend: `npm run dev`

### Problema: SQL error en `listar()`
**Checklist:**
- [ ] ¿La columna `dependencia_id` existe en tabla `ambitos`?
  - Verificar: `DESC ambitos;`
- [ ] ¿El pool está inicializado correctamente?
  - Ver: `backend/config/database.js`

### Problema: Las pruebas no muestran resultados
**Checklist:**
- [ ] ¿Hay certificaciones en la BD?
  - `SELECT COUNT(*) FROM certificaciones_credito;`
- [ ] ¿Las metas están vinculadas a ámbitos?
  - `SELECT m.id, m.nombre, m.ambito_id FROM metas LIMIT 5;`

---

## 📊 REPORTES DE PRUEBA

### Plantilla para Documentar Resultados

**Fecha Prueba:** ___________

#### Prueba 1: Admin
- ✅/❌ Login exitoso
- ✅/❌ Ve todo
- Total certificaciones visibles: ___________
- Notas: ___________

#### Prueba 2: rflores (AAA)
- ✅/❌ Login exitoso
- ✅/❌ Ve todo
- Total certificaciones visibles: ___________
- Notas: ___________

#### Prueba 3: lrios (ALA)
- ✅/❌ Login exitoso
- ✅/❌ Ve solo su ALA
- Total certificaciones visibles: ___________
- Ámbito filtrado: ___________
- Notas: ___________

#### Resultado General
- ✅/❌ CONTROL DE ACCESO FUNCIONA CORRECTAMENTE

---

## ✨ Datos de Prueba Recomendados

Si necesitas crear usuarios de prueba:

```sql
-- Usuario AAA (administrador)
INSERT INTO users (username, email, password, nombre, rol, ambito_id, activo)
VALUES ('aaa_admin', 'aaa@example.com', '$2b$10$HASH_HERE', 'Admin AAA', 'administrativo', 1, 1);

-- Usuario ALA (operador)
INSERT INTO users (username, email, password, nombre, rol, ambito_id, activo)
VALUES ('ala_operator', 'ala@example.com', '$2b$10$HASH_HERE', 'Operador ALA', 'administrativo', 2, 1);
```

---

## 🎯 Conclusión

Una vez completados todos los checkmarks:

✅ **Control de Acceso Completamente Implementado**

- Admin ve todo
- Administradores de AAA ven todo
- Operadores de ALA ven solo su ámbito
- Seguridad en nivel SQL/Backend
- JWT contiene información necesaria
- Escalable y mantenible

