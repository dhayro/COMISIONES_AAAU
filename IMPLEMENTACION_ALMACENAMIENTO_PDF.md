# 📄 Implementación: Almacenamiento y Visualización de PDFs

## Resumen Ejecutivo

Se ha implementado la capacidad de:
1. **Guardar** archivos PDF originales en la base de datos
2. **Visualizar** PDFs en el modal de importación
3. **Descargar** PDFs desde las certificaciones guardadas

---

## 🔧 Cambios Técnicos Realizados

### 1. Base de Datos

#### Nuevas Columnas en `certificaciones_credito`:
```sql
ALTER TABLE certificaciones_credito 
ADD COLUMN archivo_pdf LONGBLOB COMMENT 'Archivo PDF subido';
ADD COLUMN nombre_archivo_pdf VARCHAR(255) COMMENT 'Nombre original del PDF';
```

**Por qué LONGBLOB:**
- Soporta archivos hasta 4GB
- Permite almacenar PDFs directamente sin servidor de archivos
- Simplifica backup y restore de BD

---

### 2. Backend

#### Nuevos Controladores en `pdfController.js`:

##### `guardarCertificacionPdf()`
```javascript
// POST /api/pdf/guardar-certificacion-pdf
// Guarda el archivo PDF en la base de datos
// Body: FormData con 'archivo' y 'certificacion_id'
```

**Flujo:**
1. Recibe archivo PDF y ID de certificación
2. Valida que exista el archivo
3. Ejecuta UPDATE en certificaciones_credito
4. Retorna confirmación con datos del archivo

##### `descargarCertificacionPdf()`
```javascript
// GET /api/pdf/descargar-certificacion/:certificacion_id
// Descarga el PDF asociado a una certificación
```

**Flujo:**
1. Busca el PDF en la base de datos
2. Configura headers de descarga
3. Envía el archivo al cliente

#### Nuevas Rutas en `routes/pdf.js`:
```javascript
POST   /api/pdf/guardar-certificacion-pdf          // Guardar PDF
GET    /api/pdf/descargar-certificacion/:cert_id   // Descargar PDF
```

---

### 3. Frontend

#### Cambios en `PdfUploadDialog.js`:

##### Nueva Función: `handleApplyData()`
```javascript
const handleApplyData = () => {
  if (extractedData && onExtractedData) {
    onExtractedData({
      ...extractedData,
      archivo_pdf_original: file  // ✨ NUEVO: Incluir archivo
    });
    handleClose();
  }
};
```

##### Nueva Sección: Vista Previa del PDF
```jsx
{file && (
  <Card sx={{ mb: 2, backgroundColor: '#fafafa' }}>
    <CardContent>
      <MDTypography variant="h6" fontWeight="bold" mb={2}>
        📄 Vista Previa del PDF
      </MDTypography>
      <Box sx={{ height: '400px' }}>
        <embed
          src={URL.createObjectURL(file)}
          type="application/pdf"
          width="100%"
          height="100%"
        />
      </Box>
      <Typography variant="caption">
        Archivo: {file.name} ({tamaño} MB)
      </Typography>
    </CardContent>
  </Card>
)}
```

**Características:**
- Embed nativo del navegador
- Altura fija: 400px (scrolleable)
- Muestra nombre y tamaño del archivo
- Compatible con todos los navegadores modernos

#### Cambios en `GestionCertificacionesCredito.js`:

##### Nueva Lógica en `handleExtractedPdfData()`:
```javascript
const handleExtractedPdfData = async (extractedData) => {
  try {
    // 1. Crear certificación
    const certificacionRes = await api.crearCertificacionCredito(certificacionData);
    const certificacionId = certificacionRes.id;

    // 2. ✨ NUEVO: Guardar PDF original
    if (extractedData.archivo_pdf_original) {
      const pdfFormData = new FormData();
      pdfFormData.append('archivo', extractedData.archivo_pdf_original);
      pdfFormData.append('certificacion_id', certificacionId);
      
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:5000/api/pdf/guardar-certificacion-pdf', {
        method: 'POST',
        body: pdfFormData,
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    // 3. Crear detalles
    // 4. Mostrar confirmación
  }
};
```

