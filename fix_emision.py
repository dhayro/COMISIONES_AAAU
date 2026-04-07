import re

file_path = 'material-dashboard-react/src/pages/Gestion/EmisionFormatos.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar el patrón problemático
# Buscar: <MDTypography variant="body2" fontWeight="bold">...3. Registrar Comprobante</MDTypography>
# Reemplazar por: versión condicional

pattern = r'<MDTypography variant="body2" fontWeight="bold">[^<]*?3\. Registrar Comprobante\s*</MDTypography>'

replacement = '''<MDTypography variant="body2" fontWeight="bold">
                      {clasificadorSeleccionadoRendicion.partida === '23.2.1.2.2' ? '📝 3. Registrar Comprobante' : '📝 2. Registrar Comprobante'}
                    </MDTypography>'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Archivo reparado exitosamente")
