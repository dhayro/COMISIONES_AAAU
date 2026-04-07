# 🔍 VERIFICACIÓN RÁPIDA: Por Qué No Se Guarda el PDF

## 📋 Ejecuta Esto en Orden

### PASO 1: Verifica que las Columnas Existen
```bash
mysql -h localhost -u root -p COMISIONES_AAAU -e "DESCRIBE certificaciones_credito;" | grep -E "archivo_pdf|nombre_archivo_pdf"
```

**Debería mostrar:**
```
archivo_pdf         | longblob    | YES
nombre_archivo_pdf  | varchar(255)| YES
```

❌ **Si NO aparecen:**
```bash
cd backend/config
mysql -h localhost -u root -p COMISIONES_AAAU < migration-add-pdf-fields.sql
```

---

### PASO 2: Verifica que Backend Está Ejecutando
```bash
cd backend
npm start
```

**Debería mostrar:**
```
✓ Servidor corriendo en puerto 5000
✓ Base de datos conectada
```

**Abre otra terminal y continúa...**

---

### PASO 3: Importa un PDF e Imprime los Logs

1. En el navegador, ve a: **Gestión → Certificaciones de Crédito**
2. Click: **"Importar desde PDF"**
3. Selecciona un PDF
4. Click: **"Procesar PDF"**
5. Click: **"Aplicar Datos"**

**En la terminal del backend, busca algo como:**
```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: { fieldname: 'archivo', mimetype: 'application/pdf', size: 45000 }
UPDATE result: { affectedRows: 1 }
✓ PDF guardado exitosamente para certificación: 123
```

**Si ves algún error, cópialo exactamente aquí → [mensaje de error]**

---

### PASO 4: Verifica en la Base de Datos
```bash
mysql -h localhost -u root -p COMISIONES_AAAU
```

```sql
SELECT id, numero_documento, 
       IF(archivo_pdf IS NOT NULL, 'SÍ', 'NO') as tiene_pdf,
       nombre_archivo_pdf
FROM certificaciones_credito 
ORDER BY created_at DESC LIMIT 1;
```

**Debería mostrar:**
```
id | 123
numero_documento | CC-2026-001
tiene_pdf | SÍ
nombre_archivo_pdf | documento.pdf
```

**Si `tiene_pdf` es "NO":**
- El PDF no se guardó en BD
- Ver logs del backend (PASO 3)

---

### PASO 5: Abre el Navegador F12 (Developer Tools)

1. Click F12
2. Ve a **Console**
3. Importa otro PDF
4. Busca logs como:
   ```
   PDF guardado exitosamente: { ... }
   ```
   O errores como:
   ```
   Error guardando PDF: ...
   ```

5. Si hay error, cópialo exactamente

---

### PASO 6: Verifica Network (Peticiones HTTP)

1. Click F12 → **Network**
2. Importa otro PDF
3. Completa el flujo
4. Busca una petición POST a: `guardar-certificacion-pdf`
5. Click en ella
6. Ve a **Response** tab
7. Debería mostrar:
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

**Si hay error:**
```json
{
  "success": false,
  "error": "...",
  "recibido": { ... }
}
```

---

## 🎯 Escenarios Comunes

### Escenario A: "Certificación no encontrada"
```
Error: Certificación no encontrada
certificacion_id: 123
```

**Causa:** El PDF se intenta guardar pero esa certificación no existe

**Solución:**
```javascript
// En GestionCertificacionesCredito.js línea ~175
console.log('Certificación ID:', certificacionId);  // Ver qué ID se obtiene
```

---

### Escenario B: "No se proporcionó archivo PDF"
```
Error: No se proporcionó archivo PDF
recibido: { certificacion_id: '123', file: null }
```

**Causa:** El archivo no se está enviando en FormData

**Solución:**
```javascript
// En GestionCertificacionesCredito.js línea ~175
console.log('Archivo original:', extractedData.archivo_pdf_original);
console.log('Tipo:', extractedData.archivo_pdf_original?.type);
// Debe ser un File object, no null
```

---

### Escenario C: "Error al guardar PDF: ..."
```
Error: Error al guardar PDF: ECONNREFUSED
```

**Causa:** Backend no está ejecutando o puerto 5000 no accesible

**Solución:**
```bash
cd backend
npm start
# Ver que inicie sin errores
```

---

### Escenario D: Botones deshabilitados aunque hay PDF
**Causa:** `tiene_pdf` no se calcula en SELECT

**Solución:**
```bash
cd backend
# Verificar que el modelo tenga:
# IF(cc.archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf
grep -n "tiene_pdf" models/CertificacionCredito.js
# Debe mostrar una línea
```

---

## 📊 Información para Soporte

Si aún no funciona, envía:

1. **Output de terminal backend:**
   ```bash
   npm start
   # [importar PDF]
   # [copiar output completo]
   ```

2. **Output de Network (F12):**
   - POST `guardar-certificacion-pdf`
   - Request Headers
   - Request Body
   - Response

3. **Query BD:**
   ```sql
   SELECT id, numero_documento, archivo_pdf, nombre_archivo_pdf 
   FROM certificaciones_credito 
   ORDER BY id DESC LIMIT 1;
   ```

4. **Versiones:**
   ```bash
   node --version
   npm --version
   mysql --version
   ```

---

## ⚡ Referencia Rápida

| Componente | Verificar | Comando |
|-----------|-----------|---------|
| BD | Columnas PDF | `DESCRIBE certificaciones_credito \| grep pdf` |
| Backend | Ejecutando | `npm start` |
| Backend | Logs | Ver consola terminal |
| Frontend | Console | F12 → Console |
| Frontend | Network | F12 → Network |
| Frontend | Request | Network → POST guardar-pdf → Request |
| Frontend | Response | Network → POST guardar-pdf → Response |
| BD | Verificar guardado | `SELECT archivo_pdf FROM certificaciones_credito` |

---

**¡Completado! Ahora sabes dónde está el problema.**
