/**
 * Servicio para consumir API de Decolecta vía Backend (proxy)
 * Permite consultar datos de RUC (empresas) y DNI (personas)
 * Evita problemas de CORS enviando requests a través del backend
 */

import { API_BASE_URL } from './api';

const decolectaService = {
  /**
   * Consultar datos de una empresa por RUC
   * @param {string} ruc - Número de RUC (11 dígitos)
   * @returns {Promise} Datos de la empresa
   */
  async consultarRUC(ruc) {
    const numeroLimpio = ruc.replace(/\D/g, '');
    if (!numeroLimpio || numeroLimpio.length !== 11) {
      throw new Error('El RUC debe tener 11 dígitos');
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/decolecta/ruc/${numeroLimpio}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al consultar RUC: ${response.status}`);
      }

      const resultado = await response.json();
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error desconocido');
      }

      const data = resultado.data;
      return {
        success: true,
        data: {
          nombre: data.razon_social || data.nombre,
          ruc: data.numero_documento || data.ruc,
          estado: data.estado || '',
          condicion: data.condicion || '',
          direccion: data.direccion || '',
          distrito: data.distrito || '',
          provincia: data.provincia || '',
          departamento: data.departamento || '',
          tipo: data.tipo || '',
          actividad_economica: data.actividad_economica || '',
          numero_trabajadores: data.numero_trabajadores || '',
          tipo_facturacion: data.tipo_facturacion || '',
        },
      };
    } catch (error) {
      console.error('❌ Error consultando RUC:', error);
      return {
        success: false,
        error: error.message || 'Error al consultar RUC',
      };
    }
  },

  /**
   * Consultar datos de una persona por DNI
   * @param {string} dni - Número de DNI (8 dígitos)
   * @returns {Promise} Datos de la persona
   */
  async consultarDNI(dni) {
    const numeroLimpio = dni.replace(/\D/g, '');
    if (!numeroLimpio || numeroLimpio.length !== 8) {
      throw new Error('El DNI debe tener 8 dígitos');
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/decolecta/dni/${numeroLimpio}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al consultar DNI: ${response.status}`);
      }

      const resultado = await response.json();
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error desconocido');
      }

      const data = resultado.data;
      return {
        success: true,
        data: {
          nombre_completo: data.full_name || data.nombre_completo || '',
          nombres: data.first_name || data.nombres || '',
          apellido_paterno: data.first_last_name || data.apellido_paterno || '',
          apellido_materno: data.second_last_name || data.apellido_materno || '',
          dni: data.document_number || data.dni || '',
        },
      };
    } catch (error) {
      console.error('❌ Error consultando DNI:', error);
      return {
        success: false,
        error: error.message || 'Error al consultar DNI',
      };
    }
  },

  /**
   * Determina si es RUC o DNI y consulta accordingly
   * @param {string} numero - Número a consultar
   * @returns {Promise} Datos consultados
   */
  async consultarNumero(numero) {
    if (!numero || numero.toString().trim() === '') {
      throw new Error('El número no puede estar vacío');
    }

    const numeroLimpio = numero.toString().replace(/\D/g, ''); // Remover caracteres no numéricos

    if (numeroLimpio.length === 11) {
      return this.consultarRUC(numeroLimpio);
    } else if (numeroLimpio.length === 8) {
      return this.consultarDNI(numeroLimpio);
    } else {
      throw new Error(`El número debe ser un RUC (11 dígitos) o DNI (8 dígitos). Recibido: ${numeroLimpio.length} dígitos`);
    }
  },
};

export default decolectaService;
