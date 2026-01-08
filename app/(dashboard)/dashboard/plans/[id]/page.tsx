import { getPlan } from '@/app/actions/plans'
import PlanForm from '@/app/components/plan-form/PlanForm'
import { notFound } from 'next/navigation'

export default async function EditPlanPage({
  params,
}: {
  params: { id: string }
}) {
  const plan = await getPlan(params.id)

  if (!plan) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Editar Plan</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <PlanForm plan={plan} />
      </div>
    </div>
  )
}

