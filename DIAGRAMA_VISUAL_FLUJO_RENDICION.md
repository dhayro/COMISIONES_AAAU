# 📊 Diagrama Visual: Flujo de Rendición Completo

## 1. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUARIO FINAL (Navegador)                   │
│                     Puerto 3000 (Frontend)                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Abre Modal "Rendir"
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              EmisionFormatos.js (React Component)               │
│                                                                  │
│ State:                                                          │
│  • formatoSeleccionadoParaRendir = {id, codigo, ...}          │
│  • comprobantesAgregadosPorPartida = {                          │
│      partida_1: [...comprobantes],                             │
│      partida_2: [...comprobantes]                              │
│    }                                                             │
│  • datosRendicion = {monto, proveedor, ...}                    │
│  • tipoRendicion = "viaticos" | "declaracion_jurada"           │
│                                                                  │
│ Functions:                                                      │
│  • handleAbrirModalRendicion(formato)  ← Click en tabla        │
│  • handleAgregarComprobante()           ← Click "Agregar"      │
│  • handleEnviarRendicion(formatoParam)  ← Click "Enviar"       │
│  • obtenerTodosLosComprobantes()        ← Flattens all         │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ JSON con comprobantes
                      │ POST /rendiciones/crear
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API Service (api.request)                     │
│                                                                  │
│  • Base URL: http://localhost:5000/api                         │
│  • Método: POST                                                │
│  • Headers: Content-Type: application/json                     │
│  • Payload: {                                                   │
│      formato_emision_id: 123,                                   │
│      comprobantes: [{...}, {...}]                              │
│    }                                                             │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP POST
                      │ Puerto 5000
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│               Backend Node.js + Express                         │
│                    Puerto 5000                                  │
│                                                                  │
│  Route: POST /api/rendiciones/crear                            │
│  Controller: rendicionesController.crearRendicion()            │
│                                                                  │
│  Lógica:                                                        │
│   1. Validar formato existe y estado = ENVIADO                 │
│   2. Crear registro en rendiciones_maestras                    │
│   3. Insertar N registros en rendicion_comprobantes            │
│   4. Actualizar formato.estado = RENDIDO                       │
│   5. Responder con { success, rendicion }                      │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ JSON Response
                      │ 201 Created
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              Frontend recibe respuesta exitosa                  │
│                                                                  │
│  • Mostrar SweetAlert "✅ Rendición enviada"                   │
│  • Mostrar ID de rendición y total                             │
│  • Cerrar modal                                                │
│  • Recargar tabla de comisiones                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Base de Datos MySQL                          │
│                                                                  │
│  Tabla: rendiciones_maestras                                   │
│  ┌─────────────────────────────────────────┐                   │
│  │ id: 1                                   │                   │
│  │ formato_emision_id: 123                 │                   │
│  │ estado: ACTIVA                          │                   │
│  │ fecha_rendicion: 2024-01-15             │                   │
│  │ observaciones_general: NULL             │                   │
│  └─────────────────────────────────────────┘                   │
│                      │                                          │
│                      ↓                                          │
│  Tabla: rendicion_comprobantes (N registros)                   │
│  ┌─────────────────────────────────────────┐                   │
│  │ id: 1                                   │                   │
│  │ rendicion_id: 1  ← FK a maestras        │                   │
│  │ formato_emisiones_detalles_id: 5        │                   │
│  │ numero_comprobante: 001-0001            │                   │
│  │ monto: 50.00                            │                   │
│  │ proveedor_id: 42                        │                   │
│  │ fecha_comprobante: 2024-01-10           │                   │
│  └─────────────────────────────────────────┘                   │
│  ┌─────────────────────────────────────────┐                   │
│  │ id: 2                                   │                   │
│  │ rendicion_id: 1  ← FK a maestras        │                   │
│  │ ... (siguiente comprobante)             │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                  │
│  Tabla: formato_emisiones (actualizado)                        │
│  ┌─────────────────────────────────────────┐                   │
│  │ id: 123                                 │                   │
│  │ codigo: CCUP/001/2024                   │                   │
│  │ estado: RENDIDO ← Cambió de ENVIADO     │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Flujo Secuencial - Abriendo Modal

