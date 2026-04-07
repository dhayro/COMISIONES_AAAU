╔════════════════════════════════════════════════════════════════════════════════╗
║                    🚀 DESPLIEGUE RÁPIDO (5 MINUTOS)                            ║
║                                                                                  ║
║              Almacenamiento de PDFs: Base de Datos → Disco                      ║
╚════════════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════════
⏱️ PASO 1: BACKUP (1 min)
═══════════════════════════════════════════════════════════════════════════════

Abre Terminal (Cmd/PowerShell) y ejecuta:

  cd D:\COMISIONES_AAAU\backend\config
  mysqldump -h localhost -u root -p COMISIONES_AAAU > backup_2026_03_14.sql

Cuando pida contraseña: ingresa tu contraseña de MySQL
Espera a que complete (ves nuevo archivo backup_2026_03_14.sql)


═══════════════════════════════════════════════════════════════════════════════
⏱️ PASO 2: MIGRACIÓN BD (1 min)
═══════════════════════════════════════════════════════════════════════════════

En MISMA terminal, ejecuta:

  mysql -h localhost -u root -p COMISIONES_AAAU < migration-storage-to-disk.sql

Ingresa contraseña nuevamente
Espera a ver: Query OK...


═══════════════════════════════════════════════════════════════════════════════
⏱️ PASO 3: REINICIAR BACKEND (1 min)
═══════════════════════════════════════════════════════════════════════════════

Si backend está corriendo, presiona: Ctrl+C para detener

Luego ejecuta:

  cd D:\COMISIONES_AAAU\backend
  npm run dev

Espera a ver: Server running on port 5000 ✓


═══════════════════════════════════════════════════════════════════════════════
⏱️ PASO 4: REINICIAR FRONTEND (1 min)
═══════════════════════════════════════════════════════════════════════════════

En NUEVA terminal:

  cd D:\COMISIONES_AAAU\material-dashboard-react
  npm start

Espera a que se compile y abra http://localhost:3000


═══════════════════════════════════════════════════════════════════════════════
⏱️ PASO 5: PROBAR (1 min)
═══════════════════════════════════════════════════════════════════════════════

En navegador:
  1. Navega a: Gestión → Certificaciones de Crédito
  2. Click: "Importar desde PDF"
  3. Selecciona un PDF
  4. Click: "Procesar PDF" → "Aplicar Datos"
  5. Verifica que fila nueva aparece
  6. Los botones 👁️ y ⬇️ deben estar HABILITADOS


═══════════════════════════════════════════════════════════════════════════════
✅ LISTO - STATUS FINAL
═══════════════════════════════════════════════════════════════════════════════

Si todo funcionó:
  ✅ Base de datos migrada
  ✅ Backend corriendo con nuevo código
  ✅ Frontend cargando cambios
  ✅ PDFs guardándose en disco
  ✅ Botones habilitados

Capacidad máxima: 100 MB por PDF (configurable)

Para dudas consulta:
  - GUIA_MIGRACION_ALMACENAMIENTO_DISCO.md (detallado)
  - CHECKLIST_MIGRACION_ALMACENAMIENTO_DISCO.md (paso a paso)


════════════════════════════════════════════════════════════════════════════════
¡Despliegue Completado! 🎉
════════════════════════════════════════════════════════════════════════════════
