## ✅ CHECKLIST DE IMPLEMENTACIÓN - Almacenamiento de PDFs

**Versión:** 1.1  
**Fecha:** 2026-03-14  
**Componentes:** Backend + Frontend + BD

---

### 📋 PRE-REQUISITOS
- [ ] Node.js 14+ instalado
- [ ] MySQL 5.7+ con BD COMISIONES_AAAU
- [ ] React 18+ funcionando
- [ ] Express.js en backend
- [ ] Multer instalado en backend (npm install multer)

---

### 🔧 CAMBIOS EN BASE DE DATOS

#### Opción A: Nueva Instalación
- [ ] Ejecutar `backend/config/schema-certificaciones.sql`
- [ ] Las nuevas columnas se crean automáticamente

#### Opción B: Actualizar BD Existente
```bash
cd backend/config
mysql -h localhost -u root -p"password" COMISIONES_AAAU < migration-add-pdf-fields.sql
```
- [ ] Migración ejecutada sin errores
- [ ] Verificar con: `DESCRIBE certificaciones_credito;`
  - Debe mostrar: `archivo_pdf`, `nombre_archivo_pdf`

#### Verificación
```sql
SELECT COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'certificaciones_credito' 
AND COLUMN_NAME IN ('archivo_pdf', 'nombre_archivo_pdf');
```
- [ ] Retorna 2 filas
- [ ] Tipos: LONGBLOB y VARCHAR(255)

---

### 🔌 CAMBIOS EN BACKEND

#### Paso 1: Verificar Archivos
- [ ] `backend/controllers/pdfController.js`
  - [ ] Contiene `guardarCertificacionPdf()` (línea ~1107)
  - [ ] Contiene `descargarCertificacionPdf()` (línea ~1144)
  - [ ] Ambas funciones tienen try-catch

- [ ] `backend/routes/pdf.js`
  - [ ] POST `/api/pdf/guardar-certificacion-pdf` definida
  - [ ] GET `/api/pdf/descargar-certificacion/:certificacion_id` definida
  - [ ] Upload multer configurado

#### Paso 2: Probar Endpoints (Manual)
```bash
# 1. Guardar PDF
curl -X POST http://localhost:5000/api/pdf/guardar-certificacion-pdf \
  -H "Authorization: Bearer TOKEN" \
  -F "archivo=@test.pdf" \
  -F "certificacion_id=1"
```
- [ ] Response: 200 con `{success: true}`

```bash
# 2. Descargar PDF
curl -X GET http://localhost:5000/api/pdf/descargar-certificacion/1 \
  -H "Authorization: Bearer TOKEN" \
  -o descargado.pdf
```
- [ ] Response: 200 con contenido PDF
- [ ] Archivo `descargado.pdf` es válido

#### Paso 3: Verificar Seguridad
- [ ] Endpoint requiere autenticación (Bearer token)
- [ ] Sin token → Error 401
- [ ] Token inválido → Error 401
- [ ] Certificacion_id inexistente → Error 404

---

### 🎨 CAMBIOS EN FRONTEND

#### Paso 1: Verificar Archivos
- [ ] `material-dashboard-react/src/components/PdfUploadDialog/index.js`
  - [ ] `handleApplyData()` envía `archivo_pdf_original`
  - [ ] Sección "📄 Vista Previa del PDF" existe
  - [ ] `<embed>` con `height="400px"`
  - [ ] Muestra nombre y tamaño del archivo

- [ ] `material-dashboard-react/src/pages/Gestion/GestionCertificacionesCredito.js`
  - [ ] `handleExtractedPdfData()` llama a `/api/pdf/guardar-certificacion-pdf`
  - [ ] FormData incluye archivo y certificacion_id
  - [ ] Error en PDF no detiene el flujo (try-catch)

#### Paso 2: Probar en Navegador
1. [ ] Ir a: **Gestión → Certificaciones de Crédito**
2. [ ] Clic: **"Importar desde PDF"**
3. [ ] Seleccionar: **CCP 2658 AAA UCAYALI - MARZO 2026.pdf**
   - [ ] Modal se abre sin errores
   - [ ] Tamaño máximo 10MB ✓

4. [ ] Clic: **"Procesar PDF"**
   - [ ] Loading spinner aparece
   - [ ] Datos se extraen correctamente
   - [ ] Alert "PDF Procesado" aparece

5. [ ] Verificar **4 secciones**:
   - [ ] 📋 Información General (verde)
   - [ ] 🎯 Meta (azul)
   - [ ] 💰 Fuente Financiamiento (naranja)
   - [ ] 📝 Detalles Gasto (púrpura)

6. [ ] Verificar **Vista Previa del PDF**:
   - [ ] Tarjeta con fondo #fafafa
   - [ ] Embed PDF visible y scrolleable
   - [ ] Muestra nombre: "CCP 2658 AAA UCAYALI - MARZO 2026.pdf"
   - [ ] Muestra tamaño en MB

7. [ ] Clic: **"Aplicar Datos"**
   - [ ] Modal de éxito aparece con:
     - Certificación creada ✓
     - Nota Nº ✓
     - Monto Total ✓
     - Detalles guardados: 5 items ✓
   - [ ] Sin mencionar PDF (se guarda silenciosamente)

