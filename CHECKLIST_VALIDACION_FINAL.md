# ✅ CHECKLIST DE VALIDACIÓN FINAL

**Fecha**: 11 de Febrero de 2026  
**Proyecto**: Sistema de Comisiones - Sincronización de Montos

---

## ��� PRE-REQUISITOS

- [ ] Acceso a la BD MySQL
- [ ] Node.js instalado en backend
- [ ] npm disponible
- [ ] Terminal configurada para ejecutar scripts
- [ ] Git actualizado (opcional)

---

## �� INSTALACIÓN Y COMPILACIÓN

### Paso 1: Sincronizar BD (ONE-TIME)
```bash
cd d:\COMISIONES_AAAU\backend
node sync-costos-totales.js
```

**Validar**:
- [ ] Script ejecuta sin errores
- [ ] Salida muestra: "✅ SINCRONIZACIÓN COMPLETADA"
- [ ] Reporta: "Comisiones actualizadas: X"
- [ ] Si hay discrepancias, muestra tabla completa

### Paso 2: Compilar Frontend
```bash
cd d:\COMISIONES_AAAU\material-dashboard-react
npm run build
```

**Validar**:
- [ ] Build completa exitosamente
- [ ] No hay errores ESLint bloqueantes
- [ ] Salida final: "Build folder is ready to be deployed"
- [ ] Tamaño bundle ≈ 501 KB (gzipped)

### Paso 3: Reiniciar Backend
```bash
cd d:\COMISIONES_AAAU\backend
npm run dev
```

**Validar**:
- [ ] Backend inicia sin errores
- [ ] Conexión a BD establecida
- [ ] Servidor corriendo en puerto 3001
- [ ] No hay warnings MySQL

---

## ��� PRUEBAS FUNCIONALES

### Test 1: Crear Nueva Comisión
1. [ ] Ir a `/gestion-comisiones`
2. [ ] Click en "Nueva Comisión"
3. [ ] Llenar datos: Lugar, Fechas, Costo/día
4. [ ] Agregar 3+ comisionados con partidas VIÁTICOS y PASAJES
5. [ ] Verificar en console que se calcula monto:
   ```
   ��� AGREGANDO NUEVO COMISIONADO:
   ComisionId: X
   Datos a enviar: {
     ...,
     monto: 880,    // ← Debe estar presente
     ...
   }
   ```
6. [ ] Click "Guardar"
7. [ ] Debe guardarse exitosamente

### Test 2: Editar Comisión Existente
1. [ ] Ir a `/gestion-comisiones`
2. [ ] Buscar una comisión existente
3. [ ] Click "Editar"
4. [ ] Modificar un comisionado existente (cambiar días o costo)
5. [ ] Agregar un nuevo comisionado
6. [ ] Verificar en console:
   ```
   ��� ACTUALIZANDO COMISIONADO EXISTENTE:
   ...,
   monto: XXX,  // ← Debe actualizarse
   
   ��� AGREGANDO NUEVO COMISIONADO:
   ...,
   monto: YYY,  // ← Debe calcularse
   ```
7. [ ] Click "Guardar"
8. [ ] Datos guardados correctamente

### Test 3: Verificar Detalle en Aprobaciones
1. [ ] Ir a `/aprobaciones`
2. [ ] Encontrar una comisión aprobada
3. [ ] Click "Ver Detalle"
4. [ ] Verificar tabla:
   - [ ] Usuarios en filas
   - [ ] Partidas en columnas
   - [ ] Montos en celdas (ej: 880, 900)
   - [ ] Total por persona correcto
   - [ ] Total por partida correcto
   - [ ] Gran total coincide con `costo_total_comision`

### Test 4: Verificar BD Directamente
```sql
SELECT c.id, c.lugar, c.costo_total_comision,
       SUM(cc.monto) as suma_comisionados
FROM comisiones c
LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
GROUP BY c.id, c.lugar, c.costo_total_comision
HAVING c.costo_total_comision > 0;
```

**Validar**:
- [ ] `costo_total_comision` = `suma_comisionados` para cada comisión
- [ ] No hay valores NULL
- [ ] No hay valores negativos
- [ ] Valores coinciden con lo mostrado en UI

