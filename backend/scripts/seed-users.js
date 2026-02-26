#!/usr/bin/env node

/**
 * Script de inicialización de la BD
 * Se ejecuta automáticamente al iniciar el backend
 * Crea maestros y usuarios por defecto
 */

const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'comisiones_db'
});

// Hash de 'Autoridad1' con bcrypt (10 rounds)
const PASSWORD_HASH = '$2b$10$JpEXyYm4FaYL1QBmyckUBusy7713WlDX/WuFDyc9F8ZMnuXToFzhu';

const USUARIOS = [
  ['admin', 'dhayro.kong@hotmail.com', PASSWORD_HASH, 'Administrador Sistema', 'admin', 1],
  ['dkong', 'dhayro27@gmail.com', PASSWORD_HASH, 'DHAYRO KONG TORRES', 'usuario', 1],
  ['carcos', 'carcosbinder@gmail.com', PASSWORD_HASH, 'CAROL MELANI ARCOS BINDER', 'usuario', 1],
  ['atello', 'alan.tellob@gmail.com', PASSWORD_HASH, 'ALAN ROMEO TELLO BARDALES', 'usuario', 1],
  ['nsalinas', 'salinaspimentel@gmail.com', PASSWORD_HASH, 'NATHALY MISHEL SALINAS PIMENTEL', 'usuario', 1],
  ['prengifo', 'prengifo@ana.gob.pe', PASSWORD_HASH, 'PRISCILIA LEONOR RENGIFO SILVA', 'usuario', 1],
  ['ealiaga', 'ealiaga@ana.gob.pe', PASSWORD_HASH, 'ERIC EDILBERTO ALIAGA ROMAYNA', 'usuario', 1],
  ['moyola', 'moyola@ana.gob.pe', PASSWORD_HASH, 'MILNER OYOLA VALENCIA', 'usuario', 1],
  ['jmatta', 'jmatta@ana.gob.pe', PASSWORD_HASH, 'JUAN CARLOS MATTA ROMERO', 'usuario', 1],
  ['calegria', 'calegria@ana.gob.pe', PASSWORD_HASH, 'CLIFF RICHARD ALEGRÍA FLORES', 'usuario', 1],
  ['lflores', 'lflores@ana.gob.pe', PASSWORD_HASH, 'LILIANA SOFIA FLORES PINEDA', 'usuario', 1],
  ['fcastillo', 'fcastillo@ana.gob.pe', PASSWORD_HASH, 'FRANCO JOSUE CASTILLO CULQUICHICON', 'usuario', 1],
  ['snunez', 'snunez@ana.gob.pe', PASSWORD_HASH, 'SANTOS ANDRES NUÑEZ COTRINA', 'usuario', 1],
  ['rflores', 'rfloresa@ana.gob.pe', PASSWORD_HASH, 'RAUL EDWIN FLORES ALLPAS', 'usuario', 1],
  ['bpanana', 'bpanana@ana.gob.pe', PASSWORD_HASH, 'BETTY ESTHER PANANA JAUREGUI', 'usuario', 1],
  ['epina', 'epina@ana.gob.pe', PASSWORD_HASH, 'EVELYN GERALDINE PIÑA PEREZ', 'usuario', 1],
  ['daguinaga', 'daguinaga@ana.gob.pe', PASSWORD_HASH, 'DAVID ERNESTO AGUINAGA MANTILLA', 'usuario', 1],
  ['nseijas', 'nseijas@ana.gob.pe', PASSWORD_HASH, 'NOBEL HOMERO SEIJAS DEL AGUILA', 'usuario', 1],
  ['cangulo', 'cangulo@ana.gob.pe', PASSWORD_HASH, 'CARLOS ALBERTO ANGULO ACOSTA', 'usuario', 1],
  ['lacuna', 'leysi.arengifo2@hotmail.com', PASSWORD_HASH, 'LEYSI MARIBEL ACUÑA RENGIFO', 'usuario', 1],
  ['mtalavera', 'mariatalaverab@gmail.com', PASSWORD_HASH, 'MARIA INES TALAVERA BERMUDO', 'usuario', 1],
  ['jmunante', 'juliocesarmt@gmail.com', PASSWORD_HASH, 'JULIO CÉSAR MUÑANTE TARICUARIMA', 'usuario', 1],
  ['sregalado', 'sandynicolrs@gmail.com', PASSWORD_HASH, 'SANDY NICOL REGALADO SIMON', 'usuario', 1],
  ['olopez', 'lando350ambiente@gmail.com', PASSWORD_HASH, 'ORLANDO LOPEZ RAMIREZ', 'usuario', 1],
  ['jferreyros', 'joyceferreyros27@gmail.com', PASSWORD_HASH, 'JOYCE ELIANA FERREYROS SANCHEZ', 'usuario', 1],
  ['jolortegui', 'jolorteguiperez@gmail.com', PASSWORD_HASH, 'JERLIN DAVID OLORTEGUI PEREZ', 'usuario', 1],
];

async function seedUsers() {
  return new Promise((resolve) => {
    connection.query('SELECT COUNT(*) as total FROM users', (err, results) => {
      if (err) {
        console.error('❌ Error verificando usuarios:', err.message);
        resolve();
        return;
      }

      if (results[0].total > 0) {
        console.log(`✅ Ya existen ${results[0].total} usuarios en la BD`);
        resolve();
        return;
      }

      console.log('📥 Insertando 26 usuarios por defecto...');

      let inserted = 0;
      USUARIOS.forEach((usuario, idx) => {
        const sql = 'INSERT INTO users (username, email, password, nombre, rol, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, NOW())';
        connection.query(sql, usuario, (err) => {
          inserted++;
          if (err) {
            console.error(`  ❌ Error en ${usuario[0]}`);
          } else {
            console.log(`  ✅ ${usuario[0]}`);
          }

          if (inserted === USUARIOS.length) {
            console.log(`\n✅ ${USUARIOS.length} usuarios cargados exitosamente`);
            console.log(`📝 Contraseña por defecto para todos: Autoridad1\n`);
            resolve();
          }
        });
      });
    });
  });
}

async function initialize() {
  await seedUsers();
  connection.end();
}

initialize();
