# 📖 GUÍA PRÁCTICA: USO DEL MÓDULO CERTIFICACIONES DE CRÉDITO

## 👤 Rol Requerido
- **Gestor de Presupuesto**
- **Administrador del Sistema**

## 🎯 Caso de Uso Ejemplo

### Escenario
Necesitas registrar una **Certificación de Crédito Presupuestario** para la Meta "Mejora de Infraestructura Hídrica" con asignación en múltiples clasificadores presupuestarios.

---

## 📝 PASO A PASO: Crear una Certificación

### 1️⃣ Acceder al Módulo
```
Menú → Gestión → Certificaciones de Crédito
```

### 2️⃣ Hacer Clic en "Nueva Certificación"
```
┌─ Botón [+] Nueva Certificación
└─ Se abre el modal de creación
```

### 3️⃣ Completar Formulario Principal

**Campos Obligatorios:**

| Campo | Ejemplo | Formato |
|-------|---------|---------|
| **Nota** | Certificación mes de marzo | Texto libre |
| **Mes** | 2024-03 | YYYY-MM |
| **Tipo Documento** | Certificación | Texto |
| **N° Documento** | CERT-2024-001 | Alpanumérico (único) |

**Campos Opcionales:**

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| Fecha Aprobación | 2024-03-15 | Cuando fue aprobada |
| Fecha Documento | 2024-03-20 | Fecha del documento |
| Estado | PENDIENTE | PENDIENTE/APROBADA/RECHAZADA |
| Justificación | Justificación del gasto | Puede ser largo |
| Meta | Mejora Infraestructura | Seleccionar de lista |
| Fuente Financiamiento | Canon Minero | Seleccionar de lista |

### 4️⃣ Guardar Certificación Principal
```
Botón [Crear]
↓
Confirmación: "Certificación creada exitosamente"
↓
Se cierra modal y aparece en tabla
```

---

## 📊 PASO A PASO: Agregar Detalles

### 1️⃣ Identificar Certificación Creada
```
En la tabla principal, buscar la certificación que acabas de crear
Ejemplo: CERT-2024-001
```

### 2️⃣ Hacer Clic en "Agregar Detalles" 🔗
```
┌─ Botón [🔗] en columna Acciones
└─ Se abre modal de detalles
```

### 3️⃣ Agregar Primer Clasificador

**Seleccionar Clasificador:**
```
Dropdown "Clasificador"
↓
Seleccionar: "23.2.1.2.2 - Viáticos y asignaciones por comisión"
```

**Ingresar Monto:**
```
Campo "Monto"
↓
Ingresar: 5000.00
```

**Agregar:**
```
Botón [Agregar]
↓
El detalle aparece en la tabla inferior
```

### 4️⃣ Agregar Más Clasificadores (Opcional)

```
Repetir pasos 3:

Detalle 2:
- Clasificador: "23.1.1.1.1 - Servicios Personales"
- Monto: 3000.00

Detalle 3:
- Clasificador: "23.1.2.1.1 - Materiales"
- Monto: 2000.00
```

### 5️⃣ Verificar Total Automático

```
La tabla muestra:
┌────────────────────────────────────────┐
│ Clasificador        │ Partida │ Monto  │
├────────────────────────────────────────┤
│ Viáticos...         │ 23.2.1  │ 5000.00│
│ Servicios Personales│ 23.1.1  │ 3000.00│
│ Materiales          │ 23.1.2  │ 2000.00│
├────────────────────────────────────────┤
│                          TOTAL: 10000.00│
└────────────────────────────────────────┘
```

### 6️⃣ Cerrar Modal
```
Botón [Cerrar]
↓
Modal se cierra
↓
Certificación aparece en tabla con todos sus detalles
```

---

## ✏️ PASO A PASO: Editar Certificación

### 1️⃣ Localizar Certificación
```
En la tabla principal, buscar por:
- Nota
- N° Documento
- Estado
- Usar búsqueda integrada
```

### 2️⃣ Hacer Clic en "Editar" ✏️
```
┌─ Botón [✏️] en columna Acciones
└─ Se abre modal con datos precargados
```

### 3️⃣ Modificar Campos
```
Cambiar los valores que necesites:
- Nota
- Estado (ej: PENDIENTE → APROBADA)
- Justificación
- Meta
- Fuente Financiamiento
- Fechas
```

### 4️⃣ Guardar Cambios
```
Botón [Actualizar]
↓
Confirmación: "Certificación actualizada exitosamente"
↓
Tabla se actualiza automáticamente
```

---

## 🗑️ PASO A PASO: Eliminar

### Eliminar Detalle

```
En el modal de detalles:

Localizar el detalle a eliminar
↓
Botón [🗑️] en la fila
↓
Confirmación: "¿Está seguro?"
↓
[Sí, eliminar]
↓
"Detalle eliminado correctamente"
```

### Eliminar Certificación Completa

```
En la tabla principal:

Localizar la certificación
↓
Botón [🗑️] en columna Acciones
↓
Confirmación: "¿Está seguro? No podrá revertir"
↓
[Sí, eliminar]
↓
"Certificación eliminada correctamente"
↓
Se elimina en cascada con todos sus detalles
```

---

## 🔍 PASO A PASO: Filtrar Certificaciones

### Por Meta
```
1. Ir a tabla principal
2. Campo de búsqueda o filtro (si existe)
3. Buscar por nombre de meta: "Mejora Infraestructura"
```

