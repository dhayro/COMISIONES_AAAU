# 🎯 Guía Visual - Comisiones y Comisionados

## 📊 Estructura de Datos - Ejemplo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMISIÓN PRINCIPAL                            │
│  ID: 1                                                            │
│  Lugar: LIMA                                                      │
│  Ámbito: ALA PUCALLPA                                            │
│  Fecha Salida: 2026-02-10                                        │
│  Fecha Retorno: 2026-02-15                                       │
│  Número de Días: 5                                                │
│  Costo x Día: S/. 150.00                                         │
│  Modalidad: AEREO                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              COMISIONADOS (DETALLES)                     │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Comisionado 1:                                      │ │   │
│  │ │ • Usuario: DHAYRO KONG TORRES (ID: 2)             │ │   │
│  │ │ • Partida: 23.2.1.2.2 (VIÁTICOS)                  │ │   │
│  │ │ • Días: 5                                           │ │   │
│  │ │ • Costo x Día: S/. 150.00                          │ │   │
│  │ │ • MONTO CALCULADO: 5 × 150 = S/. 750.00          │ │   │
│  │ │ • Descripción: Viático oficial                     │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Comisionado 2:                                      │ │   │
│  │ │ • Usuario: CAROL MELANI ARCOS (ID: 3)             │ │   │
│  │ │ • Partida: 23.2.1.2.1 (PASAJES)                   │ │   │
│  │ │ • Días: 5                                           │ │   │
│  │ │ • Costo x Día: S/. 150.00                          │ │   │
│  │ │ • MONTO CALCULADO: 5 × 150 = S/. 750.00          │ │   │
│  │ │ • Descripción: Pasaje aéreo                        │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │             TOTAL COMISIÓN: S/. 1,500.00                │   │
│  │        (Suma de todos los montos de comisionados)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Tablas en Base de Datos

### TABLA: comisiones
```
┌────┬──────────┬───────┬────────────┬──────────────┬─────────────┐
│ id │ lugar    │ dias  │ costo_xdia │ modalidad    │ ambito_id   │
├────┼──────────┼───────┼────────────┼──────────────┼─────────────┤
│ 1  │ LIMA     │ 5     │ 150.00     │ AEREO        │ 1           │
└────┴──────────┴───────┴────────────┴──────────────┴─────────────┘
```

### TABLA: comision_comisionados (ESTA ES LA IMPORTANTE)
```
┌────┬─────────────┬────────────┬──────────────────┬──────┬────────────┐
│ id │ comision_id │ usuario_id │ clasificador_id  │ dias │ monto      │
├────┼─────────────┼────────────┼──────────────────┼──────┼────────────┤
│ 1  │ 1           │ 2          │ 1 (VIÁTICOS)     │ 5    │ 750.00     │
│ 2  │ 1           │ 3          │ 2 (PASAJES)      │ 5    │ 750.00     │
└────┴─────────────┴────────────┴──────────────────┴──────┴────────────┘
```

---

