# 🔐 Sistema de Roles y Permisos

## Roles del Sistema

### 1️⃣ **admin** (Administrador)
- **Usuarios**: `admin`
- **Acceso**: Panel administrativo completo
- **Permisos**:
  - Ver TODAS las comisiones (aprobadas o no)
  - Ver TODOS los usuarios del sistema
  - Ver TODOS los ámbitos
  - Ver TODOS los clasificadores
  - Aprobar/Rechazar comisiones
  - Gestionar presupuestos
  - Acceder a todos los reportes

---

### 2️⃣ **jefe** (Jefe de Área)
- **Usuarios**: `snunez`
- **Acceso**: Panel de supervisión
- **Permisos**:
  - Ver comisiones del equipo
  - Aprobar/Rechazar comisiones
  - Supervisar reportes
  - Gestionar su equipo

---

### 3️⃣ **usuario** (Usuario Regular)
- **Usuarios**: `dkong`, `carcos`, `atello`, `nsalinas`, `prengifo`, `ealiaga`, `moyola`, `jmatta`, `calegria`, `lflores`, `fcastillo`, `snunez`, `rflores` *(antes)*, `bpanana`, `epina`, `daguinaga`, `nseijas`, `cangulo`, `lacuna`, `mtalavera`, `jmunante`, `sregalado`, `olopez`, `jferreyros`, `jolortegui`
- **Acceso**: Panel de usuario
- **Permisos**:
  - Ver SOLO SUS PROPIAS comisiones
  - Crear nuevas comisiones
  - Editar sus comisiones (mientras estén pendientes)
  - Enviar comisiones a aprobación
  - Ver el estado de sus comisiones

---

### 4️⃣ **administrativo** (Administrativo - NUEVO)
- **Usuarios**: `rflores`
- **Acceso**: Panel administrativo de lectura
- **Tipo**: 👨‍💼 ADMINISTRATIVO
- **Permisos**:
  - Ver SOLO comisiones en estado **APROBADA**
  - No puede crear comisiones
  - No puede editar comisiones
  - Acceso de lectura solamente
  - Perfecto para:
    - Especialistas administrativos
    - Auditores internos
    - Personal de control presupuestario

---

## 🔄 Flujo de Comisiones por Rol

```
USUARIO CREA → USUARIO EDITA → USUARIO ENVÍA
                                    ↓
                        JEFE APRUEBA
                                    ↓
                   ADMINISTRATIVO VE (Solo lectura)
```

---

## 📊 Tabla Resumen de Accesos

| Función | Admin | Jefe | Usuario | Administrativo |
|---------|-------|------|---------|-----------------|
| Ver todas las comisiones | ✅ | ✅ | ❌ (Solo suyas) | ❌ (Solo aprobadas) |
| Crear comisión | ❌ | ❌ | ✅ | ❌ |
| Editar comisión | ✅ | ✅ | ✅ (Propia) | ❌ |
| Aprobar/Rechazar | ✅ | ✅ | ❌ | ❌ |
| Asignar presupuesto | ✅ | ⚠️ | ❌ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ | ⚠️ (Limitado) |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Credenciales de Prueba

| Usuario | Contraseña | Rol | Dashboard |
|---------|-----------|-----|-----------|
| admin | Autoridad1 | admin | Panel Administrativo |
| snunez | Autoridad1 | jefe | Panel de Jefe |
| dkong | Autoridad1 | usuario | Panel de Usuario |
| **rflores** | **Autoridad1** | **visitador** | **Comisiones Aprobadas** |

---

## ⚠️ Cambios Realizados

### Cambio 1: Nuevo rol "visitador" (Administrativo)
- Actualizado enum en tabla `users`
- `rflores` fue cambiado de `usuario` a `visitador`
- Rol administrativo para consulta de comisiones aprobadas

### Cambio 2: Lógica de filtrado
- Backend ahora valida el rol del usuario
- Los `visitador` ven SOLO comisiones con `aprobacion_estado = 'APROBADA'`
- Los `usuario` ven SOLO sus propias comisiones
- `snunez` mantiene rol de `jefe` para supervisión

---

## 📝 Notas Importantes

1. **El rol `visitador` es ADMINISTRATIVO y de LECTURA SOLAMENTE**
   - No puede crear, editar ni aprobar
   - Ideal para consultas y auditoria

2. **Para cambiar el rol de otro usuario**, usar script:
   ```bash
   node change-user-role.js <username> <nuevo_rol>
   ```

3. **Los 4 roles actuales en el sistema**:
   - `admin` - 1 usuario
   - `jefe` - 1 usuario (snunez)
   - `usuario` - 24 usuarios
   - `visitador` - 1 usuario (rflores)

---

## 🔗 Archivos Relacionados

- `backend/config/database.js` - Enum actualizado
- `backend/models/Comision.js` - Lógica de filtrado por rol
- `backend/controllers/comisionController.js` - Controlador del listado
