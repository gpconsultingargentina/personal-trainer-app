-- Migración para cambiar scheduled_at de TIMESTAMPTZ a TIMESTAMP (sin zona horaria)
-- Esto permite guardar "naive timestamps" que no se convierten a UTC
--
-- IMPORTANTE: Esta migración convierte todos los timestamps existentes
-- manteniendo la hora tal como está, pero removiendo la zona horaria.

BEGIN;

-- 1. Agregar columna temporal sin zona horaria
ALTER TABLE classes 
ADD COLUMN scheduled_at_new TIMESTAMP WITHOUT TIME ZONE;

-- 2. Copiar datos: convertir a hora local de Argentina (UTC-3)
-- y remover la zona horaria
UPDATE classes 
SET scheduled_at_new = (scheduled_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::TIMESTAMP;

-- 3. Eliminar columna vieja
ALTER TABLE classes 
DROP COLUMN scheduled_at;

-- 4. Renombrar columna nueva
ALTER TABLE classes 
RENAME COLUMN scheduled_at_new TO scheduled_at;

-- 5. Agregar restricción NOT NULL
ALTER TABLE classes 
ALTER COLUMN scheduled_at SET NOT NULL;

-- 6. Recrear índices si existían
-- (ajustar según tus índices existentes)
CREATE INDEX IF NOT EXISTS idx_classes_scheduled_at 
ON classes(scheduled_at);

COMMIT;

-- Verificación: después de ejecutar esta migración,
-- las fechas deberían verse sin zona horaria:
-- Ejemplo: '2026-02-09 18:00:00' en vez de '2026-02-09 21:00:00+00'
