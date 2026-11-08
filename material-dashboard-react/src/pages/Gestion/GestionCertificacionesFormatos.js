import React, { useState, useEffect, useMemo } from 'react';
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
  Autocomplete,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import 'styles/tablas-responsive.css';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import Swal from 'sweetalert2';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from 'context/AuthContext';
import MDBadge from 'components/MDBadge';
import Drawer from '@mui/material/Drawer';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { calcularVencimientoRendicion, diasHabilesRespectoHoy } from 'utils/vencimientoRendicion';

// Monto con formato peruano (sin prefijo de moneda)
const montoPeruFormato = (valor) =>
  Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Fecha dd/mm/aaaa tomada del texto (evita el desfase de zona horaria)
const fechaDMYFormato = (valor) => {
  if (!valor) return '-';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : '-';
};

// Destinos: los dos primeros y el resto como "+N"
const resumirDestinosFormato = (texto = '') => {
  const partes = String(texto)
    .split(/,\s*|\s+Y\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return { visibles: partes.slice(0, 2), extra: Math.max(partes.length - 2, 0), partes };
};

// Color del estado real del formato
const colorEstadoFormato = (estado) => {
  const colores = { EMITIDO: 'info', RINDIENDO: 'warning', RENDIDO: 'success', ENVIADO: 'secondary', PAGADO: 'secondary' };
  return colores[estado] || 'light';
};

// Sección y dato del Drawer de detalle
const SeccionVerFormato = ({ numero, titulo, children }) => (
  <MDBox mb={2.5}>
    <MDTypography variant="caption" fontWeight="bold" color="info" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {numero} · {titulo}
    </MDTypography>
    <MDBox mt={0.5} p={2} sx={{ border: '1px solid #e8eaed', borderRadius: '8px', backgroundColor: '#fafbfc' }}>
      {children}
    </MDBox>
  </MDBox>
);

const DatoVerFormato = ({ etiqueta, children }) => (
  <MDBox mb={1}>
    <MDTypography variant="caption" fontWeight="bold" color="secondary" display="block">
      {etiqueta}
    </MDTypography>
    <MDBox sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{children}</MDBox>
  </MDBox>
);

const GestionCertificacionesFormatos = () => {
  const { user } = useAuth();
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFormato, setSelectedFormato] = useState(null);
  const [certificaciones, setCertificaciones] = useState([]);
  const [metas, setMetas] = useState([]);
  const [formData, setFormData] = useState({
    certificacion_id: null,
    meta_id: null,
    numero_cut: '', // 🆕 NÚMERO CUT (OPCIONAL)
    numero_siaf: '', // 🆕 NÚMERO SIAF (OPCIONAL)
  });
  const [loadingCertificaciones, setLoadingCertificaciones] = useState(false);
  const [formatoVer, setFormatoVer] = useState(null);
  const [feriadosSet, setFeriadosSet] = useState(new Set());
  const [ambitos, setAmbitos] = useState([]);
  // El ámbito del usuario viene como ambito_id en la sesión; su nombre se resuelve desde la lista de ámbitos
  const nombreAmbitoUsuario = user?.ambito_nombre || ambitos.find((a) => a.id === user?.ambito_id)?.nombre_corto || null;

  // 🆕 Función para calcular días hábiles (lunes a viernes)
  const calcularDiasHabilesRestantes = (fechaRetorno) => {
    if (!fechaRetorno) return null;

    try {
      const hoy = new Date();
      const inicio = new Date(fechaRetorno);

      // Normalizar fechas a medianoche
      hoy.setHours(0, 0, 0, 0);
      inicio.setHours(0, 0, 0, 0);

      let diasHabiles = 0;
      let fechaActual = new Date(inicio);
      let fechaVencimiento = new Date(inicio);

      // Calcular fecha de vencimiento (10 días hábiles después)
      while (diasHabiles < 10) {
        const diaSemana = fechaVencimiento.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasHabiles++;
        }
        if (diasHabiles < 10) {
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
        }
      }

      // Contar días hábiles desde fecha_retorno hasta hoy
      diasHabiles = 0;
      fechaActual = new Date(inicio);

      while (fechaActual <= hoy) {
        const diaSemana = fechaActual.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasHabiles++;
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      const diasRestantes = Math.max(0, 10 - diasHabiles);
      const diasAtraso = Math.max(0, diasHabiles - 10);

      return {
        diasTranscurridos: diasHabiles,
        diasRestantes: diasRestantes,
        fuéraDePlazo: diasHabiles > 10,
        diasAtraso: diasAtraso,
        fechaVencimiento: fechaVencimiento,
        fechaVencimientoFormato: fechaVencimiento.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
      };
    } catch (error) {
      console.error('Error calculando días hábiles:', error);
      return null;
    }
  };

  // 📋 Cargar formatos emitidos al iniciar o cuando cambia user
  useEffect(() => {
    console.log('🔵 [EFFECT] USER CAMBIÓ:', { id: user?.id, rol: user?.rol, ambito_nombre: user?.ambito_nombre });
    // SIEMPRE cargar, sin esperar a user
    console.log('✅ [EFFECT] Llamando cargarFormatos() (sin esperar user)');
    cargarFormatos();
    cargarCertificaciones();
    cargarMetas();
    api.request('/feriados').then((r) => setFeriadosSet(new Set((r.feriados || []).map((f) => f.fecha)))).catch(() => {});
    api.obtenerAmbitos().then((r) => setAmbitos(Array.isArray(r) ? r : [])).catch(() => {});
  }, [user?.id, user?.rol]);

  // 🔍 MONITOREAR cambios en formatos
  useEffect(() => {
    console.log('📊 FORMATOS ACTUALIZADOS:', formatos.length, 'registros', formatos);
  }, [formatos]);

  // 🔄 Cargar formatos emitidos
  const cargarFormatos = async () => {
    try {
      setLoading(true);
      const response = await api.obtenerFormatosEmisiones({});
      
      console.log('📦 [1] Response recibida:', response);
      
      // 🔍 Extraer array de formatos correctamente
      let datos = [];
      if (Array.isArray(response)) {
        console.log('📦 [2a] Response es array directo');
        datos = response;
      } else if (response?.formatos && Array.isArray(response.formatos)) {
        console.log('📦 [2b] Usando response.formatos - cantidad:', response.formatos.length);
        datos = response.formatos;
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('📦 [2c] Usando response.data - cantidad:', response.data.length);
        datos = response.data;
      } else {
        console.log('� [2d] NO SE PUDO EXTRAER - Response estructura:', Object.keys(response || {}));
      }

      console.log('� [3] Datos extraídos, cantidad:', datos.length);

      console.log('📦 [5] FINAL - Llamando setFormatos con:', datos.length, 'registros');
      setFormatos(datos);
      setError(null);
    } catch (err) {
      console.error('❌ Error en cargarFormatos:', err);
      setError(err.message);
      Swal.fire('Error', `No se pudieron cargar los formatos: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 📚 Cargar certificaciones disponibles
  const cargarCertificaciones = async () => {
    try {
      const response = await api.obtenerCertificacionesCredito();
      setCertificaciones(response || []);
    } catch (err) {
      console.error('Error cargando certificaciones:', err);
    }
  };

  // 📚 Cargar certificaciones por meta
  const cargarCertificacionesPorMeta = async (metaId) => {
    try {
      if (!metaId) {
        setCertificaciones([]);
        return;
      }
      console.log(`📦 Cargando certificaciones para meta ${metaId}`);
      const response = await api.request(`/certificaciones-credito/por-meta/${metaId}`);
      console.log(`✅ Certificaciones cargadas para meta ${metaId}:`, response);
      setCertificaciones(response || []);
    } catch (err) {
      console.error(`Error cargando certificaciones para meta ${metaId}:`, err);
      setCertificaciones([]);
    }
  };

  // 📚 Cargar metas disponibles
  const cargarMetas = async () => {
    try {
      let response;
      
      // 🆕 Si es administrativo, cargar solo metas de su ámbito
      if (user?.rol === 'administrativo' && user?.ambito_id) {
        console.log(`🔐 ADMINISTRATIVO: Cargando metas del ámbito ${user.ambito_id}`);
        response = await api.request(`/metas/por-ambito/${user.ambito_id}`);
      } else {
        // Admin o jefe: cargar todas las metas
        console.log(`📚 ${user?.rol || 'UNKNOWN'}: Cargando TODAS las metas`);
        response = await api.obtenerMetas();
      }
      
      setMetas(response || []);
      console.log(`✅ Metas cargadas: ${(response || []).length} registros`);
    } catch (err) {
      console.error('Error cargando metas:', err);
      setMetas([]);
    }
  };

  // ✏️ Abrir diálogo para editar certificación y meta
  const abrirDialogoEditar = (formato) => {
    setSelectedFormato(formato);
    setFormData({
      certificacion_id: formato.certificacion_id || null,
      meta_id: formato.meta_id || null,
      numero_cut: formato.numero_cut || '', // 🆕 NÚMERO CUT
      numero_siaf: formato.numero_siaf || '', // 🆕 NÚMERO SIAF
    });
    // Cargar certificaciones de la meta actual
    if (formato.meta_id) {
      cargarCertificacionesPorMeta(formato.meta_id);
    }
    setOpenDialog(true);
  };

  // ❌ Cerrar diálogo
  const cerrarDialogo = () => {
    setOpenDialog(false);
    setSelectedFormato(null);
    setFormData({
      certificacion_id: null,
      meta_id: null,
      numero_cut: '', // 🆕 NÚMERO CUT
      numero_siaf: '', // 🆕 NÚMERO SIAF
    });
  };

  // ✅ Validar cambio de certificación
  const validarCambiosCertificacion = async () => {
    try {
      // Si nada cambió, no validar
      const cambioMeta = selectedFormato.meta_id !== formData.meta_id;
      const cambioCertificacion = selectedFormato.certificacion_id !== formData.certificacion_id;
      
      if (!cambioMeta && !cambioCertificacion) {
        return true;
      }

      // Si se está removiendo la certificación, permitir
      if (!formData.certificacion_id) {
        console.log('✅ Removiendo certificación - permitido');
        return true;
      }

      console.log('🔍 Validando cambios...');
      console.log(`   Meta: ${selectedFormato.meta_id} → ${formData.meta_id} (${cambioMeta ? 'CAMBIÓ' : 'igual'})`);
      console.log(`   Certificación: ${selectedFormato.certificacion_id} → ${formData.certificacion_id} (${cambioCertificacion ? 'CAMBIÓ' : 'igual'})`);

      // 🆕 SI AMBOS CAMBIARON: Validar que la nueva certificación pertenece a la nueva meta
      if (cambioMeta && cambioCertificacion) {
        console.log('🔄🔄 AMBOS cambiaron - Validando que certificación pertenece a meta...');
        
        const nuevaCertificacion = certificaciones.find(c => c.id === formData.certificacion_id);
        if (!nuevaCertificacion) {
          Swal.fire('❌ Error', 'Certificación no encontrada', 'error');
          return false;
        }
        
        if (nuevaCertificacion.meta_id !== formData.meta_id) {
          Swal.fire({
            icon: 'error',
            title: '❌ Certificación Inválida',
            html: `<div style="text-align: left;">
              <p><strong>La certificación seleccionada NO pertenece a la meta seleccionada.</strong></p>
              <p>Nueva Meta: <strong>${formData.meta_id}</strong></p>
              <p>Certificación Meta: <strong>${nuevaCertificacion.meta_id}</strong></p>
              <hr>
              <p style="color: #d32f2f;">Por favor, selecciona una certificación de la meta indicada.</p>
            </div>`,
            confirmButtonColor: '#d32f2f'
          });
          return false;
        }
        console.log(`✅ Validación OK: Certificación ${formData.certificacion_id} pertenece a meta ${formData.meta_id}`);
      }

      // Obtener detalles del formato actual (con certificación anterior)
      const formatoCompleto = await api.obtenerFormatoEmisionPorId(selectedFormato.id);
      console.log('� Formato completo:', formatoCompleto);

      // Obtener detalles de la nueva certificación
      const nuevaCertificacion = certificaciones.find(c => c.id === formData.certificacion_id);
      if (!nuevaCertificacion) {
        Swal.fire('❌ Error', 'Certificación no encontrada', 'error');
        return false;
      }

      console.log('📋 Nueva certificación:', nuevaCertificacion);

      // Obtener detalles de la nueva certificación
      let detallesNuevaCert = [];
      try {
        const respDetalles = await api.request(`/certificaciones-credito/${formData.certificacion_id}`);
        detallesNuevaCert = respDetalles?.detalles || [];
        console.log('📋 Detalles de nueva certificación:', detallesNuevaCert);
      } catch (err) {
        console.error('Error obteniendo detalles de certificación:', err);
        Swal.fire('❌ Error', 'No se pudieron obtener los detalles de la certificación', 'error');
        return false;
      }

      // Obtener detalles del formato (formato_emisiones_detalles)
      const detallesFormato = formatoCompleto?.detalles || [];
      console.log('📋 Detalles del formato:', detallesFormato);

      if (detallesFormato.length === 0) {
        console.log('✅ Formato sin detalles - cambio permitido');
        return true;
      }

      // Validar cada detalle del formato
      let mensajeError = '';
      for (const detalleFormato of detallesFormato) {
        const clasificadorEnCert = detallesNuevaCert.find(
          d => d?.id?.toString() === detalleFormato.clasificador_id?.toString() ||
               d?.clasificador_id?.toString() === detalleFormato.clasificador_id?.toString()
        );

        if (!clasificadorEnCert) {
          mensajeError = `❌ El clasificador "${detalleFormato.clasificador_nombre || detalleFormato.clasificador_id}" no existe en la nueva certificación.`;
          console.error(mensajeError);
          break;
        }

        // Validar saldo disponible
        const montoDisponible = parseFloat(clasificadorEnCert.monto || 0) - parseFloat(clasificadorEnCert.monto_utilizado || 0);
        const montoFormato = parseFloat(detalleFormato.monto || 0);

        if (montoFormato > montoDisponible) {
          mensajeError = `❌ Saldo insuficiente en "${detalleFormato.clasificador_nombre}"\n\nDisponible: S/. ${montoDisponible.toFixed(2)}\nRequerido: S/. ${montoFormato.toFixed(2)}\n\nDeficit: S/. ${(montoFormato - montoDisponible).toFixed(2)}`;
          console.error(mensajeError);
          break;
        }
      }

      if (mensajeError) {
        Swal.fire({
          icon: 'error',
          title: '⚠️ No se puede cambiar de certificación',
          html: mensajeError.replace(/\n/g, '<br>'),
          confirmButtonColor: '#d32f2f'
        });
        return false;
      }

      console.log('✅ Validación exitosa - cambio permitido');
      return true;
    } catch (err) {
      console.error('❌ Error en validación:', err);
      Swal.fire('❌ Error', `Error en validación: ${err.message}`, 'error');
      return false;
    }
  };

  // �💾 Guardar cambios
  const guardarCambios = async () => {
    try {
      if (!selectedFormato) return;

      setLoadingCertificaciones(true);

      // Validar cambios de certificación
      if (formData.certificacion_id !== selectedFormato.certificacion_id) {
        const validacionOK = await validarCambiosCertificacion();
        if (!validacionOK) {
          setLoadingCertificaciones(false);
          return;
        }
      }

      // 🆕 Obtener el formato completo con detalles para enviar al backend
      const formatoCompleto = await api.obtenerFormatoEmisionPorId(selectedFormato.id);
      console.log('📋 Formato completo obtenido:', formatoCompleto);

      // 🆕 Preparar detalles con la nueva certificación si cambió
      let detalles = [];
      if (formatoCompleto.detalles && Array.isArray(formatoCompleto.detalles)) {
        detalles = formatoCompleto.detalles.map(d => ({
          clasificador_id: d.clasificador_id,
          monto: d.monto,
          detalles_certificacion_credito_id: formData.certificacion_id !== selectedFormato.certificacion_id 
            ? null  // Si cambió certificación, limpiar la referencia (backend remapea)
            : d.detalles_certificacion_credito_id
        }));
      }

      // 🆕 CALCULAR NUEVO ESTADO SEGÚN CAMPOS
      let nuevoEstado = null;
      
      // Verificar cambios en numero_cut y numero_siaf
      const cambioNumeroCut = selectedFormato.numero_cut !== formData.numero_cut;
      const cambioNumeroSiaf = selectedFormato.numero_siaf !== (formData.numero_siaf || '');
      
      console.log('🔍 Cambios de campos:');
      console.log(`   numero_cut: "${selectedFormato.numero_cut}" → "${formData.numero_cut}" (${cambioNumeroCut ? 'CAMBIÓ' : 'igual'})`);
      console.log(`   numero_siaf: "${selectedFormato.numero_siaf}" → "${formData.numero_siaf}" (${cambioNumeroSiaf ? 'CAMBIÓ' : 'igual'})`);
      
      // Lógica de estado
      if (formData.numero_siaf && formData.numero_siaf.trim()) {
        // Si hay numero_siaf → PAGADO
        nuevoEstado = 'PAGADO';
        console.log('💰 Tiene numero_siaf → PAGADO');
      } else if (formData.numero_cut && formData.numero_cut.trim()) {
        // Si NO hay numero_siaf pero hay numero_cut → ENVIADO
        nuevoEstado = 'ENVIADO';
        console.log('📧 Tiene numero_cut (sin siaf) → ENVIADO');
      } else {
        // Sin numero_cut ni numero_siaf → EMITIDO
        nuevoEstado = 'EMITIDO';
        console.log('📄 Sin numero_cut ni numero_siaf → EMITIDO');
      }

      // 🔍 Determinar si hay cambios
      const cambios = [];
      let huboChangioCertificacion = false;
      
      if (selectedFormato.certificacion_id !== formData.certificacion_id) {
        cambios.push('certificación');
        huboChangioCertificacion = true;
      }
      if (selectedFormato.meta_id !== formData.meta_id) {
        cambios.push('meta');
      }
      if (selectedFormato.numero_cut !== formData.numero_cut) {
        cambios.push('numero_cut');
      }
      if (selectedFormato.numero_siaf !== formData.numero_siaf) {
        cambios.push('numero_siaf');
      }

      if (cambios.length === 0) {
        Swal.fire('ℹ️ Info', 'No hay cambios para guardar', 'info');
        setLoadingCertificaciones(false);
        return;
      }

      // 🔍 SOLO enviar detalles si cambió la certificación
      // Si SOLO actualiza numero_cut/numero_siaf → NO enviar detalles
      const datosActualizacion = {
        certificacion_id: formData.certificacion_id,
        meta_id: formData.meta_id,
        numero_cut: formData.numero_cut || null,
        numero_siaf: formData.numero_siaf || null,
        estado_emision: nuevoEstado,
      };

      // 🆕 SOLO incluir detalles si cambió la certificación
      if (huboChangioCertificacion) {
        datosActualizacion.detalles = detalles;
        console.log('📋 Incluyendo detalles porque cambió certificación');
      } else {
        console.log('⏭️ NO incluyendo detalles (solo cambió numero_cut/numero_siaf)');
      }

      console.log(`📝 Editando ${cambios.join(' y ')}`);
      console.log('📤 Datos a enviar:', datosActualizacion);

      // 📤 Enviar actualización
      await api.actualizarFormatoEmision(selectedFormato.id, datosActualizacion);

      Swal.fire('✅ Éxito', 'Formato actualizado correctamente', 'success');
      cerrarDialogo();
      cargarFormatos();
    } catch (err) {
      console.error('❌ Error:', err);
      Swal.fire('Error', `No se pudo actualizar: ${err.message}`, 'error');
    } finally {
      setLoadingCertificaciones(false);
    }
  };

  // 📊 Columnas de la tabla
  // Situación del plazo de rendición, con la regla compartida (10 días hábiles, sin sábados, domingos ni feriados).
  // Es independiente del estado del formato.
  const clasificarPlazo = (f) => {
    if (f.estado_emision === 'RENDIDO') return { tipo: 'RENDIDO' };
    if (!['EMITIDO', 'ENVIADO', 'PAGADO', 'RINDIENDO'].includes(f.estado_emision) || !f.fecha_retorno) {
      return { tipo: 'NO_APLICA' };
    }
    const vence = calcularVencimientoRendicion(f.fecha_retorno, feriadosSet);
    const restante = diasHabilesRespectoHoy(vence, feriadosSet);
    if (restante < 0) return { tipo: 'ATRASO', dias: Math.abs(restante), vence };
    return { tipo: 'PLAZO', dias: restante, vence };
  };

  const etiquetaPlazo = (p) => {
    switch (p.tipo) {
      case 'RENDIDO':
        return { texto: 'Rendición completada', color: 'success' };
      case 'ATRASO':
        return { texto: `Atraso: ${p.dias} días`, color: 'error' };
      case 'PLAZO':
        if (p.dias === 0) return { texto: 'Vence hoy', color: 'warning' };
        if (p.dias <= 3) return { texto: `${p.dias} días restantes`, color: 'warning' };
        return { texto: `${p.dias} días restantes`, color: 'success' };
      default:
        return null;
    }
  };

  // Indicadores sobre la lista completa de formatos (no solo la página visible)
  const resumenFormatos = (() => {
    let emitidos = 0;
    let enProceso = 0;
    let rendidos = 0;
    let atrasados = 0;
    formatos.forEach((f) => {
      if (f.estado_emision === 'EMITIDO') emitidos += 1;
      if (f.estado_emision === 'RINDIENDO') enProceso += 1;
      if (f.estado_emision === 'RENDIDO') rendidos += 1;
      if (clasificarPlazo(f).tipo === 'ATRASO') atrasados += 1;
    });
    return { total: formatos.length, emitidos, enProceso, rendidos, atrasados };
  })();

  // Contenido del Drawer de detalle, organizado por secciones
  const renderVerFormato = (f) => {
    const p = clasificarPlazo(f);
    const et = etiquetaPlazo(p);
    const destinos = resumirDestinosFormato(f.lugar || f.comision_lugar).partes;
    return (
      <>
        <SeccionVerFormato numero="A" titulo="Información del formato">
          <DatoVerFormato etiqueta="Número de documento">{f.numero_documento || '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Comisionado">{f.usuario_nombre || '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Ámbito">{f.ambito_nombre || '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Destinos">
            {destinos.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {destinos.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : (
              '-'
            )}
          </DatoVerFormato>
          <DatoVerFormato etiqueta="Fecha de salida">{fechaDMYFormato(f.fecha_salida)}</DatoVerFormato>
          <DatoVerFormato etiqueta="Fecha de retorno">{fechaDMYFormato(f.fecha_retorno)}</DatoVerFormato>
          <DatoVerFormato etiqueta="Modalidad de viaje">{f.modalidad_viaje || '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Tipo de formato">{f.tipo_emision || '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Monto">{montoPeruFormato(f.monto_total)}</DatoVerFormato>
        </SeccionVerFormato>
        <SeccionVerFormato numero="B" titulo="Certificación presupuestal">
          <DatoVerFormato etiqueta="Número de CCP">{f.certificacion_nota || 'Sin certificación'}</DatoVerFormato>
          <MDTypography variant="caption" color="text" display="block">
            El monto certificado completo se consulta en Certificaciones de Crédito.
          </MDTypography>
        </SeccionVerFormato>
        <SeccionVerFormato numero="C" titulo="Control de rendición">
          <DatoVerFormato etiqueta="Estado del formato">{f.estado_emision || '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Situación del plazo">{et ? et.texto : '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Fecha de vencimiento">{p.vence ? p.vence.toLocaleDateString('es-ES') : '-'}</DatoVerFormato>
          <DatoVerFormato etiqueta="Fecha de rendición">{f.fecha_rendicion ? fechaDMYFormato(f.fecha_rendicion) : '-'}</DatoVerFormato>
        </SeccionVerFormato>
        <SeccionVerFormato numero="D" titulo="Documentos y operaciones">
          <MDTypography variant="caption" color="text" display="block">
            Las operaciones disponibles se realizan con los botones de la fila.
          </MDTypography>
        </SeccionVerFormato>
      </>
    );
  };

  const columns = useMemo(() => [
    {
      Header: 'Item',
      accessor: 'item',
      width: '4%',
      Cell: ({ row }) => row.index + 1,
    },
    {
      Header: 'Documento / Comisionado',
      accessor: 'numero_documento',
      width: '17%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => (
        <MDBox lineHeight={1.35}>
          <MDTypography variant="button" fontWeight="bold" color="info" display="block" sx={{ whiteSpace: 'nowrap' }}>
            {original.numero_documento || '-'}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block" sx={{ whiteSpace: 'normal' }}>
            {original.usuario_nombre || '-'}
          </MDTypography>
        </MDBox>
      ),
    },
    {
      Header: 'Ámbito / Destino',
      accessor: 'ambito_nombre',
      width: '15%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        const texto = original.lugar || original.comision_lugar || '';
        const { visibles, extra } = resumirDestinosFormato(texto);
        return (
          <MDBox lineHeight={1.35}>
            <MDTypography variant="button" fontWeight="medium" display="block" sx={{ whiteSpace: 'normal' }}>
              {original.ambito_nombre || '-'}
            </MDTypography>
            <MDTypography
              variant="caption"
              color="text"
              display="block"
              title={texto}
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}
            >
              {visibles.join(', ')}
              {extra > 0 ? ` (+${extra} más)` : ''}
            </MDTypography>
          </MDBox>
        );
      },
    },
    {
      Header: 'Período',
      accessor: 'fecha_salida',
      width: '13%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => (
        <MDTypography variant="button" display="block" sx={{ whiteSpace: 'nowrap' }}>
          {fechaDMYFormato(original.fecha_salida)} al {fechaDMYFormato(original.fecha_retorno)}
        </MDTypography>
      ),
    },
    {
      Header: 'Monto',
      accessor: 'monto_total',
      width: '9%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ value }) => (
        <MDTypography variant="button" fontWeight="bold" color="dark" sx={{ whiteSpace: 'nowrap' }}>
          {montoPeruFormato(value)}
        </MDTypography>
      ),
    },
    {
      Header: 'Rendición',
      width: '16%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => {
        const p = clasificarPlazo(original);
        const et = etiquetaPlazo(p);
        if (!et) return '-';
        return (
          <MDBox lineHeight={1.35}>
            <MDBadge badgeContent={et.texto} color={et.color} variant="gradient" size="sm" />
            {p.vence && (
              <MDTypography variant="caption" color="text" display="block" sx={{ whiteSpace: 'nowrap' }}>
                Vence el {p.vence.toLocaleDateString('es-ES')}
              </MDTypography>
            )}
          </MDBox>
        );
      },
    },
    {
      Header: 'CCP',
      accessor: 'certificacion_nota',
      width: '11%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ value }) =>
        value ? (
          <MDTypography variant="button" fontWeight="bold" color="info" sx={{ whiteSpace: 'nowrap' }}>
            {value}
          </MDTypography>
        ) : (
          <MDTypography variant="caption" color="warning" sx={{ whiteSpace: 'nowrap' }}>
            Sin certificación
          </MDTypography>
        ),
    },
    {
      Header: 'Tipo / Estado',
      accessor: 'estado_emision',
      width: '9%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row: { original } }) => (
        <MDBox lineHeight={1.35}>
          {original.tipo_emision && (
            <MDBadge
              badgeContent={original.tipo_emision}
              color={original.tipo_emision === 'ANTICIPO' ? 'info' : 'secondary'}
              variant="gradient"
              size="sm"
            />
          )}
          <MDBox mt={0.5}>
            <MDBadge badgeContent={original.estado_emision || '-'} color={colorEstadoFormato(original.estado_emision)} variant="gradient" size="sm" />
          </MDBox>
        </MDBox>
      ),
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      width: '6%',
      Cell: ({ row }) => (
        <MDBox sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Ver detalle">
            <span>
              <IconButton size="small" color="info" onClick={() => setFormatoVer(row.original)} sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Modificar">
            <span>
              <IconButton size="small" color="info" onClick={() => abrirDialogoEditar(row.original)} sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' }, '&.Mui-disabled': { backgroundColor: '#f5f5f5' } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </MDBox>
      )
    },
  ], [feriadosSet]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card>
          <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info">
            <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
              Gestión de Certificaciones en Formatos
            </MDTypography>
            <MDTypography variant="button" color="white" opacity={0.8}>
              {user?.rol === 'administrativo'
                ? (nombreAmbitoUsuario ? `Formatos del ámbito: ${nombreAmbitoUsuario}` : 'Formatos del ámbito')
                : 'Visualizando todos los formatos'}
            </MDTypography>
          </MDBox>

        <MDBox px={3} pt={2}>
          <MDBox display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }} gap={2}>
            {[
              { etiqueta: 'Total de formatos', valor: resumenFormatos.total },
              { etiqueta: 'Emitidos', valor: resumenFormatos.emitidos },
              { etiqueta: 'En proceso de rendición', valor: resumenFormatos.enProceso },
              { etiqueta: 'Rendidos', valor: resumenFormatos.rendidos },
              { etiqueta: 'Atrasados', valor: resumenFormatos.atrasados },
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

          {loading ? (
            <MDBox p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </MDBox>
          ) : (
            <MDBox className="tabla-responsive" sx={{ '& td': { verticalAlign: 'middle' } }}>
              {console.log('🎯 Renderizando tabla con:', { columnCount: columns.length, rowCount: formatos.length, formatos })}
              <DataTable
                table={{
                  columns,
                  rows: formatos
                }}
                canSearch={true}
                isSorted={true}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                showTotalEntries={true}
                noEndBorder
                vistaMovil
              />
            </MDBox>
          )}
        </Card>
      </MDBox>

      {/* Drawer de detalle del formato */}
      <Drawer
        anchor="right"
        open={Boolean(formatoVer)}
        onClose={() => setFormatoVer(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <MDBox px={3} py={2} display="flex" justifyContent="space-between" alignItems="center" sx={{ backgroundColor: '#1A73E8' }}>
          <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
            Detalle del formato
          </MDTypography>
          <IconButton size="small" onClick={() => setFormatoVer(null)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </MDBox>
        <MDBox p={3}>{formatoVer && renderVerFormato(formatoVer)}</MDBox>
      </Drawer>

      {/* 📝 Diálogo para editar certificación y meta */}
      <Dialog open={openDialog} onClose={cerrarDialogo} maxWidth="sm" fullWidth>
        <DialogTitle>
          ✏️ Editar Formato - {selectedFormato?.numero_documento}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedFormato && (
            <>
              {/* Información del formato */}
              <MDBox mb={2} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <MDTypography variant="body2" fontWeight="bold">
                  👤 Usuario: {selectedFormato.usuario_nombre}
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  📍 Ámbito: {selectedFormato.ambito_nombre || 'N/A'}
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  📅 Fechas: {new Date(selectedFormato.fecha_salida).toLocaleDateString()} - {new Date(selectedFormato.fecha_retorno).toLocaleDateString()}
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  📌 Estado: {selectedFormato.estado_emision}
                </MDTypography>
              </MDBox>

              {/* Seleccionar Meta - PRIMERO */}
              <Autocomplete
                options={metas}
                getOptionLabel={(option) => `${option.numero_meta || 'S/N'} - ${option.nombre || 'Sin nombre'}`}
                value={metas.find(m => m.id === formData.meta_id) || null}
                onChange={(e, value) => {
                  console.log('📌 Meta seleccionada:', value?.id);
                  setFormData({ ...formData, meta_id: value?.id || null, certificacion_id: null });
                  // Cargar certificaciones de la meta seleccionada
                  if (value?.id) {
                    cargarCertificacionesPorMeta(value.id);
                  } else {
                    setCertificaciones([]);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="📌 Meta (Reasignar a otro ámbito)"
                    fullWidth
                    margin="normal"
                  />
                )}
              />

              {/* Seleccionar Certificación - DESPUÉS */}
              <Autocomplete
                options={certificaciones}
                getOptionLabel={(option) => `Nota: ${option.nota || 'S/N'} | Mes: ${option.mes || 'N/A'}`}
                value={certificaciones.find(c => c.id === formData.certificacion_id) || null}
                onChange={(e, value) => setFormData({ ...formData, certificacion_id: value?.id || null })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="🎯 CCP (Nota-Mes)"
                    fullWidth
                    margin="normal"
                  />
                )}
              />

              {/* 🆕 NÚMERO CUT (OPCIONAL) */}
              <TextField
                fullWidth
                margin="normal"
                label="📋 Número CUT (Opcional)"
                placeholder="Ej: CUT-2024-001"
                value={formData.numero_cut || ''}
                onChange={(e) => setFormData({ ...formData, numero_cut: e.target.value })}
                variant="outlined"
              />

              {/* 🆕 NÚMERO SIAF (OPCIONAL) */}
              <TextField
                fullWidth
                margin="normal"
                label="💰 Número SIAF (Opcional - Activa PAGADO)"
                placeholder="Ej: SIAF-2024-001"
                value={formData.numero_siaf || ''}
                onChange={(e) => setFormData({ ...formData, numero_siaf: e.target.value })}
                variant="outlined"
                helperText="Al agregar SIAF, el estado cambia a PAGADO"
              />

              {/* Indicador de cambio */}
              {(formData.certificacion_id !== selectedFormato.certificacion_id || formData.meta_id !== selectedFormato.meta_id) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  ✏️ Cambios detectados - Revisa antes de guardar
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarDialogo} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={guardarCambios}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={loadingCertificaciones}
          >
            {loadingCertificaciones ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
};

export default GestionCertificacionesFormatos;
