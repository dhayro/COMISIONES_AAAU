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

const formatearFecha = (fecha) => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

const mostrarToast = (icon, title, text) =>
  Swal.fire({
    icon,
    title,
    text,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    didOpen: (toast) => {
      toast.style.zIndex = 9999;
    },
  });

function GestionFeriados() {
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ fecha: '', descripcion: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      setFeriados(await api.obtenerFeriados());
    } catch (error) {
      mostrarToast('error', 'Error', 'Error al cargar los feriados');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ fecha: '', descripcion: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!formData.fecha || !formData.descripcion.trim()) {
      mostrarToast('warning', 'Campos requeridos', 'Fecha y descripción son requeridas');
      return;
    }

    try {
      await api.crearFeriado({ fecha: formData.fecha, descripcion: formData.descripcion.trim() });
      mostrarToast('success', 'Feriado creado', 'El feriado ha sido registrado.');
      handleCloseDialog();
      cargarDatos();
    } catch (err) {
      mostrarToast('error', 'Error', err.message || 'Error al guardar el feriado');
    }
  };

  const handleEliminar = (fecha) => {
    Swal.fire({
      title: '¿Eliminar feriado?',
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
          await api.eliminarFeriado(fecha);
          mostrarToast('success', 'Feriado eliminado', 'El feriado ha sido eliminado.');
          cargarDatos();
        } catch (err) {
          mostrarToast('error', 'Error', err.message || 'Error al eliminar el feriado');
        }
      }
    });
  };

  const rows = [...feriados]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((feriado) => ({
    fecha: formatearFecha(feriado.fecha),
    descripcion: feriado.descripcion,
    acciones: (
      <MDBox display="flex" gap={1}>
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => handleEliminar(feriado.fecha)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MDBox>
    ),
  }));

  const columns = [
    { Header: 'Fecha', accessor: 'fecha', width: '25%' },
    { Header: 'Descripción', accessor: 'descripcion', width: '55%' },
    { Header: 'Acciones', accessor: 'acciones', align: 'center', width: '20%' },
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
              Gestión de Feriados
            </MDTypography>
            <MDButton
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ ml: 2 }}
            >
              Nuevo Feriado
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Feriado</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Fecha"
            name="fecha"
            type="date"
            value={formData.fecha}
            onChange={handleInputChange}
            size="small"
            autoFocus
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            size="small"
            placeholder="Ej: Día de la Canción Criolla"
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

export default GestionFeriados;
