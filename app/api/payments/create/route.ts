import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { student_id, plan_id, coupon_id, original_price, final_price, discount_applied, file_url } = body

    if (!student_id || !plan_id || !file_url) {
      return NextResponse.json(
        { error: 'Estudiante, plan y archivo son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el student_id y plan_id sean UUIDs válidos
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(student_id)) {
      return NextResponse.json(
        { error: 'ID de estudiante inválido' },
        { status: 400 }
      )
    }
    if (!uuidRegex.test(plan_id)) {
      return NextResponse.json(
        { error: 'ID de plan inválido' },
        { status: 400 }
      )
    }

    const insertData: any = {
      student_id,
      plan_id,
      original_price: parseFloat(original_price),
      final_price: parseFloat(final_price),
      discount_applied: parseFloat(discount_applied) || 0,
      file_url,
      status: 'pending',
    }

    if (coupon_id && uuidRegex.test(coupon_id)) {
      insertData.coupon_id = coupon_id
    }

    console.log('API: Intentando insertar payment proof con service client:', {
      student_id,
      plan_id,
      has_coupon: !!coupon_id,
    })

    const { data: newPayment, error } = await supabase
      .from('payment_proofs')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('API: Error completo al crear payment proof:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json(
        { error: `Error al crear comprobante: ${error.message}. Código: ${error.code}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: newPayment }, { status: 200 })
  } catch (error) {
    console.error('API: Error inesperado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

