/**
 * Servicio API para comunicarse con el backend
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = {
  /**
   * Realizar una llamada HTTP
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la solicitud');
    }

    return await response.json();
  },

  // ========== AUTENTICACIÓN ==========
  async registrar(datos) {
    return this.request('/auth/registrar', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async obtenerPerfil() {
    return this.request('/auth/perfil');
  },

  // ========== COMISIONES ==========
  async crearComision(datos) {
    return this.request('/comisiones', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async obtenerComisiones(soloMias = false) {
    const url = soloMias ? '/comisiones?solo_mias=true' : '/comisiones';
    return this.request(url);
  },

  async obtenerComisionesPorMes(year, month) {
    return this.request(`/comisiones/mes/${year}/${month}`);
  },

  async obtenerComisionesParaEmision() {
    return this.request('/comisiones/emision-formatos');
  },

  async obtenerComision(id) {
    return this.request(`/comisiones/${id}`);
  },

  async actualizarComision(id, datos) {
    return this.request(`/comisiones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarComision(id) {
    return this.request(`/comisiones/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== COMISIONADOS ==========
  async agregarComisionado(comisionId, datos) {
    return this.request(`/comisiones/${comisionId}/comisionados`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async obtenerComisionados(comisionId) {
    return this.request(`/comisiones/${comisionId}/comisionados`);
  },

  async actualizarComisionado(comisionId, comisionadoId, datos) {
    return this.request(`/comisiones/${comisionId}/comisionados/${comisionadoId}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarComisionado(id) {
    return this.request(`/comisionados/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== REPORTES ==========
  async obtenerReportePresupuestos(fechaInicio, fechaFin) {
    const url = `/reportes/presupuestos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    return this.request(url);
  },

  async obtenerReportePresupuestosPendientes(fechaInicio, fechaFin) {
    const url = `/reportes/presupuestos-pendientes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    return this.request(url);
  },

  // ========== ÁMBITOS ==========
  async obtenerAmbitos() {
    return this.request('/ambitos');
  },

  async obtenerAmbito(id) {
    return this.request(`/ambitos/${id}`);
  },

  async crearAmbito(datos) {
    return this.request('/ambitos', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarAmbito(id, datos) {
    return this.request(`/ambitos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarAmbito(id) {
    return this.request(`/ambitos/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== CLASIFICADORES ==========
  async obtenerClasificadores() {
    return this.request('/clasificadores');
  },

  async obtenerClasificador(id) {
    return this.request(`/clasificadores/${id}`);
  },

  async crearClasificador(datos) {
    return this.request('/clasificadores', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarClasificador(id, datos) {
    return this.request(`/clasificadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarClasificador(id) {
    return this.request(`/clasificadores/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== COSTOS DE VIAJE ==========
  async obtenerCostosViaje() {
    return this.request('/costos-viaje');
  },

  async obtenerCostoViaje(id) {
    return this.request(`/costos-viaje/${id}`);
  },

  async obtenerCostoPorTipo(tipo) {
    return this.request(`/costos-viaje/tipo/${tipo}`);
  },

  async crearCostoViaje(datos) {
    return this.request('/costos-viaje', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarCostoViaje(id, datos) {
    return this.request(`/costos-viaje/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarCostoViaje(id) {
    return this.request(`/costos-viaje/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== USUARIOS ==========
  async listar() {
    return this.request('/usuarios');
  },

  async obtenerUsuarios() {
    return this.request('/usuarios');
  },

  async obtenerUsuariosActivos() {
    return this.request('/usuarios/activos');
  },

  async obtenerUsuario(id) {
    return this.request(`/usuarios/${id}`);
  },

  async crearUsuario(datos) {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarUsuario(id, datos) {
    return this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async toggleActivo(id, activo) {
    return this.request(`/usuarios/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async eliminarUsuario(id) {
    return this.request(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  },

  async resetearPasswordUsuario(id) {
    return this.request(`/usuarios/${id}/resetear-password`, {
      method: 'POST',
    });
  },

  // ========== METAS ==========
  async obtenerMetas() {
    return this.request('/metas');
  },

  async obtenerMeta(id) {
    return this.request(`/metas/${id}`);
  },

  // 🆕 Obtener certificados disponibles por META
  async obtenerCertificadosPorMeta(metaId) {
    return this.request(`/certificaciones-credito/por-meta/${metaId}`);
  },

  // 🆕 Obtener detalles completos de una certificación (con clasificadores)
  async obtenerDetallesCertificacion(certificacionId) {
    return this.request(`/certificaciones-credito/${certificacionId}`);
  },

  // 🆕 Obtener solo los clasificadores de una certificación
  async obtenerClasificadoresCertificacion(certificacionId) {
    return this.request(`/certificaciones-credito/${certificacionId}/clasificadores`);
  },

  async crearMeta(datos) {
    return this.request('/metas', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarMeta(id, datos) {
    return this.request(`/metas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarMeta(id) {
    return this.request(`/metas/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== FUENTES DE FINANCIAMIENTO ==========
  async obtenerFuentesFinanciamiento() {
    return this.request('/fuentes-financiamiento');
  },

  async obtenerFuenteFinanciamiento(id) {
    return this.request(`/fuentes-financiamiento/${id}`);
  },

  async crearFuenteFinanciamiento(datos) {
    return this.request('/fuentes-financiamiento', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarFuenteFinanciamiento(id, datos) {
    return this.request(`/fuentes-financiamiento/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarFuenteFinanciamiento(id) {
    return this.request(`/fuentes-financiamiento/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== APROBACIONES DE COMISIONES ==========
  async obtenerPendientesAprobacion() {
    return this.request('/aprobaciones/pendientes', {
      method: 'GET',
    });
  },

  async obtenerHistorialAprobaciones() {
    return this.request('/aprobaciones/historial', {
      method: 'GET',
    });
  },

  async obtenerEstadisticasAprobaciones() {
    return this.request('/aprobaciones/estadisticas', {
      method: 'GET',
    });
  },

  async aprobarComision(comisionId, observacion = '') {
    return this.request(`/aprobaciones/aprobar/${comisionId}`, {
      method: 'PUT',
      body: JSON.stringify({ observacion }),
    });
  },

  async rechazarComision(comisionId, observacion = '') {
    return this.request(`/aprobaciones/rechazar/${comisionId}`, {
      method: 'PUT',
      body: JSON.stringify({ observacion }),
    });
  },

  // ========== CARGOS ==========
  async obtenerCargos() {
    return this.request('/cargos');
  },

  async obtenerCargo(id) {
    return this.request(`/cargos/${id}`);
  },

  async crearCargo(datos) {
    return this.request('/cargos', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarCargo(id, datos) {
    return this.request(`/cargos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarCargo(id) {
    return this.request(`/cargos/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== CERTIFICACIONES DE CRÉDITO ==========

  async obtenerCertificacionesCredito(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.meta_id) params.append('meta_id', filtros.meta_id);
    if (filtros.fuente_financiamiento_id) params.append('fuente_financiamiento_id', filtros.fuente_financiamiento_id);
    if (filtros.estado_certificacion) params.append('estado_certificacion', filtros.estado_certificacion);
    if (filtros.mes) params.append('mes', filtros.mes);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/certificaciones-credito${query}`);
  },

  async obtenerCertificacionCreditoPorId(id) {
    return this.request(`/certificaciones-credito/${id}`);
  },

  async crearCertificacionCredito(datos) {
    return this.request('/certificaciones-credito', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarCertificacionCredito(id, datos) {
    return this.request(`/certificaciones-credito/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarCertificacionCredito(id) {
    return this.request(`/certificaciones-credito/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== DETALLES DE CERTIFICACIÓN ==========

  async obtenerDetallesCertificacion(certificacion_credito_id) {
    return this.request(`/certificaciones-credito/${certificacion_credito_id}/detalles`);
  },

  async obtenerFormatosCertificacion(certificacion_credito_id) {
    return this.request(`/certificaciones-credito/${certificacion_credito_id}/formatos`);
  },

  async crearDetalleCertificacion(datos) {
    return this.request('/detalles-certificacion', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarDetalleCertificacion(id, datos) {
    return this.request(`/detalles-certificacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarDetalleCertificacion(id) {
    return this.request(`/detalles-certificacion/${id}`, {
      method: 'DELETE',
    });
  },

  async obtenerTotalMontoCertificacion(certificacion_credito_id) {
    return this.request(`/certificaciones-credito/${certificacion_credito_id}/total`);
  },

  // ========== FORMATO DE EMISIONES ==========
  async crearFormatoEmision(datos) {
    return this.request('/formatos-emisiones', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async obtenerFormatosEmisiones(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.estado_emision) params.append('estado_emision', filtros.estado_emision);
    if (filtros.comision_id) params.append('comision_id', filtros.comision_id);
    if (filtros.tipo_emision) params.append('tipo_emision', filtros.tipo_emision);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/formatos-emisiones${query}`);
  },

  async obtenerFormatoEmisionPorId(id) {
    return this.request(`/formatos-emisiones/${id}`);
  },

  async actualizarFormatoEmision(id, datos) {
    return this.request(`/formatos-emisiones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarFormatoEmision(id) {
    return this.request(`/formatos-emisiones/${id}`, {
      method: 'DELETE',
    });
  },

  async obtenerDetallesFormatoEmision(formato_id) {
    return this.request(`/formatos-emisiones/${formato_id}/detalles`);
  },

  async agregarDetalleFormatoEmision(formato_id, datos) {
    return this.request(`/formatos-emisiones/${formato_id}/detalles`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async obtenerProximoNumeroFormatoEmision() {
    return this.request('/formatos-emisiones/proximo-numero/obtener');
  },

  // ========== FERIADOS ==========
  async obtenerFeriados() {
    const response = await this.request('/feriados');
    return response.feriados || [];
  },

  async crearFeriado(datos) {
    return this.request('/feriados', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async eliminarFeriado(fecha) {
    return this.request(`/feriados/${fecha}`, {
      method: 'DELETE',
    });
  },

  // ========== MÉTODOS GENÉRICOS ==========
  async get(endpoint, config = {}) {
    const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';
    return this.request(`${endpoint}${params}`, {
      method: 'GET',
      ...config,
    });
  },

  async post(endpoint, data = {}, config = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...config,
    });
  },

  async put(endpoint, data = {}, config = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...config,
    });
  },

  async delete(endpoint, config = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...config,
    });
  },

  // ========== COMPROBANTES Y RENDICIÓN ==========
  async crearComprobante(datos) {
    return this.request('/comprobantes/crear', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async listarComprobantes(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.formato_emision_id) {
      params.append('formato_emision_id', filtros.formato_emision_id);
    }
    if (filtros.estado_rendicion) {
      params.append('estado_rendicion', filtros.estado_rendicion);
    }
    if (filtros.tipo_comprobante) {
      params.append('tipo_comprobante', filtros.tipo_comprobante);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/comprobantes/listar?${queryString}` : '/comprobantes/listar';
    
    return this.request(endpoint);
  },

  async obtenerComprobante(id) {
    return this.request(`/comprobantes/${id}`);
  },

  async actualizarComprobante(id, datos) {
    return this.request(`/comprobantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarComprobante(id) {
    return this.request(`/comprobantes/${id}`, {
      method: 'DELETE',
    });
  },

  async obtenerEstadisticasComprobantes(formato_emision_id) {
    return this.request(`/comprobantes/estadisticas/${formato_emision_id}`);
  },

  // ========== RENDICIONES (NUEVO MODELO PRINCIPAL) ==========
  async crearRendicion(datos) {
    return this.request('/rendiciones/crear', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async listarRendiciones(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.formato_emision_id) {
      params.append('formato_emision_id', filtros.formato_emision_id);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/rendiciones/listar?${queryString}` : '/rendiciones/listar';
    return this.request(endpoint);
  },

  async obtenerRendicion(id) {
    return this.request(`/rendiciones/${id}`);
  },

  async actualizarRendicion(id, datos) {
    return this.request(`/rendiciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarRendicion(id) {
    return this.request(`/rendiciones/${id}`, {
      method: 'DELETE',
    });
  },

  async obtenerRendicionesPorFormato(formatoEmisionId) {
    return this.request(`/rendiciones/obtener-por-formato/${formatoEmisionId}`);
  },

  // ========== TIPO DE COMPROBANTE (MAESTRO) ==========
  async listarTipoComprobante() {
    const response = await this.request('/tipo-comprobante/listar');
    return response.tipo_comprobantes || [];
  },

  async obtenerTiposComprobante() {
    const response = await this.request('/tipo-comprobante/listar');
    return response.tipo_comprobantes || [];
  },

  async obtenerTipoComprobante(id) {
    return this.request(`/tipo-comprobante/${id}`);
  },

  async crearTipoComprobante(datos) {
    return this.request('/tipo-comprobante/crear', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  async actualizarTipoComprobante(id, datos) {
    return this.request(`/tipo-comprobante/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  async eliminarTipoComprobante(id) {
    return this.request(`/tipo-comprobante/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== PROVEEDORES (MAESTRO) ==========
  /**
   * Transformar datos del backend (razon_social, ruc_dni) 
   * al formato del frontend (nombre, ruc)
   */
  _transformarProveedor(proveedor) {
    return {
      ...proveedor,
      nombre: proveedor.razon_social || '',
      ruc: proveedor.ruc_dni || '',
    };
  },

  _transformarProveedores(proveedores) {
    return Array.isArray(proveedores) 
      ? proveedores.map(p => this._transformarProveedor(p))
      : [];
  },

  async listarProveedores(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.razon_social) {
      params.append('razon_social', filtros.razon_social);
    }
    if (filtros.tipo_documento) {
      params.append('tipo_documento', filtros.tipo_documento);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/proveedores/listar?${queryString}` : '/proveedores/listar';
    const response = await this.request(endpoint);
    const proveedores = response.proveedores || [];
    return this._transformarProveedores(proveedores);
  },

  async obtenerProveedores(filtros = {}) {
    return this.listarProveedores(filtros);
  },

  async obtenerProveedor(id) {
    const response = await this.request(`/proveedores/${id}`);
    return this._transformarProveedor(response.proveedor || response);
  },

  async crearProveedor(datos) {
    // Transformar campos del frontend al formato backend
    const datosTransformados = {
      razon_social: datos.nombre || '',
      ruc_dni: datos.ruc || '',
      tipo_documento: datos.ruc && datos.ruc.length === 11 ? 'RUC' : 'DNI',
      direccion: datos.direccion || '',
      telefono: datos.telefono || '',
      email: datos.email || '',
      contacto_nombre: datos.contacto_nombre || '',
    };
    
    return this.request('/proveedores/crear', {
      method: 'POST',
      body: JSON.stringify(datosTransformados),
    });
  },

  async actualizarProveedor(id, datos) {
    // Transformar campos del frontend al formato backend
    const datosTransformados = {
      razon_social: datos.nombre || undefined,
      ruc_dni: datos.ruc || undefined,
      tipo_documento: datos.ruc && datos.ruc.length === 11 ? 'RUC' : 'DNI',
      direccion: datos.direccion || undefined,
      telefono: datos.telefono || undefined,
      email: datos.email || undefined,
      contacto_nombre: datos.contacto_nombre || undefined,
    };
    
    // Remover campos undefined
    Object.keys(datosTransformados).forEach(key => 
      datosTransformados[key] === undefined && delete datosTransformados[key]
    );
    
    return this.request(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datosTransformados),
    });
  },

  async eliminarProveedor(id) {
    return this.request(`/proveedores/${id}`, {
      method: 'DELETE',
    });
  },
};

export default apiService;
