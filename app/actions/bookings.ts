'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Booking = {
  id: string
  class_id: string
  student_id: string
  status: 'confirmed' | 'cancelled' | 'completed'
  reminder_24h_sent: boolean
  reminder_2h_sent: boolean
  created_at: string
  updated_at: string
}

export async function createBooking(classId: string, studentId: string) {
  const supabase = await createClient()

  // Verificar que el alumno tenga pago aprobado
  const { data: approvedPayment } = await supabase
    .from('payment_proofs')
    .select('id')
    .eq('student_id', studentId)
    .eq('status', 'approved')
    .single()

  if (!approvedPayment) {
    throw new Error('Debes tener un pago aprobado para reservar clases')
  }

  // Verificar capacidad
  const { data: classData } = await supabase
    .from('classes')
    .select('current_bookings, max_capacity')
    .eq('id', classId)
    .single()

  if (!classData || classData.current_bookings >= classData.max_capacity) {
    throw new Error('La clase está llena')
  }

  // Crear reserva
  const { error: bookingError } = await supabase.from('bookings').insert({
    class_id: classId,
    student_id: studentId,
    status: 'confirmed',
  })

  if (bookingError) {
    throw new Error(bookingError.message)
  }

  // Actualizar contador de reservas
  await supabase.rpc('increment', {
    row_id: classId,
    table_name: 'classes',
    column_name: 'current_bookings',
  })

  revalidatePath('/public/book')
  revalidatePath('/dashboard/students')
  return { success: true }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()

  // Obtener la reserva para saber qué clase actualizar
  const { data: booking } = await supabase
    .from('bookings')
    .select('class_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    throw new Error('Reserva no encontrada')
  }

  // Cancelar la reserva
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) {
    throw new Error(error.message)
  }

  // Decrementar contador de reservas manualmente
  const { data: classData } = await supabase
    .from('classes')
    .select('current_bookings')
    .eq('id', booking.class_id)
    .single()

  if (classData && classData.current_bookings > 0) {
    await supabase
      .from('classes')
      .update({ current_bookings: classData.current_bookings - 1 })
      .eq('id', booking.class_id)
  }

  revalidatePath('/dashboard/students')
  revalidatePath('/public/book')
  return { success: true }
}

export async function deleteBooking(bookingId: string) {
  const supabase = await createClient()

  // Obtener la reserva para saber qué clase eliminar
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('class_id, status')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    throw new Error(bookingError?.message || 'Reserva no encontrada')
  }

  if (!booking.class_id) {
    throw new Error('No se pudo obtener el ID de la clase')
  }

  const classId = booking.class_id

  // Eliminar la clase completa directamente (las reservas se eliminarán automáticamente por CASCADE)
  const { error: deleteError } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)

  if (deleteError) {
    throw new Error(`Error al eliminar la clase: ${deleteError.message}`)
  }

  // Revalidar todas las rutas relacionadas
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/classes')
  revalidatePath('/public/book')
  
  return { success: true }
}

export async function deleteMultipleBookings(bookingIds: string[]) {
  const supabase = await createClient()

  if (bookingIds.length === 0) {
    throw new Error('No se seleccionaron reservas para eliminar')
  }

  // Obtener todas las reservas para saber qué clases eliminar
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, class_id, status')
    .in('id', bookingIds)

  if (bookingsError) {
    throw new Error(`Error al obtener las reservas: ${bookingsError.message}`)
  }

  if (!bookings || bookings.length === 0) {
    throw new Error('No se encontraron las reservas')
  }

  // Obtener los IDs únicos de las clases a eliminar
  const classIdsToDelete = [...new Set(bookings.map(b => b.class_id).filter(Boolean))]

  if (classIdsToDelete.length === 0) {
    throw new Error('No se pudieron obtener los IDs de las clases')
  }

  // Verificar que las clases existen antes de eliminarlas
  const { data: classesExist } = await supabase
    .from('classes')
    .select('id')
    .in('id', classIdsToDelete)

  if (!classesExist || classesExist.length === 0) {
    throw new Error('No se encontraron las clases a eliminar')
  }

  // Eliminar las clases completas (las reservas se eliminarán automáticamente por CASCADE)
  const { error: deleteError } = await supabase
    .from('classes')
    .delete()
    .in('id', classIdsToDelete)

  if (deleteError) {
    throw new Error(`Error al eliminar las clases: ${deleteError.message}`)
  }

  // Verificar que las clases fueron eliminadas
  const { data: classesStillExist } = await supabase
    .from('classes')
    .select('id')
    .in('id', classIdsToDelete)

  if (classesStillExist && classesStillExist.length > 0) {
    throw new Error('Algunas clases no se eliminaron correctamente')
  }

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/classes')
  revalidatePath('/public/book')
  return { success: true, deletedCount: bookings.length }
}

