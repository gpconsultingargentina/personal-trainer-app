import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const {
      student_id,
      plan_id,
      original_price,
      final_price,
      discount_applied,
      file_url,
      classes_purchased,
      price_per_class,
      frequency_code,
    } = body

    // Modo creditos: no requiere plan_id
    const isCreditMode = classes_purchased && price_per_class && frequency_code

    if (!student_id || !file_url) {
      return NextResponse.json(
        { error: 'Estudiante y archivo son requeridos' },
        { status: 400 }
      )
    }

    // En modo legacy, plan es requerido
    if (!isCreditMode && !plan_id) {
      return NextResponse.json(
        { error: 'Plan es requerido para pagos sin creditos' },
        { status: 400 }
      )
    }

    // Verificar que el student_id sea UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(student_id)) {
      return NextResponse.json(
        { error: 'ID de estudiante inválido' },
        { status: 400 }
      )
    }
    if (plan_id && !uuidRegex.test(plan_id)) {
      return NextResponse.json(
        { error: 'ID de plan inválido' },
        { status: 400 }
      )
    }

    // Generar plan_name para modo creditos
    let planName: string | null = null
    if (isCreditMode) {
      planName = `${classes_purchased} clases (${frequency_code})`
    }

    const insertData: Record<string, unknown> = {
      student_id,
      original_price: parseFloat(original_price),
      final_price: parseFloat(final_price),
      discount_applied: parseFloat(discount_applied) || 0,
      file_url,
      status: 'pending',
    }

    // Campos opcionales segun modo
    if (plan_id) {
      insertData.plan_id = plan_id
    }
    if (planName) {
      insertData.plan_name = planName
    }
    if (classes_purchased) {
      insertData.classes_purchased = classes_purchased
    }
    if (price_per_class) {
      insertData.price_per_class = price_per_class
    }
    if (frequency_code) {
      insertData.frequency_code = frequency_code
    }

    console.log('API: Intentando insertar payment proof:', {
      student_id,
      isCreditMode,
      classes_purchased,
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

