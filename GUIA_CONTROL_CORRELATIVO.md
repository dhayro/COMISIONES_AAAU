# 🎯 Sistema de Control de Correlativo - Guía de Uso

## Resumen

El sistema ahora tiene una **tabla de control `correlativo_control`** que te permite:

✅ **Definir desde qué número comienza el correlativo** para cada usuario en cada año  
✅ **Cambiar el número inicial** sin afectar formatos existentes  
✅ **Rastrear el próximo número** a usar automáticamente  
✅ **Configuración flexible** por usuario y por año  

---

## 📋 Escenarios de Uso

### Escenario 1: Usuario DKT año 2026 comienza en 001
```sql
-- Crear control
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion)
VALUES (1, 2026, 1, 1, 'DKT comienza en 001');

-- Resultado: 001-DKT-2026, 002-DKT-2026, 003-DKT-2026...
```

### Escenario 2: Usuario JRG año 2026 comienza en 100
```sql
-- Crear control
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion)
VALUES (2, 2026, 100, 100, 'JRG comienza en 100');

-- Resultado: 100-JRG-2026, 101-JRG-2026, 102-JRG-2026...
```

### Escenario 3: Usuario DKT año 2027 comienza en 001 (reinicio anual)
```sql
-- Crear control para nuevo año
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion)
VALUES (1, 2027, 1, 1, 'DKT comienza en 001 (nuevo año)');

-- Resultado: 001-DKT-2027, 002-DKT-2027...
```

---

## 🔌 APIs REST

### 1. OBTENER control de un usuario en un año

**GET** `/api/formato-emisiones/correlativo-control/:usuarioId/:ano`

**Respuesta exitosa (200):**
```json
{
  "message": "Control de correlativo obtenido",
  "data": {
    "id": 1,
    "usuario_id": 1,
    "ano": 2026,
    "numero_inicial": 1,
    "numero_proximo": 5,
    "prefijo": null,
    "descripcion": "DKT comienza en 001",
    "activo": 1,
    "creado_en": "2026-03-29T10:00:00.000Z"
  }
}
```

**Si NO existe (404):**
```json
{
  "error": "No existe control de correlativo para este usuario y año",
  "data": null
}
```

---

### 2. CREAR nuevo control

**POST** `/api/formato-emisiones/correlativo-control/`

**Body:**
```json
{
  "usuario_id": 1,
  "ano": 2026,
  "numero_inicial": 1,
  "prefijo": null,
  "descripcion": "Control para usuario DKT año 2026"
}
```

**Respuesta (201):**
```json
{
  "message": "Control de correlativo creado exitosamente",
  "id": 1
}
```

---

### 3. ACTUALIZAR control

**PUT** `/api/formato-emisiones/correlativo-control/:id`

**Body (actualizar solo los campos que desees):**
```json
{
  "numero_proximo": 100,
  "descripcion": "Resetear a número 100"
}
```

**Respuesta (200):**
```json
{
  "message": "Control de correlativo actualizado exitosamente"
}
```

---

### 4. LISTAR todos los controles (con filtro opcional)

**GET** `/api/formato-emisiones/correlativo-control/lista`

**Con filtro de usuario:**
```
GET /api/formato-emisiones/correlativo-control/lista?usuarioId=1
```

**Respuesta (200):**
```json
{
  "message": "Controles de correlativo obtenidos",
  "data": [
    {
      "id": 1,
      "usuario_id": 1,
      "usuario_nombre": "Diego Torres",
      "ano": 2026,
      "numero_inicial": 1,
      "numero_proximo": 5,
      "descripcion": "Control para DKT 2026"
    },
    {
      "id": 2,
      "usuario_id": 1,
      "usuario_nombre": "Diego Torres",
      "ano": 2027,
      "numero_inicial": 1,
      "numero_proximo": 1,
      "descripcion": "Control para DKT 2027"
    }
  ],
  "total": 2
}
```

---

### 5. INCREMENTAR automáticamente el correlativo

**POST** `/api/formato-emisiones/correlativo-control/:usuarioId/:ano/incrementar`

