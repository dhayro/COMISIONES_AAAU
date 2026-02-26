# 🏗️ ARQUITECTURA - MÓDULO REPORTES PRESUPUESTOS

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (USUARIO)                      │
│                                                                   │
│   http://localhost:3000/reportes/presupuestos                   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │   ReportePresupuestos│      │   Gestion Comisiones │
        │     (React Comp)     │      │   (React Comp)       │
        │                      │      │                      │
        │ - Filtros (mes/rango)│      │ - CRUD Comisiones   │
        │ - DataTable          │      │ - Presupuesto Modal │
        │ - Resumen            │      │ - PDF Generation    │
        │ - PDF Generator      │      └──────────────────────┘
        └──────────┬───────────┘
                   │
                   │ React Hooks (useState, useEffect)
                   │
        ┌──────────▼───────────┐
        │   api.js (Service)   │
        │                      │
        │ - request() helper   │
        │ - obtenerReporte...()│
        │ - otros métodos      │
        └──────────┬───────────┘
                   │
                   │ HTTP GET Request
                   │
    ┌──────────────▼────────────────────────────────────┐
    │                                                    │
    │  Backend: Node.js/Express                         │
    │  http://localhost:3001/api/reportes/presupuestos  │
    │                                                    │
    │  ┌────────────────────────────────────────────┐  │
    │  │ Route (comisiones.js)                      │  │
    │  │                                            │  │
    │  │ GET /reportes/presupuestos                │  │
    │  │  └─> Controller: obtenerReportePresupuestos│  │
    │  └────────────┬───────────────────────────────┘  │
    │               │                                   │
    │  ┌────────────▼──────────────────────────────┐  │
    │  │ Controller (comisionController.js)        │  │
    │  │                                           │  │
    │  │ exports.obtenerReportePresupuestos        │  │
    │  │  ├─ Validar parámetros (fechaInicio/Fin) │  │
    │  │  ├─ Validar formato YYYY-MM-DD          │  │
    │  │  ├─ Llamar modelo/query                  │  │
    │  │  ├─ Calcular totales                    │  │
    │  │  └─ Retornar JSON                       │  │
    │  └────────────┬──────────────────────────────┘  │
    │               │                                   │
    │  ┌────────────▼──────────────────────────────┐  │
    │  │ Database Query (MySQL)                    │  │
    │  │                                           │  │
    │  │ SELECT * FROM comisiones c                │  │
    │  │ LEFT JOIN ambitos a ...                  │  │
    │  │ LEFT JOIN comision_comisionados cc ...   │  │
    │  │ WHERE c.presupuesto_estado =             │  │
    │  │       'PRESUPUESTO ASIGNADO'             │  │
    │  │ AND c.presupuesto_fecha BETWEEN ?     AND ?  │
    │  │ GROUP BY c.id                           │  │
    │  │                                           │  │
    │  │ Calcula:                                 │  │
    │  │  - COUNT(DISTINCT usuario_id)           │  │
    │  │  - SUM(monto)                           │  │
    │  └────────────┬──────────────────────────────┘  │
    │               │                                   │
    │  ┌────────────▼──────────────────────────────┐  │
    │  │ MySQL Database                           │  │
    │  │                                           │  │
    │  │ Tables:                                  │  │
    │  │  ├─ comisiones (con presupuesto_*)     │  │
    │  │  ├─ comision_comisionados               │  │
    │  │  ├─ ambitos                             │  │
    │  │  └─ users                               │  │
    │  └────────────────────────────────────────────┘  │
    │                                                    │
    └────────────────────────────────────────────────────┘
                       │
                       │ JSON Response
                       │
        ┌──────────────▼───────────┐
        │  Frontend Processing     │
        │                          │
        │ - Parse JSON            │
        │ - Calculate totals      │
        │ - Populate DataTable    │
        │ - Show Summary Box      │
        └──────────────┬───────────┘
                       │
        ┌──────────────▼───────────────────────────┐
        │  User Interface                          │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │ Filtros                             │ │
        │  │ [Por Mes ▼] o [Por Rango de Fechas]│ │
        │  └─────────────────────────────────────┘ │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │ DataTable (Búsqueda, Paginación)    │ │
        │  │                                     │ │
        │  │ ID │ Ámbito │ Lugar │ Documento ... │ │
        │  │ ───┼────────┼───────┼──────────────│ │
        │  │  1 │ SCTM   │ S.D.  │ RD 123/2024 │ │
        │  │  2 │ Otro   │ SGO   │ RES 456/24  │ │
        │  │                                     │ │
        │  └─────────────────────────────────────┘ │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │ Resumen (Totales)                   │ │
        │  │                                     │ │
        │  │ Total Comisiones: 15                │ │
        │  │ Total Comisionados: 45              │ │
        │  │ Monto Total: S/. 125,000.00        │ │
        │  └─────────────────────────────────────┘ │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │ [Generar PDF] 📥                   │ │
        │  └─────────────────────────────────────┘ │
        │                                          │
        └──────────────────────────────────────────┘
                       │
                       │ (Si genera PDF)
                       │
        ┌──────────────▼───────────────────────────┐
        │  PDF Generation (jsPDF + autoTable)      │
        │                                          │
        │  ┌─────────────────────────────────────┐ │
        │  │ Reporte de Presupuestos Asignados   │ │
        │  │                                     │ │
        │  │ Período: Enero 2024                 │ │
        │  │ Fecha: 15/01/2024                  │ │
        │  │                                     │ │
        │  │ ┌───┬────────┬───────┬──────────┐   │ │
        │  │ │ID │ Ámbito │ Lugar │Documento │   │ │
        │  │ ├───┼────────┼───────┼──────────┤   │ │
        │  │ │ 1 │  SCTM  │ S.D.  │RD123/2024│   │ │
        │  │ │ 2 │  Otro  │ SGO   │RES456/24 │   │ │
        │  │ └───┴────────┴───────┴──────────┘   │ │
        │  │                                     │ │
        │  │ Total Comisiones: 15                │ │
        │  │ Monto Total: S/. 125,000.00        │ │
        │  │                                     │ │
        │  │ Página 1 de 1                       │ │
        │  └─────────────────────────────────────┘ │
        │                                          │
        │  ✅ PDF descargado a: Descargas/        │ │
        │     Reporte_Presupuestos_1705...pdf    │ │
        │                                          │
        └──────────────────────────────────────────┘
