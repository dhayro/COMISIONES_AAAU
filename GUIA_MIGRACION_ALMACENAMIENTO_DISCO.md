╔════════════════════════════════════════════════════════════════════════════════╗
║                     📋 GUÍA DE MIGRACIÓN A ALMACENAMIENTO EN DISCO              ║
║                                                                                  ║
║                   De LONGBLOB en BD → Carpeta en Backend                        ║
╚════════════════════════════════════════════════════════════════════════════════╝

📊 CAMBIO REALIZADO
════════════════════════════════════════════════════════════════════════════════

ANTES (LONGBLOB en Base de Datos):
├── archivo_pdf LONGBLOB (hasta 4 GB)
├── nombre_archivo_pdf VARCHAR(255)
└── Problema: BD crece mucho, queries lentas

AHORA (Almacenamiento en Disco):
├── ruta_archivo_pdf VARCHAR(500)  ← Nueva ruta
├── nombre_archivo_pdf VARCHAR(255) ← Se preserva
├── tiene_pdf TINYINT(1)            ← Flag rápido
└── Beneficio: BD pequeña, acceso rápido

════════════════════════════════════════════════════════════════════════════════

🗂️ ESTRUCTURA DE CARPETAS
════════════════════════════════════════════════════════════════════════════════

backend/
├── uploads/                         ← NUEVA CARPETA
│   └── certificaciones/             ← NUEVA CARPETA
│       ├── cert_1_1710000000.pdf
│       ├── cert_2_1710001000.pdf
│       └── ...
├── controllers/
│   └── pdfController.js            ✏️ MODIFICADO
├── models/
│   └── CertificacionCredito.js     ✏️ MODIFICADO
├── config/
│   ├── schema-certificaciones.sql  ✏️ MODIFICADO
│   └── migration-storage-to-disk.sql ⭐ NUEVO (IMPORTANTE)
└── ...

════════════════════════════════════════════════════════════════════════════════

📋 PASOS DE INSTALACIÓN
════════════════════════════════════════════════════════════════════════════════

▶️  PASO 1: Aplicar Migración a Base de Datos
────────────────────────────────────────────────────────────────────────────────

Abre una terminal y ejecuta:

  cd backend/config
  mysql -h localhost -u root -p COMISIONES_AAAU < migration-storage-to-disk.sql

Qué hace:
  ✅ Elimina columna archivo_pdf (LONGBLOB) - ⚠️ IMPORTANTE: Datos perdidos
  ✅ Añade columna ruta_archivo_pdf (VARCHAR 500)
  ✅ Añade flag tiene_pdf (TINYINT)
  ✅ Crea índices para búsquedas rápidas
  ✅ Genera reporte de cambios


▶️  PASO 2: Verificar Cambios en BD
────────────────────────────────────────────────────────────────────────────────

En MySQL Workbench o terminal:

  USE COMISIONES_AAAU;
  DESCRIBE certificaciones_credito;

Debes ver estas columnas NUEVAS:
  ✓ ruta_archivo_pdf VARCHAR(500)
  ✓ tiene_pdf TINYINT(1)

Y esta columna debe estar AUSENTE:
  ✗ archivo_pdf (LONGBLOB)


▶️  PASO 3: Reiniciar Backend
────────────────────────────────────────────────────────────────────────────────

Cierra servidor actual (Ctrl+C si está ejecutándose)

Reinicia:
  cd backend
  npm install  # (opcional, si es primera vez)
  node server.js
  
Debes ver en consola:
  ✅ Server running on port 5000
  ✅ Database connected


▶️  PASO 4: Compilar/Reiniciar Frontend
────────────────────────────────────────────────────────────────────────────────

En otra terminal:
  cd material-dashboard-react
  npm start
  
Debes ver en consola:
  ✅ Webpack compiled with X warnings
  ✅ Local: http://localhost:3000


▶️  PASO 5: Prueba Completa
────────────────────────────────────────────────────────────────────────────────

1. Abre navegador: http://localhost:3000

