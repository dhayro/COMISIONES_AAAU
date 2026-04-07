-- Agregar campo actividad_realizar a tabla formato_emisiones
-- Fecha: 2026-03-23

ALTER TABLE formato_emisiones 
ADD COLUMN actividad_realizar VARCHAR(500) NULL AFTER observacion;

-- Mensaje de confirmación
-- Este campo almacenará la actividad a realizar en la comisión de servicios
-- Se diferencia de observacion que es para notas adicionales
