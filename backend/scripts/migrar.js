// Migraciones controladas de la base de datos.
// Uso:
//   node scripts/migrar.js            -> muestra el plan, sin modificar nada
//   node scripts/migrar.js --ejecutar -> aplica los pasos en orden
// Haz un respaldo de la BD antes de ejecutar con --ejecutar.

const path = require('path');
const { spawnSync } = require('child_process');
const { pool, initDatabase } = require('../config/database');
const migraciones = require('../config/migraciones');
const { crearTablasRendicionesMaestras } = require('../migrations/004_crear_rendiciones_maestras');
const { crearTablaRendicionComprobantes } = require('../migrations/007_crear_rendicion_comprobantes');
const { agregarRendidoEnum } = require('../migrations/008_agregar_rendido_enum_estado_emision');
const { agregarOrdenRendiciones } = require('../migrations/009_agregar_orden_rendiciones');
const { crearTablaRutas } = require('../migrations/010_crear_tabla_rutas');

const crearTablaCorrelativos = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS correlativo_control (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      ano INT NOT NULL,
      numero_inicial INT NOT NULL DEFAULT 1,
      numero_proximo INT NOT NULL DEFAULT 1,
      prefijo VARCHAR(50),
      descripcion VARCHAR(255),
      activo BOOLEAN DEFAULT 1,
      creado_por INT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE KEY unique_usuario_ano (usuario_id, ano),
      INDEX idx_usuario (usuario_id),
      INDEX idx_ano (ano),
      INDEX idx_activo (activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  } finally {
    connection.release();
  }
};

const ejecutarArchivo = (archivo) => {
  const resultado = spawnSync(process.execPath, [path.join(__dirname, '..', archivo)], { stdio: 'inherit' });
  if (resultado.status !== 0) throw new Error(`${archivo} terminó con código ${resultado.status}`);
};

// Mismo orden que tenía el arranque de server.js
const PASOS = [
  { nombre: 'Crear base de datos y tablas base', escribe: 'esquema', fn: () => initDatabase() },
  { nombre: 'Tabla correlativo_control', escribe: 'esquema', fn: crearTablaCorrelativos },
  { nombre: 'Migraciones automáticas', escribe: 'esquema', fn: () => migraciones.ejecutarMigraciones(pool) },
  { nombre: 'Migraciones de formato_emisiones', escribe: 'esquema', fn: () => migraciones.ejecutarMigracionesFormatoEmisiones(pool) },
  { nombre: 'Migraciones de estado de certificaciones', escribe: 'esquema', fn: () => migraciones.ejecutarMigracionesEstadoCertificado(pool) },
  { nombre: 'Corregir enum estado_uso', escribe: 'esquema', fn: () => migraciones.corregirEstadoUsoEnum(pool) },
  { nombre: 'Columna certificacion_id en formato_emisiones', escribe: 'esquema', fn: () => migraciones.agregarCertificacionId(pool) },
  { nombre: 'Columna monto_utilizado en certificaciones', escribe: 'esquema', fn: () => migraciones.agregarMontoUtilizado(pool) },
  { nombre: 'Sincronizar monto_utilizado (ESCRIBE DATOS)', escribe: 'datos', fn: () => migraciones.sincronizarMontoUtilizado(pool) },
  { nombre: 'Migraciones SQL de la carpeta migrations', escribe: 'esquema', fn: () => migraciones.ejecutarMigracionesSql(pool) },
  { nombre: 'Tablas de rendiciones maestras', escribe: 'esquema', fn: () => crearTablasRendicionesMaestras(pool) },
  { nombre: 'Tabla rendicion_comprobantes', escribe: 'esquema', fn: () => crearTablaRendicionComprobantes(pool) },
  { nombre: 'Enum estado_emision (RENDIDO/RINDIENDO/DEVUELTO)', escribe: 'esquema', fn: () => agregarRendidoEnum(pool) },
  { nombre: 'Columna orden en rendiciones', escribe: 'esquema', fn: () => agregarOrdenRendiciones(pool) },
  { nombre: 'Tabla rutas', escribe: 'esquema', fn: () => crearTablaRutas(pool) },
  { nombre: 'Actualizar iniciales de usuarios (ESCRIBE DATOS)', escribe: 'datos', fn: () => migraciones.actualizarInicialesUsuarios(pool) },
  { nombre: 'Generar correlativos iniciales (ESCRIBE DATOS)', escribe: 'datos', fn: () => migraciones.generarCorrelativosInicial(pool) },
  { nombre: 'Revalidar sistema (ESCRIBE DATOS)', escribe: 'datos', fn: () => require('../config/migraciones').revalidarSistema(pool) },
  { nombre: 'Migración 011: enum RINDIENDO', escribe: 'esquema', fn: () => ejecutarArchivo('migrations/011_agregar_rindiendo_estado_emision.js') },
  { nombre: 'Migración 012: estado DEVUELTO y campos de devolución', escribe: 'esquema', fn: () => ejecutarArchivo('migrations/012_devolucion_formato.js') },
  { nombre: 'Migración 013: contraseña temporal (marca Autoridad1)', escribe: 'datos', fn: () => ejecutarArchivo('migrations/013_password_temporal.js') },
  { nombre: 'Migración 014: estado VALIDADO en rendiciones', escribe: 'esquema', fn: () => ejecutarArchivo('migrations/014_rendicion_estado_validado.js') },
  { nombre: 'Migración 015: mensaje de validación SUNAT en rendiciones', escribe: 'esquema', fn: () => ejecutarArchivo('migrations/015_rendicion_validacion_sunat.js') },
  { nombre: 'Migración 016: monto de factura y sustento en rendiciones', escribe: 'esquema', fn: () => ejecutarArchivo('migrations/016_rendicion_monto_factura.js') },
  { nombre: 'Migración 017: estado MANUAL en rendiciones', escribe: 'esquema', fn: () => ejecutarArchivo('migrations/017_rendicion_estado_manual.js') },
];

const main = async () => {
  const ejecutar = process.argv.includes('--ejecutar');

  console.log('\nPLAN DE MIGRACIONES\n');
  PASOS.forEach((paso, i) => {
    const marca = paso.escribe === 'datos' ? '[datos]   ' : '[esquema] ';
    console.log(`${String(i + 1).padStart(2, ' ')}. ${marca}${paso.nombre}`);
  });

  if (!ejecutar) {
    console.log('\nVista previa: no se modificó nada.');
    console.log('Para aplicar (después de respaldar la BD): node scripts/migrar.js --ejecutar\n');
    process.exit(0);
  }

  console.log('\nEjecutando...\n');
  for (const paso of PASOS) {
    try {
      console.log(`▶ ${paso.nombre}`);
      await paso.fn();
    } catch (error) {
      console.error(`❌ Falló: ${paso.nombre}\n   ${error.message}`);
      process.exit(1);
    }
  }
  console.log('\n✅ Migraciones aplicadas.\n');
  process.exit(0);
};

main();
