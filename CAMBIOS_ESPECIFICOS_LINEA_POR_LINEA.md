# 📝 CAMBIOS ESPECÍFICOS - Línea por Línea

**Versión:** Detalle Técnico Completo  
**Fecha:** 31-03-2026  
**Propósito:** Referencia exacta de qué se modificó

---

## 📁 ARCHIVO 1: GestionCertificacionesFormatos.js

### Localización
```
d:\[ruta-proyecto]\frontend\src\views\Comisiones\GestionCertificacionesFormatos.js
```

---

## ✏️ CAMBIO 1.1: Agregar Columna Monto

**Ubicación:** Aproximadamente línea **350**  
**Tipo:** AGREGAR nueva columna a array de columnas

**QUÉ SE AGREGÓ:**
```javascript
{
  field: 'monto',
  headerName: 'Monto',
  width: 120,
  align: 'right',
  headerAlign: 'right',
  renderCell: (params) => {
    const monto = params.row.monto || 0;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }
}
```

**DÓNDE BUSCAR:**
- En la tabla (DataGrid o similar)
- Entre columnas de "Certificación" y "Acciones"
- O al final del array de columnas

**VERIFICACIÓN:**
```bash
grep -n "field: 'monto'" GestionCertificacionesFormatos.js
# DEBE mostrar: 350:[línea]
```

---

## ✏️ CAMBIO 1.2: Reescribir validarCambiosCertificacion()

**Ubicación:** Aproximadamente líneas **168-220**  
**Tipo:** REEMPLAZAR función completa

**ANTES (Original):**
```javascript
const validarCambiosCertificacion = () => {
  if (selectedFormato.certificacion_id !== formData.certificacion_id) {
    // Solo validaba cambio de certificación
  }
  return true;
}
```

**DESPUÉS (Nuevo):**
```javascript
const validarCambiosCertificacion = () => {
  const cambioMeta = selectedFormato.meta_id !== formData.meta_id;
  const cambioCertificacion = selectedFormato.certificacion_id !== formData.certificacion_id;
  
  // Cuando AMBOS cambian
  if (cambioMeta && cambioCertificacion) {
    const nuevaCertificacion = certificaciones.find(
      c => c.id === formData.certificacion_id
    );
    
    if (!nuevaCertificacion) {
      Swal.fire({
        title: '❌ Error',
        html: 'Certificación no encontrada',
        icon: 'error'
      });
      return false;
    }
    
    if (nuevaCertificacion.meta_id !== formData.meta_id) {
      Swal.fire({
        title: '❌ Certificación Inválida',
        html: `
          La certificación seleccionada NO pertenece a la meta seleccionada.<br>
          <strong>Nueva Meta:</strong> ${formData.meta_id}<br>
          <strong>Certificación Meta:</strong> ${nuevaCertificacion.meta_id}
        `,
        icon: 'error'
      });
      return false;
    }
  }
  
  return true;
}
```

**VERIFICACIÓN:**
```bash
grep -n "cambioMeta\|cambioCertificacion" GestionCertificacionesFormatos.js
# DEBE encontrar ambas variables
```

---

## 📁 ARCHIVO 2: EmisionFormatos.js

### Localización
```
d:\[ruta-proyecto]\frontend\src\views\Comisiones\EmisionFormatos.js
```

---

## ✏️ CAMBIO 2.1: Agregar Columna CCP con Badge

**Ubicación:** Aproximadamente línea **2240**  
**Tipo:** AGREGAR nueva columna a array de columnas

**QUÉ SE AGREGÓ:**
```javascript
{
  field: 'certificacion',
  headerName: 'Certificación',
  width: 150,
  renderCell: (params) => {
    if (params.row.certificacion_id) {
      return (
        <Chip 
          label={`CCP: ${params.row.certificacion_numero}`}
          color="primary"
          size="small"
        />
      );
    }
    return (
      <Chip 
        label="Sin certificación"
        color="warning"
        size="small"
        variant="outlined"
      />
    );
  }
}
```

**DÓNDE BUSCAR:**
- En la tabla (DataGrid)
- Entre otras columnas de formato
- Antes de columnas de acciones (Edit, Delete)

**VERIFICACIÓN:**
```bash
grep -n "CCP:" EmisionFormatos.js
# DEBE encontrar la columna
```

---

## 📁 ARCHIVO 3: formatoEmisionController.js (Backend)

