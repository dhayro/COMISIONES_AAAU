╔════════════════════════════════════════════════════════════════════════════════╗
║                        ✅ CHECKLIST DE MIGRACIÓN                               ║
║                                                                                  ║
║              De Base de Datos (LONGBLOB) a Disco (Carpeta)                     ║
╚════════════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════
PREPARACIÓN (Antes de iniciar)
════════════════════════════════════════════════════════════════════════════════

PRE-MIGRACIÓN:
  ☐ Hacer backup de base de datos
    Comando: mysqldump -h localhost -u root -p COMISIONES_AAAU > backup_2026_03_14.sql
    
  ☐ Detener servidor backend (Ctrl+C)
    Terminal: cd backend && npm run dev
    
  ☐ Verificar espacio en disco (mínimo 10 GB libre recomendado)
    Windows: C: → Propiedades → Espacio disponible
    
  ☐ Verificar permisos de carpeta backend
    Debe ser escribible por Node.js


════════════════════════════════════════════════════════════════════════════════
FASE 1: MIGRACIÓN DE BASE DE DATOS (⚠️ CRÍTICA)
════════════════════════════════════════════════════════════════════════════════

Paso 1.1: Ejecutar Script de Migración
────────────────────────────────────────────────────────────────────────────────
  ☐ Abre terminal CMD o PowerShell
  
  ☐ Navega a la carpeta:
    cd D:\COMISIONES_AAAU\backend\config
    
  ☐ Ejecuta el script:
    mysql -h localhost -u root -p COMISIONES_AAAU < migration-storage-to-disk.sql
    
  ☐ Ingresa contraseña de MySQL cuando se pida
  
  ☐ Espera a ver:
    Query OK, X rows affected
    

Paso 1.2: Verificar Cambios en la Base de Datos
────────────────────────────────────────────────────────────────────────────────
  ☐ Abre MySQL Workbench o similar
  
  ☐ Conecta a COMISIONES_AAAU
  
  ☐ Ejecuta este query:
    ```sql
    DESCRIBE certificaciones_credito;
    ```
    
  ☐ Verifica que ves:
    ✓ ruta_archivo_pdf (VARCHAR 500)
    ✓ tiene_pdf (TINYINT)
    ✗ archivo_pdf (NO debe estar)
    
  ☐ Ejecuta reporte:
    ```sql
    SELECT 
      COUNT(*) as total_certificaciones,
      SUM(IF(tiene_pdf = 1, 1, 0)) as con_pdf,
      SUM(IF(tiene_pdf = 0, 1, 0)) as sin_pdf
    FROM certificaciones_credito;
    ```


════════════════════════════════════════════════════════════════════════════════
FASE 2: VERIFICAR ARCHIVOS DEL CÓDIGO
════════════════════════════════════════
  ☐ Abre VS Code en la carpeta COMISIONES_AAAU
  
  ☐ Verifica que existen archivos modificados:
    ✓ backend/controllers/pdfController.js (modificado)
    ✓ backend/models/CertificacionCredito.js (modificado)
    ✓ backend/config/schema-certificaciones.sql (modificado)
    ✓ backend/config/migration-storage-to-disk.sql (nuevo)
    
  ☐ Verifica que existen carpetas:
    ✓ backend/uploads/certificaciones/ (nueva)


════════════════════════════════════════════════════════════════════════════════
FASE 3: REINICIAR SERVICIOS
════════════════════════════════════════════════════════════════════════════════

Paso 3.1: Backend
────────────────────────────────────────────────────────────────────────────────
  ☐ Terminal 1: Navega a backend
    cd D:\COMISIONES_AAAU\backend
    
  ☐ Instala dependencias (si es necesario):
    npm install
    
  ☐ Inicia servidor:
    npm run dev
    o
    node server.js
    
  ☐ Espera a ver en consola:
    ✓ Server running on port 5000
    ✓ Database connected
    ✓ Carpeta /uploads/certificaciones creada (si no existe)
    
  ☐ Deja corriendo esta terminal


