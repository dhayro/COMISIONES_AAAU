import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import apiService from 'services/api';

function Comisiones() {
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    ambito: '',
    lugar: '',
    fecha_inicio: '',
    fecha_fin: '',
    comisionados: '',
    actividades: '',
    dias: '',
    costo_xdia: '',
    costo_pasajes_nacional: '',
    costo_pasajes_local: '',
    costo_combustible: '',
    costo_comision_por_comisionado: '',
    costo_total_comision: '',
    observacion: '',
  });

  useEffect(() => {
    cargarComisiones();
  }, []);

  const cargarComisiones = async () => {
    try {
      setLoading(true);
      const response = await apiService.obtenerComisiones();
      setComisiones(response.comisiones);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialog = (comision = null) => {
    if (comision) {
      setEditando(comision.id);
      setFormData(comision);
    } else {
      setEditando(null);
      setFormData({
        ambito: '',
        lugar: '',
        fecha_inicio: '',
        fecha_fin: '',
        comisionados: '',
        actividades: '',
        dias: '',
        costo_xdia: '',
        costo_pasajes_nacional: '',
        costo_pasajes_local: '',
        costo_combustible: '',
        costo_comision_por_comisionado: '',
        costo_total_comision: '',
        observacion: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCerrarDialog = () => {
    setOpenDialog(false);
    setEditando(null);
  };

  const handleGuardar = async () => {
    try {
      if (editando) {
        await apiService.actualizarComision(editando, formData);
      } else {
        await apiService.crearComision(formData);
      }
      handleCerrarDialog();
      cargarComisiones();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta comisión?')) {
      try {
        await apiService.eliminarComision(id);
        cargarComisiones();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <MDBox pt={6} pb={3}>
      <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <MDTypography variant="h4" fontWeight="bold">
          Gestión de Comisiones
        </MDTypography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleAbrirDialog()}
        >
          Nueva Comisión
        </Button>
      </MDBox>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f3f3f3' }}>
                  <TableCell>Lugar</TableCell>
                  <TableCell>Comisionados</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Días</TableCell>
                  <TableCell>Costo Total</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comisiones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay comisiones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  comisiones.map((comision) => (
                    <TableRow key={comision.id}>
                      <TableCell>{comision.lugar}</TableCell>
                      <TableCell>{comision.comisionados}</TableCell>
                      <TableCell>{comision.fecha_inicio}</TableCell>
                      <TableCell>{comision.fecha_fin}</TableCell>
                      <TableCell>{comision.dias}</TableCell>
                      <TableCell>
                        S/ {parseFloat(comision.costo_total_comision || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleAbrirDialog(comision)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminar(comision.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCerrarDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Comisión' : 'Nueva Comisión'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Ámbito"
            name="ambito"
            value={formData.ambito}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Lugar"
            name="lugar"
            value={formData.lugar}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Fecha Inicio"
            name="fecha_inicio"
            type="date"
            value={formData.fecha_inicio}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Fecha Fin"
            name="fecha_fin"
            type="date"
            value={formData.fecha_fin}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Comisionados"
            name="comisionados"
            value={formData.comisionados}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
            required
          />
          <TextField
            fullWidth
            label="Actividades"
            name="actividades"
            value={formData.actividades}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Días"
            name="dias"
            type="number"
            value={formData.dias}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Costo por Día"
            name="costo_xdia"
            type="number"
            value={formData.costo_xdia}
            onChange={handleChange}
            margin="normal"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Pasajes Nacional"
            name="costo_pasajes_nacional"
            type="number"
            value={formData.costo_pasajes_nacional}
            onChange={handleChange}
            margin="normal"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Pasajes Local"
            name="costo_pasajes_local"
            type="number"
            value={formData.costo_pasajes_local}
            onChange={handleChange}
            margin="normal"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Combustible"
            name="costo_combustible"
            type="number"
            value={formData.costo_combustible}
            onChange={handleChange}
            margin="normal"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Costo por Comisionado"
            name="costo_comision_por_comisionado"
            type="number"
            value={formData.costo_comision_por_comisionado}
            onChange={handleChange}
            margin="normal"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Costo Total"
            name="costo_total_comision"
            type="number"
            value={formData.costo_total_comision}
            onChange={handleChange}
            margin="normal"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label="Observación"
            name="observacion"
            value={formData.observacion}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarDialog}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained" color="primary">
            {editando ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

export default Comisiones;
