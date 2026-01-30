---
id: "pending-001"
titulo: "Notificaciones al Entrenador por Cancelaciones"
estado: "pendiente"
prioridad: "media"
creado: "2025-01-30"
estimacion: "1-6 horas (según opción)"
dependencias: []
---

# Notificaciones al Entrenador por Cancelaciones

**Fecha:** 2025-01-30
**Tipo:** Feature / Notificaciones
**Estado:** Análisis completado, pendiente de implementación

---

## Objetivo

Implementar un sistema de notificaciones que avise al entrenador inmediatamente cuando un alumno cancela una clase, permitiendo gestión proactiva de la agenda y posible reprogramación.

---

## Contexto

Actualmente, cuando un alumno cancela una clase desde el portal:
1. ✅ La clase se cancela en el sistema
2. ✅ Los créditos se manejan correctamente (tolerancia/penalización)
3. ❌ **El entrenador NO recibe notificación automática**
4. ❌ El entrenador debe revisar manualmente el sistema para ver cancelaciones

**Problema:**
- El entrenador se entera tarde de las cancelaciones
- Pierde oportunidad de reprogramar
- Puede perder slots que podrían usarse para otros alumnos

**Motivación:**
El nuevo mensaje de cancelación dice: "La cancelación se hará efectiva cuando le avises por WhatsApp a tu entrenador". Sería mejor automatizar esta notificación.

---

## Estado del Sistema Actual

### Notificaciones Existentes

**Para Alumnos:**
- ✅ Email (Resend) - Recordatorios 24h y 2h antes
- ✅ SMS (Twilio) - Recordatorios configurables
- ✅ WhatsApp (Twilio) - Recordatorios configurables

**Para Entrenador:**
- ❌ No hay notificaciones automáticas de cancelaciones
- ❌ Sistema de push notifications NO implementado (documentado en plan-006)

### Infraestructura Disponible

| Servicio | Estado | Configurado | Costo |
|----------|--------|-------------|-------|
| Resend (Email) | ✅ Activo | Sí | Gratis hasta 3k/mes |
| Twilio (SMS) | ✅ Activo | Sí | ~$0.0075 por SMS |
| Twilio (WhatsApp) | ✅ Activo | Sí | ~$0.005 por mensaje |
| Push Notifications | ❌ No implementado | No | Gratis |

---

## Análisis de Opciones

### Opción 1: Email Inmediato ✅

**Complejidad:** ⭐ Baja  
**Riesgo:** ⭐ Muy bajo  
**Costo:** Gratis  
**Tiempo de implementación:** 10-15 minutos

#### Implementación

```typescript
// En app/lib/notifications/email.ts
export async function sendCancellationNotificationToTrainer(
  studentName: string,
  className: string,
  classDate: Date,
  reason?: string
) {
  const { resend } = await getResendClient()
  
  await resend.emails.send({
    from: 'Otakufiit <noreply@otakufiit.com>',
    to: 'trainer@otakufiit.com', // Email del entrenador
    subject: `🚨 Cancelación: ${studentName}`,
    html: `
      <h2>Cancelación de Clase</h2>
      <p><strong>Alumno:</strong> ${studentName}</p>
      <p><strong>Clase:</strong> ${className}</p>
      <p><strong>Fecha/Hora:</strong> ${formatDate(classDate)}</p>
      ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
      <p>Puedes intentar reprogramar contactando al alumno.</p>
    `
  })
}

// En app/actions/bookings.ts - función cancelStudentBooking()
try {
  // Cancelar la clase (principal)
  await cancelBooking(...)
  
  // Notificar al entrenador (secundario - no bloquea)
  try {
    await sendCancellationNotificationToTrainer(...)
  } catch (emailError) {
    console.error('Failed to send cancellation email:', emailError)
    // No lanzar error - la cancelación ya se completó
  }
  
} catch (error) {
  throw error // Solo falla si la cancelación principal falla
}
```

#### Pros
- ✅ Implementación rápida y simple
- ✅ Sin dependencias nuevas
- ✅ Usa infraestructura existente (Resend)
- ✅ Sin costo adicional
- ✅ Falla graciosamente (no afecta cancelación)
- ✅ Historial en bandeja de entrada
- ✅ Puede incluir información detallada

#### Contras
- ❌ No es notificación en tiempo real en el celular
- ❌ Requiere revisar email
- ❌ Puede perderse entre otros emails
- ❌ No tiene sonido/vibración inmediata

