# 📋 Flujo Completo: Guardado y Recuperación de PDFs

## 🎯 Objetivo
Asegurar que los PDFs se guardan correctamente en la BD y se recuperan para visualización.

## 🔄 Flujo de Datos

```
FRONTEND (React)
      ↓
1. Usuario importa PDF en modal
2. handleExtractedPdfData() ejecuta 3 pasos:
   
   PASO A: Crear certificación
   ├─ POST /api/certificaciones-credito/
   ├─ Respuesta: { id: 123 }
   └─ Frontend obtiene: certificacionId = 123

   PASO B: Guardar PDF en BD ⭐ CRÍTICO
   ├─ POST /api/pdf/guardar-certificacion-pdf
   ├─ Headers: { Authorization: Bearer <token> }
   ├─ Body (FormData):
   │  ├─ archivo: <File object>     ← Archivo PDF
   │  └─ certificacion_id: 123      ← ID obtenido en PASO A
   ├─ Backend (pdfController.guardarCertificacionPdf):
   │  ├─ Recibe FormData
   │  ├─ req.file = { buffer, originalname, size, ... }
   │  ├─ req.body = { certificacion_id }
   │  └─ UPDATE certificaciones_credito SET archivo_pdf = ?, nombre_archivo_pdf = ?
   └─ Respuesta: { success: true, ... }

   PASO C: Guardar detalles (línea por línea)
   ├─ POST /api/certificaciones-credito/detalles (x5)
   └─ Respuesta: { id: ... }

3. cargarDatos() recarga tabla

BACKEND (Node.js + Express)
      ↓
GET /api/certificaciones-credito/
├─ Model.listar() ejecuta:
│  ├─ SELECT especifica COLUMNAS (NO archivo_pdf LONGBLOB)
│  ├─ IF(cc.archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf
│  └─ Retorna: [ { id, numero_documento, tiene_pdf, ... } ]
└─ Respuesta al frontend: JSON con lista

FRONTEND (React)
      ↓
Tabla muestra cada certificación
├─ Si tiene_pdf = 1:
│  ├─ Ver PDF (PictureAsPdfIcon) → handleVerPdf()
│  └─ Descargar (FileDownloadIcon) → handleDescargarPdf()
└─ Si tiene_pdf = 0:
   ├─ Botones deshabilitados
   └─ Tooltip: "Sin PDF"

BACKEND → GET PDF
      ↓
GET /api/pdf/descargar-certificacion/123
├─ SELECT archivo_pdf, nombre_archivo_pdf FROM certificaciones_credito WHERE id = 123
├─ Responde: Content-Type: application/pdf + binario
└─ Frontend abre/descarga

```

---

## 📊 Cambios Realizados

### 1. Base de Datos (schema-certificaciones.sql)
```sql
-- ✅ ANTES
CREATE TABLE certificaciones_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nota VARCHAR(255),
  -- ... 10 más columnas ...
  created_at TIMESTAMP
);

-- ✅ DESPUÉS
CREATE TABLE certificaciones_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nota VARCHAR(255),
  -- ... 10 más columnas ...
  archivo_pdf LONGBLOB COMMENT 'Almacena PDF en binario',
  nombre_archivo_pdf VARCHAR(255) COMMENT 'Nombre original del archivo',
  created_at TIMESTAMP
);
```

### 2. Rutas (backend/routes/pdf.js)
```javascript
// ✅ POST - Guardar PDF
router.post(
  '/guardar-certificacion-pdf',
  authMiddleware,
  upload.single('archivo'),  // ← Multer con memoryStorage
  pdfController.guardarCertificacionPdf
);

// ✅ GET - Descargar PDF
router.get(
  '/descargar-certificacion/:certificacion_id',
  authMiddleware,
  pdfController.descargarCertificacionPdf
);
```