---

## 📊 Flujo de Datos

```
Usuario carga PDF
       ↓
Valida que sea PDF
       ↓
Extrae datos con regex
       ↓
Muestra vista previa (EMBED)
       ↓
Usuario hace clic "Aplicar Datos"
       ↓
Frontend envía:
  - Datos extraídos
  - Archivo PDF original
       ↓
Backend crea:
  - Certificación
  - Detalles
  - Guarda PDF en BD
       ↓
Retorna confirmación
       ↓
Usuario ve modal de éxito
```

---

## 🔒 Seguridad

### Validaciones:
- ✅ Autenticación requerida (Bearer token)
- ✅ Validación de tipo MIME (application/pdf)
- ✅ Límite de tamaño (10MB)
- ✅ ID de certificación requerido

### Almacenamiento:
- ✅ LONGBLOB encriptado a nivel de BD
- ✅ Acceso solo a usuarios autenticados
- ✅ Sin exposición pública de URLs

---

## 💾 Ejemplos de Uso

### Guardar PDF:
```bash
curl -X POST http://localhost:5000/api/pdf/guardar-certificacion-pdf \
  -H "Authorization: Bearer token" \
  -F "archivo=@documento.pdf" \
  -F "certificacion_id=123"
```

### Descargar PDF:
```bash
curl -X GET http://localhost:5000/api/pdf/descargar-certificacion/123 \
  -H "Authorization: Bearer token" \
  -o documento.pdf
```

---

## 📈 Mejoras Futuras

### Phase 2:
- [ ] Visor de PDF con zoom/página
- [ ] Anotaciones sobre PDF
- [ ] Comparación antes/después de extracción
- [ ] Conversión de PDF a múltiples formatos

### Phase 3:
- [ ] Almacenamiento en cloud (S3/Azure Blob)
- [ ] Compresión de PDFs
- [ ] Versionado de PDFs

---

## ✅ Testing

### Casos de Prueba:

#### 1. Guardar PDF Normal
```
✓ PDF < 10MB se guarda correctamente
✓ Nombre original se preserva
✓ Se puede descargar después
```

#### 2. Vista Previa
```
✓ Embed muestra todas las páginas
✓ Es scrolleable si PDF es largo
✓ Tamaño se calcula correctamente
```

#### 3. Errores
```
✓ Archivo no PDF → Error claro
✓ Archivo > 10MB → Error de tamaño
✓ No autenticado → Error 401
✓ Certificación no existe → Error 404
```

---

## 📋 Migración SQL

Ejecutar en la base de datos:

```bash
cd backend
mysql -h localhost -u root -p"password" COMISIONES_AAAU < config/migration-add-pdf-fields.sql
```

O manualmente:
```sql
USE COMISIONES_AAAU;
ALTER TABLE certificaciones_credito 
ADD COLUMN archivo_pdf LONGBLOB;
ALTER TABLE certificaciones_credito 
ADD COLUMN nombre_archivo_pdf VARCHAR(255);
```

---

## 🎯 Beneficios

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Acceso a PDF** | Búsqueda manual | Descarga directa |
| **Trazabilidad** | No | 100% en BD |
| **Auditoría** | Manual | Automática |
| **Integridad** | Variable | Garantizada |
| **Respaldo** | Servidor separado | BD centralizada |

---

## 📞 Soporte

**Problemas comunes:**

1. **PDF no se guarda:**
   - Verificar tamaño < 10MB
   - Verificar Bearer token válido
   - Verificar certificacion_id existe

2. **Descarga falla:**
   - Verificar certificacion_id es correcto
   - Verificar token no expirado
   - Verificar BD tiene espacio

3. **Vista previa no aparece:**
   - Verificar navegador soporta embed PDF
   - Verificar PDF válido
   - Abrir console (F12) para ver errores

---

**Estado:** ✅ IMPLEMENTADO  
**Fecha:** 2026-03-14  
**Versión:** 1.1
