#!/usr/bin/env node
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'comisiones_db'
});

const usuarios = [
  [1, 'admin', 'dhayro.kong@hotmail.com', '$2b$10$xRYrCjgzWtyej4r2lJP5Ve8kLQaME3nHqUTgWIs7pWg.iz/jIXwbO', 'Administrador Sistema', 'admin', 1],
  [2, 'dkong', 'dhayro27@gmail.com', '$2b$10$LPNzM/j2gCEIDAjIwLzVwuDF94RPibit/mUGrrHocOzKRqmJ38d7O', 'DHAYRO KONG TORRES', 'usuario', 1],
  [3, 'carcos', 'carcosbinder@gmail.com', '$2b$10$dqVfIetTQm09JGu3JT7Ec.wE8f4GHY8ENd2AGCTR3hHAnChM33MEa', 'CAROL MELANI ARCOS BINDER', 'usuario', 1],
  [4, 'atello', 'alan.tellob@gmail.com', '$2b$10$sOaQZaACBZroq9UzqT/vgeRioidhwmy4E5ezN/kAl6shv73/2wOpO', 'ALAN ROMEO TELLO BARDALES', 'usuario', 1],
  [5, 'nsalinas', 'salinaspimentel@gmail.com', '$2b$10$Ja95niuSP6L0616Sv/2d8u9yHr9Vn1b38Js/Wb9BoQ4aUzm17jDFO', 'NATHALY MISHEL SALINAS PIMENTEL', 'usuario', 1],
  [6, 'prengifo', 'prengifo@ana.gob.pe', '$2b$10$fZg8i1CW.CHScQcOgnSG9elnQ8TiJCcnUeLWVig4FFvPKLqYeQJnC', 'PRISCILIA LEONOR RENGIFO SILVA', 'usuario', 1],
  [7, 'ealiaga', 'ealiaga@ana.gob.pe', '$2b$10$uGkBP3P/3i.Kz7uw5jwvZO7Tn037yc.ZNLSRF5YkFzRM/lNjatC0C', 'ERIC EDILBERTO ALIAGA ROMAYNA', 'usuario', 1],
  [8, 'moyola', 'moyola@ana.gob.pe', '$2b$10$CAAyRvpdNjVodHDRMwPko.g8bmLbjaLqmkv67gSiSFRnY14U3F.ai', 'MILNER OYOLA VALENCIA', 'usuario', 1],
  [9, 'jmatta', 'jmatta@ana.gob.pe', '$2b$10$RUgmyMrTTlloURMPu2mfreoNSJtkN9QEmWdZdQNsLqsDILsEY.EUW', 'JUAN CARLOS MATTA ROMERO', 'usuario', 1],
  [10, 'calegria', 'calegria@ana.gob.pe', '$2b$10$VowccslBnfzYNT9Gfluase5N94n2DOWDlnHbf0FudRDkRxwN8FC2W', 'CLIFF RICHARD ALEGRÍA FLORES', 'usuario', 1],
  [11, 'lflores', 'lflores@ana.gob.pe', '$2b$10$MEfPhUPVsEhYGTNJUUp2hufOHz7Jl98Trc1pwrC4gtPSNmkY06RwO', 'LILIANA SOFIA FLORES PINEDA', 'usuario', 1],
  [12, 'fcastillo', 'fcastillo@ana.gob.pe', '$2b$10$.M1KG2jxhGLxCxutTSYXaeocC1Ry.OYcJ/J68oIxtU6NNh/pfFko2', 'FRANCO JOSUE CASTILLO CULQUICHICON', 'usuario', 1],
  [13, 'snunez', 'snunez@ana.gob.pe', '$2b$10$GusoTIWka1O5IxPaK6ysi.nqd59GKdJSp6LfIF34bxKD7Zhmc4MdO', 'SANTOS ANDRES NUÑEZ COTRINA', 'usuario', 1],
  [14, 'rflores', 'rfloresa@ana.gob.pe', '$2b$10$1Fdv/GaNP.2iQ8GyVAzz.uJn0a6jZ3KZq0OQA.z7UkJ.1J.R.HrI2', 'RAUL EDWIN FLORES ALLPAS', 'usuario', 1],
  [15, 'bpanana', 'bpanana@ana.gob.pe', '$2b$10$F0JAaNq2RPhY8S/0Xm5cw.dEGOpTAlMIrJBOp78monIDV7498z8zW', 'BETTY ESTHER PANANA JAUREGUI', 'usuario', 1],
  [16, 'epina', 'epina@ana.gob.pe', '$2b$10$nIiz0I/itlFXKG35qTbBH.ItoRuutFKgNKn7HxCIbueTNb.YruX.i', 'EVELYN GERALDINE PIÑA PEREZ', 'usuario', 1],
  [17, 'daguinaga', 'daguinaga@ana.gob.pe', '$2b$10$22BrO4.VnR71L4ruwM908u5kFNKaPP2Yy3Z6V9q2S67g6FEMEqalS', 'DAVID ERNESTO AGUINAGA MANTILLA', 'usuario', 1],
  [18, 'nseijas', 'nseijas@ana.gob.pe', '$2b$10$E8VXnVjkMmlpUURYTEcmlODstQ8GzMQ5NhzgzjzKJQy4tGQgOi3BS', 'NOBEL HOMERO SEIJAS DEL AGUILA', 'usuario', 1],
  [19, 'cangulo', 'cangulo@ana.gob.pe', '$2b$10$rYCe/c7w8KdVQfovolxW3eaOFk6Kwl0sAOvuRp10AqTeXtW6X9PmC', 'CARLOS ALBERTO ANGULO ACOSTA', 'usuario', 1],
  [20, 'lacuna', 'leysi.arengifo2@hotmail.com', '$2b$10$p6C8MY1cY9TZijIyFU3Wh.Fj4ujSVuz5MKeaTV.Sy2Pr2pCov9Wk6', 'LEYSI MARIBEL ACUÑA RENGIFO', 'usuario', 1],
  [21, 'mtalavera', 'mariatalaverab@gmail.com', '$2b$10$eLNX6nYWZhmKyGO1O5TcLux/DJMkTbt8MvGJZVkDQ3ehEqNOT3t6.', 'MARIA INES TALAVERA BERMUDO', 'usuario', 1],
  [22, 'jmunante', 'juliocesarmt@gmail.com', '$2b$10$dXq/bFv4T0DZN2X5rTirt.XqafLT5njae6jHLSyarPNv3ZbtiMKy2', 'JULIO CÉSAR MUÑANTE TARICUARIMA', 'usuario', 1],
  [23, 'sregalado', 'sandynicolrs@gmail.com', '$2b$10$DUCufLsZrbM/VjDiBDj75OtAZqqcCYsO.va19sLNIixVk51Lu5WgK', 'SANDY NICOL REGALADO SIMON', 'usuario', 1],
  [24, 'olopez', 'lando350ambiente@gmail.com', '$2b$10$2x9AN5CypKV8aQqatU3Eiuw3k4kP6rNPxJG8X8L4O4OOH/5bpiFSW', 'ORLANDO LOPEZ RAMIREZ', 'usuario', 1],
  [25, 'jferreyros', 'joyceferreyros27@gmail.com', '$2b$10$.5.I3CDsycvjiNB3igMVteMhM5vrFN2IH7iCUhr.unD0tJm2MDl5W', 'JOYCE ELIANA FERREYROS SANCHEZ', 'usuario', 1],
  [26, 'jolortegui', 'jolorteguiperez@gmail.com', '$2b$10$fPXDM7or8nX6vl/mjFUhZepmq1ZNBPDN3n4GpBia1wtPRab8nmUpK', 'JERLIN DAVID OLORTEGUI PEREZ', 'usuario', 1],
];

