# 📋 GUÍA COMPLETA: IMPORTACIÓN AUTOMÁTICA DE PDF

## 🎯 Objetivo
Importar automáticamente datos de un PDF de Certificación de Crédito Presupuestario y guardar la certificación con todos sus detalles en la base de datos.

---

## 📊 Datos de Ejemplo

```json
{
  "success": true,
  "data": {
    "nota": "0000002658",
    "mes": "FEBRERO",
    "fecha_aprobacion": "26/02/2026",
    "fecha_documento": "26/02/2026",
    "estado_certificacion": "APROBADO",
    "tipo_documento": "MEMORANDUM",
    "numero_documento": "32716M329AAA.U",
    "justificacion": "GASTOS OPERATIVOS AAA UCAYALI MARZO",
    "monto_total": 20540,
    "meta_id": 6,
    "fuente_financiamiento_id": 1,
    "detalles_raw": [
      {
        "codigo_pdf": "2.3. 1 3.1 1",
        "partida_db": "23. 1 3. 1 1",
        "monto": 600,
        "clasificador_id": 3,
        "clasificador_nombre": "COMBUSTIBLES Y CARBURANTES"
      },
      {
        "codigo_pdf": "2.3. 2 1.2 1",
        "partida_db": "23. 2 1. 2 1",
        "monto": 4900,
        "clasificador_id": 1,
        "clasificador_nombre": "PASAJES Y GASTOS DE TRANSPORTE"
      },
      {
        "codigo_pdf": "2.3. 2 1.2 2",
        "partida_db": "23. 2 1. 2 2",
        "monto": 9240,
        "clasificador_id": 2,
        "clasificador_nombre": "VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO"
      },
      {
        "codigo_pdf": "2.3. 2 2.1 1",
        "partida_db": "23. 2 2. 1 1",
        "monto": 5000,
        "clasificador_id": 29,
        "clasificador_nombre": "SERVICIO DE SUMINISTRO DE ENERGIA ELECTRICA"
      },
      {
        "codigo_pdf": "2.3. 2 2.1 2",
        "partida_db": "23. 2 2. 1 2",
        "monto": 800,
        "clasificador_id": 30,
        "clasificador_nombre": "SERVICIO DE AGUA Y DESAGUE"
      }
    ]
  }
}
```

### ✅ Validación de Suma
```
600 + 4,900 + 9,240 + 5,000 + 800 = 20,540 ✓
```

---

## 🚀 Pasos para Probar

### 1. Iniciar el Backend
```bash
cd /d/COMISIONES_AAAU/backend
npm start
```

**Esperado:** 
```
✅ Servidor iniciado exitosamente
Accesible en: http://0.0.0.0:5000
Swagger: http://172.10.9.11:5000/api-docs
```

### 2. Iniciar el Frontend (React)
```bash
cd /d/COMISIONES_AAAU/material-dashboard-react
npm start
```

**Esperado:** Abre automáticamente en `http://localhost:3000`

### 3. Navegar al Módulo

1. Inicia sesión en el Dashboard
2. Ir a **Gestión** → **Certificaciones de Crédito Presupuestario**
3. Haz clic en **"Importar desde PDF"** (botón azul con ícono de nube)

### 4. Cargar el PDF

1. Se abre un diálogo de carga
2. Haz clic en **"Seleccionar PDF"**
3. Selecciona el archivo: `CCP 2658 AAA UCAYALI - MARZO 2026.pdf`
4. Haz clic en **"Procesar PDF"** (este paso demora 2-3 segundos)

### 5. Verificar el Preview

**Debe mostrar:**

#### Sección: Información General
- ✅ Nota Nº: `0000002658`
- ✅ Número Documento: `32716M329AAA.U`
- ✅ Tipo Documento: `MEMORANDUM`
- ✅ Mes: `FEBRERO`
- ✅ Fecha Aprobación: `26/02/2026`
- ✅ Estado: `APROBADO` (en verde)
- ✅ Justificación: `GASTOS OPERATIVOS AAA UCAYALI MARZO`

#### Sección: Meta
- ✅ Número: `0072`
- ✅ Descripción: `GESTION OPERATIVA DE LA AUTORIDAD ADMINISTRATIVA DEL AGUA`

#### Sección: Fuente de Financiamiento
- ✅ Fuente: `RECURSOS ORDINARIOS`
- ✅ Monto Total: `S/. 20,540.00`

#### Sección: Detalles de Gasto (5 items)
| Código | Descripción | Monto |
|--------|-------------|-------|
| `23. 1 3. 1 1` | COMBUSTIBLES Y CARBURANTES | S/. 600.00 |
| `23. 2 1. 2 1` | PASAJES Y GASTOS DE TRANSPORTE | S/. 4,900.00 |
| `23. 2 1. 2 2` | VIÁTICOS Y ASIGNACIONES | S/. 9,240.00 |
| `23. 2 2. 1 1` | SERVICIO DE SUMINISTRO DE ENERGIA | S/. 5,000.00 |
| `23. 2 2. 1 2` | SERVICIO DE AGUA Y DESAGUE | S/. 800.00 |
| | **TOTAL:** | **S/. 20,540.00** ✅ |

### 6. Aplicar Datos

1. Haz clic en **"Aplicar Datos"** (botón verde)
2. **NO** debes hacer nada más - se guarda automáticamente
3. Espera a que aparezca el mensaje de éxito (2-3 segundos)

### 7. Verificar el Mensaje de Éxito

