const { pool } = require('../config/database');

async function addPresupuestoFields() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  🔄 AGREGANDO CAMPOS DE PRESUPUESTO            ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Obtener conexión del pool
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida a la base de datos');

    // Verificar si la tabla existe
    const [tables] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_NAME = 'comisiones' AND TABLE_SCHEMA = DATABASE()`
    );

    if (tables[0].count === 0) {
      throw new Error('❌ La tabla "comisiones" no existe en la base de datos');
    }

    console.log('✅ Tabla "comisiones" encontrada\n');

    // Agregar columnas si no existen
    console.log('📝 Agregando columnas...\n');

    const queries = [
      {
        name: 'presupuesto_estado',
        sql: `ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS presupuesto_estado ENUM('PRESUPUESTO ASIGNADO', 'PRESUPUESTO POR ASIGNAR') DEFAULT 'PRESUPUESTO POR ASIGNAR'`,
      },
      {
        name: 'presupuesto_documento',
        sql: `ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS presupuesto_documento VARCHAR(255)`,
      },
      {
        name: 'presupuesto_numero_cut',
        sql: `ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS presupuesto_numero_cut VARCHAR(50)`,
      },
      {
        name: 'presupuesto_fecha',
        sql: `ALTER TABLE comisiones ADD COLUMN IF NOT EXISTS presupuesto_fecha DATE`,
      },
    ];

    for (const query of queries) {
      try {
        await connection.query(query.sql);
        console.log(`   ✅ ${query.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ⚠️  ${query.name} (ya existe)`);
        } else {
          throw error;
        }
      }
    }

    // Verificar que las columnas existan
    console.log('\n📊 Verificando columnas...\n');
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'comisiones' AND TABLE_SCHEMA = DATABASE() AND COLUMN_NAME LIKE 'presupuesto_%'`
    );

    if (columns.length === 0) {
      throw new Error('❌ No se pudieron agregar las columnas de presupuesto');
    }

    console.log(`✅ Se encontraron ${columns.length} columnas de presupuesto:\n`);
    columns.forEach((col) => {
      console.log(`   ✓ ${col.COLUMN_NAME}`);
    });

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  ✨ ¡ÉXITO! Campos agregados correctamente     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════╗');
    console.error('║  ❌ ERROR                                      ║');
    console.error('╚════════════════════════════════════════════════╝');
    console.error('\n' + error.message + '\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
      console.log('✅ Conexión cerrada');
    }
  }
}

addPresupuestoFields();
