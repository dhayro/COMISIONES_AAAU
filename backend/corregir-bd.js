const { pool } = require('./config/database');

async function corregirBaseDatos() {
  try {
    console.log('\n🔧 CORRECCIÓN DE BASE DE DATOS\n');
    console.log('=' .repeat(80));

    // 1. Actualizar ENUM
    console.log('\n1️⃣  Actualizando ENUM de roles...');
    try {
      await pool.query(
        'ALTER TABLE users MODIFY COLUMN rol ENUM("admin", "jefe", "usuario", "administrativo") DEFAULT "usuario"'
      );
      console.log('   ✅ ENUM actualizado correctamente');
    } catch (e) {
      if (e.message.includes('Duplicate entry')) {
        console.log('   ℹ️  ENUM ya está actualizado');
      } else {
        throw e;
      }
    }

    // 2. Cambiar snunez a jefe
    console.log('\n2️⃣  Cambiando snunez a rol JEFE...');
    const [snunezBefore] = await pool.query(
      'SELECT id, email, nombre, rol FROM users WHERE email = "snunez@ana.gob.pe"'
    );
    
    if (snunezBefore.length > 0) {
      const snunez = snunezBefore[0];
      console.log(`   Antes: ID ${snunez.id}, ${snunez.nombre}, Rol: ${snunez.rol}`);
      
      await pool.query(
        'UPDATE users SET rol = "jefe" WHERE email = "snunez@ana.gob.pe"'
      );
      console.log(`   ✅ Ahora snunez es JEFE`);
    } else {
      console.log('   ⚠️  snunez@ana.gob.pe no encontrado');
    }

    // 3. Cambiar rfloresa a administrativo (era visitador)
    console.log('\n3️⃣  Cambiando rfloresa a rol ADMINISTRATIVO...');
    const [rflorBefore] = await pool.query(
      'SELECT id, email, nombre, rol FROM users WHERE email = "rfloresa@ana.gob.pe"'
    );
    
    if (rflorBefore.length > 0) {
      const rflor = rflorBefore[0];
      console.log(`   Antes: ID ${rflor.id}, ${rflor.nombre}, Rol: ${rflor.rol}`);
      
      await pool.query(
        'UPDATE users SET rol = "administrativo" WHERE email = "rfloresa@ana.gob.pe"'
      );
      console.log(`   ✅ Ahora rfloresa es ADMINISTRATIVO`);
    } else {
      console.log('   ⚠️  rfloresa@ana.gob.pe no encontrado');
    }

    // 4. Verificar estado final
    console.log('\n4️⃣  Estado final de usuarios clave:');
    console.log('-' .repeat(80));
    
    const [final] = await pool.query(
      'SELECT id, email, nombre, rol FROM users WHERE email IN ("snunez@ana.gob.pe", "rfloresa@ana.gob.pe", "admin@test.com", "dhayro.kong@hotmail.com") ORDER BY email'
    );

    final.forEach(u => {
      const rolEmoji = u.rol === 'admin' ? '⚙️' : u.rol === 'jefe' ? '👥' : u.rol === 'usuario' ? '📝' : u.rol === 'administrativo' ? '👨‍💼' : '❓';
      console.log(`${rolEmoji} ${u.email.padEnd(30)} | ${u.nombre.padEnd(25)} | ${u.rol}`);
    });

    // 5. Conteo final
    console.log('\n5️⃣  Conteo final de roles:');
    console.log('-' .repeat(80));
    
    const [conteoFinal] = await pool.query(
      'SELECT rol, COUNT(*) as cantidad FROM users GROUP BY rol ORDER BY rol'
    );

    conteoFinal.forEach(c => {
      const rolEmoji = c.rol === 'admin' ? '⚙️' : c.rol === 'jefe' ? '👥' : c.rol === 'usuario' ? '📝' : c.rol === 'administrativo' ? '👨‍💼' : '❓';
      console.log(`${rolEmoji} ${c.rol.padEnd(15)}: ${c.cantidad} usuarios`);
    });

    console.log('\n' + '=' .repeat(80));
    console.log('✅ CORRECCIÓN COMPLETADA\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

corregirBaseDatos();
