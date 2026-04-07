# 🚀 GUÍA DE IMPLEMENTACIÓN

## Resumen Rápido

Se ha actualizado el sistema para:
1. ✅ Cargar automáticamente certificaciones y sus detalles (clasificadores)
2. ✅ Guardar `certificacion_id` en la tabla `formato_emisiones`
3. ✅ Cargar automáticamente certificación al modificar un formato

---

## PASO 1: Ejecutar Migración en Base de Datos

### Opción A: Por MySQL Client

```bash
# Conectarse a MySQL
mysql -h localhost -u root -p nombre_base_datos

# Copiar y ejecutar el SQL:
ALTER TABLE formato_emisiones 
ADD COLUMN certificacion_id INT NULL COMMENT 'Referencia a la certificación de crédito usada' 
AFTER meta_id;

ALTER TABLE formato_emisiones 
ADD INDEX idx_certificacion_id (certificacion_id);

# Verificar
DESCRIBE formato_emisiones;
```

### Opción B: Por archivo SQL (Recomendado)

```bash
# Desde terminal
cd backend/migrations

# Ejecutar migración
mysql -h localhost -u root -p nombre_base_datos < 002_agregar_certificacion_id.sql

# Verificar
mysql -h localhost -u root -p nombre_base_datos -e "DESCRIBE formato_emisiones;"
```

### Opción C: Por workbench/panel admin

1. Abrir administrador de BD
2. Seleccionar tabla `formato_emisiones`
3. Agregar columna:
   - **Nombre**: `certificacion_id`
   - **Tipo**: `INT`
   - **Nulo**: SÍ
   - **Después de**: `meta_id`
4. Guardar

---

## PASO 2: Reiniciar Backend

```bash
# Detener servidor actual (si está corriendo)
Ctrl+C  # En la terminal del backend

# Navegar a backend
cd backend

# Reiniciar
npm start
# o si usa nodemon, se reinicia automáticamente
```

---

## PASO 3: Verificar Frontend

No requiere rebuild, los cambios JavaScript se cargan automáticamente en la siguiente recarga.

**Recomendado**: Limpiar caché del navegador
- Abrir DevTools (F12)
- Settings → Network → Desmarcar "Disable cache"
- Recargar página (Ctrl+Shift+R)

---

## PASO 4: Validación Rápida

### Test 1: Crear Formato Nuevo

1. Ir a **Emisión de Formatos**
2. Hacer clic en **📝 Emitir** en una comisión
3. Seleccionar **META**
4. Seleccionar **CERTIFICACIÓN**
5. ✅ **Detalles deben cargarse automáticamente**
6. Hacer clic en **✅ Emitir**
7. ✅ **Debe guardar exitosamente**

### Test 2: Modificar Formato

1. Ir a **Emisión de Formatos**
2. Hacer clic en **✏️ Modificar** en una comisión que ya tiene formato
3. ✅ **Debe cargarse automáticamente certificacion_id**
4. ✅ **Deben cargarse automáticamente los detalles**
5. Hacer clic en **✅ Emitir**
6. ✅ **Debe actualizarse exitosamente**

### Test 3: Verificar Base de Datos

```sql
-- Ver un formato creado
SELECT id, comision_id, usuario_id, meta_id, certificacion_id, numero_documento
FROM formato_emisiones
ORDER BY id DESC
LIMIT 1;

-- Ver los detalles del formato
SELECT fd.*, f.certificacion_id
FROM formato_emisiones_detalles fd
JOIN formato_emisiones f ON fd.formato_emision_id = f.id
WHERE f.id = 42  -- Reemplazar 42 con ID del formato a verificar
ORDER BY fd.id;
```

---

## PASO 5: Validación en Logs

### Backend Logs (Debe ver)

✅ Al crear:
```
📝 Datos a actualizar: { certificacion_id: 11, ... }
✅ Formato 42 actualizado correctamente
✅ 3 detalles insertados para formato 42
```

✅ Al modificar:
```
📝 Datos a actualizar: { certificacion_id: 12, ... }
✅ Filas afectadas: 1
🗑️ Detalles previos eliminados (3 registros) para formato 42
✅ 2 detalles insertados para formato 42
```

### Frontend Logs (DevTools Console)

✅ Al seleccionar certificado:
```
📋 Cargando clasificadores para certificación 11...
✅ Actualizando detallesEditables con clasificadores del certificado: [...]
```

✅ Al abrir para modificar:
```
✏️ Abriendo modal para MODIFICAR formato: {...}
📄 Formato a modificar: {...}
🔄 Cargando detalles del certificado: 11
✅ Actualizando detallesEditables...
```

