# ✅ PLAN DE PRUEBAS: Campo "Actividad a Realizar"

**Fecha:** 23 de Marzo, 2026  
**Objetivo:** Validar que el campo `actividad_realizar` funciona correctamente en toda la aplicación

---

## 🧪 Prueba 1: Verificar Base de Datos

### Pasos:
1. Abrir MySQL Workbench o tu cliente MySQL favorito
2. Conectar a base de datos `comisiones_aaau`
3. Ejecutar comando:
```sql
DESCRIBE formato_emisiones;
```

### Resultado Esperado:
```
Field                  | Type         | Null | Key | Default
─────────────────────────────────────────────────────────────
...
observacion           | varchar(500) | YES  |     | NULL
actividad_realizar    | varchar(500) | YES  |     | NULL  ← ✅ DEBE APARECER
...
```

### Verificación: ✅ ◻️

---

## 🧪 Prueba 2: Crear Nuevo Formato (Crear)

### Pasos:
1. Ir a la aplicación web
2. Acceder a módulo de Emisión de Formatos
3. Hacer clic en botón "Crear Formato" (o similar)
4. **IMPORTANTE**: Verificar que aparece el campo "Actividad a Realizar"
5. Llenar el formulario:
   - **Actividad a Realizar:** "Supervisión de calidad en obra civil"
   - **Observación:** "Revisar cumplimiento de plazos y especificaciones técnicas"
   - Otros campos: Llenar normalmente
6. Guardar

### Resultado Esperado:
- ✅ Formulario acepta el texto en ambos campos
- ✅ No hay errores de validación
- ✅ Se muestra mensaje de éxito
- ✅ Aparece el nuevo formato en la tabla

### Verificación: ✅ ◻️

### Validar en Base de Datos:
```sql
SELECT id, descripcion, actividad_realizar, observacion 
FROM formato_emisiones 
ORDER BY id DESC 
LIMIT 1;
```

Debe mostrar:
- `actividad_realizar`: "Supervisión de calidad en obra civil"
- `observacion`: "Revisar cumplimiento de plazos y especificaciones técnicas"

### Verificación BD: ✅ ◻️

---

## 🧪 Prueba 3: Editar Formato (Update)

### Pasos:
1. Ir a la tabla de Formatos
2. Hacer clic en "Editar" del formato creado en Prueba 2
3. Verificar que se cargan ambos campos:
   - Campo "Actividad a Realizar" debe mostrar: "Supervisión de calidad..."
   - Campo "Observación" debe mostrar: "Revisar cumplimiento..."
4. Modificar el contenido:
   - **Actividad a Realizar:** "Supervisión de calidad - REVISIÓN COMPLETA"
   - **Observación:** "Revisar cumplimiento - 2da visita"
5. Guardar cambios

### Resultado Esperado:
- ✅ Ambos campos cargan correctamente
- ✅ Puedes modificar cada uno independientemente
- ✅ Se muestra mensaje de éxito
- ✅ Los cambios se reflejan inmediatamente

### Verificación: ✅ ◻️

### Validar en Base de Datos:
```sql
SELECT id, descripcion, actividad_realizar, observacion 
FROM formato_emisiones 
WHERE id = [ID_DEL_FORMATO];
```

Debe mostrar valores actualizados.

### Verificación BD: ✅ ◻️

---

## 🧪 Prueba 4: Generar PDF Anexo 01

### Pasos:
1. Ir a la tabla de Formatos
2. Buscar el formato editado en Prueba 3
3. Hacer clic en botón "Ver Anexo 01" o "Descargar PDF Anexo 01"
4. Esperar a que se genere el PDF
5. Descargar o abrir en navegador
6. **IMPORTANTE**: Buscar la tabla con columnas

### Resultado Esperado (en PDF):
```
┌─────────────────────────────────────────────────────────────┐
│ Descripción │ ACTIVIDAD A REALIZAR              │ OBSERVACIÓN│
├─────────────┼──────────────────────────────────┼─────────────┤
│ [Desc...]   │ Supervisión de calidad - REVISIÓN│ Revisar     │
│             │ COMPLETA                         │ cumpl. - 2da│
│             │                                  │ visita      │
└─────────────────────────────────────────────────────────────┘
```

**Lo importante:**
- ✅ Columna "ACTIVIDAD A REALIZAR" debe tener el valor correcto
- ✅ Columna "OBSERVACIÓN" debe ser diferente y tener el otro valor
- ✅ NO deben ser iguales
- ✅ NO deben estar vacíos si se llenaron en el formulario

### Verificación: ✅ ◻️

---

## 🧪 Prueba 5: Generar PDF Anexo 02

### Pasos:
1. Ir a la tabla de Formatos
2. Buscar el mismo formato
3. Hacer clic en botón "Ver Anexo 02" o "Descargar PDF Anexo 02"
4. Esperar a que se genere el PDF
5. Abrir y revisar campos

### Resultado Esperado (en PDF):
Debe haber un campo como:
```
Campo: "Objetivo de la comisión" o "Objetivo"
Valor: "Supervisión de calidad - REVISIÓN COMPLETA"
       [Es decir, el valor de actividad_realizar]
```

