'use server'

import { createClient, createServiceClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PaymentProof = {
  id: string
  student_id: string
  plan_id: string
  coupon_id: string | null
  original_price: number
  final_price: number
  discount_applied: number
  file_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
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
  plan_id: string
  coupon_id?: string | null
  original_price: number
  final_price: number
  discount_applied: number
  file_url: string
}) {
  // Usar service role client para bypass RLS en inserción pública
  const supabase = await createServiceClient()

  const { error, data: insertedData } = await supabase
    .from('payment_proofs')
    .insert({
      student_id: data.student_id,
      plan_id: data.plan_id,
      coupon_id: data.coupon_id || null,
      original_price: data.original_price,
      final_price: data.final_price,
      discount_applied: data.discount_applied,
      file_url: data.file_url,
      status: 'pending',
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

  revalidatePath('/dashboard/payments')
  return { success: true }
}

