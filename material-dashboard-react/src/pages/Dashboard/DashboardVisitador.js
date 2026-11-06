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

function DashboardVisitador() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendientesRevisión: 0,
    montoPendientes: 0,
    presupuestosAsignados: 0,
    montoAsignados: 0,
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
      const comisiones = await api.obtenerComisiones();

      let montoPendientes = 0;
      let montoAsignados = 0;
      let pendientes = 0;
      let asignados = 0;

      comisiones.forEach((c) => {
        const monto = parseFloat(c.costo_total_comision || 0);

        // Pendientes: PRESUPUESTO POR ASIGNAR y APROBADA
        if (
          c.presupuesto_estado === 'PRESUPUESTO POR ASIGNAR' &&
          c.aprobacion_estado === 'APROBADA'
        ) {
          pendientes++;
          montoPendientes += monto;
        }

        // Asignados: PRESUPUESTO ASIGNADO
        if (c.presupuesto_estado === 'PRESUPUESTO ASIGNADO') {
          asignados++;
          montoAsignados += monto;
        }
      });

      setStats({
        pendientesRevisión: pendientes,
        montoPendientes: montoPendientes,
        presupuestosAsignados: asignados,
        montoAsignados: montoAsignados,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Header */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center">
              <MDBox>
                <MDTypography variant="h4" fontWeight="bold" color="dark">
                  Panel de Presupuestos
                </MDTypography>
                <MDTypography variant="button" color="text" fontWeight="regular">
                  Supervisión de comisiones pendientes y asignadas
                </MDTypography>
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <ComplexStatisticsCard
              color="warning"
              icon="pending_actions"
              title="Pendientes de Revisión"
              count={stats.pendientesRevisión}
              percentage={{
                color: 'warning',
                count: `$${stats.montoPendientes.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                text: 'por asignar',
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ComplexStatisticsCard
              color="success"
              icon="check_circle"
              title="Presupuesto Asignado"
              count={stats.presupuestosAsignados}
              percentage={{
                color: 'success',
                count: `$${stats.montoAsignados.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                text: 'asignado',
              }}
            />
          </Grid>
        </Grid>

        {/* Information Card */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  Panel de Supervisión de Presupuestos
                </MDTypography>
                <MDTypography variant="body2" color="text">
                  Como usuario con rol <strong>ADMINISTRATIVO</strong>, puedes supervisar y
                  controlar los presupuestos de las comisiones aprobadas. Tu panel muestra:
                </MDTypography>
                <MDBox mt={2} ml={2}>
                  <MDTypography variant="body2" color="text">
                    • <strong>Pendientes de Revisión:</strong> Comisiones APROBADAS que aún no
                    tienen presupuesto asignado (PRESUPUESTO POR ASIGNAR)
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    • <strong>Presupuesto Asignado:</strong> Comisiones que ya tienen presupuesto
                    documentado y asignado
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    • Montos totales de cada categoría para auditoría y control
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    • Acceso a reportes detallados de presupuestos
                  </MDTypography>
                </MDBox>
                <MDTypography variant="caption" color="text" mt={2} display="block">
                  <strong>Nota:</strong> Panel de supervisión y auditoría.
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <MDButton
              variant="contained"
              color="warning"
              fullWidth
              onClick={() => navigate('/gestion/comisiones')}
            >
              Ver Pendientes de Revisión
            </MDButton>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MDButton
              variant="contained"
              color="success"
              fullWidth
              onClick={() => navigate('/gestion/comisiones')}
            >
              Ver Presupuestos Asignados
            </MDButton>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <MDButton
              variant="outlined"
              color="info"
              fullWidth
              onClick={() => navigate('/gestion/reportes')}
            >
              Generar Reportes
            </MDButton>
          </Grid>
        </Grid>

        {/* User Info Card */}
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  Informacion de Sesion
                </MDTypography>
                <MDTypography variant="body2" color="text">
                  <strong>Usuario:</strong> {usuario?.nombre || usuario?.email || 'N/A'}
                </MDTypography>
                <MDTypography variant="body2" color="text">
                  <strong>Rol:</strong> Administrativo ({usuario?.rol})
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default DashboardVisitador;
