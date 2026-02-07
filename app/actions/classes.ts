'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Class = {
  id: string
  scheduled_at: string
  duration_minutes: number
  max_capacity: number
  current_bookings: number
  status: 'scheduled' | 'completed' | 'cancelled'
  description: string | null
  created_at: string
  updated_at: string
  students?: Array<{
    id: string
    name: string
  }>
}

export async function createClass(formData: FormData) {
  const supabase = await createClient()

  const scheduledAt = formData.get('scheduled_at') as string
  const durationMinutes = parseInt(formData.get('duration_minutes') as string) || 60
  const maxCapacity = parseInt(formData.get('max_capacity') as string) || 1
  const description = formData.get('description') as string || null

  const { error } = await supabase.from('classes').insert({
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes,
    max_capacity: maxCapacity,
    current_bookings: 0,
    status: 'scheduled',
    description,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/classes')
  redirect('/dashboard/classes')
}

export async function updateClass(id: string, formData: FormData) {
  const supabase = await createClient()

  const scheduledAt = formData.get('scheduled_at') as string
  const durationMinutes = parseInt(formData.get('duration_minutes') as string) || 60
  const maxCapacity = parseInt(formData.get('max_capacity') as string) || 1
  const status = formData.get('status') as 'scheduled' | 'completed' | 'cancelled'
  const description = formData.get('description') as string || null

  const { error } = await supabase
    .from('classes')
    .update({
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      max_capacity: maxCapacity,
      status,
      description,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Actualizar el estado de las reservas asociadas según el estado de la clase
  let bookingStatus: 'confirmed' | 'completed' | 'cancelled' = 'confirmed'
  if (status === 'completed') {
    bookingStatus = 'completed'
  } else if (status === 'cancelled') {
    bookingStatus = 'cancelled'
  } else if (status === 'scheduled') {
    bookingStatus = 'confirmed'
  }

  // Actualizar todas las reservas de esta clase
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: bookingStatus })
    .eq('class_id', id)

  if (bookingError) {
    // No lanzamos error aquí para no interrumpir la actualización de la clase
    console.error('Error al actualizar el estado de las reservas:', bookingError)
  }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/students')
  redirect('/dashboard/classes')
}

export async function deleteClass(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('classes').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/classes')
}

export async function deleteMultipleClasses(classIds: string[]) {
  const supabase = await createClient()

  if (classIds.length === 0) {
    throw new Error('No se seleccionaron clases para eliminar')
  }

  // Eliminar las clases (las reservas se eliminarán automáticamente por CASCADE)
  const { error } = await supabase
    .from('classes')
    .delete()
    .in('id', classIds)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/students')
  return { success: true, deletedCount: classIds.length }
}

export async function getClasses(): Promise<Class[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      bookings(
        status,
        student:students(
          id,
          name
        )
      )
    `)
    .order('scheduled_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  // Transformar los datos para incluir los estudiantes en un formato más simple
  return (data || []).map((classItem: any) => {
    // Filtrar solo las reservas confirmadas y obtener los estudiantes
    const confirmedBookings = classItem.bookings?.filter((booking: any) => 
      booking && booking.status === 'confirmed' && booking.student !== null
    ) || []
    
    const students = confirmedBookings.map((booking: any) => ({
      id: booking.student.id,
      name: booking.student.name
    }))
    
    // Eliminar bookings del objeto y agregar students
    const { bookings, ...classData } = classItem
    return {
      ...classData,
      students
    }
  })
}

export async function getClass(id: string): Promise<Class | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getAvailableClasses(): Promise<Class[]> {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function createClassAndBookForStudent(studentId: string, formData: FormData) {
  const supabase = await createClient()

  const scheduledAt = formData.get('scheduled_at') as string
  const durationMinutes = parseInt(formData.get('duration_minutes') as string) || 60
  const maxCapacity = parseInt(formData.get('max_capacity') as string) || 1
  const description = formData.get('description') as string || null

  // Crear la clase
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .insert({
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      max_capacity: maxCapacity,
      current_bookings: 1,
      status: 'scheduled',
      description,
    })
    .select()
    .single()

  if (classError) {
    throw new Error(classError.message)
  }

  // Crear la reserva para el estudiante
  const { error: bookingError } = await supabase
    .from('bookings')
    .insert({
      class_id: classData.id,
      student_id: studentId,
      status: 'confirmed',
    })

  if (bookingError) {
    throw new Error(bookingError.message)
  }

  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/students/${studentId}`)
}

export async function createRecurringClassesForStudent(
  studentId: string,
  formData: FormData
): Promise<{ created: number; errors: number }> {
  const supabase = await createClient()

  const startDate = formData.get('start_date') as string
  const daysWithTimes = JSON.parse(formData.get('days_with_times') as string) as Array<{
    day: number
    hour: number
    minute: number
  }>
  const repeatWeeks = formData.get('repeat_weeks') as string
  const durationMinutes = parseInt(formData.get('duration_minutes') as string) || 60
  const maxCapacity = parseInt(formData.get('max_capacity') as string) || 1
  const description = formData.get('description') as string || null

  const weeks = repeatWeeks === 'unlimited' ? 52 : parseInt(repeatWeeks)
  let created = 0
  let errors = 0

  const start = new Date(startDate)

  for (let week = 0; week < weeks; week++) {
    for (const dayTime of daysWithTimes) {
      // Calcular la fecha para este día de la semana
      const classDate = new Date(start)
      classDate.setDate(start.getDate() + week * 7)

      // Ajustar al día correcto de la semana
      const currentDay = classDate.getDay()
      const targetDay = dayTime.day
      const daysToAdd = (targetDay - currentDay + 7) % 7
      classDate.setDate(classDate.getDate() + daysToAdd)

      // Si la fecha calculada es anterior a la fecha de inicio, saltar a la siguiente semana
      if (classDate < start) {
        classDate.setDate(classDate.getDate() + 7)
      }

      // Establecer la hora
      classDate.setHours(dayTime.hour, dayTime.minute, 0, 0)

      try {
        // Construir el datetime string sin conversión UTC
        // Esto preserva la hora exacta que el entrenador especifica
        const year = classDate.getFullYear()
        const month = String(classDate.getMonth() + 1).padStart(2, '0')
        const day = String(classDate.getDate()).padStart(2, '0')
        const hrs = String(classDate.getHours()).padStart(2, '0')
        const mins = String(classDate.getMinutes()).padStart(2, '0')
        
        // Crear la clase
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .insert({
            scheduled_at: `${year}-${month}-${day}T${hrs}:${mins}:00`,
            duration_minutes: durationMinutes,
            max_capacity: maxCapacity,
            current_bookings: 1,
            status: 'scheduled',
            description,
          })
          .select()
          .single()

        if (classError) {
          errors++
          continue
        }

        // Crear la reserva
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            class_id: classData.id,
            student_id: studentId,
            status: 'confirmed',
          })

        if (bookingError) {
          errors++
        } else {
          created++
        }
      } catch {
        errors++
      }
    }
  }

  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/students/${studentId}`)

  return { created, errors }
}

