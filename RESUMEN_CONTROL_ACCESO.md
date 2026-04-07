# 📊 Resumen Visual - Control de Acceso Certificaciones

## Estructura Implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                   SISTEMA DE CERTIFICACIONES                    │
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │  Frontend    │──JWT──→ │  Backend     │                     │
│  │  (React)     │         │  (Node.js)   │                     │
│  └──────────────┘         └──────┬───────┘                     │
│                                   │                              │
│                                   ▼                              │
│                    ┌─────────────────────────┐                  │
│                    │ Auth Middleware         │                  │
│                    │ (Extrae req.user)       │                  │
│                    └────────────┬────────────┘                  │
│                                  │                               │
│                                  ▼                               │
│                    ┌─────────────────────────┐                  │
│                    │ CertificacionController │                  │
│                    │ (Construye userContext) │                  │
│                    └────────────┬────────────┘                  │
│                                  │                               │
│                                  ▼                               │
│                    ┌─────────────────────────┐                  │
│                    │ CertificacionModel      │                  │
│                    │ .listar(filtros,        │                  │
│                    │         userContext)    │                  │
│                    └────────────┬────────────┘                  │
│                                  │                               │
│                    ┌─────────────┴──────────┐                   │
│                    │                        │                    │
│                    ▼                        ▼                    │
│          ┌──────────────────┐   ┌──────────────────┐            │
│          │ Verificar        │   │ Verificar        │            │
│          │ Rol = admin?     │   │ dependencia_id   │            │
│          └──────┬───────────┘   │ del ambito       │            │
│                 │               └────────┬─────────┘            │
│         ┌───────┴───────┐               │                       │
│         │ SÍ            │ NO            ▼                       │
│         │ (ver todo)    │     ┌─────────────────┐               │
│         │               │     │ Es AAA          │               │
│         │               └────→│ (dependencia=NULL)              │
│         │                     │ Ver TODO        │               │
│         │                     └────────┬────────┘               │
│         │                              │                        │
│         │              ┌───────────────┴───────────────┐        │
│         │              │                               │        │
│         │              ▼                               ▼        │
│         │     ┌──────────────────┐       ┌──────────────────┐  │
│         │     │ Es ALA           │       │ SIN FILTRO       │  │
│         │     │ (dependencia!=NULL)      │ (Ver TODO)       │  │
│         │     │ FILTRAR por      │       └──────────────────┘  │
│         │     │ ambito_id        │                             │
│         │     └────────┬─────────┘                             │
│         │              │                                        │
│         └──────────────┼────────────────────────────┐          │
│                        │                            │           │
│                        ▼                            ▼           │
│            ┌──────────────────────┐   ┌──────────────────────┐ │
│            │ Ejecutar SQL con     │   │ Ejecutar SQL SIN     │ │
│            │ FILTRO:              │   │ FILTRO:              │ │
│            │ AND a.id = ?         │   │ (Todos los certifics)│ │
│            └──────────┬───────────┘   └──────────┬───────────┘ │
│                       │                          │              │
│                       └──────────┬───────────────┘              │
│                                  │                              │
│                                  ▼                              │
│                   ┌──────────────────────────┐                 │
│                   │ Retornar Resultados      │                 │
│                   │ Filtrados a Frontend     │                 │
│                   └──────────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tabla de Decisiones

```
USUARIO        ROL             AMBITO_ID  DEPENDENCIA_ID   RESULTADO
────────────────────────────────────────────────────────────────────
admin          admin           1          N/A              ✅ VER TODO
admin          admin           NULL       N/A              ✅ VER TODO

rflores        administrativo  1          NULL (AAA)       ✅ VER TODO
(Administrador)                          (Administra todas ALAs)

lrios          administrativo  2          1 (ALA)          ❌ VER SOLO ALA 2
(Operador ALA)                           (Acceso limitado)

nuevo_user     administrativo  NULL       N/A              ✅ VER TODO
(Sin ámbito)                             (Aún sin asignar)

jefe           usuario         3          1 (ALA)          ❌ VER SOLO ALA 3
(Operador ALA)
```

