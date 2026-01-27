'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/app/lib/email'

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

  // Enviar email de bienvenida si es un estudiante nuevo
  if (newStudent && newStudent.email) {
    try {
      await sendWelcomeEmail(newStudent.email, newStudent.name)
    } catch (emailError) {
      // No fallar la creación del estudiante si el email falla
      console.error('Error enviando email de bienvenida:', emailError)
    }
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

export async function createStudent(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  // Verificar si el estudiante ya existe
  const { data: existing } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .single()

  let student
  let isNewStudent = false

  if (existing) {
    // Actualizar estudiante existente
    const { data: updated, error: updateError } = await supabase
      .from('students')
      .update({ name, phone: phone || null })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    student = updated || existing
  } else {
    // Crear nuevo estudiante
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert({
        name,
        email,
        phone: phone || null,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    student = newStudent
    isNewStudent = true
  }

  // Enviar email de bienvenida solo si es un estudiante nuevo
  if (isNewStudent && student && student.email) {
    try {
      await sendWelcomeEmail(student.email, student.name)
    } catch (emailError) {
      // No fallar la creación del estudiante si el email falla
      console.error('Error enviando email de bienvenida:', emailError)
    }
  }

  revalidatePath('/dashboard/students')
  redirect('/dashboard/students')
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('students').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/students')
}

export async function deleteStudents(ids: string[]) {
  const supabase = await createClient()

  if (ids.length === 0) {
    throw new Error('No se seleccionaron estudiantes para eliminar')
  }

  const { error } = await supabase.from('students').delete().in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/students')
  return { success: true, deletedCount: ids.length }
}

