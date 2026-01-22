import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const supabase = await createServiceClient()
    const file = formData.get('file') as File
    const studentId = formData.get('student_id') as string
    const planId = formData.get('plan_id') as string
    const couponId = formData.get('coupon_id') as string || null
    const originalPrice = parseFloat(formData.get('original_price') as string)
    const finalPrice = parseFloat(formData.get('final_price') as string)
    const discountApplied = parseFloat(formData.get('discount_applied') as string) || 0

    if (!studentId || !planId || !file) {
      return NextResponse.json(
        { error: 'Estudiante, plan y archivo son requeridos' },
        { status: 400 }
      )
    }

    // Verificar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(studentId) || !uuidRegex.test(planId)) {
      return NextResponse.json(
        { error: 'IDs inválidos' },
        { status: 400 }
      )
    }

    // Subir archivo usando service client
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = fileName // Sin el prefijo payment-proofs/

    console.log('Subiendo archivo a Storage:', filePath)

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return NextResponse.json(
        { error: `Error al subir archivo: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath)

    console.log('Archivo subido, URL:', publicUrl)

    // Crear registro en payment_proofs
    const insertData: any = {
      student_id: studentId,
      plan_id: planId,
      original_price: originalPrice,
      final_price: finalPrice,
      discount_applied: discountApplied,
      file_url: publicUrl,
      status: 'pending',
    }

    if (couponId && uuidRegex.test(couponId)) {
      insertData.coupon_id = couponId
    }

    console.log('Creando registro en payment_proofs')

    const { data: newPayment, error: dbError } = await supabase
      .from('payment_proofs')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('Error al crear payment proof:', dbError)
      // Intentar eliminar el archivo subido si falla la inserción
      await supabase.storage.from('payment-proofs').remove([filePath])
      
      return NextResponse.json(
        { error: `Error al crear comprobante: ${dbError.message}. Código: ${dbError.code}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: newPayment }, { status: 200 })
  } catch (error) {
    console.error('Error inesperado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

