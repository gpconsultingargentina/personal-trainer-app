import { NextRequest, NextResponse } from 'next/server'
import { sendReminderSMS, sendReminderWhatsApp } from '@/app/lib/notifications/sms'
import { sendWelcomeEmail } from '@/app/lib/email'

/**
 * Endpoint de prueba para SMS y WhatsApp
 * 
 * Uso:
 *   GET /api/test/sms-whatsapp?type=sms&phone=+541123903397
 *   GET /api/test/sms-whatsapp?type=whatsapp&phone=+541123903397
 *   GET /api/test/sms-whatsapp?type=both&phone=+541123903397
 *   GET /api/test/sms-whatsapp?type=email&email=tu@email.com&name=Nombre
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'both' // 'sms', 'whatsapp', 'email', o 'both'
  let phone = searchParams.get('phone')
  const email = searchParams.get('email')
  const name = searchParams.get('name') || 'Test Usuario'

  // Si es tipo email, manejar email primero (antes de validar phone)
  if (type === 'email') {
    if (!email) {
      return NextResponse.json(
        { error: 'Debes proporcionar un email con el parámetro ?email=tu@email.com' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido', received: email },
        { status: 400 }
      )
    }

    const envDebug = {
      resendKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 10) || 'undefined',
      emailFrom: process.env.EMAIL_FROM || 'undefined',
    }

    try {
      console.log(`📧 Probando email de bienvenida a: ${email}`)
      await sendWelcomeEmail(email, name)
      return NextResponse.json({
        success: true,
        message: 'Email de bienvenida enviado exitosamente',
        envDebug,
        email,
        name,
        instructions: {
          message: '✅ Email enviado exitosamente. Revisa tu bandeja de entrada (y spam).',
          resendLogs: 'https://resend.com/emails',
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error enviando email:', error)
      return NextResponse.json({
        success: false,
        error: errorMessage,
        envDebug,
        email,
        name,
      }, { status: 500 })
    }
  }

  // Para SMS/WhatsApp, validar phone
  if (!phone) {
    return NextResponse.json(
      { error: 'Debes proporcionar un número de teléfono con el parámetro ?phone=+1234567890' },
      { status: 400 }
    )
  }

  // Debug de entorno: mostrar prefijos para confirmar que .env.local se cargó
  const envDebug = {
    sidPrefix: process.env.TWILIO_ACCOUNT_SID?.slice(0, 10) || 'undefined',
    fromSms: process.env.TWILIO_PHONE_NUMBER || 'undefined',
    fromWa: process.env.TWILIO_WHATSAPP_NUMBER || 'undefined',
  }
  console.log('[sms-whatsapp] envDebug', envDebug)

  // Decodificar el número (por si el + viene codificado como %2B)
  phone = decodeURIComponent(phone)
  
  // Limpiar el número: remover comillas, espacios y otros caracteres no deseados
  phone = phone.trim().replace(/^["']+|["']+$/g, '').trim()

  // Si el + se perdió (convertido a espacio), intentar reconstruirlo
  // Si el número empieza con un dígito, probablemente el + se perdió
  if (phone && /^\d/.test(phone) && !phone.startsWith('+')) {
    phone = '+' + phone
  }

  // Debug: mostrar qué se recibió
  console.log('Número recibido (raw):', searchParams.get('phone'))
  console.log('Número recibido (decoded y limpiado):', phone)
  console.log('Primer carácter:', phone.charAt(0), 'Código ASCII:', phone.charCodeAt(0))

  // Validar que el número no esté vacío después de limpiar
  if (!phone || phone.length === 0) {
    return NextResponse.json(
      { 
        error: 'El número de teléfono no puede estar vacío',
        received: searchParams.get('phone'),
      },
      { status: 400 }
    )
  }

  // Validar formato básico del número
  if (!phone.startsWith('+')) {
    return NextResponse.json(
      { 
        error: 'El número de teléfono debe incluir el código de país (ej: +541123903397)',
        received: phone,
        receivedLength: phone.length,
        firstChar: phone.charAt(0),
        firstCharCode: phone.charCodeAt(0),
        hint: 'El número debe empezar con + seguido del código de país. Si usas + directamente en la URL, usa %2B en su lugar.'
      },
      { status: 400 }
    )
  }

  const results: {
    sms?: { success: boolean; error?: string }
    whatsapp?: { success: boolean; error?: string }
  } = {}

  const testData = {
    to: phone,
    studentName: 'Test Usuario',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas desde ahora
    reminderType: '2h' as const,
  }

  // Probar SMS
  if (type === 'sms' || type === 'both') {
    console.log(`📱 Probando SMS a: ${phone}`)
    results.sms = await sendReminderSMS(testData)
  }

  // Probar WhatsApp
  if (type === 'whatsapp' || type === 'both') {
    console.log(`💬 Probando WhatsApp a: ${phone}`)
    results.whatsapp = await sendReminderWhatsApp(testData)
  }

  return NextResponse.json({
    success: true,
    message: 'Pruebas completadas',
    envDebug,
    phone,
    results,
    instructions: {
      sms:
        type === 'whatsapp'
          ? 'ℹ️ No se probó SMS (type=whatsapp)'
          : results.sms?.success
            ? '✅ SMS enviado exitosamente. Revisa tu teléfono.'
            : `❌ Error en SMS: ${results.sms?.error || 'Desconocido'}`,
      whatsapp:
        type === 'sms'
          ? 'ℹ️ No se probó WhatsApp (type=sms)'
          : results.whatsapp?.success
            ? '✅ WhatsApp enviado exitosamente. Revisa tu WhatsApp.'
            : `❌ Error en WhatsApp: ${results.whatsapp?.error || 'Desconocido'}`,
      note: 'Si WhatsApp falla, asegúrate de que el número esté unido al sandbox de Twilio',
    },
  })
}
