import { getStudent } from '@/app/actions/students'
import { getPlans } from '@/app/actions/plans'
import { notFound } from 'next/navigation'
import StudentPaymentProofForm from '@/app/components/student-payment-proof-form/StudentPaymentProofForm'

export default async function NewStudentPaymentProofPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const student = await getStudent(id)
  const plans = await getPlans()

  if (!student) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Subir Comprobante para {student.name}
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <StudentPaymentProofForm studentId={student.id} studentName={student.name} plans={plans} />
      </div>
    </div>
  )
}

