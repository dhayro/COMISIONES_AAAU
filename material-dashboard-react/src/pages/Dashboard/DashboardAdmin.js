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

function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    comisiones: 0,
    usuarios: 0,
    ambitos: 0,
    clasificadores: 0,
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
      const [comisiones, usuarios, ambitos, clasificadores] = await Promise.all([
        api.obtenerComisiones().catch(() => []),
        api.listar().catch(() => []),
        api.obtenerAmbitos().catch(() => []),
        api.obtenerClasificadores().catch(() => []),
      ]);

      setStats({
        comisiones: comisiones.length || 0,
        usuarios: usuarios.length || 0,
        ambitos: ambitos.length || 0,
        clasificadores: clasificadores.length || 0,
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
                👨‍💼 Panel Administrativo
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="regular">
                Resumen general del sistema de comisiones
              </MDTypography>
            </MDBox>
            <MDBox
              sx={{
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(33, 150, 243, 0.3)',
              }}
            >
              <MDTypography variant="caption" color="text" fontWeight="regular">
                <strong>Usuario:</strong> {usuario?.username || 'N/A'}
              </MDTypography>
              <MDBox mt={0.5} />
              <MDTypography variant="caption" color="text" fontWeight="regular">
                <strong>Rol:</strong> Administrador
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
                title="Comisiones Registradas"
                count={stats.comisiones}
                percentage={{
                  color: 'success',
                  amount: '+15%',
                  label: 'este mes',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="people"
                title="Usuarios Activos"
                count={stats.usuarios}
                percentage={{
                  color: 'info',
                  amount: '',
                  label: 'del sistema',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="location_on"
                title="Ámbitos"
                count={stats.ambitos}
                percentage={{
                  color: 'warning',
                  amount: '',
                  label: 'configurados',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="error"
                icon="category"
                title="Clasificadores"
                count={stats.clasificadores}
                percentage={{
                  color: 'error',
                  amount: '',
                  label: 'partidas presupuestales',
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* Sección de Gestión */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  🔧 Acciones de Administración
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
                      <MDTypography variant="button">Gestionar Comisiones</MDTypography>
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
                      <MDTypography variant="button">Gestionar Usuarios</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={() => navigate('/gestion/ambitos')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>location_on</Icon>
                      <MDTypography variant="button">Gestionar Ámbitos</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      fullWidth
                      onClick={() => navigate('/gestion/clasificadores')}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>category</Icon>
                      <MDTypography variant="button">Gestionar Clasificadores</MDTypography>
                    </MDButton>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>

          {/* Accesos Rápidos a Reportes */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  📊 Reportes y Análisis
                </MDTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <MDButton
                      variant="outlined"
                      color="success"
                      fullWidth
                      onClick={() => navigate('/reportes/presupuestos')}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>assessment</Icon>
                      <MDTypography variant="button">Presupuestos Asignados</MDTypography>
                    </MDButton>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MDButton
                      variant="outlined"
                      color="warning"
                      fullWidth
                      onClick={() => navigate('/reportes/presupuestos-pendientes')}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        gap: 1,
                        p: 2,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      }}
                    >
                      <Icon>pending_actions</Icon>
                      <MDTypography variant="button">Presupuestos Pendientes</MDTypography>
                    </MDButton>
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

export default DashboardAdmin;
