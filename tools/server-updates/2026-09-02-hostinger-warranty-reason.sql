-- Actualizacion segura para Hostinger / MySQL.
-- Arregla el error 500 al reingresar una orden entregada por garantia.
-- Ejecutar una sola vez en phpMyAdmin sobre la base de datos de la web.
-- Es idempotente: si las tablas, columnas o indices ya existen, no los vuelve a crear.

SET @schema_name = DATABASE();

ALTER TABLE ordenes MODIFY COLUMN estado VARCHAR(80) NOT NULL DEFAULT 'PENDIENTE';

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'archivado_at'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE ordenes ADD COLUMN archivado_at TIMESTAMP NULL AFTER fecha_entregado',
    'SELECT "ordenes.archivado_at already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS repair_task_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    repair_order_registro_id BIGINT UNSIGNED NOT NULL,
    task_date DATE NOT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY repair_task_items_order_date_unique (repair_order_registro_id, task_date),
    KEY repair_task_items_task_date_completed_at_index (task_date, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @table_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'orden_eventos'
);
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'orden_eventos'
      AND COLUMN_NAME = 'detalle'
);
SET @sql = IF(
    @table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE orden_eventos ADD COLUMN detalle TEXT NULL AFTER evento',
    'SELECT "orden_eventos.detalle already exists or orden_eventos table is missing"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'archivado_motivo'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE ordenes ADD COLUMN archivado_motivo VARCHAR(40) NULL AFTER archivado_at',
    'SELECT "ordenes.archivado_motivo already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'ordenes'
      AND INDEX_NAME = 'ordenes_archivado_at_index'
);
SET @sql = IF(
    @index_exists = 0,
    'ALTER TABLE ordenes ADD INDEX ordenes_archivado_at_index (archivado_at)',
    'SELECT "ordenes_archivado_at_index already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'cancelado_motivo'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE ordenes ADD COLUMN cancelado_motivo TEXT NULL AFTER archivado_motivo',
    'SELECT "ordenes.cancelado_motivo already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'garantia_motivo'
);
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE ordenes ADD COLUMN garantia_motivo TEXT NULL AFTER cancelado_motivo',
    'SELECT "ordenes.garantia_motivo already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
