const { pool } = require('./config/database');

async function verificarBaseDatos() {
  try {
    console.log('\n📊 VERIFICACIÓN DE BASE DE DATOS\n');
    console.log('=' .repeat(80));

    // 1. Verificar usuarios
    console.log('\n1️⃣  USUARIOS EN LA BASE DE DATOS:');
    console.log('-' .repeat(80));
    
    const [usuarios] = await pool.query(
      'SELECT id, email, nombre, rol FROM users ORDER BY id'
    );

    console.log(`\nTotal de usuarios: ${usuarios.length}\n`);
    usuarios.forEach(u => {
      const rolEmoji = u.rol === 'admin' ? '⚙️' : u.rol === 'jefe' ? '👥' : u.rol === 'usuario' ? '📝' : u.rol === 'administrativo' ? '👨‍💼' : '❓';
      console.log(`${rolEmoji} ID: ${u.id.toString().padEnd(3)} | Email: ${u.email.padEnd(20)} | Nombre: ${u.nombre.padEnd(20)} | Rol: ${u.rol}`);
    });

    // 2. Contar por rol
    console.log('\n2️⃣  CONTEO DE USUARIOS POR ROL:');
    console.log('-' .repeat(80));
    
    const [conteo] = await pool.query(
      'SELECT rol, COUNT(*) as cantidad FROM users GROUP BY rol ORDER BY rol'
    );

    conteo.forEach(c => {
      const rolEmoji = c.rol === 'admin' ? '⚙️' : c.rol === 'jefe' ? '👥' : c.rol === 'usuario' ? '📝' : c.rol === 'administrativo' ? '👨‍💼' : '❓';
      console.log(`${rolEmoji} ${c.rol.padEnd(15)}: ${c.cantidad} usuarios`);
    });

    // 3. Verificar usuarios clave
    console.log('\n3️⃣  USUARIOS CLAVE:');
    console.log('-' .repeat(80));
    
    const [clave] = await pool.query(
      'SELECT id, email, nombre, rol FROM users WHERE email IN ("admin@test.com", "rflores@test.com", "snunez@test.com", "dkong@test.com") ORDER BY email'
    );

    clave.forEach(u => {
      const rolEmoji = u.rol === 'admin' ? '⚙️' : u.rol === 'jefe' ? '👥' : u.rol === 'usuario' ? '📝' : u.rol === 'administrativo' ? '👨‍💼' : '❓';
      console.log(`${rolEmoji} ${u.email.padEnd(25)} | ${u.nombre.padEnd(20)} | ${u.rol}`);
    });

    // 4. Verificar tabla comisiones
    console.log('\n4️⃣  COMISIONES EN LA BASE DE DATOS:');
    console.log('-' .repeat(80));
    
    const [comisiones] = await pool.query(
      'SELECT COUNT(*) as total FROM comisiones'
    );
    console.log(`Total de comisiones: ${comisiones[0].total}`);

    // 5. Verificar enum de roles
    console.log('\n5️⃣  VERIFICACIÓN DE ENUM ROL EN TABLA users:');
    console.log('-' .repeat(80));
    
    const [tableInfo] = await pool.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol'"
    );
    
    if (tableInfo.length > 0) {
      console.log(`Enum definido: ${tableInfo[0].COLUMN_TYPE}`);
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ VERIFICACIÓN COMPLETADA\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verificarBaseDatos();
