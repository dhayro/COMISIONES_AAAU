const { pool } = require('../config/database');

const enTransaccion = async (operacion) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await operacion(conn);
    await conn.commit();
    return resultado;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = { enTransaccion };
