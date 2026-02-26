# 📚 Documentación API - Gestión de Comisiones AAAU

## Base URL
```
http://localhost:5000/api
```

## Autenticación
Todos los endpoints requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 AUTENTICACIÓN (/api/auth)

### 1. Registrar usuario
```http
POST /api/auth/registrar
Content-Type: application/json

{
  "email": "usuario@example.com",
  "username": "usuario",
  "password": "password123",
  "nombre": "Nombre Completo"
}
```
**Respuesta (201):** Usuario registrado exitosamente

---

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```
**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "nombre": "Administrador"
  }
}
```

### 3. Obtener perfil
```http
GET /api/auth/perfil
Authorization: Bearer <token>
```
**Respuesta (200):** Datos del usuario autenticado

---

## 📍 ÁMBITOS (/api/ambitos)

### 1. Listar todos los ámbitos
```http
GET /api/ambitos
Authorization: Bearer <token>
```
**Respuesta (200):**
```json
[
  {
    "id": 1,
    "nombre": "ALA PUCALLPA",
    "activo": 1
  },
  {
    "id": 2,
    "nombre": "ALA ATALAYA",
    "activo": 1
  }
]
```

### 2. Obtener ámbito por ID
```http
GET /api/ambitos/{id}
Authorization: Bearer <token>

Parámetros:
- id (path): ID del ámbito (ej: 1)
```
**Respuesta (200):**
```json
{
  "id": 1,
  "nombre": "ALA PUCALLPA",
  "activo": 1
}
```

### 3. Crear nuevo ámbito
```http
POST /api/ambitos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "ALA NUEVA"
}
```
**Respuesta (201):**
```json
{
  "mensaje": "Ámbito creado exitosamente",
  "id": 5
}
```

### 4. Actualizar ámbito
```http
PUT /api/ambitos/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "ALA ACTUALIZADA"
}
```

### 5. Eliminar ámbito
```http
DELETE /api/ambitos/{id}
Authorization: Bearer <token>
```

---

## 📊 CLASIFICADORES (/api/clasificadores)

### 1. Listar clasificadores
```http
GET /api/clasificadores
Authorization: Bearer <token>
```
**Respuesta (200):**
```json
[
  {
    "id": 1,
    "nombre": "VIÁTICOS",
    "partida": "23.2.1.2.2",
    "activo": 1
  },
  {
    "id": 2,
    "nombre": "PASAJES AÉREOS",
    "partida": "23.2.1.2.1",
    "activo": 1
  }
]
```

### 2. Obtener clasificador por ID
```http
GET /api/clasificadores/{id}
Authorization: Bearer <token>
```

### 3. Crear clasificador
```http
POST /api/clasificadores
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "GASTOS OPERACIONALES",
  "partida": "23.2.1.299"
}
```

### 4. Actualizar clasificador
```http
PUT /api/clasificadores/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "VIÁTICOS ACTUALIZADO",
  "partida": "23.2.1.2.2"
}
```

### 5. Eliminar clasificador
```http
DELETE /api/clasificadores/{id}
Authorization: Bearer <token>
```

---

## 👥 USUARIOS (/api/usuarios)

### 1. Listar usuarios activos
```http
GET /api/usuarios/activos
Authorization: Bearer <token>
```
**Respuesta (200):**
```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "usuario",
    "activo": 1
  },
  {
    "id": 2,
    "nombre": "María García",
    "email": "maria@example.com",
    "rol": "usuario",
    "activo": 1
  }
]
```

### 2. Obtener usuario por ID
```http
GET /api/usuarios/{id}
Authorization: Bearer <token>
```

---

## ✈️ COMISIONES (/api/comisiones)

### 1. Crear comisión
```http
POST /api/comisiones
Authorization: Bearer <token>
Content-Type: application/json

{
  "ambito_id": 1,
  "lugar": "Lima",
  "ruta": "ALA Pucallpa -> Lima",
  "modalidad_viaje": "AEREO",
  "fecha_salida": "2026-02-10T08:00:00Z",
  "fecha_retorno": "2026-02-15T18:00:00Z",
  "num_dias": 5,
  "costo_xdia": 150.00,
  "observacion": "Inspección de obras"
}
```
**Respuesta (201):**
```json
{
  "mensaje": "Comisión creada exitosamente",
  "comision_id": 1
}
```

### 2. Listar comisiones
```http
GET /api/comisiones
Authorization: Bearer <token>

Parámetros (query):
- solo_mias (boolean, opcional): Mostrar solo comisiones del usuario autenticado
```
**Respuesta (200):**
```json
[
  {
    "id": 1,
    "ambito_id": 1,
    "ambito_nombre": "ALA PUCALLPA",
    "lugar": "Lima",
    "ruta": "ALA Pucallpa -> Lima",
    "modalidad_viaje": "AEREO",
    "fecha_salida": "2026-02-10T08:00:00Z",
    "fecha_retorno": "2026-02-15T18:00:00Z",
    "num_dias": 5,
    "costo_xdia": 150.00,
    "costo_total_comision": 750.00,
    "estado": "En Proceso",
    "usuario_id": 1
  }
]
```

