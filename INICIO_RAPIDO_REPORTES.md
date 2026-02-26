# 🚀 INICIO RÁPIDO - MÓDULO REPORTES

## ⏱️ Tiempo estimado: 5 minutos

---

## 1️⃣ VERIFICAR INSTALACIÓN (1 minuto)

```bash
# Terminal 1 - Ir a frontend
cd material-dashboard-react

# Verificar build
npm run build
```

✅ **Resultado esperado**: `The build folder is ready to be deployed`

---

## 2️⃣ INICIAR BACKEND (1 minuto)

```bash
# Terminal 2 - Ir a backend
cd backend

# Iniciar servidor
npm start
# O si usas nodemon:
# nodemon server.js
```

✅ **Resultado esperado**: 
```
✅ Servidor ejecutándose en puerto 3001
✅ Base de datos conectada
```

---

## 3️⃣ INICIAR FRONTEND (1 minuto)

```bash
# Terminal 1 o 3 - Desde material-dashboard-react
npm start
```

✅ **Resultado esperado**: 
```
Compiled successfully!
Local: http://localhost:3000
```

---

## 4️⃣ ACCEDER AL MÓDULO (1 minuto)

1. Abrir navegador: **http://localhost:3000**
2. Iniciar sesión con usuario válido
   - Email: user@example.com
   - Password: (la que configuraste)
3. Ir a: **Reportes > Presupuestos**
   *(Nota: Verifica el menú lateral para ubicación exacta)*

---

## 5️⃣ PROBAR FUNCIONALIDAD (1 minuto)

### Opción A: Filtro por Mes
```
1. Seleccionar "Por Mes"
2. Elegir mes (ej: enero 2024)
3. Click "Generar Reporte"
4. Ver tabla con datos
5. Click "Generar PDF" (opcional)
```

### Opción B: Filtro por Rango
```
1. Seleccionar "Por Rango de Fechas"
2. Fecha inicio: 2024-01-01
3. Fecha fin: 2024-12-31
4. Click "Generar Reporte"
5. Ver tabla con datos
6. Click "Generar PDF" (opcional)
```

---

## ✅ CHECKLIST RÁPIDO

- [ ] Frontend compila sin errores
- [ ] Backend inicia correctamente
- [ ] Puedes acceder a la página de reportes
- [ ] Seleccionar filtro funciona
- [ ] Generar reporte llena la tabla
- [ ] Tabla muestra datos correctos
- [ ] Se ven los totales
- [ ] PDF se descarga (opcional)

---

## 📊 Datos Esperados

Si tienes comisiones con presupuesto asignado:
- Deberían aparecer en la tabla
- Los totales deben ser correctos
- El PDF debe incluir toda la información

---

## 🆘 Si Algo Falla

### Error: "Servidor no responde"
```bash
✓ Verificar que backend está en puerto 3001
✓ npm start en carpeta backend
```

### Error: "No hay datos"
```bash
✓ Verificar que existen comisiones con presupuesto ASIGNADO
✓ Que las fechas coincidan con el rango
```

### Error: "Formato de fecha inválido"
```bash
✓ Usar fechas en formato YYYY-MM-DD
✓ Ejemplo: 2024-01-01
```

### PDF no se descarga
```bash
✓ jsPDF debe estar instalado
✓ npm install jspdf jspdf-autotable
```

---

## 📚 Documentación Disponible

Después de verificar funcionalidad:

1. **ARQUITECTURA_MODULO_REPORTES.md** - Diagramas técnicos
2. **GUIA_INTEGRACION_REPORTES.md** - Integración detallada
3. **GUIA_TESTING_REPORTES.md** - Todos los tests
4. **CHECKLIST_FINAL.md** - Verificación completa

---

## 🎯 Siguiente Paso

¿Necesitas hacer cambios?

- **Agregar campos**: Editar `ReportePresupuestos.js` (línea 232-260)
- **Cambiar consulta**: Editar `comisionController.js` (línea 269+)
- **Personalizar PDF**: Editar función `generarPDF()` (línea 104+)

---

## ✨ Estado

✅ **LISTO PARA USAR**

No requiere configuración adicional. Todos los componentes están implementados y compilados.

---

**¡Disfruta tu módulo de reportes! 🎉**

