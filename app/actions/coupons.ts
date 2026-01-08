'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { nanoid } from 'nanoid'

export type Coupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export type CouponPlan = {
  id: string
  coupon_id: string
  plan_id: string | null
}

export async function createCoupon(formData: FormData) {
  const supabase = await createClient()

  const code = formData.get('code') as string || nanoid(8).toUpperCase()
  const discountType = formData.get('discount_type') as 'percentage' | 'fixed'
  const discountValue = parseFloat(formData.get('discount_value') as string)
  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const isActive = formData.get('is_active') === 'true'
  const description = formData.get('description') as string || null

  // Verificar que el código sea único
  const { data: existing } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', code)
    .single()

  if (existing) {
    throw new Error('El código del cupón ya existe')
  }

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      description,
    })
    .select()
    .single()

  if (couponError) {
    throw new Error(couponError.message)
  }

  // Manejar planes aplicables
  const applicableTo = formData.get('applicable_to') as string
  if (applicableTo === 'specific') {
    const planIds = formData.getAll('plan_ids') as string[]
    if (planIds.length > 0) {
      const couponPlans = planIds.map(planId => ({
        coupon_id: coupon.id,
        plan_id: planId,
      }))

      await supabase.from('coupon_plans').insert(couponPlans)
    }
  }

  revalidatePath('/dashboard/coupons')
  redirect('/dashboard/coupons')
}

export async function updateCoupon(id: string, formData: FormData) {
  const supabase = await createClient()

  const code = formData.get('code') as string
  const discountType = formData.get('discount_type') as 'percentage' | 'fixed'
  const discountValue = parseFloat(formData.get('discount_value') as string)
  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const isActive = formData.get('is_active') === 'true'
  const description = formData.get('description') as string || null

  // Verificar que el código sea único (excepto el actual)
  const { data: existing } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', code)
    .neq('id', id)
    .single()

  if (existing) {
    throw new Error('El código del cupón ya existe')
  }

  const { error } = await supabase
    .from('coupons')
    .update({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      description,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Actualizar planes aplicables
  await supabase.from('coupon_plans').delete().eq('coupon_id', id)

  const applicableTo = formData.get('applicable_to') as string
  if (applicableTo === 'specific') {
    const planIds = formData.getAll('plan_ids') as string[]
    if (planIds.length > 0) {
      const couponPlans = planIds.map(planId => ({
        coupon_id: id,
        plan_id: planId,
      }))

      await supabase.from('coupon_plans').insert(couponPlans)
    }
  }

  revalidatePath('/dashboard/coupons')
  redirect('/dashboard/coupons')
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('coupons').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/coupons')
}

export async function getCoupons(): Promise<Coupon[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getCoupon(id: string): Promise<Coupon | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getCouponPlans(couponId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coupon_plans')
    .select('plan_id')
    .eq('coupon_id', couponId)

  if (error) {
    return []
  }

  return data?.map(item => item.plan_id).filter(Boolean) as string[] || []
}

export async function validateCoupon(
  code: string,
  planId?: string
): Promise<{
  valid: boolean
  coupon?: Coupon
  applicablePlans?: string[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !coupon) {
    return { valid: false, error: 'Cupón no encontrado' }
  }

  if (!coupon.is_active) {
    return { valid: false, error: 'Cupón inactivo' }
  }

  const now = new Date()
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    return { valid: false, error: 'Cupón aún no válido' }
  }

  if (coupon.end_date && new Date(coupon.end_date) < now) {
    return { valid: false, error: 'Cupón expirado' }
  }

  // Verificar si aplica a planes específicos
  const { data: couponPlans } = await supabase
    .from('coupon_plans')
    .select('plan_id')
    .eq('coupon_id', coupon.id)

  const applicablePlanIds = couponPlans?.map(cp => cp.plan_id).filter(Boolean) || []

  if (applicablePlanIds.length > 0) {
    if (!planId || !applicablePlanIds.includes(planId)) {
      return { valid: false, error: 'Este cupón no aplica al plan seleccionado' }
    }
  }

  return {
    valid: true,
    coupon,
    applicablePlans: applicablePlanIds,
  }
}

