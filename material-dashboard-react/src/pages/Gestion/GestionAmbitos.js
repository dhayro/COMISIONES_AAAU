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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';

function GestionAmbitos() {
  const [ambitos, setAmbitos] = useState([]);
  const [ambitosAAA, setAmbitosAAA] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAAA, setSelectedAAA] = useState(null);
  const [formData, setFormData] = useState({
    nombre_corto: '',
    nombre_largo: '',
    dependencia_id: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarAmbitos();
  }, []);

  const cargarAmbitos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.obtenerAmbitos();
      setAmbitos(response);
      const aaas = response.filter((a) => !a.dependencia_id);
      setAmbitosAAA(aaas);
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAlasForAAA = (aaaId) => {
    return ambitos.filter((a) => a.dependencia_id === aaaId);
  };

  const handleOpenDialog = (ambito = null) => {
    if (ambito) {
      setEditingId(ambito.id);
      setFormData({
        nombre_corto: ambito.nombre_corto,
        nombre_largo: ambito.nombre_largo,
        dependencia_id: ambito.dependencia_id || null,
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre_corto: '',
        nombre_largo: '',
        dependencia_id: selectedAAA,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      nombre_corto: '',
      nombre_largo: '',
      dependencia_id: null,
    });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.nombre_corto.trim() || !formData.nombre_largo.trim()) {
      setError('Los campos nombre corto y nombre largo son requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await api.actualizarAmbito(editingId, formData);
        setSuccess('Actualizado correctamente');
      } else {
        await api.crearAmbito(formData);
        setSuccess('Creado correctamente');
      }
      handleCloseDialog();
      await cargarAmbitos();
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
          await api.eliminarAmbito(id);
          await cargarAmbitos();
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El ámbito ha sido eliminado correctamente.',
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
                Gestión de Ámbitos
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Administre los ámbitos y sus datos de referencia.
              </MDTypography>
            </MDBox>
            <MDButton
              variant="contained"
              color="white"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedAAA(null);
                handleOpenDialog();
              }}
              sx={{ ml: 2 }}
            >
              Agregar Ámbito
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
              <>
                <DataTable
                  table={{
                    columns: [
                      {
                        Header: 'Expandir',
                        accessor: 'expand',
                        width: '10%',
                        disableSortBy: true,
                        // eslint-disable-next-line react/prop-types
                        Cell: ({ row }) => (
                          <IconButton
                            size="small"
                            onClick={() =>
                              setSelectedAAA(
                                // eslint-disable-next-line react/prop-types
                                selectedAAA === row.original.id
                                  ? null
                                  : // eslint-disable-next-line react/prop-types
                                    row.original.id
                              )
                            }
                          >
                            {selectedAAA ===
                            // eslint-disable-next-line react/prop-types
                            row.original.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        ),
                      },
                      { Header: 'Item', accessor: 'item', disableSortBy: true, width: '10%', Cell: ({ row }) => row.index + 1 },
                      { Header: 'Nombre Corto', accessor: 'nombre_corto', width: '25%' },
                      { Header: 'Nombre Largo', accessor: 'nombre_largo', width: '40%' },
                      {
                        Header: 'Acciones',
                        accessor: 'acciones',
                        disableSortBy: true,
                        width: '15%',
                        disableSortBy: true,
                        // eslint-disable-next-line react/prop-types
                        Cell: ({ row }) => (
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
                        ),
                      },
                    ],
                    rows: ambitosAAA,
                  }}
                  canSearch
                  isSorted={true}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries
                  noEndBorder
                  vistaMovil
                />

                {selectedAAA && (
                  <MDBox sx={{ mt: 3, mb: 3 }}>
                    <Card>
                      <MDBox
                        mx={2}
                        mt={-3}
                        py={2}
                        px={2}
                        variant="gradient"
                        bgColor="info"
                        borderRadius="lg"
                        coloredShadow="info"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <MDTypography variant="subtitle2" color="white">
                          ALAs de {ambitosAAA.find((a) => a.id === selectedAAA)?.nombre_corto}
                        </MDTypography>
                        <MDButton
                          size="small"
                          variant="contained"
                          color="white"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setFormData({
                              nombre_corto: '',
                              nombre_largo: '',
                              dependencia_id: selectedAAA,
                            });
                            setEditingId(null);
                            setOpenDialog(true);
                          }}
                        >
                          Agregar ALA
                        </MDButton>
                      </MDBox>

                      <MDBox pt={3} px={2} pb={2}>
                        {getAlasForAAA(selectedAAA).length > 0 ? (
                          <DataTable
                            table={{
                              columns: [
                                { Header: 'ID', accessor: 'id', width: '15%' },
                                {
                                  Header: 'Nombre Corto',
                                  accessor: 'nombre_corto',
                                  width: '30%',
                                },
                                {
                                  Header: 'Nombre Largo',
                                  accessor: 'nombre_largo',
                                  width: '40%',
                                },
                                {
                                  Header: 'Acciones',
                                  accessor: 'acciones',
                                  disableSortBy: true,
                                  width: '15%',
                                  disableSortBy: true,
                                  // eslint-disable-next-line react/prop-types
                                  Cell: ({ row }) => (
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
                                  ),
                                },
                              ],
                              rows: getAlasForAAA(selectedAAA),
                            }}
                            canSearch
                            isSorted={false}
                            entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                            showTotalEntries
                            noEndBorder
                            vistaMovil
                          />
                        ) : (
                          <MDTypography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                            Sin ALAs registradas. Haz clic en &quot;Agregar ALA&quot; para crear
                            una.
                          </MDTypography>
                        )}
                      </MDBox>
                    </Card>
                  </MDBox>
                )}
              </>
            )}
          </MDBox>
        </Card>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingId ? 'Editar Ámbito' : selectedAAA ? 'Nuevo ALA' : 'Nuevo AAA'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Nombre Corto"
              value={formData.nombre_corto}
              onChange={(e) => setFormData({ ...formData, nombre_corto: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mt: 1, mb: 2 }}
              placeholder="Ej: UCAYALI o PUCALLPA"
            />
            <TextField
              fullWidth
              label="Nombre Largo"
              value={formData.nombre_largo}
              onChange={(e) => setFormData({ ...formData, nombre_largo: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              placeholder="Ej: AAA UCAYALI o ALA PUCALLPA"
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

export default GestionAmbitos;
