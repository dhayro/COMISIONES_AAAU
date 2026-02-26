# API Metas - Documentación de Interfaz

## Descripción

El módulo de **Metas** proporciona una API completa para gestionar las metas organizacionales del sistema. Las metas están asociadas a ámbitos (AAA y ALA) y permiten definir objetivos específicos para cada período.

## Versión
- **Versión API**: 1.0.0
- **Última actualización**: Febrero 2026

## Base URL
```
/api/metas
```

## Autenticación
Todas las rutas requieren autenticación mediante JWT Bearer Token:
```
Authorization: Bearer <token_jwt>
```

---

## Endpoints

### 1. Listar Metas (GET)
**Obtiene una lista de todas las metas activas**

```http
GET /api/metas
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "Meta Local - Autoridad Local de Agua Perené",
    "numero_meta": "067",
    "periodo": "2026",
    "ambito_id": 2,
    "ambito_nombre": "ALA PERENÉ",
    "activo": 1,
    "created_at": "2026-02-17T10:30:00.000Z",
    "updated_at": "2026-02-17T10:30:00.000Z"
  },
  {
    "id": 2,
    "nombre": "Meta Local - Autoridad Local de Agua Tarma",
    "numero_meta": "068",
    "periodo": "2026",
    "ambito_id": 3,
    "ambito_nombre": "ALA TARMA",
    "activo": 1,
    "created_at": "2026-02-17T10:35:00.000Z",
    "updated_at": "2026-02-17T10:35:00.000Z"
  }
]
```

---

### 2. Obtener Meta por ID (GET)
**Obtiene los detalles de una meta específica**

```http
GET /api/metas/:id
Authorization: Bearer <token>
```

**Parámetros:**
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| id | integer | Path | Sí | ID de la meta |

**Response 200:**
```json
{
  "id": 1,
  "nombre": "Meta Local - Autoridad Local de Agua Perené",
  "numero_meta": "067",
  "periodo": "2026",
  "ambito_id": 2,
  "ambito_nombre": "ALA PERENÉ",
  "activo": 1
}
```

**Response 404:**
```json
{
  "error": "Meta no encontrada"
}
```

---

### 3. Crear Meta (POST)
**Crea una nueva meta en el sistema**

```http
POST /api/metas
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (Requerido):**
```json
{
  "nombre": "Meta Local - Autoridad Local de Agua Pucallpa",
  "numero_meta": "069",
  "periodo": "2026",
  "ambito_id": 4
}
```

**Validaciones:**
- `nombre`: string, requerido, 1-255 caracteres
- `numero_meta`: string, requerido, patrón 3 dígitos (^\\d{3}$)
- `periodo`: string, requerido, patrón 4 dígitos (^\\d{4}$)
- `ambito_id`: integer o null, opcional

**Response 201:**
```json
{
  "mensaje": "Meta creada exitosamente",
  "meta": {
    "id": 3,
    "nombre": "Meta Local - Autoridad Local de Agua Pucallpa",
    "numero_meta": "069",
    "periodo": "2026",
    "ambito_id": 4,
    "ambito_nombre": "ALA PUCALLPA",
    "activo": 1
  }
}
```

**Response 400:**
```json
{
  "error": "Nombre, número de meta y período son requeridos"
}
```

---

### 4. Actualizar Meta (PUT)
**Actualiza los datos de una meta existente**

```http
PUT /api/metas/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros:**
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| id | integer | Path | Sí | ID de la meta |

**Body (Opcional - mínimo 1 campo):**
```json
{
  "nombre": "Meta Local - Autoridad Local de Agua Perené (Actualizada)",
  "periodo": "2026",
  "ambito_id": 2
}
```

**Response 200:**
```json
{
  "mensaje": "Meta actualizada exitosamente",
  "meta": {
    "id": 1,
    "nombre": "Meta Local - Autoridad Local de Agua Perené (Actualizada)",
    "numero_meta": "067",
    "periodo": "2026",
    "ambito_id": 2,
    "ambito_nombre": "ALA PERENÉ",
    "activo": 1
  }
}
```

**Response 404:**
```json
{
  "error": "Meta no encontrada"
}
```

---

### 5. Eliminar Meta (DELETE)
**Marca una meta como eliminada (soft delete)**

```http
DELETE /api/metas/:id
Authorization: Bearer <token>
```

**Parámetros:**
| Parámetro | Tipo | Ubicación | Requerido | Descripción |
|-----------|------|-----------|-----------|-------------|
| id | integer | Path | Sí | ID de la meta |

**Response 200:**
```json
{
  "mensaje": "Meta eliminada exitosamente"
}
```

**Response 404:**
```json
{
  "error": "Meta no encontrada"
}
```

---

## Estructura de Datos

### Meta Object
```typescript
{
  id: number,                    // ID único
  nombre: string,                // Nombre descriptivo
  numero_meta: string,           // Número único (3 dígitos)
  periodo: string,               // Período/año (4 dígitos)
  ambito_id: number | null,      // FK a tabla ambitos
  ambito_nombre: string | null,  // Nombre del ámbito (JOIN)
  activo: number,                // 1 = activo, 0 = inactivo
  created_at: Date,              // Fecha de creación
  updated_at: Date               // Fecha de última actualización
}
```

---

## Códigos de Error

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token no válido o no proporcionado |
| 403 | Forbidden | Sin permisos para ejecutar la acción |
| 404 | Not Found | Meta no encontrada |
| 500 | Internal Server Error | Error interno del servidor |

---

## Ejemplos de Uso (cURL)

### Listar todas las metas
```bash
curl -X GET http://localhost:5000/api/metas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener meta por ID
```bash
curl -X GET http://localhost:5000/api/metas/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear nueva meta
```bash
curl -X POST http://localhost:5000/api/metas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nueva Meta",
    "numero_meta": "070",
    "periodo": "2026",
    "ambito_id": 2
  }'
```

### Actualizar meta
```bash
curl -X PUT http://localhost:5000/api/metas/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Meta Actualizada"
  }'
```

### Eliminar meta
```bash
curl -X DELETE http://localhost:5000/api/metas/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Archivos Relacionados

- **Modelo**: `backend/models/Meta.js`
- **Controlador**: `backend/controllers/metaController.js`
- **Rutas**: `backend/routes/comisiones.js` (líneas 1136-1259)
- **Interfaz**: `backend/types/MetaInterface.js`
- **Esquema**: `backend/types/MetaSchema.js`
- **Tipos**: `backend/types/Meta.js`

---

## Notas Importantes

1. **Soft Delete**: Cuando se elimina una meta, no se remueve de la base de datos, solo se marca como inactiva (`activo = 0`)
2. **JOIN de Ámbitos**: El campo `ambito_nombre` se incluye automáticamente mediante LEFT JOIN con la tabla `ambitos`
3. **Validación de Números**: Los números de meta deben ser de exactamente 3 dígitos (ej: "067", "198")
4. **Períodos**: Los períodos son almacenados como strings de 4 dígitos (años, ej: "2026")
5. **Ámbitos Opcionales**: Una meta puede no tener ámbito asociado (ambito_id = null)

---

## Testing

Para probar los endpoints, usar Postman, Insomnia o cualquier cliente HTTP con los ejemplos de arriba.

**URL Base de Desarrollo**: `http://localhost:5000/api`
