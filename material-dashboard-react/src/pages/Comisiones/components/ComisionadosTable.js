import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Grid,
  Icon,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDInput from 'components/MDInput';
import MDButton from 'components/MDButton';
import apiService from 'services/api';

function ComisionadosTable({ comisionId, comisionados, onComisionadosChange }) {
  const [usuarios, setUsuarios] = useState([]);
  const [clasificadores, setClasificadores] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [savingComisionado, setSavingComisionado] = useState(false);

  const [formComisionado, setFormComisionado] = useState({
    usuario_id: '',
    clasificador_id: '',
    dias: '',
    costo_xdia: '',
    monto: '',
    descripcion: '',
    observacion: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [usuariosData, clasificadoresData] = await Promise.all([
        apiService.obtenerUsuariosActivos(),
        apiService.obtenerClasificadores(),
      ]);
      setUsuarios(usuariosData);
      setClasificadores(clasificadoresData);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormComisionado((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAgregarComisionado = async (e) => {
    e.preventDefault();
    setSavingComisionado(true);

    try {
      await apiService.agregarComisionado(comisionId, {
        ...formComisionado,
        usuario_id: parseInt(formComisionado.usuario_id),
        clasificador_id: parseInt(formComisionado.clasificador_id),
        dias: parseInt(formComisionado.dias),
        costo_xdia: parseFloat(formComisionado.costo_xdia),
        monto: parseFloat(formComisionado.monto),
      });

      // Recargar comisionados
      const comisionData = await apiService.obtenerComision(comisionId);
      onComisionadosChange(comisionData.comisionados || []);

      // Limpiar formulario
      setFormComisionado({
        usuario_id: '',
        clasificador_id: '',
        dias: '',
        costo_xdia: '',
        monto: '',
        descripcion: '',
        observacion: '',
      });
      setShowForm(false);
      alert('Comisionado agregado exitosamente');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingComisionado(false);
    }
  };

  const handleEliminarComisionado = async (comisionadoId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este comisionado?')) {
      try {
        await apiService.eliminarComisionado(comisionadoId);
        const comisionData = await apiService.obtenerComision(comisionId);
        onComisionadosChange(comisionData.comisionados || []);
        alert('Comisionado eliminado exitosamente');
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const columns = [
    { Header: 'Usuario', accessor: 'usuario_nombre', width: '20%' },
    { Header: 'Clasificador', accessor: 'clasificador_nombre', width: '25%' },
    { Header: 'Partida', accessor: 'partida', width: '15%' },
    { Header: 'Días', accessor: 'dias', align: 'center', width: '10%' },
    { Header: 'Costo/Día', accessor: 'costo_xdia', align: 'right', width: '12%' },
    { Header: 'Monto', accessor: 'monto', align: 'right', width: '12%' },
    {
      Header: 'Acciones',
      accessor: 'acciones',
      align: 'center',
      width: '6%',
    },
  ];

  const rows = (comisionados || []).map((comisionado) => ({
    ...comisionado,
    acciones: (
      <MDButton
        variant="text"
        color="error"
        size="small"
        onClick={() => handleEliminarComisionado(comisionado.id)}
        title="Eliminar"
      >
        <Icon fontSize="small">delete</Icon>
      </MDButton>
    ),
  }));

  if (loadingData) {
    return (
      <Card sx={{ p: 3 }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <MDBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <MDTypography variant="h6" fontWeight="bold">
          Comisionados
        </MDTypography>
        <MDButton
          variant="gradient"
          color="success"
          size="small"
          onClick={() => setShowForm(!showForm)}
        >
          <Icon fontSize="small" sx={{ mr: 1 }}>
            add
          </Icon>
          Agregar Comisionado
        </MDButton>
      </MDBox>

      {showForm && (
        <Card sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <MDTypography variant="body2" fontWeight="bold" mb={2}>
            Agregar Nuevo Comisionado
          </MDTypography>

          <form onSubmit={handleAgregarComisionado}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <MDTypography variant="caption" fontWeight="bold" mb={1} display="block">
                  Usuario *
                </MDTypography>
                <select
                  name="usuario_id"
                  value={formComisionado.usuario_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre}
                    </option>
                  ))}
                </select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <MDTypography variant="caption" fontWeight="bold" mb={1} display="block">
                  Clasificador *
                </MDTypography>
                <select
                  name="clasificador_id"
                  value={formComisionado.clasificador_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Seleccionar clasificador</option>
                  {clasificadores.map((clasificador) => (
                    <option key={clasificador.id} value={clasificador.id}>
                      {clasificador.partida} - {clasificador.nombre}
                    </option>
                  ))}
                </select>
              </Grid>

              <Grid item xs={12} sm={3}>
                <MDInput
                  type="number"
                  label="Días *"
                  name="dias"
                  value={formComisionado.dias}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <MDInput
                  type="number"
                  label="Costo/Día *"
                  name="costo_xdia"
                  value={formComisionado.costo_xdia}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: '0.01' }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <MDInput
                  type="number"
                  label="Monto *"
                  name="monto"
                  value={formComisionado.monto}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: '0.01' }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <MDInput
                  type="text"
                  label="Descripción"
                  name="descripcion"
                  value={formComisionado.descripcion}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <MDInput
                  type="text"
                  label="Observación"
                  name="observacion"
                  value={formComisionado.observacion}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <MDBox display="flex" gap={2} justifyContent="flex-end">
                  <MDButton
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </MDButton>
                  <MDButton
                    variant="gradient"
                    color="success"
                    size="small"
                    type="submit"
                    disabled={savingComisionado}
                  >
                    {savingComisionado ? <CircularProgress size={16} /> : 'Agregar'}
                  </MDButton>
                </MDBox>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}

      {(comisionados || []).length === 0 ? (
        <MDTypography variant="body2" color="textSecondary">
          No hay comisionados agregados
        </MDTypography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Usuario</strong>
                </TableCell>
                <TableCell>
                  <strong>Partida</strong>
                </TableCell>
                <TableCell>
                  <strong>Descripción</strong>
                </TableCell>
                <TableCell>
                  <strong>Observación</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Acciones</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comisionados.map((com, idx) => (
                <TableRow key={idx}>
                  <TableCell>{com.usuario_id}</TableCell>
                  <TableCell>{com.clasificador_id}</TableCell>
                  <TableCell>{com.descripcion || '-'}</TableCell>
                  <TableCell>{com.observacion || '-'}</TableCell>
                  <TableCell align="center">
                    <MDButton
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => handleEliminarComisionado(idx)}
                    >
                      <Icon fontSize="small">delete</Icon>
                    </MDButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

ComisionadosTable.propTypes = {
  comisionId: PropTypes.number.isRequired,
  comisionados: PropTypes.array.isRequired,
  onComisionadosChange: PropTypes.func.isRequired,
};

export default ComisionadosTable;
