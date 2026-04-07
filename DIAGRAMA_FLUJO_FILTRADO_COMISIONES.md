# 🔄 DIAGRAMA DE FLUJO: Filtrado de Comisiones por Usuario y Ámbito

---

## 1️⃣ FLUJO GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│ Usuario hace login (rflores)                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend retorna JWT con:                                        │
│ {                                                               │
│   id: 2,                                                        │
│   username: "rflores",                                          │
│   rol: "administrativo",                                        │
│   ambito_id: 1,    ← CLAVE: Incluye el ámbito                   │
│   email: "rflores@example.com"                                  │
│ }                                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend almacena en localStorage:                              │
│ localStorage.setItem('usuario', JSON.stringify(usuario))        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Usuario navega a "Gestión de Comisiones"                        │
│ → useEffect llama a cargarItems()                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ cargarItems() ejecuta:                                          │
│ 1. GET /comisiones → trae todas las comisiones                 │
│ 2. Lee usuario del localStorage                                │
│ 3. Según rol y ambito_id, filtra comisiones                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
                   ┌───────┐
                   │ ¿Rol? │
                   └───────┘
                   ╱   ╲    ╲
                  ╱     ╲    ╲
            admin/      admin/  usuario
           otro rol    otro rol
              │           │       │
              ▼           ▼       ▼
        (sin filtro) (ver abajo) (ver abajo)
```

---

## 2️⃣ CASO: ADMINISTRATIVO (rflores)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Usuario: rflores (administrativo, ambito_id=1, rol=administrativo)   │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ ¿Es AAA o ALA?  │
                    └─────────────────┘
                         ╱             ╲
                        ╱               ╲
                      AAA               ALA
            (dependencia_id=null)  (dependencia_id!=null)
                        │               │
                        ▼               ▼
              ┌─────────────────┐   ┌──────────────┐
              │ Ámbitos         │   │ Solo su      │
              │ permitidos:     │   │ ALA:         │
              │ [1, 2, 3, 4, 5] │   │ [su_id]      │
              │                 │   │              │
              │ - AAA (1)       │   │ p.ej: [3]    │
              │ - ALA PUC (2)   │   │              │
              │ - ALA ATA (3)   │   │              │
              │ - ALA TAR (4)   │   │              │
              │ - ALA PER (5)   │   │              │
              └────────┬────────┘   └────────┬─────┘
                       │                    │
                       └────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Para CADA comisión:  │
                   │ GET /comisiones/:id/ │
                   │     /comisionados    │
                   └────────┬─────────────┘
                            │
                            ▼
                   ┌──────────────────────────────────────┐
                   │ Retorna comisionados con ambito_id: │
                   │                                      │
                   │ [                                    │
                   │   {                                  │
                   │     id: 1,                           │
                   │     usuario_id: 5,                   │
                   │     usuario_nombre: "User 5",        │
                   │     ambito_id: 1,    ← IMPORTANTE   │
                   │   },                                 │
                   │   {                                  │
                   │     id: 2,                           │
                   │     usuario_id: 6,                   │
                   │     usuario_nombre: "User 6",        │
                   │     ambito_id: 2,    ← IMPORTANTE   │
                   │   }                                  │
                   │ ]                                    │
                   └────────┬─────────────────────────────┘
                            │
                            ▼
                   ┌────────────────────────────────────┐
                   │ Verificar si ALGÚN comisionado     │
                   │ está en ambitosPermitidos:        │
                   │                                    │
                   │ some(c =>                          │
                   │   ambitosPermitidos               │
                   │   .includes(c.ambito_id)          │
                   │ )                                  │
                   └────────┬───────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    SÍ ESTÁ (✅)      NO ESTÁ (❌)      ambito_id=NULL (❌)
    Mostrar           No mostrar        No mostrar
    comisión          comisión          comisión
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                            ▼
                   ┌──────────────────────────┐
                   │ items = comisiones       │
                   │ filtradas               │
                   │                          │
                   │ Renderizar tabla        │
                   └──────────────────────────┘
```

---

## 3️⃣ EJEMPLO REAL: rflores y 4 Comisiones

