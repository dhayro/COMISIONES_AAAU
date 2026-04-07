# 📝 CAMBIOS EXACTOS - Línea por Línea (31-03-2026)

**Versión:** Documentación Técnica  
**Fecha:** 31-03-2026  
**Propósito:** Referencia exacta de modificaciones

---

## 📁 ARCHIVO 1: backend/models/FormatoEmision.js

### Ubicación: Línea ~91 (Función `listar`)

**ANTES:**
```javascript
static async listar(filtros = {}, usuarioId = null, rol = null) {
  try {
    let query = `
      SELECT fe.*, 
             u.nombre as usuario_nombre,
             u.ambito_id,
             a.nombre_corto as ambito_nombre,
             c.lugar as comision_lugar,
             cc.nota as certificacion_nota,
             COUNT(fed.id) as total_detalles
      FROM formato_emisiones fe
      LEFT JOIN users u ON fe.usuario_id = u.id
      LEFT JOIN ambitos a ON u.ambito_id = a.id
      LEFT JOIN comisiones c ON fe.comision_id = c.id
      LEFT JOIN certificaciones_credito cc ON fe.certificacion_id = cc.id
      LEFT JOIN formato_emisiones_detalles fed ON fe.id = fed.formato_emision_id
      WHERE 1=1
    `;

    const params = [];

    // Filtro por rol
    if (rol === 'usuario' && usuarioId) {
      query += ` AND fe.usuario_id = ?`;
      params.push(usuarioId);
    }
    // ... resto del código
```

**DESPUÉS:**
```javascript
static async listar(filtros = {}, usuarioId = null, rol = null, userAmbitoId = null) {
  try {
    let query = `
      SELECT fe.*, 
             u.nombre as usuario_nombre,
             u.ambito_id,
             a.nombre_corto as ambito_nombre,
             c.lugar as comision_lugar,
             cc.nota as certificacion_nota,
             COUNT(fed.id) as total_detalles
      FROM formato_emisiones fe
      LEFT JOIN users u ON fe.usuario_id = u.id
      LEFT JOIN ambitos a ON u.ambito_id = a.id
      LEFT JOIN comisiones c ON fe.comision_id = c.id
      LEFT JOIN certificaciones_credito cc ON fe.certificacion_id = cc.id
      LEFT JOIN formato_emisiones_detalles fed ON fe.id = fed.formato_emision_id
      WHERE 1=1
    `;

    const params = [];

    // 🆕 Filtro por rol - ACTUALIZADO CON FILTRO AMBITO
    if (rol === 'usuario' && usuarioId) {
      // USUARIO: Ver solo sus propios formatos
      query += ` AND fe.usuario_id = ?`;
      params.push(usuarioId);
      console.log(`🔐 FILTRO: USUARIO (id=${usuarioId})`);
    } else if (rol === 'administrativo' && userAmbitoId) {
      // 🆕 ADMINISTRATIVO: Ver solo formatos de usuarios del mismo ámbito
      query += ` AND u.ambito_id = ?`;
      params.push(userAmbitoId);
      console.log(`🔐 FILTRO: ADMINISTRATIVO (ambito_id=${userAmbitoId})`);
    }
    // JEFE y ADMIN: ven todos (sin filtro adicional)

    // Filtro por estado
    if (filtros.estado_emision) {
      query += ` AND fe.estado_emision = ?`;
      params.push(filtros.estado_emision);
    }

    // Filtro por comisión
    if (filtros.comision_id) {
      query += ` AND fe.comision_id = ?`;
      params.push(filtros.comision_id);
    }

    // Filtro por tipo de emisión
    if (filtros.tipo_emision) {
      query += ` AND fe.tipo_emision = ?`;
      params.push(filtros.tipo_emision);
    }

    query += ` GROUP BY fe.id ORDER BY fe.fecha_emision DESC`;

    const [formatos] = await pool.query(query, params);
    return formatos;
  } catch (error) {
    throw new Error(`Error al listar formatos: ${error.message}`);
  }
}
```

