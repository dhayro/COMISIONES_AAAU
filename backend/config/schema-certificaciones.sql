-- ========== TABLAS PARA CERTIFICACIÓN DE CRÉDITO PRESUPUESTARIO ==========

-- 1. TABLA PRINCIPAL: CERTIFICACIONES_CREDITO
CREATE TABLE IF NOT EXISTS certificaciones_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nota VARCHAR(255) NOT NULL,
  mes VARCHAR(20) NOT NULL,
  fecha_aprobacion DATE,
  fecha_documento DATE,
  estado_certificacion VARCHAR(50) DEFAULT 'PENDIENTE' COMMENT 'PENDIENTE, APROBADA, RECHAZADA',
  tipo_documento VARCHAR(100) NOT NULL,
  numero_documento VARCHAR(100) NOT NULL,
  justificacion TEXT,
  meta_id INT,
  fuente_financiamiento_id INT,
  usuario_id INT NOT NULL,
  ruta_archivo_pdf VARCHAR(500) COMMENT 'Ruta relativa del PDF almacenado en disco',
  nombre_archivo_pdf VARCHAR(255) COMMENT 'Nombre original del PDF',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE SET NULL,
  FOREIGN KEY (fuente_financiamiento_id) REFERENCES fuentes_financiamiento(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_nota_mes_documento (nota, mes, numero_documento),
  INDEX idx_meta_id (meta_id),
  INDEX idx_fuente_financiamiento_id (fuente_financiamiento_id),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_estado (estado_certificacion),
  INDEX idx_mes (mes),
  INDEX idx_numero_documento (numero_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA DETALLE: DETALLES_CERTIFICACION_CREDITO
CREATE TABLE IF NOT EXISTS detalles_certificacion_credito (
  id INT PRIMARY KEY AUTO_INCREMENT,
  certificacion_credito_id INT NOT NULL,
  clasificador_id INT NOT NULL,
  monto DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (certificacion_credito_id) REFERENCES certificaciones_credito(id) ON DELETE CASCADE,
  FOREIGN KEY (clasificador_id) REFERENCES clasificadores(id) ON DELETE RESTRICT,
  
  INDEX idx_certificacion_credito_id (certificacion_credito_id),
  INDEX idx_clasificador_id (clasificador_id),
  UNIQUE KEY unique_cert_clasificador (certificacion_credito_id, clasificador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== VISTA PARA CONSULTAS COMUNES ==========

CREATE OR REPLACE VIEW certificaciones_credito_detalladas AS
SELECT 
  cc.id,
  cc.nota,
  cc.mes,
  cc.fecha_aprobacion,
  cc.fecha_documento,
  cc.estado_certificacion,
  cc.tipo_documento,
  cc.numero_documento,
  cc.justificacion,
  cc.meta_id,
  m.nombre as meta_nombre,
  m.numero_meta,
  cc.fuente_financiamiento_id,
  ff.nombre as fuente_financiamiento_nombre,
  cc.usuario_id,
  u.nombre as usuario_nombre,
  cc.created_at,
  cc.updated_at,
  COUNT(dcc.id) as total_detalles,
  SUM(dcc.monto) as total_monto
FROM certificaciones_credito cc
LEFT JOIN metas m ON cc.meta_id = m.id
LEFT JOIN fuentes_financiamiento ff ON cc.fuente_financiamiento_id = ff.id
LEFT JOIN users u ON cc.usuario_id = u.id
LEFT JOIN detalles_certificacion_credito dcc ON cc.id = dcc.certificacion_credito_id
GROUP BY cc.id, cc.nota, cc.mes, cc.fecha_aprobacion, cc.fecha_documento, 
         cc.estado_certificacion, cc.tipo_documento, cc.numero_documento, 
         cc.justificacion, cc.meta_id, m.nombre, m.numero_meta,
         cc.fuente_financiamiento_id, ff.nombre, cc.usuario_id, u.nombre,
         cc.created_at, cc.updated_at;
