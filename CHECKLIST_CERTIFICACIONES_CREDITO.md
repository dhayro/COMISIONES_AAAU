# ✅ CHECKLIST DE VERIFICACIÓN - CERTIFICACIONES DE CRÉDITO

## 📋 Antes de Implementación

### Preparación
- [ ] Backup de base de datos realizado
- [ ] Servidor backend detenido
- [ ] Servidor frontend detenido
- [ ] Se ha revisado la estructura existente
- [ ] Se comprende el patrón de arquitectura actual

---

## 🗄️ Implementación Backend - Base de Datos

### Tablas
- [ ] Script `database/schema_certificaciones_credito.sql` existe
- [ ] Ejecutar script en MySQL
- [ ] Verificar tabla `certificaciones_credito` creada
- [ ] Verificar tabla `detalles_certificacion_credito` creada
- [ ] Verificar vista `certificaciones_credito_detalladas` creada

### Verificación de Tabla Principal
```sql
DESCRIBE certificaciones_credito;
SHOW INDEX FROM certificaciones_credito;
SELECT COUNT(*) FROM certificaciones_credito;
```
- [ ] Tabla tiene 13 columnas
- [ ] Campo `id` es PRIMARY KEY AUTO_INCREMENT
- [ ] Campo `numero_documento` tiene índice UNIQUE
- [ ] Campos de fecha tienen tipo DATE
- [ ] Campo `estado_certificacion` es VARCHAR(50)
- [ ] Claves foráneas apuntan a tablas correctas

### Verificación de Tabla Detalles
```sql
DESCRIBE detalles_certificacion_credito;
SHOW INDEX FROM detalles_certificacion_credito;
SELECT COUNT(*) FROM detalles_certificacion_credito;
```
- [ ] Tabla tiene 6 columnas
- [ ] Campo `certificacion_credito_id` es FK a certificaciones_credito
- [ ] Campo `clasificador_id` es FK a clasificadores
- [ ] Existe constraint UNIQUE (certificacion_credito_id, clasificador_id)
- [ ] Campo `monto` es DECIMAL(15,2)

---

## 🔧 Implementación Backend - Código

### Archivos Creados
- [ ] Archivo `backend/models/CertificacionCredito.js` existe
- [ ] Archivo `backend/controllers/certificacionCreditoController.js` existe

### Modelo (CertificacionCredito.js)
- [ ] Clase `CertificacionCredito` definida
- [ ] Método `crear()` implementado
- [ ] Método `obtenerPorId()` implementado
- [ ] Método `listar()` implementado
- [ ] Método `actualizar()` implementado
- [ ] Método `eliminar()` implementado
- [ ] Método `crearDetalle()` implementado
- [ ] Método `obtenerDetallePorId()` implementado
- [ ] Método `actualizarDetalle()` implementado
- [ ] Método `eliminarDetalle()` implementado
- [ ] Método `listarDetalles()` implementado
- [ ] Método `obtenerTotalMonto()` implementado
- [ ] Exportación del módulo al final

### Controller (certificacionCreditoController.js)
- [ ] Función `crear()` exportada
- [ ] Función `obtenerPorId()` exportada
- [ ] Función `listar()` exportada
- [ ] Función `actualizar()` exportada
- [ ] Función `eliminar()` exportada
- [ ] Función `crearDetalle()` exportada
- [ ] Función `obtenerDetallePorId()` exportada
- [ ] Función `actualizarDetalle()` exportada
- [ ] Función `eliminarDetalle()` exportada
- [ ] Función `listarDetalles()` exportada
- [ ] Función `obtenerTotalMonto()` exportada
- [ ] Validaciones de campos obligatorios
- [ ] Manejo de errores con try-catch

### Rutas (routes/comisiones.js)
- [ ] Requiere certificacionCreditoController
- [ ] Route GET `/certificaciones-credito` implementada
- [ ] Route POST `/certificaciones-credito` implementada
- [ ] Route GET `/certificaciones-credito/:id` implementada
- [ ] Route PUT `/certificaciones-credito/:id` implementada
- [ ] Route DELETE `/certificaciones-credito/:id` implementada
- [ ] Route GET `/certificaciones-credito/:id/detalles` implementada
- [ ] Route POST `/detalles-certificacion` implementada
- [ ] Route GET `/detalles-certificacion/:id` implementada
- [ ] Route PUT `/detalles-certificacion/:id` implementada
- [ ] Route DELETE `/detalles-certificacion/:id` implementada
- [ ] Route GET `/certificaciones-credito/:id/total` implementada
- [ ] Todas las rutas usan `authMiddleware`
- [ ] Documentación Swagger agregada para cada ruta

---

## 💻 Implementación Frontend - API Service

### services/api.js
- [ ] Método `obtenerCertificacionesCredito()` agregado
- [ ] Método `obtenerCertificacionCreditoPorId()` agregado
- [ ] Método `crearCertificacionCredito()` agregado
- [ ] Método `actualizarCertificacionCredito()` agregado
- [ ] Método `eliminarCertificacionCredito()` agregado
- [ ] Método `obtenerDetallesCertificacion()` agregado
- [ ] Método `crearDetalleCertificacion()` agregado
- [ ] Método `actualizarDetalleCertificacion()` agregado
- [ ] Método `eliminarDetalleCertificacion()` agregado
- [ ] Método `obtenerTotalMontoCertificacion()` agregado
- [ ] Todos los métodos usan `this.request()`
- [ ] Parámetros de filtro correctamente serializados

