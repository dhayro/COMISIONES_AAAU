-- ========== MIGRACIÓN: Crear tabla correlativo_control ==========
-- Tabla para controlar el número inicial de correlativo por usuario y año
-- Permite configurar desde qué número comienza cada usuario

CREATE TABLE IF NOT EXISTS correlativo_control (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Usuario y período
  usuario_id INT NOT NULL,
  ano INT NOT NULL,
  
  -- Configuración del correlativo
  numero_inicial INT NOT NULL DEFAULT 1,
  numero_proximo INT NOT NULL DEFAULT 1,
  prefijo VARCHAR(50),
  
  -- Información de control
  descripcion VARCHAR(255),
  activo BOOLEAN DEFAULT 1,
  
  -- Auditoría
  creado_por INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (creado_por) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_usuario_ano (usuario_id, ano),
  INDEX idx_usuario (usuario_id),
  INDEX idx_ano (ano),
  INDEX idx_activo (activo)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
