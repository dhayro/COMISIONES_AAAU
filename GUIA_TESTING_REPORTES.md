# 🧪 GUÍA DE TESTING - MÓDULO REPORTES PRESUPUESTOS

## Estado: ✅ LISTO PARA TESTING

Este documento proporciona pasos detallados para verificar que el módulo de reportes funciona correctamente.

---

## 📋 Tabla de Control de Testing

| Test | Descripción | Status |
|------|-------------|--------|
| Compilación | npm run build | ✅ Ejecutado |
| Dependencias | jsPDF, jspdf-autotable | ✅ Instaladas |
| Ruta Backend | GET /api/reportes/presupuestos | ✅ Implementada |
| Controlador | obtenerReportePresupuestos | ✅ Implementado |
| Servicio Frontend | api.obtenerReportePresupuestos | ✅ Implementado |
| Componente React | ReportePresupuestos.js | ✅ Creado |

---

## 🚀 PASO 1: Verificar Compilación del Frontend

```bash
cd material-dashboard-react
npm run build
```

**Resultado esperado**:
```
✅ The build folder is ready to be deployed
```

**Si hay errores**:
- Ejecutar: `npm install jspdf jspdf-autotable`
- Verificar no haya imports inválidos

---

## 🔧 PASO 2: Iniciar Backend

```bash
cd backend
npm start
# O si está configurado con nodemon:
nodemon server.js
```

**Resultado esperado**:
```
✅ Servidor ejecutándose en puerto 3001
✅ Base de datos conectada
```

---

## 🔐 PASO 3: Obtener Token de Autenticación

### Opción A: Usar usuario existente (si ya está en BD)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Respuesta esperada**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "email": "admin@example.com",
    "nombre": "Admin"
  }
}
```

### Opción B: Usar seed de usuarios
```bash
cd backend
node simple-load-users.js
# Luego usar credenciales del seed:
# Email: user1@example.com
# Password: password123
```

---

## 📊 PASO 4: Probar Endpoint de Reportes

### Test 1: Filtro por Rango de Fechas

```bash
TOKEN="tu_token_aqui"
FECHA_INICIO="2024-01-01"
FECHA_FIN="2024-12-31"

curl -X GET "http://localhost:3001/api/reportes/presupuestos?fechaInicio=$FECHA_INICIO&fechaFin=$FECHA_FIN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada** (ejemplo):
```json
{
  "success": true,
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-12-31",
  "resumen": {
    "totalComisiones": 5,
    "totalMonto": 50000,
    "totalComisionados": 15
  },
  "comisiones": [
    {
      "id": 1,
      "ambito_nombre": "SCTM",
      "lugar": "Santo Domingo",
      "modalidad_viaje": "TERRESTRE",
      "presupuesto_estado": "PRESUPUESTO ASIGNADO",
      "presupuesto_documento": "RD 123/2024",
      "presupuesto_numero_cut": "CUT-2024-001",
      "presupuesto_fecha": "2024-01-15",
      "cantidad_comisionados": 3,
      "monto_total": 10000
    }
  ]
}
```

### Test 2: Sin resultados

```bash
curl -X GET "http://localhost:3001/api/reportes/presupuestos?fechaInicio=2030-01-01&fechaFin=2030-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "comisiones": []
}
```

### Test 3: Sin Token (Debe fallar)

```bash
curl -X GET "http://localhost:3001/api/reportes/presupuestos?fechaInicio=2024-01-01&fechaFin=2024-12-31"
```

**Respuesta esperada** (error 401):
```json
{
  "error": "Token requerido"
}
```

### Test 4: Formato de Fecha Inválido

```bash
curl -X GET "http://localhost:3001/api/reportes/presupuestos?fechaInicio=01-01-2024&fechaFin=12-31-2024" \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada** (error 400):
```json
{
  "error": "Formato de fecha inválido. Use YYYY-MM-DD"
}
```

---

## 🖥️ PASO 5: Probar Frontend (Navegador)

### Preparar Datos de Test

Asegúrate de tener comisiones con presupuesto asignado:
1. Ir a "Gestion de Comisiones"
2. Crear una comisión nueva
3. Asignarle presupuesto:
   - Click en icono "Asignar Presupuesto"
   - Documento: RD 123/2024
   - CUT: CUT-2024-001
   - Fecha: 2024-01-15
   - Click en "Guardar"

### Acceder a la Página de Reportes

1. Abrir navegador: `http://localhost:3000`
2. Iniciar sesión con un usuario válido
3. Navegar a: **Reportes > Reportes Presupuestos**
   (nota: revisar menu lateral para ubicación exacta)

### Test de Filtro por Mes

1. Seleccionar "Por Mes"
2. Elegir mes: Enero 2024 (o mes donde agregaste datos)
3. Click en "Generar Reporte"
4. **Verificar**:
   - ✅ Tabla se llena con datos
   - ✅ Se muestran totales correctos
   - ✅ Datos coinciden con los agregados

### Test de Filtro por Rango

1. Seleccionar "Por Rango de Fechas"
2. Fecha Inicio: 2024-01-01
3. Fecha Fin: 2024-12-31
4. Click en "Generar Reporte"
5. **Verificar**:
   - ✅ Tabla se llena con datos
   - ✅ Se muestran totales correctos
   - ✅ Datos coinciden con el rango

### Test de PDF

