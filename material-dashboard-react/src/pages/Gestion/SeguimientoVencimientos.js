import React, { useState, useEffect, useMemo } from 'react';
import { Autocomplete, Card, Checkbox, CircularProgress, InputAdornment, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import MDBox from 'components/MDBox';
import MDBadge from 'components/MDBadge';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import {
  calcularVencimientoRendicion,
  diasHabilesRespectoHoy,
} from 'utils/vencimientoRendicion';

// Formatos cuya comisión ya terminó y que todavía deben rendirse
const ESTADOS_PENDIENTES_RENDICION = ['EMITIDO', 'ENVIADO', 'PAGADO', 'RINDIENDO'];

// Colores de las etiquetas de CCP, asignados en orden a cada CCP distinto
const COLORES_CCP = ['info', 'success', 'warning', 'secondary', 'primary', 'error', 'dark'];

// Mismo tamaño de texto que las demás columnas de la tabla
const estiloBadge = { '& .MuiBadge-badge': { fontSize: '0.8rem' } };

const formatearFecha = (fecha) => fecha.toLocaleDateString('es-PE');

const fechaIsoHoy = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
};

const colorEstado = (estado) => {
  const colores = {
    EMITIDO: 'info',
    ENVIADO: 'warning',
    PAGADO: 'primary',
    RINDIENDO: 'secondary',
  };
  return colores[estado] || 'light';
};

const situacionDe = (dias) => {
  if (dias < 0) {
    const n = Math.abs(dias);
    return { texto: `Vencido hace ${n} día${n === 1 ? '' : 's'} hábil${n === 1 ? '' : 'es'}`, color: 'error' };
  }
  if (dias === 0) return { texto: 'Vence hoy', color: 'error' };
  if (dias <= 3) return { texto: `Vence en ${dias} día${dias === 1 ? '' : 's'} hábil${dias === 1 ? '' : 'es'}`, color: 'warning' };
  return { texto: `En plazo: ${dias} días hábiles`, color: 'success' };
};

