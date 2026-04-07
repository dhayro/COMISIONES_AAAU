const fs = require('fs');
const path = require('path');

/**
 * Test script para extraer PDF
 */
async function testPdfExtraction() {
  try {
    // Leer el archivo PDF
    const pdfPath = path.join(__dirname, '..', 'CCP 2658 AAA UCAYALI - MARZO 2026.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ Archivo PDF no encontrado en:', pdfPath);
      console.log('📂 Archivos en directorio padre:');
      const parentDir = path.join(__dirname, '..');
      const files = fs.readdirSync(parentDir);
      files.forEach(f => console.log('  -', f));
      return;
    }

    console.log('📄 Leyendo PDF:', pdfPath);
    const buffer = fs.readFileSync(pdfPath);
    console.log('✓ PDF leído:', buffer.length, 'bytes');

    // Intentar con pdfjs-dist
    console.log('\n� Intentando con pdfjs-dist...');
    try {
      const { getDocument } = require('pdfjs-dist/legacy/build/pdf.js');
      
      const pdf = await getDocument({ data: buffer }).promise;
      console.log('✓ Documento cargado:', pdf.numPages, 'páginas');
      
      let fullText = '';
      
      // Extraer texto de la primera página
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText;
      
      console.log('✓ Texto extraído de página 1:');
      console.log(fullText.substring(0, 500));
      
      // Buscar patrones
      const upperText = fullText.toUpperCase();
      const ccpMatch = upperText.match(/CCP\s*[\d\-\s]+/);
      const montoMatch = upperText.match(/S\/\.\s*[\d,]+\.?\d*/);
      
      console.log('\n📊 Patrones encontrados:');
      console.log('  - CCP:', ccpMatch ? ccpMatch[0] : 'No encontrado');
      console.log('  - Monto:', montoMatch ? montoMatch[0] : 'No encontrado');
      
    } catch (pdfjsError) {
      console.log('⚠️  pdfjs-dist falló:', pdfjsError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testPdfExtraction();