#### Casos de Fallo
- **Si Resend está caído:** La cancelación se completa, solo falla la notificación
- **Si email es inválido:** Se loguea error, cancelación se completa
- **Si límite de emails excedido:** Se loguea error, cancelación se completa

#### Testing
```typescript
// Test manual
1. Alumno cancela clase desde portal
2. Verificar que llega email al entrenador
3. Verificar contenido del email
4. Probar con Resend simulando error
5. Verificar que cancelación se completa igual
```

---

### Opción 2: WhatsApp/SMS al Entrenador ✅

**Complejidad:** ⭐ Baja  
**Riesgo:** ⭐ Bajo  
**Costo:** ~$0.005 por cancelación  
**Tiempo de implementación:** 15-20 minutos

#### Implementación

```typescript
// En app/lib/notifications/sms.ts
export async function sendCancellationWhatsAppToTrainer(
  studentName: string,
  className: string,
  classDate: Date
) {
  const { twilio } = await getTwilioClient()
  
  const message = `🚨 CANCELACIÓN\n\n` +
    `Alumno: ${studentName}\n` +
    `Clase: ${className}\n` +
    `Fecha: ${formatDate(classDate)}\n\n` +
    `Contacta para reprogramar.`
  
  await twilio.messages.create({
    from: 'whatsapp:+14155238886', // Twilio Sandbox o número verificado
    to: 'whatsapp:+5491112345678', // WhatsApp del entrenador
    body: message
  })
}

// En app/actions/bookings.ts
try {
  await cancelBooking(...)
  
  // Notificar por WhatsApp
  try {
    await sendCancellationWhatsAppToTrainer(...)
  } catch (smsError) {
    console.error('Failed to send WhatsApp:', smsError)
  }
  
} catch (error) {
  throw error
}
```

#### Pros
- ✅ **Notificación inmediata en el celular**
- ✅ Sonido/vibración nativa
- ✅ Alta tasa de lectura (casi 100%)
- ✅ No requiere app abierta
- ✅ Usa infraestructura existente (Twilio)
- ✅ Falla graciosamente

#### Contras
- ❌ Costo por mensaje (~$0.005 cada cancelación)
- ❌ Depende de Twilio funcionando
- ❌ Menos información que email (límite 1600 caracteres)
- ❌ No tiene historial organizado como email

#### Casos de Fallo
- **Si Twilio está caído:** La cancelación se completa, solo falla la notificación
- **Si número es inválido:** Se loguea error, cancelación se completa
- **Si saldo Twilio agotado:** Se loguea error, cancelación se completa

#### Estimación de Costos

Suponiendo:
- 10 alumnos activos
- 2 clases por semana por alumno = 20 clases/semana
- 10% de cancelaciones = 2 cancelaciones/semana
- Costo: 2 × $0.005 = **$0.01/semana = $0.52/año**

**Costo prácticamente negligible.**

---

### Opción 3: Email + WhatsApp (Combo) ✅✅ RECOMENDADO

**Complejidad:** ⭐⭐ Media-Baja  
**Riesgo:** ⭐ Muy bajo  
**Costo:** ~$0.005 por cancelación  
**Tiempo de implementación:** 20-30 minutos

#### Implementación

```typescript
// En app/actions/bookings.ts
export async function cancelStudentBooking(bookingId: string) {
  try {
    // 1. Obtener info antes de cancelar
    const booking = await getBooking(bookingId)
    const student = await getStudent(booking.student_id)
    const classInfo = await getClass(booking.class_id)
    
    // 2. Cancelar la clase (operación principal)
    await cancelBooking(bookingId)
    
    // 3. Notificaciones al entrenador (operaciones secundarias)
    const notificationPromises = [
      // Email para historial detallado
      sendCancellationNotificationToTrainer(
        student.name,
        classInfo.name,
        classInfo.scheduled_at
      ).catch(err => console.error('Email notification failed:', err)),
      
      // WhatsApp para alerta inmediata
      sendCancellationWhatsAppToTrainer(
        student.name,
        classInfo.name,
        classInfo.scheduled_at
      ).catch(err => console.error('WhatsApp notification failed:', err))
    ]
    
    // Ejecutar notificaciones en paralelo (no bloqueantes)
    await Promise.allSettled(notificationPromises)
    
    return { success: true }
    
  } catch (error) {
    // Solo falla si la cancelación principal falla
    throw error
  }
}
```

