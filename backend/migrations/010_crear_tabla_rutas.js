/**
 * 🔧 Migración: Crear tabla 'rutas' para registrar origen, destino y fechas de viajes
 */

const crearTablaRutas = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n🔄 Creando tabla rutas...\n');

    const sql = `
      CREATE TABLE IF NOT EXISTS rutas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        formato_emision_id INT NOT NULL,
        origen VARCHAR(255) NOT NULL COMMENT 'Lugar de origen del viaje',
        fecha_salida DATETIME NOT NULL COMMENT 'Fecha y hora de salida',
        destino VARCHAR(255) NOT NULL COMMENT 'Lugar de destino del viaje',
        fecha_llegada DATETIME NOT NULL COMMENT 'Fecha y hora de llegada',
        proposito VARCHAR(500) COMMENT 'Propósito del viaje',
        kilometraje DECIMAL(10, 2) COMMENT 'Kilómetros recorridos',
        observaciones TEXT COMMENT 'Observaciones adicionales',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_rutas_formato 
          FOREIGN KEY (formato_emision_id) 
          REFERENCES formato_emisiones(id) 
          ON DELETE CASCADE,
        
        INDEX idx_rutas_formato (formato_emision_id),
        INDEX idx_rutas_fechas (fecha_salida, fecha_llegada)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Tabla para registrar rutas y viajes asociados a formatos de emisión'
    `;

    await connection.query(sql);
    console.log('✅ Tabla rutas creada exitosamente');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('   └─ Tabla rutas creada con campos:');
    console.log('      • id (INT, AUTO_INCREMENT)');
    console.log('      • formato_emision_id (INT, Foreign Key)');
    console.log('      • origen (VARCHAR 255)');
    console.log('      • fecha_salida (DATETIME)');
    console.log('      • destino (VARCHAR 255)');
    console.log('      • fecha_llegada (DATETIME)');
    console.log('      • proposito (VARCHAR 500)');
    console.log('      • kilometraje (DECIMAL 10,2)');
    console.log('      • observaciones (TEXT)');
    console.log('      • created_at, updated_at (TIMESTAMP)\n');

    return true;
  } catch (error) {
    console.error('❌ Error al crear tabla rutas:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { crearTablaRutas };
