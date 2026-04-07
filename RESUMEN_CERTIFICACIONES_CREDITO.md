# 📊 MÓDULO CERTIFICACIÓN DE CRÉDITO PRESUPUESTARIO - RESUMEN TÉCNICO

## 🎯 Objetivo
Gestionar certificaciones de crédito presupuestario con detalles por clasificador y monto, siguiendo la estructura existente del sistema COMISIONES_AAAU.

## 📂 Archivos Creados/Modificados

### Backend
```
backend/
├── models/
│   └── CertificacionCredito.js          ✅ CREADO
├── controllers/
│   └── certificacionCreditoController.js ✅ CREADO
└── routes/
    └── comisiones.js                     ✅ MODIFICADO (agregadas rutas)
```

### Frontend
```
material-dashboard-react/
├── src/
│   ├── pages/Gestion/
│   │   └── GestionCertificacionesCredito.js ✅ CREADO
│   └── services/
│       └── api.js                        ✅ MODIFICADO (agregados métodos)
```

### Base de Datos
```
database/
└── schema_certificaciones_credito.sql    ✅ CREADO
```

### Documentación
```
├── IMPLEMENTACION_CERTIFICACIONES_CREDITO.md ✅ CREADO
└── RESUMEN_CERTIFICACIONES_CREDITO.md       ✅ CREADO (este archivo)
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `certificaciones_credito`
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, AI | Identificador único |
| nota | VARCHAR(255) | NOT NULL | Nota descriptiva |
| mes | VARCHAR(20) | NOT NULL | Mes de la certificación (YYYY-MM) |
| fecha_aprobacion | DATE | NULL | Fecha en que fue aprobada |
| fecha_documento | DATE | NULL | Fecha del documento |
| estado_certificacion | VARCHAR(50) | DEFAULT 'PENDIENTE' | PENDIENTE, APROBADA, RECHAZADA |
| tipo_documento | VARCHAR(100) | NOT NULL | Tipo de documento (ej: Certificación) |
| numero_documento | VARCHAR(100) | UNIQUE, NOT NULL | Número único del documento |
| justificacion | TEXT | NULL | Justificación de la certificación |
| meta_id | INT | FK (metas) | Referencia a meta (opcional) |
| fuente_financiamiento_id | INT | FK (fuentes_financiamiento) | Referencia a fuente (opcional) |
| usuario_id | INT | FK (users) | Usuario que creó el registro |
| created_at | TIMESTAMP | AUTO | Timestamp de creación |
| updated_at | TIMESTAMP | AUTO | Timestamp de actualización |

**Índices:** meta_id, fuente_financiamiento_id, usuario_id, estado, mes, numero_documento

---

### Tabla: `detalles_certificacion_credito`
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PK, AI | Identificador único |
| certificacion_credito_id | INT | FK, NOT NULL | Referencia a certificación |
| clasificador_id | INT | FK, NOT NULL | Referencia a clasificador |
| monto | DECIMAL(15,2) | NOT NULL | Monto asignado |
| created_at | TIMESTAMP | AUTO | Timestamp de creación |
| updated_at | TIMESTAMP | AUTO | Timestamp de actualización |

**Índices:** certificacion_credito_id, clasificador_id
**Constraint Único:** (certificacion_credito_id, clasificador_id)

---

## 🔌 ENDPOINTS API

### Certificaciones (principales)

```
GET    /api/certificaciones-credito
└─ Listar todas (con filtros opcionales)
└─ Parámetros: meta_id, fuente_financiamiento_id, estado_certificacion, mes

POST   /api/certificaciones-credito
└─ Crear nueva certificación
└─ Body: {nota, mes, tipo_documento, numero_documento, ...}

GET    /api/certificaciones-credito/:id
└─ Obtener por ID con detalles

PUT    /api/certificaciones-credito/:id
└─ Actualizar certificación

DELETE /api/certificaciones-credito/:id
└─ Eliminar (cascada en detalles)
```

### Detalles

```
GET    /api/certificaciones-credito/:id/detalles
└─ Listar detalles de una certificación

POST   /api/detalles-certificacion
└─ Crear detalle
└─ Body: {certificacion_credito_id, clasificador_id, monto}

PUT    /api/detalles-certificacion/:id
└─ Actualizar detalle

DELETE /api/detalles-certificacion/:id
└─ Eliminar detalle

GET    /api/certificaciones-credito/:id/total
└─ Obtener suma total de montos
```

---

## 🧩 COMPONENTES REACT

### GestionCertificacionesCredito.js

#### Estados (useState)
- `certificaciones` - Array de certificaciones
- `metas` - Array de metas disponibles
- `fuentesFinanciamiento` - Array de fuentes
- `clasificadores` - Array de clasificadores
- `loading` - Estado de carga
- `openDialog` - Control de modal principal
- `openDetallesDialog` - Control de modal detalles
- `editingId` - ID de certificación en edición
- `detalles` - Array de detalles actuales
- `formData` - Datos del formulario principal
- `detalleFormData` - Datos del formulario detalle

#### Funciones Principales
- `cargarDatos()` - Carga inicial de datos
- `handleOpenDialog(certificacion)` - Abre modal crear/editar
- `handleOpenDetallesDialog(certificacion)` - Abre modal detalles
- `handleChange(e)` - Maneja cambios en campos
- `handleSave()` - Guarda certificación
- `handleAgregarDetalle()` - Agrega detalle
- `handleEliminar(id)` - Elimina certificación
- `handleEliminarDetalle(id)` - Elimina detalle

#### Tablas
1. **Tabla Principal** - DataTable de certificaciones con búsqueda
2. **Tabla Detalles** - TableMUI para mostrar detalles inline

---

## 🔄 FLUJO DE DATOS

```
Usuario
   │
   └─→ GestionCertificacionesCredito (React)
       │
       ├─→ api.js (servicio)
       │   │
       │   └─→ Backend API (/api/certificaciones-credito)
       │       │
       │       └─→ certificacionCreditoController.js
       │           │
       │           └─→ CertificacionCredito.js (model)
       │               │
       │               └─→ MySQL DB
       │
       └─→ Estado Local (React)
           │
           └─→ UI actualizado
