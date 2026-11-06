import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Icon,
  Chip,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import { useAuth } from 'context/AuthContext';

function ValidarComprobante() {
  const { usuario: usuarioLogueado } = useAuth();
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openValidar, setOpenValidar] = useState(false);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState(null);
  const [comprobantesExistentes, setComprobantesExistentes] = useState([]);
  const [cargandoComprobantes, setCargandoComprobantes] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [openValidacionSunat, setOpenValidacionSunat] = useState(false);
  const [montoCorregido, setMontoCorregido] = useState('');
  const [sustentoMonto, setSustentoMonto] = useState('');
  const [guardandoMonto, setGuardandoMonto] = useState(false);
  const [comprobanteValidando, setComprobanteValidando] = useState(null);
  const [resultadoSunat, setResultadoSunat] = useState(null);
  const [loadingSunat, setLoadingSunat] = useState(false);
  const tablaRefValidar = useRef(null);  // 🆕 Referencia para scroll automático
  const printRef = useRef();

  // 🆕 Estados para validación en batch
  const [seleccionados, setSeleccionados] = useState([]);  // IDs de comprobantes seleccionados
  const [validandoLote, setValidandoLote] = useState(false);  // Loading al validar múltiples
  const [resultadoLote, setResultadoLote] = useState(null);  // Resultados de validación en batch

  useEffect(() => {
    cargarFormatos();
  }, []);

  const cargarFormatos = async () => {
    try {
      setLoading(true);
      setError('');
      const formatosData = await api.obtenerFormatosEmisiones({ estado_rendicion: true });

      let datos = [];
      if (Array.isArray(formatosData)) {
        datos = formatosData;
      } else if (formatosData?.formatos && Array.isArray(formatosData.formatos)) {
        datos = formatosData.formatos;
      } else if (formatosData?.data && Array.isArray(formatosData.data)) {
        datos = formatosData.data;
      }

      const formatosFiltrados = datos.filter(f => f.estado_emision === 'RENDIDO');
      setFormatos(formatosFiltrados);
    } catch (err) {
      console.error('Error cargando formatos:', err);
      setError('Error al cargar certificaciones con ANEXO 3');
    } finally {
      setLoading(false);
    }
  };

  const cargarComprobantesExistentes = async (formatoId) => {
    try {
      setCargandoComprobantes(true);
      const rendicionesData = await api.request(`/rendiciones/obtener-por-formato/${formatoId}`, {
        method: 'GET'
      });

      let comprobantes = [];
      if (rendicionesData?.rendiciones && Array.isArray(rendicionesData.rendiciones)) {
        comprobantes = rendicionesData.rendiciones;
      }

      setComprobantesExistentes(comprobantes);
    } catch (err) {
      console.error('Error cargando comprobantes existentes:', err);
      setComprobantesExistentes([]);
    } finally {
      setCargandoComprobantes(false);
    }
  };

  const handleAbrirValidar = (formato) => {
    setFormatoSeleccionado(formato);
    setComprobantesExistentes([]);
    setExpandedRow(null);
    setOpenValidar(true);
    cargarComprobantesExistentes(formato.id);
  };

  const handleCerrarValidar = () => {
    setOpenValidar(false);
    setFormatoSeleccionado(null);
    setComprobantesExistentes([]);
    setExpandedRow(null);
    setSeleccionados([]);
    setResultadoLote(null);
  };

  const toggleExpanded = (index) => {
    setExpandedRow(expandedRow === index ? null : index);

    // 🆕 Scroll automático hacia la tabla cuando se expande
    if (tablaRefValidar.current) {
      setTimeout(() => {
        tablaRefValidar.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  // 🆕 Mapeo de tipos de comprobante a códigos SUNAT (flexible)
  const mapearTipoComprobanteASunat = (nombreTipo) => {
    if (!nombreTipo) return '03'; // Default a factura

    const texto = nombreTipo.toUpperCase().trim();

    // Búsqueda flexible usando palabras clave
    if (texto.includes('BOLETA')) return '06';
    if (texto.includes('FACTURA') && !texto.includes('NOTA')) return '03';
    if (texto.includes('RECIBO') && texto.includes('HONORARIOS')) return '01';
    if (texto.includes('NOTA DE CREDITO') && texto.includes('RHE')) return '02';
    if (texto.includes('NOTA DE CREDITO') && texto.includes('BOLETA')) return '11';
    if (texto.includes('NOTA DE DEBITO') && texto.includes('BOLETA')) return '12';
    if (texto.includes('NOTA DE CREDITO') && texto.includes('FACTURA')) return '04';
    if (texto.includes('NOTA DE DEBITO') && texto.includes('FACTURA')) return '05';
    if (texto.includes('GUIA') && texto.includes('REMITENTE') && !texto.includes('COMPLEMENTARIA')) return '07';
    if (texto.includes('GUIA') && texto.includes('REMITENTE') && texto.includes('COMPLEMENTARIA')) return '08';
    if (texto.includes('GUIA') && texto.includes('TRANSPORTISTA') && !texto.includes('COMPLEMENTARIA')) return '09';
    if (texto.includes('GUIA') && texto.includes('TRANSPORTISTA') && texto.includes('COMPLEMENTARIA')) return '10';
    if (texto.includes('ATRIBUCION')) return 'DA25';
    if (texto.includes('SEAE')) return 'DS56';
    if (texto.includes('TICKET') && texto.includes('POS')) return 'TCF';
    if (texto.includes('TICKET') && texto.includes('ME')) return 'TME12';
    if (texto.includes('NOTA CREDITO') && texto.includes('ME')) return 'TME07';
    if (texto.includes('ENVIO') && texto.includes('FACTURA')) return 'C01';
    if (texto.includes('ENVIO') && texto.includes('BOLETA')) return 'C03';
    if (texto.includes('ENVIO') && texto.includes('CREDITO')) return 'C07';
    if (texto.includes('ENVIO') && texto.includes('DEBITO')) return 'C08';
    if (texto.includes('ENVIO') && texto.includes('TICKECT')) return 'C12';
    if (texto.includes('PERCEPCIÓN')) return '40';
    if (texto.includes('RETENCIÓN')) return '20';
    if (texto.includes('ADJUDICACIÓN')) return '23';
    if (texto.includes('TARJETAS') && texto.includes('TERCERO')) return '30';
    if (texto.includes('OPERADOR')) return '34';
    if (texto.includes('TARJETAS') && texto.includes('MISMAS')) return '42';

    return '03'; // Defecto a factura
  };

  // 🆕 Manejar selección de un comprobante
  const handleToggleSeleccionar = (id) => {
    setSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // 🆕 Manejar selección de todos
  const handleToggleSeleccionarTodos = () => {
    const comprobantesFiltraos = comprobantesExistentes.filter(c => !['VALIDADO', 'MANUAL'].includes(c.estado_rendicion) &&
      c.tipo_comprobante_nombre !== 'DECLARACION JURADA' &&
      c.tipo_comprobante_nombre !== 'OTROS DOCUMENTOS'
    );
    const ids = comprobantesFiltraos.map(c => c.id);

    if (seleccionados.length === ids.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(ids);
    }
  };

  // 🆕 Validar todos los seleccionados
  const mensajeConContabilidad = async (response, comprobante) => {
    if (response.estado === 'VÁLIDO' || !comprobante.proveedor_ruc) return response;
    try {
      const r = await api.request(`/decolecta/ruc/${comprobante.proveedor_ruc}`, { method: 'GET' });
      const contabilidad = r && r.data ? r.data.tipo_contabilidad : null;
      if (contabilidad === 'MANUAL') {
        return { ...response, estado: 'MANUAL', contabilidad, mensaje: 'Comprobante manual: el proveedor tiene sistema de contabilidad MANUAL, por lo que SUNAT no lo verifica electrónicamente.' };
      }
      return { ...response, contabilidad };
    } catch (err) {
      return response;
    }
  };

  const guardarMontoYValidar = async () => {
    if (!comprobanteValidando) return;
    const monto = parseFloat(montoCorregido);
    if (!(monto > 0)) { alert('Ingresa el monto real de la factura'); return; }
    if (sustentoMonto.trim().length < 10) { alert('Escribe un sustento de al menos 10 caracteres'); return; }
    setGuardandoMonto(true);
    try {
      await api.request(`/rendiciones/${comprobanteValidando.id}/monto-validacion`, { method: 'PUT', body: JSON.stringify({ monto_factura: monto, sustento: sustentoMonto.trim() }) });
      const actualizado = { ...comprobanteValidando, monto_factura: monto, sustento_monto: sustentoMonto.trim() };
      await validarEnSunat(actualizado);
      if (formatoSeleccionado) await cargarComprobantesExistentes(formatoSeleccionado.id);
    } catch (err) {
      alert(err.message || 'No se pudo guardar el monto');
    } finally {
      setGuardandoMonto(false);
    }
  };
  const marcarValidadoEnRendicion = async (comprobante, mensaje, estado = 'VALIDADO') => {
    try {
      await api.request(`/rendiciones/${comprobante.id}/validacion`, { method: 'PUT', body: JSON.stringify({ mensaje, estado }) });
    } catch (err) {
      console.error('No se pudo marcar como validado:', err);
    }
  };

  const validarSeleccionados = async () => {
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un comprobante para validar');
      return;
    }

    try {
      setValidandoLote(true);
      const comprobantesParaValidar = comprobantesExistentes.filter(c => seleccionados.includes(c.id));
      const resultados = [];

      // Validar cada comprobante
      for (const comprobante of comprobantesParaValidar) {
        const [serie, numero] = (comprobante.numero_comprobante || '').split('-');
        const fecha = new Date(comprobante.fecha_comprobante);
        const fecEmision = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
        const codigoSunat = mapearTipoComprobanteASunat(comprobante.tipo_comprobante_nombre || '');

        const datosValidacion = {
          num_ruc: comprobante.proveedor_ruc,
          tipocomprobante: codigoSunat,
          cod_docide: '6',
          num_docide: '20520711865',
          num_serie: serie || '',
          num_comprob: numero || '',
          fec_emision: fecEmision,
          cantidad: parseFloat(comprobante.monto_factura ?? comprobante.monto ?? 0).toFixed(2)
        };

        try {
          const response = await api.request('/sunat/validar-comprobante', {
            method: 'POST',
            body: JSON.stringify(datosValidacion),
          });

          const finalResp = await mensajeConContabilidad(response, comprobante);
          if (finalResp.estado === 'MANUAL') await marcarValidadoEnRendicion(comprobante, finalResp.mensaje, 'MANUAL');
          resultados.push({
            comprobante,
            resultado: finalResp.mensaje,
            esValido: response.estado === 'VÁLIDO' || response.esValido,
            estado: finalResp.estado
          });
          if (response.estado === 'VÁLIDO' || response.esValido) {
            await marcarValidadoEnRendicion(comprobante, response.mensaje);
          }
        } catch (err) {
          resultados.push({
            comprobante,
            resultado: 'Error en la validación',
            esValido: false
          });
        }
      }

      setResultadoLote(resultados);
      setSeleccionados([]);
      if (formatoSeleccionado) await cargarComprobantesExistentes(formatoSeleccionado.id);
    } catch (err) {
      console.error('Error validando lote:', err);
      alert('Error al validar los comprobantes');
    } finally {
      setValidandoLote(false);
    }
  };

  const imprimirValidadosMasivo = () => {
    const validados = comprobantesExistentes.filter((c) => c.estado_rendicion === 'VALIDADO');
    if (validados.length === 0) return;
    imprimirReporteLote(validados.map((c) => ({
      comprobante: c,
      resultado: c.validacion_mensaje || 'Comprobante validado (resultado no registrado)',
      esValido: true,
    })));
  };

  // 🆕 Imprimir reporte de validaciones
  const imprimirReporteLote = (listaOriginal = resultadoLote) => {
    const lista = (listaOriginal || []).filter((item) => item.estado !== 'MANUAL');
    if (lista.length === 0) return;

    let htmlContent = '';

    lista.forEach((item, idx) => {
      htmlContent += `
        <div style="page-break-after: always; padding: 10px;">
          <center>
            <table width="50%" cellpadding="1" cellspacing="1" class="form-table">
              <tbody>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tbody>
                        <tr>
                          <td width="100%" class="t1">Consulta Validez del Comprobante de Pago Electrónico</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table width="50%" cellpadding="2" cellspacing="2" class="form-table">
              <tbody>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tbody>
                        <tr class="beta">
                          <th align="left" colspan="3" height="15px">Resultado de la Consulta</th>
                        </tr>
                        <tr height="15px">
                          <td width="30%" height="15px" class="bgn">
                            ${item.resultado}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </center>
        </div>
      `;
    });

    const printWindow = window.open('', '', 'height=1000,width=900');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Validaciones SUNAT</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            text-align: center;
            background: white;
          }
          .form-table {
            border-collapse: collapse;
            border: 1px solid #4682B4;
            margin: 20px auto;
            width: 50%;
          }
          .form-table td {
            border: 1px solid #4682B4;
            padding: 1px;
          }
          .form-table table {
            width: 100%;
            border-collapse: collapse;
          }
          .form-table table {
            border: 1px solid #4682B4;
          }
          .form-table table td {
            border: 1px solid #4682B4;
            padding: 5px;
          }
          .form-table table th {
            border: 1px solid #4682B4;
            padding: 5px;
          }
          .t1 {
            font-weight: 900;
            font-size: 17px;
            background-color: #39c;
            font-family: verdana, arial, helvetica, sans-serif;
            text-align: center;
            color: black;
            padding: 14px;
          }
          .beta {
            background-color: #B6CBEB;
            border: 1px solid #4682B4;
            font-weight: bold;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          .bgn {
            background-color: #FFFFFF;
            padding: 10px;
            font-size: 11px;
            font-weight: bold;
            text-align: left;
          }
          @media print {
            body { margin: 0; padding: 0; }
            div { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const validarEnSunat = async (comprobante) => {
    try {
      setLoadingSunat(true);
      setComprobanteValidando(comprobante);
      setOpenValidacionSunat(true);

      // Extraer serie y número del número de comprobante (formato: "F006-24926")
      const [serie, numero] = (comprobante.numero_comprobante || '').split('-');

      // Convertir fecha al formato dd/mm/yyyy
      const fecha = new Date(comprobante.fecha_comprobante);
      const fecEmision = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

      // 🆕 Obtener código SUNAT según el tipo de comprobante seleccionado
      const codigoSunat = mapearTipoComprobanteASunat(comprobante.tipo_comprobante_nombre || '');

      const datosValidacion = {
        num_ruc: comprobante.proveedor_ruc,
        tipocomprobante: codigoSunat,
        cod_docide: '6', // RUC
        num_docide: '20520711865', // Fijo
        num_serie: serie || '',
        num_comprob: numero || '',
        fec_emision: fecEmision,
        cantidad: parseFloat(comprobante.monto_factura ?? comprobante.monto ?? 0).toFixed(2)
      };

      console.log('📤 Enviando a SUNAT:', { tipo_nombre: comprobante.tipo_comprobante_nombre, codigo_sunat: codigoSunat });

      const response = await api.request('/sunat/validar-comprobante', {
        method: 'POST',
        body: JSON.stringify(datosValidacion),
      });

      if (response.estado === 'VÁLIDO') {
        await marcarValidadoEnRendicion(comprobante, response.mensaje);
        if (formatoSeleccionado) await cargarComprobantesExistentes(formatoSeleccionado.id);
      }
      const finalResp = await mensajeConContabilidad(response, comprobante);
      if (finalResp.estado === 'MANUAL') {
        await marcarValidadoEnRendicion(comprobante, finalResp.mensaje, 'MANUAL');
        if (formatoSeleccionado) await cargarComprobantesExistentes(formatoSeleccionado.id);
      }
      setResultadoSunat(finalResp);
    } catch (err) {
      console.error('Error validando en SUNAT:', err);
      setResultadoSunat({
        error: err.message || 'Error al validar comprobante',
        mensaje: 'No se pudo conectar con SUNAT'
      });
    } finally {
      setLoadingSunat(false);
    }
  };

  const cerrarValidacionSunat = () => {
    setOpenValidacionSunat(false);
    setComprobanteValidando(null);
    setResultadoSunat(null);
  };

  const imprimirResultado = (datos = null) => {
    const textoResultado = datos ? datos.mensaje : resultadoSunat.mensaje;
    const printWindow = window.open('', '', 'height=800,width=900');
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Consulta de Validez del CPE</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            text-align: center;
            background: white;
          }
          .form-table {
            border-collapse: collapse;
            border: 1px solid #4682B4;
            margin: 20px auto;
            width: 50%;
          }
          .form-table td {
            border: 1px solid #4682B4;
            padding: 1px;
          }
          .form-table table {
            width: 100%;
            border-collapse: collapse;
          }
          .form-table table {
            border: 1px solid #4682B4;
          }
          .form-table table td {
            border: 1px solid #4682B4;
            padding: 5px;
          }
          .form-table table th {
            border: 1px solid #4682B4;
            padding: 5px;
          }
          .t1 {
            font-weight: 900;
            font-size: 17px;
            background-color: #39c;
            font-family: verdana, arial, helvetica, sans-serif;
            text-align: center;
            color: black;
            padding: 14px;
          }
          .beta {
            background-color: #B6CBEB;
            border: 1px solid #4682B4;
            font-weight: bold;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          .bgn {
            background-color: #FFFFFF;
            padding: 10px;
            font-size: 11px;
            font-weight: bold;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <center>
          <table width="50%" cellpadding="1" cellspacing="1" class="form-table">
            <tbody>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tbody>
                      <tr>
                        <td width="100%" class="t1">Consulta Validez del Comprobante de Pago Electrónico</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <table width="50%" cellpadding="2" cellspacing="2" class="form-table">
            <tbody>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tbody>
                      <tr class="beta">
                        <th align="left" colspan="3" height="15px">Resultado de la Consulta</th>
                      </tr>
                      <tr height="15px">
                        <td width="30%" height="15px" class="bgn">
                          ${textoResultado}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </center>
      </body>
      </html>
    `;
    printWindow.document.write(contenido);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const columns = [
    {
      Header: 'Item',
      accessor: 'id',
      Cell: ({ row }) => row.index + 1,
      width: '8%',
    },
    {
      Header: 'Nº Documento',
      accessor: 'numero_documento',
      width: '12%',
    },
    {
      Header: 'Ámbito',
      accessor: 'ambito_nombre',
      width: '15%',
    },
    {
      Header: 'Lugar',
      accessor: 'lugar',
      width: '15%',
    },
    {
      Header: 'Período',
      accessor: 'fecha_salida',
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString('es-PE') : '-',
      width: '12%',
    },
    {
      Header: 'Modalidad',
      accessor: 'modalidad_viaje',
      width: '13%',
    },
    {
      Header: 'Comisionado',
      accessor: 'usuario_nombre',
      width: '15%',
    },
    {
      Header: 'Monto',
      accessor: 'monto_total',
      Cell: ({ value }) => `S/. ${parseFloat(value || 0).toFixed(2)}`,
      width: '12%',
    },
    {
      Header: 'Estado formato',
      accessor: 'estado_emision',
      Cell: ({ value }) => <Chip label={value} size="small" color="success" variant="outlined" />,
      width: '8%',
    },
    {
      Header: 'Validación comprobantes',
      accessor: 'comprobantes_pendientes',
      Cell: ({ row }) => {
        const total = row.original.comprobantes_validables || 0;
        const pendientes = row.original.comprobantes_validables_pendientes || 0;
        if (total === 0) return <Chip label="Sin comprobantes para validar" size="small" variant="outlined" />;
        if (pendientes > 0) return <Chip label={`Pendiente (${pendientes} de ${total})`} size="small" color="warning" />;
        return <Chip label="Validado" size="small" color="success" />;
      },
      width: '12%',
    },
    {
      Header: 'Acciones',
      Cell: ({ row }) => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handleAbrirValidar(row.original)}
          sx={{ color: 'white !important' }}
        >
          Ver
        </Button>
      ),
      width: '8%',
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox py={3}>
        <MDBox mb={3}>
          <MDTypography variant="h4" fontWeight="bold">
            Validación de Comprobantes - ANEXO 3
          </MDTypography>
          <MDTypography variant="body2" color="textSecondary">
            Certificaciones de Crédito con Rendición
          </MDTypography>
        </MDBox>

        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : formatos.length === 0 ? (
            <MDBox p={3}>
              <Alert severity="info">No hay certificaciones con ANEXO 3 rendido disponibles</Alert>
            </MDBox>
          ) : (
            <DataTable
              table={{
                columns,
                rows: [...formatos].sort((a, b) =>
                  String(b.numero_documento || '').localeCompare(String(a.numero_documento || ''), undefined, { numeric: true })
                ),
              }}
              isSorted={true}
              entriesPerPage={false}
              noEndBorder
            />
          )}
        </Card>
      </MDBox>

      {/* Modal */}
      <Dialog open={openValidar} onClose={handleCerrarValidar} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
          📋 Comprobantes del ANEXO 3
        </DialogTitle>

        <DialogContent sx={{ pt: 2, maxHeight: '80vh', overflowY: 'auto' }}>
          {formatoSeleccionado && (
            <>
              {/* Panel de Información */}
              <MDBox mb={3} p={2.5} sx={{
                backgroundColor: '#e8f5e9',
                borderRadius: 1.5,
                borderLeft: '4px solid #4caf50'
              }}>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  👤 Comisionado: {formatoSeleccionado?.usuario_nombre}
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  📍 Lugar: {formatoSeleccionado?.lugar}
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold" mb={1}>
                  🌍 Ámbito: {formatoSeleccionado?.ambito_nombre}
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold" mb={1.5}>
                  💰 Monto Total: <span style={{ color: '#4caf50', fontSize: '1.1em' }}>S/. {parseFloat(formatoSeleccionado?.monto_total || 0).toFixed(2)}</span>
                </MDTypography>

                {/* Línea separadora */}
                <Box sx={{ borderTop: '1px solid #a5d6a7', my: 1.5 }} />

                {/* Datos de Referencia para Validación */}
                <MDTypography variant="caption" sx={{ fontWeight: 700, color: '#2e7d32', display: 'block', mb: 1 }}>
                  📋 DATOS DE REFERENCIA PARA VALIDACIÓN:
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold" mb={0.5}>
                  🆔 Tipo de Documento de Identidad del Receptor:
                </MDTypography>
                <MDTypography variant="body2" sx={{ ml: 2, mb: 1, color: '#555' }}>
                  REG. UNICO DE CONTRIBUYENTES
                </MDTypography>

                <MDTypography variant="body2" fontWeight="bold" mb={0.5}>
                  # Número Documento de Identidad del Receptor:
                </MDTypography>
                <MDTypography variant="body2" sx={{ ml: 2, color: '#555', fontWeight: '600' }}>
                  20520711865
                </MDTypography>
              </MDBox>

              {/* Tabla de Comprobantes */}
              <Box ref={tablaRefValidar}>
                <MDTypography variant="h6" fontWeight="bold" mb={2.5} sx={{
                  color: '#1976d2',
                  borderBottom: '2px solid #1976d2',
                  paddingBottom: 1
                }}>
                  📄 DOCUMENTOS - COMPROBANTES DEL ANEXO 3
                </MDTypography>

                {cargandoComprobantes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : comprobantesExistentes.length === 0 ? (
                  <Alert severity="info">Sin comprobantes registrados</Alert>
                ) : (
                  <>
                    {/* Tabla HTML pura - SIN PAGINACIÓN */}
                    <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem',
                        border: '1px solid #ddd'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', border: '1px solid #ddd', width: '3%' }}>
                              <input
                                type="checkbox"
                                checked={seleccionados.length === comprobantesExistentes.filter(c =>
                                  c.tipo_comprobante_nombre !== 'DECLARACION JURADA' &&
                                  c.tipo_comprobante_nombre !== 'OTROS DOCUMENTOS'
                                ).length && comprobantesExistentes.filter(c =>
                                  c.tipo_comprobante_nombre !== 'DECLARACION JURADA' &&
                                  c.tipo_comprobante_nombre !== 'OTROS DOCUMENTOS'
                                ).length > 0}
                                onChange={handleToggleSeleccionarTodos}
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', border: '1px solid #ddd', width: '4%' }}>Nº</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', border: '1px solid #ddd', width: '14%' }}>RUC Emisor</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', border: '1px solid #ddd', width: '16%' }}>Tipo Comprobante</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', border: '1px solid #ddd', width: '13%' }}>Nº Comprobante</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', border: '1px solid #ddd', width: '11%' }}>Fecha</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', border: '1px solid #ddd', width: '11%' }}>Total</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', border: '1px solid #ddd', width: '11%' }}>Estado</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', border: '1px solid #ddd', width: '17%' }}>Validar / Imprimir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprobantesExistentes.filter(c =>
                            c.tipo_comprobante_nombre !== 'DECLARACION JURADA' &&
                            c.tipo_comprobante_nombre !== 'OTROS DOCUMENTOS'
                          ).map((comprobante, index) => (
                            <tr key={comprobante.id || index} style={{
                              backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                              borderBottom: '1px solid #eee'
                            }}>
                              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #eee' }}>
                                {!['VALIDADO', 'MANUAL'].includes(comprobante.estado_rendicion) && (<input
                                  type="checkbox"
                                  checked={seleccionados.includes(comprobante.id)}
                                  onChange={() => handleToggleSeleccionar(comprobante.id)}
                                  style={{ cursor: 'pointer' }}
                                />)}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#667eea', border: '1px solid #eee' }}>{index + 1}</td>
                              <td style={{ padding: '10px', fontWeight: '600', color: '#2c3e50', border: '1px solid #eee' }}>{comprobante.proveedor_ruc || '-'}</td>
                              <td style={{ padding: '10px', fontSize: '0.9rem', fontWeight: '500', border: '1px solid #eee' }}>{comprobante.tipo_comprobante_nombre || 'N/A'}</td>
                              <td style={{ padding: '10px', fontWeight: '600', color: '#2c3e50', border: '1px solid #eee' }}>{comprobante.numero_comprobante || '-'}</td>
                              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #eee', fontSize: '0.9rem' }}>
                                {comprobante.fecha_comprobante ? new Date(comprobante.fecha_comprobante.split('T')[0]).toLocaleDateString('es-PE') : '-'}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#27ae60', border: '1px solid #eee' }}>
                                S/. {parseFloat(comprobante.monto || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #eee' }}>
                                {comprobante.estado_rendicion === 'VALIDADO' ? (<Chip size="small" label="Validado" color="success" />)
                                  : comprobante.estado_rendicion === 'MANUAL' ? (<Chip size="small" label="Manual" color="info" />)
                                  : (<Chip size="small" label="Pendiente" color="warning" variant="outlined" />)}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #eee' }}>
                                {comprobante.estado_rendicion === 'VALIDADO' ? (<Button size="small" variant="contained" onClick={() => imprimirResultado({ mensaje: comprobante.validacion_mensaje || 'Comprobante validado (resultado no registrado)' })} sx={{ backgroundColor: '#1976d2 !important', color: 'white !important', fontSize: '0.75rem', padding: '4px 8px' }}>🖨️ Imprimir</Button>) : comprobante.estado_rendicion === 'MANUAL' ? null : (<Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => validarEnSunat(comprobante)}
                                  disabled={loadingSunat}
                                  sx={{
                                    backgroundColor: '#d32f2f !important',
                                    color: 'white !important',
                                    fontSize: '0.75rem',
                                    padding: '4px 8px',
                                    '&:hover': { backgroundColor: '#b71c1c !important' },
                                    '&:disabled': { opacity: 0.6 }
                                  }}
                                >
                                  {loadingSunat ? '⏳' : '✓'}
                                </Button>)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Botón Validar Seleccionados */}
                    <MDBox sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        disabled={seleccionados.length === 0 || validandoLote}
                        onClick={validarSeleccionados}
                        sx={{ backgroundColor: '#4caf50 !important', color: 'white !important' }}
                      >
                        {validandoLote ? '⏳ Validando...' : `✓ Validar ${seleccionados.length} Seleccionados`}
                      </Button>
                      <Button
                        variant="contained"
                        disabled={comprobantesExistentes.filter((c) => c.estado_rendicion === 'VALIDADO').length === 0}
                        onClick={imprimirValidadosMasivo}
                        sx={{ backgroundColor: '#1976d2 !important', color: 'white !important' }}
                      >
                        🖨️ Imprimir validados ({comprobantesExistentes.filter((c) => c.estado_rendicion === 'VALIDADO').length})
                      </Button>
                    </MDBox>

                    {/* Reporte de Validaciones */}
                    {resultadoLote && resultadoLote.length > 0 && (
                      <MDBox sx={{ mt: 3, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                        <MDTypography variant="h6" fontWeight="bold" mb={2}>
                          📋 Reporte de Validaciones ({resultadoLote.length})
                        </MDTypography>

                        {resultadoLote.map((item, idx) => (
                          <MDBox key={idx} sx={{ mb: 2, p: 1.5, backgroundColor: '#fff', borderRadius: 1, border: `1px solid ${item.esValido ? '#4caf50' : '#f44336'}` }}>
                            <MDTypography variant="body2" fontWeight="bold">
                              {idx + 1}. {item.comprobante.numero_comprobante} - {item.comprobante.tipo_comprobante_nombre}
                            </MDTypography>
                            <MDTypography variant="caption" sx={{ display: 'block', mt: 0.5, color: item.esValido ? '#4caf50' : '#f44336' }}>
                              {item.resultado}
                            </MDTypography>
                            <MDTypography variant="caption" sx={{ display: 'block', color: '#666' }}>
                              Monto: S/. {parseFloat(item.comprobante.monto).toFixed(2)} | RUC: {item.comprobante.proveedor_ruc}
                            </MDTypography>
                          </MDBox>
                        ))}

                        <MDBox sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={() => imprimirReporteLote()}
                            sx={{ backgroundColor: '#d32f2f !important', color: 'white !important' }}
                          >
                            🖨️ Imprimir Reporte (Página x Comprobante)
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => { setResultadoLote(null); setSeleccionados([]); }}
                            sx={{ color: '#1976d2 !important', borderColor: '#1976d2 !important', backgroundColor: '#fff !important' }}
                          >
                            Limpiar
                          </Button>
                        </MDBox>
                      </MDBox>
                    )}
                  </>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCerrarValidar} variant="contained" color="primary" sx={{ color: 'white !important' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Validación SUNAT */}
      <Dialog open={openValidacionSunat} onClose={cerrarValidacionSunat} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', backgroundColor: '#f5f5f5' }}>
          📋 Validación en SUNAT
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {loadingSunat ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : resultadoSunat ? (
            <Box sx={{ textAlign: 'center' }}>
              {/* Título */}
              <Box
                sx={{
                  backgroundColor: '#2e5c8a',
                  border: '3px solid #2e5c8a',
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                }}
              >
                <MDTypography
                  sx={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    margin: 0,
                  }}
                >
                  Consulta Validez del Comprobante de Pago Electrónico
                </MDTypography>
              </Box>

              {/* Resultado */}
              <Box
                sx={{
                  border: '2px solid #2e5c8a',
                  borderRadius: 1,
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: '#b8cce0',
                    p: 1.5,
                    borderBottom: '2px solid #2e5c8a',
                  }}
                >
                  <MDTypography
                    sx={{
                      fontWeight: 'bold',
                      color: '#000',
                      fontSize: '14px',
                      margin: 0,
                    }}
                  >
                    Resultado de la Consulta
                  </MDTypography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    backgroundColor:
                      resultadoSunat.estado === 'VÁLIDO' || resultadoSunat.esValido ? '#e8f5e9' : '#fff3cd',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MDTypography
                    sx={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: resultadoSunat.estado === 'VÁLIDO' || resultadoSunat.esValido ? '#1b5e20' : '#664d03',
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    {resultadoSunat.mensaje || resultadoSunat.error}
                  </MDTypography>
                </Box>
              </Box>

              {comprobanteValidando && resultadoSunat.estado !== 'VÁLIDO' && resultadoSunat.estado !== 'MANUAL' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ffb300', borderRadius: 2, backgroundColor: '#fff8e1' }}>
                  <MDTypography variant="body2" fontWeight="bold" mb={1}>Corregir monto para validar</MDTypography>
                  <MDTypography variant="caption" display="block" mb={1.5}>Monto registrado en la rendición: S/. {parseFloat(comprobanteValidando.monto || 0).toFixed(2)}{comprobanteValidando.monto_factura ? ` · Monto usado: S/. ${parseFloat(comprobanteValidando.monto_factura).toFixed(2)}` : ''}</MDTypography>
                  <TextField fullWidth size="small" type="number" label="Monto real de la factura" value={montoCorregido} onChange={(e) => setMontoCorregido(e.target.value)} sx={{ mb: 1.5 }} />
                  <TextField fullWidth size="small" multiline minRows={2} label="Sustento (por qué el monto es distinto)" value={sustentoMonto} onChange={(e) => setSustentoMonto(e.target.value)} sx={{ mb: 1.5 }} />
                  <Button variant="contained" color="warning" onClick={guardarMontoYValidar} disabled={guardandoMonto}>
                    {guardandoMonto ? 'Validando…' : 'Guardar monto y validar de nuevo'}
                  </Button>
                </Box>
              )}

              {/* Botones de acción */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => imprimirResultado()}
                  sx={{
                    backgroundColor: '#d32f2f !important',
                    color: 'white !important',
                    '&:hover': {
                      backgroundColor: '#b71c1c !important'
                    }
                  }}
                >
                  🖨️ Imprimir
                </Button>
              </Box>

              {/* CSS de impresión */}
              <style>{`
                @media print {
                  * {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  html, body {
                    width: 100% !important;
                    height: 100% !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .MuiDialog-paper {
                    box-shadow: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .MuiDialogTitle-root,
                  .MuiDialogActions-root {
                    display: none !important;
                  }
                  button {
                    display: none !important;
                  }
                  .MuiBackdrop-root {
                    display: none !important;
                  }
                  .MuiDialog-scrollPaper {
                    margin: 0 !important;
                  }
                  .MuiModal-root {
                    all: revert !important;
                  }
                  body > div {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                }
              `}</style>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarValidacionSunat} variant="contained" color="primary" sx={{ color: 'white !important' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default ValidarComprobante;
