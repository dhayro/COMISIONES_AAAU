# 🔐 Filtrado de Comisiones por Ámbito - Implementación

**Fecha:** 14 de Marzo de 2026  
**Objetivo:** Filtrar comisiones según el rol y ámbito del usuario logueado

---

## 📋 Cambios Realizados

### Archivo: `material-dashboard-react/src/pages/Gestion/GestionComisiones.js`

#### 1. **Actualizar useEffect para cargar ámbitos primero**

```javascript
useEffect(() => {
  cargarAmbitos();
  cargarUsuarios();
  cargarClasificadores();
  cargarMetas();
  cargarCostosViaje();
}, []);

// Nuevo useEffect: una vez que ámbitos estén cargados, cargar comisiones
useEffect(() => {
  if (ambitos.length > 0) {
    cargarItems();
  }
}, [ambitos]);
```

#### 2. **Mejorar función cargarItems() con filtrado por rol y ámbito**

```javascript
const cargarItems = async () => {
  try {
    setLoading(true);
    const response = await api.obtenerComisiones();

    // Obtener datos del usuario actual del localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const userRol = usuario.rol || '';
    const userAmbitoId = usuario.ambito_id || null;

    // Ordenar por fecha de salida (mayor a menor - más reciente primero)
    let comisionesordenadas = (response || []).sort((a, b) => {
      const fechaA = new Date(a.fecha_salida);
      const fechaB = new Date(b.fecha_salida);
      return fechaB - fechaA;
    });

    // ========== FILTRADO POR AMBITO Y ROL ==========
    // Admin: ve todas las comisiones
    if (userRol === 'admin') {
      // Sin filtro - ve todo
    } 
    // Administrativo: ver según su ámbito
    else if (userRol === 'administrativo' || userRol === 'jefe') {
      if (userAmbitoId) {
        // Verificar si el ámbito del usuario es AAA o ALA
        const ambitoUsuario = ambitos.find(a => a.id === userAmbitoId);
        
        if (ambitoUsuario && ambitoUsuario.dependencia_id === null) {
          // Es una AAA (sin dependencia) - ve todas las comisiones de su AAA y sus ALAs
          const ambitosDelUsuario = [userAmbitoId];
          const alasDelAAA = ambitos
            .filter(a => a.dependencia_id === userAmbitoId)
            .map(a => a.id);
          ambitosDelUsuario.push(...alasDelAAA);
          
          comisionesordenadas = comisionesordenadas.filter(comision => 
            ambitosDelUsuario.includes(comision.ambito_id)
          );
        } else {
          // Es una ALA (tiene dependencia) - ve solo comisiones de su ALA
          comisionesordenadas = comisionesordenadas.filter(comision => 
            comision.ambito_id === userAmbitoId
          );
        }
      }
    }
    // Usuario regular: solo ve sus propias comisiones
    else if (userRol === 'usuario') {
      const userId = usuario.id;
      comisionesordenadas = comisionesordenadas.filter(comision => 
        comision.usuario_id === userId
      );
    }

    // Asegurar que cada comisión tenga ambito_nombre
    const comisionesConAmbito = comisionesordenadas.map((comision) => {
      if (comision.ambito_id && !comision.ambito_nombre) {
        const ambitoEncontrado = ambitos.find((a) => a.id === comision.ambito_id);
        if (ambitoEncontrado) {
          return { ...comision, ambito_nombre: ambitoEncontrado.nombre_corto || ambitoEncontrado.nombre };
        }
      }
      return comision;
    });

    setItems(comisionesConAmbito);
  } catch (err) {
    console.error('Error cargando comisiones:', err.message);
    setError('Error cargando comisiones');
  } finally {
    setLoading(false);
  }
};
```

---

## 🎯 Reglas de Filtrado Implementadas

### 1. **Usuario Admin**
```
Rol: admin
Ámbito ID: Cualquiera
Resultado: ✅ Ve TODAS las comisiones
```

