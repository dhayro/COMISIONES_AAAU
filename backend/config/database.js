const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  multipleStatements: false
});

// Lista de usuarios por defecto
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

// Función para cargar datos maestros
const cargarDatosMaestros = async (connection) => {
  try {
    // Cargar ámbitos (AAAs primero, luego ALAs)
    const [ambitos] = await connection.query('SELECT COUNT(*) as count FROM ambitos');
    if (ambitos[0].count === 0) {
      console.log('\n📥 Cargando ámbitos por defecto...');
      
      // Insertar AAA UCAYALI (única Autoridad Administrativa)
      let aaa_ucayali_id;
      
      try {
        const [result1] = await connection.query(
          `INSERT INTO ambitos (nombre_corto, nombre_largo, dependencia_id, activo) 
           VALUES (?, ?, NULL, 1)`,
          ['AAA UCAYALI', 'Autoridad Administrativa del Agua Ucayali']
        );
        aaa_ucayali_id = result1.insertId;
      } catch (error) {
        console.error('❌ Error insertando AAA UCAYALI:', error.message);
      }

      // Insertar ALAs (Autoridades Locales) - dependientes de AAA UCAYALI
      const alasDefecto = [
        { nombre_corto: 'ALA PUCALLPA', nombre_largo: 'Autoridad Local del Agua Pucallpa', dependencia_id: aaa_ucayali_id },
        { nombre_corto: 'ALA ATALAYA', nombre_largo: 'Autoridad Local del Agua Atalaya', dependencia_id: aaa_ucayali_id },
        { nombre_corto: 'ALA TARMA', nombre_largo: 'Autoridad Local del Agua Tarma', dependencia_id: aaa_ucayali_id },
        { nombre_corto: 'ALA PERENE', nombre_largo: 'Autoridad Local del Agua Perené', dependencia_id: aaa_ucayali_id }
      ];

      for (const ala of alasDefecto) {
        try {
          await connection.query(
            `INSERT INTO ambitos (nombre_corto, nombre_largo, dependencia_id, activo) 
             VALUES (?, ?, ?, 1)`,
            [ala.nombre_corto, ala.nombre_largo, ala.dependencia_id]
          );
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            console.error(`❌ Error insertando ${ala.nombre_corto}:`, error.message);
          }
        }
      }
      console.log('✅ 5 ámbitos cargados (1 AAA UCAYALI + 4 ALAs)');
    }

    // Cargar clasificadores
    const [clasificadores] = await connection.query('SELECT COUNT(*) as count FROM clasificadores');
    if (clasificadores[0].count === 0) {
      console.log('\n📥 Cargando clasificadores por defecto...');
      const clasificadoresDefecto = [
        { partida: '23.2.1.2.2', nombre: 'PASAJES Y GASTOS DE TRANSPORTE', descripcion: 'Gastos de transporte y pasajes' },
        { partida: '23.2.1.2.1', nombre: 'VIÁTICOS Y ASIGNACIONES POR COMISIÓN DE SERVICIO', descripcion: 'Viáticos y asignaciones por comisión' },
        { partida: '23.1.3.1.1', nombre: 'COMBUSTIBLES Y CARBURANTES', descripcion: 'Combustibles y carburantes' },
        { partida: '23.199.199', nombre: 'OTROS BIENES', descripcion: 'Otros bienes' },
        { partida: '23.2.1.299', nombre: 'OTROS GASTOS', descripcion: 'Otros gastos de comisión' }
      ];

      for (const clasificador of clasificadoresDefecto) {
        try {
          await connection.query(
            'INSERT INTO clasificadores (partida, nombre, descripcion, activo) VALUES (?, ?, ?, 1)',
            [clasificador.partida, clasificador.nombre, clasificador.descripcion]
          );
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            console.error(`❌ Error insertando ${clasificador.partida}:`, error.message);
          }
        }
      }
      console.log(`✅ ${clasificadoresDefecto.length} clasificadores cargados`);
    }

    // Cargar costos de viaje
    const [costos] = await connection.query('SELECT COUNT(*) as count FROM costos_viaje');
    if (costos[0].count === 0) {
      console.log('\n📥 Cargando costos de viaje por defecto...');
      try {
        await connection.query(
          'INSERT INTO costos_viaje (nombre, costo, activo) VALUES (?, ?, 1)',
          ['Dentro del ámbito', 220.00]
        );
        await connection.query(
          'INSERT INTO costos_viaje (nombre, costo, activo) VALUES (?, ?, 1)',
          ['Fuera del ámbito', 320.00]
        );
        console.log('✅ Costos de viaje cargados: Dentro=220, Fuera=320\n');
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error('❌ Error insertando costos de viaje:', error.message);
        }
      }
    }

    // Cargar usuarios por defecto DESPUÉS de los ámbitos
    await cargarUsuariosDefecto(connection);
  } catch (error) {
    console.error('⚠️  Error al cargar datos maestros:', error.message);
  }
};

