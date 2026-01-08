'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Plan = {
  id: string
  name: string
  price: number
  cbu_iban: string
  description: string | null
  duration: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function createPlan(formData: FormData) {
  const supabase = await createClient()

  const plan = {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string),
    cbu_iban: formData.get('cbu_iban') as string,
    description: formData.get('description') as string || null,
    duration: formData.get('duration') as string || null,
    is_active: true,
  }

  const { error } = await supabase.from('class_plans').insert(plan)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/plans')
  redirect('/dashboard/plans')
}

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient()

  const plan = {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string),
    cbu_iban: formData.get('cbu_iban') as string,
    description: formData.get('description') as string || null,
    duration: formData.get('duration') as string || null,
    is_active: formData.get('is_active') === 'true',
  }

  const { error } = await supabase
    .from('class_plans')
    .update(plan)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/plans')
  redirect('/dashboard/plans')
}

export async function deletePlan(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('class_plans').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/plans')
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('class_plans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getPlan(id: string): Promise<Plan | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('class_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getActivePlans(): Promise<Plan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('class_plans')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