### Componente React (GestionCertificacionesCredito.js)
- [ ] Archivo existe en `pages/Gestion/GestionCertificacionesCredito.js`
- [ ] Importaciones correctas (React, MUI, api, componentes)
- [ ] Función componente exportada como default

#### Estados (useState)
- [ ] `certificaciones` inicializado como array
- [ ] `metas` inicializado como array
- [ ] `fuentesFinanciamiento` inicializado como array
- [ ] `clasificadores` inicializado como array
- [ ] `loading` inicializado como false
- [ ] `openDialog` inicializado como false
- [ ] `openDetallesDialog` inicializado como false
- [ ] `editingId` inicializado como null
- [ ] `detalles` inicializado como array
- [ ] `formData` con estructura completa
- [ ] `detalleFormData` con estructura correcta

#### Efectos (useEffect)
- [ ] Hook para `cargarDatos()` en montaje

#### Funciones
- [ ] `cargarDatos()` carga todas las dependencias
- [ ] `handleOpenDialog()` abre modal principal
- [ ] `handleCloseDialog()` cierra modal principal
- [ ] `handleOpenDetallesDialog()` carga y abre detalles
- [ ] `handleCloseDetallesDialog()` limpia estado
- [ ] `handleChange()` actualiza formData
- [ ] `handleDetalleChange()` actualiza detalleFormData
- [ ] `handleSave()` valida y guarda certificación
- [ ] `handleAgregarDetalle()` agrega detalle nuevo
- [ ] `handleEliminarDetalle()` elimina detalle con confirmación
- [ ] `handleEliminar()` elimina certificación con confirmación

#### UI Components
- [ ] Layout correcto (DashboardLayout, navbar, footer)
- [ ] Tabla principal con DataTable
- [ ] Modal principal para crear/editar
- [ ] Modal para detalles
- [ ] Tabla de detalles con botones acciones
- [ ] Botones con iconos correctos
- [ ] Tooltips en botones de acción
- [ ] Uso de Swal para confirmaciones
- [ ] Mensajes de éxito y error

---

## 🔌 Verificación de Integración

### Backend
- [ ] No hay errores de sintaxis (ejecutar `npm run lint` si existe)
- [ ] Controller require el modelo correctamente
- [ ] Rutas requieren el controller correctamente
- [ ] Middleware de autenticación está presente
- [ ] Base de datos puede conectarse

### Frontend
- [ ] No hay errores de sintaxis
- [ ] Importaciones de componentes correctas
- [ ] Importación de api service correcta
- [ ] Componente exportado correctamente
- [ ] No hay conflictos de nombres con otros componentes

---

## 🧪 Pruebas Funcionales

### Crear Certificación
- [ ] Abrir modal "Nueva Certificación"
- [ ] Llenar todos los campos obligatorios
- [ ] Guardar
- [ ] Certificación aparece en tabla
- [ ] Datos se ven correctos
- [ ] Mensaje de éxito aparece

### Crear Detalle
- [ ] Abrir modal de detalles de certificación
- [ ] Seleccionar clasificador
- [ ] Ingresar monto
- [ ] Agregar
- [ ] Detalle aparece en tabla
- [ ] Monto se suma correctamente
- [ ] Mensaje de éxito aparece

### Editar Certificación
- [ ] Hacer clic en botón editar
- [ ] Modal abre con datos precargados
- [ ] Cambiar algunos datos
- [ ] Guardar
- [ ] Tabla se actualiza
- [ ] Cambios se guardan correctamente

### Eliminar Detalle
- [ ] Abrir modal de detalles
- [ ] Hacer clic en botón eliminar de un detalle
- [ ] Confirmar eliminación
- [ ] Detalle desaparece
- [ ] Total se recalcula
- [ ] Mensaje de éxito aparece

### Eliminar Certificación
- [ ] Hacer clic en botón eliminar en tabla
- [ ] Confirmar eliminación
- [ ] Certificación desaparece
- [ ] Todos sus detalles se eliminan en cascada
- [ ] Mensaje de éxito aparece

### Filtros y Búsqueda
- [ ] Búsqueda por nota funciona
- [ ] Búsqueda por número documento funciona
- [ ] Tabla se actualiza dinámicamente
- [ ] Paginación funciona si hay muchos registros

---

## 📊 Verificación de Base de Datos

### Datos Creados
```sql
SELECT * FROM certificaciones_credito;
SELECT * FROM detalles_certificacion_credito;
SELECT * FROM certificaciones_credito_detalladas;
```

- [ ] Certificaciones aparecen con datos correctos
- [ ] Detalles están ligados a certificaciones correctas
- [ ] Vista muestra totales calculados
- [ ] Relaciones con metas están correctas
- [ ] Relaciones con fuentes están correctas
- [ ] Usuario_id se grabó correctamente

