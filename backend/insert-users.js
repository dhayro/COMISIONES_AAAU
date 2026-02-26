#!/usr/bin/env node

/**
 * Script para insertar usuarios por defecto
 * Contraseña: Autoridad1
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const usuarios = [
  { username: 'admin', email: 'dhayro.kong@hotmail.com', nombre: 'Administrador', apellido: 'Sistema', rol: 'admin' },
  { username: 'dkong', email: 'dhayro27@gmail.com', nombre: 'DHAYRO', apellido: 'KONG TORRES', rol: 'usuario' },
  { username: 'carcos', email: 'carcosbinder@gmail.com', nombre: 'CAROL MELANI', apellido: 'ARCOS BINDER', rol: 'usuario' },
  { username: 'atello', email: 'alan.tellob@gmail.com', nombre: 'ALAN ROMEO', apellido: 'TELLO BARDALES', rol: 'usuario' },
  { username: 'nsalinas', email: 'salinaspimentel@gmail.com', nombre: 'NATHALY MISHEL', apellido: 'SALINAS PIMENTEL', rol: 'usuario' },
  { username: 'prengifo', email: 'prengifo@ana.gob.pe', nombre: 'PRISCILIA LEONOR', apellido: 'RENGIFO SILVA', rol: 'usuario' },
  { username: 'ealiaga', email: 'ealiaga@ana.gob.pe', nombre: 'ERIC EDILBERTO', apellido: 'ALIAGA ROMAYNA', rol: 'usuario' },
  { username: 'moyola', email: 'moyola@ana.gob.pe', nombre: 'MILNER', apellido: 'OYOLA VALENCIA', rol: 'usuario' },
  { username: 'jmatta', email: 'jmatta@ana.gob.pe', nombre: 'JUAN CARLOS', apellido: 'MATTA ROMERO', rol: 'usuario' },
  { username: 'calegria', email: 'calegria@ana.gob.pe', nombre: 'CLIFF RICHARD', apellido: 'ALEGRÍA FLORES', rol: 'usuario' },
  { username: 'lflores', email: 'lflores@ana.gob.pe', nombre: 'LILIANA SOFIA', apellido: 'FLORES PINEDA', rol: 'usuario' },
  { username: 'fcastillo', email: 'fcastillo@ana.gob.pe', nombre: 'FRANCO JOSUE', apellido: 'CASTILLO CULQUICHICON', rol: 'usuario' },
  { username: 'snunez', email: 'snunez@ana.gob.pe', nombre: 'SANTOS ANDRES', apellido: 'NUÑEZ COTRINA', rol: 'usuario' },
  { username: 'rflores', email: 'rfloresa@ana.gob.pe', nombre: 'RAUL EDWIN', apellido: 'FLORES ALLPAS', rol: 'usuario' },
  { username: 'bpanana', email: 'bpanana@ana.gob.pe', nombre: 'BETTY ESTHER', apellido: 'PANANA JAUREGUI', rol: 'usuario' },
  { username: 'epina', email: 'epina@ana.gob.pe', nombre: 'EVELYN GERALDINE', apellido: 'PIÑA PEREZ', rol: 'usuario' },
  { username: 'daguinaga', email: 'daguinaga@ana.gob.pe', nombre: 'DAVID ERNESTO', apellido: 'AGUINAGA MANTILLA', rol: 'usuario' },
  { username: 'nseijas', email: 'nseijas@ana.gob.pe', nombre: 'NOBEL HOMERO', apellido: 'SEIJAS DEL AGUILA', rol: 'usuario' },
  { username: 'cangulo', email: 'cangulo@ana.gob.pe', nombre: 'CARLOS ALBERTO', apellido: 'ANGULO ACOSTA', rol: 'usuario' },
  { username: 'lacuna', email: 'leysi.arengifo2@hotmail.com', nombre: 'LEYSI MARIBEL', apellido: 'ACUÑA RENGIFO', rol: 'usuario' },
  { username: 'mtalavera', email: 'mariatalaverab@gmail.com', nombre: 'MARIA INES', apellido: 'TALAVERA BERMUDO', rol: 'usuario' },
  { username: 'jmunante', email: 'juliocesarmt@gmail.com', nombre: 'JULIO CÉSAR', apellido: 'MUÑANTE TARICUARIMA', rol: 'usuario' },
  { username: 'sregalado', email: 'sandynicolrs@gmail.com', nombre: 'SANDY NICOL', apellido: 'REGALADO SIMON', rol: 'usuario' },
  { username: 'olopez', email: 'lando350ambiente@gmail.com', nombre: 'ORLANDO', apellido: 'LOPEZ RAMIREZ', rol: 'usuario' },
  { username: 'jferreyros', email: 'joyceferreyros27@gmail.com', nombre: 'JOYCE ELIANA', apellido: 'FERREYROS SANCHEZ', rol: 'usuario' },
  { username: 'jolortegui', email: 'jolorteguiperez@gmail.com', nombre: 'JERLIN DAVID', apellido: 'OLORTEGUI PEREZ', rol: 'usuario' }
];

async function insertarUsuarios() {
  let connection;
  try {
    console.log('\n🔄 Insertando usuarios por defecto...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash('Autoridad1', 10);

    for (const user of usuarios) {
      try {
        const query = `
          INSERT INTO users (username, email, password, nombre, rol, activo)
          VALUES (?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE password = VALUES(password), rol = VALUES(rol)
        `;

        const nombreCompleto = `${user.nombre} ${user.apellido}`;
        
        await connection.query(query, [
          user.username,
          user.email,
          passwordHash,
          nombreCompleto,
          user.rol
        ]);

        console.log(`✅ ${user.username} (${user.email}) - Contraseña: Autoridad1`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  ${user.username} ya existe`);
        } else {
          console.error(`❌ Error en ${user.username}:`, error.message);
        }
      }
    }

    await connection.end();

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║ ✅ USUARIOS CARGADOS EXITOSAMENTE    ║`);
    console.log(`║ Usuario: admin                         ║`);
    console.log(`║ Contraseña: Autoridad1                ║`);
    console.log(`╚════════════════════════════════════════╝\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

insertarUsuarios();