**Cambios Específicos:**
```diff
- static async listar(filtros = {}, usuarioId = null, rol = null) {
+ static async listar(filtros = {}, usuarioId = null, rol = null, userAmbitoId = null) {
  
  // Cambio en la lógica de filtrado:
  if (rol === 'usuario' && usuarioId) {
-   query += ` AND fe.usuario_id = ?`;
-   params.push(usuarioId);
+   query += ` AND fe.usuario_id = ?`;
+   params.push(usuarioId);
+   console.log(`🔐 FILTRO: USUARIO (id=${usuarioId})`);
+ } else if (rol === 'administrativo' && userAmbitoId) {
+   query += ` AND u.ambito_id = ?`;
+   params.push(userAmbitoId);
+   console.log(`🔐 FILTRO: ADMINISTRATIVO (ambito_id=${userAmbitoId})`);
  }
```

---

## 📁 ARCHIVO 2: backend/controllers/formatoEmisionController.js

### Ubicación: Línea ~175 (Función `listar`)

**ANTES:**
```javascript
exports.listar = async (req, res) => {
  try {
    const { estado_emision, comision_id, tipo_emision } = req.query;
    const usuarioId = req.user.id;
    const rol = req.user.rol;

    const filtros = {};
    if (estado_emision) filtros.estado_emision = estado_emision;
    if (comision_id) filtros.comision_id = comision_id;
    if (tipo_emision) filtros.tipo_emision = tipo_emision;

    const formatos = await FormatoEmision.listar(filtros, usuarioId, rol);

    res.json({
      success: true,
      total: formatos.length,
      formatos
    });
  } catch (error) {
    console.error('❌ Error al listar formatos:', error.message);
    res.status(500).json({ error: error.message });
  }
};
```

**DESPUÉS:**
```javascript
exports.listar = async (req, res) => {
  try {
    const { estado_emision, comision_id, tipo_emision } = req.query;
    const usuarioId = req.user.id;
    const rol = req.user.rol;
    const userAmbitoId = req.user.ambito_id;  // 🆕 Obtener ambito_id del usuario

    const filtros = {};
    if (estado_emision) filtros.estado_emision = estado_emision;
    if (comision_id) filtros.comision_id = comision_id;
    if (tipo_emision) filtros.tipo_emision = tipo_emision;

    // 🆕 Pasar userAmbitoId para filtrar administrativos por ámbito
    const formatos = await FormatoEmision.listar(filtros, usuarioId, rol, userAmbitoId);

    res.json({
      success: true,
      total: formatos.length,
      formatos
    });
  } catch (error) {
    console.error('❌ Error al listar formatos:', error.message);
    res.status(500).json({ error: error.message });
  }
};
```

**Cambios Específicos:**
```diff
+ const userAmbitoId = req.user.ambito_id;  // 🆕 Obtener ambito_id del usuario

- const formatos = await FormatoEmision.listar(filtros, usuarioId, rol);
+ // 🆕 Pasar userAmbitoId para filtrar administrativos por ámbito
+ const formatos = await FormatoEmision.listar(filtros, usuarioId, rol, userAmbitoId);
```

---

## 📁 ARCHIVO 3: backend/controllers/metaController.js

### Ubicación: Línea ~3-30 (Función `listar`)

