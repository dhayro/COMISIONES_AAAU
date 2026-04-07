# Guía de Implementación: Certificación de Crédito Presupuestario

## 📋 Resumen

Esta guía proporciona los pasos para implementar el módulo de **Certificación de Crédito Presupuestario** en el sistema COMISIONES_AAAU. El módulo permite gestionar certificaciones de crédito presupuestario con detalles por clasificador y monto.

## 🏗️ Estructura Implementada

### 1. **Base de Datos** (`backend/`)
- **Tabla Principal:** `certificaciones_credito`
  - id, nota, mes, fecha_aprobacion, fecha_documento, estado_certificacion, tipo_documento, numero_documento, justificacion, meta_id, fuente_financiamiento_id, usuario_id

- **Tabla Detalle:** `detalles_certificacion_credito`
  - id, certificacion_credito_id, clasificador_id, monto

- **Vista:** `certificaciones_credito_detalladas` (para reportes)

### 2. **Backend** (`backend/`)

#### Archivos Creados:
- **Modelo:** `models/CertificacionCredito.js`
  - Métodos CRUD para certificaciones
  - Métodos CRUD para detalles
  - Operaciones de filtrado y cálculos

- **Controller:** `controllers/certificacionCreditoController.js`
  - Endpoints para certificaciones principales
  - Endpoints para detalles
  - Manejo de errores y validaciones

#### Rutas Agregadas: `routes/comisiones.js`
```
GET    /certificaciones-credito                    - Listar todas
POST   /certificaciones-credito                    - Crear nueva
GET    /certificaciones-credito/:id                - Obtener por ID
PUT    /certificaciones-credito/:id                - Actualizar
DELETE /certificaciones-credito/:id                - Eliminar

GET    /certificaciones-credito/:id/detalles       - Listar detalles
POST   /detalles-certificacion                     - Crear detalle
PUT    /detalles-certificacion/:id                 - Actualizar detalle
DELETE /detalles-certificacion/:id                 - Eliminar detalle
GET    /certificaciones-credito/:id/total          - Obtener total monto
```

### 3. **Frontend** (`material-dashboard-react/src/`)

#### API Service: `services/api.js`
Métodos agregados:
```javascript
- obtenerCertificacionesCredito(filtros)
- obtenerCertificacionCreditoPorId(id)
- crearCertificacionCredito(datos)
- actualizarCertificacionCredito(id, datos)
- eliminarCertificacionCredito(id)
- obtenerDetallesCertificacion(id)
- crearDetalleCertificacion(datos)
- actualizarDetalleCertificacion(id, datos)
- eliminarDetalleCertificacion(id)
- obtenerTotalMontoCertificacion(id)
```

#### Componente React: `pages/Gestion/GestionCertificacionesCredito.js`
- Tabla principal de certificaciones
- Diálogo para crear/editar certificaciones
- Diálogo para gestionar detalles (clasificadores y montos)
- Funcionalidad completa CRUD
- Integración con SweetAlert para confirmaciones

## 🚀 Pasos de Implementación

### Paso 1: Crear las Tablas en la Base de Datos

Ejecutar el script SQL:
```bash
mysql -u root -p nombre_base_datos < database/schema_certificaciones_credito.sql
```

O ejecutar manualmente en MySQL:
```sql
-- Ver archivo: database/schema_certificaciones_credito.sql
```

### Paso 2: Verificar Archivos Backend

Asegurar que existan:
- ✅ `backend/models/CertificacionCredito.js`
- ✅ `backend/controllers/certificacionCreditoController.js`
- ✅ Rutas agregadas en `backend/routes/comisiones.js`

### Paso 3: Actualizar el Servidor Backend

El servidor debe reiniciarse para cargar los nuevos controllers.

```bash
cd backend
npm start
# o
node server.js
```

### Paso 4: Copiar Componente React

Asegurar que existe:
- ✅ `material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js`

### Paso 5: Actualizar Rutas de Navegación

Agregar a `material-dashboard-react/src/index.js` o donde se configuren las rutas:

