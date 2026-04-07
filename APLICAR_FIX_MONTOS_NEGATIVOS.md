# 🎯 CHECKLIST - Resolución de Montos Negativos

## ✅ Cambios Completados

### Backend - Lógica Mejorada
- [x] Mejorada función de resta de montos en `formatoEmisionController.js`
- [x] Ahora busca detalles en certificación anterior si vienen con NULL
- [x] Previene futuros montos negativos en cambios de certificación
- [x] Agregadas dos nuevas funciones de reparación y diagnóstico

### Endpoints API - Nuevos (solo admin)
- [x] `POST /formatos-emisiones/reparar/montos-utilizados` - Reparación
- [x] `GET /formatos-emisiones/diagnostico/montos` - Diagnóstico
- [x] Ambos endpoints con logging detallado

### Scripts de Reparación
- [x] `scripts/diagnosticoMontos.js` - Analiza problemas sin cambios
- [x] `scripts/repararMontosUtilizados.js` - Recalcula todos los montos
- [x] Documentación completa en `scripts/README_MONTOS_REPAIR.md`

### Frontend - Mejoras UI
- [x] EmisionFormatos: Agregada columna "CCP (Certificación)" con badge
- [x] GestionCertificacionesFormatos: Agregada columna "Monto" formateada
- [x] Ambas columnas con estilos consistentes

### Documentación
- [x] README de scripts de reparación
- [x] Resumen técnico de cambios
- [x] Este checklist

---

## 🚀 Instrucciones de Aplicación

### Paso 1: Diagnosticar Problema Actual

```bash
cd backend
node scripts/diagnosticoMontos.js > diagnostico_ANTES.txt
cat diagnostico_ANTES.txt
```

**Revisa:**
- ¿Cuántas discrepancias hay?
- ¿Cuáles son negativas?
- ¿Qué certificaciones están afectadas?

### Paso 2: Hacer Backup

```bash
mysqldump -u root -p comisiones_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 3: Ejecutar Reparación

```bash
node scripts/repararMontosUtilizados.js
```

Espera a que termine. Revisará:
- Resetea todos a 0 ✅
- Recalcula desde detalles reales ✅
- Reporta discrepancias residuales (si hay sobregiros)

### Paso 4: Verificar Resultado

```bash
node scripts/diagnosticoMontos.js > diagnostico_DESPUES.txt
cat diagnostico_DESPUES.txt
```

**Compara:**
- ¿Desaparecieron los valores negativos?
- ¿Hay nuevas discrepancias?
- ¿Hay sobregiros?

### Paso 5: Probar en UI

1. Abre `/gestion/emision-formatos`
   - Verifica que muestre la nueva columna CCP
   - Revisa los badges de certificación

2. Abre `/gestion/certificaciones-formatos`
   - Verifica que muestre nueva columna Monto
   - Prueba cambiar certificación
   - Verifica que no queden montos negativos

3. Cambia certificación varias veces
   - Verifica que los montos se actualicen correctamente
   - Usa diagnóstico después para verificar

---

## 📊 Resultados Esperados

### Antes de Reparación
```
⚠️  DISCREPANCIA - Detalle ID: 7
   CCP: 0000001726 | Clasificador: PASAJES
   Disponible: S/. 3,520.00
   Actual: S/. -880.00 ❌ NEGATIVO
   
⚠️  DISCREPANCIA - Detalle ID: 30
   CCP: 0000000331 | Clasificador: HOSPEDAJE
   Disponible: S/. 2,300.00
   Actual: S/. -1,500.00 ❌ NEGATIVO
```

### Después de Reparación
```
✅ Detalle ID: 7
   Disponible: S/. 3,520.00
   Actual: S/. 880.00 ✅ POSITIVO
   
✅ Detalle ID: 30
   Disponible: S/. 2,300.00
   Actual: S/. 1,500.00 ✅ POSITIVO
```

---

## 🔍 Validación Post-Reparación

### ✅ Verificaciones a Hacer

- [ ] No hay montos negativos
- [ ] Todos los montos son >= 0
- [ ] No hay sobregiros (utilizado > disponible)
- [ ] EmisionFormatos muestra CCP badge correctamente
- [ ] GestionCertificacionesFormatos muestra Monto
- [ ] Cambios de certificación funcionan sin problemas
- [ ] Diagnóstico final no reporta discrepancias

### ⚠️ Si Hay Sobregiros Residuales

Significa que REALMENTE hay formatos que usan más de lo disponible:

```
Options:
1. Anular algunos formatos para liberar monto
2. Crear certificaciones adicionales
3. Reducir montos de formatos existentes
```

---

## 📝 Registro de Aplicación

| Fecha | Acción | Usuario | Resultado |
|-------|--------|---------|-----------|
| 31/03/2026 | Diagnóstico | Sistema | 2 discrepancias |
| | Reparación | Sistema | ??? |
| | Verificación | Usuario | ??? |

---

## 🎓 Qué Cambió en el Código

### Backend (formatoEmisionController.js)

**ANTES:**
```javascript
// Solo restaba si tenía referencia
if (detalleAntiguo.detalles_certificacion_credito_id) {
  // Restar...
}
// Si no tenía referencia, NO hacía nada = PROBLEMA ❌
```

**AHORA:**
```javascript
// Caso 1: Tiene referencia (normal)
if (detalleAntiguo.detalles_certificacion_credito_id) {
  // Restar normal
}
// Caso 2: Sin referencia pero cambió cert (nuevo)
else if (certificacion_anterior !== null) {
  // Buscar en cert anterior y restar desde allá ✅
}
```

### Frontend (EmisionFormatos.js)

**ANTES:**
```javascript
{ Header: 'Comisionado', accessor: 'usuario_nombre' },
{ Header: 'Monto', accessor: 'monto' }
```

**AHORA:**
```javascript
{ Header: 'Comisionado', accessor: 'usuario_nombre' },
{ 
  Header: 'CCP (Certificación)',
  Cell: ({ row }) => {
    const cert = row.original.formato_existente?.certificacion_nota;
    return cert ? 
      <Chip label={`CCP: ${cert}`} color="primary" /> :
      <Chip label="Sin certificación" color="warning" />
  }
},
{ Header: 'Monto', accessor: 'monto' }
```

---

## 📞 Preguntas Frecuentes

**P: ¿Esto elimina datos?**
A: No. Solo recalcula valores, no elimina registros.

**P: ¿Puedo deshacer si algo sale mal?**
A: Sí, tienes backup. Simplemente restaura: `mysql -u root -p comisiones_db < backup.sql`

**P: ¿Cuánto tarda la reparación?**
A: Depende de la cantidad de datos. Típicamente < 5 segundos.

**P: ¿Es seguro hacer esto en producción?**
A: Recomendado hacerlo fuera de horario de operación. Hacer backup primero.

**P: ¿Qué pasa con futuros cambios?**
A: La nueva lógica en backend los maneja correctamente. No debería haber más problemas.

---

## ✨ Resumen

✅ **Problema:** Montos negativos en cambios de certificación  
✅ **Causa:** Falta de búsqueda en certificación anterior  
✅ **Solución:** Mejorada lógica + scripts de reparación  
✅ **Validación:** Diagnóstico y reparación automatizados  
✅ **UI:** Agregadas columnas para mejor visualización  

**Estado:** LISTO PARA APLICAR ✅