```

---

## 📋 VALIDACIONES

### Cliente (React)
- ✅ Campos obligatorios antes de enviar
- ✅ Formato de fecha validado por HTML5
- ✅ Números positivos para montos
- ✅ Selecciones requeridas

### Servidor (Backend)
- ✅ Verificación de campos obligatorios
- ✅ Unicidad de número_documento
- ✅ Validación de IDs foráneos
- ✅ Transacciones en eliminaciones

### Base de Datos
- ✅ Constraints CHECK en estados válidos
- ✅ Índices para búsquedas rápidas
- ✅ Relaciones referenciales con ON DELETE

---

## 🎨 INTERFAZ DE USUARIO

### Pantalla Principal
```
┌─────────────────────────────────────────────────────────┐
│ Gestión de Certificaciones de Crédito Presupuestario    │
│                                          [+] Nueva Cert. │
├─────────────────────────────────────────────────────────┤
│ ID │ Nota │ Mes │ Tipo │ N°Doc │ Estado │ Meta │ FF │ ⋯ │
├─────────────────────────────────────────────────────────┤
│ 1  │ ... │ ... │ ...  │ ...   │ ...    │ ...  │ ..│ ✎ 🔗 🗑│
│ 2  │ ... │ ... │ ...  │ ...   │ ...    │ ...  │ ..│ ✎ 🔗 🗑│
└─────────────────────────────────────────────────────────┘
```

### Modal Principal (Crear/Editar)
```
┌──────────────────────────────────────┐
│ Nueva Certificación de Crédito       │
├──────────────────────────────────────┤
│ [Nota              ]                  │
│ [Mes               ]                  │
│ [Fecha Aprobación  ]                  │
│ [Fecha Documento   ]                  │
│ [Estado            ▼]                 │
│ [Tipo Documento    ]                  │
│ [N° Documento      ]                  │
│ [Justificación...  ]                  │
│ [Meta              ▼]                 │
│ [Fuente            ▼]                 │
├──────────────────────────────────────┤
│                    [Cancelar] [Crear] │
└──────────────────────────────────────┘
```

### Modal Detalles
```
┌──────────────────────────────────────────────────┐
│ Detalles de Certificación                        │
├──────────────────────────────────────────────────┤
│ [Clasificador ▼]  [Monto ]  [Agregar]           │
├──────────────────────────────────────────────────┤
│ Clasificador │ Partida │ Monto      │ Acciones  │
├──────────────────────────────────────────────────┤
│ Ejemplo      │ 23.2.1  │ S/. 500.00 │ 🗑        │
│ Ejemplo 2    │ 23.2.2  │ S/. 300.00 │ 🗑        │
├──────────────────────────────────────────────────┤
│ Total:                                S/. 800.00 │
├──────────────────────────────────────────────────┤
│                                      [Cerrar]    │
└──────────────────────────────────────────────────┘
```

---

## 🚀 INSTALACIÓN RÁPIDA

1. **Crear tablas:**
   ```bash
   mysql < database/schema_certificaciones_credito.sql
   ```

2. **Archivos listos:**
   - ✅ Backend model y controller
   - ✅ Frontend component y API
   - ✅ Rutas API definidas

3. **Agregar a navegación:**
   - Actualizar rutas en `index.js`
   - Agregar menu item en navbar

4. **Compilar y ejecutar:**
   ```bash
   npm run build  # o npm start para desarrollo
   ```

---

## 📊 RELACIONES

```
metas (1) ──→ (N) certificaciones_credito
fuentes_financiamiento (1) ──→ (N) certificaciones_credito
users (1) ──→ (N) certificaciones_credito
certificaciones_credito (1) ──→ (N) detalles_certificacion_credito
clasificadores (1) ──→ (N) detalles_certificacion_credito
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear tablas en BD
- [ ] Copiar modelo y controller backend
- [ ] Verificar rutas en backend
- [ ] Copiar componente React
- [ ] Actualizar servicios API
- [ ] Agregar rutas de navegación
- [ ] Agregar items a menú
- [ ] Compilar frontend
- [ ] Reiniciar servidor backend
- [ ] Probar creación de certificación
- [ ] Probar agregado de detalles
- [ ] Probar edición y eliminación
- [ ] Verificar relaciones en BD

---

## 🔍 TROUBLESHOOTING

**Error: Tabla no existe**
→ Ejecutar script SQL: `schema_certificaciones_credito.sql`

**Error: Controller no encontrado**
→ Verificar ruta en `routes/comisiones.js`

**Error: API no responde**
→ Reiniciar servidor backend: `npm start`

**Error: Componente no se carga**
→ Verificar rutas en `index.js` y presencia del archivo

**Error: Validación en campos**
→ Revisar `formData` inicial y validaciones en `handleSave()`

---

## 📞 CONTACTO/SOPORTE

Para preguntas o problemas, revisar:
1. Logs del servidor: `npm logs`
2. Consola del navegador: F12
3. Base de datos: Queries de verificación
4. Archivo `IMPLEMENTACION_CERTIFICACIONES_CREDITO.md`
