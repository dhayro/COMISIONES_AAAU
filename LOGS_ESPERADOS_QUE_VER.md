# 📺 Logs Esperados: Qué Deberías Ver

## ✅ Escenario: TODO FUNCIONA CORRECTAMENTE

### En Terminal 1 (Backend - npm start)

Cuando haces click en "Aplicar Datos", deberías ver:

```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: {
  fieldname: 'archivo',
  originalname: 'CertificacionCredito_2026.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 45000
}
→ Ejecutando UPDATE certificaciones_credito
  SET archivo_pdf = ?, nombre_archivo_pdf = ? WHERE id = 123

UPDATE result: { affectedRows: 1 }

✓ PDF guardado exitosamente para certificación: 123
```

---

### En Consola del Navegador (F12 → Console)

Cuando haces click en "Aplicar Datos", deberías ver:

```
🔍 DEBUG PDF: {
  archivo: "CertificacionCredito_2026.pdf",
  tipo: "application/pdf",
  tamaño: 45000,
  certificacion_id: 123
}

📤 Enviando PDF al backend...

📋 Response status: 200

✅ PDF guardado exitosamente: {
  success: true,
  message: "PDF guardado exitosamente",
  data: {
    certificacion_id: 123,
    archivo_nombre: "CertificacionCredito_2026.pdf",
    archivo_tamaño: 45000
  }
}

Importación Exitosa modal aparece con:
- Certificación creada: CC-2026-001
- Nota Nº: N°001
- Monto Total: S/. 20,540.00
- Detalles guardados: 5 items
```

---

### En Base de Datos (MySQL)

```bash
mysql> SELECT id, numero_documento, 
              IF(archivo_pdf IS NOT NULL, 'SÍ', 'NO') as tiene_pdf,
              CHAR_LENGTH(archivo_pdf) as pdf_bytes,
              nombre_archivo_pdf
       FROM certificaciones_credito 
       WHERE id = 123;

+-----+-------------------+----------+----------+--------------------------------------+
| id  | numero_documento  | tiene_pdf| pdf_bytes| nombre_archivo_pdf                   |
+-----+-------------------+----------+----------+--------------------------------------+
| 123 | CC-2026-001       | SÍ       | 45000    | CertificacionCredito_2026.pdf        |
+-----+-------------------+----------+----------+--------------------------------------+
```

---

### En la Tabla (Navegador)

Nueva fila aparece con:

```
ID  │ Documento    │ Nota │ Mes      │ Botones
────┼──────────────┼──────┼──────────┼─────────────────────
123 │ CC-2026-001  │ N°1  │ Mar 2026 │ ✏️ ➕ 👁️ ⬇️ 🗑️
                                         ↑   ↑
                                      HABILITADOS
```

Los botones 👁️ (Ver PDF) y ⬇️ (Descargar) están **COLOR NARANJA/GRIS** (habilitados).

---

## ❌ Escenario: ERROR EN BACKEND

Si hay error en el backend, en Terminal 1 verías:

```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: { fieldname: 'archivo', mimetype: 'application/pdf', size: 45000 }

❌ ERROR: Certificación no encontrada
certificacion_id: 123

ERROR CRÍTICO al guardar PDF: ...
```

---

## ❌ Escenario: ARCHIVO NO SE ENVÍA

Si el archivo no se envía desde frontend, en Terminal 1 verías:

```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: NO FILE

❌ ERROR: No se proporcionó archivo PDF
recibido: { certificacion_id: '123', file: null }
```

Y en Consola F12 verías:

```
⚠️ No hay archivo PDF para guardar
```

---

## ❌ Escenario: BACKEND NO RESPONDE

Si backend no está ejecutando, en Consola F12 verías:

```
❌ Error en fetch PDF: Failed to fetch (or ECONNREFUSED)
```

---

## ❌ Escenario: ERROR HTTP 500

Si hay error en backend, en Consola F12 verías:

```
📤 Enviando PDF al backend...
📋 Response status: 500
❌ Error guardando PDF (HTTP 500): {
  success: false,
  error: "Error al guardar PDF: ...",
  stack: "..."
}
```

---

## 🎬 Comparativa: Antes vs Después

### ANTES (Sin debugging)
```
User importa PDF...
      ↓
[Silencio completo]
      ↓
❓ ¿Se guardó? No se sabe
❓ ¿Dónde está el error? No se ve
❓ ¿Qué pasó en backend? Misterio
```

### DESPUÉS (Con debugging)
```
User importa PDF...
      ↓
Console F12 muestra: 🔍 DEBUG PDF, 📤 Enviando, 📋 Response status, ✅ Éxito/❌ Error
      ↓
Terminal Backend muestra: === GUARDAR PDF ===, Body, File, UPDATE result, ✓ Completado
      ↓
BD muestra: archivo_pdf NOT NULL con datos
```

---

## 📋 Checklist: Qué Verificar

| Dónde | Qué Buscar | Esperado |
|-------|-----------|----------|
| Terminal Backend | "=== GUARDAR PDF ===" | Presente |
| Terminal Backend | "UPDATE result: { affectedRows: 1 }" | Presente |
| Terminal Backend | "✓ PDF guardado exitosamente" | Presente |
| Consola F12 | "🔍 DEBUG PDF:" | Presente |
| Consola F12 | "📤 Enviando PDF al backend..." | Presente |
| Consola F12 | "✅ PDF guardado exitosamente" | Presente |
| Base de Datos | `archivo_pdf NOT NULL` | SÍ |
| Base de Datos | `nombre_archivo_pdf = "..."` | PDF name |
| Tabla HTML | Botones 👁️ ⬇️ | HABILITADOS |

---

## 🚀 Flujo Completo Exitoso

```
INICIO
   ↓
User: Importar PDF
   ↓
Modal: PdfUploadDialog abre
   ↓
User: Selecciona archivo
   ↓
User: Click "Procesar PDF"
   Console F12: ✓ PDF Procesado
   ↓
User: Click "Aplicar Datos"
   ↓
   Console F12:
   🔍 DEBUG PDF: {...}
   📤 Enviando PDF al backend...
   📋 Response status: 200
   ✅ PDF guardado exitosamente: {...}
   ↓
   Terminal Backend:
   === GUARDAR PDF ===
   UPDATE result: { affectedRows: 1 }
   ✓ PDF guardado exitosamente para certificación: 123
   ↓
   BD: INSERT certificación con id=123
   BD: UPDATE certificación con archivo_pdf, nombre_archivo_pdf
   BD: INSERT detalles (x5)
   ↓
Tabla se recarga
   ↓
Nueva fila aparece con botones PDF HABILITADOS
   ↓
User: Click botón 👁️ Ver PDF
   ↓
Nueva ventana se abre con visualización
   ↓
User: Click botón ⬇️ Descargar
   ↓
Archivo se descarga
   ↓
   ✅ ÉXITO COMPLETO
```

---

**Ahora sabes exactamente qué debería verse. Verifica cada paso.**
