# 📖 GUÍA RÁPIDA DE USO - MENÚ Y CHECKBOX

## Acceder al Módulo de Reportes

### 🔴 ANTES (Complicado)
```
❌ Copiar URL directa
❌ Pegar en navegador
❌ No hay acceso desde menú
```

### 🟢 AHORA (Fácil)
```
✅ Haz clic en menú lateral
✅ Busca: "Presupuestos Asignados"
✅ ¡Listo!
```

---

## Paso a Paso

### 1️⃣ Abre el Navegador
```
URL: http://localhost:3000
```

### 2️⃣ Inicia Sesión
```
Email: tu_email@example.com
Password: tu_contraseña
```

### 3️⃣ Busca en el Menú Lateral
```
┌─────────────────────────────┐
│ ☰ COMISIONES AAAU          │
├─────────────────────────────┤
│ 📊 Dashboard                │
│ 📋 Gestión                  │
│ 📈 Reportes                 │← Nueva sección
│  └─ Presupuestos Asignados  │← Nuevo link
│ 🔧 Otros                    │
└─────────────────────────────┘
      ↑
   Haz clic aquí
```

### 4️⃣ Verifica el Checkbox
```
La página se abre con:

☑️  Solo mostrar PRESUPUESTOS ASIGNADOS
    ↑ Por defecto está MARCADO

Esto significa:
✅ Solo ves ASIGNADOS
✅ Tabla más limpia
```

### 5️⃣ Selecciona el Período
```
OPCIÓN A - Por Mes:
┌──────────────────┐
│ Tipo de Filtro   │
│ [Por Mes ▼]      │
│ [2024-02]        │← Selecciona mes
└──────────────────┘

OPCIÓN B - Por Rango:
┌──────────────────┐
│ Tipo de Filtro   │
│ [Por Rango ▼]    │
│ Inicio: [2024-01-01]
│ Fin:    [2024-02-28]
└──────────────────┘
```

### 6️⃣ Generar Reporte
```
Haz clic en: [Generar Reporte]

El sistema:
✅ Consulta la BD
✅ Filtra solo ASIGNADOS (porque checkbox está marcado)
✅ Llena la tabla
✅ Calcula totales
```

### 7️⃣ Ver Tabla
```
┌─────────────────────────────────────────┐
│ ID │ Ámbito │ Lugar │ Documento │ Monto │
├─────────────────────────────────────────┤
│ 1  │ SCTM   │ S.D.  │ RD123/24  │10,000 │
│ 2  │ Otro   │ SGO   │ RES456/24 │15,000 │
└─────────────────────────────────────────┘

Total Comisiones: 2
Monto Total: S/. 25,000.00
```

---

## Usando el Checkbox

### ☑️ MARCADO (Por Defecto)
```
✅ Solo PRESUPUESTOS ASIGNADOS
✅ Tabla más limpia
✅ Recomendado para la mayoría

Resultado: Menos registros, solo lo importante
```

### ☐ DESMARCADO
```
✅ Todos (ASIGNADOS + POR ASIGNAR)
✅ Vista completa
✅ Para revisión detallada

Resultado: Más registros, visión total
```

### Cambiar de Filtro
```
1. Desmarca el checkbox
   ☐ (era ☑️)

2. Haz clic "Generar Reporte"

3. Verás más registros en la tabla
   (aparecen los POR ASIGNAR también)

4. Los totales se recalculan
   (incluyen ambos estados)
```

---

## Exportar a PDF

### Paso 1
```
Haz clic en: [Generar PDF]
```

### Paso 2
```
El sistema genera un PDF con:
✅ Encabezado personalizado
✅ Tabla de datos
✅ Totales
✅ Numeración de páginas
```

### Paso 3
```
PDF se descarga automáticamente:
📥 Reporte_Presupuestos_[timestamp].pdf
```

### Paso 4
```
Abre el PDF en tu lector favorito
(Excel, Word, imprime, etc.)
```

---

## Búsqueda y Filtros Adicionales

### En la Tabla
```
Buscar: [_______]  ← Escribe para buscar
                     (busca en todas las columnas)

Paginación: [< 1 2 3 >]  ← Navega entre páginas

Ordenamiento: Click en encabezado de columna
             (↑ Ascendente, ↓ Descendente)
```

