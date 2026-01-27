'use server'

import { createClient, createServiceClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PaymentProof = {
  id: string
  student_id: string
  plan_id: string | null
  plan_name: string | null
  original_price: number
  final_price: number
  discount_applied: number
  file_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  // Campos para sistema de créditos
  classes_purchased: number | null
  price_per_class: number | null
  frequency_code: string | null
  created_at: string
  updated_at: string
}

export async function getPaymentProofs(status?: string): Promise<PaymentProof[]> {
  const supabase = await createClient()

  let query = supabase
    .from('payment_proofs')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function createPaymentProof(data: {
  student_id: string
  plan_id?: string | null
  plan_name?: string | null
  original_price: number
  final_price: number
  discount_applied: number
  file_url: string
  // Campos para sistema de créditos
  classes_purchased?: number | null
  price_per_class?: number | null
  frequency_code?: string | null
}) {
  // Usar service role client para bypass RLS en inserción pública
  const supabase = await createServiceClient()

  const { error, data: insertedData } = await supabase
    .from('payment_proofs')
    .insert({
      student_id: data.student_id,
      plan_id: data.plan_id || null,
      plan_name: data.plan_name || null,
      original_price: data.original_price,
      final_price: data.final_price,
      discount_applied: data.discount_applied,
      file_url: data.file_url,
      status: 'pending',
      // Campos de créditos
      classes_purchased: data.classes_purchased || null,
      price_per_class: data.price_per_class || null,
      frequency_code: data.frequency_code || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al crear comprobante: ${error.message}`)
  }

  revalidatePath('/dashboard/payments')
  return { success: true, id: insertedData?.id }
}

export async function updatePaymentProofStatus(
  id: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // Obtener el payment proof para ver si tiene datos de créditos
  const { data: paymentProof, error: fetchError } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const { error } = await supabase
    .from('payment_proofs')
    .update({
      status,
      rejection_reason: rejectionReason || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Si se aprueba y tiene datos de créditos, crear el balance
  if (
    status === 'approved' &&
    paymentProof.classes_purchased &&
    paymentProof.price_per_class &&
    paymentProof.frequency_code
  ) {
    // Calcular fecha de expiración (60 días)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    // Crear credit balance
    const { data: balance, error: balanceError } = await serviceClient
      .from('credit_balances')
      .insert({
        student_id: paymentProof.student_id,
        payment_proof_id: id,
        classes_purchased: paymentProof.classes_purchased,
        classes_remaining: paymentProof.classes_purchased,
        price_per_class: paymentProof.price_per_class,
        frequency_code: paymentProof.frequency_code,
        expires_at: expiresAt.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (balanceError) {
      console.error('Error creando balance de créditos:', balanceError)
    } else {
      // Crear transacción de compra
      await serviceClient.from('credit_transactions').insert({
        credit_balance_id: balance.id,
        student_id: paymentProof.student_id,
        transaction_type: 'purchase',
        amount: paymentProof.classes_purchased,
        balance_after: paymentProof.classes_purchased,
        notes: `Compra de ${paymentProof.classes_purchased} clases a $${paymentProof.price_per_class} c/u`,
      })
    }
  }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/students')
  return { success: true }
}

/**
 * Obtiene el historial de pagos de un estudiante
 * Para uso en el portal del alumno
 */
export async function getStudentPayments(
  studentId: string
): Promise<PaymentProof[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

/**
 * Obtiene resumen de pagos para un estudiante
 */
export async function getStudentPaymentSummary(studentId: string): Promise<{
  total: number
  approved: number
  pending: number
  rejected: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payment_proofs')
    .select('status')
    .eq('student_id', studentId)

  if (error) {
    throw new Error(error.message)
  }

  const payments = data || []

  return {
    total: payments.length,
    approved: payments.filter(p => p.status === 'approved').length,
    pending: payments.filter(p => p.status === 'pending').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  }
}

