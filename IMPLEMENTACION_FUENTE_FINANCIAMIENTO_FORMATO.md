# ✅ Implementación: Selector Fuente de Financiamiento en Modal Emitir Formato

**Fecha:** 31 de Marzo de 2026  
**Estado:** ✅ COMPLETADO  
**Componentes Modificados:** 3 (BD, Backend, Frontend)

---

## 📋 Descripción del Cambio

Se agregó la capacidad de **seleccionar Fuente de Financiamiento** directamente en el modal "Emitir Formato" sin necesidad de tener una Certificación de Crédito previa.

**Beneficio:** Los usuarios pueden elegir la fuente de financiamiento aunque aún no tengan una certificación activa.

---

## 🗄️ Cambio en Base de Datos

### Tabla: `formato_emisiones`

#### Antes:
```sql
CREATE TABLE `formato_emisiones` (
  ...
  `certificacion_id` int(11) DEFAULT NULL COMMENT 'Referencia a la certificación de crédito usada',
  PRIMARY KEY (`id`),
  ...
)
```

#### Después:
```sql
CREATE TABLE `formato_emisiones` (
  ...
  `certificacion_id` int(11) DEFAULT NULL COMMENT 'Referencia a la certificación de crédito usada',
  `fuente_financiamiento_id` int(11) DEFAULT NULL COMMENT 'Referencia a la fuente de financiamiento',
  PRIMARY KEY (`id`),
  ...
  KEY `idx_fuente_financiamiento` (`fuente_financiamiento_id`),
  ...
  CONSTRAINT `formato_emisiones_ibfk_6` FOREIGN KEY (`fuente_financiamiento_id`) 
    REFERENCES `fuentes_financiamiento` (`id`) ON DELETE SET NULL
)
```

### Script SQL a Ejecutar:

```sql
-- Agregar columna
ALTER TABLE `formato_emisiones` 
ADD COLUMN `fuente_financiamiento_id` int(11) DEFAULT NULL COMMENT 'Referencia a la fuente de financiamiento',
ADD KEY `idx_fuente_financiamiento` (`fuente_financiamiento_id`);

-- Agregar constraint
ALTER TABLE `formato_emisiones` 
ADD CONSTRAINT `formato_emisiones_ibfk_6` 
FOREIGN KEY (`fuente_financiamiento_id`) 
REFERENCES `fuentes_financiamiento` (`id`) 
ON DELETE SET NULL;
```

---

## 💻 Cambio en Frontend (React)

### Archivo: `material-dashboard-react/src/pages/Gestion/EmisionFormatos.js`

#### 1. **Agregar Estado**
```javascript
// Línea ~113
const [fuentesFinanciamientoDisponibles, setFuentesFinanciamientoDisponibles] = useState([]);
```

#### 2. **Agregar a formValues**
```javascript
// Línea ~128
const [formValues, setFormValues] = useState({
  ...
  fuente_financiamiento_id: '',  // 🆕
  ...
});
```

#### 3. **Agregar Función de Carga**
```javascript
// Línea ~190
const cargarFuentesFinanciamiento = async () => {
  try {
    const fuentes = await api.obtenerFuentesFinanciamiento();
    setFuentesFinanciamientoDisponibles(fuentes || []);
  } catch (error) {
    console.error('❌ Error cargando fuentes de financiamiento:', error);
  }
};
```

#### 4. **Llamar en useEffect**
```javascript
// Línea ~140
useEffect(() => {
  cargarComisiones();
  cargarMetas();
  cargarClasificadores();
  cargarFuentesFinanciamiento();  // 🆕
}, []);
```

#### 5. **Agregar Selector en Formulario**
```javascript
// Línea ~2628 (después del selector de META)
<Autocomplete
  options={fuentesFinanciamientoDisponibles || []}
  getOptionLabel={(option) =>
    typeof option === 'string'
      ? option
      : `${option.abreviatura || ''} - ${option.nombre || ''}`
  }
  value={fuentesFinanciamientoDisponibles?.find((f) => f?.id === formValues.fuente_financiamiento_id) || null}
  onChange={(event, newValue) => {
    setFormValues({
      ...formValues,
      fuente_financiamiento_id: newValue?.id || '',
    });
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Fuente de Financiamiento"
      placeholder="Seleccionar fuente..."
      size="small"
    />
  )}
  renderOption={(props, option) => (
    <li {...props}>
      <div>
        <div style={{ fontWeight: 500 }}>
          {option.abreviatura} - {option.nombre}
        </div>
      </div>
    </li>
  )}
/>
```

---

## 🔧 Cambio en Backend (Pendiente)

### Archivo: `backend/controllers/formatoEmisionController.js`

#### En función `crearFormato()`
```javascript
// Agregar al payload de guardado:
fuente_financiamiento_id: req.body.fuente_financiamiento_id || null,
```

### Archivo: `backend/models/FormatoEmision.js`

#### En función `crearFormato()` - INSERT
```javascript
// Agregar parámetro:
INSERT INTO formato_emisiones 
  (..., fuente_financiamiento_id, ...)
VALUES 
  (..., ?, ...)
params.push(fuente_financiamiento_id);
```

