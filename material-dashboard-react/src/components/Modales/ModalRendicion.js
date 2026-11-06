import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import api from 'services/api';

/**
 * 🗂️ Modal para rendir comprobantes
 */
const ModalRendicion = ({ open, onClose, formato, clasificador, onSuccess }) => {
  const [formData, setFormData] = useState({
    numero_comprobante: '',
    tipo_comprobante: 'FACTURA',
    fecha_comprobante: new Date().toISOString().split('T')[0],
    proveedor_razon_social: '',
    proveedor_ruc_dni: '',
    monto: '',
  });

  const [detalles, setDetalles] = useState([
    { tipo_viatitico: 'ALIMENTACIÓN', cantidad: '' },
    { tipo_viatitico: 'HOSPEDAJE', cantidad: '' },
    { tipo_viatitico: 'MOVILIDAD_LOCAL', cantidad: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esViatitico, setEsViatitico] = useState(false);

  // 🔍 Detectar si clasificador es VIÁTICO
  useEffect(() => {
    if (clasificador) {
      const esViat =
        clasificador.partida === '23.2.1.2.1' ||
        clasificador.nombre?.includes('VIÁTICO');
      setEsViatitico(esViat);

      if (!esViat) {
        setDetalles([]);
      }
    }
  }, [clasificador]);

  // 🔄 Calcular total de detalles
  const calcularTotalDetalles = () => {
    return detalles.reduce((sum, d) => sum + (parseFloat(d.cantidad) || 0), 0);
  };

  // 📝 Manejar cambios en form principal
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 📝 Manejar cambios en detalles
  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = value;
    setDetalles(nuevosDetalles);
  };

  // 💾 Guardar comprobante
  const handleGuardar = async () => {
    try {
      setError(null);
      setLoading(true);

      // ✅ Validar campos requeridos
      if (!formData.numero_comprobante || !formData.fecha_comprobante || !formData.monto) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }

      // ✅ Validar detalles si es viático
      if (esViatitico) {
        const totalDetalles = calcularTotalDetalles();
        const montoFormulario = parseFloat(formData.monto);

        if (Math.abs(totalDetalles - montoFormulario) > 0.01) {
          setError(
            `El total de viáticos (S/. ${totalDetalles.toFixed(2)}) no coincide con el monto (S/. ${montoFormulario.toFixed(2)})`
          );
          return;
        }

        // Validar que todos los tipos tengan cantidad
        if (detalles.some((d) => !d.cantidad)) {
          setError('Por favor completa todos los tipos de viático');
          return;
        }
      }

      console.log('🟦 [RENDICION MODAL] Guardando comprobante...');

      const datosComprobante = {
        formato_emision_id: formato.id,
        ...formData,
        monto: parseFloat(formData.monto),
        detalles: esViatitico
          ? detalles.map((d) => ({
              ...d,
              cantidad: parseFloat(d.cantidad),
            }))
          : [],
      };

      const response = await api.crearComprobante(datosComprobante);

      console.log('✅ [RENDICION MODAL] Comprobante creado:', response);

      // ✅ Mostrar éxito y cerrar
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Limpiar formulario
      setFormData({
        numero_comprobante: '',
        tipo_comprobante: 'FACTURA',
        fecha_comprobante: new Date().toISOString().split('T')[0],
        proveedor_razon_social: '',
        proveedor_ruc_dni: '',
        monto: '',
      });

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Error al guardar comprobante:', err);
      setError(err.response?.data?.error || 'Error al guardar comprobante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
        📋 Rendir Comprobante - Formato #{formato?.id}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 📦 Información del Formato */}
        <MDBox mb={2} p={1} sx={{ bgcolor: '#f9f9f9', borderRadius: '8px' }}>
          <MDTypography variant="caption" fontWeight="bold">
            Tipo de Emisión: {formato?.tipo_emision}
          </MDTypography>
          <br />
          <MDTypography variant="caption" fontWeight="bold">
            Partida: {clasificador?.partida} - {clasificador?.nombre}
          </MDTypography>
        </MDBox>

        {/* 📝 Campos Principales */}
        <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            label="N° Comprobante"
            name="numero_comprobante"
            value={formData.numero_comprobante}
            onChange={handleFormChange}
            size="small"
            fullWidth
            required
          />
          <FormControl size="small" fullWidth required>
            <InputLabel>Tipo Comprobante</InputLabel>
            <Select
              name="tipo_comprobante"
              value={formData.tipo_comprobante}
              onChange={handleFormChange}
              label="Tipo Comprobante"
            >
              <MenuItem value="FACTURA">Factura</MenuItem>
              <MenuItem value="BOLETA">Boleta</MenuItem>
              <MenuItem value="TICKET">Ticket</MenuItem>
              <MenuItem value="RECIBO">Recibo</MenuItem>
            </Select>
          </FormControl>
        </MDBox>

        <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            label="Fecha Comprobante"
            type="date"
            name="fecha_comprobante"
            value={formData.fecha_comprobante}
            onChange={handleFormChange}
            size="small"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Monto (S/.)"
            name="monto"
            type="number"
            value={formData.monto}
            onChange={handleFormChange}
            size="small"
            fullWidth
            required
            inputProps={{ step: '0.01' }}
          />
        </MDBox>

        <MDBox sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            label="RUC/DNI"
            name="proveedor_ruc_dni"
            value={formData.proveedor_ruc_dni}
            onChange={handleFormChange}
            size="small"
            fullWidth
          />
          <TextField
            label="Razón Social / Empresa"
            name="proveedor_razon_social"
            value={formData.proveedor_razon_social}
            onChange={handleFormChange}
            size="small"
            fullWidth
          />
        </MDBox>

        {/* 🍽️ Detalles de Viáticos (CONDICIONAL) */}
        {esViatitico && (
          <MDBox sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: '8px' }}>
            <MDTypography variant="subtitle2" fontWeight="bold" color="warning">
              🍽️ Desglose de Viáticos
            </MDTypography>

            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#ffcc80' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo Viático</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Monto (S/.)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((detalle, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {detalle.tipo_viatitico === 'ALIMENTACIÓN'
                          ? '🍴 Alimentación'
                          : detalle.tipo_viatitico === 'HOSPEDAJE'
                          ? '🏨 Hospedaje'
                          : '🚕 Movilidad Local'}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={detalle.cantidad}
                          onChange={(e) =>
                            handleDetalleChange(idx, 'cantidad', e.target.value)
                          }
                          size="small"
                          inputProps={{ step: '0.01' }}
                          sx={{ width: '100px' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#e0f2f1', fontWeight: 'bold' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      S/. {calcularTotalDetalles().toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {Math.abs(
              calcularTotalDetalles() - parseFloat(formData.monto || 0)
            ) > 0.01 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                ⚠️ El total de viáticos no coincide con el monto ingresado
              </Alert>
            )}
          </MDBox>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <MDButton
          variant="gradient"
          color="success"
          onClick={handleGuardar}
          disabled={loading}
        >
          {loading ? '⏳ Guardando...' : '✅ Guardar Comprobante'}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRendicion;
