import React, { useState, useEffect } from 'react';
import {
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
  MenuItem,
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

function GestionMetas() {
  const [metas, setMetas] = useState([]);
  const [ambitos, setAmbitos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    numero_meta: '',
    periodo: '',
    ambito_id: null,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar solo metas (ya vienen con ambito_nombre del join)
      const metasRes = await api.obtenerMetas();
      setMetas(metasRes);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarAmbitos = async () => {
    try {
      const ambitosRes = await api.obtenerAmbitos();
      setAmbitos(ambitosRes);
    } catch (err) {
      setError('Error al cargar ámbitos: ' + err.message);
    }
  };

  const handleOpenDialog = (meta = null) => {
    // Cargar ámbitos cuando se abre el modal
    cargarAmbitos();

    if (meta) {
      setEditingId(meta.id);
      setFormData({
        nombre: meta.nombre,
        numero_meta: meta.numero_meta,
        periodo: meta.periodo,
        ambito_id: meta.ambito_id || null,
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        numero_meta: '',
        periodo: '',
        ambito_id: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      numero_meta: '',
      periodo: '',
      ambito_id: null,
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validación para período: solo números y máximo 4 dígitos
    if (name === 'periodo') {
      const valorLimpio = value.replace(/\D/g, ''); // Remover no-números
      const limitado = valorLimpio.slice(0, 4); // Máximo 4 dígitos
      setFormData((prev) => ({
        ...prev,
        [name]: limitado,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre de la meta es requerido',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }
    if (!formData.numero_meta.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El número de meta es requerido',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }
    if (!formData.periodo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El período es requerido',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }

    try {
      if (editingId) {
        // Actualizar
        await api.actualizarMeta(editingId, formData);
        Swal.fire({
          icon: 'success',
          title: 'Meta actualizada',
          text: 'La meta ha sido actualizada correctamente.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          didOpen: (toast) => {
            toast.style.zIndex = 9999;
          },
        });
      } else {
        // Crear
        await api.crearMeta(formData);
        Swal.fire({
          icon: 'success',
          title: 'Meta creada',
          text: 'La meta ha sido creada correctamente.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          didOpen: (toast) => {
            toast.style.zIndex = 9999;
          },
        });
      }

      handleCloseDialog();
      cargarDatos();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al guardar la meta',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    }
  };

  const handleEliminar = (id) => {
    Swal.fire({
      title: '¿Eliminar meta?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.eliminarMeta(id);
          Swal.fire({
            icon: 'success',
            title: 'Meta eliminada',
            text: 'La meta ha sido eliminada correctamente.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            didOpen: (toast) => {
              toast.style.zIndex = 9999;
            },
          });
          cargarDatos();
        } catch (err) {
          Swal.fire({
            title: 'Error',
            text: err.message || 'Error al eliminar la meta',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            didOpen: (toast) => {
              toast.style.zIndex = 9999;
            },
          });
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
                Gestión de Metas
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Administre las metas presupuestarias.
              </MDTypography>
            </MDBox>
            <MDButton
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 2 }}
            >
              Nueva Meta
            </MDButton>
          </MDBox>

          <MDBox pt={3} px={2} pb={2}>
            {loading ? (
              <CircularProgress />
            ) : (
              <DataTable
                table={{
                  columns: [
                    { Header: 'Item', accessor: 'item', disableSortBy: true, width: '8%', Cell: ({ row }) => row.index + 1 },
                    { Header: 'Nombre', accessor: 'nombre', width: '30%' },
                    { Header: 'Número', accessor: 'numero_meta', width: '15%' },
                    { Header: 'Período', accessor: 'periodo', width: '15%' },
                    {
                      Header: 'Ámbito',
                      accessor: (row) => row.ambito_nombre || 'Sin ámbito',
                      width: '18%',
                    },
                    {
                      Header: 'Acciones',
                      accessor: 'acciones',
                      disableSortBy: true,
                      width: '14%',
                      disableSortBy: true,
                      // eslint-disable-next-line react/prop-types
                      Cell: ({ row }) => (
                        <MDBox display="flex" justifyContent="flex-end" gap={0.2}>
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
                      ),
                    },
                  ],
                  rows: metas,
                }}
                canSearch
                isSorted={true}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries
                vistaMovil
              />
            )}
          </MDBox>
        </Card>
      </MDBox>

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Meta' : 'Nueva Meta'}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Nombre de la Meta"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            sx={{ mt: 1, mb: 2 }}
            placeholder="Ej: Meta Local - Autoridad Local de Agua"
          />
          <TextField
            fullWidth
            label="Número de Meta"
            name="numero_meta"
            value={formData.numero_meta}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
            placeholder="Ej: 067"
          />
          <TextField
            fullWidth
            label="Período"
            name="periodo"
            value={formData.periodo}
            onChange={handleInputChange}
            inputProps={{ maxLength: 4 }}
            variant="outlined"
            size="small"
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
            placeholder="Ej: 2026"
          />
          <TextField
            fullWidth
            select
            label="Ámbito"
            name="ambito_id"
            value={formData.ambito_id || ''}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
          >
            <MenuItem value="">Sin ámbito</MenuItem>
            {ambitos.map((ambito) => (
              <MenuItem key={ambito.id} value={ambito.id}>
                {ambito.nombre_corto}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <MDButton variant="contained" color="info" onClick={handleGuardar}>
            {editingId ? 'Actualizar' : 'Crear'}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default GestionMetas;
