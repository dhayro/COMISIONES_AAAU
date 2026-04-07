# 🚀 CHECKLIST DEPLOYMENT - Llevar a Producción

**Versión:** Final Deployment Ready  
**Fecha:** 31-03-2026  
**Objetivo:** Validar antes de pasar a PRODUCCIÓN

---

## 📋 PRE-DEPLOYMENT (Desarrollo)

### ✅ Paso 1: Verificar Código Está en Lugar

```bash
# Terminal: Verificar archivos modificados

# Frontend - Columna Monto
grep -c "field: 'monto'" GestionCertificacionesFormatos.js
# DEBE retornar: 1

# Frontend - Columna CCP  
grep -c "CCP:" EmisionFormatos.js
# DEBE retornar: 1 o más

# Frontend - Validación dual
grep -c "cambioMeta.*cambioCertificacion" GestionCertificacionesFormatos.js
# DEBE retornar: 1 o más

# Backend - Detección meta
grep -c "meta_anterior" formatoEmisionController.js
# DEBE retornar: 1 o más

# Backend - Validación dual
grep -c "CAMBIO MÚLTIPLE" formatoEmisionController.js
# DEBE retornar: 1 o más
```

**Resultado Esperado:**
```
☑️ Todas las búsquedas retornan 1 o más
☑️ Ninguna retorna 0
```

---

### ✅ Paso 2: Limpiar Cache y Reconstruir

```bash
# Ir a carpeta frontend
cd frontend

# Opción A: Limpiar caché (Next.js / Vite)
rm -rf .next  # Si es Next.js
rm -rf dist   # Si es Vite
rm -rf build

# Opción B: Limpiar node_modules (si hay dudas)
rm -rf node_modules
npm install

# Reconstruir
npm run build
# O si es desarrollo: npm start
```

**Resultado Esperado:**
```
✅ Build exitoso sin errores
✅ No hay warnings que preocupen
✅ Columnas visibles en la tabla
```

---

### ✅ Paso 3: Testing Rápido en Desarrollo

```
Abrir http://localhost:3000/gestion/certificaciones-formatos

☑️ Columna "Monto" visible
☑️ Valores formateados en S/.
☑️ Abrir http://localhost:3000/formatos/emision
☑️ Columna "Certificación" con badges
☑️ Seleccionar formato, cambiar certificación
☑️ Verificar que se actualiza correctamente
```

**Si algo falla aquí:** ❌ **NO CONTINUAR A PRODUCCIÓN**
- Revisar console (F12)
- Revisar backend logs
- Hacer fix en desarrollo primero

---

### ✅ Paso 4: Verificar Base de Datos

```bash
# Ir a carpeta backend
cd backend

# Ejecutar diagnóstico
node scripts/diagnosticoMontos.js

# Si ENCUENTRA negativos:
Node scripts/repararMontosUtilizados.js

# Verificar que se repararon:
node scripts/diagnosticoMontos.js
# Debe decir: "No se encontraron montos negativos"
```

**Resultado Esperado:**
```
✅ Sin montos negativos
✅ Backup SQL creado (si fue necesario reparar)
```

---

### ✅ Paso 5: Backend Build/Test

```bash
# En carpeta backend
npm run build  # Si es TypeScript
# O: node --version (verificar Node funciona)

# Verificar que endpoint está accesible
curl http://localhost:3001/api/health
# DEBE retornar: {"status": "ok"}
```

**Resultado Esperado:**
```
✅ Backend compila sin errores
✅ Endpoint /api/health responde 200
✅ No hay errores de conexión a BD
```

---

## 📦 DEPLOYMENT (Producción)

### ✅ Paso 6: Backup CRÍTICO

```bash
# En servidor de producción
# IMPORTANTE: Hacer backup ANTES de cambios

# Opción 1: Backup completo de BD
mysqldump -u [USER] -p [PASSWORD] [DATABASE] > backup_$(date +%Y%m%d_%H%M%S).sql

# Opción 2: Backup con gzip (comprimido)
mysqldump -u [USER] -p [PASSWORD] [DATABASE] | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# GUARDAR en lugar seguro (extraer localmente)
```

