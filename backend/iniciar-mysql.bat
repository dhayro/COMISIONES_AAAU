@echo off
REM Script para iniciar MySQL en Windows

echo.
echo ====================================
echo Iniciando MySQL Server...
echo ====================================
echo.

REM Intenta iniciar el servicio de MySQL
net start MySQL80

if %errorlevel% equ 0 (
    echo.
    echo ✓ MySQL iniciado exitosamente
) else (
    echo.
    echo ! MySQL podría ya estar en ejecucion
)

REM Verifica la conexión
echo.
echo Verificando conexión a MySQL...
echo.

timeout /t 2 /nobreak

REM Verifica con comandos de consola si está disponible
(
    echo SELECT VERSION^(^);
    echo EXIT;
) | mysql -u root 2>nul

if %errorlevel% equ 0 (
    echo ✓ Conexión a MySQL exitosa
) else (
    echo ! No se pudo conectar a MySQL
    echo.
    echo Alternativas:
    echo 1. Asegúrate de que MySQL está instalado
    echo 2. Si usas MySQL en PATH diferente, ajusta en este script
    echo 3. Inicia MySQL manualmente desde Services (services.msc)
)

pause
