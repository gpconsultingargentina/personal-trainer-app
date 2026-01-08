'use server'

import { createClient } from '@/app/lib/supabase/server'

export type Student = {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
}

export async function createOrGetStudent(
  name: string,
  email: string,
  phone?: string
): Promise<Student> {
  const supabase = await createClient()

  // Intentar buscar estudiante existente
  const { data: existing } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) {
    // Actualizar si hay cambios
    const { data: updated } = await supabase
      .from('students')
      .update({ name, phone: phone || null })
      .eq('id', existing.id)
      .select()
      .single()

    return updated || existing
  }

  // Crear nuevo estudiante
  const { data: newStudent, error } = await supabase
    .from('students')
    .insert({ name, email, phone: phone || null })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return newStudent
}

export async function getStudents(): Promise<Student[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getStudent(id: string): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

