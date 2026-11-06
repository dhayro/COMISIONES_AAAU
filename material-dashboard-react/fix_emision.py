import re

with open('src/pages/Gestion/EmisionFormatos.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar el patr√≥n problem√°tico y reemplazarlo
# El patr√≥n: {clasificadorSeleccionadoRendicion && ( ... <MDTypography variant="body2" fontWeight="bold">...3. Registrar Comprobante

old_pattern = r'({clasificadorSeleccionadoRendicion && \(\s*<MDBox>\s*<MDTypography variant="body2" fontWeight="bold">.*?3\. Registrar Comprobante</MDTypography>)'

new_replacement = r'''{clasificadorSeleccionadoRendicion && (
                    <MDBox>
                    <MDTypography variant="body2" fontWeight="bold">
                      {clasificadorSeleccionadoRendicion.partida === '23.2.1.2.2' ? 'Ì≥ù 3. Registrar Comprobante' : 'Ì≥ù 2. Registrar Comprobante'}
                    </MDTypography>'''

# Buscar patr√≥n m√°s espec√≠fico
if '3. Registrar Comprobante' in content:
    # Reemplazar todas las instancias problem√°ticas
    content = re.sub(
        r'<MDTypography variant="body2" fontWeight="bold">[^<]*?3\. Registrar Comprobante</MDTypography>',
        '''<MDTypography variant="body2" fontWeight="bold">
                      {clasificadorSeleccionadoRendicion.partida === '23.2.1.2.2' ? 'Ì≥ù 3. Registrar Comprobante' : 'Ì≥ù 2. Registrar Comprobante'}
                    </MDTypography>''',
        content
    )

with open('src/pages/Gestion/EmisionFormatos.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("‚úÖ Archivo reparado")
