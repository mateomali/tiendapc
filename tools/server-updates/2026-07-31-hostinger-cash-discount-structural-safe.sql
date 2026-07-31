-- Actualizacion estructural segura para Hostinger / MySQL.
-- Ejecutar una sola vez antes o despues de subir el bundle.
-- Es idempotente: si las columnas ya existen, no las vuelve a crear.

SET @schema_name = DATABASE();

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'cash_discount_percentage'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE products ADD COLUMN cash_discount_percentage DECIMAL(5,2) NULL AFTER offer_end_at',
    'SELECT "products.cash_discount_percentage already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'cash_discount_mode'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE products ADD COLUMN cash_discount_mode VARCHAR(20) NULL AFTER cash_discount_percentage',
    'SELECT "products.cash_discount_mode already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'cash_price'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE products ADD COLUMN cash_price INT NULL AFTER cash_discount_mode',
    'SELECT "products.cash_price already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO site_global_config (config_key, config_value, updated_at) VALUES
    ('product_cash_discount_enabled', '1', CURRENT_TIMESTAMP),
    ('product_cash_discount_threshold', '20000', CURRENT_TIMESTAMP),
    ('product_cash_discount_percentage', '10', CURRENT_TIMESTAMP),
    ('product_cash_discount_note', 'Oferta en efectivo al retirar en el local.', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    config_value = VALUES(config_value),
    updated_at = CURRENT_TIMESTAMP;
