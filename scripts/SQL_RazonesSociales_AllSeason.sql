-- =====================================================================
-- GEN_RazonesSociales + SAS_EncabPedido.IdRazonSocial
-- Cliente: ALL SEASON FLOWERS (datenban_AllSeasonFlowers)
-- Funcionalidad: múltiples razones sociales ("Empresa Emisora") en Pedidos.
-- Multi-cliente: este script SOLO aplica a la base de AllSeason.
-- Flagracol no ejecuta este script; los PHP detectan la ausencia de la
-- tabla/columna y usan las constantes de empresa.php (comportamiento actual).
-- =====================================================================

-- 1. Tabla de razones sociales -----------------------------------------
CREATE TABLE IF NOT EXISTS `GEN_RazonesSociales` (
    `IdRazonSocial`       INT(11)      NOT NULL AUTO_INCREMENT,
    `Nombre`              VARCHAR(200) NOT NULL,
    `NIT`                 VARCHAR(30)  NULL,
    `Direccion`           VARCHAR(255) NULL,
    `Ciudad`              VARCHAR(100) NULL,
    `Pais`                VARCHAR(100) NULL,
    `Telefono`            VARCHAR(100) NULL,
    `Email`               VARCHAR(120) NULL,
    `Logo`                VARCHAR(255) NULL COMMENT 'Ruta relativa a DOCUMENT_ROOT (ej: /DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg)',
    `PrefijoInvoice`      VARCHAR(10)  NULL COMMENT 'Prefijo de la factura (ej: ASF, FFL)',
    `RegistroICA`         VARCHAR(100) NULL,
    `CultivoRegistroICA`  VARCHAR(100) NULL,
    `RepresentanteLegal`  VARCHAR(150) NULL,
    `CCRepresentante`     VARCHAR(30)  NULL,
    `InspectorNombre`     VARCHAR(150) NULL,
    `InspectorCC`         VARCHAR(30)  NULL,
    `InspectorTP`         VARCHAR(50)  NULL,
    `InspectorRegSV`      VARCHAR(50)  NULL,
    `PorDefecto`          TINYINT(1)   NOT NULL DEFAULT 0,
    `Activo`              TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (`IdRazonSocial`),
    KEY `idx_rs_nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Fila semilla: All Season Flowers (por defecto) ----------------------
-- Datos tomados de src/Api/config/AllSeasonFlowers/empresa.php
INSERT INTO `GEN_RazonesSociales`
    (`IdRazonSocial`, `Nombre`, `NIT`, `Direccion`, `Ciudad`, `Pais`,
     `Telefono`, `Email`, `Logo`, `PrefijoInvoice`, `RegistroICA`, `CultivoRegistroICA`,
     `RepresentanteLegal`, `CCRepresentante`,
     `InspectorNombre`, `InspectorCC`, `InspectorTP`, `InspectorRegSV`,
     `PorDefecto`, `Activo`)
VALUES
    (1, 'ALL SEASON FLOWERS SAS', '901.984.016-8',
     'Finca Villa Clemencia Vrd. Prado', 'Facatativa, Cundinamarca, Colombia', 'Colombia',
     '(+057) 3114677282 - 3023090940', 'freshfloral.erikajuley@gmail.com',
     '/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg', 'ASF',
     'REGISTRO ICA EXP250201', 'EXP250201',
     'ERIKA JULEY GONZALEZ CHINGATE', '1.073.525.441',
     'JOSE YAIR FONSECA CAMACHO', '1073514261', '091019-0567503', '2502027',
     1, 1);

-- 3. Fila semilla: Fresh Floral LLC (segunda razón social) ----------------
-- Completar los campos con <<...>> antes de ejecutar.
INSERT INTO `GEN_RazonesSociales`
    (`IdRazonSocial`, `Nombre`, `NIT`, `Direccion`, `Ciudad`, `Pais`,
     `Telefono`, `Email`, `Logo`, `PrefijoInvoice`, `RegistroICA`, `CultivoRegistroICA`,
     `RepresentanteLegal`, `CCRepresentante`,
     `InspectorNombre`, `InspectorCC`, `InspectorTP`, `InspectorRegSV`,
     `PorDefecto`, `Activo`)
VALUES
    (2, 'FRESH FLORAL LLC', '<<NIT>>',
     '<<DIRECCION>>', '<<CIUDAD>>', 'Estados Unidos',
     '<<TELEFONO>>', '<<EMAIL>>',
     '<<RUTA_LOGO>>', 'FFL',
     '<<REGISTRO_ICA>>', '<<CULTIVO_REGISTRO_ICA>>',
     '<<REPRESENTANTE_LEGAL>>', '<<CC_REPRESENTANTE>>',
     '<<INSPECTOR_NOMBRE>>', '<<INSPECTOR_CC>>', '<<INSPECTOR_TP>>', '<<INSPECTOR_REG_SV>>',
     0, 1);

-- 4. Agregar columna a SAS_EncabPedido (idempotente) ---------------------
SET @columna := (SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'SAS_EncabPedido'
                   AND COLUMN_NAME = 'IdRazonSocial');
SET @sql := IF(@columna = 0,
    'ALTER TABLE `SAS_EncabPedido` ADD COLUMN `IdRazonSocial` INT(11) NULL DEFAULT NULL AFTER `IdEncabPedidoEmpresa`',
    'SELECT 1');
PREPARE stmt_rs FROM @sql;
EXECUTE stmt_rs;
DEALLOCATE PREPARE stmt_rs;

-- 5. Verificación (opcional) ----------------------------------------------
-- SELECT IdRazonSocial, Nombre, PorDefecto FROM GEN_RazonesSociales WHERE Activo = 1 ORDER BY PorDefecto DESC, Nombre;
-- SHOW COLUMNS FROM SAS_EncabPedido LIKE 'IdRazonSocial';
