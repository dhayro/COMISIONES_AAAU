# 📊 Estructura de la Base de Datos - Gestión de Comisiones

## 🗂️ Tablas Principales

### 1. **users** - Usuarios del Sistema
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  rol ENUM('admin', 'usuario') DEFAULT 'usuario',
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Ejemplo:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "dhayro.kong@hotmail.com",
  "nombre": "Administrador Sistema",
  "rol": "admin",
  "activo": 1
}
```

---

### 2. **ambitos** - Áreas de Actuación
```sql
CREATE TABLE ambitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Datos por Defecto:**
```json
[
  { "id": 1, "nombre": "ALA PUCALLPA" },
  { "id": 2, "nombre": "ALA ATALAYA" },
  { "id": 3, "nombre": "ALA TARMA" },
  { "id": 4, "nombre": "ALA PERENE" }
]
```

---

### 3. **clasificadores** - Partidas Presupuestales
```sql
CREATE TABLE clasificadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partida VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_partida (partida),
  INDEX idx_nombre (nombre)
)
```

**Datos por Defecto:**
```json
[
  {
    "id": 1,
    "partida": "23.2.1.2.2",
    "nombre": "PASAJES Y GASTOS DE TRANSPORTE",
    "descripcion": "Gastos de transporte y pasajes"
  },
  {
    "id": 2,
    "partida": "23.2.1.2.1",
    "nombre": "VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO",
    "descripcion": "Viáticos y asignaciones por comisión"
  },
  {
    "id": 3,
    "partida": "23.1.3.1.1",
    "nombre": "COMBUSTIBLES Y CARBURANTES",
    "descripcion": "Combustibles y carburantes"
  },
  {
    "id": 4,
    "partida": "23.199.199",
    "nombre": "OTROS BIENES",
    "descripcion": "Otros bienes"
  },
  {
    "id": 5,
    "partida": "23.2.1.299",
    "nombre": "OTROS GASTOS",
    "descripcion": "Otros gastos de comisión"
  }
]
```

---

### 4. **comisiones** - Cabecera de Comisiones
```sql
CREATE TABLE comisiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ambito_id INT NOT NULL,
  lugar VARCHAR(100) NOT NULL,
  ruta VARCHAR(255),
  modalidad_viaje ENUM('TERRESTRE', 'AEREO', 'FLUVIAL', 'AEREO-TERRESTRE', 'AEREO-FLUVIAL', 'TERRESTRE-FLUVIAL', 'AEREO-TERRESTRE-FLUVIAL') DEFAULT 'TERRESTRE',
  fecha_salida DATETIME NOT NULL,
  fecha_retorno DATETIME NOT NULL,
  num_dias INT NOT NULL,
  costo_xdia DECIMAL(10, 2) NOT NULL,
  costo_total_comision DECIMAL(10, 2) DEFAULT 0,
  observacion TEXT,
  usuario_id INT NOT NULL,
  estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
  presupuesto_estado ENUM('PRESUPUESTO ASIGNADO', 'PRESUPUESTO POR ASIGNAR') DEFAULT 'PRESUPUESTO POR ASIGNAR',
  presupuesto_documento VARCHAR(255),
  presupuesto_numero_cut VARCHAR(50),
  presupuesto_fecha DATE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ambito_id) REFERENCES ambitos(id),
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_ambito (ambito_id),
  INDEX idx_estado (estado),
  INDEX idx_fechas (fecha_salida, fecha_retorno),
  INDEX idx_presupuesto (presupuesto_estado)
)
```

**Ejemplo:**
```json
{
  "id": 1,
  "ambito_id": 1,
  "ambito_nombre": "ALA PUCALLPA",
  "lugar": "Lima",
  "ruta": "Pucallpa -> Lima",
  "modalidad_viaje": "AEREO",
  "fecha_salida": "2026-02-10T08:00:00Z",
  "fecha_retorno": "2026-02-15T18:00:00Z",
  "num_dias": 5,
  "costo_xdia": 150.00,
  "costo_total_comision": 750.00,
  "observacion": "Inspección de obras",
  "usuario_id": 1,
  "estado": "activa"
}
```

---

### 5. **comision_comisionados** - Detalle de Comisionados (IMPORTANTE)

```sql
CREATE TABLE comision_comisionados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comision_id INT NOT NULL,
  usuario_id INT NOT NULL,
  clasificador_id INT NOT NULL,
  dias INT NOT NULL,
  costo_xdia DECIMAL(10, 2) NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  descripcion TEXT,
  observacion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (comision_id) REFERENCES comisiones(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (clasificador_id) REFERENCES clasificadores(id) ON DELETE RESTRICT,
  INDEX idx_comision (comision_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_clasificador (clasificador_id),
  UNIQUE KEY unique_comision_usuario_clasificador (comision_id, usuario_id, clasificador_id)
)
```

**Ejemplo - Estructura en BD:**
```json
{
  "id": 1,
  "comision_id": 1,
  "usuario_id": 2,
  "clasificador_id": 1,
  "dias": 5,
  "costo_xdia": 150.00,
  "monto": 750.00,
  "monto_real": 750.00,
  "descripcion": "Viático oficial",
  "observacion": null,
  "usuario_nombre": "DHAYRO KONG TORRES",
  "clasificador_nombre": "VIÁTICOS Y ASIGNACIONES",
  "partida": "23.2.1.2.2"
}
```

---

## 📋 Ejemplo Completo de Estructura de Datos

### Escenario: Comisión a Lima con 2 Comisionados

