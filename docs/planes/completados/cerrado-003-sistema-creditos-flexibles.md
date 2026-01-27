---
id: "003"
titulo: "Migracion a Sistema de Creditos Flexibles"
estado: "completado"
prioridad: "alta"
creado: "2025-01-27"
cerrado: "2025-01-27"
estimacion: "1 sesion"
dependencias: ["001"]
---

# Migracion a Sistema de Creditos Flexibles

**Fecha:** 2025-01-27
**Tipo:** Feature / Migracion de base de datos

---

## Objetivo

Migrar de un modelo de "planes fijos" (ej: "Plan 12 clases = $310.200") a un sistema de "creditos flexibles" donde:
- El precio por clase depende de la **frecuencia habitual** del alumno (1x, 2x, 3x/semana)
- El alumno puede comprar **cualquier cantidad** de clases (5, 6, 9, 13...)
- Las clases se **acumulan** y **vencen a los 60 dias**
- Al asistir, se **descuenta 1 credito** del saldo (FIFO - primero los mas proximos a vencer)

---

## Problema Resuelto

El modelo anterior de planes fijos no se ajustaba al negocio real:
- Los alumnos necesitan flexibilidad en la cantidad de clases
- El precio debe depender de la frecuencia habitual, no del paquete comprado
- Las clases deben poder acumularse entre meses
- Necesitaba sistema de vencimiento a 60 dias

---

## Implementacion

### Fase 1: Migraciones de Base de Datos

**Nuevas tablas creadas:**

| Tabla | Proposito |
|-------|-----------|
| `frequency_prices` | Precios por frecuencia (1x=$30.250, 2x=$27.500, 3x=$25.850) |
| `credit_balances` | Saldos de creditos por alumno con vencimiento |
| `credit_transactions` | Historial de movimientos (compra, asistencia, ajuste, expiracion) |

**Tablas modificadas:**

| Tabla | Cambios |
|-------|---------|
| `students` | Agregados: `frequency_id`, `usual_schedule` |
| `payment_proofs` | Agregados: `classes_purchased`, `price_per_class`, `frequency_code` |

### Fase 2: Server Actions Nuevos

| Archivo | Funciones |
|---------|-----------|
| `app/actions/frequencies.ts` | `getFrequencies`, `getActiveFrequencies`, `getFrequency`, `getFrequencyByCode`, `updateFrequencyPrice`, `toggleFrequencyActive` |
| `app/actions/credits.ts` | `getStudentCredits`, `getStudentCreditSummary`, `createCreditBalance`, `deductCredit`, `adjustCredits`, `getCreditTransactions`, `expireCredits` |

### Fase 3: Server Actions Modificados

| Archivo | Cambios |
|---------|---------|
| `app/actions/payments.ts` | Soporta campos de creditos; al aprobar pago crea `credit_balance` automaticamente |
| `app/actions/bookings.ts` | Nueva funcion `markAttendance()` que descuenta creditos (FIFO) |
| `app/actions/students.ts` | Nuevos tipos `StudentWithFrequency`, funciones para manejar frecuencia |

### Fase 4: Componentes UI

| Componente | Proposito |
|------------|-----------|
| `StudentCreditSummary.tsx` | Muestra saldo, vencimiento, historial, boton de ajuste |
| `StudentCreditSummaryWrapper.tsx` | Wrapper client para manejar ajustes |
| `CreditPaymentForm.tsx` | Nuevo flujo de compra de creditos (cantidad x precio) |
| `StudentForm.tsx` | Modificado para incluir selector de frecuencia |

**Paginas modificadas:**
- `/dashboard/students/[id]` - Muestra creditos y frecuencia
- `/dashboard/students/new` - Pasa frecuencias al formulario
- Nueva: `/public/payment/credits` - Pagina de compra de creditos

### Fase 5: Cron Job

| Endpoint | Proposito |
|----------|-----------|
| `/api/cron/expire-credits` | Expira creditos automaticamente (60 dias) |

### API Route Actualizado

`/api/payments/upload-and-create` - Soporta modo legacy (planes) y modo creditos

---

## Archivos Creados/Modificados

### Nuevos archivos

```
app/actions/frequencies.ts
app/actions/credits.ts
app/components/student-credit-summary/StudentCreditSummary.tsx
app/components/student-credit-summary/StudentCreditSummaryWrapper.tsx
app/components/credit-payment-form/CreditPaymentForm.tsx
app/public/payment/credits/page.tsx
app/api/cron/expire-credits/route.ts
```

### Archivos modificados

```
supabase/schema.sql
app/actions/payments.ts
app/actions/bookings.ts
app/actions/students.ts
app/components/student-form/StudentForm.tsx
app/(dashboard)/dashboard/students/[id]/page.tsx
app/(dashboard)/dashboard/students/new/page.tsx
app/api/payments/upload-and-create/route.ts
```

---

## Flujo del Sistema

```
1. Alumno tiene frecuencia asignada (1x, 2x, 3x/semana)
   └─> Determina su precio por clase

2. Alumno compra N clases
   └─> Entrenador sube comprobante con cantidad
   └─> Al aprobar, se crea credit_balance (vence en 60 dias)

3. Alumno asiste a clase
   └─> Entrenador marca asistencia
   └─> Se descuenta 1 credito (FIFO - del mas proximo a vencer)

4. Creditos vencen a los 60 dias
   └─> Cron job los marca como expirados
   └─> Se crea transaccion de expiracion para historial
```

---

## Criterios de Done

- [x] Nuevas tablas creadas en schema.sql (frequency_prices, credit_balances, credit_transactions)
- [x] Campos agregados a students (frequency_id, usual_schedule)
- [x] Campos agregados a payment_proofs (classes_purchased, price_per_class, frequency_code)
- [x] Server actions para frecuencias y creditos funcionando
- [x] Al aprobar pago con datos de creditos, se crea credit_balance automaticamente
- [x] Funcion markAttendance descuenta creditos
- [x] UI muestra saldo de creditos en pagina del alumno
- [x] Formulario de alumno permite asignar frecuencia
- [x] Nueva pagina de compra de creditos funcional
- [x] Cron de expiracion implementado
- [x] Build pasa sin errores

---

## Notas de Implementacion

### Decisiones de Diseno

1. **FIFO para descuento**: Al descontar creditos, se usan primero los mas proximos a vencer
2. **Snapshots en payment_proofs**: Se guarda `price_per_class` y `frequency_code` para mantener historial aunque cambien los precios
3. **Backwards compatible**: El sistema legacy de planes sigue funcionando; el nuevo sistema de creditos es opcional
4. **credit_balances multiples**: Cada pago crea un balance separado, permitiendo trackear origen y vencimiento independiente

### Migracion de Datos Existentes

Las tablas nuevas deben ejecutarse en Supabase manualmente. El schema.sql tiene todo el SQL necesario.

Para alumnos existentes:
1. Asignar frecuencia (por defecto 3x)
2. Los pagos antiguos siguen funcionando con el sistema de planes

### Cron Job

El endpoint `/api/cron/expire-credits?secret=CRON_SECRET` debe configurarse para ejecutar diariamente.

---

## Testing Recomendado

1. **Crear alumno nuevo** con frecuencia 3x → verificar precio $25.850
2. **Registrar pago** de 12 clases → verificar credit_balance creado con vencimiento 60 dias
3. **Marcar asistencia** → verificar descuento de 1 credito
4. **Comprar mas clases** con saldo existente → verificar acumulacion
5. **Simular vencimiento** (modificar fecha en BD) → verificar que cron marca como expired
6. **Ajuste manual** → verificar transaccion con notas
