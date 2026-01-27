import { getStudentWithFrequency } from '@/app/actions/students'
import { getStudentCredits } from '@/app/actions/credits'
import { notFound } from 'next/navigation'
import CreditPaymentForm from '@/app/components/credit-payment-form/CreditPaymentForm'

export default async function NewStudentPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudentWithFrequency(id)

  if (!student) {
    notFound()
  }

  const credits = await getStudentCredits(id)

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Registrar Pago de {student.name}
      </h1>
      <div className="bg-surface shadow rounded p-6">
        <CreditPaymentForm
          studentId={student.id}
          studentName={student.name}
          frequency={student.frequency || null}
          currentCredits={credits.total}
        />
      </div>
    </div>
  )
}
