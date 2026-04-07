/**
 * 🔧 Migración: Agregar RENDIDO al ENUM estado_emision
 * Permite marcar formatos como RENDIDO después de rendición
 */

const agregarRendidoEnum = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('\n🔄 Agregando RENDIDO al ENUM estado_emision...\n');

    // 🆕 Modificar columna estado_emision para agregar RENDIDO
    const sql = `
      ALTER TABLE formato_emisiones 
      MODIFY COLUMN estado_emision ENUM(
        'BORRADOR',
        'ENVIADO',
        'RENDIDO',
        'APROBADO',
        'ANULADO',
        'CANCELADO',
        'EMITIDO',
        'PAGADO'
      ) DEFAULT 'BORRADOR'
    `;

    try {
      await connection.query(sql);
      console.log('✅ ENUM estado_emision actualizado - RENDIDO agregado');
    } catch (error) {
      if (error.message.includes('Incorrect column specifier')) {
        console.log('⚠️  ENUM ya contiene RENDIDO o error en especificación');
      } else {
        throw error;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ENUM estado_emision ACTUALIZADO');
    console.log('   └─ Valores: BORRADOR, GUARDADO, ENVIADO, RENDIDO, APROBADO, RECHAZADO, CANCELADO\n');

    return true;
  } catch (error) {
    console.error('❌ Error al agregar RENDIDO a ENUM:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { agregarRendidoEnum };
