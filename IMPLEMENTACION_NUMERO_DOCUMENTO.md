# 📋 Implementación de Generación Automática de Número de Documento

## 🎯 Objetivo
Generar automáticamente números de documento correlativo usando las **iniciales del usuario** y el **control de correlativo** almacenado en la tabla `correlativo_control`.

## 🏗️ Arquitectura Implementada

### 1️⃣ **Base de Datos**
```sql
-- Tabla: users
- id (INT)
- nombre (VARCHAR)
- iniciales (VARCHAR(10)) ← 🆕 Se calcula automáticamente en cada inicio
  
-- Tabla: correlativo_control
- id (INT)
- usuario_id (INT FK)
- ano (INT) [2026]
- numero_inicial (INT) [1]
- numero_proximo (INT) ← ⬆️ Se incrementa después de cada emisión
- prefijo (VARCHAR) ← Iniciales del usuario (DKT, SANC, etc.)
```

### 2️⃣ **Backend API**

#### Endpoint: Obtener próximo número
```
GET /formato-emisiones/correlativo-control/{usuarioId}/proximo
```

**Response:**
```json
{
  "message": "Próximo número obtenido",
  "numeroDocumento": "DKT-1",
  "prefijo": "DKT",
  "numero": 1,
  "ano": 2026
}
```

#### Endpoint: Generar para todos (Admin)
```
POST /formato-emisiones/correlativo-control/generar/auto
```

**Response:**
```json
{
  "message": "Correlativo generados exitosamente",
  "ano": 2026,
  "creados": 26,
  "actualizados": 0,
  "total_usuarios": 26
}
```

### 3️⃣ **Frontend - Flujo de Emisión**

```javascript
// 1️⃣ Al hacer clic en "EMITIR FORMATO"
const numeroDocumento = await generarNumeroDocumento(usuarioLogueado);
// Resultado: "DKT-1"

// 2️⃣ Guardar formato con número
const response = await api.crearFormatoEmision({
  numero_documento: "DKT-1",
  usuario_id: usuarioId,
  ...otrosDatos
});

// 3️⃣ Incrementar contador
await incrementarCorrelativo(usuarioId);
// numero_proximo cambia de 1 → 2

// 4️⃣ Próxima emisión usará "DKT-2"
```

## 📊 Ejemplo Real

### Usuario: DAHYRO KONG TORRES

#### Inicial de sesión
```
Backend inicia → ejecutarMigraciones()
  ↓
actualizarInicialesUsuarios()
  ↓
Procesa: "DAHYRO KONG TORRES"
  - Palabras: [DAHYRO, KONG, TORRES]
  - Primeras letras: [D, K, T]
  - Resultado: iniciales = "DKT" ✅
```

#### Generación de correlativo
```
Backend inicia → generarCorrelativosInicial()
  ↓
Para cada usuario:
  - usuario_id: 3 (Dahyro)
  - ano: 2026
  - numero_inicial: 1
  - numero_proximo: 1
  - prefijo: "DKT" (de users.iniciales)
  - descripcion: "Correlativo 2026 - DAHYRO KONG TORRES"
```

#### Emisión de Documento

| Emisión | Acción | numero_proximo | Resultado | Siguiente |
|---------|--------|---------|-----------|-----------|
| 1ª | Generar | 1 | **DKT-1** | 2 |
| 2ª | Generar | 2 | **DKT-2** | 3 |
| 3ª | Generar | 3 | **DKT-3** | 4 |
| n | Generar | n | **DKT-n** | n+1 |

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BACKEND STARTUP (server.js)                              │
├─────────────────────────────────────────────────────────────┤
│ await actualizarInicialesUsuarios(pool)                     │
│   → Calcula iniciales para todos los usuarios               │
│   → DKT, SANC, CMAB, etc.                                   │
│                                                               │
│ await generarCorrelativosInicial(pool)                      │
│   → Crea control de correlativo para año 2026               │
│   → numero_proximo = 1 para cada usuario                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USUARIO EMITE FORMATO (Frontend)                         │
├─────────────────────────────────────────────────────────────┤
│ Al hacer clic en "📝 Emitir Formato"                        │
│   ↓                                                          │
│ generarNumeroDocumento(usuarioLogueado)                     │
│   ├─ GET /formato-emisiones/correlativo-control/3/proximo  │
│   ├─ Response: { numeroDocumento: "DKT-1", ... }           │
│   └─ Return: "DKT-1"                                        │
│   ↓                                                          │
│ api.crearFormatoEmision({                                   │
│   numero_documento: "DKT-1",                                │
│   usuario_id: 3,                                            │
│   ...otrosDatos                                             │
│ })                                                           │
│   ↓                                                          │
│ incrementarCorrelativo(usuarioId)                           │
│   └─ PUT /formato-emisiones/correlativo-control/{id}       │
│      { numero_proximo: 2 }                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PRÓXIMA EMISIÓN (Automático)                             │
├─────────────────────────────────────────────────────────────┤
│ numero_proximo ahora es 2                                   │
│ Próximo documento será: "DKT-2"                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Archivos Modificados

### Backend
- ✅ `/backend/config/migraciones.js`
  - `actualizarInicialesUsuarios()` - Calcula iniciales
  - `generarCorrelativosInicial()` - Crea control correlativo
  
- ✅ `/backend/controllers/correlativoControlController.js`
  - `generarCorrelativosAuto()` - Endpoint para generar manual
  - `obtenerProximoNumero()` - Obtiene próximo número
  
- ✅ `/backend/routes/correlativoControlRoutes.js`
  - Agregadas rutas POST y GET para nuevos endpoints
  
- ✅ `/backend/server.js`
  - Agregadas llamadas a las funciones de migración

### Frontend
- ✅ `/material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`
  - `generarNumeroDocumento()` - Obtiene número de API
  - `incrementarCorrelativo()` - 🆕 Incrementa contador
  - Llamadas en `handleGuardarFormato()`

- ✅ `/material-dashboard-react/src/pages/Gestion/GestionCorrelativos.js`
  - `handleGenerarCorrelativosAuto()` - Botón para generar manual
  - UI mejorada con botón "Generar Automáticamente"

## ✨ Ventajas

✅ **Automático**: Se genera al emitir, sin intervención manual
✅ **Consistente**: Usa formato `INICIALES-NUMERO`
✅ **Escalable**: Funciona para N usuarios
✅ **Rastreable**: Cada documento tiene número único y correlativo
✅ **Reversible**: Se puede generar o regenerar desde admin
✅ **Sincronizado**: Frontend y Backend siempre en sincronía

## 🧪 Prueba

1. Reinicia el backend
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000/gestion/correlativos`

3. Haz clic en "Generar Automáticamente"

4. Ve a módulo de emisión de formatos

5. Emite un documento → Verás `DKT-1` (o según usuario)

6. Emite otro → Verás `DKT-2`

7. Verifica en la tabla de correlativo que número_proximo se incrementó

¡Listo! 🎉
