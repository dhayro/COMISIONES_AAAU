import React, { useState, useEffect } from 'react';
import {
  Card,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import Swal from 'sweetalert2';
import PrintIcon from '@mui/icons-material/Print';
import GetAppIcon from '@mui/icons-material/GetApp';

// Agregar estilos globales para Toast
const toastStyles = `
  .swal2-container {
    z-index: 99999 !important;
  }
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = toastStyles;
  document.head.appendChild(styleElement);
}

function ReportePresupuestoPendiente() {
  const [filtroTipo, setFiltroTipo] = useState('mes');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totales, setTotales] = useState({
    cantidad: 0,
    montoTotal: 0,
  });
  const [openPreview, setOpenPreview] = useState(false);

  // Generar reporte
  const generarReporte = async () => {
    try {
      setError('');
      setLoading(true);

      let inicio, fin;

      if (filtroTipo === 'mes') {
        const [year, month] = mesSeleccionado.split('-');
        inicio = `${year}-${month}-01`;
        const ultimoDia = new Date(year, month, 0).getDate();
        fin = `${year}-${month}-${ultimoDia}`;
      } else {
        if (!fechaInicio || !fechaFin) {
          Swal.fire({
            icon: 'warning',
            title: 'Fechas requeridas',
            text: 'Por favor completa ambas fechas.',
          });
          setLoading(false);
          return;
        }
        inicio = fechaInicio;
        fin = fechaFin;
      }

      // Obtener comisiones sin presupuesto asignado
      const response = await api.obtenerReportePresupuestosPendientes(inicio, fin);
      let comisiones = Array.isArray(response) ? response : response?.comisiones || [];

      if (comisiones && comisiones.length > 0) {
        // Ordenar por fecha de salida (mayor a menor - más reciente primero)
        comisiones.sort((a, b) => {
          const fechaA = new Date(a.fecha_salida);
          const fechaB = new Date(b.fecha_salida);
          return fechaB - fechaA;
        });

        // Ya están filtradas por el backend, no necesitamos filtrar aquí
        setDatos(comisiones);
        const cantidad = comisiones.length;
        const montoTotal = comisiones.reduce((sum, item) => {
          return sum + (parseFloat(item.monto_total) || 0);
        }, 0);

        setTotales({
          cantidad,
          montoTotal,
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos',
          text: 'No hay comisiones sin presupuesto asignado en el período seleccionado.',
        });
        setDatos([]);
        setTotales({ cantidad: 0, montoTotal: 0 });
      }
    } catch (err) {
      setError(`Error al generar reporte: ${err.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo generar el reporte: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Descargar PDF con estructura igual a ReportePresupuestos
  const descargarPDF = () => {
    if (!datos || datos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin datos',
        text: 'No hay datos para descargar.',
      });
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'letter');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 15;

      // Calcular texto de fechas
      let fechasTexto = '';
      if (filtroTipo === 'mes') {
        const [year, month] = mesSeleccionado.split('-');
        const meses = [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ];
        fechasTexto = `${meses[parseInt(month) - 1]} de ${year}`;
      } else {
        fechasTexto = `Del ${fechaInicio} al ${fechaFin}`;
      }

      // Encabezado
      doc.setFontSize(16);
      doc.text('Reporte de Presupuestos Pendientes', pageWidth / 2, currentY, {
        align: 'center',
      });
      currentY += 10;

      // Rango de fechas
      doc.setFontSize(11);
      doc.text(`Período: ${fechasTexto}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;

      // Fecha de generación
      doc.setFontSize(10);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`,
        pageWidth / 2,
        currentY,
        { align: 'center' }
      );
      currentY += 12;

      // Procesar cada comisión
      datos.forEach((comision, index) => {
        // Verificar si necesita nueva página
        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 15;
        }

        // Información de la comisión
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Comisión #${datos.length - index}`, 14, currentY);
        currentY += 5;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Ámbito: ${comision.ambito_nombre}`, 14, currentY);
        currentY += 4;
        // Agregar Meta si existe
        if (comision.numero_meta) {
          doc.text(`Meta: ${comision.numero_meta} - ${comision.meta_nombre || ''}`, 14, currentY);
          currentY += 4;
        }
        doc.text(`Lugar/Destino: ${comision.lugar}`, 14, currentY);
        currentY += 4;
        const periodoFecha = `Periodo: ${new Date(comision.fecha_salida).toLocaleDateString(
          'es-ES'
        )} - ${new Date(comision.fecha_retorno).toLocaleDateString('es-ES')}`;
        doc.text(periodoFecha, 14, currentY);
        currentY += 4;
        if (comision.observacion) {
          doc.text(`Observación: ${comision.observacion}`, 14, currentY);
          currentY += 6;
        }
        currentY += 4;

        // Tabla de clasificadores CON partida
        if (comision.clasificadores && comision.clasificadores.length > 0) {
          const clasificadoresData = comision.clasificadores.map((cl, index) => ({
            item: (index + 1).toString(),
            clasificador: cl.nombre,
            partida: cl.partida || '-',
            cantidad: cl.cantidad_usuarios.toString(),
            monto: `S/. ${parseFloat(cl.monto).toFixed(2)}`,
          }));

          // Calcular totales
          const totalCantidad = comision.clasificadores.reduce(
            (sum, cl) => sum + cl.cantidad_usuarios,
            0
          );
          const totalMonto = comision.clasificadores.reduce(
            (sum, cl) => sum + parseFloat(cl.monto),
            0
          );

          // Agregar fila de totales
          clasificadoresData.push({
            item: '',
            clasificador: 'TOTAL',
            partida: '-',
            cantidad: totalCantidad.toString(),
            monto: `S/. ${totalMonto.toFixed(2)}`,
          });

          autoTable(doc, {
            columns: [
              { header: 'Item', dataKey: 'item', width: 12, halign: 'center' },
              { header: 'Clasificador', dataKey: 'clasificador', width: 58 },
              { header: 'Partida', dataKey: 'partida', width: 40, halign: 'center' },
              { header: 'Cantidad', dataKey: 'cantidad', width: 25, halign: 'center' },
              { header: 'Monto (S/.)', dataKey: 'monto', width: 35, halign: 'center' },
            ],
            body: clasificadoresData,
            startY: currentY,
            theme: 'grid',
            headStyles: {
              fillColor: [70, 130, 180],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8,
              halign: 'center',
            },
            bodyStyles: {
              fontSize: 8,
            },
            alternateRowStyles: {
              fillColor: [250, 250, 250],
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
              const columnName = data.column.dataKey;
              if (columnName === 'partida' || columnName === 'cantidad') {
                data.cell.styles.halign = 'center';
              }
              if (columnName === 'monto') {
                data.cell.styles.halign = 'right';
              }
              if (data.row.index === clasificadoresData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 240, 220];
              }
            },
          });

          currentY = doc.lastAutoTable.finalY + 6;
        }

        // Tabla de Personas - Matriz por Partida
        if (comision.personas && comision.personas.length > 0) {
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('Desglose por Persona:', 14, currentY);
          currentY += 4;

          const personasNombres = [...new Set(comision.personas.map((p) => p.nombre))];
          const partidasSet = new Set();

          comision.personas.forEach((p) => {
            partidasSet.add(p.partida_clasificador);
          });

          const partidasArray = Array.from(partidasSet).sort();
          const matrizData = [];
          let totalGeneral = 0;

          personasNombres.forEach((persona, index) => {
            const row = { item: (index + 1).toString(), persona };
            let totalPersona = 0;
            let diasComision = 0;

            partidasArray.forEach((partida) => {
              const personaData = comision.personas.find(
                (p) => p.nombre === persona && p.partida_clasificador === partida
              );
              const monto = personaData?.monto || 0;
              row[`partida_${partida}`] = monto > 0 ? `S/. ${monto.toFixed(2)}` : '-';
              totalPersona += monto;

              if (personaData && diasComision === 0) {
                diasComision = personaData.dias || 0;
              }
            });

            row.dias = diasComision.toString();
            // Usar el costo_xdia de la comisión, no de la persona
            const costoXdiaComision = parseFloat(comision.costo_xdia) || 0;
            row.costoXdia = costoXdiaComision > 0 ? `S/. ${costoXdiaComision.toFixed(2)}` : '-';
            row.total = `S/. ${totalPersona.toFixed(2)}`;
            totalGeneral += totalPersona;
            matrizData.push(row);
          });

          const totalRow = { item: '', persona: 'TOTAL', dias: '', costoXdia: '' };
          partidasArray.forEach((partida) => {
            let subtotalPartida = 0;
            comision.personas.forEach((p) => {
              if (p.partida_clasificador === partida) {
                subtotalPartida += p.monto || 0;
              }
            });
            totalRow[`partida_${partida}`] = `S/. ${subtotalPartida.toFixed(2)}`;
          });
          totalRow.total = `S/. ${totalGeneral.toFixed(2)}`;
          matrizData.push(totalRow);

          const columnasMatriz = [
            { header: 'Item', dataKey: 'item', width: 12, halign: 'center' },
            { header: 'Persona', dataKey: 'persona', width: 32, halign: 'center' },
            { header: 'Días', dataKey: 'dias', width: 12, halign: 'center' },
            { header: 'Costo x Día', dataKey: 'costoXdia', width: 18, halign: 'center' },
          ];

          partidasArray.forEach((partida) => {
            columnasMatriz.push({
              header: partida.substring(0, 15),
              dataKey: `partida_${partida}`,
              width: 25,
              halign: 'center',
            });
          });

          columnasMatriz.push({
            header: 'Total',
            dataKey: 'total',
            width: 30,
            halign: 'center',
          });

          autoTable(doc, {
            columns: columnasMatriz,
            body: matrizData,
            startY: currentY,
            theme: 'grid',
            headStyles: {
              fillColor: [100, 150, 100],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7,
              valign: 'middle',
              halign: 'center',
            },
            bodyStyles: {
              fontSize: 7,
            },
            alternateRowStyles: {
              fillColor: [245, 250, 245],
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
              const columnName = data.column.dataKey;
              if (
                columnName.startsWith('partida_') ||
                columnName === 'total' ||
                columnName === 'costoXdia'
              ) {
                data.cell.styles.halign = 'right';
              }
              if (columnName === 'dias') {
                data.cell.styles.halign = 'center';
              }
              if (data.row.index === matrizData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 240, 220];
              }
            },
          });

          currentY = doc.lastAutoTable.finalY + 6;
        }

        // Subtotal de comisión
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`Subtotal: S/. ${parseFloat(comision.monto_total).toFixed(2)}`, 14, currentY);
        currentY += 8;
      });

      // RESUMEN DETALLADO POR META
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('RESUMEN DETALLADO POR META', pageWidth / 2, currentY, {
        align: 'center',
      });
      currentY += 8;
      doc.setTextColor(0, 0, 0);

      // Agrupar comisiones por Meta
      const comisionesPorMeta = {};

      datos.forEach((comision) => {
        const metaKey = comision.numero_meta
          ? `${comision.numero_meta} - ${comision.meta_nombre}`
          : 'SIN META';
        if (!comisionesPorMeta[metaKey]) {
          comisionesPorMeta[metaKey] = [];
        }
        comisionesPorMeta[metaKey].push(comision);
      });

      // Para cada Meta
      Object.keys(comisionesPorMeta)
        .sort()
        .forEach((metaKey) => {
          const comisionesDelaMeta = comisionesPorMeta[metaKey];

          // Verificar si necesita nueva página
          if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 15;
          }

          // Título de la Meta
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(70, 130, 180);
          doc.text(`META: ${metaKey}`, 14, currentY);
          currentY += 6;
          doc.setTextColor(0, 0, 0);

          // Recopilar partidas para esta Meta
          const partidasDelaMeta = new Set();
          comisionesDelaMeta.forEach((comision) => {
            comision.clasificadores.forEach((clasificador) => {
              const personasDelClasificador = comision.personas.filter(
                (p) => p.clasificador === clasificador.nombre
              );
              if (personasDelClasificador.length > 0) {
                partidasDelaMeta.add(personasDelClasificador[0].partida_clasificador);
              }
            });
          });

          const partidasArrayMeta = Array.from(partidasDelaMeta).sort();

          // Crear filas para las comisiones de esta Meta
          const comisionesResumenMeta = [];
          comisionesDelaMeta.forEach((comision, index) => {
            const costoXdiaVal = parseFloat(comision.costo_xdia) || 0;
            const row = {
              item: (index + 1).toString(),
              comision: `${comision.lugar} (${comision.ambito_nombre})`,
              fechaInicio: new Date(comision.fecha_salida).toLocaleDateString('es-ES'),
              fechaFin: new Date(comision.fecha_retorno).toLocaleDateString('es-ES'),
              costoXdia: costoXdiaVal > 0 ? `S/. ${costoXdiaVal.toFixed(2)}` : '-',
            };
            let totalComision = 0;

            // Para cada partida, obtener monto
            partidasArrayMeta.forEach((partida) => {
              let montoPartida = 0;
              comision.personas.forEach((p) => {
                if (p.partida_clasificador === partida) {
                  montoPartida += p.monto || 0;
                }
              });
              row[`partida_${partida}`] = montoPartida > 0 ? `S/. ${montoPartida.toFixed(2)}` : '-';
              totalComision += montoPartida;
            });

            row.total = `S/. ${totalComision.toFixed(2)}`;
            comisionesResumenMeta.push(row);
          });

          // Fila de totales de la Meta
          const totalRowMeta = { item: '', comision: 'TOTAL META', fechaInicio: '', fechaFin: '', costoXdia: '' };
          let totalGeneralMeta = 0;
          partidasArrayMeta.forEach((partida) => {
            let subtotalPartida = 0;
            comisionesDelaMeta.forEach((comision) => {
              comision.personas.forEach((p) => {
                if (p.partida_clasificador === partida) {
                  subtotalPartida += p.monto || 0;
                }
              });
            });
            totalRowMeta[`partida_${partida}`] =
              subtotalPartida > 0 ? `S/. ${subtotalPartida.toFixed(2)}` : '-';
            totalGeneralMeta += subtotalPartida;
          });
          totalRowMeta.total = `S/. ${totalGeneralMeta.toFixed(2)}`;
          comisionesResumenMeta.push(totalRowMeta);

          // Construir columnas para esta Meta
          const columnasResumenMeta = [
            { header: 'Item', dataKey: 'item', width: 10, halign: 'center' },
            { header: 'Comisión', dataKey: 'comision', width: 35 },
            { header: 'Inicio', dataKey: 'fechaInicio', width: 14, halign: 'center' },
            { header: 'Fin', dataKey: 'fechaFin', width: 14, halign: 'center' },
            { header: 'Costo x Día', dataKey: 'costoXdia', width: 16, halign: 'center' },
          ];

          partidasArrayMeta.forEach((partida) => {
            columnasResumenMeta.push({
              header: partida.substring(0, 10),
              dataKey: `partida_${partida}`,
              width: 18,
              halign: 'center',
            });
          });

          columnasResumenMeta.push({
            header: 'Total',
            dataKey: 'total',
            width: 22,
            halign: 'center',
          });

          autoTable(doc, {
            columns: columnasResumenMeta,
            body: comisionesResumenMeta,
            startY: currentY,
            theme: 'grid',
            headStyles: {
              fillColor: [100, 150, 100],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7,
              valign: 'middle',
              halign: 'center',
            },
            bodyStyles: {
              fontSize: 7,
            },
            alternateRowStyles: {
              fillColor: [245, 250, 245],
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
              const columnName = data.column.dataKey;
              if (columnName.startsWith('partida_') || columnName === 'total') {
                data.cell.styles.halign = 'right';
              }
              if (data.row.index === comisionesResumenMeta.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 240, 220];
              }
            },
          });

          currentY = doc.lastAutoTable.finalY + 8;
        });

      // Calcular totalGeneral de todas las metas
      let totalGeneral = 0;
      Object.keys(comisionesPorMeta).forEach((metaKey) => {
        const comisionesDelaMeta = comisionesPorMeta[metaKey];
        comisionesDelaMeta.forEach((comision) => {
          comision.personas.forEach((p) => {
            totalGeneral += p.monto || 0;
          });
        });
      });

      // RESUMEN GENERAL DEL REPORTE
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('RESUMEN GENERAL DEL REPORTE', pageWidth / 2, currentY, {
        align: 'center',
      });
      currentY += 10;
      doc.setTextColor(0, 0, 0);

      // Tabla resumen
      const resumenData = [
        { concepto: 'Cantidad de Comisiones', valor: datos.length.toString() },
        {
          concepto: 'Cantidad Total de Comisionados',
          valor: datos.reduce((sum, c) => sum + (c.cantidad_comisionados || 0), 0).toString(),
        },
        { concepto: 'Monto Total', valor: `S/. ${totalGeneral.toFixed(2)}` },
        {
          concepto: 'Fecha de Generación',
          valor: new Date().toLocaleDateString('es-ES'),
        },
      ];

      autoTable(doc, {
        columns: [
          { header: 'Concepto', dataKey: 'concepto', width: 80 },
          { header: 'Valor', dataKey: 'valor', width: 60, halign: 'right' },
        ],
        body: resumenData,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [100, 150, 100],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 250, 245],
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.column.dataKey === 'valor') {
            data.cell.styles.halign = 'right';
          }
        },
      });

      const nombreArchivo = `Reporte_Presupuestos_Pendientes_${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'Descargado',
        text: 'El reporte se descargó correctamente.',
      });
    } catch (err) {
      console.error('Error descargando PDF:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo descargar el PDF: ${err.message}`,
      });
    }
  };

  // Tabla
  const tablaColumnas = [
    {
      Header: 'Item',
      accessor: 'item',
      width: '5%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        return row.index + 1;
      },
    },
    { Header: 'Ámbito', accessor: 'ambito_nombre', width: '12%' },
    { Header: 'Lugar', accessor: 'lugar', width: '12%' },
    { Header: 'Modalidad', accessor: 'modalidad_viaje', width: '11%' },
    {
      Header: 'Fecha Salida',
      accessor: 'fecha_salida',
      width: '11%',
      Cell: ({ row }) => {
        const fecha = row.original.fecha_salida;
        return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-';
      },
    },
    {
      Header: 'Fecha Retorno',
      accessor: 'fecha_retorno',
      width: '11%',
      Cell: ({ row }) => {
        const fecha = row.original.fecha_retorno;
        return fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-';
      },
    },
    { Header: 'Días', accessor: 'num_dias', width: '7%' },
    { Header: 'Costo/Día', accessor: 'costo_xdia', width: '11%' },
    { Header: 'Total', accessor: 'monto_total', width: '11%' },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox mb={3}>
          <Card>
            <MDBox p={3}>
              <MDTypography variant="h5" gutterBottom>
                Reporte de Comisiones - Presupuestos Pendientes
              </MDTypography>

              {error && <Alert severity="error">{error}</Alert>}

              <MDBox display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{ mt: 2, mb: 2 }}>
                <Autocomplete
                  options={[
                    { label: 'Por Mes', value: 'mes' },
                    { label: 'Por Rango de Fechas', value: 'rango' },
                  ]}
                  getOptionLabel={(option) => option.label}
                  value={
                    filtroTipo === 'mes'
                      ? { label: 'Por Mes', value: 'mes' }
                      : { label: 'Por Rango de Fechas', value: 'rango' }
                  }
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setFiltroTipo(newValue.value);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tipo de Filtro"
                      placeholder="Selecciona filtro..."
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  noOptionsText="Sin opciones disponibles"
                />

                {filtroTipo === 'mes' ? (
                  <TextField
                    label="Mes"
                    type="month"
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                  />
                ) : (
                  <>
                    <TextField
                      label="Fecha Inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Fecha Fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                    />
                  </>
                )}
              </MDBox>

              <MDBox display="flex" gap={2} sx={{ mb: 2 }}>
                <MDButton
                  variant="contained"
                  color="info"
                  onClick={generarReporte}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                >
                  {loading ? 'Generando...' : 'Generar Reporte'}
                </MDButton>

                <MDButton
                  variant="contained"
                  color="success"
                  onClick={descargarPDF}
                  disabled={loading || datos.length === 0}
                  startIcon={<GetAppIcon />}
                >
                  Descargar PDF
                </MDButton>
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

        {/* Tabla de datos */}
        {datos.length > 0 && (
          <MDBox>
            <Card>
              <MDBox p={3}>
                <DataTable
                  table={{
                    columns: tablaColumnas,
                    rows: datos,
                  }}
                  canSearch
                  isSorted
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries
                  noEndBorder
                />

                {/* Resumen */}
                <MDBox
                  sx={{
                    backgroundColor: '#f5f7fa',
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    mt: 3,
                  }}
                >
                  <MDBox display="flex" justifyContent="space-between" alignItems="center">
                    <MDBox>
                      <MDTypography variant="h6" fontWeight="bold">
                        Resumen del Reporte
                      </MDTypography>
                    </MDBox>
                    <MDBox display="flex" gap={4}>
                      <MDBox>
                        <MDTypography variant="caption" color="text">
                          Total de Comisiones
                        </MDTypography>
                        <MDTypography variant="h5" color="info" fontWeight="bold">
                          {totales.cantidad}
                        </MDTypography>
                      </MDBox>
                      <MDBox>
                        <MDTypography variant="caption" color="text">
                          Monto Total Pendiente
                        </MDTypography>
                        <MDTypography variant="h5" color="error" fontWeight="bold">
                          S/. {totales.montoTotal.toFixed(2)}
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </MDBox>
                </MDBox>
              </MDBox>
            </Card>
          </MDBox>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ReportePresupuestoPendiente;
