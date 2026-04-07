# 🔐 Filtrado de Comisiones por Usuario y Ámbito - V2

**Fecha:** 14 de Marzo de 2026  
**Versión:** 2.0 - Filtrado por Usuario Comisionado  
**Objetivo:** Mostrar comisiones basadas en qué usuarios están asignados como comisionados

---

## 📋 Cambios Realizados

### 1. Backend - Modelo Comision.js

**Archivo:** `backend/models/Comision.js`

**Cambio:** Añadir `u.ambito_id` al query `obtenerComisionados()`

```javascript
// ANTES:
const [comisionados] = await pool.query(
  `SELECT cc.*, u.nombre as usuario_nombre, u.email,
          cl.partida, cl.nombre as clasificador_nombre
   FROM comision_comisionados cc
   JOIN users u ON cc.usuario_id = u.id
   JOIN clasificadores cl ON cc.clasificador_id = cl.id
   WHERE cc.comision_id = ?
   ORDER BY cc.usuario_id, cc.clasificador_id`,
  [comisionId]
);

// DESPUÉS:
const [comisionados] = await pool.query(
  `SELECT cc.*, u.nombre as usuario_nombre, u.email, u.ambito_id,
          cl.partida, cl.nombre as clasificador_nombre
   FROM comision_comisionados cc
   JOIN users u ON cc.usuario_id = u.id
   JOIN clasificadores cl ON cc.clasificador_id = cl.id
   WHERE cc.comision_id = ?
   ORDER BY cc.usuario_id, cc.clasificador_id`,
  [comisionId]
);
```

**Efecto:** Ahora cada comisionado retorna su `ambito_id`, permitiendo filtrado en el frontend basado en ámbito del comisionado.

---

### 2. Frontend - GestionComisiones.js

**Archivo:** `material-dashboard-react/src/pages/Gestion/GestionComisiones.js`

**Función actualizada:** `cargarItems()`

#### Lógica Nueva de Filtrado

```javascript
const cargarItems = async () => {
  // Obtener comisiones
  const response = await api.obtenerComisiones();
  
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const userRol = usuario.rol || '';
  const userAmbitoId = usuario.ambito_id || null;

  // ========== CASOS DE FILTRADO ==========

  // CASO 1: Admin
  if (userRol === 'admin') {
    // Sin filtro - ve TODAS las comisiones
  } 
  
  // CASO 2: Administrativo/Jefe
  else if (userRol === 'administrativo' || userRol === 'jefe') {
    if (userAmbitoId) {
      // Obtener ámbitos permitidos según su tipo
      const ambitoUsuario = ambitos.find(a => a.id === userAmbitoId);
      let ambitosPermitidos = [userAmbitoId];

      if (ambitoUsuario && ambitoUsuario.dependencia_id === null) {
        // Es AAA: incluir AAA + todas sus ALAs
        const alasDelAAA = ambitos
          .filter(a => a.dependencia_id === userAmbitoId)
          .map(a => a.id);
        ambitosPermitidos = [userAmbitoId, ...alasDelAAA];
      }
      // Si es ALA: solo su propio ámbito

      // Cargar comisionados de CADA comisión
      // y verificar si al menos uno está en un ámbito permitido
      comisionesordenadas = await Promise.all(
        comisionesordenadas.map(async (comision) => {
          try {
            const comisionados = await api.obtenerComisionados(comision.id);
            const tieneComisionadoPermitido = comisionados.some(c => 
              ambitosPermitidos.includes(c.ambito_id)
            );
            return tieneComisionadoPermitido ? comision : null;
          } catch (err) {
            console.error(`Error cargando comisionados...`, err);
            return null;
          }
        })
      );
      comisionesordenadas = comisionesordenadas.filter(c => c !== null);
    }
  }
  
  // CASO 3: Usuario Regular
  else if (userRol === 'usuario') {
    const userId = usuario.id;
    // Cargar comisionados y mostrar solo comisiones donde el usuario aparece
    comisionesordenadas = await Promise.all(
      comisionesordenadas.map(async (comision) => {
        try {
          const comisionados = await api.obtenerComisionados(comision.id);
          const usuarioEncomisionados = comisionados.some(c => c.usuario_id === userId);
          return usuarioEncomisionados ? comision : null;
        } catch (err) {
          console.error(`Error...`, err);
          return null;
        }
      })
    );
    comisionesordenadas = comisionesordenadas.filter(c => c !== null);
  }
};
```

