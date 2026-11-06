/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Swal from 'sweetalert2';
import MDBox from 'components/MDBox';
import MDButton from 'components/MDButton';
import MDTypography from 'components/MDTypography';
import MDBadge from 'components/MDBadge';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import api from 'services/api';
import { useAuth } from 'context/AuthContext'; // 🆕 Importar useAuth

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

function GestionComisiones() {
  const { usuario: usuarioLogueado } = useAuth(); // 🆕 Obtener usuario del contexto
  const [items, setItems] = useState([]);
  const [ambitos, setAmbitos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clasificadores, setClasificadores] = useState([]);
  const [metas, setMetas] = useState([]);
  const [costosViaje, setCostosViaje] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [pageDetalle, setPageDetalle] = useState(1); // Para paginación del modal
  const [comisionSeleccionada, setComisionSeleccionada] = useState(null);
  const [formData, setFormData] = useState({
    ambito_id: '',
    meta_id: '',
    costo_viaje_id: '',
    lugar: '',
    ruta: '',
    modalidad_viaje: 'TERRESTRE',
    fecha_salida: '',
    fecha_retorno: '',
    num_dias: '',
    costo_xdia: '220',
    observacion: '',
    estado: 'activa',
    presupuesto_estado: 'PRESUPUESTO POR ASIGNAR',
    presupuesto_documento: '',
  });
  const [comisionados, setComisionados] = useState([]);
  const [comisionadosAEliminar, setComisionadosAEliminar] = useState([]);
  const [comisionadoForm, setComisionadoForm] = useState({
    usuario_id: '',
    clasificador_id: '',
    dias: '',
    costo_xdia: '',
    descripcion: '',
    observacion: '',
  });
  const [openEditComisionado, setOpenEditComisionado] = useState(false);
  const [editingComisionadoId, setEditingComisionadoId] = useState(null);
  const [openPresupuesto, setOpenPresupuesto] = useState(false);
  const [comisionPresupuesto, setComisionPresupuesto] = useState(null);
  const [presupuestoForm, setPresupuestoForm] = useState({
    presupuesto_documento: '',
    presupuesto_numero_cut: '',
    presupuesto_fecha: '',
  });
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [success, setSuccess] = useState('');
  const [comisionesSeleccionadas, setComisionesSeleccionadas] = useState([]);
  const [openPresupuestoMasivo, setOpenPresupuestoMasivo] = useState(false);
  const [presupuestoMasivoForm, setPresupuestoMasivoForm] = useState({
    presupuesto_documento: '',
    presupuesto_numero_cut: '',
    presupuesto_fecha: '',
  });
  const solicitanteInputRef = useRef(null);

  useEffect(() => {
    cargarAmbitos();
    cargarUsuarios();
    cargarClasificadores();
    cargarMetas();
    cargarCostosViaje();
  }, []);

  useEffect(() => {
    // Una vez que los ámbitos estén cargados, cargar las comisiones
    if (ambitos.length > 0) {
      cargarItems();
    }
  }, [ambitos]);

  const cargarAmbitos = async () => {
    try {
      const response = await api.obtenerAmbitos();
      setAmbitos(response);
    } catch (err) {
      console.error('Error cargando ámbitos:', err.message);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await api.obtenerUsuariosActivos();
      setUsuarios(response);
    } catch (err) {
      console.error('Error cargando usuarios:', err.message);
    }
  };

  const cargarClasificadores = async () => {
    try {
      const response = await api.obtenerClasificadores();
      setClasificadores(response);
    } catch (err) {
      console.error('Error cargando clasificadores:', err.message);
    }
  };

  const cargarMetas = async () => {
    try {
      const response = await api.obtenerMetas();
      setMetas(response);
    } catch (err) {
      console.error('Error cargando metas:', err.message);
    }
  };

  const cargarCostosViaje = async () => {
    try {
      const response = await api.obtenerCostosViaje();
      setCostosViaje(response);
    } catch (err) {
      console.error('Error cargando costos de viaje:', err.message);
    }
  };

  const cargarItems = async () => {
    try {
      setLoading(true);
      const response = await api.obtenerComisiones();

      // 🆕 Obtener datos del usuario actual del contexto de autenticación
      const usuario = usuarioLogueado;
      const userRol = usuario?.rol || '';
      const userAmbitoId = usuario?.ambito_id || null;
      const userId = usuario?.id || null;

      console.log('👤 Usuario cargando comisiones:', usuario?.nombre, '- Rol:', userRol);

      // Ordenar por fecha de salida (mayor a menor - más reciente primero)
      let comisionesordenadas = (response || []).sort((a, b) => {
        const fechaA = new Date(a.fecha_salida);
        const fechaB = new Date(b.fecha_salida);
        return fechaB - fechaA;
      });

      // ========== FILTRADO POR USUARIO Y AMBITO ==========
      // Admin: ve todas las comisiones
      if (userRol === 'admin') {
        // Sin filtro - ve todo
      } 
      // Administrativo/Jefe: ver según su ámbito y los usuarios asignados a esa comisión
      else if (userRol === 'administrativo' || userRol === 'jefe') {
        if (userAmbitoId) {
          // Obtener los ámbitos permitidos
          const ambitoUsuario = ambitos.find(a => a.id === userAmbitoId);
          let ambitosPermitidos = [userAmbitoId];

          if (ambitoUsuario && ambitoUsuario.dependencia_id === null) {
            // Es una AAA (sin dependencia) - incluir AAA + sus ALAs
            const alasDelAAA = ambitos
              .filter(a => a.dependencia_id === userAmbitoId)
              .map(a => a.id);
            ambitosPermitidos = [userAmbitoId, ...alasDelAAA];
          }
          // Si es ALA, solo su propio ámbito

          console.log('🔍 DEBUG FILTRADO ADMINISTRATIVO:');
          console.log('   Usuario:', usuario.username, 'Ámbito ID:', userAmbitoId);
          console.log('   Ámbito Tipo:', ambitoUsuario?.dependencia_id === null ? 'AAA' : 'ALA');
          console.log('   Ámbitos Permitidos:', ambitosPermitidos);

          // Filtrar comisiones: una comisión se muestra si ALGUNO de sus comisionados
          // pertenece a un ámbito permitido del usuario administrativo
          comisionesordenadas = await Promise.all(
            comisionesordenadas.map(async (comision) => {
              try {
                const comisionados = await api.obtenerComisionados(comision.id);
                
                // Si un comisionado NO tiene ambito_id, asignarle el de la comisión
                const comisionadosConAmbito = comisionados.map(c => ({
                  ...c,
                  ambito_id: c.ambito_id || comision.ambito_id
                }));

                console.log(`   Comisión ${comision.id} (${comision.lugar}):`, 
                  comisionadosConAmbito.map(c => ({ usuario: c.usuario_nombre, ambito_id: c.ambito_id }))
                );

                // Verificar si al menos UN comisionado está en un ámbito permitido
                const tieneComisionadoPermitido = comisionadosConAmbito.some(c => 
                  ambitosPermitidos.includes(c.ambito_id)
                );

                console.log(`      ¿Tiene comisionado permitido? ${tieneComisionadoPermitido ? '✅' : '❌'}`);

                return tieneComisionadoPermitido ? comision : null;
              } catch (err) {
                console.error(`Error cargando comisionados de comisión ${comision.id}:`, err);
                return null;
              }
            })
          );
          // Filtrar los nulos
          comisionesordenadas = comisionesordenadas.filter(c => c !== null);
          console.log(`   TOTAL comisiones filtradas: ${comisionesordenadas.length}`);
        }
      }
      // Usuario regular: solo ve sus propias comisiones
      else if (userRol === 'usuario') {
        console.log('👤 Filtrando comisiones para usuario regular:', usuario.nombre);
        console.log('   userId:', userId);
        console.log('   Total comisiones antes de filtrar:', comisionesordenadas.length);
        
        // Cargar comisionados de cada comisión y verificar si el usuario aparece
        comisionesordenadas = await Promise.all(
          comisionesordenadas.map(async (comision) => {
            try {
              const comisionados = await api.obtenerComisionados(comision.id);
              console.log(`   📌 Comisión ${comision.id} (${comision.lugar}):`);
              console.log(`      Comisionados IDs:`, comisionados.map(c => ({ id: c.usuario_id, nombre: c.usuario_nombre })));
              
              // Si el usuario aparece en los comisionados, incluir la comisión
              const usuarioEncomisionados = comisionados.some(c => c.usuario_id === userId);
              console.log(`      ¿Usuario ${userId} está en comisionados? ${usuarioEncomisionados ? '✅' : '❌'}`);
              
              if (usuarioEncomisionados) {
                console.log(`      ✅ INCLUIDA`);
              }
              return usuarioEncomisionados ? comision : null;
            } catch (err) {
              console.error(`Error cargando comisionados de comisión ${comision.id}:`, err);
              return null;
            }
          })
        );
        // Filtrar los nulos
        comisionesordenadas = comisionesordenadas.filter(c => c !== null);
        console.log(`   📊 TOTAL comisiones después de filtrar: ${comisionesordenadas.length}`);
      }

      // Asegurar que cada comisión tenga ambito_nombre
      const comisionesConAmbito = comisionesordenadas.map((comision) => {
        if (comision.ambito_id && !comision.ambito_nombre) {
          const ambitoEncontrado = ambitos.find((a) => a.id === comision.ambito_id);
          if (ambitoEncontrado) {
            return { ...comision, ambito_nombre: ambitoEncontrado.nombre_corto || ambitoEncontrado.nombre };
          }
        }
        return comision;
      });

      setItems(comisionesConAmbito);
    } catch (err) {
      console.error('Error cargando comisiones:', err.message);
      setError('Error cargando comisiones');
    } finally {
      setLoading(false);
    }
  };

  const cargarComisionados = async (comisionId) => {
    try {
      const response = await api.obtenerComisionados(comisionId);
      setComisionados(response);
    } catch (err) {
      console.error('Error cargando comisionados:', err.message);
    }
  };

  // Recargar la comisión completa del backend (para actualizar costo_total_comision)
  const recargarComisionCompleta = async (comisionId) => {
    try {
      const response = await api.obtenerComision(comisionId);
      // Asegurar que ambito_nombre esté presente
      if (response.ambito_id && !response.ambito_nombre) {
        const ambitoEncontrado = ambitos.find((a) => a.id === response.ambito_id);
        if (ambitoEncontrado) {
          response.ambito_nombre = ambitoEncontrado.nombre;
        }
      }
      // Actualizar la comisión en la tabla principal con los datos frescos
      setItems((prevItems) => prevItems.map((c) => (c.id === comisionId ? response : c)));
      return response;
    } catch (err) {
      console.error('Error recargando comisión completa:', err.message);
    }
  };

  // Función helper para parsear fechas correctamente (sin considerar zona horaria)
  const parsearFechaLocal = (fechaString) => {
    if (!fechaString) return null;
    // Si es un string ISO como "2026-02-22" o "2026-02-22T05:00:00.000Z"
    // Extraemos solo la parte de fecha YYYY-MM-DD
    const partes = fechaString.split('T')[0].split('-');
    if (partes.length === 3) {
      const [year, month, day] = partes;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(fechaString);
  };

  const calcularDias = (fechaSalida, fechaRetorno) => {
    if (!fechaSalida || !fechaRetorno) return '';
    // Parsear las fechas como fecha local, no UTC
    const [ySalida, mSalida, dSalida] = fechaSalida.split('-');
    const [yRetorno, mRetorno, dRetorno] = fechaRetorno.split('-');
    const salida = new Date(parseInt(ySalida), parseInt(mSalida) - 1, parseInt(dSalida));
    const retorno = new Date(parseInt(yRetorno), parseInt(mRetorno) - 1, parseInt(dRetorno));
    const diffTime = Math.abs(retorno - salida);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
    return diffDays;
  };

  const handleFechaSalidaChange = (e) => {
    const nuevaFecha = e.target.value;
    const nuevoFormData = { ...formData, fecha_salida: nuevaFecha };
    if (formData.fecha_retorno) {
      nuevoFormData.num_dias = calcularDias(nuevaFecha, formData.fecha_retorno);
      setComisionadoForm({ ...comisionadoForm, dias: nuevoFormData.num_dias });
    }
    setFormData(nuevoFormData);
  };

  const handleFechaRetornoChange = (e) => {
    const nuevaFecha = e.target.value;
    const nuevoFormData = { ...formData, fecha_retorno: nuevaFecha };
    if (formData.fecha_salida) {
      nuevoFormData.num_dias = calcularDias(formData.fecha_salida, nuevaFecha);
      setComisionadoForm({ ...comisionadoForm, dias: nuevoFormData.num_dias });
    }
    setFormData(nuevoFormData);
  };

  const handleAgregarComisionado = () => {
    if (!comisionadoForm.usuario_id || !comisionadoForm.clasificador_id) {
      setModalError('Usuario y Partida son requeridos');
      return;
    }

    // Validar que no exista un comisionado con el mismo usuario y partida
    const duplicado = comisionados.some(
      (c) =>
        c.usuario_id === comisionadoForm.usuario_id &&
        c.clasificador_id === comisionadoForm.clasificador_id
    );

    if (duplicado) {
      setModalError('Este usuario y partida ya han sido agregados');
      return;
    }

    const dias = parseInt(comisionadoForm.dias) || 0;
    const costo = parseFloat(comisionadoForm.costo_xdia) || 0;

    // Obtener la partida seleccionada
    const partida = clasificadores.find((c) => c.id === comisionadoForm.clasificador_id);
    // Detectar viáticos por "asignaciones" o "viático" combinado
    const esViatico =
      partida &&
      partida.nombre &&
      (partida.nombre.toLowerCase().includes('asignaciones') ||
        (partida.nombre.toLowerCase().includes('viático') &&
          !partida.nombre.toLowerCase().includes('terrestre') &&
          !partida.nombre.toLowerCase().includes('aéreo') &&
          !partida.nombre.toLowerCase().includes('fluvial')));

    // Lógica de cálculo de monto:
    // - "Viáticos Y Asignaciones Por Comisión De Servicio": Monto = días × costo_xdia (multiplica)
    // - Otras partidas: Monto = costo_xdia × 1 (sin multiplicar)
    const monto = esViatico ? dias * costo : costo;

    // Construir el objeto del nuevo comisionado y añadirlo a la lista local
    const usuarioSeleccionado = usuarios.find((u) => u.id === comisionadoForm.usuario_id);
    const clasificadorSeleccionado = clasificadores.find(
      (c) => c.id === comisionadoForm.clasificador_id
    );

    const nuevoComisionado = {
      id: Date.now(), // identificador temporal para la UI
      usuario_id: comisionadoForm.usuario_id,
      usuario_nombre: usuarioSeleccionado?.nombre || '',
      clasificador_id: comisionadoForm.clasificador_id,
      partida: clasificadorSeleccionado?.codigo || '',
      clasificador_nombre: clasificadorSeleccionado?.nombre || '',
      dias,
      costo_xdia: costo,
      monto,
      descripcion: comisionadoForm.descripcion || '',
      observacion: comisionadoForm.observacion || '',
    };

    setComisionados([...comisionados, nuevoComisionado]);
    // Reiniciar el formulario de comisionados
    setComisionadoForm({
      usuario_id: '',
      clasificador_id: '',
      dias: formData.num_dias || '',
      costo_xdia: '',
      descripcion: '',
      observacion: '',
    });
    setModalError('');
  };

  // Abrir modal de creación/edición de comisión
  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);

      // Si la comisión está RECHAZADA, resetear a PENDIENTE_APROBACION
      const aprobacionEstado =
        item.aprobacion_estado === 'RECHAZADA' ? 'PENDIENTE_APROBACION' : item.aprobacion_estado;
      const observacionAprobacion =
        item.aprobacion_estado === 'RECHAZADA' ? '' : item.observacion_aprobacion;

      setFormData({
        ambito_id: parseInt(item.ambito_id) || '', // Asegurar que sea número
        meta_id: item.meta_id || '',
        costo_viaje_id: item.costo_viaje_id || '',
        lugar: item.lugar,
        ruta: item.ruta,
        modalidad_viaje: item.modalidad_viaje || 'TERRESTRE',
        fecha_salida: item.fecha_salida ? item.fecha_salida.substring(0, 10) : '',
        fecha_retorno: item.fecha_retorno ? item.fecha_retorno.substring(0, 10) : '',
        num_dias: item.num_dias,
        costo_xdia: item.costo_xdia,
        observacion: item.observacion,
        observacion_aprobacion: observacionAprobacion, // Limpiar si está rechazada
        estado: item.estado,
        aprobacion_estado: aprobacionEstado, // Agregar el estado de aprobación al formulario
      });
      // Cargar los comisionados existentes de la API cuando se edite
      cargarComisionados(item.id);
      // Auto-llenar días en comisionados al editar
      setComisionadoForm({
        usuario_id: '',
        clasificador_id: '',
        dias: item.num_dias,
        costo_xdia: '',
        descripcion: '',
        observacion: '',
      });
    } else {
      setEditingId(null);
      setFormData({
        ambito_id: '',
        meta_id: '',
        costo_viaje_id: '',
        lugar: '',
        ruta: '',
        modalidad_viaje: 'TERRESTRE',
        fecha_salida: '',
        fecha_retorno: '',
        num_dias: '',
        costo_xdia: '220',
        observacion: '',
        estado: 'activa',
      });
      setComisionados([]);
      // Limpiar formulario de comisionados
      setComisionadoForm({
        usuario_id: '',
        clasificador_id: '',
        dias: '',
        costo_xdia: '',
        descripcion: '',
        observacion: '',
      });
    }
    setOpenDialog(true);
  };

  // Función para convertir texto a mayúsculas

  const handleOpenDetalle = async (item) => {
    try {
      setComisionSeleccionada(item);
      await cargarComisionados(item.id);
      setPageDetalle(1); // Reset paginación
      setOpenDetalle(true);
    } catch (err) {
      console.error('Error abriendo detalle de comisión:', err);
    }
  };

  const handleCloseDetalle = () => {
    setOpenDetalle(false);
    setComisionSeleccionada(null);
    setPageDetalle(1); // Reset paginación
  };
  const convertirAMayusculas = (data) => {
    // Asegurar que las fechas se envían en formato correcto (YYYY-MM-DD)
    // Sin hacer conversión de zona horaria
    const fechaSalida = data.fecha_salida ? data.fecha_salida.substring(0, 10) : '';
    const fechaRetorno = data.fecha_retorno ? data.fecha_retorno.substring(0, 10) : '';

    return {
      ...data,
      lugar: data.lugar?.toUpperCase() || '',
      ruta: data.ruta?.toUpperCase() || '',
      observacion: data.observacion?.toUpperCase() || '',
      fecha_salida: fechaSalida,
      fecha_retorno: fechaRetorno,
      meta_id: data.meta_id || null,
      costo_viaje_id: data.costo_viaje_id || null,
    };
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setModalError('');
    setFormData({
      ambito_id: '',
      meta_id: '',
      costo_viaje_id: '',
      lugar: '',
      ruta: '',
      modalidad_viaje: 'TERRESTRE',
      fecha_salida: '',
      fecha_retorno: '',
      num_dias: '',
      costo_xdia: '220',
      observacion: '',
      estado: 'activa',
      presupuesto_estado: 'PRESUPUESTO POR ASIGNAR',
      presupuesto_documento: '',
    });
    setComisionados([]);
    setComisionadosAEliminar([]);
    setComisionadoForm({
      usuario_id: '',
      clasificador_id: '',
      dias: '',
      costo_xdia: '',
      descripcion: '',
      observacion: '',
    });
    setEditingId(null);
  };

  const handleGuardar = async () => {
    if (!formData.ambito_id) {
      setError('El ámbito es requerido');
      return;
    }
    if (!formData.lugar.trim()) {
      setError('El lugar es requerido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Obtener el nombre del ámbito
      const ambitoSeleccionado = ambitos.find((a) => a.id === formData.ambito_id);
      const formDataConAmbito = convertirAMayusculas({
        ...formData,
        ambito_nombre: ambitoSeleccionado?.nombre || '',
      });

      if (editingId) {
        await api.actualizarComision(editingId, formDataConAmbito);

        // Eliminar comisionados marcados para eliminar
        if (comisionadosAEliminar.length > 0) {
          console.log('🗑️ ELIMINANDO COMISIONADOS:', comisionadosAEliminar);
          for (const comisionadoId of comisionadosAEliminar) {
            console.log('📤 Enviando DELETE para ID:', comisionadoId);
            await api.eliminarComisionado(comisionadoId);
          }
          console.log('✅ TODOS LOS COMISIONADOS ELIMINADOS');
          setComisionadosAEliminar([]);
        }

        // Guardar comisionados
        if (comisionados.length > 0) {
          for (const comisionado of comisionados) {
            // Convertir campos de texto del comisionado a mayúsculas
            const comisionadoConMayusculas = {
              ...comisionado,
              descripcion: comisionado.descripcion?.toUpperCase() || '',
              observacion: comisionado.observacion?.toUpperCase() || '',
            };

            // Recalcular monto basado en si es viático o no (PARA TODOS)
            const esViatico =
              comisionado.clasificador_nombre &&
              (comisionado.clasificador_nombre.includes('VIÁTICOS') ||
                comisionado.clasificador_nombre.includes('ASIGNACIONES'));

            const montoRecalculado = esViatico
              ? comisionado.dias * comisionado.costo_xdia
              : comisionado.costo_xdia;

            const comisionadoParaGuardar = {
              ...comisionadoConMayusculas,
              monto: montoRecalculado,
            };

            if (!comisionado.id || comisionado.id > 1000000000000) {
              // Es un nuevo comisionado (id generado con Date.now())
              console.log('🆕 AGREGANDO NUEVO COMISIONADO:');
              console.log('ComisionId:', editingId);
              console.log('Datos a enviar:', comisionadoParaGuardar);
              await api.agregarComisionado(editingId, comisionadoParaGuardar);
            } else {
              // Es un comisionado existente - actualizar
              console.log('🔵 ACTUALIZANDO COMISIONADO EXISTENTE:');
              console.log('ComisionId:', editingId);
              console.log('ComisionadoId:', comisionado.id);
              console.log('Datos a enviar:', comisionadoParaGuardar);

              await api.actualizarComisionado(editingId, comisionado.id, comisionadoParaGuardar);
            }
          }
        }
        setSuccess('Actualizado');
        // Recargar comisión completa para actualizar costo_total_comision
        await recargarComisionCompleta(editingId);
        // Recargar comisionados para reflejar cambios guardados
        await cargarComisionados(editingId);
      } else {
        const response = await api.crearComision(formDataConAmbito);
        // Guardar comisionados
        if (comisionados.length > 0) {
          for (const comisionado of comisionados) {
            // Convertir campos de texto del comisionado a mayúsculas
            const comisionadoConMayusculas = {
              ...comisionado,
              descripcion: comisionado.descripcion?.toUpperCase() || '',
              observacion: comisionado.observacion?.toUpperCase() || '',
            };

            // Recalcular monto basado en si es viático o no
            const esViatico =
              comisionado.clasificador_nombre &&
              (comisionado.clasificador_nombre.includes('VIÁTICOS') ||
                comisionado.clasificador_nombre.includes('ASIGNACIONES'));

            const montoRecalculado = esViatico
              ? comisionado.dias * comisionado.costo_xdia
              : comisionado.costo_xdia;

            const comisionadoParaGuardar = {
              ...comisionadoConMayusculas,
              monto: montoRecalculado,
            };

            console.log('🆕 AGREGANDO COMISIONADO A NUEVA COMISIÓN:');
            console.log('ComisionId:', response.id);
            console.log('Datos a enviar:', comisionadoParaGuardar);
            await api.agregarComisionado(response.id, comisionadoParaGuardar);
          }
        }
        setSuccess('Creado');
        // Recargar comisión completa para obtener costo_total_comision recalculado
        if (comisionados.length > 0) {
          const comisionActualizada = await recargarComisionCompleta(response.id);
          if (comisionActualizada) {
            setItems((prevItems) => [
              ...prevItems.filter((c) => c.id !== response.id),
              comisionActualizada,
            ]);
          }
        } else {
          setItems((prevItems) => [...prevItems, response]);
        }
      }
      handleCloseDialog();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await api.eliminarComision(id);
          cargarItems();
          Swal.fire({
            title: '¡Eliminado!',
            text: 'La comisión ha sido eliminada correctamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
          });
        } catch (err) {
          Swal.fire({
            title: 'Error',
            text: err.message,
            icon: 'error',
            confirmButtonColor: '#3085d6',
          });
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleEliminarComisionado = (id) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Desea eliminar este comisionado de la lista.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('🗑️ MARCANDO PARA ELIMINAR:', id);
        // Remover de la lista local
        const nuevosComisionados = comisionados.filter((c) => c.id !== id);
        setComisionados(nuevosComisionados);

        // Agregar a la lista de IDs a eliminar (si tiene comision_id significa que está en la BD)
        const comisionado = comisionados.find((c) => c.id === id);
        if (comisionado && comisionado.comision_id) {
          console.log('📌 Agregando a lista de eliminación en BD:', id);
          setComisionadosAEliminar([...comisionadosAEliminar, id]);
        }
      }
    });

    // Forzar el zIndex del SweetAlert con CSS
    setTimeout(() => {
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '9999';
      }
    }, 0);
  };

  // Abrir modal de presupuesto
  const handleAbrirPresupuesto = (comision) => {
    // Validar que la comisión esté aprobada antes de permitir asignar presupuesto
    if (
      comision.presupuesto_estado === 'PRESUPUESTO POR ASIGNAR' &&
      comision.aprobacion_estado !== 'APROBADA'
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Comisión no aprobada',
        text: `No se puede asignar presupuesto a una comisión no aprobada.\nEstado de aprobación: ${comision.aprobacion_estado}`,
        confirmButtonText: 'Entendido',
      });
      return;
    }

    // Procesar la fecha para asegurar que esté en formato YYYY-MM-DD
    let fechaFormato = '';
    if (comision.presupuesto_fecha) {
      const fecha = new Date(comision.presupuesto_fecha);
      fechaFormato = fecha.toISOString().split('T')[0];
    }

    setComisionPresupuesto(comision);
    setPresupuestoForm({
      presupuesto_documento: comision.presupuesto_documento || '',
      presupuesto_numero_cut: comision.presupuesto_numero_cut || '',
      presupuesto_fecha: fechaFormato,
    });
    setOpenPresupuesto(true);
  };

  // Cerrar modal de presupuesto
  const handleCerrarPresupuesto = () => {
    setOpenPresupuesto(false);
    setComisionPresupuesto(null);
    setPresupuestoForm({
      presupuesto_documento: '',
      presupuesto_numero_cut: '',
      presupuesto_fecha: '',
    });
  };

  // Guardar presupuesto
  const handleGuardarPresupuesto = async () => {
    try {
      const {
        presupuesto_documento: pDoc,
        presupuesto_numero_cut: pCut,
        presupuesto_fecha: pFecha,
      } = presupuestoForm;
      if (!pDoc || !pCut || !pFecha) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos requeridos',
          text: 'Por favor completa todos los campos.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          didOpen: (toast) => {
            toast.style.zIndex = 9999;
          },
        });
        return;
      }

      const dataActualizar = {
        ...comisionPresupuesto,
        presupuesto_estado: 'PRESUPUESTO ASIGNADO',
        presupuesto_documento: presupuestoForm.presupuesto_documento,
        presupuesto_numero_cut: presupuestoForm.presupuesto_numero_cut,
        presupuesto_fecha: presupuestoForm.presupuesto_fecha,
      };

      await api.actualizarComision(comisionPresupuesto.id, dataActualizar);

      Swal.fire({
        icon: 'success',
        title: 'Presupuesto actualizado',
        text: 'El presupuesto ha sido asignado correctamente.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });

      handleCerrarPresupuesto();
      cargarItems();
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    }
  };

  // Anular presupuesto asignado
  const handleAnularPresupuesto = (comisionId) => {
    Swal.fire({
      title: '¿Anular Asignación?',
      text: 'Esto volverá el presupuesto al estado "Por Asignar". ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const comisionActual = items.find((c) => c.id === comisionId);
          const dataActualizar = {
            ...comisionActual,
            presupuesto_estado: 'PRESUPUESTO POR ASIGNAR',
            presupuesto_documento: null,
            presupuesto_numero_cut: null,
            presupuesto_fecha: null,
          };

          await api.actualizarComision(comisionId, dataActualizar);

          Swal.fire({
            icon: 'success',
            title: 'Anulado',
            text: 'La asignación ha sido anulada.',
          });

          cargarItems();
        } catch (error) {
          console.error('Error al anular presupuesto:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.error || error.message,
          });
        }
      }
    });
  };

  // Manejar cambio de checkbox en una fila
  const handleToggleSeleccion = (comisionId) => {
    setComisionesSeleccionadas((prev) => {
      if (prev.includes(comisionId)) {
        return prev.filter((id) => id !== comisionId);
      }
      return [...prev, comisionId];
    });
  };
  // Seleccionar/Deseleccionar todas las comisiones elegibles (aprobadas y sin presupuesto asignado)
  const handleToggleSeleccionTodas = () => {
    const comisionesElegibles = items.filter((c) => {
      return c.presupuesto_estado !== 'PRESUPUESTO ASIGNADO' && c.aprobacion_estado === 'APROBADA';
    });
    if (comisionesElegibles.length === 0) return;
    if (comisionesSeleccionadas.length === comisionesElegibles.length) {
      setComisionesSeleccionadas([]);
    } else {
      setComisionesSeleccionadas(comisionesElegibles.map((item) => item.id));
    }
  };

  // Asignar presupuesto masivamente
  const handleAsignarPresupuestoMasivo = async () => {
    // Validar que haya comisiones seleccionadas
    if (comisionesSeleccionadas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona comisiones',
        text: 'Por favor selecciona al menos una comisión.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }

    // Validar que los campos estén completos
    if (
      !presupuestoMasivoForm.presupuesto_documento ||
      !presupuestoMasivoForm.presupuesto_numero_cut ||
      !presupuestoMasivoForm.presupuesto_fecha
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor completa todos los campos del presupuesto.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
      return;
    }

    try {
      // Actualizar cada comisión seleccionada
      const promises = comisionesSeleccionadas.map((comisionId) => {
        const comisionActual = items.find((c) => c.id === comisionId);
        const dataActualizar = {
          ...comisionActual,
          presupuesto_documento: presupuestoMasivoForm.presupuesto_documento,
          presupuesto_numero_cut: presupuestoMasivoForm.presupuesto_numero_cut,
          presupuesto_fecha: presupuestoMasivoForm.presupuesto_fecha,
          presupuesto_estado: 'PRESUPUESTO ASIGNADO',
        };
        return api.actualizarComision(comisionId, dataActualizar);
      });

      await Promise.all(promises);

      Swal.fire({
        icon: 'success',
        title: 'Presupuesto asignado',
        text: `Se asignó presupuesto a ${comisionesSeleccionadas.length} comisión(es).`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });

      // Limpiar selección y cerrar modal
      setComisionesSeleccionadas([]);
      setOpenPresupuestoMasivo(false);
      setPresupuestoMasivoForm({
        presupuesto_documento: '',
        presupuesto_numero_cut: '',
        presupuesto_fecha: '',
      });

      // Recargar datos
      cargarItems();
    } catch (error) {
      console.error('Error al asignar presupuesto masivo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        didOpen: (toast) => {
          toast.style.zIndex = 9999;
        },
      });
    }
  };

  const comisionesElegibles = items.filter(
    (c) => c.presupuesto_estado !== 'PRESUPUESTO ASIGNADO' && c.aprobacion_estado === 'APROBADA'
  );

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
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <MDTypography variant="h6" color="white">
              Gestión de Comisiones
            </MDTypography>
            <MDBox display="flex" gap={1}>
              {comisionesSeleccionadas.length > 0 && (
                <MDButton
                  variant="contained"
                  color="warning"
                  onClick={() => setOpenPresupuestoMasivo(true)}
                  sx={{ ml: 2 }}
                >
                  Asignar Presupuesto en Masa ({comisionesSeleccionadas.length})
                </MDButton>
              )}
              <MDButton
                variant="contained"
                color="white"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ ml: 2 }}
              >
                Nuevo
              </MDButton>
            </MDBox>
          </MDBox>
          <MDBox pt={3} px={2} pb={2}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <MDBox>
              {!loading && (
                <DataTable
                  table={{
                    columns: [
                      {
                        Header: (
                          <input
                            type="checkbox"
                            checked={
                              comisionesSeleccionadas.length === comisionesElegibles.length &&
                              comisionesElegibles.length > 0
                            }
                            onChange={handleToggleSeleccionTodas}
                            disabled={comisionesElegibles.length === 0}
                            style={{
                              cursor: comisionesElegibles.length === 0 ? 'not-allowed' : 'pointer',
                              opacity: comisionesElegibles.length === 0 ? 0.5 : 1,
                            }}
                          />
                        ),
                        accessor: 'seleccionar',
                        width: '4%',
                        // eslint-disable-next-line react/prop-types,react/display-name
                        Cell: ({ row }) => {
                          // eslint-disable-next-line react/prop-types
                          const esAsignado =
                            row.original.presupuesto_estado === 'PRESUPUESTO ASIGNADO';
                          // eslint-disable-next-line react/prop-types
                          const aprobacionEstado =
                            row.original.aprobacion_estado || 'PENDIENTE_APROBACION';
                          const puedeSeleccionar = !esAsignado && aprobacionEstado === 'APROBADA';
                          // eslint-disable-next-line react/prop-types
                          const isSelected = comisionesSeleccionadas.includes(row.original.id);
                          const handleChange = () => {
                            if (!puedeSeleccionar) return;
                            // eslint-disable-next-line react/prop-types
                            handleToggleSeleccion(row.original.id);
                          };

                          return (
                            <Tooltip
                              title={
                                !puedeSeleccionar && !esAsignado
                                  ? 'Solo puedes seleccionar comisiones aprobadas'
                                  : esAsignado
                                  ? 'Ya tiene presupuesto asignado'
                                  : ''
                              }
                            >
                              <span>
                                <input
                                  type="checkbox"
                                  checked={puedeSeleccionar ? isSelected : false}
                                  onChange={handleChange}
                                  disabled={!puedeSeleccionar}
                                  style={{
                                    cursor: !puedeSeleccionar ? 'not-allowed' : 'pointer',
                                    opacity: !puedeSeleccionar ? 0.5 : 1,
                                  }}
                                />
                              </span>
                            </Tooltip>
                          );
                        },
                      },
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
                        // eslint-disable-next-line react/prop-types
                        Cell: ({ row }) => {
                          // eslint-disable-next-line react/prop-types
                          const fecha = row.original.fecha_salida;
                          return fecha ? parsearFechaLocal(fecha).toLocaleDateString('es-ES') : '-';
                        },
                      },
                      {
                        Header: 'Fecha Retorno',
                        accessor: 'fecha_retorno',
                        width: '11%',
                        // eslint-disable-next-line react/prop-types
                        Cell: ({ row }) => {
                          // eslint-disable-next-line react/prop-types
                          const fecha = row.original.fecha_retorno;
                          return fecha ? parsearFechaLocal(fecha).toLocaleDateString('es-ES') : '-';
                        },
                      },
                      { Header: 'Días', accessor: 'num_dias', width: '7%' },
                      { Header: 'Costo/Día', accessor: 'costo_xdia', width: '11%' },
                      {
                        Header: 'Costo Total',
                        accessor: 'costo_total_comision',
                        width: '11%',
                        // eslint-disable-next-line react/prop-types,react/display-name
                        Cell: ({ row }) => {
                          // eslint-disable-next-line react/prop-types
                          const costo = parseFloat(row.original.costo_total_comision || 0);
                          return costo.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        },
                      },
                      {
                        Header: 'Estado Aprobación',
                        accessor: 'aprobacion_estado',
                        width: '12%',
                        // eslint-disable-next-line react/prop-types,react/display-name
                        Cell: ({ row: { original } }) => {
                          const estado = original.aprobacion_estado || 'PENDIENTE_APROBACION';
                          const isRechazada = estado === 'RECHAZADA';
                          const isAprobada = estado === 'APROBADA';

                          if (isRechazada) {
                            return (
                              <MDBox
                                sx={{
                                  backgroundColor: '#ffcdd2',
                                  border: '1px solid #d32f2f',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  textAlign: 'center',
                                  color: '#b71c1c',
                                  fontWeight: '600',
                                  fontSize: '0.85rem',
                                }}
                              >
                                ✕ Rechazada
                              </MDBox>
                            );
                          }

                          if (isAprobada) {
                            return (
                              <MDBox
                                sx={{
                                  backgroundColor: '#c8e6c9',
                                  border: '1px solid #2e7d32',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  textAlign: 'center',
                                  color: '#1b5e20',
                                  fontWeight: '600',
                                  fontSize: '0.85rem',
                                }}
                              >
                                ✓ Aprobada
                              </MDBox>
                            );
                          }

                          return (
                            <MDBox
                              sx={{
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ff9800',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                textAlign: 'center',
                                color: '#f57c00',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                              }}
                            >
                              ⏳ Pendiente
                            </MDBox>
                          );
                        },
                      },
                      {
                        Header: 'Observación Aprobación',
                        accessor: 'observacion_aprobacion',
                        width: '12%',
                        // eslint-disable-next-line react/prop-types,react/display-name
                        Cell: ({ row: { original } }) => {
                          const obs = original.observacion_aprobacion || '-';
                          return (
                            <MDTypography
                              variant="caption"
                              sx={{
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                              }}
                              title={obs !== '-' ? obs : ''}
                            >
                              {obs}
                            </MDTypography>
                          );
                        },
                      },
                      {
                        Header: 'Presupuesto',
                        accessor: 'presupuesto_estado',
                        width: '14%',
                        // eslint-disable-next-line react/prop-types,react/display-name
                        // eslint-disable-next-line react/prop-types
                        Cell: ({ row: { original } }) => {
                          // eslint-disable-next-line react/prop-types
                          const estado = original.presupuesto_estado || 'PRESUPUESTO POR ASIGNAR';
                          // eslint-disable-next-line react/prop-types
                          // eslint-disable-next-line react/prop-types
                          const aprobacionEstado =
                            original.aprobacion_estado || 'PENDIENTE_APROBACION';
                          let badgeColor = 'warning';
                          if (estado === 'PRESUPUESTO ASIGNADO') badgeColor = 'success';
                          return (
                            <MDBox display="flex" gap={0.5} alignItems="center">
                              <MDBadge
                                badgeContent={estado}
                                color={badgeColor}
                                variant="contained"
                              />
                              {/* eslint-disable-next-line react/prop-types */}
                              {estado === 'PRESUPUESTO POR ASIGNAR' && (
                                <Tooltip
                                  title={
                                    aprobacionEstado === 'APROBADA'
                                      ? 'Asignar Presupuesto'
                                      : 'Debes aprobar primero'
                                  }
                                >
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={aprobacionEstado !== 'APROBADA'}
                                    onClick={() => handleAbrirPresupuesto(original)}
                                    sx={{
                                      backgroundColor:
                                        aprobacionEstado === 'APROBADA' ? '#e8f5e9' : '#f5f5f5',
                                      '&:hover': {
                                        backgroundColor:
                                          aprobacionEstado === 'APROBADA' ? '#c8e6c9' : '#f5f5f5',
                                      },
                                    }}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {estado === 'PRESUPUESTO ASIGNADO' && (
                                <>
                                  <Tooltip title="Editar Presupuesto">
                                    <IconButton
                                      size="small"
                                      color="info"
                                      onClick={() => handleAbrirPresupuesto(original)}
                                      sx={{
                                        backgroundColor: '#e3f2fd',
                                        '&:hover': { backgroundColor: '#bbdefb' },
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Anular Asignación">
                                    <IconButton
                                      size="small"
                                      color="warning"
                                      // eslint-disable-next-line react/prop-types
                                      onClick={() => handleAnularPresupuesto(original.id)}
                                      sx={{
                                        backgroundColor: '#fff3e0',
                                        '&:hover': { backgroundColor: '#ffe0b2' },
                                      }}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </MDBox>
                          );
                        },
                      },
                      {
                        Header: 'Acciones',
                        accessor: 'acciones',
                        width: '11%',
                        // eslint-disable-next-line react/prop-types,react/display-name
                        Cell: ({ row: { original } }) => {
                          // eslint-disable-next-line react/prop-types
                          const presupuestoEstado = original.presupuesto_estado || '';
                          const estaAsignado = presupuestoEstado === 'PRESUPUESTO ASIGNADO';
                          return (
                            <MDBox display="flex" justifyContent="flex-end" gap={0.5}>
                              <Tooltip title="Ver comisionados">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenDetalle(original)}
                                  sx={{
                                    backgroundColor: '#e8f5e9',
                                    '&:hover': { backgroundColor: '#c8e6c9' },
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip
                                title={
                                  estaAsignado
                                    ? 'No se puede editar: presupuesto asignado'
                                    : 'Editar'
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleOpenDialog(original)}
                                    disabled={estaAsignado}
                                    sx={{
                                      backgroundColor: '#e3f2fd',
                                      '&:hover': {
                                        backgroundColor: estaAsignado ? '#e3f2fd' : '#bbdefb',
                                      },
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  estaAsignado
                                    ? 'No se puede eliminar: presupuesto asignado'
                                    : 'Eliminar'
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    // eslint-disable-next-line react/prop-types
                                    onClick={() => handleEliminar(original.id)}
                                    disabled={estaAsignado}
                                    sx={{
                                      backgroundColor: '#ffebee',
                                      '&:hover': {
                                        backgroundColor: estaAsignado ? '#ffebee' : '#ffcdd2',
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </MDBox>
                          );
                        },
                      },
                    ],
                    rows: items,
                  }}
                  canSearch
                  isSorted={false}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries
                  noEndBorder
                />
              )}
              {loading && <CircularProgress />}
            </MDBox>
          </MDBox>
        </Card>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
          sx={{ '& .MuiDialog-paper': { maxWidth: '80vw' } }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
            {editingId ? 'Editar Comisión' : 'Crear Nueva Comisión'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2, maxHeight: '80vh', overflowY: 'auto' }}>
            {editingId &&
              formData.aprobacion_estado === 'PENDIENTE_APROBACION' &&
              items.find((c) => c.id === editingId)?.aprobacion_estado === 'RECHAZADA' && (
                <Alert
                  severity="info"
                  sx={{ mb: 3, backgroundColor: '#e3f2fd', borderColor: '#2196f3' }}
                >
                  <strong>✓ Comisión Reactivada</strong> - Esta comisión fue rechazada y ha sido
                  reactivada automáticamente a estado <strong>Pendiente de Aprobación</strong>. La
                  observación del rechazo ha sido limpiada.
                </Alert>
              )}
            <MDBox display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{ mt: 2 }}>
              <Autocomplete
                options={ambitos}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.nombre_corto || ''
                }
                value={ambitos.find((a) => a.id === formData.ambito_id) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    ambito_id: newValue?.id || '',
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ámbito"
                    placeholder="Buscar ámbito..."
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{option.nombre_corto}</div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {option.dependencia_nombre || 'Sin dependencia'}
                      </div>
                    </div>
                  </li>
                )}
                disabled={loading}
                noOptionsText="Sin ámbitos disponibles"
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ width: '100%' }}
              />
              <Autocomplete
                options={metas}
                getOptionLabel={(option) =>
                  typeof option === 'string'
                    ? option
                    : `${option.numero_meta || ''} - ${option.nombre || ''}`
                }
                value={metas.find((m) => m.id === formData.meta_id) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    meta_id: newValue?.id || '',
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Meta (Opcional)"
                    placeholder="Buscar meta..."
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {option.numero_meta} - {option.nombre}
                      </div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        Período: {option.periodo}
                      </div>
                    </div>
                  </li>
                )}
                disabled={loading}
                noOptionsText="Sin metas disponibles"
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ width: '100%' }}
              />
              <Autocomplete
                options={[
                  'TERRESTRE',
                  'AEREO',
                  'FLUVIAL',
                  'AEREO-TERRESTRE',
                  'AEREO-FLUVIAL',
                  'TERRESTRE-FLUVIAL',
                  'AEREO-TERRESTRE-FLUVIAL',
                ]}
                value={formData.modalidad_viaje || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    modalidad_viaje: newValue || '',
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Modalidad de Viaje"
                    placeholder="Buscar modalidad..."
                    size="small"
                  />
                )}
                disabled={loading}
                noOptionsText="Sin modalidades disponibles"
                sx={{ width: '100%' }}
              />
              <Autocomplete
                options={costosViaje}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.nombre || ''
                }
                value={costosViaje.find((cv) => cv.id === formData.costo_viaje_id) || null}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    costo_viaje_id: newValue?.id || '',
                    costo_xdia: newValue?.costo || formData.costo_xdia,
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Costo de Viaje (Opcional)"
                    placeholder="Buscar costo..."
                    size="small"
                  />
                )}
                disabled={loading}
                noOptionsText="Sin costos disponibles"
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ width: '100%' }}
              />
              <TextField
                label="Lugar"
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                placeholder="Ej: Lima"
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
              />
              <TextField
                label="Ruta"
                value={formData.ruta}
                onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
                placeholder="Ej: Lima - Cusco"
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
              />
              <TextField
                label="Fecha de Salida"
                type="date"
                value={formData.fecha_salida}
                onChange={handleFechaSalidaChange}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha de Retorno"
                type="date"
                value={formData.fecha_retorno}
                onChange={handleFechaRetornoChange}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Número de Días"
                type="number"
                value={formData.num_dias}
                onChange={(e) => setFormData({ ...formData, num_dias: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
              />
              <TextField
                label="Viáticos (Costo por Día)"
                type="number"
                inputProps={{ step: '0.01' }}
                value={formData.costo_xdia}
                onChange={(e) => setFormData({ ...formData, costo_xdia: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading || !!formData.costo_viaje_id}
                helperText={
                  formData.costo_viaje_id ? 'Rellenado automáticamente desde Costo de Viaje' : ''
                }
              />
              <TextField
                label="Observación"
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                placeholder="Ej: Sin observaciones"
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={3}
                disabled={loading}
                sx={{ gridColumn: '1 / -1' }}
              />
            </MDBox>

            {/* Sección de Comisionados */}
            <MDBox sx={{ mt: 3, borderTop: '1px solid #e0e0e0', pt: 2 }}>
              <MDTypography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Agregar Comisionados
              </MDTypography>

              <MDBox display="grid" gridTemplateColumns="1fr 1fr" gap={2} sx={{ mb: 2 }}>
                <Autocomplete
                  options={usuarios}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.nombre || ''
                  }
                  value={usuarios.find((u) => u.id === comisionadoForm.usuario_id) || null}
                  onChange={(event, newValue) => {
                    setComisionadoForm({
                      ...comisionadoForm,
                      usuario_id: newValue?.id || '',
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Usuario"
                      placeholder="Buscar usuario..."
                      size="small"
                    />
                  )}
                  disabled={loading}
                  noOptionsText="Sin usuarios disponibles"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  sx={{ width: '100%' }}
                />
                <Autocomplete
                  options={clasificadores}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    // Mostrar nombre - partida para identificar claramente
                    return option.nombre && option.partida
                      ? `${option.nombre} (${option.partida})`
                      : option.nombre || '';
                  }}
                  filterOptions={(options, { inputValue }) => {
                    // Filtrar por nombre O por partida
                    if (!inputValue) return options;
                    const lowercaseInput = inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        option.nombre.toLowerCase().includes(lowercaseInput) ||
                        (option.partida && option.partida.toLowerCase().includes(lowercaseInput))
                    );
                  }}
                  value={
                    clasificadores.find((c) => c.id === comisionadoForm.clasificador_id) || null
                  }
                  onChange={(event, newValue) => {
                    const clasificadorId = newValue?.id || '';
                    // Detectar viáticos por "asignaciones" o "viático" combinado
                    const esViatico =
                      newValue &&
                      newValue.nombre &&
                      (newValue.nombre.toLowerCase().includes('asignaciones') ||
                        (newValue.nombre.toLowerCase().includes('viático') &&
                          !newValue.nombre.toLowerCase().includes('terrestre') &&
                          !newValue.nombre.toLowerCase().includes('aéreo') &&
                          !newValue.nombre.toLowerCase().includes('fluvial')));

                    // Si es "Viáticos Y Asignaciones Por Comisión De Servicio", auto-llenar con el costo_xdia principal
                    const nuevoComisionadoForm = {
                      ...comisionadoForm,
                      clasificador_id: clasificadorId,
                    };
                    if (esViatico) {
                      nuevoComisionadoForm.costo_xdia = formData.costo_xdia;
                    }
                    setComisionadoForm(nuevoComisionadoForm);
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: 500, color: '#333' }}>{option.nombre}</div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          Partida: {option.partida || 'N/A'}
                        </div>
                      </div>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Partida"
                      placeholder="Buscar por nombre o partida..."
                      size="small"
                    />
                  )}
                  disabled={loading}
                  noOptionsText="Sin partidas disponibles"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  sx={{ width: '100%' }}
                />
                <TextField
                  label="Días"
                  type="number"
                  inputProps={{ min: '0', step: '1' }}
                  value={comisionadoForm.dias}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setComisionadoForm({ ...comisionadoForm, dias: newValue });
                  }}
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  autoComplete="off"
                />
                <TextField
                  label="Costo/Día"
                  type="number"
                  inputProps={{ step: '0.01', min: '0' }}
                  value={comisionadoForm.costo_xdia}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setComisionadoForm({ ...comisionadoForm, costo_xdia: newValue });
                  }}
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  autoComplete="off"
                />
                <TextField
                  label="Descripción"
                  value={comisionadoForm.descripcion}
                  onChange={(e) =>
                    setComisionadoForm({ ...comisionadoForm, descripcion: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  sx={{ gridColumn: '1 / -1' }}
                />
                <TextField
                  label="Observación"
                  value={comisionadoForm.observacion}
                  onChange={(e) =>
                    setComisionadoForm({ ...comisionadoForm, observacion: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  multiline
                  rows={2}
                  sx={{ gridColumn: '1 / -1' }}
                />
              </MDBox>

              <MDBox sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <MDButton
                  variant="contained"
                  color="success"
                  onClick={handleAgregarComisionado}
                  disabled={
                    loading ||
                    !comisionadoForm.usuario_id ||
                    !comisionadoForm.clasificador_id ||
                    !comisionadoForm.dias ||
                    !comisionadoForm.costo_xdia ||
                    parseInt(comisionadoForm.dias) <= 0 ||
                    parseFloat(comisionadoForm.costo_xdia) <= 0
                  }
                  size="small"
                >
                  + Agregar Comisionado
                </MDButton>
              </MDBox>

              {/* Tabla de Comisionados */}
              {comisionados.length > 0 && (
                <>
                  {modalError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {modalError}
                    </Alert>
                  )}
                  <Card
                    sx={{
                      mt: 3,
                      mb: 2,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #e8eaed',
                    }}
                  >
                    <MDBox
                      p={2}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #667eea',
                        borderRadius: '8px 8px 0 0',
                      }}
                    >
                      <MDTypography
                        variant="h6"
                        sx={{ fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}
                      >
                        Comisionados Asignados
                      </MDTypography>
                    </MDBox>
                    <DataTable
                      table={{
                        columns: [
                          { Header: 'Usuario', accessor: 'usuario_nombre', width: '18%' },
                          {
                            Header: 'Partida',
                            accessor: 'clasificador_nombre',
                            width: '22%',
                            // eslint-disable-next-line react/prop-types
                            Cell: ({ row: { original } }) => (
                              <div>
                                <div
                                  style={{
                                    fontWeight: 500,
                                    color: '#2c3e50',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {/* eslint-disable-next-line react/prop-types */}
                                  {original.clasificador_nombre}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: '#666',
                                    marginTop: '2px',
                                  }}
                                >
                                  {/* eslint-disable-next-line react/prop-types */}
                                  {original.partida || 'N/A'}
                                </div>
                              </div>
                            ),
                          },
                          {
                            Header: 'Días',
                            accessor: 'dias',
                            width: '10%',
                            align: 'center',
                            // eslint-disable-next-line react/prop-types
                            Cell: ({ row: { original } }) => {
                              // eslint-disable-next-line react/prop-types
                              const [tempValue, setTempValue] = React.useState(original.dias);

                              return (
                                // eslint-disable-next-line react/prop-types
                                <TextField
                                  type="number"
                                  size="small"
                                  inputProps={{ min: '0', step: '1' }}
                                  value={tempValue}
                                  onChange={(e) => {
                                    setTempValue(e.target.value);
                                  }}
                                  onBlur={(e) => {
                                    // eslint-disable-next-line react/prop-types
                                    const updatedComisionados = comisionados.map((c) => {
                                      // eslint-disable-next-line react/prop-types
                                      if (c.id === original.id) {
                                        const partida = clasificadores.find(
                                          // eslint-disable-next-line react/prop-types
                                          (p) => p.id === c.clasificador_id
                                        );
                                        const esViatico =
                                          partida &&
                                          partida.nombre &&
                                          (partida.nombre.toLowerCase().includes('asignaciones') ||
                                            (partida.nombre.toLowerCase().includes('viático') &&
                                              !partida.nombre.toLowerCase().includes('terrestre') &&
                                              !partida.nombre.toLowerCase().includes('aéreo') &&
                                              !partida.nombre.toLowerCase().includes('fluvial')));
                                        const nuevosDias = parseInt(e.target.value) || 0;
                                        // Monto: si es viático, multiplica por días; otras, solo costo
                                        const nuevoMonto = esViatico
                                          ? nuevosDias * c.costo_xdia
                                          : c.costo_xdia;
                                        return {
                                          ...c,
                                          dias: nuevosDias,
                                          monto: nuevoMonto,
                                        };
                                      }
                                      return c;
                                    });
                                    setComisionados(updatedComisionados);
                                  }}
                                  sx={{ maxWidth: '80px' }}
                                />
                              );
                            },
                          },
                          {
                            Header: 'Costo/Día',
                            accessor: 'costo_xdia',
                            width: '12%',
                            align: 'center',
                            // eslint-disable-next-line react/prop-types
                            Cell: ({ row: { original } }) => {
                              // eslint-disable-next-line react/prop-types
                              const [tempValue, setTempValue] = React.useState(original.costo_xdia);

                              return (
                                // eslint-disable-next-line react/prop-types
                                <TextField
                                  type="number"
                                  size="small"
                                  inputProps={{ min: '0', step: '0.01' }}
                                  value={tempValue}
                                  onChange={(e) => {
                                    setTempValue(e.target.value);
                                  }}
                                  onBlur={(e) => {
                                    // eslint-disable-next-line react/prop-types
                                    const updatedComisionados = comisionados.map((c) => {
                                      // eslint-disable-next-line react/prop-types
                                      if (c.id === original.id) {
                                        // eslint-disable-next-line react/prop-types
                                        const partida = clasificadores.find(
                                          // eslint-disable-next-line react/prop-types
                                          (p) => p.id === c.clasificador_id
                                        );
                                        const esViatico =
                                          partida &&
                                          partida.nombre &&
                                          (partida.nombre.toLowerCase().includes('asignaciones') ||
                                            (partida.nombre.toLowerCase().includes('viático') &&
                                              !partida.nombre.toLowerCase().includes('terrestre') &&
                                              !partida.nombre.toLowerCase().includes('aéreo') &&
                                              !partida.nombre.toLowerCase().includes('fluvial')));
                                        const nuevoCosto = parseFloat(e.target.value) || 0;
                                        // Monto: si es viático, multiplica por días; otras, solo costo
                                        const nuevoMonto = esViatico
                                          ? c.dias * nuevoCosto
                                          : nuevoCosto;
                                        return {
                                          ...c,
                                          costo_xdia: nuevoCosto,
                                          monto: nuevoMonto,
                                        };
                                      }
                                      return c;
                                    });
                                    setComisionados(updatedComisionados);
                                  }}
                                  sx={{ maxWidth: '100px' }}
                                />
                              );
                            },
                          },
                          {
                            Header: 'Monto',
                            accessor: 'monto',
                            width: '12%',
                            align: 'center',
                            // eslint-disable-next-line react/prop-types
                            Cell: ({ row: { original } }) => {
                              // eslint-disable-next-line react/prop-types
                              const partida = clasificadores.find(
                                // eslint-disable-next-line react/prop-types
                                (c) => c.id === original.clasificador_id
                              );
                              const esViatico =
                                partida &&
                                partida.nombre &&
                                (partida.nombre.toLowerCase().includes('asignaciones') ||
                                  (partida.nombre.toLowerCase().includes('viático') &&
                                    !partida.nombre.toLowerCase().includes('terrestre') &&
                                    !partida.nombre.toLowerCase().includes('aéreo') &&
                                    !partida.nombre.toLowerCase().includes('fluvial')));
                              // Monto: si es viático, multiplica por días; otras, solo costo
                              // eslint-disable-next-line react/prop-types
                              const monto = esViatico
                                ? // eslint-disable-next-line react/prop-types
                                  parseInt(original.dias || 0) *
                                  // eslint-disable-next-line react/prop-types
                                  parseFloat(original.costo_xdia || 0)
                                : // eslint-disable-next-line react/prop-types
                                  parseFloat(original.costo_xdia || 0);
                              return (
                                <MDTypography
                                  variant="button"
                                  sx={{ fontWeight: 'bold', color: '#1976d2' }}
                                >
                                  {/* eslint-disable-next-line react/prop-types */}
                                  {parseFloat(monto).toFixed(2)}
                                </MDTypography>
                              );
                            },
                          },
                          {
                            Header: 'Descripción/Observación',
                            accessor: 'descripcion',
                            width: '16%',
                            // eslint-disable-next-line react/prop-types
                            Cell: ({ row: { original, index } }) => {
                              // eslint-disable-next-line react/prop-types
                              const [isEditing, setIsEditing] = React.useState(false);
                              // eslint-disable-next-line react/prop-types
                              const [tempDescripcion, setTempDescripcion] = React.useState(
                                // eslint-disable-next-line react/prop-types
                                original.descripcion || ''
                              );
                              // eslint-disable-next-line react/prop-types
                              const [tempObservacion, setTempObservacion] = React.useState(
                                // eslint-disable-next-line react/prop-types
                                original.observacion || ''
                              );

                              const handleSaveDesc = () => {
                                // eslint-disable-next-line react/prop-types
                                const comisionadoActualizado = {
                                  // eslint-disable-next-line react/prop-types
                                  ...comisionados[index],
                                  descripcion: tempDescripcion,
                                  observacion: tempObservacion,
                                };
                                const nuevosComisionados = [...comisionados];
                                nuevosComisionados[index] = comisionadoActualizado;
                                setComisionados(nuevosComisionados);
                                setIsEditing(false);
                              };

                              if (isEditing) {
                                return (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <TextField
                                      size="small"
                                      placeholder="Descripción"
                                      value={tempDescripcion}
                                      onChange={(e) => setTempDescripcion(e.target.value)}
                                      fullWidth
                                      variant="outlined"
                                      sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                                    />
                                    <TextField
                                      size="small"
                                      placeholder="Observación"
                                      value={tempObservacion}
                                      onChange={(e) => setTempObservacion(e.target.value)}
                                      fullWidth
                                      variant="outlined"
                                      multiline
                                      rows={2}
                                      sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                                    />
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <MDButton
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        onClick={handleSaveDesc}
                                        sx={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                      >
                                        Guardar
                                      </MDButton>
                                      <MDButton
                                        variant="outlined"
                                        color="secondary"
                                        size="small"
                                        onClick={() => setIsEditing(false)}
                                        sx={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                      >
                                        Cancelar
                                      </MDButton>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  style={{
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  onClick={() => setIsEditing(true)}
                                >
                                  {/* eslint-disable-next-line react/prop-types */}
                                  {original.descripcion && (
                                    <div
                                      style={{
                                        fontWeight: 500,
                                        color: '#333',
                                        marginBottom: '4px',
                                      }}
                                    >
                                      {/* eslint-disable-next-line react/prop-types */}
                                      {original.descripcion}
                                    </div>
                                  )}
                                  {/* eslint-disable-next-line react/prop-types */}
                                  {original.observacion && (
                                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                                      {/* eslint-disable-next-line react/prop-types */}
                                      {original.observacion}
                                    </div>
                                  )}
                                  {/* eslint-disable-next-line react/prop-types */}
                                  {!original.descripcion && !original.observacion && (
                                    <span style={{ color: '#999' }}>- (Click para editar)</span>
                                  )}
                                </div>
                              );
                            },
                          },
                          {
                            Header: 'Acciones',
                            accessor: 'acciones',
                            width: '8%',
                            align: 'center',
                            // eslint-disable-next-line react/prop-types
                            Cell: ({ row: { original } }) => {
                              // eslint-disable-next-line react/prop-types
                              const usuario = usuarios.find((u) => u.id === original.usuario_id);
                              // eslint-disable-next-line react/prop-types
                              const clasificador = clasificadores.find(
                                // eslint-disable-next-line react/prop-types
                                (c) => c.id === original.clasificador_id
                              );
                              return (
                                <MDBox display="flex" justifyContent="flex-end" gap={0.5}>
                                  <Tooltip title="Editar descripción">
                                    <IconButton
                                      size="small"
                                      color="info"
                                      // eslint-disable-next-line react/prop-types
                                      onClick={() => {
                                        // eslint-disable-next-line react/prop-types
                                        const comisionadoParaEditar = comisionados.find(
                                          // eslint-disable-next-line react/prop-types
                                          (c) => c.id === original.id
                                        );
                                        if (comisionadoParaEditar) {
                                          setComisionadoForm({
                                            usuario_id: comisionadoParaEditar.usuario_id,
                                            clasificador_id: comisionadoParaEditar.clasificador_id,
                                            dias: comisionadoParaEditar.dias,
                                            costo_xdia: comisionadoParaEditar.costo_xdia,
                                            descripcion: comisionadoParaEditar.descripcion || '',
                                            observacion: comisionadoParaEditar.observacion || '',
                                          });
                                          setEditingComisionadoId(comisionadoParaEditar.id);
                                          setOpenEditComisionado(true);
                                        }
                                      }}
                                      sx={{
                                        backgroundColor: '#e3f2fd',
                                        '&:hover': { backgroundColor: '#bbdefb' },
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      // eslint-disable-next-line react/prop-types
                                      onClick={() => handleEliminarComisionado(original.id)}
                                      sx={{
                                        backgroundColor: '#ffebee',
                                        '&:hover': { backgroundColor: '#ffcdd2' },
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </MDBox>
                              );
                            },
                          },
                        ],
                        rows: comisionados.map((comisionado) => {
                          const usuario = usuarios.find((u) => u.id === comisionado.usuario_id);
                          const clasificador = clasificadores.find(
                            (c) => c.id === comisionado.clasificador_id
                          );
                          return {
                            ...comisionado,
                            usuario_nombre: usuario?.nombre || '-',
                            clasificador_nombre: clasificador?.nombre || '-',
                            partida: clasificador?.partida || 'N/A',
                          };
                        }),
                      }}
                      isSorted={false}
                      noEndBorder
                    />
                  </Card>
                  <MDBox
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={2}
                    px={2}
                  >
                    <MDTypography variant="button" color="secondary" fontWeight="regular">
                      Total de Comisionados Únicos:{' '}
                      {new Set(comisionados.map((c) => c.usuario_id)).size}
                    </MDTypography>
                    <MDTypography
                      variant="button"
                      fontWeight="bold"
                      sx={{ fontSize: '1.1rem', color: '#667eea' }}
                    >
                      {' '}
                      Total Monto: S/.{' '}
                      {comisionados
                        .reduce((sum, c) => {
                          const partida = clasificadores.find((p) => p.id === c.clasificador_id);
                          const esViatico =
                            partida &&
                            partida.nombre &&
                            (partida.nombre.toLowerCase().includes('asignaciones') ||
                              (partida.nombre.toLowerCase().includes('viático') &&
                                !partida.nombre.toLowerCase().includes('terrestre') &&
                                !partida.nombre.toLowerCase().includes('aéreo') &&
                                !partida.nombre.toLowerCase().includes('fluvial')));
                          const monto = esViatico
                            ? parseInt(c.dias || 0) * parseFloat(c.costo_xdia || 0)
                            : parseFloat(c.costo_xdia || 0);
                          return sum + monto;
                        }, 0)
                        .toFixed(2)}
                    </MDTypography>
                  </MDBox>
                </>
              )}
            </MDBox>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancelar
            </Button>
            <MDButton variant="contained" color="info" onClick={handleGuardar} disabled={loading}>
              Guardar
            </MDButton>
          </DialogActions>
        </Dialog>
        {/* Modal de detalle de comisionados (solo lectura) */}
        <Dialog
          open={openDetalle}
          onClose={handleCloseDetalle}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: '600',
              fontSize: '1.3rem',
              pb: 2,
              backgroundColor: '#fff',
              color: '#2c3e50',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            Detalle de Comisionados
            {comisionSeleccionada && (
              <MDTypography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontSize: '0.85rem',
                  color: '#666',
                  fontWeight: '500',
                }}
              >
                Comisión #{comisionSeleccionada.id} • {comisionSeleccionada.lugar}
              </MDTypography>
            )}
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              pt: 2,
              pb: 2,
              px: 2,
              maxHeight: '70vh',
              overflow: 'auto',
            }}
          >
            {comisionados.length === 0 ? (
              <MDBox display="flex" justifyContent="center" alignItems="center" p={4}>
                <MDTypography variant="body2" color="textSecondary">
                  No hay comisionados para esta comisión
                </MDTypography>
              </MDBox>
            ) : (
              (() => {
                // Construir matriz agrupada por persona y partida
                const partidasInfoMap = new Map();

                comisionados.forEach((c) => {
                  if (!partidasInfoMap.has(c.partida)) {
                    partidasInfoMap.set(c.partida, {
                      partida: c.partida,
                      clasificador_nombre: c.clasificador_nombre,
                    });
                  }
                });

                const partidasUnicas = Array.from(partidasInfoMap.values());
                const usuariosUnicos = Array.from(
                  new Set(comisionados.map((c) => c.usuario_nombre))
                );

                const matrizMontos = {};
                const totalesPorPartida = {};
                const totalesPorUsuario = {};

                comisionados.forEach((c) => {
                  const usuario = c.usuario_nombre;
                  const partida = c.partida;
                  const monto =
                    Number(
                      c.monto_real !== undefined && c.monto_real !== null ? c.monto_real : c.monto
                    ) || 0;

                  if (!matrizMontos[usuario]) matrizMontos[usuario] = {};
                  matrizMontos[usuario][partida] = (matrizMontos[usuario][partida] || 0) + monto;

                  totalesPorPartida[partida] = (totalesPorPartida[partida] || 0) + monto;
                  totalesPorUsuario[usuario] = (totalesPorUsuario[usuario] || 0) + monto;
                });

                const totalGeneral = Object.values(totalesPorPartida).reduce(
                  (acc, val) => acc + val,
                  0
                );

                // Crear filas para DataTable
                const rows = usuariosUnicos.map((usuario) => {
                  const row = { usuario_nombre: usuario };
                  partidasUnicas.forEach((p) => {
                    const valor =
                      matrizMontos[usuario] && matrizMontos[usuario][p.partida]
                        ? matrizMontos[usuario][p.partida]
                        : 0;
                    row[`partida_${p.partida}`] = valor;
                  });
                  row.total_usuario = totalesPorUsuario[usuario] || 0;
                  return row;
                });

                // Agregar fila de totales
                const filaTotales = { usuario_nombre: 'TOTAL GENERAL' };
                partidasUnicas.forEach((p) => {
                  filaTotales[`partida_${p.partida}`] = totalesPorPartida[p.partida] || 0;
                });
                filaTotales.total_usuario = totalGeneral;
                rows.push(filaTotales);

                const columns = [
                  {
                    Header: 'Usuario / Persona',
                    accessor: 'usuario_nombre',
                    width: '28%',
                    Cell: ({ row: { original } }) => {
                      const esTotal = original.usuario_nombre === 'TOTAL GENERAL';
                      return (
                        <div
                          style={{
                            fontWeight: esTotal ? '700' : '600',
                            color: esTotal ? '#2c3e50' : '#2c3e50',
                            fontSize: esTotal ? '1rem' : '0.95rem',
                            backgroundColor: 'transparent',
                            padding: esTotal ? '10px' : '8px 0',
                            borderRadius: '0',
                            borderTop: esTotal ? '2px solid #667eea' : 'none',
                          }}
                        >
                          {original.usuario_nombre}
                        </div>
                      );
                    },
                  },
                  ...partidasUnicas.map((p) => ({
                    Header: (
                      <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#2c3e50',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.partida}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#555',
                            fontWeight: '500',
                            lineHeight: '1.2',
                          }}
                        >
                          {p.clasificador_nombre}
                        </div>
                      </div>
                    ),
                    accessor: `partida_${p.partida}`,
                    width: `${70 / (partidasUnicas.length + 1)}%`,
                    Cell: ({ row: { original } }) => {
                      const valor = original[`partida_${p.partida}`] || 0;
                      const esTotal = original.usuario_nombre === 'TOTAL GENERAL';

                      return (
                        <div
                          style={{
                            display: 'flex',
                            width: '100%',
                            justifyContent: 'flex-end',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: esTotal ? '700' : valor > 0 ? '600' : '500',
                              color: valor > 0 ? '#2c3e50' : '#bbb',
                              padding: esTotal ? '10px 12px' : '8px 12px',
                              borderRadius: '0',
                              textAlign: 'right',
                            }}
                          >
                            {valor > 0
                              ? valor.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : esTotal
                              ? '0.00'
                              : '-'}
                          </span>
                        </div>
                      );
                    },
                  })),
                  {
                    Header: 'Total Persona',
                    accessor: 'total_usuario',
                    width: `${70 / (partidasUnicas.length + 1)}%`,
                    Cell: ({ row: { original } }) => {
                      const valor = original.total_usuario || 0;
                      const esTotal = original.usuario_nombre === 'TOTAL GENERAL';

                      if (esTotal) {
                        return (
                          <div
                            style={{
                              display: 'flex',
                              width: '100%',
                              justifyContent: 'flex-end',
                              backgroundColor: 'transparent',
                            }}
                          >
                            <span
                              style={{
                                color: '#2c3e50',
                                fontWeight: '700',
                                fontSize: '1rem',
                                padding: '10px 12px',
                                borderRadius: '0',
                                textAlign: 'right',
                              }}
                            >
                              {valor.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          style={{
                            display: 'flex',
                            width: '100%',
                            justifyContent: 'flex-end',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: '600',
                              color: '#2c3e50',
                              padding: '8px 12px',
                              borderRadius: '0',
                              fontSize: '0.95rem',
                              textAlign: 'right',
                            }}
                          >
                            {valor.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      );
                    },
                  },
                ];

                return (
                  <Card
                    sx={{
                      borderRadius: '8px',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #e8eaed',
                      overflow: 'hidden',
                    }}
                  >
                    <DataTable
                      table={{ columns, rows }}
                      isSorted={false}
                      entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                      showTotalEntries
                      noEndBorder
                    />
                  </Card>
                );
              })()
            )}
          </DialogContent>
          <DialogActions sx={{ pt: 2, pb: 2, px: 2, gap: 1 }}>
            <MDButton
              variant="contained"
              color="info"
              onClick={handleCloseDetalle}
              sx={{
                borderRadius: '6px',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: '600',
                px: 3.5,
              }}
            >
              Cerrar
            </MDButton>
          </DialogActions>
        </Dialog>

        {/* Modal de Presupuesto */}
        <Dialog
          open={openPresupuesto}
          onClose={handleCerrarPresupuesto}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              overflow: 'hidden',
              zIndex: 1300,
            },
          }}
        >
          <DialogTitle>Asignar Presupuesto</DialogTitle>
          <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
            <MDBox display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Número de Documento"
                placeholder="Ej: RD-2026-001"
                value={presupuestoForm.presupuesto_documento}
                onChange={(e) =>
                  setPresupuestoForm({
                    ...presupuestoForm,
                    presupuesto_documento: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
              />
              <TextField
                label="Número de CUT"
                placeholder="Ej: CUT-2026-12345"
                value={presupuestoForm.presupuesto_numero_cut}
                onChange={(e) =>
                  setPresupuestoForm({
                    ...presupuestoForm,
                    presupuesto_numero_cut: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
              />
              <TextField
                label="Fecha del Documento"
                type="date"
                value={presupuestoForm.presupuesto_fecha}
                onChange={(e) =>
                  setPresupuestoForm({
                    ...presupuestoForm,
                    presupuesto_fecha: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </MDBox>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCerrarPresupuesto} color="secondary">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarPresupuesto}
              color="primary"
              variant="outlined"
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  backgroundColor: '#f0f3ff',
                  borderColor: '#667eea',
                },
              }}
            >
              Asignar Presupuesto
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Asignación Masiva de Presupuesto */}
        <Dialog
          open={openPresupuestoMasivo}
          onClose={() => setOpenPresupuestoMasivo(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              overflow: 'hidden',
              zIndex: 1300,
            },
          }}
        >
          <DialogTitle>
            {`Asignar Presupuesto en Masa (${comisionesSeleccionadas.length})`}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
            <MDBox display="flex" flexDirection="column" gap={2}>
              <MDTypography variant="body2" color="textSecondary">
                Se asignará el presupuesto a {comisionesSeleccionadas.length} comisión(es).
              </MDTypography>
              <TextField
                label="Número de Documento"
                placeholder="Ej: RD-2026-001"
                value={presupuestoMasivoForm.presupuesto_documento}
                onChange={(e) =>
                  setPresupuestoMasivoForm({
                    ...presupuestoMasivoForm,
                    presupuesto_documento: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
              />
              <TextField
                label="Número de CUT"
                placeholder="Ej: CUT-2026-12345"
                value={presupuestoMasivoForm.presupuesto_numero_cut}
                onChange={(e) =>
                  setPresupuestoMasivoForm({
                    ...presupuestoMasivoForm,
                    presupuesto_numero_cut: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
              />
              <TextField
                label="Fecha del Documento"
                type="date"
                value={presupuestoMasivoForm.presupuesto_fecha}
                onChange={(e) =>
                  setPresupuestoMasivoForm({
                    ...presupuestoMasivoForm,
                    presupuesto_fecha: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </MDBox>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPresupuestoMasivo(false)} color="secondary">
              Cancelar
            </Button>
            <Button
              onClick={handleAsignarPresupuestoMasivo}
              color="primary"
              variant="outlined"
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': {
                  backgroundColor: '#fff3e0',
                  borderColor: '#ff9800',
                },
              }}
            >
              Asignar a {comisionesSeleccionadas.length}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para editar descripción del comisionado */}
        <Dialog
          open={openEditComisionado}
          onClose={() => setOpenEditComisionado(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Editar Descripción/Observación</DialogTitle>
          <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
            <MDBox display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Descripción"
                value={comisionadoForm.descripcion || ''}
                onChange={(e) =>
                  setComisionadoForm({
                    ...comisionadoForm,
                    descripcion: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={2}
              />
              <TextField
                label="Observación"
                value={comisionadoForm.observacion || ''}
                onChange={(e) =>
                  setComisionadoForm({
                    ...comisionadoForm,
                    observacion: e.target.value,
                  })
                }
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={3}
              />
            </MDBox>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditComisionado(false)} color="secondary">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Actualizar el comisionado en la lista
                const comisionadoIndex = comisionados.findIndex(
                  (c) => c.id === editingComisionadoId
                );
                if (comisionadoIndex !== -1) {
                  const nuevosComisionados = [...comisionados];
                  nuevosComisionados[comisionadoIndex] = {
                    ...nuevosComisionados[comisionadoIndex],
                    descripcion: comisionadoForm.descripcion,
                    observacion: comisionadoForm.observacion,
                  };
                  setComisionados(nuevosComisionados);
                }
                setOpenEditComisionado(false);
              }}
              color="primary"
              variant="contained"
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GestionComisiones;
