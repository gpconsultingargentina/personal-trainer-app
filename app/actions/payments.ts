'use server'

import { createClient } from '@/app/lib/supabase/server'
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

