# 📊 Estado Actual de Extracción PDF - Certificaciones de Crédito

## ✅ Progreso Completado

### 1. **Campos Principales Extraídos Correctamente**
```
✓ nota: "0000002658"
✓ mes: "FEBRERO" 
✓ fecha_aprobacion: "26/02/2026"
✓ fecha_documento: "26/02/2026"
✓ estado_certificacion: "APROBADO"
✓ tipo_documento: "MEMORANDUM"
✓ numero_documento: "32716M329AAA.U"
✓ justificacion: "GASTOS OPERATIVOS AAA UCAYALI MARZO"
✓ monto_total: 20540
```

### 2. **Información de Relaciones Extraída**
```
✓ meta_info.numero: "0072" 
  → Se puede mapear a: metas.id = 6 (numero_meta='072')

✓ fuente_info: "RECURSOS ORDINARIOS"
  → Se puede mapear a: fuentes_financiamiento.id = 1
```

### 3. **Detalles Parcialmente Extraídos**
Se están extrayendo algunos detalles del breakdown de gastos:
```
{
  "codigo_pdf": "2.3. 1",
  "partida_db": "23.1",
  "descripcion": "COMPRA DE BIENES",
  "monto": 600
},
{
  "codigo_pdf": "2.3. 1 3",
  "partida_db": "23.13",
  "descripcion": "COMBUSTIBLES, CARBURANTES, LUBRICANTES Y AFINES",
  "monto": 600
}
```

### 4. **Nuevas Rutas API Implementadas**

#### `POST /api/pdf/enrich-extracted-data`
- Toma los datos extraídos del PDF
- Busca en la BD los IDs correspondientes (meta_id, fuente_id, clasificador_ids)
- Retorna datos enriquecidos listos para guardar

Ejemplo de request:
```javascript
{
  extractedData: {
    nota: "0000002658",
    mes: "FEBRERO",
    // ... otros campos
    meta_info: { numero: "0072", descripcion: "..." },
    fuente_info: "RECURSOS ORDINARIOS",
    detalles_raw: [...]
  }
}
```

Ejemplo de response:
```javascript
{
  success: true,
  data: {
    // ... campos originales
    meta_id: 6,
    fuente_financiamiento_id: 1,
    detalles_enriquecidos: [
      { 
        ...detalle,
        clasificador_id: 3 
      }
    ]
  }
}
```

#### `POST /api/pdf/save-certification`
- Guarda la certificación completa en BD
- Crea registro en `certificaciones_credito`
- Crea registros en `detalles_certificacion_credito`
- Usa transacciones para integridad

Ejemplo de request:
```javascript
{
  enrichedData: {
    nota: "0000002658",
    meta_id: 6,
    fuente_financiamiento_id: 1,
    // ... otros campos
    detalles_enriquecidos: [...]
  }
}
```

## 🔄 Siguientes Pasos Necesarios

### 1. **Mejorar Extracción de Detalles**
Actualmente se están perdiendo algunos detalles. Necesario refinar regex para capturar:
- Líneas de nivel 2 (2.3, 2.3.2, etc.)
- Líneas de nivel 3 (2.3.2.1, 2.3.2.2, etc.)
- Líneas de nivel 4+ (2.3.1.3, 2.3.2.1.2, etc.)

Objetivo: Capturar los 5 detalles principales:
```
2.3.1    COMPRA DE BIENES                                    600.00
2.3.1.3  COMBUSTIBLES, CARBURANTES, LUBRICANTES Y AFINES    600.00
2.3.1.3.1.1 COMBUSTIBLES Y CARBURANTES                      600.00
2.3.2    CONTRATACION DE SERVICIOS                          19,940.00
2.3.2.1  VIAJES                                             14,140.00
... (y más)
```

### 2. **Frontend: Component de Upload PDF**
Crear modal/dialog que:
1. Permita seleccionar y subir PDF
2. Llame a `/api/pdf/extract-certification`
3. Muestre datos extraídos para verificación
4. Botón "Enriquecer" → llama `/api/pdf/enrich-extracted-data`
5. Muestre relaciones mapeadas (meta_id, fuente_id)
6. Botón "Guardar Certificación" → llama `/api/pdf/save-certification`

