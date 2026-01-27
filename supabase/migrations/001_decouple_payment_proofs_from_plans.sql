-- Migración: Desacoplar payment_proofs de class_plans
-- Fecha: 2025-01-27
-- Plan: docs/planes/001-fix-payment-proofs-plan-dependency.md

-- 1. Agregar columna plan_name para snapshot del nombre del plan
ALTER TABLE payment_proofs
ADD COLUMN plan_name VARCHAR(255);

-- 2. Poblar plan_name con datos existentes (si hay registros)
UPDATE payment_proofs pp
SET plan_name = cp.name
FROM class_plans cp
WHERE pp.plan_id = cp.id;

-- 3. Hacer plan_id nullable
ALTER TABLE payment_proofs
ALTER COLUMN plan_id DROP NOT NULL;

-- 4. Eliminar FK existente
ALTER TABLE payment_proofs
DROP CONSTRAINT IF EXISTS payment_proofs_plan_id_fkey;

-- 5. Recrear FK con ON DELETE SET NULL
ALTER TABLE payment_proofs
ADD CONSTRAINT payment_proofs_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES class_plans(id)
ON DELETE SET NULL;

-- Verificación (opcional, ejecutar manualmente):
-- SELECT column_name, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'payment_proofs' AND column_name IN ('plan_id', 'plan_name');
