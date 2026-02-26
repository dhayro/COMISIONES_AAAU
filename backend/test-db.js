#!/usr/bin/env node

/**
 * Script para testear conexión a MySQL y crear BD
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('\n🔍 Probando conexión a MySQL...\n');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Usuario: ${process.env.DB_USER}`);
    console.log(`BD: ${process.env.DB_NAME}\n`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Conexión exitosa a MySQL!\n');

    // Crear BD
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Base de datos "${process.env.DB_NAME}" verificada\n`);

    // Cambiar a la BD
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Crear tabla users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        rol ENUM('admin', 'usuario') DEFAULT 'usuario',
        activo BOOLEAN DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "users" verificada\n');

    // Crear tabla comisiones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comisiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ambito VARCHAR(100),
        lugar VARCHAR(100) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        comisionados VARCHAR(255) NOT NULL,
        actividades TEXT,
        dias INT,
        costo_xdia DECIMAL(10, 2),
        costo_pasajes_nacional DECIMAL(10, 2),
        costo_pasajes_local DECIMAL(10, 2),
        costo_combustible DECIMAL(10, 2),
        costo_comision_por_comisionado DECIMAL(10, 2),
        costo_total_comision DECIMAL(10, 2),
        observacion TEXT,
        usuario_id INT NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "comisiones" verificada\n');

    await connection.end();

    console.log('╔════════════════════════════════════════╗');
    console.log('║ ✅ BD lista para usar!                ║');
    console.log('║ Puedes iniciar el servidor con:       ║');
    console.log('║ $ npm run dev                          ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error:');
    console.error(`   ${error.message}\n`);
    console.error('💡 Soluciones:');
    console.error('   1. Asegúrate de que MySQL está corriendo en XAMPP');
    console.error('   2. Verifica que el usuario/contraseña en .env son correctos');
    console.error('   3. Si aún tienes problemas, contacta al soporte\n');
    process.exit(1);
  }
}

testConnection();
