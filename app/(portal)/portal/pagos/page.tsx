import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentByAuthUserId } from '@/app/actions/students'
import { getStudentPayments } from '@/app/actions/payments'
import { getFrequencies } from '@/app/actions/frequencies'
import StudentPaymentForm from './StudentPaymentForm'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function PagosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const student = await getStudentByAuthUserId(user.id)

  if (!student) {
    redirect('/login')
  }

  const [payments, frequencies] = await Promise.all([
    getStudentPayments(student.id),
    getFrequencies(),
  ])

  // Determinar el precio por clase del estudiante
  const studentFrequency = student.frequency
  const pricePerClass = studentFrequency?.price_per_class || frequencies[0]?.price_per_class || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
        <p className="mt-1 text-gray-600">Cargar creditos y ver historial</p>
      </div>

      {/* Formulario de pago */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cargar Creditos</h2>

        <StudentPaymentForm
          studentId={student.id}
          pricePerClass={pricePerClass}
          frequencyCode={studentFrequency?.frequency_code || '1x'}
        />
      </div>

      {/* Historial de pagos */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Historial de Pagos</h2>
        </div>

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div key={payment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.classes_purchased} clases
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(payment.submitted_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(payment.final_price)}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                      {statusLabels[payment.status]}
                    </span>
                  </div>
                </div>
                {payment.status === 'rejected' && payment.rejection_reason && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-sm text-red-800">
                      Motivo: {payment.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
