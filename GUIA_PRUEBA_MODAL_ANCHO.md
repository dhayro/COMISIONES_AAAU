# 📖 GUÍA DE PRUEBA: Modal Ancho con Vista Previa PDF

**Versión:** 1.0  
**Fecha:** 21 Marzo 2026  
**Componente:** GestionCertificacionesCredito  

---

## 🚀 PASOS PARA PROBAR

### **Paso 1: Reiniciar el Servidor**

```bash
# En una terminal, ve a la carpeta backend
cd d:\COMISIONES_AAAU\backend

# Detén el servidor si está corriendo
# Presiona Ctrl+C

# Reinicia el servidor
npm run dev
```

**Esperado:**
```
✓ Server running on http://localhost:5000
✓ Frontend running on http://localhost:3000
```

---

### **Paso 2: Limpiar Cache del Navegador**

En el navegador donde tengas la aplicación abierta:

```
Presiona: Ctrl + Shift + R
```

O manualmente:
1. Abre DevTools: `F12`
2. Click derecho en refresh: `Empty cache and hard refresh`

**Esperado:**
- Página carga sin archivos en caché
- Cambios CSS y JavaScript se aplican

---

### **Paso 3: Navegar a Gestión de Certificaciones**

```
1. Abre navegador: http://localhost:3000
2. Inicia sesión si es necesario
3. Ve a: Gestión → Certificaciones de Crédito
```

**Esperado:**
- Tabla de certificaciones cargada
- Botones "Editar" visibles

---

### **Paso 4: PRUEBA 1 - Crear Nueva Certificación**

```
1. Click botón "Nueva Certificación"
2. Modal abre
```

**Verificar:**
- ✅ Modal es más ancho que antes
- ✅ Solo está el formulario (columna izquierda)
- ✅ NO hay columna de PDF a la derecha
- ✅ Todos los campos visibles: Nota, Mes, Fecha, Estado, Monto, etc.

**Captura esperada:**
```
┌─────────────────────────────────────────────────┐
│ Nueva Certificación de Crédito                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nota: [________________]                       │
│  Mes:  [________________]                       │
│  Fecha Aprobación: [___________]                │
│  Estado: [APROBADO ▼]                           │
│  Monto: [________]                              │
│  ...                                            │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Cancelar]              [Crear]                 │
└─────────────────────────────────────────────────┘
```

**Resultado:**
- ✅ Pasa: Modal ancho, solo formulario, sin PDF
- ❌ Falla: Modal pequeño o hay columna PDF

---

### **Paso 5: PRUEBA 2 - Editar Certificación Existente**

```
1. Click botón "Cancelar" para cerrar el modal anterior
2. En la tabla, encuentra una certificación existente
3. Click botón ✏️ (Editar) en esa fila
4. Modal abre
```

**Verificar:**
- ✅ Modal es muy ancho (~900px)
- ✅ Hay DOS columnas visibles
- ✅ Columna izquierda: Formulario con datos cargados
- ✅ Columna derecha: 
  - Título "📄 Vista Previa PDF"
  - Botón "📤 Subir/Actualizar PDF"
  - Área blanca con texto "PDF no cargado aún..."

**Captura esperada:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Editar Certificación                                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Formulario (Izq)         │  Vista Previa PDF (Derecha)            │
├──────────────────────────┼───────────────────────────────────────│
│ Nota: [32716M329AAA]     │ 📄 Vista Previa PDF                    │
│ Mes: [FEBRERO]           │ ─────────────────────────────────────  │
│ Fecha: [2026-02-26]      │                                        │
│ Estado: [APROBADO ▼]     │ [📤 Subir/Actualizar PDF]              │
│ Monto: [20540.00]        │                                        │
│ Justi: [......]          │ ┌──────────────────────────────────┐   │
│ Meta: [0072...]          │ │ PDF no cargado aún.              │   │
│ Fuente: [RO]             │ │ Haz clic en "Procesar PDF"       │   │
│                          │ │ para cargar.                     │   │
│                          │ │                                  │   │
│                          │ └──────────────────────────────────┘   │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [Cancelar]                                   [Actualizar]          │
└────────────────────────────────────────────────────────────────────┘
```

**Resultado:**
- ✅ Pasa: Dos columnas, formulario + PDF, botón visible
- ❌ Falla: Solo una columna o no está el botón

---

### **Paso 6: PRUEBA 3 - Modificar Datos**

En el modal abierto (Paso 5):

```
1. Modifica el campo "Monto Certificado"
   Ejemplo: 20540 → 25000
2. Modifica el campo "Estado"
   Ejemplo: APROBADO → RECHAZADO
3. Click botón "Actualizar"
4. Modal cierra y vuelve a tabla
```

**Verificar:**
- ✅ Monto cambió en la tabla
- ✅ Estado cambió en la tabla
- ✅ Mensaje "Certificación actualizada correctamente" apareció
- ✅ No hay error en consola

**Resultado:**
- ✅ Pasa: Datos se guardan y actualizan en tabla
- ❌ Falla: No se guardan o hay error

---

### **Paso 7: PRUEBA 4 - Procesar PDF**

En el modal abierto (Paso 5):

```
1. Click botón "📤 Subir/Actualizar PDF"
2. Se abre PdfUploadDialog
3. Carga un PDF de certificación
   Ejemplo: "CCP 2658 AAA UCAYALI - MARZO 2026.pdf"
