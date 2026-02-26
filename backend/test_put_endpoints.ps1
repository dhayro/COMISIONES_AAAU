# Script de prueba para endpoints PUT (Windows PowerShell)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🧪 PRUEBAS DE ENDPOINTS PUT" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# URL base
$BaseUrl = "http://localhost:5000/api"

# Token (reemplaza con tu token válido)
$Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkaGF5cm8ua29uZ0Bob3RtYWlsLmNvbSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzAzOTc4OTgsImV4cCI6MTc3MTAwMjY5OH0.wjsSfwVk2LypVFR6ojY87cZ7tFS4yvjKbBIik438ziE"

Write-Host ""
Write-Host "1️⃣ ACTUALIZAR ÁMBITO (ID: 1)" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $Token"
}

$body = @{
    "nombre" = "ALA PUCALLPA ACTUALIZADO"
} | ConvertTo-Json

Write-Host "Request: PUT $BaseUrl/ambitos/1" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/ambitos/1" `
        -Method PUT `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response: $($_.Exception.Response.Content.ReadAsStringAsync().Result)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2️⃣ ACTUALIZAR CLASIFICADOR (ID: 1)" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

$body2 = @{
    "nombre" = "VIÁTICOS ACTUALIZADO"
    "partida" = "23.2.1.2.2"
} | ConvertTo-Json

Write-Host "Request: PUT $BaseUrl/clasificadores/1" -ForegroundColor Gray
Write-Host "Body: $body2" -ForegroundColor Gray

try {
    $response2 = Invoke-WebRequest -Uri "$BaseUrl/clasificadores/1" `
        -Method PUT `
        -Headers $headers `
        -Body $body2 `
        -ErrorAction Stop
    
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host $response2.Content -ForegroundColor Green
    Write-Host "Status Code: $($response2.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response: $($_.Exception.Response.Content.ReadAsStringAsync().Result)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3️⃣ VERIFICAR CAMBIOS - OBTENER ÁMBITO" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

try {
    $response3 = Invoke-WebRequest -Uri "$BaseUrl/ambitos/1" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host $response3.Content -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4️⃣ VERIFICAR CAMBIOS - OBTENER CLASIFICADOR" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

try {
    $response4 = Invoke-WebRequest -Uri "$BaseUrl/clasificadores/1" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host $response4.Content -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
