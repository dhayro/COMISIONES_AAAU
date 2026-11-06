import React, { useState, useRef } from 'react';
import { Card, Button, CircularProgress, Alert, Box, TextField } from '@mui/material';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import MDBox from 'components/MDBox';
import api from 'services/api';

function TestSunat() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const printRef = useRef();

  const [formData, setFormData] = useState({
    num_ruc: '20607496961',
    tipocomprobante: '03',
    cod_docide: '6',
    num_docide: '20520711865',
    num_serie: 'F006',
    num_comprob: '24926',
    fec_emision: '21/08/2026',
    cantidad: '365.00',
  });

  const handleTestSimple = async () => {
    try {
      setLoading(true);
      setError(null);
      setResultado(null);

      const response = await api.request('/sunat/test', {
        method: 'POST',
      });

      console.log('✅ Respuesta del test:', response);
      setResultado(response);
    } catch (err) {
      console.error('❌ Error en test:', err);
      setError(err.message || 'Error al conectar con SUNAT');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConParametros = async () => {
    try {
      setLoading(true);
      setError(null);
      setResultado(null);

      const response = await api.request('/sunat/validar-comprobante', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      console.log('✅ Respuesta de validación:', response);
      setResultado(response);
    } catch (err) {
      console.error('❌ Error en validación:', err);
      setError(err.message || 'Error al validar comprobante');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Formulario de entrada */}
        {!resultado && (
          <>
            <Card sx={{ mb: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  ⚡ Test Simple
                </MDTypography>

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleTestSimple}
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : '🚀 Ejecutar Test'}
                </Button>
              </MDBox>
            </Card>

            <Card sx={{ mb: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="bold" mb={2}>
                  📝 Test con Parámetros
                </MDTypography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="RUC Emisor"
                    name="num_ruc"
                    value={formData.num_ruc}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Tipo Comprobante"
                    name="tipocomprobante"
                    value={formData.tipocomprobante}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Código Tipo Doc"
                    name="cod_docide"
                    value={formData.cod_docide}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Nº Documento"
                    name="num_docide"
                    value={formData.num_docide}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Serie"
                    name="num_serie"
                    value={formData.num_serie}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Número"
                    name="num_comprob"
                    value={formData.num_comprob}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Fecha (dd/mm/yyyy)"
                    name="fec_emision"
                    value={formData.fec_emision}
                    onChange={handleChangeForm}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Monto"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChangeForm}
                    size="small"
                  />
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleTestConParametros}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '🔍 Validar'}
                </Button>
              </MDBox>
            </Card>
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Resultado - Estilo SUNAT exacto */}
        {resultado && (
          <Box
            ref={printRef}
            sx={{
              backgroundColor: '#fff',
              p: 0,
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <style>{`
              .form-table {
                border-collapse: collapse;
                border: 1px solid #999;
                margin: 10px auto;
              }
              .form-table td, .form-table th {
                border: 1px solid #999;
                padding: 5px;
              }
              .t1 {
                background-color: #4472C4;
                color: white;
                font-weight: bold;
                font-size: 16px;
                padding: 10px;
              }
              .beta {
                background-color: #B4C7E7;
                border: 1px solid #999;
              }
              .bgn {
                background-color: #FFF;
                padding: 10px;
                font-size: 14px;
                font-weight: bold;
              }
              .form-button {
                padding: 5px 20px;
                background-color: #F0F0F0;
                border: 1px solid #999;
                cursor: pointer;
                font-size: 14px;
              }
              .form-button:hover {
                background-color: #E0E0E0;
              }
              .headerToolBar {
                padding: 10px 0px 10px 5px;
              }
              @media print {
                * {
                  margin: 0 !important;
                  padding: 0 !important;
                }
                html, body {
                  width: 100% !important;
                  height: 100% !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
                .MuiCard-root {
                  display: none !important;
                }
                .MuiPaper-root {
                  display: none !important;
                }
                .MuiSidenav-root {
                  display: none !important;
                }
                nav {
                  display: none !important;
                }
                .MuiBox-root {
                  all: revert !important;
                }
                .MuiDashboardNavbar {
                  display: none !important;
                }
                button {
                  display: none !important;
                }
                [class*="Navbar"] {
                  display: none !important;
                }
                [class*="Sidenav"] {
                  display: none !important;
                }
                [class*="Footer"] {
                  display: none !important;
                }
                [class*="Configurator"] {
                  display: none !important;
                }
                footer {
                  display: none !important;
                }
                svg {
                  display: none !important;
                }
                [style*="position: fixed"] {
                  display: none !important;
                }
                [style*="z-index: 99"] {
                  display: none !important;
                }
                .form-table {
                  width: 50% !important;
                  margin: 10px auto !important;
                  page-break-inside: avoid;
                }
                .form-table table {
                  width: 100% !important;
                }
                br {
                  display: none !important;
                }
              }
            `}</style>

            <table width="50%" cellPadding="1" cellSpacing="1" className="form-table">
              <tbody>
                <tr>
                  <td>
                    <table cellPadding="0" cellSpacing="0" width="100%">
                      <tbody>
                        <tr>
                          <td width="100%" className="t1">
                            Consulta Validez del Comprobante de Pago Electrónico
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <br />

            <table width="50%" cellPadding="2" cellSpacing="2" className="form-table">
              <tbody>
                <tr>
                  <td>
                    <table cellPadding="0" cellSpacing="0" width="100%">
                      <tbody>
                        <tr className="beta">
                          <th align="left" colSpan="3" height="15px">
                            Resultado de la Consulta
                          </th>
                        </tr>
                        <tr height="15px">
                          <td width="30%" height="15px" className="bgn">
                            {resultado.mensaje}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <br />

            <div style={{ padding: '10px 0px 10px 5px' }}>
              <table width="50%" cellPadding="2" cellSpacing="2">
                <tbody>
                  <tr>
                    <td align="center">
                      <button
                        type="button"
                        value="Anterior"
                        className="form-button"
                        onClick={() => {
                          setResultado(null);
                          setFormData({
                            num_ruc: '20607496961',
                            tipocomprobante: '03',
                            cod_docide: '6',
                            num_docide: '20520711865',
                            num_serie: 'F006',
                            num_comprob: '24926',
                            fec_emision: '21/08/2026',
                            cantidad: '365.00',
                          });
                        }}
                        style={{
                          padding: '5px 20px',
                          backgroundColor: '#F0F0F0',
                          border: '1px solid #999',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Anterior
                      </button>
                    </td>
                    <td align="center">
                      <button
                        type="button"
                        onClick={handlePrint}
                        style={{
                          padding: '5px 20px',
                          backgroundColor: '#F0F0F0',
                          border: '1px solid #999',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        🖨️ Imprimir
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <br />
            <br />

            {/* Detalles (solo pantalla) */}
            <Box className="no-print" sx={{ mt: 4, textAlign: 'left' }}>
              <Card sx={{ p: 2 }}>
                <MDTypography variant="h6" fontWeight="bold" mb={1}>
                  Detalles de la Validación
                </MDTypography>
                {resultado.datos_validados && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <MDTypography variant="caption" color="textSecondary">
                        RUC Emisor
                      </MDTypography>
                      <MDTypography variant="body2" fontWeight="bold">
                        {resultado.datos_validados.num_ruc}
                      </MDTypography>
                    </Box>
                    <Box>
                      <MDTypography variant="caption" color="textSecondary">
                        Comprobante
                      </MDTypography>
                      <MDTypography variant="body2" fontWeight="bold">
                        {resultado.datos_validados.num_serie}-{resultado.datos_validados.num_comprob}
                      </MDTypography>
                    </Box>
                    <Box>
                      <MDTypography variant="caption" color="textSecondary">
                        Fecha Emisión
                      </MDTypography>
                      <MDTypography variant="body2" fontWeight="bold">
                        {resultado.datos_validados.fec_emision}
                      </MDTypography>
                    </Box>
                    <Box>
                      <MDTypography variant="caption" color="textSecondary">
                        Monto
                      </MDTypography>
                      <MDTypography variant="body2" fontWeight="bold">
                        S/. {resultado.datos_validados.cantidad}
                      </MDTypography>
                    </Box>
                  </Box>
                )}
              </Card>

              <Card sx={{ p: 2, mt: 2 }}>
                <MDTypography variant="h6" fontWeight="bold" mb={1}>
                  Respuesta JSON
                </MDTypography>
                <Box
                  sx={{
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  {JSON.stringify(resultado, null, 2)}
                </Box>
              </Card>
            </Box>
          </Box>
        )}
      </MDBox>

      {!resultado && <Footer />}
    </DashboardLayout>
  );
}

export default TestSunat;
