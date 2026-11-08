import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Card,
  IconButton,
  Tooltip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ListAltIcon from '@mui/icons-material/ListAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Drawer from '@mui/material/Drawer';
import LinearProgress from '@mui/material/LinearProgress';
import Swal from 'sweetalert2';
import InputAdornment from '@mui/material/InputAdornment';
import FilterListIcon from '@mui/icons-material/FilterList';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDBadge from 'components/MDBadge';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import PdfUploadDialog from 'components/PdfUploadDialog';
import api, { API_BASE_URL } from 'services/api';

// Formato monetario peruano (sin prefijo de moneda)
const montoPeru = (valor) =>
  Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Color semántico del estado de la certificación
const colorEstadoCertificacion = (estado) => {
  const colores = { PENDIENTE: 'warning', APROBADO: 'success', RECHAZADO: 'error' };
  return colores[estado] || 'light';
};

// Sección del Drawer: número, título y tarjeta suave
const SeccionVer = ({ numero, titulo, children }) => (
  <MDBox mb={2.5}>
    <MDTypography variant="caption" fontWeight="bold" color="info" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {numero} · {titulo}
    </MDTypography>
    <MDBox mt={0.5} p={2} sx={{ border: '1px solid #e8eaed', borderRadius: '8px', backgroundColor: '#fafbfc' }}>
      {children}
    </MDBox>
  </MDBox>
);

// Dato con etiqueta; el valor va en MDBox para poder contener insignias
const DatoVer = ({ etiqueta, children }) => (
  <MDBox mb={1}>
    <MDTypography variant="caption" fontWeight="bold" color="secondary" display="block">
      {etiqueta}
    </MDTypography>
    <MDBox sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{children}</MDBox>
  </MDBox>
);

