# 🔧 GUÍA PASO A PASO: VERIFICACIÓN Y TESTING

## ✅ VERIFICACIÓN PRE-RESTART

Antes de reiniciar el frontend, aquí puedes verificar que todo está en su lugar:

### 1. Verificar Import en routes.js

**Abre archivo:** `material-dashboard-react/src/routes.js`

**Busca (Ctrl+F):** `import GestionCertificacionesCredito`

**Deberías ver:**
```javascript
import GestionCertificacionesCredito from 'pages/Gestion/GestionCertificacionesCredito';
```

✅ **Si ves esto:** Correcto ✓

---

### 2. Verificar Menú para JEFE (Línea ~104)

**Busca (Ctrl+F):** `// JEFE: SOLO VE SUS PROPIAS COMISIONES`

**Navega hacia abajo y busca:** `type: 'collapse',` después de "Comisiones"

**Deberías ver:**
```javascript
{
  type: 'collapse',
  name: 'Certificaciones de Crédito',
  key: 'gestion-certificaciones-credito',
  icon: <Icon fontSize="small">verified_user</Icon>,
  route: '/gestion/certificaciones-credito',
  component: <GestionCertificacionesCredito />,
},
```

✅ **Si ves esto:** Correcto ✓

---

### 3. Verificar Menú para USUARIO (Línea ~154)

**Busca (Ctrl+F):** `// USUARIO: VE TODAS LAS COMISIONES`

**Navega hacia abajo y busca:** El menú de Certificaciones

**Deberías ver el mismo block que arriba**

✅ **Si ves esto:** Correcto ✓

---

### 4. Verificar Menú para ADMINISTRATIVO (Línea ~187)

**Busca (Ctrl+F):** `// ADMINISTRATIVO: CASOS COMISIONES Y REPORTES`

**Navega hacia abajo y busca:** El menú de Certificaciones

**Deberías ver el mismo block**

✅ **Si ves esto:** Correcto ✓

---

### 5. Verificar allRoutes/ADMIN (Línea ~255)

**Busca (Ctrl+F):** `// ADMIN: VE TODO`

**Navega hacia abajo y busca:** El menú de Certificaciones

**Deberías ver el mismo block**

✅ **Si ves esto:** Correcto ✓

---

## 🚀 RESTART DEL FRONTEND

### Opción 1: Con Terminal Integrada de VS Code

1. **Abre Terminal en VS Code**
   - Atajo: `Ctrl + J` o `Ctrl + ñ`

2. **Navega a la carpeta frontend**
   ```bash
   cd material-dashboard-react
   ```

3. **Inicia el servidor**
   ```bash
   npm start
   ```

4. **Espera el mensaje:**
   ```
   Compiled successfully!
   
   You can now view material-dashboard-react in the browser.
   
   Local:            http://localhost:3000
   ```

### Opción 2: Con PowerShell

```powershell
# Abre PowerShell
# Navega a la carpeta del proyecto
cd D:\COMISIONES_AAAU\material-dashboard-react

# Inicia npm
npm start
```

---

## 🌐 PRUEBA EN NAVEGADOR

### 1. Abrir Navegador
```
http://localhost:3000
```

### 2. Login
- **Usuario:** (tu usuario JEFE/USUARIO/ADMIN)
- **Contraseña:** (tu contraseña)
- **Click:** Login

### 3. Verificar Menú Lateral

**Deberías ver:**
```
Dashboard
┌─────────────────────────────┐
Gestión
├─ Comisiones
├─ 🆕 Certificaciones de Crédito  ← NUEVO
├─ Emisión de Formatos
├─ Ámbitos
├─ ...
└─ ...

Reportes
├─ ...
```

**Si ves "Certificaciones de Crédito":**
✅ MENÚ CORRECTO

---

## 🎯 PRUEBA DE NAVEGACIÓN

### 1. Click en "Certificaciones de Crédito"

**Lo que debería pasar:**
- El sidebar se cierra (en móvil)
- La ruta cambia a: `http://localhost:3000/gestion/certificaciones-credito`
- Se carga el componente

