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

function ReportePresupuestos() {
  const [filtroTipo, setFiltroTipo] = useState('mes'); // 'mes' o 'rango'
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
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
        // Mes seleccionado
        const [year, month] = mesSeleccionado.split('-');
        inicio = `${year}-${month}-01`;
        // Último día del mes
        const ultimoDia = new Date(year, month, 0).getDate();
        fin = `${year}-${month}-${ultimoDia}`;
      } else {
        // Rango personalizado
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

      // Llamar API para obtener datos
      const response = await api.obtenerReportePresupuestos(inicio, fin);

      // Extraer array de comisiones (puede venir como array directo o dentro de { comisiones })
      let comisiones = Array.isArray(response) ? response : response?.comisiones || [];

      if (comisiones && comisiones.length > 0) {
        // Ordenar por fecha de salida (mayor a menor - más reciente primero)
        comisiones.sort((a, b) => {
          const fechaA = new Date(a.fecha_salida);
          const fechaB = new Date(b.fecha_salida);
          return fechaB - fechaA;
        });

        // Mostrar todas las comisiones sin filtrar
        const datosFiltered = comisiones;

        if (datosFiltered && datosFiltered.length > 0) {
          setDatos(datosFiltered);
          // Calcular totales
          const cantidad = datosFiltered.length;
          const montoTotal = datosFiltered.reduce((sum, item) => {
            return sum + (parseFloat(item.monto_total) || 0);
          }, 0);

          setTotales({
            cantidad,
            montoTotal,
          });
        } else {
          setDatos([]);
          setTotales({ cantidad: 0, montoTotal: 0 });
          Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: 'No hay presupuestos en este período.',
          });
        }
      } else {
        setDatos([]);
        setTotales({ cantidad: 0, montoTotal: 0 });
        Swal.fire({
          icon: 'info',
          title: 'Sin resultados',
          text: 'No hay presupuestos asignados en este período.',
        });
      }
    } catch (err) {
      console.error('Error al generar reporte:', err);
      setError(err.response?.data?.error || err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.error || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generar PDF con desglose por clasificador
  const generarPDF = () => {
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
      doc.text('Reporte de Presupuestos Asignados', pageWidth / 2, currentY, {
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
      datos.forEach((comision, idx) => {
        // Verificar si necesita nueva página
        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 15;
        }

        // Información de la comisión
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Comisión #${datos.length - idx}`, 14, currentY);
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
        const docCutText = `Documento: ${comision.presupuesto_documento} | CUT: ${comision.presupuesto_numero_cut}`;
        doc.text(docCutText, 14, currentY);
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
          const clasificadoresData = comision.clasificadores.map((cl, index) => {
            // Buscar la partida del clasificador en los datos de personas
            const personasDelClasificador = comision.personas.filter(
              (p) => p.clasificador === cl.nombre
            );
            const partida =
              personasDelClasificador.length > 0
                ? personasDelClasificador[0].partida_clasificador
                : '-';

            return {
              item: (index + 1).toString(),
              clasificador: cl.nombre,
              partida: partida,
              cantidad: cl.cantidad_usuarios.toString(),
              monto: `S/. ${parseFloat(cl.monto).toFixed(2)}`,
            };
          });

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
            didParseCell: function (data) {
              const columnName = data.column.dataKey;
              // Partida, Cantidad al centro
              if (columnName === 'partida' || columnName === 'cantidad') {
                data.cell.styles.halign = 'center';
              }
              // Monto a la derecha
              if (columnName === 'monto') {
                data.cell.styles.halign = 'right';
              }
              // Resaltar fila de totales
              if (data.row.index === clasificadoresData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 240, 220];
              }
            },
          });

          currentY = doc.lastAutoTable.finalY + 6;
        }

        // Tabla de Personas - Matriz por Partida (compacta)
        if (comision.personas && comision.personas.length > 0) {
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text('Desglose por Persona:', 14, currentY);
          currentY += 4;

          // Construir matriz: Filas = Personas, Columnas = Partidas (no nombres)
          const personasNombres = [...new Set(comision.personas.map((p) => p.nombre))];
          const partidasSet = new Set();

          comision.personas.forEach((p) => {
            partidasSet.add(p.partida_clasificador);
          });

          const partidasArray = Array.from(partidasSet).sort();
          const matrizData = [];
          let totalGeneral = 0;

          // Crear fila para cada persona
          personasNombres.forEach((persona, index) => {
            const row = { item: (index + 1).toString(), persona };
            let totalPersona = 0;
            let diasComision = 0;

            // Para cada partida, obtener el monto y otros datos
            partidasArray.forEach((partida) => {
              const personaData = comision.personas.find(
                (p) => p.nombre === persona && p.partida_clasificador === partida
              );
              const monto = personaData?.monto || 0;
              row[`partida_${partida}`] = monto > 0 ? `S/. ${monto.toFixed(2)}` : '-';
              totalPersona += monto;

              // Obtener días de la primera coincidencia
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

          // Fila de totales
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

          // Construir columnas: Item + Persona + Partidas + Total
          const columnasMatriz = [
            {
              header: 'Item',
              dataKey: 'item',
              width: 12,
              halign: 'center',
            },
            {
              header: 'Persona',
              dataKey: 'persona',
              width: 32,
              halign: 'center',
            },
            {
              header: 'Días',
              dataKey: 'dias',
              width: 12,
              halign: 'center',
            },
            {
              header: 'Costo x Día',
              dataKey: 'costoXdia',
              width: 18,
              halign: 'center',
            },
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
            didParseCell: function (data) {
              const columnName = data.column.dataKey;
              // Alinear partidas, total y costoXdia a la derecha
              if (
                columnName.startsWith('partida_') ||
                columnName === 'total' ||
                columnName === 'costoXdia'
              ) {
                data.cell.styles.halign = 'right';
              }
              // Centrar columna de Días
              if (columnName === 'dias') {
                data.cell.styles.halign = 'center';
              }
              // Resaltar fila de totales
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
              comisionados: (comision.cantidad_comisionados || 0).toString(),
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
          const totalRowMeta = {
            item: '',
            comision: 'TOTAL META',
            fechaInicio: '',
            fechaFin: '',
            comisionados: comisionesDelaMeta
              .reduce((sum, c) => sum + (c.cantidad_comisionados || 0), 0)
              .toString(),
            costoXdia: '',
          };
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
            { header: 'Comisión', dataKey: 'comision', width: 28 },
            { header: 'Inicio', dataKey: 'fechaInicio', width: 12, halign: 'center' },
            { header: 'Fin', dataKey: 'fechaFin', width: 12, halign: 'center' },
            { header: 'Comisionados', dataKey: 'comisionados', width: 12, halign: 'center' },
            { header: 'Costo x Día', dataKey: 'costoXdia', width: 14, halign: 'center' },
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
            width: 20,
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
      let totalGeneralReporte = 0;
      Object.keys(comisionesPorMeta).forEach((metaKey) => {
        const comisionesDelaMeta = comisionesPorMeta[metaKey];
        comisionesDelaMeta.forEach((comision) => {
          comision.personas.forEach((p) => {
            totalGeneralReporte += p.monto || 0;
          });
        });
      });

      // Resumen final - Mejorado
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 15;
      }

      // Cuadro de resumen general
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.rect(12, currentY, pageWidth - 24, 50);

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('RESUMEN GENERAL DEL REPORTE', pageWidth / 2, currentY + 6, {
        align: 'center',
      });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      currentY += 12;
      doc.text(`Total de Comisiones: ${totales.cantidad}`, 18, currentY);
      currentY += 6;
      const totalComisionados = datos.reduce((sum, c) => sum + c.cantidad_comisionados, 0);
      doc.text(`Total de Comisionados: ${totalComisionados}`, 18, currentY);
      currentY += 6;
      doc.text(`Período: ${fechasTexto}`, 18, currentY);
      currentY += 6;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text(`Monto Total Presupuestado: S/. ${totales.montoTotal.toFixed(2)}`, 18, currentY);

      currentY += 12;

      // Footer con números de página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: 'center',
        });
      }

      // Guardar PDF
      doc.save(`Reporte_Presupuestos_${new Date().getTime()}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'PDF Generado',
        text: 'El reporte ha sido descargado correctamente.',
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el PDF: ' + err.message,
      });
    }
  };

  // Preparar datos para DataTable
  const columnasTabla = [
    {
      Header: 'Item',
      accessor: 'item',
      disableSortBy: true,
      width: '5%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        return row.index + 1;
      },
    },
    { Header: 'Ámbito', accessor: 'ambito_nombre', width: '14%' },
    {
      Header: 'Lugar',
      accessor: 'lugar',
      width: '16%',
      // eslint-disable-next-line react/prop-types,react/display-name
      Cell: ({ row: { original } }) => {
        // eslint-disable-next-line react/prop-types
        const texto = original.lugar || '';
        const partes = String(texto).split(/,s*|s+Ys+/).map((p) => p.trim()).filter(Boolean);
        const extra = Math.max(partes.length - 2, 0);
        return (
          <MDTypography
            variant="button"
            display="block"
            title={texto}
            sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {partes.slice(0, 2).join(', ')}
            {extra > 0 ? ` (+${extra} más)` : ''}
          </MDTypography>
        );
      },
    },
    { Header: 'Modalidad', accessor: 'modalidad_viaje', width: '12%' },
    {
      Header: 'Período',
      accessor: 'fecha_salida',
      width: '15%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => {
        // eslint-disable-next-line react/prop-types
        const fechaSalida = row.original.fecha_salida;
        // eslint-disable-next-line react/prop-types
        const fechaRetorno = row.original.fecha_retorno;
        const dmy = (v) => {
          const [a, m, d] = String(v).slice(0, 10).split('-');
          return a && m && d ? `${d}/${m}/${a}` : '-';
        };
        if (!fechaSalida || !fechaRetorno) return '-';
        return (
          <MDBox lineHeight={1.3}>
            <MDTypography variant="button" display="block" sx={{ whiteSpace: 'nowrap' }}>{dmy(fechaSalida)}</MDTypography>
            <MDTypography variant="caption" color="text" display="block" sx={{ whiteSpace: 'nowrap' }}>al {dmy(fechaRetorno)}</MDTypography>
          </MDBox>
        );
      },
    },
    { Header: 'Documento', accessor: 'presupuesto_documento', width: '15%' },
    { Header: 'CUT', accessor: 'presupuesto_numero_cut', width: '11%' },
    {
      Header: 'Monto',
      accessor: 'monto_total',
      width: '12%',
      // eslint-disable-next-line react/prop-types
      Cell: ({ row }) => {
        const v = Number(row.original.monto_total || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return <MDTypography variant="button" fontWeight="bold" color="dark">{v}</MDTypography>;
      },
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
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
          >
            <MDBox>
              <MDTypography variant="h6" color="white" fontWeight="medium" sx={{ textTransform: 'uppercase' }}>
                Reporte de Presupuestos Asignados
              </MDTypography>
              <MDTypography variant="button" color="white" opacity={0.8}>
                Consulte el presupuesto asignado por meta y fuente de financiamiento.
              </MDTypography>
            </MDBox>
          </MDBox>

          <MDBox p={3}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Filtros */}
            <MDBox sx={{ mb: 3 }}>
              <MDBox display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} sx={{ mb: 2 }}>
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

                {filtroTipo === 'mes' && (
                  <TextField
                    label="Selecciona Mes"
                    type="month"
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}

                {filtroTipo === 'rango' && (
                  <>
                    <TextField
                      label="Fecha Inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fecha Fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
              </MDBox>

              <MDBox display="flex" gap={1}>
                <MDButton
                  variant="contained"
                  color="info"
                  onClick={generarReporte}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Generar Reporte'}
                </MDButton>

                {datos.length > 0 && (
                  <>
                    <MDButton
                      variant="contained"
                      color="success"
                      startIcon={<PrintIcon />}
                      onClick={() => setOpenPreview(true)}
                    >
                      Vista Previa
                    </MDButton>
                    <MDButton
                      variant="contained"
                      color="error"
                      startIcon={<GetAppIcon />}
                      onClick={generarPDF}
                    >
                      Descargar PDF
                    </MDButton>
                  </>
                )}
              </MDBox>
            </MDBox>

            {/* Tabla */}
            {datos.length > 0 && (
              <>
                <MDBox sx={{ mb: 3 }}>
                  <DataTable
                    table={{
                      columns: columnasTabla,
                      rows: datos,
                    }}
                    canSearch
                    isSorted={true}
                    entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                    showTotalEntries
                    noEndBorder
                    vistaMovil
                  />
                </MDBox>

                {/* Resumen */}
                <MDBox
                  sx={{
                    backgroundColor: '#f5f7fa',
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
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
                          Monto Total Asignado
                        </MDTypography>
                        <MDTypography variant="h5" color="success" fontWeight="bold">
                          S/. {totales.montoTotal.toFixed(2)}
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </MDBox>
                </MDBox>
              </>
            )}
            {!loading && datos.length === 0 && !error && (
              <MDBox textAlign="center" py={5}>
                <MDTypography variant="body2" color="text">
                  No hay datos. Completa los filtros y haz clic en &quot;Generar Reporte&quot;
                </MDTypography>
              </MDBox>
            )}
          </MDBox>
        </Card>
      </MDBox>

      <Footer />
    </DashboardLayout>
  );
}

export default ReportePresupuestos;
