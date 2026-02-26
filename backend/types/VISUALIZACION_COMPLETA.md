# 🎨 INTERFAZ API METAS - VISUALIZACIÓN COMPLETA

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                     INTERFAZ COMPLETA DEL API METAS                       ║
║                           Versión 1.0.0 - 2026                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 ARCHIVOS DE INTERFAZ (backend/types/)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1️⃣  Meta.js                                                            │
│      └─ Definiciones JSDoc de tipos                                    │
│      └─ @typedef Meta, CreateMetaRequest, UpdateMetaRequest            │
│      └─ Para IDE autocomplete y documentación                          │
│                                                                           │
│  2️⃣  MetaSchema.js                                                     │
│      └─ Esquemas JSON Schema para validación                           │
│      └─ create, update, list, single                                   │
│      └─ Patrones de validación (3 dígitos, etc.)                       │
│                                                                           │
│  3️⃣  MetaInterface.js                                                  │
│      └─ Documentación completa de endpoints                            │
│      └─ Ejemplos de request/response                                   │
│      └─ HTTP Status codes y errores comúnes                            │
│                                                                           │
│  4️⃣  MetaOpenAPI.js                                                    │
│      └─ Especificación OpenAPI 3.0 completa                            │
│      └─ Para Swagger UI y generadores SDK                              │
│      └─ Schemas, paths, security schemes                               │
│                                                                           │
│  5️⃣  META_INTERFACE_README.md                                          │
│      └─ Documentación en Markdown para desarrolladores                 │
│      └─ Ejemplos de cURL para cada endpoint                            │
│      └─ Guía de uso rápida y clara                                     │
│                                                                           │
│  6️⃣  META_INTERFACE_INDEX.js                                           │
│      └─ Índice central de toda la interfaz                             │
│      └─ Resumen de endpoints, validaciones, ejemplos                   │
│      └─ Información de implementación                                  │
│                                                                           │
│  7️⃣  test-metas-api.sh                                                 │
│      └─ Script de pruebas con ejemplos cURL                            │
│      └─ Tests para todos los endpoints                                 │
│      └─ Validación de respuestas                                       │
│                                                                           │
│  8️⃣  INTERFAZ_COMPLETA.md                                              │
│      └─ Resumen ejecutivo de la interfaz                               │
│      └─ Relación con implementación                                    │
│      └─ Próximos pasos                                                 │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 🔌 ENDPOINTS API                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  GET    /api/metas              Listar todas las metas                 │
│  ├─ Status: 200, 500                                                   │
│  ├─ Auth: ✅ Requerido                                                 │
│  └─ Response: Array<Meta>                                              │
│                                                                           │
│  GET    /api/metas/{id}         Obtener meta por ID                    │
│  ├─ Status: 200, 404, 500                                              │
│  ├─ Auth: ✅ Requerido                                                 │
│  ├─ Param: id (integer)                                                │
│  └─ Response: Meta                                                      │
│                                                                           │
│  POST   /api/metas              Crear nueva meta                       │
│  ├─ Status: 201, 400, 500                                              │
│  ├─ Auth: ✅ Requerido                                                 │
│  ├─ Body: { nombre, numero_meta, periodo, ambito_id? }                │
│  └─ Response: { mensaje, meta }                                        │
│                                                                           │
│  PUT    /api/metas/{id}         Actualizar meta                        │
│  ├─ Status: 200, 400, 404, 500                                         │
│  ├─ Auth: ✅ Requerido                                                 │
│  ├─ Param: id (integer)                                                │
│  ├─ Body: { nombre?, numero_meta?, periodo?, ambito_id? }             │
│  └─ Response: { mensaje, meta }                                        │
│                                                                           │
│  DELETE /api/metas/{id}         Eliminar meta (soft delete)            │
│  ├─ Status: 200, 404, 500                                              │
│  ├─ Auth: ✅ Requerido                                                 │
│  ├─ Param: id (integer)                                                │
│  └─ Response: { mensaje }                                              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 ESTRUCTURA DE DATOS                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Meta Object:                                                            │
│  {                                                                       │
│    id: number,                 ✅ ID único                              │
│    nombre: string,             ✅ Nombre descriptivo (1-255 chars)      │
│    numero_meta: string,        ✅ 3 dígitos exactos (067, 198, etc.)   │
│    periodo: string,            ✅ 4 dígitos (año: 2026)                │
│    ambito_id: number | null,   ⭕ FK a tabla ambitos (opcional)        │
│    ambito_nombre: string,      ⭕ Incluido mediante LEFT JOIN          │
│    activo: number,             ✅ 1=activo, 0=inactivo                 │
│    created_at: timestamp,      ✅ Fecha de creación                    │
│    updated_at: timestamp       ✅ Última actualización                 │
│  }                                                                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ✅ VALIDACIONES                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  nombre:                                                                │
│  ├─ Requerido: ✅ Sí                                                    │
│  ├─ Tipo: string                                                       │
│  ├─ Longitud: 1-255 caracteres                                         │
│  └─ Error: "El nombre es requerido..."                                 │
│                                                                           │
│  numero_meta:                                                            │
│  ├─ Requerido: ✅ Sí                                                    │
│  ├─ Tipo: string                                                       │
│  ├─ Formato: Exactamente 3 dígitos (^\\d{3}$)                          │
│  ├─ Único: ✅ Sí (UNIQUE constraint)                                   │
│  └─ Error: "El número debe ser 3 dígitos..."                           │
│                                                                           │
│  periodo:                                                                │
│  ├─ Requerido: ✅ Sí                                                    │
│  ├─ Tipo: string                                                       │
│  ├─ Formato: Exactamente 4 dígitos (^\\d{4}$)                          │
│  └─ Error: "El período debe ser 4 dígitos..."                          │
│                                                                           │
│  ambito_id:                                                              │
│  ├─ Requerido: ⭕ No                                                    │
│  ├─ Tipo: integer | null                                               │
│  ├─ FK: ambitos.id                                                     │
│  └─ Defecto: NULL                                                      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 📝 RESPUESTAS DE EJEMPLO                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ✅ GET /api/metas (200)                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [                                                               │   │
│  │   {                                                             │   │
│  │     "id": 1,                                                   │   │
│  │     "nombre": "Meta Local - ALA Perené",                       │   │
│  │     "numero_meta": "067",                                      │   │
│  │     "periodo": "2026",                                         │   │
│  │     "ambito_id": 2,                                            │   │
│  │     "ambito_nombre": "ALA PERENÉ",                             │   │
│  │     "activo": 1                                                │   │
│  │   },                                                            │   │
│  │   { ... }                                                       │   │
│  │ ]                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ✅ POST /api/metas (201)                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ {                                                               │   │
│  │   "mensaje": "Meta creada exitosamente",                        │   │
│  │   "meta": { ...Meta object... }                                 │   │
│  │ }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ❌ Error 404                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ {                                                               │   │
│  │   "error": "Meta no encontrada"                                 │   │
│  │ }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ❌ Error 400                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ {                                                               │   │
│  │   "error": "Nombre, número de meta y período son requeridos"    │   │
│  │ }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 🧪 TESTING                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Script de pruebas automatizado:                                        │
│  $ bash backend/types/test-metas-api.sh                                 │
│                                                                           │
│  Ejemplo manual (cURL):                                                 │
│  $ curl -X GET http://localhost:5000/api/metas \\                       │
│      -H "Authorization: Bearer TOKEN" \\                                 │
│      -H "Content-Type: application/json"                                │
│                                                                           │
│  Crear meta:                                                             │
│  $ curl -X POST http://localhost:5000/api/metas \\                      │
│      -H "Authorization: Bearer TOKEN" \\                                 │
│      -H "Content-Type: application/json" \\                              │
│      -d '{"nombre":"...","numero_meta":"067",...}'                      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                          🎯 PRÓXIMOS PASOS                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  1. Iniciar el servidor backend:                                          ║
║     $ cd backend && npm run dev                                           ║
║                                                                            ║
║  2. Probar los endpoints:                                                 ║
║     $ bash backend/types/test-metas-api.sh                                ║
║                                                                            ║
║  3. Revisar documentación:                                                ║
║     📖 backend/types/META_INTERFACE_README.md                             ║
║                                                                            ║
║  4. Generar documentación Swagger (automático):                            ║
║     🔗 http://localhost:5000/api-docs                                     ║
║                                                                            ║
║  5. Integración Frontend:                                                 ║
║     ✅ Ya implementado en GestionMetas.js                                 ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