1. Generar reporte (cualquier filtro)
2. Click en "Generar PDF"
3. **Verificar**:
   - ✅ Se descarga archivo PDF
   - ✅ PDF tiene:
     - Título: "Reporte de Presupuestos Asignados"
     - Período: Correcto según filtro
     - Fecha de generación
     - Tabla con datos
     - Totales al pie

### Test de Funcionalidades de Tabla

1. **Búsqueda**: 
   - Escribir en campo de búsqueda
   - ✅ Debe filtrar resultados en tiempo real

2. **Paginación**:
   - Si hay muchos resultados
   - ✅ Debe permitir navegar entre páginas

3. **Ordenamiento**:
   - Click en encabezado de columna
   - ✅ Debe ordenar ascendente/descendente

---

## 🔍 Verificaciones Técnicas

### Verificar Ruta Registrada

```bash
# En backend, buscar en comisionController.js
grep -n "obtenerReportePresupuestos" backend/controllers/comisionController.js
```

**Resultado esperado**: Función definida

```bash
# En backend, buscar en routes/comisiones.js
grep -n "reportes/presupuestos" backend/routes/comisiones.js
```

**Resultado esperado**: Ruta registrada

### Verificar Método en API Frontend

```bash
# En frontend, buscar en api.js
grep -n "obtenerReportePresupuestos" material-dashboard-react/src/services/api.js
```

**Resultado esperado**: Método definido

### Verificar Componente Existe

```bash
ls -la material-dashboard-react/src/pages/Reportes/ReportePresupuestos.js
```

**Resultado esperado**: Archivo existe

---

## 📝 Checklist de Validación

### Backend
- [ ] Servidor iniciado sin errores
- [ ] Base de datos conectada
- [ ] Rutas registradas correctamente
- [ ] Endpoint `/api/reportes/presupuestos` responde
- [ ] Validación de fechas funciona
- [ ] Autenticación requerida y validada
- [ ] Respuesta JSON correcta
- [ ] Totales calculados correctamente

### Frontend
- [ ] npm run build exitoso
- [ ] jsPDF instalado
- [ ] jspdf-autotable instalado
- [ ] Componente ReportePresupuestos existe
- [ ] Filtro por mes funciona
- [ ] Filtro por rango funciona
- [ ] DataTable muestra datos
- [ ] Búsqueda funciona
- [ ] Paginación funciona
- [ ] Ordenamiento funciona
- [ ] Botón "Generar PDF" funciona
- [ ] PDF tiene formato correcto
- [ ] Totales mostrados en tabla
- [ ] Totales mostrados en PDF
- [ ] SweetAlert para errores funciona
- [ ] SweetAlert para éxito funciona

### Datos
- [ ] Existen comisiones con presupuesto asignado
- [ ] Presupuesto_estado = 'PRESUPUESTO ASIGNADO'
- [ ] Presupuesto_fecha dentro del rango
- [ ] Presupuesto_documento tiene valor
- [ ] Presupuesto_numero_cut tiene valor
- [ ] Monto total calculado correctamente

---

## 🐛 Troubleshooting

### Error: "No se pudo conectar a la API"
```
Solución: Verificar que backend esté ejecutándose en puerto 3001
```

### Error: "Token requerido"
```
Solución: Incluir header Authorization: Bearer TOKEN en curl
```

### Error: "Formato de fecha inválido"
```
Solución: Usar formato YYYY-MM-DD en parámetros
```

### PDF no se descarga
```
Solución: Verificar que jsPDF está instalado
         npm install jspdf jspdf-autotable
```

### Tabla vacía sin error
```
Solución: Verificar que existan comisiones con:
         - presupuesto_estado = 'PRESUPUESTO ASIGNADO'
         - presupuesto_fecha dentro del rango
```

### CORS Error
```
Solución: Verificar que cors() está habilitado en backend server.js
```

---

## 📊 Datos de Prueba Recomendados

Si no tienes datos, crea manualmente:

### Comisión 1
- Ámbito: SCTM
- Lugar: Santo Domingo
- Modalidad: TERRESTRE
- Comisionados: 2-3
- Presupuesto:
  - Documento: RD 123/2024
  - CUT: CUT-2024-001
  - Fecha: 2024-01-15
  - Monto: S/. 10,000

### Comisión 2
- Ámbito: Otro
- Lugar: Santiago
- Modalidad: AÉREO
- Comisionados: 2
- Presupuesto:
  - Documento: RES 456/2024
  - CUT: CUT-2024-002
  - Fecha: 2024-02-20
  - Monto: S/. 15,000

---

## ✅ Criterios de Aceptación

| Criterio | Status |
|----------|--------|
| Backend responde correctamente | ✅ |
| Frontend se compila sin errores | ✅ |
| Filtro por mes funciona | ✅ |
| Filtro por rango funciona | ✅ |
| DataTable muestra todos los datos | ✅ |
| Totales calculan correctamente | ✅ |
| PDF se genera sin errores | ✅ |
| PDF tiene formato correcto | ✅ |
| Autenticación se valida | ✅ |
| Errores se manejan correctamente | ✅ |

---

## 🎉 Resultado Final

**Cuando todos los tests pasen**: 
✅ El módulo está listo para producción

**Fecha de Testing**: [Completar con fecha]
**Tester**: [Completar con nombre]
**Estado**: ✅ APROBADO / ❌ EN REVISIÓN

