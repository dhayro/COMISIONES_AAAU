// Pruebas de regresión del backend. NUNCA apuntan a producción.
// 1) Crear la BD de prueba:   node tests/restaurar-bd-prueba.js <carpeta-respaldo>
// 2) Migrar la copia:         DB_NAME=comisiones_test node scripts/migrar.js --ejecutar
// 3) Levantar el servidor:    DB_NAME=comisiones_test PORT=5097 node server.js
// 4) Ejecutar:                node tests/regresion.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE = 'http://127.0.0.1:5097';
const DB = 'comisiones_test';
const resultados = [];
const check = (nombre, ok, detalle = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? '  ' + detalle : ''}`);
};

const req = async (metodo, ruta, { token, body } = {}) => {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) { json = null; }
  return { status: r.status, json, texto, headers: r.headers };
};

(async () => {
  const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: DB });
  const hash = await bcrypt.hash('Prueba12345', 10);
  for (const u of ['t_admin', 't_usuario', 't_temp']) await db.query('DELETE FROM users WHERE username=?', [u]);
  await db.query("INSERT INTO users (username,email,password,nombre,rol,activo,debe_cambiar_password) VALUES ('t_admin','t_admin@x.com',?,'Test Admin','admin',1,0)", [hash]);
  await db.query("INSERT INTO users (username,email,password,nombre,rol,activo,debe_cambiar_password) VALUES ('t_usuario','t_usuario@x.com',?,'Test Usuario','usuario',1,0)", [hash]);
  await db.query("INSERT INTO users (username,email,password,nombre,rol,activo,debe_cambiar_password) VALUES ('t_temp','t_temp@x.com',?,'Test Temp','usuario',1,1)", [hash]);

  // Autenticación
  let r = await req('GET', '/api/proveedores/listar');
  check('Ruta protegida sin token -> 401', r.status === 401, `[${r.status}]`);
  r = await req('GET', '/api/health');
  check('Health público -> 200', r.status === 200, `[${r.status}]`);
  r = await req('POST', '/api/auth/login', { body: { username: 't_admin', password: 'Prueba12345' } });
  const tokenAdmin = r.json && r.json.token;
  check('Login admin, sin cambio pendiente', r.status === 200 && !!tokenAdmin && r.json.debe_cambiar_password === false, `[${r.status}]`);
  r = await req('POST', '/api/auth/login', { body: { username: 't_temp', password: 'Prueba12345' } });
  check('Login temporal marca cambio obligatorio', r.status === 200 && r.json.debe_cambiar_password === true);
  const tokenTemp = r.json && r.json.token;
  r = await req('POST', '/api/auth/cambiar-password', { token: tokenTemp, body: { password_actual: 'Prueba12345', password_nueva: 'NuevaClave2026' } });
  check('Cambiar contraseña temporal', r.status === 200, `[${r.status}]`);
  r = await req('POST', '/api/auth/cambiar-password', { token: tokenAdmin, body: { password_actual: 'Mal', password_nueva: 'Otra12345' } });
  check('Cambio con contraseña actual incorrecta -> 401', r.status === 401, `[${r.status}]`);

  // Roles
  r = await req('POST', '/api/auth/login', { body: { username: 't_usuario', password: 'Prueba12345' } });
  const tokenUsuario = r.json.token;
  r = await req('POST', '/api/feriados', { token: tokenUsuario, body: { fecha: '2030-01-01', descripcion: 'Prueba' } });
  check('Usuario normal no crea feriados -> 403', r.status === 403, `[${r.status}]`);
  r = await req('POST', '/api/feriados', { token: tokenAdmin, body: { fecha: '2030-01-01', descripcion: 'Prueba' } });
  check('Admin crea feriado -> 201', r.status === 201, `[${r.status}]`);
  r = await req('DELETE', '/api/feriados/2030-01-01', { token: tokenAdmin });
  check('Admin elimina feriado de prueba', r.status === 200, `[${r.status}]`);

  // Rendiciones: rollback ante error a mitad de transacción
  const [[rendido]] = await db.query("SELECT id, estado_emision FROM formato_emisiones WHERE estado_emision='RENDIDO' AND id IN (SELECT formato_emision_id FROM formato_emisiones_detalles) ORDER BY id LIMIT 1");
  const [[detalle]] = await db.query('SELECT id FROM formato_emisiones_detalles WHERE formato_emision_id=? LIMIT 1', [rendido.id]);
  const contar = async () => (await db.query('SELECT COUNT(*) n FROM rendiciones WHERE formato_emision_id=?', [rendido.id]))[0][0].n;
  const antes = await contar();
  r = await req('POST', '/api/rendiciones/crear', { token: tokenAdmin, body: { formato_emision_id: rendido.id, modo: 'actualizar', comprobantes_nuevos: [
    { formato_emision_detalle_id: detalle.id, tipo_comprobante_id: 1, proveedor_id: 999999, numero_comprobante: 'TST-1', monto: 1, fecha_comprobante: '2026-10-01', orden: 1 }] } });
  check('Error de FK -> 500 sin detalles internos', r.status === 500 && r.json && r.json.error === 'Error al crear rendición' && !('details' in r.json), `[${r.status}]`);
  check('Rollback: sin comprobantes a medias', antes === (await contar()));
  const [[est]] = await db.query('SELECT estado_emision FROM formato_emisiones WHERE id=?', [rendido.id]);
  check('Rollback: estado del formato intacto', est.estado_emision === rendido.estado_emision);

  // Rendiciones: sin SIAF no se puede rendir
  const [[sinSiaf]] = await db.query("SELECT id FROM formato_emisiones WHERE tipo_emision='ANTICIPO' AND (numero_siaf IS NULL OR numero_siaf = '') AND id IN (SELECT formato_emision_id FROM formato_emisiones_detalles) ORDER BY id LIMIT 1");
  if (sinSiaf) {
    const [[dsin]] = await db.query('SELECT id FROM formato_emisiones_detalles WHERE formato_emision_id=? LIMIT 1', [sinSiaf.id]);
    r = await req('POST', '/api/rendiciones/crear', { token: tokenAdmin, body: { formato_emision_id: sinSiaf.id, modo: 'actualizar', comprobantes_nuevos: [{ formato_emision_detalle_id: dsin.id, tipo_comprobante_id: 1, proveedor_id: 1, numero_comprobante: 'SIN-SIAF', monto: 1, fecha_comprobante: '2026-10-01', orden: 1 }] } });
    check('Rendir sin SIAF -> 400', r.status === 400, `[${r.status}]`);
  }

  // Rendiciones: camino feliz en formato no rendido
  await db.query("UPDATE formato_emisiones SET numero_siaf='0000099999' WHERE estado_emision IN ('BORRADOR','EMITIDO','ENVIADO','PAGADO','RINDIENDO') AND id IN (SELECT formato_emision_id FROM formato_emisiones_detalles) ORDER BY id LIMIT 1");
  const [[libre]] = await db.query("SELECT id FROM formato_emisiones WHERE estado_emision IN ('BORRADOR','EMITIDO','ENVIADO','PAGADO','RINDIENDO') AND numero_siaf IS NOT NULL AND numero_siaf <> '' AND id IN (SELECT formato_emision_id FROM formato_emisiones_detalles) ORDER BY id LIMIT 1");
  if (!libre) check("Hay formato libre con SIAF para la prueba feliz", false);
  if (libre) {
    const [[dl]] = await db.query('SELECT id FROM formato_emisiones_detalles WHERE formato_emision_id=? LIMIT 1', [libre.id]);
    const [[prov]] = await db.query('SELECT id FROM proveedores LIMIT 1');
    const [[tipo]] = await db.query('SELECT id FROM tipo_comprobante LIMIT 1');
    r = await req('POST', '/api/rendiciones/crear', { token: tokenAdmin, body: { formato_emision_id: libre.id, modo: 'actualizar', comprobantes_nuevos: [
      { formato_emision_detalle_id: dl.id, tipo_comprobante_id: tipo.id, proveedor_id: prov.id, numero_comprobante: 'TST-OK', monto: 5, fecha_comprobante: '2026-10-01', orden: 1 }] } });
    const id = r.json && r.json.rendicion && r.json.rendicion.id;
    check('Agregar comprobante -> 201', r.status === 201 && !!id, `[${r.status}]`);
    const [[e1]] = await db.query('SELECT estado_emision, fecha_rendicion FROM formato_emisiones WHERE id=?', [libre.id]);
    check('Tras agregar: RINDIENDO sin fecha', e1.estado_emision === 'RINDIENDO' && e1.fecha_rendicion === null);
    r = await req('PUT', `/api/rendiciones/${id}`, { token: tokenAdmin, body: { monto: 7.5 } });
    check('Editar comprobante -> 200', r.status === 200, `[${r.status}]`);
    const [[vr0]] = await db.query('SELECT estado_rendicion FROM rendiciones WHERE id=?', [id]);
    check('Editar deja el comprobante PENDIENTE', vr0.estado_rendicion === 'PENDIENTE', vr0.estado_rendicion);
    r = await req('PUT', `/api/rendiciones/${id}/validacion`, { token: tokenAdmin, body: { mensaje: 'Comprobante valido TEST' } });
    const [[vr1]] = await db.query('SELECT estado_rendicion FROM rendiciones WHERE id=?', [id]);
    check('Validación SUNAT marca VALIDADO', r.status === 200 && vr1.estado_rendicion === 'VALIDADO', vr1.estado_rendicion);
    const [[vm1]] = await db.query('SELECT validacion_mensaje FROM rendiciones WHERE id=?', [id]);
    check('Validación guarda el mensaje de SUNAT', vm1.validacion_mensaje === 'Comprobante valido TEST', vm1.validacion_mensaje);
    await req('PUT', `/api/rendiciones/${id}`, { token: tokenAdmin, body: { monto: 6 } });
    const [[vr2]] = await db.query('SELECT estado_rendicion FROM rendiciones WHERE id=?', [id]);
    check('Editar un validado vuelve a PENDIENTE', vr2.estado_rendicion === 'PENDIENTE', vr2.estado_rendicion);
    r = await req('PUT', `/api/rendiciones/${id}/monto-validacion`, { token: tokenAdmin, body: { monto_factura: 50, sustento: 'corto' } });
    check('Monto con sustento corto -> 400', r.status === 400, `[${r.status}]`);
    r = await req('PUT', `/api/rendiciones/${id}/monto-validacion`, { token: tokenAdmin, body: { monto_factura: 50, sustento: 'La factura incluye IGV y tasa de servicio' } });
    const [[mf]] = await db.query('SELECT monto_factura, sustento_monto FROM rendiciones WHERE id=?', [id]);
    check('Monto corregido y sustento guardados -> 200', r.status === 200 && Number(mf.monto_factura) === 50 && !!mf.sustento_monto, `[${r.status}]`);
    const [[vm2]] = await db.query('SELECT validacion_mensaje FROM rendiciones WHERE id=?', [id]);
    check('Editar borra el mensaje de validación', vm2.validacion_mensaje === null);
    r = await req('PUT', `/api/rendiciones/${id}/validacion`, { token: tokenAdmin, body: { mensaje: 'Manual TEST', estado: 'MANUAL' } });
    const [[vman]] = await db.query('SELECT estado_rendicion FROM rendiciones WHERE id=?', [id]);
    check('Proveedor manual marca MANUAL', r.status === 200 && vman.estado_rendicion === 'MANUAL', vman.estado_rendicion);
    r = await req('DELETE', `/api/rendiciones/${id}`, { token: tokenAdmin });
    check('Eliminar comprobante -> 200', r.status === 200, `[${r.status}]`);

    r = await req('POST', '/api/rendiciones/crear', { token: tokenAdmin, body: { formato_emision_id: libre.id, modo: 'actualizar',
      comprobantes_nuevos: [], rutas: [{ origen: 'LIMA', destino: 'HUANCAYO', fecha_salida: '2026-10-01T08:00', fecha_llegada: '2026-10-01T12:00' }] } });
    const [[nRutas]] = await db.query('SELECT COUNT(*) n FROM rutas WHERE formato_emision_id=?', [libre.id]);
    check('Rutas guardadas dentro de la transacción -> 201', r.status === 201 && nRutas.n >= 1, `[${r.status}] rutas=${nRutas.n}`);
  }

  // PDF
  const dir = path.join(__dirname, '..', 'uploads', 'certificaciones');
  const pdf = fs.readdirSync(dir).find((f) => f.endsWith('.pdf'));
  r = await req('GET', '/api/pdf/archivo-certificacion?ruta=../server.js', { token: tokenAdmin });
  check('Ruta con ../ -> 400', r.status === 400, `[${r.status}]`);
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(path.join(dir, pdf))], { type: 'application/pdf' }), pdf);
  const up = await fetch(BASE + '/api/pdf/extract-certification', { method: 'POST', headers: { Authorization: 'Bearer ' + tokenAdmin }, body: form });
  check('Subir PDF con multer -> 200', up.status === 200, `[${up.status}]`);
  r = await req('GET', `/api/pdf/archivo-certificacion?ruta=uploads/certificaciones/${pdf}`, { token: tokenAdmin });
  check('Ver PDF por ruta -> 200', r.status === 200, `[${r.status}]`);
  const [[com]] = await db.query('SELECT id FROM comisiones ORDER BY id LIMIT 1');
  const pdfCom = await fetch(`${BASE}/api/comisiones/pdf/emision/${com.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenAdmin }, body: JSON.stringify({ comision_data: { id: com.id, lugar: 'PRUEBA', comisionados: [] }, comisionado_id: null }) });
  const bufPdf = Buffer.from(await pdfCom.arrayBuffer());
  check('Generar PDF de comisión (Puppeteer) -> PDF válido', pdfCom.status === 200 && bufPdf.slice(0, 4).toString() === '%PDF', `[${pdfCom.status}]`);

  // Decolecta, errores, cabeceras, límite de intentos
  r = await req('GET', '/api/decolecta/ruc/20520711865', { token: tokenAdmin });
  check('Decolecta RUC -> 200', r.status === 200, `[${r.status}]`);
  r = await req('GET', '/api/noexiste', { token: tokenAdmin });
  check('Ruta inexistente -> 404 JSON', r.status === 404 && r.json && r.json.error === 'Ruta no encontrada', `[${r.status}]`);
  const cab = await fetch(BASE + '/api/health');
  check('Cabecera Helmet presente', !!cab.headers.get('x-content-type-options'));
  let bloqueado = false;
  for (let i = 0; i < 12 && !bloqueado; i++) {
    const x = await req('POST', '/api/auth/login', { body: { username: 't_admin', password: 'mal' + i } });
    bloqueado = x.status === 429;
  }
  check('Límite de intentos de login -> 429', bloqueado);

  for (const u of ['t_admin', 't_usuario', 't_temp']) await db.query('DELETE FROM users WHERE username=?', [u]);
  await db.end();
  const ok = resultados.filter(Boolean).length;
  console.log(`\nRESULTADO: ${ok}/${resultados.length} pruebas OK`);
  process.exit(ok === resultados.length ? 0 : 1);
})().catch((e) => { console.error('ERROR PRUEBAS:', e.message); process.exit(2); });
