// Cálculo de vencimiento de rendición: 10 días hábiles después de la fecha de retorno,
// excluyendo sábados, domingos y feriados (tabla feriados).

const formatoIso = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

export const esDiaHabil = (fecha, feriadosSet) => {
  const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
  return !esFinDeSemana && !feriadosSet.has(formatoIso(fecha));
};

export const calcularVencimientoRendicion = (fechaRetorno, feriadosSet) => {
  const [anio, mes, dia] = String(fechaRetorno).slice(0, 10).split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  let diasHabiles = 0;
  while (diasHabiles < 10) {
    fecha.setDate(fecha.getDate() + 1);
    if (esDiaHabil(fecha, feriadosSet)) diasHabiles++;
  }
  return fecha;
};

// Días hábiles desde hoy hasta la fecha indicada. Negativo si ya pasó.
export const diasHabilesRespectoHoy = (vencimiento, feriadosSet) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(hoy);
  const fin = new Date(vencimiento);
  fin.setHours(0, 0, 0, 0);

  if (fin.getTime() === inicio.getTime()) return 0;

  const adelante = fin > inicio;
  const cursor = new Date(adelante ? inicio : fin);
  const limite = adelante ? fin : inicio;
  let dias = 0;
  while (cursor < limite) {
    cursor.setDate(cursor.getDate() + 1);
    if (esDiaHabil(cursor, feriadosSet)) dias++;
  }
  return adelante ? dias : -dias;
};
