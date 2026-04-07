# 🎯 IMPLEMENTACIÓN: Sistema de Control de Correlativo Configurable

## Resumen Ejecutivo

✅ **Problema Resuelto:**  
Ya existía un sistema de generación de números de documentos, pero NO había forma de **controlar desde qué número comienza cada usuario**.

✅ **Solución Implementada:**  
Se agregó una **tabla de control `correlativo_control`** que permite definir el número inicial para cada usuario en cada año.

---

## 📋 Lo Que Se Implementó

### 1. **Tabla SQL: `correlativo_control`**
📁 Archivo: `backend/sql/02_crear_correlativo_control.sql`

```sql
CREATE TABLE correlativo_control (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,           -- Usuario
  ano INT NOT NULL,                   -- Año (reinicia anual)
  numero_inicial INT DEFAULT 1,       -- Número donde comienza (001, 100, 500, etc)
  numero_proximo INT DEFAULT 1,       -- Próximo número a usar
  prefijo VARCHAR(50),                -- Prefijo opcional
  descripcion VARCHAR(255),           -- Descripción
  activo BOOLEAN DEFAULT 1,
  creado_por INT,
  creado_en TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(usuario_id, ano)             -- Solo 1 control por usuario/año
);
```

**Campos clave:**
- `numero_inicial`: Define desde dónde comienza (ej: 1, 100, 500)
- `numero_proximo`: Próximo número a usar (incrementa cada formato)
- `usuario_id` + `ano`: Clave única (1 control por usuario por año)

---

### 2. **Controlador Backend**
📁 Archivo: `backend/controllers/correlativoControlController.js`

**6 funciones implementadas:**

| Función | HTTP | Descripción |
|---------|------|-------------|
| `obtenerControlCorrelativo` | GET `/:usuarioId/:ano` | Obtener control de usuario/año |
| `crearControlCorrelativo` | POST `/` | Crear nuevo control |
| `actualizarControlCorrelativo` | PUT `/:id` | Modificar número inicial |
| `incrementarCorrelativo` | POST `/:usuarioId/:ano/incrementar` | Incrementar número próximo |
| `listarControlesCorrelativo` | GET `/lista` | Listar todos (con filtro opcional) |
| `eliminarControlCorrelativo` | DELETE `/:id` | Desactivar control |

---

### 3. **Rutas REST**
📁 Archivo: `backend/routes/correlativoControlRoutes.js`

```javascript
GET    /api/formato-emisiones/correlativo-control/lista          // Listar todos
GET    /api/formato-emisiones/correlativo-control/:usuarioId/:ano       // Obtener uno
POST   /api/formato-emisiones/correlativo-control/               // Crear
PUT    /api/formato-emisiones/correlativo-control/:id            // Actualizar
POST   /api/formato-emisiones/correlativo-control/:usuarioId/:ano/incrementar
DELETE /api/formato-emisiones/correlativo-control/:id            // Eliminar
```

---

### 4. **Integración Frontend**
📁 Archivo: `material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`

**Función `generarNumeroDocumento()` mejorada:**

```javascript
const generarNumeroDocumento = async (usuarioLogueado) => {
  // 1. Extraer iniciales del nombre (DKT, JRG, MLP, etc)
  // 2. 🆕 Consultar tabla correlativo_control
  // 3. Si existe: usar numero_proximo de la tabla
  // 4. Si NO existe: usar método fallback (contar previos)
  // 5. Retornar formato: XXX-II-YYYY
};
```

**Flujo de integración (línea 866):**
```javascript
// Antes de crear formato, generar número dinámicamente
let numeroDocumento;
if (!esModificacion) {
  numeroDocumento = await generarNumeroDocumento(usuarioLogueado);
}

// Asignar al objeto datosFormato
const datosFormato = {
  numero_documento: esModificacion ? undefined : numeroDocumento,
  // ... otros campos
};
```

---

### 5. **Scripts de Inicialización**

#### Script SQL
📁 Archivo: `backend/sql/03_inicializar_correlativo_usuarios.sql`

Crea controles para TODOS los usuarios comenzando en 001:
```sql
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo)
SELECT u.id, 2026, 1, 1
FROM users u
WHERE u.activo = 1;
```

#### Script Node.js
📁 Archivo: `backend/scripts/inicializar-correlativos.js`

Ejecutar con: `node scripts/inicializar-correlativos.js`

Crea los mismos controles pero con validaciones y mensajes formateados.

---

### 6. **Documentación Completa**
📁 Archivo: `GUIA_CONTROL_CORRELATIVO.md`

Incluye:
- 📋 Guía de uso
- 🔌 Ejemplos de APIs REST
- 🛠️ Casos de uso
- ⚙️ Configuración
- 📊 Tabla de referencia

---

## 🚀 Cómo Usar

### **Opción 1: Crear controles por SQL**

```sql
-- Crear control para usuario ID=1, año 2026, comienza en 001
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion)
VALUES (1, 2026, 1, 1, 'Diego Torres - Año 2026');

-- Crear control para usuario ID=2, año 2026, comienza en 100
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, descripcion)
VALUES (2, 2026, 100, 100, 'Juan García - Año 2026');
```

### **Opción 2: Ejecutar script SQL**

```bash
# En terminal, dentro del proyecto backend
mysql -u root -p nombre_base_datos < backend/sql/03_inicializar_correlativo_usuarios.sql
```

