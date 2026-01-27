import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentByAuthUserId } from '@/app/actions/students'
import { getStudentBookings, getStudentAttendanceStats, getStudentLateCancellationTolerance } from '@/app/actions/bookings'
import CancelBookingButton from '@/app/components/cancel-booking-button/CancelBookingButton'
import CalendarButtons from '@/app/components/calendar-buttons/CalendarButtons'

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  completed: 'Asistio',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-error/10 text-error',
}

export default async function ClasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const student = await getStudentByAuthUserId(user.id)

  if (!student) {
    redirect('/login')
  }

  const [upcomingBookings, pastBookings, stats, toleranceInfo] = await Promise.all([
    getStudentBookings(student.id, { upcoming: true, limit: 10 }),
    getStudentBookings(student.id, { limit: 50 }),
    getStudentAttendanceStats(student.id),
    getStudentLateCancellationTolerance(student.id),
  ])

  // Filtrar clases pasadas (no upcoming)
  const now = new Date()
  const historyBookings = pastBookings.filter(
    b => new Date(b.class.scheduled_at) <= now
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Clases</h1>
          <p className="mt-1 text-muted">Proximas clases e historial de asistencias</p>
        </div>
        <CalendarButtons calendarToken={student.calendar_token} />
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Total clases</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Asistencias</p>
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Proximas</p>
          <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Canceladas</p>
          <p className="text-2xl font-bold text-error">{stats.cancelled}</p>
        </div>

        <div className="bg-surface shadow rounded p-4">
          <p className="text-sm text-muted">Tolerancia este mes</p>
          <p className="text-2xl font-bold text-orange-600">
            {toleranceInfo.remaining}/{toleranceInfo.tolerance}
          </p>
          <p className="text-xs text-muted">cancelaciones tardias</p>
        </div>
      </div>

      {/* Proximas clases */}
      <div className="bg-surface shadow rounded">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Proximas Clases</h2>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted">No tienes clases programadas</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {formatDateTime(booking.class.scheduled_at)}
                  </p>
                  <p className="text-sm text-muted">
                    Duracion: {booking.class.duration_minutes} minutos
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {booking.status === 'confirmed' && (
                    <CancelBookingButton bookingId={booking.id} />
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                    {statusLabels[booking.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="bg-surface shadow rounded">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Historial de Asistencias</h2>
        </div>

        {historyBookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted">No hay historial de clases</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {historyBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {formatDateTime(booking.class.scheduled_at)}
                  </p>
                  <p className="text-sm text-muted">
                    Duracion: {booking.class.duration_minutes} minutos
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                  {statusLabels[booking.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