**Debe mostrar:**
```
✅ IMPORTACIÓN EXITOSA

Certificación creada: 32716M329AAA.U
Nota Nº: 0000002658
Monto Total: S/. 20,540.00
Detalles guardados: 5 items
```

### 8. Verificar en la Tabla

1. El diálogo se cierra automáticamente
2. **Se recarga la tabla de certificaciones**
3. Busca el nuevo registro:
   - **Nota:** `0000002658`
   - **Mes:** `FEBRERO`
   - **Tipo Documento:** `MEMORANDUM`
   - **N° Documento:** `32716M329AAA.U`
   - **Estado:** `APROBADO`

---

## 🔍 Verificación en Base de Datos

### Consulta SQL para verificar

```sql
-- Ver la certificación creada
SELECT id, nota, mes, estado_certificacion, numero_documento, monto_total
FROM certificaciones_credito
WHERE nota = '0000002658';

-- Ver los 5 detalles creados
SELECT 
    dc.id,
    dc.certificacion_credito_id,
    cl.partida,
    cl.nombre AS clasificador_nombre,
    dc.monto
FROM detalles_certificacion_credito dc
INNER JOIN clasificadores cl ON dc.clasificador_id = cl.id
WHERE dc.certificacion_credito_id = 1
ORDER BY dc.id;

-- Verificar la suma
SELECT 
    SUM(monto) AS total_detalles,
    (SELECT monto_total FROM certificaciones_credito WHERE id = 1) AS monto_certificacion
FROM detalles_certificacion_credito
WHERE certificacion_credito_id = 1;
```

**Resultado esperado:**

| id | nota | mes | estado | numero_documento | monto_total |
|----|------|-----|--------|------------------|-------------|
| 1 | 0000002658 | FEBRERO | APROBADO | 32716M329AAA.U | 20540 |

Detalles:
| id | cert_id | partida | clasificador_nombre | monto |
|----|---------|---------|---------------------|-------|
| 1 | 1 | 23. 1 3. 1 1 | COMBUSTIBLES Y CARBURANTES | 600 |
| 2 | 1 | 23. 2 1. 2 1 | PASAJES Y GASTOS DE TRANSPORTE | 4900 |
| 3 | 1 | 23. 2 1. 2 2 | VIÁTICOS Y ASIGNACIONES | 9240 |
| 4 | 1 | 23. 2 2. 1 1 | SERVICIO DE SUMINISTRO | 5000 |
| 5 | 1 | 23. 2 2. 1 2 | SERVICIO DE AGUA Y DESAGUE | 800 |

Suma: `20540 = 20540` ✅

---

## 📝 Notas Técnicas

### Componentes Modificados

1. **PdfUploadDialog.js**
   - Mejorado: Mostración de datos extraídos en secciones claramente separadas
   - Nuevo: Tabla de 5 detalles con validación de suma
   - Beneficio: Usuario ve exactamente qué se va a guardar

2. **GestionCertificacionesCredito.js**
   - Cambio: `handleExtractedPdfData` ahora es `async`
   - Nueva funcionalidad: Guarda automáticamente certificación + 5 detalles
   - Beneficio: Cero manipulación manual después del upload

### Endpoints Utilizados

- **POST** `/api/pdf/extract-certification` - Extrae datos del PDF
- **POST** `/api/certificaciones-credito` - Crea certificación
- **POST** `/api/detalles-certificacion` - Crea detalles (llamado 5 veces)

### Validaciones

✅ Suma de detalles = Monto total (20,540 = 20,540)
✅ Formato de partida (12 caracteres): `23. X X. X X`
✅ Todos los clasificadores encontrados o creados
✅ Meta y Fuente enriquecidas automáticamente

---

## ⚠️ Solución de Problemas

### Si no se muestra el preview:
1. Verificar que el PDF está siendo procesado (ver consola de dev tools)
2. Asegurar que el backend está corriendo
3. Revisar en Application → Network si la petición POST falla

### Si falla al guardar detalles:
1. Verificar que los clasificadores existen en BD
2. Revisar que los IDs de meta y fuente son válidos
3. Comprobar permisos de escritura en BD

### Si la suma no coincide:
1. **Problema:** Regex extrayendo montos incorrectamente
2. **Solución:** Verificar sin lookahead en regex
3. **Resultado:** `600 + 4900 + 9240 + 5000 + 800 = 20540 ✅`

---

## 🎓 Arquitectura de la Solución

```
PDF UPLOAD
    ↓
EXTRACCIÓN CON REGEX (sin lookahead)
    ↓
ENRIQUECIMIENTO (buscar/crear clasificadores)
    ↓
PREVIEW EN FRONTEND
    ↓
USUARIO HACE CLICK "APLICAR DATOS"
    ↓
GUARDADO TRANSACCIONAL:
  ├─ Certificación (1 INSERT)
  ├─ Detalle 1 (INSERT)
  ├─ Detalle 2 (INSERT)
  ├─ Detalle 3 (INSERT)
  ├─ Detalle 4 (INSERT)
  └─ Detalle 5 (INSERT)
    ↓
RECARGA DE TABLA
    ↓
CONFIRMACIÓN CON RESUMEN
```

---

## 📞 Contacto

Para dudas sobre la integración, revisar:
- Backend: `/backend/controllers/pdfController.js` (lineas 992-1045)
- Frontend: `/material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js` (handleExtractedPdfData)
- Componente: `/material-dashboard-react/src/components/PdfUploadDialog/index.js` (sección de preview)

---

**Estado:** ✅ COMPLETO Y PROBADO
**Fecha:** Marzo 14, 2026
**Versión:** 1.0