```

---

## Flujo de Datos Detallado

### 1. **Usuario Selecciona Filtros**

```
┌─────────────────────────────────────────┐
│ Página: ReportePresupuestos             │
│                                         │
│ [✓ Por Mes] [  Por Rango de Fechas]   │
│                                         │
│ Mes: [2024-01 ▼]                       │
│                                         │
│ [Generar Reporte] button                │
└─────────────────────────────────────────┘
           │
           │ onClick: generarReporte()
           ▼
```

### 2. **Validación y Cálculo de Fechas**

```javascript
generarReporte() {
  // Si es por mes:
  const [year, month] = mesSeleccionado.split('-');
  inicio = `${year}-${month}-01`;
  fin = `${year}-${month}-${ultimoDía}`;
  
  // Si es por rango:
  inicio = fechaInicio;
  fin = fechaFin;
}
```

### 3. **Llamada a API**

```javascript
const response = await api.obtenerReportePresupuestos(inicio, fin);
// GET http://localhost:3001/api/reportes/presupuestos?
//     fechaInicio=2024-01-01&fechaFin=2024-01-31
```

### 4. **Procesamiento en Backend**

```javascript
exports.obtenerReportePresupuestos = async (req, res) => {
  // 1. Obtener parámetros
  const { fechaInicio, fechaFin } = req.query;
  
  // 2. Validar parámetros
  if (!fechaInicio || !fechaFin) → Error 400
  
  // 3. Validar formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) → Error 400
  
  // 4. Consultar BD
  SELECT ... WHERE presupuesto_fecha BETWEEN ? AND ?
  
  // 5. Calcular totales
  totalComisiones = length
  totalMonto = SUM(monto_total)
  totalComisionados = SUM(cantidad_comisionados)
  
  // 6. Retornar JSON
  res.json({
    success: true,
    resumen: { totalComisiones, totalMonto, totalComisionados },
    comisiones: [...]
  })
}
```

### 5. **Rendering del Frontend**

```
setDatos(response)
setTotales(calcular)
    │
    ▼
┌─────────────────────────────────────────┐
│ DataTable                               │
│ ┌─────────────────────────────────────┐ │
│ │ ID │ Ámbito │ Lugar │ Documento ... │ │
│ │────┼────────┼───────┼──────────────│ │
│ │ 1  │ SCTM   │ S.D.  │ RD 123/2024  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Resumen Box:                            │
│ Total Comisiones: 1                     │
│ Monto Total: S/. 10,000.00            │
└─────────────────────────────────────────┘
```

### 6. **Generación de PDF**

```javascript
generarPDF() {
  // 1. Crear documento jsPDF
  const doc = new jsPDF();
  
  // 2. Agregar encabezado
  doc.text('Reporte de Presupuestos Asignados', ...)
  
  // 3. Crear tabla con autoTable
  doc.autoTable({
    columns: [...],
    body: datos.map(...)
  })
  
  // 4. Agregar totales
  doc.text(`Total: ${totales.montoTotal}`, ...)
  
  // 5. Descargar
  doc.save(`Reporte_Presupuestos_${timestamp}.pdf`)
}
```

---

## Estructura de Base de Datos Involucrada

### Tabla: comisiones
```sql
id (PK)
ambito_id (FK)
lugar
ruta
modalidad_viaje
fecha_salida
fecha_retorno
num_dias
costo_xdia
observacion
usuario_id
presupuesto_estado      ← NUEVO
presupuesto_documento   ← NUEVO
presupuesto_numero_cut  ← NUEVO
presupuesto_fecha       ← NUEVO
created_at
updated_at
```

### Tabla: comision_comisionados
```sql
id (PK)
comision_id (FK)
usuario_id (FK)
monto
partida_id (FK)
created_at
```

### Tabla: ambitos
```sql
id (PK)
nombre
descripcion
```

### Query Principal

```sql
SELECT 
  c.id,
  c.ambito_id,
  a.nombre as ambito_nombre,
  c.lugar,
  c.ruta,
  c.modalidad_viaje,
  c.fecha_salida,
  c.fecha_retorno,
  c.num_dias,
  c.costo_xdia,
  c.observacion,
  c.presupuesto_estado,
  c.presupuesto_documento,
  c.presupuesto_numero_cut,
  c.presupuesto_fecha,
  COUNT(DISTINCT cc.usuario_id) as cantidad_comisionados,
  SUM(cc.monto) as monto_total
