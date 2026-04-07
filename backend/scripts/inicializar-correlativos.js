// ========== Script: Inicializar Correlativos para todos los usuarios ==========
// Uso: node scripts/inicializar-correlativos.js
// Este script crea controles iniciales de correlativo para todos los usuarios

require('dotenv').config();
const mysql = require('mysql2/promise');

const inicializarCorrelativos = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🔄 INICIALIZANDO CORRELATIVOS POR USUARIO             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Paso 1: Obtener todos los usuarios activos
    console.log('📋 Paso 1: Obteniendo usuarios activos...\n');
    const [usuarios] = await connection.query(
      'SELECT id, nombre FROM users WHERE activo = 1 ORDER BY nombre'
    );
    
    console.log(`✅ Se encontraron ${usuarios.length} usuarios activos:\n`);
    usuarios.forEach(u => {
      console.log(`   • ID: ${u.id} | ${u.nombre}`);
    });

    // Paso 2: Crear controles para 2026
    const ano = 2026;
    console.log(`\n📊 Paso 2: Creando controles de correlativo para año ${ano}...\n`);

    let creados = 0;
    let existentes = 0;

    for (const usuario of usuarios) {
      try {
        // Verificar si ya existe
        const [existentes_check] = await connection.query(
          'SELECT id FROM correlativo_control WHERE usuario_id = ? AND ano = ?',
          [usuario.id, ano]
        );

        if (existentes_check.length > 0) {
          console.log(`   ⏭️  ${usuario.nombre}: ya existe control`);
          existentes++;
          continue;
        }

        // Crear control
        await connection.query(
          `INSERT INTO correlativo_control 
           (usuario_id, ano, numero_inicial, numero_proximo, descripcion, creado_por)
           VALUES (?, ?, 1, 1, ?, 1)`,
          [usuario.id, ano, `${usuario.nombre} - Año ${ano}`]
        );

        console.log(`   ✅ ${usuario.nombre}: control creado (comienza en 001)`);
        creados++;
      } catch (error) {
        console.log(`   ❌ ${usuario.nombre}: ERROR - ${error.message}`);
      }
    }

    console.log(`\n📈 Resumen:`);
    console.log(`   • Creados: ${creados}`);
    console.log(`   • Existentes: ${existentes}`);

    // Paso 3: Verificación final
    console.log(`\n✅ Paso 3: Verificación final...\n`);
    const [controles] = await connection.query(
      `SELECT cc.id, u.nombre, cc.ano, cc.numero_inicial, cc.numero_proximo,
              CONCAT(
                LPAD(cc.numero_proximo, 3, '0'), '-',
                UPPER(SUBSTRING(u.nombre, 1, 1)), 
                IF(LOCATE(' ', u.nombre) > 0, 
                   UPPER(SUBSTRING(u.nombre, LOCATE(' ', u.nombre) + 1, 1)), 
                   UPPER(SUBSTRING(u.nombre, 2, 1))),
                '-',
                cc.ano
              ) AS proximo_numero_formato
       FROM correlativo_control cc
       JOIN users u ON cc.usuario_id = u.id
       WHERE cc.ano = ? AND cc.activo = 1
       ORDER BY u.nombre`,
      [ano]
    );

    console.log('Controles registrados:');
    console.log('─'.repeat(80));
    console.log(
      '│ Usuario'.padEnd(25) + 
      '│ Año'.padEnd(6) + 
      '│ Prox'.padEnd(5) + 
      '│ Próximo Número Formato'.padEnd(25) + 
      '│'
    );
    console.log('─'.repeat(80));
    
    controles.forEach(c => {
      console.log(
        '│ ' + c.nombre.substring(0, 23).padEnd(23) + 
        ' │ ' + c.ano.toString().padEnd(4) + 
        ' │ ' + c.numero_proximo.toString().padEnd(3) + 
        ' │ ' + c.proximo_numero_formato.padEnd(23) + 
        ' │'
      );
    });
    
    console.log('─'.repeat(80));

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ INICIALIZACIÓN COMPLETADA                          ║');
    console.log('║                                                        ║');
    console.log('║  🎯 Todos los usuarios tienen control de correlativo  ║');
    console.log('║  📝 Pueden crear formatos con números secuenciales    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
};

// Ejecutar
inicializarCorrelativos();
