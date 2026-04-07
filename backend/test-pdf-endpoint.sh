#!/bin/bash

# Script para verificar el guardado de PDF
# Uso: bash test-pdf-endpoint.sh

echo "================================================"
echo "🧪 TEST: Guardado de PDF"
echo "================================================"
echo ""

# Variables
BACKEND_URL="http://localhost:5000"
TOKEN=${1:-}  # Primer argumento: token
CERT_ID=${2:-1}  # Segundo argumento: ID de certificación
PDF_FILE=${3:-"test.pdf"}  # Tercer argumento: archivo PDF

if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: Token no proporcionado"
    echo "Uso: bash test-pdf-endpoint.sh <token> <certificacion_id> <archivo_pdf>"
    echo ""
    echo "Ejemplo:"
    echo "  bash test-pdf-endpoint.sh 'eyJhbGc...' 123 /ruta/test.pdf"
    echo ""
    exit 1
fi

if [ ! -f "$PDF_FILE" ]; then
    echo "❌ ERROR: Archivo PDF no encontrado: $PDF_FILE"
    exit 1
fi

echo "📝 Configuración:"
echo "   Backend: $BACKEND_URL"
echo "   Token: ${TOKEN:0:20}..."
echo "   Certificación ID: $CERT_ID"
echo "   PDF: $PDF_FILE"
echo ""

echo "📤 Enviando PDF al backend..."
echo ""

# Hacer la petición
RESPONSE=$(curl -X POST \
  "$BACKEND_URL/api/pdf/guardar-certificacion-pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -F "archivo=@$PDF_FILE" \
  -F "certificacion_id=$CERT_ID" \
  -w "\n%{http_code}" \
  2>/dev/null)

# Separar respuesta y código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "📋 Respuesta:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Evaluar resultado
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS: PDF guardado correctamente"
    exit 0
else
    echo "❌ ERROR: Código HTTP $HTTP_CODE"
    exit 1
fi
