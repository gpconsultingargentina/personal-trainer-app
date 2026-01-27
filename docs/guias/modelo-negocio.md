---
id: "modelo-negocio"
titulo: "Modelo de Negocio - Conceptual"
descripcion: "Explicación del modelo de negocio, reglas y flujos de la app"
---

# Otakufiit-Calendar

## Modelo de Negocio

## Contexto

### Quién usa la app

- **Usuario único**: El entrenador personal (dueño del negocio)
- **Sin empleados**: No hay personal administrativo
- **Gimnasio propio**: Las clases se dan en un gimnasio particular del entrenador
- **Ubicación**: Ciudad de Buenos Aires, Argentina
- **Zona horaria**: America/Argentina/Buenos_Aires
- **Moneda**: Pesos argentinos (ARS)

### Tipo de clases

- **Presenciales**: En el gimnasio del entrenador
- **Individuales**: Un alumno por clase (no grupales)

### Situación actual (sin la app)

- Pagos: Comprobantes de transferencia por WhatsApp
- Registro: Planilla Excel manual
- Problema: Proceso manual, propenso a errores, difícil de trackear

---

## Sistema de Créditos de Clases

### Concepto central

Los alumnos **compran paquetes de clases** (créditos), no planes mensuales fijos. Las clases se van descontando a medida que asisten.

### Frecuencias y precios

| Frecuencia habitual | Precio por clase | Clases típicas/mes |
|---------------------|------------------|-------------------|
| 1x/semana | $30.250 | 4-5 |
| 2x/semana | $27.500 | 8-9 |
| 3x/semana | $25.850 | 12-13 |

### Reglas clave

1. **El precio se basa en la frecuencia habitual del alumno**, no en la cantidad exacta de clases que compra ese mes
   - La frecuencia es un **atributo fijo** que se asigna al alumno cuando empieza
   - Ejemplo: Si un alumno es de 3x/semana pero un mes solo puede 6 clases, paga a $25.850/clase
   - Ejemplo: Alumno nuevo, clase de prueba, decide hacer 3x/semana → se le asigna esa frecuencia y paga $25.850/clase aunque el primer mes sean 11 clases

2. **Las clases se acumulan**
   - Si le quedan 2 clases del mes anterior y paga 12 nuevas → tiene 14 disponibles
   - Si pagó 12 pero solo asistió a 10 → le quedan 2 para el próximo mes

3. **Vencimiento de 60 días**
   - Las clases no usadas expiran a los 60 días
   - **Excepción**: Casos especiales pactados de antemano donde se conservan las clases

4. **Flexibilidad en cantidad**
   - No hay paquetes rígidos de 4/8/12
   - Un alumno puede pagar 5, 6, 9, 10, 13 clases según su situación del mes

---

## Flujo de Pago

```
1. Alumno decide cuántas clases va a hacer este mes
2. Entrenador calcula: cantidad × precio según frecuencia habitual
3. Alumno transfiere el monto
4. Alumno envía comprobante
5. Entrenador aprueba el pago
6. Se acreditan las clases al saldo del alumno
```

---

## Flujo de Clases

```
1. Alumno tiene saldo de clases disponibles
2. Alumno asiste a una clase
3. Entrenador registra la asistencia
4. Se descuenta 1 clase del saldo
5. Repetir hasta agotar saldo o vencer los 60 días
```

---

## Casos especiales

### Alumno nuevo (clase de prueba)

1. Viene a una clase de prueba → **$30.250** (precio de clase individual)
2. Decide quedarse y elige frecuencia (1x, 2x, 3x por semana)
3. Se le asigna esa frecuencia → determina su precio por clase
4. Paga las clases restantes del mes a ese precio
5. Meses siguientes: mantiene la misma frecuencia y precio

### Alumno falta por enfermedad/viaje

- Se le mantiene el precio por clase de su frecuencia habitual
- Solo paga las clases que efectivamente puede tomar
- Ejemplo: Normalmente hace 12 clases a $25.850, pero este mes solo puede 10 → paga 10 × $25.850

### Meses con 5 semanas

- El alumno puede pagar 5 clases (1x/semana) o 13 clases (3x/semana)
- El precio por clase se mantiene según su frecuencia habitual

### Clases sobrantes

- Se acumulan para el mes siguiente
- El próximo mes paga menos clases (las que necesita menos las que le quedaron)

---

## Agenda y Horarios

### Horario de atención

| Día | Horario |
|-----|---------|
| Lunes a Viernes | 12:00 a 21:00 |
| Sábados | 13:00 a 18:00 |
| Domingos | Cerrado |

### Duración de clases

- **1 hora** fija por clase

### Modelo de horarios

- **Horarios fijos con flexibilidad**: Cada alumno tiene un horario habitual asignado, pero puede haber cambios puntuales
- **Reserva centralizada**: Solo el entrenador puede agendar/modificar clases, los alumnos no reservan por su cuenta

### Integración con calendarios

- Las clases deben guardarse automáticamente en el calendario del alumno (Google Calendar / Apple Calendar)
- Esto facilita que el alumno tenga visibilidad de sus próximas clases

---

## Política de Cancelaciones

### Regla general

- **Con +24hs de anticipación**: Puede reprogramar sin problema
- **Con -24hs de anticipación**: Depende de la tolerancia del alumno

### Tolerancia mensual (cancelaciones tardías permitidas)

| Frecuencia | Tolerancia/mes |
|------------|----------------|
| 3x/semana (12 clases) | 2 cancelaciones tardías |
| 2x/semana (8 clases) | 1 cancelación tardía |
| 1x/semana (4 clases) | 1 cancelación tardía |

