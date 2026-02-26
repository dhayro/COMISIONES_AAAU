const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Credenciales de prueba
const usuarios = [
  { email: 'admin@test.com', password: 'Autoridad1', nombre: 'ADMIN' },
  { email: 'snunez@ana.gob.pe', password: 'Autoridad1', nombre: 'SNUNEZ (Jefe)' },
  { email: 'dhayro27@gmail.com', password: 'Autoridad1', nombre: 'DKONG (Usuario)' },
  { email: 'rfloresa@ana.gob.pe', password: 'Autoridad1', nombre: 'RFLORES (Admin)' }
];

async function testComisiones() {
  try {
    console.log('\n🧪 PRUEBA DE FILTRADO DE COMISIONES POR ROL\n');
    console.log('=' .repeat(100));

    for (const usuario of usuarios) {
      try {
        // 1. Login
        console.log(`\n👤 Probando con: ${usuario.nombre}`);
        console.log('-' .repeat(100));

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: usuario.email,
          password: usuario.password
        });

        const token = loginRes.data.token;
        const userData = loginRes.data.usuario;

        console.log(`   Email: ${userData.email}`);
        console.log(`   Nombre: ${userData.nombre}`);
        console.log(`   Rol: ${userData.rol}`);

        // 2. Obtener comisiones
        const comisionesRes = await axios.get(`${API_URL}/comisiones`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const comisiones = comisionesRes.data;
        console.log(`\n   📊 Comisiones visibles: ${comisiones.length}`);

        if (comisiones.length > 0) {
          console.log(`\n   Detalles:
`);
          comisiones.forEach((c, idx) => {
            console.log(`   ${idx + 1}. ID: ${c.id}, Usuario ID: ${c.usuario_id}, Lugar: ${c.lugar}, Estado: ${c.aprobacion_estado}`);
          });
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 400) {
          console.log(`   ⚠️  Usuario no encontrado o credenciales incorrectas`);
        } else {
          console.error(`   ❌ Error:`, error.message);
        }
      }
    }

    console.log('\n' + '=' .repeat(100));
    console.log('\n✅ PRUEBA COMPLETADA\n');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testComisiones();