// Función para cargar usuarios por defecto
const cargarUsuariosDefecto = async (connection) => {
  try {
    // Verificar si hay usuarios en la BD
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('\n📥 Cargando 26 usuarios por defecto...');
      
      // Obtener el ID de la AAA UCAYALI
      const [ambitos] = await connection.query(
        'SELECT id FROM ambitos WHERE nombre_corto = ? AND dependencia_id IS NULL',
        ['AAA UCAYALI']
      );
      
      const ambito_id = ambitos.length > 0 ? ambitos[0].id : null;
      
      // Hashear la contraseña
      const passwordHash = await bcrypt.hash('Autoridad1', 10);
      
      let insertados = 0;
      for (const user of usuariosDefecto) {
        try {
          await connection.query(
            'INSERT INTO users (username, email, password, nombre, rol, ambito_id, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [user.username, user.email, passwordHash, user.nombre, user.rol, ambito_id]
          );
          insertados++;
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            console.error(`❌ Error insertando ${user.username}:`, error.message);
          }
        }
      }
      
      console.log(`✅ ${insertados} usuarios cargados exitosamente`);
      console.log(`📝 Contraseña para todos: Autoridad1`);
      console.log(`📍 Ámbito asignado a todos: AAA UCAYALI (ID: ${ambito_id})\n`);
    } else {
      console.log(`✅ BD ya contiene usuarios (${users[0].count})`);
    }
  } catch (error) {
    console.error('⚠️  Error al cargar usuarios por defecto:', error.message);
  }
};

