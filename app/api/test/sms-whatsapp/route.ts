import { NextRequest, NextResponse } from 'next/server'
import { sendReminderSMS, sendReminderWhatsApp } from '@/app/lib/notifications/sms'

/**
 * Endpoint de prueba para SMS y WhatsApp
 * 
 * Uso:
 *   GET /api/test/sms-whatsapp?type=sms&phone=+541123903397
 *   GET /api/test/sms-whatsapp?type=whatsapp&phone=+541123903397
 *   GET /api/test/sms-whatsapp?type=both&phone=+541123903397
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'both' // 'sms', 'whatsapp', o 'both'
  let phone = searchParams.get('phone')

  // Debug de entorno: mostrar prefijos para confirmar que .env.local se cargó
  const envDebug = {
    sidPrefix: process.env.TWILIO_ACCOUNT_SID?.slice(0, 10) || 'undefined',
    fromSms: process.env.TWILIO_PHONE_NUMBER || 'undefined',
    fromWa: process.env.TWILIO_WHATSAPP_NUMBER || 'undefined',
  }
  console.log('[sms-whatsapp] envDebug', envDebug)

  if (!phone) {
    return NextResponse.json(
      { error: 'Debes proporcionar un número de teléfono con el parámetro ?phone=+1234567890' },
      { status: 400 }
    )
  }

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
      sms: results.sms?.success
        ? '✅ SMS enviado exitosamente. Revisa tu teléfono.'
        : `❌ Error en SMS: ${results.sms?.error || 'Desconocido'}`,
      whatsapp: results.whatsapp?.success
        ? '✅ WhatsApp enviado exitosamente. Revisa tu WhatsApp.'
        : `❌ Error en WhatsApp: ${results.whatsapp?.error || 'Desconocido'}`,
      note: 'Si WhatsApp falla, asegúrate de que el número esté unido al sandbox de Twilio',
    },
  })
}