---

## 📊 Tabla: `fuentes_financiamiento`

### Estructura Existente:
```sql
CREATE TABLE `fuentes_financiamiento` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `abreviatura` varchar(50) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  ...
);
```

### Ejemplo de Datos:
```
ID | Abreviatura | Nombre
1  | DG          | Dominio General
2  | MEFF        | Monto con Estructura de Funcionamiento
3  | PP          | Presupuesto de Programas
```

### Mostrado en Modal Como:
```
[DG - Dominio General]
[MEFF - Monto con Estructura de Funcionamiento]
[PP - Presupuesto de Programas]
```

---

## 🎨 Apariencia en Modal

```
╔═══════════════════════════════════════════════════════╗
║          Emitir Formato de Comisión                   ║
├───────────────────────────────────────────────────────┤
│ Lugar: [________________________]                      │
│ Ruta: [________________________]                      │
│ Modalidad de Viaje: [TERRESTRE ▼]                    │
│ ...                                                   │
│ META: [Número - Nombre ▼]                            │
│ Fuente de Financiamiento: [ABR - Nombre ▼]  ← NUEVO  │
│ ...                                                   │
├───────────────────────────────────────────────────────┤
│ [GUARDAR]  [CANCELAR]                                │
╚═══════════════════════════════════════════════════════╝
```

---

## 🔄 Flujo de Datos

```
1. Modal se abre
   ↓
2. cargarFuentesFinanciamiento() ejecuta
   ↓
3. api.obtenerFuentesFinanciamiento() → obtiene datos
   ↓
4. setFuentesFinanciamientoDisponibles(fuentes)
   ↓
5. Autocomplete renderiza opciones
   ↓
6. Usuario selecciona fuente
   ↓
7. setFormValues({ fuente_financiamiento_id: id })
   ↓
8. Al guardar, se envía fuente_financiamiento_id
   ↓
9. Backend recibe y guarda en DB
```

---

## ✅ Checklist de Implementación

### Frontend (React) - ✅ COMPLETADO
- [x] Agregar estado `fuentesFinanciamientoDisponibles`
- [x] Agregar `fuente_financiamiento_id` a `formValues`
- [x] Crear función `cargarFuentesFinanciamiento()`
- [x] Llamar en `useEffect` principal
- [x] Agregar `Autocomplete` en formulario
- [x] Formatear como "ABR - Nombre"

### Base de Datos - ⏳ PENDIENTE
- [ ] Ejecutar script SQL
- [ ] Verificar columna agregada
- [ ] Verificar constraint agregado
- [ ] Verificar foreign key funcionando

### Backend (Node.js) - ⏳ PENDIENTE
- [ ] Agregar `fuente_financiamiento_id` a payload en controller
- [ ] Agregar parámetro en INSERT en model
- [ ] Agregar a validación de datos
- [ ] Agregar a respuesta GET (si aplica)

---

## 📝 Próximos Pasos

### Paso 1: Ejecutar SQL en MariaDB
```bash
# Conectar a BD
mysql -h localhost -u root -p comisiones_aaau < MIGRACION_AGREGAR_FUENTE_FINANCIAMIENTO_FORMATO.sql
```

### Paso 2: Actualizar Backend
Modificar:
- `backend/controllers/formatoEmisionController.js` - Función `crearFormato()`
- `backend/models/FormatoEmision.js` - Función `crearFormato()` - INSERT statement

### Paso 3: Reiniciar Servicios
```bash
# Frontend
cd material-dashboard-react && npm start

# Backend
cd backend && npm start
```

### Paso 4: Probar
1. Ir a "Gestion > Emision Formatos"
2. Hacer clic en "Emitir Formato"
3. Verificar que aparezca el selector de "Fuente de Financiamiento"
4. Seleccionar una fuente
5. Guardar y verificar que se guarde correctamente

---

## 🧪 Verificación en BD

```sql
-- Ver estructura
DESC `formato_emisiones`;

-- Ver si constraint está
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'formato_emisiones' 
AND COLUMN_NAME = 'fuente_financiamiento_id';

-- Ver datos guardados
SELECT id, numero_documento, fuente_financiamiento_id 
FROM formato_emisiones 
WHERE fuente_financiamiento_id IS NOT NULL 
LIMIT 5;

-- Ver fuente linked
SELECT fe.numero_documento, ff.abreviatura, ff.nombre
FROM formato_emisiones fe
LEFT JOIN fuentes_financiamiento ff ON fe.fuente_financiamiento_id = ff.id
WHERE fe.fuente_financiamiento_id IS NOT NULL
LIMIT 5;
```

---

## 📞 Referencias

- **Tabla BD:** `formato_emisiones`
- **API Frontend:** `api.obtenerFuentesFinanciamiento()`
- **Tabla Fuentes:** `fuentes_financiamiento`
- **Archivo Frontend:** `EmisionFormatos.js`
- **Línea Selector:** ~2628

---

**Status:** ✅ FRONTEND COMPLETADO | ⏳ BACKEND PENDIENTE  
**Versión:** 1.0  
**Compilado:** 31-03-2026 10:45 AM

