# 📋 INTERFAZ API METAS - RESUMEN COMPLETO

## 🎯 Descripción General

Se ha creado una **interfaz completa y profesional** para el API de Metas siguiendo estándares de OpenAPI 3.0 y las mejores prácticas de documentación de APIs.

---

## 📁 Archivos Creados

### 1. **Meta.js** - Definiciones de Tipos
   - **Ubicación**: `backend/types/Meta.js`
   - **Propósito**: Documentación de tipos usando JSDoc
   - **Contenido**:
     - `@typedef Meta` - Objeto completo de meta
     - `@typedef CreateMetaRequest` - Datos para crear
     - `@typedef UpdateMetaRequest` - Datos para actualizar
     - `@typedef MetaResponse` - Respuesta del servidor
     - `@typedef MetaListResponse` - Lista de metas
     - `@typedef ApiResponse` - Respuesta genérica

### 2. **MetaSchema.js** - Esquemas de Validación
   - **Ubicación**: `backend/types/MetaSchema.js`
   - **Propósito**: Definición de esquemas JSON Schema para validación
   - **Esquemas**:
     - `create` - Validación al crear meta
     - `update` - Validación al actualizar meta
     - `list` - Esquema de respuesta de lista
     - `single` - Esquema de respuesta individual
   - **Uso**: Validación en lado servidor y documentación

### 3. **MetaInterface.js** - Interfaz Completa del API
   - **Ubicación**: `backend/types/MetaInterface.js`
   - **Propósito**: Documentación detallada de cada endpoint
   - **Contenido**:
     - `metaAPI` - Definición de todos los 5 endpoints
     - `httpStatuses` - Códigos HTTP comúnes
     - `requiredHeaders` - Headers necesarios
     - `commonErrors` - Errores estándares
   - **Formato**: Estructura de objeto JavaScript para fácil referencia

### 4. **MetaOpenAPI.js** - Especificación OpenAPI 3.0
   - **Ubicación**: `backend/types/MetaOpenAPI.js`
   - **Propósito**: Especificación completa OpenAPI 3.0 para generación automática de documentación
   - **Características**:
     - Definición de todas las rutas (paths)
     - Esquemas de request/response
     - Componentes reutilizables
     - Security schemes (JWT Bearer)
     - Tags para organización
   - **Uso**: Swagger UI, generadores de clientes SDK, etc.

### 5. **META_INTERFACE_README.md** - Documentación en Markdown
   - **Ubicación**: `backend/types/META_INTERFACE_README.md`
   - **Propósito**: Referencia rápida y legible para desarrolladores
   - **Contenido**:
     - Descripción de cada endpoint con ejemplos
     - Estructura de datos
     - Códigos de error
     - Ejemplos de cURL
     - Notas importantes
   - **Formato**: Markdown con tablas, ejemplos, y enlaces

### 6. **META_INTERFACE_INDEX.js** - Índice y Resumen
   - **Ubicación**: `backend/types/META_INTERFACE_INDEX.js`
   - **Propósito**: Índice central de toda la interfaz
   - **Contiene**:
     - Estructura de archivos
     - Resumen de endpoints
     - Estructura de datos
     - Validaciones
     - Respuestas de ejemplo
     - Información de implementación
     - Guía de uso

### 7. **test-metas-api.sh** - Script de Pruebas
   - **Ubicación**: `backend/types/test-metas-api.sh`
   - **Propósito**: Script de shell con ejemplos de prueba para todos los endpoints
   - **Contenido**:
     - Ejemplos de cURL para cada endpoint
     - Pruebas de error
     - Guía de validación de respuestas
   - **Uso**: `bash backend/types/test-metas-api.sh`

---

## 🔗 Relación con la Implementación

