import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import api from 'services/api';

function PdfUploadDialog({ open, onClose, onExtractedData }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Por favor selecciona un archivo PDF válido');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo PDF');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Obtener token del localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor inicia sesión primero.');
      }

      // Subir y extraer datos del PDF
      const response = await fetch('http://localhost:5000/api/pdf/extract-certification', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        throw new Error('Error al procesar el PDF');
      }

      const result = await response.json();
      
      if (result.success) {
        setExtractedData(result.data);
        Swal.fire({
          icon: 'success',
          title: 'PDF Procesado',
          text: 'Se extrajeron los datos correctamente',
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar el PDF');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo procesar el PDF: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyData = () => {
    if (extractedData && onExtractedData) {
      // Pasar tanto los datos extraídos como el archivo
      onExtractedData({
        ...extractedData,
        archivo_pdf_original: file  // Incluir el archivo original
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setExtractedData(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <MDTypography variant="h6" fontWeight="bold">
          📄 Importar datos desde PDF
        </MDTypography>
      </DialogTitle>
      <DialogContent>
        <MDBox sx={{ pt: 2 }}>
          {/* Upload Section */}
          {!extractedData ? (
            <>
              <Card sx={{ mb: 2, backgroundColor: '#f5f5f5', border: '2px dashed #ccc' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Selecciona un PDF de Certificación de Crédito
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    id="pdf-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="pdf-input">
                    <Button 
                      variant="contained" 
                      component="span"
                      size="large"
                      startIcon={<CloudUploadIcon />}
                      sx={{ 
                        backgroundColor: '#1976d2',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        '&:hover': {
                          backgroundColor: '#1565c0'
                        }
                      }}
                    >
                      Seleccionar PDF
                    </Button>
                  </label>
                  {file && (
                    <Typography variant="body2" sx={{ mt: 2, color: 'green' }}>
                      ✓ {file.name}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {file && (
                <MDButton
                  variant="contained"
                  color="info"
                  fullWidth
                  onClick={handleUpload}
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Procesando...
                    </>
                  ) : (
                    'Procesar PDF'
                  )}
                </MDButton>
              )}
            </>
          ) : (
            /* Results Section */
            <>
              <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
                Datos extraídos correctamente del PDF
              </Alert>

              {/* Main Info */}
              <Card sx={{ mb: 2, backgroundColor: '#e8f5e9', border: '1px solid #81c784' }}>
                <CardContent>
                  <MDTypography variant="h6" fontWeight="bold" mb={1}>
                    📋 Información General
                  </MDTypography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Nota Nº</TableCell>
                          <TableCell>{extractedData.nota}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Número Documento</TableCell>
                          <TableCell>{extractedData.numero_documento}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Tipo Documento</TableCell>
                          <TableCell>{extractedData.tipo_documento}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Mes</TableCell>
                          <TableCell>{extractedData.mes}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                          <TableCell>
                            <span style={{ 
                              backgroundColor: '#ff9800', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}>
                              {extractedData.periodo || 'No detectado'}
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Fecha Aprobación</TableCell>
                          <TableCell>{extractedData.fecha_aprobacion}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                          <TableCell>
                            <span style={{ backgroundColor: '#4caf50', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                              {extractedData.estado_certificacion}
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Justificación</TableCell>
                          <TableCell>{extractedData.justificacion}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Meta Info */}
              <Card sx={{ mb: 2, backgroundColor: '#e3f2fd', border: '1px solid #64b5f6' }}>
                <CardContent>
                  <MDTypography variant="h6" fontWeight="bold" mb={1}>
                    🎯 Meta
                  </MDTypography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Número</TableCell>
                          <TableCell>{extractedData.meta_info.numero}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                          <TableCell>
                            {extractedData.meta_info.periodo ? (
                              <span style={{ 
                                backgroundColor: '#4caf50', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                {extractedData.meta_info.periodo}
                              </span>
                            ) : (
                              <span style={{ color: '#ff9800' }}>No definido</span>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                          <TableCell>{extractedData.meta_info.descripcion}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Fuente Info */}
              <Card sx={{ mb: 2, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
                <CardContent>
                  <MDTypography variant="h6" fontWeight="bold" mb={1}>
                    💰 Fuente de Financiamiento
                  </MDTypography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Fuente</TableCell>
                          <TableCell>{extractedData.fuente_info}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Monto Total</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1em', color: '#2196f3' }}>
                            S/. {extractedData.monto_total.toLocaleString('es-PE')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Detalles */}
              {extractedData.detalles_raw && extractedData.detalles_raw.length > 0 && (
                <Card sx={{ mb: 2, backgroundColor: '#f3e5f5', border: '1px solid #ba68c8' }}>
                  <CardContent>
                    <MDTypography variant="h6" fontWeight="bold" mb={2}>
                      📝 Detalles de Gasto ({extractedData.detalles_raw.length} items)
                    </MDTypography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {extractedData.detalles_raw.map((detalle, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                                {detalle.partida_db}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.9em' }}>
                                {detalle.descripcion}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                S/. {detalle.monto.toLocaleString('es-PE')}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                              TOTAL:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05em' }}>
                              S/. {extractedData.monto_total.toLocaleString('es-PE')}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Vista previa del PDF */}
              {file && (
                <Card sx={{ mb: 2, backgroundColor: '#fafafa', border: '1px solid #ccc' }}>
                  <CardContent>
                    <MDTypography variant="h6" fontWeight="bold" mb={2}>
                      📄 Vista Previa del PDF
                    </MDTypography>
                    <Box sx={{ 
                      width: '100%', 
                      height: '400px', 
                      backgroundColor: '#ffffff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      overflow: 'auto'
                    }}>
                      <embed
                        src={URL.createObjectURL(file)}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#666' }}>
                      Archivo: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <MDButton
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => {
                  setExtractedData(null);
                  setFile(null);
                }}
                sx={{ mb: 1 }}
              >
                Cargar otro PDF
              </MDButton>
            </>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        {extractedData && (
          <MDButton
            variant="contained"
            color="success"
            onClick={handleApplyData}
          >
            Aplicar Datos
          </MDButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

PdfUploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExtractedData: PropTypes.func,
};

export default PdfUploadDialog;
