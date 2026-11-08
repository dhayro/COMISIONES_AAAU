import React, { useState, useEffect } from 'react';
import { useAuth } from 'context/AuthContext';
import {
  Card,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarioComisiones from './CalendarioComisiones';

function GestionAprobaciones() {
  const { usuario } = useAuth();
  const puedeAprobar = usuario?.rol === 'jefe' || usuario?.rol === 'admin';
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedComision, setSelectedComision] = useState(null);
  const [observacion, setObservacion] = useState('');
  const [accion, setAccion] = useState(''); // 'aprobar' o 'rechazar'
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [detalleComisionados, setDetalleComisionados] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [openCalendario, setOpenCalendario] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    total: 0,
  });

  // Cargar comisiones pendientes
  useEffect(() => {
    cargarPendientes();
    cargarEstadisticas();
  }, []);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      setError('');
      const datos = await api.obtenerPendientesAprobacion();
      setComisiones(datos);
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await api.obtenerEstadisticasAprobaciones();
      setEstadisticas(stats);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const abrirModalAprobar = (comision) => {
    setSelectedComision(comision);
    setAccion('aprobar');
    setObservacion('');
    setOpenModal(true);
  };

  const abrirModalRechazar = (comision) => {
    setSelectedComision(comision);
    setAccion('rechazar');
    setObservacion('');
    setOpenModal(true);
  };

  const abrirDetalleComisionados = async (comision) => {
    try {
      setLoadingDetalle(true);
      const detalle = await api.obtenerComision(comision.id);
      setDetalleComisionados(detalle);
      setSelectedComision(comision);
      setOpenDetalleModal(true);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el detalle de comisionados',
      });
    } finally {
      setLoadingDetalle(false);
    }
  };

  const procesarComision = async () => {
    if (!selectedComision) return;

    try {
      setLoading(true);

      // Validar rol para aprobación
      if (accion === 'aprobar' && !puedeAprobar) {
        Swal.fire({
          icon: 'warning',
          title: 'Permiso insuficiente',
          text: 'Solo usuarios con rol Jefe o Admin pueden aprobar comisiones.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      if (accion === 'aprobar') {
        await api.aprobarComision(selectedComision.id, observacion);
        Swal.fire({
          icon: 'success',
          title: 'Comisión Aprobada',
          text: 'La comisión ha sido aprobada exitosamente',
        });
      } else {
        await api.rechazarComision(selectedComision.id, observacion);
        Swal.fire({
          icon: 'success',
          title: 'Comisión Rechazada',
          text: 'La comisión ha sido rechazada exitosamente',
        });
      }

      setOpenModal(false);
      cargarPendientes();
      cargarEstadisticas();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    {
      Header: 'Item',
      accessor: 'item',
      disableSortBy: true,
      width: '5%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        return row.index + 1;
      },
    },
    { Header: 'Usuario', accessor: 'usuario_nombre', width: '18%' },
    { Header: 'Ámbito', accessor: 'ambito_nombre', width: '12%' },
    {
      Header: 'Lugar',
      accessor: 'lugar',
      width: '14%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row: { original } }) => {
        // eslint-disable-next-line react/prop-types
        const texto = original.lugar || '';
        const partes = String(texto).split(/,s*|s+Ys+/).map((p) => p.trim()).filter(Boolean);
        const extra = Math.max(partes.length - 2, 0);
        return (
          <MDTypography
            variant="button"
            display="block"
            title={texto}
            sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {partes.slice(0, 2).join(', ')}
            {extra > 0 ? ` (+${extra} más)` : ''}
          </MDTypography>
        );
      },
    },
    { Header: 'Modalidad', accessor: 'modalidad_viaje', width: '11%' },
    {
      Header: 'Días',
      accessor: 'num_dias',
      width: '5%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        const dias = row.original.num_dias || '-';
        return dias;
      },
    },
    {
      Header: 'Período',
      accessor: 'fecha_salida',
      width: '13%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        const fechaSalida = row.original.fecha_salida;
        // eslint-disable-next-line react/prop-types
        const fechaRetorno = row.original.fecha_retorno;
        const dmy = (v) => {
          const [a, m, d] = String(v).slice(0, 10).split('-');
          return a && m && d ? `${d}/${m}/${a}` : '-';
        };
        if (!fechaSalida || !fechaRetorno) return '-';
        return (
          <MDBox lineHeight={1.3}>
            <MDTypography variant="button" display="block" sx={{ whiteSpace: 'nowrap' }}>{dmy(fechaSalida)}</MDTypography>
            <MDTypography variant="caption" color="text" display="block" sx={{ whiteSpace: 'nowrap' }}>al {dmy(fechaRetorno)}</MDTypography>
          </MDBox>
        );
      },
    },
    {
      Header: 'Costo total',
      accessor: 'costo_total_comision',
      width: '10%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        const monto = Number(row.original.costo_total_comision || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return <MDTypography variant="button" fontWeight="bold" color="dark">{monto}</MDTypography>;
      },
    },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      disableSortBy: true,
      width: '12%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        const rowData = row.original;
        return (
          <MDBox display="flex" gap={0.5} justifyContent="center">
            <Tooltip title="Ver Detalle">
              <IconButton
                size="small"
                color="info"
                onClick={() => abrirDetalleComisionados(rowData)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Aprobar">
              <span>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => abrirModalAprobar(rowData)}
                  disabled={!puedeAprobar}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Rechazar">
              <IconButton size="small" color="error" onClick={() => abrirModalRechazar(rowData)}>
                <ThumbDownIcon fontSize="small" />
              </IconButton>
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
          <MDBox
            mx={2}
            mt={-3}
            py={3}
            px={2}
            variant="gradient"
            bgColor="info"
            borderRadius="lg"
            coloredShadow="info"
          >
            <MDBox>
              <MDTypography variant="h6" color="white" fontWeight="medium" sx={{ textTransform: 'uppercase' }}>
                Aprobación de Comisiones
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Revise y apruebe las comisiones pendientes.
              </MDTypography>
            </MDBox>
          </MDBox>

          <MDBox p={3}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Estadísticas */}
            <MDBox display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" gap={2} sx={{ mb: 3 }}>
              <MDBox
                sx={{
                  backgroundColor: '#fff3cd',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid #ffc107',
                }}
              >
                <MDTypography variant="caption" color="text">
                  Pendientes
                </MDTypography>
                <MDTypography variant="h4" color="warning" fontWeight="bold">
                  {estadisticas.pendientes}
                </MDTypography>
              </MDBox>

              <MDBox
                sx={{
                  backgroundColor: '#d4edda',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid #28a745',
                }}
              >
                <MDTypography variant="caption" color="text">
                  Aprobadas
                </MDTypography>
                <MDTypography variant="h4" color="success" fontWeight="bold">
                  {estadisticas.aprobadas}
                </MDTypography>
              </MDBox>

              <MDBox
                sx={{
                  backgroundColor: '#f8d7da',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid #dc3545',
                }}
              >
                <MDTypography variant="caption" color="text">
                  Rechazadas
                </MDTypography>
                <MDTypography variant="h4" color="error" fontWeight="bold">
                  {estadisticas.rechazadas}
                </MDTypography>
              </MDBox>

              <MDBox
                sx={{
                  backgroundColor: '#e7e7ff',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid #6c63ff',
                }}
              >
                <MDTypography variant="caption" color="text">
                  Total
                </MDTypography>
                <MDTypography variant="h4" color="info" fontWeight="bold">
                  {estadisticas.total}
                </MDTypography>
              </MDBox>
            </MDBox>

            {/* Botón de Calendario */}
            <MDBox sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <MDButton
                variant="contained"
                color="info"
                startIcon={<CalendarTodayIcon />}
                onClick={() => setOpenCalendario(true)}
              >
                Ver Calendario
              </MDButton>
            </MDBox>

            {/* Tabla */}
            {comisiones.length > 0 ? (
              <MDBox sx={{ mb: 3 }}>
                <DataTable
                  table={{
                    columns: columnas,
                    rows: comisiones.sort((a, b) => {
                      // Ordenar por fecha_salida de forma descendente (más recientes primero)
                      const dateA = new Date(a.fecha_salida || 0);
                      const dateB = new Date(b.fecha_salida || 0);
                      return dateB - dateA;
                    }),
                  }}
                  canSearch
                  isSorted={true}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries
                  noEndBorder
                  vistaMovil
                />
              </MDBox>
            ) : (
              <MDBox textAlign="center" py={5}>
                <MDTypography variant="body2" color="text">
                  {loading ? 'Cargando...' : 'No hay comisiones pendientes de aprobación'}
                </MDTypography>
              </MDBox>
            )}
          </MDBox>
        </Card>
      </MDBox>

      {/* Modal para aprobar/rechazar */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {accion === 'aprobar' ? 'Aprobar Comisión' : 'Rechazar Comisión'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedComision && (
            <>
              <MDBox mb={2}>
                <MDTypography variant="caption" fontWeight="bold">
                  Usuario:
                </MDTypography>
                <MDTypography variant="body2">{selectedComision.usuario_nombre}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="caption" fontWeight="bold">
                  Lugar:
                </MDTypography>
                <MDTypography variant="body2">{selectedComision.lugar}</MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <MDTypography variant="caption" fontWeight="bold">
                  Período:
                </MDTypography>
                <MDTypography variant="body2">
                  {new Date(selectedComision.fecha_salida).toLocaleDateString('es-ES')} -{' '}
                  {new Date(selectedComision.fecha_retorno).toLocaleDateString('es-ES')}
                </MDTypography>
              </MDBox>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                placeholder={
                  accion === 'aprobar'
                    ? 'Agregar observaciones (opcional)...'
                    : 'Motivo del rechazo...'
                }
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                variant="outlined"
                size="small"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button
            onClick={procesarComision}
            variant="contained"
            color={accion === 'aprobar' ? 'success' : 'error'}
            disabled={loading || (accion === 'aprobar' && !puedeAprobar)}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : accion === 'aprobar' ? (
              'Aprobar'
            ) : (
              'Rechazar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver detalle de comisionados */}
      <Dialog
        open={openDetalleModal}
        onClose={() => setOpenDetalleModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedComision && detalleComisionados
            ? `Detalle de Comisionados - ${selectedComision.lugar}`
            : 'Detalle'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {loadingDetalle ? (
            <MDBox display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </MDBox>
          ) : detalleComisionados &&
            detalleComisionados.comisionados &&
            detalleComisionados.comisionados.length > 0 ? (
            <MDBox sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #2c3e50' }}>
                    <th
                      style={{
                        border: '1px solid #ddd',
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                      }}
                    >
                      Usuario
                    </th>
                    {detalleComisionados.clasificadores &&
                      detalleComisionados.clasificadores.map((cl) => (
                        <th
                          key={cl.id}
                          style={{
                            border: '1px solid #ddd',
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                          }}
                          title={`${cl.partida} - ${cl.nombre}`}
                        >
                          <MDTypography
                            variant="caption"
                            sx={{
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: '#2c3e50',
                              lineHeight: 1.2,
                            }}
                          >
                            <div>{cl.partida}</div>
                            <div style={{ fontSize: '10px', marginTop: '2px' }}>{cl.nombre}</div>
                          </MDTypography>
                        </th>
                      ))}
                    <th
                      style={{
                        border: '1px solid #ddd',
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        backgroundColor: '#e8f4f8',
                        color: '#2c3e50',
                        borderBottom: '2px solid #2c3e50',
                      }}
                    >
                      Total Persona
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detalleComisionados.comisionados.map((com, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                      }}
                    >
                      <td
                        style={{
                          border: '1px solid #ddd',
                          padding: '10px',
                          fontWeight: '500',
                          color: '#2c3e50',
                        }}
                      >
                        {com.usuario_nombre}
                      </td>
                      {detalleComisionados.clasificadores &&
                        detalleComisionados.clasificadores.map((cl) => {
                          const monto = com.montos_por_clasificador?.[cl.id] || 0;
                          return (
                            <td
                              key={cl.id}
                              style={{
                                border: '1px solid #ddd',
                                padding: '10px',
                                textAlign: 'right',
                                color: '#2c3e50',
                              }}
                            >
                              {parseFloat(monto).toFixed(2)}
                            </td>
                          );
                        })}
                      <td
                        style={{
                          border: '1px solid #ddd',
                          padding: '10px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          backgroundColor: '#e8f4f8',
                          color: '#2c3e50',
                        }}
                      >
                        {parseFloat(com.monto_total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr
                    style={{
                      backgroundColor: '#d4e6f1',
                      fontWeight: 'bold',
                      borderTop: '2px solid #2c3e50',
                    }}
                  >
                    <td
                      style={{
                        border: '1px solid #ddd',
                        padding: '10px',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                      }}
                    >
                      TOTAL PARTIDA
                    </td>
                    {detalleComisionados.clasificadores &&
                      detalleComisionados.clasificadores.map((cl) => (
                        <td
                          key={cl.id}
                          style={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                          }}
                        >
                          {parseFloat(cl.monto_total || 0).toFixed(2)}
                        </td>
                      ))}
                    <td
                      style={{
                        border: '1px solid #ddd',
                        padding: '10px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        backgroundColor: '#2c3e50',
                        color: '#ffffff',
                      }}
                    >
                      {parseFloat(detalleComisionados.monto_total || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </MDBox>
          ) : (
            <MDTypography variant="body2" color="text">
              No hay comisionados registrados
            </MDTypography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalleModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Calendario */}
      <CalendarioComisiones
        open={openCalendario}
        onClose={() => setOpenCalendario(false)}
        comisiones={comisiones}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default GestionAprobaciones;
