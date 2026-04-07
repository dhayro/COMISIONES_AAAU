# 📝 PASOS RÁPIDOS: Activar Control de Correlativo

## ⚡ 5 Pasos para Comenzar

### Paso 1: Crear la tabla en Base de Datos

En tu terminal (o MySQL Workbench):

```bash
# Opción A: Desde línea de comandos
cd d:\COMISIONES_AAAU\backend
mysql -h localhost -u root -p nombre_de_tu_bd < sql/02_crear_correlativo_control.sql
```

**O manualmente en MySQL Workbench:**
1. Abre MySQL Workbench
2. Conecta a tu BD
3. Copia el contenido de `sql/02_crear_correlativo_control.sql`
4. Ejecuta (Ctrl+Shift+Enter)

✅ **Verificación:** Debería crear tabla `correlativo_control`

---

### Paso 2: Inicializar Controles para todos los Usuarios

**Opción A: Script Node.js (RECOMENDADO)**

```bash
cd d:\COMISIONES_AAAU\backend
node scripts/inicializar-correlativos.js
```

Verás:
```
✅ Diego Torres: control creado (comienza en 001)
✅ Juan García: control creado (comienza en 001)
✅ María López: control creado (comienza en 001)
...
```

---

**Opción B: Script SQL**

```bash
cd d:\COMISIONES_AAAU\backend
mysql -h localhost -u root -p nombre_de_tu_bd < sql/03_inicializar_correlativo_usuarios.sql
```

---

**Opción C: API REST**

```bash
# Crear control para usuario ID=1
curl -X POST http://localhost:5000/api/formato-emisiones/correlativo-control/ \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "ano": 2026,
    "numero_inicial": 1,
    "descripcion": "Año 2026"
  }'
```

---

### Paso 3: Verificar que se Creó

**En MySQL Workbench:**

```sql
SELECT u.nombre, cc.ano, cc.numero_inicial, cc.numero_proximo, cc.descripcion
FROM correlativo_control cc
JOIN users u ON cc.usuario_id = u.id
ORDER BY u.nombre;
```

Debería mostrar algo como:

```
nombre           | ano  | numero_inicial | numero_proximo | descripcion
─────────────────────────────────────────────────────────────────────
Diego Torres     | 2026 | 1              | 1              | Diego Torres - Año 2026
Juan García      | 2026 | 1              | 1              | Juan García - Año 2026
María López      | 2026 | 1              | 1              | María López - Año 2026
```

✅ **Si ves esto**, estás listo para el Paso 4.

---

### Paso 4: Personalizar (OPCIONAL)

Si algunos usuarios necesitan empezar en número diferente:

```sql
-- Ejemplo: Diego Torres comienza en 100 (no 1)
UPDATE correlativo_control 
SET numero_inicial = 100, numero_proximo = 100
WHERE usuario_id = 1 AND ano = 2026;

-- Verificar
SELECT * FROM correlativo_control WHERE usuario_id = 1 AND ano = 2026;
```

---

### Paso 5: Probar Generación de Números

1. Inicia tu aplicación frontend y backend
2. Ve a la sección de "Emisión de Formatos"
3. Crea un nuevo formato
4. Verifica que genere el número con el formato correcto:
   - `001-DT-2026` (Diego Torres)
   - `100-JG-2026` (Juan García, si lo cambiaste a 100)
   - etc.

✅ **¡Listo!** El sistema ya está usando tu tabla de control.

---

## 🎯 Casos de Configuración Común

### Caso 1: Todos comienzan en 001

```bash
# Ya está hecho por defecto después del Paso 2
# No necesitas hacer nada
```

---

### Caso 2: Usuarios diferentes, números diferentes

```sql
-- Diego Torres: 001
UPDATE correlativo_control SET numero_inicial = 1, numero_proximo = 1 
WHERE usuario_id = 1 AND ano = 2026;

-- Juan García: 100
UPDATE correlativo_control SET numero_inicial = 100, numero_proximo = 100
WHERE usuario_id = 2 AND ano = 2026;

-- María López: 500
UPDATE correlativo_control SET numero_inicial = 500, numero_proximo = 500
WHERE usuario_id = 3 AND ano = 2026;
```