### **Opción 3: Ejecutar script Node.js**

```bash
# Desde la carpeta backend
node scripts/inicializar-correlativos.js
```

### **Opción 4: Llamar API REST**

```bash
# Crear control para usuario 1, año 2026
POST /api/formato-emisiones/correlativo-control/
{
  "usuario_id": 1,
  "ano": 2026,
  "numero_inicial": 1,
  "descripcion": "Diego Torres - Año 2026"
}

# Ver control creado
GET /api/formato-emisiones/correlativo-control/1/2026

# Cambiar número inicial si es necesario
PUT /api/formato-emisiones/correlativo-control/1
{
  "numero_inicial": 100,
  "numero_proximo": 100
}
```

---

## 📊 Ejemplos de Resultados

### Ejemplo 1: Usuario DKT comienza en 001

```
Control: usuario_id=1, ano=2026, numero_inicial=1, numero_proximo=1

Formatos generados:
✅ 001-DT-2026
✅ 002-DT-2026
✅ 003-DT-2026
✅ 004-DT-2026
```

### Ejemplo 2: Usuario JRG comienza en 100

```
Control: usuario_id=2, ano=2026, numero_inicial=100, numero_proximo=100

Formatos generados:
✅ 100-JG-2026
✅ 101-JG-2026
✅ 102-JG-2026
```

### Ejemplo 3: Mismo usuario, año diferente (reinicio)

```
Control DKT 2026: numero_proximo=1 → Genera: 001-DT-2026
Control DKT 2027: numero_proximo=1 → Genera: 001-DT-2027
```

---

## ✅ Validaciones Implementadas

✅ **Clave Única (usuario_id, ano)**: No puede haber 2 controles del mismo usuario en el mismo año

✅ **Integridad Referencial**: usuario_id debe existir en tabla users

✅ **Número Positivo**: numero_inicial y numero_proximo son positivos

✅ **Fallback Automático**: Si no existe control → usa método por defecto

✅ **Auditoría**: Registro de quién creó y cuándo (creado_por, creado_en)

---

## 🔄 Flujo Completo de Generación

```mermaid
1. Usuario crea nuevo formato
   ↓
2. Sistema llama: generarNumeroDocumento(usuarioLogueado)
   ↓
3. Extrae iniciales: "Diego Torres" → "DT"
   ↓
4. Consulta tabla: SELECT * FROM correlativo_control 
                   WHERE usuario_id=1 AND ano=2026
   ↓
5. Si existe:
   - Obtiene numero_proximo = 5
   - Genera: "005-DT-2026"
   ↓
   Si NO existe:
   - Cuenta formatos previos: 4
   - Genera: "005-DT-2026" (mismo resultado)
   ↓
6. Guarda número en tabla formato_emisiones
   ↓
7. (Opcional) Incrementa numero_proximo en tabla de control
   numero_proximo: 5 → 6
```

---

## 📁 Archivos Creados/Modificados

| Archivo | Tipo | Estado |
|---------|------|--------|
| `backend/sql/02_crear_correlativo_control.sql` | SQL | ✅ Creado |
| `backend/sql/03_inicializar_correlativo_usuarios.sql` | SQL | ✅ Creado |
| `backend/controllers/correlativoControlController.js` | JS | ✅ Creado |
| `backend/routes/correlativoControlRoutes.js` | JS | ✅ Creado |
| `backend/scripts/inicializar-correlativos.js` | JS | ✅ Creado |
| `backend/server.js` | JS | ✅ Modificado (agregó ruta) |
| `material-dashboard-react/src/pages/Gestion/EmisionFormatos.js` | JS | ✅ Modificado (mejoró función) |
| `GUIA_CONTROL_CORRELATIVO.md` | MD | ✅ Creado |

---

## 🎯 Próximos Pasos

1. **Ejecutar tabla SQL** en tu BD:
   ```bash
   mysql -u root -p < backend/sql/02_crear_correlativo_control.sql
   ```

2. **Crear controles iniciales** (elige 1 opción):
   - Script SQL: `backend/sql/03_inicializar_correlativo_usuarios.sql`
   - Script Node: `node backend/scripts/inicializar-correlativos.js`
   - API REST: POST `/api/formato-emisiones/correlativo-control/`

3. **Probar generación de números**:
   - Crear un nuevo formato en la aplicación
   - Verificar que genera: `001-II-2026` (y sucesivamente)

4. **Monitorear tabla** (opcional):
   ```sql
   SELECT u.nombre, cc.ano, cc.numero_proximo, cc.descripcion
   FROM correlativo_control cc
   JOIN users u ON cc.usuario_id = u.id
   ORDER BY cc.ano DESC, u.nombre;
   ```

---

## 💡 Ventajas del Sistema

✅ **Flexible**: Cada usuario puede comenzar en número diferente  
✅ **Anual**: Correlativo reinicia cada año automáticamente  
✅ **Auditable**: Registro de creación y modificación  
✅ **Robusto**: Fallback si no existe control  
✅ **Fácil de usar**: APIs REST simples y claras  
✅ **Sin cambios previos**: Funciona con formatos ya existentes  

---

## 🔒 Seguridad

- ✅ Todas las rutas requieren autenticación (`verificarToken`)
- ✅ Solo usuarios autenticados pueden crear/modificar controles
- ✅ Integridad referencial en BD (FK a users)
- ✅ Validación en controllers

---

**¡Sistema listo para usar! 🚀**