Se ejecuta automáticamente después de generar un número.

**Respuesta (200):**
```json
{
  "message": "Correlativo incrementado",
  "numero_actual": 5,
  "numero_proximo": 6
}
```

---

### 6. ELIMINAR (desactivar) control

**DELETE** `/api/formato-emisiones/correlativo-control/:id`

**Respuesta (200):**
```json
{
  "message": "Control de correlativo eliminado exitosamente"
}
```

---

## 🔄 Flujo de Generación de Números

### Paso 1: Usuario crea nuevo formato

```javascript
const usuarioLogueado = { id: 1, nombre: "Diego Torres" };
const numeroGenerado = await generarNumeroDocumento(usuarioLogueado);
// → Resultado: "001-DT-2026"
```

### Paso 2: Sistema consulta tabla de control

```javascript
// Si existe control para usuario_id=1, ano=2026:
// → Obtiene numero_proximo = 1
// → Genera: "001-DT-2026"

// Si NO existe control:
// → Usa método fallback (contar formatos previos)
```

### Paso 3: Incrementar automáticamente (opcional)

Después de guardar el formato, puedes incrementar:

```javascript
await api.post(`/api/formato-emisiones/correlativo-control/1/2026/incrementar`);
// → numero_proximo: 1 → 2
```

---

## 🛠️ Casos de Uso

### Caso 1: Iniciar todos los usuarios en 001

```sql
-- Crear controles para 3 usuarios en 2026
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion) VALUES
(1, 2026, 1, 1, 'DT - Año 2026'),
(2, 2026, 1, 1, 'JG - Año 2026'),
(3, 2026, 1, 1, 'RC - Año 2026');
```

### Caso 2: Cambiar número inicial para usuario específico

```sql
-- DKT necesita comenzar en 50 en lugar de 1
UPDATE correlativo_control 
SET numero_inicial = 50, numero_proximo = 50 
WHERE usuario_id = 1 AND ano = 2026;

-- Resultado: Próximo formato será 050-DKT-2026
```

### Caso 3: Reiniciar correlativo para nuevo año

```sql
-- Es año nuevo (2027), reiniciar DKT
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion)
VALUES (1, 2027, 1, 1, 'DT - Año 2027 (nuevo)');
```

---

## 📊 Tabla de Referencia

| usuario_id | ano | numero_inicial | numero_proximo | Formato Generado |
|:----------:|:---:|:--:|:--:|:--:|
| 1 (DKT) | 2026 | 1 | 5 | 001-DKT-2026, 002-DKT-2026, ..., 005-DKT-2026 |
| 2 (JRG) | 2026 | 100 | 102 | 100-JRG-2026, 101-JRG-2026, 102-JRG-2026 |
| 1 (DKT) | 2027 | 1 | 1 | 001-DKT-2027 |
| 3 (MLP) | 2026 | 500 | 501 | 500-MLP-2026, 501-MLP-2026 |

---

## ⚙️ Configuración en Base de Datos

### Crear tabla (automático al iniciar servidor)

```sql
CREATE TABLE correlativo_control (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  ano INT NOT NULL,
  numero_inicial INT NOT NULL DEFAULT 1,
  numero_proximo INT NOT NULL DEFAULT 1,
  prefijo VARCHAR(50),
  descripcion VARCHAR(255),
  activo BOOLEAN DEFAULT 1,
  creado_por INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  UNIQUE KEY unique_usuario_ano (usuario_id, ano)
);
```

---

## 🚀 Próximos Pasos

1. ✅ **Crear tabla en BD** (ejecutar SQL)
2. ✅ **Crear controles iniciales** (insertar datos)
3. ✅ **Probar generación de números** (crear formato)
4. 🔄 **Opcional: Incrementar automáticamente** (después de guardar)

---

## 📝 Notas

- El correlativo se reinicia automáticamente cada año
- Si NO existe control para usuario/año → usa método fallback (contar previos)
- El campo `prefijo` está disponible para futuras personalizaciones
- La tabla es auditable (creado_en, actualizado_en)