```
1. Usuario hace clic en "Rendir" (en fila de tabla)
   ↓
2. onClick → handleAbrirModalRendicion(formato)
   ↓
3. Estado actualizado:
   • setFormatoSeleccionadoParaRendir(formato)
   • setComprobantesAgregadosPorPartida({})
   • setModalAbierto(true)
   ↓
4. Modal renderiza:
   • Tabla vacía de comprobantes
   • Form para agregar comprobantes
   • Botón "Enviar" deshabilitado
```

## 3. Flujo Secuencial - Agregando Comprobantes

```
1. Usuario selecciona:
   • Partida: "ALIMENTOS"
   • Tipo de Rendición: "FACTURA"
   • Tipo Comprobante: "Boleta"
   • Proveedor: "Rest. XYZ"
   • Número: "001-0001"
   • Monto: "50.00"
   ↓
2. Usuario hace clic en "Agregar Comprobante"
   ↓
3. onClick → handleAgregarComprobante()
   ↓
4. Validaciones:
   • ¿Monto > 0? → Sí, continuar
   • ¿Disponible suficiente? → Calcular...
   • ¿Proveedor requerido? → Depende de tipoRendicion
   ↓
5. Si todo OK:
   • Crear objeto comprobante
   • setComprobantesAgregadosPorPartida({
       ...anterior,
       ALIMENTOS: [...anterior.ALIMENTOS, nuevoComprobante]
     })
   ↓
6. Limpiar form
   ↓
7. Tabla se actualiza - Mostrar nuevo comprobante
```

## 4. Flujo Secuencial - Enviando Rendición (FIX NUEVO)

```
1. Usuario hace clic en "Enviar Rendición"
   ↓
2. onClick DISPATCHER:
   onClick={() => handleEnviarRendicion(formatoSeleccionadoParaRendir)}
                                       ↑
                   Captura el valor EN ESTE MOMENTO
   ↓
3. handleEnviarRendicion(formatoParam) recibe:
   • formatoParam = {id: 123, codigo: "...", ...}
   ↓
4. Validaciones:
   • ¿Hay comprobantes? → Sí
   • const formato = formatoParam || formatoSeleccionadoParaRendir
   • ¿formato.id existe? → Sí
   ↓
5. Preparar payload:
   const datosRendicionFinal = {
     formato_emision_id: 123,
     comprobantes: [
       {
         formato_emision_detalle_id: 5,
         numero_comprobante: "001-0001",
         monto: 50.00,
         proveedor_id: 42,
         ...
       }
     ]
   }
   ↓
6. Enviar a backend:
   api.request('/rendiciones/crear', {
     method: 'POST',
     body: JSON.stringify(datosRendicionFinal)
   })
   ↓
7. Esperar respuesta del backend
   ↓
8. Si exitoso (201):
   • Mostrar SweetAlert con éxito
   • Cerrar modal
   • Recargar tabla
   ↓
9. Si error:
   • Mostrar SweetAlert con error
   • Modal se mantiene abierto
   • Usuario puede reintentar
```

## 5. Mapeó de Datos - Flujo Entrada → BD

