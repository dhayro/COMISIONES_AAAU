const bcrypt = require('bcryptjs');

// El hash que está en la BD
const hashEnBD = '$2b$10$xRYrCjgzWtyej4r2lJP5Ve8kLQaME3nHqUTgWIs7pWg.iz/jIXwbO';

// La contraseña que debería ser
const passwordIngresado = 'Autoridad1';

(async () => {
  try {
    const esValida = await bcrypt.compare(passwordIngresado, hashEnBD);
    console.log(`\n✅ Hash en BD: ${hashEnBD}`);
    console.log(`🔑 Contraseña ingresada: ${passwordIngresado}`);
    console.log(`\n🔍 ¿Es válida la contraseña? ${esValida ? '✅ SÍ' : '❌ NO'}`);
    
    if (esValida) {
      console.log('\n✅ La contraseña es CORRECTA. El hash coincide.\n');
    } else {
      console.log('\n❌ La contraseña NO es válida. El hash NO coincide.\n');
      console.log('Generando nuevo hash para Autoridad1...');
      const nuevoHash = await bcrypt.hash('Autoridad1', 10);
      console.log(`Nuevo hash: ${nuevoHash}\n`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
