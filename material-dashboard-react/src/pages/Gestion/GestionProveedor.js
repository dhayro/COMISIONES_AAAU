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
  Button,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import decolectaService from 'services/decolecta';

function GestionProveedor() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchingRuc, setSearchingRuc] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await api.obtenerProveedores();
      // La respuesta es directamente un array de proveedores transformados
      const datos = Array.isArray(response) ? response : [];
      setProveedores(datos);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los proveedores',
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

  const handleBuscarRUC = async () => {
    const inputValue = formData.ruc.trim();
    
    if (!inputValue || inputValue === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Ingresa un RUC o DNI para buscar',
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

    setSearchingRuc(true);
    try {
      const resultado = await decolectaService.consultarNumero(formData.ruc);

      if (!resultado.success) {
        Swal.fire({
          icon: 'warning',
          title: 'No encontrado',
          text: resultado.error || 'No se encontraron datos para este número',
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

      const { data } = resultado;

      // Determinar si es empresa o persona
      if (data.nombres) {
        // Es persona (DNI)
        setFormData((prev) => ({
          ...prev,
          nombre: data.nombre_completo,
        }));
      } else {
        // Es empresa (RUC)
        setFormData((prev) => ({
          ...prev,
          nombre: data.nombre,
          ruc: data.ruc,
          direccion: data.direccion || '',
        }));
      }

      Swal.fire({
        icon: 'success',
        title: 'Datos encontrados',
        text: 'Los datos se han completado automáticamente',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error en búsqueda',
        text: error.message || 'Error al consultar datos',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    } finally {
      setSearchingRuc(false);
    }
  };

  const handleOpenDialog = (proveedor = null) => {
    if (proveedor) {
      setEditingId(proveedor.id);
      setFormData({
        nombre: proveedor.nombre,
        ruc: proveedor.ruc || '',
        direccion: proveedor.direccion || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
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
        text: 'El nombre del proveedor es requerido',
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
        await api.actualizarProveedor(editingId, formData);
        Swal.fire({
          icon: 'success',
          title: 'Proveedor actualizado',
          text: 'El proveedor ha sido actualizado correctamente.',
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
        await api.crearProveedor(formData);
        Swal.fire({
          icon: 'success',
          title: 'Proveedor creado',
          text: 'El proveedor ha sido creado correctamente.',
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
        text: err.message || 'Error al guardar el proveedor',
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
      title: '¿Eliminar proveedor?',
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
          await api.eliminarProveedor(id);
          Swal.fire({
            icon: 'success',
            title: 'Proveedor eliminado',
            text: 'El proveedor ha sido eliminado correctamente.',
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
            text: err.message || 'Error al eliminar el proveedor',
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
  const rows = proveedores.map((proveedor) => ({
    id: proveedor.id,
    nombre: proveedor.nombre,
    ruc: proveedor.ruc,
    direccion: proveedor.direccion,
    email: proveedor.email,
    telefono: proveedor.telefono,
    acciones: (
      <MDBox display="flex" gap={1}>
        <Tooltip title="Editar">
          <IconButton size="small" color="info" onClick={() => handleOpenDialog(proveedor)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => handleEliminar(proveedor.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MDBox>
    ),
  }));

  const columns = [
    { Header: 'Nombre', accessor: 'nombre', width: '25%' },
    { Header: 'RUC/DNI', accessor: 'ruc', width: '12%' },
    { Header: 'Dirección', accessor: 'direccion', width: '25%' },
    { Header: 'Email', accessor: 'email', width: '18%' },
    { Header: 'Teléfono', accessor: 'telefono', width: '12%' },
    { Header: 'Acciones', accessor: 'acciones', align: 'center', width: '8%' },
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
              Gestión de Proveedores
            </MDTypography>
            <MDButton
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 2 }}
            >
              Nuevo Proveedor
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
        <DialogTitle>{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {/* Búsqueda por RUC/DNI - solo en creación */}
          {!editingId && (
            <Box sx={{ display: 'flex', gap: 1, mb: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
              <TextField
                fullWidth
                label="Buscar por RUC o DNI"
                name="rucSearch"
                value={formData.ruc}
                onChange={(e) => setFormData((prev) => ({ ...prev, ruc: e.target.value }))}
                variant="outlined"
                size="small"
                placeholder="RUC (11 dígitos) o DNI (8 dígitos)"
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleBuscarRUC}
                disabled={searchingRuc}
                sx={{ 
                  minWidth: '120px',
                  color: '#fff',
                  backgroundColor: '#0066cc',
                  '&:hover': {
                    backgroundColor: '#0052a3',
                  },
                  '&:disabled': {
                    color: '#fff',
                    backgroundColor: '#999',
                  },
                }}
              >
                {searchingRuc ? 'Buscando...' : 'Buscar'}
              </Button>
            </Box>
          )}

          {/* Campos del formulario */}
          <TextField
            fullWidth
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            autoFocus
            placeholder="Ej: Empresa XYZ"
            sx={{
              mt: 1,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
          <TextField
            fullWidth
            label="RUC"
            name="ruc"
            value={formData.ruc}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            placeholder="20123456789"
            disabled={!editingId}
            sx={{
              mt: 2,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            multiline
            rows={2}
            placeholder="Dirección del proveedor"
            sx={{
              mt: 2,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            placeholder="999999999"
            sx={{
              mt: 2,
              '& .MuiInputLabel-root': {
                zIndex: 10,
                top: '-2px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            placeholder="contacto@empresa.com"
            sx={{
              mt: 2,
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

export default GestionProveedor;
