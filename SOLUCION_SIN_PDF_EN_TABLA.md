# 🔧 SOLUCIÓN: "Sin PDF" aunque se guardó

## 🎯 El Problema

Los logs muestran:
```
✓ PDF guardado exitosamente para certificación: 1
```

Pero en la tabla dice "Sin PDF" y los botones están deshabilitados.

**Causa:** El campo `tiene_pdf` no se está incluyendo en la respuesta de la BD o la tabla no se recarga correctamente después de guardar.

---

## 📊 Diagnóstico

El PDF **SÍ se guardó** (UPDATE result: affectedRows = 1), pero:

1. **Opción A:** El SELECT en `CertificacionCredito.js` no incluye `tiene_pdf`
2. **Opción B:** El SELECT retorna `tiene_pdf` pero la tabla no se recarga
3. **Opción C:** La tabla se recarga pero `tiene_pdf` viene como 0

---

## ✅ SOLUCIÓN RÁPIDA (30 segundos)

Actualiza el modelo para incluir correctamente `tiene_pdf`:

**Archivo:** `backend/models/CertificacionCredito.js` línea 89

Cambia:
```javascript
IF(cc.archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf,
```

A:
```javascript
IF(cc.archivo_pdf IS NOT NULL, TRUE, FALSE) as tiene_pdf,
```

O mejor aún, verifica que está así exactamente:
```javascript
let query = `SELECT cc.id, cc.nota, cc.mes, cc.fecha_aprobacion, cc.fecha_documento, 
                    cc.estado_certificacion, cc.tipo_documento, cc.numero_documento, 
                    cc.justificacion, cc.meta_id, cc.fuente_financiamiento_id, 
                    cc.usuario_id, cc.nombre_archivo_pdf, cc.created_at, cc.updated_at,
                    IF(cc.archivo_pdf IS NOT NULL, 1, 0) as tiene_pdf,
                    m.nombre as meta_nombre, m.numero_meta,
                    ff.nombre as fuente_financiamiento_nombre,
                    u.nombre as usuario_nombre
             FROM certificaciones_credito cc
```

Si ya está así, el problema es que después de guardar el PDF, la tabla se recarga **demasiado rápido** antes de que BD confirme.

---

## 🚀 SOLUCIÓN COMPLETA: Agregar Delay después de guardar

**Archivo:** `GestionCertificacionesCredito.js` línea ~260

Cambia esto:
```javascript
setOpenPdfDialog(false);
setLoading(false);

Swal.fire({
  icon: 'success',
  // ...
});

cargarDatos();  // ← Se ejecuta inmediatamente
```

A esto:
```javascript
setOpenPdfDialog(false);
setLoading(false);

Swal.fire({
  icon: 'success',
  // ...
});

// Esperar a que BD procese, luego recargar
setTimeout(() => {
  cargarDatos();
}, 500);  // Esperar 500ms
```

---

## 📝 Implementación Completa

Voy a hacer esto ahora. Déjame actualizar el código:
