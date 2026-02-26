#!/bin/bash

# Script de prueba para endpoints PUT

echo "======================================"
echo "🧪 PRUEBAS DE ENDPOINTS PUT"
echo "======================================"

# URL base
BASE_URL="http://localhost:5000/api"

# Token (reemplaza con tu token válido)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkaGF5cm8ua29uZ0Bob3RtYWlsLmNvbSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzAzOTc4OTgsImV4cCI6MTc3MTAwMjY5OH0.wjsSfwVk2LypVFR6ojY87cZ7tFS4yvjKbBIik438ziE"

echo ""
echo "1️⃣ ACTUALIZAR ÁMBITO (ID: 1)"
echo "================================"
curl -X PUT "$BASE_URL/ambitos/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "ALA PUCALLPA ACTUALIZADO"
  }' \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "2️⃣ ACTUALIZAR CLASIFICADOR (ID: 1)"
echo "===================================="
curl -X PUT "$BASE_URL/clasificadores/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "VIÁTICOS ACTUALIZADO",
    "partida": "23.2.1.2.2"
  }' \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "3️⃣ VERIFICAR CAMBIOS - OBTENER ÁMBITO ACTUALIZADO"
echo "=================================================="
curl -X GET "$BASE_URL/ambitos/1" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "4️⃣ VERIFICAR CAMBIOS - OBTENER CLASIFICADOR ACTUALIZADO"
echo "========================================================"
curl -X GET "$BASE_URL/clasificadores/1" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "======================================"
echo "✅ PRUEBAS COMPLETADAS"
echo "======================================"
