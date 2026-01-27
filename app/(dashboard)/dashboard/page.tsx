import { createClient } from '@/app/lib/supabase/server'
import PriceManagementModal from '@/app/components/price-management-modal/PriceManagementModal'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Obtener estadísticas básicas
  const [classesResult, paymentsResult, studentsResult] = await Promise.all([
    supabase
      .from('classes')
      .select('id', { count: 'exact' })
      .eq('status', 'scheduled'),
    supabase
      .from('payment_proofs')
      .select('id', { count: 'exact' })
      .eq('status', 'pending'),
    supabase.from('students').select('id', { count: 'exact' }),
  ])

  const classesCount = classesResult.count || 0
  const pendingPaymentsCount = paymentsResult.count || 0
  const studentsCount = studentsResult.count || 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-surface overflow-hidden shadow rounded">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    Clases Programadas
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {classesCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface overflow-hidden shadow rounded">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    Pagos Pendientes
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {pendingPaymentsCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface overflow-hidden shadow rounded">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    Total Alumnos
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {studentsCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-foreground mb-4">Configuración</h2>
        <div className="bg-surface p-4 rounded shadow">
          <PriceManagementModal />
        </div>
      </div>
    </div>
  )
}
