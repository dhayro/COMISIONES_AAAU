# 🧪 TESTING: Verificar Fix de formatoSeleccionadoParaRendir

## ✅ Testing Checklist

### Paso 1: Preparar Ambiente
- [ ] Servidor backend corriendo en puerto 5000: `npm run dev` (en carpeta backend)
- [ ] Frontend corriendo en puerto 3000: `npm start` (en carpeta frontend)
- [ ] Base de datos conectada y migraciones ejecutadas
- [ ] DevTools abierto (F12 → Console)

### Paso 2: Testing Básico

#### 2.1 Abrir el Modal
- [ ] Ir a sección "Gestión" → "Emisión de Formatos"
- [ ] Buscar una comisión con estado "ENVIADO"
- [ ] Hacer clic en botón "Rendir" de esa comisión
- [ ] Verificar que el modal "RENDICIÓN DE GASTOS" se abre correctamente

#### 2.2 Verificar Estado Inicial
En Console, escribir:
```javascript
console.log('Estado al abrir modal');
```
Deberías ver:
- Modal visible
- Tabla vacía de comprobantes
- Botón "Enviar Rendición" deshabilitado

#### 2.3 Agregar Comprobantes
- [ ] Seleccionar una "Partida" (ej: ALIMENTOS)
- [ ] Seleccionar un "Tipo de Rendición" (ej: FACTURA)
- [ ] Llenar datos:
  - Tipo de Comprobante: "Boleta"
  - Proveedor: "Restaurante XYZ"
  - Número: "001-0001"
  - Monto: "50.00"
  - Fecha: "2024-01-15"
- [ ] Hacer clic en "Agregar Comprobante"
- [ ] Verificar que aparece en la tabla

#### 2.4 Verificar Console Logs
Al agregar el comprobante, en Console deberías ver:
```
🔍 Formato recibido: {id: 123, formato_existente: {...}, ...}
```

### Paso 3: Testing del Envío

#### 3.1 Intentar Envío
- [ ] Hacer clic en botón "✅ Enviar Rendición"
- [ ] Observar Console para logs

#### 3.2 Verificar Logs de Envío
En Console, deberías ver:
```
🔍 Formato recibido: {id: XXX, ...}
📤 Enviando rendición: {
  formato_emision_id: XXX,
  comprobantes: 1,
  total_monto: 50.00,
  url: "http://localhost:5000/api/rendiciones/crear"
}
📊 Datos completos: {...}
```

#### 3.3 Verificar Respuesta de Éxito
Deberías ver:
- ✅ Modal de éxito con:
  - "Se han registrado X comprobante(s)"
  - "Total: S/. XX.XX"
  - "ID Rendición: #XXX"
- Modal se cierra
- Vuelve a tabla de comisiones

### Paso 4: Testing en Base de Datos

#### 4.1 Verificar Rendición Maestra
En tu cliente SQL (MySQL Workbench, DBeaver, etc.):
```sql
SELECT * FROM rendiciones_maestras 
WHERE formato_emision_id = XXX;
```

Deberías ver:
- `id`: (auto-generado)
- `formato_emision_id`: (el que enviaste)
- `estado`: "ACTIVA" o similar
- `fecha_rendicion`: (fecha actual)

#### 4.2 Verificar Comprobantes
```sql
SELECT * FROM rendicion_comprobantes 
WHERE rendicion_id = XXX;
```

Deberías ver:
- `rendicion_id`: (el que guardaste)
- `numero_comprobante`: "001-0001"
- `monto`: 50.00
- `proveedor_id`: (ID del proveedor)
- Otros datos coinciden con lo ingresado

#### 4.3 Verificar Estado del Formato
```sql
SELECT id, codigo, estado FROM formato_emisiones 
WHERE id = XXX;
```

Deberías ver:
- `estado`: "RENDIDO" (cambió de "ENVIADO")

### Paso 5: Testing Avanzado

