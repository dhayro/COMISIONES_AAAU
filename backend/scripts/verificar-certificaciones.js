const { pool } = require('../config/database');

async function verificarTablas() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('\n🔍 Verificando tablas de certificaciones...\n');
    
    // Verificar tabla certificaciones_credito
    const [tablas1] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificaciones_credito'`
    );
    
    if (tablas1.length > 0) {
      console.log('✅ Tabla certificaciones_credito existe');
      
      // Mostrar columnas
      const [columnas] = await connection.query('DESC certificaciones_credito');
      console.log(`   Columnas: ${columnas.length}`);
      console.log('   Campos:', columnas.map(c => c.Field).join(', '));
    } else {
      console.log('❌ Tabla certificaciones_credito NO existe');
    }
    
    // Verificar tabla detalles
    const [tablas2] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'detalles_certificacion_credito'`
    );
    
    if (tablas2.length > 0) {
      console.log('✅ Tabla detalles_certificacion_credito existe');
      
      // Mostrar columnas
      const [columnas] = await connection.query('DESC detalles_certificacion_credito');
      console.log(`   Columnas: ${columnas.length}`);
      console.log('   Campos:', columnas.map(c => c.Field).join(', '));
    } else {
      console.log('❌ Tabla detalles_certificacion_credito NO existe');
    }
    
    // Verificar vista
    const [vistas] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'VIEW' AND TABLE_NAME = 'certificaciones_credito_detalladas'`
    );
    
    if (vistas.length > 0) {
      console.log('✅ Vista certificaciones_credito_detalladas existe');
    } else {
      console.log('❌ Vista certificaciones_credito_detalladas NO existe');
    }
    
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

verificarTablas();