```
BD STATE:
═════════════════════════════════════════════════════════════════════

AMBITOS:
┌────┬──────────────────┬───────────────┐
│ id │ nombre_corto     │ dependencia_id │
├────┼──────────────────┼───────────────┤
│ 1  │ AAA UCAYALI      │ NULL   (AAA)  │
│ 2  │ ALA PUCALLPA     │ 1             │
│ 3  │ ALA ATALAYA      │ 1             │
│ 4  │ ALA TARMA        │ 1             │
│ 5  │ ALA PERENE       │ 1             │
└────┴──────────────────┴───────────────┘

USUARIOS (sin ambito_id = NULL):
┌────┬──────────────┬──────────────────┬───────────┬───────────┐
│ id │ username     │ nombre           │ rol       │ ambito_id │
├────┼──────────────┼──────────────────┼───────────┼───────────┤
│ 2  │ rflores      │ R. Flores        │ admin     │ 1         │
│ 5  │ user5        │ User 5           │ usuario   │ 1         │
│ 6  │ user6        │ User 6           │ usuario   │ 2         │
│ 7  │ user7        │ User 7           │ usuario   │ NULL  ❌  │
│ 10 │ user10       │ User 10          │ usuario   │ 3         │
└────┴──────────────┴──────────────────┴───────────┴───────────┘

COMISIONES Y COMISIONADOS:
┌──────┬───────┬────────────────────────────────────────────┐
│ ID   │ Lugar │ Comisionados (usuario_id → ambito_id)      │
├──────┼───────┼────────────────────────────────────────────┤
│ 1    │ Lima  │ 5→1 (AAA), 6→2 (ALA PUC)                   │
│ 2    │ Cusco │ 10→3 (ALA ATA)                             │
│ 3    │Trujil │ 7→NULL (sin ámbito)                        │
│ 4    │Arequ. │ 2→1 (AAA, es rflores)                      │
└──────┴───────┴────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════════

FILTRADO PARA rflores (ambito_id=1, AAA):
═════════════════════════════════════════════════════════════════════

Ámbitos permitidos: [1, 2, 3, 4, 5]  (su AAA + sus ALAs)

COMISIÓN 1 (Lima):
  Comisionados: 5→1 (✅ en permitidos), 6→2 (✅ en permitidos)
  Resultado: ✅ MOSTRAR (tiene al menos 1 comisionado en ámbitos)

COMISIÓN 2 (Cusco):
  Comisionados: 10→3 (✅ en permitidos)
  Resultado: ✅ MOSTRAR

COMISIÓN 3 (Trujillo):
  Comisionados: 7→NULL (❌ NO en permitidos, es NULL)
  Resultado: ❌ NO MOSTRAR

COMISIÓN 4 (Arequipa):
  Comisionados: 2→1 (✅ en permitidos)
  Resultado: ✅ MOSTRAR

═════════════════════════════════════════════════════════════════════

RESULTADO PARA rflores:
┌────┬─────────┬──────────────────────────────────────┐
│ ID │ Lugar   │ Acción                               │
├────┼─────────┼──────────────────────────────────────┤
│ 1  │ Lima    │ ✅ VISIBLE (comisionados de AAA/ALA) │
│ 2  │ Cusco   │ ✅ VISIBLE (comisionado de su ALA)   │
│ 3  │ Trujillo│ ❌ OCULTA (comisionado sin ámbito)   │
│ 4  │Arequipa │ ✅ VISIBLE (comisionado de su AAA)   │
└────┴─────────┴──────────────────────────────────────┘
```

---

## 4️⃣ COMPARACIÓN: AAA vs ALA

```
rflores (AAA UCAYALI, ambito_id=1):           lrios (ALA ATALAYA, ambito_id=3):
─────────────────────────────────────         ────────────────────────────────

dependencia_id = NULL                         dependencia_id = 1
Tipo: AAA (Administrador)                     Tipo: ALA (Operador)

Ámbitos permitidos:                           Ámbitos permitidos:
[1, 2, 3, 4, 5]                              [3]

Ve comisiones de:                             Ve comisiones de:
✅ User con ambito=1                          ❌ User con ambito=1
✅ User con ambito=2                          ❌ User con ambito=2
✅ User con ambito=3                          ✅ User con ambito=3
✅ User con ambito=4                          ❌ User con ambito=4
✅ User con ambito=5                          ❌ User con ambito=5

Comisión A:                                   Comisión A:
Comisionado ambito=1 → VISIBLE                Comisionado ambito=1 → NO VISIBLE

Comisión B:                                   Comisión B:
Comisionado ambito=3 → VISIBLE                Comisionado ambito=3 → VISIBLE
```

---

## 5️⃣ PARA USUARIO REGULAR

```
Usuario: user7 (usuario, sin rol administrativo/jefe)
Ambito: cualquiera
═══════════════════════════════════════════════════════════

Filtrado:
─────────
Para CADA comisión, verificar:
  ¿Hay algún comisionado con usuario_id = 7?

Comisión 1 (Lima):
  Comisionados: usuario_id 5, usuario_id 6
  ¿usuario_id=7? NO
  Resultado: ❌ NO MOSTRAR

Comisión 3 (Trujillo):
  Comisionados: usuario_id 7
  ¿usuario_id=7? SÍ
  Resultado: ✅ MOSTRAR

Resultado para user7:
  Solo ve Comisión 3 (donde aparece como comisionado)
```

---

## 6️⃣ PARA ADMIN

```
Usuario: admin (rol=admin)
═══════════════════════════════════════════════════════════

Filtrado:
─────────
Sin filtro, ve TODAS las comisiones

Resultado para admin:
  ✅ Ve todas las comisiones del sistema
  (1, 2, 3, 4, etc.)
```

---

## 📊 Tabla Resumen: Quién Ve Qué

```
                      │ Comisión │ Comisión │ Comisión │ Comisión
                      │    1     │    2     │    3     │    4
                      │  Lima    │  Cusco   │ Trujillo │ Arequipa
                      │ 5→1,6→2  │  10→3    │  7→NULL  │   2→1
──────────────────────┼──────────┼──────────┼──────────┼─────────
admin                 │    ✅    │    ✅    │    ✅    │    ✅
rflores (AAA)         │    ✅    │    ✅    │    ❌    │    ✅
lrios (ALA 3)         │    ❌    │    ✅    │    ❌    │    ❌
user5 (usuario)       │    ✅    │    ❌    │    ❌    │    ❌
user7 (usuario)       │    ❌    │    ❌    │    ✅    │    ❌
user10 (usuario)      │    ❌    │    ✅    │    ❌    │    ❌
```

---

## 🔑 PUNTO CLAVE

**El filtrado depende del `ambito_id` en la tabla `users` para CADA USUARIO:**

```javascript
// En cargarItems():
comisionados.some(c => 
  ambitosPermitidos.includes(c.ambito_id)  ← AQUÍ se usa ambito_id
)
```

Si `c.ambito_id = NULL`:
```
ambitosPermitidos.includes(NULL)  → FALSE  ❌
→ Comisión no se muestra
```

Si `c.ambito_id = 1`:
```
[1, 2, 3, 4, 5].includes(1)  → TRUE  ✅
→ Comisión se muestra
```

**Por eso es CRÍTICO que TODOS los usuarios tengan `ambito_id` asignado.**

