#!/bin/bash

# Script para probar el endpoint de Presupuestos Asignados
# Uso: ./test-presupuestos-asignados.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_URL="http://localhost:5000/api/comisiones"
FECHAINI="2026-01-01"
FECHAFIN="2026-02-28"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   TEST: Reporte Presupuestos Asignados${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Verificar si el token está disponible
TOKEN="${AUTH_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠️  No se encontró token. Usando token de prueba...${NC}"
  # Para pruebas, debes loguear primero
  echo -e "${RED}❌ Debes establecer AUTH_TOKEN antes de ejecutar este script${NC}"
  echo -e "${YELLOW}Ejemplo:${NC}"
  echo "  export AUTH_TOKEN='tu_token_jwt'"
  echo "  ./test-presupuestos-asignados.sh"
  exit 1
fi

echo -e "${YELLOW}📋 Parámetros:${NC}"
echo "  Fecha Inicio: ${FECHAINI}"
echo "  Fecha Fin:    ${FECHAFIN}"
echo "  API URL:      ${API_URL}/reportes/presupuestos-asignados"
echo ""

# Test 1: Obtener reporte de presupuestos asignados
echo -e "${BLUE}Test 1: Obtener reporte de presupuestos asignados${NC}"
echo -e "${YELLOW}GET /reportes/presupuestos-asignados${NC}"
echo ""

RESPONSE=$(curl -s -X GET \
  "${API_URL}/reportes/presupuestos-asignados?fechaInicio=${FECHAINI}&fechaFin=${FECHAFIN}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo -e "${YELLOW}Respuesta:${NC}"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
  success=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✅ Test exitoso${NC}"
    
    # Extraer datos
    totalComisiones=$(echo "$RESPONSE" | jq '.resumen.totalComisiones' 2>/dev/null)
    totalMonto=$(echo "$RESPONSE" | jq '.resumen.totalMonto' 2>/dev/null)
    totalComisionados=$(echo "$RESPONSE" | jq '.resumen.totalComisionados' 2>/dev/null)
    
    echo ""
    echo -e "${GREEN}📊 Resumen:${NC}"
    echo "  Total Comisiones: ${totalComisiones}"
    echo "  Total Monto: ${totalMonto}"
    echo "  Total Comisionados: ${totalComisionados}"
  else
    echo -e "${RED}❌ Test fallido${NC}"
  fi
else
  echo -e "${RED}❌ Error en la respuesta${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Test 2: Sin parámetros (debe fallar)
echo -e "${BLUE}Test 2: Sin parámetros (debe retornar error)${NC}"
echo -e "${YELLOW}GET /reportes/presupuestos-asignados${NC}"
echo ""

RESPONSE2=$(curl -s -X GET \
  "${API_URL}/reportes/presupuestos-asignados" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo -e "${YELLOW}Respuesta esperada (error):${NC}"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Test 3: Fechas en formato incorrecto
echo -e "${BLUE}Test 3: Formato de fecha incorrecto (debe retornar error)${NC}"
echo -e "${YELLOW}GET /reportes/presupuestos-asignados?fechaInicio=01-01-2026&fechaFin=28-02-2026${NC}"
echo ""

RESPONSE3=$(curl -s -X GET \
  "${API_URL}/reportes/presupuestos-asignados?fechaInicio=01-01-2026&fechaFin=28-02-2026" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo -e "${YELLOW}Respuesta esperada (error):${NC}"
echo "$RESPONSE3" | jq '.' 2>/dev/null || echo "$RESPONSE3"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Tests completados${NC}"
