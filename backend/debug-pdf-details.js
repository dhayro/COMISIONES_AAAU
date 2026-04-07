require('dotenv').config();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Generar token
const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

// Leer PDF - buscar en directorio padre
const pdfPath = path.join(__dirname, '..', 'CCP 2658 AAA UCAYALI - MARZO 2026.pdf');
const pdfBuffer = fs.readFileSync(pdfPath);

// Enviar al servidor
(async () => {
  try {
    const formData = new (require('form-data'))();
    formData.append('file', pdfBuffer, path.basename(pdfPath));

    const response = await fetch('http://localhost:5000/api/pdf/extract-certification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();
    
    console.log('\n📋 ANÁLISIS DE DETALLES EXTRAÍDOS:\n');
    
    if (data.data.raw_text) {
      // Buscar líneas con formato 2.X.X
      const lines = data.data.raw_text.split(/[\n\r]+/);
      console.log('Total líneas en PDF:', lines.length);
      
      console.log('\n🔍 LÍNEAS CON FORMATO DE PARTIDA (2.X.X...):\n');
      let count = 0;
      for (const line of lines) {
        if (line.match(/^\s*2\.\d+/)) {
          console.log(`[${count}] "${line}"`);
          count++;
          if (count >= 20) break;
        }
      }
      
      console.log('\n🔍 LÍNEAS ALREDEDOR DE "BIENES Y SERVICIOS":\n');
      const serviceIdx = lines.findIndex(l => l.includes('BIENES Y SERVICIOS'));
      if (serviceIdx >= 0) {
        for (let i = serviceIdx; i < Math.min(serviceIdx + 30, lines.length); i++) {
          console.log(`[${i}] "${lines[i]}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