FROM comisiones c
LEFT JOIN ambitos a ON c.ambito_id = a.id
LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
WHERE c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
  AND c.presupuesto_fecha BETWEEN ? AND ?
GROUP BY c.id
ORDER BY c.presupuesto_fecha DESC, c.id DESC
```

---

## Estructura de Respuesta JSON

```json
{
  "success": true,
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-12-31",
  "resumen": {
    "totalComisiones": 15,
    "totalMonto": 125000.00,
    "totalComisionados": 45
  },
  "comisiones": [
    {
      "id": 1,
      "ambito_id": 1,
      "ambito_nombre": "SCTM",
      "lugar": "Santo Domingo",
      "ruta": "La Vega - S.D.",
      "modalidad_viaje": "TERRESTRE",
      "fecha_salida": "2024-01-10",
      "fecha_retorno": "2024-01-15",
      "num_dias": 5,
      "costo_xdia": 2000,
      "observacion": "Reunión de coordinación",
      "presupuesto_estado": "PRESUPUESTO ASIGNADO",
      "presupuesto_documento": "RD 123/2024",
      "presupuesto_numero_cut": "CUT-2024-001",
      "presupuesto_fecha": "2024-01-15",
      "cantidad_comisionados": 3,
      "monto_total": 10000
    },
    {
      "id": 2,
      "ambito_id": 2,
      "ambito_nombre": "Otro Ámbito",
      "lugar": "Santiago",
      "ruta": "S.D. - Santiago",
      "modalidad_viaje": "AÉREO",
      "fecha_salida": "2024-02-15",
      "fecha_retorno": "2024-02-20",
      "num_dias": 5,
      "costo_xdia": 3000,
      "observacion": "Inspección",
      "presupuesto_estado": "PRESUPUESTO ASIGNADO",
      "presupuesto_documento": "RES 456/2024",
      "presupuesto_numero_cut": "CUT-2024-002",
      "presupuesto_fecha": "2024-02-20",
      "cantidad_comisionados": 2,
      "monto_total": 15000
    }
  ]
}
```

---

## Estados y Transiciones

```
Estado del Reporte:
┌─────────────┐
│   Inicial   │
│ (Sin datos) │
└──────┬──────┘
       │ Usuario selecciona filtros
       │ y hace clic "Generar"
       ▼
┌──────────────────┐
│    Loading       │
│ (Consultando BD) │
└──────┬───────────┘
       │
       ├─ Si hay error → Error Message
       │
       ├─ Si no hay datos → Info Message
       │
       └─ Si hay datos
         ▼
┌──────────────────┐
│    Cargado       │
│ (Mostrando datos)│
└──────┬───────────┘
       │ Usuario puede:
       ├─ Buscar en tabla
       ├─ Cambiar página
       ├─ Ordenar columnas
       └─ Generar PDF
```

---

## Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│ React 18.2.0                                                │
│ Material-UI (MUI) 5.x                                       │
│ jsPDF 2.5.0                                                 │
│ jspdf-autotable 3.5.0                                       │
│ DataTable (Custom Component)                                │
│ SweetAlert2 (para alertas)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP JSON
                            │
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│ Node.js 14+                                                 │
│ Express 4.x                                                 │
│ JWT para autenticación                                      │
│ CORS habilitado                                             │
│ Middleware de validación                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            │
┌─────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                          │
├─────────────────────────────────────────────────────────────┤
│ MySQL 5.7+                                                  │
│ Pool de conexiones (mysql2)                                 │
│ Stored Procedures (opcional)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Matriz de Responsabilidades

| Componente | Responsabilidad |
|---|---|
| **ReportePresupuestos.js** | Interfaz, filtros, DataTable, PDF trigger |
| **api.js** | Comunicación HTTP |
| **routes/comisiones.js** | Rutas HTTP y documentación Swagger |
| **comisionController.js** | Lógica de negocio, validaciones, cálculos |
| **Database** | Almacenamiento de datos, queries |
| **jsPDF** | Generación de documentos PDF |
| **DataTable** | Visualización de datos con búsqueda/paginación |

---

**Arquitectura Completada ✅**

