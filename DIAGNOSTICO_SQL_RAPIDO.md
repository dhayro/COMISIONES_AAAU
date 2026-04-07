# 🔍 DIAGNÓSTICO RÁPIDO - SQL Directo

Ejecuta estas queries en MySQL para diagnosticar el problema:

## Query 1: Verificar usuario dkong

```sql
SELECT id, username, nombre, rol, ambito_id 
FROM users 
WHERE username = 'dkong';
```

**Esperado:** Una fila con id=16 (aproximadamente), rol='usuario'

---

## Query 2: Comisiones donde dkong es comisionado

```sql
SELECT 
  c.id as comision_id,
  c.lugar,
  c.fecha_salida,
  c.presupuesto_estado,
  c.aprobacion_estado
FROM comisiones c
INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
WHERE cc.usuario_id = (SELECT id FROM users WHERE username = 'dkong');
```

**Si retorna:**
- ✅ **1+ filas:** dkong está asignado como comisionado
- ❌ **0 filas:** dkong NO está en ninguna comisión como comisionado

---

## Query 3: Comisiones de dkong CON FILTROS de Emisión

```sql
SELECT DISTINCT
  c.id as comision_id,
  c.lugar,
  c.fecha_salida,
  c.presupuesto_estado,
  c.aprobacion_estado
FROM comisiones c
INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
INNER JOIN users comisionados ON cc.usuario_id = comisionados.id
WHERE c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
AND c.aprobacion_estado = 'APROBADA'
AND comisionados.id = (SELECT id FROM users WHERE username = 'dkong');
```

**Si retorna:**
- ✅ **1+ filas:** ¡El endpoint DEBE mostrar comisiones!
- ❌ **0 filas:** Sus comisiones no cumplen filtros

---

## Query 4: Detallar por qué Query 3 retorna 0

```sql
SELECT 
  c.id,
  c.lugar,
  c.presupuesto_estado as 'Presupuesto Estado',
  CASE WHEN c.presupuesto_estado = 'PRESUPUESTO ASIGNADO' THEN '✓' ELSE '❌' END as 'Cumple Presupuesto',
  c.aprobacion_estado as 'Aprobación Estado',
  CASE WHEN c.aprobacion_estado = 'APROBADA' THEN '✓' ELSE '❌' END as 'Cumple Aprobación'
FROM comisiones c
INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
WHERE cc.usuario_id = (SELECT id FROM users WHERE username = 'dkong');
```

Esto te dirá si el problema es presupuesto, aprobación, o que no está en ninguna comisión.

---

## Acciones Basadas en Resultados:

### Si Query 2 retorna 0 filas:
**Problema:** dkong no está asignado como comisionado en ninguna comisión

**Solución:**
1. Abre la app: **Gestión → Comisiones**
2. Haz click en una comisión
3. En "Comisionados", agrega a **dkong**
4. Guarda

### Si Query 3 retorna 0 pero Query 2 retorna 1+ filas:
**Problema:** Las comisiones donde está dkong no cumplen filtros

**Solución:**
De acuerdo a Query 4:
- Si `Cumple Presupuesto` es ❌: Ve a esa comisión y cambia a "PRESUPUESTO ASIGNADO"
- Si `Cumple Aprobación` es ❌: Ve a esa comisión y cámbiaala a "APROBADA"

### Si Query 3 retorna 1+ filas:
**Problema:** El endpoint DEBE retornar datos

**Posibles causas:**
1. El servidor no está corriendo correctamente
2. Hay un error en el token JWT
3. El navegador tiene caché

**Solución:**
1. Reinicia el servidor backend
2. Limpia caché del navegador (Ctrl+Shift+Del)
3. Intenta de nuevo

---

## Cómo ejecutar estas queries:

### Opción 1: MySQL CLI
```bash
mysql -h localhost -u root comisiones_db -e "SELECT id, username FROM users WHERE username = 'dkong';"
```

### Opción 2: MySQL Workbench
1. Abre MySQL Workbench
2. Copia y pega cada query
3. Click Execute (⚡)

### Opción 3: phpMyAdmin
1. Abre http://localhost/phpmyadmin
2. Base de datos: `comisiones_db`
3. Pestaña: SQL
4. Copia y pega cada query
5. Click "Go"

---

**Pasos:**
1. ✅ Ejecuta Query 1 → Verifica que dkong existe
2. ✅ Ejecuta Query 2 → Verifica si está en comision_comisionados
3. ✅ Si Query 2 retorna 0 → Agrega dkong a una comisión
4. ✅ Ejecuta Query 3 → Si retorna datos, endpoint DEBE funcionar
5. ✅ Si Query 3 retorna 0 → Usa Query 4 para ver qué filtro falla
6. ✅ Arregla presupuesto/aprobación según Query 4
7. ✅ Ejecuta Query 3 de nuevo → Debe retornar datos
8. ✅ Prueba endpoint: GET /api/comisiones/emision-formatos

---

**Próximo paso:** Corre estas queries y comparte los resultados
