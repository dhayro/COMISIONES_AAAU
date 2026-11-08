import React, { useState, useEffect } from 'react';
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Card,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';

function GestionCostosViaje() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', costo: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.obtenerCostosViaje();
      setItems(response);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ nombre: item.nombre, costo: item.costo });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', costo: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ nombre: '', costo: '' });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim() || !formData.costo) {
      setError('El nombre y costo son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await api.actualizarCostoViaje(editingId, {
          nombre: formData.nombre,
          costo: parseFloat(formData.costo),
        });
        setSuccess('Actualizado');
        handleCloseDialog();
        setItems(
          items.map((i) =>
            i.id === editingId ? { ...i, ...formData, costo: parseFloat(formData.costo) } : i
          )
        );
      } else {
        const response = await api.crearCostoViaje({
          nombre: formData.nombre,
          costo: parseFloat(formData.costo),
        });
        setSuccess('Creado');
        handleCloseDialog();
        const newItem = {
          id: response.id,
          nombre: response.nombre,
          costo: response.costo,
        };
        setItems((prevItems) => [...prevItems, newItem]);
      }
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
          await api.eliminarCostoViaje(id);
          setItems((prevItems) => prevItems.filter((i) => i.id !== id));
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El costo de viaje ha sido eliminado correctamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
        } catch (err) {
          Swal.fire({
            title: 'Error',
            text: err.message,
            icon: 'error',
            confirmButtonColor: '#3085d6',
          });
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

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
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <MDBox>
              <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
                Gestión de Costos de Viaje
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Administre los costos de viaje por tipo de gasto.
              </MDTypography>
            </MDBox>
            <MDButton
              variant="contained"
              color="white"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 2 }}
            >
              Nuevo
            </MDButton>
          </MDBox>
          <MDBox pt={3} px={2} pb={2}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <MDBox>
              {!loading && (
                <DataTable
                  table={{
                    columns: [
                      { Header: 'Item', accessor: 'item', disableSortBy: true, width: '10%', Cell: ({ row }) => row.index + 1 },
                      { Header: 'Nombre', accessor: 'nombre', width: '50%' },
                      {
                        Header: 'Costo',
                        accessor: (row) => `${parseFloat(row.costo).toFixed(2)}`,
                        width: '20%',
                      },
                      {
                        Header: 'Acciones',
                        accessor: 'acciones',
                        disableSortBy: true,
                        width: '20%',
                        // eslint-disable-next-line react/prop-types
                        Cell: ({ row }) => {
                          // eslint-disable-next-line react/prop-types
                          return (
                            <MDBox display="flex" justifyContent="flex-end" gap={0.5}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  color="info"
                                  // eslint-disable-next-line react/prop-types
                                  onClick={() => handleOpenDialog(row.original)}
                                  sx={{
                                    backgroundColor: '#e3f2fd',
                                    '&:hover': { backgroundColor: '#bbdefb' },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  // eslint-disable-next-line react/prop-types
                                  onClick={() => handleEliminar(row.original.id)}
                                  sx={{
                                    backgroundColor: '#ffebee',
                                    '&:hover': { backgroundColor: '#ffcdd2' },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </MDBox>
                          );
                        },
                      },
                    ],
                    rows: items,
                  }}
                  canSearch
                  isSorted={true}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries
                  noEndBorder
                  vistaMovil
                />
              )}
              {loading && <CircularProgress />}
            </MDBox>
          </MDBox>
        </Card>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Editar Costo de Viaje' : 'Nuevo Costo de Viaje'}</DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mt: 1, mb: 2 }}
              placeholder="Ej: Dentro del ámbito"
            />
            <TextField
              fullWidth
              label="Costo"
              type="number"
              inputProps={{ step: '0.01' }}
              value={formData.costo}
              onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
              variant="outlined"
              size="small"
              placeholder="Ej: 220.00"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancelar
            </Button>
            <MDButton variant="contained" color="info" onClick={handleGuardar} disabled={loading}>
              Guardar
            </MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GestionCostosViaje;
