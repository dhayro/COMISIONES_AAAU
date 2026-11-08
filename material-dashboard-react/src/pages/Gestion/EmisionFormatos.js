import React, { useState, useEffect, useRef } from 'react';
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
  Checkbox,  // 🆕 Importar Checkbox
  IconButton,
  Tooltip,
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
import TagIcon from '@mui/icons-material/Tag';
import UndoIcon from '@mui/icons-material/Undo';
import PaymentsIcon from '@mui/icons-material/Payments';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import * as pdfjsLib from 'pdfjs-dist';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Drawer from '@mui/material/Drawer';
import MDBadge from 'components/MDBadge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from 'context/AuthContext'; // 🆕 Importar AuthContext
import decolectaService from 'services/decolecta';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Destinos de la comisión: se muestran los dos primeros y el resto se indica con "+N"
const resumirDestinos = (texto = '') => {
  const partes = String(texto)
    .split(/,\s*|\s+Y\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return { visibles: partes.slice(0, 2), extra: Math.max(partes.length - 2, 0), partes };
};

// Fecha corta dd/mm/aaaa (guion en vacío)
const fechaCorta = (valor) => (valor ? new Date(valor).toLocaleDateString('es-ES') : '-');

// Sección del Drawer de emisión
const SeccionVerEmision = ({ numero, titulo, children }) => (
  <MDBox mb={2.5}>
    <MDTypography variant="caption" fontWeight="bold" color="info" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {numero} · {titulo}
    </MDTypography>
    <MDBox mt={0.5} p={2} sx={{ border: '1px solid #e8eaed', borderRadius: '8px', backgroundColor: '#fafbfc' }}>
      {children}
    </MDBox>
  </MDBox>
);

// Dato con etiqueta; el valor va en MDBox para poder contener listas
const DatoVerEmision = ({ etiqueta, children }) => (
  <MDBox mb={1}>
    <MDTypography variant="caption" fontWeight="bold" color="secondary" display="block">
      {etiqueta}
    </MDTypography>
    <MDBox sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{children}</MDBox>
  </MDBox>
);

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
  const [fuentesFinanciamientoDisponibles, setFuentesFinanciamientoDisponibles] = useState([]);  // 🆕 Fuentes disponibles
  const [formValues, setFormValues] = useState({
    comision_id: '',
    usuario_id: '',
    meta_id: '',  // 🆕 META
    fuente_financiamiento_id: '',  // 🆕 FUENTE DE FINANCIAMIENTO
    lugar: '',
    ruta: '',
    modalidad_viaje: '',
    fecha_salida: '',
    fecha_retorno: '',
    num_dias: '',
    costo_viaje_id: '',
    tipo_emision: 'ANTICIPO',  // 🆕 Cambio a ANTICIPO por defecto
    numero_siaf: '',
    numero_cut: '', // 🆕 NÚMERO CUT (OPCIONAL)
    codigo_cp: '',
    costo_xdia: '',
    actividad_realizar: '',  // 🆕 ACTIVIDAD A REALIZAR
    observacion: ''
  });
  const [creatingFormato, setCreatingFormato] = useState(false);
  // 🆕 Estados para Rendición de Formatos
  const [openRendicion, setOpenRendicion] = useState(false);
  const [formatoSeleccionadoParaRendir, setFormatoSeleccionadoParaRendir] = useState(null);
  const [tiposComprobanteDisponibles, setTiposComprobanteDisponibles] = useState([]);
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
  const [detallesFormatoParaRendir, setDetallesFormatoParaRendir] = useState([]);  // 🆕 Detalles del formato
  const [clasificadorSeleccionadoRendicion, setClasificadorSeleccionadoRendicion] = useState(null);  // 🆕 Clasificador seleccionado
  const [tipoRendicion, setTipoRendicion] = useState('viaticos');  // 🆕 Tipo: viaticos o declaracion_jurada
  const [gastosViaticos, setGastosViaticos] = useState({  // 🆕 Desglose de viaticos
    alimentacion: 0,
    hospedaje: 0,
    movilidad_local: 0,
  });
  const [limiteDisponible, setLimiteDisponible] = useState(0);  // 🆕 Límite disponible para gastar
  const [totalGastado, setTotalGastado] = useState(0);  // 🆕 Total gastado
  const [comprobantesAgregados, setComprobantesAgregados] = useState([]);  // 🆕 ARRAY de comprobantes agregados temporalmente
  const [totalComprobantesAgregados, setTotalComprobantesAgregados] = useState(0);  // 🆕 Total de comprobantes agregados
  const [comprobantesAgregadosPorPartida, setComprobantesAgregadosPorPartida] = useState({});  // 🆕 Comprobantes guardados POR PARTIDA {partida: []}
  const [guardandoDirecto, setGuardandoDirecto] = useState(false);  // Guardado inmediato de comprobantes/rutas
  const [rutaEditandoId, setRutaEditandoId] = useState(null);  // ID de la ruta que se está editando
  const [openSiafCut, setOpenSiafCut] = useState(false);
  const [formatoSiafCut, setFormatoSiafCut] = useState(null);
  const [feriadosSet, setFeriadosSet] = useState(new Set());
  const [formatoVer, setFormatoVer] = useState(null);

  useEffect(() => {
    api.request('/feriados')
      .then((respuesta) => setFeriadosSet(new Set((respuesta.feriados || []).map((f) => f.fecha))))
      .catch((error) => console.error('Error cargando feriados:', error));
  }, []);
  const [siafCutForm, setSiafCutForm] = useState({ numero_siaf: '', numero_cut: '' });
  const [datosRendicion, setDatosRendicion] = useState({
    tipo_comprobante_id: '',
    proveedor_id: '',
    numero_comprobante: '',
    monto: '',
    fecha_comprobante: '',
    observaciones: '',
    tipo_viatico: '',
  });
  // 🆕 Estados para RUTAS
  const [rutasAgregadas, setRutasAgregadas] = useState([]);  // Array de rutas agregadas
  const [datosRuta, setDatosRuta] = useState({
    origen: '',
    fecha_salida: '',
    destino: '',
    fecha_llegada: '',
  });
  const limpiadoRef = useRef(false);  // 🆕 Ref para evitar onChange durante reset
  // 🆕 Estados para crear proveedor desde modal de rendición
  const [openCrearProveedor, setOpenCrearProveedor] = useState(false);
  const [searchingRucProveedor, setSearchingRucProveedor] = useState(false);
  const [formDataProveedor, setFormDataProveedor] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  // 🆕 Estados para EDITAR comprobante
  const [openEditarComprobante, setOpenEditarComprobante] = useState(false);
  const [comprobanteEditando, setComprobanteEditando] = useState(null);
  const [loadingGuardarEdicion, setLoadingGuardarEdicion] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({
    numero_comprobante: '',
    fecha_comprobante: '',
    monto: '',
    tipo_comprobante_id: '',
    tipo_comprobante_nombre: '',
    proveedor_id: '',
    proveedor_nombre: '',
    tipo_viatico: '',
  });

  // Cargar comisiones y metas al montar
  useEffect(() => {
    cargarComisiones();
    cargarMetas();  // 🆕 Cargar metas disponibles
    cargarClasificadores();  // 🆕 Cargar todos los clasificadores
    cargarFuentesFinanciamiento();  // 🆕 Cargar fuentes de financiamiento
    cargarTiposComprobante();  // 🆕 Cargar tipos de comprobante
    cargarProveedores();  // 🆕 Cargar proveedores
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
    } catch (error) {
    }
  };

  // 🆕 Función para cargar metas
  const cargarMetas = async () => {
    try {
      const metas = await api.obtenerMetas();
      setMetasDisponibles(metas || []);
    } catch (error) {
    }
  };

  // 🆕 Función para cargar fuentes de financiamiento
  const cargarFuentesFinanciamiento = async () => {
    try {
      const fuentes = await api.obtenerFuentesFinanciamiento();
      setFuentesFinanciamientoDisponibles(fuentes || []);
    } catch (error) {
      console.error('❌ Error cargando fuentes de financiamiento:', error);
    }
  };

  // 🆕 Cargar tipos de comprobante para rendición
  const cargarTiposComprobante = async () => {
    try {
      const tipos = await api.obtenerTiposComprobante();
      setTiposComprobanteDisponibles(tipos || []);
    } catch (error) {
      console.error('❌ Error cargando tipos de comprobante:', error);
    }
  };

  // 🆕 Cargar proveedores para rendición
  const cargarProveedores = async () => {
    try {
      const proveedores = await api.obtenerProveedores();
      setProveedoresDisponibles(proveedores || []);
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
    }
  };

  // 🆕 Funciones para crear proveedor
  const handleAbrirCrearProveedor = () => {
    setFormDataProveedor({
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
    });
    setOpenCrearProveedor(true);
  };

  const handleCerrarCrearProveedor = () => {
    setOpenCrearProveedor(false);
    setFormDataProveedor({
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
    });
  };

  const handleChangeProveedor = (e) => {
    const { name, value } = e.target;
    setFormDataProveedor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBuscarRUCProveedor = async () => {
    const inputValue = formDataProveedor.ruc.trim();
    
    if (!inputValue || inputValue === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Ingresa un RUC o DNI para buscar',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }

    setSearchingRucProveedor(true);
    try {
      const resultado = await decolectaService.consultarNumero(formDataProveedor.ruc);

      if (!resultado.success) {
        Swal.fire({
          icon: 'warning',
          title: 'No encontrado',
          text: resultado.error || 'No se encontraron datos para este número',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          didOpen: (toast) => {
            toast.style.zIndex = 9999;
          },
        });
        return;
      }

      const { data } = resultado;

      // Determinar si es empresa o persona
      if (data.nombres) {
        // Es persona (DNI)
        setFormDataProveedor((prev) => ({
          ...prev,
          nombre: data.nombre_completo,
        }));
      } else {
        // Es empresa (RUC)
        setFormDataProveedor((prev) => ({
          ...prev,
          nombre: data.nombre,
          ruc: data.ruc,
          direccion: data.direccion || '',
        }));
      }

      Swal.fire({
        icon: 'success',
        title: 'Datos encontrados',
        text: 'Los datos se han completado automáticamente',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error en búsqueda',
        text: error.message || 'Error al consultar datos',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    } finally {
      setSearchingRucProveedor(false);
    }
  };

  const handleGuardarProveedor = async () => {
    // Validar campos requeridos
    if (!formDataProveedor.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del proveedor es requerido',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }

    try {
      // Crear proveedor
      const respuesta = await api.crearProveedor({
        nombre: formDataProveedor.nombre,
        ruc: formDataProveedor.ruc || null,
        direccion: formDataProveedor.direccion || null,
        telefono: formDataProveedor.telefono || null,
        email: formDataProveedor.email || null,
      });

      // Manejar la respuesta: puede venir como {success: true, proveedor: {...}} o {data: {...}}
      const nuevoProveedor = respuesta.proveedor || respuesta.data || respuesta;
      
      console.log('✅ Proveedor creado:', nuevoProveedor);

      // Agregar a la lista de proveedores (asegurando que tenga id)
      if (nuevoProveedor && nuevoProveedor.id) {
        // 🆕 Normalizar los campos del proveedor
        // El backend puede devolver razon_social, nombre, ruc_dni, etc.
        const proveedorNormalizado = {
          id: parseInt(nuevoProveedor.id) || nuevoProveedor.id,
          nombre: nuevoProveedor.nombre || nuevoProveedor.razon_social || formDataProveedor.nombre,
          ruc: nuevoProveedor.ruc || nuevoProveedor.ruc_dni || null,
          direccion: nuevoProveedor.direccion || null,
          telefono: nuevoProveedor.telefono || null,
          email: nuevoProveedor.email || null,
        };
        
        setProveedoresDisponibles((prev) => [...prev, proveedorNormalizado]);

        // 🆕 Seleccionar automáticamente el nuevo proveedor
        // Asegurar que el ID se guarda como string
        const idProveedor = String(proveedorNormalizado.id);
        setDatosRendicion((prev) => ({
          ...prev,
          proveedor_id: idProveedor,
        }));
        
        console.log('🎯 Proveedor seleccionado:', { id: idProveedor, nombre: proveedorNormalizado.nombre });

        handleCerrarCrearProveedor();

        Swal.fire({
          icon: 'success',
          title: 'Proveedor creado',
          text: `${nuevoProveedor.nombre || formDataProveedor.nombre} ha sido creado exitosamente`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          didOpen: (toast) => {
            toast.style.zIndex = 9999;
          },
        });
      } else {
        // Si no tiene ID, recargar y usar el nombre para encontrarlo
        console.warn('⚠️ El proveedor creado no tiene ID, recargando lista...');
        await cargarProveedores();
        
        const proveedorEncontrado = proveedoresDisponibles.find(p => p.nombre === formDataProveedor.nombre);
        if (proveedorEncontrado) {
          setDatosRendicion((prev) => ({
            ...prev,
            proveedor_id: proveedorEncontrado.id.toString(),
          }));
        }

        handleCerrarCrearProveedor();

        Swal.fire({
          icon: 'success',
          title: 'Proveedor creado',
          text: `${formDataProveedor.nombre} ha sido creado exitosamente`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          didOpen: (toast) => {
            toast.style.zIndex = 9999;
          },
        });
      }
    } catch (error) {
      console.error('❌ Error al crear proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear',
        text: error.message || 'Error al crear el proveedor',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    }
  };

  // 🆕 Función para cargar certificados ACTIVOS o EN_PROCESO de una META específica
  const cargarCertificadosPorMeta = async (metaId) => {
    try {
      
      // Llamar al API para obtener certificados de la meta
      const certificados = await api.obtenerCertificadosPorMeta(metaId);
      
      // Filtrar solo ACTIVOS o EN_PROCESO
      const certificadosFiltrados = (certificados || []).filter(
        c => c.estado_uso === 'ACTIVO' || c.estado_uso === 'EN_PROCESO'
      );
      
      setCertificadosDisponibles(certificadosFiltrados || []);
    } catch (error) {
      setCertificadosDisponibles([]);
    }
  };

  // 🆕 Función para cargar detalles completos de una certificación
  const cargarDetallesCertificacion = async (certificacionId, esModificacion = false) => {
    try {
      if (!certificacionId) {
        setDetallesCertificacionSeleccionada(null);
        return;
      }
      
      // Obtener clasificadores del certificado
      const respuesta = await api.obtenerClasificadoresCertificacion(certificacionId);
      
      // Formatear la respuesta
      let datosFormateados;
      if (Array.isArray(respuesta)) {
        datosFormateados = { detalles: respuesta };
      } else if (respuesta?.detalles) {
        datosFormateados = respuesta;
      } else {
        datosFormateados = { detalles: respuesta ? [respuesta] : [] };
      }
      
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
            return {
              ...detalleExistente,
              detalles_certificacion_credito_id: detalleEnCertificado.detalles_certificacion_credito_id
            };
          } else {
            // Si no está en el certificado, dejar como NULL
            return {
              ...detalleExistente,
              detalles_certificacion_credito_id: null
            };
          }
        });
        
        setDetallesEditables(detallesActualizados);
      } else if (detallesEditables.length === 0 && !esModificacion) {
        // Solo auto-poblar si NO hay detalles y es modo CREACIÓN
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
      
      
      const response = await api.obtenerComisionesParaEmision();
      
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
      
      
      // 🆕 Cargar formatos existentes para verificar cuáles ya tienen
      try {
        const formatosResponse = await api.obtenerFormatosEmisiones({});
        const formatos = formatosResponse.formatos || [];
        
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
            numero_documento: formatoExistente?.numero_documento || '',
            lugar: formatoExistente?.lugar || comision.lugar,
            modalidad_viaje: formatoExistente?.modalidad_viaje || comision.modalidad_viaje,
            fecha_salida: formatoExistente?.fecha_salida || comision.fecha_salida,
            fecha_retorno: formatoExistente?.fecha_retorno || comision.fecha_retorno,
            monto: formatoExistente?.monto_total || comision.monto,  // 🆕 Usar monto_total del formato si existe
            estado_emision: formatoExistente?.estado_emision || null,  // 🆕 Agregar estado_emision
            formato_existente: formatoExistente || null,  // 🆕 Agregar info del formato
            tiene_formato: !!formatoExistente  // 🆕 Bandera para facilitar uso
          };
        });
        
      } catch (err) {
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
    
    try {
      // Obtener la comisión completa con TODOS los comisionados
      const comisionCompleta = await api.obtenerComision(comisionadoData.comision_id);
      
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

      setDetallesEditables(detallesDelUsuarioLogueado);

      // 🆕 Cargar clasificadores disponibles (TODOS los maestro, no solo los de la comisión)
      // Los clasificadores de la comisión son solo los usados, pero el usuario puede agregar más
      if (!clasificadoresDisponibles || clasificadoresDisponibles.length === 0) {
        try {
          const clasificadoresMaestro = await api.obtenerClasificadores();
          setClasificadoresDisponibles(clasificadoresMaestro || []);
        } catch (error) {
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
        tipo_emision: 'ANTICIPO',  // 🆕 Cambio a ANTICIPO por defecto
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
      Swal.fire('Error', 'No se pudo cargar los detalles de la comisión', 'error');
    }
  };

  // 🆕 Función para modificar un formato existente
  const handleAbrirModalModificarFormato = async (comisionadoData) => {
    
    try {
      // Cargar el formato existente
      const formatoExistente = comisionadoData.formato_existente;
      if (!formatoExistente || !formatoExistente.id) {
        Swal.fire('Error', 'No se encontró el formato para modificar', 'error');
        return;
      }


      // Obtener detalles del formato
      const formatoCompleto = await api.obtenerFormatoEmisionPorId(formatoExistente.id);

      // Cargar detalles del formato
      const detallesDelFormato = (formatoCompleto?.detalles || []).map(d => ({
        id: d.id || Date.now() + Math.random(),
        clasificador_id: d.clasificador_id || '',
        clasificador_nombre: d.clasificador_nombre || 'N/A',
        monto: parseFloat(d.monto) || 0,
        montoAnterior: parseFloat(d.monto) || 0,  // 🆕 Guardar el monto original para comparar cambios
        detalles_certificacion_credito_id: d.detalles_certificacion_credito_id || null
      }));

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
        numero_cut: formatoExistente.numero_cut || '', // 🆕 Cargar número_cut
        codigo_cp: formatoExistente.codigo_cp || '',
        costo_xdia: formatoExistente.costo_xdia || '',
        actividad_realizar: formatoExistente.actividad_realizar || '',  // 🆕 Cargar actividad_realizar
        observacion: formatoExistente.observacion || '',
        certificacion_id: formatoCompleto?.certificacion_id || '',  // 🆕 Cargar certificacion_id
        fuente_financiamiento_id: formatoCompleto?.fuente_financiamiento_id || ''  // 🆕 Cargar fuente_financiamiento_id
      };
      
      setFormValues(nuevoFormValues);

      setComisionSeleccionadaParaFormato({ id: formatoExistente.comision_id });
      
      // ⚠️ NO cargar detalles del certificado en modo EDICIÓN
      // Ya cargamos los detalles reales del formato en línea 497
      // Solo seteamos detallesCertificacionSeleccionada para referencias, sin sobrescribir
      if (formatoCompleto?.certificacion_id) {
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
        } catch (err) {
        }
      }
      
      // 🆕 Marcar que estamos en modo modificación
      sessionStorage.setItem('formatoEnModificacion', formatoExistente.id);
      
      setOpenCrearFormato(true);
    } catch (error) {
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
      tipo_emision: 'ANTICIPO',  // 🆕 Cambio a ANTICIPO por defecto en reset
      numero_siaf: '',
      numero_cut: '', // 🆕 Reset NÚMERO CUT
      codigo_cp: '',
      costo_xdia: '',
      actividad_realizar: '',  // 🆕 Reset ACTIVIDAD A REALIZAR
      observacion: ''
    });
  };

  // 🆕 Función helper para normalizar partida (elimina espacios y puntos)
  const normalizarPartida = (partida) => {
    return partida ? partida.replace(/[\s.]/g, '') : '';
  };

  // 🆕 Manejadores para Rendición de Formatos
  const handleAbrirModalRendicion = async (formato) => {
    const datosFormato = formato.formato_existente || formato;
    const requiereSiaf = datosFormato.tipo_emision !== 'REEMBOLSO';
    if (requiereSiaf && !String(datosFormato.numero_siaf || '').trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta el SIAF',
        text: 'Registra el SIAF del formato antes de rendir.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
      });
      return;
    }
    try {
      setFormatoSeleccionadoParaRendir(formato);
      
      // Cargar detalles del formato emitido
      const detalles = await api.obtenerDetallesFormatoEmision(formato.formato_existente?.id || formato.id);
      setDetallesFormatoParaRendir(detalles.detalles || []);
      
      // Limpiar estados
      setClasificadorSeleccionadoRendicion(null);
      setTipoRendicion('viaticos');
      setGastosViaticos({ alimentacion: 0, hospedaje: 0, movilidad_local: 0 });
      setTotalGastado(0);
      setLimiteDisponible(0);
      setComprobantesAgregados([]);  // 🆕 Limpiar comprobantes temporales
      setTotalComprobantesAgregados(0);  // 🆕 Limpiar total
      setRutaEditandoId(null);
      
      setDatosRendicion({
        tipo_comprobante_id: '',
        proveedor_id: '',
        numero_comprobante: '',
        monto: '',
        fecha_comprobante: new Date().toISOString().split('T')[0],
        observaciones: '',
        tipo_viatico: '',
      });

      // Cargar comprobantes y rutas ya guardados en BD (independiente del estado)
      {
        try {
          const formatoId = formato.formato_existente?.id || formato.id;
          const rendicionesData = await api.request(`/rendiciones/obtener-por-formato/${formatoId}`, {
            method: 'GET'
          });

          if (rendicionesData && rendicionesData.rendiciones && rendicionesData.rendiciones.length > 0) {
            // 🆕 Cargar comprobantes por partida
            const comprobantesAgregadosTempPorPartida = {};
            
            rendicionesData.rendiciones.forEach((rendicion) => {
              // Usar formato_emisiones_detalles_id como clave única
              const partidaKey = rendicion.formato_emisiones_detalles_id?.toString();
              
              if (!comprobantesAgregadosTempPorPartida[partidaKey]) {
                comprobantesAgregadosTempPorPartida[partidaKey] = [];
              }

              // 🆕 Detectar si es Declaración Jurada por el nombre del tipo comprobante
              const nombreNormalizado = (rendicion.tipo_comprobante_nombre || '').toUpperCase();
              const esDeclaracionJurada = nombreNormalizado.includes('DECLARACIÓN JURADA') || nombreNormalizado.includes('DECLARACION JURADA');
              
              comprobantesAgregadosTempPorPartida[partidaKey].push({
                id: rendicion.id, // ID de la rendición
                is_new: false, // 🆕 MARCADOR: no es nuevo, viene de BD
                formato_emision_detalle_id: rendicion.formato_emisiones_detalles_id,
                tipo_comprobante_id: rendicion.tipo_comprobante_id,
                tipo_comprobante_nombre: rendicion.tipo_comprobante_nombre || 'N/A',
                proveedor_id: rendicion.proveedor_id,
                proveedor_nombre: rendicion.proveedor_nombre || 'N/A',
                numero_comprobante: rendicion.numero_comprobante,
                monto: parseFloat(rendicion.monto || 0),
                fecha_comprobante: rendicion.fecha_comprobante ? rendicion.fecha_comprobante.split(' ')[0].split('T')[0] : '',
                observaciones: rendicion.observaciones,
                tipo_viatico: rendicion.tipo_viatitico || rendicion.tipo_viatico,
                tipo_rendicion: esDeclaracionJurada ? 'declaracion_jurada' : 'viaticos',  // 🆕 Detectar tipo automáticamente
                partida: rendicion.partida,
                orden: rendicion.orden, // 🆕 Usar orden del backend (respeta el reordenamiento)
              });
            });
            
            setComprobantesAgregadosPorPartida(comprobantesAgregadosTempPorPartida);
            
            // Mostrar mensaje de carga exitosa
            Swal.fire({
              icon: 'info',
              title: 'Rendición Cargada',
              text: `Se cargaron ${rendicionesData.rendiciones.length} comprobante(s) existente(s)`,
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
            });

          }

          // Cargar rutas guardadas (aunque aún no haya comprobantes)
          if (rendicionesData.rutas && rendicionesData.rutas.length > 0) {
            const rutasFormateadas = rendicionesData.rutas.map(ruta => ({
              id: ruta.id,
              origen: ruta.origen,
              fecha_salida: ruta.fecha_salida,
              destino: ruta.destino,
              fecha_llegada: ruta.fecha_llegada,
            }));
            setRutasAgregadas(rutasFormateadas);
          }
        } catch (error) {
          console.warn('⚠️ No se pudieron cargar rendiciones previas:', error.message);
        }
      }

      setOpenRendicion(true);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al cargar detalles del formato',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleCerrarModalRendicion = () => {
    setOpenRendicion(false);
    cargarComisiones();
    setFormatoSeleccionadoParaRendir(null);
    setClasificadorSeleccionadoRendicion(null);
    setComprobantesAgregados([]);
    setTotalComprobantesAgregados(0);
    setComprobantesAgregadosPorPartida({});  // 🆕 Limpiar comprobantes por partida
    setRutaEditandoId(null);
    setRutasAgregadas([]);  // 🆕 Limpiar rutas
    setTipoRendicion('viaticos');
    setGastosViaticos({ alimentacion: 0, hospedaje: 0, movilidad_local: 0 });
    setTotalGastado(0);
    setLimiteDisponible(0);
    setDatosRendicion({
      tipo_comprobante_id: '',
      proveedor_id: '',
      numero_comprobante: '',
      monto: '',
      fecha_comprobante: '',
      observaciones: '',
      tipo_viatico: '',
    });
    setDatosRuta({  // 🆕 Limpiar datos de ruta
      origen: '',
      fecha_salida: '',
      destino: '',
      fecha_llegada: '',
    });
  };

  // 🆕 Seleccionar clasificador y calcular límite disponible
  const handleSeleccionarClasificador = (detalle) => {
    setClasificadorSeleccionadoRendicion(detalle);
    setLimiteDisponible(parseFloat(detalle.monto_total) || 0);
    setTotalGastado(0);
    setGastosViaticos({ alimentacion: 0, hospedaje: 0, movilidad_local: 0 });
    
    // 🆕 Cargar comprobantes de ESTA partida si existen
    const partidaKey = detalle.id?.toString() || detalle.partida;
    const comprobantesDeEstaPartida = comprobantesAgregadosPorPartida[partidaKey] || [];
    setComprobantesAgregados(comprobantesDeEstaPartida);
    
    // 🆕 Recalcular totales para esta partida
    const totalMontos = comprobantesDeEstaPartida.reduce((sum, c) => sum + c.monto, 0);
    setTotalComprobantesAgregados(totalMontos);
  };

  // 🆕 Actualizar gastos de viaticos
  const handleActualizarGastoViatico = (tipo, valor) => {
    const nuevoValor = parseFloat(valor) || 0;
    const gastosActuales = { ...gastosViaticos, [tipo]: nuevoValor };
    setGastosViaticos(gastosActuales);
    
    const total = gastosActuales.alimentacion + gastosActuales.hospedaje + gastosActuales.movilidad_local;
    setTotalGastado(total);
  };

  // 🆕 Obtener TODOS los comprobantes de TODAS las partidas (para mostrar en tabla general)
  const obtenerTodosLosComprobantes = () => {
    // 🆕 Obtener todos y ordenar por el campo 'orden' para mantener orden global
    return Object.values(comprobantesAgregadosPorPartida)
      .flat()
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  };

  // 🆕 Calcular total de TODOS los comprobantes
  const calcularTotalTodosComprobantes = () => {
    return obtenerTodosLosComprobantes().reduce((sum, c) => sum + c.monto, 0);
  };

  // 🆕 Obtener comprobantes SOLO de la partida actual
  const obtenerComprobantesPartidaActual = () => {
    if (!clasificadorSeleccionadoRendicion) return [];
    const partidaKey = clasificadorSeleccionadoRendicion.id?.toString() || clasificadorSeleccionadoRendicion.partida;
    return comprobantesAgregadosPorPartida[partidaKey] || [];
  };

  // 🆕 Calcular total de comprobantes SOLO de la partida actual
  const calcularTotalComprobantesPartidaActual = () => {
    return obtenerComprobantesPartidaActual().reduce((sum, c) => sum + c.monto, 0);
  };

  // 🆕 Calcular monto para declaración jurada (30% del monto OTORGADO de la partida seleccionada)
  const montoDeclaracionJurada = clasificadorSeleccionadoRendicion
    ? (() => {
        const monto = parseFloat(clasificadorSeleccionadoRendicion.monto_total || 0);
        const dj30 = (monto * 0.30).toFixed(2);
        console.log('💰 DJ Cálculo:', { 
          monto_total: monto, 
          dj30: dj30,
          clasificador: clasificadorSeleccionadoRendicion.nombre 
        });
        return dj30;
      })()
    : 0;

  const handleChangeRendicion = (e) => {
    const { name, value } = e.target;
    let valorProcesado = value;

    // 🆕 Si es fecha_comprobante, extraer solo la parte de la fecha (yyyy-mm-dd)
    if (name === 'fecha_comprobante' && value) {
      // Si tiene formato con hora (2026-08-21 00:00:00), extraer solo la fecha
      if (value.includes(' ')) {
        valorProcesado = value.split(' ')[0];
      }
      // Si tiene formato con T (2026-08-21T00:00:00), extraer solo la fecha
      else if (value.includes('T')) {
        valorProcesado = value.split('T')[0];
      }
    }

    setDatosRendicion(prev => ({
      ...prev,
      [name]: valorProcesado
    }));

    // 🆕 Si cambio el tipo de comprobante, actualizar tipoRendicion
    if (name === 'tipo_comprobante_id') {
      const tipoComprobanteObj = tiposComprobanteDisponibles.find(t => t.id === parseInt(value));
      if (tipoComprobanteObj) {
        const nombreNormalizado = tipoComprobanteObj.nombre?.toUpperCase() || '';
        const esDeclaracionJurada = nombreNormalizado.includes('DECLARACIÓN JURADA') || nombreNormalizado.includes('DECLARACION JURADA');
        console.log('🔍 Tipo Comprobante:', tipoComprobanteObj.nombre, '| Es DJ:', esDeclaracionJurada);
        setTipoRendicion(esDeclaracionJurada ? 'declaracion_jurada' : 'viaticos');
      }
    }
  };

  const handleGuardarRendicion = async () => {
    // Validaciones
    if (!clasificadorSeleccionadoRendicion) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccionar Clasificador',
        text: 'Debes seleccionar un clasificador',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    if (!datosRendicion.tipo_comprobante_id || !datosRendicion.numero_comprobante || !datosRendicion.monto) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Completa todos los campos obligatorios del comprobante',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // 🆕 Si NO es Declaración Jurada, requiere Proveedor
    if (tipoRendicion !== 'declaracion_jurada' && !datosRendicion.proveedor_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Debes seleccionar un Proveedor',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    const montoComprobante = parseFloat(datosRendicion.monto);

    // 🆕 Validar que el monto sea mayor a 0
    if (montoComprobante <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Monto inválido',
        text: 'El monto debe ser mayor a S/. 0.00',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // 🆕 VALIDACIÓN: Verificar que el total no exceda el límite disponible
    const totalActual = totalGastado + calcularTotalComprobantesPartidaActual();
    const disponibleRestante = limiteDisponible - totalActual;
    
    if (montoComprobante > disponibleRestante) {
      Swal.fire({
        icon: 'error',
        title: '❌ Fondos insuficientes',
        text: `Solo dispones de S/. ${disponibleRestante.toFixed(2)} pero intentas agregar S/. ${montoComprobante.toFixed(2)}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    }

    // Validar según tipo de rendición
    if (tipoRendicion === 'viaticos') {
      if (totalGastado > limiteDisponible) {
        Swal.fire({
          icon: 'error',
          title: 'Sobregirado',
          text: `El total de gastos (S/. ${totalGastado.toFixed(2)}) excede el monto disponible (S/. ${limiteDisponible.toFixed(2)})`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }
    } else if (tipoRendicion === 'declaracion_jurada') {
      const montoMaximo = parseFloat(montoDeclaracionJurada);
      // 🆕 Calcular total DJ actual ANTES de agregar el nuevo
      const totalDJActual = obtenerTodosLosComprobantes()
        .filter(c => c.tipo_rendicion === 'declaracion_jurada')
        .reduce((sum, c) => sum + c.monto, 0);
      const totalDJDespues = totalDJActual + montoComprobante;
      
      if (totalDJDespues > montoMaximo) {
        Swal.fire({
          icon: 'error',
          title: 'DJ Excedido',
          text: `Total DJ sería S/. ${totalDJDespues.toFixed(2)}, pero el máximo permitido es S/. ${montoMaximo.toFixed(2)} (30%). Disponible: S/. ${(montoMaximo - totalDJActual).toFixed(2)}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
        });
        return;
      }
    }

    const formatoId = formatoSeleccionadoParaRendir.formato_existente?.id || formatoSeleccionadoParaRendir.id;
    const partidaKey = clasificadorSeleccionadoRendicion.id?.toString() || clasificadorSeleccionadoRendicion.partida;

    const nuevoComprobante = {
      formato_emision_id: formatoId,
      formato_emision_detalle_id: clasificadorSeleccionadoRendicion.id,
      clasificador_nombre: clasificadorSeleccionadoRendicion.nombre,
      partida: clasificadorSeleccionadoRendicion.partida,
      tipo_comprobante_id: parseInt(datosRendicion.tipo_comprobante_id),
      tipo_comprobante_nombre: tiposComprobanteDisponibles.find(t => t.id === parseInt(datosRendicion.tipo_comprobante_id))?.nombre || '',
      proveedor_id: parseInt(datosRendicion.proveedor_id),
      proveedor_nombre: proveedoresDisponibles.find(p => p.id === parseInt(datosRendicion.proveedor_id))?.nombre || '',
      numero_comprobante: datosRendicion.numero_comprobante.trim().toUpperCase(),
      monto: montoComprobante,
      fecha_comprobante: datosRendicion.fecha_comprobante,
      observaciones: datosRendicion.observaciones,
      tipo_rendicion: tipoRendicion,
      tipo_viatico: datosRendicion.tipo_viatico || null,
      desglose_viaticos: tipoRendicion === 'viaticos' ? gastosViaticos : null,
      orden: Date.now() + Math.random(),
    };

    setGuardandoDirecto(true);
    try {
      const respuesta = await api.request('/rendiciones/crear', {
        method: 'POST',
        body: JSON.stringify({
          formato_emision_id: formatoId,
          modo: 'actualizar',
          comprobantes_nuevos: [nuevoComprobante],
        }),
      });

      const comprobanteGuardado = { ...nuevoComprobante, id: respuesta.rendicion.id, is_new: false };
      const nuevoArray = [...comprobantesAgregados, comprobanteGuardado];
      setComprobantesAgregados(nuevoArray);
      setTotalComprobantesAgregados(nuevoArray.reduce((sum, c) => sum + c.monto, 0));
      setComprobantesAgregadosPorPartida(prev => ({
        ...prev,
        [partidaKey]: [...(prev[partidaKey] || []), comprobanteGuardado],
      }));

      if (formatoSeleccionadoParaRendir.estado_emision !== 'RENDIDO') {
        setFormatoSeleccionadoParaRendir(prev => ({ ...prev, estado_emision: 'RINDIENDO' }));
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar el comprobante',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    } finally {
      setGuardandoDirecto(false);
    }

    // Limpiar formulario de comprobante (manteniendo fecha para próximos comprobantes)
    setDatosRendicion({
      tipo_comprobante_id: '',
      proveedor_id: '',
      numero_comprobante: '',
      monto: '',
      fecha_comprobante: datosRendicion.fecha_comprobante,  // 🆕 Mantener la fecha ingresada
      observaciones: '',
      tipo_viatico: '',
    });

    // Resetear desglose de viaticos después de agregar
    if (tipoRendicion === 'viaticos') {
      setGastosViaticos({
        alimentacion: 0,
        hospedaje: 0,
        movilidad_local: 0,
      });
    }

    Swal.fire({
      icon: 'success',
      title: '✅ Comprobante agregado',
      text: `Comprobante de S/. ${montoComprobante.toFixed(2)} agregado a la lista`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  };

  const handleEliminarComprobante = async (idTemporal) => {
    const comprobante = obtenerTodosLosComprobantes().find(c => c.id === idTemporal);
    if (!comprobante) return;

    const confirmacion = await Swal.fire({
      title: '¿Eliminar comprobante?',
      text: `${comprobante.numero_comprobante} - S/. ${comprobante.monto.toFixed(2)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;

    setGuardandoDirecto(true);
    try {
      await api.request(`/rendiciones/${comprobante.id}`, { method: 'DELETE' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar el comprobante',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    } finally {
      setGuardandoDirecto(false);
    }

    // 🆕 Eliminar de comprobantesAgregados (si está allí)
    const nuevoArrayAgregados = comprobantesAgregados.filter(c => c.id !== idTemporal);
    setComprobantesAgregados(nuevoArrayAgregados);
    setTotalComprobantesAgregados(nuevoArrayAgregados.reduce((sum, c) => sum + c.monto, 0));
    
    // 🆕 Eliminar de comprobantesAgregadosPorPartida (en todas las partidas)
    const nuevoObjeto = {};
    Object.entries(comprobantesAgregadosPorPartida).forEach(([key, comprobantes]) => {
      nuevoObjeto[key] = comprobantes.filter(c => c.id !== idTemporal);
    });
    setComprobantesAgregadosPorPartida(nuevoObjeto);

    Swal.fire({
      icon: 'info',
      title: 'Comprobante eliminado',
      text: 'El comprobante ha sido removido de la lista',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  // 🆕 Reordenar comprobantes - MOVER ARRIBA/ABAJO
  const handleMoverComprobante = async (idComprobante, direccion) => {
    const todosLos = obtenerTodosLosComprobantes();
    
    console.log('🔍 handleMoverComprobante:', { idComprobante, direccion, totalComprobantes: todosLos.length });
    
    const index = todosLos.findIndex(c => c.id === idComprobante);
    
    if (index === -1) {
      console.error('❌ Comprobante no encontrado:', idComprobante);
      return;
    }
    
    // Validar límites
    if (direccion === 'arriba' && index === 0) {
      console.warn('⚠️ Ya está en la primera posición');
      return;
    }
    if (direccion === 'abajo' && index === todosLos.length - 1) {
      console.warn('⚠️ Ya está en la última posición');
      return;
    }
    
    // Calcular nuevo índice
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1;
    
    // Crear copia y hacer swap simple
    const comprobantesOrdenados = [...todosLos];
    [comprobantesOrdenados[index], comprobantesOrdenados[newIndex]] = 
    [comprobantesOrdenados[newIndex], comprobantesOrdenados[index]];
    
    await aplicarNuevoOrden(new Map(comprobantesOrdenados.map((c, i) => [c.id, i])));
  };

  const aplicarNuevoOrden = async (nuevoOrden) => {
    const todos = obtenerTodosLosComprobantes();
    const cambios = todos.filter((c) => c.orden !== nuevoOrden.get(c.id));

    setGuardandoDirecto(true);
    try {
      await Promise.all(cambios.map((c) =>
        api.request(`/rendiciones/${c.id}`, {
          method: 'PUT',
          body: JSON.stringify({ orden: nuevoOrden.get(c.id) }),
        })
      ));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar el orden',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
      return false;
    } finally {
      setGuardandoDirecto(false);
    }

    setComprobantesAgregadosPorPartida((prev) => {
      const nuevo = {};
      Object.entries(prev).forEach(([key, lista]) => {
        nuevo[key] = lista.map((c) => ({ ...c, orden: nuevoOrden.get(c.id) ?? c.orden }));
      });
      return nuevo;
    });
    return true;
  };

  const handleOrdenarPorFecha = async () => {
    const ordenados = [...obtenerTodosLosComprobantes()].sort((a, b) =>
      (a.fecha_comprobante || '').localeCompare(b.fecha_comprobante || '') || (a.orden || 0) - (b.orden || 0)
    );
    const guardado = await aplicarNuevoOrden(new Map(ordenados.map((c, i) => [c.id, i])));
    if (guardado) {
      Swal.fire({
        icon: 'success',
        title: 'Comprobantes ordenados por fecha',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  // 🆕 EDITAR comprobante - abre modal
  const handleAbrirEditarComprobante = (comprobante) => {
    console.log('📝 Abriendo modal de edición:', comprobante);
    setComprobanteEditando(comprobante);
    // Convertir fecha a formato YYYY-MM-DD
    let fechaFormato = '';
    if (comprobante.fecha_comprobante) {
      if (comprobante.fecha_comprobante.includes('T')) {
        fechaFormato = comprobante.fecha_comprobante.split('T')[0];
      } else {
        fechaFormato = comprobante.fecha_comprobante;
      }
    }
    setDatosEdicion({
      numero_comprobante: comprobante.numero_comprobante || '',
      fecha_comprobante: fechaFormato,
      monto: comprobante.monto.toString(),
      tipo_comprobante_id: comprobante.tipo_comprobante_id || '',
      tipo_comprobante_nombre: comprobante.tipo_comprobante_nombre || '',
      proveedor_id: comprobante.proveedor_id || '',
      proveedor_nombre: comprobante.proveedor_nombre || '',
      tipo_viatico: comprobante.tipo_viatico || comprobante.tipo_viatitico || '',
    });
    setOpenEditarComprobante(true);
  };

  // 🆕 Guardar cambios de comprobante
  const handleGuardarEdicion = async () => {
    try {
      if (!comprobanteEditando) return;

      const monto = parseFloat(datosEdicion.monto);
      if (!datosEdicion.monto || monto <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Monto inválido',
          text: 'Ingresa un monto válido mayor a 0',
          toast: true,
          position: 'top-end',
          timer: 3000,
        });
        return;
      }

      if (!datosEdicion.tipo_comprobante_id) {
        Swal.fire({
          icon: 'error',
          title: 'Tipo de comprobante requerido',
          text: 'Selecciona un tipo de comprobante',
          toast: true,
          position: 'top-end',
          timer: 3000,
        });
        return;
      }

      setLoadingGuardarEdicion(true);

      // Si es un comprobante existente (no nuevo), actualizar en BD
      if (!comprobanteEditando.is_new) {
        console.log('🔄 Actualizando rendición en BD:', comprobanteEditando.id);

        const datosActualizar = {
          numero_comprobante: datosEdicion.numero_comprobante,
          fecha_comprobante: datosEdicion.fecha_comprobante,
          monto,
          tipo_comprobante_id: datosEdicion.tipo_comprobante_id,
          proveedor_id: datosEdicion.proveedor_id || null,
        };

        // Agregar tipo_viatitico si aplica
        if (datosEdicion.tipo_viatico) {
          datosActualizar.tipo_viatitico = datosEdicion.tipo_viatico;
        }

        await api.request(`/rendiciones/${comprobanteEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(datosActualizar),
        });
      }

      // Actualizar en memoria
      const comprobanteActualizado = {
        ...comprobanteEditando,
        numero_comprobante: datosEdicion.numero_comprobante,
        fecha_comprobante: datosEdicion.fecha_comprobante,
        monto,
        tipo_comprobante_id: datosEdicion.tipo_comprobante_id,
        tipo_comprobante_nombre: datosEdicion.tipo_comprobante_nombre,
        proveedor_id: datosEdicion.proveedor_id || comprobanteEditando.proveedor_id,
        proveedor_nombre: datosEdicion.proveedor_nombre || comprobanteEditando.proveedor_nombre,
        tipo_viatico: datosEdicion.tipo_viatico || comprobanteEditando.tipo_viatico,
      };

      // Actualizar en comprobantesAgregadosPorPartida
      const nuevoObjeto = {};

      Object.entries(comprobantesAgregadosPorPartida).forEach(([key, comprobantes]) => {
        nuevoObjeto[key] = comprobantes.map(c => {
          if (c.id === comprobanteEditando.id) {
            return comprobanteActualizado;
          }
          return c;
        });
      });

      setComprobantesAgregadosPorPartida(nuevoObjeto);

      // Recalcular totales
      const todosLosComprobantesActualizados = Object.values(nuevoObjeto).flat();
      const nuevoTotal = todosLosComprobantesActualizados.reduce((sum, c) => sum + c.monto, 0);
      setTotalComprobantesAgregados(nuevoTotal);

      setOpenEditarComprobante(false);
      setComprobanteEditando(null);

      Swal.fire({
        icon: 'success',
        title: '✅ Comprobante actualizado',
        text: `Monto: S/. ${monto.toFixed(2)}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error('❌ Error al guardar edición:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo actualizar el comprobante',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
    } finally {
      setLoadingGuardarEdicion(false);
    }
  };

  const handleEnviarRendicion = async (formatoParam) => {
    // 🆕 Obtener TODOS los comprobantes de TODAS las partidas
    const todosLosComprobantes = obtenerTodosLosComprobantes();

    if (todosLosComprobantes.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin comprobantes',
        text: 'Debes agregar al menos un comprobante antes de enviar',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    try {
      // 🔧 Validar que tenemos el formato (usando parámetro en lugar de estado)
      const formato = formatoParam || formatoSeleccionadoParaRendir;
      
      console.log('🔍 Formato recibido:', formato);
      
      if (!formato) {
        throw new Error('❌ No hay formato seleccionado. Por favor abre el modal nuevamente desde la tabla.');
      }

      const formatoId = formato.formato_existente?.id || formato.id;
      
      if (!formatoId) {
        throw new Error('❌ El formato no tiene ID. Estructura: ' + JSON.stringify(formato));
      }

      // 🆕 Separar comprobantes nuevos de comprobantes existentes (que tienen ID numérico)
      const comprobantesNuevos = [];
      const comprobantesParaActualizar = [];
      
      todosLosComprobantes.forEach((c, idx) => {
        // Si tiene marcador is_new, es nuevo
        if (c.is_new === true) {
          comprobantesNuevos.push({
            formato_emision_detalle_id: c.formato_emision_detalle_id,
            tipo_comprobante_id: c.tipo_comprobante_id || null,
            proveedor_id: c.proveedor_id || null,
            numero_comprobante: c.numero_comprobante || null,
            monto: c.monto || 0,
            fecha_comprobante: c.fecha_comprobante ? (typeof c.fecha_comprobante === 'string' ? c.fecha_comprobante.split(' ')[0].split('T')[0] : c.fecha_comprobante) : null,
            observaciones: c.observaciones || null,
            tipo_viatico: c.tipo_viatico || null,
            tipo_rendicion: c.tipo_rendicion || 'viaticos',
            partida: c.partida,
            orden: c.orden || idx,
          });
        } else {
          // Si NO tiene is_new, es un comprobante existente para actualizar
          comprobantesParaActualizar.push({
            id: c.id,
            tipo_comprobante_id: c.tipo_comprobante_id || null,
            proveedor_id: c.proveedor_id || null,
            numero_comprobante: c.numero_comprobante || null,
            monto: c.monto || 0,
            fecha_comprobante: c.fecha_comprobante ? (typeof c.fecha_comprobante === 'string' ? c.fecha_comprobante.split(' ')[0].split('T')[0] : c.fecha_comprobante) : null,
            observaciones: c.observaciones || null,
            tipo_viatico: c.tipo_viatico || null,
            orden: c.orden || idx,
          });
        }
      });

      // Preparar datos para envío - mezcla de nuevos y actualizados
      // 🆕 Obtener fecha y hora actual en zona horaria de Lima (UTC-5)
      const ahora = new Date();
      // Convertir a zona horaria de Lima (UTC-5)
      const offsetLocal = ahora.getTimezoneOffset(); // en minutos
      const offsetLima = 300; // Lima es UTC-5 (300 minutos atrás de UTC)
      const diferencia = (offsetLocal - offsetLima) * 60 * 1000; // convertir a ms
      const fechaLima = new Date(ahora.getTime() + diferencia);

      // Formatear manualmente usando hora local ajustada
      const año = fechaLima.getFullYear();
      const mes = String(fechaLima.getMonth() + 1).padStart(2, '0');
      const día = String(fechaLima.getDate()).padStart(2, '0');
      const horas = String(fechaLima.getHours()).padStart(2, '0');
      const minutos = String(fechaLima.getMinutes()).padStart(2, '0');
      const segundos = String(fechaLima.getSeconds()).padStart(2, '0');
      const ms = String(fechaLima.getMilliseconds()).padStart(3, '0');
      const fechaActualRendicion = `${año}-${mes}-${día}T${horas}:${minutos}:${segundos}.${ms}`;

      const datosRendicionFinal = {
        formato_emision_id: formatoId,
        comprobantes_nuevos: comprobantesNuevos,
        comprobantes_actualizar: comprobantesParaActualizar,
        fecha_rendicion: fechaActualRendicion,  // 🆕 Fecha y hora actual (zona Lima)
        modo: 'actualizar',
        finalizar: true,
      };

      // 🔧 Log para debug
      console.log('📤 Enviando rendición:', {
        formato_emision_id: datosRendicionFinal.formato_emision_id,
        comprobantes_nuevos: comprobantesNuevos.length,
        comprobantes_actualizar: comprobantesParaActualizar.length,
        modo: datosRendicionFinal.modo,
        total_monto: todosLosComprobantes.reduce((sum, c) => sum + c.monto, 0),
      });

      // 🆕 Usar el servicio API en lugar de fetch directo
      const responseData = await api.request('/rendiciones/crear', {
        method: 'POST',
        body: JSON.stringify(datosRendicionFinal),
      });

      Swal.fire({
        icon: 'success',
        title: datosRendicionFinal.modo === 'actualizar' ? '✅ Rendición actualizada' : '✅ Rendición enviada',
        html: `
          <p>Se han registrado <strong>${responseData.rendicion.comprobantes_guardados || todosLosComprobantes.length}</strong> comprobante(s)</p>
          <p>Total: <strong>S/. ${responseData.rendicion.total_monto?.toFixed(2) || todosLosComprobantes.reduce((sum, c) => sum + c.monto, 0).toFixed(2)}</strong></p>
          <p>ID Rendición: <strong>#${responseData.rendicion.id || 'Actualizado'}</strong></p>
        `,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
      });

      handleCerrarModalRendicion();
      // Recargar comisiones para actualizar la tabla
      cargarComisiones();
    } catch (error) {
      console.error('❌ Error en handleEnviarRendicion:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al enviar la rendición',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
    }
  };

  // 🆕 Función para formatear fechas en 24 horas
  const formatearFecha24Horas = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const segundos = String(date.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${anio}, ${horas}:${minutos}:${segundos}`;
  };

  // 🆕 Función para cambiar datos de ruta
  const handleChangeRuta = (e) => {
    // 🆕 Ignorar cambios durante el reset
    if (limpiadoRef.current) {
      console.log('⏭️ Ignorando onChange durante reset');
      return;
    }

    const { name, value } = e.target;
    setDatosRuta(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🆕 Función para agregar una ruta
  const handleAgregarRuta = async () => {
    // Validar campos requeridos
    if (!datosRuta.origen.trim() || !datosRuta.destino.trim() || !datosRuta.fecha_salida || !datosRuta.fecha_llegada) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Completa todos los campos de la ruta',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Validar que la fecha de llegada sea después de la fecha de salida
    const fechaSalida = new Date(datosRuta.fecha_salida);
    const fechaLlegada = new Date(datosRuta.fecha_llegada);
    
    if (fechaLlegada <= fechaSalida) {
      Swal.fire({
        icon: 'error',
        title: 'Fecha inválida',
        text: 'La fecha de llegada debe ser posterior a la fecha de salida',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    const cuerpoRuta = {
      origen: datosRuta.origen.trim().toUpperCase(),
      fecha_salida: datosRuta.fecha_salida,
      destino: datosRuta.destino.trim().toUpperCase(),
      fecha_llegada: datosRuta.fecha_llegada,
    };

    setGuardandoDirecto(true);
    let rutaGuardada;
    try {
      if (rutaEditandoId) {
        await api.request(`/rutas/${rutaEditandoId}`, {
          method: 'PUT',
          body: JSON.stringify(cuerpoRuta),
        });
        rutaGuardada = { id: rutaEditandoId, ...cuerpoRuta };
        setRutasAgregadas(prev => prev.map(r => (r.id === rutaEditandoId ? rutaGuardada : r)));
        setRutaEditandoId(null);
        setDatosRuta({ origen: '', fecha_salida: '', destino: '', fecha_llegada: '' });
      } else {
        const formatoId = formatoSeleccionadoParaRendir.formato_existente?.id || formatoSeleccionadoParaRendir.id;
        const respuesta = await api.request('/rutas', {
          method: 'POST',
          body: JSON.stringify({ formato_emision_id: formatoId, ...cuerpoRuta }),
        });
        rutaGuardada = { id: respuesta.ruta.id, ...cuerpoRuta };
        setRutasAgregadas(prev => [...prev, rutaGuardada]);

        // Copiar destino a origen para la próxima ruta (mayor accesibilidad)
        limpiadoRef.current = true;
        setDatosRuta({
          origen: rutaGuardada.destino,
          fecha_salida: '',
          destino: '',
          fecha_llegada: '',
        });
        setTimeout(() => {
          limpiadoRef.current = false;
        }, 100);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar la ruta',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    } finally {
      setGuardandoDirecto(false);
    }

    Swal.fire({
      icon: 'success',
      title: 'Ruta guardada',
      text: `De ${rutaGuardada.origen} a ${rutaGuardada.destino}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  // 🆕 Función para eliminar una ruta
  const esDiaHabil = (fecha) => {
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
    return !esFinDeSemana && !feriadosSet.has(iso);
  };

  const calcularVencimientoRendicion = (fechaRetorno) => {
    const [anio, mes, dia] = String(fechaRetorno).slice(0, 10).split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    let diasHabiles = 0;
    while (diasHabiles < 10) {
      fecha.setDate(fecha.getDate() + 1);
      if (esDiaHabil(fecha)) diasHabiles++;
    }
    return fecha;
  };

  const contarDiasHabilesHasta = (vencimiento) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cursor = new Date(hoy);
    let dias = 0;
    while (cursor < vencimiento) {
      cursor.setDate(cursor.getDate() + 1);
      if (esDiaHabil(cursor)) dias++;
    }
    return dias;
  };

  const handleDevolucionTotal = async (formato) => {
    const formatoId = formato.formato_existente?.id || formato.id;
    const { isConfirmed, value: motivo } = await Swal.fire({
      title: '¿Devolución total del viático?',
      text: 'El viático se cerrará como devuelto y ya no contará para el vencimiento.',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo de la devolución',
      inputPlaceholder: 'Escribe el motivo...',
      inputValidator: (valor) => (!valor || !valor.trim() ? 'El motivo es obligatorio' : null),
      showCancelButton: true,
      confirmButtonText: 'Sí, devolver',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    try {
      await api.request(`/formatos-emisiones/${formatoId}/devolucion`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivo.trim() }),
      });
      Swal.fire({
        icon: 'success',
        title: 'Viático devuelto',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
      cargarComisiones();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar la devolución',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
    }
  };

  const formatearSiaf = (valor) => {
    const digitos = String(valor || '').replace(/\D/g, '').slice(0, 10);
    return digitos ? digitos.padStart(10, '0') : '';
  };

  const handleAbrirSiafCut = async (formato) => {
    const formatoId = formato.formato_existente?.id || formato.id;
    try {
      const formatoCompleto = await api.obtenerFormatoEmisionPorId(formatoId);
      setFormatoSiafCut(formato);
      setSiafCutForm({
        numero_siaf: formatoCompleto.numero_siaf || '',
        numero_cut: formatoCompleto.numero_cut || '',
      });
      setOpenSiafCut(true);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cargar el formato',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
    }
  };

  const handleGuardarSiafCut = async () => {
    const formatoId = formatoSiafCut.formato_existente?.id || formatoSiafCut.id;
    setGuardandoDirecto(true);
    try {
      await api.request(`/formatos-emisiones/${formatoId}/siaf-cut`, {
        method: 'PATCH',
        body: JSON.stringify({
          numero_siaf: formatearSiaf(siafCutForm.numero_siaf),
          numero_cut: siafCutForm.numero_cut,
        }),
      });
      setOpenSiafCut(false);
      cargarComisiones();
      Swal.fire({
        icon: 'success',
        title: 'SIAF/CUT guardado',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setGuardandoDirecto(false);
    }
  };

  const handleEditarRuta = (ruta) => {
    const aInputDateTime = (valor) => (valor ? String(valor).slice(0, 16).replace(' ', 'T') : '');
    setRutaEditandoId(ruta.id);
    setDatosRuta({
      origen: ruta.origen,
      fecha_salida: aInputDateTime(ruta.fecha_salida),
      destino: ruta.destino,
      fecha_llegada: aInputDateTime(ruta.fecha_llegada),
    });
  };

  const handleCancelarEdicionRuta = () => {
    setRutaEditandoId(null);
    setDatosRuta({ origen: '', fecha_salida: '', destino: '', fecha_llegada: '' });
  };

  const handleEliminarRuta = async (idRuta) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar ruta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;

    setGuardandoDirecto(true);
    try {
      await api.request(`/rutas/${idRuta}`, { method: 'DELETE' });
      setRutasAgregadas(prev => prev.filter(r => r.id !== idRuta));
      if (rutaEditandoId === idRuta) handleCancelarEdicionRuta();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar la ruta',
        text: error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    } finally {
      setGuardandoDirecto(false);
    }

    Swal.fire({
      icon: 'info',
      title: 'Ruta eliminada',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
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

      // 🆕 Generar número de documento dinámicamente
      let numeroDocumento;
      if (!esModificacion) {
        numeroDocumento = await generarNumeroDocumento(usuarioLogueado);
      }

      // 🆕 Verificar si cambió la certificación
      let huboChangioCertificacion = false;
      let detallesAntiguos = [];
      
      if (esModificacion) {
        const formatoAnterior = await api.obtenerFormatoEmisionPorId(formatoEnModificacion);
        huboChangioCertificacion = formatoAnterior.certificacion_id !== formValues.certificacion_id;
        detallesAntiguos = formatoAnterior.detalles || [];
        
        console.log(`🔄 Modo modificación:`);
        console.log(`   Certificación anterior: ${formatoAnterior.certificacion_id}`);
        console.log(`   Certificación nueva: ${formValues.certificacion_id}`);
        console.log(`   ¿Cambió? ${huboChangioCertificacion}`);
      }

      // Preparar datos del formato
      const datosFormato = {
        comision_id: parseInt(formValues.comision_id),
        usuario_id: parseInt(formValues.usuario_id),
        costo_viaje_id: formValues.costo_viaje_id ? parseInt(formValues.costo_viaje_id) : null,
        meta_id: formValues.meta_id ? parseInt(formValues.meta_id) : null,  // 🆕 META
        certificacion_id: formValues.certificacion_id ? parseInt(formValues.certificacion_id) : null,  // 🆕 CERTIFICACIÓN
        fuente_financiamiento_id: formValues.fuente_financiamiento_id ? parseInt(formValues.fuente_financiamiento_id) : null,  // 🆕 FUENTE DE FINANCIAMIENTO
        numero_documento: esModificacion ? undefined : numeroDocumento,
        fecha_emision: esModificacion ? undefined : obtenerFechaEmisionPerú(),  // ✅ AHORA: Usa zona horaria de Perú
        lugar: formValues.lugar,
        ruta: formValues.ruta,
        modalidad_viaje: formValues.modalidad_viaje,
        fecha_salida: formValues.fecha_salida,
        fecha_retorno: formValues.fecha_retorno,
        num_dias: parseInt(formValues.num_dias),
        codigo_cp: formValues.codigo_cp || null,
        tipo_emision: formValues.tipo_emision,
        costo_xdia: parseFloat(formValues.costo_xdia),
        monto_total: detallesEditables.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0),
        actividad_realizar: formValues.actividad_realizar,  // 🆕 ACTIVIDAD A REALIZAR
        observacion: formValues.observacion,
      };

      // 🆕 SOLO incluir detalles si:
      // 1. Es creación (siempre incluye detalles), O
      // 2. Es modificación Y cambió la certificación, O
      // 3. Es modificación Y cambiaron los detalles
      const detallesNuevos = detallesEditables.map(d => ({
        clasificador_id: d.clasificador_id,
        monto: parseFloat(d.monto || 0),
        detalles_certificacion_credito_id: d.detalles_certificacion_credito_id
      }));

      let detallesRealmenteCambiaron = false;
      if (esModificacion) {
        // En modificación: comparar si detalles cambiaron
        if (detallesNuevos.length !== detallesAntiguos.length) {
          detallesRealmenteCambiaron = true;
          console.log(`📋 Detalles: Cantidad cambió (${detallesAntiguos.length} → ${detallesNuevos.length})`);
        } else {
          // Verificar si montos/clasificadores cambieron
          const montosIguales = detallesAntiguos.every((anterior, idx) =>
            anterior.monto == detallesNuevos[idx].monto &&
            anterior.clasificador_id == detallesNuevos[idx].clasificador_id
          );
          if (!montosIguales) {
            detallesRealmenteCambiaron = true;
            console.log(`📋 Detalles: Montos o clasificadores cambiaron`);
          }
        }
      } else {
        // En creación: siempre incluir detalles
        detallesRealmenteCambiaron = true;
      }

      // SOLO incluir detalles si hay cambios REALES
      if (huboChangioCertificacion || detallesRealmenteCambiaron) {
        datosFormato.detalles = detallesNuevos;
        console.log(`✅ Incluyendo detalles en request`);
      } else {
        console.log(`⏭️ NO incluyendo detalles (sin cambios reales)`);
      }

      let response;
      if (esModificacion) {
        // 🆕 Actualizar formato existente
        response = await api.actualizarFormatoEmision(formatoEnModificacion, datosFormato);
        
        // Limpiar el session storage
        sessionStorage.removeItem('formatoEnModificacion');
        
        Swal.fire('Éxito', `Formato actualizado exitosamente`, 'success');
      } else {
        // Crear nuevo formato
        response = await api.crearFormatoEmision(datosFormato);
        
        // 🆕 Incrementar el correlativo después de emitir
        await incrementarCorrelativo(usuarioLogueado.id);
        
        Swal.fire('Éxito', `Formato creado exitosamente: ${response.numero_documento || 'N/A'}`, 'success');
      }
      
      handleCerrarCrearFormato();
      cargarComisiones(); // Recargar la lista
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo crear el formato', 'error');
    } finally {
      setCreatingFormato(false);
    }
  };

  // 🆕 Función para generar número de documento con formato XXX-INICIALES-AÑO
  // Considera la tabla correlativo_control para definir el número inicial
  const generarNumeroDocumento = async (usuarioLogueado) => {
    try {
      const anoActual = new Date().getFullYear();
      
      if (!usuarioLogueado?.id) {
        throw new Error('Usuario no identificado');
      }
      
      // 🆕 Obtener próximo número de documento usando la API de correlativo
      try {
        const response = await api.get(`/formato-emisiones/correlativo-control/${usuarioLogueado.id}/proximo`);
        
        if (response && response.numeroDocumento) {
          console.log('✅ Número de documento generado:', response.numeroDocumento);
          return response.numeroDocumento; // Ej: "001-DKT-2026"
        }
      } catch (apiError) {
        console.warn('⚠️ Error obteniendo correlativo de API:', apiError.message);
      }
      
      // Fallback: Si la API falla, generar manualmente usando iniciales de la BD
      const iniciales = usuarioLogueado?.iniciales || 
                        usuarioLogueado?.nombre?.substring(0, 2).toUpperCase() || 
                        'XXX';
      
      // Obtener cantidad de formatos del usuario en el año actual
      try {
        const respuesta = await api.obtenerComisionesParaEmision();
        const formatosDelAno = respuesta.formatos_emitidos.filter(f => {
          const anoFormato = new Date(f.fecha_emision).getFullYear();
          return anoFormato === anoActual && f.usuario_id === usuarioLogueado?.id;
        });
        
        // El correlativo es la cantidad + 1, formateado con 3 dígitos
        const correlativo = formatosDelAno.length + 1;
        const numeroFormateado = String(correlativo).padStart(3, '0');
        return `${numeroFormateado}-${iniciales}-${anoActual}`;
      } catch (e) {
        // Si falla obtener formatos, usar número aleatorio
        const correlativo = Math.floor(Math.random() * 999) + 1;
        const numeroFormateado = String(correlativo).padStart(3, '0');
        return `${numeroFormateado}-${iniciales}-${anoActual}`;
      }
    } catch (error) {
      console.error('❌ Error generando número de documento:', error.message);
      // Fallback final: generar uno con valores por defecto
      const anoActual = new Date().getFullYear();
      const iniciales = usuarioLogueado?.iniciales || 'XXX';
      const correlativo = Math.floor(Math.random() * 999) + 1;
      const numeroFormateado = String(correlativo).padStart(3, '0');
      return `${numeroFormateado}-${iniciales}-${anoActual}`;
    }
  };

  // 🆕 Función para incrementar el correlativo después de emitir
  const incrementarCorrelativo = async (usuarioId) => {
    try {
      const anoActual = new Date().getFullYear();
      
      // Obtener control actual
      const controlResponse = await api.get(`/formato-emisiones/correlativo-control/${usuarioId}/${anoActual}`);
      if (controlResponse?.data) {
        const control = controlResponse.data.data || controlResponse.data;
        
        // Incrementar el número próximo
        const nuevoNumero = control.numero_proximo + 1;
        
        await api.put(`/formato-emisiones/correlativo-control/${control.id}`, {
          numero_proximo: nuevoNumero
        });
        
        console.log(`✅ Correlativo incrementado: ${control.numero_proximo} → ${nuevoNumero}`);
      }
    } catch (error) {
      console.warn('⚠️ Error incrementando correlativo:', error.message);
      // No lanzar error, es solo un increment de contador
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
      return null;
    }
  };

  const generarVistaPrevia = async (comision, comisionado) => {
    
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
        } else {
        }
      } catch (error) {
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
      const fechaCreacion = new Date();
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
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      setPdfPreviewUrl(pdfUrl);
      setPreviewLoading(false);

    } catch (error) {
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

    // 🆕 OBTENER CCP DE LA CERTIFICACIÓN
    let ccpNumber = '';
    if (formatoCompleto?.certificacion_id) {
      try {
        const certResponse = await api.obtenerCertificacionCreditoPorId(formatoCompleto.certificacion_id);
        ccpNumber = certResponse?.nota || '';
        console.log('📋 CCP obtenido:', ccpNumber);
      } catch (error) {
        console.error('❌ Error obteniendo CCP:', error.message);
      }
    }

    // 🆕 AMBITO viene del USUARIO (comisionado), no de la comisión
    const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';

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

    // 🆕 Agregar fila CCP solo si hay valor
    if (ccpNumber && ccpNumber.trim()) {
      titleTableData.push([
        { content: '', styles: { fontSize: 10, halign: 'center' } },
        { content: `CCP N°`, styles: { fontSize: 10, halign: 'right', valign: 'middle', textColor: [0, 0, 0] } },
        { content: `${ccpNumber}`, styles: { fontSize: 10, halign: 'center', valign: 'middle' } }
      ]);
    }

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
        // Dibuja borde en la tercera columna de la segunda fila (SIAF ENCARGO) y tercera fila si existe (CCP)
        if (data.row.index === 1 && data.column.index === 2) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
        // Si hay fila CCP (data.row.index === 2), también dibujar borde
        if (ccpNumber && ccpNumber.trim() && data.row.index === 2 && data.column.index === 2) {
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
        } catch (error) {
          metaInfo = comision.meta_nombre || '';
        }
      }
      
      // Obtener información de Fuente de Financiamiento
      let fuenteFinanciamientoId = null;
      
      // Prioridad 1: Si hay certificación_id, obtener fuente de la certificación
      if (formatoCompleto?.certificacion_id) {
        try {
          const certificacion = await api.obtenerCertificacionCreditoPorId(formatoCompleto.certificacion_id);
          if (certificacion?.fuente_financiamiento_id) {
            fuenteFinanciamientoId = certificacion.fuente_financiamiento_id;
          }
        } catch (error) {
          console.error('Error al obtener certificación:', error);
        }
      }
      
      // Prioridad 2: Si NO hay certificación pero SÍ hay fuente_financiamiento_id en formato_emisiones
      if (!fuenteFinanciamientoId && formatoCompleto?.fuente_financiamiento_id) {
        fuenteFinanciamientoId = formatoCompleto.fuente_financiamiento_id;
      }
      
      // Obtener datos de la fuente de financiamiento
      if (fuenteFinanciamientoId) {
        try {
          const fuenteData = await api.obtenerFuenteFinanciamiento(fuenteFinanciamientoId);
          fuenteFinanciamientoInfo = `${fuenteData.abreviatura || ''} - ${fuenteData.nombre || ''}`.trim();
        } catch (error) {
          console.error('Error al obtener fuente de financiamiento:', error);
          fuenteFinanciamientoInfo = '';
        }
      }
    } catch (error) {
    }

    // ===== AFECTACIÓN PRESUPUESTAL (Campo 10) =====
    // 🆕 Valores fijos indicados por DAVID AGUINAGA
    const programaInfo = '10 - Agropecuaria';
    const subprogramaInfo = '054 - Desarrollo estratégico, conservación y aprovechamiento sostenible del patrimonio natural';
    const actividadProyectoInfo = '9002 - Asignaciones presupuestarias que no resultan en productos';
    const componenteInfo = '5001844 - Autoridad Administrativa del Agua IX - Ucayali';

    const presupuestTableData = [
      [{ content: '10. Afectación presupuestal', colSpan: 2, styles: { fontSize: 10, fontStyle: 'bold', halign: 'left', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Fuente de financiamiento', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: fuenteFinanciamientoInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Programa', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: programaInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Subprograma', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: subprogramaInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Actividad / Proyecto', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: actividadProyectoInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
      [{ content: 'Componente', styles: { fontSize: 10, fontStyle: 'bold', padding: 0 } }, { content: componenteInfo, styles: { fontSize: 10, halign: 'left', valign: 'bottom', padding: 0 } }, { content: '', styles: { fontSize: 10, padding: 0 } }],
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
        
        formatoCompleto.detalles.forEach((detalle) => {
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
      }
    } catch (error) {
    }

    // Si no hay detalles, usar datos de comisionado como fallback
    if (clasificadoresData.length === 0) {
      
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

    // 🆕 Calcular suma total de importes
    let totalClasificadores = 0;
    clasificadoresData.forEach((row) => {
      const montoText = row[2].content;
      const monto = parseFloat(montoText.replace('S/. ', '')) || 0;
      totalClasificadores += monto;
    });

    // Construir tabla de clasificadores con encabezado como fila de datos
    const clasificadoresTableData = [
      [
        { content: 'Concepto', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } },
        { content: 'Clasificador', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } },
        { content: 'Importe', styles: { fontSize: 10, fontStyle: 'bold', halign: 'center', padding: 0, fillColor: [200, 200, 200] } }
      ],
      ...clasificadoresData,
      // 🆕 Agregar fila de TOTAL
      [
        { content: '', colSpan: 2, styles: { fontSize: 10, fontStyle: 'bold', halign: 'right', padding: 0, fillColor: [220, 220, 220] } },
        { content: `S/. ${totalClasificadores.toFixed(2)}`, styles: { fontSize: 10, fontStyle: 'bold', halign: 'right', padding: 0, fillColor: [220, 220, 220] } }
      ]
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
      }
    } catch (error) {
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
    const footerMargin = 10;
    
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



  const estadoColor = (estado) => {
    if (estado === 'PRESUPUESTO ASIGNADO') return 'success';
    if (estado === 'APROBADA') return 'info';
    return 'default';
  };

  // 🆕 FUNCIÓN PARA GENERAR ANEXO 03
  const generarAnexo03 = async (doc, comision, comisionado, logoBase64, formatoCompleto = null) => {
    /**
     * ANEXO 03: RENDICIÓN DE CUENTAS DE VIATICOS Y GASTOS DE VIAJE
     * Formato: PORTRAIT
     */

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // 🆕 AMBITO viene del USUARIO (comisionado)
    const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';

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

    // ===== TABLA DE TÍTULOS Y SIAF (Dos filas con colspan) =====
    const titleTableData = [
      [
        { content: `ANEXO N° 03\nRENDICIÓN DE CUENTAS DE VIATICOS Y GASTOS DE VIAJE`, colSpan: 4, styles: { fontSize: 12, fontStyle: 'bold', halign: 'center', valign: 'middle', textColor: [0, 0, 0] } }
      ],
      [
        { content: '(Fondos Entregados con Cheque y/o Efectivo)', colSpan: 4, styles: { fontSize: 9, halign: 'center', valign: 'middle', textColor: [0, 0, 0] } }
      ],
      [
        { content: `APELLIDOS Y NOMBRES COMISIONADO`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: ${comisionado.usuario_nombre || ''}`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: 'SIAF', styles: { fontSize: 10, halign: 'right', valign: 'middle', textColor: [0, 0, 0] } },
        { content: `${formatoCompleto?.numero_siaf || ''}`, styles: { fontSize: 10, halign: 'center', valign: 'middle' } }
      ],
      [
        { content: `DEPENDENCIA`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: ${ambitoDelUsuario || ''}`, colSpan: 3, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
      ],
      [
        { content: `CARGO`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: ${comisionado.cargo_nombre || ''}`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: 'C/P', styles: { fontSize: 10, halign: 'right', valign: 'middle', textColor: [0, 0, 0] } },
        { content: `${''}`, styles: { fontSize: 10, halign: 'center', valign: 'middle' } }
      ]
    ];

    autoTable(doc, {
      startY: titleStartY,
      margin: margin,
      theme: 'plain',
      body: titleTableData,
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) * 0.40 },
        1: { cellWidth: (pageWidth - margin * 2) * 0.35 },
        2: { cellWidth: (pageWidth - margin * 2) * 0.10 },
        3: { cellWidth: (pageWidth - margin * 2) * 0.15 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 2.5,
        valign: 'middle'
      },
      didDrawCell: (data) => {
        // Dibuja borde en la cuarta columna de la tercera fila (SIAF)
        if ((data.row.index === 2 && data.column.index === 3) || (data.row.index === 4 && data.column.index === 3)) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        }
      }
    });

    yPosition = doc.lastAutoTable?.finalY || titleStartY + 35;
    yPosition += 1;


    yPosition = doc.lastAutoTable?.finalY || yPosition + 35;
    yPosition += 3;


    // Obtener rutas - pueden venir de formatoCompleto.rutas (desde la API) o de rutasAgregadas (estado local)
    const rutasParaAnexo = (formatoCompleto?.rutas && Array.isArray(formatoCompleto.rutas) && formatoCompleto.rutas.length > 0) 
      ? formatoCompleto.rutas 
      : [];

    console.log('✅ Rutas para Anexo 03:', rutasParaAnexo);

    const rutasTableData = rutasParaAnexo.length > 0
      ? rutasParaAnexo.map((ruta) => {
          const fechaSalida = new Date(ruta.fecha_salida);
          const fechaLlegada = new Date(ruta.fecha_llegada);
          return [
            { content: ruta.origen || '', styles: { fontSize: 8, halign: 'left', valign: 'middle' } },
            { content: fechaSalida.toLocaleDateString('es-PE'), styles: { fontSize: 8, halign: 'center', valign: 'middle' } },
            { content: fechaSalida.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }), styles: { fontSize: 8, halign: 'center', valign: 'middle' } },
            { content: ruta.destino || '', styles: { fontSize: 8, halign: 'left', valign: 'middle' } },
            { content: fechaLlegada.toLocaleDateString('es-PE'), styles: { fontSize: 8, halign: 'center', valign: 'middle' } },
            { content: fechaLlegada.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }), styles: { fontSize: 8, halign: 'center', valign: 'middle' } }
          ];
        })
      : [
          [
            { content: '', styles: { fontSize: 8 } },
            { content: '', styles: { fontSize: 8 } },
            { content: '', styles: { fontSize: 8 } },
            { content: '', styles: { fontSize: 8 } },
            { content: '', styles: { fontSize: 8 } },
            { content: '', styles: { fontSize: 8 } }
          ]
        ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'grid',
      head: [[
        { content: 'ORIGEN (Salida)', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'FECHA', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'HORA', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'DESTINO (Llegada)', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'FECHA', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'HORA', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } }
      ]],
      body: rutasTableData,
      columnStyles: {
        0: { cellWidth: (usableWidth / 6) * 1.3 },
        1: { cellWidth: (usableWidth / 6) * 0.9 },
        2: { cellWidth: (usableWidth / 6) * 0.8 },
        3: { cellWidth: (usableWidth / 6) * 1.3 },
        4: { cellWidth: (usableWidth / 6) * 0.9 },
        5: { cellWidth: (usableWidth / 6) * 0.8 }
      },
      headStyles: {
        fontSize: 6.5,
        fontStyle: 'bold',
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        padding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        fontSize: 6.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        padding: 1,
        textColor: [0, 0, 0]
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 30;
    yPosition += 3;
    
    // ===== SECCIÓN 2: DOCUMENTOS =====
    // Tabla de encabezados DOCUMENTOS con partidas
    const documentosHeaderTableData = [
      [
        { content: 'DOCUMENTOS', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'HOSPEDAJE', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'ALIMENTACION', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 6 } },
        { content: 'MOVILIDAD\nLOCAL', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'PASAJES', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'COMBUSTIBLE', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 6.5 } },
        { content: 'OTROS\nGASTOS', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } }
      ],
      [
        { content: 'N°', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'FECHA', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'TIPO\nDOCUMENTO', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
        { content: 'SERIE\nNUMERO', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } }
      ]
    ];
    
    // 🆕 Obtener comprobantes desde formatoCompleto (cuando se generan desde modal)
    // O desde el estado local obtenerTodosLosComprobantes() (cuando se edita)
    let todosComprobantes = [];
    
    if (formatoCompleto?.comprobantes && Array.isArray(formatoCompleto.comprobantes) && formatoCompleto.comprobantes.length > 0) {
      // Los comprobantes vienen desde el API en la rendición
      todosComprobantes = formatoCompleto.comprobantes;
      console.log('📋 Comprobantes desde API (formatoCompleto):', todosComprobantes);
    } else {
      // Fallback: obtener del estado local si está disponible
      todosComprobantes = obtenerTodosLosComprobantes();
      console.log('📋 Comprobantes desde estado local:', todosComprobantes);
    }
    
    console.log('📊 Total comprobantes:', todosComprobantes.length);

    // Separar en comprobantes regulares y declaración jurada
    const comprobantesRegulares = todosComprobantes.filter(c => c.tipo_comprobante_nombre !== 'DECLARACION JURADA');
    const comprobantesDeclaracionJurada = todosComprobantes.filter(c => c.tipo_comprobante_nombre === 'DECLARACION JURADA');

    // ===== SUBSECCIÓN A: COMPROBANTES REGULARES =====
    // Agregar datos de comprobantes al header para tabla unificada
    if (comprobantesRegulares.length > 0) {
      const comprobantesTableData = comprobantesRegulares.map((c, idx) => {
        const monto = parseFloat(c.monto) || 0;
        
        // 🆕 Función para normalizar acentos
        const normalizarAcentos = (texto) => {
          if (!texto) return '';
          return texto
            .normalize('NFD')                    // Descomponer caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '')    // Remover marcas diacríticas
            .toUpperCase();
        };
        
        // 🆕 Normalizar tipo_viatico (puede venir como tipo_viatitico del backend)
        const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
        
        // 🆕 Normalizar partida: convertir espacios entre dígitos a puntos
        // "23. 2 1. 2 1" -> "23.2.1.2.1"
        const partida = (c.partida || '')
          .trim()
          .replace(/(\d)\s+(\d)/g, '$1.$2')     // Reemplazar espacios entre dígitos con puntos
          .replace(/\s+/g, '')                   // Remover espacios restantes
          .replace(/\.+/g, '.');                 // Normalizar puntos múltiples
        
        // Distribuir por columnas según la partida exacta
        const hospedaje = (partida === '23.2.1.2.2' && tipoViatico === 'HOSPEDAJE') ? monto : 0;
        const alimentacion = (partida === '23.2.1.2.2' && tipoViatico === 'ALIMENTACION') ? monto : 0;
        const comision = (partida === '23.2.1.2.2' && tipoViatico === 'COMISION') ? monto : 0;
        const movilidad = (partida === '23.2.1.2.2' && tipoViatico === 'MOVILIDAD_LOCAL') ? monto : 0;
        const pasaje = (partida === '23.2.1.2.1') ? monto : 0;
        const combustible = (partida === '23.1.3.1.1') ? monto : 0;
        const otrosGastos = (partida && partida !== '23.2.1.2.2' && partida !== '23.2.1.2.1' && partida !== '23.1.3.1.1') ? monto : 0;

        // 🔍 DEBUG: Mostrar la clasificación de cada comprobante
        const clasificacion = hospedaje > 0 ? 'HOSPEDAJE' : alimentacion > 0 ? 'ALIMENTACION' : comision > 0 ? 'COMISION' : movilidad > 0 ? 'MOVILIDAD' : pasaje > 0 ? 'PASAJES' : combustible > 0 ? 'COMBUSTIBLE' : otrosGastos > 0 ? 'OTROS_GASTOS' : 'NO_CLASIFICADO';
        
        console.log(`📌 Comprobante ${idx + 1}:`, {
          numero: c.numero_comprobante,
          tipo: c.tipo_comprobante_nombre,
          partida_original: c.partida,
          partida_normalizada: partida,
          tipo_viatico_original: c.tipo_viatico || c.tipo_viatitico,
          tipo_viatico_normalizado: tipoViatico,
          monto: monto,
          clasificado_en: clasificacion
        });
        
        // 📊 Desglose de valores
        console.log(`   ↳ Hospedaje: ${hospedaje}, Alimentación: ${alimentacion}, Comisión: ${comision}, Movilidad: ${movilidad}, Pasajes: ${pasaje}, Combustible: ${combustible}, Otros: ${otrosGastos}`);

        const fechaComprobante = c.fecha_comprobante ? (() => {
          const fecha = c.fecha_comprobante;
          if (typeof fecha === 'string') {
            // Extraer solo la parte de la fecha (antes de espacio o T)
            const fechaLimpia = fecha.split(' ')[0].split('T')[0];  // 🆕 Maneja "2026-08-21 00:00:00" y "2026-08-21T00:00:00"
            if (fechaLimpia.includes('-')) {
              const partes = fechaLimpia.split('-');
              return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
          }
          return new Date(fecha).toLocaleDateString('es-PE');
        })() : '-';

        return [
          { content: (idx + 1).toString(), styles: { fontSize: 8, halign: 'center' } },
          { content: fechaComprobante, styles: { fontSize: 7.5, halign: 'center' } },
          { content: c.tipo_comprobante_nombre || '', styles: { fontSize: 8, halign: 'center' } },
          { content: c.numero_comprobante || '', styles: { fontSize: 8, halign: 'center' } },
          { content: hospedaje > 0 ? `S/. ${hospedaje.toFixed(2)}` : '', styles: { fontSize: 8, halign: 'right' } },
          { content: alimentacion > 0 ? `S/. ${alimentacion.toFixed(2)}` : '', styles: { fontSize: 8, halign: 'right' } },
          { content: movilidad > 0 ? `S/. ${movilidad.toFixed(2)}` : '', styles: { fontSize: 8, halign: 'right' } },
          { content: pasaje > 0 ? `S/. ${pasaje.toFixed(2)}` : '', styles: { fontSize: 8, halign: 'right' } },
          { content: combustible > 0 ? `S/. ${combustible.toFixed(2)}` : '', styles: { fontSize: 8, halign: 'right' } },
          { content: otrosGastos > 0 ? `S/. ${otrosGastos.toFixed(2)}` : '', styles: { fontSize: 8, halign: 'right' } }
        ];
      });

      // Calcular subtotales
      const normalizarPartida = (partida) => {
        return (partida || '')
          .trim()
          .replace(/(\d)\s+(\d)/g, '$1.$2')     // Reemplazar espacios entre dígitos con puntos
          .replace(/\s+/g, '')                   // Remover espacios restantes
          .replace(/\.+/g, '.');                 // Normalizar puntos múltiples
      };

      // Función auxiliar para normalizar acentos
      const normalizarAcentos = (texto) => {
        if (!texto) return '';
        return texto
          .normalize('NFD')                    // Descomponer caracteres acentuados
          .replace(/[\u0300-\u036f]/g, '')    // Remover marcas diacríticas
          .toUpperCase();
      };

      const subtotalHospedaje = comprobantesRegulares
        .filter(c => {
          const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
          return normalizarPartida(c.partida) === '23.2.1.2.2' && tipoViatico === 'HOSPEDAJE';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalAlimentacion = comprobantesRegulares
        .filter(c => {
          const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
          return normalizarPartida(c.partida) === '23.2.1.2.2' && tipoViatico === 'ALIMENTACION';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalMovilidad = comprobantesRegulares
        .filter(c => {
          const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
          return normalizarPartida(c.partida) === '23.2.1.2.2' && tipoViatico === 'MOVILIDAD_LOCAL';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalPasaje = comprobantesRegulares
        .filter(c => normalizarPartida(c.partida) === '23.2.1.2.1')
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalCombustible = comprobantesRegulares
        .filter(c => normalizarPartida(c.partida) === '23.1.3.1.1')
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalOtrosGastos = comprobantesRegulares
        .filter(c => {
          const partida = normalizarPartida(c.partida);
          return partida && partida !== '23.2.1.2.2' && partida !== '23.2.1.2.1' && partida !== '23.1.3.1.1';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

      const subtotalRegular = subtotalHospedaje + subtotalAlimentacion + subtotalMovilidad + subtotalPasaje + subtotalCombustible + subtotalOtrosGastos;

      // Agregar fila de subtotal
      comprobantesTableData.push([
        { content: 'SUB TOTAL (1)', colSpan: 4, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right', fillColor: [230, 230, 230] } },
        { content: `S/. ${subtotalHospedaje.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalAlimentacion.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalMovilidad.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalPasaje.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalCombustible.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalOtrosGastos.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } }
      ]);

      // Combinar encabezados + datos en una sola tabla
      const tablaCompleta = [...documentosHeaderTableData, ...comprobantesTableData];

      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        body: tablaCompleta,
        columnStyles: {
          0: { cellWidth: (pageWidth - margin * 2) * 0.06 },  // N°
          1: { cellWidth: (pageWidth - margin * 2) * 0.09 },  // FECHA
          2: { cellWidth: (pageWidth - margin * 2) * 0.11 },  // TIPO DOCUMENTO
          3: { cellWidth: (pageWidth - margin * 2) * 0.10 },  // SERIE NUMERO
          4: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // HOSPEDAJE
          5: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // ALIMENTACION
          6: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // MOVILIDAD LOCAL
          7: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // PASAJES
          8: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // COMBUSTIBLE
          9: { cellWidth: (pageWidth - margin * 2) * 0.1067 }   // OTROS GASTOS
        },
        headStyles: {
          fontSize: 5,
          fontStyle: 'bold',
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          halign: 'center',
          valign: 'middle',
          padding: 1,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        bodyStyles: {
          fontSize: 5,
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          padding: 1,
          textColor: [0, 0, 0]
        }
      });

      yPosition = doc.lastAutoTable?.finalY || yPosition + 50;
      yPosition += 2;
    }

    // ===== SUBSECCIÓN B: DECLARACIÓN JURADA =====
    if (comprobantesDeclaracionJurada.length > 0) {
      yPosition = doc.lastAutoTable?.finalY || yPosition + 50;

      // Crear tabla de declaración jurada con encabezado integrado (4 columnas: 1 label + 3 gastos)
      const djHeaderTableData = [
        [
          { content: 'DECLARACION JURADA DE GASTOS ANEXO 4', styles: { fontStyle: 'bold', halign: 'left', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 8 } },
          { content: 'HOSPEDAJE', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } },
          { content: 'ALIMENTACION', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 6 } },
          { content: 'MOVILIDAD\nLOCAL', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 7 } }
        ]
      ];

      const djTableData = [];

      // 🆕 Función para normalizar acentos
      const normalizarAcentos = (texto) => {
        if (!texto) return '';
        return texto
          .normalize('NFD')                    // Descomponer caracteres acentuados
          .replace(/[\u0300-\u036f]/g, '')    // Remover marcas diacríticas
          .toUpperCase();
      };

      // Calcular subtotales DJ con normalización de acentos
      const subtotalDJHospedaje = comprobantesDeclaracionJurada
        .filter(c => {
          const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
          return tipoViatico === 'HOSPEDAJE';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalDJAlimentacion = comprobantesDeclaracionJurada
        .filter(c => {
          const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
          return tipoViatico === 'ALIMENTACION';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      const subtotalDJMovilidad = comprobantesDeclaracionJurada
        .filter(c => {
          const tipoViatico = normalizarAcentos(c.tipo_viatico || c.tipo_viatitico);
          return tipoViatico === 'MOVILIDAD_LOCAL';
        })
        .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

      djTableData.push([
        { content: 'SUB TOTAL (2)', styles: { fontSize: 8, fontStyle: 'bold', halign: 'right', fillColor: [230, 230, 230] } },
        { content: `S/. ${subtotalDJHospedaje.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalDJAlimentacion.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } },
        { content: `S/. ${subtotalDJMovilidad.toFixed(2)}`, styles: { fontSize: 8, halign: 'right', fontStyle: 'bold' } }
      ]);

      // Combinar encabezados + datos
      const djTablaCompleta = [...djHeaderTableData, ...djTableData];

      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        body: djTablaCompleta,
        columnStyles: {
          0: { cellWidth: (pageWidth - margin * 2) * 0.36 },  // DECLARACION JURADA (4 columnas de ancho: 0.06+0.09+0.11+0.10)
          1: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // HOSPEDAJE
          2: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // ALIMENTACION
          3: { cellWidth: (pageWidth - margin * 2) * 0.1067 }   // MOVILIDAD LOCAL
        },
        headStyles: {
          fontSize: 5,
          fontStyle: 'bold',
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          halign: 'center',
          valign: 'middle',
          padding: 1,
          lineColor: [0, 0, 0],
          lineWidth: 0.5
        },
        bodyStyles: {
          fontSize: 5,
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          padding: 1,
          textColor: [0, 0, 0]
        }
      });

      yPosition = doc.lastAutoTable?.finalY || yPosition + 30;
      yPosition += 3;
    }

    // ===== SECCIÓN 3: TOTALES GENERALES =====
    // Calcular totales sumando SUB TOTAL (1) + SUB TOTAL (2) de cada columna
    
    // Función para normalizar acentos (ya definida arriba, pero la redefinimos para claridad)
    const normalizarAcentosFinal = (texto) => {
      if (!texto) return '';
      return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
    };

    // Función para normalizar partida
    const normalizarPartidaFinal = (partida) => {
      return (partida || '')
        .trim()
        .replace(/(\d)\s+(\d)/g, '$1.$2')
        .replace(/\s+/g, '')
        .replace(/\.+/g, '.');
    };

    // Calcular SUB TOTAL (1) de cada columna (comprobantes regulares)
    const subtotalHospedajeFinal = comprobantesRegulares
      .filter(c => {
        const tipoViatico = normalizarAcentosFinal(c.tipo_viatico || c.tipo_viatitico);
        return normalizarPartidaFinal(c.partida) === '23.2.1.2.2' && tipoViatico === 'HOSPEDAJE';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalAlimentacionFinal = comprobantesRegulares
      .filter(c => {
        const tipoViatico = normalizarAcentosFinal(c.tipo_viatico || c.tipo_viatitico);
        return normalizarPartidaFinal(c.partida) === '23.2.1.2.2' && tipoViatico === 'ALIMENTACION';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalMovilidadFinal = comprobantesRegulares
      .filter(c => {
        const tipoViatico = normalizarAcentosFinal(c.tipo_viatico || c.tipo_viatitico);
        return normalizarPartidaFinal(c.partida) === '23.2.1.2.2' && tipoViatico === 'MOVILIDAD_LOCAL';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalPasajeFinal = comprobantesRegulares
      .filter(c => normalizarPartidaFinal(c.partida) === '23.2.1.2.1')
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalCombustibleFinal = comprobantesRegulares
      .filter(c => normalizarPartidaFinal(c.partida) === '23.1.3.1.1')
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalOtrosGastosFinal = comprobantesRegulares
      .filter(c => {
        const partida = normalizarPartidaFinal(c.partida);
        return partida && partida !== '23.2.1.2.2' && partida !== '23.2.1.2.1' && partida !== '23.1.3.1.1';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

    // Calcular SUB TOTAL (2) de cada columna (declaración jurada)
    const subtotalDJHospedajeFinal = comprobantesDeclaracionJurada
      .filter(c => {
        const tipoViatico = normalizarAcentosFinal(c.tipo_viatico || c.tipo_viatitico);
        return tipoViatico === 'HOSPEDAJE';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalDJAlimentacionFinal = comprobantesDeclaracionJurada
      .filter(c => {
        const tipoViatico = normalizarAcentosFinal(c.tipo_viatico || c.tipo_viatitico);
        return tipoViatico === 'ALIMENTACION';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    const subtotalDJMovilidadFinal = comprobantesDeclaracionJurada
      .filter(c => {
        const tipoViatico = normalizarAcentosFinal(c.tipo_viatico || c.tipo_viatitico);
        return tipoViatico === 'MOVILIDAD_LOCAL';
      })
      .reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

    // TOTALES: Sumar SUB TOTAL (1) + SUB TOTAL (2)
    const totalHospedaje = subtotalHospedajeFinal + subtotalDJHospedajeFinal;
    const totalAlimentacion = subtotalAlimentacionFinal + subtotalDJAlimentacionFinal;
    const totalMovilidad = subtotalMovilidadFinal + subtotalDJMovilidadFinal;
    const totalPasaje = subtotalPasajeFinal; // DJ no tiene pasajes
    const totalCombustible = subtotalCombustibleFinal; // DJ no tiene combustible
    const totalOtrosGastos = subtotalOtrosGastosFinal; // DJ no tiene otros gastos
    const totalGastadoAnexo = totalHospedaje + totalAlimentacion + totalMovilidad + totalPasaje + totalCombustible + totalOtrosGastos;

    // Tabla de TOTALES con la misma estructura de 10 columnas
    const totalGeneralAmount = totalHospedaje + totalAlimentacion + totalMovilidad + totalPasaje + totalCombustible + totalOtrosGastos;
    
    // TABLA 1: TOTAL GASTADO (1) + (2)
    const totalesGastadosData = [
      [
        { content: 'TOTAL GASTADO (1) + (2)', colSpan: 4, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right', fillColor: [200, 200, 200] } },
        { content: `S/. ${totalHospedaje.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } },
        { content: `S/. ${totalAlimentacion.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } },
        { content: `S/. ${totalMovilidad.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } },
        { content: `S/. ${totalPasaje.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } },
        { content: `S/. ${totalCombustible.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } },
        { content: `S/. ${totalOtrosGastos.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } }
      ]
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'grid',
      body: totalesGastadosData,
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) * 0.06 },  // N°
        1: { cellWidth: (pageWidth - margin * 2) * 0.09 },  // FECHA
        2: { cellWidth: (pageWidth - margin * 2) * 0.11 },  // TIPO DOCUMENTO
        3: { cellWidth: (pageWidth - margin * 2) * 0.10 },  // SERIE NUMERO
        4: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // HOSPEDAJE
        5: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // ALIMENTACION
        6: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // MOVILIDAD LOCAL
        7: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // PASAJES
        8: { cellWidth: (pageWidth - margin * 2) * 0.1067 },  // COMBUSTIBLE
        9: { cellWidth: (pageWidth - margin * 2) * 0.1067 }   // OTROS GASTOS
      },
      headStyles: {
        fontSize: 8,
        fontStyle: 'bold',
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        padding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        fontSize: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        padding: 1,
        textColor: [0, 0, 0]
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 40;
    yPosition += 2;

    // TABLA 2: TOTAL GENERAL (Separada)
    const totalGeneralData = [
      [
        { content: 'TOTAL GENERAL', colSpan: 9, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right' } },
        { content: `S/. ${totalGeneralAmount.toFixed(2)}`, styles: { fontSize: 8, fontStyle: 'bold', halign: 'right', fillColor: [200, 200, 200] } }
      ]
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'grid',
      body: totalGeneralData,
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) * 0.06 },
        1: { cellWidth: (pageWidth - margin * 2) * 0.09 },
        2: { cellWidth: (pageWidth - margin * 2) * 0.11 },
        3: { cellWidth: (pageWidth - margin * 2) * 0.10 },
        4: { cellWidth: (pageWidth - margin * 2) * 0.1067 },
        5: { cellWidth: (pageWidth - margin * 2) * 0.1067 },
        6: { cellWidth: (pageWidth - margin * 2) * 0.1067 },
        7: { cellWidth: (pageWidth - margin * 2) * 0.1067 },
        8: { cellWidth: (pageWidth - margin * 2) * 0.1067 },
        9: { cellWidth: (pageWidth - margin * 2) * 0.1067 }
      },
      headStyles: {
        fontSize: 8,
        fontStyle: 'bold',
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        padding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        fontSize: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        padding: 1,
        textColor: [0, 0, 0]
      }
    });

    // RESUMEN CON ESTILO SIMILAR AL ENCABEZADO (sin líneas)
    yPosition = doc.lastAutoTable?.finalY || yPosition + 40;
    yPosition += 2;

    // 🆕 Calcular diferencia POR PARTIDA (no un total único)
    let anticipoRecibido = 0;
    let diferenciaAlComisionado = 0;
    let diferenciaAlANATotalPorPartida = 0;
    const diferenciaPorPartida = new Map();  // Almacenar diferencia de cada partida

    if (formatoCompleto?.tipo_emision === 'ANTICIPO') {
      // Si es ANTICIPO, obtener montos por partida desde detalles
      const montosPorPartida = new Map();

      if (formatoCompleto?.detalles && Array.isArray(formatoCompleto.detalles)) {
        anticipoRecibido = formatoCompleto.detalles.reduce((sum, detalle) => sum + (parseFloat(detalle.monto) || 0), 0);

        // Agrupar anticipo por partida (detalles del formato)
        formatoCompleto.detalles.forEach(detalle => {
          const partida = detalle.partida || '';
          const monto = parseFloat(detalle.monto) || 0;
          const nombre = detalle.nombre || '';

          if (partida) {
            if (!montosPorPartida.has(partida)) {
              montosPorPartida.set(partida, { monto: 0, nombre: nombre });
            }
            const entry = montosPorPartida.get(partida);
            entry.monto += monto;
          }
        });
      }

      // Calcular diferencia por partida: monto_certificado - monto_gastado
      const montoGastadoPorPartida = new Map();
      if (todosComprobantes && todosComprobantes.length > 0) {
        todosComprobantes.forEach(c => {
          const partida = c.partida || '';
          const monto = parseFloat(c.monto) || 0;
          if (partida) {
            if (!montoGastadoPorPartida.has(partida)) {
              montoGastadoPorPartida.set(partida, 0);
            }
            montoGastadoPorPartida.set(partida, montoGastadoPorPartida.get(partida) + monto);
          }
        });
      }

      // Calcular diferencia disponible por partida
      montosPorPartida.forEach((value, partida) => {
        const gastado = montoGastadoPorPartida.get(partida) || 0;
        const diferencia = value.monto - gastado;
        if (diferencia > 0) {
          diferenciaPorPartida.set(partida, { diferencia, nombre: value.nombre });
          diferenciaAlANATotalPorPartida += diferencia;
        }
      });

      // Si hay diferencia total negativa, es para el comisionado
      const diferenciaTotalGlobal = anticipoRecibido - totalGeneralAmount;
      if (diferenciaTotalGlobal < 0) {
        diferenciaAlComisionado = Math.abs(diferenciaTotalGlobal);
      }
    } else {
      // Si NO es ANTICIPO, el comisionado debe recibir el total gastado
      anticipoRecibido = 0;
      diferenciaAlComisionado = totalGeneralAmount;
    }

    // 🆕 Construir resumen con total de diferencia
    const resumenData = [
      [
        { content: 'Anticipo recibido', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: S/. ${anticipoRecibido.toFixed(2)}`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: '', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: '', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } }
      ],
      [
        { content: 'Total gastado (1) + (2)', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: S/. ${totalGeneralAmount.toFixed(2)}`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: '', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: '', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } }
      ],
      [
        { content: 'Diferencia a reembolsar al comisionado', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: S/. ${diferenciaAlComisionado.toFixed(2)}`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: '', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: '', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } }
      ],
      [
        { content: 'Diferencia por devolver al ANA', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: S/. ${diferenciaAlANATotalPorPartida.toFixed(2)}`, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: 'Comprobante de Ingreso Nº', styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } },
        { content: `: `, styles: { fontSize: 10, padding: 2, halign: 'left', valign: 'top' } }
      ]
    ];

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'plain',
      body: resumenData,
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) * 0.35 },
        1: { cellWidth: (pageWidth - margin * 2) * 0.15 },
        2: { cellWidth: (pageWidth - margin * 2) * 0.30 },
        3: { cellWidth: (pageWidth - margin * 2) * 0.20 }
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0,
        padding: 2.5,
        valign: 'middle'
      },
      didDrawCell: (data) => {
        // Dibujar línea inferior en celdas de valores (que empiezan con ": ")
        const cellContent = data.cell.text?.[0] || '';
        if (cellContent.startsWith(': ') && cellContent.trim() !== ': ') {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          const bottomY = data.cell.y + data.cell.height;
          doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
        }
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 40;
    yPosition += 6;

    // TABLA DE CLASIFICADORES Y CONCEPTOS
    // Agrupar comprobantes por partida para mostrar resumen
    const partidasMap = new Map();

    if (todosComprobantes && todosComprobantes.length > 0) {
      todosComprobantes.forEach(c => {
        const partida = c.partida || '';
        const monto = parseFloat(c.monto) || 0;
        const clasificador = c.clasificador_nombre || '';

        if (partida) {
          if (partidasMap.has(partida)) {
            const existing = partidasMap.get(partida);
            existing.monto += monto;
          } else {
            partidasMap.set(partida, {
              partida: partida,
              clasificador: clasificador,
              monto: monto
            });
          }
        }
      });
    }

    const clasificadorData = [];
    if (partidasMap.size > 0) {
      // Ordenar partidas para mostrar primero viáticos (2.2) luego pasajes (2.1)
      const partidasOrdenadas = Array.from(partidasMap.values())
        .sort((a, b) => {
          const aNum = a.partida.replace(/\./g, '').replace(/\s+/g, '');
          const bNum = b.partida.replace(/\./g, '').replace(/\s+/g, '');
          return bNum.localeCompare(aNum);
        });

      partidasOrdenadas.forEach(item => {
        const partidaFormateada = item.partida.replace(/\./g, '. ').trim();
        const concepto = item.clasificador;

        // Determinar monto según tipo de emisión y partida
        let montoMostrado = 0;
        let esDiferencia = false;  // 🆕 Marcar si es una fila de diferencia

        // 🆕 Mostrar diferencia según partida (si existe)
        if (formatoCompleto?.tipo_emision === 'ANTICIPO') {
          // Buscar si esta partida tiene diferencia
          if (diferenciaPorPartida.has(item.partida)) {
            montoMostrado = diferenciaPorPartida.get(item.partida).diferencia;
            esDiferencia = true;  // Es una fila de diferencia
          }
        } else if (item.partida.includes('23.2.1.2.2') || item.partida.includes('23. 2 1. 2 2')) {
          // Si no es ANTICIPO, mostrar diferencia al comisionado solo en viáticos
          montoMostrado = diferenciaAlComisionado;
          esDiferencia = true;  // Es una fila de diferencia
        }

        // 🆕 Usar tamaño 8 para todas las filas
        const fontSize = 8;
        const fontStyle = 'normal';

        clasificadorData.push([
          { content: `${partidaFormateada}`, styles: { fontSize: fontSize, padding: 2, halign: 'left', valign: 'top', fontStyle: fontStyle } },
          { content: `${concepto}`, styles: { fontSize: fontSize, padding: 2, halign: 'left', valign: 'top', fontStyle: fontStyle } },
          { content: `: S/. ${montoMostrado.toFixed(2)}`, styles: { fontSize: fontSize, padding: 2, halign: 'left', valign: 'top', fontStyle: fontStyle } }
        ]);
      });
    }

    if (clasificadorData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        margin: margin,
        theme: 'plain',
        body: clasificadorData,
        columnStyles: {
          0: { cellWidth: (pageWidth - margin * 2) * 0.15 },
          1: { cellWidth: (pageWidth - margin * 2) * 0.50 },
          2: { cellWidth: (pageWidth - margin * 2) * 0.10 },
          3: { cellWidth: (pageWidth - margin * 2) * 0.25 }
        },
        bodyStyles: {
          lineColor: [0, 0, 0],
          lineWidth: 0,
          padding: 2.5,
          valign: 'middle'
        }
      });

      yPosition = doc.lastAutoTable?.finalY || yPosition + 20;
      yPosition += 4;
    } else {
      yPosition += 4;
    }

    // DECLARACIONES
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const declaracion1 = '• Declaro que los comprobantes de pago adjuntos a la presente rendición así como los datos contenidos en ella son verídicos';
    const declaracion2 = '• Se adjunta comprobantes de pago originales';

    doc.text(declaracion1, margin, yPosition, { maxWidth: pageWidth - margin * 2, align: 'left' });
    yPosition += doc.getTextDimensions(declaracion1, { maxWidth: pageWidth - margin * 2 }).h + 2;

    doc.text(declaracion2, margin, yPosition, { maxWidth: pageWidth - margin * 2, align: 'left' });
    yPosition += doc.getTextDimensions(declaracion2, { maxWidth: pageWidth - margin * 2 }).h + 4;

    // ===== FOOTER CON FIRMAS =====
    // 🆕 Usar fecha_rendicion si está disponible, si no usar fecha actual
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let fechaParaFooter;
    let horaParaFooter = ''; // 🆕 Variable para la hora

    if (formatoCompleto?.fecha_rendicion) {
      try {
        // Parsear fecha_rendicion (formato: "2026-05-20 09:13:25" o "2026-05-20T09:13:25.xxx")
        let fechaStr = formatoCompleto.fecha_rendicion.replace('T', ' ').split('.')[0];
        const [fechaParte, horaParte] = fechaStr.split(' ');
        const [año, mes, día] = fechaParte.split('-').map(Number);

        if (año && mes && día) {
          fechaParaFooter = new Date(año, mes - 1, día);
          // 🆕 Guardar la hora si está disponible
          if (horaParte) {
            horaParaFooter = ` ${horaParte}`;
          }
        } else {
          fechaParaFooter = new Date();
        }
      } catch (e) {
        console.warn('Error al parsear fecha_rendicion:', e);
        fechaParaFooter = new Date();
      }
    } else {
      fechaParaFooter = new Date();
    }

    const diaSemana = diasSemana[fechaParaFooter.getDay()];
    const dia = fechaParaFooter.getDate();
    const mes = mesesNombres[fechaParaFooter.getMonth()];
    const anio = fechaParaFooter.getFullYear();
    const fechaFormato = `${diaSemana}, ${dia} de ${mes} del ${anio}${horaParaFooter}`; // 🆕 Incluir hora

    // 🆕 SECCIÓN DE FIRMAS - EN CONTINUIDAD NATURAL
    const espacioNecesarioParaFirmas = 35; // Espacio necesario para fecha + firmas
    const espacioDisponible = pageHeight - margin - yPosition;

    // Si no hay espacio suficiente, crear nueva página
    if (espacioDisponible < espacioNecesarioParaFirmas) {
      doc.addPage();
      yPosition = margin + 5; // Comenzar con margen pequeño en la nueva página
    } else {
      yPosition += 3; // Pequeño espacio si está en la misma página
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(fechaFormato, pageWidth - margin, yPosition, { align: 'right' }); // 🆕 Alineado a la derecha

    // Líneas de firma - dos columnas centradas
    const firmaLinesY = yPosition + 25;
    const lineLength = 60;

    // Primera columna (izquierda): centrada en la primera mitad
    const leftX = margin + (pageWidth / 2 - margin - lineLength) / 2;
    // Segunda columna (derecha): centrada en la segunda mitad
    const rightX = pageWidth / 2 + (pageWidth / 2 - margin - lineLength) / 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftX, firmaLinesY, leftX + lineLength, firmaLinesY);
    doc.line(rightX, firmaLinesY, rightX + lineLength, firmaLinesY);

    doc.setFontSize(9);
    doc.setFont('Arial', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('FIRMA DEL COMISIONADO', leftX + lineLength / 2, firmaLinesY + 5, { align: 'center' });
    doc.text('FIRMA DEL JEFE O DIRECTOR', rightX + lineLength / 2, firmaLinesY + 5, { align: 'center' });
  };

  // 🆕 FUNCIÓN PARA GENERAR ANEXO 04 - DECLARACIÓN JURADA
  const generarAnexo04 = async (doc, comision, comisionado, logoBase64, formatoCompleto = null, usuarioDni = '') => {
    /**
     * ANEXO 04: DECLARACIÓN JURADA DE GASTOS
     * Solo incluye comprobantes de tipo DECLARACION JURADA
     * Formato: PORTRAIT
     */

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // AMBITO viene del USUARIO (comisionado)
    const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';

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

    // ===== TÍTULO ANEXO 04 =====
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ANEXO N° 04', pageWidth / 2, titleStartY, { align: 'center' });
    doc.text('DECLARACIÓN JURADA', pageWidth / 2, titleStartY + 5, { align: 'center' });

    yPosition = titleStartY + 12;

    // ===== DECLARACIÓN JURADA - Texto introductorio =====
    const declaracionText = `Yo, ${comisionado.usuario_nombre || 'N/A'}, identificado con DNI N° ${usuarioDni || 'N/A'} y prestando servicios en la ${ambitoDelUsuario || 'N/A'}, en aplicación al artículo 71º de la Directiva de Tesorería para el Año Fiscal 2007, aprobada por Resolución Directoral Nº 002-2007-EF/77.15; DECLARO BAJO JURAMENTO haber efectuado gastos por los conceptos e importes, que no ha sido posible obtener comprobantes de pago en la comisión de servicios en las ciudades de ${comision?.lugar || 'N/A'}:`;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Arial', 'normal');
    doc.text(declaracionText, margin, yPosition, { maxWidth: pageWidth - margin * 2, align: 'justify' });
    yPosition += doc.getTextDimensions(declaracionText, { maxWidth: pageWidth - margin * 2 }).h + 3;

    // ===== TABLA DE COMPROBANTES DECLARACIÓN JURADA =====
    let todosComprobantes = [];

    if (formatoCompleto?.comprobantes && Array.isArray(formatoCompleto.comprobantes) && formatoCompleto.comprobantes.length > 0) {
      todosComprobantes = formatoCompleto.comprobantes;
    } else {
      todosComprobantes = obtenerTodosLosComprobantes();
    }

    // Filtrar solo comprobantes de tipo DECLARACION JURADA
    const comprobantesDeclaracion = todosComprobantes.filter(c => c.tipo_comprobante_nombre === 'DECLARACION JURADA');

    const tableData = comprobantesDeclaracion.map((c, idx) => {
      const fechaComprobante = c.fecha_comprobante ? (() => {
        const fecha = c.fecha_comprobante;
        if (typeof fecha === 'string') {
          // 🆕 Extraer solo la parte de la fecha (antes de espacio o T)
          const fechaLimpia = fecha.split(' ')[0].split('T')[0];
          if (fechaLimpia.includes('-')) {
            const partes = fechaLimpia.split('-');
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
          }
        }
        return new Date(fecha).toLocaleDateString('es-PE');
      })() : '-';

      return [
        { content: (idx + 1).toString(), styles: { fontSize: 9, halign: 'center', valign: 'middle' } },
        { content: fechaComprobante, styles: { fontSize: 9, halign: 'center', valign: 'middle' } },
        { content: c.proveedor_nombre || c.numero_comprobante || '', styles: { fontSize: 9, halign: 'left', valign: 'middle' } },
        { content: `S/. ${(parseFloat(c.monto) || 0).toFixed(2)}`, styles: { fontSize: 9, halign: 'right', valign: 'middle' } }
      ];
    });

    // Agregar fila de total si hay comprobantes
    let totalDeclaracion = 0;
    if (comprobantesDeclaracion.length > 0) {
      totalDeclaracion = comprobantesDeclaracion.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      tableData.push([
        { content: 'TOTAL', colSpan: 3, styles: { fontSize: 9, fontStyle: 'bold', halign: 'right', fillColor: [200, 200, 200] } },
        { content: `S/. ${totalDeclaracion.toFixed(2)}`, styles: { fontSize: 9, fontStyle: 'bold', halign: 'right', fillColor: [200, 200, 200] } }
      ]);
    }

    autoTable(doc, {
      startY: yPosition,
      margin: margin,
      theme: 'grid',
      head: [[
        { content: 'N° ORDEN', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'FECHA', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'CONCEPTO', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } },
        { content: 'IMPORTE (S/.)', styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [200, 200, 200] } }
      ]],
      body: tableData.length > 0 ? tableData : [[
        { content: 'No hay gastos declarados', colSpan: 4, styles: { fontSize: 9, halign: 'center', valign: 'middle' } }
      ]],
      columnStyles: {
        0: { cellWidth: (pageWidth - margin * 2) * 0.15 },
        1: { cellWidth: (pageWidth - margin * 2) * 0.20 },
        2: { cellWidth: (pageWidth - margin * 2) * 0.45 },
        3: { cellWidth: (pageWidth - margin * 2) * 0.20 }
      },
      headStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        padding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        fontSize: 9,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        padding: 2,
        textColor: [0, 0, 0]
      }
    });

    yPosition = doc.lastAutoTable?.finalY || yPosition + 40;
    yPosition += 7;

    // ===== NOTA SOBRE LÍMITE DE VIATICOS =====
    const notaText = `NOTA: Sólo para sustentar gastos efectuados en lugares alejados, donde no es posible obtener comprobantes de pago (pequeños poblados, zonas rurales y caseríos), o servicios de movilidad (taxi), sólo hasta un máximo del 30% del total de viático otorgado.`;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Arial', 'normal');
    doc.text(notaText, margin, yPosition, { maxWidth: pageWidth - margin * 2, align: 'justify' });
    yPosition += doc.getTextDimensions(notaText, { maxWidth: pageWidth - margin * 2 }).h + 5;

    // ===== FOOTER CON FIRMA Y FECHA =====
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let fechaParaFooter;
    let horaParaFooter = '';

    if (formatoCompleto?.fecha_rendicion) {
      try {
        let fechaStr = formatoCompleto.fecha_rendicion.replace('T', ' ').split('.')[0];
        const [fechaParte, horaParte] = fechaStr.split(' ');
        const [año, mes, día] = fechaParte.split('-').map(Number);

        if (año && mes && día) {
          fechaParaFooter = new Date(año, mes - 1, día);
          if (horaParte) {
            horaParaFooter = ` ${horaParte}`;
          }
        } else {
          fechaParaFooter = new Date();
        }
      } catch (e) {
        console.warn('Error al parsear fecha_rendicion:', e);
        fechaParaFooter = new Date();
      }
    } else {
      fechaParaFooter = new Date();
    }

    const diaSemana = diasSemana[fechaParaFooter.getDay()];
    const dia = fechaParaFooter.getDate();
    const mes = mesesNombres[fechaParaFooter.getMonth()];
    const anio = fechaParaFooter.getFullYear();
    const fechaFormato = `${diaSemana}, ${dia} de ${mes} del ${anio}${horaParaFooter}`;

    // 🆕 SECCIÓN DE FIRMAS - EN CONTINUIDAD NATURAL
    const espacioNecesarioParaFirmas04 = 35;
    const espacioDisponible04 = pageHeight - margin - yPosition;

    // Si no hay espacio suficiente, crear nueva página
    if (espacioDisponible04 < espacioNecesarioParaFirmas04) {
      doc.addPage();
      yPosition = margin + 5; // Comenzar con margen pequeño en la nueva página
    } else {
      yPosition += 3; // Pequeño espacio si está en la misma página
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(fechaFormato, margin, yPosition, { align: 'left' });

    // Línea de firma
    const firmaLineY = yPosition + 30;
    const lineLength = 60;
    const firmaX = pageWidth / 2 - lineLength / 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(firmaX, firmaLineY, firmaX + lineLength, firmaLineY);

    doc.setFontSize(9);
    doc.setFont('Arial', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('FIRMA DEL COMISIONADO', firmaX + lineLength / 2, firmaLineY + 5, { align: 'center' });
  };

  // 🆕 FUNCIÓN PARA GENERAR ANEXO 05 - CERTIFICADO DE COMISIÓN DE SERVICIOS
  const generarAnexo05 = async (doc, comision, comisionado, logoBase64, formatoCompleto = null, usuarioDni = '') => {
    /**
     * ANEXO 05: CERTIFICADO DE COMISIÓN DE SERVICIOS
     * Formato: PORTRAIT
     */

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // AMBITO viene del USUARIO (comisionado)
    const ambitoDelUsuario = comisionado.ambito_nombre || 'SIN DIRECCIÓN ASIGNADA';

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

    // ===== TÍTULO ANEXO 05 =====
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ANEXO N° 05', pageWidth / 2, titleStartY, { align: 'center' });
    doc.text('CERTIFICADO DE COMISIÓN DE SERVICIOS', pageWidth / 2, titleStartY + 5, { align: 'center' });

    yPosition = titleStartY + 14;

    // ===== DATOS DEL COMISIONADO =====
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.text('Datos del Comisionado:', margin, yPosition);
    // Subrayar título
    const titleWidth1 = doc.getTextWidth('Datos del Comisionado:');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 2, margin + titleWidth1, yPosition + 2);
    yPosition += 8;

    doc.setFont('Arial', 'normal');
    const datosComisionado = [
      { label: 'Nombres y apellidos', value: comisionado.usuario_nombre || 'N/A' },
      { label: 'Dependencia', value: ambitoDelUsuario || 'N/A' }
    ];

    for (const dato of datosComisionado) {
      doc.setFontSize(10);
      doc.text(dato.label + ':', margin, yPosition);
      doc.text(dato.value, margin + 50, yPosition);
      yPosition += 5;
    }

    yPosition += 3;

    // ===== FECHA Y LUGAR DE COMISIÓN =====
    doc.setFontSize(12);
    doc.setFont('Arial', 'bold');
    doc.text('Fecha y Lugar de Comisión:', margin, yPosition);
    // Subrayar título
    const titleWidth2 = doc.getTextWidth('Fecha y Lugar de Comisión:');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 2, margin + titleWidth2, yPosition + 2);
    yPosition += 8;

    doc.setFont('Arial', 'normal');

    // Formatear fechas desde rutas si existen
    let fechaSalida = 'N/A';
    let horaSalida = '';
    let fechaRetorno = 'N/A';
    let horaRetorno = '';

    const formatearFechaHora = (fechaIso) => {
      try {
        // Convertir de UTC a Lima (UTC-5): restar 5 horas
        const fechaUTC = new Date(fechaIso);
        const milisegundos5Horas = 5 * 60 * 60 * 1000; // 5 horas en milisegundos
        const fechaLima = new Date(fechaUTC.getTime() - milisegundos5Horas);

        // Extraer componentes usando UTC (porque ya ajustamos a Lima)
        const año = fechaLima.getUTCFullYear();
        const mesNum = String(fechaLima.getUTCMonth() + 1).padStart(2, '0');
        const día = String(fechaLima.getUTCDate()).padStart(2, '0');
        const horas = String(fechaLima.getUTCHours()).padStart(2, '0');
        const minutos = String(fechaLima.getUTCMinutes()).padStart(2, '0');

        return {
          fecha: `${día}/${mesNum}/${año}`,
          hora: ` Hora: ${horas}:${minutos} horas`
        };
      } catch (e) {
        return { fecha: 'N/A', hora: '' };
      }
    };

    const rutas = formatoCompleto?.rutas || [];
    if (rutas.length > 0) {
      // Primera ruta para fecha y hora de inicio
      const primeraRuta = rutas[0];
      const formatoSalida = formatearFechaHora(primeraRuta.fecha_salida);
      fechaSalida = formatoSalida.fecha;
      horaSalida = formatoSalida.hora;

      // Última ruta para fecha y hora de término
      const ultimaRuta = rutas[rutas.length - 1];
      const formatoRetorno = formatearFechaHora(ultimaRuta.fecha_llegada);
      fechaRetorno = formatoRetorno.fecha;
      horaRetorno = formatoRetorno.hora;
    } else {
      // Fallback a fechas del formato si no hay rutas
      if (formatoCompleto?.fecha_salida) {
        const formatoSalida = formatearFechaHora(formatoCompleto.fecha_salida);
        fechaSalida = formatoSalida.fecha;
        horaSalida = formatoSalida.hora;
      }
      if (formatoCompleto?.fecha_retorno) {
        const formatoRetorno = formatearFechaHora(formatoCompleto.fecha_retorno);
        fechaRetorno = formatoRetorno.fecha;
        horaRetorno = formatoRetorno.hora;
      }
    }

    const datosFecha = [
      { label: 'Fecha de inicio de comisión', value: fechaSalida + horaSalida },
      { label: 'Fecha de término de la comisión', value: fechaRetorno + horaRetorno },
      { label: 'Lugar de trabajo', value: comision?.lugar || formatoCompleto?.lugar || 'N/A' },
      { label: 'Motivo de la comisión', value: formatoCompleto?.actividad_realizar || 'N/A' }
    ];

    for (const dato of datosFecha) {
      doc.setFontSize(10);
      const labelWidth = 50;
      doc.text(dato.label + ':', margin, yPosition);
      doc.text(dato.value, margin + labelWidth, yPosition, { maxWidth: pageWidth - margin * 2 - labelWidth });
      const textHeight = doc.getTextDimensions(dato.value, { maxWidth: pageWidth - margin * 2 - labelWidth }).h;
      yPosition += Math.max(5, textHeight + 2);
    }

    yPosition += 5;

    // ===== FOOTER CON FECHA Y FIRMA =====
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let fechaParaFooter;
    let horaParaFooter = '';

    if (formatoCompleto?.fecha_rendicion) {
      try {
        let fechaStr = formatoCompleto.fecha_rendicion.replace('T', ' ').split('.')[0];
        const [fechaParte, horaParte] = fechaStr.split(' ');
        const [año, mes, día] = fechaParte.split('-').map(Number);

        if (año && mes && día) {
          fechaParaFooter = new Date(año, mes - 1, día);
          if (horaParte) {
            horaParaFooter = ` ${horaParte}`;
          }
        } else {
          fechaParaFooter = new Date();
        }
      } catch (e) {
        console.warn('Error al parsear fecha_rendicion:', e);
        fechaParaFooter = new Date();
      }
    } else {
      fechaParaFooter = new Date();
    }

    const diaSemana = diasSemana[fechaParaFooter.getDay()];
    const dia = fechaParaFooter.getDate();
    const mes = mesesNombres[fechaParaFooter.getMonth()];
    const anio = fechaParaFooter.getFullYear();
    const fechaFormato = `${diaSemana}, ${dia} de ${mes} del ${anio}${horaParaFooter}`;

    // 🆕 SECCIÓN DE FIRMAS - EN CONTINUIDAD NATURAL
    const espacioNecesarioParaFirmas05 = 35;
    const espacioDisponible05 = pageHeight - margin - yPosition;

    // Si no hay espacio suficiente, crear nueva página
    if (espacioDisponible05 < espacioNecesarioParaFirmas05) {
      doc.addPage();
      yPosition = margin + 5; // Comenzar con margen pequeño en la nueva página
    } else {
      yPosition += 3; // Pequeño espacio si está en la misma página
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(fechaFormato, margin, yPosition);

    // Líneas de firma - dos columnas
    const firmaLinesY = yPosition + 30;
    const lineLength = 60;

    // Primera columna (izquierda): centrada en la primera mitad
    const leftX = margin + (pageWidth / 2 - margin - lineLength) / 2;
    // Segunda columna (derecha): centrada en la segunda mitad
    const rightX = pageWidth / 2 + (pageWidth / 2 - margin - lineLength) / 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftX, firmaLinesY, leftX + lineLength, firmaLinesY);
    doc.line(rightX, firmaLinesY, rightX + lineLength, firmaLinesY);

    doc.setFontSize(9);
    doc.setFont('Arial', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('FIRMA DEL COMISIONADO', leftX + lineLength / 2, firmaLinesY + 5, { align: 'center' });
    doc.text('FIRMA DEL JEFE O DIRECTOR', rightX + lineLength / 2, firmaLinesY + 5, { align: 'center' });
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
      
      // 🆕 Obtener rutas Y comprobantes de la rendición
      let rutasDelFormato = [];
      let comprobantesDelFormato = [];
      try {
        const rendicionResponse = await api.obtenerRendicionesPorFormato(row.formato_existente.id);
        rutasDelFormato = rendicionResponse?.rutas || [];
        comprobantesDelFormato = rendicionResponse?.rendiciones || [];
        console.log('📍 Rutas obtenidas del API:', rutasDelFormato);
        console.log('📋 Comprobantes obtenidos del API:', comprobantesDelFormato);
      } catch (error) {
        console.warn('⚠️ No se pudieron obtener los datos:', error.message);
      }
      
      // Agregar rutas y comprobantes al formatoCompleto para pasarlas a generarAnexo03
      formatoCompleto.rutas = rutasDelFormato;
      formatoCompleto.comprobantes = comprobantesDelFormato;
      
      // Obtener la comisión completa
      const comisionCompleta = await api.obtenerComision(row.comision_id);
      
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

      // 🆕 Obtener DNI del usuario
      let usuarioDni = '';
      try {
        if (comisionado.usuario_id) {
          const usuarioData = await api.obtenerUsuario(comisionado.usuario_id);
          usuarioDni = usuarioData.numero_documento || usuarioData.dni || '';
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener el DNI del usuario:', error.message);
        usuarioDni = '';
      }

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
        } else {
        }
      } catch (error) {
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
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
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
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('FIRMA DEL JEFE O DIRECTOR', pageWidth / 2, firmaY + 5, { align: 'center' });
      } else if (tipo === 'anexo2') {
        // Generar solo Anexo 02 con datos del formato emitido
        await generarAnexo02(doc, comisionCompleta, comisionado, logoBase64, formatoCompleto);
      } else if (tipo === 'anexo3') {
        // Generar solo Anexo 03 con datos de rendición
        await generarAnexo03(doc, comisionCompleta, comisionado, logoBase64, formatoCompleto);
      } else if (tipo === 'anexo4') {
        // Generar solo Anexo 04 con datos de declaración jurada
        await generarAnexo04(doc, comisionCompleta, comisionado, logoBase64, formatoCompleto, usuarioDni);
      } else if (tipo === 'anexo5') {
        // Generar solo Anexo 05 con certificado de comisión
        await generarAnexo05(doc, comisionCompleta, comisionado, logoBase64, formatoCompleto, usuarioDni);
      }

      // Convertir a blob y crear URL
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfPreviewUrl(pdfUrl);
      setOpenPreview(true);
      setPreviewLoading(false);
    } catch (error) {
      setPreviewLoading(false);
      Swal.fire('Error', `No se pudo mostrar el anexo: ${error.message}`, 'error');
    }
  };

  // Clasificación de la rendición a partir de los estados reales del backend.
  // La celda y los indicadores usan esta misma función para no contradecirse.
  const clasificarRendicion = (o) => {
    const { fecha_retorno, estado_emision } = o;
    if (!fecha_retorno) return { tipo: 'SIN_FECHA' };
    if (estado_emision === 'RENDIDO') {
      const fechaRend = String(o.formato_existente?.fecha_rendicion || '').slice(0, 10);
      if (!fechaRend) return { tipo: 'RENDIDO' };
      const [ra, rm, rd] = fechaRend.split('-').map(Number);
      const rendidoEl = new Date(ra, rm - 1, rd);
      const vencimiento = calcularVencimientoRendicion(fecha_retorno);
      return {
        tipo: rendidoEl <= vencimiento ? 'RENDIDO_EN_PLAZO' : 'RENDIDO_FUERA_PLAZO',
        rendidoEl,
        vencimiento,
      };
    }
    if (estado_emision === 'DEVUELTO') return { tipo: 'DEVUELTO' };
    if (!['EMITIDO', 'ENVIADO', 'PAGADO', 'RINDIENDO'].includes(estado_emision)) return { tipo: 'NO_APLICA' };
    const vencimiento = calcularVencimientoRendicion(fecha_retorno);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (vencimiento < hoy) return { tipo: 'VENCIDO', vencimiento };
    return { tipo: 'PENDIENTE', vencimiento, diasRestantes: contarDiasHabilesHasta(vencimiento) };
  };

  // Etiqueta visual de la rendición (null cuando no aplica)
  const etiquetaRendicion = (c) => {
    switch (c.tipo) {
      case 'RENDIDO':
        return { texto: 'Rendido', color: 'success' };
      case 'RENDIDO_EN_PLAZO':
        return { texto: 'En plazo', color: 'success' };
      case 'RENDIDO_FUERA_PLAZO':
        return { texto: 'Fuera de plazo', color: 'error' };
      case 'DEVUELTO':
        return { texto: 'Devuelto', color: 'light' };
      case 'VENCIDO':
        return { texto: 'Vencido', color: 'error' };
      case 'PENDIENTE':
        return c.diasRestantes <= 3
          ? { texto: 'Por vencer', color: 'warning' }
          : { texto: 'En plazo', color: 'success' };
      default:
        return null;
    }
  };

  const montoPeruEmision = (valor) =>
    Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Indicadores sobre el conjunto completo de comisiones (no solo la página)
  const resumenEmision = (() => {
    let pendientesEmision = 0;
    let enPlazo = 0;
    let vencidas = 0;
    let rendidas = 0;
    comisiones.forEach((o) => {
      if (!o.tiene_formato) pendientesEmision += 1;
      const c = clasificarRendicion(o);
      if (c.tipo === 'VENCIDO') vencidas += 1;
      if (['RENDIDO', 'RENDIDO_EN_PLAZO', 'RENDIDO_FUERA_PLAZO'].includes(c.tipo)) rendidas += 1;
      if (c.tipo === 'RENDIDO_EN_PLAZO' || (c.tipo === 'PENDIENTE' && c.diasRestantes > 3)) enPlazo += 1;
    });
    return { total: comisiones.length, pendientesEmision, enPlazo, vencidas, rendidas };
  })();

  // Contenido del Drawer: todos los datos de la comisión, por secciones
  const renderVerFormato = (o) => {
    const f = o.formato_existente || {};
    const c = clasificarRendicion(o);
    const et = etiquetaRendicion(c);
    const destinos = resumirDestinos(o.lugar).partes;
    return (
      <>
        <SeccionVerEmision numero="01" titulo="Información del documento">
          <DatoVerEmision etiqueta="N° de documento">{o.numero_documento || 'Sin formato emitido'}</DatoVerEmision>
          <DatoVerEmision etiqueta="Estado del formato">{f.estado_emision || o.estado_emision || '-'}</DatoVerEmision>
          <DatoVerEmision etiqueta="Tipo de emisión">{f.tipo_emision || '-'}</DatoVerEmision>
          <DatoVerEmision etiqueta="SIAF">{f.numero_siaf || '-'}</DatoVerEmision>
          <DatoVerEmision etiqueta="CUT">{f.numero_cut || '-'}</DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="02" titulo="Información del comisionado">
          <DatoVerEmision etiqueta="Comisionado">{o.usuario_nombre || '-'}</DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="03" titulo="Ámbito y destinos">
          <DatoVerEmision etiqueta="Ámbito">{o.ambito_nombre || '-'}</DatoVerEmision>
          <DatoVerEmision etiqueta="Destinos">
            {destinos.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {destinos.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : (
              '-'
            )}
          </DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="04" titulo="Período de la comisión">
          <DatoVerEmision etiqueta="Fecha de salida">{fechaCorta(o.fecha_salida)}</DatoVerEmision>
          <DatoVerEmision etiqueta="Fecha de retorno">{fechaCorta(o.fecha_retorno)}</DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="05" titulo="Modalidad de viaje">
          <DatoVerEmision etiqueta="Modalidad">{o.modalidad_viaje || '-'}</DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="06" titulo="Información presupuestal">
          <DatoVerEmision etiqueta="CCP (certificación)">{f.certificacion_nota || 'Sin certificación'}</DatoVerEmision>
          <DatoVerEmision etiqueta="Monto de la comisión">{montoPeruEmision(o.monto)}</DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="07" titulo="Control de rendición">
          <DatoVerEmision etiqueta="Estado de rendición">{et ? et.texto : '-'}</DatoVerEmision>
          <DatoVerEmision etiqueta="Fecha de vencimiento">
            {c.vencimiento ? c.vencimiento.toLocaleDateString('es-ES') : '-'}
          </DatoVerEmision>
          <DatoVerEmision etiqueta="Fecha de rendición">{f.fecha_rendicion ? fechaCorta(f.fecha_rendicion) : '-'}</DatoVerEmision>
          <DatoVerEmision etiqueta="Comprobantes">{f.comprobantes_count ?? '-'}</DatoVerEmision>
        </SeccionVerEmision>
        <SeccionVerEmision numero="08" titulo="Documentos y formatos asociados">
          <DatoVerEmision etiqueta="Formato">{o.tiene_formato ? o.numero_documento : 'No emitido'}</DatoVerEmision>
          <MDTypography variant="caption" color="text" display="block">
            Los anexos y el formato se abren con los botones de la fila.
          </MDTypography>
        </SeccionVerEmision>
      </>
    );
  };

  const columnasTabla = [
    {
      Header: 'Item',
      accessor: 'item',
      width: '4%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        return (
          <MDBox
            sx={{
              // eslint-disable-next-line react/prop-types
              paddingTop: isNewComisionadoGroup(row.index) ? '12px' : '4px',
              // eslint-disable-next-line react/prop-types
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
      Cell: ({ row }) => (
        <MDTypography variant="button" fontWeight="bold" color="info">
          {row.original.numero_documento || '-'}
        </MDTypography>
      ),
    },
    {
      Header: 'Comisionado',
      accessor: 'usuario_nombre',
      width: '14%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ value }) => (
        <MDTypography variant="button" display="block" sx={{ lineHeight: 1.3 }}>
          {value || '-'}
        </MDTypography>
      ),
    },
    { Header: 'Ámbito', accessor: 'ambito_nombre', width: '9%' },
    {
      Header: 'Lugar',
      accessor: 'lugar',
      width: '14%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        const { visibles, extra } = resumirDestinos(original.lugar);
        return (
          <MDTypography
            variant="button"
            display="block"
            title={original.lugar || ''}
            sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {visibles.join(', ')}
            {extra > 0 ? ` (+${extra} más)` : ''}
          </MDTypography>
        );
      },
    },
    {
      Header: 'Período',
      accessor: 'fecha_salida',
      width: '10%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => (
        <MDBox lineHeight={1.3}>
          <MDTypography variant="button" display="block">
            {fechaCorta(original.fecha_salida)}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block">
            al {fechaCorta(original.fecha_retorno)}
          </MDTypography>
        </MDBox>
      ),
    },
    {
      Header: 'Rendición',
      width: '13%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        const c = clasificarRendicion(original);
        const et = etiquetaRendicion(c);
        if (!et) return '-';
        const lineas = [
          c.vencimiento ? `Vence el ${c.vencimiento.toLocaleDateString('es-ES')}` : null,
          c.tipo === 'PENDIENTE' && c.diasRestantes > 0 ? `${c.diasRestantes} días hábiles` : null,
          c.rendidoEl ? `Rendido el ${c.rendidoEl.toLocaleDateString('es-ES')}` : null,
        ].filter(Boolean);
        return (
          <MDBox lineHeight={1.3}>
            <MDBadge badgeContent={et.texto} color={et.color} variant="gradient" size="sm" />
            {lineas.map((t) => (
              <MDTypography key={t} variant="caption" color="text" display="block">
                {t}
              </MDTypography>
            ))}
          </MDBox>
        );
      },
    },
    {
      Header: 'Presupuesto',
      width: '12%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        const nota = original.formato_existente?.certificacion_nota;
        return (
          <MDBox lineHeight={1.3}>
            {nota ? (
              <MDTypography variant="button" fontWeight="bold" color="info" display="block">
                {`CCP: ${nota}`}
              </MDTypography>
            ) : (
              <MDTypography variant="caption" color="warning" display="block">
                Sin certificación
              </MDTypography>
            )}
            <MDTypography variant="button" fontWeight="bold" color="dark" display="block">
              {montoPeruEmision(original.monto)}
            </MDTypography>
          </MDBox>
        );
      },
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      width: '12%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        // 🆕 Mostrar botones diferente si ya existe formato
        if (original.tiene_formato) {
          return (
            <MDBox sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', '& .anexo-numero': { fontSize: '1.25rem !important', fontWeight: 700, lineHeight: 1 } }}>
          <Tooltip title="Visualizar">
            <IconButton size="small" color="info" onClick={() => setFormatoVer(original)} sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
              {/* ✏️ Modificar Formato - NO mostrar si estado es RENDIDO */}
              {!['RENDIDO', 'DEVUELTO'].includes(original.estado_emision) && (
                <Tooltip title="Modificar formato existente">
                  <span>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleAbrirModalModificarFormato(original)}
                      sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {!['RENDIDO', 'DEVUELTO'].includes(original.estado_emision) && (
                <Tooltip title="Ingresar o modificar SIAF y CUT">
                  <span>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleAbrirSiafCut(original)}
                      sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <TagIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {['ENVIADO', 'PAGADO'].includes(original.estado_emision) && (
                <Tooltip title="Devolver todo el viático con motivo">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDevolucionTotal(original)}
                      sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title="Ver Anexo 01">
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => verAnexoEnModal('anexo1', original)}
                    disabled={previewLoading}
                    sx={{ backgroundColor: '#fff3e0', '&:hover': { backgroundColor: '#ffe0b2' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                  >
                    <span className="anexo-numero">1</span>
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Ver Anexo 02">
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => verAnexoEnModal('anexo2', original)}
                    disabled={previewLoading}
                    sx={{ backgroundColor: '#fff3e0', '&:hover': { backgroundColor: '#ffe0b2' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                  >
                    <span className="anexo-numero">2</span>
                  </IconButton>
                </span>
              </Tooltip>
              {original.estado_emision === 'RENDIDO' && (
                <Tooltip title="Ver Anexo 03 - Rendición de Cuentas">
                  <span>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => verAnexoEnModal('anexo3', original)}
                      disabled={previewLoading}
                      sx={{ backgroundColor: '#fff3e0', '&:hover': { backgroundColor: '#ffe0b2' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <span className="anexo-numero">3</span>
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {original.estado_emision === 'RENDIDO' && (
                <Tooltip title="Ver Anexo 04 - Declaración Jurada">
                  <span>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => verAnexoEnModal('anexo4', original)}
                      disabled={previewLoading}
                      sx={{ backgroundColor: '#fff3e0', '&:hover': { backgroundColor: '#ffe0b2' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <span className="anexo-numero">4</span>
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {original.estado_emision === 'RENDIDO' && (
                <Tooltip title="Ver Anexo 05 - Certificado de Comisión">
                  <span>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => verAnexoEnModal('anexo5', original)}
                      disabled={previewLoading}
                      sx={{ backgroundColor: '#fff3e0', '&:hover': { backgroundColor: '#ffe0b2' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <span className="anexo-numero">5</span>
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {/* 🆕 Botón Rendir/Modificar según estado */}
              {(original.formato_existente?.tipo_emision === 'REEMBOLSO' || String(original.formato_existente?.numero_siaf || '').trim() !== '') && (original.estado_emision === 'ENVIADO' || original.estado_emision === 'PAGADO' || (original.estado_emision === 'RINDIENDO' && !((original.formato_existente && original.formato_existente.comprobantes_count) > 0))) && (
                <Tooltip title={!(original.formato_existente?.tipo_emision !== 'REEMBOLSO') || String(original.formato_existente?.numero_siaf || '').trim() ? 'Rendir comprobantes de gasto' : 'Falta registrar el SIAF para rendir'}>
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleAbrirModalRendicion(original)}
                      disabled={(original.formato_existente?.tipo_emision !== 'REEMBOLSO') && !String(original.formato_existente?.numero_siaf || '').trim()}
                      sx={{ backgroundColor: '#e8f5e9', '&:hover': { backgroundColor: '#c8e6c9' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <PaymentsIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {(original.formato_existente?.tipo_emision === 'REEMBOLSO' || String(original.formato_existente?.numero_siaf || '').trim() !== '') && (original.estado_emision === 'RENDIDO' || (original.estado_emision === 'RINDIENDO' && (original.formato_existente && original.formato_existente.comprobantes_count) > 0)) && (
                <Tooltip title="Modificar rendición de comprobantes">
                  <span>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleAbrirModalRendicion(original)}
                      sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                    >
                      <EditNoteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </MDBox>
          );
        }
        
        return (
          <MDBox display="flex" gap={0.5} justifyContent="center" flexWrap="wrap">
          <Tooltip title="Visualizar">
            <IconButton size="small" color="info" onClick={() => setFormatoVer(original)} sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Emitir">
            <span>
              <IconButton
                size="small"
                color="info"
                onClick={() => handleAbrirModalEmitirFormato(original)}
                sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
              >
                <DescriptionIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          </MDBox>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card>
          <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info">
            <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
              Emisión de Formatos de Comisión
            </MDTypography>
            <MDTypography variant="button" color="white" opacity={0.8}>
              Selecciona una comisión aprobada con presupuesto asignado para emitir su formato.
            </MDTypography>
          </MDBox>

        <MDBox px={3} pt={2}>
          <MDBox display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }} gap={2}>
            {[
              { etiqueta: 'Total de comisiones', valor: resumenEmision.total },
              { etiqueta: 'Pendientes de emisión', valor: resumenEmision.pendientesEmision },
              { etiqueta: 'En plazo', valor: resumenEmision.enPlazo },
              { etiqueta: 'Vencidas', valor: resumenEmision.vencidas },
              { etiqueta: 'Rendidas', valor: resumenEmision.rendidas },
            ].map((item) => (
              <MDBox key={item.etiqueta} p={2} sx={{ border: '1px solid #e8eaed', borderRadius: '8px', backgroundColor: '#fff' }}>
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

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </MDBox>
        ) : (
          <MDBox p={2}>
              <DataTable
                table={{
                  columns: columnasTabla,
                  rows: [...comisiones].sort((a, b) =>
                    String(b.numero_documento || '').localeCompare(String(a.numero_documento || ''), undefined, { numeric: true })
                  ),
                }}
                canSearch
                isSorted={false}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries={true}
                noEndBorder
                vistaMovil
              />
          </MDBox>
        )}
        </Card>
      </MDBox>

      {/* Drawer de detalle de la comisión */}
      <Drawer
        anchor="right"
        open={Boolean(formatoVer)}
        onClose={() => setFormatoVer(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <MDBox px={3} py={2} display="flex" justifyContent="space-between" alignItems="center" sx={{ backgroundColor: '#1A73E8' }}>
          <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
            Detalle de la comisión
          </MDTypography>
          <IconButton size="small" onClick={() => setFormatoVer(null)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </MDBox>
        <MDBox p={3}>{formatoVer && renderVerFormato(formatoVer)}</MDBox>
      </Drawer>

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

    
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCerrarPreview} variant="text" color="dark">
            Cerrar
          </MDButton>
     
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
            </Box>

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

            {/* 🆕 FUENTE DE FINANCIAMIENTO */}
            <Autocomplete
              disabled={!!formValues.certificacion_id}  // 🔒 Bloqueado si hay certificación
              options={fuentesFinanciamientoDisponibles || []}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `${option.abreviatura || ''} - ${option.nombre || ''}`
              }
              value={fuentesFinanciamientoDisponibles?.find((f) => f?.id === formValues.fuente_financiamiento_id) || null}
              onChange={(event, newValue) => {
                setFormValues({
                  ...formValues,
                  fuente_financiamiento_id: newValue?.id || '',
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fuente de Financiamiento"
                  placeholder={formValues.certificacion_id ? "Bloqueado: Certificación ya seleccionada" : "Seleccionar fuente..."}
                  size="small"
                  helperText={formValues.certificacion_id ? "La fuente se define automáticamente desde la Certificación" : ""}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {option.abreviatura} - {option.nombre}
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
                      fuente_financiamiento_id: ''  // 🆕 Limpiar fuente cuando se selecciona certificación
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
                                    } else {
                                    }

                                    const nuevosDetalles = [...detallesEditables];
                                    nuevosDetalles[idx] = {
                                      ...nuevosDetalles[idx],
                                      clasificador_id: idClasificador || '',
                                      clasificador_nombre: nombreClasificador,
                                      detalles_certificacion_credito_id: detallesCertificacionId
                                    };
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
                      <MDTypography variant="body2" color="text">
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

      <Dialog open={openSiafCut} onClose={() => setOpenSiafCut(false)} maxWidth="xs" fullWidth>
        <DialogTitle>🔢 SIAF / CUT</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="SIAF (10 dígitos)"
            value={siafCutForm.numero_siaf}
            onChange={(e) => setSiafCutForm(prev => ({ ...prev, numero_siaf: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            onBlur={() => setSiafCutForm(prev => ({ ...prev, numero_siaf: formatearSiaf(prev.numero_siaf) }))}
            placeholder="0000000123"
            size="small"
            helperText="Al salir del campo se completa con ceros a la izquierda"
          />
          <TextField
            fullWidth
            label="Número CUT (Opcional)"
            value={siafCutForm.numero_cut}
            onChange={(e) => setSiafCutForm(prev => ({ ...prev, numero_cut: e.target.value }))}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSiafCut(false)} disabled={guardandoDirecto}>Cancelar</Button>
          <MDButton variant="gradient" color="info" onClick={handleGuardarSiafCut} disabled={guardandoDirecto}>
            Guardar
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* 🆕 Dialog para Rendición de Formatos */}
      <Dialog open={openRendicion} onClose={handleCerrarModalRendicion} maxWidth="lg" fullWidth>
        <DialogTitle>💰 Rendir Formato de Comisión</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '600px', overflow: 'auto' }}>
          {formatoSeleccionadoParaRendir && (
            <>
              {/* Información del Formato */}
              <MDBox sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <MDTypography variant="body2" fontWeight="bold">📋 Información del Formato</MDTypography>
                <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                  <TextField disabled fullWidth label="Comisionado" value={formatoSeleccionadoParaRendir.usuario_nombre || ''} size="small" />
                  <TextField disabled fullWidth label="Lugar" value={formatoSeleccionadoParaRendir.lugar || ''} size="small" />
                  <TextField disabled fullWidth label="Monto Total" value={`S/. ${parseFloat(formatoSeleccionadoParaRendir.monto || 0).toFixed(2)}`} size="small" />
                  <TextField disabled fullWidth label="SIAF" value={formatoSeleccionadoParaRendir.numero_siaf || ''} size="small" />
                  <TextField disabled fullWidth label="CUT" value={formatoSeleccionadoParaRendir.numero_cut || ''} size="small" />
                </MDBox>
              </MDBox>

              {/* 🆕 SECCIÓN DE RUTAS - Siempre visible */}
              <MDBox sx={{ mt: 2, p: 2, backgroundColor: '#f3e5f5', borderRadius: 1, border: '1px solid #ce93d8' }}>
                <MDTypography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                  🛣️ Rutas del Viaje
                </MDTypography>

                {/* Formulario para agregar ruta */}
                <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 1, mb: 2 }}>
                  <TextField
                    label="Origen"
                    name="origen"
                    value={datosRuta.origen}
                    onChange={handleChangeRuta}
                    required
                    size="small"
                    placeholder="Ej: Lima"
                  />
                  <TextField
                    label="Fecha Salida"
                    name="fecha_salida"
                    type="datetime-local"
                    value={datosRuta.fecha_salida}
                    onChange={handleChangeRuta}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                      const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
                      const match = pastedText.trim().match(regex);
                      if (match) {
                        const [, dia, mes, anio, hora, minuto] = match;
                        const fechaFormatada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora.padStart(2, '0')}:${minuto}`;
                        setDatosRuta(prev => ({ ...prev, fecha_salida: fechaFormatada }));
                      }
                    }}
                    required
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Destino"
                    name="destino"
                    value={datosRuta.destino}
                    onChange={handleChangeRuta}
                    required
                    size="small"
                    placeholder="Ej: Cusco"
                  />
                  <TextField
                    label="Fecha Llegada"
                    name="fecha_llegada"
                    type="datetime-local"
                    value={datosRuta.fecha_llegada}
                    onChange={handleChangeRuta}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                      const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
                      const match = pastedText.trim().match(regex);
                      if (match) {
                        const [, dia, mes, anio, hora, minuto] = match;
                        const fechaFormatada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora.padStart(2, '0')}:${minuto}`;
                        setDatosRuta(prev => ({ ...prev, fecha_llegada: fechaFormatada }));
                      }
                    }}
                    required
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <MDButton
                    variant="gradient"
                    color="success"
                    size="small"
                    onClick={handleAgregarRuta}
                    disabled={guardandoDirecto}
                    title={rutaEditandoId ? 'Guardar cambios de la ruta' : 'Agregar ruta'}
                    sx={{ minWidth: '44px', p: 1 }}
                  >
                    {rutaEditandoId ? '💾' : '➕'}
                  </MDButton>
                  {rutaEditandoId && (
                    <MDButton
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={handleCancelarEdicionRuta}
                      title="Cancelar edición"
                      sx={{ minWidth: '44px', p: 1 }}
                    >
                      ✖
                    </MDButton>
                  )}
                </MDBox>

                {/* Lista de rutas agregadas */}
                {rutasAgregadas.length > 0 && (
                  <MDBox sx={{ overflowX: 'auto', mt: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#ce93d8', color: '#fff' }}>
                          <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Item</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Origen</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Fecha Salida</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Destino</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Fecha Llegada</th>
                          <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rutasAgregadas.map((ruta, index) => {
                          return (
                            <tr key={ruta.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }}>
                              <td style={{ border: '1px solid #eee', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                              <td style={{ border: '1px solid #eee', padding: '8px' }}>{ruta.origen}</td>
                              <td style={{ border: '1px solid #eee', padding: '8px', textAlign: 'center' }}>{formatearFecha24Horas(ruta.fecha_salida)}</td>
                              <td style={{ border: '1px solid #eee', padding: '8px' }}>{ruta.destino}</td>
                              <td style={{ border: '1px solid #eee', padding: '8px', textAlign: 'center' }}>{formatearFecha24Horas(ruta.fecha_llegada)}</td>
                              <td style={{ border: '1px solid #eee', padding: '8px', textAlign: 'center' }}>
                                <MDButton
                                  size="small"
                                  color="info"
                                  variant="text"
                                  onClick={() => handleEditarRuta(ruta)}
                                  disabled={guardandoDirecto}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                  title="Editar ruta"
                                >
                                  <EditIcon sx={{ fontSize: '1.1rem' }} />
                                </MDButton>
                                <MDButton
                                  size="small"
                                  color="error"
                                  variant="text"
                                  onClick={() => handleEliminarRuta(ruta.id)}
                                  disabled={guardandoDirecto}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                  title="Eliminar ruta"
                                >
                                  <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                                </MDButton>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </MDBox>
                )}
              </MDBox>

              {/* Seleccionar Clasificador - SELECT */}
              <MDBox>
                <MDTypography variant="body2" fontWeight="bold">📌 1. Seleccionar Clasificador del Formato</MDTypography>
                <Autocomplete
                  options={detallesFormatoParaRendir}
                  getOptionLabel={(option) => `${option.clasificador_nombre} - S/. ${parseFloat(option.monto_total).toFixed(2)} (Partida: ${option.partida || 'N/A'})`}
                  value={clasificadorSeleccionadoRendicion}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleSeleccionarClasificador(newValue);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Selecciona un clasificador" required size="small" />}
                  noOptionsText="Sin clasificadores disponibles"
                  sx={{ mt: 1 }}
                />
              </MDBox>

              {/* PASO 2: Desglose - Solo si partida es 23.2.1.2.2 */}
              {clasificadorSeleccionadoRendicion && normalizarPartida(clasificadorSeleccionadoRendicion.partida) === '232122' && (
                <>
                  <MDBox sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                    <MDTypography variant="body2" fontWeight="bold">💵 2. Desglose de {clasificadorSeleccionadoRendicion.partida}</MDTypography>
                    {/* 🆕 Mostrar montos agregados por tipo de viático */}
                    <MDBox sx={{ mt: 2, p: 1.5, backgroundColor: '#fff', borderRadius: 0.5, border: '1px solid #e0e0e0' }}>
                      <MDTypography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>📊 Comprobantes Agregados por Tipo</MDTypography>
                      <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                        <MDBox>
                          <MDTypography variant="caption" color="textSecondary">🍽️ Alimentación</MDTypography>
                          <MDTypography variant="body2" fontWeight="bold">
                            S/. {obtenerTodosLosComprobantes()
                              .filter(c => c.tipo_viatico === 'ALIMENTACIÓN')
                              .reduce((sum, c) => sum + c.monto, 0)
                              .toFixed(2)}
                          </MDTypography>
                        </MDBox>
                        <MDBox>
                          <MDTypography variant="caption" color="textSecondary">🏨 Hospedaje</MDTypography>
                          <MDTypography variant="body2" fontWeight="bold">
                            S/. {obtenerTodosLosComprobantes()
                              .filter(c => c.tipo_viatico === 'HOSPEDAJE')
                              .reduce((sum, c) => sum + c.monto, 0)
                              .toFixed(2)}
                          </MDTypography>
                        </MDBox>
                        <MDBox>
                          <MDTypography variant="caption" color="textSecondary">🚕 Movilidad Local</MDTypography>
                          <MDTypography variant="body2" fontWeight="bold">
                            S/. {obtenerTodosLosComprobantes()
                              .filter(c => c.tipo_viatico === 'MOVILIDAD_LOCAL')
                              .reduce((sum, c) => sum + c.monto, 0)
                              .toFixed(2)}
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                    </MDBox>

                    <MDBox sx={{ mt: 1, p: 1, backgroundColor: '#fff', borderRadius: 0.5 }}>
                      {/* 🆕 Calcular montos de DJ */}
                      {(() => {
                        const totalDJ = obtenerTodosLosComprobantes()
                          .filter(c => c.tipo_rendicion === 'declaracion_jurada')
                          .reduce((sum, c) => sum + c.monto, 0);
                        const montoMaxDJ = parseFloat(montoDeclaracionJurada);
                        const disponibleDJ = montoMaxDJ - totalDJ;
                        const superaLimite = totalDJ > montoMaxDJ;
                        
                        return (
                          <>
                            <MDBox sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1 }}>
                              <MDTypography variant="body2" fontWeight="bold">💵 Disponible para DJ (30%):</MDTypography>
                              <MDTypography variant="body2" fontWeight="bold" color={superaLimite ? 'error' : 'info'}>
                                S/. {disponibleDJ.toFixed(2)}
                              </MDTypography>
                            </MDBox>
                            <MDBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <MDTypography variant="body2">Utilizado en DJ:</MDTypography>
                              <MDTypography variant="body2" fontWeight="bold" color={superaLimite ? 'error' : 'success'}>
                                S/. {totalDJ.toFixed(2)}
                              </MDTypography>
                            </MDBox>
                            {superaLimite && (
                              <MDTypography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                                🚫 ¡DJ EXCEDIDO! S/. {(totalDJ - montoMaxDJ).toFixed(2)} de sobrepago
                              </MDTypography>
                            )}
                          </>
                        );
                      })()}
                    </MDBox>
                  </MDBox>
                </>
              )}

              {/* Resumen de Monto Disponible - Para cualquier partida */}
              {clasificadorSeleccionadoRendicion && (
                <MDBox sx={{ mt: 2, p: 1.5, backgroundColor: (limiteDisponible - (totalGastado + calcularTotalComprobantesPartidaActual())) < 0 ? '#ffebee' : '#fff3e0', borderRadius: 1, border: (limiteDisponible - (totalGastado + calcularTotalComprobantesPartidaActual())) < 0 ? '2px solid #f44336' : '1px solid #ff9800' }}>
                  <MDBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <MDTypography variant="body2">TOTAL {clasificadorSeleccionadoRendicion.partida} utilizada:</MDTypography>
                    <MDTypography variant="body2" fontWeight="bold">S/. {(totalGastado + calcularTotalComprobantesPartidaActual()).toFixed(2)}</MDTypography>
                  </MDBox>
                  <MDBox sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <MDTypography variant="body2">Disponible:</MDTypography>
                    <MDTypography variant="body2" fontWeight="bold" color={(limiteDisponible - (totalGastado + calcularTotalComprobantesPartidaActual())) < 0 ? 'error' : 'success'}>
                      S/. {(limiteDisponible - (totalGastado + calcularTotalComprobantesPartidaActual())).toFixed(2)}
                    </MDTypography>
                  </MDBox>
                  {(limiteDisponible - (totalGastado + calcularTotalComprobantesPartidaActual())) < 0 && (
                    <MDTypography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                      🚫 ¡LÍMITE EXCEDIDO! No puedes agregar más comprobantes.
                    </MDTypography>
                  )}
                </MDBox>
              )}

              {/* PASO 3: Registrar Comprobante - Siempre aparece */}
              {clasificadorSeleccionadoRendicion && (
                <MDBox>
                  <MDTypography variant="body2" fontWeight="bold">📝 3. Registrar Comprobante</MDTypography>
                  
                  <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                    <Autocomplete
                      options={tiposComprobanteDisponibles}
                      getOptionLabel={(option) => option.nombre || ''}
                      value={tiposComprobanteDisponibles.find((t) => t.id === parseInt(datosRendicion.tipo_comprobante_id)) || null}
                      onChange={(event, newValue) => {
                        handleChangeRendicion({ target: { name: 'tipo_comprobante_id', value: newValue?.id?.toString() || '' } });
                      }}
                      renderInput={(params) => <TextField {...params} label="Tipo Comprobante" required size="small" />}
                    />
                    {normalizarPartida(clasificadorSeleccionadoRendicion.partida) === '232122' && (
                      <Autocomplete
                        options={['ALIMENTACIÓN', 'HOSPEDAJE', 'MOVILIDAD_LOCAL']}
                        value={datosRendicion.tipo_viatico || null}
                        onChange={(event, newValue) => {
                          handleChangeRendicion({ target: { name: 'tipo_viatico', value: newValue || '' } });
                        }}
                        renderInput={(params) => <TextField {...params} label="Tipo Viático" required size="small" />}
                      />
                    )}
                    {/* 🆕 Ocultar Proveedor si es DECLARACIÓN JURADA */}
                    {tipoRendicion !== 'declaracion_jurada' && (
                      <MDBox sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Autocomplete
                          fullWidth
                          options={proveedoresDisponibles}
                          getOptionLabel={(option) => `${option.nombre}${option.ruc ? ` (${option.ruc})` : ''}`}
                          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                          filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options;
                            const lowerInput = inputValue.toLowerCase();
                            return options.filter(option => 
                              option.nombre.toLowerCase().includes(lowerInput) ||
                              (option.ruc && option.ruc.includes(inputValue))
                            );
                          }}
                          value={proveedoresDisponibles.find((p) => String(p.id) === String(datosRendicion.proveedor_id)) || null}
                          onChange={(event, newValue) => {
                            handleChangeRendicion({ target: { name: 'proveedor_id', value: newValue?.id?.toString() || '' } });
                          }}
                          renderInput={(params) => <TextField {...params} label="Proveedor" required size="small" />}
                        />
                        <MDButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={handleAbrirCrearProveedor}
                          sx={{ mt: 0.5, minWidth: '44px', p: 0 }}
                          title="Crear nuevo proveedor"
                        >
                          <AddIcon sx={{ fontSize: '1.2rem' }} />
                        </MDButton>
                      </MDBox>
                    )}
                    <TextField
                      label="Número Comprobante"
                      name="numero_comprobante"
                      value={datosRendicion.numero_comprobante}
                      onChange={handleChangeRendicion}
                      required
                      size="small"
                      placeholder="001-00001234"
                    />
                    <TextField
                      label={tipoRendicion === 'viaticos' ? 'Monto (Control)' : 'Monto (Max 30%)'}
                      name="monto"
                      type="number"
                      value={datosRendicion.monto}
                      onChange={handleChangeRendicion}
                      required
                      size="small"
                      inputProps={{ 
                        step: '0.01', 
                        min: '0',
                        max: tipoRendicion === 'declaracion_jurada' ? montoDeclaracionJurada : undefined
                      }}
                      helperText={datosRendicion.monto ? `Ingresarás: S/. ${parseFloat(datosRendicion.monto).toFixed(2)}` : 'Campo requerido'}
                      error={tipoRendicion === 'declaracion_jurada' && parseFloat(datosRendicion.monto || 0) > parseFloat(montoDeclaracionJurada)}
                    />
                    <TextField
                      label="Fecha Comprobante"
                      name="fecha_comprobante"
                      type="date"
                      value={datosRendicion.fecha_comprobante}
                      onChange={handleChangeRendicion}
                      required
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </MDBox>

                  {/* Botón Agregar */}
                  <MDBox sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    {(() => {
                      // 🆕 Lógica de deshabilitación más clara
                      const faltaCamposBasicos = !datosRendicion.tipo_comprobante_id || !datosRendicion.numero_comprobante || !datosRendicion.monto;
                      const montoInvalido = parseFloat(datosRendicion.monto || 0) <= 0;
                      const faltaProveedor = tipoRendicion !== 'declaracion_jurada' && !datosRendicion.proveedor_id;
                      const superaViaticoDisponible = tipoRendicion === 'viaticos' && totalGastado > limiteDisponible;
                      const superaDJDisponible = tipoRendicion === 'declaracion_jurada' && (obtenerTodosLosComprobantes().filter(c => c.tipo_rendicion === 'declaracion_jurada').reduce((sum, c) => sum + c.monto, 0) + parseFloat(datosRendicion.monto || 0)) > parseFloat(montoDeclaracionJurada);
                      
                      const deshabilitado = faltaCamposBasicos || montoInvalido || faltaProveedor || superaViaticoDisponible || superaDJDisponible;
                      
                      return (
                        <MDButton
                          variant="gradient"
                          color="info"
                          onClick={handleGuardarRendicion}
                          disabled={deshabilitado}
                        >
                          ➕ Agregar Comprobante
                        </MDButton>
                      );
                    })()}
                  </MDBox>

                </MDBox>
              )}

              {/* Lista de Comprobantes Agregados - TODOS de TODAS las partidas */}
              {obtenerTodosLosComprobantes().length > 0 && (
                    <MDBox sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      {(() => {
                        // 🆕 Cache del array para evitar múltiples llamadas
                        const todosLosComprobantes = obtenerTodosLosComprobantes();
                        const totalComprobantes = todosLosComprobantes.length;

                        return (
                          <>
                            <MDBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <MDTypography variant="body2" fontWeight="bold">
                                📋 Comprobantes Agregados ({totalComprobantes})
                              </MDTypography>
                              <MDButton
                                variant="outlined"
                                color="info"
                                size="small"
                                onClick={handleOrdenarPorFecha}
                                disabled={guardandoDirecto || totalComprobantes < 2}
                              >
                                📅 Ordenar por fecha
                              </MDButton>
                            </MDBox>
                            
                            <MDBox sx={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#ddd' }}>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Item</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Partida</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Tipo Viático</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Tipo Comprobante</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Proveedor</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'left' }}>Comprobante</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Fecha Comprobante</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>Monto</th>
                                    <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {todosLosComprobantes.map((comprobante, index) => (
                                    <tr key={comprobante.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                                      <td style={{ border: '1px solid #eee', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px' }}>{comprobante.partida || 'N/A'}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px' }}>{comprobante.tipo_viatico || '-'}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px' }}>{comprobante.tipo_comprobante_nombre}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px' }}>{comprobante.proveedor_nombre}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px' }}>{comprobante.numero_comprobante}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px', textAlign: 'center' }}>
                                        {comprobante.fecha_comprobante ? (() => {
                                          const fecha = comprobante.fecha_comprobante;
                                          if (typeof fecha === 'string' && fecha.includes('-')) {
                                            // Formato YYYY-MM-DD o YYYY-MM-DDTHH:mm
                                            const partes = fecha.split('T')[0].split('-');
                                            return `${partes[2]}/${partes[1]}/${partes[0]}`;
                                          }
                                          return new Date(fecha).toLocaleDateString('es-PE');
                                        })() : '-'}
                                      </td>
                                      <td style={{ border: '1px solid #eee', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>S/. {comprobante.monto.toFixed(2)}</td>
                                      <td style={{ border: '1px solid #eee', padding: '6px', textAlign: 'center' }}>
                                        <MDBox sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                          {/* Botón Editar */}
                                          <MDButton
                                            size="small"
                                            color="info"
                                            variant="text"
                                            onClick={() => handleAbrirEditarComprobante(comprobante)}
                                            sx={{ minWidth: 'auto', p: 0.5 }}
                                            title="Editar comprobante"
                                          >
                                            <EditIcon sx={{ fontSize: '1.1rem', color: '#1976d2' }} />
                                          </MDButton>

                                          {/* Botón Arriba */}
                                          {index > 0 && (
                                            <MDButton
                                              size="small"
                                              color="info"
                                              variant="text"
                                              onClick={() => handleMoverComprobante(comprobante.id, 'arriba')}
                                              sx={{ minWidth: 'auto', p: 0.5 }}
                                              title="Mover arriba"
                                            >
                                              <ExpandLessIcon sx={{ fontSize: '1.1rem', color: '#1976d2' }} />
                                            </MDButton>
                                          )}

                                          {/* Botón Abajo */}
                                          {index < totalComprobantes - 1 && (
                                            <MDButton
                                              size="small"
                                              color="info"
                                              variant="text"
                                              onClick={() => handleMoverComprobante(comprobante.id, 'abajo')}
                                              sx={{ minWidth: 'auto', p: 0.5 }}
                                              title="Mover abajo"
                                            >
                                              <ExpandMoreIcon sx={{ fontSize: '1.1rem', color: '#1976d2' }} />
                                            </MDButton>
                                          )}

                                          {/* Botón Eliminar */}
                                          <MDButton
                                            size="small"
                                            color="error"
                                            variant="text"
                                            onClick={() => handleEliminarComprobante(comprobante.id)}
                                            sx={{ minWidth: 'auto', p: 0.5 }}
                                            title="Eliminar comprobante"
                                          >
                                            <DeleteIcon sx={{ fontSize: '1.2rem', color: '#f44336' }} />
                                          </MDButton>
                                        </MDBox>
                                      </td>
                                    </tr>
                                  ))}
                                  <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
                                    <td colSpan="7" style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>TOTAL:</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>S/. {calcularTotalTodosComprobantes().toFixed(2)}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}></td>
                                  </tr>
                                </tbody>
                              </table>
                            </MDBox>

                            {/* Botón Enviar Rendición */}
                            <MDBox sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <MDButton
                                variant="gradient"
                                color="success"
                                onClick={() => handleEnviarRendicion(formatoSeleccionadoParaRendir)}
                              >
                                ✅ Enviar Rendición
                              </MDButton>
                              <MDButton
                                variant="text"
                                color="dark"
                                onClick={handleCerrarModalRendicion}
                              >
                                Cancelar
                              </MDButton>
                            </MDBox>
                          </>
                        );
                      })()}
                    </MDBox>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCerrarModalRendicion} variant="text" color="dark">
            Cerrar
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* 🆕 Dialog para Crear Proveedor */}
      <Dialog open={openCrearProveedor} onClose={handleCerrarCrearProveedor} maxWidth="sm" fullWidth>
        <DialogTitle>➕ Crear Nuevo Proveedor</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <MDBox>
            <MDTypography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
              Buscar por RUC o DNI (opcional):
            </MDTypography>
            <MDBox sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="RUC o DNI"
                name="ruc"
                value={formDataProveedor.ruc}
                onChange={(e) => {
                  // 🆕 Solo permitir números y máximo 11 dígitos
                  const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormDataProveedor(prev => ({
                    ...prev,
                    ruc: valor
                  }));
                }}
                inputProps={{
                  maxLength: 11,
                  pattern: '[0-9]*',
                  inputMode: 'numeric'
                }}
                size="small"
                placeholder="20123456789"
              />
              <MDButton
                variant="outlined"
                color="info"
                onClick={handleBuscarRUCProveedor}
                disabled={searchingRucProveedor}
                sx={{ minWidth: '120px' }}
              >
                {searchingRucProveedor ? <CircularProgress size={20} /> : '🔍 Buscar'}
              </MDButton>
            </MDBox>
          </MDBox>

          <TextField
            fullWidth
            label="Nombre del Proveedor"
            name="nombre"
            value={formDataProveedor.nombre}
            onChange={handleChangeProveedor}
            required
            size="small"
            placeholder="Empresa XYZ S.A.C."
          />

          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            value={formDataProveedor.direccion}
            onChange={handleChangeProveedor}
            size="small"
            placeholder="Av. Principal 123"
          />

          <TextField
            fullWidth
            label="Teléfono"
            name="telefono"
            value={formDataProveedor.telefono}
            onChange={handleChangeProveedor}
            size="small"
            placeholder="+51 1 2345678"
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formDataProveedor.email}
            onChange={handleChangeProveedor}
            size="small"
            placeholder="contacto@empresa.com"
            type="email"
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCerrarCrearProveedor} variant="text" color="dark">
            Cancelar
          </MDButton>
          <MDButton onClick={handleGuardarProveedor} variant="gradient" color="success">
            💾 Guardar Proveedor
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* 🆕 Dialog para Editar Comprobante */}
      <Dialog open={openEditarComprobante} onClose={() => setOpenEditarComprobante(false)} maxWidth="sm" fullWidth>
        <DialogTitle>✏️ Editar Comprobante</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comprobanteEditando && (
            <>
              {/* Número de Comprobante */}
              <TextField
                fullWidth
                label="Número de Comprobante *"
                name="numero_comprobante"
                value={datosEdicion.numero_comprobante}
                onChange={(e) => setDatosEdicion(prev => ({
                  ...prev,
                  numero_comprobante: e.target.value
                }))}
                size="small"
                placeholder="001-00001234"
              />

              {/* Fecha de Comprobante */}
              <TextField
                fullWidth
                label="Fecha de Comprobante *"
                type="date"
                value={datosEdicion.fecha_comprobante}
                onChange={(e) => setDatosEdicion(prev => ({
                  ...prev,
                  fecha_comprobante: e.target.value
                }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              {/* Monto */}
              <TextField
                fullWidth
                label="Monto *"
                name="monto"
                type="number"
                inputProps={{ step: '0.01', min: '0.01' }}
                value={datosEdicion.monto}
                onChange={(e) => setDatosEdicion(prev => ({
                  ...prev,
                  monto: e.target.value
                }))}
                size="small"
              />

              {/* Tipo de Comprobante */}
              <Autocomplete
                options={tiposComprobanteDisponibles}
                getOptionLabel={(option) => option.nombre || ''}
                value={tiposComprobanteDisponibles.find(t => t.id === datosEdicion.tipo_comprobante_id) || null}
                onChange={(e, newValue) => {
                  setDatosEdicion(prev => ({
                    ...prev,
                    tipo_comprobante_id: newValue?.id || '',
                    tipo_comprobante_nombre: newValue?.nombre || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Tipo de Comprobante *" size="small" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />

              {/* Proveedor (Selector) */}
              <Autocomplete
                options={proveedoresDisponibles}
                getOptionLabel={(option) => option.nombre || ''}
                value={proveedoresDisponibles.find(p => p.id === datosEdicion.proveedor_id) || null}
                onChange={(e, newValue) => {
                  setDatosEdicion(prev => ({
                    ...prev,
                    proveedor_id: newValue?.id || '',
                    proveedor_nombre: newValue?.nombre || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Proveedor" size="small" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />

              {/* Tipo Viático - Solo si es rendición de viáticos */}
              {(
                <Autocomplete
                  options={[
                    { id: 'ALIMENTACIÓN', label: 'Alimentación' },
                    { id: 'HOSPEDAJE', label: 'Hospedaje' },
                    { id: 'MOVILIDAD_LOCAL', label: 'Movilidad Local' },
                  ]}
                  getOptionLabel={(option) => option.label || ''}
                  value={[
                    { id: 'ALIMENTACIÓN', label: 'Alimentación' },
                    { id: 'HOSPEDAJE', label: 'Hospedaje' },
                    { id: 'MOVILIDAD_LOCAL', label: 'Movilidad Local' },
                  ].find(t => t.id === datosEdicion.tipo_viatico) || null}
                  onChange={(e, newValue) => {
                    setDatosEdicion(prev => ({
                      ...prev,
                      tipo_viatico: newValue?.id || '',
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Tipo Viático" size="small" />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton
            onClick={() => setOpenEditarComprobante(false)}
            variant="text"
            color="dark"
            disabled={loadingGuardarEdicion}
          >
            Cancelar
          </MDButton>
          <MDButton
            onClick={handleGuardarEdicion}
            variant="gradient"
            color="success"
            disabled={loadingGuardarEdicion}
          >
            {loadingGuardarEdicion ? <CircularProgress size={20} /> : '💾 Guardar'}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default EmisionFormatos;
