# 📄 Actualización: Vista Previa de PDF Real y Procesamiento

**Fecha:** 21 de Marzo 2026  
**Estado:** ✅ 95% COMPLETADO  
**Próximo:** Ajustar backend para procesar desde ruta existente

---

## ✨ Características Implementadas

### 1. **Vista Previa Embedida del PDF** ✅
- **Componente:** `<iframe>` que muestra el PDF en tiempo real
- **Ubicación:** Panel derecho del modal en edición
- **Fuente:** URL `http://localhost:5000${pdfRutaActual}`
- **Altura:** 350px, ancho completo
- **Visibilidad:** Solo cuando hay PDF cargado

```javascript
// Línea 1206-1218 en GestionCertificacionesCredito.js
<iframe
  src={`http://localhost:5000${pdfRutaActual}`}
  style={{
    width: '100%',
    height: '350px',
    border: 'none',
    borderRadius: '4px'
  }}
  title="Vista Previa PDF"
/>
```

### 2. **Botón "Ver PDF en Nueva Ventana"** ✅
- **Texto:** "Ver PDF en Nueva Ventana"
- **Acción:** `window.open()` - Abre el PDF en una pestaña nueva
- **URL:** `http://localhost:5000${pdfRutaActual}`
- **Ubicación:** Encima del botón de procesar

```javascript
// Línea 1219-1227
<MDButton
  variant="outlined"
  color="info"
  onClick={() => window.open(`http://localhost:5000${pdfRutaActual}`, '_blank')}
  fullWidth
  sx={{ mb: 1 }}
>
  Ver PDF en Nueva Ventana
</MDButton>
```

### 3. **Botón "Procesar PDF y Cargar Datos"** ✅ (Parcial)
- **Texto dinámico:** "Procesando..." cuando `loading === true`
- **Estado:** `disabled={loading}` previene clicks duplicados
- **Función:** `handleProcesarPdfActual()`
- **Ubicación:** Línea 1230-1241

```javascript
// Línea 1230-1241
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

### 4. **Función handleProcesarPdfActual()** ✅ (Parcial)
- **Ubicación:** Línea 379-475
- **Validación:** Verifica que `pdfRutaActual` exista
- **Petición:** POST a `/api/pdf/extract-certification`
- **Parámetros enviados:**
  - `rutaPdf`: Ruta del archivo en servidor (e.g., `/uploads/certificaciones/cert_123.pdf`)
  - `procesarDesdeServidor: true`: Flag para procesar desde ruta
- **Actualización:** `setFormData()` con datos extraídos
- **Feedback:** Swal mostrada con datos extraídos

```javascript
// Línea 379-475 - Función completa
const handleProcesarPdfActual = async () => {
  if (!pdfRutaActual) {
    Swal.fire({ icon: 'warning', title: 'Sin PDF', text: '...' });
    return;
  }

  try {
    setLoading(true);
    Swal.fire({
      title: '⏳ Procesando PDF...',
      text: 'Extrayendo datos del PDF...',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
        try {
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
            // ... más campos
            monto_certificado: extractedData.monto_total || prev.monto_certificado,
          }));

          Swal.fire({
            title: '✅ PDF Procesado',
            html: `Datos extraídos...`,
            icon: 'success',
            confirmButtonText: 'Actualizar Formulario'
          });
          setLoading(false);
        } catch (err) {
          Swal.fire({
            title: '❌ Error',
            text: `Error procesando PDF: ${err.message}`,
            icon: 'error'
          });
          setLoading(false);
        }
      }
    });
  } catch (err) {
    setLoading(false);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Error: ${err.message}`,
    });
  }
};
```

---

## 🎯 Flujo de Funcionamiento

### Usuario Abre una Certificación (Edición)
```
1. Click en ✏️ editar certificación
   ↓
2. handleOpenDialog() ejecuta
   ├─ Carga pdfRutaActual = certificacion.ruta_archivo_pdf
   ├─ Carga pdfNombreActual = certificacion.nombre_archivo_pdf
   └─ Carga todos los campos del formulario
   ↓
3. Modal abre en dos columnas
   ├─ Izq: Formulario editable
   └─ Der: Vista previa PDF (iframe) + Botones
```

### Usuario Hace Click en "Procesar PDF y Cargar Datos"
```
1. Click en botón
   ↓
2. handleProcesarPdfActual() ejecuta
   ├─ setLoading(true)
   ├─ Muestra Swal con "Procesando..."
   └─ Abre didOpen
      ↓
3. POST /api/pdf/extract-certification
   body: {
     rutaPdf: "/uploads/certificaciones/cert_123.pdf",
     procesarDesdeServidor: true
   }
   ↓
