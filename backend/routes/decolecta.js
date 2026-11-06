const logger = require('../shared/logger');
const express = require('express');
const https = require('https');
const { URL } = require('url');
const router = express.Router();

const DECOLECTA_TOKEN = process.env.DECOLECTA_TOKEN;
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

    logger.info(`   🔐 Headers enviados:`, options.headers);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        logger.info(`   📊 Status recibido: ${res.statusCode}`);
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data,
        });
      });
    });

    req.on('error', (error) => {
      logger.error(`   ❌ Error request:`, error.message);
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
    
    logger.info(`\n${'='.repeat(70)}`);
    logger.info(`📥 REQUEST RUC`);
    logger.info(`${'='.repeat(70)}`);
    logger.info(`   Parámetro recibido: ${numero}`);
    
    // Validar que sea 11 dígitos
    const numeroLimpio = numero.replace(/\D/g, '');
    logger.info(`   Número limpio: ${numeroLimpio}`);
    logger.info(`   Longitud: ${numeroLimpio.length}`);
    
    if (numeroLimpio.length !== 11) {
      logger.info(`   ❌ Validación falló: esperaba 11 dígitos`);
      return res.status(400).json({
        success: false,
        error: 'El RUC debe tener 11 dígitos',
      });
    }

    const url = `${DECOLECTA_API_BASE}/sunat/ruc/full?numero=${numeroLimpio}`;
    logger.info(`   🔍 URL: ${url}`);

    const result = await makeDecolectaRequest(url);

    if (result.status !== 200) {
      try {
        const errorData = JSON.parse(result.data);
        logger.error(`   ❌ Error Decolecta:`, errorData);
        
        return res.status(result.status).json({
          success: false,
          error: errorData.message || `Error: ${result.statusText}`,
        });
      } catch (e) {
        logger.error(`   ❌ Error parsing:`, result.data);
        return res.status(result.status).json({
          success: false,
          error: result.data || result.statusText,
        });
      }
    }

    const data = JSON.parse(result.data);
    logger.info(`   ✅ RUC encontrado:`, data.razon_social);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error('   ❌ Error en ruta RUC:', error);
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
    
    logger.info(`\n📥 REQUEST DNI`);
    logger.info(`   Parámetro recibido: ${numero}`);
    
    // Validar que sea 8 dígitos
    const numeroLimpio = numero.replace(/\D/g, '');
    logger.info(`   Número limpio: ${numeroLimpio}`);
    logger.info(`   Longitud: ${numeroLimpio.length}`);
    
    if (numeroLimpio.length !== 8) {
      logger.info(`   ❌ Validación falló: esperaba 8 dígitos`);
      return res.status(400).json({
        success: false,
        error: 'El DNI debe tener 8 dígitos',
      });
    }

    const url = `${DECOLECTA_API_BASE}/reniec/dni?numero=${numeroLimpio}`;
    logger.info(`� Consultando: ${url}`);

    const result = await makeDecolectaRequest(url);

    logger.info(`📊 Status Decolecta: ${result.status}`);

    if (result.status !== 200) {
      try {
        const errorData = JSON.parse(result.data);
        logger.error(`❌ Error:`, errorData);
        
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
    logger.info(`✅ DNI encontrado:`, data.full_name);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error('❌ Error en ruta DNI:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar DNI',
    });
  }
});

module.exports = router;