---

### Caso 3: Resetear a número inicial (si cometiste error)

```sql
-- Resetear Diego Torres a 001
UPDATE correlativo_control 
SET numero_proximo = numero_inicial
WHERE usuario_id = 1 AND ano = 2026;
```

---

### Caso 4: Cambiar correlativo actual (adelantar números)

```sql
-- Diego Torres ahora usará 050 en lugar de 001
UPDATE correlativo_control 
SET numero_inicial = 50, numero_proximo = 50
WHERE usuario_id = 1 AND ano = 2026;
```

---

## 🆘 Troubleshooting

### ❌ Problema: "Tabla correlativo_control no existe"

**Solución:** Ejecuta Paso 1 nuevamente
```bash
mysql -h localhost -u root -p nombre_de_tu_bd < backend/sql/02_crear_correlativo_control.sql
```

---

### ❌ Problema: "No existe control de correlativo para este usuario y año"

**Solución:** Ejecuta Paso 2
```bash
node backend/scripts/inicializar-correlativos.js
```

O crea manualmente:
```sql
INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo)
VALUES (1, 2026, 1, 1);
```

---

### ❌ Problema: Los números generados siguen siendo aleatorios

**Solución 1:** Reinicia la aplicación
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd material-dashboard-react && npm start
```

**Solución 2:** Verifica que la tabla tenga datos
```sql
SELECT COUNT(*) as total FROM correlativo_control WHERE ano = 2026;
```

---

### ❌ Problema: Error al ejecutar script Node

```bash
# Asegúrate de estar en la carpeta correcta
cd d:\COMISIONES_AAAU\backend

# Verifica que .env esté configurado
cat .env | grep DB_

# Ejecuta el script
node scripts/inicializar-correlativos.js
```

---

## 📊 Monitoreo (opcional)

Consulta el estado de los correlativos regularmente:

```sql
-- Ver todos los controles
SELECT u.nombre, cc.ano, cc.numero_inicial, cc.numero_proximo
FROM correlativo_control cc
JOIN users u ON cc.usuario_id = u.id
WHERE cc.activo = 1
ORDER BY cc.ano DESC, u.nombre;

-- Ver solo controles de 2026
SELECT u.nombre, cc.numero_proximo
FROM correlativo_control cc
JOIN users u ON cc.usuario_id = u.id
WHERE cc.ano = 2026 AND cc.activo = 1;

-- Ver cuántos formatos por usuario
SELECT u.nombre, COUNT(f.id) as total_formatos
FROM users u
LEFT JOIN formato_emisiones f ON u.id = f.usuario_id 
  AND YEAR(f.fecha_emision) = 2026
LEFT JOIN correlativo_control cc ON u.id = cc.usuario_id AND cc.ano = 2026
WHERE u.activo = 1
GROUP BY u.id
ORDER BY u.nombre;
```

---

## ✅ Checklist Final

- [ ] Ejecuté Paso 1: Crear tabla en BD
- [ ] Ejecuté Paso 2: Inicializar controles
- [ ] Ejecuté Paso 3: Verifiqué en SQL
- [ ] Ejecuté Paso 5: Probé generación de números
- [ ] (Opcional) Personalicé números iniciales
- [ ] ✅ **Sistema activo y funcionando**

---

## 📞 Resumen de Cambios

| Componente | Cambio |
|-----------|--------|
| BD | 🆕 Nueva tabla: `correlativo_control` |
| Backend | 🆕 3 archivos nuevos: controlador, rutas, script |
| Frontend | ✏️ Mejoró función `generarNumeroDocumento()` |
| Server | ✏️ Agregó ruta en `server.js` |

**Total de archivos modificados/creados: 11**

---

**¡Listo! Tu sistema de control de correlativo está activo.** 🚀

Para más detalles, consulta:
- `GUIA_CONTROL_CORRELATIVO.md` - Guía completa
- `IMPLEMENTACION_CONTROL_CORRELATIVO.md` - Documentación técnica
