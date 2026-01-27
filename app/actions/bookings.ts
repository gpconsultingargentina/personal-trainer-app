'use server'

import { createClient, createServiceClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { deductCredit } from './credits'
import { getStudentWithFrequency } from './students'

export type Booking = {
  id: string
  class_id: string
  student_id: string
  status: 'confirmed' | 'cancelled' | 'completed'
  reminder_24h_sent: boolean
  reminder_2h_sent: boolean
  cancelled_at: string | null
  cancellation_reason: string | null
  is_late_cancellation: boolean
  created_at: string
  updated_at: string
}

// Mapeo de frecuencia a tolerancia de cancelaciones tardías por mes
const LATE_CANCELLATION_TOLERANCE: Record<string, number> = {
  '3x': 2, // 3 clases/semana = 2 cancelaciones tardías permitidas/mes
  '2x': 1, // 2 clases/semana = 1 cancelación tardía permitida/mes
  '1x': 1, // 1 clase/semana = 1 cancelación tardía permitida/mes
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
  // revalidatePath removed - public pages deprecated
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
  // revalidatePath removed - public pages deprecated
  
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
  // revalidatePath removed - public pages deprecated
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

export async function markAttendance(bookingId: string): Promise<{
  success: boolean
  remainingCredits?: number
  error?: string
}> {
  const supabase = await createClient()

  // Obtener la reserva
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, classes(*)')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return { success: false, error: 'Reserva no encontrada' }
  }

  if (booking.status === 'completed') {
    return { success: false, error: 'La asistencia ya fue marcada' }
  }

  if (booking.status === 'cancelled') {
    return { success: false, error: 'La reserva está cancelada' }
  }

  // Marcar la reserva como completada
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Descontar crédito
  try {
    const result = await deductCredit(booking.student_id, bookingId)
    revalidatePath('/dashboard/classes')
    revalidatePath('/dashboard/students')
    return { success: true, remainingCredits: result.remainingCredits }
  } catch (error) {
    // Si falla el descuento de crédito, revertir el estado
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al descontar crédito',
    }
  }
}

export async function getBookingsWithStudentCredits(classId: string): Promise<
  Array<{
    id: string
    student_id: string
    status: string
    student: {
      id: string
      name: string
      email: string
    }
    credits_remaining: number
  }>
> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      student_id,
      status,
      students(id, name, email)
    `)
    .eq('class_id', classId)

  if (error) {
    throw new Error(error.message)
  }

  // Obtener créditos para cada estudiante
  const result = await Promise.all(
    (bookings || []).map(async (booking) => {
      const { data: credits } = await serviceClient
        .from('credit_balances')
        .select('classes_remaining')
        .eq('student_id', booking.student_id)
        .eq('status', 'active')

      const creditsRemaining =
        credits?.reduce((sum, c) => sum + c.classes_remaining, 0) || 0

      return {
        id: booking.id,
        student_id: booking.student_id,
        status: booking.status,
        student: Array.isArray(booking.students)
          ? booking.students[0]
          : booking.students,
        credits_remaining: creditsRemaining,
      }
    })
  )

  return result
}

export type BookingWithClass = Booking & {
  class: {
    id: string
    scheduled_at: string
    duration_minutes: number
    status: string
  }
}

/**
 * Obtiene el historial de clases/reservas de un estudiante
 * Para uso en el portal del alumno
 */
export async function getStudentBookings(
  studentId: string,
  options?: {
    status?: 'confirmed' | 'cancelled' | 'completed'
    upcoming?: boolean
    limit?: number
    offset?: number
  }
): Promise<BookingWithClass[]> {
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select(`
      id,
      class_id,
      student_id,
      status,
      reminder_24h_sent,
      reminder_2h_sent,
      cancelled_at,
      cancellation_reason,
      is_late_cancellation,
      created_at,
      updated_at,
      classes(id, scheduled_at, duration_minutes, status)
    `)
    .eq('student_id', studentId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.upcoming) {
    query = query.gte('classes.scheduled_at', new Date().toISOString())
  }

  query = query.order('scheduled_at', { referencedTable: 'classes', ascending: options?.upcoming ? true : false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || [])
    .filter(b => b.classes)
    .map(b => {
      // Supabase puede devolver un objeto o array dependiendo de la relación
      const classData = (Array.isArray(b.classes) ? b.classes[0] : b.classes) as {
        id: string
        scheduled_at: string
        duration_minutes: number
        status: string
      }
      return {
        id: b.id,
        class_id: b.class_id,
        student_id: b.student_id,
        status: b.status,
        reminder_24h_sent: b.reminder_24h_sent,
        reminder_2h_sent: b.reminder_2h_sent,
        cancelled_at: b.cancelled_at,
        cancellation_reason: b.cancellation_reason,
        is_late_cancellation: b.is_late_cancellation ?? false,
        created_at: b.created_at,
        updated_at: b.updated_at,
        class: classData,
      }
    })
    .filter(b => b.class) // Filtrar bookings sin clase válida
}

/**
 * Obtiene estadísticas de asistencia de un estudiante
 */
export async function getStudentAttendanceStats(studentId: string): Promise<{
  total: number
  completed: number
  cancelled: number
  upcoming: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      status,
      classes(scheduled_at)
    `)
    .eq('student_id', studentId)

  if (error) {
    throw new Error(error.message)
  }

  const bookings = data || []
  const now = new Date()

  return {
    total: bookings.length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    upcoming: bookings.filter(b => {
      // Supabase puede devolver un objeto o array dependiendo de la relación
      const classData = (Array.isArray(b.classes) ? b.classes[0] : b.classes) as { scheduled_at: string } | null
      return b.status === 'confirmed' && classData && new Date(classData.scheduled_at) > now
    }).length,
  }
}