### 2. Deberías Ver

```
┌─────────────────────────────────────────┐
│ Certificaciones de Crédito              │
├─────────────────────────────────────────┤
│ [+ Agregar Nueva Certificación]         │
├─────────────────────────────────────────┤
│ Tabla con:                              │
│ • Nota                                  │
│ • Mes                                   │
│ • Fecha Aprobación                      │
│ • Estado                                │
│ • Acciones (Editar, Eliminar)          │
└─────────────────────────────────────────┘
```

✅ **Si ves esto:** COMPONENTE FUNCIONANDO

---

## 🔨 PRUEBA CRUD

### 1. Crear Nueva Certificación

**Click:** `[+ Agregar Nueva Certificación]`

**Modal aparece:**
```
┌─────────────────────────────┐
│ Nueva Certificación         │
├─────────────────────────────┤
│ Nota:          [________]   │
│ Mes:           [________]   │
│ Fecha Aprob.:  [________]   │
│ Fecha Doc.:    [________]   │
│ Estado:        [________]   │
│ Tipo Documento:[________]   │
│ Número Doc.:   [________]   │
│ Justificación: [________]   │
│ Meta:          [________]   │
│ Fuente Financ::[________]   │
│                             │
│ [Cancelar]  [Guardar]       │
└─────────────────────────────┘
```

**Llenar campos:**
- Nota: "Certificación Prueba"
- Mes: "2024-01"
- Fecha Aprobación: 2024-01-15
- Fecha Documento: 2024-01-10
- Estado: "pendiente"
- Tipo Documento: "cédula"
- Número: "12345678"
- Meta: (seleccionar alguna)
- Fuente: (seleccionar alguna)

**Click:** `[Guardar]`

**Deberías ver:**
```
✅ ¡Certificación creada exitosamente!
```

✅ **Si ves el toast:** CREATE FUNCIONANDO

---

### 2. Verificar en Tabla

**La tabla debe mostrar la nueva certificación:**
```
┌─────────────────────────────────────────┐
│ # │ Nota        │ Mes      │ Estado    │
├─────────────────────────────────────────┤
│ 1 │ Cert Prueba │ 2024-01  │ pendiente │
└─────────────────────────────────────────┘
```

✅ **Si ves la fila:** READ FUNCIONANDO

---

### 3. Editar Certificación

**Click:** Icono [✏️ Editar] en la fila

**Modal de edición abre con datos cargados:**
```
┌─────────────────────────────┐
│ Editar Certificación        │
├─────────────────────────────┤
│ Nota: [Cert Prueba  ]       │ ← Pre-llenado
│ Mes:  [2024-01      ]       │ ← Pre-llenado
│ ...                         │
│ [Cancelar]  [Actualizar]    │
└─────────────────────────────┘
```

**Cambia algo:**
- Nota: "Certificación Prueba ACTUALIZADA"

**Click:** `[Actualizar]`

**Deberías ver:**
```
✅ ¡Certificación actualizada exitosamente!
```

✅ **Si ves el toast:** UPDATE FUNCIONANDO

---

### 4. Eliminar Certificación

**Click:** Icono [🗑️ Eliminar] en la fila

**SweetAlert aparece:**
```
┌─────────────────────────────┐
│ ⚠️  Confirmar Eliminación    │
├─────────────────────────────┤
│ ¿Está seguro de eliminar    │
│ esta certificación?         │
│                             │
│ [Cancelar]  [Eliminar]      │
└─────────────────────────────┘
```

**Click:** `[Eliminar]`

**Deberías ver:**
```
✅ ¡Certificación eliminada exitosamente!
```

**La fila desaparece de la tabla**

✅ **Si ves esto:** DELETE FUNCIONANDO

---

## 🗄️ VERIFICACIÓN DE BASE DE DATOS

### 1. Conectar a MySQL

```bash
# Opción 1: Con MySQL CLI
mysql -u root -p comisiones_aaau

# Opción 2: Con MySQL Workbench
# Conectar a localhost:3306
# Seleccionar BD: comisiones_aaau
```

