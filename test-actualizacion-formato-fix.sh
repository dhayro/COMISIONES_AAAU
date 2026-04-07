#!/bin/bash

# 🧪 TEST SCRIPT: Validación del Fix de Actualización de Formatos
# Este script prueba que el endpoint PUT funcione correctamente

set -e

BASE_URL="http://172.10.9.11:5000/api"
AUTH_HEADER="Authorization: Bearer test-token"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 TEST: Actualización de Formato de Emisión${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# TEST 1: Obtener formato existente
echo -e "\n${YELLOW}[TEST 1] Obtener formato existente (ID: 2)${NC}"
echo "GET $BASE_URL/formatos-emisiones/2"

RESPONSE=$(curl -s -X GET "$BASE_URL/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER")

if echo "$RESPONSE" | grep -q "error"; then
  echo -e "${RED}❌ FAILED:${NC} $RESPONSE"
else
  echo -e "${GREEN}✅ SUCCESS${NC}"
  echo "Response: $RESPONSE"
  FORMATO_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  echo "Formato ID: $FORMATO_ID"
fi

# TEST 2: Actualizar solo algunos campos (sin detalles)
echo -e "\n${YELLOW}[TEST 2] Actualizar solo lugar y ruta${NC}"
echo "PUT $BASE_URL/formatos-emisiones/2"
echo "Body:"
cat << 'EOF'
{
  "lugar": "Lima Actualizado",
  "ruta": "Nueva Ruta de Prueba"
}
EOF

RESPONSE=$(curl -s -X PUT "$BASE_URL/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "lugar": "Lima Actualizado",
    "ruta": "Nueva Ruta de Prueba"
  }')

echo -e "\nResponse:"
if echo "$RESPONSE" | grep -q "exitosamente"; then
  echo -e "${GREEN}✅ SUCCESS${NC}: $RESPONSE"
else
  echo -e "${RED}❌ FAILED${NC}: $RESPONSE"
fi

# TEST 3: Actualizar con detalles
echo -e "\n${YELLOW}[TEST 3] Actualizar formato con detalles${NC}"
echo "PUT $BASE_URL/formatos-emisiones/2"
echo "Body:"
cat << 'EOF'
{
  "lugar": "Arequipa",
  "detalles": [
    { "clasificador_id": 1, "monto": 500.00 },
    { "clasificador_id": 2, "monto": 300.00 }
  ]
}
EOF

RESPONSE=$(curl -s -X PUT "$BASE_URL/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "lugar": "Arequipa",
    "detalles": [
      { "clasificador_id": 1, "monto": 500.00 },
      { "clasificador_id": 2, "monto": 300.00 }
    ]
  }')

echo -e "\nResponse:"
if echo "$RESPONSE" | grep -q "exitosamente"; then
  echo -e "${GREEN}✅ SUCCESS${NC}: $RESPONSE"
  # Verificar que detalles_actualizados = 2
  if echo "$RESPONSE" | grep -q "detalles_actualizados.*2"; then
    echo -e "${GREEN}✅ Detalles actualizados correctamente (2 registros)${NC}"
  fi
else
  echo -e "${RED}❌ FAILED${NC}: $RESPONSE"
fi

# TEST 4: Actualizar sin cambios (solo timestamp)
echo -e "\n${YELLOW}[TEST 4] Actualizar sin cambios (solo timestamp)${NC}"
echo "PUT $BASE_URL/formatos-emisiones/2"
echo "Body: {}"

RESPONSE=$(curl -s -X PUT "$BASE_URL/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{}')

echo -e "\nResponse:"
if echo "$RESPONSE" | grep -q "exitosamente"; then
  echo -e "${GREEN}✅ SUCCESS${NC}: $RESPONSE"
else
  echo -e "${RED}❌ FAILED${NC}: $RESPONSE"
fi

# TEST 5: Actualizar múltiples campos
echo -e "\n${YELLOW}[TEST 5] Actualizar múltiples campos${NC}"
echo "PUT $BASE_URL/formatos-emisiones/2"
echo "Body:"
cat << 'EOF'
{
  "lugar": "Cusco",
  "modalidad_viaje": "AEREO",
  "num_dias": 5,
  "costo_xdia": 150.00,
  "tipo_emision": "ANTICIPO"
}
EOF

RESPONSE=$(curl -s -X PUT "$BASE_URL/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "lugar": "Cusco",
    "modalidad_viaje": "AEREO",
    "num_dias": 5,
    "costo_xdia": 150.00,
    "tipo_emision": "ANTICIPO"
  }')

echo -e "\nResponse:"
if echo "$RESPONSE" | grep -q "exitosamente"; then
  echo -e "${GREEN}✅ SUCCESS${NC}: $RESPONSE"
else
  echo -e "${RED}❌ FAILED${NC}: $RESPONSE"
fi

# TEST 6: Verificar que formato se actualizó correctamente
echo -e "\n${YELLOW}[TEST 6] Verificar cambios en la BD${NC}"
echo "GET $BASE_URL/formatos-emisiones/2"

RESPONSE=$(curl -s -X GET "$BASE_URL/formatos-emisiones/2" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER")

echo -e "\nVerificando:"
if echo "$RESPONSE" | grep -q '"lugar":"Cusco"'; then
  echo -e "${GREEN}✅ Lugar actualizado a 'Cusco'${NC}"
else
  echo -e "${RED}❌ Lugar NO se actualizó${NC}"
fi

if echo "$RESPONSE" | grep -q '"modalidad_viaje":"AEREO"'; then
  echo -e "${GREEN}✅ Modalidad actualizada a 'AEREO'${NC}"
else
  echo -e "${RED}❌ Modalidad NO se actualizó${NC}"
fi

if echo "$RESPONSE" | grep -q '"num_dias":5'; then
  echo -e "${GREEN}✅ Número de días actualizado a 5${NC}"
else
  echo -e "${RED}❌ Número de días NO se actualizó${NC}"
fi

# TEST 7: Verificar detalles en la BD
echo -e "\n${YELLOW}[TEST 7] Verificar detalles en BD${NC}"
echo "Query SQL simulada: SELECT * FROM formato_emisiones_detalles WHERE formato_emision_id = 2"
echo ""
echo -e "${BLUE}Nota: Ejecutar en la BD para verificar:${NC}"
echo "SELECT COUNT(*) as total_detalles FROM formato_emisiones_detalles WHERE formato_emision_id = 2;"
echo "SELECT * FROM formato_emisiones_detalles WHERE formato_emision_id = 2;"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}✅ Tests completados${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Verificar logs del servidor en: /var/log/formatos-emisiones.log"
echo "2. Ejecutar queries SQL para validar datos en BD"
echo "3. Probar el flujo completo desde el frontend"