📚 ARCHIVOS RELACIONADOS:

Backend Implementation:
├─ backend/models/Meta.js
├─ backend/controllers/metaController.js
└─ backend/routes/comisiones.js (líneas 1136-1259)

Frontend Implementation:
├─ material-dashboard-react/src/pages/Gestion/GestionMetas.js
├─ material-dashboard-react/src/services/api.js
└─ material-dashboard-react/src/routes.js

Database:
├─ backend/config/database.js (inicialización metas)
└─ backend/models/Meta.js (JOINs con ambitos)

Interface Documentation:
├─ backend/types/Meta.js
├─ backend/types/MetaSchema.js
├─ backend/types/MetaInterface.js
├─ backend/types/MetaOpenAPI.js
├─ backend/types/META_INTERFACE_README.md
├─ backend/types/META_INTERFACE_INDEX.js
├─ backend/types/test-metas-api.sh
├─ backend/types/INTERFAZ_COMPLETA.md
└─ backend/types/VISUALIZACION_COMPLETA.md (este archivo)

═══════════════════════════════════════════════════════════════════════════

✅ Estado: INTERFAZ COMPLETA Y DOCUMENTADA
📅 Última actualización: Febrero 17, 2026
📦 Versión: 1.0.0

═══════════════════════════════════════════════════════════════════════════
```

## 🎓 Guía de Uso por Rol

### Para Desarrollador Frontend
1. Lee: `META_INTERFACE_README.md`
2. Usa los ejemplos de cURL para probar
3. Integra los endpoints en tu código

### Para Desarrollador Backend
1. Consulta: `MetaSchema.js` para validaciones
2. Revisa: `MetaOpenAPI.js` para la especificación
3. Usa: `test-metas-api.sh` para testing

### Para DevOps/QA
1. Ejecuta: `bash backend/types/test-metas-api.sh`
2. Verifica: Códigos de respuesta y estructura
3. Documento: `META_INTERFACE_README.md`

### Para PM/Stakeholder
1. Lee: `INTERFAZ_COMPLETA.md` (resumen ejecutivo)
2. Visualiza: Este archivo (VISUALIZACION_COMPLETA.md)
3. Referencia: Endpoints disponibles en tabla

═══════════════════════════════════════════════════════════════════════════
