import React, { useState, useEffect } from 'react';
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
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

function GestionFuentesFinanciamiento() {
  const [fuentes, setFuentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    descripcion: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await api.obtenerFuentesFinanciamiento();
      setFuentes(response);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las fuentes de financiamiento',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fuente = null) => {
    if (fuente) {
      setEditingId(fuente.id);
      setFormData({
        nombre: fuente.nombre,
        abreviatura: fuente.abreviatura,
        descripcion: fuente.descripcion || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        abreviatura: '',
        descripcion: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      abreviatura: '',
      descripcion: '',
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre es requerido',
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
    if (!formData.abreviatura.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'La abreviatura es requerida',
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
        await api.actualizarFuenteFinanciamiento(editingId, formData);
        Swal.fire({
          icon: 'success',
          title: 'Fuente actualizada',
          text: 'La fuente de financiamiento ha sido actualizada correctamente.',
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
        await api.crearFuenteFinanciamiento(formData);
        Swal.fire({
          icon: 'success',
          title: 'Fuente creada',
          text: 'La fuente de financiamiento ha sido creada correctamente.',
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
        text: err.message || 'Error al guardar la fuente de financiamiento',
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
      title: '¿Eliminar fuente?',
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
          await api.eliminarFuenteFinanciamiento(id);
          Swal.fire({
            icon: 'success',
            title: 'Fuente eliminada',
            text: 'La fuente de financiamiento ha sido eliminada correctamente.',
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
            text: err.message || 'Error al eliminar la fuente de financiamiento',
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

  // Preparar datos para la tabla
  const rows = fuentes.map((fuente) => ({
    id: fuente.id,
    nombre: fuente.nombre,
    abreviatura: fuente.abreviatura,
    descripcion: fuente.descripcion || '-',
    acciones: (
      <MDBox display="flex" gap={1}>
        <Tooltip title="Editar">
          <IconButton size="small" color="info" onClick={() => handleOpenDialog(fuente)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => handleEliminar(fuente.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MDBox>
    ),
  }));

  const columns = [
    { Header: 'Nombre', accessor: 'nombre', width: '40%' },
    { Header: 'Abreviatura', accessor: 'abreviatura', width: '20%' },
    { Header: 'Descripción', accessor: 'descripcion', width: '30%' },
    { Header: 'Acciones', accessor: 'acciones', align: 'center', width: '10%' },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
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
              Gestión de Fuentes de Financiamiento
            </MDTypography>
            <MDButton
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 2 }}
            >
              Nueva Fuente
            </MDButton>
          </MDBox>

          <MDBox pt={3} px={2} pb={2}>
            {loading ? (
              <CircularProgress />
            ) : (
              <DataTable
                table={{ columns, rows }}
                isSorted={false}
                entriesPerPage={false}
                showTotalEntries={false}
                noEndBorder
              />
            )}
          </MDBox>
        </Card>
      </MDBox>

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Fuente de Financiamiento' : 'Nueva Fuente de Financiamiento'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            autoFocus
            placeholder="Ej: Recursos Ordinarios"
            sx={{
              mt: 1,
              mb: 2,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Abreviatura"
            name="abreviatura"
            value={formData.abreviatura}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            placeholder="Ej: R.O"
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            multiline
            rows={3}
            placeholder="Descripción de la fuente de financiamiento"
            sx={{
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <MDButton variant="outlined" color="secondary" onClick={handleCloseDialog}>
            Cancelar
          </MDButton>
          <MDButton variant="contained" color="info" onClick={handleGuardar}>
            Guardar
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default GestionFuentesFinanciamiento;