#### 5.1 Múltiples Partidas
- [ ] Agregar comprobantes de diferentes partidas:
  - Partida "ALIMENTOS" - 50.00
  - Partida "TRANSPORTE" - 100.00
- [ ] Verificar que tabla muestra ambos
- [ ] Enviar rendición
- [ ] Verificar en BD que ambos se guardaron en mismo `rendicion_id`

#### 5.2 Multiple Comprobantes por Partida
- [ ] Partida "ALIMENTOS"
  - Comprobante 1: 25.00
  - Comprobante 2: 25.00
  - (Total partida: 50.00)
- [ ] Enviar
- [ ] Verificar que BD muestra 2 registros con mismo rendicion_id

#### 5.3 Valores Edge Cases
- [ ] Intenta agregar comprobante con monto 0 → No debe permitir
- [ ] Intenta agregar negativo → No debe permitir
- [ ] Intenta agregar decimal: 50.99 → Debe permitir
- [ ] Intenta DECLARACIÓN JURADA sin proveedor → Debe permitir

### Paso 6: Testing de Error

#### 6.1 Sin Comprobantes
- [ ] Abre modal
- [ ] Sin agregar nada, intenta enviar
- [ ] Deberías ver: "Debes agregar al menos un comprobante"

#### 6.2 Backend Desconectado
- [ ] Detén servidor backend
- [ ] Intenta enviar rendición
- [ ] Deberías ver error de conexión
- [ ] Reinicia backend
- [ ] Deberías poder enviar nuevamente

### Paso 7: Verificación Final

| Aspecto | Estado | Notas |
|---|---|---|
| Modal abre correctamente | ⏳ | En testing |
| Comprobantes se agregan | ⏳ | En testing |
| Botón Enviar responde | ⏳ | En testing |
| Console logs aparecen | ⏳ | En testing |
| Respuesta de éxito | ⏳ | En testing |
| Datos en BD correcto | ⏳ | En testing |
| Formato cambia a RENDIDO | ⏳ | En testing |

## Resultados

### Caso 1: ✅ Todo funciona
```
✅ Modal abre
✅ Comprobantes se agregan y muestran en tabla
✅ Logs en console muestran formato recibido correctamente
✅ Envío exitoso con ID rendición
✅ BD muestra rendiciones_maestras con comprobantes
✅ Formato cambia a RENDIDO
→ FIX EXITOSO - Deploy a producción
```

### Caso 2: ❌ formatoSeleccionadoParaRendir aún null
```
❌ Console log muestra: Formato recibido: null
❌ Error: "No hay formato seleccionado"
→ Necesario debugging adicional - Revisar llamada onClick
```

### Caso 3: ⚠️ Errores en BD
```
⚠️ Rendición guardada pero comprobantes no
→ Revisar mapeó de campos en backend
```

## Comandos Útiles

### Ver logs del backend en tiempo real
```bash
# Terminal del backend
npm run dev
```

### Limpiar BD para testing limpio (⚠️ Cuidado)
```sql
-- SOLO si necesitas empezar limpio
DELETE FROM rendicion_comprobantes;
DELETE FROM rendiciones_maestras;
```

### Ver todas las rendiciones
```sql
SELECT 
  rm.id,
  rm.formato_emision_id,
  COUNT(rc.id) as num_comprobantes,
  SUM(rc.monto) as total_monto,
  rm.estado,
  rm.fecha_rendicion
FROM rendiciones_maestras rm
LEFT JOIN rendicion_comprobantes rc ON rm.id = rc.rendicion_id
GROUP BY rm.id
ORDER BY rm.fecha_rendicion DESC;
```

## Notas
- Si algo falla, revisar console del navegador (F12)
- Buscar logs que comiencen con 🔍, 📤, 📊
- Revisar Network tab si hay problema de conectividad
- Verificar que backend puerto 5000 esté escuchando: `netstat -ano | findstr :5000`

---

**Iniciado**: [Tu fecha/hora]  
**Revisado por**: Copilot
**Status**: 🟡 Pendiente Testing Manual