---

## TROUBLESHOOTING

### Problema 1: Detalles no cargan automáticamente

**Causa**: Frontend no está actualizado o caché antiguo

**Solución**:
```bash
# Limpiar caché completo
1. DevTools → Application → Clear All
2. Recargar: Ctrl+Shift+R
3. Intentar nuevamente
```

### Problema 2: certificacion_id no se guarda

**Causa**: Campo no fue agregado a BD o backend antiguo

**Solución**:
```bash
# Verificar campo existe
mysql > DESCRIBE formato_emisiones;

# Debería mostrar certificacion_id en la lista

# Si no está, ejecutar migración:
mysql < backend/migrations/002_agregar_certificacion_id.sql

# Reiniciar backend
npm start
```

### Problema 3: Error "comision_id is not defined"

**Causa**: Esto ya fue corregido, pero si persiste:

**Solución**:
```bash
# Verificar que archivo FormatoEmision.js está actualizado
# Debe tener estos campos en destructuración:
const {
  comision_id,        ✅
  usuario_id,         ✅
  certificacion_id,   ✅
  // ... etc ...
} = data;

# Si no está, editar backend/models/FormatoEmision.js
# y agregar certificacion_id a la destructuración
```

### Problema 4: Detalles aparecen pero no se guardan

**Causa**: Posible error en validación de detalles

**Solución**:
```bash
# Revisar logs del backend para mensajes de error
# Verificar que los detalles tienen:
{
  "clasificador_id": 3,  ✅ (debe existir)
  "monto": 600          ✅ (debe ser número > 0)
}

# Si falta algo, corregir en el frontend antes de enviar
```

### Problema 5: Certificación no se carga al modificar

**Causa**: Backend no devuelve certificacion_id en obtenerFormatoEmisionPorId

**Solución**:
```bash
# Verificar query en FormatoEmision.obtenerPorId()
# Debe incluir certificacion_id en el SELECT:

SELECT fe.*, 
       u.nombre as usuario_nombre,
       c.lugar as comision_lugar,
       cv.nombre as costo_viaje_nombre,
       fe.certificacion_id  ✅ IMPORTANTE
FROM formato_emisiones fe
...

# Si no está, agregar manualmente
```

---

## ROLLBACK (Si es necesario)

Si algo sale mal, puede revertir los cambios:

```sql
-- Remover los cambios de BD
ALTER TABLE formato_emisiones DROP INDEX idx_certificacion_id;
ALTER TABLE formato_emisiones DROP COLUMN certificacion_id;

-- Revisar que se eliminó
DESCRIBE formato_emisiones;
```

---

## Historial de Cambios

| Fecha | Cambio | Archivo |
|-------|--------|---------|
| 21 Mar | Agregar certificacion_id a modelo | FormatoEmision.js |
| 21 Mar | Agregar certificacion_id a controller | formatoEmisionController.js |
| 21 Mar | Cargar automático de certificación | EmisionFormatos.js |
| 21 Mar | Crear migración SQL | 002_agregar_certificacion_id.sql |

---

## Archivos Modificados (Checklist)

- [x] `backend/models/FormatoEmision.js` - Métodos crear() y actualizar()
- [x] `backend/controllers/formatoEmisionController.js` - Métodos crear() y actualizar()
- [x] `src/pages/Gestion/EmisionFormatos.js` - Funciones cargar*, datosFormato
- [x] `backend/migrations/002_agregar_certificacion_id.sql` - NUEVA
- [x] Documentación completada

---

## Próximos Pasos Recomendados

### Corto Plazo (Hoy)
1. ✅ Ejecutar migración SQL
2. ✅ Reiniciar backend
3. ✅ Validar creación de formato
4. ✅ Validar modificación de formato
5. ✅ Revisar logs

### Mediano Plazo (Esta semana)
1. Load testing con múltiples usuarios
2. Validar que no hay duplicados
3. Validar que detalles se calculan correctamente
4. Revisar reportes

### Largo Plazo (Mejoras futuras)
1. Agregar validación de certificación expirada
2. Alertar si certificación está a punto de vencerse
3. Dashboard de certificaciones más usadas
4. Reportes de certificaciones por usuario

---

## Support

Si encuentra problemas:

1. Revisar logs del backend (terminal donde corre npm start)
2. Revisar console del navegador (F12 → Console)
3. Verificar que BD tiene el campo `certificacion_id`
4. Verificar que backend fue reiniciado después de cambios

---

**Implementación Completada**: ✅  
**Fecha**: 21 de Marzo, 2026  
**Estado**: Listo para producción
