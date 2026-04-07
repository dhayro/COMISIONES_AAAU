# 🔧 Fix: Normalización de Estados de Formatos

## 📋 Problema Identificado

Algunos formatos ya tenían `certificacion_id` asignado pero su `estado_emision` seguía siendo **BORRADOR** cuando debería ser **EMITIDO**.

Esto ocurre porque:
1. Los registros antiguos fueron creados sin la lógica de cambio de estado automático
2. La lógica nueva solo funciona para **cambios futuros** (NULL → ID)

## ✅ Solución Implementada

### 1. Nuevo Endpoint: `POST /formatos-emisiones/normalizar-estados`

Este endpoint normaliza **TODOS** los estados en la base de datos:

**Reglas aplicadas:**
- ✅ Si `certificacion_id IS NOT NULL` y estado es **BORRADOR** → cambia a **EMITIDO**
- ✅ Si `certificacion_id IS NULL` y estado es **EMITIDO** → cambia a **BORRADOR**

**Ubicación:**
- Controller: `backend/controllers/formatoEmisionController.js` (líneas ~5-37)
- Ruta: `backend/routes/comisiones.js` (líneas ~2114-2122)

### 2. Código del Endpoint

```javascript
exports.normalizarEstados = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    console.log('🔧 NORMALIZANDO ESTADOS DE FORMATOS...');
    
    // 1️⃣ Formatos con certificacion_id que están en BORRADOR → EMITIDO
    const [result1] = await pool.query(
      `UPDATE formato_emisiones 
       SET estado_emision = 'EMITIDO'
       WHERE certificacion_id IS NOT NULL AND estado_emision = 'BORRADOR'`
    );
    
    // 2️⃣ Formatos SIN certificacion_id pero en EMITIDO → BORRADOR
    const [result2] = await pool.query(
      `UPDATE formato_emisiones 
       SET estado_emision = 'BORRADOR'
       WHERE certificacion_id IS NULL AND estado_emision = 'EMITIDO'`
    );
    
    res.json({
      message: 'Estados normalizados correctamente',
      cambios: {
        borrador_a_emitido: result1.changedRows,
        emitido_a_borrador: result2.changedRows
      }
    });
  }
};
```

## 🔄 Lógica de Estados (Completa)

| Escenario | Antes | Acción | Después |
|-----------|-------|--------|---------|
| Creación nueva | - | Crear con `certificacion_id = NULL` | BORRADOR ✅ |
| Asignar CCP | BORRADOR | `certificacion_id = NULL → 5` | EMITIDO ✅ (automático) |
| Remover CCP | EMITIDO | `certificacion_id = 5 → NULL` | BORRADOR ✅ (automático) |
| Cambiar CCP | EMITIDO | `certificacion_id = 5 → 3` | EMITIDO ✅ (sin cambio) |
| Registros antiguos | BORRADOR | `certificacion_id ≠ NULL` (desincronizado) | EMITIDO ✅ (normalizar) |

## 🚀 Cómo Ejecutar la Normalización

### Opción 1: Directamente en Postman/Thunder Client

```
POST http://172.10.9.11:5000/api/formatos-emisiones/normalizar-estados
Headers:
  Authorization: Bearer {tu_token}
  Content-Type: application/json
Body: {} (vacío)
```

### Opción 2: Con cURL

```bash
curl -X POST http://172.10.9.11:5000/api/formatos-emisiones/normalizar-estados \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json"
```

### Opción 3: Desde la consola del navegador (si tienes token)

```javascript
const response = await fetch('http://172.10.9.11:5000/api/formatos-emisiones/normalizar-estados', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

## 📊 Respuesta Esperada

```json
{
  "message": "Estados normalizados correctamente",
  "cambios": {
    "borrador_a_emitido": 12,
    "emitido_a_borrador": 0
  }
}
```

Esto significa:
- ✅ 12 formatos cambiaron de BORRADOR → EMITIDO
- ✅ 0 formatos cambiaron de EMITIDO → BORRADOR

## 🧪 Verificación Post-Ejecución

Después de ejecutar el endpoint, verifica en la BD:

```sql
-- Ver estado actual
SELECT id, numero_documento, certificacion_id, estado_emision 
FROM formato_emisiones 
WHERE certificacion_id IS NOT NULL 
ORDER BY id;

-- Todos deben tener estado_emision = 'EMITIDO'
```

## 🔐 Seguridad

- El endpoint requiere autenticación (Bearer token)
- Actualmente disponible para todos los usuarios autenticados
- **Recomendación**: Restringir solo a ADMIN en el futuro

Para hacerlo solo ADMIN, modificar:
```javascript
router.post('/formatos-emisiones/normalizar-estados', 
  requireRole('admin'), // ← Agregar esto
  formatoEmisionController.normalizarEstados);
```

## 📝 Notas Importantes

1. **Este endpoint se ejecuta UNA SOLA VEZ** para limpiar datos históricos
2. **Después de hoy**, la lógica automática en `actualizar()` manejará todo
3. Los nuevos cambios de certificación funcionarán automáticamente

## 🎯 Próximos Pasos

1. ✅ Reinicia el backend
2. ✅ Ejecuta `POST /formatos-emisiones/normalizar-estados`
3. ✅ Verifica que ID 30 ahora tiene estado = EMITIDO
4. ✅ Continúa con cambios normales (la lógica automática funcionará)

---

**Actualizado:** 31 de Marzo, 2026
**Status:** 🟢 Ready to Execute