### 2. Verificar Tablas

```sql
-- Ver tablas de certificaciones
SHOW TABLES LIKE '%certificacion%';

-- Deberías ver:
-- certificaciones_credito
-- detalles_certificacion_credito
```

### 3. Verificar Datos

```sql
-- Ver certificaciones creadas
SELECT * FROM certificaciones_credito;

-- Ver detalles
SELECT * FROM detalles_certificacion_credito;

-- Ver vista
SELECT * FROM certificaciones_credito_detalladas;
```

**Deberías ver los datos que creaste en el formulario**

✅ **Si ves los datos:** BASE DE DATOS CORRECTA

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema 1: Menú no aparece después de restart

**Solución:**
1. Limpiar caché del navegador: `Ctrl+Shift+Delete`
2. Limpiar carpeta node_modules de node: `npm cache clean --force`
3. Eliminar package-lock.json: `rm package-lock.json`
4. Reinstalar: `npm install`
5. Restart: `npm start`

### Problema 2: Error "Cannot find module GestionCertificacionesCredito"

**Solución:**
1. Verificar que el archivo existe: `material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js`
2. Verificar la ruta en routes.js: `import GestionCertificacionesCredito from 'pages/Gestion/GestionCertificacionesCredito';`
3. Verificar exportación en el componente: `export default GestionCertificacionesCredito;`

### Problema 3: Componente carga pero no muestra datos

**Solución:**
1. Verificar que backend está ejecutándose
2. Abrir DevTools (F12) → Console
3. Buscar errores de API
4. Verificar que las rutas backend están registradas
5. Hacer request manual: `GET http://localhost:5000/api/certificaciones`

### Problema 4: No puedo crear certificación

**Solución:**
1. Verificar que backend está ejecutándose
2. Abrir DevTools → Network
3. Hacer click en "Agregar Nueva"
4. Verificar request POST en Network tab
5. Ver respuesta del servidor
6. Si error 500: revisar logs del backend

---

## ✅ CHECKLIST POST-TESTING

Después de hacer todas las pruebas, marca lo que funciona:

- [ ] Menú aparece en sidebar
- [ ] Click en menú navega correctamente
- [ ] Página de certificaciones carga sin errores
- [ ] Botón "Agregar Nueva" abre modal
- [ ] Puedo llenar el formulario
- [ ] Click "Guardar" crea certificación
- [ ] Nueva certificación aparece en tabla
- [ ] Click "Editar" abre modal con datos
- [ ] Puedo actualizar datos
- [ ] Click "Eliminar" pide confirmación
- [ ] Confirmación elimina la certificación
- [ ] Datos aparecen en BD (MySQL)
- [ ] No hay errores en Console (F12)
- [ ] Sistema responde rápido

**Si TODOS están checkados: ✅ TODO FUNCIONA PERFECTAMENTE**

---

## 📞 NOTAS IMPORTANTES

1. **Backend debe estar ejecutándose**
   - Asegúrate de que en otra terminal está: `npm run dev` en `backend/`

2. **Puerto 3000 disponible**
   - Si dice puerto ocupado, cambiar o matar proceso: `lsof -ti:3000 | xargs kill -9`

3. **Base de datos disponible**
   - MySQL debe estar corriendo
   - BD `comisiones_aaau` debe existir

4. **Limpiar caché frecuentemente**
   - Node puede cachear módulos
   - Si hay problemas: `npm cache clean --force`

---

## 🎉 PRÓXIMO PASO

Una vez que todo funciona:

1. Haz algunos tests adicionales con datos reales
2. Prueba con diferentes roles (JEFE, USUARIO, ADMIN)
3. Verifica que cada rol ve el menú item
4. Prueba operaciones complejas (multi-detalle certificaciones)
5. Revisa logs de backend para errores

---

**Status:** ✅ LISTO PARA TESTING  
**Fecha:** 2024  
**Versión:** 1.0