export async function createBookingForStudent(classId: string, studentId: string) {
  // Esta función es similar a createBooking pero sin verificar pago aprobado
  // (para uso del entrenador)
  const supabase = await createClient()

  // Verificar capacidad
  const { data: classData } = await supabase
    .from('classes')
    .select('current_bookings, max_capacity, status')
    .eq('id', classId)
    .single()

  if (!classData) {
    throw new Error('Clase no encontrada')
  }

  if (classData.status !== 'scheduled') {
    throw new Error('Solo se pueden reservar clases programadas')
  }

  if (classData.current_bookings >= classData.max_capacity) {
    throw new Error('La clase está llena')
  }

  // Verificar si ya tiene una reserva en esta clase
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .eq('status', 'confirmed')
    .single()

  if (existing) {
    throw new Error('El alumno ya tiene una reserva en esta clase')
  }

  // Crear reserva
  const { error: bookingError } = await supabase.from('bookings').insert({
    class_id: classId,
    student_id: studentId,
    status: 'confirmed',
  })

  if (bookingError) {
    throw new Error(bookingError.message)
  }

  // Actualizar contador de reservas
  await supabase.rpc('increment', {
    row_id: classId,
    table_name: 'classes',
    column_name: 'current_bookings',
  })

  revalidatePath('/dashboard/students')
  return { success: true }
}

export async function createRecurringBookings(data: {
  studentId: string
  startDate: string
  durationWeeks: number
  durationMinutes: number
  maxCapacity: number
  schedule: Array<{ dayOfWeek: number; time: string }>
}) {
  const supabase = await createClient()
  const { studentId, startDate, durationWeeks, durationMinutes, maxCapacity, schedule } = data

  // Calcular todas las fechas
  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + (durationWeeks * 7))

  const classesToCreate: Array<{
    scheduled_at: string
    duration_minutes: number
    max_capacity: number
    current_bookings: number
    status: string
  }> = []

  // Generar todas las fechas para cada día de la semana seleccionado
  for (let week = 0; week < durationWeeks; week++) {
    for (const scheduleItem of schedule) {
      // Calcular la fecha base de la semana
      const weekStart = new Date(start)
      weekStart.setDate(weekStart.getDate() + (week * 7))

      // Encontrar el día de la semana correspondiente en esa semana
      const currentDayOfWeek = weekStart.getDay()
      let daysToAdd = scheduleItem.dayOfWeek - currentDayOfWeek
      
      // Si el día ya pasó esta semana, ir a la próxima semana
      if (daysToAdd < 0) {
        daysToAdd += 7
      }

      const classDate = new Date(weekStart)
      classDate.setDate(classDate.getDate() + daysToAdd)

      // Combinar fecha y hora
      const [hours, minutes] = scheduleItem.time.split(':')
      classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Solo agregar si la fecha está dentro del rango y no es en el pasado
      if (classDate <= endDate && classDate >= start) {
        classesToCreate.push({
          scheduled_at: classDate.toISOString(),
          duration_minutes: durationMinutes,
          max_capacity: maxCapacity,
          current_bookings: 0,
          status: 'scheduled',
        })
      }
    }
  }

  // Ordenar por fecha
  classesToCreate.sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )

  // Crear todas las clases
  const { data: createdClasses, error: classesError } = await supabase
    .from('classes')
    .insert(classesToCreate)
    .select('id')

  if (classesError) {
    throw new Error(`Error al crear clases: ${classesError.message}`)
  }

  if (!createdClasses || createdClasses.length === 0) {
    throw new Error('No se pudieron crear las clases')
  }

  // Crear las reservas para el estudiante
  const bookingsToCreate = createdClasses.map(classItem => ({
    class_id: classItem.id,
    student_id: studentId,
    status: 'confirmed' as const,
    reminder_24h_sent: false,
    reminder_2h_sent: false,
  }))

  const { error: bookingsError } = await supabase
    .from('bookings')
    .insert(bookingsToCreate)

  if (bookingsError) {
    // Si falla, intentar limpiar las clases creadas
    const classIds = createdClasses.map(c => c.id)
    await supabase.from('classes').delete().in('id', classIds)
    throw new Error(`Error al crear reservas: ${bookingsError.message}`)
  }

  // Actualizar contadores de reservas en las clases
  for (const classItem of createdClasses) {
    await supabase.rpc('increment', {
      row_id: classItem.id,
      table_name: 'classes',
      column_name: 'current_bookings',
    })
  }

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/classes')
  return { 
    success: true, 
    classesCreated: createdClasses.length,
    bookingsCreated: bookingsToCreate.length 
  }
}

