import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'URL del archivo requerida' },
        { status: 400 }
      )
    }

    // Extraer el path del archivo de la URL completa
    // La URL puede ser: https://[project].supabase.co/storage/v1/object/public/payment-proofs/[filename]
    // O: https://[project].supabase.co/storage/v1/object/sign/payment-proofs/[filename]?token=...
    let filePath = ''
    
    if (fileUrl.includes('/storage/v1/object/public/')) {
      // URL pública - extraer el path después de payment-proofs/
      const match = fileUrl.match(/\/storage\/v1\/object\/public\/payment-proofs\/(.+)$/)
      if (match && match[1]) {
        filePath = match[1].split('?')[0] // Remover query params si los hay
      }
    } else if (fileUrl.includes('/storage/v1/object/sign/')) {
      // URL firmada existente, redirigir directamente
      return NextResponse.redirect(fileUrl)
    } else {
      // Asumir que es solo el nombre del archivo o una URL relativa
      filePath = fileUrl.replace(/^.*\/payment-proofs\//, '').split('?')[0]
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'No se pudo extraer el path del archivo' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Generar URL firmada que expira en 1 hora
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(filePath, 3600) // 1 hora

    if (error) {
      console.error('Error al generar URL firmada:', error)
      return NextResponse.json(
        { error: `Error al generar URL: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data?.signedUrl) {
      return NextResponse.json(
        { error: 'No se pudo generar la URL firmada' },
        { status: 500 }
      )
    }

    // Redirigir a la URL firmada
    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    console.error('Error inesperado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

