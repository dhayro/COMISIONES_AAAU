# 🔧 SOLUCIÓN: ambito_id NULL en Comisionados

**Problema Identificado:**
- `rflores` (administrativo, ambito_id=1, AAA UCAYALI) no ve las comisiones de todos los usuarios de su ámbito
- **Causa Raíz:** Muchos usuarios en la tabla `users` tienen `ambito_id = NULL`
- Cuando se cargan comisionados, `u.ambito_id` es NULL, por lo que el filtrado falla

---

## 📊 Estructura Actual (Probable)

```sql
users tabla:
┌────┬──────────┬─────────────┬─────────┬───────────┐
│ id │ username │ nombre      │ rol     │ ambito_id │
├────┼──────────┼─────────────┼─────────┼───────────┤
│ 1  │ admin    │ Admin User  │ admin   │ NULL  ❌  │
│ 2  │ rflores  │ R. Flores   │ admin   │ 1     ✅  │
│ 3  │ lrios    │ L. Ríos     │ admin   │ 3     ✅  │
│ 4  │ user4    │ User 4      │ usuario │ NULL  ❌  │
│ 5  │ user5    │ User 5      │ usuario │ NULL  ❌  │
│ 6  │ user6    │ User 6      │ usuario │ 2     ✅  │
│ 7  │ user7    │ User 7      │ usuario │ NULL  ❌  │
│ ... │ ...     │ ...         │ ...     │ ...   ❌  │
└────┴──────────┴─────────────┴─────────┴───────────┘
```

---

## ✅ SOLUCIÓN: Asignar ambito_id a Todos los Usuarios

### Opción 1: Script SQL para Asignar Ámbitos

```sql
-- PASO 1: Ver estado actual
SELECT id, username, nombre, rol, ambito_id 
FROM users 
WHERE ambito_id IS NULL
ORDER BY id;

-- PASO 2: Asignar ambito_id basado en rol
-- Admin → ambito 1 (AAA UCAYALI)
-- Usuario → ambito 1 (AAA UCAYALI) por defecto
-- Administrativo → ambito 1 (AAA UCAYALI) si es admin gral

UPDATE users 
SET ambito_id = 1 
WHERE ambito_id IS NULL 
  AND (rol = 'admin' OR rol = 'usuario');

-- PASO 3: Verificar resultado
SELECT id, username, nombre, rol, ambito_id, 
       CASE WHEN ambito_id IS NULL THEN '❌' ELSE '✅' END as estado
FROM users 
ORDER BY id;
```

### Opción 2: Script Node.js Automático

Crear archivo: `backend/scripts/assign-ambito-to-users.js`

```javascript
const mysql = require('mysql2/promise');

async function assignAmbitos() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Password123',
      database: 'comisiones_db'
    });

    console.log('\n📝 Asignando ambito_id a usuarios sin ámbito...\n');

    // 1. Ver usuario sin ambito_id
    const [sinAmbito] = await connection.query(
      'SELECT id, username, nombre, rol FROM users WHERE ambito_id IS NULL'
    );
    
    if (sinAmbito.length === 0) {
      console.log('✅ Todos los usuarios ya tienen ambito_id asignado\n');
      await connection.end();
      return;
    }

    console.log(`📊 Encontrados ${sinAmbito.length} usuario(s) sin ambito_id:\n`);
    sinAmbito.forEach(u => {
      console.log(`   • ID ${u.id}: ${u.username} (${u.nombre}) - Rol: ${u.rol}`);
    });

    // 2. Asignar ambito_id = 1 (AAA UCAYALI) a todos
    console.log('\n🔄 Asignando ambito_id = 1 (AAA UCAYALI)...\n');
    const [result] = await connection.query(
      'UPDATE users SET ambito_id = 1 WHERE ambito_id IS NULL'
    );

    console.log(`✅ ${result.affectedRows} usuario(s) actualizado(s)\n`);

    // 3. Verificar resultado
    const [verificacion] = await connection.query(
      'SELECT id, username, nombre, rol, ambito_id FROM users WHERE id IN (?)',
      [sinAmbito.map(u => u.id)]
    );

    console.log('✅ Estado después de asignación:\n');
    verificacion.forEach(u => {
      console.log(`   ✓ ${u.username}: ambito_id = ${u.ambito_id}`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

assignAmbitos();
```

