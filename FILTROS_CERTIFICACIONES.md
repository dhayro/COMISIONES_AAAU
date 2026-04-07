# 🎯 Filtros de Certificaciones - Implementación

**Fecha:** 14 de Marzo de 2026  
**Objetivo:** Agregar filtros rápidos por Ámbito y Estado en la página de Certificaciones de Crédito

---

## 📋 Cambios Realizados

### Archivo: `material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js`

#### 1. **Nuevos Estados (States)**

```javascript
const [ambitos, setAmbitos] = useState([]);           // Para cargar ámbitos
const [filtroAmbito, setFiltroAmbito] = useState(null);   // Filtro seleccionado por ámbito
const [filtroEstado, setFiltroEstado] = useState('');     // Filtro seleccionado por estado
```

#### 2. **Carga de Ámbitos**

```javascript
// En cargarDatos(), agregar:
const ambitosRes = await api.obtenerAmbitos();
setAmbitos(ambitosRes);
```

#### 3. **Nueva Función: obtenerCertificacionesFiltradas()**

```javascript
const obtenerCertificacionesFiltradas = () => {
  let filtered = certificaciones;

  // Filtrar por ámbito si está seleccionado
  if (filtroAmbito) {
    filtered = filtered.filter(cert => cert.ambito_nombre_corto === filtroAmbito);
  }

  // Filtrar por estado si está seleccionado
  if (filtroEstado) {
    filtered = filtered.filter(cert => cert.estado_certificacion === filtroEstado);
  }

  return filtered;
};
```

#### 4. **UI de Filtros (Panel Nuevo)**

```jsx
{/* Panel de Filtros */}
<Card sx={{ mb: 3 }}>
  <MDBox p={2}>
    <MDTypography variant="h6" mb={2} fontWeight="bold">
      🔍 Filtros
    </MDTypography>
    <MDBox display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
      {/* Dropdown Ámbitos */}
      <TextField
        label="Filtrar por Ámbito"
        select
        value={filtroAmbito || ''}
        onChange={(e) => setFiltroAmbito(e.target.value || null)}
        size="small"
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">
          <em>Todos los Ámbitos</em>
        </MenuItem>
        {ambitos.map((ambito) => (
          <MenuItem key={ambito.id} value={ambito.nombre_corto}>
            {ambito.nombre_corto} - {ambito.nombre_largo}
          </MenuItem>
        ))}
      </TextField>

      {/* Dropdown Estados */}
      <TextField
        label="Filtrar por Estado"
        select
        value={filtroEstado}
        onChange={(e) => setFiltroEstado(e.target.value)}
        size="small"
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">
          <em>Todos los Estados</em>
        </MenuItem>
        <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
        <MenuItem value="APROBADO">APROBADO</MenuItem>
        <MenuItem value="RECHAZADO">RECHAZADO</MenuItem>
      </TextField>

      {/* Botón Limpiar */}
      <MDButton
        variant="gradient"
        color="info"
        size="small"
        onClick={() => {
          setFiltroAmbito(null);
          setFiltroEstado('');
        }}
      >
        Limpiar Filtros
      </MDButton>

      {/* Contador */}
      <MDBox ml="auto">
        <MDTypography variant="body2" color="text" fontWeight="bold">
          📊 Total: {obtenerCertificacionesFiltradas().length} certificaciones
        </MDTypography>
      </MDBox>
    </MDBox>
  </MDBox>
</Card>
```

#### 5. **DataTable Actualizado**

```jsx
<DataTable
  table={{
    columns: columnasTabla,
    rows: obtenerCertificacionesFiltradas(),  // ← Usa datos filtrados
  }}
  // ... resto de propiedades
/>
```

---

## 🎨 Interfaz Visual

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Gestión de Certificaciones de Crédito              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔍 Filtros                                                          │
│  ┌────────────────────────┬────────────────────┬────────────────┐   │
│  │ Filtrar por Ámbito▼    │ Filtrar por Est▼   │ Limpiar Filtros│   │
│  │ ├─ Todos los Ámbitos   │ ├─ Todos Estados   │                │   │
│  │ ├─ AAA UCAYALI         │ ├─ PENDIENTE       │    📊 Total:   │   │
│  │ ├─ ALA PUCALLPA        │ ├─ APROBADO        │       12 certs │   │
│  │ ├─ ALA ATALAYA         │ └─ RECHAZADO       │                │   │
│  │ └─ ALA TARMA           │                    │                │   │
│  └────────────────────────┴────────────────────┴────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ID │ Nota │ Mes │ N° Doc │ Fecha │ Meta │ Ámbito │ Fuente │...│ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ 1  │ C-1  │ 01  │ CUT001 │01/02  │001  │ ALA P  │ TEF    │...│ │
│  │ 2  │ C-2  │ 02  │ CUT002 │02/02  │001  │ ALA A  │ TEF    │...│ │
│  │ ... │      │     │        │       │     │        │        │    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Funcionalidades

