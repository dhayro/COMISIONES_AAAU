#!/usr/bin/env node

/**
 * Script para insertar usuarios - Versión 2
 * Más robusta con manejo de errores
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const usuarios = [
  { id: 1, username: 'admin', password: '$2b$10$xRYrCjgzWtyej4r2lJP5Ve8kLQaME3nHqUTgWIs7pWg.iz/jIXwbO', email: 'dhayro.kong@hotmail.com', nombre: 'Administrador', apellido: 'Sistema', cedula: '00000000', rol: 'admin', estado: 1 },
  { id: 2, username: 'dkong', password: '$2b$10$LPNzM/j2gCEIDAjIwLzVwuDF94RPibit/mUGrrHocOzKRqmJ38d7O', email: 'dhayro27@gmail.com', nombre: 'DHAYRO', apellido: 'KONG TORRES', cedula: '700006483', rol: 'usuario', estado: 1 },
  { id: 3, username: 'carcos', password: '$2b$10$dqVfIetTQm09JGu3JT7Ec.wE8f4GHY8ENd2AGCTR3hHAnChM33MEa', email: 'carcosbinder@gmail.com', nombre: 'CAROL MELANI', apellido: 'ARCOS BINDER', cedula: '72244188', rol: 'usuario', estado: 1 },
  { id: 4, username: 'atello', password: '$2b$10$sOaQZaACBZroq9UzqT/vgeRioidhwmy4E5ezN/kAl6shv73/2wOpO', email: 'alan.tellob@gmail.com', nombre: 'ALAN ROMEO', apellido: 'TELLO BARDALES', cedula: '43128880', rol: 'usuario', estado: 1 },
  { id: 5, username: 'nsalinas', password: '$2b$10$Ja95niuSP6L0616Sv/2d8u9yHr9Vn1b38Js/Wb9BoQ4aUzm17jDFO', email: 'salinaspimentel@gmail.com', nombre: 'NATHALY MISHEL', apellido: 'SALINAS PIMENTEL', cedula: '74633955', rol: 'usuario', estado: 1 },
  { id: 6, username: 'prengifo', password: '$2b$10$fZg8i1CW.CHScQcOgnSG9elnQ8TiJCcnUeLWVig4FFvPKLqYeQJnC', email: 'prengifo@ana.gob.pe', nombre: 'PRISCILIA LEONOR', apellido: 'RENGIFO SILVA', cedula: '40314800', rol: 'usuario', estado: 1 },
  { id: 7, username: 'ealiaga', password: '$2b$10$uGkBP3P/3i.Kz7uw5jwvZO7Tn037yc.ZNLSRF5YkFzRM/lNjatC0C', email: 'ealiaga@ana.gob.pe', nombre: 'ERIC EDILBERTO', apellido: 'ALIAGA ROMAYNA', cedula: '41323618', rol: 'usuario', estado: 1 },
  { id: 8, username: 'moyola', password: '$2b$10$CAAyRvpdNjVodHDRMwPko.g8bmLbjaLqmkv67gSiSFRnY14U3F.ai', email: 'moyola@ana.gob.pe', nombre: 'MILNER', apellido: 'OYOLA VALENCIA', cedula: '23944583', rol: 'usuario', estado: 1 },
  { id: 9, username: 'jmatta', password: '$2b$10$RUgmyMrTTlloURMPu2mfreoNSJtkN9QEmWdZdQNsLqsDILsEY.EUW', email: 'jmatta@ana.gob.pe', nombre: 'JUAN CARLOS', apellido: 'MATTA ROMERO', cedula: '43084267', rol: 'usuario', estado: 1 },
  { id: 10, username: 'calegria', password: '$2b$10$VowccslBnfzYNT9Gfluase5N94n2DOWDlnHbf0FudRDkRxwN8FC2W', email: 'calegria@ana.gob.pe', nombre: 'CLIFF RICHARD', apellido: 'ALEGRÍA FLORES', cedula: '43347263', rol: 'usuario', estado: 1 },
  { id: 11, username: 'lflores', password: '$2b$10$MEfPhUPVsEhYGTNJUUp2hufOHz7Jl98Trc1pwrC4gtPSNmkY06RwO', email: 'lflores@ana.gob.pe', nombre: 'LILIANA SOFIA', apellido: 'FLORES PINEDA', cedula: '21562197', rol: 'usuario', estado: 1 },
  { id: 12, username: 'fcastillo', password: '$2b$10$.M1KG2jxhGLxCxutTSYXaeocC1Ry.OYcJ/J68oIxtU6NNh/pfFko2', email: 'fcastillo@ana.gob.pe', nombre: 'FRANCO JOSUE', apellido: 'CASTILLO CULQUICHICON', cedula: '41904748', rol: 'usuario', estado: 1 },
  { id: 13, username: 'snunez', password: '$2b$10$GusoTIWka1O5IxPaK6ysi.nqd59GKdJSp6LfIF34bxKD7Zhmc4MdO', email: 'snunez@ana.gob.pe', nombre: 'SANTOS ANDRES', apellido: 'NUÑEZ COTRINA', cedula: '16571816', rol: 'usuario', estado: 1 },
  { id: 14, username: 'rflores', password: '$2b$10$1Fdv/GaNP.2iQ8GyVAzz.uJn0a6jZ3KZq0OQA.z7UkJ.1J.R.HrI2', email: 'rfloresa@ana.gob.pe', nombre: 'RAUL EDWIN', apellido: 'FLORES ALLPAS', cedula: '22999873', rol: 'usuario', estado: 1 },
  { id: 15, username: 'bpanana', password: '$2b$10$F0JAaNq2RPhY8S/0Xm5cw.dEGOpTAlMIrJBOp78monIDV7498z8zW', email: 'bpanana@ana.gob.pe', nombre: 'BETTY ESTHER', apellido: 'PANANA JAUREGUI', cedula: '02687549', rol: 'usuario', estado: 1 },
  { id: 16, username: 'epina', password: '$2b$10$nIiz0I/itlFXKG35qTbBH.ItoRuutFKgNKn7HxCIbueTNb.YruX.i', email: 'epina@ana.gob.pe', nombre: 'EVELYN GERALDINE', apellido: 'PIÑA PEREZ', cedula: '40683401', rol: 'usuario', estado: 1 },
  { id: 17, username: 'daguinaga', password: '$2b$10$22BrO4.VnR71L4ruwM908u5kFNKaPP2Yy3Z6V9q2S67g6FEMEqalS', email: 'daguinaga@ana.gob.pe', nombre: 'DAVID ERNESTO', apellido: 'AGUINAGA MANTILLA', cedula: '00033230', rol: 'usuario', estado: 1 },
  { id: 18, username: 'nseijas', password: '$2b$10$E8VXnVjkMmlpUURYTEcmlODstQ8GzMQ5NhzgzjzKJQy4tGQgOi3BS', email: 'nseijas@ana.gob.pe', nombre: 'NOBEL HOMERO', apellido: 'SEIJAS DEL AGUILA', cedula: '00112539', rol: 'usuario', estado: 1 },
  { id: 19, username: 'cangulo', password: '$2b$10$rYCe/c7w8KdVQfovolxW3eaOFk6Kwl0sAOvuRp10AqTeXtW6X9PmC', email: 'cangulo@ana.gob.pe', nombre: 'CARLOS ALBERTO', apellido: 'ANGULO ACOSTA', cedula: '70831486', rol: 'usuario', estado: 1 },
  { id: 20, username: 'lacuna', password: '$2b$10$p6C8MY1cY9TZijIyFU3Wh.Fj4ujSVuz5MKeaTV.Sy2Pr2pCov9Wk6', email: 'leysi.arengifo2@hotmail.com', nombre: 'LEYSI MARIBEL', apellido: 'ACUÑA RENGIFO', cedula: '00125441', rol: 'usuario', estado: 1 },
  { id: 21, username: 'mtalavera', password: '$2b$10$eLNX6nYWZhmKyGO1O5TcLux/DJMkTbt8MvGJZVkDQ3ehEqNOT3t6.', email: 'mariatalaverab@gmail.com', nombre: 'MARIA INES', apellido: 'TALAVERA BERMUDO', cedula: '76137345', rol: 'usuario', estado: 1 },
  { id: 22, username: 'jmunante', password: '$2b$10$dXq/bFv4T0DZN2X5rTirt.XqafLT5njae6jHLSyarPNv3ZbtiMKy2', email: 'juliocesarmt@gmail.com', nombre: 'JULIO CÉSAR', apellido: 'MUÑANTE TARICUARIMA', cedula: '41608082', rol: 'usuario', estado: 1 },
  { id: 23, username: 'sregalado', password: '$2b$10$DUCufLsZrbM/VjDiBDj75OtAZqqcCYsO.va19sLNIixVk51Lu5WgK', email: 'sandynicolrs@gmail.com', nombre: 'SANDY NICOL', apellido: 'REGALADO SIMON', cedula: '47856159', rol: 'usuario', estado: 1 },
  { id: 24, username: 'olopez', password: '$2b$10$2x9AN5CypKV8aQqatU3Eiuw3k4kP6rNPxJG8X8L4O4OOH/5bpiFSW', email: 'lando350ambiente@gmail.com', nombre: 'ORLANDO', apellido: 'LOPEZ RAMIREZ', cedula: '70037762', rol: 'usuario', estado: 1 },
  { id: 25, username: 'jferreyros', password: '$2b$10$.5.I3CDsycvjiNB3igMVteMhM5vrFN2IH7iCUhr.unD0tJm2MDl5W', email: 'joyceferreyros27@gmail.com', nombre: 'JOYCE ELIANA', apellido: 'FERREYROS SANCHEZ', cedula: '47147629', rol: 'usuario', estado: 1 },
  { id: 26, username: 'jolortegui', password: '$2b$10$fPXDM7or8nX6vl/mjFUhZepmq1ZNBPDN3n4GpBia1wtPRab8nmUpK', email: 'jolorteguiperez@gmail.com', nombre: 'JERLIN DAVID', apellido: 'OLORTEGUI PEREZ', cedula: '45209604', rol: 'usuario', estado: 1 },
];

async function insertarUsuarios() {
  let connection;
  try {
    console.log('\n🔄 Conectando a la base de datos...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'comisiones_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Conexión exitosa\n');

    // Desactivar claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS=0');
    console.log('🔓 Verificaciones de clave foránea desactivadas\n');

    // Limpiar tabla
    try {
      await connection.execute('DELETE FROM users');
      console.log('🧹 Tabla limpiada\n');
    } catch (err) {
      console.log('⚠️  No se pudo limpiar tabla (posiblemente vacía)\n');
    }

    // Reactivar auto_increment
    try {
      await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    } catch (err) {
      console.log('⚠️  No se pudo resetear AUTO_INCREMENT\n');
    }

    // Activar claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS=1');
    console.log('🔒 Verificaciones de clave foránea reactivadas\n');

    let insertados = 0;
    let errores = 0;

    for (const user of usuarios) {
      try {
        const nombreCompleto = `${user.nombre} ${user.apellido}`;
        
        const query = `
          INSERT INTO users (id, username, email, password, nombre, rol, activo, creado_en)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(query, [
          user.id,
          user.username,
          user.email,
          user.password,
          nombreCompleto,
          user.rol,
          user.estado
        ]);

        console.log(`✅ ${user.username.padEnd(15)} | ${user.email}`);
        insertados++;
      } catch (error) {
        console.error(`❌ Error en ${user.username}: ${error.message}`);
        errores++;
      }
    }

    await connection.end();

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║ ✅ ${insertados} USUARIOS CARGADOS EXITOSAMENTE ║`);
    if (errores > 0) {
      console.log(`║ ❌ ${errores} ERRORES ENCONTRADOS          ║`);
    }
    console.log(`║                                        ║`);
    console.log(`║ Prueba con:                            ║`);
    console.log(`║ Usuario: dkong                         ║`);
    console.log(`║ Email: dhayro27@gmail.com             ║`);
    console.log(`╚════════════════════════════════════════╝\n`);

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message, '\n');
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

insertarUsuarios();
