import Link from 'next/link'
import { getPlans, deletePlan } from '@/app/actions/plans'
import DeleteButton from '@/app/components/delete-button/DeleteButton'

export default async function PlansPage() {
  const plans = await getPlans()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Planes de Clases</h1>
        <Link
          href="/dashboard/plans/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Nuevo Plan
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {plans.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay planes creados aún
            </li>
          ) : (
            plans.map((plan) => (
              <li key={plan.id}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {plan.name}
                      </h3>
                      {!plan.is_active && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      ${plan.price.toFixed(2)} - {plan.duration || 'Sin duración especificada'}
                    </p>
                    {plan.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {plan.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      CBU/IBAN: {plan.cbu_iban}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/plans/${plan.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </Link>
                    <DeleteButton
                      action={deletePlan.bind(null, plan.id)}
                      confirmMessage="¿Estás seguro de que quieres eliminar este plan?"
                    />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