function SeguimientoVencimientos() {
  const [formatos, setFormatos] = useState([]);
  const [feriadosSet, setFeriadosSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroCcp, setFiltroCcp] = useState([]);
  const [filtroSituacion, setFiltroSituacion] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [formatosRes, feriadosRes] = await Promise.all([
          api.obtenerFormatosEmisiones({}),
          api.request('/feriados'),
        ]);
        setFormatos(formatosRes.formatos || []);
        setFeriadosSet(new Set((feriadosRes.feriados || []).map((f) => f.fecha)));
      } catch (err) {
        setError(`Error al cargar formatos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const filas = useMemo(() => {
    const hoyIso = fechaIsoHoy();
    return formatos
      .filter((f) => ESTADOS_PENDIENTES_RENDICION.includes(f.estado_emision))
      .filter((f) => f.fecha_retorno && String(f.fecha_retorno).slice(0, 10) <= hoyIso)
      .map((f) => {
        const vencimiento = calcularVencimientoRendicion(f.fecha_retorno, feriadosSet);
        const dias = diasHabilesRespectoHoy(vencimiento, feriadosSet);
        return { ...f, vencimiento, dias };
      })
      .sort((a, b) => a.dias - b.dias);
  }, [formatos, feriadosSet]);

  const ccpsDisponibles = useMemo(
    () => [...new Set(filas.map((f) => f.certificacion_nota).filter(Boolean))].sort(),
    [filas]
  );

  const colorCcp = (nota) => {
    const indice = ccpsDisponibles.indexOf(nota);
    return indice < 0 ? 'light' : COLORES_CCP[indice % COLORES_CCP.length];
  };

  const filasVisibles = useMemo(() => {
    const condicionSituacion = {
      vencidos: (f) => f.dias < 0,
      pronto: (f) => f.dias >= 0 && f.dias <= 3,
      plazo: (f) => f.dias > 3,
    };
    return filas.filter(
      (f) =>
        (filtroCcp.length === 0 || filtroCcp.includes(f.certificacion_nota)) &&
        (!filtroSituacion || condicionSituacion[filtroSituacion](f))
    );
  }, [filas, filtroCcp, filtroSituacion]);

  const resumen = useMemo(() => ({
    vencidos: filas.filter((f) => f.dias < 0).length,
    venceHoyOPronto: filas.filter((f) => f.dias >= 0 && f.dias <= 3).length,
    enPlazo: filas.filter((f) => f.dias > 3).length,
  }), [filas]);

  /* eslint-disable react/prop-types, react/display-name */
  const columnas = [
    { Header: 'N° Formato', accessor: 'numero_documento', width: '11%', align: 'center' },
    { Header: 'Solicitado por', accessor: 'usuario_nombre', width: '13%', align: 'center' },
    { Header: 'Comisión', accessor: 'comision_lugar', width: '10%', align: 'center' },
    {
      Header: 'CCP',
      accessor: 'certificacion_nota',
      width: '15%',
      align: 'center',
      Cell: ({ value }) =>
        value ? (
          <MDBadge badgeContent={value} color={colorCcp(value)} variant="gradient" size="sm" sx={estiloBadge} max={Number.MAX_SAFE_INTEGER} />
        ) : (
          '-'
        ),
    },
    {
      Header: 'Monto CCP',
      accessor: 'certificacion_monto',
      width: '9%',
      align: 'center',
      Cell: ({ value }) => (value != null ? parseFloat(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
    },
    {
      Header: 'Estado',
      accessor: 'estado_emision',
      width: '9%',
      align: 'center',
      Cell: ({ value }) => (
        <MDBadge badgeContent={value} color={colorEstado(value)} variant="gradient" size="sm" sx={estiloBadge} />
      ),
    },
    {
      Header: 'Fecha retorno',
      accessor: 'fecha_retorno',
      width: '9%',
      align: 'center',
      Cell: ({ value }) => (value ? formatearFecha(new Date(String(value).slice(0, 10) + 'T00:00:00')) : '-'),
    },
    {
      Header: 'Vence rendición',
      accessor: 'vencimiento',
      width: '10%',
      align: 'center',
      Cell: ({ value }) => (value ? formatearFecha(value) : '-'),
    },
    {
      Header: 'Situación',
      accessor: 'dias',
      width: '14%',
      align: 'center',
      Cell: ({ value }) => {
        const { texto, color } = situacionDe(value);
        return <MDBadge badgeContent={texto} color={color} variant="gradient" size="sm" sx={estiloBadge} />;
      },
    },
  ];
  /* eslint-enable react/prop-types, react/display-name */

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Card>
          <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info">
            <MDTypography variant="h6" color="white" sx={{ textTransform: 'uppercase' }}>
              Seguimiento de vencimientos de rendición
            </MDTypography>
            <MDTypography variant="button" color="white" opacity={0.8}>
              Formatos emitidos cuya comisión ya terminó y aún no están rendidos. Ordenados por días hábiles, del vencido más antiguo al que vence después.
            </MDTypography>
          </MDBox>

          <MDBox pt={3} px={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <MDBox display="flex" gap={2} flexWrap="wrap">
              <MDBadge badgeContent={`Vencidos: ${resumen.vencidos}`} color="error" variant="gradient" size="sm" sx={{ ...estiloBadge, cursor: 'pointer', opacity: filtroSituacion && filtroSituacion !== 'vencidos' ? 0.45 : 1 }} onClick={() => setFiltroSituacion(filtroSituacion === 'vencidos' ? '' : 'vencidos')} />
              <MDBadge badgeContent={`Vencen pronto: ${resumen.venceHoyOPronto}`} color="warning" variant="gradient" size="sm" sx={{ ...estiloBadge, cursor: 'pointer', opacity: filtroSituacion && filtroSituacion !== 'pronto' ? 0.45 : 1 }} onClick={() => setFiltroSituacion(filtroSituacion === 'pronto' ? '' : 'pronto')} />
              <MDBadge badgeContent={`En plazo: ${resumen.enPlazo}`} color="success" variant="gradient" size="sm" sx={{ ...estiloBadge, cursor: 'pointer', opacity: filtroSituacion && filtroSituacion !== 'plazo' ? 0.45 : 1 }} onClick={() => setFiltroSituacion(filtroSituacion === 'plazo' ? '' : 'plazo')} />
            </MDBox>

            <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
              {filtroCcp.length > 0 && (
                <MDTypography variant="button" color="text">
                  {filasVisibles.length} formato{filasVisibles.length === 1 ? '' : 's'} en {filtroCcp.length === 1 ? 'este CCP' : `${filtroCcp.length} CCP`}
                </MDTypography>
              )}
              <Autocomplete
                multiple
                disableCloseOnSelect
                limitTags={2}
                size="small"
                options={ccpsDisponibles}
                value={filtroCcp}
                onChange={(event, nuevos) => setFiltroCcp(nuevos)}
                sx={{
                  minWidth: 300,
                  '& .MuiInputBase-root, & .MuiInputBase-input, & .MuiInputLabel-root': { fontSize: '0.875rem' },
                  '& .MuiChip-label': { fontSize: '0.75rem' },
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props} key={option} style={{ fontSize: '0.875rem' }}>
                    <Checkbox checked={selected} size="small" sx={{ mr: 1, p: 0.5 }} />
                    {option}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por CCP"
                    placeholder={filtroCcp.length === 0 ? 'Todos los CCP' : ''}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <FilterListIcon sx={{ color: '#1A73E8' }} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      backgroundColor: '#fff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#1A73E8', borderWidth: '2px' },
                        '&:hover fieldset': { borderColor: '#1557b0' },
                        '&.Mui-focused fieldset': { borderColor: '#1557b0' },
                      },
                      '& .MuiInputLabel-root': { color: '#1A73E8', fontWeight: 600 },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#1557b0' },
                    }}
                  />
                )}
              />
            </MDBox>
          </MDBox>

          <MDBox pt={2} pb={3} px={3}>
            {loading ? (
              <MDBox display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </MDBox>
            ) : error ? (
              <MDTypography variant="body2" color="error">{error}</MDTypography>
            ) : filas.length === 0 ? (
              <MDTypography variant="body2" color="text">No hay formatos pendientes de rendición con comisión terminada.</MDTypography>
            ) : (
              <MDBox
                sx={{
                  '& th, & th *': { color: '#000 !important', fontSize: '0.875rem !important' },
                  '& .MuiInputBase-input': { fontSize: '0.875rem !important' },
                  '& .MuiTypography-caption': { fontSize: '0.875rem !important' },
                }}
              >
                <DataTable
                  table={{ columns: columnas, rows: filasVisibles }}
                  canSearch
                  isSorted={true}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 50] }}
                  showTotalEntries
                  noEndBorder
                  vistaMovil
                />
              </MDBox>
            )}
          </MDBox>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SeguimientoVencimientos;
