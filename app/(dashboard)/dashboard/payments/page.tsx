import Link from 'next/link'
import { getPaymentProofs, updatePaymentProofStatus } from '@/app/actions/payments'
import { getPlans } from '@/app/actions/plans'
import { getCoupons } from '@/app/actions/coupons'
import { getStudents } from '@/app/actions/students'

export default async function PaymentsPage() {
  const payments = await getPaymentProofs('pending')
  const plans = await getPlans()
  const coupons = await getCoupons()
  const students = await getStudents()

  const plansMap = new Map(plans.map(p => [p.id, p]))
  const couponsMap = new Map(coupons.map(c => [c.id, c]))
  const studentsMap = new Map(students.map(s => [s.id, s]))

  async function handleApprove(id: string) {
    'use server'
    await updatePaymentProofStatus(id, 'approved')
  }

  async function handleReject(id: string) {
    'use server'
    const reason = prompt('Motivo del rechazo (opcional):') || undefined
    await updatePaymentProofStatus(id, 'rejected', reason)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Comprobantes Pendientes</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay comprobantes pendientes
            </li>
          ) : (
            payments.map((payment) => {
              const plan = plansMap.get(payment.plan_id)
              const coupon = payment.coupon_id ? couponsMap.get(payment.coupon_id) : null
              const student = studentsMap.get(payment.student_id)

              return (
                <li key={payment.id}>
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {student?.name || 'Alumno desconocido'}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Email: {student?.email}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          Plan: {plan?.name || 'Plan no encontrado'}
                        </p>
                        <div className="mt-2 flex items-baseline space-x-4">
                          <span className="text-sm text-gray-500 line-through">
                            ${payment.original_price.toFixed(2)}
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            ${payment.final_price.toFixed(2)}
                          </span>
                          {payment.discount_applied > 0 && (
                            <span className="text-sm text-green-600">
                              Ahorro: ${payment.discount_applied.toFixed(2)}
                              {coupon && ` (${coupon.code})`}
                            </span>
                          )}
                        </div>
                        <div className="mt-4">
                          {(() => {
                            // Extraer el path del archivo de la URL completa
                            // La URL puede ser: https://xxx.supabase.co/storage/v1/object/public/payment-proofs/filename.pdf
                            // Necesitamos solo: filename.pdf
                            const urlParts = payment.file_url.split('/')
                            const fileName = urlParts[urlParts.length - 1]
                            return (
                              <a
                                href={`/api/payment-proof/view?path=${encodeURIComponent(fileName)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-900 text-sm"
                              >
                                Ver comprobante →
                              </a>
                            )
                          })()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <form action={handleApprove.bind(null, payment.id)}>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Aprobar
                          </button>
                        </form>
                        <form action={handleReject.bind(null, payment.id)}>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            Rechazar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}

