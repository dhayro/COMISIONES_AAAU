const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Password123',
  database: 'comisiones_db'
});

const asignacionesAmbito = {
  // Admin
  'admin': 1,
  // rflores - AAA
  'rflores': 1,
  // lrios - ALA ATALAYA
  'lrios': 3,
  // Otros usuarios - asignar a 1 (AAA) por defecto
};

(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    console.log('\n📋 ASIGNANDO AMBITO_ID A USUARIOS...\n');
    
    // Ver usuarios actuales
    const [usuarios] = await conn.query('SELECT id, username, nombre, ambito_id FROM users');
    
    console.log('USUARIOS ACTUALES:');
    usuarios.forEach(u => {
      console.log(`  ${u.id}: ${u.username} (${u.nombre}) - ambito_id: ${u.ambito_id}`);
    });
    
    console.log('\n ACTUALIZANDO...\n');
    
    // Actualizar cada usuario
    for (const user of usuarios) {
      let ambitoId = asignacionesAmbito[user.username] || 1; // Default: 1 (AAA)
      
      await conn.query(
        'UPDATE users SET ambito_id = ? WHERE id = ?',
        [ambitoId, user.id]
      );
      
      console.log(`✓ ${user.username} → ambito_id=${ambitoId}`);
    }
    
    console.log('\n✅ ACTUALIZACIÓN COMPLETADA\n');
    
    // Verificar
    const [usuariosActualizados] = await conn.query('SELECT id, username, ambito_id FROM users');
    console.log('RESULTADO FINAL:');
    usuariosActualizados.forEach(u => {
      console.log(`  ${u.username}: ambito_id=${u.ambito_id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message, '\n');
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
})();