### 2. **Administrativo/Jefe con AAA (Administrador de todas las ALAs)**
```
Rol: administrativo o jefe
Ámbito ID: 1 (AAA UCAYALI)
Dependencia ID: NULL ← Es una AAA
Resultado: ✅ Ve TODAS las comisiones de su AAA + todas sus ALAs
Ejemplo: Ve comisiones de:
  - AAA UCAYALI
  - ALA PUCALLPA
  - ALA ATALAYA
  - ALA TARMA
  - ALA PERENE
```

### 3. **Administrativo/Jefe con ALA (Operador de ALA específica)**
```
Rol: administrativo o jefe
Ámbito ID: 2 (ALA PUCALLPA)
Dependencia ID: 1 ← Es una ALA (apunta a AAA)
Resultado: ❌ Ve SOLO las comisiones de su ALA PUCALLPA
```

### 4. **Usuario Regular**
```
Rol: usuario
Ámbito ID: Cualquiera
Resultado: ❌ Ve SOLO sus propias comisiones (usuario_id = su id)
```

---

## 🔄 Flujo de Carga de Datos

```
1. useEffect inicial:
   - Cargar ambitos
   - Cargar usuarios
   - Cargar clasificadores
   - Cargar metas
   - Cargar costos de viaje

2. Cuando ámbitos se cargan:
   - Ejecutar cargarItems()
   
3. En cargarItems():
   - Obtener usuario logueado del localStorage
   - Obtener todas las comisiones del backend
   - Aplicar filtrado según rol y ámbito_id
   - Mostrar solo las comisiones permitidas
```

---

## 💾 Datos Persistidos

El usuario logueado se almacena en localStorage con estructura:

```json
{
  "id": 5,
  "username": "lrios",
  "rol": "administrativo",
  "ambito_id": 2,
  "email": "lrios@example.com",
  "nombre": "Luis Ríos"
}
```

El filtrado lee:
- `usuario.rol` - Para determinar tipo de acceso
- `usuario.ambito_id` - Para determinar qué ámbitos puede ver
- `usuario.id` - Para usuarios regulares que solo ven sus comisiones

---

## ✨ Ventajas

1. ✅ **Seguridad en Nivel de Aplicación:** Complementa la seguridad del backend
2. ✅ **Experiencia de Usuario:** Solo ve datos permitidos
3. ✅ **Jerarquía Respetada:** Entiende AAA vs ALA automáticamente
4. ✅ **Sin Cambios en Backend:** Usa endpoint existente, filtra en cliente
5. ✅ **Escalable:** Funciona con cualquier número de ámbitos

---

## 🧪 Pruebas Recomendadas

### Test 1: Admin
1. Login como admin
2. Debería ver TODAS las comisiones
3. No debe haber restricción

### Test 2: Administrativo AAA (rflores)
1. Login como rflores (ambito_id=1, AAA)
2. Debería ver comisiones de:
   - AAA UCAYALI
   - ALA PUCALLPA
   - ALA ATALAYA
   - ALA TARMA
   - ALA PERENE
3. Total: todas las comisiones

### Test 3: Administrativo ALA (lrios)
1. Login como lrios (ambito_id=2, ALA PUCALLPA)
2. Debería ver SOLO comisiones con ambito_id=2
3. No debe ver otras ALAs ni la AAA

### Test 4: Usuario Regular
1. Login como usuario común
2. Debería ver SOLO comisiones donde usuario_id = su id
3. Otras comisiones no visibles

---

## 🔧 Configuración del localStorage

Al hacer login, el backend debe retornar un usuario con:
```json
{
  "id": X,
  "username": "...",
  "rol": "admin|administrativo|jefe|usuario",
  "ambito_id": Y,
  "email": "...",
  "nombre": "..."
}
```

Esto se almacena con:
```javascript
localStorage.setItem('usuario', JSON.stringify(usuario));
```

Y se accede con:
```javascript
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
```

