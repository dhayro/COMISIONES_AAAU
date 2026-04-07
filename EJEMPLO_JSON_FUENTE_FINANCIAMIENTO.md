# ✅ Ejemplo de JSON con Fuente de Financiamiento

**Fecha:** 31 de Marzo de 2026  
**Status:** ✅ LISTO PARA USAR

---

## 📨 POST - Crear Formato CON Fuente de Financiamiento

### URL
```
POST http://172.10.9.11:5000/api/formatos-emisiones
```

### Headers
```
Content-Type: application/json
Authorization: Bearer TOKEN
```

### Body
```json
{
  "comision_id": 1,
  "usuario_id": 3,
  "costo_viaje_id": 1,
  "meta_id": 6,
  "certificacion_id": 11,
  "fuente_financiamiento_id": 2,
  "numero_documento": "AUTO-GENERADO",
  "fecha_emision": "AUTO-GENERADO",
  "lugar": "SAN PEDRO LAGARTO",
  "ruta": "PUCALLPA - ATALAYA - PUCALLPA",
  "modalidad_viaje": "AEREO-FLUVIAL",
  "fecha_salida": "2026-03-02T08:00",
  "fecha_retorno": "2026-03-05T18:00",
  "num_dias": 4,
  "numero_siaf": null,
  "codigo_cp": null,
  "tipo_emision": "REEMBOLSO",
  "costo_xdia": 220,
  "monto_total": 1780,
  "actividad_realizar": "AFORO DEL RIO UCAYALI SOBRE LA ESTACION AAA.U-003 (ATALAYA-LAGARTO)\nAFORO DEL RIO TAMBO SOBRE LA ESTACION PGIRH-003 (ESTACIÓN ATALAYA)\nVERIFICACION DEL FUNCIONAMIENTO DE LA ESTACION AAA.U-003 (ATALAYA-LAGARTO)",
  "observacion": "PASAJE AEREO 700\nPASAJE FLUVIAL 200",
  "detalles": [
    {
      "clasificador_id": 1,
      "monto": 900,
      "detalles_certificacion_credito_id": 39
    },
    {
      "clasificador_id": 2,
      "monto": 880,
      "detalles_certificacion_credito_id": 40
    }
  ]
}
```

---

## 📝 PUT - Actualizar Formato CON Nueva Fuente

### URL
```
PUT http://172.10.9.11:5000/api/formatos-emisiones/34
```

### Headers
```
Content-Type: application/json
Authorization: Bearer TOKEN
```

### Body (Solo campos a actualizar)
```json
{
  "fuente_financiamiento_id": 3,
  "lugar": "SAN PEDRO LAGARTO",
  "ruta": "PUCALLPA - ATALAYA - PUCALLPA",
  "modalidad_viaje": "AEREO-FLUVIAL",
  "fecha_salida": "2026-03-02T08:00",
  "fecha_retorno": "2026-03-05T18:00",
  "num_dias": 4,
  "costo_xdia": 220,
  "monto_total": 1780,
  "actividad_realizar": "AFORO DEL RIO UCAYALI...",
  "observacion": "PASAJE AEREO 700...",
  "detalles": [
    {
      "clasificador_id": 1,
      "monto": 900,
      "detalles_certificacion_credito_id": 39
    },
    {
      "clasificador_id": 2,
      "monto": 880,
      "detalles_certificacion_credito_id": 40
    }
  ]
}
```

---

## 🔍 Campos Nuevos Incluidos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fuente_financiamiento_id` | INT | ID de la Fuente de Financiamiento seleccionada |

---

## ✅ Frontend - Dónde se Incluye

**Archivo:** `material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`

**Línea ~887:**
```javascript
const datosFormato = {
  // ... otros campos
  fuente_financiamiento_id: formValues.fuente_financiamiento_id ? parseInt(formValues.fuente_financiamiento_id) : null,  // 🆕 AGREGADO
  // ... otros campos
};
```

---