### Por Estado
```
Si existe dropdown de filtro:
1. Seleccionar estado: "APROBADA"
2. Tabla se actualiza automáticamente
```

### Por Mes
```
Si existe dropdown de filtro:
1. Seleccionar mes: "2024-03"
2. Tabla se actualiza automáticamente
```

---

## 📋 VALIDACIONES QUE DEBE CONOCER

### ❌ Errores Comunes

**Error: "Faltan campos obligatorios"**
```
Causa: No llenaste nota, mes, tipo_documento o numero_documento
Solución: Verifica que todos los campos requeridos estén completos
```

**Error: "N° Documento ya existe"**
```
Causa: El número de documento ya está registrado
Solución: Usa un número único, ej: CERT-2024-002
```

**Error: "Falta seleccionar Clasificador"**
```
Causa: En detalles, no seleccionaste clasificador
Solución: Elige un clasificador del dropdown
```

**Error: "Monto debe ser número positivo"**
```
Causa: Ingresaste número negativo o inválido
Solución: Usa números positivos, ej: 5000.00
```

---

## 💡 CONSEJOS Y BUENAS PRÁCTICAS

### ✅ Recomendaciones

1. **Usar códigos consistentes para N° Documento**
   ```
   Formato: CERT-YYYY-NNN
   Ejemplo: CERT-2024-001, CERT-2024-002
   ```

2. **Especificar Meta cuando sea posible**
   ```
   Ayuda a auditoría y tracking de presupuesto
   ```

3. **Completar Justificación siempre**
   ```
   Facilita auditoría y seguimiento
   ```

4. **Usar Estado correcto**
   ```
   PENDIENTE: En revisión
   APROBADA: Validada
   RECHAZADA: No aprobada
   ```

5. **Agregar todos los clasificadores necesarios**
   ```
   No dejar montos sin clasificador
   ```

---

## 📊 EJEMPLO COMPLETO DE CERTIFICACIÓN

### Certificación: "CERT-2024-001"

**Datos Principales:**
```
Nota:                  "Certificación presupuestal marzo 2024"
Mes:                   "2024-03"
Fecha Aprobación:      "2024-03-15"
Fecha Documento:       "2024-03-20"
Estado:                "APROBADA"
Tipo Documento:        "Certificación de Crédito"
N° Documento:          "CERT-2024-001"
Justificación:         "Gastos operativos aprobados por gerencia"
Meta:                  "Mejora de Infraestructura Hídrica"
Fuente Financiamiento: "Canon Minero"
```

**Detalles (Clasificadores y Montos):**
```
1. Viáticos y asignaciones (23.2.1.2.2)        → S/. 5,000.00
2. Servicios Personales (23.1.1.1.1)            → S/. 3,500.00
3. Materiales y suministros (23.1.2.1.1)        → S/. 2,000.00
4. Servicios generales (23.1.3.1.1)             → S/. 1,500.00
                                                 ─────────────
                                      TOTAL:     S/. 12,000.00
```

---

## 🎓 PREGUNTAS FRECUENTES (FAQ)

**P: ¿Puedo editar detalles después de crearlos?**
A: No directamente. Debes eliminar y crear uno nuevo.

**P: ¿Qué pasa si elimino una certificación?**
A: Se elimina la certificación Y todos sus detalles automáticamente.

**P: ¿Puedo agregar el mismo clasificador dos veces?**
A: No, el sistema lo previene con una restricción única.

**P: ¿Qué formatos acepta el monto?**
A: Números decimales (máx 15 dígitos, 2 decimales). Ej: 5000.50

**P: ¿Debo llenar todos los campos opcionales?**
A: No, solo los marcados como "Obligatorios" son necesarios.

**P: ¿Cómo calcula el total?**
A: Automáticamente suma todos los montos de los detalles.

---

## 🔄 FLUJO TÍPICO DE TRABAJO

```
1. Recibir solicitud de certificación
   ↓
2. Crear certificación principal
   ├─ Nota
   ├─ Mes
   ├─ Tipo/Número de documento
   └─ Guardar
   ↓
3. Agregar detalles (clasificadores)
   ├─ Seleccionar clasificador
   ├─ Ingresar monto
   ├─ Agregar
   └─ Repetir para todos
   ↓
4. Actualizar estado según aprobación
   ├─ PENDIENTE → APROBADA (si se aprueba)
   ├─ PENDIENTE → RECHAZADA (si se rechaza)
   └─ Guardar
   ↓
5. Usar en reportes y auditoría
```

---

## 🚨 ERRORES A EVITAR

❌ **NO:**
- Dejar certificaciones sin detalles
- Usar números de documento duplicados
- Agregar montos incorrectos sin revisar
- Olvidar cambiar estado cuando se aprueba

✅ **SÍ:**
- Revisar datos antes de guardar
- Usar números únicos y consistentes
- Calcular bien los montos
- Actualizar estados según el proceso

---

## 📞 NECESITAS AYUDA?

1. **Error en la aplicación?**
   → Revisar consola del navegador (F12)
   → Reiniciar la aplicación

2. **¿Datos no se guardan?**
   → Verificar conexión a internet
   → Revisar que no haya campos obligatorios vacíos

3. **¿No ves la opción de certificaciones?**
   → Verificar permisos de usuario
   → Contactar administrador

4. **¿Necesitas reportes de certificaciones?**
   → Solicitar a equipo de desarrollo
   → Datos están en BD para análisis

---

**Última actualización:** 2026-03-13
**Versión:** 1.0
**Autor:** Sistema COMISIONES_AAAU
