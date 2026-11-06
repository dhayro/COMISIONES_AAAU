import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CircularProgress, Grid } from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDInput from 'components/MDInput';
import MDButton from 'components/MDButton';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import apiService from 'services/api';
import ComisionadosTable from './components/ComisionadosTable';

// 🌍 Función auxiliar para convertir UTC a zona horaria Perú
// Retorna string en formato datetime-local (YYYY-MM-DDTHH:mm)
const convertirAHorarioPerú = (fechaUTC) => {
  if (!fechaUTC) return '';
  
  try {
    const fecha = new Date(fechaUTC);
    const formatter = new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima',
      hour12: false
    });
    
    // Obtener la fecha/hora en formato DD/MM/YYYY, HH:mm
    let resultado = formatter.format(fecha);
    
    // Corregir si retorna 24:00 (medianoche)
    resultado = resultado.replace(', 24:00', ', 00:00');
    
    // Parsear: "02/03/2026, 00:00" → "2026-03-02T00:00"
    const [fechaParte, horaParte] = resultado.split(', ');
    const [día, mes, año] = fechaParte.split('/');
    
    // Retornar string en formato datetime-local
    return `${año}-${mes}-${día}T${horaParte}`;
  } catch (err) {
    console.error('Error al convertir fecha a horario Perú:', err);
    return '';
  }
};

function NuevaComision() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [ambitos, setAmbitos] = useState([]);
  const [comisionados, setComisionados] = useState([]);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    ambito_id: '',
    lugar: '',
    ruta: '',
    modalidad_viaje: 'TERRESTRE',
    fecha_salida: '',
    fecha_retorno: '',
    num_dias: '',
    costo_xdia: '',
    observacion: '',
  });

  useEffect(() => {
    cargarAmbitos();
    if (id) {
      cargarComision(id);
    }
  }, [id]);

  const cargarAmbitos = async () => {
    try {
      const datos = await apiService.obtenerAmbitos();
      setAmbitos(datos);
    } catch (err) {
      setError(`Error cargando ámbitos: ${err.message}`);
    }
  };

  const cargarComision = async (comisionId) => {
    try {
      const datos = await apiService.obtenerComision(comisionId);
      
      // 🌍 Convertir fechas de UTC a zona horaria Perú
      const convertirFechaAlFormato = (fechaUTC) => {
        if (!fechaUTC) return '';
        return convertirAHorarioPerú(new Date(fechaUTC)); // Ya retorna formato YYYY-MM-DDTHH:mm
      };

      setFormData({
        ambito_id: datos.ambito_id,
        lugar: datos.lugar,
        ruta: datos.ruta,
        modalidad_viaje: datos.modalidad_viaje,
        fecha_salida: convertirFechaAlFormato(datos.fecha_salida),
        fecha_retorno: convertirFechaAlFormato(datos.fecha_retorno),
        num_dias: datos.num_dias,
        costo_xdia: datos.costo_xdia,
        observacion: datos.observacion,
      });
      setComisionados(datos.comisionados || []);
    } catch (err) {
      setError(`Error cargando comisión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (id) {
        await apiService.actualizarComision(id, formData);
        alert('Comisión actualizada exitosamente');
      } else {
        const result = await apiService.crearComision(formData);
        navigate(`/comisiones/${result.id}`);
        alert('Comisión creada exitosamente');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    navigate('/comisiones');
  };

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
        <MDBox mb={3}>
          <MDTypography variant="h4" fontWeight="bold">
            {id ? 'Editar Comisión' : 'Nueva Comisión'}
          </MDTypography>
        </MDBox>

        {error && (
          <Card sx={{ mb: 3, p: 2, backgroundColor: '#ffebee' }}>
            <MDTypography color="error">{error}</MDTypography>
          </Card>
        )}

        <Card sx={{ p: 3, mb: 3 }}>
          <MDTypography variant="h6" fontWeight="bold" mb={2}>
            Información Principal
          </MDTypography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <MDTypography variant="caption" fontWeight="bold" mb={1} display="block">
                  Ámbito *
                </MDTypography>
                <select
                  name="ambito_id"
                  value={formData.ambito_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Seleccionar ámbito</option>
                  {ambitos.map((ambito) => (
                    <option key={ambito.id} value={ambito.id}>
                      {ambito.nombre}
                    </option>
                  ))}
                </select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDInput
                  type="text"
                  label="Lugar/Destino *"
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <MDInput
                  type="text"
                  label="Ruta"
                  name="ruta"
                  value={formData.ruta}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="ej: TARMA - QUIPARACRA - TARMA"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDTypography variant="caption" fontWeight="bold" mb={1} display="block">
                  Modalidad de Viaje *
                </MDTypography>
                <select
                  name="modalidad_viaje"
                  value={formData.modalidad_viaje}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="TERRESTRE">TERRESTRE</option>
                  <option value="AEREO">AEREO</option>
                  <option value="FLUVIAL">FLUVIAL</option>
                  <option value="AEREO-TERRESTRE">AEREO-TERRESTRE</option>
                  <option value="AEREO-FLUVIAL">AEREO-FLUVIAL</option>
                  <option value="TERRESTRE-FLUVIAL">TERRESTRE-FLUVIAL</option>
                  <option value="AEREO-TERRESTRE-FLUVIAL">AEREO-TERRESTRE-FLUVIAL</option>
                </select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDInput
                  type="number"
                  label="Número de Días *"
                  name="num_dias"
                  value={formData.num_dias}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDInput
                  type="datetime-local"
                  label="Fecha Salida *"
                  name="fecha_salida"
                  value={formData.fecha_salida}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: '900' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDInput
                  type="datetime-local"
                  label="Fecha Retorno *"
                  name="fecha_retorno"
                  value={formData.fecha_retorno}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: '900' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDInput
                  type="number"
                  label="Costo x Día *"
                  name="costo_xdia"
                  value={formData.costo_xdia}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: '0.01' }}
                />
              </Grid>

              <Grid item xs={12}>
                <MDInput
                  type="text"
                  label="Observación"
                  name="observacion"
                  value={formData.observacion}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <MDBox display="flex" gap={2} justifyContent="flex-end">
                  <MDButton variant="outlined" color="secondary" onClick={handleCancelar}>
                    Cancelar
                  </MDButton>
                  <MDButton variant="gradient" color="info" type="submit" disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : id ? 'Actualizar' : 'Crear'}
                  </MDButton>
                </MDBox>
              </Grid>
            </Grid>
          </form>
        </Card>

        {id && (
          <ComisionadosTable
            comisionId={id}
            comisionados={comisionados}
            onComisionadosChange={setComisionados}
          />
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default NuevaComision;
