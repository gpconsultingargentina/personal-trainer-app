'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPlan, updatePlan, type Plan } from '@/app/actions/plans'

interface PlanFormProps {
  plan?: Plan | null
}

export default function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      if (plan) {
        await updatePlan(plan.id, formData)
      } else {
        await createPlan(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el plan')
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
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre del Plan *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={plan?.name}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700"
        >
          Precio *
        </label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.01"
          min="0"
          required
          defaultValue={plan?.price}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="cbu_iban"
          className="block text-sm font-medium text-gray-700"
        >
          CBU/IBAN *
        </label>
        <input
          type="text"
          id="cbu_iban"
          name="cbu_iban"
          required
          defaultValue={plan?.cbu_iban}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="duration"
          className="block text-sm font-medium text-gray-700"
        >
          Duración
        </label>
        <input
          type="text"
          id="duration"
          name="duration"
          placeholder="Ej: 4 clases, 1 mes, etc."
          defaultValue={plan?.duration || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={plan?.description || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {plan && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={plan.is_active}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Plan activo</span>
          </label>
        </div>
      )}

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
          {loading ? 'Guardando...' : plan ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