```javascript
import GestionCertificacionesCredito from 'pages/Gestion/GestionCertificacionesCredito';

// En el array de rutas:
{
  type: 'collapse',
  name: 'Certificaciones de Crédito',
  key: 'certificaciones-credito',
  route: '/gestion/certificaciones-credito',
  icon: <MDTypography variant="body2">📄</MDTypography>,
  component: <GestionCertificacionesCredito />,
  noCollapse: true,
}
```

### Paso 6: Actualizar Menú de Navegación

Agregar a `material-dashboard-react/src/examples/Navbars/DashboardNavbar/index.js` o menu:

```javascript
{
  name: 'Certificaciones de Crédito',
  route: '/gestion/certificaciones-credito',
  icon: 'description'
}
```

### Paso 7: Compilar Frontend

```bash
cd material-dashboard-react
npm run build
# o para desarrollo:
npm start
```

## 📊 Estructura de Datos

### Certificación Principal
```json
{
  "id": 1,
  "nota": "Nota descriptiva",
  "mes": "2024-03",
  "fecha_aprobacion": "2024-03-15",
  "fecha_documento": "2024-03-20",
  "estado_certificacion": "APROBADA",
  "tipo_documento": "Certificación",
  "numero_documento": "CERT-2024-001",
  "justificacion": "Justificación...",
  "meta_id": 1,
  "fuente_financiamiento_id": 2,
  "usuario_id": 5
}
```

### Detalle de Certificación
```json
{
  "id": 1,
  "certificacion_credito_id": 1,
  "clasificador_id": 3,
  "monto": 5000.00
}
```

## 🔑 Características Principales

✅ **Gestión de Certificaciones**
- Crear, leer, actualizar, eliminar certificaciones
- Filtrado por meta, fuente de financiamiento, estado y mes
- Validaciones en cliente y servidor

✅ **Detalles de Certificación**
- Agregar múltiples clasificadores a una certificación
- Especificar monto por clasificador
- Cálculo automático de total

✅ **Interfaz Amigable**
- Tabla datos completa con búsqueda
- Diálogos modal para crear/editar
- Confirmaciones de eliminación
- Notificaciones SweetAlert

✅ **Relaciones de Base de Datos**
- Certificación → Meta (opcional)
- Certificación → Fuente de Financiamiento (opcional)
- Certificación → Usuario (creador)
- Detalle → Certificación (obligatorio)
- Detalle → Clasificador (obligatorio)

## 🧪 Pruebas Recomendadas

1. **Crear Certificación**
   - Completar formulario con datos válidos
   - Verificar que se cree en BD
   - Confirmar aparición en tabla

2. **Agregar Detalles**
   - Seleccionar certificación
   - Agregar múltiples clasificadores
   - Verificar cálculo de total

3. **Actualizar**
   - Modificar datos de certificación
   - Cambiar clasificadores en detalles
   - Verificar cambios reflejados

4. **Eliminar**
   - Eliminar detalle
   - Eliminar certificación (debe eliminar detalles)

5. **Filtrados**
   - Filtrar por meta
   - Filtrar por fuente
   - Filtrar por estado
   - Filtrar por mes

## 📝 Campos Obligatorios

- **Certificación:**
  - nota (texto)
  - mes (mes/año)
  - tipo_documento (texto)
  - numero_documento (único)

- **Detalle:**
  - clasificador_id (selección)
  - monto (numérico positivo)

## 🔒 Permisos y Seguridad

- Todas las rutas requieren autenticación (middleware `authMiddleware`)
- Las certificaciones se asocian al usuario autenticado
- Los detalles se validan contra certificaciones existentes
- Las eliminaciones en cascada previenen orfandad de registros

## 📞 Soporte

Para problemas o consultas:
1. Verificar logs del servidor: `npm logs`
2. Verificar BD: Ejecutar queries de verificación
3. Verificar consola del navegador para errores JS
4. Revisar estructura de permisos en BD

## 🎯 Próximos Pasos Recomendados

- [ ] Implementar reportes PDF de certificaciones
- [ ] Agregar control de cambios/auditoría
- [ ] Implementar aprobación en cascada
- [ ] Agregar integración con comisiones
- [ ] Implementar presupuestos ligados a certificaciones
- [ ] Crear dashboards analíticos
