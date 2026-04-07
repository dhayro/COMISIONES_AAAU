const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testPdfExtraction() {
  try {
    console.log('🧪 Test de extracción PDF\n');
    
    // Generar token válido con el mismo secret que el servidor
    const SECRET = process.env.JWT_SECRET;
    console.log('🔐 Secret usado:', SECRET.substring(0, 20) + '...');
    
    const token = jwt.sign(
      { id: 1, nombre: 'Admin', email: 'admin@example.com', rol: 'Admin' },
      SECRET,
      { expiresIn: '24h' }
    );
    console.log('🔑 Token generado: ' + token.substring(0, 50) + '...\n');
    
    const pdfPath = 'D:\\COMISIONES_AAAU\\CCP 2658 AAA UCAYALI - MARZO 2026.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ Archivo PDF no encontrado:', pdfPath);
      return;
    }
    
    const fileStream = fs.createReadStream(pdfPath);
    const form = new FormData();
    form.append('file', fileStream);
    
    console.log('📤 Enviando PDF al servidor...');
    console.log('📄 Archivo:', path.basename(pdfPath));
    console.log('📊 Tamaño:', fs.statSync(pdfPath).size, 'bytes\n');
    
    const response = await fetch('http://localhost:5000/api/pdf/extract-certification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Extracción exitosa!\n');
      
      // Mostrar el texto completo
      console.log('='.repeat(80));
      console.log('📄 TEXTO COMPLETO DEL PDF:');
      console.log('='.repeat(80));
      console.log(data.data.raw_text);
      console.log('='.repeat(80));
      console.log('\n');
      
      console.log('📋 Datos extraídos:');
      console.log(JSON.stringify(data.data, null, 2));
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testPdfExtraction();
