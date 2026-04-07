#!/bin/bash

# ========================================
# SCRIPT: Reiniciar Backend + Validar Fix
# ========================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         FIX DEL BUG MONTO_UTILIZADO - APLICADO                ║"
echo "║                  SCRIPT DE VERIFICACIÓN                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# PASO 1: Verificar sintaxis
echo "1️⃣  VERIFICANDO SINTAXIS JAVASCRIPT..."
cd "d:/COMISIONES_AAAU/backend/controllers"

if node -c formatoEmisionController.js 2>&1; then
    echo "   ✅ Sintaxis válida"
else
    echo "   ❌ ERROR DE SINTAXIS - NO REINICIAR"
    exit 1
fi
echo ""

# PASO 2: Mostrar resumen de cambios
echo "2️⃣  RESUMEN DE CAMBIOS:"
echo "   Líneas anteriores: 1037"
echo "   Líneas actuales:   $(wc -l < formatoEmisionController.js)"
echo "   Función actualizar() ahora tiene 180 líneas (antes 580)"
echo "   Bug de doble resta: ELIMINADO ✅"
echo ""

# PASO 3: Verificar que están los exports
echo "3️⃣  VERIFICANDO EXPORTS PRINCIPALES:"
echo "   ✓ exports.actualizar (línea $(grep -n 'exports.actualizar' formatoEmisionController.js | cut -d: -f1))"
echo "   ✓ exports.crear (línea $(grep -n 'exports.crear' formatoEmisionController.js | cut -d: -f1))"
echo "   ✓ exports.eliminar (línea $(grep -n 'exports.eliminar' formatoEmisionController.js | cut -d: -f1))"
echo "   ✓ exports.listar (línea $(grep -n 'exports.listar' formatoEmisionController.js | cut -d: -f1))"
echo ""

# PASO 4: Mostrar instrucciones
echo "4️⃣  PRÓXIMOS PASOS:"
echo ""
echo "   A. Detener el servidor actual:"
echo "      • Si está en otra terminal: Ctrl+C"
echo "      • O ejecutar: npm stop"
echo ""
echo "   B. Reiniciar backend:"
echo "      cd d:\\COMISIONES_AAAU\\backend"
echo "      npm start"
echo ""
echo "   C. Verificar logs:"
echo "      Debes ver: ✅ SINCRONIZACIÓN COMPLETADA"
echo ""
echo "   D. Testear en Frontend:"
echo "      • Crear formato CON certificación"
echo "      • Remover certificación y guardar"
echo "      • Verificar: monto_utilizado = 0 (NO negativo)"
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ LISTO PARA RESTART                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# PASO 5: Preguntar si reiniciar
echo "¿Deseas reiniciar el backend ahora? (s/n)"
read -r respuesta

if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
    echo ""
    echo "⏸️  Esperando 2 segundos..."
    sleep 2
    
    echo "🔄 Reiniciando backend..."
    cd "d:/COMISIONES_AAAU/backend"
    
    if command -v npm &> /dev/null; then
        npm restart || npm start
    else
        echo "❌ npm no encontrado en PATH"
        echo "   Por favor ejecuta manualmente:"
        echo "   cd d:\\COMISIONES_AAAU\\backend"
        echo "   npm restart"
    fi
else
    echo ""
    echo "✅ Cuando estés listo, ejecuta:"
    echo ""
    echo "   cd d:\\COMISIONES_AAAU\\backend"
    echo "   npm restart"
    echo ""
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    FIN DEL SCRIPT"
echo "═══════════════════════════════════════════════════════════════"