### 3. Obtener comisión por ID
```http
GET /api/comisiones/{id}
Authorization: Bearer <token>
```
**Respuesta (200):**
```json
{
  "id": 1,
  "ambito_id": 1,
  "ambito_nombre": "ALA PUCALLPA",
  "lugar": "Lima",
  "ruta": "ALA Pucallpa -> Lima",
  "modalidad_viaje": "AEREO",
  "fecha_salida": "2026-02-10T08:00:00Z",
  "fecha_retorno": "2026-02-15T18:00:00Z",
  "num_dias": 5,
  "costo_xdia": 150.00,
  "costo_total_comision": 750.00,
  "estado": "En Proceso",
  "observacion": "Inspección de obras",
  "usuario_id": 1,
  "comisionados": [
    {
      "id": 1,
      "usuario_id": 2,
      "usuario_nombre": "Juan Pérez",
      "clasificador_id": 1,
      "clasificador_nombre": "VIÁTICOS",
      "partida": "23.2.1.2.2",
      "dias": 5,
      "costo_xdia": 150.00,
      "monto": 750.00,
      "monto_real": 750.00,
      "descripcion": "Viático oficial",
      "observacion": null
    }
  ]
}
```

### 4. Actualizar comisión
```http
PUT /api/comisiones/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "ambito_id": 2,
  "lugar": "Arequipa",
  "num_dias": 6,
  "costo_xdia": 160.00
}
```

### 5. Eliminar comisión
```http
DELETE /api/comisiones/{id}
Authorization: Bearer <token>
```

---

## 👤 COMISIONADOS (/api/comisionados)

### 1. Agregar comisionado a comisión
```http
POST /api/comisiones/{comision_id}/comisionados
Authorization: Bearer <token>
Content-Type: application/json

{
  "usuario_id": 2,
  "clasificador_id": 1,
  "dias": 5,
  "costo_xdia": 150.00,
  "monto": 750.00,
  "descripcion": "Viático oficial",
  "observacion": null
}
```
**Respuesta (201):**
```json
{
  "mensaje": "Comisionado agregado exitosamente",
  "id": 1
}
```

### 2. Obtener comisionados de una comisión
```http
GET /api/comisiones/{comision_id}/comisionados
Authorization: Bearer <token>
```
**Respuesta (200):**
```json
[
  {
    "id": 1,
    "usuario_id": 2,
    "usuario_nombre": "Juan Pérez",
    "clasificador_id": 1,
    "clasificador_nombre": "VIÁTICOS",
    "partida": "23.2.1.2.2",
    "dias": 5,
    "costo_xdia": 150.00,
    "monto": 750.00,
    "monto_real": 750.00,
    "descripcion": "Viático oficial",
    "observacion": null
  }
]
```

### 3. Actualizar comisionado
```http
PUT /api/comisionados/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "dias": 6,
  "costo_xdia": 160.00,
  "monto": 960.00
}
```

### 4. Eliminar comisionado
```http
DELETE /api/comisionados/{id}
Authorization: Bearer <token>
```

---

## 📋 NOTAS IMPORTANTES

### Modalidades de Viaje Disponibles
- `TERRESTRE`
- `AEREO`
- `FLUVIAL`
- `AEREO-TERRESTRE`
- `AEREO-FLUVIAL`
- `TERRESTRE-FLUVIAL`
- `AEREO-TERRESTRE-FLUVIAL`

### Cálculo Automático de Monto
- **VIÁTICOS**: Se calcula automáticamente como `dias × costo_xdia`
- **Otros clasificadores**: Se usa el valor de `monto` proporcionado

### Estados de Comisión
- `En Proceso` (default)
- `Aprobada`
- `Rechazada`
- `Finalizaда`

### Respuestas de Error

#### 400 - Bad Request
```json
{
  "error": "Faltan campos requeridos"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Token no válido"
}
```

#### 404 - Not Found
```json
{
  "error": "Recurso no encontrado"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Mensaje de error del servidor"
}
```

---

## 🧪 Prueba Rápida

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Listar Ámbitos
```bash
curl -X GET http://localhost:5000/api/ambitos \
  -H "Authorization: Bearer <token>"
```

### 3. Obtener Ámbito Específico
```bash
curl -X GET http://localhost:5000/api/ambitos/1 \
  -H "Authorization: Bearer <token>"
```

---

## 📖 Swagger UI
Accede a la documentación interactiva en:
```
http://localhost:5000/api-docs
```
