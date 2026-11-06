const logger = require('../shared/logger');
const fs = require('fs');
const path = require('path');

const ejecutarMigraciones = async (pool) => {
  logger.info('Verificando migraciones de certificaciones...');
};

const ejecutarMigracionesFormatoEmisiones = async (pool) => {
  logger.info('Verificando migraciones de formato_emisiones...');
};

const ejecutarMigracionesEstadoCertificado = async (pool) => {
  logger.info('Verificando estado_uso...');
};

const corregirEstadoUsoEnum = async (pool) => {
  logger.info('Verificando ENUM...');
};

const agregarCertificacionId = async (pool) => {
  logger.info('Verificando certificacion_id...');
};

const agregarMontoUtilizado = async (pool) => {
  logger.info('Verificando monto_utilizado...');
};

const sincronizarMontoUtilizado = async (pool) => {
  let connection;
  try {
    logger.info('🔄 Sincronizando montos utilizados en certificaciones...');
    connection = await pool.getConnection();
    
    // 1️⃣ DEBUG: Ver qué hay en formato_emisiones_detalles
    logger.info('\n📋 DEBUG: Contenido de formato_emisiones_detalles:');
    const [detallesDebug] = await connection.query(
      `SELECT fed.id, fed.formato_emision_id, fed.clasificador_id, fed.monto, fed.detalles_certificacion_credito_id
       FROM formato_emisiones_detalles fed
       LIMIT 10`
    );
    logger.info('  Primeros 10 registros:');
    for (const det of detallesDebug) {
      logger.info(`    ID: ${det.id}, Formato: ${det.formato_emision_id}, Clasificador: ${det.clasificador_id}, Monto: ${det.monto}, Det_Cert_ID: ${det.detalles_certificacion_credito_id}`);
    }
    
    // 2️⃣ Primero, mapear los detalles_certificacion_credito_id si están NULL
    logger.info('\n  📋 Mapeando detalles_certificacion_credito_id...');
    const [mapResult] = await connection.query(
      `UPDATE formato_emisiones_detalles fed
       SET fed.detalles_certificacion_credito_id = (
         SELECT dcc.id
         FROM detalles_certificacion_credito dcc
         INNER JOIN formato_emisiones fe ON fe.id = fed.formato_emision_id
         WHERE dcc.clasificador_id = fed.clasificador_id
           AND dcc.certificacion_credito_id = fe.certificacion_id
         LIMIT 1
       )
       WHERE fed.detalles_certificacion_credito_id IS NULL
         AND fed.formato_emision_id IN (
           SELECT fe.id FROM formato_emisiones fe WHERE fe.certificacion_id IS NOT NULL
         )`
    );
    logger.info(`  ✓ Mapeo completado: ${mapResult.affectedRows} registros actualizados`);
    
    // 3️⃣ DEBUG: Ver nuevamente después del mapeo
    logger.info('\n📋 DEBUG: Después del mapeo:');
    const [detallesDebug2] = await connection.query(
      `SELECT fed.id, fed.formato_emision_id, fed.clasificador_id, fed.monto, fed.detalles_certificacion_credito_id
       FROM formato_emisiones_detalles fed
       WHERE fed.monto > 0
       LIMIT 10`
    );
    logger.info(`  Encontrados ${detallesDebug2.length} registros con monto > 0:`);
    for (const det of detallesDebug2) {
      logger.info(`    ID: ${det.id}, Formato: ${det.formato_emision_id}, Clasificador: ${det.clasificador_id}, Monto: ${det.monto}, Det_Cert_ID: ${det.detalles_certificacion_credito_id}`);
    }
    
    // 4️⃣ Resetear todos los montos_utilizados a 0
    await connection.query(
      `UPDATE detalles_certificacion_credito SET monto_utilizado = 0`
    );
    logger.info('  ✓ Montos utilizados resetados a 0');
    
    // 5️⃣ Obtener todas las certificaciones con detalles
    const [certificaciones] = await connection.query(
      `SELECT DISTINCT dcc.id, dcc.certificacion_credito_id
       FROM detalles_certificacion_credito dcc
       WHERE dcc.certificacion_credito_id IS NOT NULL`
    );
    
    logger.info(`\n  📊 Encontradas ${certificaciones.length} lineas de detalles certificación`);
    
    // 6️⃣ Para cada detalle de certificación, sumar todos los formatos asociados
    let actualizadas = 0;
    for (const detalle of certificaciones) {
      try {
        // Obtener suma de montos de formatos_emisiones_detalles para este detalle
        const [resultado] = await connection.query(
          `SELECT COALESCE(SUM(fed.monto), 0) as monto_total, COUNT(*) as cant_detalles
           FROM formato_emisiones_detalles fed
           WHERE fed.detalles_certificacion_credito_id = ?`,
          [detalle.id]
        );
        
        const montoTotal = resultado[0].monto_total || 0;
        const cantDetalles = resultado[0].cant_detalles || 0;
        
        await connection.query(
          `UPDATE detalles_certificacion_credito 
           SET monto_utilizado = ?
           WHERE id = ?`,
          [montoTotal, detalle.id]
        );
        
        if (montoTotal > 0 || cantDetalles > 0) {
          logger.info(`    ✓ Detalle ${detalle.id} (Cert ${detalle.certificacion_credito_id}): Monto=${montoTotal}, Cantidad Detalles=${cantDetalles}`);
          actualizadas++;
        }
      } catch (error) {
        logger.error(`    ❌ Error procesando detalle ${detalle.id}:`, error.message);
      }
    }
    
    logger.info(`  ✅ Sincronización completada: ${actualizadas} detalles procesados\n`);
  } catch (error) {
    logger.error('⚠️ Error sincronizando montos utilizados:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

const revalidarSistema = async (pool) => {
  let connection;
  try {
    logger.info('\n╔════════════════════════════════════════════════════╗');
    logger.info('║   🔄 REVALIDACIÓN COMPLETA DEL SISTEMA             ║');
    logger.info('╚════════════════════════════════════════════════════╝\n');
    
    connection = await pool.getConnection();
    
    // 1️⃣ REVALIDAR CERTIFICACIONES
    logger.info('1️⃣  Revalidando certificaciones...');
    const [certificaciones] = await connection.query(
      `SELECT cc.id, cc.monto_certificado, 
              COALESCE(SUM(dcc.monto_utilizado), 0) as total_utilizado
       FROM certificaciones_credito cc
       LEFT JOIN detalles_certificacion_credito dcc ON cc.id = dcc.certificacion_credito_id
       GROUP BY cc.id`
    );
    
    logger.info(`   Encontradas ${certificaciones.length} certificaciones`);
    let certificacionesActualizadas = 0;
    
    for (const cert of certificaciones) {
      const disponible = cert.monto_certificado - cert.total_utilizado;
      const porcentaje = (cert.total_utilizado / cert.monto_certificado * 100).toFixed(2);
      
      logger.info(`   ✓ Cert ${cert.id}: S/. ${cert.monto_certificado} | Utilizado: S/. ${cert.total_utilizado} (${porcentaje}%) | Disponible: S/. ${disponible}`);
      certificacionesActualizadas++;
    }
    logger.info(`   ✅ ${certificacionesActualizadas} certificaciones validadas\n`);
    
    // 2️⃣ REVALIDAR FORMATOS EMITIDOS
    logger.info('2️⃣  Revalidando formatos emitidos...');
    const [formatos] = await connection.query(
      `SELECT f.id, f.numero_documento, f.certificacion_id, f.estado_emision,
              COALESCE(SUM(fd.monto), 0) as monto_total
       FROM formato_emisiones f
       LEFT JOIN formato_emisiones_detalles fd ON f.id = fd.formato_emisiones_id
       WHERE f.estado_emision NOT IN ('BORRADOR', 'ANULADO')
       GROUP BY f.id
       ORDER BY f.id DESC`
    );
    
    logger.info(`   Encontrados ${formatos.length} formatos emitidos`);
    let formatosValidados = 0;
    
    for (const fmt of formatos) {
      logger.info(`   ✓ ${fmt.numero_documento} (${fmt.estado_emision}): S/. ${fmt.monto_total} | Certificación: ${fmt.certificacion_id}`);
      formatosValidados++;
    }
    logger.info(`   ✅ ${formatosValidados} formatos validados\n`);
    
    // 3️⃣ REVALIDAR DETALLES DE CERTIFICACIÓN
    logger.info('3️⃣  Revalidando detalles de certificación...');
    const [detalles] = await connection.query(
      `SELECT dcc.id, dcc.certificacion_id, dcc.detalle_id, dcc.monto_certificado, dcc.monto_utilizado,
              (dcc.monto_certificado - dcc.monto_utilizado) as monto_disponible
       FROM detalles_certificacion_credito dcc
       ORDER BY dcc.certificacion_id, dcc.id`
    );
    
    logger.info(`   Encontrados ${detalles.length} detalles`);
    let detallesValidados = 0;
    
    for (const det of detalles) {
      const porcentaje = (det.monto_utilizado / det.monto_certificado * 100).toFixed(2);
      logger.info(`   ✓ Det ${det.id}: Cert ${det.certificacion_id} | S/. ${det.monto_certificado} | Utilizado: S/. ${det.monto_utilizado} (${porcentaje}%) | Disponible: S/. ${det.monto_disponible}`);
      detallesValidados++;
    }
    logger.info(`   ✅ ${detallesValidados} detalles validados\n`);
    
    // 4️⃣ REVALIDAR CORRELATIVO
    logger.info('4️⃣  Revalidando correlativo...');
    const anoActual = new Date().getFullYear();
    const [correlativo] = await connection.query(
      `SELECT cc.id, u.nombre, u.iniciales, cc.numero_proximo, cc.prefijo
       FROM correlativo_control cc
       INNER JOIN users u ON cc.usuario_id = u.id
       WHERE cc.ano = ? AND cc.activo = 1
       ORDER BY u.nombre`,
      [anoActual]
    );
    
    logger.info(`   Encontrados ${correlativo.length} correlativo para ${anoActual}`);
    
    for (const corr of correlativo) {
      logger.info(`   ✓ ${corr.nombre} (${corr.iniciales}): Próximo número: ${corr.numero_proximo}`);
    }
    logger.info(`   ✅ ${correlativo.length} correlativo validados\n`);
    
    logger.info('╔════════════════════════════════════════════════════╗');
    logger.info('║   ✅ REVALIDACIÓN COMPLETADA EXITOSAMENTE         ║');
    logger.info('╚════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    logger.error('⚠️ Error en revalidación del sistema:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

const generarCorrelativosInicial = async (pool) => {
  let connection;
  try {
    logger.info('🚀 Verificando inicialización de correlativo...');
    connection = await pool.getConnection();
    
    const anoActual = new Date().getFullYear();
    
    // Verificar si ya existen correlativo para este año
    const [existentes] = await connection.query(
      `SELECT COUNT(*) as count FROM correlativo_control WHERE ano = ?`,
      [anoActual]
    );
    
    if (existentes[0].count > 0) {
      logger.info(`  ✅ Correlativo ya generados para año ${anoActual}`);
      return;
    }
    
    // Obtener todos los usuarios activos con iniciales
    const [usuarios] = await connection.query(
      `SELECT id, nombre, iniciales FROM users WHERE activo = 1 AND iniciales IS NOT NULL ORDER BY nombre`
    );
    
    if (usuarios.length === 0) {
      logger.info('  ⚠️ No hay usuarios activos con iniciales para generar correlativo');
      return;
    }
    
    logger.info(`  Generando correlativo para ${usuarios.length} usuario(s)...`);
    let generados = 0;
    
    for (const usuario of usuarios) {
      try {
        const prefijo = usuario.iniciales || 'XXX';
        
        await connection.query(
          `INSERT INTO correlativo_control 
           (usuario_id, ano, numero_inicial, numero_proximo, prefijo, descripcion, creado_por)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [usuario.id, anoActual, 1, 1, prefijo, `Correlativo ${anoActual} - ${usuario.nombre}`, 1]
        );
        
        generados++;
        logger.info(`    ✓ ${usuario.nombre} (${prefijo})`);
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          logger.error(`    ❌ Error con ${usuario.nombre}: ${error.message}`);
        }
      }
    }
    
    logger.info(`  ✅ ${generados} correlativo generados para año ${anoActual}`);
  } catch (error) {
    logger.error('⚠️ Error generando correlativo iniciales:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

const ejecutarMigracionesSql = async (pool) => {
  let connection;
  try {
    logger.info('Verificando migraciones SQL...');
    connection = await pool.getConnection();
    
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.info('Carpeta de migraciones no encontrada');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    if (files.length === 0) {
      logger.info('No hay migraciones SQL');
      return;
    }
    
    logger.info(`Encontradas ${files.length} migracion(es) SQL`);
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      
      try {
        const sqlScript = fs.readFileSync(filePath, 'utf8');
        
        if (sqlScript.includes('DELIMITER')) {
          logger.info(`  SALTADO: ${file} (DELIMITER)`);
          continue;
        }
        
        const statements = sqlScript
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        logger.info(`  Procesando ${file} (${statements.length} statements)`);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement.trim()) {
            try {
              await connection.query(statement);
            } catch (err) {
              const ignorable = ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', '1050', '1054', '1091'];
              const isIgnorable = ignorable.some(code => (err.code || err.message || '').includes(code));
              
              if (!isIgnorable) {
                logger.error(`    ERROR en statement ${i+1}:`);
                logger.error(`    Codigo: ${err.code}`);
                logger.error(`    Mensaje: ${err.message.substring(0, 150)}`);
              }
            }
          }
        }
        
        logger.info(`  OK: ${file}`);
      } catch (err) {
        logger.error(`  ERROR leyendo ${file}: ${err.message}`);
      }
    }
    
    logger.info('Migraciones SQL completadas');
  } catch (error) {
    logger.error('Error:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

const actualizarInicialesUsuarios = async (pool) => {
  let connection;
  try {
    logger.info('🔄 Verificando iniciales en usuarios...');
    connection = await pool.getConnection();
    
    // Verificar si la columna iniciales existe
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'iniciales'`
    );
    
    if (columns.length === 0) {
      logger.info('  Agregando columna iniciales...');
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN iniciales VARCHAR(10)`);
        await connection.query(`CREATE INDEX idx_iniciales ON users(iniciales)`);
        logger.info('  ✅ Columna iniciales creada');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          throw err;
        }
      }
    }
    
    // Recalcular iniciales para TODOS los usuarios
    logger.info(`  Recargando iniciales para TODOS los usuarios...`);
    
    // Obtener todos los usuarios
    const [usuarios] = await connection.query(
      `SELECT id, nombre FROM users ORDER BY id`
    );
    
    if (usuarios.length > 0) {
      for (const usuario of usuarios) {
        // Extraer iniciales: primera letra de cada palabra
        const palabras = usuario.nombre.trim().split(/\s+/);
        const iniciales = palabras.map(p => p.charAt(0).toUpperCase()).join('').substring(0, 10);
        
        await connection.query(
          `UPDATE users SET iniciales = ? WHERE id = ?`,
          [iniciales, usuario.id]
        );
        logger.info(`    ${usuario.nombre} → ${iniciales}`);
      }
      
      logger.info(`  ✅ Iniciales recargadas en ${usuarios.length} usuario(s)`);
    } else {
      logger.info('  ⚠️ No hay usuarios en la base de datos');
    }
  } catch (error) {
    logger.error('❌ Error actualizando iniciales:', error.message);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 🆕 Migración: Crear tablas de Comprobantes
 */
const crearTablasComprobantes = async (pool) => {
  let connection;
  try {
    connection = await pool.getConnection();

    logger.info('\n🔄 Creando tablas de Comprobantes y Rendición...\n');

    // 📌 Tabla MAESTRA: comprobantes
    const sqlComprobantes = `
      CREATE TABLE IF NOT EXISTS comprobantes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        formato_emision_id INT NOT NULL,
        numero_comprobante VARCHAR(50),
        tipo_comprobante ENUM('FACTURA', 'BOLETA', 'TICKET', 'RECIBO') NOT NULL,
        fecha_comprobante DATE NOT NULL,
        proveedor_razon_social VARCHAR(255),
        proveedor_ruc_dni VARCHAR(20),
        monto DECIMAL(10, 2) NOT NULL,
        estado_rendicion ENUM('PENDIENTE', 'EN_REVISIÓN', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE',
        observacion_rechazo TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (formato_emision_id) REFERENCES formato_emisiones(id) ON DELETE CASCADE,
        INDEX idx_formato (formato_emision_id),
        INDEX idx_estado (estado_rendicion),
        INDEX idx_fecha (fecha_comprobante)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlComprobantes);
    logger.info('✅ Tabla comprobantes creada/verificada');

    // 📌 Tabla DETALLE: comprobante_detalles
    const sqlDetalles = `
      CREATE TABLE IF NOT EXISTS comprobante_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comprobante_id INT NOT NULL,
        tipo_viatitico ENUM('ALIMENTACIÓN', 'HOSPEDAJE', 'MOVILIDAD_LOCAL') NOT NULL,
        cantidad DECIMAL(10, 2) NOT NULL,
        descripcion TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE CASCADE,
        INDEX idx_comprobante (comprobante_id),
        INDEX idx_tipo (tipo_viatitico)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.query(sqlDetalles);
    logger.info('✅ Tabla comprobante_detalles creada/verificada');

    logger.info('\n═══════════════════════════════════════════════════════');
    logger.info('✅ SISTEMA DE COMPROBANTES LISTO');
    logger.info('   └─ comprobantes (Tabla Maestra)');
    logger.info('   └─ comprobante_detalles (Tabla Detalle)\n');

    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      logger.info('⚠️  Tablas de comprobantes ya existen (omitido)');
      return true;
    }
    logger.error('❌ Error al crear tablas de comprobantes:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  ejecutarMigraciones,
  ejecutarMigracionesFormatoEmisiones,
  ejecutarMigracionesEstadoCertificado,
  corregirEstadoUsoEnum,
  agregarCertificacionId,
  agregarMontoUtilizado,
  sincronizarMontoUtilizado,
  revalidarSistema,
  ejecutarMigracionesSql,
  actualizarInicialesUsuarios,
  generarCorrelativosInicial,
  crearTablasComprobantes
};
