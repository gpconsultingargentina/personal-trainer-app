import Link from 'next/link'
import { getCoupons, deleteCoupon } from '@/app/actions/coupons'
import DeleteButton from '@/app/components/delete-button/DeleteButton'

export default async function CouponsPage() {
  const coupons = await getCoupons()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cupones de Descuento</h1>
        <Link
          href="/dashboard/coupons/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Nuevo Cupón
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {coupons.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay cupones creados aún
            </li>
          ) : (
            coupons.map((coupon) => {
              const now = new Date()
              const isExpired = coupon.end_date && new Date(coupon.end_date) < now
              const isNotStarted = coupon.start_date && new Date(coupon.start_date) > now

              return (
                <li key={coupon.id}>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {coupon.code}
                        </h3>
                        {!coupon.is_active && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                        {isExpired && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Expirado
                          </span>
                        )}
                        {isNotStarted && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            No iniciado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}% de descuento`
                          : `$${coupon.discount_value.toFixed(2)} de descuento`}
                      </p>
                      {coupon.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {coupon.description}
                        </p>
                      )}
                      {(coupon.start_date || coupon.end_date) && (
                        <p className="mt-1 text-xs text-gray-400">
                          {coupon.start_date &&
                            `Desde: ${new Date(coupon.start_date).toLocaleDateString()}`}
                          {coupon.start_date && coupon.end_date && ' - '}
                          {coupon.end_date &&
                            `Hasta: ${new Date(coupon.end_date).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/coupons/${coupon.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        action={deleteCoupon.bind(null, coupon.id)}
                        confirmMessage="¿Estás seguro de que quieres eliminar este cupón?"
                      />
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

