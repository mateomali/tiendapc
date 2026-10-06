-- Ejecutar una sola vez en Hostinger antes de subir el código actualizado.
ALTER TABLE ordenes ADD COLUMN tracking_disabled TINYINT(1) NOT NULL DEFAULT 0;
