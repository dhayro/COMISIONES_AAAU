require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    });

    console.log('\n' + '='.repeat(100));
    console.log('📊 MAPEO DE DATOS PDF → BASE DE DATOS');
    console.log('='.repeat(100));

    // Get metas
    const [metas] = await connection.query('SELECT id, numero_meta, nombre FROM metas ORDER BY numero_meta');
    console.log('\n📌 METAS (para mapeo de meta_id):');
    console.log('-'.repeat(100));
    metas.forEach(meta => {
      console.log(`  ID: ${meta.id.toString().padEnd(3)} | NUMERO: ${meta.numero_meta.padEnd(5)} | NOMBRE: ${meta.nombre}`);
    });

    // Get fuentes
    const [fuentes] = await connection.query('SELECT id, nombre FROM fuentes_financiamiento ORDER BY id');
    console.log('\n💰 FUENTES DE FINANCIAMIENTO (para mapeo de fuente_financiamiento_id):');
    console.log('-'.repeat(100));
    fuentes.forEach(fuente => {
      console.log(`  ID: ${fuente.id} | NOMBRE: ${fuente.nombre}`);
    });

    // Get clasificadores grouped by partida
    console.log('\n📋 CLASIFICADORES (para mapeo de detalles):');
    console.log('-'.repeat(100));
    
    const [clasificadores] = await connection.query(`
      SELECT id, partida, nombre 
      FROM clasificadores 
      WHERE activo = 1
      ORDER BY partida
    `);
    
    // Show first 10 and highlight ones that match PDF
    const relevantPartidas = ['23.1.3.1.1', '23.2.1.2.1', '23.2.1.2.2', '23.2.2.1.1', '23.2.2.1.2'];
    
    console.log('\n  Clasificadores relevantes del PDF:');
    clasificadores.forEach(clf => {
      if (relevantPartidas.includes(clf.partida)) {
        console.log(`  ✓ ID: ${clf.id.toString().padEnd(3)} | PARTIDA: ${clf.partida.padEnd(15)} | NOMBRE: ${clf.nombre}`);
      }
    });

    console.log('\n\n' + '='.repeat(100));
    console.log('📋 MAPEO ESPERADO PARA PDF: "CCP 2658 AAA UCAYALI - MARZO 2026.pdf"');
    console.log('='.repeat(100));

    console.log('\n🎯 CAMPOS PRINCIPALES:');
    console.log('  • nota: "0000002658"');
    console.log('  • mes: "FEBRERO"');
    console.log('  • fecha_aprobacion: "26/02/2026"');
    console.log('  • fecha_documento: "26/02/2026"');
    console.log('  • estado_certificacion: "APROBADO"');
    console.log('  • tipo_documento: "MEMORANDUM"');
    console.log('  • numero_documento: "32716M329AAA.U"');
    console.log('  • justificacion: "GASTOS OPERATIVOS AAA UCAYALI MARZO"');
    console.log('  • monto_total: 20540');

    console.log('\n🔗 CLAVES FORÁNEAS A MAPEAR:');
    
    const meta = metas.find(m => m.numero_meta === '072');
    console.log(`  • meta_id: ${meta.id}`);
    console.log(`    → PDF texto: "0072 GESTION OPERATIVA DE LA AUTORIDAD ADMINISTRATIVA DEL AGUA"`);
    console.log(`    → Base de datos: meta.numero_meta = '072' AND meta.nombre = '${meta.nombre}'`);
    
    const fuente = fuentes.find(f => f.nombre === 'Recursos Ordinarios');
    console.log(`  • fuente_financiamiento_id: ${fuente.id}`);
    console.log(`    → PDF texto: "RECURSOS ORDINARIOS"`);
    console.log(`    → Base de datos: fuentes_financiamiento.nombre LIKE '%RECURSOS ORDINARIOS%'`);

    console.log('\n📦 DETALLES A EXTRAER (detalles_certificacion_credito):');
    console.log('  Línea 1: "2.3.1.3.1.1 COMBUSTIBLES Y CARBURANTES" → 600.00');
    const clf1 = clasificadores.find(c => c.partida === '23.1.3.1.1');
    console.log(`    → clasificador_id: ${clf1.id}`);
    
    console.log('  Línea 2: "2.3.2.1.2.1 PASAJES Y GASTOS DE TRANSPORTE" → 4,900.00');
    const clf2 = clasificadores.find(c => c.partida === '23.2.1.2.1');
    console.log(`    → clasificador_id: ${clf2.id}`);
    
    console.log('  Línea 3: "2.3.2.1.2.2 VIATICOS Y ASIGNACIONES POR COMISION DE SERVICIO" → 9,240.00');
    const clf3 = clasificadores.find(c => c.partida === '23.2.1.2.2');
    console.log(`    → clasificador_id: ${clf3.id}`);
    
    console.log('  Línea 4: "2.3.2.2.1.1 SERVICIO DE SUMINISTRO DE ENERGIA ELECTRICA" → 5,000.00');
    const clf4 = clasificadores.find(c => c.partida === '23.2.2.1.1');
    console.log(`    → clasificador_id: ${clf4 ? clf4.id : 'NO ENCONTRADO'}`);
    
    console.log('  Línea 5: "2.3.2.2.1.2 SERVICIO DE AGUA Y DESAGUE" → 800.00');
    const clf5 = clasificadores.find(c => c.partida === '23.2.2.1.2');
    console.log(`    → clasificador_id: ${clf5 ? clf5.id : 'NO ENCONTRADO'}`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
