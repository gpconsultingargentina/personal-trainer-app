# Plan 006: Notificaciones Push para Alumnos

**Estado:** Pendiente
**Prioridad:** Alta
**Estimacion:** Grande
**Fecha:** 2026-01-27

---

## Objetivo

Implementar notificaciones push en el celular para avisar a los alumnos antes de sus clases. Las notificaciones se enviaran automaticamente 4 horas antes de cada clase reservada.

---

## Contexto Actual

El sistema actual de recordatorios usa:
- Email (Resend)
- SMS (Twilio)
- WhatsApp (Twilio)

Con recordatorios a las 24h y 2h antes de la clase.

**Limitacion actual:** No hay notificaciones push nativas del navegador/PWA.

---

## Requisitos

### Funcionales
1. Alumno recibe notificacion push 4h antes de su clase
2. Alumno puede activar/desactivar notificaciones desde el portal
3. Notificaciones funcionan en Android Chrome y iOS Safari (PWA instalada)
4. Al tocar la notificacion, abre la app en la seccion de clases

### No Funcionales
1. No afectar el sistema actual de email/SMS/WhatsApp
2. Graceful degradation si el navegador no soporta push
3. Manejar multiples dispositivos por alumno

---

## Arquitectura

### Flujo de Suscripcion

```
[Alumno abre portal]
       |
       v
[Verificar soporte Push API]
       |
       v
[Mostrar boton "Activar notificaciones"]
       |
       v
[Alumno toca el boton]
       |
       v
[Navegador pide permiso]
       |
       v
[Si acepta: obtener PushSubscription]
       |
       v
[Enviar suscripcion al backend]
       |
       v
[Guardar en tabla push_subscriptions]
```

### Flujo de Envio

```
[Cron job cada minuto]
       |
       v
[Buscar bookings con clase en 4h]
       |
       v
[Obtener push_subscriptions del alumno]
       |
       v
[Enviar push via web-push library]
       |
       v
[Service Worker recibe push]
       |
       v
[Mostrar notificacion nativa]
```

---

## Implementacion Detallada

### Fase 1: Configuracion Inicial

#### 1.1 Generar VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Esto genera:
- `VAPID_PUBLIC_KEY` - Se usa en el frontend
- `VAPID_PRIVATE_KEY` - Se usa en el backend

#### 1.2 Variables de Entorno

Agregar a `.env.local` y Vercel:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:trainer@otakufiit.com
```

#### 1.3 Instalar Dependencia

```bash
npm install web-push
```

---

### Fase 2: Base de Datos

#### 2.1 Crear Tabla push_subscriptions

```sql
-- Ejecutar en Supabase SQL Editor
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Un alumno puede tener multiples dispositivos
  -- pero no duplicar el mismo endpoint
  UNIQUE(endpoint)
);

-- Index para busquedas por alumno
CREATE INDEX idx_push_subscriptions_student
ON push_subscriptions(student_id);

-- RLS: solo el alumno puede ver/modificar sus suscripciones
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumnos ven sus suscripciones"
ON push_subscriptions FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

CREATE POLICY "Alumnos crean sus suscripciones"
ON push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

CREATE POLICY "Alumnos eliminan sus suscripciones"
ON push_subscriptions FOR DELETE
TO authenticated
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

-- Service role puede todo (para el cron)
CREATE POLICY "Service role full access"
ON push_subscriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### 2.2 Agregar Campo a Bookings

```sql
-- Agregar flag para recordatorio de 4h
ALTER TABLE bookings
ADD COLUMN reminder_4h_sent BOOLEAN DEFAULT FALSE;

-- Index para el cron
CREATE INDEX idx_bookings_reminder_4h
ON bookings(reminder_4h_sent)
WHERE reminder_4h_sent = FALSE;
```

---

### Fase 3: Backend - API Endpoints

#### 3.1 Endpoint de Suscripcion

