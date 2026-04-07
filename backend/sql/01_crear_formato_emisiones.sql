-- ========== TABLA 1: formato_emisiones ==========
-- Réplica de comisiones a nivel de usuario
-- Cada usuario tiene su propio formato de emisión para cada comisión

CREATE TABLE IF NOT EXISTS formato_emisiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Relaciones
  comision_id INT NOT NULL,
  usuario_id INT NOT NULL,
  costo_viaje_id INT,
  meta_id INT,  -- 🆕 META donde se asigna el gasto
  
  -- Información básica de la emisión
  numero_documento VARCHAR(50) NOT NULL UNIQUE,  -- Ej: EF-2026-00001
  fecha_emision DATETIME NOT NULL,
  
  -- Datos de ubicación y viaje (heredados de comisión)
  lugar VARCHAR(100) NOT NULL,
  ruta VARCHAR(255),
  modalidad_viaje ENUM('TERRESTRE', 'AEREO', 'FLUVIAL', 'AEREO-TERRESTRE', 'AEREO-FLUVIAL', 'TERRESTRE-FLUVIAL', 'AEREO-TERRESTRE-FLUVIAL') DEFAULT 'TERRESTRE',
  fecha_salida DATETIME NOT NULL,
  fecha_retorno DATETIME NOT NULL,
  num_dias INT NOT NULL,
  
  -- Datos de pago
  numero_siaf VARCHAR(10),                -- 10 dígitos SIAF
  codigo_cp VARCHAR(20),                  -- CP: 24089.26.95.2605669
  
  -- Tipo de movimiento
  tipo_emision ENUM('ANTICIPO', 'REEMBOLSO') DEFAULT 'REEMBOLSO',
  
  -- Montos
  costo_xdia DECIMAL(10, 2) NOT NULL,
  monto_total DECIMAL(10, 2) DEFAULT 0,
  
  -- Estado del formato
  estado_emision ENUM('BORRADOR', 'EMITIDO', 'ENVIADO', 'PAGADO', 'ANULADO') DEFAULT 'BORRADOR',
  
  -- Fechas del proceso
  fecha_envio DATETIME,
  fecha_pago DATETIME,
  
  -- Observaciones
  observacion TEXT,
  
  -- Auditoría
  creado_por INT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (comision_id) REFERENCES comisiones(id) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (costo_viaje_id) REFERENCES costos_viaje(id) ON DELETE SET NULL,
  FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE SET NULL,  -- 🆕 Relación con metas
  FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Índices
  INDEX idx_comision (comision_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_costo_viaje (costo_viaje_id),
  INDEX idx_meta (meta_id),  -- 🆕 Índice para meta
  INDEX idx_estado (estado_emision),
  INDEX idx_numero_documento (numero_documento),
  INDEX idx_siaf (numero_siaf),
  INDEX idx_cp (codigo_cp),
  INDEX idx_tipo_emision (tipo_emision),
  INDEX idx_fecha_emision (fecha_emision)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ========== TABLA 2: formato_emisiones_detalles ==========
-- Detalles del formato (clasificadores y montos)
-- Relación con detalles de certificación de crédito

CREATE TABLE IF NOT EXISTS formato_emisiones_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Relación con formato principal
  formato_emision_id INT NOT NULL,
  
  -- Clasificador (detalle del gasto)
  clasificador_id INT NOT NULL,
  
  -- Relación con certificación de crédito
  detalles_certificacion_credito_id INT,  -- Relación con detalles_certificacion_credito
  
  -- Montos
  monto DECIMAL(10, 2) NOT NULL,
  
  -- Descripción y observaciones
  descripcion TEXT,
  observacion TEXT,
  
  -- Auditoría
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (formato_emision_id) REFERENCES formato_emisiones(id) ON DELETE CASCADE,
  FOREIGN KEY (clasificador_id) REFERENCES clasificadores(id) ON DELETE RESTRICT,
  FOREIGN KEY (detalles_certificacion_credito_id) REFERENCES detalles_certificacion_credito(id) ON DELETE SET NULL,
  
  -- Índices
  INDEX idx_formato (formato_emision_id),
  INDEX idx_clasificador (clasificador_id),
  INDEX idx_certificacion_detalle (detalles_certificacion_credito_id),
  UNIQUE KEY unique_formato_clasificador (formato_emision_id, clasificador_id)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
