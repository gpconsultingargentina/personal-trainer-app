---
id: "sistema-creditos"
titulo: "Sistema de Creditos Flexibles"
descripcion: "Guia completa del sistema de creditos: como funciona, como usarlo, y referencia tecnica"
---

# Sistema de Creditos Flexibles

## Concepto General

Los alumnos compran **creditos** (clases) que se van descontando a medida que asisten. El precio por clase depende de la **frecuencia habitual** del alumno.

### Frecuencias y Precios

| Frecuencia | Precio/clase | Clases tipicas/mes |
|------------|--------------|-------------------|
| 1x/semana | $30.250 | 4-5 |
| 2x/semana | $27.500 | 8-9 |
| 3x/semana | $25.850 | 12-13 |

### Reglas Clave

1. **El precio se basa en la frecuencia habitual**, no en la cantidad exacta que compra
2. **Los creditos se acumulan** entre pagos
3. **Vencen a los 60 dias** de la compra
4. **FIFO**: Al descontar, se usan primero los mas proximos a vencer

---

## Flujo de Uso

### 1. Asignar Frecuencia al Alumno

**Donde:** Dashboard > Alumnos > Nuevo Alumno (o editar existente)

El formulario incluye un selector de frecuencia:
- Sin frecuencia (usa sistema legacy de planes)
- 1 clase por semana - $30.250/clase
- 2 clases por semana - $27.500/clase
- 3 clases por semana - $25.850/clase

### 2. Registrar Pago de Creditos

**Donde:** Dashboard > Alumno > "Comprar Creditos"

El flujo:
1. Ver precio por clase del alumno (segun su frecuencia)
2. Seleccionar cantidad de clases (botones rapidos: 4, 8, 12 o input libre)
3. Opcionalmente aplicar cupon de descuento
4. Subir comprobante de transferencia
5. Entrenador aprueba el pago

**Al aprobar:**
- Se crea automaticamente un `credit_balance` con vencimiento a 60 dias
- Se registra la transaccion de compra en el historial

### 3. Marcar Asistencia

**Donde:** Dashboard > Alumno > Clases Reservadas

Al marcar una clase como completada:
1. Se descuenta 1 credito del saldo del alumno
2. Se usa FIFO (primero el credito mas proximo a vencer)
3. Se registra la transaccion en el historial

### 4. Ver Saldo y Historial

**Donde:** Dashboard > Alumno

La seccion "Saldo de Creditos" muestra:
- Creditos disponibles (numero grande)
- Usados / Comprados (estadistica)
- Alerta si hay creditos por vencer en 7 dias
- Fecha de proximo vencimiento
- Boton para ver historial de movimientos

### 5. Ajustar Creditos Manualmente

**Donde:** Dashboard > Alumno > Saldo de Creditos > "Ajustar"

Para compensaciones o penalizaciones:
1. Click en "Ajustar"
2. Ingresar cantidad (positivo = agregar, negativo = quitar)
3. Escribir motivo del ajuste
4. Confirmar

El ajuste queda registrado en el historial con el motivo.

---

## Referencia de Pantallas

### Pagina del Alumno (`/dashboard/students/[id]`)

```
+----------------------------------+
| Historial de [Nombre]            |
| [Agregar Clase] [Comprar Creditos]|
+----------------------------------+
| Informacion del Alumno           |
| Email: ...                       |
| Telefono: ...                    |
| Frecuencia: 3x/semana - $25.850  |
+----------------------------------+
| Saldo de Creditos        [Ajustar]|
| +-----------+ +---------------+  |
| |    12     | | 8/20          |  |
| | Creditos  | | Usados/Compra |  |
| +-----------+ +---------------+  |
| ! 4 creditos vencen antes de...  |
| Proximo vencimiento: 15/03/2025  |
| [Ver historial de movimientos]   |
+----------------------------------+
| Clases Reservadas                |
| ...                              |
+----------------------------------+
| Historial de Pagos               |
| 12 clases (3x) - $310.200        |
| ...                              |
+----------------------------------+
```

### Formulario de Compra (`/public/payment/credits`)

```
+----------------------------------+
| Comprar Creditos                 |
+----------------------------------+
| Comprobante para [Nombre]        |
| Frecuencia: 3x/semana            |
| Creditos actuales: 2             |
+----------------------------------+
| Precio por clase: $25.850        |
+----------------------------------+
| Cantidad de Clases a Comprar *   |
| [    12    ]                     |
| [4 clases] [8 clases] [12 clases]|
+----------------------------------+
| Cupon de descuento (opcional)    |
| [          ] [Validar]           |
+----------------------------------+
| Precio original: $310.200        |
| Precio final: $310.200           |
+----------------------------------+
| Comprobante de Pago *            |
| [Arrastra archivo aqui...]       |
+----------------------------------+
| [Cancelar] [Subir ($310.200)]    |
+----------------------------------+
```

---

## Referencia Tecnica

### Tablas de Base de Datos

#### `frequency_prices`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | PK |
| frequency_code | VARCHAR(20) | '1x', '2x', '3x' |
| classes_per_week | INTEGER | 1, 2, 3 |
| price_per_class | DECIMAL | Precio por clase |
| description | VARCHAR | Descripcion legible |
| is_active | BOOLEAN | Si esta disponible |