/**
 * Obtiene la cantidad de cancelaciones tardías del mes actual para un estudiante
 */
export async function getLateCancellationsThisMonth(studentId: string): Promise<number> {
  const supabase = await createClient()

  // Calcular inicio del mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('student_id', studentId)
    .eq('is_late_cancellation', true)
    .gte('cancelled_at', startOfMonth.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  return data?.length || 0
}

/**
 * Obtiene la tolerancia de cancelaciones tardías para un estudiante
 * basada en su frecuencia de clases
 */
export async function getStudentLateCancellationTolerance(studentId: string): Promise<{
  tolerance: number
  used: number
  remaining: number
  frequencyCode: string | null
}> {
  const student = await getStudentWithFrequency(studentId)

  if (!student?.frequency) {
    return { tolerance: 1, used: 0, remaining: 1, frequencyCode: null }
  }

  const frequencyCode = student.frequency.frequency_code
  const tolerance = LATE_CANCELLATION_TOLERANCE[frequencyCode] || 1
  const used = await getLateCancellationsThisMonth(studentId)

  return {
    tolerance,
    used,
    remaining: Math.max(0, tolerance - used),
    frequencyCode,
  }
}

export type CancellationResult = {
  success: boolean
  isLate: boolean
  creditDeducted: boolean
  message: string
  toleranceInfo?: {
    used: number
    remaining: number
    tolerance: number
  }
}

/**
 * Cancela una reserva aplicando la política de cancelaciones:
 * - +24h anticipación: sin penalidad
 * - -24h anticipación: depende de tolerancia mensual
 * - Si excede tolerancia: pierde la clase (descuenta crédito)
 */
export async function cancelBookingWithPolicy(
  bookingId: string,
  reason?: string
): Promise<CancellationResult> {
  const supabase = await createClient()

  // Obtener la reserva con datos de la clase
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(`
      id,
      class_id,
      student_id,
      status,
      classes(id, scheduled_at)
    `)
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return { success: false, isLate: false, creditDeducted: false, message: 'Reserva no encontrada' }
  }

  if (booking.status !== 'confirmed') {
    return { success: false, isLate: false, creditDeducted: false, message: 'La reserva ya no está activa' }
  }

  const classData = (Array.isArray(booking.classes) ? booking.classes[0] : booking.classes) as {
    id: string
    scheduled_at: string
  } | null

  if (!classData) {
    return { success: false, isLate: false, creditDeducted: false, message: 'Clase no encontrada' }
  }

  const now = new Date()
  const scheduledAt = new Date(classData.scheduled_at)
  const hoursUntilClass = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Determinar si es cancelación tardía
  const isLate = hoursUntilClass < 24

  let creditDeducted = false
  let toleranceInfo: CancellationResult['toleranceInfo'] = undefined

  if (isLate) {
    // Verificar tolerancia mensual
    const tolerance = await getStudentLateCancellationTolerance(booking.student_id)
    toleranceInfo = {
      used: tolerance.used,
      remaining: tolerance.remaining,
      tolerance: tolerance.tolerance,
    }

    if (tolerance.remaining <= 0) {
      // Excedió tolerancia: descontar crédito
      try {
        await deductCredit(booking.student_id, bookingId)
        creditDeducted = true
      } catch {
        // Si no hay créditos, continuar con la cancelación
      }
    }
  }

  // Actualizar la reserva
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: now.toISOString(),
      cancellation_reason: reason || null,
      is_late_cancellation: isLate,
    })
    .eq('id', bookingId)

  if (updateError) {
    return { success: false, isLate, creditDeducted: false, message: updateError.message }
  }

  // Decrementar contador de reservas en la clase
  const { data: currentClass } = await supabase
    .from('classes')
    .select('current_bookings')
    .eq('id', booking.class_id)
    .single()

  if (currentClass && currentClass.current_bookings > 0) {
    await supabase
      .from('classes')
      .update({ current_bookings: currentClass.current_bookings - 1 })
      .eq('id', booking.class_id)
  }

  // Si se descontó crédito, registrar transacción
  if (creditDeducted) {
    const serviceClient = await createServiceClient()

    // Obtener el balance activo más antiguo
    const { data: balances } = await serviceClient
      .from('credit_balances')
      .select('id')
      .eq('student_id', booking.student_id)
      .order('expires_at', { ascending: true })
      .limit(1)

    if (balances && balances.length > 0) {
      await serviceClient.from('credit_transactions').insert({
        credit_balance_id: balances[0].id,
        student_id: booking.student_id,
        booking_id: bookingId,
        transaction_type: 'late_cancellation',
        amount: -1,
        balance_after: 0, // Se actualizará con el valor correcto por el deductCredit
        notes: 'Cancelación tardía - excedió tolerancia mensual',
      })
    }
  }

  revalidatePath('/portal/clases')
  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/classes')

  // Construir mensaje
  let message: string
  if (!isLate) {
    message = 'Clase cancelada correctamente'
  } else if (creditDeducted) {
    message = 'Clase cancelada. Se descontó 1 crédito por exceder la tolerancia mensual'
  } else {
    message = `Clase cancelada dentro de tu tolerancia mensual (${toleranceInfo!.used + 1}/${toleranceInfo!.tolerance})`
  }

  return {
    success: true,
    isLate,
    creditDeducted,
    message,
    toleranceInfo,
  }
}

