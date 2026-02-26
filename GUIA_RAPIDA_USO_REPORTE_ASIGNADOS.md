# 🎯 Guía Rápida: Cómo Usar el Nuevo Reporte

## 📋 Resumen Rápido

Se implementó un **nuevo reporte** para ver comisiones con presupuesto asignado:

**Endpoint**: `GET /api/comisiones/reportes/presupuestos-asignados`

**Filtra por**: Comisiones APROBADAS con estado PRESUPUESTO ASIGNADO

---

## 🚀 Empezar Ahora

### Paso 1: Obtener Token JWT

Primero, inicia sesión:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ana.gob.pe",
    "password": "Autoridad1"
  }'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

Copia el valor de `token`.

---

### Paso 2: Llamar el Nuevo Endpoint

```bash
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Reemplaza:**
- `YOUR_TOKEN` por el token que obtuviste
- `fechaInicio` por la fecha de inicio (YYYY-MM-DD)
- `fechaFin` por la fecha de fin (YYYY-MM-DD)

---

### Paso 3: Ver Resultados

Obtendrás un JSON con:

```json
{
  "success": true,
  "periodo": {
    "inicio": "2026-01-01",
    "fin": "2026-02-28"
  },
  "resumen": {
    "totalComisiones": 3,
    "totalMonto": 30000,
    "totalCostoComision": 30000,
    "totalComisionados": 8
  },
  "comisiones": [
    {
      "id": 1,
      "ambito_nombre": "ALA LIMA",
      "usuario_nombre": "Juan Pérez",
      "lugar": "Cusco",
      "presupuesto_estado": "PRESUPUESTO ASIGNADO",
      "presupuesto_numero_cut": "CUT-2026-001",
      "presupuesto_fecha": "2026-01-10",
      "monto_total": 9000,
      "clasificadores": [
        {
          "nombre": "VIÁTICOS",
          "partida": "5.3.1.01.03",
          "cantidad_usuarios": 3,
          "monto": 3000
        }
      ],
      "personas": [
        {
          "nombre": "Juan Pérez",
          "clasificador": "VIÁTICOS",
          "monto": 1000
        },
        ...
      ]
    },
    ...
  ]
}
```

---

## 📝 Ejemplos Prácticos

### Ejemplo 1: Reportes de Enero 2026

```bash
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Ejemplo 2: Reportes del Trimestre

```bash
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-03-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Ejemplo 3: Reportes de Febrero

```bash
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-02-01&fechaFin=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing Automático

Si prefieres, usa el script de prueba:

```bash
# 1. Obten el token manualmente
export AUTH_TOKEN="tu_token_jwt"

# 2. Ejecuta el script
bash test-presupuestos-asignados.sh
```

El script automáticamente:
- ✅ Prueba el endpoint
- ✅ Muestra la respuesta
- ✅ Extrae el resumen
- ✅ Prueba validaciones

---

## 🌐 Vía Navegador (Swagger)

Si prefieres interfaz gráfica:

1. Abre: `http://localhost:5000/api-docs`
2. Busca: `presupuestos-asignados`
3. Haz clic en "Try it out"
4. Ingresa:
   - `fechaInicio`: 2026-01-01
   - `fechaFin`: 2026-02-28
5. Haz clic en "Execute"
6. ¡Listo! Verás la respuesta

---

## 📊 Qué Incluye el Reporte

### Información General
- ID de comisión
- Ámbito
- Usuario que la solicitó
- Lugar y ruta
- Fechas de viaje

### Presupuesto
- Estado: PRESUPUESTO ASIGNADO
- Número de CUT
- Documento presupuestario
- Fecha de asignación

### Desglose
- **Por Clasificador** (partida presupuestal):
  - Cantidad de usuarios
  - Monto total por clasificador
  
- **Por Persona** (comisionado):
  - Nombre
  - Clasificador
  - Monto individual
  - Días (si aplica)

### Resumen Total
- Total de comisiones
- Total de monto
- Total de comisionados

---

## 🔍 Filtros Disponibles