```
┌─────────────────────────────────────────┐
│         INTERFAZ (Especificación)       │
├─────────────────────────────────────────┤
│ • Meta.js (Tipos)                       │
│ • MetaSchema.js (Validaciones)          │
│ • MetaInterface.js (Estructura)         │
│ • MetaOpenAPI.js (OpenAPI 3.0)          │
│ • META_INTERFACE_README.md (Docs)       │
│ • META_INTERFACE_INDEX.js (Índice)      │
│ • test-metas-api.sh (Tests)             │
└─────────────────────────────────────────┘
            ⬇️  Implementa  ⬇️
┌─────────────────────────────────────────┐
│      BACKEND (Implementación)            │
├─────────────────────────────────────────┤
│ • Meta.js (Modelo)                      │
│ • metaController.js (Controlador)       │
│ • comisiones.js (Rutas + Swagger)       │
│ • database.js (Inicialización)          │
└─────────────────────────────────────────┘
            ⬇️  Consume  ⬇️
┌─────────────────────────────────────────┐
│      FRONTEND (Consumidor)               │
├─────────────────────────────────────────┤
│ • GestionMetas.js (Componente)          │
│ • api.js (Servicio)                     │
│ • routes.js (Enrutamiento)              │
└─────────────────────────────────────────┘
```

---

## 📊 Resumen de Endpoints

| Método | Endpoint | Descripción | Status | Auth |
|--------|----------|-------------|--------|------|
| GET | `/api/metas` | Listar todas las metas | 200, 500 | ✅ |
| GET | `/api/metas/{id}` | Obtener meta por ID | 200, 404, 500 | ✅ |
| POST | `/api/metas` | Crear nueva meta | 201, 400, 500 | ✅ |
| PUT | `/api/metas/{id}` | Actualizar meta | 200, 400, 404, 500 | ✅ |
| DELETE | `/api/metas/{id}` | Eliminar meta (soft delete) | 200, 404, 500 | ✅ |

---

## 🧪 Pruebas

### Script Automatizado
```bash
bash backend/types/test-metas-api.sh
```

### Ejemplos de cURL Individuales

**Listar metas:**
```bash
curl -X GET http://localhost:5000/api/metas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Crear meta:**
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

---

## 📖 Cómo Usar Esta Interfaz

### Para Desarrolladores Frontend
1. Leer: `META_INTERFACE_README.md`
2. Consultar: `MetaInterface.js` para ejemplos

### Para Documentación Automática
1. Usar: `MetaOpenAPI.js`
2. Generar documentación con Swagger UI

### Para Validación de Datos
1. Usar: `MetaSchema.js`
2. Implementar en controlador

### Para TypeScript/IDE Support
1. Usar: `Meta.js`
2. Permite autocompletado en IDE

### Para Testing
1. Ejecutar: `test-metas-api.sh`
2. O copiar ejemplos de cURL

---

## ✅ Checklist de Interfaz

- ✅ Definiciones de tipos (JSDoc)
- ✅ Esquemas de validación (JSON Schema)
- ✅ Documentación de interfaz completa
- ✅ Especificación OpenAPI 3.0
- ✅ README en Markdown
- ✅ Índice central
- ✅ Script de pruebas
- ✅ Ejemplos de cURL
- ✅ Validaciones documentadas
- ✅ Respuestas de ejemplo

---

## 🔧 Próximos Pasos

1. **Iniciar Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Probar Endpoints**:
   ```bash
   bash backend/types/test-metas-api.sh
   ```

3. **Generar Documentación Swagger** (opcional):
   - La documentación se genera automáticamente en `/api-docs`

4. **Integración Frontend**:
   - El frontend ya está implementado en `GestionMetas.js`
   - El servicio API ya está configurado en `api.js`

---

## 📝 Notas Importantes

- **Soft Delete**: Las metas se marcan como inactivas, no se eliminan realmente
- **LEFT JOIN**: El `ambito_nombre` se obtiene mediante JOIN automático
- **Validación**: Los números de meta deben ser exactamente 3 dígitos
- **Períodos**: Los períodos son strings de 4 dígitos (años)
- **Ámbitos**: Los ámbitos son opcionales (NULL permitido)

---

## 📚 Referencias

- **Especificación OpenAPI**: https://spec.openapis.org/oas/v3.0.0
- **JSON Schema**: https://json-schema.org/
- **REST Best Practices**: https://restfulapi.net/

---

**Estado**: ✅ Interfaz Completa y Documentada
**Última Actualización**: Febrero 17, 2026
**Versión**: 1.0.0
