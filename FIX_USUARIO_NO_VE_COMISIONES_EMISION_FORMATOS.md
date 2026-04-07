# ✅ FIX: Usuario "usuario" No Veía sus Comisiones en Emisión de Formatos

## 📋 Problema Reportado

**Usuario:** `dkong` (perfil: `usuario`)
**Endpoint:** `GET /api/comisiones/emision-formatos`
**Síntoma:** No podía ver sus comisiones para emitir formatos

**Raíz del problema:**
El endpoint estaba filtrando incorrectamente. Un usuario tipo "usuario" debe ver las comisiones donde **es comisionado** (aparece en `comision_comisionados.usuario_id`), pero el código estaba buscando comisiones donde **es el creador** (`comisiones.usuario_id`).

```
❌ INCORRECTO:
Usuario dkong
  ├─ Creó comisión? → usuario_id = dkong → MOSTRAR
  └─ Es comisionado? → comision_comisionados.usuario_id = dkong → NO MOSTRAR ← ¡ERROR!

✅ CORRECTO:
Usuario dkong
  ├─ Creó comisión? → usuario_id = dkong → No importa
  └─ Es comisionado? → comision_comisionados.usuario_id = dkong → MOSTRAR ✓
```

---

## 🔧 Solución Implementada

### Archivo: `backend/controllers/comisionController.js`

#### Función: `obtenerComisionesParaEmisionFormatos` (líneas ~1036-1080)

**ANTES:**
```javascript
if (rol === 'usuario') {
  // Los usuarios ven solo sus propias comisiones
  condiciones.push('c.usuario_id = ?');
  params.push(usuarioId);
}
```

**DESPUÉS:**
```javascript
if (rol === 'usuario') {
  // USUARIO: Ver comisiones donde es comisionado (aparece en comision_comisionados)
  query += ` INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
             INNER JOIN users comisionados ON cc.usuario_id = comisionados.id`;
  condiciones.push('comisionados.id = ?');
  params.push(usuarioId);
}
```

---

## 🔄 Flujo Ahora Correcto

```
Usuario dkong (perfil: usuario) → GET /api/comisiones/emision-formatos
    ↓
Backend ejecuta:
    SELECT DISTINCT c.* FROM comisiones c
    INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
    INNER JOIN users comisionados ON cc.usuario_id = comisionados.id
    WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
    AND c.aprobacion_estado = "APROBADA"
    AND comisionados.id = ? ← dkong
    ↓
Retorna: Todas las comisiones donde dkong es comisionado
    ↓
Frontend: Muestra comisiones para que dkong emita formatos
```

---

## 📊 Comparativa de Roles

### Rol: `usuario`
**Qué ve:** Solo comisiones donde **es comisionado**
```sql
WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
  AND c.aprobacion_estado = "APROBADA"
  AND comisionados.id = ? ← Usuario actual
```

**Ejemplo:**
```
Usuario: dkong
Comisiones visibles:
├─ Comisión #5 (creada por rflores, dkong es comisionado) ✅
├─ Comisión #8 (creada por lrios, dkong es comisionado) ✅
└─ Comisión #3 (creada por dkong, dkong es creador) ❌ Solo si es comisionado

Comisiones NO visibles:
└─ Comisión #2 (creada por dkong, pero dkong NO es comisionado) ❌
```

### Rol: `administrativo`
**Qué ve:** Comisiones donde hay comisionados de su mismo ámbito
```sql
WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
  AND c.aprobacion_estado = "APROBADA"
  AND comisionados.ambito_id = ? ← Ámbito del admin
```

### Rol: `jefe`
**Qué ve:** Todas las comisiones aprobadas con presupuesto asignado
```sql
WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
  AND c.aprobacion_estado = "APROBADA"
```

### Rol: `admin`
**Qué ve:** Todas las comisiones aprobadas con presupuesto asignado
```sql
WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
  AND c.aprobacion_estado = "APROBADA"
```

---

## 🎯 Casos de Uso

### Caso 1: Usuario como Comisionado
```
Escenario:
  rflores crea comisión #5 a Cusco
  Asigna como comisionado a: dkong

Resultado antes del fix:
  dkong accede a "Emisión de Formatos"
  → No ve comisión #5 ❌

Resultado después del fix:
  dkong accede a "Emisión de Formatos"
  → Ve comisión #5 ✅
  → Puede emitir formato para su parte
```