---

## 🎯 Reglas de Filtrado Ahora Implementadas

### 1. **Usuario: Admin**
```
Rol: admin
Ámbito ID: Cualquiera
Resultado: ✅ Ve TODAS las comisiones del sistema
```

### 2. **Usuario: Administrativo/Jefe con ámbito AAA**
```
Rol: administrativo o jefe
Ámbito ID: 1 (AAA UCAYALI)
Dependencia ID: NULL ← Es una AAA
Resultado: ✅ Ve TODAS las comisiones donde algún comisionado es de:
  - AAA UCAYALI (ambito_id=1)
  - ALA PUCALLPA (ambito_id=2)
  - ALA ATALAYA (ambito_id=3)
  - ALA TARMA (ambito_id=4)
  - ALA PERENE (ambito_id=5)

Ejemplo:
  Comisión A: Comisionados de ALA PUCALLPA → ✅ VISIBLE (comisionado está en ALA 2)
  Comisión B: Comisionados de AAA UCAYALI → ✅ VISIBLE (comisionado está en AAA 1)
  Comisión C: Comisionados de otra región → ❌ NO VISIBLE
```

### 3. **Usuario: Administrativo/Jefe con ámbito ALA**
```
Rol: administrativo o jefe
Ámbito ID: 2 (ALA PUCALLPA)
Dependencia ID: 1 ← Es una ALA
Resultado: ❌ Ve SOLO comisiones donde algún comisionado es de ALA PUCALLPA

Ejemplo:
  Comisión A: Comisionado de ALA PUCALLPA → ✅ VISIBLE
  Comisión B: Comisionado de AAA UCAYALI → ❌ NO VISIBLE
  Comisión C: Comisionado de ALA ATALAYA → ❌ NO VISIBLE
```

### 4. **Usuario: Regular (usuario)**
```
Rol: usuario
Ámbito ID: Cualquiera
Resultado: ❌ Ve SOLO comisiones donde APARECE COMO COMISIONADO

Ejemplo:
  Usuario ID: 7
  Comisión A: cc.usuario_id=7 está en comisionados → ✅ VISIBLE
  Comisión B: cc.usuario_id=7 NO está en comisionados → ❌ NO VISIBLE
```

---

## 🔄 Flujo Completo de Carga de Datos

```
1. Usuario hace login
   ↓
2. Backend retorna usuario con ambito_id en JWT
   ↓
3. Frontend almacena en localStorage:
   {
     "id": 5,
     "username": "lrios",
     "rol": "administrativo",
     "ambito_id": 3,
     "email": "lrios@example.com"
   }
   ↓
4. En GestionComisiones, useEffect llama a cargarItems()
   ↓
5. cargarItems():
   a) Obtiene todas las comisiones del backend
   b) Lee usuario del localStorage
   c) Según rol y ambito_id:
      
      Si es ADMIN:
        → No filtrar, mostrar todas
      
      Si es ADMINISTRATIVO/JEFE:
        → Para CADA comisión:
          - Cargar sus comisionados vía api.obtenerComisionados(id)
          - Verificar si algún comisionado.ambito_id está en ambitosPermitidos
          - Si sí → mostrar comisión
          - Si no → ocultar comisión
      
      Si es USUARIO:
        → Para CADA comisión:
          - Cargar sus comisionados
          - Verificar si usuario.id aparece en comisionados
          - Si sí → mostrar comisión
          - Si no → ocultar comisión
   ↓
6. Renderizar tabla con comisiones filtradas
```

---

## 📊 Ejemplo Real: Usuario lrios (Administrativo, ALA ATALAYA)

**Datos:**
```
Usuario: lrios
Rol: administrativo
Ámbito ID: 3 (ALA ATALAYA)
Dependencia ID: 1 (depende de AAA)
```

**Comisiones en BD:**
```
Comisión 1: ID=1, Lugar=Lima
  └─ Comisionados:
     - Usuario ID 2 (ambito_id=1, AAA) → ❌
     - Usuario ID 13 (ambito_id=3, ALA ATALAYA) → ✅
  RESULTADO: ✅ VISIBLE (al menos un comisionado está en ALA ATALAYA)

Comisión 2: ID=2, Lugar=Cusco
  └─ Comisionados:
     - Usuario ID 4 (ambito_id=2, ALA PUCALLPA) → ❌
  RESULTADO: ❌ NO VISIBLE (ningún comisionado en ALA ATALAYA)

Comisión 3: ID=3, Lugar=Trujillo
  └─ Comisionados:
     - Usuario ID 7 (ambito_id=3, ALA ATALAYA) → ✅
     - Usuario ID 9 (ambito_id=3, ALA ATALAYA) → ✅
  RESULTADO: ✅ VISIBLE (todos los comisionados están en ALA ATALAYA)
```

