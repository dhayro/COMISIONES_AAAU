# 🎯 PLAN: Debuggear PDF No Guardado

## Paso 1: Verificar que BD tiene las columnas

```bash
mysql -h localhost -u root -p COMISIONES_AAAU -e "DESCRIBE certificaciones_credito;" | grep -E "archivo_pdf|nombre_archivo_pdf"
```

**Debe mostrar:**
```
archivo_pdf         | longblob    | YES
nombre_archivo_pdf  | varchar(255)| YES
```

Si **NO aparecen**, ejecuta:
```bash
cd backend/config
mysql -h localhost -u root -p COMISIONES_AAAU < migration-add-pdf-fields.sql
```

---

## Paso 2: Limpiar datos viejos (OPCIONAL)

```bash
mysql -h localhost -u root -p COMISIONES_AAAU
```

```sql
-- Ver cuántas certificaciones hay
SELECT COUNT(*) FROM certificaciones_credito;

-- Opcionalmente, eliminar las viejas (CUIDADO)
-- DELETE FROM detalles_certificacion_credito WHERE certificacion_credito_id > 0;
-- DELETE FROM certificaciones_credito WHERE id > 0;
```

---

## Paso 3: Iniciar Backend CON LOGGING

```bash
cd backend
npm start
```

**Observa que muestre:**
```
✓ Server running on port 5000
✓ Database connected
```

---

## Paso 4: En OTRA terminal, Iniciar Frontend

```bash
cd material-dashboard-react
npm start
```

**Espera a que compile y muestre:**
```
Compiled successfully!
```

---

## Paso 5: En el Navegador - F12 ABIERTO

1. Ve a: `http://localhost:3000`
2. Login
3. Presiona **F12**
4. Ve a **Console** tab
5. **BORRA todos los logs previos** (click derecha → Clear console)

---

## Paso 6: Importa PDF

### En navegador:
1. Ve a: **Gestión → Certificaciones de Crédito**
2. Click: **"Importar desde PDF"**
3. Selecciona un PDF pequeño (< 5 MB)
4. Espera a que cargue
5. Click: **"Procesar PDF"**
   - Verás extracción de datos ✓
6. Click: **"Aplicar Datos"**

### En Terminal (Backend), deberías ver:
```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: { fieldname: 'archivo', mimetype: 'application/pdf', size: 45000 }
UPDATE result: { affectedRows: 1 }
✓ PDF guardado exitosamente para certificación: 123
```

### En Consola (F12 - Console), deberías ver:
```
🔍 DEBUG PDF: {
  archivo: "documento.pdf",
  tipo: "application/pdf",
  tamaño: 45000,
  certificacion_id: 123
}
📤 Enviando PDF al backend...
📋 Response status: 200
✅ PDF guardado exitosamente: {success: true, message: "...", data: {...}}
```

---

## Paso 7: Verifica en BD

```bash
mysql -h localhost -u root -p COMISIONES_AAAU
```

```sql
-- Ver la última certificación creada
SELECT id, numero_documento, 
       IF(archivo_pdf IS NOT NULL, 'SÍ', 'NO') as tiene_pdf,
       CHAR_LENGTH(archivo_pdf) as pdf_size,
       nombre_archivo_pdf
FROM certificaciones_credito 
ORDER BY created_at DESC LIMIT 1;
```

**Esperado:**
```
id | 123
numero_documento | CC-2026-001
tiene_pdf | SÍ
pdf_size | 45000
nombre_archivo_pdf | documento.pdf
```

---

## ⚠️ SI ALGO FALLA

### Falla 1: Terminal Backend muestra ERROR
**Copia el error exacto y comparte:**
```
ERROR: ...
```

### Falla 2: Consola F12 muestra "❌ Error guardando PDF"
**Copia exactamente:**
```
❌ Error guardando PDF (HTTP 500): {success: false, error: "..."}
```

### Falla 3: No aparecen logs "🔍 DEBUG PDF:"
**Significa:** El archivo no se está pasando desde el modal
**Solución:** Verifica que en `PdfUploadDialog.js` línea ~115:
```javascript
onExtractedData({
  ...extractedData,
  archivo_pdf_original: file  // ← Debe existir
});
```

### Falla 4: BD muestra "tiene_pdf = NO"
**Significa:** El PDF se envió pero no se guardó en BD
**Revisar:** Los logs exactos del backend

### Falla 5: "ECONNREFUSED" en consola
**Significa:** Backend no está ejecutando
**Solución:**
```bash
cd backend
npm start
```

---

## 🎬 Flujo Visual Esperado

```
INICIO
  ↓
1. Usuario importa PDF desde modal
   ↓
   PdfUploadDialog obtiene: file object
   ↓
2. Click "Aplicar Datos"
   ↓
   Envía: onExtractedData({ ...datos, archivo_pdf_original: file })
   ↓
3. handleExtractedPdfData ejecuta:
   a) POST certificación → obtiene ID: 123
   b) POST PDF con FormData → obtiene respuesta JSON
   c) POST detalles (x5)
   d) cargarDatos()
   ↓
4. Tabla se recarga
   ↓
5. Nueva fila muestra botones PDF HABILITADOS
   ↓
   ✅ ÉXITO
```

---

## ✅ Verificación Final

Si todo funciona, verás:

- [ ] Backend no muestra errores
- [ ] Consola F12 muestra "✅ PDF guardado exitosamente"
- [ ] BD retorna "tiene_pdf = SÍ"
- [ ] Tabla tiene botones Ver/Descargar HABILITADOS
- [ ] Click en Ver PDF abre visualización
- [ ] Click en Descargar descarga archivo

---

## 📞 Si Aún No Funciona

Comparte exactamente:

1. **Output de Terminal Backend (último 20 líneas)**
2. **Output de Consola F12 (los logs azules/rojos)**
3. **Resultado de Query BD:**
   ```sql
   SELECT * FROM certificaciones_credito ORDER BY id DESC LIMIT 1;
   ```
4. **Tu versión de:**
   - Node.js: `node --version`
   - MySQL: `mysql --version`

---

**Hazlo ahora y dime qué ves exactamente.**