---

## Archivos Modificados

### 1. `backend/controllers/authController.js`
**Cambios:** Incluir `ambito_id` en JWT y respuestas
- ✅ Línea ~60: Agregar `ambito_id` a SELECT
- ✅ Línea ~85: Agregar `ambito_id` a jwt.sign()
- ✅ Línea ~95: Agregar `ambito_id` a respuesta JSON
- ✅ Línea ~120: Agregar `ambito_id` a SELECT en obtenerPerfil()

### 2. `backend/controllers/certificacionCreditoController.js`
**Cambios:** Pasar contexto del usuario al modelo
- ✅ Línea ~65-75: Construir `userContext` y pasarlo a `listar()`

### 3. `backend/models/CertificacionCredito.js` ⭐ CRÍTICO
**Cambios:** Implementar lógica jerárquica de acceso
- ✅ Línea ~82-150: Método `listar()` mejorado
  - Verifica si usuario es admin
  - Si no es admin, verifica ambito_id
  - Si ambito_id existe, consulta dependencia_id
  - Si dependencia_id != NULL (ALA), aplica filtro
  - Si dependencia_id IS NULL (AAA), no filtra

---

## Flujo de Datos - JWT

### Login Request
```json
{
  "username": "lrios",
  "password": "****"
}
```

### Login Response
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 5,
    "email": "lrios@example.com",
    "username": "lrios",
    "nombre": "Luis Ríos",
    "rol": "administrativo",
    "ambito_id": 2
  }
}
```

### JWT Decoded
```json
{
  "id": 5,
  "email": "lrios@example.com",
  "username": "lrios",
  "rol": "administrativo",
  "ambito_id": 2,
  "iat": 1678800000,
  "exp": 1678886400
}
```

---

## Ejemplo de Ejecución SQL

### Para usuario `lrios` (ALA PUCALLPA, id=2)

**Consulta 1 - Verificar tipo de ámbito:**
```sql
SELECT dependencia_id FROM ambitos WHERE id = 2 AND activo = 1;
-- Resultado: dependencia_id = 1 (Es una ALA)
-- → Aplicar filtro
```

**Consulta 2 - Listar certificaciones CON FILTRO:**
```sql
SELECT cc.id, cc.nota, cc.mes, ... 
FROM certificaciones_credito cc
LEFT JOIN metas m ON cc.meta_id = m.id
LEFT JOIN ambitos a ON m.ambito_id = a.id
WHERE 1=1 AND a.id = 2  ← FILTRO APLICADO
GROUP BY cc.id
ORDER BY cc.fecha_documento DESC;

-- Resultado: Solo certificaciones del ALA PUCALLPA
```

### Para usuario `rflores` (AAA UCAYALI, id=1)

**Consulta 1 - Verificar tipo de ámbito:**
```sql
SELECT dependencia_id FROM ambitos WHERE id = 1 AND activo = 1;
-- Resultado: dependencia_id = NULL (Es una AAA)
-- → NO aplicar filtro
```

**Consulta 2 - Listar certificaciones SIN FILTRO:**
```sql
SELECT cc.id, cc.nota, cc.mes, ... 
FROM certificaciones_credito cc
LEFT JOIN metas m ON cc.meta_id = m.id
LEFT JOIN ambitos a ON m.ambito_id = a.id
WHERE 1=1
GROUP BY cc.id
ORDER BY cc.fecha_documento DESC;

-- Resultado: TODOS los certificaciones de TODAS las ALAs
```

---

## Ventajas de Esta Implementación

1. ✅ **Seguridad en Backend:** El filtrado ocurre en SQL, no en el cliente
2. ✅ **Jerarquía Respetada:** Entiende AAA vs ALA automáticamente
3. ✅ **Escalable:** Funciona con más niveles de jerarquía si se agregan
4. ✅ **Eficiente:** Una sola consulta SQL, sin N+1 queries
5. ✅ **Auditable:** El JWT tiene todos los datos necesarios para logs
6. ✅ **Sin Hardcoding:** Los IDs vienen de la BD, no del código

