# 🎬 Ejemplo Visual: Flujo Completo de Guardado de PDF

## 📹 Escena 1: Usuario Importa PDF

```
┌─────────────────────────────────────────────────────┐
│          🌐 NAVEGADOR - Gestión de PDFs             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Certificaciones de Crédito                         │
│  ┌─────────────────────────────────────────────┐  │
│  │ Importar desde PDF                    [📄]  │  │
│  └─────────────────────────────────────────────┘  │
│         ↓ Click                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ Modal: Selecciona PDF                       │  │
│  │ [Drag and drop o Browse]                    │  │
│  │ Selecciono: CertificacionCredito_2026.pdf  │  │
│  └─────────────────────────────────────────────┘  │
│         ↓ Click "Procesar PDF"                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ ✓ PDF Procesado Exitosamente               │  │
│  │ Datos extraídos:                            │  │
│  │ - Número: CC-2026-001                       │  │
│  │ - Monto: S/. 20,540.00                      │  │
│  │ - 5 Detalles                                │  │
│  └─────────────────────────────────────────────┘  │
│         ↓ Click "Aplicar Datos"                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 📤 Enviando datos al servidor...            │  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 70%                          │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🌐 Escena 2: Frontend Ejecuta handleExtractedPdfData()

```javascript
// ===== NAVEGADOR (React) =====
const handleExtractedPdfData = async (extractedData) => {
  try {
    setLoading(true);

    // PASO A: Crear Certificación
    console.log('📍 PASO A: Creando certificación...');
    const certificacionRes = await api.crearCertificacionCredito({
      nota: 'N°001',
      mes: 'Marzo 2026',
      numero_documento: 'CC-2026-001',
      // ... más datos ...
    });
    
    const certificacionId = certificacionRes.id;  // ← Obtiene: 123
    console.log('✓ Certificación creada con ID:', certificacionId);

    // PASO B: Guardar PDF
    console.log('📍 PASO B: Guardando PDF...');
    if (extractedData.archivo_pdf_original) {  // ← File object
      
      const pdfFormData = new FormData();
      pdfFormData.append('archivo', extractedData.archivo_pdf_original);
      pdfFormData.append('certificacion_id', certificacionId);
      
      const token = localStorage.getItem('authToken');
      
      const pdfResponse = await fetch(
        'http://localhost:5000/api/pdf/guardar-certificacion-pdf',
        {
          method: 'POST',
          body: pdfFormData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!pdfResponse.ok) {
        const error = await pdfResponse.json();
        console.error('❌ Error guardando PDF:', error);
      } else {
        const result = await pdfResponse.json();
        console.log('✓ PDF guardado:', result);
        // {
        //   success: true,
        //   message: 'PDF guardado exitosamente',
        //   data: {
        //     certificacion_id: 123,
        //     archivo_nombre: 'CertificacionCredito_2026.pdf',
        //     archivo_tamaño: 45000
        //   }
        // }
      }
    }

    // PASO C: Guardar Detalles
    console.log('📍 PASO C: Guardando detalles...');
    for (const detalle of extractedData.detalles_raw) {
      await api.crearDetalleCertificacion({
        certificacion_credito_id: certificacionId,
        clasificador_id: detalle.clasificador_id,
        monto: detalle.monto,
      });
    }
    console.log('✓ Detalles guardados');

    // Recargar tabla
    cargarDatos();
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
};
```

**Consola del navegador muestra:**
```
📍 PASO A: Creando certificación...
✓ Certificación creada con ID: 123
📍 PASO B: Guardando PDF...
✓ PDF guardado: { success: true, ... }
📍 PASO C: Guardando detalles...
✓ Detalles guardados
```

---

## 🔄 Escena 3: HTTP Request → Backend

```
┌──────────────────────────────────────────────────────────┐
│         📤 HTTP REQUEST                                  │
├──────────────────────────────────────────────────────────┤
│ Method: POST                                             │
│ URL: http://localhost:5000/api/pdf/guardar-certificacion-pdf
│                                                          │
│ Headers:                                                 │
│   Authorization: Bearer eyJhbGc...                       │
│   Content-Type: multipart/form-data                      │
│                                                          │
│ Body (FormData):                                         │
│   ├─ archivo: <File>                                    │
│   │  ├─ name: CertificacionCredito_2026.pdf            │
│   │  ├─ size: 45000 bytes                              │
│   │  ├─ type: application/pdf                          │
│   │  └─ content: [BINARY DATA...]                      │
│   └─ certificacion_id: 123                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🖥️ Escena 4: Backend Procesa la Solicitud

```bash
# Terminal: npm start en backend

=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: { 
  fieldname: 'archivo',
  originalname: 'CertificacionCredito_2026.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 45000,
  buffer: <Buffer 25 50 44 46 2d 31 2e 34 ...> 
}

→ Ejecutando UPDATE certificaciones_credito
  SET archivo_pdf = ?, nombre_archivo_pdf = ? WHERE id = 123
  
UPDATE result: { affectedRows: 1 }

✓ PDF guardado exitosamente para certificación: 123
```

---

## 💾 Escena 5: Base de Datos Recibe Datos

```sql
-- Terminal MySQL:

mysql> SELECT id, numero_documento, 
              CHAR_LENGTH(archivo_pdf) as pdf_size,
              nombre_archivo_pdf
       FROM certificaciones_credito 
       WHERE id = 123;

+-----+-------------------+----------+--------------------------------------+
| id  | numero_documento  | pdf_size | nombre_archivo_pdf                   |
+-----+-------------------+----------+--------------------------------------+
| 123 | CC-2026-001       | 45000    | CertificacionCredito_2026.pdf        |
+-----+-------------------+----------+--------------------------------------+

✓ PDF guardado en BD: 45000 bytes
✓ Nombre guardado: CertificacionCredito_2026.pdf
```

---

## 🎬 Escena 6: Frontend Recarga Tabla

```javascript
// En cargarDatos():
const certRes = await api.obtenerCertificacionesCredito();
// Retorna:
[
  {
    id: 123,
    numero_documento: 'CC-2026-001',
    nota: 'N°001',
    mes: 'Marzo 2026',
    tiene_pdf: 1,  ← SI TIENE PDF
    nombre_archivo_pdf: 'CertificacionCredito_2026.pdf',
    // ... más campos ...
  }
]

// Estado se actualiza:
setCertificaciones([...])

// Tabla se renderiza con nueva fila:
```

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 Certificaciones de Crédito - Tabla                             │
├──────────────────────────────────────────────────────────────────┤
│ ID │ Documento    │ Nota │ Mes      │ Acciones                   │
├──────────────────────────────────────────────────────────────────┤
│ 123│ CC-2026-001  │ N°1  │ Mar 2026 │ ✏️ ➕ 👁️ ⬇️ 🗑️          │
│    │              │      │          │                           │
│    │ Botones:     │      │          │                           │
│    │  ✏️ = Editar │      │          │                           │
│    │  ➕ = Detalles│      │          │                           │
│    │  👁️ = Ver PDF ← HABILITADO (tiene_pdf = 1)                 │
│    │  ⬇️ = Descargar ← HABILITADO (tiene_pdf = 1)               │
│    │  🗑️ = Eliminar│      │          │                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 👁️ Escena 7: Usuario Click en "Ver PDF"

```
Usuario click en 👁️ (PictureAsPdfIcon)
        ↓
Frontend ejecuta: handleVerPdf(certificacion)
        ↓
Abre nueva ventana con:
┌─────────────────────────────────┐
│  📄 CC-2026-001                  │
│  Nota: N°001                     │
│  Mes: Marzo 2026                 │
├─────────────────────────────────┤
│                                  │
│  [     PDF EMBEBIDO      ]        │
│  [                       ]        │
│  [   [Página 1 de 1]    ]        │
│  [     (Scrolleable)     ]        │
│  [                       ]        │
│                                  │
└─────────────────────────────────┘
```

---

## ⬇️ Escena 8: Usuario Click en "Descargar PDF"

```
Usuario click en ⬇️ (FileDownloadIcon)
        ↓
Frontend ejecuta: handleDescargarPdf(certificacion)
        ↓
Convierte PDF (base64 → blob)
        ↓
Crea link de descarga
        ↓
Navega a: /api/pdf/descargar-certificacion/123
        ↓
Backend responde:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="CertificacionCredito_2026.pdf"
  [BINARY PDF DATA]
        ↓
Navegador descarga:
  📥 CertificacionCredito_2026.pdf (45.0 KB)
```

---

## ✅ Escena 9: Ciclo Completo

```
TIMELINE:
═════════════════════════════════════════════════════════════

0s    ✓ Usuario abre modal
      └─ PdfUploadDialog muestra input
      
5s    ✓ Usuario selecciona PDF
      └─ Muestra preview (400px embed)
      
10s   ✓ Usuario click "Procesar PDF"
      └─ Extrae datos (regex)
      └─ Muestra datos extraídos
      
15s   ✓ Usuario click "Aplicar Datos"
      └─ POST certificación → ID 123
      └─ POST PDF → guardar en BD
      └─ POST detalles (x5)
      └─ Recarga tabla
      
20s   ✓ Nueva fila aparece en tabla
      └─ Botones PDF HABILITADOS
      
25s   ✓ Usuario click Ver PDF
      └─ Abre ventana con visualización
      
30s   ✓ Usuario click Descargar PDF
      └─ Descarga archivo
      
═════════════════════════════════════════════════════════════
```

---

## 🔍 Checklist: ¿Funciona Todo?

```
✅ PASO A: Certificación crada
   └─ Verifica: SELECT id FROM certificaciones_credito ORDER BY id DESC

✅ PASO B: PDF guardado en BD
   └─ Verifica: SELECT archivo_pdf FROM certificaciones_credito WHERE id = 123

✅ PASO C: Detalles guardados
   └─ Verifica: SELECT COUNT(*) FROM detalles_certificacion_credito WHERE cert_id = 123

✅ PASO D: Tabla recargada
   └─ Verifica: Botones Ver/Descargar están HABILITADOS

✅ PASO E: Visualización funciona
   └─ Verifica: Click en 👁️ abre PDF en nueva ventana

✅ PASO F: Descarga funciona
   └─ Verifica: Click en ⬇️ descarga el archivo
```

---

## 🎯 Estado Esperado

```
┌────────────────────────────────────┐
│ ✅ FUNCIONAMIENTO ESPERADO         │
├────────────────────────────────────┤
│ • PDF se importa desde navegador   │
│ • Datos se extraen automáticamente │
│ • PDF se guarda en BD              │
│ • Tabla se recarga al instante     │
│ • Botones PDF se habilitan        │
│ • Ver PDF abre visualización       │
│ • Descargar PDF genera descarga    │
│                                    │
│ 🎉 TODO FUNCIONA CORRECTAMENTE    │
└────────────────────────────────────┘
```

---

**Versión:** 1.0  
**Tipo:** Documentación Visual  
**Fecha:** 2026-03-14
