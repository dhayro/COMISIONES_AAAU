# 📄 Vista Previa de PDF - Implementación Completa

**Fecha:** 21 de Marzo 2026  
**Estado:** ✅ 100% COMPLETADO  
**Versión:** 1.0

---

## 🎯 Objetivo

Permitir que el usuario:
1. ✅ Vea un PDF previsualizando en tiempo real (iframe)
2. ✅ Abra el PDF en una nueva ventana
3. ✅ Procese el PDF para extraer datos automáticamente
4. ✅ Los datos extraídos carguen en el formulario

---

## ✨ Características Implementadas

### 1. **Vista Previa Embedida del PDF** ✅
- **Componente:** `<iframe>` integrado en el modal
- **Ubicación:** Panel derecho del modal
- **Tamaño:** 800px alto x 100% ancho
- **Visibilidad:** Solo cuando hay PDF cargado
- **URL:** `http://localhost:5000/uploads/certificaciones/...`

```javascript
// GestionCertificacionesCredito.js - Línea ~1210
<iframe
  src={`http://localhost:5000/${pdfRutaActual}`}
  style={{
    width: '100%',
    height: '800px',
    border: 'none',
    borderRadius: '4px',
    flex: 1
  }}
  title="Vista Previa PDF"
/>
```

### 2. **Botón "Ver PDF en Nueva Ventana"** ✅
- **Acción:** Abre el PDF en pestaña nueva
- **URL:** Misma que iframe
- **Texto:** "Ver PDF en Nueva Ventana"
- **Ubicación:** Encima del botón de procesar

```javascript
// Línea ~1222
<MDButton
  variant="outlined"
  color="info"
  onClick={() => window.open(`http://localhost:5000/${pdfRutaActual}`, '_blank')}
  fullWidth
  sx={{ mb: 1 }}
  disabled={loading}
>
  Ver PDF en Nueva Ventana
</MDButton>
```

### 3. **Botón "Procesar PDF y Cargar Datos"** ✅
- **Función:** `handleProcesarPdfActual()`
- **Acción:** Envía PDF al backend para extraer datos
- **Parámetros:** `{ rutaPdf, procesarDesdeServidor: true }`
- **Feedback:** Modal con "Procesando..." + Swal con resultados

```javascript
// Línea ~1230
<MDButton
  variant="contained"
  color="success"
  onClick={handleProcesarPdfActual}
  fullWidth
  sx={{ mb: 1 }}
  disabled={loading}
>
  {loading ? 'Procesando PDF...' : 'Procesar PDF y Cargar Datos'}
</MDButton>
```

### 4. **Función handleProcesarPdfActual()** ✅
- **Ubicación:** Línea 379-475
- **Envía:** POST `/api/pdf/extract-certification` con JSON
- **Body:** `{ rutaPdf: "uploads/certificaciones/...", procesarDesdeServidor: true }`
- **Retorna:** Datos extraídos (nota, mes, estado, monto, etc.)
- **Actualiza:** Formulario con `setFormData()`

```javascript
// Línea 379-475
const handleProcesarPdfActual = async () => {
  if (!pdfRutaActual) {
    Swal.fire({ icon: 'warning', title: 'Sin PDF', text: '...' });
    return;
  }

  try {
    setLoading(true);
    Swal.fire({ title: '⏳ Procesando PDF...', icon: 'info', allowOutsideClick: false });

    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:5000/api/pdf/extract-certification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rutaPdf: pdfRutaActual,
        procesarDesdeServidor: true
      })
    });

    if (!response.ok) throw new Error('Error procesando PDF');

    const resultado = await response.json();
    const extractedData = resultado.data;

    // Actualizar formulario
    setFormData(prev => ({
      ...prev,
      nota: extractedData.nota || prev.nota,
      mes: extractedData.mes || prev.mes,
      estado_certificacion: extractedData.estado_certificacion || prev.estado_certificacion,
      monto_certificado: extractedData.monto_total || prev.monto_certificado,
      // ... más campos
    }));

    Swal.fire({ title: '✅ PDF Procesado', icon: 'success', confirmButtonText: 'Actualizar Formulario' });
    setLoading(false);
  } catch (err) {
    Swal.fire({ title: '❌ Error', text: `Error: ${err.message}`, icon: 'error' });
    setLoading(false);
  }
};
```

### 5. **Modal Maximizado** ✅
- **Tamaño:** 95% ancho × 90% alto de la pantalla
- **Dos columnas:** Formulario (izq) + PDF (der) a igual altura
- **Responsive:** Se adapta a diferentes tamaños de pantalla

```javascript
// Línea 1022-1032
<Dialog 
  open={openDialog} 
  onClose={handleCloseDialog} 
  maxWidth={false}
  fullWidth
  sx={{
    '& .MuiDialog-paper': {
      width: '95vw',
      height: '90vh',
      maxHeight: '90vh'
    }
  }}
