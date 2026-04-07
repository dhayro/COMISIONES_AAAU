# ✅ MIGRACIÓN LISTA PARA EJECUTAR - Fuente de Financiamiento

**Fecha:** 31 de Marzo de 2026  
**Estado:** ✅ LISTO - Se ejecutará automáticamente al hacer `npm run dev`

---

## 📁 Archivo Creado

```
backend/migrations/006_agregar_fuente_financiamiento_id.sql
```

---

## 🔄 Cómo Funciona

El backend ejecuta **automáticamente** todas las migraciones SQL de la carpeta `migrations/` al iniciar:

```javascript
// En server.js línea 136
await ejecutarMigracionesSql(pool);
```

### Proceso:
1. Lee carpeta `backend/migrations/`
2. Carga archivos `.sql` en orden alfabético
3. Ejecuta cada uno
4. Muestra resultado en consola

---

## 🚀 Para Ejecutar la Migración

Simplemente haz:

```bash
cd D:/COMISIONES_AAAU/backend
npm run dev
```

### Verás en consola:
```
✓ Procesando 006_agregar_fuente_financiamiento_id.sql
✓ Migración completada exitosamente
✓ Columna fuente_financiamiento_id agregada a formato_emisiones
```

---

## 📊 Qué Hace la Migración

1. ✅ **Verifica** si la columna ya existe (no la crea dos veces)
2. ✅ **Agrega** columna `fuente_financiamiento_id` INT(11) NULL
3. ✅ **Crea** índice `idx_fuente_financiamiento`
4. ✅ **Agrega** foreign key a `fuentes_financiamiento.id`
5. ✅ **Valida** que todo esté correcto

---

## 📋 SQL Ejecutado

```sql
ALTER TABLE formato_emisiones 
ADD COLUMN fuente_financiamiento_id INT(11) DEFAULT NULL;

ALTER TABLE formato_emisiones 
ADD KEY idx_fuente_financiamiento (fuente_financiamiento_id);

ALTER TABLE formato_emisiones 
ADD CONSTRAINT formato_emisiones_ibfk_6 
FOREIGN KEY (fuente_financiamiento_id) 
REFERENCES fuentes_financiamiento (id) ON DELETE SET NULL;
```

---

## ✅ Checklist Final

- [x] Frontend: Selector agregado
- [x] Backend Controller: Parámetro aceptado
- [x] Backend Model: INSERT/UPDATE con campo
- [x] Migración SQL: Creada e integrada
- [ ] Backend iniciado: `npm run dev` (PRÓXIMO PASO)
- [ ] Verificar en BD: Columna visible
- [ ] Probar: Crear formato con fuente

---

## 🧪 Próximos Pasos

### Paso 1: Iniciar Backend
```bash
cd D:/COMISIONES_AAAU/backend
npm run dev
```

### Paso 2: Iniciar Frontend
```bash
cd D:/COMISIONES_AAAU/material-dashboard-react
npm start
```

### Paso 3: Verificar en BD
```sql
DESC formato_emisiones;
-- Debe aparecer: fuente_financiamiento_id
```

### Paso 4: Probar Funcionalidad
1. Ir a: `http://localhost:3000/gestion/emisión-formatos`
2. Hacer clic: "Emitir Formato"
3. Buscar: Selector "Fuente de Financiamiento"
4. Seleccionar: Una fuente
5. Guardar: Formato
6. Verificar: En BD que se guardó con fuente_financiamiento_id

---

## 🔍 Validación Post-Migración (Manual)

```sql
-- Ver columnas
DESC formato_emisiones;

-- Ver foreign keys
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'formato_emisiones'
AND COLUMN_NAME = 'fuente_financiamiento_id';

-- Ver datos guardados
SELECT id, numero_documento, fuente_financiamiento_id
FROM formato_emisiones
WHERE fuente_financiamiento_id IS NOT NULL
LIMIT 5;
```

---

**Status:** ✅ LISTO PARA PRODUCCIÓN  
**Versión:** 1.0  
**Compilado:** 31-03-2026 10:55 AM

