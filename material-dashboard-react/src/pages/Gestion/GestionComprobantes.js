import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import Swal from 'sweetalert2';
import { Eye, Trash2, Edit } from 'lucide-react';

const GestionComprobantes = () => {
  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDetalles, setOpenDetalles] = useState(false);
  const [selectedComprobante, setSelectedComprobante] = useState(null);

  // 🔄 Cargar comprobantes al iniciar
  useEffect(() => {
    cargarComprobantes();
  }, []);

  // 📋 Cargar lista de comprobantes
  const cargarComprobantes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🟦 [COMPROBANTES] Cargando lista...');

      const response = await api.listarComprobantes();

      console.log('✅ [COMPROBANTES] Datos recibidos:', response);

      let datos = [];
      if (Array.isArray(response)) {
        datos = response;
      } else if (response?.comprobantes && Array.isArray(response.comprobantes)) {
        datos = response.comprobantes;
      } else if (response?.data && Array.isArray(response.data)) {
        datos = response.data;
      }

      setComprobantes(datos);
    } catch (err) {
      console.error('❌ Error cargando comprobantes:', err);
      setError('Error al cargar comprobantes');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar comprobante
  const handleEliminar = async (id) => {
    const confirmacion = await Swal.fire({
      title: '⚠️ Eliminar Comprobante',
      text: '¿Está seguro que desea eliminar este comprobante?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f44336',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await api.eliminarComprobante(id);

      Swal.fire({
        title: '✅ Eliminado',
        text: 'Comprobante eliminado exitosamente',
        icon: 'success',
        timer: 2000,
      });

      cargarComprobantes();
    } catch (err) {
      Swal.fire({
        title: '❌ Error',
        text: err.response?.data?.error || 'Error al eliminar comprobante',
        icon: 'error',
      });
    }
  };

  // 👁️ Ver detalles
  const handleVerDetalles = (comprobante) => {
    setSelectedComprobante(comprobante);
    setOpenDetalles(true);
  };

  // 🎨 Badge para estado
  const getBadgeColor = (estado) => {
    const colores = {
      PENDIENTE: { color: '#ff9800', bg: '#fff3e0' },
      EN_REVISIÓN: { color: '#2196f3', bg: '#e3f2fd' },
      APROBADO: { color: '#4caf50', bg: '#e8f5e9' },
      RECHAZADO: { color: '#f44336', bg: '#ffebee' },
    };
    return colores[estado] || { color: '#666', bg: '#f0f0f0' };
  };

  // 📊 Tabla de datos
  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'id', width: '60px' },
      { Header: 'Formato', accessor: 'formato_emision_id', width: '100px' },
      { Header: 'N° Comprobante', accessor: 'numero_comprobante' },
      { Header: 'Tipo', accessor: 'tipo_comprobante', width: '90px' },
      {
        Header: 'Fecha',
        accessor: 'fecha_comprobante',
        Cell: ({ value }) => new Date(value).toLocaleDateString('es-PE'),
      },
      { Header: 'Proveedor', accessor: 'proveedor_razon_social' },
      {
        Header: 'Monto',
        accessor: 'monto',
        Cell: ({ value }) => `S/. ${parseFloat(value).toFixed(2)}`,
      },
      {
        Header: 'Estado',
        accessor: 'estado_rendicion',
        Cell: ({ value }) => {
          const { color, bg } = getBadgeColor(value);
          return (
            <div
              style={{
                backgroundColor: bg,
                color,
                padding: '6px 12px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '12px',
                textAlign: 'center',
                display: 'inline-block',
              }}
            >
              {value}
            </div>
          );
        },
      },
      {
        Header: 'Acciones',
        accessor: 'id',
        Cell: ({ row }) => (
          <MDBox sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => handleVerDetalles(row.original)}
              title="Ver detalles"
            >
              <Eye size={18} />
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => handleEliminar(row.original.id)}
              title="Eliminar"
            >
              <Trash2 size={18} />
            </Button>
          </MDBox>
        ),
      },
    ],
    []
  );

  // 📋 Data para tabla
  const data = useMemo(
    () =>
      comprobantes.map((comp) => ({
        ...comp,
        monto: parseFloat(comp.monto),
      })),
    [comprobantes]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <MDTypography variant="h4" fontWeight="bold">
            📦 Gestión de Comprobantes
          </MDTypography>
          <MDButton variant="gradient" color="info" onClick={cargarComprobantes}>
            🔄 Recargar
          </MDButton>
        </MDBox>

        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <MDBox pt={3} px={3}>
            {comprobantes.length === 0 ? (
              <Alert severity="info">No hay comprobantes registrados aún</Alert>
            ) : (
              <DataTable
                table={{ columns, rows: data }}
                isSorted={true}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries={true}
                noEndBorder
              />
            )}
          </MDBox>
        </Card>
      </MDBox>

      {/* 📋 Dialog de Detalles */}
      <Dialog open={openDetalles} onClose={() => setOpenDetalles(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
          📋 Detalles del Comprobante #{selectedComprobante?.id}
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {selectedComprobante && (
            <MDBox>
              <MDTypography variant="subtitle2" fontWeight="bold" gutterBottom>
                Información General
              </MDTypography>

              <MDBox sx={{ display: 'grid', gap: 1, mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: '8px' }}>
                <div>
                  <strong>Número Comprobante:</strong> {selectedComprobante.numero_comprobante}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedComprobante.tipo_comprobante}
                </div>
                <div>
                  <strong>Fecha:</strong>{' '}
                  {new Date(selectedComprobante.fecha_comprobante).toLocaleDateString('es-PE')}
                </div>
                <div>
                  <strong>Proveedor:</strong> {selectedComprobante.proveedor_razon_social}
                </div>
                <div>
                  <strong>RUC/DNI:</strong> {selectedComprobante.proveedor_ruc_dni}
                </div>
                <div>
                  <strong>Monto:</strong> S/. {parseFloat(selectedComprobante.monto).toFixed(2)}
                </div>
                <div>
                  <strong>Estado:</strong>{' '}
                  <Chip
                    label={selectedComprobante.estado_rendicion}
                    color="primary"
                    variant="outlined"
                  />
                </div>
              </MDBox>

              {/* Detalles de viáticos si existen */}
              {selectedComprobante.detalles && selectedComprobante.detalles.length > 0 && (
                <>
                  <MDTypography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                    🍽️ Desglose de Viáticos
                  </MDTypography>

                  <MDBox sx={{ display: 'grid', gap: 1, p: 2, bgcolor: '#fff3e0', borderRadius: '8px' }}>
                    {selectedComprobante.detalles.map((detalle, idx) => (
                      <div key={idx}>
                        <strong>{detalle.tipo_viatitico}:</strong> S/.{' '}
                        {parseFloat(detalle.cantidad).toFixed(2)}
                      </div>
                    ))}
                  </MDBox>
                </>
              )}
            </MDBox>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDetalles(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
};

export default GestionComprobantes;