// Función para crear la BD si no existe
const initDatabase = async () => {
  let tempConnection;
  try {
    // Conectar sin especificar BD para crearla
    tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Conectado a MySQL');

    // Crear BD si no existe
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    console.log('✅ Base de datos verificada/creada');

    // Cambiar a la BD
    await tempConnection.query(`USE ${process.env.DB_NAME}`);

    // Crear tabla ambitos PRIMERO (MAESTRA CON JERARQUÍA)
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS ambitos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_corto VARCHAR(50) NOT NULL,
        nombre_largo VARCHAR(200) NOT NULL,
        dependencia_id INT,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (dependencia_id) REFERENCES ambitos(id) ON DELETE SET NULL,
        INDEX idx_nombre_corto (nombre_corto),
        INDEX idx_dependencia (dependencia_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla ambitos verificada/creada');

    // Crear tabla cargos ANTES de users (porque users tiene FK a cargos)
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS cargos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla cargos verificada/creada');

    // Crear tabla users DESPUÉS (con FK a ambitos y cargos)
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        dni VARCHAR(20),
        rol ENUM('admin', 'jefe', 'usuario', 'administrativo') DEFAULT 'usuario',
        ambito_id INT,
        cargo_id INT,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE SET NULL,
        FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_ambito (ambito_id),
        INDEX idx_cargo (cargo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla users verificada/creada');

    // Crear tabla clasificadores (MAESTRA)
    await tempConnection.query(`
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
    console.log('✅ Tabla clasificadores verificada/creada');

    // Crear tabla costos_viaje (MAESTRA)
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS costos_viaje (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        costo DECIMAL(10, 2) NOT NULL,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla costos_viaje verificada/creada');

    // Crear tabla metas
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS metas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        numero_meta VARCHAR(50) NOT NULL,
        periodo VARCHAR(50) NOT NULL,
        ambito_id INT,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ambito_id) REFERENCES ambitos(id) ON DELETE SET NULL,
        UNIQUE KEY unique_numero_periodo (numero_meta, periodo),
        INDEX idx_ambito (ambito_id),
        INDEX idx_periodo (periodo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla metas verificada/creada');

    // Crear tabla fuentes_financiamiento
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS fuentes_financiamiento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        abreviatura VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla fuentes_financiamiento verificada/creada');

    // Crear tabla comisiones (ACTUALIZADA CON CAMPOS DE APROBACIÓN, METAS Y COSTOS)
    await tempConnection.query(`
      CREATE TABLE IF NOT EXISTS comisiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ambito_id INT NOT NULL,
        meta_id INT,
        costo_viaje_id INT,
        lugar VARCHAR(100) NOT NULL,
        ruta VARCHAR(255),
        modalidad_viaje ENUM('TERRESTRE', 'AEREO', 'FLUVIAL', 'AEREO-TERRESTRE', 'AEREO-FLUVIAL', 'TERRESTRE-FLUVIAL', 'AEREO-TERRESTRE-FLUVIAL') DEFAULT 'TERRESTRE',
        fecha_salida DATETIME NOT NULL,
        fecha_retorno DATETIME NOT NULL,
        num_dias INT NOT NULL,
        costo_xdia DECIMAL(10, 2) NOT NULL,
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
        FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE SET NULL,
        FOREIGN KEY (costo_viaje_id) REFERENCES costos_viaje(id) ON DELETE SET NULL,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_usuario (usuario_id),
        INDEX idx_ambito (ambito_id),
        INDEX idx_meta (meta_id),
        INDEX idx_costo_viaje (costo_viaje_id),
        INDEX idx_estado (estado),
        INDEX idx_aprobacion_estado (aprobacion_estado),
        INDEX idx_presupuesto_estado (presupuesto_estado),
        INDEX idx_fechas (fecha_salida, fecha_retorno)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla comisiones verificada/creada');

    // Crear tabla comision_comisionados (DETALLE)
    await tempConnection.query(`
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
        INDEX idx_clasificador (clasificador_id),
        UNIQUE KEY unique_comision_usuario_clasificador (comision_id, usuario_id, clasificador_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla comision_comisionados verificada/creada');

    // ========== MIGRACIONES ==========
    // Agregar columnas faltantes si no existen (para actualizaciones de BD existentes)
    console.log('\n🔄 Verificando migraciones necesarias...');
    
    try {
      // Verificar si meta_id existe en comisiones
      const [metaColumn] = await tempConnection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'comisiones' AND TABLE_SCHEMA = ? AND COLUMN_NAME = 'meta_id'`,
        [process.env.DB_NAME]
      );
      
      if (metaColumn.length === 0) {
        console.log('  ➕ Agregando columna meta_id a comisiones...');
        await tempConnection.query(
          `ALTER TABLE comisiones ADD COLUMN meta_id INT, 
           ADD FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE SET NULL,
           ADD INDEX idx_meta (meta_id)`
        );
      }
      
      // Verificar si costo_viaje_id existe en comisiones
      const [costoColumn] = await tempConnection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'comisiones' AND TABLE_SCHEMA = ? AND COLUMN_NAME = 'costo_viaje_id'`,
        [process.env.DB_NAME]
      );
      
      if (costoColumn.length === 0) {
        console.log('  ➕ Agregando columna costo_viaje_id a comisiones...');
        await tempConnection.query(
          `ALTER TABLE comisiones ADD COLUMN costo_viaje_id INT,
           ADD FOREIGN KEY (costo_viaje_id) REFERENCES costos_viaje(id) ON DELETE SET NULL,
           ADD INDEX idx_costo_viaje (costo_viaje_id)`
        );
      }
      
      console.log('✅ Migraciones completadas');
    } catch (migrationError) {
      if (migrationError.code !== 'ER_DUP_FIELDNAME' && migrationError.code !== 'ER_KEY_COLUMN_DOES_NOT_EXIST') {
        console.warn('⚠️  Advertencia en migraciones:', migrationError.message);
      }
    }

    // Cargar datos maestros si no existen
    await cargarDatosMaestros(tempConnection);

    // Cargar metas por defecto
    console.log('\n📋 Cargando metas por defecto...');
    try {
      // Primero obtener los IDs de los ámbitos por nombre
      const [ambitos] = await tempConnection.query(
        'SELECT id, nombre_largo FROM ambitos WHERE activo = 1'
      );
      
      const ambitoMap = {};
      ambitos.forEach((a) => {
        const nombre = a.nombre_largo.toLowerCase();
        if (nombre.includes('perene') || nombre.includes('perené')) ambitoMap['perene'] = a.id;
        else if (nombre.includes('tarma')) ambitoMap['tarma'] = a.id;
        else if (nombre.includes('pucallpa')) ambitoMap['pucallpa'] = a.id;
        else if (nombre.includes('atalaya')) ambitoMap['atalaya'] = a.id;
        else if (nombre.includes('ucayali')) ambitoMap['ucayali'] = a.id;
      });

      const metas = [
        { numero_meta: '067', nombre: 'Atención al Usuario Local de Agua Perene', periodo: '2026', ambito: 'perene' },
        { numero_meta: '068', nombre: 'Atención al Usuario Local de Agua Tarma', periodo: '2026', ambito: 'tarma' },
        { numero_meta: '069', nombre: 'Atención al Usuario Local de Agua Pucallpa', periodo: '2026', ambito: 'pucallpa' },
        { numero_meta: '070', nombre: 'Atención al Usuario Local de Agua Atalaya', periodo: '2026', ambito: 'atalaya' },
        { numero_meta: '071', nombre: 'Gestión de la Calidad de los Recursos Hídricos - Ucayali', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '072', nombre: 'Gestión Operativa de la Autoridad Administrativa del Agua - Ucayali', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '073', nombre: 'Sensibilización en Cultura del Agua - Ucayali', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '198', nombre: 'Gestión de Operadores de Infraestructura Hidraúlica - Ejecución del PROFOJUA - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '199', nombre: 'Formalización de derechos de uso de agua con fines Poblacionales - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '200', nombre: 'Formalización de derechos de uso de agua con fines Agrarios - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '201', nombre: 'Operación y Mantenimiento de Equipos, Dispositivos e Instrumentos de Medición Hídrica (RJ N° 0100-2024-ANA) - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
        { numero_meta: '202', nombre: 'Evaluación de Recursos Hídricos - Delimitación de Faja Marginal - AAA UCAYALI', periodo: '2026', ambito: 'ucayali' },
      ];

      for (const meta of metas) {
        const [existente] = await tempConnection.query(
          'SELECT id FROM metas WHERE numero_meta = ?',
          [meta.numero_meta]
        );
        if (existente.length === 0) {
          const ambitoId = ambitoMap[meta.ambito] || null;
          await tempConnection.query(
            'INSERT INTO metas (nombre, numero_meta, periodo, ambito_id, activo) VALUES (?, ?, ?, ?, 1)',
            [meta.nombre, meta.numero_meta, meta.periodo, ambitoId]
          );
          const ambitoNombre = meta.ambito.charAt(0).toUpperCase() + meta.ambito.slice(1);
          console.log(`  ✅ Meta ${meta.numero_meta} - ${ambitoNombre}`);
        }
      }
      console.log('✅ Metas cargadas\n');
    } catch (err) {
      console.log(`⏭️  Metas ya existen o error menor\n`);
    }

    // Cargar fuentes de financiamiento por defecto
    console.log('📊 Cargando fuentes de financiamiento por defecto...');
    try {
      const fuentesFinanciamiento = [
        { nombre: 'Recursos Ordinarios', abreviatura: 'R.O', descripcion: 'Ingresos ordinarios del estado' },
        { nombre: 'Recursos Directamente Recaudados', abreviatura: 'R.D.R', descripcion: 'Recursos generados por el organismo' },
        { nombre: 'Donaciones', abreviatura: 'DON', descripcion: 'Fondos de donaciones internacionales' },
        { nombre: 'Crédito Público', abreviatura: 'C.P', descripcion: 'Recursos por crédito público' },
      ];

      for (const fuente of fuentesFinanciamiento) {
        const [existente] = await tempConnection.query(
          'SELECT id FROM fuentes_financiamiento WHERE abreviatura = ?',
          [fuente.abreviatura]
        );
        if (existente.length === 0) {
          await tempConnection.query(
            'INSERT INTO fuentes_financiamiento (nombre, abreviatura, descripcion, activo) VALUES (?, ?, ?, 1)',
            [fuente.nombre, fuente.abreviatura, fuente.descripcion]
          );
          console.log(`  ✅ Fuente: ${fuente.abreviatura} - ${fuente.nombre}`);
        }
      }
      console.log('✅ Fuentes de financiamiento cargadas\n');
    } catch (err) {
      console.log(`⏭️  Fuentes de financiamiento ya existen o error menor\n`);
    }

    // Cargar cargos por defecto
    console.log('👔 Cargando cargos por defecto...');
    try {
      const cargos = [
        { nombre: 'Gerente' },
        { nombre: 'Sub Gerente' },
        { nombre: 'Especialista' },
        { nombre: 'Técnico' },
        { nombre: 'Asistente' },
        { nombre: 'Administrativo' },
      ];

      for (const cargo of cargos) {
        const [existente] = await tempConnection.query(
          'SELECT id FROM cargos WHERE nombre = ?',
          [cargo.nombre]
        );
        if (existente.length === 0) {
          await tempConnection.query(
            'INSERT INTO cargos (nombre, activo) VALUES (?, 1)',
            [cargo.nombre]
          );
          console.log(`  ✅ Cargo: ${cargo.nombre}`);
        }
      }
      console.log('✅ Cargos cargados\n');
    } catch (err) {
      console.log(`⏭️  Cargos ya existen o error menor\n`);
    }

    await tempConnection.end();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a BD:', error.message);
    if (tempConnection) await tempConnection.end();
    
    // Lanzar error para que el servidor no inicie sin BD
    throw error;
  }
};

module.exports = { pool, initDatabase };
