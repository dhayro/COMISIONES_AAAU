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
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from 'context/AuthContext';

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

      // 🔐 Filtrar por ámbito si es ADMINISTRATIVO (NO admin)
      if (user?.rol && user.rol !== 'admin') {
        console.log(`� [4a] Usuario es ${user.rol}, FILTRANDO por "${user?.ambito_nombre}"`);
        const antesDelFiltro = datos.length;
        datos = datos.filter(f => f.ambito_nombre === user?.ambito_nombre);
        console.log(`📦 [4b] Después del filtro: ${antesDelFiltro} → ${datos.length}`);
      } else {
        console.log('� [4c] MOSTRANDO TODOS (admin o sin rol)');
      }

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
  const columns = useMemo(() => [
    { Header: 'Número', accessor: 'numero_documento' },
    { Header: 'Usuario', accessor: 'usuario_nombre' },
    { 
      Header: 'Ámbito', 
      accessor: 'ambito_nombre'
    },
    { Header: 'Lugar', accessor: 'lugar' },
    { 
      Header: 'Fechas', 
      Cell: ({ row }) => {
        try {
          const salida = new Date(row.original.fecha_salida).toLocaleDateString();
          const retorno = new Date(row.original.fecha_retorno).toLocaleDateString();
          return `${salida} - ${retorno}`;
        } catch (e) {
          return 'N/A';
        }
      }
    },
    {
      Header: 'Monto',
      Cell: ({ row }) => {
        const monto = parseFloat(row.original.monto_total) || 0;
        return `S/. ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    {
      Header: 'Tipo Emisión',
      accessor: 'tipo_emision',
      Cell: ({ value }) => {
        let badgeColor = '#2196f3';
        let badgeBG = '#e3f2fd';

        if (value === 'REEMBOLSO') {
          badgeColor = '#4caf50';
          badgeBG = '#e8f5e9';
        } else if (value === 'ANTICIPADO') {
          badgeColor = '#ff9800';
          badgeBG = '#fff3e0';
        } else if (value === 'COMPLEMENTARIO') {
          badgeColor = '#2196f3';
          badgeBG = '#e3f2fd';
        }

        return (
          <div style={{
            backgroundColor: badgeBG,
            color: badgeColor,
            padding: '6px 12px',
            borderRadius: '16px',
            fontWeight: 'bold',
            fontSize: '12px',
            textAlign: 'center',
            display: 'inline-block'
          }}>
            {value || 'N/A'}
          </div>
        );
      }
    },
    {
      Header: 'Plazo para Rendir',
      Cell: ({ row }) => {
        // 🆕 Si ya está RENDIDO, no mostrar
        if (row.original.estado_emision === 'RENDIDO') {
          return (
            <div style={{
              backgroundColor: '#e8f5e9',
              color: '#4caf50',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '11px',
              textAlign: 'center',
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}>
              ✅ RENDIDO
            </div>
          );
        }

        const resultado = calcularDiasHabilesRestantes(row.original.fecha_retorno);
        if (!resultado) return 'N/A';

        let badgeColor = '#4caf50';
        let badgeBG = '#e8f5e9';
        let icono = '✅';
        let textoSecundario = '';

        if (resultado.fuéraDePlazo) {
          badgeColor = '#c62828';
          badgeBG = '#ffebee';
          icono = '🔴';
          textoSecundario = `ATRASO: ${resultado.diasAtraso} días | Vence: ${resultado.fechaVencimientoFormato}`;
        } else if (resultado.diasRestantes <= 2) {
          badgeColor = '#d32f2f';
          badgeBG = '#ffcdd2';
          icono = '⚠️';
          textoSecundario = `Vence: ${resultado.fechaVencimientoFormato}`;
        } else if (resultado.diasRestantes <= 5) {
          badgeColor = '#ff9800';
          badgeBG = '#fff3e0';
          icono = '⚡';
          textoSecundario = `Vence: ${resultado.fechaVencimientoFormato}`;
        } else {
          textoSecundario = `Vence: ${resultado.fechaVencimientoFormato}`;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              backgroundColor: badgeBG,
              color: badgeColor,
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '12px',
              textAlign: 'center',
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}>
              {resultado.fuéraDePlazo
                ? `${icono} ATRASO: ${resultado.diasAtraso} días`
                : `${icono} ${resultado.diasRestantes} días`}
            </div>
            <div style={{
              fontSize: '10px',
              color: badgeColor,
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {textoSecundario}
            </div>
          </div>
        );
      }
    },
    {
      Header: 'CCP (Certificación)', 
      accessor: 'certificacion_nota',
      Cell: ({ value }) => value ? (
        <Chip 
          label={`CCP: ${value}`} 
          color="primary" 
          variant="outlined"
          size="small"
        />
      ) : (
        <Chip 
          label="Sin certificación" 
          color="warning" 
          variant="filled"
          size="small"
        />
      )
    },
    { Header: 'Estado', accessor: 'estado_emision', Cell: ({ value }) => {
      let badgeColor = 'default';
      let badgeBG = '#f0f0f0';
      
      if (value === 'PAGADO') {
        badgeColor = '#4caf50'; // Verde
        badgeBG = '#e8f5e9';
      } else if (value === 'ENVIADO') {
        badgeColor = '#2196f3'; // Azul
        badgeBG = '#e3f2fd';
      } else if (value === 'EMITIDO') {
        badgeColor = '#ff9800'; // Naranja
        badgeBG = '#fff3e0';
      } else if (value === 'BORRADOR') {
        badgeColor = '#9c27b0'; // Púrpura
        badgeBG = '#f3e5f5';
      } else if (value === 'ANULADO') {
        badgeColor = '#f44336'; // Rojo
        badgeBG = '#ffebee';
      }
      
      return (
        <div style={{
          backgroundColor: badgeBG,
          color: badgeColor,
          padding: '6px 12px',
          borderRadius: '16px',
          fontWeight: 'bold',
          fontSize: '12px',
          textAlign: 'center',
          display: 'inline-block'
        }}>
          {value}
        </div>
      );
    }},
    {
      Header: 'Acciones',
      Cell: ({ row }) => (
        <MDBox sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={{ color: '#fff' }}
            startIcon={<EditIcon />}
            onClick={() => abrirDialogoEditar(row.original)}
          >
            Modificar
          </Button>
        </MDBox>
      )
    }
  ], []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={2}>
          <MDTypography variant="h4" fontWeight="bold" mb={2}>
            📋 Gestión de Certificaciones en Formatos
          </MDTypography>
          <MDTypography variant="subtitle2" color="textSecondary">
            {user?.rol === 'admin' 
              ? '🔑 Visualizando todos los formatos' 
              : `📍 Formatos del ámbito: ${user?.ambito_nombre}`}
          </MDTypography>
        </MDBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          {loading ? (
            <MDBox p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </MDBox>
          ) : (
            <MDBox p={3}>
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
              />
            </MDBox>
          )}
        </Card>
      </MDBox>

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