**TABLA: comisiones**
```
id | ambito_id | lugar | modalidad | fecha_salida | num_dias | costo_xdia | costo_total_comision | usuario_id | estado
1  | 1         | Lima  | AEREO     | 2026-02-10   | 5        | 150        | 900.00               | 1          | activa
```

**TABLA: comision_comisionados**
```
id | comision_id | usuario_id | clasificador_id | dias | costo_xdia | monto  | descripcion
1  | 1           | 2          | 1               | 5    | 150        | 750.00 | Viático oficial
2  | 1           | 3          | 2               | 5    | 150        | 750.00 | Pasaje aéreo
```

**RESPUESTA API GET /api/comisiones/1:**
```json
{
  "id": 1,
  "ambito_id": 1,
  "ambito_nombre": "ALA PUCALLPA",
  "lugar": "Lima",
  "ruta": "ALA Pucallpa -> Lima",
  "modalidad_viaje": "AEREO",
  "fecha_salida": "2026-02-10T08:00:00.000Z",
  "fecha_retorno": "2026-02-15T18:00:00.000Z",
  "num_dias": 5,
  "costo_xdia": 150.00,
  "costo_total_comision": 900.00,
  "observacion": null,
  "usuario_id": 1,
  "estado": "activa",
  "comisionados": [
    {
      "id": 1,
      "comision_id": 1,
      "usuario_id": 2,
      "usuario_nombre": "DHAYRO KONG TORRES",
      "clasificador_id": 1,
      "clasificador_nombre": "PASAJES Y GASTOS DE TRANSPORTE",
      "partida": "23.2.1.2.2",
      "dias": 5,
      "costo_xdia": 150.00,
      "monto": 750.00,
      "monto_real": 750.00,
      "descripcion": "Viático oficial",
      "observacion": null
    },
    {
      "id": 2,
      "comision_id": 1,
      "usuario_id": 3,
      "usuario_nombre": "CAROL MELANI ARCOS BINDER",
      "clasificador_id": 2,
      "clasificador_nombre": "VIÁTICOS Y ASIGNACIONES POR COMISIÓN",
      "partida": "23.2.1.2.1",
      "dias": 5,
      "costo_xdia": 150.00,
      "monto": 750.00,
      "monto_real": 750.00,
      "descripcion": "Pasaje aéreo",
      "observacion": null
    }
  ]
}
```

---

## 🔄 Relaciones Entre Tablas

```
users (1) ──┬─→ (N) comisiones
            ├─→ (N) comision_comisionados

ambitos (1) ──→ (N) comisiones

clasificadores (1) ──→ (N) comision_comisionados

comisiones (1) ──→ (N) comision_comisionados
```

---

## 🎯 Reglas de Negocio

### 1. **Comisionados en Comisión**
- Un comisionado (usuario) puede participar en múltiples comisiones
- Una comisión puede tener múltiples comisionados
- Un comisionado puede tener múltiples roles (clasificadores) en la misma comisión
- **CONSTRAINT ÚNICO**: `(comision_id, usuario_id, clasificador_id)` - No se puede repetir la misma combinación

### 2. **Cálculo de Montos**
- **VIÁTICOS**: `monto_real = dias × costo_xdia` (automático en aplicación)
- **Otros**: Usa el `monto` ingresado manualmente
- **Total Comisión**: Suma de todos los `monto_real` de comisionados

### 3. **Estados**
- `activa` - Comisión en curso o pendiente
- `finalizada` - Comisión completada
- `cancelada` - Comisión cancelada

### 4. **Cascadas**
- Al eliminar una comisión → Se eliminan todos sus comisionados (CASCADE)
- Al eliminar un usuario → NO se puede si tiene comisiones (RESTRICT)
- Al eliminar un clasificador → NO se puede si está en comisionados (RESTRICT)

---

## 📊 Consultas Útiles

### Ver todas las comisiones con sus comisionados:
```sql
SELECT 
  c.id, c.lugar, a.nombre as ambito,
  GROUP_CONCAT(u.nombre) as comisionados,
  c.costo_total_comision,
  c.estado
FROM comisiones c
LEFT JOIN ambitos a ON c.ambito_id = a.id
LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
LEFT JOIN users u ON cc.usuario_id = u.id
GROUP BY c.id
ORDER BY c.fecha_salida DESC;
```

### Ver comisionados de una comisión específica:
```sql
SELECT 
  cc.id,
  u.nombre as comisionado,
  cl.nombre as partida,
  cc.dias,
  cc.costo_xdia,
  cc.monto
FROM comision_comisionados cc
JOIN users u ON cc.usuario_id = u.id
JOIN clasificadores cl ON cc.clasificador_id = cl.id
WHERE cc.comision_id = 1
ORDER BY cc.usuario_id;
```

### Total gastado por usuario en comisiones:
```sql
SELECT 
  u.nombre,
  COUNT(DISTINCT cc.comision_id) as num_comisiones,
  SUM(cc.monto) as total_gastado
FROM comision_comisionados cc
JOIN users u ON cc.usuario_id = u.id
GROUP BY u.id
ORDER BY total_gastado DESC;
```

---

## 📝 Notas

- La tabla `comision_comisionados` es la CLAVE para el sistema, conecta comisiones con sus detalles
- Cada registro en `comision_comisionados` representa UN rol/partida de UN usuario en UNA comisión
- El campo `monto_real` se calcula en la aplicación, NO está almacenado en BD
- Los 26 usuarios por defecto tienen contraseña: `Autoridad1`
