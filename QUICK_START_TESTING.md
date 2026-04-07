# 🚀 QUICK START - TESTING INMEDIATO

## ⏱️ Tiempo estimado: 15-20 minutos

---

## 1️⃣ PREPARAR EL AMBIENTE

### Paso 1: Abrir dos terminales

**Terminal 1 (Backend):**
```bash
cd d:\COMISIONES_AAAU\backend
npm run dev
# Espera hasta ver: "Server running on port 5000" ✅
```

**Terminal 2 (Frontend):**
```bash
cd d:\COMISIONES_AAAU\material-dashboard-react
npm start
# Espera hasta ver la UI en http://localhost:3000 ✅
```

---

## 2️⃣ ABRIR NAVEGADOR

1. Abre navegador en: `http://localhost:3000`
2. Presiona **F12** para abrir DevTools
3. Tabs necesarios:
   - **Network** - Para ver requests API
   - **Console** - Para ver logs y errores

---

## 3️⃣ TEST RÁPIDO #1: Verificar Backend

**Objetivo:** Confirmar que `/api/comisiones` retorna `ambito_nombre`

**Pasos:**
```
1. DevTools → Network tab
2. Navega a "Emitir Formato" 
3. Busca request a /api/comisiones en Network
4. Click en la request
5. Tab "Response"
6. Busca: "ambito_nombre"
```

**✅ SI VES:** Campo `ambito_nombre` con valor (ej: "UCAYALI")  
**❌ SI NO VES:** Campo `ambito_nombre` es NULL o no existe

---

## 4️⃣ TEST RÁPIDO #2: Verificar Dirección en PDF

**Objetivo:** Confirmar que "SIN DIRECCIÓN ASIGNADA" se reemplazó

**Pasos:**
```
1. En modal, haz click en "Anexo 02"
2. Observa el PDF generado
3. Busca línea: "DIRECCIÓN / OFICINA:"
4. Verifica que diga UCAYALI (no "SIN DIRECCIÓN")
```

**✅ SI VES:** "UCAYALI" u otra dirección real  
**❌ SI VES:** "SIN DIRECCIÓN ASIGNADA"

---

## 5️⃣ TEST RÁPIDO #3: Verificar Fecha

**Objetivo:** Confirmar que la fecha es correcta

**Pasos:**
```
1. En PDF, busca la fecha en footer
2. Anota la hora mostrada
3. En DevTools Console, ejecuta:
   console.log('fecha_emision:', formatoCompleto?.fecha_emision);
   console.log('creado_en:', formatoCompleto?.creado_en);
4. Compara las horas
```

**✅ SI VES:** La hora en PDF = hora de `fecha_emision`  
**❌ SI VES:** Hora diferente o usa hora actual

---

## 6️⃣ TEST FINAL: Descargar y Verificar

**Objetivo:** Último test integral

**Pasos:**
```
1. Haz click en "Descargar PDF"
2. Abre el PDF descargado
3. Verifica:
   ✅ Logo aparece
   ✅ Dirección correcta (no SIN DIRECCIÓN)
   ✅ Fecha tiene formato correcto
   ✅ Actividad a Realizar visible
```

---

## 📋 Resumen Rápido

| Test | Busca | Debe Decir | ✅ OK | ❌ FALLA |
|------|-------|-----------|-------|---------|
| Backend | `ambito_nombre` en API response | Un valor (ej: "UCAYALI") | [ ] | [ ] |
| Dirección | "DIRECCIÓN / OFICINA:" en PDF | Nombre real, no "SIN DIRECCIÓN" | [ ] | [ ] |
| Fecha | Fecha en footer PDF | Debe coincidir con `fecha_emision` | [ ] | [ ] |
| Logo | Logo ANA en PDF | Visible en esquina superior | [ ] | [ ] |

---

## ⚠️ SI ALGO FALLA

### Falla en Backend (ambito_nombre no aparece):
```
1. Backend no reiniciado → npm run dev nuevamente
2. Verifica comisionController.js líneas 103-118
3. Busca en backend logs por error SQL
```

### Falla en Dirección (SIN DIRECCIÓN sigue apareciendo):
```
1. Verifica que backend OK (Test 1)
2. F5 para refrescar browser
3. Revisa console.log para errores JS
```

### Falla en Fecha (hora incorrecta):
```
1. Verifica fecha_emision en DevTools Console
2. Busca `fecha_emision` en EmisionFormatos.js
3. Si es null, verifica que BD retorna el campo
```

---

## 🎯 Meta

**Cuando TODOS los tests pasen:**
- ✅ Código listo para producción
- ✅ Todos los bugs resueltos
- ✅ Sistema funcionando correctamente

---

**Tiempo total esperado:** 15-20 minutos  
**Documentación completa:** Ver `CHECKLIST_TESTING_SESION.md` para detalles adicionales

## ¡A PROBAR! 🚀
