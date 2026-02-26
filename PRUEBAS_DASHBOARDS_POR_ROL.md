# 🧪 GUÍA DE PRUEBA - Dashboards Personalizados por Rol

**Fecha:** Febrero 11, 2026  
**Versión:** 1.0

---

## 📋 Tabla de Contenidos

1. [Preparación](#preparación)
2. [Prueba como Admin](#prueba-como-admin)
3. [Prueba como Usuario](#prueba-como-usuario)
4. [Checklist de Validación](#checklist-de-validación)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación

### Paso 1: Asegurar que el Backend está ejecutando

```bash
# En otra terminal
cd /d/COMISIONES_AAAU/backend
npm start
```

**Esperado:** 
```
✓ Server running on port 5000
✓ Database connected
```

### Paso 2: Asegurar que el Frontend está ejecutando

```bash
# En otra terminal
cd /d/COMISIONES_AAAU/material-dashboard-react
npm start
```

**Esperado:**
```
✓ Compiled successfully!
✓ On Your Network: http://localhost:3000
```

### Paso 3: Abrir el navegador

```
http://localhost:3000
```

---

## 👤 PRUEBA COMO ADMIN

### Credenciales
```
Usuario: admin
Contraseña: Autoridad1
```

### Paso 1: Inicia Sesión

1. Ve a `http://localhost:3000`
2. Verás la página de login
3. Ingresa:
   - Username: `admin`
   - Password: `Autoridad1`
4. Haz clic en "Sign In"

**Esperado:** Redirige a `/dashboard`

### Paso 2: Verifica el Dashboard Admin

Al entrar deberías ver:

✅ **Título:** "👨‍💼 Panel Administrativo"  
✅ **Subtítulo:** "Resumen general del sistema de comisiones"

### Paso 3: Verifica las Estadísticas

Deberías ver 4 tarjetas:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  📊 Comisiones Registradas                         │
│     Count: [Número]                                │
│     +15% este mes                                  │
│     Icon: ✓ Checkmark verde                        │
│                                                     │
│  👥 Usuarios Activos                               │
│     Count: [Número]                                │
│     del sistema                                    │
│     Icon: ✓ People azul                            │
│                                                     │
│  📍 Ámbitos                                         │
│     Count: [Número]                                │
│     configurados                                   │
│     Icon: ✓ Location naranja                       │
│                                                     │
│  📂 Clasificadores                                 │
│     Count: [Número]                                │
│     partidas presupuestales                        │
│     Icon: ✓ Category rojo                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Paso 4: Verifica Acciones de Administración

Deberías ver una sección con 4 botones:

1. **📋 Gestionar Comisiones**
   - Haz clic → Debería ir a `/gestion/comisiones`
   - El menú lateral debe activar "Comisiones"

2. **👥 Gestionar Usuarios**
   - Haz clic → Debería ir a `/gestion/usuarios`
   - El menú lateral debe activar "Usuarios"

3. **📍 Gestionar Ámbitos**
   - Haz clic → Debería ir a `/gestion/ambitos`
   - El menú lateral debe activar "Ámbitos"

4. **📂 Gestionar Clasificadores**
   - Haz clic → Debería ir a `/gestion/clasificadores`
   - El menú lateral debe activar "Clasificadores"

### Paso 5: Verifica Reportes

Deberías ver 2 botones:

1. **📊 Presupuestos Asignados**
   - Haz clic → Debería ir a `/reportes/presupuestos`

2. **⏳ Presupuestos Pendientes**
   - Haz clic → Debería ir a `/reportes/presupuestos-pendientes`

---

## 👥 PRUEBA COMO USUARIO

### Credenciales (Elige una)
```
Usuario: dkong
Contraseña: Autoridad1

O

Usuario: carcos
Contraseña: Autoridad1

O cualquier otro usuario disponible
```

### Paso 1: Logout del Admin

1. Haz clic en botón "Cerrar Sesión" en la esquina inferior del menú
2. Deberías regresar a login

### Paso 2: Inicia Sesión como Usuario

1. Ingresa credenciales de usuario (ej: `dkong` / `Autoridad1`)
2. Haz clic en "Sign In"

**Esperado:** Redirige a `/dashboard`

### Paso 3: Verifica el Dashboard Usuario

Al entrar deberías ver:

✅ **Título:** "👋 Bienvenido, [Nombre del Usuario]"  
✅ **Subtítulo:** "Gestiona tus comisiones de servicio de forma fácil y rápida"

**Ejemplo:**
```
👋 Bienvenido, DHAYRO KONG TORRES
Gestiona tus comisiones de servicio de forma fácil y rápida
```

### Paso 4: Verifica Estadísticas Personales

Deberías ver 3 tarjetas:

```
┌─────────────────────────────────────────┐
│                                         │
│  📋 Mis Comisiones                      │
│     Count: [Número]                     │
│     Registradas                         │
│                                         │
│  💰 Gasto Total                         │
│     S/. [Monto]                         │
│     Invertido en comisiones             │
│                                         │
│  ⏳ Pendientes de Revisión               │
│     Count: [Número]                     │
│     Esperando aprobación                │
│                                         │
└─────────────────────────────────────────┘
```

### Paso 5: Verifica Tarjetas de Acción (Con Gradientes)

Deberías ver 4 tarjetas grandes con gradientes de colores:

#### 1️⃣ Crear Nueva Comisión (Gradiente Púrpura)
```
┌─────────────────────────────┐
│ ✨ Crear Nueva Comisión     │
│                             │
│ Registra una nueva comisión │
│ de servicio con todos los   │
│ detalles necesarios.        │
│                             │
│       [Crear Ahora]         │
└─────────────────────────────┘
```
- Haz clic → Debería ir a `/comisiones/nueva`

#### 2️⃣ Mis Comisiones (Gradiente Rosa)
```
┌─────────────────────────────┐
│ 📋 Mis Comisiones           │
│                             │
│ Visualiza, edita o elimina  │
│ todas tus comisiones        │
│ registradas.                │
│                             │
│       [Ver Todo]            │
└─────────────────────────────┘
```
- Haz clic → Debería ir a `/gestion/comisiones`

#### 3️⃣ Presupuestos Asignados (Gradiente Azul Ciano)
```
┌─────────────────────────────┐
│ 📊 Presupuestos Asignados   │
│                             │
│ Consulta los presupuestos   │
│ asignados para tus          │
│ comisiones.                 │
│                             │
│       [Ver Reportes]        │
└─────────────────────────────┘
```
- Haz clic → Debería ir a `/reportes/presupuestos`

#### 4️⃣ Estado de Aprobaciones (Gradiente Verde)
```
┌─────────────────────────────┐
│ ✅ Estado de Aprobaciones   │
│                             │
│ Verifica el estado de       │
│ aprobación de tus           │
│ comisiones.                 │
│                             │
│       [Ver Estado]          │
└─────────────────────────────┘
```
- Haz clic → Debería ir a `/aprobaciones`

### Paso 6: Verifica Guía Rápida

Deberías ver una sección con 4 cajas de información:

```
📚 Guía Rápida

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 1️⃣ Crear Comisión│  │ 2️⃣ Editar/Eliminar│  │ 3️⃣ Ver Reportes │  │ 4️⃣ Seguimiento  │
│                  │  │                  │  │                  │  │                  │
│ Haz clic en      │  │ Accede a "Mis    │  │ Genera reportes │  │ Verifica el      │
│ "Crear Nueva     │  │ Comisiones" para │  │ PDF con         │  │ estado de        │
│ Comisión" y      │  │ editar o         │  │ información de  │  │ aprobación en    │
│ completa el      │  │ eliminar datos.  │  │ tus comisiones. │  │ cualquier        │
│ formulario       │  │                  │  │                 │  │ momento.         │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## ✅ Checklist de Validación

### Dashboard Admin

- [ ] Se muestra "Panel Administrativo"
- [ ] Aparecen 4 estadísticas (comisiones, usuarios, ámbitos, clasificadores)
- [ ] Aparece sección "Acciones de Administración" con 4 botones
- [ ] Aparece sección "Reportes y Análisis" con 2 botones
- [ ] Todos los botones navegan a la ruta correcta
- [ ] El menú lateral se activa correctamente al navegar
- [ ] Los números de estadísticas son mayores a 0

### Dashboard Usuario

- [ ] Se muestra "Bienvenido, [Nombre]"
- [ ] Aparecen 3 estadísticas personales
- [ ] Aparecen 4 tarjetas con gradientes de colores
- [ ] Aparece sección "Guía Rápida" con 4 cajas
- [ ] Todos los botones navegan a la ruta correcta
- [ ] El menú lateral se activa correctamente al navegar
- [ ] Los números de estadísticas corresponden al usuario

### Interactividad

- [ ] Cambiar entre admin y usuario (logout/login)
- [ ] Verificar que cada rol ve su dashboard correcto
- [ ] Verificar que la navegación funciona desde todos los botones
- [ ] Verificar que el menú se activa correctamente

---

## 🐛 Troubleshooting

### Problema: Los botones no navegan
**Solución:** 
1. Verifica que React Router esté bien configurado
2. Recarga la página con F5
3. Revisa la consola (F12) para ver errores

### Problema: No aparecen las estadísticas
**Solución:**
1. Verifica que el backend esté ejecutándose
2. Abre DevTools (F12) → Network → Verifica las peticiones al API
3. Revisa si hay errores en la consola

### Problema: El dashboard incorrecto se muestra
**Solución:**
1. Verifica el rol en la consola: `console.log(usuario?.rol)`
2. Asegúrate que el rol es `admin` o `usuario`
3. Revisa el AuthContext para ver cómo se guarda el rol

### Problema: Error al cargar estadísticas
**Solución:**
1. Verifica la conexión al API (`http://localhost:5000`)
2. Revisa los logs del backend para errores
3. Abre DevTools (F12) → Network → Busca errores 404 o 500

### Problema: Menú lateral no se activa
**Solución:**
1. Este fue el problema que arreglamos en `src/examples/Sidenav/index.js`
2. Si aún no funciona, verifica que el cambio esté aplicado
3. Recarga la página

---

## 📸 Capturas de Pantalla Esperadas

### Dashboard Admin
```
[Header con nombre Admin]
┌─────────────────────────────────────────┐
│ 👨‍💼 Panel Administrativo                │
│ Resumen general del sistema              │
├─────────────────────────────────────────┤
│ [Stat 1] [Stat 2] [Stat 3] [Stat 4]    │
├─────────────────────────────────────────┤
│ 🔧 Acciones de Administración           │
│ [Btn 1] [Btn 2] [Btn 3] [Btn 4]        │
├─────────────────────────────────────────┤
│ 📊 Reportes y Análisis                  │
│ [Btn 1] [Btn 2]                        │
└─────────────────────────────────────────┘
```

### Dashboard Usuario
```
[Header con nombre Usuario]
┌─────────────────────────────────────────┐
│ 👋 Bienvenido, [Nombre]                 │
│ Gestiona tus comisiones...              │
├─────────────────────────────────────────┤
│ [Stat 1] [Stat 2] [Stat 3]             │
├─────────────────────────────────────────┤
│ [Tarjeta Gradiente 1] [Tarjeta 2]      │
│ [Tarjeta Gradiente 3] [Tarjeta 4]      │
├─────────────────────────────────────────┤
│ 📚 Guía Rápida                          │
│ [Box 1] [Box 2] [Box 3] [Box 4]       │
└─────────────────────────────────────────┘
```

---

## 🎯 Criterios de Aceptación

✅ **Dashboard Admin:**
- Muestra todas las estadísticas del sistema
- Botones de administración funcionan
- Acceso a reportes disponible
- Diseño profesional y sobrio

✅ **Dashboard Usuario:**
- Muestra estadísticas personales
- Tarjetas de acción clara y visible
- Guía rápida helpful
- Diseño colorido y amigable

✅ **Ambos:**
- Navegación correcta
- Menú lateral se activa
- Sin errores en consola
- Responsive en móvil

---

**Última actualización:** Febrero 11, 2026
