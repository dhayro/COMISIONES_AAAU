# 🔴 DEBUG: PDF No Se Guarda al Aplicar Datos

## ⚡ Solución Rápida (HAZLO AHORA)

### 1. Abre 3 Terminales

**Terminal 1: Backend**
```bash
cd d:\COMISIONES_AAAU\backend
npm start
```

**Terminal 2: Frontend**
```bash
cd d:\COMISIONES_AAAU\material-dashboard-react
npm start
```

**Terminal 3: MySQL (opcional, para verificar)**
```bash
mysql -h localhost -u root -p COMISIONES_AAAU
```

---

### 2. Abre Navegador con DevTools

1. Ve a: `http://localhost:3000`
2. Presiona: **F12** (DevTools)
3. Ve a: **Console** tab
4. **Deja la consola visible**

---

### 3. Importa un PDF

1. Ve a: **Gestión → Certificaciones de Crédito**
2. Click: **"Importar desde PDF"**
3. Selecciona cualquier PDF
4. Click: **"Procesar PDF"**
   - Debe mostrar datos extraídos ✓
5. Click: **"Aplicar Datos"**

---

### 4. Mira los Logs en Consola (F12)

**Busca logs como:**

#### ✅ SI FUNCIONA, verás:
```
🔍 DEBUG PDF: {archivo: "documento.pdf", tipo: "application/pdf", tamaño: 45000, certificacion_id: 123}
📤 Enviando PDF al backend...
📋 Response status: 200
✅ PDF guardado exitosamente: {success: true, message: "PDF guardado exitosamente", data: {...}}
```

#### ❌ SI HAY ERROR, verás algo como:
```
🔍 DEBUG PDF: {...}
📤 Enviando PDF al backend...
❌ Error guardando PDF (HTTP 500): {success: false, error: "..."}
```

O:
```
❌ Error en fetch PDF: ECONNREFUSED (significa que backend no responde)
```

---

### 5. Mira los Logs del Backend

En la **terminal del backend**, busca:

#### ✅ SI FUNCIONA:
```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: { fieldname: 'archivo', mimetype: 'application/pdf', size: 45000 }
UPDATE result: { affectedRows: 1 }
✓ PDF guardado exitosamente para certificación: 123
```

#### ❌ SI HAY ERROR:
```
ERROR: No se proporcionó archivo PDF
ERROR CRÍTICO al guardar PDF: ...
```

---

## 📊 Diagnosis por Síntoma

### Síntoma 1: "ECONNREFUSED" en consola
**Causa:** Backend no está ejecutando

**Solución:**
```bash
cd backend
npm start
# Ver que inicie sin errores
```

---

### Síntoma 2: "Error guardando PDF (HTTP 404)"
**Causa:** Ruta no existe o está mal configurada

**Solución:**
1. Verificar que archivo `backend/routes/pdf.js` existe
2. Verificar que tiene la ruta:
   ```javascript
   router.post('/guardar-certificacion-pdf', ...)
   ```

---

### Síntoma 3: "Error guardando PDF (HTTP 500)"
**Causa:** Error en backend (ver logs de backend)

**Solución:**
1. Mirar Terminal 1 (backend)
2. Buscar "ERROR"
3. Copiar mensaje de error exacto

---

### Síntoma 4: No aparece "🔍 DEBUG PDF:" en consola
**Causa:** `archivo_pdf_original` es null/undefined

**Solución:**
Verificar que en `PdfUploadDialog.js`:
```javascript
onExtractedData({
  ...extractedData,
  archivo_pdf_original: file  // ← Must be included
});
```

---

## 🧪 Test Manual de API

Si quieres probar directamente sin frontend:

```bash
# 1. Obtén un token (login en el navegador, cópialo de localStorage)
# 2. Obtén un PDF de prueba
# 3. Ejecuta esto:

curl -X POST http://localhost:5000/api/pdf/guardar-certificacion-pdf \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -F "archivo=@documento.pdf" \
  -F "certificacion_id=123"
```

**Esperado:**
```json
{
  "success": true,
  "message": "PDF guardado exitosamente",
  "data": {
    "certificacion_id": 123,
    "archivo_nombre": "documento.pdf",
    "archivo_tamaño": 45000
  }
}
```

---

## 🐛 Checklist Detallado

- [ ] Terminal 1: Backend ejecutándose (`npm start`)
- [ ] Terminal 2: Frontend ejecutándose (`npm start`)
- [ ] F12 abierto, Console visible
- [ ] Importé PDF correctamente
- [ ] Click "Procesar PDF" extrajo datos
- [ ] Veo "🔍 DEBUG PDF:" en consola
- [ ] Veo "📤 Enviando PDF al backend..." en consola
- [ ] Veo "Response status: 200" en consola
- [ ] Veo "✅ PDF guardado exitosamente" en consola
- [ ] En Terminal 1, veo "✓ PDF guardado exitosamente para certificación:"

---

## 📝 Información que Necesito

Si aún no funciona, por favor comparte:

1. **Output completo de Terminal 1 (Backend)** cuando importas PDF
   - Copiar todo lo que aparece
   
2. **Output completo de Console (F12)** cuando importas PDF
   - Copiar todos los logs
   
3. **Qué error exacto ves**
   - Copiar el mensaje completo
   
4. **Query de BD:**
   ```sql
   SELECT COUNT(*) FROM certificaciones_credito;
   SELECT id, numero_documento, archivo_pdf, nombre_archivo_pdf 
   FROM certificaciones_credito 
   ORDER BY id DESC LIMIT 1;
   ```

---

## ✨ Resumen

| Paso | Qué Esperar | Si Falla |
|------|------------|----------|
| Backend start | "Puerto 5000" | ECONNREFUSED |
| Frontend start | "Puerto 3000" | Error de deps |
| Importar PDF | Datos extraídos | Network error |
| Aplicar datos | Debug logs | Ver consola F12 |
| Backend logs | "✓ PDF guardado" | Ver logs exactos |
| BD | `archivo_pdf NOT NULL` | Ver SQL query |

---

**Haz esto ahora y dime qué ves exactamente en los logs.**