function GestionCertificacionesCredito() {
  const [certificaciones, setCertificaciones] = useState([]);
  const [metas, setMetas] = useState([]);
  const [fuentesFinanciamiento, setFuentesFinanciamiento] = useState([]);
  const [clasificadores, setClasificadores] = useState([]);
  const [ambitos, setAmbitos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetallesDialog, setOpenDetallesDialog] = useState(false);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingCertificacionId, setEditingCertificacionId] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [error, setError] = useState('');
  const [filtroAmbito, setFiltroAmbito] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pdfRutaActual, setPdfRutaActual] = useState(null);  // 🆕 Ruta del PDF actual
  const [pdfNombreActual, setPdfNombreActual] = useState(null);  // 🆕 Nombre del PDF actual
  const [pdfUrlSegura, setPdfUrlSegura] = useState(null);
  const [certificacionVer, setCertificacionVer] = useState(null);
  const [openFormatosDialog, setOpenFormatosDialog] = useState(false);
  const [formatosCertificacion, setFormatosCertificacion] = useState([]);
  const [formatosNumeroCertificacion, setFormatosNumeroCertificacion] = useState('');
  const [formatosLoading, setFormatosLoading] = useState(false);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState(null);
  const [openFormatoDetalleDialog, setOpenFormatoDetalleDialog] = useState(false);

  useEffect(() => {
    if (!pdfRutaActual) {
      setPdfUrlSegura(null);
      return undefined;
    }
    let urlTemporal = null;
    let cancelado = false;
    const cargarPdf = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/pdf/archivo-certificacion?ruta=${encodeURIComponent(pdfRutaActual)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        urlTemporal = URL.createObjectURL(await response.blob());
        if (cancelado) {
          URL.revokeObjectURL(urlTemporal);
          return;
        }
        setPdfUrlSegura(urlTemporal);
      } catch (error) {
        console.error('Error cargando PDF:', error);
        setPdfUrlSegura(null);
      }
    };
    cargarPdf();
    return () => {
      cancelado = true;
      if (urlTemporal) URL.revokeObjectURL(urlTemporal);
    };
  }, [pdfRutaActual]);
  const [formData, setFormData] = useState({
    nota: '',
    mes: '',
    fecha_aprobacion: '',
    fecha_documento: '',
    estado_certificacion: 'PENDIENTE',
    tipo_documento: '',
    numero_documento: '',
    justificacion: '',
    meta_id: null,
    fuente_financiamiento_id: null,
    monto_certificado: '',  // 🆕 Monto certificado
  });
  const [detalleFormData, setDetalleFormData] = useState({
    clasificador_id: null,
    monto: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [certRes, metasRes, ffRes, clasRes, ambitosRes] = await Promise.all([
        api.obtenerCertificacionesCredito(),
        api.obtenerMetas(),
        api.obtenerFuentesFinanciamiento(),
        api.obtenerClasificadores(),
        api.obtenerAmbitos(),
      ]);
      
      // 🆕 Calcular monto_utilizado para cada certificación
      const certificacionesConMontoUtilizado = await Promise.all(
        certRes.map(async (cert) => {
          try {
            const detalles = await api.obtenerDetallesCertificacion(cert.id);
            const montoUtilizado = detalles.reduce(
              (sum, detalle) => sum + parseFloat(detalle.monto_utilizado || 0),
              0
            );
            return {
              ...cert,
              monto_utilizado: montoUtilizado,
            };
          } catch (err) {
            console.error(`Error cargando detalles para certificación ${cert.id}:`, err);
            return {
              ...cert,
              monto_utilizado: 0,
            };
          }
        })
      );

      setCertificaciones(certificacionesConMontoUtilizado);
      setMetas(metasRes);
      setFuentesFinanciamiento(ffRes);
      setClasificadores(clasRes);
      setAmbitos(ambitosRes);
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudieron cargar los datos: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener solo los ámbitos que tienen certificaciones
  const obtenerAmbितosConCertificaciones = () => {
    const ambitosUsados = new Set();
    certificaciones.forEach(cert => {
      if (cert.ambito_nombre_corto) {
        ambitosUsados.add(cert.ambito_nombre_corto);
      }
    });
    
    return ambitos.filter(ambito => ambitosUsados.has(ambito.nombre_corto));
  };

  // Función para aplicar filtros
  const obtenerCertificacionesFiltradas = () => {
    let filtered = certificaciones;

    // Filtrar por ámbito si está seleccionado
    if (filtroAmbito) {
      filtered = filtered.filter(cert => cert.ambito_nombre_corto === filtroAmbito);
    }

    // Filtrar por estado si está seleccionado
    if (filtroEstado) {
      filtered = filtered.filter(cert => cert.estado_certificacion === filtroEstado);
    }

    return filtered;
  };

  const handleOpenDialog = (certificacion = null) => {
    // Función para convertir fechas al formato YYYY-MM-DD para inputs type="date"
    const convertirFechaParaInput = (fecha) => {
      if (!fecha) return '';
      
      // Si es ISO format (2026-02-26T05:00:00.000Z)
      if (typeof fecha === 'string' && fecha.includes('T')) {
        const fechaObj = new Date(fecha);
        const año = fechaObj.getFullYear();
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      }
      
      // Si ya está en formato YYYY-MM-DD
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      
      // Si es objeto Date
      if (fecha instanceof Date) {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      }
      
      return '';
    };

    if (certificacion) {
      setEditingId(certificacion.id);
      // 🆕 Cargar ruta del PDF si existe
      setPdfRutaActual(certificacion.ruta_archivo_pdf || null);
      setPdfNombreActual(certificacion.nombre_archivo_pdf || null);
      setFormData({
        nota: certificacion.nota,
        mes: certificacion.mes,
        fecha_aprobacion: convertirFechaParaInput(certificacion.fecha_aprobacion),
        fecha_documento: convertirFechaParaInput(certificacion.fecha_documento),
        estado_certificacion: certificacion.estado_certificacion,
        tipo_documento: certificacion.tipo_documento,
        numero_documento: certificacion.numero_documento,
        justificacion: certificacion.justificacion || '',
        meta_id: certificacion.meta_id || null,
        fuente_financiamiento_id: certificacion.fuente_financiamiento_id || null,
        monto_certificado: certificacion.monto_certificado || '',  // 🆕 Agregar monto
      });
    } else {
      setEditingId(null);
      setFormData({
        nota: '',
        mes: '',
        fecha_aprobacion: '',
        fecha_documento: '',
        estado_certificacion: 'PENDIENTE',
        tipo_documento: '',
        numero_documento: '',
        justificacion: '',
        meta_id: null,
        fuente_financiamiento_id: null,
        monto_certificado: '',  // 🆕 Inicializar monto
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // 🆕 Resetear ruta del PDF
    setPdfRutaActual(null);
    setPdfNombreActual(null);
    setFormData({
      nota: '',
      mes: '',
      fecha_aprobacion: '',
      fecha_documento: '',
      estado_certificacion: 'PENDIENTE',
      tipo_documento: '',
      numero_documento: '',
      justificacion: '',
      meta_id: null,
      fuente_financiamiento_id: null,
      monto_certificado: '',  // 🆕 Resetear monto
    });
    setEditingId(null);
  };

  const handleExtractedPdfData = async (extractedData) => {
    try {
      setLoading(true);

      // Crear la certificación con los datos extraídos
      const certificacionData = {
        nota: extractedData.nota,
        mes: extractedData.mes,
        fecha_aprobacion: extractedData.fecha_aprobacion,
        fecha_documento: extractedData.fecha_documento,
        estado_certificacion: extractedData.estado_certificacion,
        tipo_documento: extractedData.tipo_documento,
        numero_documento: extractedData.numero_documento,
        justificacion: extractedData.justificacion,
        meta_id: extractedData.meta_id,
        fuente_financiamiento_id: extractedData.fuente_financiamiento_id,
        monto_certificado: extractedData.monto_total || 0,
        detalles_raw: extractedData.detalles_raw || [],  // 🆕 AGREGAR DETALLES
      };

      let certificacionId;
      let esActualizacion = false;

      // Intentar crear, si duplicado entonces actualizar existente
      try {
        const certificacionRes = await api.crearCertificacionCredito(certificacionData);
        certificacionId = certificacionRes.id;
      } catch (err) {
        // Si es error 409 (duplicado), obtener ID y actualizar
        if (err.response?.status === 409) {
          certificacionId = err.response.data?.certificacion_id;
          if (certificacionId) {
            // 🆕 Actualizar en lugar de crear
            await api.actualizarCertificacionCredito(certificacionId, certificacionData);
            esActualizacion = true;
            console.log('✅ Certificación existente actualizada:', certificacionId);
          } else {
            throw err;  // Re-throw si no tenemos ID
          }
        } else {
          throw err;  // Re-throw si no es duplicado
        }
      }

      // Guardar el archivo PDF si existe
      const pdfFormData = new FormData();

      // Guardar el archivo PDF si existe
      if (extractedData.archivo_pdf_original) {
        try {
          console.log('🔍 DEBUG PDF:', {
            archivo: extractedData.archivo_pdf_original.name,
            tipo: extractedData.archivo_pdf_original.type,
            tamaño: extractedData.archivo_pdf_original.size,
            certificacion_id: certificacionId
          });

          pdfFormData.append('archivo', extractedData.archivo_pdf_original);
          pdfFormData.append('certificacion_id', certificacionId);
          
          console.log('📤 Enviando PDF al backend...');
          const token = localStorage.getItem('authToken');
          const pdfResponse = await fetch('http://localhost:5000/api/pdf/guardar-certificacion-pdf', {
            method: 'POST',
            body: pdfFormData,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('📋 Response status:', pdfResponse.status);

          if (!pdfResponse.ok) {
            const errorData = await pdfResponse.json();
            console.error('❌ Error guardando PDF (HTTP ' + pdfResponse.status + '):', errorData);
            // Mostrar alerta al usuario sobre el error del PDF
            Swal.fire({
              icon: 'warning',
              title: 'Advertencia',
              text: `La certificación se creó, pero hubo error guardando el PDF: ${errorData.error}`,
            });
          } else {
            const pdfData = await pdfResponse.json();
            console.log('✅ PDF guardado exitosamente:', pdfData);
          }
        } catch (err) {
          console.error('❌ Error en fetch PDF:', err.message);
          Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: `Error al guardar PDF: ${err.message}`,
          });
        }
      } else {
        console.warn('⚠️ No hay archivo PDF para guardar');
      }

      // 🆕 Los detalles ya se guardaron automáticamente en la creación/actualización
      // (el backend maneja detalles_raw y los guarda en la BD)
      const detallesGuardados = extractedData.detalles_raw ? extractedData.detalles_raw.length : 0;
      console.log(`✅ ${detallesGuardados} detalles guardados automáticamente por el backend`);

      setOpenPdfDialog(false);
      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: esActualizacion ? 'Actualización Exitosa' : 'Importación Exitosa',
        html: `
          <div style="text-align: left;">
            <p><strong>${esActualizacion ? 'Certificación actualizada' : 'Certificación creada'}:</strong> ${certificacionData.numero_documento}</p>
            <p><strong>Nota Nº:</strong> ${certificacionData.nota}</p>
            <p><strong>Monto Certificado:</strong> S/. ${extractedData.monto_total.toLocaleString('es-PE')}</p>
            <p><strong>Estado:</strong> ${certificacionData.estado_certificacion}</p>
            <p><strong>Detalles guardados:</strong> ${detallesGuardados} items</p>
          </div>
        `,
        confirmButtonText: 'Aceptar',
      });

      // Esperar a que BD se sincronice antes de recargar
      // (da tiempo a que el UPDATE de PDF se refleje)
      setTimeout(() => {
        console.log('📊 Recargando datos después de guardar PDF...');
        cargarDatos();
      }, 800);  // 800ms es suficiente para la mayoría de casos
    } catch (err) {
      setLoading(false);
      
      // Verificar si es un error de duplicado (409)
      const esDuplicado = err.response?.status === 409;
      
      Swal.fire({
        icon: esDuplicado ? 'warning' : 'error',
        title: esDuplicado ? 'Certificación Duplicada' : 'Error',
        text: esDuplicado 
          ? 'Ya existe una certificación con esta combinación de Nota, Mes y Número de Documento'
          : `No se pudo guardar la certificación: ${err.message}`,
      });
    }
  };

  // 🆕 Procesar PDF actual (ya cargado)
  const handleProcesarPdfActual = async () => {
    if (!pdfRutaActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin PDF',
        text: 'No hay PDF cargado para procesar'
      });
      return;
    }

    try {
      setLoading(true);
      
      Swal.fire({
        title: '⏳ Procesando PDF...',
        text: 'Extrayendo datos del PDF...',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: async () => {
          Swal.showLoading();
          
          try {
            // Enviar la ruta del PDF al backend para procesarlo
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/pdf/extract-certification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                rutaPdf: pdfRutaActual,  // Enviar la ruta del PDF existente
                procesarDesdeServidor: true
              })
            });

            if (!response.ok) {
              throw new Error('Error procesando PDF');
            }

            const resultado = await response.json();
            const extractedData = resultado.data;

            // Actualizar el formulario con los datos extraídos
            setFormData(prev => ({
              ...prev,
              nota: extractedData.nota || prev.nota,
              mes: extractedData.mes || prev.mes,
              fecha_aprobacion: extractedData.fecha_aprobacion || prev.fecha_aprobacion,
              fecha_documento: extractedData.fecha_documento || prev.fecha_documento,
              estado_certificacion: extractedData.estado_certificacion || prev.estado_certificacion,
              tipo_documento: extractedData.tipo_documento || prev.tipo_documento,
              numero_documento: extractedData.numero_documento || prev.numero_documento,
              justificacion: extractedData.justificacion || prev.justificacion,
              meta_id: extractedData.meta_id || prev.meta_id,
              fuente_financiamiento_id: extractedData.fuente_financiamiento_id || prev.fuente_financiamiento_id,
              monto_certificado: extractedData.monto_total || prev.monto_certificado,
            }));

            Swal.fire({
              title: '✅ PDF Procesado',
              html: `
                <div style="text-align: left;">
                  <p><strong>Datos extraídos:</strong></p>
                  <p>Nota: ${extractedData.nota}</p>
                  <p>Número: ${extractedData.numero_documento}</p>
                  <p>Estado: ${extractedData.estado_certificacion}</p>
                  <p>Monto: S/. ${extractedData.monto_total.toLocaleString('es-PE')}</p>
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'Actualizar Formulario'
            });

            setLoading(false);
          } catch (err) {
            console.error('Error extrayendo datos:', err);
            Swal.fire({
              title: '❌ Error',
              text: `Error procesando PDF: ${err.message}`,
              icon: 'error'
            });
            setLoading(false);
          }
        }
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error: ${err.message}`
      });
    }
  };

  const handleOpenDetallesDialog = async (certificacion) => {
    setEditingCertificacionId(certificacion.id);
    try {
      const detallesRes = await api.obtenerDetallesCertificacion(certificacion.id);
      setDetalles(detallesRes);
    } catch (err) {
      setError(`Error al cargar detalles: ${err.message}`);
    }
    setOpenDetallesDialog(true);
  };

  const handleCloseDetallesDialog = () => {
    setOpenDetallesDialog(false);
    setDetalles([]);
    setDetalleFormData({ clasificador_id: null, monto: '' });
    setEditingCertificacionId(null);
  };

  const handleOpenFormatosDialog = async (certificacion) => {
    setFormatosNumeroCertificacion(certificacion.numero_documento || '');
    setFormatosCertificacion([]);
    setFormatosLoading(true);
    setOpenFormatosDialog(true);
    try {
      const formatosRes = await api.obtenerFormatosCertificacion(certificacion.id);
      setFormatosCertificacion(formatosRes);
    } catch (err) {
      setError(`Error al cargar formatos: ${err.message}`);
    } finally {
      setFormatosLoading(false);
    }
  };

  const handleCloseFormatosDialog = () => {
    setOpenFormatosDialog(false);
    setFormatosCertificacion([]);
  };

  const handleVerFormatoDetalle = (formato) => {
    setFormatoSeleccionado(formato);
    setOpenFormatoDetalleDialog(true);
  };

  const handleCerrarFormatoDetalle = () => {
    setOpenFormatoDetalleDialog(false);
    setFormatoSeleccionado(null);
  };

  const formatearMontoFormato = (monto) =>
    parseFloat(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* eslint-disable react/prop-types, react/display-name */
  const totalFormatos = formatosCertificacion.reduce((suma, formato) => suma + Number(formato.total || 0), 0);
  const totalPartidas = formatoSeleccionado
    ? formatoSeleccionado.detalles.reduce((suma, detalle) => suma + Number(detalle.monto || 0), 0)
    : 0;

  const colorEstadoFormato = (estado) => {
    const colores = {
      BORRADOR: 'light',
      EMITIDO: 'info',
      ENVIADO: 'warning',
      PAGADO: 'primary',
      RINDIENDO: 'secondary',
      RENDIDO: 'success',
      DEVUELTO: 'error',
      ANULADO: 'dark',
      CANCELADO: 'dark',
    };
    return colores[estado] || 'light';
  };

  const columnasFormatosAfectados = [
    { Header: 'N° Formato', accessor: 'numero_documento', width: '16%' },
    { Header: 'Solicitado por', accessor: 'usuario_nombre', width: '28%', Cell: ({ value }) => value || '-' },
    {
      Header: 'Fecha',
      accessor: 'fecha_emision',
      width: '12%',
      Cell: ({ value }) => (value ? new Date(value).toLocaleDateString('es-PE') : '-'),
    },
    {
      Header: 'Estado',
      accessor: 'estado_emision',
      width: '12%',
      Cell: ({ value }) => (
        <MDBadge badgeContent={value} color={colorEstadoFormato(value)} variant="gradient" size="sm" />
      ),
    },
    {
      Header: 'Afecta presupuesto',
      accessor: 'afecta_presupuesto',
      width: '12%',
      Cell: ({ value }) => (
        <MDBadge
          badgeContent={value ? 'Sí' : 'No'}
          color={value ? 'success' : 'light'}
          variant="gradient"
          size="sm"
        />
      ),
    },
    {
      Header: 'Total (S/.)',
      accessor: 'total',
      width: '12%',
      Cell: ({ value }) => formatearMontoFormato(value),
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      width: '8%',
      Cell: ({ row }) => (
        <Tooltip title="Ver partidas">
          <IconButton
            size="small"
            onClick={() => handleVerFormatoDetalle(row.original)}
            color="info"
            sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}
          >
            <ListAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const columnasPartidasFormato = [
    { Header: 'Partida', accessor: 'partida', width: '25%' },
    { Header: 'Clasificador', accessor: 'clasificador_nombre', width: '55%' },
    {
      Header: 'Monto (S/.)',
      accessor: 'monto',
      width: '20%',
      Cell: ({ value }) => formatearMontoFormato(value),
    },
  ];
  /* eslint-enable react/prop-types, react/display-name */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' 
        ? null 
        : name.includes('_id') 
          ? parseInt(value) 
          : name === 'monto_certificado'
            ? parseFloat(value)
            : value,
    }));
  };

  const handleDetalleChange = (e) => {
    const { name, value } = e.target;
    setDetalleFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : (name === 'clasificador_id' ? parseInt(value) : parseFloat(value)),
    }));
  };

  const handleSave = async () => {
    if (!formData.nota || !formData.mes || !formData.tipo_documento || !formData.numero_documento) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Obligatorios',
        text: 'Por favor complete todos los campos requeridos',
      });
      return;
    }

    try {
      // Función para convertir fechas de DD/MM/YYYY a YYYY-MM-DD
      const convertirFecha = (fecha) => {
        if (!fecha) return '';
        // Si ya está en formato YYYY-MM-DD, retornar como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha;
        }
        // Si está en formato DD/MM/YYYY, convertir
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha)) {
          const partes = fecha.split('/');
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        return fecha;
      };

      // Preparar datos con fechas convertidas
      const datosParaGuardar = {
        ...formData,
        fecha_aprobacion: convertirFecha(formData.fecha_aprobacion),
        fecha_documento: convertirFecha(formData.fecha_documento),
      };

      if (editingId) {
        await api.actualizarCertificacionCredito(editingId, datosParaGuardar);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Certificación actualizada correctamente',
        });
      } else {
        await api.crearCertificacionCredito(datosParaGuardar);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Certificación creada correctamente',
        });
      }
      handleCloseDialog();
      cargarDatos();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    }
  };

  const handleAgregarDetalle = async () => {
    if (!detalleFormData.clasificador_id || !detalleFormData.monto) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Obligatorios',
        text: 'Por favor complete todos los campos del detalle',
      });
      return;
    }

    try {
      await api.crearDetalleCertificacion({
        certificacion_credito_id: editingCertificacionId,
        ...detalleFormData,
      });
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Detalle agregado correctamente',
      });
      const detallesRes = await api.obtenerDetallesCertificacion(editingCertificacionId);
      setDetalles(detallesRes);
      setDetalleFormData({ clasificador_id: null, monto: '' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    }
  };

  const handleEliminarDetalle = async (detalleId) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'No podrá revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.eliminarDetalleCertificacion(detalleId);
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Detalle eliminado correctamente',
          });
          const detallesRes = await api.obtenerDetallesCertificacion(editingCertificacionId);
          setDetalles(detallesRes);
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message,
          });
        }
      }
    });
  };

  const handleEliminar = async (id) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'No podrá revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.eliminarCertificacionCredito(id);
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Certificación eliminada correctamente',
          });
          cargarDatos();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message,
          });
        }
      }
    });
  };

  const handleVerPdf = async (certificacion) => {
    if (!certificacion.tiene_pdf) {
      Swal.fire({
        icon: 'info',
        title: 'Sin PDF',
        text: 'Esta certificación no tiene un PDF asociado',
      });
      return;
    }

    try {
      // Descargar PDF desde el servidor
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:5000/api/pdf/descargar-certificacion/${certificacion.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error al descargar PDF: ${response.status}`);
      }

      // Convertir response a blob
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      // Crear un modal con la vista previa del PDF
      const pdfWindow = window.open('', '', 'width=900,height=700');
      pdfWindow.document.write(`
        <html>
          <head>
            <title>PDF - ${certificacion.numero_documento}</title>
            <style>
              body { margin: 0; padding: 10px; font-family: Arial; }
              .header { background: #1976d2; color: white; padding: 15px; border-radius: 4px; margin-bottom: 10px; }
              .header h2 { margin: 0; }
              .header p { margin: 5px 0; font-size: 0.9em; }
              embed { width: 100%; height: 600px; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📄 ${certificacion.numero_documento}</h2>
              <p>Nota: ${certificacion.nota}</p>
              <p>Mes: ${certificacion.mes}</p>
            </div>
            <embed src="${pdfUrl}" type="application/pdf" />
          </body>
        </html>
      `);
      pdfWindow.document.close();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo abrir el PDF: ${err.message}`,
      });
    }
  };

  // Componente para celda de acciones
  const AccionesCell = (cellProps) => {
    const data = cellProps.row.original;
    return (
      <MDBox display="flex" gap={1} flexWrap="wrap">
        <Tooltip title="Visualizar">
          <IconButton
            size="small"
            onClick={() => setCertificacionVer(data)}
            color="info"
            sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(data)}
            color="info"
            sx={{
              backgroundColor: '#e3f2fd',
              '&:hover': { backgroundColor: '#bbdefb' },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Detalles">
          <IconButton
            size="small"
            onClick={() => handleOpenDetallesDialog(data)}
            color="info"
            sx={{
              backgroundColor: '#e3f2fd',
              '&:hover': { backgroundColor: '#bbdefb' },
            }}
          >
            <AddCircleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Formatos afectados">
          <IconButton
            size="small"
            onClick={() => handleOpenFormatosDialog(data)}
            color="secondary"
            sx={{
              backgroundColor: '#f3e5f5',
              '&:hover': { backgroundColor: '#e1bee7' },
            }}
          >
            <ListAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={data.tiene_pdf ? "Ver PDF" : "Sin PDF"}>
          <IconButton
            size="small"
            onClick={() => handleVerPdf(data)}
            color="warning"
            disabled={!data.tiene_pdf}
            sx={{
              backgroundColor: '#fff3e0',
              '&:hover': { backgroundColor: '#ffe0b2' },
              '&.Mui-disabled': { backgroundColor: '#f5f5f5' },
            }}
          >
            <PictureAsPdfIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton
            size="small"
            onClick={() => handleEliminar(data.id)}
            color="error"
            sx={{
              backgroundColor: '#ffebee',
              '&:hover': { backgroundColor: '#ffcdd2' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MDBox>
    );
  };

  AccionesCell.propTypes = {
    row: PropTypes.shape({
      original: PropTypes.shape({
        id: PropTypes.number,
      }),
    }),
  };

  // Función para formatear fechas de YYYY-MM-DD o ISO a DD/MM/YYYY
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    
    try {
      // Si es ISO format (2026-02-26T05:00:00.000Z)
      if (typeof fecha === 'string' && fecha.includes('T')) {
        const fechaObj = new Date(fecha);
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const año = fechaObj.getFullYear();
        return `${dia}/${mes}/${año}`;
      }
      
      // Si está en formato YYYY-MM-DD
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const partes = fecha.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      
      // Si es objeto Date
      if (fecha instanceof Date) {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
      }
    } catch (e) {
      console.warn('Error al formatear fecha:', fecha, e);
    }
    
    // Si ya está en otro formato, retornar como está
    return fecha;
  };

  // Componente personalizado para la columna de Fecha Aprobación
  const FechaAprobacionCell = (cellProps) => {
    // eslint-disable-next-line react/prop-types
    const fecha = cellProps.row.original.fecha_aprobacion;
    return <span>{formatearFecha(fecha)}</span>;
  };

  // Componente personalizado para la columna de Monto Total
  const MontoTotalCell = (cellProps) => {
    // eslint-disable-next-line react/prop-types
    const monto = cellProps.row.original.monto_total;
    const montoFormateado = parseFloat(monto || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return <span>S/. {montoFormateado}</span>;
  };

  // 🆕 Componente personalizado para la columna de Monto Certificado
  const MontoCertificadoCell = (cellProps) => {
    // eslint-disable-next-line react/prop-types
    const monto = cellProps.row.original.monto_certificado;
    const montoFormateado = parseFloat(monto || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return <span>S/. {montoFormateado}</span>;
  };

  // 🆕 Componente personalizado para la columna de Monto Utilizado
  const MontoUtilizadoCell = (cellProps) => {
    // eslint-disable-next-line react/prop-types
    const montoUtilizado = cellProps.row.original.monto_utilizado;
    const montoFormateado = parseFloat(montoUtilizado || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    // Color rojo si hay monto utilizado, gris si es 0
    const color = parseFloat(montoUtilizado || 0) > 0 ? '#ff6b6b' : '#666';
    
    return <span style={{ color, fontWeight: '600' }}>S/. {montoFormateado}</span>;
  };

  // Totales sobre la lista completa de certificaciones (no solo la página visible)
  const totalCertificado = certificaciones.reduce((suma, c) => suma + parseFloat(c.monto_certificado || 0), 0);
  const totalUtilizado = certificaciones.reduce((suma, c) => suma + parseFloat(c.monto_utilizado || 0), 0);

  // Contenido del Drawer de visualización: todos los datos de la certificación, por secciones
  const renderVerCertificacion = (c) => {
    const certificado = parseFloat(c.monto_certificado || 0);
    const utilizado = parseFloat(c.monto_utilizado || 0);
    const saldo = certificado - utilizado;
    const pctUtilizado = certificado > 0 ? (utilizado / certificado) * 100 : 0;
    const pctDisponible = certificado > 0 ? (saldo / certificado) * 100 : 0;
    return (
      <>
        <SeccionVer numero="01" titulo="Información general">
          <DatoVer etiqueta="Nota">{c.nota || '-'}</DatoVer>
          <DatoVer etiqueta="Mes">{c.mes || '-'}</DatoVer>
          <DatoVer etiqueta="Justificación">{c.justificacion || '-'}</DatoVer>
        </SeccionVer>
        <SeccionVer numero="02" titulo="Identificación documental">
          <DatoVer etiqueta="N° de documento">{c.numero_documento || '-'}</DatoVer>
          <DatoVer etiqueta="Tipo de documento">{c.tipo_documento || '-'}</DatoVer>
          <DatoVer etiqueta="Fecha del documento">{formatearFecha(c.fecha_documento)}</DatoVer>
          <DatoVer etiqueta="Fecha de aprobación">{formatearFecha(c.fecha_aprobacion)}</DatoVer>
        </SeccionVer>
        <SeccionVer numero="03" titulo="Información presupuestal">
          <DatoVer etiqueta="Meta">{c.numero_meta || '-'}</DatoVer>
          <DatoVer etiqueta="Ámbito">{c.ambito_nombre_corto || '-'}</DatoVer>
          <DatoVer etiqueta="Fuente de financiamiento">{c.fuente_financiamiento_abreviatura || '-'}</DatoVer>
          <DatoVer etiqueta="Monto certificado">{montoPeru(certificado)}</DatoVer>
        </SeccionVer>
        <SeccionVer numero="04" titulo="Ejecución y utilización">
          <MDBox display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={1.5} mb={2}>
            <DatoVer etiqueta="Certificado">{montoPeru(certificado)}</DatoVer>
            <DatoVer etiqueta="Utilizado">{montoPeru(utilizado)}</DatoVer>
            <DatoVer etiqueta="Saldo disponible">{montoPeru(saldo)}</DatoVer>
          </MDBox>
          <MDTypography variant="caption" fontWeight="bold" color="secondary" display="block">
            Utilizado: {pctUtilizado.toFixed(1)}% · Disponible: {pctDisponible.toFixed(1)}%
          </MDTypography>
          <LinearProgress
            variant="determinate"
            value={Math.min(pctUtilizado, 100)}
            sx={{ mt: 1, height: 8, borderRadius: 4 }}
          />
          {utilizado > certificado && (
            <MDTypography variant="caption" color="error" display="block" mt={1}>
              La utilización supera el monto certificado.
            </MDTypography>
          )}
        </SeccionVer>
        <SeccionVer numero="05" titulo="Estado de certificación">
          <DatoVer etiqueta="Estado">
            <MDBadge
              badgeContent={c.estado_certificacion || '-'}
              color={colorEstadoCertificacion(c.estado_certificacion)}
              variant="gradient"
              size="sm"
            />
          </DatoVer>
          <DatoVer etiqueta="Documento PDF">{c.tiene_pdf ? 'Disponible (botón Ver PDF)' : 'Sin PDF'}</DatoVer>
        </SeccionVer>
      </>
    );
  };

  const columnasTabla = [
    {
      Header: 'Item',
      accessor: 'item',
      width: '4%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => row.index + 1,
    },
    {
      Header: 'Nota',
      accessor: 'nota',
      width: '12%',
      Cell: ({ value }) => (
        <MDTypography variant="button" fontWeight="bold" color="info">
          {value || '-'}
        </MDTypography>
      ),
    },
    { Header: 'Documento', accessor: 'numero_documento', width: '13%' },
    {
      Header: 'Periodo',
      accessor: 'mes',
      width: '10%',
      Cell: ({ row: { original } }) => (
        <MDBox lineHeight={1.3}>
          <MDTypography variant="button" fontWeight="medium" display="block">
            {original.mes || '-'}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            {formatearFecha(original.fecha_aprobacion)}
          </MDTypography>
        </MDBox>
      ),
    },
    { Header: 'Meta', accessor: 'numero_meta', width: '6%' },
    { Header: 'Ámbito', accessor: 'ambito_nombre_corto', width: '10%' },
    { Header: 'Fuente', accessor: 'fuente_financiamiento_abreviatura', width: '8%' },
    {
      Header: 'Importes',
      accessor: 'monto_certificado',
      width: '11%',
      Cell: ({ row: { original } }) => (
        <MDBox lineHeight={1.3}>
          <MDTypography variant="button" fontWeight="bold" color="dark" display="block">
            {montoPeru(original.monto_certificado)}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            Utilizado: {montoPeru(original.monto_utilizado)}
          </MDTypography>
        </MDBox>
      ),
    },
    {
      Header: 'Estado',
      accessor: 'estado_certificacion',
      width: '10%',
      Cell: ({ value }) => (
        <MDBadge badgeContent={value || '-'} color={colorEstadoCertificacion(value)} variant="gradient" size="sm" />
      ),
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      width: '16%',
      Cell: AccionesCell,
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card>
          <MDBox
            mx={2}
            mt={-3}
            py={3}
            px={2}
            variant="gradient"
            bgColor="info"
            borderRadius="lg"
            coloredShadow="info"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <MDBox>
              <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
                Gestión de Certificaciones de Crédito Presupuestario
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Administre las certificaciones de crédito presupuestario y sus detalles.
              </MDTypography>
            </MDBox>
            <MDBox display="flex" gap={1}>
              <MDButton
                variant="contained"
                color="white"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nueva Certificación
              </MDButton>
              <MDButton
                variant="contained"
                color="warning"
                startIcon={<CloudUploadIcon />}
                onClick={() => setOpenPdfDialog(true)}
              >
                Importar desde PDF
              </MDButton>
            </MDBox>
          </MDBox>

        {error && (
          <MDBox mb={2} p={2} sx={{ backgroundColor: '#ffebee', borderRadius: 1 }}>
            <MDTypography color="error">{error}</MDTypography>
          </MDBox>
        )}

        {loading ? (
          <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </MDBox>
        ) : (
          <>
            {/* Indicadores sobre el conjunto completo de certificaciones */}
            <MDBox px={2} pt={2}>
              <MDBox display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={2}>
                {[
                  { etiqueta: 'Certificaciones', valor: certificaciones.length },
                  { etiqueta: 'Monto certificado', valor: montoPeru(totalCertificado) },
                  { etiqueta: 'Monto utilizado', valor: montoPeru(totalUtilizado) },
                  { etiqueta: 'Saldo disponible', valor: montoPeru(totalCertificado - totalUtilizado) },
                ].map((item) => (
                  <MDBox
                    key={item.etiqueta}
                    p={2}
                    sx={{ border: '1px solid #e8eaed', borderRadius: '8px', backgroundColor: '#fff' }}
                  >
                    <MDTypography variant="caption" color="secondary" fontWeight="bold" display="block">
                      {item.etiqueta}
                    </MDTypography>
                    <MDTypography variant="h6" fontWeight="bold" color="dark">
                      {item.valor}
                    </MDTypography>
                  </MDBox>
                ))}
              </MDBox>
            </MDBox>

            {/* Panel de Filtros */}
            <MDBox px={2} pt={2}>
              <MDBox p={2}>

                <MDBox display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'flex-end' }} flexWrap="wrap">
                  <TextField
                    label="Filtrar por Ámbito"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterListIcon sx={{ color: '#1A73E8' }} />
                        </InputAdornment>
                      ),
                    }}
                    select
                    value={filtroAmbito || ''}
                    onChange={(e) => setFiltroAmbito(e.target.value || null)}
                    size="small"
                    sx={{
                      minWidth: 240,
                      backgroundColor: '#fff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#1A73E8', borderWidth: '2px' },
                        '&:hover fieldset': { borderColor: '#1557b0' },
                        '&.Mui-focused fieldset': { borderColor: '#1557b0' },
                      },
                      '& .MuiInputLabel-root': { color: '#1A73E8', fontWeight: 600 },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#1557b0' },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todos los Ámbitos</em>
                    </MenuItem>
                    {obtenerAmbितosConCertificaciones().map((ambito) => (
                      <MenuItem key={ambito.id} value={ambito.nombre_corto}>
                        {ambito.nombre_corto}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Filtrar por Estado"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterListIcon sx={{ color: '#1A73E8' }} />
                        </InputAdornment>
                      ),
                    }}
                    select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    size="small"
                    sx={{
                      minWidth: 240,
                      backgroundColor: '#fff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#1A73E8', borderWidth: '2px' },
                        '&:hover fieldset': { borderColor: '#1557b0' },
                        '&.Mui-focused fieldset': { borderColor: '#1557b0' },
                      },
                      '& .MuiInputLabel-root': { color: '#1A73E8', fontWeight: 600 },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#1557b0' },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todos los Estados</em>
                    </MenuItem>
                    <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
                    <MenuItem value="APROBADO">APROBADO</MenuItem>
                    <MenuItem value="RECHAZADO">RECHAZADO</MenuItem>
                  </TextField>

                  <MDButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={() => {
                      setFiltroAmbito(null);
                      setFiltroEstado('');
                    }}
                  >
                    Limpiar Filtros
                  </MDButton>

                </MDBox>
              </MDBox>
            </MDBox>

            {/* Tabla de Certificaciones */}
            <MDBox p={2}>
                <DataTable
                  table={{
                    columns: columnasTabla,
                    rows: obtenerCertificacionesFiltradas(),
                  }}
                  canSearch
                  isSorted={false}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries={true}
                  noEndBorder
                  vistaMovil
                />
            </MDBox>
          </>
        )}
        </Card>
      </MDBox>

      {/* Drawer de visualización de la certificación */}
      <Drawer
        anchor="right"
        open={Boolean(certificacionVer)}
        onClose={() => setCertificacionVer(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <MDBox px={3} py={2} display="flex" justifyContent="space-between" alignItems="center" sx={{ backgroundColor: '#1A73E8' }}>
          <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
            Certificación {certificacionVer?.nota || ''}
          </MDTypography>
          <IconButton size="small" onClick={() => setCertificacionVer(null)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </MDBox>
        <MDBox p={3}>{certificacionVer && renderVerCertificacion(certificacionVer)}</MDBox>
      </Drawer>
      {/* Dialog para crear/editar certificación */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth={false}
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '95vw',
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          {editingId ? 'Editar Certificación' : 'Nueva Certificación de Crédito'}
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: 2, 
          pt: 2,
          flex: 1,
          overflow: 'auto',
          height: '100%'
        }}>
          {/* Columna izquierda: Formulario */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
            label="Nota"
            name="nota"
            value={formData.nota}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Mes"
            name="mes"
            value={formData.mes}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Fecha de Aprobación"
            name="fecha_aprobacion"
            type="date"
            value={formData.fecha_aprobacion}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fecha de Documento"
            name="fecha_documento"
            type="date"
            value={formData.fecha_documento}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Estado de Certificación"
            name="estado_certificacion"
            value={formData.estado_certificacion}
            onChange={handleChange}
            select
            fullWidth
          >
            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
            <MenuItem value="APROBADO">Aprobado</MenuItem>
            <MenuItem value="APROBADA">Aprobada</MenuItem>
            <MenuItem value="RECHAZADO">Rechazado</MenuItem>
            <MenuItem value="RECHAZADA">Rechazada</MenuItem>
          </TextField>
          <TextField
            label="Tipo de Documento"
            name="tipo_documento"
            value={formData.tipo_documento}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Número de Documento"
            name="numero_documento"
            value={formData.numero_documento}
            onChange={handleChange}
            fullWidth
            required
          />
          {/* 🆕 Monto Certificado */}
          <TextField
            label="Monto Certificado (S/.)"
            name="monto_certificado"
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            value={formData.monto_certificado || ''}
            onChange={handleChange}
            fullWidth
            placeholder="0.00"
          />
          <TextField
            label="Justificación"
            name="justificacion"
            value={formData.justificacion}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
          <Autocomplete
            options={metas}
            getOptionLabel={(option) =>
              typeof option === 'string'
                ? option
                : `${option.numero_meta || ''} - ${option.nombre || ''}`
            }
            value={metas.find((m) => m.id === formData.meta_id) || null}
            onChange={(event, newValue) => {
              setFormData({
                ...formData,
                meta_id: newValue?.id || null,
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Meta"
                placeholder="Buscar meta..."
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {option.numero_meta} - {option.nombre}
                  </div>
                </div>
              </li>
            )}
            noOptionsText="Sin metas disponibles"
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            sx={{ width: '100%' }}
          />
          <Autocomplete
            options={fuentesFinanciamiento}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.nombre || ''
            }
            value={
              fuentesFinanciamiento.find(
                (ff) => ff.id === formData.fuente_financiamiento_id
              ) || null
            }
            onChange={(event, newValue) => {
              setFormData({
                ...formData,
                fuente_financiamiento_id: newValue?.id || null,
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Fuente de Financiamiento"
                placeholder="Buscar fuente..."
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <div>
                  <div style={{ fontWeight: 500 }}>{option.nombre}</div>
                </div>
              </li>
            )}
            noOptionsText="Sin fuentes disponibles"
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            sx={{ width: '100%' }}
          />
          </Box>

          {/* Columna derecha: Vista previa PDF */}
          {editingId && (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1, 
              maxHeight: 'none',
              height: '100%',
              overflowY: 'auto', 
              border: '1px solid #ccc', 
              borderRadius: '4px', 
              p: 2, 
              backgroundColor: '#f5f5f5' 
            }}>
              <MDTypography variant="h6" fontWeight="bold" mb={1}>
                📄 Vista Previa PDF
              </MDTypography>
              
              {pdfRutaActual ? (
                <>
                  <MDTypography variant="caption" color="success" mb={1} fontWeight="bold">
                    ✅ PDF Cargado: {pdfNombreActual}
                  </MDTypography>
                  
                  {/* Vista previa del PDF - Iframe para visualizar */}
                  <Box sx={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '4px',
                    border: '2px solid #2196F3',
                    mb: 1,
                    overflow: 'hidden'
                  }}>
                    <iframe
                      src={pdfUrlSegura || undefined}
                      style={{
                        width: '100%',
                        height: '800px',
                        border: 'none',
                        borderRadius: '4px',
                        flex: 1
                      }}
                      title="Vista Previa PDF"
                    />
                  </Box>
                  
                  {/* Botón para abrir PDF en nueva ventana */}
                  <MDButton
                    variant="outlined"
                    color="info"
                    onClick={() => pdfUrlSegura && window.open(pdfUrlSegura, '_blank')}
                    fullWidth
                    sx={{ mb: 1 }}
                    disabled={loading}
                  >
                    👁️ Ver PDF en Nueva Ventana
                  </MDButton>

                  {/* Botones para procesar y subir nuevo */}
                  <MDButton
                    variant="contained"
                    color="success"
                    onClick={handleProcesarPdfActual}
                    fullWidth
                    sx={{ mb: 1 }}
                    disabled={loading}
                  >
                    � Procesar PDF y Cargar Datos
                  </MDButton>

                  <MDButton
                    variant="outlined"
                    color="primary"
                    onClick={() => setOpenPdfDialog(true)}
                    fullWidth
                  >
                    📤 Subir Nuevo PDF
                  </MDButton>
                </>
              ) : (
                <>
                  <MDTypography variant="caption" color="text" mb={2}>
                    No hay PDF cargado aún. Sube uno para comenzar.
                  </MDTypography>
                  <Box sx={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '4px', 
                    p: 2, 
                    minHeight: '300px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#999',
                    border: '2px dashed #ccc'
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PictureAsPdfIcon sx={{ fontSize: '60px', color: '#ccc', mb: 1 }} />
                      <MDTypography variant="body2">
                        PDF no cargado aún
                      </MDTypography>
                    </Box>
                  </Box>
                  
                  <MDButton
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenPdfDialog(true)}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    📤 Cargar PDF
                  </MDButton>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ 
              backgroundColor: '#1976d2',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para formatos afectados a la certificación */}
      <Dialog
        open={openFormatosDialog}
        onClose={handleCloseFormatosDialog}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '1150px',
            maxWidth: '95vw',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: '600',
            fontSize: '1.3rem',
            pb: 2,
            backgroundColor: '#fff',
            color: '#2c3e50',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          Formatos afectados a la certificación
          {formatosNumeroCertificacion && (
            <MDTypography
              variant="caption"
              sx={{ display: 'block', mt: 0.5, fontSize: '0.85rem', color: '#666', fontWeight: '500' }}
            >
              Certificación {formatosNumeroCertificacion}
            </MDTypography>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, pb: 2, px: 2, overflow: 'auto' }}>
          {formatosLoading ? (
            <MDBox display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </MDBox>
          ) : formatosCertificacion.length === 0 ? (
            <MDTypography variant="body2" color="text" textAlign="center" py={4}>
              Esta certificación no tiene formatos asignados.
            </MDTypography>
          ) : (
            <Card
              sx={{
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e8eaed',
                overflow: 'hidden',
              }}
            >
              <DataTable
                table={{ columns: columnasFormatosAfectados, rows: formatosCertificacion }}
                canSearch
                isSorted={false}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries
                noEndBorder
              />
              <MDBox
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                gap={2}
                px={3}
                py={1.5}
                sx={{ borderTop: '2px solid #667eea', backgroundColor: '#fafafa' }}
              >
                <MDTypography variant="button" fontWeight="bold" color="dark">TOTAL</MDTypography>
                <MDTypography variant="button" fontWeight="bold" color="dark">
                  S/. {formatearMontoFormato(totalFormatos)}
                </MDTypography>
              </MDBox>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
          <MDButton onClick={handleCloseFormatosDialog} variant="outlined" color="secondary">
            Cerrar
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Dialog para partidas de un formato afectado */}
      <Dialog
        open={openFormatoDetalleDialog}
        onClose={handleCerrarFormatoDetalle}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: '600',
            fontSize: '1.3rem',
            pb: 2,
            backgroundColor: '#fff',
            color: '#2c3e50',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          Partidas del formato {formatoSeleccionado?.numero_documento}
          {formatoSeleccionado && (
            <MDTypography
              variant="caption"
              sx={{ display: 'block', mt: 0.5, fontSize: '0.85rem', color: '#666', fontWeight: '500' }}
            >
              Solicitado por {formatoSeleccionado.usuario_nombre || '-'} • Estado {formatoSeleccionado.estado_emision}
            </MDTypography>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, pb: 2, px: 2, overflow: 'auto' }}>
          {formatoSeleccionado && (
            <Card
              sx={{
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e8eaed',
                overflow: 'hidden',
              }}
            >
              <DataTable
                table={{ columns: columnasPartidasFormato, rows: formatoSeleccionado.detalles }}
                isSorted={false}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries
                noEndBorder
              />
              <MDBox
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                gap={2}
                px={3}
                py={1.5}
                sx={{ borderTop: '2px solid #667eea', backgroundColor: '#fafafa' }}
              >
                <MDTypography variant="button" fontWeight="bold" color="dark">TOTAL</MDTypography>
                <MDTypography variant="button" fontWeight="bold" color="dark">
                  S/. {formatearMontoFormato(totalPartidas)}
                </MDTypography>
              </MDBox>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
          <MDButton onClick={handleCerrarFormatoDetalle} variant="outlined" color="secondary">
            Cerrar
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Dialog para detalles de certificación */}
      <Dialog
        open={openDetallesDialog}
        onClose={handleCloseDetallesDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            height: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: '600',
            fontSize: '1.3rem',
            pb: 2,
            backgroundColor: '#fff',
            color: '#2c3e50',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          Detalles de Certificación
          {detalleFormData.nota && (
            <MDTypography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                fontSize: '0.85rem',
                color: '#666',
                fontWeight: '500',
              }}
            >
              Nota #{detalleFormData.nota} • Mes {detalleFormData.mes}
            </MDTypography>
          )}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            pt: 2,
            pb: 2,
            px: 2,
            maxHeight: '70vh',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MDBox display="flex" gap={2} mb={3}>
            <Autocomplete
              options={clasificadores}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `${option.partida || ''} - ${option.nombre || ''}`
              }
              value={
                clasificadores.find((cl) => cl.id === detalleFormData.clasificador_id) ||
                null
              }
              onChange={(event, newValue) => {
                setDetalleFormData({
                  ...detalleFormData,
                  clasificador_id: newValue?.id || null,
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar Clasificador"
                  placeholder="Partida - Nombre..."
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#fafafa',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.95rem' }}>
                      {option.partida}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                      {option.nombre}
                    </div>
                  </div>
                </li>
              )}
              noOptionsText="Sin clasificadores disponibles"
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              sx={{ width: '100%' }}
            />
            <TextField
              label="Monto"
              name="monto"
              type="number"
              value={detalleFormData.monto}
              onChange={handleDetalleChange}
              fullWidth
              inputProps={{ step: '0.01' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                  },
                },
              }}
            />
            <MDButton
              variant="contained"
              color="success"
              onClick={handleAgregarDetalle}
              sx={{
                mt: 0.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              Agregar
            </MDButton>
          </MDBox>

          {detalles.length === 0 ? (
            <MDBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <MDTypography variant="body2" color="textSecondary">
                No hay detalles para esta certificación
              </MDTypography>
            </MDBox>
          ) : (
            (() => {
              // Crear filas para DataTable
              const rows = detalles.map((detalle) => ({
                id: detalle.id,
                partida: detalle.partida,
                clasificador_nombre: detalle.clasificador_nombre,
                monto: detalle.monto,
                monto_utilizado: detalle.monto_utilizado || 0,  // 🆕 Agregar monto_utilizado
              }));

              // Agregar fila de totales
              const totalMonto = detalles.reduce((sum, detalle) => sum + parseFloat(detalle.monto || 0), 0);
              const totalUtilizado = detalles.reduce((sum, detalle) => sum + parseFloat(detalle.monto_utilizado || 0), 0);  // 🆕 Total utilizado
              rows.push({
                id: 'total',
                partida: 'TOTAL',
                clasificador_nombre: '',
                monto: totalMonto,
                monto_utilizado: totalUtilizado,  // 🆕 Agregar total utilizado
                saldo_disponible: totalMonto - totalUtilizado,  // 🆕 Calcular saldo disponible total
              });

              /* eslint-disable react/prop-types */
              const columns = [
                {
                  Header: 'Partida',
                  accessor: 'partida',
                  width: '17%',
                  Cell: ({ cell }) => {
                    const isTotal = cell.row.original.id === 'total';
                    return (
                      <div
                        style={{
                          fontWeight: isTotal ? '700' : '600',
                          color: '#2c3e50',
                          fontSize: isTotal ? '1rem' : '0.95rem',
                          padding: isTotal ? '10px' : '8px 0',
                          borderTop: isTotal ? '2px solid #667eea' : 'none',
                        }}
                      >
                        {cell.value}
                      </div>
                    );
                  },
                },
                {
                  Header: 'Clasificador',
                  accessor: 'clasificador_nombre',
                  width: '30%',
                  Cell: ({ cell }) => {
                    const isTotal = cell.row.original.id === 'total';
                    return (
                      <div
                        style={{
                          fontWeight: isTotal ? '700' : '500',
                          color: isTotal ? '#2c3e50' : '#555',
                          padding: isTotal ? '10px' : '8px 0',
                          borderTop: isTotal ? '2px solid #667eea' : 'none',
                        }}
                      >
                        {cell.value}
                      </div>
                    );
                  },
                },
                {
                  Header: 'Monto',
                  accessor: 'monto',
                  width: '15%',
                  Cell: ({ cell }) => {
                    const isTotal = cell.row.original.id === 'total';
                    const valor = parseFloat(cell.value || 0);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          width: '100%',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: isTotal ? '700' : '600',
                            color: '#2c3e50',
                            padding: isTotal ? '10px 12px' : '8px 12px',
                            fontSize: isTotal ? '1rem' : '0.95rem',
                            textAlign: 'right',
                            borderTop: isTotal ? '2px solid #667eea' : 'none',
                          }}
                        >
                          S/. {valor.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  Header: 'Utilizado',
                  accessor: 'monto_utilizado',
                  width: '14%',
                  Cell: ({ cell }) => {
                    const isTotal = cell.row.original.id === 'total';
                    const valor = parseFloat(cell.value || 0);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          width: '100%',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: isTotal ? '700' : '600',
                            color: valor > 0 ? '#ff6b6b' : '#666',
                            padding: isTotal ? '10px 12px' : '8px 12px',
                            fontSize: isTotal ? '1rem' : '0.95rem',
                            textAlign: 'right',
                            borderTop: isTotal ? '2px solid #667eea' : 'none',
                          }}
                        >
                          S/. {valor.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  Header: 'Disponible',
                  accessor: 'saldo_disponible',
                  width: '15%',
                  Cell: ({ cell }) => {
                    const isTotal = cell.row.original.id === 'total';
                    const monto = parseFloat(cell.row.original.monto || 0);
                    const montoUtilizado = parseFloat(cell.row.original.monto_utilizado || 0);
                    const saldoDisponible = monto - montoUtilizado;
                    
                    // Color según disponibilidad
                    let colorSaldo = '#27ae60'; // Verde
                    if (saldoDisponible < (monto * 0.2)) colorSaldo = '#f39c12'; // Naranja (< 20%)
                    if (saldoDisponible <= 0) colorSaldo = '#e74c3c'; // Rojo (sin saldo)
                    
                    return (
                      <div
                        style={{
                          display: 'flex',
                          width: '100%',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: isTotal ? '700' : '600',
                            color: isTotal ? '#2c3e50' : colorSaldo,
                            padding: isTotal ? '10px 12px' : '8px 12px',
                            fontSize: isTotal ? '1rem' : '0.95rem',
                            textAlign: 'right',
                            borderTop: isTotal ? '2px solid #667eea' : 'none',
                          }}
                        >
                          S/. {saldoDisponible.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  Header: 'Acciones',
                  accessor: 'acciones',
                  width: '9%',
                  Cell: ({ cell }) => {
                    const isTotal = cell.row.original.id === 'total';
                    if (isTotal) return null;
                    const detailId = cell.row.original.id;
                    return (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleEliminarDetalle(detailId)}
                            color="error"
                            sx={{
                              borderRadius: '6px',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              },
                            }}
                            sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    );
                  },
                },
              ];
              /* eslint-enable react/prop-types */

              return (
                <Card
                  sx={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e8eaed',
                    overflow: 'hidden',
                  }}
                >
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={false}
                    entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                    showTotalEntries
                    noEndBorder
                  />
                </Card>
              );
            })()
          )}
        </DialogContent>
        <DialogActions
          sx={{
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        >
          <MDButton
            onClick={handleCloseDetallesDialog}
            variant="outlined"
            color="secondary"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600',
            }}
          >
            Cerrar
          </MDButton>
        </DialogActions>
      </Dialog>

      <PdfUploadDialog
        open={openPdfDialog}
        onClose={() => setOpenPdfDialog(false)}
        onExtractedData={handleExtractedPdfData}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default GestionCertificacionesCredito;
