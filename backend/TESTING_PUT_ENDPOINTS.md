# 🔧 Guía de Prueba - Endpoints PUT

## Problema Identificado
Los endpoints PUT no mostraban respuesta en Swagger.

## Soluciones Implementadas

### 1. **Mejorado el Controller de Clasificadores**
- Ahora valida que al menos `nombre` o `partida` se proporcionen
- Obtiene el clasificador actual antes de actualizar (para merge de datos)
- Verifica si el clasificador existe (404 si no)
- Retorna los datos actualizados en la respuesta
- Agregado logging para debug

**Cambios:**
```javascript
// ANTES: Requería ambos campos y no retornaba datos
if (!partida || !nombre) {
  return res.status(400).json({ error: 'Partida y nombre son requeridos' });
}

// DESPUÉS: Solo requiere uno, retorna datos actualizados
if (!partida && !nombre) {
  return res.status(400).json({ error: 'Debe proporcionar al menos partida o nombre' });
}

// Verifica existencia y retorna datos
const clasificadorActual = await Clasificador.obtenerPorId(id);
if (!clasificadorActual) {
  return res.status(404).json({ error: 'Clasificador no encontrado' });
}

res.json({ 
  mensaje: 'Clasificador actualizado exitosamente',
  clasificador: datosActualizados
});
```

### 2. **Mejorado el Controller de Ambitos**
- Valida que `nombre` no esté vacío
- Verifica existencia antes de actualizar
- Retorna los datos actualizados
- Agregado logging para debug

### 3. **Agregado Logging**
Ahora los controllers imprimen en consola:
```
📝 Actualizando clasificador ID: 1
📋 Datos recibidos: { nombre: 'NUEVO NOMBRE', partida: '23.2.1.2.2' }
✏️ Datos a actualizar: { nombre: 'NUEVO NOMBRE', partida: '23.2.1.2.2' }
✅ Clasificador actualizado exitosamente
```

## Cómo Probar

### Opción 1: Usando Swagger UI
1. Abre: `http://localhost:5000/api-docs`
2. Ve a `PUT /clasificadores/{id}`
3. Ingresa el ID (ej: 1)
4. Ingresa el body:
```json
{
  "nombre": "NUEVO NOMBRE",
  "partida": "23.2.1.2.2"
}
```
5. Haz clic en "Execute"
6. Verifica la respuesta (debería ser 200 con los datos actualizados)
7. Abre la consola del servidor para ver los logs

### Opción 2: Usando PowerShell (Windows)
```powershell
cd d:\COMISIONES_AAAU\backend
.\test_put_endpoints.ps1
```

### Opción 3: Usando cURL (Terminal)
```bash
curl -X PUT http://localhost:5000/api/clasificadores/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{"nombre":"NUEVO NOMBRE","partida":"23.2.1.2.2"}'
```

### Opción 4: Usando JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:5000/api/clasificadores/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <tu_token>'
  },
  body: JSON.stringify({
    nombre: 'NUEVO NOMBRE',
    partida: '23.2.1.2.2'
  })
});

const data = await response.json();
console.log(data);
```

## Respuestas Esperadas

### ✅ Éxito (200)
```json
{
  "mensaje": "Clasificador actualizado exitosamente",
  "clasificador": {
    "partida": "23.2.1.2.2",
    "nombre": "VIÁTICOS ACTUALIZADO",
    "descripcion": null
  }
}
```

### ❌ Errores Posibles

**400 - Bad Request (Faltan campos)**
```json
{
  "error": "Debe proporcionar al menos partida o nombre"
}
```

**404 - Not Found (No existe)**
```json
{
  "error": "Clasificador no encontrado"
}
```

**401 - Unauthorized (Token inválido)**
```json
{
  "error": "Token no válido"
}
```

## Verificación de Cambios

Después de actualizar, verifica que los cambios se guardaron:

```bash
# GET /api/clasificadores/1
curl -X GET http://localhost:5000/api/clasificadores/1 \
  -H "Authorization: Bearer <tu_token>"
```

Debería retornar los datos actualizados.

## Endpoints Similares Mejorados

Todos estos endpoints ahora tienen el mismo patrón mejorado:

- ✅ `PUT /api/ambitos/{id}`
- ✅ `PUT /api/clasificadores/{id}`
- ✅ `PUT /api/comisiones/{id}`
- ✅ `PUT /api/comisionados/{id}`

## Logs en Consola del Servidor

Abre una terminal donde esté corriendo nodemon y verás:

```
📝 Actualizando clasificador ID: 1
📋 Datos recibidos: { nombre: 'VIÁTICOS ACTUALIZADO', partida: '23.2.1.2.2' }
✏️ Datos a actualizar: { nombre: 'VIÁTICOS ACTUALIZADO', partida: '23.2.1.2.2' }
✅ Clasificador actualizado exitosamente
```

Si hay error, verás:
```
❌ Error al actualizar: [mensaje de error]
```

## Troubleshooting

Si los PUT aún no funcionan:

1. **Verifica que el servidor esté corriendo:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Verifica el token:** 
   - El token debe ser válido y no expirado
   - Obtén uno nuevo en `POST /api/auth/login`

3. **Verifica los logs del servidor:**
   - Deberías ver los logs con 📝, ✏️, ✅ o ❌

4. **Verifica la base de datos:**
   - El registro debe existir antes de actualizar
   - Usa `GET /api/clasificadores/1` para verificar

## Próximos Pasos

Una vez confirmados los PUT, los mismos patrones se aplicarán a:
- Actualización de comisiones
- Actualización de comisionados
- Cualquier otro endpoint que requiera edición
