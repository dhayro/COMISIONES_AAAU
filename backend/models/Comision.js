const { pool } = require('../config/database');

class Comision {
  // Crear comisión principal
  static async crear(data) {
    const {
      ambito_id,
      meta_id,
      costo_viaje_id,
      lugar,
      ruta,
      modalidad_viaje,
      fecha_salida,
      fecha_retorno,
      num_dias,
      costo_xdia,
      observacion,
      usuario_id,
      presupuesto_estado,
      presupuesto_documento,
      presupuesto_numero_cut,
      presupuesto_fecha
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO comisiones (
          ambito_id, meta_id, costo_viaje_id, lugar, ruta, modalidad_viaje, 
          fecha_salida, fecha_retorno, num_dias, costo_xdia, 
          observacion, usuario_id, costo_total_comision,
          presupuesto_estado, presupuesto_documento,
          presupuesto_numero_cut, presupuesto_fecha
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [
          ambito_id, meta_id || null, costo_viaje_id || null, lugar, ruta, modalidad_viaje,
          fecha_salida, fecha_retorno, num_dias, costo_xdia,
          observacion, usuario_id,
          presupuesto_estado || 'PRESUPUESTO POR ASIGNAR',
          presupuesto_documento || null,
          presupuesto_numero_cut || null,
          presupuesto_fecha || null
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al crear comisión: ${error.message}`);
    }
  }

  // Obtener comisión por ID con detalles
  static async obtenerPorId(id) {
    try {
      const [comisiones] = await pool.query(
        `SELECT c.*, a.nombre_corto as ambito_nombre, m.numero_meta, cv.nombre as costo_viaje_nombre
         FROM comisiones c 
         LEFT JOIN ambitos a ON c.ambito_id = a.id 
         LEFT JOIN metas m ON c.meta_id = m.id
         LEFT JOIN costos_viaje cv ON c.costo_viaje_id = cv.id
         WHERE c.id = ?`,
        [id]
      );

      if (comisiones.length === 0) {
        return null;
      }

      const comision = comisiones[0];

      // Obtener comisionados con sus partidas
      const [comisionados] = await pool.query(
        `SELECT cc.*, u.nombre as usuario_nombre, cl.partida, cl.nombre as clasificador_nombre
         FROM comision_comisionados cc
         JOIN users u ON cc.usuario_id = u.id
         JOIN clasificadores cl ON cc.clasificador_id = cl.id
         WHERE cc.comision_id = ?
         ORDER BY cc.usuario_id, cc.clasificador_id`,
        [id]
      );

      // Calcular monto_real para cada comisionado
      const comisionadosConMontoReal = comisionados.map(com => ({
        ...com,
        monto_real: this.calcularMontoReal(com)
      }));

      comision.comisionados = comisionadosConMontoReal;
      return comision;
    } catch (error) {
      throw new Error(`Error al obtener comisión: ${error.message}`);
    }
  }

  // Listar todas las comisiones
  static async listar(usuarioId = null, rolUsuario = null) {
    try {
      let query = `SELECT c.*, a.nombre_corto as ambito_nombre, m.numero_meta, cv.nombre as costo_viaje_nombre
                   FROM comisiones c 
                   LEFT JOIN ambitos a ON c.ambito_id = a.id
                   LEFT JOIN metas m ON c.meta_id = m.id
                   LEFT JOIN costos_viaje cv ON c.costo_viaje_id = cv.id`;
      const params = [];
      const condiciones = [];

      // Si es administrativo, solo ve comisiones APROBADAS
      if (rolUsuario === 'administrativo') {
        condiciones.push('c.aprobacion_estado = "APROBADA"');
      }
      // Si es usuario regular, ve solo sus propias comisiones
      else if (rolUsuario === 'usuario' && usuarioId) {
        condiciones.push('c.usuario_id = ?');
        params.push(usuarioId);
      }
      // Si es jefe, ve todas las comisiones
      // Si es admin, ve todas las comisiones

      if (condiciones.length > 0) {
        query += ' WHERE ' + condiciones.join(' AND ');
      }

      query += ' ORDER BY c.creado_en DESC';
      const [comisiones] = await pool.query(query, params);
      return comisiones;
    } catch (error) {
      throw new Error(`Error al listar comisiones: ${error.message}`);
    }
  }

  // Actualizar comisión
  static async actualizar(id, data) {
    const {
      ambito_id,
      meta_id,
      costo_viaje_id,
      lugar,
      ruta,
      modalidad_viaje,
      fecha_salida,
      fecha_retorno,
      num_dias,
      costo_xdia,
      observacion,
      estado,
      presupuesto_estado,
      presupuesto_documento,
      presupuesto_numero_cut,
      presupuesto_fecha,
      aprobacion_estado,
      observacion_aprobacion
    } = data;

    try {
      await pool.query(
        `UPDATE comisiones SET 
         ambito_id = ?, meta_id = ?, costo_viaje_id = ?, lugar = ?, ruta = ?, modalidad_viaje = ?,
         fecha_salida = ?, fecha_retorno = ?, num_dias = ?, 
         costo_xdia = ?, observacion = ?, estado = ?,
         presupuesto_estado = ?, presupuesto_documento = ?,
         presupuesto_numero_cut = ?, presupuesto_fecha = ?,
         aprobacion_estado = ?, observacion_aprobacion = ?
         WHERE id = ?`,
        [
          ambito_id || null,
          meta_id || null,
          costo_viaje_id || null,
          lugar || null,
          ruta || null,
          modalidad_viaje || null,
          fecha_salida || null,
          fecha_retorno || null,
          num_dias || null,
          costo_xdia || null,
          observacion || null,
          estado || 'activa',
          presupuesto_estado || 'PRESUPUESTO POR ASIGNAR',
          presupuesto_documento || null,
          presupuesto_numero_cut || null,
          presupuesto_fecha || null,
          aprobacion_estado || 'PENDIENTE_APROBACION',
          observacion_aprobacion || null,
          id
        ]
      );
      return true;
    } catch (error) {
      throw new Error(`Error al actualizar comisión: ${error.message}`);
    }
  }

  // Eliminar comisión
  static async eliminar(id) {
    try {
      const [result] = await pool.query('DELETE FROM comisiones WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar comisión: ${error.message}`);
    }
  }

  // Agregar comisionado a comisión
  static async agregarComisionado(data) {
    const {
      comision_id,
      usuario_id,
      clasificador_id,
      dias,
      costo_xdia,
      monto,
      descripcion,
      observacion
    } = data;

    try {
      const [result] = await pool.query(
        `INSERT INTO comision_comisionados (
          comision_id, usuario_id, clasificador_id,
          dias, costo_xdia, monto, descripcion, observacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          comision_id, usuario_id, clasificador_id,
          dias, costo_xdia, monto, descripcion, observacion
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error al agregar comisionado: ${error.message}`);
    }
  }

  // Obtener comisionados de una comisión
  static async obtenerComisionados(comisionId) {
    try {
      const [comisionados] = await pool.query(
        `SELECT cc.*, u.nombre as usuario_nombre, u.email,
                cl.partida, cl.nombre as clasificador_nombre
         FROM comision_comisionados cc
         JOIN users u ON cc.usuario_id = u.id
         JOIN clasificadores cl ON cc.clasificador_id = cl.id
         WHERE cc.comision_id = ?
         ORDER BY cc.usuario_id, cc.clasificador_id`,
        [comisionId]
      );

      // Calcular monto_real para cada comisionado
      const comisionadosConMontoReal = comisionados.map(com => ({
        ...com,
        monto_real: this.calcularMontoReal(com)
      }));

      return comisionadosConMontoReal;
    } catch (error) {
      throw new Error(`Error al obtener comisionados: ${error.message}`);
    }
  }

  // Método auxiliar para calcular monto_real
  static calcularMontoReal(comisionado) {
    // Si el clasificador es VIÁTICOS, calcula días × costo_xdia
    if (comisionado.clasificador_nombre && comisionado.clasificador_nombre.includes('VIÁTICOS')) {
      return comisionado.dias * comisionado.costo_xdia;
    }
    // Para otros, retorna el monto tal como está
    return comisionado.monto;
  }

  // Actualizar comisionado
  static async actualizarComisionado(id, data) {
    const {
      dias,
      costo_xdia,
      monto,
      descripcion,
      observacion
    } = data;

    console.log('📝 MODELO - ACTUALIZAR COMISIONADO:');
    console.log('ID del comisionado:', id);
    console.log('Valores a actualizar:');
    console.log('  - días:', dias);
    console.log('  - costo_xdia:', costo_xdia);
    console.log('  - monto:', monto);
    console.log('  - descripcion:', descripcion);
    console.log('  - observacion:', observacion);

    try {
      await pool.query(
        `UPDATE comision_comisionados SET 
         dias = ?, costo_xdia = ?, monto = ?, 
         descripcion = ?, observacion = ?
         WHERE id = ?`,
        [dias, costo_xdia, monto, descripcion, observacion, id]
      );
      console.log('✔️ UPDATE SQL EJECUTADO EXITOSAMENTE');
      return true;
    } catch (error) {
      throw new Error(`Error al actualizar comisionado: ${error.message}`);
    }
  }

  // Eliminar comisionado
  static async eliminarComisionado(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM comision_comisionados WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar comisionado: ${error.message}`);
    }
  }

  // Recalcular costo total de la comisión
  static async recalcularTotal(comisionId) {
    try {
      // Obtener todos los comisionados - SOLO SUMAR LOS MONTOS SIN TRANSFORMACIÓN
      const [comisionados] = await pool.query(
        `SELECT cc.monto
         FROM comision_comisionados cc
         WHERE cc.comision_id = ?`,
        [comisionId]
      );

      // Calcular el total: suma simple de los montos guardados
      // (El monto ya contiene el cálculo correcto: si es VIÁTICO = días × costo_xdia, etc)
      const total = comisionados.reduce((sum, com) => {
        return sum + (parseFloat(com.monto) || 0);
      }, 0);

      console.log(`📊 RECALCULANDO TOTAL - Comisión ${comisionId}:`);
      console.log(`   Comisionados encontrados: ${comisionados.length}`);
      console.log(`   Suma de montos: ${total.toFixed(2)}`);

      // Actualizar la tabla
      const [result] = await pool.query(
        `UPDATE comisiones SET costo_total_comision = ? WHERE id = ?`,
        [total, comisionId]
      );

      console.log(`   ✅ costo_total_comision actualizado a: ${total.toFixed(2)}`);
      return true;
    } catch (error) {
      throw new Error(`Error al recalcular total: ${error.message}`);
    }
  }

  // Obtener comisiones por mes
  static async obtenerPorMes(year, month) {
    try {
      // Crear fecha inicio (primer día del mes)
      const fechaInicio = new Date(year, month - 1, 1);
      const fechaInicial = fechaInicio.toISOString().substring(0, 10);

      // Crear fecha fin (último día del mes)
      const fechaFin = new Date(year, month, 0);
      const fechaFinal = fechaFin.toISOString().substring(0, 10);

      // Obtener comisiones cuyas fechas se solapan con el mes
      const [comisiones] = await pool.query(
        `SELECT c.*, a.nombre_corto as ambito_nombre, m.numero_meta, cv.nombre as costo_viaje_nombre
         FROM comisiones c 
         LEFT JOIN ambitos a ON c.ambito_id = a.id 
         LEFT JOIN metas m ON c.meta_id = m.id
         LEFT JOIN costos_viaje cv ON c.costo_viaje_id = cv.id
         WHERE (
           (c.fecha_salida <= ? AND c.fecha_retorno >= ?)
           OR (c.fecha_salida >= ? AND c.fecha_salida <= ?)
         )
         AND c.aprobacion_estado != 'RECHAZADA'
         ORDER BY c.fecha_salida ASC`,
        [fechaFinal, fechaInicial, fechaInicial, fechaFinal]
      );

      // Para cada comisión, obtener sus comisionados completos
      const comisionesConDetalles = await Promise.all(
        comisiones.map(async (comision) => {
          const [comisionados] = await pool.query(
            `SELECT cc.*, u.nombre as usuario_nombre, cl.partida, cl.nombre as clasificador_nombre
             FROM comision_comisionados cc
             JOIN users u ON cc.usuario_id = u.id
             JOIN clasificadores cl ON cc.clasificador_id = cl.id
             WHERE cc.comision_id = ?
             ORDER BY cc.usuario_id, cc.clasificador_id`,
            [comision.id]
          );

          const comisionadosConMontoReal = comisionados.map(com => ({
            ...com,
            monto_real: this.calcularMontoReal(com)
          }));

          return {
            ...comision,
            comisionados: comisionadosConMontoReal
          };
        })
      );

      return comisionesConDetalles;
    } catch (error) {
      throw new Error(`Error al obtener comisiones por mes: ${error.message}`);
    }
  }
}

module.exports = Comision;