### Consecuencia

- Si el alumno **excede su tolerancia** y cancela con menos de 24hs → **pierde la clase** (se descuenta del saldo igual)
- Si está **dentro de la tolerancia** → puede reprogramar sin perder la clase

### Ajuste manual de saldo (penalización)

El entrenador puede **restar clases del saldo** de un alumno por incumplimiento frecuente u otros motivos.

- Ejemplo: Alumno tiene 3 clases de saldo, entrenador le quita 2 → queda con 1
- Se debe registrar el motivo del ajuste (para historial)
- El alumno debería poder ver el ajuste en su historial

---

## Recordatorios

- **Recordatorios automáticos** para entrenador y alumnos
- **Timing**: 24 horas y 2 horas antes de la clase

### Fases de implementación

| Fase | Canal | Estado |
|------|-------|--------|
| 1 | Integración calendario (.ics) | Pendiente |
| 2 | Email (Resend) | Futuro |
| 3 | WhatsApp / SMS | Futuro |

### Alternativas para WhatsApp/SMS

| Servicio | Plan | Precio | Notas |
|----------|------|--------|-------|
| **Bird** (ex MessageBird) | Gratis | $0 | 50 contactos/mes, conversaciones ilimitadas |
| **WasenderAPI** | Pago | $6/mes | WhatsApp ilimitado, muy económico |
| **Telnyx** | Pago por uso | $0.0025/SMS | Sin mínimo mensual |
| **Twilio** | Pago por uso | Variable | Más caro pero mejor documentación |

**Recomendación**: Empezar con Bird (gratis) y migrar a WasenderAPI si se necesita escalar.

---

## Usuarios y Roles

### Entrenador (Admin)

Acceso completo:
- Gestionar alumnos (CRUD)
- Registrar pagos y aprobar comprobantes
- Agendar y modificar clases
- Registrar asistencia
- **Ajustar saldo de clases** (agregar o quitar manualmente, con motivo)
- Ver reportes
- Configurar precios y frecuencias

### Alumno (Portal/App)

**Registro**: El alumno se registra solo (el entrenador le indica qué app bajar)
**Autenticación**: Usuario y contraseña

Acceso limitado:
- **Puede**: Ver su saldo de clases, ver sus próximas clases, subir comprobantes de pago, ver historial
- **NO puede**: Reservar clases (solo el entrenador lo hace)

---

## Datos del Alumno

Cada alumno tiene:

- Datos personales (nombre, email, teléfono)
- **Frecuencia habitual** (1x, 2x, 3x por semana) → determina su precio por clase
- **Horario habitual** (días y hora fijos)
- **Saldo de clases** disponibles
- **Fecha de vencimiento** del saldo actual
- **Historial de pagos**
- **Historial de asistencias**

---

## Reportes

### Financieros

- **Facturación del mes**: Total cobrado en el mes actual
- **Comparativa mes a mes**: Evolución de ingresos
- **Pagos pendientes de aprobar**: Comprobantes enviados sin revisar

### Alumnos

- **Saldos próximos a vencer**: Alumnos con clases que vencen en los próximos X días
- **Alumnos inactivos**: No asistieron hace X tiempo
- **Ranking de asistencia**: Quiénes vienen más/menos
- **Clases no asistidas por alumno**: Inasistencias del mes por alumno

### Operativos

- **Clases de la semana/mes**: Agenda resumida
- **Tasa de ocupación**: Horas con clase vs horas disponibles
- **Cancelaciones/reprogramaciones**: Historial de cambios

---

## Estado de Implementacion

### Implementado (2025-01-27)

| Feature | Estado | Notas |
|---------|--------|-------|
| Sistema de creditos flexibles | Completado | Ver guia `sistema-creditos.md` |
| Frecuencias y precios | Completado | 1x=$30.250, 2x=$27.500, 3x=$25.850 |
| Vencimiento 60 dias | Completado | Cron job automatico |
| Descuento FIFO | Completado | Primero los mas proximos a vencer |
| Ajuste manual de creditos | Completado | Con historial de motivos |

### Pendiente

| Prioridad | Tarea | Tamaño |
|-----------|-------|--------|
| Alta | Auth de alumnos (roles) | Mediano |
| Media | Politica de cancelaciones | Chico |
| Media | Integracion calendario (.ics) | Mediano |
| Baja | Reportes | Mediano |
| Baja | Eliminar campos innecesarios | Chico |

---

## Notas Tecnicas

### Base de datos actual

```
frequency_prices     → Precios por frecuencia
credit_balances      → Saldos con vencimiento
credit_transactions  → Historial de movimientos
students            → Incluye frequency_id, usual_schedule
payment_proofs      → Incluye classes_purchased, price_per_class, frequency_code
```

### Server Actions disponibles

```typescript
// Frecuencias
getFrequencies(), getActiveFrequencies(), getFrequency(id)

// Creditos
getStudentCredits(studentId)
getStudentCreditSummary(studentId)
createCreditBalance(data)
deductCredit(studentId, bookingId)
adjustCredits(studentId, amount, notes)
getCreditTransactions(studentId)
expireCredits()  // para cron

// Asistencia
markAttendance(bookingId)  // marca completada + descuenta credito
```

### Cron Jobs

| Endpoint | Frecuencia | Proposito |
|----------|------------|-----------|
| `/api/cron/send-reminders` | Cada minuto | Recordatorios 24h y 2h |
| `/api/cron/expire-credits` | Diario | Expira creditos vencidos |

---

## Preguntas pendientes

<!-- Seccion para ir agregando dudas a medida que surjan -->

