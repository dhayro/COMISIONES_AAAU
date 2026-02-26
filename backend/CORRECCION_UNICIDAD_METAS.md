# 🔄 Corrección: Unicidad de Metas por Período

## Problema
Se recibía error: **"Duplicate entry '068' for key 'numero_meta'"**

La estructura anterior consideraba `numero_meta` como único de forma global, pero la lógica correcta es que el número debe ser único **por período (año)**, es decir, se puede tener el mismo número de meta en diferentes años.

## Solución Implementada

### 1. **Base de Datos (database.js)**
**Cambio**: Modificación de la tabla `metas`

**De:**
```sql
numero_meta VARCHAR(50) NOT NULL UNIQUE,
```

**A:**
```sql
numero_meta VARCHAR(50) NOT NULL,
...
UNIQUE KEY unique_numero_periodo (numero_meta, periodo),
```

✅ Ahora la unicidad es **compuesta**: `(numero_meta, periodo)`

### 2. **Controlador (metaController.js)**
**Cambio**: Mejorado el manejo de errores para dar mensajes más descriptivos

**Mensaje de error anterior:**
```
Error al crear meta: Duplicate entry '068' for key 'numero_meta'
```

**Mensaje de error mejorado:**
```
Ya existe una meta con el número 068 para el período 2026. 
El número de meta debe ser único dentro de cada período.
```

✅ Se agregó validación en `crear()` y `actualizar()`

### 3. **Documentación (MetaSchema.js)**
**Cambio**: Actualizada la descripción de `numero_meta`

**De:**
```
"Número único de la meta (3 dígitos)"
```

**A:**
```
"Número único de la meta por período (3 dígitos). 
Debe ser único dentro del mismo período."
```

✅ Documentación clara sobre la regla de negocio

## Ejemplo de Uso

### ✅ Ahora Permitido
```
Meta 1: numero_meta=068, periodo=2026
Meta 2: numero_meta=068, periodo=2027  ← Diferente año, ¡SÍ se permite!
```

### ❌ No Permitido
```
Meta 1: numero_meta=068, periodo=2026
Meta 2: numero_meta=068, periodo=2026   ← Mismo año, ¡NO se permite!
```

## Cómo Aplicar la Migración

### Opción 1: Automática (Recomendado)
```bash
cd backend
node scripts/migrar-metas.js
npm run dev
```

### Opción 2: Manual
1. Eliminar la tabla `metas` (si existe)
2. Iniciar el servidor: `npm run dev`
3. La tabla se recreará automáticamente con la nueva estructura

## Archivos Modificados
- ✅ `backend/config/database.js` - Estructura de tabla actualizada
- ✅ `backend/controllers/metaController.js` - Manejo de errores mejorado
- ✅ `backend/types/MetaSchema.js` - Documentación actualizada
- ✅ `backend/scripts/migrar-metas.js` - Script de migración (nuevo)

## Estado de las Metas Precargadas
Las 12 metas de 2026 que estaban cargadas:
- ✅ Se pueden recrear sin problemas
- ✅ Ahora permiten que se agreguen metas con los mismos números en años diferentes
- ✅ Cada periodo tendrá sus propios números de meta (067-073, 198-202)

---

**Versión**: 1.0.1
**Fecha**: Febrero 17, 2026
**Status**: ✅ Completado
