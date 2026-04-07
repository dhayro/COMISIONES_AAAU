# 🔍 DIAGNÓSTICO: Usuario dkong No Ve Comisiones

## 📋 Problema
Usuario `dkong` accede a `/api/comisiones/emision-formatos` pero recibe respuesta vacía.

---

## 🔧 Cómo Diagnosticar

### Paso 1: Ejecutar el script de diagnóstico

```bash
cd d:\COMISIONES_AAAU
node backend/debug-dkong-comisiones.js
```

Este script verificará:

1. ✅ Si el usuario `dkong` existe en la BD
2. ✅ Si `dkong` está asignado como comisionado en alguna comisión
3. ✅ Si esas comisiones cumplen los filtros (PRESUPUESTO ASIGNADO + APROBADA)
4. ✅ Qué comisiones debería ver en "Emisión de Formatos"

---

## 📊 Interpretando la Salida

### Escenario 1: dkong NO está en comision_comisionados

**Salida:**
```
❌ PROBLEMA: dkong NO está asignado como comisionado en ninguna comisión
   Acción necesaria: Agregar dkong como comisionado en alguna comisión
```

**Solución:**
1. Ir a: **Gestión → Comisiones**
2. Seleccionar una comisión
3. Click: **"Agregar Comisionado"**
4. Buscar: **dkong**
5. Asignar y guardar

---

### Escenario 2: dkong está en comision_comisionados, pero sus comisiones NO cumplen filtros

**Salida:**
```
⚠️  PROBLEMA: dkong está en comision_comisionados, pero sus comisiones no cumplen filtros
   Verifica que sus comisiones tengan:
   ✓ presupuesto_estado = "PRESUPUESTO ASIGNADO"
   ✓ aprobacion_estado = "APROBADA"
```

**Comisión #5:**
```
Presupuesto: PRESUPUESTO NO ASIGNADO ❌
Aprobación: APROBADA ✓
¿Pasa filtros?: ❌ NO
```

**Solución:**
El presupuesto NO está asignado. Debe ser asignado por:
1. Ir a: **Gestión → Comisiones**
2. Seleccionar comisión #5
3. Cambiar presupuesto a **"PRESUPUESTO ASIGNADO"**

---

### Escenario 3: ✅ Todo OK

**Salida:**
```
✅ OK: dkong tiene comisiones que cumplen filtros
   Se muestran 2 comisiones en Emisión de Formatos
```

Si ves esto pero el endpoint sigue retornando vacío, hay un problema en el backend. Ejecuta:

```bash
# Revisa los logs del servidor
# Busca líneas que empiezan con "🔍 obtenerComisionesParaEmisionFormatos"
# Deberían mostrar:
#   usuarioId: 16 (o el ID de dkong)
#   rol: usuario
#   📍 Filtro USUARIO aplicado: usuario_id = 16
#   📝 Query: SELECT...
#   📍 Params: [16]
#   ✓ Comisiones encontradas: 2
```

---

## 🛠️ Debugging Avanzado

### Opción A: Verificar SQL directamente

Abre MySQL y ejecuta:

```sql
-- Verificar ID de dkong
SELECT id, username, nombre, rol FROM users WHERE username = 'dkong';
-- Output: id=16, username=dkong, nombre=Diego Kong, rol=usuario

-- Verificar si dkong está en comision_comisionados
SELECT cc.id, cc.comision_id, c.lugar, c.aprobacion_estado, c.presupuesto_estado
FROM comision_comisionados cc
JOIN comisiones c ON cc.comision_id = c.id
WHERE cc.usuario_id = 16;
-- Debería retornar al menos 1 fila

-- Verificar con filtros de emisión
SELECT DISTINCT c.id, c.lugar, c.aprobacion_estado, c.presupuesto_estado
FROM comisiones c
INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
INNER JOIN users comisionados ON cc.usuario_id = comisionados.id
WHERE c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
AND c.aprobacion_estado = 'APROBADA'
AND comisionados.id = 16;
-- Debería retornar al menos 1 fila
```

### Opción B: Ver logs del servidor

```bash
# Si el servidor está corriendo, busca en la consola líneas como:
🔍 obtenerComisionesParaEmisionFormatos
   usuarioId: 16
   rol: usuario
   📍 Filtro USUARIO aplicado: usuario_id = 16
   📝 Query: SELECT DISTINCT c.id FROM comisiones...
   📍 Params: [16]
   ✓ Comisiones encontradas: 0
```

Si ves "Comisiones encontradas: 0", el problema está en que dkong no está en comision_comisionados o sus comisiones no cumplen los filtros.

---

## ✅ Checklist de Resolución

- [ ] Ejecuté `node backend/debug-dkong-comisiones.js`
- [ ] Identifiqué si el problema es:
  - [ ] dkong no está en comision_comisionados
  - [ ] Las comisiones no tienen presupuesto asignado
  - [ ] Las comisiones no están aprobadas
- [ ] Realicé la acción correctiva:
  - [ ] Agregué dkong como comisionado en una comisión
  - [ ] Asigné presupuesto a la comisión
  - [ ] Aprobé la comisión
- [ ] Verifiqué nuevamente: `GET /api/comisiones/emision-formatos`
- [ ] ✅ dkong ahora ve sus comisiones

---

## 📞 Si Aún No Funciona

Si después de todo esto el endpoint sigue vacío:

1. Revisa la consola del servidor para logs con 🔍
2. Verifica que el rol en el token JWT sea "usuario"
3. Abre DevTools (F12) en el navegador
4. Ve a Network → Busca `/emision-formatos`
5. Revisa la respuesta JSON
6. Copia la URL completa y comparte para investigar

---

**Script Creado:** `backend/debug-dkong-comisiones.js`  
**Fecha:** Marzo 20, 2026
