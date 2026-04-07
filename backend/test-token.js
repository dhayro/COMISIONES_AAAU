const https = require('https');

const token = 'sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu';
const ruc = '20601030013';

const options = {
  hostname: 'api.decolecta.com',
  port: 443,
  path: '/v1/sunat/ruc/full?numero=' + ruc,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'User-Agent': 'Node.js',
  },
};

console.log('Iniciando prueba...');
console.log('Options:', JSON.stringify(options, null, 2));

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Respuesta:', data.substring(0, 200));
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