---

## ��� VERIFICACIÓN DE MONTOS

### Fórmula de Validación Correcta

**VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO**:
```
monto = días × costo_xdia
4 × 220 = 880
```

**PASAJES Y GASTOS DE TRANSPORTE**:
```
monto = costo_xdia (SIN multiplicar)
900 (no multiplica)
```

### Ejemplo Comisión ID 1

**Comisionado 1: DHAYRO KONG**
- [ ] VIÁTICOS: 4 × 220 = 880 ✓
- [ ] PASAJES: 900 ✓
- [ ] Subtotal: 1,780 ✓

**Comisionado 2: CAROL ARCOS**
- [ ] VIÁTICOS: 4 × 220 = 880 ✓
- [ ] PASAJES: 900 ✓
- [ ] Subtotal: 1,780 ✓

**Comisionado 3: MILNER OYOLA**
- [ ] VIÁTICOS: 4 × 220 = 880 ✓
- [ ] PASAJES: 900 ✓
- [ ] Subtotal: 1,780 ✓

**TOTALES**:
- [ ] VIÁTICOS: 3 × 880 = 2,640 ✓
- [ ] PASAJES: 3 × 900 = 2,700 ✓
- [ ] COMISIÓN: 5,340.00 ✓

---

## ��� VALIDACIONES EN DIFERENTES VISTAS

### Reportes
1. [ ] Ir a Reportes → Presupuestos Pendientes
2. [ ] Verificar montos mostrados:
   - [ ] Coinciden con BD
   - [ ] Coinciden con detalles en aprobaciones
   - [ ] No hay discrepancias

### Aprobaciones
1. [ ] Ir a Aprobaciones
2. [ ] Columna "Monto Total":
   - [ ] Muestra el total correcto
   - [ ] Coincide con suma de comisionados
   - [ ] Click "Ver Detalle" confirma totales

### Gestión de Comisiones
1. [ ] Ir a Gestión de Comisiones
2. [ ] Tabla principal muestra "Monto Total":
   - [ ] Valores positivos
   - [ ] No hay 0s indebidos
   - [ ] Coinciden con BD

---

## ��� TROUBLESHOOTING

Si algo no funciona:

### Error 1: Script no ejecuta
```bash
cd backend
npm install
node sync-costos-totales.js
```
- [ ] Intenta nuevamente

### Error 2: Monto NULL en BD
```sql
SELECT * FROM comision_comisionados WHERE monto IS NULL;
```
- [ ] Si hay resultados, ejecutar sincronización otra vez
- [ ] Verificar que frontend esté compilado (npm run build)

### Error 3: Montos no coinciden
```sql
-- Verificar totales
SELECT c.id, 
       c.costo_total_comision,
       SUM(cc.monto) as suma
FROM comisiones c
LEFT JOIN comision_comisionados cc ON c.id = cc.comision_id
GROUP BY c.id;
```
- [ ] Si hay diferencia > 0.01, ejecutar sincronización
- [ ] Revisar clasificadores: ¿Tienen "VIÁTICO" en nombre?

---

## ✨ SIGN-OFF FINAL

- [ ] Script sincronización ejecutado exitosamente
- [ ] Frontend compilado sin errores
- [ ] Backend corriendo en puerto 3001
- [ ] Crear nueva comisión funciona (monto se calcula)
- [ ] Editar comisión funciona (monto se recalcula)
- [ ] Ver detalle en aprobaciones muestra tabla correcta
- [ ] BD verifica: costo_total_comision = suma comisionados
- [ ] Reportes muestran montos correctos
- [ ] No hay discrepancias en el sistema
- [ ] Documentación completa y actualizada

---

## ��� NOTAS ADICIONALES

```
Fecha de Validación: _______________
Validador: _______________________
Problemas encontrados: ____________
Soluciones aplicadas: ______________
Estado Final: ✅ COMPLETADO / ❌ INCOMPLETO
```

---

**Elaborado**: 11 de Febrero de 2026  
**Versión**: 1.0  
**Estado**: ✅ LISTO PARA VALIDAR
