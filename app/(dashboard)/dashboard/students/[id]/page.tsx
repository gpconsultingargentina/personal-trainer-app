import { getStudentWithFrequency } from '@/app/actions/students'
import { getStudentCreditSummary, getCreditTransactions } from '@/app/actions/credits'
import { createClient } from '@/app/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddClassToStudent from '@/app/components/add-class-to-student/AddClassToStudent'
import StudentBookingsList from '@/app/components/student-bookings-list/StudentBookingsList'
import StudentCreditSummaryWrapper from '@/app/components/student-credit-summary/StudentCreditSummaryWrapper'
import InviteStudentButton from '@/app/components/invite-student/InviteStudentButton'

export default async function StudentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudentWithFrequency(id)

  if (!student) {
    notFound()
  }

  const supabase = await createClient()

  // Obtener reservas del estudiante
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      classes (*)
    `)
    .eq('student_id', id)
    .order('created_at', { ascending: false })

  // Obtener comprobantes del estudiante
  const { data: payments } = await supabase
    .from('payment_proofs')
    .select(`
      *,
      coupons (code, discount_type, discount_value),
      class_plans (name)
    `)
    .eq('student_id', id)
    .order('submitted_at', { ascending: false })

  // Obtener resumen de creditos y transacciones
  let creditSummary = null
  let creditTransactions: Awaited<ReturnType<typeof getCreditTransactions>> = []
  try {
    creditSummary = await getStudentCreditSummary(id)
    creditTransactions = await getCreditTransactions(id, 10)
  } catch {
    // Si falla, probablemente la tabla no existe todavia
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Historial de {student.name}
        </h1>
        <div className="flex space-x-3">
          <AddClassToStudent studentId={student.id} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Alumno</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.email}</dd>
            </div>
            {student.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefono</dt>
                <dd className="mt-1 text-sm text-gray-900">{student.phone}</dd>
              </div>
            )}
            {student.frequency && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Frecuencia</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {student.frequency.description} - ${student.frequency.price_per_class.toLocaleString('es-AR')}/clase
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 mb-2">Acceso al Portal</dt>
              <dd>
                <InviteStudentButton
                  studentId={student.id}
                  isRegistered={!!student.auth_user_id}
                />
              </dd>
            </div>
          </dl>
        </div>

        {creditSummary && (
          <StudentCreditSummaryWrapper
            studentId={id}
            summary={creditSummary}
            transactions={creditTransactions}
          />
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Clases Reservadas</h2>
          <StudentBookingsList bookings={bookings || []} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Historial de Pagos</h2>
          {!payments || payments.length === 0 ? (
            <p className="text-gray-500">No hay pagos registrados</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {payments.map((payment: any) => (
                <li key={payment.id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.classes_purchased
                          ? `${payment.classes_purchased} clases (${payment.frequency_code})`
                          : payment.class_plans?.name || payment.plan_name || 'Plan desconocido'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.submitted_at).toLocaleDateString('es-AR')}
                      </p>
                      {payment.classes_purchased && payment.price_per_class && (
                        <p className="text-xs text-gray-400">
                          ${payment.price_per_class.toLocaleString('es-AR')}/clase
                        </p>
                      )}
                      {payment.coupons && (
                        <p className="text-sm text-green-600">
                          Cupon: {payment.coupons.code}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${payment.final_price.toLocaleString('es-AR')}
                      </p>
                      <p
                        className={`text-xs ${
                          payment.status === 'approved'
                            ? 'text-green-600'
                            : payment.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {payment.status === 'approved'
                          ? 'Aprobado'
                          : payment.status === 'rejected'
                          ? 'Rechazado'
                          : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

