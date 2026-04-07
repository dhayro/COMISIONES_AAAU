# 🔧 Scripts de Reparación de Montos Utilizados

## Problema Detectado

Cuando se realizan cambios de certificación en los formatos de emisión, los `monto_utilizado` en la tabla `detalles_certificacion_credito` pueden quedar inconsistentes (valores negativos o incorrectos).

**Causas:**
- Cambios múltiples de certificación sin verificar el estado anterior
- Detalles con referencias NULL después de cambios
- Lógica de resta de montos no completamente sincronizada

**Síntomas:**
- Montos negativos en `monto_utilizado` (ej: `-880.00`, `-1500.00`)
- Discrepancias entre monto esperado y monto en BD
- Sobregiros (monto utilizado > monto disponible)

## Scripts Disponibles

### 1. `diagnosticoMontos.js` - Analizar problemas
Escanea toda la BD y reporta discrepancias sin hacer cambios.

**Uso:**
```bash
node scripts/diagnosticoMontos.js
```

**Output:**
- Lista de todas las discrepancias
- Certificaciones afectadas
- Montos esperados vs actuales
- Identifica sobregiros

### 2. `repararMontosUtilizados.js` - Reparar montos
Recalcula TODOS los `monto_utilizado` basado en los detalles reales.

**Procedimiento:**
1. Resetea todos los `monto_utilizado` a 0
2. Recalcula sumando desde `formato_emisiones_detalles`
3. Reporta discrepancias residuales

**Uso:**
```bash
node scripts/repararMontosUtilizados.js
```

**⚠️ IMPORTANTE:** 
- Primero ejecuta `diagnosticoMontos.js` para ver qué hay
- Haz backup de la BD antes de ejecutar reparación
- Después de reparar, revisa las discrepancias residuales

## Pasos Recomendados

### Paso 1: Diagnosticar
```bash
node scripts/diagnosticoMontos.js > diagnostico.txt
# Revisa el archivo para ver qué está mal
```

### Paso 2: Backup
```bash
# Exportar datos de seguridad
mysqldump -u root -p comisiones_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 3: Reparar
```bash
node scripts/repararMontosUtilizados.js
```

### Paso 4: Verificar
```bash
node scripts/diagnosticoMontos.js > diagnostico_despues.txt
# Compara con el anterior
```

## Mejoras al Backend

También se ha mejorado la lógica en `formatoEmisionController.js` (línea ~500):

**Nueva lógica al restar montos:**
```javascript
// Si el detalle antiguo no tiene referencia (NULL)
// Busca automáticamente en la certificación anterior
if (detalleAntiguo.detalles_certificacion_credito_id === NULL && 
    certificacion_anterior !== null) {
  // Buscar en detalles_certificacion_credito de cert anterior
  // y restar desde allá
}
```

Esto previene que futuros cambios de certificación causen problemas.

## Datos de Ejemplo con Problema

Según los datos proporcionados, estos eran los problemas:

| Detalle ID | Cert | Mes | Clasificador | Disponible | Utilizado | Estado |
|-----------|------|-----|--------------|-----------|-----------|--------|
| 7 | 2 (1726) | FEB | 2 | S/. 3,520.00 | S/. -880.00 | ❌ NEGATIVO |
| 30 | 9 (331) | ENE | 1 | S/. 2,300.00 | S/. -1,500.00 | ❌ NEGATIVO |

Después de reparar:
- Todos los `monto_utilizado` serán recalculados correctamente
- Los valores negativos desaparecerán
- Se identificarán sobregiros reales (si los hay)

## Preguntas Frecuentes

**P: ¿Perderé datos si ejecuto la reparación?**
A: No. Solo se recalculan los valores en `monto_utilizado` basándose en datos existentes. Los formatos y detalles no se modifican.

**P: ¿Qué pasa si hay sobregiros después de reparar?**
A: Significa que realmente hay formatos que usan más de lo disponible. Necesitarás:
1. Anular algunos formatos para liberar monto
2. O ajustar manualmente los montos de formatos
3. O solicitar un aumento en la certificación

**P: ¿Con qué frecuencia debo ejecutar estos scripts?**
A: Solo cuando detectes problemas. La nueva lógica del backend debería prevenir futuros problemas en cambios de certificación.

**P: ¿Puedo automatizar la reparación?**
A: Sí. Puedes agregar a un cron job o CI/CD, pero se recomienda revisar los diagnósticos manualmente primero.

## Contacto y Soporte

Si persisten los problemas después de ejecutar los scripts:
1. Revisa los logs en `diagnostico_despues.txt`
2. Identifica qué certificaciones/formatos están causando el problema
3. Revisa si hay cambios de certificación conflictivos
4. Considera limpiar/anular formatos problemáticos
