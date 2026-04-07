# 📊 CAMBIOS EN ESTRUCTURA DE BASE DE DATOS

## Tabla: users

### Antes
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  -- ❌ Faltaba iniciales
  dni VARCHAR(20),
  rol ENUM('admin', 'jefe', 'usuario', 'administrativo') DEFAULT 'usuario',
  ambito_id INT,
  cargo_id INT,
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE SET NULL,
  FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_ambito (ambito_id),
  INDEX idx_cargo (cargo_id)
);
```

### Ahora
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  iniciales VARCHAR(10),                    -- ✅ NUEVO: Iniciales del usuario
  dni VARCHAR(20),
  rol ENUM('admin', 'jefe', 'usuario', 'administrativo') DEFAULT 'usuario',
  ambito_id INT,
  cargo_id INT,
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE SET NULL,
  FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_ambito (ambito_id),
  INDEX idx_cargo (cargo_id),
  INDEX idx_iniciales (iniciales)           -- ✅ NUEVO: Índice para búsquedas rápidas
);
```

---

## 🔄 Cambios Aplicados

### 1. Agregar Columna
```sql
ALTER TABLE users ADD COLUMN iniciales VARCHAR(10) AFTER nombre;
```

### 2. Crear Índice
```sql
CREATE INDEX idx_iniciales ON users(iniciales);
```

### 3. Poblar Datos (Automático)
```sql
UPDATE users 
SET iniciales = CONCAT(
  UPPER(LEFT(SUBSTRING_INDEX(nombre, ' ', 1), 1)),
  UPPER(LEFT(SUBSTRING_INDEX(SUBSTRING_INDEX(nombre, ' ', 2), ' ', -1), 1))
)
WHERE iniciales IS NULL OR iniciales = '';
```

---

## 📋 Ejemplo de Datos

### Antes
```
| id | nombre                        | dni       | rol       |
|----|-------------------------------|-----------|-----------|
| 1  | Administrador Sistema         | 12345678  | admin     |
| 2  | DHAYRO KONG TORRES            | 45678901  | usuario   |
| 3  | CAROL MELANI ARCOS BINDER     | 56789012  | usuario   |
| 4  | ALAN ROMEO TELLO BARDALES     | 67890123  | usuario   |
```

### Ahora
```
| id | nombre                        | iniciales | dni       | rol       |
|----|-------------------------------|-----------|-----------|-----------|
| 1  | Administrador Sistema         | AS        | 12345678  | admin     |
| 2  | DHAYRO KONG TORRES            | DK        | 45678901  | usuario   |
| 3  | CAROL MELANI ARCOS BINDER     | CA        | 56789012  | usuario   |
| 4  | ALAN ROMEO TELLO BARDALES     | AT        | 67890123  | usuario   |
```

---

## 🧮 Cálculo de Iniciales

### Algoritmo
```
1. Obtener el nombre completo
2. Dividir por espacios
3. Tomar la 1ª letra del 1er palabra → MAYÚSCULA
4. Tomar la 1ª letra del 2do palabra → MAYÚSCULA
5. Concatenar
```

### Ejemplos
```
DHAYRO KONG TORRES
↓
D (Dhayro) + K (Kong)
↓
DK

CAROL MELANI ARCOS BINDER
↓
C (Carol) + M (Melani)
↓
CM

ADMINISTRADOR SISTEMA
↓
A (Administrador) + S (Sistema)
↓
AS
```

---

## 🔗 Uso en Generación de Documentos

### Antes (sin iniciales)
```javascript
// ❌ Teníamos que extraer manualmente
const nombre = usuario.nombre;
const iniciales = nombre.split(' ')[0].charAt(0) + nombre.split(' ')[1].charAt(0);
```

### Ahora (con iniciales)
```javascript
// ✅ Simplemente obtenemos de la tabla
const iniciales = usuario.iniciales; // "DK"
```

