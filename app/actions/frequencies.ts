'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type FrequencyPrice = {
  id: string
  frequency_code: string
  classes_per_week: number
  price_per_class: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getFrequencies(): Promise<FrequencyPrice[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('frequency_prices')
    .select('*')
    .order('classes_per_week', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getActiveFrequencies(): Promise<FrequencyPrice[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('frequency_prices')
    .select('*')
    .eq('is_active', true)
    .order('classes_per_week', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getFrequency(id: string): Promise<FrequencyPrice | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('frequency_prices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getFrequencyByCode(code: string): Promise<FrequencyPrice | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('frequency_prices')
    .select('*')
    .eq('frequency_code', code)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function updateFrequencyPrice(
  id: string,
  pricePerClass: number
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('frequency_prices')
    .update({ price_per_class: pricePerClass })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/plans')
  return { success: true }
}

export async function toggleFrequencyActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('frequency_prices')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/plans')
  return { success: true }
}
