import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import EventIcon from '@mui/icons-material/Event';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import api from 'services/api';

function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [comisionesMes, setComisionesMes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [comisionSeleccionada, setComisionSeleccionada] = useState(null);

  useEffect(() => {
    cargarComisionesPorMes();
  }, [currentDate]);

  const cargarComisionesPorMes = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const datos = await api.obtenerComisionesPorMes(year, month);
      setComisionesMes(datos || []);
    } catch (error) {
      console.error('Error al cargar comisiones del mes:', error);
      setComisionesMes([]);
    } finally {
      setLoading(false);
    }
  };

  const colores = [
    { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
    { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
    { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
    { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' },
    { bg: '#ffe0b2', border: '#ff6f00', text: '#e65100' },
    { bg: '#f1f8e9', border: '#689f38', text: '#33691e' },
  ];

  const getColorForComision = (comisionId) => {
    return colores[comisionId % colores.length];
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getComisionesForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];

    return comisionesMes.filter((comision) => {
      const fechaSalida = new Date(comision.fecha_salida).toISOString().split('T')[0];
      const fechaRetorno = new Date(comision.fecha_retorno).toISOString().split('T')[0];
      return dateStr >= fechaSalida && dateStr <= fechaRetorno;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleVerDetalle = (comision) => {
    setComisionSeleccionada(comision);
    setDetalleOpen(true);
  };

  const agruparComisionados = (comisionados) => {
    if (!comisionados || comisionados.length === 0) return [];

    const agrupados = {};
    comisionados.forEach((com) => {
      const key = com.usuario_nombre;
      if (!agrupados[key]) {
        agrupados[key] = {
          nombre: com.usuario_nombre,
          usuario_id: com.usuario_id,
          partidas: [],
          montoTotal: 0,
        };
      }
      agrupados[key].partidas.push({
        partida: com.partida,
        nombre: com.clasificador_nombre,
        monto: com.monto_real || com.monto,
      });
      agrupados[key].montoTotal += parseFloat(com.monto_real || com.monto) || 0;
    });
    return Object.values(agrupados);
  };

  const contarComisionadosUnicos = (comisionados) => {
    if (!comisionados || comisionados.length === 0) return 0;
    const nombres = new Set(comisionados.map((c) => c.usuario_nombre));
    return nombres.size;
  };

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                {/* Encabezado */}
                <MDBox
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    gap: 1,
                  }}
                >
                  <IconButton
                    onClick={handlePrevMonth}
                    size="small"
                    sx={{
                      backgroundColor: '#f0f0f0',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                    }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>

                  <MDBox sx={{ textAlign: 'center', flex: 1 }}>
                    <MDTypography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      <EventIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </MDTypography>
                    <MDTypography variant="caption" color="text">
                      Total: {comisionesMes.length} comisiones
                    </MDTypography>
                  </MDBox>

                  <MDBox sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      onClick={handleToday}
                      size="small"
                      sx={{
                        backgroundColor: '#f0f0f0',
                        '&:hover': { backgroundColor: '#e0e0e0' },
                      }}
                      title="Hoy"
                    >
                      <EventIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={handleNextMonth}
                      size="small"
                      sx={{
                        backgroundColor: '#f0f0f0',
                        '&:hover': { backgroundColor: '#e0e0e0' },
                      }}
                    >
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </MDBox>
                </MDBox>

                {/* Encabezado de días */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {dayNames.map((day) => (
                    <Grid item xs={12 / 7} key={day}>
                      <MDBox
                        sx={{
                          textAlign: 'center',
                          fontWeight: 'bold',
                          padding: '12px 8px',
                          backgroundColor: '#2c3e50',
                          color: '#fff',
                          borderRadius: '4px',
                        }}
                      >
                        <MDTypography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {day}
                        </MDTypography>
                      </MDBox>
                    </Grid>
                  ))}
                </Grid>

                {/* Calendario */}
                <Grid container spacing={1} sx={{ minHeight: '400px' }}>
                  {days.map((day, idx) => {
                    const comisionesDelDia = day ? getComisionesForDate(day) : [];
                    const isToday =
                      day &&
                      day === new Date().getDate() &&
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear();

                    return (
                      <Grid item xs={12 / 7} key={idx}>
                        <MDBox
                          sx={{
                            minHeight: '120px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '12px 8px',
                            backgroundColor: day ? (isToday ? '#e3f2fd' : '#fff') : '#f9f9f9',
                            cursor: day ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            '&:hover': day
                              ? {
                                  backgroundColor: '#f0f0f0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                }
                              : {},
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                          }}
                        >
                          {day && (
                            <>
                              <MDTypography
                                variant="caption"
                                sx={{
                                  fontWeight: 'bold',
                                  color: isToday ? '#1976d2' : '#2c3e50',
                                  fontSize: '14px',
                                  mb: 1,
                                }}
                              >
                                {day}
                              </MDTypography>

                              {comisionesDelDia.length > 0 && (
                                <MDBox
                                  sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    fontSize: '10px',
                                  }}
                                >
                                  {comisionesDelDia.map((com, i) => {
                                    const color = getColorForComision(com.id);
                                    const isAprobada = com.aprobacion_estado === 'APROBADA';
                                    const isRechazada = com.aprobacion_estado === 'RECHAZADA';
                                    const presupuestoColor =
                                      com.presupuesto_estado === 'PRESUPUESTO ASIGNADO'
                                        ? '#1565c0'
                                        : com.presupuesto_estado === 'PRESUPUESTO POR ASIGNAR'
                                        ? '#ff9800'
                                        : '#999';

                                    return (
                                      <MDBox
                                        key={i}
                                        onClick={() => handleVerDetalle(com)}
                                        sx={{
                                          backgroundColor: isAprobada
                                            ? '#c8e6c9'
                                            : isRechazada
                                            ? '#ffcdd2'
                                            : color.bg,
                                          border: `2px solid ${
                                            isAprobada
                                              ? '#2e7d32'
                                              : isRechazada
                                              ? '#d32f2f'
                                              : color.border
                                          }`,
                                          borderRadius: '4px',
                                          padding: '6px 8px',
                                          marginBottom: '6px',
                                          color: isAprobada
                                            ? '#1b5e20'
                                            : isRechazada
                                            ? '#b71c1c'
                                            : color.text,
                                          fontSize: '9px',
                                          fontWeight: 'bold',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          '&:hover': {
                                            boxShadow: `0 2px 6px ${
                                              isAprobada
                                                ? '#2e7d32'
                                                : isRechazada
                                                ? '#d32f2f'
                                                : color.border
                                            }`,
                                            transform: 'scale(1.02)',
                                          },
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontWeight: 'bold',
                                            marginBottom: '4px',
                                            fontSize: '9px',
                                          }}
                                        >
                                          {com.lugar.substring(0, 16)}
                                        </div>
                                        <div
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '3px',
                                          }}
                                        >
                                          {isAprobada && (
                                            <div
                                              style={{
                                                fontSize: '8px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#2e7d32',
                                                color: '#fff',
                                                padding: '2px 4px',
                                                borderRadius: '2px',
                                                textAlign: 'center',
                                              }}
                                            >
                                              ✓ Aprobada
                                            </div>
                                          )}
                                          {isRechazada && (
                                            <div
                                              style={{
                                                fontSize: '8px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#d32f2f',
                                                color: '#fff',
                                                padding: '2px 4px',
                                                borderRadius: '2px',
                                                textAlign: 'center',
                                              }}
                                            >
                                              ✕ Rechazada
                                            </div>
                                          )}
                                          {isAprobada && com.presupuesto_estado && (
                                            <div
                                              style={{
                                                fontSize: '7px',
                                                fontWeight: 'bold',
                                                backgroundColor: presupuestoColor,
                                                color: '#fff',
                                                padding: '2px 4px',
                                                borderRadius: '2px',
                                                textAlign: 'center',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              💰 {com.presupuesto_estado.substring(0, 12)}
                                            </div>
                                          )}
                                        </div>
                                      </MDBox>
                                    );
                                  })}
                                </MDBox>
                              )}

                              {comisionesDelDia.length === 0 && (
                                <MDTypography
                                  variant="caption"
                                  sx={{
                                    fontSize: '12px',
                                    color: '#ccc',
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  -
                                </MDTypography>
                              )}
                            </>
                          )}
                        </MDBox>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Leyenda */}
                <MDBox sx={{ mt: 4, p: 2, backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <MDTypography
                    variant="caption"
                    sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1, display: 'block' }}
                  >
                    📋 Leyenda:
                  </MDTypography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <MDTypography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        • 🟢 Verde: Comisión Aprobada
                      </MDTypography>
                      <MDTypography
                        variant="caption"
                        sx={{ color: '#666', display: 'block', mt: 0.5 }}
                      >
                        • 🔴 Rojo: Comisión Rechazada
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <MDTypography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        • 💰 Presupuesto: Se muestra solo en comisiones aprobadas
                      </MDTypography>
                      <MDTypography
                        variant="caption"
                        sx={{ color: '#666', display: 'block', mt: 0.5 }}
                      >
                        • 🔵 Azul: Presupuesto Asignado | 🟠 Naranja: Pendiente
                      </MDTypography>
                    </Grid>
                  </Grid>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Modal de detalle de comisión */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '8px' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
          }}
        >
          <span>Detalle de Comisión</span>
          <IconButton size="small" onClick={() => setDetalleOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {comisionSeleccionada && (
          <DialogContent sx={{ pt: 3 }}>
            <MDBox>
              {/* Información básica */}
              <MDBox sx={{ mb: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      📍 Lugar
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {comisionSeleccionada.lugar}
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      🗂️ Ámbito
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {comisionSeleccionada.ambito_nombre || 'N/A'}
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      📅 Desde
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {new Date(comisionSeleccionada.fecha_salida).toLocaleDateString('es-PY')}
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      📅 Hasta
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {new Date(comisionSeleccionada.fecha_retorno).toLocaleDateString('es-PY')}
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      👥 Total de Personas
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {contarComisionadosUnicos(comisionSeleccionada.comisionados)}
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      ✓ Estado Aprobación
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color:
                          comisionSeleccionada.aprobacion_estado === 'APROBADA'
                            ? '#2e7d32'
                            : comisionSeleccionada.aprobacion_estado === 'RECHAZADA'
                            ? '#d32f2f'
                            : '#ff9800',
                      }}
                    >
                      {comisionSeleccionada.aprobacion_estado === 'RECHAZADA'
                        ? '✕ Rechazada'
                        : comisionSeleccionada.aprobacion_estado === 'APROBADA'
                        ? '✓ Aprobada'
                        : comisionSeleccionada.aprobacion_estado}
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDTypography variant="caption" color="text" sx={{ display: 'block', mb: 0.5 }}>
                      💰 Estado Presupuesto
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color:
                          comisionSeleccionada.presupuesto_estado === 'PRESUPUESTO ASIGNADO'
                            ? '#1565c0'
                            : comisionSeleccionada.presupuesto_estado === 'PRESUPUESTO POR ASIGNAR'
                            ? '#ff9800'
                            : '#666',
                      }}
                    >
                      {comisionSeleccionada.presupuesto_estado || 'N/A'}
                    </MDTypography>
                  </Grid>
                </Grid>
              </MDBox>

              {/* Mostrar observación si está rechazada */}
              {comisionSeleccionada.aprobacion_estado === 'RECHAZADA' && (
                <MDBox
                  sx={{
                    mb: 3,
                    p: 2,
                    backgroundColor: '#ffebee',
                    borderRadius: '4px',
                    borderLeft: '4px solid #d32f2f',
                  }}
                >
                  <MDTypography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: '#b71c1c',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    📝 Razón del Rechazo
                  </MDTypography>
                  <MDTypography
                    variant="body2"
                    sx={{
                      color: '#b71c1c',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                    }}
                  >
                    {comisionSeleccionada.observacion || 'Sin observaciones'}
                  </MDTypography>
                </MDBox>
              )}

              {/* Tabla de comisionados agrupados */}
              <MDBox sx={{ mb: 3 }}>
                <MDTypography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50' }}
                >
                  👥 Comisionados (Agrupados)
                </MDTypography>

                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {agruparComisionados(comisionSeleccionada.comisionados).map(
                        (comisionado, idx) => (
                          <React.Fragment key={idx}>
                            {/* Fila de comisionado */}
                            <TableRow sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                              <TableCell
                                sx={{ py: 1.5, fontWeight: 'bold', color: '#2c3e50', width: '30%' }}
                              >
                                {comisionado.nombre}
                              </TableCell>
                              <TableCell sx={{ py: 1.5, color: '#666', width: '70%' }}>
                                {comisionado.partidas.length} partida
                                {comisionado.partidas.length > 1 ? 's' : ''}
                              </TableCell>
                              <TableCell
                                sx={{
                                  py: 1.5,
                                  fontWeight: 'bold',
                                  textAlign: 'right',
                                  color: '#1976d2',
                                  width: '150px',
                                }}
                              >
                                {comisionado.montoTotal.toLocaleString('es-PY')}
                              </TableCell>
                            </TableRow>

                            {/* Filas de partidas */}
                            {comisionado.partidas.map((partida, pidx) => (
                              <TableRow
                                key={`${idx}-${pidx}`}
                                sx={{
                                  backgroundColor: idx % 2 === 0 ? '#fafafa' : '#f5f5f5',
                                  borderLeft: '4px solid #e0e0e0',
                                }}
                              >
                                <TableCell
                                  sx={{ py: 1, pl: 4, color: '#888', fontSize: '0.875rem' }}
                                >
                                  {partida.partida}
                                </TableCell>
                                <TableCell sx={{ py: 1, color: '#666', fontSize: '0.875rem' }}>
                                  {partida.nombre}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    py: 1,
                                    textAlign: 'right',
                                    color: '#1976d2',
                                    fontSize: '0.875rem',
                                    width: '150px',
                                  }}
                                >
                                  {parseFloat(partida.monto).toLocaleString('es-PY', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        )
                      )}

                      {/* Fila de total */}
                      <TableRow sx={{ backgroundColor: '#e8f4f8', fontWeight: 'bold' }}>
                        <TableCell sx={{ py: 2, fontWeight: 'bold', color: '#2c3e50' }}>
                          TOTAL COMISIÓN
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell
                          sx={{
                            py: 2,
                            fontWeight: 'bold',
                            textAlign: 'right',
                            color: '#1565c0',
                            fontSize: '1rem',
                            width: '150px',
                          }}
                        >
                          {(comisionSeleccionada.costo_total_comision || 0).toLocaleString('es-PY')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </MDBox>

              {/* Observaciones si existen */}
              {comisionSeleccionada.observacion && (
                <MDBox
                  sx={{
                    p: 2,
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    borderLeft: '4px solid #ffc107',
                  }}
                >
                  <MDTypography
                    variant="caption"
                    sx={{ fontWeight: 'bold', color: '#856404', display: 'block', mb: 0.5 }}
                  >
                    📝 Observaciones
                  </MDTypography>
                  <MDTypography variant="body2" sx={{ color: '#856404' }}>
                    {comisionSeleccionada.observacion}
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          </DialogContent>
        )}

        <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Button
            onClick={() => setDetalleOpen(false)}
            variant="contained"
            color="primary"
            sx={{
              color: '#fff !important',
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Calendario;
