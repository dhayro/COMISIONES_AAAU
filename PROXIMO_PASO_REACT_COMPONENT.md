# 🚀 Próximos Pasos - PDF Upload + Form Integration

## 1. React Component: PdfUploadDialog.jsx

### Ubicación Sugerida
```
frontend/src/components/PdfUploadDialog.jsx
```

### Funcionalidades
```jsx
// PdfUploadDialog.jsx
import { useState } from 'react';
import { Dialog, Button, Alert, Spinner } from '@shadcn/ui';

export function PdfUploadDialog() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/pdf/extract-certification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Extracción fallida');
      
      const result = await response.json();
      setExtractedData(result.data);
      // Pasar datos al formulario principal
      onDataExtracted(result.data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <input 
        type="file" 
        accept=".pdf"
        onChange={(e) => handleUpload(e.target.files[0])}
      />
      
      {loading && <Spinner />}
      {error && <Alert variant="error">{error}</Alert>}
      
      {extractedData && (
        <div className="extraction-preview">
          {/* Mostrar datos extraídos */}
          <h3>Datos Extraídos</h3>
          <p>Meta: {extractedData.meta_info.numero} - {extractedData.meta_info.descripcion}</p>
          <p>Fuente: {extractedData.fuente_info_full.nombre}</p>
          <p>Monto Total: S/ {extractedData.monto_total}</p>
          
          <h4>Detalles ({extractedData.detalles_raw.length})</h4>
          <table>
            <thead>
              <tr>
                <th>Partida</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Clasificador</th>
              </tr>
            </thead>
            <tbody>
              {extractedData.detalles_raw.map((det, i) => (
                <tr key={i}>
                  <td>{det.partida_db}</td>
                  <td>{det.descripcion}</td>
                  <td>S/ {det.monto}</td>
                  <td>{det.clasificador_nombre || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <Button onClick={() => onConfirm(extractedData)}>
            Usar estos datos
          </Button>
        </div>
      )}
    </Dialog>
  );
}
```

## 2. Backend Endpoint: POST /api/pdf/save-certification

### Implementación en pdfController.js