## 🔗 Relaciones - Cómo Se Conecta Todo

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIOS (users)                          │
│  ┌──────┬──────────────────────┐                               │
│  │ ID   │ nombre               │                               │
│  ├──────┼──────────────────────┤                               │
│  │ 1    │ Administrador        │ ─┐                            │
│  │ 2    │ DHAYRO KONG          │ ─┼────┐                       │
│  │ 3    │ CAROL MELANI ARCOS   │ ─┼────┼─┐                    │
│  │ ...  │ ...                  │  │    │ │                    │
│  └──────┴──────────────────────┘  │    │ │                    │
│                                   │    │ │                    │
│  ┌──────────────────────────────┐  │    │ │                   │
│  │      COMISIONES              │  │    │ │                   │
│  │ ┌──────┬──────────────────┐  │  │    │ │                   │
│  │ │ ID   │ lugar            │  │  │    │ │                   │
│  │ ├──────┼──────────────────┤  │  │    │ │                   │
│  │ │ 1    │ LIMA             │◄─┴──┘    │ │                   │
│  │ │      │ (usuario_id: 1)  │          │ │                   │
│  │ └──────┴──────────────────┘          │ │                   │
│  │       ▲                              │ │                   │
│  │       │                              │ │                   │
│  └───────┼──────────────────────────────┼─┼──────┐            │
│          │                              │ │      │            │
│          │  ┌──────────────────────────┐ │ │      │            │
│          │  │ COMISION_COMISIONADOS    │ │ │      │            │
│          │  │ ┌──────┬──────────────┐  │ │ │      │            │
│          │  │ │ ID   │ comision_id  │  │ │ │      │            │
│          │  │ ├──────┼──────────────┤  │ │ │      │            │
│          ├──┼─┤ 1    │ 1            │  │ │ │      │            │
│          │  │ │      │ usuario_id:2 │  │ │ │      │            │
│          │  │ │      │ clasificador_id:1│ │ │      │            │
│          │  │ ├──────┼──────────────┤  │ │ │      │            │
│          │  │ │ 2    │ 1            │  │ │ │      │            │
│          │  │ │      │ usuario_id:3 │◄─┘ │ │      │            │
│          │  │ │      │ clasificador_id:2│ │ │      │            │
│          │  │ └──────┴──────────────┘  │ │ │      │            │
│          │  └──────────────────────────┘ │ │      │            │
│          │                               │ │      │            │
│          │       ┌──────────────────────┐ │ │      │            │
│          │       │  CLASIFICADORES      │ │ │      │            │
│          │       │ ┌──────┬──────────┐  │ │ │      │            │
│          │       │ │ ID   │ partida  │  │ │ │      │            │
│          │       │ ├──────┼──────────┤  │ │ │      │            │
│          │       │ │ 1    │ 23.2.1.2.2  │◄┘ │      │            │
│          │       │ │ 2    │ 23.2.1.2.1  │◄──┘      │            │
│          │       │ └──────┴──────────┘  │         │            │
│          │       └──────────────────────┘         │            │
│          │                                        │            │
│          └────────────────────────────────────────┘            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         ÁMBITOS (ambitos)                                │  │
│  │ ┌──────┬──────────────┐                                 │  │
│  │ │ ID   │ nombre       │                                 │  │
│  │ ├──────┼──────────────┤                                 │  │
│  │ │ 1    │ ALA PUCALLPA │◄────────────┐                 │  │
│  │ │ 2    │ ALA ATALAYA  │             │                 │  │
│  │ └──────┴──────────────┘             │                 │  │
│  │                            (ambito_id de comisiones)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 Endpoint: GET /api/comisiones/1

### Request:
```bash
curl -X GET http://localhost:5000/api/comisiones/1 \
  -H "Authorization: Bearer <token>"
```

### Response JSON (ESTRUCTURA COMPLETA):
```json
{
  "id": 1,
  "ambito_id": 1,
  "ambito_nombre": "ALA PUCALLPA",
  "lugar": "LIMA",
  "ruta": "ALA Pucallpa → Lima",
  "modalidad_viaje": "AEREO",
  "fecha_salida": "2026-02-10T08:00:00.000Z",
  "fecha_retorno": "2026-02-15T18:00:00.000Z",
  "num_dias": 5,
  "costo_xdia": 150.00,
  "costo_total_comision": 1500.00,
  "observacion": null,
  "usuario_id": 1,
  "estado": "activa",
  "creado_en": "2026-02-06T12:00:00.000Z",
  "actualizado_en": "2026-02-06T12:00:00.000Z",
  
  "comisionados": [
    {
      "id": 1,
      "comision_id": 1,
      "usuario_id": 2,
      "usuario_nombre": "DHAYRO KONG TORRES",
      "clasificador_id": 1,
      "clasificador_nombre": "PASAJES Y GASTOS DE TRANSPORTE",
      "partida": "23.2.1.2.2",
      "dias": 5,
      "costo_xdia": 150.00,
      "monto": 750.00,
      "monto_real": 750.00,
      "descripcion": "Viático oficial",
      "observacion": null,
      "creado_en": "2026-02-06T12:00:00.000Z"
    },
    {
      "id": 2,
      "comision_id": 1,
      "usuario_id": 3,
      "usuario_nombre": "CAROL MELANI ARCOS BINDER",
      "clasificador_id": 2,
      "clasificador_nombre": "VIÁTICOS Y ASIGNACIONES POR COMISIÓN",
      "partida": "23.2.1.2.1",
      "dias": 5,
      "costo_xdia": 150.00,
      "monto": 750.00,
      "monto_real": 750.00,
      "descripcion": "Pasaje aéreo",
      "observacion": null,
      "creado_en": "2026-02-06T12:00:00.000Z"
    }
  ]
}
```