**Resultado Esperado:**
```
✅ Archivo backup creado
✅ Tamaño > 0 bytes (no vacío)
✅ Guardado en lugar seguro fuera del servidor
```

---

### ✅ Paso 7: Actualizar Código en Producción

```bash
# Opción A: Git (recomendado)
cd /app/producción/backend
git pull origin main  # O rama correcta
npm install --production
npm run build  # Si es necesario

cd /app/producción/frontend
git pull origin main  # O rama correcta
npm install --production
npm run build

# Opción B: Manual (SFTP/SCP)
# Copiar archivos backend compilados
# Copiar archivos frontend compilados (carpeta dist/ o .next/)
```

**Resultado Esperado:**
```
✅ Código actualizado
✅ Dependencias instaladas
✅ Build completado
```

---

### ✅ Paso 8: Reparar Base de Datos (si es necesario)

```bash
# En producción (con CUIDADO)
cd /app/producción/backend

# Primero: Ejecutar diagnóstico
node scripts/diagnosticoMontos.js

# Si hay negativos Y decides reparar:
# (Recomendable: hacerlo en horario bajo)
node scripts/repararMontosUtilizados.js

# Verificar resultado
node scripts/diagnosticoMontos.js
```

⚠️ **IMPORTANTE:** 
- Hacer esto ANTES de reiniciar aplicación
- Preferiblemente en horario de bajo uso
- Guardar el backup generado (backup_montos_TIMESTAMP.sql)

---

### ✅ Paso 9: Reiniciar Servicios

```bash
# En servidor de producción

# Opción A: Docker (si usa)
docker-compose restart backend frontend
# O
docker restart [CONTAINER_BACKEND] [CONTAINER_FRONTEND]

# Opción B: PM2 (si usa)
pm2 restart backend frontend
pm2 restart app_name  # O nombre del proceso

# Opción C: Systemd (si usa)
sudo systemctl restart comisiones-backend
sudo systemctl restart comisiones-frontend

# Opción D: Manual
# Terminar procesos anteriores
# Iniciar nuevos con: npm start, yarn start, node app.js, etc.
```

**Resultado Esperado:**
```
✅ Backend inicia sin errores
✅ Frontend inicia sin errores
✅ No hay errores de conexión
✅ Endpoints responden correctamente
```

---

### ✅ Paso 10: Verificación Post-Deploy

```bash
# Esperar 2-3 minutos para estabilización

# Test 1: Backend health check
curl https://[DOMINIO]/api/health
# DEBE retornar: {"status": "ok"}

# Test 2: Frontend carga
curl -I https://[DOMINIO]
# DEBE retornar: HTTP/1.1 200 OK

# Test 3: Endpoint de formatos
curl https://[DOMINIO]/api/formato-emisiones/list
# DEBE retornar: {"data": [...], "message": "ok"}

# Resultado en console:
✅ Todos endpoints retornan 200
✅ Sin errores 500
✅ Sin errores de conexión a BD
```

---

### ✅ Paso 11: Smoke Tests en Producción

```
Abrir https://[DOMINIO]/gestion/certificaciones-formatos

☑️ Página carga sin errores
☑️ Columna "Monto" visible
☑️ Valores se ven correctamente
☑️ Tabla responde a clicks

Abrir https://[DOMINIO]/formatos/emision

☑️ Página carga sin errores
☑️ Columna "Certificación" visible
☑️ Badges azul/naranja visibles
☑️ Tabla responde a clicks

Ir a Gestión Certificaciones
☑️ Seleccionar un formato
☑️ Cambiar certificación (MISMO meta)
☑️ Guardar
☑️ Cambio se aplica correctamente

Ir a Gestión Certificaciones
☑️ Seleccionar otro formato
☑️ Cambiar AMBOS meta Y certificación (válido)
☑️ Guardar
☑️ Cambio se aplica correctamente
```

**Resultado Esperado:**
```
✅ Todo funciona como en desarrollo
✅ Sin errores visibles
✅ Cambios se aplican correctamente
```

---

## 🔍 MONITOREO POST-DEPLOYMENT

### ✅ Paso 12: Primeras 24 Horas