## 🔄 Backend - Dónde se Recibe

### Controller: `formatoEmisionController.js`

**Función `crear()` - Línea 44:**
```javascript
const { fuente_financiamiento_id } = req.body;  // ✅ Recibe
```

**Función `actualizar()` - Línea 207:**
```javascript
const { fuente_financiamiento_id } = req.body;  // ✅ Recibe
```

### Model: `FormatoEmision.js`

**INSERT - Línea 44:**
```javascript
INSERT INTO formato_emisiones (..., fuente_financiamiento_id, ...)
VALUES (..., fuente_financiamiento_id || null, ...)
```

**UPDATE - Línea 197:**
```javascript
if (fuente_financiamiento_id !== undefined) { 
  campos.push('fuente_financiamiento_id = ?'); 
  valores.push(fuente_financiamiento_id); 
}
```

---

## 📊 Respuesta del Servidor

### GET después de crear/actualizar
```json
{
  "id": 34,
  "comision_id": 1,
  "usuario_id": 3,
  "meta_id": 6,
  "certificacion_id": 11,
  "fuente_financiamiento_id": 2,
  "numero_documento": "FORM-20260331-001",
  "fecha_emision": "2026-03-31T10:55:00",
  "lugar": "SAN PEDRO LAGARTO",
  "ruta": "PUCALLPA - ATALAYA - PUCALLPA",
  "modalidad_viaje": "AEREO-FLUVIAL",
  "fecha_salida": "2026-03-02T08:00:00",
  "fecha_retorno": "2026-03-05T18:00:00",
  "num_dias": 4,
  "tipo_emision": "REEMBOLSO",
  "costo_xdia": 220,
  "monto_total": 1780,
  "estado_emision": "EMITIDO",
  "actividad_realizar": "AFORO DEL RIO UCAYALI...",
  "observacion": "PASAJE AEREO 700...",
  "creado_en": "2026-03-31T10:55:00",
  "actualizado_en": "2026-03-31T10:55:00"
}
```

---

## 🧪 Testing con cURL

### POST - Crear con Fuente
```bash
curl -X POST http://172.10.9.11:5000/api/formatos-emisiones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "comision_id": 1,
    "usuario_id": 3,
    "meta_id": 6,
    "certificacion_id": 11,
    "fuente_financiamiento_id": 2,
    "lugar": "SAN PEDRO LAGARTO",
    "ruta": "PUCALLPA - ATALAYA",
    "modalidad_viaje": "AEREO-FLUVIAL",
    "fecha_salida": "2026-03-02T08:00",
    "fecha_retorno": "2026-03-05T18:00",
    "num_dias": 4,
    "tipo_emision": "REEMBOLSO",
    "costo_xdia": 220,
    "monto_total": 1780,
    "detalles": [
      {"clasificador_id": 1, "monto": 900, "detalles_certificacion_credito_id": 39}
    ]
  }'
```

### PUT - Actualizar Fuente
```bash
curl -X PUT http://172.10.9.11:5000/api/formatos-emisiones/34 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "fuente_financiamiento_id": 3
  }'
```

---

## ✅ Checklist de Integración

- [x] Frontend: Selector agregado
- [x] Frontend: formValues incluye fuente_financiamiento_id
- [x] Frontend: JSON incluye fuente_financiamiento_id en POST/PUT
- [x] Backend Controller: Destructura fuente_financiamiento_id
- [x] Backend Controller: Pasa a modelo
- [x] Backend Model: Incluye en INSERT
- [x] Backend Model: Incluye en UPDATE
- [x] BD: Columna existe (migración ejecutada)
- [x] API: Acepta fuente_financiamiento_id en POST
- [x] API: Acepta fuente_financiamiento_id en PUT
- [x] API: Devuelve fuente_financiamiento_id en GET

---

**Status:** ✅ COMPLETO Y FUNCIONAL  
**Versión:** 1.0  
**Compilado:** 31-03-2026 10:58 AM

