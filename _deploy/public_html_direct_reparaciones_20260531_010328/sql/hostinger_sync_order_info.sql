-- Sincroniza info interna a nivel orden.
-- Usar si la columna ordenes.info ya existe.
-- Toma cualquier info no vacia guardada en un trabajo y la copia al resto
-- de trabajos con el mismo id de orden.

UPDATE `ordenes` o
JOIN (
    SELECT
        `id`,
        SUBSTRING_INDEX(
            GROUP_CONCAT(
                TRIM(`info`)
                ORDER BY `reparacion` ASC
                SEPARATOR '|||'
            ),
            '|||',
            1
        ) AS `info_orden`
    FROM `ordenes`
    WHERE `info` IS NOT NULL
      AND TRIM(`info`) <> ''
    GROUP BY `id`
) src ON src.`id` = o.`id`
SET o.`info` = src.`info_orden`
WHERE src.`info_orden` IS NOT NULL
  AND src.`info_orden` <> '';

-- Verificacion: para cada id, deberia quedar 1 solo valor distinto de info.
SELECT
    `id`,
    COUNT(*) AS trabajos,
    COUNT(DISTINCT COALESCE(`info`, '')) AS variantes_info,
    MAX(`info`) AS info
FROM `ordenes`
GROUP BY `id`
HAVING MAX(COALESCE(`info`, '')) <> ''
ORDER BY `id` DESC
LIMIT 20;