Paso 3.2: Frontend
────────────────────────────────────────────────────────────────────────────────
  ☐ Terminal 2: Navega a frontend
    cd D:\COMISIONES_AAAU\material-dashboard-react
    
  ☐ Inicia:
    npm start
    
  ☐ Espera a ver en consola:
    ✓ Webpack compiled
    ✓ Local: http://localhost:3000
    
  ☐ El navegador debería abrirse automáticamente


════════════════════════════════════════════════════════════════════════════════
FASE 4: PRUEBA FUNCIONAL COMPLETA
════════════════════════════════════════════════════════════════════════════════

Test 1: Interfaz Accesible
────────────────────────────────────────────────────────────────────────────────
  ☐ Navegador debe estar en: http://localhost:3000
  
  ☐ Navega a: Gestión → Certificaciones de Crédito
  
  ☐ Página carga sin errores en consola (F12)
  
  ☐ Ves la tabla con certificaciones existentes


Test 2: Subir Nuevo PDF
────────────────────────────────────────────────────────────────────────────────
  ☐ Click en botón "Importar desde PDF"
  
  ☐ Modal abre correctamente
  
  ☐ Selecciona un PDF (válido, menor a 100 MB)
  
  ☐ En modal ves:
    ✓ Preview del PDF
    ✓ Nombre del archivo
    ✓ Tamaño del archivo
    
  ☐ Click en "Procesar PDF"
  
  ☐ Ves mensaje de éxito: "✓ PDF procesado"
  
  ☐ Click en "Aplicar Datos"
  
  ☐ Cierra modal
  
  ☐ ESPERA 1 SEGUNDO (para que se sincronice con BD)
  
  ☐ Debe aparecer NUEVA FILA en tabla con los datos


Test 3: Botones de PDF Habilitados
────────────────────────────────────────────────────────────────────────────────
  ☐ Busca la fila que acabas de crear
  
  ☐ En la columna "Acciones" ves 2 botones:
    ✓ 👁️ (Ver PDF) - DEBE ESTAR HABILITADO (no gris)
    ✓ ⬇️ (Descargar) - DEBE ESTAR HABILITADO (no gris)
    
  ☐ Al pasar mouse sobre botones ves tooltip:
    ✓ "Ver PDF" (NO debe decir "Sin PDF")
    ✓ "Descargar PDF"


Test 4: Visualizar PDF
────────────────────────────────────────────────────────────────────────────────
  ☐ Click en botón 👁️ (Ver PDF)
  
  ☐ Se abre NUEVA VENTANA del navegador
  
  ☐ En nueva ventana ves:
    ✓ Header con información de la certificación
    ✓ PDF embebido y completamente visible
    ✓ Puedes hacer scroll dentro del PDF
    
  ☐ Cierra ventana


Test 5: Descargar PDF
────────────────────────────────────────────────────────────────────────────────
  ☐ Vuelve a la tabla
  
  ☐ Click en botón ⬇️ (Descargar)
  
  ☐ El navegador descarga automáticamente el archivo
  
  ☐ Verifica descarga:
    Carpeta Descargas → Debe estar el archivo PDF
    Nombre: [nombre_original].pdf


Test 6: Verificar Archivo en Servidor
────────────────────────────────────────────────────────────────────────────────
  ☐ Abre Terminal (Cmd o PowerShell)
  
  ☐ Navega a carpeta de PDFs:
    cd D:\COMISIONES_AAAU\backend\uploads\certificaciones
    
  ☐ Lista archivos:
    dir
    
  ☐ Debes ver:
    ✓ cert_1_[TIMESTAMP].pdf (o similar)
    ✓ Otros archivos PDF que hayas subido
    
  ☐ Verifica tamaño:
    Debe coincidir aproximadamente con el PDF original


