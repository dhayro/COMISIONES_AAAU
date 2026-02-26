# 📊 Guía Completa de Reportes de Presupuesto

## 🎯 Resumen Ejecutivo

El sistema cuenta con **3 reportes principales** para supervisar el estado del presupuesto en diferentes etapas:

| Estado | Reporte | Endpoint | Cuándo Usar |
|--------|---------|----------|------------|
| 📋 **Por Asignar** | Presupuestos Pendientes | `/reportes/presupuestos-pendientes` | Ver comisiones aprobadas esperando asignación |
| ✅ **Asignado** | Presupuestos Asignados | `/reportes/presupuestos-asignados` | Ver comisiones con presupuesto documentado |
| 📑 **Cualquiera** | Presupuestos | `/reportes/presupuestos` | Auditoría completa de todos los presupuestos |

---

## 1️⃣ Reporte: Presupuestos Pendientes

### ¿Qué es?
Comisiones que están **APROBADAS** pero **NO tienen presupuesto asignado** aún.

### Endpoint
```
GET /api/comisiones/reportes/presupuestos-pendientes?fechaInicio=2026-01-01&fechaFin=2026-02-28
```

### Filtros
- **fechaInicio** (requerido): Fecha de inicio del viaje (YYYY-MM-DD)
- **fechaFin** (requerido): Fecha de fin del viaje (YYYY-MM-DD)

### Condiciones de Filtrado
```sql
WHERE c.fecha_salida BETWEEN ? AND ?
  AND (c.presupuesto_estado IS NULL OR c.presupuesto_estado = 'PRESUPUESTO POR ASIGNAR')
  AND c.aprobacion_estado = 'APROBADA'
```

### Casos de Uso
✅ Supervisar → Ver comisiones aprobadas que faltan presupuesto  
✅ Validar → Identificar qué requiere asignación  
✅ Planificar → Conocer montos pendientes de presupuestar  

### Ejemplo de Respuesta
```json
{
  "success": true,
  "periodo": {
    "inicio": "2026-01-01",
    "fin": "2026-02-28"
  },
  "comisiones": [
    {
      "id": 5,
      "usuario_nombre": "Juan Pérez",
      "lugar": "Cusco",
      "aprobacion_estado": "APROBADA",
      "presupuesto_estado": null,  // ← SIN PRESUPUESTO
      "monto_total": 9000.00,
      "personas": [...]
    }
  ]
}
```

---

## 2️⃣ Reporte: Presupuestos Asignados (NUEVO)

### ¿Qué es?
Comisiones que están **APROBADAS** Y ya tienen **PRESUPUESTO ASIGNADO**.

### Endpoint
```
GET /api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-02-28
```

### Filtros
- **fechaInicio** (requerido): Fecha de asignación presupuestaria (YYYY-MM-DD)
- **fechaFin** (requerido): Fecha de asignación presupuestaria (YYYY-MM-DD)

### Condiciones de Filtrado
```sql
WHERE c.presupuesto_fecha BETWEEN ? AND ?
  AND c.presupuesto_estado = 'PRESUPUESTO ASIGNADO'
  AND c.aprobacion_estado = 'APROBADA'
```

### Casos de Uso
✅ Supervisar → Ver presupuestos ya documentados  
✅ Validar → Verificar presupuestos procesados  
✅ Auditar → Revisar asignaciones en período determinado  

