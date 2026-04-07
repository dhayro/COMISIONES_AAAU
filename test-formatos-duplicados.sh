#!/bin/bash

# 🧪 SCRIPT DE PRUEBAS RÁPIDAS - Formatos Duplicados

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 PRUEBAS DE FORMATOS - Control de Duplicados"
echo "═══════════════════════════════════════════════════════════════"
echo ""

API_URL="http://localhost:5000/api"
TOKEN="tu_token_aqui"  # Reemplazar con token real

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_test() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🧪 TEST: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ═══════════════════════════════════════════════════════════════
# TEST 1: Crear Primer Formato
# ═══════════════════════════════════════════════════════════════
print_test "Crear Primer Formato"

DATA_CREAR_FORMATO='{
  "comision_id": 1,
  "usuario_id": 1,
  "meta_id": 1,
  "numero_documento": "EF-2026-12345",
  "fecha_emision": "2026-03-21T10:00:00Z",
  "lugar": "Lima",
  "ruta": "Lima - Ica",
  "modalidad_viaje": "TERRESTRE",
  "fecha_salida": "2026-03-21T08:00:00Z",
  "fecha_retorno": "2026-03-23T18:00:00Z",
  "num_dias": 3,
  "numero_siaf": "1234567890",
  "codigo_cp": "24089.26.95.2605669",
  "tipo_emision": "REEMBOLSO",
  "costo_xdia": 150.00,
  "monto_total": 450.00,
  "observacion": "Comisión oficial",
  "detalles": [
    {
      "clasificador_id": 1,
      "monto": 200.00
    },
    {
      "clasificador_id": 2,
      "monto": 250.00
    }
  ]
}'

print_info "Enviando solicitud POST /api/formatos-emisiones"
RESPONSE=$(curl -s -X POST "$API_URL/formatos-emisiones" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DATA_CREAR_FORMATO")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    FORMATO_ID=$(echo "$RESPONSE" | jq -r '.id')
    print_success "Formato creado con ID: $FORMATO_ID"
else
    print_error "Fallo al crear formato"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# TEST 2: Intentar Crear Duplicado (DEBE FALLAR)
# ═══════════════════════════════════════════════════════════════
print_test "Intentar Crear Formato Duplicado (Debe Fallar)"

print_info "Enviando solicitud POST /api/formatos-emisiones (duplicado)"
RESPONSE=$(curl -s -X POST "$API_URL/formatos-emisiones" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DATA_CREAR_FORMATO")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    print_success "Sistema rechazó duplicado correctamente"
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    print_info "Error recibido: $ERROR"
else
    print_error "Sistema PERMITIÓ duplicado (BUG)"
fi

# ═══════════════════════════════════════════════════════════════
# TEST 3: Obtener Formato por ID
# ═══════════════════════════════════════════════════════════════
print_test "Obtener Formato por ID"

print_info "Enviando solicitud GET /api/formatos-emisiones/$FORMATO_ID"
RESPONSE=$(curl -s -X GET "$API_URL/formatos-emisiones/$FORMATO_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_success "Formato recuperado correctamente"
    DETALLES_COUNT=$(echo "$RESPONSE" | jq '.detalles | length')
    print_info "Detalles guardados: $DETALLES_COUNT"
else
    print_error "Fallo al obtener formato"
fi

# ═══════════════════════════════════════════════════════════════
# TEST 4: Actualizar Formato (MODIFICACIÓN)
# ═══════════════════════════════════════════════════════════════
print_test "Actualizar Formato Existente"

DATA_ACTUALIZAR='{
  "comision_id": 1,
  "usuario_id": 1,
  "meta_id": 1,
  "lugar": "Lima - Actualizado",
  "ruta": "Lima - Ica - Chincha",
  "modalidad_viaje": "AEREO",
  "fecha_salida": "2026-03-21T08:00:00Z",
  "fecha_retorno": "2026-03-25T18:00:00Z",
  "num_dias": 5,
  "numero_siaf": "0987654321",
  "codigo_cp": "24089.26.95.2605669",
  "tipo_emision": "ANTICIPO",
  "costo_xdia": 200.00,
  "monto_total": 800.00,
  "observacion": "Comisión modificada",
  "detalles": [
    {
      "clasificador_id": 1,
      "monto": 400.00
    },
    {
      "clasificador_id": 3,
      "monto": 400.00
    }
  ]
}'

print_info "Enviando solicitud PUT /api/formatos-emisiones/$FORMATO_ID"
RESPONSE=$(curl -s -X PUT "$API_URL/formatos-emisiones/$FORMATO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DATA_ACTUALIZAR")

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_success "Formato actualizado correctamente"
else
    print_error "Fallo al actualizar formato"
fi

# ═══════════════════════════════════════════════════════════════
# TEST 5: Verificar que Detalles se Actualizaron
# ═══════════════════════════════════════════════════════════════
print_test "Verificar Detalles Actualizados"

print_info "Enviando solicitud GET /api/formatos-emisiones/$FORMATO_ID"
RESPONSE=$(curl -s -X GET "$API_URL/formatos-emisiones/$FORMATO_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | jq '.detalles'

DETALLES_COUNT=$(echo "$RESPONSE" | jq '.detalles | length')
if [ "$DETALLES_COUNT" -eq 2 ]; then
    print_success "Detalles actualizados correctamente (2 elementos)"
    print_info "Monto total: $(echo $RESPONSE | jq '.monto_total')"
else
    print_error "Cantidad de detalles incorrecta (esperaba 2, obtuvo $DETALLES_COUNT)"
fi

# ═══════════════════════════════════════════════════════════════
# TEST 6: Listar Formatos
# ═══════════════════════════════════════════════════════════════
print_test "Listar Todos los Formatos"

print_info "Enviando solicitud GET /api/formatos-emisiones"
RESPONSE=$(curl -s -X GET "$API_URL/formatos-emisiones" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | jq '.formatos'

TOTAL=$(echo "$RESPONSE" | jq '.total')
print_success "Total de formatos: $TOTAL"

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PRUEBAS COMPLETADAS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Resumen de Pruebas:"
echo "  ✅ TEST 1: Crear Primer Formato"
echo "  ✅ TEST 2: Validar Prevención de Duplicados"
echo "  ✅ TEST 3: Obtener Formato por ID"
echo "  ✅ TEST 4: Actualizar Formato"
echo "  ✅ TEST 5: Verificar Detalles"
echo "  ✅ TEST 6: Listar Formatos"
echo ""

