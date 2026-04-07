# 🔧 Actualización de Restricción de Unicidad en BD

## Resumen de Cambios

Se ha actualizado la restricción de unicidad en la tabla `certificaciones_credito` de:
- **Anterior:** `numero_documento` (único solo)
- **Nuevo:** `(nota, mes, numero_documento)` (única combinación)

## Cambios Realizados

### 1. **Backend - Extracción de Documento**
- Archivo: `pdfController.js` (línea 900)
- Mejora: Ahora captura el número de documento completo hasta "JUSTIFICACIÓN"
- Antes: Solo capturaba `[A-Z0-9.]+` (ej: "CUT")
- Ahora: Captura completo (ej: "CUT 20932M0202AAA.U")

### 2. **Backend - Validación de Duplicados**
- Archivo: `certificacionCreditoController.js` (línea 5-43)
- Se agregó validación que verifica la combinación `nota + mes + numero_documento`
- Retorna error 409 (Conflicto) si ya existe

### 3. **Backend - Schema SQL**
- Archivos: 
  - `backend/config/schema-certificaciones.sql`
  - `database/schema_certificaciones_credito.sql`
- Cambio: 
  - De: `numero_documento VARCHAR(100) NOT NULL UNIQUE,`
  - A: Sin UNIQUE, más adelante agregar `UNIQUE KEY unique_nota_mes_documento (nota, mes, numero_documento),`

### 4. **Frontend - Manejo de Errores**
- Archivo: `GestionCertificacionesCredito.js` (línea 265-280)
- Se mejoró el manejo de error 409 con mensaje específico para duplicados

## 📋 Pasos de Instalación

### Opción A: Aplicar la Migración a BD Existente

```bash
# 1. Navegar a la carpeta config del backend
cd D:\COMISIONES_AAAU\backend\config

# 2. Ejecutar el script de migración
mysql -h localhost -u root -p COMISIONES_AAAU < migration-unique-constraint.sql
```

**Nota:** Si la BD tiene datos antiguos con `numero_documento` duplicados, MySQL rechazará la migración. En ese caso:

```sql
-- Opción: Eliminar duplicados manualmente antes de migrar
DELETE FROM certificaciones_credito WHERE id NOT IN (
  SELECT id FROM (
    SELECT MIN(id) as id 
    FROM certificaciones_credito 
    GROUP BY nota, mes, numero_documento
  ) as keep
);

-- Luego ejecutar la migración
mysql -h localhost -u root -p COMISIONES_AAAU < migration-unique-constraint.sql
```

### Opción B: BD Nueva

Si está creando la BD desde cero, simplemente ejecute:

```bash
cd D:\COMISIONES_AAAU\backend\config
mysql -h localhost -u root -p COMISIONES_AAAU < schema-certificaciones.sql
```

## ✅ Verificación

Después de la migración, verificar que la restricción se aplicó:

```sql
-- Ver las restricciones UNIQUE de la tabla
SHOW INDEXES FROM certificaciones_credito WHERE Key_name LIKE '%unique%';

-- Resultado esperado:
-- | Table | Non_unique | Key_name | Seq_in_index | Column_name |
-- | certificaciones_credito | 0 | unique_nota_mes_documento | 1 | nota |
-- | certificaciones_credito | 0 | unique_nota_mes_documento | 2 | mes |
-- | certificaciones_credito | 0 | unique_nota_mes_documento | 3 | numero_documento |
```

## 🚀 Reiniciar Aplicación

Después de aplicar la migración, reinicia el backend:

```bash
cd D:\COMISIONES_AAAU\backend
npm run dev
```

Recarga el navegador para que los cambios del frontend se apliquen.

## 📝 Notas Importantes

- La combinación `nota + mes + numero_documento` ahora es única en la BD
- Si intenta crear un duplicado, recibirá error 409 con mensaje descriptivo
- El frontend muestra un diálogo de advertencia en lugar de error rojo
- La extracción de PDF ahora captura el número completo del documento

## 🔍 Troubleshooting

Si recibe error "Duplicate entry" al ejecutar la migración:

1. Verifique si hay registros duplicados:
```sql
SELECT nota, mes, numero_documento, COUNT(*) as count
FROM certificaciones_credito
GROUP BY nota, mes, numero_documento
HAVING count > 1;
```

2. Elimine los duplicados:
```sql
DELETE FROM certificaciones_credito WHERE id NOT IN (
  SELECT id FROM (
    SELECT MIN(id) as id 
    FROM certificaciones_credito 
    GROUP BY nota, mes, numero_documento
  ) as keep
);
```

3. Intente la migración nuevamente
