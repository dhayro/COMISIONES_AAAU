import React, { useState, useEffect, useRef } from 'react';
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

function GestionClasificadores() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ partida: '', nombre: '', descripcion: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const partidaInputRef = useRef(null);

  useEffect(() => {
    cargarItems();
  }, []);

  const cargarItems = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.obtenerClasificadores();
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
      setFormData({ partida: item.partida, nombre: item.nombre, descripcion: item.descripcion });
    } else {
      setEditingId(null);
      setFormData({ partida: '', nombre: '', descripcion: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ partida: '', nombre: '', descripcion: '' });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.partida.trim() || !formData.nombre.trim()) {
      setError('La partida y nombre son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await api.actualizarClasificador(editingId, formData);
        setSuccess('Actualizado');
        handleCloseDialog();
        setItems(items.map((i) => (i.id === editingId ? { ...i, ...formData } : i)));
      } else {
        const response = await api.crearClasificador(formData);
        setSuccess('Creado');
        handleCloseDialog();
        const newItem = {
          id: response.id,
          partida: response.partida,
          nombre: response.nombre,
          descripcion: response.descripcion,
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
          await api.eliminarClasificador(id);
          setItems((prevItems) => prevItems.filter((i) => i.id !== id));
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El clasificador ha sido eliminado correctamente.',
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
            <MDTypography variant="h6" color="white">
              Gestión de Clasificadores
            </MDTypography>
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
                      { Header: 'ID', accessor: 'id', width: '8%' },
                      { Header: 'Partida', accessor: 'partida', width: '14%' },
                      { Header: 'Nombre', accessor: 'nombre', width: '40%' },
                      { Header: 'Descripción', accessor: 'descripcion', width: '20%' },
                      {
                        Header: 'Acciones',
                        accessor: 'acciones',
                        width: '18%',
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
                  isSorted={false}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries
                  noEndBorder
                />
              )}
              {loading && <CircularProgress />}
            </MDBox>
          </MDBox>
        </Card>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Editar Clasificador' : 'Nuevo Clasificador'}</DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              ref={partidaInputRef}
              autoFocus
              fullWidth
              label="Partida"
              value={formData.partida}
              onChange={(e) => setFormData({ ...formData, partida: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mt: 1, mb: 2 }}
              placeholder="Ej: 23.2.1.2.2"
            />
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              placeholder="Ej: PASAJES Y GASTOS DE TRANSPORTE"
            />
            <TextField
              fullWidth
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Describe el clasificador..."
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

export default GestionClasificadores;
