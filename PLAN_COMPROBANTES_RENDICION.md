# 📋 PLAN: Sistema de Gestión de Comprobantes y Rendición

## 1. FLUJO GENERAL

```
FORMATO EMITIDO (Estado: ENVIADO)
    ↓
    └─→ RENDICIÓN DE COMPROBANTES
        ├─ Tabla Maestra: comprobantes
        ├─ Tabla Detalle: comprobante_detalles (si es VIÁTICO)
        └─ Estado: PENDIENTE → EN REVISIÓN → APROBADO / RECHAZADO
```

## 2. ESTRUCTURA DE TABLAS

### 2.1 TABLA MAESTRA: `comprobantes`
- **Propósito**: Registro principal de comprobantes de rendición
- **Relación**: Con `formato_emisiones` (1 formato → N comprobantes)
- **Estado**: Solo se puede renderir si formato está en ENVIADO

```sql
CREATE TABLE comprobantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  formato_emision_id INT NOT NULL,
  numero_comprobante VARCHAR(50),           -- Número documento/factura/boleta
  tipo_comprobante ENUM('FACTURA', 'BOLETA', 'TICKET', 'RECIBO') NOT NULL,
  fecha_comprobante DATE NOT NULL,
  proveedor_razon_social VARCHAR(255),      -- Empresa/Persona
  proveedor_ruc_dni VARCHAR(20),
  monto DECIMAL(10, 2) NOT NULL,
  estado_rendicion ENUM('PENDIENTE', 'EN_REVISIÓN', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
  observacion_rechazo TEXT,                 -- Si está rechazado
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (formato_emision_id) REFERENCES formato_emisiones(id) ON DELETE CASCADE,
  INDEX idx_formato (formato_emision_id),
  INDEX idx_estado (estado_rendicion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 2.2 TABLA DETALLE: `comprobante_detalles`
- **Propósito**: Desglose de tipos de viáticos (solo para VIÁTICO)
- **Relación**: Con `comprobantes` (1 comprobante → N detalles)

```sql
CREATE TABLE comprobante_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comprobante_id INT NOT NULL,
  tipo_viatitico ENUM('ALIMENTACIÓN', 'HOSPEDAJE', 'MOVILIDAD_LOCAL') NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,         -- Monto por tipo
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE CASCADE,
  INDEX idx_comprobante (comprobante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

## 3. INTERFAZ MAESTRA DE COMPROBANTES

**Ubicación**: `http://localhost:3000/gestion/comprobantes`

### 3.1 Tabla Maestra
```
Columnas:
  • ID
  • Formato ID
  • N° Comprobante
  • Tipo Comprobante
  • Fecha
  • Proveedor
  • Monto
  • Estado Rendición (Badge: PENDIENTE/EN_REVISIÓN/APROBADO/RECHAZADO)
  • Acciones (Ver Detalles, Editar, Eliminar)
```

### 3.2 Filtros
- Por estado_rendicion
- Por rango de fechas
- Por formato_emision_id
- Por monto

## 4. MODAL DE RENDICIÓN

**Trigger**: Botón "Rendir" en GestionCertificacionesFormatos
**Condición**: Solo si estado_emision === 'ENVIADO'

### 4.1 Formulario
```
├─ Número Comprobante (TextField, requerido)
├─ Tipo Comprobante (Select: FACTURA, BOLETA, TICKET, RECIBO)
├─ Fecha Comprobante (DatePicker)
├─ Razonz Social/Empresa (TextField)
├─ RUC/DNI (TextField)
├─ Monto (NumberField)
├─ [CONDICIONAL] Si clasificador es VIÁTICO:
│  └─ Tabla Detalles:
│     ├─ Fila 1: Alimentación → Monto
│     ├─ Fila 2: Hospedaje → Monto
│     └─ Fila 3: Movilidad Local → Monto
│        (Total debe = Monto principal)
└─ Botones: Guardar, Cancelar
```

## 5. CAMBIOS EN GESTIONCERTIFICACIONESFORMATOS

### 5.1 Nueva Columna
```
| Acciones |
  ├─ Editar (existente)
  └─ Rendir (NUEVO - SOLO si estado = ENVIADO)
     └─ Abre modal de rendición
```

### 5.2 Lógica
```javascript
const puedoRendir = formato.estado_emision === 'ENVIADO';
// Si TRUE → mostrar botón "Rendir"
// Si FALSE → deshabilitado
```

## 6. FLUJO TÉCNICO

### Backend
```
POST /api/comprobantes/crear
  └─ Input: formato_emision_id, tipo_comprobante, ...
  └─ Validar: formato.estado_emision === 'ENVIADO'
  └─ Crear en comprobantes
  └─ Si VIÁTICO: crear detalles en comprobante_detalles
  └─ Response: comprobante creado

GET /api/comprobantes/listar
  └─ Query: ?formato_emision_id=X
  └─ Response: Array de comprobantes

PUT /api/comprobantes/actualizar/:id
  └─ Validar estado antes de permitir edición

DELETE /api/comprobantes/:id
  └─ Soft delete o hard delete

GET /api/comprobantes/:id/detalles
  └─ Response: Array de comprobante_detalles
```

### Frontend
```
Pages/
  ├─ GestionComprobantes.js (NUEVA)
  │   ├─ Tabla maestra de comprobantes
  │   ├─ Filtros
  │   └─ Botones: Crear, Editar, Eliminar
  │
  └─ (Componentes modales integrados)

Modales/
  ├─ ModalRendicion.js (NUEVO)
  │   ├─ Formulario rendición
  │   └─ Tabla detalles (si VIÁTICO)
  │
  └─ ModalVistaComprobante.js (NUEVO)
      └─ Preview de comprobante con detalles
```

## 7. ESTILOS Y CONVENCIONES

### Seguir:
✅ Material-UI (MUI) components
✅ MDBox, MDButton, MDTypography
✅ DataTable component (react-table)
✅ Swal para confirmaciones
✅ Badge colors:
   - PENDIENTE: Naranja (#ff9800)
   - EN_REVISIÓN: Azul (#2196f3)
   - APROBADO: Verde (#4caf50)
   - RECHAZADO: Rojo (#f44336)

✅ Naming conventions:
   - Controllers: `<entidad>Controller.js`
   - Models: `<Entidad>.js`
   - Pages: `<Nombre>.js`
   - Modales: `Modal<Accion>.js`

## 8. ORDEN DE IMPLEMENTACIÓN

1. ✅ Crear tablas en BD
2. ✅ Crear modelos (Comprobante.js, ComprobantesDetalle.js)
3. ✅ Crear controllers (comprobantesController.js)
4. ✅ Crear rutas (routes/comprobantes.js)
5. ✅ Crear página maestra (GestionComprobantes.js)
6. ✅ Crear modales (ModalRendicion.js, ModalVistaComprobante.js)
7. ✅ Integrar botón "Rendir" en GestionCertificacionesFormatos
8. ✅ Agregar ruta en dashboard

## 9. EJEMPLO DE FLUJO EN ACCIÓN

```
Usuario en: GestionCertificacionesFormatos
  ↓
Ve formato en estado: ENVIADO
  ↓
Hace clic en botón "Rendir" (nuevo)
  ↓
Abre ModalRendicion
  ↓
[Si clasificador = VIÁTICO]
  Rellena: Alimentación, Hospedaje, Movilidad Local
  Total se suma automático
[Si clasificador ≠ VIÁTICO]
  Solo rellena: Tipo, Monto, Proveedor
  ↓
Presiona "Guardar"
  ↓
Backend valida y crea registro en comprobantes
  ↓
Se cierra modal
  ↓
Usuario ve nuevo comprobante en GestionComprobantes con estado: PENDIENTE
```

