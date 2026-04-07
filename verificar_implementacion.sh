#!/bin/bash
# Verificación de Implementación - Sistema de Rendiciones

echo "╔════════════════════════════════════════════════════╗"
echo "║  VERIFICACIÓN DE IMPLEMENTACIÓN - RENDICIONES     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar archivos del backend
echo "📋 Verificando archivos del backend..."

FILES=(
  "backend/models/Rendicion.js"
  "backend/models/Proveedor.js"
  "backend/models/TipoComprobante.js"
  "backend/controllers/rendicionesController.js"
  "backend/controllers/tipoComprobanteController.js"
  "backend/controllers/proveedorController.js"
  "backend/routes/rendiciones.js"
  "backend/routes/tipoComprobante.js"
  "backend/routes/proveedor.js"
  "backend/migrations/004_crear_rendiciones_maestras.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file"
  fi
done

echo ""
echo "📋 Verificando integración en server.js..."

if grep -q "crearTablasRendicionesMaestras" backend/server.js; then
  echo -e "${GREEN}✅${NC} crearTablasRendicionesMaestras importado"
else
  echo -e "${RED}❌${NC} crearTablasRendicionesMaestras NO importado"
fi

if grep -q "tipoComprobanteRoutes" backend/server.js; then
  echo -e "${GREEN}✅${NC} tipoComprobanteRoutes importado"
else
  echo -e "${RED}❌${NC} tipoComprobanteRoutes NO importado"
fi

if grep -q "proveedorRoutes" backend/server.js; then
  echo -e "${GREEN}✅${NC} proveedorRoutes importado"
else
  echo -e "${RED}❌${NC} proveedorRoutes NO importado"
fi

if grep -q "'/api/tipo-comprobante'" backend/server.js; then
  echo -e "${GREEN}✅${NC} Ruta /api/tipo-comprobante montada"
else
  echo -e "${RED}❌${NC} Ruta /api/tipo-comprobante NO montada"
fi

if grep -q "'/api/proveedores'" backend/server.js; then
  echo -e "${GREEN}✅${NC} Ruta /api/proveedores montada"
else
  echo -e "${RED}❌${NC} Ruta /api/proveedores NO montada"
fi

echo ""
echo "📋 Verificando archivo API frontend..."

if grep -q "crearRendicion" material-dashboard-react/src/services/api.js; then
  echo -e "${GREEN}✅${NC} Métodos de rendiciones agregados a API service"
else
  echo -e "${RED}❌${NC} Métodos de rendiciones NO agregados"
fi

if grep -q "listarTipoComprobante" material-dashboard-react/src/services/api.js; then
  echo -e "${GREEN}✅${NC} Métodos de tipo_comprobante agregados a API service"
else
  echo -e "${RED}❌${NC} Métodos de tipo_comprobante NO agregados"
fi

if grep -q "listarProveedores" material-dashboard-react/src/services/api.js; then
  echo -e "${GREEN}✅${NC} Métodos de proveedores agregados a API service"
else
  echo -e "${RED}❌${NC} Métodos de proveedores NO agregados"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${YELLOW}PRÓXIMOS PASOS:${NC}"
echo ""
echo "1. Reiniciar el servidor backend:"
echo "   cd backend && npm start"
echo ""
echo "2. Verificar logs para confirmación de migración:"
echo "   - Buscar: ✅ Tabla tipo_comprobante creada"
echo "   - Buscar: ✅ Tabla proveedores creada"
echo "   - Buscar: ✅ Tabla rendiciones creada"
echo ""
echo "3. Reiniciar frontend y probar endpoints:"
echo "   POST /api/rendiciones/crear"
echo "   GET  /api/rendiciones/listar"
echo "   GET  /api/tipo-comprobante/listar"
echo "   GET  /api/proveedores/listar"
echo ""
echo "4. Actualizar ModalRendicion.js para:"
echo "   - Cargar lista de tipos de comprobante"
echo "   - Cargar lista de proveedores"
echo "   - Mostrar selects dinámicos"
echo ""
echo "═══════════════════════════════════════════════════"
