const { pool } = require('../config/database');

async function agregarPartida() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔧 AGREGAR CAMPO: número_partida (Presupuesto)           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Verificar si el campo ya existe
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'comisiones' 
       AND TABLE_SCHEMA = 'comisiones_db'
       AND COLUMN_NAME = 'numero_partida'`
    );

    if (columns.length > 0) {
      console.log('✅ Campo "numero_partida" ya existe en la tabla\n');
      
      // Mostrar datos actuales
      const [data] = await connection.query(
        `SELECT id, numero_partida FROM comisiones WHERE numero_partida IS NOT NULL LIMIT 5`
      );
      
      if (data.length > 0) {
        console.log('📊 Primeros registros con partida:\n');
        data.forEach((row) => {
          console.log(`   ID: ${row.id}, Partida: ${row.numero_partida}`);
        });
        console.log('');
      }
      process.exit(0);
      return;
    }

    // Agregar el campo
    console.log('➕ Agregando campo número_partida...\n');

    await connection.query(
      `ALTER TABLE comisiones 
       ADD COLUMN numero_partida VARCHAR(50) NULL 
       COMMENT 'Número de partida presupuestal'
       AFTER presupuesto_numero_cut`
    );

    console.log('✅ Campo agregado exitosamente\n');

    // Verificar que fue creado
    const [check] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'comisiones' 
       AND TABLE_SCHEMA = 'comisiones_db'
       AND COLUMN_NAME = 'numero_partida'`
    );

    if (check.length > 0) {
      console.log('✅ Verificación exitosa:');
      console.log(`   Campo: ${check[0].COLUMN_NAME}`);
      console.log(`   Tipo: ${check[0].COLUMN_TYPE}\n`);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ CAMPO AGREGADO CORRECTAMENTE                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message, '\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}

agregarPartida();
