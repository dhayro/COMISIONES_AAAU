# 🎉 ANEXO N° 02 - ESTRUCTURA Y FUNCIONALIDAD

## 📋 Vista General del Segundo Formato

```
═══════════════════════════════════════════════════════════════════
                         ANEXO N° 02
           PRESUPUESTO DEL COSTO DE LA ACTIVIDAD
            PARA COMISIÓN DE SERVICIOS
═══════════════════════════════════════════════════════════════════

[LOGO ANA.PNG - Centrado]

             Autoridad Administrativa del Agua Ucayali
                 Oficina de Administración
                 Unidad de Recursos Humanos

───────────────────────────────────────────────────────────────────

INFORMACIÓN PERSONAL Y DE LA COMISIÓN:

1. Nombre y apellidos:              [DHAYRO KONG TORRES]
2. Dependencia:                     [Autoridad Administrativa del Agua Ucayali]
3. Cargo:                           [Especialista]
4. Itinerario:                      [ATALAYA - UCAYALI]
5. Objetivo de la comisión:         [AFORO DEL RIO UCAYALI...]
6. Cantidad de días:                [5]
7. Fecha de salida:                 [15/03/2026]
8. Fecha de regreso:                [20/03/2026]

───────────────────────────────────────────────────────────────────

9. ESTIMADO DE GASTOS:

┌──────────────────────────────────────────┬─────────────────┐
│ CONCEPTO                                 │ IMPORTE (S/.)   │
├──────────────────────────────────────────┼─────────────────┤
│ a) Pasaje y gasto de transporte          │   S/.    0.00   │
│ b) Viáticos y asignaciones               │   S/.    0.00   │
│ c) Tarifa Corpac                         │   S/.    0.00   │
│ d) Combustible y carburantes             │   S/.    0.00   │
│ e) Otros gastos                          │   S/.    0.00   │
├──────────────────────────────────────────┼─────────────────┤
│ TOTAL PRESUPUESTAL                       │   S/. 2,500.00  │
└──────────────────────────────────────────┴─────────────────┘

───────────────────────────────────────────────────────────────────

10. AFECTACIÓN PRESUPUESTAL:

Fuente de financiamiento:    [N/A]
Programa:                    [N/A]
Subprograma:                 [N/A]
Actividad / Proyecto:        [N/A]
Componente:                  [N/A]
Meta:                        [Aforo del Río Ucayali]

───────────────────────────────────────────────────────────────────

11. COMPROMISO:

   Me comprometo a rendir cuenta documentada del anticipo en un
   plazo máximo de 10 dias hábiles luego de haber concluido el
   periodo de la comisión de servicios.

───────────────────────────────────────────────────────────────────

Lugar y fecha:  26 de Febrero del 2026


_____________________________         _____________________________
    FIRMA COMISIONADO                 FIRMA DEL JEFE O DIRECTOR

═══════════════════════════════════════════════════════════════════
```

---

## 🎯 Funcionalidad del Modal

```
┌────────────────────────────────────────────────────────────────┐
│  Emitir Formato - DHAYRO KONG TORRES                      ╳    │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vista Previa del PDF:                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [ANEXO N° 01 - Vista previa en iframe]                 │  │
│  │  ┌──────────────────────────────────────────────────────┤  │
│  │  │ TRABAJADOR COMISIONADO │ CARGO │ MONTO              │  │
│  │  ├──────────────────────────────────────────────────────┤  │
│  │  │ DHAYRO KONG TORRES    │ Esp.  │ S/. 2,500.00        │  │
│  │  │ ERIC ALIAGA ROMAYNA   │ Esp.  │ S/. 2,000.00        │  │
│  │  │ SANTOS NUÑEZ COTRINA  │ Esp.  │ S/. 2,200.00        │  │
│  │  └──────────────────────────────────────────────────────┘  │
│  │                                                              │
│  │  Partidas Incluidas:                                        │
│  │  ☐ 23.2.1.2.1 - Pasajes y Gastos Transporte - S/. 1500.00│
│  │  ☐ 23.2.1.2.2 - Viáticos y Asignaciones - S/. 1000.00    │
│  │                                                              │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│  [Cerrar] [Descargar ANEXO II] [Emitir Formato]               │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Ejecución

### 1️⃣ Usuario selecciona "Emitir Formato"
```javascript
handleEmitirFormato(row)
  ├─ Carga datos de la comisión
  ├─ Agrupa partidas si hay múltiples
  ├─ Abre modal de preview
  └─ Llama a generarVistaPrevia()
