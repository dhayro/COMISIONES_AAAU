const { pool } = require('../config/database');

async function showSchema() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n📊 ESTRUCTURA DE TABLA comisiones:\n');

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'comisiones' AND TABLE_SCHEMA = 'comisiones_db'
       ORDER BY ORDINAL_POSITION`
    );

    columns.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.COLUMN_NAME}`);
      console.log(`   Tipo: ${col.COLUMN_TYPE}`);
      console.log(`   Nullable: ${col.IS_NULLABLE}`);
      console.log(`   Key: ${col.COLUMN_KEY || 'N/A'}`);
      console.log(`   Comentario: ${col.COLUMN_COMMENT || 'N/A'}\n`);
    });

    console.log('\n¿Cuál es el campo de "número de partida"? Puede ser:');
    console.log('- presupuesto_numero_cut (CUT)');
    console.log('- presupuesto_documento (Documento)');
    console.log('- O algún otro campo específico\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}

showSchema();
