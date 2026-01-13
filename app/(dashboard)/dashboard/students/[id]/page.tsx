import { getStudent } from '@/app/actions/students'
import { createClient } from '@/app/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddClassToStudent from '@/app/components/add-class-to-student/AddClassToStudent'
import StudentBookingsList from '@/app/components/student-bookings-list/StudentBookingsList'

export default async function StudentHistoryPage({
  params,
}: {
  params: { id: string }
}) {
  const student = await getStudent(params.id)

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
    .eq('student_id', params.id)
    .order('created_at', { ascending: false })

  // Obtener comprobantes del estudiante
  const { data: payments } = await supabase
    .from('payment_proofs')
    .select(`
      *,
      coupons (code, discount_type, discount_value),
      class_plans (name)
    `)
    .eq('student_id', params.id)
    .order('submitted_at', { ascending: false })

  // Calcular saldo de clases
  let saldoClases = 0
  if (bookings && bookings.length > 0) {
    // Clases programadas: booking.status = 'confirmed' AND class.status = 'scheduled'
    const clasesProgramadas = bookings.filter(
      (booking: any) =>
        booking.status === 'confirmed' &&
        booking.classes?.status === 'scheduled'
    ).length

    // Clases completadas: booking.status = 'completed' OR class.status = 'completed'
    const clasesCompletadas = bookings.filter(
      (booking: any) =>
        booking.status === 'completed' ||
        booking.classes?.status === 'completed'
    ).length

    // Clases canceladas: booking.status = 'cancelled' OR class.status = 'cancelled'
    const clasesCanceladas = bookings.filter(
      (booking: any) =>
        booking.status === 'cancelled' ||
        booking.classes?.status === 'cancelled'
    ).length

    saldoClases = clasesProgramadas - (clasesCompletadas + clasesCanceladas)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Historial de {student.name}
        </h1>
        <div className="flex space-x-3">
          <AddClassToStudent studentId={student.id} />
          <Link
            href={`/public/payment/upload?studentId=${student.id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Subir Comprobante
          </Link>
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
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900">{student.phone}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Clases Reservadas</h2>
          <StudentBookingsList bookings={bookings || []} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-lg font-semibold text-gray-900">
            Saldo Clases: <span className={saldoClases < 0 ? 'text-red-600' : 'text-gray-900'}>{saldoClases}</span>
          </p>
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
                        {payment.class_plans?.name || 'Plan desconocido'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.submitted_at).toLocaleDateString('es-ES')}
                      </p>
                      {payment.coupons && (
                        <p className="text-sm text-green-600">
                          Cupón: {payment.coupons.code}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${payment.final_price.toFixed(2)}
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