### Caso 2: Usuario como Creador
```
Escenario:
  dkong crea comisión #7
  Asigna como comisionados a: rflores, lrios

Resultado:
  dkong accede a "Emisión de Formatos"
  → NO ve comisión #7 (no es comisionado) ✓
  → Esto es correcto, es el creador, no el comisionado
```

### Caso 3: Usuario en Múltiples Comisiones
```
Escenario:
  dkong es comisionado en:
    - Comisión #5 (a Cusco)
    - Comisión #8 (a Lima)
    - Comisión #12 (a Huancayo)

Resultado:
  dkong accede a "Emisión de Formatos"
  → Ve #5, #8, #12 (todas donde es comisionado) ✅
  → Puede emitir formato para cada una
```

---

## 🧪 Cómo Probar

### Test 1: Verificar que usuario "usuario" ve sus comisiones

```bash
# 1. Login con usuario dkong
POST /api/auth/login
{
  "username": "dkong",
  "password": "password"
}
→ Obtener token

# 2. Solicitar comisiones para emisión
GET /api/comisiones/emision-formatos
Authorization: Bearer TOKEN

# 3. Verificar respuesta
Debe retornar: Comisiones donde dkong es comisionado
{
  "success": true,
  "total": 2,
  "comisiones": [
    {
      "id": 5,
      "lugar": "Cusco",
      "modalidad_viaje": "Terrestre",
      "comisionados": [
        {
          "usuario_id": 16,
          "usuario_nombre": "Diego Kong",
          "dias": 3,
          "monto": 450.00
        }
      ]
    },
    ...
  ]
}
```

### Test 2: Verificar distinción de roles

```
Comisión #5:
  Creador: rflores (usuario_id = 3)
  Comisionados: dkong, lrios
  Estado: APROBADA, PRESUPUESTO ASIGNADO

Usuarios | Endpoint | Ve Comisión #5?
----------|----------|----------------
dkong | /emision-formatos | ✅ (es comisionado)
lrios | /emision-formatos | ✅ (es comisionado)
rflores | /emision-formatos | ❌ (es creador, no comisionado)
jefe | /emision-formatos | ✅ (ve todas)
admin | /emision-formatos | ✅ (ve todas)
```

---

## 📝 Notas Técnicas

### Cambio en Query
```sql
-- ANTES (incorrecto para usuarios):
WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
  AND c.aprobacion_estado = "APROBADA"
  AND c.usuario_id = ? ← Busca por creador

-- DESPUÉS (correcto para usuarios):
INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
INNER JOIN users comisionados ON cc.usuario_id = comisionados.id
WHERE c.presupuesto_estado = "PRESUPUESTO ASIGNADO"
  AND c.aprobacion_estado = "APROBADA"
  AND comisionados.id = ? ← Busca por comisionado
```

### Compatibilidad
- ✅ No afecta otros roles (jefe, admin, administrativo)
- ✅ Mantiene seguridad (cada usuario solo ve sus comisiones)
- ✅ Compatible con permisos existentes
- ✅ No requiere cambios en BD

### Performance
- ✅ Usa INNER JOIN (eficiente)
- ✅ Mantiene DISTINCT para evitar duplicados
- ✅ Índices existentes en `comision_comisionados` optimizan la búsqueda

---

## 🔗 Relación con Otras Funciones

Este fix es **consistente** con `listarComisiones()` que ya usaba:
```javascript
if (rol === 'usuario') {
  // Los usuarios ven comisiones donde son comisionados
  query += ` INNER JOIN comision_comisionados cc ON c.id = cc.comision_id
             INNER JOIN users u ON cc.usuario_id = u.id`;
  condiciones.push('u.id = ?');
  params.push(usuarioId);
}
```

Ahora ambas funciones usan la misma lógica de filtrado. ✅

---

## ✨ Beneficios

| Aspecto | Mejora |
|---------|--------|
| **Funcionalidad** | Usuarios ahora pueden ver y emitir formatos para sus comisiones |
| **Consistencia** | Mismo filtrado en `listarComisiones` y `emisionFormatos` |
| **Seguridad** | Cada usuario solo ve sus comisiones asignadas |
| **Experiencia** | Usuario "usuario" puede completar su flujo de trabajo |

---

**Versión:** 1.0.0  
**Fecha:** Marzo 20, 2026  
**Status:** ✅ Implementado y Probado  
**Archivos Modificados:** 1
- `backend/controllers/comisionController.js` (función `obtenerComisionesParaEmisionFormatos`)
