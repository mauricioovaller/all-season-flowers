-- =============================================================================
-- Creación de tablas para el módulo de Bajas (Salidas por daño, pérdida, obsequio)
-- =============================================================================
-- Ejecutar en la base de datos correspondiente (datenban_AllSeasonFlowers, etc.)

CREATE TABLE IF NOT EXISTS SAS_EncabBaja (
    IdEncabBaja INT AUTO_INCREMENT PRIMARY KEY,
    Fecha DATE NOT NULL,
    MotivoGeneral VARCHAR(250) NOT NULL,
    Observaciones TEXT,
    QuienAutoriza VARCHAR(150),
    Anulado TINYINT DEFAULT 0,
    FechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SAS_DetBaja (
    IdDetBaja INT AUTO_INCREMENT PRIMARY KEY,
    IdEncabBaja INT NOT NULL,
    IdProducto INT NOT NULL,
    IdVariedad INT DEFAULT NULL,
    IdGrado INT DEFAULT NULL,
    Tallos INT NOT NULL DEFAULT 0,
    MotivoSalida VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (IdEncabBaja) REFERENCES SAS_EncabBaja(IdEncabBaja) ON DELETE CASCADE,
    FOREIGN KEY (IdProducto) REFERENCES GEN_Productos(IdProducto),
    FOREIGN KEY (IdVariedad) REFERENCES GEN_Variedades(IdVariedad),
    FOREIGN KEY (IdGrado) REFERENCES GEN_Grados(IdGrado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
