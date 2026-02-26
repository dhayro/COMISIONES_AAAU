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
        .header { text-align: center; margin-bottom: 20px; }
        h1 { font-size: 14px; font-weight: bold; margin: 10px 0; }
        h2 { font-size: 12px; font-weight: bold; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #4F46E5; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #ccc; }
        td { padding: 8px; border: 1px solid #ccc; font-size: 9px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ANEXO N° 01</h1>
        <h2>PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS</h2>
        <p>DIRECCIÓN: OFICINA DE ADMINISTRACIÓN</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>COMISIONADO</th>
            <th>CARGO</th>
            <th>ACTIVIDAD</th>
            <th>PARTIDA</th>
            <th>DÍAS</th>
            <th>FECHA SALIDA</th>
            <th>FECHA RETORNO</th>
            <th>MONTO (S/.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Juan Pérez García</td>
            <td>Contador</td>
            <td>Supervisión de auditoría</td>
            <td>100-1000</td>
            <td>5</td>
            <td>25/02/2026</td>
            <td>02/03/2026</td>
            <td>S/. 500.00</td>
          </tr>
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <td colspan="4">TOTAL</td>
            <td>5</td>
            <td colspan="2"></td>
            <td>S/. 500.00</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    // Generar PDF en LANDSCAPE
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,  // ✓ LANDSCAPE
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    // Guardar PDF
    fs.writeFileSync('test_landscape.pdf', pdfBuffer);
    console.log('✅ PDF LANDSCAPE generado correctamente en test_landscape.pdf');
    console.log('��� Tamaño del PDF:', pdfBuffer.length, 'bytes');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
