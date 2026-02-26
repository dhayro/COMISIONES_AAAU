#!/bin/bash

# Test script para endpoint de reportes

echo "================================================"
echo "Prueba del Endpoint de Reportes Presupuestos"
echo "================================================"
echo ""

# Reemplazar con tu token real
TOKEN="tu_bearer_token_aqui"

# Fechas de prueba
FECHA_INICIO="2024-01-01"
FECHA_FIN="2024-12-31"

echo "📅 Rango de fechas:"
echo "   Inicio: $FECHA_INICIO"
echo "   Fin: $FECHA_FIN"
echo ""

echo "🔗 Endpoint: /api/reportes/presupuestos"
echo ""

echo "📡 Realizando petición..."
curl -X GET "http://localhost:3001/api/reportes/presupuestos?fechaInicio=$FECHA_INICIO&fechaFin=$FECHA_FIN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n"

echo ""
echo "================================================"
echo "Prueba completada"
echo "================================================"