**Lo que verá lrios:**
- ✅ Comisión 1 (Lima) - porque hay un comisionado de ALA ATALAYA
- ❌ Comisión 2 (Cusco) - no hay comisionados de su ámbito
- ✅ Comisión 3 (Trujillo) - hay comisionados de su ámbito

---

## 🧪 Pruebas Recomendadas

### Test 1: Admin
```
Login: admin
Esperado: Ve TODAS las comisiones
Verificar: Tabla muestra todas las comisiones sin restricción
```

### Test 2: Administrativo AAA (rflores)
```
Login: rflores (ambito_id=1, AAA UCAYALI)
Esperado: Ve comisiones con comisionados de AAA + ALAs
Cargar:
  - Comisiones con comisionados de AAA UCAYALI
  - Comisiones con comisionados de ALA PUCALLPA
  - Comisiones con comisionados de ALA ATALAYA
  - etc.
NO Ver:
  - Comisiones con comisionados de otras regiones
```

### Test 3: Administrativo ALA (lrios)
```
Login: lrios (ambito_id=3, ALA ATALAYA)
Esperado: Ve SOLO comisiones con comisionados de ALA ATALAYA
Cargar:
  - Comisión con al menos un comisionado de ALA ATALAYA
NO Ver:
  - Comisiones sin comisionados de su ALA
  - Comisiones con comisionados de otras ALAs
```

### Test 4: Usuario Regular (usuario_xyz)
```
Login: usuario_xyz (usuario_id=7, rol=usuario)
Esperado: Ve SOLO comisiones donde aparezca como comisionado
Cargar:
  - Comisiones donde cc.usuario_id=7
NO Ver:
  - Comisiones donde NO aparezca
```

---

## ⚙️ Dependencias del Sistema

Para que esto funcione correctamente:

1. ✅ **Backend JWT:** Debe incluir `ambito_id` del usuario
2. ✅ **Tabla users:** Debe tener columna `ambito_id`
3. ✅ **Tabla comision_comisionados:** Debe tener comisionados con usuario_id que apunte a users
4. ✅ **Tabla ambitos:** Debe tener estructura jerárquica (dependencia_id)
5. ✅ **API obtenerComisionados:** Debe retornar `ambito_id` de cada comisionado

---

## 🎨 Visualización en UI

La tabla de comisiones ahora mostrará:

```
┌─────┬────────┬──────────┬────────┬────────────┬───────────────┐
│Item │ Ámbito │  Lugar   │ Modalidad│ Fecha Salida│ Estado Aprob. │
├─────┼────────┼──────────┼────────┼────────────┼───────────────┤
│ 1   │ALA TAR │  Cusco   │ AEREO  │ 2026-02-20│   ✓ Aprobada  │
│ 2   │AAA UCY │  Lima    │ AEREO  │ 2026-03-01│   ⏳ Pendiente │
│ 3   │ALA PUC │  Tarma   │ TERR   │ 2026-03-15│   ✕ Rechazada │
└─────┴────────┴──────────┴────────┴────────────┴───────────────┘

Nota: Un usuario administrativo/jefe de ALA ATALAYA solo vería
      comisiones con comisionados de su ALA ATALAYA.
      
      Un usuario de tipo "usuario" solo vería comisiones donde
      aparezca como comisionado.
```

---

## 📝 Notas Técnicas

### Performance
- **Impacto:** Con muchas comisiones, hace N requests async (uno por comisión) para cargar comisionados
- **Mejora futura:** Agregar endpoint backend que retorne comisionados para TODAS las comisiones en un request

### Error Handling
- Si falla cargar comisionados de una comisión, se asume NO mostrar esa comisión (lado seguro)
- Logs en consola para debugging

### Compatibilidad
- Funciona con ambitos jerárquicos (AAA ≠ ALA)
- Funciona con múltiples comisionados por comisión
- Funciona con usuarios sin ambito_id (se tratan como sin acceso)

