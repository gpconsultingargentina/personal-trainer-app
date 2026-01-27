import { getPaymentProofs, updatePaymentProofStatus } from '@/app/actions/payments'
import { getStudents } from '@/app/actions/students'

export default async function PaymentsPage() {
  const payments = await getPaymentProofs('pending')
  const students = await getStudents()

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
      <h1 className="text-3xl font-bold text-foreground mb-6">Comprobantes Pendientes</h1>

      <div className="bg-surface shadow overflow-hidden rounded">
        <ul className="divide-y divide-border">
          {payments.length === 0 ? (
            <li className="px-6 py-4 text-center text-muted">
              No hay comprobantes pendientes
            </li>
          ) : (
            payments.map((payment) => {
              const student = studentsMap.get(payment.student_id)

              return (
                <li key={payment.id}>
                  <div className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-foreground">
                            {student?.name || 'Alumno desconocido'}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          Email: {student?.email}
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          Plan: {payment.plan_name || 'Sin plan'}
                        </p>
                        <div className="mt-2 flex items-baseline space-x-4">
                          {payment.discount_applied > 0 && (
                            <span className="text-sm text-muted line-through">
                              ${payment.original_price.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xl font-bold text-success">
                            ${payment.final_price.toFixed(2)}
                          </span>
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
                                className="text-primary hover:text-accent text-sm"
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
                            className="px-4 py-2 bg-success text-background rounded hover:bg-success/80 text-sm"
                          >
                            Aprobar
                          </button>
                        </form>
                        <form action={handleReject.bind(null, payment.id)}>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-error text-white rounded hover:bg-error/80 text-sm"
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
