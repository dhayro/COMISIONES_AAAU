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

function GestionCargos() {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await api.obtenerCargos();
      setCargos(response);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los cargos',
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

  const handleOpenDialog = (cargo = null) => {
    if (cargo) {
      setEditingId(cargo.id);
      setFormData({
        nombre: cargo.nombre,
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
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
        text: 'El nombre del cargo es requerido',
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
        await api.actualizarCargo(editingId, formData);
        Swal.fire({
          icon: 'success',
          title: 'Cargo actualizado',
          text: 'El cargo ha sido actualizado correctamente.',
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
        await api.crearCargo(formData);
        Swal.fire({
          icon: 'success',
          title: 'Cargo creado',
          text: 'El cargo ha sido creado correctamente.',
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
        text: err.message || 'Error al guardar el cargo',
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
      title: '¿Eliminar cargo?',
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
          await api.eliminarCargo(id);
          Swal.fire({
            icon: 'success',
            title: 'Cargo eliminado',
            text: 'El cargo ha sido eliminado correctamente.',
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
            text: err.message || 'Error al eliminar el cargo',
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
  const rows = cargos.map((cargo) => ({
    id: cargo.id,
    nombre: cargo.nombre,
    acciones: (
      <MDBox display="flex" gap={1}>
        <Tooltip title="Editar">
          <IconButton size="small" color="info" onClick={() => handleOpenDialog(cargo)}
      sx={{ backgroundColor: '#e3f2fd', '&:hover': { backgroundColor: '#bbdefb' } }}
    >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => handleEliminar(cargo.id)}
      sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
    >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MDBox>
    ),
  }));

  const columns = [
    { Header: 'Nombre', accessor: 'nombre', width: '80%' },
    { Header: 'Acciones', accessor: 'acciones', disableSortBy: true, align: 'center', width: '20%' },
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
            <MDBox>
              <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
                Gestión de Cargos
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Administre los cargos del personal.
              </MDTypography>
            </MDBox>
            <MDButton
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 2 }}
            >
              Nuevo Cargo
            </MDButton>
          </MDBox>

          <MDBox pt={3} px={2} pb={2}>
            {loading ? (
              <CircularProgress />
            ) : (
              <DataTable
                table={{ columns, rows }}
                isSorted={true}
                canSearch
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries
                noEndBorder
                vistaMovil
              />
            )}
          </MDBox>
        </Card>
      </MDBox>

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Cargo' : 'Nuevo Cargo'}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            fullWidth
            label="Nombre del Cargo"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            autoFocus
            placeholder="Ej: Gerente"
            sx={{
              mt: 1,
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

export default GestionCargos;
