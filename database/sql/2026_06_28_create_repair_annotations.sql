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
