# 📋 PLAN ACTUALIZADO: Sistema de Comprobantes y Rendición v2.0

## 1. NUEVA ESTRUCTURA DE TABLAS

```
MAESTRAS:
├─ tipo_comprobante (NUEVA)
├─ proveedores (NUEVA)
└─ clasificadores (EXISTENTE)

TRANSACCIONALES:
├─ comprobantes (MODIFICADA)
└─ rendiciones (RENOMBRADA - comprobante_detalles)
```

---

## 2. TABLAS MAESTRAS

### 2.1 TABLA MAESTRA: `tipo_comprobante`
```sql
CREATE TABLE tipo_comprobante (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

**Datos por defecto:**
- FACTURA
- BOLETA
- TICKET
- RECIBO
- DECLARACIÓN JURADA (sin proveedor)
- COMPROBANTE DE PAGO

---

### 2.2 TABLA MAESTRA: `proveedores`
```sql
CREATE TABLE proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razon_social VARCHAR(255) NOT NULL,
  ruc_dni VARCHAR(20) NOT NULL UNIQUE,
  tipo_documento ENUM('RUC', 'DNI', 'PASAPORTE') NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(100),
  contacto_nombre VARCHAR(255),
  activo BOOLEAN DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ruc_dni (ruc_dni),
  INDEX idx_razon_social (razon_social)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

---

## 3. TABLAS TRANSACCIONALES (MODIFICADAS)

