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
  Alert,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';

function GestionCorrelativos() {
  const [correlativos, setCorrelativos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    usuario_id: '',
    ano: new Date().getFullYear(),
    numero_inicial: 1,
    numero_proximo: 1,
    prefijo: '',
    descripcion: '',
  });

  useEffect(() => {
    cargarDatos();
    cargarUsuarios();
  }, []);

  const cargarDatos = async (usuarioId = '') => {
    setLoading(true);
    try {
      // Cargar TODOS los correlativo sin filtro - DataTable hará el filtro
      const response = await api.get('/formato-emisiones/correlativo-control/lista');
      // response.data contiene el objeto con propiedades: message, data, total
      setCorrelativos(response.data || []);
    } catch (error) {
      console.error('Error al cargar correlativos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los controles de correlativo',
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

  const cargarUsuarios = async () => {
    try {
      const response = await api.obtenerUsuarios();
      setUsuarios(response || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleOpenDialog = (correlativo = null) => {
    if (correlativo) {
      setEditingId(correlativo.id);
      setFormData({
        usuario_id: correlativo.usuario_id,
        ano: correlativo.ano,
        numero_inicial: correlativo.numero_inicial,
        numero_proximo: correlativo.numero_proximo,
        prefijo: correlativo.prefijo || '',
        descripcion: correlativo.descripcion || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        usuario_id: '',
        ano: new Date().getFullYear(),
        numero_inicial: 1,
        numero_proximo: 1,
        prefijo: '',
        descripcion: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      usuario_id: '',
      ano: new Date().getFullYear(),
      numero_inicial: 1,
      numero_proximo: 1,
      prefijo: '',
      descripcion: '',
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'ano' || name === 'numero_inicial' || name === 'numero_proximo') ? parseInt(value) : value,
    }));
  };

  const handleGuardar = async () => {
    if (!formData.usuario_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El usuario es requerido',
        toast: true,
        position: 'top-end',
      });
      return;
    }

    if (!formData.ano) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El año es requerido',
        toast: true,
        position: 'top-end',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/formato-emisiones/correlativo-control/${editingId}`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Control de correlativo actualizado correctamente',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        await api.post('/formato-emisiones/correlativo-control/', formData);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Control de correlativo creado correctamente',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      }
      handleCloseDialog();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      const mensaje = error.response?.data?.error || 'Error al guardar el control de correlativo';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        toast: true,
        position: 'top-end',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await api.delete(`/formato-emisiones/correlativo-control/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Control de correlativo eliminado correctamente',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el control de correlativo',
          toast: true,
          position: 'top-end',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerarCorrelativosAuto = async () => {
    const result = await Swal.fire({
      title: '¿Generar Correlativo automáticamente?',
      text: 'Se crearán controles de correlativo para TODOS los usuarios del año actual',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await api.post('/formato-emisiones/correlativo-control/generar/auto');
        
        Swal.fire({
          icon: 'success',
          title: '✅ Éxito',
          html: `<p><strong>${response.creados}</strong> correlativos creados</p>
                 <p><strong>${response.actualizados}</strong> ya existían</p>
                 <p><strong>Total usuarios:</strong> ${response.total_usuarios}</p>`,
          showConfirmButton: true,
        });
        
        cargarDatos();
      } catch (error) {
        console.error('Error al generar correlativos:', error);
        const mensaje = error.response?.data?.error || 'Error al generar los correlativos';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje,
          toast: true,
          position: 'top-end',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const tableData = correlativos.map((correlativo) => ({
    ...correlativo,
    acciones: 'acciones',
  }));

  const usuarioNombre = (usuarioId) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    return usuario ? usuario.nombre : `Usuario ${usuarioId}`;
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={3} px={2} pb={2}>
        <Card>
          <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
            <MDBox>
              <MDTypography variant="h5" fontWeight="bold" mb={1}>
                🔢 Gestión de Controles de Correlativo
              </MDTypography>
              <MDTypography variant="body2" color="textSecondary">
                Configura el número inicial de correlativo por usuario y año
              </MDTypography>
            </MDBox>
            <MDBox display="flex" gap={1}>
              <MDButton
                variant="gradient"
                color="warning"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleGenerarCorrelativosAuto}
                disabled={loading}
              >
                Generar Automáticamente
              </MDButton>
              <MDButton
                variant="gradient"
                color="info"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={loading}
              >
                Nuevo Correlativo
              </MDButton>
            </MDBox>
          </MDBox>

          <MDBox pt={3} px={2} pb={2}>
            {loading ? (
              <CircularProgress />
            ) : correlativos.length === 0 ? (
              <Alert severity="info">
                No hay controles de correlativo. ¡Crea uno nuevo para comenzar!
              </Alert>
            ) : (
              <DataTable
                table={{
                  columns: [
                    { Header: 'ID', accessor: 'id', width: '8%' },
                    {
                      Header: 'Usuario',
                      accessor: (row) => usuarioNombre(row.usuario_id),
                      width: '22%',
                    },
                    { Header: 'Año', accessor: 'ano', width: '10%' },
                    { Header: 'Número Inicial', accessor: 'numero_inicial', width: '14%' },
                    { Header: 'Próximo Número', accessor: 'numero_proximo', width: '14%' },
                    { Header: 'Prefijo', accessor: 'prefijo', width: '14%' },
                    { Header: 'Descripción', accessor: 'descripcion', width: '18%' },
                    {
                      Header: 'Acciones',
                      accessor: 'acciones',
                      width: '14%',
                      disableSortBy: true,
                      // eslint-disable-next-line react/prop-types
                      Cell: ({ row }) => (
                        <MDBox display="flex" justifyContent="flex-end" gap={0.5}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(row.original)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleEliminar(row.original.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </MDBox>
                      ),
                    },
                  ],
                  rows: tableData,
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
      </MDBox>

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Control de Correlativo' : 'Crear Nuevo Control de Correlativo'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Autocomplete
            options={usuarios}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : `${option.nombre || ''}`
            }
            value={usuarios.find((u) => u.id === formData.usuario_id) || null}
            onChange={(event, newValue) => {
              setFormData({
                ...formData,
                usuario_id: newValue?.id || '',
              });
            }}
            disabled={!!editingId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Usuario"
                placeholder="Buscar usuario..."
                margin="normal"
                required
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <div>
                  <div style={{ fontWeight: 500 }}>{option.nombre}</div>
                </div>
              </li>
            )}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Año"
            name="ano"
            type="number"
            value={formData.ano}
            onChange={handleInputChange}
            disabled={!!editingId}
            inputProps={{ min: 2000, max: 2100 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Número Inicial"
            name="numero_inicial"
            type="number"
            value={formData.numero_inicial}
            onChange={handleInputChange}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Próximo Número"
            name="numero_proximo"
            type="number"
            value={formData.numero_proximo}
            onChange={handleInputChange}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Prefijo (Opcional)"
            name="prefijo"
            value={formData.prefijo}
            onChange={handleInputChange}
            placeholder="Ej: AAA, BBB"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Descripción (Opcional)"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            multiline
            rows={2}
            placeholder="Ej: Correlativo para comisiones 2026"
          />
        </DialogContent>
        <DialogActions>
          <MDButton color="secondary" onClick={handleCloseDialog}>
            Cancelar
          </MDButton>
          <MDButton color="info" onClick={handleGuardar} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default GestionCorrelativos;