/**
 * Verifica si una reserva puede cancelarse y con qué consecuencias
 * Útil para mostrar información al usuario antes de confirmar
 */
export async function checkCancellationConsequences(bookingId: string): Promise<{
  canCancel: boolean
  isLate: boolean
  willDeductCredit: boolean
  hoursUntilClass: number
  toleranceInfo: {
    used: number
    remaining: number
    tolerance: number
  } | null
  message: string
}> {
  const supabase = await createClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      student_id,
      status,
      classes(scheduled_at)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return {
      canCancel: false,
      isLate: false,
      willDeductCredit: false,
      hoursUntilClass: 0,
      toleranceInfo: null,
      message: 'Reserva no encontrada',
    }
  }

  if (booking.status !== 'confirmed') {
    return {
      canCancel: false,
      isLate: false,
      willDeductCredit: false,
      hoursUntilClass: 0,
      toleranceInfo: null,
      message: 'La reserva ya no está activa',
    }
  }

  const classData = (Array.isArray(booking.classes) ? booking.classes[0] : booking.classes) as {
    scheduled_at: string
  } | null

  if (!classData) {
    return {
      canCancel: false,
      isLate: false,
      willDeductCredit: false,
      hoursUntilClass: 0,
      toleranceInfo: null,
      message: 'Clase no encontrada',
    }
  }

  const now = new Date()
  const scheduledAt = new Date(classData.scheduled_at)
  const hoursUntilClass = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  // No se puede cancelar clases pasadas
  if (hoursUntilClass < 0) {
    return {
      canCancel: false,
      isLate: false,
      willDeductCredit: false,
      hoursUntilClass,
      toleranceInfo: null,
      message: 'No se puede cancelar una clase que ya pasó',
    }
  }

  const isLate = hoursUntilClass < 24

  if (!isLate) {
    return {
      canCancel: true,
      isLate: false,
      willDeductCredit: false,
      hoursUntilClass,
      toleranceInfo: null,
      message: 'Podés cancelar sin penalidad (más de 24h de anticipación)',
    }
  }

  // Verificar tolerancia
  const tolerance = await getStudentLateCancellationTolerance(booking.student_id)
  const willDeductCredit = tolerance.remaining <= 0

  let message: string
  if (willDeductCredit) {
    message = 'Esta cancelación tardía excederá tu tolerancia mensual y se descontará 1 crédito'
  } else {
    message = `Cancelación tardía dentro de tu tolerancia (${tolerance.used}/${tolerance.tolerance} usadas este mes)`
  }

  return {
    canCancel: true,
    isLate: true,
    willDeductCredit,
    hoursUntilClass,
    toleranceInfo: {
      used: tolerance.used,
      remaining: tolerance.remaining,
      tolerance: tolerance.tolerance,
    },
    message,
  }
}