2. Ve a: Gestión → Certificaciones de Crédito

3. Click en "Importar desde PDF"

4. Selecciona un PDF cualquiera

5. Click "Procesar PDF" → "Aplicar Datos"

6. ✅ RESULTADO ESPERADO:
   - Nueva fila en tabla
   - Botones Ver PDF ⭕ y Descargar ⬇️ HABILITADOS
   - Al hacer click: Abre/descarga el PDF desde disco


════════════════════════════════════════════════════════════════════════════════

⚠️  NOTAS IMPORTANTES
════════════════════════════════════════════════════════════════════════════════

1. MIGRACIÓN DESTRUCTIVA
   - Si tienes PDFs guardados en BD (campo archivo_pdf), se perderán
   - Haz backup ANTES de ejecutar migration-storage-to-disk.sql
   - Comando backup: 
     mysqldump -h localhost -u root -p COMISIONES_AAAU > backup_2026_03_14.sql

2. CARPETA /uploads/certificaciones/
   - Se crea automáticamente al guardar primer PDF
   - Requiere permisos de lectura/escritura
   - En producción: Configurar backups automáticos de esta carpeta

3. TAMAÑO MÁXIMO POR ARCHIVO
   - ANTES: 10 MB (configurado en código)
   - AHORA: 100 MB (recomendado, ajustable en pdfController.js)
   - Límite teórico: Espacio en disco disponible

4. VELOCIDAD
   - Queries más rápidas (BD sin LONGBLOB)
   - Descarga más rápida (desde disco vs transferencia de BD)
   - Backups más rápidos (BD más pequeña)


════════════════════════════════════════════════════════════════════════════════

✅ VERIFICACIÓN FINAL
════════════════════════════════════════════════════════════════════════════════

Si seguiste todos los pasos correctamente, debes tener:

Backend:
  ✓ /uploads/certificaciones/ existe y es escribible
  ✓ pdfController.js guardando PDFs en disco
  ✓ CertificacionCredito.js retornando tiene_pdf

Base de Datos:
  ✓ Columna archivo_pdf eliminada
  ✓ Columna ruta_archivo_pdf creada
  ✓ Columna tiene_pdf creada

Frontend:
  ✓ Botones de PDF habilitados cuando tiene_pdf = 1
  ✓ Descarga desde el servidor funciona
  ✓ Vista previa del PDF abre correctamente


════════════════════════════════════════════════════════════════════════════════

🆘 TROUBLESHOOTING
════════════════════════════════════════════════════════════════════════════════

Problema: "No se puede escribir en uploads/certificaciones/"
Solución: 
  - Verificar permisos: chmod 755 backend/uploads/certificaciones/
  - En Windows: Click derecho → Propiedades → Seguridad → Editar

Problema: "404: PDF no encontrado"
Solución:
  - Verificar que ruta_archivo_pdf NO sea NULL en BD
  - Verificar que archivo existe en: backend/uploads/certificaciones/

Problema: "Botones siguen deshabilitados"
Solución:
  - Refrescar página (F5)
  - Verificar que tiene_pdf = 1 en BD
  - Limpiar localStorage: Ctrl+Shift+K → Application → Storage → Clear All


════════════════════════════════════════════════════════════════════════════════

📞 SOPORTE RÁPIDO
════════════════════════════════════════════════════════════════════════════════

Comandos útiles para verificar:

Ver carpeta creada:
  ls -la backend/uploads/certificaciones/

Ver tamaño total de PDFs:
  du -sh backend/uploads/certificaciones/

Ver archivos almacenados:
  find backend/uploads/certificaciones/ -type f

Verificar BD (en MySQL):
  SELECT id, numero_documento, nombre_archivo_pdf, ruta_archivo_pdf, 
         tiene_pdf FROM certificaciones_credito WHERE tiene_pdf = 1;


════════════════════════════════════════════════════════════════════════════════
Versión: 1.0 | Fecha: 2026-03-14 | Status: 🟢 LISTA PARA MIGRAR
════════════════════════════════════════════════════════════════════════════════