### 1. **Filtro por Ámbito**
- ✅ Dropdown con todos los ámbitos disponibles
- ✅ Opción "Todos los Ámbitos" para remover filtro
- ✅ Filtra certificaciones por `ambito_nombre_corto`
- ✅ Dinámico: carga ámbitos de la BD

### 2. **Filtro por Estado**
- ✅ Dropdown con 3 estados: PENDIENTE, APROBADO, RECHAZADO
- ✅ Opción "Todos los Estados" para remover filtro
- ✅ Filtra certificaciones por `estado_certificacion`

### 3. **Botón Limpiar Filtros**
- ✅ Reinicia ambos filtros a su valor inicial
- ✅ Muestra todas las certificaciones
- ✅ Ubicado de forma accesible en el panel

### 4. **Contador de Resultados**
- ✅ Muestra total de certificaciones con filtros aplicados
- ✅ Actualiza automáticamente al cambiar filtros
- ✅ Ubicado en la esquina superior derecha

---

## 🔄 Flujo de Datos

```
Usuario selecciona Ámbito
        ↓
setFiltroAmbito() actualiza estado
        ↓
Component re-renderiza
        ↓
obtenerCertificacionesFiltradas() ejecuta
        ↓
Filtra certificaciones en memoria
        ↓
DataTable recibe rows filtrados
        ↓
Tabla se actualiza instantáneamente
```

---

## ⚡ Rendimiento

- **Filtrado en Cliente:** Los datos ya están cargados, el filtrado es instantáneo
- **Sin Consultas Adicionales:** No hace nuevas consultas al backend
- **Eficiente:** Filtrado simple con `.filter()` nativo de JavaScript
- **Escalable:** Funciona bien con cientos de registros

---

## ✨ Mejoras Futuras Opcionales

1. **Filtro Combinado Avanzado:**
   ```javascript
   // Permitir guardar combinaciones de filtros
   const [filtrosSavedos, setFiltrosSavedos] = useState([]);
   ```

2. **Búsqueda por Nota/Número de Documento:**
   ```javascript
   const [busqueda, setBusqueda] = useState('');
   // Agregar TextField para búsqueda libre
   ```

3. **Exportar Resultados Filtrados:**
   ```javascript
   const handleExportarFiltrados = () => {
     // Exportar obtenerCertificacionesFiltradas() a Excel
   };
   ```

4. **Filtro por Rango de Fechas:**
   ```javascript
   const [fechaDesde, setFechaDesde] = useState(null);
   const [fechaHasta, setFechaHasta] = useState(null);
   ```

---

## 📝 Notas Técnicas

### Dependencias Utilizadas
- `@mui/material` (TextField, MenuItem, Card, etc.)
- React Hooks (useState, useEffect)
- Componentes personalizados (MDBox, MDButton, MDTypography)

### API Utilizada
- `api.obtenerAmbitos()` - Retorna array de objetos ámbito
  - Estructura: `{ id, nombre_corto, nombre_largo, dependencia_id }`

### Validación de Campos Filtrados
- `ambito_nombre_corto`: Campo de la certificación que contiene el nombre del ámbito
- `estado_certificacion`: Campo que almacena el estado actual

---

## 🧪 Pruebas Recomendadas

1. **Cambiar filtro de Ámbito:**
   - [ ] Seleccionar un ámbito
   - [ ] Verificar que solo se muestren sus certificaciones
   - [ ] Cambiar a otro ámbito
   - [ ] Cambiar a "Todos"

2. **Combinar Filtros:**
   - [ ] Seleccionar Ámbito + Estado
   - [ ] Verificar que se apliquen ambos filtros simultáneamente
   - [ ] Contador debe mostrar solo los que coinciden

3. **Limpiar Filtros:**
   - [ ] Aplicar filtros
   - [ ] Hacer clic en "Limpiar Filtros"
   - [ ] Verificar que se muestren todas las certificaciones nuevamente

4. **Contador de Resultados:**
   - [ ] Sin filtros: mostrar total de certificaciones
   - [ ] Con filtros: mostrar solo los filtrados
   - [ ] Debe actualizarse en tiempo real

