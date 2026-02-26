# 📊 Reporte: Comisiones con Presupuesto Asignado

## 📌 Descripción

Este reporte permite visualizar todas las comisiones que tienen **estado de presupuesto `PRESUPUESTO ASIGNADO`** dentro de un rango de fechas específico.

**Requisito:** Las comisiones deben estar en estado `APROBADA` para aparecer en este reporte.

---

## 🔍 Filtros Disponibles

| Filtro | Tipo | Descripción | Ejemplo |
|--------|------|-------------|---------|
| `fechaInicio` | String | Fecha de inicio (YYYY-MM-DD) | `2026-01-01` |
| `fechaFin` | String | Fecha de fin (YYYY-MM-DD) | `2026-02-28` |

---

## 📡 Endpoint

### GET `/api/comisiones/reportes/presupuestos-asignados`

```bash
GET /api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-02-28
Authorization: Bearer <token>
```

---

## 📋 Estructura de Respuesta

```json
{
  "success": true,
  "periodo": {
    "inicio": "2026-01-01",
    "fin": "2026-02-28"
  },
  "resumen": {
    "totalComisiones": 5,
    "totalMonto": 45000.00,
    "totalCostoComision": 45000.00,
    "totalComisionados": 12
  },
  "comisiones": [
    {
      "id": 1,
      "ambito_id": 2,
      "ambito_nombre": "ALA LIMA",
      "usuario_id": 5,
      "usuario_nombre": "Juan Pérez",
      "lugar": "Cusco",
      "ruta": "Lima - Cusco",
      "modalidad_viaje": "TERRESTRE",
      "fecha_salida": "2026-01-15",
      "fecha_retorno": "2026-01-20",
      "num_dias": 5,
      "costo_xdia": 200.00,
      "observacion": "Inspección regional",
      "aprobacion_estado": "APROBADA",
      "presupuesto_estado": "PRESUPUESTO ASIGNADO",
      "presupuesto_documento": "DOC-2026-001",
      "presupuesto_numero_cut": "CUT-2026-001",
      "presupuesto_fecha": "2026-01-10",
      "cantidad_comisionados": 3,
      "monto_total": 9000.00,
      "costo_total_comision": 9000.00,
      "clasificadores": [
        {
          "id": 1,
          "nombre": "VIÁTICOS",
          "partida": "5.3.1.01.03",
          "cantidad_usuarios": 3,
          "monto": 3000.00
        },
        {
          "id": 2,
          "nombre": "PASAJES AÉREOS",
          "partida": "5.3.1.01.01",
          "cantidad_usuarios": 3,
          "monto": 6000.00
        }
      ],
      "personas": [
        {
          "usuario_id": 5,
          "nombre": "Juan Pérez",
          "clasificador": "VIÁTICOS",
          "partida_clasificador": "5.3.1.01.03",
          "dias": 5,
          "costo_xdia": 200.00,
          "monto": 1000.00
        },
        {
          "usuario_id": 6,
          "nombre": "María García",
          "clasificador": "PASAJES AÉREOS",
          "partida_clasificador": "5.3.1.01.01",
          "dias": 0,
          "costo_xdia": 0.00,
          "monto": 2000.00
        }
      ]
    }
  ]
}
```

---

## 🎯 Casos de Uso

### 1. Ver todas las comisiones con presupuesto asignado en Enero 2026

```bash
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Reporte de todo el trimestre

```bash
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-03-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Diferencia con Otros Reportes

| Reporte | Estado Presupuesto | Estado Aprobación | Rango de Fechas |
|---------|-------------------|-------------------|-----------------|
| **Presupuestos** | Cualquiera | Cualquiera | `presupuesto_fecha` |
| **Pendientes** | POR ASIGNAR / NULL | APROBADA | `fecha_salida` |
| **Asignados** (NUEVO) | PRESUPUESTO ASIGNADO | APROBADA | `presupuesto_fecha` |

---

## 📊 Información Incluida

### Por Comisión:
- ✅ ID y detalles básicos
- ✅ Ámbito y usuario solicitante
- ✅ Lugar, ruta y modalidad
- ✅ Fechas de viaje
- ✅ Costos unitarios y totales
- ✅ Estado de aprobación
- ✅ Documento de presupuesto asignado
- ✅ Número de CUT
- ✅ Fecha de asignación

### Por Clasificador:
- ✅ Partida presupuestal (ej: 5.3.1.01.03)
- ✅ Nombre del clasificador
- ✅ Cantidad de usuarios
- ✅ Monto total por clasificador

### Por Persona:
- ✅ Nombre del comisionado
- ✅ Clasificador asignado
- ✅ Partida presupuestal
- ✅ Días (si aplica)
- ✅ Costo por día
- ✅ Monto individual

---

## 📈 Resumen Total

El reporte incluye un resumen con:

```json
"resumen": {
  "totalComisiones": 5,      // Cantidad de comisiones
  "totalMonto": 45000.00,    // Suma de montos por comisionado
  "totalCostoComision": 45000.00,  // Suma de costos totales de comisiones
  "totalComisionados": 12    // Cantidad total de personas comisionadas
}
```

---

## ⚠️ Validaciones

- **Fechas requeridas:** `fechaInicio` y `fechaFin` son obligatorias
- **Formato:** Deben ser `YYYY-MM-DD`
- **Lógica de filtrado:** 
  - `presupuesto_fecha BETWEEN fechaInicio AND fechaFin`
  - `presupuesto_estado = 'PRESUPUESTO ASIGNADO'`
  - `aprobacion_estado = 'APROBADA'`

---

## 💡 Notas Importantes

1. **Presupuesto Asignado:** Significa que ya se ha documentado y aprobado el presupuesto
2. **Solo Aprobadas:** No muestra comisiones PENDIENTE_APROBACION o RECHAZADA
3. **Rango de Presupuesto:** Usa `presupuesto_fecha` (cuando se asignó), no la fecha de viaje
4. **Desglose Detallado:** Muestra cada persona y cada partida presupuestal

---

## 🔗 Relacionados

- [Reporte Presupuestos](./REPORTE_PRESUPUESTOS.md)
- [Reporte Presupuestos Pendientes](./REPORTE_PRESUPUESTOS_PENDIENTES.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)

