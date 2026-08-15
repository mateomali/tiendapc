SET @schema_name = DATABASE();

SET @color_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'color'
);

SET @add_color_sql = IF(
    @color_column_exists = 0,
    'ALTER TABLE `ordenes` ADD COLUMN `color` VARCHAR(80) NULL AFTER `modelo`',
    'SELECT ''ordenes.color already exists'' AS status'
);

PREPARE add_color_statement FROM @add_color_sql;
EXECUTE add_color_statement;
DEALLOCATE PREPARE add_color_statement;

CREATE TABLE IF NOT EXISTS repair_annotations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    body TEXT NOT NULL,
    source VARCHAR(40) NOT NULL DEFAULT 'manual',
    repair_order_id INT UNSIGNED NULL,
    repair_order_registro_id BIGINT UNSIGNED NULL,
    customer_name VARCHAR(160) NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX repair_annotations_occurred_at_index (occurred_at),
    INDEX repair_annotations_repair_order_id_index (repair_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
