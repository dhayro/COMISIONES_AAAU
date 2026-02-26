#!/usr/bin/env node

/**
 * Script para resetear la BD completamente
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const usuariosDefecto = [
  { username: 'admin', email: 'dhayro.kong@hotmail.com', nombre: 'Administrador Sistema', rol: 'admin' },
  { username: 'snunez', email: 'snunez@ana.gob.pe', nombre: 'SANTOS ANDRES NUÑEZ COTRINA', rol: 'jefe' },
  { username: 'dkong', email: 'dhayro27@gmail.com', nombre: 'DHAYRO KONG TORRES', rol: 'usuario' },
  { username: 'carcos', email: 'carcosbinder@gmail.com', nombre: 'CAROL MELANI ARCOS BINDER', rol: 'usuario' },
  { username: 'atello', email: 'alan.tellob@gmail.com', nombre: 'ALAN ROMEO TELLO BARDALES', rol: 'usuario' },
  { username: 'nsalinas', email: 'salinaspimentel@gmail.com', nombre: 'NATHALY MISHEL SALINAS PIMENTEL', rol: 'usuario' },
  { username: 'prengifo', email: 'prengifo@ana.gob.pe', nombre: 'PRISCILIA LEONOR RENGIFO SILVA', rol: 'usuario' },
  { username: 'ealiaga', email: 'ealiaga@ana.gob.pe', nombre: 'ERIC EDILBERTO ALIAGA ROMAYNA', rol: 'usuario' },
  { username: 'moyola', email: 'moyola@ana.gob.pe', nombre: 'MILNER OYOLA VALENCIA', rol: 'usuario' },
  { username: 'jmatta', email: 'jmatta@ana.gob.pe', nombre: 'JUAN CARLOS MATTA ROMERO', rol: 'usuario' },
  { username: 'calegria', email: 'calegria@ana.gob.pe', nombre: 'CLIFF RICHARD ALEGRÍA FLORES', rol: 'usuario' },
  { username: 'lflores', email: 'lflores@ana.gob.pe', nombre: 'LILIANA SOFIA FLORES PINEDA', rol: 'usuario' },
  { username: 'fcastillo', email: 'fcastillo@ana.gob.pe', nombre: 'FRANCO JOSUE CASTILLO CULQUICHICON', rol: 'usuario' },
  { username: 'rflores', email: 'rfloresa@ana.gob.pe', nombre: 'RAUL EDWIN FLORES ALLPAS', rol: 'usuario' },
  { username: 'bpanana', email: 'bpanana@ana.gob.pe', nombre: 'BETTY ESTHER PANANA JAUREGUI', rol: 'usuario' },
  { username: 'epina', email: 'epina@ana.gob.pe', nombre: 'EVELYN GERALDINE PIÑA PEREZ', rol: 'usuario' },
  { username: 'daguinaga', email: 'daguinaga@ana.gob.pe', nombre: 'DAVID ERNESTO AGUINAGA MANTILLA', rol: 'usuario' },
  { username: 'nseijas', email: 'nseijas@ana.gob.pe', nombre: 'NOBEL HOMERO SEIJAS DEL AGUILA', rol: 'usuario' },
  { username: 'cangulo', email: 'cangulo@ana.gob.pe', nombre: 'CARLOS ALBERTO ANGULO ACOSTA', rol: 'usuario' },
  { username: 'lacuna', email: 'leysi.arengifo2@hotmail.com', nombre: 'LEYSI MARIBEL ACUÑA RENGIFO', rol: 'usuario' },
  { username: 'mtalavera', email: 'mariatalaverab@gmail.com', nombre: 'MARIA INES TALAVERA BERMUDO', rol: 'usuario' },
  { username: 'jmunante', email: 'juliocesarmt@gmail.com', nombre: 'JULIO CÉSAR MUÑANTE TARICUARIMA', rol: 'usuario' },
  { username: 'sregalado', email: 'sandynicolrs@gmail.com', nombre: 'SANDY NICOL REGALADO SIMON', rol: 'usuario' },
  { username: 'olopez', email: 'lando350ambiente@gmail.com', nombre: 'ORLANDO LOPEZ RAMIREZ', rol: 'usuario' },
  { username: 'jferreyros', email: 'joyceferreyros27@gmail.com', nombre: 'JOYCE ELIANA FERREYROS SANCHEZ', rol: 'usuario' },
  { username: 'jolortegui', email: 'jolorteguiperez@gmail.com', nombre: 'JERLIN DAVID OLORTEGUI PEREZ', rol: 'usuario' }
];

async function resetDatabase() {
  let connection;
  try {
    console.log('\n🔄 Reseteando base de datos...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Eliminar BD
    console.log('🗑️  Eliminando BD anterior...');
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);

    // Crear BD nueva
    console.log('📝 Creando BD nueva...');
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Crear tabla users
    console.log('📋 Creando tabla users...');
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        rol ENUM('admin', 'jefe', 'usuario') DEFAULT 'usuario',
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla ambitos
    console.log('📋 Creando tabla ambitos...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ambitos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla clasificadores
    console.log('📋 Creando tabla clasificadores...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clasificadores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partida VARCHAR(50) NOT NULL UNIQUE,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_partida (partida),
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla comisiones
    console.log('📋 Creando tabla comisiones...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comisiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ambito_id INT,
        lugar VARCHAR(100) NOT NULL,
        fecha_salida DATE NOT NULL,
        fecha_retorno DATE NOT NULL,
        modalidad VARCHAR(100),
        periodo VARCHAR(100),
        actividades TEXT,
        costo_total_comision DECIMAL(10, 2) DEFAULT 0,
        observacion TEXT,
        usuario_id INT NOT NULL,
        estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
        aprobacion_estado ENUM('PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA') DEFAULT 'PENDIENTE_APROBACION',
        aprobado_por INT,
        fecha_aprobacion DATETIME,
        observacion_aprobacion TEXT,
        presupuesto_estado ENUM('PRESUPUESTO POR ASIGNAR', 'PRESUPUESTO ASIGNADO', 'PRESUPUESTO RECHAZADO') DEFAULT 'PRESUPUESTO POR ASIGNAR',
        presupuesto_documento VARCHAR(50),
        presupuesto_numero_cut VARCHAR(50),
        presupuesto_fecha DATETIME,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE RESTRICT,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_usuario (usuario_id),
        INDEX idx_ambito (ambito_id),
        INDEX idx_estado (estado),
        INDEX idx_aprobacion_estado (aprobacion_estado),
        INDEX idx_presupuesto_estado (presupuesto_estado),
        INDEX idx_fechas (fecha_salida, fecha_retorno)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Crear tabla comision_comisionados (DETALLE)
    console.log('📋 Creando tabla comision_comisionados...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comision_comisionados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comision_id INT NOT NULL,
        usuario_id INT NOT NULL,
        clasificador_id INT NOT NULL,
        dias INT NOT NULL,
        costo_xdia DECIMAL(10, 2) NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        descripcion TEXT,
        observacion TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (comision_id) REFERENCES comisiones(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (clasificador_id) REFERENCES clasificadores(id) ON DELETE RESTRICT,
        INDEX idx_comision (comision_id),
        INDEX idx_usuario (usuario_id),
        INDEX idx_clasificador (clasificador_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);


    // Insertar ámbitos
    console.log('📍 Insertando ámbitos...\n');
    const ambitos = [
      'ALA PUCALLPA',
      'ALA ATALAYA',
      'ALA TARMA',
      'ALA PERENE'
    ];

    for (const ambito of ambitos) {
      await connection.query(
        'INSERT INTO ambitos (nombre, activo) VALUES (?, 1)',
        [ambito]
      );
      console.log(`✅ ${ambito}`);
    }

    // Insertar clasificadores
    console.log('\n💰 Insertando clasificadores...\n');
    const clasificadores = [
      { 
        nombre: 'PASAJES Y GASTOS DE TRANSPORTE', 
        partida: '23.2.1.2.2',
        descripcion: 'Gastos de transporte y pasajes'
      },
      { 
        nombre: 'VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO', 
        partida: '23.2.1.2.1',
        descripcion: 'Viáticos y asignaciones especiales'
      },
      { 
        nombre: 'COMBUSTIBLES Y CARBURANTES', 
        partida: '23.1.3.1.1',
        descripcion: 'Combustibles, carburantes y lubricantes'
      },
      { 
        nombre: 'HOSPEDAJE', 
        partida: '23.2.1.2.4',
        descripcion: 'Gastos de hospedaje y alojamiento'
      },
      { 
        nombre: 'ALIMENTACIÓN', 
        partida: '23.2.1.2.3',
        descripcion: 'Gastos de alimentación'
      }
    ];

    for (const clasificador of clasificadores) {
      await connection.query(
        'INSERT INTO clasificadores (nombre, partida, descripcion) VALUES (?, ?, ?)',
        [clasificador.nombre, clasificador.partida, clasificador.descripcion]
      );
      console.log(`✅ ${clasificador.nombre} (${clasificador.partida})`);
    }

    // Insertar usuarios
    console.log('\n👥 Insertando 26 usuarios...\n');
    const passwordHash = await bcrypt.hash('Autoridad1', 10);

    for (const user of usuariosDefecto) {
      await connection.query(
        'INSERT INTO users (username, email, password, nombre, rol, activo) VALUES (?, ?, ?, ?, ?, 1)',
        [user.username, user.email, passwordHash, user.nombre, user.rol]
      );
      console.log(`✅ @${user.username} - ${user.nombre}`);
    }

    await connection.end();

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║ ✅ BD RESETEADA EXITOSAMENTE         ║`);
    console.log(`║ Ámbitos: 4                             ║`);
    console.log(`║ Clasificadores: 5                      ║`);
    console.log(`║ Usuarios: 26                           ║`);
    console.log(`║ Contraseña: Autoridad1                ║`);
    console.log(`╚════════════════════════════════════════╝\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    if (connection) await connection.end();
    process.exit(1);
  }
}

resetDatabase();