---

## ➕ Agregar Comisionado: POST /api/comisiones/1/comisionados

### Request:
```json
{
  "usuario_id": 4,
  "clasificador_id": 3,
  "dias": 5,
  "costo_xdia": 100.00,
  "monto": 500.00,
  "descripcion": "Combustible",
  "observacion": "Gastos de vehículo"
}
```

### Response:
```json
{
  "mensaje": "Comisionado agregado exitosamente",
  "id": 3
}
```

### Resultado en BD - Tabla comision_comisionados:
```
id | comision_id | usuario_id | clasificador_id | dias | monto  | descripcion
1  | 1           | 2          | 1               | 5    | 750.00 | Viático oficial
2  | 1           | 3          | 2               | 5    | 750.00 | Pasaje aéreo
3  | 1           | 4          | 3               | 5    | 500.00 | Combustible ← NUEVO
```

### Nuevo Total:
```
costo_total_comision = 750.00 + 750.00 + 500.00 = 2,000.00
```

---

## 🔄 Relación Única - CONSTRAINT ÚNICO

**La combinación (comision_id, usuario_id, clasificador_id) DEBE SER ÚNICA**

```
COMISIÓN 1:
✅ PERMITIDO: Usuario 2 + Partida 1 → VIÁTICOS
✅ PERMITIDO: Usuario 2 + Partida 2 → PASAJES (mismo usuario, diferente partida)
✅ PERMITIDO: Usuario 3 + Partida 1 → VIÁTICOS (diferente usuario, misma partida)
❌ NO PERMITIDO: Usuario 2 + Partida 1 → VIÁTICOS (repetido, error 1062 duplicate key)
```

---

## 📋 Casos de Uso Comunes

### Caso 1: Comisión con UN usuario en MÚLTIPLES partidas
```
Comisión 1: Viaje a Lima
├─ Usuario: DHAYRO KONG
│  ├─ Partida: VIÁTICOS → 750.00
│  └─ Partida: PASAJES → 800.00
└─ Total: 1,550.00
```

### Caso 2: Comisión con MÚLTIPLES usuarios
```
Comisión 2: Viaje a Arequipa
├─ Usuario: DHAYRO KONG → 500.00
├─ Usuario: CAROL ARCOS → 500.00
├─ Usuario: ALAN TELLO → 500.00
└─ Total: 1,500.00
```

### Caso 3: Comisión con múltiples usuarios en múltiples partidas
```
Comisión 3: Viaje a Cusco
├─ Usuario: DHAYRO (VIÁTICOS) → 600.00
├─ Usuario: DHAYRO (PASAJES) → 700.00
├─ Usuario: CAROL (VIÁTICOS) → 600.00
├─ Usuario: CAROL (COMBUSTIBLE) → 300.00
└─ Total: 2,200.00
```

---

## 🎯 Puntos Clave

1. **comision_comisionados es la tabla central** - Conecta todo
2. **Cada fila = UN usuario con UNA partida en UNA comisión**
3. **CONSTRAINT ÚNICO asegura no hay duplicados**
4. **monto_real se calcula: si VIÁTICOS entonces dias × costo_xdia, sino usar monto**
5. **Total comisión = suma de todos los monto_real de comisionados**
6. **Cascade delete: Al borrar comisión se borran automáticamente sus comisionados**
