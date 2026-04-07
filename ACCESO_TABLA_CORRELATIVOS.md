# 📋 Acceso a la Tabla de Correlativos

## 🎯 Ubicación en la UI

La tabla de **Control de Correlativos** se encuentra en el menú principal:

```
Menú Lateral
  ├─ Dashboard
  ├─ Gestión
  │  ├─ Comisiones
  │  ├─ Certificaciones de Crédito
  │  ├─ Emisión de Formatos
  │  ├─ Ámbitos
  │  ├─ Clasificadores
  │  ├─ Costos de Viaje
  │  ├─ Usuarios
  │  ├─ Metas
  │  ├─ Fuentes de Financiamiento
  │  ├─ Cargos
  │  └─ ✅ Control de Correlativos  ← AQUÍ ESTÁ
```

---

## 🔗 URL Directa

```
http://localhost:3000/gestion/correlativos
```

---

## 📱 Características

### ✅ Visualización de la Tabla
- **Tabla completa** con todos los controles de correlativo activos
- **Columnas**: ID, Usuario, Año, Número Inicial, Próximo Número, Prefijo, Descripción, Acciones

### ➕ Crear Nuevo Correlativo
1. Haz clic en botón **"Nuevo Correlativo"** (arriba a la derecha)
2. Selecciona el **usuario**
3. Ingresa el **año** (por defecto año actual)
4. Ingresa el **número inicial** (ej: 1, 100, 500)
5. Prefijo (opcional)
6. Descripción (opcional)
7. Haz clic en **"Guardar"**

### 🔍 Filtrar por Usuario
- Usa el **Select de Filtro** en la parte superior izquierda
- Selecciona un usuario para ver solo sus correlativos
- Selecciona "Todos los usuarios" para ver todos

### ✏️ Editar Correlativo
1. Haz clic en el **icono de lápiz** en la fila del correlativo
2. Modifica los campos (excepto Usuario y Año que están deshabilitados en edición)
3. Haz clic en **"Guardar"**

### ❌ Eliminar Correlativo
1. Haz clic en el **icono de papelera** en la fila del correlativo
2. Confirma la eliminación en el dialog
3. El correlativo se desactivará en la base de datos

---

## 📊 Datos que Ves

Cada fila muestra:

| Campo | Significado |
|-------|-----------|
| **ID** | Identificador único del control |
| **Usuario** | Nombre del usuario al que pertenece |
| **Año** | Año del correlativo |
| **Número Inicial** | Desde qué número comienza (001, 100, etc) |
| **Próximo Número** | Próximo número a asignar |
| **Prefijo** | Prefijo adicional (opcional) |
| **Descripción** | Notas sobre el correlativo |

---

## 🔌 Backend API

Si necesitas acceder directamente a la API:

### Endpoints

```bash
# Listar todos los correlativos
GET /api/formato-emisiones/correlativo-control/lista

# Filtrar por usuario
GET /api/formato-emisiones/correlativo-control/lista?usuarioId=1

# Obtener específico
GET /api/formato-emisiones/correlativo-control/:usuarioId/:ano

# Crear nuevo
POST /api/formato-emisiones/correlativo-control/
Body: {
  usuario_id: 1,
  ano: 2026,
  numero_inicial: 1,
  prefijo: "AAA",
  descripcion: "Formularios 2026"
}

# Actualizar
PUT /api/formato-emisiones/correlativo-control/:id
Body: {
  numero_inicial: 5,
  prefijo: "BBB",
  descripcion: "Actualizado"
}

# Incrementar correlativo
POST /api/formato-emisiones/correlativo-control/:usuarioId/:ano/incrementar

# Eliminar (desactivar)
DELETE /api/formato-emisiones/correlativo-control/:id
```

---

## 🐛 Solución de Problemas

### No veo la tabla
- ✅ Verifica que hayas iniciado el backend (`npm run dev` en `/backend`)
- ✅ Verifica que hayas iniciado el frontend (`npm start` en `/material-dashboard-react`)
- ✅ Recarga la página (Ctrl+Shift+R)

### No puedo crear un correlativo
- ✅ El usuario es requerido
- ✅ El año es requerido
- ✅ No puede haber dos correlativos para el mismo usuario y año

### No aparece mi nuevo correlativo
- ✅ Recarga la página
- ✅ Verifica el filtro de usuario (quizá está filtrando otro usuario)

---

## 💾 Base de Datos

La tabla se llama `correlativo_control` y está en tu base de datos MySQL.

```sql
SELECT * FROM correlativo_control WHERE activo = 1;
```

---

**¡Listo!** Ya puedes ver y gestionar los controles de correlativo desde la interfaz.