>
```

---

## 🔌 Cambios Backend

### 1. **Servidor Express - Servir Archivos Estáticos** ✅
- **Archivo:** `backend/server.js`
- **Línea:** 3 y 25
- **Cambio:** Agregado `app.use('/uploads', express.static(...))`
- **Efecto:** El servidor sirve PDFs desde `/uploads`

```javascript
// server.js - Línea 3
const path = require('path');

// Línea 25
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 2. **Endpoint Dual - Multipart Y JSON** ✅
- **Archivo:** `backend/routes/pdf.js`
- **Endpoint:** `POST /api/pdf/extract-certification`
- **Acepta:** 
  - Multipart: `Content-Type: multipart/form-data` (archivo)
  - JSON: `Content-Type: application/json` (ruta)

```javascript
// pdf.js - Línea ~30-45
const handleExtractCertification = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
};

router.post('/extract-certification', authMiddleware, handleExtractCertification, pdfController.extractCertificationPdf);
```

### 3. **Controlador - Procesar Ambos Casos** ✅
- **Archivo:** `backend/controllers/pdfController.js`
- **Función:** `extractCertificationPdf()`
- **Línea:** 615-660
- **Casos:**
  - CASO 1: `req.file` existe → usar buffer del archivo
  - CASO 2: `req.body.rutaPdf` existe → leer desde disco

```javascript
// pdfController.js - Línea 615-660
exports.extractCertificationPdf = async (req, res) => {
  try {
    let pdfBuffer;
    let pdfPath;
    
    // CASO 1: Archivo subido (multipart/form-data)
    if (req.file) {
      pdfBuffer = req.file.buffer;
      pdfPath = req.file.originalname;
      console.log('📤 PDF desde upload:', pdfPath);
    }
    // CASO 2: Ruta existente (application/json)
    else if (req.body.rutaPdf && req.body.procesarDesdeServidor) {
      const fs = require('fs');
      const path = require('path');
      
      const rutaCompleta = path.join(__dirname, '..', req.body.rutaPdf);
      
      if (!fs.existsSync(rutaCompleta)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo PDF no encontrado: ' + rutaCompleta
        });
      }
      
      pdfBuffer = fs.readFileSync(rutaCompleta);
      pdfPath = path.basename(rutaCompleta);
      console.log('✅ PDF cargado desde disco:', pdfPath);
    }
    else {
      return res.status(400).json({ 
        error: 'No se proporcionó archivo PDF o ruta válida' 
      });
    }

    // Procesar PDF (igual para ambos casos)
    // ...
  }
};
```

### 4. **Modelo Backend - Incluir Rutas** ✅
- **Archivo:** `backend/models/CertificacionCredito.js`
- **Línea:** 85-95
- **Agregado:** `cc.ruta_archivo_pdf` y `cc.monto_certificado` al SELECT
- **Efecto:** El frontend recibe los datos del PDF

