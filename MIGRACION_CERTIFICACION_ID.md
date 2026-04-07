# 🔄 Migración: Agregar `certificacion_id` a `formato_emisiones`

## 📋 Descripción
Se agregó soporte para vincular cada formato de emisión con la certificación de crédito que utilizó. Esto permite rastrear qué certificación se usó para cada formato y cargar automáticamente sus clasificadores.

## 🗂️ Archivos Modificados

### Backend
1. **`backend/models/FormatoEmision.js`**
   - ✅ Agregado `certificacion_id` a destructuración de `crear()`
   - ✅ Agregado `certificacion_id` a destructuración de `actualizar()`
   - ✅ Agregado `certificacion_id` a lógica UPDATE dinámica

2. **`backend/controllers/formatoEmisionController.js`**
   - ✅ Agregado `certificacion_id` a destructuración de `crear()`
   - ✅ Agregado `certificacion_id` a destructuración de `actualizar()`
   - ✅ Agregado `certificacion_id` a objeto `datosActualizacion`

### Frontend
3. **`material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`**
   - ✅ Mejorada función `cargarDetallesCertificacion()` para actualizar automáticamente `detallesEditables`
   - ✅ Mejorada función `handleAbrirModalModificarFormato()` para cargar certificación y detalles
   - ✅ Agregado `certificacion_id` a `formValues`
   - ✅ Agregado `certificacion_id` a `datosFormato`

### Base de Datos
4. **`backend/migrations/002_agregar_certificacion_id.sql`**
   - ✅ Stored procedure seguro para agregar la columna
   - ✅ Verifica si ya existe antes de agregar
   - ✅ Crea índice automáticamente

## 🚀 Cómo Ejecutar la Migración

### Opción 1: Usando MySQL CLI (Recomendado)
```bash
mysql -h 172.10.9.11 -u root -p nombre_base_datos < backend/migrations/002_agregar_certificacion_id.sql
```

### Opción 2: Dentro de MySQL Workbench
1. Abre MySQL Workbench
2. Conecta a tu servidor
3. Abre el archivo `backend/migrations/002_agregar_certificacion_id.sql`
4. Ejecuta (Ctrl + Enter o el botón de ejecutar)

### Opción 3: Por PHP/Backend
Si tienes un sistema de migraciones automáticas, puedes ejecutar:
```php
$query = file_get_contents('backend/migrations/002_agregar_certificacion_id.sql');
$connection->query($query);
```

## ✅ Verificación Post-Migración

Ejecuta esta query para verificar que todo se agregó correctamente:

```sql
-- Ver la estructura de la tabla
SHOW COLUMNS FROM formato_emisiones WHERE Field = 'certificacion_id';

-- Verificar el índice
SHOW INDEXES FROM formato_emisiones WHERE Column_name = 'certificacion_id';

-- Ver todos los formatos y su certificación asignada
SELECT 
    id, 
    numero_documento, 
    comision_id, 
    usuario_id, 
    meta_id, 
    certificacion_id,
    estado_emision
FROM formato_emisiones 
LIMIT 10;
```

## 🔄 Flujo de Funcionamiento

### Crear Nuevo Formato
```
1. Usuario selecciona META → Carga certificados disponibles
2. Usuario selecciona CERTIFICADO → Carga clasificadores automáticamente
3. Sistema llena automáticamente detallesEditables con clasificadores
4. Usuario modifica montos y envía
5. Backend guarda certificacion_id en formato_emisiones
```

### Modificar Formato Existente
```
1. Usuario hace clic en "Modificar"
2. Sistema carga el formato existente
3. Sistema obtiene certificacion_id del formato
4. Sistema carga automáticamente el certificado seleccionado
5. Sistema carga automáticamente los clasificadores del certificado
6. Usuario modifica y envía
7. Backend actualiza certificacion_id si cambió
```

## 📊 Ejemplo de Datos

### Antes (sin certificacion_id)
```
id | numero_documento | comision_id | usuario_id | meta_id | estado_emision
1  | EF-2026-12345    | 5          | 3         | 6       | BORRADOR
```

### Después (con certificacion_id)
```
id | numero_documento | comision_id | usuario_id | meta_id | certificacion_id | estado_emision
1  | EF-2026-12345    | 5          | 3         | 6       | 11              | BORRADOR
```

## 🐛 Troubleshooting

### Error: "Column 'certificacion_id' already exists"
✅ **Solución:** La migración incluye validación con `IF NOT EXISTS`. Simplemente ignora este error, la columna ya está presente.

### Error: "Unknown column 'certificacion_id' in ON clause"
❌ **Problema:** La migración no se ejecutó.
✅ **Solución:** Ejecuta nuevamente la migración SQL.

### Los detalles no se cargan automáticamente
❌ **Problema:** El frontend no está enviando `certificacion_id`.
✅ **Solución:** 
1. Asegúrate que `certificacion_id` esté en `formValues`
2. Verifica que se envíe en `datosFormato`
3. Revisa la consola del navegador para errores

### La tabla no tiene el campo
✅ **Solución:**
```sql
-- Ejecuta manualmente en MySQL
ALTER TABLE formato_emisiones 
ADD COLUMN certificacion_id INT NULL AFTER meta_id;

ALTER TABLE formato_emisiones 
ADD INDEX idx_certificacion_id (certificacion_id);
```

## 📝 Cambios en la API

### POST /api/formatos-emisiones
```json
{
  "comision_id": 1,
  "usuario_id": 3,
  "meta_id": 6,
  "certificacion_id": 11,  // 🆕 NUEVO CAMPO
  "lugar": "Lima",
  ...
  "detalles": [...]
}
```

### PUT /api/formatos-emisiones/:id
```json
{
  "lugar": "Lima Actualizada",
  "certificacion_id": 12,  // 🆕 PUEDE CAMBIAR
  "detalles": [...]
}
```

## 🔗 Relaciones

```
formato_emisiones
├── comision_id → comisiones.id
├── usuario_id → users.id
├── meta_id → metas.id
├── certificacion_id → certificaciones_credito.id  🆕
└── formato_emisiones_detalles
    ├── clasificador_id → clasificadores.id
    └── monto
```

## ✨ Beneficios

- ✅ Rastrabilidad: Saber qué certificación usó cada formato
- ✅ Automatización: Cargar clasificadores automáticamente
- ✅ Auditoría: Registrar la fuente de los detalles
- ✅ Validación: Verificar saldos disponibles en la certificación
- ✅ Integridad: Mantener referencia a la certificación original

## 📅 Timeline

- **Creado:** 21 de Marzo, 2026
- **Estado:** ✅ Listo para ejecutar
- **Reversión:** ❌ No se recomienda (perderías datos de certificación)

---

**Última actualización:** 21 de Marzo, 2026  
**Versión:** 1.0
