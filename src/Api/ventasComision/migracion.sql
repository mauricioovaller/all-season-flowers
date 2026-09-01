-- ============================================================================
-- Migración: Módulo Ventas Comisión
-- Descripción: Creación de tablas independientes para el módulo Ventas Comisión
-- Cliente: Flagracol SAS (inicialmente)
-- Fecha: Julio 2026
-- ============================================================================

-- 1. SAS_EncabPedidoComision - Encabezado de pedidos de comisión
CREATE TABLE IF NOT EXISTS SAS_EncabPedidoComision (
    IdEncabPedidoComision INT AUTO_INCREMENT PRIMARY KEY,
    NumeroPedido VARCHAR(20) NOT NULL,
    IdCliente INT NOT NULL,
    IdEjecutivo INT NOT NULL DEFAULT 0,
    IdMoneda INT NOT NULL DEFAULT 0,
    TRM DECIMAL(10,4) NOT NULL DEFAULT 0,
    FechaSolicitud DATE DEFAULT NULL,
    FechaEntrega DATE DEFAULT NULL,
    PO_Cliente VARCHAR(100) DEFAULT NULL,
    Observaciones TEXT DEFAULT NULL,
    AWB VARCHAR(50) DEFAULT NULL,
    AWB_HIJA VARCHAR(50) DEFAULT NULL,
    AWB_NIETA VARCHAR(50) DEFAULT NULL,
    IdAerolinea INT DEFAULT 0,
    IdAgencia INT DEFAULT 0,
    PuertoSalida VARCHAR(100) DEFAULT NULL,
    IVA TINYINT DEFAULT 0,
    Estado VARCHAR(20) DEFAULT 'Activo',
    PorcentajeComision DECIMAL(5,2) DEFAULT 0,
    
    -- Campos de devolución (UPDATE-only)
    IdDevolucion INT DEFAULT NULL,
    FechaDevolucion DATE DEFAULT NULL,
    ObservacionesDevolucion TEXT DEFAULT NULL,
    
    INDEX idx_numero_pedido (NumeroPedido),
    INDEX idx_cliente (IdCliente),
    INDEX idx_fechas (FechaSolicitud, FechaEntrega),
    INDEX idx_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SAS_DetEmpaqueComision - Empaques por pedido
CREATE TABLE IF NOT EXISTS SAS_DetEmpaqueComision (
    IdDetEmpaqueComision INT AUTO_INCREMENT PRIMARY KEY,
    IdEncabPedidoComision INT NOT NULL,
    IdTipoEmpaque INT NOT NULL DEFAULT 0,
    Cantidad INT NOT NULL DEFAULT 0,
    PO_Empaque VARCHAR(100) DEFAULT NULL,
    Anulado TINYINT DEFAULT 0,
    
    INDEX idx_encabezado (IdEncabPedidoComision),
    CONSTRAINT fk_det_empaque_comision FOREIGN KEY (IdEncabPedidoComision) 
        REFERENCES SAS_EncabPedidoComision(IdEncabPedidoComision) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SAS_DetProductoComision - Productos dentro de empaques
CREATE TABLE IF NOT EXISTS SAS_DetProductoComision (
    IdDetProductoComision INT AUTO_INCREMENT PRIMARY KEY,
    IdDetEmpaqueComision INT NOT NULL,
    IdEncabPedidoComision INT NOT NULL,
    IdProducto INT NOT NULL DEFAULT 0,
    IdVariedad INT DEFAULT 0,
    IdGrado INT DEFAULT 0,
    Descripcion VARCHAR(255) DEFAULT NULL,
    IdUnidad INT NOT NULL DEFAULT 0,
    IdPredio INT DEFAULT 0,
    Tallos_Ramo INT DEFAULT 0,
    Ramos_Caja INT DEFAULT 0,
    Precio_Venta DECIMAL(12,4) DEFAULT 0,
    Anulado TINYINT DEFAULT 0,
    PorcentajeComision DECIMAL(5,2) DEFAULT NULL,
    
    -- Campos de devolución (UPDATE-only)
    TallosDevolucion INT DEFAULT NULL,
    MotivoDevolucion VARCHAR(255) DEFAULT NULL,
    Flete DECIMAL(12,4) DEFAULT NULL,
    Fumigacion DECIMAL(12,4) DEFAULT NULL,
    Otros DECIMAL(12,4) DEFAULT NULL,
    
    INDEX idx_empaque (IdDetEmpaqueComision),
    INDEX idx_encabezado (IdEncabPedidoComision),
    INDEX idx_producto (IdProducto),
    CONSTRAINT fk_det_producto_comision_empaque FOREIGN KEY (IdDetEmpaqueComision) 
        REFERENCES SAS_DetEmpaqueComision(IdDetEmpaqueComision) ON DELETE CASCADE,
    CONSTRAINT fk_det_producto_comision_encab FOREIGN KEY (IdEncabPedidoComision) 
        REFERENCES SAS_EncabPedidoComision(IdEncabPedidoComision) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SAS_DetRecetaComision - Recetas (ingredientes de bouquets)
CREATE TABLE IF NOT EXISTS SAS_DetRecetaComision (
    IdDetRecetaComision INT AUTO_INCREMENT PRIMARY KEY,
    IdDetProductoComision INT NOT NULL,
    IdDetEmpaqueComision INT NOT NULL,
    IdEncabPedidoComision INT NOT NULL,
    IdProducto INT NOT NULL DEFAULT 0,
    IdVariedad INT DEFAULT 0,
    Cantidad INT DEFAULT 0,
    Anulado TINYINT DEFAULT 0,
    
    INDEX idx_producto_det (IdDetProductoComision),
    INDEX idx_empaque (IdDetEmpaqueComision),
    INDEX idx_encabezado (IdEncabPedidoComision),
    CONSTRAINT fk_det_receta_comision_producto FOREIGN KEY (IdDetProductoComision) 
        REFERENCES SAS_DetProductoComision(IdDetProductoComision) ON DELETE CASCADE,
    CONSTRAINT fk_det_receta_comision_empaque FOREIGN KEY (IdDetEmpaqueComision) 
        REFERENCES SAS_DetEmpaqueComision(IdDetEmpaqueComision) ON DELETE CASCADE,
    CONSTRAINT fk_det_receta_comision_encab FOREIGN KEY (IdEncabPedidoComision) 
        REFERENCES SAS_EncabPedidoComision(IdEncabPedidoComision) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
