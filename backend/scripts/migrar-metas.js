#!/usr/bin/env node

/**
 * Script para migrar la tabla de metas
 * Cambia de numero_meta UNIQUE a UNIQUE(numero_meta, periodo)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrarMetas() {
  try {
    console.log('\n🔄 Iniciando migración de tabla metas...\n');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    // 1. Crear tabla temporal con la nueva estructura
    console.log('📋 Creando tabla temporal...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS metas_new (
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
    console.log('✅ Tabla temporal creada');

    // 2. Copiar datos (filtrando duplicados si los hay)
    console.log('📦 Copiando datos...');
    await connection.query(`
      INSERT INTO metas_new (id, nombre, numero_meta, periodo, ambito_id, activo, creado_en, actualizado_en)
      SELECT m.id, m.nombre, m.numero_meta, m.periodo, m.ambito_id, m.activo, m.creado_en, m.actualizado_en
      FROM metas m
      WHERE (m.numero_meta, m.periodo) IN (
        SELECT numero_meta, periodo FROM (
          SELECT numero_meta, periodo, MIN(id) as min_id
          FROM metas
          GROUP BY numero_meta, periodo
        ) grouped
      ) AND m.id = grouped.min_id
    `);
    console.log('✅ Datos copiados (se eliminaron duplicados)');

    // 3. Eliminar tabla antigua
    console.log('🗑️  Eliminando tabla antigua...');
    await connection.query('DROP TABLE metas');
    console.log('✅ Tabla antigua eliminada');

    // 4. Renombrar tabla nueva
    console.log('🔄 Renombrando tabla...');
    await connection.query('RENAME TABLE metas_new TO metas');
    console.log('✅ Tabla renombrada');

    await connection.end();

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║ ✅ Migración completada exitosamente!             ║');
    console.log('║ La tabla metas ahora tiene unicidad compuesta:     ║');
    console.log('║ UNIQUE(numero_meta, periodo)                       ║');
    console.log('║                                                    ║');
    console.log('║ Puedes iniciar el servidor con:                    ║');
    console.log('║ $ npm run dev                                      ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error en la migración:');
    console.error(`   ${error.message}\n`);
    
    // Si el error es que la tabla no existe, es ok
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('ℹ️  La tabla metas no existe aún. Se creará en el próximo inicio del servidor.\n');
      process.exit(0);
    }
    
    process.exit(1);
  }
}

migrarMetas();
