import {
  getDashboardSummary,
  getMonthlyRevenueComparison,
  getPendingPayments,
  getExpiringCredits,
  getInactiveStudents,
  getAttendanceRanking,
  getWeeklySchedule,
  getOccupancyRate,
  getCancellationStats,
} from '@/app/actions/reports'
import Link from 'next/link'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const monthNames = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

export default async function ReportsPage() {
  const now = new Date()

  const [
    summary,
    revenueComparison,
    pendingPayments,
    expiringCredits,
    inactiveStudents,
    attendanceRanking,
    weeklySchedule,
    occupancyRate,
    cancellationStats,
  ] = await Promise.all([
    getDashboardSummary(),
    getMonthlyRevenueComparison(6),
    getPendingPayments(),
    getExpiringCredits(7),
    getInactiveStudents(30),
    getAttendanceRanking(5),
    getWeeklySchedule(),
    getOccupancyRate(now.getFullYear(), now.getMonth() + 1),
    getCancellationStats(),
  ])

  const maxRevenue = Math.max(...revenueComparison.map((r) => r.totalRevenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="mt-1 text-muted">Resumen financiero, de alumnos y operativo</p>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Facturacion mes</p>
          <p className="text-xl font-bold text-success">{formatCurrency(summary.currentMonthRevenue)}</p>
        </div>
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Pagos pendientes</p>
          <p className="text-xl font-bold text-primary">{summary.pendingPaymentsCount}</p>
          <p className="text-xs text-muted">{formatCurrency(summary.pendingPaymentsAmount)}</p>
        </div>
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Creditos x vencer</p>
          <p className="text-xl font-bold text-primary">{summary.expiringCreditsCount}</p>
          <p className="text-xs text-muted">proximos 7 dias</p>
        </div>
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Alumnos inactivos</p>
          <p className="text-xl font-bold text-error">{summary.inactiveStudentsCount}</p>
          <p className="text-xs text-muted">+30 dias sin clase</p>
        </div>
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Clases semana</p>
          <p className="text-xl font-bold text-primary">{summary.weeklyClassesCount}</p>
        </div>
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Ocupacion mes</p>
          <p className="text-xl font-bold text-primary">{occupancyRate.occupancyRate.toFixed(0)}%</p>
        </div>
        <div className="bg-surface shadow rounded p-4">
          <p className="text-xs text-muted">Cancel. tardias</p>
          <p className="text-xl font-bold text-primary">{cancellationStats.lateCancellations}</p>
          <p className="text-xs text-muted">{cancellationStats.lateCancellationRate.toFixed(0)}% del total</p>
        </div>
      </div>

      {/* Grid de 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Financiero */}
        <div className="space-y-6">
          {/* Comparativa mensual */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Facturacion (6 meses)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {revenueComparison.map((r) => (
                  <div key={`${r.year}-${r.month}`} className="flex items-center gap-3">
                    <span className="text-sm text-muted w-16">
                      {monthNames[r.month - 1]} {r.year % 100}
                    </span>
                    <div className="flex-1 bg-background rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-success h-full rounded-full"
                        style={{ width: `${(r.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-24 text-right">
                      {formatCurrency(r.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagos pendientes */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Pagos Pendientes</h2>
            </div>
            {pendingPayments.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted">No hay pagos pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingPayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="px-6 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.studentName}</p>
                      <p className="text-xs text-muted">{formatDate(p.submittedAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(p.finalPrice)}
                    </span>
                  </div>
                ))}
                {pendingPayments.length > 5 && (
                  <div className="px-6 py-3">
                    <Link href="/dashboard/payments" className="text-sm text-primary hover:text-accent">
                      Ver todos ({pendingPayments.length})
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna 2: Alumnos */}
        <div className="space-y-6">
          {/* Créditos por vencer */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Creditos por Vencer (7 dias)</h2>
            </div>
            {expiringCredits.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted">No hay creditos por vencer</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {expiringCredits.slice(0, 5).map((c) => (
                  <div key={c.studentId} className="px-6 py-3 flex justify-between items-center">
                    <div>
                      <Link
                        href={`/dashboard/students/${c.studentId}`}
                        className="text-sm font-medium text-foreground hover:text-primary"
                      >
                        {c.studentName}
                      </Link>
                      <p className="text-xs text-muted">{c.creditsRemaining} creditos</p>
                    </div>
                    <span className={`text-sm font-medium ${
                      c.daysUntilExpiration <= 3 ? 'text-error' : 'text-primary'
                    }`}>
                      {c.daysUntilExpiration} dias
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alumnos inactivos */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Alumnos Inactivos (+30 dias)</h2>
            </div>
            {inactiveStudents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted">Todos los alumnos estan activos</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {inactiveStudents.slice(0, 5).map((s) => (
                  <div key={s.id} className="px-6 py-3 flex justify-between items-center">
                    <div>
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="text-sm font-medium text-foreground hover:text-primary"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-muted">
                        {s.lastClassDate ? `Ultima: ${formatDate(s.lastClassDate)}` : 'Sin clases'}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-error">
                      {s.daysSinceLastClass === 999 ? 'Nunca' : `${s.daysSinceLastClass}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking de asistencia */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Top Asistencia</h2>
            </div>
            {attendanceRanking.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted">No hay datos de asistencia</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {attendanceRanking.map((r, index) => (
                  <div key={r.studentId} className="px-6 py-3 flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-primary' : index === 1 ? 'text-muted' : index === 2 ? 'text-primary' : 'text-muted'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{r.studentName}</p>
                      <p className="text-xs text-muted">
                        {r.totalCompleted} asistencias, {r.totalCancelled} canceladas
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-success">
                      {r.attendanceRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna 3: Operativo */}
        <div className="space-y-6">
          {/* Agenda de la semana */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Agenda de la Semana</h2>
            </div>
            {weeklySchedule.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted">No hay clases esta semana</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {weeklySchedule.map((c) => (
                  <div key={c.id} className="px-6 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatDateTime(c.scheduledAt)}
                        </p>
                        <p className="text-xs text-muted">
                          {c.durationMinutes} min | {c.currentBookings}/{c.maxCapacity} reservas
                        </p>
                      </div>
                    </div>
                    {c.students.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.students.map((s) => (
                          <Link
                            key={s.id}
                            href={`/dashboard/students/${s.id}`}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estadísticas de cancelaciones */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Cancelaciones del Mes</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-foreground">{cancellationStats.totalCancellations}</p>
                  <p className="text-sm text-muted">Total</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{cancellationStats.lateCancellations}</p>
                  <p className="text-sm text-muted">Tardias (&lt;24h)</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">A tiempo</span>
                  <span className="text-muted">Tardias</span>
                </div>
                <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-success h-full float-left"
                    style={{
                      width: `${cancellationStats.totalCancellations > 0
                        ? (cancellationStats.onTimeCancellations / cancellationStats.totalCancellations) * 100
                        : 50}%`,
                    }}
                  />
                  <div
                    className="bg-primary h-full float-left"
                    style={{
                      width: `${cancellationStats.totalCancellations > 0
                        ? (cancellationStats.lateCancellations / cancellationStats.totalCancellations) * 100
                        : 50}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tasa de ocupación */}
          <div className="bg-surface shadow rounded">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Ocupacion del Mes</h2>
            </div>
            <div className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">
                  {occupancyRate.occupancyRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted mt-2">
                  {occupancyRate.totalBookings} reservas de {occupancyRate.totalCapacity} lugares disponibles
                </p>
                <p className="text-xs text-muted mt-1">
                  en {occupancyRate.totalClasses} clases
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
