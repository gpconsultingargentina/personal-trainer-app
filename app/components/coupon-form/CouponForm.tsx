'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCoupon, updateCoupon, getCouponPlans, type Coupon } from '@/app/actions/coupons'
import { getActivePlans, type Plan } from '@/app/actions/plans'

interface CouponFormProps {
  coupon?: Coupon | null
}

export default function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [applicableTo, setApplicableTo] = useState<'all' | 'specific'>('all')

  useEffect(() => {
    async function loadPlans() {
      const activePlans = await getActivePlans()
      setPlans(activePlans)

      if (coupon) {
        const couponPlans = await getCouponPlans(coupon.id)
        setSelectedPlans(couponPlans)
        setApplicableTo(couponPlans.length > 0 ? 'specific' : 'all')
      }
    }
    loadPlans()
  }, [coupon])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append('applicable_to', applicableTo)
      
      if (applicableTo === 'specific') {
        selectedPlans.forEach(planId => {
          formData.append('plan_ids', planId)
        })
      }

      if (coupon) {
        await updateCoupon(coupon.id, formData)
      } else {
        await createCoupon(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el cupón')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Código *
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={coupon?.code}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
          placeholder="Dejar vacío para generar automáticamente"
        />
      </div>

      <div>
        <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">
          Tipo de Descuento *
        </label>
        <select
          id="discount_type"
          name="discount_type"
          required
          defaultValue={coupon?.discount_type || 'percentage'}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="percentage">Porcentaje (%)</option>
          <option value="fixed">Monto Fijo ($)</option>
        </select>
      </div>

      <div>
        <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">
          Valor del Descuento *
        </label>
        <input
          type="number"
          id="discount_value"
          name="discount_value"
          step="0.01"
          min="0"
          required
          defaultValue={coupon?.discount_value}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Fecha de Inicio
          </label>
          <input
            type="datetime-local"
            id="start_date"
            name="start_date"
            defaultValue={coupon?.start_date ? new Date(coupon.start_date).toISOString().slice(0, 16) : ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            Fecha de Fin
          </label>
          <input
            type="datetime-local"
            id="end_date"
            name="end_date"
            defaultValue={coupon?.end_date ? new Date(coupon.end_date).toISOString().slice(0, 16) : ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Aplicable a
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="applicable_to_radio"
              value="all"
              checked={applicableTo === 'all'}
              onChange={() => setApplicableTo('all')}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Todos los planes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="applicable_to_radio"
              value="specific"
              checked={applicableTo === 'specific'}
              onChange={() => setApplicableTo('specific')}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Planes específicos</span>
          </label>
        </div>

        {applicableTo === 'specific' && (
          <div className="mt-4 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-4">
            {plans.map(plan => (
              <label key={plan.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedPlans.includes(plan.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPlans([...selectedPlans, plan.id])
                    } else {
                      setSelectedPlans(selectedPlans.filter(id => id !== plan.id))
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {plan.name} - ${plan.price.toFixed(2)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={coupon?.description || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={coupon?.is_active ?? true}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700">Cupón activo</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : coupon ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

