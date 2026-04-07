# 📅 CAMBIO CRÍTICO: Usar `fecha_emision` en lugar de `creado_en`

## 📋 Resumen del Cambio

Se cambió todos los PDFs para usar **`fecha_emision`** en lugar de **`creado_en`** como fuente de fechas.

### ¿Por qué?

**`fecha_emision`** es enviado por el cliente con la zona horaria correcta de Perú/Lima:
```
"2026-03-23T16:00:52.802Z"  ← Usuario manda esto con zona horaria correcta
```

**`creado_en`** es generado por el servidor en su zona horaria local:
```
creado_en = new Date()  ← Puede tener zona horaria del servidor, no de Perú
```

---

## 🔧 Cambios Aplicados

### 1️⃣ Frontend: `EmisionFormatos.js`

Todas las fechas en PDFs ahora usan:

```javascript
// ❌ ANTES (incorrecto)
const fechaCreacion = formatoCompleto?.creado_en ? new Date(formatoCompleto.creado_en) : new Date();

// ✅ AHORA (correcto)
const fechaCreacion = formatoCompleto?.fecha_emision ? new Date(formatoCompleto.fecha_emision) : new Date();
```

**Ubicaciones actualizado:**
- Línea 1113: `generarFormatoComision()` - Fecha en footer
- Línea 1485: `generarAnexo02()` - Campo 12 "Lugar y fecha"
- Línea 1717: `generarAnexo01()` - Fecha en footer
- Línea 1987: `generarAnexo02()` - Fecha en footer
- Línea 2002: `verAnexoEnModal()` - Fecha en modal

### 2️⃣ Backend: No requiere cambios

El modelo `FormatoEmision.js` ya guarda `fecha_emision` en la BD cuando se crea el formato:

```javascript
// Línea 19 en FormatoEmision.js
fecha_emision,  // ✅ YA ESTÁ GUARDADO

// Línea 38: Se inserta en BD
INSERT INTO formato_emisiones (
  ...fecha_emision...  // ✅ Se guarda
)
```

---

## 📊 Comparativa

| Aspecto | `creado_en` | `fecha_emision` |
|---------|-----------|-----------------|
| **Generado por** | Servidor (al guardar) | Cliente (al crear) |
| **Zona horaria** | Zona del servidor | Zona del cliente (Perú) |
| **Confiabilidad** | ❌ Varía según servidor | ✅ Consistente con usuario |
| **Auditoría** | Cuándo se guardó | Cuándo el usuario emitió |
| **Propósito** | Control interno | Fecha oficial del documento |

---

## ✅ Validación

**Para verificar el cambio está funcionando:**

1. Abre DevTools (F12)
2. En la consola, ejecuta:
   ```javascript
   // Ver ambos campos (para comparar)
   console.log('fecha_emision:', formatoCompleto?.fecha_emision);
   console.log('creado_en:', formatoCompleto?.creado_en);
   ```

3. Genera un PDF y verifica que la fecha mostrada coincide con `fecha_emision`, no con `creado_en`

---

## 🚀 Impacto

- ✅ Fechas en PDFs ahora son consistentes con la zona horaria de Perú
- ✅ Horarios mostrados en reportes son exactos (no desviados por zona horaria del servidor)
- ✅ Documentación oficial usa la fecha que el usuario reportó (auditoría correcta)

---

## 📝 Notas Técnicas

**Por qué no eliminamos `creado_en` completamente:**
- Se mantiene en BD para auditoría interna (cuándo se guardó realmente)
- Puede ser útil para debugging si hay issues
- No afecta negativo en performance

---

**Documento creado:** [Sesión actual]
**Estado:** ✅ IMPLEMENTADO Y LISTO PARA TESTING