connection.connect((err) => {
  if (err) {
    console.error('❌ Error conectando:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la BD\n');

  // Desactivar FK checks
  connection.query('SET FOREIGN_KEY_CHECKS=0', (err) => {
    if (err) {
      console.error('Error desactivando FK checks:', err.message);
      connection.end();
      process.exit(1);
    }

    // Limpiar tabla
    connection.query('DELETE FROM users', (err) => {
      if (err) {
        console.error('Error limpiando tabla:', err.message);
      }
      console.log('🧹 Tabla limpiada\n');

      let insertados = 0;

      // Insertar usuarios
      usuarios.forEach((usuario, idx) => {
        const query = 'INSERT INTO users (id, username, email, password, nombre, rol, activo, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
        connection.query(query, usuario, (err) => {
          if (err) {
            console.error(`❌ Error en usuario ${usuario[1]}:`, err.message);
          } else {
            console.log(`✅ ${usuario[1].padEnd(15)} | ${usuario[2]}`);
            insertados++;
          }

          // Si es el último, cerrar conexión
          if (idx === usuarios.length - 1) {
            setTimeout(() => {
              // Reactivar FK checks
              connection.query('SET FOREIGN_KEY_CHECKS=1', (err) => {
                console.log(`\n✅ ${insertados} usuarios insertados exitosamente\n`);
                connection.end();
              });
            }, 500);
          }
        });
      });
    });
  });
});
