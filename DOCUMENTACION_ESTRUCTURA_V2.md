# 📋 Sistema de Gestión de Comisiones - Estructura de Base de Datos v2.0

## ✅ Implementación Completada

Se ha reestructurado completamente el sistema de comisiones con arquitectura de tablas maestras y detalles.

---

## 📊 Tablas Creadas

### 1. **TABLA MAESTRA: `ambitos`**
```sql
- id (INT, PK)
- nombre VARCHAR(100) UNIQUE
- activo BOOLEAN (default: 1)
- creado_en TIMESTAMP

DATOS POR DEFECTO:
- ALA PUCALLPA
- ALA ATALAYA
- ALA TARMA
- ALA PERENE
```

### 2. **TABLA MAESTRA: `clasificadores`**
```sql
- id (INT, PK)
- partida VARCHAR(50) UNIQUE (23.2.1.2.2, 23.2.1.2.1, etc.)
- nombre VARCHAR(200)
- descripcion TEXT
- activo BOOLEAN (default: 1)
- creado_en TIMESTAMP

DATOS POR DEFECTO (5 clasificadores):
1. 23.2.1.2.2 - PASAJES Y GASTOS DE TRANSPORTE
2. 23.2.1.2.1 - VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO ⭐ (especial)
3. 23.1.3.1.1 - COMBUSTIBLES Y CARBURANTES
4. 23.199.199 - OTROS BIENES
5. 23.2.1.299 - OTROS GASTOS
```

### 3. **TABLA PRINCIPAL: `comisiones`**
```sql
- id (INT, PK)
- ambito_id (INT, FK → ambitos)
- lugar VARCHAR(100)
- ruta VARCHAR(255)
- modalidad_viaje ENUM (TERRESTRE, AEREO, FLUVIAL, AEREO-TERRESTRE, etc.)
- fecha_salida DATETIME
- fecha_retorno DATETIME
- num_dias INT
- costo_xdia DECIMAL(10,2)
- costo_total_comision DECIMAL(10,2) [CALCULADO AUTOMÁTICAMENTE]
- observacion TEXT
- usuario_id (INT, FK → users)
- estado ENUM (activa, finalizada, cancelada)
- creado_en, actualizado_en TIMESTAMP
```

### 4. **TABLA DETALLE: `comision_comisionados`**
```sql
- id (INT, PK)
- comision_id (INT, FK → comisiones)
- usuario_id (INT, FK → users) [seleccionar de usuarios activos]
- clasificador_id (INT, FK → clasificadores)
- dias INT [hereda de comisiones pero puede variar]
- costo_xdia DECIMAL(10,2) [hereda de comisiones pero puede variar]
- monto DECIMAL(10,2) [valor ingresado]
- descripcion TEXT
- observacion TEXT
- creado_en, actualizado_en TIMESTAMP

UNIQUE KEY: (comision_id, usuario_id, clasificador_id)

CÁLCULO DE MONTO REAL (en aplicación):
- SI clasificador = "VIÁTICOS Y ASIGNACIONES..." → monto_real = días × costo_xdia
- OTROS → monto_real = monto (tal como se ingresa)
```

---

## 🔄 Flujo de Cálculo de Costos

### Paso 1: Crear Comisión Principal
```
POST /api/comisiones
{
  "ambito_id": 1,
  "lugar": "QUIPARACRA",
  "ruta": "TARMA - QUIPARACRA - TARMA",
  "modalidad_viaje": "TERRESTRE",
  "fecha_salida": "2026-02-10T07:00:00",
  "fecha_retorno": "2026-02-10T17:00:00",
  "num_dias": 1,
  "costo_xdia": 220,
  "observacion": "Inspección"
}
```
→ Retorna: `comision_id`

### Paso 2: Agregar Comisionados con Partidas
```
POST /api/comisiones/{comision_id}/comisionados
{
  "usuario_id": 2,
  "clasificador_id": 2,      // VIÁTICOS Y ASIGNACIONES
  "dias": 1,
  "costo_xdia": 220,
  "monto": 0,                // NO IMPORTA, se calcula: 1 × 220 = 220
  "descripcion": "Comisionado 1"
}
```

```
POST /api/comisiones/{comision_id}/comisionados
{
  "usuario_id": 3,
  "clasificador_id": 1,      // PASAJES Y GASTOS DE TRANSPORTE
  "dias": 1,
  "costo_xdia": 220,
  "monto": 150,              // Se ingresa manualmente: 150
  "descripcion": "Pasajes"
}
```

