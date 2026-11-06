import React, { useState, useEffect } from 'react';
import { Grid, Card, Icon, CircularProgress, Alert, LinearProgress, Box } from '@mui/material';
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

function DashboardUsuario() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    misComisiones: 0,
    totalGasto: 0,
    comisionesPendientes: 0,
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
      const comisiones = await api.obtenerComisiones(true); // true = solo_mias

      let totalGasto = 0;
      let pendientes = 0;

      comisiones.forEach((c) => {
        totalGasto += parseFloat(c.costo_total_comision || 0);
        if (c.aprobacion_estado !== 'APROBADA') pendientes++;
      });

      setStats({
        misComisiones: comisiones.length || 0,
        totalGasto,
        comisionesPendientes: pendientes,
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
                👋 Bienvenido, {usuario?.nombre || 'Usuario'}
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="regular">
                Gestiona tus comisiones de servicio de forma fácil y rápida
              </MDTypography>
            </MDBox>
            <MDBox
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(76, 175, 80, 0.3)',
              }}
            >
              <MDTypography variant="caption" color="text" fontWeight="regular">
                <strong>Usuario:</strong> {usuario?.username || 'N/A'}
              </MDTypography>
              <MDBox mt={0.5} />
              <MDTypography variant="caption" color="text" fontWeight="regular">
                <strong>Rol:</strong>
                {usuario?.rol === 'usuario'
                  ? 'Usuario'
                  : usuario?.rol === 'admin'
                  ? 'Administrador'
                  : usuario?.rol === 'jefe'
                  ? 'Jefe'
                  : usuario?.rol}
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>

        {/* Grid de Estadísticas Personales */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="assignment_turned_in"
                title="Mis Comisiones"
                count={stats.misComisiones}
                percentage={{
                  color: 'success',
                  amount: '',
                  label: 'Registradas',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="account_balance_wallet"
                title="Gasto Total"
                count={`S/. ${stats.totalGasto.toFixed(2)}`}
                percentage={{
                  color: 'info',
                  amount: '',
                  label: 'Invertido en comisiones',
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="schedule"
                title="Pendientes de Revisión"
                count={stats.comisionesPendientes}
                percentage={{
                  color: 'warning',
                  amount: '',
                  label: 'Esperando aprobación',
                }}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* Acciones Rápidas */}
        <Grid container spacing={3}>
          {/* Sección Mis Comisiones */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <MDBox p={3} color="white">
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h5" fontWeight="bold" color="white">
                    📋 Mis Comisiones
                  </MDTypography>
                  <Icon sx={{ fontSize: '2rem', color: 'white' }}>list_alt</Icon>
                </MDBox>
                <MDTypography variant="body2" color="white" mb={2}>
                  Crea, visualiza, edita o elimina todas tus comisiones registradas.
                </MDTypography>
                <MDButton
                  variant="contained"
                  color="white"
                  fullWidth
                  onClick={() => navigate('/gestion/comisiones')}
                >
                  Ver Todo
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* Sección de Emisión de Formatos */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <MDBox p={3} color="white">
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h5" fontWeight="bold" color="white">
                    📄 Emisión de Formatos
                  </MDTypography>
                  <Icon sx={{ fontSize: '2rem', color: 'white' }}>description</Icon>
                </MDBox>
                <MDTypography variant="body2" color="white" mb={2}>
                  Emite y gestiona los formatos de rendición de cuentas.
                </MDTypography>
                <MDButton
                  variant="contained"
                  color="white"
                  fullWidth
                  onClick={() => navigate('/gestion/emision-formatos')}
                >
                  Ir a Formatos
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* Sección de Calendario */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <MDBox p={3} color="white">
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h5" fontWeight="bold" color="white">
                    📅 Calendario
                  </MDTypography>
                  <Icon sx={{ fontSize: '2rem', color: 'white' }}>event</Icon>
                </MDBox>
                <MDTypography variant="body2" color="white" mb={2}>
                  Consulta el calendario de comisiones y eventos programados.
                </MDTypography>
                <MDButton
                  variant="contained"
                  color="white"
                  fullWidth
                  onClick={() => navigate('/calendario')}
                >
                  Ver Calendario
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Guía Rápida */}
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  📚 Guía Rápida
                </MDTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1}>
                        1️⃣ Gestionar Comisiones
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Ve a &quot;Mis Comisiones&quot; para crear, editar o eliminar comisiones.
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1}>
                        2️⃣ Emitir Formatos
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Genera formatos de rendición de cuentas para tus comisiones.
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <MDBox
                      p={2}
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <MDTypography variant="subtitle2" fontWeight="bold" mb={1}>
                        3️⃣ Usar Calendario
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Visualiza eventos y fechas importantes programadas.
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

export default DashboardUsuario;
