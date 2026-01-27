'use server'

import { createClient } from '@/app/lib/supabase/server'

// =====================================================
// REPORTES FINANCIEROS
// =====================================================

export type MonthlyRevenue = {
  year: number
  month: number
  totalRevenue: number
  paymentsCount: number
  averagePayment: number
}

/**
 * Obtiene la facturación de un mes específico (pagos aprobados)
 */
export async function getMonthlyRevenue(
  year: number,
  month: number
): Promise<MonthlyRevenue> {
  const supabase = await createClient()

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('payment_proofs')
    .select('final_price')
    .eq('status', 'approved')
    .gte('reviewed_at', startDate.toISOString())
    .lte('reviewed_at', endDate.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  const payments = data || []
  const totalRevenue = payments.reduce((sum, p) => sum + (p.final_price || 0), 0)
  const paymentsCount = payments.length
  const averagePayment = paymentsCount > 0 ? totalRevenue / paymentsCount : 0

  return {
    year,
    month,
    totalRevenue,
    paymentsCount,
    averagePayment,
  }
}

/**
 * Obtiene la comparativa de facturación de los últimos N meses
 */
export async function getMonthlyRevenueComparison(
  months: number = 6
): Promise<MonthlyRevenue[]> {
  const results: MonthlyRevenue[] = []
  const now = new Date()

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const revenue = await getMonthlyRevenue(date.getFullYear(), date.getMonth() + 1)
    results.unshift(revenue) // Agregar al principio para orden cronológico
  }

  return results
}

export type PendingPayment = {
  id: string
  studentName: string
  studentEmail: string
  originalPrice: number
  finalPrice: number
  submittedAt: string
}

/**
 * Obtiene los pagos pendientes de aprobación
 */
