# 📋 LOGS ESPERADOS - DECOLECTA API FIX

## Backend Console Logs (Esperados)

Cuando haces una búsqueda de RUC desde el frontend, deberías ver en la consola del backend:

```
======================================================================
📥 REQUEST RUC
======================================================================
   Parámetro recibido: 20601030013
   Número limpio: 20601030013
   Longitud: 11
   🔍 URL: https://api.decolecta.com/v1/sunat/ruc/full?numero=20601030013
   🔐 Token: sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu
   🔐 Headers enviados: {
     Authorization: 'Bearer sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu',
     'Content-Type': 'application/json',
     'User-Agent': 'Node.js'
   }
   📊 Status recibido: 200
   ✅ RUC encontrado: REXTIE S.A.C.
```

### Interpretación de Logs

| Log | Significado |
|-----|-------------|
| `Parámetro recibido: 20601030013` | Backend recibió correctamente el RUC del frontend |
| `Número limpio: 20601030013` | Se limpió de caracteres especiales (si los había) |
| `Longitud: 11` | Validación de RUC: debe tener 11 dígitos ✅ |
| `🔐 Token: sk_14501...` | Token being sent to Decolecta API |
| `🔐 Headers enviados` | Confirma que Authorization header se envía |
| `📊 Status recibido: 200` | **✅ ÉXITO** - Decolecta respondió correctamente |
| `✅ RUC encontrado: REXTIE S.A.C.` | Datos recibidos y parseados exitosamente |

### Lo que NO deberías ver (Errores)

```
❌ INCORRECTO: {"error":"Token no proporcionado"}
❌ INCORRECTO: "Status recibido: 401"
❌ INCORRECTO: "Error request: getaddrinfo ENOTFOUND"
```

## Browser Network Tab (Chrome DevTools)

### Request Headers
```
GET /api/decolecta/ruc/20601030013 HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

### Response Headers
```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 567
Connection: keep-alive
```

### Response Body
```json
{
  "success": true,
  "data": {
    "razon_social": "REXTIE S.A.C.",
    "numero_documento": "20601030013",
    "estado": "ACTIVO",
    "condicion": "HABIDO",
    "direccion": "CAL. RICARDO ANGULO RAMIREZ NRO 745 DEP. 202 URB. CORPAC",
    "ubigeo": "150131",
    "distrito": "SAN ISIDRO",
    "provincia": "LIMA",
    "departamento": "LIMA",
    "es_agente_retencion": false,
    "es_buen_contribuyente": false,
    "tipo": "SOCIEDAD ANONIMA CERRADA"
  }
}
```

## Frontend Visual Feedback

### Antes del Fix (❌ Error)
```
INPUT: Buscar Proveedor = 20601030013
BOTÓN: "Buscar" (con texto blanco) ← Click
RESULTADO: ❌ Error 401
CAMPOS: No se llenan
TOAST: Error desconocido
```

### Después del Fix (✅ Funcionando)
```
INPUT: Buscar Proveedor = 20601030013
BOTÓN: "Buscar" (con texto blanco) ← Click
LOADING: Spinner girando por 1-2 segundos
RESULTADO: ✅ Status 200
CAMPOS LLENADOS AUTOMÁTICAMENTE:
  - RUC: 20601030013
  - Nombre/Razón Social: REXTIE S.A.C.
  - Dirección: CAL. RICARDO ANGULO RAMIREZ NRO 745 DEP. 202 URB. CORPAC
  - Estado: ACTIVO
  - Provincia: LIMA
  - Departamento: LIMA
TOAST: ✅ Proveedor encontrado exitosamente
```

## Casos de Test Recomendados

### Test 1: RUC Válido
```
Entrada: 20601030013
Resultado esperado: ✅ REXTIE S.A.C. (ACTIVO)
Logs: Status 200
```

### Test 2: RUC Otro válido
```
Entrada: 10700064838
Resultado esperado: ✅ Datos de proveedor encontrado
Logs: Status 200
```

### Test 3: RUC Inválido
```
Entrada: 12345678901 (inválido pero formato correcto)
Resultado esperado: ❌ Proveedor no encontrado (Status 404 o similar)
Logs: Status recibido: 404 o 400
Toast: "El RUC no fue encontrado"
```

### Test 4: RUC Incompleto
```
Entrada: 206010300 (solo 9 dígitos)
Resultado esperado: ❌ Error validación
Logs: ❌ Validación falló: esperaba 11 dígitos
Mensaje: "El RUC debe tener 11 dígitos"
```

### Test 5: DNI Válido
```
Entrada: 46027897 (DNI, 8 dígitos)
Resultado esperado: ✅ Datos de persona encontrada
Endpoint: /api/decolecta/dni/46027897
Logs: Status 200
Datos: Nombre, Apellidos, Tipo Documento, etc.
```

## Verificación de Configuración

### Para confirmar que todo está correcto:

1. **Verificar Token en el archivo:**
   ```bash
   grep "DECOLECTA_TOKEN" backend/routes/decolecta.js
   # Debe mostrar: sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu
   ```

2. **Verificar Orden de Routes:**
   ```bash
   grep -n "app.use.*api" backend/server.js
   # Línea 40: /api/auth
   # Línea 41: /api/decolecta  ← DEBE SER ANTES DE /api
   # Línea 42: /api/pdf
   # Línea 44: /api          ← DESPUÉS
   ```

3. **Verificar URL correcta en frontend:**
   ```bash
   grep "localhost:5000.*decolecta" material-dashboard-react/src/services/decolecta.js
   # Debe estar: http://localhost:5000/api/decolecta/ruc/
   ```

## Troubleshooting

### Si ves: "Token no proporcionado"
**Causa:** Las rutas no están en el orden correcto
**Solución:** Verificar que `/api/decolecta` viene ANTES de `/api` en server.js

### Si ves: "Cannot GET /api/decolecta/ruc/..."
**Causa:** Backend no está corriendo o puerto incorrecto
**Solución:** 
- Verificar: `npm start` en backend
- Verificar puerto: `:5000`

### Si ves: "ENOTFOUND api.decolecta.com"
**Causa:** Sin conexión a internet o DNS problema
**Solución:**
- Verificar conexión internet
- Verificar VPN si está activa
- Probar: `curl https://api.decolecta.com/`

### Si ves: Status 401 desde Decolecta
**Causa:** Token expirado o inválido
**Solución:**
- Verificar token en: `backend/routes/decolecta.js` línea 7
- Token debe ser: `sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu`
- Si cambió, actualizar en ambos lugares

## Performance Esperado

- **Tiempo de respuesta:** 1-3 segundos (depende de internet)
- **Frecuencia de llamadas:** Una por búsqueda
- **Limite de llamadas:** Decolecta API tiene rate limiting (verificar con Decolecta)
- **Errores esperados:** < 1% (depende calidad datos y validez RUC/DNI)

---

**Última Actualización:** 6 de Abril, 2026  
**Status:** ✅ Funcionando  
**Versión Backend:** v1.0  
**Versión Frontend:** v2.0
