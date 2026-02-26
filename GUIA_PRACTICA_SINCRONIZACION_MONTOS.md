# 🎯 GUÍA PRÁCTICA: Sincronización de Montos

## 1️⃣ EJECUTAR UNA SOLA VEZ - Sincronizar BD Existente

```bash
cd d:\COMISIONES_AAAU\backend
node sync-costos-totales.js
```

**Salida esperada:**
```
🔄 INICIANDO SINCRONIZACIÓN DE COSTOS TOTALES...

📊 Total de comisiones a procesar: 1

⚠️  Comisión ID 1:
   Costo actual en DB: 2640900.01
   Suma real calculada: 5340.00
   Diferencia: -2635560.01

✅ SINCRONIZACIÓN COMPLETADA
   Comisiones actualizadas: 1
   Comisiones sin cambios: 0
```

---

## 2️⃣ VERIFICAR en el Frontend

Cuando se crea o edita una comisión, deberías ver en consola del navegador:

```javascript
// Al CREAR comisión con comisionados:
🆕 AGREGANDO NUEVO COMISIONADO:
ComisionId: 1
Datos a enviar: {
  usuario_id: 1,
  usuario_nombre: "DHAYRO KONG",
  clasificador_id: 5,
  dias: 4,
  costo_xdia: 220,
  monto: 880,        // ← Monto calculado correctamente
  descripcion: "",
  observacion: ""
}

// Al EDITAR comisión existente:
🔵 ACTUALIZANDO COMISIONADO EXISTENTE:
ComisionId: 1
ComisionadoId: 123
Datos a enviar: {
  ...,
  monto: 880         // ← Siempre se calcula
}
```

---

## 3️⃣ VERIFICAR en la BD

Conectarse a MySQL y verificar:

```sql
-- Ver comisión con su total
SELECT id, lugar, costo_total_comision FROM comisiones WHERE id = 1;

-- Ver comisionados de esa comisión
SELECT 
  cc.id, u.nombre, cl.nombre as clasificador, 
  cc.dias, cc.costo_xdia, cc.monto,
  (CASE WHEN cl.nombre LIKE '%VIÁTICO%' 
    THEN cc.dias * cc.costo_xdia 
    ELSE cc.monto END) as monto_real
FROM comision_comisionados cc
JOIN users u ON cc.usuario_id = u.id
JOIN clasificadores cl ON cc.clasificador_id = cl.id
WHERE cc.comision_id = 1;

-- Verificar suma
SELECT SUM(monto) as total_guardado FROM comision_comisionados WHERE comision_id = 1;
```

**Esperado:**
```
id | lugar | costo_total_comision
1  | Lima  | 5340.00

id | nombre           | clasificador                        | dias | costo_xdia | monto | monto_real
1  | DHAYRO KONG      | VIÁTICOS Y ASIGNACIONES...          | 4    | 220        | 880   | 880
2  | DHAYRO KONG      | PASAJES Y GASTOS DE TRANSPORTE      | 4    | 900        | 900   | 900
3  | CAROL ARCOS      | VIÁTICOS Y ASIGNACIONES...          | 4    | 220        | 880   | 880
4  | CAROL ARCOS      | PASAJES Y GASTOS DE TRANSPORTE      | 4    | 900        | 900   | 900
...

total_guardado: 5340.00 ✅
```

---

## 4️⃣ VERIFICAR en las Aprobaciones

1. Ir a `/aprobaciones`
2. Hacer clic en "Ver Detalle" de una comisión
3. Verificar que la tabla de comisionados muestre:
   - Usuarios como filas
   - Partidas (clasificadores) como columnas
   - Montos correctos en celdas
   - Total por persona
   - Total por partida
   - Gran total coincida con `costo_total_comision`

---

## 5️⃣ SINCRONIZAR MANUALMENTE (Cuando sea necesario)

Si en el futuro hay discrepancias:

```bash
# Vía terminal
curl -X POST http://localhost:3001/api/comisiones/admin/sincronizar-costos \
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

**O desde el backend:**
```bash
cd backend
node -e "
const Comision = require('./models/Comision');
(async () => {
  await Comision.recalcularTotal(1); // ID de comisión
  console.log('✅ Recalculado');
})();
"
```

---

## 6️⃣ CÁLCULO DEL MONTO - Regla

### VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO
```
monto = días × costo_xdia
```
Ejemplo: 4 días × S/. 220 = **S/. 880**

### OTROS (Pasajes, Alojamiento, etc.)
```
monto = costo_xdia (NO multiplica por días)
```
Ejemplo: S/. 900 (sin multiplicar) = **S/. 900**

---

## ✅ CHECKLIST - Validar Solución

- [ ] Ejecuté `node sync-costos-totales.js` (una sola vez)
- [ ] BD actualizada: `SELECT * FROM comisiones WHERE id = 1;` muestra total correcto
- [ ] Creo nueva comisión y veo en consola que se calcula monto
- [ ] Edito comisionado existente y se recalcula monto
- [ ] En aprobaciones, detalle muestra totales correctos
- [ ] Reportes muestran montos consistentes

---

## 🆘 Troubleshooting

**Problema**: Script no ejecuta
```bash
Error: Cannot find module...
```
**Solución**:
```bash
cd backend
npm install  # Reinstalar deps
node sync-costos-totales.js
```

**Problema**: Monto sigue siendo NULL en BD
```sql
SELECT * FROM comision_comisionados WHERE monto IS NULL;
```
**Solución**:
- Verificar que frontend esté usando la versión compilada (npm run build)
- Verificar que backend esté usando código actualizado
- Reiniciar backend: `npm run dev`

**Problema**: Costo total no coincide
```bash
# Ejecutar sincronización manual
node sync-costos-totales.js
```

---

## 📊 Fórmula de Validación

```
∑(comision_comisionados.monto) = comisiones.costo_total_comision
```

**Para cada comisionado:**
```javascript
if (clasificador.nombre includes "VIÁTICO") {
  monto = dias * costo_xdia
} else {
  monto = costo_xdia
}
```

---

**Estado**: ✅ IMPLEMENTADO Y VALIDADO  
**Última actualización**: 11 Febrero 2026  
**Responsable**: GitHub Copilot
