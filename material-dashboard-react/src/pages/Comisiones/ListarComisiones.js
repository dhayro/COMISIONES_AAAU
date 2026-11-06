import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Icon,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDButton from 'components/MDButton';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import apiService from 'services/api';

function ListarComisiones() {
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarComisiones();
  }, []);

  const cargarComisiones = async () => {
    try {
      setLoading(true);
      const datos = await apiService.obtenerComisiones();
      setComisiones(datos);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando comisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaComision = () => {
    navigate('/comisiones/nueva');
  };

  const handleEditar = (id) => {
    navigate(`/comisiones/${id}/editar`);
  };

  const handleVer = (id) => {
    navigate(`/comisiones/${id}`);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta comisión?')) {
      try {
        await apiService.eliminarComision(id);
        await cargarComisiones();
      } catch (err) {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  const columns = [
    { Header: 'Lugar', accessor: 'lugar', width: '20%' },
    { Header: 'Ámbito', accessor: 'ambito_nombre', width: '20%' },
    { Header: 'Fecha Salida', accessor: 'fecha_salida', width: '15%' },
    { Header: 'Días', accessor: 'num_dias', align: 'center', width: '10%' },
    { Header: 'Total', accessor: 'costo_total_comision', align: 'right', width: '15%' },
    { Header: 'Estado', accessor: 'estado', width: '10%' },
    { Header: 'Acciones', accessor: 'acciones', align: 'center', width: '10%' },
  ];

  const rows = comisiones.map((comision) => ({
    ...comision,
    acciones: (
      <MDBox display="flex" gap={1} justifyContent="center">
        <MDButton
          variant="text"
          color="info"
          size="small"
          onClick={() => handleVer(comision.id)}
          title="Ver detalles"
        >
          <Icon fontSize="small">visibility</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="warning"
          size="small"
          onClick={() => handleEditar(comision.id)}
          title="Editar"
        >
          <Icon fontSize="small">edit</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="error"
          size="small"
          onClick={() => handleEliminar(comision.id)}
          title="Eliminar"
        >
          <Icon fontSize="small">delete</Icon>
        </MDButton>
      </MDBox>
    ),
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" fontWeight="bold">
            Gestión de Comisiones
          </MDTypography>
          <MDButton variant="gradient" color="success" onClick={handleNuevaComision}>
            <Icon fontSize="small" sx={{ mr: 1 }}>
              add
            </Icon>
            Nueva Comisión
          </MDButton>
        </MDBox>

        {error && (
          <Card sx={{ mb: 3, p: 2, backgroundColor: '#ffebee' }}>
            <MDTypography color="error">{error}</MDTypography>
          </Card>
        )}

        <Card>
          {loading ? (
            <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </MDBox>
          ) : comisiones.length === 0 ? (
            <MDBox p={3} textAlign="center">
              <MDTypography variant="body1" color="textSecondary">
                No hay comisiones registradas
              </MDTypography>
            </MDBox>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Lugar</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Ámbito</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fecha Salida</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Días</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Estado</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comisiones.map((comision) => (
                    <TableRow key={comision.id}>
                      <TableCell>{comision.lugar}</TableCell>
                      <TableCell>{comision.ambito_nombre || 'N/A'}</TableCell>
                      <TableCell>{new Date(comision.fecha_salida).toLocaleDateString()}</TableCell>
                      <TableCell align="center">{comision.num_dias}</TableCell>
                      <TableCell align="right">
                        S/ {comision.costo_total_comision?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comision.estado}
                          size="small"
                          color={
                            comision.estado === 'activa'
                              ? 'success'
                              : comision.estado === 'finalizada'
                              ? 'info'
                              : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <MDBox display="flex" gap={1} justifyContent="center">
                          <MDButton
                            variant="text"
                            color="info"
                            size="small"
                            onClick={() => handleVer(comision.id)}
                            title="Ver detalles"
                          >
                            <Icon fontSize="small">visibility</Icon>
                          </MDButton>
                          <MDButton
                            variant="text"
                            color="warning"
                            size="small"
                            onClick={() => handleEditar(comision.id)}
                            title="Editar"
                          >
                            <Icon fontSize="small">edit</Icon>
                          </MDButton>
                          <MDButton
                            variant="text"
                            color="error"
                            size="small"
                            onClick={() => handleEliminar(comision.id)}
                            title="Eliminar"
                          >
                            <Icon fontSize="small">delete</Icon>
                          </MDButton>
                        </MDBox>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ListarComisiones;