### Localización
```
d:\[ruta-proyecto]\backend\src\controllers\formatoEmisionController.js
```

---

## ✏️ CAMBIO 3.1: Agregar meta_id a SELECT

**Ubicación:** Aproximadamente línea **258**  
**Tipo:** MODIFICAR consulta SELECT

**ANTES:**
```javascript
const query = `SELECT certificacion_id FROM formato_emisiones WHERE id = ?`;
const result = await query(query, [id]);
```

**DESPUÉS:**
```javascript
const query = `SELECT certificacion_id, meta_id FROM formato_emisiones WHERE id = ?`;
const result = await query(query, [id]);
```

**CAMBIO ESPECÍFICO:**
```
SELECT certificacion_id FROM
       ↓
SELECT certificacion_id, meta_id FROM
```

---

## ✏️ CAMBIO 3.2: Detectar Cambio de Meta

**Ubicación:** Aproximadamente líneas **260-310**  
**Tipo:** AGREGAR código de detección

**QUÉ SE AGREGÓ después del SELECT anterior:**
```javascript
const certificacion_anterior = formatoAntiguo.certificacion_id;
const certificacion_nueva = req.body.certificacion_id;
const meta_anterior = formatoAntiguo.meta_id;
const meta_nueva = req.body.meta_id;

const cambioMeta = meta_anterior !== meta_nueva;
const cambioCertificacion = certificacion_anterior !== certificacion_nueva;

if (cambioCertificacion) {
  console.log(`🔄 Cambio de certificación: ${certificacion_anterior} → ${certificacion_nueva}`);
}

if (cambioMeta) {
  console.log(`🔄 Cambio de meta: ${meta_anterior} → ${meta_nueva}`);
}
```

---

## ✏️ CAMBIO 3.3: NUEVO BLOQUE - Validación Cambio Múltiple

**Ubicación:** Aproximadamente líneas **315-415**  
**Tipo:** AGREGAR nuevo bloque condicional

**QUÉ SE AGREGÓ (BLOQUE COMPLETO DE ~100 líneas):**

```javascript
// ============================================
// NUEVO: Validar cuando AMBOS meta Y certificación cambian
// ============================================

if (cambioMeta && cambioCertificacion) {
  console.log(`🔄🔄 CAMBIO MÚLTIPLE: Meta Y Certificación`);
  
  // 1. Verificar que certificación nueva pertenece a meta nueva
  const certEnNuevaMeta = await query(
    `SELECT id, meta_id FROM certificaciones_credito 
     WHERE id = ? AND meta_id = ?`,
    [certificacion_nueva, meta_nueva]
  );
  
  if (!certEnNuevaMeta || certEnNuevaMeta.length === 0) {
    throw new Error(
      `❌ ERROR: Certificación ${certificacion_nueva} no pertenece a meta ${meta_nueva}`
    );
  }
  
  console.log(`✅ Validación OK: Certificación ${certificacion_nueva} pertenece a meta ${meta_nueva}`);
  
  // 2. Restar montos de certificación anterior
  const detallesFormato = await query(
    `SELECT * FROM formato_emisiones_detalles WHERE formato_emision_id = ?`,
    [id]
  );
  
  if (detallesFormato && detallesFormato.length > 0) {
    let montoTotalRestar = 0;
    
    for (const detalle of detallesFormato) {
      montoTotalRestar += parseFloat(detalle.monto) || 0;
    }
    
    if (montoTotalRestar > 0) {
      await query(
        `UPDATE certificaciones_credito 
         SET monto_utilizado = monto_utilizado - ? 
         WHERE id = ?`,
        [montoTotalRestar, certificacion_anterior]
      );
      
      console.log(`✅ Monto restado de certificación anterior: -S/. ${montoTotalRestar.toFixed(2)}`);
    }
  }
  
  // 3. Mapear clasificadores y sumar a nueva certificación
  for (const detalle of detallesFormato) {
    // Encontrar detalle certificación en nueva cert con mismo clasificador
    const nuevoDetalleCert = await query(
      `SELECT id FROM detalles_certificacion_credito 
       WHERE certificacion_credito_id = ? AND clasificador_id = ?`,
      [certificacion_nueva, detalle.clasificador_id]
    );
    
    if (nuevoDetalleCert && nuevoDetalleCert.length > 0) {
      await query(
        `UPDATE formato_emisiones_detalles 
         SET detalles_certificacion_credito_id = ? 
         WHERE id = ?`,
        [nuevoDetalleCert[0].id, detalle.id]
      );
    }
  }
  
  // 4. Sumar montos a nueva certificación
  const montoTotalSumar = detallesFormato.reduce(
    (sum, d) => sum + (parseFloat(d.monto) || 0), 0
  );
  
  if (montoTotalSumar > 0) {
    await query(
      `UPDATE certificaciones_credito 
       SET monto_utilizado = monto_utilizado + ? 
       WHERE id = ?`,
      [montoTotalSumar, certificacion_nueva]
    );
    
    console.log(`✅ Monto sumado a nueva certificación: +S/. ${montoTotalSumar.toFixed(2)}`);
  }
  
  console.log(`✅ Cambio múltiple completado exitosamente`);
}

// ============================================
// FIN: Validación cambio múltiple
// ============================================
```