### Ejemplo de Respuesta
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
      "usuario_nombre": "Juan Pérez",
      "lugar": "Cusco",
      "aprobacion_estado": "APROBADA",
      "presupuesto_estado": "PRESUPUESTO ASIGNADO",  // ← CON PRESUPUESTO
      "presupuesto_numero_cut": "CUT-2026-001",
      "presupuesto_fecha": "2026-01-10",
      "monto_total": 9000.00,
      "personas": [...]
    }
  ]
}
```

---

## 3️⃣ Reporte: Presupuestos (General)

### ¿Qué es?
**Todos** los presupuestos asignados (independientemente de su estado de aprobación).

### Endpoint
```
GET /api/comisiones/reportes/presupuestos?fechaInicio=2026-01-01&fechaFin=2026-02-28
```

### Filtros
- **fechaInicio** (requerido): Fecha de asignación presupuestaria (YYYY-MM-DD)
- **fechaFin** (requerido): Fecha de asignación presupuestaria (YYYY-MM-DD)

### Condiciones de Filtrado
```sql
WHERE c.presupuesto_fecha BETWEEN ? AND ?
-- Sin filtro por aprobación: incluye todos los estados
```

### Casos de Uso
✅ Auditar → Historial completo de presupuestos  
✅ Análisis → Presupuestos por ámbito, usuario, etc.  
✅ Reportes → Información general para directivos  

### Información Incluida
- Presupuestos ASIGNADOS
- Presupuestos EN PENDIENTE (si los hay)
- Comisiones aprobadas y no aprobadas

---

## 📊 Matriz de Comparación

| Aspecto | Presupuestos Pendientes | Presupuestos Asignados | Presupuestos |
|--------|----------------------|----------------------|-------------|
| **Estado Presupuesto** | POR ASIGNAR / NULL | PRESUPUESTO ASIGNADO | Cualquiera |
| **Estado Aprobación** | APROBADA | APROBADA | Cualquiera |
| **Rango de Fechas** | `fecha_salida` | `presupuesto_fecha` | `presupuesto_fecha` |
| **Casos de Uso** | Supervisar pendientes | Auditar asignados | Análisis general |
| **Endpoint** | `/reportes/presupuestos-pendientes` | `/reportes/presupuestos-asignados` | `/reportes/presupuestos` |
| **Información Detallada** | Sí | Sí | Sí |
| **Incluye CUT** | No | Sí | Sí |
| **Incluye Personas** | Sí | Sí | Sí |

---

## 🔍 Flujo de una Comisión

```
1. USUARIO CREA → presupuesto_estado = NULL
   ↓
2. JEFE/ADMIN APRUEBA → aprobacion_estado = APROBADA
   ↓
3. ADMINISTRATIVO ASIGNA PRESUPUESTO → presupuesto_estado = PRESUPUESTO ASIGNADO
                                        presupuesto_fecha = HOY
                                        presupuesto_numero_cut = CUT-XXXX
   ↓
4. COMISIÓN SUPERVISADA
   - Reportes Pendientes: NO aparece (ya tiene presupuesto)
   - Reportes Asignados: SÍ aparece (tiene presupuesto asignado)
   - Reportes General: SÍ aparece (historial completo)
```

---

## 💡 Recomendaciones de Uso

### Para Supervisor (Rol: Jefe)
```bash
# Ver comisiones aprobadas pendientes de presupuesto
GET /reportes/presupuestos-pendientes?fechaInicio=2026-01-01&fechaFin=2026-01-31

# Seguimiento: ¿Cuáles ya tienen presupuesto?
GET /reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-01-31
```

### Para Administrativo (Rol: Administrativo)
```bash
# Ver presupuestos que he asignado en el mes
GET /reportes/presupuestos-asignados?fechaInicio=2026-02-01&fechaFin=2026-02-28
```

### Para Directivo (Rol: Admin)
```bash
# Análisis completo del trimestre
GET /reportes/presupuestos?fechaInicio=2026-01-01&fechaFin=2026-03-31
```

---

## ⚠️ Notas Importantes

### Sobre Fechas
- **Presupuestos Pendientes:** Usa `fecha_salida` del viaje
- **Presupuestos Asignados:** Usa `presupuesto_fecha` (cuándo se asignó)
- **Presupuestos General:** Usa `presupuesto_fecha` (cuándo se asignó)

### Sobre Aprobación
- Los reportes de presupuestos filtran por `aprobacion_estado = 'APROBADA'`
- Excepto el reporte general que muestra TODO

### Sobre Montos
- `monto_total`: Suma de los montos de comisionados
- `costo_total_comision`: Costo calculado de la comisión
- `monto_clasificador`: Suma por clasificador presupuestal

---

## 🔗 Recursos Relacionados

- [Documentación: Presupuestos Pendientes](./REPORTE_PRESUPUESTOS_PENDIENTES.md)
- [Documentación: Presupuestos Asignados](./REPORTE_PRESUPUESTOS_ASIGNADOS.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Script de Prueba](./test-presupuestos-asignados.sh)

---

## 📞 Soporte

Para consultas sobre reportes:
1. Verifica que estés en el rol correcto (jefe, administrativo, admin)
2. Consulta los ejemplos de cada reporte
3. Revisa los filtros disponibles
4. Ejecuta los tests incluidos

