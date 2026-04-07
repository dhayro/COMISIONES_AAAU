# 📊 DIAGRAMA DE FLUJO: Campo "Actividad a Realizar"

## 🔄 Ciclo Completo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO EN FRONTEND                         │
│                    (EmisionFormatos.js)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [FORMULARIO CON 2 CAMPOS]
                              ↓
        ┌─────────────────────────┬────────────────────────┐
        │                         │                        │
        v                         v                        v
   NUEVO CAMPO           CAMPO EXISTENTE          CAMPO EXISTENTE
"Actividad a Realizar"    "Observación"          "Otras Propiedades"
(multiline text)         (multiline text)         (select, inputs...)
        │                         │                        │
        └─────────────────────────┴────────────────────────┘
                              ↓
                    [ENVIAR A BACKEND API]
                    POST /api/formato/crear
                    o PUT /api/formato/:id
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               BACKEND - MODELO (FormatoEmision.js)              │
│                                                                  │
│  método crear(datosFormato) {                                  │
│    const { actividad_realizar, observacion, ... } = datosFormato
│                                                                  │
│    INSERT INTO formato_emisiones (                              │
│      actividad_realizar,  ← Nuevo campo                         │
│      observacion,                                               │
│      ...                                                        │
│    ) VALUES (?, ?, ...)                                         │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               BASE DE DATOS (MySQL - formato_emisiones)          │
│                                                                  │
│  ┌──────────┬──────────────┬──────────────┬───────────────┐    │
│  │ id       │ observacion  │actividad_realizar│ ...otros  │    │
│  ├──────────┼──────────────┼──────────────┼───────────────┤    │
│  │ 1        │ Nota adicional│Supervisar   │ ...          │    │
│  │ 2        │ Verificar    │ Evaluar      │ ...          │    │
│  │ 3        │ Pendiente    │ Inspeccionar │ ...          │    │
│  └──────────┴──────────────┴──────────────┴───────────────┘    │
│                                                                  │
│  🔹 Columna: actividad_realizar VARCHAR(500) NULL              │
│  🔹 Posición: AFTER observacion                                │
│  🔹 Estado: ✅ CREADA Y FUNCIONAL                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [USUARIO DESCARGA PDF]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     GENERADOR DE PDFS                            │
│                  (EmisionFormatos.js)                            │
│                                                                  │
│  ANEXO 01 (Formato de Emisión):                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ TABLA DE FORMATOS                                    │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ DESCRIPCIÓN │ ACTIVIDAD A REALIZAR│ OBSERVACIÓN      │      │
│  │─────────────┼────────────────────┼──────────────────│      │
│  │ Comisión XY │ Supervisar obra    │ Verificar gasto  │      │
│  │             │ (de BD)            │ (de BD)          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ANEXO 02 (Información Detallada):                             │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ CAMPO: "Objetivo de la comisión"                    │      │
│  │ VALOR: [actividad_realizar de BD]                   │      │
│  │        "Supervisar obra en progreso"                │      │
│  │                                                      │      │
│  │ CAMPO: "Notas adicionales"                          │      │
│  │ VALOR: [observacion de BD]                          │      │
│  │        "Verificar cumplimiento de especificaciones" │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [PDF GENERADO Y DESCARGADO]
```

---

## 📱 Estados del Formulario

### Estado 1: Crear Nuevo Formato

```
FRONTEND FORM STATE:
{
  actividad_realizar: "",      ← Campo vacío
  observacion: "",             ← Campo vacío
  descripcion: "Comisión a Oruro",
  monto: 1500,
  ...otros campos
}

USUARIO LLENA:
{
  actividad_realizar: "Supervisar avance de obra",
  observacion: "Revisar cumplimiento de plazos",
  descripcion: "Comisión a Oruro",
  monto: 1500,
  ...otros campos
}

BACKEND RECIBE:
INSERT INTO formato_emisiones (
  descripcion, monto, actividad_realizar, observacion, ...
) VALUES (
  "Comisión a Oruro", 1500, "Supervisar avance de obra", "Revisar cumplimiento de plazos", ...
)

BASE DE DATOS GUARDA:
ID  │ descripcion        │ actividad_realizar            │ observacion
───┼────────────────────┼───────────────────────────────┼──────────────────────────
1   │ Comisión a Oruro   │ Supervisar avance de obra     │ Revisar cumplimiento de plazos
```

### Estado 2: Editar Formato Existente

```
USUARIO ABRE FORMULARIO:
✅ Se cargan datos de BD
✅ actividad_realizar: "Supervisar avance de obra"
✅ observacion: "Revisar cumplimiento de plazos"

USUARIO MODIFICA:
actividad_realizar: "Supervisar avance de obra - CON FOTOS"
observacion: "Revisar cumplimiento de plazos - Entrega 2 de 3"

BACKEND ACTUALIZA:
UPDATE formato_emisiones 
SET actividad_realizar = ?, observacion = ?
WHERE id = ?

BASE DE DATOS:
ID  │ descripcion        │ actividad_realizar                  │ observacion
───┼────────────────────┼─────────────────────────────────────┼──────────────────────────
1   │ Comisión a Oruro   │ Supervisar avance de obra - CON... │ Revisar cumplimiento - E...
```

### Estado 3: Generar Reporte

```
USUARIO GENERA ANEXO 01 PDF:
✅ Backend trae datos de BD
✅ actividad_realizar: "Supervisar avance de obra"
✅ observacion: "Revisar cumplimiento de plazos"

PDF MUESTRA:
┌──────────────────────────────────────────────────────────┐
│ DESCRIPCIÓN │ ACTIVIDAD A REALIZAR        │ OBSERVACIÓN │
├──────────────┼────────────────────────────┼─────────────┤
│ Comisión a   │ Supervisar avance de obra  │ Revisar     │
│ Oruro        │                            │ cumpl...    │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Sistema de Migraciones

```
SERVIDOR INICIA:
↓
[Conecta a MySQL]
↓
[Lee carpeta /backend/migrations/]
↓
[Encuentra 3 archivos .sql]
├─ 001_...sql
├─ 002_...sql (tiene DELIMITER → se salta)
└─ 003_agregar_actividad_realizar.sql ← 🎯 NUESTRO
↓
[Ejecuta: ALTER TABLE formato_emisiones ADD COLUMN...]
↓
✅ Migración exitosa - Columna creada
↓
[Servidor continúa y está listo]
```

---

## 📊 Comparativa: Antes vs Después

### ANTES (Sin campo actividad_realizar):

```
FORMULARIO:
┌────────────────────────────────┐
│ Observación:                   │
│ [campo multiline]              │
│                                │
│ Problema: ¿Qué poner aquí?    │
│ - ¿La actividad a realizar?    │
│ - ¿Una observación adicional?  │
│ - ¿Ambas cosas?               │
└────────────────────────────────┘

PDF ANEXO 01:
┌──────────────────────────────────┐
│ ACTIVIDAD A REALIZAR│ OBSERVACIÓN│
├──────────────────────┼──────────┤
│ [¿Confusión?]        │ [Vacío]  │
└──────────────────────────────────┘
```

### DESPUÉS (Con campo actividad_realizar):

```
FORMULARIO:
┌─────────────────────────────────┐
│ Actividad a Realizar:           │
│ [campo multiline]               │
│ Descripción clara de qué        │
│ se hará en la comisión          │
│                                 │
│ Observación:                    │
│ [campo multiline]               │
│ Notas adicionales o comentarios │
└─────────────────────────────────┘

PDF ANEXO 01:
┌──────────────────────────────────────┐
│ ACTIVIDAD A REALIZAR │ OBSERVACIÓN    │
├──────────────────────┼────────────────┤
│ Supervisar obra      │ Ver gastos     │
│                      │ adicionales    │
└──────────────────────────────────────┘
```

---

## 🎯 Campos Mapeados a PDFs

### ANEXO 01

| Tabla → PDF          | Campo Base Datos      | Descripción                  |
|---------------------|----------------------|------------------------------|
| ACTIVIDAD A REALIZAR | `actividad_realizar` | ✅ **NUEVO** - Lo que se hará |
| OBSERVACIÓN          | `observacion`        | ✅ Notas adicionales          |

### ANEXO 02

| Formulario → PDF              | Campo Base Datos      | Descripción                  |
|------------------------------|-----------------------|------------------------------|
| Campo 5: "Objetivo de la..." | `actividad_realizar` | ✅ **NUEVO** - Objetivo      |
| Campo 6: "Notas adicionales" | `observacion`        | ✅ Observaciones             |

---

## ✅ Verificación de Implementación

### BASE DE DATOS
```sql
-- Ejecutar para verificar
DESC formato_emisiones;
-- Buscar estas columnas:
-- ✅ observacion VARCHAR(500)
-- ✅ actividad_realizar VARCHAR(500)  ← NUEVA
```

### FORMULARIO FRONTEND
```
Visible en EmisionFormatos.js:
✅ Línea ~71: formValues.actividad_realizar
✅ Línea ~2660: TextField para "Actividad a Realizar"
✅ Línea ~560: Carga desde BD al editar
✅ Línea ~838: Envío a API
```

### BACKEND
```
Visible en FormatoEmision.js:
✅ Línea ~30: Destructuración de actividad_realizar
✅ Línea ~50: INSERT statement incluye actividad_realizar
✅ Línea ~180: UPDATE statement maneja actividad_realizar
```

### PDFS
```
Visible en EmisionFormatos.js:
✅ Línea ~1815-1820: Anexo 01 - Tabla con columnas
✅ Línea ~1220-1225: Anexo 02 - Campo objetivo
```

---

## 🚀 Cómo Usar (Para Usuarios)

1. **Crear Formato Nuevo:**
   - Abrir "Crear Formato"
   - Llenar "Actividad a Realizar": *Qué se hará en la comisión*
   - Llenar "Observación": *Notas o detalles adicionales*
   - Guardar
   - ✅ Se guarda en BD

2. **Editar Formato:**
   - Abrir formato existente
   - Ambos campos cargan automáticamente
   - Modificar lo necesario
   - Guardar
   - ✅ Se actualiza en BD

3. **Ver en Reportes:**
   - Generar Anexo 01 (PDF)
   - La columna "ACTIVIDAD A REALIZAR" muestra lo que se hará
   - La columna "OBSERVACIÓN" muestra notas adicionales
   - ✅ Información clara y diferenciada

---

## 📈 Métricas de Éxito

| Métrica                              | Estado   |
|--------------------------------------|----------|
| Migración SQL ejecutada              | ✅ Sí    |
| Columna creada en BD                 | ✅ Sí    |
| Frontend formulario actualizado      | ✅ Sí    |
| Backend modelo actualizado           | ✅ Sí    |
| PDFs generan correctamente           | ✅ Sí    |
| Servidor inicia sin errores          | ✅ Sí    |
| Datos persisten en BD                | ✅ Sí    |
| Edición de formulario funciona       | ✅ Sí    |

---

**🎉 ¡TODO FUNCIONAL Y LISTO PARA USAR!**
