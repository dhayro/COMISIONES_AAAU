# ✅ Fix: Nombre de Columna Correcto en Query

## 🔴 Error Encontrado

**Error:** `Unknown column 'certificacion_id' in 'where clause'`

**Causa:** La query usaba el nombre de columna equivocado.

## ✅ Corrección Realizada

**Archivo:** `backend/controllers/formatoEmisionController.js`

**Línea:** ~469

### ANTES (❌ Incorrecto):
```javascript
SELECT id FROM detalles_certificacion_credito 
WHERE certificacion_id = ? AND clasificador_id = ?
       ↑↑↑ COLUMNA NO EXISTE
```

### AHORA (✅ Correcto):
```javascript
SELECT id FROM detalles_certificacion_credito 
WHERE certificacion_credito_id = ? AND clasificador_id = ?
       ↑↑↑ COLUMNA CORRECTA
```

## 📋 Estructura de la Tabla

```sql
CREATE TABLE detalles_certificacion_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  certificacion_credito_id INT NOT NULL,  ← Esta es la columna correcta
  clasificador_id INT NOT NULL,
  monto DECIMAL(15, 2),
  monto_utilizado DECIMAL(15, 2),
  ...
)
```

## 🔄 Flujo Corregido

```
Backend recibe:
- certificacion_nueva = 11
- detalle.clasificador_id = 1

Query correcta:
SELECT id FROM detalles_certificacion_credito 
WHERE certificacion_credito_id = 11 AND clasificador_id = 1

Resultado:
- Encuentra: id = 42
- Mapea correctamente: detalles_certificacion_credito_id = 42 ✅
- Suma monto_utilizado ✅
```

## 📊 Tabla de Referencia

| Tabla | Columna Correcta | Significado |
|-------|------------------|-------------|
| `detalles_certificacion_credito` | `certificacion_credito_id` | FK a `certificaciones_credito` |
| `formato_emisiones` | `certificacion_id` | FK a `certificaciones_credito` |
| `formato_emisiones_detalles` | `detalles_certificacion_credito_id` | FK a `detalles_certificacion_credito` |

**Relación:**
```
certificaciones_credito (id)
    ↓
detalles_certificacion_credito (certificacion_credito_id, clasificador_id, monto)
    ↓
formato_emisiones_detalles (detalles_certificacion_credito_id)
```

## 🧪 Verificación Post-Fix

**Query de prueba:**
```sql
-- Esto ahora funciona correctamente
SELECT id FROM detalles_certificacion_credito 
WHERE certificacion_credito_id = 11 AND clasificador_id = 1;

-- Resultado esperado: 42 (o el ID que corresponda)
```

## 🚀 Próximos Pasos

1. ✅ Reinicia backend
2. ✅ Modifica un formato con certificación
3. ✅ Verifica que el `monto_utilizado` se actualiza correctamente

## 📝 Logs Esperados (Después del Fix)

```
🔍 Buscando detalles_certificacion_credito para cert=11, clasificador=1
✅ Encontrado detalles_certificacion_credito_id = 42
✅ Detalle insertado, ID: 199
✅ Monto utilizado actualizado (sumado) para detalle 42: +S/. 900.00
```

---

**Actualizado:** 31 de Marzo, 2026
**Status:** 🟢 Ready to Test
