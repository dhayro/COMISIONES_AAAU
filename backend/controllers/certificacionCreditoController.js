const logger = require('../shared/logger');
const CertificacionCredito = require('../models/CertificacionCredito');
const { respuestaError500 } = require('../shared/errores');

// ========== CERTIFICACIONES PRINCIPALES ==========

exports.crear = async (req, res) => {
  try {
    const { nota, mes, fecha_aprobacion, fecha_documento, estado_certificacion, tipo_documento, numero_documento, justificacion, meta_id, fuente_financiamiento_id, monto_certificado, detalles_raw } = req.body;
    const usuario_id = req.user.id;

    if (!nota || !mes || !tipo_documento || !numero_documento) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar si ya existe una certificación con la misma nota, mes y numero_documento
    const { pool } = require('../config/database');
    const [existentes] = await pool.query(
      'SELECT id FROM certificaciones_credito WHERE nota = ? AND mes = ? AND numero_documento = ? LIMIT 1',
      [nota, mes, numero_documento]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una certificación con esta combinación de Nota, Mes y Número de Documento',
        certificacion_id: existentes[0].id
      });
    }

    const certificacion_id = await CertificacionCredito.crear({
      nota,
      mes,
      fecha_aprobacion,
      fecha_documento,
      estado_certificacion,
      tipo_documento,
      numero_documento,
      justificacion,
      meta_id,
      fuente_financiamiento_id,
      usuario_id,
      monto_certificado
    });

    // 🆕 Si vienen detalles extraídos, guardarlos también
    let detalles_guardados = 0;
    if (detalles_raw && Array.isArray(detalles_raw) && detalles_raw.length > 0) {
      try {
        for (const detalle of detalles_raw) {
          // Buscar o crear el clasificador
          let [clasificadores] = await pool.query(
            'SELECT id FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
            [detalle.partida_db]
          );

          let clasificador_id = null;
          if (clasificadores.length > 0) {
            clasificador_id = clasificadores[0].id;
          } else {
            // Crear clasificador si no existe
            const [insertResult] = await pool.query(
              'INSERT INTO clasificadores (partida, nombre, descripcion, activo) VALUES (?, ?, ?, 1)',
              [detalle.partida_db, detalle.descripcion.substring(0, 100), detalle.descripcion]
            );
            clasificador_id = insertResult.insertId;
            logger.info(`✓ Clasificador creado: ${detalle.partida_db}`);
          }

          // Insertar detalle de certificación
          if (clasificador_id) {
            await pool.query(
              'INSERT INTO detalles_certificacion_credito (certificacion_credito_id, clasificador_id, monto, monto_utilizado) VALUES (?, ?, ?, 0)',
              [certificacion_id, clasificador_id, detalle.monto || 0]
            );
            detalles_guardados++;
            logger.info(`✓ Detalle guardado: ${detalle.descripcion} - S/. ${detalle.monto}`);
          }
        }
        logger.info(`✅ ${detalles_guardados} detalles guardados exitosamente`);
      } catch (detalleError) {
        logger.error('⚠️ Error guardando detalles:', detalleError.message);
        // No lanzar error, la certificación ya se creó
      }
    }

    res.status(201).json({
      id: certificacion_id,
      message: 'Certificación creada exitosamente',
      detalles_guardados
    });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const certificacion = await CertificacionCredito.obtenerPorId(id);

    if (!certificacion) {
      return res.status(404).json({ error: 'Certificación no encontrada' });
    }

    res.json(certificacion);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.listar = async (req, res) => {
  try {
    const { meta_id, fuente_financiamiento_id, estado_certificacion, mes } = req.query;

    const filtros = {};
    if (meta_id) filtros.meta_id = meta_id;
    if (fuente_financiamiento_id) filtros.fuente_financiamiento_id = fuente_financiamiento_id;
    if (estado_certificacion) filtros.estado_certificacion = estado_certificacion;
    if (mes) filtros.mes = mes;

    // Pasar contexto del usuario para control de acceso
    const userContext = {
      id: req.user.id,
      rol: req.user.rol,
      ambito_id: req.user.ambito_id
    };

    const certificaciones = await CertificacionCredito.listar(filtros, userContext);
    res.json(certificaciones);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota, mes, fecha_aprobacion, fecha_documento, estado_certificacion, tipo_documento, numero_documento, justificacion, meta_id, fuente_financiamiento_id, monto_certificado, detalles_raw } = req.body;

    const actualizada = await CertificacionCredito.actualizar(id, {
      nota,
      mes,
      fecha_aprobacion,
      fecha_documento,
      estado_certificacion,
      tipo_documento,
      numero_documento,
      justificacion,
      meta_id,
      fuente_financiamiento_id,
      monto_certificado
    });

    if (!actualizada) {
      return res.status(404).json({ error: 'Certificación no encontrada' });
    }

    // 🆕 Si vienen detalles extraídos, guardarlos también
    if (detalles_raw && Array.isArray(detalles_raw) && detalles_raw.length > 0) {
      const { pool } = require('../config/database');

      try {
        // Primero, eliminar detalles existentes (para reemplazarlos con los nuevos)
        await pool.query('DELETE FROM detalles_certificacion_credito WHERE certificacion_credito_id = ?', [id]);
        logger.info(`✓ Detalles anteriores eliminados para certificación ${id}`);

        // Luego, insertar los nuevos detalles
        for (const detalle of detalles_raw) {
          // Buscar o crear el clasificador
          let [clasificadores] = await pool.query(
            'SELECT id FROM clasificadores WHERE partida = ? AND activo = 1 LIMIT 1',
            [detalle.partida_db]
          );

          let clasificador_id = null;
          if (clasificadores.length > 0) {
            clasificador_id = clasificadores[0].id;
          } else {
            // Crear clasificador si no existe
            const [insertResult] = await pool.query(
              'INSERT INTO clasificadores (partida, nombre, descripcion, activo) VALUES (?, ?, ?, 1)',
              [detalle.partida_db, detalle.descripcion.substring(0, 100), detalle.descripcion]
            );
            clasificador_id = insertResult.insertId;
            logger.info(`✓ Clasificador creado: ${detalle.partida_db}`);
          }

          // Insertar detalle de certificación
          if (clasificador_id) {
            await pool.query(
              'INSERT INTO detalles_certificacion_credito (certificacion_credito_id, clasificador_id, monto, monto_utilizado) VALUES (?, ?, ?, 0)',
              [id, clasificador_id, detalle.monto || 0]
            );
            logger.info(`✓ Detalle guardado: ${detalle.descripcion} - S/. ${detalle.monto}`);
          }
        }
        logger.info(`✅ Todos los detalles guardados exitosamente`);
      } catch (detalleError) {
        logger.error('⚠️ Error guardando detalles:', detalleError.message);
        // No lanzar error, continuar (la certificación ya se actualizó)
      }
    }

    res.json({
      message: 'Certificación actualizada exitosamente',
      detalles_guardados: detalles_raw ? detalles_raw.length : 0
    });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminada = await CertificacionCredito.eliminar(id);

    if (!eliminada) {
      return res.status(404).json({ error: 'Certificación no encontrada' });
    }

    res.json({ message: 'Certificación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

// ========== DETALLES DE CERTIFICACIÓN ==========

exports.crearDetalle = async (req, res) => {
  try {
    const { certificacion_credito_id, clasificador_id, monto } = req.body;

    if (!certificacion_credito_id || !clasificador_id || !monto) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const detalle_id = await CertificacionCredito.crearDetalle({
      certificacion_credito_id,
      clasificador_id,
      monto
    });

    res.status(201).json({ id: detalle_id, message: 'Detalle creado exitosamente' });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.obtenerDetallePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const detalle = await CertificacionCredito.obtenerDetallePorId(id);

    if (!detalle) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }

    res.json(detalle);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.actualizarDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const { clasificador_id, monto } = req.body;

    const actualizado = await CertificacionCredito.actualizarDetalle(id, {
      clasificador_id,
      monto
    });

    if (!actualizado) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }

    res.json({ message: 'Detalle actualizado exitosamente' });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.eliminarDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await CertificacionCredito.eliminarDetalle(id);

    if (!eliminado) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }

    res.json({ message: 'Detalle eliminado exitosamente' });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.listarDetalles = async (req, res) => {
  try {
    const { certificacion_credito_id } = req.params;
    const detalles = await CertificacionCredito.listarDetalles(certificacion_credito_id);
    res.json(detalles);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.listarFormatos = async (req, res) => {
  try {
    const { certificacion_credito_id } = req.params;
    const formatos = await CertificacionCredito.listarFormatos(certificacion_credito_id);
    res.json(formatos);
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};

exports.obtenerTotalMonto = async (req, res) => {
  try {
    const { certificacion_credito_id } = req.params;
    const total = await CertificacionCredito.obtenerTotalMonto(certificacion_credito_id);
    res.json({ total });
  } catch (error) {
    res.status(500).json(respuestaError500(error));
  }
};
