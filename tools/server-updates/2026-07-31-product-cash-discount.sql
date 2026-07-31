ALTER TABLE products
    ADD COLUMN cash_discount_percentage DECIMAL(5,2) NULL AFTER offer_end_at;

INSERT INTO site_global_config (config_key, config_value, updated_at) VALUES
    ('product_cash_discount_enabled', '1', CURRENT_TIMESTAMP),
    ('product_cash_discount_threshold', '20000', CURRENT_TIMESTAMP),
    ('product_cash_discount_percentage', '10', CURRENT_TIMESTAMP),
    ('product_cash_discount_note', 'Oferta en efectivo al retirar en el local.', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    config_value = VALUES(config_value),
    updated_at = CURRENT_TIMESTAMP;
