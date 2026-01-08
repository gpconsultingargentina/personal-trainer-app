import PlanForm from '@/app/components/plan-form/PlanForm'

export default function NewPlanPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nuevo Plan</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <PlanForm />
      </div>
    </div>
  )
}

