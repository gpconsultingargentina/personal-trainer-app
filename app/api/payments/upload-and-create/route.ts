import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const supabase = await createServiceClient()
    const file = formData.get('file') as File
    const studentId = formData.get('student_id') as string
    const planId = formData.get('plan_id') as string || null
    const couponId = (formData.get('coupon_id') as string) || null
    const originalPrice = parseFloat(formData.get('original_price') as string)
    const finalPrice = parseFloat(formData.get('final_price') as string)
    const discountApplied = parseFloat(formData.get('discount_applied') as string) || 0

    // Nuevos campos para sistema de creditos
    const classesPurchasedRaw = formData.get('classes_purchased') as string
    const pricePerClassRaw = formData.get('price_per_class') as string
    const frequencyCode = formData.get('frequency_code') as string || null

    const classesPurchased = classesPurchasedRaw
      ? parseInt(classesPurchasedRaw)
      : null
    const pricePerClass = pricePerClassRaw
      ? parseFloat(pricePerClassRaw)
      : null

    // Modo creditos: no requiere planId
    const isCreditMode = classesPurchased && pricePerClass && frequencyCode

    if (!studentId || !file) {
      return NextResponse.json(
        { error: 'Estudiante y archivo son requeridos' },
        { status: 400 }
      )
    }

    // En modo legacy, plan es requerido
    if (!isCreditMode && !planId) {
      return NextResponse.json(
        { error: 'Plan es requerido para pagos sin creditos' },
        { status: 400 }
      )
    }

    // Verificar UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(studentId)) {
      return NextResponse.json({ error: 'ID de estudiante invalido' }, { status: 400 })
    }
    if (planId && !uuidRegex.test(planId)) {
      return NextResponse.json({ error: 'ID de plan invalido' }, { status: 400 })
    }

    let planName: string | null = null

    // Obtener el nombre del plan solo si hay planId (modo legacy)
    if (planId) {
      const { data: plan, error: planError } = await supabase
        .from('class_plans')
        .select('name')
        .eq('id', planId)
        .single()

      if (planError || !plan) {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
      }

      planName = plan.name
    } else if (isCreditMode) {
      planName = `${classesPurchased} clases (${frequencyCode})`
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
    const insertData: Record<string, unknown> = {
      student_id: studentId,
      plan_name: planName,
      original_price: originalPrice,
      final_price: finalPrice,
      discount_applied: discountApplied,
      file_url: publicUrl,
      status: 'pending',
    }

    // Campos opcionales
    if (planId) {
      insertData.plan_id = planId
    }

    if (couponId && uuidRegex.test(couponId)) {
      insertData.coupon_id = couponId
    }

    // Campos de creditos
    if (classesPurchased) {
      insertData.classes_purchased = classesPurchased
    }
    if (pricePerClass) {
      insertData.price_per_class = pricePerClass
    }
    if (frequencyCode) {
      insertData.frequency_code = frequencyCode
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