```javascript
// CertificacionCredito.js - Línea 85-95
let query = `SELECT cc.id, cc.nota, cc.mes, ..., 
                    cc.nombre_archivo_pdf, cc.ruta_archivo_pdf, cc.monto_certificado,
                    ...`;
```

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ USUARIO ABRE CERTIFICACIÓN EXISTENTE                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Click en ✏️ Editar  │
        └──────────┬──────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ handleOpenDialog() ejecuta │
      │ • setPdfRutaActual()       │
      │ • setFormData()            │
      └──────────┬─────────────────┘
                 │
                 ▼
    ┌───────────────────────────────────┐
    │ Modal Abre (95vw × 90vh)          │
    │ ┌──────────────┬─────────────────┐│
    │ │ Formulario   │ Vista Previa PDF││
    │ │ (Izquierda)  │ (Derecha)       ││
    │ │              │ ┌─────────────┐ ││
    │ │              │ │ IFRAME PDF  │ ││
    │ │              │ │ (800px alto)│ ││
    │ │              │ └─────────────┘ ││
    │ │              │ [Ver PDF]       ││
    │ │              │ [Procesar PDF]  ││
    │ └──────────────┴─────────────────┘│
    └───────────────────────────────────┘
                 │
                 ▼
    ┌───────────────────────────────────┐
    │ Usuario hace Click en             │
    │ "Procesar PDF y Cargar Datos"     │
    └──────────┬────────────────────────┘
               │
               ▼
    ┌────────────────────────────────────────┐
    │ handleProcesarPdfActual() Ejecuta      │
    │ POST /api/pdf/extract-certification    │
    │ {                                      │
    │   rutaPdf: "uploads/cert_11_...",     │
    │   procesarDesdeServidor: true          │
    │ }                                      │
    └──────────┬─────────────────────────────┘
               │
               ▼
    ┌────────────────────────────────────────┐
    │ Backend pdfController.js                │
    │ • Lee archivo desde disco               │
    │ • Extrae datos con pdf2json             │
    │ • Retorna { nota, mes, estado, ... }   │
    └──────────┬─────────────────────────────┘
               │
               ▼
    ┌────────────────────────────────────────┐
    │ Frontend Recibe Datos Extraídos        │
    │ • setFormData() actualiza campos       │
    │ • Swal muestra confirmación            │
    └──────────┬─────────────────────────────┘
               │
               ▼
    ┌────────────────────────────────────────┐
    │ Usuario Puede:                         │
    │ • Revisar datos en formulario          │
    │ • Modificar manualmente si es necesario│
    │ • Click "Actualizar" para guardar      │
    └────────────────────────────────────────┘
```

---

## ✅ Checklist de Verificación

### Frontend
- [x] Vista previa iframe muestra PDF
- [x] Botón "Ver en Nueva Ventana" funciona
- [x] Botón "Procesar" deshabilitado durante procesamiento
- [x] Texto del botón cambia dinámicamente
- [x] Estados pdfRutaActual/pdfNombreActual cargan

### Backend
- [x] Servidor sirve archivos desde `/uploads`
- [x] Endpoint acepta JSON con rutaPdf
- [x] Controlador lee archivo desde disco
- [x] Procesa PDF correctamente
- [x] Retorna datos extraídos

### Integración
- [x] Datos extraídos actualizan formulario
- [x] Swal muestra resultados
- [x] Usuario puede guardar cambios
- [x] Modal responsive

---

## 📊 Estadísticas

| Métrica | Antes | Después |
|---------|-------|---------|
| **Ancho Modal** | 900px | 95vw (~1500px) |
| **Alto Modal** | Auto | 90vh (~900px) |
| **Alto PDF** | N/A | 800px |
| **Casos de Procesamiento** | 1 (upload) | 2 (upload + ruta) |
| **Fuentes de PDF** | Solo upload | Upload + Disco |

---

## 🚀 Próximos Pasos Opcionales

1. **Mejorar extracción**: Ajustar patrones regex para más precisión
2. **Validación**: Agregar validaciones de datos extraídos
3. **Preview mejorado**: Usar biblioteca como `react-pdf` para mejor vista previa
4. **Historial**: Guardar logs de procesamiento
5. **Batch processing**: Procesar múltiples PDFs simultáneamente

---

## 📌 Notas Importantes

- **URL del PDF:** `/uploads/certificaciones/cert_ID_TIMESTAMP.pdf`
- **Validación de ruta:** El backend verifica que el archivo existe
- **Seguridad:** Solo usuarios autenticados pueden procesar PDFs
- **Errores:** Se muestran en Swal para mejor UX
- **Tamaño máximo:** 10MB por archivo

---

**Implementado por:** GitHub Copilot  
**Última actualización:** 21 de Marzo 2026  
**Estado:** ✅ PRODUCCIÓN