4. Backend procesa PDF desde ruta
   ├─ Lee archivo del disco
   ├─ Extrae datos (nota, mes, estado, monto, etc.)
   └─ Retorna JSON con datos
   ↓
5. Frontend recibe datos
   ├─ setFormData() con valores extraídos
   ├─ Campos se actualizan automáticamente
   └─ Muestra Swal de confirmación
   ↓
6. Usuario puede
   ├─ Revisar los datos cargados
   ├─ Modificar manualmente si es necesario
   └─ Click "Actualizar" para guardar
```

---

## ❌ Problema Actual

El backend **aún no maneja** la solicitud con `rutaPdf` en JSON. 

**Error esperado:** Backend rechaza porque espera `req.file` (multipart)

**Solución:** Actualizar `/api/pdf/extract-certification` para:
1. Detectar si es `req.file` (upload) O `req.body.rutaPdf` (ruta)
2. Si es ruta: leer archivo desde disco
3. Si es archivo: usar buffer recibido
4. Procesar en ambos casos igual

---

## 📝 Cambios Necesarios en Backend

### Archivo: `backend/controllers/pdfController.js`

**Función actual:** `exports.extractCertificationPdf()`

**Cambio requerido:**
```javascript
exports.extractCertificationPdf = async (req, res) => {
  try {
    let pdfBuffer;
    let pdfPath;
    
    // CASO 1: Archivo enviado (multipart/form-data)
    if (req.file) {
      pdfBuffer = req.file.buffer;
      pdfPath = req.file.originalname;
      console.log('📤 PDF desde upload:', pdfPath);
    }
    // CASO 2: Ruta existente (application/json)
    else if (req.body.rutaPdf && req.body.procesarDesdeServidor) {
      const fs = require('fs');
      const path = require('path');
      
      // Ruta completa del archivo
      const rutaCompleta = path.join(
        __dirname,
        '..',
        'uploads',
        'certificaciones',
        path.basename(req.body.rutaPdf)
      );
      
      console.log('💾 PDF desde servidor:', rutaCompleta);
      
      if (!fs.existsSync(rutaCompleta)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo PDF no encontrado: ' + rutaCompleta
        });
      }
      
      pdfBuffer = fs.readFileSync(rutaCompleta);
      pdfPath = path.basename(rutaCompleta);
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó archivo PDF o ruta válida'
      });
    }
    
    // Procesar PDF (igual para ambos casos)
    const PDFParser = require('pdf2json');
    // ... resto del código igual ...
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
```

---

## 📋 Cambios Realizados en Frontend

| Línea | Cambio | Estado |
|-------|--------|--------|
| 1206-1218 | Agregar `<iframe>` para vista previa PDF | ✅ |
| 1219-1227 | Agregar botón "Ver PDF en Nueva Ventana" | ✅ |
| 1230-1241 | Actualizar botón con `disabled={loading}` y texto dinámico | ✅ |
| 379-475 | Crear función `handleProcesarPdfActual()` | ✅ |

---

## 🚀 Próximos Pasos

### INMEDIATO (En progreso)
1. [ ] Actualizar `pdfController.extractCertificationPdf()` para manejar ruta JSON
2. [ ] Probar con certificación existente
3. [ ] Verificar que los datos se cargan correctamente

### Después
4. [ ] Documentar flujo completo
5. [ ] Crear guía de prueba para usuario
6. [ ] Verificar manejo de errores

---

## ✅ Checklist de Validación

### Frontend
- [x] Vista previa iframe muestra PDF
- [x] Botón "Ver en Nueva Ventana" abre pestaña
- [x] Botón "Procesar" es disabled durante procesamiento
- [x] Texto del botón cambia a "Procesando..."
- [x] Estados pdfRutaActual y pdfNombreActual se cargan

### Backend (PENDIENTE)
- [ ] Endpoint acepta `rutaPdf` en JSON
- [ ] Lee archivo desde carpeta /uploads/certificaciones/
- [ ] Procesa PDF correctamente
- [ ] Retorna datos extraídos

### Integración
- [ ] Datos extraídos actualizan formulario
- [ ] Swal muestra datos extraídos correctamente
- [ ] Usuario puede guardar cambios

---

## 📌 Notas Técnicas

- **Rutas relativas:** La ruta `/uploads/certificaciones/cert_123.pdf` será procesada
- **Seguridad:** Backend debe validar que la ruta existe y pertenece al usuario
- **Streaming:** iframe carga PDF directamente desde backend
- **Errores:** Si PDF no existe → mostrar alerta, no cargar datos