#### Pros
- ✅ **Lo mejor de ambos mundos**
- ✅ Alerta inmediata en celular (WhatsApp)
- ✅ Historial detallado (Email)
- ✅ Redundancia (si uno falla, el otro funciona)
- ✅ Falla graciosamente
- ✅ Costo mínimo

#### Contras
- ❌ Ligeramente más complejo (2 integraciones)
- ❌ Costo por WhatsApp ($0.005/msg)

#### Flujo Completo

```
[Alumno cancela clase]
       ↓
[Sistema cancela booking]
       ↓
[Envía Email + WhatsApp en paralelo]
       ↓
[Entrenador recibe:]
  - Vibración/sonido en celular (WhatsApp)
  - Email detallado para revisar después
```

---

### Opción 4: Sistema Push Completo ⚠️

**Complejidad:** ⭐⭐⭐⭐⭐ Muy alta  
**Riesgo:** ⭐⭐⭐ Medio-Alto  
**Costo:** Gratis  
**Tiempo de implementación:** 4-6 horas + testing extensivo

#### Requisitos Previos

1. **Generar VAPID keys**
```bash
npx web-push generate-vapid-keys
```

2. **Configurar variables de entorno**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:trainer@otakufiit.com
```

3. **Instalar dependencias**
```bash
npm install web-push
npm install -D @types/web-push
```

4. **Crear tabla en Supabase**
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

5. **Implementar UI de suscripción** (componente en dashboard)

6. **Implementar backend de envío** (API route)

7. **Testing multiplataforma**
   - Chrome Android (PWA)
   - Safari iOS (PWA) - Requiere iOS 16.4+
   - Chrome Desktop
   - Firefox Desktop

#### Implementación (Resumen)

```typescript
// 1. Componente de suscripción (Dashboard)
export function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  
  const handleSubscribe = async () => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      )
    })
    
    // Guardar en backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    })
  }
  
  return <button onClick={handleSubscribe}>...</button>
}

// 2. API Route de envío
export async function POST(request: Request) {
  const { title, body, url } = await request.json()
  
  // Obtener suscripciones del entrenador
  const subscriptions = await getTrainerSubscriptions()
  
  // Enviar a todos los dispositivos
  for (const sub of subscriptions) {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      },
      JSON.stringify({ title, body, url })
    )
  }
}