8. [ ] Verificar **tabla de certificaciones**:
   - [ ] Nueva fila aparece
   - [ ] Datos correctos
   - [ ] Puede hacer clic en acciones

---

### 💾 VERIFICACIÓN EN BASE DE DATOS

```sql
-- 1. Ver última certificación con PDF
SELECT 
  id, numero_documento, nombre_archivo_pdf,
  LENGTH(archivo_pdf) as tamaño_bytes,
  created_at
FROM certificaciones_credito
ORDER BY id DESC
LIMIT 1;
```
- [ ] `nombre_archivo_pdf` no es NULL
- [ ] `tamaño_bytes` > 0

```sql
-- 2. Verificar detalles
SELECT cc.id, cc.numero_documento, COUNT(dcc.id) as total_detalles
FROM certificaciones_credito cc
LEFT JOIN detalles_certificacion_credito dcc ON cc.id = dcc.certificacion_credito_id
WHERE cc.id = (SELECT MAX(id) FROM certificaciones_credito)
GROUP BY cc.id;
```
- [ ] Total_detalles = 5

```sql
-- 3. Verificar tamaño del PDF
SELECT 
  ROUND(SUM(LENGTH(archivo_pdf))/1024/1024, 2) as total_mb
FROM certificaciones_credito
WHERE archivo_pdf IS NOT NULL;
```
- [ ] Muestra tamaño en MB

---

### 🔐 TESTING DE SEGURIDAD

- [ ] **Sin PDF**: Certificación se crea pero sin archivo
- [ ] **PDF inválido**: Error "Solo se aceptan archivos PDF"
- [ ] **PDF > 10MB**: Error "Archivo demasiado grande"
- [ ] **Sin autenticación**: Error 401 en descarga
- [ ] **ID inexistente**: Error 404 en descarga
- [ ] **Token expirado**: Error 401

---

### 📊 TESTING DE FUNCIONALIDAD

#### Caso 1: Flujo Completo
1. [ ] Cargar PDF
2. [ ] Procesar
3. [ ] Ver vista previa
4. [ ] Aplicar datos
5. [ ] Verificar en BD
6. [ ] Descargar PDF (futuro feature)

#### Caso 2: PDFs Múltiples
1. [ ] Cargar PDF #1
2. [ ] Aplicar
3. [ ] Cargar PDF #2
4. [ ] Aplicar
5. [ ] Ambos guardados correctamente

#### Caso 3: Edición
- [ ] Editar certificación
- [ ] PDF sigue adjunto (no se modifica)
- [ ] Detalles se pueden modificar

---

### ✨ FEATURES NUEVOS ESPERADOS

Después de implementación:

✅ **En Modal de Importación:**
- [ ] Vista previa del PDF antes de guardar
- [ ] Nombre y tamaño visible
- [ ] Completamente scrolleable
- [ ] Interactivo (zoom, búsqueda en navegador)

✅ **En Guardado:**
- [ ] PDF se guarda automáticamente con Cert
- [ ] Se vincula a la certificación correcta
- [ ] Se preserva nombre original

✅ **En Base de Datos:**
- [ ] Nueva certificación tiene archivo_pdf NOT NULL
- [ ] nombre_archivo_pdf es exacto
- [ ] Tamaño se guarda correctamente

---

### 🐛 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| PDF no aparece en vista previa | Verificar que el navegador soporta embed PDF (Chrome, Firefox, Edge) |
| Error 404 en guardar PDF | Verificar que certificacion_id es correcto |
| Error 401 en descargar | Verificar que el token no está expirado |
| PDF guardado pero tamaño = 0 | Verificar que archivo_buffer se está pasando bien |
| Modal muy estrecho | Verificar que `maxWidth="lg"` está en Dialog |
| Botón texto blanco | Verificar estilos CSS `color: '#ffffff'` |

---

### 📈 MÉTRICAS DESPUÉS DE IMPLEMENTACIÓN

| Métrica | Esperado |
|---------|----------|
| Tiempo de carga PDF | < 5 segundos |
| Tiempo de visualización | < 1 segundo |
| Tiempo de guardado | < 3 segundos |
| Tasa de éxito | > 99% |
| Tamaño DB por PDF | Variable (100KB - 5MB) |

---

### 🚀 CHECKLIST FINAL DE DESPLIEGUE

- [ ] Código reviewed y aprobado
- [ ] Tests pasados en local
- [ ] DB migrada en staging
- [ ] Backend testado en staging
- [ ] Frontend compilado (npm build)
- [ ] SSL certificado válido
- [ ] Backups de BD actualizados
- [ ] Documentación actualizada
- [ ] Equipo notificado
- [ ] Monitoring activo
- [ ] Log centralized (si aplica)

---

### 📞 CONTACTO Y SOPORTE

**Problemas técnicos:**
- Revisar `IMPLEMENTACION_ALMACENAMIENTO_PDF.md`
- Verificar logs en: `backend/logs/`
- Console del navegador (F12)

**Cambios necesarios:**
- Crear issue con descripción
- Incluir screenshot/logs
- Versión actual en footer

---

**Fecha Completado:** ___________  
**Responsable:** ___________  
**Aprobado por:** ___________

✅ **ESTADO: LISTO PARA PRODUCCIÓN**