### 3. **Validación y Reporte**
Mostrar al usuario:
- ✓ Campos extraídos exitosamente
- ⚠️ Campos no encontrados
- ⚠️ Ambigüedades en mapeos (ej: si hay múltiples metas que coinciden)
- Error message si hay fallos en guardado

### 4. **Testing**
- Probar con múltiples PDFs
- Validar que detalles se mapean a clasificadores correctos
- Verificar integridad de datos en BD

## 📋 Arquitectura Actual

```
Frontend (React)
    ↓
POST /api/pdf/extract-certification
    ↓ (pdf2json)
pdfController.extractCertificationPdf()
    ↓
Retorna: extractedData {
  nota, mes, fecha_aprobacion, ...
  meta_info, fuente_info, detalles_raw
}
    ↓
POST /api/pdf/enrich-extracted-data
    ↓
Busca en BD: metas, fuentes_financiamiento, clasificadores
    ↓
Retorna: enrichedData {
  ... + meta_id, fuente_financiamiento_id, detalles_enriquecidos
}
    ↓
POST /api/pdf/save-certification
    ↓
Inserta en: certificaciones_credito + detalles_certificacion_credito
```

## 🔗 Mapeos de Base de Datos

### Meta
PDF: "0072 GESTION OPERATIVA DE LA AUTORIDAD ADMINISTRATIVA DEL AGUA"
→ BD: `metas` WHERE `numero_meta` = '072'
→ Retorna: `id` = 6

### Fuente Financiamiento
PDF: "RECURSOS ORDINARIOS"
→ BD: `fuentes_financiamiento` WHERE `nombre` LIKE '%RECURSOS ORDINARIOS%'
→ Retorna: `id` = 1

### Clasificadores (para detalles)
PDF: "2.3.1  COMPRA DE BIENES 600.00"
→ Convertir código: "2.3.1" → "23.1"
→ BD: `clasificadores` WHERE `partida` = '23.1'
→ Retorna: `id` = clasificador correspondiente

## 📦 Esquema de Tabla Clasificadores

```
id (int) - PK
partida (varchar) - ej: "23.1", "23.1.3.1.1"
nombre (varchar) - ej: "PASAJES Y GASTOS DE TRANSPORTE"
descripcion (text) - descripción detallada
activo (tinyint) - 0 o 1
creado_en (timestamp)
```

Clasificadores relevantes en DB:
- ID 3: partida='23.1.3.1.1', nombre='COMBUSTIBLES Y CARBURANTES'
- ID 1: partida='23.2.1.2.1', nombre='PASAJES Y GASTOS DE TRANSPORTE'  
- ID 2: partida='23.2.1.2.2', nombre='VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO'

## 🛠️ Archivos Involucrados

```
backend/controllers/pdfController.js
  - exports.extractCertificationPdf() - Endpoint principal
  - extractNota(), extractMes(), ... - Funciones de extracción
  - extractMetaInfo() - Extrae número de meta
  - extractFuenteInfo() - Extrae fuente financiamiento
  - extractDetails() - Extrae detalles/líneas

backend/routes/pdf-enrichment.js (NUEVO)
  - POST /enrich-extracted-data - Enriquece con IDs de BD
  - POST /save-certification - Guarda en BD

backend/routes/pdf.js
  - POST /extract-certification - Llama a pdfController

backend/server.js
  - Incluye rutas pdf-enrichment
```

## ✅ Testing Manual

Para probar el flujo completo:

```bash
# 1. Subir PDF
curl -X POST http://localhost:5000/api/pdf/extract-certification \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@CCP 2658 AAA UCAYALI - MARZO 2026.pdf"

# 2. Enriquecer datos
curl -X POST http://localhost:5000/api/pdf/enrich-extracted-data \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "extractedData": {...} }'

# 3. Guardar certificación
curl -X POST http://localhost:5000/api/pdf/save-certification \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "enrichedData": {...} }'
```

O usar el script de test:
```bash
cd backend
node test-pdf-extract.js
```
