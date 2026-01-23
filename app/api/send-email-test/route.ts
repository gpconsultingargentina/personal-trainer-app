import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/app/lib/email'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const to = searchParams.get('to') || 'gpconsultingargentina@gmail.com'
  const name = searchParams.get('name') || 'Gaston'

  try {
    console.log(`📧 Enviando email de bienvenida a: ${to}`)
    await sendWelcomeEmail(to, name)
    
    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      email: to,
      name,
      note: 'Revisa tu bandeja de entrada (y spam)',
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      email: to,
      name,
    }, { status: 500 })
  }
}
