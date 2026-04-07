# 🔍 Diagnóstico: PDF No Se Guarda

## Estado Actual
El PDF no se está guardando en la base de datos cuando se importa desde el modal.

## Checklist de Verificación

### 1. ✅ Base de Datos
```bash
# Verificar que las columnas existen
mysql -h localhost -u root -p COMISIONES_AAAU
```

```sql
-- Ejecutar en MySQL
DESCRIBE certificaciones_credito;
```

**Debe mostrar:**
- ✅ `archivo_pdf` (LONGBLOB)
- ✅ `nombre_archivo_pdf` (VARCHAR 255)

Si **NO** aparecen, ejecutar:
```bash
cd backend/config
mysql -h localhost -u root -p COMISIONES_AAAU < migration-add-pdf-fields.sql
```

---

### 2. ✅ Backend Ejecutándose
```bash
cd backend
npm start
```

**Verificar en consola:**
- ✓ Puerto 5000 abierto
- ✓ Base de datos conectada
- ✓ Rutas registradas

---

### 3. ✅ Frontend Conectado
```bash
cd material-dashboard-react
npm start
```

**Verificar en navegador:**
- Abre el devtools: **F12**
- Ve a **Console** (Consola)
- Ve a **Network** (Red)

---

### 4. 🔴 PRUEBA PASO A PASO

#### Paso 1: Importar PDF
1. Ve a: **Gestión → Certificaciones de Crédito**
2. Click en botón **"Importar desde PDF"**
3. Selecciona un PDF
4. Click en **"Procesar PDF"**
   - Debe extraer los datos ✓
5. Click en **"Aplicar Datos"**
   - Debe guardar certificación ✓

#### Paso 2: Revisar Consola (F12)
En **Console**, busca logs como:
```
✓ PDF guardado exitosamente: ...
```

O errores como:
```
Error guardando PDF: ...
```

#### Paso 3: Revisar Network
1. Abre **Network** tab
2. Repite el proceso
3. Busca la petición POST a: `guardar-certificacion-pdf`
4. Click en esa petición
5. Mira la **Response**:
   - **Si es exitosa:** `{ success: true, ... }`
   - **Si hay error:** `{ success: false, error: "..." }`

---

## 🐛 Problemas Comunes

### Problema 1: Archivo no se envía
**Síntoma:** En Network, el request no tiene body con archivo
**Solución:** Verificar que FormData se está creando correctamente

```javascript
// ✓ CORRECTO
const pdfFormData = new FormData();
pdfFormData.append('archivo', file);  // File object
pdfFormData.append('certificacion_id', 123);  // String o número
```

### Problema 2: "Certificación no encontrada"
**Síntoma:** Response: `{ success: false, error: "Certificación no encontrada" }`
**Solución:** La certificación se está creando pero con ID incorrecto
- Verificar que `certificacionId` es un número válido
- Verificar que la certificación se creó antes del PDF

### Problema 3: "No se proporcionó archivo PDF"
**Síntoma:** Response: `{ success: false, error: "No se proporcionó archivo PDF" }`
**Solución:** Multer no está recibiendo el archivo
- Verificar el nombre del campo: debe ser `archivo` (no `file`)
- Verificar en Network que el Content-Type sea `multipart/form-data`

### Problema 4: "Error al guardar PDF: ..."
**Síntoma:** Error 500 en response
**Solución:** Ver el mensaje de error completo en console del backend
- Ejecutar backend en terminal
- Ver los logs de error

---

## 📊 Verificar en BD Directamente

```sql
-- Conectarse a MySQL
mysql -h localhost -u root -p COMISIONES_AAAU

-- Ver si la certificación se creó
SELECT id, numero_documento, archivo_pdf, nombre_archivo_pdf 
FROM certificaciones_credito 
ORDER BY created_at DESC LIMIT 1;
```

**Resultados esperados:**
- ✅ `id`: número (ej: 123)
- ✅ `numero_documento`: el que importaste
- ✅ `archivo_pdf`: **NO NULL** (contiene datos binarios)
- ✅ `nombre_archivo_pdf`: nombre del archivo PDF

**Si `archivo_pdf` es NULL:**
- El PDF no se está guardando ❌
- Ver logs del backend para el error

---

## 🚀 Pasos Rápidos de Depuración

### Opción A: Ver logs del backend (RECOMENDADO)
```bash
cd backend
npm start
```
- Importar PDF
- Ver qué imprime en la consola del backend
- Copiar el error exacto

### Opción B: Ver Network en navegador
1. F12 → Network
2. Importar PDF
3. Buscar petición `guardar-certificacion-pdf`
4. Ver respuesta exacta

### Opción C: Probar API manualmente
```bash
# Necesitas:
# 1. authToken (de localStorage en navegador)
# 2. certificacion_id (del último importado)
# 3. Un archivo PDF

curl -X POST http://localhost:5000/api/pdf/guardar-certificacion-pdf \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "archivo=@/ruta/al/archivo.pdf" \
  -F "certificacion_id=123"
```

---

## 📝 Información que Necesito

Si aún no funciona, por favor comparte:

1. **Error exacto de consola del backend**
2. **Response de Network (F12 → Network)**
3. **Query result de BD** (última certificación)
4. **Versión de Node.js** (`node --version`)
5. **Versión de MySQL** (`mysql --version`)

---

## ✅ Checklist Final

- [ ] Base de datos actualizada con columnas PDF
- [ ] Backend ejecutándose (puerto 5000)
- [ ] Frontend ejecutándose (puerto 3000)
- [ ] Console del backend muestra logs
- [ ] Network muestra respuesta 200
- [ ] BD muestra archivo_pdf NO NULL
- [ ] Botones Ver/Descargar PDF funcionan

---

**Actualizado:** 2026-03-14