### Integridad Referencial
```sql
-- Verificar que no hay orfandad
SELECT * FROM detalles_certificacion_credito 
WHERE certificacion_credito_id NOT IN (SELECT id FROM certificaciones_credito);

-- Verificar que clasificadores existen
SELECT * FROM detalles_certificacion_credito dcc
WHERE NOT EXISTS (SELECT 1 FROM clasificadores c WHERE c.id = dcc.clasificador_id);
```

- [ ] No hay registros huérfanos
- [ ] Todas las relaciones son válidas
- [ ] Cascadas funcionan correctamente

---

## 🔒 Verificación de Seguridad

### Autenticación
- [ ] No puedo acceder sin autenticación
- [ ] Token requerido en headers
- [ ] Middleware de auth presente

### Validaciones
- [ ] Campos obligatorios no permiten vacío
- [ ] Números validados como positivos
- [ ] Fechas tienen formato correcto
- [ ] Selecciones validadas contra BD
- [ ] No se pueden crear duplicados de documento

### Permisos
- [ ] Usuario solo ve sus propias certificaciones (si aplica)
- [ ] No se pueden editar certificaciones de otros
- [ ] Eliminación requiere confirmación
- [ ] Operaciones se auditan (si hay auditoría)

---

## 📝 Documentación

### Archivos de Documentación Creados
- [ ] `IMPLEMENTACION_CERTIFICACIONES_CREDITO.md`
- [ ] `RESUMEN_CERTIFICACIONES_CREDITO.md`
- [ ] `GUIA_PRACTICA_CERTIFICACIONES_CREDITO.md`
- [ ] `CHECKLIST_CERTIFICACIONES_CREDITO.md` (este archivo)
- [ ] `database/schema_certificaciones_credito.sql`

### Contenido de Documentación
- [ ] Pasos de instalación claros
- [ ] Estructura de BD documentada
- [ ] Endpoints listados
- [ ] Ejemplos de uso proporcionados
- [ ] Troubleshooting incluido
- [ ] FAQ respondidas

---

## 🚀 Despliegue

### Pre-Despliegue
- [ ] Código revisado
- [ ] Pruebas pasadas
- [ ] Documentación completa
- [ ] Cambios en Git (si usa versionamiento)
- [ ] Base de datos backup realizado

### Producción
- [ ] Tablas creadas en BD producción
- [ ] Backend compilado/revisado
- [ ] Frontend compilado
- [ ] Archivo `.env` correcto (si existe)
- [ ] Permisos de carpetas correctos
- [ ] Servidor iniciado correctamente
- [ ] Acceso a módulo verificado

### Post-Despliegue
- [ ] Usuarios pueden crear certificaciones
- [ ] Datos se guardan correctamente
- [ ] No hay errores en logs
- [ ] Performance aceptable
- [ ] Backups automáticos funcionan
- [ ] Documentación actualizada

---

## 🎯 Problemas Comunes y Soluciones

### Problema: "Tabla no existe"
- [ ] Verificar script SQL ejecutado
- [ ] Verificar nombre exacto de tabla
- [ ] Verificar conexión a BD correcta
- [ ] **Solución:** Ejecutar script nuevamente

### Problema: "Controller not found"
- [ ] Verificar archivo controller existe
- [ ] Verificar ruta en require
- [ ] Verificar sintaxis del require
- [ ] **Solución:** Reiniciar servidor backend

### Problema: "API responde 404"
- [ ] Verificar ruta existe en routes/comisiones.js
- [ ] Verificar método HTTP correcto (GET/POST/PUT/DELETE)
- [ ] Verificar ruta requiere controller correcto
- [ ] **Solución:** Verificar routes y reiniciar

### Problema: "Componente no carga"
- [ ] Verificar archivo existe en ruta correcta
- [ ] Verificar importaciones correctas
- [ ] Verificar dependencias instaladas
- [ ] **Solución:** Revisar console del navegador

### Problema: "Validación falla"
- [ ] Revisar campos obligatorios
- [ ] Verificar formato de datos
- [ ] Revisar mensajes de error en response
- [ ] **Solución:** Ajustar valores según validaciones

---

## 📞 Contacto y Escalación

- [ ] Documentación revisada por equipo
- [ ] Capacitación de usuarios programada
- [ ] Soporte técnico disponible
- [ ] Contacto para issues abierto
- [ ] Proceso de feedback establecido

---

## ✅ FIRMA DE VALIDACIÓN

**Proyecto:** COMISIONES_AAAU  
**Módulo:** Certificación de Crédito Presupuestario  
**Versión:** 1.0  
**Fecha Implementación:** 2026-03-13  

**Checklist Completado Por:** ________________  
**Fecha:** ________________  
**Firma:** ________________  

**Revisado Por:** ________________  
**Fecha:** ________________  
**Firma:** ________________  

---

**Estado Final:** ☐ PENDIENTE | ☐ EN PROGRESO | ☐ COMPLETADO | ☐ PRODUCCIÓN

---

*Última actualización: 2026-03-13*
*Este checklist debe mantenerse actualizado con cada cambio*