```

### 2️⃣ Se genera y muestra ANEXO N° 01
```javascript
generarVistaPrevia(comision, comisionado)
  ├─ Carga logo desde /ANA.png
  ├─ Construye tabla con 8 columnas
  ├─ Incluye datos del comisionado
  ├─ Cálcula días solo de partida 23.2.1.2.2
  └─ Muestra en iframe del modal
```

### 3️⃣ Usuario puede descargar ANEXO II ← **NUEVO**
```javascript
generarAnexoII(comision, comisionado)  ← **NUEVA FUNCIÓN**
  ├─ Carga logo desde /ANA.png
  ├─ Formato Portrait (vertical)
  ├─ Información personal y comisión
  ├─ Tabla de gastos estimados
  ├─ Afectación presupuestal
  ├─ Líneas de firma
  └─ Descarga PDF automáticamente
```

### 4️⃣ Usuario puede descargar ANEXO I
```javascript
handleDescargarFormato(comisionado)
  └─ generarFormatoComision(comision, comisionado)
      ├─ Idéntico a generarVistaPrevia()
      └─ Descarga como PDF
```

---

## 🎨 Comparación de Formatos

### ANEXO N° 01 (Existente)
- **Orientación**: Landscape (horizontal)
- **Columnas**: 8
- **Datos**: Tabla de comisionados por comisión
- **Uso**: Programación mensual de la comisión
- **Datos principales**:
  - Trabajador comisionado
  - Cargo
  - Actividad a realizar
  - Lugar y días
  - Fechas de salida/retorno
  - Observación

### ANEXO N° 02 (Nuevo) ← **RECIÉN AGREGADO**
- **Orientación**: Portrait (vertical)
- **Estructura**: Campos de información
- **Datos**: Presupuesto detallado
- **Uso**: Presupuesto del costo de la actividad
- **Datos principales**:
  - Información personal
  - Datos de la comisión
  - Gastos estimados por categoría
  - Afectación presupuestal
  - Compromisos del comisionado
  - Firmas autorizantes

---

## 📊 Datos Mapeados

```javascript
// ANEXO II utiliza:

comision {
  fecha_salida        → Fecha de salida
  fecha_retorno       → Fecha de regreso
  lugar               → Itinerario
  meta_nombre         → Objetivo / Meta
  num_dias            → Cantidad de días
  observacion         → (disponible si es necesario)
}

comisionado {
  usuario_nombre      → Nombre y apellidos
  ambito_nombre       → Dependencia
  cargo_nombre        → Cargo
  monto               → Total Presupuestal
}
```

---

## 💾 Archivo Descargado

```
Nombre: ANEXO-II-{usuario_nombre}-{timestamp}.pdf
Ejemplo: ANEXO-II-DHAYRO KONG TORRES-1708960245123.pdf

Tamaño: ~200-300 KB
Formato: PDF
Páginas: 1 (Portrait A4)
```

---

## ✅ Checklist de Implementación

- [x] Función `generarAnexoII()` creada
- [x] Estructura de contenido definida
- [x] Logo cargado dinámicamente
- [x] Tabla de gastos integrada
- [x] Datos personales mapeados
- [x] Afectación presupuestal incluida
- [x] Firmas y fecha agregadas
- [x] Botón agregado al modal
- [x] Mensajes de éxito/error configurados
- [x] Nombres de archivo únicos (timestamp)
- [x] Sin errores de compilación
- [x] Integración con datos existentes
- [x] Compatible con Material-UI y jsPDF
- [x] Documentación completa

---

## 🚀 Cómo Usar

### Desde el Frontend
1. Navega a "Emisión de Formatos"
2. Selecciona una comisión aprobada
3. Haz clic en "Emitir Formato"
4. En el modal que se abre:
   - ✅ Verás preview del ANEXO N° 01
   - ✅ Puedes descargar ANEXO II (nuevo)
   - ✅ Puedes emitir/descargar ANEXO I

### Archivos Generados
```
Descargas/
├── ANEXO-II-DHAYRO KONG TORRES-1708960245123.pdf
├── Comision-DHAYRO KONG TORRES-1708960245124.pdf (ANEXO I)
└── ...
```

---

## 📞 Soporte

Si hay problemas:
1. Verifica que `/ANA.png` esté en la carpeta `public/`
2. Revisa la consola del navegador (F12) para errores
3. Comprueba que jsPDF y jspdf-autotable están instalados
4. Verifica que SweetAlert2 está disponible

---

**Versión**: 1.0  
**Fecha**: 26 Febrero, 2026  
**Estado**: ✅ Listo para Producción