// 3. En cancelación
await fetch('/api/push/send', {
  method: 'POST',
  body: JSON.stringify({
    title: '🚨 Cancelación de Clase',
    body: `${studentName} canceló su clase del ${date}`,
    url: '/dashboard/students'
  })
})
```

#### Pros
- ✅ Notificaciones nativas del sistema operativo
- ✅ Funciona con app cerrada
- ✅ Sin costo (gratis)
- ✅ Aspecto profesional
- ✅ Base para futuras notificaciones push

#### Contras
- ❌ **Implementación compleja (4-6 horas)**
- ❌ Requiere configuración de infraestructura
- ❌ Testing multiplataforma complejo
- ❌ iOS solo funciona con PWA instalada (iOS 16.4+)
- ❌ Requiere que el entrenador se suscriba desde cada dispositivo
- ❌ Si VAPID keys se pierden, todas las suscripciones invalidan
- ❌ Puede fallar silenciosamente (difícil de debuggear)

#### Riesgos Críticos

1. **Dependencias en producción**
   - Si `web-push` tiene breaking changes, puede romper el build
   - VAPID keys deben estar correctamente en .env de producción

2. **Compatibilidad de navegadores**
   - Safari iOS requiere iOS 16.4+ y PWA instalada
   - Algunos navegadores antiguos no soportan Push API

3. **Manejo de errores**
   - Subscriptions pueden expirar
   - Endpoints pueden volverse inválidos
   - ¿Qué pasa si todas las suscripciones fallan?

4. **Testing**
   - Requiere testing en dispositivos reales
   - Difícil de testear en local (necesita HTTPS)
   - Simulación de fallos es compleja

5. **Mantenimiento**
   - Necesita monitoreo de suscripciones expiradas
   - Limpieza de endpoints inválidos
   - Rotación de VAPID keys (eventual)

#### Decisión: NO RECOMENDADO PARA AHORA

Razones:
- ⚠️ Complejidad >> Beneficio para 1 usuario (el entrenador)
- ⚠️ Riesgo de introducir bugs en producción
- ⚠️ Alternativas más simples cubren la necesidad
- ⚠️ Puede implementarse después si realmente se necesita

**Mejor dejar para cuando se implemente plan-006** (notificaciones push para alumnos), donde el esfuerzo se justifica por múltiples usuarios.

---

## Comparación de Opciones

| Criterio | Email | WhatsApp | Email+WhatsApp | Push |
|----------|-------|----------|----------------|------|
| **Complejidad** | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Riesgo** | ⭐ | ⭐ | ⭐ | ⭐⭐⭐ |
| **Inmediatez** | ❌ | ✅ | ✅ | ✅ |
| **Costo** | Gratis | $0.005/msg | $0.005/msg | Gratis |
| **Infraestructura nueva** | No | No | No | Sí |
| **Tiempo impl.** | 10min | 15min | 20min | 4-6h |
| **Historial** | ✅ | ❌ | ✅ | ❌ |
| **Testing** | Fácil | Fácil | Fácil | Complejo |
| **Mantenimiento** | Bajo | Bajo | Bajo | Alto |
| **Falla graciosamente** | ✅ | ✅ | ✅ | ⚠️ |

---

## Recomendación Final

### **Opción 3: Email + WhatsApp** ✅✅

**Justificación:**
1. **Balance perfecto** entre inmediatez y detalle
2. **Riesgo mínimo** - usa infraestructura ya probada
3. **Costo negligible** - $0.005 por cancelación = ~$0.50/año
4. **Implementación rápida** - 20-30 minutos
5. **Redundancia** - si uno falla, el otro funciona
6. **Falla graciosamente** - no afecta funcionalidad core

### Flujo Recomendado

```typescript
async function cancelStudentBooking(bookingId: string) {
  // 1. Validaciones
  const canCancel = await checkCancellationPolicy(bookingId)
  if (!canCancel.canCancel) {
    throw new Error(canCancel.message)
  }
  
  // 2. Obtener datos antes de cancelar
  const booking = await getBooking(bookingId)
  const student = await getStudent(booking.student_id)
  const classInfo = await getClass(booking.class_id)
  
  // 3. CANCELAR CLASE (operación crítica)
  try {
    await cancelBookingInDatabase(bookingId)
    await handleCredits(booking) // Tolerancia/penalización
  } catch (error) {
    throw new Error('Error al cancelar la clase')
  }
  
  // 4. NOTIFICAR AL ENTRENADOR (operación secundaria)
  const notifications = [
    // Email: Historial detallado
    sendCancellationEmail(
      trainer.email,
      student.name,
      classInfo
    ).catch(err => {
      console.error('Email failed:', err)
      // No lanzar error - solo loguear
    }),
    
    // WhatsApp: Alerta inmediata
    sendCancellationWhatsApp(
      trainer.phone,
      student.name,
      classInfo
    ).catch(err => {
      console.error('WhatsApp failed:', err)
      // No lanzar error - solo loguear
    })
  ]
  
  // Ejecutar en paralelo sin bloquear
  await Promise.allSettled(notifications)
  
  return { success: true, message: 'Clase cancelada exitosamente' }
}
```

---

## Plan de Implementación

### Fase 1: Email (10 minutos)

**Tareas:**
1. Crear función `sendCancellationNotificationToTrainer()` en `app/lib/notifications/email.ts`
2. Agregar llamada en `app/actions/bookings.ts` → `cancelStudentBooking()`
3. Testing con Resend
4. Deploy y verificar

**Criterio de éxito:**
- ✅ Entrenador recibe email al cancelarse clase
- ✅ Email contiene: nombre alumno, fecha/hora clase, link al dashboard
- ✅ Si email falla, cancelación se completa igual

### Fase 2: WhatsApp (10 minutos)

**Tareas:**
1. Crear función `sendCancellationWhatsAppToTrainer()` en `app/lib/notifications/sms.ts`
2. Configurar número de WhatsApp del entrenador en .env
3. Agregar llamada en `cancelStudentBooking()`
4. Testing con Twilio sandbox
5. Deploy y verificar

**Criterio de éxito:**
- ✅ Entrenador recibe WhatsApp al cancelarse clase
- ✅ Mensaje incluye emoji 🚨, nombre alumno, fecha/hora
- ✅ Si WhatsApp falla, cancelación se completa igual

### Fase 3: Testing Integrado (5 minutos)

**Casos de test:**
1. ✅ Cancelación normal con >24h → Recibe Email + WhatsApp
2. ✅ Cancelación tardía → Recibe Email + WhatsApp con mención de penalización
3. ✅ Resend caído → Recibe solo WhatsApp, cancelación funciona
4. ✅ Twilio caído → Recibe solo Email, cancelación funciona
5. ✅ Ambos caídos → Solo cancelación funciona, errores logueados

---

## Archivos a Modificar

### Nuevos Archivos
```
app/lib/notifications/cancellation.ts (opcional - helpers compartidos)
```

### Archivos Existentes
```
modified:   app/lib/notifications/email.ts
modified:   app/lib/notifications/sms.ts
modified:   app/actions/bookings.ts
modified:   .env.local (número WhatsApp entrenador)
modified:   .env.production (número WhatsApp entrenador)
```

---

## Variables de Entorno Requeridas

```env
# Email del entrenador (ya existe probablemente)
TRAINER_EMAIL=trainer@otakufiit.com