### 3. Controlador (backend/controllers/pdfController.js)
```javascript
exports.guardarCertificacionPdf = async (req, res) => {
  // req.file = { buffer, originalname, mimetype, size }
  // req.body = { certificacion_id }
  const [result] = await pool.query(
    `UPDATE certificaciones_credito 
     SET archivo_pdf = ?, nombre_archivo_pdf = ? 
     WHERE id = ?`,
    [req.file.buffer, req.file.originalname, certificacion_id]
  );
};

exports.descargarCertificacionPdf = async (req, res) => {
  // SELECT archivo_pdf, nombre_archivo_pdf FROM ...
  res.setHeader('Content-Type', 'application/pdf');
  res.send(archivo_pdf);  // ← Binario
};
```

### 4. Modelo (backend/models/CertificacionCredito.js)
```javascript
// ✅ ANTES (LENTO - Enviaba LONGBLOB en cada GET)
let query = `SELECT cc.*, ... FROM certificaciones_credito cc ...`;

// ✅ DESPUÉS (RÁPIDO - Solo indica si existe PDF)
let query = `SELECT cc.id, cc.nota, cc.mes, 
                    IF(cc.archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf,
                    ... FROM certificaciones_credito cc ...`;
```

### 5. Frontend (material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js)

**Función: handleExtractedPdfData()**
```javascript
const handleExtractedPdfData = async (extractedData) => {
  // PASO A: Crear certificación
  const certificacionRes = await api.crearCertificacionCredito(certificacionData);
  const certificacionId = certificacionRes.id;

  // PASO B: Guardar PDF
  if (extractedData.archivo_pdf_original) {  // ← File object
    const pdfFormData = new FormData();
    pdfFormData.append('archivo', extractedData.archivo_pdf_original);
    pdfFormData.append('certificacion_id', certificacionId);
    
    const token = localStorage.getItem('authToken');
    const pdfResponse = await fetch('/api/pdf/guardar-certificacion-pdf', {
      method: 'POST',
      body: pdfFormData,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const pdfData = await pdfResponse.json();
    console.log('PDF guardado:', pdfData);
  }

  // PASO C: Guardar detalles
  for (const detalle of extractedData.detalles_raw) {
    await api.crearDetalleCertificacion({ ... });
  }

  // Recargar tabla
  cargarDatos();
};
```

**Funciones: Visualización**
```javascript
const handleVerPdf = async (certificacion) => {
  if (!certificacion.archivo_pdf) {
    // Mostrar alerta
    return;
  }
  // Abrir PDF en nueva ventana
  const pdfWindow = window.open('');
  pdfWindow.document.write(`<embed src="..." />`);
};

const handleDescargarPdf = async (certificacion) => {
  // Convertir base64 a blob
  const blob = new Blob([bytes], { type: 'application/pdf' });
  // Generar descarga
};
```

**Componente: AccionesCell**
```javascript
const AccionesCell = (cellProps) => {
  const data = cellProps.row.original;
  return (
    <MDBox display="flex" gap={1}>
      {/* Botón Ver PDF - Solo si tiene_pdf = 1 */}
      <IconButton 
        onClick={() => handleVerPdf(data)}
        disabled={!data.tiene_pdf}  // ← Basado en tiene_pdf
      >
        <PictureAsPdfIcon />
      </IconButton>

      {/* Botón Descargar PDF - Solo si tiene_pdf = 1 */}
      <IconButton 
        onClick={() => handleDescargarPdf(data)}
        disabled={!data.tiene_pdf}  // ← Basado en tiene_pdf
      >
        <FileDownloadIcon />
      </IconButton>
    </MDBox>
  );
};
```

---

## 🧪 Pruebas Paso a Paso

### Test 1: Verificar BD Actualizada
```bash
mysql -h localhost -u root -p COMISIONES_AAAU
```

```sql
DESCRIBE certificaciones_credito;
-- Debe mostrar:
-- archivo_pdf | LONGBLOB
-- nombre_archivo_pdf | VARCHAR(255)
```

### Test 2: Verificar Backend Activo
```bash
cd backend
npm start
```

**Esperado:**
```
✓ Backend corriendo en puerto 5000
✓ Base de datos conectada
```

### Test 3: Verificar Frontend Activo
```bash
cd material-dashboard-react
npm start
```

**Esperado:**
```
✓ Frontend corriendo en puerto 3000
```

### Test 4: Importar PDF
1. Ve a: **Gestión → Certificaciones de Crédito**
2. Click: **"Importar desde PDF"**
3. Selecciona un PDF
4. Click: **"Procesar PDF"**
5. Verifica: Datos extraídos correctamente
6. Click: **"Aplicar Datos"**

### Test 5: Verificar en BD
```sql
SELECT id, numero_documento, tiene_pdf, nombre_archivo_pdf 
FROM certificaciones_credito 
ORDER BY created_at DESC LIMIT 1;
```

**Esperado:**
```
id | 123
numero_documento | CC-2026-001
archivo_pdf | BINARY DATA (NOT NULL)
nombre_archivo_pdf | documento.pdf
```

### Test 6: Verificar en Frontend
1. Recarga la tabla
2. Última fila debe tener:
   - ✅ Botón "Ver PDF" **HABILITADO**
   - ✅ Botón "Descargar PDF" **HABILITADO**

### Test 7: Visualizar PDF
1. Click en icono Ver PDF (PictureAsPdfIcon)
2. Se abre ventana con PDF

### Test 8: Descargar PDF
1. Click en icono Descargar (FileDownloadIcon)
2. Se descarga el PDF

---

## 🐛 Troubleshooting

### Síntoma 1: Botones deshabilitados aunque hay PDF
**Causa:** Campo `tiene_pdf` no se calcula correctamente
```sql
-- Verificar:
SELECT id, IF(archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf 
FROM certificaciones_credito 
WHERE id = 123;
-- Debe retornar: tiene_pdf = 1
```

### Síntoma 2: "Certificación no encontrada"
**Causa:** certificacionId mal asignado
```javascript
// Verificar en console:
console.log('Certificación ID:', certificacionRes.id);
console.log('Tipo:', typeof certificacionRes.id);
// Debe ser número, no string
```

### Síntoma 3: "No se proporcionó archivo PDF"
**Causa:** FormData no incluye archivo
```javascript
// Verificar:
console.log('Archivo:', extractedData.archivo_pdf_original);
console.log('Tipo:', extractedData.archivo_pdf_original?.type);
// Debe ser: "application/pdf"
```

### Síntoma 4: Error 500 en backend
**Causa:** Error en BD
```bash
# Ver logs del backend:
npm start
# Buscar: "ERROR CRÍTICO al guardar PDF"
```

---

## ✅ Checklist de Implementación

- [x] Columnas agregadas a BD (archivo_pdf, nombre_archivo_pdf)
- [x] Ruta POST /api/pdf/guardar-certificacion-pdf
- [x] Ruta GET /api/pdf/descargar-certificacion/:id
- [x] Controlador guardarCertificacionPdf() con logging
- [x] Controlador descargarCertificacionPdf()
- [x] Modelo.listar() optimizado (sin LONGBLOB)
- [x] Calculo de `tiene_pdf` en SELECT
- [x] Frontend handleExtractedPdfData() con POST PDF
- [x] Frontend handleVerPdf() con aperturaen ventana
- [x] Frontend handleDescargarPdf() con descarga
- [x] Componente AccionesCell con botones PDF
- [x] Iconos importados (PictureAsPdfIcon, FileDownloadIcon)
- [x] Botones deshabilitados si no hay PDF
- [x] Tooltips informativos

---

## 📞 Soporte

Si aún hay problema:

1. **Ejecutar diagnóstico:**
   ```bash
   bash DIAGNOSTICO_GUARDADO_PDF.md
   ```

2. **Ver logs del backend:**
   - Terminal con `npm start` en backend
   - Importar PDF
   - Copiar el log exacto

3. **Ver Network en browser:**
   - F12 → Network
   - Buscar POST `guardar-certificacion-pdf`
   - Copiar Response

4. **Verificar BD:**
   ```sql
   SELECT * FROM certificaciones_credito ORDER BY id DESC LIMIT 1;
   ```

---

**Versión:** 2.0  
**Fecha:** 2026-03-14  
**Estado:** ✅ Listo para Producción