### 3.1 TABLA: `comprobantes` (MODIFICADA)
```sql
CREATE TABLE comprobantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  formato_emision_id INT NOT NULL,
  tipo_comprobante_id INT NOT NULL,           -- FK a tipo_comprobante
  proveedor_id INT,                           -- FK a proveedores (NULL si es DECL. JURADA)
  numero_comprobante VARCHAR(50),             -- Número documento/factura/boleta
  fecha_comprobante DATE NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  estado_rendicion ENUM('PENDIENTE', 'EN_REVISIÓN', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
  observacion_rechazo TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (formato_emision_id) REFERENCES formato_emisiones(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_comprobante_id) REFERENCES tipo_comprobante(id) ON DELETE RESTRICT,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  INDEX idx_formato (formato_emision_id),
  INDEX idx_tipo (tipo_comprobante_id),
  INDEX idx_proveedor (proveedor_id),
  INDEX idx_estado (estado_rendicion),
  INDEX idx_fecha (fecha_comprobante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

---

### 3.2 TABLA: `rendiciones` (RENOMBRADA DE comprobante_detalles)
```sql
CREATE TABLE rendiciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comprobante_id INT NOT NULL,
  formato_emisiones_detalles_id INT NOT NULL, -- FK a formato_emisiones_detalles
  tipo_viatitico ENUM('ALIMENTACIÓN', 'HOSPEDAJE', 'MOVILIDAD_LOCAL') NULL,
  cantidad DECIMAL(10, 2) NOT NULL,           -- Monto renderido
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE CASCADE,
  FOREIGN KEY (formato_emisiones_detalles_id) REFERENCES formato_emisiones_detalles(id) ON DELETE RESTRICT,
  INDEX idx_comprobante (comprobante_id),
  INDEX idx_detalle_formato (formato_emisiones_detalles_id),
  INDEX idx_tipo (tipo_viatitico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

---

## 4. FLUJO DE RELACIONES

```
FORMATO EMITIDO (estado = ENVIADO)
    ↓
    └─→ formato_emisiones_detalles (múltiples)
            ├─ clasificador_id → clasificadores (partida, nombre)
            ├─ monto (monto del detalle)
            └─ [VIATICO?] → tipo_viatitico (ALIMENTACIÓN, HOSPEDAJE, MOVILIDAD_LOCAL)
                    ↓
                    RENDIR COMPROBANTE
                        ↓
                    comprobante (1 por tipo o varios)
                    ├─ tipo_comprobante_id → tipo_comprobante (FACTURA, BOLETA, etc.)
                    ├─ proveedor_id → proveedores (NULL si DECL. JURADA)
                    └─ rendiciones (1 por cada formato_emisiones_detalles)
                            ├─ formato_emisiones_detalles_id (referencia directa)
                            ├─ tipo_viatitico (si aplica)
                            └─ cantidad (monto rendido)
```

---

## 5. LÓGICA DE VALIDACIÓN

### 5.1 Al Crear Comprobante:
```javascript
✅ formato.estado_emision === 'ENVIADO'
✅ tipo_comprobante_id existe
✅ SI tipo_comprobante ≠ 'DECLARACIÓN JURADA' → proveedor_id requerido
✅ SI tipo_comprobante === 'DECLARACIÓN JURADA' → proveedor_id = NULL
✅ numero_comprobante único por tipo_comprobante + fecha
```

### 5.2 Al Crear Rendición:
```javascript
✅ comprobante_id existe
✅ formato_emisiones_detalles_id existe
✅ formato_emisiones_detalles_id pertenece al mismo formato_emision_id
✅ SI clasificador es VIÁTICO:
   ├─ tipo_viatitico requerido (ALIMENTACIÓN, HOSPEDAJE, MOVILIDAD_LOCAL)
   └─ cantidad ≤ monto del formato_emisiones_detalles
✅ SI clasificador NO es VIÁTICO:
   ├─ tipo_viatitico = NULL
   └─ cantidad = monto del formato_emisiones_detalles (completo)
```

---

## 6. INTERFAZ MODAL ACTUALIZADA

### 6.1 Paso 1: Seleccionar Tipo Comprobante
```
┌─ Select: Tipo Comprobante
│  ├─ FACTURA
│  ├─ BOLETA
│  ├─ TICKET
│  ├─ RECIBO
│  └─ DECLARACIÓN JURADA
└─ (Al cambiar → mostrar/ocultar campos de proveedor)
```

### 6.2 Paso 2: Proveedor (CONDICIONAL)
```
┌─ SI tipo_comprobante ≠ DECLARACIÓN JURADA:
│  ├─ Autocomplete: Seleccionar Proveedor Existente
│  │  └─ Muestra: Razon Social (RUC/DNI)
│  └─ O Crear Nuevo Proveedor:
│     ├─ Razon Social
│     ├─ RUC/DNI
│     ├─ Tipo Documento (RUC, DNI, PASAPORTE)
│     ├─ Dirección
│     ├─ Teléfono
│     └─ Email
│
└─ SI tipo_comprobante === DECLARACIÓN JURADA:
   └─ (No mostrar campos de proveedor)
```

### 6.3 Paso 3: Datos del Comprobante
```
├─ Número Comprobante
├─ Fecha Comprobante
└─ Monto Total
```

### 6.4 Paso 4: Rendiciones (Detalles)
```
┌─ Tabla de formato_emisiones_detalles:
│  ├─ Columna: Clasificador (partida + nombre)
│  ├─ Columna: Monto Original
│  ├─ Columna: [SI VIÁTICO] Tipo Viatico (select: ALI/HOSP/MOV)
│  ├─ Columna: Monto a Rendir (input numérico)
│  └─ Columna: Validación (✓ o ✗)
│
└─ Validaciones automáticas:
   ├─ Monto a Rendir ≤ Monto Original
   ├─ SI VIÁTICO: Mostrar tipo_viatitico select
   ├─ SI NO VIÁTICO: tipo_viatitico = NULL
   └─ Total Rendiciones = Monto Comprobante
```

---

## 7. CAMBIOS EN GESTIONCERTIFICACIONESFORMATOS

### 7.1 Botón "Rendir"
```javascript
const puedoRendir = formato.estado_emision === 'ENVIADO';
// Mostrar botón si TRUE
// Al hacer clic → abre ModalRendicion
// Pasa: formato, detalles del formato
```

---

## 8. PÁGINAS ACTUALIZADAS

### 8.1 GestionComprobantes.js
```
Tabla:
├─ ID
├─ Formato ID
├─ Tipo Comprobante (nombre)
├─ Proveedor (razon_social o "---" si NULL)
├─ Número Comprobante
├─ Fecha
├─ Monto
├─ Estado (badge color)
└─ Acciones (Ver Rendiciones, Eliminar)

Dialog de Detalles:
├─ Mostrar comprobante
├─ Mostrar tabla de rendiciones:
│  ├─ Clasificador
│  ├─ Tipo Viático (si aplica)
│  ├─ Monto Renderido
│  └─ Descripción
```

---

## 9. BACKEND - ENDPOINTS ACTUALIZADOS

### Tipo Comprobante
```
GET    /api/tipo-comprobante/listar
POST   /api/tipo-comprobante/crear
GET    /api/tipo-comprobante/:id
```

### Proveedores
```
GET    /api/proveedores/listar
POST   /api/proveedores/crear
GET    /api/proveedores/:id
PUT    /api/proveedores/:id
DELETE /api/proveedores/:id
```

### Comprobantes (ACTUALIZADO)
```
POST   /api/comprobantes/crear
GET    /api/comprobantes/listar
GET    /api/comprobantes/:id
PUT    /api/comprobantes/:id
DELETE /api/comprobantes/:id

GET    /api/comprobantes/:id/rendiciones  (nuevo)
GET    /api/comprobantes/estadisticas/:formato_id
```

### Rendiciones (NUEVO)
```
POST   /api/rendiciones/crear
GET    /api/rendiciones/listar
GET    /api/rendiciones/:id
PUT    /api/rendiciones/:id
DELETE /api/rendiciones/:id
```

---

## 10. ORDEN DE IMPLEMENTACIÓN

```
FASE 1: TABLAS MAESTRAS
1. ✅ Crear tabla tipo_comprobante
2. ✅ Crear tabla proveedores
3. ✅ Cargar datos por defecto en tipo_comprobante

FASE 2: TABLAS TRANSACCIONALES
4. ✅ Modificar comprobantes (agregar FKs a tipo_comprobante y proveedor_id)
5. ✅ Renombrar comprobante_detalles → rendiciones
6. ✅ Agregar formato_emisiones_detalles_id a rendiciones
7. ✅ Agregar tipo_viatitico a rendiciones

FASE 3: BACKEND
8. ✅ Crear modelo TipoComprobante.js
9. ✅ Crear modelo Proveedor.js
10. ✅ Crear modelo Rendicion.js
11. ✅ Actualizar modelo Comprobante.js
12. ✅ Crear controller tipoComprobanteController.js
13. ✅ Crear controller proveedorController.js
14. ✅ Crear controller rendicionController.js
15. ✅ Actualizar comprobantesController.js
16. ✅ Crear rutas

FASE 4: FRONTEND
17. ✅ Actualizar ModalRendicion.js
18. ✅ Actualizar GestionComprobantes.js
19. ✅ Integrar en GestionCertificacionesFormatos.js

FASE 5: SERVICIOS
20. ✅ Actualizar api.js con nuevos métodos
```

---

## 11. EJEMPLO DE FLUJO ACTUALIZADO

```
Usuario en GestionCertificacionesFormatos
    ↓
Ve formato en estado ENVIADO
    ↓
Hace clic "📦 Rendir Comprobante"
    ↓
Modal abre:
├─ Paso 1: Selecciona tipo_comprobante → FACTURA
│  └─ Modal muestra campos de proveedor
├─ Paso 2: Selecciona proveedor o crea nuevo
│  └─ Guarda en tabla proveedores
├─ Paso 3: Completa datos:
│  ├─ Número Comprobante: 001-0045
│  ├─ Fecha: 2026-04-06
│  └─ Monto: S/. 5000.00
└─ Paso 4: Selecciona rendiciones:
   ├─ Detalle 1: Viáticos (23.2.1.2.1) - Monto: 4060
   │  ├─ Tipo: ALIMENTACIÓN - Monto: 1200
   │  ├─ Tipo: HOSPEDAJE - Monto: 1960
   │  └─ Tipo: MOVILIDAD - Monto: 900
   └─ Detalle 2: Pasajes (23.2.1.2.2) - Monto: 940
      └─ (Sin tipo_viatitico)
    ↓
Backend valida:
├─ formato.estado_emision === ENVIADO ✓
├─ tipo_comprobante_id existe ✓
├─ proveedor_id existe (no NULL) ✓
├─ formato_emisiones_detalles_id válidos ✓
└─ Total rendiciones = Monto comprobante ✓
    ↓
Crea:
├─ 1 registro en comprobantes
│  ├─ tipo_comprobante_id: 1 (FACTURA)
│  ├─ proveedor_id: 42
│  └─ estado_rendicion: PENDIENTE
│
└─ 4 registros en rendiciones
   ├─ Rendición 1: formato_emisiones_detalles_id=100, tipo_viatitico=ALIMENTACIÓN, cantidad=1200
   ├─ Rendición 2: formato_emisiones_detalles_id=100, tipo_viatitico=HOSPEDAJE, cantidad=1960
   ├─ Rendición 3: formato_emisiones_detalles_id=100, tipo_viatitico=MOVILIDAD, cantidad=900
   └─ Rendición 4: formato_emisiones_detalles_id=101, tipo_viatitico=NULL, cantidad=940
    ↓
Modal cierra
    ↓
Usuario ve en GestionComprobantes:
├─ Comprobante nuevo
├─ Tipo: FACTURA
├─ Proveedor: EMPRESA XYZ S.A.C.
├─ Estado: PENDIENTE (naranja)
└─ 4 rendiciones asociadas
```

