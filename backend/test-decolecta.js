/**
 * Script de prueba para Decolecta API
 * Ejecutar: node backend/test-decolecta.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DECOLECTA_TOKEN = 'sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu';
const DECOLECTA_API_BASE = 'https://api.decolecta.com/v1';

function makeRequest(urlString, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlString);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = protocol.request(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              data: parsed,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              data: data,
            });
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function testRUC(ruc) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 PRUEBA: Consultando RUC ${ruc}`);
  console.log('='.repeat(60));

  try {
    const url = `${DECOLECTA_API_BASE}/sunat/ruc/full?numero=${ruc}`;
    console.log(`📍 URL: ${url}`);
    console.log(`🔐 Token: ${DECOLECTA_TOKEN}`);

    const result = await makeRequest(url, 'GET', {
      'Authorization': `Bearer ${DECOLECTA_TOKEN}`,
    });

    console.log(`📊 Status: ${result.status} ${result.statusText}`);
    console.log(`\n✅ Respuesta:`);
    console.log(JSON.stringify(result.data, null, 2));

    return result.data;
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    return null;
  }
}

async function testDNI(dni) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 PRUEBA: Consultando DNI ${dni}`);
  console.log('='.repeat(60));

  try {
    const url = `${DECOLECTA_API_BASE}/reniec/dni?numero=${dni}`;
    console.log(`📍 URL: ${url}`);
    console.log(`🔐 Token: ${DECOLECTA_TOKEN}`);

    const result = await makeRequest(url, 'GET', {
      'Authorization': `Bearer ${DECOLECTA_TOKEN}`,
    });

    console.log(`📊 Status: ${result.status} ${result.statusText}`);
    console.log(`\n✅ Respuesta:`);
    console.log(JSON.stringify(result.data, null, 2));

    return result.data;
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    return null;
  }
}

// Ejecutar pruebas
(async () => {
  console.log('🚀 Iniciando pruebas de Decolecta API...\n');
  
  // Prueba con RUCs conocidos
  await testRUC('20601030013');
  await testRUC('10700064838');

  // Prueba con DNI
  await testDNI('46027897');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Pruebas completadas');
  console.log('='.repeat(60));
})();