# WhatsApp del entrenador (nuevo)
TRAINER_WHATSAPP=+5491112345678

# Twilio (ya configurado)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Resend (ya configurado)
RESEND_API_KEY=...
```

---

## Costos Estimados

### Escenario Conservador
- 10 alumnos activos
- 2 clases/semana/alumno = 80 clases/mes
- 10% de cancelaciones = 8 cancelaciones/mes
- Costo WhatsApp: 8 × $0.005 = **$0.04/mes**
- Email: Gratis (dentro de límite Resend)
- **Total: $0.04/mes = $0.48/año**

### Escenario Crecimiento
- 30 alumnos activos
- 2 clases/semana/alumno = 240 clases/mes
- 10% de cancelaciones = 24 cancelaciones/mes
- Costo WhatsApp: 24 × $0.005 = **$0.12/mes**
- Email: Gratis
- **Total: $0.12/mes = $1.44/año**

**Conclusión: Costo negligible en cualquier escenario.**

---

## Riesgos y Mitigaciones

### Riesgo 1: Notificaciones Fallan Pero Cancelación Funciona
**Probabilidad:** Baja  
**Impacto:** Bajo (entrenador no se entera)  
**Mitigación:** 
- Try-catch envolviendo solo las notificaciones
- Logging de errores para debugging
- Redundancia (email + WhatsApp)

### Riesgo 2: Spam de Notificaciones
**Probabilidad:** Baja  
**Impacto:** Medio (molestia)  
**Mitigación:**
- Solo notificar cancelaciones (no confirmaciones)
- Límite de rate (futuro): max 1 notificación/minuto

### Riesgo 3: Costos de Twilio Escalan
**Probabilidad:** Muy baja  
**Impacto:** Bajo ($1-2/mes en peor escenario)  
**Mitigación:**
- Monitoreo de uso de Twilio
- Alerta si gastos >$5/mes

### Riesgo 4: Número de WhatsApp Cambia
**Probabilidad:** Baja  
**Impacto:** Medio  
**Mitigación:**
- Usar variable de entorno (fácil de cambiar)
- Documentar cómo actualizar en README

---

## Testing

### Test Manual (Desarrollo)

```bash
# 1. Configurar .env.local con tu número de prueba
TRAINER_WHATSAPP=+5491112345678

# 2. Ejecutar servidor
npm run dev

# 3. Como alumno, cancelar clase desde portal

# 4. Verificar:
#    - ✅ Clase cancelada en DB
#    - ✅ Recibes email
#    - ✅ Recibes WhatsApp
#    - ✅ Ambos tienen info correcta
```

### Test de Fallo (Desarrollo)

```typescript
// Simular fallo de Resend
process.env.RESEND_API_KEY = 'invalid'
// Cancelar clase
// Verificar: ✅ Recibe WhatsApp, ✅ Clase cancelada, ✅ Error logueado

