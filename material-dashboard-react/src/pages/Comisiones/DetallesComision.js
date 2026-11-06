import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDButton from 'components/MDButton';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import apiService from 'services/api';

function DetallesComision() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comision, setComision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarComision();
  }, [id]);

  const cargarComision = async () => {
    try {
      const datos = await apiService.obtenerComision(id);
      setComision(datos);
    } catch (err) {
      setError(`Error cargando comisión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    navigate(`/comisiones/${id}/editar`);
  };

  const handleVolver = () => {
    navigate('/comisiones');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error || !comision) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <Card sx={{ p: 3, backgroundColor: '#ffebee' }}>
            <MDTypography color="error">{error || 'Comisión no encontrada'}</MDTypography>
            <MDButton variant="outlined" color="secondary" sx={{ mt: 2 }} onClick={handleVolver}>
              Volver
            </MDButton>
          </Card>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const columns = [
    { Header: 'Usuario', accessor: 'usuario_nombre', width: '25%' },
    { Header: 'Clasificador', accessor: 'clasificador_nombre', width: '30%' },
    { Header: 'Partida', accessor: 'partida', width: '15%' },
    { Header: 'Días', accessor: 'dias', align: 'center', width: '10%' },
    { Header: 'Costo/Día', accessor: 'costo_xdia', align: 'right', width: '12%' },
    { Header: 'Monto', accessor: 'monto', align: 'right', width: '12%' },
  ];

  const rows = (comision.comisionados || []).map((com) => ({
    ...com,
    monto: `S/. ${com.monto.toFixed(2)}`,
    costo_xdia: `S/. ${com.costo_xdia.toFixed(2)}`,
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" fontWeight="bold">
            Detalles de la Comisión
          </MDTypography>
          <MDBox display="flex" gap={2}>
            <MDButton variant="outlined" color="secondary" onClick={handleVolver}>
              Volver
            </MDButton>
            <MDButton variant="gradient" color="info" onClick={handleEditar}>
              Editar
            </MDButton>
          </MDBox>
        </MDBox>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <MDTypography variant="h6" fontWeight="bold" mb={2}>
                Información Principal
              </MDTypography>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Ámbito
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {comision.ambito_nombre}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Lugar/Destino
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {comision.lugar}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Ruta
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {comision.ruta || '-'}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Modalidad de Viaje
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {comision.modalidad_viaje}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Estado
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {comision.estado}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <MDTypography variant="h6" fontWeight="bold" mb={2}>
                Fechas y Costos
              </MDTypography>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Fecha Salida
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {new Date(comision.fecha_salida).toLocaleString('es-PE')}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Fecha Retorno
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {new Date(comision.fecha_retorno).toLocaleString('es-PE')}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Número de Días
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {comision.num_dias}
                </MDTypography>
              </MDBox>

              <MDBox mb={2}>
                <MDTypography variant="caption" color="textSecondary">
                  Costo x Día
                </MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  S/. {parseFloat(comision.costo_xdia).toFixed(2)}
                </MDTypography>
              </MDBox>

              <MDBox mb={2} sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 1 }}>
                <MDTypography variant="caption" color="textSecondary">
                  Total Comisión
                </MDTypography>
                <MDTypography variant="h5" fontWeight="bold" color="info">
                  S/. {parseFloat(comision.costo_total_comision || 0).toFixed(2)}
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <MDTypography variant="h6" fontWeight="bold" mb={2}>
                Comisionados
              </MDTypography>

              {(comision.comisionados || []).length === 0 ? (
                <MDTypography variant="body2" color="textSecondary">
                  No hay comisionados registrados
                </MDTypography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Usuario</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Partida</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Descripción</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(comision.comisionados || []).map((com, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{com.usuario_id}</TableCell>
                          <TableCell>{com.clasificador_id}</TableCell>
                          <TableCell>{com.descripcion || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Grid>

          {comision.observacion && (
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  Observación
                </MDTypography>
                <MDTypography variant="body2">{comision.observacion}</MDTypography>
              </Card>
            </Grid>
          )}
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default DetallesComision;
