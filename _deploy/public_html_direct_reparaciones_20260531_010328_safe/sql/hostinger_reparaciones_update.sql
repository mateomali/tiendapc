-- Hostinger deploy SQL compatible: repair payments, public tracking token, order info.
-- Run once in phpMyAdmin after making a backup.

SET @db_name := DATABASE();

-- ordenes.tracking_token
SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `ordenes` ADD COLUMN `tracking_token` VARCHAR(5) NULL AFTER `dni`',
        'SELECT ''ordenes.tracking_token ya existe'' AS status'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'tracking_token'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ordenes.info
SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `ordenes` ADD COLUMN `info` TEXT NULL AFTER `observaciones`',
        'SELECT ''ordenes.info ya existe'' AS status'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'ordenes'
      AND COLUMN_NAME = 'info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- index ordenes_tracking_token_index
SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX `ordenes_tracking_token_index` ON `ordenes` (`tracking_token`)',
        'SELECT ''ordenes_tracking_token_index ya existe'' AS status'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'ordenes'
      AND INDEX_NAME = 'ordenes_tracking_token_index'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `repair_payments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `orden_id` INT UNSIGNED NOT NULL,
    `reparacion` INT UNSIGNED NOT NULL DEFAULT 1,
    `amount` DECIMAL(10,2) NOT NULL,
    `payment_type` VARCHAR(40) NOT NULL DEFAULT 'senia',
    `method` VARCHAR(40) NULL,
    `notes` TEXT NULL,
    `paid_at` DATE NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    INDEX `repair_payments_orden_reparacion_paid_at_index` (`orden_id`, `reparacion`, `paid_at`)
);

INSERT INTO `repair_payments` (
    `orden_id`,
    `reparacion`,
    `amount`,
    `payment_type`,
    `method`,
    `notes`,
    `paid_at`,
    `created_at`,
    `updated_at`
)
SELECT
    o.`id`,
    o.`reparacion`,
    o.`senia`,
    'senia',
    NULL,
    'Migrado desde campo sena',
    COALESCE(o.`fecha`, CURDATE()),
    COALESCE(o.`created_at`, NOW()),
    COALESCE(o.`updated_at`, NOW())
FROM `ordenes` o
WHERE o.`senia` > 0
AND NOT EXISTS (
    SELECT 1
    FROM `repair_payments` rp
    WHERE rp.`orden_id` = o.`id`
      AND rp.`reparacion` = o.`reparacion`
      AND rp.`notes` = 'Migrado desde campo sena'
);

CREATE TEMPORARY TABLE `tmp_repair_tracking_tokens` AS
SELECT
    `id`,
    LPAD(FLOOR(RAND() * 100000), 5, '0') AS token
FROM `ordenes`
WHERE `dni` = 12345678
  AND (`tracking_token` IS NULL OR `tracking_token` = '')
GROUP BY `id`;

UPDATE `ordenes` o
JOIN `tmp_repair_tracking_tokens` t ON t.`id` = o.`id`
SET o.`tracking_token` = t.`token`
WHERE o.`dni` = 12345678
  AND (o.`tracking_token` IS NULL OR o.`tracking_token` = '');

DROP TEMPORARY TABLE `tmp_repair_tracking_tokens`;

-- Verification: this must return one row for info.
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @db_name
  AND TABLE_NAME = 'ordenes'
  AND COLUMN_NAME IN ('tracking_token', 'info');
