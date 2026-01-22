import { getStudents } from '@/app/actions/students'
import { getPlans } from '@/app/actions/plans'
import PaymentProofForm from '@/app/components/payment-proof-form/PaymentProofForm'

export default async function NewPaymentProofPage() {
  const students = await getStudents()
  const plans = await getPlans()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Subir Comprobante de Pago</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <PaymentProofForm students={students} plans={plans} />
      </div>
    </div>
  )
}

