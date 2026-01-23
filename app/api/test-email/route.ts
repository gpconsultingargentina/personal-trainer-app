import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/app/lib/email'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const to = searchParams.get('to')
  const name = searchParams.get('name') || 'Test Usuario'

  if (!to) {
    return NextResponse.json(
      { error: 'Debes proporcionar un email con el parámetro ?to=tu@email.com' },
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

  try {
    console.log(`📧 Probando email de bienvenida a: ${to}`)
    await sendWelcomeEmail(to, name)
    return NextResponse.json({
      success: true,
      message: 'Email de bienvenida enviado exitosamente',
      envDebug,
      email: to,
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
      email: to,
      name,
    }, { status: 500 })
  }
}
