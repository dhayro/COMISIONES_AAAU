import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Autocomplete,  // 🆕 Importar Autocomplete
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import Swal from 'sweetalert2';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from 'context/AuthContext'; // 🆕 Importar AuthContext

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// 🆕 FUNCIÓN AUXILIAR: Obtener fecha ACTUAL en zona horaria de Perú (para fecha_emision)
const obtenerFechaEmisionPerú = () => {
  // Obtener hora actual en zona horaria de Perú
  const formatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const partes = formatter.formatToParts(new Date());
  const año = partes.find(p => p.type === 'year')?.value;
  const mes = partes.find(p => p.type === 'month')?.value;
  const día = partes.find(p => p.type === 'day')?.value;
  const hora = partes.find(p => p.type === 'hour')?.value;
  const minuto = partes.find(p => p.type === 'minute')?.value;
  const segundo = partes.find(p => p.type === 'second')?.value;
  
  // Retornar en formato ISO representando la zona horaria de Perú
  // IMPORTANTE: Esto NO es UTC, es Perú/Lima local
  const ms = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${año}-${mes}-${día}T${hora}:${minuto}:${segundo}.${ms}Z`;
};

// 🆕 FUNCIÓN AUXILIAR: Convertir fecha UTC a zona horaria de Perú/Lima (UTC-5)
// Retorna string en formato datetime-local (YYYY-MM-DDTHH:mm)
const convertirAHorarioPerú = (fechaUTC) => {
  if (!fechaUTC) return '';
  
  // Crear fecha UTC
  const fecha = new Date(fechaUTC);
  
  // Convertir a zona horaria de Perú/Lima (UTC-5)
  const formatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Obtener la fecha/hora en formato DD/MM/YYYY, HH:mm
  let resultado = formatter.format(fecha);
  
  // Corregir si retorna 24:00 (medianoche)
  resultado = resultado.replace(', 24:00', ', 00:00');
  
  // Parsear: "02/03/2026, 00:00" → "2026-03-02T00:00"
  const [fechaParte, horaParte] = resultado.split(', ');
  const [día, mes, año] = fechaParte.split('/');
  
  // Retornar string en formato datetime-local
  return `${año}-${mes}-${día}T${horaParte}`;
};

function EmisionFormatos() {
  const { usuario: usuarioLogueado } = useAuth(); // 🆕 Obtener usuario del contexto
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedComision, setSelectedComision] = useState(null);
  const [selectedRowComisionado, setSelectedRowComisionado] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // 🆕 Estados para crear formato
  const [openCrearFormato, setOpenCrearFormato] = useState(false);
  const [comisionSeleccionadaParaFormato, setComisionSeleccionadaParaFormato] = useState(null);
  const [detallesEditables, setDetallesEditables] = useState([]);
  const [clasificadoresDisponibles, setClasificadoresDisponibles] = useState([]);
  const [metasDisponibles, setMetasDisponibles] = useState([]);  // 🆕 Metas disponibles
  const [certificadosDisponibles, setCertificadosDisponibles] = useState([]);  // 🆕 Certificados disponibles
  const [detallesCertificacionSeleccionada, setDetallesCertificacionSeleccionada] = useState(null);  // 🆕 Detalles de cert seleccionada
  const [clasificadorSeleccionado, setClasificadorSeleccionado] = useState(null);  // 🆕 Clasificador seleccionado
  const [cambiosPendientesMonto, setCambiosPendientesMonto] = useState({});  // 🆕 Rastrear cambios de montos
  const [formValues, setFormValues] = useState({
    comision_id: '',
    usuario_id: '',
    meta_id: '',  // 🆕 META
    lugar: '',
    ruta: '',
    modalidad_viaje: '',
    fecha_salida: '',
    fecha_retorno: '',
    num_dias: '',
    costo_viaje_id: '',
    tipo_emision: 'REEMBOLSO',
    numero_siaf: '',
    codigo_cp: '',
    costo_xdia: '',
    actividad_realizar: '',  // 🆕 ACTIVIDAD A REALIZAR
    observacion: ''
  });
  const [creatingFormato, setCreatingFormato] = useState(false);

  // Cargar comisiones y metas al montar
  useEffect(() => {
    cargarComisiones();
    cargarMetas();  // 🆕 Cargar metas disponibles
    cargarClasificadores();  // 🆕 Cargar todos los clasificadores
  }, []);

  // 🆕 Cargar certificados cuando cambia la META
  useEffect(() => {
    if (formValues.meta_id && openCrearFormato) {
      cargarCertificadosPorMeta(formValues.meta_id);
    }
  }, [formValues.meta_id, openCrearFormato]);

  // 🆕 Recargar datos cuando se abre el diálogo
  useEffect(() => {
    if (openCrearFormato) {
      console.log('🔄 Recargar datos de certificados...');
      cargarComisiones();  // Recargar comisiones
      cargarMetas();       // Recargar metas
      // Si ya hay una meta seleccionada, recargar sus certificados
      if (formValues.meta_id) {
        cargarCertificadosPorMeta(formValues.meta_id);
      }
    }
  }, [openCrearFormato]);

  // 🆕 Función para cargar clasificadores maestro
  const cargarClasificadores = async () => {
    try {
      const clasificadores = await api.obtenerClasificadores();
      setClasificadoresDisponibles(clasificadores || []);
      console.log('📚 Clasificadores cargados:', clasificadores);
    } catch (error) {
      console.error('Error al cargar clasificadores:', error);
    }
  };

  // 🆕 Función para cargar metas
  const cargarMetas = async () => {
    try {
      const metas = await api.obtenerMetas();
      setMetasDisponibles(metas || []);
      console.log('📊 Metas cargadas:', metas);
    } catch (error) {
      console.error('Error al cargar metas:', error);
    }
  };

  // 🆕 Función para cargar certificados ACTIVOS o EN_PROCESO de una META específica
  const cargarCertificadosPorMeta = async (metaId) => {
    try {
      console.log(`📜 Cargando certificados para META ${metaId}...`);
      
      // Llamar al API para obtener certificados de la meta
      const certificados = await api.obtenerCertificadosPorMeta(metaId);
      
      // Filtrar solo ACTIVOS o EN_PROCESO
      const certificadosFiltrados = (certificados || []).filter(
        c => c.estado_uso === 'ACTIVO' || c.estado_uso === 'EN_PROCESO'
      );
      
      setCertificadosDisponibles(certificadosFiltrados || []);
      console.log('📜 Certificados disponibles:', certificadosFiltrados);
    } catch (error) {
      console.error('Error al cargar certificados:', error);
      setCertificadosDisponibles([]);
    }
  };

  // 🆕 Función para cargar detalles completos de una certificación
  const cargarDetallesCertificacion = async (certificacionId, esModificacion = false) => {
    try {
      if (!certificacionId) {
        console.warn('⚠️ certificacionId es inválido');
        setDetallesCertificacionSeleccionada(null);
        return;
      }
      console.log(`📋 Cargando detalles para certificación ${certificacionId}...`);
      console.log(`   Modo: ${esModificacion ? 'EDICIÓN' : 'CREACIÓN'}`);
      
      // Obtener clasificadores del certificado
      const respuesta = await api.obtenerClasificadoresCertificacion(certificacionId);
      console.log('📋 Detalles retornados del servidor:', respuesta);
      
      // Formatear la respuesta
      let datosFormateados;
      if (Array.isArray(respuesta)) {
        datosFormateados = { detalles: respuesta };
      } else if (respuesta?.detalles) {
        datosFormateados = respuesta;
      } else {
        datosFormateados = { detalles: respuesta ? [respuesta] : [] };
      }
      
      console.log(`📋 ${datosFormateados.detalles?.length} detalles disponibles en certificación`);
      setDetallesCertificacionSeleccionada(datosFormateados);
      setClasificadorSeleccionado(null);
      
      // 🔄 Actualizar detalles_certificacion_credito_id en detalles existentes
      // sin cambiar los clasificadores que ya tienes
      if (datosFormateados?.detalles && datosFormateados.detalles.length > 0) {
        const detallesActualizados = detallesEditables.map(detalleExistente => {
          // Buscar el detalles_certificacion_credito_id para este clasificador en el certificado
          const detalleEnCertificado = datosFormateados.detalles.find(
            d => d.clasificador_id === detalleExistente.clasificador_id
          );
          
          if (detalleEnCertificado) {
            console.log(`✅ Actualizando ${detalleExistente.clasificador_nombre}: detalles_certificacion_credito_id = ${detalleEnCertificado.detalles_certificacion_credito_id}`);
            return {
              ...detalleExistente,
              detalles_certificacion_credito_id: detalleEnCertificado.detalles_certificacion_credito_id
            };
          } else {
            console.warn(`⚠️ Clasificador ${detalleExistente.clasificador_id} NO está en certificado ${certificacionId}`);
            // Si no está en el certificado, dejar como NULL
            return {
              ...detalleExistente,
              detalles_certificacion_credito_id: null
            };
          }
        });
        
        console.log('✅ Detalles actualizados con IDs del certificado:');
        console.log(detallesActualizados.map(d => ({
          clasificador_id: d.clasificador_id,
          clasificador_nombre: d.clasificador_nombre,
          detalles_certificacion_credito_id: d.detalles_certificacion_credito_id
        })));
        
        setDetallesEditables(detallesActualizados);
      } else if (detallesEditables.length === 0 && !esModificacion) {
        // Solo auto-poblar si NO hay detalles y es modo CREACIÓN
        console.log('ℹ️ Sin detalles previos y modo CREACIÓN - auto-poblando');
        const detallesDelCertificado = datosFormateados.detalles.map(d => ({
          id: d.detalles_certificacion_credito_id || Date.now() + Math.random(),
          clasificador_id: d.clasificador_id || '',
          clasificador_nombre: d.clasificador_nombre || 'N/A',
          monto: parseFloat(d.monto) || 0,
          detalles_certificacion_credito_id: d.detalles_certificacion_credito_id
        }));
        setDetallesEditables(detallesDelCertificado);
      }
    } catch (error) {
      console.error('❌ Error al cargar detalles:', error);
      setDetallesCertificacionSeleccionada(null);
      setClasificadorSeleccionado(null);
      setDetallesEditables([]);
    }
  };

  // Función auxiliar para esperar a que pdfMake esté listo
  const cargarComisiones = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('👤 Usuario logueado:', usuarioLogueado);
      console.log('   Nombre:', usuarioLogueado?.nombre);
      console.log('   Rol:', usuarioLogueado?.rol);
      
      const response = await api.obtenerComisionesParaEmision();
      console.log('📥 Total comisiones del backend:', response.comisiones.length);
      
      if (!usuarioLogueado || !usuarioLogueado.nombre) {
        setError('⚠️ No se pudo identificar el usuario logueado');
        setComisiones([]);
        return;
      }
      
      // 🆕 FILTRADO según el rol del usuario:
      // - admin/jefe: Ver TODAS las comisiones (sin filtro de comisionados)
      // - usuario: Solo ver comisiones donde es comisionado
      const comisionesMap = {};
      const nombreUsuarioNormalizado = usuarioLogueado.nombre.trim().toUpperCase();
      const esAdminOJefe = usuarioLogueado.rol === 'admin' || usuarioLogueado.rol === 'jefe';
      
      response.comisiones.forEach((comision) => {
        if (comision.comisionados && comision.comisionados.length > 0) {
          let comisionadosAMostrar = [];
          
          if (esAdminOJefe) {
            // Admin/Jefe: mostrar TODOS los comisionados de la comisión
            console.log(`✅ Comisión ${comision.id} (${comision.lugar}): ADMIN - mostrando todos los comisionados`);
            comisionadosAMostrar = comision.comisionados;
          } else {
            // Usuario regular: mostrar TODOS los clasificadores del usuario en esta comisión
            const comisionadosDelUsuario = comision.comisionados.filter(
              c => {
                const nombreComisionadoNormalizado = (c.usuario_nombre || '').trim().toUpperCase();
                return nombreComisionadoNormalizado === nombreUsuarioNormalizado;
              }
            );
            
            if (comisionadosDelUsuario.length > 0) {
              console.log(`✅ Comisión ${comision.id} (${comision.lugar}): Usuario es comisionado con ${comisionadosDelUsuario.length} clasificador(es)`);
              comisionadosAMostrar = comisionadosDelUsuario; // TODOS los clasificadores del usuario
            }
          }
          
          // Procesar comisionados
          comisionadosAMostrar.forEach((comisionadoDelUsuario) => {
            const comisionadoConObservacion = {
              ...comisionadoDelUsuario,
              actividad_realizar: comision.observacion  // 🆕 Mapear a actividad_realizar
            };
            
            const clave = `${comisionadoConObservacion.usuario_nombre}|${comision.lugar}|${comision.fecha_salida}`;
            
            if (!comisionesMap[clave]) {
              comisionesMap[clave] = {
                // Datos de la comisión
                comision_id: comision.id,
                ambito_nombre: comision.ambito_nombre,
                lugar: comision.lugar,
                modalidad_viaje: comision.modalidad_viaje,
                fecha_salida: comision.fecha_salida,
                fecha_retorno: comision.fecha_retorno,
                meta_nombre: comision.meta_nombre,
                numero_meta: comision.numero_meta,
                actividad_realizar: comision.observacion,  // 🆕 Mapear a actividad_realizar
                
                // Datos del comisionado específico
                observacion: comisionadoConObservacion.observacion || '',  // 🆕 Observación del comisionado
                
                // Datos SOLO del usuario logueado
                usuario_nombre: comisionadoConObservacion.usuario_nombre,
                usuario_id: comisionadoConObservacion.usuario_id,
                cargo_nombre: comisionadoConObservacion.cargo_nombre,
                
                // Valores del usuario logueado (INICIALES)
                monto: parseFloat(comisionadoConObservacion.monto),
                dias: parseInt(comisionadoConObservacion.dias, 10),
                costo_xdia: parseFloat(comisionadoConObservacion.costo_xdia),
                clasificador_id: comisionadoConObservacion.clasificador_id,
                clasificador_nombre: comisionadoConObservacion.clasificador_nombre,
                partida: comisionadoConObservacion.partida,
                
                // 🆕 Guardar TODOS los comisionados (para la vista previa completa)
                comision_completa: {
                  ...comision,
                  comisionados: [comisionadoConObservacion] // Iniciar con el primero
                }
              };
            } else {
              // 🆕 Ya existe, sumar monto y agregar comisionado a la lista
              const montoActual = parseFloat(comisionadoConObservacion.monto);
              comisionesMap[clave].monto += montoActual;
              comisionesMap[clave].monto = Math.round(comisionesMap[clave].monto * 100) / 100;
              
              // Agregar el comisionado a la lista de la comisión completa
              comisionesMap[clave].comision_completa.comisionados.push(comisionadoConObservacion);
            }
          }); // Fin forEach de comisionados
        }
      }); // Fin forEach de comisiones
      
      // Convertir map a array
      let comisionesTransformadas = Object.values(comisionesMap);
      
      console.log('📋 Comisiones cargadas:');
      console.log('   Usuario logueado:', usuarioLogueado.nombre);
      console.log('   Total de comisiones del usuario:', comisionesTransformadas.length);
      
      // 🆕 Cargar formatos existentes para verificar cuáles ya tienen
      try {
        const formatosResponse = await api.obtenerFormatosEmisiones({});
        const formatos = formatosResponse.formatos || [];
        console.log(`📄 Total formatos existentes: ${formatos.length}`);
        
        // Agregar información de formato a cada comisión
        comisionesTransformadas = comisionesTransformadas.map(comision => {
          // Buscar si existe formato para esta comisión + usuario
          const formatoExistente = formatos.find(f => 
            f.comision_id === comision.comision_id && 
            f.usuario_id === comision.usuario_id &&
            f.estado_emision !== 'ANULADO'
          );
          
          return {
            ...comision,
            numero_documento: formatoExistente?.numero_documento || '',  // 🆕 Agregar numero_documento
            monto: formatoExistente?.monto_total || comision.monto,  // 🆕 Usar monto_total del formato si existe
            formato_existente: formatoExistente || null,  // 🆕 Agregar info del formato
            tiene_formato: !!formatoExistente  // 🆕 Bandera para facilitar uso
          };
        });
        
        console.log(`✅ Formatos mapeados`);
      } catch (err) {
        console.warn('⚠️ No se pudo cargar formatos existentes:', err.message);
        // Continuar sin info de formatos
      }
      
      // Ordenar por: usuario_nombre (comisionado) y luego por fecha_salida (comisión)
      comisionesTransformadas.sort((a, b) => {
        // Primero ordenar por nombre del comisionado
        const compareComisionado = a.usuario_nombre.localeCompare(b.usuario_nombre);
        if (compareComisionado !== 0) return compareComisionado;
        
        // Si es el mismo comisionado, ordenar por fecha de la comisión
        return new Date(a.fecha_salida) - new Date(b.fecha_salida);
      });
      
      setComisiones(comisionesTransformadas);
    } catch (err) {
      setError(`Error al cargar comisiones: ${err.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudieron cargar las comisiones: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmitirFormato = async (row) => {
    console.log('🔵 handleEmitirFormato llamado');
    
    setSelectedComision(row.comision_completa);
    
    // Encontrar todos los comisionados con el mismo nombre (pueden tener múltiples partidas)
    const comisionadosDelUsuario = row.comision_completa.comisionados?.filter(
      c => c.usuario_nombre === row.usuario_nombre
    ) || [];
    
    // Agrupar si hay múltiples partidas
    let comisionadoAgrupado = comisionadosDelUsuario[0];
    if (comisionadosDelUsuario.length > 1) {
      comisionadoAgrupado = {
        ...comisionadosDelUsuario[0],
        // Preservar la observación (que ya incluye la de la comisión)
        observacion: comisionadosDelUsuario[0].observacion || '',
        // 🆕 AMBITO viene del USUARIO (comisionado), no de la comisión
        ambito_nombre: comisionadosDelUsuario[0].ambito_nombre || 'SIN DIRECCIÓN ASIGNADA',
        monto: comisionadosDelUsuario.reduce((sum, c) => sum + parseFloat(c.monto), 0),
        dias: comisionadosDelUsuario.reduce((sum, c) => sum + parseInt(c.dias), 0),
        // Lista de todas las partidas
        partidas: comisionadosDelUsuario.map(c => ({
          nombre: c.partida,
          clasificador_nombre: c.clasificador_nombre,
          dias: c.dias,
          monto: c.monto,
        })),
      };
    } else {
      // 🆕 Cuando hay un solo comisionado, asegurar que tiene ambito_nombre
      comisionadoAgrupado = {
        ...comisionadoAgrupado,
        ambito_nombre: comisionadoAgrupado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA',
      };
    }
    
    
    setSelectedRowComisionado(comisionadoAgrupado);
    
    // Abrir modal primero
    setOpenPreview(true);
    setPreviewLoading(true);
    setPdfPreviewUrl(null); // Limpiar URL anterior
    
    // Luego generar vista previa (sin await para no bloquear)
    setTimeout(() => {
      generarVistaPrevia(row.comision_completa, comisionadoAgrupado);
    }, 100);
  };

  const handleCerrarPreview = () => {
    setOpenPreview(false);
    setSelectedComision(null);
    setSelectedRowComisionado(null);
    setPdfPreviewUrl(null);
  };

  // 🆕 Funciones para crear formato de emisión
  const handleAbrirModalEmitirFormato = async (comisionadoData) => {
    // comisionadoData viene de la tabla con los datos de la comisión
    console.log('📋 Abriendo modal para emitir formato:', comisionadoData);
    
    try {
      // Obtener la comisión completa con TODOS los comisionados
      const comisionCompleta = await api.obtenerComision(comisionadoData.comision_id);
      console.log('🔄 Comisión completa cargada:', comisionCompleta);
      
      // Pre-cargar detalles SOLO del usuario logueado en esta comisión
      const detallesDelUsuarioLogueado = (comisionCompleta?.comisionados_detalle || [])
        .filter(cc => cc.usuario_id === usuarioLogueado?.id)
        .map(cc => ({
          id: Date.now() + Math.random(),
          clasificador_id: cc.clasificador_id || '',
          clasificador_nombre: cc.clasificador_nombre || 'N/A',
          usuario_id: cc.usuario_id || '',
          usuario_nombre: cc.usuario_nombre || 'N/A',
          dias: parseFloat(cc.dias) || 0,
          costo_xdia: parseFloat(cc.costo_xdia) || 0,
          monto: parseFloat(cc.monto) || ((parseFloat(cc.dias) || 0) * (parseFloat(cc.costo_xdia) || 0)),
          detalles_certificacion_credito_id: cc.detalles_certificacion_credito_id || null
        }));

      console.log('📊 Detalles del usuario logueado:', detallesDelUsuarioLogueado);
      setDetallesEditables(detallesDelUsuarioLogueado);

      // 🆕 Cargar clasificadores disponibles (TODOS los maestro, no solo los de la comisión)
      // Los clasificadores de la comisión son solo los usados, pero el usuario puede agregar más
      if (!clasificadoresDisponibles || clasificadoresDisponibles.length === 0) {
        try {
          const clasificadoresMaestro = await api.obtenerClasificadores();
          console.log('📚 Clasificadores maestro cargados:', clasificadoresMaestro);
          setClasificadoresDisponibles(clasificadoresMaestro || []);
        } catch (error) {
          console.error('Error al cargar clasificadores maestro:', error);
        }
      }
      
      // 🌍 Convertir fechas de UTC a zona horaria Perú
      // y establecer horas por defecto (08:00 salida, 18:00 retorno)
      const convertirFechaAlFormato = (fechaUTC, tipo = 'salida') => {
        if (!fechaUTC) return '';
        const fechaEnPeru = convertirAHorarioPerú(new Date(fechaUTC)); // Retorna YYYY-MM-DDTHH:mm
        
        // Extraer la fecha (YYYY-MM-DD)
        const fecha = fechaEnPeru.split('T')[0];
        
        // Establecer hora por defecto según el tipo
        const hora = tipo === 'salida' ? '08:00' : '18:00';
        
        return `${fecha}T${hora}`;
      };

      setFormValues({
        comision_id: comisionCompleta?.id || comisionadoData.comision_id,
        usuario_id: usuarioLogueado?.id || '',
        meta_id: comisionCompleta?.meta_id || '',  // 🆕 Pre-cargar meta_id de la comisión
        lugar: comisionCompleta?.lugar || comisionadoData.lugar || '',
        ruta: comisionCompleta?.ruta || comisionadoData.ruta || '',
        modalidad_viaje: comisionCompleta?.modalidad_viaje || comisionadoData.modalidad_viaje || '',
        fecha_salida: convertirFechaAlFormato(comisionCompleta?.fecha_salida || comisionadoData.fecha_salida, 'salida'),
        fecha_retorno: convertirFechaAlFormato(comisionCompleta?.fecha_retorno || comisionadoData.fecha_retorno, 'retorno'),
        num_dias: comisionCompleta?.num_dias || comisionadoData.dias || '',
        costo_viaje_id: comisionCompleta?.costo_viaje_id || '',
        tipo_emision: 'REEMBOLSO',
        numero_siaf: '',
        codigo_cp: '',
        costo_xdia: comisionCompleta?.costo_xdia || comisionadoData.costo_xdia || '',
        actividad_realizar: comisionCompleta?.observacion || comisionadoData.observacion || '',  // De la comisión
        observacion: comisionadoData.observacion || ''  // 🆕 Del comisionado específico
      });
      
      // ✅ LIMPIAR sessionStorage para modo CREACIÓN (no modificación)
      sessionStorage.removeItem('formatoEnModificacion');
      
      setComisionSeleccionadaParaFormato(comisionCompleta);
      setOpenCrearFormato(true);
    } catch (error) {
      console.error('❌ Error al cargar comisión completa:', error);
      Swal.fire('Error', 'No se pudo cargar los detalles de la comisión', 'error');
    }
  };

  // 🆕 Función para modificar un formato existente
  const handleAbrirModalModificarFormato = async (comisionadoData) => {
    console.log('✏️ Abriendo modal para MODIFICAR formato:', comisionadoData);
    
    try {
      // Cargar el formato existente
      const formatoExistente = comisionadoData.formato_existente;
      if (!formatoExistente || !formatoExistente.id) {
        Swal.fire('Error', 'No se encontró el formato para modificar', 'error');
        return;
      }

      console.log('📄 Formato a modificar:', formatoExistente);

      // Obtener detalles del formato
      const formatoCompleto = await api.obtenerFormatoEmisionPorId(formatoExistente.id);
      console.log('📋 Formato completo cargado:', formatoCompleto);

      // Cargar detalles del formato
      const detallesDelFormato = (formatoCompleto?.detalles || []).map(d => ({
        id: d.id || Date.now() + Math.random(),
        clasificador_id: d.clasificador_id || '',
        clasificador_nombre: d.clasificador_nombre || 'N/A',
        monto: parseFloat(d.monto) || 0,
        montoAnterior: parseFloat(d.monto) || 0,  // 🆕 Guardar el monto original para comparar cambios
        detalles_certificacion_credito_id: d.detalles_certificacion_credito_id || null
      }));

      console.log('📊 Detalles del formato:', detallesDelFormato);
      setDetallesEditables(detallesDelFormato);

      // Pre-cargar formulario con datos del formato
      // 🌍 Convertir fechas de UTC a zona horaria Perú
      const convertirFechaAlFormato = (fechaUTC) => {
        if (!fechaUTC) return '';
        return convertirAHorarioPerú(new Date(fechaUTC)); // Ya retorna formato YYYY-MM-DDTHH:mm
      };

      const nuevoFormValues = {
        comision_id: formatoExistente.comision_id || '',
        usuario_id: formatoExistente.usuario_id || '',
        meta_id: formatoExistente.meta_id || '',
        lugar: formatoExistente.lugar || '',
        ruta: formatoExistente.ruta || '',
        modalidad_viaje: formatoExistente.modalidad_viaje || '',
        fecha_salida: convertirFechaAlFormato(formatoExistente.fecha_salida),
        fecha_retorno: convertirFechaAlFormato(formatoExistente.fecha_retorno),
        num_dias: formatoExistente.num_dias || '',
        costo_viaje_id: formatoExistente.costo_viaje_id || '',
        tipo_emision: formatoExistente.tipo_emision || 'REEMBOLSO',
        numero_siaf: formatoExistente.numero_siaf || '',
        codigo_cp: formatoExistente.codigo_cp || '',
        costo_xdia: formatoExistente.costo_xdia || '',
        actividad_realizar: formatoExistente.actividad_realizar || '',  // 🆕 Cargar actividad_realizar
        observacion: formatoExistente.observacion || '',
        certificacion_id: formatoCompleto?.certificacion_id || ''  // 🆕 Cargar certificacion_id
      };
      
      setFormValues(nuevoFormValues);

      setComisionSeleccionadaParaFormato({ id: formatoExistente.comision_id });
      
      // ⚠️ NO cargar detalles del certificado en modo EDICIÓN
      // Ya cargamos los detalles reales del formato en línea 497
      // Solo seteamos detallesCertificacionSeleccionada para referencias, sin sobrescribir
      if (formatoCompleto?.certificacion_id) {
        console.log('� Certificado asociado al formato:', formatoCompleto.certificacion_id);
        // Solo cargar para mostrar info, pero sin sobrescribir detallesEditables
        try {
          const respuesta = await api.obtenerClasificadoresCertificacion(formatoCompleto.certificacion_id);
          let datosFormateados;
          if (Array.isArray(respuesta)) {
            datosFormateados = { detalles: respuesta };
          } else if (respuesta?.detalles) {
            datosFormateados = respuesta;
          } else {
            datosFormateados = { detalles: respuesta ? [respuesta] : [] };
          }
          setDetallesCertificacionSeleccionada(datosFormateados);
          console.log('✅ Detalles del certificado cargados (solo para referencia)');
        } catch (err) {
          console.warn('⚠️ No se pudo cargar detalles del certificado:', err);
        }
      }
      
      // 🆕 Marcar que estamos en modo modificación
      sessionStorage.setItem('formatoEnModificacion', formatoExistente.id);
      
      setOpenCrearFormato(true);
    } catch (error) {
      console.error('❌ Error al cargar formato existente:', error);
      Swal.fire('Error', `No se pudo cargar el formato: ${error.message}`, 'error');
    }
  };

  // 🔧 Manejo de detalles editables
  const handleChangeDetalle = (index, field, value) => {
    const nuevosDetalles = [...detallesEditables];
    const detalleAnterior = nuevosDetalles[index];
    const montoAnterior = detalleAnterior.montoAnterior || detalleAnterior.monto || 0;
    const montoActualEnEstado = detalleAnterior.monto || 0;
    
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      [field]: field === 'dias' || field === 'costo_xdia' ? parseFloat(value) || 0 : value
    };
    
    // Calcular monto automáticamente
    if (field === 'dias' || field === 'costo_xdia' || field === 'monto') {
      if (field === 'monto') {
        nuevosDetalles[index].monto = parseFloat(value) || 0;
      } else {
        nuevosDetalles[index].monto = (nuevosDetalles[index].dias || 0) * (nuevosDetalles[index].costo_xdia || 0);
      }
    }
    
    setDetallesEditables(nuevosDetalles);
    
    // 🔄 Rastrear cambios de monto para el clasificador seleccionado
    if ((field === 'monto' || field === 'dias' || field === 'costo_xdia') && clasificadorSeleccionado) {
      const montoNuevo = nuevosDetalles[index].monto;
      // La diferencia es: (montoNuevo - montoAnterior original), NO la suma de cambios intermedios
      const diferenciaNeta = montoNuevo - montoAnterior;
      const clasificadorId = nuevosDetalles[index].clasificador_id;
      
      // Reemplazar completamente el cambio para este detalle (no acumular)
      setCambiosPendientesMonto(prev => {
        // Obtener el cambio anterior para este clasificador
        const cambioAnterior = prev[clasificadorId] || 0;
        // Calcular qué se había sumado de este detalle específico antes
        const cambioAnteriorDeEsteDetalle = (prev[`_detalle_${index}`] || 0);
        // Nueva diferencia neta es: cambioAnterior - lo que se sumó de este detalle + lo nuevo
        const nuevoTotal = cambioAnterior - cambioAnteriorDeEsteDetalle + diferenciaNeta;
        
        return {
          ...prev,
          [clasificadorId]: nuevoTotal,
          [`_detalle_${index}`]: diferenciaNeta  // Guardar el cambio de este detalle para la próxima iteración
        };
      });
      
      console.log(`💰 Cambio de monto - Clasificador: ${clasificadorId}, Anterior original: ${montoAnterior}, Nuevo: ${montoNuevo}, Diferencia neta: ${diferenciaNeta}`);
    }
  };

  const handleAgregarDetalle = () => {
    setDetallesEditables([
      ...detallesEditables,
      {
        id: Date.now(),
        clasificador_id: '',
        clasificador_nombre: '',
        usuario_id: '',
        usuario_nombre: '',
        dias: 0,
        costo_xdia: 0,
        monto: 0,
        detalles_certificacion_credito_id: null
      }
    ]);
  };

  const handleEliminarDetalle = (index) => {
    setDetallesEditables(detallesEditables.filter((_, i) => i !== index));
  };

  // 💰 Calcular monto utilizado actual del clasificador seleccionado
  // Incluye los cambios pendientes que el usuario está haciendo
  const calcularMontoUtilizadoActual = () => {
    if (!clasificadorSeleccionado) return 0;
    
    const montoServidor = parseFloat(clasificadorSeleccionado.monto_utilizado || 0);
    const cambiosDelClasificador = cambiosPendientesMonto[clasificadorSeleccionado.clasificador_id] || 0;
    
    return montoServidor + cambiosDelClasificador;
  };

  const handleCerrarCrearFormato = () => {
    // ✅ Limpiar sessionStorage al cerrar
    sessionStorage.removeItem('formatoEnModificacion');
    
    setOpenCrearFormato(false);
    setComisionSeleccionadaParaFormato(null);
    setDetallesEditables([]);
    setClasificadorSeleccionado(null);  // 🔄 Limpiar clasificador seleccionado
    setDetallesCertificacionSeleccionada(null);  // 🔄 Limpiar detalles
    setCambiosPendientesMonto({});  // 🔄 Limpiar cambios pendientes
    setFormValues({
      comision_id: '',
      usuario_id: '',
      meta_id: '',  // 🆕 Reset META
      lugar: '',
      ruta: '',
      modalidad_viaje: '',
      fecha_salida: '',
      fecha_retorno: '',
      num_dias: '',
      costo_viaje_id: '',
      tipo_emision: 'REEMBOLSO',
      numero_siaf: '',
      codigo_cp: '',
      costo_xdia: '',
      actividad_realizar: '',  // 🆕 Reset ACTIVIDAD A REALIZAR
      observacion: ''
    });
  };

  const handleChangeFormato = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCrearFormatoEmision = async () => {
    try {
      if (!formValues.comision_id || !formValues.usuario_id) {
        Swal.fire('Error', 'Faltan datos de comisión', 'error');
        return;
      }

      if (detallesEditables.length === 0) {
        Swal.fire('Advertencia', 'Debe agregar al menos un detalle', 'warning');
        return;
      }

      // 🆕 VALIDACIÓN: Verificar si estamos en modo modificación
      const formatoEnModificacion = sessionStorage.getItem('formatoEnModificacion');
      const esModificacion = !!formatoEnModificacion;

      // Solo verificar si es creación, no si es modificación
      if (!esModificacion) {
        try {
          const formatosExistentes = await api.obtenerFormatosEmisiones({
            comision_id: formValues.comision_id
          });

          if (formatosExistentes.formatos && formatosExistentes.formatos.length > 0) {
            // Filtrar solo los que no están anulados
            const formatoActivo = formatosExistentes.formatos.find(f => f.estado_emision !== 'ANULADO');
            
            if (formatoActivo) {
              Swal.fire({
                icon: 'warning',
                title: '⚠️ Formato ya existe',
                html: `<div style="text-align: left;">
                  <p><strong>Ya existe un formato de emisión para esta comisión:</strong></p>
                  <p>📄 <strong>Número:</strong> ${formatoActivo.numero_documento}</p>
                  <p>👤 <strong>Usuario:</strong> ${formatoActivo.usuario_nombre}</p>
                  <p>📅 <strong>Fecha:</strong> ${new Date(formatoActivo.fecha_emision).toLocaleDateString('es-ES')}</p>
                  <p>🔗 <strong>Estado:</strong> ${formatoActivo.estado_emision}</p>
                  <hr>
                  <p><strong style="color: #d32f2f;">No puedes crear otro formato para la misma comisión.</strong></p>
                  <p>Si necesitas actualizar, usa el botón "Modificar" o contacta al administrador.</p>
                </div>`,
                confirmButtonColor: '#f39c12'
              });
              return;
            }
          }
        } catch (err) {
          console.warn('⚠️ No se pudo validar formatos existentes:', err);
          // Continuar de todas formas, el backend hará la validación
        }
      }

      // 🔧 VALIDACIÓN: Verificar saldo disponible en cada clasificador
      if (formValues.certificacion_id && detallesCertificacionSeleccionada?.detalles) {
        let errorSaldo = false;
        let mensajeError = '';

        for (const detalle of detallesEditables) {
          // Buscar el clasificador en los detalles del certificado
          const clasificadorEnCert = detallesCertificacionSeleccionada.detalles.find(
            c => c?.id?.toString() === detalle.clasificador_id?.toString() ||
                 c?.clasificador_id?.toString() === detalle.clasificador_id?.toString()
          );

          if (!clasificadorEnCert) {
            // Si el clasificador no está en el certificado, es un error
            errorSaldo = true;
            mensajeError = `El clasificador "${detalle.clasificador_nombre}" no está disponible en la certificación seleccionada.`;
            break;
          }

          // Calcular saldo disponible: monto total - monto ya usado
          const montoDisponible = parseFloat(clasificadorEnCert.monto || 0) - parseFloat(clasificadorEnCert.monto_utilizado || 0);
          
          // 🆕 Si el detalle tiene montoAnterior, es editación - validar solo la diferencia
          const montoAnterior = detalle.montoAnterior || 0;
          const montoIngresado = parseFloat(detalle.monto || 0);
          const diferencia = montoIngresado - montoAnterior;

          console.log(`🔍 Validando "${detalle.clasificador_nombre}": Disponible: S/. ${montoDisponible.toFixed(2)}, Anterior: S/. ${montoAnterior.toFixed(2)}, Ingresado: S/. ${montoIngresado.toFixed(2)}, Diferencia: S/. ${diferencia.toFixed(2)}`);

          // Validar contra la diferencia (no el monto total) si es edición
          if (diferencia > montoDisponible) {
            errorSaldo = true;
            mensajeError = `❌ Saldo insuficiente en "${detalle.clasificador_nombre}"\n\nDisponible: S/. ${montoDisponible.toFixed(2)}\nIntentando usar adicional: S/. ${diferencia.toFixed(2)}\n\nDificit: S/. ${(diferencia - montoDisponible).toFixed(2)}`;
            break;
          }
        }

        if (errorSaldo) {
          Swal.fire({
            icon: 'error',
            title: '⚠️ Saldo insuficiente',
            html: mensajeError.replace(/\n/g, '<br>'),
            confirmButtonColor: '#d32f2f'
          });
          return;
        }
      }

      setCreatingFormato(true);

      // Preparar datos del formato
      const datosFormato = {
        comision_id: parseInt(formValues.comision_id),
        usuario_id: parseInt(formValues.usuario_id),
        costo_viaje_id: formValues.costo_viaje_id ? parseInt(formValues.costo_viaje_id) : null,
        meta_id: formValues.meta_id ? parseInt(formValues.meta_id) : null,  // 🆕 META
        certificacion_id: formValues.certificacion_id ? parseInt(formValues.certificacion_id) : null,  // 🆕 CERTIFICACIÓN
        numero_documento: esModificacion ? undefined : `EF-${new Date().getFullYear()}-${Math.random().toString().slice(2, 7)}`,
        fecha_emision: esModificacion ? undefined : obtenerFechaEmisionPerú(),  // ✅ AHORA: Usa zona horaria de Perú
        lugar: formValues.lugar,
        ruta: formValues.ruta,
        modalidad_viaje: formValues.modalidad_viaje,
        fecha_salida: formValues.fecha_salida,
        fecha_retorno: formValues.fecha_retorno,
        num_dias: parseInt(formValues.num_dias),
        numero_siaf: formValues.numero_siaf || null,
        codigo_cp: formValues.codigo_cp || null,
        tipo_emision: formValues.tipo_emision,
        costo_xdia: parseFloat(formValues.costo_xdia),
        monto_total: detallesEditables.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0),
        actividad_realizar: formValues.actividad_realizar,  // 🆕 ACTIVIDAD A REALIZAR
        observacion: formValues.observacion,
        detalles: detallesEditables.map(d => ({
          clasificador_id: d.clasificador_id,
          monto: parseFloat(d.monto || 0),
          detalles_certificacion_credito_id: d.detalles_certificacion_credito_id
        }))
      };

      console.log(`📤 ${esModificacion ? 'Actualizando' : 'Creando'} formato con detalles:`, datosFormato);
      console.log('📋 Detalles a enviar:');
      datosFormato.detalles.forEach((d, idx) => {
        console.log(`   [${idx}]`, d);
      });

      let response;
      if (esModificacion) {
        // 🆕 Actualizar formato existente
        response = await api.actualizarFormatoEmision(formatoEnModificacion, datosFormato);
        console.log('✅ Formato actualizado:', response);
        
        // Limpiar el session storage
        sessionStorage.removeItem('formatoEnModificacion');
        
        Swal.fire('Éxito', `Formato actualizado exitosamente`, 'success');
      } else {
        // Crear nuevo formato
        response = await api.crearFormatoEmision(datosFormato);
        console.log('✅ Formato creado:', response);
        
        Swal.fire('Éxito', `Formato creado exitosamente: ${response.numero_documento || 'N/A'}`, 'success');
      }
      
      handleCerrarCrearFormato();
      cargarComisiones(); // Recargar la lista
    } catch (error) {
      console.error('Error al crear formato:', error);
      Swal.fire('Error', error.message || 'No se pudo crear el formato', 'error');
    } finally {
      setCreatingFormato(false);
    }
  };

  // Función auxiliar para cargar el logo
  const cargarLogo = async () => {
    try {
      const logoResponse = await fetch('/ANA.png');
      if (!logoResponse.ok) throw new Error('No se pudo cargar el logo');
      const logoBlob = await logoResponse.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(logoBlob);
      });
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error);
      return null;
    }
  };

  const generarVistaPrevia = async (comision, comisionado) => {
    console.log('🔵 Generando vista previa con jsPDF...');
    
    try {
      setPreviewLoading(true);

      const totalMonto = parseFloat(comisionado.monto || 0);
      // Solo contar días del clasificador 23.2.1.2.2 (VIÁTICOS Y ASIGNACIONES)
      let totalDias = 0;
      if (comisionado.partidas && comisionado.partidas.length > 0) {
        totalDias = comisionado.partidas
          .filter(p => p.nombre && p.nombre.startsWith('23.2.1.2.2'))
          .reduce((sum, p) => sum + parseInt(p.dias || 0, 10), 0);
      } else if (comisionado.partida && comisionado.partida.startsWith('23.2.1.2.2')) {
        totalDias = parseInt(comisionado.dias || 0, 10);
      }
      
      // Construir observación final: usar la observación del comisionado (que ya incluye la de la comisión)
      let observacionFinal = comisionado.observacion || '';
      
      const fechaSalida = new Date(comision.fecha_salida).toLocaleDateString('es-ES');
      const fechaRetorno = new Date(comision.fecha_retorno).toLocaleDateString('es-ES');
      const fechaSalidaObj = new Date(comision.fecha_salida);
      const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      const periodo = `${meses[fechaSalidaObj.getMonth()]} ${fechaSalidaObj.getFullYear()}`;
      const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';
      console.log('📍 [generarVistaPrevia] comisionado:', comisionado);
      console.log('📍 [generarVistaPrevia] ambitoDelUsuario:', ambitoDelUsuario);

      // Crear documento PDF en landscape
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      let yPosition = margin;

      // Cargar logo
      let logoBase64 = null;
      try {
        // 🆕 Cargar logo desde public/
        const logoResponse = await fetch(process.env.PUBLIC_URL + '/ANA.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(logoBlob);
          });
          console.log('✅ Logo cargado correctamente');
        } else {
          console.warn('⚠️ No se pudo cargar el logo - respuesta:', logoResponse.status);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo cargar el logo:', error);
      }

      // Encabezado dividido en 3 columnas: izquierda (20%), centro (60%), derecha (20%)
      const logoY = yPosition;
      const colWidth = pageWidth / 5; // Para dividir en 5 partes (20%, 60%, 20% = 5 partes de 20%)
      
      // COLUMNA IZQUIERDA: Logo + Ámbito - LOGO CENTRADO
      const logoSizelago = 38; // Logo ancho (no cambiar)
      const logoSize = 19; // Logo alto
      const leftColX = margin + colWidth / 2 - (logoSizelago / 2); // Centrar el logo de 38mm de ancho
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', leftColX, logoY, logoSizelago, logoSize);
      }

      // Información debajo del logo - con más espacio
      const infoLeftX = margin + colWidth / 2;
      const textBelowLogoY = logoY + logoSize + 3; // Espacio después del logo
      doc.setFontSize(6.5);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(ambitoDelUsuario, infoLeftX, textBelowLogoY, { maxWidth: colWidth * 1.5, align: 'center' });
      
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.text('Oficina de Administración', infoLeftX, textBelowLogoY + 3.5, { maxWidth: colWidth * 1.5, align: 'center' });
      
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.text('Unidad de Recursos Humanos', infoLeftX, textBelowLogoY + 7, { maxWidth: colWidth * 1.5, align: 'center' });

      // COLUMNA CENTRAL: Títulos (60%) - Debajo de "Unidad de Recursos Humanos"
      const centerColX = pageWidth / 2;
      const titleStartY = textBelowLogoY + 11; // Debajo del último texto
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0); // Negro
      doc.setFont(undefined, 'bold');
      doc.text('ANEXO N° 01', centerColX, titleStartY, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS', centerColX, titleStartY + 8, { align: 'center', maxWidth: colWidth * 3 - 4 });

      yPosition = titleStartY + 16;

      // Sección de información: DIRECCIÓN a la izquierda, PERÍODO a la derecha
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      // DIRECCIÓN / OFICINA a la izquierda
      doc.text(`DIRECCIÓN / OFICINA: ${ambitoDelUsuario}`, margin, yPosition);
      
      // PERÍODO a la derecha
      doc.text(`PERÍODO: ${periodo}`, pageWidth - margin, yPosition, { align: 'right' });
      
      yPosition += 8;
      
      // PROYECTO / CONVENIO debajo de DIRECCIÓN
      doc.text(`PROYECTO / CONVENIO: ${comision.meta_nombre || 'N/A'}`, margin, yPosition);

      yPosition += 10;

      // Tabla con colspan y rowspan - mejorada para ocupar todo el ancho
      const usableWidth = pageWidth - (margin * 2);
      const columnWidths = [45, 28, 65, 25, 18, 22, 22, usableWidth - (45 + 28 + 65 + 25 + 18 + 22 + 22)];
      
      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 89, 152], // Azul más profesional
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          padding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          padding: 3.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        head: [
          [
            { content: 'TRABAJADOR\nCOMISIONADO', rowSpan: 2 },
            { content: 'CARGO', rowSpan: 2 },
            { content: 'ACTIVIDAD\nA REALIZAR', rowSpan: 2 },
            { content: 'COMISIÓN', colSpan: 2 },
            { content: 'FECHA\nSALIDA', rowSpan: 2 },
            { content: 'FECHA\nRETORNO', rowSpan: 2 },
            { content: 'OBSERVACIÓN', rowSpan: 2 }
          ],
          [
            { content: 'LUGAR', halign: 'center' },
            { content: 'N° DÍAS/HORA', halign: 'center' }
          ]
        ],
        body: [
          [
            { content: comisionado.usuario_nombre || '', halign: 'left' },
            { content: comisionado.cargo_nombre || '', halign: 'center' },
            { content: comision.observacion || '', halign: 'left' },
            { content: comision.lugar || '', halign: 'center' },
            { content: totalDias.toString(), halign: 'center' },
            { content: fechaSalida, halign: 'center' },
            { content: fechaRetorno, halign: 'center' },
            { content: observacionFinal || '', halign: 'left' }
          ]
        ],
        columnStyles: {
          0: { cellWidth: columnWidths[0] },
          1: { cellWidth: columnWidths[1] },
          2: { cellWidth: columnWidths[2] },
          3: { cellWidth: columnWidths[3] },
          4: { cellWidth: columnWidths[4] },
          5: { cellWidth: columnWidths[5] },
          6: { cellWidth: columnWidths[6] },
          7: { cellWidth: columnWidths[7] }
        }
      });

      // Obtener la Y final de la tabla
      const finalY = doc.lastAutoTable?.finalY || yPosition + 30;

      // Timestamp a la izquierda, antes de la firma
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      const fechaCreacion = formatoCompleto?.fecha_emision ? new Date(formatoCompleto.fecha_emision) : new Date();
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const mesesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const fechaFormato = `${diasSemana[fechaCreacion.getDay()]}, ${fechaCreacion.getDate()} de ${mesesNombre[fechaCreacion.getMonth()]} del ${fechaCreacion.getFullYear()} a las ${fechaCreacion.toLocaleTimeString('es-ES')}`;
      const timestampY = pageHeight - margin - 15;
      doc.text(
        fechaFormato,
        margin,
        timestampY,
        { align: 'left' }
      );

      // Firma en el centro, debajo de la fecha
      const firmaY = pageHeight - margin - 5;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
      doc.line(pageWidth / 2 - 35, firmaY, pageWidth / 2 + 35, firmaY);
      
      doc.setFont(undefined, 'bold');
      doc.text('FIRMA DEL JEFE O DIRECTOR', pageWidth / 2, firmaY + 5, { align: 'center' });

      // 🆕 Agregar Anexo 02 (Presupuesto) a la vista previa
      await generarAnexo02(doc, comision, comisionado, logoBase64);

      // Convertir PDF a blob y crear URL
      console.log('✅ PDF generado, creando URL...');
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      console.log('✅ URL creada:', pdfUrl);
      setPdfPreviewUrl(pdfUrl);
      setPreviewLoading(false);

    } catch (error) {
      console.error('❌ Error generando vista previa:', error);
      setPreviewLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo generar la vista previa: ${error.message}`,
      });
    }
  };

  const generarAnexo02 = async (doc, comision, comisionado, logoBase64, formatoCompleto = null) => {
    /**
     * ANEXO 02: PRESUPUESTO DEL COSTO DE LA ACTIVIDAD PARA COMISIÓN DE SERVICIOS
     * Formato: VERTICAL (Portrait) - Estructura completa según guía
     * 
     * Si se proporciona formatoCompleto, usa datos del formato emitido en lugar de los datos generales
     */
    
    // 🆕 NO agregar página aquí - dejar que jsPDF maneje automáticamente nuevas páginas según el contenido
    // doc.addPage('a4', 'p');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;  // 🆕 Ancho disponible respetando márgenes
    let yPosition = margin;

    // 🆕 AMBITO viene del USUARIO (comisionado), no de la comisión
    const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';
    console.log('📍 [generarAnexo02] comisionado:', comisionado);
    console.log('📍 [generarAnexo02] ambitoDelUsuario:', ambitoDelUsuario);
    console.log('📊 [generarAnexo02] formatoCompleto (COMPLETO):', JSON.stringify(formatoCompleto, null, 2));

    // ===== HEADER CON LOGO Y TÍTULOS =====
    const logoY = yPosition;
    const colWidth = pageWidth / 5;
    const logoSizelago = 30;
    const logoSize = 15;
    const leftColX = margin + colWidth / 2 - (logoSizelago / 2);
    
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', leftColX, logoY, logoSizelago, logoSize);
    }

    const infoLeftX = margin + colWidth / 2;
    const textBelowLogoY = logoY + logoSize + 2;
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Arial', 'bold');
    doc.text(ambitoDelUsuario, infoLeftX, textBelowLogoY, { maxWidth: colWidth * 1.5, align: 'center' });
    
    doc.setFontSize(5);
    doc.setFont('Arial', 'normal');
    doc.text('Oficina de Administración', infoLeftX, textBelowLogoY + 2.5, { maxWidth: colWidth * 1.5, align: 'center' });
    doc.text('Unidad de Recursos Humanos', infoLeftX, textBelowLogoY + 5, { maxWidth: colWidth * 1.5, align: 'center' });

    const titleStartY = textBelowLogoY + 7;
    
    // ===== TABLA DE TÍTULOS Y SIAF ENCARGO (Dos filas con colspan) =====
    const numeroDocumento = `N°${formatoCompleto?.numero_documento || 'SIN NÚMERO'}`;  // 🆕 Usar numero_documento del formato con N°
    const titleTableData = [
      [
        { content: `ANEXO N° 02\nPRESUPUESTO DEL COSTO DE LA ACTIVIDAD\nPARA COMISIÓN DE SERVICIOS\n${numeroDocumento}`, colSpan: 3, styles: { fontSize: 12, fontStyle: 'bold', halign: 'center', valign: 'middle', textColor: [0, 0, 0] } }
      ],
      [
        { content: '', styles: { fontSize: 10, halign: 'center' } },
        { content: 'SIAF ENCARGO:', styles: { fontSize: 10, halign: 'right', valign: 'middle', textColor: [0, 0, 0] } },
        { content: '', styles: { fontSize: 10, halign: 'center', valign: 'middle' } }
      ]
    ];

    autoTable(doc, {
      startY: titleStartY,
      margin: margin,
      theme: 'plain',
      body: titleTableData,
      columnStyles: {
        0: { cellWidth: pageWidth / 2 - margin - 18 },
        1: { cellWidth: pageWidth / 2 - margin - 20 },
        2: { cellWidth: 35 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 2.5,
        valign: 'middle'
      },
      didDrawCell: (data) => {
        // Solo dibuja borde en la tercera columna de la segunda fila (índice 2 del row 1)
        if (data.row.index === 1 && data.column.index === 2) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      }
    });

    yPosition = doc.lastAutoTable?.finalY || titleStartY + 35;
    yPosition += 1;

    // ===== INFORMACIÓN GENERAL (Campos 1-8) CON TABLA =====
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Arial', 'normal');
    
    // 🆕 Usar datos del formatoCompleto si está disponible
    const fechaSalidaObj = new Date(formatoCompleto?.fecha_salida || comision.fecha_salida);
    const fechaRetornoObj = new Date(formatoCompleto?.fecha_retorno || comision.fecha_retorno);
    
    const fechaSalida = fechaSalidaObj.toLocaleDateString('es-ES');
    const horaSalida = fechaSalidaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const fechaRetorno = fechaRetornoObj.toLocaleDateString('es-ES');
    const horaRetorno = fechaRetornoObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const ruta = formatoCompleto?.ruta || comision.ruta || '';
    const actividad_realizar_anexo02 = formatoCompleto?.actividad_realizar || comision.observacion || '';  // 🆕 ACTIVIDAD A REALIZAR
    const observacion = formatoCompleto?.observacion || '';  // 🆕 Solo notas adicionales
    
    // Calcular cantidad de días con la misma lógica (solo clasificador 23.2.1.2.2)
    let totalDias = formatoCompleto?.num_dias || 0;
    if (totalDias === 0) {
      if (comisionado.partidas && comisionado.partidas.length > 0) {
        totalDias = comisionado.partidas
          .filter(p => p.nombre && p.nombre.startsWith('23.2.1.2.2'))
          .reduce((sum, p) => sum + parseInt(p.dias || 0, 10), 0);
      } else if (comisionado.partida && comisionado.partida.startsWith('23.2.1.2.2')) {
        totalDias = parseInt(comisionado.dias || 0, 10);
      }
    }
    
    // Datos de la comisión con horarios en tabla (4 columnas)
    const infoData = [
      [{ content: '1. Nombre y apellidos', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: comisionado.usuario_nombre || '', colSpan: 4, styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: '2. Dependencia', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: ambitoDelUsuario, colSpan: 4, styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: '3. Cargo', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: comisionado.cargo_nombre || '', colSpan: 4, styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: '4. Itinerario', styles: { fontSize: 10, fontStyle: 'bold', halign: 'left', padding: 0 } }, { content: 'RUTA', colSpan: 4, styles: { fontSize: 10, halign: 'center', valign: 'top', lineColor: [0, 0, 0], lineWidth: 0.3, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: '', styles: { fontSize: 10, padding: 0 } }, { content: ruta, colSpan: 4, styles: { fontSize: 10, halign: 'center', valign: 'top', lineColor: [0, 0, 0], lineWidth: 0.3, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: '5. Objetivo de la comisión', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: actividad_realizar_anexo02, colSpan: 4, styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],  // 🆕 ACTIVIDAD A REALIZAR
      [{ content: '6. Cantidad de días', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: totalDias.toString(), styles: { fontSize: 10, halign: 'center', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: '7. Fecha de salida', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: fechaSalida, styles: { fontSize: 10, halign: 'center', valign: 'bottom', padding: 0 } }, { content: 'Hora de salida', styles: { fontSize: 10, fontStyle: 'bold', halign: 'right', padding: 0 } }, { content: horaSalida, styles: { fontSize: 10, halign: 'center', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, halign: 'center',  padding: 0 } }],
      [{ content: '8. Fecha de regreso', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: fechaRetorno, styles: { fontSize: 10, halign: 'center', valign: 'bottom', padding: 0 } }, { content: 'Hora de regreso', styles: { fontSize: 10, fontStyle: 'bold', halign: 'right', padding: 0 } }, { content: horaRetorno, styles: { fontSize: 10, halign: 'center', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, halign: 'center',  padding: 0 } }],
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: infoData,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: usableWidth - 50 - 30 - 40 - 30 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 0,
        valign: 'top',
        lineHeightFactor: 0.5,
        cellPadding: 0.5
      },
      didDrawCell: (data) => {
        // Dibujar borde fino en RUTA (filas 3 y 4, columna 1)
        if ((data.row.index === 3 || data.row.index === 4) && data.column.index === 1) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
        // Dibujar línea inferior en Cantidad de días (fila 6, columna 1)
        if (data.row.index === 6 && data.column.index === 1) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          const bottomY = data.cell.y + data.cell.height;
          doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
        }
        // Dibujar línea inferior en Fecha de salida y Fecha de regreso (filas 7 y 8, columnas 1 y 3)
        if ((data.row.index === 7 || data.row.index === 8) && (data.column.index === 1 || data.column.index === 3)) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          const bottomY = data.cell.y + data.cell.height;
          doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
        }
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 28;
    yPosition += 1;

    // ===== TABLA DE GASTOS ESTIMADOS (Campo 9) =====
    const gastosTableData = [
      [{ content: '9. Estimado de gastos:', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }]
    ];

    let totalMonto = 0;
    
    // Obtener detalles de gastos desde formatoCompleto.detalles
    const detallesEmision = formatoCompleto?.detalles || [];
    console.log('📊 [generarAnexo02] detallesEmision:', detallesEmision);
    
    // Partidas específicas (con espacios como en la BD)
    const partida_a = '23. 2 1. 2 1'; // Pasaje y transporte
    const partida_b = '23. 2 1. 2 2'; // Viáticos
    const partida_d = '23. 1 3. 1 1'; // Combustible
    
    // Calcular montos según la partida
    const monto_a = detallesEmision
      .filter(d => d.partida === partida_a)
      .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    
    const monto_b = detallesEmision
      .filter(d => d.partida === partida_b)
      .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    
    const monto_d = detallesEmision
      .filter(d => d.partida === partida_d)
      .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    
    // Monto e) es la suma de las demás partidas (excepto a, b, c, d)
    const partidas_conocidas = [partida_a, partida_b, partida_d];
    const monto_e = detallesEmision
      .filter(d => !partidas_conocidas.includes(d.partida))
      .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    
    console.log('💰 [generarAnexo02] Montos calculados - a:', monto_a, 'b:', monto_b, 'd:', monto_d, 'e:', monto_e);
    
    // Desglose de gastos según estructura estándar
    const modalidadViaje = formatoCompleto?.modalidad_viaje || 'TERRESTRE';
    const numDias = parseInt(formatoCompleto?.num_dias || 1);
    // Costo por día = monto de viáticos / número de días
    const costoPorDia = numDias > 0 ? (monto_b / numDias) : 0;
    
    const conceptosGastos = [
      { concepto: `    a). Pasaje y gasto de transporte (${modalidadViaje})`, monto: monto_a },
      { concepto: '    b). Viáticos y asignaciones', monto: monto_b },
      { concepto: '    c). Tarifa Corpac', monto: 0 },
      { concepto: '    d). Combustible y carburantes', monto: monto_d },
      { concepto: '    e). Otros gastos', monto: monto_e }
    ];

    // Agregar filas de gastos
    conceptosGastos.forEach((gasto, index) => {
      totalMonto += gasto.monto;
      
      // Si es el concepto b) (Viáticos), agregar costo por día en columnas 3-4
      if (index === 1) {
        gastosTableData.push([
          { content: gasto.concepto, colSpan: 2, styles: { fontSize: 10, halign: 'left', padding: 0 } },
          { content: 'costo por día', styles: { fontSize: 10, halign: 'right', padding: 0 } },
          { content: `${costoPorDia.toFixed(2)}`, styles: { fontSize: 10, halign: 'center', padding: 0 } },
          { content: 'S/.', styles: { fontSize: 10, halign: 'center', padding: 0 } },
          { content: `${gasto.monto.toFixed(2)}`, styles: { fontSize: 10, halign: 'right', padding: 0 } }
        ]);
      } else {
        // Otros conceptos sin costo por día
        const cellStyle = { fontSize: 10, halign: 'left', padding: 0 };
        
        gastosTableData.push([
          { content: gasto.concepto, colSpan: 4, styles: cellStyle },
          { content: 'S/.', styles: { fontSize: 10, halign: 'center', padding: 0 } },
          { content: `${gasto.monto.toFixed(2)}`, styles: { fontSize: 10, halign: 'right', padding: 0 } }
        ]);
      }
    });

    // Agregar fila de total
    gastosTableData.push([
      { content: 'Total Presupuestal o Costo Actividad', colSpan: 4, styles: { fontSize: 10, fontStyle: 'bold', halign: 'left', padding: 0, fillColor: [200, 200, 200], lineLeft: { width: 2, color: [100, 100, 100] } } },
      { content: 'S/.', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } },
      { content: `${totalMonto.toFixed(2)}`, styles: { fontSize: 10, fontStyle: 'bold', halign: 'right', padding: 0, fillColor: [200, 200, 200] } }
    ]);

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: gastosTableData,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 12 },
        5: { cellWidth: usableWidth - 50 - 30 - 40 - 30 - 12 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 0,
        valign: 'top',
        lineHeightFactor: 0.5,
        cellPadding: 0.5
      },
      didDrawCell: (data) => {
        const isLastRow = data.row.index === gastosTableData.length - 1;
        const isFirstRow = data.row.index === 0;
        
        // La fila b) está en el índice 2
        const isBRow = data.row.index === 2;
        
        // Dibujar línea inferior SOLO en el monto (columna 5) de conceptos normales (excepto b)
        if (!isFirstRow && !isLastRow && !isBRow && data.column.index === 5) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          const bottomY = data.cell.y + data.cell.height;
          doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
        }
        
        // Para la fila b) (índice 2) - dibujar línea SOLO en columnas 3 y 5 (valores numéricos)
        if (isBRow && (data.column.index === 3 || data.column.index === 5)) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          const bottomY = data.cell.y + data.cell.height;
          doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
        }
        
        // Dibujar cuadro completo en la fila de Total (última fila)
        if (isLastRow) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          
          // Dibujar borde superior
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
          // Dibujar borde inferior
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          
          // Dibujar borde izquierdo solo en la primera celda
          if (data.column.index === 0) {
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          }
          
          // Dibujar borde derecho solo en la última columna (índice 5)
          if (data.column.index === 5) {
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 35;
    yPosition += 1;

    // ===== OBTENER DATOS DE AFECTACIÓN PRESUPUESTAL =====
    let metaInfo = comision.meta_nombre || '';
    let fuenteFinanciamientoInfo = '';
    
    try {
      // Obtener información de Meta (numero_meta - nombre)
      if (formatoCompleto?.meta_id) {
        try {
          const metaData = await api.obtenerMeta(formatoCompleto.meta_id);
          metaInfo = `${metaData.numero_meta} - ${metaData.nombre}`;
          console.log('✅ Meta cargada:', metaInfo);
        } catch (error) {
          console.warn('⚠️ No se pudo cargar meta:', error);
          metaInfo = comision.meta_nombre || '';
        }
      }
      
      // Obtener información de Fuente de Financiamiento
      if (formatoCompleto?.certificacion_id) {
        try {
          // Obtener certificación para conseguir fuente_financiamiento_id
          const certificacion = await api.obtenerCertificacionCreditoPorId(formatoCompleto.certificacion_id);
          console.log('📋 Certificación cargada:', certificacion);
          if (certificacion?.fuente_financiamiento_id) {
            // Obtener fuente de financiamiento
            const fuenteData = await api.obtenerFuenteFinanciamiento(certificacion.fuente_financiamiento_id);
            fuenteFinanciamientoInfo = `${fuenteData.abreviatura || ''} - ${fuenteData.nombre || ''}`.trim();
            console.log('💰 Fuente de financiamiento cargada:', fuenteFinanciamientoInfo);
          }
        } catch (error) {
          console.warn('⚠️ No se pudo cargar fuente de financiamiento:', error);
          fuenteFinanciamientoInfo = '';
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al cargar datos de afectación presupuestal:', error);
    }

    // ===== AFECTACIÓN PRESUPUESTAL (Campo 10) =====
    const presupuestTableData = [
      [{ content: '10. Afectación presupuestal', colSpan: 2, styles: { fontSize: 10, fontStyle: 'bold', halign: 'left', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Fuente de financiamiento', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: fuenteFinanciamientoInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Programa', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: '', styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Subprograma', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: '', styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Actividad / Proyecto', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: '', styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Componente', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: '', styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Meta', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: metaInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }]
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: presupuestTableData,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: usableWidth - 50 - 5 },
        2: { cellWidth: 5 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 0,
        valign: 'top',
        lineHeightFactor: 0.5,
        cellPadding: 0.5
      },
      didDrawCell: (data) => {
        // Dibujar bordes completos alrededor de cada fila de datos (excepto la fila de encabezado)
        if (data.row.index > 0) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          
          // Dibujar rectángulo completo alrededor de cada fila
          // Solo en la primera columna (index 0) para no repetir líneas
          if (data.column.index === 0) {
            const rowWidth = data.table.columns.reduce((sum, col) => sum + col.width, 0);
            doc.rect(cellX, cellY, rowWidth, cellHeight);
          }
          
          // Dibujar línea vertical entre columna 0 (etiqueta) y columna 1 (valor)
          if (data.column.index === 1) {
            // Línea en el lado izquierdo de la columna del valor
            doc.line(cellX, cellY, cellX, cellY + cellHeight);
          }
        }
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 28;
    yPosition += 1;

    // ===== TABLA DE CLASIFICADORES (DE FORMATO_EMISIONES_DETALLES) =====
    let clasificadoresData = [];

    try {
      // Obtener detalles del formato desde formatoCompleto.detalles
      if (formatoCompleto?.detalles && Array.isArray(formatoCompleto.detalles) && formatoCompleto.detalles.length > 0) {
        console.log('📊 Detalles del formato encontrados:', formatoCompleto.detalles);
        
        formatoCompleto.detalles.forEach((detalle) => {
          console.log('📌 Procesando detalle:', detalle);
          clasificadoresData.push([
            { 
              content: detalle.clasificador_nombre || 'Viáticos y asignaciones por comisión de servicio', 
              styles: { fontSize: 10, halign: 'left' } 
            },
            { 
              content: detalle.partida || '', 
              styles: { fontSize: 10, halign: 'center' } 
            },
            { 
              content: `S/. ${parseFloat(detalle.monto || 0).toFixed(2)}`, 
              styles: { fontSize: 10, halign: 'right' } 
            }
          ]);
        });
      } else {
        console.warn('⚠️ No hay detalles en formatoCompleto.detalles');
      }
    } catch (error) {
      console.warn('⚠️ Error al procesar detalles del formato:', error);
    }

    // Si no hay detalles, usar datos de comisionado como fallback
    if (clasificadoresData.length === 0) {
      console.log('📋 Usando fallback - comisionado.partidas:', comisionado.partidas);
      console.log('📋 monto del comisionado:', comisionado.monto);
      
      if (comisionado.partidas && comisionado.partidas.length > 0) {
        comisionado.partidas.forEach((partida) => {
          clasificadoresData.push([
            { 
              content: partida.clasificador_nombre || 'Viáticos y asignaciones por comisión de servicio', 
              styles: { fontSize: 10, halign: 'left' } 
            },
            { 
              content: partida.nombre || '23.2.1.2.2', 
              styles: { fontSize: 10, halign: 'center' } 
            },
            { 
              content: `S/. ${parseFloat(partida.monto || 0).toFixed(2)}`, 
              styles: { fontSize: 10, halign: 'right' } 
            }
          ]);
        });
      } else {
        // Fallback final - usar información de formatoCompleto si está disponible
        const montoFinal = parseFloat(comisionado.monto || formatoCompleto?.monto_total || 0).toFixed(2);
        clasificadoresData.push([
          { 
            content: 'Viáticos y asignaciones por comisión de servicio', 
            styles: { fontSize: 10, halign: 'left' } 
          },
          { 
            content: '23.2.1.2.2', 
            styles: { fontSize: 10, halign: 'center' } 
          },
          { 
            content: `S/. ${montoFinal}`, 
            styles: { fontSize: 10, halign: 'right' } 
          }
        ]);
      }
    }

    // Construir tabla de clasificadores con encabezado como fila de datos
    const clasificadoresTableData = [
      [
        { content: 'Concepto', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } },
        { content: 'Clasificador', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } },
        { content: 'Importe', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } }
      ],
      ...clasificadoresData
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: clasificadoresTableData,
      columnStyles: {
        0: { cellWidth: usableWidth - 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25, halign: 'right' }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 0,
        valign: 'top',
        lineHeightFactor: 0.5,
        cellPadding: 0.5,
        fontSize: 10,
        halign: 'left'
      },
      didDrawCell: (data) => {
        // Dibujar bordes completos alrededor de cada celda
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        const cellX = data.cell.x;
        const cellY = data.cell.y;
        const cellWidth = data.cell.width;
        const cellHeight = data.cell.height;
        
        // Dibujar rectángulo completo alrededor de cada celda
        doc.rect(cellX, cellY, cellWidth, cellHeight);
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 25;
    yPosition += 1;

    // ===== COMPROMISO (Campo 11) =====
    let usuarioDni = '';
    try {
      // Obtener datos del usuario para conseguir el DNI
      if (comisionado.usuario_id) {
        const usuarioData = await api.obtenerUsuario(comisionado.usuario_id);
        usuarioDni = usuarioData.numero_documento || usuarioData.dni || '';
        console.log('👤 Usuario obtenido:', usuarioData);
        console.log('👤 DNI obtenido:', usuarioDni);
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener DNI del usuario:', error);
      usuarioDni = '';
    }

    const compromiseText = `Yo, ${comisionado.usuario_nombre || 'el comisionado'}, identificado con DNI Nº ${usuarioDni || ''}; me comprometo a rendir cuenta documentada del anticipo en un plazo máximo de diez (10) días hábiles luego de haber concluido el periodo de la comisión de servicios. Caso contrario autorizo a que se me descuente el monto del viático recibido de mis remuneraciones mensuales u honorarios.`;
    
    const compromiseTableData = [
      [
        { content: '11.', styles: { fontSize: 10, fontStyle: 'bold', halign: 'left', valign: 'top', padding: 0 } },
        { content: compromiseText, styles: { fontSize: 10, halign: 'justify', valign: 'top', padding: 0 } }
      ]
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: compromiseTableData,
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: usableWidth - 8 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 0,
        valign: 'top',
        lineHeightFactor: 0.5,
        cellPadding: 0.5
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 20;
    yPosition += 1;

    // ===== FECHA Y LUGAR (Campo 12) =====
    const fechaCreacion = formatoCompleto?.fecha_emision ? new Date(formatoCompleto.fecha_emision) : new Date();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const mesesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaFormato = `${diasSemana[fechaCreacion.getDay()]}, ${fechaCreacion.getDate()} de ${mesesNombre[fechaCreacion.getMonth()]} del ${fechaCreacion.getFullYear()} a las ${fechaCreacion.toLocaleTimeString('es-ES')}`;
    
    const dateTableData = [
      [{ content: '12. Lugar y fecha', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: fechaFormato, colSpan: 4, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }]
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: dateTableData,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: usableWidth - 50 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 0,
        valign: 'top',
        lineHeightFactor: 0.5,
        cellPadding: 0.5
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 8;

    // ===== FIRMAS (PIE DE PÁGINA - DOS COLUMNAS CENTRALES) =====
    const footerMargin = 15;
    
    // Posición de las firmas al final de la página
    const firmaLineY = pageHeight - footerMargin - 10;
    const firmaTextY = firmaLineY + 5;
    
    // Dos columnas centrales
    const centerX = pageWidth / 2;
    const lineLength = 70;
    const separation = 100; // Separación entre columnas (aumentada)
    
    // Columna izquierda (PERSONA COMISIONADA)
    const firmaLine1X = centerX - separation / 2 - lineLength / 2;
    
    // Columna derecha (JEFE O DIRECTOR)
    const firmaLine2X = centerX + separation / 2 - lineLength / 2;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Línea 1 (izquierda)
    doc.line(firmaLine1X, firmaLineY, firmaLine1X + lineLength, firmaLineY);
    
    // Línea 2 (derecha)
    doc.line(firmaLine2X, firmaLineY, firmaLine2X + lineLength, firmaLineY);
    
    // Texto de firmas
    doc.setFontSize(10);
    doc.setFont('Arial', 'bold');
    doc.setTextColor(0, 0, 0);
    
    doc.text('FIRMA DE LA PERSONA COMISIONADA', firmaLine1X + lineLength / 2, firmaTextY, { align: 'center' });
    
    doc.text('FIRMA DEL JEFE O DIRECTOR', firmaLine2X + lineLength / 2, firmaTextY, { align: 'center' });

    return doc;
  };

  const handleDescargarFormato = (comisionadoSeleccionado) => {
    if (!selectedComision || !comisionadoSeleccionado) return;

    try {
      // Generar formato para el comisionado seleccionado
      generarFormatoComision(selectedComision, comisionadoSeleccionado);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo generar el formato: ${err.message}`,
      });
    }
  };

  const generarFormatoComision = async (comision, comisionado) => {
    try {
      console.log('📥 Descargando formato con jsPDF...');

      const totalMonto = parseFloat(comisionado.monto || 0);
      // Solo contar días del clasificador 23.2.1.2.2 (VIÁTICOS Y ASIGNACIONES)
      let totalDias = 0;
      if (comisionado.partidas && comisionado.partidas.length > 0) {
        totalDias = comisionado.partidas
          .filter(p => p.nombre && p.nombre.startsWith('23.2.1.2.2'))
          .reduce((sum, p) => sum + parseInt(p.dias || 0, 10), 0);
      } else if (comisionado.partida && comisionado.partida.startsWith('23.2.1.2.2')) {
        totalDias = parseInt(comisionado.dias || 0, 10);
      }
      
      // Construir observación final: usar la observación del comisionado (que ya incluye la de la comisión)
      let observacionFinal = comisionado.observacion || '';
      
      const fechaSalida = new Date(comision.fecha_salida).toLocaleDateString('es-ES');
      const fechaRetorno = new Date(comision.fecha_retorno).toLocaleDateString('es-ES');
      const fechaSalidaObj = new Date(comision.fecha_salida);
      const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      const periodo = `${meses[fechaSalidaObj.getMonth()]} ${fechaSalidaObj.getFullYear()}`;
      const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';
      console.log('📍 [generarFormatoComision] comisionado:', comisionado);
      console.log('📍 [generarFormatoComision] ambitoDelUsuario:', ambitoDelUsuario);

      // Cargar logo desde la carpeta public
      let logoBase64 = null;
      try {
        // 🆕 Cargar logo desde public/
        const logoResponse = await fetch(process.env.PUBLIC_URL + '/ANA.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(logoBlob);
          });
          console.log('✅ Logo cargado correctamente');
        } else {
          console.warn('⚠️ No se pudo cargar el logo - respuesta:', logoResponse.status);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo cargar el logo ANA.png:', error);
      }

      // Crear documento PDF en landscape
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      let yPosition = margin;

      // Encabezado dividido en 3 columnas: izquierda (20%), centro (60%), derecha (20%)
      const logoY = yPosition;
      const colWidth = pageWidth / 5; // Para dividir en 5 partes (20%, 60%, 20% = 5 partes de 20%)
      
      // COLUMNA IZQUIERDA: Logo + Ámbito - LOGO CENTRADO
      const logoSizelago = 38; // Logo ancho (no cambiar)
      const logoSize = 19; // Logo alto
      const leftColX = margin + colWidth / 2 - (logoSizelago / 2); // Centrar el logo de 38mm de ancho
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', leftColX, logoY, logoSizelago, logoSize);
      }

      // Información debajo del logo - con más espacio
      const infoLeftX = margin + colWidth / 2;
      const textBelowLogoY = logoY + logoSize + 3; // Espacio después del logo
      doc.setFontSize(6.5);
      doc.setTextColor(0, 0, 0);
      doc.setFont('Arial', 'bold');
      doc.text(ambitoDelUsuario, infoLeftX, textBelowLogoY, { maxWidth: colWidth * 1.5, align: 'center' });
      
      doc.setFontSize(6);
      doc.setFont('Helvetica', 'normal');
      doc.text('Oficina de Administración', infoLeftX, textBelowLogoY + 3.5, { maxWidth: colWidth * 1.5, align: 'center' });
      
      doc.setFontSize(6);
      doc.setFont('Arial', 'normal');
      doc.text('Unidad de Recursos Humanos', infoLeftX, textBelowLogoY + 7, { maxWidth: colWidth * 1.5, align: 'center' });

      // COLUMNA CENTRAL: Títulos (60%) - Debajo de "Unidad de Recursos Humanos"
      const centerColX = pageWidth / 2;
      const titleStartY = textBelowLogoY + 11; // Debajo del último texto
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('Arial', 'bold');
      doc.text('ANEXO N° 01', centerColX, titleStartY, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('Arial', 'bold');
      doc.text('PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS', centerColX, titleStartY + 8, { align: 'center', maxWidth: colWidth * 3 - 4 });
      
      yPosition = titleStartY + 16;

      // Sección de información: DIRECCIÓN a la izquierda, PERÍODO a la derecha
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('Arial', 'normal');
      
      // DIRECCIÓN / OFICINA a la izquierda
      doc.text(`DIRECCIÓN / OFICINA: ${ambitoDelUsuario}`, margin, yPosition);
      
      // PERÍODO a la derecha
      doc.text(`PERÍODO: ${periodo}`, pageWidth - margin, yPosition, { align: 'right' });
      
      yPosition += 8;
      
      // PROYECTO / CONVENIO debajo de DIRECCIÓN
      doc.text(`PROYECTO / CONVENIO: ${comision.meta_nombre || 'N/A'}`, margin, yPosition);
      yPosition += 10;

      // Tabla con colspan y rowspan usando autoTable con estilos profesionales
      const usableWidth = pageWidth - (margin * 2);
      const columnWidths = [45, 28, 65, 25, 18, 22, 22, usableWidth - (45 + 28 + 65 + 25 + 18 + 22 + 22)];
      
      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          padding: 4,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        head: [
          [
            { content: 'TRABAJADOR\nCOMISIONADO', rowSpan: 2 },
            { content: 'CARGO', rowSpan: 2 },
            { content: 'ACTIVIDAD\nA REALIZAR', rowSpan: 2 },
            { content: 'COMISIÓN', colSpan: 2 },
            { content: 'FECHA\nSALIDA', rowSpan: 2 },
            { content: 'FECHA\nRETORNO', rowSpan: 2 },
            { content: 'OBSERVACIÓN', rowSpan: 2 }
          ],
          [
            { content: 'LUGAR', halign: 'center' },
            { content: 'N° DÍAS/HORA', halign: 'center' }
          ]
        ],
        body: [
          [
            { content: comisionado.usuario_nombre || '', halign: 'left', valign: 'middle' },
            { content: comisionado.cargo_nombre || '', halign: 'center', valign: 'middle' },
            { content: comision.observacion || '', halign: 'left', valign: 'middle' },
            { content: comision.lugar || '', halign: 'center', valign: 'middle' },
            { content: totalDias.toString(), halign: 'center', valign: 'middle' },
            { content: fechaSalida, halign: 'center', valign: 'middle' },
            { content: fechaRetorno, halign: 'center', valign: 'middle' },
            { content: observacionFinal || '', halign: 'left', valign: 'middle' }
          ]
        ],
        columnStyles: {
          0: { cellWidth: columnWidths[0] },
          1: { cellWidth: columnWidths[1] },
          2: { cellWidth: columnWidths[2] },
          3: { cellWidth: columnWidths[3] },
          4: { cellWidth: columnWidths[4] },
          5: { cellWidth: columnWidths[5] },
          6: { cellWidth: columnWidths[6] },
          7: { cellWidth: columnWidths[7] }
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          padding: 3.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        }
      });

      // Obtener la Y final de la tabla
      const finalY = doc.lastAutoTable?.finalY || yPosition + 30;

      // Timestamp a la izquierda, antes de la firma
      doc.setFontSize(8);
      doc.setFont('Arial', 'normal');
      doc.setTextColor(100, 100, 100);
      const fechaCreacion = formatoCompleto?.fecha_emision ? new Date(formatoCompleto.fecha_emision) : new Date();
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const mesesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const fechaFormato = `${diasSemana[fechaCreacion.getDay()]}, ${fechaCreacion.getDate()} de ${mesesNombre[fechaCreacion.getMonth()]} del ${fechaCreacion.getFullYear()} a las ${fechaCreacion.toLocaleTimeString('es-ES')}`;
      const timestampY = pageHeight - margin - 15;
      doc.text(
        fechaFormato,
        margin,
        timestampY,
        { align: 'left' }
      );

      // Firma en el centro, debajo de la fecha
      const firmaY = pageHeight - margin - 5;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 35, firmaY, pageWidth / 2 + 35, firmaY);
      
      // Texto de firma
      doc.setFontSize(9);
      doc.setFont('Arial', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('FIRMA DEL JEFE O DIRECTOR', pageWidth / 2, firmaY + 5, { align: 'center' });

      // 🆕 Agregar Anexo 02 (Presupuesto)
      await generarAnexo02(doc, comision, comisionado, logoBase64);

      // Descargar el PDF completo (Anexo 01 + Anexo 02)
      doc.save(`Comision-${comisionado.usuario_nombre}-${new Date().getTime()}.pdf`);

      Swal.fire({
        icon: 'success',
        title: '✅ Éxito',
        text: 'El PDF se descargó correctamente',
      });

      handleCerrarPreview();

    } catch (error) {
      console.error('❌ Error descargando:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo descargar el PDF: ${error.message}`,
      });
    }
  };

  const estadoColor = (estado) => {
    if (estado === 'PRESUPUESTO ASIGNADO') return 'success';
    if (estado === 'APROBADA') return 'info';
    return 'default';
  };

  // Función para determinar si una fila es la primera de un nuevo grupo (nuevo comisionado o comisión)
  const isNewComisionadoGroup = (rowIndex) => {
    if (rowIndex === 0) return true;
    const currentRow = comisiones[rowIndex];
    const previousRow = comisiones[rowIndex - 1];
    
    // Nueva fila si cambia el comisionado O si cambia la comisión (lugar + fecha)
    const comisionadoCambió = currentRow.usuario_nombre !== previousRow.usuario_nombre;
    const comisionCambió = currentRow.lugar !== previousRow.lugar || 
                          currentRow.fecha_salida !== previousRow.fecha_salida;
    
    return comisionadoCambió || comisionCambió;
  };

  // Columnas para la tabla
  // 🆕 Funciones para ver anexos en modal
  const verAnexoEnModal = async (tipo, row) => {
    try {
      setPreviewLoading(true);
      
      // 🆕 Obtener datos del formato EMITIDO (que ya existe)
      if (!row.formato_existente || !row.formato_existente.id) {
        Swal.fire('Error', 'No se encontró el formato para mostrar', 'error');
        setPreviewLoading(false);
        return;
      }

      // Obtener el formato completo del API
      const formatoCompleto = await api.obtenerFormatoEmisionPorId(row.formato_existente.id);
      console.log('📄 Formato completo cargado:', formatoCompleto);
      
      // Obtener la comisión completa
      const comisionCompleta = await api.obtenerComision(row.comision_id);
      console.log('✈️ Comisión completa cargada:', comisionCompleta);
      
      // Obtener el comisionado específico de este formato
      // 🆕 Intentar primero con 'comisionados', luego con 'comisionados_detalle'
      let comisionado = (comisionCompleta?.comisionados || [])
        .find(c => c.usuario_id === row.usuario_id);
      
      if (!comisionado) {
        // Fallback a comisionados_detalle si no está en comisionados
        comisionado = (comisionCompleta?.comisionados_detalle || [])
          .find(c => c.usuario_id === row.usuario_id);
      }
      
      if (!comisionado) {
        Swal.fire('Error', 'No se encontraron datos del comisionado', 'error');
        setPreviewLoading(false);
        return;
      }

      console.log('👤 Comisionado encontrado:', comisionado);

      // Cargar logo
      let logoBase64 = null;
      try {
        // 🆕 Cargar logo desde public/
        const logoResponse = await fetch(process.env.PUBLIC_URL + '/ANA.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(logoBlob);
          });
          console.log('✅ Logo cargado correctamente');
        } else {
          console.warn('⚠️ No se pudo cargar el logo - respuesta:', logoResponse.status);
        }
      } catch (error) {
        console.warn('⚠️ No se pudo cargar el logo:', error);
      }

      // Crear documento PDF
      const doc = new jsPDF({
        orientation: tipo === 'anexo1' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      if (tipo === 'anexo1') {
        // Generar solo Anexo 01 con datos del formato emitido
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 12;
        let yPosition = margin;

        // Usar datos del formato emitido
        const totalMonto = parseFloat(formatoCompleto?.monto_total || comisionado.monto || 0);
        const totalDias = parseInt(formatoCompleto?.num_dias || comisionado.dias || 0, 10);
        const lugar = formatoCompleto?.lugar || comisionCompleta.lugar || 'N/A';
        const ruta = formatoCompleto?.ruta || 'N/A';
        const actividad_realizar = formatoCompleto?.actividad_realizar || comisionCompleta.observacion || '';  // 🆕 ACTIVIDAD A REALIZAR
        const observacion = formatoCompleto?.observacion || '';  // 🆕 Observación (notas adicionales)
        
        const fechaSalida = new Date(formatoCompleto?.fecha_salida || comisionCompleta.fecha_salida).toLocaleDateString('es-ES');
        const fechaRetorno = new Date(formatoCompleto?.fecha_retorno || comisionCompleta.fecha_retorno).toLocaleDateString('es-ES');
        const fechaSalidaObj = new Date(formatoCompleto?.fecha_salida || comisionCompleta.fecha_salida);
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const periodo = `${meses[fechaSalidaObj.getMonth()]} ${fechaSalidaObj.getFullYear()}`;
        // 🆕 AMBITO viene del USUARIO (comisionado), no de la comisión
        const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';
        console.log('📍 [verAnexoEnModal] comisionado:', comisionado);
        console.log('📍 [verAnexoEnModal] ambitoDelUsuario:', ambitoDelUsuario);

        // Encabezado
        const logoSizelago = 38;
        const logoSize = 19;
        const colWidth = pageWidth / 5;
        const leftColX = margin + colWidth / 2 - (logoSizelago / 2);
        
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', leftColX, yPosition, logoSizelago, logoSize);
        }

        const infoLeftX = margin + colWidth / 2;
        const textBelowLogoY = yPosition + logoSize + 3;
        doc.setFontSize(6.5);
        doc.setFont(undefined, 'bold');
        doc.text(ambitoDelUsuario, infoLeftX, textBelowLogoY, { maxWidth: colWidth * 1.5, align: 'center' });
        
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.text('Oficina de Administración', infoLeftX, textBelowLogoY + 3.5, { maxWidth: colWidth * 1.5, align: 'center' });
        doc.text('Unidad de Recursos Humanos', infoLeftX, textBelowLogoY + 7, { maxWidth: colWidth * 1.5, align: 'center' });

        const centerColX = pageWidth / 2;
        const titleStartY = textBelowLogoY + 11;
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('ANEXO N° 01', centerColX, titleStartY, { align: 'center' });

        doc.setFontSize(11);
        doc.text('PROGRAMACIÓN MENSUAL DE COMISIÓN DE SERVICIOS', centerColX, titleStartY + 8, { align: 'center', maxWidth: colWidth * 3 - 4 });

        yPosition = titleStartY + 16;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        doc.text(`DIRECCIÓN / OFICINA: ${ambitoDelUsuario}`, margin, yPosition);
        doc.text(`PERÍODO: ${periodo}`, pageWidth - margin, yPosition, { align: 'right' });
        
        yPosition += 8;
        
        // Usar meta del formato emitido
        const metaInfo = formatoCompleto?.meta_nombre || comisionCompleta.meta_nombre || 'N/A';
        doc.text(`PROYECTO / CONVENIO: ${metaInfo}`, margin, yPosition);

        yPosition += 10;

        // Tabla Anexo 01 con datos del formato emitido
        const usableWidth = pageWidth - (margin * 2);
        autoTable(doc, {
          startY: yPosition,
          margin: margin,
          theme: 'grid',
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            padding: 4,
            lineColor: [0, 0, 0],
            lineWidth: 0.5
          },
          bodyStyles: {
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            padding: 3.5,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.5
          },
          head: [
            [
              { content: 'TRABAJADOR\nCOMISIONADO', rowSpan: 2 },
              { content: 'CARGO', rowSpan: 2 },
              { content: 'ACTIVIDAD\nA REALIZAR', rowSpan: 2 },
              { content: 'COMISIÓN', colSpan: 2 },
              { content: 'FECHA\nSALIDA', rowSpan: 2 },
              { content: 'FECHA\nRETORNO', rowSpan: 2 },
              { content: 'OBSERVACIÓN', rowSpan: 2 }
            ],
            [
              { content: 'LUGAR', halign: 'center' },
              { content: 'N° DÍAS/HORA', halign: 'center' }
            ]
          ],
          body: [
            [
              { content: comisionado.usuario_nombre || '', halign: 'left' },
              { content: comisionado.cargo_nombre || '', halign: 'center' },
              { content: actividad_realizar, halign: 'left' },  // 🆕 ACTIVIDAD A REALIZAR
              { content: lugar, halign: 'center' },
              { content: totalDias.toString(), halign: 'center' },
              { content: fechaSalida, halign: 'center' },
              { content: fechaRetorno, halign: 'center' },
              { content: observacion, halign: 'left' }  // 🆕 OBSERVACIÓN (notas adicionales)
            ]
          ]
        });

        // 🆕 FOOTER CON FECHA Y FIRMA
        yPosition = doc.lastAutoTable?.finalY || yPosition + 30;
        yPosition += 15;

        // Obtener fecha actual formateada
        const fechaEmision = formatoCompleto?.fecha_emision ? new Date(formatoCompleto.fecha_emision) : new Date();
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const diaSemana = diasSemana[fechaEmision.getDay()];
        const dia = fechaEmision.getDate();
        const mes = mesesNombres[fechaEmision.getMonth()];
        const anio = fechaEmision.getFullYear();
        const fechaFormato = `${diaSemana}, ${dia} de ${mes} del ${anio}`;

        // 🆕 FOOTER MEJORADO CON TIMESTAMP Y FIRMA
        // Timestamp a la izquierda - Usar fecha de creación del formato (desde BD)
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        const horaFormato = fechaEmision.toLocaleTimeString('es-ES');
        const fechaCompleta = `${fechaFormato} a las ${horaFormato}`;
        const timestampY = pageHeight - margin - 15;
        doc.text(fechaCompleta, margin, timestampY, { align: 'left' });

        // Firma en el centro, debajo de la fecha
        const firmaY = pageHeight - margin - 5;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        const firmaLineX1 = pageWidth / 2 - 35;
        const firmaLineX2 = pageWidth / 2 + 35;
        doc.line(firmaLineX1, firmaY, firmaLineX2, firmaY);
        
        // Texto de firma
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('FIRMA DEL JEFE O DIRECTOR', pageWidth / 2, firmaY + 5, { align: 'center' });
      } else {
        // Generar solo Anexo 02 con datos del formato emitido
        await generarAnexo02(doc, comisionCompleta, comisionado, logoBase64, formatoCompleto);
      }

      // Convertir a blob y crear URL
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfPreviewUrl(pdfUrl);
      setOpenPreview(true);
      setPreviewLoading(false);
    } catch (error) {
      console.error('Error mostrando anexo:', error);
      setPreviewLoading(false);
      Swal.fire('Error', `No se pudo mostrar el anexo: ${error.message}`, 'error');
    }
  };

  const columnasTabla = [
    {
      Header: 'Item',
      accessor: 'item',
      width: '5%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        return (
          <MDBox
            sx={{
              // eslint-disable-next-line react/prop-types
              paddingTop: isNewComisionadoGroup(row.index) ? '12px' : '4px',
              // eslint-disable-next-line react/prop-types
              borderTop: isNewComisionadoGroup(row.index) ? '2px solid #ccc' : 'none',
              // eslint-disable-next-line react/prop-types
              fontWeight: isNewComisionadoGroup(row.index) ? 'bold' : 'normal',
            }}
          >
            {/* eslint-disable-next-line react/prop-types */}
            {row.index + 1}
          </MDBox>
        );
      },
    },
    {
      Header: 'Nº Documento',
      accessor: 'numero_documento',
      width: '12%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => row.original.numero_documento || '-',
    },
    { Header: 'Ámbito', accessor: 'ambito_nombre', width: '12%' },
    { Header: 'Lugar', accessor: 'lugar', width: '15%' },
    {
      Header: 'Período',
      accessor: 'fecha_salida',
      width: '15%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => {
        const fechaSalida = row.original.fecha_salida;
        const fechaRetorno = row.original.fecha_retorno;
        return `${new Date(fechaSalida).toLocaleDateString('es-ES')} - ${new Date(fechaRetorno).toLocaleDateString('es-ES')}`;
      },
    },
    { Header: 'Modalidad de Viaje', accessor: 'modalidad_viaje', width: '15%' },
    {
      Header: 'Comisionado',
      accessor: 'usuario_nombre',
      width: '15%',
    },
    {
      Header: 'Monto',
      accessor: 'monto',
      width: '12%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => `S/. ${parseFloat(row.original.monto).toFixed(2)}`,
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      width: '20%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        // 🆕 Mostrar botones diferente si ya existe formato
        if (original.tiene_formato) {
          return (
            <MDBox sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <MDButton
                variant="gradient"
                color="warning"
                size="small"
                onClick={() => handleAbrirModalModificarFormato(original)}
                title="Modificar formato existente"
              >
                ✏️ Modificar
              </MDButton>
              <MDButton
                variant="outlined"
                color="info"
                size="small"
                onClick={() => verAnexoEnModal('anexo1', original)}
                title="Ver Anexo 01"
                disabled={previewLoading}
              >
                📄 Anexo 1
              </MDButton>
              <MDButton
                variant="outlined"
                color="info"
                size="small"
                onClick={() => verAnexoEnModal('anexo2', original)}
                title="Ver Anexo 02"
                disabled={previewLoading}
              >
                📋 Anexo 2
              </MDButton>
            </MDBox>
          );
        }
        
        return (
          <MDButton
            variant="gradient"
            color="info"
            size="small"
            onClick={() => handleAbrirModalEmitirFormato(original)}
            startIcon={<DescriptionIcon />}
          >
            📝 Emitir
          </MDButton>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <MDTypography variant="h4" mb={1}>
            Emisión de Formatos de Comisión
          </MDTypography>
          <MDTypography variant="body2" color="text">
            Selecciona una comisión aprobada con presupuesto asignado para emitir su formato.
          </MDTypography>
        </MDBox>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </MDBox>
        ) : (
          <Card>
            <MDBox p={2}>
              <DataTable
                table={{
                  columns: columnasTabla,
                  rows: comisiones,
                }}
                canSearch
                isSorted={false}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries={true}
                noEndBorder
              />
            </MDBox>
          </Card>
        )}
      </MDBox>

      {/* Dialog para vista previa */}
      <Dialog 
        open={openPreview} 
        onClose={handleCerrarPreview} 
        maxWidth="md" 
        fullWidth 
        fullScreen={false}
        sx={{ 
          '& .MuiDialog-paper': { 
            maxHeight: '95vh',
            height: '95vh',
            maxWidth: '850px',
            width: '92vw'
          } 
        }}
      >
        <DialogTitle>Emitir Formato - {selectedRowComisionado?.usuario_nombre}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, flex: 1, overflow: 'auto' }}>
          {previewLoading && (
            <MDBox display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
              <MDTypography variant="body2" mt={2}>
                Generando vista previa del PDF...
              </MDTypography>
            </MDBox>
          )}
          
          {!previewLoading && !pdfPreviewUrl && (
            <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <MDTypography variant="body2" color="error">
                No se pudo generar la vista previa. Por favor, intenta nuevamente.
              </MDTypography>
            </MDBox>
          )}
          
          {pdfPreviewUrl && !previewLoading && (
            <MDBox sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <MDTypography variant="subtitle2" fontWeight="bold" mb={1}>
                Vista Previa del PDF:
              </MDTypography>
              <Box
                component="iframe"
                src={pdfPreviewUrl}
                title="PDF Preview"
                sx={{
                  width: '100%',
                  flex: 1,
                  minHeight: '600px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </MDBox>
          )}

          {selectedComision && selectedRowComisionado && !previewLoading && (
            <MDBox>
              <MDBox sx={{ overflowX: 'auto', mt: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#c8c8c8' }}>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', color: '#000000' }}>
                        TRABAJADOR COMISIONADO
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', color: '#000000' }}>
                        CARGO
                      </th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', color: '#000000' }}>
                        MONTO
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                        {selectedRowComisionado.usuario_nombre}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                        {selectedRowComisionado.cargo_nombre}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                        S/. {parseFloat(selectedRowComisionado.monto).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </MDBox>

              {/* Mostrar partidas si hay múltiples */}
              {selectedRowComisionado.partidas && selectedRowComisionado.partidas.length > 1 && (
                <MDBox mt={3}>
                  <MDTypography variant="subtitle2" fontWeight="bold">
                    Partidas Incluidas:
                  </MDTypography>
                  <MDBox mt={1}>
                    {selectedRowComisionado.partidas.map((partida, idx) => (
                      <MDBox key={idx} p={1} sx={{ backgroundColor: '#f9f9f9', mb: 1, borderRadius: 1 }}>
                        <MDTypography variant="body2">
                          {partida.nombre} - {partida.clasificador_nombre} - S/. {parseFloat(partida.monto).toFixed(2)}
                        </MDTypography>
                      </MDBox>
                    ))}
                  </MDBox>
                </MDBox>
              )}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCerrarPreview} variant="text" color="dark">
            Cerrar
          </MDButton>
          {selectedRowComisionado && (
            <MDButton
              color="success"
              variant="gradient"
              onClick={() => {
                handleDescargarFormato(selectedRowComisionado);
                handleCerrarPreview();
              }}
            >
              Emitir Formato
            </MDButton>
          )}
        </DialogActions>
      </Dialog>

      {/* 🆕 Modal para editar y emitir formato */}
      <Dialog open={openCrearFormato} onClose={handleCerrarCrearFormato} maxWidth="md" fullWidth>
        <DialogTitle>Emitir Formato de Comisión</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Lugar */}
            <TextField
              name="lugar"
              label="Lugar"
              value={formValues.lugar}
              onChange={handleChangeFormato}
              fullWidth
            />

            {/* Ruta */}
            <TextField
              name="ruta"
              label="Ruta"
              value={formValues.ruta}
              onChange={handleChangeFormato}
              fullWidth
              multiline
              rows={2}
            />

            {/* Modalidad */}
            {/* Modalidad */}
            <Autocomplete
              options={['TERRESTRE', 'AEREO', 'FLUVIAL', 'AEREO-TERRESTRE', 'AEREO-FLUVIAL', 'TERRESTRE-FLUVIAL', 'AEREO-TERRESTRE-FLUVIAL']}
              value={formValues.modalidad_viaje || null}
              onChange={(event, newValue) => {
                setFormValues({
                  ...formValues,
                  modalidad_viaje: newValue || ''
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Modalidad de Viaje"
                  placeholder="Seleccionar modalidad..."
                />
              )}
            />

            {/* Fechas y Días */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="fecha_salida"
                label="Fecha Salida"
                type="datetime-local"
                value={formValues.fecha_salida ? formValues.fecha_salida.slice(0, 16) : ''}
                onChange={handleChangeFormato}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="fecha_retorno"
                label="Fecha Retorno"
                type="datetime-local"
                value={formValues.fecha_retorno ? formValues.fecha_retorno.slice(0, 16) : ''}
                onChange={handleChangeFormato}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Días y Costo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="num_dias"
                label="Número de Días"
                type="number"
                value={formValues.num_dias}
                onChange={handleChangeFormato}
              />
              <TextField
                name="costo_xdia"
                label="Costo por Día"
                type="number"
                value={formValues.costo_xdia}
                onChange={handleChangeFormato}
                inputProps={{ step: '0.01' }}
              />
            </Box>

            {/* Datos de Pago */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Autocomplete
                options={['ANTICIPO', 'REEMBOLSO']}
                value={formValues.tipo_emision || 'REEMBOLSO'}
                onChange={(event, newValue) => {
                  setFormValues({
                    ...formValues,
                    tipo_emision: newValue || 'REEMBOLSO'
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tipo de Emisión"
                    placeholder="Seleccionar tipo..."
                  />
                )}
              />
              <TextField
                name="numero_siaf"
                label="SIAF (10 dígitos)"
                value={formValues.numero_siaf}
                onChange={handleChangeFormato}
                placeholder="1234567890"
                inputProps={{ maxLength: 10 }}
              />
            </Box>

            {/* CP */}
            <TextField
              name="codigo_cp"
              label="Código CP"
              value={formValues.codigo_cp}
              onChange={handleChangeFormato}
              placeholder="24089.26.95.2605669"
              fullWidth
            />

            {/* 🆕 META */}
            <Autocomplete
              options={metasDisponibles || []}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `${option.numero_meta || ''} - ${option.nombre || ''}`
              }
              value={metasDisponibles?.find((m) => m?.id === formValues.meta_id) || null}
              onChange={(event, newValue) => {
                setFormValues({
                  ...formValues,
                  meta_id: newValue?.id || '',
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="META (Asignación Presupuestaria)"
                  placeholder="Buscar META..."
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {option.numero_meta} - {option.nombre}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      Período: {option.periodo}
                    </div>
                  </div>
                </li>
              )}
            />

            {/* 🆕 SELECT DE CERTIFICADOS DISPONIBLES */}
            {formValues.meta_id && (
              <>
                <Autocomplete
                  options={certificadosDisponibles || []}
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : `Nota: ${option.nota} | Mes: ${option.mes}`
                  }
                  value={certificadosDisponibles?.find((c) => c?.id === formValues.certificacion_id) || null}
                  onChange={(event, newValue) => {
                    setFormValues({
                      ...formValues,
                      certificacion_id: newValue?.id || '',
                    });
                    // 🔄 Limpiar clasificador seleccionado al cambiar de certificación
                    setClasificadorSeleccionado(null);
                    
                    // 🆕 Cargar detalles cuando se selecciona una certificación
                    if (newValue?.id) {
                      cargarDetallesCertificacion(newValue.id, false);  // ✅ Modo CREACIÓN
                    } else {
                      setDetallesCertificacionSeleccionada(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="📜 Certificados Disponibles (ACTIVO | EN_PROCESO)"
                      placeholder="Selecciona un certificado..."
                      size="small"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ width: '100%' }}>
                        <div style={{ fontWeight: 500 }}>
                          <span style={{ fontWeight: 'bold' }}>Mes: {option.mes}</span> | Nota: {option.nota}
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {option.numero_documento} - {option.tipo_documento}
                        </div>
                      </Box>
                    </li>
                  )}
                />

                {/* DETALLES DEL CERTIFICADO SELECCIONADO */}
                {formValues.certificacion_id && (
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {(() => {
                      const certSeleccionado = certificadosDisponibles.find((c) => c.id === formValues.certificacion_id);
                      return certSeleccionado ? (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <MDTypography variant="body2" fontWeight="bold">
                                <span style={{ fontWeight: 'bold' }}>Mes: {certSeleccionado.mes}</span> | Nota: {certSeleccionado.nota}
                              </MDTypography>
                              <MDTypography variant="caption" color="textSecondary">
                                {certSeleccionado.numero_documento} - {certSeleccionado.tipo_documento}
                              </MDTypography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip
                                label={certSeleccionado.estado_uso}
                                size="small"
                                color={certSeleccionado.estado_uso === 'ACTIVO' ? 'success' : 'warning'}
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, pt: 1, borderTop: '1px solid #eee' }}>
                            <div>
                              <MDTypography variant="caption" fontWeight="bold">
                                💰 Certificado:
                              </MDTypography>
                              <MDTypography variant="caption">
                                S/. {parseFloat(certSeleccionado.monto_certificado).toFixed(2)}
                              </MDTypography>
                            </div>
                            <div>
                              <MDTypography variant="caption" fontWeight="bold">
                                ✅ Utilizado:
                              </MDTypography>
                              <MDTypography variant="caption">
                                S/. {parseFloat(certSeleccionado.monto_utilizado || 0).toFixed(2)}
                              </MDTypography>
                            </div>
                            <div>
                              <MDTypography variant="caption" fontWeight="bold">
                                📊 Disponible:
                              </MDTypography>
                              <MDTypography variant="caption" color="success">
                                S/. {parseFloat((certSeleccionado.monto_certificado - (certSeleccionado.monto_utilizado || 0))).toFixed(2)}
                              </MDTypography>
                            </div>
                            <div>
                              <MDTypography variant="caption" fontWeight="bold">
                                📈 Uso:
                              </MDTypography>
                              <MDTypography variant="caption">
                                {certSeleccionado.porcentaje_uso || 0}%
                              </MDTypography>
                            </div>
                          </Box>

                          {/* 🆕 SELECT Y DETALLES DE CLASIFICADORES */}
                          {formValues.certificacion_id && (
                            <>
                              {detallesCertificacionSeleccionada ? (
                                <>
                                  {Array.isArray(detallesCertificacionSeleccionada?.detalles) && detallesCertificacionSeleccionada.detalles.length > 0 ? (
                                    <Box sx={{ mt: 2 }}>
                                      {/* SELECT DE CLASIFICADORES */}
                                      <Autocomplete
                                        options={detallesCertificacionSeleccionada.detalles || []}
                                        getOptionLabel={(option) =>
                                          typeof option === 'string'
                                            ? option
                                            : `${option.clasificador_nombre || 'Sin nombre'} | S/. ${parseFloat(option.monto || 0).toFixed(2)}`
                                        }
                                        value={clasificadorSeleccionado}
                                        onChange={(event, newValue) => {
                                          // ✅ Actualizar directamente sin refetch
                                          setClasificadorSeleccionado(newValue);
                                          console.log('✅ Clasificador seleccionado:', { 
                                            nombre: newValue?.clasificador_nombre,
                                            monto: newValue?.monto,
                                            montoUtilizado: newValue?.monto_utilizado
                                          });
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label="📋 Detalles por Clasificador"
                                            placeholder="Selecciona un clasificador..."
                                            size="small"
                                          />
                                        )}
                                        renderOption={(props, option) => (
                                          <li {...props}>
                                            <Box sx={{ width: '100%' }}>
                                              <div style={{ fontWeight: 500 }}>
                                                {option.clasificador_nombre || 'Sin nombre'}
                                              </div>
                                              <div style={{ fontSize: '0.85em', color: '#666' }}>
                                                Partida: {option.partida || 'N/A'} | S/. {parseFloat(option.monto || 0).toFixed(2)}
                                              </div>
                                            </Box>
                                          </li>
                                        )}
                                      />

                                      {/* DETALLE DEL CLASIFICADOR SELECCIONADO */}
                                      {clasificadorSeleccionado && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: '4px', border: '1px solid #2196F3' }}>
                                          <MDTypography variant="subtitle2" fontWeight="bold" mb={1.5}>
                                            📊 Detalle del Clasificador
                                          </MDTypography>
                                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                            <Box>
                                              <MDTypography variant="caption" fontWeight="bold" display="block">
                                                Clasificador:
                                              </MDTypography>
                                              <MDTypography variant="body2" display="block">
                                                {clasificadorSeleccionado.clasificador_nombre || 'Sin nombre'}
                                              </MDTypography>
                                            </Box>
                                            <Box>
                                              <MDTypography variant="caption" fontWeight="bold" display="block">
                                                Partida Presupuestaria:
                                              </MDTypography>
                                              <MDTypography variant="body2" display="block" sx={{ fontFamily: 'monospace' }}>
                                                {clasificadorSeleccionado.partida || 'N/A'}
                                              </MDTypography>
                                            </Box>
                                            <Box>
                                              <MDTypography variant="caption" fontWeight="bold" display="block">
                                                Monto Asignado:
                                              </MDTypography>
                                              <MDTypography variant="body2" fontWeight="bold" color="primary" display="block">
                                                S/. {parseFloat(clasificadorSeleccionado.monto || 0).toFixed(2)}
                                              </MDTypography>
                                            </Box>
                                            <Box>
                                              <MDTypography variant="caption" fontWeight="bold" display="block">
                                                Monto Utilizado:
                                              </MDTypography>
                                              <MDTypography variant="body2" fontWeight="bold" color="warning" display="block">
                                                S/. {calcularMontoUtilizadoActual().toFixed(2)}
                                              </MDTypography>
                                            </Box>
                                            <Box>
                                              <MDTypography variant="caption" fontWeight="bold" display="block">
                                                Saldo Disponible:
                                              </MDTypography>
                                              <MDTypography 
                                                variant="body2" 
                                                fontWeight="bold" 
                                                display="block"
                                                sx={{ 
                                                  color: parseFloat(clasificadorSeleccionado.monto || 0) - calcularMontoUtilizadoActual() >= 0 ? '#4caf50' : '#f44336'
                                                }}
                                              >
                                                S/. {(parseFloat(clasificadorSeleccionado.monto || 0) - calcularMontoUtilizadoActual()).toFixed(2)}
                                              </MDTypography>
                                            </Box>
                                            <Box>
                                              <MDTypography variant="caption" fontWeight="bold" display="block">
                                                Estado:
                                              </MDTypography>
                                              <Chip
                                                label={clasificadorSeleccionado.activo ? 'ACTIVO' : 'INACTIVO'}
                                                size="small"
                                                color={clasificadorSeleccionado.activo ? 'success' : 'error'}
                                                variant="outlined"
                                              />
                                            </Box>
                                          </Box>
                                        </Box>
                                      )}
                                    </Box>
                                  ) : (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                                      <MDTypography variant="caption" color="warning">
                                        ⚠️ Sin clasificadores registrados para esta certificación
                                      </MDTypography>
                                    </Box>
                                  )}
                                </>
                              ) : (
                                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e3f2fd', borderRadius: '4px', border: '1px solid #2196F3' }}>
                                  <MDTypography variant="caption" color="info">
                                    ⏳ Cargando detalles de clasificadores...
                                  </MDTypography>
                                </Box>
                              )}
                            </>
                          )}
                        </Box>
                      ) : null;
                    })()}
                  </Box>
                )}
              </>
            )}

            {/* 🆕 Actividad a Realizar */}
            <TextField
              name="actividad_realizar"
              label="Actividad a Realizar"
              value={formValues.actividad_realizar}
              onChange={handleChangeFormato}
              multiline
              rows={2}
              fullWidth
              placeholder="Descripción de la actividad que se realizará en la comisión"
            />

            {/* Observación */}
            <TextField
              name="observacion"
              label="Observación (Notas Adicionales)"
              value={formValues.observacion}
              onChange={handleChangeFormato}
              multiline
              rows={2}
              fullWidth
            />

            {/* Divider */}
            <Box sx={{ borderTop: '1px solid #ddd', my: 2 }} />

            {/* Detalles - Clasificadores EDITABLE */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <MDTypography variant="h6">
                  📋 Detalles por Clasificador
                </MDTypography>
                <MDButton 
                  color="info" 
                  variant="gradient" 
                  size="small"
                  onClick={handleAgregarDetalle}
                  disabled={!formValues.meta_id}
                  title={!formValues.meta_id ? "Primero selecciona una META" : ""}
                >
                  ➕ Agregar Detalle
                </MDButton>
              </Box>

              {/* Mostrar clasificadores disponibles basado en si hay certificación seleccionada */}
              {(() => {
                // Determinar qué clasificadores mostrar
                let clasificadoresAMostrar = [];
                let mensaje = "";

                if (formValues.certificacion_id && detallesCertificacionSeleccionada?.detalles?.length > 0) {
                  // Si hay certificación seleccionada, mostrar solo sus clasificadores
                  clasificadoresAMostrar = detallesCertificacionSeleccionada.detalles;
                  mensaje = `📋 Mostrando ${clasificadoresAMostrar.length} clasificadores de esta certificación`;
                } else if (formValues.meta_id && clasificadoresDisponibles?.length > 0) {
                  // Si hay META pero no certificación, mostrar todos
                  clasificadoresAMostrar = clasificadoresDisponibles;
                  mensaje = `📋 Mostrando ${clasificadoresAMostrar.length} clasificadores disponibles`;
                }

                return (
                  <>
                    {!formValues.meta_id && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        ℹ️ Selecciona una META primero para ver clasificadores
                      </Alert>
                    )}

                    {formValues.meta_id && clasificadoresAMostrar.length > 0 && (
                      <MDTypography variant="caption" color="textSecondary" display="block" mb={1}>
                        {mensaje}
                      </MDTypography>
                    )}

                    {detallesEditables.length > 0 ? (
                      <Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', p: 1 }}>
                        {detallesEditables.map((detalle, idx) => (
                          <Box 
                            key={detalle.id}
                            sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: '2fr 1fr auto',
                              gap: 1, 
                              mb: 2, 
                              pb: 2, 
                              borderBottom: '1px solid #eee',
                              '&:last-child': { borderBottom: 'none' }
                            }}
                          >
                            {/* Autocomplete Clasificador con opciones dinámicas */}
                            {/* 🔧 Incluir clasificadores seleccionados aunque no estén en la certificación actual */}
                            {(() => {
                              // Construir lista de opciones
                              let opcionesFinales = [...clasificadoresAMostrar];
                              if (detalle.clasificador_id) {
                                // Verificar si el clasificador actual ya está en la lista
                                const yaEstaEnLista = opcionesFinales.some(c => c?.id?.toString() === detalle.clasificador_id?.toString());
                                if (!yaEstaEnLista) {
                                  // Si no está, agregar un objeto con los datos que tenemos
                                  opcionesFinales = [
                                    {
                                      id: detalle.clasificador_id,
                                      nombre: detalle.clasificador_nombre,
                                      clasificador_nombre: detalle.clasificador_nombre
                                    },
                                    ...opcionesFinales
                                  ];
                                }
                              }
                              
                              // Buscar el valor actual en las opciones
                              const valorActual = detalle.clasificador_id
                                ? opcionesFinales.find(c => c?.id?.toString() === detalle.clasificador_id?.toString()) || null
                                : null;

                              return (
                                <Autocomplete
                                  options={opcionesFinales}
                                  getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : (option?.nombre || option?.clasificador_nombre || '')
                                  }
                                  isOptionEqualToValue={(option, value) => {
                                    if (!option || !value) return option === value;
                                    return option?.id?.toString() === value?.id?.toString();
                                  }}
                                  value={valorActual}
                                  onChange={(event, newValue) => {
                                    console.log('🔄 Clasificador seleccionado:', newValue, 'idx:', idx);
                                    
                                    if (!newValue) {
                                      // Si se deselecciona
                                      const nuevosDetalles = [...detallesEditables];
                                      nuevosDetalles[idx] = {
                                        ...nuevosDetalles[idx],
                                        clasificador_id: '',
                                        clasificador_nombre: '',
                                        detalles_certificacion_credito_id: null
                                      };
                                      setDetallesEditables(nuevosDetalles);
                                      return;
                                    }

                                    // Obtener el ID correcto según la estructura del objeto
                                    const idClasificador = newValue?.id || newValue?.clasificador_id || newValue?.clasificador_id_ref;
                                    const nombreClasificador = newValue?.nombre || newValue?.clasificador_nombre || '';

                                    // 🔧 VALIDACIÓN: No permitir duplicados
                                    const yaExiste = detallesEditables.some((detalle, index) => {
                                      // No contar la fila actual
                                      if (index === idx) return false;
                                      // Comparar IDs
                                      return detalle.clasificador_id?.toString() === idClasificador?.toString();
                                    });

                                    if (yaExiste) {
                                      Swal.fire({
                                        icon: 'warning',
                                        title: '⚠️ Clasificador duplicado',
                                        text: `El clasificador "${nombreClasificador}" ya está en uso. No puedes usar el mismo clasificador dos veces.`,
                                        confirmButtonColor: '#f39c12'
                                      });
                                      return; // No actualizar
                                    }

                                    // 🔍 Buscar detalles_certificacion_credito_id en el certificado seleccionado
                                    let detallesCertificacionId = newValue?.detalles_certificacion_credito_id || null;
                                    
                                    // Si no viene en newValue, buscar en detallesCertificacionSeleccionada
                                    if (!detallesCertificacionId && detallesCertificacionSeleccionada?.detalles) {
                                      const detalleEnCertificado = detallesCertificacionSeleccionada.detalles.find(
                                        d => (d.clasificador_id === idClasificador || d.id === idClasificador)
                                      );
                                      detallesCertificacionId = detalleEnCertificado?.detalles_certificacion_credito_id || 
                                                               detalleEnCertificado?.id || null;
                                      console.log(`📌 Buscado en certificado: detalles_certificacion_credito_id = ${detallesCertificacionId}`);
                                    } else {
                                      console.log(`📌 Usando desde newValue: detalles_certificacion_credito_id = ${detallesCertificacionId}`);
                                    }

                                    const nuevosDetalles = [...detallesEditables];
                                    nuevosDetalles[idx] = {
                                      ...nuevosDetalles[idx],
                                      clasificador_id: idClasificador || '',
                                      clasificador_nombre: nombreClasificador,
                                      detalles_certificacion_credito_id: detallesCertificacionId
                                    };
                                    console.log('📝 Detalle actualizado:', {
                                      clasificador_id: nuevosDetalles[idx].clasificador_id,
                                      clasificador_nombre: nuevosDetalles[idx].clasificador_nombre,
                                      detalles_certificacion_credito_id: nuevosDetalles[idx].detalles_certificacion_credito_id
                                    });
                                    setDetallesEditables(nuevosDetalles);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Clasificador"
                                      placeholder="Buscar clasificador..."
                                      size="small"
                                    />
                                  )}
                                  size="small"
                                  noOptionsText="Sin clasificadores disponibles"
                                />
                              );
                            })()}

                            {/* Monto */}
                            <TextField
                              type="number"
                              value={detalle.monto}
                              onChange={(e) => handleChangeDetalle(idx, 'monto', e.target.value)}
                              step="0.01"
                              label="Monto"
                              size="small"
                              sx={{ textAlign: 'right' }}
                            />

                            {/* Acciones */}
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => handleEliminarDetalle(idx)}
                              sx={{ minWidth: 'auto', padding: '8px' }}
                            >
                              ❌
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <MDTypography variant="body2" color="textSecondary">
                        {formValues.meta_id ? 'Sin detalles. Haz clic en "➕ Agregar Detalle" para añadir líneas' : 'Selecciona una META para agregar detalles'}
                      </MDTypography>
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCerrarCrearFormato} variant="text" color="dark">
            Cancelar
          </MDButton>
          <MDButton
            color="success"
            variant="gradient"
            onClick={handleCrearFormatoEmision}
            disabled={creatingFormato}
          >
            {creatingFormato ? <CircularProgress size={20} /> : '✅ Emitir'}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default EmisionFormatos;
