const { pool } = require('../config/database');

async function createComisionComisionadosTable() {
  let connection;
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  🔄 CREANDO TABLA comision_comisionados       ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Obtener conexión del pool
    connection = await pool.getConnection();
    console.log('✅ Conexión establecida a la base de datos');

    // Verificar si la tabla existe
    const [tables] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.TABLES 
       WHERE TABLE_NAME = 'comision_comisionados' 
       AND TABLE_SCHEMA = DATABASE()`
    );

    if (tables[0].count > 0) {
      console.log('⚠️  La tabla "comision_comisionados" ya existe\n');
      
      // Verificar estructura
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
         FROM information_schema.COLUMNS 
         WHERE TABLE_NAME = 'comision_comisionados' 
         AND TABLE_SCHEMA = DATABASE()`
      );
      
      console.log('📊 Estructura actual de la tabla:\n');
      columns.forEach((col) => {
        console.log(`   ✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'NOT NULL'})`);
      });
      
      process.exit(0);
    }

    console.log('📝 Creando tabla comision_comisionados...\n');

    // Crear tabla comision_comisionados
    await connection.query(`
      CREATE TABLE comision_comisionados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comision_id INT NOT NULL,
        usuario_id INT NOT NULL,
        monto DECIMAL(10, 2) NOT NULL DEFAULT 0,
        estado VARCHAR(50) DEFAULT 'ACTIVO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Claves foráneas
        FOREIGN KEY (comision_id) REFERENCES comisiones(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        
        -- Índices
        UNIQUE KEY unique_comision_usuario (comision_id, usuario_id),
        INDEX idx_comision_id (comision_id),
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla "comision_comisionados" creada exitosamente\n');

    // Verificar estructura creada
    const [newColumns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
       FROM information_schema.COLUMNS 
       WHERE TABLE_NAME = 'comision_comisionados' 
       AND TABLE_SCHEMA = DATABASE()`
    );

    console.log('📊 Estructura de la tabla:\n');
    newColumns.forEach((col) => {
      console.log(`   ✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'NOT NULL'})`);
    });

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  ✨ ¡ÉXITO! Tabla creada correctamente        ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📌 ESTRUCTURA DE LA TABLA:\n');
    console.log('   id (INT): Identificador único');
    console.log('   comision_id (INT): ID de la comisión');
    console.log('   usuario_id (INT): ID del usuario/comisionado');
    console.log('   monto (DECIMAL): Monto asignado al comisionado');
    console.log('   estado (VARCHAR): ACTIVO, INACTIVO, etc.');
    console.log('   created_at (TIMESTAMP): Fecha de creación');
    console.log('   updated_at (TIMESTAMP): Fecha de última actualización\n');

    console.log('🔗 RELACIONES:\n');
    console.log('   ✓ comision_id → comisiones(id) ON DELETE CASCADE');
    console.log('   ✓ usuario_id → usuarios(id) ON DELETE CASCADE\n');

    console.log('📋 ÍNDICES:\n');
    console.log('   ✓ unique_comision_usuario: Evita duplicados');
    console.log('   ✓ idx_comision_id: Búsqueda por comisión');
    console.log('   ✓ idx_usuario_id: Búsqueda por usuario');
    console.log('   ✓ idx_estado: Búsqueda por estado\n');

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

createComisionComisionadosTable();
