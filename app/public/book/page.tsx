import { getAvailableClasses } from '@/app/actions/classes'
import { getActivePlans } from '@/app/actions/plans'
import Link from 'next/link'
import { formatDateTime24h } from '@/app/lib/utils'

export default async function PublicBookPage() {
  const classes = await getAvailableClasses()
  const plans = await getActivePlans()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reservar Clase</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Plan de Clases</h2>
          <p className="text-gray-600 mb-4">
            Para reservar una clase, primero debes tener un pago aprobado. Selecciona un plan y sube tu comprobante.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <Link
                key={plan.id}
                href={`/public/payment/upload?planId=${plan.id}`}
                className="border border-gray-300 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold text-indigo-600 mt-2">
                  ${plan.price.toFixed(2)}
                </p>
                {plan.description && (
                  <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Clases Disponibles</h2>
          {classes.length === 0 ? (
            <p className="text-gray-500">No hay clases disponibles en este momento</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {classes.map(classItem => (
                <li key={classItem.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDateTime24h(classItem.scheduled_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duración: {classItem.duration_minutes} min | Capacidad: {classItem.current_bookings}/{classItem.max_capacity}
                      </p>
                    </div>
                    <button
                      disabled={classItem.current_bookings >= classItem.max_capacity}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {classItem.current_bookings >= classItem.max_capacity
                        ? 'Llena'
                        : 'Reservar'}
                    </button>
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

