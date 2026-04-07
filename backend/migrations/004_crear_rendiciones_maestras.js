/**
 * 🔧 Migración: Crear tablas para Rendiciones, TipoComprobante y Proveedores
 */

const crearTablasRendicionesMaestras = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n🔄 Creando tablas maestras para rendiciones...\n');

    // Tipo comprobante (maestro simple)
    const sqlTipoComprobante = `
      CREATE TABLE IF NOT EXISTS tipo_comprobante (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion VARCHAR(255),
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlTipoComprobante);
    console.log('✅ Tabla tipo_comprobante creada/verificada');

    // Proveedores
    const sqlProveedores = `
      CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        razon_social VARCHAR(255) NOT NULL,
        ruc_dni VARCHAR(20),
        tipo_documento VARCHAR(20),
        direccion VARCHAR(255),
        telefono VARCHAR(50),
        email VARCHAR(150),
        contacto_nombre VARCHAR(150),
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ruc_dni (ruc_dni)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlProveedores);
    console.log('✅ Tabla proveedores creada/verificada');

    // Tabla principal: rendiciones
    const sqlRendiciones = `
      CREATE TABLE IF NOT EXISTS rendiciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        formato_emision_id INT NULL,
        formato_emisiones_detalles_id INT NOT NULL,
        tipo_comprobante_id INT NULL,
        proveedor_id INT NULL,
        numero_comprobante VARCHAR(50),
        fecha_comprobante DATE,
        monto DECIMAL(10,2) DEFAULT 0,
        tipo_viatitico ENUM('ALIMENTACIÓN','HOSPEDAJE','MOVILIDAD_LOCAL') NULL,
        estado_rendicion ENUM('PENDIENTE','EN_REVISIÓN','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE',
        observacion_rechazo TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (formato_emision_id) REFERENCES formato_emisiones(id) ON DELETE SET NULL,
        FOREIGN KEY (formato_emisiones_detalles_id) REFERENCES formato_emisiones_detalles(id) ON DELETE CASCADE,
        FOREIGN KEY (tipo_comprobante_id) REFERENCES tipo_comprobante(id) ON DELETE SET NULL,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
        INDEX idx_formato (formato_emision_id),
        INDEX idx_formato_detalle (formato_emisiones_detalles_id),
        INDEX idx_estado (estado_rendicion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlRendiciones);
    console.log('✅ Tabla rendiciones creada/verificada');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SISTEMA DE RENDICIONES LISTO');
    console.log('   └─ tipo_comprobante (maestro)');
    console.log('   └─ proveedores (maestro)');
    console.log('   └─ rendiciones (principal)\n');

    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tablas ya existen (omitido)');
      return true;
    }
    console.error('❌ Error al crear tablas de rendiciones:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { crearTablasRendicionesMaestras };