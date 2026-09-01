-- ============================================
-- Script: Agregar campo DestinoFinal
-- Tabla: SAS_EncabPedido
-- Tabla: SAS_Planillas (si existe)
-- Fecha: 2 de junio 2026
-- Descripción: Permite guardar y editar el destino final en las planillas
-- Instrucciones:
--   1. Ejecutar este script una sola vez en ambas bases de datos:
--      - datenban_AllSeasonFlowers
--      - datenban_FlagracolSAS
--   2. Verificar con el SELECT al final
--   3. Si todo es correcto, podrá usar la feature de DestinoFinal editable
-- ============================================

-- Paso 1: Agregar columna a SAS_EncabPedido
-- Si la columna ya existe, esto no causará error
ALTER TABLE SAS_EncabPedido 
ADD COLUMN DestinoFinal VARCHAR(500) NULL DEFAULT NULL 
AFTER Precinto;

-- Paso 2: Agregar columna a SAS_Planillas (si la tabla existe)
-- Se verifica primero si la tabla existe para evitar errores
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                      WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'SAS_Planillas');

SET @alter_query = IF(@table_exists = 1,
    "ALTER TABLE SAS_Planillas ADD COLUMN DestinoFinal VARCHAR(500) NULL DEFAULT NULL AFTER Precinto",
    "SELECT 'Tabla SAS_Planillas no existe, omitiendo agregación'");

PREPARE stmt FROM @alter_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 3: Verificar que ambas columnas fueron agregadas correctamente
-- Verificar SAS_EncabPedido
SELECT 
    'SAS_EncabPedido' AS tabla,
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='SAS_EncabPedido' 
AND COLUMN_NAME='DestinoFinal';

-- Verificar SAS_Planillas (si existe)
SELECT 
    'SAS_Planillas' AS tabla,
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='SAS_Planillas' 
AND COLUMN_NAME='DestinoFinal';

-- Paso 4: Mostrar estructura parcial de ambas tablas para confirmación
SELECT 'Columnas de SAS_EncabPedido cerca de DestinoFinal:';
SELECT COLUMN_NAME, COLUMN_TYPE, ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME='SAS_EncabPedido'
AND ORDINAL_POSITION BETWEEN 
    (SELECT ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME='SAS_EncabPedido' AND COLUMN_NAME='Precinto') 
    AND 
    (SELECT ORDINAL_POSITION FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME='SAS_EncabPedido' AND COLUMN_NAME='DestinoFinal') + 3
ORDER BY ORDINAL_POSITION;
