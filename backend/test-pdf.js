const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; padding: 15mm; }
        h1 { font-size: 14px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #4F46E5; color: white; padding: 8px; text-align: center; border: 1px solid #ccc; }
        td { padding: 8px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>ANEXO N° 01 - TEST LANDSCAPE PDF</h1>
      <p>Este PDF debe estar en orientación HORIZONTAL (LANDSCAPE)</p>
      <table>
        <tr><th>COL1</th><th>COL2</th><th>COL3</th><th>COL4</th><th>COL5</th><th>COL6</th><th>COL7</th><th>COL8</th></tr>
        <tr><td>Test</td><td>Prueba</td><td>Landscape</td><td>Horizontal</td><td>PDF</td><td>2026</td><td>Puppeteer</td><td>✓</td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();
    fs.writeFileSync('test_landscape.pdf', pdfBuffer);
    console.log('✅ PDF LANDSCAPE created: test_landscape.pdf');
    console.log('📊 Size:', pdfBuffer.length, 'bytes');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
