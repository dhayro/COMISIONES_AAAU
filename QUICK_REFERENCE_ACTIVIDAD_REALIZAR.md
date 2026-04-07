# ⚡ QUICK REFERENCE: Campo "Actividad a Realizar"

## 📋 Lo que se implementó

✅ Nuevo campo: `actividad_realizar`  
✅ Se diferencia de: `observacion`  
✅ Ubicación: Tabla `formato_emisiones`  
✅ Tipo: VARCHAR(500) NULL  

---

## 🎯 Para Usuario Final

### En Formulario:
```
┌─────────────────────────────────┐
│ Actividad a Realizar:           │
│ ┌─────────────────────────────┐ │
│ │ Supervisar avance de obra   │ │
│ └─────────────────────────────┘ │
│                                 │
│ Observación:                    │
│ ┌─────────────────────────────┐ │
│ │ Revisar cumplimiento        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### En PDF Anexo 01:
```
ACTIVIDAD A REALIZAR │ OBSERVACIÓN
Supervisar avance    │ Revisar cumplimiento
de obra              │
```

---

## 🛠️ Para Desarrollador

### Archivos Modificados:
- `backend/migrations/003_agregar_actividad_realizar.sql` (NUEVO)
- `backend/config/migraciones.js` (agregó función)
- `backend/models/FormatoEmision.js` (2 métodos)
- `backend/server.js` (importación + línea 97)
- `frontend/src/pages/EmisionFormatos.js` (6 lugares)

### Acceso a Datos:
```javascript
// Obtener
const actividad = formato.actividad_realizar;

// Enviar
const datos = {
  actividad_realizar: "...",
  observacion: "..."
};
```

### SQL:
```sql
-- Ver tabla
DESC formato_emisiones;

-- Consultar datos
SELECT actividad_realizar, observacion FROM formato_emisiones;
```

---

## 🔄 Flujo de Datos

```
Usuario escribe en formulario
        ↓
React state actualiza
        ↓
Envía a Backend API
        ↓
Backend guarda en MySQL
        ↓
Usuario edita y se recarga
        ↓
Se genera PDF con datos
```

---

## ✅ Validación Rápida

```bash
# 1. Servidor está corriendo (npm run dev)
# 2. Ver logs:
#    "✅ Migración ejecutada exitosamente"
# 3. Abrir formulario → Ver campo visible
# 4. Crear formato → Guardar ambos campos
# 5. Editar formato → Cargan ambos valores
# 6. Generar PDF → Mostrar diferenciado
```

---

## 🎓 Conocimiento Clave

| Aspecto | Detalle |
|--------|---------|
| **Campo DB** | `actividad_realizar VARCHAR(500) NULL` |
| **Diferencia** | Del campo `observacion` |
| **Nullable** | SÍ - puede estar vacío |
| **PDFs** | Se diferencia en Anexo 01 y 02 |
| **Migraciones** | Auto-ejecutadas en startup |

---

## ❓ FAQ Rápido

**P: ¿Dónde aparece el nuevo campo?**  
R: En el formulario de Crear/Editar Formato, y en los PDFs (Anexo 01 y 02)

**P: ¿Qué diferencia hay con Observación?**  
R: Actividad = QUÉ se hará | Observación = Notas adicionales

**P: ¿Se perdieron datos?**  
R: No. Campo es nullable, datos existentes siguen igual

**P: ¿Necesito migración manual?**  
R: No. Se ejecuta automáticamente al iniciar servidor

**P: ¿Debo cambiar algo en frontend?**  
R: No. Está actualizado. Solo prueba creando/editando

---

## 🚀 Próxima Acción

Ejecutar plan de pruebas: `PLAN_PRUEBAS_ACTIVIDAD_REALIZAR.md`

---

**Estado: ✅ LISTO PARA USAR**
