-- Ejecutar en la base de datos de Hostinger antes de publicar estos cambios.
-- Seguro para volver a ejecutar: conserva las preferencias existentes.
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'cash_discount_enabled'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE ordenes ADD COLUMN cash_discount_enabled TINYINT(1) NOT NULL DEFAULT 1',
    'SELECT "cash_discount_enabled already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
