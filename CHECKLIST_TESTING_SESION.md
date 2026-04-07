# ✅ CHECKLIST DE TESTING - SESIÓN ACTUAL

## Estado: Listo para Testing

---

## 🚀 ANTES DE EMPEZAR
- [ ] Backend Node.js reiniciado
- [ ] Frontend React en desarrollo o build nuevo
- [ ] Base de datos accesible
- [ ] DevTools (F12) abierto en navegador

---

## 🔴 TEST 1: Verificar `ambito_nombre` en Backend

**Objetivo:** Confirmar que backend retorna campo correctamente

**Pasos:**
1. [ ] Abre DevTools → Network tab
2. [ ] Navega a "Emitir Formato"
3. [ ] Haz click en "Emitir Formato" para una comisión
4. [ ] Busca request a `/api/comisiones` en Network
5. [ ] Abre Response y verifica que contiene:
   ```json
   "comisionados": [
     {
       "usuario_id": 3,
       "usuario_nombre": "DHAYRO KONG TORRES",
       "ambito_id": 2,
       "ambito_nombre": "UCAYALI",  // ← ✅ DEBE EXISTIR
       "cargo_id": 1,
       "cargo_nombre": "GERENTE"     // ← ✅ DEBE EXISTIR
     }
   ]
   ```

**Criterio de Paso:** ✅ ambito_nombre tiene valor (no null, no undefined)

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟡 TEST 2: Verificar Dirección en Anexo 02

**Objetivo:** Confirmar que "SIN DIRECCIÓN ASIGNADA" se reemplazó con valor real

**Pasos:**
1. [ ] En modal de "Emitir Formato", haz click en "Anexo 02"
2. [ ] Observa el PDF que se genera
3. [ ] Busca la línea "DIRECCIÓN / OFICINA:"
4. [ ] Verifica que dice UCAYALI (o tu dirección real), NO "SIN DIRECCIÓN ASIGNADA"

**Criterio de Paso:** ✅ Aparece nombre de dirección real

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟡 TEST 3: Verificar Dirección en Anexo 01

**Objetivo:** Confirmar que dirección aparece en Anexo 01 también

**Pasos:**
1. [ ] En modal, haz click en "Anexo 01"
2. [ ] Observa el PDF generado
3. [ ] Busca la línea "DIRECCIÓN / OFICINA:"
4. [ ] Verifica que dice UCAYALI (o tu dirección real)

**Criterio de Paso:** ✅ Aparece nombre de dirección real

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟡 TEST 4: Verificar Fecha en PDFs (Formato Comisión)

**Objetivo:** Verificar que fecha usa `creado_en` del BD, no hora del cliente

**Pasos:**
1. [ ] Abre DevTools → Console
2. [ ] En modal preview, ejecuta:
   ```javascript
   // Ver la fecha que se está usando
   console.log('PDF debe mostrar fecha del creado_en, no new Date()');
   ```
3. [ ] Haz click en "Ver Formato Comisión" (Anexo 01)
4. [ ] En el PDF, busca la fecha en el footer
5. [ ] Anota qué hora muestra:
   - Mi hora actual: __:__ 
   - Hora mostrada en PDF: __:__
6. [ ] Si son iguales, revisa console.log para confirmar

**Criterio de Paso:** ✅ Hora en PDF = hora que se creó formato, no hora actual

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟡 TEST 5: Verificar `actividad_realizar` Guardado

**Objetivo:** Confirmar que el campo se guardó correctamente

**Pasos:**
1. [ ] Abre un formato existente para edición
2. [ ] Busca el campo "Actividad a Realizar"
3. [ ] Verifica que contiene el valor que ingresaste

**Criterio de Paso:** ✅ Campo tiene valor guardado

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟡 TEST 6: Verificar Logo en PDFs

**Objetivo:** Confirmar que logo ANA aparece en PDFs

**Pasos:**
1. [ ] Genera cualquier PDF (Anexo 01 o 02)
2. [ ] En el PDF generado, busca el logo de ANA
3. [ ] Verifica que aparece en la esquina superior izquierda

**Criterio de Paso:** ✅ Logo visible en PDF

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟡 TEST 7: Descargar y Verificar PDF Localmente

**Objetivo:** Confirmar que PDF descargado tiene toda la info correcta

**Pasos:**
1. [ ] Haz click en "Descargar PDF" en el modal
2. [ ] Abre el PDF en Adobe Reader o navegador
3. [ ] Verifica:
   - [ ] Logo aparece
   - [ ] Dirección correcta (no "SIN DIRECCIÓN")
   - [ ] Fecha tiene formato correcto
   - [ ] Actividad a Realizar visible

**Criterio de Paso:** ✅ Todos los campos correctos en PDF descargado

**Resultado:** [ ] PASE [ ] FALLE
**Notas:** _______________________

---

## 🟢 RESUMEN GENERAL

| Test | Objetivo | Estado | Notas |
|------|----------|--------|-------|
| 1 | Backend retorna ambito_nombre | [ ] OK [ ] FALLA | |
| 2 | Anexo 02 muestra dirección | [ ] OK [ ] FALLA | |
| 3 | Anexo 01 muestra dirección | [ ] OK [ ] FALLA | |
| 4 | Fechas usan creado_en | [ ] OK [ ] FALLA | |
| 5 | actividad_realizar guardado | [ ] OK [ ] FALLA | |
| 6 | Logo visible en PDFs | [ ] OK [ ] FALLA | |
| 7 | PDF descargado correcto | [ ] OK [ ] FALLA | |

---

## 📋 SI ALGO FALLA:

1. **Si Test 1 falla (backend):**
   - Reinicia backend
   - Verifica que `comisionController.js` línea 103-118 tiene los JOINs
   - Revisa console del backend por errores SQL

2. **Si Test 2/3 fallan (dirección):**
   - Verifica que `ambito_nombre` viene del backend (Test 1)
   - Revisa `EmisionFormatos.js` línea 417 y 1167
   - Abre DevTools console para ver si hay errores

3. **Si Test 4 falla (fechas):**
   - Verifica que `formatoCompleto.creado_en` tiene un valor
   - En DevTools, ejecuta: `console.log(formatoCompleto?.creado_en)`
   - Verifica líneas 1113, 1723, 1987, 2002

4. **Si Test 5/6 fallan:**
   - Estos son cambios básicos, revisar que los archivos se guardaron

---

## 📞 CONTACTO PARA DEBUGGING

Si algo falla:
1. Tomar screenshot del DevTools (Network/Console)
2. Tomar screenshot del PDF
3. Anotar exactamente qué está mal
4. Compartir los detalles

---

**Documento: CHECKLIST_TESTING_SESION.md**
**Última actualización:** [Sesión Actual]
