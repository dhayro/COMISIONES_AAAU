const mysql = require('mysql2/promise');
require('dotenv').config();

const fixDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });

    console.log('✅ Conectado a la base de datos');

    // Primero, eliminar las tablas dependientes
    console.log('\n🔄 Eliminando tablas antiguas...');
    
    try {
      await connection.query('DROP TABLE IF EXISTS comision_comisionados');
      console.log('✅ Tabla comision_comisionados eliminada');
    } catch (err) {
      console.log('⚠️  comision_comisionados no existe');
    }

    try {
      await connection.query('DROP TABLE IF EXISTS comisiones');
      console.log('✅ Tabla comisiones eliminada');
    } catch (err) {
      console.log('⚠️  comisiones no existe');
    }

    // Recrear la tabla comisiones con estructura correcta
    console.log('\n📝 Creando tabla comisiones...');
    await connection.query(`
      CREATE TABLE comisiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ambito_id INT NOT NULL,
        lugar VARCHAR(100) NOT NULL,
        ruta VARCHAR(255),
        modalidad_viaje ENUM('TERRESTRE', 'AEREO', 'FLUVIAL', 'AEREO-TERRESTRE', 'AEREO-FLUVIAL', 'TERRESTRE-FLUVIAL', 'AEREO-TERRESTRE-FLUVIAL') DEFAULT 'TERRESTRE',
        fecha_salida DATETIME NOT NULL,
        fecha_retorno DATETIME NOT NULL,
        num_dias INT NOT NULL,
        costo_xdia DECIMAL(10, 2) NOT NULL,
        costo_total_comision DECIMAL(10, 2) DEFAULT 0,
        observacion TEXT,
        usuario_id INT NOT NULL,
        estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_usuario (usuario_id),
        INDEX idx_ambito (ambito_id),
        INDEX idx_estado (estado),
        INDEX idx_fechas (fecha_salida, fecha_retorno)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla comisiones creada correctamente');

    // Recrear la tabla comision_comisionados
    console.log('\n📝 Creando tabla comision_comisionados...');
    await connection.query(`
      CREATE TABLE comision_comisionados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comision_id INT NOT NULL,
        usuario_id INT NOT NULL,
        clasificador_id INT NOT NULL,
        dias INT NOT NULL,
        costo_xdia DECIMAL(10, 2) NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        descripcion TEXT,
        observacion TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (comision_id) REFERENCES comisiones(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (clasificador_id) REFERENCES clasificadores(id) ON DELETE RESTRICT,
        UNIQUE KEY unique_comisionado (comision_id, usuario_id, clasificador_id),
        INDEX idx_comision (comision_id),
        INDEX idx_usuario (usuario_id),
        INDEX idx_clasificador (clasificador_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla comision_comisionados creada correctamente');

    console.log('\n✅ Base de datos reparada exitosamente');
    console.log('🔄 El servidor se reiniciará automáticamente con nodemon');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixDatabase();
