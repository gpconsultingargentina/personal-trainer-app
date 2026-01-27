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
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-gray-600">Resumen financiero, de alumnos y operativo</p>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Facturacion mes</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(summary.currentMonthRevenue)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Pagos pendientes</p>
          <p className="text-xl font-bold text-yellow-600">{summary.pendingPaymentsCount}</p>
          <p className="text-xs text-gray-400">{formatCurrency(summary.pendingPaymentsAmount)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Creditos x vencer</p>
          <p className="text-xl font-bold text-orange-600">{summary.expiringCreditsCount}</p>
          <p className="text-xs text-gray-400">proximos 7 dias</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Alumnos inactivos</p>
          <p className="text-xl font-bold text-red-600">{summary.inactiveStudentsCount}</p>
          <p className="text-xs text-gray-400">+30 dias sin clase</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Clases semana</p>
          <p className="text-xl font-bold text-blue-600">{summary.weeklyClassesCount}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Ocupacion mes</p>
          <p className="text-xl font-bold text-indigo-600">{occupancyRate.occupancyRate.toFixed(0)}%</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Cancel. tardias</p>
          <p className="text-xl font-bold text-purple-600">{cancellationStats.lateCancellations}</p>
          <p className="text-xs text-gray-400">{cancellationStats.lateCancellationRate.toFixed(0)}% del total</p>
        </div>
      </div>

      {/* Grid de 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Financiero */}
        <div className="space-y-6">
          {/* Comparativa mensual */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Facturacion (6 meses)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {revenueComparison.map((r) => (
                  <div key={`${r.year}-${r.month}`} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-16">
                      {monthNames[r.month - 1]} {r.year % 100}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{ width: `${(r.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      {formatCurrency(r.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagos pendientes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Pagos Pendientes</h2>
            </div>
            {pendingPayments.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No hay pagos pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingPayments.slice(0, 5).map((p) => (
                  <div key={p.id} className="px-6 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.studentName}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.submittedAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(p.finalPrice)}
                    </span>
                  </div>
                ))}
                {pendingPayments.length > 5 && (
                  <div className="px-6 py-3">
                    <Link href="/dashboard/payments" className="text-sm text-indigo-600 hover:text-indigo-800">
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Creditos por Vencer (7 dias)</h2>
            </div>
            {expiringCredits.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No hay creditos por vencer</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {expiringCredits.slice(0, 5).map((c) => (
                  <div key={c.studentId} className="px-6 py-3 flex justify-between items-center">
                    <div>
                      <Link
                        href={`/dashboard/students/${c.studentId}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {c.studentName}
                      </Link>
                      <p className="text-xs text-gray-500">{c.creditsRemaining} creditos</p>
                    </div>
                    <span className={`text-sm font-medium ${
                      c.daysUntilExpiration <= 3 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {c.daysUntilExpiration} dias
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alumnos inactivos */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Alumnos Inactivos (+30 dias)</h2>
            </div>
            {inactiveStudents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">Todos los alumnos estan activos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {inactiveStudents.slice(0, 5).map((s) => (
                  <div key={s.id} className="px-6 py-3 flex justify-between items-center">
                    <div>
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {s.lastClassDate ? `Ultima: ${formatDate(s.lastClassDate)}` : 'Sin clases'}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      {s.daysSinceLastClass === 999 ? 'Nunca' : `${s.daysSinceLastClass}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking de asistencia */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Top Asistencia</h2>
            </div>
            {attendanceRanking.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No hay datos de asistencia</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {attendanceRanking.map((r, index) => (
                  <div key={r.studentId} className="px-6 py-3 flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{r.studentName}</p>
                      <p className="text-xs text-gray-500">
                        {r.totalCompleted} asistencias, {r.totalCancelled} canceladas
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Agenda de la Semana</h2>
            </div>
            {weeklySchedule.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No hay clases esta semana</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {weeklySchedule.map((c) => (
                  <div key={c.id} className="px-6 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(c.scheduledAt)}
                        </p>
                        <p className="text-xs text-gray-500">
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
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Cancelaciones del Mes</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{cancellationStats.totalCancellations}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">{cancellationStats.lateCancellations}</p>
                  <p className="text-sm text-gray-500">Tardias (&lt;24h)</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">A tiempo</span>
                  <span className="text-gray-500">Tardias</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-full float-left"
                    style={{
                      width: `${cancellationStats.totalCancellations > 0
                        ? (cancellationStats.onTimeCancellations / cancellationStats.totalCancellations) * 100
                        : 50}%`,
                    }}
                  />
                  <div
                    className="bg-purple-500 h-full float-left"
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Ocupacion del Mes</h2>
            </div>
            <div className="p-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-indigo-600">
                  {occupancyRate.occupancyRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {occupancyRate.totalBookings} reservas de {occupancyRate.totalCapacity} lugares disponibles
                </p>
                <p className="text-xs text-gray-400 mt-1">
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
