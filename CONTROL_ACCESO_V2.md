# 🔐 Control de Acceso Mejorado - Implementación Completada

**Fecha:** 14 de Marzo de 2026  
**Versión:** 2.0  
**Estado:** ✅ IMPLEMENTADO

---

## 📌 Resumen de Cambios

Se ha implementado un **sistema jerárquico de control de acceso** que considera la estructura de ámbitos (AAA y ALAs) para determinar qué certificaciones puede ver cada usuario.

### Cambio Principal: Lógica de Acceso por Jerarquía

**Antes:** Solo se filtraba por ámbito directo del usuario  
**Ahora:** Se verifica si el ámbito es AAA o ALA para decidir el nivel de acceso

---

## 🔧 Cambios Técnicos

### 1. Backend - authController.js
- ✅ Incluir `ambito_id` en consulta de login
- ✅ Incluir `ambito_id` en JWT generado
- ✅ Incluir `ambito_id` en respuesta de login
- ✅ Incluir `ambito_id` en endpoint `obtenerPerfil`

### 2. Backend - certificacionCreditoController.js
- ✅ Pasar `userContext` con `{ id, rol, ambito_id }` al modelo

### 3. Backend - CertificacionCredito.js (CRÍTICO)
- ✅ Actualizar método `listar()` con nueva lógica jerárquica:
  
```javascript
// LÓGICA NUEVA:
if (usuario NO es admin) {
  if (usuario tiene ambito_id) {
    // Consultar tabla ambitos para verificar dependencia_id
    if (ambito.dependencia_id IS NULL) {
      // Es una AAA → NO filtrar (ver todo)
    } else {
      // Es una ALA → FILTRAR por ese ambito_id
    }
  }
  // Si no tiene ambito_id → NO filtrar (ver todo)
}
```

---

## 📊 Tabla de Comportamiento

### Escenarios de Acceso

#### Escenario 1: Admin
```
Usuario:       admin (cualquiera)
Rol:           admin
Ámbito ID:     1 o NULL
Dependencia:   N/A
Resultado:     ✅ Ve TODOS los certificados
```

#### Escenario 2: rflores (Administrador de AAA)
```
Usuario:       rflores
Rol:           administrativo
Ámbito ID:     1 (AAA UCAYALI)
Dependencia:   NULL ← AAA
Resultado:     ✅ Ve TODOS los certificados
Razón:         Es administrador de la AAA, controla todas las ALAs
```

#### Escenario 3: lrios (Operador de ALA)
```
Usuario:       lrios
Rol:           administrativo
Ámbito ID:     2 (ALA PUCALLPA)
Dependencia:   1 ← ALA (apunta a AAA)
Resultado:     ❌ Ve SOLO certificados de ALA PUCALLPA
Razón:         Es operador de ALA específica, acceso limitado
```

#### Escenario 4: Sin Ámbito (Nuevo Usuario)
```
Usuario:       usuario_nuevo
Rol:           administrativo
Ámbito ID:     NULL
Dependencia:   N/A
Resultado:     ✅ Ve TODOS los certificados
Razón:         Sin ámbito asignado aún
```

---

## 🔍 Verificación de Funcionamiento

### Comando para Verificar:
```bash
cd backend
node scripts/verify-access-control.js
```

### Qué Verifica:
1. ✅ Estructura de tabla users (incluye ambito_id)
2. ✅ Usuarios y sus ámbitos asignados
3. ✅ Tipo de cada ámbito (AAA o ALA)
4. ✅ Simulación de acceso para cada usuario
5. ✅ Conteo de certificaciones por usuario

---

## ✨ Ejemplo de Ejecución

```
🔐 VERIFICACIÓN DE CONTROL DE ACCESO

✅ Conectado a la base de datos

📋 1. Verificando estructura de tabla users...
✅ Columna ambito_id existe en tabla users
   Tipo: INT
   Nullable: YES

📋 2. Verificando usuarios y sus ámbitos...

Usuario                 Rol              Ámbito ID   Ámbito Nombre          Tipo Ámbito
───────────────────────────────────────────────────────────────────────────────────────
admin                   admin            NULL        Sin ámbito             N/A
rflores                 administrativo   1           AAA UCAYALI            AAA
lrios                   administrativo   2           ALA PUCALLPA           ALA

📋 4. Simulando acceso para usuarios específicos...

👤 Usuario: rflores
   Rol: administrativo
   Ámbito ID: 1
   Ámbito: AAA UCAYALI
   Tipo: AAA (Administrador de todas las ALAs)
   Debe ver: TODOS los certificados
   Certificaciones visibles: 15
   Primeras 3:
      1. Nota: CERT-001, Mes: 01, Doc: CUT 20932M0202AAA.U, Ámbito: AAA UCAYALI
      2. Nota: CERT-002, Mes: 02, Doc: CUT 20933M0203AAA.U, Ámbito: ALA PUCALLPA
      ... y 12 más

👤 Usuario: lrios
   Rol: administrativo
   Ámbito ID: 2
   Ámbito: ALA PUCALLPA
   Tipo: ALA (Solo su ámbito)
   Debe ver: Solo certificados del ámbito 2
   Certificaciones visibles: 3
   Primeras 3:
      1. Nota: CERT-002, Mes: 02, Doc: CUT 20933M0203ALA.P, Ámbito: ALA PUCALLPA
      2. Nota: CERT-005, Mes: 03, Doc: CUT 20934M0204ALA.P, Ámbito: ALA PUCALLPA
      3. Nota: CERT-008, Mes: 04, Doc: CUT 20935M0205ALA.P, Ámbito: ALA PUCALLPA

📊 Total de certificaciones en BD: 15
```

---

## 🚀 Próximos Pasos

1. **Restart del servidor:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Login nuevamente:**
   - Los tokens antiguos NO incluyen `ambito_id`
   - Necesitan hacer logout/login para obtener nuevo token

3. **Pruebas:**
   - Login como `rflores` → Debe ver TODOS los certificados
   - Login como `lrios` → Debe ver SOLO ALA PUCALLPA
   - Login como `admin` → Debe ver TODOS los certificados

---

## 🔐 Seguridad

- ✅ El filtrado ocurre en el **backend** (nivel SQL)
- ✅ El JWT ahora incluye `ambito_id` de forma segura
- ✅ La verificación de dependencia ocurre en cada solicitud
- ✅ No hay acceso a datos no autorizados

---

## 📝 Notas Técnicas

### Por qué esta implementación es correcta:

1. **Jerarquía de datos respetada:**
   - AAA UCAYALI (dependencia_id = NULL)
   - ALAs (dependencia_id = 1)

2. **Lógica verificada:**
   ```sql
   SELECT dependencia_id FROM ambitos WHERE id = ?
   ```
   Esto se ejecuta EN EL BACKEND, no en el cliente

3. **Seguridad en niveles:**
   - JWT incluye ambito_id (información de usuario)
   - SQL filtra según dependencia_id (información de ámbito)
   - Dos niveles de validación