**ANTES:**
```javascript
exports.listar = async (req, res) => {
  try {
    const metas = await Meta.listar();
    res.json(metas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**DESPUÉS:**
```javascript
exports.listar = async (req, res) => {
  try {
    const rol = req.user?.rol;  // 🆕 Obtener rol del usuario
    const userAmbitoId = req.user?.ambito_id;  // 🆕 Obtener ambito_id del usuario

    console.log(`📍 LISTAR METAS - Rol: ${rol}, Ámbito: ${userAmbitoId}`);

    let metas;
    
    // 🆕 Filtrar según el rol
    if (rol === 'admin') {
      // ADMIN: Ve todas las metas
      console.log(`🔐 Rol ADMIN: mostrando todas las metas`);
      metas = await Meta.listar();
    } else if ((rol === 'administrativo' || rol === 'jefe') && userAmbitoId) {
      // 🆕 ADMINISTRATIVO y JEFE: Ver solo metas de su ámbito
      console.log(`🔐 Rol ${rol}: mostrando solo metas del ámbito ${userAmbitoId}`);
      metas = await Meta.listarPorAmbito(userAmbitoId);
    } else if (rol === 'usuario' && userAmbitoId) {
      // 🆕 USUARIO: Ver solo metas de su ámbito
      console.log(`🔐 Rol usuario: mostrando solo metas del ámbito ${userAmbitoId}`);
      metas = await Meta.listarPorAmbito(userAmbitoId);
    } else {
      // 🆕 Sin rol o sin ambito_id: No mostrar nada
      console.log(`⚠️  Sin rol o sin ambito_id: devolviendo array vacío`);
      metas = [];
    }

    console.log(`✅ Metas a mostrar: ${metas.length}`);
    res.json(metas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Cambios Específicos:**
```diff
exports.listar = async (req, res) => {
  try {
-   const metas = await Meta.listar();
-   res.json(metas);
+   const rol = req.user?.rol;  // 🆕 Obtener rol del usuario
+   const userAmbitoId = req.user?.ambito_id;  // 🆕 Obtener ambito_id del usuario
+
+   console.log(`📍 LISTAR METAS - Rol: ${rol}, Ámbito: ${userAmbitoId}`);
+
+   let metas;
+   
+   // 🆕 Filtrar según el rol
+   if (rol === 'admin') {
+     console.log(`🔐 Rol ADMIN: mostrando todas las metas`);
+     metas = await Meta.listar();
+   } else if ((rol === 'administrativo' || rol === 'jefe') && userAmbitoId) {
+     console.log(`🔐 Rol ${rol}: mostrando solo metas del ámbito ${userAmbitoId}`);
+     metas = await Meta.listarPorAmbito(userAmbitoId);
+   } else if (rol === 'usuario' && userAmbitoId) {
+     console.log(`🔐 Rol usuario: mostrando solo metas del ámbito ${userAmbitoId}`);
+     metas = await Meta.listarPorAmbito(userAmbitoId);
+   } else {
+     console.log(`⚠️  Sin rol o sin ambito_id: devolviendo array vacío`);
+     metas = [];
+   }
+
+   console.log(`✅ Metas a mostrar: ${metas.length}`);
+   res.json(metas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 📊 Resumen de Cambios

| Archivo | Línea | Tipo | Descripción |
|---------|-------|------|-------------|
| FormatoEmision.js | ~91 | MODIFY | Agregar parámetro userAmbitoId |
| FormatoEmision.js | ~110-125 | ADD | Agregar lógica filtro ambito |
| formatoEmisionController.js | ~182 | ADD | Obtener userAmbitoId |
| formatoEmisionController.js | ~190 | MODIFY | Pasar userAmbitoId a listar() |
| metaController.js | ~3-30 | REPLACE | Nueva lógica de filtrado por rol |

---

## ✅ Verificación

Después de hacer los cambios, verificar:

```bash
# 1. Archivo FormatoEmision.js
grep -n "userAmbitoId" backend/models/FormatoEmision.js
# Debe retornar 2 coincidencias

# 2. Archivo formatoEmisionController.js
grep -n "userAmbitoId" backend/controllers/formatoEmisionController.js
# Debe retornar 2 coincidencias

# 3. Archivo metaController.js
grep -n "Rol admin\|adminitstrativo\|usuario" backend/controllers/metaController.js
# Debe retornar múltiples coincidencias

# 4. Compilar/Validar
npm run lint  # Si hay
npm run build  # Si tiene build step
```

---

**Documento:** Referencia Técnica  
**Actualizado:** 31-03-2026  
**Estado:** COMPLETO

Todos los cambios están especificados línea por línea para fácil referencia durante audit o troubleshooting.
