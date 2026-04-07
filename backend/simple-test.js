const https = require('https');
const { URL } = require('url');

const token = 'sk_14501.OJiVWEPQUuZc1BrmlMZiwPiGPX0K1Utu';
const ruc = '20601030013';
const urlString = `https://api.decolecta.com/v1/sunat/ruc/full?numero=${ruc}`;

console.log('\n' + '='.repeat(70));
console.log('🚀 Prueba de Decolecta API');
console.log('='.repeat(70));
console.log(`URL: ${urlString}`);
console.log(`Token: ${token}`);

const url = new URL(urlString);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Node.js',
  },
};

console.log(`\n📤 Headers:`, options.headers);

const req = https.request(options, (res) => {
  console.log(`\n✅ Respuesta Status: ${res.statusCode}`);
  console.log(`📋 Headers respuesta:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n📦 Datos:`);
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.log('\n' + '='.repeat(70) + '\n');
  });
});

req.on('error', (e) => {
  console.error('\n❌ Error:', e.message);
});

req.end();
