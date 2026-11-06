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
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [ambitos, setAmbitos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    username: '',
    dni: '',
    rol: 'usuario',
    ambito_id: null,
    cargo_id: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar solo usuarios (ya vienen con ambito_nombre del join)
      const usuariosRes = await api.obtenerUsuarios();
      setUsuarios(usuariosRes);

      // Cargar cargos
      const cargosRes = await api.obtenerCargos();
      setCargos(cargosRes);
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

  const handleOpenDialog = (usuario = null) => {
    // Cargar ámbitos cuando se abre el modal
    cargarAmbitos();

    if (usuario) {
      setEditingId(usuario.id);
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        username: usuario.username,
        dni: usuario.dni || '',
        rol: usuario.rol,
        ambito_id: usuario.ambito_id || null,
        cargo_id: usuario.cargo_id || null,
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        email: '',
        username: '',
        dni: '',
        rol: 'usuario',
        ambito_id: null,
        cargo_id: null,
      });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre: '',
      email: '',
      username: '',
      dni: '',
      rol: 'usuario',
      ambito_id: null,
      cargo_id: null,
    });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim() || !formData.email.trim() || !formData.username.trim()) {
      setError('Nombre, email y usuario son requeridos');
      return;
    }

    if (!formData.ambito_id) {
      setError('Debe seleccionar un ámbito');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await api.actualizarUsuario(editingId, formData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        const respuesta = await api.crearUsuario(formData);
        setSuccess(`Usuario creado correctamente. Contraseña temporal: ${respuesta.password_temporal}`);
      }
      handleCloseDialog();
      await cargarDatos();
      setTimeout(() => setSuccess(''), 5000);
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
        try {
          await api.eliminarUsuario(id);
          await cargarDatos();
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El usuario ha sido eliminado correctamente.',
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

  const handleResetearPassword = async (id) => {
    Swal.fire({
      title: '¿Resetear contraseña?',
      text: 'Se generará una contraseña temporal. El usuario deberá cambiarla al ingresar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const respuesta = await api.resetearPasswordUsuario(id);
          Swal.fire({
            title: '¡Hecho!',
            text: `Contraseña temporal: ${respuesta.password_temporal}`,
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
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getNombreAmbito = (ambitoId) => {
    const ambito = ambitos.find((a) => a.id === ambitoId);
    return ambito ? ambito.nombre_corto : 'Sin ámbito';
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
              Gestión de Usuarios
            </MDTypography>
            <MDButton
              variant="contained"
              color="white"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ ml: 2 }}
            >
              Nuevo Usuario
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

            {loading ? (
              <CircularProgress />
            ) : (
              <DataTable
                table={{
                  columns: [
                    { Header: 'ID', accessor: 'id', width: '6%' },
                    { Header: 'Nombre', accessor: 'nombre', width: '18%' },
                    { Header: 'Usuario', accessor: 'username', width: '16%' },
                    { Header: 'DNI', accessor: 'dni', width: '12%' },
                    { Header: 'Email', accessor: 'email', width: '20%' },
                    { Header: 'Rol', accessor: 'rol', width: '10%' },
                    {
                      Header: 'Cargo',
                      accessor: (row) => row.cargo_nombre || 'Sin cargo',
                      width: '12%',
                    },
                    {
                      Header: 'Ámbito',
                      accessor: (row) => row.ambito_nombre || 'Sin ámbito',
                      width: '11%',
                    },
                    {
                      Header: 'Acciones',
                      accessor: 'acciones',
                      width: '6%',
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
                          <Tooltip title="Resetear contraseña">
                            <IconButton
                              size="small"
                              color="warning"
                              // eslint-disable-next-line react/prop-types
                              onClick={() => handleResetearPassword(row.original.id)}
                              sx={{
                                backgroundColor: '#fff3e0',
                                '&:hover': { backgroundColor: '#ffe0b2' },
                              }}
                            >
                              <LockResetIcon fontSize="small" />
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
                  rows: usuarios,
                }}
                canSearch
                isSorted={false}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries
                noEndBorder
              />
            )}
          </MDBox>
        </Card>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
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
              placeholder="Ej: Juan Pérez"
            />
            <TextField
              fullWidth
              label="Usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              placeholder="Ej: jperez"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              placeholder="Ej: juan@example.com"
            />
            <TextField
              fullWidth
              label="DNI"
              value={formData.dni}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                setFormData({ ...formData, dni: value });
              }}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              placeholder="Ej: 12345678"
              inputProps={{ maxLength: 8, pattern: '[0-9]*' }}
            />
            <TextField
              fullWidth
              label="Rol"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              select
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="jefe">Jefe</MenuItem>
              <MenuItem value="usuario">Usuario</MenuItem>
              <MenuItem value="administrativo">Administrativo</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Cargo"
              value={formData.cargo_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cargo_id: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              select
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Seleccionar cargo...</MenuItem>
              {cargos.map((cargo) => (
                <MenuItem key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Ámbito"
              value={formData.ambito_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ambito_id: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              select
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Seleccionar ámbito...</MenuItem>
              {ambitos.map((ambito) => (
                <MenuItem key={ambito.id} value={ambito.id}>
                  {ambito.nombre_corto} - {ambito.nombre_largo}
                </MenuItem>
              ))}
            </TextField>
            {!editingId && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Se generará una <strong>contraseña temporal</strong> que se mostrará al crear el usuario.
              </Alert>
            )}
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

export default GestionUsuarios;