### Paso 3: Cálculo Automático del Total
```
Comisionado 1 (VIÁTICOS):    1 × 220 = 220
Comisionado 2 (PASAJES):     150 (ingresado)
─────────────────────────────────────
TOTAL DE COMISIÓN:           370
```

---

## 📡 APIs Implementadas

### ÁMBITOS
- `GET /api/ambitos` - Listar todos los ámbitos activos
- `GET /api/ambitos/{id}` - Obtener ámbito por ID
- `POST /api/ambitos` - Crear nuevo ámbito
- `PUT /api/ambitos/{id}` - Actualizar ámbito
- `DELETE /api/ambitos/{id}` - Eliminar (soft delete)

### CLASIFICADORES
- `GET /api/clasificadores` - Listar clasificadores activos
- `GET /api/clasificadores/{id}` - Obtener clasificador
- `POST /api/clasificadores` - Crear clasificador
- `PUT /api/clasificadores/{id}` - Actualizar
- `DELETE /api/clasificadores/{id}` - Eliminar (soft delete)

### USUARIOS
- `GET /api/usuarios/activos` - Listar usuarios activos (para seleccionar comisionados)
- `GET /api/usuarios/{id}` - Obtener usuario

### COMISIONES
- `POST /api/comisiones` - Crear comisión principal
- `GET /api/comisiones` - Listar todas (con query `?solo_mias=true`)
- `GET /api/comisiones/{id}` - Obtener comisión con detalles
- `PUT /api/comisiones/{id}` - Actualizar comisión
- `DELETE /api/comisiones/{id}` - Eliminar comisión

### COMISIONADOS
- `POST /api/comisiones/{comision_id}/comisionados` - Agregar comisionado
- `GET /api/comisiones/{comision_id}/comisionados` - Listar comisionados
- `PUT /api/comisionados/{id}` - Actualizar comisionado
- `DELETE /api/comisionados/{id}` - Eliminar comisionado

---

## 🔐 Seguridad

✅ Todas las rutas requieren autenticación (JWT)
✅ Las FK verifican integridad referencial
✅ Soft delete en tablas maestras (no se pierde información)
✅ UNIQUE constraints evitan duplicados

---

## 🚀 Próximos Pasos

### FRONTEND (React)
1. Crear página "Nueva Comisión" con:
   - Formulario principal (seleccionar ámbito, lugar, ruta, modalidad, fechas, costo/día)
   - Tabla dinámica de comisionados (agregar/quitar)
   - Para cada comisionado: tabla de partidas/clasificadores
   - Cálculo automático de totales en tiempo real

2. Crear página "Listar Comisiones" con:
   - Tabla con todas las comisiones
   - Botones editar/eliminar/ver detalles

3. Crear página "Detalles Comisión" con:
   - Información principal
   - Tabla de comisionados con detalles
   - Exportar a PDF/Excel

---

## 📋 Datos de Prueba

### Usuarios disponibles:
- admin (Administrador Sistema)
- dkong, carcos, atello, nsalinas, prengifo, ealiaga, moyola, jmatta, calegria, lflores, fcastillo, snunez, rflores, bpanana, epina, daguinaga, nseijas, cangulo, lacuna, mtalavera, jmunante, sregalado, olopez, jferreyros, jolortegui

**Contraseña para todos: `Autoridad1`**

### Ámbitos:
- ALA PUCALLPA
- ALA ATALAYA
- ALA TARMA
- ALA PERENE

### Clasificadores:
- Partidas según tabla maestra

---

## ✨ Características Especiales

⭐ **Cálculo automático de VIÁTICOS**: Si el clasificador es "VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO", el monto se calcula automáticamente como `días × costo_xdia`.

⭐ **Otros clasificadores**: El monto se ingresa manualmente, independiente de días y costo_xdia.

⭐ **Total dinámico**: Se recalcula automáticamente cada vez que se agrega, actualiza o elimina un comisionado.

---

## 📝 Notas de Implementación

- Las columnas `monto_real` se calculan en la aplicación, no en la BD (MySQL no soporta subqueries en GENERATED ALWAYS AS)
- Los totales se actualizan automáticamente después de cada operación
- Todas las fechas usan DATETIME para mantener precisión horaria
- Los estados de comisión ayudan a trackear el ciclo de vida
- Sistema completamente preparado para la interfaz React

---

**ESTADO: ✅ BACKEND 100% COMPLETO Y FUNCIONAL**

Listo para comenzar con el frontend React. 🎉
