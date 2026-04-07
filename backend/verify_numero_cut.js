const { pool } = require('./config/database');

const verificar = async () => {
  try {
    console.log('🔍 Verificando campo numero_cut en formato_emisiones...\n');

    const [columns] = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'formato_emisiones' AND COLUMN_NAME = 'numero_cut'`
    );

    if (columns.length === 0) {
      console.log('❌ Campo numero_cut NO existe en formato_emisiones');
      return;
    }

    const col = columns[0];
    console.log('✅ Campo numero_cut ENCONTRADO:');
    console.log(`   Nombre: ${col.COLUMN_NAME}`);
    console.log(`   Tipo: ${col.DATA_TYPE}`);
    console.log(`   Nulable: ${col.IS_NULLABLE}`);
    console.log(`   Clave: ${col.COLUMN_KEY || 'Ninguna'}`);
    console.log(`   Extra: ${col.EXTRA || 'Ninguno'}`);

    // Mostrar posición en la tabla
    const [allColumns] = await pool.query(
      `SELECT ORDINAL_POSITION, COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'formato_emisiones' 
       ORDER BY ORDINAL_POSITION`
    );

    const position = allColumns.findIndex(c => c.COLUMN_NAME === 'numero_cut') + 1;
    console.log(`   Posición en tabla: ${position} de ${allColumns.length} columnas`);

    console.log('\n📋 Estructura cercana a numero_cut:');
    allColumns.forEach((col, idx) => {
      if (Math.abs(idx - (position - 1)) <= 2) {
        console.log(`   ${col.ORDINAL_POSITION}. ${col.COLUMN_NAME}`);
      }
    });

    console.log('\n✅ VERIFICACIÓN COMPLETADA - Campo numero_cut está listo');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verificar();
