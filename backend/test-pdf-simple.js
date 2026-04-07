const fs = require('fs');
const path = require('path');

async function testPdfExtraction() {
  try {
    // Crear polyfills manuales
    if (typeof global.DOMMatrix === 'undefined') {
      global.DOMMatrix = class DOMMatrix {
        constructor(init) {
          this.a = 1;
          this.b = 0;
          this.c = 0;
          this.d = 1;
          this.e = 0;
          this.f = 0;
        }
      };
    }
    
    if (typeof global.ImageData === 'undefined') {
      global.ImageData = class ImageData {
        constructor(width, height) {
          this.width = width;
          this.height = height;
          this.data = new Uint8ClampedArray(width * height * 4);
        }
      };
    }
    
    if (typeof global.Path2D === 'undefined') {
      global.Path2D = class Path2D {};
    }
    
    const pdfPath = path.join(__dirname, '..', 'CCP 2658 AAA UCAYALI - MARZO 2026.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF no encontrado');
      return;
    }

    console.log('📄 Leyendo PDF...');
    const buffer = fs.readFileSync(pdfPath);
    console.log('✓ PDF leído:', buffer.length, 'bytes');

    console.log('\n🔄 Probando con pdf-parse...');
    const pdfParse = require('pdf-parse');
    
    const data = await pdfParse(buffer);
    console.log('✓ ¡Funcionó!');
    console.log('  - Páginas:', data.numpages);
    console.log('  - Primeros 400 caracteres:');
    console.log('  ', data.text.substring(0, 400));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPdfExtraction();
