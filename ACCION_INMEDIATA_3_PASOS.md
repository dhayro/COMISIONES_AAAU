# 🎯 ACCIÓN INMEDIATA: 3 Pasos para Encontrar el Problema

## ⚡ PASO 1: Abre 3 Cosas (1 min)

### Terminal 1: Backend
```bash
cd d:\COMISIONES_AAAU\backend
npm start
```
**Espera a ver:** `✓ Server running on port 5000`

---

### Terminal 2: Frontend (nueva terminal/cmd)
```bash
cd d:\COMISIONES_AAAU\material-dashboard-react
npm start
```
**Espera a ver:** `Compiled successfully!`

---

### Navegador: F12 Abierto
1. Ve a: `http://localhost:3000`
2. Login
3. **Presiona: F12**
4. Click en: **Console** tab
5. Click derecha → **Clear console** (borra logs viejos)

---

## 🔄 PASO 2: Importa un PDF (2 min)

### En el Navegador:
1. Ve a: **Gestión → Certificaciones de Crédito**
2. Click: **"Importar desde PDF"** (icono azul arriba)
3. Selecciona: Cualquier PDF que tengas
4. Click: **"Procesar PDF"** (botón en el modal)
   - Espera a que salga: "✓ PDF Procesado Exitosamente"
5. Click: **"Aplicar Datos"** (botón en el modal)

---

## 📺 PASO 3: Mira los Logs (1 min)

### En Terminal 1 (Backend):
Busca estas líneas:

```
=== GUARDAR PDF ===
Body: { certificacion_id: '123' }
File: { fieldname: 'archivo', mimetype: 'application/pdf', size: ... }
UPDATE result: { affectedRows: 1 }
✓ PDF guardado exitosamente para certificación: 123
```

**Si VES esto:** ✅ **ÉXITO - El PDF se guardó**

**Si NO VES esto:** ❌ **HAY ERROR**
- Copia todo lo que SÍ aparece
- Búscalo en el documento: **LOGS_ESPERADOS_QUE_VER.md**

---

### En Consola del Navegador (F12):
Busca estas líneas:

```
🔍 DEBUG PDF: {archivo: "...", tipo: "application/pdf", ...}
📤 Enviando PDF al backend...
📋 Response status: 200
✅ PDF guardado exitosamente: {success: true, ...}
```

**Si VES esto:** ✅ **ÉXITO - El frontend recibió confirmación**

**Si NO VES esto o ves "❌":** ❌ **HAY ERROR**
- Copia el error exacto
- Búscalo en: **DEBUG_PDF_NO_SE_GUARDA.md**

---

## 📊 ¿Qué Significa Cada Log?

| Log | Significa |
|-----|-----------|
| `🔍 DEBUG PDF:` | Frontend está enviando el archivo |
| `📤 Enviando PDF al backend...` | Frontend hizo la petición HTTP |
| `📋 Response status: 200` | Backend respondió OK |
| `✅ PDF guardado exitosamente` | PDF se guardó en BD |
| `=== GUARDAR PDF ===` | Backend recibió la petición |
| `File: { ... }` | Backend vio el archivo |
| `UPDATE result: { affectedRows: 1 }` | BD se actualizó (1 fila) |

---

## 🎯 Resultado Esperado

**Si TODO funciona:**

1. Terminal Backend: Ves "✓ PDF guardado exitosamente"
2. Consola F12: Ves "✅ PDF guardado exitosamente"
3. Modal muestra: "Importación Exitosa"
4. Tabla se recarga: Nueva fila aparece
5. Botones PDF en tabla: **HABILITADOS** (color naranja/gris)

---

## ⚠️ Si Algo Falla

**Opción A:** Algo en Terminal Backend
- Copia la línea de error
- Pega en: **DEBUG_PDF_NO_SE_GUARDA.md**
- Busca el síntoma exacto

**Opción B:** Algo en Consola F12
- Copia el error completo
- Pega en: **DEBUG_PDF_NO_SE_GUARDA.md**
- Busca la solución

**Opción C:** No ves ningún log
- Significa: Archivo no se envía desde modal
- Verifica: **LOGS_ESPERADOS_QUE_VER.md** - Escenario "ARCHIVO NO SE ENVÍA"

---

## 📞 Después de los 3 Pasos

Dime:
1. ¿Qué ves en Terminal Backend? (copiar últimas 10 líneas)
2. ¿Qué ves en Consola F12? (copiar todos los logs)
3. ¿Qué ves en la Tabla? (¿botones habilitados o no?)

---

## ✨ Tiempo Total: 5 Minutos

- 1 min: Abrir terminales
- 2 min: Importar PDF
- 1 min: Mirar logs
- 1 min: Reportar qué viste

**Total: 5 minutos para encontrar el problema exacto.**

---

**¡HAZLO AHORA Y CUÉNTAME QUÉ VES!**
