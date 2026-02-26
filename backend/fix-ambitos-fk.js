#!/usr/bin/env node

/**
 * Script para arreglar la FK de ambitos
 * Añade la restricción ON DELETE SET NULL si no existe
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
  let connection;
  try {
    console.log('\n🔧 Reparando tabla ambitos...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });

    console.log('✅ Conectado a la base de datos');

    // Primero, eliminar la FK existente si la hay (sin ON DELETE SET NULL)
    try {
      await connection.query(
        'ALTER TABLE ambitos DROP FOREIGN KEY ambitos_ibfk_1'
      );
      console.log('✅ FK antigua eliminada');
    } catch (err) {
      console.log('ℹ️  No había FK antigua para eliminar');
    }

    // Ahora agregar la FK correcta con ON DELETE SET NULL
    try {
      await connection.query(`
        ALTER TABLE ambitos 
        ADD CONSTRAINT ambitos_ibfk_1 
        FOREIGN KEY (dependencia_id) REFERENCES ambitos(id) ON DELETE SET NULL
      `);
      console.log('✅ FK correcta agregada: ON DELETE SET NULL');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✅ La FK ya existe correctamente');
      } else {
        throw err;
      }
    }

    // Verificar la estructura de la tabla
    const [tableInfo] = await connection.query(
      'SHOW CREATE TABLE ambitos'
    );
    console.log('\n📋 Estructura actual de la tabla ambitos:');
    console.log(tableInfo[0]['Create Table']);

    console.log('\n✅ ¡Tabla ambitos reparada correctamente!');
    console.log('Ahora al eliminar un AAA, sus ALAs tendrán dependencia_id = NULL');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

fixDatabase();