4. Sistema extrae datos del PDF
5. Click "Aceptar" en el diálogo de confirmación
6. Vuelves al modal de edición
```

**Verificar:**
- ✅ Diálogo de upload abre
- ✅ PDF se carga exitosamente
- ✅ Datos se extraen (Nota, Mes, Monto, etc.)
- ✅ Mensaje de éxito aparece
- ✅ Modal de edición sigue abierto (dos columnas)
- ✅ Certificación se actualiza (no crea duplicado)

**Resultado:**
- ✅ Pasa: PDF se procesa, datos se actualizan, sin duplicado
- ❌ Falla: Error 409 o no se actualiza

---

### **Paso 8: PRUEBA 5 - Editar y Guardar Juntos**

En el modal abierto:

```
1. Click "📤 Subir/Actualizar PDF"
2. Carga PDF nuevo
3. Espera a que se procese
4. Vuelves al modal
5. ADEMÁS de los datos del PDF, cambias manualmente:
   - Estado: APROBADO → RECHAZADO (ejemplo)
6. Click "Actualizar"
```

**Verificar:**
- ✅ Datos del PDF se usan como base
- ✅ Tu cambio manual se aplica encima
- ✅ Ambos cambios se guardan juntos
- ✅ Tabla refleja los cambios finales

---

### **Paso 9: PRUEBA 6 - Responsividad (Opcional)**

```
1. Redimensiona la ventana del navegador
```

**Verificar para diferentes tamaños:**
- Pantalla grande (>1200px): Dos columnas completas
- Pantalla mediana (768-1200px): Dos columnas más estrechas
- Pantalla pequeña (<768px): Columnas se adaptan

---

## ✅ CHECKLIST DE VALIDACIÓN

Marca ✅ cada prueba completada exitosamente:

```
INTERFAZ:
  [ ] Modal es más ancho (lg en lugar de sm)
  [ ] Crear nuevo: Solo formulario (sin PDF)
  [ ] Editar: Dos columnas visibles
  [ ] Columna PDF visible al editar
  [ ] Botón "Subir/Actualizar PDF" visible

FUNCIONALIDAD:
  [ ] Crear nueva certificación sin PDF
  [ ] Editar y cambiar monto/estado
  [ ] Guardar cambios sin error
  [ ] Procesar PDF desde botón integrado
  [ ] Certificación se actualiza (no duplica)
  [ ] Datos modificados + PDF se guardan juntos

DATOS:
  [ ] Tabla muestra datos actualizados
  [ ] Monto visible en tabla
  [ ] Estado visible en tabla
  [ ] Sin registros duplicados

ERROR HANDLING:
  [ ] Sin errores en consola (F12)
  [ ] Sin errores 409 duplicados
  [ ] Mensajes de éxito aparecen
```

---

## 🐛 POSIBLES PROBLEMAS Y SOLUCIONES

### **Problema 1: Modal sigue siendo pequeño**
```
Causa: Cache no limpiado
Solución: Ctrl+Shift+R en el navegador
```

### **Problema 2: Columna PDF no aparece**
```
Causa: No estás editando (no hay editingId)
Solución: Asegúrate de estar en modo edición (✏️), no en crear nuevo
```

### **Problema 3: Botón PDF no abre diálogo**
```
Causa: onClick no está conectado
Solución: Revisa que `onClick={() => setOpenPdfDialog(true)}` esté en el botón
```

### **Problema 4: Error 409 al procesar PDF**
```
Causa: Certificación duplicada en BD
Esperado: Sistema detecta y actualiza (no es error para usuario)
Solución: Revisa que handleExtractedPdfData tenga try/catch para 409
```

### **Problema 5: Datos no se guardan**
```
Causa: handleSave no incluye todos los campos
Solución: Verifica que formData incluya monto_certificado
```

---

## 📞 INFORMACIÓN ADICIONAL

### **Archivos Modificados:**
```
material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js
```

### **Cambios Clave:**
1. Import `Box` desde Material-UI
2. Dialog `maxWidth="lg"` (ancho)
3. DialogContent `flexDirection="row"` (horizontal)
4. Box izquierda: Formulario
5. Box derecha: Vista previa PDF (condicional `editingId`)

### **Componentes Relacionados:**
- `PdfUploadDialog` - Diálogo de carga de PDF
- `api.crearCertificacionCredito()` - POST
- `api.actualizarCertificacionCredito()` - PUT

---

## 🎯 RESULTADO ESPERADO FINAL

Después de todas las pruebas, deberías tener:

✅ **Modal Ancho**
- Casi el doble de ancho que antes
- Mejor visualización de formulario

✅ **Dos Columnas en Edición**
- Formulario editable a la izquierda
- Vista previa y botones a la derecha

✅ **Procesamiento de PDF Integrado**
- Botón "Subir/Actualizar PDF" en el mismo lugar
- No necesitas cambiar de diálogo

✅ **Flujo Completo Funcional**
- Crear, editar, procesar PDF, guardar
- Todo en un solo lugar

---

**Si todas las pruebas pasan, ¡la implementación es exitosa! 🎉**

Documenta cualquier problema o sugerencia para futuras mejoras.
