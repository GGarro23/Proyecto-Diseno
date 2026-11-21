-- Ajustes acordados en la Etapa 2 para que la BD coincida con el frontend.
-- Usuario: teléfono y provincia (opcionales) y fecha de registro (Figuras 20 y 21, RF-01, RF-05).
BEGIN;

ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS provincia VARCHAR(40) NULL,
    ADD COLUMN IF NOT EXISTS fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE;

COMMIT;