#!/bin/bash

##############################################################################
# EJEMPLOS DE PRUEBA - API METAS
# Script con ejemplos de cURL para probar todos los endpoints
# 
# Uso: bash backend/types/test-metas-api.sh
##############################################################################

# Configuración
API_URL="http://localhost:5000/api"
TOKEN="YOUR_JWT_TOKEN_HERE"  # Reemplazar con token válido

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

##############################################################################
# 1. LISTAR TODAS LAS METAS
##############################################################################
echo -e "${BLUE}=== TEST 1: Listar todas las metas ===${NC}"
echo "Endpoint: GET /api/metas"
echo "Comando:"
echo "curl -X GET $API_URL/metas \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo "Ejecutar:"
curl -X GET "$API_URL/metas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

##############################################################################
# 2. OBTENER META POR ID
##############################################################################
echo -e "${BLUE}=== TEST 2: Obtener meta por ID ===${NC}"
META_ID=1
echo "Endpoint: GET /api/metas/:id"
echo "Parámetro: id = $META_ID"
echo "Comando:"
echo "curl -X GET $API_URL/metas/$META_ID \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo "Ejecutar:"
curl -X GET "$API_URL/metas/$META_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

##############################################################################
# 3. CREAR NUEVA META
##############################################################################
echo -e "${BLUE}=== TEST 3: Crear nueva meta ===${NC}"
echo "Endpoint: POST /api/metas"
echo "Comando:"
echo "curl -X POST $API_URL/metas \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{ ... }'"
echo ""
echo "JSON Body:"
cat << 'EOF'
{
  "nombre": "Meta Local - Autoridad Local de Agua Pucallpa",
  "numero_meta": "069",
  "periodo": "2026",
  "ambito_id": 4
}
EOF
echo ""
echo "Ejecutar:"
curl -X POST "$API_URL/metas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Meta Local - Autoridad Local de Agua Pucallpa",
    "numero_meta": "069",
    "periodo": "2026",
    "ambito_id": 4
  }' | jq .
echo ""
echo ""

##############################################################################
# 4. ACTUALIZAR META
##############################################################################
echo -e "${BLUE}=== TEST 4: Actualizar meta ===${NC}"
META_ID=1
echo "Endpoint: PUT /api/metas/:id"
echo "Parámetro: id = $META_ID"
echo "Comando:"
echo "curl -X PUT $API_URL/metas/$META_ID \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{ ... }'"
echo ""
echo "JSON Body:"
cat << 'EOF'
{
  "nombre": "Meta Local - Autoridad Local de Agua Perené (Actualizada)",
  "periodo": "2026"
}
EOF
echo ""
echo "Ejecutar:"
curl -X PUT "$API_URL/metas/$META_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Meta Local - Autoridad Local de Agua Perené (Actualizada)",
    "periodo": "2026"
  }' | jq .
echo ""
echo ""

##############################################################################
# 5. ELIMINAR META
##############################################################################
echo -e "${BLUE}=== TEST 5: Eliminar meta ===${NC}"
META_ID=1
echo "Endpoint: DELETE /api/metas/:id"
echo "Parámetro: id = $META_ID"
echo "Comando:"
echo "curl -X DELETE $API_URL/metas/$META_ID \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo "Ejecutar:"
curl -X DELETE "$API_URL/metas/$META_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

##############################################################################
# PRUEBAS DE ERROR
##############################################################################

echo -e "${YELLOW}=== PRUEBAS DE ERROR ===${NC}"
echo ""

echo -e "${BLUE}--- TEST E1: Obtener meta inexistente ---${NC}"
curl -X GET "$API_URL/metas/99999" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
echo ""

echo -e "${BLUE}--- TEST E2: Crear meta sin campos requeridos ---${NC}"
curl -X POST "$API_URL/metas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Meta sin número"
  }' | jq .
echo ""

echo -e "${BLUE}--- TEST E3: Crear meta con número inválido (no 3 dígitos) ---${NC}"
curl -X POST "$API_URL/metas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Meta con número inválido",
    "numero_meta": "67",
    "periodo": "2026"
  }' | jq .
echo ""

echo -e "${BLUE}--- TEST E4: Sin token de autenticación ---${NC}"
curl -X GET "$API_URL/metas" \
  -H "Content-Type: application/json" | jq .
echo ""

##############################################################################
# GUÍA DE VALIDACIÓN DE RESPUESTAS
##############################################################################

echo -e "${GREEN}=== GUÍA DE VALIDACIÓN ===${NC}"
cat << 'EOF'

✅ RESPUESTAS EXITOSAS:

1. GET /metas (200)
   - Array de objetos Meta
   - Cada meta tiene: id, nombre, numero_meta, periodo, ambito_id, ambito_nombre, activo

2. GET /metas/{id} (200)
   - Objeto Meta individual
   - Mismo esquema que arriba

3. POST /metas (201)
   - Objeto con estructura:
     {
       "mensaje": "Meta creada exitosamente",
       "meta": { ...Meta object... }
     }

4. PUT /metas/{id} (200)
   - Mismo que POST

5. DELETE /metas/{id} (200)
   - Objeto con estructura:
     {
       "mensaje": "Meta eliminada exitosamente"
     }

❌ RESPUESTAS DE ERROR:

- 400 Bad Request
  Campos requeridos faltantes o formato inválido

- 401 Unauthorized
  Token no válido o no proporcionado

- 404 Not Found
  Meta no encontrada

- 500 Internal Server Error
  Error del servidor

EOF

echo ""
echo -e "${GREEN}=== FIN DE PRUEBAS ===${NC}"