```javascript
/**
 * Guardar certificación extraída en la base de datos
 * POST /api/pdf/save-certification
 */
exports.saveCertification = async (req, res) => {
  try {
    const { extractedData } = req.body;
    const userId = req.user.id;
    
    let connection;
    
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
      });
      
      // 1. Insertar certificación principal
      const [certResult] = await connection.query(
        `INSERT INTO certificaciones_credito (
          nota, mes, fecha_aprobacion, fecha_documento, 
          estado_certificacion, tipo_documento, numero_documento, 
          justificacion, monto_total, meta_id, fuente_financiamiento_id, 
          usuario_id, fecha_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          extractedData.nota,
          extractedData.mes,
          extractedData.fecha_aprobacion,
          extractedData.fecha_documento,
          extractedData.estado_certificacion,
          extractedData.tipo_documento,
          extractedData.numero_documento,
          extractedData.justificacion,
          extractedData.monto_total,
          extractedData.meta_id || extractedData.meta_info.id,
          extractedData.fuente_financiamiento_id,
          userId
        ]
      );
      
      const certificacionId = certResult.insertId;
      console.log(`✅ Certificación creada: ID=${certificacionId}`);
      
      // 2. Insertar detalles
      for (const detalle of extractedData.detalles_raw) {
        await connection.query(
          `INSERT INTO detalles_certificacion_credito (
            certificacion_id, partida_id, descripcion, monto, 
            clasificador_id, fecha_registro
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            certificacionId,
            detalle.partida_db,
            detalle.descripcion,
            detalle.monto,
            detalle.clasificador_id || null
          ]
        );
      }
      
      console.log(`✅ ${extractedData.detalles_raw.length} detalles creados`);
      
      res.json({
        success: true,
        message: 'Certificación guardada exitosamente',
        certificacionId: certificacionId,
        detallesCont: extractedData.detalles_raw.length
      });
      
    } finally {
      if (connection) await connection.end();
    }
    
  } catch (error) {
    console.error('❌ Error al guardar certificación:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### Route en pdf.js

```javascript
router.post('/save-certification', authenticateToken, pdfController.saveCertification);
```

## 3. Form Integration

### Flujo de Datos
```
[Upload PDF] 
    ↓
[Parse & Enrich] ← Extrae todos los datos
    ↓
[Show Preview] ← Permite edición/revisión
    ↓
[Confirm & Save] → Guarda en BD
    ↓
[Show Success Message]
```

### Component Principal (CertificationForm.jsx)

```jsx
import { useState } from 'react';
import { PdfUploadDialog } from './PdfUploadDialog';

export function CertificationForm() {
  const [formData, setFormData] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleDataExtracted = (data) => {
    // Mapear datos extraídos a estructura del formulario
    setFormData({
      nota: data.nota,
      mes: data.mes,
      fecha_aprobacion: data.fecha_aprobacion,
      fecha_documento: data.fecha_documento,
      estado_certificacion: data.estado_certificacion,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      justificacion: data.justificacion,
      monto_total: data.monto_total,
      meta_id: data.meta_info.id,
      fuente_financiamiento_id: data.fuente_financiamiento_id,
      detalles_raw: data.detalles_raw
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/pdf/save-certification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ extractedData: formData })
    });
    
    if (response.ok) {
      setSaved(true);
      // Resetear formulario o redirigir
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PdfUploadDialog onDataExtracted={handleDataExtracted} />
      
      {formData && (
        <>
          <div className="form-section">
            <h3>Información del Documento</h3>
            
            <input 
              name="nota"
              value={formData.nota}
              readOnly
              label="Nota N°"
            />
            
            <input 
              name="numero_documento"
              value={formData.numero_documento}
              readOnly
              label="Número de Documento"
            />
            
            <select 
              name="meta_id"
              value={formData.meta_id}
              // Formulario debe permitir cambios si es necesario
            >
              {/* Options desde BD */}
            </select>
            
            <select 
              name="fuente_financiamiento_id"
              value={formData.fuente_financiamiento_id}
            >
              {/* Options desde BD */}
            </select>
          </div>
          
          <div className="form-section">
            <h3>Detalles de Gasto</h3>
            <table>
              <thead>
                <tr>
                  <th>Partida</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Clasificador</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {formData.detalles_raw.map((det, i) => (
                  <tr key={i}>
                    <td>{det.partida_db}</td>
                    <td>
                      <input 
                        value={det.descripcion}
                        onChange={(e) => {
                          const newDet = [...formData.detalles_raw];
                          newDet[i].descripcion = e.target.value;
                          setFormData({...formData, detalles_raw: newDet});
                        }}
                      />
                    </td>
                    <td>{det.monto}</td>
                    <td>{det.clasificador_nombre || '-'}</td>
                    <td>
                      <button onClick={() => {
                        // Permitir editar clasificador si es necesario
                      }}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button type="submit">Guardar Certificación</button>
        </>
      )}
      
      {saved && (
        <Alert variant="success">
          ✅ Certificación guardada exitosamente
        </Alert>
      )}
    </form>
  );
}
```

## 4. Estructura de Tablas Esperadas

```sql
-- Ya debe existir:
CREATE TABLE certificaciones_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nota VARCHAR(20),
  mes VARCHAR(20),
  fecha_aprobacion DATE,
  fecha_documento DATE,
  estado_certificacion VARCHAR(50),
  tipo_documento VARCHAR(50),
  numero_documento VARCHAR(50),
  justificacion TEXT,
  monto_total DECIMAL(12,2),
  meta_id INT,
  fuente_financiamiento_id INT,
  usuario_id INT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meta_id) REFERENCES metas(id),
  FOREIGN KEY (fuente_financiamiento_id) REFERENCES fuentes_financiamiento(id),
  FOREIGN KEY (usuario_id) REFERENCES users(id)
);

-- Ya debe existir:
CREATE TABLE detalles_certificacion_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  certificacion_id INT NOT NULL,
  partida_id VARCHAR(20),
  descripcion TEXT,
  monto DECIMAL(12,2),
  clasificador_id INT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (certificacion_id) REFERENCES certificaciones_credito(id),
  FOREIGN KEY (clasificador_id) REFERENCES clasificadores(id)
);
```

## 5. Testing Checklist

- [ ] Upload PDF válido
- [ ] Verificar que extrae todos los campos
- [ ] Verificar que enriquece con IDs correctos
- [ ] Mostrar preview de datos extraídos
- [ ] Guardar en base de datos
- [ ] Verificar que se guardaron los detalles
- [ ] Manejar errores (PDF inválido, etc)
- [ ] Probar con múltiples PDFs
- [ ] Validar campos requeridos

## 6. Error Handling

```javascript
// Posibles errores y manejo
try {
  // 1. Archivo PDF inválido
  if (!file.type.includes('pdf')) {
    throw new Error('El archivo debe ser PDF');
  }
  
  // 2. PDF dañado o no legible
  // → pdfController ya maneja timeout de 15s
  
  // 3. Meta no encontrada en BD
  if (!extractedData.meta_info.id) {
    console.warn('⚠️ Meta no encontrada en BD');
    // Mostrar warning pero permitir continuar
  }
  
  // 4. Clasificador no encontrado
  // → Es opcional, detalles sin clasificador son válidos
  
  // 5. Error al guardar en BD
  // → Mostrar error al usuario, permitir reintentar
  
} catch (error) {
  // Mostrar mensajes amigables al usuario
  setError(getErrorMessage(error));
}
```

---

**Próxima Acción:** Crear PdfUploadDialog.jsx con interfaz de upload y preview
