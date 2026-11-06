import React, { useState, useEffect } from 'react';
import { Grid, Card, Icon, CircularProgress, Alert } from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDButton from 'components/MDButton';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import ComplexStatisticsCard from 'examples/Cards/StatisticsCards/ComplexStatisticsCard';
import api from 'services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';

function DashboardJefe() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    comisiones: 0,
    usuariosEquipo: 0,
    comisionesPendientes: 0,
    comisionesAprobadas: 0,
    presupuestosAsignados: 0,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const comisiones = await api.obtenerComisiones().catch(() => []);

      let pendientes = 0;
      let aprobadas = 0;
      let conPresupuesto = 0;

      comisiones.forEach((c) => {
        if (c.aprobacion_estado === 'APROBADA') {
          aprobadas++;
        } else if (c.aprobacion_estado === 'PENDIENTE_APROBACION') {
          pendientes++;
        }
        // Contar comisiones con presupuesto asignado
        if (c.presupuesto_estado === 'PRESUPUESTO ASIGNADO') {
          conPresupuesto++;
        }
      });

      setStats({
        comisiones: comisiones.length || 0,
        usuariosEquipo: 0, // Esto se calcularía con un endpoint específico
        comisionesPendientes: pendientes,
        comisionesAprobadas: aprobadas,
        presupuestosAsignados: conPresupuesto,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {error && (
          <MDBox mb={2}>
            <Alert severity="warning">{error}</Alert>
          </MDBox>
        )}

        {/* Título Bienvenida */}
        <MDBox mb={3}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDBox>
              <MDTypography variant="h4" fontWeight="bold" color="dark">
                👔 Panel de Jefe de Área
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="regular">
                Control y supervisión de comisiones del equipo
              </MDTypography>
            </MDBox>
            <MDBox
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 152, 0, 0.3)',
              }}
            >
              <MDTypography variant="caption" color="text" fontWeight="regular">
                <strong>Usuario:</strong> {usuario?.username || 'N/A'}
              </MDTypography>
              <MDBox mt={0.5} />
              <MDTypography variant="caption" color="text" fontWeight="regular">
                <strong>Rol:</strong> Jefe
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>

        {/* Grid de Estadísticas */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="assignment"
                title="Comisiones Totales"
                count={stats.comisiones}
                percentage={{
                  color: 'success',
                  amount: '+8%',
                  label: 'este mes',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="check_circle"
                title="Aprobadas"
                count={stats.comisionesAprobadas}
                percentage={{
                  color: 'success',
                  amount: '',
                  label: 'finalizadas',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="schedule"
                title="Pendientes de Revisión"
                count={stats.comisionesPendientes}
                percentage={{
                  color: 'warning',
                  amount: '',
                  label: 'en espera',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="assignment_turned_in"
                title="Asignados con Presupuesto"
                count={stats.presupuestosAsignados}
                percentage={{
                  color: 'success',
                  amount: '',
                  label: 'presupuestos asignados',
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* Sección de Supervisión */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  🔍 Funciones de Supervisión
                </MDTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={() => navigate('/gestion/comisiones')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>assignment</Icon>
                      <MDTypography variant="button">Ver Comisiones</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={() => navigate('/aprobaciones')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>check_circle</Icon>
                      <MDTypography variant="button">Aprobar/Rechazar</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={() => navigate('/reportes/presupuestos')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>assessment</Icon>
                      <MDTypography variant="button">Ver Reportes</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="success"
                      fullWidth
                      onClick={() => navigate('/reportes/presupuestos-asignados')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>assignment_turned_in</Icon>
                      <MDTypography variant="button">Presupuestos Asignados</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={() => navigate('/gestion/usuarios')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>people</Icon>
                      <MDTypography variant="button">Mi Equipo</MDTypography>
                    </MDButton>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>

          {/* Información de Supervisión */}
          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <MDBox p={3} color="white">
                <MDTypography variant="h6" fontWeight="bold" mb={2} color="white">
                  📋 Información de Supervisión
                </MDTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1} color="white">
                        ✓ Aprobación Rápida
                      </MDTypography>
                      <MDTypography variant="caption" color="white">
                        Acceso directo para aprobar comisiones del equipo
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1} color="white">
                        📊 Análisis de Datos
                      </MDTypography>
                      <MDTypography variant="caption" color="white">
                        Reportes detallados del desempeño del equipo
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1} color="white">
                        👥 Gestión de Equipo
                      </MDTypography>
                      <MDTypography variant="caption" color="white">
                        Supervisión y seguimiento del equipo a cargo
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1} color="white">
                        ⚡ Acciones Rápidas
                      </MDTypography>
                      <MDTypography variant="caption" color="white">
                        Botones directos para funciones de supervisión
                      </MDTypography>
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default DashboardJefe;