**Cada hora en primeras 4 horas:**
```bash
# Revisar logs
tail -f /app/producción/backend/logs/app.log | grep -E "ERROR|❌|⚠️"

# Verificar BD
mysql -u [USER] -p [PASSWORD] [DB] -e "SELECT COUNT(*) FROM formato_emisiones WHERE certificacion_id IS NULL;"

# Check recursos
free -h  # Memoria
df -h    # Disco
```

**Resultado Esperado:**
```
✅ Sin errores en logs
✅ Sin spike de recursos
✅ Usuarios trabajando normalmente
```

### ✅ Paso 13: Primeros 7 Días

**Revisar diariamente:**
```
☑️ Log de cambios de certificaciones
   → Verificar que no hay duplicados
   
☑️ Montos en BD
   → Ninguno debe ser negativo
   
☑️ User feedback
   → Preguntar si todo funciona
   
☑️ Performance
   → ¿Está lento? ¿Hay timeouts?
```

---

## ⚠️ PLAN DE ROLLBACK (Si Falla)

Si algo sale mal en producción:

### Opción 1: Rollback de Código (Rápido)

```bash
# Ir a carpeta producción
cd /app/producción

# Volver a commit anterior
git revert HEAD  # O git reset --hard [COMMIT_ANTERIOR]

# Rebuild
npm run build

# Reiniciar
pm2 restart app_name  # O tu método de restart
```

**Tiempo:** 2-5 minutos  
**Riesgo:** Bajo, solo vuelve código

---

### Opción 2: Rollback de BD (Si hay problema de datos)

```bash
# Si ejecutaste repararMontosUtilizados.js y hubo problema:

# Restaurar backup
mysql -u [USER] -p [PASSWORD] [DB] < backup_montos_TIMESTAMP.sql

# O restaurar backup completo
mysql -u [USER] -p [PASSWORD] [DB] < backup_YYYYMMDD_HHMMSS.sql

# Reiniciar backend
pm2 restart backend
```

**Tiempo:** 2-10 minutos (depende tamaño BD)  
**Riesgo:** Bajo, estás restaurando estado conocido

---

## 📊 Checklist Final

```
PRE-DEPLOYMENT:
  ☑️ Código verificado en archivos
  ☑️ Build completado sin errores
  ☑️ Testing básico en desarrollo OK
  ☑️ BD sin montos negativos
  ☑️ Todos los scripts funcionan

DEPLOYMENT:
  ☑️ Backup BD creado y guardado
  ☑️ Código actualizado en producción
  ☑️ Dependencias instaladas
  ☑️ Build compilado
  ☑️ Servicios reiniciados
  ☑️ Health checks pasan
  ☑️ Smoke tests OK

POST-DEPLOYMENT:
  ☑️ Monitorear primeras 4 horas
  ☑️ Revisar logs sin errores
  ☑️ Usuarios pueden acceder
  ☑️ Cambios funcionan correctamente
  ☑️ BD sigue consistente
```

---

## 📞 Escalación

Si hay problemas durante deployment:

**Contactos:**
- Backend Issues: [Contacto Backend]
- Frontend Issues: [Contacto Frontend]
- BD Issues: [Contacto DBA]
- Rollback Decision: [Manager]

**Proceso de Escalación:**
1. Verificar logs (5 min)
2. Si es error conocido: arreglarlo (10-15 min)
3. Si no se resuelve: **ROLLBACK** (5-10 min)
4. Investigar en desarrollo
5. Re-deploy cuando esté listo

---

## ✅ CONCLUSIÓN

Cuando hayas completado TODOS los pasos:

```
Estado: ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE

Cambios en Producción:
✅ Columna Monto visible
✅ Columna CCP visible
✅ Validación dual meta+cert funcionando
✅ Montos sin negativos
✅ Sin duplicaciones

Usuarios pueden:
✅ Ver montos asignados directamente
✅ Identificar formatos con/sin certificación
✅ Cambiar meta y certificación con validación
✅ Trabajar sin errores

BD está:
✅ Limpia (sin negativos)
✅ Consistente
✅ Auditada
✅ Respaldada
```

---

**Deployment Status:** ✅ **READY TO SHIP**

Sigue este checklist y la implementación será exitosa.

**Última Actualización:** 31-03-2026  
**Próximo Paso:** Ejecutar deployment y monitorear