| Parámetro | Tipo | Requerido | Formato | Ejemplo |
|-----------|------|-----------|---------|---------|
| `fechaInicio` | String | ✅ SÍ | YYYY-MM-DD | 2026-01-01 |
| `fechaFin` | String | ✅ SÍ | YYYY-MM-DD | 2026-02-28 |

---

## ⚠️ Errores Comunes

### Error: "Se requieren fechaInicio y fechaFin"

**Causa**: No incluiste los parámetros

**Solución**:
```bash
# ❌ INCORRECTO
GET /reportes/presupuestos-asignados

# ✅ CORRECTO
GET /reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-02-28
```

### Error: "Formato de fecha inválido"

**Causa**: Formato de fecha incorrecto

**Solución**:
```bash
# ❌ INCORRECTO
?fechaInicio=01/01/2026&fechaFin=28/02/2026

# ✅ CORRECTO
?fechaInicio=2026-01-01&fechaFin=2026-02-28
```

### Error: "401 Unauthorized"

**Causa**: Token inválido o expirado

**Solución**:
1. Obtén un nuevo token con login
2. Verifica que incluyas "Bearer" antes del token

```bash
# ❌ INCORRECTO
-H "Authorization: eyJhbGciOi..."

# ✅ CORRECTO
-H "Authorization: Bearer eyJhbGciOi..."
```

---

## 📊 Diferencia con Otros Reportes

```
3 Reportes Disponibles:

1. Presupuestos Pendientes
   → Comisiones APROBADAS sin presupuesto
   → Usa fecha_salida
   → Para: Ver qué falta presupuestar

2. Presupuestos Asignados ⭐ NUEVO
   → Comisiones APROBADAS con presupuesto
   → Usa presupuesto_fecha
   → Para: Ver presupuestos documentados

3. Presupuestos General
   → TODOS los presupuestos
   → Usa presupuesto_fecha
   → Para: Auditoría completa
```

---

## 💡 Casos de Uso

### Caso 1: Supervisor Revisando Asignaciones Mensuales

```bash
# Ver qué presupuestos se asignaron en Enero
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-01-31" \
  -H "Authorization: Bearer $TOKEN" | jq '.resumen'
```

**Resultado esperado:**
```json
{
  "totalComisiones": 5,
  "totalMonto": 45000,
  "totalCostoComision": 45000,
  "totalComisionados": 12
}
```

### Caso 2: Administrativo Validando Documentos

```bash
# Ver todos los presupuestos con CUT
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-02-01&fechaFin=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | jq '.comisiones[] | {id, presupuesto_numero_cut, presupuesto_documento}'
```

### Caso 3: Director Revisando Presupuestos del Trimestre

```bash
# Ver presupuestos de todo el trimestre
curl -X GET \
  "http://localhost:5000/api/comisiones/reportes/presupuestos-asignados?fechaInicio=2026-01-01&fechaFin=2026-03-31" \
  -H "Authorization: Bearer $TOKEN" | jq '.resumen'
```

---

## 🎯 Próximos Pasos

1. ✅ Prueba el endpoint con el ejemplo anterior
2. ✅ Integra en tu dashboard/reportes
3. ✅ Genera reportes periódicos
4. ✅ Audita presupuestos por ámbito

---

## 📖 Documentación Completa

- 📚 [Guía Completa del Reporte](./REPORTE_PRESUPUESTOS_ASIGNADOS.md)
- 📊 [Comparativa de 3 Reportes](./GUIA_REPORTES_PRESUPUESTO.md)
- 📖 [API Documentation](./backend/API_DOCUMENTATION.md)
- 🧪 [Script de Prueba](./test-presupuestos-asignados.sh)

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| ¿Cómo obtengo el token? | Haz POST a `/api/auth/login` |
| ¿Cómo cambio las fechas? | Modifica `fechaInicio` y `fechaFin` |
| ¿Qué información incluye? | Ver sección "Qué Incluye el Reporte" |
| ¿Hay otras opciones de filtrado? | Solo por fechas, ver los 3 reportes |
| ¿Cómo automatizo esto? | Usa el script `test-presupuestos-asignados.sh` |

---

**¡Listo para usar!** 🚀