Y otro campo:
```
Campo: "Notas adicionales" o similar
Valor: "Revisar cumplimiento - 2da visita"
       [Es decir, el valor de observacion]
```

**Lo importante:**
- ✅ Los campos aparecen correctamente
- ✅ El contenido corresponde al formulario
- ✅ No están vacíos

### Verificación: ✅ ◻️

---

## 🧪 Prueba 6: Validar Datos Persistidos

### Pasos:
1. Hacer logout de la aplicación
2. Cerrar navegador (opcional)
3. Volver a abrir la aplicación
4. Ir a la tabla de Formatos
5. Hacer clic en "Editar" del mismo formato

### Resultado Esperado:
- ✅ Los campos cargan nuevamente con los valores guardados
- ✅ "Actividad a Realizar": "Supervisión de calidad - REVISIÓN COMPLETA"
- ✅ "Observación": "Revisar cumplimiento - 2da visita"
- ✅ Los datos persisten correctamente en BD

### Verificación: ✅ ◻️

---

## 🧪 Prueba 7: Prueba de Campos Vacíos

### Pasos:
1. Crear un nuevo formato
2. Dejar el campo "Actividad a Realizar" VACÍO
3. Llenar "Observación" con algún texto
4. Guardar
5. Generar PDF Anexo 01

### Resultado Esperado:
- ✅ El sistema permite guardar con campo vacío (es nullable)
- ✅ En PDF, la columna "ACTIVIDAD A REALIZAR" aparece vacía o con guión
- ✅ La columna "OBSERVACIÓN" muestra el texto

### Verificación: ✅ ◻️

---

## 🧪 Prueba 8: Validar Interfaz de Usuario

### Pasos:
Abrir formulario de Crear/Editar Formato

### Verificaciones Visuales:
- ✅ Campo "Actividad a Realizar" es visible
- ✅ Tiene etiqueta clara "Actividad a Realizar"
- ✅ Tiene placeholder descriptivo
- ✅ Es multiline (puede escribir varias líneas)
- ✅ Campo "Observación" sigue siendo visible
- ✅ Ambos campos son independientes
- ✅ No hay conflictos visuales o superpuestos

### Verificación: ✅ ◻️

---

## 📋 Checklist de Validación Completa

### Frontend
- ✅ Campo aparece en formulario Crear
- ✅ Campo aparece en formulario Editar
- ✅ Carga valor cuando se edita
- ✅ Acepta cambios
- ✅ Se envía al backend
- ✅ Label e input son correctos

### Backend
- ✅ API recibe `actividad_realizar`
- ✅ API almacena en BD en creación
- ✅ API actualiza en BD en edición
- ✅ No hay errores en logs
- ✅ Respuesta OK (200/201)

### Base de Datos
- ✅ Columna existe
- ✅ Tipo de datos correcto (VARCHAR 500)
- ✅ Permite NULL
- ✅ Está en posición correcta (AFTER observacion)
- ✅ Los datos persisten correctamente
- ✅ Ediciones se guardan

### PDFs
- ✅ Anexo 01: Tabla muestra columna separada
- ✅ Anexo 01: Valores correctos en cada columna
- ✅ Anexo 02: Campo objetivo muestra actividad_realizar
- ✅ Anexo 02: Campo notas muestra observacion
- ✅ No hay mezcla de datos

### Sistema de Migraciones
- ✅ Se ejecutó automáticamente en startup
- ✅ Logs muestran "✅ Migración ejecutada"
- ✅ No hay errores en servidor
- ✅ Servidor se inicia normalmente

---

## 🎯 Resumen Esperado

Al completar TODAS las pruebas, deberías ver:

✅ Campo "Actividad a Realizar" en todos los formularios  
✅ Datos se guardan y recuperan correctamente  
✅ PDFs muestran valores diferenciados  
✅ Base de datos tiene la columna funcional  
✅ Sistema de migraciones funcionando  
✅ Sin errores en navegador o servidor  

---

## ⚠️ Si Algo Falla

Si encuentras problema en alguna prueba:

1. **Revisa los logs del servidor** (`npm run dev`)
   - Busca mensajes de error MySQL
   - Busca mensajes de error en la API

2. **Verifica la consola del navegador** (F12)
   - Busca errores en Network (peticiones a API)
   - Busca errores en Console

3. **Valida base de datos**
   ```sql
   SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_NAME = 'formato_emisiones' 
   AND COLUMN_NAME = 'actividad_realizar';
   ```
   Debe devolver 1 fila.

4. **Reinicia servidor**
   ```bash
   # Detener Ctrl+C
   # Reiniciar
   npm run dev
   ```

---

## 📞 Contacto para Soporte

Si encuentras problemas durante las pruebas:
- Revisar logs en terminal
- Verificar conexión a MySQL
- Confirmar que migración se ejecutó
- Reiniciar servidor y navegador

---

**¡Esperamos que todas las pruebas pasen! 🎉**

Fecha de Validación: ________________  
Realizado por: ____________________  
Estado Final: ✅ EXITOSA / ❌ CON PROBLEMAS