// Simular fallo de Twilio
process.env.TWILIO_AUTH_TOKEN = 'invalid'
// Cancelar clase
// Verificar: ✅ Recibe Email, ✅ Clase cancelada, ✅ Error logueado
```

### Test en Producción

1. Desplegar a Vercel
2. Cancelar una clase real (o de prueba)
3. Verificar recepción de notificaciones
4. Revisar logs en Vercel para errores

---

## Monitoreo y Logs

### Logs Recomendados

```typescript
// En cada notificación
console.log('[CANCELLATION NOTIFICATION]', {
  timestamp: new Date().toISOString(),
  student: student.name,
  class: classInfo.name,
  emailSent: emailSuccess,
  whatsappSent: whatsappSuccess,
  errors: errors.length > 0 ? errors : null
})
```

### Alertas Sugeridas (Futuro)

- Si >5 notificaciones fallan en 1 hora → Revisar Resend/Twilio
- Si Twilio gasta >$5/mes → Investigar uso anormal

---

## Próximos Pasos (Después de Implementar)

### Mejoras Opcionales (Backlog)

1. **Dashboard de notificaciones**
   - Ver historial de cancelaciones
   - Ver qué notificaciones se enviaron
   - Ver tasa de éxito/fallo

2. **Personalización de mensajes**
   - Templates configurables
   - Diferentes mensajes según tipo de cancelación

3. **Preferencias de notificación**
   - Toggle para activar/desactivar WhatsApp
   - Toggle para activar/desactivar Email
   - Horarios de "no molestar"

4. **Notificaciones adicionales**
   - Nuevos alumnos registrados
   - Pagos pendientes de aprobación
   - Clases con pocos alumnos

5. **Push notifications** (cuando se implemente plan-006)
   - Migrar a sistema unificado de notificaciones
   - Agregar push como canal adicional

---

## Dependencias y Prerrequisitos

### Ya Configurado ✅
- [x] Resend API (email)
- [x] Twilio API (SMS/WhatsApp)
- [x] Variables de entorno en .env
- [x] Funciones helper de email existentes
- [x] Funciones helper de SMS existentes

### Por Configurar 🔧
- [ ] Variable `TRAINER_EMAIL` en .env
- [ ] Variable `TRAINER_WHATSAPP` en .env
- [ ] Templates de email para cancelaciones
- [ ] Templates de WhatsApp para cancelaciones

---

## Referencias

### Documentación Relacionada
- `app/lib/notifications/email.ts` - Implementación actual de emails
- `app/lib/notifications/sms.ts` - Implementación actual de SMS/WhatsApp
- `app/actions/bookings.ts` - Lógica de cancelación actual
- `docs/planes/006-notificaciones-push.md` - Plan futuro de push notifications

### APIs Externas
- [Resend API Docs](https://resend.com/docs)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Twilio SMS API](https://www.twilio.com/docs/sms)

---

## Decisión Final

**OPCIÓN SELECCIONADA (pendiente de implementación):**
### Email + WhatsApp (Opción 3)

**Cuándo implementar:**
- Cuando el entrenador lo solicite
- Prioridad: Media (no urgente, pero útil)
- Estimación: 30 minutos de desarrollo + 10 minutos de testing

**Criterios para cambiar de decisión:**
- Si costos de Twilio son preocupación → Solo Email
- Si se necesita historial detallado → Solo Email
- Si se implementa plan-006 → Migrar a Push

---

## Notas Adicionales

### Por qué NO Push Ahora

Push notifications es un sistema complejo que se justifica cuando:
1. Múltiples usuarios necesitan recibirlas (alumnos)
2. Es la única opción viable
3. Vale la pena la inversión en infraestructura

Para 1 solo usuario (el entrenador), Email + WhatsApp es **80% del beneficio con 5% del esfuerzo**.

### Lecciones de Arquitectura

**Principio aplicado:** *Separation of Concerns*
- Cancelación de clase = Operación crítica (debe funcionar siempre)
- Notificaciones = Operación secundaria (nice-to-have)
- Las notificaciones NO deben poder romper la cancelación

**Patrón usado:** *Fail Gracefully*
```typescript
try {
  // Operación crítica
  await cancelBooking()
} catch (error) {
  throw error // Propagar solo errores críticos
}

// Operaciones secundarias
await notifyTrainer().catch(err => {
  console.error(err) // Solo loguear, no propagar
})
```

---

## Commit Sugerido (Cuando se Implemente)

```bash
git add .
git commit -m "feat: notificaciones al entrenador por cancelaciones (email + whatsapp)"
git push
```

**Archivos incluidos:**
- `app/lib/notifications/email.ts`
- `app/lib/notifications/sms.ts`
- `app/actions/bookings.ts`
- `docs/planes/completados/pending-001-notificaciones-al-entrenador.md` (mover a completados)