---

## Combinación de Filtros

### Caso 1: Solo un mes específico
```
Tipo: Por Mes
Mes: [2024-01]
Checkbox: ☑️ (solo asignados)
[Generar Reporte]
→ Solo ASIGNADOS de enero 2024
```

### Caso 2: Rango con todos
```
Tipo: Por Rango
Inicio: [2024-01-01]
Fin: [2024-12-31]
Checkbox: ☐ (todos)
[Generar Reporte]
→ TODOS (asignados + por asignar) de 2024
```

### Caso 3: Buscar específico
```
Generar reporte normal
Luego en tabla: Buscar [SCTM]
→ Solo muestra registros con "SCTM"
```

---

## Mensajes Informativos

### Cuando no hay datos
```
☑️ MARCADO (solo asignados):
"No hay presupuestos ASIGNADOS en este período"

☐ DESMARCADO (todos):
"No hay presupuestos en este período"
```

### Cuando genera OK
```
Tabla se llena automáticamente
Totales se muestran debajo
Mensaje éxito: SweetAlert (temporal)
```

### Si hay error
```
Error en la solicitud:
- Mensaje detallado aparece arriba
- Revisa parámetros de fecha
- Verifica conexión al servidor
```

---

## Tips y Trucos

### ⚡ Rápido
```
1. Abre desde menú
2. Deja checkbox marcado (default)
3. Genera reporte
4. ¡Listo!
```

### 🔍 Profundo
```
1. Desmarca checkbox
2. Genera con "Por Rango"
3. Usa búsqueda en tabla
4. Ordena columnas
5. Combina filtros
```

### 📥 Exportar
```
1. Genera reporte
2. Haz clic PDF
3. Se descarga automáticamente
4. Abre en tu programa favorito
```

### 🔄 Cambiar filtro
```
1. Modifica fechas o mes
2. Haz clic checkbox
3. [Generar Reporte] nuevamente
4. Tabla se actualiza
```

---

## Solución de Problemas

### P: No veo el menú "Presupuestos Asignados"
```
A: Asegúrate de:
   ✅ Haber iniciado sesión
   ✅ Estar en localhost:3000
   ✅ El servidor esté corriendo
   ✅ Actualiza la página (F5)
```

### P: El checkbox no funciona
```
A: Intenta:
   ✅ Generar reporte nuevamente
   ✅ Actualizar página (F5)
   ✅ Verificar consola (F12)
```

### P: La tabla está vacía
```
A: Verifica:
   ✅ Existen comisiones con presupuesto ASIGNADO
   ✅ Las fechas coinciden con el período
   ✅ El checkbox está marcado (si quieres solo asignados)
```

### P: No me descarga el PDF
```
A: Revisa:
   ✅ Pop-ups bloqueados (permite descargas)
   ✅ Carpeta Descargas (busca el archivo)
   ✅ Espacio en disco (necesita al menos 5 MB)
```

---

## Atajos Útiles

```
Acceso rápido:
http://localhost:3000/reportes/presupuestos

Abrir consola:
F12

Actualizar página:
Ctrl + R (o F5)

Buscar en página:
Ctrl + F

Imprimir página:
Ctrl + P
```

---

## Resumen

| Acción | Resultado |
|---|---|
| Haz clic menú → "Presupuestos Asignados" | 📍 Abre página |
| ☑️ Checkbox MARCADO + [Generar] | 📊 Solo ASIGNADOS |
| ☐ Checkbox DESMARCADO + [Generar] | 📊 Todos |
| Haz clic [Generar PDF] | 📥 Descarga PDF |
| Escribe en búsqueda | 🔍 Filtra tabla |
| Click columna | ⬆️⬇️ Ordena |

---

## ✨ ¡Ya Estás Listo!

Ahora puedes:
1. ✅ Acceder rápido desde el menú
2. ✅ Filtrar solo ASIGNADOS
3. ✅ Ver tabla limpia
4. ✅ Generar reportes
5. ✅ Exportar a PDF
6. ✅ Usar filtros avanzados

**¡Disfruta del módulo de reportes!** 🎉