### Generación de Número
```javascript
const numeroDocumento = `${numero_proximo}-${iniciales}-${ano}`;
// Resultado: "005-DK-2026"
```

---

## 🔍 Consultas Útiles

### Ver iniciales de todos los usuarios
```sql
SELECT id, username, nombre, iniciales FROM users ORDER BY nombre;
```

### Encontrar usuarios sin iniciales
```sql
SELECT id, nombre FROM users WHERE iniciales IS NULL OR iniciales = '';
```

### Actualizar iniciales de un usuario específico
```sql
UPDATE users 
SET iniciales = 'DK'
WHERE id = 2 AND nombre LIKE 'DHAYRO%';
```

### Contar usuarios por iniciales
```sql
SELECT iniciales, COUNT(*) as total 
FROM users 
WHERE iniciales IS NOT NULL 
GROUP BY iniciales 
ORDER BY total DESC;
```

---

## ✅ Validación Después de la Migración

### En MySQL
```bash
# 1. Verificar que la columna existe
DESCRIBE users;
# Debe mostrar: iniciales | varchar(10) | YES

# 2. Ver datos
SELECT id, nombre, iniciales FROM users LIMIT 10;

# 3. Contar usuarios con iniciales
SELECT COUNT(*) as total_con_iniciales FROM users WHERE iniciales IS NOT NULL;
```

### En la Aplicación
```javascript
// 1. Cargar usuario
const usuario = await api.obtenerUsuario(1);
console.log(usuario.iniciales); // "DK"

// 2. Usar en generación
const doc = `${correlativo}-${usuario.iniciales}-${ano}`;
console.log(doc); // "005-DK-2026"
```

---

## 📝 Cambios en Archivos

| Archivo | Cambio |
|---------|--------|
| `backend/config/database.js` | Agregó `iniciales` en CREATE TABLE users |
| `backend/config/migraciones.js` | Nueva función `actualizarInicialesUsuarios()` |
| `backend/server.js` | Agregó importación y llamada en startServer() |
| `backend/migrations/05_agregar_iniciales_users.sql` | Migración SQL |

---

## 🚀 Cómo Ejecutar la Migración

### Opción 1: Automático (Recomendado)
```bash
cd backend
npm run dev
# La migración se ejecuta automáticamente
```

### Opción 2: Manual
```sql
-- Ejecutar en MySQL
ALTER TABLE users ADD COLUMN iniciales VARCHAR(10) AFTER nombre;
CREATE INDEX idx_iniciales ON users(iniciales);

UPDATE users 
SET iniciales = CONCAT(
  UPPER(LEFT(SUBSTRING_INDEX(nombre, ' ', 1), 1)),
  UPPER(LEFT(SUBSTRING_INDEX(SUBSTRING_INDEX(nombre, ' ', 2), ' ', -1), 1))
)
WHERE iniciales IS NULL OR iniciales = '';
```

---

## ⚠️ Consideraciones

1. **Duplicados:** Es posible que dos usuarios tengan las mismas iniciales
   - No es problema, los documentos también usan el número y año
   - Ejemplo: "001-DK-2026" es único aunque dos usuarios sean "DK"

2. **Actualización Manual:** Puedes cambiar manualmente las iniciales
   ```sql
   UPDATE users SET iniciales = 'DKTKEF' WHERE id = 2;
   ```

3. **Compatibilidad:** La columna se puede usar inmediatamente
   - No requiere cambios en código existente
   - Es opcional (permite NULL)

4. **Performance:** El índice garantiza búsquedas rápidas
   - Ideal si luego queremos filtrar por iniciales

---

## 🎯 Próximos Pasos

1. ✅ Iniciales agregadas a tabla users
2. ✅ Componente GestionCorrelativos creado
3. ✅ Ruta integrada en menú
4. 🔄 Usar iniciales en EmisionFormatos.js
5. 🔄 Crear reporte de correlativos usados

