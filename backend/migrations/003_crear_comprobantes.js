/**
 * 🔧 Migración: Crear tablas de Comprobantes y Rendición
 */

const crearTablasComprobantes = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n🔄 Creando tablas de Comprobantes...\n');

    // 📌 Tabla MAESTRA: comprobantes
    const sqlComprobantes = `
      CREATE TABLE IF NOT EXISTS comprobantes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        formato_emision_id INT NOT NULL,
        numero_comprobante VARCHAR(50),
        tipo_comprobante ENUM('FACTURA', 'BOLETA', 'TICKET', 'RECIBO') NOT NULL,
        fecha_comprobante DATE NOT NULL,
        proveedor_razon_social VARCHAR(255),
        proveedor_ruc_dni VARCHAR(20),
        monto DECIMAL(10, 2) NOT NULL,
        estado_rendicion ENUM('PENDIENTE', 'EN_REVISIÓN', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
        observacion_rechazo TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (formato_emision_id) REFERENCES formato_emisiones(id) ON DELETE CASCADE,
        INDEX idx_formato (formato_emision_id),
        INDEX idx_estado (estado_rendicion),
        INDEX idx_fecha (fecha_comprobante)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlComprobantes);
    console.log('✅ Tabla comprobantes creada/verificada');

    // 📌 Tabla DETALLE: comprobante_detalles
    const sqlDetalles = `
      CREATE TABLE IF NOT EXISTS comprobante_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comprobante_id INT NOT NULL,
        tipo_viatitico ENUM('ALIMENTACIÓN', 'HOSPEDAJE', 'MOVILIDAD_LOCAL') NOT NULL,
        cantidad DECIMAL(10, 2) NOT NULL,
        descripcion TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE CASCADE,
        INDEX idx_comprobante (comprobante_id),
        INDEX idx_tipo (tipo_viatitico)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlDetalles);
    console.log('✅ Tabla comprobante_detalles creada/verificada');

    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✅ TABLAS DE COMPROBANTES LISTAS');
    console.log('   └─ comprobantes (Maestra)');
    console.log('   └─ comprobante_detalles (Detalle)\n');

    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tablas ya existen (omitido)');
      return true;
    }
    console.error('❌ Error al crear tablas de comprobantes:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { crearTablasComprobantes };
