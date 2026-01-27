---
title: "Desacoplar payment_proofs de class_plans"
type: plan
status: completed
summary: "Eliminar FK rígida entre payment_proofs y class_plans para que los comprobantes sean autocontenidos y los planes puedan eliminarse sin romper histórico."
created: 2025-01-27
closed: 2025-01-27
---

# Desacoplar payment_proofs de class_plans

**Fecha:** 2025-01
**Tipo:** Migración de base de datos

---

## Objetivo

Eliminar la dependencia rígida entre `payment_proofs` y `class_plans` para que los comprobantes de pago sean autocontenidos y los planes puedan eliminarse sin romper el histórico.

---

## Problema

```
payment_proofs
├── student_id  → students (ON DELETE CASCADE) ✓
├── plan_id     → class_plans (SIN CASCADE) ← PROBLEMA
├── coupon_id   → coupons
├── original_price, final_price, discount_applied
└── file_url, status
```

El `plan_id` como foreign key obligatoria sin cascade crea dependencia innecesaria:
- Si eliminas un plan, rompe los comprobantes históricos
- El comprobante ya guarda `original_price` y `final_price` - no necesita el plan después de crearse

---

## Solución

| Campo | Cambio | Razón |
|-------|--------|-------|
| `plan_id` | NULL + ON DELETE SET NULL | Histórico se mantiene, plan puede eliminarse |
| `plan_name` | AGREGAR (VARCHAR) | Snapshot del nombre del plan al momento del pago |

El comprobante queda autocontenido:
- Tiene el alumno ✓
- Tiene los precios ✓
- Tiene el nombre del plan (snapshot) ✓
- Si el plan se elimina, solo pierde la referencia pero conserva toda la info

---

## Pasos de Implementación

### Paso 1: Migración SQL

```sql
-- 1. Agregar columna plan_name para snapshot
ALTER TABLE payment_proofs
ADD COLUMN plan_name VARCHAR(255);

-- 2. Poblar plan_name con datos existentes (si hay)
UPDATE payment_proofs pp
SET plan_name = cp.name
FROM class_plans cp
WHERE pp.plan_id = cp.id;

-- 3. Hacer plan_id nullable
ALTER TABLE payment_proofs
ALTER COLUMN plan_id DROP NOT NULL;

-- 4. Recrear FK con ON DELETE SET NULL
ALTER TABLE payment_proofs
DROP CONSTRAINT payment_proofs_plan_id_fkey;

ALTER TABLE payment_proofs
ADD CONSTRAINT payment_proofs_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES class_plans(id)
ON DELETE SET NULL;
```

### Paso 2: Actualizar tipos TypeScript

Agregar `plan_name: string | null` a los tipos.

### Paso 3: Modificar server action

Actualizar la acción de crear payment_proof para guardar `plan_name` al momento de creación.

### Paso 4: Actualizar UI

Mostrar `plan_name` cuando `plan_id` es null en la UI de payment_proofs.

---

## Archivos Involucrados

| Archivo | Cambio |
|---------|--------|
| `supabase/schema.sql` | Esquema de referencia (no se modifica directamente) |
| `app/actions/payment-proofs.ts` | Guardar plan_name al crear |
| `app/(dashboard)/dashboard/payments/` | Mostrar plan_name |
| `types/` | Agregar plan_name al tipo |

---

## Criterios de Done

- [x] La migración se aplica sin errores
- [x] Los payment_proofs existentes tienen `plan_name` poblado
- [x] Se puede eliminar un `class_plan` sin error de FK
- [x] Al eliminar un plan, los comprobantes asociados mantienen `plan_name` y muestran null en `plan_id`
- [x] Al crear un nuevo payment_proof, se guarda el `plan_name` automáticamente

---

## Notas

- Migración de bajo riesgo: solo agrega flexibilidad, no rompe funcionalidad existente
- Los comprobantes actuales (0 filas) no se ven afectados
- Considerar hacer lo mismo con `coupon_id` en el futuro si se quiere poder eliminar cupones
