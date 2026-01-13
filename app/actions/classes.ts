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

