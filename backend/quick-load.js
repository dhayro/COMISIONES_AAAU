const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'comisiones_db'
});

connection.connect(err => {
  if (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado');
  
  connection.query('DELETE FROM users', err => {
    if (err) console.log('Error DELETE:', err.message);
    console.log('🧹 Tabla limpiada');
    
    const sql = `INSERT INTO users (username, email, password, nombre, rol, activo, creado_en) VALUES 
    ('admin', 'dhayro.kong@hotmail.com', '$2b$10$xRYrCjgzWtyej4r2lJP5Ve8kLQaME3nHqUTgWIs7pWg.iz/jIXwbO', 'Administrador Sistema', 'admin', 1, NOW()),
    ('dkong', 'dhayro27@gmail.com', '$2b$10$LPNzM/j2gCEIDAjIwLzVwuDF94RPibit/mUGrrHocOzKRqmJ38d7O', 'DHAYRO KONG TORRES', 'usuario', 1, NOW()),
    ('carcos', 'carcosbinder@gmail.com', '$2b$10$dqVfIetTQm09JGu3JT7Ec.wE8f4GHY8ENd2AGCTR3hHAnChM33MEa', 'CAROL MELANI ARCOS BINDER', 'usuario', 1, NOW()),
    ('atello', 'alan.tellob@gmail.com', '$2b$10$sOaQZaACBZroq9UzqT/vgeRioidhwmy4E5ezN/kAl6shv73/2wOpO', 'ALAN ROMEO TELLO BARDALES', 'usuario', 1, NOW()),
    ('nsalinas', 'salinaspimentel@gmail.com', '$2b$10$Ja95niuSP6L0616Sv/2d8u9yHr9Vn1b38Js/Wb9BoQ4aUzm17jDFO', 'NATHALY MISHEL SALINAS PIMENTEL', 'usuario', 1, NOW()),
    ('prengifo', 'prengifo@ana.gob.pe', '$2b$10$fZg8i1CW.CHScQcOgnSG9elnQ8TiJCcnUeLWVig4FFvPKLqYeQJnC', 'PRISCILIA LEONOR RENGIFO SILVA', 'usuario', 1, NOW()),
    ('ealiaga', 'ealiaga@ana.gob.pe', '$2b$10$uGkBP3P/3i.Kz7uw5jwvZO7Tn037yc.ZNLSRF5YkFzRM/lNjatC0C', 'ERIC EDILBERTO ALIAGA ROMAYNA', 'usuario', 1, NOW()),
    ('moyola', 'moyola@ana.gob.pe', '$2b$10$CAAyRvpdNjVodHDRMwPko.g8bmLbjaLqmkv67gSiSFRnY14U3F.ai', 'MILNER OYOLA VALENCIA', 'usuario', 1, NOW()),
    ('jmatta', 'jmatta@ana.gob.pe', '$2b$10$RUgmyMrTTlloURMPu2mfreoNSJtkN9QEmWdZdQNsLqsDILsEY.EUW', 'JUAN CARLOS MATTA ROMERO', 'usuario', 1, NOW()),
    ('calegria', 'calegria@ana.gob.pe', '$2b$10$VowccslBnfzYNT9Gfluase5N94n2DOWDlnHbf0FudRDkRxwN8FC2W', 'CLIFF RICHARD ALEGRÍA FLORES', 'usuario', 1, NOW()),
    ('lflores', 'lflores@ana.gob.pe', '$2b$10$MEfPhUPVsEhYGTNJUUp2hufOHz7Jl98Trc1pwrC4gtPSNmkY06RwO', 'LILIANA SOFIA FLORES PINEDA', 'usuario', 1, NOW()),
    ('fcastillo', 'fcastillo@ana.gob.pe', '$2b$10$.M1KG2jxhGLxCxutTSYXaeocC1Ry.OYcJ/J68oIxtU6NNh/pfFko2', 'FRANCO JOSUE CASTILLO CULQUICHICON', 'usuario', 1, NOW()),
    ('snunez', 'snunez@ana.gob.pe', '$2b$10$GusoTIWka1O5IxPaK6ysi.nqd59GKdJSp6LfIF34bxKD7Zhmc4MdO', 'SANTOS ANDRES NUÑEZ COTRINA', 'usuario', 1, NOW()),
    ('rflores', 'rfloresa@ana.gob.pe', '$2b$10$1Fdv/GaNP.2iQ8GyVAzz.uJn0a6jZ3KZq0OQA.z7UkJ.1J.R.HrI2', 'RAUL EDWIN FLORES ALLPAS', 'usuario', 1, NOW()),
    ('bpanana', 'bpanana@ana.gob.pe', '$2b$10$F0JAaNq2RPhY8S/0Xm5cw.dEGOpTAlMIrJBOp78monIDV7498z8zW', 'BETTY ESTHER PANANA JAUREGUI', 'usuario', 1, NOW()),
    ('epina', 'epina@ana.gob.pe', '$2b$10$nIiz0I/itlFXKG35qTbBH.ItoRuutFKgNKn7HxCIbueTNb.YruX.i', 'EVELYN GERALDINE PIÑA PEREZ', 'usuario', 1, NOW()),
    ('daguinaga', 'daguinaga@ana.gob.pe', '$2b$10$22BrO4.VnR71L4ruwM908u5kFNKaPP2Yy3Z6V9q2S67g6FEMEqalS', 'DAVID ERNESTO AGUINAGA MANTILLA', 'usuario', 1, NOW()),
    ('nseijas', 'nseijas@ana.gob.pe', '$2b$10$E8VXnVjkMmlpUURYTEcmlODstQ8GzMQ5NhzgzjzKJQy4tGQgOi3BS', 'NOBEL HOMERO SEIJAS DEL AGUILA', 'usuario', 1, NOW()),
    ('cangulo', 'cangulo@ana.gob.pe', '$2b$10$rYCe/c7w8KdVQfovolxW3eaOFk6Kwl0sAOvuRp10AqTeXtW6X9PmC', 'CARLOS ALBERTO ANGULO ACOSTA', 'usuario', 1, NOW()),
    ('lacuna', 'leysi.arengifo2@hotmail.com', '$2b$10$p6C8MY1cY9TZijIyFU3Wh.Fj4ujSVuz5MKeaTV.Sy2Pr2pCov9Wk6', 'LEYSI MARIBEL ACUÑA RENGIFO', 'usuario', 1, NOW()),
    ('mtalavera', 'mariatalaverab@gmail.com', '$2b$10$eLNX6nYWZhmKyGO1O5TcLux/DJMkTbt8MvGJZVkDQ3ehEqNOT3t6.', 'MARIA INES TALAVERA BERMUDO', 'usuario', 1, NOW()),
    ('jmunante', 'juliocesarmt@gmail.com', '$2b$10$dXq/bFv4T0DZN2X5rTirt.XqafLT5njae6jHLSyarPNv3ZbtiMKy2', 'JULIO CÉSAR MUÑANTE TARICUARIMA', 'usuario', 1, NOW()),
    ('sregalado', 'sandynicolrs@gmail.com', '$2b$10$DUCufLsZrbM/VjDiBDj75OtAZqqcCYsO.va19sLNIixVk51Lu5WgK', 'SANDY NICOL REGALADO SIMON', 'usuario', 1, NOW()),
    ('olopez', 'lando350ambiente@gmail.com', '$2b$10$2x9AN5CypKV8aQqatU3Eiuw3k4kP6rNPxJG8X8L4O4OOH/5bpiFSW', 'ORLANDO LOPEZ RAMIREZ', 'usuario', 1, NOW()),
    ('jferreyros', 'joyceferreyros27@gmail.com', '$2b$10$.5.I3CDsycvjiNB3igMVteMhM5vrFN2IH7iCUhr.unD0tJm2MDl5W', 'JOYCE ELIANA FERREYROS SANCHEZ', 'usuario', 1, NOW()),
    ('jolortegui', 'jolorteguiperez@gmail.com', '$2b$10$fPXDM7or8nX6vl/mjFUhZepmq1ZNBPDN3n4GpBia1wtPRab8nmUpK', 'JERLIN DAVID OLORTEGUI PEREZ', 'usuario', 1, NOW())`;
    
    connection.query(sql, err => {
      if (err) {
        console.log('❌ Error INSERT:', err.message);
      } else {
        console.log('✅ 26 usuarios cargados exitosamente');
      }
      connection.end();
    });
  });
});
