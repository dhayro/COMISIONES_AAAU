# 🚀 Guía Rápida - Fuentes de Financiamiento

## Acceder al Módulo

1. **Menú Lateral** → "Fuentes de Financiamiento"
2. Se abre la vista con tabla de todas las fuentes

## Crear Nueva Fuente

```
Botón [Nueva Fuente] → Completa formulario → [Guardar]

Campos:
- Nombre: "Recursos Ordinarios"
- Abreviatura: "R.O" (se convierte automáticamente a mayúsculas)
- Descripción: "Opcional"
```

## Editar Fuente

```
Click ícono [Lápiz] en la fila → Modal con datos → Modifica → [Guardar]
```

## Eliminar Fuente

```
Click ícono [Papelera] en la fila → Confirma eliminación → Hecho
```

## Datos Iniciales

| Nombre | Abreviatura | Descripción |
|--------|-------------|-------------|
| Recursos Ordinarios | R.O | Ingresos ordinarios del estado |
| Recursos Directamente Recaudados | R.D.R | Recursos generados por el organismo |
| Donaciones | DON | Fondos de donaciones internacionales |
| Crédito Público | C.P | Recursos por crédito público |

## API Endpoints

```bash
# Obtener todas las fuentes
GET /api/fuentes-financiamiento

# Obtener una fuente
GET /api/fuentes-financiamiento/:id

# Crear nueva fuente
POST /api/fuentes-financiamiento
Body: { nombre, abreviatura, descripcion }

# Actualizar fuente
PUT /api/fuentes-financiamiento/:id
Body: { nombre, abreviatura, descripcion, activo }

# Eliminar fuente
DELETE /api/fuentes-financiamiento/:id
```

## Validaciones

✅ **Nombre**: Requerido, único
✅ **Abreviatura**: Requerida, única, convertida a mayúsculas
✅ **Descripción**: Opcional
✅ **Toasts**: Notificaciones flotantes en esquina superior derecha

## Compilación

```bash
# Compilar frontend
cd material-dashboard-react
npm run build

# Output esperado: 502.4 kB sin errores críticos
```

## Estado de BD

La tabla se crea automáticamente al iniciar el backend con:
- 4 fuentes de financiamiento iniciales pre-cargadas
- Campos: id, nombre, abreviatura, descripción, activo, timestamps

## Archivos Principales

```
Backend:
  └─ backend/controllers/fuenteFinanciamientoController.js
  └─ backend/config/database.js (tabla agregada)
  └─ backend/routes/comisiones.js (rutas agregadas)

Frontend:
  └─ material-dashboard-react/src/pages/Gestion/GestionFuentesFinanciamiento.js
  └─ material-dashboard-react/src/services/api.js (métodos agregados)
  └─ material-dashboard-react/src/routes.js (ruta agregada)
```

## Iconografía

- 📊 Icono en menú: **attach_money** (dinero)
- ✏️ Editar: **EditIcon**
- 🗑️ Eliminar: **DeleteIcon**

---

**Estado**: ✅ Completado y funcional
**Tamaño Bundle**: 502.4 kB
**Toasts**: Implementados ✅
