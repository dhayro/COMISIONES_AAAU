const express = require('express');
const https = require('https');
const { URL } = require('url');
const router = express.Router();

// Token de Decolecta (actualizado)
const DECOLECTA_TOKEN = 'sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu';
const DECOLECTA_API_BASE = 'https://api.decolecta.com/v1';

/**
 * Función auxiliar para hacer requests HTTPS
 */
function makeDecolectaRequest(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DECOLECTA_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js',
      },
    };

    console.log(`   🔐 Headers enviados:`, options.headers);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   📊 Status recibido: ${res.statusCode}`);
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data,
        });
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ Error request:`, error.message);
      reject(error);
    });

    req.end();
  });
}

/**
 * Consultar RUC (empresas)
 * GET /api/decolecta/ruc/:numero
 */
router.get('/ruc/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📥 REQUEST RUC`);
    console.log(`${'='.repeat(70)}`);
    console.log(`   Parámetro recibido: ${numero}`);
    
    // Validar que sea 11 dígitos
    const numeroLimpio = numero.replace(/\D/g, '');
    console.log(`   Número limpio: ${numeroLimpio}`);
    console.log(`   Longitud: ${numeroLimpio.length}`);
    
    if (numeroLimpio.length !== 11) {
      console.log(`   ❌ Validación falló: esperaba 11 dígitos`);
      return res.status(400).json({
        success: false,
        error: 'El RUC debe tener 11 dígitos',
      });
    }

    const url = `${DECOLECTA_API_BASE}/sunat/ruc/full?numero=${numeroLimpio}`;
    console.log(`   🔍 URL: ${url}`);
    console.log(`   🔐 Token: ${DECOLECTA_TOKEN}`);

    const result = await makeDecolectaRequest(url);

    if (result.status !== 200) {
      try {
        const errorData = JSON.parse(result.data);
        console.error(`   ❌ Error Decolecta:`, errorData);
        
        return res.status(result.status).json({
          success: false,
          error: errorData.message || `Error: ${result.statusText}`,
        });
      } catch (e) {
        console.error(`   ❌ Error parsing:`, result.data);
        return res.status(result.status).json({
          success: false,
          error: result.data || result.statusText,
        });
      }
    }

    const data = JSON.parse(result.data);
    console.log(`   ✅ RUC encontrado:`, data.razon_social);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('   ❌ Error en ruta RUC:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar RUC',
    });
  }
});

/**
 * Consultar DNI (personas)
 * GET /api/decolecta/dni/:numero
 */
router.get('/dni/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    console.log(`\n📥 REQUEST DNI`);
    console.log(`   Parámetro recibido: ${numero}`);
    
    // Validar que sea 8 dígitos
    const numeroLimpio = numero.replace(/\D/g, '');
    console.log(`   Número limpio: ${numeroLimpio}`);
    console.log(`   Longitud: ${numeroLimpio.length}`);
    
    if (numeroLimpio.length !== 8) {
      console.log(`   ❌ Validación falló: esperaba 8 dígitos`);
      return res.status(400).json({
        success: false,
        error: 'El DNI debe tener 8 dígitos',
      });
    }

    const url = `${DECOLECTA_API_BASE}/reniec/dni?numero=${numeroLimpio}`;
    console.log(`� Consultando: ${url}`);

    const result = await makeDecolectaRequest(url);

    console.log(`📊 Status Decolecta: ${result.status}`);

    if (result.status !== 200) {
      try {
        const errorData = JSON.parse(result.data);
        console.error(`❌ Error:`, errorData);
        
        return res.status(result.status).json({
          success: false,
          error: errorData.message || `Error: ${result.statusText}`,
        });
      } catch (e) {
        return res.status(result.status).json({
          success: false,
          error: result.data || result.statusText,
        });
      }
    }

    const data = JSON.parse(result.data);
    console.log(`✅ DNI encontrado:`, data.full_name);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('❌ Error en ruta DNI:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar DNI',
    });
  }
});

module.exports = router;