════════════════════════════════════════════════════════════════════════════════
FASE 5: VERIFICACIÓN EN BASE DE DATOS
════════════════════════════════════════════════════════════════════════════════
  ☐ Abre MySQL Workbench
  
  ☐ Ejecuta query:
    ```sql
    SELECT 
      id, 
      numero_documento, 
      nombre_archivo_pdf, 
      ruta_archivo_pdf, 
      tiene_pdf
    FROM certificaciones_credito 
    WHERE tiene_pdf = 1
    LIMIT 5;
    ```
    
  ☐ Verifica que NUEVA CERTIFICACIÓN aparece con:
    ✓ nombre_archivo_pdf: [nombre del archivo]
    ✓ ruta_archivo_pdf: uploads/certificaciones/cert_X_....pdf
    ✓ tiene_pdf: 1


════════════════════════════════════════════════════════════════════════════════
FASE 6: PRUEBAS DE ERROR (Validaciones)
════════════════════════════════════════════════════════════════════════════════

Test Error 1: Archivo > 100 MB
────────────────────────────────────────────────────────────────────────────────
  ☐ Intenta subir archivo > 100 MB
  
  ☐ Debes ver error:
    "Archivo muy grande. Máximo permitido: 100 MB"


Test Error 2: Archivo NO-PDF
────────────────────────────────────────────────────────────────────────────────
  ☐ Intenta subir archivo .txt, .docx, .jpg, etc.
  
  ☐ Debes ver error:
    "Solo se permiten archivos PDF"


Test Error 3: Sin Autenticación
────────────────────────────────────────────────────────────────────────────────
  ☐ (Para desarrolladores) Intenta acceder a API sin token
  
  ☐ Debes ver error 401/403


════════════════════════════════════════════════════════════════════════════════
FASE 7: RENDIMIENTO Y ESCALABILIDAD
════════════════════════════════════════════════════════════════════════════════

Test Rendimiento:
────────────────────────────────────────────────────────────────────────────────
  ☐ Abre DevTools (F12)
  
  ☐ Tab "Performance"
  
  ☐ Navega a Certificaciones de Crédito
  
  ☐ Verifica que:
    ✓ Query SELECT es RÁPIDA (< 100 ms)
    ✓ Memoria consumida es BAJA (sin LongBlobs)
    ✓ Tabla carga fluid sin lag


════════════════════════════════════════════════════════════════════════════════
FASE 8: LIMPIEZA Y DOCUMENTACIÓN
════════════════════════════════════════════════════════════════════════════════

  ☐ Borrar archivos obsoletos (si aplica):
    ☐ Backup anterior (si ya verificaste que todo funciona)
    ☐ Documentación de versión anterior (v1.0 con LONGBLOB)
    
  ☐ Crear documento de referencia:
    ☐ Guardar esta checklist completada
    ☐ Documentar cualquier cambio especial realizado
    
  ☐ Actualizar README.md:
    ☐ Versión: 2.0 (de LONGBLOB a Disco)
    ☐ Incluir nueva estructura de carpetas


════════════════════════════════════════════════════════════════════════════════
RESUMEN: CAPACIDAD MÁXIMA
════════════════════════════════════════════════════════════════════════════════

Por PDF:                100 MB (configurable)
Por mes (estimado):     1-5 GB (50-500 PDFs)
Por año:                12-60 GB
Recomendación:          Hacer backup cada mes
Espacio requerido:      Mínimo 50 GB libre


════════════════════════════════════════════════════════════════════════════════
✅ CONFIRMACIÓN FINAL
════════════════════════════════════════════════════════════════════════════════

Si marcaste TODOS los checkboxes ☐ con ✅ significa que:

  ✅ Base de datos migrada correctamente
  ✅ Servidores corriendo sin errores
  ✅ Subida de PDFs funciona
  ✅ Visualización funciona
  ✅ Descarga funciona
  ✅ Almacenamiento en disco funciona
  ✅ Validaciones funcionan
  ✅ BD correctamente actualizada

ESTADO: 🟢 MIGRACIÓN EXITOSA - LISTO PARA PRODUCCIÓN


════════════════════════════════════════════════════════════════════════════════
Fecha de Migración: _______________
Persona que migró: _______________
Problemas encontrados: _______________
Soluciones aplicadas: _______________
════════════════════════════════════════════════════════════════════════════════
