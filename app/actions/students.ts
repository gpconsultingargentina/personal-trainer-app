'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/app/lib/email'

export type UsualScheduleItem = {
  dayOfWeek: number // 0-6 (domingo-sábado)
  time: string // HH:mm
}

export type Student = {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  phone: string | null
  frequency_id: string | null
  usual_schedule: UsualScheduleItem[]
  calendar_token: string | null
  created_at: string
  updated_at: string
}

export type StudentWithFrequency = Student & {
  auth_user_id: string | null
  frequency?: {
    id: string
    frequency_code: string
    classes_per_week: number
    price_per_class: number
    description: string | null
  } | null
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

  return (data || []).map((s) => ({
    ...s,
    usual_schedule: s.usual_schedule || [],
  }))
}

export async function getStudentsWithFrequency(): Promise<StudentWithFrequency[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      frequency:frequency_prices(
        id,
        frequency_code,
        classes_per_week,
        price_per_class,
        description
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((s) => ({
    ...s,
    usual_schedule: s.usual_schedule || [],
  }))
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

  return {
    ...data,
    usual_schedule: data.usual_schedule || [],
  }
}

export async function getStudentWithFrequency(
  id: string
): Promise<StudentWithFrequency | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      frequency:frequency_prices(
        id,
        frequency_code,
        classes_per_week,
        price_per_class,
        description
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return {
    ...data,
    usual_schedule: data.usual_schedule || [],
  }
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const frequencyId = formData.get('frequency_id') as string | null
  const usualScheduleRaw = formData.get('usual_schedule') as string | null

  let usualSchedule: UsualScheduleItem[] = []
  if (usualScheduleRaw) {
    try {
      usualSchedule = JSON.parse(usualScheduleRaw)
    } catch {
      usualSchedule = []
    }
  }

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
      .update({
        name,
        phone: phone || null,
        frequency_id: frequencyId || null,
        usual_schedule: usualSchedule,
      })
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
        frequency_id: frequencyId || null,
        usual_schedule: usualSchedule,
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

export async function updateStudent(
  id: string,
  data: {
    name?: string
    phone?: string | null
    frequency_id?: string | null
    usual_schedule?: UsualScheduleItem[]
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students')
    .update({
      ...(data.name && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.frequency_id !== undefined && { frequency_id: data.frequency_id }),
      ...(data.usual_schedule !== undefined && { usual_schedule: data.usual_schedule }),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/students')
  return { success: true }
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

/**
 * Obtiene un estudiante por su auth_user_id
 */
export async function getStudentByAuthUserId(
  authUserId: string
): Promise<StudentWithFrequency | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      frequency:frequency_prices(
        id,
        frequency_code,
        classes_per_week,
        price_per_class,
        description
      )
    `)
    .eq('auth_user_id', authUserId)
    .single()

  if (error) {
    return null
  }

  return {
    ...data,
    usual_schedule: data.usual_schedule || [],
  }
}

export type StudentPortalData = {
  student: StudentWithFrequency
  credits: {
    available: number
    expiringSoon: number
    nextExpirationDate: string | null
  }
  upcomingClasses: Array<{
    id: string
    booking_id: string
    scheduled_at: string
    status: string
  }>
}

/**
 * Obtiene los datos del portal para un alumno
 * Incluye créditos y próximas clases
 */
export async function getStudentForPortal(
  authUserId: string
): Promise<StudentPortalData | null> {
  const supabase = await createClient()

  // Obtener estudiante
  const student = await getStudentByAuthUserId(authUserId)

  if (!student) {
    return null
  }

  // Obtener créditos activos
  const { data: creditBalances } = await supabase
    .from('credit_balances')
    .select('classes_remaining, expires_at')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .order('expires_at', { ascending: true })

  const balances = creditBalances || []
  const available = balances.reduce((sum, cb) => sum + cb.classes_remaining, 0)

  // Créditos que vencen en 7 días
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const expiringSoon = balances
    .filter((cb) => new Date(cb.expires_at) <= sevenDaysFromNow)
    .reduce((sum, cb) => sum + cb.classes_remaining, 0)

  const nextExpirationDate = balances.length > 0 ? balances[0].expires_at : null

  // Obtener próximas clases
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      classes(id, scheduled_at, status)
    `)
    .eq('student_id', student.id)
    .eq('status', 'confirmed')
    .gte('classes.scheduled_at', new Date().toISOString())
    .order('scheduled_at', { referencedTable: 'classes', ascending: true })
    .limit(5)

  const upcomingClasses = (bookings || [])
    .filter(b => b.classes)
    .map(b => {
      // Supabase puede devolver un objeto o array
      const classData = (Array.isArray(b.classes) ? b.classes[0] : b.classes) as {
        id: string
        scheduled_at: string
        status: string
      }
      return {
        id: classData.id,
        booking_id: b.id,
        scheduled_at: classData.scheduled_at,
        status: b.status,
      }
    })
    .filter(b => b.id) // Filtrar si no hay clase válida

  return {
    student,
    credits: {
      available,
      expiringSoon,
      nextExpirationDate,
    },
    upcomingClasses,
  }
}