---

## 🎯 Lógica Recomendada de Asignación

**Según el rol del usuario:**

```
Admin               → ambito_id = NULL (puede ver todo, no filtra por ámbito)
                    O ambito_id = 1 (AAA UCAYALI - punto central)

Administrativo/Jefe → ambito_id = DEBE tener asignado (AAA o ALA específica)
                    Default: 1 (AAA UCAYALI)

Usuario Regular     → ambito_id = DEBE tener asignado (su ámbito de trabajo)
                    Default: 1 (AAA UCAYALI)
```

**Después de asignar:**
- Todos los usuarios tendrán `ambito_id` (excepto admin si lo necesita NULL)
- El filtrado en `cargarItems()` funcionará correctamente
- `rflores` verá comisiones de usuarios con ambito_id 1, 2, 3, 4, 5

---

## 🧪 Pruebas Post-Asignación

### Test 1: Verificar que rflores ve comisiones
```
1. Login como rflores
2. Ir a Gestión de Comisiones
3. Consola (F12) → Ver logs de DEBUG FILTRADO ADMINISTRATIVO
4. Verificar que:
   - ambito_id = 1 ✅
   - Tipo = AAA ✅
   - Ámbitos Permitidos = [1, 2, 3, 4, 5] ✅
   - Comisionados tienen ambito_id asignado (no NULL) ✅
   - Comisiones mostradas = todas con comisionados de 1-5 ✅
```

### Test 2: Verificar que lrios solo ve su ALA
```
1. Login como lrios (ambito_id=3, ALA ATALAYA)
2. Comisiones mostradas = solo las con comisionados de ámbito 3
```

### Test 3: Verificar que usuario regular solo ve sus comisiones
```
1. Login como usuario_xyz
2. Comisiones mostradas = solo donde cc.usuario_id = usuario_xyz
```

---

## 📋 Pasos Finales

### 1️⃣ Ejecutar asignación de ambito_id

```bash
# Opción A: Ejecutar SQL manualmente en MySQL
mysql -u root -pPassword123 comisiones_db < verify_ambito_comisionados.sql

# Opción B: Ejecutar script Node.js
node backend/scripts/assign-ambito-to-users.js
```

### 2️⃣ Verificar datos

```sql
SELECT COUNT(*) FROM users WHERE ambito_id IS NULL;
-- Resultado esperado: 0
```

### 3️⃣ Compilar frontend con logs

```bash
npm run build
```

### 4️⃣ Probar con rflores

1. Login como rflores
2. Ir a Gestión Comisiones
3. Abrir consola (F12)
4. Debe ver logs: `🔍 DEBUG FILTRADO ADMINISTRATIVO`
5. Verificar que ve comisiones

### 5️⃣ Verificar en red (F12 → Network)

- GET `/comisiones` → trae todas
- GET `/comisiones/1/comisionados` → retorna comisionados con `ambito_id`
- GET `/comisiones/2/comisionados` → mismo

---

## 🔍 Verificación Final

Si todo funciona:

```
✅ rflores (AAA) ve:
   - Comisiones con comisionados de ambito 1 (AAA UCAYALI)
   - Comisiones con comisionados de ambito 2 (ALA PUCALLPA)
   - Comisiones con comisionados de ambito 3 (ALA ATALAYA)
   - Comisiones con comisionados de ambito 4 (ALA TARMA)
   - Comisiones con comisionados de ambito 5 (ALA PERENE)

✅ lrios (ALA ATALAYA) ve:
   - Solo comisiones con comisionados de ambito 3

✅ usuario_xyz ve:
   - Solo comisiones donde aparece como comisionado (usuario_id match)
```

