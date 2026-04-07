-- ========== TABLA: correlativo_control ==========
-- Control de correlativo inicial para cada usuario y año
-- Permite definir desde qué número comienza el correlativo
-- Ej: Usuario DKT año 2026 comienza en 001, Usuario JRG año 2026 comienza en 100

CREATE TABLE IF NOT EXISTS correlativo_control (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Usuario y período
  usuario_id INT NOT NULL,
  ano INT NOT NULL,
  
  -- Configuración del correlativo
  numero_inicial INT NOT NULL DEFAULT 1,  -- Desde qué número empieza (001, 100, etc)
  numero_proximo INT NOT NULL DEFAULT 1,  -- Próximo número a usar
  prefijo VARCHAR(50),                     -- Opcional: prefijo adicional antes de las iniciales
  
  -- Información de control
  descripcion VARCHAR(255),
  activo BOOLEAN DEFAULT 1,
  
  -- Auditoría
  creado_por INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints y índices
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_usuario_ano (usuario_id, ano),
  INDEX idx_usuario (usuario_id),
  INDEX idx_ano (ano),
  INDEX idx_activo (activo)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar registro de ejemplo para usuario DKT año 2026 empezando en 001
-- INSERT INTO correlativo_control (usuario_id, ano, numero_inicial, numero_proximo, prefijo, descripcion, creado_por) 
-- VALUES (1, 2026, 1, 1, NULL, 'Control de correlativos para DKT en 2026', 1);