#### `credit_balances`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | PK |
| student_id | UUID | FK a students |
| payment_proof_id | UUID | FK a payment_proofs |
| classes_purchased | INTEGER | Cantidad comprada |
| classes_remaining | INTEGER | Saldo actual |
| price_per_class | DECIMAL | Snapshot del precio |
| frequency_code | VARCHAR | Snapshot de frecuencia |
| purchased_at | TIMESTAMP | Fecha de compra |
| expires_at | TIMESTAMP | Fecha de vencimiento |
| status | VARCHAR | 'active', 'depleted', 'expired' |

#### `credit_transactions`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | PK |
| credit_balance_id | UUID | FK a credit_balances |
| student_id | UUID | FK a students |
| booking_id | UUID | FK a bookings (si aplica) |
| transaction_type | VARCHAR | 'purchase', 'attendance', 'adjustment', 'expiration' |
| amount | INTEGER | +N compra, -1 asistencia |
| balance_after | INTEGER | Saldo despues de tx |
| notes | TEXT | Motivo (para ajustes) |
| created_at | TIMESTAMP | Fecha de la transaccion |

### Server Actions

#### Frecuencias (`app/actions/frequencies.ts`)

```typescript
// Obtener todas las frecuencias
const frequencies = await getFrequencies()

// Obtener solo activas (para formularios)
const active = await getActiveFrequencies()

// Obtener una por ID
const freq = await getFrequency(id)

// Obtener por codigo
const freq = await getFrequencyByCode('3x')

// Actualizar precio
await updateFrequencyPrice(id, newPrice)

// Activar/desactivar
await toggleFrequencyActive(id, true)
```

#### Creditos (`app/actions/credits.ts`)

```typescript
// Obtener creditos del alumno
const { total, details } = await getStudentCredits(studentId)
// total: numero de creditos disponibles
// details: array de credit_balances activos

// Obtener resumen para UI
const summary = await getStudentCreditSummary(studentId)
// {
//   available: 12,
//   expiringSoon: 4,  // vencen en 7 dias
//   nextExpirationDate: '2025-03-15T...',
//   totalPurchased: 20,
//   totalUsed: 8
// }

// Crear balance (se hace automaticamente al aprobar pago)
const balance = await createCreditBalance({
  studentId,
  paymentProofId,
  classesPurchased: 12,
  pricePerClass: 25850,
  frequencyCode: '3x'
})

// Descontar credito (se hace en markAttendance)
const result = await deductCredit(studentId, bookingId)
// { success: true, remainingCredits: 11 }

// Ajustar manualmente
await adjustCredits(studentId, 2, 'Compensacion clase cancelada')
await adjustCredits(studentId, -1, 'Penalizacion por no-show')

// Obtener historial
const transactions = await getCreditTransactions(studentId, 20)

// Expirar creditos (llamado por cron)
const { expiredCount } = await expireCredits()
```

#### Asistencia (`app/actions/bookings.ts`)

```typescript
// Marcar asistencia (cambia status + descuenta credito)
const result = await markAttendance(bookingId)
// { success: true, remainingCredits: 11 }
// o
// { success: false, error: 'El alumno no tiene creditos disponibles' }
```

### API Routes

#### Subir Pago con Creditos

`POST /api/payments/upload-and-create`

FormData:
```
file: File
student_id: string
original_price: string
final_price: string
discount_applied: string
coupon_id?: string
// Campos de creditos
classes_purchased: string
price_per_class: string
frequency_code: string
```

#### Cron de Expiracion

`GET /api/cron/expire-credits?secret=CRON_SECRET`

Response:
```json
{
  "success": true,
  "expiredCount": 5,
  "timestamp": "2025-01-27T..."
}
```

---

## Migracion de Datos Existentes

Si hay alumnos/pagos del sistema legacy:

1. **Asignar frecuencias a alumnos existentes**
   - Por defecto: 3x/semana (la mas comun)
   - Ajustar manualmente segun corresponda

2. **Pagos existentes siguen funcionando**
   - El sistema es backwards compatible
   - Los pagos con `plan_id` siguen mostrando el nombre del plan
   - Solo los nuevos pagos con `classes_purchased` usan creditos

3. **Crear balances para pagos aprobados antiguos** (opcional)
   - Ejecutar script de migracion si se quiere unificar

---

## Troubleshooting

### "El alumno no tiene creditos disponibles"

Posibles causas:
1. No tiene pagos aprobados con sistema de creditos
2. Todos sus creditos expiraron
3. Todos sus creditos fueron consumidos

Solucion: Verificar historial de transacciones en la pagina del alumno

### El pago se aprobo pero no aparecen creditos

Verificar que el pago tenga los campos:
- `classes_purchased`
- `price_per_class`
- `frequency_code`

Si el pago es del sistema legacy (solo `plan_id`), no crea creditos.

### Los creditos no expiran

Verificar que el cron job este configurado:
- Endpoint: `/api/cron/expire-credits`
- Frecuencia: diaria
- Parametro: `?secret=CRON_SECRET`

### El alumno no tiene selector de frecuencia

Verificar que la tabla `frequency_prices` tenga datos y `is_active = true`.