export async function getPendingPayments(): Promise<PendingPayment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payment_proofs')
    .select(`
      id,
      original_price,
      final_price,
      submitted_at,
      students(name, email)
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((p) => {
    const student = (Array.isArray(p.students) ? p.students[0] : p.students) as {
      name: string
      email: string
    } | null

    return {
      id: p.id,
      studentName: student?.name || 'Desconocido',
      studentEmail: student?.email || '',
      originalPrice: p.original_price,
      finalPrice: p.final_price,
      submittedAt: p.submitted_at,
    }
  })
}

// =====================================================
// REPORTES DE ALUMNOS
// =====================================================

export type ExpiringCredit = {
  studentId: string
  studentName: string
  studentEmail: string
  creditsRemaining: number
  expiresAt: string
  daysUntilExpiration: number
}

/**
 * Obtiene los créditos que vencen en los próximos N días
 */
export async function getExpiringCredits(days: number = 7): Promise<ExpiringCredit[]> {
  const supabase = await createClient()

  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase
    .from('credit_balances')
    .select(`
      id,
      classes_remaining,
      expires_at,
      students(id, name, email)
    `)
    .eq('status', 'active')
    .gt('classes_remaining', 0)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', futureDate.toISOString())
    .order('expires_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((cb) => {
    const student = (Array.isArray(cb.students) ? cb.students[0] : cb.students) as {
      id: string
      name: string
      email: string
    } | null

    const expiresAt = new Date(cb.expires_at)
    const daysUntilExpiration = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      studentId: student?.id || '',
      studentName: student?.name || 'Desconocido',
      studentEmail: student?.email || '',
      creditsRemaining: cb.classes_remaining,
      expiresAt: cb.expires_at,
      daysUntilExpiration,
    }
  })
}

export type InactiveStudent = {
  id: string
  name: string
  email: string
  lastClassDate: string | null
  daysSinceLastClass: number
}

/**
 * Obtiene alumnos inactivos (sin clases en los últimos N días)
 */
export async function getInactiveStudents(days: number = 30): Promise<InactiveStudent[]> {
  const supabase = await createClient()

  // Obtener todos los estudiantes con su última clase completada
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      email,
      bookings(
        status,
        classes(scheduled_at)
      )
    `)
    .order('name')

  if (studentsError) {
    throw new Error(studentsError.message)
  }

  const now = new Date()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const inactiveStudents: InactiveStudent[] = []

  for (const student of students || []) {
    // Encontrar la fecha de la última clase completada
    let lastClassDate: Date | null = null

    for (const booking of student.bookings || []) {
      if (booking.status === 'completed' && booking.classes) {
        const classData = (Array.isArray(booking.classes) ? booking.classes[0] : booking.classes) as {
          scheduled_at: string
        } | null

        if (classData) {
          const classDate = new Date(classData.scheduled_at)
          if (!lastClassDate || classDate > lastClassDate) {
            lastClassDate = classDate
          }
        }
      }
    }

    // Si no tiene clases o la última fue hace más de N días
    const isInactive = !lastClassDate || lastClassDate < cutoffDate

    if (isInactive) {
      const daysSinceLastClass = lastClassDate
        ? Math.ceil((now.getTime() - lastClassDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999 // Nunca tuvo clases

      inactiveStudents.push({
        id: student.id,
        name: student.name,
        email: student.email,
        lastClassDate: lastClassDate?.toISOString() || null,
        daysSinceLastClass,
      })
    }
  }

  // Ordenar por días de inactividad (mayor primero)
  return inactiveStudents.sort((a, b) => b.daysSinceLastClass - a.daysSinceLastClass)
}

export type AttendanceRanking = {
  studentId: string
  studentName: string
  totalCompleted: number
  totalCancelled: number
  attendanceRate: number
}

/**
 * Obtiene el ranking de asistencia de alumnos
 */
export async function getAttendanceRanking(limit: number = 10): Promise<AttendanceRanking[]> {
  const supabase = await createClient()

  const { data: students, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      bookings(status)
    `)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  const rankings: AttendanceRanking[] = (students || [])
    .map((student) => {
      const bookings = student.bookings || []
      const totalCompleted = bookings.filter((b) => b.status === 'completed').length
      const totalCancelled = bookings.filter((b) => b.status === 'cancelled').length
      const total = totalCompleted + totalCancelled

      return {
        studentId: student.id,
        studentName: student.name,
        totalCompleted,
        totalCancelled,
        attendanceRate: total > 0 ? (totalCompleted / total) * 100 : 0,
      }
    })
    .filter((r) => r.totalCompleted + r.totalCancelled > 0) // Solo con historial
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, limit)

  return rankings
}

// =====================================================
// REPORTES OPERATIVOS
// =====================================================

export type WeeklyClass = {
  id: string
  scheduledAt: string
  durationMinutes: number
  maxCapacity: number
  currentBookings: number
  students: Array<{
    id: string
    name: string
    status: string
  }>
}

/**
 * Obtiene la agenda de la semana
 */
export async function getWeeklySchedule(): Promise<WeeklyClass[]> {
  const supabase = await createClient()

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Domingo
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      max_capacity,
      current_bookings,
      bookings(
        status,
        students(id, name)
      )
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_at', startOfWeek.toISOString())
    .lt('scheduled_at', endOfWeek.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((c) => ({
    id: c.id,
    scheduledAt: c.scheduled_at,
    durationMinutes: c.duration_minutes,
    maxCapacity: c.max_capacity,
    currentBookings: c.current_bookings,
    students: (c.bookings || [])
      .filter((b) => b.status === 'confirmed' && b.students)
      .map((b) => {
        const student = (Array.isArray(b.students) ? b.students[0] : b.students) as {
          id: string
          name: string
        }
        return {
          id: student.id,
          name: student.name,
          status: b.status,
        }
      }),
  }))
}

export type OccupancyRate = {
  year: number
  month: number
  totalClasses: number
  totalCapacity: number
  totalBookings: number
  occupancyRate: number
}

/**
 * Obtiene la tasa de ocupación de un mes
 */
export async function getOccupancyRate(year: number, month: number): Promise<OccupancyRate> {
  const supabase = await createClient()

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('classes')
    .select('max_capacity, current_bookings')
    .gte('scheduled_at', startDate.toISOString())
    .lte('scheduled_at', endDate.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  const classes = data || []
  const totalClasses = classes.length
  const totalCapacity = classes.reduce((sum, c) => sum + c.max_capacity, 0)
  const totalBookings = classes.reduce((sum, c) => sum + c.current_bookings, 0)
  const occupancyRate = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0

  return {
    year,
    month,
    totalClasses,
    totalCapacity,
    totalBookings,
    occupancyRate,
  }
}

export type CancellationStats = {
  totalCancellations: number
  lateCancellations: number
  onTimeCancellations: number
  lateCancellationRate: number
}

/**
 * Obtiene estadísticas de cancelaciones del mes actual
 */
export async function getCancellationStats(): Promise<CancellationStats> {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from('bookings')
    .select('is_late_cancellation')
    .eq('status', 'cancelled')
    .gte('cancelled_at', startOfMonth.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  const cancellations = data || []
  const totalCancellations = cancellations.length
  const lateCancellations = cancellations.filter((c) => c.is_late_cancellation).length
  const onTimeCancellations = totalCancellations - lateCancellations
  const lateCancellationRate =
    totalCancellations > 0 ? (lateCancellations / totalCancellations) * 100 : 0

  return {
    totalCancellations,
    lateCancellations,
    onTimeCancellations,
    lateCancellationRate,
  }
}

// =====================================================
// RESUMEN GENERAL
// =====================================================

export type DashboardSummary = {
  pendingPaymentsCount: number
  pendingPaymentsAmount: number
  expiringCreditsCount: number
  inactiveStudentsCount: number
  weeklyClassesCount: number
  currentMonthRevenue: number
  cancellationRate: number
}

/**
 * Obtiene un resumen general para el dashboard
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()
  const now = new Date()

  // Pagos pendientes
  const { data: pendingPayments } = await supabase
    .from('payment_proofs')
    .select('final_price')
    .eq('status', 'pending')

  const pendingPaymentsCount = pendingPayments?.length || 0
  const pendingPaymentsAmount = (pendingPayments || []).reduce(
    (sum, p) => sum + (p.final_price || 0),
    0
  )

  // Créditos por vencer (7 días)
  const expiringCredits = await getExpiringCredits(7)
  const expiringCreditsCount = expiringCredits.length

  // Alumnos inactivos (30 días)
  const inactiveStudents = await getInactiveStudents(30)
  const inactiveStudentsCount = inactiveStudents.length

  // Clases de la semana
  const weeklySchedule = await getWeeklySchedule()
  const weeklyClassesCount = weeklySchedule.length

  // Facturación del mes
  const monthlyRevenue = await getMonthlyRevenue(now.getFullYear(), now.getMonth() + 1)
  const currentMonthRevenue = monthlyRevenue.totalRevenue

  // Tasa de cancelaciones
  const cancellationStats = await getCancellationStats()
  const cancellationRate = cancellationStats.lateCancellationRate

  return {
    pendingPaymentsCount,
    pendingPaymentsAmount,
    expiringCreditsCount,
    inactiveStudentsCount,
    weeklyClassesCount,
    currentMonthRevenue,
    cancellationRate,
  }
}
