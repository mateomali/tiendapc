-- Arreglo puntual para el error:
-- SQLSTATE[01000]: Warning: 1265 Data truncated for column 'estado'
-- Permite guardar estados largos como GARANTIA y EN REPARACION / ESPERA REPUESTO.

ALTER TABLE ordenes MODIFY COLUMN estado VARCHAR(80) NOT NULL DEFAULT 'PENDIENTE';