**UBICACIÓN EXACTA:**
- Después de línea ~310 (después de la lógica de cambio simple)
- Antes de la actualización final del formato_emisiones

---

## 🔍 Resumen de Cambios por Archivo

### GestionCertificacionesFormatos.js
- **Línea ~350:** Agregar columna Monto (NEW)
- **Líneas ~168-220:** Reescribir validarCambiosCertificacion() (MODIFY)

### EmisionFormatos.js
- **Línea ~2240:** Agregar columna CCP (NEW)

### formatoEmisionController.js
- **Línea ~258:** Modificar SELECT agregar meta_id (MODIFY)
- **Líneas ~260-310:** Agregar variables de detección (NEW)
- **Líneas ~315-415:** Agregar bloque validación múltiple (NEW)

---

## 📊 Estadísticas de Cambios

| Archivo | Tipo | Líneas | Cambio |
|---------|------|--------|--------|
| GestionCertificacionesFormatos.js | ADD | ~350 | Columna Monto |
| GestionCertificacionesFormatos.js | MOD | ~168-220 | Validación dual |
| EmisionFormatos.js | ADD | ~2240 | Columna CCP |
| formatoEmisionController.js | MOD | ~258 | SELECT meta_id |
| formatoEmisionController.js | ADD | ~260-310 | Detección cambios |
| formatoEmisionController.js | ADD | ~315-415 | Validación múltiple |

**Total:** 3 archivos tocados, ~6 cambios

---

## 🔎 Cómo Verificar Los Cambios

### Opción 1: Grep (Búsquedas Rápidas)

```bash
# Verificar Columna Monto
grep -n "field: 'monto'" GestionCertificacionesFormatos.js

# Verificar Columna CCP
grep -n "CCP:" EmisionFormatos.js

# Verificar Detección Meta
grep -n "meta_anterior\|meta_nueva" formatoEmisionController.js

# Verificar Bloque Múltiple
grep -n "CAMBIO MÚLTIPLE" formatoEmisionController.js
```

### Opción 2: Git Diff (Si usas Git)

```bash
# Ver cambios del archivo
git diff GestionCertificacionesFormatos.js
git diff EmisionFormatos.js
git diff formatoEmisionController.js

# O ver resumen
git status
```

### Opción 3: Búsqueda Manual en VS Code

```
Ctrl+F (buscar)
- "field: 'monto'" 
- "CCP:"
- "CAMBIO MÚLTIPLE"
- "cambioMeta"
```

---

## ✅ Verificación Post-Cambio

Después de actualizar archivos, verificar:

```bash
# 1. Archivos compilan sin errores
npm run build  # Frontend
npm run build  # Backend (si es TypeScript)

# 2. Tests pasan (si los hay)
npm test

# 3. Linter está happy
npm run lint

# 4. Arrancar en desarrollo
npm start
```

---

## 📋 Rol de Cada Cambio

| Cambio | Rol | Criticidad |
|--------|-----|-----------|
| Columna Monto | Visualización | 🟢 Baja |
| Columna CCP | Visualización | 🟢 Baja |
| Detección Meta | Lógica | 🟡 Media |
| Validación Múltiple | Seguridad | 🔴 ALTA |

---

## 🚀 Próximos Pasos

1. **Copiar cambios** a archivos correctos
2. **Compilar** ambos frontend y backend
3. **Testing** según `TESTING_RAPIDO_GUIA_VALIDACION.md`
4. **Deployment** según `CHECKLIST_DEPLOYMENT.md`

---

**Documento:** Referencia Técnica  
**Actualizado:** 31-03-2026  
**Estado:** Completo y listo para usar
