# 🎯 GUÍA RÁPIDA: Acceso a la Tabla de Correlativo

## 📍 ¿Dónde ver la tabla de correlativo?

### Opción 1: Desde el Frontend (Recomendado)

**URL:** `http://localhost:3000/gestion/correlativos`

**Ruta en el menú:**
```
📊 Dashboard (página principal)
├── 📋 Gestión
│   ├── 📝 Comisiones
│   ├── ✅ Certificaciones de Crédito
│   ├── 📄 Emisión de Formatos
│   ├── 📍 Ámbitos
│   ├── 🏷️ Clasificadores
│   ├── 💰 Costos de Viaje
│   ├── 👥 Usuarios
│   ├── 🎯 Metas
│   ├── 💸 Fuentes de Financiamiento
│   ├── 🏷️ Cargos
│   └── 🔢 Control de Correlativos ← AQUÍ
├── 📊 Reportes
└── ✏️ Aprobaciones
```

### Opción 2: Desde API REST

**Listar todos los correlativos:**
```bash
curl -X GET "http://localhost:5000/api/formato-emisiones/correlativo-control/lista" \
  -H "Authorization: Bearer <TOKEN>"
```

**Listar por usuario:**
```bash
curl -X GET "http://localhost:5000/api/formato-emisiones/correlativo-control/lista?usuarioId=1" \
  -H "Authorization: Bearer <TOKEN>"
```

### Opción 3: Directamente en MySQL

```sql
SELECT 
  cc.id,
  u.nombre as usuario,
  cc.ano,
  cc.numero_inicial,
  cc.numero_proximo,
  cc.prefijo,
  cc.descripcion,
  cc.activo,
  cc.creado_en
FROM correlativo_control cc
JOIN users u ON cc.usuario_id = u.id
WHERE cc.activo = 1
ORDER BY cc.ano DESC, u.nombre;
```

---

## 🎨 Vista de la Tabla en Frontend

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║ 🔢 Gestión de Controles de Correlativo                              [+ Nuevo]   ║
║ Configura el número inicial de correlativo por usuario y año                      ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║ Filtrar por Usuario: [Todos ▼]                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║ ID | Usuario              | Año  | N.Ini | Prox | Prefijo | Descripción | Acc ║
║────┼────────────────────────┼──────┼───────┼──────┼─────────┼─────────────┼─── ║
║ 1  │ DHAYRO KONG TORRES    │ 2026 │   1   │  5   │ AAA     │ Comisiones  │ ✏️ ❌  ║
║ 2  │ CAROL MELANI ARCOS    │ 2026 │ 100   │ 102  │         │ Especial    │ ✏️ ❌  ║
║ 3  │ ALAN ROMEO TELLO      │ 2025 │   1   │  8   │ AAA     │ Año anterior│ ✏️ ❌  ║
╚════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ✨ Acciones Disponibles

### Crear Nuevo Correlativo
```
1. Haz clic en "+ Nuevo Correlativo"
2. Completa el formulario:
   - Usuario: [Seleccionar usuario]
   - Año: [2026]
   - Número Inicial: [1, 100, 500, etc]
   - Prefijo (opcional): [AAA, ESPECIAL, etc]
   - Descripción (opcional): [Notas sobre este correlativo]
3. Haz clic en "Guardar"
```

### Editar Correlativo
```
1. Haz clic en el icono ✏️ (Editar) en la fila
2. Modifica los campos que necesites
3. Haz clic en "Guardar"
```

### Eliminar Correlativo
```
1. Haz clic en el icono ❌ (Eliminar) en la fila
2. Confirma la acción en el diálogo
```

### Filtrar por Usuario
```
1. Usa el selector "Filtrar por Usuario"
2. Selecciona un usuario específico
3. La tabla se actualiza automáticamente
```

---

## 🔐 Autenticación Requerida

Todas las operaciones requieren estar autenticado con un usuario válido:

```bash
# Inicio de sesión
POST /api/auth/login
Body: {
  "username": "admin",
  "password": "Autoridad1"
}

# Respuesta
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "username": "admin", "rol": "admin" }
}

# Usar el token en requests posteriores
Authorization: Bearer eyJhbGc...
```

---

## 📊 Información Mostrada en la Tabla

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **ID** | Identificador único | 1 |
| **Usuario** | Nombre del usuario | DHAYRO KONG TORRES |
| **Año** | Año del correlativo | 2026 |
| **N.Inicial** | Número donde comienza | 1 |
| **Prox** | Próximo número a usar | 5 |
| **Prefijo** | Prefijo opcional | AAA |
| **Descripción** | Notas | Comisiones 2026 |

---

## 🚀 Uso en Generación de Documentos

Una vez configurado el correlativo, puedes usarlo para generar números:

```javascript
// En el componente EmisionFormatos.js
const numeroDocumento = generarNumeroDocumento({
  usuario_id: 1,           // ID del usuario
  ano: 2026,               // Año actual
  iniciales: 'DK',         // De la tabla users
  numero_proximo: 5        // De la tabla correlativo_control
});

// Resultado: "005-DK-2026"
```

---

## 📈 Casos de Uso

### Caso 1: Usuario comienza en 1
```
Usuario: DHAYRO KONG TORRES
Año: 2026
Número Inicial: 1

Documentos generados:
- 001-DK-2026
- 002-DK-2026
- 003-DK-2026
```

### Caso 2: Usuario comienza en 100
```
Usuario: CAROL MELANI ARCOS
Año: 2026
Número Inicial: 100

Documentos generados:
- 100-CA-2026
- 101-CA-2026
- 102-CA-2026
```

### Caso 3: Con prefijo especial
```
Usuario: ALAN ROMEO TELLO
Año: 2026
Número Inicial: 1
Prefijo: ESPECIAL

Documentos generados:
- 001-ESPECIAL-AT-2026
- 002-ESPECIAL-AT-2026
```

---

## ⚡ Troubleshooting

### "No veo la tabla"
- ✅ Asegurate de estar en la ruta correcta: `/gestion/correlativos`
- ✅ Verifica que estés autenticado
- ✅ Revisa que el servidor backend esté corriendo

### "No hay datos"
- ✅ Debes crear al menos un correlativo primero
- ✅ Haz clic en "+ Nuevo Correlativo"

### "Error al guardar"
- ✅ Verifica que Usuario y Año sean únicos juntos
- ✅ Revisa los mensajes de error en pantalla

### "Las iniciales están en blanco"
- ✅ Ejecuta: `npm run dev` en el backend
- ✅ Esto ejecutará la migración automáticamente
- ✅ Recarga la página del frontend

---

## 🎓 Datos de Ejemplo para Pruebas

```sql
-- Insertar datos de ejemplo
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, prefijo, descripcion, creado_por)
VALUES
  (1, 2026, 1, 1, 'AAA', 'Control inicial para DHAYRO', 1),
  (2, 2026, 100, 100, 'CAR', 'Control para CAROL', 1),
  (3, 2026, 500, 500, 'ALA', 'Control para ALAN', 1),
  (1, 2025, 1, 100, 'AAA', 'Año anterior', 1);

-- Verificar datos
SELECT u.nombre, cc.ano, cc.numero_inicial, cc.numero_proximo 
FROM correlativo_control cc 
JOIN users u ON cc.usuario_id = u.id;
```

---

## ✅ Checklist de Validación

- [ ] Puedo acceder a `/gestion/correlativos` sin errores
- [ ] La tabla muestra al menos un registro
- [ ] Puedo crear un nuevo correlativo
- [ ] Puedo editar un correlativo existente
- [ ] Puedo eliminar un correlativo
- [ ] El filtro por usuario funciona
- [ ] Las iniciales de los usuarios están visibles en MySQL
- [ ] El backend ejecuta la migración al iniciar

