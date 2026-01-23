import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/app/lib/email'
import { sendReminderEmail } from '@/app/lib/notifications/email'

/**
 * Endpoint de prueba para Emails
 * 
 * Uso:
 *   GET /api/test/email?type=welcome&to=tu@email.com
 *   GET /api/test/email?type=reminder&to=tu@email.com
 *   GET /api/test/email?type=welcome&to=tu@email.com&name=Juan
 *   POST /api/test/email (con body JSON: { type: 'welcome', to: 'email@ejemplo.com', name: 'Nombre' })
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'welcome' // 'welcome', 'reminder'
  const to = searchParams.get('to')
  const name = searchParams.get('name') || 'Test Usuario'

  // Debug de entorno
  const envDebug = {
    resendKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 10) || 'undefined',
    emailFrom: process.env.EMAIL_FROM || 'undefined',
  }
  console.log('[email-test] envDebug', envDebug)

  if (!to) {
    return NextResponse.json(
      { 
        error: 'Debes proporcionar un email con el parámetro ?to=tu@email.com',
        examples: {
          welcome: '/api/test/email?type=welcome&to=tu@email.com&name=Juan',
          reminder: '/api/test/email?type=reminder&to=tu@email.com&name=Juan',
        }
      },
      { status: 400 }
    )
  }

  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    return NextResponse.json(
      { 
        error: 'El formato del email no es válido',
        received: to,
      },
      { status: 400 }
    )
  }

  const results: {
    welcome?: { success: boolean; error?: string }
    reminder?: { success: boolean; error?: string }
  } = {}

  // Probar email de bienvenida
  if (type === 'welcome') {
    console.log(`📧 Probando email de bienvenida a: ${to}`)
    try {
      await sendWelcomeEmail(to, name)
      results.welcome = { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error enviando email de bienvenida:', error)
      results.welcome = { success: false, error: errorMessage }
    }
  }

  // Probar email de recordatorio
  if (type === 'reminder') {
    console.log(`📧 Probando email de recordatorio a: ${to}`)
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 horas desde ahora
    const reminderResult = await sendReminderEmail({
      to,
      studentName: name,
      className: 'Clase de Prueba (60 minutos)',
      scheduledAt,
      reminderType: '2h',
    })
    results.reminder = reminderResult
  }

  // Si no se especificó tipo o se especificó 'both', probar ambos
  if (type === 'both' || (!type || type === '')) {
    console.log(`📧 Probando ambos tipos de email a: ${to}`)
    
    // Bienvenida
    try {
      await sendWelcomeEmail(to, name)
      results.welcome = { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      results.welcome = { success: false, error: errorMessage }
    }

    // Recordatorio
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const reminderResult = await sendReminderEmail({
      to,
      studentName: name,
      className: 'Clase de Prueba (60 minutos)',
      scheduledAt,
      reminderType: '2h',
    })
    results.reminder = reminderResult
  }

  return NextResponse.json({
    success: true,
    message: 'Pruebas de email completadas',
    envDebug,
    email: to,
    name,
    results,
    instructions: {
      welcome:
        type === 'reminder'
          ? 'ℹ️ No se probó email de bienvenida (type=reminder)'
          : results.welcome?.success
            ? '✅ Email de bienvenida enviado exitosamente. Revisa tu bandeja de entrada (y spam).'
            : `❌ Error en email de bienvenida: ${results.welcome?.error || 'Desconocido'}`,
      reminder:
        type === 'welcome'
          ? 'ℹ️ No se probó email de recordatorio (type=welcome)'
          : results.reminder?.success
            ? '✅ Email de recordatorio enviado exitosamente. Revisa tu bandeja de entrada (y spam).'
            : `❌ Error en email de recordatorio: ${results.reminder?.error || 'Desconocido'}`,
      note: 'Si no recibes el email, revisa la carpeta de spam y los logs en el dashboard de Resend.',
      resendLogs: 'https://resend.com/emails',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'welcome', to, name = 'Test Usuario' } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Debes proporcionar un email en el body: { "to": "tu@email.com" }' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido', received: to },
        { status: 400 }
      )
    }

    const envDebug = {
      resendKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 10) || 'undefined',
      emailFrom: process.env.EMAIL_FROM || 'undefined',
    }

    let result

    if (type === 'welcome') {
      console.log(`📧 Probando email de bienvenida a: ${to}`)
      try {
        await sendWelcomeEmail(to, name)
        result = { success: true, message: 'Email de bienvenida enviado exitosamente' }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error enviando email de bienvenida:', error)
        result = { success: false, error: errorMessage }
      }
    } else if (type === 'reminder') {
      console.log(`📧 Probando email de recordatorio a: ${to}`)
      const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      result = await sendReminderEmail({
        to,
        studentName: name,
        className: 'Clase de Prueba (60 minutos)',
        scheduledAt,
        reminderType: '2h',
      })
    } else {
      return NextResponse.json(
        { error: 'Tipo inválido. Usa "welcome" o "reminder"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Email enviado exitosamente. Revisa tu bandeja de entrada (y spam).'
        : `Error: ${result.error || 'Desconocido'}`,
      envDebug,
      email: to,
      name,
      result,
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error procesando la petición',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