```
ENTRADA (Frontend)
└─ datosRendicion
   ├─ formato_emision_id: 123
   ├─ tipoRendicion: "viaticos"
   ├─ clasificadorSeleccionado: {...}
   └─ comprobantesAgregadosPorPartida
      └─ ALIMENTOS: [
           {
             formato_emision_detalle_id: 5,
             numero_comprobante: "001-0001",
             monto: 50.00,
             fecha_comprobante: "2024-01-10",
             tipo_comprobante_id: 1,
             proveedor_id: 42,
             tipo_viatico: "transporte",
             tipo_rendicion: "viaticos",
             observaciones: "Compra en mercado"
           }
         ]

CONVERSIÓN (Frontend - obtenerTodosLosComprobantes)
└─ Flatten todas las partidas en un array único

ENVÍO (API Request)
└─ POST /rendiciones/crear
   ├─ formato_emision_id: 123
   └─ comprobantes: [...]

PROCESAMIENTO (Backend)
└─ Controller crearRendicion()
   ├─ Validar formato
   ├─ Crear rendiciones_maestras
   │  ├─ id: AUTO
   │  ├─ formato_emision_id: 123
   │  ├─ estado: "ACTIVA"
   │  └─ fecha_rendicion: NOW()
   │
   └─ Para cada comprobante:
      └─ Crear rendicion_comprobantes
         ├─ id: AUTO
         ├─ rendicion_id: (id de maestra)
         ├─ numero_comprobante: "001-0001"
         ├─ monto: 50.00
         ├─ proveedor_id: 42
         ├─ tipo_comprobante_id: 1
         └─ ... (todos los campos)

PERSISTENCIA (Base de Datos)
└─ rendiciones_maestras
   └─ [1 registro - la rendición principal]
└─ rendicion_comprobantes
   └─ [N registros - uno por cada comprobante]
└─ formato_emisiones
   └─ [1 registro - actualizado estado a RENDIDO]
```

## 6. Estados Posibles del Modal

```
ESTADO 1: Cerrado
└─ modalAbierto = false
└─ formatoSeleccionadoParaRendir = null

ESTADO 2: Abierto, Vacío
└─ modalAbierto = true
└─ formatoSeleccionadoParaRendir = {id, ...}
└─ comprobantesAgregadosPorPartida = {}
└─ Botón "Enviar" DESHABILITADO

ESTADO 3: Abierto, Con Comprobantes
└─ modalAbierto = true
└─ formatoSeleccionadoParaRendir = {id, ...}
└─ comprobantesAgregadosPorPartida = {ALIMENTOS: [...]}
└─ Botón "Enviar" HABILITADO

ESTADO 4: Enviando
└─ (Breve transición)
└─ Botón "Enviar" DESHABILITADO (loading)

ESTADO 5: Éxito
└─ Mostrar SweetAlert
└─ Cerrar modal → vuelve a ESTADO 1
```

## 7. Campos Necesarios en Comprobante

| Campo | Tipo | Origen | Obligatorio | Notas |
|-------|------|--------|-------------|-------|
| `formato_emision_detalle_id` | INT | datosRendicion | Sí | ID de la partida actual |
| `tipo_comprobante_id` | INT | Autocomplete | No* | *Sí si no es DJ |
| `numero_comprobante` | STRING | TextField | Sí | "001-0001" |
| `fecha_comprobante` | DATE | DatePicker | Sí | "2024-01-10" |
| `monto` | DECIMAL | NumberField | Sí | > 0 |
| `proveedor_id` | INT | Autocomplete | No* | *Sí si no es DJ |
| `tipo_viatico` | STRING | Select | Sí | "transporte", "hotel", etc |
| `tipo_rendicion` | STRING | Select | Sí | "viaticos", "comisión", etc |
| `observaciones` | TEXT | TextField | No | Opcional |
| `partida` | STRING | Select | Sí | "ALIMENTOS", "TRANSPORTE" |

## 8. Validaciones Implementadas

```
FRONTEND (EmisionFormatos.js)
├─ Monto > 0
├─ Monto <= Disponible
├─ Proveedor requerido (excepto DJ)
├─ Número de comprobante no vacío
├─ Al menos 1 comprobante antes de enviar
├─ Formato seleccionado existe
└─ Formato tiene ID válido

BACKEND (rendicionesController.js)
├─ Formato existe en BD
├─ Formato estado = ENVIADO
├─ Formato no está duplicado
├─ Array de comprobantes no vacío
├─ Cada comprobante tiene campos requeridos
└─ Monto total es positivo
```

---

**Generado**: Sesión de Fix de Estado  
**Actualizado**: Enero 2024  
**Verificación**: ✅ Código revisado