**Archivo:** `app/api/push/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticacion
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener student_id del usuario
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Datos de suscripcion incompletos' },
        { status: 400 }
      )
    }

    // Upsert: actualizar si ya existe el endpoint
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        student_id: student.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: request.headers.get('user-agent'),
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint',
      })

    if (error) {
      console.error('Error guardando suscripcion:', error)
      return NextResponse.json(
        { error: 'Error al guardar suscripcion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en subscribe:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

#### 3.2 Endpoint para Desuscribirse

**Archivo:** `app/api/push/unsubscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Error eliminando suscripcion:', error)
      return NextResponse.json(
        { error: 'Error al eliminar suscripcion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en unsubscribe:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

#### 3.3 Endpoint para Verificar Estado

**Archivo:** `app/api/push/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!student) {
      return NextResponse.json({ subscribed: false })
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, created_at')
      .eq('student_id', student.id)

    if (error) {
      console.error('Error obteniendo suscripciones:', error)
      return NextResponse.json({ subscribed: false })
    }

    return NextResponse.json({
      subscribed: subscriptions && subscriptions.length > 0,
      devices: subscriptions?.length || 0,
    })
  } catch (error) {
    console.error('Error en status:', error)
    return NextResponse.json({ subscribed: false })
  }
}
```

---

### Fase 4: Frontend - Componente de Notificaciones

#### 4.1 Componente PushNotifications

**Archivo:** `app/components/push-notifications/PushNotifications.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Verificar soporte
    const supported = 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      checkSubscription()
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/push/status')
      const data = await response.json()
      setIsSubscribed(data.subscribed)
    } catch (error) {
      console.error('Error verificando suscripcion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribe = async () => {
    setIsLoading(true)
    try {
      // Pedir permiso
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        setIsLoading(false)
        return
      }

      // Obtener service worker registration
      const registration = await navigator.serviceWorker.ready

      // Suscribirse a push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      // Enviar al servidor
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (response.ok) {
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Error al suscribirse:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Eliminar del servidor
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        // Desuscribirse localmente
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (error) {
      console.error('Error al desuscribirse:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // No mostrar si no hay soporte
  if (!isSupported) return null

  // Permiso denegado permanentemente
  if (permission === 'denied') {
    return (
      <div className="bg-surface-alt rounded-lg p-4">
        <p className="text-sm text-muted">
          Las notificaciones estan bloqueadas.
          Para activarlas, cambia los permisos en la configuracion del navegador.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-alt rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">
            Notificaciones Push
          </h3>
          <p className="text-sm text-muted">
            Recibe alertas 4 horas antes de tus clases
          </p>
        </div>
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
            isSubscribed
              ? 'bg-error/10 text-error hover:bg-error/20'
              : 'bg-primary text-white hover:bg-accent'
          } disabled:opacity-50`}
        >
          {isLoading
            ? 'Cargando...'
            : isSubscribed
              ? 'Desactivar'
              : 'Activar'
          }
        </button>
      </div>
    </div>
  )
}

// Helper para convertir VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

#### 4.2 Agregar a Pagina de Perfil

**Modificar:** `app/(portal)/portal/perfil/page.tsx`

Agregar el componente `<PushNotifications />` en la seccion de configuracion.

---

### Fase 5: Service Worker

#### 5.1 Actualizar Service Worker

**Modificar:** `public/sw.js`

El codigo actual ya tiene el handler de push. Verificar que este funcionando:

```javascript
// Manejar notificaciones push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'default', // Evitar duplicados
      renotify: true,
      data: {
        url: data.url || '/portal/clases',
      },
    }
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Manejar click en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes('/portal') && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/portal/clases')
      }
    })
  )
})
```

---

### Fase 6: Cron Job para Enviar Push

#### 6.1 Crear Libreria de Push

**Archivo:** `app/lib/notifications/push.ts`

```typescript
import webpush from 'web-push'

// Configurar VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

type PushSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error: any) {
    // Si el endpoint ya no es valido, retornar error especial
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, error: 'subscription_expired' }
    }
    console.error('Error enviando push:', error)
    return { success: false, error: error.message }
  }
}
```

#### 6.2 Modificar Cron de Reminders

**Modificar:** `app/api/cron/send-reminders/route.ts`

Agregar logica para recordatorio de 4h con push:

```typescript
// ... imports existentes ...
import { sendPushNotification } from '@/app/lib/notifications/push'

export async function GET(request: NextRequest) {
  // ... codigo existente ...

  // Calcular tiempo para 4h
  const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const in4HoursPlus1Min = new Date(in4Hours.getTime() + 60 * 1000)

  // Obtener reservas que necesitan push de 4h
  const { data: bookings4h } = await supabase
    .from('bookings')
    .select(`
      *,
      classes!inner(scheduled_at, duration_minutes),
      students!inner(id, name)
    `)
    .eq('status', 'confirmed')
    .eq('reminder_4h_sent', false)
    .gte('classes.scheduled_at', in4Hours.toISOString())
    .lte('classes.scheduled_at', in4HoursPlus1Min.toISOString())

  // Procesar push notifications de 4h
  for (const booking of bookings4h || []) {
    const student = booking.students
    const classData = booking.classes

    if (!student || !classData) continue

    // Obtener suscripciones push del alumno
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('student_id', student.id)

    if (!subscriptions || subscriptions.length === 0) {
      // Marcar como enviado aunque no tenga suscripciones
      await supabase
        .from('bookings')
        .update({ reminder_4h_sent: true })
        .eq('id', booking.id)
      continue
    }

    const classTime = new Date(classData.scheduled_at)
    const timeStr = classTime.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    let anySent = false
    const expiredEndpoints: string[] = []

    // Enviar a todos los dispositivos del alumno
    for (const sub of subscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        {
          title: 'Clase en 4 horas',
          body: `${student.name}, tu clase es a las ${timeStr}`,
          url: '/portal/clases',
          tag: `reminder-${booking.id}`,
        }
      )

      if (result.success) {
        anySent = true
        // Actualizar last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id)
      } else if (result.error === 'subscription_expired') {
        expiredEndpoints.push(sub.endpoint)
      }
    }

    // Limpiar suscripciones expiradas
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    // Marcar como enviado
    await supabase
      .from('bookings')
      .update({ reminder_4h_sent: true })
      .eq('id', booking.id)

    // Log
    if (anySent) {
      await supabase.from('notifications_log').insert({
        booking_id: booking.id,
        notification_type: 'push_4h',
        status: 'sent',
      })
    }
  }

  // ... resto del codigo existente ...
}
```

---

### Fase 7: Testing

#### 7.1 Test Manual

1. Abrir portal en Chrome/Safari
2. Ir a Perfil > Activar notificaciones
3. Aceptar permiso del navegador
4. Verificar en Supabase que se creo registro en `push_subscriptions`
5. Crear booking de prueba con clase en 4h
6. Ejecutar manualmente: `GET /api/cron/send-reminders?secret=XXX`
7. Verificar que llega la notificacion

#### 7.2 Test en iOS

1. Agregar app a pantalla de inicio (PWA)
2. Abrir la PWA
3. Activar notificaciones
4. Cerrar la app
5. Esperar push (o ejecutar cron manualmente)
6. Verificar que aparece notificacion

---

## Checklist de Implementacion

### Configuracion
- [ ] Generar VAPID keys
- [ ] Agregar env vars a .env.local
- [ ] Agregar env vars a Vercel
- [ ] Instalar `web-push`

### Base de Datos
- [ ] Crear tabla `push_subscriptions`
- [ ] Agregar columna `reminder_4h_sent` a bookings
- [ ] Aplicar RLS policies

### Backend
- [ ] Crear `/api/push/subscribe`
- [ ] Crear `/api/push/unsubscribe`
- [ ] Crear `/api/push/status`
- [ ] Crear `lib/notifications/push.ts`
- [ ] Modificar cron de reminders

### Frontend
- [ ] Crear componente `PushNotifications`
- [ ] Agregar a pagina de perfil
- [ ] Actualizar service worker si es necesario

### Testing
- [ ] Test en Android Chrome
- [ ] Test en iOS Safari (PWA)
- [ ] Test de suscripcion/desuscripcion
- [ ] Test de envio de push
- [ ] Test de click en notificacion

### Deploy
- [ ] Commit y push
- [ ] Verificar deploy en Vercel
- [ ] Verificar env vars en produccion
- [ ] Test end-to-end en produccion

---

## Notas Importantes

1. **iOS requiere PWA instalada** - Las push notifications solo funcionan en iOS si la app esta agregada a la pantalla de inicio

2. **VAPID keys son unicas por proyecto** - No reutilizar entre ambientes

3. **Suscripciones expiran** - El cron limpia automaticamente las suscripciones invalidas

4. **Multiples dispositivos** - Un alumno puede tener notificaciones en varios dispositivos

5. **Cron frequency** - El cron debe ejecutarse al menos cada minuto para no perder la ventana de 4h

---

## Dependencias

- `web-push`: ^3.6.0 o superior

---

## Referencias

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Apple Push Notifications for PWA](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [web-push npm](https://www.npmjs.com/package/web-push)
